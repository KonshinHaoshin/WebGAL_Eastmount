# WebGAL LUT 黑屏问题排查与修复

## 🐛 问题现象

从您的截图看到：
- ✅ 背景正确应用了 LUT 效果（蓝色调）
- ❌ 右侧立绘变成了纯黑色轮廓

## 🔍 根本原因

问题出现在 `CustomColorMapFilter` 的着色器代码中：

1. **Alpha 阈值过高**：原来的 `color.a > 0.1` 阈值太高，导致很多半透明像素被跳过
2. **除零风险**：在预乘 alpha 处理 `color.rgb / color.a` 时可能出现数值不稳定
3. **纹理坐标越界**：LUT 查找时没有对坐标进行范围限制

## 🔧 修复措施

### 修改文件：`packages/webgal/src/Core/controller/stage/pixi/shaders/CustomColorMapFilter.ts`

#### 1. 降低 Alpha 阈值
```glsl
// 修改前
if (color.a > 0.1) {

// 修改后
if (color.a > 0.001) {
```

#### 2. 安全的预乘 Alpha 处理
```glsl
// 修改前
vec3 unmultiplied_rgb = color.rgb / color.a;

// 修改后
vec3 unmultiplied_rgb = color.a > 0.001 ? color.rgb / color.a : color.rgb;
// 确保 RGB 值在合理范围内
unmultiplied_rgb = clamp(unmultiplied_rgb, 0.0, 1.0);
```

#### 3. 纹理坐标范围限制
```glsl
// 新增：确保纹理坐标在合理范围内
s0 = clamp(s0, 0.0, 1.0);
s1 = clamp(s1, 0.0, 1.0);
yOffset = clamp(yOffset, 0.0, 1.0);
```

## 🎯 测试验证

修复后请测试以下命令：

```bash
# 立绘 LUT 测试
changeFigure:该溜子祥子/该溜子祥子.jsonl -right -id=2 -motion=idle01 -expression=idle01 -ease=circOut -lut=LD-DarkMonochrome3.cube;

# 背景 LUT 测试
changeBg:background.jpg -lut=LD-DarkMonochrome3.cube;

# 清除 LUT 测试
changeFigure:该溜子祥子/该溜子祥子.jsonl -right -id=2 -lut=;
changeBg:background.jpg -lut=;
```

## 🔍 调试信息

修复版本会在浏览器控制台输出详细日志：

```
🎨 CustomColorMapFilter.apply() 被调用
  - mix 值: 1
  - colorMap 存在: true
  - colorMap 尺寸: 1089x33
  - uniforms 状态: {_size: 33, _sliceSize: 0.030303, ...}
✅ uniforms 设置完成
```

如果仍有问题，请检查：
1. 控制台是否有错误信息
2. LUT 文件是否正确加载
3. 立绘文件是否正常

## 🚀 预期效果

修复后应该看到：
- ✅ 背景正确应用 LUT 色调
- ✅ 立绘正确应用 LUT 色调，保持完整细节
- ✅ 透明度和边缘处理正常
- ✅ 可以正常切换和清除 LUT

## 📝 常见问题

### Q: 立绘还是黑色怎么办？
A: 检查浏览器控制台，可能是：
- LUT 纹理加载失败
- 着色器编译错误
- 立绘文件本身问题

### Q: 背景正常但立绘异常？
A: 可能是立绘和背景使用了不同的渲染管道，检查：
- Live2D 模型的特殊处理
- 不同文件格式的兼容性

### Q: 如何回退到旧版本？
A: 将 `WebGALPixiContainer.ts` 中的导入改回：
```typescript
import { ColorMapFilter } from '@pixi/filter-color-map';
```

但这会导致原始的黑屏问题重现。
