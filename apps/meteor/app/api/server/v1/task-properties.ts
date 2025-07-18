import { TASK_PROPERTY_TYPE } from '../../../../definition/task';
import { db } from '../../../../server/database/utils';
import { TaskPropertyRaw } from '../../../../server/models/TaskProperty';
import { TaskTagRaw } from '../../../../server/models/TaskTag';
import { API } from '../api';
import { isTaskPropertyCreateProps, isTaskPropertyUpdateProps } from './rest-typings/task-properties';

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
			const { name, type, taskId, value } = this.bodyParams;
			const taskProperty = await TaskProperty.create({
				name,
				type,
				taskId,
				value,
			});
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
			const { taskId } = this.queryParams;

			const taskProperties = await TaskProperty.findByTaskId(taskId);

			const enrichedProperties = await Promise.all(
				taskProperties.map(async (property) => {
					if (!property.value) return property;

					if (property.type === TASK_PROPERTY_TYPE.MULTI_SELECT) {
						const enrichedValues = await Promise.all(
							property.value.map(async (value) => {
								const tag = await TaskTag.findById(value._id);
								return tag ? { ...value, name: tag.name, color: tag.color } : value;
							}),
						);
						return { ...property, value: enrichedValues };
					}

					if (property.type === TASK_PROPERTY_TYPE.SELECT && property.value?._id) {
						const tag = await TaskTag.findById(property.value._id);
						return tag ? { ...property, value: { ...property.value, name: tag.name, color: tag.color } } : property;
					}

					return property;
				}),
			);

			return API.v1.success({ taskProperties: enrichedProperties });
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
			const { taskId, data } = this.bodyParams;
			const result = await TaskProperty.updateById(taskId, data);
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
		async delete() {
			const { taskId } = this.bodyParams;
			const result = await TaskProperty.deleteById(taskId);
			return API.v1.success({ taskProperty: result });
		},
	},
);
