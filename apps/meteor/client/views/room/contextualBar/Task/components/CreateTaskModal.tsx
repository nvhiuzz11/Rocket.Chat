import { type IUser } from '@rocket.chat/core-typings';
import { Modal, Button, TextInput, Field, FieldGroup, FieldLabel, FieldRow, FieldError, InputBox, Icon, Box } from '@rocket.chat/fuselage';
import { useEndpoint, useToastMessageDispatch, useTranslation } from '@rocket.chat/ui-contexts';
import { useState, useId, useEffect } from 'react';
import type { ReactElement } from 'react';
import { Controller, useForm } from 'react-hook-form';

import { TASK_PROPERTY_TYPES } from '../../../../../../definition/project';
import type { ITaskProperty } from '../../../../../../server/core-typings/ITaskProperty';
import type { ITaskTag } from '../../../../../../server/core-typings/ITaskTag';
import { PropertyInput } from '../../../../../components/PropertyProject/PropertyInput';
import PropertySettingsPanel from '../../../../../components/PropertyProject/PropertySettingsPanel';
import UserAutoCompleteWithObjectsRoom from '../../../../../components/UserAutoCompleteMultiple/UserAutoCompleteWithObjectsRoom';

type CreateTaskModalProps = {
	onClose: () => void;
	originalTaskProperties: ITaskProperty[] & { value: ITaskTag[] };
	projectId: string;
	reload: () => void;
	initialStatusProperty?: { taskPropertyId: string; value: ITaskTag['_id'] };
	roomId: string;
};

type CreateTaskModalPayload = {
	title: string;
	description: string;
	assignees: Pick<IUser, '_id' | 'username'>[];
	properties: { taskPropertyId: string; value: ITaskTag['_id'][] }[];
	projectId: string;
	dueDate?: Date;
};

const CreateTaskModal = ({
	onClose,
	originalTaskProperties,
	projectId,
	reload,
	initialStatusProperty,
	roomId,
}: CreateTaskModalProps): ReactElement => {
	const t = useTranslation();
	const [isLoading, setIsLoading] = useState(false);
	const [selectedProperty, setSelectedProperty] = useState<(ITaskProperty & { value: ITaskTag[] }) | null>(null);
	const [isPropertySettingsOpen, setIsPropertySettingsOpen] = useState(false);
	const [isNewProperty, setIsNewProperty] = useState(false);
	const [taskProperties, setTaskProperties] = useState<ITaskProperty[] & { value: ITaskTag[] }>(originalTaskProperties);
	const taskPropertiesEndpoint = useEndpoint('GET', '/v1/task-properties.list');

	const reloadTaskProperties = async () => {
		console.log('projectId CreateTaskModal', projectId);
		const { taskProperties = [] } = await taskPropertiesEndpoint({ projectId });
		console.log('taskProperties CreateTaskModal', taskProperties);
		setTaskProperties(taskProperties);

		// Update selectedProperty if it's currently open
		if (selectedProperty && !isNewProperty) {
			const updatedProperty = taskProperties.find((p: any) => p._id === selectedProperty._id);
			if (updatedProperty) {
				setSelectedProperty(updatedProperty);
			}
		}

		reload();
	};

	const [taskPropertySelected, setTaskPropertySelected] = useState<Array<{ taskPropertyId: string; value: string[] }>>(() => {
		if (!taskProperties) {
			return [];
		}

		let initialState = taskProperties.reduce<Array<{ taskPropertyId: string; value: string[] }>>((acc, property) => {
			if (property.required && property.value?.length) {
				const defaultOption = [...property.value].sort((a, b) => a.order - b.order)[0];
				if (defaultOption) {
					acc.push({
						taskPropertyId: property._id,
						value: [defaultOption._id],
					});
				}
			}
			return acc;
		}, []);

		if (initialStatusProperty?.taskPropertyId && initialStatusProperty.value) {
			const { taskPropertyId, value } = initialStatusProperty;

			const existingStatusIndex = initialState.findIndex((p) => p.taskPropertyId === taskPropertyId);

			const newStatus = {
				taskPropertyId,
				value: [value],
			};

			if (existingStatusIndex > -1) {
				initialState[existingStatusIndex] = newStatus;
			} else {
				initialState.push(newStatus);
			}
		}

		return initialState;
	});

	const addMembersId = useId();

	const createTaskEndpoint = useEndpoint('POST', '/v1/tasks.create');
	const dispatchToastMessage = useToastMessageDispatch();

	const {
		register,
		formState: { errors },
		handleSubmit,
		control,
	} = useForm<CreateTaskModalPayload>({
		defaultValues: {
			title: '',
			description: '',
			assignees: [],
			dueDate: undefined,
		},
	});

	const handleCreateTask = async ({ title, description, assignees, dueDate }: CreateTaskModalPayload): Promise<void> => {
		try {
			console.log('handleCreateTask', title, description, assignees, projectId, new Date(dueDate));
			console.log('taskPropertySelected', taskPropertySelected);

			setIsLoading(true);

			await createTaskEndpoint({
				title,
				description,
				properties: taskPropertySelected,
				assignees,
				projectId,
				dueDate: dueDate ? new Date(dueDate) : undefined,
			});
			dispatchToastMessage({ type: 'success', message: 'Task created successfully' });
			onClose();
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		} finally {
			setIsLoading(false);
			reload();
		}
	};

	const handlePropertyChange = (propertyId: string, newValue: string | string[]) => {
		setTaskPropertySelected((prev) => {
			// Convert newValue to array if it's a single string
			const valueArray = Array.isArray(newValue) ? newValue : [newValue];

			// Check if property already exists
			const existingIndex = prev.findIndex((item) => item.taskPropertyId === propertyId);

			if (existingIndex >= 0) {
				// Update existing property
				const updated = [...prev];
				updated[existingIndex] = { taskPropertyId: propertyId, value: valueArray };
				return updated;
			}

			// Add new property
			return [...prev, { taskPropertyId: propertyId, value: valueArray }];
		});
	};

	const getPropertyValue = (propertyId: string, propertyType: string) => {
		const selectedProperty = taskPropertySelected.find((p) => p.taskPropertyId === propertyId);
		if (!selectedProperty) {
			return propertyType === TASK_PROPERTY_TYPES.MULTI_SELECT ? [] : '';
		}
		return propertyType === TASK_PROPERTY_TYPES.MULTI_SELECT ? selectedProperty.value : selectedProperty.value[0] || '';
	};

	const handleOpenPropertySettings = (property: ITaskProperty & { value: ITaskTag[] }) => {
		setSelectedProperty(property);
		setIsNewProperty(false);
		setIsPropertySettingsOpen(true);
	};

	const handleAddNewProperty = () => {
		setSelectedProperty({
			_id: '',
			name: '',
			type: TASK_PROPERTY_TYPES.SELECT,
			projectId,
			order: 0,
			required: false,
			value: [],
		} as ITaskProperty & { value: ITaskTag[] });
		setIsNewProperty(true);
		setIsPropertySettingsOpen(true);
	};

	const handleClosePropertySettings = () => {
		setIsPropertySettingsOpen(false);
		setSelectedProperty(null);
		setIsNewProperty(false);
	};

	return (
		<Modal {...(isPropertySettingsOpen ? { width: 'x1200', maxWidth: '90vw' } : {})}>
			<Modal.Header>
				<Modal.Title>Create Task</Modal.Title>
				<Modal.Close onClick={onClose} />
			</Modal.Header>
			{isPropertySettingsOpen ? (
				<Box display='flex' height='600px'>
					<Modal.Content width='39rem' overflow='auto'>
						<FieldGroup>
							<Field>
								<FieldLabel>Title*</FieldLabel>
								<FieldRow>
									<TextInput
										{...register('title', { required: true })}
										placeholder='Task name'
										aria-invalid={errors.title ? 'true' : 'false'}
									/>
								</FieldRow>
								{errors.title && <FieldError>Title is required</FieldError>}
							</Field>

							<Field>
								<FieldLabel>Description</FieldLabel>
								<FieldRow>
									<TextInput {...register('description')} placeholder='Task description' />
								</FieldRow>
							</Field>

							<Field>
								<FieldLabel htmlFor={addMembersId}>{t('Assignees')}</FieldLabel>
								<Controller
									control={control}
									name='assignees'
									defaultValue={[]}
									render={({ field: { onChange, value } }): ReactElement => (
										<UserAutoCompleteWithObjectsRoom
											id={addMembersId}
											value={value}
											onChange={onChange}
											placeholder={t('Add_people')}
											roomId={roomId}
										/>
									)}
								/>
							</Field>

							<Field>
								<FieldLabel>{t('Due Date')}</FieldLabel>
								<FieldRow>
									<InputBox type='date' {...register('dueDate')} />
								</FieldRow>
							</Field>

							{taskProperties?.map((property) => (
								<Field key={property._id}>
									<Box display='flex' alignItems='center' justifyContent='space-between' mb='x4'>
										<FieldLabel>
											{property.name}
											{property.required && '*'}
										</FieldLabel>
										<Button
											square
											small
											onClick={() => handleOpenPropertySettings(property as ITaskProperty & { value: ITaskTag[] })}
											title='Property Settings'
										>
											<Icon name='customize' size='x16' />
										</Button>
									</Box>
									<FieldRow>
										<PropertyInput
											property={property}
											value={getPropertyValue(property._id, property.type)}
											onChange={(value) => handlePropertyChange(property._id, value)}
										/>
									</FieldRow>
								</Field>
							))}

							<Field>
								<FieldRow>
									<Button onClick={handleAddNewProperty} display='flex' alignItems='center'>
										<Icon name='plus' size='x16' />
										<Box mis='x4'>Add Property</Box>
									</Button>
								</FieldRow>
							</Field>
						</FieldGroup>
					</Modal.Content>

					{selectedProperty && (
						<Box flexGrow={1} flexShrink={0} borderInlineStart='x1' borderColor='stroke-extra-light' overflow='auto' mi='x16'>
							<PropertySettingsPanel
								onClose={handleClosePropertySettings}
								property={selectedProperty}
								projectId={projectId}
								reload={reloadTaskProperties}
								isNewProperty={isNewProperty}
							/>
						</Box>
					)}
				</Box>
			) : (
				<Modal.Content>
					<FieldGroup>
						<Field>
							<FieldLabel>Title*</FieldLabel>
							<FieldRow>
								<TextInput
									{...register('title', { required: true })}
									placeholder='Task name'
									aria-invalid={errors.title ? 'true' : 'false'}
								/>
							</FieldRow>
							{errors.title && <FieldError>Title is required</FieldError>}
						</Field>

						<Field>
							<FieldLabel>Description</FieldLabel>
							<FieldRow>
								<TextInput {...register('description')} placeholder='Task description' />
							</FieldRow>
						</Field>

						<Field>
							<FieldLabel htmlFor={addMembersId}>{t('Assignees')}</FieldLabel>
							<Controller
								control={control}
								name='assignees'
								defaultValue={[]}
								render={({ field: { onChange, value } }): ReactElement => (
									<UserAutoCompleteWithObjectsRoom
										id={addMembersId}
										value={value}
										onChange={onChange}
										placeholder={t('Add_people')}
										roomId={roomId}
									/>
								)}
							/>
						</Field>

						<Field>
							<FieldLabel>{t('Due Date')}</FieldLabel>
							<FieldRow>
								<InputBox type='date' {...register('dueDate')} />
							</FieldRow>
						</Field>

						{taskProperties?.map((property) => (
							<Field key={property._id}>
								<Box display='flex' alignItems='center' justifyContent='space-between' mb='x4'>
									<FieldLabel>
										{property.name}
										{property.required && '*'}
									</FieldLabel>
									<Button
										square
										small
										onClick={() => handleOpenPropertySettings(property as ITaskProperty & { value: ITaskTag[] })}
										title='Property Settings'
									>
										<Icon name='customize' size='x16' />
									</Button>
								</Box>
								<FieldRow>
									<PropertyInput
										property={property}
										value={getPropertyValue(property._id, property.type)}
										onChange={(value) => handlePropertyChange(property._id, value)}
									/>
								</FieldRow>
							</Field>
						))}

						{/* <Field> */}
						{/* <FieldRow> */}
						<Button onClick={handleAddNewProperty} display='flex' alignItems='center'>
							<Icon name='plus' size='x16' mie='x4' />
							Add Property
						</Button>
						{/* </FieldRow> */}
						{/* </Field> */}
					</FieldGroup>
				</Modal.Content>
			)}
			<Modal.Footer>
				<Modal.FooterControllers>
					<Button onClick={onClose}>{t('Cancel')}</Button>
					<Button onClick={handleSubmit(handleCreateTask)} primary disabled={isLoading} loading={isLoading}>
						{t('Create')}
					</Button>
				</Modal.FooterControllers>
			</Modal.Footer>
		</Modal>
	);
};

export default CreateTaskModal;
