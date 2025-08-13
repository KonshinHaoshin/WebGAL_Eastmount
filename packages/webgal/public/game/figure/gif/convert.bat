@echo off
chcp 65001 >nul
echo 🐾 开始批量转换 .mov 和 .gif 为 .webm 文件...

REM 遍历当前目录下所有 .mov 文件
for %%f in (*.mov) do (
    echo 🎬 正在转换 MOV: %%f → %%~nf.webm
    ffmpeg -y -i "%%f" -c:v libvpx-vp9 -b:v 1M -c:a libopus "%%~nf.webm"
)

REM 遍历当前目录下所有 .gif 文件
for %%f in (*.gif) do (
    echo 🐱 正在转换 GIF: %%f → %%~nf.webm
    ffmpeg -y -i "%%f" -c:v libvpx-vp9 -b:v 1M -an "%%~nf.webm"
)

echo ✅ 全部转换完成喵～记得检查输出效果～
pause
