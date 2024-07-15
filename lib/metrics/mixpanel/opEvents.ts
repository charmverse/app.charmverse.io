import type { BaseEventWithoutGroup } from './interfaces/BaseEvent';

interface ProposalCreateButtonClickEvent extends BaseEventWithoutGroup {}

interface ApplicationOpenFormEvent extends BaseEventWithoutGroup {}

interface ProposalSubmitButtonClickEvent extends BaseEventWithoutGroup {
  proposalId: string;
}

interface PublishProposalEvent {
  proposalId: string;
}

export type MixpanelOpEventMap = {
  create_proposal_button_click: ProposalCreateButtonClickEvent;
  open_application_form: ApplicationOpenFormEvent;
  submit_proposal_button_click: ProposalSubmitButtonClickEvent;
  publish_proposal: PublishProposalEvent;
};

export type MixpanelOpEvent = MixpanelOpEventMap[keyof MixpanelOpEventMap];
export type MixpanelOpEventName = keyof MixpanelOpEventMap;
