import styled from '@emotion/styled';
import type { Theme } from '@mui/material';
import { Box, useMediaQuery } from '@mui/material';
import { useElementSize } from 'usehooks-ts';

import PageBanner from 'components/[pageId]/DocumentPage/components/PageBanner';
import PageHeader, { getPageTop } from 'components/[pageId]/DocumentPage/components/PageHeader';
import { Container } from 'components/[pageId]/DocumentPage/DocumentPage';
import { CharmEditor } from 'components/common/CharmEditor';
import { useNewPage } from 'components/common/PageDialog/hooks/useNewPage';
import { usePreventReload } from 'hooks/usePreventReload';
import type { PageContent } from 'lib/prosemirror/interfaces';
import { fontClassName } from 'theme/fonts';

const StyledContainer = styled(Container)`
  margin-bottom: 180px;
`;

// Note: this component is only used before a page is saved to the DB
export function NewPageDocument({ children }: { children: React.ReactNode }) {
  const { newPageContext, pageKey, newPageValues, updateNewPageValues } = useNewPage();
  const [, { width: containerWidth }] = useElementSize();
  const isSmallScreen = useMediaQuery((theme: Theme) => theme.breakpoints.down('lg'));

  const { readOnlyEditor, editorPlaceholder, type, contentUpdated } = newPageContext;

  usePreventReload(!!contentUpdated);

  if (!newPageValues) {
    return null;
  }
  return (
    <div className={`document-print-container ${fontClassName}`}>
      <Box display='flex' flexDirection='column'>
        {newPageValues.headerImage && (
          <PageBanner headerImage={newPageValues.headerImage} setPage={updateNewPageValues} />
        )}
        <StyledContainer data-test='page-charmeditor' top={getPageTop(newPageValues)} fullWidth={isSmallScreen}>
          <Box minHeight={450}>
            <CharmEditor
              placeholderText={editorPlaceholder}
              content={newPageValues.content as PageContent}
              autoFocus={false}
              style={{
                color: readOnlyEditor ? `var(--secondary-text)` : 'inherit'
              }}
              enableVoting={false}
              containerWidth={containerWidth}
              pageType={type}
              disableNestedPages
              onContentChange={({ rawText, doc }) => updateNewPageValues({ content: doc, contentText: rawText })}
              focusOnInit
              isContentControlled
              readOnly={readOnlyEditor}
              key={`${String(pageKey)}.${readOnlyEditor}`}
            >
              {/* temporary? disable editing of page title when in suggestion mode */}
              <PageHeader
                headerImage={newPageValues.headerImage || null}
                icon={newPageValues.icon || null}
                updatedAt={new Date().toString()}
                title={newPageValues.title || ''}
                readOnly={false}
                setPage={updateNewPageValues}
              />
              <div className='focalboard-body font-family-default'>
                <div className='CardDetail content'>{children}</div>
              </div>
            </CharmEditor>
          </Box>
        </StyledContainer>
      </Box>
    </div>
  );
}
