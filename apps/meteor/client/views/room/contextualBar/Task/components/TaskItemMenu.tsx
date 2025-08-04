import { GenericMenu } from '@rocket.chat/ui-client';
import type { GenericMenuItemProps } from '@rocket.chat/ui-client';
import { useTranslation } from 'react-i18next';

import type { ITask } from '../../../../../../server/core-typings/ITask';
import { useDeleteTask } from '../hook/useDeleteTask';

const TaskItemMenu = ({
	task,
	reload,
	onOpenTaskDetail,
}: {
	task: ITask;
	reload?: () => void;
	onOpenTaskDetail?: (task: ITask) => void;
}) => {
	const { t } = useTranslation();

	const { handleDeleteTask } = useDeleteTask({ task, reload });

	const detailTask = {
		id: 'detailTask',
		icon: 'info',
		content: t('Detail'),
		onClick: () => onOpenTaskDetail?.(task),
	};

	const deleteTask = {
		id: 'deleteTask',
		icon: 'trash',
		content: t('Delete'),
		onClick: () => handleDeleteTask(),
		variant: 'danger',
	};

	return (
		<GenericMenu
			title={t('More')}
			placement='bottom-end'
			sections={[
				{
					title: '',
					items: [detailTask, deleteTask].filter(Boolean) as GenericMenuItemProps[],
				},
			]}
		/>
	);
};

export default TaskItemMenu;
