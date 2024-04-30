import { prisma } from '@charmverse/core/prisma-client';

import type { FormFieldValue, LongTextValue } from 'lib/forms/interfaces';
import type { ProjectField, ProjectMemberField, ProjectMemberFieldConfig, FieldConfig } from 'lib/projects/formField';
import { getFieldConfig, projectMemberFieldProperties, projectFieldProperties } from 'lib/projects/formField';
import { _ } from 'lib/prosemirror/builders';
import { getNodeFromJson } from 'lib/prosemirror/getNodeFromJson';
import type { PageContent } from 'lib/prosemirror/interfaces';
import { generateMarkdown } from 'lib/prosemirror/markdown/generateMarkdown';
import { isTruthy } from 'lib/utils/types';

export async function getPageMarkdown({
  pageId,
  includePrivateFields
}: {
  pageId: string;
  includePrivateFields?: boolean;
}) {
  const page = await prisma.page.findFirstOrThrow({
    where: { id: pageId },
    select: {
      content: true,
      spaceId: true,
      proposal: {
        include: {
          form: {
            include: {
              formFields: true
            }
          },
          formAnswers: true,
          project: {
            include: {
              projectMembers: true
            }
          }
        }
      }
    }
  });
  const spaceRoles = await prisma.spaceRole.findMany({
    where: {
      spaceId: page.spaceId
    },
    include: {
      user: true
    }
  });
  const spaceMembers = spaceRoles.map((role) => role.user);

  // handle proposal forms
  if (page.proposal?.form) {
    const formFields = page.proposal.form.formFields;
    const formAnswers = page.proposal.formAnswers;
    const formAnswersMap = new Map(formAnswers.map((answer) => [answer.fieldId, answer.value]));

    // add form fields to content
    const content = _.doc(
      ...formFields
        .map((field) => {
          if (field.private && !includePrivateFields) {
            return [];
          }
          if (field.type === 'label') {
            return [_.heading({ level: 2 }, field.name), ...(getNodeFromJson(field.description as any).content as any)];
          } else if (field.type === 'project_profile') {
            const fieldConfig = field.fieldConfig as FieldConfig;
            const memberConfig = fieldConfig.projectMember as ProjectMemberFieldConfig;

            const fields: any[] = [_.heading({ level: 3 }, 'Project Profile')];
            projectFieldProperties.forEach((property) => {
              const config = getFieldConfig(fieldConfig[property.field]);
              if (config.show && (!config.private || includePrivateFields)) {
                const answer = page.proposal?.project?.[property.field as ProjectField];
                fields.push(_.bullet_list({ indent: 0 }, _.list_item(_.p(`${property.label}:  ${answer || 'N/A'}`))));
              }
            });

            fields.push(_.bullet_list({ indent: 0 }, _.list_item(_.p('Project Members'))));
            page.proposal?.project?.projectMembers.forEach((member) => {
              fields.push(_.bullet_list({ indent: 1 }, _.list_item(_.p(`Name:  ${member.name}`))));
              projectMemberFieldProperties.forEach((property) => {
                const config = getFieldConfig(memberConfig[property.field]);
                if (config.show && (!config.private || includePrivateFields)) {
                  const answer = member[property.field as ProjectMemberField];
                  fields.push(_.bullet_list({ indent: 2 }, _.list_item(_.p(`${property.label}:  ${answer || 'N/A'}`))));
                }
              });
            });

            return fields;
          }
          const answer = formAnswersMap.get(field.id) as FormFieldValue;
          if (typeof answer === 'string' || typeof answer === 'number') {
            return [_.heading({ level: 3 }, field.name), _.paragraph(answer.toString() || 'N/A')];
          } else if ((answer as LongTextValue)?.content) {
            const contentNode = getNodeFromJson((answer as LongTextValue).content);
            return [_.heading({ level: 3 }, field.name), ...((contentNode.content as any).content || [])];
          }
          return [];
        })
        .flat()
    );
    // console.log(JSON.stringify(content.toJSON(), null, 2));
    return generateMarkdown({
      content: content.toJSON(),
      generatorOptions: {
        members: spaceMembers
      }
    });
  }

  return generateMarkdown({
    content: page.content,
    generatorOptions: {
      members: spaceMembers
    }
  });
}
