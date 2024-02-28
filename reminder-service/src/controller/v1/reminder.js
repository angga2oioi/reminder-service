// @ts-check
const {
  SUCCESS_ERR_CODE, SUCCESS_ERR_MESSAGE,
} = require('reminder-service-utils/constant');
const { parseError } = require('reminder-service-utils/functions');
const { removeReminder } = require('../../service/reminder');

module.exports = {

  async DeleteReminder(req, res) {
    try {
      const user = await removeReminder(req?.params?.id);
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
