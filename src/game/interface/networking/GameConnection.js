import PlayerEventsEnum from '../../../core/domain/entities/game/player/events/PlayerEventsEnum.js';
import ConnectionStateEnum from '../../../core/enum/ConnectionStateEnum.js';
import PointsEnum from '../../../core/enum/PointsEnum.js';
import Connection from '../../../core/interface/networking/Connection.js';
import CharacterInfoPacket from '../../../core/interface/networking/packets/packet/out/CharacterInfoPacket.js';
import CharacterMoveOutPacket from '../../../core/interface/networking/packets/packet/out/CharacterMoveOutPacket.js';
import CharacterPointChangePacket from '../../../core/interface/networking/packets/packet/out/CharacterPointChangePacket.js';
import CharacterPointsPacket from '../../../core/interface/networking/packets/packet/out/CharacterPointsPacket.js';
import CharacterSpawnPacket from '../../../core/interface/networking/packets/packet/out/CharacterSpawnPacket.js';
import ChatOutPacket from '../../../core/interface/networking/packets/packet/out/ChatOutPacket.js';
import RemoveCharacterPacket from '../../../core/interface/networking/packets/packet/out/RemoveCharacterPacket.js';
import TeleportPacket from '../../../core/interface/networking/packets/packet/out/TeleportPacket.js';
import Ip from '../../../core/util/Ip.js';
import Queue from '../../../core/util/Queue.js';

const OUTGOING_MESSAGES_PER_CON_QUEUE_SIZE = 1000;

// const hexString = (buffer) =>
//     buffer.reduce((acc, byte, index) => {
//         // Convertendo o byte para uma string hexadecimal, garantindo dois dígitos e letras maiúsculas
//         const hex = byte.toString(16).padStart(2, '0').toUpperCase();
//         // Adicionando o traço de separação, exceto no primeiro byte
//         return acc + (index > 0 ? '-' : '') + hex;
//     }, '');

export default class GameConnection extends Connection {
    #accountId;
    #outgoingMessages = new Queue(OUTGOING_MESSAGES_PER_CON_QUEUE_SIZE);
    #player;
    #logoutService;
    #config;

    constructor({ logger, socket, logoutService, config }) {
        super({ logger, socket });
        this.#logoutService = logoutService;
        this.#config = config;
    }

    set accountId(value) {
        this.#accountId = value;
    }

    get accountId() {
        return this.#accountId;
    }

    set player(newPlayer) {
        this.#player = newPlayer;
        this.#player.subscribe(PlayerEventsEnum.OTHER_CHARACTER_UPDATED, this.#onOtherCharacterUpdated.bind(this));
        this.#player.subscribe(PlayerEventsEnum.OTHER_CHARACTER_MOVED, this.#onOtherCharacterMoved.bind(this));
        this.#player.subscribe(PlayerEventsEnum.OTHER_CHARACTER_LEVEL_UP, this.#onOtherCharacterLevelUp.bind(this));
        this.#player.subscribe(PlayerEventsEnum.OTHER_CHARACTER_LEFT_GAME, this.#onOtherCharacterLeftGame.bind(this));
        this.#player.subscribe(PlayerEventsEnum.CHARACTER_SPAWNED, this.#onCharacterSpawned.bind(this));
        this.#player.subscribe(PlayerEventsEnum.CHARACTER_POINTS_UPDATED, this.#onCharacterPointsUpdated.bind(this));
        this.#player.subscribe(PlayerEventsEnum.CHARACTER_TELEPORTED, this.#onCharacterTeleported.bind(this));
        this.#player.subscribe(PlayerEventsEnum.CHAT, this.#onChat.bind(this));
        this.#player.subscribe(PlayerEventsEnum.LOGOUT, this.#onLogout.bind(this));
    }

    get player() {
        return this.#player;
    }

    #onCharacterTeleported() {
        this.send(
            new TeleportPacket({
                positionX: this.#player.positionX,
                positionY: this.#player.positionY,
                port: this.#config.SERVER_PORT,
                address: Ip.toInt(this.#config.SERVER_ADDRESS),
            }),
        );
    }

    #onLogout() {
        this.close();
    }

    #onChat(chatEvent) {
        const { messageType, message } = chatEvent;
        this.send(
            new ChatOutPacket({
                messageType,
                message,
                vid: this.#player.virtualId,
                empireId: this.#player.empire,
            }),
        );
    }

    #onOtherCharacterLevelUp(otherCharacterLevelUpEvent) {
        const { virtualId, level } = otherCharacterLevelUpEvent;

        this.send(
            new CharacterPointChangePacket({
                vid: virtualId,
                type: PointsEnum.LEVEL,
                amount: 0,
                value: level,
            }),
        );
    }

    #onCharacterPointsUpdated() {
        const characterPointsPacket = new CharacterPointsPacket();
        for (const point in this.#player.getPoints()) {
            characterPointsPacket.addPoint(point, this.#player.getPoint(point));
        }
        this.send(characterPointsPacket);
    }

    #onOtherCharacterMoved(otherCharacterMovedEvent) {
        const { virtualId, arg, duration, movementType, time, rotation, positionX, positionY } =
            otherCharacterMovedEvent;

        this.send(
            new CharacterMoveOutPacket({
                vid: virtualId,
                arg,
                movementType,
                time,
                rotation,
                positionX,
                positionY,
                duration,
            }),
        );
    }

    #onOtherCharacterLeftGame(otherCharacterLeftGameEvent) {
        const { virtualId } = otherCharacterLeftGameEvent;

        this.send(
            new RemoveCharacterPacket({
                vid: virtualId,
            }),
        );
    }

    #onOtherCharacterUpdated(otherCharacterUpdatedEvent) {
        const {
            virtualId,
            playerClass,
            entityType,
            attackSpeed,
            movementSpeed,
            positionX,
            positionY,
            empireId,
            level,
            name,
        } = otherCharacterUpdatedEvent;

        this.send(
            new CharacterSpawnPacket({
                vid: virtualId,
                playerClass,
                entityType,
                attackSpeed,
                movementSpeed,
                positionX,
                positionY,
                positionZ: 0,
            }),
        );

        this.send(
            new CharacterInfoPacket({
                vid: virtualId,
                empireId,
                level,
                playerName: name,
                guildId: 0, //todo
                mountId: 0, //todo
                pkMode: 0, //todo
                rankPoints: 0, //todo
            }),
        );
    }

    #onCharacterSpawned() {
        this.send(
            new CharacterSpawnPacket({
                vid: this.#player.virtualId,
                playerClass: this.#player.playerClass,
                entityType: this.#player.entityType,
                attackSpeed: this.#player.attackSpeed,
                movementSpeed: this.#player.movementSpeed,
                positionX: this.#player.positionX,
                positionY: this.#player.positionY,
                positionZ: 0,
            }),
        );
        this.send(
            new CharacterInfoPacket({
                vid: this.#player.virtualId,
                empireId: this.#player.empire,
                level: this.#player.level,
                playerName: this.#player.name,
                guildId: 0, //todo
                mountId: 0, //todo
                pkMode: 0, //todo
                rankPoints: 0, //todo
            }),
        );
    }

    onHandshakeSuccess() {
        this.logger.info('[HANDSHAKE] Finished');
        this.state = ConnectionStateEnum.LOGIN;
    }

    send(packet) {
        this.#outgoingMessages.enqueue(packet.pack());
    }

    async sendPendingMessages() {
        for (const message of this.#outgoingMessages.dequeueIterator()) {
            this.socket.write(message);
        }
    }

    async onClose() {
        if (this.#player) {
            return this.#logoutService.execute(this.#player);
        }
    }
}
