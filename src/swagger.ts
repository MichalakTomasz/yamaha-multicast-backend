import path from 'path';
import { Express } from 'express';
import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

export function setupSwagger(app: Express, port: number) {
  const endpointsGlob = path.join(__dirname, 'endpoints', '*.{ts,js}').replace(/\\/g, '/');

  const swaggerSpec = swaggerJSDoc({
    definition: {
      openapi: '3.0.0',
      info: {
        title: 'Yamaha Multicast Backend API',
        version: '1.0.0',
        description: 'API do odczytu statusu i sterowania amplitunerem Yamaha przez bibliotekę yamaha-yxc-nodejs.'
      },
      servers: [
        {
          url: `http://localhost:${port}`
        }
      ],
      tags: [
        {
          name: 'Status',
          description: 'Endpointy odczytowe urządzenia Yamaha.'
        },
        {
          name: 'Control',
          description: 'Endpointy sterujące urządzeniem Yamaha.'
        },
        {
          name: 'Connection',
          description: 'Endpointy zarządzające połączeniem z urządzeniem Yamaha.'
        }
      ],
      components: {
        schemas: {
          MessageResponse: {
            type: 'object',
            properties: {
              message: {
                type: 'string'
              }
            },
            required: ['message']
          },
          ErrorResponse: {
            type: 'object',
            properties: {
              message: {
                type: 'string'
              }
            },
            required: ['message']
          },
          YamahaConnectionStatusResponse: {
            type: 'object',
            properties: {
              found: {
                type: 'boolean'
              },
              ip: {
                oneOf: [
                  { type: 'string' },
                  { type: 'null' }
                ]
              },
              source: {
                oneOf: [
                  {
                    type: 'string',
                    enum: ['saved', 'discovery', 'manual']
                  },
                  { type: 'null' }
                ]
              }
            },
            required: ['found', 'ip', 'source']
          },
          YamahaConnectionRequest: {
            type: 'object',
            properties: {
              ip: {
                type: 'string'
              }
            },
            required: ['ip']
          },
          YamahaSavedIpResponse: {
            type: 'object',
            properties: {
              ip: {
                oneOf: [
                  { type: 'string' },
                  { type: 'null' }
                ]
              }
            },
            required: ['ip']
          },
          PowerResponse: {
            type: 'object',
            properties: {
              power: {
                oneOf: [
                  { type: 'string' },
                  { type: 'boolean' },
                  { type: 'null' }
                ]
              }
            }
          },
          InputsResponse: {
            type: 'object',
            properties: {
              inputs: {
                type: 'array',
                items: {
                  type: 'string'
                }
              }
            }
          },
          YamahaFeatureInput: {
            type: 'object',
            properties: {
              id: {
                type: 'string',
                description: 'Techniczny identyfikator wejścia używany przy setInput, np. tv, tuner, audio1, usb.'
              },
              distribution_enable: {
                type: 'boolean'
              },
              rename_enable: {
                type: 'boolean'
              },
              account_enable: {
                type: 'boolean'
              },
              play_info_type: {
                type: 'string',
                description: 'Typ danych odtwarzania powiązany ze źródłem, np. netusb, tuner albo none.'
              }
            },
            required: ['id']
          },
          YamahaRangeStep: {
            type: 'object',
            properties: {
              id: {
                type: 'string'
              },
              min: {
                type: 'number'
              },
              max: {
                type: 'number'
              },
              step: {
                type: 'number'
              }
            },
            required: ['id']
          },
          YamahaFeatureZone: {
            type: 'object',
            properties: {
              id: {
                type: 'string',
                description: 'Id strefy, np. main albo zone2.'
              },
              zone_b: {
                type: 'boolean'
              },
              func_list: {
                type: 'array',
                items: {
                  type: 'string'
                }
              },
              input_list: {
                type: 'array',
                items: {
                  type: 'string'
                },
                description: 'Lista wejść dostępnych w danej strefie. To te wartości należy wysyłać do endpointu ustawiającego źródło.'
              },
              sound_program_list: {
                type: 'array',
                items: {
                  type: 'string'
                }
              },
              surr_decoder_type_list: {
                type: 'array',
                items: {
                  type: 'string'
                }
              },
              tone_control_mode_list: {
                type: 'array',
                items: {
                  type: 'string'
                }
              },
              link_control_list: {
                type: 'array',
                items: {
                  type: 'string'
                }
              },
              link_audio_delay_list: {
                type: 'array',
                items: {
                  type: 'string'
                }
              },
              range_step: {
                type: 'array',
                items: {
                  $ref: '#/components/schemas/YamahaRangeStep'
                }
              },
              scene_num: {
                type: 'number'
              },
              cursor_list: {
                type: 'array',
                items: {
                  type: 'string'
                }
              },
              menu_list: {
                type: 'array',
                items: {
                  type: 'string'
                }
              },
              actual_volume_mode_list: {
                type: 'array',
                items: {
                  type: 'string'
                }
              },
              ccs_supported: {
                type: 'array',
                items: {
                  type: 'string'
                }
              }
            },
            required: ['id']
          },
          YamahaFeaturesResponse: {
            type: 'object',
            properties: {
              response_code: {
                type: 'number',
                description: 'Kod odpowiedzi API Yamaha; 0 oznacza powodzenie.'
              },
              system: {
                type: 'object',
                properties: {
                  func_list: {
                    type: 'array',
                    items: {
                      type: 'string'
                    }
                  },
                  zone_num: {
                    type: 'number'
                  },
                  input_list: {
                    type: 'array',
                    items: {
                      $ref: '#/components/schemas/YamahaFeatureInput'
                    },
                    description: 'Pełna lista wejść wraz z metadanymi urządzenia.'
                  },
                  bluetooth: {
                    type: 'object',
                    additionalProperties: true
                  },
                  web_control_url: {
                    type: 'string'
                  }
                },
                additionalProperties: true
              },
              zone: {
                type: 'array',
                items: {
                  $ref: '#/components/schemas/YamahaFeatureZone'
                },
                description: 'Możliwości poszczególnych stref, w tym dostępne wejścia i funkcje.'
              },
              tuner: {
                type: 'object',
                additionalProperties: true
              },
              netusb: {
                type: 'object',
                additionalProperties: true
              },
              distribution: {
                type: 'object',
                additionalProperties: true
              },
              ccs: {
                type: 'object',
                additionalProperties: true
              }
            },
            required: ['response_code']
          },
          LocationInfoResponse: {
            type: 'object',
            properties: {
              response_code: {
                type: 'number',
                description: 'Kod odpowiedzi API Yamaha; 0 oznacza powodzenie.'
              },
              id: {
                type: 'string',
                description: 'Identyfikator lokalizacji urządzenia w ekosystemie MusicCast.'
              },
              name: {
                type: 'string',
                description: 'Nazwa lokalizacji, np. Home1.'
              },
              zone_list: {
                type: 'object',
                description: 'Mapa dostępności stref w lokalizacji. Klucz to nazwa strefy, wartość określa czy strefa należy do tej lokalizacji.',
                additionalProperties: {
                  type: 'boolean'
                },
                example: {
                  main: true,
                  zone2: false
                }
              }
            },
            required: ['response_code', 'id', 'name', 'zone_list']
          },
          VolumeRequest: {
            type: 'object',
            properties: {
              volume: {
                type: 'number'
              }
            },
            required: ['volume']
          },
          PowerRequest: {
            type: 'object',
            properties: {
              power: {
                type: 'string'
              },
              zone: {
                type: 'string'
              }
            },
            required: ['power']
          },
          MuteRequest: {
            type: 'object',
            properties: {
              mute: {
                type: 'boolean'
              },
              zone: {
                type: 'string'
              }
            },
            required: ['mute']
          },
          SoundProgramRequest: {
            type: 'object',
            properties: {
              program: {
                type: 'string'
              }
            },
            required: ['program']
          },
          InputRequest: {
            type: 'object',
            properties: {
              input: {
                type: 'string'
              },
              mode: {
                type: 'string'
              }
            },
            required: ['input']
          },
          PlaybackRequest: {
            type: 'object',
            properties: {
              command: {
                type: 'string',
                description: 'Komenda odtwarzania. Obsługiwane wartości: play, stop, pause, play_pause, previous, next, frw_start, frw_end, ffw_start, ffw_end.',
                example: 'play'
              },
              input: {
                type: 'string',
                description: 'Docelowe źródło odtwarzania. Wartość cd kieruje komendę do /cd/setPlayback, a każda inna wartość lub brak pola do /netusb/setPlayback.',
                example: 'cd'
              }
            },
            required: ['command']
          },
          ListControlRequest: {
            type: 'object',
            properties: {
              listId: {
                type: 'string',
                description: 'Identyfikator listy lub kontekstu listy zwracany przez API Yamaha/netusb.',
                example: 'main'
              },
              type: {
                type: 'string',
                description: 'Typ akcji listowej przekazywany do Yamaha API. Zestaw dozwolonych wartości wymaga jeszcze weryfikacji na urządzeniu.',
                example: 'select'
              },
              index: {
                type: 'number',
                description: 'Opcjonalny indeks elementu listy używany przez niektóre akcje.',
                example: 0
              },
              zone: {
                type: 'string',
                description: 'Strefa urządzenia, domyślnie main.',
                example: 'main'
              }
            },
            required: ['listId', 'type']
          },
          YamahaData: {
            type: 'object',
            additionalProperties: true
          }
        }
      }
    },
    apis: [endpointsGlob]
  });

  app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
}