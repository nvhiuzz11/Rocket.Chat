import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useEffect, useState, useCallback } from 'react';

import TeamsProjects from './TeamsProjects';
import type { IProject } from '../../../../../server/core-typings/IProject';
import { useRoom } from '../../../room/contexts/RoomContext';
import { useRoomToolbox } from '../../../room/contexts/RoomToolboxContext';

const TeamsProjectsWithData = (): JSX.Element => {
	const room = useRoom();
	const { closeTab } = useRoomToolbox();
	const projectsOfTeamEndpoint = useEndpoint('GET', '/v1/projects.list.team');

	const { teamId } = room;

	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<Error | null>(null);
	const [projects, setProjects] = useState<IProject[]>([]);

	const fetchProjects = useCallback(async () => {
		try {
			setLoading(true);
			setError(null);

			if (!teamId) {
				throw new Error('Invalid teamId');
			}

			const { projects = [] } = await projectsOfTeamEndpoint({ teamId });
			console.log('projects ', projects);
			setProjects(projects);
		} catch (err) {
			setError(err instanceof Error ? err : new Error('Failed to fetch projects'));
		} finally {
			setLoading(false);
		}
	}, [projectsOfTeamEndpoint, teamId]);

	useEffect(() => {
		fetchProjects();
	}, [fetchProjects]);

	return <TeamsProjects teamId={teamId} loading={loading} projects={projects} onClickClose={closeTab} error={error} />;
};

export default TeamsProjectsWithData;
