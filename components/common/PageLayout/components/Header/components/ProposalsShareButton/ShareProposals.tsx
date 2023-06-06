import type { SpacePermissionConfigurationMode } from '@charmverse/core/prisma';
import styled from '@emotion/styled';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Collapse from '@mui/material/Collapse';
import InputAdornment from '@mui/material/InputAdornment';
import Input from '@mui/material/OutlinedInput';
import Switch from '@mui/material/Switch';
import Typography from '@mui/material/Typography';
import { useEffect, useState } from 'react';
import { CopyToClipboard } from 'react-copy-to-clipboard';

import charmClient from 'charmClient';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useIsAdmin } from 'hooks/useIsAdmin';
import { useIsPublicSpace } from 'hooks/useIsPublicSpace';
import { useSpaces } from 'hooks/useSpaces';
import { configurationModeName } from 'lib/permissions/meta/preset-templates';
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
  const space = useCurrentSpace();
  const isAdmin = useIsAdmin();
  const { isPublicSpace } = useIsPublicSpace();

  // Current values of the public permission
  const [shareLink, setShareLink] = useState<null | string>(null);

  const proposalsArePublic = !!space?.publicProposals;

  async function togglePublic() {
    const updatedSpace = await charmClient.spaces.setPublicProposals({
      publicProposals: !proposalsArePublic,
      spaceId: space?.id as string
    });
    setSpace(updatedSpace);
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
    <>
      <Box display='flex' justifyContent='space-between' alignItems='center' padding={padding}>
        <Box>
          <Typography>Make proposals public</Typography>

          <Typography variant='body2' color='secondary'>
            {proposalsArePublic
              ? 'Anyone outside this space can view proposals, except drafts.'
              : 'Proposals can only be seen by space members.'}
          </Typography>
        </Box>
        <Switch
          checked={proposalsArePublic || isPublicSpace}
          disabled={!isAdmin || isPublicSpace}
          onChange={togglePublic}
        />
      </Box>
      {isPublicSpace && (
        <Alert severity='info'>All proposals in public spaces are publicly visible, except drafts</Alert>
      )}
      <Collapse in={proposalsArePublic}>
        {shareLink && (
          <Box p={padding} sx={{ mt: padding === 0 ? 1 : undefined }}>
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
    </>
  );
}
