import CharmEditor from 'components/common/CharmEditor/CharmEditor';
import type { PageContent } from 'lib/prosemirror/interfaces';

// pageId is used for permissions to content
export function PostSummary({ content, pageId }: { content: PageContent | null; pageId: string }) {
  return <CharmEditor isContentControlled content={content ?? undefined} pageId={pageId} readOnly={true} />;
}
