import { describe, test, expect } from 'vitest';
import jwt from 'jsonwebtoken';
import { dastroTest } from '../../test/_testing-core/dastro-test.ts';

describe('environmentSwitch', () => {
  function mockCookies(cookies: Record<string, string>) {
    return {
      get: (name: string) => {
        if (name in cookies) {
          return { value: cookies[name] };
        }
        return undefined;
      },
    } as any;
  }

  test('getDatoEnvironment returns custom environment from signed cookie', () => {
    const { environmentSwitch } = dastroTest();
    const es = environmentSwitch();

    const token = jwt.sign({ environment: 'sandbox' }, 'jwt-cookie-secret');
    const context = { cookies: mockCookies({ dato_environment: token }) };

    expect(es.getDatoEnvironment(context as any)).toBe('sandbox');
  });

  test('getDatoEnvironment returns default when no cookie is set', () => {
    const { environmentSwitch } = dastroTest();
    const es = environmentSwitch();

    const context = { cookies: mockCookies({}) };

    expect(es.getDatoEnvironment(context as any)).toBe('main');
  });
});
