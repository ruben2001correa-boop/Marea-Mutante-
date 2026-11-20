import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.mareamutante.game',
  appName: 'Marea Mutante',
  webDir: 'dist',
  android: {
    backgroundColor: '#06131d',
    allowMixedContent: true,
  },
};

export default config;
