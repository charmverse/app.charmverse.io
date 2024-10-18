import type { PagePermissionFlags } from '@charmverse/core/permissions';
import type { PageType } from '@charmverse/core/prisma';
import FileCopyOutlinedIcon from '@mui/icons-material/FileCopyOutlined';
import { ListItemIcon, ListItemText, MenuItem, Tooltip } from '@mui/material';

import charmClient from 'charmClient';
import { useRewards } from 'components/rewards/hooks/useRewards';
import { useCharmRouter } from 'hooks/useCharmRouter';
import { useCurrentSpacePermissions } from 'hooks/useCurrentSpacePermissions';
import { emitSocketMessage } from 'hooks/useWebSocketClient';

const excludedPageTypes: (PageType | undefined)[] = ['bounty_template', 'proposal'];

export function DuplicatePageAction({
  pageId,
  pageType,
  redirect = false,
  onComplete,
  pagePermissions
}: {
  pageId: string;
  pageType?: PageType;
  redirect?: boolean;
  onComplete?: VoidFunction;
  pagePermissions: PagePermissionFlags | undefined;
}) {
  const [userSpacePermissions] = useCurrentSpacePermissions();
  const { navigateToSpacePath } = useCharmRouter();
  const { refreshReward } = useRewards();

  const disabled = !pagePermissions?.read || !userSpacePermissions?.createPage;

  async function duplicatePage() {
    if (pageType === 'proposal_template') {
      navigateToSpacePath(`/proposals/new`, { type: 'proposal_template', template: pageId });
      onComplete?.();
    } else {
      const duplicatePageResponse = await charmClient.pages.duplicatePage({
        pageId
      });
      const { pages, rootPageId } = duplicatePageResponse;
      const duplicatedRootPage = pages.find((_page) => _page.id === rootPageId);
      if (duplicatedRootPage) {
        emitSocketMessage({
          type: 'page_duplicated',
          payload: {
            pageId: duplicatedRootPage.id
          }
        });
      }
      if (duplicatedRootPage && redirect) {
        navigateToSpacePath(`/${duplicatedRootPage.path}`);
      }
      if (pageType === 'bounty' || pageType === 'bounty_template') {
        refreshReward(duplicatePageResponse.rootPageId);
      }
    }
    onComplete?.();
  }

  return (
    <Tooltip
      arrow
      placement='top'
      title={
        excludedPageTypes.includes(pageType)
          ? 'Page type cannot be duplicated'
          : disabled
            ? 'You do not have permission to duplicate this page'
            : ''
      }
    >
      <div>
        <MenuItem
          data-testid='duplicate-page-action'
          dense
          disabled={excludedPageTypes.includes(pageType) || disabled}
          onClick={duplicatePage}
        >
          <ListItemIcon>
            <FileCopyOutlinedIcon fontSize='small' />
          </ListItemIcon>
          <ListItemText>Duplicate</ListItemText>
        </MenuItem>
      </div>
    </Tooltip>
  );
}
