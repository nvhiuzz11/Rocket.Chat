import { OptionAvatar, OptionContent, Icon } from '@rocket.chat/fuselage';

export type ComposerBoxPopupProjectProps = {
	_id: string;
	name: string;
	description?: string;
	variant?: 'small' | 'large';
};

function ComposerBoxPopupProject({ _id, name, description, variant }: ComposerBoxPopupProjectProps) {
	return (
		<>
			<OptionAvatar>
				<Icon name='stack' size='x28' />
			</OptionAvatar>
			<OptionContent>
				<strong>{name}</strong>
				{description && variant === 'large' && <div style={{ fontSize: '12px', color: '#9EA2A8' }}>{description}</div>}
			</OptionContent>
		</>
	);
}

export default ComposerBoxPopupProject;
