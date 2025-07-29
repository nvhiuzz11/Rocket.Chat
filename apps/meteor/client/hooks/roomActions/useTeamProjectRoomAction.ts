import { lazy, useMemo } from 'react';

import type { RoomToolboxActionConfig } from '../../views/room/contexts/RoomToolboxContext';

const TeamsProjectsWithData = lazy(() => import('../../views/teams/contextualBar/projects/TeamsProjectsWithData'));

export const useTeamProjectRoomAction = () => {
	return useMemo(
		(): RoomToolboxActionConfig => ({
			id: 'team-projects',
			groups: ['team'],
			full: true,
			title: 'Team_Projects',
			icon: 'stack',
			tabComponent: TeamsProjectsWithData,
			order: 1,
		}),
		[],
	);
};
