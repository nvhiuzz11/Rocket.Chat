import { isRoomFederated } from '@rocket.chat/core-typings';
import type { IRoom } from '@rocket.chat/core-typings';
import { GenericModal } from '@rocket.chat/ui-client';
import { useEndpoint, usePermission, useSetModal, useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import type { IProject } from '../../../../../../server/core-typings/IProject';

export const useRemoveProject = (project: IProject & { room: IRoom }, { reload }: { reload?: () => void }) => {
	const { t } = useTranslation();
	const setModal = useSetModal();
	const dispatchToastMessage = useToastMessageDispatch();

	// const canRemoveProject = usePermission('remove-project', project._id);

	const deleteProjectEndpoint = useEndpoint('POST', '/v1/projects.delete');
	const teamsInfoEndpoint = useEndpoint('GET', '/v1/teams.info');
	const deleteRoomEndpoint = useEndpoint('POST', '/v1/rooms.delete');

	const { data: teamInfoData } = useQuery({
		queryKey: ['teamId', project.teamId],
		queryFn: async () => teamsInfoEndpoint({ teamId: project.teamId }),
		placeholderData: keepPreviousData,
		retry: false,
		enabled: project.teamId !== '',
	});

	const hasPermissionToDeleteRoom = usePermission(`delete-${project.room.t}`, project.room._id);
	const hasPermissionToDeleteTeamRoom = usePermission(
		`delete-team-${project.room.t === 'c' ? 'channel' : 'group'}`,
		teamInfoData?.teamInfo.roomId,
	);
	const isTeamRoom = project.teamId;
	const canDeleteRoom = isRoomFederated(project.room) ? false : hasPermissionToDeleteRoom && (!isTeamRoom || hasPermissionToDeleteTeamRoom);

	const canRemoveProject = canDeleteRoom;

	const handleRemoveProject = () => {
		const onConfirmAction = async () => {
			if (!project._id) {
				return;
			}

			try {
				if (project.room._id) {
					const res = await deleteProjectEndpoint({ _id: project._id });
					if (res?.success) {
						await deleteRoomEndpoint({ roomId: project.room._id });
						dispatchToastMessage({ type: 'success', message: t('Project_has_been_removed') });
						reload?.();
					}
				}
			} catch (error) {
				dispatchToastMessage({ type: 'error', message: error });
			} finally {
				setModal(null);
			}
		};

		return setModal(
			<GenericModal variant='danger' onCancel={() => setModal(null)} onConfirm={onConfirmAction} confirmText={t('Remove')}>
				{`Would you like to remove this project (${project.name}) from ${teamInfoData?.teamInfo.name}? The project will be moved back to the workspace.`}
			</GenericModal>,
		);
	};

	return { handleRemoveProject, canRemoveProject };
};
