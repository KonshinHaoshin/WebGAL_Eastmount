## 发布日志

**本仓库只发布源代码**

**如果你想要体验使用便捷的图形化编辑器创建、制作并实时预览 WebGAL 游戏，请 [下载 WebGAL 图形化编辑器](https://github.com/OpenWebGAL/WebGAL_Terre/releases)**

### 在此版本中

#### 新功能

新增斜角（Bevel）和发光（Bloom）滤镜效果，提供更丰富的视觉特效选项

优化雪花、樱花飘落和雨滴效果的性能表现，提升渲染效果的真实感

为 `wait` 命令新增 `goNextWhenOver` 属性，可在等待结束后自动进入下一条指令

支持 Spine 立绘动画切换功能，通过 `-motion` 参数控制动画播放

为 `setAnimation` 和 `setTempAnimation` 新增 ease 缓动参数，支持更流畅的动画过渡

新增 `keep` 参数用于保持特定状态

改进带样式文本的逐字显示动画，正确处理 ruby 注音文本

新增退出游戏确认对话框，避免误操作

#### 修复

修复 Live2D 立绘在边界修改时的初始位置错误

修复启动时错误重置用户数据的问题

修复 Spine 立绘动画切换异常

修复带样式文本的逐字动画显示问题

修复视频背景文件扩展名识别问题

优化 `changeFigure` 和 `changeBg` 的停止函数和性能名称处理

当没有解锁的背景音乐时，隐藏音轨选择界面

其他性能优化和稳定性改进


模板文件中的字体会自动加载，并可在选项中选择模板或内置字体

文本框支持配置最大行数和行高，便于自定义排版

新增 Steam 集成，可通过 Steam_AppID 配置与 callSteam 指令解锁成就

舞台渲染支持 GIF 资源

立绘和背景支持用 enterDuration / exitDuration 单独设置进退场动画时长

#### 修复

修复鼠标滚轮触发快进后无法正常取消且按钮状态异常的问题

改进效果音播放的错误处理，缺失或失败不会再阻塞播放或自动前进

修复脚本解析对空白语句、注释和 Windows 换行的处理，避免错误裁剪

修复切换语音文件时可能不重新加载导致语音缺失的问题（#791）

修复立绘和背景自定义进退场时长的参数键名与 0 时长处理，确保配置生效

<!-- English Translation -->
## Release Notes

**Only source code is released in this repository**

**If you want to experience creating, making, and real-time previewing WebGAL games using a user-friendly graphical editor, please [download the WebGAL graphical editor](https://github.com/OpenWebGAL/WebGAL_Terre/releases)**

### In this version

#### New Features

Added Bevel and Bloom filter effects for richer visual options

Optimized performance of snow, cherry blossom, and rain effects with improved realism

Added `goNextWhenOver` property to `wait` command for automatic progression

Support for Spine figure animation switching via `-motion` parameter

Added ease parameter to `setAnimation` and `setTempAnimation` for smoother transitions

Added `keep` parameter to maintain specific states

Improved character-by-character animation for styled text with ruby annotation support

Added exit game confirmation dialog to prevent accidental exits

#### Fixes

Fixed Live2D figure initial position error when bounds are modified

Fixed erroneous user data reset on startup

Fixed Spine figure animation switching issues

Fixed character-by-character animation for styled text

Fixed video background file extension recognition

Optimized `changeFigure` and `changeBg` stop function and performance name handling

Hide track selection interface when no BGM tracks are unlocked

Other performance optimizations and stability improvements


Template fonts are now loaded from game/template/template.json, and the options menu lets you pick template or built-in fonts

Textbox layout can be customized with max line count and line height settings

Added Steam integration: set Steam_AppID and use the callSteam script to unlock achievements

Stage rendering now supports GIF assets

Figures and backgrounds accept enterDuration / exitDuration to override enter/exit animation durations

#### Fixes

Fixed fast-forward triggered by mouse wheel not stopping correctly or resetting the button state

Improved error handling for effect audio so missing or failed sounds no longer block playback or auto-advance

Fixed script parsing of blank lines, comments, and Windows line endings to avoid trimming mistakes

Fixed voice lines sometimes not reloading when switching audio files (#791)

Fixed animation duration configuration keys and zero-duration handling so custom enter/exit timings take effect for figures and backgrounds

<!-- Japanese Translation -->
## リリースノート

**このリポジトリはソースコードのみを公開しています**

**もしあなたが使いやすいグラフィカルエディタでWebGALゲームを作成、制作、リアルタイムプレビューしたい場合は、[WebGALグラフィカルエディタをダウンロードしてください](https://github.com/OpenWebGAL/WebGAL_Terre/releases)**

### このバージョンについて

#### 新機能

ベベル（Bevel）とブルーム（Bloom）フィルター効果を追加し、より豊富なビジュアルエフェクトを提供

雪、桜の花びら、雨滴エフェクトのパフォーマンスを最適化し、よりリアルな描画効果を実現

`wait` コマンドに `goNextWhenOver` 属性を追加し、待機終了後に自動的に次の命令へ進行

Spine 立ち絵のアニメーション切り替えをサポート、`-motion` パラメータでアニメーション制御

`setAnimation` と `setTempAnimation` に ease イージングパラメータを追加し、より滑らかなアニメーション遷移を実現

特定の状態を維持するための `keep` パラメータを追加

スタイル付きテキストの一文字ずつのアニメーションを改善し、ルビ注釈テキストを正しく処理

ゲーム終了確認ダイアログを追加し、誤操作を防止

#### 修正

境界が変更された際のLive2D立ち絵の初期位置エラーを修正

起動時にユーザーデータが誤ってリセットされる問題を修正

Spine立ち絵のアニメーション切り替え異常を修正

スタイル付きテキストの一文字アニメーション表示問題を修正

ビデオ背景ファイルの拡張子認識問題を修正

`changeFigure` と `changeBg` の停止関数とパフォーマンス名の処理を最適化

BGMトラックがアンロックされていない場合、トラック選択インターフェースを非表示に

その他のパフォーマンス最適化と安定性の向上
テンプレート（game/template/template.json）のフォントを読み込み、オプションでテンプレート／内蔵フォントを選べるようになりました

テキストボックスの最大行数と行間を設定でカスタマイズできるようになりました

Steam 連携を追加し、Steam_AppID を設定して callSteam スクリプトで実績を解除できます

ステージ描画が GIF アセットに対応しました

立ち絵と背景の登場／退場アニメに enterDuration / exitDuration で時間を上書きできるようになりました

#### 修正

マウスホイールでの早送りが正しく解除されずボタン状態が戻らない問題を修正しました

存在しない効果音などで再生が失敗しても再生や自動進行が止まらないようエラーハンドリングを改善しました

空行や空のセリフ、Windows の改行を含むスクリプトのパース処理を修正しました

ボイス切り替え時に音声が更新されない場合がある不具合を修正しました（#791）

立ち絵／背景の入退場アニメの時間設定でキー名や 0 ミリ秒を扱えない問題を修正しました
