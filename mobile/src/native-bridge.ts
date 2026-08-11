import { Capacitor, type PluginListenerHandle } from "@capacitor/core";
import {
  AdMob,
  InterstitialAdPluginEvents,
  MaxAdContentRating,
} from "@capacitor-community/admob";

declare const __SCVD_ADMOB_ANDROID_INTERSTITIAL_ID__: string;
declare const __SCVD_ADMOB_IOS_INTERSTITIAL_ID__: string;
declare const __SCVD_ADMOB_TEST_MODE__: boolean;

declare global {
  interface Window {
    SCVDNativeAds?: {
      isNative: true;
      platform: "android" | "ios";
      consumeFirstInternalAd(): boolean;
      showRestartAd(): Promise<void>;
    };
  }
}

const platform = Capacitor.getPlatform();

if (Capacitor.isNativePlatform() && (platform === "android" || platform === "ios")) {
  let firstInternalAd = true;
  let initialized: Promise<void> | null = null;
  let prepared: Promise<void> | null = null;
  let showing: Promise<void> | null = null;

  const adId = platform === "ios"
    ? __SCVD_ADMOB_IOS_INTERSTITIAL_ID__
    : __SCVD_ADMOB_ANDROID_INTERSTITIAL_ID__;

  function timeout<T>(promise: Promise<T>, milliseconds: number): Promise<T> {
    return new Promise((resolve, reject) => {
      const timer = window.setTimeout(() => reject(new Error("AdMob operation timed out")), milliseconds);
      promise.then(
        (value) => { window.clearTimeout(timer); resolve(value); },
        (error) => { window.clearTimeout(timer); reject(error); },
      );
    });
  }

  function ensureInitialized(): Promise<void> {
    if (!initialized) {
      initialized = AdMob.initialize({
        initializeForTesting: __SCVD_ADMOB_TEST_MODE__,
        maxAdContentRating: MaxAdContentRating.General,
      }).catch((error) => {
        initialized = null;
        throw error;
      });
    }
    return initialized;
  }

  function prepareNext(): Promise<void> {
    if (!prepared) {
      prepared = ensureInitialized()
        .then(() => timeout(AdMob.prepareInterstitial({
          adId,
          isTesting: __SCVD_ADMOB_TEST_MODE__,
          npa: true,
          immersiveMode: true,
        }), 20_000))
        .then(() => undefined)
        .catch((error) => {
          prepared = null;
          throw error;
        });
    }
    return prepared;
  }

  async function showPrepared(): Promise<void> {
    await prepareNext();

    const handles: PluginListenerHandle[] = [];
    await new Promise<void>(async (resolve) => {
      let settled = false;
      const finish = () => {
        if (settled) return;
        settled = true;
        window.clearTimeout(safety);
        Promise.all(handles.map((handle) => handle.remove().catch(() => undefined))).finally(resolve);
      };
      const safety = window.setTimeout(finish, 180_000);

      try {
        handles.push(await AdMob.addListener(InterstitialAdPluginEvents.Dismissed, finish));
        handles.push(await AdMob.addListener(InterstitialAdPluginEvents.FailedToShow, finish));
        await timeout(AdMob.showInterstitial(), 20_000);
      } catch (_) {
        finish();
      }
    });

    prepared = null;
    prepareNext().catch(() => undefined);
  }

  window.SCVDNativeAds = {
    isNative: true,
    platform,
    consumeFirstInternalAd() {
      if (!firstInternalAd) return false;
      firstInternalAd = false;
      return true;
    },
    showRestartAd() {
      if (!showing) {
        showing = showPrepared()
          .catch(() => undefined)
          .finally(() => { showing = null; });
      }
      return showing;
    },
  };

  prepareNext().catch(() => undefined);
}
