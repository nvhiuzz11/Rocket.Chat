import { Rooms, Users } from '@rocket.chat/models';

import type { IProject } from '../../../../server/core-typings/IProject';
import { db } from '../../../../server/database/utils';
import { ProjectRaw } from '../../../../server/models/Project';
import { TaskPropertyRaw } from '../../../../server/models/TaskProperty';
import { TaskTagRaw } from '../../../../server/models/TaskTag';
import { API } from '../api';
import { getPaginationItems } from '../helpers/getPaginationItems';
import { isProjectCreateProps, isProjectUpdateProps } from './rest-typings/project';
import { DEFAULT_TASK_PROPERTIES } from '../constants/default-data';
import { ProjectPropertyRaw } from '../../../../server/models/ProjectProperty';
import { ProjectTagRaw } from '../../../../server/models/ProjectTag';
import { IProjectTag } from '/server/core-typings/IProjectTag';
import { IProjectProperty } from '/server/core-typings/IProjectProperty';
import { IRoom } from '@rocket.chat/core-typings';

const Project = new ProjectRaw(db);
const ProjectProperty = new ProjectPropertyRaw(db);
const ProjectTag = new ProjectTagRaw(db);
const TaskProperty = new TaskPropertyRaw(db);
const TaskTag = new TaskTagRaw(db);

API.v1.addRoute(
	'projects.create',
	{
		authRequired: true,
		validateParams: isProjectCreateProps,
	},
	{
		async post() {
			const { name, description, teamId, roomId, properties } = this.bodyParams;
			const userId = this?.userId;
			const username = this.user?.username;
			const project = await Project.createProject({ _id: userId, username }, { name, description, teamId, roomId, properties });

			DEFAULT_TASK_PROPERTIES.forEach(async (property) => {
				const propertyId = await TaskProperty.create({
					name: property.name,
					type: property.type,
					projectId: project._id,
					required: property.required,
					systemKey: property?.systemKey ?? null,
				});

				property.data.forEach(async (tag) => {
					await TaskTag.create({
						name: tag.name,
						color: tag.color,
						taskPropertyId: propertyId,
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

// export interface IProject extends IRocketChatRecord {
// 	name: string;
// 	description?: string;
// 	teamId: string;
// 	roomId: string;
// 	createdBy: Pick<IUser, '_id' | 'username'>;
// 	createdAt: Date;
// 	properties?: Array<{ propertyId: string; value: IProjectTag['_id'][] }>;
// }

API.v1.addRoute(
	'projects.list.team',
	{
		authRequired: true,
	},
	{
		async get() {
			const { teamId } = this.queryParams;
			const projects = await Project.find({ teamId }).toArray();

			// Fetch all rooms in parallel
			const projectsWithRooms = await Promise.all(
				projects.map(async (project) => {
					const room = await Rooms.findOneById(project.roomId);
					return {
						...project,
						room,
					} as IProject & { room: IRoom | null };
				}),
			);

			return API.v1.success({
				projects: projectsWithRooms,
			});

			// const userIds = new Set<string>();
			// projects.forEach((project) => {
			// 	userIds.add(project.createdBy._id);
			// });

			// const users = await Users.findByIds(Array.from(userIds), {
			// 	projection: {
			// 		_id: 1,
			// 		name: 1,
			// 		username: 1,
			// 		emails: 1,
			// 		avatarETag: 1,
			// 	},
			// }).toArray();

			// const usersMap = users.reduce((acc: Record<string, any>, user) => {
			// 	acc[user._id] = {
			// 		_id: user._id,
			// 		name: user.name,
			// 		username: user.username,
			// 		emails: user.emails,
			// 		avatarETag: user.avatarETag,
			// 	};
			// 	return acc;
			// }, {});

			// const enrichedProjects = projects.map((project) => ({
			// 	...project,
			// 	createdBy: usersMap[project.createdBy._id],
			// }));
		},
	},
);

// API.v1.addRoute(
// 	'projects.list.team',
// 	{
// 		authRequired: true,
// 	},
// 	{
// 		async get() {
// 			const { teamId } = this.queryParams;
// 			const projects = await Project.find({ teamId }).toArray();

// 			const userIds = new Set<string>();
// 			projects.forEach((project) => {
// 				userIds.add(project.createdBy._id);
// 			});

// 			const users = await Users.findByIds(Array.from(userIds), {
// 				projection: {
// 					_id: 1,
// 					name: 1,
// 					username: 1,
// 					emails: 1,
// 					avatarETag: 1,
// 				},
// 			}).toArray();

// 			const usersMap = users.reduce((acc: Record<string, any>, user) => {
// 				acc[user._id] = {
// 					_id: user._id,
// 					name: user.name,
// 					username: user.username,
// 					emails: user.emails,
// 					avatarETag: user.avatarETag,
// 				};
// 				return acc;
// 			}, {});

// 			// Collect all unique property IDs and tag IDs from all projects
// 			const allPropertyIds = new Set<string>();
// 			const allTagIds = new Set<string>();

// 			projects.forEach((project) => {
// 				project.properties?.forEach((prop) => {
// 					allPropertyIds.add(prop.propertyId);
// 					prop.value.forEach((tagId) => allTagIds.add(tagId));
// 				});
// 			});

// 			// Fetch the property and tag details
// 			const projectProperties = await ProjectProperty.find({ _id: { $in: Array.from(allPropertyIds) } }).toArray();
// 			const projectTags = await ProjectTag.find({ _id: { $in: Array.from(allTagIds) } }).toArray();

// 			// Create maps for quick lookup
// 			const propertiesMap = projectProperties.reduce((acc: Record<string, IProjectProperty>, property) => {
// 				acc[property._id] = property;
// 				return acc;
// 			}, {});

// 			const tagsMap = projectTags.reduce((acc: Record<string, IProjectTag>, tag) => {
// 				acc[tag._id] = tag;
// 				return acc;
// 			}, {});

// 			const enrichedProjects = projects.map((project) => ({
// 				...project,
// 				createdBy: usersMap[project.createdBy._id],
// 				properties:
// 					project.properties?.map((prop) => ({
// 						property: propertiesMap[prop.propertyId],
// 						value: prop.value.map((tagId) => tagsMap[tagId]).filter(Boolean),
// 					})) || [],
// 			}));

// 			return API.v1.success({ projects: enrichedProjects });
// 		},
// 	},
// );

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
			const { _id, data } = this.bodyParams;

			if (!_id) {
				return API.v1.failure('Project ID is required');
			}

			const result = await Project.updateOne({ _id }, { $set: data });
			if (result.modifiedCount === 0) {
				return API.v1.failure('Project not found or not updated');
			}
			const project = await Project.getProjectById(_id);
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
			const { _id } = this.bodyParams;

			if (!_id) {
				return API.v1.failure('Project ID is required');
			}

			try {
				await Project.deleteProject(_id);
				return API.v1.success();
			} catch (error) {
				return API.v1.failure('Failed to delete project');
			}
		},
	},
);

declare module '@rocket.chat/rest-typings' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface Endpoints {
		'/v1/projects.create': {
			POST: (params: {
				name: string;
				description: string;
				teamId: string;
				roomId: string;
				properties: { propertyId: string; value: string[] }[];
			}) => {
				project: IProject;
			};
		};

		'/v1/projects.list': {
			GET: () => {
				projects: IProject[];
				count: number;
				offset: number;
				total: number;
			};
		};
		'/v1/projects.list.team': {
			GET: (params: { teamId: string }) => {
				projects: Array<IProject & { room: IRoom | null }>;
			};
		};
		'/v1/projects.info': {
			GET: (params: { _id: string }) => {
				project: IProject;
			};
		};
		'/v1/projects.update': {
			POST: (params: { _id: string; data: Partial<IProject> }) => {
				project: IProject;
			};
		};
		'/v1/projects.delete': {
			POST: (params: { _id: string }) => {};
		};
	}
}
