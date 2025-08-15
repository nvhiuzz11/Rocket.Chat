import {
	Button,
	ButtonGroup,
	Field,
	FieldGroup,
	FieldLabel,
	FieldRow,
	Modal,
	TextAreaInput,
	TextInput,
	Box,
	Palette,
} from '@rocket.chat/fuselage';
import { useUniqueId } from '@rocket.chat/fuselage-hooks';
import { UserAvatar } from '@rocket.chat/ui-avatar';
import { useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import type { IModule } from '../../../../../../server/core-typings/IModule';
import { useEndpointAction } from '../../../../../hooks/useEndpointAction';

type ModuleDetailModalProps = {
	module: IModule;
	onClose: () => void;
	onSuccess?: () => void;
};

type UpdateModulePayload = {
	name: string;
	description: string;
};

const ModuleDetailModal = ({ module, onClose, onSuccess }: ModuleDetailModalProps) => {
	const { t } = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();
	const [isLoading, setIsLoading] = useState(false);

	const nameId = useUniqueId();
	const descriptionId = useUniqueId();

	const updateModule = useEndpointAction('POST', '/v1/modules.update');

	const {
		register,
		handleSubmit,
		formState: { errors, isDirty },
		watch,
	} = useForm<UpdateModulePayload>({
		defaultValues: {
			name: module.name || '',
			description: module.description || '',
		},
	});

	const watchedValues = watch();

	const hasChanges = useMemo(() => {
		return isDirty || watchedValues.name !== module.name || watchedValues.description !== (module.description || '');
	}, [isDirty, watchedValues, module]);

	const onSubmit = async (data: UpdateModulePayload) => {
		if (!data.name.trim()) {
			dispatchToastMessage({ type: 'error', message: t('Please enter a module name') });
			return;
		}

		setIsLoading(true);

		try {
			await updateModule({
				moduleId: module._id,
				name: data.name.trim(),
				description: data.description.trim(),
			});

			dispatchToastMessage({ type: 'success', message: t('Module_updated_successfully') });
			onSuccess?.();
			onClose();
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: t('Error_updating_module') });
		} finally {
			setIsLoading(false);
		}
	};

	const formatDate = (date: Date | string | undefined): string => {
		if (!date) return '';
		return new Date(date).toLocaleString();
	};

	return (
		<Modal>
			<Modal.Header>
				<Modal.Title>{t('Module_Details')}</Modal.Title>
				<Modal.Close onClick={onClose} />
			</Modal.Header>
			<Modal.Content>
				<form onSubmit={handleSubmit(onSubmit)}>
					<FieldGroup>
						{/* Editable Fields */}
						<Field>
							<FieldLabel htmlFor={nameId}>{t('Name')} *</FieldLabel>
							<FieldRow>
								<TextInput
									id={nameId}
									{...register('name', { required: true })}
									placeholder={t('Enter_module_name')}
									maxLength={100}
									aria-invalid={errors.name ? 'true' : 'false'}
								/>
							</FieldRow>
							{errors.name && (
								<FieldRow>
									<Box color='danger' fontSize='x12'>
										{t('Module_name_is_required')}
									</Box>
								</FieldRow>
							)}
						</Field>

						<Field>
							<FieldLabel htmlFor={descriptionId}>{t('Description')}</FieldLabel>
							<FieldRow>
								<TextAreaInput
									id={descriptionId}
									{...register('description')}
									placeholder={t('Enter_module_description')}
									rows={3}
									maxLength={500}
								/>
							</FieldRow>
						</Field>

						{/* Read-only Fields */}
						<Field>
							<FieldLabel>{t('Created_By')}</FieldLabel>
							<FieldRow>
								<Box
									display='flex'
									alignItems='center'
									w='full'
									p='x8'
									backgroundColor={Palette.surface['surface-tint']}
									borderColor='#404754'
									borderWidth='x1'
									borderRadius='x4'
									color={Palette.text['font-hint']}
									cursor='not-allowed'
								>
									{module.createdBy && (
										<>
											<UserAvatar size='x24' userId={module.createdBy._id} />
											<Box is='span' mi='x8' withTruncatedText>
												{module.createdBy.username || module.createdBy.name}
											</Box>
										</>
									)}
								</Box>
							</FieldRow>
						</Field>

						<Field>
							<FieldLabel>{t('Created_At')}</FieldLabel>
							<FieldRow>
								<TextInput
									value={formatDate(module.createdAt)}
									disabled
									style={{
										cursor: 'not-allowed',
									}}
								/>
							</FieldRow>
						</Field>
					</FieldGroup>
				</form>
			</Modal.Content>
			<Modal.Footer>
				<ButtonGroup align='end'>
					<Button onClick={onClose}>{t('Cancel')}</Button>
					<Button primary loading={isLoading} onClick={handleSubmit(onSubmit)} disabled={!hasChanges || isLoading}>
						{t('Save_changes')}
					</Button>
				</ButtonGroup>
			</Modal.Footer>
		</Modal>
	);
};

export default ModuleDetailModal;
