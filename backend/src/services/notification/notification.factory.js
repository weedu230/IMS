const logger = require('../../utils/logger');

class BaseNotificationChannel {
  constructor(name) {
    this.name = name;
  }

  // eslint-disable-next-line class-methods-use-this
  async send() {
    throw new Error('send() must be implemented by a channel');
  }
}

class EmailChannel extends BaseNotificationChannel {
  constructor() { super('email'); }
  async send(payload) {
    logger.info(`[notification][email] to=${payload.to} subject=${payload.subject} message=${payload.message}`);
    return { channel: this.name, delivered: true };
  }
}

class SmsChannel extends BaseNotificationChannel {
  constructor() { super('sms'); }
  async send(payload) {
    logger.info(`[notification][sms] to=${payload.to} message=${payload.message}`);
    return { channel: this.name, delivered: true };
  }
}

class PushChannel extends BaseNotificationChannel {
  constructor() { super('push'); }
  async send(payload) {
    logger.info(`[notification][push] user=${payload.user_id || payload.to} title=${payload.subject || 'IMS Alert'} message=${payload.message}`);
    return { channel: this.name, delivered: true };
  }
}

class WhatsAppChannel extends BaseNotificationChannel {
  constructor() { super('whatsapp'); }
  async send(payload) {
    logger.info(`[notification][whatsapp] to=${payload.to} message=${payload.message}`);
    return { channel: this.name, delivered: true };
  }
}

const CHANNELS = {
  email: EmailChannel,
  sms: SmsChannel,
  push: PushChannel,
  whatsapp: WhatsAppChannel,
};

const getNotificationChannel = (type) => {
  const Channel = CHANNELS[String(type || '').toLowerCase()];
  if (!Channel) {
    throw new Error(`Unsupported notification channel: ${type}`);
  }
  return new Channel();
};

const listNotificationChannels = () => Object.keys(CHANNELS);

module.exports = { getNotificationChannel, listNotificationChannels };