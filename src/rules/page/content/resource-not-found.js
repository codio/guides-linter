import {RULE_LEVELS} from '../../const'
import {checkUrlExistsSync} from '../../../helpers'

// to get all resources links (audio, video, iframes, etc...)
/*
    const iframe = document.createElement('iframe');
    const html = `<body>${window.marked.parse(content)}</body>`;
    iframe.onload = function(){
      var d = this.contentWindow.document;
      d.open();
      d.write(html);
      d.close();
      setTimeout(() => {
        console.log(
          'this.contentWindow.getEntriesByType("resource")',
          this.contentWindow.performance.getEntriesByType("resource")
        );
      }, 100)
    };
    document.body.appendChild(iframe);
 */

const absoluteUrlRe = new RegExp('^(?:[a-z+]+:)?//', 'i')

export default {
  // {section, content, assessmentIds, assessmentsById}
  action: ({content}) => {
    const urls = []
    const walkTokens = (token) => {
      if (token.type === 'image') {
        const url = absoluteUrlRe.test(token.href) ? token.href : `${window.codioIDE.getBoxUrl()}/${token.href}`
        urls.push(url)
      }
    }
    const markedInstance = new window.marked.Marked()
    markedInstance.use({ walkTokens })
    markedInstance.parse(content)
    const ruleFailed = urls.some((url) => !checkUrlExistsSync(url))
    return ruleFailed  ? 'The link to some external resource results in 404 error' : undefined
  },
  level: RULE_LEVELS.ISSUE
}
