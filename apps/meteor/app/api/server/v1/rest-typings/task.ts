import { IUser } from '@rocket.chat/core-typings';
import { ajv } from '../Ajv';

type TaskCreateProps = {
	title: string;
	description?: string;
	projectId: string;
	assignees?: Pick<IUser, '_id' | 'username'>[];
	dueDate?: Date;
};

const TaskCreatePropsSchema = {
	type: 'object',
	properties: {
		title: { type: 'string' },
		description: { type: 'string' },
		projectId: { type: 'string' },
		assignees: {
			type: 'array',
			items: { type: 'object', properties: { _id: { type: 'string' }, username: { type: 'string' } }, required: ['_id', 'username'] },
		},
		dueDate: { type: 'string' },
	},
	required: ['title', 'projectId'],
};

export const isTaskCreateProps = ajv.compile<TaskCreateProps>(TaskCreatePropsSchema);

type TaskUpdateProps = {
	_id: string;
	title?: string;
	description?: string;
	projectId?: string;
	assignees?: Pick<IUser, '_id' | 'username'>[];
	dueDate?: Date;
};

const TaskUpdatePropsSchema = {
	type: 'object',
	properties: {
		_id: { type: 'string' },
		title: { type: 'string' },
		description: { type: 'string' },
		projectId: { type: 'string' },
		assignees: {
			type: 'array',
			items: { type: 'object', properties: { _id: { type: 'string' }, username: { type: 'string' } }, required: ['_id', 'username'] },
		},
		dueDate: { type: 'string' },
	},
	required: ['_id'],
};

export const isTaskUpdateProps = ajv.compile<TaskUpdateProps>(TaskUpdatePropsSchema);
