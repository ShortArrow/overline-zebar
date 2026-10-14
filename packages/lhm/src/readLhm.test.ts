import { describe, expect, it } from 'vitest';
import { readLhm } from './readLhm';

const tree = { Text: 'Sensor', Children: [] };

const respond =
  (body: unknown, status = 200): typeof fetch =>
  async () =>
    new Response(JSON.stringify(body), { status });

describe('readLhm', () => {
  it('returns the sensor tree when LHM answers', async () => {
    expect(await readLhm(respond(tree))).toEqual({ status: 'ok', data: tree });
  });

  it('is unavailable when LHM answers with an error status', async () => {
    expect(await readLhm(respond({}, 500))).toEqual({ status: 'unavailable' });
  });

  it('is unavailable when LHM cannot be reached', async () => {
    const refused: typeof fetch = async () => {
      throw new TypeError('Failed to fetch');
    };
    expect(await readLhm(refused)).toEqual({ status: 'unavailable' });
  });

  it('is unavailable when LHM answers with something other than JSON', async () => {
    const html: typeof fetch = async () => new Response('<html>');
    expect(await readLhm(html)).toEqual({ status: 'unavailable' });
  });
});
