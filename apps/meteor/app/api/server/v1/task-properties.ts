import { db } from '../../../../server/database/utils';
import { TaskPropertyRaw } from '../../../../server/models/TaskProperty';
import { TaskTagRaw } from '../../../../server/models/TaskTag';
import { API } from '../api';
import { isTaskPropertyCreateProps, isTaskPropertyUpdateProps } from './rest-typings/task-properties';
import type { ITaskProperty } from '../../../../server/core-typings/ITaskProperty';

const TaskProperty = new TaskPropertyRaw(db);
const TaskTag = new TaskTagRaw(db);

API.v1.addRoute(
	'task-properties.create',
	{
		authRequired: true,
		validateParams: isTaskPropertyCreateProps,
	},
	{
		async post() {
			const { name, type, projectId, required = false, systemKey = undefined } = this.bodyParams;
			const taskPropertyId = await TaskProperty.create({
				name,
				type,
				projectId,
				required,
				systemKey,
			});

			const taskProperty = await TaskProperty.findById(taskPropertyId);
			return API.v1.success({ taskProperty });
		},
	},
);

API.v1.addRoute(
	'task-properties.list',
	{
		authRequired: true,
	},
	{
		async get() {
			const { projectId } = this.queryParams;

			if (!projectId) {
				return API.v1.failure('Project ID is required');
			}

			const taskProperties = await TaskProperty.findByProjectId(projectId);

			const processedProperties = await Promise.all(
				taskProperties.map(async (property) => {
					const tags = await TaskTag.findByPropertyId(property._id);
					return { ...property, value: tags };
				}),
			);

			return API.v1.success({ taskProperties: processedProperties });
		},
	},
);

API.v1.addRoute(
	'task-properties.update',
	{
		authRequired: true,
		validateParams: isTaskPropertyUpdateProps,
	},
	{
		async post() {
			const { _id, data } = this.bodyParams;
			const result = await TaskProperty.updateById(_id, data);
			return API.v1.success({ taskProperty: result });
		},
	},
);

API.v1.addRoute(
	'task-properties.delete',
	{
		authRequired: true,
	},
	{
		async post() {
			const { _id } = this.bodyParams;

			if (!_id) {
				return API.v1.failure('Property ID is required');
			}

			await TaskTag.deleteByPropertyId(_id);

			await TaskProperty.deleteById(_id);
			return API.v1.success({ success: true });
		},
	},
);

declare module '@rocket.chat/rest-typings' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface Endpoints {
		'/v1/task-properties.create': {
			POST: (params: { name: string; type: string; projectId: string; required?: boolean; systemKey?: string }) => {
				taskProperty: ITaskProperty;
			};
		};
		'/v1/task-properties.list': {
			GET: (params: { projectId: string }) => {
				taskProperties: ITaskProperty[];
			};
		};
		'/v1/task-properties.update': {
			POST: (params: { _id: string; data: Partial<ITaskProperty> }) => {
				taskProperty: ITaskProperty;
			};
		};
		'/v1/task-properties.delete': {
			POST: (params: { _id: string }) => {
				success: boolean;
			};
		};
	}
}
