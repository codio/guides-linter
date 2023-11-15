import {RULE_LEVELS} from '../../const'

export default {
  action: (assessment) => {
    const {guidance} = assessment.source
    const lexerData = window.marked.lexer(guidance || '')
    const allCodeBlocksHideClipboard = lexerData
      .filter(item => item.type === 'code')
      .every(item => item.lang.includes('-hide-clipboard'))
    return !guidance || !allCodeBlocksHideClipboard ?
      'Rationale field should not be blank. Any code blocks (```) should have “-hide-clipboard”.' : undefined
  },
  level: RULE_LEVELS.ISSUE
}
