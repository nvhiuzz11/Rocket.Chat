import { db } from '../../../../server/database/utils';
import { ProjectTagRaw } from '../../../../server/models/ProjectTag';
import { API } from '../api';
import { isProjectTagCreateProps, isProjectTagUpdateProps, isProjectTagListProps } from './rest-typings/project-tags';

const ProjectTag = new ProjectTagRaw(db);

API.v1.addRoute(
	'project-tags.create',
	{
		authRequired: true,
		validateParams: isProjectTagCreateProps,
	},
	{
		async post() {
			const { name, color, projectId, projectPropertyId } = this.bodyParams;
			const projectTag = await ProjectTag.create({
				name,
				color,
				projectId,
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
			const { projectId, projectPropertyId } = this.queryParams;
			const projectTags = await ProjectTag.findByProjectIdAndPropertyId(projectId, projectPropertyId);
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
			const { projectTagId, data } = this.bodyParams;
			const result = await ProjectTag.updateOne({ _id: projectTagId }, { $set: data });
			if (result.modifiedCount === 0) {
				return API.v1.failure('Project not found or not updated');
			}
			const project = await ProjectTag.findById(projectTagId);
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
			const { projectTagId } = this.bodyParams;
			try {
				await ProjectTag.deleteById(projectTagId);
				return API.v1.success();
			} catch (error) {
				return API.v1.failure('Failed to delete project tag');
			}
		},
	},
);
