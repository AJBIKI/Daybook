import * as Keychain from 'react-native-keychain';

const TOKEN_SERVICE = 'com.daybook.auth.token';
const TOKEN_USERNAME = 'daybook-session';

export async function saveAuthToken(token: string): Promise<void> {
  await Keychain.setGenericPassword(TOKEN_USERNAME, token, {
    service: TOKEN_SERVICE,
    accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
}

export async function loadAuthToken(): Promise<string | null> {
  try {
    const credentials = await Keychain.getGenericPassword({
      service: TOKEN_SERVICE,
    });
    if (credentials === false) {
      return null;
    }
    return credentials.password;
  } catch {
    return null;
  }
}

export async function clearAuthToken(): Promise<void> {
  try {
    await Keychain.resetGenericPassword({ service: TOKEN_SERVICE });
  } catch {
    // Keychain reset can fail if no item exists or keystore rotated; safe to ignore.
  }
}
