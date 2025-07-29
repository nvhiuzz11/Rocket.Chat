import { useRef, useEffect } from 'react';
import { draggable } from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import { css } from '@rocket.chat/css-in-js';
import { Box, Icon } from '@rocket.chat/fuselage';
import { useTranslation } from 'react-i18next';

type Priority = 'low' | 'medium' | 'high' | 'urgent';

type ProjectProps = {
	id: string;
	title: string;
	status: string;
	priority?: Priority;
	dueDate?: string;
	priorityColor?: string;
	color?: {
		column: string;
		card: string;
		text: string;
		tag: string;
		button: string;
	};
};

type ProjectCardProps = {
	project: ProjectProps;
};

const ProjectCard = ({ project }: ProjectCardProps) => {
	const { t } = useTranslation();
	const ref = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const element = ref.current;
		if (!element) return;

		return draggable({
			element,
			getInitialData: () => ({ id: project.id, status: project.status }),
		});
	}, [project.id, project.status]);

	const formatDate = (dateString?: string) => {
		if (!dateString) return '';
		const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
		return new Date(dateString).toLocaleDateString(undefined, options);
	};

	const getPriorityIcon = (priority?: string) => {
		switch (priority) {
			case 'low':
				return 'arrow-down' as const;
			case 'medium':
				return 'line' as const;
			case 'high':
			case 'urgent':
				return 'arrow-up' as const;
			default:
				return 'menu' as const;
		}
	};

	const getPriorityLabel = (priority: Priority) => {
		switch (priority) {
			case 'low':
				return t('Low');
			case 'medium':
				return t('Medium');
			case 'high':
				return t('High');
			case 'urgent':
				return t('Urgent');
			default:
				return '';
		}
	};

	const cardStyle = css`
		background: ${project.color?.card};
		border-radius: 8px;
		padding: 16px;
		cursor: grab;
		transition: all 0.2s ease;
		box-shadow:
			rgba(0, 0, 0, 0.08) 0px 2px 4px 0px,
			rgba(255, 255, 255, 0.094) 0px 0px 0px 1px;

		&:hover {
			transform: translateY(-2px);
			box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
		}

		&:active {
			cursor: grabbing;
		}
	`;

	return (
		<Box ref={ref} className={cardStyle}>
			<Box display='flex' justifyContent='space-between' alignItems='flex-start' mb='x8'>
				<Box
					fontScale='p2m'
					style={{
						fontWeight: 500,
						lineHeight: '20px',
					}}
				>
					{project.title}
				</Box>
				{project.priority && project.priorityColor && (
					<Box
						display='flex'
						alignItems='center'
						style={{
							backgroundColor: `${project.priorityColor}15`,
							color: project.priorityColor,
							borderRadius: '4px',
							padding: '2px 6px',
							fontSize: '12px',
							fontWeight: 500,
							height: '20px',
						}}
					>
						<Icon name={getPriorityIcon(project.priority)} size='x12' mie='x4' />
						{getPriorityLabel(project.priority)}
					</Box>
				)}
			</Box>

			<Box display='flex' justifyContent='space-between' alignItems='center' mt='x12'>
				{project.dueDate && (
					<Box
						display='flex'
						alignItems='center'
						style={{
							fontSize: '12px',
							padding: '2px 6px',
							background: '#f8fafc',
							borderRadius: '4px',
							color: '#64748b',
						}}
					>
						<Icon name='calendar' size='x12' mie='x4' />
						{formatDate(project.dueDate)}
					</Box>
				)}
			</Box>
		</Box>
	);
};

export default ProjectCard;
