/* eslint-disable no-use-before-define */
import type { MarkdownParser, MarkdownSerializer, UnnestObjValue } from '@bangle.dev/shared-types';
import { log } from '@charmverse/core/log';
import type { MarkSpec, NodeSpec } from 'prosemirror-model';
import { Schema } from 'prosemirror-model';

import * as doc from '../../doc/doc';
import * as paragraph from '../../paragraph/paragraph';
import * as text from '../../text/text';

export type BaseSpec = BaseRawNodeSpec | BaseRawMarkSpec;

export interface BaseRawNodeSpec {
  name: string;
  type: 'node';
  topNode?: boolean;
  schema: NodeSpec;
  markdown?: {
    toMarkdown: UnnestObjValue<MarkdownSerializer['nodes']>;
    parseMarkdown?: MarkdownParser['tokens'];
  };
  options?: { [k: string]: any };
}

export interface BaseRawMarkSpec {
  name: string;
  type: 'mark';
  schema: MarkSpec;
  markdown?: {
    toMarkdown: UnnestObjValue<MarkdownSerializer['marks']>;
    parseMarkdown?: MarkdownParser['tokens'];
  };
  options?: { [k: string]: any };
}

export type RawSpecs = null | false | undefined | BaseRawNodeSpec | BaseRawMarkSpec | RawSpecs[];

export class SpecRegistry<N extends string = any, M extends string = any> {
  _options: { [key: string]: any };

  _schema: Schema<N, M>;

  _spec: BaseSpec[];

  constructor(rawSpecs: RawSpecs = [], { defaultSpecs = true } = {}) {
    let flattenedSpecs = flatten(rawSpecs);

    flattenedSpecs.forEach(validateSpec);

    const names = new Set(flattenedSpecs.map((r) => r.name));

    if (flattenedSpecs.length !== names.size) {
      log.warn('The specRegistry has one or more specs with the same name', flattenedSpecs);
      throw new Error('Duplicate spec error, please check your specRegistry');
    }

    if (defaultSpecs) {
      const defaultSpecsArray: BaseSpec[] = [];
      if (!names.has('paragraph')) {
        defaultSpecsArray.unshift(paragraph.spec());
      }
      if (!names.has('text')) {
        defaultSpecsArray.unshift(text.spec());
      }
      if (!names.has('doc')) {
        defaultSpecsArray.unshift(doc.spec());
      }
      flattenedSpecs = [...defaultSpecsArray, ...flattenedSpecs];
    }

    this._spec = flattenedSpecs;
    this._schema = createSchema(this._spec);
    this._options = Object.fromEntries(
      this._spec.filter((spec) => spec.options).map((spec) => [spec.name, spec.options])
    );
  }

  get options() {
    return this._options;
  }

  get schema() {
    return this._schema;
  }

  get spec() {
    return this._spec;
  }
}

function createSchema(specRegistry: SpecRegistry['_spec']) {
  const nodes: [string, NodeSpec][] = [];
  const marks: [string, MarkSpec][] = [];
  let topNode;
  for (const spec of specRegistry) {
    if (spec.type === 'node') {
      nodes.push([spec.name, spec.schema]);
      if (spec.topNode === true) {
        topNode = spec.name;
      }
    } else if (spec.type === 'mark') {
      marks.push([spec.name, spec.schema]);
    } else {
      const r: any = spec;
      throw new Error(`Unknown type: ${r.type}`);
    }
  }

  return new Schema({
    topNode,
    nodes: Object.fromEntries(nodes),
    marks: Object.fromEntries(marks)
  });
}

function validateSpec(spec: BaseSpec) {
  if (!spec.name) {
    log.warn("The spec didn't have a name field", spec);
    throw new Error('Invalid spec. Spec must have a name');
  }
  if (!['node', 'mark'].includes(spec.type)) {
    log.warn('The spec must be of type node, mark or component ', spec);
    throw new Error('Invalid spec type');
  }
  if (['node', 'mark'].includes(spec.type) && !spec.schema) {
    log.warn("The spec of type 'mark' or 'node' must have a schema field", spec);
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
