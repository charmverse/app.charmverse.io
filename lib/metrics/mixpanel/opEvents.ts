import type { IdentityType, PageType } from '@charmverse/core/prisma-client';

import type { BaseEventWithoutGroup } from './interfaces/BaseEvent';
import type { StaticPageType } from './interfaces/PageEvent';

interface ClickProposalCreationButtonEvent extends BaseEventWithoutGroup {}

interface SuccessfulApplicationFormOpenEvent extends BaseEventWithoutGroup {}

interface ClickProposalSubmitButtonEvent extends BaseEventWithoutGroup {
  proposalId: string;
}

interface SuccessfulProposalCreationEvent extends BaseEventWithoutGroup {
  proposalId: string;
}

interface ClickSignupEvent extends BaseEventWithoutGroup {
  identityType: IdentityType | null;
}

interface SuccessfulSignupEvent extends BaseEventWithoutGroup {
  identityType: IdentityType | null;
}

export interface ViewOpPageEvent extends BaseEventWithoutGroup {
  path?: string;
  type: PageType | 'post' | StaticPageType;
}

export type MixpanelOpEventMap = {
  click_proposal_creation_button: ClickProposalCreationButtonEvent;
  successful_application_form_open: SuccessfulApplicationFormOpenEvent;
  click_proposal_submit_button: ClickProposalSubmitButtonEvent;
  successful_proposal_creation: SuccessfulProposalCreationEvent;
  page_view: ViewOpPageEvent;
  click_signup: ClickSignupEvent;
  successful_signup: SuccessfulSignupEvent;
};

export type MixpanelOpEvent = MixpanelOpEventMap[keyof MixpanelOpEventMap];
export type MixpanelOpEventName = keyof MixpanelOpEventMap;
