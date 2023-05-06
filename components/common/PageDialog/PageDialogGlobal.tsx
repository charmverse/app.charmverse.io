import { useBounties } from 'hooks/useBounties';

import { usePageDialog } from './hooks/usePageDialog';
import { PageDialog } from './PageDialog';

// a wrapper of page dialog that uses usePageDialogHook
export function PageDialogGlobal() {
  const { bounties } = useBounties();
  const { props, hidePage } = usePageDialog();
  const { bountyId, hideToolsMenu, pageId, readOnly, toolbar } = props;

  // look up bounty by pageId or bountyId
  const bounty = bounties.find((b) => b.id === bountyId || b.page.id === pageId);
  const pageIdToFetch = bounty?.page.id || (pageId as string);

  function closeDialog() {
    hidePage();
  }

  return (
    <PageDialog
      bounty={bounty}
      hideToolsMenu={hideToolsMenu}
      readOnly={readOnly}
      toolbar={toolbar}
      pageId={pageIdToFetch}
      onClose={closeDialog}
    />
  );
}
