import type { Prisma } from '@charmverse/core/prisma';

import charmClient from 'charmClient';
import type { Member } from 'lib/members/interfaces';
import { generateMarkdown } from 'lib/prosemirror/markdown/generateMarkdown';

export async function exportMarkdown({
  content,
  title,
  members,
  id,
  spaceId
}: {
  spaceId: string;
  id: string;
  title?: string;
  content: Prisma.JsonValue;
  members: Member[];
}) {
  // getPage to get content
  const markdownContent = await generateMarkdown({
    content,
    generatorOptions: {
      members
    }
  });
  if (markdownContent) {
    const data = new Blob([markdownContent], { type: 'text/plain' });

    const linkElement = document.createElement('a');

    linkElement.download = `${title || 'page'}.md`;

    const downloadLink = URL.createObjectURL(data);

    linkElement.href = downloadLink;

    linkElement.click();

    URL.revokeObjectURL(downloadLink);

    charmClient.track.trackAction('export_page_markdown', {
      pageId: id,
      spaceId
    });
  }
}
