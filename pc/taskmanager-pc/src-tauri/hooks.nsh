!macro NSIS_HOOK_POSTINSTALL
  CreateShortcut "$DESKTOP\TaskManager.lnk" "$INSTDIR\TaskManager.exe"
!macroend

!macro NSIS_HOOK_POSTUNINSTALL
  Delete "$DESKTOP\TaskManager.lnk"
!macroend
