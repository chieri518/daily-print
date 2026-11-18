# Printing

How to print Daily Print on your own printer. Pick the way that suits you:

| Way | Good for | You need |
|---|---|---|
| [From the browser](#print-whenever-you-like) | Printing whenever you like | Any computer that can print |
| [A Mac printer box](#a-mac-as-the-printer-box) | A paper every morning, from a Mac that stays on | A Mac, and the printer added to it |
| [A Raspberry Pi printer box](#a-raspberry-pi-as-the-printer-box) | A paper every morning, from a small box by the printer | A Raspberry Pi with Wi-Fi, and a printer that works with CUPS |

Any other always-on Linux computer works like the Pi: start at [its step 3](#3-install-the-printing-software).

**Status:** the Pi box is tested with an HP LaserJet Pro P1102w over USB (2026-10-23). The Mac box and double-sided printing are written but not yet tried on a real printer.

## Print whenever you like

1. Open the paper on the **Paper** page, or pick one on the **Editions** page, and click **PDF**.
2. Print it from the browser (⌘P on a Mac, Ctrl+P elsewhere). Choose:
   - **Scale: 100%** (or "Actual size"), not "Fit to page", so the text is the size it was laid out for.
   - The same **paper size** as in Customize (US Letter or A4).
   - **Two-sided**, if your printer can and you'd like fewer sheets.

Running the app yourself? `npm run paper` saves a paper to `editions/YYYY-MM-DD.pdf`, and `lp editions/YYYY-MM-DD.pdf` prints it (Mac or Linux).

## Before you set up a printer box

- **The box prints by itself.** It asks the app every 2 minutes for a paper whose print time has come, prints it and reports back. Nothing at home has to accept connections. Set a **print time** in Customize, or the box has nothing to print.
- **Which app it talks to.** If you use someone's hosted Daily Print, the setup command already has its address. If you run your own copy, the box talks to yours: your Vercel address, or your computer's while testing (see [Connect the box](#connect-the-box-to-your-account)).
- **Your printer must work with CUPS**, the printing system on Macs and Linux. Most printers do. Newer network printers (AirPrint, or "IPP Everywhere") need no driver at all. For others, look up yours on [OpenPrinting](https://www.openprinting.org/printers).
- **Paper size:** set the printer to the size you chose in Customize.

## A Mac as the printer box

1. Add your printer in **System Settings → Printers & Scanners**, and print a test page from any app.
2. In Terminal, find the printer's name: `lpstat -p`. It's the word after `printer`, for example `HP_LaserJet_Pro_P1102w`.
3. Check that `/usr/bin/python3 --version` prints a version. If the Mac offers to install the command line developer tools, accept.
4. Keep the Mac awake at the print time: a sleeping Mac misses its paper. Keep it plugged in, and turn on **System Settings → Energy → Prevent automatic sleeping when the display is off** (on a laptop: **Battery → Options → Prevent automatic sleeping on power adapter when the display is off**).
5. [Connect the box to your account](#connect-the-box-to-your-account).
6. In the [printer settings](#printer-settings), set `PRINTER` to the name from step 2. A Mac's default printer is often "the last one used", so naming it is safer.

## A Raspberry Pi as the printer box

Any Raspberry Pi with Wi-Fi works: Zero W, Zero 2 W, 3, 4 or 5.

**What you need:** the Pi, its power supply, a microSD card (8 GB or larger) and your Wi-Fi name and password. For a USB printer, a USB printer cable, and on a Pi Zero, a **micro-USB OTG adapter** that carries data (some cheap ones only charge). A network printer needs no cable.

### 1. Put the operating system on the SD card

1. Install and open **Raspberry Pi Imager** (raspberrypi.com/software).
2. Choose your Pi model, **Raspberry Pi OS Lite** (under "Raspberry Pi OS (other)") and your SD card.
3. Click **Edit settings** and set:
   - Hostname: `dailyprint`
   - **Username and password.** There is no default `pi` user, so remember these
   - Wi-Fi: network name, password and country. A Pi Zero W only uses **2.4 GHz** Wi-Fi
   - Services tab: turn on **SSH** with password login
4. When asked "apply OS customisation settings?", click **Yes**. Then write the card.

### 2. Connect to the Pi

1. Put the card in the Pi and plug in the power (on a Pi Zero, the port labeled **PWR**). Wait about 10 minutes: the first start is slow and restarts once.
2. On your computer, connect (replace `you` with your username):
   ```
   ssh -4 you@dailyprint.local
   ```
   `-4` matters: without it, a Mac may try IPv6 and time out.
3. If `dailyprint.local` isn't found, get the Pi's address with `ping -c 3 dailyprint.local` (or your router's device list) and use `ssh you@<address>`.
4. Once you're in, stop the Wi-Fi from dropping the connection: `sudo iw wlan0 set power_save off`

### 3. Install the printing software

```
sudo apt update && sudo apt full-upgrade -y
sudo apt install -y cups
sudo usermod -aG lpadmin $USER
sudo reboot
```

On a Pi Zero, the upgrade takes 30 minutes or more. After the reboot, wait a few minutes and connect again.

If your printer needs a driver, install its package too. Some common ones:

| Printers | Package |
|---|---|
| Most HP printers | `printer-driver-hpcups` |
| Older HP LaserJets that need a firmware download (P1102w, P1006, 1020…) | `printer-driver-foo2zjs` |
| Brother laser printers | `printer-driver-brlaser` |
| Many inkjets (Canon, Epson…) | `printer-driver-gutenprint` |

### 4. Add the printer

1. For a USB printer, turn it on and plug it in (on a Pi Zero, through the OTG adapter in the port labeled **USB**, not PWR). `lsusb` should list it.
2. Find the printer's address: `sudo lpinfo -v`. A USB printer starts with `usb://`; a network printer with `ipp://`, `ipps://` or `dnssd://`.
3. Find its driver: `lpinfo -m | grep -i <your model>`, and copy the part before the first space. A network printer that supports AirPrint or IPP Everywhere uses `everywhere` instead.
4. Add it, with a short name of your choice (no spaces), its address, its driver, and your paper size (`Letter` or `A4`):
   ```
   sudo lpadmin -p NAME -E -v 'ADDRESS' -m 'DRIVER' -o PageSize=Letter
   sudo lpadmin -d NAME
   lpstat -p
   ```
   The last command should say `printer NAME is idle`.

> **Example: HP LaserJet Pro P1102w over USB.** Install `printer-driver-foo2zjs` in step 3 (HP's own driver needs a plugin that doesn't run on a Pi Zero). Then `lpinfo -m | grep -i p1102` shows the driver that mentions foo2zjs or foo2xqx, and:
> ```
> sudo lpadmin -p P1102w -E -v 'usb://HP/LaserJet%20Professional%20P1102w?serial=...' -m 'DRIVER' -o PageSize=Letter
> ```
> It prints one side per sheet, so a 4-page paper uses 4 sheets.

### 5. Print a test paper

1. On your **computer**, in the daily-print folder, copy a sample paper to the Pi:
   ```
   scp public/samples/1-the-morning-edition.pdf you@dailyprint.local:~/test.pdf
   ```
2. On the **Pi**: `lp ~/test.pdf`
3. `lpstat -o` lists the job until the printer has it all.

### 6. Connect the box

[Connect the box to your account](#connect-the-box-to-your-account).

## Connect the box to your account

1. In the web app, open **Customize → Paper & style → Printing**. Set a **print time** and **Save**.
2. Click **Set up a printer box**. It shows a command with your new printer key. The key is shown only once.
3. On the Mac or Pi, run that command in Terminal. It saves the app's address, the key and the [printer settings](#printer-settings) in `/etc/daily-print.conf`, and checks for a paper every 2 minutes.
4. The Customize page shows when the box last checked in. To see what it did: `tail /var/log/daily-print.log`.

**Running the app on your own computer** (`npm run dev`): the command says `localhost`. That's right if the box is the same Mac. On a Pi, `localhost` means the Pi itself: replace both `http://localhost:3000` with your computer's address (on a Mac, `ipconfig getifaddr en0`), for example `http://10.0.0.8:3000`. The computer must stay awake.

## Printer settings

The printer settings are at the end of `/etc/daily-print.conf` on the box. Edit them with `sudo nano /etc/daily-print.conf`. The box reads them each time it checks, so there's nothing to restart, and setting the box up again with a new key keeps them.

| Setting | What it does | Example |
|---|---|---|
| `PRINTER` | The printer to use, as `lpstat -p` names it. Empty means the default printer | `PRINTER="P1102w"` |
| `DOUBLE_SIDED` | `"yes"` prints on both sides of the sheet, if your printer can do it on its own | `DOUBLE_SIDED="yes"` |
| `LP_OPTIONS` | Any other options for `lp` | `LP_OPTIONS="-o media=A4 -n 2"` (A4 paper, 2 copies) |

To see what else your printer can do, such as trays or print quality, run `lpoptions -p NAME -l`. Each line is an option you can add, for example `LP_OPTIONS="-o InputSlot=Tray2"`.

Running your own copy of the app and want the box to do something else? Change [public/printer/print.sh](../public/printer/print.sh), then set the box up again with a new key: it downloads the script from your app.

## Remove the box

- **Mac:** `sudo launchctl bootout system/daily-print && sudo rm /Library/LaunchDaemons/daily-print.plist /usr/local/bin/daily-print /etc/daily-print.conf`
- **Pi or Linux:** `sudo rm /etc/cron.d/daily-print /etc/cron.d/daily-print-wifi /usr/local/bin/daily-print /etc/daily-print.conf`

## If something goes wrong

Start with the box's log, `tail /var/log/daily-print.log`, and the printing system's, `sudo tail -30 /var/log/cups/error_log`. The Editions page also shows why a paper didn't print.

- **"No default destination" or nothing prints:** set `PRINTER` in the [printer settings](#printer-settings).
- **"error: 401" in the log:** the app doesn't recognize the key: it was replaced or mistyped. Make a new key in Customize and run the new command.
- **Printed on one side, though `DOUBLE_SIDED="yes"`:** the printer can't print both sides on its own, or its driver doesn't offer it. `lpoptions -p NAME -l | grep -i -e sides -e duplex` shows what it supports.
- **The page is shrunk or cut off:** the printer's paper size doesn't match the paper's. Set it to the size chosen in Customize, or add `-o media=Letter` (or `A4`) to `LP_OPTIONS`.
- **Mac: the paper was skipped:** the Mac was asleep at the print time (see [step 4](#a-mac-as-the-printer-box)).
- **Pi: ssh times out:** the Pi is still starting, or its Wi-Fi dropped. Wait a minute and try again with `ssh -4`.
- **Pi: "Permission denied":** wrong username or password. If you don't know them, write the card again (step 1).
- **Pi: `lsusb` doesn't show the printer:** on a Pi Zero, use the **USB** port, not PWR, and try another OTG adapter.
