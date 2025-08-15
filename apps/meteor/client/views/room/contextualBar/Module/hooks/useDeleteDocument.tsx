import { GenericModal } from '@rocket.chat/ui-client';
import { useEndpoint, useSetModal, useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { useTranslation } from 'react-i18next';

import type { IDocument } from '../../../../../../server/core-typings/IDocument';

export const useDeleteDocument = ({ document, reload }: { document: IDocument; reload?: () => void }) => {
	const deleteDocumentEndpoint = useEndpoint('POST', '/v1/documents.delete');
	const dispatchToastMessage = useToastMessageDispatch();
	const { t } = useTranslation();
	const setModal = useSetModal();

	const handleDeleteDocument = async () => {
		const onConfirmAction = async () => {
			try {
				await deleteDocumentEndpoint({ documentId: document._id });
				dispatchToastMessage({ type: 'success', message: t('Document_deleted') });
			} catch (error) {
				console.error('Error deleting document:', error);
				dispatchToastMessage({ type: 'error', message: error });
			} finally {
				setModal(null);
				reload?.();
			}
		};

		return setModal(
			<GenericModal variant='danger' onCancel={() => setModal(null)} onConfirm={onConfirmAction} confirmText={t('Delete')}>
				{`Would you like to remove document "${document.name}"?`}
			</GenericModal>,
		);
	};

	return { handleDeleteDocument };
};
