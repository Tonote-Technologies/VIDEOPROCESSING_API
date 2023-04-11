import rateLimit from "express-rate-limit";
import { logEvents } from "./logger.js";

const loginLimiter = rateLimit({
  windowMs: 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
  message: {
    message:
      "Too many login attempts from this IP, please try again after a 60 seconds pause",
  },
  handler: (req, res, next, options) => {
    logEvents(
      `Too Many Requests: ${options.message.message} \t Method:${req.method} \t Path: ${req.url} \t Origin:${req.headers.origin}`,
      "errLog.log"
    );
    res.status(options.statuscode).send(options.message);
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

export { loginLimiter };
