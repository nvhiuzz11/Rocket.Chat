import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useEffect, useState, useCallback, useMemo } from 'react';

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

	const { teamId, _id: roomId } = room;

	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<Error | null>(null);
	const [tasks, setTasks] = useState<ITask[]>([]);
	const [taskProperties, setTaskProperties] = useState<ITaskProperty[] & { value: ITaskTag[] }>([]);
	const [project, setProject] = useState<IProject | null>(null);
	const [textSearch, setTextSearch] = useState('');
	const debouncedTextSearch = useDebouncedValue(textSearch, 800);

	// Centralized error handler - memoized to prevent recreation
	const handleError = useCallback((err: unknown, context: string) => {
		const error = err instanceof Error ? err : new Error(`Failed to ${context}`);
		console.error(`Error in ${context}:`, error);
		setError(error);
	}, []);

	// Memoize project fetching function with stable dependencies
	const getProject = useCallback(async () => {
		try {
			if (!teamId) {
				throw new Error('Invalid teamId');
			}

			const { project = null } = await projectEndpoint({ roomId });
			console.log('project ', project);
			setProject(project);
			return project;
		} catch (err) {
			handleError(err, 'fetch project');
			return null;
		}
	}, [projectEndpoint, teamId, roomId, handleError]);

	// Memoize tasks fetching function
	const getTasks = useCallback(
		async (projectId: string, search?: string) => {
			try {
				const { tasks = [] } = await tasksEndpoint({ projectId, search });
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

	// Memoize task properties fetching function
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

	// Memoize the main data fetching function
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

			// Use Promise.allSettled to handle potential failures gracefully
			await Promise.allSettled([getTasks(project._id, debouncedTextSearch), getTaskProperties(project._id)]);
		} catch (err) {
			handleError(err, 'fetch all data');
		} finally {
			setLoading(false);
		}
	}, [getProject, getTasks, getTaskProperties, handleError, debouncedTextSearch]);

	// Effect with stable dependencies
	useEffect(() => {
		fetchAllData();
	}, [fetchAllData]);

	// Memoize the reload function to prevent unnecessary re-renders of child components
	const reload = useCallback(() => {
		return fetchAllData();
	}, [fetchAllData]);

	// Memoize props object to prevent unnecessary re-renders of RoomTasks
	const roomTasksProps = useMemo(
		() => ({
			projectId: project?._id || '',
			loading,
			tasks,
			onClickClose: closeTab,
			error,
			textSearch,
			setTextSearch,
			taskProperties,
			reload,
		}),
		[project?._id, loading, tasks, closeTab, error, textSearch, taskProperties, reload],
	);

	return <RoomTasks {...roomTasksProps} />;
};

export default RoomTasksWithData;
