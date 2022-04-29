import { createElement } from '@bangle.dev/core';
import { Plugin, PluginKey } from '@bangle.dev/pm';

// inspiration for this plugin: https://discuss.prosemirror.net/t/creating-a-wrapper-for-all-blocks/3310/9

export function plugins () {
  return [

    new Plugin({
      key: new PluginKey('handles'),
      view: (view) => {

        function onMouseOver (e) {
          console.log('e', e);
          const ob = view.posAtCoords({ left: e.clientX, top: e.clientY });
          console.log('ob', ob);
          if (ob) {
            const pos = ob.pos;
            const dom = view.domAtPos(pos);
            const node = view.state.doc.nodeAt(pos);
            console.log('resolved pm node', node);
          }
          // if (something about the node and the dom){
          //   let handle = createElement(['div'])
          //   let box = dom.getBoundClientRect()
          //   handle.style["top"] = box["top"]+"px"
          //   handles_wrapper.append(handle)
          //   dom.addEventListener("mouseleave",function(){
          //     handle.remove()
          //   })
          // }
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

