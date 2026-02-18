// ============================================================
// Test / Contoh Penggunaan: Bluetooth + NFC Extension
// ============================================================

// --- Contoh 1: Kirim ID kartu NFC via Bluetooth UART saat tombol A ditekan ---
input.onButtonPressed(Button.A, function () {
    if (NFC1.checkForCard()) {
        let id = NFC1.getCardId();
        bluetooth.uartWriteLine("Kartu terdeteksi: " + id);
        basic.showString(id);
    } else {
        bluetooth.uartWriteLine("Tidak ada kartu NFC");
        basic.showIcon(IconNames.No);
    }
});

// --- Contoh 2: Gunakan blok bawaan untuk kirim NFC via BLE ---
input.onButtonPressed(Button.B, function () {
    NFC1.sendCardIdViaBluetooth();
});

// --- Contoh 3: Validasi kartu tertentu ---
basic.forever(function () {
    if (NFC1.validateCardId(12, 34, 56, 78)) {
        bluetooth.uartWriteLine("Kartu VALID!");
        basic.showIcon(IconNames.Yes);
        basic.pause(2000);
        basic.clearScreen();
    }
    basic.pause(300);
});

// --- Contoh 4: Event Bluetooth connected/disconnected ---
bluetooth.onBluetoothConnected(function () {
    basic.showIcon(IconNames.Happy);
    bluetooth.uartWriteLine("Bluetooth terhubung!");
});

bluetooth.onBluetoothDisconnected(function () {
    basic.showIcon(IconNames.Sad);
});
