import { forwardRef, memo } from 'react';

import type { IViewType } from 'components/common/BoardEditor/focalboard/src/blocks/boardView';
import { iconForViewType } from 'components/common/BoardEditor/focalboard/src/components/viewMenu';

import { StyledTreeItem, PageLink } from './PageTreeItem';

interface BoardViewTreeItemProps {
  href: string;
  label: string;
  nodeId: string;
  viewType: IViewType;
  onClick?: () => void;
}

const BoardViewTreeItem = forwardRef<HTMLDivElement, BoardViewTreeItemProps>((props, ref) => {
  const { href, label, viewType, nodeId, onClick } = props;

  const labelIcon = iconForViewType(viewType);

  return (
    <StyledTreeItem
      label={<PageLink href={href} label={label} labelIcon={labelIcon} showPicker={false} onClick={onClick} />}
      nodeId={nodeId}
      ref={ref}
      TransitionProps={{ timeout: 50 }}
    />
  );
});

export default memo(BoardViewTreeItem);
