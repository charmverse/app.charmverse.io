import type { Page, PageType } from '@charmverse/core/dist/prisma';
import FileCopyOutlinedIcon from '@mui/icons-material/FileCopyOutlined';
import { ListItemButton, ListItemIcon, ListItemText, Tooltip } from '@mui/material';
import { useRouter } from 'next/router';

import charmClient from 'charmClient';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import type { DuplicatePageResponse } from 'lib/pages/duplicatePage';
import type { IPagePermissionFlags } from 'lib/permissions/pages';

const excludedPageTypes: PageType[] = ['bounty_template', 'proposal_template'];

export function DuplicatePageAction({
  page,
  pagePermissions,
  redirect = false,
  postDuplication
}: {
  page: Pick<Page, 'id' | 'type'> & { parentId?: string | null };
  pagePermissions?: IPagePermissionFlags;
  redirect?: boolean;
  postDuplication?: (duplicatePageResponse: DuplicatePageResponse) => void;
}) {
  const duplicatePageDisabled = !pagePermissions?.read;

  const currentSpace = useCurrentSpace();
  const router = useRouter();

  async function duplicatePage() {
    if (currentSpace) {
      const duplicatePageResponse = await charmClient.pages.duplicatePage({
        pageId: page.id
      });
      const { pages, rootPageId } = duplicatePageResponse;
      const duplicatedRootPage = pages.find((_page) => _page.id === rootPageId);
      if (duplicatedRootPage && redirect) {
        router.push(`/${router.query.domain}/${duplicatedRootPage.path}`);
      }
      postDuplication?.(duplicatePageResponse);
    }
  }

  return (
    <Tooltip
      arrow
      placement='top'
      title={
        excludedPageTypes.includes(page.type)
          ? "Page can't be duplicated"
          : duplicatePageDisabled
          ? 'You do not have permission to duplicate this page'
          : ''
      }
    >
      <div>
        <ListItemButton
          dense
          disabled={excludedPageTypes.includes(page.type) || duplicatePageDisabled}
          onClick={duplicatePage}
        >
          <ListItemIcon>
            <FileCopyOutlinedIcon fontSize='small' />
          </ListItemIcon>
          <ListItemText>Duplicate</ListItemText>
        </ListItemButton>
      </div>
    </Tooltip>
  );
}
