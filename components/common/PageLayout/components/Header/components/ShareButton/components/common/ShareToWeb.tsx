import styled from '@emotion/styled';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Collapse from '@mui/material/Collapse';
import InputAdornment from '@mui/material/InputAdornment';
import InputLabel from '@mui/material/InputLabel';
import Input from '@mui/material/OutlinedInput';
import Switch from '@mui/material/Switch';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { CopyToClipboard } from 'react-copy-to-clipboard';

import { UpgradeChip, UpgradeWrapper } from 'components/settings/subscription/UpgradeWrapper';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { usePage } from 'hooks/usePage';
import { getAbsolutePath } from 'lib/utilities/browser';

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

const CopyButton = styled((props: any) => <Button color='secondary' variant='outlined' size='small' {...props} />)`
  border-radius: 0;
  border-right-color: transparent;
  border-top-color: transparent;
  border-bottom-color: transparent;
`;

export type ShareToWebProps = {
  disabled: boolean;
  shareChecked: boolean;
  discoveryChecked: boolean;
  pageId: string;
  handlePublish?: (newValue: boolean) => void;
  handleDiscovery?: (newValue: boolean) => void;
  disabledTooltip?: string | null;
  shareAlertMessage?: string | null;
};

export default function ShareToWeb({
  shareChecked,
  discoveryChecked,
  disabled,
  pageId,
  handlePublish,
  handleDiscovery,
  shareAlertMessage,
  disabledTooltip
}: ShareToWebProps) {
  const [copied, setCopied] = useState<boolean>(false);

  const { page } = usePage({ pageIdOrPath: pageId });

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

  return (
    <>
      <Box display='flex' justifyContent='space-between' alignItems='center' my={1}>
        <Box>
          <Typography>Share to web</Typography>

          <Typography variant='body2' color='secondary'>
            {shareChecked ? 'Anyone with the link can view' : 'Publish and share link with anyone'}
          </Typography>
        </Box>
        <UpgradeChip upgradeContext='page_permissions' />
        <Tooltip title={disabled && disabledTooltip ? disabledTooltip : ''}>
          <Box>
            <UpgradeWrapper upgradeContext={!disabledTooltip ? 'page_permissions' : undefined}>
              <Switch
                data-test='toggle-public-page'
                checked={shareChecked}
                disabled={disabled}
                onChange={(_, checked) => {
                  handlePublish?.(checked);
                }}
              />
            </UpgradeWrapper>
          </Box>
        </Tooltip>
      </Box>

      <Collapse in={!!shareChecked && !!shareLink}>
        <Box>
          <StyledInput
            data-test='share-link'
            fullWidth
            disabled
            value={shareLink}
            endAdornment={
              <CopyToClipboard data-test='copy-button' text={shareLink ?? ''} onCopy={onCopy}>
                <InputAdornment position='end'>
                  <CopyButton>{copied ? 'Copied!' : 'Copy'}</CopyButton>
                </InputAdornment>
              </CopyToClipboard>
            }
          />
        </Box>
      </Collapse>
      <Collapse in={!!shareChecked && !!shareLink /* || page.hasGuests */}>
        <Box>
          <UpgradeWrapper upgradeContext={!disabledTooltip ? 'page_permissions' : undefined}>
            <Box display='flex' alignItems='center' justifyContent='space-between' mt={1}>
              <InputLabel variant='standard' htmlFor='discovery-toggle'>
                Discoverable
              </InputLabel>
              <Switch
                id='discovery-toggle'
                data-test='toggle-discovery-page'
                checked={discoveryChecked}
                disabled={disabled}
                onChange={(_, checked) => {
                  handleDiscovery?.(checked);
                }}
              />
            </Box>
          </UpgradeWrapper>
        </Box>
      </Collapse>
      {shareAlertMessage && (
        <Alert severity='info' sx={{ whiteSpace: 'break-spaces', mt: 1 }}>
          {shareAlertMessage}
        </Alert>
      )}
    </>
  );
}
