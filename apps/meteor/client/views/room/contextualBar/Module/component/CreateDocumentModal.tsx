import { Modal, Button, TextInput, Field, FieldGroup, FieldLabel, FieldRow, FieldError, Select, Box, Icon } from '@rocket.chat/fuselage';
import { useEndpoint, useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { useState, useMemo, useEffect } from 'react';
import type { ReactElement } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { MODULE_FIELD_TYPES } from '../../../../../../definition/IModuleConfig';
import type { IModule, IFieldDefinition } from '../../../../../../server/core-typings/IModule';
import type { IStage } from '../../../../../../server/core-typings/IStage';
import { FieldSettingsPanel, DocumentFieldInput } from '../../../../../components/ModuleFieldCustom';

type CreateDocumentModalProps = {
	onClose: () => void;
	module: IModule;
	stages: IStage[];
	reload: () => void;
	initialStageId?: string;
};

type CreateDocumentModalPayload = {
	name: string;
	description: string;
	stageId: string;
	customFields: { fieldId: string; value: any }[];
};

const CreateDocumentModal = ({ onClose, module, stages, reload, initialStageId }: CreateDocumentModalProps): ReactElement => {
	const { t } = useTranslation();
	const [isLoading, setIsLoading] = useState(false);
	const [selectedField, setSelectedField] = useState<IFieldDefinition | null>(null);
	const [isFieldSettingsOpen, setIsFieldSettingsOpen] = useState(false);
	const [isNewField, setIsNewField] = useState(false);
	const [moduleFields, setModuleFields] = useState<IFieldDefinition[]>(module.fieldDefinitions || []);

	const createDocumentEndpoint = useEndpoint('POST', '/v1/documents.create');
	const moduleFieldsEndpoint = useEndpoint('GET', '/v1/modules.fields.list');
	const dispatchToastMessage = useToastMessageDispatch();

	const reloadModuleFields = async () => {
		const { fieldDefinitions = [] } = await moduleFieldsEndpoint({ moduleId: module._id });
		setModuleFields(fieldDefinitions);

		// Update selectedField if it's currently open
		if (selectedField && !isNewField) {
			const updatedField = fieldDefinitions.find((f: any) => f._id === selectedField._id);
			if (updatedField) {
				setSelectedField(updatedField);
			}
		}

		reload();
	};

	const stageOptions = useMemo(() => {
		return stages.map((stage) => [stage._id, stage.name] as [string, string]);
	}, [stages]);

	const {
		register,
		formState: { errors },
		handleSubmit,
		control,
		watch,
		setValue,
	} = useForm<CreateDocumentModalPayload>({
		defaultValues: {
			name: '',
			description: '',
			stageId: initialStageId || stages[0]?._id || '',
			customFields:
				moduleFields?.map((field) => ({
					fieldId: field._id,
					value: getDefaultFieldValue(field),
				})) || [],
		},
	});

	function getDefaultFieldValue(field: any) {
		switch (field.type) {
			case MODULE_FIELD_TYPES.TEXT:
			case MODULE_FIELD_TYPES.TEXTAREA:
				return '';
			case MODULE_FIELD_TYPES.NUMBER:
				return 0;
			case MODULE_FIELD_TYPES.SELECT:
				return field.options?.[0]?._id || '';
			case MODULE_FIELD_TYPES.MULTI_SELECT:
				return [];
			case MODULE_FIELD_TYPES.CHECKBOX:
				return false;
			case MODULE_FIELD_TYPES.DATE:
				return '';
			case MODULE_FIELD_TYPES.USER:
				return [];
			case MODULE_FIELD_TYPES.CHANNEL:
				return [];
			default:
				return '';
		}
	}

	const watchedCustomFields = watch('customFields');

	// Update form when moduleFields change
	useEffect(() => {
		const newCustomFields =
			moduleFields?.map((field) => ({
				fieldId: field._id,
				value: getDefaultFieldValue(field),
			})) || [];

		// Only update if fields changed
		const currentFields = watchedCustomFields.map((f) => f.fieldId);
		const newFields = newCustomFields.map((f) => f.fieldId);

		if (JSON.stringify(currentFields) !== JSON.stringify(newFields)) {
			// Preserve existing values for fields that already exist, add defaults for new fields
			const updatedCustomFields = newCustomFields.map((newField) => {
				const existingField = watchedCustomFields.find((cf) => cf.fieldId === newField.fieldId);
				return existingField || newField;
			});

			// Update the form with new custom fields
			setValue('customFields', updatedCustomFields);
		}
	}, [moduleFields, watchedCustomFields, setValue]);

	const handleCreateDocument = async (data: CreateDocumentModalPayload): Promise<void> => {
		try {
			setIsLoading(true);

			await createDocumentEndpoint({
				moduleId: module._id,
				name: data.name,
				description: data.description,
				stageId: data.stageId,
				customFields: data.customFields.filter((field) => field.value !== '' && field.value !== null),
			});

			dispatchToastMessage({ type: 'success', message: t('Document_created_successfully') });
			reload();
			onClose();
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: String(error) });
		} finally {
			setIsLoading(false);
		}
	};

	const handleOpenFieldSettings = (field: IFieldDefinition) => {
		setSelectedField(field);
		setIsNewField(false);
		setIsFieldSettingsOpen(true);
	};

	const handleAddNewField = () => {
		setSelectedField({
			_id: '',
			name: '',
			type: MODULE_FIELD_TYPES.TEXT,
			moduleId: module._id,
			order: moduleFields.length,
			isRequired: false,
			options: [],
		} as IFieldDefinition);
		setIsNewField(true);
		setIsFieldSettingsOpen(true);
	};

	const handleCloseFieldSettings = () => {
		setIsFieldSettingsOpen(false);
		setSelectedField(null);
		setIsNewField(false);
	};

	const renderFieldInput = (field: any, fieldIndex: number) => {
		return (
			<Controller
				control={control}
				name={`customFields.${fieldIndex}.value`}
				render={({ field: controllerField }) => (
					<DocumentFieldInput field={field} value={controllerField.value} onChange={controllerField.onChange} roomId={module.roomId} />
				)}
			/>
		);
	};

	return (
		<Modal {...(isFieldSettingsOpen ? { width: 'x1200', maxWidth: '90vw' } : {})}>
			<Modal.Header>
				<Modal.Title>Create Document</Modal.Title>
				<Modal.Close onClick={onClose} />
			</Modal.Header>
			{isFieldSettingsOpen ? (
				<Box display='flex' height='600px'>
					<Modal.Content width='39rem' overflow='auto'>
						<FieldGroup>
							<Field>
								<Box display='flex' alignItems='center' mb='x4'>
									<FieldLabel
										width='140px'
										flexShrink={0}
										marginInlineEnd='x12'
										title='Name*'
										style={{
											whiteSpace: 'nowrap',
											overflow: 'hidden',
											textOverflow: 'ellipsis',
										}}
									>
										Name*
									</FieldLabel>
									<Box flexGrow={1}>
										<TextInput
											{...register('name', { required: true })}
											placeholder='Enter document name'
											aria-invalid={errors.name ? 'true' : 'false'}
											width='100%'
										/>
									</Box>
								</Box>
								{errors.name && <FieldError>Document name is required</FieldError>}
							</Field>

							<Field>
								<Box display='flex' alignItems='center' mb='x4'>
									<FieldLabel
										width='140px'
										flexShrink={0}
										marginInlineEnd='x12'
										whiteSpace='nowrap'
										overflow='hidden'
										textOverflow='ellipsis'
										title='Description'
									>
										Description
									</FieldLabel>
									<Box flexGrow={1}>
										<TextInput {...register('description')} placeholder='Enter description' width='100%' />
									</Box>
								</Box>
							</Field>

							<Field>
								<Box display='flex' alignItems='center' mb='x4'>
									<FieldLabel
										width='140px'
										flexShrink={0}
										marginInlineEnd='x12'
										whiteSpace='nowrap'
										overflow='hidden'
										textOverflow='ellipsis'
										title='Stage*'
									>
										Stage*
									</FieldLabel>
									<Box flexGrow={1} width='100%'>
										<Controller
											control={control}
											name='stageId'
											rules={{ required: true }}
											render={({ field }) => <Select {...field} options={stageOptions} placeholder='Select stage' width='100%' />}
										/>
									</Box>
								</Box>
								{errors.stageId && <FieldError>Stage is required</FieldError>}
							</Field>

							{/* Dynamic Custom Fields */}
							{moduleFields
								?.sort((a, b) => a.order - b.order)
								.map((field, fieldIndex) => (
									<Field key={field._id}>
										<Box display='flex' alignItems='center' mb='x4'>
											<Box display='flex' alignItems='center' width='140px' flexShrink={0} marginInlineEnd='x12'>
												<FieldLabel
													flexGrow={1}
													title={`${field.name}${field.isRequired ? '*' : ''}`}
													style={{
														whiteSpace: 'nowrap',
														overflow: 'hidden',
														textOverflow: 'ellipsis',
													}}
												>
													{field.name}
													{field.isRequired && '*'}
												</FieldLabel>
												<Button
													square
													tiny
													onClick={() => handleOpenFieldSettings(field)}
													title='Field Settings'
													marginInlineStart='x4'
													flexShrink={0}
												>
													<Icon name='customize' size='x16' />
												</Button>
											</Box>
											<Box flexGrow={1}>{renderFieldInput(field, fieldIndex)}</Box>
										</Box>
										{field.isRequired && !watchedCustomFields[fieldIndex]?.value && <FieldError>Field is required</FieldError>}
									</Field>
								))}

							<Button onClick={handleAddNewField} display='flex' alignItems='center'>
								<Icon name='plus' size='x16' mie='x4' />
								Add Field
							</Button>
						</FieldGroup>
					</Modal.Content>

					{selectedField && (
						<Box flexGrow={1} flexShrink={0} borderInlineStart='x1' borderColor='stroke-extra-light' overflow='auto' mi='x16'>
							<FieldSettingsPanel
								onClose={handleCloseFieldSettings}
								field={selectedField}
								moduleId={module._id}
								reload={reloadModuleFields}
								isNewField={isNewField}
							/>
						</Box>
					)}
				</Box>
			) : (
				<Modal.Content>
					<FieldGroup>
						<Field>
							<Box display='flex' alignItems='center' mb='x4'>
								<FieldLabel
									width='120px'
									flexShrink={0}
									marginInlineEnd='x12'
									title='Name*'
									style={{
										whiteSpace: 'nowrap',
										overflow: 'hidden',
										textOverflow: 'ellipsis',
									}}
								>
									Name*
								</FieldLabel>
								<Box flexGrow={1}>
									<TextInput
										{...register('name', { required: true })}
										placeholder='Enter document name'
										aria-invalid={errors.name ? 'true' : 'false'}
										width='100%'
									/>
								</Box>
							</Box>
							{errors.name && <FieldError>Document name is required</FieldError>}
						</Field>

						<Field>
							<Box display='flex' alignItems='center' mb='x4'>
								<FieldLabel
									width='120px'
									flexShrink={0}
									marginInlineEnd='x12'
									title='Description'
									style={{
										whiteSpace: 'nowrap',
										overflow: 'hidden',
										textOverflow: 'ellipsis',
									}}
								>
									Description
								</FieldLabel>
								<Box flexGrow={1}>
									<TextInput {...register('description')} placeholder='Enter description' width='100%' />
								</Box>
							</Box>
						</Field>

						<Field>
							<Box display='flex' alignItems='center' mb='x4'>
								<FieldLabel
									width='140px'
									flexShrink={0}
									marginInlineEnd='x12'
									title='Stage*'
									style={{
										whiteSpace: 'nowrap',
										overflow: 'hidden',
										textOverflow: 'ellipsis',
									}}
								>
									Stage*
								</FieldLabel>
								<Box flexGrow={1}>
									<Controller
										control={control}
										name='stageId'
										rules={{ required: true }}
										render={({ field }) => <Select {...field} options={stageOptions} placeholder='Select stage' width='100%' />}
									/>
								</Box>
							</Box>
							{errors.stageId && <FieldError>Stage is required</FieldError>}
						</Field>

						{/* Dynamic Custom Fields */}
						{moduleFields
							?.sort((a, b) => a.order - b.order)
							.map((field, fieldIndex) => (
								<Field key={field._id}>
									<Box display='flex' alignItems='center' mb='x4'>
										<Box display='flex' alignItems='center' width='140px' flexShrink={0} marginInlineEnd='x12'>
											<FieldLabel
												flexGrow={1}
												title={`${field.name}${field.isRequired ? '*' : ''}`}
												style={{
													whiteSpace: 'nowrap',
													overflow: 'hidden',
													textOverflow: 'ellipsis',
												}}
											>
												{field.name}
												{field.isRequired && '*'}
											</FieldLabel>
											<Button
												square
												tiny
												onClick={() => handleOpenFieldSettings(field)}
												title='Field Settings'
												marginInlineStart='x4'
												flexShrink={0}
											>
												<Icon name='customize' size='x12' />
											</Button>
										</Box>
										<Box flexGrow={1}>{renderFieldInput(field, fieldIndex)}</Box>
									</Box>
									{field.isRequired && !watchedCustomFields[fieldIndex]?.value && <FieldError>Field is required</FieldError>}
								</Field>
							))}

						<Button onClick={handleAddNewField} display='flex' alignItems='center'>
							<Icon name='plus' size='x16' mie='x4' />
							Add Field
						</Button>
					</FieldGroup>
				</Modal.Content>
			)}
			<Modal.Footer>
				<Modal.FooterControllers>
					<Button onClick={onClose}>{t('Cancel')}</Button>
					<Button onClick={handleSubmit(handleCreateDocument)} primary disabled={isLoading} loading={isLoading}>
						{t('Create')}
					</Button>
				</Modal.FooterControllers>
			</Modal.Footer>
		</Modal>
	);
};

export default CreateDocumentModal;
