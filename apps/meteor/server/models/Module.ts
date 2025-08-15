import { BaseRaw } from '@rocket.chat/models';
import { Meteor } from 'meteor/meteor';
import type { Db, IndexDescription } from 'mongodb';

import type { IModule, IFieldDefinition } from '../core-typings/IModule';

export class ModuleRaw extends BaseRaw<IModule> {
	constructor(db: Db) {
		super(db, 'modules');
	}

	protected modelIndexes(): IndexDescription[] {
		return [{ key: { name: 1 } }, { key: { roomId: 1 } }, { key: { createdAt: -1 } }, { key: { 'createdBy._id': 1 } }];
	}

	async create(
		creator: { _id: string; username: string; name?: string },
		moduleData: {
			name: string;
			roomId: string;
			description?: string;
			fieldDefinitions: IFieldDefinition[];
		},
	): Promise<IModule> {
		const now = new Date();

		const { insertedId } = await this.insertOne({
			...moduleData,
			createdAt: now,
			createdBy: creator,
		});

		const module = await this.findOne({ _id: insertedId });
		if (!module) {
			throw new Meteor.Error('error-module-create-failed', 'Failed to create module');
		}
		return module;
	}

	async findById(moduleId: string): Promise<IModule | null> {
		return this.findOne({ _id: moduleId });
	}

	async findByName(name: string): Promise<IModule | null> {
		return this.findOne({ name });
	}

	async findByRoomId(roomId: string): Promise<IModule | null> {
		return this.findOne({ roomId });
	}

	async findAllByRoomId(roomId: string, options?: { skip?: number; limit?: number }): Promise<IModule[]> {
		const cursor = this.find(
			{ roomId },
			{
				skip: options?.skip,
				limit: options?.limit,
				sort: { createdAt: -1 },
			},
		);
		return cursor.toArray();
	}

	async findAll(options?: { skip?: number; limit?: number }): Promise<IModule[]> {
		const cursor = this.find(
			{},
			{
				skip: options?.skip,
				limit: options?.limit,
				sort: { createdAt: -1 },
			},
		);
		return cursor.toArray();
	}

	async updateById(moduleId: string, updateData: Partial<Omit<IModule, '_id' | 'createdAt' | 'createdBy'>>): Promise<void> {
		await this.updateOne({ _id: moduleId }, { $set: updateData });
	}

	async updateFieldDefinitions(moduleId: string, fieldDefinitions: IFieldDefinition[]): Promise<void> {
		await this.updateOne({ _id: moduleId }, { $set: { fieldDefinitions } });
	}

	async addFieldDefinition(moduleId: string, fieldDefinition: IFieldDefinition): Promise<void> {
		await this.updateOne({ _id: moduleId }, { $push: { fieldDefinitions: fieldDefinition } });
	}

	async removeFieldDefinition(moduleId: string, fieldId: string): Promise<void> {
		await this.updateOne({ _id: moduleId }, { $pull: { fieldDefinitions: { _id: fieldId } } });
	}

	async deleteById(moduleId: string): Promise<void> {
		await this.deleteOne({ _id: moduleId });
	}

	async countByCreator(creatorId: string): Promise<number> {
		return this.countDocuments({ 'createdBy._id': creatorId });
	}
}
