import { asClass, asFunction, asValue, createContainer } from 'awilix';
import GameServer from './interface/server/GameServer.js';
import Logger from '../core/infra/logger/Logger.js';
import Packets from '../core/interface/networking/packets/Packets.js';
import DatabaseManager from '../core/infra/database/DatabaseManager.js';
import Config from './infra/config/Config.js';
import CacheProvider from '../core/infra/cache/CacheProvider.js';
import World from '../core/domain/World.js';
import PlayerRepository from './infra/database/PlayerRepository.js';

const container = createContainer();

container.register({
    containerInstance: asValue(container),
    server: asClass(GameServer).singleton(),
    logger: asFunction(Logger).singleton(),
    config: asFunction(Config).singleton(),
    packets: asFunction(Packets).singleton(),
    databaseManager: asClass(DatabaseManager).singleton(),
    world: asClass(World).singleton(),
    cacheProvider: asClass(CacheProvider).singleton(),
    playerRepository: asClass(PlayerRepository).singleton(),
});

export { container };
