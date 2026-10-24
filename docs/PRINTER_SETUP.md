# Printer box setup

How to set up a **Raspberry Pi Zero W** to print Daily Print on an **HP LaserJet Pro P1102w** over USB.

**Status:** printing works (tested 2026-10-23). Steps 1–5 set up the printer; step 6 connects the box to your account, so it prints your paper every morning on its own.

## What you need

- Raspberry Pi Zero W and its power supply (5 V, micro-USB)
- A microSD card, 8 GB or larger
- A **micro-USB OTG adapter** that carries data (some cheap ones only charge)
- A USB printer cable (USB-A to USB-B)
- Your Wi-Fi name and password. The Pi Zero W only uses **2.4 GHz** Wi-Fi

## 1. Put the operating system on the SD card

1. Install and open **Raspberry Pi Imager** (raspberrypi.com/software).
2. Choose:
   - Device: **Raspberry Pi Zero**
   - Operating system: **Raspberry Pi OS (other) → Raspberry Pi OS Lite (32-bit)**
   - Storage: your SD card
3. Click **Edit settings** and set:
   - Hostname: `dailyprint`
   - **Username and password.** There is no default `pi` user, so remember these
   - Wi-Fi: network name, password and country
   - Services tab: turn on **SSH** with password login
4. When asked "apply OS customisation settings?", click **Yes**. Then write the card.

## 2. Connect to the Pi

1. Put the card in the Pi and plug power into the port labeled **PWR**. Wait about 10 minutes: the first start is slow and restarts once.
2. On your computer, connect (replace `you` with your username):
   ```
   ssh -4 you@dailyprint.local
   ```
   `-4` matters: without it, the Mac may try IPv6 and time out.
3. If `dailyprint.local` isn't found, get the Pi's address with `ping -c 3 dailyprint.local` (or your router's device list) and use `ssh you@<address>`.
4. Once you're in, stop the Wi-Fi from dropping the connection:
   ```
   sudo iw wlan0 set power_save off
   ```

## 3. Install the printing software

```
sudo apt update && sudo apt full-upgrade -y
sudo apt install -y cups printer-driver-foo2zjs
sudo usermod -aG lpadmin $USER
sudo reboot
```

The upgrade takes 30 minutes or more. After the reboot, wait 3 minutes and connect again.

`printer-driver-foo2zjs` is the open-source driver for the P1102w. HP's own driver needs a plugin that doesn't run on the Pi Zero.

## 4. Add the printer

1. Turn the printer on. Plug the OTG adapter into the Pi's port labeled **USB** (not PWR), then the printer cable.
2. Check that the Pi sees it: `lsusb` should list **Hewlett-Packard** and **P1102w**.
3. Find the printer's address and driver:
   ```
   sudo lpinfo -v | grep -i usb
   lpinfo -m | grep -i p1102
   ```
   Copy the `usb://...` address, and the name of the **P1102w** driver that mentions foo2zjs or foo2xqx (the part before the first space).
4. Add the printer with those two values:
   ```
   sudo lpadmin -p P1102w -E -v 'USB-ADDRESS' -m 'DRIVER-NAME' -o PageSize=Letter
   sudo lpoptions -d P1102w
   lpstat -p
   ```
   The last command should say `printer P1102w is idle`.

## 5. Print an edition

1. On your **computer**, in the daily-print folder, copy a PDF to the Pi:
   ```
   scp editions/2026-10-23.pdf you@dailyprint.local:~
   ```
2. On the **Pi**:
   ```
   lp ~/2026-10-23.pdf
   ```
3. `lpstat -o` lists the job until the printer has it all. A 4-page edition prints on 4 sheets, since the P1102w only prints one side at a time.

## 6. Print every morning

1. In the web app, open **Customize → Paper & style → Printing**. Set a **print time** and **Save**.
2. Click **Set up a printer box**. It shows a command with your new printer key. The key is shown only once.
3. On the Pi, run that command. It saves the app's address and the key in `/etc/daily-print.conf`, and checks for a paper every 2 minutes.
4. The Customize page shows when the box last checked in. To see what it did, run `tail /var/log/daily-print.log` on the Pi.

**Testing with the app running on your Mac** (`npm run dev`): the command says `localhost`, which on the Pi means the Pi itself. Replace both `http://localhost:3000` with your Mac's address, from `ipconfig getifaddr en0` on the Mac, for example `http://10.0.0.8:3000`. Your Mac must stay awake.

## If something goes wrong

- **ssh times out:** the Pi is still starting, or its Wi-Fi dropped. Wait a minute and try again with `ssh -4`.
- **"Permission denied":** wrong username or password. If you don't know them, write the card again (step 1).
- **`lsusb` doesn't show the printer:** use the **USB** port, not PWR, and try another OTG adapter.
- **Nothing prints:** read the print log with `sudo tail -30 /var/log/cups/error_log`, and the box's own log with `tail /var/log/daily-print.log`.
- **"error: 401" in the log:** the app doesn't recognize the key: it was replaced or mistyped. Make a new key in Customize and run the new command.
