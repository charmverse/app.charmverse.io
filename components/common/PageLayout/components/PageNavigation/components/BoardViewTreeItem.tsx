
import { forwardRef } from 'react';
import { iconForViewType } from 'components/common/BoardEditor/focalboard/src/components/viewMenu';
import { IViewType } from 'components/common/BoardEditor/focalboard/src/blocks/boardView';
import { StyledTreeItem, PageLink } from './PageTreeItem';

interface BoardViewTreeItemProps {
  href: string;
  label: string;
  nodeId: string;
  viewType: IViewType;
}

const BoardViewTreeItem = forwardRef<HTMLDivElement, BoardViewTreeItemProps>((props, ref) => {
  const {
    href,
    label,
    viewType,
    nodeId
  } = props;

  const labelIcon = iconForViewType(viewType);

  return (
    <StyledTreeItem
      label={(
        <PageLink
          href={href}
          label={label}
          labelIcon={labelIcon}
          showPicker={false}
        />
      )}
      nodeId={nodeId}
      ref={ref}
      TransitionProps={{ timeout: 50 }}
    />
  );
});

export default BoardViewTreeItem;
