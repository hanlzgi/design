@echo off
cd /d "%~dp0"
echo 보훈 교재 로컬 서버 시작... (종료: 이 창에서 Ctrl+C)
start "" http://localhost:8000
python -m http.server 8000
