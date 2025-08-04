import { Modal, Button, TextInput, Field, FieldGroup, FieldLabel, FieldRow, FieldError, Select } from '@rocket.chat/fuselage';
import { useEndpoint, useToastMessageDispatch, useTranslation } from '@rocket.chat/ui-contexts';
import { useState, useId, useEffect } from 'react';
import type { ReactElement } from 'react';
import { Controller, useForm } from 'react-hook-form';

import { PROJECT_PROPERTY_TYPES } from '../../../../../../definition/project';
import type { IProjectProperty } from '../../../../../../server/core-typings/IProjectProperty';
import type { IProjectTag } from '../../../../../../server/core-typings/IProjectTag';
import UserAutoCompleteMultipleFederated from '../../../../../components/UserAutoCompleteMultiple/UserAutoCompleteMultipleFederated';
import { PropertyInput } from '../../../../../components/PropertyProject/PropertyInput';

type EditProjectModalProps = {
	onClose: () => void;
	teamId: string;
	projectProperties: IProjectProperty[] & { value: IProjectTag[] };
	reload: () => void;
};

type EditProjectModalPayload = {
	name: string;
	description: string;
	members: string[];
};

const EditProjectModal = ({ onClose, teamId, projectProperties, reload }: EditProjectModalProps): ReactElement => {
	console.log('projectProperties EditProjectModal', projectProperties);
	const t = useTranslation();
	const [isLoading, setIsLoading] = useState(false);
	const [projectPropertySelected, setProjectPropertySelected] = useState<{ propertyId: string; value: IProjectTag['_id'][] }[]>([]);
	const addMembersId = useId();

	const updateProjectEndpoint = useEndpoint('POST', '/v1/projects.update');
	const dispatchToastMessage = useToastMessageDispatch();

	const {
		register,
		formState: { errors },
		handleSubmit,
		control,
	} = useForm<EditProjectModalPayload>({
		defaultValues: {
			name: '',
			description: '',
			members: [],
		},
	});

	const handleCreateProject = async ({ name, description }: EditProjectModalPayload): Promise<void> => {
		try {
			console.log('projectPropertySelected', projectPropertySelected);

			setIsLoading(true);

			await updateProjectEndpoint({
				_id: projectProperties._id,
				data: {
					name,
					description,
					properties: projectPropertySelected,
				},
			});
			dispatchToastMessage({ type: 'success', message: 'Project updated successfully' });
			onClose();
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		} finally {
			setIsLoading(false);
			reload();
		}
	};

	useEffect(() => {
		console.log('projectPropertySelected', projectPropertySelected);
	}, [projectPropertySelected]);

	const handlePropertyChange = (propertyId: string, newValue: string | string[]) => {
		console.log('handlePropertyChange', propertyId, newValue);
		setProjectPropertySelected((prev) => {
			// Convert newValue to array if it's a single string
			const valueArray = Array.isArray(newValue) ? newValue : [newValue];

			// Check if property already exists
			const existingIndex = prev.findIndex((item) => item.propertyId === propertyId);

			if (existingIndex >= 0) {
				// Update existing property
				const updated = [...prev];
				updated[existingIndex] = { propertyId, value: valueArray };
				return updated;
			}

			// Add new property
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

	return (
		<Modal>
			<Modal.Header>
				<Modal.Title>Create Project</Modal.Title>
				<Modal.Close onClick={onClose} />
			</Modal.Header>
			<Modal.Content>
				<FieldGroup>
					<Field>
						<FieldLabel>Name*</FieldLabel>
						<FieldRow>
							<TextInput
								{...register('name', { required: true })}
								placeholder='Project name'
								aria-invalid={errors.name ? 'true' : 'false'}
							/>
						</FieldRow>
						{errors.name && <FieldError>Name is required</FieldError>}
					</Field>

					<Field>
						<FieldLabel>Description</FieldLabel>
						<FieldRow>
							<TextInput {...register('description')} placeholder='Project description' />
						</FieldRow>
					</Field>

					<Field>
						<FieldLabel htmlFor={addMembersId}>{t('Members')}</FieldLabel>
						<Controller
							control={control}
							name='members'
							render={({ field: { onChange, value } }): ReactElement => (
								<UserAutoCompleteMultipleFederated id={addMembersId} value={value} onChange={onChange} placeholder={t('Add_people')} />
							)}
						/>
					</Field>
				</FieldGroup>
			</Modal.Content>
			<Modal.Footer>
				<Modal.FooterControllers>
					<Button onClick={onClose}>{t('Cancel')}</Button>
					<Button onClick={handleSubmit(handleCreateProject)} primary disabled={isLoading} loading={isLoading}>
						{t('Create')}
					</Button>
				</Modal.FooterControllers>
			</Modal.Footer>
		</Modal>
	);
};

export default EditProjectModal;
