#!/bin/bash
# Выкладка греческого приложения в dmshad/greek (GitHub Pages, ветка main, корень).
# Запуск из корня репозитория: tools/deploy.sh "<сообщение>" <версия>
# Токен — в /home/claude/.ghtoken (в репозиторий не кладётся).
set -e
MSG="$1"; VER="$2"; [ -n "$MSG" ] && [ -n "$VER" ]
R=$(pwd)
python3 tools/vocab_build.py
python3 tools/data_build.py
python3 tools/build.py el /home/claude/el_app.html
python3 tools/build_pkg.py /home/claude/el_app.html "$VER" el
cp /home/claude/pkg/app/* "$R/"
T=$(cat /home/claude/.ghtoken)
git -c user.name="dmshad" -c user.email="dmshad@users.noreply.github.com" add -A
git -c user.name="dmshad" -c user.email="dmshad@users.noreply.github.com" commit -q -m "$MSG"
git push -q "https://x-access-token:$T@github.com/dmshad/greek.git" HEAD:main
git log --oneline -1
