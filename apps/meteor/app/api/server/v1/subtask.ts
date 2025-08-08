import type { ISubtask } from '../../../../server/core-typings/ISubtask';
import { db } from '../../../../server/database/utils';
import { SubtaskRaw } from '../../../../server/models/Subtask';
import { TaskRaw } from '../../../../server/models/Task';
import { API } from '../api';

const Subtasks = new SubtaskRaw(db);
const Tasks = new TaskRaw(db);

// 1. Create subtask
API.v1.addRoute(
	'subtasks.create',
	{ authRequired: true },
	{
		async post() {
			const { taskId, title } = this.bodyParams;

			if (!taskId || !title) {
				return API.v1.failure('Missing required fields.');
			}

			// Validate parent task exists
			const task = await Tasks.findOneById(taskId);
			if (!task) {
				return API.v1.notFound('Task not found.');
			}

			// Get next order number
			const lastSubtask = await Subtasks.findOne({ taskId }, { sort: { order: -1 } });
			const order = (lastSubtask?.order || 0) + 1;

			const subtask = await Subtasks.create({
				title: title as string,
				taskId: taskId as string,
				completed: false,
				order,
				createdAt: new Date(),
			});

			// Update task subtask count
			await Tasks.updateOne(
				{ _id: taskId },
				{
					$addToSet: { subtasks: subtask._id },
					$inc: { subtaskCount: 1 },
				},
			);

			return API.v1.success({ subtask });
		},
	},
);

// 2. Update completed status
API.v1.addRoute(
	'subtasks.updateCompleted',
	{ authRequired: true },
	{
		async post() {
			const { _id, completed } = this.bodyParams;

			if (!_id || typeof completed !== 'boolean') {
				return API.v1.failure('Missing required fields.');
			}

			const subtask = await Subtasks.findOneById(_id);
			if (!subtask) {
				return API.v1.notFound('Subtask not found.');
			}

			// Only update count if status actually changed
			if (subtask.completed !== completed) {
				await Subtasks.updateOne({ _id }, { $set: { completed } });
				
				// Update parent task completed count
				await Tasks.updateOne(
					{ _id: subtask.taskId }, 
					{ $inc: { completedSubtaskCount: completed ? 1 : -1 } }
				);
			}

			return API.v1.success();
		},
	},
);

// 3. Update title
API.v1.addRoute(
	'subtasks.updateTitle',
	{ authRequired: true },
	{
		async post() {
			const { _id, title } = this.bodyParams;

			if (!_id || !title) {
				return API.v1.failure('Missing required fields.');
			}

			const subtask = await Subtasks.findOneById(_id);
			if (!subtask) {
				return API.v1.notFound('Subtask not found.');
			}

			await Subtasks.updateOne({ _id }, { $set: { title } });

			return API.v1.success();
		},
	},
);

// 4. Delete subtask
API.v1.addRoute(
	'subtasks.delete',
	{ authRequired: true },
	{
		async post() {
			const { _id } = this.bodyParams;

			if (!_id) {
				return API.v1.failure('Missing subtask ID.');
			}

			const subtask = await Subtasks.findOneById(_id);
			if (!subtask) {
				return API.v1.notFound('Subtask not found.');
			}

			// Update parent task
			const updateQuery: any = {
				$pull: { subtasks: _id },
				$inc: { subtaskCount: -1 },
			};

			if (subtask.completed) {
				updateQuery.$inc.completedSubtaskCount = -1;
			}

			await Tasks.updateOne({ _id: subtask.taskId }, updateQuery);

			await Subtasks.deleteOne({ _id });

			return API.v1.success();
		},
	},
);

// 5. Get subtasks by task
API.v1.addRoute(
	'subtasks.getByTask',
	{ authRequired: true },
	{
		async get() {
			const { taskId } = this.queryParams;

			const subtasks = await Subtasks.find({ taskId }, { sort: { order: 1 } }).toArray();

			return API.v1.success({ subtasks });
		},
	},
);

// 6. Reorder subtasks
API.v1.addRoute(
	'subtasks.reorder',
	{ authRequired: true },
	{
		async post() {
			const { subtaskIds } = this.bodyParams;

			if (!subtaskIds || !Array.isArray(subtaskIds)) {
				return API.v1.failure('Invalid subtask IDs.');
			}

			// Update order for each subtask
			const updates = subtaskIds.map((id, index) => Subtasks.updateOne({ _id: id }, { $set: { order: index + 1 } }));

			await Promise.all(updates);

			return API.v1.success();
		},
	},
);

declare module '@rocket.chat/rest-typings' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface Endpoints {
		'/v1/subtasks.create': {
			POST: (params: { taskId: string; title: string }) => {
				subtask: ISubtask;
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
				subtasks: ISubtask[];
			};
		};
		'/v1/subtasks.reorder': {
			POST: (params: { subtaskIds: string[] }) => void;
		};
	}
}
