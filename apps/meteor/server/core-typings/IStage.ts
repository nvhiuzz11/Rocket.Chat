import type { IRocketChatRecord } from '@rocket.chat/core-typings';

import type { IModule } from './IModule';

export interface IStage extends IRocketChatRecord {
	name: string;
	moduleId: IModule['_id'];
	order: number;
}
