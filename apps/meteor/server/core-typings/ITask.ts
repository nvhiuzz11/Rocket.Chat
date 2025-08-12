import type { IRocketChatRecord, IUser } from '@rocket.chat/core-typings';

import type { ITaskTag } from './ITaskTag';

export interface ITask extends IRocketChatRecord {
	title: string;
	description?: string;
	projectId: string;
	createdBy: Pick<IUser, '_id' | 'username'>;
	assignees?: Pick<IUser, '_id' | 'username'>[];
	dueDate?: Date;
	createdAt: Date;
	properties?: Array<{ taskPropertyId: string; value: ITaskTag['_id'][] }>;
	parentTaskId?: string;
	isComplete?: boolean; // For subtasks only
}
