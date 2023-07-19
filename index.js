(function () {
  const CODIO_GUIDES_LINTER = 'codioGuidesLinter'
  const ASSESSMENT_TYPES = {
    TEST: 'test',
    MULTIPLE_CHOICE: 'multiple-choice',
    FILL_IN_THE_BLANKS: 'fill-in-the-blanks',
    FREE_TEXT: 'free-text',
    FREE_TEXT_AUTO: 'free-text-auto',
    CODE_OUTPUT_COMPARE: 'code-output-compare',
    CUSTOM: 'custom',
    MATH: 'math-stack',
    GRADE_BOOK: 'grade-book',
    PARSONS_PUZZLE: 'parsons-puzzle',
    JUPYTER_NOTEBOOK: 'jupyter-notebook',
    SENSE_NETWORK: 'sense-network',
    RANDOM: 'random'
  }
  const MARKDOWN_PARSER_URL = 'https://cdn.jsdelivr.net/npm/marked/marked.min.js'
  const LINTER_BUTTON_ID = 'codioGuidesLinterButton'
  const MODAL_ID = 'codioGuidesLinterModal'
  let intervalId = null
  const styles = `
#${LINTER_BUTTON_ID} {
  position: absolute;
  right: 5px;
  top: 200px;
  z-index: 1;
  cursor: pointer;
  width: 90px;
}
  
#${MODAL_ID} {
  display: none;
  position: fixed;
  z-index: 1000;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  overflow: auto;
  background-color: rgb(0,0,0);
  background-color: rgba(0,0,0,0.4);
}


#${MODAL_ID}-body {
  max-height: 90%;
  top: 20px;
  position: relative;
  display: flex;
  flex-direction: column;
  background-color: #fefefe;
  margin: 0 auto;
  padding: 20px 40px;
  border: 1px solid #888;
  width: 80%;
}

#${MODAL_ID}-title {
  text-align: center;
}

#${MODAL_ID}-close {
  color: #aaa;
  font-size: 28px;
  font-weight: bold;
  position: absolute;
  right: 20px
}

#${MODAL_ID}-close:hover,
#${MODAL_ID}-close:focus {
  color: black;
  text-decoration: none;
  cursor: pointer;
}

#${MODAL_ID}-content {
  overflow: auto;
  min-height: 300px;
}
  `
  const ASSESSMENT_RULES = {
    name: (assessment) => {
      return !assessment.source.name ? 'Name should not be blank' : undefined
    },
    showName: (assessment) => {
      return assessment.source.showName ? '"Show Name" should be toggled off' : undefined
    },
    question: (assessment) => {
      const re = /^(\*\*.+\*\*|### .+)/s
      return !re.test(assessment.source.instructions) ?
        'Question should not be blank. Text should also be bold (**)' : undefined
    },
    maxAttemptsCount: (assessment) => {
      return assessment.source.maxAttemptsCount ?
        '"Defined Number of Attempts" should be toggled off' : undefined
    },
    showExpectedAnswer: (assessment) => {
      const {showGuidanceAfterResponseOption} = assessment.source
      return !showGuidanceAfterResponseOption ||
        showGuidanceAfterResponseOption.type !== 'Attempts' ||
        showGuidanceAfterResponseOption.passedFrom !== 2 ?
        '"Show Expected Answer" should be set to “After 2”' : undefined
    },
    guidance: (assessment) => {
      const {guidance} = assessment.source
      const lexerData = window.marked.lexer(guidance || '')
      const allCodeBlocksHideClipboard = lexerData
        .filter(item => item.type === 'code')
        .every(item => item.lang.includes('-hide-clipboard'))
      return !guidance || !allCodeBlocksHideClipboard ?
        'Rationale field should not be blank. Any code blocks (```) should have “-hide-clipboard”.' : undefined
    },
    bloomsObjectiveLevel: (assessment) => {
      return !assessment.source.bloomsObjectiveLevel ? '"Bloom’s Level" field should not be blank' : undefined
    },
    learningObjectives: (assessment) => {
      const {learningObjectives} = assessment.source
      return !learningObjectives || learningObjectives.indexOf('SWBAT') !== 0 ?
        '"Learning Objectives" field should not be blank, and it should start with “SWBAT”.' : undefined
    },
    requiredTags: (assessment) => {
      const requiredTags = ['Content', 'Category']
      const {metadata} = assessment.source
      const validAssessmentRequiredTags = metadata && metadata.tags ?
        requiredTags.filter(tagName => metadata.tags.find(item => item.name === tagName && item.value)) :
        []
      const isTagsValid = validAssessmentRequiredTags.length === requiredTags.length
      return !isTagsValid ? 'Metadata "Content" and "Category" tag fields should not be blank' : undefined
    },
    // Multiple Choice Questions
    shuffleAnswersMultipleChoice: (assessment) => {
      return assessment.type === ASSESSMENT_TYPES.MULTIPLE_CHOICE && !assessment.source.isRandomized ?
        '"Shuffle Answers" in "Multiple Choice Questions" should be toggled on' : undefined
    },
    // Fill in the blanks
    textFillInTheBlanks: (assessment) => {
      const re = /((?:.|\n)*?)<<<(.+?)>>>/g
      return assessment.type === ASSESSMENT_TYPES.FILL_IN_THE_BLANKS &&
        (!assessment.source.text || !re.exec(assessment.source.text)) ?
        'Text in "Fill in the blanks" should not be blank, and there should be at least one <<< and >>> pair.' :
        undefined
    },
    showPossibleValuesFillInTheBlanks: (assessment) => {
      return assessment.type === ASSESSMENT_TYPES.FILL_IN_THE_BLANKS && !assessment.source.showValues ?
        '"Show possible values" in "Fill in the blanks" should be toggled on.' : undefined
    },
    // Parsons puzzle
    codeToBecomeBlocksParsons: (assessment) => {
      return assessment.type === ASSESSMENT_TYPES.PARSONS_PUZZLE && !assessment.source.initial ?
        '"Code to Become Blocks" in "Parsons Puzzle" should not be blank.' : undefined
    },
    showFeedbackParsons: (assessment) => {
      if (assessment.type !== ASSESSMENT_TYPES.PARSONS_PUZZLE) {
        return
      }
      try {
        const options = JSON.parse(assessment.source.options)
        return !options.show_feedback ? '"Show Feedback" in "Parsons Puzzle" should be checked.' : undefined
      } catch ({message}) {
        return message
      }
    },
    // Free text autograde
    commandFreeTextAutograde: (assessment) => {
      return assessment.type === ASSESSMENT_TYPES.FREE_TEXT_AUTO && !assessment.source.command ?
        '"Command" in "Free text autograde" should not be blank.' : undefined
    }
  }
  function loadJS(FILE_URL) {
    let scriptEle = document.createElement('script')
    scriptEle.setAttribute('src', FILE_URL)
    scriptEle.setAttribute('type', 'text/javascript')
    scriptEle.setAttribute('async', 'true')
    document.body.appendChild(scriptEle)
  }
  const addStyle = (() => {
    const style = document.createElement('style')
    document.head.append(style)
    return (styleString) => style.textContent = styleString
  })()
  const createModal = () => {
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
  }
  const openModal = () => {
    const modal = document.getElementById(MODAL_ID)
    if (modal) {
      modal.style.display = 'block'
    }
  }
  const clearModal = () => {
    const modalContent = document.getElementById(`${MODAL_ID}-content`)
    if (modalContent) {
      modalContent.innerHTML = ''
    }
  }
  const addModalContent = (textOrNode) => {
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

      addStyle(styles)
      // create button
      const button = document.createElement('button')
      button.id = LINTER_BUTTON_ID
      button.innerHTML = 'Check guides'
      button.type = 'button'
      const data = JSON.parse(localStorage.getItem(CODIO_GUIDES_LINTER))
      if (data && data.button) {
        applyButtonPosition(button, data.button.top, data.button.left)
      }
      const onClick = async () => {
        // const metadataP = window.codioIDE.guides.getMetadata()
        // const bookStructureP = window.codioIDE.guides.getBookStructure()
        // const fileTreeStructureP = window.codioIDE.getFileTreeStructure()
        const assessments = await window.codioIDE.guides.getAssessments()
        console.log('assessments', assessments)
        createModal()
        openModal()
        const errors = checkAssessments(assessments)
        const color = errors.length ? 'red' : 'green'
        const text = errors.length ? `Failed(${errors.length} Error${errors.length > 1 ? 's' : ''})` : 'Success'
        const resultContent = `<h4 style="color: ${color}">${text}</h4>`
        addModalContent(resultContent)
      }
      bindButtonEvents(button, onClick)
      document.body.append(button)
    } catch (e) {
      console.log(e.message)
    }
  }

  const checkAssessmentType = (assessment) => {
    return assessment.type === ASSESSMENT_TYPES.FREE_TEXT ?
      'Free Text is used, use Free Text Autograde instead' : undefined
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

  const checkAssessments = (assessments) => {
    addModalContent('<h3>Assessments</h3>')
    const list = document.createElement('ul')
    addModalContent(list)
    return assessments.reduce((allErrors, assessment) => {
      const listItem = document.createElement('li')
      list.append(listItem)
      const assessmentNameNode = document.createElement('h5')
      assessmentNameNode.innerHTML = `${assessment.source.name}(${assessment.taskId})`
      listItem.append(assessmentNameNode)
      const errors = []
      const errorsList = document.createElement('ul')
      const addError = (ruleName, error) => {
        errors.push({ruleName, error})
        errorsList.innerHTML += `<li><span style="color: red;">&#x2716;</span> ${ruleName}: ${error}`
      }
      listItem.append(errorsList)
      const assessmentTypeError = checkAssessmentType(assessment)
      if (assessmentTypeError) {
        addError('assessmentType', assessmentTypeError)
        return allErrors.concat(errors)
      }
      for (const [ruleName, ruleFunc] of Object.entries(ASSESSMENT_RULES)) {
        let error
        try {
          error = ruleFunc(assessment)
        } catch ({message}) {
          error = message
        }
        if (error) {
          addError(ruleName, error)
        }
      }
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
