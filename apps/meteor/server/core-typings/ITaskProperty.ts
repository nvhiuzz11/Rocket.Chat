import type { IRocketChatRecord } from '@rocket.chat/core-typings';

import type { TASK_PROPERTY_TYPES } from '../../definition/project';

export type ITaskPropertyType = (typeof TASK_PROPERTY_TYPES)[keyof typeof TASK_PROPERTY_TYPES];

export interface ITaskProperty extends IRocketChatRecord {
	name: string;
	type: ITaskPropertyType;
	projectId: string;
	order: number;
}
