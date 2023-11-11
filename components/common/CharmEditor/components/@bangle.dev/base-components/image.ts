import type { Schema } from '@bangle.dev/pm';
import { InputRule, Plugin, PluginKey } from '@bangle.dev/pm';

import type { RawPlugins } from 'components/common/CharmEditor/components/@bangle.dev/core/plugin-loader';
import { convertFileToBase64 } from 'lib/file/convertFileToBase64';
import { getFileData } from 'lib/file/getFileData';

export const plugins = pluginsFactory;
export const commands = {};

const name = 'image';

const getTypeFromSchema = (schema: Schema) => schema.nodes[name];

export interface ImageNodeSchemaAttrs {
  caption: null | string;
  src: null | string;
  alt: null | string;
}

function pluginsFactory({
  handleDragAndDrop = true,
  acceptFileType = 'image/*'
}: {
  handleDragAndDrop?: boolean;
  acceptFileType?: string;
} = {}): RawPlugins {
  return ({ schema }) => {
    const type = getTypeFromSchema(schema);
    return [
      new InputRule(/!\[(.+|:?)]\((\S+)(?:(?:\s+)["'](\S+)["'])?\)/, (state, match, start, end) => {
        const [, alt, src] = match;
        if (!src) {
          return null;
        }
        return state.tr.replaceWith(
          start,
          end,
          type.create({
            src,
            alt
          })
        );
      }),

      handleDragAndDrop &&
        new Plugin({
          key: new PluginKey(`${name}-drop-paste`),
          props: {
            handleDOMEvents: {
              drop(view, event) {
                if (event.dataTransfer == null) {
                  return false;
                }
                const files = getFileData(event.dataTransfer, acceptFileType, true);

                if (!files || files.length === 0) {
                  return false;
                }
                event.preventDefault();
                const coordinates = view.posAtCoords({
                  left: event.clientX,
                  top: event.clientY
                });

                if (!coordinates) {
                  return true;
                }
                const imageType = getTypeFromSchema(view.state.schema);
                const { pos } = coordinates;

                for (const [index, file] of files.entries()) {
                  convertFileToBase64(file).then((base64) => {
                    view.dispatch(
                      view.state.tr.insert(
                        pos + index,
                        imageType.create({
                          src: base64
                        })
                      )
                    );
                  });
                }
                return true;
              }
            },

            handlePaste: (view, rawEvent) => {
              const event = rawEvent;
              if (!event.clipboardData) {
                return false;
              }
              const files = getFileData(event.clipboardData, acceptFileType, true);
              if (!files || files.length === 0) {
                return false;
              }

              const imageType = getTypeFromSchema(view.state.schema);
              const pos = view.state.selection.from;
              for (const [index, file] of files.entries()) {
                convertFileToBase64(file).then((base64) => {
                  view.dispatch(
                    view.state.tr.insert(
                      pos + index,
                      imageType.create({
                        src: base64
                      })
                    )
                  );
                });
              }
              return true;
            }
          }
        })
    ];
  };
}
