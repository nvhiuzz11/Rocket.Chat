import { GenericModal } from '@rocket.chat/ui-client';
import { useEndpoint, useSetModal, useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { useTranslation } from 'react-i18next';

import type { ITask } from '../../../../../../server/core-typings/ITask';

export const useDeleteTask = ({ task, reload }: { task: ITask; reload?: () => void }) => {
	const deleteTaskEndpoint = useEndpoint('POST', '/v1/tasks.delete');
	const dispatchToastMessage = useToastMessageDispatch();
	const { t } = useTranslation();
	const setModal = useSetModal();

	const handleDeleteTask = async () => {
		const onConfirmAction = async () => {
			try {
				await deleteTaskEndpoint({ _id: task._id });
				dispatchToastMessage({ type: 'success', message: t('Task_deleted') });
			} catch (error) {
				console.error('Error deleting task:', error);
				dispatchToastMessage({ type: 'error', message: error });
			} finally {
				setModal(null);
				reload?.();
			}
		};

		return setModal(
			<GenericModal variant='danger' onCancel={() => setModal(null)} onConfirm={onConfirmAction} confirmText={t('Delete')}>
				{`Would you like to remove task "${task.title}"?`}
			</GenericModal>,
		);
	};

	return { handleDeleteTask };
};
