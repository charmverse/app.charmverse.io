import type { BaseEventWithoutGroup } from './interfaces/BaseEvent';

interface ProposalCreateButtonClickEvent extends BaseEventWithoutGroup {}

interface ApplicationOpenFormEvent extends BaseEventWithoutGroup {}

export type MixpanelOpEventMap = {
  create_proposal_button_click: ProposalCreateButtonClickEvent;
  open_application_form: ApplicationOpenFormEvent;
};

export type MixpanelOpEvent = MixpanelOpEventMap[keyof MixpanelOpEventMap];
export type MixpanelOpEventName = keyof MixpanelOpEventMap;
