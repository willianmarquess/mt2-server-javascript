import CommandValidator from '../../CommandValidator.js';

export default class ExperienceCommandValidator extends CommandValidator {
    constructor(experienceCommand) {
        super(experienceCommand);
    }

    build() {
        this.createRule(this.command.args, 'args').isRequired().isArray().build();
        this.createRule(this.command.args[0], 'value').isNumber().isBetween(1, 1000000000).build();
        this.createRule(this.command.args[1], 'targetName').isOptional().isString().build();
    }
}
