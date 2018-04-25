// Author: Gaoping Huang

'use strict';

(function($) {

let openedTaskids = [];

const socket = io(window.location.host, {path: UrlHelper.url_for("/socket.io")})
socket.on("worker_init_status", function(msg) {
  // msg = {width:x, height:y, mouse_pos:[x, y], taskid: x}
  // must open a new window for given msg
  let taskid = msg.taskid;
  if (openedTaskids.indexOf(taskid) === -1) {
    let query = '?mode=realtime&taskid='+taskid
    openedTaskids.push(taskid);
    window.open(UrlHelper.url_for('/requester'+query), "", "width="+msg.width+", height="+msg.height)
  }
});

$(document).ready(function() {

  handleTaskBtns();

});

function handleTaskBtns() {
  $('.btn').on('click', function() {
    let mode = $(this).attr('data-mode');
    let taskid = $(this).attr('data-taskid');
    let query = '?mode='+mode+'&'+'taskid='+taskid
    if (mode === 'realtime') {
      // opens a new tab for worker, for debug
      // in practice, we should wait for workers to open the page
      window.open(UrlHelper.url_for('/worker'+query));
    } else {
      // must opens a new window
      window.open(UrlHelper.url_for("/replay"+query), "", "width=600, height=600");
    }
  })
}


})(jQuery);