import type { IUser } from '@rocket.chat/core-typings';

import { type ITaskTag } from '../../../../../server/core-typings/ITaskTag';
import { ajv } from '../Ajv';

type TaskCreateProps = {
	title: string;
	description?: string;
	projectId: string;
	assignees?: Pick<IUser, '_id' | 'username'>[];
	dueDate?: Date;
	properties?: Array<{ taskPropertyId: string; value: ITaskTag['_id'][] }>;
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
		dueDate: { type: 'string', format: 'date-time' },
		properties: {
			type: 'array',
			items: {
				type: 'object',
				properties: {
					taskPropertyId: { type: 'string' },
					value: { type: 'array', items: { type: 'string' } },
				},
				required: ['taskPropertyId', 'value'],
			},
		},
	},
	required: ['title', 'projectId'],
};

export const isTaskCreateProps = ajv.compile<TaskCreateProps>(TaskCreatePropsSchema);

type TaskUpdateProps = {
	_id: string;
	data: any;
};

const TaskUpdatePropsSchema = {
	type: 'object',
	properties: {
		_id: { type: 'string' },
		payload: { type: 'object', additionalProperties: true },
	},
	required: ['_id', 'payload'],
};

export const isTaskUpdateProps = ajv.compile<TaskUpdateProps>(TaskUpdatePropsSchema);

export interface ITaskUpdateData {
	title?: string;
	description?: string;
	assignees?: any[];
	dueDate?: Date;
	properties?: any;
}
