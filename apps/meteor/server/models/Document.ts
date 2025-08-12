import { BaseRaw } from '@rocket.chat/models';
import { Meteor } from 'meteor/meteor';
import type { Db, IndexDescription, FindOptions, Filter } from 'mongodb';

import type { IDocument, ICustomFieldValue } from '../core-typings/IDocument';

export class DocumentRaw extends BaseRaw<IDocument> {
	constructor(db: Db) {
		super(db, 'documents');
	}

	protected modelIndexes(): IndexDescription[] {
		return [
			{ key: { workspaceId: 1 } },
			{ key: { workspaceId: 1, order: 1 } },
			{ key: { title: 'text', description: 'text' } },
			{ key: { createdAt: -1 } },
			{ key: { 'customFields.fieldId': 1 } },
			{ key: { 'workspaceId': 1, 'customFields.fieldId': 1, 'customFields.value': 1 } },
		];
	}

	async create(documentData: Omit<IDocument, '_id' | 'createdAt' | '_updatedAt' | 'order'>): Promise<IDocument> {
		const now = new Date();

		// Get the next order number for this workspace
		const lastDoc = await this.findOne({ workspaceId: documentData.workspaceId }, { sort: { order: -1 } });
		const nextOrder = lastDoc ? lastDoc.order + 1 : 1;

		const { insertedId } = await this.insertOne({
			...documentData,
			order: nextOrder,
			createdAt: now,
			_updatedAt: now,
		});

		const document = await this.findOne({ _id: insertedId });
		if (!document) {
			throw new Meteor.Error('error-document-create-failed', 'Failed to create document');
		}
		return document;
	}

	async findByWorkspaceId(workspaceId: string, options?: FindOptions<IDocument>): Promise<IDocument[]> {
		return this.find({ workspaceId }, options).toArray();
	}

	async findByWorkspaceIdPaginated(
		workspaceId: string,
		offset: number,
		limit: number,
		sort?: Record<string, 1 | -1>,
	): Promise<{ documents: IDocument[]; total: number }> {
		const documents = await this.find(
			{ workspaceId },
			{
				skip: offset,
				limit,
				sort: sort || { order: 1 },
			},
		).toArray();

		const total = await this.col.countDocuments({ workspaceId });

		return { documents, total };
	}

	async searchDocuments(workspaceId: string, searchText: string, options?: FindOptions<IDocument>): Promise<IDocument[]> {
		return this.find(
			{
				workspaceId,
				$text: { $search: searchText },
			},
			options,
		).toArray();
	}

	async findByCustomField(workspaceId: string, fieldId: string, value: any, options?: FindOptions<IDocument>): Promise<IDocument[]> {
		return this.find(
			{
				workspaceId,
				customFields: {
					$elemMatch: {
						fieldId,
						value,
					},
				},
			},
			options,
		).toArray();
	}

	async findByMultipleCustomFields(
		workspaceId: string,
		filters: Array<{ fieldId: string; value: any; operator?: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'nin' }>,
	): Promise<IDocument[]> {
		const query: Filter<IDocument> = { workspaceId };
		const andConditions: any[] = [];

		for (const filter of filters) {
			const condition: any = { 'customFields.fieldId': filter.fieldId };

			switch (filter.operator || 'eq') {
				case 'eq':
					condition['customFields.value'] = filter.value;
					break;
				case 'ne':
					condition['customFields.value'] = { $ne: filter.value };
					break;
				case 'gt':
					condition['customFields.value'] = { $gt: filter.value };
					break;
				case 'gte':
					condition['customFields.value'] = { $gte: filter.value };
					break;
				case 'lt':
					condition['customFields.value'] = { $lt: filter.value };
					break;
				case 'lte':
					condition['customFields.value'] = { $lte: filter.value };
					break;
				case 'in':
					condition['customFields.value'] = { $in: filter.value };
					break;
				case 'nin':
					condition['customFields.value'] = { $nin: filter.value };
					break;
			}

			andConditions.push({ customFields: { $elemMatch: condition } });
		}

		if (andConditions.length > 0) {
			query.$and = andConditions;
		}

		return this.find(query).toArray();
	}

	async updateDocument(documentId: string, updates: Partial<Omit<IDocument, '_id' | 'createdAt' | 'workspaceId'>>): Promise<void> {
		await this.updateOne(
			{ _id: documentId },
			{
				$set: {
					...updates,
					_updatedAt: new Date(),
				},
			},
		);
	}

	async updateCustomField(documentId: string, fieldId: string, value: any): Promise<void> {
		const document = await this.findOne({ _id: documentId });
		if (!document) {
			throw new Meteor.Error('error-document-not-found', 'Document not found');
		}

		const customFields = document.customFields || [];
		const fieldIndex = customFields.findIndex((f) => f.fieldId === fieldId);

		if (fieldIndex >= 0) {
			customFields[fieldIndex].value = value;
		} else {
			customFields.push({ fieldId, value });
		}

		await this.updateOne(
			{ _id: documentId },
			{
				$set: {
					customFields,
					_updatedAt: new Date(),
				},
			},
		);
	}

	async updateMultipleCustomFields(documentId: string, fields: ICustomFieldValue[]): Promise<void> {
		const document = await this.findOne({ _id: documentId });
		if (!document) {
			throw new Meteor.Error('error-document-not-found', 'Document not found');
		}

		const customFields = document.customFields || [];

		for (const field of fields) {
			const fieldIndex = customFields.findIndex((f) => f.fieldId === field.fieldId);
			if (fieldIndex >= 0) {
				customFields[fieldIndex].value = field.value;
			} else {
				customFields.push(field);
			}
		}

		await this.updateOne(
			{ _id: documentId },
			{
				$set: {
					customFields,
					_updatedAt: new Date(),
				},
			},
		);
	}

	async reorderDocuments(workspaceId: string, documentId: string, newOrder: number): Promise<void> {
		const document = await this.findOne({ _id: documentId });
		if (!document || document.workspaceId !== workspaceId) {
			throw new Meteor.Error('error-document-not-found', 'Document not found');
		}

		const oldOrder = document.order;

		if (oldOrder === newOrder) {
			return;
		}

		// Update orders for affected documents
		if (oldOrder < newOrder) {
			// Moving down
			await this.updateMany(
				{
					workspaceId,
					order: { $gt: oldOrder, $lte: newOrder },
				},
				{
					$inc: { order: -1 },
				},
			);
		} else {
			// Moving up
			await this.updateMany(
				{
					workspaceId,
					order: { $gte: newOrder, $lt: oldOrder },
				},
				{
					$inc: { order: 1 },
				},
			);
		}

		// Update the document's order
		await this.updateOne(
			{ _id: documentId },
			{
				$set: {
					order: newOrder,
					_updatedAt: new Date(),
				},
			},
		);
	}

	async deleteDocument(documentId: string): Promise<void> {
		const document = await this.findOne({ _id: documentId });
		if (!document) {
			throw new Meteor.Error('error-document-not-found', 'Document not found');
		}

		// Update orders for documents after the deleted one
		await this.updateMany(
			{
				workspaceId: document.workspaceId,
				order: { $gt: document.order },
			},
			{
				$inc: { order: -1 },
			},
		);

		await this.deleteOne({ _id: documentId });
	}

	async deleteDocumentsByWorkspace(workspaceId: string): Promise<void> {
		await this.deleteMany({ workspaceId });
	}

	async countDocumentsByWorkspace(workspaceId: string): Promise<number> {
		return this.col.countDocuments({ workspaceId });
	}

	async getFieldValueDistribution(workspaceId: string, fieldId: string): Promise<Array<{ value: any; count: number }>> {
		const result = await this.col
			.aggregate([
				{ $match: { workspaceId } },
				{ $unwind: '$customFields' },
				{ $match: { 'customFields.fieldId': fieldId } },
				{ $group: { _id: '$customFields.value', count: { $sum: 1 } } },
				{ $sort: { count: -1 } },
			])
			.toArray();

		return result.map((r) => ({ value: r._id, count: r.count }));
	}
}
