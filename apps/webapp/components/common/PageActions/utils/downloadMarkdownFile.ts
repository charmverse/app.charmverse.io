import charmClient from 'charmClient';

export async function downloadMarkdownFile({
  markdownContent,
  title,
  pageId,
  spaceId
}: {
  spaceId: string;
  pageId: string;
  title?: string;
  markdownContent: string;
}) {
  const data = new Blob([markdownContent], { type: 'text/plain' });

  const linkElement = document.createElement('a');

  linkElement.download = `${title || 'page'}.md`;

  const downloadLink = URL.createObjectURL(data);

  linkElement.href = downloadLink;

  linkElement.click();

  URL.revokeObjectURL(downloadLink);

  charmClient.track.trackAction('export_page_markdown', {
    pageId,
    spaceId
  });
}
