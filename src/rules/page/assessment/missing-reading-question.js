import {RULE_LEVELS} from '../../const'

export default {
  // {section, content, assessmentIds, assessmentsById}
  action: ({section, assessmentIds}) => {
    if (section.title.includes('Learning Objective')) {
      return
    }
    return !assessmentIds.length ? 'Missing reading question' : undefined
  },
  level: RULE_LEVELS.ISSUE
}
