import type { ITask } from '../../../../server/core-typings/ITask';
import { db } from '../../../../server/database/utils';
import { TaskRaw } from '../../../../server/models/Task';
import { API } from '../api';

const Tasks = new TaskRaw(db);

API.v1.addRoute(
	'subtasks.create',
	{ authRequired: true },
	{
		async post() {
			const { taskId, title } = this.bodyParams;

			if (!taskId || !title) {
				return API.v1.failure('Missing required fields.');
			}

			const parentTask = await Tasks.findOneById(taskId);
			if (!parentTask) {
				return API.v1.notFound('Parent task not found.');
			}

			const subtask = await Tasks.create(
				{ _id: this.userId!, username: this.user.username! },
				{
					title: title as string,
					projectId: parentTask.projectId,
					parentTaskId: taskId as string,
					isComplete: false,
				},
			);

			return API.v1.success({ subtask });
		},
	},
);

API.v1.addRoute(
	'subtasks.updateCompleted',
	{ authRequired: true },
	{
		async post() {
			const { _id, completed } = this.bodyParams;

			if (!_id || typeof completed !== 'boolean') {
				return API.v1.failure('Missing required fields.');
			}

			const task = await Tasks.findOneById(_id);
			if (!task) {
				return API.v1.notFound('Task not found.');
			}

			if (!task.parentTaskId) {
				return API.v1.failure('This is not a subtask.');
			}

			await Tasks.updateOneById(_id, {
				isComplete: completed,
			});

			return API.v1.success();
		},
	},
);

API.v1.addRoute(
	'subtasks.updateTitle',
	{ authRequired: true },
	{
		async post() {
			const { _id, title } = this.bodyParams;

			if (!_id || !title) {
				return API.v1.failure('Missing required fields.');
			}

			const task = await Tasks.findOneById(_id);
			if (!task) {
				return API.v1.notFound('Task not found.');
			}

			// Ensure this is a subtask
			if (!task.parentTaskId) {
				return API.v1.failure('This is not a subtask.');
			}

			await Tasks.updateOneById(_id, { title });

			return API.v1.success();
		},
	},
);

API.v1.addRoute(
	'subtasks.delete',
	{ authRequired: true },
	{
		async post() {
			const { _id } = this.bodyParams;

			if (!_id) {
				return API.v1.failure('Missing subtask ID.');
			}

			const task = await Tasks.findOneById(_id);
			if (!task) {
				return API.v1.notFound('Task not found.');
			}

			// Ensure this is a subtask
			if (!task.parentTaskId) {
				return API.v1.failure('This is not a subtask.');
			}

			await Tasks.delete(_id);

			return API.v1.success();
		},
	},
);

API.v1.addRoute(
	'subtasks.getByTask',
	{ authRequired: true },
	{
		async get() {
			const { taskId } = this.queryParams;

			const subtasks = await Tasks.findSubtasksByParentId(taskId as string);

			return API.v1.success({ subtasks });
		},
	},
);

API.v1.addRoute(
	'subtasks.move',
	{ authRequired: true },
	{
		async post() {
			const { taskId, newParentTaskId } = this.bodyParams;

			if (!taskId) {
				return API.v1.failure('Missing task ID.');
			}

			const task = await Tasks.findOneById(taskId);
			if (!task) {
				return API.v1.notFound('Task not found.');
			}

			await Tasks.moveTask(taskId, newParentTaskId);

			return API.v1.success();
		},
	},
);

declare module '@rocket.chat/rest-typings' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface Endpoints {
		'/v1/subtasks.create': {
			POST: (params: { taskId: string; title: string }) => {
				subtask: ITask;
			};
		};
		'/v1/subtasks.updateCompleted': {
			POST: (params: { _id: string; completed: boolean }) => void;
		};
		'/v1/subtasks.updateTitle': {
			POST: (params: { _id: string; title: string }) => void;
		};
		'/v1/subtasks.delete': {
			POST: (params: { _id: string }) => void;
		};
		'/v1/subtasks.getByTask': {
			GET: (params: { taskId: string }) => {
				subtasks: ITask[];
			};
		};
		'/v1/subtasks.move': {
			POST: (params: { taskId: string; newParentTaskId?: string }) => void;
		};
	}
}
