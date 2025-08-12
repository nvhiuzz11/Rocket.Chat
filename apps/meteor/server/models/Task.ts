import type { IUser } from '@rocket.chat/core-typings';
import { BaseRaw } from '@rocket.chat/models';
import { Meteor } from 'meteor/meteor';
import type { Db, IndexDescription } from 'mongodb';

import type { ITask } from '../core-typings/ITask';
import type { ITaskTag } from '../core-typings/ITaskTag';

export class TaskRaw extends BaseRaw<ITask> {
	constructor(db: Db) {
		super(db, 'tasks');
	}

	protected modelIndexes(): IndexDescription[] {
		return [{ key: { projectId: 1 } }, { key: { parentTaskId: 1 } }, { key: { projectId: 1, parentTaskId: 1 } }];
	}

	async create(
		creator: { _id: string; username: string },
		taskData: Omit<ITask, '_id' | 'createdAt' | '_updatedAt' | 'createdBy'>,
	): Promise<ITask> {
		const now = new Date();

		const { insertedId } = await this.insertOne({
			...taskData,
			createdAt: now,
			createdBy: creator,
		});

		const task = await this.findOne({ _id: insertedId });
		if (!task) {
			throw new Meteor.Error('error-task-create-failed', 'Failed to create task');
		}
		return task;
	}

	async findById(taskId: string): Promise<ITask | null> {
		return this.findOne({ _id: taskId });
	}

	async updateOneById(taskId: string, data: Partial<Omit<ITask, '_id'>>): Promise<void> {
		await super.updateOne({ _id: taskId }, { $set: { ...data } });
	}

	async updateTaskProperties(taskId: string, properties: Array<{ taskPropertyId: string; value: ITaskTag['_id'][] }>): Promise<void> {
		await this.updateOne({ _id: taskId }, { $set: { properties } });
	}

	async updateTaskProperty(taskId: string, taskPropertyId: string, value: ITaskTag['_id'][]): Promise<void> {
		await this.updateOne({ _id: taskId }, { $set: { [`properties.${taskPropertyId}`]: value } });
	}

	async findByProjectId(projectId: string): Promise<ITask[]> {
		return this.find({ projectId }).toArray();
	}

	async addAssignee(taskId: string, assignee: Pick<IUser, '_id' | 'username'>): Promise<void> {
		await super.updateOne({ _id: taskId }, { $addToSet: { assignees: assignee }, $set: { updatedAt: new Date() } });
	}

	async removeAssignee(taskId: string, userId: string): Promise<void> {
		await super.updateOne({ _id: taskId }, { $pull: { assignees: { _id: userId } }, $set: { updatedAt: new Date() } });
	}

	// Get all main tasks (no parent) for a project
	async findMainTasksByProjectId(projectId: string): Promise<ITask[]> {
		return this.find({
			projectId,
			$or: [{ parentTaskId: { $exists: false } }, { parentTaskId: null }],
		}).toArray();
	}

	// Get all subtasks for a parent task
	async findSubtasksByParentId(parentTaskId: string): Promise<ITask[]> {
		return this.find({ parentTaskId }).toArray();
	}

	// Get task with all its subtasks
	async findTaskWithSubtasks(taskId: string): Promise<ITask & { subtasks?: ITask[] }> {
		const mainTask = await this.findOne({ _id: taskId });
		if (!mainTask) {
			throw new Meteor.Error('error-task-not-found', 'Task not found');
		}

		const subtasks = await this.findSubtasksByParentId(taskId);

		return {
			...mainTask,
			subtasks,
		};
	}

	// Delete task and handle subtasks
	async delete(taskId: string): Promise<void> {
		// Delete all subtasks first
		await this.deleteMany({ parentTaskId: taskId });

		// Delete the main task
		await this.deleteOne({ _id: taskId });
	}

	// Move task to different parent or make it a main task
	async moveTask(taskId: string, newParentTaskId?: string): Promise<void> {
		await this.updateOne(
			{ _id: taskId },
			{
				$set: {
					parentTaskId: newParentTaskId || undefined,
					_updatedAt: new Date(),
				},
			},
		);
	}
}
