import type { PageType } from '@charmverse/core/prisma-client';

import type { BaseEventWithoutGroup } from './interfaces/BaseEvent';
import type { StaticPageType } from './interfaces/PageEvent';

interface ProposalCreateButtonClickEvent extends BaseEventWithoutGroup {}

interface ApplicationOpenFormEvent extends BaseEventWithoutGroup {}

interface ProposalSubmitButtonClickEvent extends BaseEventWithoutGroup {
  proposalId: string;
}

interface PublishProposalEvent extends BaseEventWithoutGroup {
  proposalId: string;
}

export interface ViewOpPageEvent extends BaseEventWithoutGroup {
  path?: string;
  type: PageType | 'post' | StaticPageType;
}

export type MixpanelOpEventMap = {
  create_proposal_button_click: ProposalCreateButtonClickEvent;
  open_application_form: ApplicationOpenFormEvent;
  submit_proposal_button_click: ProposalSubmitButtonClickEvent;
  publish_proposal: PublishProposalEvent;
  page_view: ViewOpPageEvent;
};

export type MixpanelOpEvent = MixpanelOpEventMap[keyof MixpanelOpEventMap];
export type MixpanelOpEventName = keyof MixpanelOpEventMap;
