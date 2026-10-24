#!/bin/bash
# Sets up a Raspberry Pi as a Daily Print printer box. Run the command shown on the Customize page:
#   curl -fsSL <app>/printer/install.sh | sudo bash -s -- <app> <printer key>
# The printer must already be set up in CUPS (see docs/PRINTER_SETUP.md).
set -eu
url="$1"
key="$2"

printf 'DAILY_PRINT_URL=%s\nDAILY_PRINT_KEY=%s\n' "$url" "$key" > /etc/daily-print.conf
chmod 600 /etc/daily-print.conf
curl -fsSL "$url/printer/print.sh" -o /usr/local/bin/daily-print
chmod +x /usr/local/bin/daily-print

# Every 2 minutes, logging to /var/log/daily-print.log.
echo '*/2 * * * * root /usr/local/bin/daily-print >> /var/log/daily-print.log 2>&1' > /etc/cron.d/daily-print

# Keep the Wi-Fi awake, so the box doesn't miss its paper.
echo '@reboot root /usr/sbin/iw wlan0 set power_save off' > /etc/cron.d/daily-print-wifi
/usr/sbin/iw wlan0 set power_save off || true

echo "Done. This box now checks for your paper every 2 minutes. Log: /var/log/daily-print.log"
