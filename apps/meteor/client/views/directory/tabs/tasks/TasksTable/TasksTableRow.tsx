import type { Serialized } from '@rocket.chat/core-typings';
import { Box, Avatar, Tag, Icon } from '@rocket.chat/fuselage';
import type { KeyboardEvent, MouseEvent } from 'react';

import { GenericTableRow, GenericTableCell } from '../../../../../components/GenericTable';
import type { ITaskResponse } from '../../../../../definitions/model/task';
import { useFormatDate } from '../../../../../hooks/useFormatDate';

const statusVariant = {
	'todo': 'secondary',
	'in-progress': 'warning',
	'done': 'success',
} as const;

const statusIcons = {
	'todo': 'circle',
	'in-progress': 'clock',
	'done': 'checkmark-circled',
} as const;

type TasksTableRowProps = {
	onClick: (id: string) => (e: KeyboardEvent | MouseEvent) => void;
	task: Serialized<ITaskResponse & { belongsTo?: string }>;
	mediaQuery: boolean;
};

const TasksTableRow = ({ onClick, task, mediaQuery }: TasksTableRowProps) => {
	const formatDate = useFormatDate();
	const { _id, title, description, status, assignees = [], dueDate, updatedAt, belongsTo } = task;

	return (
		<GenericTableRow key={_id} onKeyDown={onClick(_id)} onClick={onClick(_id)} tabIndex={0} role='link' action>
			<GenericTableCell withTruncatedText>
				<Box display='flex' alignItems='center'>
					<Box mi={8}>
						<Tag variant={statusVariant[status]} icon={<Icon name={statusIcons[status]} size='x12' />}>
							{status.replace('-', '_')}
						</Tag>
					</Box>
					<Box withTruncatedText>
						<Box fontScale='p2m' withTruncatedText>
							{title}
						</Box>
						{description && (
							<Box fontScale='p2' color='hint' withTruncatedText>
								{description}
							</Box>
						)}
					</Box>
				</Box>
			</GenericTableCell>

			<GenericTableCell withTruncatedText>
				<Box display='flex' alignItems='center'>
					{assignees.length > 0 ? (
						<Avatar.Stack>
							{assignees.slice(0, 3).map((assignee) => (
								<Avatar size='x20' key={assignee._id} title={assignee.username} url='' />
							))}
							{assignees.length > 3 && <Avatar size='x20' title={`+${assignees.length - 3}`} url='' />}
						</Avatar.Stack>
					) : (
						<Box fontScale='p2' color='hint'>
							No assignee
						</Box>
					)}
				</Box>
			</GenericTableCell>

			{mediaQuery && (
				<GenericTableCell fontScale='p2' color='hint' withTruncatedText>
					{dueDate ? formatDate(dueDate) : 'No due date'}
				</GenericTableCell>
			)}

			<GenericTableCell fontScale='p2' color='hint' withTruncatedText>
				{formatDate(updatedAt)}
			</GenericTableCell>

			{mediaQuery && belongsTo && (
				<GenericTableCell fontScale='p2' color='hint' withTruncatedText>
					{belongsTo}
				</GenericTableCell>
			)}
		</GenericTableRow>
	);
};

export default TasksTableRow;
