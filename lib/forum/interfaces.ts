export type ForumPostContent = {
  type: 'text' | 'image';
  content: string;
};

export type ForumPost = {
  id: string;
  title: string;
  content: ForumPostContent;
  userId: string;
  upVotes: number;
  downVotes: number;
  commentsNumber: number;
  updatedAt: Date;
  createdAt: Date;
};
