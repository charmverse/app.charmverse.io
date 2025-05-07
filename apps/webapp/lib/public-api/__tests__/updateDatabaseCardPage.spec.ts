import type { Page, Space, User } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { testUtilsPages, testUtilsUser } from '@charmverse/core/test';
import { generateSchemasForAllSupportedFieldTypes } from '@packages/testing/publicApi/schemas';

import { createDatabase } from '../createDatabase';
import { createDatabaseCardPage } from '../createDatabaseCardPage';
import { updateDatabaseCardPage } from '../updateDatabaseCardPage';

describe('updateDatabaseCardPage', () => {
  let space: Space;
  let user: User;
  let database: Page;

  const fullSchema = generateSchemasForAllSupportedFieldTypes();

  beforeAll(async () => {
    const generated = await testUtilsUser.generateUserAndSpace();
    space = generated.space;
    user = generated.user;

    database = await createDatabase(
      {
        createdBy: user.id,
        spaceId: space.id,
        title: 'Test database'
      },
      Object.values(fullSchema)
    );
  });

  it('should update properties of a card page', async () => {
    const page = await createDatabaseCardPage({
      boardId: database.id,
      createdBy: user.id,
      properties: {},
      spaceId: space.id,
      title: 'Test card'
    });

    const update = {
      [fullSchema.checkbox.name]: true,
      [fullSchema.date.name]: new Date().toISOString(),
      [fullSchema.email.name]: 'test@charmverse.io',
      [fullSchema.multiSelect.name]: [fullSchema.multiSelect.options[0].value, fullSchema.multiSelect.options[1].value],
      [fullSchema.number.name]: 123,
      [fullSchema.person.name]: [user.id],
      [fullSchema.phone.name]: '+1 123 456 7890',
      [fullSchema.select.name]: fullSchema.select.options[0].value,
      [fullSchema.text.name]: 'Test text',
      [fullSchema.url.name]: 'Alice Bob'
    };

    const newTitle = 'New title';

    const updatedPage = await updateDatabaseCardPage({
      cardId: page.id,
      spaceId: space.id,
      update: {
        properties: update,
        title: newTitle
      },
      updatedBy: user.id
    });
    expect(updatedPage.properties).toEqual(
      expect.objectContaining({
        ...update,
        [fullSchema.date.name]: {
          from: expect.any(Number)
        }
      })
    );
    expect(updatedPage.title).toEqual(newTitle);
  });

  it('should accept the path of the card page instead of its ID', async () => {
    const page = await createDatabaseCardPage({
      boardId: database.id,
      createdBy: user.id,
      properties: {},
      spaceId: space.id,
      title: 'Test card'
    });

    const pagePath = (await prisma.page.findUnique({
      where: {
        id: page.id
      },
      select: {
        path: true
      }
    })) as { path: string };

    const newTitle = 'New title';

    const updatedPage = await updateDatabaseCardPage({
      cardId: pagePath.path,
      spaceId: space.id,
      update: {
        title: newTitle
      },
      updatedBy: user.id
    });

    expect(updatedPage.title).toEqual(newTitle);
  });

  it('should accept an additionalPath of the card page instead of its ID', async () => {
    const customPath = 'page-123348855';

    const page = await createDatabaseCardPage({
      boardId: database.id,
      createdBy: user.id,
      properties: {},
      spaceId: space.id,
      title: 'Test card'
    });

    await prisma.page.update({
      where: {
        id: page.id
      },
      data: {
        additionalPaths: {
          set: [customPath]
        }
      }
    });

    const newTitle = 'New title';

    const updatedPage = await updateDatabaseCardPage({
      cardId: customPath,
      spaceId: space.id,
      update: {
        title: newTitle
      },
      updatedBy: user.id
    });

    expect(updatedPage.title).toEqual(newTitle);
  });
});
