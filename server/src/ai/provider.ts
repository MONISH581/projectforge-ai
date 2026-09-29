import { config } from '../config';

export interface AIProvider {
  name: string;
  isAvailable(): boolean;
  generateCompletion(prompt: string, systemPrompt?: string): Promise<string>;
}

export class GeminiProvider implements AIProvider {
  name = 'Gemini';

  isAvailable(): boolean {
    return Boolean(config.ai.geminiKey || (config.ai.provider === 'gemini' && config.ai.apiKey));
  }

  async generateCompletion(prompt: string, systemPrompt?: string): Promise<string> {
    const key = config.ai.geminiKey || config.ai.apiKey;
    if (!key) throw new Error('GEMINI_API_KEY is not configured');

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`;
    const payload = {
      contents: [
        {
          role: 'user',
          parts: [{ text: `${systemPrompt ? systemPrompt + '\n\n' : ''}${prompt}` }]
        }
      ],
      generationConfig: {
        temperature: 0.4,
        maxOutputTokens: 4096,
        responseMimeType: 'application/json'
      }
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Gemini API error (${response.status}): ${errText}`);
    }

    const data = await response.json() as any;
    const candidate = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!candidate) throw new Error('No candidate returned from Gemini');
    return candidate;
  }
}

export class OpenAIProvider implements AIProvider {
  name = 'OpenAI';

  isAvailable(): boolean {
    return Boolean(config.ai.openAiKey || (config.ai.provider === 'openai' && config.ai.apiKey));
  }

  async generateCompletion(prompt: string, systemPrompt?: string): Promise<string> {
    const key = config.ai.openAiKey || config.ai.apiKey;
    if (!key) throw new Error('OPENAI_API_KEY is not configured');

    const messages = [];
    if (systemPrompt) messages.push({ role: 'system', content: systemPrompt });
    messages.push({ role: 'user', content: prompt });

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages,
        temperature: 0.3,
        response_format: { type: 'json_object' }
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`OpenAI API error (${response.status}): ${errText}`);
    }

    const data = await response.json() as any;
    return data.choices?.[0]?.message?.content || '';
  }
}

export class GroqProvider implements AIProvider {
  name = 'Groq';

  isAvailable(): boolean {
    return Boolean(config.ai.groqKey || (config.ai.provider === 'groq' && config.ai.apiKey));
  }

  async generateCompletion(prompt: string, systemPrompt?: string): Promise<string> {
    const key = config.ai.groqKey || config.ai.apiKey;
    if (!key) throw new Error('GROQ_API_KEY is not configured');

    const messages = [];
    if (systemPrompt) messages.push({ role: 'system', content: systemPrompt });
    messages.push({ role: 'user', content: prompt });

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages,
        temperature: 0.3,
        response_format: { type: 'json_object' }
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Groq API error (${response.status}): ${errText}`);
    }

    const data = await response.json() as any;
    return data.choices?.[0]?.message?.content || '';
  }
}
