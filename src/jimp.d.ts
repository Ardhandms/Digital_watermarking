declare module 'jimp/browser/lib/jimp' {
    import Jimp from 'jimp';
    export default Jimp;
}

declare global {
    interface Window {
        jimp: typeof Jimp;
    };
}