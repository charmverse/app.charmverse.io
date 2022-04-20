
import { useEditorViewContext, usePluginState } from '@bangle.dev/react';
import { useTheme } from '@emotion/react';
import { Box, ClickAwayListener, MenuItem } from '@mui/material';
import { PageIcon, PageTitle } from 'components/common/PageLayout/components/PageNavigation';
import { usePages } from 'hooks/usePages';
import { Page, PageContent } from 'models';
import { useCallback } from 'react';
import { createPortal } from 'react-dom';
import { isTruthy } from 'lib/utilities/types';
import useNestedPage from './hooks/useNestedPage';
import { hideSuggestionsTooltip } from '../@bangle.dev/tooltip/suggest-tooltip';
import { NestedPagePluginKey, NestedPagePluginState } from './nestedPage';

export default function NestedPagesList () {
  const { pages } = usePages();
  const { addNestedPage } = useNestedPage();
  const view = useEditorViewContext();
  const {
    tooltipContentDOM,
    show: isVisible
  } = usePluginState(NestedPagePluginKey) as NestedPagePluginState;

  const theme = useTheme();

  const onSelectPage = useCallback(
    (page: Page) => {
      addNestedPage(page.id);
      hideSuggestionsTooltip(NestedPagePluginKey)(view.state, view.dispatch, view);
    },
    [view]
  );

  if (isVisible) {
    return createPortal(
      <ClickAwayListener onClickAway={() => {
        hideSuggestionsTooltip(NestedPagePluginKey)(view.state, view.dispatch, view);
      }}
      >
        <Box>
          {Object.values(pages).filter(isTruthy).map(page => {
            const docContent = ((page.content) as PageContent)?.content;
            const isEditorEmpty = docContent && (docContent.length <= 1
              && (!docContent[0] || (docContent[0] as PageContent)?.content?.length === 0));

            return (
              <MenuItem
                sx={{
                  background: theme.palette.background.light
                }}
                onClick={() => onSelectPage(page)}
                key={page.id}
              >
                <>
                  <div>
                    <PageIcon icon={page.icon} isEditorEmpty={Boolean(isEditorEmpty)} pageType={page.type} />
                  </div>
                  <PageTitle
                    hasContent={page.title.length === 0}
                    sx={{
                      fontWeight: 'bold',
                      height: 26,
                      lineHeight: 26
                    }}
                  >
                    {page.title.length !== 0 ? page.title : 'Untitled'}
                  </PageTitle>
                </>
              </MenuItem>
            );
          })}
        </Box>
      </ClickAwayListener>,
      tooltipContentDOM
    );
  }
  return null;
}
