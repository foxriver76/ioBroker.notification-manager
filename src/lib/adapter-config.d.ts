// This file extends the AdapterConfig type from "@types/iobroker"
interface ConfiguredCategories {
    [scope: string]: {
        [category: string]: {
            /** Try to first let this adapter handle the notification */
            firstAdapter: string;
            /** If first adapter fails, try this one */
            secondAdapter: string;
        };
    };
}

// Augment the globally declared type ioBroker.AdapterConfig
declare global {
    namespace ioBroker {
        interface AdapterConfig {
            categories: ConfiguredCategories;
        }
    }
}

// this is required so the above AdapterConfig is found by TypeScript / type checking
export {};
