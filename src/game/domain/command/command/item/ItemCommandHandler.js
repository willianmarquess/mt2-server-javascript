import MathUtil from '../../../../../core/domain/util/MathUtil.js';
import ChatMessageTypeEnum from '../../../../../core/enum/ChatMessageTypeEnum.js';

export default class ItemCommandHandler {
    #logger;
    #itemManager;

    constructor({ logger, itemManager }) {
        this.#logger = logger;
        this.#itemManager = itemManager;
    }

    execute(player, itemCommand) {
        if (!itemCommand.isValid()) {
            const errors = itemCommand.errors();
            this.#logger.error(errors);
            player.sendCommandErrors(errors);
            return;
        }

        const {
            args: [vnum, quantity = 1],
        } = itemCommand;

        if (!this.#itemManager.hasItem(vnum)) {
            player.say({
                message: `Item: ${vnum} not found.`,
                messageType: ChatMessageTypeEnum.INFO,
            });
            return;
        }

        const item = this.#itemManager.getItem(vnum, Math.min(quantity, MathUtil.MAX_TINY));
        player.addItem(item);
    }
}
