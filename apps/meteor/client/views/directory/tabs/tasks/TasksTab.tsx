import { usePermission } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';

import TasksTable from './TasksTable';
import NotAuthorizedPage from '../../../notAuthorized/NotAuthorizedPage';

const TasksTab = (): ReactElement => {
	const canViewPublicRooms = usePermission('view-c-room');

	if (canViewPublicRooms) {
		return <TasksTable />;
	}

	return <NotAuthorizedPage />;
};

export default TasksTab;
