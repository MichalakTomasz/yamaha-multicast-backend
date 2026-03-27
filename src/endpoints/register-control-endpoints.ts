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
      const zone = getZone(req.body?.zone ?? req.query.zone);
      const mode = getSingleValue(req.body?.mode ?? req.query.mode);
      await client.setInput(input, zone, mode);
      res.json({ message: 'Input set' });
    } catch (error) {
      logger.error({ err: error }, 'Error setting input.');
      res.status(500).send('Error setting input');
    }
  });

  /**
   * @openapi
   * /set-playback:
   *   post:
   *     tags:
   *       - Control
   *     summary: Steruje odtwarzaniem dla netusb albo CD
   *     parameters:
   *       - in: query
   *         name: command
   *         schema:
   *           type: string
   *         description: Komenda odtwarzania. Obsługiwane wartości to `play`, `stop`, `pause`, `play_pause`, `previous`, `next`, `frw_start`, `frw_end`, `ffw_start`, `ffw_end`. Aliasy `frw_start`, `frw_end`, `ffw_start`, `ffw_end` są mapowane odpowiednio do `fast_reverse_start`, `fast_reverse_end`, `fast_forward_start`, `fast_forward_end`.
   *       - in: query
   *         name: input
   *         schema:
   *           type: string
   *         description: Docelowe źródło odtwarzania. Jeśli ustawisz `cd`, backend wywoła `/cd/setPlayback`; dla każdej innej wartości lub braku parametru użyje `/netusb/setPlayback`.
   *     requestBody:
   *       required: false
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/PlaybackRequest'
   *     responses:
   *       200:
   *         description: Playback set successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/MessageResponse'
   *       400:
   *         description: Missing or invalid command
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       500:
   *         description: Error setting playback
   *       503:
   *         description: Yamaha device unavailable
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  app.post('/set-playback', async (req, res) => {
    const client = getYamahaOrRespond(yamahaState, res);
    if (!client) {
      return;
    }

    const command = getSingleValue(req.body?.command ?? req.query?.command);
    if (!command) {
      res.status(400).json({ message: 'A valid command is required.' });
      return;
    }

    try {
      const input = getSingleValue(req.body?.input ?? req.query?.input);      
      await client.setPlayback(command, input);
      res.json({ message: 'Playback set' });
    } catch (error) {
      logger.error({ err: error }, 'Error setting playback.');
      res.status(500).send('Error setting playback');
    }

  });

  /**
   * @openapi
   * /set-list-control:
   *   post:
   *     tags:
   *       - Control
   *     summary: Steruje wyborem elementu na liście netusb/DLNA
   *     description: |
   *       Przekazuje komendę `setListControl` do API Yamaha dla źródeł listowych, takich jak netusb.
   *       Ten endpoint najprawdopodobniej służy między innymi do wyboru serwera DLNA, folderu albo pozycji z listy, ale semantyka pól `listId` i `type` nie została jeszcze zweryfikowana na urządzeniu.
   *
   *       TODO: dodać endpoint diagnostyczny lub scenariusz weryfikacji, który pokaże pełną strukturę list i dozwolone wartości sterujące.
   *     parameters:
   *       - in: query
   *         name: listId
   *         schema:
   *           type: string
   *         description: Identyfikator listy lub kontekstu listy zwracany przez API Yamaha/netusb.
   *       - in: query
   *         name: type
   *         schema:
   *           type: string
   *         description: Typ akcji listowej przekazywany do Yamaha API. Dokładny zestaw wartości wymaga jeszcze weryfikacji na urządzeniu.
   *       - in: query
   *         name: index
   *         schema:
   *           type: number
   *         description: Opcjonalny indeks elementu listy używany przez niektóre akcje.
   *       - in: query
   *         name: zone
   *         schema:
   *           type: string
   *         description: Strefa urządzenia, domyślnie main.
   *     requestBody:
   *       required: false
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/ListControlRequest'
   *     responses:
   *       200:
   *         description: List control set successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/MessageResponse'
   *       400:
   *         description: Missing or invalid listId or type
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       500:
   *         description: Error setting list control
   *       503:
   *         description: Yamaha device unavailable
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  app.post('/set-list-control', async (req, res) => {
    const client = getYamahaOrRespond(yamahaState, res);
    if (!client) {
      return;
    }

    const listId = getSingleValue(req.body?.listId ?? req.query?.listId);
    if (!listId) {
      res.status(400).json({ message: 'A valid listId is required.' });
      return;
    }
    const type = getSingleValue(req.body?.type ?? req.query?.type);
    if (!type) {
      res.status(400).json({ message: 'A valid type is required.' });
      return;
    }
    const index = parseVolume(req.body?.index ?? req.query?.index);
    const zone = getZone(req.body?.zone ?? req.query?.zone);

    try {
      await client.setListControl(listId, type, index, zone);
      res.json({ message: 'List control set' });
    } catch (error) {
      logger.error({ err: error }, 'Error setting list control.');
      res.status(500).send('Error setting list control');
    } 
  });
}
