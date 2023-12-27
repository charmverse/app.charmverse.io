import styled from '@emotion/styled';
import type { Theme } from '@mui/material';
import { Box, useMediaQuery } from '@mui/material';
import { useElementSize } from 'usehooks-ts';

import PageBanner from 'components/[pageId]/DocumentPage/components/PageBanner';
import { PageEditorContainer } from 'components/[pageId]/DocumentPage/components/PageEditorContainer';
import PageHeader, { getPageTop } from 'components/[pageId]/DocumentPage/components/PageHeader';
import { PageTemplateBanner } from 'components/[pageId]/DocumentPage/components/PageTemplateBanner';
import { CharmEditor } from 'components/common/CharmEditor';
import type { PageContent } from 'lib/prosemirror/interfaces';
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
};

// Note: this component is only used before a page is saved to the DB
export function NewDocumentPage({
  children,
  placeholder,
  titlePlaceholder,
  values: newPageValues,
  onChange,
  headerBannerTitle
}: Props) {
  newPageValues ||= EMPTY_PAGE_VALUES;
  const [, { width: containerWidth }] = useElementSize();
  const isSmallScreen = useMediaQuery((theme: Theme) => theme.breakpoints.down('lg'));

  return (
    <div className={`document-print-container ${fontClassName}`}>
      <Box display='flex' flexDirection='column'>
        <PageTemplateBanner pageType={newPageValues.type} isNewPage customTitle={headerBannerTitle} />
        {newPageValues.headerImage && <PageBanner headerImage={newPageValues.headerImage} setPage={onChange} />}
        <StyledContainer data-test='page-charmeditor' top={getPageTop(newPageValues)} fullWidth={isSmallScreen}>
          <Box minHeight={450}>
            <CharmEditor
              placeholderText={placeholder}
              content={newPageValues.content as PageContent}
              autoFocus={false}
              enableVoting={false}
              containerWidth={containerWidth}
              pageType={newPageValues.type}
              disableNestedPages
              onContentChange={({ rawText, doc }) => onChange({ content: doc, contentText: rawText })}
              focusOnInit
              isContentControlled
            >
              {/* temporary? disable editing of page title when in suggestion mode */}
              <PageHeader
                headerImage={newPageValues.headerImage || null}
                icon={newPageValues.icon || null}
                updatedAt={new Date().toString()}
                title={newPageValues.title || ''}
                readOnly={false}
                setPage={onChange}
                placeholder={titlePlaceholder}
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
