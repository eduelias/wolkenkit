import { CommandData } from '../../../../common/elements/CommandData';
import { CommandWithMetadata } from '../../../../common/elements/CommandWithMetadata';
import { Configuration } from '../../../../runtimes/singleProcess/processes/main/Configuration';
import { configurationDefinition } from '../../../../runtimes/singleProcess/processes/main/configurationDefinition';
import { ConsumerProgressStoreOptions } from '../../../../stores/consumerProgressStore/ConsumerProgressStoreOptions';
import { DistributiveOmit } from '../../../../common/types/DistributiveOmit';
import { DomainEvent } from '../../../../common/elements/DomainEvent';
import { DomainEventData } from '../../../../common/elements/DomainEventData';
import { DomainEventStoreOptions } from '../../../../stores/domainEventStore/DomainEventStoreOptions';
import { FileStoreOptions } from '../../../../stores/fileStore/FileStoreOptions';
import { ItemIdentifierWithClient } from '../../../../common/elements/ItemIdentifierWithClient';
import { LockStoreOptions } from '../../../../stores/lockStore/LockStoreOptions';
import { PriorityQueueStoreOptions } from '../../../../stores/priorityQueueStore/PriorityQueueStoreOptions';
import { SnapshotStrategyConfiguration } from '../../../../common/domain/SnapshotStrategyConfiguration';
import { toEnvironmentVariables } from '../../../../runtimes/shared/toEnvironmentVariables';
import { versions } from '../../../../versions';

const getSingleProcessPostgresManifest = function ({ appName }: {
  appName: string;
}): string {
  const services = {
    main: {
      hostName: 'main',
      publicPort: 3000,
      privatePort: 3000,
      healthPort: 3001
    },
    postgres: {
      hostName: 'postgres',
      privatePort: 5432,
      userName: 'wolkenkit',
      password: 'please-replace-this',
      database: 'wolkenkit'
    }
  };

  const postgresOptions = {
    hostName: services.postgres.hostName,
    port: services.postgres.privatePort,
    userName: services.postgres.userName,
    password: services.postgres.password,
    database: services.postgres.database
  };

  const domainEventStoreOptions: DomainEventStoreOptions = {
          type: 'Postgres',
          ...postgresOptions,
          tableNames: {
            domainEvents: 'domainevents',
            snapshots: 'snapshots'
          }
        },
        fileStoreOptions: FileStoreOptions = {
          type: 'FileSystem',
          directory: '/mnt/files'
        },
        flowProgressStoreOptions: ConsumerProgressStoreOptions = {
          type: 'Postgres',
          ...postgresOptions,
          tableNames: {
            progress: 'progress-flow'
          }
        },
        identityProviders: { issuer: string; certificate: string }[] = [],
        lockStoreOptions: LockStoreOptions = {
          type: 'Postgres',
          ...postgresOptions,
          tableNames: {
            locks: 'locks'
          }
        },
        priorityQueueStoreForCommandsOptions: DistributiveOmit<PriorityQueueStoreOptions<CommandWithMetadata<CommandData>, ItemIdentifierWithClient>, 'doesIdentifierMatchItem'> = {
          type: 'Postgres',
          ...postgresOptions,
          tableNames: {
            items: 'items-command',
            priorityQueue: 'priorityQueue-command'
          },
          expirationTime: 30000
        },
        priorityQueueStoreForDomainEventsOptions: DistributiveOmit<PriorityQueueStoreOptions<DomainEvent<DomainEventData>, ItemIdentifierWithClient>, 'doesIdentifierMatchItem'> = {
          type: 'Postgres',
          ...postgresOptions,
          tableNames: {
            items: 'items-domain-event',
            priorityQueue: 'priorityQueue-domain-event'
          },
          expirationTime: 30000
        },
        snapshotStrategy = {
          name: 'lowest',
          configuration: {
            revisionLimit: 100,
            durationLimit: 500
          }
        } as SnapshotStrategyConfiguration;

  const mainConfiguration: Configuration = {
    applicationDirectory: '/app',
    commandQueueRenewInterval: 5_000,
    concurrentCommands: 100,
    concurrentFlows: 1,
    consumerProgressStoreOptions: flowProgressStoreOptions,
    corsOrigin: '*',
    domainEventStoreOptions,
    enableOpenApiDocumentation: true,
    fileStoreOptions,
    graphqlApi: { enableIntegratedClient: true },
    healthPort: services.main.healthPort,
    httpApi: true,
    identityProviders,
    lockStoreOptions,
    port: services.main.privatePort,
    priorityQueueStoreForCommandsOptions,
    priorityQueueStoreForDomainEventsOptions,
    snapshotStrategy
  };

  return `
    version: '${versions.infrastructure['docker-compose']}'

    services:
      ${services.main.hostName}:
        build: '../..'
        command: 'node ./node_modules/wolkenkit/build/lib/runtimes/singleProcess/processes/main/app.js'
        environment:
          NODE_ENV: 'production'
          LOG_LEVEL: 'debug'
${
  Object.entries(
    toEnvironmentVariables({ configuration: mainConfiguration, configurationDefinition })
  ).map(([ key, value ]): string => `          ${key}: '${value}'`).join('\n')
}
        image: '${appName}'
        init: true
        ports:
          - '${services.main.publicPort}:${services.main.privatePort}'
        restart: 'always'
        volumes:
          - 'files:/mnt/files'
        healthcheck:
          test: ["CMD", "node", "./node_modules/wolkenkit/build/lib/bin/wolkenkit", "health", "--health-port", "${services.main.healthPort}"]
          interval: 30s
          timeout: 10s
          retries: 3
          start_period: 30s

      ${services.postgres.hostName}:
        image: 'postgres:${versions.dockerImages.postgres}'
        environment:
          POSTGRES_DB: '${services.postgres.database}'
          POSTGRES_USER: '${services.postgres.userName}'
          POSTGRES_PASSWORD: '${services.postgres.password}'
          PGDATA: '/var/lib/postgresql/data'
        restart: 'always'
        volumes:
          - 'postgres:/var/lib/postgresql/data'

    volumes:
      files:
      postgres:
  `;
};

export { getSingleProcessPostgresManifest };
