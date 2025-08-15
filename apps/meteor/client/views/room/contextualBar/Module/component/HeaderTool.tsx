import { Box, Button, Icon, Select, TextInput, ButtonGroup } from '@rocket.chat/fuselage';
import { useAutoFocus } from '@rocket.chat/fuselage-hooks';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import type { ViewType } from '../mockData';

interface HeaderToolProps {
	textSearch: string;
	onTextSearchChange: (text: string) => void;
	currentView: ViewType;
	onViewChange: (view: ViewType) => void;
	onAddDocument?: () => void;
	onAddStage?: () => void;
	canEdit?: boolean;
}

const HeaderTool = ({
	textSearch,
	onTextSearchChange,
	currentView,
	onViewChange,
	onAddDocument,
	onAddStage,
	canEdit = true,
}: HeaderToolProps) => {
	const { t } = useTranslation();
	const inputRef = useAutoFocus<HTMLInputElement>(true);

	const handleTextSearchChange = useCallback(
		(event: React.ChangeEvent<HTMLInputElement>) => {
			onTextSearchChange(event.currentTarget.value);
		},
		[onTextSearchChange],
	);

	const filterOptions = [
		{ label: t('All'), value: 'all' },
		{ label: t('High_Priority'), value: 'high' },
		{ label: t('Medium_Priority'), value: 'medium' },
		{ label: t('Low_Priority'), value: 'low' },
		{ label: t('Overdue'), value: 'overdue' },
		{ label: t('Due_Today'), value: 'due_today' },
	];

	return (
		<Box display='flex' flexDirection='column' style={{ gap: '16px' }} w='full'>
			{/* View Switcher */}
			<Box display='flex' justifyContent='space-between' alignItems='center'>
				<ButtonGroup>
					<Button primary={currentView === 'kanban'} onClick={() => onViewChange('kanban')} small>
						<Icon name='grid' size='x16' mie='x4' />
						{t('Kanban')}
					</Button>
					<Button primary={currentView === 'table'} onClick={() => onViewChange('table')} small>
						<Icon name='list' size='x16' mie='x4' />
						{t('Table')}
					</Button>
				</ButtonGroup>

				{canEdit && (
					<Box display='flex' alignItems='center' style={{ gap: '8px' }}>
						{currentView === 'kanban' && onAddStage && (
							<Button secondary onClick={onAddStage} small>
								<Icon name='plus' size='x16' mie='x4' />
								{t('Add_Stage')}
							</Button>
						)}
						{onAddDocument && (
							<Button primary onClick={onAddDocument} small>
								<Icon name='plus' size='x16' mie='x4' />
								{t('Add_Document')}
							</Button>
						)}
					</Box>
				)}
			</Box>

			{/* Search and Filters */}
			<Box display='flex' flexDirection='row' alignItems='center' w='full' style={{ gap: '12px' }}>
				<Box flexGrow={1} minWidth={0}>
					<TextInput
						placeholder={t('Search_documents')}
						value={textSearch}
						ref={inputRef}
						onChange={handleTextSearchChange}
						addon={<Icon name='magnifier' size='x20' />}
					/>
				</Box>

				<Box w='x144' flexShrink={0}>
					<Select
						options={filterOptions}
						placeholder={t('Filter')}
						value='all'
						onChange={() => {
							// TODO: Implement filter logic
						}}
					/>
				</Box>

				<Box flexShrink={0}>
					<Button
						ghost
						onClick={() => {
							// TODO: Implement advanced filters modal
						}}
					>
						<Icon name='filter' size='x16' mie='x4' />
						{t('Filters')}
					</Button>
				</Box>

				<Box flexShrink={0}>
					<Button
						ghost
						onClick={() => {
							// TODO: Implement sort options
						}}
					>
						<Icon name='sort' size='x16' mie='x4' />
						{t('Sort')}
					</Button>
				</Box>
			</Box>
		</Box>
	);
};

export default HeaderTool;
