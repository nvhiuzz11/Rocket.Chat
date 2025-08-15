import { Box, Icon, IconButton, Option, OptionColumn, OptionContent, OptionMenu, OptionSkeleton } from '@rocket.chat/fuselage';
import { usePrefersReducedMotion } from '@rocket.chat/fuselage-hooks';
import { usePermission } from '@rocket.chat/ui-contexts';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import ModuleItemMenu from './ModuleItemMenu';
import type { IModule } from '../../../../../../server/core-typings/IModule';
import { usePreventPropagation } from '../../../../../hooks/usePreventPropagation';

type ModuleItemProps = {
	module: IModule & { stageCount?: number; documentCount?: number };
	roomId: string;
	onClickView: (moduleId: string) => void;
	onClickEdit?: (moduleId: string) => void;
	onClickDelete?: (moduleId: string) => void;
	reload: () => void;
};

const ModuleItem = ({ module, roomId, onClickView, onClickEdit, onClickDelete, reload }: ModuleItemProps) => {
	const { t } = useTranslation();
	const [showButton, setShowButton] = useState();

	// Permission checks - you may need to adjust these based on your permission system
	const canEditModule = usePermission('edit-room', roomId);
	const canDeleteModule = usePermission('edit-room', roomId);

	const isReduceMotionEnabled = usePrefersReducedMotion();
	const handleMenuEvent = {
		[isReduceMotionEnabled ? 'onMouseEnter' : 'onTransitionEnd']: setShowButton,
	};

	const onClick = usePreventPropagation();

	if (!module) {
		return <OptionSkeleton />;
	}

	return (
		<Option id={module._id} data-module-id={module._id} {...handleMenuEvent} onClick={() => onClickView(module._id)}>
			<OptionColumn>
				<Icon name='squares' size='x28' />
			</OptionColumn>
			<OptionContent>
				<Box display='flex' flexDirection='column'>
					<Box fontScale='p2m'>{module.name}</Box>
					{module.description && (
						<Box fontScale='p2' color='hint'>
							{module.description ? module.description : <Box color='hint'>—</Box>}
						</Box>
					)}
					{/* <Box fontScale='micro' color='default'>
						Created by {module.createdBy.name || module.createdBy.username}
					</Box> */}
				</Box>
			</OptionContent>
			{(canEditModule || canDeleteModule) && (
				<OptionMenu onClick={onClick}>
					{showButton ? (
						<ModuleItemMenu
							module={module}
							onClickEdit={canEditModule ? onClickEdit : undefined}
							onClickDelete={canDeleteModule ? onClickDelete : undefined}
							reload={reload}
						/>
					) : (
						<IconButton tiny icon='kebab' />
					)}
				</OptionMenu>
			)}
		</Option>
	);
};

export default ModuleItem;
