import type { IRocketChatRecord } from '@rocket.chat/core-typings';

export interface IProjectTag extends IRocketChatRecord {
	_id: string;
	name: string;
	color: string;
	order: number;
	projectPropertyId: string;
	projectId: string;
}
