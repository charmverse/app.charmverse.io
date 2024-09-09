import { rafCommandExec } from '@bangle.dev/utils';
import type { Page } from '@charmverse/core/prisma';
import { useCallback } from 'react';

import { useEditorViewContext } from 'components/common/CharmEditor/components/@bangle.dev/react/hooks';
import { useCharmRouter } from 'hooks/useCharmRouter';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useUser } from 'hooks/useUser';
import { addPage } from 'lib/pages/addPage';

export function useAddNestedPage(currentPageId?: string) {
  const { space } = useCurrentSpace();
  const { user } = useUser();
  const view = useEditorViewContext();
  const { navigateToSpacePath } = useCharmRouter();
  const cardId = new URLSearchParams(window.location.search).get('cardId');
  const isInsideCard = cardId && cardId?.length !== 0;
  const addNestedPage = useCallback(
    async (type?: Page['type']) => {
      if (user && space) {
        await addPage(
          {
            createdBy: user.id,
            spaceId: space.id,
            type: type ?? 'page',
            parentId: isInsideCard ? cardId : currentPageId
          },
          {
            cb: (page) => {
              rafCommandExec(view, (state, dispatch) => {
                const nestedPageNode = state.schema.nodes.page.create({
                  id: page.id
                });
                if (dispatch) {
                  dispatch(state.tr.replaceSelectionWith(nestedPageNode));
                  // A small delay to let the inserted page be saved in the editor
                  setTimeout(() => {
                    navigateToSpacePath(`/${page.path}`);
                  }, 500);
                }
                return true;
              });
            },
            trigger: 'editor'
          }
        );
      }
    },
    [currentPageId, view]
  );

  return {
    addNestedPage
  };
}
