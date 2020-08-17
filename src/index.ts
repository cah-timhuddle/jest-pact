import * as pact from '@pact-foundation/pact';
import { LogLevel, PactOptions } from '@pact-foundation/pact/dsl/options';
import * as path from 'path';

export type JestPactOptions = PactOptions & {
  timeout?: number;
};

const logHint = (options: JestPactOptions) =>
  options.port ? `-port-${options.port}` : '';

const applyDefaults = (options: JestPactOptions) => ({
  log: path.resolve(
    process.cwd(),
    'pact/logs',
    `${options.consumer}-${options.provider}-mockserver-interaction${logHint(
      options,
    )}.log`,
  ),
  dir: path.resolve(process.cwd(), 'pact/pacts'),
  spec: 2,
  logLevel: 'warn' as LogLevel,
  pactfileWriteMode: 'update' as pact.PactfileWriteMode,
  ...options,
});

const setupProvider = (options: JestPactOptions) => {
  const pactMock: pact.Pact = new pact.Pact(options);

  beforeAll(() => pactMock.setup());
  afterAll(() => pactMock.finalize());
  afterEach(() => pactMock.verify());

  return pactMock;
};

// This should be moved to pact-js, probably
export const getProviderBaseUrl = (provider: pact.Pact) =>
  provider.mockService
    ? provider.mockService.baseUrl
    : `http://${provider.opts.host}:${provider.opts.port}`;

const jestPactWrapper = (options: JestPactOptions, tests: any) => () => {
  const pactTestTimeout = options.timeout || 30000;

  describe(`with ${pactTestTimeout} ms timeout for Pact`, () => {
    jest.setTimeout(pactTestTimeout);

    tests(setupProvider(applyDefaults(options)));
  });
};

const describeString = (options: JestPactOptions) =>
  `Pact between ${options.consumer} and ${options.provider}`;

export const pactWith = (options: JestPactOptions, tests: any) =>
  describe(describeString(options), jestPactWrapper(options, tests));

export const xpactWith = (options: JestPactOptions, tests: any) =>
  xdescribe(describeString(options), jestPactWrapper(options, tests));

export const fpactWith = (options: JestPactOptions, tests: any) =>
  fdescribe(describeString(options), jestPactWrapper(options, tests));
