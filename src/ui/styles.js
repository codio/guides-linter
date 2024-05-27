export const getStyles = (modalId) => {
  return `
#${modalId} {
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


#${modalId}-body {
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

#${modalId}-title {
  text-align: center;
}

#${modalId}-close {
  color: #aaa;
  font-size: 28px;
  font-weight: bold;
  position: absolute;
  right: 20px
}

#${modalId}-close:hover,
#${modalId}-close:focus {
  color: black;
  text-decoration: none;
  cursor: pointer;
}

#${modalId}-content {
  overflow: auto;
  min-height: 300px;
}

#${modalId}-content svg {
  position: relative;
  top: 3px;
  width: 1.1em;
  height: 1.1em;
}
  `
}
