import './style.css'
import typescriptLogo from './typescript.svg'

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <div id="app_container">
    <h1><img src="${typescriptLogo}" />Online Web Digital Watermarking</h1>
    <div>
      <input id="input" type="file" accept="image/gif, image/png, image/jpg, image/jpeg, image/svg" />
    </div>

    <div id="info">
      <div id="result">
        <h3>encoded</h3>
        <div id="encode_result"></div>
        <h3>decoded</h3>
        <div id="decode_result"></div>
      </div>
      <div id="logs">
        <h3>Logs</h3>
        <textarea readonly></textarea>
      </div>
    </div>
  </div>
`

const input = document.querySelector<HTMLInputElement>('#input');
if (input) {
  input.onchange = () => {
    const file = input.files![0];
    input.value = '';

    if (file) {
      console.log(file);
    }
  }
}