import type { KeyboardEvent, ClipboardEvent, MouseEvent } from 'react';

// pulled from react-merge-refs
export function mergeRefs(refs: any) {
  return (value: any) => {
    refs.forEach((ref: any) => {
      if (typeof ref === 'function') {
        ref(value);
      } else if (ref != null) {
        ref.current = value;
      }
    });
  };
}

export function isReturnKey(event: React.KeyboardEvent) {
  return event.key === 'Enter' || event.key === 'NumpadEnter';
}
