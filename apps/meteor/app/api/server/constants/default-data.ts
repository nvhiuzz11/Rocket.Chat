import { PROJECT_PROPERTY_TYPES, TASK_PROPERTY_TYPES } from '../../../../definition/project';

export const DEFAULT_PROJECT_STATUS_TAGS = [
	{
		name: 'Not Started',
		color: '#2C2C2C',
		order: 1,
	},
	{
		name: 'In Progress',
		color: '#153E5C',
		order: 2,
	},
	{
		name: 'Completed',
		color: '#1A4733',
		order: 3,
	},
];

export const DEFAULT_PROJECT_PROPERTIES = [
	{
		name: 'Status',
		type: PROJECT_PROPERTY_TYPES.SELECT,
		order: 1,
		data: DEFAULT_PROJECT_STATUS_TAGS,
	},
];

export const DEFAULT_TASK_STATUS_TAGS = [
	{
		name: 'Not Started',
		color: '#2C2C2C',
		order: 1,
	},
	{
		name: 'In Progress',
		color: '#153E5C',
		order: 2,
	},
	{
		name: 'Done',
		color: '#1A4733',
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
		type: TASK_PROPERTY_TYPES.SELECT,
		order: 1,
		data: DEFAULT_TASK_STATUS_TAGS,
	},
	{
		name: 'Priority',
		type: TASK_PROPERTY_TYPES.SELECT,
		order: 2,
		data: DEFAULT_TASK_PRIORITY_TAGS,
	},
];
