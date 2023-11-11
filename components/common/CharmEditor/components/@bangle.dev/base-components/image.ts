import type { Command, EditorView, Node, NodeType, Schema } from '@bangle.dev/pm';
import { InputRule, NodeSelection, Plugin, PluginKey } from '@bangle.dev/pm';
import { safeInsert } from 'prosemirror-utils';

import type { RawPlugins } from 'components/common/CharmEditor/components/@bangle.dev/core/plugin-loader';
import { uploadToS3 } from 'lib/aws/uploadToS3Browser';

export const plugins = pluginsFactory;
export const commands = {};

const name = 'image';

const getTypeFromSchema = (schema: Schema) => schema.nodes[name];

export interface ImageNodeSchemaAttrs {
  caption: null | string;
  src: null | string;
  alt: null | string;
}

function convertFileToBase64(file: File) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
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

                // TODO should we handle all drops but just show error?
                // returning false here would just default to native behaviour
                // But then any drop handler would fail to work.
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

function getFileData(data: DataTransfer, accept: string, multiple: boolean) {
  const dragDataItems = getMatchingItems(data.items, accept, multiple);
  const files: File[] = [];

  dragDataItems.forEach((item) => {
    const file = item && item.getAsFile();
    if (file == null) {
      return;
    }
    files.push(file);
  });

  return files;
}

function getMatchingItems(list: DataTransferItemList, accept: string, multiple: boolean) {
  const dataItems = Array.from(list);
  let results;

  // Return the first item (or undefined) if our filter is for all files
  if (accept === '') {
    results = dataItems.filter((item) => item.kind === 'file');
    return multiple ? results : [results[0]];
  }

  const accepts = accept
    .toLowerCase()
    .split(',')
    .map((_accept) => {
      return _accept.split('/').map((part) => part.trim());
    })
    .filter((acceptParts) => acceptParts.length === 2); // Filter invalid values

  const predicate = (item: DataTransferItem) => {
    if (item.kind !== 'file') {
      return false;
    }

    const [typeMain, typeSub] = item.type
      .toLowerCase()
      .split('/')
      .map((s) => s.trim());

    for (const [acceptMain, acceptSub] of accepts) {
      // Look for an exact match, or a partial match if * is accepted, eg image/*.
      if (typeMain === acceptMain && (acceptSub === '*' || typeSub === acceptSub)) {
        return true;
      }
    }
    return false;
  };

  results = dataItems.filter(predicate);
  if (multiple === false) {
    results = [results[0]];
  }

  return results;
}

export const updateImageNodeAttribute =
  (attr: Node['attrs'] = {}): Command =>
  (state, dispatch) => {
    if (!(state.selection instanceof NodeSelection) || !state.selection.node) {
      return false;
    }
    const { node } = state.selection;
    if (node.type !== getTypeFromSchema(state.schema)) {
      return false;
    }

    if (dispatch) {
      dispatch(
        state.tr.setNodeMarkup(state.selection.$from.pos, undefined, {
          ...node.attrs,
          ...attr
        })
      );
    }
    return true;
  };
