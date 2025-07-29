import type { Serialized } from '@rocket.chat/core-typings';
import { Pagination, States, StatesIcon, StatesTitle, StatesActions, StatesAction } from '@rocket.chat/fuselage';
import { useMediaQuery } from '@rocket.chat/fuselage-hooks';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import type { KeyboardEvent, MouseEvent } from 'react';
import { useCallback, useMemo, useState } from 'react';

import TasksTableRow from './TasksTableRow';
import FilterByText from '../../../../../components/FilterByText';
import GenericNoResults from '../../../../../components/GenericNoResults';
import {
	GenericTable,
	GenericTableHeader,
	GenericTableHeaderCell,
	GenericTableBody,
	GenericTableLoadingTable,
} from '../../../../../components/GenericTable';
import { usePagination } from '../../../../../components/GenericTable/hooks/usePagination';
import { useSort } from '../../../../../components/GenericTable/hooks/useSort';
import type { ITaskResponse } from '../../../../../definitions/model/task';

const TasksTable = () => {
	const mediaQuery = useMediaQuery('(min-width: 768px)');
	const [text, setText] = useState('');

	const { current, itemsPerPage, setItemsPerPage: onSetItemsPerPage, setCurrent: onSetCurrent, ...paginationProps } = usePagination();
	const { sortBy, sortDirection, setSort } = useSort<'title' | 'status' | 'dueDate' | 'updatedAt'>('updatedAt');

	const headers = useMemo(
		() =>
			[
				<GenericTableHeaderCell key='title' direction={sortDirection} active={sortBy === 'title'} onClick={setSort} sort='title'>
					Title
				</GenericTableHeaderCell>,
				<GenericTableHeaderCell key='assignees' w='120px'>
					Assignees
				</GenericTableHeaderCell>,
				mediaQuery && (
					<GenericTableHeaderCell
						key='dueDate'
						direction={sortDirection}
						active={sortBy === 'dueDate'}
						onClick={setSort}
						sort='dueDate'
						w='150px'
					>
						Due Date
					</GenericTableHeaderCell>
				),
				<GenericTableHeaderCell
					key='updatedAt'
					direction={sortDirection}
					active={sortBy === 'updatedAt'}
					onClick={setSort}
					sort='updatedAt'
					w='150px'
				>
					Last Updated
				</GenericTableHeaderCell>,
			].filter(Boolean),
		[setSort, sortBy, sortDirection, mediaQuery],
	);

	const getTasks = useEndpoint('GET', '/v1/tasks.list');

	const query = useMemo(
		() => ({
			text,
			offset: current,
			count: itemsPerPage,
			sort: JSON.stringify({ [sortBy]: sortDirection === 'asc' ? 1 : -1 }),
		}),
		[text, current, itemsPerPage, sortBy, sortDirection],
	);

	const { data, isLoading, isError, refetch } = useQuery({
		queryKey: ['tasks', query],
		queryFn: () => getTasks(query),
	});

	const onClick = useCallback(
		(id: string) => (e: KeyboardEvent | MouseEvent) => {
			if (e.type === 'click' || (e as KeyboardEvent).key === 'Enter') {
				// Handle task click, e.g., navigate to task detail
				console.log('Task clicked:', id);
			}
		},
		[],
	);

	const renderContent = () => {
		if (isLoading) {
			return (
				<GenericTable>
					<GenericTableHeader>{headers}</GenericTableHeader>
					<GenericTableBody>
						<GenericTableLoadingTable headerCells={headers.length} />
					</GenericTableBody>
				</GenericTable>
			);
		}

		if (isError) {
			return (
				<States>
					<StatesIcon name='warning' variation='danger' />
					<StatesTitle>Something went wrong</StatesTitle>
					<StatesActions>
						<StatesAction onClick={() => refetch()}>Retry</StatesAction>
					</StatesActions>
				</States>
			);
		}

		if (data?.tasks && data.tasks.length > 0) {
			return (
				<>
					<GenericTable>
						<GenericTableHeader>{headers}</GenericTableHeader>
						<GenericTableBody>
							{data.tasks.map((task) => (
								<TasksTableRow key={task._id} task={task as Serialized<ITaskResponse>} onClick={onClick} mediaQuery={mediaQuery} />
							))}
						</GenericTableBody>
					</GenericTable>
					<Pagination
						divider
						current={current}
						itemsPerPage={itemsPerPage}
						count={data?.total || 0}
						onSetItemsPerPage={onSetItemsPerPage}
						onSetCurrent={onSetCurrent}
						{...paginationProps}
					/>
				</>
			);
		}

		return <GenericNoResults />;
	};

	return (
		<>
			<FilterByText placeholder={'Search Tasks'} value={text} onChange={(event) => setText(event.target.value)} />
			{renderContent()}
		</>
	);
};

export default TasksTable;
