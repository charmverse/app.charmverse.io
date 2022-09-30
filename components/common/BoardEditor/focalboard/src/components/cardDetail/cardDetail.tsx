
import { Page } from '@prisma/client'
import DocumentPage from 'components/[pageId]/DocumentPage'
import { usePages } from 'hooks/usePages'
import log from 'lib/log'
import debouncePromise from 'lib/utilities/debouncePromise'
import { useCallback, useEffect, useRef } from 'react'
import { Card } from '../../blocks/card'
import { findParentOfType } from 'lib/pages/findParentOfType';
import { PageUpdates } from 'lib/pages'

type Props = {
    card: Card
    readOnly: boolean
}

function CardDetail (props: Props): JSX.Element|null {
  const { card, readOnly } = props;

  const mounted = useRef(false);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const { pages, updatePage } = usePages();

  const debouncedPageUpdate = debouncePromise(async (updates: PageUpdates) => {
    const updatedPage = await updatePage(updates);
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
      readOnly={readOnly}
      parentProposalId={parentProposalId}
    />
  );
}

export default CardDetail;
