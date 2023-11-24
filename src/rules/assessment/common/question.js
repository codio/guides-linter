import {RULE_LEVELS} from '../../const'

export default {
  action: (assessment) => {
    const re = /^(\*\*.+\*\*|### .+)/s
    return !re.test(assessment.source.instructions) ?
      'Question should not be blank. Text should also be bold (**)' : undefined
  },
  level: RULE_LEVELS.ISSUE
}
