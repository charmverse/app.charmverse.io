import styled from '@emotion/styled';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Collapse from '@mui/material/Collapse';
import InputAdornment from '@mui/material/InputAdornment';
import Input from '@mui/material/OutlinedInput';
import Switch from '@mui/material/Switch';
import Typography from '@mui/material/Typography';
import charmClient from 'charmClient';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import useIsAdmin from 'hooks/useIsAdmin';
import { useSpaces } from 'hooks/useSpaces';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { CopyToClipboard } from 'react-copy-to-clipboard';

const StyledInput = styled(Input)`
  font-size: .8em;
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

export default function ShareBountyBoard () {

  const router = useRouter();
  const [copied, setCopied] = useState<boolean>(false);
  const [spaces, setSpaces] = useSpaces();
  const [space] = useCurrentSpace();
  const isAdmin = useIsAdmin();

  // Current values of the public permission
  const [shareLink, setShareLink] = useState<null | string>(null);

  const bountiesArePublic = !!space?.publicBountyBoard;

  async function togglePublic () {
    const updatedSpace = await charmClient.setPublicBountyBoard({
      publicBountyBoard: !bountiesArePublic,
      spaceId: space?.id as string
    });

    setSpaces(spaces.map(s => s.id === updatedSpace.id ? updatedSpace : s));

  }

  useEffect(() => {
    updateShareLink();
  }, [space]);

  function onCopy () {
    setCopied(true);
    setTimeout(() => setCopied(false), 1000);
  }

  async function updateShareLink () {

    if (!space?.publicBountyBoard) {
      setShareLink(null);
    }
    else {
      const shareLinkToSet = `${window.location.origin}/share/${space?.domain}/bounties`;
      setShareLink(shareLinkToSet);
    }

  }

  return (
    <>
      <Box
        display='flex'
        justifyContent='space-between'
        alignItems='center'
        padding={1}
      >

        <Box>

          <Typography>Share to web</Typography>

          <Typography variant='body2' color='secondary'>
            {bountiesArePublic
              ? 'Anyone outside this space can view bounties, except for bounties restricted to certain roles.'
              : 'Bounties can only be seen by space members.'}
          </Typography>
        </Box>
        <Switch
          checked={bountiesArePublic}
          disabled={!isAdmin}
          onChange={togglePublic}
        />
      </Box>
      <Collapse in={bountiesArePublic}>
        {
          shareLink && (
          <Box p={1}>
            <StyledInput
              fullWidth
              disabled
              value={shareLink}
              endAdornment={(
                <CopyToClipboard text={shareLink} onCopy={onCopy}>
                  <InputAdornment position='end'>
                    <CopyButton>
                      {copied ? 'Copied!' : 'Copy'}
                    </CopyButton>
                  </InputAdornment>
                </CopyToClipboard>
              )}
            />
          </Box>
          )
        }
      </Collapse>

    </>
  );
}
