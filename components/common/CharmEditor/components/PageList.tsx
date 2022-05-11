import { ListItemIcon, MenuItem } from '@mui/material';
import { Page } from '@prisma/client';
import PageIcon from 'components/common/PageLayout/components/PageIcon';
import PageTitle from 'components/common/PageLayout/components/PageTitle';
import { usePages } from 'hooks/usePages';
import { PageContent } from 'models';
import { checkForEmpty } from '../utils';

export function PagesList ({ onSelectPage }: { onSelectPage: (page: Page) => void }) {
  const { pages } = usePages();

  const items = (Object.values(pages).filter((page) => page && page?.deletedAt === null) as Page[]).map(page => {
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
  });

  return (
    <div>
      {items}
    </div>
  );
}
