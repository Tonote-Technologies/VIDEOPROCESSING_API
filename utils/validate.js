import Joi from "joi";

const registerValidator = (payload) => {
  const registerSchema = Joi.object({
    first_name: Joi.string().alphanum().min(3).max(30).required(),
    last_name: Joi.string().alphanum().min(3).max(30).required(),
    password: Joi.string().pattern(new RegExp("^[a-zA-Z0-9]{8,30}$")),
    // repeat_password: Joi.ref("password"),
    email: Joi.string().email().required(),
  });

  return registerSchema.validate(payload, {
    abortEarly: false,
  });
};

export { registerValidator };
