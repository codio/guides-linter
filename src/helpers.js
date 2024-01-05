const absoluteUrlRe = new RegExp('^(?:[a-z+]+:)?//', 'i')

export const loadJS = (FILE_URL) => {
  let scriptEle = document.createElement('script')
  scriptEle.setAttribute('src', FILE_URL)
  scriptEle.setAttribute('type', 'text/javascript')
  scriptEle.setAttribute('async', 'true')
  document.body.appendChild(scriptEle)
}

export const addStyle = (() => {
  const style = document.createElement('style')
  document.head.append(style)
  return (styleString) => style.textContent = styleString
})()

const deferred = () => {
  let resolve, reject
  const promise = new Promise((resolveF, rejectF) => {
    resolve = resolveF
    reject = rejectF
  })
  return { resolve, reject, promise }
}

export const promiseMapSeries = (arr, iterator, limit = 1) => {
  if (!arr.length) {
    return Promise.resolve()
  }
  const d = deferred()
  const results = []
  const clonedArr = [...arr]
  const run = (notProcessedItems) => {
    const nItems = notProcessedItems.slice(0, limit)
    const promises = nItems.map(iterator)
    Promise.all(promises)
      .then((promisesResults) => {
        results.push(...promisesResults)
        const notProcessed = notProcessedItems.slice(limit)
        if (!notProcessed.length) {
          d.resolve(results)
          return
        }
        run(notProcessed)
      })
      .catch((error) => d.reject(error))
  }
  run(clonedArr)
  return d.promise
}

export const openEditor = async () => {
  if (window.codioIDE.guides.isEditorOpen()) {
    return
  }
  window.codioIDE.guides.openEditor()
  return new Promise(resolve => {
    const checkIsOpen = () => {
      if (window.codioIDE.guides.isEditorOpen()) {
        resolve()
      }
      setTimeout(checkIsOpen, 500)
    }
    checkIsOpen()
  })
}

export const checkResourceUrlExists = async (url) => {
  try {
    const result = await fetch(url, {method: 'HEAD'})
    return result.status === 200
  } catch {
    return false
  }
}

export const checkExternalUrlExists = async (url) => {
  try {
    const command = `wget -q --method=HEAD ${url}`
    const res = await window.codioIDE.remoteCommand.run(command)
    return res.code === 0
  } catch {
    return false
  }
}

export const promiseAllSeries = (arr) => {
  if (!arr.length) {
    return Promise.resolve()
  }
  const results = []
  let completed = 0
  const iterate = async () => {
    const res = await arr[completed]
    results.push(res)
    completed += 1
    if (completed >= arr.length) {
      return results
    }
    return iterate()
  }
  return iterate()
}

export const collectAllLinks = (content) => {
  const getAbsoluteUrl = (node, attr) => {
    const url = node.attributes.getNamedItem(attr)?.value
    if (!url) {
      return null
    }
    return absoluteUrlRe.test(url) ? url : `${window.codioIDE.getBoxUrl()}/${url}`
  }
  const parser = new DOMParser()
  const doc = parser.parseFromString(`<body>${window.marked.parse(content)}</body>`, 'text/html')
  return [
    ...[...doc.querySelectorAll('a')].map(node => ({url: getAbsoluteUrl(node, 'href'), external: true})),
    ...[...doc.querySelectorAll('audio')].map(node => ({url: getAbsoluteUrl(node, 'src')})),
    ...[...doc.querySelectorAll('iframe')].map(node => ({url: getAbsoluteUrl(node, 'src')})),
    ...[...doc.querySelectorAll('img')].map(node => ({url: getAbsoluteUrl(node, 'src')})),
    ...[...doc.querySelectorAll('source')].map(node => ({url: getAbsoluteUrl(node, 'src')})),
    ...[...doc.querySelectorAll('video')].map(node => ({url: getAbsoluteUrl(node, 'src')}))
  ]
}
