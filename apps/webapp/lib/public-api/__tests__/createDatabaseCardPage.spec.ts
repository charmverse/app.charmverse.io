import type { Space, User } from '@charmverse/core/prisma';
import type { Page } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { testUtilsUser } from '@charmverse/core/test';
import { ExpectedAnError } from '@packages/testing/errors';
import { generateSchema } from '@packages/testing/publicApi/schemas';
import { v4 as uuid } from 'uuid';

import { createDatabase } from '../createDatabase';
import { createDatabaseCardPage } from '../createDatabaseCardPage';
import { PageFromBlock } from '../pageFromBlock.class';

describe('createDatabaseCardPage', () => {
  const textSchema = generateSchema({ type: 'text' });
  const numberSchema = generateSchema({ type: 'number' });
  const selectSchema = generateSchema({ type: 'select', options: ['Green', 'Yellow', 'Red'] });

  let user: User;
  let space: Space;

  let database: Page;

  beforeAll(async () => {
    const generated = await testUtilsUser.generateUserAndSpace();
    user = generated.user;
    space = generated.space;
    database = await createDatabase({ title: 'My database', createdBy: user.id, spaceId: space.id }, [
      textSchema,
      numberSchema,
      selectSchema
    ]);
  });

  it('should allow creating the page without any input properties or title', async () => {
    const createdPage = await createDatabaseCardPage({
      title: undefined,
      properties: undefined,
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      boardId: database.boardId!,
      spaceId: space.id,
      createdBy: user.id
    });

    expect(createdPage).toBeInstanceOf(PageFromBlock);
  });

  it('should throw an error when the linked database does not exist', async () => {
    try {
      await createDatabaseCardPage({
        title: 'Example title',
        boardId: uuid(),
        properties: {},
        spaceId: space.id,
        createdBy: user.id
      });
      throw new ExpectedAnError();
    } catch (error) {
      expect(true).toBe(true);
    }
  });

  it('should return the newly created page', async () => {
    const createdPage = await createDatabaseCardPage({
      title: 'Example title',
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      boardId: database.boardId!,
      properties: {},
      spaceId: space.id,
      createdBy: user.id
    });

    expect(createdPage).toBeInstanceOf(PageFromBlock);
  });

  it('should support a board page path as the target board ID', async () => {
    const databasePage = await prisma.page.findUnique({
      where: {
        id: database.id
      },
      select: {
        path: true
      }
    });

    const createdPage = await createDatabaseCardPage({
      title: 'Example title',
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      boardId: databasePage?.path as string,
      properties: {},
      spaceId: space.id,
      createdBy: user.id
    });

    expect(createdPage).toBeInstanceOf(PageFromBlock);
  });

  it('should not setup any page permissions', async () => {
    const createdPage = await createDatabaseCardPage({
      title: 'Example title',
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      boardId: database.boardId!,
      properties: {},
      spaceId: space.id,
      createdBy: user.id
    });

    const permissions = await prisma.pagePermission.count({
      where: {
        pageId: createdPage.id
      }
    });

    expect(permissions).toEqual(0);
  });

  it('should handle creation when properties are undefined', async () => {
    const createdPage = await createDatabaseCardPage({
      title: 'Example title',
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      boardId: database.boardId!,
      properties: undefined as any,
      spaceId: space.id,
      createdBy: user.id
    });

    expect(createdPage).toBeInstanceOf(PageFromBlock);
  });

  it('should pass properties when creating the card', async () => {
    const cardProps = {
      [textSchema.id]: 'Text',
      [selectSchema.name]: 'Green',
      [numberSchema.name]: 5
    };

    const card = await createDatabaseCardPage({
      boardId: database.id,
      createdBy: user.id,
      properties: cardProps,
      spaceId: space.id,
      title: 'Example title'
    });

    // We expect a set of human friendly keys and values
    expect(card.properties).toEqual({
      [textSchema.name]: cardProps[textSchema.id],
      [selectSchema.name]: cardProps[selectSchema.name],
      [numberSchema.name]: cardProps[numberSchema.name]
    });
  });

  it('should allow markdown to create the initial page content', async () => {
    const matchPhrase = 'Lorem markdownum conducit illa iamque';

    const card = await createDatabaseCardPage({
      boardId: database.id,
      createdBy: user.id,
      contentMarkdown: `# Huius disertum

      ## Et harenas Minyeias ignes

      ${matchPhrase}`,
      spaceId: space.id,
      title: 'Example title'
    });

    // We expect a set of human friendly keys and values

    expect(card.content.markdown).toMatch(matchPhrase);

    const rawPageContent = await prisma.page.findUnique({
      where: {
        id: card.id
      },
      select: {
        content: true
      }
    });

    expect(typeof rawPageContent?.content === 'object').toBe(true);
    expect((rawPageContent?.content as any).type === 'doc').toBe(true);

    expect(JSON.stringify(rawPageContent?.content)).toMatch(matchPhrase);
  });
});
