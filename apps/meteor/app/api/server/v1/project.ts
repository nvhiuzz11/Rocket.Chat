import { Users } from '@rocket.chat/models';
import { db } from '../../../../server/database/utils';
import { ProjectRaw } from '../../../../server/models/Project';
import { ProjectPropertyRaw } from '../../../../server/models/ProjectProperty';
import { API } from '../api';
import { getPaginationItems } from '../helpers/getPaginationItems';
import { isProjectCreateProps, isProjectUpdateProps } from './rest-typings/project';
import { DEFAULT_PROJECT_PROPERTIES } from '../constants/default-data';
import type { IProjectPropertyType } from '../../../../server/core-typings/IProjectProperty';
import { ProjectTagRaw } from '../../../../server/models/ProjectTag';

const Project = new ProjectRaw(db);
const ProjectProperty = new ProjectPropertyRaw(db);
const ProjectTag = new ProjectTagRaw(db);

API.v1.addRoute(
	'projects.create',
	{
		authRequired: true,
		validateParams: isProjectCreateProps,
	},
	{
		async post() {
			const { name, description, teamId, roomId } = this.bodyParams;
			const userId = this.userId;
			const username = this.user?.username;
			const project = await Project.createProject({ _id: userId, username }, { name, description, teamId, roomId });

			DEFAULT_PROJECT_PROPERTIES.forEach(async (property) => {
				const propertyId = await ProjectProperty.create({
					name: property.name,
					type: property.type as IProjectPropertyType,
					projectId: project._id,
				});

				property.data.forEach(async (tag) => {
					await ProjectTag.create({
						name: tag.name,
						color: tag.color,
						projectPropertyId: propertyId,
						projectId: project._id,
					});
				});
			});

			return API.v1.success({ project });
		},
	},
);

API.v1.addRoute(
	'projects.list',
	{ authRequired: true },
	{
		async get() {
			try {
				const { offset, count } = await getPaginationItems(this.queryParams);
				const { sort = { _updatedAt: -1 } } = this.queryParams;

				const { cursor, totalCount } = await Project.findPaginated(
					{},
					{
						sort,
						skip: offset,
						limit: count,
					},
				);

				const [projects, total] = await Promise.all([cursor.toArray(), totalCount]);

				const userIds = new Set<string>();
				projects.forEach((project) => {
					userIds.add(project.createdBy._id);
				});

				const users = await Users.findByIds(Array.from(userIds), {
					projection: {
						_id: 1,
						name: 1,
						username: 1,
						emails: 1,
						avatarETag: 1,
					},
				}).toArray();

				const usersMap = users.reduce((acc: Record<string, any>, user) => {
					acc[user._id] = {
						_id: user._id,
						name: user.name,
						username: user.username,
						emails: user.emails,
						avatarETag: user.avatarETag,
					};
					return acc;
				}, {});

				const enrichedProjects = projects.map((project) => ({
					...project,
					createdBy: usersMap[project.createdBy._id],
				}));

				return API.v1.success({
					success: true,
					projects: enrichedProjects,
					count: projects.length,
					offset,
					total,
				});
			} catch (error) {
				return API.v1.failure('Failed to retrieve projects', error);
			}
		},
	},
);

API.v1.addRoute(
	'projects.info',
	{
		authRequired: true,
	},
	{
		async get() {
			const { projectId } = this.queryParams;
			const project = await Project.findOneById(projectId);
			if (!project) {
				return API.v1.failure('Project not found');
			}
			const creator = await Users.findOneById(project.createdBy._id, {
				projection: {
					_id: 1,
					name: 1,
					username: 1,
					emails: 1,
					avatarETag: 1,
				},
			});
			const enrichedProject = {
				...project,
				createdBy: creator,
			};

			return API.v1.success({ project: enrichedProject });
		},
	},
);

API.v1.addRoute(
	'projects.update',
	{
		authRequired: true,
		validateParams: isProjectUpdateProps,
	},
	{
		async post() {
			const { projectId, data } = this.bodyParams;
			const result = await Project.updateOne({ _id: projectId }, { $set: data });
			if (result.modifiedCount === 0) {
				return API.v1.failure('Project not found or not updated');
			}
			const project = await Project.getProjectById(projectId);
			return API.v1.success({ project });
		},
	},
);

API.v1.addRoute(
	'projects.delete',
	{
		authRequired: true,
	},
	{
		async post() {
			const { projectId } = this.bodyParams;
			try {
				await Project.deleteProject(projectId);
				return API.v1.success();
			} catch (error) {
				return API.v1.failure('Failed to delete project');
			}
		},
	},
);
