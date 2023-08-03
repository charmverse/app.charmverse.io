import type { MultiBackendOptions } from 'dnd-multi-backend';
import type { ReactNode } from 'react';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { DndProvider, TouchTransition, MouseTransition } from 'react-dnd-multi-backend';
import { TouchBackend } from 'react-dnd-touch-backend';

// See https://www.npmjs.com/package/react-dnd-multi-backend for more informatino about react-dnd-multi-backend as a replacement for react-dnd-touch-backend

// ignore events inside prosemirror unless we are also inside an inline database
function shouldIgnoreTarget(domNode: HTMLElement) {
  const isInsideProsemirror = domNode.closest?.('.bangle-editor-core');
  const isOutOfDom = !domNode.parentNode;
  return isOutOfDom || Boolean(isInsideProsemirror && !domNode.closest?.('.focalboard-body'));
}
// Prevent react-dnd from messing with prosemirror dnd. see: https://github.com/react-dnd/react-dnd-html5-backend/issues/7
function ModifiedHTML5Backend(...args: any) {
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
  listeners.forEach((name) => {
    const original = instance[name];
    instance[name] = (e: any, ...extraArgs: any) => {
      if (!shouldIgnoreTarget(e.target)) {
        original(e, ...extraArgs);
      }
    };
  });

  return instance;
}

const HTML5toTouch: MultiBackendOptions = {
  backends: [
    {
      id: 'html5',
      backend: ModifiedHTML5Backend,
      transition: MouseTransition
    },
    {
      id: 'touch',
      backend: TouchBackend,
      options: {
        enableMouseEvents: true,
        // enable vertical scrolling. see example at https://react-dnd.github.io/react-dnd/docs/backends/touch
        scrollAngleRanges: [
          { start: 30, end: 150 },
          { start: 210, end: 330 }
        ]
      },
      preview: true,
      transition: TouchTransition
    }
  ]
};

export default function ReactDndProvider({ children }: { children: ReactNode }) {
  return <DndProvider options={HTML5toTouch}>{children}</DndProvider>;
}
