import type { Node } from 'prosemirror-model';

export const getSettings = function (pmArticle: Node) {
  const settings = JSON.parse(JSON.stringify(pmArticle.attrs));
  return settings;
};
