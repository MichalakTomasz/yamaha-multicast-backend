import { Express } from 'express';
import { YamahaConnectionState } from '../models';
import { getSingleValue, getYamahaOrRespond, getZone } from './helpers';
import { logger } from '../pino';

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
      logger.error({ err: error }, 'Error fetching power status.');
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
      logger.error({ err: error }, 'Error fetching signal info.');
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
      const programs = await client.getSoundProgramList();
      res.json(programs);
    } catch (error) {
      logger.error({ err: error }, 'Error fetching sound programs.');
      res.status(500).send('Error fetching sound programs');
    }
  });

  /**
   * @openapi
   * /input-list:
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
   *               $ref: '#/components/schemas/InputListResponse'
   *       500:
   *         description: Error fetching inputList
   *       503:
   *         description: Yamaha device unavailable
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  app.get('/input-list', async (req, res) => {
    const client = getYamahaOrRespond(yamahaState, res);
    if (!client) {
      return;
    }

    try {
      const features = await client.getFeatures();
      const zone = getZone(req.query.zone);
      const inputList: [] = features?.zone?.filter((z: any) => z.id === zone)[0]?.input_list;

      res.json({ 'input-list': inputList });
    } catch (error) {
      logger.error({ err: error }, 'Error fetching inputList.');
      res.status(500).send('Error fetching inputList');
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
      const status = await client.getStatus();
      const volume = status?.main?.volume ?? status?.volume;
      res.json(volume);
    } catch (error) {
      logger.error({ err: error }, 'Error fetching volume.');
      res.status(500).send('Error fetching volume');
    }
  });

  /**
   * @openapi
   * /features:
   *   get:
   *     tags:
   *       - Status
   *     summary: Pobiera możliwości urządzenia Yamaha
   *     description: |
   *       Zwraca wynik Yamaha `system/getFeatures`, czyli statyczny opis możliwości amplitunera.
   *       Odpowiedź zawiera między innymi:
   *       - listę wejść w `system.input_list`
   *       - listę wejść dostępnych dla każdej strefy w `zone[].input_list`
   *       - listę funkcji dostępnych w urządzeniu i strefach
   *       - dostępne programy dźwiękowe, zakresy regulacji i funkcje tunera/netusb
   *
   *       Do ustawiania źródła należy używać technicznych identyfikatorów wejść, np. `tv`, `tuner`, `audio1`, `usb`, `hdmi1`.
   *     responses:
   *       200:
   *         description: Pełny opis funkcji i wejść obsługiwanych przez amplituner
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/YamahaFeaturesResponse'
   *       500:
   *         description: Error fetching features
   *       503:
   *         description: Yamaha device unavailable
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  app.get('/features', async (req, res) => {
    const client = getYamahaOrRespond(yamahaState, res);
    if (!client) {
      return;
    }

    try {
      const features = await client.getFeatures();
      res.json(features);
    } catch (error) {
      logger.error({ err: error }, 'Error fetching features.');
      res.status(500).send('Error fetching features');
    }
  });

  /**
   * @openapi
   * /location-info:
   *   get:
   *     tags:
   *       - Status
   *     summary: Pobiera informacje o lokalizacji urządzenia Yamaha
   *     description: |
   *       Zwraca wynik Yamaha `system/getLocationInfo`.
   *       Endpoint zwraca identyfikator lokalizacji MusicCast, nazwę lokalizacji oraz mapę stref przypisanych do tej lokalizacji.
   *     responses:
   *       200:
   *         description: Informacje o lokalizacji urządzenia
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/LocationInfoResponse'
   *       500:
   *         description: Error fetching location info
   *       503:
   *         description: Yamaha device unavailable
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  app.get('/location-info', async (req, res) => {
    const client = getYamahaOrRespond(yamahaState, res);
    if (!client) {
      return;
    }

    try {
      const locationInfo = await client.getLocationInfo();
      res.json(locationInfo);
    } catch (error) {
      logger.error({ err: error }, 'Error fetching location info.');
      res.status(500).send('Error fetching location info');
    }
  });

  /**
   * @openapi
   * /device-info:
   *   get:
   *     tags:
   *       - Status
   *     summary: Pobiera informacje o urządzeniu Yamaha
   *     description: |
   *       Zwraca wynik Yamaha `system/getDeviceInfo`.
   *       Endpoint zwraca informacje identyfikujące urządzenie, w tym model urządzenia,
   *       wersje oprogramowania oraz numery seryjne udostępnione przez Yamaha API.
   *     responses:
   *       200:
   *         description: Informacje identyfikacyjne i wersje oprogramowania urządzenia
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/YamahaData'
   *       500:
   *         description: Error fetching device info
   *       503:
   *         description: Yamaha device unavailable
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  app.get('/device-info', async (req, res) => {
    const client = getYamahaOrRespond(yamahaState, res);
    if (!client) {
      return;
    }

    try {
      const deviceInfo = await client.getDeviceInfo();
      res.json(deviceInfo);
    } catch (error) {
      logger.error({ err: error }, 'Error fetching device info.');
      res.status(500).send('Error fetching device info');
    }
  });

  /**
   * @openapi
   * /play-info:
   *   get:
   *     tags:
   *       - Status
   *     summary: Pobiera informacje o aktualnie odtwarzanym medium
   *     description: |
   *       Zwraca szczegóły dotyczące aktualnie odtwarzanego medium dla wskazanego źródła.
   *       Parametr `input` może przyjąć wartości `cd`, `tuner` albo `server`.
   *       Jeśli `input` nie zostanie przekazany, urządzenie zwróci informacje dla źródła `server` albo `usb`, zależnie od tego co jest aktualnie używane przez Yamaha API.
   *     parameters:
   *       - in: query
   *         name: input
   *         required: false
   *         schema:
   *           type: string
   *           enum: [cd, tuner, server]
   *         description: Źródło, dla którego mają zostać pobrane informacje o odtwarzaniu.
   *     responses:
   *       200:
   *         description: Informacje o aktualnie odtwarzanym medium
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/YamahaData'
   *       500:
   *         description: Error fetching play info
   *       503:
   *         description: Yamaha device unavailable
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  app.get('/play-info', async (req, res) => {
    const client = getYamahaOrRespond(yamahaState, res);
    if (!client) {
      return;
    }

    try {
      const input = getSingleValue( req.body?.input ?? req.query?.input);
      const playInfo = await client.getPlayInfo(input);
      res.json(playInfo);
    } catch (error) {
      logger.error({ err: error }, 'Error fetching play info.');
      res.status(500).send('Error fetching play info');
    }
  });

  /**
   * @openapi
   * /get-list-info:
   *   get:
   *     tags:
   *       - Status
   *     summary: Pobiera listę dostępnych serwerów DLNA
   *     description: |
   *       Zwraca listę dostępnych serwerów DLNA widocznych dla urządzenia Yamaha.
   *       Aby pobrać tę listę, należy przekazać parametr `input` z wartością `server`.
   *     parameters:
   *       - in: query
   *         name: input
   *         required: true
   *         schema:
   *           type: string
   *           enum: [server]
   *         description: Typ źródła listy. Dla listy serwerów DLNA użyj wartości `server`.
   *       - in: query
   *         name: index
   *         required: false
   *         schema:
   *           type: string
   *         description: Indeks początkowy listy zwracanej przez API Yamaha.
   *       - in: query
   *         name: size
   *         required: false
   *         schema:
   *           type: string
   *         description: Maksymalna liczba elementów do pobrania.
   *       - in: query
   *         name: lang
   *         required: false
   *         schema:
   *           type: string
   *         description: Kod języka używany przez API Yamaha przy zwracaniu opisów.
   *     responses:
   *       200:
   *         description: Lista dostępnych serwerów DLNA
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/YamahaData'
   *       500:
   *         description: Error fetching list info
   *       503:
   *         description: Yamaha device unavailable
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  app.get('/get-list-info', async (req, res) => {
    const client = getYamahaOrRespond(yamahaState, res);
    if (!client) {
      return;
    }

    const input = getSingleValue( req.body?.input ?? req.query?.input);
    const index = getSingleValue( req.body?.index ?? req.query?.index);
    const size = getSingleValue( req.body?.size ?? req.query?.size);
    const lang = getSingleValue( req.body?.lang ?? req.query?.lang);
    try {
      const listInfo = await client.getListInfo(input, index, size, lang);
      res.json(listInfo);
    } catch (error) {
      logger.error({ err: error }, 'Error fetching list info.');
      res.status(500).send('Error fetching list info');
    }
  });
}