import { BaseRaw } from '@rocket.chat/models';
import type { Db, IndexDescription } from 'mongodb';

import type { ITaskProperty } from '../core-typings/ITaskProperty';
import type { ITaskTag } from '../core-typings/ITaskTag';

export class TaskPropertyRaw extends BaseRaw<ITaskProperty> {
	constructor(db: Db) {
		super(db, 'task_properties');
	}

	protected modelIndexes(): IndexDescription[] {
		return [{ key: { projectId: 1 } }];
	}

	async create(data: Omit<ITaskProperty, '_id' | '_updatedAt' | 'order'>): Promise<string> {
		const lastProperty = await this.findOne({ projectId: data.projectId }, { sort: { order: -1 } });
		const newOrder = (lastProperty?.order ?? -1) + 1;
		const result = await this.insertOne({ ...data, order: newOrder });
		return result.insertedId;
	}

	async findById(id: string): Promise<ITaskProperty | null> {
		return this.findOne({ _id: id });
	}

	async findByProjectId(projectId: string): Promise<ITaskProperty[]> {
		return this.find({ projectId }, { sort: { order: 1 } }).toArray();
	}

	async updateById(id: string, data: Partial<ITaskProperty>): Promise<void> {
		await this.updateOne({ _id: id }, { $set: data });
	}

	async updateValueById(id: string, value: Pick<ITaskTag, '_id' | 'name'>[]): Promise<void> {
		await this.updateOne({ _id: id }, { $set: { value } });
	}

	async deleteById(id: string): Promise<void> {
		await this.deleteOne({ _id: id });
	}
}
