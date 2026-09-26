export interface Credentials {
  apiUrl: string
  idInstance: string
  apiTokenInstance: string
}

export interface Chat {
  id: string
  phone: string
  name: string
  username?: string
  lastMessage?: string
  lastMessageAt?: number
}

export interface ChatMessage {
  id: string
  chatId: string
  text: string
  timestamp: number
  direction: 'incoming' | 'outgoing'
  status?: 'sending' | 'sent' | 'error'
}

export interface IncomingNotification {
  receiptId: number
  body: {
    typeWebhook?: string
    timestamp?: number
    idMessage?: string
    senderData?: {
      chatId?: string
      sender?: string
      chatName?: string
      senderName?: string
      senderPhoneNumber?: number
    }
    messageData?: {
      typeMessage?: string
      textMessageData?: {
        textMessage?: string
      }
    }
  }
}
