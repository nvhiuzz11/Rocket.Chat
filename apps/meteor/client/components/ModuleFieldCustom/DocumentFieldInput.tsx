import { Select, TextInput, InputBox, Box, Icon, CheckBox, MultiSelect, AutoComplete, Option, Chip } from '@rocket.chat/fuselage';
import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import { RoomAvatar } from '@rocket.chat/ui-avatar';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { MODULE_FIELD_TYPES } from '../../../definition/IModuleConfig';
import type { IFieldDefinition } from '../../../server/core-typings/IFieldDefinition';
import UserAutoCompleteWithObjectsRoom from '../UserAutoCompleteMultiple/UserAutoCompleteWithObjectsRoom';

interface IDocumentFieldInputProps {
	field: IFieldDefinition & {
		options?: { _id: string; value: string; color?: string; order?: number }[];
	};
	value: any;
	onChange: (value: any) => void;
	placeholder?: string;
	roomId?: string;
}

// Channel selector component that stores full channel info
const ChannelSelector = ({ value, onChange, placeholder }: { value: any; onChange: (value: any) => void; placeholder?: string }) => {
	const [filter, setFilter] = useState('');
	const filterDebounced = useDebouncedValue(filter, 300);
	const autocomplete = useEndpoint('GET', '/v1/rooms.autocomplete.channelAndPrivate');

	const result = useQuery({
		queryKey: ['rooms.autocomplete.channelAndPrivate', filterDebounced],
		queryFn: () => autocomplete({ selector: JSON.stringify({ name: filterDebounced }) }),
		placeholderData: keepPreviousData,
	});

	const options = useMemo(
		() =>
			result.isSuccess
				? result.data.items.map(({ fname, name, _id, avatarETag, t }) => ({
						value: _id,
						label: { name: fname || name, avatarETag, type: t },
					}))
				: [],
		[result.data?.items, result.isSuccess],
	);

	// Convert stored value to format expected by AutoComplete
	const selectedValue = useMemo(() => {
		if (!value) return [];
		// Handle both array and single values, ensure we work with channel IDs
		const channels = Array.isArray(value) ? value : [value];
		return channels.filter(Boolean);
	}, [value]);

	const handleChange = (selectedValue: string | string[]) => {
		const selectedIds = Array.isArray(selectedValue) ? selectedValue : [selectedValue];

		if (!selectedIds || selectedIds.length === 0) {
			onChange([]);
			return;
		}

		// Only store channel IDs, not the full objects
		// This prevents stale data when channel type changes
		onChange(selectedIds);
	};

	if (result.isPending && !value) {
		return <TextInput placeholder={placeholder} disabled />;
	}

	return (
		<AutoComplete
			value={selectedValue}
			onChange={handleChange}
			filter={filter}
			setFilter={setFilter}
			multiple
			placeholder={placeholder}
			renderSelected={({ selected, onRemove, ...props }) => {
				// selected is the channel ID
				const selectedId = typeof selected === 'object' ? selected.value : selected;

				// Find the channel info from options (these are fresh from API)
				const option = options.find((opt) => opt.value === selectedId);
				const channelName = option?.label.name || selectedId;
				const channelType = option?.label.type || 'c';

				return (
					<Chip {...props} key={selectedId} value={selectedId} onClick={onRemove}>
						<RoomAvatar size='x20' room={{ type: channelType, _id: selectedId }} />
						<Box is='span' margin='none' mis={4}>
							{channelName}
						</Box>
					</Chip>
				);
			}}
			renderItem={({ value, label, ...props }) => (
				<Option
					key={value}
					{...props}
					label={typeof label === 'object' ? label.name : label}
					avatar={<RoomAvatar size='x20' room={{ type: typeof label === 'object' ? label.type || 'c' : 'c', _id: value }} />}
				/>
			)}
			options={options}
		/>
	);
};

// eslint-disable-next-line react/no-multi-comp
export const DocumentFieldInput = ({ field, value, onChange, placeholder, roomId }: IDocumentFieldInputProps) => {
	const { t } = useTranslation();

	const selectOptions = useMemo(
		() =>
			field.options
				?.sort((a: any, b: any) => (a.order || 0) - (b.order || 0))
				?.map((option: any) => [option._id, option.value] as [string, string]) ?? [],
		[field.options],
	);

	const defaultPlaceholder = placeholder || `${t('Enter')} ${field.name}`;

	switch (field.type) {
		case MODULE_FIELD_TYPES.TEXT:
			return (
				<TextInput
					value={value || ''}
					onChange={(e) => onChange((e.target as HTMLInputElement).value)}
					placeholder={defaultPlaceholder}
					required={field.isRequired}
					width='100%'
				/>
			);

		case MODULE_FIELD_TYPES.TEXTAREA:
			return (
				<TextInput
					value={value || ''}
					onChange={(e) => onChange((e.target as HTMLInputElement).value)}
					placeholder={defaultPlaceholder}
					required={field.isRequired}
					width='100%'
					// For now using TextInput, could be enhanced with Textarea component
				/>
			);

		case MODULE_FIELD_TYPES.NUMBER:
			return (
				<InputBox
					type='number'
					value={value || ''}
					onChange={(e) => onChange(Number((e.target as HTMLInputElement).value) || '')}
					placeholder={defaultPlaceholder}
					required={field.isRequired}
					width='100%'
				/>
			);

		case MODULE_FIELD_TYPES.SELECT:
			return (
				<Select
					placeholder={`${t('Select')} ${field.name}...`}
					value={value || ''}
					onChange={(selectedValue) => onChange(String(selectedValue))}
					options={selectOptions}
					required={field.isRequired}
					width='100%'
				/>
			);

		case MODULE_FIELD_TYPES.MULTI_SELECT:
			return (
				<MultiSelect
					placeholder={`${t('Select')} ${field.name}...`}
					value={value as string[]}
					onChange={(selectedValues) => onChange(selectedValues)}
					options={selectOptions}
					required={field.isRequired}
					width='100%'
				/>
			);

		case MODULE_FIELD_TYPES.CHECKBOX:
			return (
				<Box display='flex' alignItems='center'>
					<CheckBox checked={!!value} onChange={(checked) => onChange(checked)} required={field.isRequired} />
					<Box marginInlineStart='x8' fontSize='p2'>
						{field.name}
					</Box>
				</Box>
			);

		case MODULE_FIELD_TYPES.DATE:
			return (
				<InputBox
					type='date'
					value={value ? (value instanceof Date ? value.toISOString().split('T')[0] : new Date(value).toISOString().split('T')[0]) : ''}
					onChange={(e) => {
						const inputValue = (e.target as HTMLInputElement).value;
						onChange(inputValue ? new Date(inputValue) : '');
					}}
					required={field.isRequired}
				/>
			);

		case MODULE_FIELD_TYPES.USER:
			// UserAutoCompleteWithObjectsRoom always expects array and returns array
			// Convert single user object to array format
			let userValue: { _id: string; username: string }[] = [];
			if (Array.isArray(value)) {
				userValue = value;
			} else if (value && typeof value === 'object' && value._id && value.username) {
				userValue = [value];
			}

			return (
				<UserAutoCompleteWithObjectsRoom
					width='100%'
					value={userValue}
					onChange={(newValue) => {
						// Support multiple user selection - store the array
						onChange(newValue && newValue.length > 0 ? newValue : null);
					}}
					roomId={roomId || ''}
					placeholder={`${t('Select')} ${t('user')}`}
				/>
			);

		case MODULE_FIELD_TYPES.CHANNEL:
			return <ChannelSelector value={value} onChange={onChange} placeholder={`${t('Select')} ${t('channel')}`} />;

		default:
			return (
				<TextInput
					value={value || ''}
					onChange={(e) => onChange((e.target as HTMLInputElement).value)}
					placeholder={defaultPlaceholder}
					required={field.isRequired}
					width='100%'
				/>
			);
	}
};
