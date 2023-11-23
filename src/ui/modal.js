export const MODAL_ID = 'codioGuidesLinterModal'

export const createModal = (onClick) => {
  let modal = document.getElementById(MODAL_ID)
  if (modal) {
    clearModal()
    return
  }
  modal = document.createElement('div')
  modal.id = MODAL_ID
  const modalBody = document.createElement('div')
  modalBody.id = `${MODAL_ID}-body`
  const closeBtn = document.createElement('span')
  closeBtn.onclick = () =>  {
    modal.style.display = 'none'
  }
  closeBtn.id = `${MODAL_ID}-close`
  closeBtn.innerHTML = '&times;'
  modalBody.append(closeBtn)
  const title = document.createElement('h2')
  title.id = `${MODAL_ID}-title`
  title.innerHTML = 'Guides linter'
  modalBody.append(title)
  const modalContent = document.createElement('div')
  modalContent.id = `${MODAL_ID}-content`
  modalBody.append(modalContent)
  modal.append(modalBody)
  document.body.append(modal)
  modal.onclick = onClick
}

export const openModal = () => {
  const modal = document.getElementById(MODAL_ID)
  if (modal) {
    modal.style.display = 'block'
  }
}

export const clearModal = () => {
  const modalContent = document.getElementById(`${MODAL_ID}-content`)
  if (modalContent) {
    modalContent.innerHTML = ''
  }
}

export const addModalContent = (textOrNode) => {
  const modalContent = document.getElementById(`${MODAL_ID}-content`)
  if (!modalContent) {
    return
  }
  if (typeof textOrNode === 'string' || textOrNode instanceof String) {
    modalContent.innerHTML += textOrNode
  } else {
    modalContent.append(textOrNode)
  }
}

export const closeModal = () => {
  const modal = document.getElementById(MODAL_ID)
  modal.style.display = 'none'
}
