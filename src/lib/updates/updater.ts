import * as Application from 'expo-application';
import * as FileSystem from 'expo-file-system/legacy';
import * as IntentLauncher from 'expo-intent-launcher';

import { fetchUpdateManifest, type UpdateManifest } from '@/lib/updates/manifest';

export type UpdateCheck =
  | { status: 'current'; version: string }
  | { status: 'unavailable' }
  | { status: 'available'; manifest: UpdateManifest; mandatory: boolean };

export const currentVersionName = Application.nativeApplicationVersion ?? '1.0.0';
export const currentVersionCode = Number(Application.nativeBuildVersion ?? 0) || 0;

export async function checkForUpdate(): Promise<UpdateCheck> {
  const manifest = await fetchUpdateManifest();
  if (!manifest) return { status: 'unavailable' };
  if (manifest.versionCode <= currentVersionCode) {
    return { status: 'current', version: currentVersionName };
  }

  return {
    status: 'available',
    manifest,
    mandatory: (manifest.minVersionCode ?? 0) > currentVersionCode,
  };
}

function apkPath(versionCode: number) {
  return `${FileSystem.cacheDirectory}kue-${versionCode}.apk`;
}

/** Downloads the APK, then hands it to the system installer. */
export async function downloadAndInstall(
  manifest: UpdateManifest,
  onProgress?: (fraction: number) => void,
): Promise<'installer-opened' | 'unchanged'> {
  const target = apkPath(manifest.versionCode);
  const info = await FileSystem.getInfoAsync(target);
  // A stale partial file would fail the install; always replace it.
  if (info.exists) {
    await FileSystem.deleteAsync(target, { idempotent: true });
  }

  const download = FileSystem.createDownloadResumable(
    manifest.apkUrl,
    target,
    {},
    (progress) => {
      const total = progress.totalBytesExpectedToWrite;
      if (onProgress && total > 0) {
        onProgress(Math.min(1, progress.totalBytesWritten / total));
      }
    },
  );

  const result = await download.downloadAsync();
  if (!result?.uri) throw new Error('The download did not finish.');

  const contentUri = await FileSystem.getContentUriAsync(result.uri);
  try {
    await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
      data: contentUri,
      flags: 1, // FLAG_GRANT_READ_URI_PERMISSION
      type: 'application/vnd.android.package-archive',
    });
  } catch {
    // The user has not allowed installs from Kue yet, or cancelled.
    return 'unchanged';
  }

  return 'installer-opened';
}

/** Opens the "install unknown apps" toggle for Kue's package. */
export async function openInstallPermissionSettings() {
  try {
    await IntentLauncher.startActivityAsync(
      'android.settings.MANAGE_UNKNOWN_APP_SOURCES',
      { data: `package:${Application.applicationId}` },
    );
  } catch {
    await IntentLauncher.startActivityAsync('android.settings.SETTINGS').catch(() => undefined);
  }
}

/** Removes APKs downloaded for older builds. */
export async function cleanupOldApks() {
  try {
    const files = await FileSystem.readDirectoryAsync(FileSystem.cacheDirectory ?? '');
    await Promise.all(
      files
        .filter((name) => name.startsWith('kue-') && name.endsWith('.apk'))
        .map((name) =>
          FileSystem.deleteAsync(`${FileSystem.cacheDirectory}${name}`, { idempotent: true }),
        ),
    );
  } catch {
    // Cache cleanup is best effort.
  }
}
