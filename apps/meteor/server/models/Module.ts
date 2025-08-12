import type { IUser } from '@rocket.chat/core-typings';
import { BaseRaw } from '@rocket.chat/models';
import { Meteor } from 'meteor/meteor';
import type { Db, IndexDescription, FindOptions } from 'mongodb';

import type { IModule, IFieldDefinition, ModuleType } from '../core-typings/IModule';

export class ModuleRaw extends BaseRaw<IModule> {
	constructor(db: Db) {
		super(db, 'modules');
	}

	protected modelIndexes(): IndexDescription[] {
		return [
			{ key: { roomId: 1 } },
			{ key: { type: 1 } },
			{ key: { teamId: 1 } },
			{ key: { 'createdBy._id': 1 } },
			{ key: { roomId: 1, type: 1 } },
		];
	}

	async create(
		creator: Pick<IUser, '_id' | 'username' | 'name'>,
		moduleData: Omit<IModule, '_id' | 'createdAt' | '_updatedAt' | 'createdBy'>,
	): Promise<IModule> {
		const now = new Date();

		const { insertedId } = await this.insertOne({
			...moduleData,
			createdAt: now,
			createdBy: creator,
			_updatedAt: now,
		});

		const module = await this.findOne({ _id: insertedId });
		if (!module) {
			throw new Meteor.Error('error-module-create-failed', 'Failed to create module');
		}
		return module;
	}

	async findByRoomId(roomId: string, options?: FindOptions<IModule>): Promise<IModule[]> {
		return this.find({ roomId }, options).toArray();
	}

	async findByType(type: ModuleType, options?: FindOptions<IModule>): Promise<IModule[]> {
		return this.find({ type }, options).toArray();
	}

	async findByRoomIdAndType(roomId: string, type: ModuleType): Promise<IModule | null> {
		return this.findOne({ roomId, type });
	}

	async updateFieldDefinitions(moduleId: string, fieldDefinitions: IFieldDefinition[]): Promise<void> {
		await this.updateOne(
			{ _id: moduleId },
			{
				$set: {
					fieldDefinitions,
					_updatedAt: new Date(),
				},
			},
		);
	}

	async addFieldDefinition(moduleId: string, field: IFieldDefinition): Promise<void> {
		await this.updateOne(
			{ _id: moduleId },
			{
				$push: { fieldDefinitions: field },
				$set: { _updatedAt: new Date() },
			},
		);
	}

	async updateFieldDefinition(moduleId: string, fieldId: string, updates: Partial<IFieldDefinition>): Promise<void> {
		await this.updateOne(
			{ '_id': moduleId, 'fieldDefinitions._id': fieldId },
			{
				$set: {
					...Object.entries(updates).reduce(
						(acc, [key, value]) => {
							acc[`fieldDefinitions.$.${key}`] = value;
							return acc;
						},
						{} as Record<string, any>,
					),
					_updatedAt: new Date(),
				},
			},
		);
	}

	async removeFieldDefinition(moduleId: string, fieldId: string): Promise<void> {
		await this.updateOne(
			{ _id: moduleId },
			{
				$pull: { fieldDefinitions: { _id: fieldId } },
				$set: { _updatedAt: new Date() },
			},
		);
	}

	async updateModule(moduleId: string, updates: Partial<Omit<IModule, '_id' | 'createdAt' | 'createdBy'>>): Promise<void> {
		await this.updateOne(
			{ _id: moduleId },
			{
				$set: {
					...updates,
					_updatedAt: new Date(),
				},
			},
		);
	}

	async deleteModule(moduleId: string): Promise<void> {
		await this.deleteOne({ _id: moduleId });
	}

	async countModulesByRoom(roomId: string): Promise<number> {
		return this.col.countDocuments({ roomId });
	}

	async findModulesByTeam(teamId: string): Promise<IModule[]> {
		return this.find({ teamId }).toArray();
	}
}
