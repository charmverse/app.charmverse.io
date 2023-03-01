import Box from '@mui/material/Box';
import SvgIcon from '@mui/material/SvgIcon';

import Button from 'components/common/Button';
import { ImportZippedMarkdown } from 'components/common/ImportZippedMarkdown';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useIsAdmin } from 'hooks/useIsAdmin';
import { useNotionImport } from 'hooks/useNotionImport';
import { generateNotionImportRedirectUrl } from 'lib/notion/generateNotionImportRedirectUrl';
import NotionIcon from 'public/images/notion_logo.svg';

export default function ImportContent() {
  const { loading } = useNotionImport();
  const isAdmin = useIsAdmin();
  const space = useCurrentSpace();

  return (
    <div>
      <Box display='flex' flexDirection={{ xs: 'column', md: 'row' }} gap={2}>
        <Button
          disabled={!isAdmin}
          disabledTooltip='Only admins can import content from Notion'
          loading={loading}
          href={generateNotionImportRedirectUrl({
            spaceDomain: space?.domain as string,
            origin: window?.location.origin
          })}
          variant='outlined'
          startIcon={
            <SvgIcon sx={{ color: 'text.primary' }}>
              <NotionIcon />
            </SvgIcon>
          }
        >
          {loading ? 'Importing pages from Notion' : 'Import pages from Notion'}
        </Button>
        {/** This button handles all logic for uploading the markdown files */}
        <ImportZippedMarkdown />
      </Box>
    </div>
  );
}
