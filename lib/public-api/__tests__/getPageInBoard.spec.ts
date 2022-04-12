/* eslint-disable @typescript-eslint/no-unused-vars */
import { prisma } from 'db';
import { ExpectedAnError } from 'testing/errors';
import { generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';
import { v4 } from 'uuid';
import { createDatabase, createDatabaseCardPage } from '../createDatabaseCardPage';
import { DatabasePageNotFoundError, PageNotFoundError } from '../errors';
import { getPageInBoard } from '../getPageInBoard';
import { Page } from '../interfaces';

describe('getPageInBoard', () => {

  it('should return the page', async () => {

    const { user, space, apiToken } = await generateUserAndSpaceWithApiToken(v4());

    const databasePage = await createDatabase({
      title: 'Some title',
      createdBy: user.id,
      spaceId: space.id
    });

    const card = await createDatabaseCardPage({
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      boardId: databasePage.boardId!,
      createdBy: user.id,
      properties: {},
      spaceId: space.id,
      title: 'Example card'
    });

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const foundCard = await getPageInBoard(card.id);

    // Add in actual assertions here
    expect(foundCard).toEqual<Page>(
      expect.objectContaining<Page>({
        content: expect.any(Object),
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
        databaseId: expect.any(String),
        id: expect.any(String),
        isTemplate: expect.any(Boolean),
        properties: expect.any(Object),
        spaceId: expect.any(String),
        title: expect.any(String)
      })
    );
  });

  it('should throw a database not found error when the database for the page does not exist', async () => {

    const { user, space, apiToken } = await generateUserAndSpaceWithApiToken(v4());

    const databasePage = await createDatabase({
      title: 'Some title',
      createdBy: user.id,
      spaceId: space.id
    });

    const card = await createDatabaseCardPage({
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      boardId: databasePage.boardId!,
      createdBy: user.id,
      properties: {},
      spaceId: space.id,
      title: 'Example card'
    });

    // Remove the database
    await prisma.block.deleteMany({
      where: {
        type: 'board',
        id: card.databaseId
      }
    });

    try {
      const foundCard = await getPageInBoard(card.id);
      throw new ExpectedAnError();
    }
    catch (error) {
      expect(error).toBeInstanceOf(DatabasePageNotFoundError);
    }
  });

  it('should throw a page not found error when the page does not exist', async () => {

    const { user, space, apiToken } = await generateUserAndSpaceWithApiToken(v4());

    try {
      const inexistentId = v4();
      const foundCard = await getPageInBoard(inexistentId);
      throw new ExpectedAnError();
    }
    catch (error) {
      expect(error).toBeInstanceOf(PageNotFoundError);
    }
  });

  it('should throw a page not found error when the page does not have the board type', async () => {

    const { user, space, apiToken } = await generateUserAndSpaceWithApiToken(v4());

    const page = await prisma.page.create({
      data: {
        title: 'Example title',
        contentText: '',
        path: v4(),
        type: 'page',
        updatedBy: user.id,
        author: {
          connect: {
            id: user.id
          }
        }
      }
    });

    try {

      await getPageInBoard(page.id);
      throw new ExpectedAnError();
    }
    catch (error) {
      expect(error).toBeInstanceOf(PageNotFoundError);
    }
  });

});

export default {};
