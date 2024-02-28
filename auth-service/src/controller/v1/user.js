// @ts-check
const {
  SUCCESS_ERR_CODE, SUCCESS_ERR_MESSAGE,
} = require('reminder-service-utils/constant');
const { parseError } = require('reminder-service-utils/function');
const { createUser } = require('../../service/user');

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
};
