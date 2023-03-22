import { ListItemIcon, MenuItem, Typography } from '@mui/material';
import type { Page } from '@prisma/client';
import { useMemo } from 'react';

import { PageIcon } from 'components/common/PageLayout/components/PageIcon';
import PageTitle from 'components/common/PageLayout/components/PageTitle';
import type {
  StaticPagesList,
  StaticPagesType
} from 'components/common/PageLayout/components/Sidebar/utils/staticPages';
import type { PageMeta } from 'lib/pages';
import type { PostCategoryWithPermissions } from 'lib/permissions/forum/interfaces';

type AllPagesProp = Pick<Page, 'id' | 'title' | 'path' | 'hasContent' | 'icon'> & {
  type: Page['type'] | StaticPagesType;
};

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

  const allPages = useMemo(() => {
    const memoPage: AllPagesProp[] = pages.map((page) => ({
      id: page.id,
      path: page.path,
      hasContent: page.hasContent,
      title: page.title,
      type: page.type,
      icon: page.icon
    }));

    const memoForumCategories: AllPagesProp[] = (forumCategories || []).map((page) => ({
      id: page.id,
      path: page.path || '',
      hasContent: true,
      title: page.name,
      type: 'forum',
      icon: null
    }));

    const memoStaticPage: AllPagesProp[] = (staticPages || []).map((page) => ({
      id: page.path,
      path: page.path,
      hasContent: true,
      title: page.title,
      type: page.path,
      icon: null
    }));

    return memoPage.concat(memoForumCategories).concat(memoStaticPage);
  }, [pages, staticPages, forumCategories]);

  if (allPages.length === 0) {
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
      {allPages.map((page, pageIndex) => (
        <MenuItem
          data-value={page.id}
          data-type='page'
          className={isActive(page.id, pageIndex) ? 'mention-selected' : ''}
          onClick={() => onSelectPage(page.id)}
          key={page.id}
          selected={isActive(page.id, pageIndex)}
        >
          <ListItemIcon>
            <PageIcon icon={page.icon} isEditorEmpty={!page.hasContent} pageType={page.type} />
          </ListItemIcon>
          <PageTitle hasContent={page.title.length === 0} sx={{ fontWeight: 'bold' }}>
            {page.title.length > 0 ? page.title : 'Untitled'}
          </PageTitle>
        </MenuItem>
      ))}
    </div>
  );
}
