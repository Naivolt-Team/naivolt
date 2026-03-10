/**
 * Token storage: tries Expo SecureStore first, then AsyncStorage, then in-memory.
 * In Expo Go / when native modules are null, uses in-memory so the app never crashes.
 * Token persists only for the current app session when using in-memory.
 */

const PREFIX = 'naivolt_secure_';

const memoryStore: Record<string, string> = {};

function getSecureStore(): typeof import('expo-secure-store') | null {
  try {
    return require('expo-secure-store');
  } catch {
    return null;
  }
}

function getAsyncStorage(): import('@react-native-async-storage/async-storage').default | null {
  try {
    return require('@react-native-async-storage/async-storage').default;
  } catch {
    return null;
  }
}

export async function setToken(key: string, value: string): Promise<void> {
  try {
    const SecureStore = getSecureStore();
    if (SecureStore) {
      try {
        await SecureStore.setItemAsync(key, value);
        return;
      } catch {
        // fall through
      }
    }
  } catch {
    // getSecureStore() or require threw; fall through
  }
  try {
    const AsyncStorage = getAsyncStorage();
    if (AsyncStorage) {
      try {
        await AsyncStorage.setItem(PREFIX + key, value);
        return;
      } catch {
        // fall through
      }
    }
  } catch {
    // getAsyncStorage() or require threw; fall through
  }
  memoryStore[key] = value;
}

export async function getToken(key: string): Promise<string | null> {
  try {
    try {
      const SecureStore = getSecureStore();
      if (SecureStore) {
        try {
          const value = await SecureStore.getItemAsync(key);
          if (value != null) return value;
        } catch {
          // fall through
        }
      }
    } catch {
      // fall through
    }
    try {
      const AsyncStorage = getAsyncStorage();
      if (AsyncStorage) {
        try {
          const value = await AsyncStorage.getItem(PREFIX + key);
          if (value != null) return value;
        } catch {
          // fall through
        }
      }
    } catch {
      // fall through
    }
  } catch {
    // any unexpected error: fall back to memory
  }
  return memoryStore[key] ?? null;
}

export async function removeToken(key: string): Promise<void> {
  try {
    const SecureStore = getSecureStore();
    if (SecureStore) {
      try {
        await SecureStore.deleteItemAsync(key);
      } catch {
        // ignore
      }
    }
  } catch {
    // ignore
  }
  try {
    const AsyncStorage = getAsyncStorage();
    if (AsyncStorage) {
      try {
        await AsyncStorage.removeItem(PREFIX + key);
      } catch {
        // ignore
      }
    }
  } catch {
    // ignore
  }
  delete memoryStore[key];
}
