import type { IRocketChatRecord, IUser } from '@rocket.chat/core-typings';

export interface ITask extends IRocketChatRecord {
	_id: string;
	title: string;
	description?: string;
	projectId: string;
	createdBy: Pick<IUser, '_id' | 'username'>;
	assignees?: Pick<IUser, '_id' | 'username'>[];
	dueDate?: Date;
	createdAt: Date;
}
