import type { PageType } from '@charmverse/core/prisma-client';
import styled from '@emotion/styled';
import CircleIcon from '@mui/icons-material/Circle';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import MuiButton from '@mui/material/Button';
import InputAdornment from '@mui/material/InputAdornment';
import InputLabel from '@mui/material/InputLabel';
import Input from '@mui/material/OutlinedInput';
import Switch from '@mui/material/Switch';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { CopyToClipboard } from 'react-copy-to-clipboard';

import { useGetPageMeta } from 'charmClient/hooks/pages';
import { Button } from 'components/common/Button';
import { UpgradeChip, UpgradeWrapper } from 'components/settings/subscription/UpgradeWrapper';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { getAbsolutePath } from '@packages/lib/utils/browser';

const StyledInput = styled(Input)`
  font-size: 0.8em;
  height: 35px;
  padding-right: 0;

  .MuiInputAdornment-root {
    display: block;
    height: 100%;
    max-height: none;
    text-align: right;

    button {
      height: 100%;
    }
  }
`;

const CopyButton = styled((props: any) => <MuiButton color='secondary' variant='outlined' size='small' {...props} />)`
  border-radius: 0;
  border-right-color: transparent;
  border-top-color: transparent;
  border-bottom-color: transparent;
`;

export type ShareToWebProps = {
  disabled: boolean;
  isLoading?: boolean;
  shareChecked: boolean;
  discoveryChecked: boolean;
  pageId: string;
  handlePublish?: () => void;
  handleDiscovery?: (newValue: boolean) => void;
  disabledTooltip?: string | null;
  shareAlertMessage?: string | null;
  pageType?: PageType;
};

export default function ShareToWeb({
  shareChecked,
  discoveryChecked,
  disabled,
  isLoading,
  pageId,
  handlePublish,
  handleDiscovery,
  shareAlertMessage,
  disabledTooltip,
  pageType
}: ShareToWebProps) {
  const [copied, setCopied] = useState<boolean>(false);

  const { data: page } = useGetPageMeta(pageId);

  const { space } = useCurrentSpace();
  const router = useRouter();

  const [shareLink, setShareLink] = useState(getShareLink());

  useEffect(() => {
    setShareLink(getShareLink());
  }, [pageId, !!page, router.query.viewId, shareChecked]);

  // Current values of the public permission

  function onCopy() {
    setCopied(true);
    setTimeout(() => setCopied(false), 1000);
  }

  function getShareLink() {
    if (!shareChecked || !page) {
      return null;
    } else if (page?.type.match(/board/)) {
      const viewIdToProvide = router.query.viewId;
      return typeof window !== 'undefined'
        ? getAbsolutePath(`/${page.path}?viewId=${viewIdToProvide}`, space?.domain)
        : '';
    } else {
      return typeof window !== 'undefined' ? getAbsolutePath(`/${page.path}`, space?.domain) : '';
    }
  }

  const hideAllowDiscovery = pageType === 'proposal' || pageType === 'proposal_template';

  return (
    <Box my={1} gap={2} display='flex' flexDirection='column'>
      {!shareChecked ? (
        <Box>
          <Box>
            <Typography variant='h6' textAlign='center' mb={1}>
              Publish to web
            </Typography>
            <Typography variant='body2'>
              Publish a static website of this page. You can allow others to view it.
            </Typography>
          </Box>
          <UpgradeChip upgradeContext='page_permissions' />
        </Box>
      ) : (
        <Box>
          <Box display='flex' gap={0.5} mb={2}>
            <CircleIcon color='primary' fontSize='small' />
            <Typography variant='body2'>This page is live on the web. Anyone with the link can view it.</Typography>
          </Box>
          {shareLink && (
            <StyledInput
              data-test='share-link'
              fullWidth
              disabled
              value={shareLink || ''}
              endAdornment={
                <CopyToClipboard data-test='copy-button' text={shareLink ?? ''} onCopy={onCopy}>
                  <InputAdornment position='end'>
                    <CopyButton>{copied ? 'Copied!' : 'Copy'}</CopyButton>
                  </InputAdornment>
                </CopyToClipboard>
              }
            />
          )}
          {!hideAllowDiscovery && (
            <>
              <Box display='flex' alignItems='center' justifyContent='space-between' mt={1}>
                <InputLabel htmlFor='discovery-toggle' color='primary'>
                  Add to sidebar
                </InputLabel>
                <Switch
                  id='discovery-toggle'
                  data-test='toggle-allow-page-discovery'
                  checked={discoveryChecked}
                  disabled={disabled}
                  onChange={(_, checked) => {
                    handleDiscovery?.(checked);
                  }}
                />
              </Box>
              <Typography width={{ xs: '100%', md: '80%' }} variant='body2'>
                Anyone with access to the space will see this page in the sidebar
              </Typography>
            </>
          )}
        </Box>
      )}
      {shareAlertMessage && (
        <Alert severity='info' sx={{ whiteSpace: 'break-spaces', mt: 1 }}>
          {shareAlertMessage}
        </Alert>
      )}
      <UpgradeWrapper upgradeContext={!disabledTooltip ? 'page_permissions' : undefined}>
        <Tooltip title={disabled && disabledTooltip ? disabledTooltip : ''}>
          <Box>
            <Button
              fullWidth
              onClick={handlePublish}
              disabled={disabled}
              data-test='toggle-public-page'
              loading={isLoading}
            >
              {shareChecked ? 'Unpublish' : 'Publish to web'}
            </Button>
          </Box>
        </Tooltip>
      </UpgradeWrapper>
    </Box>
  );
}
