import { useEffect } from 'react';

import type { CreateLensPublicationParams } from 'hooks/useCreateLensPublication';
import { useCreateLensPublication } from 'hooks/useCreateLensPublication';
import type { PageContent } from 'lib/prosemirror/interfaces';

export function CreateLensPublication(
  params: CreateLensPublicationParams & {
    content: PageContent;
  }
) {
  const { createLensPublication } = useCreateLensPublication(params);

  useEffect(() => {
    createLensPublication({
      content: params.content
    });
  }, []);

  return null;
}
