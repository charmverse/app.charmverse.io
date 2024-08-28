import type { UnnestObjValue } from '@packages/utils/types';
import type { MarkdownParser, MarkdownSerializer } from 'prosemirror-markdown';
import { Schema } from 'prosemirror-model';
import type { MarkSpec, NodeSpec } from 'prosemirror-model';
// TODO: Dont rely on this module for schemas
import { marks as defaultMarks, nodes as defaultNodes } from 'prosemirror-schema-basic';

export type BaseRawNodeSpec = {
  name: string;
  type: 'node';
  schema: NodeSpec;
  markdown?: {
    toMarkdown: UnnestObjValue<MarkdownSerializer['nodes']>;
    parseMarkdown?: MarkdownParser['tokens'];
  };
  options?: { [k: string]: any };
};

export type BaseRawMarkSpec = {
  name: string;
  type: 'mark';
  schema: MarkSpec;
  markdown?: {
    toMarkdown: UnnestObjValue<MarkdownSerializer['marks']>;
    parseMarkdown?: MarkdownParser['tokens'];
  };
  options?: { [k: string]: any };
};
export type BaseSpec = BaseRawNodeSpec | BaseRawMarkSpec;
export type RawSpecs = null | false | undefined | BaseRawNodeSpec | BaseRawMarkSpec | RawSpecs[];

export function buildSchema(rawSpecs: BaseSpec[]) {
  const flattenedSpecs = flatten(rawSpecs);

  flattenedSpecs.forEach(validateSpec);

  const names = new Set(flattenedSpecs.map((r) => r.name));

  if (flattenedSpecs.length !== names.size) {
    // log.warn('The specRegistry has one or more specs with the same name', flattenedSpecs);
    throw new Error('Duplicate spec error, please check your specRegistry');
  }

  const nodes: [string, NodeSpec][] = [];
  const marks: [string, MarkSpec][] = [];
  for (const spec of flattenedSpecs) {
    if (spec.type === 'node') {
      nodes.push([spec.name, spec.schema]);
    } else if (spec.type === 'mark') {
      marks.push([spec.name, spec.schema]);
    } else {
      const r: any = spec;
      throw new Error(`Unknown type: ${r.type}`);
    }
  }

  return new Schema({
    // topNode: 'doc', // default
    nodes: {
      ...defaultNodes,
      ...Object.fromEntries(nodes)
    },
    marks: {
      ...defaultMarks,
      ...Object.fromEntries(marks)
    }
  });
}

function validateSpec(spec: BaseSpec) {
  if (!spec.name) {
    // log.warn("The spec didn't have a name field", spec);
    throw new Error('Invalid spec. Spec must have a name');
  }
  if (!['node', 'mark'].includes(spec.type)) {
    // log.warn('The spec must be of type node, mark or component ', spec);
    throw new Error('Invalid spec type');
  }
  if (['node', 'mark'].includes(spec.type) && !spec.schema) {
    // log.warn("The spec of type 'mark' or 'node' must have a schema field", spec);
    throw new Error('Invalid spec schema');
  }
}

function flatten(data: RawSpecs): BaseSpec[] {
  const recurse = (d: RawSpecs): BaseSpec[] => {
    if (Array.isArray(d)) {
      return d.flatMap((i) => recurse(i)).filter((r): r is BaseSpec => Boolean(r));
    }

    if (d == null || d === false) {
      return [];
    }

    return [d];
  };

  return recurse(data);
}
