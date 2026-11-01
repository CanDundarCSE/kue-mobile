import { StyleSheet } from 'react-native';

import { getThemeVersion, mapColor } from '@/theme/palette';

/**
 * Colors in `StyleSheet.create` objects are captured once, at module load.
 * The returned styles object is a Proxy: on every theme change it rebuilds
 * each style with mapped colors, so consumers receive a fresh style identity
 * and native views repaint instead of keeping the old palette.
 */
const COLOR_KEYS = new Set([
  'color',
  'backgroundColor',
  'borderColor',
  'borderTopColor',
  'borderBottomColor',
  'borderLeftColor',
  'borderRightColor',
  'borderStartColor',
  'borderEndColor',
  'shadowColor',
  'textDecorationColor',
  'outlineColor',
  'tintColor',
]);

function themeStyle(style: object) {
  const out: Record<string, unknown> = {};

  Object.keys(style).forEach((property) => {
    const value = (style as Record<string, unknown>)[property];
    out[property] =
      COLOR_KEYS.has(property) && typeof value === 'string' ? mapColor(value) : value;
  });

  return out;
}

function createThemedCollection(created: Record<string, object>) {
  let cachedVersion = -1;
  const cache = new Map<string, object>();

  return new Proxy(created, {
    get(target, property, receiver) {
      if (typeof property !== 'string') {
        return Reflect.get(target, property, receiver);
      }

      const version = getThemeVersion();
      if (version !== cachedVersion) {
        cache.clear();
        cachedVersion = version;
      }

      const themed = cache.get(property);
      if (themed) return themed;

      const raw = Reflect.get(target, property, receiver);
      if (!raw || typeof raw !== 'object') return raw;

      const next = themeStyle(raw);
      cache.set(property, next);
      return next;
    },
  });
}

type Create = typeof StyleSheet.create;

const originalCreate = StyleSheet.create.bind(StyleSheet) as Create;

const patchedCreate = ((styles: Record<string, object>) => {
  const created = originalCreate(styles as never) as Record<string, object>;
  return createThemedCollection(created);
}) as Create;

(StyleSheet as unknown as { create: Create }).create = patchedCreate;
