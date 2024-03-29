// @ts-check

const { PAGINATE_REMINDER_RPC_ROUTE, CREATE_REMINDER_MQ_QUEUE, FIND_REMINDER_BY_TITLE_RPC_ROUTE } = require('reminder-service-utils/constant');

const WebSocket = require('rpc-websockets').Client;

let ws;
let isWSOpen = false;
const init = () => {
  isWSOpen = false;
  ws = new WebSocket(process.env.REMINDER_WSHOST, { max_reconnects: 0 });

  ws.on('open', () => {
    console.log('ws to reminder is connected');
    isWSOpen = true;
  });
  ws.on('error', (e) => {
    console.log('ws to reminder error, reconnecting', e.message);
  });
  ws.on('close', (e) => {
    console.log('ws to reminder close, reconnecting', e.message);
  });
};

init();

exports.paginateReminder = async (query, sortBy, limit, page) => ws.call(PAGINATE_REMINDER_RPC_ROUTE, {
  query, sortBy, limit, page,
});

exports.createReminder = async (params) => ws.call(CREATE_REMINDER_MQ_QUEUE, { params });
exports.findReminderByTitle = async (title, userId) => ws.call(FIND_REMINDER_BY_TITLE_RPC_ROUTE, { title, userId });
