import {
  CLEAR_MODES,
  Filter,
  FilterSystem,
  MIPMAP_MODES,
  RenderTexture,
  SCALE_MODES,
  Texture,
  type TextureSource,
} from 'pixi.js';

// 根据 WebGAL 别的地方的实现，这里暂时不用 raw 模式
// import fragment from './color-map.frag?raw';
// import vertex from './default.vert?raw';

type ColorMapSource = TextureSource | Texture | null;

/**
 * The ColorMapFilter applies a color-map effect to an object.<br>
 * ![original](../tools/screenshots/dist/original.png)![filter](../tools/screenshots/dist/color-map.png)
 *
 * @class
 * @extends PIXI.Filter
 * @see {@link https://www.npmjs.com/package/@pixi/filter-color-map|@pixi/filter-color-map}
 * @see {@link https://www.npmjs.com/package/pixi-filters|pixi-filters}
 */
export class CustomColorMapFilter extends Filter {
  /** The mix from 0 to 1, where 0 is the original image and 1 is the color mapped image. */
  public mix = 1;

  private _size = 0;
  private _sliceSize = 0;
  private _slicePixelSize = 0;
  private _sliceInnerSize = 0;
  private _nearest = false;
  private _scaleMode: SCALE_MODES | null = null;
  private _colorMap: Texture | null = null;

  /**
   * @param {HTMLImageElement|HTMLCanvasElement|PIXI.BaseTexture|PIXI.Texture} [colorMap] - The
   *        colorMap texture of the filter.
   * @param {boolean} [nearest=false] - Whether use NEAREST for colorMap texture.
   * @param {number} [mix=1] - The mix from 0 to 1, where 0 is the original image and 1 is the color mapped image.
   */
  constructor(colorMap: ColorMapSource, nearest = false, mix = 1) {
    const vertex = `attribute vec2 aVertexPosition;
attribute vec2 aTextureCoord;

uniform mat3 projectionMatrix;

varying vec2 vTextureCoord;

void main(void)
{
    gl_Position = vec4((projectionMatrix * vec3(aVertexPosition, 1.0)).xy, 0.0, 1.0);
    vTextureCoord = aTextureCoord;
}`;
    const fragment = `varying vec2 vTextureCoord;
uniform sampler2D uSampler;
uniform sampler2D colorMap;
uniform float _mix;
uniform float _size;
uniform float _sliceSize;
uniform float _slicePixelSize;
uniform float _sliceInnerSize;

void main() {
    vec4 color = texture2D(uSampler, vTextureCoord.xy);
    vec4 finalColor = color; // 先假设最终颜色就是原始颜色

    // 只有当像素足够不透明时才进行处理，避免处理边缘的半透明像素
    // 这是修复伪影的关键！
    if (color.a > 0.1) { // 使用一个阈值，而不是 > 0.0
        vec4 adjusted;

        // 1. Un-premultiply alpha
        vec3 unmultiplied_rgb = color.rgb / color.a;

        // 2. 使用原始RGB值在3D LUT中查找颜色
        float innerWidth = _size - 1.0;
        float zSlice0 = min(floor(unmultiplied_rgb.b * innerWidth), innerWidth);
        float zSlice1 = min(zSlice0 + 1.0, innerWidth);
        float xOffset = _slicePixelSize * 0.5 + unmultiplied_rgb.r * _sliceInnerSize;
        float s0 = xOffset + (zSlice0 * _sliceSize);
        float s1 = xOffset + (zSlice1 * _sliceSize);
        float yOffset = _sliceSize * 0.5 + unmultiplied_rgb.g * (1.0 - _sliceSize);
        vec4 slice0Color = texture2D(colorMap, vec2(s0,yOffset));
        vec4 slice1Color = texture2D(colorMap, vec2(s1,yOffset));
        float zOffset = fract(unmultiplied_rgb.b * innerWidth);
        adjusted = mix(slice0Color, slice1Color, zOffset);

        // 3. 将原始颜色与LUT颜色混合
        // 注意：这里的 'color' 还是预乘过的，而 'adjusted' 是非预乘的
        // 为了正确混合，最好都在非预乘空间进行
        vec3 mixed_rgb = mix(unmultiplied_rgb, adjusted.rgb, _mix);

        // 4. Re-premultiply alpha
        finalColor = vec4(mixed_rgb * color.a, color.a);

    }

    // 如果不满足 if 条件，finalColor 将保持为原始的 'color'

    gl_FragColor = finalColor;
}`;
    super(vertex, fragment);
    this._scaleMode = null;
    this.nearest = nearest;
    this.mix = mix;
    this.colorMap = colorMap;
  }

  /**
   * Override existing apply method in PIXI.Filter
   * @private
   */
  apply(filterManager: FilterSystem, input: RenderTexture, output: RenderTexture, clear: CLEAR_MODES): void {
    console.log('🎨 CustomColorMapFilter.apply() 被调用');
    console.log('  - mix 值:', this.mix);
    console.log('  - colorMap 存在:', !!this.colorMap);
    console.log('  - colorMap 尺寸:', this.colorMap ? `${this.colorMap.width}x${this.colorMap.height}` : 'N/A');
    console.log('  - uniforms 状态:', {
      _size: this.uniforms._size,
      _sliceSize: this.uniforms._sliceSize,
      _slicePixelSize: this.uniforms._slicePixelSize,
      _sliceInnerSize: this.uniforms._sliceInnerSize
    });

    this.uniforms._mix = this.mix;

    // 确保 uniforms 正确设置
    if (this.colorMap) {
      this.uniforms.colorMap = this.colorMap;
      console.log('✅ uniforms 设置完成');
    }

    filterManager.applyFilter(this, input, output, clear);
  }

  /**
   * The size of one color slice
   * @readonly
   */
  get colorSize(): number {
    return this._size;
  }

  /**
   * the colorMap texture
   * @member {PIXI.Texture}
   */
  get colorMap(): ColorMapSource {
    return this._colorMap;
  }
  set colorMap(colorMap: ColorMapSource) {
    if (!colorMap) {
      return;
    }
    if (!(colorMap instanceof Texture)) {
      colorMap = Texture.from(colorMap);
    }
    if ((colorMap as Texture)?.baseTexture) {
      colorMap.baseTexture.scaleMode = this._scaleMode as SCALE_MODES;
      colorMap.baseTexture.mipmap = MIPMAP_MODES.OFF;

      this._size = colorMap.height;
      this._sliceSize = 1 / this._size;
      this._slicePixelSize = this._sliceSize / this._size;
      this._sliceInnerSize = this._slicePixelSize * (this._size - 1);

      this.uniforms._size = this._size;
      this.uniforms._sliceSize = this._sliceSize;
      this.uniforms._slicePixelSize = this._slicePixelSize;
      this.uniforms._sliceInnerSize = this._sliceInnerSize;

      this.uniforms.colorMap = colorMap;
    }

    this._colorMap = colorMap;
  }

  /**
   * Whether use NEAREST for colorMap texture.
   */
  get nearest(): boolean {
    return this._nearest;
  }
  set nearest(nearest: boolean) {
    this._nearest = nearest;
    this._scaleMode = nearest ? SCALE_MODES.NEAREST : SCALE_MODES.LINEAR;

    const texture = this._colorMap;

    if (texture && texture.baseTexture) {
      texture.baseTexture._glTextures = {};

      texture.baseTexture.scaleMode = this._scaleMode;
      texture.baseTexture.mipmap = MIPMAP_MODES.OFF;

      texture._updateID++;
      texture.baseTexture.emit('update', texture.baseTexture);
    }
  }

  /**
   * If the colorMap is based on canvas , and the content of canvas has changed,
   *   then call `updateColorMap` for update texture.
   */
  updateColorMap(): void {
    const texture = this._colorMap;

    if (texture && texture.baseTexture) {
      texture._updateID++;
      texture.baseTexture.emit('update', texture.baseTexture);

      this.colorMap = texture;
    }
  }

  /**
   * 新增：智能加载 LUT 文件（支持图片和 .cube 文件）
   */
  public async loadLutFile(lutUrl: string): Promise<void> {
    try {
      console.log(' 开始加载 LUT 文件:', lutUrl);

      // 检查文件扩展名
      if (lutUrl.toLowerCase().endsWith('.cube')) {
        console.log('📁 检测到 .cube 文件，使用 cube 解析器');
        // 加载 .cube 文件
        await this.loadCubeFile(lutUrl);
      } else {
        console.log('️ 检测到图片文件，使用标准纹理加载器');
        // 加载图片文件
        const texture = Texture.from(lutUrl);
        this.colorMap = texture;
        console.log('✅ 图片 LUT 加载成功:', texture.width, 'x', texture.height);
      }

      console.log('🎯 LUT 文件加载完成，当前 colorMap:', this.colorMap);
    } catch (error) {
      console.error('❌ LUT 文件加载失败:', error);
      throw error;
    }
  }

  /**
   * 从 .cube 文件创建 LUT 纹理
   */
  private async loadCubeFile(cubeUrl: string): Promise<void> {
    try {
      console.log('📖 开始读取 .cube 文件:', cubeUrl);
      const response = await fetch(cubeUrl);

      if (!response.ok) {
        throw new Error(`HTTP 错误! 状态码: ${response.status}`);
      }

      const cubeText = await response.text();
      console.log('📄 .cube 文件内容长度:', cubeText.length, '字符');
      console.log(' .cube 文件前100个字符:', cubeText.substring(0, 100));

      // 解析 .cube 文件内容
      const lutTexture = this.parseCubeFile(cubeText);

      // 设置 LUT 纹理
      this.colorMap = lutTexture;
      console.log('✅ .cube 文件解析成功，纹理尺寸:', lutTexture.width, 'x', lutTexture.height);
    } catch (error) {
      console.error('❌ .cube 文件加载失败:', error);
      throw error;
    }
  }

  /**
   * 解析 .cube 文件内容
   */
  private parseCubeFile(cubeText: string): PIXI.Texture {
    console.log(' 开始解析 .cube 文件内容...');
    const lines = cubeText.split('\n');
    console.log('📊 总行数:', lines.length);

    let size = 0;
    const data: number[] = [];

    // 解析 .cube 文件头
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('LUT_3D_SIZE')) {
        size = parseInt(trimmed.split(' ')[1]);
        console.log('📏 找到 LUT_3D_SIZE:', size);
        break;
      }
    }

    if (size === 0) {
      // 如果没有找到 LUT_3D_SIZE，尝试从数据行推断
      const dataLines = lines.filter(line =>
        line.trim() && !line.startsWith('#') && !line.startsWith('LUT_3D_SIZE')
      );
      size = Math.cbrt(dataLines.length);
      console.log('🔍 从数据行推断 LUT 尺寸:', size);
    }

    // 验证尺寸
    if (size <= 0 || size > 256) {
      throw new Error(`无效的 LUT 尺寸: ${size}`);
    }

    console.log('✅ 最终使用的 LUT 尺寸:', size);

    // 解析 RGB 数据
    let validDataCount = 0;
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#') && !trimmed.startsWith('LUT_3D_SIZE')) {
        const rgb = trimmed.split(' ').map(Number);
        if (rgb.length >= 3) {
          data.push(...rgb);
          validDataCount++;
        }
      }
    }

    console.log('🎨 有效 RGB 数据点数量:', validDataCount);
    console.log('📊 总数据数组长度:', data.length);

    // 验证数据完整性
    const expectedDataPoints = size * size * size;
    if (validDataCount !== expectedDataPoints) {
      console.warn(`⚠️ 数据点数量不匹配: 期望 ${expectedDataPoints}, 实际 ${validDataCount}`);
    }

    // 创建 LUT 纹理 - 使用正确的尺寸
    const canvas = document.createElement('canvas');
    canvas.width = size * size;  // 宽度 = size²
    canvas.height = size;        // 高度 = size

    console.log('🎨 创建 Canvas:', canvas.width, 'x', canvas.height);

    const ctx = canvas.getContext('2d')!;
    const imageData = ctx.createImageData(canvas.width, canvas.height);

    // 将数据填充到图像中
    for (let i = 0; i < data.length && i < expectedDataPoints * 3; i += 3) {
      const pixelIndex = (i / 3) * 4;
      if (pixelIndex + 3 < imageData.data.length) {
        imageData.data[pixelIndex] = Math.round(data[i] * 255);     // R
        imageData.data[pixelIndex + 1] = Math.round(data[i + 1] * 255); // G
        imageData.data[pixelIndex + 2] = Math.round(data[i + 2] * 255); // B
        imageData.data[pixelIndex + 3] = 255; // A
      }
    }

    ctx.putImageData(imageData, 0, 0);

    // 从 canvas 创建 PIXI 纹理
    const texture = Texture.from(canvas);
    console.log('✅ Canvas 纹理创建成功:', texture.width, 'x', texture.height);

    return texture;
  }

  /**
   * Destroys this filter
   *
   * @param {boolean} [destroyBase=false] - Whether to destroy the base texture of colorMap as well
   */
  destroy(destroyBase = false): void {
    if (this._colorMap) {
      this._colorMap.destroy(destroyBase);
    }
    super.destroy();
  }
}
