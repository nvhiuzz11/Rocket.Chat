import {
	Box,
	Button,
	TextInput,
	Field,
	FieldGroup,
	FieldLabel,
	FieldRow,
	FieldError,
	Select,
	Icon,
	CheckBox,
	Divider,
} from '@rocket.chat/fuselage';
import { useEndpoint, useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { useTranslation } from 'react-i18next';
import { useState, useEffect, useRef } from 'react';
import type { ReactElement } from 'react';
import { HexColorPicker } from 'react-colorful';
import { useForm, Controller } from 'react-hook-form';

import { MODULE_FIELD_TYPES } from '../../../definition/IModuleConfig';
import type { IFieldDefinition } from '../../../server/core-typings/IFieldDefinition';
import type { IFieldOption } from '../../../server/core-typings/IFieldOption';

type FieldSettingsPanelProps = {
	onClose: () => void;
	field: IFieldDefinition;
	moduleId: string;
	reload: () => void;
	isNewField?: boolean;
};

type FieldFormData = {
	name: string;
	type: string;
	isRequired: boolean;
};

type OptionFormData = {
	value: string;
	color: string;
};

const FieldSettingsPanel = ({ onClose, field, moduleId, reload, isNewField = false }: FieldSettingsPanelProps): ReactElement => {
	const { t } = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();
	const [isLoading, setIsLoading] = useState(false);
	const [options, setOptions] = useState<IFieldOption[]>(field.options || []);
	const [newOption, setNewOption] = useState<OptionFormData>({ value: '', color: '#3498db' });
	const [editingOption, setEditingOption] = useState<string | null>(null);
	const [editingOptionData, setEditingOptionData] = useState<{ value: string; color: string }>({ value: '', color: '' });
	const [showColorPicker, setShowColorPicker] = useState<string | null>(null);
	const [tempColors, setTempColors] = useState<{ [optionId: string]: string }>({});
	const [draggedOption, setDraggedOption] = useState<string | null>(null);
	const [hoveredOption, setHoveredOption] = useState<string | null>(null);
	const [deleteConfirmation, setDeleteConfirmation] = useState<{ optionId: string; optionValue: string } | null>(null);
	const [deleteFieldConfirmation, setDeleteFieldConfirmation] = useState<{ fieldId: string; fieldName: string } | null>(null);
	const colorPickerRef = useRef<HTMLDivElement>(null);

	const createFieldEndpoint = useEndpoint('POST', '/v1/modules.fields.create');
	const updateFieldEndpoint = useEndpoint('POST', '/v1/modules.fields.update');
	const deleteFieldEndpoint = useEndpoint('POST', '/v1/modules.fields.delete');
	const createOptionEndpoint = useEndpoint('POST', '/v1/modules.field-options.create');
	const updateOptionEndpoint = useEndpoint('POST', '/v1/modules.field-options.update');
	const deleteOptionEndpoint = useEndpoint('POST', '/v1/modules.field-options.delete');
	const updateOptionOrderEndpoint = useEndpoint('POST', '/v1/modules.field-options.updateOrder');

	const {
		handleSubmit,
		control,
		setValue,
		unregister,
		formState: { errors },
	} = useForm<FieldFormData>({
		defaultValues: {
			name: field.name || '',
			type: field.type || MODULE_FIELD_TYPES.TEXT,
			isRequired: field.isRequired || false,
		},
	});

	// Reset form and options when field changes
	useEffect(() => {
		// Unregister and re-register the name field to force update
		unregister('name');
		setValue('name', field.name || '');
		setValue('type', field.type || MODULE_FIELD_TYPES.TEXT);
		setValue('isRequired', field.isRequired || false);

		setOptions(field.options || []);
		setNewOption({ value: '', color: '#3498db' });
		setEditingOption(null);
		setShowColorPicker(null);
	}, [field, setValue, unregister]);

	// Handle click outside color picker to close it and save color
	useEffect(() => {
		const handleClickOutside = async (event: MouseEvent) => {
			if (colorPickerRef.current && !colorPickerRef.current.contains(event.target as Node)) {
				// Save color if there's a temp color for the current picker
				if (showColorPicker) {
					const optionId = showColorPicker.replace('view-', '');
					if (tempColors[optionId]) {
						await handleUpdateOptionColor(optionId, tempColors[optionId]);
						// Clear temp color after saving
						setTempColors((prev) => {
							const newTemp = { ...prev };
							delete newTemp[optionId];
							return newTemp;
						});
					}
				}
				setShowColorPicker(null);
			}
		};

		if (showColorPicker) {
			document.addEventListener('mousedown', handleClickOutside);
			return () => {
				document.removeEventListener('mousedown', handleClickOutside);
			};
		}
	}, [showColorPicker, tempColors]);

	const fieldTypeOptions = [
		[MODULE_FIELD_TYPES.TEXT, 'Text'],
		[MODULE_FIELD_TYPES.TEXTAREA, 'Textarea'],
		[MODULE_FIELD_TYPES.NUMBER, 'Number'],
		[MODULE_FIELD_TYPES.SELECT, 'Single Select'],
		[MODULE_FIELD_TYPES.MULTI_SELECT, 'Multi Select'],
		[MODULE_FIELD_TYPES.CHECKBOX, 'Checkbox'],
		[MODULE_FIELD_TYPES.DATE, 'Date'],
		[MODULE_FIELD_TYPES.USER, 'User'],
	];

	const colorOptions = ['#3498db', '#e74c3c', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c', '#e67e22', '#34495e', '#e91e63', '#9c27b0'];

	const handleSaveField = async (data: FieldFormData) => {
		setIsLoading(true);
		try {
			if (isNewField) {
				await createFieldEndpoint({
					...data,
					moduleId,
					order: 0,
				});

				await reload();
				dispatchToastMessage({ type: 'success', message: t('Field_created_successfully') });
				onClose();
			} else {
				await updateFieldEndpoint({
					_id: field._id,
					data: data,
				});

				await reload();
				dispatchToastMessage({ type: 'success', message: t('Field_updated_successfully') });
			}
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: String(error) });
		} finally {
			setIsLoading(false);
		}
	};

	const handleDeleteField = () => {
		setDeleteFieldConfirmation({ fieldId: field._id, fieldName: field.name });
	};

	const handleConfirmDeleteField = async () => {
		if (!deleteFieldConfirmation) return;

		setIsLoading(true);
		try {
			await deleteFieldEndpoint({ _id: deleteFieldConfirmation.fieldId });
			dispatchToastMessage({ type: 'success', message: t('Field_deleted_successfully') });
			await reload();
			onClose();
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: String(error) });
		} finally {
			setIsLoading(false);
			setDeleteFieldConfirmation(null);
		}
	};

	const handleCancelDeleteField = () => {
		setDeleteFieldConfirmation(null);
	};

	const handleAddOption = async () => {
		if (!newOption.value.trim()) return;

		setIsLoading(true);
		try {
			await createOptionEndpoint({
				value: newOption.value,
				color: newOption.color,
				fieldId: field._id,
				order: options.length,
			});

			await reload();
			setNewOption({ value: '', color: '#3498db' });
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: String(error) });
		} finally {
			setIsLoading(false);
		}
	};

	const handleStartEditOption = (option: IFieldOption) => {
		setEditingOption(option._id);
		setEditingOptionData({ value: option.value, color: option.color || '#3498db' });
	};

	const handleSaveOptionEdit = async (optionId: string) => {
		if (!editingOptionData.value.trim()) return;

		setIsLoading(true);
		try {
			await updateOptionEndpoint({
				_id: optionId,
				data: {
					value: editingOptionData.value,
					color: editingOptionData.color,
				},
			});

			// Update local state after successful API call
			await reload();
			setEditingOption(null);
			dispatchToastMessage({ type: 'success', message: t('Option_updated_successfully') });
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: String(error) });
		} finally {
			setIsLoading(false);
		}
	};

	const handleCancelOptionEdit = () => {
		setEditingOption(null);
		setEditingOptionData({ value: '', color: '' });
	};

	const handleUpdateOptionColor = async (optionId: string, color: string) => {
		try {
			await updateOptionEndpoint({
				_id: optionId,
				data: { color },
			});

			await reload();
			dispatchToastMessage({ type: 'success', message: t('Option_color_updated_successfully') });
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: String(error) });
		}
	};

	const handleDeleteOption = (optionId: string, optionValue: string) => {
		setDeleteConfirmation({ optionId, optionValue });
	};

	const handleConfirmDelete = async () => {
		if (!deleteConfirmation) return;

		setIsLoading(true);
		try {
			await deleteOptionEndpoint({ _id: deleteConfirmation.optionId });
			// Remove option from local state immediately
			setOptions(options.filter((option) => option._id !== deleteConfirmation.optionId));
			dispatchToastMessage({ type: 'success', message: t('Option_deleted_successfully') });
			// Call reload to sync parent state
			if (reload) {
				reload();
			}
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: String(error) });
		} finally {
			setIsLoading(false);
			setDeleteConfirmation(null);
		}
	};

	const handleCancelDelete = () => {
		setDeleteConfirmation(null);
	};

	const handleDragStart = (e: React.DragEvent, optionId: string) => {
		setDraggedOption(optionId);
		e.dataTransfer.effectAllowed = 'move';
	};

	const handleDragOver = (e: React.DragEvent) => {
		e.preventDefault();
		e.dataTransfer.dropEffect = 'move';
	};

	const handleDragEnd = () => {
		setDraggedOption(null);
		setHoveredOption(null);
	};

	const handleDrop = async (e: React.DragEvent, targetOptionId: string) => {
		e.preventDefault();

		if (!draggedOption || draggedOption === targetOptionId) return;

		const draggedIndex = options.findIndex((option) => option._id === draggedOption);
		const targetIndex = options.findIndex((option) => option._id === targetOptionId);

		if (draggedIndex === -1 || targetIndex === -1) return;

		const newOptions = [...options];
		const [draggedItem] = newOptions.splice(draggedIndex, 1);
		newOptions.splice(targetIndex, 0, draggedItem);

		// Update order property for all options
		const updatedOptions = newOptions.map((option, index) => ({
			...option,
			order: index,
		}));

		setOptions(updatedOptions);
		setDraggedOption(null);

		// Update orders on server
		try {
			await updateOptionOrderEndpoint({
				options: updatedOptions.map((option) => ({ _id: option._id, order: option.order })),
			});
			await reload();
		} catch (error) {
			// Revert local state on error
			setOptions(options);
			dispatchToastMessage({ type: 'error', message: t('Failed_to_update_option_order') });
		}
	};

	const needsOptions = field.type === MODULE_FIELD_TYPES.SELECT || field.type === MODULE_FIELD_TYPES.MULTI_SELECT;

	return (
		<>
			<Box key={field._id} height='100%' bg='surface-room' display='flex' flexDirection='column'>
				{/* Header */}
				<Box p='x20' display='flex' alignItems='center' justifyContent='space-between'>
					<Box>
						<Box fontWeight='600' fontSize='h4' color='font-titles-labels'>
							{isNewField ? t('Create_Field') : t('Edit_Field')}
						</Box>
						<Box fontSize='c1' color='font-hint' marginBlockStart='x2'>
							{isNewField ? t('Configure_a_new_module_field') : `${t('Configure')} "${field.name}" ${t('field')}`}
						</Box>
					</Box>
					<Button square small onClick={onClose}>
						<Icon name='cross' size='x20' />
					</Button>
				</Box>
				<Divider />

				{/* Content */}
				<Box flexGrow={1} overflow='auto'>
					<Box p='x16'>
						<FieldGroup key={field._id}>
							<Field>
								<FieldLabel>{t('Field_Name')}*</FieldLabel>
								<FieldRow>
									<Controller
										name='name'
										control={control}
										rules={{ required: true }}
										render={({ field: { onChange, value } }) => (
											<TextInput
												key={`name-${field._id}`}
												value={value || ''}
												onChange={(e) => onChange((e.target as HTMLInputElement).value)}
												placeholder={t('Enter_field_name')}
											/>
										)}
									/>
								</FieldRow>
								{errors.name && <FieldError>{t('Field_name_is_required')}</FieldError>}
							</Field>

							<Field>
								<FieldLabel>{t('Field_Type')}*</FieldLabel>
								<FieldRow>
									<Controller
										name='type'
										control={control}
										render={({ field: { onChange, value } }) => <Select value={value} onChange={onChange} options={fieldTypeOptions} />}
									/>
								</FieldRow>
							</Field>

							<Field>
								<FieldLabel>
									<Box is='label' display='flex' alignItems='center'>
										<Controller
											name='isRequired'
											control={control}
											render={({ field: { onChange, value } }) => <CheckBox checked={value} onChange={onChange} />}
										/>
										<Box mis='x8'>{t('Required_Field')}</Box>
									</Box>
								</FieldLabel>
							</Field>

							{!isNewField && needsOptions && (
								<>
									<Box marginBlockStart='x16' marginBlockEnd='x12'>
										<Box fontSize='h5' fontWeight='600' color='font-titles-labels' marginBlockEnd='x4'>
											{t('Options_Management')}
										</Box>
										<Box fontSize='c1' color='font-hint'>
											{t('Create_and_manage_options_for_this_field')}
										</Box>
									</Box>

									{options.length > 0 && (
										<Box p='x12' bg='surface-tint' borderRadius='x4' marginBlockStart='x2'>
											<Box fontSize='c2' fontWeight='600' color='font-secondary-info' marginBlockEnd='x8' textTransform='uppercase'>
												{t('Existing_Options')}
											</Box>
											<Box display='flex' flexDirection='column'>
												{options
													.sort((a, b) => a.order - b.order)
													.map((option) => (
														<Box
															key={option._id}
															display='flex'
															alignItems='center'
															justifyContent='space-between'
															p='x8'
															bg={draggedOption === option._id ? 'surface-selected' : 'surface-light'}
															borderRadius='x2'
															marginBlockEnd='x4'
															draggable
															onDragStart={(e) => handleDragStart(e, option._id)}
															onDragOver={handleDragOver}
															onDragEnd={handleDragEnd}
															onDrop={(e) => handleDrop(e, option._id)}
															onMouseEnter={() => setHoveredOption(option._id)}
															onMouseLeave={() => setHoveredOption(null)}
															style={{
																cursor: draggedOption === option._id ? 'grabbing' : 'grab',
																opacity: draggedOption === option._id ? 0.6 : 1,
																transform:
																	draggedOption === option._id
																		? 'rotate(0.5deg) scale(1.05)'
																		: hoveredOption === option._id
																			? 'rotate(0.2deg) scale(1.01)'
																			: 'none',
																transition: 'all 0.2s ease',
																boxShadow:
																	draggedOption === option._id
																		? '0 4px 12px rgba(0, 0, 0, 0.15)'
																		: hoveredOption === option._id
																			? '0 2px 6px rgba(0, 0, 0, 0.08)'
																			: 'none',
															}}
															border={draggedOption === option._id ? '2px solid' : '1px solid'}
															borderColor={draggedOption === option._id ? 'stroke-medium' : 'stroke-extra-light'}
														>
															{editingOption === option._id ? (
																<>
																	<Icon name='menu' size='x12' color='font-hint' cursor='move' marginInlineEnd='x8' />
																	<Box display='flex' alignItems='center' flexGrow={1}>
																		<Box position='relative'>
																			<Box
																				width='x16'
																				height='x16'
																				borderRadius='x2'
																				bg={editingOptionData.color}
																				marginInlineEnd='x8'
																				cursor='pointer'
																				border='1px solid'
																				borderColor='stroke-light'
																				onClick={() => setShowColorPicker(showColorPicker === option._id ? null : option._id)}
																				title={t('Click_to_open_color_picker')}
																			/>
																			{showColorPicker === option._id && (
																				<Box
																					ref={showColorPicker === option._id ? colorPickerRef : undefined}
																					position='absolute'
																					zIndex={1000}
																					style={{
																						top: '24px',
																						left: '0',
																						background: 'var(--rcx-color-surface-light)',
																						border: '1px solid var(--rcx-color-stroke-light)',
																						borderRadius: '4px',
																						padding: '8px',
																						boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
																					}}
																				>
																					<HexColorPicker
																						color={editingOptionData.color}
																						onChange={(color) => setEditingOptionData({ ...editingOptionData, color })}
																					/>
																					<TextInput
																						value={editingOptionData.color}
																						onChange={(e) =>
																							setEditingOptionData({ ...editingOptionData, color: (e.target as HTMLInputElement).value })
																						}
																						placeholder='#000000'
																						marginBlockStart='x8'
																						width='100%'
																					/>
																					<Box display='flex' marginBlockStart='x8'>
																						{colorOptions.slice(0, 5).map((color) => (
																							<Box
																								key={color}
																								width='x20'
																								height='x20'
																								borderRadius='x2'
																								bg={color}
																								cursor='pointer'
																								border='1px solid'
																								borderColor='stroke-light'
																								marginInlineEnd='x4'
																								onClick={() => setEditingOptionData({ ...editingOptionData, color })}
																							/>
																						))}
																					</Box>
																				</Box>
																			)}
																		</Box>
																		<TextInput
																			value={editingOptionData.value}
																			onChange={(e) =>
																				setEditingOptionData({ ...editingOptionData, value: (e.target as HTMLInputElement).value })
																			}
																			flexGrow={1}
																			marginInlineEnd='x8'
																		/>
																	</Box>
																	<Box display='flex' alignItems='center'>
																		<Button
																			square
																			tiny
																			primary
																			onClick={() => handleSaveOptionEdit(option._id)}
																			title={t('Save_changes')}
																			marginInlineEnd='x4'
																			disabled={!editingOptionData.value.trim()}
																		>
																			<Icon name='check' size='x16' />
																		</Button>
																		<Button square tiny onClick={handleCancelOptionEdit} title={t('Cancel_editing')}>
																			<Icon name='cross' size='x16' />
																		</Button>
																	</Box>
																</>
															) : (
																<>
																	<Icon
																		name='menu'
																		size='x12'
																		color='font-hint'
																		marginInlineEnd='x8'
																		style={{
																			cursor: 'grab',
																			opacity: 0.7,
																			transition: 'opacity 0.2s ease',
																		}}
																		title={t('Drag_to_reorder')}
																	/>
																	<Box display='flex' alignItems='center' flexGrow={1}>
																		<Box position='relative'>
																			<Box
																				width='x16'
																				height='x16'
																				borderRadius='x2'
																				bg={option.color || '#3498db'}
																				marginInlineEnd='x8'
																				cursor='pointer'
																				border='1px solid'
																				borderColor='stroke-light'
																				onClick={() =>
																					setShowColorPicker(showColorPicker === `view-${option._id}` ? null : `view-${option._id}`)
																				}
																				title={t('Click_to_change_color')}
																			/>
																			{showColorPicker === `view-${option._id}` && (
																				<Box
																					ref={showColorPicker === `view-${option._id}` ? colorPickerRef : undefined}
																					position='absolute'
																					zIndex={1000}
																					style={{
																						top: '24px',
																						left: '0',
																						background: 'var(--rcx-color-surface-light)',
																						border: '1px solid var(--rcx-color-stroke-light)',
																						borderRadius: '4px',
																						padding: '8px',
																						boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
																					}}
																				>
																					<HexColorPicker
																						color={tempColors[option._id] || option.color || '#3498db'}
																						onChange={(color) => {
																							setTempColors((prev) => ({ ...prev, [option._id]: color }));
																							setOptions(options.map((o) => (o._id === option._id ? { ...o, color } : o)));
																						}}
																					/>
																					<TextInput
																						value={tempColors[option._id] || option.color || '#3498db'}
																						onChange={(e) => {
																							const color = (e.target as HTMLInputElement).value;
																							setTempColors((prev) => ({ ...prev, [option._id]: color }));
																							setOptions(options.map((o) => (o._id === option._id ? { ...o, color } : o)));
																						}}
																						placeholder='#000000'
																						marginBlockStart='x8'
																						width='100%'
																					/>
																					<Box display='flex' marginBlockStart='x8'>
																						{colorOptions.slice(0, 5).map((color) => (
																							<Box
																								key={color}
																								width='x20'
																								height='x20'
																								borderRadius='x2'
																								bg={color}
																								cursor='pointer'
																								border='1px solid'
																								borderColor='stroke-light'
																								marginInlineEnd='x4'
																								onClick={() => {
																									setTempColors((prev) => ({ ...prev, [option._id]: color }));
																									setOptions(options.map((o) => (o._id === option._id ? { ...o, color } : o)));
																								}}
																							/>
																						))}
																					</Box>
																				</Box>
																			)}
																		</Box>
																		<Box fontWeight='500' color='font-default'>
																			{option.value}
																		</Box>
																	</Box>
																	<Box display='flex' alignItems='center'>
																		<Button
																			square
																			tiny
																			onClick={() => handleStartEditOption(option)}
																			title={t('Edit_option')}
																			marginInlineEnd='x4'
																		>
																			<Icon name='edit' size='x16' />
																		</Button>
																		<Button
																			square
																			tiny
																			danger
																			onClick={() => handleDeleteOption(option._id, option.value)}
																			title={t('Delete_option')}
																		>
																			<Icon name='trash' size='x16' />
																		</Button>
																	</Box>
																</>
															)}
														</Box>
													))}
											</Box>
										</Box>
									)}

									<Box p='x12' bg='surface-tint' borderRadius='x4' marginBlockStart='x2'>
										<Box fontSize='c2' fontWeight='600' color='font-secondary-info' marginBlockEnd='x8' textTransform='uppercase'>
											{t('Add_New_Option')}
										</Box>
										<Box display='flex' alignItems='center' marginBlockEnd='x6'>
											<Box position='relative'>
												<Box
													width='x16'
													height='x16'
													borderRadius='x2'
													bg={newOption.color}
													marginInlineEnd='x8'
													cursor='pointer'
													border='1px solid'
													borderColor='stroke-light'
													onClick={() => setShowColorPicker(showColorPicker === 'newOption' ? null : 'newOption')}
													title={t('Click_to_open_color_picker')}
												/>
												{showColorPicker === 'newOption' && (
													<Box
														ref={showColorPicker === 'newOption' ? colorPickerRef : undefined}
														position='absolute'
														zIndex={1000}
														style={{
															top: '24px',
															left: '0',
															background: 'var(--rcx-color-surface-light)',
															border: '1px solid var(--rcx-color-stroke-light)',
															borderRadius: '4px',
															padding: '8px',
															boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
														}}
													>
														<HexColorPicker color={newOption.color} onChange={(color) => setNewOption({ ...newOption, color })} />
														<TextInput
															value={newOption.color}
															onChange={(e) => setNewOption({ ...newOption, color: (e.target as HTMLInputElement).value })}
															placeholder='#000000'
															marginBlockStart='x8'
															width='100%'
														/>
														<Box display='flex' marginBlockStart='x8'>
															{colorOptions.slice(0, 5).map((color) => (
																<Box
																	key={color}
																	width='x20'
																	height='x20'
																	borderRadius='x2'
																	bg={color}
																	cursor='pointer'
																	border='1px solid'
																	borderColor='stroke-light'
																	marginInlineEnd='x4'
																	onClick={() => setNewOption({ ...newOption, color })}
																/>
															))}
														</Box>
													</Box>
												)}
											</Box>
											<TextInput
												placeholder={t('Option_name')}
												value={newOption.value}
												onChange={(e) => setNewOption({ ...newOption, value: (e.target as HTMLInputElement).value })}
												flexGrow={1}
												marginInlineEnd='x6'
											/>
											<Button primary small onClick={handleAddOption} disabled={!newOption.value.trim() || isLoading}>
												<Icon name='plus' size='x16' />
											</Button>
										</Box>
									</Box>
								</>
							)}
						</FieldGroup>
					</Box>
				</Box>

				<Divider />
				{/* Footer */}
				<Box p='x20' display='flex' alignItems='center' justifyContent='space-between'>
					<Box display='flex' alignItems='center'>
						<Button onClick={onClose} marginInlineEnd='x8'>
							{t('Cancel')}
						</Button>
						{!isNewField && (
							<Button danger onClick={handleDeleteField} disabled={isLoading}>
								<Icon name='trash' size='x16' marginInlineEnd='x4' />
								{t('Delete')}
							</Button>
						)}
					</Box>
					<Button primary onClick={handleSubmit(handleSaveField)} disabled={isLoading} loading={isLoading}>
						<Icon name={isNewField ? 'plus' : 'check'} size='x16' marginInlineEnd='x4' />
						{isNewField ? t('Create') : t('Save')}
					</Button>
				</Box>
			</Box>

			{/* Delete Field Confirmation Modal */}
			{deleteFieldConfirmation && (
				<Box
					style={{
						position: 'fixed',
						top: 0,
						left: 0,
						right: 0,
						bottom: 0,
						zIndex: 9999,
						backgroundColor: 'rgba(0, 0, 0, 0.5)',
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
					}}
					onClick={handleCancelDeleteField}
				>
					<Box
						bg='surface-light'
						borderRadius='x8'
						p='x20'
						style={{
							minWidth: '400px',
							maxWidth: '500px',
							boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
						}}
						onClick={(e) => e.stopPropagation()}
					>
						<Box display='flex' alignItems='center' justifyContent='space-between' marginBlockEnd='x16'>
							<Box fontWeight='600' fontSize='h4' color='danger'>
								{t('Delete_Field')}
							</Box>
							<Button square small onClick={handleCancelDeleteField}>
								<Icon name='cross' size='x20' />
							</Button>
						</Box>

						<Box marginBlockEnd='x20' color='font-default' lineHeight='1.5'>
							{t('Are_you_sure_delete_field')} "<strong>{deleteFieldConfirmation.fieldName}</strong>"?{' '}
							{t('This_action_cannot_be_undone_field')}
						</Box>

						<Box display='flex' justifyContent='flex-end'>
							<Button onClick={handleCancelDeleteField} marginInlineEnd='x8'>
								{t('Cancel')}
							</Button>
							<Button danger onClick={handleConfirmDeleteField} loading={isLoading}>
								{t('Delete')}
							</Button>
						</Box>
					</Box>
				</Box>
			)}

			{/* Delete Option Confirmation Modal */}
			{deleteConfirmation && (
				<Box
					style={{
						position: 'fixed',
						top: 0,
						left: 0,
						right: 0,
						bottom: 0,
						zIndex: 9999,
						backgroundColor: 'rgba(0, 0, 0, 0.5)',
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
					}}
					onClick={handleCancelDelete}
				>
					<Box
						bg='surface-light'
						borderRadius='x8'
						p='x20'
						style={{
							minWidth: '400px',
							maxWidth: '500px',
							boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
						}}
						onClick={(e) => e.stopPropagation()}
					>
						<Box display='flex' alignItems='center' justifyContent='space-between' marginBlockEnd='x16'>
							<Box fontWeight='600' fontSize='h4' color='danger'>
								{t('Delete_Option')}
							</Box>
							<Button square small onClick={handleCancelDelete}>
								<Icon name='cross' size='x20' />
							</Button>
						</Box>

						<Box marginBlockEnd='x20' color='font-default' lineHeight='1.5'>
							{t('Are_you_sure_delete_option')} "<strong>{deleteConfirmation.optionValue}</strong>"? {t('This_action_cannot_be_undone')}
						</Box>

						<Box display='flex' justifyContent='flex-end'>
							<Button onClick={handleCancelDelete} marginInlineEnd='x8'>
								{t('Cancel')}
							</Button>
							<Button danger onClick={handleConfirmDelete} loading={isLoading}>
								{t('Delete')}
							</Button>
						</Box>
					</Box>
				</Box>
			)}
		</>
	);
};

export default FieldSettingsPanel;
