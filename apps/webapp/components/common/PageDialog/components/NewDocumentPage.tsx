import type { Theme } from '@mui/material';
import { styled, Box, useMediaQuery } from '@mui/material';
import type { PageContent } from '@packages/charmeditor/interfaces';
import type { RefObject } from 'react';
import { useRef } from 'react';
import { useResizeObserver } from 'usehooks-ts';

import PageBanner from 'components/[pageId]/DocumentPage/components/PageBanner';
import { PageEditorContainer } from 'components/[pageId]/DocumentPage/components/PageEditorContainer';
import PageHeader, { getPageTop } from 'components/[pageId]/DocumentPage/components/PageHeader';
import { PageTemplateBanner } from 'components/[pageId]/DocumentPage/components/PageTemplateBanner';
import { CharmEditor } from 'components/common/CharmEditor';
import { focusEventName } from 'components/common/CharmEditor/constants';
import { fontClassName } from 'theme/fonts';

import { EMPTY_PAGE_VALUES } from '../hooks/useNewPage';
import type { NewPageValues } from '../hooks/useNewPage';

const StyledContainer = styled(PageEditorContainer)`
  margin-bottom: 180px;
`;
type Props = {
  children: React.ReactNode;
  placeholder?: string;
  titlePlaceholder?: string;
  values: NewPageValues | null;
  onChange: (values: Partial<NewPageValues | null>) => void;
  headerBannerTitle?: string;
  readOnly?: boolean; // TODO: Dont use NewDocumentPage for editing proposal rewards. It's not really "New" in that sense... or rename this component
};

// Note: this component is only used before a page is saved to the DB
export function NewDocumentPage({
  children,
  placeholder,
  titlePlaceholder,
  values: newPageValues,
  onChange,
  headerBannerTitle,
  readOnly
}: Props) {
  newPageValues ||= EMPTY_PAGE_VALUES;
  const containerWidthRef = useRef<HTMLDivElement>(null);
  const { width: containerWidth = 0 } = useResizeObserver({ ref: containerWidthRef as RefObject<HTMLElement> });
  const isSmallScreen = useMediaQuery((theme: Theme) => theme.breakpoints.down('lg'));

  function focusDocumentEditor() {
    const focusEvent = new CustomEvent(focusEventName);
    // TODO: use a ref passed down instead
    document.querySelector(`.bangle-editor-core`)?.dispatchEvent(focusEvent);
  }

  return (
    <div className={`document-print-container ${fontClassName}`}>
      <Box ref={containerWidthRef} display='flex' flexDirection='column'>
        <PageTemplateBanner pageType={newPageValues.type} isNewPage customTitle={headerBannerTitle} />
        {newPageValues.headerImage && <PageBanner headerImage={newPageValues.headerImage} setPage={onChange} />}
        <StyledContainer data-test='page-charmeditor' top={getPageTop(newPageValues)} fullWidth={isSmallScreen}>
          <Box minHeight={450}>
            {/* temporary? disable editing of page title when in suggestion mode */}
            <PageHeader
              headerImage={newPageValues.headerImage || null}
              icon={newPageValues.icon || null}
              updatedAt={new Date().toString()}
              title={newPageValues.title || ''}
              readOnly={!!readOnly}
              setPage={onChange}
              placeholder={titlePlaceholder}
              focusDocumentEditor={focusDocumentEditor}
            />
            <div className='focalboard-body font-family-default'>
              <div className='CardDetail content'>{children}</div>
            </div>
            <CharmEditor
              placeholderText={placeholder}
              content={newPageValues.content as PageContent}
              autoFocus={false}
              readOnly={readOnly}
              enableVoting={false}
              containerWidth={containerWidth}
              pageType={newPageValues.type}
              disableNestedPages
              onContentChange={({ rawText, doc }) => onChange({ content: doc, contentText: rawText })}
              focusOnInit
              isContentControlled
            />
          </Box>
        </StyledContainer>
      </Box>
    </div>
  );
}
