// xpath
// Author: Gaoping Huang

(function() {

var Xpath = window.Xpath = window.Xpath || {};


// credit: https://stackoverflow.com/a/2631931/4246348
// keep the function name for recursive call
Xpath.getPathTo = function getPathTo(element) {
    if (element.id!=='')
        return 'id("'+element.id+'")';
    if (element===document.body)
        return element.tagName;

    var ix= 0;
    var siblings= element.parentNode.childNodes;
    for (var i= 0; i<siblings.length; i++) {
        var sibling= siblings[i];
        if (sibling===element)
            return getPathTo(element.parentNode)+'/'+element.tagName+'['+(ix+1)+']';
        if (sibling.nodeType===1 && sibling.tagName===element.tagName)
            ix++;
    }
}

// by Gaoping
Xpath.getAllElementsByXpath = function(xpath) {
  return document.evaluate(xpath, document.documentElement);
}
Xpath.getElementByXpath = function(xpath) {
  return document.evaluate(xpath, document.documentElement).iterateNext();
}


})();
