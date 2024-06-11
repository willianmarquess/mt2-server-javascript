import { EventEmitter } from 'node:events';
import AnimationUtil from '../util/AnimationUtil.js';
import EntityStateEnum from '../../enum/EntityStateEnum.js';
import AnimationTypeEnum from '../../enum/AnimationTypeEnum.js';
import AnimationSubTypeEnum from '../../enum/AnimationSubTypeEnum.js';
import MathUtil from '../util/MathUtil.js';

export default class Entity {
    #id;
    #virtualId;
    #entityType;

    #positionX = 0;
    #positionY = 0;
    #rotation = 0;
    #targetPositionX = 0;
    #targetPositionY = 0;
    #startPositionX = 0;
    #startPositionY = 0;
    #state = EntityStateEnum.IDLE;
    #movementStart = 0;
    #movementDuration = 0;
    #movementSpeed = 0;
    #attackSpeed = 0;
    #classId = 0;

    #animationManager;
    #emitter = new EventEmitter();

    constructor({ id, classId, virtualId, entityType, positionX, positionY }, { animationManager }) {
        this.#id = id;
        this.#classId = classId;
        this.#virtualId = virtualId;
        this.#entityType = entityType;
        this.#positionX = positionX;
        this.#positionY = positionY;

        this.#animationManager = animationManager;
    }

    tick() {
        if (this.#state == EntityStateEnum.MOVING) {
            const elapsed = performance.now() - this.#movementStart;
            let rate = this.#movementDuration == 0 ? 1 : elapsed / this.#movementDuration;
            if (rate > 1) rate = 1;

            const x = (this.#targetPositionX - this.#startPositionX) * rate + this.#startPositionX;
            const y = (this.#targetPositionY - this.#startPositionY) * rate + this.#startPositionY;

            this.#positionX = x;
            this.#positionY = y;

            if (rate >= 1) {
                this.#state = EntityStateEnum.IDLE;
            }
        }
    }

    goto(x, y, rotation) {
        if (x === this.#positionX && y === this.#positionY) return;
        if (x === this.#targetPositionX && y === this.#targetPositionY) return;

        const animation = this.#animationManager.getAnimation(
            this.#classId,
            AnimationTypeEnum.RUN,
            AnimationSubTypeEnum.GENERAL,
        );

        this.#state = EntityStateEnum.MOVING;
        this.#targetPositionX = x;
        this.#targetPositionY = y;
        this.#startPositionX = this.positionX;
        this.#startPositionY = this.positionY;
        this.#movementStart = performance.now();

        const distance = MathUtil.calcDistance(
            this.#startPositionX,
            this.#startPositionY,
            this.#targetPositionX,
            this.#targetPositionY,
        );

        if (animation) {
            this.#movementDuration = AnimationUtil.calcAnimationDuration(animation, this.#movementSpeed, distance);
        }

        this.#rotation = rotation * 5;
    }

    move(x, y) {
        if (x === this.#positionX && y === this.#positionY) return;
        this.#positionX = x;
        this.#positionY = y;
    }

    wait(x, y) {
        this.#positionX = x;
        this.#positionY = y;
    }

    stop() {
        this.#state = EntityStateEnum.IDLE;
        this.#movementDuration = 0;
    }

    publish(eventName, event) {
        this.#emitter.emit(eventName, event);
    }

    subscribe(eventName, callback) {
        this.#emitter.on(eventName, callback);
    }

    unsubscribe(eventName) {
        this.#emitter.off(eventName);
    }

    get id() {
        return this.#id;
    }
    set id(value) {
        this.#id = value;
    }
    get movementDuration() {
        return this.#movementDuration;
    }
    get rotation() {
        return this.#rotation;
    }
    get movementSpeed() {
        return this.#movementSpeed;
    }
    get attackSpeed() {
        return this.#attackSpeed;
    }
    get virtualId() {
        return this.#virtualId;
    }
    get entityType() {
        return this.#entityType;
    }
    get positionX() {
        return this.#positionX;
    }
    get positionY() {
        return this.#positionY;
    }
}
