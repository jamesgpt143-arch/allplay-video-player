import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.8f380101cd0743a4b4839b1e9c164661',
  appName: 'Stream Player',
  webDir: 'dist',
  server: {
    url: 'https://8f380101-cd07-43a4-b483-9b1e9c164661.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  android: {
    allowMixedContent: true
  }
};

export default config;
