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
  FIND_USER_BY_ID_RPC_ROUTE,
} = require('reminder-service-utils/constant');

const { findUserById } = require('../service/user');

wsServer.register(FIND_USER_BY_ID_RPC_ROUTE, async ({ id }) => {
  try {
    return await findUserById(id);
  } catch (e) {
    return null;
  }
});
