import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useEffect, useState, useCallback, useMemo } from 'react';

import RoomModule from './RoomModule';
import type { IModule } from '../../../../../server/core-typings/IModule';
import type { IStage } from '../../../../../server/core-typings/IStage';
import type { IDocument } from '../../../../../server/core-typings/IDocument';
import { useRoom } from '../../contexts/RoomContext';
import { useRoomToolbox } from '../../contexts/RoomToolboxContext';

type RoomModuleWithDataProps = {
	moduleId?: string;
	onClickBack?: () => void;
};

const RoomModuleWithData = ({ moduleId, onClickBack }: RoomModuleWithDataProps): JSX.Element => {
	const room = useRoom();
	const { closeTab } = useRoomToolbox();

	const moduleInfoEndpoint = useEndpoint('GET', '/v1/modules.info');
	const stagesEndpoint = useEndpoint('GET', '/v1/stages.listByModuleId');
	const documentsEndpoint = useEndpoint('GET', '/v1/documents.listByModuleId');

	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<Error | null>(null);
	const [module, setModule] = useState<IModule | null>(null);
	const [stages, setStages] = useState<IStage[]>([]);
	const [documents, setDocuments] = useState<IDocument[]>([]);
	const [textSearch, setTextSearch] = useState('');
	const debouncedTextSearch = useDebouncedValue(textSearch, 800);

	// Navigate back to Module Overall view
	const handleBack = useCallback(() => {
		if (onClickBack) {
			onClickBack();
		}
	}, [onClickBack]);

	// Centralized error handler
	const handleError = useCallback((err: unknown, context: string) => {
		const error = err instanceof Error ? err : new Error(`Failed to ${context}`);
		console.error(`Error in ${context}:`, error);
		setError(error);
	}, []);

	// Fetch module info
	const getModuleInfo = useCallback(async () => {
		try {
			if (!moduleId) {
				// If no moduleId, try to get module by roomId
				const response = await moduleInfoEndpoint({ roomId: room._id });
				const module = {
					...response.module,
					createdAt: new Date(response.module.createdAt),
					_updatedAt: new Date(response.module._updatedAt),
				};
				console.log('module roomId', module);
				setModule(module);
				return module;
			}
			const response = await moduleInfoEndpoint({ moduleId });
			const module = response.module;
			console.log('module', module);
			setModule(module);
			return module;
		} catch (err) {
			handleError(err, 'fetch module info');
			return null;
		}
	}, [moduleInfoEndpoint, moduleId, room._id, handleError]);

	// Fetch stages
	const getStages = useCallback(
		async (moduleId: string) => {
			try {
				const response = await stagesEndpoint({ moduleId });
				const stages = response.stages;
				setStages(stages);
				return stages;
			} catch (err) {
				handleError(err, 'fetch stages');
				return [];
			}
		},
		[stagesEndpoint, handleError],
	);

	// Fetch documents
	const getDocuments = useCallback(
		async (moduleId: string, _search?: string) => {
			try {
				const response = await documentsEndpoint({ moduleId });
				const documents = response.documents;
				console.log('documents', documents);
				setDocuments(documents);
				return documents;
			} catch (err) {
				handleError(err, 'fetch documents');
				return [];
			}
		},
		[documentsEndpoint, handleError],
	);

	// Main data fetching function
	const fetchAllData = useCallback(async () => {
		try {
			setLoading(true);
			setError(null);

			const module = await getModuleInfo();

			if (!module?._id) {
				setStages([]);
				setDocuments([]);
				return;
			}

			// Use Promise.allSettled to handle potential failures gracefully
			await Promise.allSettled([getStages(module._id), getDocuments(module._id, debouncedTextSearch)]);
		} catch (err) {
			handleError(err, 'fetch all data');
		} finally {
			setLoading(false);
		}
	}, [getModuleInfo, getStages, getDocuments, handleError, debouncedTextSearch]);

	// Effect to load data when component mounts or dependencies change
	useEffect(() => {
		fetchAllData();
	}, [fetchAllData]); // Use the memoized fetchAllData

	// Reload function
	const reload = useCallback(() => {
		return fetchAllData();
	}, [fetchAllData]);

	// Memoize props object to prevent unnecessary re-renders
	const roomModuleProps = useMemo(
		() => ({
			moduleId: moduleId || module?._id || '',
			loading,
			module,
			stages,
			documents,
			onClickClose: closeTab,
			onClickBack: onClickBack ? handleBack : undefined,
			error,
			textSearch,
			setTextSearch,
			_reload: reload,
			_roomId: room._id,
		}),
		[moduleId, module, loading, stages, documents, closeTab, onClickBack, handleBack, error, textSearch, reload, room._id],
	);

	return <RoomModule {...roomModuleProps} />;
};

export default RoomModuleWithData;
