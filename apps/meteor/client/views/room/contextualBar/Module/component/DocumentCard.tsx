import { draggable, dropTargetForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import { css } from '@rocket.chat/css-in-js';
import { Box, Icon, IconButton, Tag } from '@rocket.chat/fuselage';
import { UserAvatar } from '@rocket.chat/ui-avatar';
import { useRef, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { MODULE_FIELD_TYPES } from '../../../../../../definition/IModuleConfig';
import type { IDocument } from '../../../../../../server/core-typings/IDocument';
import type { IModule } from '../../../../../../server/core-typings/IModule';
import DocumentItemMenu from './DocumentItemMenu';

interface IDocumentCardProps {
	document: IDocument;
	index: number;
	stageId: string;
	module: IModule;
	onMoveDocument: (dragIndex: number, hoverIndex: number, dragStageId: string, hoverStageId: string) => void;
	onEditDocument?: (document: IDocument) => void;
	onDeleteDocument?: (documentId: string) => void;
	onOpenDocument?: (document: IDocument) => void;
	reload?: () => void;
}

const DocumentCard = ({
	document,
	index,
	stageId,
	module,
	onMoveDocument,
	onEditDocument,
	onDeleteDocument,
	onOpenDocument,
	reload,
}: IDocumentCardProps) => {
	// const { t } = useTranslation();
	const ref = useRef<HTMLDivElement>(null);
	const [isDragging, setIsDragging] = useState(false);
	const [isHovered, setIsHovered] = useState(false);

	// Setup draggable and drop target
	useEffect(() => {
		const element = ref.current;
		if (!element) return;

		const cleanup = [
			// Make draggable
			draggable({
				element,
				getInitialData: () => ({
					documentId: document._id,
					stageId,
					index,
					type: 'document',
				}),
				onDragStart: () => setIsDragging(true),
				onDrop: () => setIsDragging(false),
			}),

			// Make drop target for document reordering
			dropTargetForElements({
				element,
				getData: () => ({ documentId: document._id, stageId, index, type: 'document-drop-target' }),
				onDragEnter: ({ source }) => {
					const data = source.data as any;
					if (data.type === 'document' && data.documentId !== document._id) {
						setIsHovered(true);
					}
				},
				onDragLeave: ({ source }) => {
					const data = source.data as any;
					if (data.type === 'document') {
						setIsHovered(false);
					}
				},
				onDrop: ({ source }) => {
					setIsHovered(false);
					const data = source.data as any;
					if (data.type === 'document' && data.documentId !== document._id) {
						onMoveDocument(data.index, index, data.stageId, stageId);
					}
				},
			}),
		];

		return () => {
			cleanup.forEach((clean) => clean());
		};
	}, [document._id, stageId, index, onMoveDocument]);

	// Helper function to render field value
	const renderFieldValue = (fieldDef: any, customField: any) => {
		const { value } = customField;

		switch (fieldDef.type) {
			case MODULE_FIELD_TYPES.SELECT:
				const selectedOption = fieldDef.options?.find((opt: any) => opt._id === value);
				return selectedOption ? (
					<Tag style={{ backgroundColor: selectedOption.color, color: 'white', width: 'fit-content' }}>{selectedOption.value}</Tag>
				) : (
					value
				);

			case MODULE_FIELD_TYPES.MULTI_SELECT:
				const selectedOptions = fieldDef.options?.filter((opt: any) => value.includes(opt._id));
				return selectedOptions?.length > 0 ? (
					<Box display='flex' flexWrap='wrap' style={{ gap: '4px' }}>
						{selectedOptions.map((opt: any) => (
							<Tag key={opt._id} style={{ backgroundColor: opt.color, color: 'white' }}>
								{opt.value}
							</Tag>
						))}
					</Box>
				) : null;

			case MODULE_FIELD_TYPES.DATE:
				return value ? new Date(value as string).toLocaleDateString() : null;

			case MODULE_FIELD_TYPES.USER:
				if (!value) return null;

				// Handle both single user object and array of users
				const users = Array.isArray(value) ? value : [value];
				const displayUsers = users.filter((user) => user && (user.username || user._id));

				if (displayUsers.length === 0) return null;

				return (
					// <Box display='flex' alignItems='center' style={{ gap: '4px' }}>
					// 	<Icon name='user' size='x12' />
					// 	<Box>
					// 		{displayUsers.map((user, index) => (
					// 			<Box key={user._id || index} display='inline'>
					// 				{user.username || user._id}
					// 				{index < displayUsers.length - 1 && ', '}
					// 			</Box>
					// 		))}
					// 	</Box>
					// </Box>

					<Box display='flex' alignItems='center' flexWrap='wrap' mi='neg-x4'>
						{displayUsers.map((user) => (
							<Box key={user._id} mi='x4' mb='x4'>
								<Tag>
									<UserAvatar size='x16' userId={user._id} />
									&nbsp;
									{user.username}
								</Tag>
							</Box>
						))}
					</Box>
				);

			case MODULE_FIELD_TYPES.CHECKBOX:
				return value ? <Icon name='check' size='x12' color='success' /> : <Icon name='cross' size='x12' color='hint' />;

			default:
				return value ? String(value) : null;
		}
	};

	const cardStyle = css`
		background: var(--rcx-color-surface);
		border-radius: 8px;
		padding: 16px;
		margin-bottom: 12px;
		cursor: grab;
		transition: all 0.2s ease;
		border: ${isHovered ? '2px dashed var(--rcx-color-stroke-medium)' : '0.5px solid rgba(255, 255, 255, 0.07)'};
		opacity: ${isDragging ? 0.5 : 1};
		position: relative;
		box-shadow:
			rgba(0, 0, 0, 0.08) 0px 2px 4px 0px,
			rgba(255, 255, 255, 0.094) 0px 0px 0px 1px;
		transform: ${isHovered ? 'scale(1.02)' : 'none'};
		&:hover {
			transform: ${isHovered ? 'scale(1.02)' : 'translateY(-2px)'};
			box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
		}
		&:active {
			cursor: grabbing;
		}
	`;

	const menuButtonStyle = css`
		opacity: ${isHovered ? 1 : 0};
		transition: opacity 0.2s ease;
	`;

	return (
		<Box
			ref={ref}
			className={cardStyle}
			onClick={() => onOpenDocument?.(document)}
			onMouseEnter={() => setIsHovered(true)}
			onMouseLeave={() => setIsHovered(false)}
		>
			{/* Header with actions */}
			<Box display='flex' justifyContent='space-between' alignItems='flex-start' mbe='x8'>
				<Box fontScale='p2m' style={{ wordBreak: 'break-word' }}>
					{document.name}
				</Box>

				<Box display='flex' alignItems='center' style={{ gap: '4px' }} className={menuButtonStyle}>
					{/* {onEditDocument && (
						<IconButton
							tiny
							icon='edit'
							onClick={(e) => {
								e.stopPropagation();
								onEditDocument(document);
							}}
						/>
					)}
					{onDeleteDocument && (
						<IconButton
							tiny
							icon='trash'
							onClick={(e) => {
								e.stopPropagation();
								onDeleteDocument(document._id);
							}}
						/>
					)} */}

					<DocumentItemMenu document={document} reload={reload} onOpenDocumentDetail={onOpenDocument} />
				</Box>
			</Box>

			{/* Document description */}
			{document.description && (
				<Box
					fontScale='p2'
					color='hint'
					mbe='x8'
					style={{
						wordBreak: 'break-word',
						display: '-webkit-box',
						WebkitLineClamp: 2,
						WebkitBoxOrient: 'vertical',
						overflow: 'hidden',
					}}
				>
					{document.description}
				</Box>
			)}

			{/* Custom Fields */}
			{document.customFields.map((customField) => {
				const fieldDef = module.fieldDefinitions.find((def) => def._id === customField.fieldId);
				if (!fieldDef) return null;

				const renderedValue = renderFieldValue(fieldDef, customField);
				if (!renderedValue) return null;

				return (
					<Box key={customField.fieldId} mbe='x8'>
						{/* Field name */}
						<Box fontScale='micro' color='hint' mbe='x2'>
							{fieldDef.name}
						</Box>
						{/* Field value */}
						<Box>{renderedValue}</Box>
					</Box>
				);
			})}
		</Box>
	);
};

export default DocumentCard;
