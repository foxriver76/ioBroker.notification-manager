// This file extends the AdapterConfig type from "@types/iobroker"
type Severity = 'info' | 'notify' | 'alert';

interface ConfiguredAdapters {
    /** Try to first let this adapter handle the notification */
    firstAdapter: string;
    /** If first adapter fails, try this one */
    secondAdapter: string;
}

type FallbackConfiguration = {
    [key in Severity]: ConfiguredAdapters;
};

interface ConfiguredCategories {
    [scope: string]: {
        [category: string]: ConfiguredAdapters;
    };
}

// Augment the globally declared type ioBroker.AdapterConfig
declare global {
    namespace ioBroker {
        interface AdapterConfig {
            categories: ConfiguredCategories;
            fallback: FallbackConfiguration;
        }
    }
}

// this is required so the above AdapterConfig is found by TypeScript / type checking
export {};
