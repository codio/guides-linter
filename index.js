(function () {
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
  const LINTER_BUTTON_ID = 'codioGuidesLinterButton'
  const MODAL_ID = 'codioGuidesLinterModal'
  let intervalId = null
  const styles = `
#${LINTER_BUTTON_ID} {
  position: absolute;
  right: 5px;
  top: 200px;
  z-index: 1;
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
      const re = /\*\*.+\*\*/s
      return !re.test(assessment.source.instructions) ?
        'Question should not be blank. Text should also be bold (**)' : undefined
    },
    maxAttemptsCount: (assessment) => {
      return assessment.source.hasOwnProperty('maxAttemptsCount') ?
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
      // todo parser??? Any code blocks (```) should have “-hide-clipboard”.
      return !assessment.source.guidance ? 'Rationale field should not be blank' : undefined
    },
    bloomsObjectiveLevel: (assessment) => {
      return !assessment.source.bloomsObjectiveLevel ? '"Bloom’s Level" field should not be blank' : undefined
    },
    learningObjectives: (assessment) => {
      const {learningObjectives} = assessment.source
      return !learningObjectives || learningObjectives.findIndex('SWBAT') !== 0 ?
        '"Learning Objectives" field should not be blank, and it should start with “SWBAT”.' : undefined
    },
    contentTag: (assessment) => {
      const {metadata} = assessment.source
      const contentTag = metadata || metadata.tags || metadata.tags.find(item => item.name === 'Content')
      return !contentTag || !contentTag.value ? 'Metadata "Content" tag field should not be blank' : undefined
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
      if (!assessment.type === ASSESSMENT_TYPES.PARSONS_PUZZLE) {
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
      const metadataP = window.codioIDE.guides.getMetadata()
      const assessmentsP = window.codioIDE.guides.getAssessments()
      const bookStructureP = window.codioIDE.guides.getBookStructure()
      const fileTreeStructureP = window.codioIDE.getFileTreeStructure()
      const [
        metadata,
        assessments,
        bookStructure,
        fileTreeStructure
      ] = await Promise.all([metadataP, assessmentsP, bookStructureP, fileTreeStructureP])
      console.log('metadata', metadata)
      console.log('assessments', assessments)
      console.log('bookStructure', bookStructure)
      console.log('fileTreeStructure', fileTreeStructure)
      clearInterval(intervalId)
      intervalId = null

      addStyle(styles)
      // create button
      const button = document.createElement('button')
      button.id = LINTER_BUTTON_ID
      button.innerHTML = 'Check guides'
      button.type = 'button'
      button.onclick = () => {
        createModal()
        openModal()
        const errors = checkAssessments(assessments)
        const color = errors.length ? 'red' : 'green'
        const text = errors.length ? `Failed(${errors.length} Error${errors.length > 1 ? 's' : ''})` : 'Success'
        const resultContent = `<h4 style="color: ${color}">${text}</h4>`
        addModalContent(resultContent)
      }
      document.body.append(button)
    } catch (e) {
      console.error(e.message)
    }
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
      listItem.append(errorsList)
      for (const [ruleName, ruleFunc] of Object.entries(ASSESSMENT_RULES)) {
        const error = ruleFunc(assessment)
        if (error) {
          errors.push({ruleName, error})
          errorsList.innerHTML += `<li><span style="color: red;">&#x2716;</span> ${ruleName}: ${error}`
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
})()
