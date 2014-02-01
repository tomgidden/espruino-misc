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
 *   -  Interrupt-driven operation
 *
 *   Not currently working right:
 *   -  INFRARED doesn't seem to work
 *
 *   It's possibly the features listed above _do_ work, but my particular
 *   TSL2561 breakout sensor _doesn't_ work for some reason.  Or there are
 *   bugs in the original C++ code.
 */

function TSL(i2c) {
    this.i2c = i2c;
    this.debug = false;
}

// All the constants we should need to drive this thing
TSL.prototype.config = {
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

    timing: {
        _13MS: 0x00, // 13.7ms
        _101MS: 0x01, // 101ms
        _402MS: 0x02 // 402ms
    },

    gain: {
        _1X: 0x00, // No gain
        _16X: 0x10 // 16x gain
    }
};

/*
  var READBIT = (0x01);
  var COMMAND_BIT = (0x80); // Must be 1
  var CLEAR_BIT = (0x40); // Clears any pending interrupt (write 1 to clear)
  var WORD_BIT = (0x20); // 1 = read/write word (rather than byte)
  var BLOCK_BIT = (0x10); // 1 = using block read/write

  var CONTROL_POWERON = (0x03);
  var CONTROL_POWEROFF = (0x00);

  var LUX_LUXSCALE = (14); // Scale by 2^14
  var LUX_RATIOSCALE = (9); // Scale ratio by 2^9
  var LUX_CHSCALE = (10); // Scale channel values by 2^10
  var LUX_CHSCALE_TINT0 = (0x7517); // 322/11 * 2^TSL2561_LUX_CHSCALE
  var LUX_CHSCALE_TINT1 = (0x0FE7); // 322/81 * 2^TSL2561_LUX_CHSCALE

  var REG_CONTROL = 0x00;
  var REG_TIMING = 0x01;
  var REG_THRESHHOLDL_LOW = 0x02;
  var REG_THRESHHOLDL_HIGH = 0x03;
  var REG_THRESHHOLDH_LOW = 0x04;
  var REG_THRESHHOLDH_HIGH = 0x05;
  var REG_INTERRUPT = 0x06;
  var REG_CRC = 0x08;
  var REG_ID = 0x0A;
  var REG_CHAN0_LOW = 0x0C;
  var REG_CHAN0_HIGH = 0x0D;
  var REG_CHAN1_LOW = 0x0E;
  var REG_CHAN1_HIGH = 0x0F;
*/

// Power up and enable the sensor's data gathering process
TSL.prototype.enable = function () {
    this.i2c.writeTo(this.address, [0x80/*COMMAND_BIT*/ | 0/*REG_CONTROL*/,
                                    0x03/*CONTROL_POWERON*/]);
    return this;
};

// Disable the sensor's data gathering process and power down.
TSL.prototype.disable = function () {
    this.i2c.writeTo(this.address, [0x80/*COMMAND_BIT*/ | 0/*REG_CONTROL*/,
                                    0/*CONTROL_POWEROFF*/]);
    return this;
};

// Set the integration timing for the sensor, using values from
// TSL.config.timing.  Setting this to TSL.config.timing._402MS will
// gather the most data (using the automatic integration, that is)
TSL.prototype.setTiming = function (timing) {
    this.timing = timing;
    this.i2c.writeTo(this.address, [0x80/*COMMAND_BIT*/ | 0x01/*REG_TIMING*/,
                                    this.timing | this.gain ]);
    return this;
};

// Set the gain of the sensor, to either TSL.config.gain._1X (no gain) or
// TSL.config.gain._16X (16x gain)
TSL.prototype.setGain = function (gain) {
    this.gain = gain;
    this.i2c.writeTo(this.address, [0x80/*COMMAND_BIT*/ | 0x01/*REG_TIMING*/,
                                    this.timing | this.gain ]);
    return this;
};

// Initialise the TSL object and send the passed initial configuration to
// the sensor.  The address should be taken from TSL.config.address.LOW,
// .FLOAT, or .HIGH.  If the ADDR pin on the sensor is left unconnected,
// address should be TSL.config.address.FLOAT. Alternatively it can be
// pulled high or low to use an alternative address.
TSL.prototype.init = function (address, timing, gain) {
    this.address = address;
    this.timing = timing;
    this.gain = gain;

    this.i2c.writeTo(this.address, [
        0x80/*COMMAND_BIT*/ | 0/*REG_CONTROL*/,
        0x03/*CONTROL_POWERON*/
    ]);

    this.i2c.writeTo(this.address, [
        0x80/*COMMAND_BIT*/ | 0x01/*REG_TIMING*/,
        this.timing | this.gain
    ]);

    this.i2c.writeTo(this.address, [
        0x80/*COMMAND_BIT*/ | 0/*REG_CONTROL*/,
        0/*CONTROL_POWEROFF*/
    ]);

    return this;
};

TSL.prototype.calculateLux = function (ch0, ch1) {
    // Not currently implemented.
    //
    // This function should use the calibration tables to convert the
    // device-specific light-level values into Lux units.  The code is
    // available in the Arduino library, but just hasn't been ported yet.
    /*
    // T, FN and CL Lux conversion tables
    var LUX_T = {
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
    };

    // CS Lux conversion tables
    var LUX_CS = {
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
    };
    */
    return undefined;
};


TSL.prototype.getLuminosity = function(channel, callback) {
    var self = this;

    // getLuminosity is asynchronous, as after triggering, the sensor
    // needs a short time to integrate the data together before it can be
    // read.  As a result, the sensor is initialised and a setTimeout is
    // set to the readCallback function.  The readCallback function should
    // then collect the data and pass it to 'callback'.

    // Get the luminosity data from the requested channel.
    var getDataFromChannel = function (ch) {

        // Send a command to the sensor requesting the 16-bit data from
        // the requested channel.
        self.i2c.writeTo(
            self.address,
            0x80/*COMMAND_BIT*/ |
                0x20/*WORD_BIT*/    |
                (ch === 1 ? 0x0e/*REG_CHAN1_LOW*/ : 0x0c/*REG_CHAN0_LOW*/));

        // Immediately read the next two bytes from the sensor
        buf = self.i2c.readFrom(self.address, 2);

        if (self.debug) print (buf);

        // And turn it into a 16-bit value.
        return (buf[1]<<8) | buf[0];
    };

    // The timeout should trigger readCallback to collect the data from
    // the sensor and execute the return callback passed to getLuminosity.
    var readCallback = function () {
        var x1, x0, buf;

        // If we're reading visible or infrared, we need the infrared
        // channel.  Visible is calculated using the full spectrum minus
        // the infrared channel.
        if(channel != self.config.spectrum.FULLSPECTRUM) {
            x1 = getDataFromChannel(1);
        }

        // If we're reading full-spectrum or visible, we need the
        // full-spectrum channel, for the same reason as above.
        if(channel != self.config.spectrum.INFRARED) {
            x0 = getDataFromChannel(0);
        }

        // Switch off the sensor
        self.disable();

        // Clear the timeout, unlocking the sensor for future use.
        self._read_timeout = false;

        // Call the callback with the requested value.
        switch (channel) {
        case self.config.spectrum.INFRARED:
            callback(x1/readCallback.scale);
            return;

        case self.config.spectrum.VISIBLE:
            callback((x0 - x1)/readCallback.scale);
            return;

        default:// case self.config.spectrum.FULLSPECTRUM:
            callback(x0/readCallback.scale);
            return;
        }
    };

    // If there's already a read timeout set, then another call is still
    // in progress, so just execute the callback with a null parameter
    // (error state)
    if(this._read_timeout) {
        setTimeout(function () { callback(null); }, 0);
        this._read_timeout = false;
        return this;
    }

    // Otherwise, we're good to go. First thing to do is set the timeout
    // to something dummy to try to avoid a race condition.  We'll replace
    // it with the real timeout shortly.
    this._read_timeout = true;

    // Switch on the sensor
    this.enable();

    // Now that the sensor is set up -- and should be integrating data --
    // we need to schedule the data collection using a timeout.
    //
    // We can also set the scaling factor: the sum of light-things
    // accumulated over the integration period will be relative to the
    // time spent integrating, so divide to scale it.  These scaling
    // values and the process to calculate them come from the TSL2561 data
    // sheet.

    var int_time;

    switch (this.timing) {
    case this.config.timing._13MS:
        readCallback.scale = 0.034;
        int_time = 14;
        break;

    case this.config.timing._101MS:
        readCallback.scale = 0.252;
        int_time = 102;
        break;

    default:// case this.config.timing._402MS:
        readCallback.scale = 1;
        int_time = 403;
    }

    // Set up a timeout to read the data and execute the callback once
    // enough time has passed for the integration to occur.
    this._read_timeout = setTimeout(readCallback, int_time);

    return this;
};

////////////////////////////////////////////////////////////////////////////

function test() {
    I2C1.setup({sda:B7, scl:B6});
    var tsl = new TSL(I2C1);
    //tsl.debug = true;

    tsl.init(tsl.config.address.FLOAT,
             tsl.config.timing._402MS,
             tsl.config.gain._1X);

    setInterval(function () {
        tsl.getLuminosity(
            tsl.config.spectrum.VISIBLE,
            function (x) { print ("L="+x); }
        );
    }, 1000);
}

test();
