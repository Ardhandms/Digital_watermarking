import './style.css'
import './helper/console'
import typescriptLogo from './typescript.svg'
import { decode, encode, status, load } from './lib/watermarking';

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <div id="app_container">
    <h1><img src="${typescriptLogo}" />Online Web Digital Watermarking</h1>
    <div>
      <input id="input" type="file" accept="image/gif, image/png, image/jpg, image/jpeg, image/svg" />
      <label>Watermark text: </label><input id="watermark" type="text" maxlength="10" placeholder="watermark" />
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
`;

(async () => {
  console.log('load opencv');
  try {
    await load();
    console.log('load opencv success');
  } catch(e) {
    console.error(e);
    console.log('load opencv error');
  }
})()

const input = document.querySelector<HTMLInputElement>('#input');
if (input) {
  input.onchange = async () => {
    const file = input.files![0];
    input.value = '';

    if (file) {
      console.log('file name', file.name);
      console.log('file size', file.size);
      if (!status.loaded && !status.loading) {
        return;
      };
      if (status.loading) return console.log('opencv is loading...');

      const watermarkEl = document.getElementById('watermark') as HTMLInputElement;

      try {
        console.log('start add watermark to file');
        await encode(file, watermarkEl.value || 'watermark');
        console.log('add watermark success');
      } catch (e) {
        console.error(e);
        console.log('add watermark error');
      }
    }
  }
}