
import { Page } from '@prisma/client'
import charmClient from 'charmClient'
import DocumentPage from 'components/[pageId]/DocumentPage'
import { usePages } from 'hooks/usePages'
import log from 'lib/log'
import debouncePromise from 'lib/utilities/debouncePromise'
import { useCallback, useEffect, useRef } from 'react'
import { Card } from '../../blocks/card'
import { findParentOfType } from 'lib/pages/findParentOfType';

type Props = {
    card: Card
    readonly: boolean
}

function CardDetail (props: Props): JSX.Element|null {
  const { card, readonly } = props;

  const mounted = useRef(false);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const { pages, setPages } = usePages();

  const debouncedPageUpdate = debouncePromise(async (updates: Partial<Page>) => {
    const updatedPage = await charmClient.updatePage(updates);
    setPages((_pages) => ({
      ..._pages,
      [card.id]: updatedPage
    }));
    return updatedPage;
  }, 500);

  const setPage = useCallback(async (updates: Partial<Page>) => {
    if (mounted.current) {
      debouncedPageUpdate({ id: card.id, ...updates } as Partial<Page>)
        .catch((err: any) => {
          log.error('Error saving page', err);
        });
    }
  }, [card]);

  const parentProposalId = findParentOfType({ pageId: card.id, pageType: 'proposal', pageMap: pages });

  const page = pages[card?.id];
  if (!card || !page) {
    return null;
  }
  return (
    <DocumentPage
      page={page}
      setPage={setPage}
      readOnly={readonly}
      parentProposalId={parentProposalId}
    />
  );
}

export default CardDetail;
