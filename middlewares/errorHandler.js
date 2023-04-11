import { logEvents } from "./logger.js";

export const errorHandler = (err, req, res, next) => {
  logEvents(
    `${err.name}: ${err.message}\t Method:${req.method}\t Path:${req.url}\t Origin:${req.headers.origin}`,
    "errLog.log"
  );
  console.log(err.stack);
  const status = res.statusCode ? res.statusCode : 500; // server error

  res.status(status);

  res.json({ message: err.message });
};
