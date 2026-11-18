#!/bin/bash
# Sets up a Mac, Raspberry Pi or other Linux computer as a Daily Print printer box. Run the command shown on the
# Customize page:
#   curl -fsSL <app>/printer/install.sh | sudo bash -s -- <app> <printer key>
# The printer must already be set up in CUPS (see docs/PRINTER_SETUP.md). Running it again with a new key keeps
# your printer settings.
set -eu
url="$1"
key="$2"
conf=/etc/daily-print.conf

# The printer settings from an earlier setup, or these to start with.
settings=$(grep -v -e '^DAILY_PRINT_' -e '^$' "$conf" 2>/dev/null || true)
[ -n "$settings" ] || settings='# Printer settings: edit these to suit your printer (see docs/PRINTER_SETUP.md).
# The printer to use, as `lpstat -p` names it. Empty means the default printer.
PRINTER=""
# "yes" prints on both sides of the sheet, if your printer can.
DOUBLE_SIDED="no"
# Any other lp options, for example "-o media=A4 -n 2" (A4 paper, 2 copies).
LP_OPTIONS=""'
printf 'DAILY_PRINT_URL=%s\nDAILY_PRINT_KEY=%s\n\n%s\n' "$url" "$key" "$settings" > "$conf"
chmod 600 "$conf"

mkdir -p /usr/local/bin
curl -fsSL "$url/printer/print.sh" -o /usr/local/bin/daily-print
chmod +x /usr/local/bin/daily-print

# Every 2 minutes, logging to /var/log/daily-print.log.
if [ "$(uname)" = Darwin ]; then
  cat > /Library/LaunchDaemons/daily-print.plist <<'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key><string>daily-print</string>
  <key>ProgramArguments</key><array><string>/usr/local/bin/daily-print</string></array>
  <key>StartInterval</key><integer>120</integer>
  <key>StandardOutPath</key><string>/var/log/daily-print.log</string>
  <key>StandardErrorPath</key><string>/var/log/daily-print.log</string>
</dict>
</plist>
EOF
  launchctl bootout system/daily-print 2>/dev/null || true
  launchctl bootstrap system /Library/LaunchDaemons/daily-print.plist
else
  echo '*/2 * * * * root /usr/local/bin/daily-print >> /var/log/daily-print.log 2>&1' > /etc/cron.d/daily-print

  # Keep the Wi-Fi awake, so the box doesn't miss its paper.
  echo '@reboot root /usr/sbin/iw wlan0 set power_save off' > /etc/cron.d/daily-print-wifi
  /usr/sbin/iw wlan0 set power_save off 2>/dev/null || true
fi

echo "Done. This box now checks for your paper every 2 minutes. Printer settings: $conf. Log: /var/log/daily-print.log"
