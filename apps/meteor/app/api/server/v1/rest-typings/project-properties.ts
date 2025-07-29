import type { IProjectProperty } from '../../../../../server/core-typings/IProjectProperty';
import { ajv } from '../Ajv';

type ProjectPropertyCreateProps = {
	name: string;
	type: string;
	teamId: string;
	required: boolean;
	systemKey?: string;
};

const ProjectPropertyCreatePropsSchema = {
	type: 'object',
	properties: {
		name: { type: 'string' },
		type: { type: 'string' },
		teamId: { type: 'string' },
		required: { type: 'boolean' },
		systemKey: { type: 'string' },
	},
	required: ['name', 'type', 'teamId'],
};

export const isProjectPropertyCreateProps = ajv.compile<ProjectPropertyCreateProps>(ProjectPropertyCreatePropsSchema);

type ProjectPropertyUpdateProps = {
	_id: string;
	data: Partial<IProjectProperty>;
};

const ProjectPropertyUpdatePropsSchema = {
	type: 'object',
	properties: {
		_id: { type: 'string' },
		data: { type: 'object', additionalProperties: true },
	},
	required: ['_id', 'data'],
};

export const isProjectPropertyUpdateProps = ajv.compile<ProjectPropertyUpdateProps>(ProjectPropertyUpdatePropsSchema);

type ProjectPropertyDeleteProps = {
	_id: string;
};

const ProjectPropertyDeletePropsSchema = {
	type: 'object',
	properties: {
		_id: { type: 'string' },
	},
	required: ['_id'],
};

export const isProjectPropertyDeleteProps = ajv.compile<ProjectPropertyDeleteProps>(ProjectPropertyDeletePropsSchema);
