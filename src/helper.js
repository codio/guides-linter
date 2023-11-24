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
