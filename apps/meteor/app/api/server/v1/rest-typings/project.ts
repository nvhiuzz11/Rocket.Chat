import type { IProject } from '../../../../../server/core-typings/IProject';
import type { IProjectTag } from '../../../../../server/core-typings/IProjectTag';
import { ajv } from '../Ajv';

type ProjectCreateProps = {
	name: string;
	description?: string;
	teamId: string;
	roomId: string;
	properties?: Array<{ propertyId: string; value: IProjectTag['_id'][] }>;
};

const ProjectCreatePropsSchema = {
	type: 'object',
	properties: {
		name: { type: 'string' },
		description: { type: 'string' },
		teamId: { type: 'string' },
		roomId: { type: 'string' },
		properties: {
			type: 'array',
			items: {
				type: 'object',
				properties: {
					propertyId: { type: 'string' },
					value: { type: 'array', items: { type: 'string' } },
				},
				required: ['propertyId', 'value'],
			},
		},
	},
	required: ['name', 'teamId', 'roomId'],
};

export const isProjectCreateProps = ajv.compile<ProjectCreateProps>(ProjectCreatePropsSchema);

type ProjectUpdateProps = {
	_id: string;
	data: Partial<IProject & { properties?: Array<{ propertyId: string; value: IProjectTag['_id'][] }> }>;
};

const ProjectUpdatePropsSchema = {
	type: 'object',
	properties: {
		_id: { type: 'string' },
		data: { type: 'object', additionalProperties: true },
	},
	required: ['_id', 'data'],
};

export const isProjectUpdateProps = ajv.compile<ProjectUpdateProps>(ProjectUpdatePropsSchema);
