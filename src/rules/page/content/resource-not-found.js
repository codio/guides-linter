import {RULE_LEVELS} from '../../const'
import {
  checkResourceUrlExists,
  checkExternalUrlExists,
  collectAllLinks
} from '../../../helpers'

export default {
  // {section, content, assessmentIds, assessmentsById}
  action: async ({content}) => {
    const promises = collectAllLinks(content).filter(linkInfo => !!linkInfo.url)
      .map(linkInfo => {
        if (linkInfo.external) {
          return checkExternalUrlExists(linkInfo.url)
        }
        return checkResourceUrlExists(linkInfo.url)
      })
    const result = await Promise.all(promises)

    const ruleFailed = result.some(res => !res)
    return ruleFailed ?
      'The link to some external resource results in 404 error(or check url failed - see console for details)' :
      undefined
  },
  level: RULE_LEVELS.ISSUE
}
