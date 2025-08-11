import { Rooms } from '@rocket.chat/models';
import { check } from 'meteor/check';
import { Meteor } from 'meteor/meteor';

import { db } from '../database/utils';
import { ProjectRaw } from '../models/Project';

const Projects = new ProjectRaw(db);

declare module '@rocket.chat/ddp-client' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		'projects.list': (params: { rid: string; filter?: string; limit?: number }) => Promise<{
			projects: Array<{
				_id: string;
				name: string;
				description?: string;
				status?: string;
				startDate?: Date;
				endDate?: Date;
				members?: string[];
				teamId?: string;
			}>;
		}>;
	}
}

Meteor.methods({
	async 'projects.list'({ rid, filter = '', limit = 5 }) {
		check(rid, String);
		check(filter, String);
		check(limit, Number);

		const userId = Meteor.userId();
		if (!userId) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'projects.list',
			});
		}

		try {
			// Check if the current room is a team main room or has teamId
			const room = await Rooms.findOneById(rid);
			if (!room?.teamMain && !room?.teamId) {
				// Not in a team context, return empty list
				return { projects: [] };
			}

			const teamId = room.teamId || rid;

			// Build query for Projects collection
			const query: any = { teamId };

			if (filter) {
				const filterRegex = new RegExp(filter, 'i');
				query.$or = [{ name: filterRegex }, { description: filterRegex }];
			}

			const projects = await Projects.find(query, {
				limit,
				sort: { updatedAt: -1, createdAt: -1 },
			}).toArray();

			return {
				projects: projects.map((project: any) => ({
					_id: project._id,
					name: project.name,
					description: project.description,
					status: project.status,
					startDate: project.startDate,
					endDate: project.endDate,
					members: project.members,
					teamId,
				})),
			};
		} catch (error) {
			console.error('Error fetching projects:', error);
			throw new Meteor.Error('error-fetching-projects', 'Error fetching projects', {
				method: 'projects.list',
			});
		}
	},
});
