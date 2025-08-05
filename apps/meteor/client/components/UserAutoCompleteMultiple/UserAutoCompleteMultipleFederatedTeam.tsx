import type { OptionType } from '@rocket.chat/fuselage';
import { MultiSelectFiltered, Icon, Box, Chip } from '@rocket.chat/fuselage';
import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import { UserAvatar } from '@rocket.chat/ui-avatar';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { ReactElement, AllHTMLAttributes } from 'react';
import { memo, useState, useCallback, useMemo } from 'react';

import AutocompleteOptions, { OptionsContext } from './UserAutoCompleteMultipleOptions';

type UserAutoCompleteMultipleFederatedTeamProps = {
	onChange: (value: Array<string>) => void;
	value: Array<string>;
	placeholder?: string;
	teamId: string;
} & Omit<AllHTMLAttributes<HTMLElement>, 'is' | 'onChange'>;

type UserAutoCompleteOptionType = {
	name: string;
	username: string;
	_federated?: boolean;
};

type UserAutoCompleteOptions = {
	[k: string]: UserAutoCompleteOptionType;
};

const matrixRegex = new RegExp('@(.*:.*)');

const UserAutoCompleteMultipleFederatedTeam = ({
	onChange,
	value,
	placeholder,
	teamId,
	...props
}: UserAutoCompleteMultipleFederatedTeamProps): ReactElement => {
	const [filter, setFilter] = useState('');
	const [selectedCache, setSelectedCache] = useState<UserAutoCompleteOptions>({});

	const debouncedFilter = useDebouncedValue(filter, 500);
	const getTeamMembers = useEndpoint('GET', '/v1/teams.members');

	const { data } = useQuery({
		queryKey: ['teams.members.autocomplete', teamId, debouncedFilter],

		queryFn: async () => {
			const members = await getTeamMembers({ 
				teamId, 
				filter: debouncedFilter,
				type: 'all'
			});
			
			const options = members.members
				.filter((member: any) => 
					member.user.username.toLowerCase().includes(debouncedFilter.toLowerCase()) ||
					member.user.name?.toLowerCase().includes(debouncedFilter.toLowerCase())
				)
				.map((member: any): [string, UserAutoCompleteOptionType] => [
					member.user.username, 
					{
						name: member.user.name || member.user.username,
						username: member.user.username,
						_federated: member.user.federated
					}
				]);

			// Add extra option if filter text matches `username:server`
			// Used to add federated users that do not exist yet
			if (matrixRegex.test(debouncedFilter)) {
				options.unshift([debouncedFilter, { name: debouncedFilter, username: debouncedFilter, _federated: true }]);
			}

			return options;
		},

		placeholderData: keepPreviousData,
		enabled: !!teamId,
	});

	const options = useMemo(() => data || [], [data]);

	const onAddUser = useCallback(
		(username: string): void => {
			const user = options.find(([val]) => val === username)?.[1];
			if (!user) {
				throw new Error('UserAutoCompleteMultipleTeam - onAddSelected - failed to cache option');
			}
			setSelectedCache((selectedCache) => ({ ...selectedCache, [username]: user }));
		},
		[setSelectedCache, options],
	);

	const onRemoveUser = useCallback(
		(username: string): void =>
			setSelectedCache((selectedCache) => {
				const users = { ...selectedCache };
				delete users[username];
				return users;
			}),
		[setSelectedCache],
	);

	const handleOnChange = useCallback(
		(usernames: string[]) => {
			onChange(usernames);
			const newAddedUsername = usernames.filter((username) => !value.includes(username))[0];
			const removedUsername = value.filter((username) => !usernames.includes(username))[0];
			setFilter('');
			newAddedUsername && onAddUser(newAddedUsername);
			removedUsername && onRemoveUser(removedUsername);
		},
		[onChange, setFilter, onAddUser, onRemoveUser, value],
	);

	return (
		<OptionsContext.Provider value={{ options: options as unknown as OptionType[] }}>
			<MultiSelectFiltered
				{...props}
				data-qa-type='user-auto-complete-input'
				placeholder={placeholder}
				value={value}
				onChange={handleOnChange}
				filter={filter}
				setFilter={setFilter}
				renderSelected={({ value, onMouseDown }: { value: string; onMouseDown: () => void }) => {
					const currentCachedOption = selectedCache[value] || {};

					return (
						<Chip key={value} height='x20' onMouseDown={onMouseDown} mie={4} mb={2}>
							{currentCachedOption._federated ? <Icon size='x20' name='globe' /> : <UserAvatar size='x20' username={value} />}
							<Box is='span' margin='none' mis={4}>
								{currentCachedOption.name || currentCachedOption.username || value}
							</Box>
						</Chip>
					);
				}}
				renderOptions={AutocompleteOptions}
				options={options.concat(Object.entries(selectedCache)).map(([, item]) => [item.username, item.name || item.username])}
				data-qa='create-channel-users-autocomplete'
			/>
		</OptionsContext.Provider>
	);
};

export default memo(UserAutoCompleteMultipleFederatedTeam);