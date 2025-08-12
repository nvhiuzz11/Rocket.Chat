import { Random } from '@rocket.chat/random';

import type { IFieldDefinition, IModule, ModuleType } from '../../../../server/core-typings/IModule';
import { db } from '../../../../server/database/utils';
import { ModuleRaw } from '../../../../server/models/Module';
import { API } from '../api';
import { getPaginationItems } from '../helpers/getPaginationItems';

const Modules = new ModuleRaw(db);

// Create a new module
API.v1.addRoute(
	'modules.create',
	{ authRequired: true },
	{
		async post() {
			const { name, description, type, roomId, teamId, fieldDefinitions = [] } = this.bodyParams;

			if (!name || !type || !roomId) {
				return API.v1.failure('Missing required fields: name, type, and roomId are required');
			}

			// Validate module type
			const validTypes: ModuleType[] = ['project', 'task', 'recruitment', 'deal'];
			if (!validTypes.includes(type)) {
				return API.v1.failure(`Invalid module type. Must be one of: ${validTypes.join(', ')}`);
			}

			// Check if module already exists for this room and type
			const existingModule = await Modules.findByRoomIdAndType(roomId, type);
			if (existingModule) {
				return API.v1.failure(`A ${type} module already exists for this room`);
			}

			// Process field definitions
			const processedFields: IFieldDefinition[] = fieldDefinitions.map((field: any) => ({
				_id: field._id || Random.id(),
				name: field.name,
				type: field.type,
				systemKey: field.systemKey,
				options: field.options,
				isRequired: field.isRequired || false,
			}));

			const module = await Modules.create(
				{ _id: this.userId!, username: this.user.username!, name: this.user.name },
				{
					name,
					description,
					type,
					roomId,
					teamId,
					fieldDefinitions: processedFields,
				},
			);

			return API.v1.success({ module });
		},
	},
);

// Get modules by room
API.v1.addRoute(
	'modules.getByRoom',
	{ authRequired: true },
	{
		async get() {
			const { roomId } = this.queryParams;

			if (!roomId) {
				return API.v1.failure('roomId is required');
			}

			const modules = await Modules.findByRoomId(roomId as string);
			return API.v1.success({ modules });
		},
	},
);

// Get module by ID
API.v1.addRoute(
	'modules.getById',
	{ authRequired: true },
	{
		async get() {
			const { moduleId } = this.queryParams;

			if (!moduleId) {
				return API.v1.failure('moduleId is required');
			}

			const module = await Modules.findOneById(moduleId as string);
			if (!module) {
				return API.v1.notFound('Module not found');
			}

			return API.v1.success({ module });
		},
	},
);

// Update module
API.v1.addRoute(
	'modules.update',
	{ authRequired: true },
	{
		async post() {
			const { moduleId, name, description, teamId } = this.bodyParams;

			if (!moduleId) {
				return API.v1.failure('moduleId is required');
			}

			const module = await Modules.findOneById(moduleId);
			if (!module) {
				return API.v1.notFound('Module not found');
			}

			const updates: Partial<IModule> = {};
			if (name !== undefined) updates.name = name;
			if (description !== undefined) updates.description = description;
			if (teamId !== undefined) updates.teamId = teamId;

			await Modules.updateModule(moduleId, updates);

			return API.v1.success();
		},
	},
);

// Add field definition
API.v1.addRoute(
	'modules.addField',
	{ authRequired: true },
	{
		async post() {
			const { moduleId, field } = this.bodyParams;

			if (!moduleId || !field || !field.name || !field.type) {
				return API.v1.failure('moduleId and field (with name and type) are required');
			}

			const module = await Modules.findOneById(moduleId);
			if (!module) {
				return API.v1.notFound('Module not found');
			}

			const newField: IFieldDefinition = {
				_id: Random.id(),
				name: field.name,
				type: field.type,
				systemKey: field.systemKey,
				options: field.options,
				isRequired: field.isRequired || false,
			};

			await Modules.addFieldDefinition(moduleId, newField);

			return API.v1.success({ field: newField });
		},
	},
);

// Update field definition
API.v1.addRoute(
	'modules.updateField',
	{ authRequired: true },
	{
		async post() {
			const { moduleId, fieldId, updates } = this.bodyParams;

			if (!moduleId || !fieldId || !updates) {
				return API.v1.failure('moduleId, fieldId, and updates are required');
			}

			const module = await Modules.findOneById(moduleId);
			if (!module) {
				return API.v1.notFound('Module not found');
			}

			const field = module.fieldDefinitions.find((f) => f._id === fieldId);
			if (!field) {
				return API.v1.notFound('Field not found');
			}

			await Modules.updateFieldDefinition(moduleId, fieldId, updates);

			return API.v1.success();
		},
	},
);

// Remove field definition
API.v1.addRoute(
	'modules.removeField',
	{ authRequired: true },
	{
		async post() {
			const { moduleId, fieldId } = this.bodyParams;

			if (!moduleId || !fieldId) {
				return API.v1.failure('moduleId and fieldId are required');
			}

			const module = await Modules.findOneById(moduleId);
			if (!module) {
				return API.v1.notFound('Module not found');
			}

			await Modules.removeFieldDefinition(moduleId, fieldId);

			return API.v1.success();
		},
	},
);

// Delete module
API.v1.addRoute(
	'modules.delete',
	{ authRequired: true },
	{
		async post() {
			const { moduleId } = this.bodyParams;

			if (!moduleId) {
				return API.v1.failure('moduleId is required');
			}

			const module = await Modules.findOneById(moduleId);
			if (!module) {
				return API.v1.notFound('Module not found');
			}

			// TODO: Check if there are documents using this module and handle accordingly

			await Modules.deleteModule(moduleId);

			return API.v1.success();
		},
	},
);

// List modules by type
API.v1.addRoute(
	'modules.listByType',
	{ authRequired: true },
	{
		async get() {
			const { type } = this.queryParams;
			const { offset, count } = await getPaginationItems(this.queryParams);

			if (!type) {
				return API.v1.failure('type is required');
			}

			const modules = await Modules.find(
				{ type: type as ModuleType },
				{
					skip: offset,
					limit: count,
					sort: { createdAt: -1 },
				},
			).toArray();

			const total = await Modules.col.countDocuments({ type: type as ModuleType });

			return API.v1.success({
				modules,
				count: modules.length,
				offset,
				total,
			});
		},
	},
);

declare module '@rocket.chat/rest-typings' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface Endpoints {
		'/v1/modules.create': {
			POST: (params: {
				name: string;
				description?: string;
				type: ModuleType;
				roomId: string;
				teamId?: string;
				fieldDefinitions?: IFieldDefinition[];
			}) => {
				module: IModule;
			};
		};
		'/v1/modules.getByRoom': {
			GET: (params: { roomId: string }) => {
				modules: IModule[];
			};
		};
		'/v1/modules.getById': {
			GET: (params: { moduleId: string }) => {
				module: IModule;
			};
		};
		'/v1/modules.update': {
			POST: (params: { moduleId: string; name?: string; description?: string; teamId?: string }) => void;
		};
		'/v1/modules.addField': {
			POST: (params: { moduleId: string; field: Omit<IFieldDefinition, '_id'> }) => {
				field: IFieldDefinition;
			};
		};
		'/v1/modules.updateField': {
			POST: (params: { moduleId: string; fieldId: string; updates: Partial<IFieldDefinition> }) => void;
		};
		'/v1/modules.removeField': {
			POST: (params: { moduleId: string; fieldId: string }) => void;
		};
		'/v1/modules.delete': {
			POST: (params: { moduleId: string }) => void;
		};
		'/v1/modules.listByType': {
			GET: (params: { type: ModuleType; offset?: number; count?: number }) => {
				modules: IModule[];
				count: number;
				offset: number;
				total: number;
			};
		};
	}
}
