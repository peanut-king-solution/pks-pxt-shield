//% weight=60
//% color=#1c4980 
//% icon="\uf2db" 
//% block="PKS drivers"
namespace pksdriver {
    const PCA9685_ADDRESS = 0x40
    const MODE = 0x00
    const PRESCALE = 0xFE
    const LED0_ON_L = 0x06

    /**
     * The user can select the 8 steering gear controller.
     */
    export enum Servos {
        S1 = 0x08,
        S2 = 0x07,
        S3 = 0x06,
        S4 = 0x05,
        S5 = 0x04,
        S6 = 0x03,
        S7 = 0x02,
        S8 = 0x01
    }

    /**
     * The user selects the 4-way dc motor.
     */
    export enum Motors {
        M1 = 0x1,
        M2 = 0x2,
        M3 = 0x3,
        M4 = 0x4
    }

    /**
     * the motor rotation direction
     */
    export enum Dir {
        //% blockId="CW" block="CW"
        CW = 1,
        //% blockId="CCW" block="CCW"
        CCW = -1,
    }

    let initialized = false

    function initPCA9685(): void {
        i2cWrite(PCA9685_ADDRESS, MODE, 0x00)
        setFreq(50);
        initialized = true
    }

    function i2cRead(addr: number, reg: number) {
        pins.i2cWriteNumber(addr, reg, NumberFormat.UInt8BE);
        let val = pins.i2cReadNumber(addr, NumberFormat.UInt8BE);
        return val;
    }

    function i2cWrite(addr: number, reg: number, value: number) {
        let buf = pins.createBuffer(2)
        buf[0] = reg
        buf[1] = value
        pins.i2cWriteBuffer(addr, buf)
    }

    function setFreq(freq: number): void {
        // Constrain the frequency
        let prescaleval = 25000000;
        prescaleval /= 4096;
        prescaleval /= freq;
        prescaleval -= 1;
        let prescale = prescaleval;//Math.floor(prescaleval + 0.5);
        let oldmode = i2cRead(PCA9685_ADDRESS, MODE);
        let newmode = (oldmode & 0x7F) | 0x10; // sleep
        i2cWrite(PCA9685_ADDRESS, MODE, newmode); // go to sleep
        i2cWrite(PCA9685_ADDRESS, PRESCALE, prescale); // set the prescaler
        i2cWrite(PCA9685_ADDRESS, MODE, oldmode);
        control.waitMicros(5000);
        i2cWrite(PCA9685_ADDRESS, MODE, oldmode | 0xa1);
    }

    function setPwm(channel: number, on: number, off: number): void {
        if (channel < 0 || channel > 15)
            return;

        let buf = pins.createBuffer(5);
        buf[0] = LED0_ON_L + 4 * channel;
        buf[1] = on & 0xff;
        buf[2] = (on >> 8) & 0xff;
        buf[3] = off & 0xff;
        buf[4] = (off >> 8) & 0xff;
        pins.i2cWriteBuffer(PCA9685_ADDRESS, buf);
    }

    /**
     * Steering gear control function.
     * S1~S8.
     * 0°~180°.
    */
    //% blockId=motor_servo block="servo|%index|degree|%degree" subcategory="Robot"
    //% weight=100
    //% degree.min=0 degree.max=180
    //% index.fieldEditor="gridpicker" index.fieldOptions.columns=4
    export function servo(index: Servos, degree: number): void {
        if (!initialized) {
            initPCA9685()
        }
        // 50hz
        let v_us = (degree * 1800 / 180 + 600) // 0.6ms ~ 2.4ms
        let value = v_us * 4096 / 20000
        setPwm(index + 7, 0, value)
    }

    /**
     * set servo off
    */
    //% blockId=motor_servoOff block="servo off|%index" subcategory="Robot"
    //% weight=99
    //% index.fieldEditor="gridpicker" index.fieldOptions.columns=4
    export function servoOff(index: Servos): void {
        if (!initialized) {
            initPCA9685()
        }
        setPwm(index + 7, 0, 0)
    }

    /**
     * set servo on
    */
    //% blockId=motor_servoOn block="servo on|%index" subcategory="Robot"
    //% weight=98
    //% index.fieldEditor="gridpicker" index.fieldOptions.columns=4
    export function servoOn(index: Servos): void {
        if (!initialized) {
            initPCA9685()
        }
        setPwm(index + 7, 0, 150)
    }

    /**
     * Execute a motor
     * M1~M4.
     * speed(0~255).
    */
    //% weight=130
    //% blockId=motor_MotorRun block="motor|%index|dir|%Dir|speed|%speed" subcategory="Robot"
    //% speed.min=0 speed.max=255
    //% index.fieldEditor="gridpicker" index.fieldOptions.columns=2
    //% direction.fieldEditor="gridpicker" direction.fieldOptions.columns=2
    export function MotorRun(index: Motors, direction: Dir, speed: number): void {
        if (!initialized) {
            initPCA9685()
        }
        speed = speed * 16 * direction; // map 255 to 4096
        if (speed >= 4096) {
            speed = 4095
        }
        if (speed <= -4096) {
            speed = -4095
        }
        if (index > 4 || index <= 0)
            return
        let pn = (4 - index) * 2
        let pp = (4 - index) * 2 + 1
        if (speed >= 0) {
            setPwm(pp, 0, speed)
            setPwm(pn, 0, 0)
        } else {
            setPwm(pp, 0, 0)
            setPwm(pn, 0, -speed)
        }
    }

    /**
     * Stop the dc motor.
    */
    //% weight=129
    //% blockId=motor_motorStop block="motor stop|%index" subcategory="Robot"
    //% index.fieldEditor="gridpicker" index.fieldOptions.columns=2
    export function motorStop(index: Motors) {
        setPwm((4 - index) * 2, 0, 0);
        setPwm((4 - index) * 2 + 1, 0, 0);
    }

    /**
     * Stop all motors
    */
    //% weight=128
    //% blockId=motor_motorStopAll block="motor stop all" subcategory="Robot"
    export function motorStopAll(): void {
        for (let idx = 1; idx <= 4; idx++) {
            motorStop(idx);
        }
    }

    //% weight=90
    //% blockId=light_lighton block="light on|%index" subcategory="Robot"
    export function LightOn(index: Motors): void {
        if (!initialized) {
            initPCA9685()
        }
        let speed = 255
        speed = speed * 16 * 1; // map 255 to 4096
        if (speed >= 4096) {
            speed = 4095
        }
        if (speed <= -4096) {
            speed = -4095
        }
        if (index > 4 || index <= 0)
            return
        let pn = (4 - index) * 2
        let pp = (4 - index) * 2 + 1
        if (speed >= 0) {
            setPwm(pp, 0, speed)
            setPwm(pn, 0, 0)
        } else {
            setPwm(pp, 0, 0)
            setPwm(pn, 0, -speed)
        }
    }

    //% weight=90
    //% blockId=light_lightoff block="light off|%index" subcategory="Robot"
    export function LightOff(index: Motors) {
        setPwm((4 - index) * 2, 0, 0);
        setPwm((4 - index) * 2 + 1, 0, 0);
    }

    export enum compoundEyeData {
        //% block="eye_1"
        ir_1,
        //% block="eye_2"
        ir_2,
        //% block="eye_3"
        ir_3,
        //% block="eye_4"
        ir_4,
        //% block="eye_5"
        ir_5,
        //% block="eye_6"
        ir_6,
        //% block="eye_7"
        ir_7,
        //% block="eye_8"
        ir_8,
        //% block="eye_9"
        ir_9,
        //% block="eye_10"
        ir_10,
        //% block="eye_11"
        ir_11,
        //% block="eye_12"
        ir_12,
        //% block="max_eye_value"
        //% weight=99
        max_eye_value,
        //% block="max_eye"
        //% weight=100
        max_eye,
        //% block="angle"
        //% weight=98
        angle,
        //% block="mode"
        mode,
    }

    /**
    * compoundEye read function
    */
    //% blockId=compoundEye block="compound eye $compound_eye_data"  subcategory="Robot"
    //% weight=50
    export function compoundEyeRead(compound_eye_data: compoundEyeData): number {
        pins.i2cWriteNumber(
            0x13,
            compound_eye_data,
            NumberFormat.UInt8LE,
            false
        )
        let temp = pins.i2cReadNumber(0x13, NumberFormat.UInt8LE, false);
        if (temp == 255) {
            return -1;
        } else if (compound_eye_data == compoundEyeData.angle) {
            temp *= 2;
        } else if (compound_eye_data == compoundEyeData.max_eye) {
            temp += 1;
        }
        return temp;
    }

}

enum DHTtype {
    DHT11,
    DHT22,
}

enum dataType {
    humidity,
    temperature,
}

enum tempType {
    celsius,
    fahrenheit,
}

//% weight=60
//% color=#1c4980 
//% icon="\uf2db" 
//% block="PKS drivers"
namespace pksdriver {

    let _temperature: number = -999.0
    let _humidity: number = -999.0
    let _temptype: tempType = tempType.celsius
    let _readSuccessful: boolean = false
    let _sensorresponding: boolean = false

    /**
    * Query data from DHT11/DHT22 sensor. It is also recommended to wait 1 (DHT11) or 2 (DHT22) seconds between each query.
    */
    //% block="query $DHT|data pin $dataPin|pin pull up $pullUp|serial output $serialOutput|wait 2 sec after query $wait"
    //% pullUp.defl=true
    //% serialOutput.defl=false
    //% wait.defl=true
    //% blockExternalInputs=true
    //% weight=100
    //% subcategory="Hydroponic"
    export function queryData(DHT: DHTtype, dataPin: DigitalPin, pullUp: boolean, serialOtput: boolean) {

        //initialize
        let startTime: number = 0
        let endTime: number = 0
        let checksum: number = 0
        let checksumTmp: number = 0
        let dataArray: boolean[] = []
        let resultArray: number[] = []
        let DHTstr: string = (DHT == DHTtype.DHT11) ? "DHT11" : "DHT22"

        for (let index = 0; index < 40; index++) dataArray.push(false)
        for (let index = 0; index < 5; index++) resultArray.push(0)

        _readSuccessful = false
        _sensorresponding = false
        startTime = input.runningTimeMicros()

        //request data
        pins.digitalWritePin(dataPin, 0) //begin protocol, pull down pin
        basic.pause(18)

        if (pullUp) pins.setPull(dataPin, PinPullMode.PullUp) //pull up data pin if needed
        pins.digitalReadPin(dataPin) //pull up pin
        control.waitMicros(40)

        if (pins.digitalReadPin(dataPin) == 1) {
            if (serialOtput) {
                serial.writeLine(DHTstr + " not responding!")
                serial.writeLine("----------------------------------------")
            }

        } else {

            _sensorresponding = true

            while (pins.digitalReadPin(dataPin) == 0); //sensor response
            while (pins.digitalReadPin(dataPin) == 1); //sensor response

            //read data (5 bytes)
            for (let index = 0; index < 40; index++) {
                while (pins.digitalReadPin(dataPin) == 1);
                while (pins.digitalReadPin(dataPin) == 0);
                control.waitMicros(28)
                //if sensor still pull up data pin after 28 us it means 1, otherwise 0
                if (pins.digitalReadPin(dataPin) == 1) dataArray[index] = true
            }

            endTime = input.runningTimeMicros()

            //convert byte number array to integer
            for (let index = 0; index < 5; index++)
                for (let index2 = 0; index2 < 8; index2++)
                    if (dataArray[8 * index + index2]) resultArray[index] += 2 ** (7 - index2)

            //verify checksum
            checksumTmp = resultArray[0] + resultArray[1] + resultArray[2] + resultArray[3]
            checksum = resultArray[4]
            if (checksumTmp >= 512) checksumTmp -= 512
            if (checksumTmp >= 256) checksumTmp -= 256
            if (checksum == checksumTmp) _readSuccessful = true

            //read data if checksum ok, output new readings, do nothing otherwise
            if (_readSuccessful) {
                if (DHT == DHTtype.DHT11) {
                    //DHT11
                    _humidity = resultArray[0] + resultArray[1] / 100
                    _temperature = resultArray[2] + resultArray[3] / 100
                } else {
                    //DHT22
                    let temp_sign: number = 1
                    if (resultArray[2] >= 128) {
                        resultArray[2] -= 128
                        temp_sign = -1
                    }
                    _humidity = (resultArray[0] * 256 + resultArray[1]) / 10
                    _temperature = (resultArray[2] * 256 + resultArray[3]) / 10 * temp_sign
                }
                if (_temptype == tempType.fahrenheit)
                    _temperature = _temperature * 9 / 5 + 32
            }

            //serial output
            if (serialOtput) {
                serial.writeLine(DHTstr + " query completed in " + (endTime - startTime) + " microseconds")
                if (_readSuccessful) {
                    serial.writeLine("Checksum ok")
                    serial.writeLine("Humidity: " + _humidity)
                    serial.writeLine("Temperature: " + _temperature + (_temptype == tempType.celsius ? " *C" : " *F"))
                } else {
                    serial.writeLine("Checksum error, showing old values")
                    serial.writeLine("Humidity: " + _humidity)
                    serial.writeLine("Temperature: " + _temperature + (_temptype == tempType.celsius ? " *C" : " *F"))
                }
                serial.writeLine("----------------------------------------")
            }

        }

    }

    /**
    * Read humidity/temperature data from lastest query of DHT11/DHT22
    */
    //% weight=99
    //% block="read $data" subcategory="Hydroponic"
    export function readData(data: dataType): number {
        return data == dataType.humidity ? _humidity : _temperature
    }

    /**
    * Select temperature type (Celsius/Fahrenheit)"
    */
    //% block="temperature type: $temp" subcategory="Hydroponic"
    //% weight=98
    export function selectTempType(temp: tempType) {
        _temptype = temp
    }

    /**
    * Determind if last query is successful (checksum ok)
    */
    //% block="last query successful?" subcategory="Hydroponic"
    //% weight=97
    export function readDataSuccessful(): boolean {
        return _readSuccessful
    }

    /**
    * Determind if sensor responded successfully (not disconnected, etc) in last query
    */
    //% block="last query sensor responding?" subcategory="Hydroponic"
    //% weight=96
    export function sensorrResponding(): boolean {
        return _sensorresponding
    }

}

//% weight=60
//% color=#1c4980 
//% icon="\uf2db" 
//% block="PKS drivers"
namespace pksdriver {
    let DS1302_REG_SECOND = 0x80
    let DS1302_REG_MINUTE = 0x82
    let DS1302_REG_HOUR = 0x84
    let DS1302_REG_DAY = 0x86
    let DS1302_REG_MONTH = 0x88
    let DS1302_REG_WEEKDAY = 0x8A
    let DS1302_REG_YEAR = 0x8C
    let DS1302_REG_WP = 0x8E
    let DS1302_REG_RAM = 0xC0

    /**
     * convert a Hex data to Dec
     */
    function HexToDec(dat: number): number {
        return (dat >> 4) * 10 + (dat % 16);
    }

    /**
     * convert a Dec data to Hex
     */
    function DecToHex(dat: number): number {
        return Math.idiv(dat, 10) * 16 + (dat % 10)
    }

    /**
     * DS1302 RTC class
     */
    export class DS1302RTC {
        clk: DigitalPin;
        dio: DigitalPin;
        cs: DigitalPin;

        /**
         * write a byte to DS1302
         */
        write_byte(dat: number) {
            for (let i = 0; i < 8; i++) {
                pins.digitalWritePin(this.dio, (dat >> i) & 1);
                pins.digitalWritePin(this.clk, 1);
                pins.digitalWritePin(this.clk, 0);
            }
        }

        /**
         * read a byte from DS1302
         */
        read_byte(): number {
            let d = 0;
            for (let i = 0; i < 8; i++) {
                d = d | (pins.digitalReadPin(this.dio) << i);
                pins.digitalWritePin(this.clk, 1);
                pins.digitalWritePin(this.clk, 0);
            }
            return d;
        }

        /**
         * read reg
         */
        getReg(reg: number): number {
            let t = 0;
            pins.digitalWritePin(this.cs, 1);
            this.write_byte(reg);
            t = this.read_byte();
            pins.digitalWritePin(this.cs, 0);
            return t;
        }

        /**
         * write reg
         */
        setReg(reg: number, dat: number) {
            pins.digitalWritePin(this.cs, 1);
            this.write_byte(reg);
            this.write_byte(dat);
            pins.digitalWritePin(this.cs, 0);
        }

        /**
         * write reg with WP protect
         */
        wr(reg: number, dat: number) {
            this.setReg(DS1302_REG_WP, 0)
            this.setReg(reg, dat)
            this.setReg(DS1302_REG_WP, 0)
        }

        /**
         * get Year
         */
        //% blockId="DS1302_get_year" block="%ds|get year" subcategory="Hydroponic"
        //% weight=80 blockGap=8
        //% parts="DS1302"
        getYear(): number {
            return Math.min(HexToDec(this.getReg(DS1302_REG_YEAR + 1)), 99) + 2000
        }

        /**
         * set year
         * @param dat is the Year will be set, eg: 2018
         */
        //% blockId="DS1302_set_year" block="%ds|set year %dat" subcategory="Hydroponic"
        //% weight=81 blockGap=8
        //% parts="DS1302"
        setYear(dat: number): void {
            this.wr(DS1302_REG_YEAR, DecToHex(dat % 100))
        }

        /**
         * get Month
         */
        //% blockId="DS1302_get_month" block="%ds|get month" subcategory="Hydroponic"
        //% weight=78 blockGap=8
        //% parts="DS1302"
        getMonth(): number {
            return Math.max(Math.min(HexToDec(this.getReg(DS1302_REG_MONTH + 1)), 12), 1)
        }

        /**
         * set month
         * @param dat is Month will be set.  eg: 2
         */
        //% blockId="DS1302_set_month" block="%ds|set month %dat" subcategory="Hydroponic"
        //% weight=79 blockGap=8
        //% parts="DS1302"
        //% dat.min=1 dat.max=12
        setMonth(dat: number): void {
            this.wr(DS1302_REG_MONTH, DecToHex(dat % 13))
        }

        /**
         * get Day
         */
        //% blockId="DS1302_get_day" block="%ds|get day" subcategory="Hydroponic"
        //% weight=76 blockGap=8
        //% parts="DS1302"
        getDay(): number {
            return Math.max(Math.min(HexToDec(this.getReg(DS1302_REG_DAY + 1)), 31), 1)
        }

        /**
         * set day
         * @param dat is the Day will be set, eg: 15
         */
        //% blockId="DS1302_set_day" block="%ds|set day %dat" subcategory="Hydroponic"
        //% weight=77 blockGap=8
        //% parts="DS1302"
        //% dat.min=1 dat.max=31
        setDay(dat: number): void {
            this.wr(DS1302_REG_DAY, DecToHex(dat % 32))
        }

        /**
         * get Week Day
         */
        //% blockId="DS1302_get_weekday" block="%ds|get weekday" subcategory="Hydroponic"
        //% weight=74 blockGap=8
        //% parts="DS1302"
        getWeekday(): number {
            return Math.max(Math.min(HexToDec(this.getReg(DS1302_REG_WEEKDAY + 1)), 7), 1)
        }

        /**
         * set weekday
         * @param dat is the Week Day will be set, eg: 4
         */
        //% blockId="DS1302_set_weekday" block="%ds|set weekday %dat" subcategory="Hydroponic"
        //% weight=75 blockGap=8
        //% parts="DS1302"
        //% dat.min=1 dat.max=7
        setWeekday(dat: number): void {
            this.wr(DS1302_REG_WEEKDAY, DecToHex(dat % 8))
        }

        /**
         * get Hour
         */
        //% blockId="DS1302_get_hour" block="%ds|get hour" subcategory="Hydroponic"
        //% weight=72 blockGap=8
        //% parts="DS1302"
        getHour(): number {
            return Math.min(HexToDec(this.getReg(DS1302_REG_HOUR + 1)), 23)
        }

        /**
         * set hour
         * @param dat is the Hour will be set, eg: 0
         */
        //% blockId="DS1302_set_hour" block="%ds|set hour %dat" subcategory="Hydroponic"
        //% weight=73 blockGap=8
        //% parts="DS1302"
        //% dat.min=0 dat.max=23
        setHour(dat: number): void {
            this.wr(DS1302_REG_HOUR, DecToHex(dat % 24))
        }

        /**
         * get Minute
         */
        //% blockId="DS1302_get_minute" block="%ds|get minute" subcategory="Hydroponic"
        //% weight=70 blockGap=8
        //% parts="DS1302"
        getMinute(): number {
            return Math.min(HexToDec(this.getReg(DS1302_REG_MINUTE + 1)), 59)
        }

        /**
         * set minute
         * @param dat is the Minute will be set, eg: 0
         */
        //% blockId="DS1302_set_minute" block="%ds|set minute %dat" subcategory="Hydroponic"
        //% weight=71 blockGap=8
        //% parts="DS1302"
        //% dat.min=0 dat.max=59
        setMinute(dat: number): void {
            this.wr(DS1302_REG_MINUTE, DecToHex(dat % 60))
        }

        /**
         * get Second
         */
        //% blockId="DS1302_get_second" block="%ds|get second" subcategory="Hydroponic"
        //% weight=67 blockGap=8
        //% parts="DS1302"
        getSecond(): number {
            return Math.min(HexToDec(this.getReg(DS1302_REG_SECOND + 1)), 59)
        }

        /**
         * set second
         * @param dat is the Second will be set, eg: 0
         */
        //% blockId="DS1302_set_second" block="%ds|set second %dat" subcategory="Hydroponic"
        //% weight=68 blockGap=8
        //% parts="DS1302"
        //% dat.min=0 dat.max=59
        setSecond(dat: number): void {
            this.wr(DS1302_REG_SECOND, DecToHex(dat % 60))
        }

        /**
         * set Date and Time
         * @param year is the Year will be set, eg: 2018
         * @param month is the Month will be set, eg: 2
         * @param day is the Day will be set, eg: 15
         * @param weekday is the Weekday will be set, eg: 4
         * @param hour is the Hour will be set, eg: 0
         * @param minute is the Minute will be set, eg: 0
         * @param second is the Second will be set, eg: 0
         */
        //% blockId="DS1302_set_DateTime" block="%ds|set date and time: year %year|month %month|day %day|weekday %weekday|hour %hour|minute %minute|second %second" subcategory="Hydroponic"
        //% weight=50 blockGap=8
        //% parts="DS1302"
        //% year.min=2000 year.max=2100
        //% month.min=1 month.max=12
        //% day.min=1 day.max=31
        //% weekday.min=1 weekday.max=7
        //% hour.min=0 hour.max=23
        //% minute.min=0 minute.max=59
        //% second.min=0 second.max=59
        DateTime(year: number, month: number, day: number, weekday: number, hour: number, minute: number, second: number): void {
            this.setYear(year);
            this.setMonth(month);
            this.setDay(day);
            this.setWeekday(weekday);
            this.setHour(hour);
            this.setMinute(minute);
            this.setSecond(second);
        }

        /**
         * start ds1302 RTC (go on)
         */
        //% blockId="DS1302_start" block="%ds|start RTC" subcategory="Hydroponic"
        //% weight=41 blockGap=8
        //% parts="DS1302"
        start() {
            let t = this.getSecond()
            this.setSecond(t & 0x7f)
        }

        /**
         * pause ds1302 RTC
         */
        //% blockId="DS1302_pause" block="%ds|pause RTC" subcategory="Hydroponic"
        //% weight=40 blockGap=8
        //% parts="DS1302"
        pause() {
            let t = this.getSecond()
            this.setSecond(t | 0x80)
        }

        /**
         * read RAM
         */
        //% blockId="DS1302_read_ram" block="%ds|read ram %reg" subcategory="Hydroponic"
        //% weight=43 blockGap=8
        //% parts="DS1302"
        //% reg.min=0 reg.max=30
        readRam(reg: number): number {
            return this.getReg(DS1302_REG_RAM + 1 + (reg % 31) * 2)
        }

        /**
         * write RAM
         */
        //% blockId="DS1302_write_ram" block="%ds|write ram %reg|with %dat" subcategory="Hydroponic"
        //% weight=42 blockGap=8
        //% parts="DS1302"
        //% reg.min=0 reg.max=30
        writeRam(reg: number, dat: number) {
            this.wr(DS1302_REG_RAM + (reg % 31) * 2, dat)
        }
    }

    /**
     * create a DS1302 object.
     * @param clk the CLK pin for DS1302, eg: DigitalPin.P13
     * @param dio the DIO pin for DS1302, eg: DigitalPin.P14
     * @param cs the CS pin for DS1302, eg: DigitalPin.P15
     */
    //% weight=95 blockGap=8
    //% blockId="DS1302_create" block="CLK %clk|DIO %dio|CS %cs" subcategory="Hydroponic"
    export function create(clk: DigitalPin, dio: DigitalPin, cs: DigitalPin): DS1302RTC {
        let ds = new DS1302RTC();
        ds.clk = clk;
        ds.dio = dio;
        ds.cs = cs;
        pins.digitalWritePin(ds.clk, 0);
        pins.digitalWritePin(ds.cs, 0);
        return ds;
    }
}

enum axisXYZ {
    //% block="X"
    x,
    //% block="Y"
    y,
    //% block="Z"
    z
}

enum accelSen {
    // accelerometer sensitivity

    //% block="2g"
    range_2_g,
    //% block="4g"
    range_4_g,
    //% block="8g"
    range_8_g,
    //% block="16g"
    range_16_g
}

enum gyroSen {
    // gyroscope sensitivite

    //% block="250dps"
    range_250_dps,
    //% block="500dps"
    range_500_dps,
    //% block="1000dps"
    range_1000_dps,
    //% block="2000dps"
    range_2000_dps
}

//% weight=60
//% color=#1c4980 
//% icon="\uf2db" 
//% block="PKS drivers"
namespace pksdriver {
    let i2cAddress = 0x68;
    let power_mgmt = 0x6b;
    // Accelleration addresses
    let xAccelAddr = 0x3b;
    let yAccelAddr = 0x3d;
    let zAccelAddr = 0x3f;
    // Gyroscope addresses
    let xGyroAddr = 0x43;
    let yGyroAddr = 0x45;
    let zGyroAddr = 0x47;
    // Temperature address
    let tempAddr = 0x41;

    // Initialize acceleration and gyroscope values
    let xAccel = 0;
    let yAccel = 0;
    let zAccel = 0;
    let xGyro = 0;
    let yGyro = 0;
    let zGyro = 0;

    function i2cRead(reg: number): number {
        pins.i2cWriteNumber(i2cAddress, reg, NumberFormat.UInt8BE);
        return pins.i2cReadNumber(i2cAddress, NumberFormat.UInt8BE);;
    }

    function readData(reg: number) {
        let h = i2cRead(reg);
        let l = i2cRead(reg + 1);
        let value = (h << 8) + l;

        if (value >= 0x8000) {
            return -((65535 - value) + 1);
        }
        else {
            return value;
        }
    }

    function dist(a: number, b: number): number {
        return Math.sqrt((a * a) + (b * b));
    }

    // Update acceleration data via I2C
    function updateAcceleration(sensitivity: number) {
        // Set sensitivity of acceleration range, according to selection and datasheet value
        let accelRange = 0;
        if (sensitivity == accelSen.range_2_g) {
            // +- 2g
            accelRange = 16384;
        }
        else if (sensitivity == accelSen.range_4_g) {
            // +- 4g
            accelRange = 8192;
        }
        else if (sensitivity == accelSen.range_8_g) {
            // +- 8g
            accelRange = 4096;
        }
        else if (sensitivity == accelSen.range_16_g) {
            // +- 16g
            accelRange = 2048;
        }
        xAccel = readData(xAccelAddr) / accelRange;
        yAccel = readData(yAccelAddr) / accelRange;
        zAccel = readData(zAccelAddr) / accelRange;
    }

    // Update gyroscope data via I2C
    function updateGyroscope(sensitivity: gyroSen) {
        // Set sensitivity of gyroscope range, according to selection and datasheet value
        let gyroRange = 0;
        if (sensitivity == gyroSen.range_250_dps) {
            // +- 250dps
            gyroRange = 131;
        }
        else if (sensitivity == gyroSen.range_500_dps) {
            // +- 500dps
            gyroRange = 65.5;
        }
        else if (sensitivity == gyroSen.range_1000_dps) {
            // +- 1000dps
            gyroRange = 32.8;
        }
        else if (sensitivity == gyroSen.range_2000_dps) {
            // +- 2000dps
            gyroRange = 16.4;
        }
        xGyro = readData(xGyroAddr) / gyroRange;
        yGyro = readData(yGyroAddr) / gyroRange;
        zGyro = readData(zGyroAddr) / gyroRange;
    }

    /**
     * Initialize MPU6050
     */
    //% block="initialize MPU6050" subcategory="Acceleration"
    //% weight=100
    export function initMPU6050() {
        let buffer = pins.createBuffer(2);
        buffer[0] = power_mgmt;
        buffer[1] = 0;
        pins.i2cWriteBuffer(i2cAddress, buffer);
    }

    /**
      * Get gyroscope values
      */
    //% block="gyroscope value of %axisXYZ axis with %gyroSen sensitivity (Unit: rad/s)" subcategory="Acceleration"
    //% weight=99
    export function gyroscope(axis: axisXYZ, sensitivity: gyroSen) {
        updateGyroscope(sensitivity);
        if (axis == axisXYZ.x) {
            return xGyro;
        }
        else if (axis == axisXYZ.y) {
            return yGyro;
        }
        else {
            return zGyro;
        }
    }

    /**
     * Get rotation of the corresponding Axis
     */
    //% block="angle of %xaxisXYZ axis with %accelSen sensitivity (Unit: Degrees)" subcategory="Acceleration"
    //% weight=98
    export function axisRotation(axis: axisXYZ, sensitivity: accelSen): number {
        updateAcceleration(sensitivity);

        let radians;
        if (axis == axisXYZ.x) {
            radians = Math.atan2(yAccel, dist(xAccel, zAccel));
        }
        else if (axis == axisXYZ.y) {
            radians = -Math.atan2(xAccel, dist(yAccel, zAccel));
        }
        else if (axis == axisXYZ.z) {
            radians = Math.atan2(zAccel, dist(xAccel, yAccel));
        }

        // Convert radian to degrees and return
        let pi = Math.PI;
        let degrees = radians * (180 / pi);
        return degrees;
    }

    /**
     * Get acceleration of the corresponding Axis
     */
    //% block="acceleration of %xaxisXYZ axis with %accelSen sensitivity (Unit: g)" subcategory="Acceleration"
    //% weight=97
    export function axisAcceleration(axis: axisXYZ, sensitivity: accelSen): number {
        updateAcceleration(sensitivity);
        // Return acceleration of specific axis
        if (axis == axisXYZ.x) {
            return xAccel;
        }
        else if (axis == axisXYZ.y) {
            return yAccel;
        }
        else {
            return zAccel;
        }
    }

    /**
     * Get temperature
     */
    //% block="temperature (Unit: Celsius)" subcategory="Acceleration"
    //% weight=96
    export function readTemperature(): number {
        let rawTemp = readData(tempAddr);
        return 36.53 + rawTemp / 340;
    }

    enum Compass {
        BOARD_ID = 0x08,
        //  Compass     (0x40 - 0x5f) + 6 bytes
        ACC_RAW = 0x40,   // 6  (0-5)
        GYR_RAW = 0x46,   // 6  (6-b)
        MAG_RAW = 0x4c,   // 6  (c-2)

        GET_ROLL = 0x54,   // 2byte
        GET_YAW = 0x56,   // 2byte
        GET_PITCH = 0x58,   // 2byte

        MAG_CENT = 0x5a,   // xxyyzz
        MAG_DATA = 0x3a,   // xxyyzz

        WRI_REG = 0x20,   // write reg

    };
    /**
    * Compass read function, to get the yaw angle
    */
    //% block="get_yaw (Unit: deg)" subcategory="Acceleration"
    //% weight=70
    export function compass_get_yaw(): number {
        let yaw_ang = 0;
        pins.i2cWriteNumber(Compass.BOARD_ID, Compass.GET_YAW, NumberFormat.UInt8BE, false);
        let compass_raw = pins.i2cReadBuffer(Compass.BOARD_ID, 2, false);
        yaw_ang = compass_raw[0] & 0xff;
        yaw_ang |= compass_raw[1] << 8;
        yaw_ang /= 100;
        return yaw_ang;
    }
}
