import ChatMessageTypeEnum from '../../../../../core/enum/ChatMessageTypeEnum.js';

export default class LogoutCommandHandler {
    #logger;

    constructor({ logger }) {
        this.#logger = logger;
    }

    async execute(player) {
        this.#logger.info(`[LogoutCommandHandler] Logout account. id: ${player.id}`);
        player.say({
            message: `Logging out`,
            messageType: ChatMessageTypeEnum.INFO,
        });
        player.logout();
    }
}
