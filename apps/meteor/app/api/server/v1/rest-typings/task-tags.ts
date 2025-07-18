import { ajv } from '../Ajv';

type TaskTagCreateProps = {
	name: string;
	color: string;
	taskId: string;
	taskPropertyId: string;
};

const TaskTagCreatePropsSchema = {
	type: 'object',
	properties: {
		name: { type: 'string' },
		color: { type: 'string' },
		taskId: { type: 'string' },
		taskPropertyId: { type: 'string' },
	},
	required: ['name', 'color', 'taskId', 'taskPropertyId'],
};

export const isTaskTagCreateProps = ajv.compile<TaskTagCreateProps>(TaskTagCreatePropsSchema);

type TaskTagUpdateProps = {
	_id: string;
	name?: string;
	color?: string;
	taskId?: string;
	taskPropertyId?: string;
};

const TaskTagUpdatePropsSchema = {
	type: 'object',
	properties: {
		_id: { type: 'string' },
		name: { type: 'string' },
		color: { type: 'string' },
		taskId: { type: 'string' },
		taskPropertyId: { type: 'string' },
	},
	required: ['_id'],
};

export const isTaskTagUpdateProps = ajv.compile<TaskTagUpdateProps>(TaskTagUpdatePropsSchema);
