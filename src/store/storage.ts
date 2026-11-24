import AsyncStorage from '@react-native-async-storage/async-storage';
import {createJSONStorage} from 'zustand/middleware';

/** Persisted stores live in AsyncStorage on the phone (sample data only; nothing leaves the device). */
export const appStorage = createJSONStorage(() => AsyncStorage);
