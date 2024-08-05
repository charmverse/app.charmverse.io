import type { Prisma } from '@charmverse/core/prisma';

import type { Member } from 'lib/members/interfaces';
import { generateMarkdown } from 'lib/prosemirror/markdown/generateMarkdown';

import { downloadMarkdownFile } from './downloadMarkdownFile';

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
  const markdownContent = await generateMarkdown({
    content,
    generatorOptions: {
      members
    }
  });
  return downloadMarkdownFile({
    markdownContent,
    title,
    pageId: id,
    spaceId
  });
}
