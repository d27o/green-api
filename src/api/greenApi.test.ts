import { describe, expect, it } from 'vitest'
import { getNotificationText, normalizePhone } from './greenApi'
import type { IncomingNotification } from '../types'

describe('normalizePhone', () => {
  it('keeps only digits', () => {
    expect(normalizePhone('+7 (999) 123-45-67')).toBe('79991234567')
  })
})

describe('getNotificationText', () => {
  it('extracts an incoming text message', () => {
    const notification: IncomingNotification = {
      receiptId: 1,
      body: {
        typeWebhook: 'incomingMessageReceived',
        messageData: {
          typeMessage: 'textMessage',
          textMessageData: { textMessage: '  Привет!  ' },
        },
      },
    }

    expect(getNotificationText(notification)).toBe('Привет!')
  })

  it('ignores non-text notifications', () => {
    const notification: IncomingNotification = {
      receiptId: 2,
      body: {
        typeWebhook: 'outgoingMessageStatus',
      },
    }

    expect(getNotificationText(notification)).toBeNull()
  })
})
