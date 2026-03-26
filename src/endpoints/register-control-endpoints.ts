import { Express } from 'express';
import { YamahaConnectionState } from '../models';
import { getSingleValue, getYamahaOrRespond, getZone, parseVolume } from './helpers';
import { logger } from '../pino';

const soundProgramRoutes = ['/sound-program', '/soundProgram'];

export function registerControlEndpoints(app: Express, yamahaState: YamahaConnectionState) {

  /**
   * @openapi
   * /power:
   *   post:
   *     tags:
   *       - Control
   *     summary: Ustawia stan zasilania
   *     parameters:
   *       - in: query
   *         name: power
   *         schema:
   *           type: string
   *         description: Nowy stan zasilania, np. `on`, `standby` albo `toggle`
   *       - in: query
   *         name: zone
   *         schema:
   *           type: string
   *         description: Strefa urządzenia, domyślnie main
   *     requestBody:
   *       required: false
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/PowerRequest'
   *     responses:
   *       200:
   *         description: Power set successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/MessageResponse'
   *       400:
   *         description: Missing or invalid power value
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       500:
   *         description: Error setting power
   *       503:
   *         description: Yamaha device unavailable
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */

  app.post('/power', async (req, res) => {
    const client = getYamahaOrRespond(yamahaState, res);
    if (!client) {
      return;
    }
    const powerValue = getSingleValue(req.body?.power ?? req.query.power);
    if (powerValue === undefined) {
      res.status(400).json({ message: 'A valid power value is required.' });
      return;
    }
    try {
      const zone = getZone(req.body?.zone ?? req.query.zone);
      await client.power(powerValue, zone);
      res.json({ message: `Power set to ${powerValue}` });
    } catch (error) {
      logger.error({ err: error }, 'Error setting power.');
      res.status(500).send('Error setting power');
    }
  });

  /**
   * @openapi
   * /volume:
   *   post:
   *     tags:
   *       - Control
   *     summary: Ustawia poziom głośności
   *     parameters:
   *       - in: query
   *         name: volume
   *         schema:
   *           type: number
   *         description: Nowy poziom głośności
   *       - in: query
   *         name: zone
   *         schema:
   *           type: string
   *         description: Strefa urządzenia, domyślnie main
   *     requestBody:
   *       required: false
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/VolumeRequest'
   *     responses:
   *       200:
   *         description: Volume set successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/MessageResponse'
   *       400:
   *         description: Missing or invalid volume
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       500:
   *         description: Error setting volume
   *       503:
   *         description: Yamaha device unavailable
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  app.post('/volume', async (req, res) => {
    const client = getYamahaOrRespond(yamahaState, res);
    if (!client) {
      return;
    }

    const volume = parseVolume(req.body?.volume ?? req.query.volume);
    if (volume === undefined) {
      res.status(400).json({ message: 'A valid volume value is required.' });
      return;
    }

    try {
      const zone = getZone(req.body?.zone ?? req.query.zone);
      await client.setVolumeTo(volume, zone);
      res.json({ message: 'Volume set' });
    } catch (error) {
      logger.error({ err: error }, 'Error setting volume.');
      res.status(500).send('Error setting volume');
    }
  });

  /**
   * @openapi
   * /mute:
   *   post:
   *     tags:
   *       - Control
   *     summary: Włącza lub wyłącza wyciszenie
   *     parameters:
   *       - in: query
   *         name: mute
   *         schema:
   *           oneOf:
   *             - type: boolean
   *             - type: string
   *         description: Wartość wyciszenia, np. `true`, `false`, `1` albo `0`
   *       - in: query
   *         name: zone
   *         schema:
   *           type: string
   *         description: Strefa urządzenia, domyślnie main
   *     requestBody:
   *       required: false
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/MuteRequest'
   *     responses:
   *       200:
   *         description: Mute set successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/MessageResponse'
   *       400:
   *         description: Missing or invalid mute value
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       500:
   *         description: Error setting mute
   *       503:
   *         description: Yamaha device unavailable
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  app.post('/mute', async (req, res) => {
    const client = getYamahaOrRespond(yamahaState, res);  
    if (!client) {
      return;
    }
    const muteValue = getSingleValue(req.body?.mute ?? req.query.mute);
    if (muteValue === undefined) {
      res.status(400).json({ message: 'A valid mute value is required.' });
      return;
    }
    const mute = muteValue.toLowerCase() === 'true' || muteValue === '1';

    try { 
      const zone = getZone(req.body?.zone ?? req.query.zone);
      await client.mute(mute, zone);
      res.json({ message: `Mute set to ${mute}` });
    } catch (error) {
      logger.error({ err: error }, 'Error setting mute.');
      res.status(500).send('Error setting mute');
    }
  });

  /**
   * @openapi
   * /sound-program:
   *   post:
   *     tags:
   *       - Control
   *     summary: Ustawia program dźwiękowy
   *     parameters:
   *       - in: query
   *         name: program
   *         schema:
   *           type: string
   *         description: Nazwa programu dźwiękowego
   *       - in: query
   *         name: zone
   *         schema:
   *           type: string
   *         description: Strefa urządzenia, domyślnie main
   *     requestBody:
   *       required: false
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/SoundProgramRequest'
   *     responses:
   *       200:
   *         description: Sound program set successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/MessageResponse'
   *       400:
   *         description: Missing or invalid sound program
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       500:
   *         description: Error setting sound program
   *       503:
   *         description: Yamaha device unavailable
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  app.post(soundProgramRoutes, async (req, res) => {
    const client = getYamahaOrRespond(yamahaState, res);
    if (!client) {
      return;
    }

    const program = getSingleValue(req.body?.program ?? req.query.program);
    if (!program) {
      res.status(400).json({ message: 'A valid sound program is required.' });
      return;
    }

    try {
      const zone = getZone(req.body?.zone ?? req.query.zone);
      await client.setSoundProgramTo(program, zone);
      res.json({ message: 'Sound program set' });
    } catch (error) {
      logger.error({ err: error }, 'Error setting sound program.');
      res.status(500).send('Error setting sound program');
    }
  });

  /**
   * @openapi
   * /input:
   *   post:
   *     tags:
   *       - Control
   *     summary: Ustawia źródło wejścia
   *     parameters:
   *       - in: query
   *         name: input
   *         schema:
   *           type: string
   *         description: Nazwa wejścia
   *       - in: query
   *         name: mode
   *         schema:
   *           type: string
   *         description: Tryb przełączenia źródła
   *     requestBody:
   *       required: false
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/InputRequest'
   *     responses:
   *       200:
   *         description: Input set successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/MessageResponse'
   *       400:
   *         description: Missing or invalid input
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       500:
   *         description: Error setting input
   *       503:
   *         description: Yamaha device unavailable
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  app.post('/input', async (req, res) => {
    const client = getYamahaOrRespond(yamahaState, res);
    if (!client) {
      return;
    }

    const input = getSingleValue(req.body?.input ?? req.query.input);
    if (!input) {
      res.status(400).json({ message: 'A valid input is required.' });
      return;
    }

    try {
      const mode = getSingleValue(req.body?.mode ?? req.query.mode);
      await client.setInputTo(input, mode);
      res.json({ message: 'Input set' });
    } catch (error) {
      logger.error({ err: error }, 'Error setting input.');
      res.status(500).send('Error setting input');
    }
  });
}