(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
(function (global){
/*! https://mths.be/punycode v1.4.1 by @mathias */
;(function(root) {

	/** Detect free variables */
	var freeExports = typeof exports == 'object' && exports &&
		!exports.nodeType && exports;
	var freeModule = typeof module == 'object' && module &&
		!module.nodeType && module;
	var freeGlobal = typeof global == 'object' && global;
	if (
		freeGlobal.global === freeGlobal ||
		freeGlobal.window === freeGlobal ||
		freeGlobal.self === freeGlobal
	) {
		root = freeGlobal;
	}

	/**
	 * The `punycode` object.
	 * @name punycode
	 * @type Object
	 */
	var punycode,

	/** Highest positive signed 32-bit float value */
	maxInt = 2147483647, // aka. 0x7FFFFFFF or 2^31-1

	/** Bootstring parameters */
	base = 36,
	tMin = 1,
	tMax = 26,
	skew = 38,
	damp = 700,
	initialBias = 72,
	initialN = 128, // 0x80
	delimiter = '-', // '\x2D'

	/** Regular expressions */
	regexPunycode = /^xn--/,
	regexNonASCII = /[^\x20-\x7E]/, // unprintable ASCII chars + non-ASCII chars
	regexSeparators = /[\x2E\u3002\uFF0E\uFF61]/g, // RFC 3490 separators

	/** Error messages */
	errors = {
		'overflow': 'Overflow: input needs wider integers to process',
		'not-basic': 'Illegal input >= 0x80 (not a basic code point)',
		'invalid-input': 'Invalid input'
	},

	/** Convenience shortcuts */
	baseMinusTMin = base - tMin,
	floor = Math.floor,
	stringFromCharCode = String.fromCharCode,

	/** Temporary variable */
	key;

	/*--------------------------------------------------------------------------*/

	/**
	 * A generic error utility function.
	 * @private
	 * @param {String} type The error type.
	 * @returns {Error} Throws a `RangeError` with the applicable error message.
	 */
	function error(type) {
		throw new RangeError(errors[type]);
	}

	/**
	 * A generic `Array#map` utility function.
	 * @private
	 * @param {Array} array The array to iterate over.
	 * @param {Function} callback The function that gets called for every array
	 * item.
	 * @returns {Array} A new array of values returned by the callback function.
	 */
	function map(array, fn) {
		var length = array.length;
		var result = [];
		while (length--) {
			result[length] = fn(array[length]);
		}
		return result;
	}

	/**
	 * A simple `Array#map`-like wrapper to work with domain name strings or email
	 * addresses.
	 * @private
	 * @param {String} domain The domain name or email address.
	 * @param {Function} callback The function that gets called for every
	 * character.
	 * @returns {Array} A new string of characters returned by the callback
	 * function.
	 */
	function mapDomain(string, fn) {
		var parts = string.split('@');
		var result = '';
		if (parts.length > 1) {
			// In email addresses, only the domain name should be punycoded. Leave
			// the local part (i.e. everything up to `@`) intact.
			result = parts[0] + '@';
			string = parts[1];
		}
		// Avoid `split(regex)` for IE8 compatibility. See #17.
		string = string.replace(regexSeparators, '\x2E');
		var labels = string.split('.');
		var encoded = map(labels, fn).join('.');
		return result + encoded;
	}

	/**
	 * Creates an array containing the numeric code points of each Unicode
	 * character in the string. While JavaScript uses UCS-2 internally,
	 * this function will convert a pair of surrogate halves (each of which
	 * UCS-2 exposes as separate characters) into a single code point,
	 * matching UTF-16.
	 * @see `punycode.ucs2.encode`
	 * @see <https://mathiasbynens.be/notes/javascript-encoding>
	 * @memberOf punycode.ucs2
	 * @name decode
	 * @param {String} string The Unicode input string (UCS-2).
	 * @returns {Array} The new array of code points.
	 */
	function ucs2decode(string) {
		var output = [],
		    counter = 0,
		    length = string.length,
		    value,
		    extra;
		while (counter < length) {
			value = string.charCodeAt(counter++);
			if (value >= 0xD800 && value <= 0xDBFF && counter < length) {
				// high surrogate, and there is a next character
				extra = string.charCodeAt(counter++);
				if ((extra & 0xFC00) == 0xDC00) { // low surrogate
					output.push(((value & 0x3FF) << 10) + (extra & 0x3FF) + 0x10000);
				} else {
					// unmatched surrogate; only append this code unit, in case the next
					// code unit is the high surrogate of a surrogate pair
					output.push(value);
					counter--;
				}
			} else {
				output.push(value);
			}
		}
		return output;
	}

	/**
	 * Creates a string based on an array of numeric code points.
	 * @see `punycode.ucs2.decode`
	 * @memberOf punycode.ucs2
	 * @name encode
	 * @param {Array} codePoints The array of numeric code points.
	 * @returns {String} The new Unicode string (UCS-2).
	 */
	function ucs2encode(array) {
		return map(array, function(value) {
			var output = '';
			if (value > 0xFFFF) {
				value -= 0x10000;
				output += stringFromCharCode(value >>> 10 & 0x3FF | 0xD800);
				value = 0xDC00 | value & 0x3FF;
			}
			output += stringFromCharCode(value);
			return output;
		}).join('');
	}

	/**
	 * Converts a basic code point into a digit/integer.
	 * @see `digitToBasic()`
	 * @private
	 * @param {Number} codePoint The basic numeric code point value.
	 * @returns {Number} The numeric value of a basic code point (for use in
	 * representing integers) in the range `0` to `base - 1`, or `base` if
	 * the code point does not represent a value.
	 */
	function basicToDigit(codePoint) {
		if (codePoint - 48 < 10) {
			return codePoint - 22;
		}
		if (codePoint - 65 < 26) {
			return codePoint - 65;
		}
		if (codePoint - 97 < 26) {
			return codePoint - 97;
		}
		return base;
	}

	/**
	 * Converts a digit/integer into a basic code point.
	 * @see `basicToDigit()`
	 * @private
	 * @param {Number} digit The numeric value of a basic code point.
	 * @returns {Number} The basic code point whose value (when used for
	 * representing integers) is `digit`, which needs to be in the range
	 * `0` to `base - 1`. If `flag` is non-zero, the uppercase form is
	 * used; else, the lowercase form is used. The behavior is undefined
	 * if `flag` is non-zero and `digit` has no uppercase form.
	 */
	function digitToBasic(digit, flag) {
		//  0..25 map to ASCII a..z or A..Z
		// 26..35 map to ASCII 0..9
		return digit + 22 + 75 * (digit < 26) - ((flag != 0) << 5);
	}

	/**
	 * Bias adaptation function as per section 3.4 of RFC 3492.
	 * https://tools.ietf.org/html/rfc3492#section-3.4
	 * @private
	 */
	function adapt(delta, numPoints, firstTime) {
		var k = 0;
		delta = firstTime ? floor(delta / damp) : delta >> 1;
		delta += floor(delta / numPoints);
		for (/* no initialization */; delta > baseMinusTMin * tMax >> 1; k += base) {
			delta = floor(delta / baseMinusTMin);
		}
		return floor(k + (baseMinusTMin + 1) * delta / (delta + skew));
	}

	/**
	 * Converts a Punycode string of ASCII-only symbols to a string of Unicode
	 * symbols.
	 * @memberOf punycode
	 * @param {String} input The Punycode string of ASCII-only symbols.
	 * @returns {String} The resulting string of Unicode symbols.
	 */
	function decode(input) {
		// Don't use UCS-2
		var output = [],
		    inputLength = input.length,
		    out,
		    i = 0,
		    n = initialN,
		    bias = initialBias,
		    basic,
		    j,
		    index,
		    oldi,
		    w,
		    k,
		    digit,
		    t,
		    /** Cached calculation results */
		    baseMinusT;

		// Handle the basic code points: let `basic` be the number of input code
		// points before the last delimiter, or `0` if there is none, then copy
		// the first basic code points to the output.

		basic = input.lastIndexOf(delimiter);
		if (basic < 0) {
			basic = 0;
		}

		for (j = 0; j < basic; ++j) {
			// if it's not a basic code point
			if (input.charCodeAt(j) >= 0x80) {
				error('not-basic');
			}
			output.push(input.charCodeAt(j));
		}

		// Main decoding loop: start just after the last delimiter if any basic code
		// points were copied; start at the beginning otherwise.

		for (index = basic > 0 ? basic + 1 : 0; index < inputLength; /* no final expression */) {

			// `index` is the index of the next character to be consumed.
			// Decode a generalized variable-length integer into `delta`,
			// which gets added to `i`. The overflow checking is easier
			// if we increase `i` as we go, then subtract off its starting
			// value at the end to obtain `delta`.
			for (oldi = i, w = 1, k = base; /* no condition */; k += base) {

				if (index >= inputLength) {
					error('invalid-input');
				}

				digit = basicToDigit(input.charCodeAt(index++));

				if (digit >= base || digit > floor((maxInt - i) / w)) {
					error('overflow');
				}

				i += digit * w;
				t = k <= bias ? tMin : (k >= bias + tMax ? tMax : k - bias);

				if (digit < t) {
					break;
				}

				baseMinusT = base - t;
				if (w > floor(maxInt / baseMinusT)) {
					error('overflow');
				}

				w *= baseMinusT;

			}

			out = output.length + 1;
			bias = adapt(i - oldi, out, oldi == 0);

			// `i` was supposed to wrap around from `out` to `0`,
			// incrementing `n` each time, so we'll fix that now:
			if (floor(i / out) > maxInt - n) {
				error('overflow');
			}

			n += floor(i / out);
			i %= out;

			// Insert `n` at position `i` of the output
			output.splice(i++, 0, n);

		}

		return ucs2encode(output);
	}

	/**
	 * Converts a string of Unicode symbols (e.g. a domain name label) to a
	 * Punycode string of ASCII-only symbols.
	 * @memberOf punycode
	 * @param {String} input The string of Unicode symbols.
	 * @returns {String} The resulting Punycode string of ASCII-only symbols.
	 */
	function encode(input) {
		var n,
		    delta,
		    handledCPCount,
		    basicLength,
		    bias,
		    j,
		    m,
		    q,
		    k,
		    t,
		    currentValue,
		    output = [],
		    /** `inputLength` will hold the number of code points in `input`. */
		    inputLength,
		    /** Cached calculation results */
		    handledCPCountPlusOne,
		    baseMinusT,
		    qMinusT;

		// Convert the input in UCS-2 to Unicode
		input = ucs2decode(input);

		// Cache the length
		inputLength = input.length;

		// Initialize the state
		n = initialN;
		delta = 0;
		bias = initialBias;

		// Handle the basic code points
		for (j = 0; j < inputLength; ++j) {
			currentValue = input[j];
			if (currentValue < 0x80) {
				output.push(stringFromCharCode(currentValue));
			}
		}

		handledCPCount = basicLength = output.length;

		// `handledCPCount` is the number of code points that have been handled;
		// `basicLength` is the number of basic code points.

		// Finish the basic string - if it is not empty - with a delimiter
		if (basicLength) {
			output.push(delimiter);
		}

		// Main encoding loop:
		while (handledCPCount < inputLength) {

			// All non-basic code points < n have been handled already. Find the next
			// larger one:
			for (m = maxInt, j = 0; j < inputLength; ++j) {
				currentValue = input[j];
				if (currentValue >= n && currentValue < m) {
					m = currentValue;
				}
			}

			// Increase `delta` enough to advance the decoder's <n,i> state to <m,0>,
			// but guard against overflow
			handledCPCountPlusOne = handledCPCount + 1;
			if (m - n > floor((maxInt - delta) / handledCPCountPlusOne)) {
				error('overflow');
			}

			delta += (m - n) * handledCPCountPlusOne;
			n = m;

			for (j = 0; j < inputLength; ++j) {
				currentValue = input[j];

				if (currentValue < n && ++delta > maxInt) {
					error('overflow');
				}

				if (currentValue == n) {
					// Represent delta as a generalized variable-length integer
					for (q = delta, k = base; /* no condition */; k += base) {
						t = k <= bias ? tMin : (k >= bias + tMax ? tMax : k - bias);
						if (q < t) {
							break;
						}
						qMinusT = q - t;
						baseMinusT = base - t;
						output.push(
							stringFromCharCode(digitToBasic(t + qMinusT % baseMinusT, 0))
						);
						q = floor(qMinusT / baseMinusT);
					}

					output.push(stringFromCharCode(digitToBasic(q, 0)));
					bias = adapt(delta, handledCPCountPlusOne, handledCPCount == basicLength);
					delta = 0;
					++handledCPCount;
				}
			}

			++delta;
			++n;

		}
		return output.join('');
	}

	/**
	 * Converts a Punycode string representing a domain name or an email address
	 * to Unicode. Only the Punycoded parts of the input will be converted, i.e.
	 * it doesn't matter if you call it on a string that has already been
	 * converted to Unicode.
	 * @memberOf punycode
	 * @param {String} input The Punycoded domain name or email address to
	 * convert to Unicode.
	 * @returns {String} The Unicode representation of the given Punycode
	 * string.
	 */
	function toUnicode(input) {
		return mapDomain(input, function(string) {
			return regexPunycode.test(string)
				? decode(string.slice(4).toLowerCase())
				: string;
		});
	}

	/**
	 * Converts a Unicode string representing a domain name or an email address to
	 * Punycode. Only the non-ASCII parts of the domain name will be converted,
	 * i.e. it doesn't matter if you call it with a domain that's already in
	 * ASCII.
	 * @memberOf punycode
	 * @param {String} input The domain name or email address to convert, as a
	 * Unicode string.
	 * @returns {String} The Punycode representation of the given domain name or
	 * email address.
	 */
	function toASCII(input) {
		return mapDomain(input, function(string) {
			return regexNonASCII.test(string)
				? 'xn--' + encode(string)
				: string;
		});
	}

	/*--------------------------------------------------------------------------*/

	/** Define the public API */
	punycode = {
		/**
		 * A string representing the current Punycode.js version number.
		 * @memberOf punycode
		 * @type String
		 */
		'version': '1.4.1',
		/**
		 * An object of methods to convert from JavaScript's internal character
		 * representation (UCS-2) to Unicode code points, and back.
		 * @see <https://mathiasbynens.be/notes/javascript-encoding>
		 * @memberOf punycode
		 * @type Object
		 */
		'ucs2': {
			'decode': ucs2decode,
			'encode': ucs2encode
		},
		'decode': decode,
		'encode': encode,
		'toASCII': toASCII,
		'toUnicode': toUnicode
	};

	/** Expose `punycode` */
	// Some AMD build optimizers, like r.js, check for specific condition patterns
	// like the following:
	if (
		typeof define == 'function' &&
		typeof define.amd == 'object' &&
		define.amd
	) {
		define('punycode', function() {
			return punycode;
		});
	} else if (freeExports && freeModule) {
		if (module.exports == freeExports) {
			// in Node.js, io.js, or RingoJS v0.8.0+
			freeModule.exports = punycode;
		} else {
			// in Narwhal or RingoJS v0.7.0-
			for (key in punycode) {
				punycode.hasOwnProperty(key) && (freeExports[key] = punycode[key]);
			}
		}
	} else {
		// in Rhino or a web browser
		root.punycode = punycode;
	}

}(this));

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],2:[function(require,module,exports){
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


},{"unicode-length":3,"unicode-substring":6}],3:[function(require,module,exports){
var REGEX_SYMBOLS, punycode, stripAnsi;

punycode = require('punycode');

stripAnsi = require('strip-ansi');

REGEX_SYMBOLS = /([\0-\u02FF\u0370-\u1DBF\u1E00-\u20CF\u2100-\uD7FF\uDC00-\uFE1F\uFE30-\uFFFF]|[\uD800-\uDBFF][\uDC00-\uDFFF]|[\uD800-\uDBFF])([\u0300-\u036F\u1DC0-\u1DFF\u20D0-\u20FF\uFE20-\uFE2F]+)/g;

exports.get = function(input) {
  var stripped;
  if (input == null) {
    throw new Error('Missing input');
  }
  if (typeof input !== 'string') {
    throw new Error("Invalid input: " + input);
  }
  input = stripAnsi(input);
  stripped = input.replace(REGEX_SYMBOLS, function($0, symbol, combiningMarks) {
    return symbol;
  });
  return punycode.ucs2.decode(stripped).length;
};

},{"punycode":1,"strip-ansi":4}],4:[function(require,module,exports){
'use strict';
var ansiRegex = require('ansi-regex')();

module.exports = function (str) {
	return typeof str === 'string' ? str.replace(ansiRegex, '') : str;
};

},{"ansi-regex":5}],5:[function(require,module,exports){
'use strict';
module.exports = function () {
	return /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-PRZcf-nqry=><]/g;
};

},{}],6:[function(require,module,exports){
function charAt(string, index) {
  var first = string.charCodeAt(index);
  var second;
  if (first >= 0xD800 && first <= 0xDBFF && string.length > index + 1) {
    second = string.charCodeAt(index + 1);
    if (second >= 0xDC00 && second <= 0xDFFF) {
      return string.substring(index, index + 2);
    }
  }
  return string[index];
}

function slice(string, start, end) {
  var accumulator = "";
  var character;
  var stringIndex = 0;
  var unicodeIndex = 0;
  var length = string.length;

  while (stringIndex < length) {
    character = charAt(string, stringIndex);
    if (unicodeIndex >= start && unicodeIndex < end) {
      accumulator += character;
    }
    stringIndex += character.length;
    unicodeIndex += 1;
  }
  return accumulator;
}

function toNumber(value, fallback) {
  if (value === undefined) {
    return fallback;
  } else {
    return Number(value);
  }
}

module.exports = function (string, start, end) {
  var realStart = toNumber(start, 0);
  var realEnd = toNumber(end, string.length);
  if (realEnd == realStart) {
    return "";
  } else if (realEnd > realStart) {
    return slice(string, realStart, realEnd);
  } else {
    return slice(string, realEnd, realStart);
  }
}

},{}]},{},[2]);
