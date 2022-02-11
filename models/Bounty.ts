export interface ISuggestingBounty {
  title: string;
  content: Object;
  createdAt: Date;
  author: string;
  id: string;
  preview: string;
}

export interface IBountyCard {
  title: string;
  author: string;
  status: 'pending' | 'inprogress' | 'done';
  id: string;
  //
  content: Object;
  type: 'content' | 'social';
  createdAt: Date;
}

export interface IBountyReward {
  reviewer: string;
  assignee: string;
  token: string;
  amount: number;
}

export interface ICreatingBounty {
  title: string;
  discription: Object;
  type: 'content' | 'social';
  reward: IBountyReward;
}

export interface IBountyAction {
  type: string;
  item?: ICreatingBounty;
  itemId?: string;
}
