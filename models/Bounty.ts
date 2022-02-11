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
