const dotenv = require("dotenv");

let ENV_FILE_NAME = "";
switch (process.env.NODE_ENV) {
    case "production":
        ENV_FILE_NAME = ".env.production";
        break;
    case "staging":
        ENV_FILE_NAME = ".env.staging";
        break;
    case "test":
        ENV_FILE_NAME = ".env.test";
        break;
    case "development":
    default:
        ENV_FILE_NAME = ".env";
        break;
}

try {
    dotenv.config({path: process.cwd() + "/" + ENV_FILE_NAME});
} catch (e) {
}

// CORS when consuming Medusa from admin
const ADMIN_CORS =
    process.env.ADMIN_CORS || "http://localhost:7000,http://localhost:7001";

// CORS to avoid issues when consuming Medusa from a client
const STORE_CORS = process.env.STORE_CORS || "http://localhost:8000";

const DATABASE_URL =
    process.env.DATABASE_URL || "postgres://localhost/medusa-starter-default-v1";

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

const plugins = [
    `medusa-fulfillment-manual`,
    `medusa-payment-manual`,
    {
        resolve: `medusa-file-spaces`,
        options: {
            spaces_url: process.env.SPACE_URL,
            bucket: process.env.SPACE_BUCKET,
            region: process.env.SPACE_REGION,
            endpoint: process.env.SPACE_ENDPOINT,
            access_key_id: process.env.SPACE_ACCESS_KEY_ID,
            secret_access_key: process.env.SPACE_SECRET_ACCESS_KEY,
        },
    },
    {
        resolve: `medusa-plugin-sendgrid`,
        options: {
            api_key: process.env.SENDGRID_API_KEY,
            from: process.env.SENDGRID_FROM,
            order_placed_template:
            process.env.SENDGRID_ORDER_PLACED_ID,
            localization: {
                "de-DE": { // locale key
                    order_placed_template:
                    process.env.SENDGRID_ORDER_PLACED_ID_LOCALIZED,
                },
            },
        },
    },
    {
        resolve: `medusa-payment-paypal`,
        options: {
            sandbox: process.env.PAYPAL_SANDBOX,
            clientId: process.env.PAYPAL_CLIENT_ID,
            clientSecret: process.env.PAYPAL_CLIENT_SECRET,
            authWebhookId: process.env.PAYPAL_AUTH_WEBHOOK_ID,
        },
    },
    {
        resolve: `medusa-payment-stripe`,
        options: {
            api_key: process.env.STRIPE_API_KEY,
            webhook_secret: process.env.STRIPE_WEBHOOK_SECRET,
        },
    },
    {
        resolve: "@medusajs/admin",
        /** @type {import('@medusajs/admin').PluginOptions} */
        options: {
            autoRebuild: true,
            develop: {
                open: process.env.OPEN_BROWSER !== "false",
            },
        },
    },
];

const modules = {
    eventBus: {
        resolve: "@medusajs/event-bus-redis",
        options: {
            redisUrl: REDIS_URL
        }
    },
    cacheService: {
        resolve: "@medusajs/cache-redis",
        options: {
            redisUrl: REDIS_URL,
            ttl: 60,
        }
    },
};

/** @type {import('@medusajs/medusa').ConfigModule["projectConfig"]} */
const projectConfig = {
    jwtSecret: process.env.JWT_SECRET,
    cookieSecret: process.env.COOKIE_SECRET,
    store_cors: STORE_CORS,
    database_url: DATABASE_URL,
    admin_cors: ADMIN_CORS,
    redis_url: REDIS_URL
};

/** @type {import('@medusajs/medusa').ConfigModule} */
module.exports = {
    projectConfig,
    plugins,
    modules,
};

