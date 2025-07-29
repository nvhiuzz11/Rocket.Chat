import React from 'react';
import { Box, Throbber } from '@rocket.chat/fuselage';
import KanbanColumn from './KanbanColumn';
import { TaskData, TaskStatus } from '../../../../../definitions/model/task';

interface KanbanBoardProps {
	tasks: TaskData[];
	onTaskClick?: (task: TaskData) => void;
	onDeleteTask?: (taskId: string) => void;
	onDropTask: (taskId: string, newStatus: TaskStatus) => void;
	loading?: boolean;
}

const KanbanBoard: React.FC<KanbanBoardProps> = ({ tasks, onTaskClick, onDeleteTask, onDropTask, loading = false }) => {
	const columns = [
		{
			title: 'Backlog',
			status: 'backlog' as TaskStatus,
			tasks: tasks.filter((task) => task.status === 'backlog'),
			icon: 'queue',
			color: 'secondary',
		},
		{
			title: 'Not Started',
			status: 'not_started' as TaskStatus,
			tasks: tasks.filter((task) => task.status === 'not_started'),
			icon: 'circle',
			color: 'danger',
		},
		{
			title: 'In Progress',
			status: 'in_progress' as TaskStatus,
			tasks: tasks.filter((task) => task.status === 'in_progress'),
			icon: 'clock',
			color: 'primary',
		},
		{
			title: 'Done',
			status: 'done' as TaskStatus,
			tasks: tasks.filter((task) => task.status === 'done'),
			icon: 'check',
			color: 'success',
		},
	];

	if (loading) {
		return (
			<Box display='flex' justifyContent='center' alignItems='center' height='400px'>
				<Throbber />
			</Box>
		);
	}

	return (
		<Box display='flex' gap='16px' height='100%' minWidth='1200px'>
			{columns.map((column) => (
				<KanbanColumn
					key={column.status}
					title={column.title}
					status={column.status}
					tasks={column.tasks}
					onTaskClick={onTaskClick}
					onDeleteTask={onDeleteTask}
					onDropTask={onDropTask}
					icon={column.icon}
					color={column.color}
				/>
			))}
		</Box>
	);
};

export default KanbanBoard;
