import { policyConvertedToProposal } from './policyConvertedToProposal';
import { policyDraftPost } from './policyDraftPost';
import { policyOnlyEditableByAuthor } from './policyOnlyEditableByAuthor';

export const defaultPostPolicies = [policyOnlyEditableByAuthor, policyDraftPost, policyConvertedToProposal];

export * from './interfaces';
export * from './resolver';
