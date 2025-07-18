import type { IRocketChatRecord, IUser } from '@rocket.chat/core-typings';

export interface IProject extends IRocketChatRecord {
	_id: string;
	name: string;
	description?: string;
	teamId: string;
	roomId: string;
	createdBy: Pick<IUser, '_id' | 'username'>;
	createdAt: Date;
}
