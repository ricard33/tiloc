import { LogglyTracker } from "loggly-jslogger";

const logger = new LogglyTracker();

logger.push({
  logglyKey: process.env.REACT_APP_LOGGLY_CUSTOMER_TOKEN,
  sendConsoleErrors: true,
  tag: process.env.REACT_APP_LOGGLY_TAG,
  useUtfEncoding: true,
  useDomainProxy : true,
});

let previous;

const logFn = (level, data, extended_data = {}, once = false) => {

  if (!logger.key) {
    console.warn('Loggly key not defined!');
    return;
  }

  if ("object" !== typeof data) {
    data = { data: JSON.stringify(data) };
  }

  data = {
    ...data,
    ...extended_data,
    url: window.location.href,
    userAgent: window.navigator.userAgent
  };

  if (
    !once
    || !previous
    || previous.data.column !== data.column
    || previous.data.file !== data.file
    || previous.data.line !== data.line
    || previous.data.message !== data.message
    || previous.level !== level
  ) {
    logger.track({ ...data, level });
  }

  previous = { data, level };

};

const info = (data, once = false) => {
  logFn("info", data, {}, once);
};

const warn = (data, once = false) => {
  logFn("warn", data, {}, once);
};

const error = (err, data = {}, once = false) => {
  logFn("error", data,
    {
      file: err.fileName || err.filename,
      line: err.lineNumber || err.lineno,
      column: err.colno,
      message: err.message,
      stack: err.stack || (err.error ? err.error.stack : undefined)
    }, once);
};

export default {
  info,
  warn,
  warning: warn,
  error,
  tracker: logger
};
