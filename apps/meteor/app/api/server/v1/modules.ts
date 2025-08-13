import { Meteor } from 'meteor/meteor';
import { Random } from '@rocket.chat/random';

import type { IModule, IFieldDefinition } from '../../../../server/core-typings/IModule';
import type { IStage } from '../../../../server/core-typings/IStage';
import type { IDocument } from '../../../../server/core-typings/IDocument';
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
			const { name, description, fieldDefinitions } = this.bodyParams;

			if (!name || typeof name !== 'string') {
				throw new Meteor.Error('error-invalid-params', 'Module name is required');
			}

			if (!fieldDefinitions || !Array.isArray(fieldDefinitions)) {
				throw new Meteor.Error('error-invalid-params', 'Field definitions must be an array');
			}

			const existingModule = await Module.findByName(name);
			if (existingModule) {
				throw new Meteor.Error('error-module-exists', 'Module with this name already exists');
			}

			const processedFields: IFieldDefinition[] = fieldDefinitions.map((field) => ({
				_id: field._id || Random.id(),
				name: field.name,
				type: field.type,
				options: field.options,
				isRequired: field.isRequired || false,
			}));

			const module = await Module.create(
				{
					_id: this.userId,
					username: this.user.username,
					name: this.user.name,
				},
				{
					name,
					description,
					fieldDefinitions: processedFields,
				},
			);

			return API.v1.success({ module });
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
	'modules.info',
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

			const stages = await Stage.findByModuleId(moduleId);
			const documentCount = await Document.countByModuleId(moduleId);

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
			const { moduleId, name, description, fieldDefinitions } = this.bodyParams;

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

			if (description !== undefined) {
				updateData.description = description;
			}

			if (fieldDefinitions && Array.isArray(fieldDefinitions)) {
				const processedFields: IFieldDefinition[] = fieldDefinitions.map((field) => ({
					_id: field._id || Random.id(),
					name: field.name,
					type: field.type,
					options: field.options,
					isRequired: field.isRequired || false,
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
