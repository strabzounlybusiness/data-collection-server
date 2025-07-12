const Joi = require('joi');

const submissionSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  data: Joi.object().required()
});

const validateSubmission = (req, res, next) => {
  const { error } = submissionSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      error: error.details[0].message.replace(/"/g, '')
    });
  }
  next();
};

module.exports = { validateSubmission };