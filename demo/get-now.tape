# Records demo/get-now.gif. Run from the repository root:
#
#   vhs demo/get-now.tape
#
# The clock is faked to a moment during day one of the conference so the output
# shows running talks instead of a countdown of several days.

Output demo/get-now.gif

Set Shell "bash"
Set FontSize 16
Set Width 1240
Set Height 420
Set Padding 24
Set Framerate 24
Set TypingSpeed 45ms

Hide
Type `export CNDACTL_DEMO_NOW=2026-09-29T08:35:00Z`
Enter
Type `cndactl() { npx tsx scripts/demo-clock.ts "$@"; }`
Enter
Type `cndactl get now > /dev/null 2>&1`
Enter
Sleep 15s
Type `clear`
Enter
Show

Sleep 1s
Type `cndactl get sessions | sed -n '1,11p'`
Enter
Sleep 5s
Type `clear`
Enter

Type `cndactl get now`
Enter
Sleep 6s
Type `clear`
Enter

Type `cndactl get now --room 6`
Enter
Sleep 5s
