import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useEffect, useState, useCallback } from 'react';

import RoomTasks from './RoomTasks';
import type { IProject } from '../../../../../server/core-typings/IProject';
import type { ITask } from '../../../../../server/core-typings/ITask';
import type { ITaskProperty } from '../../../../../server/core-typings/ITaskProperty';
import type { ITaskTag } from '../../../../../server/core-typings/ITaskTag';
import { useRoom } from '../../contexts/RoomContext';
import { useRoomToolbox } from '../../contexts/RoomToolboxContext';

const RoomTasksWithData = (): JSX.Element => {
	const room = useRoom();
	const { closeTab } = useRoomToolbox();
	const projectEndpoint = useEndpoint('GET', '/v1/projects.info.byRoom');
	const tasksEndpoint = useEndpoint('GET', '/v1/tasks.list');
	const taskPropertiesEndpoint = useEndpoint('GET', '/v1/task-properties.list');

	const { teamId } = room;

	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<Error | null>(null);
	const [tasks, setTasks] = useState<ITask[]>([]);
	const [taskProperties, setTaskProperties] = useState<ITaskProperty[] & { value: ITaskTag[] }>([]);
	const [project, setProject] = useState<IProject | null>(null);

	// Centralized error handler
	const handleError = useCallback((err: unknown, context: string) => {
		const error = err instanceof Error ? err : new Error(`Failed to ${context}`);
		console.error(`Error in ${context}:`, error);
		setError(error);
	}, []);

	const getProject = useCallback(async () => {
		try {
			if (!teamId) {
				throw new Error('Invalid teamId');
			}

			const { project = null } = await projectEndpoint({ roomId: room._id });
			console.log('project ', project);
			setProject(project);
			return project;
		} catch (err) {
			handleError(err, 'fetch project');
			return null;
		}
	}, [projectEndpoint, teamId, room._id, handleError]);

	const getTasks = useCallback(
		async (projectId: string) => {
			try {
				const { tasks = [] } = await tasksEndpoint({ projectId });
				console.log('tasks ', tasks);
				setTasks(tasks);
				return tasks;
			} catch (err) {
				handleError(err, 'fetch tasks');
				return [];
			}
		},
		[tasksEndpoint, handleError],
	);

	const getTaskProperties = useCallback(
		async (projectId: string) => {
			try {
				const { taskProperties = [] } = await taskPropertiesEndpoint({ projectId });
				console.log('taskProperties ', taskProperties);
				setTaskProperties(taskProperties);
				return taskProperties;
			} catch (err) {
				handleError(err, 'fetch task properties');
				return [];
			}
		},
		[taskPropertiesEndpoint, handleError],
	);

	const fetchAllData = useCallback(async () => {
		try {
			setLoading(true);
			setError(null);

			const project = await getProject();

			if (!project?._id) {
				setTasks([]);
				setTaskProperties([]);
				return;
			}

			await Promise.allSettled([getTasks(project._id), getTaskProperties(project._id)]);
		} catch (err) {
			handleError(err, 'fetch all data');
		} finally {
			setLoading(false);
		}
	}, [getProject, getTasks, getTaskProperties, handleError]);

	useEffect(() => {
		fetchAllData();
	}, [fetchAllData]);
	const reload = useCallback(() => {
		return fetchAllData();
	}, [fetchAllData]);

	return (
		<RoomTasks
			projectId={project?._id || ''}
			loading={loading}
			tasks={tasks}
			onClickClose={closeTab}
			error={error}
			taskProperties={taskProperties}
			reload={reload}
		/>
	);
};

export default RoomTasksWithData;
