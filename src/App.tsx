import {
  type FormEvent,
  type KeyboardEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import {
  checkAccount,
  deleteNotification,
  getNotificationText,
  getState,
  GreenApiError,
  normalizePhone,
  receiveNotification,
  sendMessage,
} from './api/greenApi'
import type { Chat, ChatMessage, Credentials } from './types'

const DEFAULT_API_URL = 'https://api.green-api.com'

function PaperPlaneIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M21.7 2.3a1 1 0 0 0-1-.24L2.8 8.9a1 1 0 0 0 .08 1.9l7.02 2.34 2.34 7.02a1 1 0 0 0 .9.69h.05a1 1 0 0 0 .91-.6l7.85-16.9a1 1 0 0 0-.25-1.05ZM5.97 9.88l12.1-4.63-7.16 5.96-4.94-1.33Zm7.3 7.27-1.3-3.9 6-5-4.7 8.9Z" />
    </svg>
  )
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M11 5a1 1 0 1 1 2 0v6h6a1 1 0 1 1 0 2h-6v6a1 1 0 1 1-2 0v-6H5a1 1 0 1 1 0-2h6V5Z" />
    </svg>
  )
}

function LogoutIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M10 4a1 1 0 0 0 0-2H5a3 3 0 0 0-3 3v14a3 3 0 0 0 3 3h5a1 1 0 1 0 0-2H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h5Zm11.7 7.3-4-4a1 1 0 0 0-1.4 1.4l2.29 2.3H9a1 1 0 1 0 0 2h9.59l-2.3 2.3a1 1 0 0 0 1.42 1.4l4-4a1 1 0 0 0 0-1.4Z" />
    </svg>
  )
}

function ArrowLeftIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M20 11H7.83l5.59-5.59A1 1 0 0 0 12 4l-7.3 7.3a1 1 0 0 0 0 1.4L12 20a1 1 0 0 0 1.41-1.41L7.83 13H20a1 1 0 1 0 0-2Z" />
    </svg>
  )
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/)
  return parts
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
}

function formatPhone(phone: string): string {
  return phone.startsWith('+') ? phone : `+${phone}`
}

function formatTime(timestamp?: number): string {
  if (!timestamp) return ''
  return new Intl.DateTimeFormat('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(timestamp * 1000))
}

function messageFromError(error: unknown): string {
  if (error instanceof GreenApiError || error instanceof Error) {
    return error.message
  }
  return 'Произошла неизвестная ошибка.'
}

interface LoginScreenProps {
  onConnect: (credentials: Credentials) => Promise<void>
}

function LoginScreen({ onConnect }: LoginScreenProps) {
  const [apiUrl, setApiUrl] = useState(DEFAULT_API_URL)
  const [idInstance, setIdInstance] = useState('')
  const [apiTokenInstance, setApiTokenInstance] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError('')

    if (!/^\d+$/.test(idInstance.trim())) {
      setError('idInstance должен содержать только цифры.')
      return
    }

    try {
      const url = new URL(apiUrl.trim())
      if (!['http:', 'https:'].includes(url.protocol)) throw new Error()
    } catch {
      setError('Укажите корректный API URL из личного кабинета.')
      return
    }

    setLoading(true)
    try {
      await onConnect({ apiUrl, idInstance, apiTokenInstance })
    } catch (connectError) {
      setError(messageFromError(connectError))
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="login-page">
      <div className="login-glow login-glow-one" />
      <div className="login-glow login-glow-two" />
      <section className="login-card">
        <div className="brand-mark" aria-hidden="true">
          <PaperPlaneIcon />
        </div>
        <p className="eyebrow">GREEN-API</p>
        <h1>Telegram Chat</h1>
        <p className="login-description">
          Введите параметры вашего Telegram-инстанса, чтобы начать общение.
        </p>

        <form onSubmit={handleSubmit} className="login-form">
          <label>
            <span>API URL</span>
            <input
              value={apiUrl}
              onChange={(event) => setApiUrl(event.target.value)}
              placeholder={DEFAULT_API_URL}
              autoComplete="url"
              required
            />
          </label>
          <label>
            <span>idInstance</span>
            <input
              value={idInstance}
              onChange={(event) => setIdInstance(event.target.value)}
              placeholder="4100000000"
              inputMode="numeric"
              autoComplete="username"
              required
            />
          </label>
          <label>
            <span>apiTokenInstance</span>
            <input
              value={apiTokenInstance}
              onChange={(event) => setApiTokenInstance(event.target.value)}
              placeholder="Введите токен"
              type="password"
              autoComplete="current-password"
              required
            />
          </label>

          {error && <div className="form-error">{error}</div>}

          <button className="primary-button" type="submit" disabled={loading}>
            {loading ? <span className="spinner" /> : <PaperPlaneIcon />}
            {loading ? 'Подключаемся…' : 'Войти в чат'}
          </button>
        </form>

        <p className="privacy-note">
          Данные используются только для запросов к GREEN-API и не сохраняются.
        </p>
      </section>
    </main>
  )
}

interface NewChatFormProps {
  onCreate: (phone: string) => Promise<void>
  onClose: () => void
}

function NewChatForm({ onCreate, onClose }: NewChatFormProps) {
  const [phone, setPhone] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const normalized = normalizePhone(phone)
    if (normalized.length < 7 || normalized.length > 15) {
      setError('Введите номер в международном формате.')
      return
    }

    setLoading(true)
    setError('')
    try {
      await onCreate(normalized)
      onClose()
    } catch (createError) {
      setError(messageFromError(createError))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <section
        className="modal-card"
        onMouseDown={(event) => event.stopPropagation()}
        aria-modal="true"
        role="dialog"
        aria-labelledby="new-chat-title"
      >
        <div className="modal-icon">
          <PlusIcon />
        </div>
        <h2 id="new-chat-title">Новый чат</h2>
        <p>Укажите номер телефона, привязанный к Telegram.</p>
        <form onSubmit={handleSubmit}>
          <label>
            <span>Номер телефона</span>
            <input
              autoFocus
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="+7 999 123-45-67"
              inputMode="tel"
              required
            />
          </label>
          {error && <div className="form-error">{error}</div>}
          <div className="modal-actions">
            <button type="button" className="text-button" onClick={onClose}>
              Отмена
            </button>
            <button type="submit" className="primary-button" disabled={loading}>
              {loading ? <span className="spinner" /> : null}
              {loading ? 'Проверяем…' : 'Создать чат'}
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}

interface ChatViewProps {
  credentials: Credentials
  onLogout: () => void
}

function ChatView({ credentials, onLogout }: ChatViewProps) {
  const [chats, setChats] = useState<Chat[]>([])
  const [messages, setMessages] = useState<Record<string, ChatMessage[]>>({})
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null)
  const [newChatOpen, setNewChatOpen] = useState(false)
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const [syncError, setSyncError] = useState('')
  const [polling, setPolling] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const selectedChat = useMemo(
    () => chats.find((chat) => chat.id === selectedChatId) || null,
    [chats, selectedChatId],
  )
  const selectedMessages = selectedChatId ? messages[selectedChatId] || [] : []

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [selectedMessages.length, selectedChatId])

  useEffect(() => {
    const controller = new AbortController()
    let active = true

    async function poll() {
      while (active) {
        try {
          const notification = await receiveNotification(
            credentials,
            controller.signal,
          )
          if (!notification) continue

          const text = getNotificationText(notification)
          const chatId = notification.body.senderData?.chatId

          if (text && chatId) {
            const timestamp = notification.body.timestamp || Date.now() / 1000
            const sender = notification.body.senderData
            const phone = sender?.senderPhoneNumber
              ? String(sender.senderPhoneNumber)
              : chatId
            const name =
              sender?.chatName || sender?.senderName || formatPhone(phone)

            setChats((current) => {
              const existing = current.find((chat) => chat.id === chatId)
              const updated: Chat = {
                id: chatId,
                phone: existing?.phone || phone,
                name: existing?.name || name,
                username: existing?.username,
                lastMessage: text,
                lastMessageAt: timestamp,
              }
              return [updated, ...current.filter((chat) => chat.id !== chatId)]
            })

            setMessages((current) => {
              const chatMessages = current[chatId] || []
              const id = notification.body.idMessage || `${timestamp}-${text}`
              if (chatMessages.some((message) => message.id === id)) return current
              return {
                ...current,
                [chatId]: [
                  ...chatMessages,
                  {
                    id,
                    chatId,
                    text,
                    timestamp,
                    direction: 'incoming',
                  },
                ],
              }
            })
          }

          await deleteNotification(credentials, notification.receiptId)
          setSyncError('')
          setPolling(true)
        } catch (error) {
          if (!active || (error instanceof DOMException && error.name === 'AbortError')) {
            return
          }
          setPolling(false)
          setSyncError(messageFromError(error))
          await new Promise((resolve) => window.setTimeout(resolve, 2500))
        }
      }
    }

    void poll()
    return () => {
      active = false
      controller.abort()
    }
  }, [credentials])

  async function createChat(phone: string) {
    const account = await checkAccount(credentials, phone)
    const name = account.username || formatPhone(account.phone)
    const chat: Chat = {
      id: account.chatId,
      phone: account.phone,
      name,
      username: account.username,
    }

    setChats((current) => [
      chat,
      ...current.filter((item) => item.id !== chat.id),
    ])
    setSelectedChatId(chat.id)
  }

  async function handleSend(event?: FormEvent) {
    event?.preventDefault()
    const text = draft.trim()
    if (!selectedChat || !text || sending) return

    const temporaryId = `local-${Date.now()}`
    const timestamp = Date.now() / 1000
    const optimisticMessage: ChatMessage = {
      id: temporaryId,
      chatId: selectedChat.id,
      text,
      timestamp,
      direction: 'outgoing',
      status: 'sending',
    }

    setDraft('')
    setSending(true)
    setSyncError('')
    setMessages((current) => ({
      ...current,
      [selectedChat.id]: [
        ...(current[selectedChat.id] || []),
        optimisticMessage,
      ],
    }))

    try {
      const result = await sendMessage(credentials, selectedChat.id, text)
      setMessages((current) => ({
        ...current,
        [selectedChat.id]: (current[selectedChat.id] || []).map((message) =>
          message.id === temporaryId
            ? { ...message, id: result.idMessage, status: 'sent' }
            : message,
        ),
      }))
      setChats((current) => [
        {
          ...selectedChat,
          lastMessage: text,
          lastMessageAt: timestamp,
        },
        ...current.filter((chat) => chat.id !== selectedChat.id),
      ])
    } catch (error) {
      setMessages((current) => ({
        ...current,
        [selectedChat.id]: (current[selectedChat.id] || []).map((message) =>
          message.id === temporaryId
            ? { ...message, status: 'error' }
            : message,
        ),
      }))
      setSyncError(messageFromError(error))
    } finally {
      setSending(false)
    }
  }

  function handleComposerKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      void handleSend()
    }
  }

  return (
    <main className={`app-shell ${selectedChat ? 'chat-is-open' : ''}`}>
      <aside className="sidebar">
        <header className="sidebar-header">
          <div className="sidebar-brand">
            <span className="sidebar-brand-icon">
              <PaperPlaneIcon />
            </span>
            <div>
              <strong>Telegram</strong>
              <span>GREEN-API</span>
            </div>
          </div>
          <button className="icon-button" onClick={onLogout} title="Выйти">
            <LogoutIcon />
          </button>
        </header>

        <div className="connection-row">
          <span className={`status-dot ${polling ? '' : 'status-dot-error'}`} />
          {polling ? 'Подключено' : 'Переподключение…'}
          <span className="instance-id">#{credentials.idInstance}</span>
        </div>

        <button className="new-chat-button" onClick={() => setNewChatOpen(true)}>
          <PlusIcon />
          Новый чат
        </button>

        <div className="chat-list">
          {chats.length === 0 ? (
            <div className="sidebar-empty">
              <span>У вас пока нет чатов</span>
              <p>Создайте чат по номеру телефона</p>
            </div>
          ) : (
            chats.map((chat) => (
              <button
                key={chat.id}
                className={`chat-list-item ${selectedChatId === chat.id ? 'active' : ''}`}
                onClick={() => setSelectedChatId(chat.id)}
              >
                <span className="avatar">{initials(chat.name)}</span>
                <span className="chat-list-copy">
                  <span className="chat-list-topline">
                    <strong>{chat.name}</strong>
                    <time>{formatTime(chat.lastMessageAt)}</time>
                  </span>
                  <span className="chat-preview">
                    {chat.lastMessage || formatPhone(chat.phone)}
                  </span>
                </span>
              </button>
            ))
          )}
        </div>
      </aside>

      <section className="conversation">
        {selectedChat ? (
          <>
            <header className="conversation-header">
              <button
                className="icon-button mobile-back"
                onClick={() => setSelectedChatId(null)}
                aria-label="Назад к чатам"
              >
                <ArrowLeftIcon />
              </button>
              <span className="avatar avatar-small">{initials(selectedChat.name)}</span>
              <div className="conversation-title">
                <strong>{selectedChat.name}</strong>
                <span>{formatPhone(selectedChat.phone)}</span>
              </div>
            </header>

            <div className="messages-area">
              <div className="date-divider"><span>Сегодня</span></div>
              {selectedMessages.length === 0 ? (
                <div className="messages-empty">
                  <div className="empty-plane"><PaperPlaneIcon /></div>
                  <h2>Начните диалог</h2>
                  <p>Отправьте первое сообщение в Telegram</p>
                </div>
              ) : (
                <div className="message-list">
                  {selectedMessages.map((message) => (
                    <div
                      key={message.id}
                      className={`message-row ${message.direction}`}
                    >
                      <div className={`message-bubble ${message.status === 'error' ? 'message-error' : ''}`}>
                        <span className="message-text">{message.text}</span>
                        <span className="message-meta">
                          {formatTime(message.timestamp)}
                          {message.direction === 'outgoing' && (
                            <span className="message-status">
                              {message.status === 'sending'
                                ? '◷'
                                : message.status === 'error'
                                  ? '!'
                                  : '✓✓'}
                            </span>
                          )}
                        </span>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {syncError && <div className="sync-error">{syncError}</div>}

            <form className="composer" onSubmit={handleSend}>
              <textarea
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={handleComposerKeyDown}
                placeholder="Сообщение"
                rows={1}
                maxLength={4096}
                aria-label="Текст сообщения"
              />
              <button
                className="send-button"
                type="submit"
                disabled={!draft.trim() || sending}
                aria-label="Отправить сообщение"
              >
                <PaperPlaneIcon />
              </button>
            </form>
          </>
        ) : (
          <div className="welcome-screen">
            <div className="welcome-illustration">
              <PaperPlaneIcon />
            </div>
            <h1>Telegram Chat</h1>
            <p>Выберите существующий чат или создайте новый</p>
            <button className="primary-button" onClick={() => setNewChatOpen(true)}>
              <PlusIcon />
              Новый чат
            </button>
            {syncError && <div className="sync-error standalone">{syncError}</div>}
          </div>
        )}
      </section>

      {newChatOpen && (
        <NewChatForm
          onCreate={createChat}
          onClose={() => setNewChatOpen(false)}
        />
      )}
    </main>
  )
}

export default function App() {
  const [credentials, setCredentials] = useState<Credentials | null>(null)

  async function connect(nextCredentials: Credentials) {
    const normalizedCredentials: Credentials = {
      apiUrl: nextCredentials.apiUrl.trim().replace(/\/+$/, ''),
      idInstance: nextCredentials.idInstance.trim(),
      apiTokenInstance: nextCredentials.apiTokenInstance.trim(),
    }
    const state = await getState(normalizedCredentials)

    if (state !== 'authorized' && state !== 'suspended') {
      const labels: Record<string, string> = {
        notAuthorized: 'Инстанс не авторизован в Telegram.',
        blocked: 'Telegram-аккаунт заблокирован.',
        starting: 'Инстанс ещё запускается. Попробуйте через несколько минут.',
        pendingPassword: 'Для инстанса требуется пароль двухфакторной аутентификации.',
      }
      throw new GreenApiError(labels[state] || `Инстанс недоступен: ${state}`)
    }

    setCredentials(normalizedCredentials)
  }

  return credentials ? (
    <ChatView credentials={credentials} onLogout={() => setCredentials(null)} />
  ) : (
    <LoginScreen onConnect={connect} />
  )
}
