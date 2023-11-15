import {RULE_LEVELS} from '../../const'

export default {
  action: (assessment) => {
    const requiredTags = ['Content', 'Category']
    const {metadata} = assessment.source
    const validAssessmentRequiredTags = metadata && metadata.tags ?
      requiredTags.filter(tagName => metadata.tags.find(item => item.name === tagName && item.value)) :
      []
    const isTagsValid = validAssessmentRequiredTags.length === requiredTags.length
    return !isTagsValid ? 'Metadata "Content" and "Category" tag fields should not be blank' : undefined
  },
  level: RULE_LEVELS.ISSUE
}
