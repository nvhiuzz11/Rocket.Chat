import type { IRocketChatRecord } from '@rocket.chat/core-typings';

export interface IProjectTag extends IRocketChatRecord {
	name: string;
	color: string;
	order: number;
	projectPropertyId: string;
}
