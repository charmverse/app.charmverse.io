import { useEditorViewContext } from '@bangle.dev/react';
import { rafCommandExec } from '@bangle.dev/utils/pm-helpers';
import { useCallback } from 'react';
import { usePages } from 'hooks/usePages';
import { addPage } from 'lib/pages';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useUser } from 'hooks/useUser';
import { v4 } from 'uuid';
import { useRouter } from 'next/router';

export default function useNestedPage () {
  const [space] = useCurrentSpace();
  const [user] = useUser();
  const { currentPageId } = usePages();
  const view = useEditorViewContext();
  const router = useRouter();
  const cardId = (new URLSearchParams(window.location.search)).get('cardId');
  const isInsideCard = (cardId && cardId?.length !== 0);
  const addNestedPage = useCallback(async () => {
    if (user && space) {
      const pageId = v4();
      const newPage = await addPage({
        id: pageId,
        createdBy: user.id,
        parentId: isInsideCard ? cardId : currentPageId,
        spaceId: space.id
      });
      rafCommandExec(view, (state, dispatch) => {
        const nestedPageNode = state.schema.nodes.page.create({
          id: pageId
        });
        if (dispatch) {
          dispatch(state.tr.replaceSelectionWith(nestedPageNode));
          if (isInsideCard) {
            // A small delay to let the inserted page be saved in the editor
            setTimeout(() => {
              router.push(`/${router.query.domain}/${newPage.path}`);
            }, 150);
          }
          else {
            router.push(`/${router.query.domain}/${newPage.path}`);
          }
        }
        return true;
      });
    }
  }, [currentPageId, view]);

  return {
    addNestedPage
  };
}
