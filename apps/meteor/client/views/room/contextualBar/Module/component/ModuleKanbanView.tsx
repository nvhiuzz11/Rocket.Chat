import { Box, Icon } from '@rocket.chat/fuselage';
import { useCallback, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import KanbanColumn from './KanbanColumn';
import type { IDocument } from '../../../../../../server/core-typings/IDocument';
import type { IModule } from '../../../../../../server/core-typings/IModule';
import type { IStage } from '../../../../../../server/core-typings/IStage';

interface IModuleKanbanViewProps {
	stages: IStage[];
	documents: IDocument[];
	module: IModule;
	onMoveDocument?: (documentId: string, newStageId: string, newOrder: number) => void;
	onMoveStage?: (stageId: string, newOrder: number) => void;
	onAddDocument?: (stageId: string) => void;
	onEditDocument?: (document: IDocument) => void;
	onDeleteDocument?: (documentId: string) => void;
	onOpenDocument?: (document: IDocument) => void;
	onAddStage?: () => void;
	onEditStage?: (stage: IStage) => void;
	onDeleteStage?: (stageId: string) => void;
	canEdit?: boolean;
	reload?: () => void;
}

const ModuleKanbanView = ({
	stages,
	documents,
	module,
	onMoveDocument,
	onMoveStage,
	onAddDocument,
	onEditDocument,
	onDeleteDocument,
	onOpenDocument,
	onAddStage,
	onEditStage,
	onDeleteStage,
	canEdit = true,
	reload,
}: IModuleKanbanViewProps) => {
	const { t } = useTranslation();
	const [localDocuments, setLocalDocuments] = useState(documents);
	const [localStages, setLocalStages] = useState(stages);

	// Update local state when props change
	useEffect(() => {
		setLocalDocuments(documents);
	}, [documents]);

	useEffect(() => {
		setLocalStages(stages);
	}, [stages]);

	// Group documents by stage
	const documentsByStage = localDocuments.reduce(
		(acc, doc) => {
			if (!acc[doc.stageId]) {
				acc[doc.stageId] = [];
			}
			acc[doc.stageId].push(doc);
			return acc;
		},
		{} as Record<string, IDocument[]>,
	);

	// Sort documents within each stage by order
	Object.keys(documentsByStage).forEach((stageId) => {
		documentsByStage[stageId].sort((a, b) => a.order - b.order);
	});

	// Handle drag and drop
	const handleMoveDocument = useCallback(
		(dragIndex: number, hoverIndex: number, dragStageId: string, hoverStageId: string) => {
			const dragDocument = documentsByStage[dragStageId][dragIndex];

			// Create new documents array
			const newDocuments = [...localDocuments];

			// Remove document from original position
			const sourceStageDocuments = documentsByStage[dragStageId].filter((_, index) => index !== dragIndex);

			// Add document to new position
			const targetStageDocuments = dragStageId === hoverStageId ? sourceStageDocuments : [...(documentsByStage[hoverStageId] || [])];

			targetStageDocuments.splice(hoverIndex, 0, {
				...dragDocument,
				stageId: hoverStageId,
				order: hoverIndex,
			});

			// Update all documents in both stages with new orders
			const updatedDocuments = newDocuments.map((doc) => {
				if (doc.stageId === dragStageId) {
					const newIndex = sourceStageDocuments.findIndex((d) => d._id === doc._id);
					return newIndex >= 0 ? { ...doc, order: newIndex } : doc;
				}
				if (doc.stageId === hoverStageId) {
					const newIndex = targetStageDocuments.findIndex((d) => d._id === doc._id);
					return newIndex >= 0 ? { ...doc, order: newIndex, stageId: hoverStageId } : doc;
				}
				return doc;
			});

			setLocalDocuments(updatedDocuments);

			// Call parent callback
			if (onMoveDocument && dragDocument) {
				onMoveDocument(dragDocument._id, hoverStageId, hoverIndex);
			}
		},
		[localDocuments, documentsByStage, onMoveDocument],
	);

	// Handle stage drag and drop
	const handleMoveStage = useCallback(
		(dragIndex: number, hoverIndex: number) => {
			const newStages = [...localStages];
			const dragStage = newStages[dragIndex];

			// Remove dragged stage from its current position
			newStages.splice(dragIndex, 1);

			// Insert at new position
			newStages.splice(hoverIndex, 0, dragStage);

			// Update orders
			const updatedStages = newStages.map((stage, index) => ({
				...stage,
				order: index,
			}));

			setLocalStages(updatedStages);

			// Call parent callback
			if (onMoveStage && dragStage) {
				onMoveStage(dragStage._id, hoverIndex);
			}
		},
		[localStages, onMoveStage],
	);

	// Sort stages by order
	const sortedStages = [...localStages].sort((a, b) => a.order - b.order);

	if (stages.length === 0) {
		return (
			<Box display='flex' flexDirection='column' alignItems='center' justifyContent='center' height='100%' style={{ gap: '16px' }}>
				<Box fontScale='h3' color='default'>
					{t('No_stages_yet')}
				</Box>
				<Box fontScale='p2' color='hint' textAlign='center'>
					{t('Create_your_first_stage_to_start_organizing_documents')}
				</Box>
				{canEdit && onAddStage && (
					<Box fontScale='p2' color='info' textAlign='center' style={{ cursor: 'pointer' }} onClick={onAddStage}>
						{t('Click_here_to_add_stage')}
					</Box>
				)}
			</Box>
		);
	}

	return (
		<Box
			display='flex'
			flexDirection='row'
			overflow='auto'
			height='100%'
			pb='x16'
			style={
				{
					'--rcx-spacing-x16': '16px',
					'--rcx-spacing-x8': '8px',
					'gap': 'var(--rcx-spacing-x16)',
					'alignItems': 'flex-start',
				} as React.CSSProperties
			}
		>
			{sortedStages.map((stage, index) => (
				<KanbanColumn
					key={stage._id}
					stage={stage}
					index={index}
					module={module}
					documents={documentsByStage[stage._id] || []}
					onMoveDocument={handleMoveDocument}
					onMoveStage={handleMoveStage}
					onAddDocument={onAddDocument}
					onEditDocument={onEditDocument}
					onDeleteDocument={onDeleteDocument}
					onOpenDocument={onOpenDocument}
					onEditStage={onEditStage}
					onDeleteStage={onDeleteStage}
					canEdit={canEdit}
					reload={reload}
				/>
			))}

			{/* Add Stage Column */}
			{canEdit && onAddStage && (
				<Box>
					<Box
						display='flex'
						alignItems='center'
						justifyContent='center'
						width='220px'
						minWidth='220px'
						height='50px'
						bg='surface-neutral'
						style={{
							gap: '4px',
							cursor: 'pointer',
							padding: '8px',
							borderRadius: '8px',
							border: '1px dashed var(--rcx-color-stroke-medium)',
							color: 'var(--rcx-color-font-hint)',
						}}
						onClick={onAddStage}
					>
						<Icon name='plus' size='x16' />
						<Box fontScale='p2'>{t('Add_stage')}</Box>
					</Box>
				</Box>
			)}
		</Box>
	);
};

export default ModuleKanbanView;
