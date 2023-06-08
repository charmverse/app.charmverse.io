import type { AssignedPagePermission } from '@charmverse/core/permissions';
import type { PageType } from '@charmverse/core/prisma';
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

import charmClient from 'charmClient';
import Link from 'components/common/Link';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { usePagePermissions } from 'hooks/usePagePermissions';
import { usePages } from 'hooks/usePages';
import { useProposal } from 'hooks/useProposal';
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
  pagePermissions: AssignedPagePermission[];
  refreshPermissions: () => void;
}

const alerts: Partial<Record<PageType, string>> = {
  board: "Updates to this board's permissions, including whether it is public, will also apply to its cards.",
  card_template: ' This template inherits permissions from its parent board.',
  proposal: 'Proposal permissions are managed at the category level.'
};

export default function ShareToWeb({ pageId, pagePermissions, refreshPermissions }: Props) {
  const router = useRouter();
  const { pages } = usePages();
  const [copied, setCopied] = useState<boolean>(false);

  const space = useCurrentSpace();
  const publicPermission = pagePermissions.find((publicPerm) => publicPerm.assignee.group === 'public') ?? null;

  const { permissions: currentPagePermissions } = usePagePermissions({ pageIdOrPath: pageId });
  const currentPage = pages[pageId];

  const { proposal } = useProposal({ proposalId: currentPage?.proposalId });

  // Current values of the public permission
  const [shareLink, setShareLink] = useState<null | string>(null);

  const shareAlertMessage = currentPage ? alerts[currentPage.type] : undefined;

  async function togglePublic() {
    if (publicPermission) {
      await charmClient.deletePermission({ permissionId: publicPermission.id });
    } else {
      await charmClient.createPermission({
        pageId,
        permission: {
          permissionLevel: 'view',
          assignee: {
            group: 'public'
          }
        }
      });
    }
    refreshPermissions();
  }

  useEffect(() => {
    updateShareLink();
  }, [publicPermission, router.query.viewId]);

  function onCopy() {
    setCopied(true);
    setTimeout(() => setCopied(false), 1000);
  }

  async function updateShareLink() {
    if (!publicPermission) {
      setShareLink(null);
    } else if (
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

  // In the case of public proposals, we want to override the manual setting
  const disablePublicToggle = currentPagePermissions?.edit_isPublic !== true || !!space?.publicProposals;
  const isChecked =
    (!space?.publicProposals && !!publicPermission) || (!!space?.publicProposals && proposal?.status !== 'draft');
  let publicProposalToggleInfo = space?.publicProposals ? 'Your space uses public proposals. ' : null;
  if (space?.publicProposals && proposal?.status === 'draft') {
    publicProposalToggleInfo +=
      'This draft is only visible to authors and reviewers until it is progressed to the discussion stage.';
  } else if (space?.publicProposals && !!proposal) {
    publicProposalToggleInfo += 'Proposals in discussion stage and beyond are publicly visible.';
  }

  return (
    <>
      <Box display='flex' justifyContent='space-between' alignItems='center' padding={1}>
        <Box>
          <Typography>Share to web</Typography>

          <Typography variant='body2' color='secondary'>
            {publicPermission ? 'Anyone with the link can view' : 'Publish and share link with anyone'}
          </Typography>
        </Box>
        <Tooltip
          title={!currentPagePermissions?.edit_isPublic ? 'You do not have permissions to make this page public' : ''}
        >
          <Box>
            <Switch
              data-test='toggle-public-page'
              checked={isChecked}
              disabled={disablePublicToggle}
              onChange={togglePublic}
            />
          </Box>
        </Tooltip>
      </Box>

      {shareAlertMessage && (
        <Alert severity='info'>
          {publicProposalToggleInfo}
          <br />
          <br />
          {shareAlertMessage}
        </Alert>
      )}

      <Collapse in={!!publicPermission}>
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
      {publicPermission?.sourcePermission && (
        <Box display='block'>
          <Typography variant='caption' sx={{ ml: 1 }}>
            Inherited from
            <Link sx={{ ml: 0.5 }} href={`/${space?.domain}/${pages[publicPermission?.sourcePermission.pageId]?.path}`}>
              {pages[publicPermission?.sourcePermission.pageId]?.title || 'Untitled'}
            </Link>
          </Typography>
        </Box>
      )}
    </>
  );
}
