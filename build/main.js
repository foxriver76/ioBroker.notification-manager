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
var import_node_fs = __toESM(require("node:fs"));
class NotificationManager extends utils.Adapter {
  SEND_TO_TIMEOUT = 5e3;
  SUPPORTED_USER_CATEGORIES = ["notify", "info", "alert"];
  USER_SCOPE = "user";
  CACHE_DELETION_TIME = 30 * 864e5;
  constructor(options = {}) {
    super({
      ...options,
      name: "notification-manager"
    });
    this.on("ready", this.onReady.bind(this));
    this.on("stateChange", this.onStateChange.bind(this));
    this.on("unload", this.onUnload.bind(this));
    this.on("message", this.onMessage.bind(this));
  }
  async onMessage(obj) {
    switch (obj.command) {
      case "getCategories":
        await this.handleGetCategoriesMessage(obj);
        break;
      case "getSupportedMessengers":
        await this.handleGetSupportedMessengersMessage(obj);
        break;
      case "sendTestMessage":
        await this.handleSendTestMessageMessage(obj);
        break;
      case "registerUserNotification":
        await this.handleRegisterUserNotificationMessage(obj);
        break;
      default:
        this.log.warn(`Unsupported message received "${obj.command}"`);
    }
  }
  async handleRegisterUserNotificationMessage(obj) {
    if (typeof obj.message !== "object") {
      return;
    }
    const { category, message } = obj.message;
    if (!this.SUPPORTED_USER_CATEGORIES.includes(category)) {
      this.sendTo(
        obj.from,
        obj.command,
        {
          success: false,
          error: `Unsupported category "${category}", please use one of "${this.SUPPORTED_USER_CATEGORIES.join(
            ", "
          )}"`
        },
        obj.callback
      );
    }
    await this.registerNotification(this.USER_SCOPE, category, message);
    this.sendTo(obj.from, obj.command, { success: true }, obj.callback);
  }
  async handleSendTestMessageMessage(obj) {
    if (typeof obj.message !== "object") {
      return;
    }
    const { scopeId, category } = obj.message;
    this.log.info(`Send test message for scope "${scopeId}" and category "${category}"`);
    await this.registerNotification(scopeId, category, "Test notification from notification-manager");
    this.sendTo(obj.from, obj.command, { ack: true }, obj.callback);
  }
  async handleGetSupportedMessengersMessage(obj) {
    const res = await this.getObjectViewAsync("system", "instance", {
      startkey: "system.adapter.",
      endkey: "system.adapter.\u9999"
    });
    const instances = res.rows.filter((row) => {
      var _a, _b;
      return (_b = (_a = row.value) == null ? void 0 : _a.common.supportedMessages) == null ? void 0 : _b.notifications;
    }).map((obj2) => obj2.id.substring("system.adapter.".length));
    this.sendTo(obj.from, obj.command, { instances }, obj.callback);
  }
  async handleGetCategoriesMessage(obj) {
    const ioPackPath = require.resolve("iobroker.js-controller/io-package.json");
    const content = await import_node_fs.default.promises.readFile(ioPackPath, {
      encoding: "utf-8"
    });
    const ioPack = JSON.parse(content);
    const notifications = ioPack.notifications || [];
    const res = await this.getObjectViewAsync("system", "adapter", {
      startkey: "system.adapter.",
      endkey: "system.adapter.\u9999"
    });
    for (const entry of res.rows) {
      if (entry.value.notifications) {
        notifications.push(...entry.value.notifications);
      }
    }
    this.sendTo(obj.from, obj.command, { notifications }, obj.callback);
  }
  async onReady() {
    this.log.info("Starting notification manager ...");
    await this.subscribeForeignStatesAsync("system.host.*.notifications.*");
    await this.handleNotifications();
  }
  onUnload(callback) {
    callback();
  }
  async onStateChange(id, _state) {
    const hostId = this.extractHostFromId(id);
    this.log.debug(`Notification update on "${hostId}" detected`);
    await this.handleNotifications([hostId]);
  }
  extractHostFromId(id) {
    const notificationsId = id.substring(0, id.lastIndexOf("."));
    const hostId = id.substring(0, notificationsId.lastIndexOf("."));
    return hostId;
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
        const isSuppressed = this.isCategorySuppressed({ scopeId, categoryId });
        if (isSuppressed) {
          this.log.debug(`Suppress notification "${scopeId}.${categoryId}"`);
          await this.sendToHostAsync(host, "clearNotifications", {
            scope: scopeId,
            category: categoryId
          });
          continue;
        }
        const isCached = await this.isNotificationCached({ scopeId, categoryId, category });
        if (isCached) {
          this.log.debug(
            `Skip notification for scope "${scopeId}" and category "${categoryId}", because already sent`
          );
          return;
        }
        const { firstAdapter, secondAdapter } = this.findResponsibleInstances({
          scopeId,
          categoryId,
          severity: category.severity
        });
        for (const configuredAdapter of [firstAdapter, secondAdapter]) {
          const adapterInstance = configuredAdapter.main || configuredAdapter.fallback;
          if (!adapterInstance) {
            continue;
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
            const res = await this.sendToAsync(adapterInstance, "sendNotification", localizedNotification, {
              timeout: this.SEND_TO_TIMEOUT
            });
            if (typeof res === "object" && res.sent) {
              this.log.info(
                `Instance ${adapterInstance} successfully handled the notification for "${scopeId}.${categoryId}"`
              );
              const deleteWithContextData = this.shouldDeleteWithContextData({ scopeId, categoryId });
              const hasContextData = this.hasContextData(category);
              if (!hasContextData || deleteWithContextData) {
                await this.sendToHostAsync(host, "clearNotifications", {
                  scope: scopeId,
                  category: categoryId
                });
                return;
              }
              if (hasContextData) {
                await this.cacheNotification({ scopeId, categoryId, category });
                await this.updateCache();
              }
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
  async cacheNotification(options) {
    var _a;
    const { scopeId, categoryId, category } = options;
    const ts = Object.values(category.instances)[0].messages[0].ts;
    const cacheState = (_a = await this.getStateAsync("cache")) == null ? void 0 : _a.val;
    let cache = [];
    if (typeof cacheState === "string") {
      cache = JSON.parse(cacheState);
    }
    cache.push({ scopeId, categoryId, ts });
    await this.setState("cache", JSON.stringify(cache), true);
  }
  async updateCache() {
    var _a;
    const cacheState = (_a = await this.getStateAsync("cache")) == null ? void 0 : _a.val;
    let cache = [];
    if (typeof cacheState === "string") {
      cache = JSON.parse(cacheState);
    }
    cache = cache.filter((cachedEntry) => cachedEntry.ts > Date.now() - this.CACHE_DELETION_TIME);
    await this.setState("cache", JSON.stringify(cache), true);
  }
  async isNotificationCached(options) {
    var _a;
    const { scopeId, category, categoryId } = options;
    const cacheState = (_a = await this.getStateAsync("cache")) == null ? void 0 : _a.val;
    let cache = [];
    if (typeof cacheState === "string") {
      cache = JSON.parse(cacheState);
    }
    for (const cachedEntry of cache) {
      if (cachedEntry.scopeId !== scopeId || cachedEntry.categoryId !== categoryId) {
        continue;
      }
      const alreadySent = Object.values(category.instances).some(
        (instance) => instance.messages.some((message) => message.ts === cachedEntry.ts)
      );
      if (alreadySent) {
        return true;
      }
    }
    return false;
  }
  isCategoryActive(options) {
    var _a, _b;
    const { scopeId, categoryId } = options;
    return ((_b = (_a = this.config.categories[scopeId]) == null ? void 0 : _a[categoryId]) == null ? void 0 : _b.active) !== false;
  }
  hasContextData(category) {
    return Object.values(category.instances).some(
      (instance) => instance.messages.some((message) => !!message.contextData)
    );
  }
  isCategorySuppressed(options) {
    var _a, _b;
    const { scopeId, categoryId } = options;
    return !!((_b = (_a = this.config.categories[scopeId]) == null ? void 0 : _a[categoryId]) == null ? void 0 : _b.suppress);
  }
  shouldDeleteWithContextData(options) {
    var _a, _b;
    const { scopeId, categoryId } = options;
    return !!((_b = (_a = this.config.categories[scopeId]) == null ? void 0 : _a[categoryId]) == null ? void 0 : _b.deleteWithContextData);
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
