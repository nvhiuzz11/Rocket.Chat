import { Meteor } from 'meteor/meteor';

import type { IStage } from '../../../../server/core-typings/IStage';
import { db } from '../../../../server/database/utils';
import { DocumentRaw } from '../../../../server/models/Document';
import { ModuleRaw } from '../../../../server/models/Module';
import { StageRaw } from '../../../../server/models/Stage';
import { API } from '../api';

const Module = new ModuleRaw(db);
const Stage = new StageRaw(db);
const Document = new DocumentRaw(db);

API.v1.addRoute(
	'stages.create',
	{
		authRequired: true,
	},
	{
		async post() {
			const { moduleId, name, order } = this.bodyParams;

			if (!moduleId || typeof moduleId !== 'string') {
				throw new Meteor.Error('error-invalid-params', 'Module ID is required');
			}

			if (!name || typeof name !== 'string') {
				throw new Meteor.Error('error-invalid-params', 'Stage name is required');
			}

			const module = await Module.findById(moduleId);
			if (!module) {
				throw new Meteor.Error('error-module-not-found', 'Module not found');
			}

			const existingStage = await Stage.findByModuleIdAndName(moduleId, name);
			if (existingStage) {
				throw new Meteor.Error('error-stage-exists', 'Stage with this name already exists in this module');
			}

			const stage = await Stage.create({
				name,
				moduleId,
				order,
			});

			return API.v1.success({ stage });
		},
	},
);

API.v1.addRoute(
	'stages.list',
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

			const stagesWithCounts = await Promise.all(
				stages.map(async (stage) => {
					const documentCount = await Document.countByStageId(stage._id);
					return {
						...stage,
						documentCount,
					};
				}),
			);

			return API.v1.success({
				stages: stagesWithCounts,
				count: stagesWithCounts.length,
			});
		},
	},
);

API.v1.addRoute(
	'stages.info',
	{
		authRequired: true,
	},
	{
		async get() {
			const { stageId } = this.queryParams;

			if (!stageId || typeof stageId !== 'string') {
				throw new Meteor.Error('error-invalid-params', 'Stage ID is required');
			}

			const stage = await Stage.findById(stageId);
			if (!stage) {
				throw new Meteor.Error('error-stage-not-found', 'Stage not found');
			}

			const documentCount = await Document.countByStageId(stageId);

			return API.v1.success({
				stage,
				documentCount,
			});
		},
	},
);

API.v1.addRoute(
	'stages.update',
	{
		authRequired: true,
	},
	{
		async post() {
			const { stageId, name } = this.bodyParams;

			if (!stageId || typeof stageId !== 'string') {
				throw new Meteor.Error('error-invalid-params', 'Stage ID is required');
			}

			const stage = await Stage.findById(stageId);
			if (!stage) {
				throw new Meteor.Error('error-stage-not-found', 'Stage not found');
			}

			const updateData: Partial<IStage> = {};

			if (name) {
				const existingStage = await Stage.findByModuleIdAndName(stage.moduleId, name);
				if (existingStage && existingStage._id !== stageId) {
					throw new Meteor.Error('error-stage-name-exists', 'Stage with this name already exists in this module');
				}
				updateData.name = name;
			}

			await Stage.updateById(stageId, updateData);

			const updatedStage = await Stage.findById(stageId);

			return API.v1.success({ stage: updatedStage });
		},
	},
);

API.v1.addRoute(
	'stages.updateOrder',
	{
		authRequired: true,
	},
	{
		async post() {
			const { stageId, newOrder } = this.bodyParams;

			if (!stageId || typeof stageId !== 'string') {
				throw new Meteor.Error('error-invalid-params', 'Stage ID is required');
			}

			if (typeof newOrder !== 'number' || newOrder < 0) {
				throw new Meteor.Error('error-invalid-params', 'Valid order number is required');
			}

			const stage = await Stage.findById(stageId);
			if (!stage) {
				throw new Meteor.Error('error-stage-not-found', 'Stage not found');
			}

			await Stage.updateOrder(stageId, newOrder);

			const stages = await Stage.findByModuleId(stage.moduleId);

			return API.v1.success({ stages });
		},
	},
);

API.v1.addRoute(
	'stages.reorder',
	{
		authRequired: true,
	},
	{
		async post() {
			const { moduleId, stageIds } = this.bodyParams;

			if (!moduleId || typeof moduleId !== 'string') {
				throw new Meteor.Error('error-invalid-params', 'Module ID is required');
			}

			if (!stageIds || !Array.isArray(stageIds)) {
				throw new Meteor.Error('error-invalid-params', 'Stage IDs array is required');
			}

			const module = await Module.findById(moduleId);
			if (!module) {
				throw new Meteor.Error('error-module-not-found', 'Module not found');
			}

			await Stage.reorderStages(moduleId, stageIds);

			const stages = await Stage.findByModuleId(moduleId);

			return API.v1.success({ stages });
		},
	},
);

API.v1.addRoute(
	'stages.delete',
	{
		authRequired: true,
	},
	{
		async post() {
			const { stageId, moveDocumentsToStageId } = this.bodyParams;

			if (!stageId || typeof stageId !== 'string') {
				throw new Meteor.Error('error-invalid-params', 'Stage ID is required');
			}

			const stage = await Stage.findById(stageId);
			if (!stage) {
				throw new Meteor.Error('error-stage-not-found', 'Stage not found');
			}

			const documentCount = await Document.countByStageId(stageId);
			if (documentCount > 0) {
				if (!moveDocumentsToStageId) {
					throw new Meteor.Error(
						'error-stage-has-documents',
						`Stage has ${documentCount} documents. Provide moveDocumentsToStageId to move them to another stage.`,
					);
				}

				const targetStage = await Stage.findById(moveDocumentsToStageId);
				if (!targetStage) {
					throw new Meteor.Error('error-target-stage-not-found', 'Target stage not found');
				}

				if (targetStage.moduleId !== stage.moduleId) {
					throw new Meteor.Error('error-stage-different-module', 'Target stage must be in the same module');
				}

				const documents = await Document.findByStageId(stageId);
				for (const doc of documents) {
					await Document.moveToStage(doc._id, moveDocumentsToStageId);
				}
			}

			await Stage.deleteById(stageId);

			return API.v1.success({ deleted: true });
		},
	},
);
