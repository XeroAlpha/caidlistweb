import { register } from "register-service-worker";
import { EventEmitter } from "events";

class PWAManager extends EventEmitter {  
  constructor() {
    super();
    if (process.env.NODE_ENV === "production") {
      this.prepare();
    }
  }

  workerState = "uninitialized";
  registration = null;
  activeWorker = null;
  updateFound = false;
  installPrompt = null;
  updatedWorker = null;

  prepare() {
    if (!("serviceWorker" in navigator)) {
      this.workerState = "unsupported";
      return;
    }
    register(`./service-worker.js`, {
      ready: (reg) => {
        this.activeWorker = reg.active;
        this.workerState = "ready";
        this.emit("ready", this);
      },
      registered: (reg) => {
        this.registration = reg;
      },
      updated: (reg) => {
        this.updatedWorker = reg.waiting;
        this.emit("updateReady", this);
      },
      updatefound: (reg) => {
        this.updateFound = reg.installing != null;
        this.emit("installing", navigator.serviceWorker.controller != null);
      },
      error: (err) => console.error(err),
    });
    window.addEventListener("beforeinstallprompt", (ev) => {
      ev.preventDefault();
      this.installPrompt = ev;
      this.emit("installReady", this);
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
      .then(() => new Promise(resolve => setTimeout(resolve, 100)))
      .then(() => this.updateFound);
  }
}

export default new PWAManager();