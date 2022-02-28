import { Fragment } from '@bangle.dev/pm';
import { useEditorViewContext } from '@bangle.dev/react';
import { rafCommandExec } from '@bangle.dev/utils/pm-helpers';
import { insertNode } from 'components/editor/@bangle.io/extensions/inline-command-palette/use-editor-items';
import { usePages } from './usePages';

export default function useNestedPage () {
  const { currentPage, addPage } = usePages();
  const view = useEditorViewContext();

  return {
    async addNestedPage () {
      const page = await addPage(undefined, {
        parentId: currentPage?.id
      }, false);

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
    }
  };
}
