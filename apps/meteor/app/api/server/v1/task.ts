import type { IUser } from '@rocket.chat/core-typings';
import { Users } from '@rocket.chat/models';

import { db } from '../../../../server/database/utils';
import { TaskRaw } from '../../../../server/models/Task';
import { API } from '../api';
import { getPaginationItems } from '../helpers/getPaginationItems';
import type { ITaskUpdateData } from './rest-typings/task';
import { isTaskCreateProps, isTaskUpdateProps } from './rest-typings/task';
import type { ITask } from '../../../../server/core-typings/ITask';
import type { ITaskTag } from '../../../../server/core-typings/ITaskTag';

const Tasks = new TaskRaw(db);

API.v1.addRoute(
	'tasks.create',
	{ authRequired: true, validateParams: isTaskCreateProps },
	{
		async post() {
			const { title, description, assignees, dueDate, projectId, properties } = this.bodyParams;

			const { userId } = this;
			const username = this.user?.username;
			const task = await Tasks.create({ _id: userId, username }, { title, description, assignees, dueDate, projectId, properties });

			return API.v1.success({ task });
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
			const { _id, payload } = this.bodyParams;

			console.log('taskId', _id);
			console.log('payload', payload);

			if (!payload || typeof payload !== 'object') {
				return API.v1.failure('Invalid payload.');
			}

			const task = await Tasks.findOneById(_id);
			if (!task) {
				return API.v1.notFound('Task not found.');
			}

			const updateData: ITaskUpdateData = {};

			const addField = (fieldName: keyof ITaskUpdateData) => {
				if (payload[fieldName] !== undefined) {
					updateData[fieldName] = payload[fieldName];
				}
			};

			addField('title');
			addField('description');
			addField('assignees');
			addField('dueDate');
			addField('properties');

			if (Object.keys(updateData).length === 0) {
				return API.v1.failure('No fields to update.');
			}

			await Tasks.updateOne({ _id }, { $set: updateData });

			const updatedTask = await Tasks.findOneById(_id);
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

			return API.v1.success({
				tasks,
				count,
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
	'tasks.delete',
	{
		authRequired: true,
	},
	{
		async post() {
			const { _id } = this.bodyParams;
			try {
				await Tasks.deleteOne({ _id });
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
		'/v1/tasks.create': {
			POST: (params: {
				title: string;
				description?: string;
				assignees?: Pick<IUser, '_id' | 'username'>[];
				dueDate?: Date;
				projectId: string;
				properties?: Array<{ taskPropertyId: string; value: ITaskTag['_id'][] }>;
			}) => {
				task: ITask;
			};
		};
		'/v1/tasks.list': {
			GET: (params: { projectId: string; offset?: number; count?: number }) => {
				tasks: ITask[];
				count?: number;
				offset?: number;
				total?: number;
			};
		};
		'/v1/tasks.update': {
			POST: (params: { _id: string; payload: any }) => {
				task: ITask;
			};
		};
		'/v1/tasks.delete': {
			POST: (params: { _id: string }) => {};
		};
	}
}
