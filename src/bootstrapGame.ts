import { registerSW } from 'virtual:pwa-register';
import { bootstrap } from './app';
import { initInstallHint } from './ui/installHint';
import { initServiceWorkerUpdates, showServiceWorkerUpdatePrompt } from './ui/swUpdate';

export function startGame(): void {
  initServiceWorkerUpdates();

  registerSW({
    immediate: true,
    onNeedRefresh() {
      showServiceWorkerUpdatePrompt();
    },
  });

  bootstrap()
    .then(() => initInstallHint())
    .catch((error) => {
      console.error('Failed to start app:', error);
    });
}
