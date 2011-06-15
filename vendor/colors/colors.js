/*
colors.js

Copyright (c) 2010 Alexis Sellier (cloudhead) , Marak Squires

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.

*/

// prototypes the string object to have additional method calls that add terminal colors
var isHeadless = (typeof module !== 'undefined');
['bold', 'underline', 'italic', 'inverse', 'grey', 'yellow', 'red', 'green', 'blue', 'white', 'cyan', 'magenta'].forEach(function (style) {

  // __defineGetter__ at the least works in more browsers
  // http://robertnyman.com/javascript/javascript-getters-setters.html
  // Object.defineProperty only works in Chrome
  String.prototype.__defineGetter__(style, function () {
    return isHeadless ?
             stylize(this, style) : // for those running in node (headless environments)
             this.replace(/( )/, '$1'); // and for those running in browsers:
             // re: ^ you'd think 'return this' works (but doesn't) so replace coerces the string to be a real string
  });
});

// prototypes string with method "rainbow"
// rainbow will apply a the color spectrum to a string, changing colors every letter
String.prototype.__defineGetter__('rainbow', function () {
  if (!isHeadless) {
    return this.replace(/( )/, '$1');
  }
  var rainbowcolors = ['red','yellow','green','blue','magenta']; //RoY G BiV
  var exploded = this.split("");
  var i=0;
  exploded = exploded.map(function(letter) {
    if (letter==" ") {
      return letter;
    }
    else {
      return stylize(letter,rainbowcolors[i++ % rainbowcolors.length]);
    }
  });
  return exploded.join("");
});

function stylize(str, style) {
  var styles = {
  //styles
  'bold'      : [1,  22],
  'italic'    : [3,  23],
  'underline' : [4,  24],
  'inverse'   : [7,  27],
  //grayscale
  'white'     : [37, 39],
  'grey'      : [90, 39],
  'black'     : [90, 39],
  //colors
  'blue'      : [34, 39],
  'cyan'      : [36, 39],
  'green'     : [32, 39],
  'magenta'   : [35, 39],
  'red'       : [31, 39],
  'yellow'    : [33, 39]
  };
  return '\033[' + styles[style][0] + 'm' + str +
         '\033[' + styles[style][1] + 'm';
};

// don't summon zalgo
String.prototype.__defineGetter__('zalgo', function () {
  return zalgo(this);
});

// please no
function zalgo(text, options) {
  var soul = {
    "up" : [
      '̍','̎','̄','̅',
      '̿','̑','̆','̐',
      '͒','͗','͑','̇',
      '̈','̊','͂','̓',
      '̈','͊','͋','͌',
      '̃','̂','̌','͐',
      '̀','́','̋','̏',
      '̒','̓','̔','̽',
      '̉','ͣ','ͤ','ͥ',
      'ͦ','ͧ','ͨ','ͩ',
      'ͪ','ͫ','ͬ','ͭ',
      'ͮ','ͯ','̾','͛',
      '͆','̚'
      ],
    "down" : [
      '̖','̗','̘','̙',
      '̜','̝','̞','̟',
      '̠','̤','̥','̦',
      '̩','̪','̫','̬',
      '̭','̮','̯','̰',
      '̱','̲','̳','̹',
      '̺','̻','̼','ͅ',
      '͇','͈','͉','͍',
      '͎','͓','͔','͕',
      '͖','͙','͚','̣'
      ],
    "mid" : [
      '̕','̛','̀','́',
      '͘','̡','̢','̧',
      '̨','̴','̵','̶',
      '͜','͝','͞',
      '͟','͠','͢','̸',
      '̷','͡',' ҉'
      ]
  },
  all = [].concat(soul.up, soul.down, soul.mid),
  zalgo = {};

  function randomNumber(range) {
    r = Math.floor(Math.random()*range);
    return r;
  };

  function is_char(character) {
    var bool = false;
    all.filter(function(i){
     bool = (i == character);
    });
    return bool;
  }

  function heComes(text, options){
      result = '';
      options = options || {};
      options["up"] = options["up"] || true;
      options["mid"] = options["mid"] || true;
      options["down"] = options["down"] || true;
      options["size"] = options["size"] || "maxi";
      var counts;
      text = text.split('');
       for(var l in text){
         if(is_char(l)) { continue; }
         result = result + text[l];

        counts = {"up" : 0, "down" : 0, "mid" : 0};

        switch(options.size) {
          case 'mini':
            counts.up = randomNumber(8);
            counts.min= randomNumber(2);
            counts.down = randomNumber(8);
          break;
          case 'maxi':
            counts.up = randomNumber(16) + 3;
            counts.min = randomNumber(4) + 1;
            counts.down = randomNumber(64) + 3;
          break;
          default:
            counts.up = randomNumber(8) + 1;
            counts.mid = randomNumber(6) / 2;
            counts.down= randomNumber(8) + 1;
          break;
        }

        var arr = ["up", "mid", "down"];
        for(var d in arr){
          var index = arr[d];
          for (var i = 0 ; i <= counts[index]; i++)
          {
            if(options[index]) {
                result = result + soul[index][randomNumber(soul[index].length)];
              }
            }
          }
        }
      return result;
  };
  return heComes(text);
}
