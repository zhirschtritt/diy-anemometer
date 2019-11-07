const CALIBRATE_MPH = 5;
const ledPin = DigitalPin.P13;
const sensorPin = DigitalPin.P8;

pins.setPull(sensorPin, PinPullMode.PullUp)
pins.setEvents(sensorPin, PinEventType.Edge)

const getRpm = (period: number) => 60 / period;

class SensorEventHandler {
    lastTimestamp: number;
    rpm: number;
    calibratedRpm: number;

    constructor() {
        this.lastTimestamp = 0;
        this.rpm = 0;
        this.calibratedRpm = 0;
    }

    recordSensorEvent() {
        const newTimestamp = control.eventTimestamp()
        // convert from microseconds to seconds
        const period = (newTimestamp - this.lastTimestamp) / 1000000
        const rpm = Math.trunc(Math.round(60 / period));

        const serializedPeriod = period.toString().slice(0, 5);
        const serializedMph = Math.roundWithPrecision(this.getMph(rpm), 3).toString().slice(0, 5);

        serial.writeLine(
            `Period: ${serializedPeriod}  |  RPM: ${rpm}  |  MPH: ${serializedMph}`
        )
        // led.plotBarGraph(Math.trunc(Math.round(getRpm(period))), 0);

        this.rpm = rpm;
        this.lastTimestamp = newTimestamp
    }

    calibrate() {
        this.calibratedRpm = CALIBRATE_MPH / this.rpm;
        serial.writeLine(`Calibrated to ${this.calibratedRpm}`);
    }

    getMph(rpm: number) {
        return this.calibratedRpm * rpm;
    }
}

const sensorEventHandler = new SensorEventHandler();
input.onButtonPressed(Button.B, () => sensorEventHandler.calibrate())

control.onEvent(
    control.eventSourceId(EventBusSource.MICROBIT_ID_IO_P8),
    control.eventValueId(EventBusValue.MICROBIT_PIN_EVT_FALL),
    () => sensorEventHandler.recordSensorEvent(),
    EventFlags.QueueIfBusy
)

// debug code for indicator LED during testing
let latched = false
basic.forever(function () {
    if (pins.digitalReadPin(sensorPin) == 0) {
        pins.digitalWritePin(ledPin, 1)
        if (!(latched)) {
            latched = true
        }
    } else {
        pins.digitalWritePin(ledPin, 0);
        latched = false
    }
})
