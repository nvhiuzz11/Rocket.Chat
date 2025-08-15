import { useDebouncedValue, useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { useSetModal, usePermission } from '@rocket.chat/ui-contexts';
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
	const canEditRoom = usePermission('edit-room', room._id);
	
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
		// Switch to Module detail view
		setSelectedModuleId(moduleId);
	});
	
	const handleBackToList = useEffectEvent(() => {
		// Return to module list
		setSelectedModuleId(null);
	});

	const handleEditModule = useEffectEvent((moduleId: string) => {
		// Find the module from the items list
		const module = items.find((m) => m._id === moduleId);
		if (module) {
			setModal(<ModuleDetailModal module={module} onClose={() => setModal(null)} onSuccess={reload} />);
		}
	});

	const handleDeleteModule = useEffectEvent((moduleId: string) => {
		// This is handled in ModuleItemMenu
		console.log('Delete module:', moduleId);
	});

	// If a module is selected, show the module detail view
	if (selectedModuleId) {
		return <RoomModuleWithData moduleId={selectedModuleId} onClickBack={handleBackToList} />;
	}

	// Otherwise show the module list
	return (
		<RoomModuleOverall
			loading={phase === AsyncStatePhase.LOADING}
			modules={items}
			roomId={room._id}
			text={text}
			setText={handleTextChange}
			onClickClose={closeTab}
			onClickCreateNew={canEditRoom && handleCreateNew}
			total={total}
			loadMoreItems={loadMoreItems}
			onClickView={handleViewModule}
			onClickEdit={canEditRoom ? handleEditModule : undefined}
			onClickDelete={canEditRoom ? handleDeleteModule : undefined}
			reload={reload}
		/>
	);
};

export default RoomModuleOverallWithData;
