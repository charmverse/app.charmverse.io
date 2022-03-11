import { useEditorViewContext } from '@bangle.dev/react';
import { rafCommandExec } from '@bangle.dev/utils/pm-helpers';
import { Page } from '@prisma/client';
import { insertNode } from 'components/editor/@bangle.io/extensions/inline-command-palette/use-editor-items';
import { useCallback } from 'react';
import { usePages } from './usePages';

export default function useNestedPage () {
  const { currentPage, addPage, pagesRecord } = usePages();
  const view = useEditorViewContext();

  const addNestedPage = useCallback(async (pageId?: string) => {
    let page: Page = null as any;
    // Creating a new page
    if (!pageId) {
      page = await addPage({
        parentId: currentPage?.id
      });
    }
    else {
      page = pagesRecord[pageId];
    }

    rafCommandExec(view!, (state, dispatch) => {
      return insertNode(state, dispatch, state.schema.nodes.page.create({
        path: page.path,
        id: page.id
      }));
    });
  }, [currentPage, addPage, view]);

  return {
    addNestedPage
  };
}
