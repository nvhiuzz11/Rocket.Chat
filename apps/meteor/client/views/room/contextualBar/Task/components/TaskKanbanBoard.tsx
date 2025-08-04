import { Box } from '@rocket.chat/fuselage';
import { useEndpoint, useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { useEffect, useState } from 'react';

import KanbanColumn from './KanbanColumn';
import TaskCard from './TaskCard';
import type { ITask } from '../../../../../../server/core-typings/ITask';
import type { ITaskProperty } from '../../../../../../server/core-typings/ITaskProperty';
import type { ITaskTag } from '../../../../../../server/core-typings/ITaskTag';

type KanbanBoardProps = {
	tasks: ITask[];
	projectId: string;
	taskProperties: ITaskProperty[] & { value: ITaskTag[] };
	reload: () => void;
	onTaskCreate?: (initialStatusProperty?: { taskPropertyId: string; value: ITaskTag['_id'] }) => void;
	onOpenTaskDetail?: (task: ITask) => void;
};

const TaskKanbanBoard = ({ tasks, projectId, taskProperties, reload, onTaskCreate, onOpenTaskDetail }: KanbanBoardProps) => {
	const updateTaskStatusEndpoint = useEndpoint('POST', '/v1/tasks.updateStatus');

	const statusProperty = taskProperties.find((property) => property.systemKey === 'status');
	const [statuses, setStatuses] = useState<ITaskTag[]>();
	const dispatchToastMessage = useToastMessageDispatch();

	useEffect(() => {
		if (statusProperty) {
			setStatuses(statusProperty?.value as ITaskTag[]);
		}
	}, [statusProperty]);

	const handleTaskDrop = async (taskId: string, newStatusId: string) => {
		if (!statusProperty) {
			console.error('Status property not found');
			return;
		}

		try {
			await updateTaskStatusEndpoint({
				_id: taskId,
				statusPropertyId: statusProperty._id,
				statusValueId: newStatusId,
			});
			reload();
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	};

	const handleTaskReorder = (taskId: string, newIndex: number) => {
		// You will need a backend implementation to handle task reordering.
		// This might involve adding an 'order' field to your ITask interface.
		console.log('handleTaskReorder', taskId, newIndex);
	};

	return (
		<Box display='flex' flexDirection='column' width='100%' height='100%'>
			<Box
				display='flex'
				flexDirection='row'
				overflowX='auto'
				overflowY='auto'
				padding='x16'
				height='100%'
				style={
					{
						'--rcx-spacing-x16': '16px',
						'--rcx-spacing-x8': '8px',
						'gap': 'var(--rcx-spacing-x16)',
						'alignItems': 'flex-start',
					} as React.CSSProperties
				}
			>
				{statuses?.map((status) => {
					const filteredTasks = tasks.filter((task) =>
						task.properties?.some((property) => property.taskPropertyId === statusProperty?._id && property.value?.includes(status._id)),
					);
					return (
						<KanbanColumn
							key={status._id}
							status={status}
							onTaskDrop={handleTaskDrop}
							onTaskReorder={handleTaskReorder}
							onTaskCreate={() => onTaskCreate?.({ taskPropertyId: statusProperty?._id, value: status._id })}
						>
							{filteredTasks.map((task) => (
								<TaskCard
									key={task._id}
									task={task}
									status={status}
									taskProperties={taskProperties}
									onTaskClick={() => onOpenTaskDetail?.(task)}
								/>
							))}
						</KanbanColumn>
					);
				})}
			</Box>
		</Box>
	);
};

export default TaskKanbanBoard;
