import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

interface ChannelInfo {
	_id: string;
	name: string;
	fname?: string;
	type: string;
}

export const useChannelInfo = (channelIds: string | string[] | undefined) => {
	const getRoomInfo = useEndpoint('GET', '/v1/rooms.info');

	// Convert to array and filter out empty values
	const ids = useMemo(() => {
		if (!channelIds) return [];
		const idsArray = Array.isArray(channelIds) ? channelIds : [channelIds];
		return idsArray.filter(Boolean);
	}, [channelIds]);

	// Fetch all channel info
	const queries = useQuery({
		queryKey: ['channels.info', ids],
		queryFn: async () => {
			if (ids.length === 0) return [];
			
			// Fetch all channels in parallel
			const promises = ids.map(async (roomId) => {
				try {
					const result = await getRoomInfo({ roomId });
					return {
						_id: result.room._id,
						name: result.room.fname || result.room.name,
						type: result.room.t,
					};
				} catch (error) {
					// If room not found or no access, return basic info
					return {
						_id: roomId,
						name: roomId,
						type: 'c',
					};
				}
			});

			return Promise.all(promises);
		},
		enabled: ids.length > 0,
		staleTime: 30000, // Cache for 30 seconds
	});

	return {
		channels: queries.data || [],
		isLoading: queries.isLoading,
		error: queries.error,
	};
};

// Hook for single channel
export const useSingleChannelInfo = (channelId: string | undefined) => {
	const getRoomInfo = useEndpoint('GET', '/v1/rooms.info');

	const query = useQuery({
		queryKey: ['channel.info', channelId],
		queryFn: async () => {
			if (!channelId) return null;
			
			try {
				const result = await getRoomInfo({ roomId: channelId });
				return {
					_id: result.room._id,
					name: result.room.fname || result.room.name,
					type: result.room.t,
				};
			} catch (error) {
				// If room not found or no access, return basic info
				return {
					_id: channelId,
					name: channelId,
					type: 'c',
				};
			}
		},
		enabled: !!channelId,
		staleTime: 30000, // Cache for 30 seconds
	});

	return {
		channel: query.data,
		isLoading: query.isLoading,
		error: query.error,
	};
};