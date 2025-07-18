import type { IRocketChatRecord } from '@rocket.chat/core-typings';

import type { IProjectTag } from './IProjectTag';

export type IProjectPropertyType = 'SELECT' | 'MULTI_SELECT';

export interface IProjectProperty extends IRocketChatRecord {
	_id: string;
	name: string;
	type: IProjectPropertyType;
	projectId: string;
	order: number;
	value?: Pick<IProjectTag, '_id' | 'name'>[];
}
