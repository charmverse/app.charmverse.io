import { prisma } from '@charmverse/core/prisma-client';
import { testUtilsPages, testUtilsProposals } from '@charmverse/core/test';

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
    const proposal = await testUtilsProposals.generateProposal({
      spaceId: space.id,
      userId: user.id
    });
    const page = await testUtilsPages.generatePage({
      content: jsonDoc(_.p(markdownContent)),
      spaceId: space.id,
      createdBy: user.id,
      type: 'proposal',
      proposalId: proposal.id
    });

    const form = await prisma.form.create({
      data: {
        proposal: {
          connect: {
            id: proposal.id
          }
        },
        formFields: {
          createMany: {
            data: [
              {
                index: 0,
                name: 'Email',
                type: 'email'
              },
              {
                index: 1,
                name: 'Short Text',
                type: 'short_text'
              },
              {
                index: 2,
                name: 'Long Text',
                type: 'long_text'
              },
              {
                index: 3,
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

    await prisma.proposal.update({
      where: {
        id: proposal.id
      },
      data: {
        formId: form.id
      }
    });

    await prisma.formFieldAnswer.createMany({
      data: [
        {
          fieldId: form.formFields[0].id,
          value: 'safwan@gmail.com',
          proposalId: proposal.id,
          type: 'email'
        },
        {
          fieldId: form.formFields[1].id,
          value: 'short text',
          proposalId: proposal.id,
          type: 'short_text'
        },
        {
          fieldId: form.formFields[2].id,
          value: { contentText: '', content: jsonDoc(_.p('long text')) },
          proposalId: proposal.id,
          type: 'long_text'
        }
      ]
    });

    const result = await getPageMarkdown({ pageId: page.id });

    expect(result).toEqual(
      `
### Email

safwan@gmail.com

### Short Text

short text

### Long Text

long text

### Project Profile
`.trim()
    );
  });
});
