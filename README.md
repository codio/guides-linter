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
loadJS('https://static-assets.codio.com/guides-linter/index.js');
```
