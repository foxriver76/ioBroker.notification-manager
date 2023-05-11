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
    this.log.info("Starting notifications manager ...");
    await this.subscribeForeignStates("system.host.*.notifications.system");
  }
  onUnload(callback) {
    callback();
  }
  onStateChange(_id, _state) {
  }
}
if (require.main !== module) {
  module.exports = (options) => new NotificationManager(options);
} else {
  (() => new NotificationManager())();
}
//# sourceMappingURL=main.js.map
