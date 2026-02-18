# bluetooth-nfc — MakeCode Extension untuk micro:bit

Extension gabungan antara **Bluetooth** dan **NFC (PN532 via I2C)** untuk micro:bit di MakeCode.

## Fitur

### 🔵 Bluetooth (`bluetooth`)
- UART Write / Read (string, number, line, value)
- BLE services: accelerometer, button, IO pin, LED, temperature, magnetometer
- Eddystone URL/UID advertising
- Event handlers: on connected / on disconnected
- Transmit power control

### 📡 NFC (`NFC1`)
- **Card present** — cek apakah ada kartu/chip NFC di dekat modul
- **Get NFC card ID** — baca ID kartu sebagai string (format: `"A B C D"`)
- **NFC card ID matches** — validasi ID kartu dengan 4 angka
- **Send NFC card ID via Bluetooth UART** — kirim ID kartu langsung lewat BLE UART

## Hardware yang Didukung

- [DFRobot Gravity I2C & UART NFC Module (DFR0231-H)](https://wiki.dfrobot.com/Gravity:%20I2C%20&%20UART%20NFC%20Module%20SKU:%20DFR0231-H#target_5)
- [Elecfreaks Octopus NFC Module (EF04105)](https://wiki.elecfreaks.com/en/microbit/sensor/octopus-sensors/sensor/octopus_ef04105)

Modul terhubung ke micro:bit melalui **I2C** (pin SDA & SCL), dengan alamat I2C default `0x24` (0x48 >> 1).

## Contoh Penggunaan

```typescript
// Saat tombol A ditekan, kirim ID kartu NFC lewat Bluetooth UART
input.onButtonPressed(Button.A, function () {
    if (NFC1.checkForCard()) {
        bluetooth.uartWriteLine("Kartu terdeteksi: " + NFC1.getCardId());
    } else {
        bluetooth.uartWriteLine("Tidak ada kartu");
    }
});

// Validasi kartu tertentu dan kirim hasilnya via BLE
basic.forever(function () {
    if (NFC1.validateCardId(12, 34, 56, 78)) {
        bluetooth.uartWriteLine("Kartu valid!");
        basic.showIcon(IconNames.Yes);
    }
    basic.pause(500);
});
```

## File Struktur

| File | Keterangan |
|------|------------|
| `bluetooth.ts` | TypeScript: namespace `bluetooth` + namespace `NFC1` (gabungan) |
| `bluetooth.cpp` | C++ implementation BLE services |
| `BLEHF2Service.h` | Header BLE HF2 service |
| `BLEHF2Service.cpp` | Implementasi BLE HF2 service |
| `shims.d.ts` | Type declarations untuk C++ shims |
| `enums.d.ts` | Enum declarations |
| `pxt.json` | Konfigurasi extension MakeCode |

## Lisensi

MIT
