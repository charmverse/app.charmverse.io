import { prisma } from '@charmverse/core/prisma-client';
import { testUtilsPages } from '@charmverse/core/test';
import { v4 } from 'uuid';

import { emptyDocument } from 'lib/prosemirror/constants';
import { builders as _ } from 'testing/prosemirror/builders';
import { generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';

import { updatePageContentForSync } from '../updatePageContentForSync';

describe('updatePageContentForSync', () => {
  it(`Should update page content and diffs by converting linked page nodes and adding missing nested pages`, async () => {
    const { user, space } = await generateUserAndSpaceWithApiToken(undefined, false);
    const childPage1Id = v4();
    const childPage1Path = `page-${v4()}`;
    const linkedPage1 = await testUtilsPages.generatePage({
      spaceId: space.id,
      createdBy: user.id
    });

    const linkedPage2 = await testUtilsPages.generatePage({
      spaceId: space.id,
      createdBy: user.id
    });

    const pageContent = _.doc(
      _.paragraph('Paragraph 1'),
      _.page({
        id: childPage1Id,
        type: 'page',
        path: childPage1Path
      }),
      _.paragraph('Paragraph 2'),
      _.page({
        id: linkedPage1.id,
        type: 'page',
        path: linkedPage1.path
      }),
      _.paragraph('Paragraph 3'),
      _.page({
        id: linkedPage2.id,
        type: 'page',
        path: linkedPage2.path
      }),
      _.linkedPage({
        id: linkedPage2.id,
        type: 'page',
        path: linkedPage2.path
      }),
      _.paragraph('Paragraph 4')
    ).toJSON();

    const parentPage = await testUtilsPages.generatePage({
      spaceId: space.id,
      createdBy: user.id,
      content: pageContent
    });

    const childPage1 = await testUtilsPages.generatePage({
      createdBy: user.id,
      spaceId: space.id,
      parentId: parentPage.id,
      id: childPage1Id
    });

    const childPage2 = await testUtilsPages.generatePage({
      createdBy: user.id,
      spaceId: space.id,
      parentId: parentPage.id
    });

    const childPage3 = await testUtilsPages.generatePage({
      createdBy: user.id,
      spaceId: space.id,
      parentId: parentPage.id
    });

    await updatePageContentForSync({ PAGE_SIZE: 2, spaceId: space.id });

    const updatedParentPage = await prisma.page.findUniqueOrThrow({
      where: {
        id: parentPage.id
      },
      select: {
        content: true,
        diffs: {
          select: {
            data: true,
            pageId: true,
            version: true
          }
        },
        version: true
      }
    });

    const pageDiffs = updatedParentPage.diffs;

    expect(updatedParentPage.content).toEqual(
      _.doc(
        _.p('Paragraph 1'),
        _.page({
          id: childPage1.id,
          path: childPage1Path,
          type: childPage1.type
        }),
        _.paragraph('Paragraph 2'),
        _.linkedPage({
          id: linkedPage1.id,
          path: linkedPage1.path,
          type: linkedPage1.type
        }),
        _.paragraph('Paragraph 3'),
        _.linkedPage({
          id: linkedPage2.id,
          path: linkedPage2.path,
          type: linkedPage2.type
        }),
        _.linkedPage({
          id: linkedPage2.id,
          path: linkedPage2.path,
          type: linkedPage2.type
        }),
        _.paragraph('Paragraph 4'),
        _.page({
          id: childPage2.id,
          path: childPage2.path,
          type: childPage2.type
        }),
        _.page({
          id: childPage3.id,
          path: childPage3.path,
          type: childPage3.type
        })
      ).toJSON()
    );

    expect(updatedParentPage.version).toEqual(3);

    expect(pageDiffs).toStrictEqual([
      {
        data: {
          v: 1,
          ds: [
            {
              from: 27,
              to: 28,
              slice: {
                content: [
                  {
                    type: 'linkedPage',
                    attrs: {
                      id: linkedPage1.id,
                      path: linkedPage1.path,
                      type: 'page',
                      track: []
                    }
                  }
                ]
              },
              stepType: 'replace'
            },
            {
              from: 41,
              to: 42,
              slice: {
                content: [
                  {
                    type: 'linkedPage',
                    attrs: {
                      id: linkedPage2.id,
                      path: linkedPage2.path,
                      type: 'page',
                      track: []
                    }
                  }
                ]
              },
              stepType: 'replace'
            }
          ],
          cid: 0,
          rid: 0,
          type: 'diff'
        },
        pageId: parentPage.id,
        version: 1
      },
      {
        data: {
          v: 2,
          ds: [
            {
              to: 56,
              from: 56,
              slice: {
                content: [childPage2, childPage3].map((childPage) => ({
                  type: 'page',
                  attrs: {
                    id: childPage.id,
                    path: childPage.path,
                    type: 'page',
                    track: []
                  }
                }))
              },
              stepType: 'replace'
            }
          ],
          cid: 0,
          rid: 0,
          type: 'diff'
        },
        pageId: parentPage.id,
        version: 2
      }
    ]);
  });

  it(`Should not update page content or add diffs if all the linked page nodes are correct and there are no missing nested pages`, async () => {
    const { user, space } = await generateUserAndSpaceWithApiToken(undefined, false);
    const parentPage = await testUtilsPages.generatePage({
      spaceId: space.id,
      createdBy: user.id,
      content: emptyDocument
    });

    const childPage1 = await testUtilsPages.generatePage({
      createdBy: user.id,
      spaceId: space.id,
      parentId: parentPage.id
    });

    const childPage2 = await testUtilsPages.generatePage({
      createdBy: user.id,
      spaceId: space.id,
      parentId: parentPage.id
    });

    const childPage3 = await testUtilsPages.generatePage({
      createdBy: user.id,
      spaceId: space.id,
      parentId: parentPage.id
    });

    const linkedPage1 = await testUtilsPages.generatePage({
      spaceId: space.id,
      createdBy: user.id
    });

    const linkedPage2 = await testUtilsPages.generatePage({
      spaceId: space.id,
      createdBy: user.id
    });

    const pageContent = _.doc(
      _.paragraph('Paragraph 1'),
      _.page({
        id: childPage1.id,
        type: 'page',
        path: childPage1.path
      }),
      _.paragraph('Paragraph 2'),
      _.linkedPage({
        id: linkedPage1.id,
        type: 'page',
        path: linkedPage1.path
      }),
      _.paragraph('Paragraph 3'),
      _.linkedPage({
        id: linkedPage2.id,
        type: 'page',
        path: linkedPage2.path
      }),
      _.linkedPage({
        id: linkedPage2.id,
        type: 'page',
        path: linkedPage2.path
      }),
      _.paragraph('Paragraph 4'),
      _.page({
        id: childPage2.id,
        type: 'page',
        path: childPage2.path
      }),
      _.page({
        id: childPage3.id,
        type: 'page',
        path: childPage3.path
      })
    ).toJSON();

    await prisma.page.update({
      where: {
        id: parentPage.id
      },
      data: {
        content: pageContent
      }
    });

    await updatePageContentForSync({ PAGE_SIZE: 2, spaceId: space.id });

    const updatedParentPage = await prisma.page.findUniqueOrThrow({
      where: {
        id: parentPage.id
      },
      select: {
        content: true,
        diffs: true,
        version: true
      }
    });

    const pageDiffs = updatedParentPage.diffs;

    expect(pageDiffs.length).toEqual(0);

    expect(updatedParentPage.content).toEqual(pageContent);

    expect(updatedParentPage.version).toEqual(1);
  });
});
