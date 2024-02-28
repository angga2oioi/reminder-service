// @ts-check

const { FIND_USER_BY_ID_RPC_ROUTE } = require('reminder-service-utils/constant');

const WebSocket = require('rpc-websockets').Client;

let ws;
let isWSOpen = false;
const init = () => {
  isWSOpen = false;
  ws = new WebSocket(process.env.AUTH_WSHOST, { max_reconnects: 0 });

  ws.on('open', () => {
    console.log('ws to auth is connected');
    isWSOpen = true;
  });
  ws.on('error', (e) => {
    console.log('ws to auth error, reconnecting', e.message);
  });
  ws.on('close', (e) => {
    console.log('ws to auth close, reconnecting', e.message);
  });
};

init();

exports.findUserById = async (id) => ws.call(FIND_USER_BY_ID_RPC_ROUTE, { id });
