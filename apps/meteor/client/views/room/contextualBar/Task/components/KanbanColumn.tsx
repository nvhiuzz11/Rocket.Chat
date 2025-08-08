import { dropTargetForElements, draggable } from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import { css } from '@rocket.chat/css-in-js';
import { Box, Icon } from '@rocket.chat/fuselage';
import { useRef, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { ITaskTag } from '../../../../../../server/core-typings/ITaskTag';
import { darkenColor, lightenColor } from '../../../../../lib/utils/kanbanBoard';

interface IKanbanColumnProps {
	status: ITaskTag;
	children: React.ReactNode;
	onTaskDrop?: (taskId: string, newStatus: string) => void;
	onTaskReorder?: (taskId: string, newIndex: number) => void;
	onTaskCreate?: () => void;
	onColumnReorder?: (statusId: string, newIndex: number) => void;
	isDragging?: boolean;
	columnIndex: number;
}

const KanbanColumn = ({
	status,
	children,
	onTaskDrop,
	onTaskReorder,
	onTaskCreate,
	onColumnReorder,
	isDragging,
	columnIndex,
}: IKanbanColumnProps) => {
	const { t } = useTranslation();
	const ref = useRef<HTMLDivElement>(null);
	const [isColumnDragging, setIsColumnDragging] = useState(false);
	const [isColumnHovered, setIsColumnHovered] = useState(false);

	useEffect(() => {
		const element = ref.current;
		if (!element) return;

		const cleanupDragable = draggable({
			element,
			getInitialData: () => ({ type: 'column', statusId: status._id, columnIndex }),
			onDragStart: () => setIsColumnDragging(true),
			onDrop: () => {
				setIsColumnDragging(false);
				setIsColumnHovered(false);
			},
		});

		const cleanupDropTarget = dropTargetForElements({
			element,
			getData: () => ({ status: status._id, type: 'column-drop-target', columnIndex }),
			onDrop: ({ source, location }) => {
				const { data } = source;
				if (data && typeof data === 'object') {
					// Handle column reordering
					if ('type' in data && data.type === 'column' && onColumnReorder) {
						const sourceIndex = data.columnIndex as number;
						if (sourceIndex !== columnIndex) {
							onColumnReorder(data.statusId as string, columnIndex);
						}
					}
					// Handle task drops
					else if ('id' in data) {
						if (data.status === status._id && onTaskReorder) {
							// Calculate new index based on drop position relative to card heights
							const dropY = location.current.input.clientY;
							const cardsContainer = element.querySelector('[role="list"]');
							const cards = cardsContainer?.querySelectorAll('[role="listitem"]');

							if (!cards || cards.length === 0) {
								onTaskReorder(data.id as string, 0);
								return;
							}

							// Find which card we're dropping between
							let targetIndex = 0;
							for (let i = 0; i < cards.length; i++) {
								const cardRect = cards[i].getBoundingClientRect();
								if (dropY > cardRect.top + cardRect.height / 2) {
									targetIndex = i + 1;
								}
							}

							onTaskReorder(data.id as string, targetIndex);
						} else if (onTaskDrop) {
							onTaskDrop(data.id as string, status._id);
						}
					}
				}
			},
		});

		return () => {
			cleanupDragable();
			cleanupDropTarget();
		};
	}, [status._id, onTaskDrop, onTaskReorder, onColumnReorder, columnIndex]);

	const taskCount = Array.isArray(children) ? children.length : 0;

	const columnStyle = css`
		display: flex;
		flex-direction: column;
		width: 280px;
		min-width: 280px;
		background: ${status.color};
		border-radius: 12px;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
		border: 0.5px solid ${darkenColor(status?.color, 0.1)};
		overflow: hidden;
		cursor: ${isColumnDragging ? 'grabbing' : 'grab'};
		opacity: ${isColumnDragging || isDragging ? 0.8 : 1};
		transform: ${isColumnDragging ? 'rotate(0.5deg) scale(1.02)' : isColumnHovered ? 'rotate(0.1deg) scale(1.01)' : 'none'};

		&:hover {
			box-shadow: ${isColumnDragging ? '0 6px 20px rgba(0, 0, 0, 0.15)' : '0 4px 12px rgba(0, 0, 0, 0.08)'};
		}

		transition: all 0.2s ease;
	`;

	const cardStyle = css`
		background: ${darkenColor(status.color, 0.05)};
		border-radius: 8px;
		padding: 16px;
		cursor: grab;
		transition: all 0.2s ease;
		box-shadow:
			rgba(0, 0, 0, 0.08) 0px 2px 4px 0px,
			rgba(255, 255, 255, 0.094) 0px 0px 0px 1px;

		&:hover {
			transform: translateY(-2px);
			box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
		}

		&:active {
			cursor: grabbing;
		}
	`;

	return (
		<Box ref={ref} className={columnStyle} onMouseEnter={() => setIsColumnHovered(true)} onMouseLeave={() => setIsColumnHovered(false)}>
			<Box p='x16' display='flex' alignItems='center' justifyContent='space-between'>
				<Box display='flex' alignItems='center' flexGrow={1}>
					<Icon
						name='menu'
						size='x12'
						color={darkenColor(status.color, 0.4)}
						marginInlineEnd='x8'
						style={{ opacity: 0.6, cursor: 'grab' }}
						title='Drag to reorder column'
					/>
					<Box
						display='flex'
						alignItems='center'
						style={{
							gap: 'x8',
							backgroundColor: darkenColor(status.color, 0.2),
							borderRadius: '12px',
							padding: '2px 8px',
						}}
					>
						<Icon name='circle' size='x16' color={darkenColor(status.color, 0.5)} />
						<Box
							fontScale='p2m'
							style={{
								fontWeight: 600,
							}}
							mis='x4'
						>
							{t(status.value)}
						</Box>
					</Box>
				</Box>
				<Box
					style={{
						backgroundColor: lightenColor(status.color, 0.2),
						borderRadius: '12px',
						padding: '2px 8px',
						fontSize: '12px',
						fontWeight: 500,
					}}
				>
					{taskCount}
				</Box>
			</Box>
			<Box
				display='flex'
				flexDirection='column'
				p='x12'
				style={{
					overflowY: 'auto',
					gap: '12px',
					background: status.color,
				}}
			>
				{children}

				<Box
					className={cardStyle}
					display='flex'
					alignItems='center'
					backgroundColor={darkenColor(status.color, 0.05)}
					onClick={() => onTaskCreate?.()}
				>
					<Icon name='plus' size='x16' />
					<Box fontScale='p2m' marginInlineStart='x8'>
						{t('New_Task')}
					</Box>
				</Box>
			</Box>
		</Box>
	);
};

export default KanbanColumn;
