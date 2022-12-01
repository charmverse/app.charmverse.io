import type { RawSpecs, BaseRawNodeSpec } from '@bangle.dev/core';

type EmbeddedSpecProps = {
  name: string;
} & Pick<BaseRawNodeSpec, 'markdown' | 'schema'>;

export function embeddedNodeSpec(_spec: EmbeddedSpecProps): RawSpecs {
  return {
    type: 'node',
    name: _spec.name,
    markdown: _spec.markdown,
    schema: {
      group: 'block',
      inline: false,
      draggable: false,
      isolating: true, // dont allow backspace to delete
      ..._spec.schema
    }
  };
}
