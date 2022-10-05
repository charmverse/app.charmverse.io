import { ListItemIcon, MenuItem, Typography } from '@mui/material';
import type { Page } from '@prisma/client';

import PageIcon from 'components/common/PageLayout/components/PageIcon';
import PageTitle from 'components/common/PageLayout/components/PageTitle';
import type { PageMeta } from 'lib/pages';

interface Props {
  activeItemIndex?: number;
  pages: PageMeta[];
  onSelectPage: (page: PageMeta) => void;
}

export default function PagesList ({ activeItemIndex = -1, pages, onSelectPage }: Props) {
  return (
    pages.length === 0 ? (
      <Typography
        style={{
          marginLeft: 16,
          marginBottom: 8
        }}
        variant='subtitle2'
        color='secondary'
      >No pages found
      </Typography>
    ) : (
      <div>
        {pages.map((page, pageIndex) => {
          return (
            <MenuItem
              data-value={page.id}
              data-type='page'
              className={pageIndex === activeItemIndex ? 'mention-selected' : ''}
              onClick={() => onSelectPage(page)}
              key={page.id}
              selected={pageIndex === activeItemIndex}
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
                  {page.title.length !== 0 ? page.title : 'Untitled'}
                </PageTitle>
              </>
            </MenuItem>
          );
        })}
      </div>
    )
  );
}
