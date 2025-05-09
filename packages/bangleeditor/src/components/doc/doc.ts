import type { BaseRawNodeSpec } from '../@bangle.dev/core/specRegistry';

const name = 'doc';

export function spec({ content = 'block+' } = {}): BaseRawNodeSpec {
  return {
    type: 'node',
    topNode: true,
    name,
    schema: {
      content,
      marks: 'suggestTriggerMarks' // needed for some popups to appear
    }
  };
}
