'use strict';
const MANIFEST = 'flutter-app-manifest';
const TEMP = 'flutter-temp-cache';
const CACHE_NAME = 'flutter-app-cache';
const RESOURCES = {
  ".git/COMMIT_EDITMSG": "e352bcd6b2f386c4436c4ca480c2764f",
".git/config": "547aa6f7e36abca6829286db2d118a87",
".git/description": "a0a7c3fff21f2aea3cfa1d0316dd816c",
".git/FETCH_HEAD": "e1baefdc2c26f1aa6649ad03f079fdcf",
".git/HEAD": "4cf2d64e44205fe628ddd534e1151b58",
".git/hooks/applypatch-msg.sample": "ce562e08d8098926a3862fc6e7905199",
".git/hooks/commit-msg.sample": "579a3c1e12a1e74a98169175fb913012",
".git/hooks/fsmonitor-watchman.sample": "ea587b0fae70333bce92257152996e70",
".git/hooks/post-update.sample": "2b7ea5cee3c49ff53d41e00785eb974c",
".git/hooks/pre-applypatch.sample": "054f9ffb8bfe04a599751cc757226dda",
".git/hooks/pre-commit.sample": "305eadbbcd6f6d2567e033ad12aabbc4",
".git/hooks/pre-merge-commit.sample": "39cb268e2a85d436b9eb6f47614c3cbc",
".git/hooks/pre-push.sample": "2c642152299a94e05ea26eae11993b13",
".git/hooks/pre-rebase.sample": "56e45f2bcbc8226d2b4200f7c46371bf",
".git/hooks/pre-receive.sample": "2ad18ec82c20af7b5926ed9cea6aeedd",
".git/hooks/prepare-commit-msg.sample": "2b5c047bdb474555e1787db32b2d2fc5",
".git/hooks/push-to-checkout.sample": "c7ab00c7784efeadad3ae9b228d4b4db",
".git/hooks/update.sample": "647ae13c682f7827c22f5fc08a03674e",
".git/index": "16e21067052bc752335eb2c312d1deb7",
".git/info/exclude": "036208b4a1ab4a235d75c181e685e5a3",
".git/logs/HEAD": "4888b48dbc63d04b0812467962e293e9",
".git/logs/refs/heads/master": "4888b48dbc63d04b0812467962e293e9",
".git/logs/refs/remotes/origin/main": "271ae97816620feff96d0488d7150754",
".git/logs/refs/remotes/origin/master": "eb942a97b965765773f2d9ff8004434c",
".git/objects/01/e62703dd45515e239d893e450b9d66b3e8e868": "16a951d9a97572c4767c9b39cfea3b2c",
".git/objects/0b/784a5246e12bd96ad09ff910d1b8163dd3a14e": "161859463139e667bd897c2930a98285",
".git/objects/13/078d75525e03f22c54bcb0604ee201bc37f7b7": "6623e8cb30894664af99edca79695e30",
".git/objects/14/c537225a09a81cb7c0e1550b372266f0a9d6c4": "a800a57e18503c1c5a7bae77a981a940",
".git/objects/18/2a1a3f734fc1b7d712c68b04c29bad9460d6cd": "1bba1f4a35d54be68a427791a2795d4d",
".git/objects/1c/cbdedf456d5945728d92c4544f60f4f59a55e9": "1a40c7fe5236ee089c4a6af4571cf18a",
".git/objects/20/bd8acaa6065959241e2df6a5e46c1c20655795": "34bb7315bd1817a3f95ad46e2623a538",
".git/objects/22/c37ebd0612b50dab3af7e3089d84be29653693": "a13fc52eefd45b323747d85a5da9e31d",
".git/objects/24/6c73e9a12a882414fdd5c973b19bc2e8b3837b": "f638db4d2547a2a6844421dfc3175bc4",
".git/objects/32/46ad559eeae0370195978eaed83f1053ee13fd": "a043dbc0a0bda96ce2127799ccc27506",
".git/objects/3f/2cf3a2932365060b1c2262b490a6f35da08e45": "66d128ab45677cca9764f3fc9bc03a0d",
".git/objects/46/4ab5882a2234c39b1a4dbad5feba0954478155": "2e52a767dc04391de7b4d0beb32e7fc4",
".git/objects/50/38795ea4e4d955e739173079f677ba176376b6": "4627ecb7bd5290d07929bb17c4a8c8d9",
".git/objects/50/92bd0dfb2c66b8594e2217485ce06cbf4e25b7": "468d3325433490cb9039001398a445ac",
".git/objects/54/0720c99263105bd9163838bcd312a122de4073": "dbe779052200a5b5b2c170dc1ddfb44a",
".git/objects/56/819ba03b05489cb388fb8986fc556d2c674c87": "8e8f8d97d069498da8a23a832d3b7d38",
".git/objects/5c/c4e0214ae22b93d32276084770f4d6081fcb55": "ce248de1e6099aa648f1d2f96488548b",
".git/objects/5d/a5f13009b26ee70bebd204fe4b73bd635f8e6b": "2ba6ee925fe6bdd077d0370dc4187ccd",
".git/objects/61/fa2ddb69fb1bd7fd78534027b54a73701bb81c": "edfbc977032f17173e2ea2b236ea76b6",
".git/objects/62/4cc2e14d483ff0139cdb982e1775c06ee4e1ec": "496b3bc6e54de25ffe9544a9a21e43d4",
".git/objects/74/d87277b6f354a33f017a23d279cf117425f2e2": "ea6ec0ba0087ae6e8f912fe72cb9b41d",
".git/objects/76/1e43c595a5ef72e79e17b2c5ff73e9009f4bae": "00934a404d38477e87e455686ac5c1a5",
".git/objects/79/ba7ea0836b93b3f178067bcd0a0945dbc26b3f": "f3e31aec622d6cf63f619aa3a6023103",
".git/objects/7c/c0a4548e6d3a3bf79e985848beb192b21f2ee6": "7fcba90ac722991868bdc4e5b18adb22",
".git/objects/7d/9cea963a491ccd9f0bb1c9fe6a0b78cec53158": "3c03f9c5d62238634d9719c784e1a2b5",
".git/objects/7e/4e65af95035c92d9906ef84d71df23eba7b7f4": "e9d93bd26a56362678b9f710a6c5fad7",
".git/objects/82/37eca29ba7144f19c5d6137a3df134ddb43031": "be2978480ef537fd26d20eb7c31e6e18",
".git/objects/88/4ae421ff4bdcc2b3064d4b99fd9d16e1346edc": "5903377f536687290ac2eff1940de13e",
".git/objects/88/cfd48dff1169879ba46840804b412fe02fefd6": "e42aaae6a4cbfbc9f6326f1fa9e3380c",
".git/objects/8a/aa46ac1ae21512746f852a42ba87e4165dfdd1": "1d8820d345e38b30de033aa4b5a23e7b",
".git/objects/8b/c2d53ce28288d1004a2ea9670fa4571b0343dc": "96cc8c1bdfea4a759dffd59bfb526f8b",
".git/objects/8e/6f8ee63207b1019507db9a6e2c5f116485a221": "7f55758403ae489b1579eeed8e995ab3",
".git/objects/8f/594d8a81cf7a17fdcccc97a42b285397709ea3": "638f32d43af98ff73ddd9982054f968b",
".git/objects/8f/a241159944b86bd5cbdbc7148e1c0ddd083e0d": "1df5790dfa3d78c02fa281fb50971d39",
".git/objects/96/11773c7af15686106aef92ef5a52beefc77eec": "5b2fd210ca632405e7ad7b5a550e6d40",
".git/objects/99/5cda750dee04587d1e171a31860e3f9ec7d070": "081aad8dae0548efac3413a3a9666eb3",
".git/objects/9b/9f1cb09e924476e59e7e7e9baae6d7ae4091ab": "dbf127c56686e96b640fab04c72f18f9",
".git/objects/a1/3837a12450aceaa5c8e807c32e781831d67a8f": "bfe4910ea01eb3d69e9520c3b42a0adf",
".git/objects/a8/beffd3ad4fe54d6cabccf83a05477d6a986cd0": "6677888e4a051c7838b5b240c09f0981",
".git/objects/ab/0e98497a51ead7821d1da35a24968ff314e50f": "557c35fe3928eb2af403d1b3926bb9ba",
".git/objects/af/0a82aeb4025c7447902212ac2d8014f8d58344": "3ee6995a0f1dd492c57c7d0ae335206d",
".git/objects/b3/9c390525c7db16bd53ccde07057d6908964036": "4db1f728f805e596ed928bb79faacc82",
".git/objects/b7/49bfef07473333cf1dd31e9eed89862a5d52aa": "36b4020dca303986cad10924774fb5dc",
".git/objects/b8/9506335e17ff95a2b677cd3a7422bec7b55432": "2e8952e8f45d9ea03a521a2fc4752a05",
".git/objects/b9/2a0d854da9a8f73216c4a0ef07a0f0a44e4373": "f62d1eb7f51165e2a6d2ef1921f976f3",
".git/objects/bb/55b7e3685d2832349dcf4f2ca82693c3023bc0": "e2d90819997cd17bd6886536eeb6c391",
".git/objects/bb/99bab85dc2f978262e3697bf722724cb55e116": "924a16a53f3d84160463cdf306de3f02",
".git/objects/be/9c63f8eef21591c8acb64bf6d3c5992db995d5": "e9995222b85074beb1fb488faf4582d2",
".git/objects/be/faab415004d2883c0c2baa1203d85627a8a75e": "0799e358b1c92ddc59b141c0f8ff3257",
".git/objects/cb/26e778ebc81402a057d2eafb5a2b7b62cb7ae5": "7c633b6b81c4e3eab73f693956d0eb65",
".git/objects/ce/613549003c84ab7459bcb0832c496d25aa28e1": "5028b4037d70057bc30feb8d1b34aa2d",
".git/objects/d2/d461b2983aed9789ba4e4411bd9978a1a29c7a": "dbe7a6b38398dd3d1d2c76ef75446224",
".git/objects/d3/4c2660acb4073f0c761a7e70d1c5ef785a5d62": "d8ed37a284a987a27f82ca9f68f5ba1a",
".git/objects/d6/9c56691fbdb0b7efa65097c7cc1edac12a6d3e": "868ce37a3a78b0606713733248a2f579",
".git/objects/da/656c4e3a937479fae964973448cf5482b1f3be": "24b925d83d18700236911afef8c7a346",
".git/objects/dc/a1e584e40b95e6435a3fe809d7e3e8e71b81e1": "26791f404a9611b6e43e0a031aec0181",
".git/objects/e5/951dfb943474a56e611d9923405cd06c2dd28d": "c6fa51103d8db5478e1a43a661f6c68d",
".git/objects/eb/9b4d76e525556d5d89141648c724331630325d": "37c0954235cbe27c4d93e74fe9a578ef",
".git/objects/f1/469f5b633ce5e59ae67e24495f6c7578002c44": "ce86fb153709db2d8e714886c8627cdd",
".git/objects/ff/ed92856b7d1a8b1ef7d83bfebb5aebca8a36ac": "5747c7392030ec9a0d8f3f0f1ea0fc31",
".git/ORIG_HEAD": "9d540dc82100006ff4ff74fb68b66041",
".git/refs/heads/master": "9f74e655138524c5f30d3253833ff8db",
".git/refs/remotes/origin/main": "ece86cede0fdab825db4addda2c63a4b",
".git/refs/remotes/origin/master": "f3c2c8f0b68a75942fd7e640e21aaaae",
"assets/AssetManifest.json": "7b7859b35b70532dbbac6b1ee6df11f1",
"assets/assets/books.jpg": "6a03024ea69c2c350dcf623a9806c0bb",
"assets/assets/github.png": "438c17272c5f0e9f4a6da34d3e4bc5bd",
"assets/assets/laurenabout.jpg": "7e9482f33ba96e50dbb4287f770d5542",
"assets/assets/laurencar.JPG": "22410c31dc7b831be976395ca2596e05",
"assets/assets/laurengym.jpg": "938aeaccf510e4e5f656e60339f3b588",
"assets/assets/laurenhome.jpg": "148a2873b28f79769b8a349a04521881",
"assets/assets/laurenskiing.jpg": "0c10e5a4daacb8210e4128df888eb9d2",
"assets/assets/laurentennis.PNG": "88142deeaf1d18ad9a203cc7d3290181",
"assets/assets/laurentravel.jpg": "601ba6883c500838c1b4e33f0defd804",
"assets/assets/linkedin.png": "1b18d461ce75c75fdb4d7b6ec08b3e65",
"assets/assets/messalonskeehigh.png": "3f6cd5cfb2ce14a2594a39e61eb7ba5b",
"assets/assets/mountains.jpg": "1aef7ce1e5d2075c82f754ba1e93618a",
"assets/assets/progressengineering.jpg": "696f8ce86ae56d37a8cdf2bdefe73b77",
"assets/assets/theacademies.png": "ab8d47116ab8d0527f4bed03c9e737c8",
"assets/assets/unccharlotte.png": "8d31d851a5abc59534ab45b0b723040c",
"assets/assets/website.PNG": "5ba9aa88402b6ab007be18c0a5ea7297",
"assets/FontManifest.json": "dc3d03800ccca4601324923c0b1d6d57",
"assets/fonts/MaterialIcons-Regular.otf": "4e6447691c9509f7acdbf8a931a85ca1",
"assets/NOTICES": "2dab214df80d82bc295171ccef7617ba",
"assets/packages/cupertino_icons/assets/CupertinoIcons.ttf": "6d342eb68f170c97609e9da345464e5e",
"favicon.png": "5dcef449791fa27946b3d35ad8803796",
"icons/Icon-192.png": "ac9a721a12bbc803b44f645561ecb1e1",
"icons/Icon-512.png": "96e752610906ba2a93c65f8abe1645f1",
"icons/Icon-maskable-192.png": "c457ef57daa1d16f64b27b786ec2ea3c",
"icons/Icon-maskable-512.png": "301a7604d45b3e739efc881eb04896ea",
"index.html": "05aeca954f051aa2059b950cdfefc1d1",
"/": "05aeca954f051aa2059b950cdfefc1d1",
"main.dart.js": "6c0262780e0c834bbb396de30916f154",
"manifest.json": "d899e58ba79eeb01d040664e45f04ea5",
"version.json": "26135e4be13343012ada35bf6692fcf3"
};

// The application shell files that are downloaded before a service worker can
// start.
const CORE = [
  "/",
"main.dart.js",
"index.html",
"assets/NOTICES",
"assets/AssetManifest.json",
"assets/FontManifest.json"];
// During install, the TEMP cache is populated with the application shell files.
self.addEventListener("install", (event) => {
  self.skipWaiting();
  return event.waitUntil(
    caches.open(TEMP).then((cache) => {
      return cache.addAll(
        CORE.map((value) => new Request(value, {'cache': 'reload'})));
    })
  );
});

// During activate, the cache is populated with the temp files downloaded in
// install. If this service worker is upgrading from one with a saved
// MANIFEST, then use this to retain unchanged resource files.
self.addEventListener("activate", function(event) {
  return event.waitUntil(async function() {
    try {
      var contentCache = await caches.open(CACHE_NAME);
      var tempCache = await caches.open(TEMP);
      var manifestCache = await caches.open(MANIFEST);
      var manifest = await manifestCache.match('manifest');
      // When there is no prior manifest, clear the entire cache.
      if (!manifest) {
        await caches.delete(CACHE_NAME);
        contentCache = await caches.open(CACHE_NAME);
        for (var request of await tempCache.keys()) {
          var response = await tempCache.match(request);
          await contentCache.put(request, response);
        }
        await caches.delete(TEMP);
        // Save the manifest to make future upgrades efficient.
        await manifestCache.put('manifest', new Response(JSON.stringify(RESOURCES)));
        return;
      }
      var oldManifest = await manifest.json();
      var origin = self.location.origin;
      for (var request of await contentCache.keys()) {
        var key = request.url.substring(origin.length + 1);
        if (key == "") {
          key = "/";
        }
        // If a resource from the old manifest is not in the new cache, or if
        // the MD5 sum has changed, delete it. Otherwise the resource is left
        // in the cache and can be reused by the new service worker.
        if (!RESOURCES[key] || RESOURCES[key] != oldManifest[key]) {
          await contentCache.delete(request);
        }
      }
      // Populate the cache with the app shell TEMP files, potentially overwriting
      // cache files preserved above.
      for (var request of await tempCache.keys()) {
        var response = await tempCache.match(request);
        await contentCache.put(request, response);
      }
      await caches.delete(TEMP);
      // Save the manifest to make future upgrades efficient.
      await manifestCache.put('manifest', new Response(JSON.stringify(RESOURCES)));
      return;
    } catch (err) {
      // On an unhandled exception the state of the cache cannot be guaranteed.
      console.error('Failed to upgrade service worker: ' + err);
      await caches.delete(CACHE_NAME);
      await caches.delete(TEMP);
      await caches.delete(MANIFEST);
    }
  }());
});

// The fetch handler redirects requests for RESOURCE files to the service
// worker cache.
self.addEventListener("fetch", (event) => {
  if (event.request.method !== 'GET') {
    return;
  }
  var origin = self.location.origin;
  var key = event.request.url.substring(origin.length + 1);
  // Redirect URLs to the index.html
  if (key.indexOf('?v=') != -1) {
    key = key.split('?v=')[0];
  }
  if (event.request.url == origin || event.request.url.startsWith(origin + '/#') || key == '') {
    key = '/';
  }
  // If the URL is not the RESOURCE list then return to signal that the
  // browser should take over.
  if (!RESOURCES[key]) {
    return;
  }
  // If the URL is the index.html, perform an online-first request.
  if (key == '/') {
    return onlineFirst(event);
  }
  event.respondWith(caches.open(CACHE_NAME)
    .then((cache) =>  {
      return cache.match(event.request).then((response) => {
        // Either respond with the cached resource, or perform a fetch and
        // lazily populate the cache.
        return response || fetch(event.request).then((response) => {
          cache.put(event.request, response.clone());
          return response;
        });
      })
    })
  );
});

self.addEventListener('message', (event) => {
  // SkipWaiting can be used to immediately activate a waiting service worker.
  // This will also require a page refresh triggered by the main worker.
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
    return;
  }
  if (event.data === 'downloadOffline') {
    downloadOffline();
    return;
  }
});

// Download offline will check the RESOURCES for all files not in the cache
// and populate them.
async function downloadOffline() {
  var resources = [];
  var contentCache = await caches.open(CACHE_NAME);
  var currentContent = {};
  for (var request of await contentCache.keys()) {
    var key = request.url.substring(origin.length + 1);
    if (key == "") {
      key = "/";
    }
    currentContent[key] = true;
  }
  for (var resourceKey of Object.keys(RESOURCES)) {
    if (!currentContent[resourceKey]) {
      resources.push(resourceKey);
    }
  }
  return contentCache.addAll(resources);
}

// Attempt to download the resource online before falling back to
// the offline cache.
function onlineFirst(event) {
  return event.respondWith(
    fetch(event.request).then((response) => {
      return caches.open(CACHE_NAME).then((cache) => {
        cache.put(event.request, response.clone());
        return response;
      });
    }).catch((error) => {
      return caches.open(CACHE_NAME).then((cache) => {
        return cache.match(event.request).then((response) => {
          if (response != null) {
            return response;
          }
          throw error;
        });
      });
    })
  );
}
