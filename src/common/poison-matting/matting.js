
import InpaintTelea from './inpaint'
import blur from './gaussion_filter'
export default class MattingHandler {
    // 传入两个灰度图
    constructor(imgData, imgMapData) {
        this.imgData = imgData;
        this.imgMapData = imgMapData;
    }
    sum = (array) => {
        let sum = 0;
        for (let i of array) {
            sum += i;
        }
        return sum;
    }
    // readImgData = (img) => {
    //     var canvas = document.createElement("canvas");
    //     canvas.width = img.width;
    //     canvas.height = img.height;

    //     var ctx = canvas.getContext("2d");
    //     ctx.drawImage(img, 0, 0);

    //     let data = ctx.getImageData(0, 0, img.width, img.height).data;
    //     return data2gray(data, img.width, img.height);
    // }
    // drawAlphaOnCanvas = (alpha) => {
    //     let canvas = document.getElementById('canvas');
    //     canvas.width = w;
    //     canvas.height = h;
    //     let ctx = canvas.getContext('2d');
    //     let data = ctx.getImageData(0, 0, w, h);
    //     console.log(data)
    //     for (let i = 0; i < h; i++) {
    //         for (let j = 0; j < w; j++) {
    //             let index = ((i * w) + j) * 4;
    //             data.data[index] = 0;
    //             data.data[index + 1] = 0;
    //             data.data[index + 2] = 0;
    //             data.data[index + 3] = Math.round(alpha[i * w + j] * 255);
    //         }
    //     }
    //     ctx.putImageData(data, 0, 0);
    // }
    data2gray = (data, width, height) => {
        let gray = new Array(width * height);
        for (let i = 0; i < height; i++) {
            for (let j = 0; j < width; j++) {
                let index = ((i * width) + j) * 4;
                gray[i * width + j] = 299 / 1000 * data[index] + 587 / 1000 * data[index + 1] + 114 / 1000 * data[index + 2];
            }
        }
        return gray;
    }
    getImgPixel = (data, i, j) => {
        return data[i * w + j]
    }
    foreFlag = (i, j) => {
        return getImgPixel(imgMapData, i, j) == 255;
    }
    backFlag = (i, j) => {
        return getImgPixel(imgMapData, i, j) == 0;
    }
    unknownFlag = (i, j) => {
        if (!backFlag(i, j) && !foreFlag(i, j)) {
            return true;
        }
        return false;
    }
    gradient = (input, gx, gy, w, h) => {
        for (let i = 0; i < h; i++) {
            for (let j = 0; j < w; j++) {
                if (i == 0) gy[i * w + j] = input[(i + 1) * w + j] - input[i * w + j];
                else if (i == h - 1) gy[i * w + j] = input[i * w + j] - input[(i - 1) * w + j];
                else gy[i * w + j] = (input[(i + 1) * w + j] - input[(i - 1) * w + j]) / 2;

                if (i == 0) gx[i * w + j] = input[i * w + j + 1] - input[i * w + j];
                else if (i == h - 1) gx[i * w + j] = input[i * w + j] - input[i * w + j - 1];
                else gx[i * w + j] = (input[i * w + j + 1] - input[i * w + j - 1]) / 2;
            }
        }
    }
    computeAlpha = (alpha, b) => {
        let alphaNew = alpha.slice();
        let alphaOld = new Array(w * h);
        alphaOld.fill(0);
        let threshold = 0.1;
        let n = 1;
        let calc = function () {
            let result = 0;
            for (let i = 0; i < w * h; i++) {
                if (isNaN(alphaNew[i] && alphaOld[i])) {
                    debugger;
                }
                result += Math.abs(alphaNew[i] - alphaOld[i]);
            }
            return result;
        }
        while (n < 50 && calc() > threshold) {
            alphaOld = alphaNew.slice();
            for (let i = 1; i < h - 1; i++) {
                for (let j = 1; j < w - 1; j++) {
                    if (unknownFlag(i, j)) {
                        alphaNew[i * w + j] = 1 / 4 * (alphaNew[(i - 1) * w + j] + alphaNew[i * w + j - 1] + alphaOld[i * w + j + 1] + alphaOld[(i + 1) * w + j] - b[i * w + j])
                        if (isNaN(alphaNew[i * w + j])) {
                            debugger;
                        }
                    }
                }
            }
            n++;
        }
        console.log(n)
        return alphaNew;
    }
    handle = () => {
        // console.log('handle')
        let foreGray = new Uint8Array(w * h);
        let foreMask = new Uint8Array(w * h);
        let backGray = new Uint8Array(w * h);
        let backMask = new Uint8Array(w * h);
        for (let i = 0; i < h; i++) {
            for (let j = 0; j < w; j++) {
                foreGray[i * w + j] = Math.round(imgdata[i * w + j] * foreFlag(i, j));
                backGray[i * w + j] = Math.round(imgdata[i * w + j] * backFlag(i, j));
                foreMask[i * w + j] = Math.round((unknownFlag(i, j) + backFlag(i, j)));
                backMask[i * w + j] = Math.round((unknownFlag(i, j) + foreFlag(i, j)));
            }
        }
        // console.log('gray', sum(imgdata));
        // console.log('tri', sum(imgMapData));
        // console.log('foregray', sum(foreGray));
        // console.log('foreMask', sum(foreMask));
        // console.log('backgray', sum(backGray));
        // console.log('backMask', sum(backMask));
        InpaintTelea(w, h, foreGray, foreMask, 3);
        InpaintTelea(w, h, backGray, backMask, 3);
        // console.log('inpaint_fg', sum(foreGray));
        // console.log('inpaint_bg', sum(backGray));
        let diff = new Array(w * h).fill(0);
        for (let i = 0; i < h; i++) {
            for (let j = 0; j < w; j++) {
                diff[i * w + j] = foreGray[i * w + j] * !backFlag(i, j) - backGray[i * w + j] * !foreFlag(i, j);
            }
        }
        // console.log('diff', sum(diff))
        blur(diff, w, h, 0.9);
        // console.log('diff2', sum(diff))
        let dx = new Array(w * h).fill(0);
        let dy = new Array(w * h).fill(0);
        gradient(imgdata, dx, dy, w, h);
        let tmp = new Array(w * h).fill(0);
        let d2y = new Array(w * h).fill(0);
        let d2x = new Array(w * h).fill(0);
        for (let i = 0; i < w * h; i++) {
            dx[i] = dx[i] / diff[i];
            dy[i] = dy[i] / diff[i];
        }
        gradient(dy, tmp, d2y, w, h);
        gradient(dx, d2x, tmp, w, h);
        let b = new Array(w * h).fill(0);
        let originA = new Array(w * h).fill(0);
        for (let i = 0; i < w * h; i++) {
            b[i] = d2x[i] + d2y[i];
        }
        // console.log('b', sum(b))
        for (let i = 0; i < h; i++) {
            for (let j = 0; j < w; j++) {
                originA[i * w + j] = foreFlag(i, j) + 0.5 * unknownFlag(i, j);
            }
        }
        // console.log('oria', sum(originA))
        let alpha = computeAlpha(originA, b);
        // drawAlphaOnCanvas(alpha);
        return alpha;

    }
}