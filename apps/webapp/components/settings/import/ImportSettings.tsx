import { log } from '@charmverse/core/log';
import type { Space } from '@charmverse/core/prisma';
import { Box, Stack, Typography } from '@mui/material';
import SvgIcon from '@mui/material/SvgIcon';
import { usePopupState } from 'material-ui-popup-state/hooks';
import { SiDiscourse } from 'react-icons/si';

import { useTrackPageView } from 'charmClient/hooks/track';
import { Button } from 'components/common/Button';
import { ImportZippedMarkdown } from 'components/common/ImportZippedMarkdown';
import Link from 'components/common/Link';
import { Modal } from 'components/common/Modal';
import Legend from 'components/settings/components/Legend';
import { useIsAdmin } from 'hooks/useIsAdmin';
import { useNotionImport } from 'hooks/useNotionImport';
import { generateNotionImportRedirectUrl } from 'lib/notion/generateNotionImportRedirectUrl';
import NotionIcon from 'public/images/logos/notion_logo.svg';

export function ImportSettings({ space }: { space: Space }) {
  const { loading } = useNotionImport();
  const isAdmin = useIsAdmin();
  useTrackPageView({ type: 'settings/import' });

  return (
    <>
      <Legend marginTop={0}>Import Content</Legend>
      <Box mb={2}>
        <Typography variant='caption'>
          Import content from an external source. It will not replace existing pages.
        </Typography>
      </Box>
      <Stack display='flex' gap={2} sx={{ width: { md: '300px' } }}>
        <Button
          fullWidth
          disabled={!isAdmin}
          disabledTooltip='Only admins can import content from Notion'
          loading={loading}
          href={generateNotionImportRedirectUrl({
            spaceDomain: space?.domain as string,
            origin: window?.location.origin
          })}
          sx={{ justifyContent: 'flex-start' }}
          size='large'
          color='inherit'
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
        <ImportZippedMarkdown fullWidth size='large' color='inherit' sx={{ justifyContent: 'flex-start' }} />
        <DiscourseImportButton />
      </Stack>
    </>
  );
}

function DiscourseImportButton() {
  const popupState = usePopupState({ variant: 'popover', popupId: 'import-discourse' });
  const isAdmin = useIsAdmin();

  function showDiscoursePopup() {
    log.info('Requested Discourse import');
    popupState.open();
  }
  return (
    <>
      <Button
        fullWidth
        disabled={!isAdmin}
        disabledTooltip='Only admins can import content from Discourse'
        onClick={showDiscoursePopup}
        sx={{ justifyContent: 'flex-start' }}
        size='large'
        color='inherit'
        variant='outlined'
        startIcon={
          <SvgIcon sx={{ color: 'text.primary' }}>
            <SiDiscourse />
          </SvgIcon>
        }
      >
        Import posts from Discourse
      </Button>
      <Modal title='Discourse Import Beta' open={popupState.isOpen} onClose={popupState.close}>
        <Link href='https://discord.gg/ACYCzBGC2M' target='_blank' rel='noreferrer'>
          Join our Discord channel
        </Link>{' '}
        to request an import.
      </Modal>
    </>
  );
}
