import Upscaler from '../../../packages/upscalerjs/src/index';
import model from '../../../models/esrgan-legacy/src/gans';
import flower from '../../../models/esrgan-legacy/test/__fixtures__/fixture.png';
import * as tf from '@tensorflow/tfjs';
import { makeImg } from './image';
const MODEL = '/node_modules/@upscalerjs/esrgan-legacy/models/gans/model.json';

const status = document.getElementById('status')!;

const getModel = (path: string) => {
  const { packageInformation, ...rest } = model(tf);
  return {
    ...rest,
    path: path,
  };
}

(async () => {
  makeImg(flower, 'Original');
  const model = getModel(MODEL);
  status.innerHTML = 'Starting';
  const upscaler = new Upscaler({
    model,
  });
  status.innerHTML = 'Upscaling...';
  const upscaledImg = await upscaler.upscale(flower, {
    patchSize: 8,
    padding: 1,
    progressOutput: 'tensor',
    progress: (rate, slice, row, col) => {
      console.log(rate, slice.shape.slice(0, 2), row, col);
    },
  });
  status.innerHTML = 'Image upscaled';
  makeImg(upscaledImg, 'Upscaled');
  status.innerHTML = 'Image printed';
})();
