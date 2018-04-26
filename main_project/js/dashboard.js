// Author: Gaoping Huang

'use strict';

(function($) {

let openedWindows = {};

const socket = io(window.location.host, {path: UrlHelper.url_for("/socket.io")})
socket.on("worker_init_status", function(msg) {
  // msg = {width:x, height:y, mouse_pos:[x, y], taskid: x}
  // must open a new window for given msg
  let taskid = msg.ids.taskid;
  let workerid = msg.ids.workerid;
  let query = `?mode=realtime&taskid=${taskid}&workerid=${workerid}`
  if (!openedWindows[query]) {
    openedWindows[query] = true;
    window.open(UrlHelper.url_for('/requester'+query), "", `width=${msg.width}, height=${msg.height}`)
  }
});

$(document).ready(function() {

  loadCompletedTasks();

});

function loadCompletedTasks() {
  $.ajax({
    method: 'GET',
    url: UrlHelper.url_for('completedTasks'),
    dataType: 'json'
  }).done(function(data) {
    // console.log(data)
    if (!data) return;
    const $container = $('.old-task-list');
    data.forEach((obj) => {
      let $li = $('<li class="old-task-item list-group-item d-flex justify-content-between align-items-center">')
      $li.text(`Completed task ${obj.taskid} by worker ${obj.workerid}`)
      $li.append(`<span class="badge badge-pill">
              <button class="btn btn-info" type="button" data-mode="replay" data-taskid="${obj.taskid}" data-workerid="${obj.workerid}">
                Start replay
              </button>
            </span>`)
      $container.append($li)
    })


    handleTaskBtns();
  }).catch(function(err) {
    console.error(err)
    
    handleTaskBtns();
  })
}

function handleTaskBtns() {
  $('.btn').on('click', function() {
    let mode = $(this).attr('data-mode');
    let taskid = $(this).attr('data-taskid');
    let workerid = $(this).attr('data-workerid') || 0;  // this workerid is for development
    let query = '?mode='+mode+'&'+'taskid='+taskid+'&'+'workerid='+workerid
    if (mode === 'realtime') {
      // opens a new tab for worker, for debug
      // in practice, we should wait for workers to open the page
      window.open(UrlHelper.url_for('/worker'+query));
    } else {
      // must open a new window to allow resize by js
      window.open(UrlHelper.url_for("/replay"+query), "", "width=600, height=600");
    }
  })
}


})(jQuery);