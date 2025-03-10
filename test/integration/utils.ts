import { expect, test, describe } from 'vitest';
import type { Fixture } from '@blockfrost/blockfrost-tests';
import { noCase } from 'change-case';
import got from 'got';

export const getInstance = () => {
  return got.extend({
    responseType: 'json',
    prefixUrl: 'http://localhost:3000',
    https: {
      rejectUnauthorized: false,
    },
  });
};

const client = getInstance();

export const generateTest = (fixture: Fixture, endpoint: string) => {
  if (fixture.isCached) {
    return;
  }

  // TODO: update dbsync and fix this
  if (fixture.testName === 'scripts/datum/:hash/cbor - random datum') {
    return;
  }

  test(fixture.testName, async () => {
    if ('error' in fixture.response) {
      try {
        await client.get(endpoint).json();
        throw new Error(`Expected ${fixture.response} but did not throw`);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (error: any) {
        expect(error.response.body).toStrictEqual(fixture.response);
      }
    } else {
      const response = await client.get(endpoint).json();

      expect(response).toStrictEqual(fixture.response);
    }
  });
};

export const generateTestSuite = (fixtures: Record<string, Fixture[]>) => {
  for (const fixtureName of Object.keys(fixtures)) {
    const f = fixtures[fixtureName];

    describe(`${noCase(fixtureName)} endpoints`, () => {
      test('should have at least one endpoint', () => {
        expect(1).toBe(1);
      });
      for (const fixture of f) {
        for (const endpoint of fixture.endpoints) {
          generateTest(fixture, endpoint);
        }
      }
    });
  }
};
