import {RULE_LEVELS} from '../../const'

export default {
  // {section, content, assessmentIds, assessmentsById}
  action: ({content}) => {
    let ruleFailed = false
    const walkTokens = (token) => {
      if (token.type === 'image') {
        const fileNameAlt = token.href
          .replace(/^.*[\\/]/, '') // get filename
          .replace(/\.[^/.]+$/, '') // cut extension
          .replace(/[\W_]+/g,' ') // replace non-alphanumeric with ' '
        if (!token.text || token.text === fileNameAlt) {
          ruleFailed = true
        }
      }
    }
    const markedInstance = new window.marked.Marked()
    markedInstance.use({ walkTokens })
    markedInstance.parse(content)
    return ruleFailed ?
      'The page contains the image with no alt-text or alt text is equal to the image name' :
      undefined
  },
  level: RULE_LEVELS.ISSUE
}
