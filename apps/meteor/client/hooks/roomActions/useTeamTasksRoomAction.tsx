import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { useMemo } from 'react';

import type { RoomToolboxActionConfig } from '../../views/room/contexts/RoomToolboxContext';
import { useTaskView } from '../../views/teams/contextualBar/tasks/hook/useTaskView';

export const useTeamTasksRoomAction = () => {
	const { handleOpenTaskView } = useTaskView();

	const handleOpenTeamTasks = useEffectEvent(async () => {
		handleOpenTaskView();
	});

	return useMemo(
		(): RoomToolboxActionConfig => ({
			id: 'team-tasks',
			groups: ['group'],
			full: true,
			title: 'Team_Tasks',
			icon: 'list-bullets',
			order: 1,
			action: handleOpenTeamTasks,
		}),
		[handleOpenTeamTasks],
	);
};
