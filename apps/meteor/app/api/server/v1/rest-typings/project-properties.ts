import { ajv } from '../Ajv';

type ProjectPropertyCreateProps = {
	name: string;
	type: string;
	projectId: string;
	order: number;
	value: string;
};

const ProjectPropertyCreatePropsSchema = {
	type: 'object',
	properties: {
		name: { type: 'string' },
		type: { type: 'string' },
		projectId: { type: 'string' },
		order: { type: 'number' },
		value: { type: 'string' },
	},
	required: ['name', 'type', 'projectId', 'value'],
};

export const isProjectPropertyCreateProps = ajv.compile<ProjectPropertyCreateProps>(ProjectPropertyCreatePropsSchema);

type ProjectPropertyUpdateProps = {
	name?: string;
	type?: string;
	projectId?: string;
	order?: number;
	value?: string;
};

const ProjectPropertyUpdatePropsSchema = {
	type: 'object',
	properties: {
		name: { type: 'string' },
		type: { type: 'string' },
		projectId: { type: 'string' },
		order: { type: 'number' },
		value: { type: 'string' },
	},
	required: [],
};

export const isProjectPropertyUpdateProps = ajv.compile<ProjectPropertyUpdateProps>(ProjectPropertyUpdatePropsSchema);
