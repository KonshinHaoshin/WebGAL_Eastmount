# WebGAL LUT 功能说明

## 概述

WebGAL 现在支持 LUT (Look-Up Table) 功能，允许用户在 `changeFigure` 和 `changeBg` 命令中应用颜色校正和风格化效果。

## 功能特性

- 支持 PNG 格式的 LUT 文件
- 支持 .cube 格式的 LUT 文件
- 可以应用于立绘 (Figure) 和背景 (Background)
- 支持动态切换和移除 LUT 效果

## 使用方法

### 基本语法

```
changeFigure <图片路径> -lut=<LUT文件路径>
changeBg <背景路径> -lut=<LUT文件路径>
```

### 参数说明

- `-lut=<LUT文件路径>`: 指定要应用的 LUT 文件，相对于 `game/lut/` 目录

### 示例

#### 为立绘应用 LUT 效果

```
; 显示立绘并应用 LUT 效果
changeFigure 1/stand.webp -lut=LD - Cashmere 1.cube

; 切换 LUT 效果
changeFigure 1/stand.webp -lut=LD - Cashmere 2.cube

; 移除 LUT 效果
changeFigure 1/stand.webp -lut=
```

#### 为背景应用 LUT 效果

```
; 显示背景并应用 LUT 效果
changeBg bg.webp -lut=LD - Cashmere 1.cube

; 切换 LUT 效果
changeBg bg.webp -lut=LD - Cashmere 3.cube
```

## 支持的文件格式

### PNG LUT 文件
- 支持标准的 PNG 格式
- 文件应放置在 `game/lut/` 目录下

### .cube 文件
- 支持标准的 .cube 格式
- 自动解析 LUT_3D_SIZE 参数
- 支持 RGB 数据格式

## 文件结构

```
game/
├── lut/
│   ├── LD - Cashmere 1.cube
│   ├── LD - Cashmere 2.cube
│   ├── LD - Cashmere 3.cube
│   └── custom-lut.png
├── figure/
├── background/
└── ...
```

## 技术实现

### 过滤器集成
LUT 功能通过 `CustomColorMapFilter` 实现，该过滤器：
- 继承自 PIXI.Filter
- 支持 3D LUT 查找
- 自动处理预乘 alpha 通道
- 支持混合强度控制

### 性能优化
- 异步加载 LUT 文件
- 智能缓存机制
- 自动清理未使用的资源

## 注意事项

1. **文件路径**: LUT 文件路径相对于 `game/lut/` 目录
2. **文件格式**: 确保 LUT 文件格式正确，特别是 .cube 文件
3. **性能**: 大型 LUT 文件可能影响性能
4. **兼容性**: 需要支持 WebGL 的现代浏览器

## 故障排除

### 常见问题

1. **LUT 文件加载失败**
   - 检查文件路径是否正确
   - 确认文件格式是否支持
   - 查看浏览器控制台错误信息

2. **效果不明显**
   - 检查 LUT 文件是否正确
   - 确认 `-lut=` 参数格式正确
   - 验证文件是否成功加载

3. **性能问题**
   - 考虑使用较小的 LUT 文件
   - 避免频繁切换 LUT 效果

## 更新日志

- **v1.0.0**: 初始 LUT 功能实现
  - 支持 PNG 和 .cube 格式
  - 集成到 changeFigure 和 changeBg 命令
  - 自动 LUT 文件管理

## 贡献

欢迎提交 Issue 和 Pull Request 来改进 LUT 功能！
