import { PROJECT_PROPERTY_TYPE } from '../../../../definition/project';
import { db } from '../../../../server/database/utils';
import { ProjectPropertyRaw } from '../../../../server/models/ProjectProperty';
import { ProjectTagRaw } from '../../../../server/models/ProjectTag';
import { API } from '../api';
import { isProjectPropertyCreateProps, isProjectPropertyUpdateProps } from './rest-typings/project-properties';

const ProjectProperty = new ProjectPropertyRaw(db);
const ProjectTag = new ProjectTagRaw(db);

API.v1.addRoute(
	'project-properties.create',
	{
		authRequired: true,
		validateParams: isProjectPropertyCreateProps,
	},
	{
		async post() {
			const { name, type, projectId, value } = this.bodyParams;
			const projectProperty = await ProjectProperty.create({
				name,
				type,
				projectId,
				value,
			});
			return API.v1.success({ projectProperty });
		},
	},
);

API.v1.addRoute(
	'project-properties.list',
	{
		authRequired: true,
	},
	{
		async get() {
			const { projectId } = this.queryParams;

			const projectProperties = await ProjectProperty.findByProjectId(projectId);

			const enrichedProperties = await Promise.all(
				projectProperties.map(async (property) => {
					if (!property.value) return property;

					if (property.type === PROJECT_PROPERTY_TYPE.MULTI_SELECT) {
						const enrichedValues = await Promise.all(
							property.value.map(async (value) => {
								const tag = await ProjectTag.findById(value._id);
								return tag ? { ...value, name: tag.name, color: tag.color } : value;
							}),
						);
						return { ...property, value: enrichedValues };
					}

					if (property.type === PROJECT_PROPERTY_TYPE.SELECT && property.value?._id) {
						const tag = await ProjectTag.findById(property.value._id);
						return tag ? { ...property, value: { ...property.value, name: tag.name, color: tag.color } } : property;
					}

					return property;
				}),
			);

			return API.v1.success({ projectProperties: enrichedProperties });
		},
	},
);

API.v1.addRoute(
	'project-properties.update',
	{
		authRequired: true,
		validateParams: isProjectPropertyUpdateProps,
	},
	{
		async post() {
			const { projectId, data } = this.bodyParams;
			const result = await ProjectProperty.updateById(projectId, data);
			return API.v1.success({ projectProperty: result });
		},
	},
);

API.v1.addRoute(
	'project-properties.delete',
	{
		authRequired: true,
	},
	{
		async delete() {
			const { projectId } = this.bodyParams;
			const result = await ProjectProperty.deleteById(projectId);
			return API.v1.success({ projectProperty: result });
		},
	},
);
