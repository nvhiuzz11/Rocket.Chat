import { BaseRaw } from '@rocket.chat/models';
import type { Db, IndexDescription } from 'mongodb';

import type { IProjectTag } from '../core-typings/IProjectTag';

export class ProjectTagRaw extends BaseRaw<IProjectTag> {
	constructor(db: Db) {
		super(db, 'project_tags');
	}

	protected modelIndexes(): IndexDescription[] {
		return [{ key: { projectPropertyId: 1 } }];
	}

	async create(data: Omit<IProjectTag, '_id' | '_updatedAt' | 'order'>): Promise<string> {
		const lastTag = await this.findOne({ projectPropertyId: data.projectPropertyId }, { sort: { order: -1 } });
		const newOrder = (lastTag?.order ?? -1) + 1;
		const result = await this.insertOne({ ...data, order: newOrder });
		return result.insertedId;
	}

	async findById(id: IProjectTag['_id']): Promise<IProjectTag | null> {
		return this.findOne({ _id: id }, { sort: { order: 1 } });
	}

	async findByProjectPropertyId(projectPropertyId: string): Promise<IProjectTag[]> {
		return this.find({ projectPropertyId }, { sort: { order: 1 } }).toArray();
	}

	async updateById(id: string, data: Partial<IProjectTag>): Promise<void> {
		await this.updateOne({ _id: id }, { $set: data });
	}

	async deleteById(id: string): Promise<void> {
		await this.deleteOne({ _id: id });
	}
}
