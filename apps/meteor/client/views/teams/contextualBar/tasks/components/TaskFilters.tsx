import React from 'react';
import { Box, TextInput, Select, Icon } from '@rocket.chat/fuselage';

interface TaskFiltersProps {
	searchTerm: string;
	onSearchChange: (value: string) => void;
	priorityFilter: string;
	onPriorityChange: (value: string) => void;
	assigneeFilter: string;
	onAssigneeChange: (value: string) => void;
}

const assigneeOptions = [
	{ value: 'hieu_ngo', label: 'Hiếu Ngô' },
	{ value: 'thanh_nguyen', label: 'Thanh Huyền Nguyễn' },
	{ value: 'nguyen_hieu', label: 'Nguyễn Hiếu' },
	{ value: 'trung_hoang', label: 'Trung Hoàng' },
];

const priorityOptions = [
	{ value: 'low', label: 'Low' },
	{ value: 'medium', label: 'Medium' },
	{ value: 'high', label: 'High' },
	{ value: 'urgent', label: 'Urgent' },
];

const filterPriorityOptions = [{ value: 'all', label: 'All Priority' }, ...priorityOptions];

const filterAssigneeOptions = [{ value: 'all', label: 'All Assignees' }, ...assigneeOptions];

const TaskFilters: React.FC<TaskFiltersProps> = ({
	searchTerm,
	onSearchChange,
	priorityFilter,
	onPriorityChange,
	assigneeFilter,
	onAssigneeChange,
}) => {
	return (
		<>
			{/* Search */}
			<Box display='flex' alignItems='center' gap='12px' marginBlockEnd='20px'>
				<TextInput
					placeholder='Search tasks...'
					value={searchTerm}
					onChange={(e) => onSearchChange(e.currentTarget.value)}
					addon={<Icon name='magnifier' />}
				/>
			</Box>

			{/* Filters */}
			<Box display='flex' gap='16px' marginBlockEnd='20px' flexWrap='wrap'>
				<Select
					value={priorityFilter}
					onChange={(value) => onPriorityChange(value)}
					options={filterPriorityOptions}
					placeholder='Filter by priority'
				/>
				<Select
					value={assigneeFilter}
					onChange={(value) => onAssigneeChange(value)}
					options={filterAssigneeOptions}
					placeholder='Filter by assignee'
				/>
			</Box>
		</>
	);
};

export default TaskFilters;
