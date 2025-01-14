import cv, { Mat } from '@anpanman/opencv_ts';
import { Buffer } from 'buffer';
import '../helper/console'
import { getImageDataFromBuffer, getMeta, getImageBlobUrlFromBlob, getBlobFromImageData } from '../helper/image';

function log(...data: any[]) {
  if (Reflect.get(window, 'debug')) console.log(...data);
}

export const status = {
  loaded: false,
  loading: false
}
export const opencv = cv
export enum CHANNEL {
  R = 2,
  G = 1,
  B = 0
}

/**
 * Memuat si OpenCV
 */
export async function load (): Promise<void> {
  if (status.loaded || status.loading) {
    return
  }
  status.loading = true
  await cv.loadOpenCV()
  status.loading = false
  status.loaded = true
}

export function fileToBuffer (file: File): Promise<Buffer> {
  const fileReader = new FileReader()
  return new Promise((resolve, reject) => {
    fileReader.readAsArrayBuffer(file)
    fileReader.onerror = reject
    fileReader.onload = () => resolve(Buffer.from(fileReader.result as ArrayBuffer))
  })
}

function idft (src: Mat, dst: Mat, flags: number, nonzero_rows: number) {
  cv.dft(src, dst, flags | cv.DFT_INVERSE, nonzero_rows)
}

function shiftDFT (mag: Mat) {
  const rect = new cv.Rect(0, 0, mag.cols & (-2), mag.rows & (-2))
  mag.roi(rect)

  const cx = mag.cols / 2
  const cy = mag.rows / 2

  const q0 = mag.roi(new cv.Rect(0, 0, cx, cy))
  const q1 = mag.roi(new cv.Rect(cx, 0, cx, cy))
  const q2 = mag.roi(new cv.Rect(0, cy, cx, cy))
  const q3 = mag.roi(new cv.Rect(cx, cy, cx, cy))

  const tmp = new cv.Mat()
  q0.copyTo(tmp)
  q3.copyTo(q0)
  tmp.copyTo(q3)

  q1.copyTo(tmp)
  q2.copyTo(q1)
  tmp.copyTo(q2)

  tmp.delete()
  q0.delete()
  q1.delete()
  q2.delete()
  q3.delete()
}

function getChannel (image: Mat, channelIndex = 0) {
  const nextImg = image
  const channel = new cv.MatVector()
  cv.split(nextImg, channel)
  return channel.get(channelIndex)
}

function getDftMat (padded: cv.Mat): Mat {
  const planes = new cv.MatVector()
  planes.push_back(padded)
  const matZ = cv.Mat.zeros(padded.size(), cv.CV_32F)
  planes.push_back(matZ)
  const comImg = new cv.Mat()
  cv.merge(planes, comImg)
  cv.dft(comImg, comImg)
  matZ.delete()
  return comImg
}

function addTextByMat (comImg: Mat, watermarkText: string, point: cv.PointLike, fontSize: number) {
  cv.putText(
    comImg,
    watermarkText,
    point,
    cv.FONT_HERSHEY_DUPLEX,
    fontSize,
    new cv.Scalar(0, 0, 0, 0),
    2
  )
  cv.flip(comImg, comImg, -1)
  cv.putText(
    comImg,
    watermarkText,
    point,
    cv.FONT_HERSHEY_DUPLEX,
    fontSize,
    new cv.Scalar(0, 0, 0, 0),
    2
  )
  cv.flip(comImg, comImg, -1)
}

function transFormMatWithText (srcImg: Mat, watermarkText: string, fontSize: number, channelIndex: number) {
  const padded = getChannel(srcImg, channelIndex)
  padded.convertTo(padded, cv.CV_32F)
  const comImg = getDftMat(padded)
  // add sebuah text
  const center = new cv.Point(padded.cols / 2, padded.rows / 2)
  addTextByMat(comImg, watermarkText, center, fontSize)
  const outer = new cv.Point(45, 45)
  addTextByMat(comImg, watermarkText, outer, fontSize)
  // back image
  const invDFT = new cv.Mat()
  idft(comImg, invDFT, cv.DFT_SCALE | cv.DFT_REAL_OUTPUT, 0)
  const restoredImage = new cv.Mat()
  invDFT.convertTo(restoredImage, cv.CV_8U)
  const backPlanes = new cv.MatVector()
  cv.split(srcImg, backPlanes)

  backPlanes.set(0, restoredImage)
  const backImage = new cv.Mat()
  cv.merge(backPlanes, backImage)

  padded.delete()
  comImg.delete()
  invDFT.delete()
  restoredImage.delete()
  return backImage
}

function getTextFormMat (backImage: Mat, channelIndex: number) {
  const padded = getChannel(backImage, channelIndex)
  padded.convertTo(padded, cv.CV_32F)
  const comImg = getDftMat(padded)
  const backPlanes = new cv.MatVector()
  // split comples gambar menjadi 2 backPlanes
  cv.split(comImg, backPlanes)
  const mag = new cv.Mat()
  // compute si magnitude nya
  cv.magnitude(backPlanes.get(0), backPlanes.get(1), mag)
  // Pindahkan ke logarithmic scale
  const matOne = cv.Mat.ones(mag.size(), cv.CV_32F)
  cv.add(matOne, mag, mag)
  cv.log(mag, mag)
  shiftDFT(mag)
  mag.convertTo(mag, cv.CV_8UC1)
  cv.normalize(mag, mag, 0, 255, cv.NORM_MINMAX, cv.CV_8UC1)

  padded.delete()
  comImg.delete()
  matOne.delete()
  return mag
}

function matToImageData (mat: Mat): ImageData {
  if (!(mat instanceof cv.Mat)) {
    throw new Error('Please input the valid new cv.Mat instance.')
  }
  const img = new cv.Mat()
  const depth = mat.type() % 8
  const scale = depth <= cv.CV_8S ? 1 : depth <= cv.CV_32S ? 1 / 256 : 255
  const shift = depth === cv.CV_8S || depth === cv.CV_16S ? 128 : 0
  mat.convertTo(img, cv.CV_8U, scale, shift)
  switch (img.type()) {
    case cv.CV_8UC1:cv.cvtColor(img, img, cv.COLOR_GRAY2RGBA); break
    case cv.CV_8UC3:cv.cvtColor(img, img, cv.COLOR_RGB2RGBA); break
    case cv.CV_8UC4:break
    default:throw new Error('Bad number of channels (Source image must have 1, 3 or 4 channels)')
  }
  const imgData = new ImageData(new Uint8ClampedArray(img.data), img.cols);
  img.delete()
  return imgData
}

/**
 * 
 * @param source
 * @param watermarkText
 * @param fontSize
 * @param channel
 * @returns
 */
export async function encode (
  source: File | ArrayBuffer | Buffer,
  watermarkText: string,
  fontSize = 1.1,
  channel: CHANNEL = CHANNEL.B
):Promise<string> {
  if (!status.loaded) {
    throw new Error('opencv is not loaded')
  }
  if ((typeof fontSize) !== 'number') {
    throw new Error('fontSize must be number')
  }
  if ((typeof watermarkText) !== 'string' || !watermarkText) {
    throw new Error('watermark is needed')
  }

  let sourceBuffer: Buffer
  if (Buffer.isBuffer(source)) {
    sourceBuffer = source
  } else if (source instanceof ArrayBuffer) {
    sourceBuffer = Buffer.from(source)
  } else if (source instanceof File) {
    sourceBuffer = await fileToBuffer(source)
  } else {
    throw new Error('please use Buffer， arrayBuffer or File')
  }
  const { type } = getMeta(sourceBuffer);
  log('[web-digital-watermarking]', '[-add-watermark]', 'get imageData start');
  const imageData = await getImageDataFromBuffer(sourceBuffer);
  log('[web-digital-watermarking]', '[-add-watermark]', 'get imageData end')
  const srcImg = cv.matFromImageData(imageData);
  if (srcImg.empty()) { 
    srcImg.delete();
    throw new Error('read image failed')
  }
  
  log('[web-digital-watermarking]', '[-add-watermark]', 'getSrcImage end')
  const resultImg = transFormMatWithText(srcImg, watermarkText, fontSize, channel);
  log('[web-digital-watermarking]', '[-add-watermark]', 'add watermark to mat end')

  const resultImageData = matToImageData(resultImg);
  log('[web-digital-watermarking]', '[-add-watermark]', 'mat to buffer end')
  srcImg.delete();
  resultImg.delete();
  const blob = await getBlobFromImageData(resultImageData, type);
  return getImageBlobUrlFromBlob(blob);
}

/**
 * 
 * @param source
 * @param channel
 * @returns
 */
export async function decode(
  source: File | ArrayBuffer | Buffer,
  channel: CHANNEL = CHANNEL.B
): Promise<string> {
  if (!status.loaded) {
    throw new Error('opencv is not loaded')
  }

  let sourceBuffer: Buffer
  if (Buffer.isBuffer(source)) {
    sourceBuffer = source
  } else if (source instanceof ArrayBuffer) {
    sourceBuffer = Buffer.from(source)
  } else if (source instanceof File) {
    sourceBuffer = await fileToBuffer(source)
  } else {
    throw new Error('please use Buffer， arrayBuffer or File')
  }

  log('[web-digital-watermarking]', '[-get-watermark]', 'get imageData start')
  const imageData = await getImageDataFromBuffer(sourceBuffer);
  log('[web-digital-watermarking]', '[-get-watermark]', 'get imageData end')
  const comImg = cv.matFromImageData(imageData)
  log('[web-digital-watermarking]', '[-get-watermark]', 'get comImg end')
  const resultImage = getTextFormMat(comImg, channel)
  log('[web-digital-watermarking]', '[-get-watermark]', 'get resultImage end')
  const resultImageData = matToImageData(resultImage);
  comImg.delete()
  resultImage.delete()

  const blob = await getBlobFromImageData(resultImageData)

  return getImageBlobUrlFromBlob(blob);
}

export default {
  load,
  decode,
  encode,
  CHANNEL
}
