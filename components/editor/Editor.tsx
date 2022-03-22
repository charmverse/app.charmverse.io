import { useCallback, memo, useMemo } from 'react';
import styled from '@emotion/styled';
import Box from '@mui/material/Box';
import { ScrollableWindow } from 'components/common/page-layout/ScrollableWindow';
import { Page, PageContent } from 'models';
import CharmEditor, { ICharmEditorOutput } from './CharmEditor';
import PageBanner from './Page/PageBanner';
import PageHeader from './Page/PageHeader';

export const Container = styled(Box)<{ top: number }>`
  width: 860px;
  max-width: 100%;
  margin: 0 auto 5px;
  padding: 0 80px;
  position: relative;
  top: ${({ top }) => top}px;
  padding-bottom: ${({ theme }) => theme.spacing(5)};
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

  const updatePageContent = useCallback((content: ICharmEditorOutput) => {
    setPage({ content: content.doc, contentText: content.rawText });
  }, [setPage]);

  // we only need to provide page content the first time
  const pageContent = useMemo(() => {
    return page.content as PageContent;
  }, [page.id]);

  return (
    <ScrollableWindow>
      {page.headerImage && <PageBanner headerImage={page.headerImage} setPage={setPage} />}
      <Container
        top={pageTop}
      >
        <CharmEditor
          key={page.id}
          content={pageContent}
          onPageContentChange={updatePageContent}
          readOnly={readOnly}
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
    </ScrollableWindow>
  );
}

export default memo(Editor);
