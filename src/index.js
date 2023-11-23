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
  const CHECK_GUIDES_TIMEOUT = 1000

  const initializeGuidesLinter = async () => {
    if (!window.codioIDE || !window.codioIDE.guides) {
      return
    }

    try {
      // if (!window.codioIDE.isAuthorAssignment()) {
      //   return
      // }
      // check metadata, if no errors - create button
      await window.codioIDE.guides.getMetadata()

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
        // const fileTreeStructureP = window.codioIDE.getFileTreeStructure()
        const [metadata, bookStructure, assessments] = await Promise.all([
          window.codioIDE.guides.getMetadata(),
          window.codioIDE.guides.getBookStructure(),
          window.codioIDE.guides.getAssessments()
        ])
        console.log('metadata, bookStructure, assessments', metadata, bookStructure, assessments)
        modal.createModal()
        modal.openModal()
        // todo show loading pages info message
        console.log('loading pages info')

        const contentPromises = metadata.getSections()
          .map(section => window.codioIDE.getFileContent(section.contentPath))
        const allContent = await Promise.all(contentPromises)
        const pagesInfoArr = metadata.getSections().map((section, index) => {
          const content = allContent[index]
          return {
            section,
            content,
            assessmentIds: window.codioIDE.guides.findAssessmentsIds(content, section.contentType)
          }
        })
        console.log('pagesInfoArr', pagesInfoArr)

        const assessmentById = assessments.reduce(
          (obj, assessment) => Object.assign(obj, {[assessment.taskId]: assessment}), {}
        )
        const errors = checkAssessments(pagesInfoArr, assessmentById)
        const status = getErrorsStatus(errors)
        const resultContent = `<h4 style="color: ${status.color}">${status.message}</h4>`
        modal.addModalContent(resultContent)
      }
      bindButtonEvents(button, onClick)
      document.body.append(button)
    } catch (e) {
      console.log(e.message)
      setTimeout(initializeGuidesLinter, CHECK_GUIDES_TIMEOUT)
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

  const checkAssessments = (pagesInfo, assessmentsById) => {
    modal.addModalContent('<h3>Assessments</h3>')
    const list = document.createElement('ul')
    modal.addModalContent(list)

    return pagesInfo.reduce((allErrors, {section, assessmentIds}) => {
      if (!assessmentIds.length) {
        return allErrors
      }
      const pageLink = `<a href='javascript:void(0)' data-section-id="${section.id}">${section.title}</a>`
      const allAssessmentsErrors = assessmentIds.reduce((allAErrors, aId) => {
        const listItem = document.createElement('li')
        list.append(listItem)
        const assessment = assessmentsById[aId]
        const assessmentNameNode = document.createElement('h5')
        const assessmentLink = `<a href='javascript:void(0)' 
data-task-id="${assessment.taskId}">${assessment.source.name}(${assessment.taskId})</a>`
        assessmentNameNode.innerHTML = `${pageLink} - ${assessmentLink}`
        listItem.append(assessmentNameNode)
        const errors = []
        const errorsList = document.createElement('ul')
        listItem.append(errorsList)
        const showAllErrors = () => {
          const renderedErrors = errors
            .sort((a, b) => a.level > b.level ? -1 : a.level === b.level ? 0 : 1)
            .map(({ruleName, message, level}) => `<li>${getIconByLevel(level)} ${ruleName}: ${message}</li>`)
          errorsList.innerHTML += renderedErrors.join('')
        }
        const assessmentTypeError = checkAssessmentType(assessment)
        if (assessmentTypeError) {
          errors.push({ruleName: 'assessmentType', message: assessmentTypeError, level: RULE_LEVELS.ISSUE})
          showAllErrors()
          return allAErrors.concat(errors)
        }

        const assessmentErrors = checkRules('assessments', rules.assessment, null, assessment, RULE_LEVELS.SUGGESTION)
        errors.push(...assessmentErrors)
        showAllErrors()

        if (!errors.length) {
          const success = '<span style="color: green">&#x2714;</span> '
          assessmentNameNode.innerHTML = `${success} ${assessmentNameNode.innerHTML}`
        }
        return allAErrors.concat(errors)
      }, [])
      return allErrors.concat(allAssessmentsErrors)
    }, [])
  }

  setTimeout(initializeGuidesLinter, CHECK_GUIDES_TIMEOUT)
  loadJS(MARKDOWN_PARSER_URL)
})()
