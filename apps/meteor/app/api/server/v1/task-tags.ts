import { db } from '../../../../server/database/utils';
import { TaskTagRaw } from '../../../../server/models/TaskTag';
import { API } from '../api';
import { isTaskTagCreateProps, isTaskTagUpdateProps } from './rest-typings/task-tags';

const TaskTag = new TaskTagRaw(db);

API.v1.addRoute(
	'task-tags.create',
	{
		authRequired: true,
		validateParams: isTaskTagCreateProps,
	},
	{
		async post() {
			const { name, color, taskId, taskPropertyId } = this.bodyParams;
			const taskTag = await TaskTag.create({
				name,
				color,
				taskId,
				taskPropertyId,
			});
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
			const { taskId, taskPropertyId } = this.queryParams;
			const taskTags = await TaskTag.findByTaskIdAndPropertyId(taskId, taskPropertyId);
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
			const { taskTagId, data } = this.bodyParams;
			const result = await TaskTag.updateOne({ _id: taskTagId }, { $set: data });
			if (result.modifiedCount === 0) {
				return API.v1.failure('Task not found or not updated');
			}
			const task = await TaskTag.findById(taskTagId);
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
			const { taskTagId } = this.bodyParams;
			try {
				await TaskTag.deleteById(taskTagId);
				return API.v1.success();
			} catch (error) {
				return API.v1.failure('Failed to delete task tag');
			}
		},
	},
);
