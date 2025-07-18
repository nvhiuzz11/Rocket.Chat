const DEFAULT_PROJECT_STATUS_TAGS = [
	{
		name: 'Not Started',
		color: '#CCCCCC',
		order: 1,
	},
	{
		name: 'In Progress',
		color: '#3498DB',
		order: 2,
	},
	{
		name: 'Completed',
		color: '#2ECC71',
		order: 3,
	},
];

export const DEFAULT_PROJECT_PROPERTIES = [
	{
		name: 'Status',
		type: 'SELECT',
		order: 1,
		data: DEFAULT_PROJECT_STATUS_TAGS,
	},
];

export const DEFAULT_TASK_STATUS_TAGS = [
	{
		name: 'Not Started',
		color: '#CCCCCC',
		order: 1,
	},
	{
		name: 'In Progress',
		color: '#3498DB',
		order: 2,
	},
	{
		name: 'Done',
		color: '#2ECC71',
		order: 3,
	},
];

export const DEFAULT_TASK_PRIORITY_TAGS = [
	{
		name: 'Low',
		color: '#4ADE80',
		order: 1,
	},
	{
		name: 'Medium',
		color: '#FBBF24',
		order: 2,
	},
	{
		name: 'High',
		color: '#F87171',
		order: 3,
	},
];

export const DEFAULT_TASK_PROPERTIES = [
	{
		name: 'Status',
		type: 'SELECT',
		order: 1,
		data: DEFAULT_TASK_STATUS_TAGS,
	},
	{
		name: 'Priority',
		type: 'SELECT',
		order: 2,
		data: DEFAULT_TASK_PRIORITY_TAGS,
	},
];
