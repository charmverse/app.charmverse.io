import styled from '@emotion/styled';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Collapse from '@mui/material/Collapse';
import InputAdornment from '@mui/material/InputAdornment';
import Input from '@mui/material/OutlinedInput';
import Switch from '@mui/material/Switch';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { CopyToClipboard } from 'react-copy-to-clipboard';

import { UpgradeChip, UpgradeWrapper, upgradeMessages } from 'components/settings/subscription/UpgradeWrapper';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { usePages } from 'hooks/usePages';
import { useProposal } from 'hooks/useProposal';
import { useSettingsDialog } from 'hooks/useSettingsDialog';
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

interface Props {
  pageId: string;
}

export default function PublicShareToWeb({ pageId }: Props) {
  const router = useRouter();

  const { pages } = usePages();
  const [copied, setCopied] = useState<boolean>(false);

  const { space } = useCurrentSpace();

  const currentPage = pages[pageId];

  const { proposal } = useProposal({ proposalId: currentPage?.proposalId });

  // Current values of the public permission
  const [shareLink, setShareLink] = useState<null | string>(null);

  function updateShareLink() {
    if (
      currentPage?.type === 'page' ||
      currentPage?.type === 'card' ||
      currentPage?.type === 'card_synced' ||
      currentPage?.type === 'proposal'
    ) {
      const shareLinkToSet =
        typeof window !== 'undefined' ? getAbsolutePath(`/${currentPage.path}`, space?.domain) : '';
      setShareLink(shareLinkToSet);
    } else if (currentPage?.type.match(/board/)) {
      const viewIdToProvide = router.query.viewId;
      const shareLinkToSet =
        typeof window !== 'undefined'
          ? getAbsolutePath(`/${currentPage.path}?viewId=${viewIdToProvide}`, space?.domain)
          : '';
      setShareLink(shareLinkToSet);
    }
  }

  const shareAlertMessage =
    currentPage?.type === 'proposal' && proposal?.status === 'draft'
      ? 'This draft is only visible to authors and reviewers until it is progressed to the discussion stage.'
      : currentPage?.type === 'proposal' && proposal?.status !== 'draft'
      ? 'Proposals in discussion stage and beyond are publicly visible.'
      : null;

  useEffect(() => {
    updateShareLink();
  }, [router.query.viewId, pageId]);

  function onCopy() {
    setCopied(true);
    setTimeout(() => setCopied(false), 1000);
  }

  const isChecked =
    // If space has public proposals, don't interfere with non-proposal pages
    currentPage?.type !== 'proposal' ||
    // All proposals beyond draft are public
    (currentPage?.type === 'proposal' && proposal?.status !== 'draft');

  return (
    <>
      <Box display='flex' justifyContent='space-between' alignItems='center' padding={1}>
        <Box>
          <Typography>Share to web</Typography>

          {isChecked && (
            <Typography variant='body2' color='secondary'>
              Anyone with the link can view
            </Typography>
          )}
        </Box>
        <UpgradeChip upgradeContext='pagePermissions' />
        <UpgradeWrapper upgradeContext='pagePermissions'>
          <Switch data-test='toggle-public-page' checked={isChecked} disabled />
        </UpgradeWrapper>
      </Box>

      {shareAlertMessage && <Alert severity='info'>{shareAlertMessage}</Alert>}

      <Collapse in={!!isChecked}>
        {shareLink && (
          <Box p={1}>
            <StyledInput
              data-test='share-link'
              fullWidth
              disabled
              value={shareLink}
              endAdornment={
                <CopyToClipboard data-test='copy-button' text={shareLink} onCopy={onCopy}>
                  <InputAdornment position='end'>
                    <CopyButton>{copied ? 'Copied!' : 'Copy'}</CopyButton>
                  </InputAdornment>
                </CopyToClipboard>
              }
            />
          </Box>
        )}
      </Collapse>
    </>
  );
}
