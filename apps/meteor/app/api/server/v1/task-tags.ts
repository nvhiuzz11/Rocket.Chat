import { db } from '../../../../server/database/utils';
import { TaskTagRaw } from '../../../../server/models/TaskTag';
import { API } from '../api';
import { isTaskTagCreateProps, isTaskTagUpdateProps } from './rest-typings/task-tags';
import type { ITaskTag } from '../../../../server/core-typings/ITaskTag';

const TaskTag = new TaskTagRaw(db);

API.v1.addRoute(
	'task-tags.create',
	{
		authRequired: true,
		validateParams: isTaskTagCreateProps,
	},
	{
		async post() {
			const { value, color, taskPropertyId } = this.bodyParams;
			const taskTagId = await TaskTag.create({
				value,
				color,
				taskPropertyId,
			});
			const taskTag = await TaskTag.findById(taskTagId);
			return API.v1.success({ taskTag });
		},
	},
);

API.v1.addRoute(
	'task-tags.list',
	{
		authRequired: true,
	},
	{
		async get() {
			const { taskPropertyId } = this.queryParams;
			const taskTags = await TaskTag.findByPropertyId(taskPropertyId);
			return API.v1.success({ taskTags });
		},
	},
);

API.v1.addRoute(
	'task-tags.update',
	{
		authRequired: true,
		validateParams: isTaskTagUpdateProps,
	},
	{
		async post() {
			const { _id, data } = this.bodyParams;
			const result = await TaskTag.updateOne({ _id }, { $set: data });
			if (result.modifiedCount === 0) {
				return API.v1.failure('Task not found or not updated');
			}
			const task = await TaskTag.findById(_id);
			return API.v1.success({ task });
		},
	},
);

API.v1.addRoute(
	'task-tags.delete',
	{
		authRequired: true,
	},
	{
		async post() {
			const { _id } = this.bodyParams;
			if (!_id) {
				return API.v1.failure('Task tag ID is required');
			}
			try {
				await TaskTag.deleteById(_id);
				return API.v1.success();
			} catch (error) {
				return API.v1.failure('Failed to delete task tag');
			}
		},
	},
);

API.v1.addRoute(
	'task-tags.updateOrder',
	{
		authRequired: true,
	},
	{
		async post() {
			const { tags } = this.bodyParams;
			if (!tags || !Array.isArray(tags)) {
				return API.v1.failure('Tags array is required');
			}
			try {
				for (const tag of tags) {
					// eslint-disable-next-line no-await-in-loop
					await TaskTag.updateOne({ _id: tag._id }, { $set: { order: tag.order } });
				}
				return API.v1.success();
			} catch (error) {
				return API.v1.failure('Failed to update tag orders');
			}
		},
	},
);

declare module '@rocket.chat/rest-typings' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface Endpoints {
		'/v1/task-tags.create': {
			POST: (params: { value: string; color: string; taskPropertyId: string }) => {
				taskTag: ITaskTag;
			};
		};
		'/v1/task-tags.list': {
			GET: (params: { taskPropertyId: string }) => {
				taskTags: ITaskTag[];
			};
		};
		'/v1/task-tags.update': {
			POST: (params: { _id: string; data: Partial<ITaskTag> }) => {
				taskTag: ITaskTag;
			};
		};
		'/v1/task-tags.delete': {
			POST: (params: { _id: string }) => Record<string, never>;
		};
		'/v1/task-tags.updateOrder': {
			POST: (params: { tags: { _id: string; order: number }[] }) => Record<string, never>;
		};
	}
}
