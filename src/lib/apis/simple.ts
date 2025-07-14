import { chatCompletion } from './openai';
import { WEBUI_BASE_URL } from '$lib/constants';

export const simpleCompletion = async (
  messages: { role: string; content: string }[],
  model = 'UOM-AI'
): Promise<string> => {
  const [res] = await chatCompletion('', { model, stream: false, messages }, `${WEBUI_BASE_URL}/api`);
  if (!res || !res.ok) {
    throw new Error('Request failed');
  }
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? '';
};

