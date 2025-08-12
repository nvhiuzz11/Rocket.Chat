import { Box, CheckBox, Icon, Button, TextInput } from '@rocket.chat/fuselage';
import { useEndpoint, useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { useState, useEffect, useCallback } from 'react';
import type { ReactElement } from 'react';

import type { ITask } from '../../../../../../server/core-typings/ITask';

type SubtaskListProps = {
	taskId: string;
	subtasks?: ITask[];
	onReload?: () => void;
};

const SubtaskList = ({ taskId, subtasks: initialSubtasks = [], onReload }: SubtaskListProps): ReactElement => {
	const [subtasks, setSubtasks] = useState<ITask[]>(initialSubtasks);
	const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
	const [editingId, setEditingId] = useState<string | null>(null);
	const [editingTitle, setEditingTitle] = useState('');
	const [isLoading, setIsLoading] = useState(false);
	const [loadingStates, setLoadingStates] = useState<{ [key: string]: boolean }>({});
	const [draggedTag, setDraggedTag] = useState<string | null>(null);
	const [hoveredTag, setHoveredTag] = useState<string | null>(null);

	const dispatchToastMessage = useToastMessageDispatch();
	const createSubtaskEndpoint = useEndpoint('POST', '/v1/subtasks.create');
	const updateCompletedEndpoint = useEndpoint('POST', '/v1/subtasks.updateCompleted');
	const updateTitleEndpoint = useEndpoint('POST', '/v1/subtasks.updateTitle');
	const deleteSubtaskEndpoint = useEndpoint('POST', '/v1/subtasks.delete');
	const getSubtasksEndpoint = useEndpoint('GET', '/v1/subtasks.getByTask');

	useEffect(() => {
		setSubtasks(initialSubtasks);
	}, [initialSubtasks]);

	const loadSubtasks = useCallback(async () => {
		try {
			const { subtasks: fetchedSubtasks } = await getSubtasksEndpoint({ taskId });
			const parsedSubtasks = fetchedSubtasks.map((s: any) => ({
				...s,
				createdAt: new Date(s.createdAt),
				_updatedAt: new Date(s._updatedAt),
				dueDate: s.dueDate ? new Date(s.dueDate) : undefined,
			})) as ITask[];
			setSubtasks(parsedSubtasks);
		} catch (error) {
			console.error('Failed to load subtasks:', error);
		}
	}, [taskId, getSubtasksEndpoint]);

	const handleCreateSubtask = async () => {
		if (!newSubtaskTitle.trim()) return;

		setIsLoading(true);
		try {
			const { subtask } = await createSubtaskEndpoint({ taskId, title: newSubtaskTitle.trim() });
			const parsedSubtask = {
				...subtask,
				createdAt: new Date(subtask.createdAt),
				_updatedAt: new Date(subtask._updatedAt),
				dueDate: subtask.dueDate ? new Date(subtask.dueDate) : undefined,
			} as ITask;
			setSubtasks([...subtasks, parsedSubtask]);
			setNewSubtaskTitle('');
			onReload?.();
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: 'Failed to create subtask' });
		} finally {
			setIsLoading(false);
		}
	};

	const handleToggleComplete = async (subtask: ITask) => {
		setLoadingStates({ ...loadingStates, [subtask._id]: true });
		try {
			const isCompleted = subtask.isComplete || false;
			await updateCompletedEndpoint({ _id: subtask._id, completed: !isCompleted });
			setSubtasks(subtasks.map((s) => (s._id === subtask._id ? { ...s, isComplete: !isCompleted } : s)));
			onReload?.();
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: 'Failed to update subtask' });
		} finally {
			setLoadingStates({ ...loadingStates, [subtask._id]: false });
		}
	};

	const handleStartEdit = (subtask: ITask) => {
		setEditingId(subtask._id);
		setEditingTitle(subtask.title);
	};

	const handleSaveEdit = async () => {
		if (!editingTitle.trim() || !editingId) return;

		setLoadingStates({ ...loadingStates, [editingId]: true });
		try {
			await updateTitleEndpoint({ _id: editingId, title: editingTitle.trim() });
			setSubtasks(subtasks.map((s) => (s._id === editingId ? { ...s, title: editingTitle.trim() } : s)));
			setEditingId(null);
			setEditingTitle('');
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: 'Failed to update subtask title' });
		} finally {
			setLoadingStates({ ...loadingStates, [editingId]: false });
		}
	};

	const handleCancelEdit = () => {
		setEditingId(null);
		setEditingTitle('');
	};

	const handleDelete = async (subtaskId: string) => {
		setLoadingStates({ ...loadingStates, [subtaskId]: true });
		try {
			await deleteSubtaskEndpoint({ _id: subtaskId });
			setSubtasks(subtasks.filter((s) => s._id !== subtaskId));
			onReload?.();
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: 'Failed to delete subtask' });
		} finally {
			setLoadingStates({ ...loadingStates, [subtaskId]: false });
		}
	};

	const handleDragStart = (e: React.DragEvent, index: number) => {
		const subtask = subtasks[index];
		setDraggedTag(subtask._id);
		e.dataTransfer.effectAllowed = 'move';
		e.dataTransfer.setData('text/plain', index.toString());
	};

	const handleDragOver = (e: React.DragEvent) => {
		e.preventDefault();
		e.dataTransfer.dropEffect = 'move';
	};

	const handleDrop = async (e: React.DragEvent, dropIndex: number) => {
		e.preventDefault();
		const dragIndex = parseInt(e.dataTransfer.getData('text/plain'));

		if (dragIndex === dropIndex) return;

		const reorderedSubtasks = [...subtasks];
		const [draggedItem] = reorderedSubtasks.splice(dragIndex, 1);
		reorderedSubtasks.splice(dropIndex, 0, draggedItem);

		setSubtasks(reorderedSubtasks);
		setDraggedTag(null);
		setHoveredTag(null);
	};

	const completedCount = subtasks.filter((s) => s.isComplete).length;
	const totalCount = subtasks.length;

	return (
		<Box>
			{/* Header */}
			<Box display='flex' alignItems='center' justifyContent='space-between' mb='x16'>
				<Box fontSize='p1' fontWeight='600' color='font-titles-labels'>
					Subtasks
				</Box>
				{totalCount > 0 && (
					<Box
						fontSize='c2'
						color='font-secondary-info'
						bg='surface-neutral'
						borderRadius='x2'
						paddingInline='x6'
						paddingBlock='x2'
						fontWeight='500'
					>
						{completedCount}/{totalCount}
					</Box>
				)}
			</Box>

			{/* Add new subtask */}
			<Box
				display='flex'
				alignItems='center'
				p='x8'
				mb='x12'
				borderRadius='x4'
				bg='surface-tint'
				border='1px solid'
				borderColor='stroke-extra-light'
				style={{
					transition: 'all 0.15s ease',
				}}
			>
				<Icon name='plus' size='x16' color='font-secondary-info' marginInlineEnd='x8' />
				<Box width='x4' />
				<TextInput
					value={newSubtaskTitle}
					onChange={(e) => setNewSubtaskTitle((e.target as HTMLInputElement).value)}
					placeholder='Add a subtask and press Enter...'
					onKeyDown={(e) => {
						if (e.key === 'Enter') handleCreateSubtask();
					}}
					disabled={isLoading}
					flexGrow={1}
					border='none'
					bg='transparent'
					fontSize='p2'
					fontWeight='400'
					color='font-default'
					style={{
						outline: 'none',
					}}
				/>
			</Box>

			{/* Subtask list */}
			<Box>
				{subtasks.map((subtask, index) => (
					<Box
						key={subtask._id}
						display='flex'
						alignItems='center'
						p='x8'
						mb='x4'
						borderRadius='x2'
						bg={subtask.isComplete ? 'surface-light' : 'surface-light'}
						draggable
						onDragStart={(e) => handleDragStart(e, index)}
						onDragOver={handleDragOver}
						onDrop={(e) => handleDrop(e, index)}
						onMouseEnter={() => setHoveredTag(subtask._id)}
						onMouseLeave={() => setHoveredTag(null)}
						style={{
							cursor: draggedTag === subtask._id ? 'grabbing' : 'grab',
							opacity: draggedTag === subtask._id ? 0.6 : 1,
							transform:
								draggedTag === subtask._id
									? 'rotate(0.5deg) scale(1.05)'
									: hoveredTag === subtask._id
										? 'rotate(0.2deg) scale(1.01)'
										: 'none',
							transition: 'all 0.2s ease',
							boxShadow:
								draggedTag === subtask._id
									? '0 4px 12px rgba(0, 0, 0, 0.15)'
									: hoveredTag === subtask._id
										? '0 2px 6px rgba(0, 0, 0, 0.08)'
										: 'none',
						}}
					>
						{/* Drag handle */}
						<Icon name='menu' size='x12' color='font-hint' cursor='move' marginInlineEnd='x8' />

						{/* Main content area */}
						<Box display='flex' alignItems='center' flexGrow={1}>
							{/* Checkbox */}
							<CheckBox
								checked={subtask.isComplete || false}
								onChange={() => handleToggleComplete(subtask)}
								disabled={loadingStates[subtask._id]}
								marginInlineEnd='x8'
							/>

							{/* Content */}
							{editingId === subtask._id ? (
								<Box display='flex' alignItems='center' flexGrow={1} marginInlineStart='x8'>
									<TextInput
										value={editingTitle}
										onChange={(e) => setEditingTitle((e.target as HTMLInputElement).value)}
										onKeyDown={(e) => {
											if (e.key === 'Enter') handleSaveEdit();
											if (e.key === 'Escape') handleCancelEdit();
										}}
										flexGrow={1}
										marginInlineEnd='x8'
									/>
								</Box>
							) : (
								<Box
									onClick={() => handleStartEdit(subtask)}
									fontWeight='500'
									color='font-default'
									maxWidth='300px'
									width='100%'
									style={{
										textDecoration: subtask.isComplete ? 'line-through' : 'none',
										opacity: subtask.isComplete ? 0.6 : 1,
										cursor: 'text',
										wordBreak: 'break-word',
										whiteSpace: 'pre-wrap',
										overflow: 'hidden',
										textOverflow: 'ellipsis',
									}}
									marginInlineStart='x8'
								>
									{subtask.title}
								</Box>
							)}
						</Box>

						{/* Actions */}
						<Box display='flex' alignItems='center'>
							{editingId === subtask._id ? (
								<>
									<Button
										square
										tiny
										primary
										onClick={handleSaveEdit}
										title='Save changes'
										marginInlineEnd='x4'
										disabled={!editingTitle.trim()}
									>
										<Icon name='check' size='x16' />
									</Button>
									<Button square tiny onClick={handleCancelEdit} title='Cancel editing'>
										<Icon name='cross' size='x16' />
									</Button>
								</>
							) : (
								<Button square tiny danger onClick={() => handleDelete(subtask._id)} title='Delete subtask'>
									<Icon name='trash' size='x16' />
								</Button>
							)}
						</Box>
					</Box>
				))}
			</Box>

			{/* Empty state */}
			{subtasks.length === 0 && (
				<Box display='flex' flexDirection='column' alignItems='center' paddingBlock='x32' color='font-secondary-info' textAlign='center'>
					<Icon name='list' size='x32' color='font-secondary-info' mb='x8' />
					<Box fontSize='p2' fontWeight='500' mb='x4'>
						No subtasks yet
					</Box>
					<Box fontSize='c2' color='font-hint'>
						Break down this task into smaller steps above
					</Box>
				</Box>
			)}
		</Box>
	);
};

export default SubtaskList;
