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
  redirect = false,
  postDuplication,
  pagePermissions
}: {
  page: Pick<Page, 'id' | 'type'> & { parentId?: string | null };
  redirect?: boolean;
  postDuplication?: (duplicatePageResponse: DuplicatePageResponse) => void;
  pagePermissions: IPagePermissionFlags | undefined;
}) {
  const currentSpace = useCurrentSpace();
  const router = useRouter();

  const disabled = !pagePermissions?.read;

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
          ? 'Page type cannot be duplicated'
          : disabled
          ? 'You do not have permission to duplicate this page'
          : ''
      }
    >
      <div>
        <ListItemButton dense disabled={excludedPageTypes.includes(page.type) || disabled} onClick={duplicatePage}>
          <ListItemIcon>
            <FileCopyOutlinedIcon fontSize='small' />
          </ListItemIcon>
          <ListItemText>Duplicate</ListItemText>
        </ListItemButton>
      </div>
    </Tooltip>
  );
}
