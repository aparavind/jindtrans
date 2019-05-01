"use strict";

const usubstr = require('unicode-substring');
const ulength = require('unicode-length');


document.getElementById('response').innerHTML = ulength.get('💥Emoji Rule💥');

function transliterate(string,origLang,finalLang){
    var greatArray = {
        "oM": {
          "opDvn": "ॐ",
          "isLast": 1,
          "isMinussable": 0,
          "performMinusOne": 0,
          "existAnother": 0,
          "independantInvalid": 0
        },
        "t": {
          "opDvn": "त्",
          "isLast": 0,
          "isMinussable": 1,
          "performMinusOne": 0,
          "existAnother": 0,
          "independantInvalid": 0
        },
        "a[%% e %%]": {
          "opDvn": "",
          "isLast": 1,
          "isMinussable": 0,
          "performMinusOne": 1,
          "existAnother": 0,
          "independantInvalid": 1
        },
        "aa[%% e %%]": {
          "opDvn": "ा",
          "isLast": 1,
          "isMinussable": 0,
          "performMinusOne": 1,
          "existAnother": 0,
          "independantInvalid": 1
        },
        "A[%% e %%]": {
          "opDvn": "ा",
          "isLast": 1,
          "isMinussable": 0,
          "performMinusOne": 1,
          "existAnother": 0,
          "independantInvalid": 1
        },
        "i[%% e %%]": {
          "opDvn": "ि",
          "isLast": 1,
          "isMinussable": 0,
          "performMinusOne": 1,
          "existAnother": 0,
          "independantInvalid": 1
        },
        "I[%% e %%]": {
          "opDvn": "ी",
          "isLast": 1,
          "isMinussable": 0,
          "performMinusOne": 1,
          "existAnother": 0,
          "independantInvalid": 1
        },
        "ee[%% e %%]": {
          "opDvn": "ी",
          "isLast": 1,
          "isMinussable": 0,
          "performMinusOne": 1,
          "existAnother": 0,
          "independantInvalid": 1
        },
        "u[%% e %%]": {
          "opDvn": "ु",
          "isLast": 1,
          "isMinussable": 0,
          "performMinusOne": 1,
          "existAnother": 0,
          "independantInvalid": 1
        },
        "U[%% e %%]": {
          "opDvn": "ू",
          "isLast": 1,
          "isMinussable": 0,
          "performMinusOne": 1,
          "existAnother": 0,
          "independantInvalid": 1
        },
        "Ru[%% e %%]": {
          "opDvn": "ृ",
          "isLast": 1,
          "isMinussable": 0,
          "performMinusOne": 1,
          "existAnother": 0,
          "independantInvalid": 1
        },
        "RU[%% e %%]": {
          "opDvn": "ॄ",
          "isLast": 1,
          "isMinussable": 0,
          "performMinusOne": 1,
          "existAnother": 0,
          "independantInvalid": 1
        },
        "~lu[%% e %%]": {
          "opDvn": "ॢ",
          "isLast": 1,
          "isMinussable": 0,
          "performMinusOne": 1,
          "existAnother": 0,
          "independantInvalid": 1
        },
        "~lU[%% e %%]": {
          "opDvn": "ॣ",
          "isLast": 1,
          "isMinussable": 0,
          "performMinusOne": 1,
          "existAnother": 0,
          "independantInvalid": 1
        },
        "~e[%% e %%]": {
          "opDvn": "ॅ",
          "isLast": 1,
          "isMinussable": 0,
          "performMinusOne": 1,
          "existAnother": 0,
          "independantInvalid": 1
        },
        "~a[%% e %%]": {
          "opDvn": "ॅ",
          "isLast": 1,
          "isMinussable": 0,
          "performMinusOne": 1,
          "existAnother": 0,
          "independantInvalid": 1
        },
        "oo[%% e %%]": {
          "opDvn": "ू",
          "isLast": 1,
          "isMinussable": 0,
          "performMinusOne": 1,
          "existAnother": 0,
          "independantInvalid": 1
        },
        "e[%% e %%]": {
          "opDvn": "े",
          "isLast": 1,
          "isMinussable": 0,
          "performMinusOne": 1,
          "existAnother": 0,
          "independantInvalid": 1
        },
        "E[%% e %%]": {
          "opDvn": "ॆ",
          "isLast": 1,
          "isMinussable": 0,
          "performMinusOne": 1,
          "existAnother": 0,
          "independantInvalid": 1
        },
        "ai[%% e %%]": {
          "opDvn": "ै",
          "isLast": 1,
          "isMinussable": 0,
          "performMinusOne": 1,
          "existAnother": 0,
          "independantInvalid": 1
        },
        "~o[%% e %%]": {
          "opDvn": "ॉ",
          "isLast": 1,
          "isMinussable": 0,
          "performMinusOne": 1,
          "existAnother": 0,
          "independantInvalid": 1
        },
        "o[%% e %%]": {
          "opDvn": "ो",
          "isLast": 1,
          "isMinussable": 0,
          "performMinusOne": 1,
          "existAnother": 0,
          "independantInvalid": 1
        },
        "au[%% e %%]": {
          "opDvn": "ौ",
          "isLast": 1,
          "isMinussable": 0,
          "performMinusOne": 1,
          "existAnother": 0,
          "independantInvalid": 1
        },
        "ou[%% e %%]": {
          "opDvn": "ौ",
          "isLast": 1,
          "isMinussable": 0,
          "performMinusOne": 1,
          "existAnother": 0,
          "independantInvalid": 1
        },
        "~M": {
          "opDvn": "ँ",
          "isLast": 1,
          "isMinussable": 0,
          "performMinusOne": 0,
          "existAnother": 1,
          "independantInvalid": 0
        },
        "M": {
          "opDvn": "ं",
          "isLast": 1,
          "isMinussable": 0,
          "performMinusOne": 0,
          "existAnother": 1,
          "independantInvalid": 1
        },
        "H": {
          "opDvn": "ः",
          "isLast": 1,
          "isMinussable": 0,
          "performMinusOne": 0,
          "existAnother": 1,
          "independantInvalid": ""
        },
        "a": {
          "opDvn": "अ",
          "isLast": 0,
          "isMinussable": 0,
          "performMinusOne": 0,
          "existAnother": 1,
          "independantInvalid": 0
        },
        "A": {
          "opDvn": "आ",
          "isLast": 1,
          "isMinussable": 0,
          "performMinusOne": 0,
          "existAnother": 1,
          "independantInvalid": 0
        },
        "aa": {
          "opDvn": "आ",
          "isLast": 1,
          "isMinussable": 0,
          "performMinusOne": 0,
          "existAnother": 1,
          "independantInvalid": 0
        },
        "i": {
          "opDvn": "इ",
          "isLast": 1,
          "isMinussable": 0,
          "performMinusOne": 0,
          "existAnother": 1,
          "independantInvalid": 0
        },
        "I": {
          "opDvn": "ई",
          "isLast": 1,
          "isMinussable": 0,
          "performMinusOne": 0,
          "existAnother": 1,
          "independantInvalid": 0
        },
        "ee": {
          "opDvn": "ई",
          "isLast": 1,
          "isMinussable": 0,
          "performMinusOne": 0,
          "existAnother": 1,
          "independantInvalid": 0
        },
        "u": {
          "opDvn": "उ",
          "isLast": 1,
          "isMinussable": 0,
          "performMinusOne": 0,
          "existAnother": 1,
          "independantInvalid": 0
        },
        "U": {
          "opDvn": "ऊ",
          "isLast": 1,
          "isMinussable": 0,
          "performMinusOne": 0,
          "existAnother": 1,
          "independantInvalid": 0
        },
        "Ru": {
          "opDvn": "ऋ",
          "isLast": 1,
          "isMinussable": 0,
          "performMinusOne": 0,
          "existAnother": 1,
          "independantInvalid": 0
        },
        "RU": {
          "opDvn": "ॠ",
          "isLast": 1,
          "isMinussable": 0,
          "performMinusOne": 0,
          "existAnother": 1,
          "independantInvalid": 0
        },
        "~lu": {
          "opDvn": "ऌ",
          "isLast": 1,
          "isMinussable": 0,
          "performMinusOne": 0,
          "existAnother": 1,
          "independantInvalid": 0
        },
        "~lU": {
          "opDvn": "ॡ",
          "isLast": 1,
          "isMinussable": 0,
          "performMinusOne": 0,
          "existAnother": 1,
          "independantInvalid": 0
        },
        "~e": {
          "opDvn": "ऍ",
          "isLast": 1,
          "isMinussable": 0,
          "performMinusOne": 0,
          "existAnother": 1,
          "independantInvalid": 0
        },
        "~a": {
          "opDvn": "ॲ",
          "isLast": 1,
          "isMinussable": 0,
          "performMinusOne": 0,
          "existAnother": 1,
          "independantInvalid": 0
        },
        "oo": {
          "opDvn": "ऊ",
          "isLast": 1,
          "isMinussable": 0,
          "performMinusOne": 0,
          "existAnother": 1,
          "independantInvalid": 0
        },
        "e": {
          "opDvn": "ए",
          "isLast": 1,
          "isMinussable": 0,
          "performMinusOne": 0,
          "existAnother": 1,
          "independantInvalid": 0
        },
        "E": {
          "opDvn": "ऎ",
          "isLast": 1,
          "isMinussable": 0,
          "performMinusOne": 0,
          "existAnother": 1,
          "independantInvalid": 0
        },
        "ai": {
          "opDvn": "ऐ",
          "isLast": 1,
          "isMinussable": 0,
          "performMinusOne": 0,
          "existAnother": 1,
          "independantInvalid": 0
        },
        "~o": {
          "opDvn": "ऑ",
          "isLast": 1,
          "isMinussable": 0,
          "performMinusOne": 0,
          "existAnother": 1,
          "independantInvalid": 0
        },
        "au": {
          "opDvn": "औ",
          "isLast": 1,
          "isMinussable": 0,
          "performMinusOne": 0,
          "existAnother": 1,
          "independantInvalid": 0
        },
        "ou": {
          "opDvn": "औ",
          "isLast": 1,
          "isMinussable": 0,
          "performMinusOne": 0,
          "existAnother": 1,
          "independantInvalid": 0
        },
        "o": {
          "opDvn": "ओ",
          "isLast": 1,
          "isMinussable": 0,
          "performMinusOne": 0,
          "existAnother": 1,
          "independantInvalid": 0
        },
        "k": {
          "opDvn": "क्",
          "isLast": 0,
          "isMinussable": 1,
          "performMinusOne": 0,
          "existAnother": 0,
          "independantInvalid": 0
        },
        "kh": {
          "opDvn": "ख्",
          "isLast": 0,
          "isMinussable": 1,
          "performMinusOne": 0,
          "existAnother": 0,
          "independantInvalid": 0
        },
        "K": {
          "opDvn": "ख्",
          "isLast": 0,
          "isMinussable": 1,
          "performMinusOne": 0,
          "existAnother": 0,
          "independantInvalid": 0
        },
        "g": {
          "opDvn": "ग्",
          "isLast": 0,
          "isMinussable": 1,
          "performMinusOne": 0,
          "existAnother": 0,
          "independantInvalid": 0
        },
        "gh": {
          "opDvn": "घ्",
          "isLast": 0,
          "isMinussable": 1,
          "performMinusOne": 0,
          "existAnother": 0,
          "independantInvalid": 0
        },
        "G": {
          "opDvn": "घ्",
          "isLast": 0,
          "isMinussable": 1,
          "performMinusOne": 0,
          "existAnother": 0,
          "independantInvalid": 0
        },
        "~g": {
          "opDvn": "ङ्",
          "isLast": 0,
          "isMinussable": 1,
          "performMinusOne": 0,
          "existAnother": 0,
          "independantInvalid": 0
        },
        "c": {
          "opDvn": "च्",
          "isLast": 0,
          "isMinussable": 1,
          "performMinusOne": 0,
          "existAnother": 0,
          "independantInvalid": 0
        },
        "ch": {
          "opDvn": "छ्",
          "isLast": 0,
          "isMinussable": 1,
          "performMinusOne": 0,
          "existAnother": 0,
          "independantInvalid": 0
        },
        "C": {
          "opDvn": "छ्",
          "isLast": 0,
          "isMinussable": 1,
          "performMinusOne": 0,
          "existAnother": 0,
          "independantInvalid": 0
        },
        "j": {
          "opDvn": "ज्",
          "isLast": 0,
          "isMinussable": 1,
          "performMinusOne": 0,
          "existAnother": 0,
          "independantInvalid": 0
        },
        "J": {
          "opDvn": "झ्",
          "isLast": 0,
          "isMinussable": 1,
          "performMinusOne": 0,
          "existAnother": 0,
          "independantInvalid": 0
        },
        "jh": {
          "opDvn": "झ्",
          "isLast": 0,
          "isMinussable": 1,
          "performMinusOne": 0,
          "existAnother": 0,
          "independantInvalid": 0
        },
        "~j": {
          "opDvn": "ञ्",
          "isLast": 0,
          "isMinussable": 1,
          "performMinusOne": 0,
          "existAnother": 0,
          "independantInvalid": 0
        },
        "T": {
          "opDvn": "ट्",
          "isLast": 0,
          "isMinussable": 1,
          "performMinusOne": 0,
          "existAnother": 0,
          "independantInvalid": 0
        },
        "Th": {
          "opDvn": "ठ्",
          "isLast": 0,
          "isMinussable": 1,
          "performMinusOne": 0,
          "existAnother": 0,
          "independantInvalid": 0
        },
        "D": {
          "opDvn": "ड्",
          "isLast": 0,
          "isMinussable": 1,
          "performMinusOne": 0,
          "existAnother": 0,
          "independantInvalid": 0
        },
        "Dh": {
          "opDvn": "ढ्",
          "isLast": 0,
          "isMinussable": 1,
          "performMinusOne": 0,
          "existAnother": 0,
          "independantInvalid": 0
        },
        "N": {
          "opDvn": "ण्",
          "isLast": 0,
          "isMinussable": 1,
          "performMinusOne": 0,
          "existAnother": 0,
          "independantInvalid": 0
        },
        "th": {
          "opDvn": "थ्",
          "isLast": 0,
          "isMinussable": 1,
          "performMinusOne": 0,
          "existAnother": 0,
          "independantInvalid": 0
        },
        "d": {
          "opDvn": "द्",
          "isLast": 0,
          "isMinussable": 1,
          "performMinusOne": 0,
          "existAnother": 0,
          "independantInvalid": 0
        },
        "dh": {
          "opDvn": "ध्",
          "isLast": 0,
          "isMinussable": 1,
          "performMinusOne": 0,
          "existAnother": 0,
          "independantInvalid": 0
        },
        "n": {
          "opDvn": "न्",
          "isLast": 0,
          "isMinussable": 1,
          "performMinusOne": 0,
          "existAnother": 0,
          "independantInvalid": 0
        },
        "nx": {
          "opDvn": "ऩ्",
          "isLast": 0,
          "isMinussable": 1,
          "performMinusOne": 0,
          "existAnother": 0,
          "independantInvalid": 0
        },
        "p": {
          "opDvn": "प्",
          "isLast": 0,
          "isMinussable": 1,
          "performMinusOne": 0,
          "existAnother": 0,
          "independantInvalid": 0
        },
        "ph": {
          "opDvn": "फ्",
          "isLast": 0,
          "isMinussable": 1,
          "performMinusOne": 0,
          "existAnother": 0,
          "independantInvalid": 0
        },
        "b": {
          "opDvn": "ब्",
          "isLast": 0,
          "isMinussable": 1,
          "performMinusOne": 0,
          "existAnother": 0,
          "independantInvalid": 0
        },
        "bh": {
          "opDvn": "भ्",
          "isLast": 0,
          "isMinussable": 1,
          "performMinusOne": 0,
          "existAnother": 0,
          "independantInvalid": 0
        },
        "m": {
          "opDvn": "म्",
          "isLast": 0,
          "isMinussable": 1,
          "performMinusOne": 0,
          "existAnother": 0,
          "independantInvalid": 0
        },
        "y": {
          "opDvn": "य्",
          "isLast": 0,
          "isMinussable": 1,
          "performMinusOne": 0,
          "existAnother": 0,
          "independantInvalid": 0
        },
        "r": {
          "opDvn": "र्",
          "isLast": 0,
          "isMinussable": 1,
          "performMinusOne": 0,
          "existAnother": 0,
          "independantInvalid": 0
        },
        "rx": {
          "opDvn": "ऱ्",
          "isLast": 0,
          "isMinussable": 1,
          "performMinusOne": 0,
          "existAnother": 0,
          "independantInvalid": 0
        },
        "l": {
          "opDvn": "ल्",
          "isLast": 0,
          "isMinussable": 1,
          "performMinusOne": 0,
          "existAnother": 0,
          "independantInvalid": 0
        },
        "L": {
          "opDvn": "ळ्",
          "isLast": 0,
          "isMinussable": 1,
          "performMinusOne": 0,
          "existAnother": 0,
          "independantInvalid": 0
        },
        "Lx": {
          "opDvn": "ऴ्",
          "isLast": 0,
          "isMinussable": 1,
          "performMinusOne": 0,
          "existAnother": 0,
          "independantInvalid": 0
        },
        "v": {
          "opDvn": "व्",
          "isLast": 0,
          "isMinussable": 1,
          "performMinusOne": 0,
          "existAnother": 0,
          "independantInvalid": 0
        },
        "w": {
          "opDvn": "व्",
          "isLast": 0,
          "isMinussable": 1,
          "performMinusOne": 0,
          "existAnother": 0,
          "independantInvalid": 0
        },
        "S": {
          "opDvn": "श्",
          "isLast": 0,
          "isMinussable": 1,
          "performMinusOne": 0,
          "existAnother": 0,
          "independantInvalid": 0
        },
        "sh": {
          "opDvn": "श्",
          "isLast": 0,
          "isMinussable": 1,
          "performMinusOne": 0,
          "existAnother": 0,
          "independantInvalid": 0
        },
        "Sh": {
          "opDvn": "ष्",
          "isLast": 0,
          "isMinussable": 1,
          "performMinusOne": 0,
          "existAnother": 0,
          "independantInvalid": 0
        },
        "s": {
          "opDvn": "स्",
          "isLast": 0,
          "isMinussable": 1,
          "performMinusOne": 0,
          "existAnother": 0,
          "independantInvalid": 0
        },
        "h": {
          "opDvn": "ह्",
          "isLast": 0,
          "isMinussable": 1,
          "performMinusOne": 0,
          "existAnother": 0,
          "independantInvalid": 0
        },
        "~h": {
          "opDvn": "ह्",
          "isLast": 0,
          "isMinussable": 1,
          "performMinusOne": 0,
          "existAnother": 0,
          "independantInvalid": 0
        },
        "q": {
          "opDvn": "॒",
          "isLast": 0,
          "isMinussable": 0,
          "performMinusOne": 0,
          "existAnother": 0,
          "independantInvalid": 1
        },
        "Q": {
          "opDvn": "᳒",
          "isLast": 0,
          "isMinussable": 0,
          "performMinusOne": 0,
          "existAnother": 0,
          "independantInvalid": 1
        },
        "V": {
          "opDvn": "᳝",
          "isLast": 0,
          "isMinussable": 0,
          "performMinusOne": 0,
          "existAnother": 0,
          "independantInvalid": 1
        },
        "W": {
          "opDvn": "dot above",
          "isLast": 0,
          "isMinussable": 0,
          "performMinusOne": 0,
          "existAnother": 0,
          "independantInvalid": 1
        },
        "#": {
          "opDvn": "॑",
          "isLast": 0,
          "isMinussable": 0,
          "performMinusOne": 0,
          "existAnother": 0,
          "independantInvalid": 1
        },
        "$": {
          "opDvn": "᳚",
          "isLast": 0,
          "isMinussable": 0,
          "performMinusOne": 0,
          "existAnother": 0,
          "independantInvalid": 1
        }
      };
	var detClass = {
        "brhMaxSize" : 8,
        "previousMinussable" : 0
    };
	detClass = next_conv_char(0,0,detClass,1);

	var offset = 0;
	var loopString = string;
	var outString = "";
	do {
        detClass.removeLastChar = 0;
        detClass.i = 0;
		detClass = next_conv_char(greatArray,loopString,detClass,0);
		if (detClass.i == 0){
			break;
		}

		if (detClass.removeLastChar == 1){
			outString = removeLastChar(outString,detClass);
		}
		
		outString = outString + detClass.outStr;
		loopString = usubstr(loopString,detClass.i);
	
    } while (1);
    return outString;
  }

function removeLastChar(outString,detClass){
	var len = ulength.get(outString);
	return usubstr(outString,0,len-1);
}

function next_conv_char(greatArray,inpString,detClass,resetAll){

    if (resetAll == 1){
        detClass.previousMinussable = 0;
        detClass.outputStatus = 0;
        return detClass;
    }

    if (inpString == ""){
        detClass.outputStatus = 0;
        return detClass;       
    }

    var getI = getMatchingI(inpString,detClass.previousMinussable,greatArray,detClass);

    if ((getI.i == 0) && (detClass.previousMinussable == 1)){
        getI = getMatchingI(inpString,0,greatArray,detClass);
    }

    if (getI.i >0){
        detClass.outStr = getI.greatA.opDvn;
	    detClass.removeLastChar = getI.greatA.performMinusOne && detClass.previousMinussable;
	    detClass.previousMinussable = getI.greatA.isMinussable;
    } else {
	    detClass.outStr = usubstr(inpString,0,1);
	    getI.i = getI.i + 1;
    }
    detClass.i = getI.i;
    return detClass;
}

function getMatchingI(inpString,hasMinus,greatArray,detClass){
    var ret = {};
    var l = ulength.get(inpString);
    for(var i= (detClass.brhMaxSize > l) ? l:detClass.brhMaxSize ; i > 0; i--){
        var subString = usubstr(inpString,0,i);
        if (hasMinus){
            subString = subString + "[%% e %%]";
        }
        if (greatArray[subString]){
            break;
        }
    }
    ret.i = i;
    if (i > 0){
        ret.greatA = greatArray[subString];
    }
    return ret;
}




  
 console.log(transliterate("agnimeeLe purohitaM"));

