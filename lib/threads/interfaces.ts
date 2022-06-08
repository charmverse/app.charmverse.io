
export enum ThreadStatus {
  open,
  closed
}

export type ThreadStatusType = keyof typeof ThreadStatus

export interface ThreadStatusUpdate {
  id: string;
  status: ThreadStatusType
}
