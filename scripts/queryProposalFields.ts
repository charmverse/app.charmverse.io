import { prisma } from '@charmverse/core/prisma-client';
import { getYupValidationSchema, getFormFieldMap } from 'components/common/form/hooks/formFieldSchema';

import type { SelectOptionType } from 'components/common/form/fields/Select/interfaces';
/**
 * Use this script to perform database searches.
 */

// {
//   id: 'dd047716-9512-447a-b9fd-79bfe8ccb280',
//   name: 'Greenpill Network'
// }

async function search() {
  const proposals = await prisma.proposal.findMany({
    where: {
      page: {
        deletedAt: null,
        sourceTemplateId: 'a1797480-7862-46c9-8a9c-6c7f6de7dba6'
      }
      // status: 'draft'
    },
    select: {
      id: true,
      form: {
        select: {
          formFields: true
        }
      },
      formAnswers: true,
      page: {
        select: {
          sourceTemplateId: true
        }
      }
    }
  });

  const updates: { answerId: string; value: string }[] = [];
  let proposalsToFix = {};
  let proposalsWithError = {};
  let fieldsWithErrors = {};
  console.log('questions', proposals[0].form?.formFields);
  for (const proposal of proposals) {
    const formAnswers =
      proposal.form?.formFields.map((formField) => {
        const proposalFormFieldAnswer = proposal.formAnswers.find((answer) => answer.fieldId === formField.id);
        let value = proposalFormFieldAnswer?.value;
        if (formField.type === 'select' && Array.isArray(value)) {
          value = value.filter((v) => formField.options?.some((o) => o.id === v))[0];
          console.log('fix answer for form field', formField.name, formField.type, value);
          updates.push({
            value,
            answerId: proposalFormFieldAnswer!.id
          });
          proposalsToFix[proposal.id] = true;
        }
        return {
          formFieldId: formField.id,
          // ...formField,
          //formFieldAnswer: proposalFormFieldAnswer,
          value
          // options: (formField.options ?? []) as SelectOptionType[]
        };
      }) || [];
    const schema = getYupValidationSchema(proposal.form?.formFields || []);
    const answers = getFormFieldMap(proposal.form?.formFields || []);
    for (const answer of formAnswers) {
      answers[answer.formFieldId] = answer.value!;
    }
    try {
      //console.log('answers', answers);
      const r = schema.validateSync(answers);
      // console.log(r);
    } catch (error) {
      if (answers[error.path]) {
        proposalsWithError[proposal.id] = true;
        fieldsWithErrors[error.path] = fieldsWithErrors[error.path] || 0;
        fieldsWithErrors[error.path]++;
        //console.error('found error', proposal.id, error);
      }
    }
  }
  console.log(updates.length);
  console.log(Object.keys(proposalsToFix).length);
  console.log('p with errror', Object.keys(proposalsWithError).length);
  console.log('proposals', proposals.length);
  console.log('fields', fieldsWithErrors);
  // for (const update of updates) {
  //   await prisma.formFieldAnswer.update({
  //     where: {
  //       id: update.answerId
  //     },
  //     data: {
  //       value: update.value,
  //       type: 'select'
  //     }
  //   });
  // }
  // console.log('templateid ', proposal?.page.sourceTemplateId);
  // const schema = getYupValidationSchema(getFormFieldMap(formFields));
}

search().then(() => console.log('Done'));
