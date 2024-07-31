import type { Page } from '@charmverse/core/prisma';
import { ListItemText, ListItemIcon, MenuItem, Typography } from '@mui/material';

import type { PagePathType } from 'components/common/PageIcon';
import { PageIcon } from 'components/common/PageIcon';

export type PageListItem = Pick<Page, 'id' | 'title' | 'path'> & {
  type: PagePathType;
  hasContent?: boolean;
  icon?: string | null;
};

interface Props {
  activeItemIndex?: number;
  activePageId?: string;
  pages: PageListItem[];
  onSelectPage: (pageId: string, type: PageListItem['type'], path: string, title: string) => void;
  emptyText?: string;
  style?: React.CSSProperties;
}

export function PagesList({
  emptyText = 'No pages found',
  activeItemIndex = -1,
  activePageId,
  pages,
  onSelectPage,
  style
}: Props) {
  function isActive(pageId: string, index: number) {
    return pageId === activePageId || index === activeItemIndex;
  }
  if (pages.length === 0) {
    return (
      <Typography
        style={{
          marginLeft: 16,
          marginBottom: 8
        }}
        variant='subtitle2'
        color='secondary'
      >
        {emptyText}
      </Typography>
    );
  }
  return (
    <div style={style}>
      {pages.map((page, pageIndex) => (
        <MenuItem
          data-test={`page-option-${page.id}`}
          data-value={page.id}
          data-type={page.type}
          data-path={page.path}
          className={isActive(page.id, pageIndex) ? 'mention-selected' : ''}
          onClick={() => onSelectPage(page.id, page.type, page.path, page.title)}
          key={page.id}
          selected={isActive(page.id, pageIndex)}
        >
          <ListItemIcon>
            <PageIcon icon={page.icon} isEditorEmpty={!page.hasContent} pageType={page.type} />
          </ListItemIcon>
          <ListItemText>{page.title ? page.title : 'Untitled'}</ListItemText>
        </MenuItem>
      ))}
    </div>
  );
}
