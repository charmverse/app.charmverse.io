import { prisma } from '@charmverse/core/prisma-client';
import { testUtilsPages } from '@charmverse/core/test';

import { getPageMarkdown } from 'lib/pages/getPageMarkdown';
import type { FieldConfig } from 'lib/projects/formField';
import { projectFieldProperties } from 'lib/projects/formField';
import { getProfectProfileFieldConfigDefaultHidden } from 'testing/mocks/form';
import { jsonDoc, _ } from 'testing/prosemirror/builders';
import { generateUserAndSpace } from 'testing/setupDatabase';

describe('getPageMarkdown', () => {
  it('should get markdown content for a page', async () => {
    const markdownContent = 'markdownContent';

    const { space, user } = await generateUserAndSpace();
    const page = await testUtilsPages.generatePage({
      content: jsonDoc(_.p(markdownContent)),
      spaceId: space.id,
      createdBy: user.id
    });

    const result = await getPageMarkdown({ pageId: page.id });

    expect(result).toEqual(markdownContent);
  });

  it('should get markdown content for a form proposal', async () => {
    const markdownContent = 'markdownContent';

    const { space, user } = await generateUserAndSpace();
    const page = await testUtilsPages.generatePage({
      content: jsonDoc(_.p(markdownContent)),
      spaceId: space.id,
      createdBy: user.id
    });
    // create config where properties are hidden by default
    const fieldConfig: FieldConfig = { projectMember: {} };
    projectFieldProperties.forEach((property) => {
      fieldConfig[property.field]!.show = false;
    });
    projectFieldProperties.forEach((property) => {
      fieldConfig[property.field]!.show = false;
    });

    const form = await prisma.form.create({
      data: {
        formFields: {
          createMany: {
            data: [
              {
                name: 'Email',
                type: 'email'
              },
              {
                name: 'Short Text',
                type: 'short_text'
              },
              {
                name: 'Long Text',
                type: 'long_text'
              },
              {
                name: 'Project Profile',
                type: 'project_profile',
                fieldConfig: getProfectProfileFieldConfigDefaultHidden()
              }
            ]
          }
        }
      },
      include: {
        formFields: true
      }
    });

    const result = await getPageMarkdown({ pageId: page.id });

    expect(result).toEqual(markdownContent);
  });
});
