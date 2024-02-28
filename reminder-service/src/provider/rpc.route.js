// @ts-check

const WebSocketServer = require('rpc-websockets').Server;

const wsServer = new WebSocketServer({
  port: parseInt(process.env.WSPORT),
  host: '0.0.0.0',
});

wsServer.on('error', (e) => {
  console.log('wsServer error', e);
});

wsServer.on('socket-error', (e) => {
  console.log('wsServer error', e);
});

const {
  PAGINATE_REMINDER_RPC_ROUTE,
  CREATE_REMINDER_RPC_ROUTE,
} = require('reminder-service-utils/constant');

const { paginateReminder, createReminder } = require('../service/reminder');

wsServer.register(PAGINATE_REMINDER_RPC_ROUTE, async ({
  query, sortBy, limit, page,
}) => {
  try {
    return await paginateReminder(query, sortBy, limit, page);
  } catch (e) {
    return null;
  }
});

wsServer.register(CREATE_REMINDER_RPC_ROUTE, async ({
  params,
}) => {
  try {
    return await createReminder(params);
  } catch (e) {
    return null;
  }
});
