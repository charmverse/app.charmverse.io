import { useEditorViewContext } from '@bangle.dev/react';
import { rafCommandExec } from '@bangle.dev/utils/pm-helpers';
import { Page } from '@prisma/client';
import { useCallback } from 'react';
import { usePages } from 'hooks/usePages';

export default function useNestedPage () {
  const { currentPageId, addPage, pages } = usePages();
  const view = useEditorViewContext();

  const addNestedPage = useCallback(async (pageId?: string) => {
    let page: Page | undefined;
    // Creating a new page
    if (!pageId) {
      page = await addPage({
        parentId: currentPageId
      });
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
  }, [currentPageId, addPage, view]);

  return {
    addNestedPage
  };
}
