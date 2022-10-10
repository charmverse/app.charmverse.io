export interface BaseEvent {
  userId: string;
  // Prop for even groups - set in mixpanel as Wrokspace Id
  spaceId: string;
}

export interface BaseEventWithoutGroup {
  userId: string;
}
