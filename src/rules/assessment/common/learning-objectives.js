import {RULE_LEVELS} from '../../const'

export default {
  action: (assessment) => {
    const {learningObjectives} = assessment.source
    return !learningObjectives || learningObjectives.indexOf('SWBAT') !== 0 ?
      '"Learning Objectives" field should not be blank, and it should start with “SWBAT”.' : undefined
  },
  level: RULE_LEVELS.ISSUE
}
