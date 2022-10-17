
import type { NodeViewProps } from '@bangle.dev/core';
import styled from '@emotion/styled';
import type { Page } from '@prisma/client';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import { useState } from 'react';

import CardDialog from 'components/common/BoardEditor/focalboard/src/components/cardDialog';
import RootPortal from 'components/common/BoardEditor/focalboard/src/components/rootPortal';
import { getSortedBoards } from 'components/common/BoardEditor/focalboard/src/store/boards';
import { getClientConfig } from 'components/common/BoardEditor/focalboard/src/store/clientConfig';
import { useAppSelector } from 'components/common/BoardEditor/focalboard/src/store/hooks';
import { getCurrentViewDisplayBy, getCurrentViewGroupBy, getSortedViews, getView } from 'components/common/BoardEditor/focalboard/src/store/views';
import FocalBoardPortal from 'components/common/BoardEditor/FocalBoardPortal';
import { usePages } from 'hooks/usePages';
import debouncePromise from 'lib/utilities/debouncePromise';

// Lazy load focalboard entrypoint (ignoring the redux state stuff for now)
const CenterPanel = dynamic(() => import('components/common/BoardEditor/focalboard/src/components/centerPanel'), {
  ssr: false
});

const StylesContainer = styled.div<{ containerWidth?: number }>`

  .BoardComponent {
    overflow: visible;
  }

  .top-head {
    padding: 0;
  }

  .container-container {
    min-width: unset;
    overflow-x: auto;
    padding: 0;
    // offset padding around document
    margin: 0 -24px;
    padding: 0 24px;
    ${({ theme }) => theme.breakpoints.up('md')} {
      --side-margin: ${({ containerWidth }) => `calc((${containerWidth}px - 100%) / 2)`};
      margin: 0 calc(-1 * var(--side-margin));
      padding: 0 var(--side-margin);
    }
    &.sidebar-visible {
      padding-right: 0;
    }
  }

  // remove extra padding on Table view
  .Table {
    margin-top: 0;

    // Hide calculations footer
    .CalculationRow {
      display: none;
    }
  }

  // remove extra padding on Kanban view
  .octo-board-header {
    padding-top: 0;
  }

  // remove extra margin on calendar view
  .fc .fc-toolbar.fc-header-toolbar {
    margin-top: 0;
  }

  // adjust columns on Gallery view
  @media screen and (min-width: 600px) {
    .Gallery {
      padding-right: 48px; // offset the left padding from .container-container
      ${({ theme }) => theme.breakpoints.up('md')} {
        padding-right: 80px;
      }
      display: grid;
      grid-template-columns: 1fr 1fr;
    }
    .GalleryCard {
      width: auto;
    }
  }
`;

interface DatabaseViewProps extends NodeViewProps {
  containerWidth?: number; // pass in the container width so we can extend full width
  readOnly?: boolean;
}

interface DatabaseView {
  // Not using linkedPageId as the source could be other things
  // source field would be used to figure out what type of source it actually is
  pageId: string;
  source: 'board_page';
}

export default function DatabaseView ({ containerWidth, readOnly: readOnlyOverride, node }: DatabaseViewProps) {
  const pageId = node.attrs.pageId as string;
  const allViews = useAppSelector(getSortedViews);
  const router = useRouter();

  const views = allViews.filter(view => view.parentId === pageId);
  const [currentViewId, setCurrentViewId] = useState<string | null>(views[0]?.id || null);
  const currentView = useAppSelector(getView(currentViewId || '')) ?? undefined;

  const groupByProperty = useAppSelector(getCurrentViewGroupBy);
  const dateDisplayProperty = useAppSelector(getCurrentViewDisplayBy);
  const { pages, updatePage, getPagePermissions } = usePages();

  const [shownCardId, setShownCardId] = useState<string | null>(null);

  const boards = useAppSelector(getSortedBoards);
  const board = boards.find(b => b.id === pageId);

  // TODO: Handle for other sources in future like workspace users
  const currentPagePermissions = getPagePermissions(pageId || '');

  function showCard (cardId: string | null) {
    setShownCardId(cardId);
  }

  const debouncedPageUpdate = debouncePromise(async (updates: Partial<Page>) => {
    const updatedPage = await updatePage({ id: pageId, ...updates });

    return updatedPage;
  }, 500);

  const readOnly = typeof readOnlyOverride === 'undefined' ? currentPagePermissions.edit_content !== true : readOnlyOverride;

  if (!board) {
    return null;
  }

  let property = groupByProperty;
  if ((!property || property.type !== 'select') && currentView?.fields.viewType === 'board') {
    property = board.fields.cardProperties.find((o: any) => o.type === 'select');
  }

  let displayProperty = dateDisplayProperty;
  if (!displayProperty && currentView?.fields.viewType === 'calendar') {
    displayProperty = board.fields.cardProperties.find((o: any) => o.type === 'date');
  }

  return (
    <>
      <StylesContainer className='focalboard-body' containerWidth={containerWidth}>
        <CenterPanel
          // @ts-ignore types are wrong for some reason (disableUpdatingUrl should be a prop)
          disableUpdatingUrl
          onViewTabClick={(viewId: string) => {
            setCurrentViewId(viewId);
          }}
          onDeleteView={(viewId: string) => {
            setCurrentViewId(views.filter(view => view.id !== viewId)?.[0]?.id ?? null);
          }}
          hideBanner
          readOnly={readOnly}
          board={board}
          embeddedBoardPath={pages[pageId]?.path}
          setPage={debouncedPageUpdate}
          showCard={showCard}
          activeView={currentView}
          views={views}
          // Show more tabs on shared inline database as the space gets increased
          maxTabsShown={router.pathname.startsWith('/share') ? 5 : 3}
        />
      </StylesContainer>
      {typeof shownCardId === 'string' && shownCardId.length !== 0 && (
        <RootPortal>
          <CardDialog
            key={shownCardId}
            cardId={shownCardId}
            onClose={() => showCard(null)}
            readOnly={readOnly}
          />
        </RootPortal>
      )}
      <FocalBoardPortal />
    </>
  );
}
