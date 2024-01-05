import {RULE_LEVELS} from '../../const'

export default {
  // {section, content, assessmentIds, assessmentsById}
  action: ({section, content}) => {
    let ruleFailed = true
    if (section.title.includes('Learning Objective')) {
      return
    }
    const walkTokens = (token) => {
      if (token.type === 'code' || token.type === 'codespan') {
        ruleFailed = false
      }
    }
    const markedInstance = new window.marked.Marked()
    markedInstance.use({ walkTokens })
    markedInstance.parse(content)

    return ruleFailed  ? 'The page has no code segment or code block' : undefined
  },
  level: RULE_LEVELS.SUGGESTION
}
