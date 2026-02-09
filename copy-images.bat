@echo off
echo Copying achievement badge and revision tool images...

copy "..\image-removebg-preview (24) 1 (1).png" "public\badge-30day-streak.png"
copy "..\image-removebg-preview (23) 1.png" "public\badge-quick-learner.png"
copy "..\image-removebg-preview (22) 1.png" "public\badge-95-accuracy.png"
copy "..\Icon.png" "public\icon-flashcards.png"
copy "..\list-fail.png" "public\icon-wrong-attempts.png"
copy "..\tree-list.png" "public\icon-mindmaps.png"
copy "..\newspaper-folding.png" "public\icon-quick-notes.png"

echo.
echo Images copied successfully!
echo.
pause
