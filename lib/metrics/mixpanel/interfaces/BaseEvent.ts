export interface BaseEvent {
  userId: string;
  // Prop for event groups - set in mixpanel as Wrokspace Id
  spaceId: string;
}

export interface BaseEventWithoutGroup {
  userId: string;
}
