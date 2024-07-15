import type { IdentityType, PageType } from '@charmverse/core/prisma-client';

import type { BaseEventWithoutGroup } from './interfaces/BaseEvent';

interface ClickProposalCreationButtonEvent extends BaseEventWithoutGroup {}

interface SuccessfulApplicationFormOpenEvent extends BaseEventWithoutGroup {}

interface ClickProposalSubmitButtonEvent extends BaseEventWithoutGroup {
  proposalId: string;
}

interface SuccessfulProposalCreationEvent extends BaseEventWithoutGroup {
  proposalId: string;
}

interface ClickSignupEvent extends BaseEventWithoutGroup {
  signinMethod: IdentityType | null;
}

interface SuccessfulSignupEvent extends BaseEventWithoutGroup {
  signinMethod: IdentityType | null;
}

interface SuccessfulSigninEvent extends BaseEventWithoutGroup {
  signinMethod: IdentityType | null;
}

interface ClickSigninEvent extends BaseEventWithoutGroup {
  signinMethod: IdentityType | null;
}

export interface ViewOpPageEvent extends BaseEventWithoutGroup {
  path?: string;
  url?: string;
  type: PageType | 'post';
}

export type MixpanelOpEventMap = {
  click_proposal_creation_button: ClickProposalCreationButtonEvent;
  successful_application_form_open: SuccessfulApplicationFormOpenEvent;
  click_proposal_submit_button: ClickProposalSubmitButtonEvent;
  successful_proposal_creation: SuccessfulProposalCreationEvent;
  page_view: ViewOpPageEvent;
  click_signup: ClickSignupEvent;
  successful_signup: SuccessfulSignupEvent;
  successful_signin: SuccessfulSigninEvent;
  click_signin: ClickSigninEvent;
};

export type MixpanelOpEvent = MixpanelOpEventMap[keyof MixpanelOpEventMap];
export type MixpanelOpEventName = keyof MixpanelOpEventMap;
