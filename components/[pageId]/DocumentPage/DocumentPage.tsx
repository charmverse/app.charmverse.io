import { useCallback, memo } from 'react';
import styled from '@emotion/styled';
import Box from '@mui/material/Box';
import ScrollableWindow from 'components/common/PageLayout/components/ScrollableWindow';
import { Page, PageContent } from 'models';
import { useThreads } from 'components/common/PageLayout/PageLayout';
import CharmEditor, { ICharmEditorOutput } from '../../common/CharmEditor/CharmEditor';
import PageBanner from './components/PageBanner';
import PageHeader from './components/PageHeader';

export const Container = styled(Box)<{ top: number, showThreads: boolean }>`
  width: ${({ showThreads }) => showThreads ? '1000px' : '860px'};
  max-width: 100%;
  margin: 0 auto ${({ top }) => top + 100}px;
  padding: 0 80px;
  position: relative;
  top: ${({ top }) => top}px;
  display: flex;
  padding-bottom: ${({ theme }) => theme.spacing(5)};
  ${({ showThreads }) => showThreads && `
    margin: 0px;
    width: calc(100% - 100px);
    padding: 0px;
    padding-left: 100px;
  `}
`;

export interface IEditorProps {
  page: Page, setPage: (p: Partial<Page>) => void, readOnly?: boolean }

function Editor ({ page, setPage, readOnly = false }: IEditorProps) {
  let pageTop = 100;
  if (page.headerImage) {
    pageTop = 50;
    if (page.icon) {
      pageTop = 80;
    }
  }
  else if (page.icon) {
    pageTop = 200;
  }

  const { showThreads } = useThreads();

  const updatePageContent = useCallback((content: ICharmEditorOutput) => {
    setPage({ content: content.doc, contentText: content.rawText });
  }, [setPage]);

  return (
    <ScrollableWindow>
      {page.headerImage && <PageBanner headerImage={page.headerImage} setPage={setPage} />}
      <Box display='flex' gap={10}>
        <Container
          showThreads={showThreads}
          top={pageTop}
        >
          <CharmEditor
            key={page.id}
            content={page.content as PageContent}
            onContentChange={updatePageContent}
            readOnly={readOnly}
            showCommentThreads={showThreads}
          >
            <PageHeader
              headerImage={page.headerImage}
              icon={page.icon}
              title={page.title}
              readOnly={readOnly}
              setPage={setPage}
            />
          </CharmEditor>
        </Container>
      </Box>
    </ScrollableWindow>
  );
}

export default memo(Editor);
