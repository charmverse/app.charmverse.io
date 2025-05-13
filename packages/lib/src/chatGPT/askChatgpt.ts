import { SystemError } from '@charmverse/core/errors';
import { POST } from '@packages/adapters/http';

import type { ChatGPTModel } from './constants';
import { CHAT_GPT_BASE_URL, OPENAI_API_KEY, chatGPTModels } from './constants';

type ChatMessageRole = 'user' | 'assistant' | 'system';

type ChatMessage = {
  content: string;
  role: ChatMessageRole;
};

export class ContextLengthExceededError extends SystemError {
  constructor({ modelName }: { modelName: string }) {
    super({
      message: `The context length exceeded the maximum allowed length for model ${modelName}`,
      errorType: 'External service',
      severity: 'warning'
    });
  }
}

/**
 * @model - Defaults to gpt3
 */
type ChatGptRequest = {
  prompt: string;
  systemPrompt?: string;
  model?: ChatGPTModel;
};

type ChatCompletionResponse = {
  model: string;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  choices: { message: { content: string } }[];
};

export async function askChatGPT({
  prompt,
  model = 'gpt3'
}: ChatGptRequest): Promise<{ answer: string; inputTokens: number; outputTokens: number }> {
  const input: ChatMessage[] = [{ role: 'user', content: prompt }];

  const data = {
    model: chatGPTModels[model],
    messages: input
  };

  try {
    const response = await POST<ChatCompletionResponse>(CHAT_GPT_BASE_URL, data, {
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`
      }
    });

    return {
      answer: response.choices[0].message.content,
      inputTokens: response.usage.prompt_tokens,
      outputTokens: response.usage.completion_tokens
    };
  } catch (err: any) {
    if (err.error.code === 'context_length_exceeded') {
      throw new ContextLengthExceededError({ modelName: model });
    }

    throw err;
  }
}

// askChatGPT({ prompt: 'How are you?', model: 'gpt4' }).then(console.log);
