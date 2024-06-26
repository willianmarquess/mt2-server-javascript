import CommandValidator from '../../CommandValidator.js';

export default class LevelCommandValidator extends CommandValidator {
    constructor(levelCommand) {
        super(levelCommand);
    }

    build() {
        this.createRule(this.command.args, 'args').isRequired().isArray().build();
        this.createRule(this.command.args[0], 'value').isNumber().isGreaterThanOrEqual(1).build();
        this.createRule(this.command.args[1], 'targetName').isOptional().isString().build();
    }
}
