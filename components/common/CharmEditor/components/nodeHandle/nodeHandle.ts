
import { createElement } from '@bangle.dev/core';
import { Plugin, PluginKey } from '@bangle.dev/pm';

// inspiration for this plugin: https://discuss.prosemirror.net/t/creating-a-wrapper-for-all-blocks/3310/9

export function plugins () {
  return [

    new Plugin({
      key: new PluginKey('handles'),
      view: (view) => {
        console.log(view.dom.parentNode);
        // view.dom.appendChild(createElement(['div']));
        console.log('view dom', view.dom, view.dom.getBoundingClientRect());
        console.log('new elm', createElement(['div', { class: 'row-handle' }]));
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
            const viewBox = view.dom.getBoundingClientRect();
            // @ts-ignore pm types are wrong
            const box = dom.node.getBoundingClientRect();
            const top = box.top - viewBox.top;
            const handle = createElement(['div', {
              class: 'row-handle',
              style: `top: ${top}px`
            }]);
            view.dom.parentNode?.appendChild(handle);
            console.log('row to hover', top, box.top, viewBox.top, topPos.pos, dom, node);

            dom.node.addEventListener('mouseleave', () => {
              console.log('leave');
              handle.remove();
            });
          }
        }

        view.dom.addEventListener('mouseover', onMouseOver);

        return {
          destroy () {
            view.dom.removeEventListener('mouseover', onMouseOver);
          }
        };
      }
    })
  ];
}

