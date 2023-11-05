import styled from '@emotion/styled';

import { CharmEditor } from 'components/common/CharmEditor';
import type { PageContent } from 'lib/prosemirror/interfaces';

const StyledCharmEditor = styled(CharmEditor)`
  .ProseMirror {
    background: none;
  }
`;

type Props = {
  content: PageContent | null;
  postId: string;
};
// pageId is used for permissions to content
export function PostSummary({ content, postId }: Props) {
  return (
    <StyledCharmEditor
      // TODO: Maybe CharmEditor should watch content for changes, ubt dont have time to test all implementations
      key={JSON.stringify(content)}
      isContentControlled
      content={content ?? undefined}
      pageId={postId}
      readOnly={true}
    />
  );
}
