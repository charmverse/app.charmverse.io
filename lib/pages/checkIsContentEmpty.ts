import type { PageContent } from 'models';

export function checkIsContentEmpty (content: PageContent | null | undefined) {
  return !content?.content
  || content.content.length === 0
  || (content.content.length === 1
      // These nodes dont contain any content so there is no content field
      && !content.content[0]?.type.match(/(cryptoPrice|columnLayout|image|iframe|mention|page)/)
      && (!content.content[0].content?.length));
}

