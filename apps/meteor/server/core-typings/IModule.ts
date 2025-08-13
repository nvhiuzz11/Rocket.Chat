import type { IRocketChatRecord, IUser } from '@rocket.chat/core-typings';

import type { MODULE_FIELD_TYPES } from '../../definition/IModuleConfig';

export type FieldType = keyof typeof MODULE_FIELD_TYPES;

export interface IFieldDefinition {
	_id: string;
	name: string;
	type: FieldType;
	options?: { _id: string; value: string; color?: string; order?: number }[];
	isRequired: boolean;
}

export interface IModule extends IRocketChatRecord {
	name: string;
	description?: string;
	fieldDefinitions: IFieldDefinition[];
	createdAt: Date;
	createdBy: Pick<IUser, '_id' | 'username' | 'name'>;
}
