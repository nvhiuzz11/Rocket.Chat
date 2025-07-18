import type { IRocketChatRecord } from '@rocket.chat/core-typings';

import type { ITaskTag } from './ITaskTag';

export type ITaskPropertyType = 'SELECT' | 'MULTI_SELECT';

export interface ITaskProperty extends IRocketChatRecord {
	_id: string;
	name: string;
	type: ITaskPropertyType;
	taskId: string;
	order: number;
	value?: Pick<ITaskTag, '_id' | 'name'>[];
}
