import type { BaseEvent } from './interfaces/BaseEvent';

interface ProposalCreateButtonClickEvent extends BaseEvent {
  spaceId: string;
}

export type MixpanelOpEventMap = {
  create_proposal_button_click: ProposalCreateButtonClickEvent;
};

export type MixpanelOpEvent = MixpanelOpEventMap[keyof MixpanelOpEventMap];
export type MixpanelOpEventName = keyof MixpanelOpEventMap;
