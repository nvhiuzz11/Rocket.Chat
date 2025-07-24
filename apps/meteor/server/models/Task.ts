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
		return [{ key: { projectId: 1 } }];
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

	async delete(taskId: string): Promise<void> {
		await this.deleteOne({ _id: taskId });
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
}
