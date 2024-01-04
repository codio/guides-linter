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

export const checkUrlExistsSync = (url) => {
  console.log('checkUrlExistsSync', url)
  try {
    const http = new XMLHttpRequest()
    http.open('HEAD', url, false)
    http.send()
    return http.status === 200
  } catch {
    return false
  }
}
