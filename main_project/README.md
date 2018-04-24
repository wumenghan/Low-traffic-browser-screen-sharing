# Main project

## Getting Started
```sh
$ npm start
```
Then visit the host/requester and host/worker. Here, host could be either `localhost:PORT` or other crowd.ecn.purdue.edu server

## Resources
* Simulate mouse events <https://github.com/kangax/protolicious/blob/master/event.simulate.js> and <https://stackoverflow.com/questions/6157929/how-to-simulate-a-mouse-click-using-javascript>
* Get Xpath, `getPathTo` - <https://stackoverflow.com/questions/2631820/how-do-i-ensure-saved-click-coordinates-can-be-reloaed-to-the-same-place-even-i/2631931#2631931> and <https://stackoverflow.com/questions/36452390/get-xpath-of-a-dom-element-with-jquery>
* Select by Xpath, `jquery.xpath.js` - <https://stackoverflow.com/questions/6453269/jquery-select-element-by-xpath> and <https://github.com/ilinsky/jquery-xpath>
* Web video player, [video.js](https://videojs.com/) and [videojs-panorama](https://github.com/yanwsh/videojs-panorama) which supports 360 video
* [Free 360 video download](https://www.mettle.com/360vr-master-series-free-360-downloads-page/)
* [Custom Mouse Pointer in JS](https://www.youtube.com/watch?v=QyeBCBYXjfw)


## Fatal Issues with Iframe:
[Hard to Detect Click into Iframe using JavaScript](https://stackoverflow.com/questions/2381336/detect-click-into-iframe-using-javascript)
* We can at most know that we click on Iframe element, but cannot know the clicked elements, let alone simulate mouse events into Iframe
* Therefore, it's impossible to embed Youtube.
* Solution: use [video.js](https://videojs.com/) to load video in the same page.

## Keynotes:
Simulate mouse events on video player
* Have to use "mousedown" and "mouseup", not "click" event
* Must pass the correct clicking XY, not 0,0
* The target is the canvas (created by videojs-panorama), not the video

## TODO:
* Simulate mouse cursor
* Input and Keystroke
* Drag and drop
* Check if we can use any simple Front-end unit testing framework
