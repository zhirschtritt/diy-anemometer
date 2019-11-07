const CALIBRATE_MPH = 5;
const LED_PIN = DigitalPin.P13;
const SENSOR_PIN = DigitalPin.P8;

class SensorEventHandler {
    lastTimestamp: number;
    rpm: number;
    mphCoefficient: number;

    constructor() {
        this.lastTimestamp = 0;
        this.rpm = 0;
        this.mphCoefficient = 0;
    }

    recordSensorEvent() {
        const newTimestamp = control.eventTimestamp()
        // convert from microseconds to seconds
        const period = (newTimestamp - this.lastTimestamp) / 1000000
        const rpm = Math.trunc(Math.round(this.getRpm(period)));

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
        this.mphCoefficient = CALIBRATE_MPH / this.rpm;
        serial.writeLine(`Calibrated to ${this.mphCoefficient}`);
    }

    private getMph(rpm: number) {
        return this.mphCoefficient * rpm;
    }

    private getRpm(period: number) {
        return 60 / period;
    }
}

const sensorEventHandler = new SensorEventHandler();

pins.setPull(SENSOR_PIN, PinPullMode.PullUp)
pins.setEvents(SENSOR_PIN, PinEventType.Edge)

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
    if (pins.digitalReadPin(SENSOR_PIN) == 0) {
        pins.digitalWritePin(LED_PIN, 1)
        if (!(latched)) {
            latched = true
        }
    } else {
        pins.digitalWritePin(LED_PIN, 0);
        latched = false
    }
})
