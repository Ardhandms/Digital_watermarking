import './style.css'
import typescriptLogo from './typescript.svg'

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <div>
    <h1><img src="${typescriptLogo}" />Online Web Digital Watermarking</h1>
    <div>
      <input id="input" type="file" accept="image/gif, image/png, image/jpg, image/jpeg, image/svg" />
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