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
          VolumeRequest: {
            type: 'object',
            properties: {
              volume: {
                type: 'number'
              }
            },
            required: ['volume']
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