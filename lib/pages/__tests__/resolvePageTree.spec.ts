import { generateUserAndSpaceWithApiToken, createPage } from 'testing/setupDatabase';
import { prisma } from 'db';
import { resolveChildPages, resolveParentPages } from '../resolvePageTree';

describe('resolveChildPages', () => {
  it('should return a list of all children of a page', async () => {
    const { user, space } = await generateUserAndSpaceWithApiToken();

    const root = await createPage({
      createdBy: user.id,
      spaceId: space.id
    });

    const child = await createPage({
      createdBy: user.id,
      spaceId: space.id,
      parentId: root.id
    });

    const subChild1 = await createPage({
      createdBy: user.id,
      spaceId: space.id,
      parentId: child.id
    });

    const subChild2 = await createPage({
      createdBy: user.id,
      spaceId: space.id,
      parentId: child.id
    });

    const subSubChild1 = await createPage({
      createdBy: user.id,
      spaceId: space.id,
      parentId: subChild1.id
    });

    const subSubChild2 = await createPage({
      createdBy: user.id,
      spaceId: space.id,
      parentId: subChild1.id
    });

    const subSubChild3 = await createPage({
      createdBy: user.id,
      spaceId: space.id,
      parentId: subChild1.id
    });

    const subSubSubChild1 = await createPage({
      createdBy: user.id,
      spaceId: space.id,
      parentId: subSubChild1.id
    });

    const subSubSubSubChild1 = await createPage({
      createdBy: user.id,
      spaceId: space.id,
      parentId: subSubSubChild1.id
    });

    const resolvedChildren = await resolveChildPages(child.id);

    expect(resolvedChildren.length).toBe(7);
    expect(resolvedChildren.find(page => page.id === subChild1.id)).toBeDefined();
    expect(resolvedChildren.find(page => page.id === subChild2.id)).toBeDefined();
    expect(resolvedChildren.find(page => page.id === subSubChild1.id)).toBeDefined();
    expect(resolvedChildren.find(page => page.id === subSubChild2.id)).toBeDefined();
    expect(resolvedChildren.find(page => page.id === subSubChild3.id)).toBeDefined();
    expect(resolvedChildren.find(page => page.id === subSubSubChild1.id)).toBeDefined();
    expect(resolvedChildren.find(page => page.id === subSubSubSubChild1.id)).toBeDefined();
  });
});

describe('resolveParentPages', () => {
  it('should return the list of parents for a page, ordered by relation', async () => {

    const { user, space } = await generateUserAndSpaceWithApiToken();

    const topParent = await createPage({
      createdBy: user.id,
      spaceId: space.id
    });

    const thirdParent = await createPage({
      createdBy: user.id,
      spaceId: space.id,
      parentId: topParent.id
    });

    const secondParent = await createPage({
      createdBy: user.id,
      spaceId: space.id,
      parentId: thirdParent.id
    });

    const firstParent = await createPage({
      createdBy: user.id,
      spaceId: space.id,
      parentId: secondParent.id
    });

    const child = await createPage({
      createdBy: user.id,
      spaceId: space.id,
      parentId: firstParent.id
    });

    const parentList = await resolveParentPages(child.id);

    expect(parentList.length).toBe(4);
    expect(parentList[0].id).toBe(firstParent.id);
    expect(parentList[1].id).toBe(secondParent.id);
    expect(parentList[2].id).toBe(thirdParent.id);
    expect(parentList[3].id).toBe(topParent.id);
  });

  it('should return results up to an intermediate parent that is in the tree but has been deleted', async () => {

    const { user, space } = await generateUserAndSpaceWithApiToken();

    const topParent = await createPage({
      createdBy: user.id,
      spaceId: space.id
    });

    const thirdParent = await createPage({
      createdBy: user.id,
      spaceId: space.id,
      parentId: topParent.id
    });

    const secondParent = await createPage({
      createdBy: user.id,
      spaceId: space.id,
      parentId: thirdParent.id
    });

    const firstParent = await createPage({
      createdBy: user.id,
      spaceId: space.id,
      parentId: secondParent.id
    });

    const child = await createPage({
      createdBy: user.id,
      spaceId: space.id,
      parentId: firstParent.id
    });

    await prisma?.page.delete({
      where: {
        id: secondParent.id
      }
    });

    const parentList = await resolveParentPages(child.id);

    expect(parentList.length).toBe(1);
    expect(parentList[0].id).toBe(firstParent.id);
  });
});
