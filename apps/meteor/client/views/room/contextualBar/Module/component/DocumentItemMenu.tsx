import { GenericMenu } from '@rocket.chat/ui-client';
import type { GenericMenuItemProps } from '@rocket.chat/ui-client';
import { useTranslation } from 'react-i18next';

import type { IDocument } from '../../../../../../server/core-typings/IDocument';
import { useDeleteDocument } from '../hooks/useDeleteDocument';

const DocumentItemMenu = ({
	document,
	reload,
	onOpenDocumentDetail,
}: {
	document: IDocument;
	reload?: () => void;
	onOpenDocumentDetail?: (document: IDocument) => void;
}) => {
	const { t } = useTranslation();

	const { handleDeleteDocument } = useDeleteDocument({ document, reload });

	const detailDocument = {
		id: 'detailDocument',
		icon: 'info',
		content: t('Detail'),
		onClick: () => onOpenDocumentDetail?.(document),
	};

	const deleteDocument = {
		id: 'deleteDocument',
		icon: 'trash',
		content: t('Delete'),
		onClick: () => handleDeleteDocument(),
		variant: 'danger',
	};

	return (
		<GenericMenu
			title={t('More')}
			placement='bottom-end'
			sections={[
				{
					title: '',
					items: [detailDocument, deleteDocument].filter(Boolean) as GenericMenuItemProps[],
				},
			]}
		/>
	);
};

export default DocumentItemMenu;
