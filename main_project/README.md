# Main project

## Getting Started
```sh
$ python -m SimpleHTTPServer
# Then visit the localhost:8000/requester.html
```

## Resources
* Simulate mouse events <https://github.com/kangax/protolicious/blob/master/event.simulate.js> and <https://stackoverflow.com/questions/6157929/how-to-simulate-a-mouse-click-using-javascript>
* Get Xpath, `getPathTo` - <https://stackoverflow.com/questions/2631820/how-do-i-ensure-saved-click-coordinates-can-be-reloaed-to-the-same-place-even-i/2631931#2631931> and <https://stackoverflow.com/questions/36452390/get-xpath-of-a-dom-element-with-jquery>
* Select by Xpath, `jquery.xpath.js` - <https://stackoverflow.com/questions/6453269/jquery-select-element-by-xpath> and <https://github.com/ilinsky/jquery-xpath>
* Web video player, [video.js](https://videojs.com/) and [videojs-panorama](https://github.com/yanwsh/videojs-panorama) which supports 360 video
* [Free 360 video download](https://www.mettle.com/360vr-master-series-free-360-downloads-page/)


## Fatal Issues with Iframe:
[Hard to Detect Click into Iframe using JavaScript](https://stackoverflow.com/questions/2381336/detect-click-into-iframe-using-javascript)
* We can at most know that we click on Iframe element, but cannot know the clicked elements, let alone simulate mouse events into Iframe
* Therefore, it's impossible to embed Youtube.
* Solution: use [video.js](https://videojs.com/) to load video in the same page.



## TODO:
* Simulate mouse cursor
* Input and Keystroke
* Drag and drop
