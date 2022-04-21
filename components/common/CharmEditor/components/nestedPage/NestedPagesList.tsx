
import { useEditorViewContext, usePluginState } from '@bangle.dev/react';
import { useTheme } from '@emotion/react';
import { Menu, MenuItem, ListItemIcon } from '@mui/material';
import PageIcon from 'components/common/PageLayout/components/PageIcon';
import PageTitle from 'components/common/PageLayout/components/PageTitle';
import { usePages } from 'hooks/usePages';
import { Page, PageContent } from 'models';
import { useCallback } from 'react';
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

  function onClose () {
    hideSuggestionsTooltip(NestedPagePluginKey)(view.state, view.dispatch, view);
  }

  return (
    <Menu anchorEl={tooltipContentDOM} open={isVisible} onClose={onClose} sx={{ maxHeight: 400 }}>
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
              <ListItemIcon>
                <PageIcon icon={page.icon} isEditorEmpty={Boolean(isEditorEmpty)} pageType={page.type} />
              </ListItemIcon>
              <PageTitle
                hasContent={page.title.length === 0}
                sx={{
                  fontWeight: 'bold'
                }}
              >
                {page.title.length !== 0 ? page.title : 'Untitled'}
              </PageTitle>
            </>
          </MenuItem>
        );
      })}
    </Menu>
  );
}
