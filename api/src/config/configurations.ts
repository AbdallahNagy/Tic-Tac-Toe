import { configSchema } from './dto/config.dto';

export default () => {
  const config = {
    port: process.env.PORT,
    nodeEnv: process.env.NODE_ENV,
    clientURL: process.env.CLIENT_URL,
    redis: {
      host: process.env.REDIS_HOST,
      port: process.env.REDIS_PORT,
      password: process.env.REDIS_PASSWORD,
    },
  };
  return configSchema.parse(config);
};
