import { paragraph } from '@bangle.dev/base-components';
import type { Node } from '@bangle.dev/pm';

const updated = {
  ...paragraph,
  spec: () => {
    const spec = paragraph.spec();
    spec.schema.attrs = {
      track: {
        default: []
      }
    };
    spec.schema.toDOM = (node: Node) => {
      const attrs = node.attrs.track && node.attrs.track.length ? { 'data-track': JSON.stringify(node.attrs.track) } : {};
      return ['p', attrs, 0];
    };
    return spec;
  }
};

export default updated;
