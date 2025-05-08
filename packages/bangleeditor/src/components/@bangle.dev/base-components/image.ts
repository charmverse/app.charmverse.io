import { InputRule } from 'prosemirror-inputrules';
import type { Schema } from 'prosemirror-model';
import { Plugin, PluginKey } from 'prosemirror-state';
import { v4 } from 'uuid';

import type { RawPlugins } from '../core/plugin-loader';

// example: <img src=”data:image/gif;base64, R0lGODlhCAAFAIABAMaAgP///yH5BAEAAAEALAAAAAAIAAUAAAIKBBKGebzqoJKtAAA7″ />

export const plugins = pluginsFactory;
export const commands = {};

const name = 'image';

export const imageFileDropEventName = 'imageFileDrop';
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

export function convertFileToBase64(file: File) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
}

export const handleImageFileDrop =
  ({
    pageId,
    postId,
    readOnly,
    parentElementId
  }: {
    readOnly: boolean;
    pageId?: string;
    postId?: string;
    parentElementId: string;
  }) =>
  (event: React.DragEvent<HTMLElement>) => {
    // prevent drop event from firing when dropping into the editor
    if (
      event.dataTransfer == null ||
      readOnly ||
      (event.target instanceof HTMLElement &&
        event.target.parentElement?.id !== parentElementId &&
        event.target.parentElement?.parentElement?.id !== parentElementId)
    ) {
      return;
    }
    const files = getFileData(event.dataTransfer, 'image/*', true);

    if (!files || files.length === 0) {
      return;
    }
    event.preventDefault();

    const imageFileDropEvent = new CustomEvent(imageFileDropEventName, {
      detail: {
        files
      }
    });

    if (pageId) {
      document
        .querySelector(`.bangle-editor-core[data-page-id="${pageId}"]`)
        ?.dispatchEvent(imageFileDropEvent as Event);
    } else if (postId) {
      document
        .querySelector(`.bangle-editor-core[data-post-id="${postId}"]`)
        ?.dispatchEvent(imageFileDropEvent as Event);
    }
  };

export function getFileData(data: DataTransfer, accept: string, multiple: boolean) {
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

// does not work for svg sources: data:image/svg+xml,%3csvg%20xmlns=%27http://www.w3.org/2000/svg%27%20version=%271.1%27%20width=%27379%27%20height=%27820%27/%3e
export function getFileBinary(src: string): File | null {
  if (src.startsWith('data')) {
    const contentType = src.split('image/')[1].split(';')[0];
    const fileExtension = contentType.split('+')[0]; // handle svg+xml
    const fileName = `${v4()}.${fileExtension}`;
    const rawFileContent = src.split(';base64,')[1];
    // not all data sources are base64, like svg:
    if (rawFileContent) {
      const fileContent = Buffer.from(rawFileContent, 'base64');

      // Break the buffer string into chunks of 1 kilobyte
      const chunkSize = 1024 * 1;

      const bufferLength = fileContent.length;

      const bufferChunks = [];

      for (let i = 0; i < bufferLength; i += chunkSize) {
        const chunk = fileContent.slice(i, i + chunkSize);
        bufferChunks.push(chunk);
      }

      const file: File = new File(bufferChunks, fileName, { type: `image/${contentType}` });
      return file;
    }
  }
  return null;
}
