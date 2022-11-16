import { useEditorViewContext } from '@bangle.dev/react';
import { rafCommandExec } from '@bangle.dev/utils/pm-helpers';
import type { Page } from '@prisma/client';
import { useRouter } from 'next/router';
import { useCallback } from 'react';

import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { usePages } from 'hooks/usePages';
import { useUser } from 'hooks/useUser';
import { addPage } from 'lib/pages';

export default function useNestedPage () {
  const space = useCurrentSpace();
  const { user } = useUser();
  const { currentPageId } = usePages();
  const view = useEditorViewContext();
  const router = useRouter();
  const cardId = (new URLSearchParams(window.location.search)).get('cardId');
  const isInsideCard = (cardId && cardId?.length !== 0);
  const addNestedPage = useCallback(async (type?: Page['type']) => {
    if (user && space) {
      const { page } = await addPage({
        createdBy: user.id,
        spaceId: space.id,
        type: type ?? 'page',
        parentId: isInsideCard ? cardId : currentPageId
      });
      rafCommandExec(view, (state, dispatch) => {
        const nestedPageNode = state.schema.nodes.page.create({
          id: page.id
        });
        if (dispatch) {
          dispatch(state.tr.replaceSelectionWith(nestedPageNode));
          if (isInsideCard) {
            // A small delay to let the inserted page be saved in the editor
            setTimeout(() => {
              router.push(`/${router.query.domain}/${page.path}`);
            }, 100);
          }
          else {
            router.push(`/${router.query.domain}/${page.path}`);
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
