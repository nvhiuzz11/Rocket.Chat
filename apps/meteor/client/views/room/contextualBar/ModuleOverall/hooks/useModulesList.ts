import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useCallback, useMemo } from 'react';

import type { IModule } from '../../../../../../server/core-typings/IModule';
import { useScrollableRecordList } from '../../../../../hooks/lists/useScrollableRecordList';
import { useComponentDidUpdate } from '../../../../../hooks/useComponentDidUpdate';
import { RecordList } from '../../../../../lib/lists/RecordList';

type ModulesListOptions = {
	roomId: string;
	text?: string;
};

type ModuleListItem = IModule & {
	stageCount?: number;
	documentCount?: number;
};

export const useModulesList = (options: ModulesListOptions) => {
	const getModulesByRoomId = useEndpoint('GET', '/v1/modules.listByRoomId');

	const fetchData = useCallback(
		async (start: number, end: number) => {
			const { modules, total } = await getModulesByRoomId({
				roomId: options.roomId,
				offset: start,
				count: end - start,
			});

			return {
				items: modules as unknown as ModuleListItem[],
				itemCount: total || 0,
			};
		},
		[getModulesByRoomId, options.roomId],
	);

	const modulesList = useMemo(() => new RecordList<ModuleListItem>(), []);

	const { loadMoreItems, initialItemCount } = useScrollableRecordList(modulesList, fetchData, 25);

	useComponentDidUpdate(() => {
		modulesList.clear();
		loadMoreItems(0);
	}, [modulesList, loadMoreItems]);

	const reload = useCallback(async () => {
		try {
			const freshData = await fetchData(0, 100);
			await modulesList.clear();
			await modulesList.batchHandle(() => Promise.resolve(freshData));
		} catch (error) {
			await modulesList.clear();
			loadMoreItems(0);
		}
	}, [modulesList, fetchData, loadMoreItems]);

	return {
		modulesList,
		loadMoreItems,
		reload,
		initialItemCount,
	};
};
