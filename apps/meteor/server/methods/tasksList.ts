import { Rooms } from '@rocket.chat/models';
import { check } from 'meteor/check';
import { Meteor } from 'meteor/meteor';

import { db } from '../database/utils';
import { ProjectRaw } from '../models/Project';
import { TaskRaw } from '../models/Task';

const Projects = new ProjectRaw(db);
const Tasks = new TaskRaw(db);

declare module '@rocket.chat/ddp-client' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		'tasks.list': (params: { rid: string; filter?: string; limit?: number }) => Promise<{
			tasks: Array<{
				_id: string;
				title: string;
				description?: string;
				status?: string;
				priority?: string;
				assignedTo?: {
					_id: string;
					username: string;
					name?: string;
				};
				projectId?: string;
				projectName?: string;
				roomId?: string;
			}>;
		}>;
	}
}

Meteor.methods({
	async 'tasks.list'({ rid, filter = '', limit = 5 }) {
		check(rid, String);
		check(filter, String);
		check(limit, Number);

		const userId = Meteor.userId();
		if (!userId) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'tasks.list',
			});
		}

		try {
			const room = await Rooms.findOneById(rid);
			if (!room) {
				return { tasks: [] };
			}

			const query: any = {};

			if (room.teamMain) {
				// In team main room: show tasks from all projects in the team
				const teamId = room.teamId ?? rid;
				// Get all projects in the team
				const teamProjects = await Projects.find({ teamId }).toArray();
				const projectIds = teamProjects.map((p: any) => p._id);

				// Query tasks from all these projects
				query.projectId = { $in: projectIds };
			} else if (room.teamId && !room.teamMain) {
				// In a project channel: show tasks only from the project associated with this room
				// Find the project that has this roomId
				const project = await Projects.findOne({ roomId: rid });
				if (!project) {
					// No project associated with this room
					return { tasks: [] };
				}
				// Get tasks for this specific project
				query.projectId = project._id;
			} else {
				// Not in a team or project context
				return { tasks: [] };
			}

			// Add filter to query if provided
			if (filter) {
				const filterRegex = new RegExp(filter, 'i');
				const originalProjectQuery = query.projectId;
				query.$and = [
					originalProjectQuery ? { projectId: originalProjectQuery } : {},
					{
						$or: [{ title: filterRegex }, { description: filterRegex }],
					},
				];
				delete query.projectId;
			}

			const tasks = await Tasks.find(query, {
				limit,
				sort: { updatedAt: -1, createdAt: -1 },
			}).toArray();

			// Populate project names
			const tasksWithProjects = await Promise.all(
				tasks.map(async (task: any) => {
					let projectName;
					if (task.projectId) {
						const project = await Projects.findOneById(task.projectId);
						projectName = project?.name;
					}

					return {
						_id: task._id,
						title: task.title,
						description: task.description,
						status: task.status,
						priority: task.priority,
						assignedTo: task.assignedTo,
						projectId: task.projectId,
						projectName,
						roomId: task.roomId,
					};
				}),
			);

			return {
				tasks: tasksWithProjects,
			};
		} catch (error) {
			console.error('Error fetching tasks:', error);
			throw new Meteor.Error('error-fetching-tasks', 'Error fetching tasks', {
				method: 'tasks.list',
			});
		}
	},
});
