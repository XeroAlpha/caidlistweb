import { register } from "register-service-worker";

class PWAManager {  
  constructor() {
    if (process.env.NODE_ENV === "production") {
      this.prepare();
    }
  }

  ready = false;
  updateReady = false;
  installReady = false;
  registration = null;
  activeWorker = null;
  updateFound = false;
  installPrompt = null;
  updatedWorker = null;
  updateTimeout = 1000;

  prepare() {
    if (!("serviceWorker" in navigator)) {
      return;
    }
    register(`./service-worker.js`, {
      ready: (reg) => {
        this.activeWorker = reg.active;
        this.ready = true;
      },
      registered: (reg) => {
        this.registration = reg;
      },
      updated: (reg) => {
        this.updatedWorker = reg.waiting;
        this.updateReady = true;
      },
      updatefound: (reg) => {
        this.updateFound = reg.installing != null;
      },
      error: (err) => console.error(err),
    });
    window.addEventListener("beforeinstallprompt", (ev) => {
      ev.preventDefault();
      this.installPrompt = ev;
      this.installReady = true;
    });
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      window.location.reload();
    });
  }
  
  promptInstall() {
    const installPrompt = this.installPrompt;
    if (!installPrompt) return;
    this.installPrompt = null;
    installPrompt.prompt();
    return installPrompt.userChoice;
  }

  forceUpdate() {
    if (!this.updatedWorker) return;
    this.updatedWorker.postMessage({ type: "SKIP_WAITING" });
  }

  checkUpdate() {
    if (!this.registration) return;
    this.updateFound = false;
    return this.registration.update()
      .then(() => new Promise(resolve => setTimeout(resolve, this.updateTimeout)))
      .then(() => this.updateFound);
  }

  install(vueConstructor) {
    vueConstructor.prototype.$pwa = vueConstructor.observable(this);
  }
}

export default new PWAManager();