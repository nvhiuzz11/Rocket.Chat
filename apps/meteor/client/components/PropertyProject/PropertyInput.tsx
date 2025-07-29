import { Select, MultiSelect } from '@rocket.chat/fuselage';
import React, { useMemo } from 'react';

import { PROJECT_PROPERTY_TYPES } from '../../../definition/project';
import type { IProjectProperty } from '../../../server/core-typings/IProjectProperty';

interface IPropertyInputProps {
	property: IProjectProperty & {
		value?: { _id: string; name: string }[];
	};
	value: string | string[];
	onChange: (value: string | string[]) => void;
}

export const PropertyInput = ({ property, value, onChange }: IPropertyInputProps) => {
	const options = useMemo(() => property.value?.map((tag) => [tag._id, tag.name] as [string, string]) ?? [], [property.value]);

	if (property.type === PROJECT_PROPERTY_TYPES.SELECT) {
		return (
			<Select
				placeholder={`Select ${property.name}...`}
				value={value as string}
				onChange={(selectedValue) => onChange(String(selectedValue))}
				options={options}
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
			/>
		);
	}

	return null;
};

// <FieldRow>
//                         <Select
//                             disabled={state === AsyncStatePhase.LOADING || agent === ''}
//                             options={availableExtensions?.extensions?.map((extension) => [extension, extension]) || []}
//                             value={extension}
//                             placeholder={t('Select_an_option')}
//                             onChange={(value) => setExtension(String(value))}
//                         />
//                     </FieldRow>

// <FieldRow>
// 										<Controller
// 											control={control}
// 											name='systemMessages'
// 											render={({ field }) => (
// 												<MultiSelect
// 													{...field}
// 													options={sysMesOptions}
// 													disabled={!hideSysMes || isFederated}
// 													placeholder={t('Select_messages_to_hide')}
// 												/>
// 											)}
// 										/>
// 									</FieldRow>
