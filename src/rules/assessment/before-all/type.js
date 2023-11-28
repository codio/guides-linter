import {ASSESSMENT, RULE_LEVELS} from '../../const'

export default {
  action: (assessment) => {
    return assessment.type === ASSESSMENT.TYPES.FREE_TEXT ?
      'Free Text is used, use Free Text Autograde instead' : undefined
  },
  level: RULE_LEVELS.ISSUE
}
