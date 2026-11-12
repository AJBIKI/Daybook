// In debug builds, run `adb reverse tcp:4000 tcp:4000` so both the emulator
// and a USB-connected phone reach the local Express server at localhost:4000.
// (An emulator without `adb reverse` can also use http://10.0.2.2:4000.)
const DEV_API_BASE_URL = 'http://localhost:4000';
const PROD_API_BASE_URL = 'https://daybook-api.onrender.com';

export const API_BASE_URL = __DEV__ ? DEV_API_BASE_URL : PROD_API_BASE_URL;
export const SLOW_REQUEST_THRESHOLD_MS = 6000;
export const REQUEST_TIMEOUT_MS = 25000;
