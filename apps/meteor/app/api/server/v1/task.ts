import { API } from '../api';

import { db } from '../../../../server/database/utils';
import { TaskRaw } from '../../../../server/models/Task';
import { getPaginationItems } from '../helpers/getPaginationItems';
import { Users } from '@rocket.chat/models';
import { isTaskCreateProps, isTaskUpdateProps } from './rest-typings/task';
import { DEFAULT_TASK_PROPERTIES } from '../constants/default-data';
import type { ITaskPropertyType } from '../../../../server/core-typings/ITaskProperty';
import { TaskPropertyRaw } from '../../../../server/models/TaskProperty';
import { TaskTagRaw } from '../../../../server/models/TaskTag';

const Tasks = new TaskRaw(db);
const TaskProperty = new TaskPropertyRaw(db);
const TaskTag = new TaskTagRaw(db);

API.v1.addRoute(
	'tasks.create',
	{ authRequired: true, validateParams: isTaskCreateProps },
	{
		async post() {
			const { title, description, assignees, dueDate, projectId } = this.bodyParams;

			const userId = this.userId;
			const username = this.user?.username;
			const task = await Tasks.create({ _id: userId, username }, { title, description, assignees, dueDate, projectId });

			DEFAULT_TASK_PROPERTIES.forEach(async (property) => {
				const propertyId = await TaskProperty.create({
					name: property.name,
					type: property.type as ITaskPropertyType,
					taskId: task._id,
				});

				property.data.forEach(async (tag) => {
					await TaskTag.create({
						name: tag.name,
						color: tag.color,
						taskPropertyId: propertyId,
						taskId: task._id,
					});
				});
			});
			return API.v1.success({ task });
		},
	},
);

API.v1.addRoute(
	'tasks.update',
	{ authRequired: true, validateParams: isTaskUpdateProps },
	{
		async put() {
			const { _id, title, description, assignees, dueDate, projectId } = this.bodyParams;

			const task = await Tasks.findOneById(_id);
			if (!task) {
				return API.v1.notFound('Task not found.');
			}

			const updateData = { title, description, assignees, dueDate, projectId };
			const updatedTask = await Tasks.updateOneById(_id, updateData);

			return API.v1.success({ task: updatedTask });
		},
	},
);

API.v1.addRoute(
	'tasks.list',
	{ authRequired: true },
	{
		async get() {
			const { projectId } = this.queryParams;
			const { offset, count } = await getPaginationItems(this.queryParams);

			const query: any = {};
			if (projectId) {
				query.projectId = projectId;
			}

			const tasks = await Tasks.find(query, {
				skip: offset,
				limit: count,
				sort: { createdAt: -1 },
			}).toArray();
			const total = await Tasks.col.countDocuments(query);

			const userIds = new Set<string>();
			tasks.forEach((task) => {
				userIds.add(task.createdBy._id);
				task.assignees?.forEach((assignee) => userIds.add(assignee._id));
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

			const enrichedTasks = tasks.map((task) => ({
				...task,
				creator: usersMap[task.createdBy._id],
				assignees: task.assignees?.map((assignee) => usersMap[assignee._id]).filter(Boolean) || [],
			}));

			return API.v1.success({
				tasks: enrichedTasks,
				count: enrichedTasks.length,
				offset,
				total,
			});
		},
	},
);

API.v1.addRoute(
	'tasks.info',
	{
		authRequired: true,
	},
	{
		async get() {
			const { taskId } = this.queryParams;
			const task = await Tasks.findOneById(taskId);
			if (!task) {
				return API.v1.failure('Task not found');
			}
			const creator = await Users.findOneById(task.createdBy._id, {
				projection: {
					_id: 1,
					name: 1,
					username: 1,
					emails: 1,
					avatarETag: 1,
				},
			});
			const enrichedTask = {
				...task,
				creator,
			};

			return API.v1.success({ task: enrichedTask });
		},
	},
);

API.v1.addRoute(
	'tasks.update',
	{
		authRequired: true,
		validateParams: isTaskUpdateProps,
	},
	{
		async post() {
			const { taskId, data } = this.bodyParams;
			const result = await Tasks.updateOne({ _id: taskId }, { $set: data });
			if (result.modifiedCount === 0) {
				return API.v1.failure('Task not found or not updated');
			}
			const task = await Tasks.findOneById(taskId);
			return API.v1.success({ task });
		},
	},
);

API.v1.addRoute(
	'tasks.delete',
	{
		authRequired: true,
	},
	{
		async post() {
			const { taskId } = this.bodyParams;
			try {
				await Tasks.deleteOne({ _id: taskId });
				return API.v1.success();
			} catch (error) {
				return API.v1.failure('Failed to delete project');
			}
		},
	},
);
