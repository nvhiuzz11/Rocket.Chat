import { Modal, Button, TextInput, Field, FieldGroup, FieldLabel, FieldRow, FieldError, Box, Icon, Palette } from '@rocket.chat/fuselage';
import { UserAvatar, RoomAvatar } from '@rocket.chat/ui-avatar';
import { useEndpoint, useToastMessageDispatch, useTranslation } from '@rocket.chat/ui-contexts';
import { useState, useMemo, useId, useEffect } from 'react';
import type { ReactElement } from 'react';
import { useForm, Controller } from 'react-hook-form';

import type { IProject } from '../../../../../../server/core-typings/IProject';
import UserAutoCompleteMultipleProjectMembers from '../../../../../components/UserAutoCompleteMultiple/UserAutoCompleteMultipleProjectMembers';

type ProjectDetailModalProps = {
	onClose: () => void;
	teamId: string;
	reload: () => void;
	project: IProject & { room: any };
};

type UpdateProjectPayload = {
	name: string;
	description: string;
	members: string[];
};

const ProjectDetailModal = ({ onClose, project, teamId, reload }: ProjectDetailModalProps): ReactElement => {
	const t = useTranslation();
	const [isLoading, setIsLoading] = useState(false);
	const [currentMembers, setCurrentMembers] = useState<string[]>([]);
	const addMembersId = useId();
	const dispatchToastMessage = useToastMessageDispatch();
	const updateProjectEndpoint = useEndpoint('POST', '/v1/projects.update');
	const getProjectInfoEndpoint = useEndpoint('GET', '/v1/projects.info');
	const inviteUserToGroupEndpoint = useEndpoint('POST', '/v1/groups.invite');
	const kickUserFromGroupEndpoint = useEndpoint('POST', '/v1/groups.kick');

	const {
		register,
		handleSubmit,
		control,
		watch,
		setValue,
		formState: { errors, isDirty },
	} = useForm<UpdateProjectPayload>({
		defaultValues: {
			name: project.name,
			description: project.description,
			members: [],
		},
	});

	const watchedMembers = watch('members');

	// Load current members on component mount
	useEffect(() => {
		const loadCurrentMembers = async () => {
			try {
				const projectInfo = await getProjectInfoEndpoint({ _id: project._id });
				const memberIds = (projectInfo.project as any).members?.map((member: any) => member._id) || [];
				setCurrentMembers(memberIds);
				setValue('members', memberIds);
			} catch (error) {
				console.error('Error loading project members:', error);
			}
		};
		loadCurrentMembers();
	}, [getProjectInfoEndpoint, project._id, setValue]);

	const membersAreDirty = useMemo(() => {
		return JSON.stringify(currentMembers.sort()) !== JSON.stringify((watchedMembers || []).sort());
	}, [currentMembers, watchedMembers]);

	const hasChanges = isDirty || membersAreDirty;

	const handleUpdateProject = async (data: UpdateProjectPayload) => {
		setIsLoading(true);
		try {
			// Update project basic info and properties
			await updateProjectEndpoint({
				_id: project._id,
				data: {
					name: data.name,
					description: data.description,
				},
			});

			// Handle members changes
			if (membersAreDirty) {
				const newMembers = data.members || [];
				const membersToAdd = newMembers.filter((memberId) => !currentMembers.includes(memberId));
				const membersToRemove = currentMembers.filter((memberId) => !newMembers.includes(memberId));

				// Add new members
				await Promise.all(
					membersToAdd.map(async (userId) => {
						try {
							await inviteUserToGroupEndpoint({
								roomId: project.roomId,
								userId,
							});
						} catch (error) {
							console.error(`Error adding member ${userId}:`, error);
						}
					}),
				);

				// Remove members
				await Promise.all(
					membersToRemove.map(async (userId) => {
						try {
							await kickUserFromGroupEndpoint({
								roomId: project.roomId,
								userId,
							});
						} catch (error) {
							console.error(`Error removing member ${userId}:`, error);
						}
					}),
				);
			}

			dispatchToastMessage({ type: 'success', message: 'Project updated successfully' });
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
				<Modal.Title>Project Details</Modal.Title>
				<Modal.Close onClick={onClose} />
			</Modal.Header>
			<Modal.Content>
				<FieldGroup>
					{/* Editable fields */}
					<Field>
						<FieldLabel>{t('Name')}*</FieldLabel>
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
						<FieldLabel>{t('Description')}</FieldLabel>
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
								<UserAutoCompleteMultipleProjectMembers
									id={addMembersId}
									value={value || []}
									onChange={onChange}
									placeholder={t('Add_people')}
									teamId={teamId}
								/>
							)}
						/>
					</Field>

					{/* {projectProperties?.map((property) => (
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
					))} */}

					{/* Read-only fields */}
					<Field>
						<FieldLabel>{t('Channel')}</FieldLabel>

						{/* <FieldRow>
							<TextInput value={project.room.name} disabled />
							<RoomAvatar size='x24' room={project.room} />
							<Box is='span' mi='x8' withTruncatedText>
								<Icon name='hashtag-lock' size='x15' />
								{project.room.name}
							</Box>
						</FieldRow> */}

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
							<RoomAvatar size='x24' room={project.room} />
							<Box is='span' mi='x8' withTruncatedText>
								{project.room.t === 'c' ? <Icon name='hash' size='x15' /> : <Icon name='hashtag-lock' size='x15' />}
								{project.room.name}
							</Box>
						</Box>
					</Field>

					<Field>
						<FieldLabel>Created By</FieldLabel>

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
								<UserAvatar size='x24' userId={project.createdBy._id} />
								<Box is='span' mi='x8' withTruncatedText>
									{project.createdBy.username}
								</Box>
							</Box>
						</FieldRow>
					</Field>
					<Field>
						<FieldLabel>Created At</FieldLabel>
						<FieldRow>
							<TextInput value={new Date(project.createdAt).toLocaleString()} disabled />
						</FieldRow>
					</Field>
				</FieldGroup>
			</Modal.Content>
			<Modal.Footer>
				<Modal.FooterControllers>
					<Button onClick={onClose}>{t('Cancel')}</Button>
					<Button onClick={handleSubmit(handleUpdateProject)} primary disabled={!hasChanges || isLoading} loading={isLoading}>
						{t('Save_changes')}
					</Button>
				</Modal.FooterControllers>
			</Modal.Footer>
		</Modal>
	);
};

export default ProjectDetailModal;
