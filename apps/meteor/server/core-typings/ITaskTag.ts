import type { IRocketChatRecord } from '@rocket.chat/core-typings';

export interface ITaskTag extends IRocketChatRecord {
	_id: string;
	name: string;
	color: string;
	order: number;
	taskPropertyId: string;
	taskId: string;
}
