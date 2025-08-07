import { ajv } from '../Ajv';

type TaskPropertyCreateProps = {
	name: string;
	type: string;
	projectId: string;
	order?: number;
	required?: boolean;
	systemKey?: string;
};

const TaskPropertyCreatePropsSchema = {
	type: 'object',
	properties: {
		name: { type: 'string' },
		type: { type: 'string' },
		projectId: { type: 'string' },
		order: { type: 'number' },
		required: { type: 'boolean' },
		systemKey: { type: 'string' },
	},
	required: ['name', 'type', 'projectId'],
};

export const isTaskPropertyCreateProps = ajv.compile<TaskPropertyCreateProps>(TaskPropertyCreatePropsSchema);

type TaskPropertyUpdateProps = {
	_id: string;
	data: Partial<TaskPropertyCreateProps>;
};

const TaskPropertyUpdatePropsSchema = {
	type: 'object',
	properties: {
		_id: { type: 'string' },
		data: { type: 'object', additionalProperties: true },
	},
	required: ['_id', 'data'],
};

export const isTaskPropertyUpdateProps = ajv.compile<TaskPropertyUpdateProps>(TaskPropertyUpdatePropsSchema);
