import {RULE_LEVELS} from '../const'

export default {
  // {metadata, bookStructure}
  action: ({metadata}) => {
    const sections = metadata.getSections()
    const studentSections = sections.filter(section => !section.teacherOnly)
    return studentSections.length < 3 ? 'The assignment contains less than 3 pages' : undefined
  },
  level: RULE_LEVELS.WARNING
}
