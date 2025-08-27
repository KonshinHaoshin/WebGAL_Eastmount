# WebGAL LUT 功能 - 简化实现方案

## 🎯 实现思路

按照您提供的简化版本思路，我们创建了一个更清晰、更稳定的 LUT 实现：

### 📋 核心改进

1. **简化的 CustomColorMapFilter**
   - 移除复杂的 .cube 文件解析逻辑
   - 保留核心的 LUT 着色器功能
   - 修复了原版中的 alpha 处理问题

2. **更清晰的架构**
   - 在应用层处理不同文件格式
   - CustomColorMapFilter 只负责核心渲染
   - 保持功能分离原则

## 🔧 主要修改

### 1. CustomColorMapFilter 着色器修复

**关键改进：**
```glsl
// 修复前：可能导致立绘变黑
if (color.a > 0.1) { // 阈值过高
    vec3 unmultiplied_rgb = color.rgb / color.a; // 可能除零

// 修复后：安全可靠的处理
if (color.a <= 0.001) {
    gl_FragColor = color;
    return;
}
vec3 unmultiplied_rgb = color.a > 0.001 ? color.rgb / color.a : color.rgb;
unmultiplied_rgb = clamp(unmultiplied_rgb, 0.0, 1.0);
```

### 2. 应用层文件格式处理

**useSetFigure.ts & useSetBg.ts：**
```typescript
// 检查是否是 .cube 文件
if (lut.toLowerCase().endsWith('.cube')) {
    // 使用专门的转换方法处理 .cube 文件
    const texture = await create2DLutTextureFromCube(WebGAL.gameplay.pixiStage!.currentApp!, lut);
    figureObject.pixiContainer.setColorMapTexture(texture);
} else {
    // 对于图片格式的 LUT，直接设置纹理
    const texture = PIXI.Texture.from(lut);
    figureObject.pixiContainer.setColorMapTexture(texture);
}
```

## 🎨 着色器技术细节

### Alpha 处理优化

1. **早期退出机制**：完全透明像素直接跳过处理
2. **安全除法**：避免除以接近零的值
3. **值域限制**：确保所有计算值在合理范围内
4. **坐标裁剪**：防止纹理坐标越界

### LUT 查找算法

```glsl
// 3D LUT 查找的核心逻辑
float innerWidth = _size - 1.0;
float zSlice0 = min(floor(unmultiplied_rgb.b * innerWidth), innerWidth);
float zSlice1 = min(zSlice0 + 1.0, innerWidth);

// 计算纹理坐标
float xOffset = _slicePixelSize * 0.5 + unmultiplied_rgb.r * _sliceInnerSize;
float s0 = xOffset + (zSlice0 * _sliceSize);
float s1 = xOffset + (zSlice1 * _sliceSize);
float yOffset = _sliceSize * 0.5 + unmultiplied_rgb.g * (1.0 - _sliceSize);

// 安全的坐标裁剪
s0 = clamp(s0, 0.0, 1.0);
s1 = clamp(s1, 0.0, 1.0);
yOffset = clamp(yOffset, 0.0, 1.0);
```

## 🚀 优势对比

### 相比原版官方滤镜：
- ✅ 支持 .cube 文件格式
- ✅ 修复了黑屏问题
- ✅ 更好的 alpha 处理
- ✅ 安全的数值计算

### 相比复杂版本：
- ✅ 代码更清晰易维护
- ✅ 职责分离更明确
- ✅ 更少的潜在bug
- ✅ 更好的性能

## 🎯 测试验证

### 支持的文件格式

```bash
# .cube 文件 LUT
changeFigure:character.jsonl -right -id=2 -lut=LD-DarkMonochrome3.cube;
changeBg:background.jpg -lut=LD-DarkMonochrome3.cube;

# 图片文件 LUT
changeFigure:character.jsonl -right -id=2 -lut=lut-image.png;
changeBg:background.jpg -lut=lut-image.jpg;

# 清除 LUT
changeFigure:character.jsonl -right -id=2 -lut=;
changeBg:background.jpg -lut=;
```

### 预期效果

- ✅ 立绘正确显示并应用 LUT 色调
- ✅ 背景正确显示并应用 LUT 色调
- ✅ 透明度和边缘正常处理
- ✅ 不再出现黑屏或黑色轮廓

## 📁 修改文件清单

1. **`CustomColorMapFilter.ts`** - 简化并修复着色器
2. **`useSetFigure.ts`** - 添加文件格式判断逻辑
3. **`useSetBg.ts`** - 添加文件格式判断逻辑
4. **`WebGALPixiContainer.ts`** - 使用自定义滤镜（已完成）

## 💡 设计原则

这个实现遵循了以下设计原则：

1. **单一职责**：CustomColorMapFilter 只负责渲染
2. **关注分离**：文件处理在应用层完成
3. **容错性**：添加多层安全检查
4. **可扩展性**：易于添加新的 LUT 格式支持
5. **可维护性**：代码清晰，逻辑简单

现在您的 WebGAL 应该可以正确处理 LUT 功能而不会出现黑屏问题了！
