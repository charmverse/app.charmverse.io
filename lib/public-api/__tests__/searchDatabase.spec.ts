import type { Page, Space, User } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { testUtilsUser } from '@charmverse/core/test';
import { generateSchemasForAllSupportedFieldTypes } from '@packages/testing/publicApi/schemas';
import { uniqueValues } from '@packages/utils/array';
import type { CardPage as ApiPage, PageFromBlock } from '@root/lib/public-api';
import { createDatabase } from '@root/lib/public-api/createDatabase';
import { createDatabaseCardPage } from '@root/lib/public-api/createDatabaseCardPage';

import { searchDatabase } from '../searchDatabase';

let database: Page;
let user: User;
let secondUser: User;
let space: Space;
let createdPageList: ApiPage[];

const boardSchema = generateSchemasForAllSupportedFieldTypes();

let pageWithTitle: PageFromBlock;
let pageWithMatchingTextValue: PageFromBlock;
let pageWithMatchingSelectValue: PageFromBlock;
let pageWithOneMatchingMultiSelectValue: PageFromBlock;
let pageWithTwoMatchingMultiSelectValues: PageFromBlock;
let pageWithMatchingNumberValue: PageFromBlock;
let pageWithMatchingDateValue: PageFromBlock;
let pageWithMatchingCheckboxValue: PageFromBlock;
let pageWithMatchingEmailValue: PageFromBlock;
let pageWithMatchingPhoneValue: PageFromBlock;
let pageWithMatchingUrlValue: PageFromBlock;
let pageWithMatchingPersonValue: PageFromBlock;
let pageWithTwoMatchingPersonValues: PageFromBlock;

let deletedPage: PageFromBlock;

beforeAll(async () => {
  const generated = await testUtilsUser.generateUserAndSpace();
  user = generated.user;
  space = generated.space;
  secondUser = await testUtilsUser.generateSpaceUser({
    spaceId: space.id
  });

  database = await createDatabase(
    {
      title: 'Example title',
      createdBy: user.id,
      spaceId: space.id
    },
    Object.values(boardSchema)
  );

  const boardId = database.id;
  const spaceId = space.id;

  pageWithTitle = await createDatabaseCardPage({
    boardId,
    createdBy: user.id,
    properties: {},
    spaceId,
    title: 'Search title'
  });

  pageWithMatchingTextValue = await createDatabaseCardPage({
    boardId,
    createdBy: user.id,
    properties: {
      [boardSchema.text.id]: 'TextValue'
    },
    spaceId,
    title: '-'
  });

  pageWithMatchingSelectValue = await createDatabaseCardPage({
    boardId,
    createdBy: user.id,
    properties: {
      [boardSchema.select.id]: boardSchema.select.options[0].value
    },
    spaceId,
    title: '-'
  });

  pageWithOneMatchingMultiSelectValue = await createDatabaseCardPage({
    boardId,
    createdBy: user.id,
    properties: {
      [boardSchema.multiSelect.id]: [boardSchema.multiSelect.options[0].value]
    },
    spaceId,
    title: '-'
  });

  pageWithTwoMatchingMultiSelectValues = await createDatabaseCardPage({
    boardId,
    createdBy: user.id,
    properties: {
      [boardSchema.multiSelect.id]: [boardSchema.multiSelect.options[0].value, boardSchema.multiSelect.options[1].value]
    },
    spaceId,
    title: '-'
  });

  pageWithMatchingNumberValue = await createDatabaseCardPage({
    boardId,
    createdBy: user.id,
    properties: {
      [boardSchema.number.id]: 123
    },
    spaceId,
    title: '-'
  });

  pageWithMatchingDateValue = await createDatabaseCardPage({
    boardId,
    createdBy: user.id,
    properties: {
      [boardSchema.date.id]: new Date().toISOString()
    },
    spaceId,
    title: '-'
  });

  pageWithMatchingCheckboxValue = await createDatabaseCardPage({
    boardId,
    createdBy: user.id,
    properties: {
      [boardSchema.checkbox.id]: true
    },
    spaceId,
    title: '-'
  });

  pageWithMatchingEmailValue = await createDatabaseCardPage({
    boardId,
    createdBy: user.id,
    properties: {
      [boardSchema.email.id]: 'test@gmail.com'
    },
    spaceId,
    title: '-'
  });

  pageWithMatchingPhoneValue = await createDatabaseCardPage({
    boardId,
    createdBy: user.id,
    properties: {
      [boardSchema.phone.id]: '+1234567890'
    },
    spaceId,
    title: '-'
  });

  pageWithMatchingUrlValue = await createDatabaseCardPage({
    boardId,
    createdBy: user.id,
    properties: {
      [boardSchema.url.id]: 'www.google.com'
    },
    spaceId,
    title: '-'
  });

  pageWithMatchingPersonValue = await createDatabaseCardPage({
    boardId,
    createdBy: user.id,
    properties: {
      [boardSchema.person.id]: user.id
    },
    spaceId,
    title: '-'
  });

  pageWithTwoMatchingPersonValues = await createDatabaseCardPage({
    boardId,
    createdBy: user.id,
    properties: {
      [boardSchema.person.id]: [user.id, secondUser.id]
    },
    spaceId,
    title: '-'
  });

  deletedPage = await createDatabaseCardPage({
    boardId,
    createdBy: user.id,
    properties: {},
    spaceId,
    title: 'Deleted page'
  });

  await prisma.page.update({
    where: {
      id: deletedPage.id
    },
    data: {
      deletedAt: new Date()
    }
  });
  await prisma.block.update({
    where: {
      id: deletedPage.id
    },
    data: {
      deletedAt: new Date()
    }
  });

  createdPageList = [
    pageWithTitle,
    pageWithMatchingTextValue,
    pageWithMatchingSelectValue,
    pageWithOneMatchingMultiSelectValue,
    pageWithTwoMatchingMultiSelectValues,
    pageWithMatchingNumberValue,
    pageWithMatchingDateValue,
    pageWithMatchingCheckboxValue,
    pageWithMatchingEmailValue,
    pageWithMatchingPhoneValue,
    pageWithMatchingUrlValue,
    pageWithMatchingPersonValue,
    pageWithTwoMatchingPersonValues
  ];
});

describe('searchDatabase', () => {
  it('should support searching a page by title', async () => {
    const { data: searchResults } = await searchDatabase({
      databaseId: database.id,
      spaceId: space.id,
      paginatedQuery: {
        query: {
          title: 'Search title'
        }
      }
    });

    expect(searchResults).toHaveLength(1);
    expect(searchResults[0].id).toBe(pageWithTitle.id);
  });

  it('should support searching a page by text field value', async () => {
    const { data: searchResults } = await searchDatabase({
      databaseId: database.id,
      spaceId: space.id,
      paginatedQuery: {
        query: {
          properties: {
            [boardSchema.text.name]: pageWithMatchingTextValue.properties[boardSchema.text.name]
          }
        }
      }
    });

    expect(searchResults).toHaveLength(1);
    expect(searchResults[0].id).toBe(pageWithMatchingTextValue.id);
  });

  it('should support searching a page by select field value', async () => {
    const { data: searchResults } = await searchDatabase({
      databaseId: database.id,
      spaceId: space.id,
      paginatedQuery: {
        query: {
          properties: {
            [boardSchema.select.name]: pageWithMatchingSelectValue.properties[boardSchema.select.name]
          }
        }
      }
    });

    expect(searchResults).toHaveLength(1);
    expect(searchResults[0].id).toBe(pageWithMatchingSelectValue.id);
  });

  it('should support searching a page by multi select field value', async () => {
    const { data: searchResults } = await searchDatabase({
      databaseId: database.id,
      spaceId: space.id,
      paginatedQuery: {
        query: {
          properties: {
            [boardSchema.multiSelect.name]: pageWithOneMatchingMultiSelectValue.properties[boardSchema.multiSelect.name]
          }
        }
      }
    });

    expect(searchResults).toHaveLength(2);
    expect(searchResults.some((p) => p.id === pageWithOneMatchingMultiSelectValue.id)).toBe(true);
    expect(searchResults.some((p) => p.id === pageWithTwoMatchingMultiSelectValues.id)).toBe(true);
  });

  it('should support searching a page by multi select field value and handle multiple multi-select values as an AND query', async () => {
    const { data: searchResults } = await searchDatabase({
      databaseId: database.id,
      spaceId: space.id,
      paginatedQuery: {
        query: {
          properties: {
            [boardSchema.multiSelect.name]: [
              boardSchema.multiSelect.options[0].value,
              boardSchema.multiSelect.options[1].value
            ]
          }
        }
      }
    });

    expect(searchResults).toHaveLength(1);
    expect(searchResults[0].id).toBe(pageWithTwoMatchingMultiSelectValues.id);

    // Quick test to ensure ordering does not matter
    const { data: switchedSearchResults } = await searchDatabase({
      databaseId: database.id,
      spaceId: space.id,
      paginatedQuery: {
        query: {
          properties: {
            [boardSchema.multiSelect.name]: [
              boardSchema.multiSelect.options[1].value,
              boardSchema.multiSelect.options[0].value
            ]
          }
        }
      }
    });

    expect(switchedSearchResults).toHaveLength(1);
    expect(switchedSearchResults[0].id).toBe(pageWithTwoMatchingMultiSelectValues.id);
  });

  it('should support searching a page by number value', async () => {
    const { data: searchResults } = await searchDatabase({
      databaseId: database.id,
      spaceId: space.id,
      paginatedQuery: {
        query: {
          properties: {
            [boardSchema.number.name]: pageWithMatchingNumberValue.properties[boardSchema.number.name]
          }
        }
      }
    });

    expect(searchResults).toHaveLength(1);
    expect(searchResults[0].id).toBe(pageWithMatchingNumberValue.id);
  });

  it('should support searching a page by date value', async () => {
    const { data: searchResults } = await searchDatabase({
      databaseId: database.id,
      spaceId: space.id,
      paginatedQuery: {
        query: {
          properties: {
            [boardSchema.date.name]: pageWithMatchingDateValue.properties[boardSchema.date.name]
          }
        }
      }
    });

    expect(searchResults).toHaveLength(1);
    expect(searchResults[0].id).toBe(pageWithMatchingDateValue.id);
  });

  // Currently, we can only support true searches
  it('should support searching a page by checkbox value', async () => {
    const { data: searchResults } = await searchDatabase({
      databaseId: database.id,
      spaceId: space.id,
      paginatedQuery: {
        query: {
          properties: {
            [boardSchema.checkbox.name]: true
          }
        }
      }
    });

    expect(searchResults).toHaveLength(1);
    expect(searchResults[0].id).toBe(pageWithMatchingCheckboxValue.id);
  });

  it('should support searching a page by email value with partial match', async () => {
    const { data: searchResults } = await searchDatabase({
      databaseId: database.id,
      spaceId: space.id,
      paginatedQuery: {
        query: {
          properties: {
            [boardSchema.email.name]: (pageWithMatchingEmailValue.properties[boardSchema.email.name] as string).slice(
              0,
              5
            )
          }
        }
      }
    });

    expect(searchResults).toHaveLength(1);
    expect(searchResults[0].id).toBe(pageWithMatchingEmailValue.id);
  });

  it('should support searching a page by phone value with partial match', async () => {
    const { data: searchResults } = await searchDatabase({
      databaseId: database.id,
      spaceId: space.id,
      paginatedQuery: {
        query: {
          properties: {
            [boardSchema.phone.name]: (pageWithMatchingPhoneValue.properties[boardSchema.phone.name] as string).slice(
              0,
              5
            )
          }
        }
      }
    });

    expect(searchResults).toHaveLength(1);
    expect(searchResults[0].id).toBe(pageWithMatchingPhoneValue.id);
  });

  it('should support searching a page by url value with partial match', async () => {
    const { data: searchResults } = await searchDatabase({
      databaseId: database.id,
      spaceId: space.id,
      paginatedQuery: {
        query: {
          properties: {
            [boardSchema.url.name]: (pageWithMatchingUrlValue.properties[boardSchema.url.name] as string).slice(0, 5)
          }
        }
      }
    });

    expect(searchResults).toHaveLength(1);
    expect(searchResults[0].id).toBe(pageWithMatchingUrlValue.id);
  });

  it('should support searching a page by person value', async () => {
    const { data: searchResults } = await searchDatabase({
      databaseId: database.id,
      spaceId: space.id,
      paginatedQuery: {
        query: {
          properties: {
            [boardSchema.person.name]: [user.id]
          }
        }
      }
    });

    expect(searchResults).toHaveLength(2);
    expect(searchResults.some((p) => p.id === pageWithMatchingPersonValue.id)).toBe(true);
    expect(searchResults.some((p) => p.id === pageWithTwoMatchingPersonValues.id)).toBe(true);
  });

  it('should support searching a page by person value, and handle multiple people as an AND query', async () => {
    const { data: searchResults } = await searchDatabase({
      databaseId: database.id,
      spaceId: space.id,
      paginatedQuery: {
        query: {
          properties: {
            [boardSchema.person.name]: [user.id, secondUser.id]
          }
        }
      }
    });

    expect(searchResults).toHaveLength(1);
    expect(searchResults[0].id).toBe(pageWithTwoMatchingPersonValues.id);

    // Quick test to ensure ordering does not matter
    const { data: switchedSearchResults } = await searchDatabase({
      databaseId: database.id,
      spaceId: space.id,
      paginatedQuery: {
        query: {
          properties: {
            [boardSchema.person.name]: [secondUser.id, user.id]
          }
        }
      }
    });

    expect(switchedSearchResults).toHaveLength(1);
    expect(switchedSearchResults[0].id).toBe(pageWithTwoMatchingPersonValues.id);
  });

  it('should support empty queries', async () => {
    const { data: searchResults } = await searchDatabase({
      databaseId: database.id,
      spaceId: space.id
    });

    expect(searchResults).toHaveLength(createdPageList.length);
  });

  it('should ignore deleted pages', async () => {
    const { data: searchResults } = await searchDatabase({
      databaseId: database.id,
      spaceId: space.id
    });

    expect(searchResults.every((p) => p.id !== deletedPage.id)).toBe(true);
  });

  it('should support limits and return as many or less records (if none are available) than the limit provided', async () => {
    const { data: searchResults } = await searchDatabase({
      databaseId: database.id,
      spaceId: space.id,
      paginatedQuery: {
        limit: 2
      }
    });
    expect(searchResults).toHaveLength(2);
  });

  it('should support pagination by reading records sequentially from the database, never returning the same record twice', async () => {
    /**
     * Load all created database records
     * @param cursor
     * @param records
     * @returns
     */

    const foundRecords: ApiPage[] = [];

    let cursor: string | undefined;

    // Length * 2 is a hack to let the function logic govern number of reads. We should only stop if we receive hasNext: false
    for (let i = 0; i < createdPageList.length * 2; i++) {
      const searchResults = await searchDatabase({
        databaseId: database.id,
        spaceId: space.id,
        paginatedQuery: {
          cursor,
          limit: 5
        }
      });

      cursor = searchResults.cursor as string;
      foundRecords.push(...searchResults.data);

      if (!searchResults.hasNext) {
        break;
      }
    }

    const recordIds = foundRecords.map((record) => record.id);

    const uniqueIdCount = uniqueValues(recordIds).length;

    expect(foundRecords.length).toBe(uniqueIdCount);
  });
});
