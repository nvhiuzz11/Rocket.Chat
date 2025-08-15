import { Box, Icon, Throbber } from '@rocket.chat/fuselage';
import { GenericModal } from '@rocket.chat/ui-client';
import { useCallback, useState } from 'react';
import { useSetModal, useEndpoint, useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { useTranslation } from 'react-i18next';

import CreateDocumentModal from './component/CreateDocumentModal';
import DocumentDetailModal from './component/DocumentDetailModal';
import CreateStageModal from './component/CreateStageModal';
import EditStageModal from './component/EditStageModal';
import HeaderTool from './component/HeaderTool';
import ModuleKanbanView from './component/ModuleKanbanView';
import ModuleTableView from './component/ModuleTableView';
import type { IDocument } from '../../../../../server/core-typings/IDocument';
import type { IModule } from '../../../../../server/core-typings/IModule';
import type { IStage } from '../../../../../server/core-typings/IStage';
import {
	ContextualbarHeader,
	ContextualbarIcon,
	ContextualbarTitle,
	ContextualbarClose,
	ContextualbarContent,
	ContextualbarDialogResizable,
	ContextualbarSection,
} from '../../../../components/Contextualbar';

type RoomModuleProps = {
	loading: boolean;
	module: IModule | null;
	stages: IStage[];
	documents: IDocument[];
	moduleId: string;
	onClickClose: () => void;
	onClickBack?: () => void;
	error?: Error | null;
	textSearch: string;
	setTextSearch: (text: string) => void;
	_reload: () => void;
	_roomId: string;
};

const RoomModule = ({
	loading,
	module,
	stages,
	documents,
	moduleId: _moduleId,
	onClickClose,
	onClickBack,
	error,
	textSearch,
	setTextSearch,
	_reload,
	_roomId,
}: RoomModuleProps) => {
	const { t } = useTranslation();
	const setModal = useSetModal();
	const [currentView, setCurrentView] = useState<'kanban' | 'table'>('kanban');

	const handleTextSearchChange = useCallback(
		(text: string) => {
			setTextSearch(text);
		},
		[setTextSearch],
	);

	const handleViewChange = useCallback((view: 'kanban' | 'table') => {
		setCurrentView(view);
	}, []);

	const dispatchToastMessage = useToastMessageDispatch();
	const moveDocumentToStageEndpoint = useEndpoint('POST', '/v1/documents.moveToStage');
	const updateDocumentOrderEndpoint = useEndpoint('POST', '/v1/documents.updateOrder');
	const deleteDocumentEndpoint = useEndpoint('POST', '/v1/documents.delete');
	const updateStageOrderEndpoint = useEndpoint('POST', '/v1/stages.updateOrder');
	const deleteStageEndpoint = useEndpoint('POST', '/v1/stages.delete');

	const handleMoveDocument = useCallback(
		async (documentId: string, newStageId: string, newOrder?: number) => {
			try {
				// First move to new stage if needed
				const currentDocument = documents.find(doc => doc._id === documentId);
				if (currentDocument && currentDocument.stageId !== newStageId) {
					await moveDocumentToStageEndpoint({ documentId, stageId: newStageId });
				}
				
				// Then update order if provided
				if (newOrder !== undefined) {
					await updateDocumentOrderEndpoint({ documentId, newOrder });
				}
				
				_reload();
			} catch (error) {
				dispatchToastMessage({ type: 'error', message: t('Error_moving_document') });
			}
		},
		[moveDocumentToStageEndpoint, updateDocumentOrderEndpoint, documents, _reload, dispatchToastMessage, t],
	);

	const handleMoveStage = useCallback(
		async (stageId: string, newOrder: number) => {
			try {
				await updateStageOrderEndpoint({ stageId, newOrder });
				_reload();
			} catch (error) {
				dispatchToastMessage({ type: 'error', message: t('Error_moving_stage') });
			}
		},
		[updateStageOrderEndpoint, _reload, dispatchToastMessage, t],
	);

	const handleAddDocument = useCallback(
		(stageId?: string) => {
			if (!module) return;
			setModal(
				<CreateDocumentModal onClose={() => setModal(null)} module={module} stages={stages} reload={_reload} initialStageId={stageId} />,
			);
		},
		[setModal, module, stages, _reload],
	);

	const handleEditDocument = useCallback(
		(document: IDocument) => {
			if (!module) return;
			setModal(<DocumentDetailModal onClose={() => setModal(null)} module={module} stages={stages} reload={_reload} document={document} />);
		},
		[setModal, module, stages, _reload],
	);

	const handleDeleteDocument = useCallback(
		(documentId: string) => {
			const handleConfirm = async () => {
				try {
					await deleteDocumentEndpoint({ documentId });
					dispatchToastMessage({ type: 'success', message: t('Document_deleted_successfully') });
					_reload();
					setModal(null);
				} catch (error) {
					dispatchToastMessage({ type: 'error', message: t('Error_deleting_document') });
				}
			};

			setModal(
				<GenericModal
					variant='danger'
					onConfirm={handleConfirm}
					onCancel={() => setModal(null)}
					onClose={() => setModal(null)}
					confirmText={t('Delete')}
				>
					{t('Document_delete_confirmation')}
				</GenericModal>,
			);
		},
		[setModal, deleteDocumentEndpoint, dispatchToastMessage, _reload, t],
	);

	const handleOpenDocument = useCallback(
		(document: IDocument) => {
			if (!module) return;
			setModal(<DocumentDetailModal onClose={() => setModal(null)} module={module} stages={stages} reload={_reload} document={document} />);
		},
		[setModal, module, stages, _reload],
	);

	const handleAddStage = useCallback(() => {
		if (!module) return;
		setModal(<CreateStageModal onClose={() => setModal(null)} moduleId={module._id} reload={_reload} />);
	}, [setModal, module, _reload]);

	const handleEditStage = useCallback(
		(stage: IStage) => {
			if (!module) return;
			setModal(<EditStageModal onClose={() => setModal(null)} stage={stage} reload={_reload} />);
		},
		[setModal, module, _reload],
	);

	const handleDeleteStage = useCallback(
		(stageId: string) => {
			const stage = stages.find((s) => s._id === stageId);
			const handleConfirm = async () => {
				try {
					await deleteStageEndpoint({ stageId });
					dispatchToastMessage({ type: 'success', message: t('Stage_deleted_successfully') });
					_reload();
					setModal(null);
				} catch (error) {
					dispatchToastMessage({ type: 'error', message: t('Error_deleting_stage') });
				}
			};

			setModal(
				<GenericModal
					variant='danger'
					onConfirm={handleConfirm}
					onCancel={() => setModal(null)}
					onClose={() => setModal(null)}
					confirmText={t('Delete')}
				>
					<p>{t('Stage_delete_confirmation', { name: stage?.name || '' })}</p>
					<p>{t('Stage_delete_warning')}</p>
				</GenericModal>,
			);
		},
		[setModal, stages, deleteStageEndpoint, dispatchToastMessage, _reload, t],
	);

	return (
		<ContextualbarDialogResizable>
			<ContextualbarHeader>
				{onClickBack && (
					<Box mi='x4'>
						<Icon name='arrow-back' size='x24' onClick={onClickBack} style={{ cursor: 'pointer' }} />
					</Box>
				)}
				<ContextualbarIcon name='squares' />
				<ContextualbarTitle>
					{module?.name || t('Module')}
					{module?.description && (
						<Box fontScale='p2' color='hint' marginBlockStart='x4'>
							{module.description}
						</Box>
					)}
				</ContextualbarTitle>
				{onClickClose && <ContextualbarClose onClick={onClickClose} />}
			</ContextualbarHeader>

			<ContextualbarSection>
				<HeaderTool
					textSearch={textSearch}
					onTextSearchChange={handleTextSearchChange}
					currentView={currentView}
					onViewChange={handleViewChange}
					onAddDocument={() => handleAddDocument()}
					onAddStage={currentView === 'kanban' ? handleAddStage : undefined}
					canEdit={true}
				/>
			</ContextualbarSection>

			<ContextualbarContent display='flex' flexDirection='column' height='100%'>
				{!error && loading && (
					<Box pi={24} pb={12}>
						<Throbber size='x12' />
					</Box>
				)}

				{error && (
					<Box pi={24} pb={12} fontScale='p2' color='danger'>
						{error.message}
					</Box>
				)}

				{!loading && !error && module && (
					<Box flexGrow={1} flexShrink={1} height='100%' minHeight={0}>
						{currentView === 'kanban' ? (
							<ModuleKanbanView
								stages={stages}
								documents={documents}
								module={module}
								onMoveDocument={handleMoveDocument}
								onMoveStage={handleMoveStage}
								onAddDocument={handleAddDocument}
								onEditDocument={handleEditDocument}
								onDeleteDocument={handleDeleteDocument}
								onOpenDocument={handleOpenDocument}
								onAddStage={handleAddStage}
								onEditStage={handleEditStage}
								onDeleteStage={handleDeleteStage}
								canEdit={true}
								reload={_reload}
							/>
						) : (
							<ModuleTableView
								documents={documents}
								stages={stages}
								module={module}
								onMoveDocument={handleMoveDocument}
								onEditDocument={handleEditDocument}
								onDeleteDocument={handleDeleteDocument}
								onOpenDocument={handleOpenDocument}
								canEdit={true}
								reload={_reload}
							/>
						)}
					</Box>
				)}

				{!loading && !error && !module && (
					<Box display='flex' flexDirection='column' alignItems='center' justifyContent='center' height='100%'>
						<Box fontScale='h3' color='default'>
							{t('Module_not_found')}
						</Box>
						<Box fontScale='p2' color='hint' mbs='x8'>
							{t('The_module_you_are_looking_for_does_not_exist')}
						</Box>
					</Box>
				)}
			</ContextualbarContent>
		</ContextualbarDialogResizable>
	);
};

export default RoomModule;
