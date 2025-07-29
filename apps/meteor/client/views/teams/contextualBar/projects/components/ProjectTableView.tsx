import type { IRoom, IUser } from '@rocket.chat/core-typings';
import { css } from '@rocket.chat/css-in-js';
import {
	Table,
	TableHead,
	TableBody,
	TableRow,
	TableCell,
	Box,
	Throbber,
	ContextualbarEmptyContent,
	Palette,
	OptionMenu,
	IconButton,
} from '@rocket.chat/fuselage';
import { usePrefersReducedMotion } from '@rocket.chat/fuselage-hooks';
import { RoomAvatar, UserAvatar } from '@rocket.chat/ui-avatar';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import TeamsProjectItemMenu from './TeamsProjectItemMenu';
import type { IProject } from '../../../../../../server/core-typings/IProject';
import type { IProjectProperty } from '../../../../../../server/core-typings/IProjectProperty';
import type { IProjectTag } from '../../../../../../server/core-typings/IProjectTag';
import { usePreventPropagation } from '../../../../../hooks/usePreventPropagation';

type ProjectTableViewProps = {
	// Note: The original types were slightly incorrect for a list. Corrected below.
	projects: (IProject & { room: IRoom; createdBy: Pick<IUser, '_id' | 'username'> })[];
	loading: boolean;
	projectProperties: (IProjectProperty & { value: IProjectTag[] })[];
	onClickProject: (room: IRoom) => void;
	reload?: () => void;
};

const ProjectTableView = ({ projects, loading, projectProperties, onClickProject, reload }: ProjectTableViewProps) => {
	const { t } = useTranslation();
	const [showOptionMenu, setShowOptionMenu] = useState();

	const isReduceMotionEnabled = usePrefersReducedMotion();
	const handleMenuEvent = {
		[isReduceMotionEnabled ? 'onMouseEnter' : 'onTransitionEnd']: setShowOptionMenu,
	};

	const onClick = usePreventPropagation();

	const handleProjectClick = (project: any) => {
		console.log('Project clicked:', project);
		onClickProject(project.room);
	};

	const hovered = css`
		&:hover {
			cursor: pointer;
		}

		&:hover,
		&:focus {
			background: ${Palette.surface['surface-hover']};
		}
	`;

	return (
		<Box display='flex' flexDirection='column' height='100%'>
			<Box flexGrow={1} overflow='auto'>
				<Table fixed>
					<TableHead>
						<TableRow>
							<TableCell width='x120'>{t('Name')}</TableCell>
							<TableCell width='x150'>{t('Description')}</TableCell>
							<TableCell width='x120'>{t('Channel')}</TableCell>
							<TableCell width='x120'>{t('Created_By')}</TableCell>
							<TableCell width='x80'></TableCell>
						</TableRow>
					</TableHead>
					<TableBody flexGrow={1} overflow='auto'>
						{loading && (
							<TableRow>
								<TableCell colSpan={4}>
									<Box display='flex' justifyContent='center' p='x16'>
										<Throbber />
									</Box>
								</TableCell>
							</TableRow>
						)}
						{!loading && projects.length === 0 && (
							<TableRow>
								<TableCell colSpan={4}>
									<ContextualbarEmptyContent title={t('No_projects_in_team')} />
								</TableCell>
							</TableRow>
						)}

						{!loading &&
							projects?.length > 0 &&
							projects?.map((project) => (
								<TableRow key={project._id} onClick={() => handleProjectClick(project)} className={hovered} {...handleMenuEvent}>
									<TableCell>{project.name}</TableCell>
									<TableCell withTruncatedText>{project.description}</TableCell>
									<TableCell>
										<Box display='flex' alignItems='center'>
											<Box is='span' cursor='pointer'>
												<RoomAvatar size='x24' room={project.room} />
											</Box>
											<Box is='span' cursor='pointer' withTruncatedText>
												{project.room.name}
											</Box>
										</Box>
									</TableCell>
									<TableCell>
										<Box display='flex' alignItems='center'>
											<Box is='span' cursor='pointer'>
												<UserAvatar size='x24' userId={project.createdBy._id} />
											</Box>
											<Box is='span' cursor='pointer' withTruncatedText>
												{project.createdBy.username}
											</Box>
										</Box>
									</TableCell>
									<TableCell>
										{/* <OptionMenu onClick={onClick}>
											{showOptionMenu ? <TeamsProjectItemMenu project={project} reload={reload} /> : <IconButton tiny icon='kebab' />}
										</OptionMenu> */}
										<TeamsProjectItemMenu project={project} reload={reload} />
									</TableCell>
								</TableRow>
							))}
					</TableBody>
				</Table>
			</Box>
		</Box>
	);
};

export default ProjectTableView;
