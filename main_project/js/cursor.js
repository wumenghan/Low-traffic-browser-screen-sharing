// cursor.js:  draw a fake cursor and move with given coordinates
// 
// Author: Gaoping Huang

(function() {

var Cursor = window.Cursor = window.Cursor || {};

Cursor.$$imgAttr = {
  src: './imgs/cursor2.png',
  width: 15,
};

Cursor.createCursor = function() {
  var $cursor = $('<img>').attr(Cursor.$$imgAttr),
    $cursorWapper = $('<div id="cursor-wrapper" style="position:absolute;top:0;left:0;">').append($cursor);

  Cursor.$$cursorWapper = $cursorWapper;
  $('body').append($cursorWapper);
}

Cursor.moveTo = function(x, y) {
  // Cursor.$$cursorWapper.css({'left': x, 'top': y})
  // console.log(Cursor.$$cursorWapper)
  // Cursor.$$cursorWapper.animate({left: x, top: y}, 500);
  Cursor.$$cursorWapper.css({left: x, top: y});
}


})();
