/**
 * @see https://github.com/unjs/image-meta/tree/main/src/types
 */
// load all available handlers explicitely for browserify support
import { GIF } from './gif';
import { JPG } from "./jpg";
import { PNG } from "./png";
import { SVG } from "./svg";
import { WEBP } from "./webp";

export const typeHandlers = {
  gif: GIF,
  jpg: JPG,
  png: PNG,
  svg: SVG,
  webp: WEBP,
};

export type ImageType = keyof typeof typeHandlers;