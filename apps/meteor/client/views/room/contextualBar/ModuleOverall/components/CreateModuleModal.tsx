import { Button, ButtonGroup, Field, FieldGroup, FieldLabel, FieldRow, Modal, TextAreaInput, TextInput } from '@rocket.chat/fuselage';
import { useUniqueId } from '@rocket.chat/fuselage-hooks';
import { useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useEndpointAction } from '../../../../../hooks/useEndpointAction';

type CreateModuleModalProps = {
	roomId: string;
	onClose: () => void;
	onSuccess?: () => void;
};

const CreateModuleModal = ({ roomId, onClose, onSuccess }: CreateModuleModalProps) => {
	const { t } = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();

	const [formData, setFormData] = useState({
		name: '',
		description: '',
	});
	const [isLoading, setIsLoading] = useState(false);

	const nameId = useUniqueId();
	const descriptionId = useUniqueId();

	const createModule = useEndpointAction('POST', '/v1/modules.create');

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!formData.name.trim()) {
			dispatchToastMessage({ type: 'error', message: t('Please enter a module name') });
			return;
		}

		setIsLoading(true);

		try {
			await createModule({
				name: formData.name.trim(),
				description: formData.description.trim() || undefined,
				roomId,
				fieldDefinitions: [], // Start with empty field definitions
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

	const handleInputChange = (field: keyof typeof formData) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
		setFormData((prev) => ({ ...prev, [field]: e.target.value }));
	};

	return (
		<Modal>
			<Modal.Header>
				<Modal.Title>{t('Create_Module')}</Modal.Title>
				<Modal.Close onClick={onClose} />
			</Modal.Header>
			<Modal.Content>
				<form onSubmit={handleSubmit}>
					<FieldGroup>
						<Field>
							<FieldLabel htmlFor={nameId}>{t('Name')} *</FieldLabel>
							<FieldRow>
								<TextInput
									id={nameId}
									value={formData.name}
									onChange={handleInputChange('name')}
									placeholder={t('Enter_module_name')}
									maxLength={100}
									required
								/>
							</FieldRow>
						</Field>
						<Field>
							<FieldLabel htmlFor={descriptionId}>{t('Description')}</FieldLabel>
							<FieldRow>
								<TextAreaInput
									id={descriptionId}
									value={formData.description}
									onChange={handleInputChange('description')}
									placeholder={t('Enter_module_description')}
									rows={3}
									maxLength={500}
								/>
							</FieldRow>
						</Field>
					</FieldGroup>
				</form>
			</Modal.Content>
			<Modal.Footer>
				<ButtonGroup align='end'>
					<Button onClick={onClose}>{t('Cancel')}</Button>
					<Button primary loading={isLoading} onClick={handleSubmit}>
						{t('Create')}
					</Button>
				</ButtonGroup>
			</Modal.Footer>
		</Modal>
	);
};

export default CreateModuleModal;
