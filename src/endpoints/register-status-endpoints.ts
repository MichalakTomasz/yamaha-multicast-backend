import { Express } from 'express';
import { YamahaConnectionState } from '../models';
import { getYamahaOrRespond, getZone } from './helpers';

const signalInfoRoutes = ['/signal-info', '/signalInfo'];
const soundProgramsRoutes = ['/sound-programs', '/soundPrograms'];

export function registerStatusEndpoints(app: Express, yamahaState: YamahaConnectionState) {
  /**
   * @openapi
   * /power:
   *   get:
   *     tags:
   *       - Status
   *     summary: Pobiera aktualny stan zasilania
   *     responses:
   *       200:
   *         description: Aktualny stan zasilania
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/PowerResponse'
   *       500:
   *         description: Error fetching power status
   *       503:
   *         description: Yamaha device unavailable
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  app.get('/power', async (req, res) => {
    const client = getYamahaOrRespond(yamahaState, res);
    if (!client) {
      return;
    }

    try {
      const status = await client.getStatus();
      const power = status?.power || status?.power_status || status?.main?.power;
      res.json({ power });
    } catch (error) {
      console.error('Error fetching power status:', error);
      res.status(500).send('Error fetching power status');
    }
  });

  /**
   * @openapi
   * /status:
   *   get:
   *     tags:
   *       - Status
   *     summary: Pobiera pełny status urządzenia
   *     responses:
   *       200:
   *         description: Pełny status Yamaha
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/YamahaData'
   *       503:
   *         description: Yamaha device unavailable
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  app.get('/status', async (req, res) => {
    const client = getYamahaOrRespond(yamahaState, res);
    if (!client) {
      return;
    }

    const status = await client.getStatus();
    res.json(status);
  });

  /**
   * @openapi
   * /signal-info:
   *   get:
   *     tags:
   *       - Status
   *     summary: Pobiera informacje o sygnale wejściowym
   *     responses:
   *       200:
   *         description: Informacje o sygnale
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/YamahaData'
   *       500:
   *         description: Error fetching signal info
   *       503:
   *         description: Yamaha device unavailable
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  app.get(signalInfoRoutes, async (req, res) => {
    const client = getYamahaOrRespond(yamahaState, res);
    if (!client) {
      return;
    }

    try {
      const input = await client.getSignalInfo();
      res.json(input);
    } catch (error) {
      console.error('Error fetching signal info:', error);
      res.status(500).send('Error fetching signal info');
    }
  });

  /**
   * @openapi
   * /sound-programs:
   *   get:
   *     tags:
   *       - Status
   *     summary: Pobiera dostępne programy dźwiękowe
   *     responses:
   *       200:
   *         description: Lista programów dźwiękowych
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/YamahaData'
   *       500:
   *         description: Error fetching sound programs
   *       503:
   *         description: Yamaha device unavailable
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  app.get(soundProgramsRoutes, async (req, res) => {
    const client = getYamahaOrRespond(yamahaState, res);
    if (!client) {
      return;
    }

    try {
      const programs = await client.getSoundPrograms();
      res.json(programs);
    } catch (error) {
      console.error('Error fetching sound programs:', error);
      res.status(500).send('Error fetching sound programs');
    }
  });

  /**
   * @openapi
   * /inputs:
   *   get:
   *     tags:
   *       - Status
   *     summary: Pobiera listę dostępnych wejść
   *     responses:
   *       200:
   *         description: Lista wejść
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/InputsResponse'
   *       500:
   *         description: Error fetching inputs
   *       503:
   *         description: Yamaha device unavailable
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  app.get('/inputs', async (req, res) => {
    const client = getYamahaOrRespond(yamahaState, res);
    if (!client) {
      return;
    }

    try {
      const inputData = await client.getInputList();
      const inputs = Array.isArray(inputData?.inputs)
        ? inputData.inputs
        : Array.isArray(inputData)
          ? inputData
          : [];

      res.json({ inputs });
    } catch (error) {
      console.error('Error fetching inputs:', error);
      res.status(500).send('Error fetching inputs');
    }
  });

  /**
   * @openapi
   * /volume:
   *   get:
   *     tags:
   *       - Status
   *     summary: Pobiera aktualny poziom głośności
   *     parameters:
   *       - in: query
   *         name: zone
   *         schema:
   *           type: string
   *         description: Strefa urządzenia, domyślnie main
   *     responses:
   *       200:
   *         description: Aktualny poziom głośności
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/YamahaData'
   *       500:
   *         description: Error fetching volume
   *       503:
   *         description: Yamaha device unavailable
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  app.get('/volume', async (req, res) => {
    const client = getYamahaOrRespond(yamahaState, res);
    if (!client) {
      return;
    }

    try {
      const zone = getZone(req.query.zone);
      const volume = await client.getVolume(zone);
      res.json(volume);
    } catch (error) {
      console.error('Error fetching volume:', error);
      res.status(500).send('Error fetching volume');
    }
  });
}