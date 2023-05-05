import type { PageType } from '@charmverse/core/prisma';
import FileCopyOutlinedIcon from '@mui/icons-material/FileCopyOutlined';
import { MenuItem, ListItemIcon, ListItemText, Tooltip } from '@mui/material';
import { useRouter } from 'next/router';

import charmClient from 'charmClient';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import type { DuplicatePageResponse } from 'lib/pages/duplicatePage';
import type { IPagePermissionFlags } from 'lib/permissions/pages';

const excludedPageTypes: (PageType | undefined)[] = ['bounty_template', 'proposal_template'];

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
  onComplete?: (duplicatePageResponse: DuplicatePageResponse) => void;
  pagePermissions: IPagePermissionFlags | undefined;
}) {
  const currentSpace = useCurrentSpace();
  const router = useRouter();

  const disabled = !pagePermissions?.read;

  async function duplicatePage() {
    if (currentSpace) {
      const duplicatePageResponse = await charmClient.pages.duplicatePage({
        pageId
      });
      const { pages, rootPageId } = duplicatePageResponse;
      const duplicatedRootPage = pages.find((_page) => _page.id === rootPageId);
      if (duplicatedRootPage && redirect) {
        router.push(`/${router.query.domain}/${duplicatedRootPage.path}`);
      }
      onComplete?.(duplicatePageResponse);
    }
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
        <MenuItem dense disabled={excludedPageTypes.includes(pageType) || disabled} onClick={duplicatePage}>
          <ListItemIcon>
            <FileCopyOutlinedIcon fontSize='small' />
          </ListItemIcon>
          <ListItemText>Duplicate</ListItemText>
        </MenuItem>
      </div>
    </Tooltip>
  );
}
