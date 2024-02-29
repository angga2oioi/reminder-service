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
  FIND_REMINDER_BY_TITLE_RPC_ROUTE,
} = require('reminder-service-utils/constant');

const { paginateReminder, createReminder, findReminderByTitle } = require('../service/reminder');

wsServer.register(PAGINATE_REMINDER_RPC_ROUTE, async ({
  query, sortBy, limit, page,
}) => paginateReminder(query, sortBy, limit, page));

wsServer.register(CREATE_REMINDER_RPC_ROUTE, async ({
  params,
}) => createReminder(params));

wsServer.register(FIND_REMINDER_BY_TITLE_RPC_ROUTE, async ({
  title, userId,
}) => findReminderByTitle(title, userId));
