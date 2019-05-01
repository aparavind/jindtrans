"use strict";

const usubstr = require('unicode-substring');
const ulength = require('unicode-length');

var greatArray = {};


document.getElementById('response').innerHTML = ulength.get('💥Emoji Rule💥');

function transliterate(string,origLang,finalLang){
    if (Object.entries(greatArray).length == 0){
        $.ajax({
            "url" : "brhDvn.json",
            "datatype" : "json",
            "original_string" : string,
            "success" : convert_string
        });
    }
}

function convert_string(data){
    var string = this.original_string;
    greatArray = data;
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
    console.log(outString);
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




  
 transliterate("agnimeeLe purohitaM");

