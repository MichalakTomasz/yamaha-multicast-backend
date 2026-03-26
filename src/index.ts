
import express from 'express';
import { registerEndpoints } from './endpoints';
import { YamahaConnectionState } from './models';
import { createYamahaYXC } from './services';
import { setupSwagger } from './swagger';
import { logger } from './pino';

const port = 3000;

async function bootstrap() {
  const app = express();

  app.use(express.json());
  setupSwagger(app, port);

  const yamahaConnection = await createYamahaYXC();
  const yamahaState: YamahaConnectionState = {
    client: yamahaConnection.client,
    ip: yamahaConnection.ip,
    source: yamahaConnection.source
  };

  registerEndpoints(app, yamahaState);

  app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
    console.log(`Swagger docs available at http://localhost:${port}/docs`);
  });
}

bootstrap().catch((error) => {
  logger.error({ err: error }, 'Server startup failed.');
});
