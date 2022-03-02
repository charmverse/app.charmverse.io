import { Fragment } from '@bangle.dev/pm';
import { useEditorViewContext } from '@bangle.dev/react';
import { rafCommandExec } from '@bangle.dev/utils/pm-helpers';
import { insertNode } from 'components/editor/@bangle.io/extensions/inline-command-palette/use-editor-items';
import { useCallback } from 'react';
import { usePages } from './usePages';

export default function useNestedPage () {
  const { currentPage, addPage } = usePages();
  const view = useEditorViewContext();

  const addNestedPage = useCallback(async () => {
    const page = await addPage({
      parentId: currentPage?.id
    });

    rafCommandExec(view!, (state, dispatch) => {
      return insertNode(state, dispatch, state.schema.nodes.paragraph.create(
        undefined,
        Fragment.fromArray([
          state.schema.nodes.page.create({
            path: page.path,
            id: page.id
          })
        ])
      ));
    });
  }, [currentPage, addPage, view]);

  return {
    addNestedPage
  };
}
