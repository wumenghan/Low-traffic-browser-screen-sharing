

// credit: https://stackoverflow.com/a/2631931/4246348
function getPathTo(element) {
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
function getAllElementsByXpath(xpath) {
  return document.evaluate(xpath, document.documentElement);
}
function getElementByXpath(xpath) {
  return document.evaluate(xpath, document.documentElement).iterateNext();
}