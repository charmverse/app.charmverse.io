import type { Prisma } from '@charmverse/core/prisma';
import { generateMarkdown } from '@packages/bangleeditor/markdown/generateMarkdown';

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
