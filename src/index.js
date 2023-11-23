import rules, {checkRules} from './rules/index.js'
import {RULE_LEVELS} from './rules/const'
import {addStyle, loadJS, openEditor, promiseMapSeries} from './helpers'
import * as Modal from './ui/modal'
import * as uiHelpers from './ui/helpers'
import {getStyles} from './ui/styles'
import * as Button from './ui/button'
import {getErrorsStatus} from './ui/helpers'
import {getAssessmentById, setAssessmentById} from './state'

(function () {
  const CODIO_GUIDES_LINTER = 'codioGuidesLinter'
  const MARKDOWN_PARSER_URL = 'https://cdn.jsdelivr.net/npm/marked/marked.min.js'
  const LINTER_BUTTON_ID = 'codioGuidesLinterButton'
  const CHECK_GUIDES_TIMEOUT = 1000
  const ACTIONS = {
    GO_TO_SECTION: 'goToSection',
    EDIT_ASSESSMENT: 'editAssessment'
  }

  const getExtOptions = () => {
    let extOptions = {}
    try {
      extOptions = JSON.parse(localStorage.getItem(CODIO_GUIDES_LINTER))
    } catch {}
    return extOptions
  }

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

      addStyle(getStyles(LINTER_BUTTON_ID, Modal.MODAL_ID))
      const onClick = async () => {
        // const fileTreeStructureP = window.codioIDE.getFileTreeStructure()
        const [metadata, bookStructure, assessments] = await Promise.all([
          window.codioIDE.guides.getMetadata(),
          window.codioIDE.guides.getBookStructure(),
          window.codioIDE.guides.getAssessments()
        ])
        console.log('metadata, bookStructure, assessments', metadata, bookStructure, assessments)
        Modal.createModal(onModalClick)
        Modal.openModal()
        Modal.addModalContent('Loading pages info...')

        const contentPaths = metadata.getSections().map(section => section.contentPath)
        const allContent = await promiseMapSeries(
          contentPaths, path => window.codioIDE.getFileContent(path), 10
        )
        Modal.clearModal()

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
        setAssessmentById(assessmentById)
        const errors = checkAssessments(pagesInfoArr, assessmentById)
        const status = getErrorsStatus(errors)
        Modal.addModalContent(`<h4 style="color: ${status.color}">${status.message}</h4>`)
      }
      const onPositionUpdate = (button) => {
        const extOptions = getExtOptions()
        localStorage.setItem(CODIO_GUIDES_LINTER, JSON.stringify({...extOptions, button}))
      }
      const extOptions = getExtOptions()
      Button.create(extOptions, onClick, onPositionUpdate)
    } catch (e) {
      console.log(e.message)
      setTimeout(initializeGuidesLinter, CHECK_GUIDES_TIMEOUT)
    }
  }

  const onModalClick = (e) => {
    if (!e.target.dataset.action) {
      return
    }
    e.stopPropagation()
    const {action, ...options} = e.target.dataset
    onAction(action, options)
  }

  const onAction = async (action, options) => {
    await openEditor()

    switch (action) {
      case ACTIONS.GO_TO_SECTION:
        window.codioIDE.guides.goToSection({sectionId: options.sectionId})
        break
      case ACTIONS.EDIT_ASSESSMENT:
        window.codioIDE.guides.openAssessmentEditor({assessment: getAssessmentById()[options.taskId]})
        break
    }
    Modal.closeModal()
  }

  const checkAssessments = (pagesInfo, assessmentsById) => {
    Modal.addModalContent('<h3>Assessments</h3>')
    const list = document.createElement('ul')
    Modal.addModalContent(list)

    return pagesInfo.reduce((allErrors, {section, assessmentIds}) => {
      if (!assessmentIds.length) {
        return allErrors
      }
      const pageLink =`<a href='javascript:void(0)' data-action="${ACTIONS.GO_TO_SECTION}" 
data-section-id="${section.id}">${section.title}</a>`
      const allAssessmentsErrors = assessmentIds.reduce((allAErrors, aId) => {
        const listItem = document.createElement('li')
        list.append(listItem)
        const assessment = assessmentsById[aId]
        const assessmentNameNode = document.createElement('h5')
        const assessmentLink = `<a href='javascript:void(0)' data-action="${ACTIONS.EDIT_ASSESSMENT}" 
data-section-id="${section.id}" data-task-id="${assessment.taskId}"
>${assessment.source.name}(${assessment.taskId})</a>`
        assessmentNameNode.innerHTML = `${pageLink} - ${assessmentLink}`
        listItem.append(assessmentNameNode)
        const errors = []
        const errorsList = document.createElement('ul')
        listItem.append(errorsList)

        const assessmentErrors = checkRules('assessments', rules.assessment, null, assessment, RULE_LEVELS.SUGGESTION)
        errors.push(...assessmentErrors)
        uiHelpers.showAllErrors(errorsList, errors)

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
