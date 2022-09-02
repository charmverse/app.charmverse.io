import charmClient from 'charmClient';
import useSWR from 'swr';
import { useBounties } from 'hooks/useBounties';
import PageDialog from './PageDialog';
import { usePageDialog } from './hooks/usePageDialog';

// a wrapper of page dialog that uses usePageDialogHook
export default function PageDialogGlobal () {
  const { bountyId, pageId, onCloseDialog, hidePage } = usePageDialog();
  const { bounties } = useBounties();

  // look up bounty by pageId or bountyId
  const bounty = bounties.find(b => b.id === bountyId || b.page.id === pageId);
  const pageIdToFetch = bounty?.page.id || (pageId as string);

  const { data: page } = useSWR(() => Boolean(pageIdToFetch), () => charmClient.getPage(pageIdToFetch));

  function closeDialog () {
    hidePage();
    onCloseDialog?.();
  }

  return (
    <PageDialog
      bounty={bounty}
      page={page}
      onClose={closeDialog}
    />
  );
}
