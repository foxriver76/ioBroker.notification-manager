import * as utils from '@iobroker/adapter-core';
import fs from 'fs';

interface GetNotificationsResponse {
    result: NotificationsObject;
}

type HostId = `system.host.${string}`;

type Severity = 'alert' | 'info' | 'notify';

interface NotificationCategory {
    instances: {
        [adapterInstance: string]: {
            messages: NotificationInstanceMessage[];
        };
    };
    /** i18n description of category */
    description: Record<string, string>;
    /** i18n name of category */
    name: Record<string, string>;
    severity: Severity;
}

/** Notifications category where i18n objects are already translated */
interface LocalizedNotificationCategory extends Omit<NotificationCategory, 'description' | 'name'> {
    description: string;
    name: string;
}

interface NotificationScope {
    /** i18n description of scope */
    description: Record<string, string>;
    /** i18n name of scope */
    name: Record<string, string>;
    categories: {
        [category: string]: NotificationCategory;
    };
}

/** Notifications scope where i18n objects are already translated */
interface LocalizedNotificationScope extends Omit<NotificationScope, 'description' | 'name'> {
    description: string;
    name: string;
}

interface NotificationsObject {
    [scope: string]: NotificationScope;
}

interface NotificationInstanceMessage {
    message: string;
    ts: number;
}

interface SendNotificationsOptions {
    /** hostname system.host.xy */
    host: string;
    /** the received notifications from controller */
    notifications: NotificationsObject;
}

interface FindInstanceOptions {
    /** id of the scope */
    scopeId: string;
    /** id of the category */
    categoryId: string;
    /** Severity of this category */
    severity: Severity;
}

interface CategoryActiveCheckOptions {
    /** id of the scope */
    scopeId: string;
    /** id of the category */
    categoryId: string;
}

interface ResponsibleInstances {
    firstAdapter: {
        /** highest priority adapter instance */
        main?: string;
        /** second priority adapter instance */
        fallback: string;
    };
    secondAdapter: {
        /** Fallback instance for the first instance */
        main?: string;
        /** Fallback instance for the second instance */
        fallback: string;
    };
}

interface LocalizedNotification {
    /** host where the notification belongs too */
    host: string;
    /** The localized scope of the notification */
    scope: Omit<LocalizedNotificationScope, 'categories'>;
    /** The localized category of the notification */
    category: LocalizedNotificationCategory;
}

class NotificationManager extends utils.Adapter {
    /** Timeout to wait for response by instances on sendTo */
    private readonly SEND_TO_TIMEOUT = 5_000;
    public constructor(options: Partial<utils.AdapterOptions> = {}) {
        super({
            ...options,
            name: 'notification-manager',
        });
        this.on('ready', this.onReady.bind(this));
        this.on('stateChange', this.onStateChange.bind(this));
        this.on('unload', this.onUnload.bind(this));
        this.on('message', this.onMessage.bind(this));
    }

    /**
     * Listen to messages from frontend
     */
    private async onMessage(obj: ioBroker.Message): Promise<void> {
        if (obj.command === 'getCategories') {
            const ioPackPath = require.resolve('iobroker.js-controller/io-package.json');

            const content = await fs.promises.readFile(ioPackPath, {
                encoding: 'utf-8',
            });

            const ioPack = JSON.parse(content);

            this.sendTo(obj.from, obj.command, { notifications: ioPack.notifications }, obj.callback);
            return;
        }

        if (obj.command === 'getSupportedMessengers') {
            const res = await this.getObjectViewAsync('system', 'instance', {
                startkey: 'system.adapter.',
                endkey: 'system.adapter.\u9999',
            });

            const instances = res.rows
                // @ts-expect-error types are wrong
                .filter((row) => row.value?.common.type === 'messaging')
                .map((obj) => obj.id.substring('system.adapter.'.length));

            this.sendTo(obj.from, obj.command, { instances }, obj.callback);
            return;
        }
    }

    /**
     * Is called when databases are connected and adapter received configuration.
     */
    private async onReady(): Promise<void> {
        this.log.info('Starting notification manager ...');
        await this.subscribeForeignStates('system.host.*.notifications.*');
        await this.handleNotifications();
    }

    /**
     * Is called when adapter shuts down - callback has to be called under any circumstances!
     */
    private onUnload(callback: () => void): void {
        callback();
    }

    /**
     * Is called if a subscribed state changes
     */
    private async onStateChange(id: string, _state: ioBroker.State | null | undefined): Promise<void> {
        const hostName = id.split('.')[2];
        this.log.info(`New notification on "${hostName}" detected`);
        await this.handleNotifications([`system.host.${hostName}`]);
    }

    /**
     * Checks for existing notifications and handles them according to the configuration
     *
     * @param hosts names of the hosts to handle notifications for, if omitted all hosts are used
     */
    private async handleNotifications(hosts?: HostId[]): Promise<void> {
        hosts = hosts || (await this.getAllHosts());

        for (const host of hosts) {
            this.log.debug(`Request notifications from "${host}"`);

            const { result: notifications } = (await this.sendToHostAsync(
                host,
                'getNotifications',
                {},
            )) as unknown as GetNotificationsResponse;

            this.log.debug(`Received notifications from "${host}": ${JSON.stringify(notifications)}`);

            await this.sendNotifications({ host, notifications });
        }
    }

    /**
     * Get all existing hosts of this installation
     */
    private async getAllHosts(): Promise<HostId[]> {
        const res = await this.getObjectViewAsync('system', 'host', {
            startkey: 'system.host.',
            endkey: 'system.host.\u9999',
        });

        return res.rows.map((host) => host.id as HostId);
    }

    /**
     * Find the adapter instances configured for the scope and category
     *
     * @param options scope and category for the instances
     */
    private findResponsibleInstances(options: FindInstanceOptions): ResponsibleInstances {
        const { scopeId, categoryId, severity } = options;

        return {
            firstAdapter: {
                main: this.config.categories[scopeId]?.[categoryId]?.firstAdapter,
                fallback: this.config.fallback[severity].firstAdapter,
            },
            secondAdapter: {
                main: this.config.categories[scopeId]?.[categoryId]?.secondAdapter,
                fallback: this.config.fallback[severity].secondAdapter,
            },
        };
    }

    /**
     * Sends notifications if configured
     *
     * @param options configure hostname and corresponding notifications object
     */
    private async sendNotifications(options: SendNotificationsOptions): Promise<void> {
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
                    severity: category.severity,
                });

                for (const configuredAdapter of [firstAdapter, secondAdapter]) {
                    const adapterInstance = configuredAdapter.main || configuredAdapter.fallback;
                    if (!adapterInstance) {
                        // if first not configured but second, do nothing
                        return;
                    }

                    const bareScope: Omit<NotificationScope, 'categories'> = {
                        name: scope.name,
                        description: scope.description,
                    };

                    this.log.info(`Send notification "${scopeId}.${categoryId}" to "${adapterInstance}"`);

                    const localizedNotification: LocalizedNotification = {
                        host,
                        scope: await this.localize(bareScope),
                        category: await this.localize(category),
                    };

                    try {
                        const res = await this.sendToAsync(
                            adapterInstance,
                            'sendNotification',
                            localizedNotification,
                            // @ts-expect-error the option is controller v5 only
                            { timeout: this.SEND_TO_TIMEOUT },
                        );

                        // @ts-expect-error types are wrong, this is a callback not a new message
                        if (typeof res === 'object' && res.sent) {
                            this.log.info(
                                `Instance ${adapterInstance} successfully handled the notification for "${scopeId}.${categoryId}"`,
                            );

                            await this.sendToHostAsync(host, 'clearNotifications', {
                                scopeFilter: scopeId,
                                categoryFilter: categoryId,
                            });
                            return;
                        }
                    } catch (e: any) {
                        this.log.error(
                            `Error appeared while sending notification "${scopeId}.${categoryId}" to "${adapterInstance}": ${e.message}`,
                        );
                    }

                    this.log.error(
                        `Instance ${adapterInstance} could not handle the notification for "${scopeId}.${categoryId}"`,
                    );
                }
            }
        }
    }

    /**
     * Check if the category is active or opted out by the user
     *
     * @param options scope and category information
     */
    private isCategoryActive(options: CategoryActiveCheckOptions): boolean {
        const { scopeId, categoryId } = options;
        return this.config.categories[scopeId]?.[categoryId]?.active !== false;
    }

    /**
     * Transform scope or category to the localized version
     *
     * @param scopeOrCategory a notifications scope or category
     */
    private async localize<T extends Omit<NotificationScope, 'categories'> | NotificationCategory>(
        scopeOrCategory: T,
    ): Promise<T & { name: string; description: string }> {
        const config = await this.getForeignObjectAsync('system.config');

        const lang = config?.common.language || 'en';

        const description = scopeOrCategory.description[lang];
        const name = scopeOrCategory.name[lang];

        return { ...scopeOrCategory, description, name };
    }
}

if (require.main !== module) {
    // Export the constructor in compact mode
    module.exports = (options: Partial<utils.AdapterOptions> | undefined) => new NotificationManager(options);
} else {
    // otherwise start the instance directly
    (() => new NotificationManager())();
}
