# WebGAL LUT 功能修复文档

## 问题描述

在使用 `changeFigure` 命令的 `-lut` 参数时，应用 .cube LUT 文件会导致立绘直接黑屏。

**问题命令示例：**
```
changeFigure:该溜子祥子/该溜子祥子.jsonl -right -id=2 -motion=idle01 -expression=idle01 -ease=circOut -lut=LD-DarkMonochrome3.cube;
```

## 根本原因

WebGAL 项目中存在两个不同的 ColorMapFilter 实现：

1. **官方的 `@pixi/filter-color-map`** - 在 `WebGALPixiContainer.ts` 中使用
2. **自定义的 `CustomColorMapFilter`** - 专门设计用于处理 .cube 文件，但未被实际使用

问题在于：
- 官方滤镜使用 `mapTexture` 属性，与自定义滤镜的 `colorMap` 属性不兼容
- 官方滤镜不支持从 .cube 文件生成的纹理格式
- 代码中错误地使用了官方滤镜来处理 .cube 文件

## 修复方案

### 主要文件改动

#### 1. `packages/webgal/src/Core/controller/stage/pixi/WebGALPixiContainer.ts`

**改动内容：**
- 将 ColorMapFilter 导入从官方版本替换为自定义版本
- 更新滤镜配置以使用正确的构造函数和属性
- 修复 `setColorMapTexture` 方法使用正确的属性名
- 将 `ensureFilterByName` 方法从私有改为公有

**具体修改：**

```typescript
// 修改前
import { ColorMapFilter } from '@pixi/filter-color-map';

// 修改后
import { CustomColorMapFilter as ColorMapFilter } from '@/Core/controller/stage/pixi/shaders/CustomColorMapFilter';
```

```typescript
// 修改前
colorMap: {
    priority: FilterPriority.ColorMap,
    create: () => new ColorMapFilter(undefined as any, { nearest: false }),
    isDefault: (f) => !(f as ColorMapFilter).mapTexture,
},

// 修改后
colorMap: {
    priority: FilterPriority.ColorMap,
    create: () => new ColorMapFilter(null, false),
    isDefault: (f) => !(f as ColorMapFilter).colorMap,
},
```

```typescript
// 修改前
filter.mapTexture = texture;

// 修改后
filter.colorMap = texture;
```

#### 2. `packages/webgal/src/Stage/MainStage/useSetFigure.ts`

**改动内容：**
- 更新 LUT 应用逻辑，优先使用自定义滤镜的 `loadLutFile` 方法
- 保留降级方案以确保兼容性

**具体修改：**

```typescript
// 修改前
try {
    const texture = await create2DLutTextureFromCube(WebGAL.gameplay.pixiStage!.currentApp!, lut);
    figureObject.pixiContainer.setColorMapTexture(texture);
    figureObject.pixiContainer.colorMapIntensity = 1;
} catch (e) {
    console.error('Failed to apply figure LUT', key, e);
}

// 修改后
try {
    // 直接使用自定义 ColorMapFilter 的 loadLutFile 方法
    const colorMapFilter = figureObject.pixiContainer.containerFilters.get('colorMap') as any;
    if (colorMapFilter && colorMapFilter.loadLutFile) {
        await colorMapFilter.loadLutFile(lut);
        figureObject.pixiContainer.colorMapIntensity = 1;
    } else {
        // 确保滤镜存在，然后使用 loadLutFile 方法
        const filter = figureObject.pixiContainer.ensureFilterByName('colorMap') as any;
        if (filter.loadLutFile) {
            await filter.loadLutFile(lut);
            figureObject.pixiContainer.colorMapIntensity = 1;
        } else {
            // 降级方案：使用原有的转换方法
            const texture = await create2DLutTextureFromCube(WebGAL.gameplay.pixiStage!.currentApp!, lut);
            figureObject.pixiContainer.setColorMapTexture(texture);
            figureObject.pixiContainer.colorMapIntensity = 1;
        }
    }
} catch (e) {
    console.error('Failed to apply figure LUT', key, e);
}
```

#### 3. `packages/webgal/src/Core/controller/stage/pixi/shaders/CustomColorMapFilter.ts`

**改动内容：**
- 修复 PIXI 纹理创建时的导入引用
- 确保正确使用 `Texture.from()` 而不是 `PIXI.Texture.from()`

**具体修改：**

```typescript
// 修改前
const texture = PIXI.Texture.from(lutUrl);
const texture = PIXI.Texture.from(canvas);

// 修改后
const texture = Texture.from(lutUrl);
const texture = Texture.from(canvas);
```

## 技术细节

### CustomColorMapFilter 的优势

1. **专门的 .cube 文件支持**：
   - 内置 .cube 文件解析器
   - 正确的 3D LUT 纹理生成
   - 支持标准 LUT_3D_SIZE 格式

2. **智能文件检测**：
   - 自动检测文件扩展名(.cube vs 图片)
   - 使用相应的加载策略

3. **改进的着色器**：
   - 处理预乘 alpha 值
   - 边缘像素处理以避免伪影
   - 正确的 3D LUT 插值

### LUT 工作原理

1. **文件加载**：`loadLutFile()` 方法检测文件类型
2. **.cube 解析**：解析 LUT_3D_SIZE 和 RGB 数据点
3. **纹理生成**：将 3D LUT 数据排列为 2D 纹理
4. **着色器应用**：在 GPU 上执行颜色查找和插值

## 测试验证

修复后，以下命令应该能正常工作而不会黑屏：

```
changeFigure:该溜子祥子/该溜子祥子.jsonl -right -id=2 -motion=idle01 -expression=idle01 -ease=circOut -lut=LD-DarkMonochrome3.cube;
```

## 兼容性说明

- 保持与现有 API 的完全兼容性
- 支持旧的图片格式 LUT 文件
- 降级方案确保在极端情况下的稳定性
- 不影响其他滤镜功能

## 调试信息

修复版本包含详细的控制台日志：
- LUT 文件加载状态
- 纹理创建信息
- 滤镜应用过程
- 错误处理详情

可以通过浏览器开发者工具查看这些日志来诊断问题。

## 相关文件结构

```
packages/webgal/src/
├── Core/controller/stage/pixi/
│   ├── WebGALPixiContainer.ts          # 主要修改：滤镜管理
│   └── shaders/
│       └── CustomColorMapFilter.ts     # 次要修改：纹理引用
├── Stage/MainStage/
│   └── useSetFigure.ts                 # 主要修改：LUT 应用逻辑
└── Core/util/lut/
    └── cubeToLut2D.ts                  # 保持不变：降级方案
```

## 总结

这次修复解决了 WebGAL 中 LUT 功能的核心问题，通过使用正确的自定义 ColorMapFilter 实现，确保 .cube 文件能够正确加载和应用，而不会导致黑屏问题。修复保持了向后兼容性，并提供了更好的错误处理和调试支持。
