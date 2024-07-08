import EntityTypeEnum from '../../../../enum/EntityTypeEnum.js';
import PointsEnum from '../../../../enum/PointsEnum.js';
import PlayerDTO from '../../../dto/PlayerDTO.js';
import CharacterSpawnedEvent from './events/CharacterSpawnedEvent.js';
import OtherCharacterSpawnedEvent from './events/OtherCharacterSpawnedEvent.js';
import CharacterMovedEvent from './events/CharacterMovedEvent.js';
import OtherCharacterMovedEvent from './events/OtherCharacterMovedEvent.js';
import CharacterPointsUpdatedEvent from './events/CharacterPointsUpdatedEvent.js';
import CharacterLevelUpEvent from './events/CharacterLevelUpEvent.js';
import OtherCharacterLevelUpEvent from './events/OtherCharacterLevelUpEvent.js';
import GameEntity from '../GameEntity.js';
import OtherCharacterLeftGameEvent from './events/OtherCharacterLeftGameEvent.js';
import ChatEvent from './events/ChatEvent.js';
import ChatMessageTypeEnum from '../../../../enum/ChatMessageTypeEnum.js';
import LogoutEvent from './events/LogoutEvent.js';
import JobUtil from '../../../util/JobUtil.js';
import MathUtil from '../../../util/MathUtil.js';
import CharacterTeleportedEvent from './events/CharacterTeleportedEvent.js';
import ItemAddedEvent from './events/ItemAddedEvent.js';
import Inventory from '../inventory/Inventory.js';
import WindowTypeEnum from '../../../../enum/WindowTypeEnum.js';
import ItemRemovedEvent from './events/ItemRemovedEvent.js';
import ItemAntiFlagEnum from '../../../../enum/ItemAntiFlagEnum.js';
import CharacterUpdatedEvent from './events/CharacterUpdatedEvent.js';
import InventoryEventsEnum from '../inventory/events/InventoryEventsEnum.js';
import ItemEquipamentSlotEnum from '../../../../enum/ItemEquipamentSlotEnum.js';
import OtherCharacterUpdatedEvent from './events/OtherCharacterUpdatedEvent.js';
import ApplyTypeEnum from '../../../../enum/ApplyTypeEnum.js';

export default class Player extends GameEntity {
    #accountId;
    #playerClass;
    #skillGroup;
    #playTime;
    #experience;
    #gold;
    #stamina;
    #bodyPart;
    #hairPart;
    #givenStatusPoints;
    #availableStatusPoints;
    #slot;

    #appearance;
    #points = {};
    #applies = {};

    #health;
    #baseHealth;
    #hpPerLvl;
    #hpPerHtPoint;
    #mana;
    #mpPerLvl;
    #mpPerIqPoint;
    #baseMana;

    #experienceManager;
    #config;

    //in game points
    #maxHealth;
    #maxMana;
    #defense = 0;
    #defensePerHtPoint = 0;
    #attack = 0;
    #attackBonus = 0;
    #attackPerStPoint = 0;
    #attackPerDXPoint = 0;
    #attackPerIQPoint = 0;
    #magicAttack = 0;
    #magicAttackBonus = 0;
    #magicDefense = 0;
    #magicDefenseBonus = 0;
    // #attackSpeed;
    // #movementSpeed;
    // #neededExperience;
    // #defenseGrade;
    // #attackGrade;
    // #statusPoints;
    // #subSkill;
    // #skill;
    // #minAttackDamage;
    // #maxAttackDamage;
    // #criticalPercentage;
    // #penetratePercentage;
    // #itemDropBonus;
    // #attackBonus;
    // #defenseBonus;
    // #mallItemBonus;
    // #magicAttackBonus;
    // #resistCritical;
    // #resistPenetrate;
    // #minWeaponDamage;
    // #maxWeaponDamage;

    #lastPlayTime = performance.now();
    #inventory;
    #logger;

    constructor(
        {
            id,
            accountId,
            empire,
            playerClass = 0,
            skillGroup = 0,
            playTime = 0,
            level = 1,
            experience = 0,
            gold = 0,
            st = 0,
            ht = 0,
            dx = 0,
            iq = 0,
            positionX = 0,
            positionY = 0,
            health = 0,
            mana = 0,
            stamina = 0,
            bodyPart = 0,
            hairPart = 0,
            name,
            givenStatusPoints = 0,
            availableStatusPoints = 0,
            slot = 0,
            virtualId = 0,
            hpPerLvl = 0,
            hpPerHtPoint = 0,
            mpPerLvl = 0,
            mpPerIqPoint = 0,
            baseAttackSpeed = 0,
            baseMovementSpeed = 0,
            baseHealth = 0,
            baseMana = 0,
            appearance = 0,
            defensePerHtPoint = 0,
            attackPerStPoint = 0,
            attackPerDXPoint = 0,
            attackPerIQPoint = 0,
        },
        { animationManager, experienceManager, config, logger },
    ) {
        super(
            {
                id,
                classId: playerClass,
                virtualId,
                positionX,
                positionY,
                entityType: EntityTypeEnum.PLAYER,
                attackSpeed: baseAttackSpeed,
                movementSpeed: baseMovementSpeed,
                dx,
                ht,
                iq,
                st,
                name,
                level,
                empire,
            },
            {
                animationManager,
            },
        );
        this.#logger = logger;
        this.#accountId = accountId;
        this.#playerClass = playerClass;
        this.#skillGroup = skillGroup;
        this.#playTime = playTime;
        this.#experience = experience;
        this.#gold = gold;
        this.#health = health;
        this.#mana = mana;
        this.#stamina = stamina;
        this.#bodyPart = bodyPart;
        this.#hairPart = hairPart;
        this.#givenStatusPoints = givenStatusPoints;
        this.#availableStatusPoints = availableStatusPoints;
        this.#slot = slot;
        this.#appearance = appearance;

        //in game values
        this.#hpPerLvl = hpPerLvl;
        this.#hpPerHtPoint = hpPerHtPoint;
        this.#mpPerLvl = mpPerLvl;
        this.#mpPerIqPoint = mpPerIqPoint;
        this.#baseMana = baseMana;
        this.#baseHealth = baseHealth;
        this.#defensePerHtPoint = defensePerHtPoint;
        this.#attackPerStPoint = attackPerStPoint;
        this.#attackPerDXPoint = attackPerDXPoint;
        this.#attackPerIQPoint = attackPerIQPoint;
        this.#experienceManager = experienceManager;
        this.#config = config;
        this.#inventory = new Inventory({ config: this.#config });
        this.#inventory.subscribe(InventoryEventsEnum.ITEM_EQUIPPED, this.#onItemEquipped.bind(this));
        this.#inventory.subscribe(InventoryEventsEnum.ITEM_UNEQUIPPED, this.#onItemUnequipped.bind(this));

        this.#init();
    }

    #init() {
        this.#updateHealth();
        this.#resetHealth();
        this.#updateMana();
        this.#resetMana();
        this.#updateDefense();
        this.#updateAttack();

        this.#points[PointsEnum.EXPERIENCE] = () => this.#experience;
        this.#points[PointsEnum.HT] = () => this.ht;
        this.#points[PointsEnum.ST] = () => this.st;
        this.#points[PointsEnum.IQ] = () => this.iq;
        this.#points[PointsEnum.DX] = () => this.dx;
        this.#points[PointsEnum.LEVEL] = () => this.level;
        this.#points[PointsEnum.MAX_HP] = () => this.#maxHealth;
        this.#points[PointsEnum.MAX_MP] = () => this.#maxMana;
        this.#points[PointsEnum.HP] = () => this.#health;
        this.#points[PointsEnum.MP] = () => this.#mana;
        this.#points[PointsEnum.ATTACK_SPEED] = () => this.attackSpeed;
        this.#points[PointsEnum.MOVE_SPEED] = () => this.movementSpeed;
        this.#points[PointsEnum.NEEDED_EXPERIENCE] = () => this.#experienceManager.getNeededExperience(this.level);
        this.#points[PointsEnum.STATUS_POINTS] = () => this.#availableStatusPoints;
        this.#points[PointsEnum.GOLD] = () => this.#gold;
        this.#points[PointsEnum.DEFENSE] = () => this.#defense;
        this.#points[PointsEnum.DEFENSE_GRADE] = () => this.#defense;
        this.#points[PointsEnum.ATTACK_GRADE] = () => this.#attack;
        this.#points[PointsEnum.MAGIC_ATT_GRADE] = () => this.#magicAttack;
        this.#points[PointsEnum.MAGIC_DEF_GRADE] = () => this.#magicDefense;

        this.#applies[ApplyTypeEnum.APPLY_ATT_SPEED] = (value) => this.addAttackSpeed(value);
        this.#applies[ApplyTypeEnum.APPLY_MOV_SPEED] = (value) => this.addMovementSpeed(value);
    }

    #addItemApplies(item) {
        for (const { type, value } of item.applies) {
            if (type === ApplyTypeEnum.APPLY_NONE) continue;
            const applyFunc = this.#applies[type];

            if (applyFunc && typeof applyFunc === 'function') {
                applyFunc(Number(value));
            } else {
                this.#logger.debug(`[PLAYER] Apply not implemented yet: ${type}`);
            }
        }
    }

    #removeItemApplies(item) {
        for (const { type, value } of item.applies) {
            if (type === ApplyTypeEnum.APPLY_NONE) continue;
            const applyFunc = this.#applies[type];

            if (applyFunc && typeof applyFunc === 'function') {
                applyFunc(-Number(value));
            } else {
                this.#logger.debug(`[PLAYER] Apply not implemented yet: ${type}`);
            }
        }
    }

    #onEquipamentChange() {
        this.#updateDefense();
        this.#updateAttack();
        this.#updateHealth();
        this.#updateMana();
        this.updateView();
        this.#sendPoints();
    }

    #onItemEquipped({ item }) {
        this.#addItemApplies(item);
        this.#onEquipamentChange();
    }

    #onItemUnequipped({ item }) {
        this.#removeItemApplies(item);
        this.#onEquipamentChange();
    }

    getAttackRating() {
        return Math.min(90, this.dx * 4 + (this.level * 2) / 6);
    }

    getAttack() {
        let attack =
            this.level * 2 +
            this.#attackPerStPoint * this.st +
            this.#attackPerIQPoint * this.iq +
            this.#attackPerDXPoint * this.dx;
        attack += this.#attackBonus;
        const { physic } = this.#inventory.getWeaponValues();
        attack += Math.floor(Math.random() * (physic.max - physic.min) + physic.min) * 2;
        attack += physic.bonus * 2;
        return Math.floor(attack);
    }

    getMagicAttack() {
        let magicAttack = this.level * 2 + 2 * this.iq;
        magicAttack += this.#magicAttackBonus;
        const { magic } = this.#inventory.getWeaponValues();
        magicAttack += Math.floor(Math.random() * (magic.max - magic.min) + magic.min) * 2;
        magicAttack += magic.bonus * 2;
        return Math.floor(magicAttack);
    }

    getDefense() {
        let defense = this.level + Math.floor(this.#defensePerHtPoint * this.ht);
        const armorValues = this.#inventory.getArmorValues();
        armorValues.forEach(({ flat, multi }) => {
            defense += flat;
            defense += multi * 2;
        });
        return Math.floor(defense);
    }

    getMagicDefense() {
        let magicDefense = this.level + (this.iq * 3 + this.ht / 3 + this.getDefense() / 2);
        magicDefense += this.#magicDefenseBonus;
        return Math.floor(magicDefense);
    }

    #updateAttack() {
        this.#attack = this.getAttack();
    }

    #updateMagicAttack() {
        this.#magicAttack = this.getMagicAttack();
    }

    #updateDefense() {
        this.#defense = this.getDefense();
    }

    #updateMagicDefense() {
        this.#magicDefense = this.getMagicDefense();
    }

    #updateStatusPoints() {
        const baseStatusPoints = (this.level - 1) * this.#config.POINTS_PER_LEVEL;

        const expNeeded = this.#experienceManager.getNeededExperience(this.level);
        const experienceRatio = this.#experience / expNeeded;

        const totalStatusPoints = Math.floor(baseStatusPoints + experienceRatio * 4);

        const excessPoints = this.#givenStatusPoints - totalStatusPoints;
        this.#availableStatusPoints -= Math.min(excessPoints, this.#availableStatusPoints);

        this.#givenStatusPoints -= excessPoints;
        this.#availableStatusPoints += totalStatusPoints - this.#givenStatusPoints;
        this.#givenStatusPoints = totalStatusPoints;
    }

    teleport(x, y) {
        this.move(x, y);
        this.stop();

        this.publish(CharacterTeleportedEvent.type, new CharacterTeleportedEvent());
    }

    addGold(value = 1) {
        const validatedValue = MathUtil.toUnsignedNumber(value);
        if (validatedValue === 0) return;

        this.#gold = Math.min(this.#gold + validatedValue, MathUtil.MAX_UINT);
        this.#sendPoints();
    }

    addSt(value = 1) {
        const validatedValue = MathUtil.toUnsignedNumber(value);
        if (validatedValue === 0 || validatedValue > this.#availableStatusPoints) return;

        let realValue = 0;
        if (this.st + validatedValue >= this.#config.MAX_POINTS) {
            const diff = this.#config.MAX_POINTS - this.st;
            realValue = diff;
        } else {
            realValue = validatedValue;
        }

        //update phy attack
        this.st += realValue;
        this.#givenStatusPoints += realValue;
        this.#availableStatusPoints -= realValue;
        this.#updateAttack();
        this.#sendPoints();
    }

    addHt(value = 1) {
        const validatedValue = MathUtil.toUnsignedNumber(value);
        if (validatedValue === 0 || validatedValue > this.#availableStatusPoints) return;

        let realValue = 0;
        if (this.ht + validatedValue >= this.#config.MAX_POINTS) {
            const diff = this.#config.MAX_POINTS - this.ht;
            realValue = diff;
        } else {
            realValue = validatedValue;
        }

        this.ht += realValue;
        this.#givenStatusPoints += realValue;
        this.#availableStatusPoints -= realValue;
        this.#updateDefense();
        this.#updateMagicDefense();
        this.#updateHealth();
        this.#sendPoints();
    }

    addDx(value = 1) {
        const validatedValue = MathUtil.toUnsignedNumber(value);
        if (validatedValue === 0 || validatedValue > this.#availableStatusPoints) return;

        let realValue = 0;
        if (this.dx + validatedValue > this.#config.MAX_POINTS) {
            const diff = this.#config.MAX_POINTS - this.dx;
            realValue = diff;
        } else {
            realValue = validatedValue;
        }

        this.dx += realValue;
        this.#givenStatusPoints += realValue;
        this.#availableStatusPoints -= realValue;
        this.#updateAttack();
        this.#sendPoints();
    }

    addIq(value = 1) {
        const validatedValue = MathUtil.toUnsignedNumber(value);
        if (validatedValue === 0 || validatedValue > this.#availableStatusPoints) return;

        let realValue = 0;
        if (this.iq + validatedValue > this.#config.MAX_POINTS) {
            const diff = this.#config.MAX_POINTS - this.iq;
            realValue = diff;
        } else {
            realValue = validatedValue;
        }

        this.iq += realValue;
        this.#givenStatusPoints += realValue;
        this.#availableStatusPoints -= realValue;
        this.#updateAttack();
        this.#updateMagicAttack();
        this.#updateMagicDefense();
        this.#updateMana();
        this.#sendPoints();
    }

    addStat(stat, value = 1) {
        switch (stat) {
            case 'st':
                this.addSt(value);
                break;
            case 'ht':
                this.addHt(value);
                break;
            case 'dx':
                this.addDx(value);
                break;
            case 'iq':
                this.addIq(value);
                break;
        }
    }

    addExperience(value) {
        const validatedValue = MathUtil.toUnsignedNumber(value);

        if (validatedValue < 0 || (this.level >= this.#config.MAX_LEVEL && this.#experience === 0)) return;

        if (this.level >= this.#config.MAX_LEVEL) {
            this.#experience = 0;
            this.#updateStatusPoints();
            this.#sendPoints();
            return;
        }

        const expNeeded = this.#experienceManager.getNeededExperience(this.level);

        if (this.#experience + validatedValue >= expNeeded) {
            const diff = this.#experience + validatedValue - expNeeded;
            this.#experience = diff;
            this.addLevel(1);
            this.#updateStatusPoints();
            this.addExperience(0);
            return;
        }

        const expPart = expNeeded / 4;
        const before = this.#experience;
        this.#experience += validatedValue;

        const beforePart = before / expPart;
        const afterPart = this.#experience / expPart;
        const expSteps = Math.floor(afterPart) - Math.floor(beforePart);

        if (expSteps > 0) {
            this.#health = this.#maxHealth;
            this.#mana = this.#maxMana;
            this.#updateStatusPoints();
        }
        this.#sendPoints();
    }

    addLevel(value) {
        const validatedValue = MathUtil.toUnsignedNumber(value);
        if (this.level + validatedValue > this.#config.MAX_LEVEL) return;
        if (validatedValue < 1) return;

        //add skill point
        this.level += validatedValue;
        this.#updateHealth();
        this.#resetHealth();
        this.#updateMana();
        this.#resetMana();
        this.#updateStatusPoints();
        this.#updateAttack();
        this.#updateMagicAttack();
        this.#updateDefense();
        this.#sendPoints();

        //verify if we really need to send this
        this.publish(CharacterLevelUpEvent.type, new CharacterLevelUpEvent({ entity: this }));
    }

    setLevel(value = 1) {
        const validatedValue = MathUtil.toUnsignedNumber(value);
        if (validatedValue < 1 || validatedValue > this.#config.MAX_LEVEL) return;

        this.level = validatedValue;
        //reset skills

        this.#givenStatusPoints = 0;
        this.#availableStatusPoints = 0;
        this.#experience = 0;
        const className = JobUtil.getClassNameFromClassId(this.#playerClass);
        this.st = this.#config.jobs[className].common.st;
        this.ht = this.#config.jobs[className].common.ht;
        this.dx = this.#config.jobs[className].common.dx;
        this.iq = this.#config.jobs[className].common.iq;

        this.#updateHealth();
        this.#resetHealth();
        this.#updateMana();
        this.#resetMana();
        this.#updateStatusPoints();
        this.#updateAttack();
        this.#updateDefense();
        this.#sendPoints();

        //add skill point
        //verify if we really need to send this
        this.publish(CharacterLevelUpEvent.type, new CharacterLevelUpEvent({ entity: this }));
    }

    addMovementSpeed(value) {
        const validatedValue = Math.min(value, MathUtil.MAX_TINY);
        this.movementSpeed += validatedValue;
    }

    addAttackSpeed(value) {
        const validatedValue = Math.min(value, MathUtil.MAX_TINY);
        this.attackSpeed += validatedValue;
    }

    addMana(value) {
        this.#mana += value > 0 ? value : 0;
    }

    addMaxMana(value) {
        this.#maxMana += value > 0 ? value : 0;
    }

    addHealth(value) {
        this.#health += value > 0 ? value : 0;
    }

    addMaxHealth(value) {
        this.#maxHealth += value > 0 ? value : 0;
    }

    #updateHealth() {
        this.#maxHealth = this.#baseHealth + this.ht * this.#hpPerHtPoint + this.level * this.#hpPerLvl;
    }

    #resetHealth() {
        this.#health = this.#maxHealth;
    }

    #resetMana() {
        this.#mana = this.#maxMana;
    }

    #updateMana() {
        this.#maxMana = this.#baseMana + this.iq * this.#mpPerIqPoint + this.level * this.#mpPerLvl;
    }

    getPoint(point) {
        if (this.#points[point]) {
            return this.#points[point]();
        }
        return 0;
    }

    getPoints() {
        return this.#points;
    }

    spawn() {
        this.#lastPlayTime = performance.now();
        this.publish(CharacterSpawnedEvent.type, new CharacterSpawnedEvent());
        this.say({
            messageType: ChatMessageTypeEnum.INFO,
            message: 'Welcome to Metin2 JS - An Open Source Project',
        });
    }

    showOtherEntity({
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
    }) {
        this.publish(
            OtherCharacterSpawnedEvent.type,
            new OtherCharacterSpawnedEvent({
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
            }),
        );
    }

    hideOtherEntity({ virtualId }) {
        this.publish(OtherCharacterLeftGameEvent.type, new OtherCharacterLeftGameEvent({ virtualId }));
    }

    otherEntityLevelUp({ virtualId, level }) {
        this.publish(OtherCharacterLevelUpEvent.type, new OtherCharacterLevelUpEvent({ virtualId, level }));
    }

    otherEntityUpdated({ vid, attackSpeed, moveSpeed, bodyId, weaponId, hairId }) {
        this.publish(
            OtherCharacterUpdatedEvent.type,
            new OtherCharacterUpdatedEvent({ vid, attackSpeed, moveSpeed, bodyId, weaponId, hairId }),
        );
    }

    logout() {
        this.publish(LogoutEvent.type, new LogoutEvent());
    }

    say({ message, messageType }) {
        this.publish(
            ChatEvent.type,
            new ChatEvent({
                message,
                messageType,
            }),
        );
    }

    sendCommandErrors(errors) {
        errors.forEach(({ errors }) => {
            errors.forEach(({ error }) => {
                this.say({
                    message: error,
                    messageType: ChatMessageTypeEnum.INFO,
                });
            });
        });
    }

    #sendPoints() {
        this.publish(CharacterPointsUpdatedEvent.type, new CharacterPointsUpdatedEvent());
    }

    updateOtherEntity({ virtualId, arg, movementType, time, rotation, positionX, positionY, duration }) {
        this.publish(
            OtherCharacterMovedEvent.type,
            new OtherCharacterMovedEvent({
                virtualId,
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

    updateView() {
        this.publish(
            CharacterUpdatedEvent.type,
            new CharacterUpdatedEvent({
                name: this.name,
                attackSpeed: this.attackSpeed,
                moveSpeed: this.movementSpeed,
                vid: this.virtualId,
                positionX: this.positionX,
                positionY: this.positionY,
                bodyId: this.getBody()?.id ?? 0,
                weaponId: this.getWeapon()?.id ?? 0,
                hairId: this.getHair()?.id ?? 0,
            }),
        );
    }

    getBody() {
        return this.#inventory.getItemFromSlot(ItemEquipamentSlotEnum.BODY);
    }

    getWeapon() {
        return this.#inventory.getItemFromSlot(ItemEquipamentSlotEnum.WEAPON);
    }

    getHair() {
        return this.#inventory.getItemFromSlot(ItemEquipamentSlotEnum.COSTUME_HAIR);
    }

    wait({ positionX, positionY, arg, rotation, time, movementType }) {
        super.wait(positionX, positionY);
        this.publish(
            CharacterMovedEvent.type,
            new CharacterMovedEvent({
                params: { positionX, positionY, arg, rotation, time, movementType, duration: 0 },
                entity: this,
            }),
        );
    }

    goto({ positionX, positionY, arg, rotation, time, movementType }) {
        super.goto(positionX, positionY, rotation);
        this.publish(
            CharacterMovedEvent.type,
            new CharacterMovedEvent({
                params: { positionX, positionY, arg, rotation, time, movementType, duration: this.movementDuration },
                entity: this,
            }),
        );
    }

    move(x, y) {
        super.move(x, y);
        //send moveEvent
    }

    #calcPlayTime() {
        return this.#playTime + Math.round((performance.now() - this.#lastPlayTime) / (1000 * 60));
    }

    get antiFlagClass() {
        switch (this.#playerClass) {
            case 0:
            case 4:
                return ItemAntiFlagEnum.ANTI_MUSA;
            case 1:
            case 5:
                return ItemAntiFlagEnum.ANTI_ASSASSIN;
            case 2:
            case 6:
                return ItemAntiFlagEnum.ANTI_SURA;
            case 3:
            case 7:
                return ItemAntiFlagEnum.ANTI_MUDANG;
            default:
                return 0;
        }
    }

    get antiFlagGender() {
        switch (this.#playerClass) {
            case 0:
            case 2:
            case 5:
            case 7:
                return ItemAntiFlagEnum.ANTI_MALE;
            case 1:
            case 3:
            case 4:
            case 6:
                return ItemAntiFlagEnum.ANTI_FEMALE;
            default:
                return 0;
        }
    }

    /* 
        ITEM MANAGEMENT
    */

    #sendItemAdded({ window, position, item }) {
        this.publish(
            ItemAddedEvent.type,
            new ItemAddedEvent({
                window,
                position,
                id: item.id,
                count: item.count ?? 1,
                flags: item.flags.flag,
                antiFlags: item.antiFlags.flag,
                highlight: 0,
            }),
        );
    }

    #sendItemRemoved({ window, position }) {
        this.publish(
            ItemRemovedEvent.type,
            new ItemRemovedEvent({
                window,
                position,
            }),
        );
    }

    #useWearableItem({ item, position, window }) {
        if (this.#inventory.isEquipamentPosition(position)) {
            this.#inventory.removeItem(position, item.size);
            const addedPosition = this.#inventory.addItem(item);

            if (addedPosition >= 0) {
                this.#sendItemRemoved({
                    window,
                    position,
                });

                this.#sendItemAdded({
                    window: WindowTypeEnum.INVENTORY,
                    position: addedPosition,
                    item,
                });
            } else {
                this.say({
                    messageType: ChatMessageTypeEnum.INFO,
                    message: 'Inventory is full',
                });
                this.#inventory.addItemAt(item, position);
            }
        } else {
            const wearPosition = this.#inventory.getWearPosition(item);
            if (!wearPosition) return;

            const itemEquipped = this.getItem(wearPosition);

            if (itemEquipped) {
                this.#inventory.removeItem(position, item.size);
                this.#inventory.removeItem(wearPosition, itemEquipped.size);

                const addedPosition = this.#inventory.addItem(itemEquipped);

                if (addedPosition >= 0) {
                    this.#sendItemRemoved({
                        window: WindowTypeEnum.EQUIPMENT,
                        position: wearPosition,
                    });
                    this.#sendItemRemoved({
                        window: WindowTypeEnum.INVENTORY,
                        position,
                    });
                    this.#inventory.addItemAt(item, wearPosition);
                    this.#sendItemAdded({
                        window: WindowTypeEnum.EQUIPMENT,
                        position: wearPosition,
                        item,
                    });
                    this.#sendItemAdded({
                        window: WindowTypeEnum.INVENTORY,
                        position: addedPosition,
                        item: itemEquipped,
                    });
                } else {
                    this.#inventory.addItemAt(item, position);
                    this.#inventory.addItemAt(itemEquipped, wearPosition);
                    this.say({
                        messageType: ChatMessageTypeEnum.INFO,
                        message: 'Inventory is full',
                    });
                }
            } else {
                this.#inventory.removeItem(position, item.size);
                this.#inventory.addItemAt(item, wearPosition);

                this.#sendItemRemoved({
                    window: WindowTypeEnum.INVENTORY,
                    position,
                });
                this.#sendItemAdded({
                    window: WindowTypeEnum.EQUIPMENT,
                    position: wearPosition,
                    item,
                });
            }
        }
    }

    #useNonWearableItem(){}

    useItem({ window, position }) {
        const item = this.getItem(position);

        if (!item) return;

        if (this.#isWearable(item)) {
            this.#useWearableItem({ item, position, window });
        } else {
            this.#useNonWearableItem({ item, position, window });
        }
    }

    getItem(position) {
        return this.#inventory.getItem(Number(position));
    }

    #isWearable(item) {
        return (
            this.level >= item.getLevelLimit() &&
            item.wearFlags.flag > 0 &&
            !item.antiFlags.is(this.antiFlagClass) &&
            !item.antiFlags.is(this.antiFlagGender)
        );
    }

    moveItem({ fromWindow, fromPosition, toWindow, toPosition /*_count*/ }) {
        const item = this.getItem(fromPosition);

        if (!item) return;
        if (fromWindow !== WindowTypeEnum.INVENTORY || toWindow !== WindowTypeEnum.INVENTORY) return;
        if (!this.#inventory.isValidPosition(toPosition)) return;
        if (!this.#inventory.haveAvailablePosition(toPosition, item.size)) return;

        if (this.#inventory.isEquipamentPosition(toPosition)) {
            if (!this.#isWearable(item)) return;
            if (!this.#inventory.isValidSlot(item, toPosition)) return;
        }

        this.#inventory.removeItem(fromPosition, item.size);
        this.#inventory.addItemAt(item, toPosition);

        this.#sendItemRemoved({
            window: fromWindow,
            position: fromPosition,
        });
        this.#sendItemAdded({
            window: toWindow,
            position: toPosition,
            item,
        });
    }

    addItem(item) {
        const position = this.#inventory.addItem(item);

        if (position < 0) {
            this.say({
                messageType: ChatMessageTypeEnum.INFO,
                message: 'Inventory is full',
            });
            return;
        }

        this.#sendItemAdded({
            window: WindowTypeEnum.INVENTORY,
            position,
            item,
        });
    }

    static create(
        {
            id,
            accountId,
            empire,
            playerClass,
            skillGroup,
            playTime,
            level,
            experience,
            gold,
            st,
            ht,
            dx,
            iq,
            positionX,
            positionY,
            health,
            mana,
            stamina,
            bodyPart,
            hairPart,
            name,
            givenStatusPoints,
            availableStatusPoints,
            slot,
            virtualId,
            hpPerLvl,
            hpPerHtPoint,
            mpPerLvl,
            mpPerIqPoint,
            baseAttackSpeed,
            baseMovementSpeed,
            baseHealth,
            baseMana,
            appearance,
            defensePerHtPoint,
            attackPerStPoint,
            attackPerDXPoint,
            attackPerIQPoint,
        },
        { animationManager, config, experienceManager, logger },
    ) {
        return new Player(
            {
                id,
                accountId,
                empire,
                playerClass,
                skillGroup,
                playTime,
                level,
                experience,
                gold,
                st,
                ht,
                dx,
                iq,
                positionX,
                positionY,
                health,
                mana,
                stamina,
                bodyPart,
                hairPart,
                name,
                givenStatusPoints,
                availableStatusPoints,
                slot,
                virtualId,
                hpPerLvl,
                hpPerHtPoint,
                mpPerLvl,
                mpPerIqPoint,
                baseAttackSpeed,
                baseMovementSpeed,
                baseHealth,
                baseMana,
                appearance,
                defensePerHtPoint,
                attackPerStPoint,
                attackPerDXPoint,
                attackPerIQPoint,
            },
            { animationManager, config, experienceManager, logger },
        );
    }

    toDatabase() {
        return new PlayerDTO({
            id: this.id,
            accountId: this.#accountId,
            empire: this.empire,
            playerClass: this.#playerClass,
            skillGroup: this.#skillGroup,
            playTime: this.#calcPlayTime(),
            level: this.level,
            experience: this.#experience,
            gold: this.#gold,
            st: this.st,
            ht: this.ht,
            dx: this.dx,
            iq: this.iq,
            positionX: this.positionX,
            positionY: this.positionY,
            health: this.#health,
            mana: this.#mana,
            stamina: this.#stamina,
            bodyPart: this.#bodyPart,
            hairPart: this.#hairPart,
            name: this.name,
            givenStatusPoints: this.#givenStatusPoints,
            availableStatusPoints: this.#availableStatusPoints,
            slot: this.#slot,
        });
    }

    get appearance() {
        return this.#appearance;
    }
    get maxHealth() {
        return this.#maxHealth;
    }
    get maxMana() {
        return this.#maxMana;
    }
    get accountId() {
        return this.#accountId;
    }
    get playerClass() {
        return this.#playerClass;
    }
    get skillGroup() {
        return this.#skillGroup;
    }
    get playTime() {
        return this.#playTime;
    }
    get experience() {
        return this.#experience;
    }
    get gold() {
        return this.#gold;
    }
    get health() {
        return this.#health;
    }
    get mana() {
        return this.#mana;
    }
    get stamina() {
        return this.#stamina;
    }
    get bodyPart() {
        return this.#bodyPart;
    }
    get hairPart() {
        return this.#hairPart;
    }
    get givenStatusPoints() {
        return this.#givenStatusPoints;
    }
    get availableStatusPoints() {
        return this.#availableStatusPoints;
    }
    get slot() {
        return this.#slot;
    }
}
