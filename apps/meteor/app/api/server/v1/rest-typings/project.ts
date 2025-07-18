// _id: string;
// name: string;
// description?: string;
// teamId: string;
// roomId: string;
// createdBy: Pick<IUser, '_id' | 'username'>;
// createdAt: Date;

import { ajv } from '../Ajv';

type ProjectCreateProps = {
	name: string;
	description?: string;
	teamId: string;
	roomId: string;
};

const ProjectCreatePropsSchema = {
	type: 'object',
	properties: {
		name: { type: 'string' },
		description: { type: 'string' },
		teamId: { type: 'string' },
		roomId: { type: 'string' },
	},
	required: ['name', 'teamId', 'roomId'],
};

export const isProjectCreateProps = ajv.compile<ProjectCreateProps>(ProjectCreatePropsSchema);

type ProjectUpdateProps = {
	_id: string;
	name?: string;
	description?: string;
	teamId?: string;
	roomId?: string;
};

const ProjectUpdatePropsSchema = {
	type: 'object',
	properties: {
		_id: { type: 'string' },
		name: { type: 'string' },
		description: { type: 'string' },
		teamId: { type: 'string' },
		roomId: { type: 'string' },
	},
	required: ['_id'],
};

export const isProjectUpdateProps = ajv.compile<ProjectUpdateProps>(ProjectUpdatePropsSchema);
