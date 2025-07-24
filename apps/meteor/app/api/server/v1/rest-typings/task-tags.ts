import { ajv } from '../Ajv';

type TaskTagCreateProps = {
	name: string;
	color: string;
	taskPropertyId: string;
};

const TaskTagCreatePropsSchema = {
	type: 'object',
	properties: {
		name: { type: 'string' },
		color: { type: 'string' },
		taskPropertyId: { type: 'string' },
	},
	required: ['name', 'color', 'taskPropertyId'],
};

export const isTaskTagCreateProps = ajv.compile<TaskTagCreateProps>(TaskTagCreatePropsSchema);

type TaskTagUpdateProps = {
	_id: string;
	data: Partial<TaskTagCreateProps>;
};

const TaskTagUpdatePropsSchema = {
	type: 'object',
	properties: {
		_id: { type: 'string' },
		data: { type: 'object', additionalProperties: true },
	},
	required: ['_id', 'data'],
};

export const isTaskTagUpdateProps = ajv.compile<TaskTagUpdateProps>(TaskTagUpdatePropsSchema);
