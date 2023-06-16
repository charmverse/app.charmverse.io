import styled from '@emotion/styled';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Collapse from '@mui/material/Collapse';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import InputAdornment from '@mui/material/InputAdornment';
import Input from '@mui/material/OutlinedInput';
import Switch from '@mui/material/Switch';
import Typography from '@mui/material/Typography';
import { usePopupState } from 'material-ui-popup-state/hooks';
import { useEffect, useState } from 'react';
import { CopyToClipboard } from 'react-copy-to-clipboard';

import charmClient from 'charmClient';
import { TogglePublicProposalsInvite } from 'components/common/PageLayout/components/Header/components/ProposalsShareButton/TogglePublicProposalsInvite';
import { ConfirmInviteLinkDeletion } from 'components/settings/invites/components/InviteLinks/components/ConfirmInviteLinkDeletion';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useIsAdmin } from 'hooks/useIsAdmin';
import { useIsPublicSpace } from 'hooks/useIsPublicSpace';
import { useSpaceInvitesList } from 'hooks/useSpaceInvitesList';
import { useSpaces } from 'hooks/useSpaces';
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
  padding?: number;
}

export default function ShareProposals({ padding = 1 }: Props) {
  const [copied, setCopied] = useState<boolean>(false);
  const { setSpace } = useSpaces();
  const { space } = useCurrentSpace();
  const isAdmin = useIsAdmin();
  const { isPublicSpace } = useIsPublicSpace();
  const {
    isOpen,
    close: closeConfirmDeleteModal,
    open: openConfirmDeleteModal
  } = usePopupState({ variant: 'popover', popupId: 'share-proposals' });

  // Current values of the public permission
  const [shareLink, setShareLink] = useState<null | string>(null);

  const proposalsArePublic = !!space?.publicProposals;

  const { publicInvites, refreshInvitesList } = useSpaceInvitesList();

  const publicProposalInvite = publicInvites?.find((invite) => invite.visibleOn === 'proposals');

  async function updateSpacePublicProposals(publicProposals: boolean) {
    const updatedSpace = await charmClient.spaces.setPublicProposals({
      publicProposals,
      spaceId: space?.id as string
    });
    setSpace(updatedSpace);
  }

  async function togglePublicProposals() {
    if (!proposalsArePublic) {
      await updateSpacePublicProposals(true);
    } else if (proposalsArePublic && (!publicProposalInvite || publicProposalInvite?.roleIds.length === 0)) {
      await updateSpacePublicProposals(false);
      refreshInvitesList();
    } else {
      openConfirmDeleteModal();
    }
  }

  useEffect(() => {
    updateShareLink();
  }, [space]);

  function onCopy() {
    setCopied(true);
    setTimeout(() => setCopied(false), 1000);
  }

  async function updateShareLink() {
    if (!space?.publicProposals) {
      setShareLink(null);
    } else {
      const shareLinkToSet = getAbsolutePath('/proposals', space?.domain);
      setShareLink(shareLinkToSet);
    }
  }

  return (
    <Grid container padding={padding} flexDirection='column' display='flex' justifyContent='space-between'>
      <Grid container item justifyContent='space-between' alignItems='center'>
        <Grid item>
          <Typography>Make proposals public</Typography>
        </Grid>
        <Grid item>
          <Switch
            checked={proposalsArePublic || isPublicSpace}
            disabled={!isAdmin || isPublicSpace}
            onChange={togglePublicProposals}
          />
        </Grid>
      </Grid>
      <Grid item>
        <Typography variant='body2' color='secondary'>
          {proposalsArePublic
            ? 'Anyone outside this space can view proposals, except drafts.'
            : 'Proposals can only be seen by space members.'}
        </Typography>
      </Grid>

      {isPublicSpace && (
        <Grid item>
          <Alert severity='info'>All proposals in public spaces are publicly visible, except drafts</Alert>
        </Grid>
      )}
      <Grid item>
        <Collapse in={proposalsArePublic}>
          {shareLink && (
            <Box sx={{ mt: 1 }}>
              <StyledInput
                fullWidth
                disabled
                value={shareLink}
                endAdornment={
                  <CopyToClipboard text={shareLink} onCopy={onCopy}>
                    <InputAdornment position='end'>
                      <CopyButton>{copied ? 'Copied!' : 'Copy'}</CopyButton>
                    </InputAdornment>
                  </CopyToClipboard>
                }
              />
            </Box>
          )}
        </Collapse>
      </Grid>

      {proposalsArePublic && (
        <>
          <Divider sx={{ my: 2 }} />
          <TogglePublicProposalsInvite showOpenSettingsLink />
        </>
      )}

      {publicProposalInvite && (
        <ConfirmInviteLinkDeletion
          open={isOpen}
          onClose={closeConfirmDeleteModal}
          onConfirm={() => updateSpacePublicProposals(false)}
          invite={publicProposalInvite}
        />
      )}
    </Grid>
  );
}
