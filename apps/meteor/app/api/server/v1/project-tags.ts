import { db } from '../../../../server/database/utils';
import { ProjectTagRaw } from '../../../../server/models/ProjectTag';
import { API } from '../api';
import { isProjectTagCreateProps, isProjectTagUpdateProps, isProjectTagListProps } from './rest-typings/project-tags';
import type { IProjectTag } from '../../../../server/core-typings/IProjectTag';

const ProjectTag = new ProjectTagRaw(db);

API.v1.addRoute(
	'project-tags.create',
	{
		authRequired: true,
		validateParams: isProjectTagCreateProps,
	},
	{
		async post() {
			const { name, color, projectPropertyId } = this.bodyParams;
			const projectTag = await ProjectTag.create({
				name,
				color,
				projectPropertyId,
			});
			return API.v1.success({ projectTag });
		},
	},
);

API.v1.addRoute(
	'project-tags.list-property-tags',
	{
		authRequired: true,
		validateParams: isProjectTagListProps,
	},
	{
		async get() {
			const { projectPropertyId } = this.queryParams;
			const projectTags = await ProjectTag.findByProjectPropertyId(projectPropertyId);
			return API.v1.success({ projectTags });
		},
	},
);

API.v1.addRoute(
	'project-tags.update',
	{
		authRequired: true,
		validateParams: isProjectTagUpdateProps,
	},
	{
		async post() {
			const { _id, data } = this.bodyParams;
			const result = await ProjectTag.updateOne({ _id }, { $set: data });
			if (result.modifiedCount === 0) {
				return API.v1.failure('Project not found or not updated');
			}
			const project = await ProjectTag.findById(_id);
			return API.v1.success({ project });
		},
	},
);

API.v1.addRoute(
	'project-tags.delete',
	{
		authRequired: true,
	},
	{
		async post() {
			const { _id } = this.bodyParams;
			if (!_id) {
				return API.v1.failure('Project tag ID is required');
			}
			try {
				await ProjectTag.deleteById(_id);
				return API.v1.success();
			} catch (error) {
				return API.v1.failure('Failed to delete project tag');
			}
		},
	},
);

declare module '@rocket.chat/rest-typings' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface Endpoints {
		'/v1/project-tags.create': {
			POST: (params: { name: string; color: string; projectPropertyId: string }) => {
				projectTag: IProjectTag;
			};
		};
		'/v1/project-tags.list-property-tags': {
			GET: (params: { projectPropertyId: string }) => {
				projectTags: IProjectTag[];
			};
		};
		'/v1/project-tags.update': {
			POST: (params: { _id: string; data: Partial<IProjectTag> }) => {
				projectTag: IProjectTag;
			};
		};
		'/v1/project-tags.delete': {
			POST: (params: { _id: string }) => {};
		};
	}
}
