import type { IRoom } from '@rocket.chat/core-typings';
import { Rooms, Users } from '@rocket.chat/models';

import { isProjectCreateProps, isProjectUpdateProps } from './rest-typings/project';
import type { IProject } from '../../../../server/core-typings/IProject';
import { db, client } from '../../../../server/database/utils';
import { ProjectRaw } from '../../../../server/models/Project';
import { TaskRaw } from '../../../../server/models/Task';
import { TaskPropertyRaw } from '../../../../server/models/TaskProperty';
import { TaskTagRaw } from '../../../../server/models/TaskTag';
import { API } from '../api';
import { DEFAULT_TASK_PROPERTIES } from '../constants/default-data';
import { getPaginationItems } from '../helpers/getPaginationItems';

const Project = new ProjectRaw(db);
const TaskProperty = new TaskPropertyRaw(db);
const TaskTag = new TaskTagRaw(db);
const Task = new TaskRaw(db);

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

			for (const property of DEFAULT_TASK_PROPERTIES) {
				// eslint-disable-next-line no-await-in-loop
				const propertyId = await TaskProperty.create({
					name: property.name,
					type: property.type,
					projectId: project._id,
					required: property.required,
					systemKey: property?.systemKey ?? null,
				});

				for (const tag of property.data) {
					// eslint-disable-next-line no-await-in-loop
					await TaskTag.create({
						name: tag.name,
						color: tag.color,
						taskPropertyId: propertyId,
					});
				}
			}

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
			} catch (error: any) {
				return API.v1.failure('Failed to retrieve projects', error);
			}
		},
	},
);

API.v1.addRoute(
	'projects.list.team',
	{
		authRequired: true,
	},
	{
		async get() {
			const { teamId, search } = this.queryParams;
			const query: any = { teamId };

			if (search?.trim()) {
				query.$or = [
					{ name: { $regex: search.trim(), $options: 'i' } },
					{ description: { $regex: search.trim(), $options: 'i' } },
					{ 'createdBy.username': { $regex: search.trim(), $options: 'i' } },
				];
			}

			const projects = await Project.find(query).toArray();

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
		},
	},
);

API.v1.addRoute(
	'projects.info.byRoom',
	{
		authRequired: true,
	},
	{
		async get() {
			const { roomId } = this.queryParams;
			const project = await Project.findOne({ roomId });
			return API.v1.success({ project });
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

			const project = await Project.findOne({ _id });
			if (!project) {
				return API.v1.failure('Project not found');
			}

			try {
				const session = await client.startSession();

				await session.withTransaction(async () => {
					const tasks = await Task.find({ projectId: _id }, { projection: { _id: 1, properties: 1 } }).toArray();

					if (tasks.length > 0) {
						const taskIds = tasks.map((task) => task._id);

						const propertyIds = [];
						const tagIds = [];

						for (const task of tasks) {
							if (task.properties && task.properties.length > 0) {
								task.properties.forEach((property) => {
									if (property.taskPropertyId) {
										propertyIds.push(property.taskPropertyId);
									}
									if (property.value) {
										tagIds.push(property.value);
									}
								});
							}
						}

						const deletePromises = [];

						if (propertyIds.length > 0) {
							deletePromises.push(TaskProperty.deleteMany({ _id: { $in: propertyIds } }, { session }));
						}

						if (tagIds.length > 0) {
							deletePromises.push(TaskTag.deleteMany({ _id: { $in: tagIds } }, { session }));
						}

						deletePromises.push(Task.deleteMany({ _id: { $in: taskIds } }));

						await Promise.all(deletePromises);
					}

					await Project.deleteOne({ _id }, { session });
				});

				await session.endSession();
				return API.v1.success();
			} catch (error) {
				console.error('Project deletion error:', error);
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
			GET: (params: { teamId: string; search?: string }) => {
				projects: Array<IProject & { room: IRoom | null }>;
			};
		};
		'/v1/projects.info.byRoom': {
			GET: (params: { roomId: string }) => {
				project: IProject;
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
