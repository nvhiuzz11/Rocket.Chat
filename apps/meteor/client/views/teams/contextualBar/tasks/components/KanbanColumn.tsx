import { Box, Icon } from '@rocket.chat/fuselage';
import React, { useState } from 'react';
import TaskCard from './TaskCard';
import type { TaskData, TaskStatus } from '../../../../../definitions/model/task';

interface KanbanColumnProps {
	title: string;
	status: TaskStatus;
	tasks: TaskData[];
	onTaskClick?: (task: TaskData) => void;
	onDeleteTask?: (taskId: string) => void;
	onDropTask: (taskId: string, newStatus: TaskStatus) => void;
	icon: string;
	color: string;
}
const KanbanColumn: React.FC<KanbanColumnProps> = ({ title, status, tasks, onTaskClick, onDeleteTask, onDropTask, icon, color }) => {
	const [isDragOver, setIsDragOver] = useState(false);

	const handleDragOver = (e: React.DragEvent) => {
		e.preventDefault();
		e.dataTransfer.dropEffect = 'move';
		setIsDragOver(true);
	};

	const handleDragLeave = () => {
		setIsDragOver(false);
	};

	const handleDrop = (e: React.DragEvent) => {
		e.preventDefault();
		setIsDragOver(false);
		const taskId = e.dataTransfer.getData('text/plain');
		onDropTask(taskId, status);
	};

	return (
		<Box
			flex='1'
			minWidth='280px'
			backgroundColor='surface-tint'
			borderRadius='8px'
			padding='12px'
			border='2px solid'
			borderColor={isDragOver ? 'primary' : 'stroke-extra-light'}
			onDragOver={handleDragOver}
			onDragLeave={handleDragLeave}
			onDrop={handleDrop}
			style={{
				transition: 'all 0.2s ease',
				minHeight: '500px',
			}}
		>
			{/* Column Header */}
			<Box display='flex' alignItems='center' gap='8px' marginBlockEnd='16px'>
				<Icon name={icon} size='x16' color={color} />
				<Box fontWeight='600' fontSize='14px'>
					{title}
				</Box>
				<Box backgroundColor={color} color='white' borderRadius='12px' padding='2px 8px' fontSize='12px' fontWeight='600'>
					{tasks.length}
				</Box>
			</Box>

			{/* Tasks */}
			<Box>
				{tasks.map((task) => (
					<TaskCard key={task.id} task={task} onTaskClick={onTaskClick} onDeleteTask={onDeleteTask} />
				))}

				{tasks.length === 0 && (
					<Box
						display='flex'
						alignItems='center'
						justifyContent='center'
						height='100px'
						color='hint'
						fontSize='12px'
						borderStyle='dashed'
						borderWidth='2px'
						borderColor='stroke-light'
						borderRadius='6px'
					>
						Drop tasks here
					</Box>
				)}
			</Box>
		</Box>
	);
};

export default KanbanColumn;
