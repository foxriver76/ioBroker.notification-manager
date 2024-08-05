/* eslint-disable no-undef */
'use strict';

if (typeof goog !== 'undefined') {
    goog.provide('Blockly.JavaScript.Sendto');
    goog.require('Blockly.JavaScript');
}

Blockly.Translate =
    Blockly.Translate ||
    function (word, lang) {
        lang = lang || systemLang;
        if (Blockly.Words && Blockly.Words[word]) {
            return Blockly.Words[word][lang] || Blockly.Words[word].en;
        } else {
            return word;
        }
    };

// --- SendTo Notification Manager --------------------------------------------------
Blockly.Words['notification-manager'] = {
    en: 'Notification Manager',
    de: 'Benachrichtigungsmanager',
    ru: 'Менеджер уведомлений',
    pt: 'Gerenciador de notificações',
    nl: 'Meldingsbeheerder',
    fr: 'Gestionnaire de notifications',
    it: 'Responsabile delle notifiche',
    es: 'Administrador de notificaciones',
    pl: 'Menedżer powiadomień',
    uk: 'Менеджер сповіщень',
    'zh-cn': '通知管理器'
};
Blockly.Words['notification-manager_message'] = {
    en: 'Message text',
    de: 'Mitteilungstext',
    ru: 'Текст сообщения',
    pt: 'Texto da mensagem',
    nl: 'Berichttekst',
    fr: 'Texte du message',
    it: 'Testo del messaggio',
    es: 'Texto del mensaje',
    pl: 'Tekst wiadomości',
    uk: 'Текст повідомлення',
    'zh-cn': '信件文本'
};
Blockly.Words['notification-manager_category'] = {
    en: 'Category',
    de: 'Kategorie',
    ru: 'Категория',
    pt: 'Categoria',
    nl: 'Categorie',
    fr: 'Catégorie',
    it: 'Categoria',
    es: 'Categoría',
    pl: 'Kategoria',
    uk: 'Категорії',
    'zh-cn': '类别'
};
Blockly.Words['notification-manager_anyInstance'] = {
    en: 'All instances',
    de: 'Alle Instanzen',
    ru: 'Все экземпляры',
    pt: 'Todas as instâncias',
    nl: 'Alle instanties',
    fr: 'Toutes les instances',
    it: 'Tutte le istanze',
    es: 'Todas las instancias',
    pl: 'Wszystkie instancje',
    uk: 'Всі екземпляри',
    'zh-cn': '所有案件'
};
Blockly.Words['notification-manager_informal'] = {
    en: 'Informal',
    de: 'Informell',
    ru: 'Неформальное',
    pt: 'Informal',
    nl: 'Informeel',
    fr: 'Séance informelle',
    it: 'Informazioni',
    es: 'Consultas oficiosas',
    pl: 'Nieformalne',
    uk: 'Неформатний',
    'zh-cn': '非正式'
};
Blockly.Words['notification-manager_info'] = {
    en: 'Important',
    de: 'Wichtig',
    ru: 'Важное значение',
    pt: 'Importante',
    nl: 'Belangrijk',
    fr: 'Important',
    it: 'Importante',
    es: 'Importante',
    pl: 'Ważne',
    uk: 'Головна',
    'zh-cn': '重要'
};
Blockly.Words['notification-manager_alert'] = {
    en: 'Alarming',
    de: 'Alarmierend',
    ru: 'Оружие',
    pt: 'Alarme',
    nl: 'Alarmering',
    fr: 'Alarme',
    it: 'Allarme',
    es: 'Alarma',
    pl: 'Alarm',
    uk: 'Розведення',
    'zh-cn': '警报'
};
Blockly.Words['notification-manager_help'] = {
    en: 'https://github.com/foxriver76/ioBroker.notification-manager/blob/main/README.md',
    de: 'https://github.com/foxriver76/ioBroker.notification-manager/blob/main/README.md'
};

Blockly.Sendto.blocks['notification-manager'] =
    '<block type="notification-manager">' +
    '  <field name="INSTANCE"></field>' +
    '  <field name="CATEGORY">notify</field>' +
    '  <value name="MESSAGE">' +
    '    <shadow type="text">' +
    '      <field name="TEXT">Text</field>' +
    '    </shadow>' +
    '  </value>' +
    '</block>';

Blockly.Blocks['notification-manager'] = {
    init: function () {
        const options = [];

        if (typeof main !== 'undefined' && main.instances) {
            for (let i = 0; i < main.instances.length; i++) {
                const m = main.instances[i].match(/^system.adapter.notification-manager.(\d+)$/);
                if (m) {
                    const n = parseInt(m[1], 10);
                    options.push(['notification-manager.' + n, '.' + n]);
                }
            }
        }

        if (!options.length) {
            for (let k = 0; k <= 4; k++) {
                options.push(['notification-manager.' + k, '.' + k]);
            }
        }

        options.unshift([Blockly.Translate('notification-manager_anyInstance'), '']);

        this.appendDummyInput('INSTANCE')
            .appendField(Blockly.Translate('notification-manager'))
            .appendField(new Blockly.FieldDropdown(options), 'INSTANCE');

        this.appendValueInput('MESSAGE').appendField(Blockly.Translate('notification-manager_message'));

        this.appendDummyInput('CATEGORY')
            .appendField(Blockly.Translate('notification-manager_category'))
            .appendField(
                new Blockly.FieldDropdown([
                    [Blockly.Translate('notification-manager_informal'), 'notify'],
                    [Blockly.Translate('notification-manager_info'), 'info'],
                    [Blockly.Translate('notification-manager_alert'), 'alert']
                ]),
                'CATEGORY'
            );

        this.setInputsInline(false);
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);

        this.setColour(Blockly.Sendto.HUE);
        this.setHelpUrl(Blockly.Translate('notification-manager_help'));
    }
};

Blockly.JavaScript['notification-manager'] = function (block) {
    const instance = block.getFieldValue('INSTANCE');
    const category = block.getFieldValue('CATEGORY');
    const message = Blockly.JavaScript.valueToCode(block, 'MESSAGE', Blockly.JavaScript.ORDER_ATOMIC);

    return (
        `sendTo('notification-manager${instance}', 'registerUserNotification', {\n` +
        `  category: '${category}',\n` +
        `  message: ${message}\n` +
        `});`
    );
};
