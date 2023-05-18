"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var utils = __toESM(require("@iobroker/adapter-core"));
var import_fs = __toESM(require("fs"));
class NotificationManager extends utils.Adapter {
  constructor(options = {}) {
    super({
      ...options,
      name: "notification-manager"
    });
    this.SEND_TO_TIMEOUT = 5e3;
    this.on("ready", this.onReady.bind(this));
    this.on("stateChange", this.onStateChange.bind(this));
    this.on("unload", this.onUnload.bind(this));
    this.on("message", this.onMessage.bind(this));
  }
  async onMessage(obj) {
    if (obj.command === "getCategories") {
      const ioPackPath = require.resolve("iobroker.js-controller/io-package.json");
      const content = await import_fs.default.promises.readFile(ioPackPath, {
        encoding: "utf-8"
      });
      const ioPack = JSON.parse(content);
      this.sendTo(obj.from, obj.command, { notifications: ioPack.notifications }, obj.callback);
      return;
    }
    if (obj.command === "getSupportedMessengers") {
      const res = await this.getObjectViewAsync("system", "instance", {
        startkey: "system.adapter.",
        endkey: "system.adapter.\u9999"
      });
      const instances = res.rows.filter((row) => {
        var _a;
        return ((_a = row.value) == null ? void 0 : _a.common.type) === "messaging";
      }).map((obj2) => obj2.id.substring("system.adapter.".length));
      this.sendTo(obj.from, obj.command, { instances }, obj.callback);
      return;
    }
  }
  async onReady() {
    this.log.info("Starting notification manager ...");
    await this.subscribeForeignStates("system.host.*.notifications.*");
    await this.handleNotifications();
  }
  onUnload(callback) {
    callback();
  }
  async onStateChange(id, _state) {
    const hostName = id.split(".")[2];
    this.log.info(`New notification on "${hostName}" detected`);
    await this.handleNotifications([`system.host.${hostName}`]);
  }
  async handleNotifications(hosts) {
    hosts = hosts || await this.getAllHosts();
    for (const host of hosts) {
      this.log.debug(`Request notifications from "${host}"`);
      const { result: notifications } = await this.sendToHostAsync(
        host,
        "getNotifications",
        {}
      );
      this.log.debug(`Received notifications from "${host}": ${JSON.stringify(notifications)}`);
      await this.sendNotifications({ host, notifications });
    }
  }
  async getAllHosts() {
    const res = await this.getObjectViewAsync("system", "host", {
      startkey: "system.host.",
      endkey: "system.host.\u9999"
    });
    return res.rows.map((host) => host.id);
  }
  findResponsibleInstances(options) {
    var _a, _b, _c, _d;
    const { scopeId, categoryId, severity } = options;
    return {
      firstAdapter: {
        main: (_b = (_a = this.config.categories[scopeId]) == null ? void 0 : _a[categoryId]) == null ? void 0 : _b.firstAdapter,
        fallback: this.config.fallback[severity].firstAdapter
      },
      secondAdapter: {
        main: (_d = (_c = this.config.categories[scopeId]) == null ? void 0 : _c[categoryId]) == null ? void 0 : _d.secondAdapter,
        fallback: this.config.fallback[severity].secondAdapter
      }
    };
  }
  async sendNotifications(options) {
    const { notifications, host } = options;
    for (const [scopeId, scope] of Object.entries(notifications)) {
      for (const [categoryId, category] of Object.entries(scope.categories)) {
        const isActive = this.isCategoryActive({ scopeId, categoryId });
        if (!isActive) {
          this.log.debug(`Skip notification "${scopeId}.${categoryId}" because user opted-out`);
          continue;
        }
        const { firstAdapter, secondAdapter } = this.findResponsibleInstances({
          scopeId,
          categoryId,
          severity: category.severity
        });
        for (const configuredAdapter of [firstAdapter, secondAdapter]) {
          const adapterInstance = configuredAdapter.main || configuredAdapter.fallback;
          if (!adapterInstance) {
            return;
          }
          const bareScope = {
            name: scope.name,
            description: scope.description
          };
          this.log.info(`Send notification "${scopeId}.${categoryId}" to "${adapterInstance}"`);
          const localizedNotification = {
            host,
            scope: await this.localize(bareScope),
            category: await this.localize(category)
          };
          try {
            const res = await this.sendToAsync(
              adapterInstance,
              "sendNotification",
              localizedNotification,
              { timeout: this.SEND_TO_TIMEOUT }
            );
            if (typeof res === "object" && res.sent) {
              this.log.info(
                `Instance ${adapterInstance} successfully handled the notification for "${scopeId}.${categoryId}"`
              );
              await this.sendToHostAsync(host, "clearNotifications", {
                scopeFilter: scopeId,
                categoryFilter: categoryId
              });
              return;
            }
          } catch (e) {
            this.log.error(
              `Error appeared while sending notification "${scopeId}.${categoryId}" to "${adapterInstance}": ${e.message}`
            );
          }
          this.log.error(
            `Instance ${adapterInstance} could not handle the notification for "${scopeId}.${categoryId}"`
          );
        }
      }
    }
  }
  isCategoryActive(options) {
    var _a, _b;
    const { scopeId, categoryId } = options;
    return ((_b = (_a = this.config.categories[scopeId]) == null ? void 0 : _a[categoryId]) == null ? void 0 : _b.active) !== false;
  }
  async localize(scopeOrCategory) {
    const config = await this.getForeignObjectAsync("system.config");
    const lang = (config == null ? void 0 : config.common.language) || "en";
    const description = scopeOrCategory.description[lang];
    const name = scopeOrCategory.name[lang];
    return { ...scopeOrCategory, description, name };
  }
}
if (require.main !== module) {
  module.exports = (options) => new NotificationManager(options);
} else {
  (() => new NotificationManager())();
}
//# sourceMappingURL=main.js.map
