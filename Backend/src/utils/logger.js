import winston from "winston";
const { combine, timestamp, printf, colorize, json } = winston.format;
import "winston-daily-rotate-file";
import "winston-mongodb";
import dotenv from 'dotenv';
import util from 'util';

dotenv.config();

const levels = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3
};

const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  debug: 'blue'
};

winston.addColors(colors);

const consoleFormat = printf(({ level, message, timestamp, source, ip, email, ...metadata }) => {
  let metaString = '';
  if (Object.keys(metadata).length) {
    try {
      metaString = util.inspect(metadata, { depth: 3, colors: false });
    } catch (e) {
      metaString = '[Unable to stringify metadata: ' + e.message + ']';
    }
  }
  return `${timestamp}===> [${level}]: ${ip || 'N/A'}==>${email || 'N/A'}=> ${source || 'App'}: ${message} ${metaString}`;
});

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/business-dashboard';

const logger = winston.createLogger({
  levels,
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY/MM/DD, HH:mm:ss' }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      level: 'debug', // Set to the lowest level to log all levels
      format: combine(
        colorize({ all: true }),
        timestamp({ format: 'YYYY/MM/DD, HH:mm:ss' }),
        consoleFormat
      )
    }),
    new winston.transports.DailyRotateFile({
      level: 'debug', // Set to the lowest level to log all levels
      filename: 'logs/application-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '14d'
    }),
    new winston.transports.MongoDB({
      level: 'debug', // Set to the lowest level to log all levels
      db: MONGODB_URI,
      options: {
        useUnifiedTopology: true
      },
      collection: 'logs',
      format: json(),
      capped: true,
      cappedSize: 10000000, 
      tryReconnect: true,
      metaKey: 'metadata'
    })
  ]
});

const log = (level, source, message, meta = {}, req = {}) => {
  const ip = req.ip?.split(':').pop() || 'N/A';
  const email = req.user?.email || 'N/A';
  logger.log(level, message, { source, ip, email, ...meta });
};

export const error = (source, message, meta, req) => log('error', source, message, meta, req);
export const warn = (source, message, meta, req) => log('warn', source, message, meta, req);
export const info = (source, message, meta, req) => log('info', source, message, meta, req);
export const debug = (source, message, meta, req) => log('debug', source, message, meta, req);
export default logger;
