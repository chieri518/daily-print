#!/bin/bash
# Daily Print printer box. Runs every 2 minutes: asks the app for a paper to print, prints it, and reports back.
# Settings (the app's address, this box's key and the printer settings) are in /etc/daily-print.conf, written by
# install.sh. Edit the printer settings there.
set -u
source /etc/daily-print.conf
printer="${PRINTER:-}" # empty: the default printer

# The lp options from the printer settings. CUPS printer names have no spaces, so they split safely.
options="${printer:+-d $printer} ${LP_OPTIONS:-}"
[ "${DOUBLE_SIDED:-no}" = yes ] && options="$options -o sides=two-sided-long-edge"

# Only one at a time: a paper can take longer than 2 minutes to print. (On a Mac, launchd already sees to that.)
if command -v flock >/dev/null; then
  exec 9>/tmp/daily-print.lock
  flock -n 9 || exit 0
fi

report() { # report <edition id> [error]. Retried, since a paper not reported prints again 2 minutes later.
  local body
  body=$(python3 -c 'import json,sys; print(json.dumps({"id": sys.argv[1], "error": sys.argv[2] or None}))' "$1" "${2:-}")
  curl -fsS --retry 5 --retry-connrefused -X POST -H "Authorization: Bearer $DAILY_PRINT_KEY" -H "Content-Type: application/json" \
    -d "$body" "$DAILY_PRINT_URL/api/printer/done"
}

# Nothing to print returns an empty answer.
answer=$(curl -fsS -H "Authorization: Bearer $DAILY_PRINT_KEY" "$DAILY_PRINT_URL/api/printer/next") || exit 0
[ -z "$answer" ] && exit 0
read -r id pdf < <(python3 -c 'import json,sys; a = json.load(sys.stdin); print(a["id"], a["pdf"])' <<<"$answer")
echo "$(date): printing $id"

file=$(mktemp) # a fresh file each time: this runs as root, and a fixed name in /tmp could be a planted link
trap 'rm -f "$file"' EXIT
curl -fsS -o "$file" "$pdf" || { report "$id" "The printer box couldn't download the paper"; exit 0; }
# lp answers "request id is <job> (1 file(s))".
job=$(lp $options "$file" | sed -n 's/^request id is \([^ ]*\).*/\1/p')
[ -n "$job" ] || { report "$id" "The printer box couldn't send the paper to the printer"; exit 0; }

# Wait up to 10 minutes for the printer to take every page of this job (other jobs are left alone).
for _ in $(seq 60); do
  lpstat -o | grep -q "^$job " || { report "$id"; exit 0; }
  sleep 10
done
report "$id" "The printer didn't finish: $(lpstat -p $printer | head -1)"
cancel "$job"
