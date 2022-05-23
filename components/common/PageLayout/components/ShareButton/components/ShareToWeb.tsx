import styled from '@emotion/styled';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Collapse from '@mui/material/Collapse';
import InputAdornment from '@mui/material/InputAdornment';
import Input from '@mui/material/OutlinedInput';
import Switch from '@mui/material/Switch';
import Typography from '@mui/material/Typography';
import charmClient from 'charmClient';
import Link from 'components/common/Link';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { usePages } from 'hooks/usePages';
import { IPageWithPermissions } from 'lib/pages';
import { IPagePermissionWithSource } from 'lib/permissions/pages/page-permission-interfaces';
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

export default function ShareToWeb () {

  const router = useRouter();
  // What user can do
  const { pages, setPages, currentPageId, getPagePermissions, refreshPage, currentPagePermissions } = usePages();
  const [copied, setCopied] = useState<boolean>(false);
  const [space] = useCurrentSpace();

  // Current values of the public permission
  const [publicPermission, setPublicPermission] = useState<IPagePermissionWithSource | null>(null);
  const [shareLink, setShareLink] = useState<null | string>(null);

  useEffect(() => {
    if (currentPageId) {
      // Access the raw permissions
      const permissionList = (pages[currentPageId] as IPageWithPermissions)?.permissions;

      const foundPublic = permissionList.find(publicPerm => publicPerm.public === true) ?? null;
      // Add ref to new model here
      setPublicPermission(foundPublic);
    }
    else {
      setPublicPermission(null);
    }

  }, [currentPageId, pages]);

  async function togglePublic () {
    if (publicPermission) {
      await charmClient.deletePermission(publicPermission.id);
      refreshPage(currentPageId);
    }
    else {
      const newPermission = await charmClient.createPermission({
        pageId: currentPageId,
        permissionLevel: 'view',
        public: true
      });
      refreshPage(currentPageId);
    }
  }

  useEffect(() => {
    updateShareLink();
  }, [publicPermission, router.query.viewId]);

  function onCopy () {
    setCopied(true);
    setTimeout(() => setCopied(false), 1000);
  }

  async function updateShareLink () {
    const currentPage = pages[currentPageId];
    if (!publicPermission) {
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
        padding={1}
      >

        <Box>

          <Typography>Share to web</Typography>

          <Typography variant='body2' color='secondary'>
            {publicPermission
              ? 'Anyone with the link can view'
              : 'Publish and share link with anyone'}
          </Typography>
        </Box>
        <Switch
          checked={!!publicPermission}
          disabled={currentPagePermissions?.edit_isPublic !== true}
          onChange={togglePublic}
        />
      </Box>
      <Collapse in={!!publicPermission}>
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
      {

publicPermission?.sourcePermission && (
  <Box display='block'>
    <Typography variant='caption' sx={{ ml: 1 }}>
      Inherited from
      <Link sx={{ ml: 0.5 }} href={`/${space?.domain}/${pages[publicPermission?.sourcePermission.pageId]?.path}`}>
        {pages[publicPermission?.sourcePermission.pageId]?.title || 'Untitled'}
      </Link>
    </Typography>
  </Box>
)
}
    </>
  );
}
