import { BaseRaw } from '@rocket.chat/models';
import type { Db, IndexDescription } from 'mongodb';

import type { ITaskTag } from '../core-typings/ITaskTag';

export class TaskTagRaw extends BaseRaw<ITaskTag> {
	constructor(db: Db) {
		super(db, 'task_tags');
	}

	protected modelIndexes(): IndexDescription[] {
		return [{ key: { taskId: 1, taskPropertyId: 1 } }];
	}

	async create(data: Omit<ITaskTag, '_id' | '_updatedAt' | 'order'>): Promise<string> {
		const lastTag = await this.findOne({ taskId: data.taskId, taskPropertyId: data.taskPropertyId }, { sort: { order: -1 } });
		const newOrder = (lastTag?.order ?? -1) + 1;
		const result = await this.insertOne({ ...data, order: newOrder });
		return result.insertedId;
	}

	async findById(id: string): Promise<ITaskTag | null> {
		return this.findOne({ _id: id }, { sort: { order: 1 } });
	}

	async findByTaskIdAndPropertyId(taskId: string, taskPropertyId: string): Promise<ITaskTag[]> {
		return this.find({ taskId, taskPropertyId }, { sort: { order: 1 } }).toArray();
	}

	async updateById(id: string, data: Partial<ITaskTag>): Promise<void> {
		await this.updateOne({ _id: id }, { $set: data });
	}

	async deleteById(id: string): Promise<void> {
		await this.deleteOne({ _id: id });
	}
}
