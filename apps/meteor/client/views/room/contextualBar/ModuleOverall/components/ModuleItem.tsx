import { Box, Icon, IconButton, Option, OptionColumn, OptionContent, OptionMenu, OptionSkeleton } from '@rocket.chat/fuselage';
import { usePrefersReducedMotion } from '@rocket.chat/fuselage-hooks';
import { useState } from 'react';

import ModuleItemMenu from './ModuleItemMenu';
import type { IModule } from '../../../../../../server/core-typings/IModule';
import { usePreventPropagation } from '../../../../../hooks/usePreventPropagation';

type ModuleItemProps = {
	module: IModule & { stageCount?: number; documentCount?: number };
	onClickView: (moduleId: string) => void;
	onClickEdit?: (moduleId: string) => void;
	onClickDelete?: (moduleId: string) => void;
	reload: () => void;
};

const ModuleItem = ({ module, onClickView, onClickEdit, onClickDelete, reload }: ModuleItemProps) => {
	const [showButton, setShowButton] = useState();

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
					{module.description ? (
						<Box fontScale='p2' color='hint'>
							{module.description}
						</Box>
					) : (
						<Box color='hint'>—</Box>
					)}
				</Box>
			</OptionContent>

			<OptionMenu onClick={onClick}>
				{showButton ? (
					<ModuleItemMenu module={module} onClickEdit={onClickEdit} onClickDelete={onClickDelete} reload={reload} />
				) : (
					<IconButton tiny icon='kebab' />
				)}
			</OptionMenu>
		</Option>
	);
};

export default ModuleItem;
