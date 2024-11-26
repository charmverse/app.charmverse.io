import type { PageMeta } from '@charmverse/core/pages';
import { ClickAwayListener, Collapse } from '@mui/material';
import type { Dispatch, SetStateAction } from 'react';
import { memo, useCallback, useEffect, useState } from 'react';

import charmClient from 'charmClient';
import { Button } from 'components/common/Button';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import type { Board, IPropertyTemplate } from 'lib/databases/board';
import type { BoardView, IViewType } from 'lib/databases/boardView';
import type { Card } from 'lib/databases/card';

import { DatabaseSidebarHeader } from './databaseSidebarHeader';
import { StyledSidebar } from './styledSidebar';
import GroupOptions from './viewGroupOptions';
import ViewLayoutOptions from './viewLayoutOptions';
import { ViewPropertyOption } from './viewPropertyOption';
import ViewPropertyOptions from './viewPropertyOptions';
import type { SidebarView } from './viewSidebarSelect';
import { ViewSidebarSelect } from './viewSidebarSelect';
import { ViewSourceOptions } from './viewSourceOptions/viewSourceOptions';

interface Props {
  board?: Board;
  rootBoard: Board; // we need the root board when creating or updating the view
  page?: PageMeta;
  view?: BoardView;
  views: BoardView[];
  closeSidebar: () => void;
  isOpen: boolean;
  groupByProperty?: IPropertyTemplate;
  pageId?: string;
  showView: (viewId: string) => void;
  hideLayoutOptions?: boolean;
  hideSourceOptions?: boolean;
  hideGroupOptions?: boolean;
  hideLayoutSelectOptions?: boolean;
  hidePropertiesRow?: boolean;
  supportedViewTypes?: IViewType[];
  cards: Card[];
  selectedPropertyId: string | null;
  setSelectedPropertyId: Dispatch<SetStateAction<string | null>>;
  sidebarView?: SidebarView;
  isProposal?: boolean;
  isReward?: boolean;
}

function getDefaultView(hasBoardView: boolean): SidebarView {
  return hasBoardView ? 'view-options' : 'source';
}

function ViewSidebar(props: Props) {
  const [sidebarView, setSidebarView] = useState<SidebarView>(props.sidebarView ?? getDefaultView(!!props.view));
  function goToSidebarHome() {
    setSidebarView('view-options');
  }
  const { space: currentSpace } = useCurrentSpace();

  const exportToCSV = useCallback(() => {
    if (currentSpace) {
      charmClient.proposals
        .exportFilteredProposals({
          spaceId: currentSpace.id
        })
        .then((csvContent) => {
          const blob = new Blob([csvContent], { type: 'text/csv' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'Proposals.csv';
          a.click();
        });
    }
  }, [currentSpace?.id]);

  useEffect(() => {
    if (!props.isOpen) {
      setSidebarView(getDefaultView(!!props.view));
    } else if (props.sidebarView) {
      setSidebarView(props.sidebarView);
    }
  }, [props.isOpen, props.sidebarView]);

  const onClose = () => {
    props.closeSidebar();
    props.setSelectedPropertyId(null);
  };

  const selectedProperty = props.board?.fields.cardProperties.find((p) => p.id === props.selectedPropertyId);

  return (
    <ClickAwayListener mouseEvent={props.isOpen ? 'onMouseDown' : false} onClickAway={onClose}>
      <Collapse
        in={props.isOpen}
        orientation='horizontal'
        sx={{ position: 'absolute', right: 0, top: 0, bottom: 0, zIndex: 1000 }}
      >
        <StyledSidebar data-test='view-sidebar-content' className='disable-drag-selection'>
          {sidebarView === 'view-options' && <ViewSidebarSelect {...props} setSidebarView={setSidebarView} />}

          {props.view && (
            <>
              {sidebarView === 'layout' && (
                <>
                  <DatabaseSidebarHeader goBack={goToSidebarHome} title='Layout' onClose={onClose} />
                  <ViewLayoutOptions
                    hideLayoutSelectOptions={props.hideLayoutSelectOptions}
                    board={props.board}
                    view={props.view}
                    supportedViewTypes={props.supportedViewTypes}
                  />
                </>
              )}
              {sidebarView === 'card-properties' && (
                <>
                  <DatabaseSidebarHeader goBack={goToSidebarHome} title='Properties' onClose={onClose} />
                  <ViewPropertyOptions
                    setSelectedProperty={(property) => {
                      props.setSelectedPropertyId(property.id);
                      setSidebarView('card-property');
                    }}
                    properties={props.board?.fields.cardProperties ?? []}
                    view={props.view}
                  />
                </>
              )}
              {sidebarView === 'group-by' && (
                <>
                  <DatabaseSidebarHeader goBack={goToSidebarHome} title='Group by' onClose={onClose} />
                  <GroupOptions
                    properties={props.board?.fields.cardProperties || []}
                    view={props.view}
                    groupByProperty={props.groupByProperty}
                  />
                </>
              )}
              {sidebarView === 'card-property' && selectedProperty && props.board && props.view && (
                <>
                  <DatabaseSidebarHeader
                    goBack={() => {
                      setSidebarView('card-properties');
                    }}
                    title='Edit property'
                    onClose={onClose}
                  />
                  <ViewPropertyOption
                    goBackStep={() => {
                      setSidebarView('card-properties');
                    }}
                    views={props.views}
                    board={props.board}
                    view={props.view}
                    cards={props.cards}
                    property={selectedProperty}
                  />
                </>
              )}
            </>
          )}
          {sidebarView === 'source' && (
            <ViewSourceOptions
              rootBoard={props.rootBoard}
              title='Data source'
              view={props.view}
              views={props.views}
              // We don't want to allow going back if this board is locked to charmverse databases
              closeSourceOptions={goToSidebarHome}
              closeSidebar={onClose}
              showView={props.showView}
              isReward={props.isReward}
            />
          )}
          {props.isProposal && (
            <Button variant='outlined' size='small' onClick={exportToCSV} sx={{ my: 1, mx: 2 }}>
              Export to CSV
            </Button>
          )}
        </StyledSidebar>
      </Collapse>
    </ClickAwayListener>
  );
}

export default memo(ViewSidebar);
