import { BaseRaw } from '@rocket.chat/models';
import type { Db, IndexDescription } from 'mongodb';

import type { IProjectProperty } from '../core-typings/IProjectProperty';
import type { IProjectTag } from '../core-typings/IProjectTag';

export class ProjectPropertyRaw extends BaseRaw<IProjectProperty> {
	constructor(db: Db) {
		super(db, 'project_properties');
	}

	protected modelIndexes(): IndexDescription[] {
		return [{ key: { teamId: 1 } }];
	}

	async create(data: Omit<IProjectProperty, '_id' | '_updatedAt' | 'order'>): Promise<string> {
		const lastProperty = await this.findOne({ teamId: data.teamId }, { sort: { order: -1 } });
		const newOrder = (lastProperty?.order ?? -1) + 1;
		const result = await this.insertOne({ ...data, order: newOrder });
		return result.insertedId;
	}

	async findById(id: string): Promise<IProjectProperty | null> {
		return this.findOne({ _id: id });
	}

	async findByTeamId(teamId: string): Promise<IProjectProperty[]> {
		return this.find({ teamId }, { sort: { order: 1 } }).toArray();
	}

	async updateById(id: string, data: Partial<IProjectProperty>): Promise<void> {
		await this.updateOne({ _id: id }, { $set: data });
	}

	async updateValueById(id: string, value: Pick<IProjectTag, '_id' | 'name'>[]): Promise<void> {
		await this.updateOne({ _id: id }, { $set: { value } });
	}

	async updateOrderById(id: string, order: number): Promise<void> {
		await this.updateOne({ _id: id }, { $set: { order } });
	}

	async deleteById(id: string): Promise<void> {
		await this.deleteOne({ _id: id });
	}
}
