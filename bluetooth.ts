/// <reference no-default-lib="true"/>
/**
 * Support for additional Bluetooth services.
 */
//% color=#007EF4 weight=96 icon="\uf294"
namespace bluetooth {
    export let NEW_LINE = "\r\n";

    /**
     * Internal use
     */
    //% shim=bluetooth::__log
    export function __log(priority: number, msg: string) {
        return;
    }
    console.addListener(function (_pri, msg) { __log(_pri, msg) });

    /**
    *  Writes to the Bluetooth UART service buffer. From there the data is transmitted over Bluetooth to a connected device.
    */
    //% help=bluetooth/uart-write-string weight=80
    //% blockId=bluetooth_uart_write block="bluetooth uart|write string %data" blockGap=8
    //% parts="bluetooth" shim=bluetooth::uartWriteString advanced=true
    export function uartWriteString(data: string): void {
        console.log(data)
    }

    /**
    *  Writes to the Bluetooth UART service buffer. From there the data is transmitted over Bluetooth to a connected device.
    */
    //% help=bluetooth/uart-write-line weight=79
    //% blockId=bluetooth_uart_line block="bluetooth uart|write line %data" blockGap=8
    //% parts="bluetooth" advanced=true
    export function uartWriteLine(data: string): void {
        uartWriteString(data + serial.NEW_LINE);
    }

    /**
     * Prints a numeric value to the serial
     */
    //% help=bluetooth/uart-write-number weight=79
    //% weight=89 blockGap=8 advanced=true
    //% blockId=bluetooth_uart_writenumber block="bluetooth uart|write number %value"
    export function uartWriteNumber(value: number): void {
        uartWriteString(value.toString());
    }

    /**
     * Writes a ``name: value`` pair line to the serial.
     * @param name name of the value stream, eg: x
     * @param value to write
     */
    //% weight=88 weight=78
    //% help=bluetooth/uart-write-value advanced=true
    //% blockId=bluetooth_uart_writevalue block="bluetooth uart|write value %name|= %value"
    export function uartWriteValue(name: string, value: number): void {
        uartWriteString((name ? name + ":" : "") + value + NEW_LINE);
    }

    /**
     *  Reads from the Bluetooth UART service buffer, returning its contents when the specified delimiter character is encountered.
     */
    //% help=bluetooth/uart-read-until weight=75
    //% blockId=bluetooth_uart_read block="bluetooth uart|read until %del=serial_delimiter_conv"
    //% parts="bluetooth" shim=bluetooth::uartReadUntil advanced=true
    export function uartReadUntil(del: string): string {
        // dummy implementation for simulator
        return ""
    }

    /**
    * Advertise an Eddystone UID
    * @param ns 4 last bytes of the namespace uid
    * @param instance 4 last bytes of the instance uid
    * @param power power level between 0 and 7, eg: 7
    * @param connectable true to keep bluetooth connectable for other services, false otherwise.
    */
    //% blockId=eddystone_advertise_uid block="bluetooth advertise UID|namespace (bytes 6-9)%ns|instance (bytes 2-6)%instance|with power %power|connectable %connectable"
    //% parts=bluetooth weight=12 blockGap=8
    //% help=bluetooth/advertise-uid blockExternalInputs=1
    //% hidden=1 deprecated=1
    export function advertiseUid(ns: number, instance: number, power: number, connectable: boolean) {
        const buf = pins.createBuffer(16);
        buf.setNumber(NumberFormat.Int32BE, 6, ns);
        buf.setNumber(NumberFormat.Int32BE, 12, instance);
        bluetooth.advertiseUidBuffer(buf, power, connectable);
    }
}

/**
 * Provides access to limited functionality of a PN532 NFC device via I2C.
 * Compatible with DFRobot Gravity and Elecfreaks Octopus NFC modules.
 */
//% color=#50A820 weight=90 icon="\uf02b" block="NFC"
namespace NFC1 {

    let NFC_I2C_ADDR = (0x48 >> 1);
    let PN532_PREAMBLE = 0x00;
    let PN532_STARTCODE1 = 0x00;
    let PN532_STARTCODE2 = 0xFF;
    let PN532_POSTAMBLE = 0x00;
    let recvBuf = pins.createBuffer(32);
    let recvAck = pins.createBuffer(8);
    let ackBuf = pins.createBuffer(6);
    ackBuf[0] = 0x00;
    ackBuf[1] = 0x00;
    ackBuf[2] = 0xFF;
    ackBuf[3] = 0x00;
    ackBuf[4] = 0xFF;
    ackBuf[5] = 0x00;
    let uId = pins.createBuffer(4);
    let NFC_ENABLED = false;

    function writeAndReadBuffer(buf: Buffer, len: number) {
        pins.i2cWriteBuffer(NFC_I2C_ADDR, buf);
        basic.pause(100);
        recvAck = pins.i2cReadBuffer(NFC_I2C_ADDR, 8);
        basic.pause(100);
        recvBuf = pins.i2cReadBuffer(NFC_I2C_ADDR, len - 4);
    }

    function checkDcs(len: number): boolean {
        let sum = 0, dcs = 0;
        for (let i = 1; i < len - 2; i++) {
            if ((i === 4) || (i === 5)) {
                continue;
            }
            sum += recvBuf[i];
        }
        dcs = 0xFF - (sum & 0xFF);
        if (dcs != recvBuf[len - 2]) {
            return false;
        }
        return true;
    }

    function wakeup() {
        basic.pause(100);
        let buf: number[] = [];
        buf = [PN532_PREAMBLE, PN532_STARTCODE1, PN532_STARTCODE2, 0x05, 0xFB, 0xD4, 0x14, 0x01, 0x14, 0x01, 0x02, PN532_POSTAMBLE];
        let cmdWake = pins.createBufferFromArray(buf);
        writeAndReadBuffer(cmdWake, 14);

        let i = 0;
        for (i = 0; i < ackBuf.length; i++) {
            if (recvAck[1 + i] != ackBuf[i]) {
                break;
            }
        }
        if ((i != ackBuf.length) || (recvBuf[6] != 0xD5) || (recvBuf[7] != 0x15) || (!checkDcs(14 - 4))) {
            NFC_ENABLED = false;
        } else {
            NFC_ENABLED = true;
        }
        basic.pause(100);
    }

    /**
     * Check for an NFC card/chip. Returns true if a card is present.
    */
    //% blockId=checkForCard
    //% block="Card present"
    //% weight=30
    export function checkForCard(): boolean {
        if (!NFC_ENABLED) {
            wakeup();
        }
        let buf: number[] = [];
        buf = [PN532_PREAMBLE, PN532_STARTCODE1, PN532_STARTCODE2, 0x04, 0xFC, 0xD4, 0x4A, 0x01, 0x00, 0xE1, PN532_POSTAMBLE];
        let cmdUid = pins.createBufferFromArray(buf);
        writeAndReadBuffer(cmdUid, 24);

        for (let i = 0; i < 4; i++) {
            if (recvAck[1 + i] != ackBuf[i]) {
                return false;
            }
        }
        if ((recvBuf[6] != 0xD5) || (!checkDcs(24 - 4))) {
            return false;
        }
        for (let i = 0; i < uId.length; i++) {
            uId[i] = recvBuf[14 + i];
        }
        if (uId[0] === uId[1] && uId[1] === uId[2] && uId[2] === uId[3] && uId[3] === 0xFF) {
            return false;
        }
        return true;
    }

    /**
     * Get a card/chip's ID as a string. Returns empty string if no card is found.
    */
    //% blockId=getCardId
    //% block="Get NFC card ID"
    //% weight=20
    export function getCardId(): string {
        if (!NFC_ENABLED) {
            wakeup();
        }
        let buf: number[] = [];
        buf = [PN532_PREAMBLE, PN532_STARTCODE1, PN532_STARTCODE2, 0x04, 0xFC, 0xD4, 0x4A, 0x01, 0x00, 0xE1, PN532_POSTAMBLE];
        let cmdUid = pins.createBufferFromArray(buf);
        writeAndReadBuffer(cmdUid, 24);

        for (let i = 0; i < 4; i++) {
            if (recvAck[1 + i] != ackBuf[i]) {
                return '';
            }
        }
        if ((recvBuf[6] != 0xD5) || (!checkDcs(24 - 4))) {
            return '';
        }
        for (let i = 0; i < uId.length; i++) {
            uId[i] = recvBuf[14 + i];
        }
        if (uId[0] === uId[1] && uId[1] === uId[2] && uId[2] === uId[3] && uId[3] === 0xFF) {
            return '';
        }
        let uIdString = '';
        for (let i = 0; i < uId.length; i++) {
            uIdString += uId[i];
            if (i < uId.length - 1) {
                uIdString += ' ';
            }
        }
        return uIdString;
    }

    /**
     * Check whether the detected NFC card has a matching ID.
     * @param firstNum first byte of the card ID
     * @param secondNum second byte of the card ID
     * @param thirdNum third byte of the card ID
     * @param fourthNum fourth byte of the card ID
    */
    //% blockId=validateCardId
    //% block="NFC card ID matches $firstNum $secondNum $thirdNum $fourthNum"
    //% weight=10
    //% inlineInputMode=inline
    export function validateCardId(firstNum: number, secondNum: number, thirdNum: number, fourthNum: number): boolean {
        if (!NFC_ENABLED) {
            wakeup();
        }
        let buf: number[] = [];
        buf = [PN532_PREAMBLE, PN532_STARTCODE1, PN532_STARTCODE2, 0x04, 0xFC, 0xD4, 0x4A, 0x01, 0x00, 0xE1, PN532_POSTAMBLE];
        let cmdUid = pins.createBufferFromArray(buf);
        writeAndReadBuffer(cmdUid, 24);

        for (let i = 0; i < 4; i++) {
            if (recvAck[1 + i] != ackBuf[i]) {
                return false;
            }
        }
        if ((recvBuf[6] != 0xD5) || (!checkDcs(24 - 4))) {
            return false;
        }
        for (let i = 0; i < uId.length; i++) {
            uId[i] = recvBuf[14 + i];
        }
        if (uId[0] === uId[1] && uId[1] === uId[2] && uId[2] === uId[3] && uId[3] === 0xFF) {
            return false;
        }
        if (uId[0] == firstNum && uId[1] == secondNum && uId[2] == thirdNum && uId[3] == fourthNum) {
            return true;
        }
        return false;
    }

    /**
     * Send NFC card ID over Bluetooth UART.
     * Reads the card ID and transmits it via Bluetooth if a card is present.
    */
    //% blockId=sendCardIdBluetooth
    //% block="Send NFC card ID via Bluetooth UART"
    //% weight=40
    export function sendCardIdViaBluetooth(): void {
        let id = getCardId();
        if (id) {
            bluetooth.uartWriteLine("NFC:" + id);
        }
    }
}
