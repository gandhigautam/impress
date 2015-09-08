'use strict';

// Web Application Firewall for Impress Application Server
//
impress.waf = {};

// Register application in WAF
//
impress.waf.addApplication = function(application) {

  application.on('clientConnect', function(client) {
    impress.waf.ip.inc(client.ipInt);
  });

  application.on('clientSession', function(client) {
    impress.waf.sid.inc(client.sid);
  });

  application.on('clientDisconnect', function(client) {
    impress.waf.ip.dec(client.ipInt);
    if (client.sid) impress.waf.sid.dec(client.sid);
  });

};

impress.waf.ACCESS_ALLOWED = 0;
impress.waf.ACCESS_DENIED = 1;
impress.waf.ACCESS_LIMITED = 2;

// Define WAF objects
//
impress.waf.ip = {};
impress.waf.sid = {};
impress.waf.host = {};
impress.waf.url = {};
impress.waf.application = {};
impress.waf.server = {};

// Names of WAF objects
//
impress.waf.objectNames = ['ip', 'sid', 'host', 'url', 'application', 'server'];

// Array of WAF objects
//
impress.waf.objects = impress.waf.objectNames.map(function(objectName) {
  var obj = impress.waf[objectName];
  obj.name = objectName;
  return obj;
});

// Key for IP
//
impress.waf.ip.key = function(client) {
  return client.ipInt;
};

// Key for SID
//
impress.waf.sid.key = function(client) {
  return client.ipInt;
};

// Key for host
//
impress.waf.host.key = function(client) {
  return client.host;
};

// Key for URL
//
impress.waf.url.key = function(client) {
  return client.req.url;
};

// Key for application
//
impress.waf.application.key = function(client) {
  return client.application.name;
};

// Key for server
//
impress.waf.server.key = function(client) {
  return client.server.name;
};

// Check deny and limit restrictions
//
impress.waf.check = function(client) {
  var application = client.application;

  var allowed = true,
      limited = false;

  var key, limit;
  impress.waf.objects.map(function(obj) {
    if (allowed && obj.denied) {
      key = obj.key(client);
      allowed = obj.denied.indexOf(key) === -1;
    }
    if (allowed && !limited && obj.limit) {
      key = obj.key(client);
      if (obj.name === 'ip') {
        limited = obj.limit[key] > client.server.limitIP;
      }
    }
  });

  var code;
  if (!allowed) code = impress.waf.ACCESS_DENIED;
  else if (limited) code = impress.waf.ACCESS_LIMITED;
  else code = impress.waf.ACCESS_ALLOWED;
  return code;
};

// WAF functionality mixins
//
impress.waf.mixins = {};

// Mixin deny() method for waf.ip, waf.host, etc.
//
impress.waf.mixins.deny = function(item) {

  // Denied array
  //
  item.denied = [];

  // Deny IP address
  //
  item.deny = function(key) {
    if (item.denied.indexOf(key) < 0) item.denied.push(key);
  };

};

// Mixin inc/dec() methods for waf.ip, waf.host, etc.
//
impress.waf.mixins.limit = function(item) {

  // Limit counters
  //
  item.limit = {};

  // Inc counter for item
  //
  item.inc = function(key) {
    var limit = item.limit[key];
    if (limit) item.limit[key] = limit + 1;
    else item.limit[key] = 1;
  };

  // Dec counter for item
  //
  item.dec = function(key) {
    var limit = item.limit[key];
    if (limit === 1) delete item.limit[key];
    else item.limit[key] = limit - 1;
  };

};

// Mixin WAF functionality to WAF objects
//
impress.waf.mixin = function(items, mixins) {
  mixins.map(function(mixin) {
    items.map(mixin);
  });
};

impress.waf.mixin([
  impress.waf.ip,
  impress.waf.sid,
  impress.waf.host
], [
  impress.waf.mixins.deny,
  impress.waf.mixins.limit
]);

impress.waf.mixin([
  impress.waf.url,
  impress.waf.application,
  impress.waf.server
], [
  impress.waf.mixins.limit
]);