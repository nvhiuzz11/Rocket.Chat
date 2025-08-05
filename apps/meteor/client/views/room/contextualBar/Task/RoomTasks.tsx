import { Box, Button, Icon, Throbber, Select, TextInput } from '@rocket.chat/fuselage';
import { useAutoFocus } from '@rocket.chat/fuselage-hooks';
import { useSetModal } from '@rocket.chat/ui-contexts';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';

import CreateTaskModal from './components/CreateTaskModal';
import TaskDetailModal from './components/TaskDetailModal';
import TaskKanbanBoard from './components/TaskKanbanBoard';
import TaskTableView from './components/TaskTableView';
import ViewSwitcher from './components/ViewSwitcher';
import type { ITask } from '../../../../../server/core-typings/ITask';
import type { ITaskProperty } from '../../../../../server/core-typings/ITaskProperty';
import type { ITaskTag } from '../../../../../server/core-typings/ITaskTag';
import {
	ContextualbarHeader,
	ContextualbarIcon,
	ContextualbarTitle,
	ContextualbarClose,
	ContextualbarContent,
	ContextualbarDialogResizable,
	ContextualbarSection,
} from '../../../../components/Contextualbar';

type RoomTasksProps = {
	loading: boolean;
	tasks: ITask[];
	projectId: string;
	onClickClose: () => void;
	error?: Error | null;
	textSearch: string;
	setTextSearch: (text: string) => void;
	taskProperties?: ITaskProperty[] & { value: ITaskTag[] };
	reload: () => void;
	roomId: string;
};

type ViewType = 'kanban' | 'table';

const RoomTasks = ({
	loading,
	tasks = [],
	projectId,
	onClickClose,
	error,
	textSearch,
	setTextSearch,
	taskProperties,
	reload,
	roomId,
}: RoomTasksProps) => {
	const { t } = useTranslation();
	const [currentView, setCurrentView] = useState<ViewType>('kanban');
	const setModal = useSetModal();

	const inputRef = useAutoFocus<HTMLInputElement>(true);

	const handleAddTask = (initialStatusProperty?: { taskPropertyId: string; value: ITaskTag['_id'] }) => {
		if (!projectId) return;
		setModal(
			<CreateTaskModal
				taskProperties={taskProperties}
				onClose={() => setModal(null)}
				reload={reload}
				projectId={projectId}
				initialStatusProperty={initialStatusProperty}
				roomId={roomId}
			/>,
		);
	};

	const handleViewChange = useCallback((view: ViewType) => {
		setCurrentView(view);
	}, []);

	const handleTextSearchChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
		setTextSearch(event.currentTarget.value);
	}, []);

	const openTaskDetailModal = (task: ITask) => {
		setModal(
			<TaskDetailModal taskProperties={taskProperties} onClose={() => setModal(null)} reload={reload} task={task} roomId={roomId} />,
		);
	};

	return (
		<ContextualbarDialogResizable>
			<ContextualbarHeader>
				<ContextualbarIcon name='stack' />
				<ContextualbarTitle>{t('Task Management')}</ContextualbarTitle>
				{onClickClose && <ContextualbarClose onClick={onClickClose} />}
			</ContextualbarHeader>

			<ContextualbarSection>
				<Box display='flex' flexDirection='column' style={{ gap: '16px' }} w='full'>
					<Box>
						<ViewSwitcher activeView={currentView} onViewChange={handleViewChange} />
					</Box>
					<Box display='flex' flexDirection='row' alignItems='center' w='full'>
						<Box flexGrow={1} minWidth={0}>
							<TextInput
								placeholder={t('Search')}
								value={textSearch}
								ref={inputRef}
								onChange={handleTextSearchChange}
								addon={<Icon name='magnifier' size='x20' />}
							/>
						</Box>

						<Box w='x144' mis='x8' flexShrink={0}>
							<Select options={[]} placeholder={t('Filters')} />
						</Box>

						<Box mis='x8' flexShrink={0}>
							<Button secondary onClick={() => handleAddTask()}>
								<Icon name='plus' size='x16' /> {t('Add_Task')}
							</Button>
						</Box>
					</Box>
				</Box>
			</ContextualbarSection>
			<ContextualbarContent display='flex' flexDirection='column' p={12} height='100%'>
				{!error && loading && (
					<Box pi={24} pb={12}>
						<Throbber size='x12' />
					</Box>
				)}
				<Box flexGrow={1} flexShrink={1} height='100%' minHeight={0}>
					{currentView === 'kanban' ? (
						<TaskKanbanBoard
							tasks={tasks}
							projectId={projectId}
							taskProperties={taskProperties}
							reload={reload}
							onTaskCreate={handleAddTask}
							onOpenTaskDetail={openTaskDetailModal}
							error={error}
						/>
					) : (
						<TaskTableView
							tasks={tasks}
							taskProperties={taskProperties}
							onEditTask={(task) => console.log(task)}
							onOpenTaskDetail={openTaskDetailModal}
							error={error}
							reload={reload}
							loading={loading}
						/>
					)}
				</Box>
			</ContextualbarContent>
		</ContextualbarDialogResizable>
	);
};

export default RoomTasks;
