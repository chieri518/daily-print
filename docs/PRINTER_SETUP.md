# Printer box setup

How to set up a **Raspberry Pi Zero W** to print Daily Print on an **HP LaserJet Pro P1102w** over USB.

**Status:** works. Tested on 2026-10-23: the Pi printed a full edition. For now you send the PDF to the Pi by hand; printing every morning on its own comes later (see [TODO.md](TODO.md)).

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

## If something goes wrong

- **ssh times out:** the Pi is still starting, or its Wi-Fi dropped. Wait a minute and try again with `ssh -4`.
- **"Permission denied":** wrong username or password. If you don't know them, write the card again (step 1).
- **`lsusb` doesn't show the printer:** use the **USB** port, not PWR, and try another OTG adapter.
- **Nothing prints:** read the print log with `sudo tail -30 /var/log/cups/error_log`.
