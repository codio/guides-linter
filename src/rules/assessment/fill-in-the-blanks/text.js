import {RULE_LEVELS} from '../../const'

export default {
  action: (assessment) => {
    const re = /((?:.|\n)*?)<<<(.+?)>>>/g
    return assessment.type === ASSESSMENT_TYPES.FILL_IN_THE_BLANKS &&
    (!assessment.source.text || !re.exec(assessment.source.text)) ?
      'Text in "Fill in the blanks" should not be blank, and there should be at least one <<< and >>> pair.' :
      undefined
  },
  level: RULE_LEVELS.ISSUE
}
