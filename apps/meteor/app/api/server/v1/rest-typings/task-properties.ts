import { ajv } from '../Ajv';

type TaskPropertyCreateProps = {
	name: string;
	type: string;
	taskId: string;
	order: number;
	value: string;
};

const TaskPropertyCreatePropsSchema = {
	type: 'object',
	properties: {
		name: { type: 'string' },
		type: { type: 'string' },
		taskId: { type: 'string' },
		order: { type: 'number' },
		value: { type: 'string' },
	},
	required: ['name', 'type', 'taskId', 'value'],
};

export const isTaskPropertyCreateProps = ajv.compile<TaskPropertyCreateProps>(TaskPropertyCreatePropsSchema);

type TaskPropertyUpdateProps = {
	name?: string;
	type?: string;
	taskId?: string;
	order?: number;
	value?: string;
};

const TaskPropertyUpdatePropsSchema = {
	type: 'object',
	properties: {
		name: { type: 'string' },
		type: { type: 'string' },
		taskId: { type: 'string' },
		order: { type: 'number' },
		value: { type: 'string' },
	},
	required: [],
};

export const isTaskPropertyUpdateProps = ajv.compile<TaskPropertyUpdateProps>(TaskPropertyUpdatePropsSchema);
