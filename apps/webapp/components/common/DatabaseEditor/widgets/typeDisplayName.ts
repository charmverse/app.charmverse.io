import type { PropertyType } from '@packages/databases/board';
import { Utils } from '@packages/databases/utils';
import type { IntlShape } from 'react-intl';

export function typeDisplayName(intl: IntlShape, type: PropertyType): string {
  switch (type) {
    case 'text':
      return intl.formatMessage({ id: 'PropertyType.Text', defaultMessage: 'Text' });
    case 'number':
      return intl.formatMessage({ id: 'PropertyType.Number', defaultMessage: 'Number' });
    case 'select':
      return intl.formatMessage({ id: 'PropertyType.Select', defaultMessage: 'Select' });
    case 'multiSelect':
      return intl.formatMessage({ id: 'PropertyType.MultiSelect', defaultMessage: 'Multi Select' });
    case 'person':
      return intl.formatMessage({ id: 'PropertyType.Person', defaultMessage: 'Person' });
    case 'file':
      return intl.formatMessage({ id: 'PropertyType.File', defaultMessage: 'File or Media' });
    case 'checkbox':
      return intl.formatMessage({ id: 'PropertyType.Toggle', defaultMessage: 'Checkbox' });
    case 'url':
      return intl.formatMessage({ id: 'PropertyType.URL', defaultMessage: 'URL' });
    case 'email':
      return intl.formatMessage({ id: 'PropertyType.Email', defaultMessage: 'Email' });
    case 'phone':
      return intl.formatMessage({ id: 'PropertyType.Phone', defaultMessage: 'Phone' });
    case 'createdTime':
      return intl.formatMessage({ id: 'PropertyType.CreatedTime', defaultMessage: 'Created time' });
    case 'createdBy':
      return intl.formatMessage({ id: 'PropertyType.CreatedBy', defaultMessage: 'Created by' });
    case 'updatedTime':
      return intl.formatMessage({ id: 'PropertyType.UpdatedTime', defaultMessage: 'Last updated time' });
    case 'updatedBy':
      return intl.formatMessage({ id: 'PropertyType.UpdatedBy', defaultMessage: 'Last updated by' });
    case 'date':
      return intl.formatMessage({ id: 'PropertyType.Date', defaultMessage: 'Date' });
    case 'proposalUrl':
      return intl.formatMessage({ id: 'PropertyType.ProposalUrl', defaultMessage: 'Proposal Url' });
    case 'proposalStatus':
      return intl.formatMessage({ id: 'PropertyType.ProposalStatus', defaultMessage: 'Proposal Status' });
    case 'relation':
      return intl.formatMessage({ id: 'PropertyType.Relation', defaultMessage: 'Relation' });
    case 'proposalEvaluationAverage':
      return intl.formatMessage({
        id: 'PropertyType.ProposalEvaluationAverage',
        defaultMessage: 'Proposal Evaluation Average'
      });
    case 'proposalPublishedAt':
      return intl.formatMessage({ id: 'PropertyType.ProposalPublishedAt', defaultMessage: 'Proposal Published At' });
    case 'proposalEvaluationDueDate':
      return intl.formatMessage({
        id: 'PropertyType.ProposalEvaluationDueDate',
        defaultMessage: 'Proposal Evaluation Due Date'
      });
    case 'proposalEvaluationReviewerAverage': {
      return intl.formatMessage({
        id: 'PropertyType.ProposalEvaluationReviewerAverage',
        defaultMessage: 'Proposal Evaluation Reviewer Average'
      });
    }
    case 'proposalRubricCriteriaTotal':
      return intl.formatMessage({
        id: 'PropertyType.ProposalRubricCriteriaTotal',
        defaultMessage: 'Proposal Rubric Criteria Total'
      });
    case 'proposalRubricCriteriaAverage':
      return intl.formatMessage({
        id: 'PropertyType.ProposalRubricCriteriaAverage',
        defaultMessage: 'Proposal Rubric Criteria Average'
      });
    case 'proposalEvaluationTotal':
      return intl.formatMessage({
        id: 'PropertyType.ProposalEvaluationTotal',
        defaultMessage: 'Proposal Evaluation Total'
      });
    case 'proposalEvaluatedBy':
      return intl.formatMessage({ id: 'PropertyType.ProposalEvaluatedBy', defaultMessage: 'Proposal Evaluated By' });
    default: {
      Utils.assertFailure(`typeDisplayName, unhandled type: ${type}`);
      return type;
    }
  }
}
