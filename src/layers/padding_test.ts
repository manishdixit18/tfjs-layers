/**
 * @license
 * Copyright 2018 Google LLC
 *
 * Use of this source code is governed by an MIT-style
 * license that can be found in the LICENSE file or at
 * https://opensource.org/licenses/MIT.
 * =============================================================================
 */

/**
 * Unit Tests for Padding Layers.
 */

// tslint:disable:max-line-length
import {ones, slice, Tensor, zeros} from '@tensorflow/tfjs-core';

import {DataFormat} from '../common';
import * as tfl from '../index';
import {SymbolicTensor} from '../types';
import {convertPythonicToTs, convertTsToPythonic} from '../utils/serialization_utils';
import {describeMathCPU, describeMathCPUAndGPU, expectTensorsClose} from '../utils/test_utils';

import {ZeroPadding2D, ZeroPadding2DLayerConfig} from './padding';

// tslint:enable:max-line-length

describeMathCPU('ZeroPadding2D: Symbolic', () => {
  const dataFormats: DataFormat[] =
      [undefined, 'channelsFirst', 'channelsLast'];

  for (const dataFormat in dataFormats) {
    it('Default padding 1-1-1-1, dataFormat=' + dataFormat, () => {
      const x = new SymbolicTensor('float32', [1, 2, 3, 4], null, [], null);
      const layer = tfl.layers.zeroPadding2d();
      const y = layer.apply(x) as SymbolicTensor;
      expect(y.dtype).toEqual('float32');
      if (dataFormat === 'channelsFirst') {
        expect(y.shape).toEqual([1, 2, 5, 6]);
      } else {
        expect(y.shape).toEqual([1, 4, 5, 4]);
      }
    });

    it('All symmetric padding 2, dataFormat=' + dataFormat, () => {
      const x = new SymbolicTensor('float32', [1, 2, 3, 4], null, [], null);
      const layer = tfl.layers.zeroPadding2d({padding: 2});
      const y = layer.apply(x) as SymbolicTensor;
      expect(y.dtype).toEqual('float32');
      if (dataFormat === 'channelsFirst') {
        expect(y.shape).toEqual([1, 6, 7, 8]);
      } else {
        expect(y.shape).toEqual([1, 6, 7, 4]);
      }
    });

    it('Symmetric padding 2-3, dataFormat=' + dataFormat, () => {
      const x = new SymbolicTensor('float32', [1, 2, 3, 4], null, [], null);
      const layer = tfl.layers.zeroPadding2d({padding: [2, 3]});
      const y = layer.apply(x) as SymbolicTensor;
      expect(y.dtype).toEqual('float32');
      if (dataFormat === 'channelsFirst') {
        expect(y.shape).toEqual([1, 2, 7, 10]);
      } else {
        expect(y.shape).toEqual([1, 6, 9, 4]);
      }
    });

    it('Asymmetric padding 2-3-4-5, dataFormat=' + dataFormat, () => {
      const x = new SymbolicTensor('float32', [1, 2, 3, 4], null, [], null);
      const layer = tfl.layers.zeroPadding2d({padding: [[2, 3], [4, 5]]});
      const y = layer.apply(x) as SymbolicTensor;
      expect(y.dtype).toEqual('float32');
      if (dataFormat === 'channelsFirst') {
        expect(y.shape).toEqual([1, 2, 7, 13]);
      } else {
        expect(y.shape).toEqual([1, 7, 12, 4]);
      }
    });
  }

  it('Incorrect array length leads to error', () => {
    // tslint:disable-next-line:no-any
    expect(() => tfl.layers.zeroPadding2d({padding: [2, 3, 4]} as any))
        .toThrowError(/length-2 array/);
  });

  it('Incorrect height array length leads to error', () => {
    // tslint:disable:no-any
    expect(
        () => tfl.layers.zeroPadding2d({padding: [[2, 3, 4], [5, 6]]} as any))
        .toThrowError(/height.*length-2 array/);
    // tslint:enable:no-any
  });

  it('Incorrect height array length leads to error', () => {
    // tslint:disable:no-any
    expect(
        () => tfl.layers.zeroPadding2d({padding: [[1, 1], [2, 3, 4]]} as any))
        .toThrowError(/width.*length-2 array/);
    // tslint:enable:no-any
  });

  it('Serialization round trip', () => {
    const layer = tfl.layers.zeroPadding2d({padding: [2, 4]}) as ZeroPadding2D;
    const pythonicConfig = convertTsToPythonic(layer.getConfig());
    const tsConfig = convertPythonicToTs(pythonicConfig);
    const layerPrime =
        tfl.layers.zeroPadding2d(tsConfig as ZeroPadding2DLayerConfig) as
        ZeroPadding2D;
    expect(layerPrime.padding).toEqual(layer.padding);
    expect(layerPrime.dataFormat).toEqual(layer.dataFormat);
  });
});

describeMathCPUAndGPU('ZeroPadding2D: Tensor', () => {
  it('Default padding 1-1-1-1, channelsLast', () => {
    const x = ones([2, 2, 2, 3]);
    const layer = tfl.layers.zeroPadding2d();
    const y = layer.apply(x) as Tensor;
    expect(y.shape).toEqual([2, 4, 4, 3]);

    expectTensorsClose(slice(y, [0, 1, 1, 0], [2, 2, 2, 3]), x);
    expectTensorsClose(
        slice(y, [0, 0, 0, 0], [2, 1, 4, 3]), zeros([2, 1, 4, 3]));
    expectTensorsClose(
        slice(y, [0, 3, 0, 0], [2, 1, 4, 3]), zeros([2, 1, 4, 3]));
    expectTensorsClose(
        slice(y, [0, 0, 0, 0], [2, 4, 1, 3]), zeros([2, 4, 1, 3]));
    expectTensorsClose(
        slice(y, [0, 0, 3, 0], [2, 4, 1, 3]), zeros([2, 4, 1, 3]));
  });

  it('Default padding 1-1-1-1, channelFirst', () => {
    const x = ones([2, 3, 2, 2]);
    const layer = tfl.layers.zeroPadding2d({dataFormat: 'channelsFirst'});
    const y = layer.apply(x) as Tensor;
    expect(y.shape).toEqual([2, 3, 4, 4]);

    expectTensorsClose(slice(y, [0, 0, 1, 1], [2, 3, 2, 2]), x);
    expectTensorsClose(
        slice(y, [0, 0, 0, 0], [2, 3, 1, 4]), zeros([2, 3, 1, 4]));
    expectTensorsClose(
        slice(y, [0, 0, 3, 0], [2, 3, 1, 4]), zeros([2, 3, 1, 4]));
    expectTensorsClose(
        slice(y, [0, 0, 0, 0], [2, 3, 4, 1]), zeros([2, 3, 4, 1]));
    expectTensorsClose(
        slice(y, [0, 0, 0, 3], [2, 3, 4, 1]), zeros([2, 3, 4, 1]));
  });

  it('Symmetric padding 2-2, channelsLast', () => {
    const x = ones([2, 2, 2, 3]);
    const layer = tfl.layers.zeroPadding2d({padding: [2, 2]});
    const y = layer.apply(x) as Tensor;
    expect(y.shape).toEqual([2, 6, 6, 3]);

    expectTensorsClose(slice(y, [0, 2, 2, 0], [2, 2, 2, 3]), x);
    expectTensorsClose(
        slice(y, [0, 0, 0, 0], [2, 2, 6, 3]), zeros([2, 2, 6, 3]));
    expectTensorsClose(
        slice(y, [0, 4, 0, 0], [2, 2, 6, 3]), zeros([2, 2, 6, 3]));
    expectTensorsClose(
        slice(y, [0, 0, 0, 0], [2, 6, 2, 3]), zeros([2, 6, 2, 3]));
    expectTensorsClose(
        slice(y, [0, 0, 4, 0], [2, 6, 2, 3]), zeros([2, 6, 2, 3]));
  });

  it('Asymmetric padding 2-1-2-1, channelsLast', () => {
    const x = ones([2, 2, 2, 3]);
    const layer = tfl.layers.zeroPadding2d({padding: [[2, 1], [2, 1]]});
    const y = layer.apply(x) as Tensor;
    expect(y.shape).toEqual([2, 5, 5, 3]);

    expectTensorsClose(slice(y, [0, 2, 2, 0], [2, 2, 2, 3]), x);
    expectTensorsClose(
        slice(y, [0, 0, 0, 0], [2, 2, 5, 3]), zeros([2, 2, 5, 3]));
    expectTensorsClose(
        slice(y, [0, 4, 0, 0], [2, 1, 5, 3]), zeros([2, 1, 5, 3]));
    expectTensorsClose(
        slice(y, [0, 0, 0, 0], [2, 5, 2, 3]), zeros([2, 5, 2, 3]));
    expectTensorsClose(
        slice(y, [0, 0, 4, 0], [2, 5, 1, 3]), zeros([2, 5, 1, 3]));
  });
});
