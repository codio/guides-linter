import {RULE_LEVELS} from '../../const'

export default {
  // {section, content, assessmentIds, assessmentsById}
  action: ({content}) => {
    return content.length < 25  ? 'The page has no text or page text it too short(less than 25 chars)' : undefined
  },
  level: RULE_LEVELS.ISSUE
}
