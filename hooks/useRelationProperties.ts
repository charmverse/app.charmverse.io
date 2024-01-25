import { useMemo } from 'react';

import { makeSelectBoard } from 'components/common/BoardEditor/focalboard/src/store/boards';
import { useAppSelector } from 'components/common/BoardEditor/focalboard/src/store/hooks';
import { getRelationPropertiesCardsRecord } from 'lib/focalboard/getRelationPropertiesCardsRecord';
import type { PublicPageResponse } from 'lib/pages';

import { usePages } from './usePages';

export function useRelationProperties({ page }: { page?: PublicPageResponse['page'] }) {
  const { pages } = usePages();
  const selectBoard = useMemo(makeSelectBoard, []);
  const activeBoard = useAppSelector((state) => selectBoard(state, page?.type === 'card' ? page?.parentId ?? '' : ''));

  const relationPropertiesCardsRecord = useMemo(
    () =>
      activeBoard && pages
        ? getRelationPropertiesCardsRecord({
            pages: Object.values(pages),
            activeBoard
          })
        : {},
    [pages, activeBoard]
  );

  return relationPropertiesCardsRecord;
}
