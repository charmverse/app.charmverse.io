import { forwardRef, memo } from 'react';

import { iconForViewType } from 'components/common/DatabaseEditor/components/viewMenu';
import type { IViewType } from 'lib/databases/boardView';

import { StyledTreeItem, PageLink } from './PageTreeItem';

interface BoardViewTreeItemProps {
  href: string;
  label: string;
  itemId: string;
  viewType: IViewType;
  onClick?: () => void;
}

const BoardViewTreeItem = forwardRef<HTMLLIElement, BoardViewTreeItemProps>((props, ref) => {
  const { href, label, viewType, itemId, onClick } = props;

  const labelIcon = iconForViewType(viewType);

  return (
    <StyledTreeItem
      label={
        <PageLink
          href={href}
          label={label}
          labelIcon={labelIcon}
          pageType='board' // this is normally used for icons
          showPicker={false}
          onClick={onClick}
        />
      }
      itemId={itemId}
      ref={ref}
      slotProps={{
        groupTransition: {
          timeout: 50
        }
      }}
    />
  );
});

export default memo(BoardViewTreeItem);
