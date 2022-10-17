import type { ReactNode } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { TouchBackend } from 'react-dnd-touch-backend';

import { isTouchScreen } from 'lib/utilities/browser';

// ignore events inside prosemirror unless we are also inside an inline database
function shouldIgnoreTarget (domNode: HTMLElement) {
  return Boolean(domNode.closest?.('.ProseMirror') && !domNode.closest?.('.focalboard-body'));
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
  if (isTouchScreen()) {
    return (
      <DndProvider
        backend={TouchBackend}
        options={{
          // enable vertical scrolling. see example at https://react-dnd.github.io/react-dnd/docs/backends/touch
          scrollAngleRanges: [
            { start: 30, end: 150 },
            { start: 210, end: 330 }
          ]
        }}
      >
        {children}
      </DndProvider>
    );
  }
  return (
    <DndProvider backend={ModifiedBackend}>
      {children}
    </DndProvider>
  );
}
