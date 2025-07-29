import { db } from '../../../../server/database/utils';
import { ProjectPropertyRaw } from '../../../../server/models/ProjectProperty';
import { ProjectTagRaw } from '../../../../server/models/ProjectTag';
import { API } from '../api';
import {
	isProjectPropertyCreateProps,
	isProjectPropertyDeleteProps,
	isProjectPropertyUpdateProps,
} from './rest-typings/project-properties';
import type { IProjectProperty } from '../../../../server/core-typings/IProjectProperty';
import type { IProjectTag } from '../../../../server/core-typings/IProjectTag';

const ProjectProperty = new ProjectPropertyRaw(db);
const ProjectTag = new ProjectTagRaw(db);

API.v1.addRoute(
	'project-properties.create',
	{
		authRequired: true,
		validateParams: isProjectPropertyCreateProps,
	},
	{
		async post() {
			const { name, type, teamId, required = false, systemKey } = this.bodyParams;
			const projectProperty = await ProjectProperty.create({
				name,
				type,
				teamId,
				required,
				systemKey,
			});
			return API.v1.success({ projectProperty });
		},
	},
);

API.v1.addRoute(
	'project-properties.list',
	{
		authRequired: true,
	},
	{
		async get() {
			const { teamId } = this.queryParams;

			if (!teamId) {
				return API.v1.failure('Team ID is required');
			}

			const projectProperties = await ProjectProperty.findByTeamId(teamId);

			const processedProperties = await Promise.all(
				projectProperties.map(async (property) => {
					const tags = await ProjectTag.findByProjectPropertyId(property._id);
					return { ...property, value: tags };
				}),
			);

			return API.v1.success({ projectProperties: processedProperties });
		},
	},
);

API.v1.addRoute(
	'project-properties.update',
	{
		authRequired: true,
		validateParams: isProjectPropertyUpdateProps,
	},
	{
		async post() {
			const { _id, data } = this.bodyParams;
			const result = await ProjectProperty.updateById(_id, data);
			return API.v1.success({ projectProperty: result });
		},
	},
);

API.v1.addRoute(
	'project-properties.delete',
	{
		authRequired: true,
		validateParams: isProjectPropertyDeleteProps,
	},
	{
		async post() {
			const { _id } = this.bodyParams;
			const result = await ProjectProperty.deleteById(_id);
			return API.v1.success({ projectProperty: result });
		},
	},
);

declare module '@rocket.chat/rest-typings' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface Endpoints {
		'/v1/project-properties.create': {
			POST: (params: { teamId: string; name: string; type: string; required?: boolean; systemKey?: string }) => {
				projectProperty: IProjectProperty;
			};
		};
		'/v1/project-properties.list': {
			GET: (params: { teamId: string }) => {
				projectProperties: { projectProperties: IProjectProperty[] & { value: IProjectTag[] } };
			};
		};
		'/v1/project-properties.update': {
			POST: (params: { _id: string; data: Partial<IProjectProperty> }) => {
				projectProperty: IProjectProperty;
			};
		};
		'/v1/project-properties.delete': {
			POST: (params: { _id: string }) => {
				projectProperty: IProjectProperty;
			};
		};
	}
}
