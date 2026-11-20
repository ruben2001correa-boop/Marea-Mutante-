/**
 * Copyright 2018 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *     http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// If the loader is already loaded, just stop.
if (!self.define) {
  let registry = {};

  // Used for `eval` and `importScripts` where we can't get script URL by other means.
  // In both cases, it's safe to use a global var because those functions are synchronous.
  let nextDefineUri;

  const singleRequire = (uri, parentUri) => {
    uri = new URL(uri + ".js", parentUri).href;
    return registry[uri] || (
      
        new Promise(resolve => {
          if ("document" in self) {
            const script = document.createElement("script");
            script.src = uri;
            script.onload = resolve;
            document.head.appendChild(script);
          } else {
            nextDefineUri = uri;
            importScripts(uri);
            resolve();
          }
        })
      
      .then(() => {
        let promise = registry[uri];
        if (!promise) {
          throw new Error(`Module ${uri} didn’t register its module`);
        }
        return promise;
      })
    );
  };

  self.define = (depsNames, factory) => {
    const uri = nextDefineUri || ("document" in self ? document.currentScript.src : "") || location.href;
    if (registry[uri]) {
      // Module is already loading or loaded.
      return;
    }
    let exports = {};
    const require = depUri => singleRequire(depUri, uri);
    const specialDeps = {
      module: { uri },
      exports,
      require
    };
    registry[uri] = Promise.all(depsNames.map(
      depName => specialDeps[depName] || require(depName)
    )).then(deps => {
      factory(...deps);
      return exports;
    });
  };
}
define(['./workbox-afac4cd2'], (function (workbox) { 'use strict';

  self.skipWaiting();
  workbox.clientsClaim();
  /**
   * The precacheAndRoute() method efficiently caches and responds to
   * requests for URLs in the manifest.
   * See https://goo.gl/S9QRab
   */
  workbox.precacheAndRoute([{
    "url": "pwa-maskable-512x512.png",
    "revision": "66da31ead052d0f88e7dfb0e0e9332c9"
  }, {
    "url": "pwa-512x512.png",
    "revision": "6d07ac84739d910b5498d4c126af87b1"
  }, {
    "url": "pwa-192x192.png",
    "revision": "ea9e3f3aecb367163cd3e3d2f44d64a8"
  }, {
    "url": "index.html",
    "revision": "a8e59cef289af38e9fadee99744c9a61"
  }, {
    "url": "icon.svg",
    "revision": "05346da3f6a7f405d640b0915c081a21"
  }, {
    "url": "favicon.ico",
    "revision": "438c1184cd9fd2b6f345f5b84b715c71"
  }, {
    "url": "apple-touch-icon.png",
    "revision": "6dcaab2674405e41ee03cc9543f4e994"
  }, {
    "url": "assets/workbox-window.prod.es5-Bd17z0YL.js",
    "revision": null
  }, {
    "url": "assets/index-BekocPdu.css",
    "revision": null
  }, {
    "url": "assets/index-B0dyJeFv.js",
    "revision": null
  }, {
    "url": "apple-touch-icon.png",
    "revision": "6dcaab2674405e41ee03cc9543f4e994"
  }, {
    "url": "favicon.ico",
    "revision": "438c1184cd9fd2b6f345f5b84b715c71"
  }, {
    "url": "icon.svg",
    "revision": "05346da3f6a7f405d640b0915c081a21"
  }, {
    "url": "pwa-192x192.png",
    "revision": "ea9e3f3aecb367163cd3e3d2f44d64a8"
  }, {
    "url": "pwa-512x512.png",
    "revision": "6d07ac84739d910b5498d4c126af87b1"
  }, {
    "url": "pwa-maskable-512x512.png",
    "revision": "66da31ead052d0f88e7dfb0e0e9332c9"
  }, {
    "url": "manifest.webmanifest",
    "revision": "d066475e2c2ac648c7c2f40f75d8a07a"
  }], {});
  workbox.cleanupOutdatedCaches();
  workbox.registerRoute(new workbox.NavigationRoute(workbox.createHandlerBoundToURL("index.html"), {
    denylist: [/^\/api\//]
  }));
  workbox.registerRoute(/^https:\/\/fonts\.googleapis\.com\/.*/i, new workbox.CacheFirst({
    "cacheName": "google-fonts-cache",
    plugins: [new workbox.ExpirationPlugin({
      maxEntries: 10,
      maxAgeSeconds: 31536000
    }), new workbox.CacheableResponsePlugin({
      statuses: [0, 200]
    })]
  }), 'GET');
  workbox.registerRoute(/^https:\/\/fonts\.gstatic\.com\/.*/i, new workbox.CacheFirst({
    "cacheName": "gstatic-fonts-cache",
    plugins: [new workbox.ExpirationPlugin({
      maxEntries: 10,
      maxAgeSeconds: 31536000
    }), new workbox.CacheableResponsePlugin({
      statuses: [0, 200]
    })]
  }), 'GET');

}));
