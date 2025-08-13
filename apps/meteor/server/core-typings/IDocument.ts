import type { IRocketChatRecord, IUser } from '@rocket.chat/core-typings';

import type { IModule, IFieldDefinition } from './IModule';
import type { IStage } from './IStage';

export interface ICustomFieldValue {
	fieldId: IFieldDefinition['_id'];
	value: any; // Value of any type, depending on the `type` of the field
}

export interface IDocument extends IRocketChatRecord {
	name: string;
	description?: string;
	moduleId: IModule['_id'];
	stageId: IStage['_id'];
	order: number;
	parentId?: IDocument['_id'];
	customFields: ICustomFieldValue[];
	createdBy: Pick<IUser, '_id' | 'username' | 'name'>;
	createdAt: Date;
}
