import { Box, Button, Icon, Avatar, Tag, Chip } from '@rocket.chat/fuselage';
import React, { useState } from 'react';

import { TaskData, TaskPriority } from '../../../../../definitions/model/task';

interface TaskCardProps {
	task: TaskData;
	onTaskClick?: (task: TaskData) => void;
	onDeleteTask?: (taskId: string) => void;
}

const assigneeOptions = [
	{ value: 'hieu_ngo', label: 'Hiếu Ngô' },
	{ value: 'thanh_nguyen', label: 'Thanh Huyền Nguyễn' },
	{ value: 'nguyen_hieu', label: 'Nguyễn Hiếu' },
	{ value: 'trung_hoang', label: 'Trung Hoàng' },
];

const priorityOptions = [
	{ value: 'low', label: 'Low' },
	{ value: 'medium', label: 'Medium' },
	{ value: 'high', label: 'High' },
	{ value: 'urgent', label: 'Urgent' },
];

const TaskCard: React.FC<TaskCardProps> = ({ task, onTaskClick, onDeleteTask }) => {
	const [isDragging, setIsDragging] = useState(false);

	const getAssigneeName = (assignee: string): string => {
		const assigneeObj = assigneeOptions.find((opt) => opt.value === assignee);
		return assigneeObj?.label || assignee;
	};

	const getPriorityColor = (priority: TaskPriority): string => {
		switch (priority) {
			case 'low':
				return 'success';
			case 'medium':
				return 'warning';
			case 'high':
				return 'danger';
			case 'urgent':
				return 'danger';
			default:
				return 'secondary';
		}
	};

	const getPriorityLabel = (priority: TaskPriority): string => {
		return priorityOptions.find((opt) => opt.value === priority)?.label || priority;
	};

	const handleDragStart = (e: React.DragEvent) => {
		setIsDragging(true);
		e.dataTransfer.setData('text/plain', task.id);
		e.dataTransfer.effectAllowed = 'move';
	};

	const handleDragEnd = () => {
		setIsDragging(false);
	};

	return (
		<Box
			draggable
			onDragStart={handleDragStart}
			onDragEnd={handleDragEnd}
			padding='12px'
			marginBlockEnd='8px'
			backgroundColor='surface-light'
			borderRadius='6px'
			border='1px solid'
			borderColor='stroke-extra-light'
			style={{
				cursor: isDragging ? 'grabbing' : 'grab',
				opacity: isDragging ? 0.5 : 1,
				transition: 'all 0.2s ease',
			}}
			_hover={{
				backgroundColor: 'surface-hover',
				borderColor: 'stroke-light',
				transform: 'translateY(-1px)',
				boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
			}}
		>
			{/* Task Title */}
			<Box fontWeight='600' fontSize='14px' marginBlockEnd='6px' onClick={() => onTaskClick?.(task)} style={{ cursor: 'pointer' }}>
				{task.title}
			</Box>

			{/* Task Description */}
			<Box color='hint' fontSize='12px' marginBlockEnd='8px'>
				{task.description.length > 60 ? `${task.description.substring(0, 60)}...` : task.description}
			</Box>

			{/* Priority & Assignee */}
			<Box display='flex' justifyContent='space-between' alignItems='center' marginBlockEnd='8px'>
				<Tag variant={getPriorityColor(task.priority)} size='small'>
					{getPriorityLabel(task.priority)}
				</Tag>
				<Box display='flex' alignItems='center' gap='4px'>
					<Avatar size='x16' />
					<Box fontSize='11px' color='hint'>
						{getAssigneeName(task.assignee)}
					</Box>
				</Box>
			</Box>

			{/* Due Date & Hours */}
			<Box display='flex' justifyContent='space-between' alignItems='center' marginBlockEnd='8px'>
				<Box display='flex' alignItems='center' gap='4px'>
					<Icon name='calendar' size='x12' />
					<Box fontSize='11px' color='hint'>
						{task.dueDate || 'No due date'}
					</Box>
				</Box>
				<Box display='flex' alignItems='center' gap='4px'>
					<Icon name='clock' size='x12' />
					<Box fontSize='11px' color='hint'>
						{task.estimatedHours}h
					</Box>
				</Box>
			</Box>

			{/* Tags */}
			{task.tags.length > 0 && (
				<Box display='flex' gap='4px' flexWrap='wrap' marginBlockEnd='8px'>
					{task.tags.slice(0, 2).map((tag, index) => (
						<Chip key={index} size='small'>
							{tag}
						</Chip>
					))}
					{task.tags.length > 2 && (
						<Box fontSize='10px' color='hint' display='flex' alignItems='center'>
							+{task.tags.length - 2}
						</Box>
					)}
				</Box>
			)}

			{/* Actions */}
			<Box display='flex' justifyContent='end' gap='4px'>
				<Button
					small
					onClick={(e) => {
						e.stopPropagation();
						onTaskClick?.(task);
					}}
				>
					<Icon name='edit' size='x12' />
				</Button>
				<Button
					small
					danger
					onClick={(e) => {
						e.stopPropagation();
						onDeleteTask?.(task.id);
					}}
				>
					<Icon name='trash' size='x12' />
				</Button>
			</Box>
		</Box>
	);
};

export default TaskCard;
