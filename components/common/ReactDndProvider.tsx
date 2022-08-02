import { ReactNode } from 'react';

import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { TouchBackend } from 'react-dnd-touch-backend';
import { isMobile } from 'lib/browser';

// ignore prosemirror.
// TODO: try using providers only around sidebar or focalboard, maybe it won't affect prosemirror?
function shouldIgnoreTarget (domNode: HTMLElement) {
  return domNode.closest?.('.ProseMirror');
}
// Prevent react-dnd from messing with prosemirror dnd. see: https://github.com/react-dnd/react-dnd-html5-backend/issues/7
function ModifiedBackend (...args: any) {
  // @ts-ignore
  const instance = new HTML5Backend(...args);

  const listeners = [
    'handleTopDragStart',
    'handleTopDragStartCapture',
    'handleTopDragEndCapture',
    'handleTopDragEnter',
    'handleTopDragEnterCapture',
    'handleTopDragLeaveCapture',
    'handleTopDragOver',
    'handleTopDragOverCapture',
    'handleTopDrop',
    'handleTopDropCapture'
  ];
  listeners.forEach(name => {
    const original = instance[name];
    instance[name] = (e: any, ...extraArgs: any) => {
      if (!shouldIgnoreTarget(e.target)) {
        original(e, ...extraArgs);
      }
    };
  });

  return instance;
}

export default function ReactDndProvider ({ children }: { children: ReactNode }) {
  return (
    <DndProvider backend={isMobile() ? TouchBackend : ModifiedBackend}>
      {children}
    </DndProvider>
  );
}
