# guides-linter

### Usage:

Add following custom script to the organization

see [Custom scripts](https://docs.codio.com/instructors/admin/organization/enable-custom-script.html)


```javascript
function loadJS(FILE_URL) {
  let scriptEle = document.createElement("script");
  scriptEle.setAttribute("src", FILE_URL);
  scriptEle.setAttribute("type", "text/javascript");
  scriptEle.setAttribute("async", true);
  document.body.appendChild(scriptEle);
}
loadJS('https://static-assets.codio.com/guides-linter/${tag}/index.js');
```


# Rules

## General
  * Name (General) - This field should not be blank.
  * Show Name (General) - This should be toggled off.
  * Question (General) - This field should not be blank. Text should also be bold (**) or an H3 tag (###).
  * Defined Number of Attempts (Grading) - This should be toggled off.
  * Show Expected Answer (Grading) - This should be set to “After 2”.
  * Rationale (Grading) - This field should not be blank. Any code blocks (```) should have “-hide-clipboard”.
  * Bloom’s Level (Metadata) - This field should not be blank.
  * Learning Objectives (Metadata) - This field should not be blank, and it should start with “SWBAT”.
  * Tags (Content and Category)(Metadata) - This field should not be blank.

## Multiple Choice Questions
  * Shuffle Answers (Execution) - This should be toggled on.

## Fill in the Blank
  * Text (Execution) - This should not be blank, and there should be at least one <<< and >>> pair.
  * Show Possible Values (Execution) - This should be toggled on.

## Parsons
  * Code to Become Blocks (Execution) - This should not be blank.
  * Show Feedback (Execution) - This should be checked.

## Free Text Autograde
  * Command (Execution) - This should not be blank.
