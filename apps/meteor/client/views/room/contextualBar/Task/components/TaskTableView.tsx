import { TableCell, Box, Icon, Button, Tag, Table } from '@rocket.chat/fuselage';
import { UserAvatar } from '@rocket.chat/ui-avatar';
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

import TaskItemMenu from './TaskItemMenu';
import type { ITask } from '../../../../../../server/core-typings/ITask';
import type { ITaskProperty } from '../../../../../../server/core-typings/ITaskProperty';
import type { ITaskTag } from '../../../../../../server/core-typings/ITaskTag';
import GenericNoResults from '../../../../../components/GenericNoResults';
import {
	GenericTableHeader,
	GenericTableBody,
	GenericTableRow,
	GenericTableHeaderCell,
	GenericTableLoadingTable,
	GenericTableCell,
} from '../../../../../components/GenericTable';

type TableViewProps = {
	tasks: ITask[];
	taskProperties?: (ITaskProperty & { value: ITaskTag[] })[];
	onEditTask: (task: ITask) => void;
	loading: boolean;
	reload?: () => void;
	error?: Error;
	onOpenTaskDetail?: (task: ITask) => void;
};

const columnHelper = createColumnHelper<ITask>();

const TaskTableView = ({ tasks, taskProperties, onEditTask, loading, reload, error, onOpenTaskDetail }: TableViewProps) => {
	const { t } = useTranslation();
	const [sorting, setSorting] = useState<SortingState>([]);

	const columns = useMemo(() => {
		const getTaskPropertyValue = (task: ITask, property: ITaskProperty & { value: ITaskTag[] }) => {
			const taskProp = task.properties?.find((p) => p.taskPropertyId === property._id);

			if (!taskProp?.value)
				return (
					<Box color='hint'>
						—
					</Box>
				);
			const tagValues = taskProp.value
				.map((tagId) => property.value.find((tag) => tag._id === tagId))
				.filter((tag): tag is ITaskTag => !!tag);
			if (tagValues.length === 0)
				return (
					<Box color='hint'>
						—
					</Box>
				);
			return (
				<Box display='flex' flexDirection='row' flexWrap='wrap' mi='neg-x4'>
					{tagValues.map((tag) => (
						<Box key={tag._id} mi='x4' mb='x4'>
							<Tag style={{ backgroundColor: tag.color }}>{tag.value}</Tag>
						</Box>
					))}
				</Box>
			);
		};

		const staticColumns = [
			columnHelper.accessor('title', {
				header: () => t('Task_Name'),
				cell: (info) => (
					<Box withTruncatedText minWidth='180px' maxWidth='200px'>
						{info.getValue() || (
							<Box color='hint'>
								—
							</Box>
						)}
					</Box>
				),
				size: 250,
			}),
			columnHelper.accessor('description', {
				header: () => t('Description'),
				cell: (info) => (
					<Box withTruncatedText minWidth='200px' maxWidth='250px'>
						{info.getValue() || (
							<Box color='hint'>
								—
							</Box>
						)}
					</Box>
				),
				size: 250,
			}),
		];

		const dynamicColumns =
			taskProperties?.map((property) =>
				columnHelper.display({
					id: property._id,
					header: () => property.name,
					cell: ({ row }) => getTaskPropertyValue(row.original, property),
					enableSorting: false,
					size: 150,
				}),
			) || [];

		const finalColumns = [
			columnHelper.accessor('dueDate', {
				header: () => t('Due_Date'),
				cell: (info) =>
					info.getValue() ? (
						new Date(info.getValue() as Date).toLocaleDateString(undefined, {
							day: '2-digit',
							month: '2-digit',
							year: 'numeric',
						})
					) : (
						<Box color='hint'>
							—
						</Box>
					),
				size: 120,
			}),
			columnHelper.accessor('assignees', {
				header: () => t('Assignees'),
				cell: ({ getValue }) => {
					const assignees = getValue();
					
					if (!assignees || assignees.length === 0) {
						return (
							<Box color='hint'>
								—
							</Box>
						);
					}

					const displayedAssignees = assignees.slice(0, 2);
					const remainingAssignees = assignees.slice(2);
					const remainingCount = remainingAssignees.length;

					return (
						<Box display='flex' alignItems='center' overflow='hidden'>
							{displayedAssignees.map((assignee) => (
								<Box
									key={assignee._id}
									display='flex'
									alignItems='center'
									flexShrink={0}
									marginInlineEnd='x8'
									backgroundColor='surface-light'
									borderRadius='x4'
									padding='x4'
								>
									<UserAvatar size='x16' userId={assignee._id} />
									<Box is='span' mi='x6' withTruncatedText>
										{assignee.username}
									</Box>
								</Box>
							))}
							{remainingCount > 0 && (
								<Box 
									display='flex' 
									alignItems='center' 
									backgroundColor='surface-light'
									borderRadius='x4'
									padding='x4'
									color='hint'
								>
									+{remainingCount}
								</Box>
							)}
						</Box>
					);
				},
				enableSorting: false,
				size: 220,
			}),
			columnHelper.display({
				id: 'actions',
				cell: ({ row }) => <TaskItemMenu task={row.original} reload={reload} onOpenTaskDetail={onOpenTaskDetail} />,
				enableSorting: false,
				size: 60,
			}),
		];

		return [...staticColumns, ...dynamicColumns, ...finalColumns];
	}, [t, taskProperties, onEditTask, reload, onOpenTaskDetail]);

	const table = useReactTable({
		data: tasks,
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
			<Box height='100%' width='100%' overflow='auto' borderRadius='x4'>
				<Table sticky>
					<GenericTableHeader>
						{columns.map((column: any) => (
							<GenericTableHeaderCell key={column.id} style={{ minWidth: `${column.size || 150}px`, width: `${column.size || 150}px` }} />
						))}
					</GenericTableHeader>
					<GenericTableBody>
						<GenericTableLoadingTable headerCells={columns.length} />
					</GenericTableBody>
				</Table>
			</Box>
		);
	}

	if (error) {
		return (
			<GenericNoResults
				icon='warning'
				title={t('Something_went_wrong')}
				buttonTitle={t('Reload_page')}
				buttonAction={reload || (() => undefined)}
			/>
		);
	}

	if (tasks.length === 0) {
		return <GenericNoResults icon='list-bullets' title={t('No_tasks_found')} />;
	}

	return (
		<Box height='100%' width='100%' overflow='auto' borderRadius='x4'>
			<Table sticky>
				<GenericTableHeader>
					{table.getHeaderGroups()[0].headers.map((header) => (
						<GenericTableHeaderCell
							key={header.id}
							style={{ minWidth: `${header.getSize()}px`, width: `${header.getSize()}px` }}
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
						<GenericTableRow key={row.id} action onClick={onOpenTaskDetail ? () => onOpenTaskDetail(row.original) : undefined}>
							{row.getVisibleCells().map((cell) => (
								<GenericTableCell
									key={cell.id}
									onClick={cell.column.id === 'actions' ? (e) => e.stopPropagation() : undefined}
									style={{ minWidth: `${cell.column.getSize()}px`, width: `${cell.column.getSize()}px` }}
								>
									{flexRender(cell.column.columnDef.cell, cell.getContext())}
								</GenericTableCell>
							))}
						</GenericTableRow>
					))}
				</GenericTableBody>
			</Table>
		</Box>
	);
};

export default TaskTableView;
