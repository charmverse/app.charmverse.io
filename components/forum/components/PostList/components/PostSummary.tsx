import CharmEditor from 'components/common/CharmEditor/CharmEditor';
import type { PageContent } from 'lib/prosemirror/interfaces';

export function PostSummary({ content }: { content: PageContent | null }) {
  return <CharmEditor content={content ?? undefined} readOnly={true} />;
}
