import rules, {checkRules} from './rules/index.js'
import {RULE_LEVELS} from './rules/const'
import {addStyle, loadJS, openEditor, promiseAllSeries, promiseMapSeries} from './helpers'
import * as Modal from './ui/modal'
import * as uiHelpers from './ui/helpers'
import {getStyles} from './ui/styles'
import {getErrorsStatus} from './ui/helpers'
import {getAssessmentById, setAssessmentById} from './state'

(function () {
  const MARKDOWN_PARSER_URL = 'https://cdn.jsdelivr.net/npm/marked/marked.min.js'
  const CHECK_CODIO_API_TIMEOUT = 1000
  const ACTIONS = {
    GO_TO_SECTION: 'goToSection',
    EDIT_ASSESSMENT: 'editAssessment'
  }

  const onCheckGuides = async () => {
    try {
      // const fileTreeStructureP = window.codioIDE.getFileTreeStructure()
      const [metadata, bookStructure, assessments] = await Promise.all([
        window.codioIDE.guides.getMetadata(),
        window.codioIDE.guides.structure.getStructure(),
        window.codioIDE.guides.assessments.list()
      ])
      console.log('metadata, bookStructure, assessments', metadata, bookStructure, assessments)
      Modal.createModal(onModalClick)
      Modal.openModal()
      Modal.addModalContent('Loading pages info...')

      const contentPaths = metadata.getSections().map(section => section.contentPath)
      const allContent = await promiseMapSeries(
        contentPaths, path => window.codioIDE.files.getContent(path), 10
      )
      Modal.clearModal()

      const pagesInfoArr = metadata.getSections().map((section, index) => {
        const content = allContent[index]
        return {
          section,
          content,
          assessmentIds: window.codioIDE.guides.assessments.findIds(content, section.contentType)
        }
      })

      const assessmentById = assessments.reduce(
        (obj, assessment) => Object.assign(obj, {[assessment.taskId]: assessment}), {}
      )
      setAssessmentById(assessmentById)

      const assessmentErrors = await checkAssessments(pagesInfoArr, assessmentById)
      let status = getErrorsStatus(assessmentErrors)
      Modal.addModalContent(`<h4 style="color: ${status.color}">${status.message}</h4>`)

      const pagesErrors = await checkPages(pagesInfoArr, assessmentById)
      status = getErrorsStatus(pagesErrors)
      Modal.addModalContent(`<h4 style="color: ${status.color}">${status.message}</h4>`)

      const assignmentErrors = await checkAssignment(metadata, bookStructure)
      status = getErrorsStatus(assignmentErrors)
      Modal.addModalContent(`<h4 style="color: ${status.color}">${status.message}</h4>`)
    } catch (e) {
      console.error('Error start guides linter', e.message)
    }
  }

  const initializeGuidesLinter = async () => {
    if (!window.codioIDE || !window.codioIDE.guides || !window.codioIDE.menu) {
      setTimeout(initializeGuidesLinter, CHECK_CODIO_API_TIMEOUT)
      return
    }
    addStyle(getStyles(Modal.MODAL_ID))
    window.codioIDE.menu.addItem(
      {id: 'education'},
      {id: 'codioGuidesLinter', title: 'Check Guides', callback: onCheckGuides}
    )
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
        window.codioIDE.guides.assessments.openEditor({assessment: getAssessmentById()[options.taskId]})
        break
    }
    Modal.closeModal()
  }

  const checkPageAssessment = async (section, assessment, list, pageLink) => {
    const assessmentErrors = await checkRules('assessments', rules.assessment, null, assessment, RULE_LEVELS.SUGGESTION)
    const listItem = document.createElement('li')
    list.append(listItem)
    const assessmentNameNode = document.createElement('h5')
    const assessmentLink = `<a href='javascript:void(0)' data-action="${ACTIONS.EDIT_ASSESSMENT}" 
data-section-id="${section.id}" data-task-id="${assessment.taskId}"
>${assessment.source.name}(${assessment.taskId})</a>`
    assessmentNameNode.innerHTML = `${pageLink} - ${assessmentLink}`
    listItem.append(assessmentNameNode)
    const errorsList = document.createElement('ul')
    listItem.append(errorsList)
    uiHelpers.showAllErrors(errorsList, assessmentErrors)

    if (!assessmentErrors.length) {
      const success = '<span style="color: green">&#x2714;</span> '
      assessmentNameNode.innerHTML = `${success} ${assessmentNameNode.innerHTML}`
    }
    return assessmentErrors
  }

  const checkAssessments = async (pagesInfo, assessmentsById) => {
    Modal.addModalContent('<h3>Assessments</h3>')
    const list = document.createElement('ul')
    Modal.addModalContent(list)

    const promises = pagesInfo.map(({section, assessmentIds}) => {
      if (!assessmentIds.length) {
        return Promise.resolve([])
      }
      const pageLink =`<a href='javascript:void(0)' data-action="${ACTIONS.GO_TO_SECTION}"
data-section-id="${section.id}">${section.title}</a>`

      const promises = assessmentIds.map(aId => checkPageAssessment(section, assessmentsById[aId], list, pageLink))
      return promiseAllSeries(promises)
    })
    const allErrors = await promiseAllSeries(promises)
    return allErrors.flat(Infinity)
  }

  const checkPages = async (pagesInfo, assessmentsById) => {
    Modal.addModalContent('<h3>Pages</h3>')
    const list = document.createElement('ul')
    Modal.addModalContent(list)

    const promises = pagesInfo.map(async ({section, assessmentIds, content}) => {
      const data = {section, content, assessmentIds, assessmentsById}
      const pageErrors = await checkRules('pages', rules.page, null, data, RULE_LEVELS.SUGGESTION)
      const listItem = document.createElement('li')
      list.append(listItem)
      const pageNameNode = document.createElement('h5')
      pageNameNode.innerHTML = `<a href='javascript:void(0)' data-action="${ACTIONS.GO_TO_SECTION}" 
data-section-id="${section.id}">${section.title}</a>`
      listItem.append(pageNameNode)
      const errorsList = document.createElement('ul')
      listItem.append(errorsList)

      uiHelpers.showAllErrors(errorsList, pageErrors)

      if (!pageErrors.length) {
        const success = '<span style="color: green">&#x2714;</span> '
        pageNameNode.innerHTML = `${success} ${pageNameNode.innerHTML}`
      }
      return pageErrors
    })
    const allErrors = await promiseAllSeries(promises)
    return allErrors.flat(Infinity)
  }

  const checkAssignment = async (metadata, bookStructure) => {
    const titleEl = document.createElement('h3')
    titleEl.innerHTML = 'Assignment'
    Modal.addModalContent(titleEl)
    const list = document.createElement('ul')
    Modal.addModalContent(list)

    const data = {metadata, bookStructure}
    const assignmentErrors = await checkRules('assignment', rules.assignment, null, data, RULE_LEVELS.SUGGESTION)
    uiHelpers.showAllErrors(list, assignmentErrors)

    if (!assignmentErrors.length) {
      const success = '<span style="color: green">&#x2714;</span> '
      titleEl.innerHTML = `${success} ${titleEl.innerHTML}`
    }
    return assignmentErrors
  }

  setTimeout(initializeGuidesLinter, CHECK_CODIO_API_TIMEOUT)
  loadJS(MARKDOWN_PARSER_URL)
})()
