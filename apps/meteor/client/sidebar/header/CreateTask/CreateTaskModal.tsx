import { Modal, Button, TextInput, Field, FieldGroup, FieldLabel, FieldRow, FieldError, FieldHint } from '@rocket.chat/fuselage';
import { useEndpoint, useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import { useForm, Controller } from 'react-hook-form';

import UserAutoCompleteMultiple from '../../../components/UserAutoCompleteMultiple';

type CreateTaskModalProps = {
	onClose: () => void;
};

type CreateTaskModalPayload = {
	title: string;
	description: string;
	assigneeIds: string[];
	dueDate: string;
};

const CreateTaskModal = ({ onClose }: CreateTaskModalProps): ReactElement => {
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
			assigneeIds: [],
			dueDate: '',
		},
	});

	const handleCreateTask = async ({ title, description, assigneeIds, dueDate }: CreateTaskModalPayload): Promise<void> => {
		try {
			await createTaskEndpoint({
				title,
				description,
				assigneeIds,
				dueDate,
			});
			dispatchToastMessage({ type: 'success', message: 'Task created successfully' });
			onClose();
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	};

	return (
		<Modal>
			<Modal.Header>
				<Modal.Title>Create Task</Modal.Title>
				<Modal.Close onClick={onClose} />
			</Modal.Header>
			<Modal.Content>
				<FieldGroup>
					<Field>
						<FieldLabel>Title*</FieldLabel>
						<FieldRow>
							<TextInput
								{...register('title', { required: true })}
								placeholder='Task title'
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
						<FieldLabel>Assign to</FieldLabel>
						<FieldRow>
							<Controller
								control={control}
								name='assigneeIds'
								render={({ field: { onChange, value } }) => (
									<UserAutoCompleteMultiple value={value} onChange={onChange} placeholder='Type username to assign' />
								)}
							/>
						</FieldRow>
					</Field>

					<Field>
						<FieldLabel>Due date</FieldLabel>
						<FieldRow>
							<TextInput {...register('dueDate')} placeholder='YYYY-MM-DD' type='date' />
						</FieldRow>
						<FieldHint>Optional due date for the task</FieldHint>
					</Field>
				</FieldGroup>
			</Modal.Content>
			<Modal.Footer>
				<Modal.FooterControllers>
					<Button onClick={onClose}>Cancel</Button>
					<Button onClick={handleSubmit(handleCreateTask)} primary>
						Create
					</Button>
				</Modal.FooterControllers>
			</Modal.Footer>
		</Modal>
	);
};

export default CreateTaskModal;
