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
import { useEndpoint, useToastMessageDispatch, useTranslation } from '@rocket.chat/ui-contexts';
import { useState, useEffect, useRef } from 'react';
import type { ReactElement } from 'react';
import { HexColorPicker } from 'react-colorful';
import { useForm, Controller } from 'react-hook-form';

import { TASK_PROPERTY_TYPES } from '../../../definition/project';
import type { ITaskProperty } from '../../../server/core-typings/ITaskProperty';
import type { ITaskTag } from '../../../server/core-typings/ITaskTag';

type PropertySettingsPanelProps = {
	onClose: () => void;
	property: ITaskProperty & { value: ITaskTag[] };
	projectId: string;
	reload: () => void;
	isNewProperty?: boolean;
};

type PropertyFormData = {
	name: string;
	type: string;
	required: boolean;
};

type TagFormData = {
	value: string;
	color: string;
};

const PropertySettingsPanel = ({
	onClose,
	property,
	projectId,
	reload,
	isNewProperty = false,
}: PropertySettingsPanelProps): ReactElement => {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();
	const [isLoading, setIsLoading] = useState(false);
	const [tags, setTags] = useState<ITaskTag[]>(property.value || []);
	const [newTag, setNewTag] = useState<TagFormData>({ value: '', color: '#3498db' });
	const [editingTag, setEditingTag] = useState<string | null>(null);
	const [editingTagData, setEditingTagData] = useState<{ value: string; color: string }>({ value: '', color: '' });
	const [showColorPicker, setShowColorPicker] = useState<string | null>(null);
	const [tempColors, setTempColors] = useState<{ [tagId: string]: string }>({});
	const [draggedTag, setDraggedTag] = useState<string | null>(null);
	const [hoveredTag, setHoveredTag] = useState<string | null>(null);
	const [deleteConfirmation, setDeleteConfirmation] = useState<{ tagId: string; tagValue: string } | null>(null);
	const [deletePropertyConfirmation, setDeletePropertyConfirmation] = useState<{ propertyId: string; propertyName: string } | null>(null);
	const colorPickerRef = useRef<HTMLDivElement>(null);

	const createPropertyEndpoint = useEndpoint('POST', '/v1/task-properties.create');
	const updatePropertyEndpoint = useEndpoint('POST', '/v1/task-properties.update');
	const deletePropertyEndpoint = useEndpoint('POST', '/v1/task-properties.delete');
	const createTagEndpoint = useEndpoint('POST', '/v1/task-tags.create');
	const updateTagEndpoint = useEndpoint('POST', '/v1/task-tags.update');
	const deleteTagEndpoint = useEndpoint('POST', '/v1/task-tags.delete');
	const updateTagOrderEndpoint = useEndpoint('POST', '/v1/task-tags.updateOrder');

	const {
		handleSubmit,
		control,
		setValue,
		unregister,
		formState: { errors },
	} = useForm<PropertyFormData>({
		defaultValues: {
			name: property.name || '',
			type: property.systemKey === 'status' ? TASK_PROPERTY_TYPES.SELECT : property.type || TASK_PROPERTY_TYPES.SELECT,
			required: property.systemKey === 'status' ? true : property.required || false,
		},
	});

	// Reset form and tags when property changes
	useEffect(() => {
		console.log('PropertySettingsPanel useEffect - property changed:', property);
		console.log('Property name:', property.name);
		console.log('About to reset form with values:', {
			name: property.name || '',
			type: property.type || TASK_PROPERTY_TYPES.SELECT,
			required: property.required || false,
		});

		// Unregister and re-register the name field to force update
		unregister('name');
		setValue('name', property.name || '');

		// Force type to SELECT and required to true if systemKey is 'status'
		if (property.systemKey === 'status') {
			setValue('type', TASK_PROPERTY_TYPES.SELECT);
			setValue('required', true);
		} else {
			setValue('type', property.type || TASK_PROPERTY_TYPES.SELECT);
			setValue('required', property.required || false);
		}

		setTags(property.value || []);
		setNewTag({ value: '', color: '#3498db' });
		setEditingTag(null);
		setShowColorPicker(null);
	}, [property, setValue, unregister]);

	// Handle click outside color picker to close it and save color
	useEffect(() => {
		const handleClickOutside = async (event: MouseEvent) => {
			if (colorPickerRef.current && !colorPickerRef.current.contains(event.target as Node)) {
				// Save color if there's a temp color for the current picker
				if (showColorPicker) {
					const tagId = showColorPicker.replace('view-', '');
					if (tempColors[tagId]) {
						await handleUpdateTagColor(tagId, tempColors[tagId]);
						// Clear temp color after saving
						setTempColors((prev) => {
							const newTemp = { ...prev };
							delete newTemp[tagId];
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

	const propertyTypeOptions = [
		[TASK_PROPERTY_TYPES.SELECT, 'Single Select'],
		[TASK_PROPERTY_TYPES.MULTI_SELECT, 'Multi Select'],
	];

	const colorOptions = ['#3498db', '#e74c3c', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c', '#e67e22', '#34495e', '#e91e63', '#9c27b0'];

	const handleSaveProperty = async (data: PropertyFormData) => {
		setIsLoading(true);
		try {
			// Force type to SELECT and required to true if systemKey is 'status'
			const propertyData = {
				...data,
				type: property.systemKey === 'status' ? TASK_PROPERTY_TYPES.SELECT : data.type,
				required: property.systemKey === 'status' ? true : data.required,
			};

			if (isNewProperty) {
				await createPropertyEndpoint({
					...propertyData,
					projectId,
				});

				await reload();
				dispatchToastMessage({ type: 'success', message: 'Property created successfully' });
				onClose();
			} else {
				await updatePropertyEndpoint({
					_id: property._id,
					data: propertyData,
				});

				await reload();
				dispatchToastMessage({ type: 'success', message: 'Property updated successfully' });
			}
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		} finally {
			setIsLoading(false);
		}
	};

	const handleDeleteProperty = () => {
		if (property.systemKey === 'status') {
			dispatchToastMessage({ type: 'error', message: 'Cannot delete status property' });
			return;
		}

		setDeletePropertyConfirmation({ propertyId: property._id, propertyName: property.name });
	};

	const handleConfirmDeleteProperty = async () => {
		if (!deletePropertyConfirmation) return;

		setIsLoading(true);
		try {
			await deletePropertyEndpoint({ _id: deletePropertyConfirmation.propertyId });
			dispatchToastMessage({ type: 'success', message: 'Property deleted successfully' });
			await reload();
			onClose();
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		} finally {
			setIsLoading(false);
			setDeletePropertyConfirmation(null);
		}
	};

	const handleCancelDeleteProperty = () => {
		setDeletePropertyConfirmation(null);
	};

	const handleAddTag = async () => {
		if (!newTag.value.trim()) return;

		setIsLoading(true);
		try {
			const createdTag = await createTagEndpoint({
				value: newTag.value,
				color: newTag.color,
				taskPropertyId: property._id,
			});

			await reload();
			setNewTag({ value: '', color: '#3498db' });
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		} finally {
			setIsLoading(false);
		}
	};

	const handleStartEditTag = (tag: ITaskTag) => {
		setEditingTag(tag._id);
		setEditingTagData({ value: tag.value, color: tag.color });
	};

	const handleSaveTagEdit = async (tagId: string) => {
		if (!editingTagData.value.trim()) return;

		setIsLoading(true);
		try {
			await updateTagEndpoint({
				_id: tagId,
				data: {
					value: editingTagData.value,
					color: editingTagData.color,
				},
			});

			// Update local state after successful API call
			await reload();
			setEditingTag(null);
			dispatchToastMessage({ type: 'success', message: 'Tag updated successfully' });
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		} finally {
			setIsLoading(false);
		}
	};

	const handleCancelTagEdit = () => {
		setEditingTag(null);
		setEditingTagData({ value: '', color: '' });
	};

	const handleUpdateTagColor = async (tagId: string, color: string) => {
		try {
			await updateTagEndpoint({
				_id: tagId,
				data: { color },
			});

			await reload();
			dispatchToastMessage({ type: 'success', message: 'Tag color updated successfully' });
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	};

	const handleDeleteTag = (tagId: string, tagValue: string) => {
		setDeleteConfirmation({ tagId, tagValue });
	};

	const handleConfirmDelete = async () => {
		if (!deleteConfirmation) return;

		setIsLoading(true);
		try {
			console.log('tagId', deleteConfirmation.tagId);
			await deleteTagEndpoint({ _id: deleteConfirmation.tagId });
			// Remove tag from local state immediately
			setTags(tags.filter((tag) => tag._id !== deleteConfirmation.tagId));
			dispatchToastMessage({ type: 'success', message: 'Tag deleted successfully' });
			// Call reload to sync parent state
			if (reload) {
				reload();
			}
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		} finally {
			setIsLoading(false);
			setDeleteConfirmation(null);
		}
	};

	const handleCancelDelete = () => {
		setDeleteConfirmation(null);
	};

	const handleDragStart = (e: React.DragEvent, tagId: string) => {
		setDraggedTag(tagId);
		e.dataTransfer.effectAllowed = 'move';
	};

	const handleDragOver = (e: React.DragEvent) => {
		e.preventDefault();
		e.dataTransfer.dropEffect = 'move';
	};

	const handleDragEnd = () => {
		setDraggedTag(null);
		setHoveredTag(null);
	};

	const handleDrop = async (e: React.DragEvent, targetTagId: string) => {
		e.preventDefault();

		if (!draggedTag || draggedTag === targetTagId) return;

		const draggedIndex = tags.findIndex((tag) => tag._id === draggedTag);
		const targetIndex = tags.findIndex((tag) => tag._id === targetTagId);

		if (draggedIndex === -1 || targetIndex === -1) return;

		const newTags = [...tags];
		const [draggedItem] = newTags.splice(draggedIndex, 1);
		newTags.splice(targetIndex, 0, draggedItem);

		// Update order property for all tags
		const updatedTags = newTags.map((tag, index) => ({
			...tag,
			order: index,
		}));

		setTags(updatedTags);
		setDraggedTag(null);

		// Update orders on server
		try {
			await updateTagOrderEndpoint({
				tags: updatedTags.map((tag) => ({ _id: tag._id, order: tag.order })),
			});
			await reload();
		} catch (error) {
			// Revert local state on error
			setTags(tags);
			dispatchToastMessage({ type: 'error', message: 'Failed to update tag order' });
		}
	};

	return (
		<>
			<Box key={property._id} height='100%' bg='surface-room' display='flex' flexDirection='column'>
				{/* Header */}
				<Box p='x20' display='flex' alignItems='center' justifyContent='space-between'>
					<Box>
						<Box fontWeight='600' fontSize='h4' color='font-titles-labels'>
							{isNewProperty ? 'Create Property' : 'Edit Property'}
						</Box>
						<Box fontSize='c1' color='font-hint' marginBlockStart='x2'>
							{isNewProperty ? 'Configure a new task property' : `Configure "${property.name}" property`}
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
						<FieldGroup key={property._id}>
							<Field>
								<FieldLabel>Property Name*</FieldLabel>
								<FieldRow>
									<Controller
										name='name'
										control={control}
										rules={{ required: true }}
										render={({ field: { onChange, value } }) => (
											<TextInput
												key={`name-${property._id}`}
												value={value || ''}
												onChange={(e) => onChange((e.target as HTMLInputElement).value)}
												placeholder='Enter property name'
											/>
										)}
									/>
								</FieldRow>
								{errors.name && <FieldError>Property name is required</FieldError>}
							</Field>

							<Field>
								<FieldLabel>Property Type*</FieldLabel>
								<FieldRow>
									<Controller
										name='type'
										control={control}
										render={({ field: { onChange, value } }) => (
											<Select value={value} onChange={onChange} options={propertyTypeOptions} disabled={property.systemKey === 'status'} />
										)}
									/>
								</FieldRow>
								{property.systemKey === 'status' && (
									<Box fontSize='c1' color='font-hint' marginBlockStart='x4'>
										Status property type is fixed as Single Select
									</Box>
								)}
							</Field>

							<Field>
								<FieldLabel>
									<Box is='label' display='flex' alignItems='center'>
										<Controller
											name='required'
											control={control}
											render={({ field: { onChange, value } }) => (
												<CheckBox checked={value} onChange={onChange} disabled={property.systemKey === 'status'} />
											)}
										/>
										<Box mis='x8'>Required Property</Box>
									</Box>
								</FieldLabel>
								{property.systemKey === 'status' && (
									<Box fontSize='c1' color='font-hint' marginBlockStart='x4'>
										Status property is always required
									</Box>
								)}
							</Field>

							{!isNewProperty && (
								<>
									<Box marginBlockStart='x16' marginBlockEnd='x12'>
										<Box fontSize='h5' fontWeight='600' color='font-titles-labels' marginBlockEnd='x4'>
											Tags Management
										</Box>
										<Box fontSize='c1' color='font-hint'>
											Create and manage options for this property
										</Box>
									</Box>

									{tags.length > 0 && (
										<Box p='x12' bg='surface-tint' borderRadius='x4' marginBlockStart='x2'>
											<Box fontSize='c2' fontWeight='600' color='font-secondary-info' marginBlockEnd='x8' textTransform='uppercase'>
												Existing Tags
											</Box>
											<Box display='flex' flexDirection='column'>
												{tags.map((tag) => (
													<Box
														key={tag._id}
														display='flex'
														alignItems='center'
														justifyContent='space-between'
														p='x8'
														bg={draggedTag === tag._id ? 'surface-selected' : 'surface-light'}
														borderRadius='x2'
														marginBlockEnd='x4'
														draggable
														onDragStart={(e) => handleDragStart(e, tag._id)}
														onDragOver={handleDragOver}
														onDragEnd={handleDragEnd}
														onDrop={(e) => handleDrop(e, tag._id)}
														onMouseEnter={() => setHoveredTag(tag._id)}
														onMouseLeave={() => setHoveredTag(null)}
														style={{
															cursor: draggedTag === tag._id ? 'grabbing' : 'grab',
															opacity: draggedTag === tag._id ? 0.6 : 1,
															transform:
																draggedTag === tag._id
																	? 'rotate(0.5deg) scale(1.05)'
																	: hoveredTag === tag._id
																		? 'rotate(0.2deg) scale(1.01)'
																		: 'none',
															transition: 'all 0.2s ease',
															boxShadow:
																draggedTag === tag._id
																	? '0 4px 12px rgba(0, 0, 0, 0.15)'
																	: hoveredTag === tag._id
																		? '0 2px 6px rgba(0, 0, 0, 0.08)'
																		: 'none',
														}}
														border={draggedTag === tag._id ? '2px solid' : '1px solid'}
														borderColor={draggedTag === tag._id ? 'stroke-medium' : 'stroke-extra-light'}
													>
														{editingTag === tag._id ? (
															<>
																<Icon name='menu' size='x12' color='font-hint' cursor='move' marginInlineEnd='x8' />
																<Box display='flex' alignItems='center' flexGrow={1}>
																	<Box position='relative'>
																		<Box
																			width='x16'
																			height='x16'
																			borderRadius='x2'
																			bg={editingTagData.color}
																			marginInlineEnd='x8'
																			cursor='pointer'
																			border='1px solid'
																			borderColor='stroke-light'
																			onClick={() => setShowColorPicker(showColorPicker === tag._id ? null : tag._id)}
																			title='Click to open color picker'
																		/>
																		{showColorPicker === tag._id && (
																			<Box
																				ref={showColorPicker === tag._id ? colorPickerRef : undefined}
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
																					color={editingTagData.color}
																					onChange={(color) => setEditingTagData({ ...editingTagData, color })}
																				/>
																				<TextInput
																					value={editingTagData.color}
																					onChange={(e) =>
																						setEditingTagData({ ...editingTagData, color: (e.target as HTMLInputElement).value })
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
																							onClick={() => setEditingTagData({ ...editingTagData, color })}
																						/>
																					))}
																				</Box>
																			</Box>
																		)}
																	</Box>
																	<TextInput
																		value={editingTagData.value}
																		onChange={(e) => setEditingTagData({ ...editingTagData, value: (e.target as HTMLInputElement).value })}
																		flexGrow={1}
																		marginInlineEnd='x8'
																	/>
																</Box>
																<Box display='flex' alignItems='center'>
																	<Button
																		square
																		tiny
																		primary
																		onClick={() => handleSaveTagEdit(tag._id)}
																		title='Save changes'
																		marginInlineEnd='x4'
																		disabled={!editingTagData.value.trim()}
																	>
																		<Icon name='check' size='x16' />
																	</Button>
																	<Button square tiny onClick={handleCancelTagEdit} title='Cancel editing'>
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
																	title='Drag to reorder'
																/>
																<Box display='flex' alignItems='center' flexGrow={1}>
																	<Box position='relative'>
																		<Box
																			width='x16'
																			height='x16'
																			borderRadius='x2'
																			bg={tag.color}
																			marginInlineEnd='x8'
																			cursor='pointer'
																			border='1px solid'
																			borderColor='stroke-light'
																			onClick={() => setShowColorPicker(showColorPicker === `view-${tag._id}` ? null : `view-${tag._id}`)}
																			title='Click to change color'
																		/>
																		{showColorPicker === `view-${tag._id}` && (
																			<Box
																				ref={showColorPicker === `view-${tag._id}` ? colorPickerRef : undefined}
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
																					color={tempColors[tag._id] || tag.color}
																					onChange={(color) => {
																						setTempColors((prev) => ({ ...prev, [tag._id]: color }));
																						setTags(tags.map((t) => (t._id === tag._id ? { ...t, color } : t)));
																					}}
																				/>
																				<TextInput
																					value={tempColors[tag._id] || tag.color}
																					onChange={(e) => {
																						const color = (e.target as HTMLInputElement).value;
																						setTempColors((prev) => ({ ...prev, [tag._id]: color }));
																						setTags(tags.map((t) => (t._id === tag._id ? { ...t, color } : t)));
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
																								setTempColors((prev) => ({ ...prev, [tag._id]: color }));
																								setTags(tags.map((t) => (t._id === tag._id ? { ...t, color } : t)));
																							}}
																						/>
																					))}
																				</Box>
																			</Box>
																		)}
																	</Box>
																	<Box fontWeight='500' color='font-default'>
																		{tag.value}
																	</Box>
																</Box>
																<Box display='flex' alignItems='center'>
																	<Button square tiny onClick={() => handleStartEditTag(tag)} title='Edit tag' marginInlineEnd='x4'>
																		<Icon name='edit' size='x16' />
																	</Button>
																	<Button square tiny danger onClick={() => handleDeleteTag(tag._id, tag.value)} title='Delete tag'>
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
											Add New Tag
										</Box>
										<Box display='flex' alignItems='center' marginBlockEnd='x6'>
											<Box position='relative'>
												<Box
													width='x16'
													height='x16'
													borderRadius='x2'
													bg={newTag.color}
													marginInlineEnd='x8'
													cursor='pointer'
													border='1px solid'
													borderColor='stroke-light'
													onClick={() => setShowColorPicker(showColorPicker === 'newTag' ? null : 'newTag')}
													title='Click to open color picker'
												/>
												{showColorPicker === 'newTag' && (
													<Box
														ref={showColorPicker === 'newTag' ? colorPickerRef : undefined}
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
														<HexColorPicker color={newTag.color} onChange={(color) => setNewTag({ ...newTag, color })} />
														<TextInput
															value={newTag.color}
															onChange={(e) => setNewTag({ ...newTag, color: (e.target as HTMLInputElement).value })}
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
																	onClick={() => setNewTag({ ...newTag, color })}
																/>
															))}
														</Box>
													</Box>
												)}
											</Box>
											<TextInput
												placeholder='Tag name'
												value={newTag.value}
												onChange={(e) => setNewTag({ ...newTag, value: (e.target as HTMLInputElement).value })}
												flexGrow={1}
												marginInlineEnd='x6'
											/>
											<Button primary small onClick={handleAddTag} disabled={!newTag.value.trim() || isLoading}>
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
							Cancel
						</Button>
						{!isNewProperty && property.systemKey !== 'status' && (
							<Button danger onClick={handleDeleteProperty} disabled={isLoading}>
								<Icon name='trash' size='x16' marginInlineEnd='x4' />
								Delete
							</Button>
						)}
					</Box>
					<Button primary onClick={handleSubmit(handleSaveProperty)} disabled={isLoading} loading={isLoading}>
						<Icon name={isNewProperty ? 'plus' : 'check'} size='x16' marginInlineEnd='x4' />
						{isNewProperty ? 'Create' : 'Save'}
					</Button>
				</Box>
			</Box>

			{/* Delete Property Confirmation Modal - Custom Overlay */}
			{deletePropertyConfirmation && (
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
					onClick={handleCancelDeleteProperty}
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
						{/* Header */}
						<Box display='flex' alignItems='center' justifyContent='space-between' marginBlockEnd='x16'>
							<Box fontWeight='600' fontSize='h4' color='danger'>
								Delete Property
							</Box>
							<Button square small onClick={handleCancelDeleteProperty}>
								<Icon name='cross' size='x20' />
							</Button>
						</Box>

						{/* Content */}
						<Box marginBlockEnd='x20' color='font-default' lineHeight='1.5'>
							Are you sure you want to delete property "<strong>{deletePropertyConfirmation.propertyName}</strong>"? This action cannot be
							undone and will remove all associated data.
						</Box>

						{/* Footer */}
						<Box display='flex' justifyContent='flex-end'>
							<Button onClick={handleCancelDeleteProperty} marginInlineEnd='x8'>
								Cancel
							</Button>
							<Button danger onClick={handleConfirmDeleteProperty} loading={isLoading}>
								Delete
							</Button>
						</Box>
					</Box>
				</Box>
			)}

			{/* Delete Tag Confirmation Modal - Custom Overlay */}
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
						{/* Header */}
						<Box display='flex' alignItems='center' justifyContent='space-between' marginBlockEnd='x16'>
							<Box fontWeight='600' fontSize='h4' color='danger'>
								Delete Tag
							</Box>
							<Button square small onClick={handleCancelDelete}>
								<Icon name='cross' size='x20' />
							</Button>
						</Box>

						{/* Content */}
						<Box marginBlockEnd='x20' color='font-default' lineHeight='1.5'>
							Are you sure you want to delete tag "<strong>{deleteConfirmation.tagValue}</strong>"? This action cannot be undone.
						</Box>

						{/* Footer */}
						<Box display='flex' justifyContent='flex-end'>
							<Button onClick={handleCancelDelete} marginInlineEnd='x8'>
								Cancel
							</Button>
							<Button danger onClick={handleConfirmDelete} loading={isLoading}>
								Delete
							</Button>
						</Box>
					</Box>
				</Box>
			)}
		</>
	);
};

export default PropertySettingsPanel;
