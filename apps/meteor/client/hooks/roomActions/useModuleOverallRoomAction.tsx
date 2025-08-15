import { lazy, useMemo } from 'react';

import type { RoomToolboxActionConfig } from '../../views/room/contexts/RoomToolboxContext';

const RoomModuleOverallWithData = lazy(() => import('../../views/room/contextualBar/ModuleOverall/RoomModuleOverallWithData'));

export const useModuleOverallRoomAction = () => {
	return useMemo(
		(): RoomToolboxActionConfig => ({
			id: 'module',
			groups: ['team', 'channel', 'group'],
			full: true,
			title: 'Module_Overall',
			icon: 'squares',
			tabComponent: RoomModuleOverallWithData,
			order: 1,
		}),
		[],
	);
};
