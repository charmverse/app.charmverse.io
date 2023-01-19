import { ListItemIcon, MenuItem, Typography } from '@mui/material';
import type { Page } from '@prisma/client';

import { PageIcon } from 'components/common/PageLayout/components/PageIcon';
import PageTitle from 'components/common/PageLayout/components/PageTitle';
import type { PageMeta } from 'lib/pages';

interface Props {
  activeItemIndex?: number;
  activePageId?: string;
  pages: PageMeta[];
  onSelectPage: (page: PageMeta) => void;
  emptyText?: string;
}

export default function PagesList({
  emptyText = 'No pages found',
  activeItemIndex = -1,
  activePageId,
  pages,
  onSelectPage
}: Props) {
  function isActive(pageId: string, index: number) {
    return pageId === activePageId || index === activeItemIndex;
  }

  return pages.length === 0 ? (
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
  ) : (
    <div
      style={{
        height: '250px',
        overflow: 'auto'
      }}
    >
      {pages.map((page, pageIndex) => {
        return (
          <MenuItem
            data-value={page.id}
            data-type='page'
            className={isActive(page.id, pageIndex) ? 'mention-selected' : ''}
            onClick={() => onSelectPage(page)}
            key={page.id}
            selected={isActive(page.id, pageIndex)}
          >
            <>
              <ListItemIcon>
                <PageIcon icon={page.icon} isEditorEmpty={!page.hasContent} pageType={page.type} />
              </ListItemIcon>
              <PageTitle
                hasContent={page.title.length === 0}
                sx={{
                  fontWeight: 'bold'
                }}
              >
                {page.title.length > 0 ? page.title : 'Untitled'}
              </PageTitle>
            </>
          </MenuItem>
        );
      })}
    </div>
  );
}
