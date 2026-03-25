import { Express } from 'express';
import { YamahaConnectionState } from '../models';
import { clearSavedYamahaIp, createYamahaYXCFromIp, getSavedYamahaIp, isValidYamahaIp } from '../services';
import { getConnectionStatus, getSingleValue } from './helpers';

export function registerConnectionEndpoints(app: Express, yamahaState: YamahaConnectionState) {
  /**
   * @openapi
   * /yamaha/connection:
   *   get:
   *     tags:
   *       - Connection
   *     summary: Sprawdza, czy amplituner Yamaha jest aktualnie dostępny
   *     responses:
   *       200:
   *         description: Aktualny status połączenia z amplitunerem Yamaha
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/YamahaConnectionStatusResponse'
   */
  app.get('/yamaha/connection', (req, res) => {
    res.json(getConnectionStatus(yamahaState));
  });

  /**
   * @openapi
   * /yamaha/connection/ip:
   *   get:
   *     tags:
   *       - Connection
   *     summary: Zwraca zapisany adres IP urządzenia Yamaha z app-config.json
   *     responses:
   *       200:
   *         description: Aktualnie zapisany adres IP urządzenia Yamaha
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/YamahaSavedIpResponse'
   */
  app.get('/yamaha/connection/ip', async (req, res) => {
    const ip = await getSavedYamahaIp();
    res.json({ ip });
  });

  /**
   * @openapi
   * /yamaha/connection/ip:
   *   delete:
   *     tags:
   *       - Connection
   *     summary: Czyści zapisany adres IP urządzenia Yamaha w app-config.json
   *     responses:
   *       200:
   *         description: Zapisany adres IP został usunięty
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/YamahaSavedIpResponse'
   */
  app.delete('/yamaha/connection/ip', async (req, res) => {
    await clearSavedYamahaIp();
    res.json({ ip: null });
  });

  /**
   * @openapi
   * /yamaha/connection:
   *   post:
   *     tags:
   *       - Connection
   *     summary: Ustawia adres IP urządzenia Yamaha i tworzy klienta YamahaYXC
   *     parameters:
   *       - in: query
   *         name: ip
   *         schema:
   *           type: string
   *         description: Adres IP urządzenia Yamaha przekazany jako query
   *     requestBody:
   *       required: false
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/YamahaConnectionRequest'
   *     responses:
   *       200:
   *         description: Klient Yamaha został utworzony i zapisany w stanie aplikacji
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/YamahaConnectionStatusResponse'
   *       400:
   *         description: Missing or invalid IP address
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       502:
   *         description: Yamaha device did not respond for the provided IP address
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  app.post('/yamaha/connection', async (req, res) => {
    const ip = getSingleValue(req.body?.ip ?? req.query.ip);
    if (!ip) {
      res.status(400).json({ message: 'A valid Yamaha IP address is required.' });
      return;
    }

    if (!isValidYamahaIp(ip)) {
      res.status(400).json({ message: 'A valid Yamaha IP address is required.' });
      return;
    }

    const client = await createYamahaYXCFromIp(ip);
    if (!client) {
      res.status(502).json({ message: 'Unable to connect to the Yamaha device at the provided IP address.' });
      return;
    }

    yamahaState.client = client;
    yamahaState.ip = client.ip ?? ip;
    yamahaState.source = 'manual';

    res.json(getConnectionStatus(yamahaState));
  });
}