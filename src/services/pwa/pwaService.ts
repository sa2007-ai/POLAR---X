/**
 * POLAR-X Progressive Web App & Offline Lifecycle Service
 */

export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

type NetworkStatusListener = (isOnline: boolean) => void;
type InstallStateListener = (canInstall: boolean) => void;

class PWAService {
  private deferredPrompt: BeforeInstallPromptEvent | null = null;
  private networkListeners: Set<NetworkStatusListener> = new Set();
  private installListeners: Set<InstallStateListener> = new Set();
  private isOnlineState: boolean = typeof navigator !== 'undefined' ? navigator.onLine : true;

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.handleNetworkChange(true));
      window.addEventListener('offline', () => this.handleNetworkChange(false));

      window.addEventListener('beforeinstallprompt', (e: Event) => {
        e.preventDefault();
        this.deferredPrompt = e as BeforeInstallPromptEvent;
        this.notifyInstallListeners(true);
      });

      window.addEventListener('appinstalled', () => {
        this.deferredPrompt = null;
        this.notifyInstallListeners(false);
        console.log('[POLAR-X PWA] App installed successfully');
      });
    }
  }

  public registerServiceWorker(): void {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator && import.meta.env.PROD) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((registration) => {
            console.log('[POLAR-X PWA] Service Worker registered with scope:', registration.scope);
          })
          .catch((error) => {
            console.warn('[POLAR-X PWA] Service Worker registration failed:', error);
          });
      });
    }
  }

  public isOnline(): boolean {
    return this.isOnlineState;
  }

  public canInstall(): boolean {
    return this.deferredPrompt !== null;
  }

  public async promptInstall(): Promise<boolean> {
    if (!this.deferredPrompt) return false;
    try {
      await this.deferredPrompt.prompt();
      const choiceResult = await this.deferredPrompt.userChoice;
      this.deferredPrompt = null;
      this.notifyInstallListeners(false);
      return choiceResult.outcome === 'accepted';
    } catch (err) {
      console.warn('[POLAR-X PWA] Error displaying install prompt:', err);
      return false;
    }
  }

  public subscribeNetworkStatus(listener: NetworkStatusListener): () => void {
    this.networkListeners.add(listener);
    listener(this.isOnlineState);
    return () => this.networkListeners.delete(listener);
  }

  public subscribeInstallPrompt(listener: InstallStateListener): () => void {
    this.installListeners.add(listener);
    listener(this.canInstall());
    return () => this.installListeners.delete(listener);
  }

  private handleNetworkChange(online: boolean): void {
    this.isOnlineState = online;
    this.networkListeners.forEach((listener) => listener(online));
  }

  private notifyInstallListeners(canInstall: boolean): void {
    this.installListeners.forEach((listener) => listener(canInstall));
  }
}

export const pwaService = new PWAService();
