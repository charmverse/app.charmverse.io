import { useEditorViewContext } from '@bangle.dev/react';
import { rafCommandExec } from '@bangle.dev/utils/pm-helpers';
import { Page } from '@prisma/client';
import { insertNode } from 'components/common/CharmEditor/utils';
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
      return insertNode(state, dispatch, state.schema.nodes.page.create({
        id: page.id
      }));
    });
  }, [currentPageId, addPage, view]);

  return {
    addNestedPage
  };
}
