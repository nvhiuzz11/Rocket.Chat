import { useSetModal } from '@rocket.chat/ui-contexts';

import TaskViewModal from '../TaskViewModal';

export const useTaskView = () => {
	const setModal = useSetModal();

	const handleOpenTaskView = () => {
		setModal(
			<TaskViewModal
				onClose={() => setModal(null)}
				onTaskClick={(task) => {}}
				onCreateTask={() => {}}
				onUpdateTask={(task) => {}}
				onDeleteTask={(taskId) => {}}
				loading={false}
			/>,
		);
	};

	return { handleOpenTaskView };
};
