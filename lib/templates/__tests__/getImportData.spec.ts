import fs from 'node:fs/promises';
import path from 'node:path';

import { InvalidInputError } from '@charmverse/core/errors';
import { type Space } from '@charmverse/core/prisma-client';
import { testUtilsUser } from '@charmverse/core/test';

import type { SpaceDataExport } from '../exportSpaceData';
import { getImportData } from '../getImportData';

describe('getImportData', () => {
  let space: Space;

  let validExportData: SpaceDataExport;

  const validExportName = 'validExport';
  const invalidExportName = 'invalidExport';
  const invalidJsonExportName = 'invalidJsonExport';

  beforeAll(async () => {
    ({ space } = await testUtilsUser.generateUserAndSpace());

    validExportData = {
      posts: [],
      space: {
        features: [],
        memberProfiles: [],
        memberProperties: [],
        notificationToggles: [],
        proposalBlocks: [],
        proposalWorkflows: [],
        rewardBlocks: [],
        defaultPagePermissionGroup: space.defaultPagePermissionGroup,
        defaultPublicPages: space.defaultPublicPages,
        hiddenFeatures: space.hiddenFeatures,
        publicBountyBoard: space.publicBountyBoard,
        publicProposals: space.publicProposals,
        requireProposalTemplate: space.requireProposalTemplate
      },
      pages: [],
      roles: [],
      postCategories: [],
      permissions: {
        spacePermissions: [],
        postCategoryPermissions: []
      }
    };

    // Setup a valid JSON file in the expected directory
    const resolvedValidPath = path.resolve(path.join('lib', 'templates', 'exports', `${validExportName}.json`));
    await fs.writeFile(resolvedValidPath, JSON.stringify(validExportData));

    // Setup an invalid JSON content file
    const resolvedInvalidJsonPath = path.resolve(
      path.join('lib', 'templates', 'exports', `${invalidJsonExportName}.json`)
    );
    await fs.writeFile(resolvedInvalidJsonPath, 'invalid json content');
  });

  it('should return exportData if provided', async () => {
    const data = await getImportData({ exportData: validExportData });
    expect(data).toEqual(validExportData);
  });

  it('should read from a file and parse JSON if exportName is provided', async () => {
    const data = await getImportData({ exportName: validExportName });
    expect(data).toEqual(validExportData);
  });

  it('should throw an InvalidInputError if neither exportData nor exportName is provided', async () => {
    await expect(getImportData({})).rejects.toThrow(InvalidInputError);
  });

  it('should throw an InvalidInputError if provided exportName does not exist', async () => {
    await expect(getImportData({ exportName: invalidExportName })).rejects.toThrowError();
  });

  it('should throw an InvalidInputError if file content is not valid JSON', async () => {
    await expect(getImportData({ exportName: invalidJsonExportName })).rejects.toThrow(SyntaxError); // Assuming SyntaxError for invalid JSON
  });

  afterAll(async () => {
    // Cleanup created files
    const resolvedValidPath = path.resolve(path.join('lib', 'templates', 'exports', `${validExportName}.json`));
    await fs.unlink(resolvedValidPath);

    const resolvedInvalidJsonPath = path.resolve(
      path.join('lib', 'templates', 'exports', `${invalidJsonExportName}.json`)
    );
    await fs.unlink(resolvedInvalidJsonPath);
  });
});
