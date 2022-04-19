import styled from '@emotion/styled';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Collapse from '@mui/material/Collapse';
import Input from '@mui/material/Input';
import { IPagePermissionFlags } from 'lib/permissions/pages/page-permission-interfaces';
import Switch from '@mui/material/Switch';
import Typography from '@mui/material/Typography';
import charmClient from 'charmClient';
import { usePages } from 'hooks/usePages';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { CopyToClipboard } from 'react-copy-to-clipboard';

const StyledInput = styled(Input)`
  border: 1px solid ${({ theme }) => theme.palette.divider};
  font-size: .8em;
  padding-left: 1em;
`;

const LinkBox = styled(Box)`
  background: ${({ theme }) => theme.palette.background.dark};
`;

export default function ShareToWeb ({ pagePermissions }: { pagePermissions: IPagePermissionFlags, }) {

  const router = useRouter();
  const { currentPageId, pages, setPages } = usePages();
  const [copied, setCopied] = useState<boolean>(false);
  const [isPublic, setIsPublic] = useState(false);
  const [shareLink, setShareLink] = useState<null | string>(null);

  async function togglePublic () {
    const updatedPage = await charmClient.togglePagePublicAccess(currentPageId, !isPublic);
    setIsPublic(updatedPage.isPublic);
    const updates = { isPublic: updatedPage.isPublic };
    setPages(_pages => ({
      ..._pages,
      [currentPageId]: {
        ..._pages[currentPageId]!,
        ...updates
      }
    }));
  }

  useEffect(() => {
    const currentPage = pages[currentPageId];
    if (currentPage) {
      setIsPublic(currentPage.isPublic);
    }

  }, [currentPageId, pages]);

  useEffect(() => {
    updateShareLink();
  }, [isPublic, router.query.viewId]);

  function onCopy () {
    setCopied(true);
    setTimeout(() => setCopied(false), 1000);
  }

  async function updateShareLink () {
    const currentPage = pages[currentPageId];
    if (isPublic === false) {
      setShareLink(null);
    }
    else if (currentPage?.type === 'page' || currentPage?.type === 'card') {
      const shareLinkToSet = (typeof window !== 'undefined')
        ? `${window.location.origin}/share/${currentPageId}` : '';
      setShareLink(shareLinkToSet);
    }
    else if (currentPage?.type === 'board') {
      const viewIdToProvide = router.query.viewId;
      const shareLinkToSet = (typeof window !== 'undefined')
        ? `${window.location.origin}/share/${currentPageId}?viewId=${viewIdToProvide}` : '';
      setShareLink(shareLinkToSet);
    }
  }

  return (
    <>
      <Box
        display='flex'
        justifyContent='space-between'
        alignItems='center'
        onChange={togglePublic}
        padding={1}
      >

        <div>

          <Typography>Share to web</Typography>

          <Typography variant='body2' color='secondary'>
            {isPublic
              ? 'Anyone with the link can view'
              : 'Publish and share link with anyone'}
          </Typography>
        </div>
        <Switch
          checked={isPublic}
          disabled={pagePermissions.edit_isPublic !== true}
        />
      </Box>
      <Collapse in={isPublic}>
        {
          shareLink && (
          <LinkBox p={1}>
            <StyledInput
              fullWidth
              disableUnderline
              value={shareLink}
              endAdornment={(
                <CopyToClipboard text={shareLink} onCopy={onCopy}>
                  <Button color='secondary' variant='text' size='small'>
                    {copied ? 'Copied!' : 'Copy'}
                  </Button>
                </CopyToClipboard>
            )}
            />
          </LinkBox>
          )
        }
      </Collapse>
    </>
  );
}
