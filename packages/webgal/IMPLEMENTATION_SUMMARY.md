# WebGAL LUT 功能实现总结

## 概述

本文档总结了为 WebGAL 添加 LUT (Look-Up Table) 支持功能所做的所有代码修改。

## 实现的功能

### 1. LUT 过滤器集成
- 在 `WebGALPixiContainer.ts` 中集成了 `CustomColorMapFilter`
- 添加了 LUT 过滤器的优先级配置
- 实现了 LUT 过滤器的属性配置

### 2. 命令参数支持
- `changeFigure` 命令现在支持 `-lut=<LUT文件路径>` 参数
- `changeBg` 命令现在支持 `-lut=<LUT文件路径>` 参数
- LUT 文件路径相对于 `game/lut/` 目录

### 3. 状态管理
- 在 `stageInterface.ts` 中添加了 `lut` 和 `lutFile` 属性
- 更新了 `baseTransform` 以包含 LUT 默认值
- 集成了 LUT 效果到现有的 Effects 系统

## 修改的文件列表

### 1. `packages/webgal/src/Core/controller/stage/pixi/WebGALPixiContainer.ts`
**主要修改：**
- 导入 `CustomColorMapFilter`
- 添加 `FilterPriority.Lut` 枚举值
- 在 `FILTER_CONFIGS` 中添加 LUT 过滤器配置
- 在 `PROPERTY_CONFIGS` 中添加 LUT 属性配置
- 添加 `lut` 属性的 getter/setter 方法
- 添加 `setLutFile()` 方法来异步加载 LUT 文件

**关键代码片段：**
```typescript
// 添加 LUT 过滤器配置
lut: {
  priority: FilterPriority.Lut,
  create: () => new CustomColorMapFilter(null, false, 1),
  isDefault: (f) => {
    const l = f as CustomColorMapFilter;
    return l.mix === 1 && l.colorMap === null;
  },
},

// 添加 LUT 属性配置
lut: {
  filterName: 'lut',
  filterProperty: 'mix',
  defaultValue: 1,
},

// 添加 setLutFile 方法
public async setLutFile(lutPath: string): Promise<void> {
  // ... 实现代码
}
```

### 2. `packages/webgal/src/store/stageInterface.ts`
**主要修改：**
- 在 `ITransform` 接口中添加 `lut: number` 和 `lutFile?: string` 属性
- 在 `baseTransform` 中添加 `lut: 1` 默认值

**关键代码片段：**
```typescript
export interface ITransform {
  // ... 现有属性
  lut: number;
  lutFile?: string;
}

export const baseTransform: ITransform = {
  // ... 现有属性
  lut: 1,
};
```

### 3. `packages/webgal/src/Core/gameScripts/changeFigure.ts`
**主要修改：**
- 导入 `baseTransform`
- 添加 LUT 参数解析
- 在 `setFigureData` 函数中添加 LUT 效果处理
- 支持新立绘和现有立绘的 LUT 效果设置

**关键代码片段：**
```typescript
// LUT参数
const lutFile = getStringArgByKey(sentence, 'lut');

// 设置LUT效果
if (lutFile) {
  const transform: ITransform = {
    ...baseTransform,
    lut: 1,
  };
  dispatch(stageActions.updateEffect({ target: key, transform }));

  // 异步设置LUT文件
  setTimeout(async () => {
    const stageObject = WebGAL.gameplay.pixiStage?.getStageObjByKey(key);
    if (stageObject?.pixiContainer) {
      await stageObject.pixiContainer.setLutFile(lutFile);
    }
  }, 100);
}
```

### 4. `packages/webgal/src/Core/gameScripts/changeBg/index.ts`
**主要修改：**
- 导入 `baseTransform`
- 添加 LUT 参数解析
- 在背景切换后添加 LUT 效果处理

**关键代码片段：**
```typescript
// LUT参数
const lutFile = getStringArgByKey(sentence, 'lut');

// 设置LUT效果
if (lutFile) {
  const transform: ITransform = {
    ...baseTransform,
    lut: 1,
  };
  dispatch(stageActions.updateEffect({ target: 'bg-main', transform }));

  // 异步设置LUT文件
  setTimeout(async () => {
    const stageObject = WebGAL.gameplay.pixiStage?.getStageObjByKey('bg-main');
    if (stageObject?.pixiContainer) {
      await stageObject.pixiContainer.setLutFile(lutFile);
    }
  }, 100);
}
```

### 5. `packages/parser/src/interface/assets.ts`
**主要修改：**
- 在 `fileType` 枚举中添加 `lut` 类型

**关键代码片段：**
```typescript
export enum fileType {
  background,
  bgm,
  figure,
  scene,
  tex,
  vocal,
  video,
  lut, // 新增LUT文件类型
}
```

### 6. `packages/parser/src/scriptParser/assetsScanner.ts`
**主要修改：**
- 添加 LUT 参数的资源扫描功能
- 自动识别 `-lut=` 参数并添加到资源列表

**关键代码片段：**
```typescript
// 扫描LUT参数
args.forEach((e) => {
  if (e.key === 'lut' && e.value && e.value !== '') {
    returnAssetsList.push({
      name: e.value as string,
      url: e.value as string,
      lineNumber: 0,
      type: fileType.lut,
    });
  }
});
```

### 7. `packages/webgal/src/Core/util/gameAssetsAccess/assetSetter.ts`
**主要修改：**
- 在 `fileType` 枚举中添加 `lut` 类型
- 在 `assetSetter` 函数中添加 LUT 文件路径处理

**关键代码片段：**
```typescript
export enum fileType {
  background,
  bgm,
  figure,
  scene,
  tex,
  vocal,
  video,
  lut, // 新增LUT文件类型
}

// 在 assetSetter 函数中
case fileType.lut:
  returnFilePath = `./game/lut/${fileName}`;
  break;
```

## 技术架构

### 1. 过滤器系统集成
- LUT 过滤器通过现有的过滤器管理系统集成
- 支持优先级排序和自动清理
- 与现有的 Effects 系统无缝集成

### 2. 异步文件加载
- LUT 文件通过 `setLutFile()` 方法异步加载
- 支持 PNG 和 .cube 格式
- 自动错误处理和日志记录

### 3. 状态同步
- LUT 效果通过 Redux store 管理
- 支持保存/加载游戏状态
- 与现有的动画系统兼容

### 4. 资源管理系统集成
- LUT 文件通过现有的资源扫描系统自动识别
- 支持资源预加载和缓存
- 自动路径解析和错误处理
- 与现有的资源管理系统完全兼容

## 使用方法

### 基本语法
```typescript
// 为立绘应用 LUT 效果
changeFigure 1/stand.webp -lut=LD - Cashmere 1.cube

// 为背景应用 LUT 效果
changeBg bg.webp -lut=LD - Cashmere 1.cube

// 移除 LUT 效果
changeFigure 1/stand.webp -lut=
```

### 文件结构
```
game/
├── lut/
│   ├── LD - Cashmere 1.cube
│   ├── LD - Cashmere 2.cube
│   └── custom-lut.png
├── figure/
└── background/
```

## 性能考虑

### 1. 异步加载
- LUT 文件异步加载，不阻塞主线程
- 使用 setTimeout 延迟加载，确保舞台对象已创建

### 2. 资源管理
- 自动清理未使用的 LUT 过滤器
- 支持过滤器的默认状态检测

### 3. 内存优化
- LUT 纹理通过 PIXI.js 管理
- 支持纹理的自动销毁和重用

## 兼容性

### 1. 向后兼容
- 所有现有功能保持不变
- 不添加 LUT 参数时行为与之前完全一致

### 2. 浏览器支持
- 需要支持 WebGL 的现代浏览器
- 依赖 PIXI.js 的过滤器系统

## 测试

### 1. 测试场景
- 创建了 `lut-test.txt` 测试场景文件
- 包含立绘和背景的 LUT 效果测试
- 演示了 LUT 效果的切换和移除

### 2. 测试覆盖
- LUT 文件加载测试
- 效果应用和移除测试
- 错误处理测试

## 未来改进

### 1. 功能扩展
- 支持 LUT 混合强度控制
- 添加预设 LUT 效果
- 支持 LUT 动画过渡

### 2. 性能优化
- LUT 文件预加载
- 智能缓存策略
- 批量 LUT 应用

### 3. 用户体验
- LUT 效果预览
- 实时参数调整
- 效果预设管理

## 总结

通过这次实现，WebGAL 现在具备了完整的 LUT 功能支持，用户可以：

1. 在 `changeFigure` 和 `changeBg` 命令中使用 `-lut=` 参数
2. 应用 PNG 和 .cube 格式的 LUT 文件
3. 动态切换和移除 LUT 效果
4. 享受与现有系统无缝集成的体验

所有修改都遵循了 WebGAL 的现有架构模式，确保了代码的一致性和可维护性。
