function onInit() {

    clearInterval();

    var lcd = require("HD44780").connect(C15,C12,C0,C1,C2,C3);

    lcd.createChar(0,[0,0,0,0,0,0,0,31]);
    lcd.createChar(1,[0,0,0,0,0,0,31,31]);
    lcd.createChar(2,[0,0,0,0,0,31,31,31]);
    lcd.createChar(3,[0,0,0,0,31,31,31,31]);
    lcd.createChar(4,[0,0,0,31,31,31,31,31]);
    lcd.createChar(5,[0,0,31,31,31,31,31,31]);
    lcd.createChar(6,[0,31,31,31,31,31,31,31]);
    lcd.createChar(7,[31,31,31,31,31,31,31,31]);

    var history = new Array(16);

    var showData = function() {
        for (var i=1;i<history.length;i++) history[i-1]=history[i];
        history[history.length-1] = Math.round(analogRead(A0)*16);
        //console.log(history[history.length-1]);

        if(0) {
            lcd.setCursor(0,0);
            lcd.print("Current data:");
            lcd.setCursor(4,1);
            lcd.print("A0 = "+analogRead(A0));

        } else {
            lcd.setCursor(0,0);
            for (var i=0;i<history.length;i++) {
                var n=history[i];
                if (n>16) n=16;
                lcd.write((n>8)?(n-9):32);
            }

            lcd.setCursor(0,1);
            for (var i=0;i<history.length;i++) {
                var n=history[i];
                if (n>8) n=8;
                lcd.write((n>0)?(n-1):32);
            }
        }
    };

    setInterval(showData,100);
};

