export const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

export const CHAT_GPT_BASE_URL = 'https://api.openai.com/v1/chat/completions';

export enum chatGPTModels {
  gpt4 = 'gpt-4o',
  gpt3 = 'gpt-3.5-turbo'
}

export type ChatGPTModel = keyof typeof chatGPTModels;
