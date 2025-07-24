import type { IRocketChatRecord, IUser } from '@rocket.chat/core-typings';

import type { IProjectTag } from './IProjectTag';

export interface IProject extends IRocketChatRecord {
	name: string;
	description?: string;
	teamId: string;
	roomId: string;
	createdBy: Pick<IUser, '_id' | 'username'>;
	createdAt: Date;
	properties?: Array<{ propertyId: string; value: IProjectTag['_id'][] }>;
}
