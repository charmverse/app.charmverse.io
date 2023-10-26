import { useState, useEffect } from 'react';
import type { RefObject } from 'react';

export type InputType = HTMLInputElement | HTMLTextAreaElement;

// A hook to determine if someone is using foreign language input to type via IME events
// reference: https://www.stum.de/2016/06/24/handling-ime-events-in-javascript/
export function useIMEComposition(ref: RefObject<InputType>) {
  const [isComposing, setIsComposing] = useState(false); // IME Composing going on
  const [hasCompositionJustEnded, sethasCompositionJustEnded] = useState(false); // Used to swallow keyup event related to compositionend

  useEffect(() => {
    const elm = ref.current;

    function onKeyUp(e: Event) {
      if (isComposing || hasCompositionJustEnded) {
        // IME composing fires keydown/keyup events
        sethasCompositionJustEnded(false);
        e.stopPropagation();
        e.preventDefault();
      }
    }
    function onCompositionStart() {
      setIsComposing(true);
    }
    function onCompositionEnd() {
      setIsComposing(false);
      // some browsers (IE, Firefox, Safari) send a keyup event after
      //  compositionend, some (Chrome, Edge) don't. This is to swallow
      // the next keyup event, unless a keydown event happens first
      sethasCompositionJustEnded(true);
    }
    function onKeyDown(e: Event) {
      // Safari on OS X may send a keydown of 229 after compositionend
      if ((e as KeyboardEvent).which !== 229) {
        sethasCompositionJustEnded(false);
      }
    }
    if (elm) {
      elm.addEventListener('keyup', onKeyUp);
      elm.addEventListener('compositionstart', onCompositionStart);
      elm.addEventListener('compositionend', onCompositionEnd);
      elm.addEventListener('keydown', onKeyDown);
    }
    return () => {
      // remove event listeners
      if (elm) {
        elm.removeEventListener('keyup', onKeyUp);
        elm.removeEventListener('compositionstart', onCompositionStart);
        elm.removeEventListener('compositionend', onCompositionEnd);
        elm.removeEventListener('keydown', onKeyDown);
      }
    };
  }, [isComposing, hasCompositionJustEnded, ref]);

  return { isOrWasComposing: isComposing || hasCompositionJustEnded };
}
