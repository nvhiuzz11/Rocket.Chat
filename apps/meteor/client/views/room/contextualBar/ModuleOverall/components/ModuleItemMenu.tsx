import { GenericModal, GenericMenu, type GenericMenuItemProps } from '@rocket.chat/ui-client';
import { useSetModal, useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { useEndpointAction } from '../../../../../hooks/useEndpointAction';

type ModuleItemMenuProps = {
	module: {
		_id: string;
		name: string;
		description?: string;
	};
	onClickEdit?: (moduleId: string) => void;
	onClickDelete?: (moduleId: string) => void;
	reload: () => void;
};

const ModuleItemMenu = ({ module, onClickEdit, onClickDelete, reload }: ModuleItemMenuProps) => {
	const { t } = useTranslation();
	const setModal = useSetModal();
	const dispatchToastMessage = useToastMessageDispatch();

	const deleteModule = useEndpointAction('POST', '/v1/modules.delete');

	const handleEdit = useCallback(() => {
		onClickEdit?.(module._id);
	}, [module._id, onClickEdit]);

	const handleDelete = useCallback(() => {
		const handleConfirm = async () => {
			try {
				await deleteModule({ moduleId: module._id });
				dispatchToastMessage({ type: 'success', message: t('Module deleted successfully') });
				setModal(null);
				reload();
			} catch (error) {
				dispatchToastMessage({ type: 'error', message: t('Error_deleting_module') });
			}
		};

		const handleCancel = () => {
			setModal(null);
		};

		setModal(
			<GenericModal variant='danger' onConfirm={handleConfirm} onCancel={handleCancel} onClose={handleCancel} confirmText={t('Delete')}>
				{t('Would you like to remove module "${module.name}"? This action cannot be undone.', { module: module.name })}
			</GenericModal>,
		);
	}, [deleteModule, dispatchToastMessage, module._id, module.name, reload, setModal, t]);

	const editModule = {
		id: 'editModule',
		icon: 'edit',
		content: t('Edit'),
		onClick: handleEdit,
	};

	const deleteModuleItem = {
		id: 'deleteModule',
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
					items: [onClickEdit && editModule, onClickDelete && deleteModuleItem].filter(Boolean) as GenericMenuItemProps[],
				},
			]}
		/>
	);
};

export default ModuleItemMenu;
