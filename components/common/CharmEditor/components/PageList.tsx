import { ListItemIcon, MenuItem, Typography } from '@mui/material';

import { PageIcon } from 'components/common/PageLayout/components/PageIcon';
import PageTitle from 'components/common/PageLayout/components/PageTitle';
import type { StaticPagesList } from 'components/common/PageLayout/components/Sidebar/utils/staticPages';
import type { PageMeta } from 'lib/pages';
import type { PostCategoryWithPermissions } from 'lib/permissions/forum/interfaces';

interface Props {
  activeItemIndex?: number;
  activePageId?: string;
  pages: PageMeta[];
  staticPages?: StaticPagesList[];
  forumCategories?: PostCategoryWithPermissions[];
  onSelectPage: (pageId: string) => void;
  emptyText?: string;
  style?: React.CSSProperties;
}

export default function PagesList({
  emptyText = 'No pages found',
  activeItemIndex = -1,
  activePageId,
  pages,
  staticPages,
  forumCategories,
  onSelectPage,
  style
}: Props) {
  function isActive(pageId: string, index: number) {
    return pageId === activePageId || index === activeItemIndex;
  }

  return pages.length === 0 && staticPages?.length === 0 && forumCategories?.length === 0 ? (
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
    <div style={style}>
      {pages.map((page, pageIndex) => {
        return (
          <MenuItem
            data-value={page.id}
            data-type='page'
            className={isActive(page.id, pageIndex) ? 'mention-selected' : ''}
            onClick={() => onSelectPage(page.id)}
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
      {staticPages?.map((page) => (
        <MenuItem key={page.path} data-value={page.path} data-type='page' onClick={() => onSelectPage(page.path)}>
          <ListItemIcon>
            <PageIcon icon={null} isEditorEmpty={false} pageType={page.path} />
          </ListItemIcon>
          <PageTitle hasContent={true} sx={{ fontWeight: 'bold' }}>
            {page.title}
          </PageTitle>
        </MenuItem>
      ))}
      {forumCategories?.map((page) => {
        return (
          <MenuItem key={page.path} data-value={page.path} data-type='page' onClick={() => onSelectPage(page.id)}>
            <ListItemIcon>
              <PageIcon icon={null} isEditorEmpty={false} pageType='forum' />
            </ListItemIcon>
            <PageTitle hasContent={true} sx={{ fontWeight: 'bold' }}>
              {page.name}
            </PageTitle>
          </MenuItem>
        );
      })}
    </div>
  );
}
