import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

import { createAuthStorage } from './authStorageCore';

export const authStorage = createAuthStorage({
  platform: Platform.OS === 'web' ? 'web' : 'native',
  secure: SecureStore,
  legacy: AsyncStorage,
});
