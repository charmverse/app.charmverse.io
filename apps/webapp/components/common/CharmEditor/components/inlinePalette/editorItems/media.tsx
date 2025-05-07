import { rafCommandExec } from '@bangle.dev/utils';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import ImageIcon from '@mui/icons-material/Image';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import VideoLibraryIcon from '@mui/icons-material/VideoLibrary';

import { insertNode, isAtBeginningOfLine } from '../../../utils';
import { replaceSuggestionMarkWith } from '../inlinePalette';
import type { PaletteItemTypeNoGroup } from '../paletteItem';

const iconSize = 30;

export function items(): PaletteItemTypeNoGroup[] {
  return [
    {
      uid: 'image',
      title: 'Image',
      icon: <ImageIcon sx={{ fontSize: iconSize }} />,
      description: 'Insert a image block in the line below',
      editorExecuteCommand: ({ palettePluginKey }) => {
        return (state, dispatch, view) => {
          if (view) {
            rafCommandExec(view, (_state, _dispatch) => {
              // let the node view know to show the tooltip by default
              const tooltipMark = _state.schema.mark('tooltip-marker');
              const node = _state.schema.nodes.image.create(
                {
                  src: null
                },
                null,
                [tooltipMark]
              );
              if (_dispatch && isAtBeginningOfLine(_state)) {
                _dispatch(_state.tr.replaceSelectionWith(node, false));
                return true;
              }

              return insertNode(_state, _dispatch, node);
            });
          }
          return replaceSuggestionMarkWith(palettePluginKey, '')(state, dispatch, view);
        };
      }
    },
    {
      uid: 'video',
      title: 'Video',
      icon: <VideoLibraryIcon sx={{ fontSize: iconSize }} />,
      description: 'Insert a video block',
      keywords: ['youtube'],
      editorExecuteCommand: ({ palettePluginKey }) => {
        return (state, dispatch, view) => {
          if (view) {
            rafCommandExec(view, (_state, _dispatch) => {
              // let the node view know to show the tooltip by default
              const tooltipMark = _state.schema.mark('tooltip-marker');
              const node = _state.schema.nodes.video.create(undefined, undefined, [tooltipMark]);

              if (_dispatch && isAtBeginningOfLine(_state)) {
                _dispatch(_state.tr.replaceSelectionWith(node, false));
                return true;
              }
              return insertNode(_state, _dispatch, node);
            });

            return replaceSuggestionMarkWith(palettePluginKey, '')(state, dispatch, view);
          }
          return false;
        };
      }
    },
    {
      uid: 'file',
      title: 'File',
      icon: <AttachFileIcon sx={{ fontSize: iconSize }} />,
      description: 'Upload a file',
      editorExecuteCommand: ({ palettePluginKey }) => {
        return (state, dispatch, view) => {
          rafCommandExec(view!, (_state, _dispatch) => {
            // let the node view know to show the tooltip by default
            const tooltipMark = _state.schema.mark('tooltip-marker');
            const node = _state.schema.nodes.file.create(
              {
                src: null
              },
              undefined,
              [tooltipMark]
            );

            if (_dispatch && isAtBeginningOfLine(_state)) {
              _dispatch(_state.tr.replaceSelectionWith(node, false));
              return true;
            }
            return insertNode(_state, _dispatch, node);
          });
          return replaceSuggestionMarkWith(palettePluginKey, '')(state, dispatch, view);
        };
      }
    },
    {
      uid: 'pdf',
      title: 'PDF',
      icon: <PictureAsPdfIcon sx={{ fontSize: iconSize }} />,
      description: 'Insert a PDF block in the line below',
      editorExecuteCommand: ({ palettePluginKey }) => {
        return (state, dispatch, view) => {
          rafCommandExec(view!, (_state, _dispatch) => {
            // let the node view know to show the tooltip by default
            const tooltipMark = _state.schema.mark('tooltip-marker');
            const node = _state.schema.nodes.pdf.create(
              {
                src: null
              },
              undefined,
              [tooltipMark]
            );

            if (_dispatch && isAtBeginningOfLine(_state)) {
              _dispatch(_state.tr.replaceSelectionWith(node, false));
              return true;
            }
            return insertNode(_state, _dispatch, node);
          });
          return replaceSuggestionMarkWith(palettePluginKey, '')(state, dispatch, view);
        };
      }
    },
    {
      uid: 'bookmark',
      title: 'Bookmark',
      icon: <BookmarkIcon sx={{ fontSize: iconSize }} />,
      description: 'Save a link as a visual bookmark',
      editorExecuteCommand: ({ palettePluginKey }) => {
        return (state, dispatch, view) => {
          rafCommandExec(view!, (_state, _dispatch) => {
            // let the node view know to show the tooltip by default
            const tooltipMark = _state.schema.mark('tooltip-marker');
            const node = _state.schema.nodes.bookmark.create(
              {
                src: null
              },
              undefined,
              [tooltipMark]
            );

            if (_dispatch && isAtBeginningOfLine(_state)) {
              _dispatch(_state.tr.replaceSelectionWith(node, false));
              return true;
            }
            return insertNode(_state, _dispatch, node);
          });
          return replaceSuggestionMarkWith(palettePluginKey, '')(state, dispatch, view);
        };
      }
    }
  ];
}
