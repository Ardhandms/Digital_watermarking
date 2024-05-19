import Viewer from 'viewerjs';
import 'viewerjs/dist/viewer.min.css';
import './helper/console'
import './style.css'
import { decode, encode, status, load } from './lib/watermarking';

Reflect.set(window, 'debug', true);

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
<div id="app_container">
    <h1 style="display: flex;align-items: center;">
      Digital Watermarking Gambar
    </h1>
    <div>
    <label>Watermark text: </label><input id="watermark" type="text" maxlength="10" placeholder="Masukan teks watermark anda disini" />
      <input id="input" type="file" accept="image/gif, image/png, image/jpg, image/jpeg, image/svg" />
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
        <button id="reset" style="margin-left: 10px;">Reset</button>
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

      // Memuat hasi;
      const encodeResultImage = document.querySelector('#encode_result img') as HTMLImageElement;
      encodeResultImage.src = url;
      new Viewer(encodeResultImage)

      // Memuat hasil deskripsi
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
  const resetButton = document.querySelector<HTMLButtonElement>('#reset');
    if (resetButton) {
      resetButton.onclick = () => {
        const watermarkEl = document.getElementById('watermark') as HTMLInputElement;
        const encodeResultImage = document.querySelector('#encode_result img') as HTMLImageElement;
        const decodeResultImage = document.querySelector('#decode_result img') as HTMLImageElement;
        const inputFile = document.querySelector<HTMLInputElement>('#input');

        watermarkEl.value = '';
        encodeResultImage.src = '';
        decodeResultImage.src = '';
        if (inputFile) inputFile.value = '';
        
        console.log('reset completed');
      }
    }
}