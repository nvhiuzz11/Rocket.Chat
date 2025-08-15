import { Random } from '@rocket.chat/random';
import { Meteor } from 'meteor/meteor';

import type { IModule, IFieldDefinition } from '../../../../server/core-typings/IModule';
import type { IStage } from '../../../../server/core-typings/IStage';
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
	'modules.create',
	{
		authRequired: true,
	},
	{
		async post() {
			const { name, roomId, description, fieldDefinitions } = this.bodyParams;

			if (!name || typeof name !== 'string') {
				throw new Meteor.Error('error-invalid-params', 'Module name is required');
			}

			if (!roomId || typeof roomId !== 'string') {
				throw new Meteor.Error('error-invalid-params', 'Room ID is required');
			}

			if (!fieldDefinitions || !Array.isArray(fieldDefinitions)) {
				throw new Meteor.Error('error-invalid-params', 'Field definitions must be an array');
			}

			const existingModule = await Module.findByName(name);
			if (existingModule) {
				throw new Meteor.Error('error-module-exists', 'Module with this name already exists');
			}

			const processedFields: IFieldDefinition[] = fieldDefinitions.map((field, index) => ({
				_id: field._id || Random.id(),
				name: field.name,
				type: field.type,
				options: field.options,
				isRequired: field.isRequired || false,
				order: field.order !== undefined ? field.order : index,
			}));

			const module = await Module.create(
				{
					_id: this.userId,
					username: this.user.username,
					name: this.user.name || this.user.username,
				},
				{
					name,
					roomId,
					description,
					fieldDefinitions: processedFields,
				},
			);

			// Create default "Ungroup" stage
			const defaultStage = await Stage.create({
				name: 'Ungroup',
				moduleId: module._id,
				color: '#6b7280',
				order: 0,
			});

			return API.v1.success({
				module,
				defaultStage,
			});
		},
	},
);

API.v1.addRoute(
	'modules.list',
	{
		authRequired: true,
	},
	{
		async get() {
			const { offset, count } = await getPaginationItems(this.queryParams);

			const modules = await Module.findAll({
				skip: offset,
				limit: count,
			});

			const total = await Module.col.countDocuments({});

			return API.v1.success({
				modules,
				count: modules.length,
				offset,
				total,
			});
		},
	},
);

API.v1.addRoute(
	'modules.listByRoomId',
	{
		authRequired: true,
	},
	{
		async get() {
			const { roomId } = this.queryParams;
			const { offset, count } = await getPaginationItems(this.queryParams);

			if (!roomId || typeof roomId !== 'string') {
				throw new Meteor.Error('error-invalid-params', 'Room ID is required');
			}

			const modules = await Module.findAllByRoomId(roomId, {
				skip: offset,
				limit: count,
			});

			// Enrich with stage and document counts
			const enrichedModules = await Promise.all(
				modules.map(async (module) => {
					const stageCount = await Stage.countByModuleId(module._id);
					const documentCount = await Document.countByModuleId(module._id);
					return {
						...module,
						stageCount,
						documentCount,
					};
				}),
			);

			const total = await Module.col.countDocuments({ roomId });

			return API.v1.success({
				modules: enrichedModules,
				count: enrichedModules.length,
				offset,
				total,
			});
		},
	},
);

API.v1.addRoute(
	'modules.info',
	{
		authRequired: true,
	},
	{
		async get() {
			const { moduleId, roomId } = this.queryParams;

			let module;
			if (moduleId && typeof moduleId === 'string') {
				module = await Module.findById(moduleId);
			} else if (roomId && typeof roomId === 'string') {
				module = await Module.findByRoomId(roomId);
			} else {
				throw new Meteor.Error('error-invalid-params', 'Module ID or Room ID is required');
			}

			if (!module) {
				throw new Meteor.Error('error-module-not-found', 'Module not found');
			}

			const stages = await Stage.findByModuleId(module._id);
			const documentCount = await Document.countByModuleId(module._id);

			return API.v1.success({
				module,
				stages,
				documentCount,
			});
		},
	},
);

API.v1.addRoute(
	'modules.update',
	{
		authRequired: true,
	},
	{
		async post() {
			const { moduleId, name, roomId, description, fieldDefinitions } = this.bodyParams;

			if (!moduleId || typeof moduleId !== 'string') {
				throw new Meteor.Error('error-invalid-params', 'Module ID is required');
			}

			const module = await Module.findById(moduleId);
			if (!module) {
				throw new Meteor.Error('error-module-not-found', 'Module not found');
			}

			const updateData: Partial<IModule> = {};

			if (name) {
				const existingModule = await Module.findByName(name);
				if (existingModule && existingModule._id !== moduleId) {
					throw new Meteor.Error('error-module-name-exists', 'Module with this name already exists');
				}
				updateData.name = name;
			}

			if (roomId && typeof roomId === 'string') {
				updateData.roomId = roomId;
			}

			if (description !== undefined) {
				updateData.description = description;
			}

			if (fieldDefinitions && Array.isArray(fieldDefinitions)) {
				const processedFields: IFieldDefinition[] = fieldDefinitions.map((field, index) => ({
					_id: field._id || Random.id(),
					name: field.name,
					type: field.type,
					options: field.options,
					isRequired: field.isRequired || false,
					order: field.order !== undefined ? field.order : index,
				}));
				updateData.fieldDefinitions = processedFields;
			}

			await Module.updateById(moduleId, updateData);

			const updatedModule = await Module.findById(moduleId);

			return API.v1.success({ module: updatedModule });
		},
	},
);

API.v1.addRoute(
	'modules.delete',
	{
		authRequired: true,
	},
	{
		async post() {
			const { moduleId } = this.bodyParams;

			if (!moduleId || typeof moduleId !== 'string') {
				throw new Meteor.Error('error-invalid-params', 'Module ID is required');
			}

			const module = await Module.findById(moduleId);
			if (!module) {
				throw new Meteor.Error('error-module-not-found', 'Module not found');
			}

			await Document.deleteByModuleId(moduleId);
			await Stage.deleteByModuleId(moduleId);
			await Module.deleteById(moduleId);

			return API.v1.success({ deleted: true });
		},
	},
);

API.v1.addRoute(
	'modules.addField',
	{
		authRequired: true,
	},
	{
		async post() {
			const { moduleId, field } = this.bodyParams;

			if (!moduleId || typeof moduleId !== 'string') {
				throw new Meteor.Error('error-invalid-params', 'Module ID is required');
			}

			if (!field || typeof field !== 'object') {
				throw new Meteor.Error('error-invalid-params', 'Field definition is required');
			}

			const module = await Module.findById(moduleId);
			if (!module) {
				throw new Meteor.Error('error-module-not-found', 'Module not found');
			}

			const fieldDefinition: IFieldDefinition = {
				_id: field._id || Random.id(),
				name: field.name,
				type: field.type,
				options: field.options,
				isRequired: field.isRequired || false,
				order: field.order !== undefined ? field.order : module.fieldDefinitions.length,
			};

			await Module.addFieldDefinition(moduleId, fieldDefinition);

			const updatedModule = await Module.findById(moduleId);

			return API.v1.success({ module: updatedModule });
		},
	},
);

API.v1.addRoute(
	'modules.removeField',
	{
		authRequired: true,
	},
	{
		async post() {
			const { moduleId, fieldId } = this.bodyParams;

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

			await Module.removeFieldDefinition(moduleId, fieldId);

			const updatedModule = await Module.findById(moduleId);

			return API.v1.success({ module: updatedModule });
		},
	},
);

API.v1.addRoute(
	'modules.fields.create',
	{
		authRequired: true,
	},
	{
		async post() {
			const { moduleId, name, type, isRequired, options, order } = this.bodyParams;

			if (!moduleId || typeof moduleId !== 'string') {
				throw new Meteor.Error('error-invalid-params', 'Module ID is required');
			}

			if (!name || typeof name !== 'string') {
				throw new Meteor.Error('error-invalid-params', 'Field name is required');
			}

			if (!type || typeof type !== 'string') {
				throw new Meteor.Error('error-invalid-params', 'Field type is required');
			}

			const module = await Module.findById(moduleId);
			if (!module) {
				throw new Meteor.Error('error-module-not-found', 'Module not found');
			}

			const fieldDefinition: IFieldDefinition = {
				_id: Random.id(),
				name,
				type,
				options: options || [],
				isRequired: isRequired || false,
				order: order !== undefined ? order : module.fieldDefinitions.length,
			};

			await Module.addFieldDefinition(moduleId, fieldDefinition);

			const updatedModule = await Module.findById(moduleId);

			return API.v1.success({ 
				module: updatedModule,
				field: fieldDefinition 
			});
		},
	},
);

API.v1.addRoute(
	'modules.fields.update',
	{
		authRequired: true,
	},
	{
		async post() {
			const { _id, data } = this.bodyParams;

			if (!_id || typeof _id !== 'string') {
				throw new Meteor.Error('error-invalid-params', 'Field ID is required');
			}

			if (!data || typeof data !== 'object') {
				throw new Meteor.Error('error-invalid-params', 'Field data is required');
			}

			// Find the module that contains this field
			const module = await Module.col.findOne({ 'fieldDefinitions._id': _id });
			if (!module) {
				throw new Meteor.Error('error-field-not-found', 'Field not found');
			}

			// Update the specific field within the fieldDefinitions array
			await Module.col.updateOne(
				{ 'fieldDefinitions._id': _id },
				{
					$set: {
						'fieldDefinitions.$.name': data.name,
						'fieldDefinitions.$.type': data.type,
						'fieldDefinitions.$.isRequired': data.isRequired,
						'fieldDefinitions.$.order': data.order,
						...(data.options && { 'fieldDefinitions.$.options': data.options }),
					},
				},
			);

			const updatedModule = await Module.findById(module._id);

			return API.v1.success({ 
				module: updatedModule,
				success: true 
			});
		},
	},
);

API.v1.addRoute(
	'modules.fields.delete',
	{
		authRequired: true,
	},
	{
		async post() {
			const { _id } = this.bodyParams;

			if (!_id || typeof _id !== 'string') {
				throw new Meteor.Error('error-invalid-params', 'Field ID is required');
			}

			// Find the module that contains this field
			const module = await Module.col.findOne({ 'fieldDefinitions._id': _id });
			if (!module) {
				throw new Meteor.Error('error-field-not-found', 'Field not found');
			}

			await Module.removeFieldDefinition(module._id, _id);

			const updatedModule = await Module.findById(module._id);

			return API.v1.success({ 
				module: updatedModule,
				success: true 
			});
		},
	},
);

API.v1.addRoute(
	'modules.fields.list',
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

			// Sort fields by order
			const sortedFields = [...(module.fieldDefinitions || [])].sort((a, b) => a.order - b.order);

			return API.v1.success({ 
				fieldDefinitions: sortedFields 
			});
		},
	},
);

API.v1.addRoute(
	'modules.field-options.create',
	{
		authRequired: true,
	},
	{
		async post() {
			const { fieldId, value, color, order } = this.bodyParams;

			if (!fieldId || typeof fieldId !== 'string') {
				throw new Meteor.Error('error-invalid-params', 'Field ID is required');
			}

			if (!value || typeof value !== 'string') {
				throw new Meteor.Error('error-invalid-params', 'Option value is required');
			}

			// Find the module that contains this field
			const module = await Module.col.findOne({ 'fieldDefinitions._id': fieldId });
			if (!module) {
				throw new Meteor.Error('error-field-not-found', 'Field not found');
			}

			// Find the field
			const field = module.fieldDefinitions.find((f: IFieldDefinition) => f._id === fieldId);
			if (!field) {
				throw new Meteor.Error('error-field-not-found', 'Field not found');
			}

			const newOption = {
				_id: Random.id(),
				value,
				color: color || '#3498db',
				order: order !== undefined ? order : (field.options?.length || 0),
			};

			// Add the new option to the field
			await Module.col.updateOne(
				{ 'fieldDefinitions._id': fieldId },
				{
					$push: { 'fieldDefinitions.$.options': newOption },
				},
			);

			const updatedModule = await Module.findById(module._id);

			return API.v1.success({ 
				module: updatedModule,
				option: newOption 
			});
		},
	},
);

API.v1.addRoute(
	'modules.field-options.update',
	{
		authRequired: true,
	},
	{
		async post() {
			const { _id, data } = this.bodyParams;

			if (!_id || typeof _id !== 'string') {
				throw new Meteor.Error('error-invalid-params', 'Option ID is required');
			}

			if (!data || typeof data !== 'object') {
				throw new Meteor.Error('error-invalid-params', 'Option data is required');
			}

			// Find the module that contains this option
			const module = await Module.col.findOne({ 'fieldDefinitions.options._id': _id });
			if (!module) {
				throw new Meteor.Error('error-option-not-found', 'Option not found');
			}

			// Update the specific option
			const updateFields: any = {};
			if (data.value !== undefined) updateFields['fieldDefinitions.$[field].options.$[option].value'] = data.value;
			if (data.color !== undefined) updateFields['fieldDefinitions.$[field].options.$[option].color'] = data.color;
			if (data.order !== undefined) updateFields['fieldDefinitions.$[field].options.$[option].order'] = data.order;

			await Module.col.updateOne(
				{ _id: module._id },
				{ $set: updateFields },
				{
					arrayFilters: [
						{ 'field.options._id': _id },
						{ 'option._id': _id },
					],
				},
			);

			const updatedModule = await Module.findById(module._id);

			return API.v1.success({ 
				module: updatedModule,
				success: true 
			});
		},
	},
);

API.v1.addRoute(
	'modules.field-options.delete',
	{
		authRequired: true,
	},
	{
		async post() {
			const { _id } = this.bodyParams;

			if (!_id || typeof _id !== 'string') {
				throw new Meteor.Error('error-invalid-params', 'Option ID is required');
			}

			// Find the module that contains this option
			const module = await Module.col.findOne({ 'fieldDefinitions.options._id': _id });
			if (!module) {
				throw new Meteor.Error('error-option-not-found', 'Option not found');
			}

			// Remove the option
			await Module.col.updateOne(
				{ _id: module._id },
				{
					$pull: { 'fieldDefinitions.$.options': { _id } },
				},
			);

			const updatedModule = await Module.findById(module._id);

			return API.v1.success({ 
				module: updatedModule,
				success: true 
			});
		},
	},
);

API.v1.addRoute(
	'modules.field-options.updateOrder',
	{
		authRequired: true,
	},
	{
		async post() {
			const { options } = this.bodyParams;

			if (!options || !Array.isArray(options)) {
				throw new Meteor.Error('error-invalid-params', 'Options array is required');
			}

			// Process each option update
			for (const option of options) {
				if (!option._id || typeof option.order !== 'number') {
					throw new Meteor.Error('error-invalid-params', 'Each option must have _id and order');
				}

				// Find the module that contains this option
				const module = await Module.col.findOne({ 'fieldDefinitions.options._id': option._id });
				if (module) {
					// Update the option order
					await Module.col.updateOne(
						{ _id: module._id },
						{
							$set: { 'fieldDefinitions.$[field].options.$[option].order': option.order },
						},
						{
							arrayFilters: [
								{ 'field.options._id': option._id },
								{ 'option._id': option._id },
							],
						},
					);
				}
			}

			return API.v1.success({ success: true });
		},
	},
);

declare module '@rocket.chat/rest-typings' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface Endpoints {
		'/v1/modules.create': {
			POST: (params: { name: string; roomId: string; description: string; fieldDefinitions: IFieldDefinition[] }) => {
				module: IModule;
			};
		};
		'/v1/modules.list': {
			GET: () => {
				modules: IModule[];
				count: number;
				offset: number;
				total: number;
			};
		};
		'/v1/modules.listByRoomId': {
			GET: (params: { roomId: string; offset?: number; count?: number }) => {
				modules: (IModule & { stageCount: number; documentCount: number })[];
				count: number;
				offset: number;
				total: number;
			};
		};
		'/v1/modules.info': {
			GET: (params: { moduleId?: string; roomId?: string }) => {
				module: IModule;
				stages: IStage[];
				documentCount: number;
			};
		};
		'/v1/modules.update': {
			POST: (params: { moduleId: string; name: string; roomId: string; description: string; fieldDefinitions: IFieldDefinition[] }) => {
				module: IModule;
			};
		};
		'/v1/modules.delete': {
			POST: (params: { moduleId: string }) => {
				deleted: boolean;
			};
		};
		'/v1/modules.addField': {
			POST: (params: { moduleId: string; field: IFieldDefinition }) => {
				module: IModule;
			};
		};
		'/v1/modules.removeField': {
			POST: (params: { moduleId: string; fieldId: string }) => {
				module: IModule;
			};
		};
		'/v1/modules.fields.create': {
			POST: (params: { moduleId: string; name: string; type: string; isRequired?: boolean; options?: any[]; order?: number }) => {
				module: IModule;
				field: IFieldDefinition;
			};
		};
		'/v1/modules.fields.update': {
			POST: (params: { _id: string; data: Partial<IFieldDefinition> }) => {
				module: IModule;
				success: boolean;
			};
		};
		'/v1/modules.fields.delete': {
			POST: (params: { _id: string }) => {
				module: IModule;
				success: boolean;
			};
		};
		'/v1/modules.fields.list': {
			GET: (params: { moduleId: string }) => {
				fieldDefinitions: IFieldDefinition[];
			};
		};
		'/v1/modules.field-options.create': {
			POST: (params: { fieldId: string; value: string; color?: string; order?: number }) => {
				module: IModule;
				option: { _id: string; value: string; color: string; order: number };
			};
		};
		'/v1/modules.field-options.update': {
			POST: (params: { _id: string; data: { value?: string; color?: string; order?: number } }) => {
				module: IModule;
				success: boolean;
			};
		};
		'/v1/modules.field-options.delete': {
			POST: (params: { _id: string }) => {
				module: IModule;
				success: boolean;
			};
		};
		'/v1/modules.field-options.updateOrder': {
			POST: (params: { options: { _id: string; order: number }[] }) => {
				success: boolean;
			};
		};
	}
}
