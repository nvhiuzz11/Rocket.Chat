import { Box, Divider, Button, Icon, Throbber } from '@rocket.chat/fuselage';
import type { ReactElement } from 'react';

import SubtaskList from './SubtaskList';
import type { ISubtask } from '../../../../../../server/core-typings/ISubtask';

type SubtaskPanelProps = {
	taskId: string;
	subtasks?: ISubtask[];
	isLoading?: boolean;
	onClose: () => void;
	onReload?: () => void;
};

const SubtaskPanel = ({ taskId, subtasks = [], isLoading = false, onClose, onReload }: SubtaskPanelProps): ReactElement => {
	return (
		<Box
			flexGrow={1}
			flexShrink={0}
			borderInlineStart='x1'
			borderColor='stroke-extra-light'
			overflow='auto'
			mi='x16'
			p='x24'
			bg='surface-room'
		>
			<Box display='flex' alignItems='center' justifyContent='space-between' mb='x16'>
				<Box fontSize='x20' fontWeight='500'>
					Manage Subtasks
				</Box>
				<Button square small onClick={onClose}>
					<Icon name='cross' size='x20' />
				</Button>
			</Box>
			<Divider />
			{isLoading ? (
				<Box display='flex' justifyContent='center' p='x24'>
					<Throbber size='x16' />
				</Box>
			) : (
				<SubtaskList taskId={taskId} subtasks={subtasks} onReload={onReload} />
			)}
		</Box>
	);
};

export default SubtaskPanel;
