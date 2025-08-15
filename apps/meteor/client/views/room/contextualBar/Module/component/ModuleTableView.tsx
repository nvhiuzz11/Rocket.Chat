import { Box, Icon, IconButton, Select, Tag, Table } from '@rocket.chat/fuselage';
import { RoomAvatar, UserAvatar } from '@rocket.chat/ui-avatar';
import { useRouter } from '@rocket.chat/ui-contexts';
import {
	createColumnHelper,
	getCoreRowModel,
	getSortedRowModel,
	useReactTable,
	type SortingState,
	flexRender,
} from '@tanstack/react-table';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useChannelInfo } from '../../../../../hooks/useChannelInfo';
import DocumentItemMenu from './DocumentItemMenu';
import { MODULE_FIELD_TYPES } from '../../../../../../definition/IModuleConfig';
import type { IDocument } from '../../../../../../server/core-typings/IDocument';
import type { IModule } from '../../../../../../server/core-typings/IModule';
import type { IStage } from '../../../../../../server/core-typings/IStage';
import GenericNoResults from '../../../../../components/GenericNoResults';
import {
	GenericTableHeader,
	GenericTableBody,
	GenericTableRow,
	GenericTableHeaderCell,
	GenericTableLoadingTable,
	GenericTableCell,
} from '../../../../../components/GenericTable';

interface IModuleTableViewProps {
	documents: IDocument[];
	stages: IStage[];
	module: IModule;
	onEditDocument?: (document: IDocument) => void;
	onDeleteDocument?: (documentId: string) => void;
	onOpenDocument?: (document: IDocument) => void;
	onMoveDocument?: (documentId: string, newStageId: string) => void;
	canEdit?: boolean;
	loading?: boolean;
	error?: Error;
	reload?: () => void;
}

const columnHelper = createColumnHelper<IDocument>();

const ModuleTableView = ({
	documents,
	stages,
	module,
	onEditDocument,
	onDeleteDocument,
	onOpenDocument,
	onMoveDocument,
	canEdit = true,
	loading = false,
	error,
	reload,
}: IModuleTableViewProps) => {
	const { t } = useTranslation();
	const [sorting, setSorting] = useState<SortingState>([]);
	const router = useRouter();

	// Collect all channel IDs from all documents
	const allChannelIds = useMemo(() => {
		const ids: string[] = [];
		documents.forEach((doc) => {
			doc.customFields?.forEach((field: any) => {
				const fieldDef = module.fieldDefinitions?.find((def) => def._id === field.fieldId);
				if (fieldDef?.type === MODULE_FIELD_TYPES.CHANNEL && field.value) {
					const channels = Array.isArray(field.value) ? field.value : [field.value];
					channels.forEach((channel) => {
						const id = typeof channel === 'string' ? channel : channel?._id;
						if (id && !ids.includes(id)) ids.push(id);
					});
				}
			});
		});
		return ids;
	}, [documents, module.fieldDefinitions]);

	// Fetch channel info for all channels
	const { channels: channelInfoList } = useChannelInfo(allChannelIds);

	// Create stage lookup map
	const stageMap = useMemo(() => {
		return stages.reduce(
			(acc, stage) => {
				acc[stage._id] = stage;
				return acc;
			},
			{} as Record<string, IStage>,
		);
	}, [stages]);

	// Stage options for dropdown
	const stageOptions = useMemo(() => {
		return stages.map((stage) => ({
			label: stage.name,
			value: stage._id,
		}));
	}, [stages]);

	// Helper function to render field value
	const renderFieldValue = (fieldDef: any, customField: any) => {
		const value = customField?.value;
		if (!value) return <Box color='hint'>—</Box>;

		switch (fieldDef.type) {
			case MODULE_FIELD_TYPES.SELECT:
				const selectedOption = fieldDef.options?.find((opt: any) => opt._id === value);
				return selectedOption ? <Tag style={{ backgroundColor: selectedOption.color, color: 'white' }}>{selectedOption.value}</Tag> : value;

			case MODULE_FIELD_TYPES.MULTI_SELECT:
				const selectedOptions = fieldDef.options?.filter((opt: any) => value.includes(opt._id));
				return selectedOptions?.length > 0 ? (
					<Box display='flex' flexWrap='wrap' style={{ gap: '4px' }}>
						{selectedOptions.map((opt: any) => (
							<Tag key={opt._id} style={{ backgroundColor: opt.color, color: 'white' }}>
								{opt.value}
							</Tag>
						))}
					</Box>
				) : (
					<Box color='hint'>—</Box>
				);

			case MODULE_FIELD_TYPES.DATE:
				const date = new Date(value as string);
				const isOverdue = date < new Date();
				return (
					<Box color={isOverdue ? 'danger' : 'default'} fontWeight={isOverdue ? 'bold' : 'normal'}>
						{date.toLocaleDateString()}
						{isOverdue && (
							<Box display='inline' mis='x4'>
								<Icon name='warning' size='x12' color='danger' />
							</Box>
						)}
					</Box>
				);

			case MODULE_FIELD_TYPES.USER:
				if (!value) return <Box color='hint'>—</Box>;

				const users = value;

				if (!users || users.length === 0) {
					return <Box color='hint'>—</Box>;
				}

				const displayedUsers = users.slice(0, 2);
				const remainingUsers = users.slice(2);
				const remainingCount = remainingUsers.length;

				return (
					<Box display='flex' alignItems='center' overflow='hidden'>
						{displayedUsers.map((user: any) => (
							<Box
								key={user._id}
								display='flex'
								alignItems='center'
								flexShrink={0}
								marginInlineEnd='x8'
								backgroundColor='surface-light'
								borderRadius='x4'
								padding='x4'
							>
								<UserAvatar size='x16' userId={user._id} />
								<Box is='span' mi='x6' withTruncatedText>
									{user.username}
								</Box>
							</Box>
						))}
						{remainingCount > 0 && (
							<Box display='flex' alignItems='center' backgroundColor='surface-light' borderRadius='x4' padding='x4' color='hint'>
								+{remainingCount}
							</Box>
						)}
					</Box>
				);

			// Handle both single user object and array of users
			// const users = Array.isArray(value) ? value : [value];
			// const displayUsers = users.filter((user) => user && (user.username || user._id));

			// if (displayUsers.length === 0) return <Box color='hint'>—</Box>;

			// return (
			// 	<Box display='flex' alignItems='center' style={{ gap: '4px' }}>
			// 		<Icon name='user' size='x12' />
			// 		<Box>
			// 			{displayUsers.map((user, index) => (
			// 				<Box key={user._id || index} display='inline'>
			// 					{user.username || user._id}
			// 					{index < displayUsers.length - 1 && ', '}
			// 				</Box>
			// 			))}
			// 		</Box>
			// 	</Box>
			// );

			case MODULE_FIELD_TYPES.CHECKBOX:
				return value ? <Icon name='check' size='x12' color='success' /> : <Icon name='cross' size='x12' color='hint' />;

			case MODULE_FIELD_TYPES.CHANNEL:
				if (!value) return <Box color='hint'>—</Box>;

				// Now we only store channel IDs
				const channelIds = Array.isArray(value) ? value : [value];
				const validChannelIds = channelIds.filter(Boolean);

				if (validChannelIds.length === 0) return <Box color='hint'>—</Box>;

				const displayedChannelIds = validChannelIds.slice(0, 2);
				const remainingChannelIds = validChannelIds.slice(2);
				const remainingChannelCount = remainingChannelIds.length;

				return (
					<Box display='flex' alignItems='center' flexWrap='wrap' style={{ gap: '4px' }}>
						{displayedChannelIds.map((channelId) => {
							// Get fresh channel info from hook
							const channelInfo = channelInfoList.find((ch: any) => ch._id === channelId);
							const channelName = channelInfo?.name || channelId;
							const channelType = channelInfo?.type || 'c';

							return (
								<Box
									key={channelId}
									display='flex'
									alignItems='center'
									backgroundColor='surface-light'
									borderRadius='x4'
									padding='x4'
									onClick={(e: React.MouseEvent) => {
										e.stopPropagation();
										if (channelType === 'c') {
											router.navigate(`/channel/${channelName}`);
										}
										if (channelType === 'p') {
											router.navigate(`/group/${channelName}`);
										}
									}}
									style={{ cursor: 'pointer' }}
								>
									<RoomAvatar size='x16' room={{ _id: channelId, type: channelType }} />
									<Box mis='x4'>
										<Icon name={channelType === 'p' ? 'hashtag-lock' : 'hash'} size='x12' />
										{channelName}
									</Box>
								</Box>
							);
						})}
						{remainingChannelCount > 0 && <Tag>+{remainingChannelCount}</Tag>}
					</Box>
				);

			default:
				return String(value);
		}
	};

	const handleStageChange = (documentId: string, newStageId: string) => {
		if (onMoveDocument) {
			onMoveDocument(documentId, newStageId);
		}
	};

	const columns = useMemo(() => {
		const staticColumns = [
			columnHelper.accessor('name', {
				header: () => t('Name'),
				cell: (info) => (
					<Box>
						<Box fontScale='p2m' withTruncatedText minWidth='180px' maxWidth='200px'>
							{info.getValue()}
						</Box>
						{info.row.original.description && (
							<Box
								fontScale='p2'
								color='hint'
								withTruncatedText
								style={{
									display: '-webkit-box',
									WebkitLineClamp: 1,
									WebkitBoxOrient: 'vertical',
									overflow: 'hidden',
								}}
							>
								{info.row.original.description}
							</Box>
						)}
					</Box>
				),
				size: 250,
			}),
			columnHelper.accessor('stageId', {
				header: () => t('Stage'),
				cell: ({ getValue }) => {
					const stageId = getValue();
					const stage = stageMap[stageId];

					return (
						<Tag style={{ backgroundColor: stage?.color, color: 'white' }}>{stage?.name || 'Unknown'}</Tag>
						// canEdit && onMoveDocument ? (
						// 	<Select
						// 		value={stageId}
						// 		options={stageOptions}
						// 		onChange={(value) => handleStageChange(row.original._id, value)}
						// 		onClick={(e) => e.stopPropagation()}
						// 	/>
						// ) : (
						// <Tag style={{ backgroundColor: stage?.color, color: 'white' }}>{stage?.name || 'Unknown'}</Tag>;
						// );
					);
				},
				size: 180,
			}),
		];

		const dynamicColumns =
			module.fieldDefinitions?.map((fieldDef) =>
				columnHelper.display({
					id: fieldDef._id,
					header: () => fieldDef.name,
					cell: ({ row }) => {
						const customField = row.original.customFields.find((cf) => cf.fieldId === fieldDef._id);
						return renderFieldValue(fieldDef, customField);
					},
					enableSorting: true,
					size: 150,
				}),
			) || [];

		const finalColumns = [
			columnHelper.accessor('createdBy', {
				header: () => t('Created_By'),
				cell: (info) => <Box fontScale='p2'>{info.getValue().name || info.getValue().username}</Box>,
				size: 120,
			}),
			columnHelper.accessor('createdAt', {
				header: () => t('Created_At'),
				cell: (info) => {
					const value = info.getValue();
					const date = value instanceof Date ? value : new Date(value);
					return <Box fontScale='p2'>{date.toLocaleDateString()}</Box>;
				},
				size: 120,
			}),
			columnHelper.display({
				id: 'actions',
				header: () => t('Actions'),
				cell: ({ row }) => <DocumentItemMenu document={row.original} reload={reload} onOpenDocumentDetail={onOpenDocument} />,
				enableSorting: false,
				size: 60,
			}),
		];

		return [...staticColumns, ...dynamicColumns, ...finalColumns];
	}, [t, module.fieldDefinitions, stageMap, stageOptions, canEdit, onEditDocument, onDeleteDocument, onMoveDocument]);

	const table = useReactTable({
		data: documents,
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

	if (documents.length === 0) {
		return <GenericNoResults icon='file' title={t('No_documents_yet')} />;
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
						<GenericTableRow key={row.id} action onClick={onOpenDocument ? () => onOpenDocument(row.original) : undefined}>
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

export default ModuleTableView;
