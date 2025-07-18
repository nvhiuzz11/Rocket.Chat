import { ajv } from '../Ajv';

type ProjectTagCreateProps = {
	name: string;
	color: string;
	projectId: string;
	projectPropertyId: string;
};

const ProjectTagCreatePropsSchema = {
	type: 'object',
	properties: {
		name: { type: 'string' },
		color: { type: 'string' },
		projectId: { type: 'string' },
		projectPropertyId: { type: 'string' },
	},
	required: ['name', 'color', 'projectId', 'projectPropertyId'],
};

export const isProjectTagCreateProps = ajv.compile<ProjectTagCreateProps>(ProjectTagCreatePropsSchema);

type ProjectTagUpdateProps = {
	_id: string;
	name?: string;
	color?: string;
	projectId?: string;
	projectPropertyId?: string;
};

const ProjectTagUpdatePropsSchema = {
	type: 'object',
	properties: {
		_id: { type: 'string' },
		name: { type: 'string' },
		color: { type: 'string' },
		projectId: { type: 'string' },
		projectPropertyId: { type: 'string' },
	},
	required: ['_id'],
};

export const isProjectTagUpdateProps = ajv.compile<ProjectTagUpdateProps>(ProjectTagUpdatePropsSchema);

type ProjectTagListProps = {
	projectId: string;
	projectPropertyId: string;
};

const ProjectTagListPropsSchema = {
	type: 'object',
	properties: {
		projectId: { type: 'string' },
		projectPropertyId: { type: 'string' },
	},
	required: ['projectId', 'projectPropertyId'],
};

export const isProjectTagListProps = ajv.compile<ProjectTagListProps>(ProjectTagListPropsSchema);
