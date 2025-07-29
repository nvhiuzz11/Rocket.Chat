import { Box, Button, Icon, Throbber } from '@rocket.chat/fuselage';
import { useEndpoint, useSetModal } from '@rocket.chat/ui-contexts';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import CreateProjectModal from './components/CreateProjectModal';
import KanbanBoard from './components/KanbanBoard';
import TableView from './components/TableView';
import ViewSwitcher from './components/ViewSwitcher';
import type { IProject } from '../../../../../server/core-typings/IProject';
import type { IProjectProperty } from '../../../../../server/core-typings/IProjectProperty';
import type { IProjectTag } from '../../../../../server/core-typings/IProjectTag';
import {
	ContextualbarHeader,
	ContextualbarIcon,
	ContextualbarTitle,
	ContextualbarClose,
	ContextualbarContent,
	ContextualbarEmptyContent,
	ContextualbarDialogResizable,
} from '../../../../components/Contextualbar';

type TeamsProjectsProps = {
	loading: boolean;
	projects: IProject[];
	teamId: string;
	onClickClose: () => void;
	error?: Error | null;
};

type ViewType = 'kanban' | 'table';

const TeamsProjects = ({ loading, projects = [], teamId, onClickClose, error }: TeamsProjectsProps) => {
	const { t } = useTranslation();
	const [currentView, setCurrentView] = useState<ViewType>('kanban');
	const [projectProperties, setProjectProperties] = useState<IProjectProperty[] & { value: IProjectTag[] }>();
	const setModal = useSetModal();

	const getProjectPropertiesEndpoint = useEndpoint('GET', '/v1/project-properties.list');

	useEffect(() => {
		getProjectPropertiesEndpoint({ teamId }).then((data) => {
			console.log('data ', data);
			setProjectProperties(data.projectProperties);
		});
	}, [getProjectPropertiesEndpoint, teamId]);

	const handleViewChange = useCallback((view: ViewType) => {
		setCurrentView(view);
	}, []);

	const handleAddProject = () => {
		if (!teamId) return;
		setModal(<CreateProjectModal teamId={teamId} projectProperties={projectProperties} onClose={() => setModal(null)} />);
	};

	return (
		<ContextualbarDialogResizable>
			<ContextualbarHeader>
				<ContextualbarIcon name='stack' />
				<ContextualbarTitle>{t('Team_Projects')}</ContextualbarTitle>
				{onClickClose && <ContextualbarClose onClick={onClickClose} />}
			</ContextualbarHeader>
			<ContextualbarContent p={12}>
				{error && (
					<ContextualbarEmptyContent>
						<Box fontScale='h4'>{t('Error_loading_projects')}</Box>
						<Box fontScale='p2' color='danger'>
							{error.message}
						</Box>
					</ContextualbarEmptyContent>
				)}
				{!error && loading && (
					<Box pi={24} pb={12}>
						<Throbber size='x12' />
					</Box>
				)}
				{/* {!error && !loading && projects.length === 0 && <ContextualbarEmptyContent title={t('No_projects_in_team')} />} */}

				{/* <Box w='full' h='full' overflow='auto' flexGrow={1} bg='red'>
					<Box display='flex' justifyContent='space-between' alignItems='center'>
						<ViewSwitcher activeView={currentView} onViewChange={handleViewChange} />
					</Box>
					<Box display='flex' alignItems='center'>
						<Button small primary marginInlineStart='auto' onClick={handleAddProject}>
							<Icon name='plus' size='x16' /> Add Project
						</Button>
					</Box>

					<Box flexGrow={1} overflow='hidden' bg='white'>
						{currentView === 'kanban' ? <KanbanBoard /> : <TableView />}
					</Box>
				</Box> */}
				<Box w='full' h='full' overflow='hidden' flexGrow={1} display='flex' flexDirection='column'>
					<Box display='flex' justifyContent='space-between' alignItems='center'>
						<ViewSwitcher activeView={currentView} onViewChange={handleViewChange} />
					</Box>

					<Box display='flex' alignItems='center' justifyContent='flex-end'>
						<Button small primary marginInlineEnd='x16' onClick={handleAddProject}>
							<Icon name='plus' size='x16' /> Add Project
						</Button>
					</Box>

					<Box flexGrow={1} overflow='auto'>
						{currentView === 'kanban' ? (
							<KanbanBoard projectProperties={projectProperties} />
						) : (
							<TableView projectProperties={projectProperties} />
						)}
					</Box>
				</Box>
			</ContextualbarContent>
		</ContextualbarDialogResizable>
	);
};

export default TeamsProjects;
