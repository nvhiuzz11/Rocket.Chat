import { Box, Button, Icon } from '@rocket.chat/fuselage';
import React from 'react';

interface ITaskHeaderProps {
	taskCount: number;
	onCreateTask?: () => void;
}

const TaskHeader = ({ taskCount, onCreateTask }: ITaskHeaderProps) => {
	return (
		<Box display='flex' justifyContent='space-between' alignItems='center' marginBlockEnd='20px'>
			<Box display='flex' alignItems='center' gap='16px'>
				<Button primary onClick={onCreateTask}>
					<Icon name='plus' />
					New Task
				</Button>
				<Box color='hint' fontSize='14px'>
					{taskCount} task{taskCount !== 1 ? 's' : ''}
				</Box>
			</Box>
		</Box>
	);
};

export default TaskHeader;
