import {
	Modal,
	Button,
	TextInput,
	Field,
	FieldGroup,
	FieldLabel,
	FieldRow,
	FieldError,
	Box,
	Palette,
	InputBox,
	Icon,
} from '@rocket.chat/fuselage';
import { UserAvatar } from '@rocket.chat/ui-avatar';
import { useEndpoint, useToastMessageDispatch, useTranslation } from '@rocket.chat/ui-contexts';
import { useState, useMemo, useEffect } from 'react';
import type { ReactElement } from 'react';
import { Controller, useForm } from 'react-hook-form';

import SubtaskPanel from './SubtaskPanel';
import { TASK_PROPERTY_TYPES } from '../../../../../../definition/project';
import type { ISubtask } from '../../../../../../server/core-typings/ISubtask';
import type { ITask } from '../../../../../../server/core-typings/ITask';
import type { ITaskProperty } from '../../../../../../server/core-typings/ITaskProperty';
import type { ITaskTag } from '../../../../../../server/core-typings/ITaskTag';
import { PropertyInput } from '../../../../../components/PropertyProject/PropertyInput';
import PropertySettingsPanel from '../../../../../components/PropertyProject/PropertySettingsPanel';
import UserAutoCompleteWithObjectsRoom from '../../../../../components/UserAutoCompleteMultiple/UserAutoCompleteWithObjectsRoom';

type TaskDetailModalProps = {
	onClose: () => void;
	originalTaskProperties: (ITaskProperty & { value: ITaskTag[] })[];
	reload: () => void;
	task: ITask;
	roomId: string;
};

type UpdateTaskPayload = {
	title: string;
	description: string;
	assignees: ITask['assignees'];
	properties: Array<{ taskPropertyId: string; value: string[] }>;
	dueDate?: string;
};

const TaskDetailModal = ({ onClose, task, originalTaskProperties, reload, roomId }: TaskDetailModalProps): ReactElement => {
	const t = useTranslation();
	const [isLoading, setIsLoading] = useState(false);
	const [selectedProperty, setSelectedProperty] = useState<(ITaskProperty & { value: ITaskTag[] }) | null>(null);
	const [taskProperties, setTaskProperties] = useState<(ITaskProperty & { value: ITaskTag[] })[]>(originalTaskProperties);
	const taskPropertiesEndpoint = useEndpoint('GET', '/v1/task-properties.list');
	const [isPropertySettingsOpen, setIsPropertySettingsOpen] = useState(false);
	const [isNewProperty, setIsNewProperty] = useState(false);
	const [isSubtaskPanelOpen, setIsSubtaskPanelOpen] = useState(false);
	const [subtasks, setSubtasks] = useState<ISubtask[]>([]);
	const [isLoadingSubtasks, setIsLoadingSubtasks] = useState(false);
	const dispatchToastMessage = useToastMessageDispatch();
	const updateTaskEndpoint = useEndpoint('POST', '/v1/tasks.update');
	const getSubtasksEndpoint = useEndpoint('GET', '/v1/subtasks.getByTask');

	const reloadTaskProperties = async () => {
		const { taskProperties = [] } = await taskPropertiesEndpoint({ projectId: task.projectId });
		setTaskProperties(taskProperties);

		// Update selectedProperty if it's currently open
		if (selectedProperty && !isNewProperty) {
			const updatedProperty = taskProperties.find((p: any) => p._id === selectedProperty._id);
			if (updatedProperty) {
				setSelectedProperty(updatedProperty);
			}
		}

		reload();
	};

	const loadSubtasks = async () => {
		try {
			setIsLoadingSubtasks(true);
			const { subtasks: fetchedSubtasks } = await getSubtasksEndpoint({ taskId: task._id });
			const parsedSubtasks = fetchedSubtasks.map((s: any) => ({
				...s,
				createdAt: new Date(s.createdAt),
				_updatedAt: new Date(s._updatedAt),
			}));
			setSubtasks(parsedSubtasks);
		} catch (error) {
			console.error('Failed to load subtasks:', error);
		} finally {
			setIsLoadingSubtasks(false);
		}
	};

	useEffect(() => {
		loadSubtasks();
	}, [task._id]);

	const [taskPropertySelected, setTaskPropertySelected] = useState<Array<{ taskPropertyId: string; value: string[] }>>(
		() => task.properties || [],
	);

	const formatDateForInput = (date: Date | string | undefined): string => {
		if (!date) {
			return '';
		}
		const d = new Date(date);
		const year = d.getFullYear();
		const month = String(d.getMonth() + 1).padStart(2, '0');
		const day = String(d.getDate()).padStart(2, '0');
		return `${year}-${month}-${day}`;
	};

	const {
		register,
		handleSubmit,
		control,
		formState: { errors, isDirty },
	} = useForm<UpdateTaskPayload>({
		defaultValues: {
			title: task.title,
			description: task.description,
			assignees: task.assignees,
			dueDate: task.dueDate ? formatDateForInput(task.dueDate) : '',
		},
	});

	const propertiesAreDirty = useMemo(() => {
		return JSON.stringify(task.properties) !== JSON.stringify(taskPropertySelected);
	}, [task.properties, taskPropertySelected]);

	const hasChanges = isDirty || propertiesAreDirty;

	const handlePropertyChange = (propertyId: string, newValue: string | string[]) => {
		setTaskPropertySelected((prev) => {
			const valueArray = Array.isArray(newValue) ? newValue : [newValue];
			const existingIndex = prev.findIndex((item) => item.taskPropertyId === propertyId);

			if (existingIndex >= 0) {
				const updated = [...prev];
				updated[existingIndex] = { taskPropertyId: propertyId, value: valueArray };
				return updated;
			}
			return [...prev, { taskPropertyId: propertyId, value: valueArray }];
		});
	};

	const getPropertyValue = (propertyId: string, propertyType: string) => {
		const selectedProperty = taskPropertySelected.find((p) => p.taskPropertyId === propertyId);
		if (!selectedProperty) {
			return propertyType === TASK_PROPERTY_TYPES.MULTI_SELECT ? [] : '';
		}
		return propertyType === TASK_PROPERTY_TYPES.MULTI_SELECT ? selectedProperty.value : selectedProperty.value[0] || '';
	};

	const handleOpenPropertySettings = (property: ITaskProperty & { value: ITaskTag[] }) => {
		setSelectedProperty(property);
		setIsNewProperty(false);
		setIsPropertySettingsOpen(true);
		setIsSubtaskPanelOpen(false); // Close subtask panel if open
	};

	const handleAddNewProperty = () => {
		setSelectedProperty({
			_id: '',
			name: '',
			type: TASK_PROPERTY_TYPES.SELECT,
			projectId: task.projectId,
			order: 0,
			required: false,
			value: [],
		} as ITaskProperty & { value: ITaskTag[] });
		setIsNewProperty(true);
		setIsPropertySettingsOpen(true);
		setIsSubtaskPanelOpen(false); // Close subtask panel if open
	};

	const handleClosePropertySettings = () => {
		setIsPropertySettingsOpen(false);
		setSelectedProperty(null);
		setIsNewProperty(false);
	};

	const handleOpenSubtaskPanel = () => {
		setIsSubtaskPanelOpen(true);
		setIsPropertySettingsOpen(false);
		setSelectedProperty(null); // Clear property selection
		setIsNewProperty(false);
	};

	const handleCloseSubtaskPanel = () => {
		setIsSubtaskPanelOpen(false);
	};

	const handleUpdateTask = async (data: UpdateTaskPayload) => {
		setIsLoading(true);
		try {
			await updateTaskEndpoint({
				_id: task._id,
				payload: {
					...data,
					dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
					properties: taskPropertySelected,
				},
			});
			dispatchToastMessage({ type: 'success', message: 'Task updated successfully' });
			reload();
			onClose();
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<Modal {...(isPropertySettingsOpen || isSubtaskPanelOpen ? { width: 'x1200', maxWidth: '90vw' } : {})}>
			<Modal.Header>
				<Modal.Title>Task Details</Modal.Title>
				<Modal.Close onClick={onClose} />
			</Modal.Header>
			{isPropertySettingsOpen || isSubtaskPanelOpen ? (
				<Box display='flex' height='600px'>
					<Modal.Content width='39rem' overflow='auto'>
						<FieldGroup>
							<Field>
								<FieldLabel>Name*</FieldLabel>
								<FieldRow>
									<TextInput {...register('title', { required: true })} />
								</FieldRow>
								{errors.title && <FieldError>Title is required</FieldError>}
							</Field>

							<Field>
								<FieldLabel>Description</FieldLabel>
								<FieldRow>
									<TextInput {...register('description')} />
								</FieldRow>
							</Field>

							<Field>
								<FieldLabel>Assignees</FieldLabel>
								<Controller
									control={control}
									name='assignees'
									defaultValue={[]}
									render={({ field: { onChange, value } }): ReactElement => (
										<UserAutoCompleteWithObjectsRoom value={value} onChange={onChange} roomId={roomId} />
									)}
								/>
							</Field>

							<Field>
								<FieldLabel>Due Date</FieldLabel>
								<FieldRow>
									<InputBox type='date' {...register('dueDate')} />
								</FieldRow>
							</Field>

							{taskProperties?.map((property) => (
								<Field key={property._id}>
									<Box display='flex' alignItems='center' justifyContent='space-between' mb='x4'>
										<FieldLabel>
											{property.name}
											{property.required && '*'}
										</FieldLabel>
										<Button
											square
											small
											onClick={() => handleOpenPropertySettings(property as ITaskProperty & { value: ITaskTag[] })}
											title='Property Settings'
										>
											<Icon name='customize' size='x16' />
										</Button>
									</Box>
									<FieldRow>
										<PropertyInput
											property={property}
											value={getPropertyValue(property._id, property.type)}
											onChange={(value) => handlePropertyChange(property._id, value)}
										/>
									</FieldRow>
								</Field>
							))}

							<Button onClick={handleAddNewProperty} display='flex' alignItems='center'>
								<Icon name='plus' size='x16' mie='x4' />
								Add Property
							</Button>

							<Field>
								<Box display='flex' alignItems='center' justifyContent='space-between' mb='x4'>
									<FieldLabel>Subtasks</FieldLabel>
									<Button square small onClick={handleOpenSubtaskPanel} title='Manage Subtasks'>
										<Icon name='list' size='x16' />
									</Button>
								</Box>
								<Box color='hint' fontSize='x12'>
									{subtasks.length} subtasks ({subtasks.filter((s) => s.completed).length} completed)
								</Box>
							</Field>

							<Field>
								<FieldLabel>Created By</FieldLabel>
								<FieldRow>
									<Box
										display='flex'
										alignItems='center'
										w='full'
										p='x8'
										backgroundColor={Palette.surface['surface-tint']}
										borderColor='#404754'
										borderWidth='x1'
										borderRadius='x4'
										color={Palette.text['font-hint']}
									>
										<UserAvatar size='x24' username={task.createdBy.username} />
										<Box is='span' mi='x8' withTruncatedText>
											{task.createdBy.username}
										</Box>
									</Box>
								</FieldRow>
							</Field>

							<Field>
								<FieldLabel>Created At</FieldLabel>
								<FieldRow>
									<TextInput value={new Date(task.createdAt).toLocaleString()} disabled />
								</FieldRow>
							</Field>
						</FieldGroup>
					</Modal.Content>

					{selectedProperty && !isSubtaskPanelOpen && (
						<Box flexGrow={1} flexShrink={0} borderInlineStart='x1' borderColor='stroke-extra-light' overflow='auto' mi='x16'>
							<PropertySettingsPanel
								onClose={handleClosePropertySettings}
								property={selectedProperty}
								projectId={task.projectId}
								reload={reloadTaskProperties}
								isNewProperty={isNewProperty}
							/>
						</Box>
					)}
					{isSubtaskPanelOpen && !selectedProperty && (
						<SubtaskPanel
							taskId={task._id}
							subtasks={subtasks}
							isLoading={isLoadingSubtasks}
							onClose={handleCloseSubtaskPanel}
							onReload={() => {
								loadSubtasks();
								reload();
							}}
						/>
					)}
				</Box>
			) : (
				<Modal.Content>
					<FieldGroup>
						<Field>
							<FieldLabel>Name*</FieldLabel>
							<FieldRow>
								<TextInput {...register('title', { required: true })} />
							</FieldRow>
							{errors.title && <FieldError>Title is required</FieldError>}
						</Field>

						<Field>
							<FieldLabel>Description</FieldLabel>
							<FieldRow>
								<TextInput {...register('description')} />
							</FieldRow>
						</Field>

						<Field>
							<FieldLabel>Assignees</FieldLabel>
							<Controller
								control={control}
								name='assignees'
								defaultValue={[]}
								render={({ field: { onChange, value } }): ReactElement => (
									<UserAutoCompleteWithObjectsRoom value={value} onChange={onChange} roomId={roomId} />
								)}
							/>
						</Field>

						<Field>
							<FieldLabel>Due Date</FieldLabel>
							<FieldRow>
								<InputBox type='date' {...register('dueDate')} />
							</FieldRow>
						</Field>

						{taskProperties?.map((property) => (
							<Field key={property._id}>
								<Box display='flex' alignItems='center' justifyContent='space-between' mb='x4'>
									<FieldLabel>
										{property.name}
										{property.required && '*'}
									</FieldLabel>
									<Button
										square
										small
										onClick={() => handleOpenPropertySettings(property as ITaskProperty & { value: ITaskTag[] })}
										title='Property Settings'
									>
										<Icon name='customize' size='x16' />
									</Button>
								</Box>
								<FieldRow>
									<PropertyInput
										property={property}
										value={getPropertyValue(property._id, property.type)}
										onChange={(value) => handlePropertyChange(property._id, value)}
									/>
								</FieldRow>
							</Field>
						))}

						<Button onClick={handleAddNewProperty} display='flex' alignItems='center'>
							<Icon name='plus' size='x16' mie='x4' />
							Add Property
						</Button>

						<Field>
							<Box display='flex' alignItems='center' justifyContent='space-between' mb='x4'>
								<FieldLabel>Subtasks</FieldLabel>
								<Button square small onClick={handleOpenSubtaskPanel} title='Manage Subtasks'>
									<Icon name='list' size='x16' />
								</Button>
							</Box>
							<Box color='hint' fontSize='x12'>
								{subtasks.length} subtasks{' '}
								{subtasks.length > 0 && subtasks.filter((s: ISubtask) => s.completed).length > 0
									? `(${subtasks.filter((s: ISubtask) => s.completed).length} completed)`
									: '(0 completed)'}
							</Box>
						</Field>

						<Field>
							<FieldLabel>Created By</FieldLabel>
							<FieldRow>
								<Box
									display='flex'
									alignItems='center'
									w='full'
									p='x8'
									backgroundColor={Palette.surface['surface-tint']}
									borderColor='#404754'
									borderWidth='x1'
									borderRadius='x4'
									color={Palette.text['font-hint']}
								>
									<UserAvatar size='x24' userId={task.createdBy._id} />
									<Box is='span' mi='x8' withTruncatedText>
										{task.createdBy.username}
									</Box>
								</Box>
							</FieldRow>
						</Field>

						<Field>
							<FieldLabel>Created At</FieldLabel>
							<FieldRow>
								<TextInput value={new Date(task.createdAt).toLocaleString()} disabled />
							</FieldRow>
						</Field>
					</FieldGroup>
				</Modal.Content>
			)}
			<Modal.Footer>
				<Modal.FooterControllers>
					<Button onClick={onClose}>{t('Cancel')}</Button>
					<Button onClick={handleSubmit(handleUpdateTask)} primary disabled={!hasChanges || isLoading} loading={isLoading}>
						{t('Save_changes')}
					</Button>
				</Modal.FooterControllers>
			</Modal.Footer>
		</Modal>
	);
};

export default TaskDetailModal;
