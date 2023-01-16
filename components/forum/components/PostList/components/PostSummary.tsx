import styled from '@emotion/styled';

import CharmEditor from 'components/common/CharmEditor/CharmEditor';
import type { PageContent } from 'lib/prosemirror/interfaces';

const StyledCharmEditor = styled(CharmEditor)`
  .ProseMirror {
    background: none;
  }
`;

// pageId is used for permissions to content
export function PostSummary({ content, pageId }: { content: PageContent | null; pageId: string }) {
  return <StyledCharmEditor isContentControlled content={content ?? undefined} pageId={pageId} readOnly={true} />;
}
