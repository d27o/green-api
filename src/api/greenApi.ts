import type { Credentials, IncomingNotification } from '../types'

interface StateResponse {
  stateInstance?: string
}

interface CheckAccountResponse {
  exist?: boolean
  chatId?: string
  username?: string
  phoneNumber?: number
  status?: boolean
  reason?: string
}

interface SendMessageResponse {
  idMessage: string
}

interface ApiErrorBody {
  message?: string
  reason?: string
  error?: string
}

export class GreenApiError extends Error {
  constructor(message: string, public readonly status?: number) {
    super(message)
    this.name = 'GreenApiError'
  }
}

function endpoint(credentials: Credentials, method: string): string {
  const apiUrl = credentials.apiUrl.trim().replace(/\/+$/, '')
  return `${apiUrl}/waInstance${credentials.idInstance.trim()}/${method}/${credentials.apiTokenInstance.trim()}`
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  let response: Response

  try {
    response = await fetch(url, init)
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw error
    }
    throw new GreenApiError(
      'Не удалось связаться с GREEN-API. Проверьте API URL и подключение к интернету.',
    )
  }

  if (!response.ok) {
    let details = ''
    try {
      const body = (await response.json()) as ApiErrorBody
      details = body.message || body.reason || body.error || ''
    } catch {
      details = await response.text().catch(() => '')
    }

    throw new GreenApiError(
      details || `GREEN-API вернул ошибку ${response.status}`,
      response.status,
    )
  }

  if (response.status === 204) {
    return null as T
  }

  const text = await response.text()
  return (text ? JSON.parse(text) : null) as T
}

export function normalizePhone(value: string): string {
  return value.replace(/\D/g, '')
}

export async function getState(credentials: Credentials): Promise<string> {
  const data = await request<StateResponse>(
    endpoint(credentials, 'getStateInstance'),
  )
  return data.stateInstance || 'unknown'
}

export async function checkAccount(
  credentials: Credentials,
  phone: string,
): Promise<{ chatId: string; username?: string; phone: string }> {
  const normalizedPhone = normalizePhone(phone)
  const data = await request<CheckAccountResponse>(
    endpoint(credentials, 'checkAccount'),
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phoneNumber: Number(normalizedPhone) }),
    },
  )

  if (!data.exist || !data.chatId) {
    throw new GreenApiError(
      data.reason ||
        'Telegram-аккаунт с таким номером не найден или номер скрыт настройками приватности.',
    )
  }

  return {
    chatId: data.chatId,
    username: data.username || undefined,
    phone: String(data.phoneNumber || normalizedPhone),
  }
}

export async function sendMessage(
  credentials: Credentials,
  chatId: string,
  message: string,
): Promise<SendMessageResponse> {
  return request<SendMessageResponse>(endpoint(credentials, 'sendMessage'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chatId, message }),
  })
}

export async function receiveNotification(
  credentials: Credentials,
  signal?: AbortSignal,
): Promise<IncomingNotification | null> {
  return request<IncomingNotification | null>(
    `${endpoint(credentials, 'receiveNotification')}?receiveTimeout=5`,
    { signal },
  )
}

export async function deleteNotification(
  credentials: Credentials,
  receiptId: number,
): Promise<void> {
  await request(
    `${endpoint(credentials, 'deleteNotification')}/${receiptId}`,
    { method: 'DELETE' },
  )
}

export function getNotificationText(
  notification: IncomingNotification,
): string | null {
  const { body } = notification
  if (
    body.typeWebhook !== 'incomingMessageReceived' ||
    body.messageData?.typeMessage !== 'textMessage'
  ) {
    return null
  }

  return body.messageData.textMessageData?.textMessage?.trim() || null
}
