# Records demo/watch.gif. Run from the repository root:
#
#   vhs demo/watch.tape
#
# The clock is faked to day one of the conference and runs 120x faster than real
# time, so a few seconds of recording show the progress bar filling up and one
# talk handing over to the next.

Output demo/watch.gif

Set Shell "bash"
Set FontSize 16
Set Width 1240
Set Height 500
Set Padding 24
Set Framerate 24
Set TypingSpeed 45ms

Hide
Type `export CNDACTL_DEMO_NOW=2026-09-29T08:52:00Z CNDACTL_DEMO_SPEED=120`
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
Type `cndactl watch`
Enter
Sleep 14s
Ctrl+C
Sleep 2s
