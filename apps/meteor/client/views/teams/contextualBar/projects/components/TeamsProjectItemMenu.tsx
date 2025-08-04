import type { IRoom, ITeam } from '@rocket.chat/core-typings';
import { GenericMenu } from '@rocket.chat/ui-client';
import type { GenericMenuItemProps } from '@rocket.chat/ui-client';
import { useTranslation } from 'react-i18next';

import type { IProject } from '../../../../../../server/core-typings/IProject';
import { roomCoordinator } from '../../../../../lib/rooms/roomCoordinator';
import { useRemoveProject } from '../hook/useRemoveProject';

const TeamsProjectItemMenu = ({
	project,
	team,
	reload,
	onOpenProjectDetail,
}: {
	project: IProject & { room: IRoom };
	team: ITeam;
	reload?: () => void;
	onOpenProjectDetail?: (project: IProject) => void;
}) => {
	const { t } = useTranslation();
	const { handleRemoveProject, canRemoveProject } = useRemoveProject(project, { reload });

	const goToRoom = {
		id: 'goToRoom',
		icon: 'arrow-forward',
		content: t('Go_to_room'),
		onClick: () => roomCoordinator.openRouteLink(project.room.t, project.room),
	};

	const detailProject = {
		id: 'Detail',
		icon: 'info',
		content: t('Detail'),
		onClick: () => onOpenProjectDetail?.(project),
	};

	const deleteProject = {
		id: 'deleteProject',
		icon: 'trash',
		content: t('Delete'),
		onClick: handleRemoveProject,
		variant: 'danger',
	};

	return (
		<GenericMenu
			title={t('More')}
			placement='bottom-end'
			sections={[
				{
					title: '',
					items: [detailProject, goToRoom, canRemoveProject && deleteProject].filter(Boolean) as GenericMenuItemProps[],
				},
			]}
		/>
	);
};

export default TeamsProjectItemMenu;
