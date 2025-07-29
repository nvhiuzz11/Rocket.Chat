import { Box } from '@rocket.chat/fuselage';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useState } from 'react';

import KanbanColumn from './KanbanColumn';
import ProjectCard from './ProjectCard';
import type { IProjectProperty } from '../../../../../../server/core-typings/IProjectProperty';
import type { IProject } from '../../../../../../server/core-typings/IProject';
import { darkenColor, lightenColor } from '../../../../../lib/utils/kanbanBorad';

type ProjectBoard = {
	id: string;
	title: string;
	status: string;
	priority?: 'low' | 'medium' | 'high' | 'urgent';
	dueDate?: string;
	color?: {
		column: string; // column
		card: string; // card
		text: string; // text + circle
		tag: string; // tag
		button: string; // button
	};
};

// type KanbanBoardProps = {
// 	projectProperties: IProjectProperty[];
// 	projects: IProject[];
// };

const KanbanBoard = ({}) => {
	// projectProperties = [
	// 	{
	// 		"_id": "68830228a2b916ee5e46a0e7",
	// 		"name": "Status",
	// 		"type": "SELECT",
	// 		"teamId": "68830228a2b916ee5e46a0e4",
	// 		"required": true,
	// 		"systemKey": "status",
	// 		"order": 0,
	// 		"_updatedAt": "2025-07-25T04:03:52.759Z",
	// 		"value": [
	// 			{
	// 				"_id": "68830228a2b916ee5e46a0e8",
	// 				"name": "In Progress",
	// 				"color": "#153E5C",
	// 				"projectPropertyId": "68830228a2b916ee5e46a0e7",
	// 				"order": 0,
	// 				"_updatedAt": "2025-07-25T04:03:52.762Z"
	// 			},
	// 			{
	// 				"_id": "68830228a2b916ee5e46a0e9",
	// 				"name": "Completed",
	// 				"color": "#1A4733",
	// 				"projectPropertyId": "68830228a2b916ee5e46a0e7",
	// 				"order": 0,
	// 				"_updatedAt": "2025-07-25T04:03:52.762Z"
	// 			},
	// 			{
	// 				"_id": "68830228a2b916ee5e46a0ea",
	// 				"name": "Not Started",
	// 				"color": "#2C2C2C",
	// 				"projectPropertyId": "68830228a2b916ee5e46a0e7",
	// 				"order": 0,
	// 				"_updatedAt": "2025-07-25T04:03:52.762Z"
	// 			}
	// 		]
	// 	}
	// // ]

	// const statuses = useMemo(() => projectProperties
	// 	.filter((property) => property.systemKey === 'status')
	// 	.map((property) => ({
	// 		id: property.value,
	// 		name: property.name,
	// 		color: property.value?.[0].color,
	// 	}));
	// ), [projectProperties]);

	// console.log('statuses', statuses);

	const [projects, setProjects] = useState<ProjectBoard[]>([
		{
			id: '1',
			title: 'Design new dashboard',
			status: 'not-started',
			priority: 'high',
			dueDate: '2023-06-15',
		},
		{
			id: '2',
			title: 'Implement authentication',
			status: 'in-progress',
			priority: 'medium',
			dueDate: '2023-06-20',
		},
		{
			id: '3',
			title: 'Fix mobile layout',
			status: 'in-review',
			priority: 'high',
			dueDate: '2023-06-18',
		},
		{
			id: '4',
			title: 'Write documentation',
			status: 'in-review',
			priority: 'low',
			dueDate: '2023-06-25',
		},
		{
			id: '5',
			title: 'Optimize performance',
			status: 'in-progress',
			priority: 'high',
			dueDate: '2023-06-22',
		},
		{
			id: '6',
			title: 'Add unit tests',
			status: 'in-review',
			priority: 'medium',
			dueDate: '2023-06-19',
		},
		{
			id: '7',
			title: 'Deploy to production',
			status: 'done',
			priority: 'urgent',
			dueDate: '2023-06-10',
		},
	]);

	const statuses = [
		{
			id: 'not-started',
			name: 'Not Started',
			color: {
				column: '#2C2C2C',
				card: lightenColor('#2C2C2C', 0.1),
				text: darkenColor('#2C2C2C', 0.2),
				tag: lightenColor('#2C2C2C', 0.2),
				button: darkenColor('#2C2C2C', 0.05),
			},
		},
		{
			id: 'in-progress',
			name: 'In Progress',
			color: {
				column: '#153E5C',
				card: lightenColor('#153E5C', 0.1),
				text: darkenColor('#153E5C', 0.2),
				tag: lightenColor('#153E5C', 0.2),
				button: darkenColor('#153E5C', 0.05),
			},
		},
		{
			id: 'in-review',
			name: 'In Review',
			color: {
				column: '#332259',
				card: lightenColor('#332259', 0.1),
				text: darkenColor('#332259', 0.2),
				tag: lightenColor('#332259', 0.2),
				button: darkenColor('#332259', 0.05),
			},
		},
		{
			id: 'done',
			name: 'Done',
			color: {
				column: '#1A4733',
				card: lightenColor('#1A4733', 0.1),
				text: darkenColor('#1A4733', 0.2),
				tag: lightenColor('#1A4733', 0.2),
				button: darkenColor('#1A4733', 0.05),
			},
		},
	];

	const getPriorityColor = (priority: string): string => {
		switch (priority) {
			case 'low':
				return '#3B82F6'; // blue
			case 'medium':
				return '#8B5CF6'; // purple
			case 'high':
				return '#EC4899'; // pink
			case 'urgent':
				return '#EF4444'; // red
			default:
				return '#94A3B8'; // gray
		}
	};

	const handleTaskDrop = (taskId: string, newStatus: string) => {
		setProjects((prevProjects) => prevProjects.map((project) => (project.id === taskId ? { ...project, status: newStatus } : project)));
	};

	const handleTaskReorder = (taskId: string, newIndex: number) => {
		setProjects((prevProjects) => {
			const task = prevProjects.find((p) => p.id === taskId);
			if (!task) return prevProjects;

			const sameStatusProjects = prevProjects.filter((p) => p.status === task.status);
			const otherProjects = prevProjects.filter((p) => p.status !== task.status);

			// Calculate actual index based on drop position
			const actualIndex = Math.min(newIndex, sameStatusProjects.length - 1);

			// Remove the task from its current position
			const filtered = sameStatusProjects.filter((p) => p.id !== taskId);
			// Insert at new position
			filtered.splice(actualIndex, 0, task);

			return [...filtered, ...otherProjects];
		});
	};

	return (
		<Box display='flex' flexDirection='column' width='100%' height='100%'>
			<Box
				display='flex'
				flexDirection='row'
				overflowX='auto'
				overflowY='auto'
				padding='x16'
				height='100%'
				style={
					{
						'--rcx-spacing-x16': '16px',
						'--rcx-spacing-x8': '8px',
						'gap': 'var(--rcx-spacing-x16)',
						'alignItems': 'flex-start', // Thêm dòng này
					} as React.CSSProperties
				}
			>
				{statuses.map((status) => {
					const filteredProjects = projects.filter((project) => project.status === status.id);
					return (
						<KanbanColumn key={status.id} status={status} onTaskDrop={handleTaskDrop} onTaskReorder={handleTaskReorder}>
							{filteredProjects.map((project) => (
								<ProjectCard
									key={project.id}
									project={{
										...project,
										priorityColor: getPriorityColor(project.priority),
										color: status.color,
									}}
								/>
							))}
						</KanbanColumn>
					);
				})}
			</Box>
		</Box>
	);
};

export default KanbanBoard;
