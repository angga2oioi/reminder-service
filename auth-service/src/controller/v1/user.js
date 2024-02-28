// @ts-check
const {
  SUCCESS_ERR_CODE, SUCCESS_ERR_MESSAGE,
} = require('reminder-service-utils/constant');
const { parseError } = require('reminder-service-utils/function');
const { createUser, updateUser, removeUser } = require('../../service/user');

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
};
