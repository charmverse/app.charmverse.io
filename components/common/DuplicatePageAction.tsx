import FileCopyIcon from '@mui/icons-material/FileCopy';
import type { SxProps } from '@mui/material';
import { ListItemButton, ListItemIcon, ListItemText, Tooltip } from '@mui/material';
import { useRouter } from 'next/router';
import { mutate } from 'swr';

import charmClient from 'charmClient';
import { initialLoad } from 'components/common/BoardEditor/focalboard/src/store/initialLoad';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import type { PageMeta, PagesMap } from 'lib/pages';
import type { IPagePermissionFlags } from 'lib/permissions/pages';

import { useAppDispatch } from './BoardEditor/focalboard/src/store/hooks';

export function DuplicatePageAction({
  page,
  pagePermissions,
  skipRedirection = false,
  sx
}: {
  sx?: SxProps;
  page: PageMeta;
  pagePermissions?: IPagePermissionFlags;
  skipRedirection?: boolean;
}) {
  const duplicatePageDisabled = !pagePermissions?.edit_content;
  const currentSpace = useCurrentSpace();
  const dispatch = useAppDispatch();
  const router = useRouter();

  async function duplicatePage() {
    if (currentSpace) {
      const { pages, rootPageIds } = await charmClient.pages.duplicatePage({
        pageId: page.id,
        parentId: page.parentId
      });
      const duplicatedRootPage = pages.find((_page) => _page.id === rootPageIds[0]);
      dispatch(initialLoad({ spaceId: currentSpace.id }));
      await mutate(
        `pages/${currentSpace.id}`,
        (_pages: PagesMap | undefined) => {
          return _pages ?? {};
        },
        {
          revalidate: true
        }
      );
      if (duplicatedRootPage && !skipRedirection) {
        router.push(`/${router.query.domain}/${duplicatedRootPage.path}`);
      }
    }
  }

  return (
    <Tooltip
      arrow
      placement='top'
      title={duplicatePageDisabled ? 'You do not have permission to duplicate this page' : ''}
    >
      <div>
        <ListItemButton sx={sx} dense disabled={duplicatePageDisabled} onClick={duplicatePage}>
          <ListItemIcon>
            <FileCopyIcon fontSize='small' />
          </ListItemIcon>
          <ListItemText>Duplicate</ListItemText>
        </ListItemButton>
      </div>
    </Tooltip>
  );
}
