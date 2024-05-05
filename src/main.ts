import Viewer from 'viewerjs';
import 'viewerjs/dist/viewer.min.css';
import './style.css'
import './helper/console'
import typescriptLogo from './typescript.svg'
import { decode, encode, status, load } from './lib/watermarking';

Reflect.set(window, 'debug', true);

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <div id="app_container">
    <h1 style="display: flex;align-items: center;">
      <img src="${typescriptLogo}" style="margin-right: 8px;" />
      Online Web Digital Watermarking
      <img id="opencv" style="height: 32px;margin-left: 8px;filter: grayscale(1);" src="https://opencv.org/wp-content/uploads/2022/05/logo.png"/>
    </h1>
    <div>
      <input id="input" type="file" accept="image/gif, image/png, image/jpg, image/jpeg, image/svg" />
      <label>Watermark text: </label><input id="watermark" type="text" maxlength="10" placeholder="watermark" />
    </div>

    <div id="info">
      <div id="result">
        <h3>encoded</h3>
        <div id="encode_result">
          <img />
        </div>
        <h3>decoded</h3>
        <div id="decode_result">
          <img />
        </div>
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
    (document.querySelector('#opencv') as HTMLImageElement).style.filter = 'grayscale(0)';
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

      console.log('start add watermark to file');
      console.time('encode');
      const url = await encode(file, watermarkEl.value || 'watermark');
      console.timeEnd('encode')
      console.log('add watermark to file success');

      // 加载结果
      const encodeResultImage = document.querySelector('#encode_result img') as HTMLImageElement;
      encodeResultImage.src = url;
      new Viewer(encodeResultImage)

      // 加载解码结果
      const fetchResult = await fetch(url)
      const arrayBuffer = await fetchResult.arrayBuffer();
      console.time('decode')
      const decodeResult = await decode(arrayBuffer);
      console.timeEnd('decode')
      const decodeResultImage = document.querySelector('#decode_result img') as HTMLImageElement;
      decodeResultImage.src = decodeResult;
      new Viewer(decodeResultImage);
    }
  }
}