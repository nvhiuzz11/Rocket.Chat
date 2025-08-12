import type { ICustomFieldValue, IDocument } from '../../../../server/core-typings/IDocument';
import { db } from '../../../../server/database/utils';
import { DocumentRaw } from '../../../../server/models/Document';
import { ModuleRaw } from '../../../../server/models/Module';
import { API } from '../api';
import { getPaginationItems } from '../helpers/getPaginationItems';

const Documents = new DocumentRaw(db);
const Modules = new ModuleRaw(db);

// Create a new document
API.v1.addRoute(
	'documents.create',
	{ authRequired: true },
	{
		async post() {
			const { workspaceId, title, description, customFields = [] } = this.bodyParams;

			if (!workspaceId || !title) {
				return API.v1.failure('Missing required fields: workspaceId and title are required');
			}

			// Verify workspace exists
			const workspace = await Modules.findOneById(workspaceId);
			if (!workspace) {
				return API.v1.notFound('Workspace/Module not found');
			}

			// Validate custom fields against module field definitions
			const validatedFields: ICustomFieldValue[] = [];
			for (const field of customFields) {
				const fieldDef = workspace.fieldDefinitions.find((f) => f._id === field.fieldId);
				if (!fieldDef) {
					return API.v1.failure(`Invalid field ID: ${field.fieldId}`);
				}

				// Check required fields
				if (fieldDef.isRequired && !field.value) {
					return API.v1.failure(`Field ${fieldDef.name} is required`);
				}

				validatedFields.push({
					fieldId: field.fieldId,
					value: field.value,
				});
			}

			// Check for missing required fields
			const requiredFields = workspace.fieldDefinitions.filter((f) => f.isRequired);
			for (const reqField of requiredFields) {
				if (!validatedFields.find((f) => f.fieldId === reqField._id)) {
					return API.v1.failure(`Required field ${reqField.name} is missing`);
				}
			}

			const document = await Documents.create({
				workspaceId,
				title,
				description,
				customFields: validatedFields,
			});

			return API.v1.success({ document });
		},
	},
);

// Get documents by workspace
API.v1.addRoute(
	'documents.getByWorkspace',
	{ authRequired: true },
	{
		async get() {
			const { workspaceId, sort } = this.queryParams;
			const { offset, count } = await getPaginationItems(this.queryParams);

			if (!workspaceId) {
				return API.v1.failure('workspaceId is required');
			}

			// Parse sort parameter
			let sortObj: Record<string, 1 | -1> = { order: 1 };
			if (sort) {
				try {
					sortObj = JSON.parse(sort as string);
				} catch {
					// Invalid sort format, use default
				}
			}

			const result = await Documents.findByWorkspaceIdPaginated(workspaceId as string, offset, count, sortObj);

			return API.v1.success({
				documents: result.documents,
				count: result.documents.length,
				offset,
				total: result.total,
			});
		},
	},
);

// Get document by ID
API.v1.addRoute(
	'documents.getById',
	{ authRequired: true },
	{
		async get() {
			const { documentId } = this.queryParams;

			if (!documentId) {
				return API.v1.failure('documentId is required');
			}

			const document = await Documents.findOneById(documentId as string);
			if (!document) {
				return API.v1.notFound('Document not found');
			}

			return API.v1.success({ document });
		},
	},
);

// Update document
API.v1.addRoute(
	'documents.update',
	{ authRequired: true },
	{
		async post() {
			const { documentId, title, description } = this.bodyParams;

			if (!documentId) {
				return API.v1.failure('documentId is required');
			}

			const document = await Documents.findOneById(documentId);
			if (!document) {
				return API.v1.notFound('Document not found');
			}

			const updates: Partial<IDocument> = {};
			if (title !== undefined) updates.title = title;
			if (description !== undefined) updates.description = description;

			await Documents.updateDocument(documentId, updates);

			return API.v1.success();
		},
	},
);

// Update custom fields
API.v1.addRoute(
	'documents.updateFields',
	{ authRequired: true },
	{
		async post() {
			const { documentId, fields } = this.bodyParams;

			if (!documentId || !fields || !Array.isArray(fields)) {
				return API.v1.failure('documentId and fields array are required');
			}

			const document = await Documents.findOneById(documentId);
			if (!document) {
				return API.v1.notFound('Document not found');
			}

			// Verify workspace and validate fields
			const workspace = await Modules.findOneById(document.workspaceId);
			if (!workspace) {
				return API.v1.notFound('Workspace/Module not found');
			}

			const validatedFields: ICustomFieldValue[] = [];
			for (const field of fields) {
				const fieldDef = workspace.fieldDefinitions.find((f) => f._id === field.fieldId);
				if (!fieldDef) {
					return API.v1.failure(`Invalid field ID: ${field.fieldId}`);
				}

				validatedFields.push({
					fieldId: field.fieldId,
					value: field.value,
				});
			}

			await Documents.updateMultipleCustomFields(documentId, validatedFields);

			return API.v1.success();
		},
	},
);

// Search documents
API.v1.addRoute(
	'documents.search',
	{ authRequired: true },
	{
		async get() {
			const { workspaceId, query } = this.queryParams;
			const { offset, count } = await getPaginationItems(this.queryParams);

			if (!workspaceId || !query) {
				return API.v1.failure('workspaceId and query are required');
			}

			const documents = await Documents.searchDocuments(workspaceId as string, query as string, {
				skip: offset,
				limit: count,
			});

			return API.v1.success({ documents });
		},
	},
);

// Filter by custom fields
API.v1.addRoute(
	'documents.filterByFields',
	{ authRequired: true },
	{
		async post() {
			const { workspaceId, filters } = this.bodyParams;
			const { offset, count } = await getPaginationItems(this.queryParams);

			if (!workspaceId || !filters || !Array.isArray(filters)) {
				return API.v1.failure('workspaceId and filters array are required');
			}

			const documents = await Documents.findByMultipleCustomFields(workspaceId, filters);

			// Apply pagination manually
			const paginatedDocs = documents.slice(offset, offset + count);

			return API.v1.success({
				documents: paginatedDocs,
				count: paginatedDocs.length,
				offset,
				total: documents.length,
			});
		},
	},
);

// Reorder document
API.v1.addRoute(
	'documents.reorder',
	{ authRequired: true },
	{
		async post() {
			const { documentId, newOrder } = this.bodyParams;

			if (!documentId || newOrder === undefined) {
				return API.v1.failure('documentId and newOrder are required');
			}

			const document = await Documents.findOneById(documentId);
			if (!document) {
				return API.v1.notFound('Document not found');
			}

			await Documents.reorderDocuments(document.workspaceId, documentId, newOrder);

			return API.v1.success();
		},
	},
);

// Delete document
API.v1.addRoute(
	'documents.delete',
	{ authRequired: true },
	{
		async post() {
			const { documentId } = this.bodyParams;

			if (!documentId) {
				return API.v1.failure('documentId is required');
			}

			const document = await Documents.findOneById(documentId);
			if (!document) {
				return API.v1.notFound('Document not found');
			}

			await Documents.deleteDocument(documentId);

			return API.v1.success();
		},
	},
);

// Get field value distribution (for analytics)
API.v1.addRoute(
	'documents.getFieldDistribution',
	{ authRequired: true },
	{
		async get() {
			const { workspaceId, fieldId } = this.queryParams;

			if (!workspaceId || !fieldId) {
				return API.v1.failure('workspaceId and fieldId are required');
			}

			const distribution = await Documents.getFieldValueDistribution(workspaceId as string, fieldId as string);

			return API.v1.success({ distribution });
		},
	},
);

// Bulk create documents
API.v1.addRoute(
	'documents.bulkCreate',
	{ authRequired: true },
	{
		async post() {
			const { workspaceId, documents } = this.bodyParams;

			if (!workspaceId || !documents || !Array.isArray(documents)) {
				return API.v1.failure('workspaceId and documents array are required');
			}

			// Verify workspace exists
			const workspace = await Modules.findOneById(workspaceId);
			if (!workspace) {
				return API.v1.notFound('Workspace/Module not found');
			}

			const createdDocuments: IDocument[] = [];
			const errors: Array<{ index: number; error: string }> = [];

			for (let i = 0; i < documents.length; i++) {
				try {
					const doc = documents[i];
					if (!doc.title) {
						errors.push({ index: i, error: 'Title is required' });
						continue;
					}

					// eslint-disable-next-line no-await-in-loop
					const document = await Documents.create({
						workspaceId,
						title: doc.title,
						description: doc.description,
						customFields: doc.customFields || [],
					});

					createdDocuments.push(document);
				} catch (error: any) {
					errors.push({ index: i, error: error.message });
				}
			}

			return API.v1.success({
				created: createdDocuments,
				errors,
				totalCreated: createdDocuments.length,
				totalErrors: errors.length,
			});
		},
	},
);

declare module '@rocket.chat/rest-typings' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface Endpoints {
		'/v1/documents.create': {
			POST: (params: { workspaceId: string; title: string; description?: string; customFields?: ICustomFieldValue[]; order?: number }) => {
				document: IDocument;
			};
		};
		'/v1/documents.getByWorkspace': {
			GET: (params: { workspaceId: string; offset?: number; count?: number; sort?: string }) => {
				documents: IDocument[];
				count: number;
				offset: number;
				total: number;
			};
		};
		'/v1/documents.getById': {
			GET: (params: { documentId: string }) => {
				document: IDocument;
			};
		};
		'/v1/documents.update': {
			POST: (params: { documentId: string; title?: string; description?: string }) => void;
		};
		'/v1/documents.updateFields': {
			POST: (params: { documentId: string; fields: ICustomFieldValue[] }) => void;
		};
		'/v1/documents.search': {
			GET: (params: { workspaceId: string; query: string; offset?: number; count?: number }) => {
				documents: IDocument[];
			};
		};
		'/v1/documents.filterByFields': {
			POST: (params: {
				workspaceId: string;
				filters: Array<{
					fieldId: string;
					value: any;
					operator?: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'nin';
				}>;
			}) => {
				documents: IDocument[];
				count: number;
				offset: number;
				total: number;
			};
		};
		'/v1/documents.reorder': {
			POST: (params: { documentId: string; newOrder: number }) => void;
		};
		'/v1/documents.delete': {
			POST: (params: { documentId: string }) => void;
		};
		'/v1/documents.getFieldDistribution': {
			GET: (params: { workspaceId: string; fieldId: string }) => {
				distribution: Array<{ value: any; count: number }>;
			};
		};
		'/v1/documents.bulkCreate': {
			POST: (params: {
				workspaceId: string;
				documents: Array<{
					title: string;
					description?: string;
					customFields?: ICustomFieldValue[];
					order?: number;
				}>;
			}) => {
				created: IDocument[];
				errors: Array<{ index: number; error: string }>;
				totalCreated: number;
				totalErrors: number;
			};
		};
	}
}
