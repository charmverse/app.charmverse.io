import FileCopyOutlinedIcon from '@mui/icons-material/FileCopyOutlined';
import { ListItemButton, ListItemIcon, ListItemText, Tooltip } from '@mui/material';
import type { Page, PageType } from '@prisma/client';
import { useRouter } from 'next/router';

import charmClient from 'charmClient';
import { initialLoad } from 'components/common/BoardEditor/focalboard/src/store/initialLoad';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import type { DuplicatePageResponse } from 'lib/pages';
import type { IPagePermissionFlags } from 'lib/permissions/pages';

import { useAppDispatch } from './BoardEditor/focalboard/src/store/hooks';

const excludedPageTypes: PageType[] = ['bounty_template', 'proposal_template'];

export function DuplicatePageAction({
  page,
  pagePermissions,
  skipRedirection = false,
  postDuplication
}: {
  page: Pick<Page, 'id' | 'type'> & { parentId?: string | null };
  pagePermissions?: IPagePermissionFlags;
  skipRedirection?: boolean;
  postDuplication?: (duplicatePageResponse: DuplicatePageResponse) => void;
}) {
  const duplicatePageDisabled = !pagePermissions?.edit_content;

  const currentSpace = useCurrentSpace();
  const dispatch = useAppDispatch();
  const router = useRouter();

  async function duplicatePage() {
    if (currentSpace) {
      const duplicatePageResponse = await charmClient.pages.duplicatePage({
        pageId: page.id,
        parentId: page.parentId
      });
      const { pages, rootPageIds } = duplicatePageResponse;
      const duplicatedRootPage = pages.find((_page) => _page.id === rootPageIds[0]);
      dispatch(initialLoad({ spaceId: currentSpace.id }));
      if (duplicatedRootPage && !skipRedirection) {
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
