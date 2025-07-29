export type TaskStatus = 'backlog' | 'not_started' | 'in_progress' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskType = 'task' | 'bug' | 'feature';

export interface TaskData {
	id: string;
	title: string;
	description: string;
	status: TaskStatus;
	priority: TaskPriority;
	type: TaskType;
	assignee: string;
	dueDate: string;
	tags: string[];
	estimatedHours: number;
	project: string;
	createdAt: string;
	updatedAt: string;
}

export interface TaskListModalProps {
	onClose: () => void;
	tasks?: TaskData[];
	onTaskClick?: (task: TaskData) => void;
	onCreateTask?: () => void;
	onUpdateTask?: (task: TaskData) => void;
	onDeleteTask?: (taskId: string) => void;
	loading?: boolean;
}
