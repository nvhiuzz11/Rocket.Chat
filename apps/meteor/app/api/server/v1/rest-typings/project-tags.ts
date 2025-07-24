import type { IProjectTag } from '../../../../../server/core-typings/IProjectTag';
import { ajv } from '../Ajv';

type ProjectTagCreateProps = {
	name: string;
	color: string;
	projectPropertyId: string;
};

const ProjectTagCreatePropsSchema = {
	type: 'object',
	properties: {
		name: { type: 'string' },
		color: { type: 'string' },
		projectPropertyId: { type: 'string' },
	},
	required: ['name', 'color', 'projectPropertyId'],
};

export const isProjectTagCreateProps = ajv.compile<ProjectTagCreateProps>(ProjectTagCreatePropsSchema);

type ProjectTagUpdateProps = {
	_id: string;
	data: Partial<IProjectTag>;
};

const ProjectTagUpdatePropsSchema = {
	type: 'object',
	properties: {
		_id: { type: 'string' },
		data: { type: 'object', additionalProperties: true },
	},
	required: ['_id', 'data'],
};

export const isProjectTagUpdateProps = ajv.compile<ProjectTagUpdateProps>(ProjectTagUpdatePropsSchema);

type ProjectTagListProps = {
	projectPropertyId: string;
};

const ProjectTagListPropsSchema = {
	type: 'object',
	properties: {
		projectPropertyId: { type: 'string' },
	},
	required: ['projectPropertyId'],
};

export const isProjectTagListProps = ajv.compile<ProjectTagListProps>(ProjectTagListPropsSchema);
