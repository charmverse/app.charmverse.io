import { rafCommandExec } from '@bangle.dev/utils';
import DatabaseIcon from '@mui/icons-material/TableChart';
import type { PageType } from '@prisma/client';

import { addPage } from 'lib/pages';

import { insertNode, isAtBeginningOfLine } from '../../../utils';
import { palettePluginKey } from '../config';
import { replaceSuggestionMarkWith } from '../inlinePalette';
import type { PaletteItemTypeNoGroup, PromisedCommand } from '../paletteItem';

interface DatabaseItemsProps {
  addNestedPage: (type?: PageType) => Promise<void>;
  currentPageId: string;
  userId: string;
  space: any;
  pageType?: PageType;
}

const iconSize = 30;

export function items ({ addNestedPage, currentPageId, userId, space, pageType }: DatabaseItemsProps): PaletteItemTypeNoGroup[] {

  const returnedItems: PaletteItemTypeNoGroup[] = [
  ];

  if (pageType !== 'card_template') {
    returnedItems.push(
      {
        uid: 'database-inline',
        title: 'Database - Inline',
        icon: <DatabaseIcon sx={{ fontSize: iconSize }} />,
        description: 'Add a new inline database to this page',
        editorExecuteCommand: () => {
          return (state, dispatch, view) => {
            // Execute the animation
            if (view) {
              rafCommandExec(view, (_state, _dispatch) => {
                // The page must be created before the node can be created
                addPage({
                  type: 'inline_board',
                  parentId: currentPageId,
                  spaceId: space.id,
                  createdBy: userId
                })
                  .then(({ page }) => {
                    const node = _state.schema.nodes.inlineDatabase.create({
                      pageId: page.id
                    });

                    if (_dispatch && isAtBeginningOfLine(state)) {
                      _dispatch(_state.tr.replaceSelectionWith(node).scrollIntoView());
                      return true;
                    }
                    return insertNode(_state, _dispatch, node);
                  });
                return true;
              });
            }
            return replaceSuggestionMarkWith(palettePluginKey, '')(
              state,
              dispatch,
              view
            );
          };
        }
      },
      {
        uid: 'database-full-page',
        title: 'Database - Full page',
        requiredSpacePermission: 'createPage',
        icon: <DatabaseIcon sx={{
          fontSize: iconSize
        }}
        />,
        description: 'Insert a new board',
        editorExecuteCommand: (() => {
          return (async (state, dispatch, view) => {
            await addNestedPage('board');
            return replaceSuggestionMarkWith(palettePluginKey, '')(
              state,
              dispatch,
              view
            );
          }) as PromisedCommand;
        })
      }
    );
  }

  returnedItems.push(
    {
      uid: 'database-linked',
      title: 'Linked view of database',
      icon: <DatabaseIcon sx={{ fontSize: iconSize }} />,
      description: 'Embed a view from an existing board',
      editorExecuteCommand: () => {
        return (state, dispatch, view) => {
          // Execute the animation
          if (view) {
            rafCommandExec(view, (_state, _dispatch) => {
              addPage({
                type: 'inline_linked_board',
                parentId: currentPageId,
                spaceId: space.id,
                createdBy: userId,
                shouldCreateDefaultBoardData: false
              })
                .then(({ page }) => {
                  const node = _state.schema.nodes.inlineDatabase.create({
                    pageId: page.id
                  });

                  if (_dispatch && isAtBeginningOfLine(state)) {
                    _dispatch(_state.tr.replaceSelectionWith(node).scrollIntoView());
                    return true;
                  }
                  return insertNode(_state, _dispatch, node);
                });
              return true;
            });
          }
          return replaceSuggestionMarkWith(palettePluginKey, '')(
            state,
            dispatch,
            view
          );

        };
      }
    }
  );

  return returnedItems;
}
