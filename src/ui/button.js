const LINTER_BUTTON_ID = 'codioGuidesLinterButton'

export const create = (extOptions, onClick, onPositionUpdate) => {
  const button = document.createElement('button')
  button.id = LINTER_BUTTON_ID
  button.innerHTML = 'Check guides'
  button.type = 'button'

  if (extOptions && extOptions.button) {
    let {top, left} = extOptions.button
    top = Math.max(0, Math.min(top, window.innerHeight))
    left = Math.max(0, Math.min(left, window.innerWidth - 90))
    applyButtonPosition(button, top, left)
  }
  bindButtonEvents(button, onClick, onPositionUpdate)
  document.body.append(button)
}

const bindButtonEvents = (button, onClick, onPositionUpdate) => {
  let x = 0
  let y = 0
  let drag = false
  const mouseDownHandler = function (e) {
    // Get the current mouse position
    x = e.clientX
    y = e.clientY

    // Attach the listeners to `document`
    document.addEventListener('mousemove', mouseMoveHandler)
    document.addEventListener('mouseup', mouseUpHandler)
  }

  const mouseMoveHandler = function (e) {
    drag = true
    // How far the mouse has been moved
    const dx = e.clientX - x
    const dy = e.clientY - y

    // Set the position of element
    applyButtonPosition(button, button.offsetTop + dy, button.offsetLeft + dx, onPositionUpdate)

    // Reassign the position of mouse
    x = e.clientX
    y = e.clientY
  }

  const mouseUpHandler = function () {
    if (!drag) {
      onClick()
    }
    drag = false
    // Remove the handlers of `mousemove` and `mouseup`
    document.removeEventListener('mousemove', mouseMoveHandler)
    document.removeEventListener('mouseup', mouseUpHandler)
  }
  button.addEventListener('mousedown', mouseDownHandler)
}

const applyButtonPosition = (button, top, left, onPositionUpdate) => {
  button.style.top = `${top}px`
  button.style.left = `${left}px`
  button.style.right = 'auto'
  onPositionUpdate && onPositionUpdate({top, left})
}
