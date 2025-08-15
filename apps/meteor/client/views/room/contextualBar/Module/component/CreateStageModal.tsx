import { Modal, Button, TextInput, Field, FieldGroup, FieldLabel, FieldRow, FieldError, Box, InputBox } from '@rocket.chat/fuselage';
import { useEndpoint, useToastMessageDispatch, useTranslation } from '@rocket.chat/ui-contexts';
import { useState } from 'react';
import type { ReactElement } from 'react';
import { useForm } from 'react-hook-form';

type CreateStageModalProps = {
	onClose: () => void;
	moduleId: string;
	reload: () => void;
};

type CreateStageModalPayload = {
	name: string;
	color: string;
};

const CreateStageModal = ({ onClose, moduleId, reload }: CreateStageModalProps): ReactElement => {
	const t = useTranslation();
	const [isLoading, setIsLoading] = useState(false);

	const createStageEndpoint = useEndpoint('POST', '/v1/stages.create');
	const dispatchToastMessage = useToastMessageDispatch();

	const {
		register,
		formState: { errors },
		handleSubmit,
		watch,
		setValue,
	} = useForm<CreateStageModalPayload>({
		defaultValues: {
			name: '',
			color: '#3b82f6',
		},
	});

	const watchedValues = watch();

	const handleCreateStage = async ({ name, color }: CreateStageModalPayload): Promise<void> => {
		try {
			setIsLoading(true);

			await createStageEndpoint({
				moduleId,
				name,
				color,
			});

			dispatchToastMessage({ type: 'success', message: t('Stage_created_successfully') });
			reload();
			onClose();
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: String(error) });
		} finally {
			setIsLoading(false);
		}
	};

	const predefinedColors = [
		'#3b82f6', // Blue
		'#10b981', // Green
		'#f59e0b', // Yellow
		'#ef4444', // Red
		'#8b5cf6', // Purple
		'#06b6d4', // Cyan
		'#f97316', // Orange
		'#84cc16', // Lime
		'#ec4899', // Pink
		'#6b7280', // Gray
	];

	return (
		<Modal>
			<Modal.Header>
				<Modal.Title>{t('Create_Stage')}</Modal.Title>
				<Modal.Close onClick={onClose} />
			</Modal.Header>
			<Modal.Content>
				<FieldGroup>
					<Field>
						<FieldLabel>{t('Stage_Name')}*</FieldLabel>
						<FieldRow>
							<TextInput
								{...register('name', { required: true })}
								placeholder={t('Enter_stage_name')}
								aria-invalid={errors.name ? 'true' : 'false'}
							/>
						</FieldRow>
						{errors.name && <FieldError>{t('Stage_name_is_required')}</FieldError>}
					</Field>

					<Field>
						<FieldLabel>{t('Color')}</FieldLabel>
						<FieldRow>
							<Box display='flex' alignItems='center' width='100%'>
								<Box display='flex' alignItems='center' position='relative' flexGrow={1}>
									<TextInput
										{...register('color')}
										placeholder={t('Enter_color_code')}
										style={{ paddingRight: '50px', width: '120px' }}
										value={watchedValues.color}
									/>
									<Box display='flex' alignItems='center'>
										<InputBox
											type='color'
											value={watchedValues.color}
											onChange={(e) => {
												const newColor = (e.target as HTMLInputElement).value;
												setValue('color', newColor);
											}}
											style={{
												width: '40px',
												height: '32px',
												padding: '2px',
												border: '1px solid',
												borderRadius: '4px',
												cursor: 'pointer',
											}}
										/>
									</Box>
								</Box>
							</Box>
						</FieldRow>
						<Box marginBlockStart='x8'>
							<Box display='flex' flexWrap='wrap' style={{ gap: '4px' }}>
								{predefinedColors.map((color) => (
									<Box
										key={color}
										width='x24'
										height='x24'
										borderRadius='x4'
										style={{
											backgroundColor: color,
											cursor: 'pointer',
											border: watchedValues.color === color ? '2px solid #1f2937' : '2px solid transparent',
										}}
										onClick={() => setValue('color', color)}
										title={color}
									/>
								))}
							</Box>
						</Box>
					</Field>
				</FieldGroup>
			</Modal.Content>
			<Modal.Footer>
				<Modal.FooterControllers>
					<Button onClick={onClose}>{t('Cancel')}</Button>
					<Button onClick={handleSubmit(handleCreateStage)} primary disabled={isLoading} loading={isLoading}>
						{t('Create')}
					</Button>
				</Modal.FooterControllers>
			</Modal.Footer>
		</Modal>
	);
};

export default CreateStageModal;
