import { BaseRaw } from '@rocket.chat/models';
import { Meteor } from 'meteor/meteor';
import type { Db, IndexDescription } from 'mongodb';

import type { IProject } from '../core-typings/IProject';
import type { IProjectTag } from '../core-typings/IProjectTag';

export class ProjectRaw extends BaseRaw<IProject> {
	constructor(db: Db) {
		super(db, 'projects');
	}

	protected modelIndexes(): IndexDescription[] {
		return [{ key: { roomId: 1 } }, { key: { teamId: 1 } }, { key: { createdAt: -1 } }];
	}

	async createProject(
		userCreator: { _id: string; username: string },
		projectData: Omit<IProject, '_id' | 'createdAt' | 'createdBy' | '_updatedAt'>,
	): Promise<IProject> {
		const now = new Date();
		const { insertedId } = await this.insertOne({
			...projectData,
			createdBy: userCreator,
			createdAt: now,
		});

		const project = await this.findOne({ _id: insertedId });

		if (!project) {
			throw new Meteor.Error('error-project-create-failed', 'Failed to create project');
		}

		return project;
	}

	async updateProject(projectId: string, projectData: Partial<IProject>): Promise<void> {
		await this.updateOne({ _id: projectId }, { $set: projectData });
	}

	async updateProjectProperties(projectId: string, properties: Array<{ propertyId: string; value: IProjectTag['_id'][] }>): Promise<void> {
		await this.updateOne({ _id: projectId }, { $set: { properties } });
	}

	async updateProjectProperty(projectId: string, propertyId: string, value: IProjectTag['_id'][]): Promise<void> {
		await this.updateOne({ _id: projectId }, { $set: { [`properties.${propertyId}`]: value } });
	}

	async deleteProject(projectId: string): Promise<void> {
		await this.deleteOne({ _id: projectId });
	}

	async getProjectById(projectId: string): Promise<IProject | null> {
		return this.findOne({ _id: projectId });
	}

	async getProjectsByRoomId(roomId: string): Promise<IProject[]> {
		return this.find({ roomId }).toArray();
	}

	async getProjectsByTeamId(teamId: string): Promise<IProject[]> {
		return this.find({ teamId }).toArray();
	}
}
