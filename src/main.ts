import * as utils from '@iobroker/adapter-core';

class NotificationManager extends utils.Adapter {
    public constructor(options: Partial<utils.AdapterOptions> = {}) {
        super({
            ...options,
            name: 'notification-manager',
        });
        this.on('ready', this.onReady.bind(this));
        this.on('stateChange', this.onStateChange.bind(this));
        this.on('unload', this.onUnload.bind(this));
    }

    /**
     * Is called when databases are connected and adapter received configuration.
     */
    private async onReady(): Promise<void> {
        this.log.info('Starting notifications manager ...');
        // TODO: later more generic approach if we have other notifications than system
        await this.subscribeForeignStates('system.host.*.notifications.system');
        // TODO perform initial check for notifications on adapter start start
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
    private onStateChange(id: string, state: ioBroker.State | null | undefined): void {
        // TODO: the notifications object has changed, check if a new notification has been registered
        // we need to cache the notifications object up from adapter start to check what is new
        // or we decide to clear the notifications in every case if we handled them, so that
        // all notifications which we should handle are new or need a new try
    }
}

if (require.main !== module) {
    // Export the constructor in compact mode
    module.exports = (options: Partial<utils.AdapterOptions> | undefined) => new NotificationManager(options);
} else {
    // otherwise start the instance directly
    (() => new NotificationManager())();
}
