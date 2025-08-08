import type { IRocketChatRecord } from '@rocket.chat/core-typings';

export interface ISubtask extends IRocketChatRecord {
	title: string;
	taskId: string;
	completed: boolean;
	order: number;
	createdAt: Date;
}
