/*
 * Espruino TSL2561 luminosity sensor
 * by Tom Gidden <tom@gidden.net>, January 2014
 *
 * Derived largely from C++ Arduino TSL2561 code, from:
 *   https://github.com/adafruit/TSL2561-Arduino-Library
 *   by K. Townsend (microBuilder.eu)
 *
 *   Currently unimplemented:
 *   -  calculateLux function
 *
 *   Not currently working right:
 *   -  FULLSPECTRUM and INFRARED don't seem to work
 *   -  timing other than _402MS doesn't seem to work
 *   -  gain doesn't seem to have any effect
 *
 *   It's possibly the features listed above _do_ work, but my particular
 *   TSL2561 breakout sensor _doesn't_ work for some reason.  Or there are
 *   bugs in the original C++ code.
 */

function TSL(i2c) {
    this.i2c = i2c;
}

// All the constants we should need to drive this thing
TSL.prototype.C = {
    spectrum: {
        FULLSPECTRUM: 0,
        INFRARED: 1,
        VISIBLE: 2
    },

    address: {
        LOW: 0x29,
        FLOAT: 0x39,
        HIGH: 0x49
    },

    READBIT: (0x01),
    COMMAND_BIT: (0x80), // Must be 1
    CLEAR_BIT: (0x40), // Clears any pending interrupt (write 1 to clear)
    WORD_BIT: (0x20), // 1 = read/write word (rather than byte)
    BLOCK_BIT: (0x10), // 1 = using block read/write

    CONTROL_POWERON: (0x03),
    CONTROL_POWEROFF: (0x00),

    LUX_LUXSCALE: (14), // Scale by 2^14
    LUX_RATIOSCALE: (9), // Scale ratio by 2^9
    LUX_CHSCALE: (10), // Scale channel values by 2^10
    LUX_CHSCALE_TINT0: (0x7517), // 322/11 * 2^TSL2561_LUX_CHSCALE
    LUX_CHSCALE_TINT1: (0x0FE7), // 322/81 * 2^TSL2561_LUX_CHSCALE

    registers: {
        CONTROL: 0x00,
        TIMING: 0x01,
        THRESHHOLDL_LOW: 0x02,
        THRESHHOLDL_HIGH: 0x03,
        THRESHHOLDH_LOW: 0x04,
        THRESHHOLDH_HIGH: 0x05,
        INTERRUPT: 0x06,
        CRC: 0x08,
        ID: 0x0A,
        CHAN0_LOW: 0x0C,
        CHAN0_HIGH: 0x0D,
        CHAN1_LOW: 0x0E,
        CHAN1_HIGH: 0x0F
    },

    timing: {
        _13MS: 0x00, // 13.7ms
        _101MS: 0x01, // 101ms
        _402MS: 0x02 // 402ms
    },

    gain: {
        _0X: 0x00, // No gain
        _16X: 0x10 // 16x gain
    },

    // T, FN and CL package values
    values_t: {
        LUX_K1: (0x0040), // 0.125 * 2^RATIO_SCALE
        LUX_B1: (0x01f2), // 0.0304 * 2^LUX_SCALE
        LUX_M1: (0x01be), // 0.0272 * 2^LUX_SCALE
        LUX_K2: (0x0080), // 0.250 * 2^RATIO_SCALE
        LUX_B2: (0x0214), // 0.0325 * 2^LUX_SCALE
        LUX_M2: (0x02d1), // 0.0440 * 2^LUX_SCALE
        LUX_K3: (0x00c0), // 0.375 * 2^RATIO_SCALE
        LUX_B3: (0x023f), // 0.0351 * 2^LUX_SCALE
        LUX_M3: (0x037b), // 0.0544 * 2^LUX_SCALE
        LUX_K4: (0x0100), // 0.50 * 2^RATIO_SCALE
        LUX_B4: (0x0270), // 0.0381 * 2^LUX_SCALE
        LUX_M4: (0x03fe), // 0.0624 * 2^LUX_SCALE
        LUX_K5: (0x0138), // 0.61 * 2^RATIO_SCALE
        LUX_B5: (0x016f), // 0.0224 * 2^LUX_SCALE
        LUX_M5: (0x01fc), // 0.0310 * 2^LUX_SCALE
        LUX_K6: (0x019a), // 0.80 * 2^RATIO_SCALE
        LUX_B6: (0x00d2), // 0.0128 * 2^LUX_SCALE
        LUX_M6: (0x00fb), // 0.0153 * 2^LUX_SCALE
        LUX_K7: (0x029a), // 1.3 * 2^RATIO_SCALE
        LUX_B7: (0x0018), // 0.00146 * 2^LUX_SCALE
        LUX_M7: (0x0012), // 0.00112 * 2^LUX_SCALE
        LUX_K8: (0x029a), // 1.3 * 2^RATIO_SCALE
        LUX_B8: (0x0000), // 0.000 * 2^LUX_SCALE
        LUX_M8: (0x0000) // 0.000 * 2^LUX_SCALE
    },

    // CS package values
    values_cs: {
        LUX_K1: (0x0043), // 0.130 * 2^RATIO_SCALE
        LUX_B1: (0x0204), // 0.0315 * 2^LUX_SCALE
        LUX_M1: (0x01ad), // 0.0262 * 2^LUX_SCALE
        LUX_K2: (0x0085), // 0.260 * 2^RATIO_SCALE
        LUX_B2: (0x0228), // 0.0337 * 2^LUX_SCALE
        LUX_M2: (0x02c1), // 0.0430 * 2^LUX_SCALE
        LUX_K3: (0x00c8), // 0.390 * 2^RATIO_SCALE
        LUX_B3: (0x0253), // 0.0363 * 2^LUX_SCALE
        LUX_M3: (0x0363), // 0.0529 * 2^LUX_SCALE
        LUX_K4: (0x010a), // 0.520 * 2^RATIO_SCALE
        LUX_B4: (0x0282), // 0.0392 * 2^LUX_SCALE
        LUX_M4: (0x03df), // 0.0605 * 2^LUX_SCALE
        LUX_K5: (0x014d), // 0.65 * 2^RATIO_SCALE
        LUX_B5: (0x0177), // 0.0229 * 2^LUX_SCALE
        LUX_M5: (0x01dd), // 0.0291 * 2^LUX_SCALE
        LUX_K6: (0x019a), // 0.80 * 2^RATIO_SCALE
        LUX_B6: (0x0101), // 0.0157 * 2^LUX_SCALE
        LUX_M6: (0x0127), // 0.0180 * 2^LUX_SCALE
        LUX_K7: (0x029a), // 1.3 * 2^RATIO_SCALE
        LUX_B7: (0x0037), // 0.00338 * 2^LUX_SCALE
        LUX_M7: (0x002b), // 0.00260 * 2^LUX_SCALE
        LUX_K8: (0x029a), // 1.3 * 2^RATIO_SCALE
        LUX_B8: (0x0000), // 0.000 * 2^LUX_SCALE
        LUX_M8: (0x0000) // 0.000 * 2^LUX_SCALE
    }
};


TSL.prototype.enable = function () {
    this.i2c.writeTo(this.address, [this.C.COMMAND_BIT | this.C.registers.CONTROL,
                                    this.C.CONTROL_POWERON]);
    return this;
};

TSL.prototype.disable = function () {
    this.i2c.writeTo(this.address, [this.C.COMMAND_BIT | this.C.registers.CONTROL,
                                    this.C.CONTROL_POWEROFF]);
    return this;
};

TSL.prototype.setTiming = function (timing) {
    this.timing = timing;
    this.i2c.writeTo(this.address, [this.C.COMMAND_BIT | this.C.registers.TIMING,
                                    this.timing | this.gain ]);
    return this;
};

TSL.prototype.setGain = function (gain) {
    this.gain = gain;
    this.i2c.writeTo(this.address, [this.C.COMMAND_BIT | this.C.registers.TIMING,
                                    this.timing | this.gain ]);
    return this;
};

TSL.prototype.init = function (address, timing, gain) {
    this.address = address;
    this.timing = timing;
    this.gain = gain;

    this.i2c.writeTo(this.address,
                     [
                         this.C.COMMAND_BIT | this.C.registers.CONTROL,
                         this.C.CONTROL_POWERON,

                         this.C.COMMAND_BIT | this.C.registers.TIMING,
                         this.timing | this.gain,

                         this.C.COMMAND_BIT | this.C.registers.CONTROL,
                         this.C.CONTROL_POWEROFF
                     ]);

    return this;
};


TSL.prototype.calculateLux = function (ch0, ch1) {
    // Not currently implemented.
    return undefined;
};


TSL.prototype.getLuminosity = function(channel, callback) {
    var self = this;

    // getLuminosity is asynchronous

    var readfn = function () {
        var x1, x0, buf;

        // If we're reading visible or infrared, we need the infrared
        // channel.  Visible is calculated using the full spectrum minus
        // the infrared channel.
        if(channel != self.C.spectrum.FULLSPECTRUM) {
            self.i2c.writeTo(self.address, self.C.COMMAND_BIT | self.C.WORD_BIT | self.C.registers.CHAN1_LOW);
            buf = self.i2c.readFrom(self.address, 2);
            x1 = (buf[1]<<8) | buf[0];
//            print (buf);
        }

        // If we're reading full-spectrum or visible, we need the
        // full-spectrum channel, for the same reason as above.
        if(channel != self.C.spectrum.INFRARED) {
            self.i2c.writeTo(self.address, self.C.COMMAND_BIT | self.C.WORD_BIT | self.C.registers.CHAN0_LOW);
            buf = self.i2c.readFrom(self.address, 2);
            x0 = (buf[1]<<8) | buf[0];
//            print (buf);
        }

        // Switch off the sensor
        self.disable();

        // Clear the timeout, unlocking the sensor for future use.
        self._read_timeout = false;

        // Call the callback with the requested value.
        switch (channel) {
        case self.C.spectrum.INFRARED:
            callback(x1);
            return;

        case self.C.spectrum.VISIBLE:
            callback(x0 - x1);
            return;

        default:// case self.C.spectrum.FULLSPECTRUM:
            callback(x0);
            return;
        }
    };

    // If there's already a read timeout set, then another call is still
    // in progress, so just execute the callback with a null parameter
    // (error state)
    if(this._read_timeout) {
        setTimeout(function () { callback(null); }, 0);
        return this;
    }

    // Otherwise, we're good to go. First thing to do is set the timeout
    // to something dummy to try to avoid a race condition.  We'll replace
    // it with the real timeout shortly.
    this._read_timeout = true;

    // Switch on the sensor
    this.enable();

    // Set up a timeout to read the data and execute the callback once
    // enough time has passed for the integration to occur.
    switch (this.timing) {
    case this.C.timing._13MS:
        this._read_timeout = setTimeout(readfn, 14);
        return this;

    case this.C.timing._101MS:
        this._read_timeout = setTimeout(readfn, 102);
        return this;

    default:// case this.C.timing._402MS:
        this._read_timeout = setTimeout(readfn, 403);
        return this;
    }
};

I2C1.setup({sda:B9, scl:B8});
var tsl = new TSL(I2C1);
tsl.init(tsl.C.address.FLOAT, tsl.C.timing._402MS, tsl.C.gain._0X);

setInterval(function () {
    tsl.getLuminosity(tsl.C.spectrum.VISIBLE, function (x) { print ("L="+x); });
}, 1000);

