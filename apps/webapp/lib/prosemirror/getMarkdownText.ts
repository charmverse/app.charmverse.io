import type { Prisma } from '@charmverse/core/prisma';
import { generateMarkdown } from 'lib/prosemirror/markdown/generateMarkdown';

export async function getMarkdownText(content: Prisma.JsonValue | null) {
  try {
    const markdownText = await generateMarkdown({
      content
    });

    return markdownText;
  } catch (err) {
    return 'markdown not available';
  }
}
