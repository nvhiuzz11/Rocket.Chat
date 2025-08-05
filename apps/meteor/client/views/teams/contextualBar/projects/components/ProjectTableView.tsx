import type { IRoom, IUser } from '@rocket.chat/core-typings';
import { Box, TableCell, Icon } from '@rocket.chat/fuselage';
import { RoomAvatar, UserAvatar } from '@rocket.chat/ui-avatar';
import {
	createColumnHelper,
	getCoreRowModel,
	getSortedRowModel,
	useReactTable,
	type SortingState,
	flexRender,
} from '@tanstack/react-table';
import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import TeamsProjectItemMenu from './TeamsProjectItemMenu';
import type { IProject } from '../../../../../../server/core-typings/IProject';
import GenericNoResults from '../../../../../components/GenericNoResults';
import {
	GenericTable,
	GenericTableHeader,
	GenericTableBody,
	GenericTableRow,
	GenericTableHeaderCell,
	GenericTableLoadingTable,
} from '../../../../../components/GenericTable';

type ProjectData = IProject & { room: IRoom; createdBy: Pick<IUser, '_id' | 'username'> };

type ProjectTableViewProps = {
	projects: ProjectData[];
	loading: boolean;
	onClickProject: (room: IRoom) => void;
	reload?: () => void;
	error?: Error;
	onOpenProjectDetail?: (project: IProject) => void;
};

const columnHelper = createColumnHelper<ProjectData>();

const ProjectTableView = ({ projects, loading, onClickProject, reload, error, onOpenProjectDetail }: ProjectTableViewProps) => {
	const { t } = useTranslation();
	const [sorting, setSorting] = useState<SortingState>([]);

	const columns = useMemo(
		() => [
			columnHelper.accessor('name', {
				id: 'name',
				header: () => t('Name'),
				cell: (info) => <Box withTruncatedText>{info.getValue()}</Box>,
				size: 200,
			}),
			columnHelper.accessor('description', {
				id: 'description',
				header: () => t('Description'),
				cell: (info) => <Box withTruncatedText>{info.getValue()}</Box>,
				size: 250,
			}),
			columnHelper.accessor('room.name', {
				id: 'roomName',
				header: () => t('Channel'),
				cell: ({ row }) => {
					const { room } = row.original;
					return (
						<Box display='flex' alignItems='center'>
							<RoomAvatar size='x28' room={room} />
							<Box is='span' mi='x8' withTruncatedText>
								{room.t === 'c' ? <Icon name='hash' size='x15' /> : <Icon name='hashtag-lock' size='x15' />}
								{room.name}
							</Box>
						</Box>
					);
				},
				enableSorting: true,
				size: 180,
			}),
			columnHelper.accessor('createdBy.username', {
				id: 'createdByUsername',
				header: () => t('Created_By'),
				cell: ({ row }) => {
					const { createdBy } = row.original;
					return (
						<Box display='flex' alignItems='center'>
							<UserAvatar size='x28' userId={createdBy._id} />
							<Box is='span' mi='x8' withTruncatedText>
								{createdBy.username}
							</Box>
						</Box>
					);
				},
				size: 150,
			}),
			columnHelper.display({
				id: 'actions',
				cell: ({ row }) => <TeamsProjectItemMenu project={row.original} reload={reload} onOpenProjectDetail={onOpenProjectDetail} />,
				enableSorting: false,
				size: 60,
			}),
		],
		[t, reload],
	);

	const table = useReactTable({
		data: projects,
		columns,
		state: {
			sorting,
		},
		onSortingChange: setSorting,
		getSortedRowModel: getSortedRowModel(),
		getCoreRowModel: getCoreRowModel(),
	});

	if (loading) {
		return (
			<GenericTable>
				<GenericTableHeader>
					{columns.map((column) => (
						<GenericTableHeaderCell key={column.id} />
					))}
				</GenericTableHeader>
				<GenericTableBody>
					<GenericTableLoadingTable headerCells={columns.length} />
				</GenericTableBody>
			</GenericTable>
		);
	}

	if (error) {
		return <GenericNoResults icon='warning' title={t('Something_went_wrong')} buttonTitle={t('Reload_page')} buttonAction={reload} />;
	}

	if (projects.length === 0) {
		return <GenericNoResults icon='stack' title={t('No_projects_in_team')} />;
	}

	return (
		<GenericTable>
			<GenericTableHeader>
				{table.getHeaderGroups()[0].headers.map((header) => (
					<GenericTableHeaderCell
						key={header.id}
						w={header.getSize()}
						sort={header.column.getCanSort() ? header.column.id : undefined}
						active={header.column.getIsSorted() !== false}
						direction={header.column.getIsSorted() === 'asc' ? 'asc' : 'desc'}
						onClick={header.column.getToggleSortingHandler()}
					>
						{flexRender(header.column.columnDef.header, header.getContext())}
					</GenericTableHeaderCell>
				))}
			</GenericTableHeader>
			<GenericTableBody>
				{table.getRowModel().rows.map((row) => (
					<GenericTableRow key={row.id} onClick={() => onOpenProjectDetail(row.original)} action>
						{row.getVisibleCells().map((cell) => (
							<TableCell key={cell.id} onClick={cell.column.id === 'actions' ? (e) => e.stopPropagation() : undefined}>
								{flexRender(cell.column.columnDef.cell, cell.getContext())}
							</TableCell>
						))}
					</GenericTableRow>
				))}
			</GenericTableBody>
		</GenericTable>
	);
};

export default ProjectTableView;
