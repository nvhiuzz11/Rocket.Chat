import type { IRocketChatRecord } from '@rocket.chat/core-typings';

export interface ITaskTag extends IRocketChatRecord {
	name: string;
	color: string;
	order: number;
	taskPropertyId: string;
}
