import type { PageType } from '@charmverse/core/prisma';
import styled from '@emotion/styled';
import type { Theme } from '@mui/material';
import { Box, useMediaQuery } from '@mui/material';
import { useElementSize } from 'usehooks-ts';

import PageBanner from 'components/[pageId]/DocumentPage/components/PageBanner';
import PageHeader, { getPageTop } from 'components/[pageId]/DocumentPage/components/PageHeader';
import { Container } from 'components/[pageId]/DocumentPage/DocumentPage';
import { CharmEditor } from 'components/common/CharmEditor';
import type { NewPageValues } from 'components/common/PageDialog/hooks/useNewPage';
import type { PageContent } from 'lib/prosemirror/interfaces';
import { fontClassName } from 'theme/fonts';

const StyledContainer = styled(Container)`
  margin-bottom: 180px;
`;

type Props = {
  children: React.ReactNode;
  placeholder?: string;
  values: NewPageValues;
  onChange: (values: Partial<NewPageValues | null>) => void;
  pageType: PageType;
  readOnly: boolean;
};

// Note: this component is only used before a page is saved to the DB
export function NewPageDocument({ children, placeholder, values: newPageValues, onChange, pageType, readOnly }: Props) {
  const [, { width: containerWidth }] = useElementSize();
  const isSmallScreen = useMediaQuery((theme: Theme) => theme.breakpoints.down('lg'));

  return (
    <div className={`document-print-container ${fontClassName}`}>
      <Box display='flex' flexDirection='column'>
        {newPageValues.headerImage && <PageBanner headerImage={newPageValues.headerImage} setPage={onChange} />}
        <StyledContainer data-test='page-charmeditor' top={getPageTop(newPageValues)} fullWidth={isSmallScreen}>
          <Box minHeight={450}>
            <CharmEditor
              placeholderText={placeholder}
              content={newPageValues.content as PageContent}
              autoFocus={false}
              style={{
                color: readOnly ? `var(--secondary-text)` : 'inherit'
              }}
              enableVoting={false}
              containerWidth={containerWidth}
              pageType={pageType}
              disableNestedPages
              onContentChange={({ rawText, doc }) => onChange({ content: doc, contentText: rawText })}
              focusOnInit
              isContentControlled
              readOnly={readOnly}
            >
              {/* temporary? disable editing of page title when in suggestion mode */}
              <PageHeader
                headerImage={newPageValues.headerImage || null}
                icon={newPageValues.icon || null}
                updatedAt={new Date().toString()}
                title={newPageValues.title || ''}
                readOnly={false}
                setPage={onChange}
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
