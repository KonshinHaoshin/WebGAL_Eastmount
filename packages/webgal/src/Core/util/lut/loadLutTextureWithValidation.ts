import * as PIXI from 'pixi.js';
import { create2DLutTextureFromCube } from '@/Core/util/lut/cubeToLut2D';

/**
 * 加载 LUT 纹理并做有效性校验。
 * - 支持 .cube 与图片格式
 * - 成功时在控制台输出尺寸信息，失败时抛出详细错误
 */
export async function loadLutTextureWithValidation(app: PIXI.Application, url: string): Promise<PIXI.Texture> {
  if (url.toLowerCase().endsWith('.cube')) {
    const tex = await create2DLutTextureFromCube(app, url);
    if (!tex.baseTexture.valid || tex.width === 0 || tex.height === 0) {
      throw new Error(`[LUT] .cube 转 2D 纹理无效: ${url}`);
    }
    // 记录尺寸
    // eslint-disable-next-line no-console
    console.debug(`[LUT] cube->2D 纹理尺寸: ${tex.width}x${tex.height} from ${url}`);
    return tex;
  }

  // 图片 LUT：需要等待 BaseTexture 完成加载
  return await new Promise<PIXI.Texture>((resolve, reject) => {
    try {
      const texture = PIXI.Texture.from(url);
      const base = texture.baseTexture;

      const onLoaded = () => {
        // 记录尺寸
        // eslint-disable-next-line no-console
        console.debug(`[LUT] 图片纹理尺寸: ${texture.width}x${texture.height} from ${url}`);
        if (!base.valid || texture.width === 0 || texture.height === 0) {
          reject(new Error(`[LUT] 图片纹理无效: ${url}`));
        } else {
          resolve(texture);
        }
      };

      const onError = (err?: unknown) => {
        reject(new Error(`[LUT] 图片纹理加载失败: ${url} ${(err as Error)?.message ?? ''}`));
      };

      if (base.valid) {
        onLoaded();
      } else {
        base.once('loaded', onLoaded);
        // @ts-ignore PIXI BaseTexture 可能不会显式抛 error 事件，但保留以便兼容
        base.once('error', onError);
      }
    } catch (e) {
      reject(new Error(`[LUT] 创建图片纹理失败: ${url} ${(e as Error).message}`));
    }
  });
}

