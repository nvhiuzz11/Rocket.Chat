import type { IRoom } from '@rocket.chat/core-typings';
import { GenericMenu } from '@rocket.chat/ui-client';
import type { GenericMenuItemProps } from '@rocket.chat/ui-client';
import { useTranslation } from 'react-i18next';

import type { IProject } from '../../../../../../server/core-typings/IProject';
import { roomCoordinator } from '../../../../../lib/rooms/roomCoordinator';
import { useDeleteRoom } from '../../../../hooks/roomActions/useDeleteRoom';

const TeamsProjectItemMenu = ({ project, reload }: { project: IProject & { room: IRoom }; reload?: () => void }) => {
	const { t } = useTranslation();

	const { handleDelete, canDeleteRoom } = useDeleteRoom(project?.room, { reload });

	// const toggleAutoJoin = {
	// 	id: 'toggleAutoJoin',
	// 	icon: room.t === 'c' ? 'hash' : 'hashtag-lock',
	// 	content: t('Team_Auto-join'),
	// 	onClick: handleToggleAutoJoin,
	// 	addon: <CheckBox checked={room.teamDefault} />,
	// };

	// const removeRoom = {
	// 	id: 'removeRoom',
	// 	icon: 'cross',
	// 	content: t('Team_Remove_from_team'),
	// 	onClick: handleRemoveRoom,
	// 	variant: 'danger',
	// };

	const goToRoom = {
		id: 'goToRoom',
		icon: 'arrow-forward',
		content: t('Go_to_room'),
		onClick: () => roomCoordinator.openRouteLink(project.room.t, project.room),
	};

	const deleteRoom = {
		id: 'deleteRoom',
		icon: 'trash',
		content: t('Delete'),
		onClick: handleDelete,
		variant: 'danger',
	};

	return (
		<GenericMenu
			title={t('More')}
			placement='bottom-end'
			sections={[
				{
					title: '',
					items: [goToRoom, canDeleteRoom && deleteRoom ].filter(Boolean) as GenericMenuItemProps[],
				},
			]}
		/>
	);
};

export default TeamsProjectItemMenu;
