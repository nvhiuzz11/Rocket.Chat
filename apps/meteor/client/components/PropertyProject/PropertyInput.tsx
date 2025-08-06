import { Select, MultiSelect } from '@rocket.chat/fuselage';
import { useMemo } from 'react';

import { PROJECT_PROPERTY_TYPES } from '../../../definition/project';

interface IPropertyInputProps {
	property: any & {
		value?: { _id: string; value: string }[];
	};
	value: string | string[];
	onChange: (value: string | string[]) => void;
}

export const PropertyInput = ({ property, value, onChange }: IPropertyInputProps) => {
	const options = useMemo(() => property.value?.map((tag: any) => [tag._id, tag.value] as [string, string]) ?? [], [property.value]);

	if (property.type === PROJECT_PROPERTY_TYPES.SELECT) {
		return (
			<Select
				placeholder={`Select ${property.name}...`}
				value={value as string}
				onChange={(selectedValue) => onChange(String(selectedValue))}
				options={options}
				required={property.required}
			/>
		);
	}

	if (property.type === PROJECT_PROPERTY_TYPES.MULTI_SELECT) {
		return (
			<MultiSelect
				placeholder={`Select ${property.name}...`}
				value={value as string[]}
				onChange={(selectedValues) => onChange(selectedValues)}
				options={options}
				required={property.required}
			/>
		);
	}

	return null;
};
