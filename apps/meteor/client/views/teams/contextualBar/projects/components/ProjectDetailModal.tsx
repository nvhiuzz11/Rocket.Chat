import { Modal, Button, TextInput, Field, FieldGroup, FieldLabel, FieldRow, FieldError, Box, Icon, Palette } from '@rocket.chat/fuselage';
import { UserAvatar, RoomAvatar } from '@rocket.chat/ui-avatar';
import { useEndpoint, useToastMessageDispatch, useTranslation } from '@rocket.chat/ui-contexts';
import { useState, useMemo } from 'react';
import type { ReactElement } from 'react';
import { useForm } from 'react-hook-form';

import { PROJECT_PROPERTY_TYPES } from '../../../../../../definition/project';
import type { IProject } from '../../../../../../server/core-typings/IProject';
import type { IProjectProperty } from '../../../../../../server/core-typings/IProjectProperty';
import type { IProjectTag } from '../../../../../../server/core-typings/IProjectTag';
import { PropertyInput } from '../../../../../components/PropertyProject/PropertyInput';

type ProjectDetailModalProps = {
	onClose: () => void;
	teamId: string;
	projectProperties: (IProjectProperty & { value: IProjectTag[] })[];
	reload: () => void;
	project: IProject;
};

type UpdateProjectPayload = {
	name: string;
	description: string;
};

const ProjectDetailModal = ({ onClose, project, teamId, projectProperties, reload }: ProjectDetailModalProps): ReactElement => {
	const t = useTranslation();
	const [isLoading, setIsLoading] = useState(false);
	const dispatchToastMessage = useToastMessageDispatch();
	const updateProjectEndpoint = useEndpoint('POST', '/v1/projects.update');

	const [projectPropertySelected, setProjectPropertySelected] = useState<Array<{ propertyId: string; value: string[] }>>(
		() => project.properties || [],
	);

	const {
		register,
		handleSubmit,
		formState: { errors, isDirty },
	} = useForm<UpdateProjectPayload>({
		defaultValues: {
			name: project.name,
			description: project.description,
		},
	});

	const propertiesAreDirty = useMemo(() => {
		return JSON.stringify(project.properties) !== JSON.stringify(projectPropertySelected);
	}, [project.properties, projectPropertySelected]);

	const hasChanges = isDirty || propertiesAreDirty;

	const handlePropertyChange = (propertyId: string, newValue: string | string[]) => {
		setProjectPropertySelected((prev) => {
			const valueArray = Array.isArray(newValue) ? newValue : [newValue];
			const existingIndex = prev.findIndex((item) => item.propertyId === propertyId);

			if (existingIndex >= 0) {
				const updated = [...prev];
				updated[existingIndex] = { propertyId, value: valueArray };
				return updated;
			}

			return [...prev, { propertyId, value: valueArray }];
		});
	};

	const getPropertyValue = (propertyId: string, propertyType: string) => {
		const selectedProperty = projectPropertySelected.find((p) => p.propertyId === propertyId);
		if (!selectedProperty) {
			return propertyType === PROJECT_PROPERTY_TYPES.MULTI_SELECT ? [] : '';
		}
		return propertyType === PROJECT_PROPERTY_TYPES.MULTI_SELECT ? selectedProperty.value : selectedProperty.value[0] || '';
	};

	const handleUpdateProject = async (data: UpdateProjectPayload) => {
		setIsLoading(true);
		try {
			await updateProjectEndpoint({
				_id: project._id,
				data: {
					...data,
					properties: projectPropertySelected,
				},
			});
			dispatchToastMessage({ type: 'success', message: t('Project_updated') });
			reload();
			onClose();
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<Modal>
			<Modal.Header>
				<Modal.Title>{t('Project_Details')}</Modal.Title>
				<Modal.Close onClick={onClose} />
			</Modal.Header>
			<Modal.Content>
				<FieldGroup>
					{/* Các trường có thể chỉnh sửa */}
					<Field>
						<FieldLabel>{t('Name')}*</FieldLabel>
						<FieldRow>
							<TextInput
								{...register('name', { required: true })}
								placeholder={t('Project_Name')}
								aria-invalid={errors.name ? 'true' : 'false'}
							/>
						</FieldRow>
						{errors.name && <FieldError>{t('error-field-required')}</FieldError>}
					</Field>

					<Field>
						<FieldLabel>{t('Description')}</FieldLabel>
						<FieldRow>
							<TextInput {...register('description')} placeholder={t('Project_Description')} />
						</FieldRow>
					</Field>

					{projectProperties?.map((property) => (
						<Field key={property._id}>
							<FieldLabel>
								{property.name}
								{property.required && '*'}
							</FieldLabel>
							<FieldRow>
								<PropertyInput
									property={property}
									value={getPropertyValue(property._id, property.type)}
									onChange={(value) => handlePropertyChange(property._id, value)}
								/>
							</FieldRow>
						</Field>
					))}

					{/* Các trường chỉ đọc (disable) */}
					<Field>
						<FieldLabel>{t('Channel')}</FieldLabel>

						{/* <FieldRow>
							<TextInput value={project.room.name} disabled />
							<RoomAvatar size='x24' room={project.room} />
							<Box is='span' mi='x8' withTruncatedText>
								<Icon name='hashtag-lock' size='x15' />
								{project.room.name}
							</Box>
						</FieldRow> */}

						<Box
							display='flex'
							alignItems='center'
							w='full'
							p='x8'
							backgroundColor={Palette.surface['surface-tint']}
							borderColor='#262931'
							borderWidth='x1'
							borderRadius='x4'
							color={Palette.text['font-hint']}
						>
							<RoomAvatar size='x24' room={project.room} />
							<Box is='span' mi='x8' withTruncatedText>
								{project.room.name}
							</Box>
						</Box>
					</Field>

					<Field>
						<FieldLabel>{t('Created_By')}</FieldLabel>

						{/* <Box display='flex' alignItems='center' w='full'>
								<UserAvatar size='x24' userId={project.createdBy._id} />
								<Box is='span' mi='x8' withTruncatedText>
									{project.createdBy.username}
								</Box>
							</Box> */}

						<FieldRow>
							<Box
								display='flex'
								alignItems='center'
								w='full'
								p='x8'
								backgroundColor={Palette.surface['surface-tint']}
								borderColor='#262931'
								borderWidth='x1'
								borderRadius='x4'
								color={Palette.text['font-hint']}
							>
								<UserAvatar size='x24' userId={project.createdBy._id} />
								<Box is='span' mi='x8' withTruncatedText>
									{project.createdBy.username}
								</Box>
							</Box>
						</FieldRow>
					</Field>
					<Field>
						<FieldLabel>{t('Created_At')}</FieldLabel>
						<FieldRow>
							<TextInput value={new Date(project.createdAt).toLocaleString()} disabled />
						</FieldRow>
					</Field>
				</FieldGroup>
			</Modal.Content>
			<Modal.Footer>
				<Modal.FooterControllers>
					<Button onClick={onClose}>{t('Cancel')}</Button>
					<Button onClick={handleSubmit(handleUpdateProject)} primary disabled={!hasChanges || isLoading} loading={isLoading}>
						{t('Save_changes')}
					</Button>
				</Modal.FooterControllers>
			</Modal.Footer>
		</Modal>
	);
};

export default ProjectDetailModal;
