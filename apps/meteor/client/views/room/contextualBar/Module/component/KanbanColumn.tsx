import { dropTargetForElements, draggable } from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import { css } from '@rocket.chat/css-in-js';
import { Box, Icon, IconButton } from '@rocket.chat/fuselage';
import { useRef, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import DocumentCard from './DocumentCard';
import type { IDocument } from '../../../../../../server/core-typings/IDocument';
import type { IModule } from '../../../../../../server/core-typings/IModule';
import type { IStage } from '../../../../../../server/core-typings/IStage';

interface IKanbanColumnProps {
	stage: IStage;
	documents: IDocument[];
	index: number;
	module: IModule;
	onMoveDocument: (dragIndex: number, hoverIndex: number, dragStageId: string, hoverStageId: string) => void;
	onMoveStage?: (dragIndex: number, hoverIndex: number) => void;
	onAddDocument?: (stageId: string) => void;
	onEditDocument?: (document: IDocument) => void;
	onDeleteDocument?: (documentId: string) => void;
	onOpenDocument?: (document: IDocument) => void;
	onEditStage?: (stage: IStage) => void;
	onDeleteStage?: (stageId: string) => void;
	canEdit?: boolean;
	reload?: () => void;
}

const KanbanColumn = ({
	stage,
	documents,
	index,
	module,
	onMoveDocument,
	onMoveStage,
	onAddDocument,
	onEditDocument,
	onDeleteDocument,
	onOpenDocument,
	onEditStage,
	onDeleteStage,
	canEdit = true,
	reload,
}: IKanbanColumnProps) => {
	const { t } = useTranslation();
	const ref = useRef<HTMLDivElement>(null);
	const headerRef = useRef<HTMLDivElement>(null);
	const [isOver, setIsOver] = useState(false);
	const [isDragging, setIsDragging] = useState(false);

	// Setup drop zone for documents
	useEffect(() => {
		const element = ref.current;
		if (!element) return;

		return dropTargetForElements({
			element,
			getData: () => ({ stageId: stage._id, type: 'document-drop-zone' }),
			onDragEnter: ({ source }) => {
				const data = source.data as any;
				if (data.type === 'document') {
					setIsOver(true);
				}
			},
			onDragLeave: ({ source }) => {
				const data = source.data as any;
				if (data.type === 'document') {
					setIsOver(false);
				}
			},
			onDrop: ({ source }) => {
				setIsOver(false);
				const data = source.data as any;
				if (data.type === 'document' && data.stageId !== stage._id) {
					// Move document to this stage
					onMoveDocument(data.index, documents.length, data.stageId, stage._id);
				}
			},
		});
	}, [stage._id, documents.length, onMoveDocument]);

	// Setup draggable header for stage reordering
	useEffect(() => {
		const element = headerRef.current;
		if (!element || !onMoveStage) return;

		const cleanup = [
			// Make draggable
			draggable({
				element,
				getInitialData: () => ({
					stageId: stage._id,
					index,
					type: 'stage',
				}),
				onDragStart: () => setIsDragging(true),
				onDrop: () => setIsDragging(false),
			}),

			// Make drop target for stage reordering
			dropTargetForElements({
				element,
				getData: () => ({ stageId: stage._id, index, type: 'stage-drop-zone' }),
				onDragEnter: ({ source }) => {
					const data = source.data as any;
					if (data.type === 'stage' && data.stageId !== stage._id) {
						setIsOver(true);
					}
				},
				onDragLeave: ({ source }) => {
					const data = source.data as any;
					if (data.type === 'stage') {
						setIsOver(false);
					}
				},
				onDrop: ({ source }) => {
					setIsOver(false);
					const data = source.data as any;
					if (data.type === 'stage' && data.stageId !== stage._id) {
						onMoveStage(data.index, index);
					}
				},
			}),
		];

		return () => {
			cleanup.forEach((clean) => clean());
		};
	}, [stage._id, index, onMoveStage]);

	const columnStyle = css`
		display: flex;
		flex-direction: column;
		width: 320px;
		min-width: 320px;
		background: ${isOver ? 'var(--rcx-color-surface-hover)' : 'var(--rcx-color-surface-light)'};
		border-radius: 12px;
		padding: 16px;
		transition: all 0.2s ease;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
		border: ${isOver ? '2px dashed var(--rcx-color-stroke-medium)' : '1px solid var(--rcx-color-stroke-light)'};
		opacity: ${isDragging ? 0.5 : 1};
		transform: ${isDragging ? 'rotate(2deg)' : 'none'};
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
	`;

	const headerStyle = css`
		cursor: ${onMoveStage ? 'grab' : 'default'};

		&:active {
			cursor: ${onMoveStage ? 'grabbing' : 'default'};
		}
	`;

	const documentsContainerStyle = css`
		flex-grow: 1;
		padding: 4px;
	`;

	return (
		<Box ref={ref} className={columnStyle}>
			{/* Column Header */}
			<Box ref={headerRef} className={headerStyle} display='flex' justifyContent='space-between' alignItems='center' mbe='x16'>
				<Box display='flex' alignItems='center' style={{ gap: '8px' }}>
					<Box w='x12' h='x12' borderRadius='x2' style={{ backgroundColor: stage.color }} />
					<Box fontScale='p2m'>{stage.name}</Box>
					<Box fontScale='micro' color='hint' bg='surface-neutral' borderRadius='x12' p='x2 x8'>
						{documents.length}
					</Box>
				</Box>

				{canEdit && (
					<Box display='flex' alignItems='center' style={{ gap: '4px' }}>
						{onAddDocument && <IconButton tiny icon='plus' title={t('Add_document')} onClick={() => onAddDocument(stage._id)} />}
						{onEditStage && <IconButton tiny icon='edit' title={t('Edit_stage')} onClick={() => onEditStage(stage)} />}
						{onDeleteStage && documents.length === 0 && (
							<IconButton tiny icon='trash' title={t('Delete_stage')} onClick={() => onDeleteStage(stage._id)} />
						)}
					</Box>
				)}
			</Box>

			{/* Documents List */}
			<Box className={documentsContainerStyle}>
				{/* {documents.length === 0 ? (
					<Box display='flex' flexDirection='column' alignItems='center' justifyContent='center' height='200px' style={{ gap: '8px' }}>
						<Icon name='file' size='x32' color='hint' />
						<Box fontScale='p2' color='hint' textAlign='center'>
							{t('No_documents_in_stage')}
						</Box>
						{canEdit && onAddDocument && (
							<Box fontScale='micro' color='hint' textAlign='center' style={{ cursor: 'pointer' }} onClick={() => onAddDocument(stage._id)}>
								{t('Click_to_add_document')}
							</Box>
						)}
					</Box>
				) : ( */}

				{documents.length > 0 &&
					documents.map((document, index) => (
						<DocumentCard
							key={document._id}
							document={document}
							index={index}
							stageId={stage._id}
							module={module}
							onMoveDocument={onMoveDocument}
							onEditDocument={onEditDocument}
							onDeleteDocument={onDeleteDocument}
							onOpenDocument={onOpenDocument}
							reload={reload}
						/>
					))}
				{/* )} */}
			</Box>

			{/* Add Document Button */}
			{canEdit && onAddDocument && (
				<Box mbs='x8'>
					<Box
						display='flex'
						alignItems='center'
						justifyContent='center'
						style={{
							gap: '4px',
							cursor: 'pointer',
							padding: '8px',
							borderRadius: '4px',
							border: '1px dashed var(--rcx-color-stroke-medium)',
							color: 'var(--rcx-color-font-hint)',
						}}
						onClick={() => onAddDocument(stage._id)}
					>
						<Icon name='plus' size='x16' />
						<Box fontScale='p2'>{t('Add_document')}</Box>
					</Box>
				</Box>
			)}
		</Box>
	);
};

export default KanbanColumn;
