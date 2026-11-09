import type { AnswerResponse } from '../types/answer'

const MOCK_LATENCY_MS = 1600

export const mockAnswerResponse: AnswerResponse = {
  content: '',
}

export async function requestAnswer(
  prompt: string,
  signal?: AbortSignal,
): Promise<AnswerResponse> {
  await delay(MOCK_LATENCY_MS, signal)

  return {
    content: resolveMockContent(prompt),
  }
}

function resolveMockContent(prompt: string): string {
  if (mockAnswerResponse.content.trim().length > 0) {
    return mockAnswerResponse.content
  }

  return `Mock response: ${prompt.trim()}`
}

function delay(milliseconds: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException('The answer request was cancelled.', 'AbortError'))
      return
    }

    const timeoutId = window.setTimeout(resolve, milliseconds)

    signal?.addEventListener(
      'abort',
      () => {
        window.clearTimeout(timeoutId)
        reject(new DOMException('The answer request was cancelled.', 'AbortError'))
      },
      { once: true },
    )
  })
}
