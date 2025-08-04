import { lazy, useMemo } from 'react';

import type { RoomToolboxActionConfig } from '../../views/room/contexts/RoomToolboxContext';

const RoomTasksWithData = lazy(() => import('../../views/room/contextualBar/Task/RoomTasksWithData'));

export const useTeamTasksRoomAction = () => {
	return useMemo(
		(): RoomToolboxActionConfig => ({
			id: 'team-tasks',
			groups: ['group'],
			full: true,
			title: 'Team_Tasks',
			icon: 'list-bullets',
			order: 1,
			tabComponent: RoomTasksWithData,
		}),
		[],
	);
};
