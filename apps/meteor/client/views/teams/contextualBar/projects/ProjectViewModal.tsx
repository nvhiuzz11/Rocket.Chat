import type { IRoom } from '@rocket.chat/core-typings';
import { Modal, Box, Button, Icon } from '@rocket.chat/fuselage';
import { useSetModal, useEndpoint } from '@rocket.chat/ui-contexts';
import { useState, useCallback, useMemo, useEffect } from 'react';

import CreateProjectModal from './components/CreateProjectModal';
import KanbanBoard from './components/KanbanBoard';
import TableView from './components/TableView';
import ViewSwitcher from './components/ViewSwitcher';
import type { IProject } from '../../../../../server/core-typings/IProject';

type ProjectViewModalProps = {
	onClose: () => void;
	room: IRoom;
};

type ViewType = 'kanban' | 'table';

const ProjectViewModal = ({ onClose, room }: ProjectViewModalProps) => {
	const setModal = useSetModal();
	const { teamId } = room;

	const projectsOfTeamEndpoint = useEndpoint('GET', '/v1/projects.list.team');

	const [currentView, setCurrentView] = useState<ViewType>('kanban');
	const [projects, setProjects] = useState<IProject[]>([]);

	const handleViewChange = useCallback((view: ViewType) => {
		setCurrentView(view);
	}, []);

	const handleAddProject = () => {
		if (!teamId) return;
		setModal(<CreateProjectModal teamId={teamId} onClose={() => setModal(null)} />);
	};

	const fetchProjects = useCallback(async () => {
		const { projects = [] } = await projectsOfTeamEndpoint({ teamId: teamId || '' });
		console.log('projects ', projects);
		setProjects(projects);
	}, [projectsOfTeamEndpoint, teamId]);

	useEffect(() => {
		fetchProjects();
	}, [fetchProjects]);

	return (
		<Modal width='95vw' maxWidth='1800px' height='95vh'>
			<Modal.Header>
				<Modal.Title>Project Management</Modal.Title>
				<Modal.Close onClick={onClose} />
			</Modal.Header>

			<Modal.Content>
				<Box display='flex' flexDirection='column' width='100%' height='100%' padding='x18' overflow='hidden'>
					<Box display='flex' justifyContent='space-between' alignItems='center'>
						<ViewSwitcher activeView={currentView} onViewChange={handleViewChange} />
					</Box>
					<Box display='flex' alignItems='center'>
						<Button small primary marginInlineStart='auto' onClick={handleAddProject}>
							<Icon name='plus' size='x16' /> Add Project
						</Button>
					</Box>

					<Box flexGrow={1} overflow='hidden'>
						{currentView === 'kanban' ? <KanbanBoard projects={projects} /> : <TableView />}
					</Box>
				</Box>
			</Modal.Content>
		</Modal>
	);
};

export default ProjectViewModal;
