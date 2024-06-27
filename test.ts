// tests go here; this will not be compiled when this package is used as a library
pksdriver.motorStopAll()
basic.forever(function () {
    pksdriver.MotorRun(pksdriver.Motors.M1, pksdriver.Dir.CW, 80)
    pksdriver.MotorRun(pksdriver.Motors.M2, pksdriver.Dir.CCW, 80)
    basic.pause(1700)
  
    pksdriver.motorStopAll()
  
    basic.pause(2000)
})
