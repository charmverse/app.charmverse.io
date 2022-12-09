import { doc } from '@bangle.dev/base-components';

export function spec() {
  const docSpec = doc.spec();
  docSpec.schema.marks = 'suggestTriggerMarks'; // needed for some popups to appear
  return docSpec;
}
