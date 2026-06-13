const DISMISS_KEY = 'tilematch-install-hint';

function isIosBrowser(): boolean {
  const ua = navigator.userAgent;
  const iosDevice = /iPad|iPhone|iPod/.test(ua);
  const ipadOs = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
  return iosDevice || ipadOs;
}

function isStandaloneDisplay(): boolean {
  const nav = navigator as Navigator & { standalone?: boolean };
  return window.matchMedia('(display-mode: standalone)').matches || nav.standalone === true;
}

export function initInstallHint(): void {
  if (isStandaloneDisplay() || !isIosBrowser()) return;
  try {
    if (localStorage.getItem(DISMISS_KEY) === 'dismissed') return;
  } catch {
    /* ignore */
  }

  const banner = document.createElement('div');
  banner.id = 'install-hint';
  banner.className = 'install-hint';
  banner.setAttribute('role', 'status');

  const text = document.createElement('p');
  text.className = 'install-hint-text';
  text.textContent = 'Install: tap Share, then Add to Home Screen for full-screen play.';

  const dismiss = document.createElement('button');
  dismiss.type = 'button';
  dismiss.className = 'install-hint-dismiss';
  dismiss.setAttribute('aria-label', 'Dismiss install hint');
  dismiss.textContent = '×';
  dismiss.addEventListener('click', () => {
    try {
      localStorage.setItem(DISMISS_KEY, 'dismissed');
    } catch {
      /* ignore */
    }
    banner.remove();
  });

  banner.append(text, dismiss);
  document.querySelector('.header')?.insertAdjacentElement('afterend', banner);
}
