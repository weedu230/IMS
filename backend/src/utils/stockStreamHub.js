const clients = new Map();

const writeEvent = (res, eventName, data) => {
  res.write(`event: ${eventName}\n`);
  res.write(`data: ${JSON.stringify(data)}\n\n`);
};

const registerStockStreamClient = (clientId, res) => {
  clients.set(clientId, res);
  return clientId;
};

const unregisterStockStreamClient = (clientId) => {
  clients.delete(clientId);
};

const publishStockUpdate = (data) => {
  for (const res of clients.values()) {
    writeEvent(res, 'stock-update', data);
  }
};

const publishHeartbeat = () => {
  for (const res of clients.values()) {
    writeEvent(res, 'heartbeat', { timestamp: new Date().toISOString() });
  }
};

setInterval(() => {
  if (clients.size > 0) publishHeartbeat();
}, 30000);

module.exports = {
  registerStockStreamClient,
  unregisterStockStreamClient,
  publishStockUpdate,
};