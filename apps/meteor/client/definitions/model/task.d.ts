import type { IRocketChatRecord, IUser } from '@rocket.chat/core-typings';

// export type TaskStatus = 'todo' | 'in-progress' | 'done';

export interface ITaskResponse extends IRocketChatRecord {
	title: string;
	description?: string;
	status: TaskStatus;
	creator: IUser;
	assignees: IUser[];
	dueDate?: Date;
	createdAt: Date;
	updatedAt: Date;
}

export type TaskStatus = 'not_started' | 'in_progress' | 'done' | 'backlog';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskType = 'feature' | 'bug' | 'improvement' | 'research';

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
