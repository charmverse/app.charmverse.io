import { prisma } from '@charmverse/core/prisma-client';
import { Utils } from 'components/common/DatabaseEditor/utils';
import type { Board, IPropertyOption, IPropertyTemplate, PropertyType } from '@packages/databases/board';

async function init() {
  const views = await prisma.block.findMany({
    where: {
      type: 'view',
      fields: {
        path: ['viewType'],
        equals: 'calendar'
      }
    }
  });
  let counts = { views: views.length, needsDate: 0, boardHasDate: 0 };
  for (let view of views) {
    if (!(view.fields as any)?.dateDisplayPropertyId) {
      counts.needsDate++;

      const template: IPropertyTemplate = {
        id: Utils.createGuid(),
        name: 'Date',
        type: 'date',
        options: []
      };
      const board = (await prisma.block.findUnique({
        where: {
          id: view.parentId
        }
      })) as unknown as Board;
      const boardFields = board.fields;
      const dateProperty = boardFields.cardProperties.find((p: IPropertyTemplate) => p.type === 'date');
      if (dateProperty) {
        counts.boardHasDate++;
        const viewFields = view.fields as any;
        viewFields.dateDisplayPropertyId = dateProperty.id;
        await prisma.block.update({
          where: {
            id: view.id
          },
          data: {
            fields: viewFields
          }
        });
      }
      // make a new date property
      else {
        boardFields.cardProperties.push(template);
        const viewFields = view.fields as any;
        viewFields.dateDisplayPropertyId = template.id;
        await prisma.$transaction([
          prisma.block.update({
            where: {
              id: board.id
            },
            data: {
              fields: boardFields
            }
          }),
          prisma.block.update({
            where: {
              id: view.id
            },
            data: {
              fields: viewFields
            }
          })
        ]);
      }
    }
  }
  console.log('complete', counts);
}

init();
