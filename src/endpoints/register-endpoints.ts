import { Express } from 'express';
import { YamahaConnectionState } from '../models';
import { registerConnectionEndpoints } from './register-connection-endpoints';
import { registerControlEndpoints } from './register-control-endpoints';
import { registerStatusEndpoints } from './register-status-endpoints';

export function registerEndpoints(app: Express, yamahaState: YamahaConnectionState) {
  registerConnectionEndpoints(app, yamahaState);
  registerStatusEndpoints(app, yamahaState);
  registerControlEndpoints(app, yamahaState);
}