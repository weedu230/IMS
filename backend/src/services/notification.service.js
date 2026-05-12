const { Employee } = require('../models');
const { getNotificationChannel, listNotificationChannels } = require('./notification/notification.factory');

class NotificationService {
  constructor() {
    this.enabledChannels = (process.env.NOTIFICATION_CHANNELS || 'email,push')
      .split(',')
      .map((channel) => channel.trim().toLowerCase())
      .filter(Boolean);
  }

  async getAdminRecipients() {
    const admins = await Employee.findAll({
      where: { role: 'admin', is_active: true },
      attributes: ['emp_id', 'name', 'email', 'role'],
    });

    return admins.map((admin) => ({
      emp_id: admin.emp_id,
      name: admin.name,
      email: admin.email,
      role: admin.role,
    }));
  }

  async notifyAdmins(eventType, message, meta = {}) {
    const recipients = await this.getAdminRecipients();
    const channels = this.enabledChannels.filter((channel) => listNotificationChannels().includes(channel));

    const deliveries = [];
    for (const recipient of recipients) {
      for (const channelName of channels) {
        const channel = getNotificationChannel(channelName);
        const delivery = await channel.send({
          to: recipient.email,
          user_id: recipient.emp_id,
          subject: `[IMS] ${eventType}`,
          message,
          meta,
        });
        deliveries.push({ recipient: recipient.emp_id, ...delivery });
      }
    }

    return { recipients: recipients.length, channels, deliveries };
  }
}

module.exports = new NotificationService();