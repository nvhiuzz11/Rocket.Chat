import type { IRocketChatRecord } from '@rocket.chat/core-typings';

import type { IModule, IFieldDefinition } from './IModule';

export interface IDocument extends IRocketChatRecord {
	moduleId: IModule['_id'];
	title: string;
	description?: string;
	order: number;
	customFields: ICustomFieldValue[];
	createdAt: Date;
}

export interface ICustomFieldValue {
	fieldId: IFieldDefinition['_id'];
	value: any;
}
