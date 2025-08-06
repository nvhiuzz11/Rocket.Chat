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
		required: true,
		systemKey: 'status',
	},
];

export const DEFAULT_TASK_STATUS_TAGS = [
	{
		value: 'Not Started',
		color: '#2C2C2C',
		order: 1,
	},
	{
		value: 'In Progress',
		color: '#153E5C',
		order: 2,
	},
	{
		value: 'Done',
		color: '#1A4733',
		order: 3,
	},
];

export const DEFAULT_TASK_PRIORITY_TAGS = [
	{
		value: 'Low',
		color: '#4ADE80',
		order: 1,
	},
	{
		value: 'Medium',
		color: '#FBBF24',
		order: 2,
	},
	{
		value: 'High',
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
		required: true,
		systemKey: 'status',
	},
	{
		name: 'Priority',
		type: TASK_PROPERTY_TYPES.SELECT,
		order: 2,
		data: DEFAULT_TASK_PRIORITY_TAGS,
		required: false,
		systemKey: 'priority',
	},
];
