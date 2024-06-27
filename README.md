# PKS-Driver

Micro:bit motor drive expansion board. \
https://www.peanutkingstore.com/product/peanut-king-micro-bit-robot-shield-v1-2

## Table of Contents

* [URL](#url)
* [Summary](#summary)
* [Blocks](#blocks)
* [License](#license)

## URL
project URL:  ```https://github.com/peanut-king-solution/pks-pxt-shield```

## Summary
The Micro:bit motor drive expansion board not only enhances motor drive capabilities but also incorporates four motor driven, 2 road, on the basis of stepper motor driver, 
also raises the additional 8 road steering gear interface, IO port, 2 road 9 I2C interface.
In addition, it provides an extra eight steering gear interfaces, IO ports, and two 9 I2C interfaces.
The motor uses a high-current interface, while the steering machine, I2C, and IO ports all use the Gravity standard interface, supporting a vast number of modules and sensors. 
The expansion board is powered by a voltage range of 3.5v to 5.5v and offers two power interface modes: a 3.5mm plug and wiring. 
It's known for its wide voltage compatibility, numerous ports, compact size, and plug-and-play convenience.

## Blocks
### 1. Motors
![image](https://github.com/peanut-king-solution/pks-pxt-shield/blob/master/image/motors.png)

### 2. Gyroscope
![image](https://github.com/peanut-king-solution/pks-pxt-shield/blob/master/image/gyro.png)

### 3. Hydroponic
![image](https://github.com/peanut-king-solution/pks-pxt-shield/blob/master/image/hydroponic.png)

### 4. Temperature and Humidity
![image](https://github.com/peanut-king-solution/pks-pxt-shield/blob/master/image/temperature.png)

## Code Example
```JavaScript
basic.forever(function () {
    pksdriver.MotorRun(pksdriver.Motors.M1, pksdriver.Dir.CCW, 80) // set the speed of moter M1
    pksdriver.MotorRun(pksdriver.Motors.M2, pksdriver.Dir.CW, 80)
    basic.pause(1500)
    pksdriver.motorStopAll() // stop all the motors
})


```

## License

MIT

## Supported targets

* for PXT/microbit
(The metadata above is needed for package search.)
```package
gamePad=github:peanut-king-solution/pks-pxt-shield
```
