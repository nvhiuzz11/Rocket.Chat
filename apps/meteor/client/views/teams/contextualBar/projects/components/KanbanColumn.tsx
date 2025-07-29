import { dropTargetForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import { css } from '@rocket.chat/css-in-js';
import { Box, Icon } from '@rocket.chat/fuselage';
import { useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

interface IKanbanColumnProps {
	status: {
		id: string;
		name: string;
		color?: {
			column: string;
			card: string;
			text: string;
			tag: string;
			button: string;
		};
	};
	children: React.ReactNode;
	onTaskDrop?: (taskId: string, newStatus: string) => void;
	onTaskReorder?: (taskId: string, newIndex: number) => void;
}

const KanbanColumn = ({ status, children, onTaskDrop, onTaskReorder }: IKanbanColumnProps) => {
	const { t } = useTranslation();
	const ref = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const element = ref.current;
		if (!element) return;

		return dropTargetForElements({
			element,
			getData: () => ({ status: status.id }),
			onDrop: ({ source, location }) => {
				const { data } = source;
				if (data && typeof data === 'object' && 'id' in data) {
					if (data.status === status.id && onTaskReorder) {
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
						onTaskDrop(data.id as string, status.id);
					}
				}
			},
		});
	}, [status.id, onTaskDrop, onTaskReorder]);

	// Count the number of tasks in this column
	const taskCount = Array.isArray(children) ? children.length : 0;

	const columnStyle = css`
		display: flex;
		flex-direction: column;
		width: 280px;
		min-width: 280px;
		background: ${status.color?.column};
		border-radius: 12px;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
		overflow: hidden;

		&:hover {
			box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
		}

		transition: all 0.2s ease;
	`;

	const cardStyle = css`
		background: ${status.color?.button};
		border-radius: 8px;
		padding: 16px;
		cursor: grab;
		transition: all 0.2s ease;
		color: ${status.color?.text};
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
		<Box ref={ref} className={columnStyle}>
			<Box p='x16' display='flex' alignItems='center' justifyContent='space-between'>
				<Box
					display='flex'
					alignItems='center'
					style={{
						gap: 'x8',
						backgroundColor: status.color?.tag,
						borderRadius: '12px',
						padding: '2px 8px',
					}}
				>
					<Icon name='circle' size='x16' color={status.color?.button} />
					<Box
						fontScale='p2m'
						style={{
							fontWeight: 600,
						}}
					>
						{t(status.name)}
					</Box>
				</Box>
				<Box
					style={{
						backgroundColor: status.color?.tag,
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
					background: status.color?.column,
				}}
			>
				{children}

				<Box className={cardStyle} display='flex' alignItems='center' backgroundColor={status.color?.button}>
					<Icon name='plus' size='x16' color={status.color?.text} />
					<Box fontScale='p2m' marginInlineStart='x8' color={status.color?.text}>
						{t('New_Project')}
					</Box>
				</Box>
			</Box>
		</Box>
	);
};

export default KanbanColumn;
