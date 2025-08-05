import type { IRoom } from '@rocket.chat/core-typings';
import { Box, Button, Icon, TextInput } from '@rocket.chat/fuselage';
import { useAutoFocus } from '@rocket.chat/fuselage-hooks';
import { useEndpoint, useSetModal } from '@rocket.chat/ui-contexts';
import { type ChangeEvent, useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import CreateProjectModal from './components/CreateProjectModal';
import ProjectDetailModal from './components/ProjectDetailModal';
import ProjectTableView from './components/ProjectTableView';
import type { IProject } from '../../../../../server/core-typings/IProject';
import type { IProjectProperty } from '../../../../../server/core-typings/IProjectProperty';
import type { IProjectTag } from '../../../../../server/core-typings/IProjectTag';
import {
	ContextualbarHeader,
	ContextualbarIcon,
	ContextualbarTitle,
	ContextualbarClose,
	ContextualbarContent,
	ContextualbarDialogResizable,
	ContextualbarSection,
} from '../../../../components/Contextualbar';

type TeamsProjectsProps = {
	loading: boolean;
	projects: IProject[] & { room: IRoom };
	teamId: string;
	textSearch: string;
	setTextSearch: (text: string) => void;
	onClickClose: () => void;
	onClickProject: (room: IRoom) => void;
	error?: Error | null;
	reload?: () => void;
};

const TeamsProjects = ({
	loading,
	projects = [],
	teamId,
	textSearch,
	setTextSearch,
	onClickClose,
	onClickProject,
	error,
	reload,
}: TeamsProjectsProps) => {
	const { t } = useTranslation();
	const [projectProperties, setProjectProperties] = useState<IProjectProperty[] & { value: IProjectTag[] }>();
	const inputRef = useAutoFocus<HTMLInputElement>(true);
	const setModal = useSetModal();

	const getProjectPropertiesEndpoint = useEndpoint('GET', '/v1/project-properties.list');

	useEffect(() => {
		getProjectPropertiesEndpoint({ teamId }).then((data) => {
			setProjectProperties(data.projectProperties as IProjectProperty[] & { value: IProjectTag[] });
		});
	}, [getProjectPropertiesEndpoint, teamId]);

	const handleAddProject = () => {
		if (!teamId) return;
		setModal(<CreateProjectModal teamId={teamId} projectProperties={projectProperties} onClose={() => setModal(null)} reload={reload} />);
	};

	const handleTextSearchChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
		setTextSearch(event.currentTarget.value);
	}, []);

	const openProjectDetailModal = (project: IProject) => {
		setModal(
			<ProjectDetailModal
				teamId={teamId}
				projectProperties={projectProperties}
				onClose={() => setModal(null)}
				reload={reload}
				project={project}
			/>,
		);
	};

	return (
		<ContextualbarDialogResizable>
			<ContextualbarHeader>
				<ContextualbarIcon name='stack' />
				<ContextualbarTitle>{t('Team_Projects')}</ContextualbarTitle>
				{onClickClose && <ContextualbarClose onClick={onClickClose} />}
			</ContextualbarHeader>
			<ContextualbarSection>
				<TextInput
					placeholder={t('Search')}
					value={textSearch}
					ref={inputRef}
					onChange={handleTextSearchChange}
					addon={<Icon name='magnifier' size='x20' />}
				/>
				<Button onClick={handleAddProject} mis={12}>
					<Icon name='plus' size='x16' /> Add Project
				</Button>
			</ContextualbarSection>
			<ContextualbarContent p={12}>
				{/* {error && (
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
				)} */}

				<Box w='full' h='full' overflow='hidden' flexGrow={1} display='flex' flexDirection='column'>
					<Box flexGrow={1} overflow='auto'>
						<ProjectTableView
							projectProperties={projectProperties}
							projects={projects}
							loading={loading}
							onClickProject={onClickProject}
							reload={reload}
							error={error}
							onOpenProjectDetail={openProjectDetailModal}
						/>
					</Box>
				</Box>
			</ContextualbarContent>
		</ContextualbarDialogResizable>
	);
};

export default TeamsProjects;
