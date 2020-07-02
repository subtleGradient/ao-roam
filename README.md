# vivify for RoamReseach

It turns your Roam graph into a personal rapid development environment for building itself.

It's really hard to describe 😜

Here's a video about one tiny piece of it:

[Vivify Roam preview 1 - Watch Video  
![](https://cdn.loom.com/sessions/thumbnails/141fc687332a4ea3b163caebb259d148-with-play.gif)](https://www.loom.com/share/141fc687332a4ea3b163caebb259d148)

## How to enable it using `[[roam/js]]`

1. Add a `{{[[roam/js]]}}` tag
2. Add a child block to it with this code...

```js
import("https://cdn.jsdelivr.net/gh/subtleGradient/ao-roam@fc266accb87db20abda8afcd885009de5bf58db1/index.js")
  .then(({ roam_onInit }) => roam_onInit())
  .catch((e) => console.error(e))
```

3. Press the big red button
4. Change `fc266accb87db20abda8afcd885009de5bf58db1` to the latest hash whenever you're ready to upgrade


## How to enable it using Tampermonkey

```js
// ==UserScript==
// @name         ao/js/roam/onInit
// @namespace    https://subtlegradient.com
// @version      0.2.4
// @description  init vivify
// @author       Thomas Aylott
// @match        https://roamresearch.com/
// @grant        none
// ==/UserScript==

import("https://cdn.jsdelivr.net/gh/subtleGradient/ao-roam@fc266accb87db20abda8afcd885009de5bf58db1/index.js")
  .then(({ roam_onInit }) => roam_onInit())
  .catch((e) => console.error(e))

```

Be sure to change `fc266accb87db20abda8afcd885009de5bf58db1` to the latest hash whenever you're ready to upgrade

