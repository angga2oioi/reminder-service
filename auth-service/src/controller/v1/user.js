// @ts-check
const {
  SUCCESS_ERR_CODE, SUCCESS_ERR_MESSAGE,
} = require('reminder-service-utils/constant');
const { parseError } = require('reminder-service-utils/functions');
const {
  createUser, updateUser, removeUser, createUserReminder,
} = require('../../service/user');
const { paginateReminder } = require('../../provider/reminder.service');

module.exports = {

  async UserCreate(req, res) {
    try {
      const user = await createUser(req?.body);
      res.json({
        error: SUCCESS_ERR_CODE,
        message: SUCCESS_ERR_MESSAGE,
        data: user,
      });
    } catch (e) {
      console.log(e);
      res.status(e?.error).json(parseError(e));
    }
  },
  async UserUpdate(req, res) {
    try {
      const user = await updateUser(req?.params?.id, req?.body);
      res.json({
        error: SUCCESS_ERR_CODE,
        message: SUCCESS_ERR_MESSAGE,
        data: user,
      });
    } catch (e) {
      console.log(e);
      res.status(e?.error).json(parseError(e));
    }
  },
  async UserRemove(req, res) {
    try {
      await removeUser(req?.params?.id);
      res.json({
        error: SUCCESS_ERR_CODE,
        message: SUCCESS_ERR_MESSAGE,
      });
    } catch (e) {
      console.log(e);
      res.status(e?.error).json(parseError(e));
    }
  },
  async UserPaginateReminder(req, res) {
    try {
      const {
        search,
        status,
        repeat,
        sortBy = 'createdAt:desc',
        page = 1,
        limit = 10,
      } = req.query;

      const data = await paginateReminder({
        user: req?.params?.id,
        search,
        status,
        repeat,
      }, sortBy, limit, page);

      res.json({
        error: SUCCESS_ERR_CODE,
        message: SUCCESS_ERR_MESSAGE,
        data,
      });
    } catch (e) {
      console.log(e);
      res.status(e?.error).json(parseError(e));
    }
  },
  async UserCreateReminder(req, res) {
    try {
      const data = await createUserReminder({
        ...req?.body,
        user: req?.params?.id,
      });

      res.json({
        error: SUCCESS_ERR_CODE,
        message: SUCCESS_ERR_MESSAGE,
        data,
      });
    } catch (e) {
      console.log(e);
      res.status(e?.error).json(parseError(e));
    }
  },
};
