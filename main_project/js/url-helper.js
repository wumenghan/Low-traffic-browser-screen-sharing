// Helper functions for url 
// 
// Author: Gaoping Huang

(function($) {

// which will be exported to other js files
var UrlHelper = window.UrlHelper = window.UrlHelper || {};

function get_url_prefix() {
  console.log(window.location.pathname);
  // NOT localhost, get url prefix
  if (!isLocalhost()) {
    var pathname = window.location.pathname;
    var port = pathname.split('/')[1];
    if ($.isNumeric(port)) {
      return '/' + port;
    }
  }
  return '';
}

UrlHelper.url_for = function(url) {
  return url.indexOf('/') === 0 ? (UrlHelper.url_prefix + url) : (UrlHelper.url_prefix + '/' + url);
};


function isLocalhost() {
  return window.location.host.indexOf('localhost:') !== -1;
}
UrlHelper.isLocalhost = isLocalhost;

// Credit: https://gist.github.com/jlong/2428561
UrlHelper.parseURI = function(url) {
  url = url || location.href

  var parser = document.createElement('a');
  parser.href = url;

  // e.g. "http://example.com:3000/pathname/?search=test#hash";

  // parser.protocol; // => "http:"
  // parser.hostname; // => "example.com"
  // parser.port;     // => "3000"
  // parser.pathname; // => "/pathname/"
  // parser.search;   // => "?search=test"
  // parser.hash;     // => "#hash"
  // parser.host;     // => "example.com:3000"  
  return parser
}

UrlHelper.searchUrlbyKey = function(url, key) {
  // searchStr format: "?key1=value1&key2=value2"
  var searchStr = UrlHelper.parseURI(url).search;
  if (searchStr) {
    for (let pair of searchStr.replace(/\?/, '').split('&')) {
      pair = pair.split('=');
      if (pair[0] === key) {
        return pair[1];
      }
    };
  }
}


UrlHelper.url_prefix = get_url_prefix();
UrlHelper.taskid = UrlHelper.searchUrlbyKey(location.href, 'taskid');
UrlHelper.workerid = UrlHelper.searchUrlbyKey(location.href, 'workerid');
UrlHelper.ids = {taskid: UrlHelper.taskid, workerid: UrlHelper.workerid}

UrlHelper.areEqualIds = function(ids) {
  return ids && ids.taskid === UrlHelper.taskid && ids.workerid === UrlHelper.workerid
}

})(jQuery);
