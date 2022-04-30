
import { createElement } from '@bangle.dev/core';
import { Plugin, PluginKey } from '@bangle.dev/pm';

// inspiration for this plugin: https://discuss.prosemirror.net/t/creating-a-wrapper-for-all-blocks/3310/9

export function plugins () {
  return [

    new Plugin({
      key: new PluginKey('handles'),
      view: (view) => {

        function onMouseOver (e: MouseEventInit) {
          const ob = view.posAtCoords({ left: e.clientX!, top: e.clientY! });
          if (ob) {
            // grab the parent of whatever pos is being hovered
            let topPos = view.state.doc.resolve(ob.pos);
            while (topPos.parentOffset !== 0 && topPos.depth !== 0) {
              topPos = view.state.doc.resolve(topPos.parentOffset);
            }
            const dom = view.domAtPos(topPos.pos);
            const node = view.state.doc.nodeAt(topPos.pos);
            const handle = createElement(['div']);
            // @ts-ignore pm types are wrong
            const box = dom.node.getBoundingClientRect();
            console.log('top position', box.top, topPos.pos, dom, node);
            handle.style.top = `${box.top}px`;
            // handles_wrapper.append(handle);
            // dom.addEventListener('mouseleave', () => {
            //   handle.remove();
            // });
          }
        }

        view.dom.addEventListener('mouseover', onMouseOver);

        return {
          destroy () {
            view.dom.removeEventListener('mouseover', onMouseOver);
          },

          update (_view, prevState) {
            console.log('update view');
          }
        };
      }
    })
  ];
}

