import { paragraph } from '@bangle.dev/base-components';

const updated = {
  ...paragraph,
  spec: () => {
    const spec = paragraph.spec();
    spec.schema.attrs = {
      // tracked: {
      //   default: false
      // },
      track: {
        default: []
      }
    };
    // spec.schema.draggable = true;
    return spec;
  }
};

export default updated;
