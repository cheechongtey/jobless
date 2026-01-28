import pino from 'pino';

import { env } from '@/shared/lib/env';

export const logger = pino({
  transport:
    process.env.NODE_ENV === 'development'
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:standard',
            ignore: 'pid,hostname',
          },
        }
      : undefined,
  level: env.LOG_LEVEL ?? 'info',
  base: {
    service: 'job-finder-app',
  },
});
