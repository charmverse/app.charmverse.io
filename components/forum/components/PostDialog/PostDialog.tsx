import { usePopupState } from 'material-ui-popup-state/hooks';
import { useEffect, useRef } from 'react';

import Dialog from 'components/common/BoardEditor/focalboard/src/components/dialog';
import RootPortal from 'components/common/BoardEditor/focalboard/src/components/rootPortal';
import type { ForumPostPage } from 'lib/forums/posts/interfaces';

import { PostPage } from '../PostPage/PostPage';

interface Props {
  page?: ForumPostPage | null;
  spaceId: string;
  onClose: () => void;
  open?: boolean;
}

export default function PostDialog(props: Props) {
  const { page } = props;
  const mounted = useRef(false);
  const popupState = usePopupState({ variant: 'popover', popupId: 'post-dialog' });

  // keep track if charmeditor is mounted. There is a bug that it calls the update method on closing the modal, but content is empty
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  // open modal when page is set
  useEffect(() => {
    if (page) {
      popupState.open();
    }
  }, [!!page]);

  // open modal when page is set
  useEffect(() => {
    if (props.open) {
      popupState.open();
    }
  }, [props.open]);

  function onClose() {
    popupState.close();
    props.onClose();
  }

  return (
    <RootPortal>
      {popupState.isOpen && (
        <Dialog fullWidth hideCloseButton onClose={onClose}>
          <PostPage page={page ?? null} spaceId={props.spaceId} onSave={onClose} />
        </Dialog>
      )}
    </RootPortal>
  );
}
