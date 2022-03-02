import { heading } from '@bangle.dev/base-components';
import { BaseRawNodeSpec, Plugin } from '@bangle.dev/core';
import { Decoration, DecorationSet, EditorState, EditorView, Selection } from '@bangle.dev/pm';

export function collapsibleHeadingSpec () {
  const spec = heading.spec() as BaseRawNodeSpec;
  spec.name = 'collapsibleHeading';
  return spec;
}

export const collapsePlugin = new Plugin({
  key: 'collapsibleHeading' as any,
  state: {
    init (_, state) {
      return buildDeco(state);
    },
    apply (tr, old, oldState, newState) {
      // For performance only build the
      // decorations if the doc has actually changed
      return tr.docChanged ? buildDeco(newState) : old;
    }
  },
  props: {
    decorations (state) {
      return this.getState(state);
    }
  }
});

function buildDeco (state: EditorState) {
  const collapsedHeadingSet = new Set(
    heading.listCollapsedHeading(state).map((r) => r.node)
  );

  const headings = heading
    .listCollapsibleHeading(state)
    .filter((r) => r.node.content.size > 0);

  // See https://prosemirror.net/docs/ref/#view.Decoration^widget
  return DecorationSet.create(
    state.doc,
    // Create a decoration for each heading that is collapsible
    headings.map((match) => Decoration.widget(
      match.pos + 1,
      (view) => createCollapseDOM(
        view,
        collapsedHeadingSet.has(match.node),
        match.pos
      ),
      // render deco before cursor
      { side: -1 }
    ))
  );
}

const downArrow = "<svg stroke='currentColor' fill='currentColor' strokeWidth='0' viewBox='0 0 24 24' height='1em' width='1em' xmlns='http://www.w3.org/2000/svg'><path d='M21.886 5.536A1.002 1.002 0 0 0 21 5H3a1.002 1.002 0 0 0-.822 1.569l9 13a.998.998 0 0 0 1.644 0l9-13a.998.998 0 0 0 .064-1.033zM12 17.243 4.908 7h14.184L12 17.243z'></path></svg>";

const rightArrow = "<svg stroke='currentColor' fill='none' strokeWidth='2' viewBox='0 0 24 24' strokeLinecap='round' strokeLinejoin='round' height='1em' width='1em' xmlns='http://www.w3.org/2000/svg'><polyline points='9 18 15 12 9 6'></polyline></svg>";

// Create a dom element:
// - will be placed at the right position by Prosemirror
// - will respond to click event and trigger the toggleHeadingCollapse command
function createCollapseDOM (view: EditorView, isCollapsed: boolean, pos: any) {
  const child = document.createElement('span');
  child.addEventListener('click', (e) => {
    const { tr } = view.state;
    view.dispatch(tr.setSelection(Selection.near(tr.doc.resolve(pos))));
    heading.toggleHeadingCollapse()(view.state, view.dispatch, view);
  });

  child.style.userSelect = 'none';
  child.style.cursor = 'pointer';
  child.innerHTML = `<span class="collapsibleHeader">${isCollapsed ? rightArrow : downArrow}</span>`;
  return child;
}
