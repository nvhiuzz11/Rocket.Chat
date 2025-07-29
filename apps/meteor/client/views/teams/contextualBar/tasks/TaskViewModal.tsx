import { Modal, Box } from '@rocket.chat/fuselage';
import type { TaskData, TaskStatus } from '../../../../definitions/model/task';
import React, { useState, useMemo } from 'react';

import KanbanBoard from './components/KanbanBoard';
import TaskFilters from './components/TaskFilters';
import TaskHeader from './components/TaskHeader';

interface ITaskListModalProps {
	onClose: () => void;
	tasks?: TaskData[];
	onTaskClick?: (task: TaskData) => void;
	onCreateTask?: () => void;
	onUpdateTask?: (task: TaskData) => void;
	onDeleteTask?: (taskId: string) => void;
	loading?: boolean;
}

const mockTasks: TaskData[] = [
	{
		id: '1',
		title: 'Wireframe Setting Screen (Mobile)',
		description: 'Create wireframe for mobile setting screen',
		status: 'not_started',
		priority: 'medium',
		type: 'feature',
		assignee: 'thanh_nguyen',
		dueDate: '2025-07-20',
		tags: ['UI/UX', 'Mobile'],
		estimatedHours: 8,
		project: 'mobile_app',
		createdAt: '2025-07-10',
		updatedAt: '2025-07-12',
	},
	{
		id: '2',
		title: 'UI - Mobile + Desktop Usage Details',
		description: 'Design usage details interface for both mobile and desktop',
		status: 'not_started',
		priority: 'high',
		type: 'feature',
		assignee: 'hieu_ngo',
		dueDate: '2025-07-18',
		tags: ['UI/UX', 'Mobile', 'Desktop'],
		estimatedHours: 12,
		project: 'faver_aid',
		createdAt: '2025-07-11',
		updatedAt: '2025-07-13',
	},
	{
		id: '3',
		title: 'UI - Location Desktop',
		description: 'Design location interface for desktop application',
		status: 'in_progress',
		priority: 'medium',
		type: 'feature',
		assignee: 'hieu_ngo',
		dueDate: '2025-07-22',
		tags: ['UI/UX', 'Desktop'],
		estimatedHours: 6,
		project: 'web_app',
		createdAt: '2025-07-08',
		updatedAt: '2025-07-14',
	},
	{
		id: '4',
		title: 'UI - Setup style guide',
		description: 'Create comprehensive style guide for UI components',
		status: 'in_progress',
		priority: 'high',
		type: 'improvement',
		assignee: 'hieu_ngo',
		dueDate: '2025-07-25',
		tags: ['UI/UX', 'Documentation'],
		estimatedHours: 16,
		project: 'faver_ai',
		createdAt: '2025-07-05',
		updatedAt: '2025-07-15',
	},
	{
		id: '5',
		title: 'Research Typescript and NestJS',
		description: 'Research and document best practices for TypeScript and NestJS',
		status: 'in_progress',
		priority: 'medium',
		type: 'research',
		assignee: 'trung_hoang',
		dueDate: '2025-07-30',
		tags: ['Backend', 'Research'],
		estimatedHours: 20,
		project: 'faver_ai',
		createdAt: '2025-07-01',
		updatedAt: '2025-07-14',
	},
	{
		id: '6',
		title: 'UI - Location Mobile',
		description: 'Design location interface for mobile application',
		status: 'done',
		priority: 'medium',
		type: 'feature',
		assignee: 'hieu_ngo',
		dueDate: '2025-07-16',
		tags: ['UI/UX', 'Mobile'],
		estimatedHours: 8,
		project: 'mobile_app',
		createdAt: '2025-07-01',
		updatedAt: '2025-07-16',
	},
	{
		id: '7',
		title: 'Dev - App usage permission',
		description: 'Implement app usage permission system',
		status: 'backlog',
		priority: 'low',
		type: 'feature',
		assignee: 'nguyen_hieu',
		dueDate: '2025-08-01',
		tags: ['Development', 'Permissions'],
		estimatedHours: 12,
		project: 'mobile_app',
		createdAt: '2025-07-12',
		updatedAt: '2025-07-12',
	},
];

const TaskViewModal = ({
	onClose,
	tasks = mockTasks,
	onTaskClick,
	onCreateTask,
	onUpdateTask,
	onDeleteTask,
	loading = false,
}) => {
	const [allTasks, setAllTasks] = useState<TaskData[]>(tasks);
	const [searchTerm, setSearchTerm] = useState('');
	const [priorityFilter, setPriorityFilter] = useState('all');
	const [assigneeFilter, setAssigneeFilter] = useState('all');

	const filteredTasks = useMemo(() => {
		return allTasks.filter((task) => {
			const matchesSearch =
				task.title.toLowerCase().includes(searchTerm.toLowerCase()) || task.description.toLowerCase().includes(searchTerm.toLowerCase());
			const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
			const matchesAssignee = assigneeFilter === 'all' || task.assignee === assigneeFilter;

			return matchesSearch && matchesPriority && matchesAssignee;
		});
	}, [allTasks, searchTerm, priorityFilter, assigneeFilter]);

	const handleDropTask = (taskId: string, newStatus: TaskStatus) => {
		setAllTasks((prevTasks) =>
			prevTasks.map((task) =>
				task.id === taskId ? { ...task, status: newStatus, updatedAt: new Date().toISOString().split('T')[0] } : task,
			),
		);

		// Call the parent's onUpdateTask if provided
		const updatedTask = allTasks.find((task) => task.id === taskId);
		if (updatedTask && onUpdateTask) {
			onUpdateTask({ ...updatedTask, status: newStatus });
		}
	};

	return (
		<Modal width='95vw' maxWidth='1600px' height='95vh'>
			<Modal.Header>
				<Modal.Title>Task Management</Modal.Title>
				<Modal.Close onClick={onClose} />
			</Modal.Header>

			<Modal.Content>
				<Box padding='20px' width='100%' height='100%'>
					<TaskHeader taskCount={filteredTasks.length} onCreateTask={onCreateTask} />

					<TaskFilters
						searchTerm={searchTerm}
						onSearchChange={setSearchTerm}
						priorityFilter={priorityFilter}
						onPriorityChange={setPriorityFilter}
						assigneeFilter={assigneeFilter}
						onAssigneeChange={setAssigneeFilter}
					/>

					{/* Kanban Board */}
					<Box height='calc(100% - 140px)' overflow='auto'>
						<KanbanBoard
							tasks={filteredTasks}
							onTaskClick={onTaskClick}
							onDeleteTask={onDeleteTask}
							onDropTask={handleDropTask}
							loading={loading}
						/>
					</Box>
				</Box>
			</Modal.Content>
		</Modal>
	);
};

export default TaskViewModal;
