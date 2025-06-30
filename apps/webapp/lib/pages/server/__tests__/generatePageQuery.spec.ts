import type { Page, Space, User } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { ExpectedAnError, InvalidInputError } from '@packages/core/errors';
import { createPage, generateUserAndSpace } from '@packages/testing/setupDatabase';
import { v4 } from 'uuid';

import { generatePageQuery } from '../generatePageQuery';

let space: Space;
let page: Page;
let pageWithUuidPath: Page;
let user: User;

beforeAll(async () => {
  const generated = await generateUserAndSpace();
  space = generated.space;
  user = generated.user;
  const createdPage = await createPage({
    createdBy: user.id,
    spaceId: space.id
  });
  const createdUuidPage = await createPage({
    createdBy: user.id,
    spaceId: space.id,
    path: v4()
  });
  const { permissions: ignored1, ...normalPage } = createdPage;
  const { permissions: ignored2, ...normalUuidPage } = createdUuidPage;

  // Get only a normal page since that's what we're testing
  page = normalPage;
  pageWithUuidPath = normalUuidPage;
});

describe('generatePageQuery', () => {
  it('should return correct query for searching a page by ID', async () => {
    const query = generatePageQuery({ pageIdOrPath: page.id });

    const found = await prisma.page.findFirst({
      where: query
    });

    expect(found).toMatchObject(page);
  });

  it('should return correct query for searching a page by ID + spaceID', async () => {
    const query = generatePageQuery({ pageIdOrPath: page.id, spaceIdOrDomain: space.id });

    const found = await prisma.page.findFirst({
      where: query
    });

    expect(found).toMatchObject(page);
  });

  it('should return correct query for searching a page by page path where path is a UUID + spaceID', async () => {
    const query = generatePageQuery({ pageIdOrPath: pageWithUuidPath.id, spaceIdOrDomain: space.id });

    const found = await prisma.page.findFirst({
      where: query
    });

    expect(found).toMatchObject(pageWithUuidPath);
  });

  it('should return correct query for searching a page by page path and space domain', async () => {
    const query = generatePageQuery({ pageIdOrPath: page.path, spaceIdOrDomain: space.domain });

    const found = await prisma.page.findFirst({
      where: query
    });

    expect(found).toMatchObject(page);
  });

  it('should return correct query for searching a page by page path and space ID', async () => {
    const query = generatePageQuery({ pageIdOrPath: page.path, spaceIdOrDomain: space.id });

    const found = await prisma.page.findFirst({
      where: query
    });

    expect(found).toMatchObject(page);
  });

  it('should return correct query for searching a page by page path where path is a UUID and space domain', async () => {
    const query = generatePageQuery({ pageIdOrPath: pageWithUuidPath.path, spaceIdOrDomain: space.domain });

    const found = await prisma.page.findFirst({
      where: query
    });

    expect(found).toMatchObject(pageWithUuidPath);
  });

  it('should return correct query for searching a page by page ID and space domain', async () => {
    const query = generatePageQuery({ pageIdOrPath: page.id, spaceIdOrDomain: space.domain });

    const found = await prisma.page.findFirst({
      where: query
    });

    expect(found).toMatchObject(page);
  });

  it('should throw an error if no pageID is provided', async () => {
    try {
      generatePageQuery({ pageIdOrPath: undefined as any });
      throw new ExpectedAnError();
    } catch (err) {
      expect(err).toBeInstanceOf(InvalidInputError);
    }
  });

  it('should throw an error if a page path is provided without a spaceDomain', async () => {
    try {
      generatePageQuery({ pageIdOrPath: page.path });
      throw new ExpectedAnError();
    } catch (err) {
      expect(err).toBeInstanceOf(InvalidInputError);
    }
  });
});
