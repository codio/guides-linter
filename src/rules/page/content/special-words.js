import {RULE_LEVELS} from '../../const'

export default {
  // {section, content, assessmentIds, assessmentsById}
  action: ({content}) => {
    const re = /(TBD|TODO|Links for content team)/gmi
    return re.test(content)  ? 'The page contains special words' : undefined
  },
  level: RULE_LEVELS.WARNING
}
