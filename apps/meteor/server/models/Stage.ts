import { BaseRaw } from '@rocket.chat/models';
import { Meteor } from 'meteor/meteor';
import type { Db, IndexDescription } from 'mongodb';

import type { IStage } from '../core-typings/IStage';

export class StageRaw extends BaseRaw<IStage> {
	constructor(db: Db) {
		super(db, 'stages');
	}

	protected modelIndexes(): IndexDescription[] {
		return [{ key: { moduleId: 1 } }, { key: { moduleId: 1, order: 1 } }, { key: { name: 1, moduleId: 1 } }];
	}

	async create(stageData: Omit<IStage, '_id'>): Promise<IStage> {
		const existingStageCount = await this.countDocuments({ moduleId: stageData.moduleId });
		const order = stageData.order ?? existingStageCount;

		const { insertedId } = await this.insertOne({
			...stageData,
			order,
		});

		const stage = await this.findOne({ _id: insertedId });
		if (!stage) {
			throw new Meteor.Error('error-stage-create-failed', 'Failed to create stage');
		}
		return stage;
	}

	async findById(stageId: string): Promise<IStage | null> {
		return this.findOne({ _id: stageId });
	}

	async findByModuleId(moduleId: string): Promise<IStage[]> {
		const cursor = this.find({ moduleId }, { sort: { order: 1 } });
		return cursor.toArray();
	}

	async findByModuleIdAndName(moduleId: string, name: string): Promise<IStage | null> {
		return this.findOne({ moduleId, name });
	}

	async updateById(stageId: string, updateData: Partial<Omit<IStage, '_id'>>): Promise<void> {
		await this.updateOne({ _id: stageId }, { $set: updateData });
	}

	async updateOrder(stageId: string, newOrder: number): Promise<void> {
		const stage = await this.findById(stageId);
		if (!stage) {
			throw new Meteor.Error('error-stage-not-found', 'Stage not found');
		}

		const oldOrder = stage.order;
		const moduleId = stage.moduleId;

		if (oldOrder === newOrder) {
			return;
		}

		if (oldOrder < newOrder) {
			await this.updateMany({ moduleId, order: { $gt: oldOrder, $lte: newOrder } }, { $inc: { order: -1 } });
		} else {
			await this.updateMany({ moduleId, order: { $gte: newOrder, $lt: oldOrder } }, { $inc: { order: 1 } });
		}

		await this.updateOne({ _id: stageId }, { $set: { order: newOrder } });
	}

	async reorderStages(moduleId: string, stageIds: string[]): Promise<void> {
		const bulkOps = stageIds.map((stageId, index) => ({
			updateOne: {
				filter: { _id: stageId, moduleId },
				update: { $set: { order: index } },
			},
		}));

		if (bulkOps.length > 0) {
			await this.col.bulkWrite(bulkOps);
		}
	}

	async deleteById(stageId: string): Promise<void> {
		const stage = await this.findById(stageId);
		if (!stage) {
			return;
		}

		await this.deleteOne({ _id: stageId });

		await this.updateMany({ moduleId: stage.moduleId, order: { $gt: stage.order } }, { $inc: { order: -1 } });
	}

	async deleteByModuleId(moduleId: string): Promise<void> {
		await this.deleteMany({ moduleId });
	}

	async countByModuleId(moduleId: string): Promise<number> {
		return this.countDocuments({ moduleId });
	}
}
