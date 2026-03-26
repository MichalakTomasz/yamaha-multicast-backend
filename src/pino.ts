import path from 'node:path';
import pino from 'pino';

const logFilePath = path.resolve(__dirname, '..', 'logs', 'app.log');

const streams = [
  {
    stream: pino.destination({
      dest: logFilePath,
      mkdir: true,
      sync: false,
    }),
  },
  {
    stream: process.stdout,
  },
];

export const logger = pino(
  {
    level: process.env.LOG_LEVEL || "info",

    base: {
      env: process.env.NODE_ENV,
    },

    timestamp: pino.stdTimeFunctions.isoTime,

    formatters: {
      level(label) {
        return { level: label };
      },
    },
  },
  pino.multistream(streams),
);
