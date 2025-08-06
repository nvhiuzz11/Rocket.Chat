import type { OptionType } from '@rocket.chat/fuselage';
import { MultiSelectFiltered, Box, Chip } from '@rocket.chat/fuselage';
import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import { UserAvatar } from '@rocket.chat/ui-avatar';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { ReactElement, AllHTMLAttributes } from 'react';
import { memo, useState, useCallback, useMemo } from 'react';

import AutocompleteOptions, { OptionsContext } from './UserAutoCompleteMultipleOptions';

type UserAutoCompleteMultipleProjectMembersProps = {
	onChange: (value: Array<string>) => void;
	value: Array<string>;
	placeholder?: string;
	teamId: string;
} & Omit<AllHTMLAttributes<HTMLElement>, 'is' | 'onChange'>;

type UserAutoCompleteOptionType = {
	_id: string;
	name?: string;
	username: string;
};

const UserAutoCompleteMultipleProjectMembers = ({
	onChange,
	value,
	placeholder,
	teamId,
	...props
}: UserAutoCompleteMultipleProjectMembersProps): ReactElement => {
	const [filter, setFilter] = useState('');
	const [selectedCache, setSelectedCache] = useState<Record<string, UserAutoCompleteOptionType>>({});

	const debouncedFilter = useDebouncedValue(filter, 500);
	const getTeamMembers = useEndpoint('GET', '/v1/teams.members');

	const { data } = useQuery({
		queryKey: ['teams.members.projectautocomplete', teamId],
		queryFn: async () => {
			const members = await getTeamMembers({
				teamId,
			});

			// Process and deduplicate members by _id - no filtering here, do it in useMemo
			const memberMap = new Map<string, UserAutoCompleteOptionType>();

			members.members.forEach((member: any) => {
				const userId = member.user._id;
				const userData = {
					_id: userId,
					username: member.user.username,
					name: member.user.name,
				};

				// Only add if not already in map (deduplication by _id)
				if (!memberMap.has(userId)) {
					memberMap.set(userId, userData);
				}
			});

			return Array.from(memberMap.values());
		},
		placeholderData: keepPreviousData,
		enabled: !!teamId,
	});

	const options = useMemo(() => data || [], [data]);

	const onAddUser = useCallback(
		(userId: string): void => {
			const user = options.find((u) => u._id === userId);
			if (!user) {
				throw new Error('UserAutoCompleteMultipleProjectMembers - onAddSelected - failed to cache option');
			}
			setSelectedCache((selectedCache) => ({ ...selectedCache, [userId]: user }));
		},
		[setSelectedCache, options],
	);

	const onRemoveUser = useCallback(
		(userId: string): void =>
			setSelectedCache((selectedCache) => {
				const users = { ...selectedCache };
				delete users[userId];
				return users;
			}),
		[setSelectedCache],
	);

	const handleOnChange = useCallback(
		(userIds: string[]) => {
			onChange(userIds);
			const newAddedUserId = userIds.filter((userId) => !value.includes(userId))[0];
			const removedUserId = value.filter((userId) => !userIds.includes(userId))[0];
			setFilter('');
			newAddedUserId && onAddUser(newAddedUserId);
			removedUserId && onRemoveUser(removedUserId);
		},
		[onChange, setFilter, onAddUser, onRemoveUser, value],
	);

	// Combine options and selectedCache for display, avoiding duplicates
	const combinedOptions = useMemo(() => {
		const optionMap = new Map<string, UserAutoCompleteOptionType>();

		// Add current options with client-side filtering
		options
			.filter((user) => {
				if (!debouncedFilter) return true;
				const filterLower = debouncedFilter.toLowerCase();
				return user.username.toLowerCase().includes(filterLower) || user.name?.toLowerCase().includes(filterLower);
			})
			.forEach((user) => {
				optionMap.set(user._id, user);
			});

		// Add selected cache (for users that might not be in current query results)
		Object.values(selectedCache).forEach((user) => {
			if (!optionMap.has(user._id)) {
				optionMap.set(user._id, user);
			}
		});

		return Array.from(optionMap.values()).map((user) => ({
			...user,
			displayName: user.name || user.username,
		}));
	}, [options, selectedCache, debouncedFilter]);

	return (
		<OptionsContext.Provider
			value={{
				options: combinedOptions.map((user) => [
					user._id,
					{
						username: user.username,
						name: user.name,
						_federated: false,
					},
				]) as unknown as OptionType[],
			}}
		>
			<MultiSelectFiltered
				{...props}
				data-qa-type='user-auto-complete-input'
				placeholder={placeholder}
				value={value}
				onChange={handleOnChange}
				filter={filter}
				setFilter={setFilter}
				renderSelected={({ value, onMouseDown }: { value: string; onMouseDown: () => void }) => {
					const currentCachedOption = selectedCache[value] || options.find((u) => u._id === value) || {};

					return (
						<Chip key={value} height='x20' onMouseDown={onMouseDown} mie={4} mb={2}>
							<UserAvatar size='x20' userId={value} />
							<Box is='span' margin='none' mis={4}>
								{currentCachedOption.name || currentCachedOption.username || value}
							</Box>
						</Chip>
					);
				}}
				renderOptions={AutocompleteOptions}
				options={combinedOptions.map((user) => [user._id, user.displayName])}
				data-qa='project-members-autocomplete'
			/>
		</OptionsContext.Provider>
	);
};

export default memo(UserAutoCompleteMultipleProjectMembers);