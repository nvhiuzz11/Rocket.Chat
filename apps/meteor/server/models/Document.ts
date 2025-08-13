import { BaseRaw } from '@rocket.chat/models';
import { Meteor } from 'meteor/meteor';
import type { Db, IndexDescription } from 'mongodb';

import type { IDocument, ICustomFieldValue } from '../core-typings/IDocument';

export class DocumentRaw extends BaseRaw<IDocument> {
	constructor(db: Db) {
		super(db, 'documents');
	}

	protected modelIndexes(): IndexDescription[] {
		return [
			{ key: { moduleId: 1 } },
			{ key: { stageId: 1 } },
			{ key: { moduleId: 1, stageId: 1 } },
			{ key: { parentId: 1 } },
			{ key: { createdAt: -1 } },
			{ key: { 'createdBy._id': 1 } },
			{ key: { name: 'text' } },
			{ key: { moduleId: 1, stageId: 1, order: 1 } },
		];
	}

	async create(
		creator: { _id: string; username: string; name?: string },
		documentData: {
			name: string;
			description?: string;
			moduleId: string;
			stageId: string;
			parentId?: string;
			customFields: ICustomFieldValue[];
			order?: number;
		},
	): Promise<IDocument> {
		const now = new Date();

		const existingDocCount = await this.countDocuments({
			moduleId: documentData.moduleId,
			stageId: documentData.stageId,
		});
		const order = documentData.order ?? existingDocCount;

		const { insertedId } = await this.insertOne({
			...documentData,
			order,
			createdAt: now,
			createdBy: creator,
		});

		const document = await this.findOne({ _id: insertedId });
		if (!document) {
			throw new Meteor.Error('error-document-create-failed', 'Failed to create document');
		}
		return document;
	}

	async findById(documentId: string): Promise<IDocument | null> {
		return this.findOne({ _id: documentId });
	}

	async findByModuleId(moduleId: string, options?: { skip?: number; limit?: number; sort?: any }): Promise<IDocument[]> {
		const cursor = this.find(
			{ moduleId },
			{
				skip: options?.skip,
				limit: options?.limit,
				sort: options?.sort || { createdAt: -1 },
			},
		);
		return cursor.toArray();
	}

	async findByStageId(stageId: string, options?: { skip?: number; limit?: number }): Promise<IDocument[]> {
		const cursor = this.find(
			{ stageId },
			{
				skip: options?.skip,
				limit: options?.limit,
				sort: { order: 1 },
			},
		);
		return cursor.toArray();
	}

	async findByModuleAndStage(moduleId: string, stageId: string, options?: { skip?: number; limit?: number }): Promise<IDocument[]> {
		const cursor = this.find(
			{ moduleId, stageId },
			{
				skip: options?.skip,
				limit: options?.limit,
				sort: { order: 1 },
			},
		);
		return cursor.toArray();
	}

	async findByParentId(parentId: string): Promise<IDocument[]> {
		const cursor = this.find({ parentId }, { sort: { order: 1 } });
		return cursor.toArray();
	}

	async searchByName(moduleId: string, searchTerm: string, options?: { skip?: number; limit?: number }): Promise<IDocument[]> {
		const cursor = this.find(
			{
				moduleId,
				$text: { $search: searchTerm },
			},
			{
				skip: options?.skip,
				limit: options?.limit,
				sort: { score: { $meta: 'textScore' } },
			},
		);
		return cursor.toArray();
	}

	async updateById(documentId: string, updateData: Partial<Omit<IDocument, '_id' | 'createdAt' | 'createdBy'>>): Promise<void> {
		await this.updateOne({ _id: documentId }, { $set: updateData });
	}

	async updateCustomFields(documentId: string, customFields: ICustomFieldValue[]): Promise<void> {
		await this.updateOne({ _id: documentId }, { $set: { customFields } });
	}

	async updateCustomField(documentId: string, fieldId: string, value: any): Promise<void> {
		await this.updateOne(
			{ _id: documentId },
			{
				$set: {
					'customFields.$[field].value': value,
				},
			},
			{
				arrayFilters: [{ 'field.fieldId': fieldId }],
			},
		);
	}

	async moveToStage(documentId: string, newStageId: string): Promise<void> {
		const document = await this.findById(documentId);
		if (!document) {
			throw new Meteor.Error('error-document-not-found', 'Document not found');
		}

		const oldStageId = document.stageId;
		const moduleId = document.moduleId;

		await this.updateMany({ moduleId, stageId: oldStageId, order: { $gt: document.order } }, { $inc: { order: -1 } });

		const newOrder = await this.countDocuments({ moduleId, stageId: newStageId });

		await this.updateOne({ _id: documentId }, { $set: { stageId: newStageId, order: newOrder } });
	}

	async updateOrder(documentId: string, newOrder: number): Promise<void> {
		const document = await this.findById(documentId);
		if (!document) {
			throw new Meteor.Error('error-document-not-found', 'Document not found');
		}

		const oldOrder = document.order;
		const { moduleId, stageId } = document;

		if (oldOrder === newOrder) {
			return;
		}

		if (oldOrder < newOrder) {
			await this.updateMany({ moduleId, stageId, order: { $gt: oldOrder, $lte: newOrder } }, { $inc: { order: -1 } });
		} else {
			await this.updateMany({ moduleId, stageId, order: { $gte: newOrder, $lt: oldOrder } }, { $inc: { order: 1 } });
		}

		await this.updateOne({ _id: documentId }, { $set: { order: newOrder } });
	}

	async deleteById(documentId: string): Promise<void> {
		const document = await this.findById(documentId);
		if (!document) {
			return;
		}

		await this.deleteOne({ _id: documentId });

		await this.updateMany(
			{ moduleId: document.moduleId, stageId: document.stageId, order: { $gt: document.order } },
			{ $inc: { order: -1 } },
		);

		await this.deleteMany({ parentId: documentId });
	}

	async deleteByModuleId(moduleId: string): Promise<void> {
		await this.deleteMany({ moduleId });
	}

	async deleteByStageId(stageId: string): Promise<void> {
		await this.deleteMany({ stageId });
	}

	async countByModuleId(moduleId: string): Promise<number> {
		return this.countDocuments({ moduleId });
	}

	async countByStageId(stageId: string): Promise<number> {
		return this.countDocuments({ stageId });
	}

	async countByCreator(creatorId: string): Promise<number> {
		return this.countDocuments({ 'createdBy._id': creatorId });
	}

	async findByCustomFieldValue(
		moduleId: string,
		fieldId: string,
		value: any,
		options?: { skip?: number; limit?: number },
	): Promise<IDocument[]> {
		const cursor = this.find(
			{
				moduleId,
				customFields: {
					$elemMatch: {
						fieldId,
						value,
					},
				},
			},
			{
				skip: options?.skip,
				limit: options?.limit,
				sort: { createdAt: -1 },
			},
		);
		return cursor.toArray();
	}
}
