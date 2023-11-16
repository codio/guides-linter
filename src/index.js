import rules, {checkRules} from './rules/index.js'
import {ASSESSMENT, RULE_LEVELS} from './rules/const'
import {addStyle, loadJS} from './helper'
import * as modal from './ui/modal'
import {getStyles} from './ui/styles'
import {getIconByLevel} from './ui/icons'

(function () {
  const CODIO_GUIDES_LINTER = 'codioGuidesLinter'
  const MARKDOWN_PARSER_URL = 'https://cdn.jsdelivr.net/npm/marked/marked.min.js'
  const LINTER_BUTTON_ID = 'codioGuidesLinterButton'
  let intervalId = null

  const initializeGuidesLinter = async () => {
    if (!window.codioIDE || !window.codioIDE.guides) {
      return
    }

    try {
      if (!window.codioIDE.isAuthorAssignment()) {
        clearInterval(intervalId)
        intervalId = null
        return
      }
      // check metadata, if no errors - create button
      await window.codioIDE.guides.getMetadata()
      clearInterval(intervalId)
      intervalId = null

      addStyle(getStyles(LINTER_BUTTON_ID, modal.MODAL_ID))
      // create button
      const button = document.createElement('button')
      button.id = LINTER_BUTTON_ID
      button.innerHTML = 'Check guides'
      button.type = 'button'
      let data = null
      try {
        data = JSON.parse(localStorage.getItem(CODIO_GUIDES_LINTER))
      } catch {}
      if (data && data.button) {
        let {top, left} = data.button
        top = Math.max(0, Math.min(top, window.innerHeight))
        left = Math.max(0, Math.min(left, window.innerWidth - 90))
        applyButtonPosition(button, top, left)
      }
      const onClick = async () => {
        // const metadataP = window.codioIDE.guides.getMetadata()
        // const bookStructureP = window.codioIDE.guides.getBookStructure()
        // const fileTreeStructureP = window.codioIDE.getFileTreeStructure()
        const assessments = await window.codioIDE.guides.getAssessments()
        console.log('assessments', assessments)
        modal.createModal()
        modal.openModal()
        const errors = checkAssessments(assessments)
        const status = getErrorsStatus(errors)
        const resultContent = `<h4 style="color: ${status.color}">${status.message}</h4>`
        modal.addModalContent(resultContent)
      }
      bindButtonEvents(button, onClick)
      document.body.append(button)
    } catch (e) {
      console.log(e.message)
    }
  }

  const getErrorsStatus = (errors) => {
    if (!errors.length) {
      return {color: 'green', message: 'Success'}
    }
    const groupped = {errors: [], warnings: [], suggestions: []}
    errors.forEach((item) => {
      item.level === RULE_LEVELS.ISSUE ? groupped.errors.push(item) :
        item.level === RULE_LEVELS.WARNING ? groupped.warnings.push(item) :
          groupped.suggestions.push(item)
    })
    const prefix = groupped.errors.length ? 'Error' : 'Success'
    const info = [
      `errors: ${groupped.errors.length}`,
      `warnings: ${groupped.warnings.length}`,
      `suggestions: ${groupped.suggestions.length}`
    ].join(', ')
    const message = `${prefix}(${info})`
    return {color: groupped.errors.length ? 'red' : 'green', message}
  }

  const applyButtonPosition = (button, top, left, store) => {
    button.style.top = `${top}px`
    button.style.left = `${left}px`
    button.style.right = 'auto'
    if (store) {
      let data = {}
      try {
        data = JSON.parse(localStorage.getItem(CODIO_GUIDES_LINTER))
      } catch {}
      const button = {top, left}
      localStorage.setItem(CODIO_GUIDES_LINTER, JSON.stringify({...data, button}))
    }
  }

  const bindButtonEvents = (button, onClick) => {
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
      applyButtonPosition(button, button.offsetTop + dy, button.offsetLeft + dx, true)

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

  const checkAssessmentType = (assessment) => {
    return assessment.type === ASSESSMENT.TYPES.FREE_TEXT ?
      'Free Text is used, use Free Text Autograde instead' : undefined
  }

  const checkAssessments = (assessments) => {
    modal.addModalContent('<h3>Assessments</h3>')
    const list = document.createElement('ul')
    modal.addModalContent(list)
    return assessments.reduce((allErrors, assessment) => {
      const listItem = document.createElement('li')
      list.append(listItem)
      const assessmentNameNode = document.createElement('h5')
      assessmentNameNode.innerHTML = `${assessment.source.name}(${assessment.taskId})`
      listItem.append(assessmentNameNode)
      const errors = []
      const errorsList = document.createElement('ul')
      const addError = (ruleName, message, level) => {
        errors.push({ruleName, message, level})
        errorsList.innerHTML += `<li>${getIconByLevel(level)} ${ruleName}: ${message}`
      }
      listItem.append(errorsList)
      const assessmentTypeError = checkAssessmentType(assessment)
      if (assessmentTypeError) {
        addError('assessmentType', assessmentTypeError, RULE_LEVELS.ISSUE)
        return allErrors.concat(errors)
      }

      const assessmentErrors = checkRules('assessments', rules.assessment, null, assessment, RULE_LEVELS.SUGGESTION)
      assessmentErrors.map(({ruleName, message, level}) => {
        addError(ruleName, message, level)
      })

      if (!errors.length) {
        const success = '<span style="color: green">&#x2714;</span> '
        assessmentNameNode.innerHTML = `${success}${assessment.source.name}`
      }
      return allErrors.concat(errors)
    }, [])
  }

  intervalId = setInterval(initializeGuidesLinter, 1000)
  loadJS(MARKDOWN_PARSER_URL)
})()
