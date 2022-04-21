import styled from '@emotion/styled';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Collapse from '@mui/material/Collapse';
import Input from '@mui/material/OutlinedInput';
import InputAdornment from '@mui/material/InputAdornment';
import { IPagePermissionFlags } from 'lib/permissions/pages/page-permission-interfaces';
import Switch from '@mui/material/Switch';
import Typography from '@mui/material/Typography';
import charmClient from 'charmClient';
import { usePages } from 'hooks/usePages';
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

export default function ShareToWeb ({ pagePermissions }: { pagePermissions: IPagePermissionFlags, }) {

  const router = useRouter();
  const { currentPageId, pages, setPages } = usePages();
  const [copied, setCopied] = useState<boolean>(false);
  const [isPublic, setIsPublic] = useState(false);
  const [shareLink, setShareLink] = useState<null | string>(null);
  console.log(shareLink);
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
    console.log('update share link', isPublic);
    updateShareLink();
  }, [isPublic, router.query.viewId]);

  function onCopy () {
    setCopied(true);
    setTimeout(() => setCopied(false), 1000);
  }

  async function updateShareLink () {
    const currentPage = pages[currentPageId];
    console.log(currentPage);
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
