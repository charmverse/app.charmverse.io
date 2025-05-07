import { log } from '@charmverse/core/log';
import type { Slice } from 'prosemirror-model';
import { Plugin } from 'prosemirror-state';
import type { EditorView } from 'prosemirror-view';

const maxByteSize = 1000000; // 1MB

export function plugins({ onError }: { onError: (error: Error) => void }) {
  return [
    new Plugin({
      props: {
        handlePaste: (view: EditorView, rawEvent: ClipboardEvent, slice: Slice) => {
          const byteSize = getSizeInBytes(slice);
          if (byteSize > maxByteSize) {
            log.error('[ceditor] Paste size is too large', { byteSize, maxByteSize });
            onError(new Error('Pasted content is too large. Try copying in smaller chunks'));
            return true;
          }
          return false;
        }
      }
    })
  ];
}

// ref: https://zwbetz.com/get-the-approximate-size-of-a-js-object-in-bytes/
function getSizeInBytes(obj: any) {
  let str = null;
  if (typeof obj === 'string') {
    // If obj is a string, then use it
    str = obj;
  } else {
    // Else, make obj into a string
    str = JSON.stringify(obj);
  }
  // Get the length of the Uint8Array
  const bytes = new TextEncoder().encode(str).length;
  return bytes;
}
