import type { Card } from '@rocket.chat/fuselage';
import { useSetModal } from '@rocket.chat/ui-contexts';
import type { ComponentProps, ReactElement } from 'react';

import { GenericCard, GenericCardButton } from '../../../components/GenericCard';
import CreateTaskModal from '../../../sidebar/header/CreateTask/CreateTaskModal';

const CreateTasksCard = (props: Omit<ComponentProps<typeof Card>, 'type'>): ReactElement => {
	// const t = useTranslation();
	const setModal = useSetModal();

	const openCreateTaskModal = (): void => setModal(<CreateTaskModal onClose={(): void => setModal(null)} />);

	return (
		<GenericCard
			title={'Create tasks'}
			body={'Create a new task to organize and track your work'}
			buttons={[<GenericCardButton key={1} onClick={openCreateTaskModal} children={'Create task'} />]}
			data-qa-id='homepage-create-tasks-card'
			width='x340'
			{...props}
		/>
	);
};

export default CreateTasksCard;
