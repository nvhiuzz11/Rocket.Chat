import {
	Button,
	ButtonGroup,
	Field,
	FieldGroup,
	FieldLabel,
	FieldRow,
	FieldError,
	Modal,
	TextAreaInput,
	TextInput,
} from '@rocket.chat/fuselage';
import { useUniqueId } from '@rocket.chat/fuselage-hooks';
import { useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { useState } from 'react';
import type { ReactElement } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { useEndpointAction } from '../../../../../hooks/useEndpointAction';

type CreateModuleModalProps = {
	roomId: string;
	onClose: () => void;
	onSuccess?: () => void;
};

type CreateModuleModalPayload = {
	name: string;
	description: string;
};

const CreateModuleModal = ({ roomId, onClose, onSuccess }: CreateModuleModalProps): ReactElement => {
	const { t } = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();
	const [isLoading, setIsLoading] = useState(false);

	const nameId = useUniqueId();
	const descriptionId = useUniqueId();

	const createModule = useEndpointAction('POST', '/v1/modules.create');

	const {
		register,
		formState: { errors },
		handleSubmit,
	} = useForm<CreateModuleModalPayload>({
		defaultValues: {
			name: '',
			description: '',
		},
	});

	const handleCreateModule = async ({ name, description }: CreateModuleModalPayload): Promise<void> => {
		try {
			setIsLoading(true);

			await createModule({
				name: name.trim(),
				description: description.trim(),
				roomId,
				fieldDefinitions: [],
			});

			dispatchToastMessage({ type: 'success', message: t('Module created successfully') });
			onSuccess?.();
			onClose();
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: t('Error_creating_module') });
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<Modal>
			<Modal.Header>
				<Modal.Title>{t('Create_Module')}</Modal.Title>
				<Modal.Close onClick={onClose} />
			</Modal.Header>
			<Modal.Content>
				<FieldGroup>
					<Field>
						<FieldLabel htmlFor={nameId}>{t('Name')} *</FieldLabel>
						<FieldRow>
							<TextInput
								id={nameId}
								{...register('name', {
									required: true,
									maxLength: { value: 100, message: t('Name must be less than 100 characters') },
									validate: (value) => value.trim() !== '' || t('Name cannot be empty'),
								})}
								placeholder={t('Enter_module_name')}
								aria-invalid={errors.name ? 'true' : 'false'}
							/>
						</FieldRow>
						{errors.name && <FieldError>{t('Name cannot be empty')}</FieldError>}
					</Field>
					<Field>
						<FieldLabel htmlFor={descriptionId}>{t('Description')}</FieldLabel>
						<FieldRow>
							<TextAreaInput
								id={descriptionId}
								{...register('description', {
									maxLength: { value: 500, message: t('Description must be less than 500 characters') },
								})}
								placeholder={t('Enter_module_description')}
								rows={3}
								aria-invalid={errors.description ? 'true' : 'false'}
							/>
						</FieldRow>
					</Field>
				</FieldGroup>
			</Modal.Content>
			<Modal.Footer>
				<ButtonGroup align='end'>
					<Button onClick={onClose}>{t('Cancel')}</Button>
					<Button primary loading={isLoading} onClick={handleSubmit(handleCreateModule)}>
						{t('Create')}
					</Button>
				</ButtonGroup>
			</Modal.Footer>
		</Modal>
	);
};

export default CreateModuleModal;
