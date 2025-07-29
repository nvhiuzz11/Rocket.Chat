import { ButtonGroup, Button, Icon } from '@rocket.chat/fuselage';

type ViewType = 'kanban' | 'table';

type ViewSwitcherProps = {
	activeView: ViewType;
	onViewChange: (view: ViewType) => void;
};

const ViewSwitcher = ({ activeView, onViewChange }: ViewSwitcherProps) => {
	return (
		<ButtonGroup style={{ marginBottom: '16px' }}>
			<Button primary={activeView === 'kanban'} onClick={() => onViewChange('kanban')} title='Kanban View'>
				<Icon name='squares' size='x20' />
			</Button>
			<Button primary={activeView === 'table'} onClick={() => onViewChange('table')} title='Table View'>
				<Icon name='th-list' size='x20' />
			</Button>
		</ButtonGroup>
	);
};

export default ViewSwitcher;
