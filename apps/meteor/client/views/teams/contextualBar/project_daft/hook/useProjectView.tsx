import { useSetModal } from '@rocket.chat/ui-contexts';

import { useRoom } from '../../../../room/contexts/RoomContext';
import ProjectViewModal from '../ProjectViewModal';

export const useProjectView = () => {
	const setModal = useSetModal();
	const room = useRoom();

	const handleClose = () => {
		setModal(null);
	};

	const handleOpenProjectView = () => {
		setModal(<ProjectViewModal onClose={handleClose} room={room} />);
	};

	return { handleOpenProjectView };
};
