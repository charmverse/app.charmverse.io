import { usePageDialog } from './hooks/usePageDialog';
import { PageDialog } from './PageDialog';

// a wrapper of page dialog that uses usePageDialogHook
export function PageDialogGlobal() {
  const { props, hidePage } = usePageDialog();
  const { bountyId, hideToolsMenu, pageId, readOnly, toolbar } = props;
  function closeDialog() {
    hidePage();
  }

  return (
    <PageDialog
      hideToolsMenu={hideToolsMenu}
      readOnly={readOnly}
      toolbar={toolbar}
      pageId={bountyId || (pageId as string)}
      onClose={closeDialog}
    />
  );
}
