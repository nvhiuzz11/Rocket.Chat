import {
	Modal,
	Button,
	TextInput,
	Field,
	FieldGroup,
	FieldLabel,
	FieldRow,
	FieldError,
	Box,
	Palette,
	InputBox,
} from '@rocket.chat/fuselage';
import { UserAvatar } from '@rocket.chat/ui-avatar';
import { useEndpoint, useToastMessageDispatch, useTranslation } from '@rocket.chat/ui-contexts';
import { useState, useMemo } from 'react';
import type { ReactElement } from 'react';
import { Controller, useForm } from 'react-hook-form';

import { TASK_PROPERTY_TYPES } from '../../../../../../definition/project';
import type { ITask, ITaskProperty, ITaskTag } from '../../../../../../server/core-typings';
import { PropertyInput } from '../../../../../components/PropertyProject/PropertyInput';
import UserAutoCompleteWithObjectsRoom from '../../../../../components/UserAutoCompleteMultiple/UserAutoCompleteWithObjectsRoom';

type TaskDetailModalProps = {
	onClose: () => void;
	taskProperties: (ITaskProperty & { value: ITaskTag[] })[];
	reload: () => void;
	task: ITask;
	roomId: string;
};

type UpdateTaskPayload = {
	title: string;
	description: string;
	assignees: ITask['assignees'];
	properties: Array<{ taskPropertyId: string; value: string[] }>;
	dueDate?: string;
};

const TaskDetailModal = ({ onClose, task, taskProperties, reload, roomId }: TaskDetailModalProps): ReactElement => {
	const t = useTranslation();
	const [isLoading, setIsLoading] = useState(false);
	const dispatchToastMessage = useToastMessageDispatch();
	const updateTaskEndpoint = useEndpoint('POST', '/v1/tasks.update');

	const [taskPropertySelected, setTaskPropertySelected] = useState<Array<{ taskPropertyId: string; value: string[] }>>(
		() => task.properties || [],
	);

	const formatDateForInput = (date: Date | string | undefined): string => {
		if (!date) {
			return '';
		}
		const d = new Date(date);
		const year = d.getFullYear();
		const month = String(d.getMonth() + 1).padStart(2, '0');
		const day = String(d.getDate()).padStart(2, '0');
		return `${year}-${month}-${day}`;
	};

	const {
		register,
		handleSubmit,
		control,
		formState: { errors, isDirty },
	} = useForm<UpdateTaskPayload>({
		defaultValues: {
			title: task.title,
			description: task.description,
			assignees: task.assignees,
			dueDate: task.dueDate ? formatDateForInput(task.dueDate) : '',
		},
	});

	const propertiesAreDirty = useMemo(() => {
		return JSON.stringify(task.properties) !== JSON.stringify(taskPropertySelected);
	}, [task.properties, taskPropertySelected]);

	const hasChanges = isDirty || propertiesAreDirty;

	const handlePropertyChange = (propertyId: string, newValue: string | string[]) => {
		setTaskPropertySelected((prev) => {
			const valueArray = Array.isArray(newValue) ? newValue : [newValue];
			const existingIndex = prev.findIndex((item) => item.taskPropertyId === propertyId);

			if (existingIndex >= 0) {
				const updated = [...prev];
				updated[existingIndex] = { taskPropertyId: propertyId, value: valueArray };
				return updated;
			}
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

	const handleUpdateTask = async (data: UpdateTaskPayload) => {
		setIsLoading(true);
		try {
			await updateTaskEndpoint({
				_id: task._id,
				payload: {
					...data,
					dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
					properties: taskPropertySelected,
				},
			});
			dispatchToastMessage({ type: 'success', message: t('Task_updated') });
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
				<Modal.Title>{t('Task_Details')}</Modal.Title>
				<Modal.Close onClick={onClose} />
			</Modal.Header>
			<Modal.Content>
				<FieldGroup>
					<Field>
						<FieldLabel>{t('Name')}*</FieldLabel>
						<FieldRow>
							<TextInput {...register('title', { required: true })} />
						</FieldRow>
						{errors.title && <FieldError>{t('error-field-required')}</FieldError>}
					</Field>

					<Field>
						<FieldLabel>{t('Description')}</FieldLabel>
						<FieldRow>
							<TextInput {...register('description')} />
						</FieldRow>
					</Field>

					<Field>
						<FieldLabel>{t('Assignees')}</FieldLabel>
						<Controller
							control={control}
							name='assignees'
							defaultValue={[]}
							render={({ field: { onChange, value } }): ReactElement => (
								<UserAutoCompleteWithObjectsRoom value={value} onChange={onChange} roomId={roomId} />
							)}
						/>
					</Field>

					<Field>
						<FieldLabel>{t('Due_Date')}</FieldLabel>
						<FieldRow>
							<InputBox type='date' {...register('dueDate')} />
						</FieldRow>
					</Field>

					{taskProperties?.map((property) => (
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
							>
								<UserAvatar size='x24' username={task.createdBy.username} />
								<Box is='span' mi='x8' withTruncatedText>
									{task.createdBy.username}
								</Box>
							</Box>
						</FieldRow>
					</Field>

					<Field>
						<FieldLabel>{t('Created_At')}</FieldLabel>
						<FieldRow>
							<TextInput value={new Date(task.createdAt).toLocaleString()} disabled />
						</FieldRow>
					</Field>
				</FieldGroup>
			</Modal.Content>
			<Modal.Footer>
				<Modal.FooterControllers>
					<Button onClick={onClose}>{t('Cancel')}</Button>
					<Button onClick={handleSubmit(handleUpdateTask)} primary disabled={!hasChanges || isLoading} loading={isLoading}>
						{t('Save_changes')}
					</Button>
				</Modal.FooterControllers>
			</Modal.Footer>
		</Modal>
	);
};

export default TaskDetailModal;
