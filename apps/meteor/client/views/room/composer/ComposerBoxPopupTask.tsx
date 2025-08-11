import { OptionAvatar, OptionContent, OptionColumn, OptionInput, Icon } from '@rocket.chat/fuselage';
import { useTranslation } from 'react-i18next';

export type ComposerBoxPopupTaskProps = {
	_id: string;
	title: string;
	description?: string;
	status?: string;
	priority?: string;
	assignedTo?: {
		_id: string;
		username: string;
		name?: string;
	};
	projectId?: string;
	projectName?: string;
	variant?: 'small' | 'large';
};

function ComposerBoxPopupTask({ title, description, status, priority, assignedTo, projectName, variant }: ComposerBoxPopupTaskProps) {
	const { t } = useTranslation();

	const priorityColors: Record<string, string> = {
		low: '#2DE0A5',
		medium: '#F38C39',
		high: '#EC0D2A',
		urgent: '#CB2431',
	};

	const getStatusIcon = (status?: string): any => {
		const icons: Record<string, string> = {
			todo: 'circle',
			in_progress: 'reload',
			review: 'eye',
			done: 'check',
			archived: 'file-text',
		};
		return icons[status || 'todo'] || 'tasks';
	};

	return (
		<>
			<OptionAvatar>
				<Icon name={getStatusIcon(status)} size='x28' color={priority ? priorityColors[priority] : '#6C727A'} />
			</OptionAvatar>
			<OptionContent>
				<strong>{title}</strong>
				{description && variant === 'large' && <div style={{ fontSize: '12px', color: '#9EA2A8' }}>{description}</div>}
				{assignedTo && variant === 'large' && (
					<div style={{ fontSize: '11px', color: '#9EA2A8' }}>
						{t('Assigned_to')}: @{assignedTo.username}
					</div>
				)}
				{projectName && variant === 'large' && (
					<div style={{ fontSize: '11px', color: '#9EA2A8' }}>
						{t('Project')}: {projectName}
					</div>
				)}
			</OptionContent>
			{status && variant === 'large' && (
				<OptionColumn>
					<OptionInput>{t(`Task_Status_${status}`)}</OptionInput>
				</OptionColumn>
			)}
		</>
	);
}

export default ComposerBoxPopupTask;
