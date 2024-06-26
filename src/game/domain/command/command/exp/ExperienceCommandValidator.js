import MathUtil from '../../../../../core/domain/util/MathUtil.js';
import CommandValidator from '../../CommandValidator.js';

export default class ExperienceCommandValidator extends CommandValidator {
    constructor(experienceCommand) {
        super(experienceCommand);
    }

    build() {
        this.createRule(this.command.args, 'args').isRequired().isArray().build();
        this.createRule(this.command.args[0], 'value')
            .isNumber()
            .isBetween(0, MathUtil.MAX_UINT + 1)
            .build();
        this.createRule(this.command.args[1], 'targetName').isOptional().isString().build();
    }
}
