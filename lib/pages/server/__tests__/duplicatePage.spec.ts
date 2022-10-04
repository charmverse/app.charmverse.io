import type { Block, Page } from '@prisma/client';
import { v4 } from 'uuid';

import { prisma } from 'db';
import { ExpectedAnError } from 'testing/errors';
import { createBlock, createPage, generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';

import { duplicatePage } from '../duplicatePage';
import { PageNotFoundError } from '../errors';

describe('duplicatePage', () => {

  it('should fail if the page doesn\'t exist', async () => {
    try {
      await duplicatePage(v4(), v4());
      throw new ExpectedAnError();
    }
    catch (err) {
      expect(err).toBeInstanceOf(PageNotFoundError);
    }
  });

  it('Should duplicate a single page', async () => {
    const { user, space } = await generateUserAndSpaceWithApiToken();
    const page = await createPage({
      path: `path-${v4()}`,
      spaceId: space.id,
      createdBy: user.id,
      title: 'Hello World',
      icon: '👋',
      headerImage: '/img/charmverse.png',
      content: {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: '👋 Welcome to your workspace!'
              }
            ]
          }
        ]
      }
    });

    const duplicatedPage = await duplicatePage(page.id, user.id);

    expect(duplicatedPage.title).toBe(`${page.title} (copy)`);
    expect(duplicatedPage.content).toStrictEqual(page.content);
    expect(duplicatedPage.icon).toBe(page.icon);
    expect(duplicatedPage.type).toBe(page.type);
    expect(duplicatedPage.headerImage).toBe(page.headerImage);
    expect(duplicatedPage.path).not.toBe(page.path);
  });

  it('Should duplicate a board page', async () => {
    const { user, space } = await generateUserAndSpaceWithApiToken();
    const boardId = v4();
    const boardBlock = await createBlock({
      type: 'board',
      id: boardId,
      createdBy: user.id,
      spaceId: space.id,
      rootId: boardId,
      fields: {
        cardProperties: []
      },
      parentId: '',
      title: 'Board'
    });

    const boardPage = await createPage({
      id: boardId,
      spaceId: space.id,
      createdBy: user.id,
      title: 'Board Page',
      icon: '👋',
      headerImage: '/img/charmverse.png',
      content: undefined,
      type: 'board',
      boardId
    });

    const cardId = v4();
    const cardPage = await createPage({
      type: 'card',
      id: cardId,
      spaceId: space.id,
      title: 'Card',
      icon: '💳',
      headerImage: '/img/charmverse-card.png',
      createdBy: user.id,
      parentId: boardId,
      path: `path-${v4()}`,
      content: undefined
    });

    const cardBlock = await createBlock({
      type: 'card',
      id: cardId,
      createdBy: user.id,
      spaceId: space.id,
      rootId: boardId,
      parentId: boardId,
      title: 'Card'
    });

    const viewBlock = await createBlock({
      type: 'view',
      createdBy: user.id,
      spaceId: space.id,
      rootId: boardId,
      title: 'View',
      parentId: boardId
    });

    const duplicateBoardPage = await duplicatePage(boardPage.id, user.id);

    const duplicateCardPage = await prisma.page.findFirst({
      where: {
        id: {
          notIn: [cardId]
        },
        spaceId: space.id,
        type: 'card'
      }
    }) as Page;

    const duplicateCardBlock = await prisma.block.findFirst({
      where: {
        id: {
          notIn: [cardId]
        },
        spaceId: space.id,
        type: 'card'
      }
    }) as Block;

    const duplicateBoardBlock = await prisma.block.findFirst({
      where: {
        id: duplicateBoardPage.id,
        type: 'board',
        spaceId: space.id
      }
    }) as Block;

    const duplicateViewBlock = await prisma.block.findFirst({
      where: {
        id: {
          notIn: [viewBlock.id]
        },
        spaceId: space.id,
        type: 'view'
      }
    }) as Block;

    expect(duplicateBoardPage.title).toBe(`${boardPage.title} (copy)`);
    expect(duplicateBoardPage.type).toBe(boardPage.type);
    expect(duplicateBoardPage.content).toStrictEqual(boardPage.content);
    expect(duplicateBoardPage.icon).toBe(boardPage.icon);
    expect(duplicateBoardPage.headerImage).toBe(boardPage.headerImage);
    expect(duplicateBoardPage.path).not.toBe(boardPage.path);
    expect(duplicateBoardPage.boardId).toBe(duplicateBoardBlock.id);
    expect(duplicateBoardPage.id).toBe(duplicateBoardBlock.id);

    expect(duplicateBoardBlock.spaceId).toBe(boardBlock.spaceId);
    expect(duplicateBoardBlock.parentId).toBe(boardBlock.parentId);
    expect(duplicateBoardBlock.rootId).not.toBe(boardBlock.rootId);
    expect(duplicateBoardBlock.type).toBe(boardBlock.type);
    expect(duplicateBoardBlock.title).toBe(`${boardBlock.title} (copy)`);
    expect(duplicateBoardBlock.createdBy).toBe(boardBlock.createdBy);

    expect(duplicateCardPage.title).toBe(cardPage.title);
    expect(duplicateCardPage.type).toBe(cardPage.type);
    expect(duplicateCardPage.content).toStrictEqual(cardPage.content);
    expect(duplicateCardPage.icon).toBe(cardPage.icon);
    expect(duplicateCardPage.headerImage).toBe(cardPage.headerImage);
    expect(duplicateCardPage.path).not.toBe(cardPage.path);
    expect(duplicateCardPage.parentId).toBe(duplicateBoardPage.id);

    expect(duplicateCardBlock.spaceId).toBe(cardBlock.spaceId);
    expect(duplicateCardBlock.parentId).toBe(duplicateBoardBlock.id);
    expect(duplicateCardBlock.rootId).not.toBe(cardBlock.rootId);
    expect(duplicateCardBlock.type).toBe(cardBlock.type);
    expect(duplicateCardBlock.title).toBe(cardBlock.title);
    expect(duplicateCardBlock.createdBy).toBe(cardBlock.createdBy);

    expect(duplicateViewBlock.spaceId).toBe(viewBlock.spaceId);
    expect(duplicateViewBlock.parentId).toBe(duplicateBoardBlock.id);
    expect(duplicateViewBlock.rootId).not.toBe(viewBlock.rootId);
    expect(duplicateViewBlock.type).toBe(viewBlock.type);
    expect(duplicateViewBlock.title).toBe(viewBlock.title);
    expect(duplicateViewBlock.createdBy).toBe(viewBlock.createdBy);
    expect((duplicateViewBlock.fields as any).cardOrder).toStrictEqual([duplicateCardBlock.id]);
  });
});
