import { useEditorViewContext } from '@bangle.dev/react';
import { rafCommandExec } from '@bangle.dev/utils/pm-helpers';
import { useCallback } from 'react';
import { usePages } from 'hooks/usePages';
import { addPage } from 'lib/pages';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useUser } from 'hooks/useUser';
import { v4 } from 'uuid';
import { useRouter } from 'next/router';
import { Page } from '@prisma/client';

export default function useNestedPage () {
  const [space] = useCurrentSpace();
  const [user] = useUser();
  const { currentPageId } = usePages();
  const view = useEditorViewContext();
  const router = useRouter();
  const addNestedPage = useCallback(async (type?: Page['type']) => {
    if (user && space) {
      const pageId = v4();
      const newPage = await addPage({
        id: pageId,
        createdBy: user.id,
        parentId: currentPageId,
        spaceId: space.id,
        type: type ?? 'page'
      });
      rafCommandExec(view, (state, dispatch) => {
        const nestedPageNode = state.schema.nodes.page.create({
          id: pageId
        });
        if (dispatch) {
          dispatch(state.tr.replaceSelectionWith(nestedPageNode));
          router.push(`/${router.query.domain}/${newPage.path}`);
        }
        return true;
      });
    }
  }, [currentPageId, view]);

  return {
    addNestedPage
  };
}
