import { prisma } from '@charmverse/core/prisma-client';
import { getChainById } from '@packages/connectors/chains';
import type {
  ProjectField,
  ProjectMemberField,
  ProjectMemberFieldConfig,
  FieldConfig
} from '@root/lib/projects/formField';
import { getFieldConfig, projectMemberFieldProperties, projectFieldProperties } from '@root/lib/projects/formField';
import type {
  FormFieldValue,
  LongTextValue,
  ProjectFieldValue,
  SelectOptionType
} from '@root/lib/proposals/forms/interfaces';
import type { ProposalFields } from '@root/lib/proposals/interfaces';
import { _ } from '@root/lib/prosemirror/builders';
import { getNodeFromJson } from '@root/lib/prosemirror/getNodeFromJson';
import { generateMarkdown } from '@root/lib/prosemirror/markdown/generateMarkdown';

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
      title: true,
      proposal: {
        include: {
          form: {
            include: {
              formFields: {
                orderBy: {
                  index: 'asc'
                }
              }
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
    const formFieldNodes = formFields
      .map((field) => {
        if (field.private && !includePrivateFields) {
          return [];
        }
        const answer = formAnswersMap.get(field.id) as FormFieldValue;
        if (field.type === 'label') {
          return [
            _.heading({ level: 2 }, field.name),
            ...(field.description ? (getNodeFromJson(field.description).content as any).content : [])
          ];
        } else if (field.type === 'project_profile') {
          const fieldConfig = field.fieldConfig as FieldConfig;
          const memberConfig = fieldConfig.projectMember as ProjectMemberFieldConfig;
          const fields: any[] = [_.heading({ level: 3 }, 'Project Profile')];
          projectFieldProperties.forEach((property) => {
            const config = getFieldConfig(fieldConfig[property.field]);
            if (config.show && (!config.private || includePrivateFields)) {
              fields.push(
                _.bullet_list(
                  { indent: 0 },
                  _.list_item(
                    _.p(`${property.label}: ${page.proposal?.project?.[property.field as ProjectField] || 'N/A'}`)
                  )
                )
              );
            }
          });

          fields.push(_.bullet_list({ indent: 0 }, _.list_item(_.p('Project Members'))));
          const selectedProjectMemberIds = (answer as ProjectFieldValue)?.selectedMemberIds ?? [];
          const selectedProjectMembers =
            page.proposal?.project?.projectMembers.filter(
              (member) => member.teamLead || selectedProjectMemberIds.includes(member.id)
            ) ?? [];
          selectedProjectMembers.forEach((member) => {
            fields.push(_.bullet_list({ indent: 1 }, _.list_item(_.p(member.name))));
            projectMemberFieldProperties.forEach((property) => {
              const config = getFieldConfig(memberConfig[property.field]);
              if (config.show && (!config.private || includePrivateFields)) {
                fields.push(
                  _.bullet_list(
                    { indent: 2 },
                    _.list_item(_.p(`${property.label}: ${member[property.field as ProjectMemberField] || 'N/A'}`))
                  )
                );
              }
            });
          });

          return fields;
        }
        if ((answer as LongTextValue)?.content) {
          const contentNode = getNodeFromJson((answer as LongTextValue).content);
          return [_.heading({ level: 3 }, field.name), ...((contentNode.content as any).content || [])];
        }
        const answerArray = answer && typeof answer === 'string' ? [answer] : Array.isArray(answer) ? answer : [];
        if (field.type === 'person') {
          answerArray.forEach((value, index) => {
            const member = spaceMembers.find((sm) => sm.id === value);
            if (member) {
              answerArray[index] = member.username;
            }
          });
        }
        if (answerArray.length > 0) {
          return [
            _.heading({ level: 3 }, field.name),
            _.p(
              ...answerArray
                .map((value) => {
                  // handle select/multiselect type values
                  const mappedValue = (field.options as SelectOptionType[])?.find(
                    (option) => option.id === value
                  )?.name;
                  return mappedValue || value;
                })
                .join(', ')
            )
          ];
        }
        return [];
      })
      .flat();

    const rewardNodes: any[] = [];
    const proposalFields = page.proposal.fields as ProposalFields;

    if (proposalFields.pendingRewards?.length) {
      rewardNodes.push(_.heading({ level: 3 }, 'Milestones'));
      proposalFields.pendingRewards.forEach((reward) => {
        rewardNodes.push(
          _.bullet_list(
            { indent: 0 },
            _.list_item(
              _.p(
                `${reward.page.title || 'Untitled'}  \n${
                  reward.reward.rewardType === 'token'
                    ? `Token reward: ${reward.reward.rewardAmount} ${reward.reward.rewardToken} on ${
                        getChainById(reward.reward.chainId!)?.chainName || 'Unknown Chain'
                      }`
                    : reward.reward.rewardType === 'custom'
                      ? `Reward: ${reward.reward.customReward}`
                      : ``
                }`
              )
            )
          )
        );
      });
    }

    const content = _.doc(...formFieldNodes, ...rewardNodes);

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
