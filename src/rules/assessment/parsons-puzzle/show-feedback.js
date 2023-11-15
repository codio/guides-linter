import {ASSESSMENT_TYPES, RULE_LEVELS} from '../../const'

export default {
  action: (assessment) => {
    if (assessment.type !== ASSESSMENT_TYPES.PARSONS_PUZZLE) {
      return
    }
    try {
      const options = JSON.parse(assessment.source.options)
      return !options.show_feedback ? '"Show Feedback" in "Parsons Puzzle" should be checked.' : undefined
    } catch ({message}) {
      return message
    }
  },
  level: RULE_LEVELS.ISSUE
}
