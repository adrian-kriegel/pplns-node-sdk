
import {
  buildSearchParams,
  stringifyQuery,
} from '../src/main';

import Api from './util/test-api';

describe('Response handling', () => 
{
  const api = new Api();
  
  test('Error handling', async () => 
  {  
    const statusCodes = [
      400, 401, 403, 404, 300, 
    ];

    for (const status of statusCodes)
    {
      const resp = { msg: 'error', code: status };

      api.mock()
        .mockResolvedValue(
          {
            status,
            data: resp,
          },
        );

      await expect(
        // just testing GET but method is not relevant for error handling
        () => api.client.request('get', '/test'),
      ).rejects.toStrictEqual(resp);
    }
  });

  test('Success handling', async () => 
  {  
    const statusCodes = [
      200, 201, 
    ];

    for (const status of statusCodes)
    {
      const resp = { foo: 'bar', status };

      api.mock()
        .mockResolvedValue(
          {
            status,
            data: resp,
          },
        );

      await expect(
        await api.client.request('get', '/test'),
      ).toStrictEqual(resp);
    }
  });
});

describe('buildSearchParams', () => 
{
  it('stringifyQuery correctly transforms query.', () => 
  {
    const tests = [
      [
        // in
        { foo: 'bar' },
        // out
        { foo: 'bar' },
      ],
      [
        // in
        { 
          str: 'bar',
          num: 123,
          date: new Date('2022-09-06T08:47:04.245Z'),
          bool: false,
          obj: { foo: 'bar' },
        },
        // out
        { 
          str: encodeURIComponent('bar'),
          num: encodeURIComponent('123'),
          date: encodeURIComponent('2022-09-06T08:47:04.245Z'),
          bool: encodeURIComponent('false'),
          obj: encodeURIComponent(JSON.stringify({ foo: 'bar' })),
        },
      ],
    ];

    for (const [i, o] of tests)
    {
      expect(stringifyQuery(i))
        .toStrictEqual(o)
      ;
    }
  });

  it('buildSearchParams', () => 
  {
    expect('' + buildSearchParams({ foo: 'bar', bool: true }))
      .toBe('foo=bar&bool=true');
  });
});

describe('Emit & consume', () => 
{
  test.todo('Emit & consume items.');
});
