import { log } from '@charmverse/core/log';
import type { PageDiff, Prisma } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { getNodeFromJson } from 'lib/prosemirror/getNodeFromJson';
import type { PageContent } from 'lib/prosemirror/interfaces';
import type { ClientDiffMessage } from 'lib/websockets/documentEvents/interfaces';
import { Fragment, Slice } from 'prosemirror-model';
import type { Node as ProsemirrorNode } from 'prosemirror-model';
import type { Step } from 'prosemirror-transform';
import { replaceStep } from 'prosemirror-transform';

export function convertDocument(doc: ProsemirrorNode) {
  const steps: Step[] = [];
  doc.nodesBetween(0, doc.content.size, (node, pos) => {
    switch (node.type.name) {
      case 'orderedList':
      case 'bulletList': {
        const newNodes = convertNode(node.toJSON()).map(getNodeFromJson);
        const step = replaceWith(doc, pos, pos + node.nodeSize, newNodes);
        if (step) {
          steps.push(step);
        }
        return false;
      }
      default:
        return true;
    }
  });
  const updated = applyStepsToNode(steps, doc);
  return { doc: updated, steps };
}

// return a new list of nodes, including new siblings for any nested lists
function convertNode(node: PageContent, listNodes: PageContent[] = [], indent = 0): PageContent[] {
  switch (node.type) {
    case 'listItem':
      node.type = 'list_item';
      break;
    case 'bulletList':
      node.type = 'bullet_list';
      node.attrs = node.attrs || {};
      node.attrs.indent = indent;
      indent += 1;
      listNodes.push(node);
      break;
    case 'orderedList':
      node.type = 'ordered_list';
      node.attrs = node.attrs || {};
      node.attrs.indent = indent;
      indent += 1;
      listNodes.push(node);
      break;

    default:
      break;
  }

  // convert children, and extract child lists
  node.content = node.content?.filter((child) => {
    convertNode(child, listNodes, indent);
    return (
      child.type !== 'bulletList' &&
      child.type !== 'orderedList' &&
      child.type !== 'bullet_list' &&
      child.type !== 'ordered_list'
    ); // if the list count has not changed, keep the child
  });

  return listNodes;
}

// const listNodes = convertNode(node)
// inspired by https://github.com/ProseMirror/prosemirror-transform/blob/89c5f6eb914a2dca0e9e4638856f176dd66813cb/src/transform.ts#L87
function replaceWith(doc: ProsemirrorNode, from: number, to: number, nodes: ProsemirrorNode[]): Step | null {
  return replaceStep(doc, from, to, new Slice(Fragment.from(nodes), 0, 0));
}

function applyStepsToNode(steps: Step[], node: ProsemirrorNode): ProsemirrorNode {
  return steps.reduce((n, step) => {
    try {
      const res = step.apply(n);
      if (res.doc) {
        return res.doc;
      } else {
        log.warn('Could not apply step', { res, step });
        throw new Error('Failed to apply step');
      }
    } catch (err) {
      log.warn(`An error occurred at step`, { step });
      throw err;
    }
  }, node);
}

export async function convertAndSavePage<
  T extends { id: string; content: any; version: number; createdBy: string; diffs: PageDiff[] }
>(page: T) {
  const { id: pageId, content, createdBy, version } = page;
  if (!content) {
    return { page };
  }
  const { doc, steps } = convertDocument(getNodeFromJson(content));

  if (steps.length) {
    const newVersion = version + 1;
    const newContent = doc.toJSON();

    const rawDiff: ClientDiffMessage = {
      rid: 0,
      type: 'diff',
      v: version, // use previous page version
      cid: 0,
      ds: steps.map((step) => step.toJSON())
    };

    const res = await prisma.$transaction([
      prisma.pageDiff.create({
        data: {
          createdBy,
          data: rawDiff as any as Prisma.InputJsonObject,
          pageId,
          version: rawDiff.v
        }
      }),
      prisma.page.update({
        where: {
          id: pageId
        },
        data: {
          content: newContent,
          version: newVersion
        }
      })
    ]);
    page.content = newContent;
    page.diffs.push(res[0]);
    page.version = newVersion;
    log.info('Updated old lists on page', { pageId, version: page.version });
  }

  return { page };
}

export function convertDoc(content: any) {
  return content ? convertDocument(getNodeFromJson(content)).doc : null;
}
