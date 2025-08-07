import {
	Modal,
	Button,
	TextInput,
	Field,
	FieldGroup,
	FieldLabel,
	FieldRow,
	FieldError,
	Select,
	Box,
	Icon,
	Divider,
	Chip,
	Tag,
	InputBox,
} from '@rocket.chat/fuselage';
import { useEndpoint, useToastMessageDispatch, useTranslation } from '@rocket.chat/ui-contexts';
import { useState, useEffect } from 'react';
import type { ReactElement } from 'react';
import { useForm, Controller } from 'react-hook-form';

import { TASK_PROPERTY_TYPES } from '../../../definition/project';
import type { ITaskProperty } from '../../../server/core-typings/ITaskProperty';
import type { ITaskTag } from '../../../server/core-typings/ITaskTag';

type PropertySettingsModalProps = {
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

const PropertySettingsModal = ({
	onClose,
	property,
	projectId,
	reload,
	isNewProperty = false,
}: PropertySettingsModalProps): ReactElement => {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();
	const [isLoading, setIsLoading] = useState(false);
	const [tags, setTags] = useState<ITaskTag[]>(property.value || []);
	const [newTag, setNewTag] = useState<TagFormData>({ value: '', color: '#3498db' });

	const createPropertyEndpoint = useEndpoint('POST', '/v1/task-properties.create');
	const updatePropertyEndpoint = useEndpoint('POST', '/v1/task-properties.update');
	const deletePropertyEndpoint = useEndpoint('DELETE', '/v1/task-properties.delete');
	const createTagEndpoint = useEndpoint('POST', '/v1/task-tags.create');
	const updateTagEndpoint = useEndpoint('POST', '/v1/task-tags.update');
	const deleteTagEndpoint = useEndpoint('DELETE', '/v1/task-tags.delete');

	const {
		register,
		handleSubmit,
		control,
		formState: { errors },
	} = useForm<PropertyFormData>({
		defaultValues: {
			name: property.name || '',
			type: property.type || TASK_PROPERTY_TYPES.SELECT,
			required: property.required || false,
		},
	});

	const propertyTypeOptions = [
		[TASK_PROPERTY_TYPES.SELECT, 'Single Select'],
		[TASK_PROPERTY_TYPES.MULTI_SELECT, 'Multi Select'],
	];

	const colorOptions = [
		'#3498db', '#e74c3c', '#2ecc71', '#f39c12', '#9b59b6',
		'#1abc9c', '#e67e22', '#34495e', '#e91e63', '#9c27b0'
	];

	const handleSaveProperty = async (data: PropertyFormData) => {
		setIsLoading(true);
		try {
			if (isNewProperty) {
				await createPropertyEndpoint({
					...data,
					projectId,
					order: 0,
				});
				dispatchToastMessage({ type: 'success', message: 'Property created successfully' });
			} else {
				await updatePropertyEndpoint({
					_id: property._id,
					...data,
				});
				dispatchToastMessage({ type: 'success', message: 'Property updated successfully' });
			}
			reload();
			onClose();
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		} finally {
			setIsLoading(false);
		}
	};

	const handleDeleteProperty = async () => {
		if (property.required) {
			dispatchToastMessage({ type: 'error', message: 'Cannot delete required property' });
			return;
		}

		if (window.confirm('Are you sure you want to delete this property? This action cannot be undone.')) {
			setIsLoading(true);
			try {
				await deletePropertyEndpoint({ _id: property._id });
				dispatchToastMessage({ type: 'success', message: 'Property deleted successfully' });
				reload();
				onClose();
			} catch (error) {
				dispatchToastMessage({ type: 'error', message: error });
			} finally {
				setIsLoading(false);
			}
		}
	};

	const handleAddTag = async () => {
		if (!newTag.value.trim()) return;

		setIsLoading(true);
		try {
			const createdTag = await createTagEndpoint({
				value: newTag.value,
				color: newTag.color,
				taskPropertyId: property._id,
				order: tags.length,
			});
			
			setTags([...tags, createdTag]);
			setNewTag({ value: '', color: '#3498db' });
			dispatchToastMessage({ type: 'success', message: 'Tag added successfully' });
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		} finally {
			setIsLoading(false);
		}
	};

	const handleUpdateTag = async (tagId: string, updatedTag: Partial<ITaskTag>) => {
		setIsLoading(true);
		try {
			await updateTagEndpoint({
				_id: tagId,
				...updatedTag,
			});
			
			setTags(tags.map(tag => tag._id === tagId ? { ...tag, ...updatedTag } : tag));
			dispatchToastMessage({ type: 'success', message: 'Tag updated successfully' });
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		} finally {
			setIsLoading(false);
		}
	};

	const handleDeleteTag = async (tagId: string) => {
		if (window.confirm('Are you sure you want to delete this tag?')) {
			setIsLoading(true);
			try {
				await deleteTagEndpoint({ _id: tagId });
				setTags(tags.filter(tag => tag._id !== tagId));
				dispatchToastMessage({ type: 'success', message: 'Tag deleted successfully' });
			} catch (error) {
				dispatchToastMessage({ type: 'error', message: error });
			} finally {
				setIsLoading(false);
			}
		}
	};

	return (
		<Modal width='600px'>
			<Modal.Header>
				<Modal.Title>
					{isNewProperty ? 'Create Property' : `Edit Property: ${property.name}`}
				</Modal.Title>
				<Modal.Close onClick={onClose} />
			</Modal.Header>
			<Modal.Content>
				<FieldGroup>
					<Field>
						<FieldLabel>Property Name*</FieldLabel>
						<FieldRow>
							<TextInput
								{...register('name', { required: true })}
								placeholder='Enter property name'
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
									<Select
										value={value}
										onChange={onChange}
										options={propertyTypeOptions}
									/>
								)}
							/>
						</FieldRow>
					</Field>

					<Field>
						<FieldLabel>
							<Box is='label' display='flex' alignItems='center'>
								<Controller
									name='required'
									control={control}
									render={({ field: { onChange, value } }) => (
										<InputBox
											type='checkbox'
											checked={value}
											onChange={(e) => onChange(e.target.checked)}
										/>
									)}
								/>
								<Box mis='x8'>Required Property</Box>
							</Box>
						</FieldLabel>
					</Field>

					{!isNewProperty && (
						<>
							<Divider />
							<Field>
								<FieldLabel>Tags Management</FieldLabel>
								<Box mb='x16'>
									{tags.map((tag) => (
										<Box key={tag._id} display='flex' alignItems='center' mb='x8'>
											<Tag
												style={{ backgroundColor: tag.color }}
												variant='secondary'
											>
												{tag.value}
											</Tag>
											<Box mis='x8' display='flex' alignItems='center'>
												<Button
													square
													small
													onClick={() => {
														const newValue = prompt('Enter new tag name:', tag.value);
														if (newValue && newValue !== tag.value) {
															handleUpdateTag(tag._id, { value: newValue });
														}
													}}
												>
													<Icon name='edit' size='x16' />
												</Button>
												<Button
													square
													small
													danger
													mis='x4'
													onClick={() => handleDeleteTag(tag._id)}
												>
													<Icon name='trash' size='x16' />
												</Button>
											</Box>
										</Box>
									))}
								</Box>

								<Box display='flex' alignItems='center' gap='x8'>
									<TextInput
										placeholder='Enter tag name'
										value={newTag.value}
										onChange={(e) => setNewTag({ ...newTag, value: e.target.value })}
									/>
									<Select
										value={newTag.color}
										onChange={(color) => setNewTag({ ...newTag, color: String(color) })}
										options={colorOptions.map(color => [color, color])}
									/>
									<Button
										primary
										small
										onClick={handleAddTag}
										disabled={!newTag.value.trim() || isLoading}
									>
										<Icon name='plus' size='x16' />
									</Button>
								</Box>
							</Field>
						</>
					)}
				</FieldGroup>
			</Modal.Content>
			<Modal.Footer>
				<Modal.FooterControllers>
					<Button onClick={onClose}>{t('Cancel')}</Button>
					{!isNewProperty && !property.required && (
						<Button danger onClick={handleDeleteProperty} disabled={isLoading}>
							{t('Delete')}
						</Button>
					)}
					<Button
						primary
						onClick={handleSubmit(handleSaveProperty)}
						disabled={isLoading}
						loading={isLoading}
					>
						{isNewProperty ? t('Create') : t('Save')}
					</Button>
				</Modal.FooterControllers>
			</Modal.Footer>
		</Modal>
	);
};

export default PropertySettingsModal;