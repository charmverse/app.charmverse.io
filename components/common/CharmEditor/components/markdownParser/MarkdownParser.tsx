import type { Page } from '@prisma/client';

import Button from 'components/common/Button';

import { parseMarkdownStub } from './parseMarkdown';

type Props = {
  addPage: (p: Partial<Page>) => void;
};

export function MarkdownParser({ addPage }: Props) {
  async function saveMarkdown() {
    const parsedMarkdown = await parseMarkdownStub();
    addPage({ content: parsedMarkdown });
  }
  return (
    <Button onClick={saveMarkdown} primary>
      Import markdown
    </Button>
  );
}
