import { log } from '@charmverse/core/log';
import type { Prisma } from '@charmverse/core/prisma';

import { generateMarkdown } from 'lib/prosemirror/plugins/markdown/generateMarkdown';

export async function getMarkdownText(content: Prisma.JsonValue | null) {
  try {
    const markdownText = await generateMarkdown({
      content
    });

    return markdownText;
  } catch (err) {
    log.error('Error generating markdown from page content', err);
    return 'markdown not available';
  }
}
