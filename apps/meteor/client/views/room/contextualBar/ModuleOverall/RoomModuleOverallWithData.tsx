import { useDebouncedValue, useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { useSetModal } from '@rocket.chat/ui-contexts';
import type { ChangeEvent } from 'react';
import { useCallback, useMemo, useState, lazy } from 'react';

import RoomModuleOverall from './RoomModuleOverall';
import CreateModuleModal from './components/CreateModuleModal';
import ModuleDetailModal from './components/ModuleDetailModal';
import { useModulesList } from './hooks/useModulesList';
import { useRecordList } from '../../../../hooks/lists/useRecordList';
import { AsyncStatePhase } from '../../../../lib/asyncState';
import { useRoom } from '../../contexts/RoomContext';
import { useRoomToolbox } from '../../contexts/RoomToolboxContext';

const RoomModuleWithData = lazy(() => import('../Module/RoomModuleWithData'));

const RoomModuleOverallWithData = () => {
	const room = useRoom();
	const setModal = useSetModal();
	const { closeTab } = useRoomToolbox();

	const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);

	const [text, setText] = useState('');
	const debouncedText = useDebouncedValue(text, 800);

	const { modulesList, loadMoreItems, reload } = useModulesList(
		useMemo(() => ({ roomId: room._id, text: debouncedText }), [room._id, debouncedText]),
	);

	const { phase, items, itemCount: total } = useRecordList(modulesList);

	const handleTextChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
		setText(event.currentTarget.value);
	}, []);

	const handleCreateNew = useEffectEvent(() => {
		setModal(<CreateModuleModal roomId={room._id} onClose={() => setModal(null)} onSuccess={reload} />);
	});

	const handleViewModule = useEffectEvent((moduleId: string) => {
		setSelectedModuleId(moduleId);
	});

	const handleBackToList = useEffectEvent(() => {
		setSelectedModuleId(null);
	});

	const handleEditModule = useEffectEvent((moduleId: string) => {
		const module = items.find((m) => m._id === moduleId);
		if (module) {
			setModal(<ModuleDetailModal module={module} onClose={() => setModal(null)} onSuccess={reload} />);
		}
	});

	const handleDeleteModule = useEffectEvent((moduleId: string) => {
		console.log('Delete module:', moduleId);
	});

	if (selectedModuleId) {
		return <RoomModuleWithData moduleId={selectedModuleId} onClickBack={handleBackToList} />;
	}

	return (
		<RoomModuleOverall
			loading={phase === AsyncStatePhase.LOADING}
			modules={items}
			text={text}
			setText={handleTextChange}
			onClickClose={closeTab}
			onClickCreateNew={handleCreateNew}
			total={total}
			loadMoreItems={loadMoreItems}
			onClickView={handleViewModule}
			onClickEdit={handleEditModule}
			onClickDelete={handleDeleteModule}
			reload={reload}
		/>
	);
};

export default RoomModuleOverallWithData;
