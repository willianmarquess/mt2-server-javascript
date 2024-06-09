import PlayerEventsEnum from './PlayerEventsEnum.js';

export default class OtherCharacterLevelUpEvent {
    static #type = PlayerEventsEnum.OTHER_CHARACTER_LEVEL_UP;
    #otherEntity;

    constructor({ otherEntity }) {
        this.#otherEntity = otherEntity;
    }

    get otherEntity() {
        return this.#otherEntity;
    }

    static get type() {
        return this.#type;
    }
}
