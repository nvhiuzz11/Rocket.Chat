import type { IRocketChatRecord } from '@rocket.chat/core-typings';

import type { PROJECT_PROPERTY_TYPES } from '../../definition/project';

export type IProjectPropertyType = (typeof PROJECT_PROPERTY_TYPES)[keyof typeof PROJECT_PROPERTY_TYPES];

export interface IProjectProperty extends IRocketChatRecord {
	name: string;
	type: IProjectPropertyType;
	teamId: string;
	order: number;
	required: boolean;
	systemKey?: string;
}
