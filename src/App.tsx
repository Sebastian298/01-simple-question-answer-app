import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import { TypingIndicator } from './components/TypingIndicator'
import { requestAnswer } from './services/answerService'
import './App.css'

type ChatRole = 'user' | 'assistant'

interface ChatMessage {
  id: string
  role: ChatRole
  content: string
}

function App() {
  const [draft, setDraft] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isWaiting, setIsWaiting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const conversationEndRef = useRef<HTMLDivElement | null>(null)

  const canGenerate = draft.trim().length > 0 && !isWaiting
  const canClear = messages.length > 0 || isWaiting || errorMessage !== null

  useEffect(() => {
    conversationEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [messages, isWaiting, errorMessage])

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort()
    }
  }, [])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const prompt = draft.trim()
    if (!prompt || isWaiting) {
      return
    }

    abortControllerRef.current?.abort()
    const controller = new AbortController()
    abortControllerRef.current = controller

    setMessages((current) => [
      ...current,
      { id: crypto.randomUUID(), role: 'user', content: prompt },
    ])
    setDraft('')
    setErrorMessage(null)
    setIsWaiting(true)

    try {
      const response = await requestAnswer(prompt, controller.signal)
      if (controller.signal.aborted) {
        return
      }

      setMessages((current) => [
        ...current,
        { id: crypto.randomUUID(), role: 'assistant', content: response.content },
      ])
    } catch (error: unknown) {
      if (controller.signal.aborted || isAbortError(error)) {
        return
      }

      setErrorMessage('The answer could not be loaded. Try again.')
    } finally {
      if (!controller.signal.aborted) {
        setIsWaiting(false)
      }
    }
  }

  function handleClearConversation() {
    abortControllerRef.current?.abort()
    abortControllerRef.current = null
    setMessages([])
    setIsWaiting(false)
    setErrorMessage(null)
  }

  function handleDraftKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      event.currentTarget.form?.requestSubmit()
    }
  }

  return (
    <main className="demo">
      <form className="composer" onSubmit={handleSubmit}>
        <label htmlFor="prompt">You:</label>
        <textarea
          id="prompt"
          name="prompt"
          rows={1}
          value={draft}
          placeholder="Write a question or any sentence"
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={handleDraftKeyDown}
        />
        <div className="actions">
          <button type="submit" disabled={!canGenerate}>
            Generate
          </button>
          <button type="button" onClick={handleClearConversation} disabled={!canClear}>
            Clear conversation
          </button>
        </div>
      </form>

      <section className="conversation" aria-live="polite" aria-label="Conversation">
        {messages.map((message) => (
          <article key={message.id} className={`message message-${message.role}`}>
            <p className="message-label">{message.role === 'user' ? 'You:' : 'AI:'}</p>
            <p className="message-content">{message.content}</p>
          </article>
        ))}

        {isWaiting && (
          <article className="message message-assistant">
            <p className="message-label">AI:</p>
            <TypingIndicator />
          </article>
        )}

        {errorMessage && (
          <p className="conversation-error" role="alert">
            {errorMessage}
          </p>
        )}

        <div ref={conversationEndRef} />
      </section>
    </main>
  )
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError'
}

export default App
