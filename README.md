# Греческий — приложение (A1 → A2)
https://dmshad.github.io/greek/ — PWA, только автономный режим. Ядро — общее с dmshad/korean.

Корень — собранное приложение (index.html, sw.js, manifest, иконки, version.json). Исходники:
- `src/core/app.js`, `src/shell.html` — ядро из dmshad/korean + греческие правки: `python3 tools/patch_core.py <клон dmshad/korean>`
  (руками не править — правки вносятся в tools/patch_core.py).
- `src/lang/el/lang.js` — язык: код el, голос el-GR, нормализация ответа (LANG.fold), пояснения к ошибкам (LANG.wnote).
- `src/lang/el/chk.js` — проверка фраз (CHK) и банк заданий (BANK).
- `content/el/vocab/words.txt`, `themes.py` — словарь A1 и список тем → `tools/vocab_build.py` → `content/el/vocab_a1.tsv` (транскрипция — `tools/translit.py`).
- `content/el/topics/tNN.py` — готовые темы (грамматика: теория, части, упражнения, банк; словарь: категории и примеры).
- `tools/data_build.py` → `content/el/data.json`; `tools/build.py el <out.html>` → приложение одним файлом.

Выкладка: `tools/deploy.sh "<сообщение>" <версия>` (пуш через origin; токен в репозиторий не кладётся).
Хранилище и кэш — с префиксом el: / el- (на одном адресе с корейским, не пересекаются).
Решения по курсу и транскрипции — docs/.

## Полный бэкап и восстановление с нуля
Репозиторий — единственный источник правды (артефакта в Claude у греческого нет). Сборка из исходников побайтно совпадает
с выложенным приложением (проверено 07.11.2026 на версии 2026-10-28.1: index.html, sw.js, manifest, иконки, version.json, print.html).
Прогресс учеников (localStorage на их устройствах) в репозиторий не входит и не нужен — тему для старта выбирают в приложении.

Нужно: Python 3, Pillow (иконки), шрифт DejaVu Sans Bold (`/usr/share/fonts/truetype/dejavu/`); для синхронизации ядра — клон dmshad/korean.
1. `git clone https://github.com/dmshad/greek.git && cd greek`
2. `tools/deploy.sh "<сообщение>" <ГГГГ-ММ-ДД.N>` — словарь → data.json → приложение → пакет → печатные таблицы → коммит и пуш.
   Только собрать, без выкладки: `python3 tools/vocab_build.py && python3 tools/data_build.py && python3 tools/build.py el app.html`.
3. GitHub Pages: Settings → Pages → ветка main, корень.
