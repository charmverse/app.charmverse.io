import charmClient from 'charmClient';
import { Node } from '@bangle.dev/pm';
import { BangleEditorState } from '@bangle.dev/core';
import { specRegistry } from 'components/common/CharmEditor/CharmEditor';
import { PageContent } from 'models/Page';
import { findChildrenByType } from 'prosemirror-utils';
import { IPageWithPermissions } from './interfaces';

export async function fetchLinkedPages (pageId: string, spaceId: string) {
  const page = await charmClient.getPage(pageId, spaceId);
  const state = new BangleEditorState({
    specRegistry,
    initialValue: page.content ? Node.fromJSON(specRegistry.schema, page.content as PageContent) : ''
  });
  const nestedPageNode = state.specRegistry.schema.nodes.page;
  const nodes = findChildrenByType(state.pmState.doc, nestedPageNode).map(({ node: _node }) => _node);
  const pageIdsToBeFetched = nodes.map(node => node.attrs.id);
  const fetchedLinkedPages: IPageWithPermissions[] = [
    page
  ];

  if (pageIdsToBeFetched.length !== 0) {
    const linkedPages = await charmClient.getPagesByIds(spaceId, pageIdsToBeFetched);
    fetchedLinkedPages.push(...linkedPages);
  }

  return fetchedLinkedPages;
}
