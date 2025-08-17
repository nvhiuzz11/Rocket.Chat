import { Meteor } from 'meteor/meteor';

import type { IDocument, ICustomFieldValue } from '../../../../server/core-typings/IDocument';
import { db } from '../../../../server/database/utils';
import { DocumentRaw } from '../../../../server/models/Document';
import { ModuleRaw } from '../../../../server/models/Module';
import { StageRaw } from '../../../../server/models/Stage';
import { API } from '../api';
import { getPaginationItems } from '../helpers/getPaginationItems';

const Module = new ModuleRaw(db);
const Stage = new StageRaw(db);
const Document = new DocumentRaw(db);

API.v1.addRoute(
	'documents.create',
	{
		authRequired: true,
	},
	{
		async post() {
			const { name, description, moduleId, stageId, parentId, customFields } = this.bodyParams;

			if (!name || typeof name !== 'string') {
				throw new Meteor.Error('error-invalid-params', 'Document name is required');
			}

			if (!moduleId || typeof moduleId !== 'string') {
				throw new Meteor.Error('error-invalid-params', 'Module ID is required');
			}

			if (!stageId || typeof stageId !== 'string') {
				throw new Meteor.Error('error-invalid-params', 'Stage ID is required');
			}

			const module = await Module.findById(moduleId);
			if (!module) {
				throw new Meteor.Error('error-module-not-found', 'Module not found');
			}

			const stage = await Stage.findById(stageId);
			if (!stage) {
				throw new Meteor.Error('error-stage-not-found', 'Stage not found');
			}

			if (stage.moduleId !== moduleId) {
				throw new Meteor.Error('error-stage-module-mismatch', 'Stage does not belong to the specified module');
			}

			if (parentId) {
				const parentDoc = await Document.findById(parentId);
				if (!parentDoc) {
					throw new Meteor.Error('error-parent-document-not-found', 'Parent document not found');
				}
				if (parentDoc.moduleId !== moduleId) {
					throw new Meteor.Error('error-parent-module-mismatch', 'Parent document must be in the same module');
				}
			}

			const validatedCustomFields: ICustomFieldValue[] = [];
			if (customFields && Array.isArray(customFields)) {
				for (const field of customFields) {
					const fieldDef = module.fieldDefinitions.find((f) => f._id === field.fieldId);
					if (!fieldDef) {
						throw new Meteor.Error('error-invalid-field', `Field ${field.fieldId} not found in module`);
					}
					if (fieldDef.isRequired && !field.value) {
						throw new Meteor.Error('error-required-field', `Field ${fieldDef.name} is required`);
					}
					validatedCustomFields.push({
						fieldId: field.fieldId,
						value: field.value,
					});
				}

				for (const fieldDef of module.fieldDefinitions) {
					if (fieldDef.isRequired) {
						const hasValue = validatedCustomFields.some((f) => f.fieldId === fieldDef._id);
						if (!hasValue) {
							throw new Meteor.Error('error-required-field', `Field ${fieldDef.name} is required`);
						}
					}
				}
			}

			const document = await Document.create(
				{
					_id: this.userId,
					username: this.user.username,
					name: this.user.name,
				},
				{
					name,
					description,
					moduleId,
					stageId,
					parentId,
					customFields: validatedCustomFields,
				},
			);

			return API.v1.success({ document });
		},
	},
);

API.v1.addRoute(
	'documents.list',
	{
		authRequired: true,
	},
	{
		async get() {
			const { moduleId, stageId, parentId } = this.queryParams;
			const { offset, count } = await getPaginationItems(this.queryParams);

			if (!moduleId || typeof moduleId !== 'string') {
				throw new Meteor.Error('error-invalid-params', 'Module ID is required');
			}

			const module = await Module.findById(moduleId);
			if (!module) {
				throw new Meteor.Error('error-module-not-found', 'Module not found');
			}

			let documents: IDocument[] = [];
			let total = 0;

			if (stageId) {
				const stage = await Stage.findById(stageId);
				if (!stage) {
					throw new Meteor.Error('error-stage-not-found', 'Stage not found');
				}
				documents = await Document.findByModuleAndStage(moduleId, stageId, {
					skip: offset,
					limit: count,
				});
				total = await Document.countDocuments({ moduleId, stageId });
			} else if (parentId) {
				documents = await Document.findByParentId(parentId);
				total = documents.length;
			} else {
				documents = await Document.findByModuleId(moduleId, {
					skip: offset,
					limit: count,
				});
				total = await Document.countByModuleId(moduleId);
			}

			return API.v1.success({
				documents,
				count: documents.length,
				offset,
				total,
			});
		},
	},
);

API.v1.addRoute(
	'documents.listByModuleId',
	{
		authRequired: true,
	},
	{
		async get() {
			const { moduleId } = this.queryParams;

			if (!moduleId || typeof moduleId !== 'string') {
				throw new Meteor.Error('error-invalid-params', 'Module ID is required');
			}

			const module = await Module.findById(moduleId);
			if (!module) {
				throw new Meteor.Error('error-module-not-found', 'Module not found');
			}

			const documents = await Document.findByModuleId(moduleId);

			return API.v1.success({
				documents,
			});
		},
	},
);

API.v1.addRoute(
	'documents.listByStageId',
	{
		authRequired: true,
	},
	{
		async get() {
			const { stageId } = this.queryParams;
			const { offset, count } = await getPaginationItems(this.queryParams);

			if (!stageId || typeof stageId !== 'string') {
				throw new Meteor.Error('error-invalid-params', 'Stage ID is required');
			}

			const stage = await Stage.findById(stageId);
			if (!stage) {
				throw new Meteor.Error('error-stage-not-found', 'Stage not found');
			}

			const documents = await Document.findByStageId(stageId, {
				skip: offset,
				limit: count,
			});
			const total = await Document.countByStageId(stageId);

			return API.v1.success({
				documents,
				count: documents.length,
				offset,
				total,
			});
		},
	},
);

API.v1.addRoute(
	'documents.info',
	{
		authRequired: true,
	},
	{
		async get() {
			const { documentId } = this.queryParams;

			if (!documentId || typeof documentId !== 'string') {
				throw new Meteor.Error('error-invalid-params', 'Document ID is required');
			}

			const document = await Document.findById(documentId);
			if (!document) {
				throw new Meteor.Error('error-document-not-found', 'Document not found');
			}

			const module = await Module.findById(document.moduleId);
			const stage = await Stage.findById(document.stageId);
			const children = await Document.findByParentId(documentId);

			return API.v1.success({
				document,
				module,
				stage,
				children,
			});
		},
	},
);

API.v1.addRoute(
	'documents.update',
	{
		authRequired: true,
	},
	{
		async post() {
			const { documentId, name, description, customFields } = this.bodyParams;

			if (!documentId || typeof documentId !== 'string') {
				throw new Meteor.Error('error-invalid-params', 'Document ID is required');
			}

			const document = await Document.findById(documentId);
			if (!document) {
				throw new Meteor.Error('error-document-not-found', 'Document not found');
			}

			const updateData: Partial<IDocument> = {};

			if (name) {
				updateData.name = name;
			}

			if (description !== undefined) {
				updateData.description = description;
			}

			if (customFields && Array.isArray(customFields)) {
				const module = await Module.findById(document.moduleId);
				if (!module) {
					throw new Meteor.Error('error-module-not-found', 'Module not found');
				}

				const validatedCustomFields: ICustomFieldValue[] = [];
				for (const field of customFields) {
					const fieldDef = module.fieldDefinitions.find((f) => f._id === field.fieldId);
					if (!fieldDef) {
						throw new Meteor.Error('error-invalid-field', `Field ${field.fieldId} not found in module`);
					}
					if (fieldDef.isRequired && !field.value) {
						throw new Meteor.Error('error-required-field', `Field ${fieldDef.name} is required`);
					}
					validatedCustomFields.push({
						fieldId: field.fieldId,
						value: field.value,
					});
				}

				for (const fieldDef of module.fieldDefinitions) {
					if (fieldDef.isRequired) {
						const hasValue = validatedCustomFields.some((f) => f.fieldId === fieldDef._id);
						if (!hasValue) {
							throw new Meteor.Error('error-required-field', `Field ${fieldDef.name} is required`);
						}
					}
				}

				updateData.customFields = validatedCustomFields;
			}

			await Document.updateById(documentId, updateData);

			const updatedDocument = await Document.findById(documentId);

			return API.v1.success({ document: updatedDocument });
		},
	},
);

API.v1.addRoute(
	'documents.moveToStage',
	{
		authRequired: true,
	},
	{
		async post() {
			const { documentId, stageId } = this.bodyParams;

			if (!documentId || typeof documentId !== 'string') {
				throw new Meteor.Error('error-invalid-params', 'Document ID is required');
			}

			if (!stageId || typeof stageId !== 'string') {
				throw new Meteor.Error('error-invalid-params', 'Stage ID is required');
			}

			const document = await Document.findById(documentId);
			if (!document) {
				throw new Meteor.Error('error-document-not-found', 'Document not found');
			}

			const stage = await Stage.findById(stageId);
			if (!stage) {
				throw new Meteor.Error('error-stage-not-found', 'Stage not found');
			}

			if (stage.moduleId !== document.moduleId) {
				throw new Meteor.Error('error-stage-module-mismatch', 'Stage must be in the same module as the document');
			}

			await Document.moveToStage(documentId, stageId);

			const updatedDocument = await Document.findById(documentId);

			return API.v1.success({ document: updatedDocument });
		},
	},
);

API.v1.addRoute(
	'documents.updateOrder',
	{
		authRequired: true,
	},
	{
		async post() {
			const { documentId, newOrder } = this.bodyParams;

			if (!documentId || typeof documentId !== 'string') {
				throw new Meteor.Error('error-invalid-params', 'Document ID is required');
			}

			if (typeof newOrder !== 'number' || newOrder < 0) {
				throw new Meteor.Error('error-invalid-params', 'Valid order number is required');
			}

			const document = await Document.findById(documentId);
			if (!document) {
				throw new Meteor.Error('error-document-not-found', 'Document not found');
			}

			await Document.updateOrder(documentId, newOrder);

			const documents = await Document.findByModuleAndStage(document.moduleId, document.stageId);

			return API.v1.success({ documents });
		},
	},
);

API.v1.addRoute(
	'documents.delete',
	{
		authRequired: true,
	},
	{
		async post() {
			const { documentId } = this.bodyParams;

			if (!documentId || typeof documentId !== 'string') {
				throw new Meteor.Error('error-invalid-params', 'Document ID is required');
			}

			const document = await Document.findById(documentId);
			if (!document) {
				throw new Meteor.Error('error-document-not-found', 'Document not found');
			}

			await Document.deleteById(documentId);

			return API.v1.success({ deleted: true });
		},
	},
);

API.v1.addRoute(
	'documents.search',
	{
		authRequired: true,
	},
	{
		async get() {
			const { moduleId, searchTerm } = this.queryParams;
			const { offset, count } = await getPaginationItems(this.queryParams);

			if (!moduleId || typeof moduleId !== 'string') {
				throw new Meteor.Error('error-invalid-params', 'Module ID is required');
			}

			if (!searchTerm || typeof searchTerm !== 'string') {
				throw new Meteor.Error('error-invalid-params', 'Search term is required');
			}

			const module = await Module.findById(moduleId);
			if (!module) {
				throw new Meteor.Error('error-module-not-found', 'Module not found');
			}

			const documents = await Document.searchByName(moduleId, searchTerm, {
				skip: offset,
				limit: count,
			});

			return API.v1.success({
				documents,
				count: documents.length,
				offset,
			});
		},
	},
);

API.v1.addRoute(
	'documents.findByFieldValue',
	{
		authRequired: true,
	},
	{
		async get() {
			const { moduleId, fieldId, value } = this.queryParams;
			const { offset, count } = await getPaginationItems(this.queryParams);

			if (!moduleId || typeof moduleId !== 'string') {
				throw new Meteor.Error('error-invalid-params', 'Module ID is required');
			}

			if (!fieldId || typeof fieldId !== 'string') {
				throw new Meteor.Error('error-invalid-params', 'Field ID is required');
			}

			const module = await Module.findById(moduleId);
			if (!module) {
				throw new Meteor.Error('error-module-not-found', 'Module not found');
			}

			const fieldDef = module.fieldDefinitions.find((f) => f._id === fieldId);
			if (!fieldDef) {
				throw new Meteor.Error('error-field-not-found', 'Field not found in module');
			}

			const documents = await Document.findByCustomFieldValue(moduleId, fieldId, value, {
				skip: offset,
				limit: count,
			});

			return API.v1.success({
				documents,
				count: documents.length,
				offset,
			});
		},
	},
);

declare module '@rocket.chat/rest-typings' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface Endpoints {
		'/v1/documents.create': {
			POST: (params: {
				name: string;
				description?: string;
				moduleId: string;
				stageId: string;
				parentId?: string;
				customFields?: ICustomFieldValue[];
			}) => {
				document: IDocument;
			};
		};
		'/v1/documents.list': {
			GET: (params: { moduleId: string; offset?: number; count?: number }) => {
				documents: IDocument[];
				count: number;
				offset: number;
			};
		};
		'/v1/documents.listByModuleId': {
			GET: (params: { moduleId: string; search?: string }) => {
				documents: IDocument[];
			};
		};
		'/v1/documents.listByStageId': {
			GET: (params: { stageId: string; offset?: number; count?: number }) => {
				documents: IDocument[];
				count: number;
				offset: number;
			};
		};
		'/v1/documents.info': {
			GET: (params: { documentId: string }) => {
				document: IDocument;
				children: IDocument[];
			};
		};
		'/v1/documents.update': {
			POST: (params: { documentId: string; name?: string; description?: string; stageId?: string; customFields?: ICustomFieldValue[] }) => {
				document: IDocument;
			};
		};
		'/v1/documents.moveToStage': {
			POST: (params: { documentId: string; stageId: string }) => {
				document: IDocument;
			};
		};
		'/v1/documents.reorder': {
			POST: (params: { stageId: string; documentIds: string[] }) => {
				documents: IDocument[];
			};
		};
		'/v1/documents.updateOrder': {
			POST: (params: { documentId: string; newOrder: number }) => {
				documents: IDocument[];
			};
		};
		'/v1/documents.delete': {
			POST: (params: { documentId: string }) => {
				deleted: boolean;
			};
		};
		'/v1/documents.search': {
			GET: (params: { moduleId: string; searchTerm: string; offset?: number; count?: number }) => {
				documents: IDocument[];
				count: number;
				offset: number;
			};
		};
		'/v1/documents.findByFieldValue': {
			GET: (params: { moduleId: string; fieldId: string; value: any; offset?: number; count?: number }) => {
				documents: IDocument[];
				count: number;
				offset: number;
			};
		};
	}
}
