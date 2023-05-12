![Logo](admin/notification-manager.png)
# ioBroker.notification-manager

[![NPM version](https://img.shields.io/npm/v/iobroker.notification-manager.svg)](https://www.npmjs.com/package/iobroker.notification-manager)
[![Downloads](https://img.shields.io/npm/dm/iobroker.notification-manager.svg)](https://www.npmjs.com/package/iobroker.notification-manager)
![Number of Installations](https://iobroker.live/badges/notification-manager-installed.svg)
![Current version in stable repository](https://iobroker.live/badges/notification-manager-stable.svg)

[![NPM](https://nodei.co/npm/iobroker.notification-manager.png?downloads=true)](https://nodei.co/npm/iobroker.notification-manager/)

**Tests:** ![Test and Release](https://github.com/foxriver76/ioBroker.notification-manager/workflows/Test%20and%20Release/badge.svg)

## notification-manager adapter for ioBroker
Manage ioBroker notifications, e.g. by sending them as messages

### General description
This adapter allows to redirect the ioBroker internal `Notifications` to messenger adapters which support 
the `Notification System`. If you are missing an adapter, please open a ticket on the corresponding adapter.

### Requirements for messaging adapters
Please set the `common.supportedMessages.notifications` flag to `true` in your `io-package.json`.

Whenever a new notification should be delivered via the messaging adapter, `notification-manager` will send a message
to the configured instance. 

The messages has the following structure: 

```json
{
  "host": "system.host.moritz-ThinkPad-P16-Gen-1",
  "category": {
    "instances": {
      "system.adapter.backitup.0": {
        "messages": [
          {
            "message": "Restart loop detected",
            "ts": 1683875665677
          }
        ]
      }
    },
    "description": {
      "en": "An adapter instance is frequently crashing on startup and was stopped because of this. The log file needs to be checked before restarting the instance.",
      "de": "Eine Adapterinstanz stürzt beim Start häufig ab und wurde aus diesem Grund gestoppt. Die Protokolldatei muss vor dem Neustart der Instanz überprüft werden.",
      "ru": "Экземпляр адаптера часто дает сбой при запуске и был остановлен из-за этого. Перед перезапуском экземпляра необходимо проверить файл журнала.",
      "pt": "Uma instância do adaptador frequentemente falha na inicialização e foi interrompida por causa disso. O arquivo de log precisa ser verificado antes de reiniciar a instância.",
      "nl": "Een adapterinstantie crasht vaak bij het opstarten en is hierdoor gestopt. Het logboekbestand moet worden gecontroleerd voordat het exemplaar opnieuw wordt opgestart.",
      "fr": "Une instance d'adaptateur plante fréquemment au démarrage et a été arrêtée à cause de cela. Le fichier journal doit être vérifié avant de redémarrer l'instance.",
      "it": "Un'istanza dell'adattatore si blocca spesso all'avvio ed è stata interrotta per questo motivo. Il file di registro deve essere controllato prima di riavviare l'istanza.",
      "es": "Una instancia de adaptador falla con frecuencia al iniciarse y se detuvo debido a esto. Es necesario comprobar el archivo de registro antes de reiniciar la instancia.",
      "pl": "Instancja adaptera często ulega awarii podczas uruchamiania i została z tego powodu zatrzymana. Plik dziennika należy sprawdzić przed ponownym uruchomieniem instancji.",
      "zh-cn": "适配器实例在启动时经常崩溃，因此已被停止。重新启动实例之前，需要检查日志文件。"
    },
    "name": {
      "en": "Issues with frequently crashing adapter instances",
      "de": "Probleme mit häufig abstürzenden Adapterinstanzen",
      "ru": "Проблемы с частыми сбоями экземпляров адаптера",
      "pt": "Problemas com falhas frequentes de instâncias do adaptador",
      "nl": "Problemen met vaak crashende adapterinstanties",
      "fr": "Problèmes avec les instances d'adaptateur qui plantent fréquemment",
      "it": "Problemi con le istanze dell'adattatore che si arrestano frequentemente",
      "es": "Problemas con instancias de adaptador que fallan con frecuencia",
      "pl": "Problemy z często zawieszającymi się instancjami adaptera",
      "zh-cn": "适配器实例频繁崩溃的问题"
    },
    "severity": "alert"
  },
  "scope": {
    "categories": {
      "restartLoop": {
        "instances": {
          "system.adapter.backitup.0": {
            "messages": [
              {
                "message": "Restart loop detected",
                "ts": 1683875665677
              }
            ]
          }
        },
        "description": {
          "en": "An adapter instance is frequently crashing on startup and was stopped because of this. The log file needs to be checked before restarting the instance.",
          "de": "Eine Adapterinstanz stürzt beim Start häufig ab und wurde aus diesem Grund gestoppt. Die Protokolldatei muss vor dem Neustart der Instanz überprüft werden.",
          "ru": "Экземпляр адаптера часто дает сбой при запуске и был остановлен из-за этого. Перед перезапуском экземпляра необходимо проверить файл журнала.",
          "pt": "Uma instância do adaptador frequentemente falha na inicialização e foi interrompida por causa disso. O arquivo de log precisa ser verificado antes de reiniciar a instância.",
          "nl": "Een adapterinstantie crasht vaak bij het opstarten en is hierdoor gestopt. Het logboekbestand moet worden gecontroleerd voordat het exemplaar opnieuw wordt opgestart.",
          "fr": "Une instance d'adaptateur plante fréquemment au démarrage et a été arrêtée à cause de cela. Le fichier journal doit être vérifié avant de redémarrer l'instance.",
          "it": "Un'istanza dell'adattatore si blocca spesso all'avvio ed è stata interrotta per questo motivo. Il file di registro deve essere controllato prima di riavviare l'istanza.",
          "es": "Una instancia de adaptador falla con frecuencia al iniciarse y se detuvo debido a esto. Es necesario comprobar el archivo de registro antes de reiniciar la instancia.",
          "pl": "Instancja adaptera często ulega awarii podczas uruchamiania i została z tego powodu zatrzymana. Plik dziennika należy sprawdzić przed ponownym uruchomieniem instancji.",
          "zh-cn": "适配器实例在启动时经常崩溃，因此已被停止。重新启动实例之前，需要检查日志文件。"
        },
        "name": {
          "en": "Issues with frequently crashing adapter instances",
          "de": "Probleme mit häufig abstürzenden Adapterinstanzen",
          "ru": "Проблемы с частыми сбоями экземпляров адаптера",
          "pt": "Problemas com falhas frequentes de instâncias do adaptador",
          "nl": "Problemen met vaak crashende adapterinstanties",
          "fr": "Problèmes avec les instances d'adaptateur qui plantent fréquemment",
          "it": "Problemi con le istanze dell'adattatore che si arrestano frequentemente",
          "es": "Problemas con instancias de adaptador que fallan con frecuencia",
          "pl": "Problemy z często zawieszającymi się instancjami adaptera",
          "zh-cn": "适配器实例频繁崩溃的问题"
        },
        "severity": "alert"
      }
    },
    "description": {
      "en": "These notifications are collected by the ioBroker system and point to issues you should check and fix.",
      "de": "Diese Benachrichtigungen werden vom ioBroker-System erfasst und weisen auf Probleme hin, die überprüft und behoben werden sollten.",
      "ru": "Эти уведомления собираются системой ioBroker и указывают на проблемы, которые вы должны проверить и исправить.",
      "pt": "Essas notificações são coletadas pelo sistema ioBroker e apontam para problemas que você deve verificar e corrigir.",
      "nl": "Deze meldingen worden verzameld door het ioBroker-systeem en wijzen op problemen die u moet controleren en oplossen.",
      "fr": "Ces notifications sont collectées par le système ioBroker et indiquent des problèmes que vous devez vérifier et résoudre.",
      "it": "Queste notifiche vengono raccolte dal sistema ioBroker e indicano problemi che dovresti controllare e correggere.",
      "es": "Estas notificaciones son recopiladas por el sistema ioBroker y señalan problemas que debe verificar y solucionar.",
      "pl": "Te powiadomienia są zbierane przez system ioBroker i wskazują problemy, które należy sprawdzić i naprawić.",
      "zh-cn": "这些通知由ioBroker系统收集，并指出您应检查并修复的问题"
    },
    "name": {
      "en": "System Notifications",
      "de": "System-Benachrichtigungen",
      "ru": "Системные уведомления",
      "pt": "Notificações do sistema",
      "nl": "Systeemmeldingen",
      "fr": "Notifications système",
      "it": "Notifiche di sistema",
      "es": "Notificaciones del sistema",
      "pl": "Powiadomienia systemowe",
      "zh-cn": "系统通知"
    }
  }
}
```

Where `category.instances` shows the affected adapter instances for this notification. 
Additionally, the category has an i18n description and an i18n name. 
The same properties exist for the scope of the category. Additionally, the affected host is included.

After sending the notification, the `notification-manager` expects an answer with the property `{ handled: true }` 
if the messaging adapter was able to deliver the notification, else it should respond with `{ handled: false }`.

## Changelog
<!--
    Placeholder for the next version (at the beginning of the line):
    ### **WORK IN PROGRESS**
-->

### **WORK IN PROGRESS**
* (foxriver76) initial release

## License
MIT License

Copyright (c) 2023 foxriver76 <moritz.heusinger@gmail.com>

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

Icon made by "Good Ware" from www.flaticon.com