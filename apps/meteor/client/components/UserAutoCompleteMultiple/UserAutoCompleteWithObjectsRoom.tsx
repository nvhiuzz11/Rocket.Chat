import type { OptionType } from '@rocket.chat/fuselage';
import { MultiSelectFiltered, Icon, Box, Chip } from '@rocket.chat/fuselage';
import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import { UserAvatar } from '@rocket.chat/ui-avatar';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { ReactElement, AllHTMLAttributes } from 'react';
import { memo, useState, useCallback, useMemo } from 'react';

import AutocompleteOptions, { OptionsContext } from './UserAutoCompleteMultipleOptions';

type UserAutoCompleteWithObjectsRoomProps = {
	value: { _id: string; username: string }[];
	onChange: (users: { _id: string; username: string }[]) => void;
	placeholder?: string;
	roomId: string;
} & Omit<AllHTMLAttributes<HTMLElement>, 'is' | 'onChange' | 'value'>;

type UserAutoCompleteOptionType = {
	_id: string;
	name: string;
	username: string;
	_federated?: boolean;
};

type UserAutoCompleteOptionsCache = {
	[k: string]: UserAutoCompleteOptionType;
};

const matrixRegex = new RegExp('@(.*:.*)');

const UserAutoCompleteWithObjectsRoom = ({
	onChange,
	value,
	placeholder,
	roomId,
	...props
}: UserAutoCompleteWithObjectsRoomProps): ReactElement => {
	const [filter, setFilter] = useState('');
	const [selectedCache, setSelectedCache] = useState<UserAutoCompleteOptionsCache>({});

	const debouncedFilter = useDebouncedValue(filter, 500);
	const getRoomMembers = useEndpoint('GET', '/v1/channels.members');
	const getGroupMembers = useEndpoint('GET', '/v1/groups.members');

	const { data } = useQuery({
		queryKey: ['room.members.autocomplete', roomId, debouncedFilter],
		queryFn: async () => {
			try {
				// Try channels.members first (for public channels)
				let members;
				try {
					const channelMembers = await getRoomMembers({
						roomId,
						filter: debouncedFilter,
						count: 25,
					});
					members = channelMembers.members;
				} catch {
					// If channels.members fails, try groups.members (for private groups/DMs)
					const groupMembers = await getGroupMembers({
						roomId,
						filter: debouncedFilter,
						count: 25,
					});
					members = groupMembers.members;
				}

				const options = members
					.filter((member: any) => {
						const searchTerm = debouncedFilter.toLowerCase();
						return (
							member.username?.toLowerCase().includes(searchTerm) ||
							member.name?.toLowerCase().includes(searchTerm)
						);
					})
					.map((member: any): [string, UserAutoCompleteOptionType] => [
						member.username,
						{
							_id: member._id,
							name: member.name || member.username,
							username: member.username,
							_federated: member.federated,
						},
					]);

				// Add extra option if filter text matches `username:server`
				// Used to add federated users that do not exist yet
				if (matrixRegex.test(debouncedFilter)) {
					const federatedUser = {
						_id: debouncedFilter,
						name: debouncedFilter,
						username: debouncedFilter,
						_federated: true,
					};
					options.unshift([debouncedFilter, federatedUser]);
				}

				return options;
			} catch (error) {
				console.error('Failed to fetch room members:', error);
				return [];
			}
		},
		placeholderData: keepPreviousData,
		enabled: !!roomId,
	});

	const options = useMemo(() => data || [], [data]);

	const onAddUser = useCallback(
		(username: string): void => {
			const user = options.find(([val]) => val === username)?.[1];
			if (!user) {
				console.error('UserAutoCompleteRoom - onAddSelected - failed to cache option:', username);
				return;
			}
			setSelectedCache((prevCache) => ({ ...prevCache, [username]: user }));
		},
		[setSelectedCache, options],
	);

	const onRemoveUser = useCallback(
		(username: string): void =>
			setSelectedCache((prevCache) => {
				const newCache = { ...prevCache };
				delete newCache[username];
				return newCache;
			}),
		[setSelectedCache],
	);

	const handleOnChange = useCallback(
		(selectedUsernames: string[]) => {
			const selectedUsers = selectedUsernames
				.map((username) => {
					return selectedCache[username] || options.find(([, user]) => user.username === username)?.[1];
				})
				.filter(Boolean) as UserAutoCompleteOptionType[];

			const filteredUsers = selectedUsers.map(({ _id, username }) => ({
				_id,
				username,
			}));
			onChange(filteredUsers);

			const currentValues = value.map((user) => user.username);
			const newAddedUsername = selectedUsernames.filter((username) => !currentValues.includes(username))[0];
			const removedUsername = currentValues.filter((username) => !selectedUsernames.includes(username))[0];

			setFilter('');
			newAddedUsername && onAddUser(newAddedUsername);
			removedUsername && onRemoveUser(removedUsername);
		},
		[onChange, value, options, selectedCache, onAddUser, onRemoveUser],
	);

	const usernames = useMemo(() => value?.map((user) => user.username) ?? [], [value]);

	return (
		<OptionsContext.Provider value={{ options: options as unknown as OptionType[] }}>
			<MultiSelectFiltered
				{...props}
				placeholder={placeholder}
				value={usernames}
				onChange={handleOnChange}
				filter={filter}
				setFilter={setFilter}
				renderSelected={({ value: username, onMouseDown }) => {
					const currentCachedOption = selectedCache[username] || {};
					return (
						<Chip key={username} height='x20' onMouseDown={onMouseDown} mie={4} mb={2}>
							{currentCachedOption._federated ? <Icon size='x20' name='globe' /> : <UserAvatar size='x20' username={username} />}
							<Box is='span' margin='none' mis={4}>
								{currentCachedOption.name || currentCachedOption.username || username}
							</Box>
						</Chip>
					);
				}}
				renderOptions={AutocompleteOptions}
				options={options.concat(Object.entries(selectedCache)).map(([, item]) => [item.username, item.name || item.username])}
			/>
		</OptionsContext.Provider>
	);
};

export default memo(UserAutoCompleteWithObjectsRoom);