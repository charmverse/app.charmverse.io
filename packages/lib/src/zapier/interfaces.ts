export type FormResponse = {
  question: string;
  answer: string;
};

export type AddFormResponseInput = string | Record<'all_responses', string> | FormResponse[];
