import MySqlConnetion from './connection/MySqlConnection.js';
import loadScript from './scripts/loadScript.js';

export default class DatabaseManager {
    #connection;
    #logger;
    #config;

    constructor({ config, logger }) {
        this.#logger = logger;
        this.#config = config;
    }

    get connection() {
        if (this.#connection) {
            return this.#connection;
        }

        this.#connection = MySqlConnetion.getConnection({
            dbHost: this.#config.DB_HOST,
            dbName: this.#config.DB_DATABASE_NAME,
            dbPass: this.#config.DB_ROOT_PASSWORD,
            dbUser: this.#config.DB_USER,
            dbPort: this.#config.DB_PORT,
        });

        return this.#connection;
    }

    async #executeScripts() {
        const script = await loadScript();
        this.#logger.info(`[DBMANAGER] Executing database scripts: ${script}`);
        const promises = script.map((s) => this.connection.execute(s));
        await Promise.all(promises);
    }

    async init() {
        this.#logger.info('[DBMANAGER] Connecting with database');
        await this.#executeScripts();
        this.#logger.info('[DBMANAGER] Connected with success');
    }
}