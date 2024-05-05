/**
 * image process
 */
import { Buffer } from 'buffer';
import { typeHandlers } from "./types";
import type { ImageType } from "./types";
import type { ImageMeta } from "./types/interface";
export type { ImageMeta } from "./types/interface";

// This map helps avoid validating for every single image type
const typeOfFirstBytes: { [byte: number]: ImageType } = {
    0x47: "gif",
    0x52: "webp",
    0x89: "png",
    0xff: "jpg",
  };

export function getMeta(input: Buffer): ImageMeta {
    const buffer: Uint8Array = new Uint8Array(input.buffer);
    const firstByte = buffer[0];
    if (!(firstByte in typeOfFirstBytes)) throw new Error(`Invalid image type: ${firstByte}`);
    const type = typeOfFirstBytes[firstByte] as ImageType;
    if (!(type in typeHandlers)) throw new Error(`Unsupported image type: ${firstByte}`);
    if (!typeHandlers[type].validate(buffer)) throw new Error(`Invalid ${type} image`);
    const meta = typeHandlers[type].calculate(buffer);
    return meta;
}

export async function blob2imageData(blob: Blob | File, options: { maxWidth?: number, maxHeight?: number } = {}): Promise<ImageData> {
    const { maxHeight = 1080, maxWidth = 1920 }  = options;
    return new Promise((resolve, reject) => {
        const url = URL.createObjectURL(blob);
        const image = new Image();
        image.onerror = (e) => {
            URL.revokeObjectURL(url);
            reject(e);
        }

        image.onload = () => {
            URL.revokeObjectURL(url);
            const canvas = document.createElement('canvas');

            // calculate max scale
            const scale = Math.min(
                maxWidth / image.width,
                maxHeight / image.width,
                1
            );
            canvas.width = image.width * scale;
            canvas.height  = image.height * scale;
            console.log('result size', canvas.width, canvas.height)

            const ctx = canvas.getContext('2d');
            if (!ctx) {
                return reject(new Error('ctx error'))
            }
            ctx.drawImage(image, 0, 0, image.width, image.height, 0, 0, canvas.width, canvas.height);
            // 有大图片尺寸崩溃风险
            resolve(ctx.getImageData(0, 0, canvas.width, canvas.height));
        }
        image.src = url;
    })
}

export function getImageBlob(input: Buffer, type?: string) {
    return new Blob([input], type ? { type } : undefined);
}

export function getImageBlobUrlFromBuffer(input: Buffer, type?: string) {
    const blob = getImageBlob(input, type);
    return URL.createObjectURL(blob);
}

export function getImageBlobUrlFromBlob(input: Blob) {
    return URL.createObjectURL(input);
}

export function getImageDataFromBuffer(input: Buffer): Promise<ImageData> {
    return blob2imageData(getImageBlob(input));
}

export function getBlobFromImageData(imagedata: ImageData, type?: string): Promise<Blob> {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('ctx error');

    canvas.width = imagedata.width;
    canvas.height = imagedata.height;
    ctx.putImageData(imagedata, 0, 0);
    return new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
            if (!blob) return reject(new Error('generate blob from imagedata error'));
            resolve(blob);
        }, type);
    })
}