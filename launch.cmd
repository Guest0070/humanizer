@echo off
rem Opens Plainspoken as a standalone app window (Edge or Chrome app mode), or in the default browser.
rem No server, no install, no network. The page blocks network requests itself.
set "APP=%~dp0index.html"
set "URL=file:///%APP:\=/%"
where msedge >nul 2>nul && (start "" msedge --app="%URL%" & exit /b)
if exist "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" (start "" "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" --app="%URL%" & exit /b)
if exist "%ProgramFiles%\Google\Chrome\Application\chrome.exe" (start "" "%ProgramFiles%\Google\Chrome\Application\chrome.exe" --app="%URL%" & exit /b)
start "" "%APP%"
