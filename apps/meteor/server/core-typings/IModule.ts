import type { IRocketChatRecord, IUser, IRoom, ITeam } from '@rocket.chat/core-typings';

export type ModuleType = 'project' | 'task' | 'recruitment' | 'deal';

export type FieldType = 'text' | 'textarea' | 'number' | 'date' | 'select' | 'multi-select' | 'user' | 'checkbox' | 'attachment';

export interface IFieldDefinition {
	_id: string;
	name: string;
	type: FieldType;
	systemKey?: string;
	options?: { _id: string; value: string; color?: string; order?: number }[];
	isRequired: boolean;
}

export interface IModule extends IRocketChatRecord {
	name: string;
	description?: string;
	type: ModuleType;
	roomId: IRoom['_id'];
	teamId?: ITeam['_id'];
	fieldDefinitions: IFieldDefinition[];
	createdAt: Date;
	createdBy: Pick<IUser, '_id' | 'username' | 'name'>;
}
