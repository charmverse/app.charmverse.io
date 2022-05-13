import { ListItemIcon, MenuItem, Typography } from '@mui/material';
import { Page } from '@prisma/client';
import PageIcon from 'components/common/PageLayout/components/PageIcon';
import PageTitle from 'components/common/PageLayout/components/PageTitle';
import { usePages } from 'hooks/usePages';
import { PageContent } from 'models';
import { checkForEmpty } from '../utils';

export function PagesList ({ queryText, onSelectPage }: { queryText?: string, onSelectPage: (page: Page) => void }) {
  const { pages } = usePages();
  const filteredPages = (Object.values(pages).filter((page) => page && page?.deletedAt === null && (queryText && queryText.length !== 0 ? (page.title || 'Untitled').toLowerCase().startsWith(queryText.toLowerCase()) : true)) as Page[]);

  return (
    filteredPages.length === 0 ? <Typography sx={{ ml: 2 }} variant='subtitle2' color='secondary'>No pages found</Typography> : (
      <div>
        {filteredPages.map(page => {
          const docContent = ((page.content) as PageContent);
          const isEditorEmpty = checkForEmpty(docContent);
          return (
            <MenuItem
              onClick={() => onSelectPage(page)}
              key={page.id}
            >
              <>
                <ListItemIcon>
                  <PageIcon icon={page.icon} isEditorEmpty={Boolean(isEditorEmpty)} pageType={page.type} />
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
