import { Table, TableHead, TableBody, TableRow, TableCell, Box, Icon, Button } from '@rocket.chat/fuselage';
import React from 'react';

const sampleTasks = [
	{ id: '1', title: 'Design new dashboard', status: 'To Do', priority: 'High', dueDate: '2023-12-15', assignedTo: 'John Doe' },
	{ id: '2', title: 'Implement API endpoints', status: 'In Progress', priority: 'Medium', dueDate: '2023-12-20', assignedTo: 'Jane Smith' },
	{ id: '3', title: 'Write documentation', status: 'To Do', priority: 'Low', dueDate: '2023-12-25', assignedTo: 'Bob Johnson' },
	{ id: '4', title: 'Test user flows', status: 'Done', priority: 'Medium', dueDate: '2023-12-10', assignedTo: 'Alice Williams' },
];

const TableView = () => {
	return (
		<Box display='flex' flexDirection='column' height='100%'>
			{/* <Box display='flex' alignItems='center' marginBlock='x16'>
				<Icon name='list' size='x20' marginInlineEnd='x8' />
				<Box fontScale='h4'>Table View</Box>
				<Button small primary marginInlineStart='auto'>
					<Icon name='plus' size='x16' /> Add Task
				</Button>
			</Box> */}

			<Box flexGrow={1} overflow='auto'>
				<Table fixed striped>
					<TableHead>
						<TableRow>
							<TableCell width='x200'>Task Name</TableCell>
							<TableCell width='x120'>Status</TableCell>
							<TableCell width='x100'>Priority</TableCell>
							<TableCell width='x120'>Due Date</TableCell>
							<TableCell width='x150'>Assigned To</TableCell>
							<TableCell width='x80'>Actions</TableCell>
						</TableRow>
					</TableHead>
					<TableBody>
						{sampleTasks.map((task) => (
							<TableRow key={task.id}>
								<TableCell fontScale='p2m'>{task.title}</TableCell>
								<TableCell>
									<Box
										padding='x4'
										bg={`status-${task.status.toLowerCase().replace(' ', '-')}`}
										borderRadius='x4'
										fontScale='micro'
										color='white'
									>
										{task.status}
									</Box>
								</TableCell>
								<TableCell>
									<Box padding='x4' bg={`priority-${task.priority.toLowerCase()}`} borderRadius='x4' fontScale='micro' color='white'>
										{task.priority}
									</Box>
								</TableCell>
								<TableCell>{task.dueDate}</TableCell>
								<TableCell>{task.assignedTo}</TableCell>
								<TableCell>
									<Button small secondary>
										<Icon name='edit' size='x16' />
									</Button>
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</Box>
		</Box>
	);
};

export default TableView;
