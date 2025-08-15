import { useLayoutSizes, useLayoutContextualBarPosition } from '@rocket.chat/ui-contexts';
import type { ComponentProps } from 'react';
import { useCallback, useRef } from 'react';
import type { AriaDialogProps } from 'react-aria';
import { FocusScope, useDialog } from 'react-aria';

import Contextualbar from './Contextualbar';
import ContextualbarResizable from './ContextualbarResizable';
import { useRoomToolbox } from '../../views/room/contexts/RoomToolboxContext';

type ContextualbarDialogResizableProps = AriaDialogProps & ComponentProps<typeof Contextualbar> & { onClose?: () => void };

/**
 * @prop onClose can be used to close contextualbar outside the room context with ESC key
 * */
const ContextualbarDialogResizable = ({ onClose, ...props }: ContextualbarDialogResizableProps) => {
	const ref = useRef<HTMLElement | null>(null);
	const { dialogProps } = useDialog({ 'aria-labelledby': 'contextualbarTitle', ...props }, ref);
	const position = useLayoutContextualBarPosition();
	const { contextualBar } = useLayoutSizes();
	const { closeTab } = useRoomToolbox();
	const closeContextualbar = onClose ?? closeTab;

	const callbackRef = useCallback(
		(node: HTMLElement | null) => {
			if (!node) {
				return;
			}

			ref.current = node;
			node.addEventListener('keydown', (e: KeyboardEvent) => {
				if (e.key === 'Escape') {
					closeContextualbar();
				}
			});
		},
		[closeContextualbar],
	);

	return (
		<FocusScope autoFocus restoreFocus>
			<ContextualbarResizable defaultWidth={contextualBar} maxWidth='75%'>
				<Contextualbar ref={callbackRef} width='100%' position={position} {...dialogProps} {...props} />
			</ContextualbarResizable>
		</FocusScope>
	);
};

export default ContextualbarDialogResizable;
