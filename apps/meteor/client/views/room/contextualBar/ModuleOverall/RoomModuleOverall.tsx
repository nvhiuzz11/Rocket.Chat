import { Box, Icon, TextInput, Throbber, ButtonGroup, Button } from '@rocket.chat/fuselage';
import { useEffectEvent, useAutoFocus, useDebouncedCallback } from '@rocket.chat/fuselage-hooks';
import type { ChangeEvent, SyntheticEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Virtuoso } from 'react-virtuoso';

import ModuleItem from './components/ModuleItem';
import type { IModule } from '../../../../../../../server/core-typings/IModule';
import {
	ContextualbarHeader,
	ContextualbarIcon,
	ContextualbarTitle,
	ContextualbarClose,
	ContextualbarContent,
	ContextualbarFooter,
	ContextualbarEmptyContent,
	ContextualbarSection,
	ContextualbarDialogResizable,
} from '../../../../components/Contextualbar';
import { VirtualizedScrollbars } from '../../../../components/CustomScrollbars';
import InfiniteListAnchor from '../../../../components/InfiniteListAnchor';

type RoomModuleOverallProps = {
	loading: boolean;
	modules: (IModule & {
		stageCount?: number;
		documentCount?: number;
	})[];
	roomId: string;
	text: string;
	setText: (e: ChangeEvent<HTMLInputElement>) => void;
	onClickClose: () => void;
	onClickCreateNew: false | ((e: SyntheticEvent) => void);
	total: number;
	loadMoreItems: (start: number, end: number) => void;
	onClickView: (moduleId: string) => void;
	onClickEdit?: (moduleId: string) => void;
	onClickDelete?: (moduleId: string) => void;
	reload: () => void;
};

const RoomModuleOverall = ({
	loading,
	modules = [],
	roomId,
	text,
	setText,
	onClickClose,
	onClickCreateNew,
	total,
	loadMoreItems,
	onClickView,
	onClickEdit,
	onClickDelete,
	reload,
}: RoomModuleOverallProps) => {
	console.log(' RoomModuleOverall modules', modules);
	const { t } = useTranslation();
	const inputRef = useAutoFocus<HTMLInputElement>(true);

	const lm = useEffectEvent((start: number) => !loading && loadMoreItems(start, Math.min(50, total - start)));

	const loadMoreModules = useDebouncedCallback(
		() => {
			if (modules.length >= total) {
				return;
			}

			lm(modules.length);
		},
		300,
		[lm, modules],
	);

	return (
		<ContextualbarDialogResizable>
			<ContextualbarHeader>
				<ContextualbarIcon name='squares' />
				<ContextualbarTitle>{t('Room_Modules')}</ContextualbarTitle>
				{onClickClose && <ContextualbarClose onClick={onClickClose} />}
			</ContextualbarHeader>
			<ContextualbarSection>
				<TextInput
					placeholder={t('Search_modules')}
					value={text}
					ref={inputRef}
					onChange={setText}
					addon={<Icon name='magnifier' size='x20' />}
				/>
			</ContextualbarSection>
			<ContextualbarContent p={12}>
				{loading && (
					<Box pi={24} pb={12}>
						<Throbber size='x12' />
					</Box>
				)}
				{!loading && modules.length === 0 && !text && (
					<ContextualbarEmptyContent title={t('No_modules_in_room')} subtitle={t('Create_your_first_module_to_get_started')} />
				)}
				{!loading && modules.length === 0 && text && (
					<ContextualbarEmptyContent title={t('No_modules_found')} subtitle={t('Try_different_keywords')} />
				)}
				{!loading && modules.length > 0 && (
					<>
						<Box pi={18} pb={12}>
							<Box is='span' color='hint' fontScale='p2'>
								{t('Showing')}: {modules.length}
							</Box>

							<Box is='span' color='hint' fontScale='p2' mis={8}>
								{t('Total')}: {total}
							</Box>
						</Box>
						<Box w='full' h='full' role='list' overflow='hidden' flexShrink={1}>
							<VirtualizedScrollbars>
								<Virtuoso
									totalCount={total}
									data={modules}
									components={{ Footer: () => <InfiniteListAnchor loadMore={loadMoreModules} /> }}
									itemContent={(index, data) => (
										<ModuleItem
											module={data}
											roomId={roomId}
											onClickView={onClickView}
											onClickEdit={onClickEdit}
											onClickDelete={onClickDelete}
											reload={reload}
											key={data._id}
										/>
									)}
								/>
							</VirtualizedScrollbars>
						</Box>
					</>
				)}
			</ContextualbarContent>
			{onClickCreateNew && (
				<ContextualbarFooter>
					<ButtonGroup stretch>
						<Button onClick={onClickCreateNew} primary>
							{t('Create_Module')}
						</Button>
					</ButtonGroup>
				</ContextualbarFooter>
			)}
		</ContextualbarDialogResizable>
	);
};

export default RoomModuleOverall;
