import { useEditorViewContext } from '@bangle.dev/react';
import { rafCommandExec } from '@bangle.dev/utils/pm-helpers';
import { Page } from '@prisma/client';
import { useCallback } from 'react';
import { usePages } from 'hooks/usePages';
import { addPage } from 'lib/pages';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useUser } from 'hooks/useUser';

export default function useNestedPage () {
  const [space] = useCurrentSpace();
  const [user] = useUser();
  const { currentPageId, pages } = usePages();
  const view = useEditorViewContext();

  const addNestedPage = useCallback(async (pageId?: string) => {
    let page: Page | undefined;
    // Creating a new page
    if (!pageId) {
      if (user && space) {
        page = await addPage({
          createdBy: user.id,
          parentId: currentPageId,
          spaceId: space.id
        });
      }
    }
    else {
      page = pages[pageId];
    }

    rafCommandExec(view, (state, dispatch) => {
      if (!page) {
        return false;
      }
      const nestedPageNode = state.schema.nodes.page.create({
        id: page.id
      });
      if (dispatch) {
        dispatch(state.tr.replaceSelectionWith(nestedPageNode));
      }
      return true;
    });
  }, [currentPageId, view]);

  return {
    addNestedPage
  };
}
