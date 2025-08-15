import { Modal, Button, TextInput, Field, FieldGroup, FieldLabel, FieldRow, FieldError, Box, InputBox } from '@rocket.chat/fuselage';
import { useEndpoint, useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { useState } from 'react';
import type { ReactElement } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import type { IStage } from '../../../../../../server/core-typings/IStage';

type EditStageModalProps = {
	onClose: () => void;
	stage: IStage;
	reload: () => void;
};

type EditStagePayload = {
	name: string;
	color: string;
};

const EditStageModal = ({ onClose, stage, reload }: EditStageModalProps): ReactElement => {
	const { t } = useTranslation();
	const [isLoading, setIsLoading] = useState(false);
	const updateStageEndpoint = useEndpoint('POST', '/v1/stages.update');
	const dispatchToastMessage = useToastMessageDispatch();

	const {
		register,
		formState: { errors, isDirty },
		handleSubmit,
		watch,
		setValue,
	} = useForm<EditStagePayload>({
		defaultValues: {
			name: stage.name || '',
			color: stage.color || '#6b7280',
		},
	});

	const watchedValues = watch();
	const hasChanges = isDirty || watchedValues.name !== stage.name || watchedValues.color !== stage.color;

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

	const handleUpdateStage = async (data: EditStagePayload): Promise<void> => {
		try {
			setIsLoading(true);

			await updateStageEndpoint({
				stageId: stage._id,
				name: data.name,
				color: data.color,
			});

			dispatchToastMessage({ type: 'success', message: t('Stage_updated_successfully') });
			reload();
			onClose();
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: String(error) });
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<Modal>
			<Modal.Header>
				<Modal.Title>{t('Edit_Stage')}</Modal.Title>
				<Modal.Close onClick={onClose} />
			</Modal.Header>
			<Modal.Content>
				<FieldGroup>
					<Field>
						<FieldLabel>{t('Name')}*</FieldLabel>
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
								{/* <Box
									mi='x8'
									width='x40'
									height='x32'
									borderRadius='x4'
									style={{ backgroundColor: watchedValues.color }}
									border='1px solid'
									borderColor='stroke-light'
									flexShrink={0}
								/> */}
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
					<Button onClick={handleSubmit(handleUpdateStage)} primary disabled={!hasChanges || isLoading} loading={isLoading}>
						{t('Save_changes')}
					</Button>
				</Modal.FooterControllers>
			</Modal.Footer>
		</Modal>
	);
};

export default EditStageModal;
