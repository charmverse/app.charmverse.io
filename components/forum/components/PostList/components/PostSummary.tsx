import { DOMSerializer, Node } from 'prosemirror-model';
import { useEffect, useRef } from 'react';

import { specRegistry } from 'components/common/CharmEditor/specRegistry';
import type { PageContent } from 'lib/prosemirror/interfaces';

export function PostSummary({ content }: { content: PageContent | null }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (content && ref.current) {
      const contentNode = Node.fromJSON(specRegistry.schema, content);
      DOMSerializer.fromSchema(specRegistry.schema).serializeFragment(contentNode.content, {}, ref.current);
    }
    return () => {
      if (ref.current) {
        ref.current.innerHTML = '';
      }
    };
  }, []);
  return <div ref={ref} />;
}
