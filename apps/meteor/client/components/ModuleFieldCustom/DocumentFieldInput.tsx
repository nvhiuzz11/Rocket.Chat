import { Select, TextInput, InputBox, Box, Icon, CheckBox, MultiSelect } from '@rocket.chat/fuselage';
import { useMemo } from 'react';
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
