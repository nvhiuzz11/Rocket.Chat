import { draggable } from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import { css } from '@rocket.chat/css-in-js';
import { Box, Icon, Tag } from '@rocket.chat/fuselage';
import { UserAvatar } from '@rocket.chat/ui-avatar';
import { useRef, useEffect } from 'react';

import type { ITask } from '../../../../../../server/core-typings/ITask';
import type { ITaskProperty } from '../../../../../../server/core-typings/ITaskProperty';
import type { ITaskTag } from '../../../../../../server/core-typings/ITaskTag';
import { darkenColor, lightenColor } from '../../../../../lib/utils/kanbanBoard';

type TaskCardProps = {
	task: ITask;
	status: ITaskTag;
	taskProperties: (ITaskProperty & { value: ITaskTag[] })[];
	onTaskClick?: () => void;
};

const TaskCard = ({ task, status, taskProperties, onTaskClick }: TaskCardProps) => {
	const ref = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const element = ref.current;
		if (!element) return;

		return draggable({
			element,
			getInitialData: () => ({ id: task?._id, status: status?._id }),
		});
	}, [task?._id, status?._id]);

	const formatDate = (dateString?: Date) => {
		if (!dateString) return '';
		const options: Intl.DateTimeFormatOptions = {
			year: 'numeric',
			month: 'long',
			day: 'numeric',
		};
		return new Date(dateString).toLocaleDateString(undefined, options);
	};

	const cardStyle = css`
		background: ${lightenColor(status?.color, 0.1)};
		border-radius: 8px;
		padding: 16px;
		cursor: grab;
		transition: all 0.2s ease;
		border: 0.5px solid rgba(255, 255, 255, 0.07);
		box-shadow:
			rgba(0, 0, 0, 0.08) 0px 2px 4px 0px,
			rgba(255, 255, 255, 0.094) 0px 0px 0px 1px;
		&:hover {
			transform: translateY(-2px);
			box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
		}
		&:active {
			cursor: grabbing;
			transform: translateY(2px);
			box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
			background: ${darkenColor(status?.color, 0.05)};
		}
	`;

	return (
		<Box
			ref={ref}
			className={cardStyle}
			role='listitem'
			display='flex'
			flexDirection='column'
			style={{ gap: '8px' }}
			onClick={() => onTaskClick?.()}
		>
			<Box display='flex' alignItems='center' style={{ gap: '8px' }}>
				<Icon name='rocket' size='x20' />
				<Box fontScale='p2m' style={{ fontWeight: 800, color: 'white' }}>
					{task.title}
				</Box>
			</Box>

			{task.dueDate && (
				<Box fontScale='c1' color='hint'>
					{formatDate(task.dueDate)}
				</Box>
			)}

			{task.assignees && task.assignees.length > 0 && (
				<Box display='flex' alignItems='center' flexWrap='wrap' mi='neg-x4'>
					{task.assignees.map((assignee) => (
						<Box key={assignee._id} mi='x4' mb='x4'>
							<Tag>
								<UserAvatar size='x16' userId={assignee._id} />
								&nbsp;
								{assignee.username}
							</Tag>
						</Box>
					))}
				</Box>
			)}

			{task.properties?.map((taskProp) => {
				const mainProperty = taskProperties.find((p) => p._id === taskProp.taskPropertyId && p.systemKey !== 'status');
				if (!mainProperty) return null;

				const selectedTags = mainProperty.value.filter((tag) => taskProp.value.includes(tag._id));
				if (selectedTags.length === 0) return null;

				return (
					<Box key={mainProperty._id} display='flex' alignItems='center' flexWrap='wrap' mi='neg-x4'>
						{selectedTags.map((tag) => (
							<Box key={tag._id} mi='x4' mb='x4'>
								<Tag style={{ backgroundColor: tag.color, color: 'white' }}>{tag.name}</Tag>
							</Box>
						))}
					</Box>
				);
			})}
		</Box>
	);
};

export default TaskCard;
