var COMPILED = false;
var goog = goog || {};
goog.global = this;
goog.DEBUG = true;
goog.LOCALE = "en";
goog.provide = function(name) {
  if(!COMPILED) {
    if(goog.isProvided_(name)) {
      throw Error('Namespace "' + name + '" already declared.');
    }
    delete goog.implicitNamespaces_[name];
    var namespace = name;
    while(namespace = namespace.substring(0, namespace.lastIndexOf("."))) {
      if(goog.getObjectByName(namespace)) {
        break
      }
      goog.implicitNamespaces_[namespace] = true
    }
  }
  goog.exportPath_(name)
};
goog.setTestOnly = function(opt_message) {
  if(COMPILED && !goog.DEBUG) {
    opt_message = opt_message || "";
    throw Error("Importing test-only code into non-debug environment" + opt_message ? ": " + opt_message : ".");
  }
};
if(!COMPILED) {
  goog.isProvided_ = function(name) {
    return!goog.implicitNamespaces_[name] && !!goog.getObjectByName(name)
  };
  goog.implicitNamespaces_ = {}
}
goog.exportPath_ = function(name, opt_object, opt_objectToExportTo) {
  var parts = name.split(".");
  var cur = opt_objectToExportTo || goog.global;
  if(!(parts[0] in cur) && cur.execScript) {
    cur.execScript("var " + parts[0])
  }
  for(var part;parts.length && (part = parts.shift());) {
    if(!parts.length && goog.isDef(opt_object)) {
      cur[part] = opt_object
    }else {
      if(cur[part]) {
        cur = cur[part]
      }else {
        cur = cur[part] = {}
      }
    }
  }
};
goog.getObjectByName = function(name, opt_obj) {
  var parts = name.split(".");
  var cur = opt_obj || goog.global;
  for(var part;part = parts.shift();) {
    if(goog.isDefAndNotNull(cur[part])) {
      cur = cur[part]
    }else {
      return null
    }
  }
  return cur
};
goog.globalize = function(obj, opt_global) {
  var global = opt_global || goog.global;
  for(var x in obj) {
    global[x] = obj[x]
  }
};
goog.addDependency = function(relPath, provides, requires) {
  if(!COMPILED) {
    var provide, require;
    var path = relPath.replace(/\\/g, "/");
    var deps = goog.dependencies_;
    for(var i = 0;provide = provides[i];i++) {
      deps.nameToPath[provide] = path;
      if(!(path in deps.pathToNames)) {
        deps.pathToNames[path] = {}
      }
      deps.pathToNames[path][provide] = true
    }
    for(var j = 0;require = requires[j];j++) {
      if(!(path in deps.requires)) {
        deps.requires[path] = {}
      }
      deps.requires[path][require] = true
    }
  }
};
goog.ENABLE_DEBUG_LOADER = true;
goog.require = function(name) {
  if(!COMPILED) {
    if(goog.isProvided_(name)) {
      return
    }
    if(goog.ENABLE_DEBUG_LOADER) {
      var path = goog.getPathFromDeps_(name);
      if(path) {
        goog.included_[path] = true;
        goog.writeScripts_();
        return
      }
    }
    var errorMessage = "goog.require could not find: " + name;
    if(goog.global.console) {
      goog.global.console["error"](errorMessage)
    }
    throw Error(errorMessage);
  }
};
goog.basePath = "";
goog.global.CLOSURE_BASE_PATH;
goog.global.CLOSURE_NO_DEPS;
goog.global.CLOSURE_IMPORT_SCRIPT;
goog.nullFunction = function() {
};
goog.identityFunction = function(var_args) {
  return arguments[0]
};
goog.abstractMethod = function() {
  throw Error("unimplemented abstract method");
};
goog.addSingletonGetter = function(ctor) {
  ctor.getInstance = function() {
    return ctor.instance_ || (ctor.instance_ = new ctor)
  }
};
if(!COMPILED && goog.ENABLE_DEBUG_LOADER) {
  goog.included_ = {};
  goog.dependencies_ = {pathToNames:{}, nameToPath:{}, requires:{}, visited:{}, written:{}};
  goog.inHtmlDocument_ = function() {
    var doc = goog.global.document;
    return typeof doc != "undefined" && "write" in doc
  };
  goog.findBasePath_ = function() {
    if(goog.global.CLOSURE_BASE_PATH) {
      goog.basePath = goog.global.CLOSURE_BASE_PATH;
      return
    }else {
      if(!goog.inHtmlDocument_()) {
        return
      }
    }
    var doc = goog.global.document;
    var scripts = doc.getElementsByTagName("script");
    for(var i = scripts.length - 1;i >= 0;--i) {
      var src = scripts[i].src;
      var qmark = src.lastIndexOf("?");
      var l = qmark == -1 ? src.length : qmark;
      if(src.substr(l - 7, 7) == "base.js") {
        goog.basePath = src.substr(0, l - 7);
        return
      }
    }
  };
  goog.importScript_ = function(src) {
    var importScript = goog.global.CLOSURE_IMPORT_SCRIPT || goog.writeScriptTag_;
    if(!goog.dependencies_.written[src] && importScript(src)) {
      goog.dependencies_.written[src] = true
    }
  };
  goog.writeScriptTag_ = function(src) {
    if(goog.inHtmlDocument_()) {
      var doc = goog.global.document;
      doc.write('<script type="text/javascript" src="' + src + '"></' + "script>");
      return true
    }else {
      return false
    }
  };
  goog.writeScripts_ = function() {
    var scripts = [];
    var seenScript = {};
    var deps = goog.dependencies_;
    function visitNode(path) {
      if(path in deps.written) {
        return
      }
      if(path in deps.visited) {
        if(!(path in seenScript)) {
          seenScript[path] = true;
          scripts.push(path)
        }
        return
      }
      deps.visited[path] = true;
      if(path in deps.requires) {
        for(var requireName in deps.requires[path]) {
          if(!goog.isProvided_(requireName)) {
            if(requireName in deps.nameToPath) {
              visitNode(deps.nameToPath[requireName])
            }else {
              throw Error("Undefined nameToPath for " + requireName);
            }
          }
        }
      }
      if(!(path in seenScript)) {
        seenScript[path] = true;
        scripts.push(path)
      }
    }
    for(var path in goog.included_) {
      if(!deps.written[path]) {
        visitNode(path)
      }
    }
    for(var i = 0;i < scripts.length;i++) {
      if(scripts[i]) {
        goog.importScript_(goog.basePath + scripts[i])
      }else {
        throw Error("Undefined script input");
      }
    }
  };
  goog.getPathFromDeps_ = function(rule) {
    if(rule in goog.dependencies_.nameToPath) {
      return goog.dependencies_.nameToPath[rule]
    }else {
      return null
    }
  };
  goog.findBasePath_();
  if(!goog.global.CLOSURE_NO_DEPS) {
    goog.importScript_(goog.basePath + "deps.js")
  }
}
goog.typeOf = function(value) {
  var s = typeof value;
  if(s == "object") {
    if(value) {
      if(value instanceof Array) {
        return"array"
      }else {
        if(value instanceof Object) {
          return s
        }
      }
      var className = Object.prototype.toString.call(value);
      if(className == "[object Window]") {
        return"object"
      }
      if(className == "[object Array]" || typeof value.length == "number" && typeof value.splice != "undefined" && typeof value.propertyIsEnumerable != "undefined" && !value.propertyIsEnumerable("splice")) {
        return"array"
      }
      if(className == "[object Function]" || typeof value.call != "undefined" && typeof value.propertyIsEnumerable != "undefined" && !value.propertyIsEnumerable("call")) {
        return"function"
      }
    }else {
      return"null"
    }
  }else {
    if(s == "function" && typeof value.call == "undefined") {
      return"object"
    }
  }
  return s
};
goog.propertyIsEnumerableCustom_ = function(object, propName) {
  if(propName in object) {
    for(var key in object) {
      if(key == propName && Object.prototype.hasOwnProperty.call(object, propName)) {
        return true
      }
    }
  }
  return false
};
goog.propertyIsEnumerable_ = function(object, propName) {
  if(object instanceof Object) {
    return Object.prototype.propertyIsEnumerable.call(object, propName)
  }else {
    return goog.propertyIsEnumerableCustom_(object, propName)
  }
};
goog.isDef = function(val) {
  return val !== undefined
};
goog.isNull = function(val) {
  return val === null
};
goog.isDefAndNotNull = function(val) {
  return val != null
};
goog.isArray = function(val) {
  return goog.typeOf(val) == "array"
};
goog.isArrayLike = function(val) {
  var type = goog.typeOf(val);
  return type == "array" || type == "object" && typeof val.length == "number"
};
goog.isDateLike = function(val) {
  return goog.isObject(val) && typeof val.getFullYear == "function"
};
goog.isString = function(val) {
  return typeof val == "string"
};
goog.isBoolean = function(val) {
  return typeof val == "boolean"
};
goog.isNumber = function(val) {
  return typeof val == "number"
};
goog.isFunction = function(val) {
  return goog.typeOf(val) == "function"
};
goog.isObject = function(val) {
  var type = goog.typeOf(val);
  return type == "object" || type == "array" || type == "function"
};
goog.getUid = function(obj) {
  return obj[goog.UID_PROPERTY_] || (obj[goog.UID_PROPERTY_] = ++goog.uidCounter_)
};
goog.removeUid = function(obj) {
  if("removeAttribute" in obj) {
    obj.removeAttribute(goog.UID_PROPERTY_)
  }
  try {
    delete obj[goog.UID_PROPERTY_]
  }catch(ex) {
  }
};
goog.UID_PROPERTY_ = "closure_uid_" + Math.floor(Math.random() * 2147483648).toString(36);
goog.uidCounter_ = 0;
goog.getHashCode = goog.getUid;
goog.removeHashCode = goog.removeUid;
goog.cloneObject = function(obj) {
  var type = goog.typeOf(obj);
  if(type == "object" || type == "array") {
    if(obj.clone) {
      return obj.clone()
    }
    var clone = type == "array" ? [] : {};
    for(var key in obj) {
      clone[key] = goog.cloneObject(obj[key])
    }
    return clone
  }
  return obj
};
Object.prototype.clone;
goog.bindNative_ = function(fn, selfObj, var_args) {
  return fn.call.apply(fn.bind, arguments)
};
goog.bindJs_ = function(fn, selfObj, var_args) {
  if(!fn) {
    throw new Error;
  }
  if(arguments.length > 2) {
    var boundArgs = Array.prototype.slice.call(arguments, 2);
    return function() {
      var newArgs = Array.prototype.slice.call(arguments);
      Array.prototype.unshift.apply(newArgs, boundArgs);
      return fn.apply(selfObj, newArgs)
    }
  }else {
    return function() {
      return fn.apply(selfObj, arguments)
    }
  }
};
goog.bind = function(fn, selfObj, var_args) {
  if(Function.prototype.bind && Function.prototype.bind.toString().indexOf("native code") != -1) {
    goog.bind = goog.bindNative_
  }else {
    goog.bind = goog.bindJs_
  }
  return goog.bind.apply(null, arguments)
};
goog.partial = function(fn, var_args) {
  var args = Array.prototype.slice.call(arguments, 1);
  return function() {
    var newArgs = Array.prototype.slice.call(arguments);
    newArgs.unshift.apply(newArgs, args);
    return fn.apply(this, newArgs)
  }
};
goog.mixin = function(target, source) {
  for(var x in source) {
    target[x] = source[x]
  }
};
goog.now = Date.now || function() {
  return+new Date
};
goog.globalEval = function(script) {
  if(goog.global.execScript) {
    goog.global.execScript(script, "JavaScript")
  }else {
    if(goog.global.eval) {
      if(goog.evalWorksForGlobals_ == null) {
        goog.global.eval("var _et_ = 1;");
        if(typeof goog.global["_et_"] != "undefined") {
          delete goog.global["_et_"];
          goog.evalWorksForGlobals_ = true
        }else {
          goog.evalWorksForGlobals_ = false
        }
      }
      if(goog.evalWorksForGlobals_) {
        goog.global.eval(script)
      }else {
        var doc = goog.global.document;
        var scriptElt = doc.createElement("script");
        scriptElt.type = "text/javascript";
        scriptElt.defer = false;
        scriptElt.appendChild(doc.createTextNode(script));
        doc.body.appendChild(scriptElt);
        doc.body.removeChild(scriptElt)
      }
    }else {
      throw Error("goog.globalEval not available");
    }
  }
};
goog.evalWorksForGlobals_ = null;
goog.cssNameMapping_;
goog.cssNameMappingStyle_;
goog.getCssName = function(className, opt_modifier) {
  var getMapping = function(cssName) {
    return goog.cssNameMapping_[cssName] || cssName
  };
  var renameByParts = function(cssName) {
    var parts = cssName.split("-");
    var mapped = [];
    for(var i = 0;i < parts.length;i++) {
      mapped.push(getMapping(parts[i]))
    }
    return mapped.join("-")
  };
  var rename;
  if(goog.cssNameMapping_) {
    rename = goog.cssNameMappingStyle_ == "BY_WHOLE" ? getMapping : renameByParts
  }else {
    rename = function(a) {
      return a
    }
  }
  if(opt_modifier) {
    return className + "-" + rename(opt_modifier)
  }else {
    return rename(className)
  }
};
goog.setCssNameMapping = function(mapping, opt_style) {
  goog.cssNameMapping_ = mapping;
  goog.cssNameMappingStyle_ = opt_style
};
goog.global.CLOSURE_CSS_NAME_MAPPING;
if(!COMPILED && goog.global.CLOSURE_CSS_NAME_MAPPING) {
  goog.cssNameMapping_ = goog.global.CLOSURE_CSS_NAME_MAPPING
}
goog.getMsg = function(str, opt_values) {
  var values = opt_values || {};
  for(var key in values) {
    var value = ("" + values[key]).replace(/\$/g, "$$$$");
    str = str.replace(new RegExp("\\{\\$" + key + "\\}", "gi"), value)
  }
  return str
};
goog.exportSymbol = function(publicPath, object, opt_objectToExportTo) {
  goog.exportPath_(publicPath, object, opt_objectToExportTo)
};
goog.exportProperty = function(object, publicName, symbol) {
  object[publicName] = symbol
};
goog.inherits = function(childCtor, parentCtor) {
  function tempCtor() {
  }
  tempCtor.prototype = parentCtor.prototype;
  childCtor.superClass_ = parentCtor.prototype;
  childCtor.prototype = new tempCtor;
  childCtor.prototype.constructor = childCtor
};
goog.base = function(me, opt_methodName, var_args) {
  var caller = arguments.callee.caller;
  if(caller.superClass_) {
    return caller.superClass_.constructor.apply(me, Array.prototype.slice.call(arguments, 1))
  }
  var args = Array.prototype.slice.call(arguments, 2);
  var foundCaller = false;
  for(var ctor = me.constructor;ctor;ctor = ctor.superClass_ && ctor.superClass_.constructor) {
    if(ctor.prototype[opt_methodName] === caller) {
      foundCaller = true
    }else {
      if(foundCaller) {
        return ctor.prototype[opt_methodName].apply(me, args)
      }
    }
  }
  if(me[opt_methodName] === caller) {
    return me.constructor.prototype[opt_methodName].apply(me, args)
  }else {
    throw Error("goog.base called from a method of one name " + "to a method of a different name");
  }
};
goog.scope = function(fn) {
  fn.call(goog.global)
};
goog.provide("goog.debug.Error");
goog.debug.Error = function(opt_msg) {
  this.stack = (new Error).stack || "";
  if(opt_msg) {
    this.message = String(opt_msg)
  }
};
goog.inherits(goog.debug.Error, Error);
goog.debug.Error.prototype.name = "CustomError";
goog.provide("goog.string");
goog.provide("goog.string.Unicode");
goog.string.Unicode = {NBSP:"\u00a0"};
goog.string.startsWith = function(str, prefix) {
  return str.lastIndexOf(prefix, 0) == 0
};
goog.string.endsWith = function(str, suffix) {
  var l = str.length - suffix.length;
  return l >= 0 && str.indexOf(suffix, l) == l
};
goog.string.caseInsensitiveStartsWith = function(str, prefix) {
  return goog.string.caseInsensitiveCompare(prefix, str.substr(0, prefix.length)) == 0
};
goog.string.caseInsensitiveEndsWith = function(str, suffix) {
  return goog.string.caseInsensitiveCompare(suffix, str.substr(str.length - suffix.length, suffix.length)) == 0
};
goog.string.subs = function(str, var_args) {
  for(var i = 1;i < arguments.length;i++) {
    var replacement = String(arguments[i]).replace(/\$/g, "$$$$");
    str = str.replace(/\%s/, replacement)
  }
  return str
};
goog.string.collapseWhitespace = function(str) {
  return str.replace(/[\s\xa0]+/g, " ").replace(/^\s+|\s+$/g, "")
};
goog.string.isEmpty = function(str) {
  return/^[\s\xa0]*$/.test(str)
};
goog.string.isEmptySafe = function(str) {
  return goog.string.isEmpty(goog.string.makeSafe(str))
};
goog.string.isBreakingWhitespace = function(str) {
  return!/[^\t\n\r ]/.test(str)
};
goog.string.isAlpha = function(str) {
  return!/[^a-zA-Z]/.test(str)
};
goog.string.isNumeric = function(str) {
  return!/[^0-9]/.test(str)
};
goog.string.isAlphaNumeric = function(str) {
  return!/[^a-zA-Z0-9]/.test(str)
};
goog.string.isSpace = function(ch) {
  return ch == " "
};
goog.string.isUnicodeChar = function(ch) {
  return ch.length == 1 && ch >= " " && ch <= "~" || ch >= "\u0080" && ch <= "\ufffd"
};
goog.string.stripNewlines = function(str) {
  return str.replace(/(\r\n|\r|\n)+/g, " ")
};
goog.string.canonicalizeNewlines = function(str) {
  return str.replace(/(\r\n|\r|\n)/g, "\n")
};
goog.string.normalizeWhitespace = function(str) {
  return str.replace(/\xa0|\s/g, " ")
};
goog.string.normalizeSpaces = function(str) {
  return str.replace(/\xa0|[ \t]+/g, " ")
};
goog.string.collapseBreakingSpaces = function(str) {
  return str.replace(/[\t\r\n ]+/g, " ").replace(/^[\t\r\n ]+|[\t\r\n ]+$/g, "")
};
goog.string.trim = function(str) {
  return str.replace(/^[\s\xa0]+|[\s\xa0]+$/g, "")
};
goog.string.trimLeft = function(str) {
  return str.replace(/^[\s\xa0]+/, "")
};
goog.string.trimRight = function(str) {
  return str.replace(/[\s\xa0]+$/, "")
};
goog.string.caseInsensitiveCompare = function(str1, str2) {
  var test1 = String(str1).toLowerCase();
  var test2 = String(str2).toLowerCase();
  if(test1 < test2) {
    return-1
  }else {
    if(test1 == test2) {
      return 0
    }else {
      return 1
    }
  }
};
goog.string.numerateCompareRegExp_ = /(\.\d+)|(\d+)|(\D+)/g;
goog.string.numerateCompare = function(str1, str2) {
  if(str1 == str2) {
    return 0
  }
  if(!str1) {
    return-1
  }
  if(!str2) {
    return 1
  }
  var tokens1 = str1.toLowerCase().match(goog.string.numerateCompareRegExp_);
  var tokens2 = str2.toLowerCase().match(goog.string.numerateCompareRegExp_);
  var count = Math.min(tokens1.length, tokens2.length);
  for(var i = 0;i < count;i++) {
    var a = tokens1[i];
    var b = tokens2[i];
    if(a != b) {
      var num1 = parseInt(a, 10);
      if(!isNaN(num1)) {
        var num2 = parseInt(b, 10);
        if(!isNaN(num2) && num1 - num2) {
          return num1 - num2
        }
      }
      return a < b ? -1 : 1
    }
  }
  if(tokens1.length != tokens2.length) {
    return tokens1.length - tokens2.length
  }
  return str1 < str2 ? -1 : 1
};
goog.string.encodeUriRegExp_ = /^[a-zA-Z0-9\-_.!~*'()]*$/;
goog.string.urlEncode = function(str) {
  str = String(str);
  if(!goog.string.encodeUriRegExp_.test(str)) {
    return encodeURIComponent(str)
  }
  return str
};
goog.string.urlDecode = function(str) {
  return decodeURIComponent(str.replace(/\+/g, " "))
};
goog.string.newLineToBr = function(str, opt_xml) {
  return str.replace(/(\r\n|\r|\n)/g, opt_xml ? "<br />" : "<br>")
};
goog.string.htmlEscape = function(str, opt_isLikelyToContainHtmlChars) {
  if(opt_isLikelyToContainHtmlChars) {
    return str.replace(goog.string.amperRe_, "&amp;").replace(goog.string.ltRe_, "&lt;").replace(goog.string.gtRe_, "&gt;").replace(goog.string.quotRe_, "&quot;")
  }else {
    if(!goog.string.allRe_.test(str)) {
      return str
    }
    if(str.indexOf("&") != -1) {
      str = str.replace(goog.string.amperRe_, "&amp;")
    }
    if(str.indexOf("<") != -1) {
      str = str.replace(goog.string.ltRe_, "&lt;")
    }
    if(str.indexOf(">") != -1) {
      str = str.replace(goog.string.gtRe_, "&gt;")
    }
    if(str.indexOf('"') != -1) {
      str = str.replace(goog.string.quotRe_, "&quot;")
    }
    return str
  }
};
goog.string.amperRe_ = /&/g;
goog.string.ltRe_ = /</g;
goog.string.gtRe_ = />/g;
goog.string.quotRe_ = /\"/g;
goog.string.allRe_ = /[&<>\"]/;
goog.string.unescapeEntities = function(str) {
  if(goog.string.contains(str, "&")) {
    if("document" in goog.global) {
      return goog.string.unescapeEntitiesUsingDom_(str)
    }else {
      return goog.string.unescapePureXmlEntities_(str)
    }
  }
  return str
};
goog.string.unescapeEntitiesUsingDom_ = function(str) {
  var seen = {"&amp;":"&", "&lt;":"<", "&gt;":">", "&quot;":'"'};
  var div = document.createElement("div");
  return str.replace(goog.string.HTML_ENTITY_PATTERN_, function(s, entity) {
    var value = seen[s];
    if(value) {
      return value
    }
    if(entity.charAt(0) == "#") {
      var n = Number("0" + entity.substr(1));
      if(!isNaN(n)) {
        value = String.fromCharCode(n)
      }
    }
    if(!value) {
      div.innerHTML = s + " ";
      value = div.firstChild.nodeValue.slice(0, -1)
    }
    return seen[s] = value
  })
};
goog.string.unescapePureXmlEntities_ = function(str) {
  return str.replace(/&([^;]+);/g, function(s, entity) {
    switch(entity) {
      case "amp":
        return"&";
      case "lt":
        return"<";
      case "gt":
        return">";
      case "quot":
        return'"';
      default:
        if(entity.charAt(0) == "#") {
          var n = Number("0" + entity.substr(1));
          if(!isNaN(n)) {
            return String.fromCharCode(n)
          }
        }
        return s
    }
  })
};
goog.string.HTML_ENTITY_PATTERN_ = /&([^;\s<&]+);?/g;
goog.string.whitespaceEscape = function(str, opt_xml) {
  return goog.string.newLineToBr(str.replace(/  /g, " &#160;"), opt_xml)
};
goog.string.stripQuotes = function(str, quoteChars) {
  var length = quoteChars.length;
  for(var i = 0;i < length;i++) {
    var quoteChar = length == 1 ? quoteChars : quoteChars.charAt(i);
    if(str.charAt(0) == quoteChar && str.charAt(str.length - 1) == quoteChar) {
      return str.substring(1, str.length - 1)
    }
  }
  return str
};
goog.string.truncate = function(str, chars, opt_protectEscapedCharacters) {
  if(opt_protectEscapedCharacters) {
    str = goog.string.unescapeEntities(str)
  }
  if(str.length > chars) {
    str = str.substring(0, chars - 3) + "..."
  }
  if(opt_protectEscapedCharacters) {
    str = goog.string.htmlEscape(str)
  }
  return str
};
goog.string.truncateMiddle = function(str, chars, opt_protectEscapedCharacters, opt_trailingChars) {
  if(opt_protectEscapedCharacters) {
    str = goog.string.unescapeEntities(str)
  }
  if(opt_trailingChars && str.length > chars) {
    if(opt_trailingChars > chars) {
      opt_trailingChars = chars
    }
    var endPoint = str.length - opt_trailingChars;
    var startPoint = chars - opt_trailingChars;
    str = str.substring(0, startPoint) + "..." + str.substring(endPoint)
  }else {
    if(str.length > chars) {
      var half = Math.floor(chars / 2);
      var endPos = str.length - half;
      half += chars % 2;
      str = str.substring(0, half) + "..." + str.substring(endPos)
    }
  }
  if(opt_protectEscapedCharacters) {
    str = goog.string.htmlEscape(str)
  }
  return str
};
goog.string.specialEscapeChars_ = {"\x00":"\\0", "\u0008":"\\b", "\u000c":"\\f", "\n":"\\n", "\r":"\\r", "\t":"\\t", "\x0B":"\\x0B", '"':'\\"', "\\":"\\\\"};
goog.string.jsEscapeCache_ = {"'":"\\'"};
goog.string.quote = function(s) {
  s = String(s);
  if(s.quote) {
    return s.quote()
  }else {
    var sb = ['"'];
    for(var i = 0;i < s.length;i++) {
      var ch = s.charAt(i);
      var cc = ch.charCodeAt(0);
      sb[i + 1] = goog.string.specialEscapeChars_[ch] || (cc > 31 && cc < 127 ? ch : goog.string.escapeChar(ch))
    }
    sb.push('"');
    return sb.join("")
  }
};
goog.string.escapeString = function(str) {
  var sb = [];
  for(var i = 0;i < str.length;i++) {
    sb[i] = goog.string.escapeChar(str.charAt(i))
  }
  return sb.join("")
};
goog.string.escapeChar = function(c) {
  if(c in goog.string.jsEscapeCache_) {
    return goog.string.jsEscapeCache_[c]
  }
  if(c in goog.string.specialEscapeChars_) {
    return goog.string.jsEscapeCache_[c] = goog.string.specialEscapeChars_[c]
  }
  var rv = c;
  var cc = c.charCodeAt(0);
  if(cc > 31 && cc < 127) {
    rv = c
  }else {
    if(cc < 256) {
      rv = "\\x";
      if(cc < 16 || cc > 256) {
        rv += "0"
      }
    }else {
      rv = "\\u";
      if(cc < 4096) {
        rv += "0"
      }
    }
    rv += cc.toString(16).toUpperCase()
  }
  return goog.string.jsEscapeCache_[c] = rv
};
goog.string.toMap = function(s) {
  var rv = {};
  for(var i = 0;i < s.length;i++) {
    rv[s.charAt(i)] = true
  }
  return rv
};
goog.string.contains = function(s, ss) {
  return s.indexOf(ss) != -1
};
goog.string.removeAt = function(s, index, stringLength) {
  var resultStr = s;
  if(index >= 0 && index < s.length && stringLength > 0) {
    resultStr = s.substr(0, index) + s.substr(index + stringLength, s.length - index - stringLength)
  }
  return resultStr
};
goog.string.remove = function(s, ss) {
  var re = new RegExp(goog.string.regExpEscape(ss), "");
  return s.replace(re, "")
};
goog.string.removeAll = function(s, ss) {
  var re = new RegExp(goog.string.regExpEscape(ss), "g");
  return s.replace(re, "")
};
goog.string.regExpEscape = function(s) {
  return String(s).replace(/([-()\[\]{}+?*.$\^|,:#<!\\])/g, "\\$1").replace(/\x08/g, "\\x08")
};
goog.string.repeat = function(string, length) {
  return(new Array(length + 1)).join(string)
};
goog.string.padNumber = function(num, length, opt_precision) {
  var s = goog.isDef(opt_precision) ? num.toFixed(opt_precision) : String(num);
  var index = s.indexOf(".");
  if(index == -1) {
    index = s.length
  }
  return goog.string.repeat("0", Math.max(0, length - index)) + s
};
goog.string.makeSafe = function(obj) {
  return obj == null ? "" : String(obj)
};
goog.string.buildString = function(var_args) {
  return Array.prototype.join.call(arguments, "")
};
goog.string.getRandomString = function() {
  var x = 2147483648;
  return Math.floor(Math.random() * x).toString(36) + Math.abs(Math.floor(Math.random() * x) ^ goog.now()).toString(36)
};
goog.string.compareVersions = function(version1, version2) {
  var order = 0;
  var v1Subs = goog.string.trim(String(version1)).split(".");
  var v2Subs = goog.string.trim(String(version2)).split(".");
  var subCount = Math.max(v1Subs.length, v2Subs.length);
  for(var subIdx = 0;order == 0 && subIdx < subCount;subIdx++) {
    var v1Sub = v1Subs[subIdx] || "";
    var v2Sub = v2Subs[subIdx] || "";
    var v1CompParser = new RegExp("(\\d*)(\\D*)", "g");
    var v2CompParser = new RegExp("(\\d*)(\\D*)", "g");
    do {
      var v1Comp = v1CompParser.exec(v1Sub) || ["", "", ""];
      var v2Comp = v2CompParser.exec(v2Sub) || ["", "", ""];
      if(v1Comp[0].length == 0 && v2Comp[0].length == 0) {
        break
      }
      var v1CompNum = v1Comp[1].length == 0 ? 0 : parseInt(v1Comp[1], 10);
      var v2CompNum = v2Comp[1].length == 0 ? 0 : parseInt(v2Comp[1], 10);
      order = goog.string.compareElements_(v1CompNum, v2CompNum) || goog.string.compareElements_(v1Comp[2].length == 0, v2Comp[2].length == 0) || goog.string.compareElements_(v1Comp[2], v2Comp[2])
    }while(order == 0)
  }
  return order
};
goog.string.compareElements_ = function(left, right) {
  if(left < right) {
    return-1
  }else {
    if(left > right) {
      return 1
    }
  }
  return 0
};
goog.string.HASHCODE_MAX_ = 4294967296;
goog.string.hashCode = function(str) {
  var result = 0;
  for(var i = 0;i < str.length;++i) {
    result = 31 * result + str.charCodeAt(i);
    result %= goog.string.HASHCODE_MAX_
  }
  return result
};
goog.string.uniqueStringCounter_ = Math.random() * 2147483648 | 0;
goog.string.createUniqueString = function() {
  return"goog_" + goog.string.uniqueStringCounter_++
};
goog.string.toNumber = function(str) {
  var num = Number(str);
  if(num == 0 && goog.string.isEmpty(str)) {
    return NaN
  }
  return num
};
goog.string.toCamelCaseCache_ = {};
goog.string.toCamelCase = function(str) {
  return goog.string.toCamelCaseCache_[str] || (goog.string.toCamelCaseCache_[str] = String(str).replace(/\-([a-z])/g, function(all, match) {
    return match.toUpperCase()
  }))
};
goog.string.toSelectorCaseCache_ = {};
goog.string.toSelectorCase = function(str) {
  return goog.string.toSelectorCaseCache_[str] || (goog.string.toSelectorCaseCache_[str] = String(str).replace(/([A-Z])/g, "-$1").toLowerCase())
};
goog.provide("goog.asserts");
goog.provide("goog.asserts.AssertionError");
goog.require("goog.debug.Error");
goog.require("goog.string");
goog.asserts.ENABLE_ASSERTS = goog.DEBUG;
goog.asserts.AssertionError = function(messagePattern, messageArgs) {
  messageArgs.unshift(messagePattern);
  goog.debug.Error.call(this, goog.string.subs.apply(null, messageArgs));
  messageArgs.shift();
  this.messagePattern = messagePattern
};
goog.inherits(goog.asserts.AssertionError, goog.debug.Error);
goog.asserts.AssertionError.prototype.name = "AssertionError";
goog.asserts.doAssertFailure_ = function(defaultMessage, defaultArgs, givenMessage, givenArgs) {
  var message = "Assertion failed";
  if(givenMessage) {
    message += ": " + givenMessage;
    var args = givenArgs
  }else {
    if(defaultMessage) {
      message += ": " + defaultMessage;
      args = defaultArgs
    }
  }
  throw new goog.asserts.AssertionError("" + message, args || []);
};
goog.asserts.assert = function(condition, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !condition) {
    goog.asserts.doAssertFailure_("", null, opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return condition
};
goog.asserts.fail = function(opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS) {
    throw new goog.asserts.AssertionError("Failure" + (opt_message ? ": " + opt_message : ""), Array.prototype.slice.call(arguments, 1));
  }
};
goog.asserts.assertNumber = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isNumber(value)) {
    goog.asserts.doAssertFailure_("Expected number but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertString = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isString(value)) {
    goog.asserts.doAssertFailure_("Expected string but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertFunction = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isFunction(value)) {
    goog.asserts.doAssertFailure_("Expected function but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertObject = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isObject(value)) {
    goog.asserts.doAssertFailure_("Expected object but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertArray = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isArray(value)) {
    goog.asserts.doAssertFailure_("Expected array but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertBoolean = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isBoolean(value)) {
    goog.asserts.doAssertFailure_("Expected boolean but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertInstanceof = function(value, type, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !(value instanceof type)) {
    goog.asserts.doAssertFailure_("instanceof check failed.", null, opt_message, Array.prototype.slice.call(arguments, 3))
  }
};
goog.provide("goog.array");
goog.provide("goog.array.ArrayLike");
goog.require("goog.asserts");
goog.NATIVE_ARRAY_PROTOTYPES = true;
goog.array.ArrayLike;
goog.array.peek = function(array) {
  return array[array.length - 1]
};
goog.array.ARRAY_PROTOTYPE_ = Array.prototype;
goog.array.indexOf = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.indexOf ? function(arr, obj, opt_fromIndex) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.indexOf.call(arr, obj, opt_fromIndex)
} : function(arr, obj, opt_fromIndex) {
  var fromIndex = opt_fromIndex == null ? 0 : opt_fromIndex < 0 ? Math.max(0, arr.length + opt_fromIndex) : opt_fromIndex;
  if(goog.isString(arr)) {
    if(!goog.isString(obj) || obj.length != 1) {
      return-1
    }
    return arr.indexOf(obj, fromIndex)
  }
  for(var i = fromIndex;i < arr.length;i++) {
    if(i in arr && arr[i] === obj) {
      return i
    }
  }
  return-1
};
goog.array.lastIndexOf = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.lastIndexOf ? function(arr, obj, opt_fromIndex) {
  goog.asserts.assert(arr.length != null);
  var fromIndex = opt_fromIndex == null ? arr.length - 1 : opt_fromIndex;
  return goog.array.ARRAY_PROTOTYPE_.lastIndexOf.call(arr, obj, fromIndex)
} : function(arr, obj, opt_fromIndex) {
  var fromIndex = opt_fromIndex == null ? arr.length - 1 : opt_fromIndex;
  if(fromIndex < 0) {
    fromIndex = Math.max(0, arr.length + fromIndex)
  }
  if(goog.isString(arr)) {
    if(!goog.isString(obj) || obj.length != 1) {
      return-1
    }
    return arr.lastIndexOf(obj, fromIndex)
  }
  for(var i = fromIndex;i >= 0;i--) {
    if(i in arr && arr[i] === obj) {
      return i
    }
  }
  return-1
};
goog.array.forEach = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.forEach ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  goog.array.ARRAY_PROTOTYPE_.forEach.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2) {
      f.call(opt_obj, arr2[i], i, arr)
    }
  }
};
goog.array.forEachRight = function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = l - 1;i >= 0;--i) {
    if(i in arr2) {
      f.call(opt_obj, arr2[i], i, arr)
    }
  }
};
goog.array.filter = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.filter ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.filter.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var res = [];
  var resLength = 0;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2) {
      var val = arr2[i];
      if(f.call(opt_obj, val, i, arr)) {
        res[resLength++] = val
      }
    }
  }
  return res
};
goog.array.map = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.map ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.map.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var res = new Array(l);
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2) {
      res[i] = f.call(opt_obj, arr2[i], i, arr)
    }
  }
  return res
};
goog.array.reduce = function(arr, f, val, opt_obj) {
  if(arr.reduce) {
    if(opt_obj) {
      return arr.reduce(goog.bind(f, opt_obj), val)
    }else {
      return arr.reduce(f, val)
    }
  }
  var rval = val;
  goog.array.forEach(arr, function(val, index) {
    rval = f.call(opt_obj, rval, val, index, arr)
  });
  return rval
};
goog.array.reduceRight = function(arr, f, val, opt_obj) {
  if(arr.reduceRight) {
    if(opt_obj) {
      return arr.reduceRight(goog.bind(f, opt_obj), val)
    }else {
      return arr.reduceRight(f, val)
    }
  }
  var rval = val;
  goog.array.forEachRight(arr, function(val, index) {
    rval = f.call(opt_obj, rval, val, index, arr)
  });
  return rval
};
goog.array.some = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.some ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.some.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2 && f.call(opt_obj, arr2[i], i, arr)) {
      return true
    }
  }
  return false
};
goog.array.every = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.every ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.every.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2 && !f.call(opt_obj, arr2[i], i, arr)) {
      return false
    }
  }
  return true
};
goog.array.find = function(arr, f, opt_obj) {
  var i = goog.array.findIndex(arr, f, opt_obj);
  return i < 0 ? null : goog.isString(arr) ? arr.charAt(i) : arr[i]
};
goog.array.findIndex = function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2 && f.call(opt_obj, arr2[i], i, arr)) {
      return i
    }
  }
  return-1
};
goog.array.findRight = function(arr, f, opt_obj) {
  var i = goog.array.findIndexRight(arr, f, opt_obj);
  return i < 0 ? null : goog.isString(arr) ? arr.charAt(i) : arr[i]
};
goog.array.findIndexRight = function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = l - 1;i >= 0;i--) {
    if(i in arr2 && f.call(opt_obj, arr2[i], i, arr)) {
      return i
    }
  }
  return-1
};
goog.array.contains = function(arr, obj) {
  return goog.array.indexOf(arr, obj) >= 0
};
goog.array.isEmpty = function(arr) {
  return arr.length == 0
};
goog.array.clear = function(arr) {
  if(!goog.isArray(arr)) {
    for(var i = arr.length - 1;i >= 0;i--) {
      delete arr[i]
    }
  }
  arr.length = 0
};
goog.array.insert = function(arr, obj) {
  if(!goog.array.contains(arr, obj)) {
    arr.push(obj)
  }
};
goog.array.insertAt = function(arr, obj, opt_i) {
  goog.array.splice(arr, opt_i, 0, obj)
};
goog.array.insertArrayAt = function(arr, elementsToAdd, opt_i) {
  goog.partial(goog.array.splice, arr, opt_i, 0).apply(null, elementsToAdd)
};
goog.array.insertBefore = function(arr, obj, opt_obj2) {
  var i;
  if(arguments.length == 2 || (i = goog.array.indexOf(arr, opt_obj2)) < 0) {
    arr.push(obj)
  }else {
    goog.array.insertAt(arr, obj, i)
  }
};
goog.array.remove = function(arr, obj) {
  var i = goog.array.indexOf(arr, obj);
  var rv;
  if(rv = i >= 0) {
    goog.array.removeAt(arr, i)
  }
  return rv
};
goog.array.removeAt = function(arr, i) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.splice.call(arr, i, 1).length == 1
};
goog.array.removeIf = function(arr, f, opt_obj) {
  var i = goog.array.findIndex(arr, f, opt_obj);
  if(i >= 0) {
    goog.array.removeAt(arr, i);
    return true
  }
  return false
};
goog.array.concat = function(var_args) {
  return goog.array.ARRAY_PROTOTYPE_.concat.apply(goog.array.ARRAY_PROTOTYPE_, arguments)
};
goog.array.clone = function(arr) {
  if(goog.isArray(arr)) {
    return goog.array.concat(arr)
  }else {
    var rv = [];
    for(var i = 0, len = arr.length;i < len;i++) {
      rv[i] = arr[i]
    }
    return rv
  }
};
goog.array.toArray = function(object) {
  if(goog.isArray(object)) {
    return goog.array.concat(object)
  }
  return goog.array.clone(object)
};
goog.array.extend = function(arr1, var_args) {
  for(var i = 1;i < arguments.length;i++) {
    var arr2 = arguments[i];
    var isArrayLike;
    if(goog.isArray(arr2) || (isArrayLike = goog.isArrayLike(arr2)) && arr2.hasOwnProperty("callee")) {
      arr1.push.apply(arr1, arr2)
    }else {
      if(isArrayLike) {
        var len1 = arr1.length;
        var len2 = arr2.length;
        for(var j = 0;j < len2;j++) {
          arr1[len1 + j] = arr2[j]
        }
      }else {
        arr1.push(arr2)
      }
    }
  }
};
goog.array.splice = function(arr, index, howMany, var_args) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.splice.apply(arr, goog.array.slice(arguments, 1))
};
goog.array.slice = function(arr, start, opt_end) {
  goog.asserts.assert(arr.length != null);
  if(arguments.length <= 2) {
    return goog.array.ARRAY_PROTOTYPE_.slice.call(arr, start)
  }else {
    return goog.array.ARRAY_PROTOTYPE_.slice.call(arr, start, opt_end)
  }
};
goog.array.removeDuplicates = function(arr, opt_rv) {
  var returnArray = opt_rv || arr;
  var seen = {}, cursorInsert = 0, cursorRead = 0;
  while(cursorRead < arr.length) {
    var current = arr[cursorRead++];
    var key = goog.isObject(current) ? "o" + goog.getUid(current) : (typeof current).charAt(0) + current;
    if(!Object.prototype.hasOwnProperty.call(seen, key)) {
      seen[key] = true;
      returnArray[cursorInsert++] = current
    }
  }
  returnArray.length = cursorInsert
};
goog.array.binarySearch = function(arr, target, opt_compareFn) {
  return goog.array.binarySearch_(arr, opt_compareFn || goog.array.defaultCompare, false, target)
};
goog.array.binarySelect = function(arr, evaluator, opt_obj) {
  return goog.array.binarySearch_(arr, evaluator, true, undefined, opt_obj)
};
goog.array.binarySearch_ = function(arr, compareFn, isEvaluator, opt_target, opt_selfObj) {
  var left = 0;
  var right = arr.length;
  var found;
  while(left < right) {
    var middle = left + right >> 1;
    var compareResult;
    if(isEvaluator) {
      compareResult = compareFn.call(opt_selfObj, arr[middle], middle, arr)
    }else {
      compareResult = compareFn(opt_target, arr[middle])
    }
    if(compareResult > 0) {
      left = middle + 1
    }else {
      right = middle;
      found = !compareResult
    }
  }
  return found ? left : ~left
};
goog.array.sort = function(arr, opt_compareFn) {
  goog.asserts.assert(arr.length != null);
  goog.array.ARRAY_PROTOTYPE_.sort.call(arr, opt_compareFn || goog.array.defaultCompare)
};
goog.array.stableSort = function(arr, opt_compareFn) {
  for(var i = 0;i < arr.length;i++) {
    arr[i] = {index:i, value:arr[i]}
  }
  var valueCompareFn = opt_compareFn || goog.array.defaultCompare;
  function stableCompareFn(obj1, obj2) {
    return valueCompareFn(obj1.value, obj2.value) || obj1.index - obj2.index
  }
  goog.array.sort(arr, stableCompareFn);
  for(var i = 0;i < arr.length;i++) {
    arr[i] = arr[i].value
  }
};
goog.array.sortObjectsByKey = function(arr, key, opt_compareFn) {
  var compare = opt_compareFn || goog.array.defaultCompare;
  goog.array.sort(arr, function(a, b) {
    return compare(a[key], b[key])
  })
};
goog.array.isSorted = function(arr, opt_compareFn, opt_strict) {
  var compare = opt_compareFn || goog.array.defaultCompare;
  for(var i = 1;i < arr.length;i++) {
    var compareResult = compare(arr[i - 1], arr[i]);
    if(compareResult > 0 || compareResult == 0 && opt_strict) {
      return false
    }
  }
  return true
};
goog.array.equals = function(arr1, arr2, opt_equalsFn) {
  if(!goog.isArrayLike(arr1) || !goog.isArrayLike(arr2) || arr1.length != arr2.length) {
    return false
  }
  var l = arr1.length;
  var equalsFn = opt_equalsFn || goog.array.defaultCompareEquality;
  for(var i = 0;i < l;i++) {
    if(!equalsFn(arr1[i], arr2[i])) {
      return false
    }
  }
  return true
};
goog.array.compare = function(arr1, arr2, opt_equalsFn) {
  return goog.array.equals(arr1, arr2, opt_equalsFn)
};
goog.array.compare3 = function(arr1, arr2, opt_compareFn) {
  var compare = opt_compareFn || goog.array.defaultCompare;
  var l = Math.min(arr1.length, arr2.length);
  for(var i = 0;i < l;i++) {
    var result = compare(arr1[i], arr2[i]);
    if(result != 0) {
      return result
    }
  }
  return goog.array.defaultCompare(arr1.length, arr2.length)
};
goog.array.defaultCompare = function(a, b) {
  return a > b ? 1 : a < b ? -1 : 0
};
goog.array.defaultCompareEquality = function(a, b) {
  return a === b
};
goog.array.binaryInsert = function(array, value, opt_compareFn) {
  var index = goog.array.binarySearch(array, value, opt_compareFn);
  if(index < 0) {
    goog.array.insertAt(array, value, -(index + 1));
    return true
  }
  return false
};
goog.array.binaryRemove = function(array, value, opt_compareFn) {
  var index = goog.array.binarySearch(array, value, opt_compareFn);
  return index >= 0 ? goog.array.removeAt(array, index) : false
};
goog.array.bucket = function(array, sorter) {
  var buckets = {};
  for(var i = 0;i < array.length;i++) {
    var value = array[i];
    var key = sorter(value, i, array);
    if(goog.isDef(key)) {
      var bucket = buckets[key] || (buckets[key] = []);
      bucket.push(value)
    }
  }
  return buckets
};
goog.array.repeat = function(value, n) {
  var array = [];
  for(var i = 0;i < n;i++) {
    array[i] = value
  }
  return array
};
goog.array.flatten = function(var_args) {
  var result = [];
  for(var i = 0;i < arguments.length;i++) {
    var element = arguments[i];
    if(goog.isArray(element)) {
      result.push.apply(result, goog.array.flatten.apply(null, element))
    }else {
      result.push(element)
    }
  }
  return result
};
goog.array.rotate = function(array, n) {
  goog.asserts.assert(array.length != null);
  if(array.length) {
    n %= array.length;
    if(n > 0) {
      goog.array.ARRAY_PROTOTYPE_.unshift.apply(array, array.splice(-n, n))
    }else {
      if(n < 0) {
        goog.array.ARRAY_PROTOTYPE_.push.apply(array, array.splice(0, -n))
      }
    }
  }
  return array
};
goog.array.zip = function(var_args) {
  if(!arguments.length) {
    return[]
  }
  var result = [];
  for(var i = 0;true;i++) {
    var value = [];
    for(var j = 0;j < arguments.length;j++) {
      var arr = arguments[j];
      if(i >= arr.length) {
        return result
      }
      value.push(arr[i])
    }
    result.push(value)
  }
};
goog.array.shuffle = function(arr, opt_randFn) {
  var randFn = opt_randFn || Math.random;
  for(var i = arr.length - 1;i > 0;i--) {
    var j = Math.floor(randFn() * (i + 1));
    var tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp
  }
};
goog.provide("goog.object");
goog.object.forEach = function(obj, f, opt_obj) {
  for(var key in obj) {
    f.call(opt_obj, obj[key], key, obj)
  }
};
goog.object.filter = function(obj, f, opt_obj) {
  var res = {};
  for(var key in obj) {
    if(f.call(opt_obj, obj[key], key, obj)) {
      res[key] = obj[key]
    }
  }
  return res
};
goog.object.map = function(obj, f, opt_obj) {
  var res = {};
  for(var key in obj) {
    res[key] = f.call(opt_obj, obj[key], key, obj)
  }
  return res
};
goog.object.some = function(obj, f, opt_obj) {
  for(var key in obj) {
    if(f.call(opt_obj, obj[key], key, obj)) {
      return true
    }
  }
  return false
};
goog.object.every = function(obj, f, opt_obj) {
  for(var key in obj) {
    if(!f.call(opt_obj, obj[key], key, obj)) {
      return false
    }
  }
  return true
};
goog.object.getCount = function(obj) {
  var rv = 0;
  for(var key in obj) {
    rv++
  }
  return rv
};
goog.object.getAnyKey = function(obj) {
  for(var key in obj) {
    return key
  }
};
goog.object.getAnyValue = function(obj) {
  for(var key in obj) {
    return obj[key]
  }
};
goog.object.contains = function(obj, val) {
  return goog.object.containsValue(obj, val)
};
goog.object.getValues = function(obj) {
  var res = [];
  var i = 0;
  for(var key in obj) {
    res[i++] = obj[key]
  }
  return res
};
goog.object.getKeys = function(obj) {
  var res = [];
  var i = 0;
  for(var key in obj) {
    res[i++] = key
  }
  return res
};
goog.object.getValueByKeys = function(obj, var_args) {
  var isArrayLike = goog.isArrayLike(var_args);
  var keys = isArrayLike ? var_args : arguments;
  for(var i = isArrayLike ? 0 : 1;i < keys.length;i++) {
    obj = obj[keys[i]];
    if(!goog.isDef(obj)) {
      break
    }
  }
  return obj
};
goog.object.containsKey = function(obj, key) {
  return key in obj
};
goog.object.containsValue = function(obj, val) {
  for(var key in obj) {
    if(obj[key] == val) {
      return true
    }
  }
  return false
};
goog.object.findKey = function(obj, f, opt_this) {
  for(var key in obj) {
    if(f.call(opt_this, obj[key], key, obj)) {
      return key
    }
  }
  return undefined
};
goog.object.findValue = function(obj, f, opt_this) {
  var key = goog.object.findKey(obj, f, opt_this);
  return key && obj[key]
};
goog.object.isEmpty = function(obj) {
  for(var key in obj) {
    return false
  }
  return true
};
goog.object.clear = function(obj) {
  for(var i in obj) {
    delete obj[i]
  }
};
goog.object.remove = function(obj, key) {
  var rv;
  if(rv = key in obj) {
    delete obj[key]
  }
  return rv
};
goog.object.add = function(obj, key, val) {
  if(key in obj) {
    throw Error('The object already contains the key "' + key + '"');
  }
  goog.object.set(obj, key, val)
};
goog.object.get = function(obj, key, opt_val) {
  if(key in obj) {
    return obj[key]
  }
  return opt_val
};
goog.object.set = function(obj, key, value) {
  obj[key] = value
};
goog.object.setIfUndefined = function(obj, key, value) {
  return key in obj ? obj[key] : obj[key] = value
};
goog.object.clone = function(obj) {
  var res = {};
  for(var key in obj) {
    res[key] = obj[key]
  }
  return res
};
goog.object.unsafeClone = function(obj) {
  var type = goog.typeOf(obj);
  if(type == "object" || type == "array") {
    if(obj.clone) {
      return obj.clone()
    }
    var clone = type == "array" ? [] : {};
    for(var key in obj) {
      clone[key] = goog.object.unsafeClone(obj[key])
    }
    return clone
  }
  return obj
};
goog.object.transpose = function(obj) {
  var transposed = {};
  for(var key in obj) {
    transposed[obj[key]] = key
  }
  return transposed
};
goog.object.PROTOTYPE_FIELDS_ = ["constructor", "hasOwnProperty", "isPrototypeOf", "propertyIsEnumerable", "toLocaleString", "toString", "valueOf"];
goog.object.extend = function(target, var_args) {
  var key, source;
  for(var i = 1;i < arguments.length;i++) {
    source = arguments[i];
    for(key in source) {
      target[key] = source[key]
    }
    for(var j = 0;j < goog.object.PROTOTYPE_FIELDS_.length;j++) {
      key = goog.object.PROTOTYPE_FIELDS_[j];
      if(Object.prototype.hasOwnProperty.call(source, key)) {
        target[key] = source[key]
      }
    }
  }
};
goog.object.create = function(var_args) {
  var argLength = arguments.length;
  if(argLength == 1 && goog.isArray(arguments[0])) {
    return goog.object.create.apply(null, arguments[0])
  }
  if(argLength % 2) {
    throw Error("Uneven number of arguments");
  }
  var rv = {};
  for(var i = 0;i < argLength;i += 2) {
    rv[arguments[i]] = arguments[i + 1]
  }
  return rv
};
goog.object.createSet = function(var_args) {
  var argLength = arguments.length;
  if(argLength == 1 && goog.isArray(arguments[0])) {
    return goog.object.createSet.apply(null, arguments[0])
  }
  var rv = {};
  for(var i = 0;i < argLength;i++) {
    rv[arguments[i]] = true
  }
  return rv
};
goog.provide("goog.string.format");
goog.require("goog.string");
goog.string.format = function(formatString, var_args) {
  var args = Array.prototype.slice.call(arguments);
  var template = args.shift();
  if(typeof template == "undefined") {
    throw Error("[goog.string.format] Template required");
  }
  var formatRe = /%([0\-\ \+]*)(\d+)?(\.(\d+))?([%sfdiu])/g;
  function replacerDemuxer(match, flags, width, dotp, precision, type, offset, wholeString) {
    if(type == "%") {
      return"%"
    }
    var value = args.shift();
    if(typeof value == "undefined") {
      throw Error("[goog.string.format] Not enough arguments");
    }
    arguments[0] = value;
    return goog.string.format.demuxes_[type].apply(null, arguments)
  }
  return template.replace(formatRe, replacerDemuxer)
};
goog.string.format.demuxes_ = {};
goog.string.format.demuxes_["s"] = function(value, flags, width, dotp, precision, type, offset, wholeString) {
  var replacement = value;
  if(isNaN(width) || width == "" || replacement.length >= width) {
    return replacement
  }
  if(flags.indexOf("-", 0) > -1) {
    replacement = replacement + goog.string.repeat(" ", width - replacement.length)
  }else {
    replacement = goog.string.repeat(" ", width - replacement.length) + replacement
  }
  return replacement
};
goog.string.format.demuxes_["f"] = function(value, flags, width, dotp, precision, type, offset, wholeString) {
  var replacement = value.toString();
  if(!(isNaN(precision) || precision == "")) {
    replacement = value.toFixed(precision)
  }
  var sign;
  if(value < 0) {
    sign = "-"
  }else {
    if(flags.indexOf("+") >= 0) {
      sign = "+"
    }else {
      if(flags.indexOf(" ") >= 0) {
        sign = " "
      }else {
        sign = ""
      }
    }
  }
  if(value >= 0) {
    replacement = sign + replacement
  }
  if(isNaN(width) || replacement.length >= width) {
    return replacement
  }
  replacement = isNaN(precision) ? Math.abs(value).toString() : Math.abs(value).toFixed(precision);
  var padCount = width - replacement.length - sign.length;
  if(flags.indexOf("-", 0) >= 0) {
    replacement = sign + replacement + goog.string.repeat(" ", padCount)
  }else {
    var paddingChar = flags.indexOf("0", 0) >= 0 ? "0" : " ";
    replacement = sign + goog.string.repeat(paddingChar, padCount) + replacement
  }
  return replacement
};
goog.string.format.demuxes_["d"] = function(value, flags, width, dotp, precision, type, offset, wholeString) {
  return goog.string.format.demuxes_["f"](parseInt(value, 10), flags, width, dotp, 0, type, offset, wholeString)
};
goog.string.format.demuxes_["i"] = goog.string.format.demuxes_["d"];
goog.string.format.demuxes_["u"] = goog.string.format.demuxes_["d"];
goog.provide("goog.userAgent.jscript");
goog.require("goog.string");
goog.userAgent.jscript.ASSUME_NO_JSCRIPT = false;
goog.userAgent.jscript.init_ = function() {
  var hasScriptEngine = "ScriptEngine" in goog.global;
  goog.userAgent.jscript.DETECTED_HAS_JSCRIPT_ = hasScriptEngine && goog.global["ScriptEngine"]() == "JScript";
  goog.userAgent.jscript.DETECTED_VERSION_ = goog.userAgent.jscript.DETECTED_HAS_JSCRIPT_ ? goog.global["ScriptEngineMajorVersion"]() + "." + goog.global["ScriptEngineMinorVersion"]() + "." + goog.global["ScriptEngineBuildVersion"]() : "0"
};
if(!goog.userAgent.jscript.ASSUME_NO_JSCRIPT) {
  goog.userAgent.jscript.init_()
}
goog.userAgent.jscript.HAS_JSCRIPT = goog.userAgent.jscript.ASSUME_NO_JSCRIPT ? false : goog.userAgent.jscript.DETECTED_HAS_JSCRIPT_;
goog.userAgent.jscript.VERSION = goog.userAgent.jscript.ASSUME_NO_JSCRIPT ? "0" : goog.userAgent.jscript.DETECTED_VERSION_;
goog.userAgent.jscript.isVersion = function(version) {
  return goog.string.compareVersions(goog.userAgent.jscript.VERSION, version) >= 0
};
goog.provide("goog.string.StringBuffer");
goog.require("goog.userAgent.jscript");
goog.string.StringBuffer = function(opt_a1, var_args) {
  this.buffer_ = goog.userAgent.jscript.HAS_JSCRIPT ? [] : "";
  if(opt_a1 != null) {
    this.append.apply(this, arguments)
  }
};
goog.string.StringBuffer.prototype.set = function(s) {
  this.clear();
  this.append(s)
};
if(goog.userAgent.jscript.HAS_JSCRIPT) {
  goog.string.StringBuffer.prototype.bufferLength_ = 0;
  goog.string.StringBuffer.prototype.append = function(a1, opt_a2, var_args) {
    if(opt_a2 == null) {
      this.buffer_[this.bufferLength_++] = a1
    }else {
      this.buffer_.push.apply(this.buffer_, arguments);
      this.bufferLength_ = this.buffer_.length
    }
    return this
  }
}else {
  goog.string.StringBuffer.prototype.append = function(a1, opt_a2, var_args) {
    this.buffer_ += a1;
    if(opt_a2 != null) {
      for(var i = 1;i < arguments.length;i++) {
        this.buffer_ += arguments[i]
      }
    }
    return this
  }
}
goog.string.StringBuffer.prototype.clear = function() {
  if(goog.userAgent.jscript.HAS_JSCRIPT) {
    this.buffer_.length = 0;
    this.bufferLength_ = 0
  }else {
    this.buffer_ = ""
  }
};
goog.string.StringBuffer.prototype.getLength = function() {
  return this.toString().length
};
goog.string.StringBuffer.prototype.toString = function() {
  if(goog.userAgent.jscript.HAS_JSCRIPT) {
    var str = this.buffer_.join("");
    this.clear();
    if(str) {
      this.append(str)
    }
    return str
  }else {
    return this.buffer_
  }
};
goog.provide("cljs.core");
goog.require("goog.array");
goog.require("goog.object");
goog.require("goog.string.format");
goog.require("goog.string.StringBuffer");
goog.require("goog.string");
cljs.core._STAR_unchecked_if_STAR_ = false;
cljs.core._STAR_print_fn_STAR_ = function _STAR_print_fn_STAR_(_) {
  throw new Error("No *print-fn* fn set for evaluation environment");
};
cljs.core.truth_ = function truth_(x) {
  return x != null && x !== false
};
cljs.core.type_satisfies_ = function type_satisfies_(p, x) {
  var x__65977 = x == null ? null : x;
  if(p[goog.typeOf(x__65977)]) {
    return true
  }else {
    if(p["_"]) {
      return true
    }else {
      if("\ufdd0'else") {
        return false
      }else {
        return null
      }
    }
  }
};
cljs.core.is_proto_ = function is_proto_(x) {
  return x.constructor.prototype === x
};
cljs.core._STAR_main_cli_fn_STAR_ = null;
cljs.core.missing_protocol = function missing_protocol(proto, obj) {
  return Error(["No protocol method ", proto, " defined for type ", goog.typeOf(obj), ": ", obj].join(""))
};
cljs.core.aclone = function aclone(array_like) {
  return array_like.slice()
};
cljs.core.array = function array(var_args) {
  return Array.prototype.slice.call(arguments)
};
cljs.core.make_array = function() {
  var make_array = null;
  var make_array__1 = function(size) {
    return new Array(size)
  };
  var make_array__2 = function(type, size) {
    return make_array.call(null, size)
  };
  make_array = function(type, size) {
    switch(arguments.length) {
      case 1:
        return make_array__1.call(this, type);
      case 2:
        return make_array__2.call(this, type, size)
    }
    throw"Invalid arity: " + arguments.length;
  };
  make_array.cljs$lang$arity$1 = make_array__1;
  make_array.cljs$lang$arity$2 = make_array__2;
  return make_array
}();
cljs.core.aget = function() {
  var aget = null;
  var aget__2 = function(array, i) {
    return array[i]
  };
  var aget__3 = function() {
    var G__65978__delegate = function(array, i, idxs) {
      return cljs.core.apply.call(null, aget, aget.call(null, array, i), idxs)
    };
    var G__65978 = function(array, i, var_args) {
      var idxs = null;
      if(goog.isDef(var_args)) {
        idxs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__65978__delegate.call(this, array, i, idxs)
    };
    G__65978.cljs$lang$maxFixedArity = 2;
    G__65978.cljs$lang$applyTo = function(arglist__65979) {
      var array = cljs.core.first(arglist__65979);
      var i = cljs.core.first(cljs.core.next(arglist__65979));
      var idxs = cljs.core.rest(cljs.core.next(arglist__65979));
      return G__65978__delegate(array, i, idxs)
    };
    G__65978.cljs$lang$arity$variadic = G__65978__delegate;
    return G__65978
  }();
  aget = function(array, i, var_args) {
    var idxs = var_args;
    switch(arguments.length) {
      case 2:
        return aget__2.call(this, array, i);
      default:
        return aget__3.cljs$lang$arity$variadic(array, i, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  aget.cljs$lang$maxFixedArity = 2;
  aget.cljs$lang$applyTo = aget__3.cljs$lang$applyTo;
  aget.cljs$lang$arity$2 = aget__2;
  aget.cljs$lang$arity$variadic = aget__3.cljs$lang$arity$variadic;
  return aget
}();
cljs.core.aset = function aset(array, i, val) {
  return array[i] = val
};
cljs.core.alength = function alength(array) {
  return array.length
};
cljs.core.into_array = function() {
  var into_array = null;
  var into_array__1 = function(aseq) {
    return into_array.call(null, null, aseq)
  };
  var into_array__2 = function(type, aseq) {
    return cljs.core.reduce.call(null, function(a, x) {
      a.push(x);
      return a
    }, [], aseq)
  };
  into_array = function(type, aseq) {
    switch(arguments.length) {
      case 1:
        return into_array__1.call(this, type);
      case 2:
        return into_array__2.call(this, type, aseq)
    }
    throw"Invalid arity: " + arguments.length;
  };
  into_array.cljs$lang$arity$1 = into_array__1;
  into_array.cljs$lang$arity$2 = into_array__2;
  return into_array
}();
cljs.core.IFn = {};
cljs.core._invoke = function() {
  var _invoke = null;
  var _invoke__1 = function(this$) {
    if(function() {
      var and__3822__auto____66064 = this$;
      if(and__3822__auto____66064) {
        return this$.cljs$core$IFn$_invoke$arity$1
      }else {
        return and__3822__auto____66064
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$1(this$)
    }else {
      var x__2397__auto____66065 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____66066 = cljs.core._invoke[goog.typeOf(x__2397__auto____66065)];
        if(or__3824__auto____66066) {
          return or__3824__auto____66066
        }else {
          var or__3824__auto____66067 = cljs.core._invoke["_"];
          if(or__3824__auto____66067) {
            return or__3824__auto____66067
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$)
    }
  };
  var _invoke__2 = function(this$, a) {
    if(function() {
      var and__3822__auto____66068 = this$;
      if(and__3822__auto____66068) {
        return this$.cljs$core$IFn$_invoke$arity$2
      }else {
        return and__3822__auto____66068
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$2(this$, a)
    }else {
      var x__2397__auto____66069 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____66070 = cljs.core._invoke[goog.typeOf(x__2397__auto____66069)];
        if(or__3824__auto____66070) {
          return or__3824__auto____66070
        }else {
          var or__3824__auto____66071 = cljs.core._invoke["_"];
          if(or__3824__auto____66071) {
            return or__3824__auto____66071
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a)
    }
  };
  var _invoke__3 = function(this$, a, b) {
    if(function() {
      var and__3822__auto____66072 = this$;
      if(and__3822__auto____66072) {
        return this$.cljs$core$IFn$_invoke$arity$3
      }else {
        return and__3822__auto____66072
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$3(this$, a, b)
    }else {
      var x__2397__auto____66073 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____66074 = cljs.core._invoke[goog.typeOf(x__2397__auto____66073)];
        if(or__3824__auto____66074) {
          return or__3824__auto____66074
        }else {
          var or__3824__auto____66075 = cljs.core._invoke["_"];
          if(or__3824__auto____66075) {
            return or__3824__auto____66075
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b)
    }
  };
  var _invoke__4 = function(this$, a, b, c) {
    if(function() {
      var and__3822__auto____66076 = this$;
      if(and__3822__auto____66076) {
        return this$.cljs$core$IFn$_invoke$arity$4
      }else {
        return and__3822__auto____66076
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$4(this$, a, b, c)
    }else {
      var x__2397__auto____66077 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____66078 = cljs.core._invoke[goog.typeOf(x__2397__auto____66077)];
        if(or__3824__auto____66078) {
          return or__3824__auto____66078
        }else {
          var or__3824__auto____66079 = cljs.core._invoke["_"];
          if(or__3824__auto____66079) {
            return or__3824__auto____66079
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c)
    }
  };
  var _invoke__5 = function(this$, a, b, c, d) {
    if(function() {
      var and__3822__auto____66080 = this$;
      if(and__3822__auto____66080) {
        return this$.cljs$core$IFn$_invoke$arity$5
      }else {
        return and__3822__auto____66080
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$5(this$, a, b, c, d)
    }else {
      var x__2397__auto____66081 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____66082 = cljs.core._invoke[goog.typeOf(x__2397__auto____66081)];
        if(or__3824__auto____66082) {
          return or__3824__auto____66082
        }else {
          var or__3824__auto____66083 = cljs.core._invoke["_"];
          if(or__3824__auto____66083) {
            return or__3824__auto____66083
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d)
    }
  };
  var _invoke__6 = function(this$, a, b, c, d, e) {
    if(function() {
      var and__3822__auto____66084 = this$;
      if(and__3822__auto____66084) {
        return this$.cljs$core$IFn$_invoke$arity$6
      }else {
        return and__3822__auto____66084
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$6(this$, a, b, c, d, e)
    }else {
      var x__2397__auto____66085 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____66086 = cljs.core._invoke[goog.typeOf(x__2397__auto____66085)];
        if(or__3824__auto____66086) {
          return or__3824__auto____66086
        }else {
          var or__3824__auto____66087 = cljs.core._invoke["_"];
          if(or__3824__auto____66087) {
            return or__3824__auto____66087
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e)
    }
  };
  var _invoke__7 = function(this$, a, b, c, d, e, f) {
    if(function() {
      var and__3822__auto____66088 = this$;
      if(and__3822__auto____66088) {
        return this$.cljs$core$IFn$_invoke$arity$7
      }else {
        return and__3822__auto____66088
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$7(this$, a, b, c, d, e, f)
    }else {
      var x__2397__auto____66089 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____66090 = cljs.core._invoke[goog.typeOf(x__2397__auto____66089)];
        if(or__3824__auto____66090) {
          return or__3824__auto____66090
        }else {
          var or__3824__auto____66091 = cljs.core._invoke["_"];
          if(or__3824__auto____66091) {
            return or__3824__auto____66091
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f)
    }
  };
  var _invoke__8 = function(this$, a, b, c, d, e, f, g) {
    if(function() {
      var and__3822__auto____66092 = this$;
      if(and__3822__auto____66092) {
        return this$.cljs$core$IFn$_invoke$arity$8
      }else {
        return and__3822__auto____66092
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$8(this$, a, b, c, d, e, f, g)
    }else {
      var x__2397__auto____66093 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____66094 = cljs.core._invoke[goog.typeOf(x__2397__auto____66093)];
        if(or__3824__auto____66094) {
          return or__3824__auto____66094
        }else {
          var or__3824__auto____66095 = cljs.core._invoke["_"];
          if(or__3824__auto____66095) {
            return or__3824__auto____66095
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g)
    }
  };
  var _invoke__9 = function(this$, a, b, c, d, e, f, g, h) {
    if(function() {
      var and__3822__auto____66096 = this$;
      if(and__3822__auto____66096) {
        return this$.cljs$core$IFn$_invoke$arity$9
      }else {
        return and__3822__auto____66096
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$9(this$, a, b, c, d, e, f, g, h)
    }else {
      var x__2397__auto____66097 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____66098 = cljs.core._invoke[goog.typeOf(x__2397__auto____66097)];
        if(or__3824__auto____66098) {
          return or__3824__auto____66098
        }else {
          var or__3824__auto____66099 = cljs.core._invoke["_"];
          if(or__3824__auto____66099) {
            return or__3824__auto____66099
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h)
    }
  };
  var _invoke__10 = function(this$, a, b, c, d, e, f, g, h, i) {
    if(function() {
      var and__3822__auto____66100 = this$;
      if(and__3822__auto____66100) {
        return this$.cljs$core$IFn$_invoke$arity$10
      }else {
        return and__3822__auto____66100
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$10(this$, a, b, c, d, e, f, g, h, i)
    }else {
      var x__2397__auto____66101 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____66102 = cljs.core._invoke[goog.typeOf(x__2397__auto____66101)];
        if(or__3824__auto____66102) {
          return or__3824__auto____66102
        }else {
          var or__3824__auto____66103 = cljs.core._invoke["_"];
          if(or__3824__auto____66103) {
            return or__3824__auto____66103
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i)
    }
  };
  var _invoke__11 = function(this$, a, b, c, d, e, f, g, h, i, j) {
    if(function() {
      var and__3822__auto____66104 = this$;
      if(and__3822__auto____66104) {
        return this$.cljs$core$IFn$_invoke$arity$11
      }else {
        return and__3822__auto____66104
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$11(this$, a, b, c, d, e, f, g, h, i, j)
    }else {
      var x__2397__auto____66105 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____66106 = cljs.core._invoke[goog.typeOf(x__2397__auto____66105)];
        if(or__3824__auto____66106) {
          return or__3824__auto____66106
        }else {
          var or__3824__auto____66107 = cljs.core._invoke["_"];
          if(or__3824__auto____66107) {
            return or__3824__auto____66107
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j)
    }
  };
  var _invoke__12 = function(this$, a, b, c, d, e, f, g, h, i, j, k) {
    if(function() {
      var and__3822__auto____66108 = this$;
      if(and__3822__auto____66108) {
        return this$.cljs$core$IFn$_invoke$arity$12
      }else {
        return and__3822__auto____66108
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$12(this$, a, b, c, d, e, f, g, h, i, j, k)
    }else {
      var x__2397__auto____66109 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____66110 = cljs.core._invoke[goog.typeOf(x__2397__auto____66109)];
        if(or__3824__auto____66110) {
          return or__3824__auto____66110
        }else {
          var or__3824__auto____66111 = cljs.core._invoke["_"];
          if(or__3824__auto____66111) {
            return or__3824__auto____66111
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k)
    }
  };
  var _invoke__13 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l) {
    if(function() {
      var and__3822__auto____66112 = this$;
      if(and__3822__auto____66112) {
        return this$.cljs$core$IFn$_invoke$arity$13
      }else {
        return and__3822__auto____66112
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$13(this$, a, b, c, d, e, f, g, h, i, j, k, l)
    }else {
      var x__2397__auto____66113 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____66114 = cljs.core._invoke[goog.typeOf(x__2397__auto____66113)];
        if(or__3824__auto____66114) {
          return or__3824__auto____66114
        }else {
          var or__3824__auto____66115 = cljs.core._invoke["_"];
          if(or__3824__auto____66115) {
            return or__3824__auto____66115
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l)
    }
  };
  var _invoke__14 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m) {
    if(function() {
      var and__3822__auto____66116 = this$;
      if(and__3822__auto____66116) {
        return this$.cljs$core$IFn$_invoke$arity$14
      }else {
        return and__3822__auto____66116
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$14(this$, a, b, c, d, e, f, g, h, i, j, k, l, m)
    }else {
      var x__2397__auto____66117 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____66118 = cljs.core._invoke[goog.typeOf(x__2397__auto____66117)];
        if(or__3824__auto____66118) {
          return or__3824__auto____66118
        }else {
          var or__3824__auto____66119 = cljs.core._invoke["_"];
          if(or__3824__auto____66119) {
            return or__3824__auto____66119
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m)
    }
  };
  var _invoke__15 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n) {
    if(function() {
      var and__3822__auto____66120 = this$;
      if(and__3822__auto____66120) {
        return this$.cljs$core$IFn$_invoke$arity$15
      }else {
        return and__3822__auto____66120
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$15(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n)
    }else {
      var x__2397__auto____66121 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____66122 = cljs.core._invoke[goog.typeOf(x__2397__auto____66121)];
        if(or__3824__auto____66122) {
          return or__3824__auto____66122
        }else {
          var or__3824__auto____66123 = cljs.core._invoke["_"];
          if(or__3824__auto____66123) {
            return or__3824__auto____66123
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n)
    }
  };
  var _invoke__16 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o) {
    if(function() {
      var and__3822__auto____66124 = this$;
      if(and__3822__auto____66124) {
        return this$.cljs$core$IFn$_invoke$arity$16
      }else {
        return and__3822__auto____66124
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$16(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o)
    }else {
      var x__2397__auto____66125 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____66126 = cljs.core._invoke[goog.typeOf(x__2397__auto____66125)];
        if(or__3824__auto____66126) {
          return or__3824__auto____66126
        }else {
          var or__3824__auto____66127 = cljs.core._invoke["_"];
          if(or__3824__auto____66127) {
            return or__3824__auto____66127
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o)
    }
  };
  var _invoke__17 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p) {
    if(function() {
      var and__3822__auto____66128 = this$;
      if(and__3822__auto____66128) {
        return this$.cljs$core$IFn$_invoke$arity$17
      }else {
        return and__3822__auto____66128
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$17(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p)
    }else {
      var x__2397__auto____66129 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____66130 = cljs.core._invoke[goog.typeOf(x__2397__auto____66129)];
        if(or__3824__auto____66130) {
          return or__3824__auto____66130
        }else {
          var or__3824__auto____66131 = cljs.core._invoke["_"];
          if(or__3824__auto____66131) {
            return or__3824__auto____66131
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p)
    }
  };
  var _invoke__18 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q) {
    if(function() {
      var and__3822__auto____66132 = this$;
      if(and__3822__auto____66132) {
        return this$.cljs$core$IFn$_invoke$arity$18
      }else {
        return and__3822__auto____66132
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$18(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q)
    }else {
      var x__2397__auto____66133 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____66134 = cljs.core._invoke[goog.typeOf(x__2397__auto____66133)];
        if(or__3824__auto____66134) {
          return or__3824__auto____66134
        }else {
          var or__3824__auto____66135 = cljs.core._invoke["_"];
          if(or__3824__auto____66135) {
            return or__3824__auto____66135
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q)
    }
  };
  var _invoke__19 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s) {
    if(function() {
      var and__3822__auto____66136 = this$;
      if(and__3822__auto____66136) {
        return this$.cljs$core$IFn$_invoke$arity$19
      }else {
        return and__3822__auto____66136
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$19(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s)
    }else {
      var x__2397__auto____66137 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____66138 = cljs.core._invoke[goog.typeOf(x__2397__auto____66137)];
        if(or__3824__auto____66138) {
          return or__3824__auto____66138
        }else {
          var or__3824__auto____66139 = cljs.core._invoke["_"];
          if(or__3824__auto____66139) {
            return or__3824__auto____66139
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s)
    }
  };
  var _invoke__20 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t) {
    if(function() {
      var and__3822__auto____66140 = this$;
      if(and__3822__auto____66140) {
        return this$.cljs$core$IFn$_invoke$arity$20
      }else {
        return and__3822__auto____66140
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$20(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t)
    }else {
      var x__2397__auto____66141 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____66142 = cljs.core._invoke[goog.typeOf(x__2397__auto____66141)];
        if(or__3824__auto____66142) {
          return or__3824__auto____66142
        }else {
          var or__3824__auto____66143 = cljs.core._invoke["_"];
          if(or__3824__auto____66143) {
            return or__3824__auto____66143
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t)
    }
  };
  var _invoke__21 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest) {
    if(function() {
      var and__3822__auto____66144 = this$;
      if(and__3822__auto____66144) {
        return this$.cljs$core$IFn$_invoke$arity$21
      }else {
        return and__3822__auto____66144
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$21(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest)
    }else {
      var x__2397__auto____66145 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____66146 = cljs.core._invoke[goog.typeOf(x__2397__auto____66145)];
        if(or__3824__auto____66146) {
          return or__3824__auto____66146
        }else {
          var or__3824__auto____66147 = cljs.core._invoke["_"];
          if(or__3824__auto____66147) {
            return or__3824__auto____66147
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest)
    }
  };
  _invoke = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest) {
    switch(arguments.length) {
      case 1:
        return _invoke__1.call(this, this$);
      case 2:
        return _invoke__2.call(this, this$, a);
      case 3:
        return _invoke__3.call(this, this$, a, b);
      case 4:
        return _invoke__4.call(this, this$, a, b, c);
      case 5:
        return _invoke__5.call(this, this$, a, b, c, d);
      case 6:
        return _invoke__6.call(this, this$, a, b, c, d, e);
      case 7:
        return _invoke__7.call(this, this$, a, b, c, d, e, f);
      case 8:
        return _invoke__8.call(this, this$, a, b, c, d, e, f, g);
      case 9:
        return _invoke__9.call(this, this$, a, b, c, d, e, f, g, h);
      case 10:
        return _invoke__10.call(this, this$, a, b, c, d, e, f, g, h, i);
      case 11:
        return _invoke__11.call(this, this$, a, b, c, d, e, f, g, h, i, j);
      case 12:
        return _invoke__12.call(this, this$, a, b, c, d, e, f, g, h, i, j, k);
      case 13:
        return _invoke__13.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l);
      case 14:
        return _invoke__14.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m);
      case 15:
        return _invoke__15.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n);
      case 16:
        return _invoke__16.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o);
      case 17:
        return _invoke__17.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p);
      case 18:
        return _invoke__18.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q);
      case 19:
        return _invoke__19.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s);
      case 20:
        return _invoke__20.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t);
      case 21:
        return _invoke__21.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _invoke.cljs$lang$arity$1 = _invoke__1;
  _invoke.cljs$lang$arity$2 = _invoke__2;
  _invoke.cljs$lang$arity$3 = _invoke__3;
  _invoke.cljs$lang$arity$4 = _invoke__4;
  _invoke.cljs$lang$arity$5 = _invoke__5;
  _invoke.cljs$lang$arity$6 = _invoke__6;
  _invoke.cljs$lang$arity$7 = _invoke__7;
  _invoke.cljs$lang$arity$8 = _invoke__8;
  _invoke.cljs$lang$arity$9 = _invoke__9;
  _invoke.cljs$lang$arity$10 = _invoke__10;
  _invoke.cljs$lang$arity$11 = _invoke__11;
  _invoke.cljs$lang$arity$12 = _invoke__12;
  _invoke.cljs$lang$arity$13 = _invoke__13;
  _invoke.cljs$lang$arity$14 = _invoke__14;
  _invoke.cljs$lang$arity$15 = _invoke__15;
  _invoke.cljs$lang$arity$16 = _invoke__16;
  _invoke.cljs$lang$arity$17 = _invoke__17;
  _invoke.cljs$lang$arity$18 = _invoke__18;
  _invoke.cljs$lang$arity$19 = _invoke__19;
  _invoke.cljs$lang$arity$20 = _invoke__20;
  _invoke.cljs$lang$arity$21 = _invoke__21;
  return _invoke
}();
cljs.core.ICounted = {};
cljs.core._count = function _count(coll) {
  if(function() {
    var and__3822__auto____66152 = coll;
    if(and__3822__auto____66152) {
      return coll.cljs$core$ICounted$_count$arity$1
    }else {
      return and__3822__auto____66152
    }
  }()) {
    return coll.cljs$core$ICounted$_count$arity$1(coll)
  }else {
    var x__2397__auto____66153 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____66154 = cljs.core._count[goog.typeOf(x__2397__auto____66153)];
      if(or__3824__auto____66154) {
        return or__3824__auto____66154
      }else {
        var or__3824__auto____66155 = cljs.core._count["_"];
        if(or__3824__auto____66155) {
          return or__3824__auto____66155
        }else {
          throw cljs.core.missing_protocol.call(null, "ICounted.-count", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.IEmptyableCollection = {};
cljs.core._empty = function _empty(coll) {
  if(function() {
    var and__3822__auto____66160 = coll;
    if(and__3822__auto____66160) {
      return coll.cljs$core$IEmptyableCollection$_empty$arity$1
    }else {
      return and__3822__auto____66160
    }
  }()) {
    return coll.cljs$core$IEmptyableCollection$_empty$arity$1(coll)
  }else {
    var x__2397__auto____66161 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____66162 = cljs.core._empty[goog.typeOf(x__2397__auto____66161)];
      if(or__3824__auto____66162) {
        return or__3824__auto____66162
      }else {
        var or__3824__auto____66163 = cljs.core._empty["_"];
        if(or__3824__auto____66163) {
          return or__3824__auto____66163
        }else {
          throw cljs.core.missing_protocol.call(null, "IEmptyableCollection.-empty", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.ICollection = {};
cljs.core._conj = function _conj(coll, o) {
  if(function() {
    var and__3822__auto____66168 = coll;
    if(and__3822__auto____66168) {
      return coll.cljs$core$ICollection$_conj$arity$2
    }else {
      return and__3822__auto____66168
    }
  }()) {
    return coll.cljs$core$ICollection$_conj$arity$2(coll, o)
  }else {
    var x__2397__auto____66169 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____66170 = cljs.core._conj[goog.typeOf(x__2397__auto____66169)];
      if(or__3824__auto____66170) {
        return or__3824__auto____66170
      }else {
        var or__3824__auto____66171 = cljs.core._conj["_"];
        if(or__3824__auto____66171) {
          return or__3824__auto____66171
        }else {
          throw cljs.core.missing_protocol.call(null, "ICollection.-conj", coll);
        }
      }
    }().call(null, coll, o)
  }
};
cljs.core.IIndexed = {};
cljs.core._nth = function() {
  var _nth = null;
  var _nth__2 = function(coll, n) {
    if(function() {
      var and__3822__auto____66180 = coll;
      if(and__3822__auto____66180) {
        return coll.cljs$core$IIndexed$_nth$arity$2
      }else {
        return and__3822__auto____66180
      }
    }()) {
      return coll.cljs$core$IIndexed$_nth$arity$2(coll, n)
    }else {
      var x__2397__auto____66181 = coll == null ? null : coll;
      return function() {
        var or__3824__auto____66182 = cljs.core._nth[goog.typeOf(x__2397__auto____66181)];
        if(or__3824__auto____66182) {
          return or__3824__auto____66182
        }else {
          var or__3824__auto____66183 = cljs.core._nth["_"];
          if(or__3824__auto____66183) {
            return or__3824__auto____66183
          }else {
            throw cljs.core.missing_protocol.call(null, "IIndexed.-nth", coll);
          }
        }
      }().call(null, coll, n)
    }
  };
  var _nth__3 = function(coll, n, not_found) {
    if(function() {
      var and__3822__auto____66184 = coll;
      if(and__3822__auto____66184) {
        return coll.cljs$core$IIndexed$_nth$arity$3
      }else {
        return and__3822__auto____66184
      }
    }()) {
      return coll.cljs$core$IIndexed$_nth$arity$3(coll, n, not_found)
    }else {
      var x__2397__auto____66185 = coll == null ? null : coll;
      return function() {
        var or__3824__auto____66186 = cljs.core._nth[goog.typeOf(x__2397__auto____66185)];
        if(or__3824__auto____66186) {
          return or__3824__auto____66186
        }else {
          var or__3824__auto____66187 = cljs.core._nth["_"];
          if(or__3824__auto____66187) {
            return or__3824__auto____66187
          }else {
            throw cljs.core.missing_protocol.call(null, "IIndexed.-nth", coll);
          }
        }
      }().call(null, coll, n, not_found)
    }
  };
  _nth = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return _nth__2.call(this, coll, n);
      case 3:
        return _nth__3.call(this, coll, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _nth.cljs$lang$arity$2 = _nth__2;
  _nth.cljs$lang$arity$3 = _nth__3;
  return _nth
}();
cljs.core.ASeq = {};
cljs.core.ISeq = {};
cljs.core._first = function _first(coll) {
  if(function() {
    var and__3822__auto____66192 = coll;
    if(and__3822__auto____66192) {
      return coll.cljs$core$ISeq$_first$arity$1
    }else {
      return and__3822__auto____66192
    }
  }()) {
    return coll.cljs$core$ISeq$_first$arity$1(coll)
  }else {
    var x__2397__auto____66193 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____66194 = cljs.core._first[goog.typeOf(x__2397__auto____66193)];
      if(or__3824__auto____66194) {
        return or__3824__auto____66194
      }else {
        var or__3824__auto____66195 = cljs.core._first["_"];
        if(or__3824__auto____66195) {
          return or__3824__auto____66195
        }else {
          throw cljs.core.missing_protocol.call(null, "ISeq.-first", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._rest = function _rest(coll) {
  if(function() {
    var and__3822__auto____66200 = coll;
    if(and__3822__auto____66200) {
      return coll.cljs$core$ISeq$_rest$arity$1
    }else {
      return and__3822__auto____66200
    }
  }()) {
    return coll.cljs$core$ISeq$_rest$arity$1(coll)
  }else {
    var x__2397__auto____66201 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____66202 = cljs.core._rest[goog.typeOf(x__2397__auto____66201)];
      if(or__3824__auto____66202) {
        return or__3824__auto____66202
      }else {
        var or__3824__auto____66203 = cljs.core._rest["_"];
        if(or__3824__auto____66203) {
          return or__3824__auto____66203
        }else {
          throw cljs.core.missing_protocol.call(null, "ISeq.-rest", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.INext = {};
cljs.core._next = function _next(coll) {
  if(function() {
    var and__3822__auto____66208 = coll;
    if(and__3822__auto____66208) {
      return coll.cljs$core$INext$_next$arity$1
    }else {
      return and__3822__auto____66208
    }
  }()) {
    return coll.cljs$core$INext$_next$arity$1(coll)
  }else {
    var x__2397__auto____66209 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____66210 = cljs.core._next[goog.typeOf(x__2397__auto____66209)];
      if(or__3824__auto____66210) {
        return or__3824__auto____66210
      }else {
        var or__3824__auto____66211 = cljs.core._next["_"];
        if(or__3824__auto____66211) {
          return or__3824__auto____66211
        }else {
          throw cljs.core.missing_protocol.call(null, "INext.-next", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.ILookup = {};
cljs.core._lookup = function() {
  var _lookup = null;
  var _lookup__2 = function(o, k) {
    if(function() {
      var and__3822__auto____66220 = o;
      if(and__3822__auto____66220) {
        return o.cljs$core$ILookup$_lookup$arity$2
      }else {
        return and__3822__auto____66220
      }
    }()) {
      return o.cljs$core$ILookup$_lookup$arity$2(o, k)
    }else {
      var x__2397__auto____66221 = o == null ? null : o;
      return function() {
        var or__3824__auto____66222 = cljs.core._lookup[goog.typeOf(x__2397__auto____66221)];
        if(or__3824__auto____66222) {
          return or__3824__auto____66222
        }else {
          var or__3824__auto____66223 = cljs.core._lookup["_"];
          if(or__3824__auto____66223) {
            return or__3824__auto____66223
          }else {
            throw cljs.core.missing_protocol.call(null, "ILookup.-lookup", o);
          }
        }
      }().call(null, o, k)
    }
  };
  var _lookup__3 = function(o, k, not_found) {
    if(function() {
      var and__3822__auto____66224 = o;
      if(and__3822__auto____66224) {
        return o.cljs$core$ILookup$_lookup$arity$3
      }else {
        return and__3822__auto____66224
      }
    }()) {
      return o.cljs$core$ILookup$_lookup$arity$3(o, k, not_found)
    }else {
      var x__2397__auto____66225 = o == null ? null : o;
      return function() {
        var or__3824__auto____66226 = cljs.core._lookup[goog.typeOf(x__2397__auto____66225)];
        if(or__3824__auto____66226) {
          return or__3824__auto____66226
        }else {
          var or__3824__auto____66227 = cljs.core._lookup["_"];
          if(or__3824__auto____66227) {
            return or__3824__auto____66227
          }else {
            throw cljs.core.missing_protocol.call(null, "ILookup.-lookup", o);
          }
        }
      }().call(null, o, k, not_found)
    }
  };
  _lookup = function(o, k, not_found) {
    switch(arguments.length) {
      case 2:
        return _lookup__2.call(this, o, k);
      case 3:
        return _lookup__3.call(this, o, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _lookup.cljs$lang$arity$2 = _lookup__2;
  _lookup.cljs$lang$arity$3 = _lookup__3;
  return _lookup
}();
cljs.core.IAssociative = {};
cljs.core._contains_key_QMARK_ = function _contains_key_QMARK_(coll, k) {
  if(function() {
    var and__3822__auto____66232 = coll;
    if(and__3822__auto____66232) {
      return coll.cljs$core$IAssociative$_contains_key_QMARK_$arity$2
    }else {
      return and__3822__auto____66232
    }
  }()) {
    return coll.cljs$core$IAssociative$_contains_key_QMARK_$arity$2(coll, k)
  }else {
    var x__2397__auto____66233 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____66234 = cljs.core._contains_key_QMARK_[goog.typeOf(x__2397__auto____66233)];
      if(or__3824__auto____66234) {
        return or__3824__auto____66234
      }else {
        var or__3824__auto____66235 = cljs.core._contains_key_QMARK_["_"];
        if(or__3824__auto____66235) {
          return or__3824__auto____66235
        }else {
          throw cljs.core.missing_protocol.call(null, "IAssociative.-contains-key?", coll);
        }
      }
    }().call(null, coll, k)
  }
};
cljs.core._assoc = function _assoc(coll, k, v) {
  if(function() {
    var and__3822__auto____66240 = coll;
    if(and__3822__auto____66240) {
      return coll.cljs$core$IAssociative$_assoc$arity$3
    }else {
      return and__3822__auto____66240
    }
  }()) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, k, v)
  }else {
    var x__2397__auto____66241 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____66242 = cljs.core._assoc[goog.typeOf(x__2397__auto____66241)];
      if(or__3824__auto____66242) {
        return or__3824__auto____66242
      }else {
        var or__3824__auto____66243 = cljs.core._assoc["_"];
        if(or__3824__auto____66243) {
          return or__3824__auto____66243
        }else {
          throw cljs.core.missing_protocol.call(null, "IAssociative.-assoc", coll);
        }
      }
    }().call(null, coll, k, v)
  }
};
cljs.core.IMap = {};
cljs.core._dissoc = function _dissoc(coll, k) {
  if(function() {
    var and__3822__auto____66248 = coll;
    if(and__3822__auto____66248) {
      return coll.cljs$core$IMap$_dissoc$arity$2
    }else {
      return and__3822__auto____66248
    }
  }()) {
    return coll.cljs$core$IMap$_dissoc$arity$2(coll, k)
  }else {
    var x__2397__auto____66249 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____66250 = cljs.core._dissoc[goog.typeOf(x__2397__auto____66249)];
      if(or__3824__auto____66250) {
        return or__3824__auto____66250
      }else {
        var or__3824__auto____66251 = cljs.core._dissoc["_"];
        if(or__3824__auto____66251) {
          return or__3824__auto____66251
        }else {
          throw cljs.core.missing_protocol.call(null, "IMap.-dissoc", coll);
        }
      }
    }().call(null, coll, k)
  }
};
cljs.core.IMapEntry = {};
cljs.core._key = function _key(coll) {
  if(function() {
    var and__3822__auto____66256 = coll;
    if(and__3822__auto____66256) {
      return coll.cljs$core$IMapEntry$_key$arity$1
    }else {
      return and__3822__auto____66256
    }
  }()) {
    return coll.cljs$core$IMapEntry$_key$arity$1(coll)
  }else {
    var x__2397__auto____66257 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____66258 = cljs.core._key[goog.typeOf(x__2397__auto____66257)];
      if(or__3824__auto____66258) {
        return or__3824__auto____66258
      }else {
        var or__3824__auto____66259 = cljs.core._key["_"];
        if(or__3824__auto____66259) {
          return or__3824__auto____66259
        }else {
          throw cljs.core.missing_protocol.call(null, "IMapEntry.-key", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._val = function _val(coll) {
  if(function() {
    var and__3822__auto____66264 = coll;
    if(and__3822__auto____66264) {
      return coll.cljs$core$IMapEntry$_val$arity$1
    }else {
      return and__3822__auto____66264
    }
  }()) {
    return coll.cljs$core$IMapEntry$_val$arity$1(coll)
  }else {
    var x__2397__auto____66265 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____66266 = cljs.core._val[goog.typeOf(x__2397__auto____66265)];
      if(or__3824__auto____66266) {
        return or__3824__auto____66266
      }else {
        var or__3824__auto____66267 = cljs.core._val["_"];
        if(or__3824__auto____66267) {
          return or__3824__auto____66267
        }else {
          throw cljs.core.missing_protocol.call(null, "IMapEntry.-val", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.ISet = {};
cljs.core._disjoin = function _disjoin(coll, v) {
  if(function() {
    var and__3822__auto____66272 = coll;
    if(and__3822__auto____66272) {
      return coll.cljs$core$ISet$_disjoin$arity$2
    }else {
      return and__3822__auto____66272
    }
  }()) {
    return coll.cljs$core$ISet$_disjoin$arity$2(coll, v)
  }else {
    var x__2397__auto____66273 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____66274 = cljs.core._disjoin[goog.typeOf(x__2397__auto____66273)];
      if(or__3824__auto____66274) {
        return or__3824__auto____66274
      }else {
        var or__3824__auto____66275 = cljs.core._disjoin["_"];
        if(or__3824__auto____66275) {
          return or__3824__auto____66275
        }else {
          throw cljs.core.missing_protocol.call(null, "ISet.-disjoin", coll);
        }
      }
    }().call(null, coll, v)
  }
};
cljs.core.IStack = {};
cljs.core._peek = function _peek(coll) {
  if(function() {
    var and__3822__auto____66280 = coll;
    if(and__3822__auto____66280) {
      return coll.cljs$core$IStack$_peek$arity$1
    }else {
      return and__3822__auto____66280
    }
  }()) {
    return coll.cljs$core$IStack$_peek$arity$1(coll)
  }else {
    var x__2397__auto____66281 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____66282 = cljs.core._peek[goog.typeOf(x__2397__auto____66281)];
      if(or__3824__auto____66282) {
        return or__3824__auto____66282
      }else {
        var or__3824__auto____66283 = cljs.core._peek["_"];
        if(or__3824__auto____66283) {
          return or__3824__auto____66283
        }else {
          throw cljs.core.missing_protocol.call(null, "IStack.-peek", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._pop = function _pop(coll) {
  if(function() {
    var and__3822__auto____66288 = coll;
    if(and__3822__auto____66288) {
      return coll.cljs$core$IStack$_pop$arity$1
    }else {
      return and__3822__auto____66288
    }
  }()) {
    return coll.cljs$core$IStack$_pop$arity$1(coll)
  }else {
    var x__2397__auto____66289 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____66290 = cljs.core._pop[goog.typeOf(x__2397__auto____66289)];
      if(or__3824__auto____66290) {
        return or__3824__auto____66290
      }else {
        var or__3824__auto____66291 = cljs.core._pop["_"];
        if(or__3824__auto____66291) {
          return or__3824__auto____66291
        }else {
          throw cljs.core.missing_protocol.call(null, "IStack.-pop", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.IVector = {};
cljs.core._assoc_n = function _assoc_n(coll, n, val) {
  if(function() {
    var and__3822__auto____66296 = coll;
    if(and__3822__auto____66296) {
      return coll.cljs$core$IVector$_assoc_n$arity$3
    }else {
      return and__3822__auto____66296
    }
  }()) {
    return coll.cljs$core$IVector$_assoc_n$arity$3(coll, n, val)
  }else {
    var x__2397__auto____66297 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____66298 = cljs.core._assoc_n[goog.typeOf(x__2397__auto____66297)];
      if(or__3824__auto____66298) {
        return or__3824__auto____66298
      }else {
        var or__3824__auto____66299 = cljs.core._assoc_n["_"];
        if(or__3824__auto____66299) {
          return or__3824__auto____66299
        }else {
          throw cljs.core.missing_protocol.call(null, "IVector.-assoc-n", coll);
        }
      }
    }().call(null, coll, n, val)
  }
};
cljs.core.IDeref = {};
cljs.core._deref = function _deref(o) {
  if(function() {
    var and__3822__auto____66304 = o;
    if(and__3822__auto____66304) {
      return o.cljs$core$IDeref$_deref$arity$1
    }else {
      return and__3822__auto____66304
    }
  }()) {
    return o.cljs$core$IDeref$_deref$arity$1(o)
  }else {
    var x__2397__auto____66305 = o == null ? null : o;
    return function() {
      var or__3824__auto____66306 = cljs.core._deref[goog.typeOf(x__2397__auto____66305)];
      if(or__3824__auto____66306) {
        return or__3824__auto____66306
      }else {
        var or__3824__auto____66307 = cljs.core._deref["_"];
        if(or__3824__auto____66307) {
          return or__3824__auto____66307
        }else {
          throw cljs.core.missing_protocol.call(null, "IDeref.-deref", o);
        }
      }
    }().call(null, o)
  }
};
cljs.core.IDerefWithTimeout = {};
cljs.core._deref_with_timeout = function _deref_with_timeout(o, msec, timeout_val) {
  if(function() {
    var and__3822__auto____66312 = o;
    if(and__3822__auto____66312) {
      return o.cljs$core$IDerefWithTimeout$_deref_with_timeout$arity$3
    }else {
      return and__3822__auto____66312
    }
  }()) {
    return o.cljs$core$IDerefWithTimeout$_deref_with_timeout$arity$3(o, msec, timeout_val)
  }else {
    var x__2397__auto____66313 = o == null ? null : o;
    return function() {
      var or__3824__auto____66314 = cljs.core._deref_with_timeout[goog.typeOf(x__2397__auto____66313)];
      if(or__3824__auto____66314) {
        return or__3824__auto____66314
      }else {
        var or__3824__auto____66315 = cljs.core._deref_with_timeout["_"];
        if(or__3824__auto____66315) {
          return or__3824__auto____66315
        }else {
          throw cljs.core.missing_protocol.call(null, "IDerefWithTimeout.-deref-with-timeout", o);
        }
      }
    }().call(null, o, msec, timeout_val)
  }
};
cljs.core.IMeta = {};
cljs.core._meta = function _meta(o) {
  if(function() {
    var and__3822__auto____66320 = o;
    if(and__3822__auto____66320) {
      return o.cljs$core$IMeta$_meta$arity$1
    }else {
      return and__3822__auto____66320
    }
  }()) {
    return o.cljs$core$IMeta$_meta$arity$1(o)
  }else {
    var x__2397__auto____66321 = o == null ? null : o;
    return function() {
      var or__3824__auto____66322 = cljs.core._meta[goog.typeOf(x__2397__auto____66321)];
      if(or__3824__auto____66322) {
        return or__3824__auto____66322
      }else {
        var or__3824__auto____66323 = cljs.core._meta["_"];
        if(or__3824__auto____66323) {
          return or__3824__auto____66323
        }else {
          throw cljs.core.missing_protocol.call(null, "IMeta.-meta", o);
        }
      }
    }().call(null, o)
  }
};
cljs.core.IWithMeta = {};
cljs.core._with_meta = function _with_meta(o, meta) {
  if(function() {
    var and__3822__auto____66328 = o;
    if(and__3822__auto____66328) {
      return o.cljs$core$IWithMeta$_with_meta$arity$2
    }else {
      return and__3822__auto____66328
    }
  }()) {
    return o.cljs$core$IWithMeta$_with_meta$arity$2(o, meta)
  }else {
    var x__2397__auto____66329 = o == null ? null : o;
    return function() {
      var or__3824__auto____66330 = cljs.core._with_meta[goog.typeOf(x__2397__auto____66329)];
      if(or__3824__auto____66330) {
        return or__3824__auto____66330
      }else {
        var or__3824__auto____66331 = cljs.core._with_meta["_"];
        if(or__3824__auto____66331) {
          return or__3824__auto____66331
        }else {
          throw cljs.core.missing_protocol.call(null, "IWithMeta.-with-meta", o);
        }
      }
    }().call(null, o, meta)
  }
};
cljs.core.IReduce = {};
cljs.core._reduce = function() {
  var _reduce = null;
  var _reduce__2 = function(coll, f) {
    if(function() {
      var and__3822__auto____66340 = coll;
      if(and__3822__auto____66340) {
        return coll.cljs$core$IReduce$_reduce$arity$2
      }else {
        return and__3822__auto____66340
      }
    }()) {
      return coll.cljs$core$IReduce$_reduce$arity$2(coll, f)
    }else {
      var x__2397__auto____66341 = coll == null ? null : coll;
      return function() {
        var or__3824__auto____66342 = cljs.core._reduce[goog.typeOf(x__2397__auto____66341)];
        if(or__3824__auto____66342) {
          return or__3824__auto____66342
        }else {
          var or__3824__auto____66343 = cljs.core._reduce["_"];
          if(or__3824__auto____66343) {
            return or__3824__auto____66343
          }else {
            throw cljs.core.missing_protocol.call(null, "IReduce.-reduce", coll);
          }
        }
      }().call(null, coll, f)
    }
  };
  var _reduce__3 = function(coll, f, start) {
    if(function() {
      var and__3822__auto____66344 = coll;
      if(and__3822__auto____66344) {
        return coll.cljs$core$IReduce$_reduce$arity$3
      }else {
        return and__3822__auto____66344
      }
    }()) {
      return coll.cljs$core$IReduce$_reduce$arity$3(coll, f, start)
    }else {
      var x__2397__auto____66345 = coll == null ? null : coll;
      return function() {
        var or__3824__auto____66346 = cljs.core._reduce[goog.typeOf(x__2397__auto____66345)];
        if(or__3824__auto____66346) {
          return or__3824__auto____66346
        }else {
          var or__3824__auto____66347 = cljs.core._reduce["_"];
          if(or__3824__auto____66347) {
            return or__3824__auto____66347
          }else {
            throw cljs.core.missing_protocol.call(null, "IReduce.-reduce", coll);
          }
        }
      }().call(null, coll, f, start)
    }
  };
  _reduce = function(coll, f, start) {
    switch(arguments.length) {
      case 2:
        return _reduce__2.call(this, coll, f);
      case 3:
        return _reduce__3.call(this, coll, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _reduce.cljs$lang$arity$2 = _reduce__2;
  _reduce.cljs$lang$arity$3 = _reduce__3;
  return _reduce
}();
cljs.core.IKVReduce = {};
cljs.core._kv_reduce = function _kv_reduce(coll, f, init) {
  if(function() {
    var and__3822__auto____66352 = coll;
    if(and__3822__auto____66352) {
      return coll.cljs$core$IKVReduce$_kv_reduce$arity$3
    }else {
      return and__3822__auto____66352
    }
  }()) {
    return coll.cljs$core$IKVReduce$_kv_reduce$arity$3(coll, f, init)
  }else {
    var x__2397__auto____66353 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____66354 = cljs.core._kv_reduce[goog.typeOf(x__2397__auto____66353)];
      if(or__3824__auto____66354) {
        return or__3824__auto____66354
      }else {
        var or__3824__auto____66355 = cljs.core._kv_reduce["_"];
        if(or__3824__auto____66355) {
          return or__3824__auto____66355
        }else {
          throw cljs.core.missing_protocol.call(null, "IKVReduce.-kv-reduce", coll);
        }
      }
    }().call(null, coll, f, init)
  }
};
cljs.core.IEquiv = {};
cljs.core._equiv = function _equiv(o, other) {
  if(function() {
    var and__3822__auto____66360 = o;
    if(and__3822__auto____66360) {
      return o.cljs$core$IEquiv$_equiv$arity$2
    }else {
      return and__3822__auto____66360
    }
  }()) {
    return o.cljs$core$IEquiv$_equiv$arity$2(o, other)
  }else {
    var x__2397__auto____66361 = o == null ? null : o;
    return function() {
      var or__3824__auto____66362 = cljs.core._equiv[goog.typeOf(x__2397__auto____66361)];
      if(or__3824__auto____66362) {
        return or__3824__auto____66362
      }else {
        var or__3824__auto____66363 = cljs.core._equiv["_"];
        if(or__3824__auto____66363) {
          return or__3824__auto____66363
        }else {
          throw cljs.core.missing_protocol.call(null, "IEquiv.-equiv", o);
        }
      }
    }().call(null, o, other)
  }
};
cljs.core.IHash = {};
cljs.core._hash = function _hash(o) {
  if(function() {
    var and__3822__auto____66368 = o;
    if(and__3822__auto____66368) {
      return o.cljs$core$IHash$_hash$arity$1
    }else {
      return and__3822__auto____66368
    }
  }()) {
    return o.cljs$core$IHash$_hash$arity$1(o)
  }else {
    var x__2397__auto____66369 = o == null ? null : o;
    return function() {
      var or__3824__auto____66370 = cljs.core._hash[goog.typeOf(x__2397__auto____66369)];
      if(or__3824__auto____66370) {
        return or__3824__auto____66370
      }else {
        var or__3824__auto____66371 = cljs.core._hash["_"];
        if(or__3824__auto____66371) {
          return or__3824__auto____66371
        }else {
          throw cljs.core.missing_protocol.call(null, "IHash.-hash", o);
        }
      }
    }().call(null, o)
  }
};
cljs.core.ISeqable = {};
cljs.core._seq = function _seq(o) {
  if(function() {
    var and__3822__auto____66376 = o;
    if(and__3822__auto____66376) {
      return o.cljs$core$ISeqable$_seq$arity$1
    }else {
      return and__3822__auto____66376
    }
  }()) {
    return o.cljs$core$ISeqable$_seq$arity$1(o)
  }else {
    var x__2397__auto____66377 = o == null ? null : o;
    return function() {
      var or__3824__auto____66378 = cljs.core._seq[goog.typeOf(x__2397__auto____66377)];
      if(or__3824__auto____66378) {
        return or__3824__auto____66378
      }else {
        var or__3824__auto____66379 = cljs.core._seq["_"];
        if(or__3824__auto____66379) {
          return or__3824__auto____66379
        }else {
          throw cljs.core.missing_protocol.call(null, "ISeqable.-seq", o);
        }
      }
    }().call(null, o)
  }
};
cljs.core.ISequential = {};
cljs.core.IList = {};
cljs.core.IRecord = {};
cljs.core.IReversible = {};
cljs.core._rseq = function _rseq(coll) {
  if(function() {
    var and__3822__auto____66384 = coll;
    if(and__3822__auto____66384) {
      return coll.cljs$core$IReversible$_rseq$arity$1
    }else {
      return and__3822__auto____66384
    }
  }()) {
    return coll.cljs$core$IReversible$_rseq$arity$1(coll)
  }else {
    var x__2397__auto____66385 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____66386 = cljs.core._rseq[goog.typeOf(x__2397__auto____66385)];
      if(or__3824__auto____66386) {
        return or__3824__auto____66386
      }else {
        var or__3824__auto____66387 = cljs.core._rseq["_"];
        if(or__3824__auto____66387) {
          return or__3824__auto____66387
        }else {
          throw cljs.core.missing_protocol.call(null, "IReversible.-rseq", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.ISorted = {};
cljs.core._sorted_seq = function _sorted_seq(coll, ascending_QMARK_) {
  if(function() {
    var and__3822__auto____66392 = coll;
    if(and__3822__auto____66392) {
      return coll.cljs$core$ISorted$_sorted_seq$arity$2
    }else {
      return and__3822__auto____66392
    }
  }()) {
    return coll.cljs$core$ISorted$_sorted_seq$arity$2(coll, ascending_QMARK_)
  }else {
    var x__2397__auto____66393 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____66394 = cljs.core._sorted_seq[goog.typeOf(x__2397__auto____66393)];
      if(or__3824__auto____66394) {
        return or__3824__auto____66394
      }else {
        var or__3824__auto____66395 = cljs.core._sorted_seq["_"];
        if(or__3824__auto____66395) {
          return or__3824__auto____66395
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-sorted-seq", coll);
        }
      }
    }().call(null, coll, ascending_QMARK_)
  }
};
cljs.core._sorted_seq_from = function _sorted_seq_from(coll, k, ascending_QMARK_) {
  if(function() {
    var and__3822__auto____66400 = coll;
    if(and__3822__auto____66400) {
      return coll.cljs$core$ISorted$_sorted_seq_from$arity$3
    }else {
      return and__3822__auto____66400
    }
  }()) {
    return coll.cljs$core$ISorted$_sorted_seq_from$arity$3(coll, k, ascending_QMARK_)
  }else {
    var x__2397__auto____66401 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____66402 = cljs.core._sorted_seq_from[goog.typeOf(x__2397__auto____66401)];
      if(or__3824__auto____66402) {
        return or__3824__auto____66402
      }else {
        var or__3824__auto____66403 = cljs.core._sorted_seq_from["_"];
        if(or__3824__auto____66403) {
          return or__3824__auto____66403
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-sorted-seq-from", coll);
        }
      }
    }().call(null, coll, k, ascending_QMARK_)
  }
};
cljs.core._entry_key = function _entry_key(coll, entry) {
  if(function() {
    var and__3822__auto____66408 = coll;
    if(and__3822__auto____66408) {
      return coll.cljs$core$ISorted$_entry_key$arity$2
    }else {
      return and__3822__auto____66408
    }
  }()) {
    return coll.cljs$core$ISorted$_entry_key$arity$2(coll, entry)
  }else {
    var x__2397__auto____66409 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____66410 = cljs.core._entry_key[goog.typeOf(x__2397__auto____66409)];
      if(or__3824__auto____66410) {
        return or__3824__auto____66410
      }else {
        var or__3824__auto____66411 = cljs.core._entry_key["_"];
        if(or__3824__auto____66411) {
          return or__3824__auto____66411
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-entry-key", coll);
        }
      }
    }().call(null, coll, entry)
  }
};
cljs.core._comparator = function _comparator(coll) {
  if(function() {
    var and__3822__auto____66416 = coll;
    if(and__3822__auto____66416) {
      return coll.cljs$core$ISorted$_comparator$arity$1
    }else {
      return and__3822__auto____66416
    }
  }()) {
    return coll.cljs$core$ISorted$_comparator$arity$1(coll)
  }else {
    var x__2397__auto____66417 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____66418 = cljs.core._comparator[goog.typeOf(x__2397__auto____66417)];
      if(or__3824__auto____66418) {
        return or__3824__auto____66418
      }else {
        var or__3824__auto____66419 = cljs.core._comparator["_"];
        if(or__3824__auto____66419) {
          return or__3824__auto____66419
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-comparator", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.IPrintable = {};
cljs.core._pr_seq = function _pr_seq(o, opts) {
  if(function() {
    var and__3822__auto____66424 = o;
    if(and__3822__auto____66424) {
      return o.cljs$core$IPrintable$_pr_seq$arity$2
    }else {
      return and__3822__auto____66424
    }
  }()) {
    return o.cljs$core$IPrintable$_pr_seq$arity$2(o, opts)
  }else {
    var x__2397__auto____66425 = o == null ? null : o;
    return function() {
      var or__3824__auto____66426 = cljs.core._pr_seq[goog.typeOf(x__2397__auto____66425)];
      if(or__3824__auto____66426) {
        return or__3824__auto____66426
      }else {
        var or__3824__auto____66427 = cljs.core._pr_seq["_"];
        if(or__3824__auto____66427) {
          return or__3824__auto____66427
        }else {
          throw cljs.core.missing_protocol.call(null, "IPrintable.-pr-seq", o);
        }
      }
    }().call(null, o, opts)
  }
};
cljs.core.IPending = {};
cljs.core._realized_QMARK_ = function _realized_QMARK_(d) {
  if(function() {
    var and__3822__auto____66432 = d;
    if(and__3822__auto____66432) {
      return d.cljs$core$IPending$_realized_QMARK_$arity$1
    }else {
      return and__3822__auto____66432
    }
  }()) {
    return d.cljs$core$IPending$_realized_QMARK_$arity$1(d)
  }else {
    var x__2397__auto____66433 = d == null ? null : d;
    return function() {
      var or__3824__auto____66434 = cljs.core._realized_QMARK_[goog.typeOf(x__2397__auto____66433)];
      if(or__3824__auto____66434) {
        return or__3824__auto____66434
      }else {
        var or__3824__auto____66435 = cljs.core._realized_QMARK_["_"];
        if(or__3824__auto____66435) {
          return or__3824__auto____66435
        }else {
          throw cljs.core.missing_protocol.call(null, "IPending.-realized?", d);
        }
      }
    }().call(null, d)
  }
};
cljs.core.IWatchable = {};
cljs.core._notify_watches = function _notify_watches(this$, oldval, newval) {
  if(function() {
    var and__3822__auto____66440 = this$;
    if(and__3822__auto____66440) {
      return this$.cljs$core$IWatchable$_notify_watches$arity$3
    }else {
      return and__3822__auto____66440
    }
  }()) {
    return this$.cljs$core$IWatchable$_notify_watches$arity$3(this$, oldval, newval)
  }else {
    var x__2397__auto____66441 = this$ == null ? null : this$;
    return function() {
      var or__3824__auto____66442 = cljs.core._notify_watches[goog.typeOf(x__2397__auto____66441)];
      if(or__3824__auto____66442) {
        return or__3824__auto____66442
      }else {
        var or__3824__auto____66443 = cljs.core._notify_watches["_"];
        if(or__3824__auto____66443) {
          return or__3824__auto____66443
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-notify-watches", this$);
        }
      }
    }().call(null, this$, oldval, newval)
  }
};
cljs.core._add_watch = function _add_watch(this$, key, f) {
  if(function() {
    var and__3822__auto____66448 = this$;
    if(and__3822__auto____66448) {
      return this$.cljs$core$IWatchable$_add_watch$arity$3
    }else {
      return and__3822__auto____66448
    }
  }()) {
    return this$.cljs$core$IWatchable$_add_watch$arity$3(this$, key, f)
  }else {
    var x__2397__auto____66449 = this$ == null ? null : this$;
    return function() {
      var or__3824__auto____66450 = cljs.core._add_watch[goog.typeOf(x__2397__auto____66449)];
      if(or__3824__auto____66450) {
        return or__3824__auto____66450
      }else {
        var or__3824__auto____66451 = cljs.core._add_watch["_"];
        if(or__3824__auto____66451) {
          return or__3824__auto____66451
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-add-watch", this$);
        }
      }
    }().call(null, this$, key, f)
  }
};
cljs.core._remove_watch = function _remove_watch(this$, key) {
  if(function() {
    var and__3822__auto____66456 = this$;
    if(and__3822__auto____66456) {
      return this$.cljs$core$IWatchable$_remove_watch$arity$2
    }else {
      return and__3822__auto____66456
    }
  }()) {
    return this$.cljs$core$IWatchable$_remove_watch$arity$2(this$, key)
  }else {
    var x__2397__auto____66457 = this$ == null ? null : this$;
    return function() {
      var or__3824__auto____66458 = cljs.core._remove_watch[goog.typeOf(x__2397__auto____66457)];
      if(or__3824__auto____66458) {
        return or__3824__auto____66458
      }else {
        var or__3824__auto____66459 = cljs.core._remove_watch["_"];
        if(or__3824__auto____66459) {
          return or__3824__auto____66459
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-remove-watch", this$);
        }
      }
    }().call(null, this$, key)
  }
};
cljs.core.IEditableCollection = {};
cljs.core._as_transient = function _as_transient(coll) {
  if(function() {
    var and__3822__auto____66464 = coll;
    if(and__3822__auto____66464) {
      return coll.cljs$core$IEditableCollection$_as_transient$arity$1
    }else {
      return and__3822__auto____66464
    }
  }()) {
    return coll.cljs$core$IEditableCollection$_as_transient$arity$1(coll)
  }else {
    var x__2397__auto____66465 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____66466 = cljs.core._as_transient[goog.typeOf(x__2397__auto____66465)];
      if(or__3824__auto____66466) {
        return or__3824__auto____66466
      }else {
        var or__3824__auto____66467 = cljs.core._as_transient["_"];
        if(or__3824__auto____66467) {
          return or__3824__auto____66467
        }else {
          throw cljs.core.missing_protocol.call(null, "IEditableCollection.-as-transient", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.ITransientCollection = {};
cljs.core._conj_BANG_ = function _conj_BANG_(tcoll, val) {
  if(function() {
    var and__3822__auto____66472 = tcoll;
    if(and__3822__auto____66472) {
      return tcoll.cljs$core$ITransientCollection$_conj_BANG_$arity$2
    }else {
      return and__3822__auto____66472
    }
  }()) {
    return tcoll.cljs$core$ITransientCollection$_conj_BANG_$arity$2(tcoll, val)
  }else {
    var x__2397__auto____66473 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____66474 = cljs.core._conj_BANG_[goog.typeOf(x__2397__auto____66473)];
      if(or__3824__auto____66474) {
        return or__3824__auto____66474
      }else {
        var or__3824__auto____66475 = cljs.core._conj_BANG_["_"];
        if(or__3824__auto____66475) {
          return or__3824__auto____66475
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientCollection.-conj!", tcoll);
        }
      }
    }().call(null, tcoll, val)
  }
};
cljs.core._persistent_BANG_ = function _persistent_BANG_(tcoll) {
  if(function() {
    var and__3822__auto____66480 = tcoll;
    if(and__3822__auto____66480) {
      return tcoll.cljs$core$ITransientCollection$_persistent_BANG_$arity$1
    }else {
      return and__3822__auto____66480
    }
  }()) {
    return tcoll.cljs$core$ITransientCollection$_persistent_BANG_$arity$1(tcoll)
  }else {
    var x__2397__auto____66481 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____66482 = cljs.core._persistent_BANG_[goog.typeOf(x__2397__auto____66481)];
      if(or__3824__auto____66482) {
        return or__3824__auto____66482
      }else {
        var or__3824__auto____66483 = cljs.core._persistent_BANG_["_"];
        if(or__3824__auto____66483) {
          return or__3824__auto____66483
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientCollection.-persistent!", tcoll);
        }
      }
    }().call(null, tcoll)
  }
};
cljs.core.ITransientAssociative = {};
cljs.core._assoc_BANG_ = function _assoc_BANG_(tcoll, key, val) {
  if(function() {
    var and__3822__auto____66488 = tcoll;
    if(and__3822__auto____66488) {
      return tcoll.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3
    }else {
      return and__3822__auto____66488
    }
  }()) {
    return tcoll.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3(tcoll, key, val)
  }else {
    var x__2397__auto____66489 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____66490 = cljs.core._assoc_BANG_[goog.typeOf(x__2397__auto____66489)];
      if(or__3824__auto____66490) {
        return or__3824__auto____66490
      }else {
        var or__3824__auto____66491 = cljs.core._assoc_BANG_["_"];
        if(or__3824__auto____66491) {
          return or__3824__auto____66491
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientAssociative.-assoc!", tcoll);
        }
      }
    }().call(null, tcoll, key, val)
  }
};
cljs.core.ITransientMap = {};
cljs.core._dissoc_BANG_ = function _dissoc_BANG_(tcoll, key) {
  if(function() {
    var and__3822__auto____66496 = tcoll;
    if(and__3822__auto____66496) {
      return tcoll.cljs$core$ITransientMap$_dissoc_BANG_$arity$2
    }else {
      return and__3822__auto____66496
    }
  }()) {
    return tcoll.cljs$core$ITransientMap$_dissoc_BANG_$arity$2(tcoll, key)
  }else {
    var x__2397__auto____66497 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____66498 = cljs.core._dissoc_BANG_[goog.typeOf(x__2397__auto____66497)];
      if(or__3824__auto____66498) {
        return or__3824__auto____66498
      }else {
        var or__3824__auto____66499 = cljs.core._dissoc_BANG_["_"];
        if(or__3824__auto____66499) {
          return or__3824__auto____66499
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientMap.-dissoc!", tcoll);
        }
      }
    }().call(null, tcoll, key)
  }
};
cljs.core.ITransientVector = {};
cljs.core._assoc_n_BANG_ = function _assoc_n_BANG_(tcoll, n, val) {
  if(function() {
    var and__3822__auto____66504 = tcoll;
    if(and__3822__auto____66504) {
      return tcoll.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3
    }else {
      return and__3822__auto____66504
    }
  }()) {
    return tcoll.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3(tcoll, n, val)
  }else {
    var x__2397__auto____66505 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____66506 = cljs.core._assoc_n_BANG_[goog.typeOf(x__2397__auto____66505)];
      if(or__3824__auto____66506) {
        return or__3824__auto____66506
      }else {
        var or__3824__auto____66507 = cljs.core._assoc_n_BANG_["_"];
        if(or__3824__auto____66507) {
          return or__3824__auto____66507
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientVector.-assoc-n!", tcoll);
        }
      }
    }().call(null, tcoll, n, val)
  }
};
cljs.core._pop_BANG_ = function _pop_BANG_(tcoll) {
  if(function() {
    var and__3822__auto____66512 = tcoll;
    if(and__3822__auto____66512) {
      return tcoll.cljs$core$ITransientVector$_pop_BANG_$arity$1
    }else {
      return and__3822__auto____66512
    }
  }()) {
    return tcoll.cljs$core$ITransientVector$_pop_BANG_$arity$1(tcoll)
  }else {
    var x__2397__auto____66513 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____66514 = cljs.core._pop_BANG_[goog.typeOf(x__2397__auto____66513)];
      if(or__3824__auto____66514) {
        return or__3824__auto____66514
      }else {
        var or__3824__auto____66515 = cljs.core._pop_BANG_["_"];
        if(or__3824__auto____66515) {
          return or__3824__auto____66515
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientVector.-pop!", tcoll);
        }
      }
    }().call(null, tcoll)
  }
};
cljs.core.ITransientSet = {};
cljs.core._disjoin_BANG_ = function _disjoin_BANG_(tcoll, v) {
  if(function() {
    var and__3822__auto____66520 = tcoll;
    if(and__3822__auto____66520) {
      return tcoll.cljs$core$ITransientSet$_disjoin_BANG_$arity$2
    }else {
      return and__3822__auto____66520
    }
  }()) {
    return tcoll.cljs$core$ITransientSet$_disjoin_BANG_$arity$2(tcoll, v)
  }else {
    var x__2397__auto____66521 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____66522 = cljs.core._disjoin_BANG_[goog.typeOf(x__2397__auto____66521)];
      if(or__3824__auto____66522) {
        return or__3824__auto____66522
      }else {
        var or__3824__auto____66523 = cljs.core._disjoin_BANG_["_"];
        if(or__3824__auto____66523) {
          return or__3824__auto____66523
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientSet.-disjoin!", tcoll);
        }
      }
    }().call(null, tcoll, v)
  }
};
cljs.core.IComparable = {};
cljs.core._compare = function _compare(x, y) {
  if(function() {
    var and__3822__auto____66528 = x;
    if(and__3822__auto____66528) {
      return x.cljs$core$IComparable$_compare$arity$2
    }else {
      return and__3822__auto____66528
    }
  }()) {
    return x.cljs$core$IComparable$_compare$arity$2(x, y)
  }else {
    var x__2397__auto____66529 = x == null ? null : x;
    return function() {
      var or__3824__auto____66530 = cljs.core._compare[goog.typeOf(x__2397__auto____66529)];
      if(or__3824__auto____66530) {
        return or__3824__auto____66530
      }else {
        var or__3824__auto____66531 = cljs.core._compare["_"];
        if(or__3824__auto____66531) {
          return or__3824__auto____66531
        }else {
          throw cljs.core.missing_protocol.call(null, "IComparable.-compare", x);
        }
      }
    }().call(null, x, y)
  }
};
cljs.core.IChunk = {};
cljs.core._drop_first = function _drop_first(coll) {
  if(function() {
    var and__3822__auto____66536 = coll;
    if(and__3822__auto____66536) {
      return coll.cljs$core$IChunk$_drop_first$arity$1
    }else {
      return and__3822__auto____66536
    }
  }()) {
    return coll.cljs$core$IChunk$_drop_first$arity$1(coll)
  }else {
    var x__2397__auto____66537 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____66538 = cljs.core._drop_first[goog.typeOf(x__2397__auto____66537)];
      if(or__3824__auto____66538) {
        return or__3824__auto____66538
      }else {
        var or__3824__auto____66539 = cljs.core._drop_first["_"];
        if(or__3824__auto____66539) {
          return or__3824__auto____66539
        }else {
          throw cljs.core.missing_protocol.call(null, "IChunk.-drop-first", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.IChunkedSeq = {};
cljs.core._chunked_first = function _chunked_first(coll) {
  if(function() {
    var and__3822__auto____66544 = coll;
    if(and__3822__auto____66544) {
      return coll.cljs$core$IChunkedSeq$_chunked_first$arity$1
    }else {
      return and__3822__auto____66544
    }
  }()) {
    return coll.cljs$core$IChunkedSeq$_chunked_first$arity$1(coll)
  }else {
    var x__2397__auto____66545 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____66546 = cljs.core._chunked_first[goog.typeOf(x__2397__auto____66545)];
      if(or__3824__auto____66546) {
        return or__3824__auto____66546
      }else {
        var or__3824__auto____66547 = cljs.core._chunked_first["_"];
        if(or__3824__auto____66547) {
          return or__3824__auto____66547
        }else {
          throw cljs.core.missing_protocol.call(null, "IChunkedSeq.-chunked-first", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._chunked_rest = function _chunked_rest(coll) {
  if(function() {
    var and__3822__auto____66552 = coll;
    if(and__3822__auto____66552) {
      return coll.cljs$core$IChunkedSeq$_chunked_rest$arity$1
    }else {
      return and__3822__auto____66552
    }
  }()) {
    return coll.cljs$core$IChunkedSeq$_chunked_rest$arity$1(coll)
  }else {
    var x__2397__auto____66553 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____66554 = cljs.core._chunked_rest[goog.typeOf(x__2397__auto____66553)];
      if(or__3824__auto____66554) {
        return or__3824__auto____66554
      }else {
        var or__3824__auto____66555 = cljs.core._chunked_rest["_"];
        if(or__3824__auto____66555) {
          return or__3824__auto____66555
        }else {
          throw cljs.core.missing_protocol.call(null, "IChunkedSeq.-chunked-rest", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.IChunkedNext = {};
cljs.core._chunked_next = function _chunked_next(coll) {
  if(function() {
    var and__3822__auto____66560 = coll;
    if(and__3822__auto____66560) {
      return coll.cljs$core$IChunkedNext$_chunked_next$arity$1
    }else {
      return and__3822__auto____66560
    }
  }()) {
    return coll.cljs$core$IChunkedNext$_chunked_next$arity$1(coll)
  }else {
    var x__2397__auto____66561 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____66562 = cljs.core._chunked_next[goog.typeOf(x__2397__auto____66561)];
      if(or__3824__auto____66562) {
        return or__3824__auto____66562
      }else {
        var or__3824__auto____66563 = cljs.core._chunked_next["_"];
        if(or__3824__auto____66563) {
          return or__3824__auto____66563
        }else {
          throw cljs.core.missing_protocol.call(null, "IChunkedNext.-chunked-next", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.identical_QMARK_ = function identical_QMARK_(x, y) {
  return x === y
};
cljs.core._EQ_ = function() {
  var _EQ_ = null;
  var _EQ___1 = function(x) {
    return true
  };
  var _EQ___2 = function(x, y) {
    var or__3824__auto____66565 = x === y;
    if(or__3824__auto____66565) {
      return or__3824__auto____66565
    }else {
      return cljs.core._equiv.call(null, x, y)
    }
  };
  var _EQ___3 = function() {
    var G__66566__delegate = function(x, y, more) {
      while(true) {
        if(cljs.core.truth_(_EQ_.call(null, x, y))) {
          if(cljs.core.next.call(null, more)) {
            var G__66567 = y;
            var G__66568 = cljs.core.first.call(null, more);
            var G__66569 = cljs.core.next.call(null, more);
            x = G__66567;
            y = G__66568;
            more = G__66569;
            continue
          }else {
            return _EQ_.call(null, y, cljs.core.first.call(null, more))
          }
        }else {
          return false
        }
        break
      }
    };
    var G__66566 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__66566__delegate.call(this, x, y, more)
    };
    G__66566.cljs$lang$maxFixedArity = 2;
    G__66566.cljs$lang$applyTo = function(arglist__66570) {
      var x = cljs.core.first(arglist__66570);
      var y = cljs.core.first(cljs.core.next(arglist__66570));
      var more = cljs.core.rest(cljs.core.next(arglist__66570));
      return G__66566__delegate(x, y, more)
    };
    G__66566.cljs$lang$arity$variadic = G__66566__delegate;
    return G__66566
  }();
  _EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _EQ___1.call(this, x);
      case 2:
        return _EQ___2.call(this, x, y);
      default:
        return _EQ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _EQ_.cljs$lang$maxFixedArity = 2;
  _EQ_.cljs$lang$applyTo = _EQ___3.cljs$lang$applyTo;
  _EQ_.cljs$lang$arity$1 = _EQ___1;
  _EQ_.cljs$lang$arity$2 = _EQ___2;
  _EQ_.cljs$lang$arity$variadic = _EQ___3.cljs$lang$arity$variadic;
  return _EQ_
}();
cljs.core.nil_QMARK_ = function nil_QMARK_(x) {
  return x == null
};
cljs.core.type = function type(x) {
  if(x == null) {
    return null
  }else {
    return x.constructor
  }
};
cljs.core.instance_QMARK_ = function instance_QMARK_(t, o) {
  return o instanceof t
};
cljs.core.IHash["null"] = true;
cljs.core._hash["null"] = function(o) {
  return 0
};
cljs.core.ILookup["null"] = true;
cljs.core._lookup["null"] = function() {
  var G__66571 = null;
  var G__66571__2 = function(o, k) {
    return null
  };
  var G__66571__3 = function(o, k, not_found) {
    return not_found
  };
  G__66571 = function(o, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__66571__2.call(this, o, k);
      case 3:
        return G__66571__3.call(this, o, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__66571
}();
cljs.core.IAssociative["null"] = true;
cljs.core._assoc["null"] = function(_, k, v) {
  return cljs.core.hash_map.call(null, k, v)
};
cljs.core.INext["null"] = true;
cljs.core._next["null"] = function(_) {
  return null
};
cljs.core.ICollection["null"] = true;
cljs.core._conj["null"] = function(_, o) {
  return cljs.core.list.call(null, o)
};
cljs.core.IReduce["null"] = true;
cljs.core._reduce["null"] = function() {
  var G__66572 = null;
  var G__66572__2 = function(_, f) {
    return f.call(null)
  };
  var G__66572__3 = function(_, f, start) {
    return start
  };
  G__66572 = function(_, f, start) {
    switch(arguments.length) {
      case 2:
        return G__66572__2.call(this, _, f);
      case 3:
        return G__66572__3.call(this, _, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__66572
}();
cljs.core.IPrintable["null"] = true;
cljs.core._pr_seq["null"] = function(o) {
  return cljs.core.list.call(null, "nil")
};
cljs.core.ISet["null"] = true;
cljs.core._disjoin["null"] = function(_, v) {
  return null
};
cljs.core.ICounted["null"] = true;
cljs.core._count["null"] = function(_) {
  return 0
};
cljs.core.IStack["null"] = true;
cljs.core._peek["null"] = function(_) {
  return null
};
cljs.core._pop["null"] = function(_) {
  return null
};
cljs.core.ISeq["null"] = true;
cljs.core._first["null"] = function(_) {
  return null
};
cljs.core._rest["null"] = function(_) {
  return cljs.core.list.call(null)
};
cljs.core.IEquiv["null"] = true;
cljs.core._equiv["null"] = function(_, o) {
  return o == null
};
cljs.core.IWithMeta["null"] = true;
cljs.core._with_meta["null"] = function(_, meta) {
  return null
};
cljs.core.IMeta["null"] = true;
cljs.core._meta["null"] = function(_) {
  return null
};
cljs.core.IIndexed["null"] = true;
cljs.core._nth["null"] = function() {
  var G__66573 = null;
  var G__66573__2 = function(_, n) {
    return null
  };
  var G__66573__3 = function(_, n, not_found) {
    return not_found
  };
  G__66573 = function(_, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__66573__2.call(this, _, n);
      case 3:
        return G__66573__3.call(this, _, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__66573
}();
cljs.core.IEmptyableCollection["null"] = true;
cljs.core._empty["null"] = function(_) {
  return null
};
cljs.core.IMap["null"] = true;
cljs.core._dissoc["null"] = function(_, k) {
  return null
};
Date.prototype.cljs$core$IEquiv$ = true;
Date.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(o, other) {
  var and__3822__auto____66574 = cljs.core.instance_QMARK_.call(null, Date, other);
  if(and__3822__auto____66574) {
    return o.toString() === other.toString()
  }else {
    return and__3822__auto____66574
  }
};
cljs.core.IHash["number"] = true;
cljs.core._hash["number"] = function(o) {
  return o
};
cljs.core.IEquiv["number"] = true;
cljs.core._equiv["number"] = function(x, o) {
  return x === o
};
cljs.core.IHash["boolean"] = true;
cljs.core._hash["boolean"] = function(o) {
  if(o === true) {
    return 1
  }else {
    return 0
  }
};
cljs.core.IHash["_"] = true;
cljs.core._hash["_"] = function(o) {
  return goog.getUid(o)
};
cljs.core.inc = function inc(x) {
  return x + 1
};
cljs.core.ci_reduce = function() {
  var ci_reduce = null;
  var ci_reduce__2 = function(cicoll, f) {
    var cnt__66587 = cljs.core._count.call(null, cicoll);
    if(cnt__66587 === 0) {
      return f.call(null)
    }else {
      var val__66588 = cljs.core._nth.call(null, cicoll, 0);
      var n__66589 = 1;
      while(true) {
        if(n__66589 < cnt__66587) {
          var nval__66590 = f.call(null, val__66588, cljs.core._nth.call(null, cicoll, n__66589));
          if(cljs.core.reduced_QMARK_.call(null, nval__66590)) {
            return cljs.core.deref.call(null, nval__66590)
          }else {
            var G__66599 = nval__66590;
            var G__66600 = n__66589 + 1;
            val__66588 = G__66599;
            n__66589 = G__66600;
            continue
          }
        }else {
          return val__66588
        }
        break
      }
    }
  };
  var ci_reduce__3 = function(cicoll, f, val) {
    var cnt__66591 = cljs.core._count.call(null, cicoll);
    var val__66592 = val;
    var n__66593 = 0;
    while(true) {
      if(n__66593 < cnt__66591) {
        var nval__66594 = f.call(null, val__66592, cljs.core._nth.call(null, cicoll, n__66593));
        if(cljs.core.reduced_QMARK_.call(null, nval__66594)) {
          return cljs.core.deref.call(null, nval__66594)
        }else {
          var G__66601 = nval__66594;
          var G__66602 = n__66593 + 1;
          val__66592 = G__66601;
          n__66593 = G__66602;
          continue
        }
      }else {
        return val__66592
      }
      break
    }
  };
  var ci_reduce__4 = function(cicoll, f, val, idx) {
    var cnt__66595 = cljs.core._count.call(null, cicoll);
    var val__66596 = val;
    var n__66597 = idx;
    while(true) {
      if(n__66597 < cnt__66595) {
        var nval__66598 = f.call(null, val__66596, cljs.core._nth.call(null, cicoll, n__66597));
        if(cljs.core.reduced_QMARK_.call(null, nval__66598)) {
          return cljs.core.deref.call(null, nval__66598)
        }else {
          var G__66603 = nval__66598;
          var G__66604 = n__66597 + 1;
          val__66596 = G__66603;
          n__66597 = G__66604;
          continue
        }
      }else {
        return val__66596
      }
      break
    }
  };
  ci_reduce = function(cicoll, f, val, idx) {
    switch(arguments.length) {
      case 2:
        return ci_reduce__2.call(this, cicoll, f);
      case 3:
        return ci_reduce__3.call(this, cicoll, f, val);
      case 4:
        return ci_reduce__4.call(this, cicoll, f, val, idx)
    }
    throw"Invalid arity: " + arguments.length;
  };
  ci_reduce.cljs$lang$arity$2 = ci_reduce__2;
  ci_reduce.cljs$lang$arity$3 = ci_reduce__3;
  ci_reduce.cljs$lang$arity$4 = ci_reduce__4;
  return ci_reduce
}();
cljs.core.array_reduce = function() {
  var array_reduce = null;
  var array_reduce__2 = function(arr, f) {
    var cnt__66617 = arr.length;
    if(arr.length === 0) {
      return f.call(null)
    }else {
      var val__66618 = arr[0];
      var n__66619 = 1;
      while(true) {
        if(n__66619 < cnt__66617) {
          var nval__66620 = f.call(null, val__66618, arr[n__66619]);
          if(cljs.core.reduced_QMARK_.call(null, nval__66620)) {
            return cljs.core.deref.call(null, nval__66620)
          }else {
            var G__66629 = nval__66620;
            var G__66630 = n__66619 + 1;
            val__66618 = G__66629;
            n__66619 = G__66630;
            continue
          }
        }else {
          return val__66618
        }
        break
      }
    }
  };
  var array_reduce__3 = function(arr, f, val) {
    var cnt__66621 = arr.length;
    var val__66622 = val;
    var n__66623 = 0;
    while(true) {
      if(n__66623 < cnt__66621) {
        var nval__66624 = f.call(null, val__66622, arr[n__66623]);
        if(cljs.core.reduced_QMARK_.call(null, nval__66624)) {
          return cljs.core.deref.call(null, nval__66624)
        }else {
          var G__66631 = nval__66624;
          var G__66632 = n__66623 + 1;
          val__66622 = G__66631;
          n__66623 = G__66632;
          continue
        }
      }else {
        return val__66622
      }
      break
    }
  };
  var array_reduce__4 = function(arr, f, val, idx) {
    var cnt__66625 = arr.length;
    var val__66626 = val;
    var n__66627 = idx;
    while(true) {
      if(n__66627 < cnt__66625) {
        var nval__66628 = f.call(null, val__66626, arr[n__66627]);
        if(cljs.core.reduced_QMARK_.call(null, nval__66628)) {
          return cljs.core.deref.call(null, nval__66628)
        }else {
          var G__66633 = nval__66628;
          var G__66634 = n__66627 + 1;
          val__66626 = G__66633;
          n__66627 = G__66634;
          continue
        }
      }else {
        return val__66626
      }
      break
    }
  };
  array_reduce = function(arr, f, val, idx) {
    switch(arguments.length) {
      case 2:
        return array_reduce__2.call(this, arr, f);
      case 3:
        return array_reduce__3.call(this, arr, f, val);
      case 4:
        return array_reduce__4.call(this, arr, f, val, idx)
    }
    throw"Invalid arity: " + arguments.length;
  };
  array_reduce.cljs$lang$arity$2 = array_reduce__2;
  array_reduce.cljs$lang$arity$3 = array_reduce__3;
  array_reduce.cljs$lang$arity$4 = array_reduce__4;
  return array_reduce
}();
cljs.core.IndexedSeq = function(a, i) {
  this.a = a;
  this.i = i;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 166199546
};
cljs.core.IndexedSeq.cljs$lang$type = true;
cljs.core.IndexedSeq.cljs$lang$ctorPrSeq = function(this__2343__auto__) {
  return cljs.core.list.call(null, "cljs.core/IndexedSeq")
};
cljs.core.IndexedSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__66635 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.IndexedSeq.prototype.cljs$core$INext$_next$arity$1 = function(_) {
  var this__66636 = this;
  if(this__66636.i + 1 < this__66636.a.length) {
    return new cljs.core.IndexedSeq(this__66636.a, this__66636.i + 1)
  }else {
    return null
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__66637 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.IndexedSeq.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__66638 = this;
  var c__66639 = coll.cljs$core$ICounted$_count$arity$1(coll);
  if(c__66639 > 0) {
    return new cljs.core.RSeq(coll, c__66639 - 1, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.IndexedSeq.prototype.toString = function() {
  var this__66640 = this;
  var this__66641 = this;
  return cljs.core.pr_str.call(null, this__66641)
};
cljs.core.IndexedSeq.prototype.cljs$core$IReduce$_reduce$arity$2 = function(coll, f) {
  var this__66642 = this;
  if(cljs.core.counted_QMARK_.call(null, this__66642.a)) {
    return cljs.core.ci_reduce.call(null, this__66642.a, f, this__66642.a[this__66642.i], this__66642.i + 1)
  }else {
    return cljs.core.ci_reduce.call(null, coll, f, this__66642.a[this__66642.i], 0)
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$IReduce$_reduce$arity$3 = function(coll, f, start) {
  var this__66643 = this;
  if(cljs.core.counted_QMARK_.call(null, this__66643.a)) {
    return cljs.core.ci_reduce.call(null, this__66643.a, f, start, this__66643.i)
  }else {
    return cljs.core.ci_reduce.call(null, coll, f, start, 0)
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__66644 = this;
  return this$
};
cljs.core.IndexedSeq.prototype.cljs$core$ICounted$_count$arity$1 = function(_) {
  var this__66645 = this;
  return this__66645.a.length - this__66645.i
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(_) {
  var this__66646 = this;
  return this__66646.a[this__66646.i]
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(_) {
  var this__66647 = this;
  if(this__66647.i + 1 < this__66647.a.length) {
    return new cljs.core.IndexedSeq(this__66647.a, this__66647.i + 1)
  }else {
    return cljs.core.list.call(null)
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__66648 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.IndexedSeq.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__66649 = this;
  var i__66650 = n + this__66649.i;
  if(i__66650 < this__66649.a.length) {
    return this__66649.a[i__66650]
  }else {
    return null
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__66651 = this;
  var i__66652 = n + this__66651.i;
  if(i__66652 < this__66651.a.length) {
    return this__66651.a[i__66652]
  }else {
    return not_found
  }
};
cljs.core.IndexedSeq;
cljs.core.prim_seq = function() {
  var prim_seq = null;
  var prim_seq__1 = function(prim) {
    return prim_seq.call(null, prim, 0)
  };
  var prim_seq__2 = function(prim, i) {
    if(prim.length === 0) {
      return null
    }else {
      return new cljs.core.IndexedSeq(prim, i)
    }
  };
  prim_seq = function(prim, i) {
    switch(arguments.length) {
      case 1:
        return prim_seq__1.call(this, prim);
      case 2:
        return prim_seq__2.call(this, prim, i)
    }
    throw"Invalid arity: " + arguments.length;
  };
  prim_seq.cljs$lang$arity$1 = prim_seq__1;
  prim_seq.cljs$lang$arity$2 = prim_seq__2;
  return prim_seq
}();
cljs.core.array_seq = function() {
  var array_seq = null;
  var array_seq__1 = function(array) {
    return cljs.core.prim_seq.call(null, array, 0)
  };
  var array_seq__2 = function(array, i) {
    return cljs.core.prim_seq.call(null, array, i)
  };
  array_seq = function(array, i) {
    switch(arguments.length) {
      case 1:
        return array_seq__1.call(this, array);
      case 2:
        return array_seq__2.call(this, array, i)
    }
    throw"Invalid arity: " + arguments.length;
  };
  array_seq.cljs$lang$arity$1 = array_seq__1;
  array_seq.cljs$lang$arity$2 = array_seq__2;
  return array_seq
}();
cljs.core.IReduce["array"] = true;
cljs.core._reduce["array"] = function() {
  var G__66653 = null;
  var G__66653__2 = function(array, f) {
    return cljs.core.ci_reduce.call(null, array, f)
  };
  var G__66653__3 = function(array, f, start) {
    return cljs.core.ci_reduce.call(null, array, f, start)
  };
  G__66653 = function(array, f, start) {
    switch(arguments.length) {
      case 2:
        return G__66653__2.call(this, array, f);
      case 3:
        return G__66653__3.call(this, array, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__66653
}();
cljs.core.ILookup["array"] = true;
cljs.core._lookup["array"] = function() {
  var G__66654 = null;
  var G__66654__2 = function(array, k) {
    return array[k]
  };
  var G__66654__3 = function(array, k, not_found) {
    return cljs.core._nth.call(null, array, k, not_found)
  };
  G__66654 = function(array, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__66654__2.call(this, array, k);
      case 3:
        return G__66654__3.call(this, array, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__66654
}();
cljs.core.IIndexed["array"] = true;
cljs.core._nth["array"] = function() {
  var G__66655 = null;
  var G__66655__2 = function(array, n) {
    if(n < array.length) {
      return array[n]
    }else {
      return null
    }
  };
  var G__66655__3 = function(array, n, not_found) {
    if(n < array.length) {
      return array[n]
    }else {
      return not_found
    }
  };
  G__66655 = function(array, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__66655__2.call(this, array, n);
      case 3:
        return G__66655__3.call(this, array, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__66655
}();
cljs.core.ICounted["array"] = true;
cljs.core._count["array"] = function(a) {
  return a.length
};
cljs.core.ISeqable["array"] = true;
cljs.core._seq["array"] = function(array) {
  return cljs.core.array_seq.call(null, array, 0)
};
cljs.core.RSeq = function(ci, i, meta) {
  this.ci = ci;
  this.i = i;
  this.meta = meta;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31850570
};
cljs.core.RSeq.cljs$lang$type = true;
cljs.core.RSeq.cljs$lang$ctorPrSeq = function(this__2343__auto__) {
  return cljs.core.list.call(null, "cljs.core/RSeq")
};
cljs.core.RSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__66656 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.RSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__66657 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.RSeq.prototype.toString = function() {
  var this__66658 = this;
  var this__66659 = this;
  return cljs.core.pr_str.call(null, this__66659)
};
cljs.core.RSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__66660 = this;
  return coll
};
cljs.core.RSeq.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__66661 = this;
  return this__66661.i + 1
};
cljs.core.RSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__66662 = this;
  return cljs.core._nth.call(null, this__66662.ci, this__66662.i)
};
cljs.core.RSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__66663 = this;
  if(this__66663.i > 0) {
    return new cljs.core.RSeq(this__66663.ci, this__66663.i - 1, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.RSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__66664 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.RSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, new_meta) {
  var this__66665 = this;
  return new cljs.core.RSeq(this__66665.ci, this__66665.i, new_meta)
};
cljs.core.RSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__66666 = this;
  return this__66666.meta
};
cljs.core.RSeq;
cljs.core.seq = function seq(coll) {
  if(coll == null) {
    return null
  }else {
    if(function() {
      var G__66670__66671 = coll;
      if(G__66670__66671) {
        if(function() {
          var or__3824__auto____66672 = G__66670__66671.cljs$lang$protocol_mask$partition0$ & 32;
          if(or__3824__auto____66672) {
            return or__3824__auto____66672
          }else {
            return G__66670__66671.cljs$core$ASeq$
          }
        }()) {
          return true
        }else {
          if(!G__66670__66671.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ASeq, G__66670__66671)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ASeq, G__66670__66671)
      }
    }()) {
      return coll
    }else {
      return cljs.core._seq.call(null, coll)
    }
  }
};
cljs.core.first = function first(coll) {
  if(coll == null) {
    return null
  }else {
    if(function() {
      var G__66677__66678 = coll;
      if(G__66677__66678) {
        if(function() {
          var or__3824__auto____66679 = G__66677__66678.cljs$lang$protocol_mask$partition0$ & 64;
          if(or__3824__auto____66679) {
            return or__3824__auto____66679
          }else {
            return G__66677__66678.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          if(!G__66677__66678.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__66677__66678)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__66677__66678)
      }
    }()) {
      return cljs.core._first.call(null, coll)
    }else {
      var s__66680 = cljs.core.seq.call(null, coll);
      if(s__66680 == null) {
        return null
      }else {
        return cljs.core._first.call(null, s__66680)
      }
    }
  }
};
cljs.core.rest = function rest(coll) {
  if(!(coll == null)) {
    if(function() {
      var G__66685__66686 = coll;
      if(G__66685__66686) {
        if(function() {
          var or__3824__auto____66687 = G__66685__66686.cljs$lang$protocol_mask$partition0$ & 64;
          if(or__3824__auto____66687) {
            return or__3824__auto____66687
          }else {
            return G__66685__66686.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          if(!G__66685__66686.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__66685__66686)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__66685__66686)
      }
    }()) {
      return cljs.core._rest.call(null, coll)
    }else {
      var s__66688 = cljs.core.seq.call(null, coll);
      if(!(s__66688 == null)) {
        return cljs.core._rest.call(null, s__66688)
      }else {
        return cljs.core.List.EMPTY
      }
    }
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.next = function next(coll) {
  if(coll == null) {
    return null
  }else {
    if(function() {
      var G__66692__66693 = coll;
      if(G__66692__66693) {
        if(function() {
          var or__3824__auto____66694 = G__66692__66693.cljs$lang$protocol_mask$partition0$ & 128;
          if(or__3824__auto____66694) {
            return or__3824__auto____66694
          }else {
            return G__66692__66693.cljs$core$INext$
          }
        }()) {
          return true
        }else {
          if(!G__66692__66693.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.INext, G__66692__66693)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.INext, G__66692__66693)
      }
    }()) {
      return cljs.core._next.call(null, coll)
    }else {
      return cljs.core.seq.call(null, cljs.core.rest.call(null, coll))
    }
  }
};
cljs.core.second = function second(coll) {
  return cljs.core.first.call(null, cljs.core.next.call(null, coll))
};
cljs.core.ffirst = function ffirst(coll) {
  return cljs.core.first.call(null, cljs.core.first.call(null, coll))
};
cljs.core.nfirst = function nfirst(coll) {
  return cljs.core.next.call(null, cljs.core.first.call(null, coll))
};
cljs.core.fnext = function fnext(coll) {
  return cljs.core.first.call(null, cljs.core.next.call(null, coll))
};
cljs.core.nnext = function nnext(coll) {
  return cljs.core.next.call(null, cljs.core.next.call(null, coll))
};
cljs.core.last = function last(s) {
  while(true) {
    var sn__66696 = cljs.core.next.call(null, s);
    if(!(sn__66696 == null)) {
      var G__66697 = sn__66696;
      s = G__66697;
      continue
    }else {
      return cljs.core.first.call(null, s)
    }
    break
  }
};
cljs.core.IEquiv["_"] = true;
cljs.core._equiv["_"] = function(x, o) {
  return x === o
};
cljs.core.not = function not(x) {
  if(cljs.core.truth_(x)) {
    return false
  }else {
    return true
  }
};
cljs.core.conj = function() {
  var conj = null;
  var conj__2 = function(coll, x) {
    return cljs.core._conj.call(null, coll, x)
  };
  var conj__3 = function() {
    var G__66698__delegate = function(coll, x, xs) {
      while(true) {
        if(cljs.core.truth_(xs)) {
          var G__66699 = conj.call(null, coll, x);
          var G__66700 = cljs.core.first.call(null, xs);
          var G__66701 = cljs.core.next.call(null, xs);
          coll = G__66699;
          x = G__66700;
          xs = G__66701;
          continue
        }else {
          return conj.call(null, coll, x)
        }
        break
      }
    };
    var G__66698 = function(coll, x, var_args) {
      var xs = null;
      if(goog.isDef(var_args)) {
        xs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__66698__delegate.call(this, coll, x, xs)
    };
    G__66698.cljs$lang$maxFixedArity = 2;
    G__66698.cljs$lang$applyTo = function(arglist__66702) {
      var coll = cljs.core.first(arglist__66702);
      var x = cljs.core.first(cljs.core.next(arglist__66702));
      var xs = cljs.core.rest(cljs.core.next(arglist__66702));
      return G__66698__delegate(coll, x, xs)
    };
    G__66698.cljs$lang$arity$variadic = G__66698__delegate;
    return G__66698
  }();
  conj = function(coll, x, var_args) {
    var xs = var_args;
    switch(arguments.length) {
      case 2:
        return conj__2.call(this, coll, x);
      default:
        return conj__3.cljs$lang$arity$variadic(coll, x, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  conj.cljs$lang$maxFixedArity = 2;
  conj.cljs$lang$applyTo = conj__3.cljs$lang$applyTo;
  conj.cljs$lang$arity$2 = conj__2;
  conj.cljs$lang$arity$variadic = conj__3.cljs$lang$arity$variadic;
  return conj
}();
cljs.core.empty = function empty(coll) {
  return cljs.core._empty.call(null, coll)
};
cljs.core.accumulating_seq_count = function accumulating_seq_count(coll) {
  var s__66705 = cljs.core.seq.call(null, coll);
  var acc__66706 = 0;
  while(true) {
    if(cljs.core.counted_QMARK_.call(null, s__66705)) {
      return acc__66706 + cljs.core._count.call(null, s__66705)
    }else {
      var G__66707 = cljs.core.next.call(null, s__66705);
      var G__66708 = acc__66706 + 1;
      s__66705 = G__66707;
      acc__66706 = G__66708;
      continue
    }
    break
  }
};
cljs.core.count = function count(coll) {
  if(cljs.core.counted_QMARK_.call(null, coll)) {
    return cljs.core._count.call(null, coll)
  }else {
    return cljs.core.accumulating_seq_count.call(null, coll)
  }
};
cljs.core.linear_traversal_nth = function() {
  var linear_traversal_nth = null;
  var linear_traversal_nth__2 = function(coll, n) {
    if(coll == null) {
      throw new Error("Index out of bounds");
    }else {
      if(n === 0) {
        if(cljs.core.seq.call(null, coll)) {
          return cljs.core.first.call(null, coll)
        }else {
          throw new Error("Index out of bounds");
        }
      }else {
        if(cljs.core.indexed_QMARK_.call(null, coll)) {
          return cljs.core._nth.call(null, coll, n)
        }else {
          if(cljs.core.seq.call(null, coll)) {
            return linear_traversal_nth.call(null, cljs.core.next.call(null, coll), n - 1)
          }else {
            if("\ufdd0'else") {
              throw new Error("Index out of bounds");
            }else {
              return null
            }
          }
        }
      }
    }
  };
  var linear_traversal_nth__3 = function(coll, n, not_found) {
    if(coll == null) {
      return not_found
    }else {
      if(n === 0) {
        if(cljs.core.seq.call(null, coll)) {
          return cljs.core.first.call(null, coll)
        }else {
          return not_found
        }
      }else {
        if(cljs.core.indexed_QMARK_.call(null, coll)) {
          return cljs.core._nth.call(null, coll, n, not_found)
        }else {
          if(cljs.core.seq.call(null, coll)) {
            return linear_traversal_nth.call(null, cljs.core.next.call(null, coll), n - 1, not_found)
          }else {
            if("\ufdd0'else") {
              return not_found
            }else {
              return null
            }
          }
        }
      }
    }
  };
  linear_traversal_nth = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return linear_traversal_nth__2.call(this, coll, n);
      case 3:
        return linear_traversal_nth__3.call(this, coll, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  linear_traversal_nth.cljs$lang$arity$2 = linear_traversal_nth__2;
  linear_traversal_nth.cljs$lang$arity$3 = linear_traversal_nth__3;
  return linear_traversal_nth
}();
cljs.core.nth = function() {
  var nth = null;
  var nth__2 = function(coll, n) {
    if(coll == null) {
      return null
    }else {
      if(function() {
        var G__66715__66716 = coll;
        if(G__66715__66716) {
          if(function() {
            var or__3824__auto____66717 = G__66715__66716.cljs$lang$protocol_mask$partition0$ & 16;
            if(or__3824__auto____66717) {
              return or__3824__auto____66717
            }else {
              return G__66715__66716.cljs$core$IIndexed$
            }
          }()) {
            return true
          }else {
            if(!G__66715__66716.cljs$lang$protocol_mask$partition0$) {
              return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__66715__66716)
            }else {
              return false
            }
          }
        }else {
          return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__66715__66716)
        }
      }()) {
        return cljs.core._nth.call(null, coll, Math.floor(n))
      }else {
        return cljs.core.linear_traversal_nth.call(null, coll, Math.floor(n))
      }
    }
  };
  var nth__3 = function(coll, n, not_found) {
    if(!(coll == null)) {
      if(function() {
        var G__66718__66719 = coll;
        if(G__66718__66719) {
          if(function() {
            var or__3824__auto____66720 = G__66718__66719.cljs$lang$protocol_mask$partition0$ & 16;
            if(or__3824__auto____66720) {
              return or__3824__auto____66720
            }else {
              return G__66718__66719.cljs$core$IIndexed$
            }
          }()) {
            return true
          }else {
            if(!G__66718__66719.cljs$lang$protocol_mask$partition0$) {
              return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__66718__66719)
            }else {
              return false
            }
          }
        }else {
          return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__66718__66719)
        }
      }()) {
        return cljs.core._nth.call(null, coll, Math.floor(n), not_found)
      }else {
        return cljs.core.linear_traversal_nth.call(null, coll, Math.floor(n), not_found)
      }
    }else {
      return not_found
    }
  };
  nth = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return nth__2.call(this, coll, n);
      case 3:
        return nth__3.call(this, coll, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  nth.cljs$lang$arity$2 = nth__2;
  nth.cljs$lang$arity$3 = nth__3;
  return nth
}();
cljs.core.get = function() {
  var get = null;
  var get__2 = function(o, k) {
    return cljs.core._lookup.call(null, o, k)
  };
  var get__3 = function(o, k, not_found) {
    return cljs.core._lookup.call(null, o, k, not_found)
  };
  get = function(o, k, not_found) {
    switch(arguments.length) {
      case 2:
        return get__2.call(this, o, k);
      case 3:
        return get__3.call(this, o, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  get.cljs$lang$arity$2 = get__2;
  get.cljs$lang$arity$3 = get__3;
  return get
}();
cljs.core.assoc = function() {
  var assoc = null;
  var assoc__3 = function(coll, k, v) {
    return cljs.core._assoc.call(null, coll, k, v)
  };
  var assoc__4 = function() {
    var G__66723__delegate = function(coll, k, v, kvs) {
      while(true) {
        var ret__66722 = assoc.call(null, coll, k, v);
        if(cljs.core.truth_(kvs)) {
          var G__66724 = ret__66722;
          var G__66725 = cljs.core.first.call(null, kvs);
          var G__66726 = cljs.core.second.call(null, kvs);
          var G__66727 = cljs.core.nnext.call(null, kvs);
          coll = G__66724;
          k = G__66725;
          v = G__66726;
          kvs = G__66727;
          continue
        }else {
          return ret__66722
        }
        break
      }
    };
    var G__66723 = function(coll, k, v, var_args) {
      var kvs = null;
      if(goog.isDef(var_args)) {
        kvs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__66723__delegate.call(this, coll, k, v, kvs)
    };
    G__66723.cljs$lang$maxFixedArity = 3;
    G__66723.cljs$lang$applyTo = function(arglist__66728) {
      var coll = cljs.core.first(arglist__66728);
      var k = cljs.core.first(cljs.core.next(arglist__66728));
      var v = cljs.core.first(cljs.core.next(cljs.core.next(arglist__66728)));
      var kvs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__66728)));
      return G__66723__delegate(coll, k, v, kvs)
    };
    G__66723.cljs$lang$arity$variadic = G__66723__delegate;
    return G__66723
  }();
  assoc = function(coll, k, v, var_args) {
    var kvs = var_args;
    switch(arguments.length) {
      case 3:
        return assoc__3.call(this, coll, k, v);
      default:
        return assoc__4.cljs$lang$arity$variadic(coll, k, v, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  assoc.cljs$lang$maxFixedArity = 3;
  assoc.cljs$lang$applyTo = assoc__4.cljs$lang$applyTo;
  assoc.cljs$lang$arity$3 = assoc__3;
  assoc.cljs$lang$arity$variadic = assoc__4.cljs$lang$arity$variadic;
  return assoc
}();
cljs.core.dissoc = function() {
  var dissoc = null;
  var dissoc__1 = function(coll) {
    return coll
  };
  var dissoc__2 = function(coll, k) {
    return cljs.core._dissoc.call(null, coll, k)
  };
  var dissoc__3 = function() {
    var G__66731__delegate = function(coll, k, ks) {
      while(true) {
        var ret__66730 = dissoc.call(null, coll, k);
        if(cljs.core.truth_(ks)) {
          var G__66732 = ret__66730;
          var G__66733 = cljs.core.first.call(null, ks);
          var G__66734 = cljs.core.next.call(null, ks);
          coll = G__66732;
          k = G__66733;
          ks = G__66734;
          continue
        }else {
          return ret__66730
        }
        break
      }
    };
    var G__66731 = function(coll, k, var_args) {
      var ks = null;
      if(goog.isDef(var_args)) {
        ks = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__66731__delegate.call(this, coll, k, ks)
    };
    G__66731.cljs$lang$maxFixedArity = 2;
    G__66731.cljs$lang$applyTo = function(arglist__66735) {
      var coll = cljs.core.first(arglist__66735);
      var k = cljs.core.first(cljs.core.next(arglist__66735));
      var ks = cljs.core.rest(cljs.core.next(arglist__66735));
      return G__66731__delegate(coll, k, ks)
    };
    G__66731.cljs$lang$arity$variadic = G__66731__delegate;
    return G__66731
  }();
  dissoc = function(coll, k, var_args) {
    var ks = var_args;
    switch(arguments.length) {
      case 1:
        return dissoc__1.call(this, coll);
      case 2:
        return dissoc__2.call(this, coll, k);
      default:
        return dissoc__3.cljs$lang$arity$variadic(coll, k, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  dissoc.cljs$lang$maxFixedArity = 2;
  dissoc.cljs$lang$applyTo = dissoc__3.cljs$lang$applyTo;
  dissoc.cljs$lang$arity$1 = dissoc__1;
  dissoc.cljs$lang$arity$2 = dissoc__2;
  dissoc.cljs$lang$arity$variadic = dissoc__3.cljs$lang$arity$variadic;
  return dissoc
}();
cljs.core.with_meta = function with_meta(o, meta) {
  return cljs.core._with_meta.call(null, o, meta)
};
cljs.core.meta = function meta(o) {
  if(function() {
    var G__66739__66740 = o;
    if(G__66739__66740) {
      if(function() {
        var or__3824__auto____66741 = G__66739__66740.cljs$lang$protocol_mask$partition0$ & 131072;
        if(or__3824__auto____66741) {
          return or__3824__auto____66741
        }else {
          return G__66739__66740.cljs$core$IMeta$
        }
      }()) {
        return true
      }else {
        if(!G__66739__66740.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__66739__66740)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__66739__66740)
    }
  }()) {
    return cljs.core._meta.call(null, o)
  }else {
    return null
  }
};
cljs.core.peek = function peek(coll) {
  return cljs.core._peek.call(null, coll)
};
cljs.core.pop = function pop(coll) {
  return cljs.core._pop.call(null, coll)
};
cljs.core.disj = function() {
  var disj = null;
  var disj__1 = function(coll) {
    return coll
  };
  var disj__2 = function(coll, k) {
    return cljs.core._disjoin.call(null, coll, k)
  };
  var disj__3 = function() {
    var G__66744__delegate = function(coll, k, ks) {
      while(true) {
        var ret__66743 = disj.call(null, coll, k);
        if(cljs.core.truth_(ks)) {
          var G__66745 = ret__66743;
          var G__66746 = cljs.core.first.call(null, ks);
          var G__66747 = cljs.core.next.call(null, ks);
          coll = G__66745;
          k = G__66746;
          ks = G__66747;
          continue
        }else {
          return ret__66743
        }
        break
      }
    };
    var G__66744 = function(coll, k, var_args) {
      var ks = null;
      if(goog.isDef(var_args)) {
        ks = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__66744__delegate.call(this, coll, k, ks)
    };
    G__66744.cljs$lang$maxFixedArity = 2;
    G__66744.cljs$lang$applyTo = function(arglist__66748) {
      var coll = cljs.core.first(arglist__66748);
      var k = cljs.core.first(cljs.core.next(arglist__66748));
      var ks = cljs.core.rest(cljs.core.next(arglist__66748));
      return G__66744__delegate(coll, k, ks)
    };
    G__66744.cljs$lang$arity$variadic = G__66744__delegate;
    return G__66744
  }();
  disj = function(coll, k, var_args) {
    var ks = var_args;
    switch(arguments.length) {
      case 1:
        return disj__1.call(this, coll);
      case 2:
        return disj__2.call(this, coll, k);
      default:
        return disj__3.cljs$lang$arity$variadic(coll, k, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  disj.cljs$lang$maxFixedArity = 2;
  disj.cljs$lang$applyTo = disj__3.cljs$lang$applyTo;
  disj.cljs$lang$arity$1 = disj__1;
  disj.cljs$lang$arity$2 = disj__2;
  disj.cljs$lang$arity$variadic = disj__3.cljs$lang$arity$variadic;
  return disj
}();
cljs.core.string_hash_cache = {};
cljs.core.string_hash_cache_count = 0;
cljs.core.add_to_string_hash_cache = function add_to_string_hash_cache(k) {
  var h__66750 = goog.string.hashCode(k);
  cljs.core.string_hash_cache[k] = h__66750;
  cljs.core.string_hash_cache_count = cljs.core.string_hash_cache_count + 1;
  return h__66750
};
cljs.core.check_string_hash_cache = function check_string_hash_cache(k) {
  if(cljs.core.string_hash_cache_count > 255) {
    cljs.core.string_hash_cache = {};
    cljs.core.string_hash_cache_count = 0
  }else {
  }
  var h__66752 = cljs.core.string_hash_cache[k];
  if(!(h__66752 == null)) {
    return h__66752
  }else {
    return cljs.core.add_to_string_hash_cache.call(null, k)
  }
};
cljs.core.hash = function() {
  var hash = null;
  var hash__1 = function(o) {
    return hash.call(null, o, true)
  };
  var hash__2 = function(o, check_cache) {
    if(function() {
      var and__3822__auto____66754 = goog.isString(o);
      if(and__3822__auto____66754) {
        return check_cache
      }else {
        return and__3822__auto____66754
      }
    }()) {
      return cljs.core.check_string_hash_cache.call(null, o)
    }else {
      return cljs.core._hash.call(null, o)
    }
  };
  hash = function(o, check_cache) {
    switch(arguments.length) {
      case 1:
        return hash__1.call(this, o);
      case 2:
        return hash__2.call(this, o, check_cache)
    }
    throw"Invalid arity: " + arguments.length;
  };
  hash.cljs$lang$arity$1 = hash__1;
  hash.cljs$lang$arity$2 = hash__2;
  return hash
}();
cljs.core.empty_QMARK_ = function empty_QMARK_(coll) {
  return cljs.core.not.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.coll_QMARK_ = function coll_QMARK_(x) {
  if(x == null) {
    return false
  }else {
    var G__66758__66759 = x;
    if(G__66758__66759) {
      if(function() {
        var or__3824__auto____66760 = G__66758__66759.cljs$lang$protocol_mask$partition0$ & 8;
        if(or__3824__auto____66760) {
          return or__3824__auto____66760
        }else {
          return G__66758__66759.cljs$core$ICollection$
        }
      }()) {
        return true
      }else {
        if(!G__66758__66759.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.ICollection, G__66758__66759)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ICollection, G__66758__66759)
    }
  }
};
cljs.core.set_QMARK_ = function set_QMARK_(x) {
  if(x == null) {
    return false
  }else {
    var G__66764__66765 = x;
    if(G__66764__66765) {
      if(function() {
        var or__3824__auto____66766 = G__66764__66765.cljs$lang$protocol_mask$partition0$ & 4096;
        if(or__3824__auto____66766) {
          return or__3824__auto____66766
        }else {
          return G__66764__66765.cljs$core$ISet$
        }
      }()) {
        return true
      }else {
        if(!G__66764__66765.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.ISet, G__66764__66765)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ISet, G__66764__66765)
    }
  }
};
cljs.core.associative_QMARK_ = function associative_QMARK_(x) {
  var G__66770__66771 = x;
  if(G__66770__66771) {
    if(function() {
      var or__3824__auto____66772 = G__66770__66771.cljs$lang$protocol_mask$partition0$ & 512;
      if(or__3824__auto____66772) {
        return or__3824__auto____66772
      }else {
        return G__66770__66771.cljs$core$IAssociative$
      }
    }()) {
      return true
    }else {
      if(!G__66770__66771.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IAssociative, G__66770__66771)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IAssociative, G__66770__66771)
  }
};
cljs.core.sequential_QMARK_ = function sequential_QMARK_(x) {
  var G__66776__66777 = x;
  if(G__66776__66777) {
    if(function() {
      var or__3824__auto____66778 = G__66776__66777.cljs$lang$protocol_mask$partition0$ & 16777216;
      if(or__3824__auto____66778) {
        return or__3824__auto____66778
      }else {
        return G__66776__66777.cljs$core$ISequential$
      }
    }()) {
      return true
    }else {
      if(!G__66776__66777.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISequential, G__66776__66777)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ISequential, G__66776__66777)
  }
};
cljs.core.counted_QMARK_ = function counted_QMARK_(x) {
  var G__66782__66783 = x;
  if(G__66782__66783) {
    if(function() {
      var or__3824__auto____66784 = G__66782__66783.cljs$lang$protocol_mask$partition0$ & 2;
      if(or__3824__auto____66784) {
        return or__3824__auto____66784
      }else {
        return G__66782__66783.cljs$core$ICounted$
      }
    }()) {
      return true
    }else {
      if(!G__66782__66783.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.ICounted, G__66782__66783)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ICounted, G__66782__66783)
  }
};
cljs.core.indexed_QMARK_ = function indexed_QMARK_(x) {
  var G__66788__66789 = x;
  if(G__66788__66789) {
    if(function() {
      var or__3824__auto____66790 = G__66788__66789.cljs$lang$protocol_mask$partition0$ & 16;
      if(or__3824__auto____66790) {
        return or__3824__auto____66790
      }else {
        return G__66788__66789.cljs$core$IIndexed$
      }
    }()) {
      return true
    }else {
      if(!G__66788__66789.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__66788__66789)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__66788__66789)
  }
};
cljs.core.reduceable_QMARK_ = function reduceable_QMARK_(x) {
  var G__66794__66795 = x;
  if(G__66794__66795) {
    if(function() {
      var or__3824__auto____66796 = G__66794__66795.cljs$lang$protocol_mask$partition0$ & 524288;
      if(or__3824__auto____66796) {
        return or__3824__auto____66796
      }else {
        return G__66794__66795.cljs$core$IReduce$
      }
    }()) {
      return true
    }else {
      if(!G__66794__66795.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__66794__66795)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__66794__66795)
  }
};
cljs.core.map_QMARK_ = function map_QMARK_(x) {
  if(x == null) {
    return false
  }else {
    var G__66800__66801 = x;
    if(G__66800__66801) {
      if(function() {
        var or__3824__auto____66802 = G__66800__66801.cljs$lang$protocol_mask$partition0$ & 1024;
        if(or__3824__auto____66802) {
          return or__3824__auto____66802
        }else {
          return G__66800__66801.cljs$core$IMap$
        }
      }()) {
        return true
      }else {
        if(!G__66800__66801.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IMap, G__66800__66801)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IMap, G__66800__66801)
    }
  }
};
cljs.core.vector_QMARK_ = function vector_QMARK_(x) {
  var G__66806__66807 = x;
  if(G__66806__66807) {
    if(function() {
      var or__3824__auto____66808 = G__66806__66807.cljs$lang$protocol_mask$partition0$ & 16384;
      if(or__3824__auto____66808) {
        return or__3824__auto____66808
      }else {
        return G__66806__66807.cljs$core$IVector$
      }
    }()) {
      return true
    }else {
      if(!G__66806__66807.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IVector, G__66806__66807)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IVector, G__66806__66807)
  }
};
cljs.core.chunked_seq_QMARK_ = function chunked_seq_QMARK_(x) {
  var G__66812__66813 = x;
  if(G__66812__66813) {
    if(cljs.core.truth_(function() {
      var or__3824__auto____66814 = null;
      if(cljs.core.truth_(or__3824__auto____66814)) {
        return or__3824__auto____66814
      }else {
        return G__66812__66813.cljs$core$IChunkedSeq$
      }
    }())) {
      return true
    }else {
      if(!G__66812__66813.cljs$lang$protocol_mask$partition$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IChunkedSeq, G__66812__66813)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IChunkedSeq, G__66812__66813)
  }
};
cljs.core.js_obj = function() {
  var js_obj = null;
  var js_obj__0 = function() {
    return{}
  };
  var js_obj__1 = function() {
    var G__66815__delegate = function(keyvals) {
      return cljs.core.apply.call(null, goog.object.create, keyvals)
    };
    var G__66815 = function(var_args) {
      var keyvals = null;
      if(goog.isDef(var_args)) {
        keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__66815__delegate.call(this, keyvals)
    };
    G__66815.cljs$lang$maxFixedArity = 0;
    G__66815.cljs$lang$applyTo = function(arglist__66816) {
      var keyvals = cljs.core.seq(arglist__66816);
      return G__66815__delegate(keyvals)
    };
    G__66815.cljs$lang$arity$variadic = G__66815__delegate;
    return G__66815
  }();
  js_obj = function(var_args) {
    var keyvals = var_args;
    switch(arguments.length) {
      case 0:
        return js_obj__0.call(this);
      default:
        return js_obj__1.cljs$lang$arity$variadic(cljs.core.array_seq(arguments, 0))
    }
    throw"Invalid arity: " + arguments.length;
  };
  js_obj.cljs$lang$maxFixedArity = 0;
  js_obj.cljs$lang$applyTo = js_obj__1.cljs$lang$applyTo;
  js_obj.cljs$lang$arity$0 = js_obj__0;
  js_obj.cljs$lang$arity$variadic = js_obj__1.cljs$lang$arity$variadic;
  return js_obj
}();
cljs.core.js_keys = function js_keys(obj) {
  var keys__66818 = [];
  goog.object.forEach(obj, function(val, key, obj) {
    return keys__66818.push(key)
  });
  return keys__66818
};
cljs.core.js_delete = function js_delete(obj, key) {
  return delete obj[key]
};
cljs.core.array_copy = function array_copy(from, i, to, j, len) {
  var i__66822 = i;
  var j__66823 = j;
  var len__66824 = len;
  while(true) {
    if(len__66824 === 0) {
      return to
    }else {
      to[j__66823] = from[i__66822];
      var G__66825 = i__66822 + 1;
      var G__66826 = j__66823 + 1;
      var G__66827 = len__66824 - 1;
      i__66822 = G__66825;
      j__66823 = G__66826;
      len__66824 = G__66827;
      continue
    }
    break
  }
};
cljs.core.array_copy_downward = function array_copy_downward(from, i, to, j, len) {
  var i__66831 = i + (len - 1);
  var j__66832 = j + (len - 1);
  var len__66833 = len;
  while(true) {
    if(len__66833 === 0) {
      return to
    }else {
      to[j__66832] = from[i__66831];
      var G__66834 = i__66831 - 1;
      var G__66835 = j__66832 - 1;
      var G__66836 = len__66833 - 1;
      i__66831 = G__66834;
      j__66832 = G__66835;
      len__66833 = G__66836;
      continue
    }
    break
  }
};
cljs.core.lookup_sentinel = {};
cljs.core.false_QMARK_ = function false_QMARK_(x) {
  return x === false
};
cljs.core.true_QMARK_ = function true_QMARK_(x) {
  return x === true
};
cljs.core.undefined_QMARK_ = function undefined_QMARK_(x) {
  return void 0 === x
};
cljs.core.seq_QMARK_ = function seq_QMARK_(s) {
  if(s == null) {
    return false
  }else {
    var G__66840__66841 = s;
    if(G__66840__66841) {
      if(function() {
        var or__3824__auto____66842 = G__66840__66841.cljs$lang$protocol_mask$partition0$ & 64;
        if(or__3824__auto____66842) {
          return or__3824__auto____66842
        }else {
          return G__66840__66841.cljs$core$ISeq$
        }
      }()) {
        return true
      }else {
        if(!G__66840__66841.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__66840__66841)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__66840__66841)
    }
  }
};
cljs.core.seqable_QMARK_ = function seqable_QMARK_(s) {
  var G__66846__66847 = s;
  if(G__66846__66847) {
    if(function() {
      var or__3824__auto____66848 = G__66846__66847.cljs$lang$protocol_mask$partition0$ & 8388608;
      if(or__3824__auto____66848) {
        return or__3824__auto____66848
      }else {
        return G__66846__66847.cljs$core$ISeqable$
      }
    }()) {
      return true
    }else {
      if(!G__66846__66847.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeqable, G__66846__66847)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ISeqable, G__66846__66847)
  }
};
cljs.core.boolean$ = function boolean$(x) {
  if(cljs.core.truth_(x)) {
    return true
  }else {
    return false
  }
};
cljs.core.string_QMARK_ = function string_QMARK_(x) {
  var and__3822__auto____66851 = goog.isString(x);
  if(and__3822__auto____66851) {
    return!function() {
      var or__3824__auto____66852 = x.charAt(0) === "\ufdd0";
      if(or__3824__auto____66852) {
        return or__3824__auto____66852
      }else {
        return x.charAt(0) === "\ufdd1"
      }
    }()
  }else {
    return and__3822__auto____66851
  }
};
cljs.core.keyword_QMARK_ = function keyword_QMARK_(x) {
  var and__3822__auto____66854 = goog.isString(x);
  if(and__3822__auto____66854) {
    return x.charAt(0) === "\ufdd0"
  }else {
    return and__3822__auto____66854
  }
};
cljs.core.symbol_QMARK_ = function symbol_QMARK_(x) {
  var and__3822__auto____66856 = goog.isString(x);
  if(and__3822__auto____66856) {
    return x.charAt(0) === "\ufdd1"
  }else {
    return and__3822__auto____66856
  }
};
cljs.core.number_QMARK_ = function number_QMARK_(n) {
  return goog.isNumber(n)
};
cljs.core.fn_QMARK_ = function fn_QMARK_(f) {
  return goog.isFunction(f)
};
cljs.core.ifn_QMARK_ = function ifn_QMARK_(f) {
  var or__3824__auto____66861 = cljs.core.fn_QMARK_.call(null, f);
  if(or__3824__auto____66861) {
    return or__3824__auto____66861
  }else {
    var G__66862__66863 = f;
    if(G__66862__66863) {
      if(function() {
        var or__3824__auto____66864 = G__66862__66863.cljs$lang$protocol_mask$partition0$ & 1;
        if(or__3824__auto____66864) {
          return or__3824__auto____66864
        }else {
          return G__66862__66863.cljs$core$IFn$
        }
      }()) {
        return true
      }else {
        if(!G__66862__66863.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IFn, G__66862__66863)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IFn, G__66862__66863)
    }
  }
};
cljs.core.integer_QMARK_ = function integer_QMARK_(n) {
  var and__3822__auto____66866 = cljs.core.number_QMARK_.call(null, n);
  if(and__3822__auto____66866) {
    return n == n.toFixed()
  }else {
    return and__3822__auto____66866
  }
};
cljs.core.contains_QMARK_ = function contains_QMARK_(coll, v) {
  if(cljs.core._lookup.call(null, coll, v, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
    return false
  }else {
    return true
  }
};
cljs.core.find = function find(coll, k) {
  if(cljs.core.truth_(function() {
    var and__3822__auto____66869 = coll;
    if(cljs.core.truth_(and__3822__auto____66869)) {
      var and__3822__auto____66870 = cljs.core.associative_QMARK_.call(null, coll);
      if(and__3822__auto____66870) {
        return cljs.core.contains_QMARK_.call(null, coll, k)
      }else {
        return and__3822__auto____66870
      }
    }else {
      return and__3822__auto____66869
    }
  }())) {
    return cljs.core.PersistentVector.fromArray([k, cljs.core._lookup.call(null, coll, k)], true)
  }else {
    return null
  }
};
cljs.core.distinct_QMARK_ = function() {
  var distinct_QMARK_ = null;
  var distinct_QMARK___1 = function(x) {
    return true
  };
  var distinct_QMARK___2 = function(x, y) {
    return!cljs.core._EQ_.call(null, x, y)
  };
  var distinct_QMARK___3 = function() {
    var G__66879__delegate = function(x, y, more) {
      if(!cljs.core._EQ_.call(null, x, y)) {
        var s__66875 = cljs.core.PersistentHashSet.fromArray([y, x]);
        var xs__66876 = more;
        while(true) {
          var x__66877 = cljs.core.first.call(null, xs__66876);
          var etc__66878 = cljs.core.next.call(null, xs__66876);
          if(cljs.core.truth_(xs__66876)) {
            if(cljs.core.contains_QMARK_.call(null, s__66875, x__66877)) {
              return false
            }else {
              var G__66880 = cljs.core.conj.call(null, s__66875, x__66877);
              var G__66881 = etc__66878;
              s__66875 = G__66880;
              xs__66876 = G__66881;
              continue
            }
          }else {
            return true
          }
          break
        }
      }else {
        return false
      }
    };
    var G__66879 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__66879__delegate.call(this, x, y, more)
    };
    G__66879.cljs$lang$maxFixedArity = 2;
    G__66879.cljs$lang$applyTo = function(arglist__66882) {
      var x = cljs.core.first(arglist__66882);
      var y = cljs.core.first(cljs.core.next(arglist__66882));
      var more = cljs.core.rest(cljs.core.next(arglist__66882));
      return G__66879__delegate(x, y, more)
    };
    G__66879.cljs$lang$arity$variadic = G__66879__delegate;
    return G__66879
  }();
  distinct_QMARK_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return distinct_QMARK___1.call(this, x);
      case 2:
        return distinct_QMARK___2.call(this, x, y);
      default:
        return distinct_QMARK___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  distinct_QMARK_.cljs$lang$maxFixedArity = 2;
  distinct_QMARK_.cljs$lang$applyTo = distinct_QMARK___3.cljs$lang$applyTo;
  distinct_QMARK_.cljs$lang$arity$1 = distinct_QMARK___1;
  distinct_QMARK_.cljs$lang$arity$2 = distinct_QMARK___2;
  distinct_QMARK_.cljs$lang$arity$variadic = distinct_QMARK___3.cljs$lang$arity$variadic;
  return distinct_QMARK_
}();
cljs.core.compare = function compare(x, y) {
  if(x === y) {
    return 0
  }else {
    if(x == null) {
      return-1
    }else {
      if(y == null) {
        return 1
      }else {
        if(cljs.core.type.call(null, x) === cljs.core.type.call(null, y)) {
          if(function() {
            var G__66886__66887 = x;
            if(G__66886__66887) {
              if(cljs.core.truth_(function() {
                var or__3824__auto____66888 = null;
                if(cljs.core.truth_(or__3824__auto____66888)) {
                  return or__3824__auto____66888
                }else {
                  return G__66886__66887.cljs$core$IComparable$
                }
              }())) {
                return true
              }else {
                if(!G__66886__66887.cljs$lang$protocol_mask$partition$) {
                  return cljs.core.type_satisfies_.call(null, cljs.core.IComparable, G__66886__66887)
                }else {
                  return false
                }
              }
            }else {
              return cljs.core.type_satisfies_.call(null, cljs.core.IComparable, G__66886__66887)
            }
          }()) {
            return cljs.core._compare.call(null, x, y)
          }else {
            return goog.array.defaultCompare(x, y)
          }
        }else {
          if("\ufdd0'else") {
            throw new Error("compare on non-nil objects of different types");
          }else {
            return null
          }
        }
      }
    }
  }
};
cljs.core.compare_indexed = function() {
  var compare_indexed = null;
  var compare_indexed__2 = function(xs, ys) {
    var xl__66893 = cljs.core.count.call(null, xs);
    var yl__66894 = cljs.core.count.call(null, ys);
    if(xl__66893 < yl__66894) {
      return-1
    }else {
      if(xl__66893 > yl__66894) {
        return 1
      }else {
        if("\ufdd0'else") {
          return compare_indexed.call(null, xs, ys, xl__66893, 0)
        }else {
          return null
        }
      }
    }
  };
  var compare_indexed__4 = function(xs, ys, len, n) {
    while(true) {
      var d__66895 = cljs.core.compare.call(null, cljs.core.nth.call(null, xs, n), cljs.core.nth.call(null, ys, n));
      if(function() {
        var and__3822__auto____66896 = d__66895 === 0;
        if(and__3822__auto____66896) {
          return n + 1 < len
        }else {
          return and__3822__auto____66896
        }
      }()) {
        var G__66897 = xs;
        var G__66898 = ys;
        var G__66899 = len;
        var G__66900 = n + 1;
        xs = G__66897;
        ys = G__66898;
        len = G__66899;
        n = G__66900;
        continue
      }else {
        return d__66895
      }
      break
    }
  };
  compare_indexed = function(xs, ys, len, n) {
    switch(arguments.length) {
      case 2:
        return compare_indexed__2.call(this, xs, ys);
      case 4:
        return compare_indexed__4.call(this, xs, ys, len, n)
    }
    throw"Invalid arity: " + arguments.length;
  };
  compare_indexed.cljs$lang$arity$2 = compare_indexed__2;
  compare_indexed.cljs$lang$arity$4 = compare_indexed__4;
  return compare_indexed
}();
cljs.core.fn__GT_comparator = function fn__GT_comparator(f) {
  if(cljs.core._EQ_.call(null, f, cljs.core.compare)) {
    return cljs.core.compare
  }else {
    return function(x, y) {
      var r__66902 = f.call(null, x, y);
      if(cljs.core.number_QMARK_.call(null, r__66902)) {
        return r__66902
      }else {
        if(cljs.core.truth_(r__66902)) {
          return-1
        }else {
          if(cljs.core.truth_(f.call(null, y, x))) {
            return 1
          }else {
            return 0
          }
        }
      }
    }
  }
};
cljs.core.sort = function() {
  var sort = null;
  var sort__1 = function(coll) {
    return sort.call(null, cljs.core.compare, coll)
  };
  var sort__2 = function(comp, coll) {
    if(cljs.core.seq.call(null, coll)) {
      var a__66904 = cljs.core.to_array.call(null, coll);
      goog.array.stableSort(a__66904, cljs.core.fn__GT_comparator.call(null, comp));
      return cljs.core.seq.call(null, a__66904)
    }else {
      return cljs.core.List.EMPTY
    }
  };
  sort = function(comp, coll) {
    switch(arguments.length) {
      case 1:
        return sort__1.call(this, comp);
      case 2:
        return sort__2.call(this, comp, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  sort.cljs$lang$arity$1 = sort__1;
  sort.cljs$lang$arity$2 = sort__2;
  return sort
}();
cljs.core.sort_by = function() {
  var sort_by = null;
  var sort_by__2 = function(keyfn, coll) {
    return sort_by.call(null, keyfn, cljs.core.compare, coll)
  };
  var sort_by__3 = function(keyfn, comp, coll) {
    return cljs.core.sort.call(null, function(x, y) {
      return cljs.core.fn__GT_comparator.call(null, comp).call(null, keyfn.call(null, x), keyfn.call(null, y))
    }, coll)
  };
  sort_by = function(keyfn, comp, coll) {
    switch(arguments.length) {
      case 2:
        return sort_by__2.call(this, keyfn, comp);
      case 3:
        return sort_by__3.call(this, keyfn, comp, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  sort_by.cljs$lang$arity$2 = sort_by__2;
  sort_by.cljs$lang$arity$3 = sort_by__3;
  return sort_by
}();
cljs.core.seq_reduce = function() {
  var seq_reduce = null;
  var seq_reduce__2 = function(f, coll) {
    var temp__3971__auto____66910 = cljs.core.seq.call(null, coll);
    if(temp__3971__auto____66910) {
      var s__66911 = temp__3971__auto____66910;
      return cljs.core.reduce.call(null, f, cljs.core.first.call(null, s__66911), cljs.core.next.call(null, s__66911))
    }else {
      return f.call(null)
    }
  };
  var seq_reduce__3 = function(f, val, coll) {
    var val__66912 = val;
    var coll__66913 = cljs.core.seq.call(null, coll);
    while(true) {
      if(coll__66913) {
        var nval__66914 = f.call(null, val__66912, cljs.core.first.call(null, coll__66913));
        if(cljs.core.reduced_QMARK_.call(null, nval__66914)) {
          return cljs.core.deref.call(null, nval__66914)
        }else {
          var G__66915 = nval__66914;
          var G__66916 = cljs.core.next.call(null, coll__66913);
          val__66912 = G__66915;
          coll__66913 = G__66916;
          continue
        }
      }else {
        return val__66912
      }
      break
    }
  };
  seq_reduce = function(f, val, coll) {
    switch(arguments.length) {
      case 2:
        return seq_reduce__2.call(this, f, val);
      case 3:
        return seq_reduce__3.call(this, f, val, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  seq_reduce.cljs$lang$arity$2 = seq_reduce__2;
  seq_reduce.cljs$lang$arity$3 = seq_reduce__3;
  return seq_reduce
}();
cljs.core.shuffle = function shuffle(coll) {
  var a__66918 = cljs.core.to_array.call(null, coll);
  goog.array.shuffle(a__66918);
  return cljs.core.vec.call(null, a__66918)
};
cljs.core.reduce = function() {
  var reduce = null;
  var reduce__2 = function(f, coll) {
    if(function() {
      var G__66925__66926 = coll;
      if(G__66925__66926) {
        if(function() {
          var or__3824__auto____66927 = G__66925__66926.cljs$lang$protocol_mask$partition0$ & 524288;
          if(or__3824__auto____66927) {
            return or__3824__auto____66927
          }else {
            return G__66925__66926.cljs$core$IReduce$
          }
        }()) {
          return true
        }else {
          if(!G__66925__66926.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__66925__66926)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__66925__66926)
      }
    }()) {
      return cljs.core._reduce.call(null, coll, f)
    }else {
      return cljs.core.seq_reduce.call(null, f, coll)
    }
  };
  var reduce__3 = function(f, val, coll) {
    if(function() {
      var G__66928__66929 = coll;
      if(G__66928__66929) {
        if(function() {
          var or__3824__auto____66930 = G__66928__66929.cljs$lang$protocol_mask$partition0$ & 524288;
          if(or__3824__auto____66930) {
            return or__3824__auto____66930
          }else {
            return G__66928__66929.cljs$core$IReduce$
          }
        }()) {
          return true
        }else {
          if(!G__66928__66929.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__66928__66929)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__66928__66929)
      }
    }()) {
      return cljs.core._reduce.call(null, coll, f, val)
    }else {
      return cljs.core.seq_reduce.call(null, f, val, coll)
    }
  };
  reduce = function(f, val, coll) {
    switch(arguments.length) {
      case 2:
        return reduce__2.call(this, f, val);
      case 3:
        return reduce__3.call(this, f, val, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  reduce.cljs$lang$arity$2 = reduce__2;
  reduce.cljs$lang$arity$3 = reduce__3;
  return reduce
}();
cljs.core.reduce_kv = function reduce_kv(f, init, coll) {
  return cljs.core._kv_reduce.call(null, coll, f, init)
};
cljs.core.Reduced = function(val) {
  this.val = val;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32768
};
cljs.core.Reduced.cljs$lang$type = true;
cljs.core.Reduced.cljs$lang$ctorPrSeq = function(this__2343__auto__) {
  return cljs.core.list.call(null, "cljs.core/Reduced")
};
cljs.core.Reduced.prototype.cljs$core$IDeref$_deref$arity$1 = function(o) {
  var this__66931 = this;
  return this__66931.val
};
cljs.core.Reduced;
cljs.core.reduced_QMARK_ = function reduced_QMARK_(r) {
  return cljs.core.instance_QMARK_.call(null, cljs.core.Reduced, r)
};
cljs.core.reduced = function reduced(x) {
  return new cljs.core.Reduced(x)
};
cljs.core._PLUS_ = function() {
  var _PLUS_ = null;
  var _PLUS___0 = function() {
    return 0
  };
  var _PLUS___1 = function(x) {
    return x
  };
  var _PLUS___2 = function(x, y) {
    return x + y
  };
  var _PLUS___3 = function() {
    var G__66932__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _PLUS_, x + y, more)
    };
    var G__66932 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__66932__delegate.call(this, x, y, more)
    };
    G__66932.cljs$lang$maxFixedArity = 2;
    G__66932.cljs$lang$applyTo = function(arglist__66933) {
      var x = cljs.core.first(arglist__66933);
      var y = cljs.core.first(cljs.core.next(arglist__66933));
      var more = cljs.core.rest(cljs.core.next(arglist__66933));
      return G__66932__delegate(x, y, more)
    };
    G__66932.cljs$lang$arity$variadic = G__66932__delegate;
    return G__66932
  }();
  _PLUS_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 0:
        return _PLUS___0.call(this);
      case 1:
        return _PLUS___1.call(this, x);
      case 2:
        return _PLUS___2.call(this, x, y);
      default:
        return _PLUS___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _PLUS_.cljs$lang$maxFixedArity = 2;
  _PLUS_.cljs$lang$applyTo = _PLUS___3.cljs$lang$applyTo;
  _PLUS_.cljs$lang$arity$0 = _PLUS___0;
  _PLUS_.cljs$lang$arity$1 = _PLUS___1;
  _PLUS_.cljs$lang$arity$2 = _PLUS___2;
  _PLUS_.cljs$lang$arity$variadic = _PLUS___3.cljs$lang$arity$variadic;
  return _PLUS_
}();
cljs.core._ = function() {
  var _ = null;
  var ___1 = function(x) {
    return-x
  };
  var ___2 = function(x, y) {
    return x - y
  };
  var ___3 = function() {
    var G__66934__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _, x - y, more)
    };
    var G__66934 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__66934__delegate.call(this, x, y, more)
    };
    G__66934.cljs$lang$maxFixedArity = 2;
    G__66934.cljs$lang$applyTo = function(arglist__66935) {
      var x = cljs.core.first(arglist__66935);
      var y = cljs.core.first(cljs.core.next(arglist__66935));
      var more = cljs.core.rest(cljs.core.next(arglist__66935));
      return G__66934__delegate(x, y, more)
    };
    G__66934.cljs$lang$arity$variadic = G__66934__delegate;
    return G__66934
  }();
  _ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return ___1.call(this, x);
      case 2:
        return ___2.call(this, x, y);
      default:
        return ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _.cljs$lang$maxFixedArity = 2;
  _.cljs$lang$applyTo = ___3.cljs$lang$applyTo;
  _.cljs$lang$arity$1 = ___1;
  _.cljs$lang$arity$2 = ___2;
  _.cljs$lang$arity$variadic = ___3.cljs$lang$arity$variadic;
  return _
}();
cljs.core._STAR_ = function() {
  var _STAR_ = null;
  var _STAR___0 = function() {
    return 1
  };
  var _STAR___1 = function(x) {
    return x
  };
  var _STAR___2 = function(x, y) {
    return x * y
  };
  var _STAR___3 = function() {
    var G__66936__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _STAR_, x * y, more)
    };
    var G__66936 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__66936__delegate.call(this, x, y, more)
    };
    G__66936.cljs$lang$maxFixedArity = 2;
    G__66936.cljs$lang$applyTo = function(arglist__66937) {
      var x = cljs.core.first(arglist__66937);
      var y = cljs.core.first(cljs.core.next(arglist__66937));
      var more = cljs.core.rest(cljs.core.next(arglist__66937));
      return G__66936__delegate(x, y, more)
    };
    G__66936.cljs$lang$arity$variadic = G__66936__delegate;
    return G__66936
  }();
  _STAR_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 0:
        return _STAR___0.call(this);
      case 1:
        return _STAR___1.call(this, x);
      case 2:
        return _STAR___2.call(this, x, y);
      default:
        return _STAR___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _STAR_.cljs$lang$maxFixedArity = 2;
  _STAR_.cljs$lang$applyTo = _STAR___3.cljs$lang$applyTo;
  _STAR_.cljs$lang$arity$0 = _STAR___0;
  _STAR_.cljs$lang$arity$1 = _STAR___1;
  _STAR_.cljs$lang$arity$2 = _STAR___2;
  _STAR_.cljs$lang$arity$variadic = _STAR___3.cljs$lang$arity$variadic;
  return _STAR_
}();
cljs.core._SLASH_ = function() {
  var _SLASH_ = null;
  var _SLASH___1 = function(x) {
    return _SLASH_.call(null, 1, x)
  };
  var _SLASH___2 = function(x, y) {
    return x / y
  };
  var _SLASH___3 = function() {
    var G__66938__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _SLASH_, _SLASH_.call(null, x, y), more)
    };
    var G__66938 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__66938__delegate.call(this, x, y, more)
    };
    G__66938.cljs$lang$maxFixedArity = 2;
    G__66938.cljs$lang$applyTo = function(arglist__66939) {
      var x = cljs.core.first(arglist__66939);
      var y = cljs.core.first(cljs.core.next(arglist__66939));
      var more = cljs.core.rest(cljs.core.next(arglist__66939));
      return G__66938__delegate(x, y, more)
    };
    G__66938.cljs$lang$arity$variadic = G__66938__delegate;
    return G__66938
  }();
  _SLASH_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _SLASH___1.call(this, x);
      case 2:
        return _SLASH___2.call(this, x, y);
      default:
        return _SLASH___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _SLASH_.cljs$lang$maxFixedArity = 2;
  _SLASH_.cljs$lang$applyTo = _SLASH___3.cljs$lang$applyTo;
  _SLASH_.cljs$lang$arity$1 = _SLASH___1;
  _SLASH_.cljs$lang$arity$2 = _SLASH___2;
  _SLASH_.cljs$lang$arity$variadic = _SLASH___3.cljs$lang$arity$variadic;
  return _SLASH_
}();
cljs.core._LT_ = function() {
  var _LT_ = null;
  var _LT___1 = function(x) {
    return true
  };
  var _LT___2 = function(x, y) {
    return x < y
  };
  var _LT___3 = function() {
    var G__66940__delegate = function(x, y, more) {
      while(true) {
        if(x < y) {
          if(cljs.core.next.call(null, more)) {
            var G__66941 = y;
            var G__66942 = cljs.core.first.call(null, more);
            var G__66943 = cljs.core.next.call(null, more);
            x = G__66941;
            y = G__66942;
            more = G__66943;
            continue
          }else {
            return y < cljs.core.first.call(null, more)
          }
        }else {
          return false
        }
        break
      }
    };
    var G__66940 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__66940__delegate.call(this, x, y, more)
    };
    G__66940.cljs$lang$maxFixedArity = 2;
    G__66940.cljs$lang$applyTo = function(arglist__66944) {
      var x = cljs.core.first(arglist__66944);
      var y = cljs.core.first(cljs.core.next(arglist__66944));
      var more = cljs.core.rest(cljs.core.next(arglist__66944));
      return G__66940__delegate(x, y, more)
    };
    G__66940.cljs$lang$arity$variadic = G__66940__delegate;
    return G__66940
  }();
  _LT_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _LT___1.call(this, x);
      case 2:
        return _LT___2.call(this, x, y);
      default:
        return _LT___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _LT_.cljs$lang$maxFixedArity = 2;
  _LT_.cljs$lang$applyTo = _LT___3.cljs$lang$applyTo;
  _LT_.cljs$lang$arity$1 = _LT___1;
  _LT_.cljs$lang$arity$2 = _LT___2;
  _LT_.cljs$lang$arity$variadic = _LT___3.cljs$lang$arity$variadic;
  return _LT_
}();
cljs.core._LT__EQ_ = function() {
  var _LT__EQ_ = null;
  var _LT__EQ___1 = function(x) {
    return true
  };
  var _LT__EQ___2 = function(x, y) {
    return x <= y
  };
  var _LT__EQ___3 = function() {
    var G__66945__delegate = function(x, y, more) {
      while(true) {
        if(x <= y) {
          if(cljs.core.next.call(null, more)) {
            var G__66946 = y;
            var G__66947 = cljs.core.first.call(null, more);
            var G__66948 = cljs.core.next.call(null, more);
            x = G__66946;
            y = G__66947;
            more = G__66948;
            continue
          }else {
            return y <= cljs.core.first.call(null, more)
          }
        }else {
          return false
        }
        break
      }
    };
    var G__66945 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__66945__delegate.call(this, x, y, more)
    };
    G__66945.cljs$lang$maxFixedArity = 2;
    G__66945.cljs$lang$applyTo = function(arglist__66949) {
      var x = cljs.core.first(arglist__66949);
      var y = cljs.core.first(cljs.core.next(arglist__66949));
      var more = cljs.core.rest(cljs.core.next(arglist__66949));
      return G__66945__delegate(x, y, more)
    };
    G__66945.cljs$lang$arity$variadic = G__66945__delegate;
    return G__66945
  }();
  _LT__EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _LT__EQ___1.call(this, x);
      case 2:
        return _LT__EQ___2.call(this, x, y);
      default:
        return _LT__EQ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _LT__EQ_.cljs$lang$maxFixedArity = 2;
  _LT__EQ_.cljs$lang$applyTo = _LT__EQ___3.cljs$lang$applyTo;
  _LT__EQ_.cljs$lang$arity$1 = _LT__EQ___1;
  _LT__EQ_.cljs$lang$arity$2 = _LT__EQ___2;
  _LT__EQ_.cljs$lang$arity$variadic = _LT__EQ___3.cljs$lang$arity$variadic;
  return _LT__EQ_
}();
cljs.core._GT_ = function() {
  var _GT_ = null;
  var _GT___1 = function(x) {
    return true
  };
  var _GT___2 = function(x, y) {
    return x > y
  };
  var _GT___3 = function() {
    var G__66950__delegate = function(x, y, more) {
      while(true) {
        if(x > y) {
          if(cljs.core.next.call(null, more)) {
            var G__66951 = y;
            var G__66952 = cljs.core.first.call(null, more);
            var G__66953 = cljs.core.next.call(null, more);
            x = G__66951;
            y = G__66952;
            more = G__66953;
            continue
          }else {
            return y > cljs.core.first.call(null, more)
          }
        }else {
          return false
        }
        break
      }
    };
    var G__66950 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__66950__delegate.call(this, x, y, more)
    };
    G__66950.cljs$lang$maxFixedArity = 2;
    G__66950.cljs$lang$applyTo = function(arglist__66954) {
      var x = cljs.core.first(arglist__66954);
      var y = cljs.core.first(cljs.core.next(arglist__66954));
      var more = cljs.core.rest(cljs.core.next(arglist__66954));
      return G__66950__delegate(x, y, more)
    };
    G__66950.cljs$lang$arity$variadic = G__66950__delegate;
    return G__66950
  }();
  _GT_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _GT___1.call(this, x);
      case 2:
        return _GT___2.call(this, x, y);
      default:
        return _GT___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _GT_.cljs$lang$maxFixedArity = 2;
  _GT_.cljs$lang$applyTo = _GT___3.cljs$lang$applyTo;
  _GT_.cljs$lang$arity$1 = _GT___1;
  _GT_.cljs$lang$arity$2 = _GT___2;
  _GT_.cljs$lang$arity$variadic = _GT___3.cljs$lang$arity$variadic;
  return _GT_
}();
cljs.core._GT__EQ_ = function() {
  var _GT__EQ_ = null;
  var _GT__EQ___1 = function(x) {
    return true
  };
  var _GT__EQ___2 = function(x, y) {
    return x >= y
  };
  var _GT__EQ___3 = function() {
    var G__66955__delegate = function(x, y, more) {
      while(true) {
        if(x >= y) {
          if(cljs.core.next.call(null, more)) {
            var G__66956 = y;
            var G__66957 = cljs.core.first.call(null, more);
            var G__66958 = cljs.core.next.call(null, more);
            x = G__66956;
            y = G__66957;
            more = G__66958;
            continue
          }else {
            return y >= cljs.core.first.call(null, more)
          }
        }else {
          return false
        }
        break
      }
    };
    var G__66955 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__66955__delegate.call(this, x, y, more)
    };
    G__66955.cljs$lang$maxFixedArity = 2;
    G__66955.cljs$lang$applyTo = function(arglist__66959) {
      var x = cljs.core.first(arglist__66959);
      var y = cljs.core.first(cljs.core.next(arglist__66959));
      var more = cljs.core.rest(cljs.core.next(arglist__66959));
      return G__66955__delegate(x, y, more)
    };
    G__66955.cljs$lang$arity$variadic = G__66955__delegate;
    return G__66955
  }();
  _GT__EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _GT__EQ___1.call(this, x);
      case 2:
        return _GT__EQ___2.call(this, x, y);
      default:
        return _GT__EQ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _GT__EQ_.cljs$lang$maxFixedArity = 2;
  _GT__EQ_.cljs$lang$applyTo = _GT__EQ___3.cljs$lang$applyTo;
  _GT__EQ_.cljs$lang$arity$1 = _GT__EQ___1;
  _GT__EQ_.cljs$lang$arity$2 = _GT__EQ___2;
  _GT__EQ_.cljs$lang$arity$variadic = _GT__EQ___3.cljs$lang$arity$variadic;
  return _GT__EQ_
}();
cljs.core.dec = function dec(x) {
  return x - 1
};
cljs.core.max = function() {
  var max = null;
  var max__1 = function(x) {
    return x
  };
  var max__2 = function(x, y) {
    return x > y ? x : y
  };
  var max__3 = function() {
    var G__66960__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, max, x > y ? x : y, more)
    };
    var G__66960 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__66960__delegate.call(this, x, y, more)
    };
    G__66960.cljs$lang$maxFixedArity = 2;
    G__66960.cljs$lang$applyTo = function(arglist__66961) {
      var x = cljs.core.first(arglist__66961);
      var y = cljs.core.first(cljs.core.next(arglist__66961));
      var more = cljs.core.rest(cljs.core.next(arglist__66961));
      return G__66960__delegate(x, y, more)
    };
    G__66960.cljs$lang$arity$variadic = G__66960__delegate;
    return G__66960
  }();
  max = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return max__1.call(this, x);
      case 2:
        return max__2.call(this, x, y);
      default:
        return max__3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  max.cljs$lang$maxFixedArity = 2;
  max.cljs$lang$applyTo = max__3.cljs$lang$applyTo;
  max.cljs$lang$arity$1 = max__1;
  max.cljs$lang$arity$2 = max__2;
  max.cljs$lang$arity$variadic = max__3.cljs$lang$arity$variadic;
  return max
}();
cljs.core.min = function() {
  var min = null;
  var min__1 = function(x) {
    return x
  };
  var min__2 = function(x, y) {
    return x < y ? x : y
  };
  var min__3 = function() {
    var G__66962__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, min, x < y ? x : y, more)
    };
    var G__66962 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__66962__delegate.call(this, x, y, more)
    };
    G__66962.cljs$lang$maxFixedArity = 2;
    G__66962.cljs$lang$applyTo = function(arglist__66963) {
      var x = cljs.core.first(arglist__66963);
      var y = cljs.core.first(cljs.core.next(arglist__66963));
      var more = cljs.core.rest(cljs.core.next(arglist__66963));
      return G__66962__delegate(x, y, more)
    };
    G__66962.cljs$lang$arity$variadic = G__66962__delegate;
    return G__66962
  }();
  min = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return min__1.call(this, x);
      case 2:
        return min__2.call(this, x, y);
      default:
        return min__3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  min.cljs$lang$maxFixedArity = 2;
  min.cljs$lang$applyTo = min__3.cljs$lang$applyTo;
  min.cljs$lang$arity$1 = min__1;
  min.cljs$lang$arity$2 = min__2;
  min.cljs$lang$arity$variadic = min__3.cljs$lang$arity$variadic;
  return min
}();
cljs.core.fix = function fix(q) {
  if(q >= 0) {
    return Math.floor.call(null, q)
  }else {
    return Math.ceil.call(null, q)
  }
};
cljs.core.int$ = function int$(x) {
  return cljs.core.fix.call(null, x)
};
cljs.core.long$ = function long$(x) {
  return cljs.core.fix.call(null, x)
};
cljs.core.mod = function mod(n, d) {
  return n % d
};
cljs.core.quot = function quot(n, d) {
  var rem__66965 = n % d;
  return cljs.core.fix.call(null, (n - rem__66965) / d)
};
cljs.core.rem = function rem(n, d) {
  var q__66967 = cljs.core.quot.call(null, n, d);
  return n - d * q__66967
};
cljs.core.rand = function() {
  var rand = null;
  var rand__0 = function() {
    return Math.random.call(null)
  };
  var rand__1 = function(n) {
    return n * rand.call(null)
  };
  rand = function(n) {
    switch(arguments.length) {
      case 0:
        return rand__0.call(this);
      case 1:
        return rand__1.call(this, n)
    }
    throw"Invalid arity: " + arguments.length;
  };
  rand.cljs$lang$arity$0 = rand__0;
  rand.cljs$lang$arity$1 = rand__1;
  return rand
}();
cljs.core.rand_int = function rand_int(n) {
  return cljs.core.fix.call(null, cljs.core.rand.call(null, n))
};
cljs.core.bit_xor = function bit_xor(x, y) {
  return x ^ y
};
cljs.core.bit_and = function bit_and(x, y) {
  return x & y
};
cljs.core.bit_or = function bit_or(x, y) {
  return x | y
};
cljs.core.bit_and_not = function bit_and_not(x, y) {
  return x & ~y
};
cljs.core.bit_clear = function bit_clear(x, n) {
  return x & ~(1 << n)
};
cljs.core.bit_flip = function bit_flip(x, n) {
  return x ^ 1 << n
};
cljs.core.bit_not = function bit_not(x) {
  return~x
};
cljs.core.bit_set = function bit_set(x, n) {
  return x | 1 << n
};
cljs.core.bit_test = function bit_test(x, n) {
  return(x & 1 << n) != 0
};
cljs.core.bit_shift_left = function bit_shift_left(x, n) {
  return x << n
};
cljs.core.bit_shift_right = function bit_shift_right(x, n) {
  return x >> n
};
cljs.core.bit_shift_right_zero_fill = function bit_shift_right_zero_fill(x, n) {
  return x >>> n
};
cljs.core.bit_count = function bit_count(v) {
  var v__66970 = v - (v >> 1 & 1431655765);
  var v__66971 = (v__66970 & 858993459) + (v__66970 >> 2 & 858993459);
  return(v__66971 + (v__66971 >> 4) & 252645135) * 16843009 >> 24
};
cljs.core._EQ__EQ_ = function() {
  var _EQ__EQ_ = null;
  var _EQ__EQ___1 = function(x) {
    return true
  };
  var _EQ__EQ___2 = function(x, y) {
    return cljs.core._equiv.call(null, x, y)
  };
  var _EQ__EQ___3 = function() {
    var G__66972__delegate = function(x, y, more) {
      while(true) {
        if(cljs.core.truth_(_EQ__EQ_.call(null, x, y))) {
          if(cljs.core.next.call(null, more)) {
            var G__66973 = y;
            var G__66974 = cljs.core.first.call(null, more);
            var G__66975 = cljs.core.next.call(null, more);
            x = G__66973;
            y = G__66974;
            more = G__66975;
            continue
          }else {
            return _EQ__EQ_.call(null, y, cljs.core.first.call(null, more))
          }
        }else {
          return false
        }
        break
      }
    };
    var G__66972 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__66972__delegate.call(this, x, y, more)
    };
    G__66972.cljs$lang$maxFixedArity = 2;
    G__66972.cljs$lang$applyTo = function(arglist__66976) {
      var x = cljs.core.first(arglist__66976);
      var y = cljs.core.first(cljs.core.next(arglist__66976));
      var more = cljs.core.rest(cljs.core.next(arglist__66976));
      return G__66972__delegate(x, y, more)
    };
    G__66972.cljs$lang$arity$variadic = G__66972__delegate;
    return G__66972
  }();
  _EQ__EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _EQ__EQ___1.call(this, x);
      case 2:
        return _EQ__EQ___2.call(this, x, y);
      default:
        return _EQ__EQ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _EQ__EQ_.cljs$lang$maxFixedArity = 2;
  _EQ__EQ_.cljs$lang$applyTo = _EQ__EQ___3.cljs$lang$applyTo;
  _EQ__EQ_.cljs$lang$arity$1 = _EQ__EQ___1;
  _EQ__EQ_.cljs$lang$arity$2 = _EQ__EQ___2;
  _EQ__EQ_.cljs$lang$arity$variadic = _EQ__EQ___3.cljs$lang$arity$variadic;
  return _EQ__EQ_
}();
cljs.core.pos_QMARK_ = function pos_QMARK_(n) {
  return n > 0
};
cljs.core.zero_QMARK_ = function zero_QMARK_(n) {
  return n === 0
};
cljs.core.neg_QMARK_ = function neg_QMARK_(x) {
  return x < 0
};
cljs.core.nthnext = function nthnext(coll, n) {
  var n__66980 = n;
  var xs__66981 = cljs.core.seq.call(null, coll);
  while(true) {
    if(cljs.core.truth_(function() {
      var and__3822__auto____66982 = xs__66981;
      if(and__3822__auto____66982) {
        return n__66980 > 0
      }else {
        return and__3822__auto____66982
      }
    }())) {
      var G__66983 = n__66980 - 1;
      var G__66984 = cljs.core.next.call(null, xs__66981);
      n__66980 = G__66983;
      xs__66981 = G__66984;
      continue
    }else {
      return xs__66981
    }
    break
  }
};
cljs.core.str_STAR_ = function() {
  var str_STAR_ = null;
  var str_STAR___0 = function() {
    return""
  };
  var str_STAR___1 = function(x) {
    if(x == null) {
      return""
    }else {
      if("\ufdd0'else") {
        return x.toString()
      }else {
        return null
      }
    }
  };
  var str_STAR___2 = function() {
    var G__66985__delegate = function(x, ys) {
      return function(sb, more) {
        while(true) {
          if(cljs.core.truth_(more)) {
            var G__66986 = sb.append(str_STAR_.call(null, cljs.core.first.call(null, more)));
            var G__66987 = cljs.core.next.call(null, more);
            sb = G__66986;
            more = G__66987;
            continue
          }else {
            return str_STAR_.call(null, sb)
          }
          break
        }
      }.call(null, new goog.string.StringBuffer(str_STAR_.call(null, x)), ys)
    };
    var G__66985 = function(x, var_args) {
      var ys = null;
      if(goog.isDef(var_args)) {
        ys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__66985__delegate.call(this, x, ys)
    };
    G__66985.cljs$lang$maxFixedArity = 1;
    G__66985.cljs$lang$applyTo = function(arglist__66988) {
      var x = cljs.core.first(arglist__66988);
      var ys = cljs.core.rest(arglist__66988);
      return G__66985__delegate(x, ys)
    };
    G__66985.cljs$lang$arity$variadic = G__66985__delegate;
    return G__66985
  }();
  str_STAR_ = function(x, var_args) {
    var ys = var_args;
    switch(arguments.length) {
      case 0:
        return str_STAR___0.call(this);
      case 1:
        return str_STAR___1.call(this, x);
      default:
        return str_STAR___2.cljs$lang$arity$variadic(x, cljs.core.array_seq(arguments, 1))
    }
    throw"Invalid arity: " + arguments.length;
  };
  str_STAR_.cljs$lang$maxFixedArity = 1;
  str_STAR_.cljs$lang$applyTo = str_STAR___2.cljs$lang$applyTo;
  str_STAR_.cljs$lang$arity$0 = str_STAR___0;
  str_STAR_.cljs$lang$arity$1 = str_STAR___1;
  str_STAR_.cljs$lang$arity$variadic = str_STAR___2.cljs$lang$arity$variadic;
  return str_STAR_
}();
cljs.core.str = function() {
  var str = null;
  var str__0 = function() {
    return""
  };
  var str__1 = function(x) {
    if(cljs.core.symbol_QMARK_.call(null, x)) {
      return x.substring(2, x.length)
    }else {
      if(cljs.core.keyword_QMARK_.call(null, x)) {
        return cljs.core.str_STAR_.call(null, ":", x.substring(2, x.length))
      }else {
        if(x == null) {
          return""
        }else {
          if("\ufdd0'else") {
            return x.toString()
          }else {
            return null
          }
        }
      }
    }
  };
  var str__2 = function() {
    var G__66989__delegate = function(x, ys) {
      return function(sb, more) {
        while(true) {
          if(cljs.core.truth_(more)) {
            var G__66990 = sb.append(str.call(null, cljs.core.first.call(null, more)));
            var G__66991 = cljs.core.next.call(null, more);
            sb = G__66990;
            more = G__66991;
            continue
          }else {
            return cljs.core.str_STAR_.call(null, sb)
          }
          break
        }
      }.call(null, new goog.string.StringBuffer(str.call(null, x)), ys)
    };
    var G__66989 = function(x, var_args) {
      var ys = null;
      if(goog.isDef(var_args)) {
        ys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__66989__delegate.call(this, x, ys)
    };
    G__66989.cljs$lang$maxFixedArity = 1;
    G__66989.cljs$lang$applyTo = function(arglist__66992) {
      var x = cljs.core.first(arglist__66992);
      var ys = cljs.core.rest(arglist__66992);
      return G__66989__delegate(x, ys)
    };
    G__66989.cljs$lang$arity$variadic = G__66989__delegate;
    return G__66989
  }();
  str = function(x, var_args) {
    var ys = var_args;
    switch(arguments.length) {
      case 0:
        return str__0.call(this);
      case 1:
        return str__1.call(this, x);
      default:
        return str__2.cljs$lang$arity$variadic(x, cljs.core.array_seq(arguments, 1))
    }
    throw"Invalid arity: " + arguments.length;
  };
  str.cljs$lang$maxFixedArity = 1;
  str.cljs$lang$applyTo = str__2.cljs$lang$applyTo;
  str.cljs$lang$arity$0 = str__0;
  str.cljs$lang$arity$1 = str__1;
  str.cljs$lang$arity$variadic = str__2.cljs$lang$arity$variadic;
  return str
}();
cljs.core.subs = function() {
  var subs = null;
  var subs__2 = function(s, start) {
    return s.substring(start)
  };
  var subs__3 = function(s, start, end) {
    return s.substring(start, end)
  };
  subs = function(s, start, end) {
    switch(arguments.length) {
      case 2:
        return subs__2.call(this, s, start);
      case 3:
        return subs__3.call(this, s, start, end)
    }
    throw"Invalid arity: " + arguments.length;
  };
  subs.cljs$lang$arity$2 = subs__2;
  subs.cljs$lang$arity$3 = subs__3;
  return subs
}();
cljs.core.format = function() {
  var format__delegate = function(fmt, args) {
    return cljs.core.apply.call(null, goog.string.format, fmt, args)
  };
  var format = function(fmt, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return format__delegate.call(this, fmt, args)
  };
  format.cljs$lang$maxFixedArity = 1;
  format.cljs$lang$applyTo = function(arglist__66993) {
    var fmt = cljs.core.first(arglist__66993);
    var args = cljs.core.rest(arglist__66993);
    return format__delegate(fmt, args)
  };
  format.cljs$lang$arity$variadic = format__delegate;
  return format
}();
cljs.core.symbol = function() {
  var symbol = null;
  var symbol__1 = function(name) {
    if(cljs.core.symbol_QMARK_.call(null, name)) {
      name
    }else {
      if(cljs.core.keyword_QMARK_.call(null, name)) {
        cljs.core.str_STAR_.call(null, "\ufdd1", "'", cljs.core.subs.call(null, name, 2))
      }else {
      }
    }
    return cljs.core.str_STAR_.call(null, "\ufdd1", "'", name)
  };
  var symbol__2 = function(ns, name) {
    return symbol.call(null, cljs.core.str_STAR_.call(null, ns, "/", name))
  };
  symbol = function(ns, name) {
    switch(arguments.length) {
      case 1:
        return symbol__1.call(this, ns);
      case 2:
        return symbol__2.call(this, ns, name)
    }
    throw"Invalid arity: " + arguments.length;
  };
  symbol.cljs$lang$arity$1 = symbol__1;
  symbol.cljs$lang$arity$2 = symbol__2;
  return symbol
}();
cljs.core.keyword = function() {
  var keyword = null;
  var keyword__1 = function(name) {
    if(cljs.core.keyword_QMARK_.call(null, name)) {
      return name
    }else {
      if(cljs.core.symbol_QMARK_.call(null, name)) {
        return cljs.core.str_STAR_.call(null, "\ufdd0", "'", cljs.core.subs.call(null, name, 2))
      }else {
        if("\ufdd0'else") {
          return cljs.core.str_STAR_.call(null, "\ufdd0", "'", name)
        }else {
          return null
        }
      }
    }
  };
  var keyword__2 = function(ns, name) {
    return keyword.call(null, cljs.core.str_STAR_.call(null, ns, "/", name))
  };
  keyword = function(ns, name) {
    switch(arguments.length) {
      case 1:
        return keyword__1.call(this, ns);
      case 2:
        return keyword__2.call(this, ns, name)
    }
    throw"Invalid arity: " + arguments.length;
  };
  keyword.cljs$lang$arity$1 = keyword__1;
  keyword.cljs$lang$arity$2 = keyword__2;
  return keyword
}();
cljs.core.equiv_sequential = function equiv_sequential(x, y) {
  return cljs.core.boolean$.call(null, cljs.core.sequential_QMARK_.call(null, y) ? function() {
    var xs__66996 = cljs.core.seq.call(null, x);
    var ys__66997 = cljs.core.seq.call(null, y);
    while(true) {
      if(xs__66996 == null) {
        return ys__66997 == null
      }else {
        if(ys__66997 == null) {
          return false
        }else {
          if(cljs.core._EQ_.call(null, cljs.core.first.call(null, xs__66996), cljs.core.first.call(null, ys__66997))) {
            var G__66998 = cljs.core.next.call(null, xs__66996);
            var G__66999 = cljs.core.next.call(null, ys__66997);
            xs__66996 = G__66998;
            ys__66997 = G__66999;
            continue
          }else {
            if("\ufdd0'else") {
              return false
            }else {
              return null
            }
          }
        }
      }
      break
    }
  }() : null)
};
cljs.core.hash_combine = function hash_combine(seed, hash) {
  return seed ^ hash + 2654435769 + (seed << 6) + (seed >> 2)
};
cljs.core.hash_coll = function hash_coll(coll) {
  return cljs.core.reduce.call(null, function(p1__67000_SHARP_, p2__67001_SHARP_) {
    return cljs.core.hash_combine.call(null, p1__67000_SHARP_, cljs.core.hash.call(null, p2__67001_SHARP_, false))
  }, cljs.core.hash.call(null, cljs.core.first.call(null, coll), false), cljs.core.next.call(null, coll))
};
cljs.core.hash_imap = function hash_imap(m) {
  var h__67005 = 0;
  var s__67006 = cljs.core.seq.call(null, m);
  while(true) {
    if(s__67006) {
      var e__67007 = cljs.core.first.call(null, s__67006);
      var G__67008 = (h__67005 + (cljs.core.hash.call(null, cljs.core.key.call(null, e__67007)) ^ cljs.core.hash.call(null, cljs.core.val.call(null, e__67007)))) % 4503599627370496;
      var G__67009 = cljs.core.next.call(null, s__67006);
      h__67005 = G__67008;
      s__67006 = G__67009;
      continue
    }else {
      return h__67005
    }
    break
  }
};
cljs.core.hash_iset = function hash_iset(s) {
  var h__67013 = 0;
  var s__67014 = cljs.core.seq.call(null, s);
  while(true) {
    if(s__67014) {
      var e__67015 = cljs.core.first.call(null, s__67014);
      var G__67016 = (h__67013 + cljs.core.hash.call(null, e__67015)) % 4503599627370496;
      var G__67017 = cljs.core.next.call(null, s__67014);
      h__67013 = G__67016;
      s__67014 = G__67017;
      continue
    }else {
      return h__67013
    }
    break
  }
};
cljs.core.extend_object_BANG_ = function extend_object_BANG_(obj, fn_map) {
  var G__67038__67039 = cljs.core.seq.call(null, fn_map);
  if(G__67038__67039) {
    var G__67041__67043 = cljs.core.first.call(null, G__67038__67039);
    var vec__67042__67044 = G__67041__67043;
    var key_name__67045 = cljs.core.nth.call(null, vec__67042__67044, 0, null);
    var f__67046 = cljs.core.nth.call(null, vec__67042__67044, 1, null);
    var G__67038__67047 = G__67038__67039;
    var G__67041__67048 = G__67041__67043;
    var G__67038__67049 = G__67038__67047;
    while(true) {
      var vec__67050__67051 = G__67041__67048;
      var key_name__67052 = cljs.core.nth.call(null, vec__67050__67051, 0, null);
      var f__67053 = cljs.core.nth.call(null, vec__67050__67051, 1, null);
      var G__67038__67054 = G__67038__67049;
      var str_name__67055 = cljs.core.name.call(null, key_name__67052);
      obj[str_name__67055] = f__67053;
      var temp__3974__auto____67056 = cljs.core.next.call(null, G__67038__67054);
      if(temp__3974__auto____67056) {
        var G__67038__67057 = temp__3974__auto____67056;
        var G__67058 = cljs.core.first.call(null, G__67038__67057);
        var G__67059 = G__67038__67057;
        G__67041__67048 = G__67058;
        G__67038__67049 = G__67059;
        continue
      }else {
      }
      break
    }
  }else {
  }
  return obj
};
cljs.core.List = function(meta, first, rest, count, __hash) {
  this.meta = meta;
  this.first = first;
  this.rest = rest;
  this.count = count;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 65413358
};
cljs.core.List.cljs$lang$type = true;
cljs.core.List.cljs$lang$ctorPrSeq = function(this__2343__auto__) {
  return cljs.core.list.call(null, "cljs.core/List")
};
cljs.core.List.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__67060 = this;
  var h__2226__auto____67061 = this__67060.__hash;
  if(!(h__2226__auto____67061 == null)) {
    return h__2226__auto____67061
  }else {
    var h__2226__auto____67062 = cljs.core.hash_coll.call(null, coll);
    this__67060.__hash = h__2226__auto____67062;
    return h__2226__auto____67062
  }
};
cljs.core.List.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var this__67063 = this;
  if(this__67063.count === 1) {
    return null
  }else {
    return this__67063.rest
  }
};
cljs.core.List.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__67064 = this;
  return new cljs.core.List(this__67064.meta, o, coll, this__67064.count + 1, null)
};
cljs.core.List.prototype.toString = function() {
  var this__67065 = this;
  var this__67066 = this;
  return cljs.core.pr_str.call(null, this__67066)
};
cljs.core.List.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__67067 = this;
  return coll
};
cljs.core.List.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__67068 = this;
  return this__67068.count
};
cljs.core.List.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__67069 = this;
  return this__67069.first
};
cljs.core.List.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__67070 = this;
  return coll.cljs$core$ISeq$_rest$arity$1(coll)
};
cljs.core.List.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__67071 = this;
  return this__67071.first
};
cljs.core.List.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__67072 = this;
  if(this__67072.count === 1) {
    return cljs.core.List.EMPTY
  }else {
    return this__67072.rest
  }
};
cljs.core.List.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__67073 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.List.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__67074 = this;
  return new cljs.core.List(meta, this__67074.first, this__67074.rest, this__67074.count, this__67074.__hash)
};
cljs.core.List.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__67075 = this;
  return this__67075.meta
};
cljs.core.List.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__67076 = this;
  return cljs.core.List.EMPTY
};
cljs.core.List;
cljs.core.EmptyList = function(meta) {
  this.meta = meta;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 65413326
};
cljs.core.EmptyList.cljs$lang$type = true;
cljs.core.EmptyList.cljs$lang$ctorPrSeq = function(this__2343__auto__) {
  return cljs.core.list.call(null, "cljs.core/EmptyList")
};
cljs.core.EmptyList.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__67077 = this;
  return 0
};
cljs.core.EmptyList.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var this__67078 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__67079 = this;
  return new cljs.core.List(this__67079.meta, o, null, 1, null)
};
cljs.core.EmptyList.prototype.toString = function() {
  var this__67080 = this;
  var this__67081 = this;
  return cljs.core.pr_str.call(null, this__67081)
};
cljs.core.EmptyList.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__67082 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__67083 = this;
  return 0
};
cljs.core.EmptyList.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__67084 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__67085 = this;
  throw new Error("Can't pop empty list");
};
cljs.core.EmptyList.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__67086 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__67087 = this;
  return cljs.core.List.EMPTY
};
cljs.core.EmptyList.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__67088 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.EmptyList.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__67089 = this;
  return new cljs.core.EmptyList(meta)
};
cljs.core.EmptyList.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__67090 = this;
  return this__67090.meta
};
cljs.core.EmptyList.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__67091 = this;
  return coll
};
cljs.core.EmptyList;
cljs.core.List.EMPTY = new cljs.core.EmptyList(null);
cljs.core.reversible_QMARK_ = function reversible_QMARK_(coll) {
  var G__67095__67096 = coll;
  if(G__67095__67096) {
    if(function() {
      var or__3824__auto____67097 = G__67095__67096.cljs$lang$protocol_mask$partition0$ & 134217728;
      if(or__3824__auto____67097) {
        return or__3824__auto____67097
      }else {
        return G__67095__67096.cljs$core$IReversible$
      }
    }()) {
      return true
    }else {
      if(!G__67095__67096.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReversible, G__67095__67096)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IReversible, G__67095__67096)
  }
};
cljs.core.rseq = function rseq(coll) {
  return cljs.core._rseq.call(null, coll)
};
cljs.core.reverse = function reverse(coll) {
  if(cljs.core.reversible_QMARK_.call(null, coll)) {
    return cljs.core.rseq.call(null, coll)
  }else {
    return cljs.core.reduce.call(null, cljs.core.conj, cljs.core.List.EMPTY, coll)
  }
};
cljs.core.list = function() {
  var list = null;
  var list__0 = function() {
    return cljs.core.List.EMPTY
  };
  var list__1 = function(x) {
    return cljs.core.conj.call(null, cljs.core.List.EMPTY, x)
  };
  var list__2 = function(x, y) {
    return cljs.core.conj.call(null, list.call(null, y), x)
  };
  var list__3 = function(x, y, z) {
    return cljs.core.conj.call(null, list.call(null, y, z), x)
  };
  var list__4 = function() {
    var G__67098__delegate = function(x, y, z, items) {
      return cljs.core.conj.call(null, cljs.core.conj.call(null, cljs.core.conj.call(null, cljs.core.reduce.call(null, cljs.core.conj, cljs.core.List.EMPTY, cljs.core.reverse.call(null, items)), z), y), x)
    };
    var G__67098 = function(x, y, z, var_args) {
      var items = null;
      if(goog.isDef(var_args)) {
        items = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__67098__delegate.call(this, x, y, z, items)
    };
    G__67098.cljs$lang$maxFixedArity = 3;
    G__67098.cljs$lang$applyTo = function(arglist__67099) {
      var x = cljs.core.first(arglist__67099);
      var y = cljs.core.first(cljs.core.next(arglist__67099));
      var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__67099)));
      var items = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__67099)));
      return G__67098__delegate(x, y, z, items)
    };
    G__67098.cljs$lang$arity$variadic = G__67098__delegate;
    return G__67098
  }();
  list = function(x, y, z, var_args) {
    var items = var_args;
    switch(arguments.length) {
      case 0:
        return list__0.call(this);
      case 1:
        return list__1.call(this, x);
      case 2:
        return list__2.call(this, x, y);
      case 3:
        return list__3.call(this, x, y, z);
      default:
        return list__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  list.cljs$lang$maxFixedArity = 3;
  list.cljs$lang$applyTo = list__4.cljs$lang$applyTo;
  list.cljs$lang$arity$0 = list__0;
  list.cljs$lang$arity$1 = list__1;
  list.cljs$lang$arity$2 = list__2;
  list.cljs$lang$arity$3 = list__3;
  list.cljs$lang$arity$variadic = list__4.cljs$lang$arity$variadic;
  return list
}();
cljs.core.Cons = function(meta, first, rest, __hash) {
  this.meta = meta;
  this.first = first;
  this.rest = rest;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 65405164
};
cljs.core.Cons.cljs$lang$type = true;
cljs.core.Cons.cljs$lang$ctorPrSeq = function(this__2343__auto__) {
  return cljs.core.list.call(null, "cljs.core/Cons")
};
cljs.core.Cons.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__67100 = this;
  var h__2226__auto____67101 = this__67100.__hash;
  if(!(h__2226__auto____67101 == null)) {
    return h__2226__auto____67101
  }else {
    var h__2226__auto____67102 = cljs.core.hash_coll.call(null, coll);
    this__67100.__hash = h__2226__auto____67102;
    return h__2226__auto____67102
  }
};
cljs.core.Cons.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var this__67103 = this;
  if(this__67103.rest == null) {
    return null
  }else {
    return cljs.core._seq.call(null, this__67103.rest)
  }
};
cljs.core.Cons.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__67104 = this;
  return new cljs.core.Cons(null, o, coll, this__67104.__hash)
};
cljs.core.Cons.prototype.toString = function() {
  var this__67105 = this;
  var this__67106 = this;
  return cljs.core.pr_str.call(null, this__67106)
};
cljs.core.Cons.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__67107 = this;
  return coll
};
cljs.core.Cons.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__67108 = this;
  return this__67108.first
};
cljs.core.Cons.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__67109 = this;
  if(this__67109.rest == null) {
    return cljs.core.List.EMPTY
  }else {
    return this__67109.rest
  }
};
cljs.core.Cons.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__67110 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Cons.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__67111 = this;
  return new cljs.core.Cons(meta, this__67111.first, this__67111.rest, this__67111.__hash)
};
cljs.core.Cons.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__67112 = this;
  return this__67112.meta
};
cljs.core.Cons.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__67113 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__67113.meta)
};
cljs.core.Cons;
cljs.core.cons = function cons(x, coll) {
  if(function() {
    var or__3824__auto____67118 = coll == null;
    if(or__3824__auto____67118) {
      return or__3824__auto____67118
    }else {
      var G__67119__67120 = coll;
      if(G__67119__67120) {
        if(function() {
          var or__3824__auto____67121 = G__67119__67120.cljs$lang$protocol_mask$partition0$ & 64;
          if(or__3824__auto____67121) {
            return or__3824__auto____67121
          }else {
            return G__67119__67120.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          if(!G__67119__67120.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__67119__67120)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__67119__67120)
      }
    }
  }()) {
    return new cljs.core.Cons(null, x, coll, null)
  }else {
    return new cljs.core.Cons(null, x, cljs.core.seq.call(null, coll), null)
  }
};
cljs.core.list_QMARK_ = function list_QMARK_(x) {
  var G__67125__67126 = x;
  if(G__67125__67126) {
    if(function() {
      var or__3824__auto____67127 = G__67125__67126.cljs$lang$protocol_mask$partition0$ & 33554432;
      if(or__3824__auto____67127) {
        return or__3824__auto____67127
      }else {
        return G__67125__67126.cljs$core$IList$
      }
    }()) {
      return true
    }else {
      if(!G__67125__67126.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IList, G__67125__67126)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IList, G__67125__67126)
  }
};
cljs.core.IReduce["string"] = true;
cljs.core._reduce["string"] = function() {
  var G__67128 = null;
  var G__67128__2 = function(string, f) {
    return cljs.core.ci_reduce.call(null, string, f)
  };
  var G__67128__3 = function(string, f, start) {
    return cljs.core.ci_reduce.call(null, string, f, start)
  };
  G__67128 = function(string, f, start) {
    switch(arguments.length) {
      case 2:
        return G__67128__2.call(this, string, f);
      case 3:
        return G__67128__3.call(this, string, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__67128
}();
cljs.core.ILookup["string"] = true;
cljs.core._lookup["string"] = function() {
  var G__67129 = null;
  var G__67129__2 = function(string, k) {
    return cljs.core._nth.call(null, string, k)
  };
  var G__67129__3 = function(string, k, not_found) {
    return cljs.core._nth.call(null, string, k, not_found)
  };
  G__67129 = function(string, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__67129__2.call(this, string, k);
      case 3:
        return G__67129__3.call(this, string, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__67129
}();
cljs.core.IIndexed["string"] = true;
cljs.core._nth["string"] = function() {
  var G__67130 = null;
  var G__67130__2 = function(string, n) {
    if(n < cljs.core._count.call(null, string)) {
      return string.charAt(n)
    }else {
      return null
    }
  };
  var G__67130__3 = function(string, n, not_found) {
    if(n < cljs.core._count.call(null, string)) {
      return string.charAt(n)
    }else {
      return not_found
    }
  };
  G__67130 = function(string, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__67130__2.call(this, string, n);
      case 3:
        return G__67130__3.call(this, string, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__67130
}();
cljs.core.ICounted["string"] = true;
cljs.core._count["string"] = function(s) {
  return s.length
};
cljs.core.ISeqable["string"] = true;
cljs.core._seq["string"] = function(string) {
  return cljs.core.prim_seq.call(null, string, 0)
};
cljs.core.IHash["string"] = true;
cljs.core._hash["string"] = function(o) {
  return goog.string.hashCode(o)
};
cljs.core.Keyword = function(k) {
  this.k = k;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 1
};
cljs.core.Keyword.cljs$lang$type = true;
cljs.core.Keyword.cljs$lang$ctorPrSeq = function(this__2343__auto__) {
  return cljs.core.list.call(null, "cljs.core/Keyword")
};
cljs.core.Keyword.prototype.call = function() {
  var G__67142 = null;
  var G__67142__2 = function(this_sym67133, coll) {
    var this__67135 = this;
    var this_sym67133__67136 = this;
    var ___67137 = this_sym67133__67136;
    if(coll == null) {
      return null
    }else {
      var strobj__67138 = coll.strobj;
      if(strobj__67138 == null) {
        return cljs.core._lookup.call(null, coll, this__67135.k, null)
      }else {
        return strobj__67138[this__67135.k]
      }
    }
  };
  var G__67142__3 = function(this_sym67134, coll, not_found) {
    var this__67135 = this;
    var this_sym67134__67139 = this;
    var ___67140 = this_sym67134__67139;
    if(coll == null) {
      return not_found
    }else {
      return cljs.core._lookup.call(null, coll, this__67135.k, not_found)
    }
  };
  G__67142 = function(this_sym67134, coll, not_found) {
    switch(arguments.length) {
      case 2:
        return G__67142__2.call(this, this_sym67134, coll);
      case 3:
        return G__67142__3.call(this, this_sym67134, coll, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__67142
}();
cljs.core.Keyword.prototype.apply = function(this_sym67131, args67132) {
  var this__67141 = this;
  return this_sym67131.call.apply(this_sym67131, [this_sym67131].concat(args67132.slice()))
};
cljs.core.Keyword;
String.prototype.cljs$core$IFn$ = true;
String.prototype.call = function() {
  var G__67151 = null;
  var G__67151__2 = function(this_sym67145, coll) {
    var this_sym67145__67147 = this;
    var this__67148 = this_sym67145__67147;
    return cljs.core._lookup.call(null, coll, this__67148.toString(), null)
  };
  var G__67151__3 = function(this_sym67146, coll, not_found) {
    var this_sym67146__67149 = this;
    var this__67150 = this_sym67146__67149;
    return cljs.core._lookup.call(null, coll, this__67150.toString(), not_found)
  };
  G__67151 = function(this_sym67146, coll, not_found) {
    switch(arguments.length) {
      case 2:
        return G__67151__2.call(this, this_sym67146, coll);
      case 3:
        return G__67151__3.call(this, this_sym67146, coll, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__67151
}();
String.prototype.apply = function(this_sym67143, args67144) {
  return this_sym67143.call.apply(this_sym67143, [this_sym67143].concat(args67144.slice()))
};
String.prototype.apply = function(s, args) {
  if(cljs.core.count.call(null, args) < 2) {
    return cljs.core._lookup.call(null, args[0], s, null)
  }else {
    return cljs.core._lookup.call(null, args[0], s, args[1])
  }
};
cljs.core.lazy_seq_value = function lazy_seq_value(lazy_seq) {
  var x__67153 = lazy_seq.x;
  if(lazy_seq.realized) {
    return x__67153
  }else {
    lazy_seq.x = x__67153.call(null);
    lazy_seq.realized = true;
    return lazy_seq.x
  }
};
cljs.core.LazySeq = function(meta, realized, x, __hash) {
  this.meta = meta;
  this.realized = realized;
  this.x = x;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31850700
};
cljs.core.LazySeq.cljs$lang$type = true;
cljs.core.LazySeq.cljs$lang$ctorPrSeq = function(this__2343__auto__) {
  return cljs.core.list.call(null, "cljs.core/LazySeq")
};
cljs.core.LazySeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__67154 = this;
  var h__2226__auto____67155 = this__67154.__hash;
  if(!(h__2226__auto____67155 == null)) {
    return h__2226__auto____67155
  }else {
    var h__2226__auto____67156 = cljs.core.hash_coll.call(null, coll);
    this__67154.__hash = h__2226__auto____67156;
    return h__2226__auto____67156
  }
};
cljs.core.LazySeq.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var this__67157 = this;
  return cljs.core._seq.call(null, coll.cljs$core$ISeq$_rest$arity$1(coll))
};
cljs.core.LazySeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__67158 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.LazySeq.prototype.toString = function() {
  var this__67159 = this;
  var this__67160 = this;
  return cljs.core.pr_str.call(null, this__67160)
};
cljs.core.LazySeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__67161 = this;
  return cljs.core.seq.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__67162 = this;
  return cljs.core.first.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__67163 = this;
  return cljs.core.rest.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__67164 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.LazySeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__67165 = this;
  return new cljs.core.LazySeq(meta, this__67165.realized, this__67165.x, this__67165.__hash)
};
cljs.core.LazySeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__67166 = this;
  return this__67166.meta
};
cljs.core.LazySeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__67167 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__67167.meta)
};
cljs.core.LazySeq;
cljs.core.ChunkBuffer = function(buf, end) {
  this.buf = buf;
  this.end = end;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 2
};
cljs.core.ChunkBuffer.cljs$lang$type = true;
cljs.core.ChunkBuffer.cljs$lang$ctorPrSeq = function(this__2343__auto__) {
  return cljs.core.list.call(null, "cljs.core/ChunkBuffer")
};
cljs.core.ChunkBuffer.prototype.cljs$core$ICounted$_count$arity$1 = function(_) {
  var this__67168 = this;
  return this__67168.end
};
cljs.core.ChunkBuffer.prototype.add = function(o) {
  var this__67169 = this;
  var ___67170 = this;
  this__67169.buf[this__67169.end] = o;
  return this__67169.end = this__67169.end + 1
};
cljs.core.ChunkBuffer.prototype.chunk = function(o) {
  var this__67171 = this;
  var ___67172 = this;
  var ret__67173 = new cljs.core.ArrayChunk(this__67171.buf, 0, this__67171.end);
  this__67171.buf = null;
  return ret__67173
};
cljs.core.ChunkBuffer;
cljs.core.chunk_buffer = function chunk_buffer(capacity) {
  return new cljs.core.ChunkBuffer(cljs.core.make_array.call(null, capacity), 0)
};
cljs.core.ArrayChunk = function(arr, off, end) {
  this.arr = arr;
  this.off = off;
  this.end = end;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 524306
};
cljs.core.ArrayChunk.cljs$lang$type = true;
cljs.core.ArrayChunk.cljs$lang$ctorPrSeq = function(this__2343__auto__) {
  return cljs.core.list.call(null, "cljs.core/ArrayChunk")
};
cljs.core.ArrayChunk.prototype.cljs$core$IReduce$_reduce$arity$2 = function(coll, f) {
  var this__67174 = this;
  return cljs.core.ci_reduce.call(null, coll, f, this__67174.arr[this__67174.off], this__67174.off + 1)
};
cljs.core.ArrayChunk.prototype.cljs$core$IReduce$_reduce$arity$3 = function(coll, f, start) {
  var this__67175 = this;
  return cljs.core.ci_reduce.call(null, coll, f, start, this__67175.off)
};
cljs.core.ArrayChunk.prototype.cljs$core$IChunk$ = true;
cljs.core.ArrayChunk.prototype.cljs$core$IChunk$_drop_first$arity$1 = function(coll) {
  var this__67176 = this;
  if(this__67176.off === this__67176.end) {
    throw new Error("-drop-first of empty chunk");
  }else {
    return new cljs.core.ArrayChunk(this__67176.arr, this__67176.off + 1, this__67176.end)
  }
};
cljs.core.ArrayChunk.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, i) {
  var this__67177 = this;
  return this__67177.arr[this__67177.off + i]
};
cljs.core.ArrayChunk.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, i, not_found) {
  var this__67178 = this;
  if(function() {
    var and__3822__auto____67179 = i >= 0;
    if(and__3822__auto____67179) {
      return i < this__67178.end - this__67178.off
    }else {
      return and__3822__auto____67179
    }
  }()) {
    return this__67178.arr[this__67178.off + i]
  }else {
    return not_found
  }
};
cljs.core.ArrayChunk.prototype.cljs$core$ICounted$_count$arity$1 = function(_) {
  var this__67180 = this;
  return this__67180.end - this__67180.off
};
cljs.core.ArrayChunk;
cljs.core.array_chunk = function() {
  var array_chunk = null;
  var array_chunk__1 = function(arr) {
    return array_chunk.call(null, arr, 0, arr.length)
  };
  var array_chunk__2 = function(arr, off) {
    return array_chunk.call(null, arr, off, arr.length)
  };
  var array_chunk__3 = function(arr, off, end) {
    return new cljs.core.ArrayChunk(arr, off, end)
  };
  array_chunk = function(arr, off, end) {
    switch(arguments.length) {
      case 1:
        return array_chunk__1.call(this, arr);
      case 2:
        return array_chunk__2.call(this, arr, off);
      case 3:
        return array_chunk__3.call(this, arr, off, end)
    }
    throw"Invalid arity: " + arguments.length;
  };
  array_chunk.cljs$lang$arity$1 = array_chunk__1;
  array_chunk.cljs$lang$arity$2 = array_chunk__2;
  array_chunk.cljs$lang$arity$3 = array_chunk__3;
  return array_chunk
}();
cljs.core.ChunkedCons = function(chunk, more, meta) {
  this.chunk = chunk;
  this.more = more;
  this.meta = meta;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 27656296
};
cljs.core.ChunkedCons.cljs$lang$type = true;
cljs.core.ChunkedCons.cljs$lang$ctorPrSeq = function(this__2343__auto__) {
  return cljs.core.list.call(null, "cljs.core/ChunkedCons")
};
cljs.core.ChunkedCons.prototype.cljs$core$ICollection$_conj$arity$2 = function(this$, o) {
  var this__67181 = this;
  return cljs.core.cons.call(null, o, this$)
};
cljs.core.ChunkedCons.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__67182 = this;
  return coll
};
cljs.core.ChunkedCons.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__67183 = this;
  return cljs.core._nth.call(null, this__67183.chunk, 0)
};
cljs.core.ChunkedCons.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__67184 = this;
  if(cljs.core._count.call(null, this__67184.chunk) > 1) {
    return new cljs.core.ChunkedCons(cljs.core._drop_first.call(null, this__67184.chunk), this__67184.more, this__67184.meta)
  }else {
    if(this__67184.more == null) {
      return cljs.core.List.EMPTY
    }else {
      return this__67184.more
    }
  }
};
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedNext$ = true;
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedNext$_chunked_next$arity$1 = function(coll) {
  var this__67185 = this;
  if(this__67185.more == null) {
    return null
  }else {
    return this__67185.more
  }
};
cljs.core.ChunkedCons.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__67186 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.ChunkedCons.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, m) {
  var this__67187 = this;
  return new cljs.core.ChunkedCons(this__67187.chunk, this__67187.more, m)
};
cljs.core.ChunkedCons.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__67188 = this;
  return this__67188.meta
};
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedSeq$ = true;
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedSeq$_chunked_first$arity$1 = function(coll) {
  var this__67189 = this;
  return this__67189.chunk
};
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedSeq$_chunked_rest$arity$1 = function(coll) {
  var this__67190 = this;
  if(this__67190.more == null) {
    return cljs.core.List.EMPTY
  }else {
    return this__67190.more
  }
};
cljs.core.ChunkedCons;
cljs.core.chunk_cons = function chunk_cons(chunk, rest) {
  if(cljs.core._count.call(null, chunk) === 0) {
    return rest
  }else {
    return new cljs.core.ChunkedCons(chunk, rest, null)
  }
};
cljs.core.chunk_append = function chunk_append(b, x) {
  return b.add(x)
};
cljs.core.chunk = function chunk(b) {
  return b.chunk()
};
cljs.core.chunk_first = function chunk_first(s) {
  return cljs.core._chunked_first.call(null, s)
};
cljs.core.chunk_rest = function chunk_rest(s) {
  return cljs.core._chunked_rest.call(null, s)
};
cljs.core.chunk_next = function chunk_next(s) {
  if(function() {
    var G__67194__67195 = s;
    if(G__67194__67195) {
      if(cljs.core.truth_(function() {
        var or__3824__auto____67196 = null;
        if(cljs.core.truth_(or__3824__auto____67196)) {
          return or__3824__auto____67196
        }else {
          return G__67194__67195.cljs$core$IChunkedNext$
        }
      }())) {
        return true
      }else {
        if(!G__67194__67195.cljs$lang$protocol_mask$partition$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IChunkedNext, G__67194__67195)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IChunkedNext, G__67194__67195)
    }
  }()) {
    return cljs.core._chunked_next.call(null, s)
  }else {
    return cljs.core.seq.call(null, cljs.core._chunked_rest.call(null, s))
  }
};
cljs.core.to_array = function to_array(s) {
  var ary__67199 = [];
  var s__67200 = s;
  while(true) {
    if(cljs.core.seq.call(null, s__67200)) {
      ary__67199.push(cljs.core.first.call(null, s__67200));
      var G__67201 = cljs.core.next.call(null, s__67200);
      s__67200 = G__67201;
      continue
    }else {
      return ary__67199
    }
    break
  }
};
cljs.core.to_array_2d = function to_array_2d(coll) {
  var ret__67205 = cljs.core.make_array.call(null, cljs.core.count.call(null, coll));
  var i__67206 = 0;
  var xs__67207 = cljs.core.seq.call(null, coll);
  while(true) {
    if(xs__67207) {
      ret__67205[i__67206] = cljs.core.to_array.call(null, cljs.core.first.call(null, xs__67207));
      var G__67208 = i__67206 + 1;
      var G__67209 = cljs.core.next.call(null, xs__67207);
      i__67206 = G__67208;
      xs__67207 = G__67209;
      continue
    }else {
    }
    break
  }
  return ret__67205
};
cljs.core.long_array = function() {
  var long_array = null;
  var long_array__1 = function(size_or_seq) {
    if(cljs.core.number_QMARK_.call(null, size_or_seq)) {
      return long_array.call(null, size_or_seq, null)
    }else {
      if(cljs.core.seq_QMARK_.call(null, size_or_seq)) {
        return cljs.core.into_array.call(null, size_or_seq)
      }else {
        if("\ufdd0'else") {
          throw new Error("long-array called with something other than size or ISeq");
        }else {
          return null
        }
      }
    }
  };
  var long_array__2 = function(size, init_val_or_seq) {
    var a__67217 = cljs.core.make_array.call(null, size);
    if(cljs.core.seq_QMARK_.call(null, init_val_or_seq)) {
      var s__67218 = cljs.core.seq.call(null, init_val_or_seq);
      var i__67219 = 0;
      var s__67220 = s__67218;
      while(true) {
        if(cljs.core.truth_(function() {
          var and__3822__auto____67221 = s__67220;
          if(and__3822__auto____67221) {
            return i__67219 < size
          }else {
            return and__3822__auto____67221
          }
        }())) {
          a__67217[i__67219] = cljs.core.first.call(null, s__67220);
          var G__67224 = i__67219 + 1;
          var G__67225 = cljs.core.next.call(null, s__67220);
          i__67219 = G__67224;
          s__67220 = G__67225;
          continue
        }else {
          return a__67217
        }
        break
      }
    }else {
      var n__2561__auto____67222 = size;
      var i__67223 = 0;
      while(true) {
        if(i__67223 < n__2561__auto____67222) {
          a__67217[i__67223] = init_val_or_seq;
          var G__67226 = i__67223 + 1;
          i__67223 = G__67226;
          continue
        }else {
        }
        break
      }
      return a__67217
    }
  };
  long_array = function(size, init_val_or_seq) {
    switch(arguments.length) {
      case 1:
        return long_array__1.call(this, size);
      case 2:
        return long_array__2.call(this, size, init_val_or_seq)
    }
    throw"Invalid arity: " + arguments.length;
  };
  long_array.cljs$lang$arity$1 = long_array__1;
  long_array.cljs$lang$arity$2 = long_array__2;
  return long_array
}();
cljs.core.double_array = function() {
  var double_array = null;
  var double_array__1 = function(size_or_seq) {
    if(cljs.core.number_QMARK_.call(null, size_or_seq)) {
      return double_array.call(null, size_or_seq, null)
    }else {
      if(cljs.core.seq_QMARK_.call(null, size_or_seq)) {
        return cljs.core.into_array.call(null, size_or_seq)
      }else {
        if("\ufdd0'else") {
          throw new Error("double-array called with something other than size or ISeq");
        }else {
          return null
        }
      }
    }
  };
  var double_array__2 = function(size, init_val_or_seq) {
    var a__67234 = cljs.core.make_array.call(null, size);
    if(cljs.core.seq_QMARK_.call(null, init_val_or_seq)) {
      var s__67235 = cljs.core.seq.call(null, init_val_or_seq);
      var i__67236 = 0;
      var s__67237 = s__67235;
      while(true) {
        if(cljs.core.truth_(function() {
          var and__3822__auto____67238 = s__67237;
          if(and__3822__auto____67238) {
            return i__67236 < size
          }else {
            return and__3822__auto____67238
          }
        }())) {
          a__67234[i__67236] = cljs.core.first.call(null, s__67237);
          var G__67241 = i__67236 + 1;
          var G__67242 = cljs.core.next.call(null, s__67237);
          i__67236 = G__67241;
          s__67237 = G__67242;
          continue
        }else {
          return a__67234
        }
        break
      }
    }else {
      var n__2561__auto____67239 = size;
      var i__67240 = 0;
      while(true) {
        if(i__67240 < n__2561__auto____67239) {
          a__67234[i__67240] = init_val_or_seq;
          var G__67243 = i__67240 + 1;
          i__67240 = G__67243;
          continue
        }else {
        }
        break
      }
      return a__67234
    }
  };
  double_array = function(size, init_val_or_seq) {
    switch(arguments.length) {
      case 1:
        return double_array__1.call(this, size);
      case 2:
        return double_array__2.call(this, size, init_val_or_seq)
    }
    throw"Invalid arity: " + arguments.length;
  };
  double_array.cljs$lang$arity$1 = double_array__1;
  double_array.cljs$lang$arity$2 = double_array__2;
  return double_array
}();
cljs.core.object_array = function() {
  var object_array = null;
  var object_array__1 = function(size_or_seq) {
    if(cljs.core.number_QMARK_.call(null, size_or_seq)) {
      return object_array.call(null, size_or_seq, null)
    }else {
      if(cljs.core.seq_QMARK_.call(null, size_or_seq)) {
        return cljs.core.into_array.call(null, size_or_seq)
      }else {
        if("\ufdd0'else") {
          throw new Error("object-array called with something other than size or ISeq");
        }else {
          return null
        }
      }
    }
  };
  var object_array__2 = function(size, init_val_or_seq) {
    var a__67251 = cljs.core.make_array.call(null, size);
    if(cljs.core.seq_QMARK_.call(null, init_val_or_seq)) {
      var s__67252 = cljs.core.seq.call(null, init_val_or_seq);
      var i__67253 = 0;
      var s__67254 = s__67252;
      while(true) {
        if(cljs.core.truth_(function() {
          var and__3822__auto____67255 = s__67254;
          if(and__3822__auto____67255) {
            return i__67253 < size
          }else {
            return and__3822__auto____67255
          }
        }())) {
          a__67251[i__67253] = cljs.core.first.call(null, s__67254);
          var G__67258 = i__67253 + 1;
          var G__67259 = cljs.core.next.call(null, s__67254);
          i__67253 = G__67258;
          s__67254 = G__67259;
          continue
        }else {
          return a__67251
        }
        break
      }
    }else {
      var n__2561__auto____67256 = size;
      var i__67257 = 0;
      while(true) {
        if(i__67257 < n__2561__auto____67256) {
          a__67251[i__67257] = init_val_or_seq;
          var G__67260 = i__67257 + 1;
          i__67257 = G__67260;
          continue
        }else {
        }
        break
      }
      return a__67251
    }
  };
  object_array = function(size, init_val_or_seq) {
    switch(arguments.length) {
      case 1:
        return object_array__1.call(this, size);
      case 2:
        return object_array__2.call(this, size, init_val_or_seq)
    }
    throw"Invalid arity: " + arguments.length;
  };
  object_array.cljs$lang$arity$1 = object_array__1;
  object_array.cljs$lang$arity$2 = object_array__2;
  return object_array
}();
cljs.core.bounded_count = function bounded_count(s, n) {
  if(cljs.core.counted_QMARK_.call(null, s)) {
    return cljs.core.count.call(null, s)
  }else {
    var s__67265 = s;
    var i__67266 = n;
    var sum__67267 = 0;
    while(true) {
      if(cljs.core.truth_(function() {
        var and__3822__auto____67268 = i__67266 > 0;
        if(and__3822__auto____67268) {
          return cljs.core.seq.call(null, s__67265)
        }else {
          return and__3822__auto____67268
        }
      }())) {
        var G__67269 = cljs.core.next.call(null, s__67265);
        var G__67270 = i__67266 - 1;
        var G__67271 = sum__67267 + 1;
        s__67265 = G__67269;
        i__67266 = G__67270;
        sum__67267 = G__67271;
        continue
      }else {
        return sum__67267
      }
      break
    }
  }
};
cljs.core.spread = function spread(arglist) {
  if(arglist == null) {
    return null
  }else {
    if(cljs.core.next.call(null, arglist) == null) {
      return cljs.core.seq.call(null, cljs.core.first.call(null, arglist))
    }else {
      if("\ufdd0'else") {
        return cljs.core.cons.call(null, cljs.core.first.call(null, arglist), spread.call(null, cljs.core.next.call(null, arglist)))
      }else {
        return null
      }
    }
  }
};
cljs.core.concat = function() {
  var concat = null;
  var concat__0 = function() {
    return new cljs.core.LazySeq(null, false, function() {
      return null
    }, null)
  };
  var concat__1 = function(x) {
    return new cljs.core.LazySeq(null, false, function() {
      return x
    }, null)
  };
  var concat__2 = function(x, y) {
    return new cljs.core.LazySeq(null, false, function() {
      var s__67276 = cljs.core.seq.call(null, x);
      if(s__67276) {
        if(cljs.core.chunked_seq_QMARK_.call(null, s__67276)) {
          return cljs.core.chunk_cons.call(null, cljs.core.chunk_first.call(null, s__67276), concat.call(null, cljs.core.chunk_rest.call(null, s__67276), y))
        }else {
          return cljs.core.cons.call(null, cljs.core.first.call(null, s__67276), concat.call(null, cljs.core.rest.call(null, s__67276), y))
        }
      }else {
        return y
      }
    }, null)
  };
  var concat__3 = function() {
    var G__67280__delegate = function(x, y, zs) {
      var cat__67279 = function cat(xys, zs) {
        return new cljs.core.LazySeq(null, false, function() {
          var xys__67278 = cljs.core.seq.call(null, xys);
          if(xys__67278) {
            if(cljs.core.chunked_seq_QMARK_.call(null, xys__67278)) {
              return cljs.core.chunk_cons.call(null, cljs.core.chunk_first.call(null, xys__67278), cat.call(null, cljs.core.chunk_rest.call(null, xys__67278), zs))
            }else {
              return cljs.core.cons.call(null, cljs.core.first.call(null, xys__67278), cat.call(null, cljs.core.rest.call(null, xys__67278), zs))
            }
          }else {
            if(cljs.core.truth_(zs)) {
              return cat.call(null, cljs.core.first.call(null, zs), cljs.core.next.call(null, zs))
            }else {
              return null
            }
          }
        }, null)
      };
      return cat__67279.call(null, concat.call(null, x, y), zs)
    };
    var G__67280 = function(x, y, var_args) {
      var zs = null;
      if(goog.isDef(var_args)) {
        zs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__67280__delegate.call(this, x, y, zs)
    };
    G__67280.cljs$lang$maxFixedArity = 2;
    G__67280.cljs$lang$applyTo = function(arglist__67281) {
      var x = cljs.core.first(arglist__67281);
      var y = cljs.core.first(cljs.core.next(arglist__67281));
      var zs = cljs.core.rest(cljs.core.next(arglist__67281));
      return G__67280__delegate(x, y, zs)
    };
    G__67280.cljs$lang$arity$variadic = G__67280__delegate;
    return G__67280
  }();
  concat = function(x, y, var_args) {
    var zs = var_args;
    switch(arguments.length) {
      case 0:
        return concat__0.call(this);
      case 1:
        return concat__1.call(this, x);
      case 2:
        return concat__2.call(this, x, y);
      default:
        return concat__3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  concat.cljs$lang$maxFixedArity = 2;
  concat.cljs$lang$applyTo = concat__3.cljs$lang$applyTo;
  concat.cljs$lang$arity$0 = concat__0;
  concat.cljs$lang$arity$1 = concat__1;
  concat.cljs$lang$arity$2 = concat__2;
  concat.cljs$lang$arity$variadic = concat__3.cljs$lang$arity$variadic;
  return concat
}();
cljs.core.list_STAR_ = function() {
  var list_STAR_ = null;
  var list_STAR___1 = function(args) {
    return cljs.core.seq.call(null, args)
  };
  var list_STAR___2 = function(a, args) {
    return cljs.core.cons.call(null, a, args)
  };
  var list_STAR___3 = function(a, b, args) {
    return cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, args))
  };
  var list_STAR___4 = function(a, b, c, args) {
    return cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, args)))
  };
  var list_STAR___5 = function() {
    var G__67282__delegate = function(a, b, c, d, more) {
      return cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, cljs.core.cons.call(null, d, cljs.core.spread.call(null, more)))))
    };
    var G__67282 = function(a, b, c, d, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__67282__delegate.call(this, a, b, c, d, more)
    };
    G__67282.cljs$lang$maxFixedArity = 4;
    G__67282.cljs$lang$applyTo = function(arglist__67283) {
      var a = cljs.core.first(arglist__67283);
      var b = cljs.core.first(cljs.core.next(arglist__67283));
      var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__67283)));
      var d = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__67283))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__67283))));
      return G__67282__delegate(a, b, c, d, more)
    };
    G__67282.cljs$lang$arity$variadic = G__67282__delegate;
    return G__67282
  }();
  list_STAR_ = function(a, b, c, d, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return list_STAR___1.call(this, a);
      case 2:
        return list_STAR___2.call(this, a, b);
      case 3:
        return list_STAR___3.call(this, a, b, c);
      case 4:
        return list_STAR___4.call(this, a, b, c, d);
      default:
        return list_STAR___5.cljs$lang$arity$variadic(a, b, c, d, cljs.core.array_seq(arguments, 4))
    }
    throw"Invalid arity: " + arguments.length;
  };
  list_STAR_.cljs$lang$maxFixedArity = 4;
  list_STAR_.cljs$lang$applyTo = list_STAR___5.cljs$lang$applyTo;
  list_STAR_.cljs$lang$arity$1 = list_STAR___1;
  list_STAR_.cljs$lang$arity$2 = list_STAR___2;
  list_STAR_.cljs$lang$arity$3 = list_STAR___3;
  list_STAR_.cljs$lang$arity$4 = list_STAR___4;
  list_STAR_.cljs$lang$arity$variadic = list_STAR___5.cljs$lang$arity$variadic;
  return list_STAR_
}();
cljs.core.transient$ = function transient$(coll) {
  return cljs.core._as_transient.call(null, coll)
};
cljs.core.persistent_BANG_ = function persistent_BANG_(tcoll) {
  return cljs.core._persistent_BANG_.call(null, tcoll)
};
cljs.core.conj_BANG_ = function conj_BANG_(tcoll, val) {
  return cljs.core._conj_BANG_.call(null, tcoll, val)
};
cljs.core.assoc_BANG_ = function assoc_BANG_(tcoll, key, val) {
  return cljs.core._assoc_BANG_.call(null, tcoll, key, val)
};
cljs.core.dissoc_BANG_ = function dissoc_BANG_(tcoll, key) {
  return cljs.core._dissoc_BANG_.call(null, tcoll, key)
};
cljs.core.pop_BANG_ = function pop_BANG_(tcoll) {
  return cljs.core._pop_BANG_.call(null, tcoll)
};
cljs.core.disj_BANG_ = function disj_BANG_(tcoll, val) {
  return cljs.core._disjoin_BANG_.call(null, tcoll, val)
};
cljs.core.apply_to = function apply_to(f, argc, args) {
  var args__67325 = cljs.core.seq.call(null, args);
  if(argc === 0) {
    return f.call(null)
  }else {
    var a__67326 = cljs.core._first.call(null, args__67325);
    var args__67327 = cljs.core._rest.call(null, args__67325);
    if(argc === 1) {
      if(f.cljs$lang$arity$1) {
        return f.cljs$lang$arity$1(a__67326)
      }else {
        return f.call(null, a__67326)
      }
    }else {
      var b__67328 = cljs.core._first.call(null, args__67327);
      var args__67329 = cljs.core._rest.call(null, args__67327);
      if(argc === 2) {
        if(f.cljs$lang$arity$2) {
          return f.cljs$lang$arity$2(a__67326, b__67328)
        }else {
          return f.call(null, a__67326, b__67328)
        }
      }else {
        var c__67330 = cljs.core._first.call(null, args__67329);
        var args__67331 = cljs.core._rest.call(null, args__67329);
        if(argc === 3) {
          if(f.cljs$lang$arity$3) {
            return f.cljs$lang$arity$3(a__67326, b__67328, c__67330)
          }else {
            return f.call(null, a__67326, b__67328, c__67330)
          }
        }else {
          var d__67332 = cljs.core._first.call(null, args__67331);
          var args__67333 = cljs.core._rest.call(null, args__67331);
          if(argc === 4) {
            if(f.cljs$lang$arity$4) {
              return f.cljs$lang$arity$4(a__67326, b__67328, c__67330, d__67332)
            }else {
              return f.call(null, a__67326, b__67328, c__67330, d__67332)
            }
          }else {
            var e__67334 = cljs.core._first.call(null, args__67333);
            var args__67335 = cljs.core._rest.call(null, args__67333);
            if(argc === 5) {
              if(f.cljs$lang$arity$5) {
                return f.cljs$lang$arity$5(a__67326, b__67328, c__67330, d__67332, e__67334)
              }else {
                return f.call(null, a__67326, b__67328, c__67330, d__67332, e__67334)
              }
            }else {
              var f__67336 = cljs.core._first.call(null, args__67335);
              var args__67337 = cljs.core._rest.call(null, args__67335);
              if(argc === 6) {
                if(f__67336.cljs$lang$arity$6) {
                  return f__67336.cljs$lang$arity$6(a__67326, b__67328, c__67330, d__67332, e__67334, f__67336)
                }else {
                  return f__67336.call(null, a__67326, b__67328, c__67330, d__67332, e__67334, f__67336)
                }
              }else {
                var g__67338 = cljs.core._first.call(null, args__67337);
                var args__67339 = cljs.core._rest.call(null, args__67337);
                if(argc === 7) {
                  if(f__67336.cljs$lang$arity$7) {
                    return f__67336.cljs$lang$arity$7(a__67326, b__67328, c__67330, d__67332, e__67334, f__67336, g__67338)
                  }else {
                    return f__67336.call(null, a__67326, b__67328, c__67330, d__67332, e__67334, f__67336, g__67338)
                  }
                }else {
                  var h__67340 = cljs.core._first.call(null, args__67339);
                  var args__67341 = cljs.core._rest.call(null, args__67339);
                  if(argc === 8) {
                    if(f__67336.cljs$lang$arity$8) {
                      return f__67336.cljs$lang$arity$8(a__67326, b__67328, c__67330, d__67332, e__67334, f__67336, g__67338, h__67340)
                    }else {
                      return f__67336.call(null, a__67326, b__67328, c__67330, d__67332, e__67334, f__67336, g__67338, h__67340)
                    }
                  }else {
                    var i__67342 = cljs.core._first.call(null, args__67341);
                    var args__67343 = cljs.core._rest.call(null, args__67341);
                    if(argc === 9) {
                      if(f__67336.cljs$lang$arity$9) {
                        return f__67336.cljs$lang$arity$9(a__67326, b__67328, c__67330, d__67332, e__67334, f__67336, g__67338, h__67340, i__67342)
                      }else {
                        return f__67336.call(null, a__67326, b__67328, c__67330, d__67332, e__67334, f__67336, g__67338, h__67340, i__67342)
                      }
                    }else {
                      var j__67344 = cljs.core._first.call(null, args__67343);
                      var args__67345 = cljs.core._rest.call(null, args__67343);
                      if(argc === 10) {
                        if(f__67336.cljs$lang$arity$10) {
                          return f__67336.cljs$lang$arity$10(a__67326, b__67328, c__67330, d__67332, e__67334, f__67336, g__67338, h__67340, i__67342, j__67344)
                        }else {
                          return f__67336.call(null, a__67326, b__67328, c__67330, d__67332, e__67334, f__67336, g__67338, h__67340, i__67342, j__67344)
                        }
                      }else {
                        var k__67346 = cljs.core._first.call(null, args__67345);
                        var args__67347 = cljs.core._rest.call(null, args__67345);
                        if(argc === 11) {
                          if(f__67336.cljs$lang$arity$11) {
                            return f__67336.cljs$lang$arity$11(a__67326, b__67328, c__67330, d__67332, e__67334, f__67336, g__67338, h__67340, i__67342, j__67344, k__67346)
                          }else {
                            return f__67336.call(null, a__67326, b__67328, c__67330, d__67332, e__67334, f__67336, g__67338, h__67340, i__67342, j__67344, k__67346)
                          }
                        }else {
                          var l__67348 = cljs.core._first.call(null, args__67347);
                          var args__67349 = cljs.core._rest.call(null, args__67347);
                          if(argc === 12) {
                            if(f__67336.cljs$lang$arity$12) {
                              return f__67336.cljs$lang$arity$12(a__67326, b__67328, c__67330, d__67332, e__67334, f__67336, g__67338, h__67340, i__67342, j__67344, k__67346, l__67348)
                            }else {
                              return f__67336.call(null, a__67326, b__67328, c__67330, d__67332, e__67334, f__67336, g__67338, h__67340, i__67342, j__67344, k__67346, l__67348)
                            }
                          }else {
                            var m__67350 = cljs.core._first.call(null, args__67349);
                            var args__67351 = cljs.core._rest.call(null, args__67349);
                            if(argc === 13) {
                              if(f__67336.cljs$lang$arity$13) {
                                return f__67336.cljs$lang$arity$13(a__67326, b__67328, c__67330, d__67332, e__67334, f__67336, g__67338, h__67340, i__67342, j__67344, k__67346, l__67348, m__67350)
                              }else {
                                return f__67336.call(null, a__67326, b__67328, c__67330, d__67332, e__67334, f__67336, g__67338, h__67340, i__67342, j__67344, k__67346, l__67348, m__67350)
                              }
                            }else {
                              var n__67352 = cljs.core._first.call(null, args__67351);
                              var args__67353 = cljs.core._rest.call(null, args__67351);
                              if(argc === 14) {
                                if(f__67336.cljs$lang$arity$14) {
                                  return f__67336.cljs$lang$arity$14(a__67326, b__67328, c__67330, d__67332, e__67334, f__67336, g__67338, h__67340, i__67342, j__67344, k__67346, l__67348, m__67350, n__67352)
                                }else {
                                  return f__67336.call(null, a__67326, b__67328, c__67330, d__67332, e__67334, f__67336, g__67338, h__67340, i__67342, j__67344, k__67346, l__67348, m__67350, n__67352)
                                }
                              }else {
                                var o__67354 = cljs.core._first.call(null, args__67353);
                                var args__67355 = cljs.core._rest.call(null, args__67353);
                                if(argc === 15) {
                                  if(f__67336.cljs$lang$arity$15) {
                                    return f__67336.cljs$lang$arity$15(a__67326, b__67328, c__67330, d__67332, e__67334, f__67336, g__67338, h__67340, i__67342, j__67344, k__67346, l__67348, m__67350, n__67352, o__67354)
                                  }else {
                                    return f__67336.call(null, a__67326, b__67328, c__67330, d__67332, e__67334, f__67336, g__67338, h__67340, i__67342, j__67344, k__67346, l__67348, m__67350, n__67352, o__67354)
                                  }
                                }else {
                                  var p__67356 = cljs.core._first.call(null, args__67355);
                                  var args__67357 = cljs.core._rest.call(null, args__67355);
                                  if(argc === 16) {
                                    if(f__67336.cljs$lang$arity$16) {
                                      return f__67336.cljs$lang$arity$16(a__67326, b__67328, c__67330, d__67332, e__67334, f__67336, g__67338, h__67340, i__67342, j__67344, k__67346, l__67348, m__67350, n__67352, o__67354, p__67356)
                                    }else {
                                      return f__67336.call(null, a__67326, b__67328, c__67330, d__67332, e__67334, f__67336, g__67338, h__67340, i__67342, j__67344, k__67346, l__67348, m__67350, n__67352, o__67354, p__67356)
                                    }
                                  }else {
                                    var q__67358 = cljs.core._first.call(null, args__67357);
                                    var args__67359 = cljs.core._rest.call(null, args__67357);
                                    if(argc === 17) {
                                      if(f__67336.cljs$lang$arity$17) {
                                        return f__67336.cljs$lang$arity$17(a__67326, b__67328, c__67330, d__67332, e__67334, f__67336, g__67338, h__67340, i__67342, j__67344, k__67346, l__67348, m__67350, n__67352, o__67354, p__67356, q__67358)
                                      }else {
                                        return f__67336.call(null, a__67326, b__67328, c__67330, d__67332, e__67334, f__67336, g__67338, h__67340, i__67342, j__67344, k__67346, l__67348, m__67350, n__67352, o__67354, p__67356, q__67358)
                                      }
                                    }else {
                                      var r__67360 = cljs.core._first.call(null, args__67359);
                                      var args__67361 = cljs.core._rest.call(null, args__67359);
                                      if(argc === 18) {
                                        if(f__67336.cljs$lang$arity$18) {
                                          return f__67336.cljs$lang$arity$18(a__67326, b__67328, c__67330, d__67332, e__67334, f__67336, g__67338, h__67340, i__67342, j__67344, k__67346, l__67348, m__67350, n__67352, o__67354, p__67356, q__67358, r__67360)
                                        }else {
                                          return f__67336.call(null, a__67326, b__67328, c__67330, d__67332, e__67334, f__67336, g__67338, h__67340, i__67342, j__67344, k__67346, l__67348, m__67350, n__67352, o__67354, p__67356, q__67358, r__67360)
                                        }
                                      }else {
                                        var s__67362 = cljs.core._first.call(null, args__67361);
                                        var args__67363 = cljs.core._rest.call(null, args__67361);
                                        if(argc === 19) {
                                          if(f__67336.cljs$lang$arity$19) {
                                            return f__67336.cljs$lang$arity$19(a__67326, b__67328, c__67330, d__67332, e__67334, f__67336, g__67338, h__67340, i__67342, j__67344, k__67346, l__67348, m__67350, n__67352, o__67354, p__67356, q__67358, r__67360, s__67362)
                                          }else {
                                            return f__67336.call(null, a__67326, b__67328, c__67330, d__67332, e__67334, f__67336, g__67338, h__67340, i__67342, j__67344, k__67346, l__67348, m__67350, n__67352, o__67354, p__67356, q__67358, r__67360, s__67362)
                                          }
                                        }else {
                                          var t__67364 = cljs.core._first.call(null, args__67363);
                                          var args__67365 = cljs.core._rest.call(null, args__67363);
                                          if(argc === 20) {
                                            if(f__67336.cljs$lang$arity$20) {
                                              return f__67336.cljs$lang$arity$20(a__67326, b__67328, c__67330, d__67332, e__67334, f__67336, g__67338, h__67340, i__67342, j__67344, k__67346, l__67348, m__67350, n__67352, o__67354, p__67356, q__67358, r__67360, s__67362, t__67364)
                                            }else {
                                              return f__67336.call(null, a__67326, b__67328, c__67330, d__67332, e__67334, f__67336, g__67338, h__67340, i__67342, j__67344, k__67346, l__67348, m__67350, n__67352, o__67354, p__67356, q__67358, r__67360, s__67362, t__67364)
                                            }
                                          }else {
                                            throw new Error("Only up to 20 arguments supported on functions");
                                          }
                                        }
                                      }
                                    }
                                  }
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
};
cljs.core.apply = function() {
  var apply = null;
  var apply__2 = function(f, args) {
    var fixed_arity__67380 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__67381 = cljs.core.bounded_count.call(null, args, fixed_arity__67380 + 1);
      if(bc__67381 <= fixed_arity__67380) {
        return cljs.core.apply_to.call(null, f, bc__67381, args)
      }else {
        return f.cljs$lang$applyTo(args)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, args))
    }
  };
  var apply__3 = function(f, x, args) {
    var arglist__67382 = cljs.core.list_STAR_.call(null, x, args);
    var fixed_arity__67383 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__67384 = cljs.core.bounded_count.call(null, arglist__67382, fixed_arity__67383 + 1);
      if(bc__67384 <= fixed_arity__67383) {
        return cljs.core.apply_to.call(null, f, bc__67384, arglist__67382)
      }else {
        return f.cljs$lang$applyTo(arglist__67382)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__67382))
    }
  };
  var apply__4 = function(f, x, y, args) {
    var arglist__67385 = cljs.core.list_STAR_.call(null, x, y, args);
    var fixed_arity__67386 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__67387 = cljs.core.bounded_count.call(null, arglist__67385, fixed_arity__67386 + 1);
      if(bc__67387 <= fixed_arity__67386) {
        return cljs.core.apply_to.call(null, f, bc__67387, arglist__67385)
      }else {
        return f.cljs$lang$applyTo(arglist__67385)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__67385))
    }
  };
  var apply__5 = function(f, x, y, z, args) {
    var arglist__67388 = cljs.core.list_STAR_.call(null, x, y, z, args);
    var fixed_arity__67389 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__67390 = cljs.core.bounded_count.call(null, arglist__67388, fixed_arity__67389 + 1);
      if(bc__67390 <= fixed_arity__67389) {
        return cljs.core.apply_to.call(null, f, bc__67390, arglist__67388)
      }else {
        return f.cljs$lang$applyTo(arglist__67388)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__67388))
    }
  };
  var apply__6 = function() {
    var G__67394__delegate = function(f, a, b, c, d, args) {
      var arglist__67391 = cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, cljs.core.cons.call(null, d, cljs.core.spread.call(null, args)))));
      var fixed_arity__67392 = f.cljs$lang$maxFixedArity;
      if(cljs.core.truth_(f.cljs$lang$applyTo)) {
        var bc__67393 = cljs.core.bounded_count.call(null, arglist__67391, fixed_arity__67392 + 1);
        if(bc__67393 <= fixed_arity__67392) {
          return cljs.core.apply_to.call(null, f, bc__67393, arglist__67391)
        }else {
          return f.cljs$lang$applyTo(arglist__67391)
        }
      }else {
        return f.apply(f, cljs.core.to_array.call(null, arglist__67391))
      }
    };
    var G__67394 = function(f, a, b, c, d, var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 5), 0)
      }
      return G__67394__delegate.call(this, f, a, b, c, d, args)
    };
    G__67394.cljs$lang$maxFixedArity = 5;
    G__67394.cljs$lang$applyTo = function(arglist__67395) {
      var f = cljs.core.first(arglist__67395);
      var a = cljs.core.first(cljs.core.next(arglist__67395));
      var b = cljs.core.first(cljs.core.next(cljs.core.next(arglist__67395)));
      var c = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__67395))));
      var d = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__67395)))));
      var args = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__67395)))));
      return G__67394__delegate(f, a, b, c, d, args)
    };
    G__67394.cljs$lang$arity$variadic = G__67394__delegate;
    return G__67394
  }();
  apply = function(f, a, b, c, d, var_args) {
    var args = var_args;
    switch(arguments.length) {
      case 2:
        return apply__2.call(this, f, a);
      case 3:
        return apply__3.call(this, f, a, b);
      case 4:
        return apply__4.call(this, f, a, b, c);
      case 5:
        return apply__5.call(this, f, a, b, c, d);
      default:
        return apply__6.cljs$lang$arity$variadic(f, a, b, c, d, cljs.core.array_seq(arguments, 5))
    }
    throw"Invalid arity: " + arguments.length;
  };
  apply.cljs$lang$maxFixedArity = 5;
  apply.cljs$lang$applyTo = apply__6.cljs$lang$applyTo;
  apply.cljs$lang$arity$2 = apply__2;
  apply.cljs$lang$arity$3 = apply__3;
  apply.cljs$lang$arity$4 = apply__4;
  apply.cljs$lang$arity$5 = apply__5;
  apply.cljs$lang$arity$variadic = apply__6.cljs$lang$arity$variadic;
  return apply
}();
cljs.core.vary_meta = function() {
  var vary_meta__delegate = function(obj, f, args) {
    return cljs.core.with_meta.call(null, obj, cljs.core.apply.call(null, f, cljs.core.meta.call(null, obj), args))
  };
  var vary_meta = function(obj, f, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
    }
    return vary_meta__delegate.call(this, obj, f, args)
  };
  vary_meta.cljs$lang$maxFixedArity = 2;
  vary_meta.cljs$lang$applyTo = function(arglist__67396) {
    var obj = cljs.core.first(arglist__67396);
    var f = cljs.core.first(cljs.core.next(arglist__67396));
    var args = cljs.core.rest(cljs.core.next(arglist__67396));
    return vary_meta__delegate(obj, f, args)
  };
  vary_meta.cljs$lang$arity$variadic = vary_meta__delegate;
  return vary_meta
}();
cljs.core.not_EQ_ = function() {
  var not_EQ_ = null;
  var not_EQ___1 = function(x) {
    return false
  };
  var not_EQ___2 = function(x, y) {
    return!cljs.core._EQ_.call(null, x, y)
  };
  var not_EQ___3 = function() {
    var G__67397__delegate = function(x, y, more) {
      return cljs.core.not.call(null, cljs.core.apply.call(null, cljs.core._EQ_, x, y, more))
    };
    var G__67397 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__67397__delegate.call(this, x, y, more)
    };
    G__67397.cljs$lang$maxFixedArity = 2;
    G__67397.cljs$lang$applyTo = function(arglist__67398) {
      var x = cljs.core.first(arglist__67398);
      var y = cljs.core.first(cljs.core.next(arglist__67398));
      var more = cljs.core.rest(cljs.core.next(arglist__67398));
      return G__67397__delegate(x, y, more)
    };
    G__67397.cljs$lang$arity$variadic = G__67397__delegate;
    return G__67397
  }();
  not_EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return not_EQ___1.call(this, x);
      case 2:
        return not_EQ___2.call(this, x, y);
      default:
        return not_EQ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  not_EQ_.cljs$lang$maxFixedArity = 2;
  not_EQ_.cljs$lang$applyTo = not_EQ___3.cljs$lang$applyTo;
  not_EQ_.cljs$lang$arity$1 = not_EQ___1;
  not_EQ_.cljs$lang$arity$2 = not_EQ___2;
  not_EQ_.cljs$lang$arity$variadic = not_EQ___3.cljs$lang$arity$variadic;
  return not_EQ_
}();
cljs.core.not_empty = function not_empty(coll) {
  if(cljs.core.seq.call(null, coll)) {
    return coll
  }else {
    return null
  }
};
cljs.core.every_QMARK_ = function every_QMARK_(pred, coll) {
  while(true) {
    if(cljs.core.seq.call(null, coll) == null) {
      return true
    }else {
      if(cljs.core.truth_(pred.call(null, cljs.core.first.call(null, coll)))) {
        var G__67399 = pred;
        var G__67400 = cljs.core.next.call(null, coll);
        pred = G__67399;
        coll = G__67400;
        continue
      }else {
        if("\ufdd0'else") {
          return false
        }else {
          return null
        }
      }
    }
    break
  }
};
cljs.core.not_every_QMARK_ = function not_every_QMARK_(pred, coll) {
  return!cljs.core.every_QMARK_.call(null, pred, coll)
};
cljs.core.some = function some(pred, coll) {
  while(true) {
    if(cljs.core.seq.call(null, coll)) {
      var or__3824__auto____67402 = pred.call(null, cljs.core.first.call(null, coll));
      if(cljs.core.truth_(or__3824__auto____67402)) {
        return or__3824__auto____67402
      }else {
        var G__67403 = pred;
        var G__67404 = cljs.core.next.call(null, coll);
        pred = G__67403;
        coll = G__67404;
        continue
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.not_any_QMARK_ = function not_any_QMARK_(pred, coll) {
  return cljs.core.not.call(null, cljs.core.some.call(null, pred, coll))
};
cljs.core.even_QMARK_ = function even_QMARK_(n) {
  if(cljs.core.integer_QMARK_.call(null, n)) {
    return(n & 1) === 0
  }else {
    throw new Error([cljs.core.str("Argument must be an integer: "), cljs.core.str(n)].join(""));
  }
};
cljs.core.odd_QMARK_ = function odd_QMARK_(n) {
  return!cljs.core.even_QMARK_.call(null, n)
};
cljs.core.identity = function identity(x) {
  return x
};
cljs.core.complement = function complement(f) {
  return function() {
    var G__67405 = null;
    var G__67405__0 = function() {
      return cljs.core.not.call(null, f.call(null))
    };
    var G__67405__1 = function(x) {
      return cljs.core.not.call(null, f.call(null, x))
    };
    var G__67405__2 = function(x, y) {
      return cljs.core.not.call(null, f.call(null, x, y))
    };
    var G__67405__3 = function() {
      var G__67406__delegate = function(x, y, zs) {
        return cljs.core.not.call(null, cljs.core.apply.call(null, f, x, y, zs))
      };
      var G__67406 = function(x, y, var_args) {
        var zs = null;
        if(goog.isDef(var_args)) {
          zs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
        }
        return G__67406__delegate.call(this, x, y, zs)
      };
      G__67406.cljs$lang$maxFixedArity = 2;
      G__67406.cljs$lang$applyTo = function(arglist__67407) {
        var x = cljs.core.first(arglist__67407);
        var y = cljs.core.first(cljs.core.next(arglist__67407));
        var zs = cljs.core.rest(cljs.core.next(arglist__67407));
        return G__67406__delegate(x, y, zs)
      };
      G__67406.cljs$lang$arity$variadic = G__67406__delegate;
      return G__67406
    }();
    G__67405 = function(x, y, var_args) {
      var zs = var_args;
      switch(arguments.length) {
        case 0:
          return G__67405__0.call(this);
        case 1:
          return G__67405__1.call(this, x);
        case 2:
          return G__67405__2.call(this, x, y);
        default:
          return G__67405__3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
      }
      throw"Invalid arity: " + arguments.length;
    };
    G__67405.cljs$lang$maxFixedArity = 2;
    G__67405.cljs$lang$applyTo = G__67405__3.cljs$lang$applyTo;
    return G__67405
  }()
};
cljs.core.constantly = function constantly(x) {
  return function() {
    var G__67408__delegate = function(args) {
      return x
    };
    var G__67408 = function(var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__67408__delegate.call(this, args)
    };
    G__67408.cljs$lang$maxFixedArity = 0;
    G__67408.cljs$lang$applyTo = function(arglist__67409) {
      var args = cljs.core.seq(arglist__67409);
      return G__67408__delegate(args)
    };
    G__67408.cljs$lang$arity$variadic = G__67408__delegate;
    return G__67408
  }()
};
cljs.core.comp = function() {
  var comp = null;
  var comp__0 = function() {
    return cljs.core.identity
  };
  var comp__1 = function(f) {
    return f
  };
  var comp__2 = function(f, g) {
    return function() {
      var G__67416 = null;
      var G__67416__0 = function() {
        return f.call(null, g.call(null))
      };
      var G__67416__1 = function(x) {
        return f.call(null, g.call(null, x))
      };
      var G__67416__2 = function(x, y) {
        return f.call(null, g.call(null, x, y))
      };
      var G__67416__3 = function(x, y, z) {
        return f.call(null, g.call(null, x, y, z))
      };
      var G__67416__4 = function() {
        var G__67417__delegate = function(x, y, z, args) {
          return f.call(null, cljs.core.apply.call(null, g, x, y, z, args))
        };
        var G__67417 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__67417__delegate.call(this, x, y, z, args)
        };
        G__67417.cljs$lang$maxFixedArity = 3;
        G__67417.cljs$lang$applyTo = function(arglist__67418) {
          var x = cljs.core.first(arglist__67418);
          var y = cljs.core.first(cljs.core.next(arglist__67418));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__67418)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__67418)));
          return G__67417__delegate(x, y, z, args)
        };
        G__67417.cljs$lang$arity$variadic = G__67417__delegate;
        return G__67417
      }();
      G__67416 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__67416__0.call(this);
          case 1:
            return G__67416__1.call(this, x);
          case 2:
            return G__67416__2.call(this, x, y);
          case 3:
            return G__67416__3.call(this, x, y, z);
          default:
            return G__67416__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__67416.cljs$lang$maxFixedArity = 3;
      G__67416.cljs$lang$applyTo = G__67416__4.cljs$lang$applyTo;
      return G__67416
    }()
  };
  var comp__3 = function(f, g, h) {
    return function() {
      var G__67419 = null;
      var G__67419__0 = function() {
        return f.call(null, g.call(null, h.call(null)))
      };
      var G__67419__1 = function(x) {
        return f.call(null, g.call(null, h.call(null, x)))
      };
      var G__67419__2 = function(x, y) {
        return f.call(null, g.call(null, h.call(null, x, y)))
      };
      var G__67419__3 = function(x, y, z) {
        return f.call(null, g.call(null, h.call(null, x, y, z)))
      };
      var G__67419__4 = function() {
        var G__67420__delegate = function(x, y, z, args) {
          return f.call(null, g.call(null, cljs.core.apply.call(null, h, x, y, z, args)))
        };
        var G__67420 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__67420__delegate.call(this, x, y, z, args)
        };
        G__67420.cljs$lang$maxFixedArity = 3;
        G__67420.cljs$lang$applyTo = function(arglist__67421) {
          var x = cljs.core.first(arglist__67421);
          var y = cljs.core.first(cljs.core.next(arglist__67421));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__67421)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__67421)));
          return G__67420__delegate(x, y, z, args)
        };
        G__67420.cljs$lang$arity$variadic = G__67420__delegate;
        return G__67420
      }();
      G__67419 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__67419__0.call(this);
          case 1:
            return G__67419__1.call(this, x);
          case 2:
            return G__67419__2.call(this, x, y);
          case 3:
            return G__67419__3.call(this, x, y, z);
          default:
            return G__67419__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__67419.cljs$lang$maxFixedArity = 3;
      G__67419.cljs$lang$applyTo = G__67419__4.cljs$lang$applyTo;
      return G__67419
    }()
  };
  var comp__4 = function() {
    var G__67422__delegate = function(f1, f2, f3, fs) {
      var fs__67413 = cljs.core.reverse.call(null, cljs.core.list_STAR_.call(null, f1, f2, f3, fs));
      return function() {
        var G__67423__delegate = function(args) {
          var ret__67414 = cljs.core.apply.call(null, cljs.core.first.call(null, fs__67413), args);
          var fs__67415 = cljs.core.next.call(null, fs__67413);
          while(true) {
            if(fs__67415) {
              var G__67424 = cljs.core.first.call(null, fs__67415).call(null, ret__67414);
              var G__67425 = cljs.core.next.call(null, fs__67415);
              ret__67414 = G__67424;
              fs__67415 = G__67425;
              continue
            }else {
              return ret__67414
            }
            break
          }
        };
        var G__67423 = function(var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
          }
          return G__67423__delegate.call(this, args)
        };
        G__67423.cljs$lang$maxFixedArity = 0;
        G__67423.cljs$lang$applyTo = function(arglist__67426) {
          var args = cljs.core.seq(arglist__67426);
          return G__67423__delegate(args)
        };
        G__67423.cljs$lang$arity$variadic = G__67423__delegate;
        return G__67423
      }()
    };
    var G__67422 = function(f1, f2, f3, var_args) {
      var fs = null;
      if(goog.isDef(var_args)) {
        fs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__67422__delegate.call(this, f1, f2, f3, fs)
    };
    G__67422.cljs$lang$maxFixedArity = 3;
    G__67422.cljs$lang$applyTo = function(arglist__67427) {
      var f1 = cljs.core.first(arglist__67427);
      var f2 = cljs.core.first(cljs.core.next(arglist__67427));
      var f3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__67427)));
      var fs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__67427)));
      return G__67422__delegate(f1, f2, f3, fs)
    };
    G__67422.cljs$lang$arity$variadic = G__67422__delegate;
    return G__67422
  }();
  comp = function(f1, f2, f3, var_args) {
    var fs = var_args;
    switch(arguments.length) {
      case 0:
        return comp__0.call(this);
      case 1:
        return comp__1.call(this, f1);
      case 2:
        return comp__2.call(this, f1, f2);
      case 3:
        return comp__3.call(this, f1, f2, f3);
      default:
        return comp__4.cljs$lang$arity$variadic(f1, f2, f3, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  comp.cljs$lang$maxFixedArity = 3;
  comp.cljs$lang$applyTo = comp__4.cljs$lang$applyTo;
  comp.cljs$lang$arity$0 = comp__0;
  comp.cljs$lang$arity$1 = comp__1;
  comp.cljs$lang$arity$2 = comp__2;
  comp.cljs$lang$arity$3 = comp__3;
  comp.cljs$lang$arity$variadic = comp__4.cljs$lang$arity$variadic;
  return comp
}();
cljs.core.partial = function() {
  var partial = null;
  var partial__2 = function(f, arg1) {
    return function() {
      var G__67428__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, args)
      };
      var G__67428 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__67428__delegate.call(this, args)
      };
      G__67428.cljs$lang$maxFixedArity = 0;
      G__67428.cljs$lang$applyTo = function(arglist__67429) {
        var args = cljs.core.seq(arglist__67429);
        return G__67428__delegate(args)
      };
      G__67428.cljs$lang$arity$variadic = G__67428__delegate;
      return G__67428
    }()
  };
  var partial__3 = function(f, arg1, arg2) {
    return function() {
      var G__67430__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, arg2, args)
      };
      var G__67430 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__67430__delegate.call(this, args)
      };
      G__67430.cljs$lang$maxFixedArity = 0;
      G__67430.cljs$lang$applyTo = function(arglist__67431) {
        var args = cljs.core.seq(arglist__67431);
        return G__67430__delegate(args)
      };
      G__67430.cljs$lang$arity$variadic = G__67430__delegate;
      return G__67430
    }()
  };
  var partial__4 = function(f, arg1, arg2, arg3) {
    return function() {
      var G__67432__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, arg2, arg3, args)
      };
      var G__67432 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__67432__delegate.call(this, args)
      };
      G__67432.cljs$lang$maxFixedArity = 0;
      G__67432.cljs$lang$applyTo = function(arglist__67433) {
        var args = cljs.core.seq(arglist__67433);
        return G__67432__delegate(args)
      };
      G__67432.cljs$lang$arity$variadic = G__67432__delegate;
      return G__67432
    }()
  };
  var partial__5 = function() {
    var G__67434__delegate = function(f, arg1, arg2, arg3, more) {
      return function() {
        var G__67435__delegate = function(args) {
          return cljs.core.apply.call(null, f, arg1, arg2, arg3, cljs.core.concat.call(null, more, args))
        };
        var G__67435 = function(var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
          }
          return G__67435__delegate.call(this, args)
        };
        G__67435.cljs$lang$maxFixedArity = 0;
        G__67435.cljs$lang$applyTo = function(arglist__67436) {
          var args = cljs.core.seq(arglist__67436);
          return G__67435__delegate(args)
        };
        G__67435.cljs$lang$arity$variadic = G__67435__delegate;
        return G__67435
      }()
    };
    var G__67434 = function(f, arg1, arg2, arg3, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__67434__delegate.call(this, f, arg1, arg2, arg3, more)
    };
    G__67434.cljs$lang$maxFixedArity = 4;
    G__67434.cljs$lang$applyTo = function(arglist__67437) {
      var f = cljs.core.first(arglist__67437);
      var arg1 = cljs.core.first(cljs.core.next(arglist__67437));
      var arg2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__67437)));
      var arg3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__67437))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__67437))));
      return G__67434__delegate(f, arg1, arg2, arg3, more)
    };
    G__67434.cljs$lang$arity$variadic = G__67434__delegate;
    return G__67434
  }();
  partial = function(f, arg1, arg2, arg3, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return partial__2.call(this, f, arg1);
      case 3:
        return partial__3.call(this, f, arg1, arg2);
      case 4:
        return partial__4.call(this, f, arg1, arg2, arg3);
      default:
        return partial__5.cljs$lang$arity$variadic(f, arg1, arg2, arg3, cljs.core.array_seq(arguments, 4))
    }
    throw"Invalid arity: " + arguments.length;
  };
  partial.cljs$lang$maxFixedArity = 4;
  partial.cljs$lang$applyTo = partial__5.cljs$lang$applyTo;
  partial.cljs$lang$arity$2 = partial__2;
  partial.cljs$lang$arity$3 = partial__3;
  partial.cljs$lang$arity$4 = partial__4;
  partial.cljs$lang$arity$variadic = partial__5.cljs$lang$arity$variadic;
  return partial
}();
cljs.core.fnil = function() {
  var fnil = null;
  var fnil__2 = function(f, x) {
    return function() {
      var G__67438 = null;
      var G__67438__1 = function(a) {
        return f.call(null, a == null ? x : a)
      };
      var G__67438__2 = function(a, b) {
        return f.call(null, a == null ? x : a, b)
      };
      var G__67438__3 = function(a, b, c) {
        return f.call(null, a == null ? x : a, b, c)
      };
      var G__67438__4 = function() {
        var G__67439__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, a == null ? x : a, b, c, ds)
        };
        var G__67439 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__67439__delegate.call(this, a, b, c, ds)
        };
        G__67439.cljs$lang$maxFixedArity = 3;
        G__67439.cljs$lang$applyTo = function(arglist__67440) {
          var a = cljs.core.first(arglist__67440);
          var b = cljs.core.first(cljs.core.next(arglist__67440));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__67440)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__67440)));
          return G__67439__delegate(a, b, c, ds)
        };
        G__67439.cljs$lang$arity$variadic = G__67439__delegate;
        return G__67439
      }();
      G__67438 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 1:
            return G__67438__1.call(this, a);
          case 2:
            return G__67438__2.call(this, a, b);
          case 3:
            return G__67438__3.call(this, a, b, c);
          default:
            return G__67438__4.cljs$lang$arity$variadic(a, b, c, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__67438.cljs$lang$maxFixedArity = 3;
      G__67438.cljs$lang$applyTo = G__67438__4.cljs$lang$applyTo;
      return G__67438
    }()
  };
  var fnil__3 = function(f, x, y) {
    return function() {
      var G__67441 = null;
      var G__67441__2 = function(a, b) {
        return f.call(null, a == null ? x : a, b == null ? y : b)
      };
      var G__67441__3 = function(a, b, c) {
        return f.call(null, a == null ? x : a, b == null ? y : b, c)
      };
      var G__67441__4 = function() {
        var G__67442__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, a == null ? x : a, b == null ? y : b, c, ds)
        };
        var G__67442 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__67442__delegate.call(this, a, b, c, ds)
        };
        G__67442.cljs$lang$maxFixedArity = 3;
        G__67442.cljs$lang$applyTo = function(arglist__67443) {
          var a = cljs.core.first(arglist__67443);
          var b = cljs.core.first(cljs.core.next(arglist__67443));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__67443)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__67443)));
          return G__67442__delegate(a, b, c, ds)
        };
        G__67442.cljs$lang$arity$variadic = G__67442__delegate;
        return G__67442
      }();
      G__67441 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 2:
            return G__67441__2.call(this, a, b);
          case 3:
            return G__67441__3.call(this, a, b, c);
          default:
            return G__67441__4.cljs$lang$arity$variadic(a, b, c, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__67441.cljs$lang$maxFixedArity = 3;
      G__67441.cljs$lang$applyTo = G__67441__4.cljs$lang$applyTo;
      return G__67441
    }()
  };
  var fnil__4 = function(f, x, y, z) {
    return function() {
      var G__67444 = null;
      var G__67444__2 = function(a, b) {
        return f.call(null, a == null ? x : a, b == null ? y : b)
      };
      var G__67444__3 = function(a, b, c) {
        return f.call(null, a == null ? x : a, b == null ? y : b, c == null ? z : c)
      };
      var G__67444__4 = function() {
        var G__67445__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, a == null ? x : a, b == null ? y : b, c == null ? z : c, ds)
        };
        var G__67445 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__67445__delegate.call(this, a, b, c, ds)
        };
        G__67445.cljs$lang$maxFixedArity = 3;
        G__67445.cljs$lang$applyTo = function(arglist__67446) {
          var a = cljs.core.first(arglist__67446);
          var b = cljs.core.first(cljs.core.next(arglist__67446));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__67446)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__67446)));
          return G__67445__delegate(a, b, c, ds)
        };
        G__67445.cljs$lang$arity$variadic = G__67445__delegate;
        return G__67445
      }();
      G__67444 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 2:
            return G__67444__2.call(this, a, b);
          case 3:
            return G__67444__3.call(this, a, b, c);
          default:
            return G__67444__4.cljs$lang$arity$variadic(a, b, c, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__67444.cljs$lang$maxFixedArity = 3;
      G__67444.cljs$lang$applyTo = G__67444__4.cljs$lang$applyTo;
      return G__67444
    }()
  };
  fnil = function(f, x, y, z) {
    switch(arguments.length) {
      case 2:
        return fnil__2.call(this, f, x);
      case 3:
        return fnil__3.call(this, f, x, y);
      case 4:
        return fnil__4.call(this, f, x, y, z)
    }
    throw"Invalid arity: " + arguments.length;
  };
  fnil.cljs$lang$arity$2 = fnil__2;
  fnil.cljs$lang$arity$3 = fnil__3;
  fnil.cljs$lang$arity$4 = fnil__4;
  return fnil
}();
cljs.core.map_indexed = function map_indexed(f, coll) {
  var mapi__67462 = function mapi(idx, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____67470 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____67470) {
        var s__67471 = temp__3974__auto____67470;
        if(cljs.core.chunked_seq_QMARK_.call(null, s__67471)) {
          var c__67472 = cljs.core.chunk_first.call(null, s__67471);
          var size__67473 = cljs.core.count.call(null, c__67472);
          var b__67474 = cljs.core.chunk_buffer.call(null, size__67473);
          var n__2561__auto____67475 = size__67473;
          var i__67476 = 0;
          while(true) {
            if(i__67476 < n__2561__auto____67475) {
              cljs.core.chunk_append.call(null, b__67474, f.call(null, idx + i__67476, cljs.core._nth.call(null, c__67472, i__67476)));
              var G__67477 = i__67476 + 1;
              i__67476 = G__67477;
              continue
            }else {
            }
            break
          }
          return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__67474), mapi.call(null, idx + size__67473, cljs.core.chunk_rest.call(null, s__67471)))
        }else {
          return cljs.core.cons.call(null, f.call(null, idx, cljs.core.first.call(null, s__67471)), mapi.call(null, idx + 1, cljs.core.rest.call(null, s__67471)))
        }
      }else {
        return null
      }
    }, null)
  };
  return mapi__67462.call(null, 0, coll)
};
cljs.core.keep = function keep(f, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____67487 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____67487) {
      var s__67488 = temp__3974__auto____67487;
      if(cljs.core.chunked_seq_QMARK_.call(null, s__67488)) {
        var c__67489 = cljs.core.chunk_first.call(null, s__67488);
        var size__67490 = cljs.core.count.call(null, c__67489);
        var b__67491 = cljs.core.chunk_buffer.call(null, size__67490);
        var n__2561__auto____67492 = size__67490;
        var i__67493 = 0;
        while(true) {
          if(i__67493 < n__2561__auto____67492) {
            var x__67494 = f.call(null, cljs.core._nth.call(null, c__67489, i__67493));
            if(x__67494 == null) {
            }else {
              cljs.core.chunk_append.call(null, b__67491, x__67494)
            }
            var G__67496 = i__67493 + 1;
            i__67493 = G__67496;
            continue
          }else {
          }
          break
        }
        return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__67491), keep.call(null, f, cljs.core.chunk_rest.call(null, s__67488)))
      }else {
        var x__67495 = f.call(null, cljs.core.first.call(null, s__67488));
        if(x__67495 == null) {
          return keep.call(null, f, cljs.core.rest.call(null, s__67488))
        }else {
          return cljs.core.cons.call(null, x__67495, keep.call(null, f, cljs.core.rest.call(null, s__67488)))
        }
      }
    }else {
      return null
    }
  }, null)
};
cljs.core.keep_indexed = function keep_indexed(f, coll) {
  var keepi__67522 = function keepi(idx, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____67532 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____67532) {
        var s__67533 = temp__3974__auto____67532;
        if(cljs.core.chunked_seq_QMARK_.call(null, s__67533)) {
          var c__67534 = cljs.core.chunk_first.call(null, s__67533);
          var size__67535 = cljs.core.count.call(null, c__67534);
          var b__67536 = cljs.core.chunk_buffer.call(null, size__67535);
          var n__2561__auto____67537 = size__67535;
          var i__67538 = 0;
          while(true) {
            if(i__67538 < n__2561__auto____67537) {
              var x__67539 = f.call(null, idx + i__67538, cljs.core._nth.call(null, c__67534, i__67538));
              if(x__67539 == null) {
              }else {
                cljs.core.chunk_append.call(null, b__67536, x__67539)
              }
              var G__67541 = i__67538 + 1;
              i__67538 = G__67541;
              continue
            }else {
            }
            break
          }
          return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__67536), keepi.call(null, idx + size__67535, cljs.core.chunk_rest.call(null, s__67533)))
        }else {
          var x__67540 = f.call(null, idx, cljs.core.first.call(null, s__67533));
          if(x__67540 == null) {
            return keepi.call(null, idx + 1, cljs.core.rest.call(null, s__67533))
          }else {
            return cljs.core.cons.call(null, x__67540, keepi.call(null, idx + 1, cljs.core.rest.call(null, s__67533)))
          }
        }
      }else {
        return null
      }
    }, null)
  };
  return keepi__67522.call(null, 0, coll)
};
cljs.core.every_pred = function() {
  var every_pred = null;
  var every_pred__1 = function(p) {
    return function() {
      var ep1 = null;
      var ep1__0 = function() {
        return true
      };
      var ep1__1 = function(x) {
        return cljs.core.boolean$.call(null, p.call(null, x))
      };
      var ep1__2 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____67627 = p.call(null, x);
          if(cljs.core.truth_(and__3822__auto____67627)) {
            return p.call(null, y)
          }else {
            return and__3822__auto____67627
          }
        }())
      };
      var ep1__3 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____67628 = p.call(null, x);
          if(cljs.core.truth_(and__3822__auto____67628)) {
            var and__3822__auto____67629 = p.call(null, y);
            if(cljs.core.truth_(and__3822__auto____67629)) {
              return p.call(null, z)
            }else {
              return and__3822__auto____67629
            }
          }else {
            return and__3822__auto____67628
          }
        }())
      };
      var ep1__4 = function() {
        var G__67698__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3822__auto____67630 = ep1.call(null, x, y, z);
            if(cljs.core.truth_(and__3822__auto____67630)) {
              return cljs.core.every_QMARK_.call(null, p, args)
            }else {
              return and__3822__auto____67630
            }
          }())
        };
        var G__67698 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__67698__delegate.call(this, x, y, z, args)
        };
        G__67698.cljs$lang$maxFixedArity = 3;
        G__67698.cljs$lang$applyTo = function(arglist__67699) {
          var x = cljs.core.first(arglist__67699);
          var y = cljs.core.first(cljs.core.next(arglist__67699));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__67699)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__67699)));
          return G__67698__delegate(x, y, z, args)
        };
        G__67698.cljs$lang$arity$variadic = G__67698__delegate;
        return G__67698
      }();
      ep1 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return ep1__0.call(this);
          case 1:
            return ep1__1.call(this, x);
          case 2:
            return ep1__2.call(this, x, y);
          case 3:
            return ep1__3.call(this, x, y, z);
          default:
            return ep1__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      ep1.cljs$lang$maxFixedArity = 3;
      ep1.cljs$lang$applyTo = ep1__4.cljs$lang$applyTo;
      ep1.cljs$lang$arity$0 = ep1__0;
      ep1.cljs$lang$arity$1 = ep1__1;
      ep1.cljs$lang$arity$2 = ep1__2;
      ep1.cljs$lang$arity$3 = ep1__3;
      ep1.cljs$lang$arity$variadic = ep1__4.cljs$lang$arity$variadic;
      return ep1
    }()
  };
  var every_pred__2 = function(p1, p2) {
    return function() {
      var ep2 = null;
      var ep2__0 = function() {
        return true
      };
      var ep2__1 = function(x) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____67642 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____67642)) {
            return p2.call(null, x)
          }else {
            return and__3822__auto____67642
          }
        }())
      };
      var ep2__2 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____67643 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____67643)) {
            var and__3822__auto____67644 = p1.call(null, y);
            if(cljs.core.truth_(and__3822__auto____67644)) {
              var and__3822__auto____67645 = p2.call(null, x);
              if(cljs.core.truth_(and__3822__auto____67645)) {
                return p2.call(null, y)
              }else {
                return and__3822__auto____67645
              }
            }else {
              return and__3822__auto____67644
            }
          }else {
            return and__3822__auto____67643
          }
        }())
      };
      var ep2__3 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____67646 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____67646)) {
            var and__3822__auto____67647 = p1.call(null, y);
            if(cljs.core.truth_(and__3822__auto____67647)) {
              var and__3822__auto____67648 = p1.call(null, z);
              if(cljs.core.truth_(and__3822__auto____67648)) {
                var and__3822__auto____67649 = p2.call(null, x);
                if(cljs.core.truth_(and__3822__auto____67649)) {
                  var and__3822__auto____67650 = p2.call(null, y);
                  if(cljs.core.truth_(and__3822__auto____67650)) {
                    return p2.call(null, z)
                  }else {
                    return and__3822__auto____67650
                  }
                }else {
                  return and__3822__auto____67649
                }
              }else {
                return and__3822__auto____67648
              }
            }else {
              return and__3822__auto____67647
            }
          }else {
            return and__3822__auto____67646
          }
        }())
      };
      var ep2__4 = function() {
        var G__67700__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3822__auto____67651 = ep2.call(null, x, y, z);
            if(cljs.core.truth_(and__3822__auto____67651)) {
              return cljs.core.every_QMARK_.call(null, function(p1__67497_SHARP_) {
                var and__3822__auto____67652 = p1.call(null, p1__67497_SHARP_);
                if(cljs.core.truth_(and__3822__auto____67652)) {
                  return p2.call(null, p1__67497_SHARP_)
                }else {
                  return and__3822__auto____67652
                }
              }, args)
            }else {
              return and__3822__auto____67651
            }
          }())
        };
        var G__67700 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__67700__delegate.call(this, x, y, z, args)
        };
        G__67700.cljs$lang$maxFixedArity = 3;
        G__67700.cljs$lang$applyTo = function(arglist__67701) {
          var x = cljs.core.first(arglist__67701);
          var y = cljs.core.first(cljs.core.next(arglist__67701));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__67701)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__67701)));
          return G__67700__delegate(x, y, z, args)
        };
        G__67700.cljs$lang$arity$variadic = G__67700__delegate;
        return G__67700
      }();
      ep2 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return ep2__0.call(this);
          case 1:
            return ep2__1.call(this, x);
          case 2:
            return ep2__2.call(this, x, y);
          case 3:
            return ep2__3.call(this, x, y, z);
          default:
            return ep2__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      ep2.cljs$lang$maxFixedArity = 3;
      ep2.cljs$lang$applyTo = ep2__4.cljs$lang$applyTo;
      ep2.cljs$lang$arity$0 = ep2__0;
      ep2.cljs$lang$arity$1 = ep2__1;
      ep2.cljs$lang$arity$2 = ep2__2;
      ep2.cljs$lang$arity$3 = ep2__3;
      ep2.cljs$lang$arity$variadic = ep2__4.cljs$lang$arity$variadic;
      return ep2
    }()
  };
  var every_pred__3 = function(p1, p2, p3) {
    return function() {
      var ep3 = null;
      var ep3__0 = function() {
        return true
      };
      var ep3__1 = function(x) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____67671 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____67671)) {
            var and__3822__auto____67672 = p2.call(null, x);
            if(cljs.core.truth_(and__3822__auto____67672)) {
              return p3.call(null, x)
            }else {
              return and__3822__auto____67672
            }
          }else {
            return and__3822__auto____67671
          }
        }())
      };
      var ep3__2 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____67673 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____67673)) {
            var and__3822__auto____67674 = p2.call(null, x);
            if(cljs.core.truth_(and__3822__auto____67674)) {
              var and__3822__auto____67675 = p3.call(null, x);
              if(cljs.core.truth_(and__3822__auto____67675)) {
                var and__3822__auto____67676 = p1.call(null, y);
                if(cljs.core.truth_(and__3822__auto____67676)) {
                  var and__3822__auto____67677 = p2.call(null, y);
                  if(cljs.core.truth_(and__3822__auto____67677)) {
                    return p3.call(null, y)
                  }else {
                    return and__3822__auto____67677
                  }
                }else {
                  return and__3822__auto____67676
                }
              }else {
                return and__3822__auto____67675
              }
            }else {
              return and__3822__auto____67674
            }
          }else {
            return and__3822__auto____67673
          }
        }())
      };
      var ep3__3 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____67678 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____67678)) {
            var and__3822__auto____67679 = p2.call(null, x);
            if(cljs.core.truth_(and__3822__auto____67679)) {
              var and__3822__auto____67680 = p3.call(null, x);
              if(cljs.core.truth_(and__3822__auto____67680)) {
                var and__3822__auto____67681 = p1.call(null, y);
                if(cljs.core.truth_(and__3822__auto____67681)) {
                  var and__3822__auto____67682 = p2.call(null, y);
                  if(cljs.core.truth_(and__3822__auto____67682)) {
                    var and__3822__auto____67683 = p3.call(null, y);
                    if(cljs.core.truth_(and__3822__auto____67683)) {
                      var and__3822__auto____67684 = p1.call(null, z);
                      if(cljs.core.truth_(and__3822__auto____67684)) {
                        var and__3822__auto____67685 = p2.call(null, z);
                        if(cljs.core.truth_(and__3822__auto____67685)) {
                          return p3.call(null, z)
                        }else {
                          return and__3822__auto____67685
                        }
                      }else {
                        return and__3822__auto____67684
                      }
                    }else {
                      return and__3822__auto____67683
                    }
                  }else {
                    return and__3822__auto____67682
                  }
                }else {
                  return and__3822__auto____67681
                }
              }else {
                return and__3822__auto____67680
              }
            }else {
              return and__3822__auto____67679
            }
          }else {
            return and__3822__auto____67678
          }
        }())
      };
      var ep3__4 = function() {
        var G__67702__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3822__auto____67686 = ep3.call(null, x, y, z);
            if(cljs.core.truth_(and__3822__auto____67686)) {
              return cljs.core.every_QMARK_.call(null, function(p1__67498_SHARP_) {
                var and__3822__auto____67687 = p1.call(null, p1__67498_SHARP_);
                if(cljs.core.truth_(and__3822__auto____67687)) {
                  var and__3822__auto____67688 = p2.call(null, p1__67498_SHARP_);
                  if(cljs.core.truth_(and__3822__auto____67688)) {
                    return p3.call(null, p1__67498_SHARP_)
                  }else {
                    return and__3822__auto____67688
                  }
                }else {
                  return and__3822__auto____67687
                }
              }, args)
            }else {
              return and__3822__auto____67686
            }
          }())
        };
        var G__67702 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__67702__delegate.call(this, x, y, z, args)
        };
        G__67702.cljs$lang$maxFixedArity = 3;
        G__67702.cljs$lang$applyTo = function(arglist__67703) {
          var x = cljs.core.first(arglist__67703);
          var y = cljs.core.first(cljs.core.next(arglist__67703));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__67703)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__67703)));
          return G__67702__delegate(x, y, z, args)
        };
        G__67702.cljs$lang$arity$variadic = G__67702__delegate;
        return G__67702
      }();
      ep3 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return ep3__0.call(this);
          case 1:
            return ep3__1.call(this, x);
          case 2:
            return ep3__2.call(this, x, y);
          case 3:
            return ep3__3.call(this, x, y, z);
          default:
            return ep3__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      ep3.cljs$lang$maxFixedArity = 3;
      ep3.cljs$lang$applyTo = ep3__4.cljs$lang$applyTo;
      ep3.cljs$lang$arity$0 = ep3__0;
      ep3.cljs$lang$arity$1 = ep3__1;
      ep3.cljs$lang$arity$2 = ep3__2;
      ep3.cljs$lang$arity$3 = ep3__3;
      ep3.cljs$lang$arity$variadic = ep3__4.cljs$lang$arity$variadic;
      return ep3
    }()
  };
  var every_pred__4 = function() {
    var G__67704__delegate = function(p1, p2, p3, ps) {
      var ps__67689 = cljs.core.list_STAR_.call(null, p1, p2, p3, ps);
      return function() {
        var epn = null;
        var epn__0 = function() {
          return true
        };
        var epn__1 = function(x) {
          return cljs.core.every_QMARK_.call(null, function(p1__67499_SHARP_) {
            return p1__67499_SHARP_.call(null, x)
          }, ps__67689)
        };
        var epn__2 = function(x, y) {
          return cljs.core.every_QMARK_.call(null, function(p1__67500_SHARP_) {
            var and__3822__auto____67694 = p1__67500_SHARP_.call(null, x);
            if(cljs.core.truth_(and__3822__auto____67694)) {
              return p1__67500_SHARP_.call(null, y)
            }else {
              return and__3822__auto____67694
            }
          }, ps__67689)
        };
        var epn__3 = function(x, y, z) {
          return cljs.core.every_QMARK_.call(null, function(p1__67501_SHARP_) {
            var and__3822__auto____67695 = p1__67501_SHARP_.call(null, x);
            if(cljs.core.truth_(and__3822__auto____67695)) {
              var and__3822__auto____67696 = p1__67501_SHARP_.call(null, y);
              if(cljs.core.truth_(and__3822__auto____67696)) {
                return p1__67501_SHARP_.call(null, z)
              }else {
                return and__3822__auto____67696
              }
            }else {
              return and__3822__auto____67695
            }
          }, ps__67689)
        };
        var epn__4 = function() {
          var G__67705__delegate = function(x, y, z, args) {
            return cljs.core.boolean$.call(null, function() {
              var and__3822__auto____67697 = epn.call(null, x, y, z);
              if(cljs.core.truth_(and__3822__auto____67697)) {
                return cljs.core.every_QMARK_.call(null, function(p1__67502_SHARP_) {
                  return cljs.core.every_QMARK_.call(null, p1__67502_SHARP_, args)
                }, ps__67689)
              }else {
                return and__3822__auto____67697
              }
            }())
          };
          var G__67705 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__67705__delegate.call(this, x, y, z, args)
          };
          G__67705.cljs$lang$maxFixedArity = 3;
          G__67705.cljs$lang$applyTo = function(arglist__67706) {
            var x = cljs.core.first(arglist__67706);
            var y = cljs.core.first(cljs.core.next(arglist__67706));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__67706)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__67706)));
            return G__67705__delegate(x, y, z, args)
          };
          G__67705.cljs$lang$arity$variadic = G__67705__delegate;
          return G__67705
        }();
        epn = function(x, y, z, var_args) {
          var args = var_args;
          switch(arguments.length) {
            case 0:
              return epn__0.call(this);
            case 1:
              return epn__1.call(this, x);
            case 2:
              return epn__2.call(this, x, y);
            case 3:
              return epn__3.call(this, x, y, z);
            default:
              return epn__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
          }
          throw"Invalid arity: " + arguments.length;
        };
        epn.cljs$lang$maxFixedArity = 3;
        epn.cljs$lang$applyTo = epn__4.cljs$lang$applyTo;
        epn.cljs$lang$arity$0 = epn__0;
        epn.cljs$lang$arity$1 = epn__1;
        epn.cljs$lang$arity$2 = epn__2;
        epn.cljs$lang$arity$3 = epn__3;
        epn.cljs$lang$arity$variadic = epn__4.cljs$lang$arity$variadic;
        return epn
      }()
    };
    var G__67704 = function(p1, p2, p3, var_args) {
      var ps = null;
      if(goog.isDef(var_args)) {
        ps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__67704__delegate.call(this, p1, p2, p3, ps)
    };
    G__67704.cljs$lang$maxFixedArity = 3;
    G__67704.cljs$lang$applyTo = function(arglist__67707) {
      var p1 = cljs.core.first(arglist__67707);
      var p2 = cljs.core.first(cljs.core.next(arglist__67707));
      var p3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__67707)));
      var ps = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__67707)));
      return G__67704__delegate(p1, p2, p3, ps)
    };
    G__67704.cljs$lang$arity$variadic = G__67704__delegate;
    return G__67704
  }();
  every_pred = function(p1, p2, p3, var_args) {
    var ps = var_args;
    switch(arguments.length) {
      case 1:
        return every_pred__1.call(this, p1);
      case 2:
        return every_pred__2.call(this, p1, p2);
      case 3:
        return every_pred__3.call(this, p1, p2, p3);
      default:
        return every_pred__4.cljs$lang$arity$variadic(p1, p2, p3, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  every_pred.cljs$lang$maxFixedArity = 3;
  every_pred.cljs$lang$applyTo = every_pred__4.cljs$lang$applyTo;
  every_pred.cljs$lang$arity$1 = every_pred__1;
  every_pred.cljs$lang$arity$2 = every_pred__2;
  every_pred.cljs$lang$arity$3 = every_pred__3;
  every_pred.cljs$lang$arity$variadic = every_pred__4.cljs$lang$arity$variadic;
  return every_pred
}();
cljs.core.some_fn = function() {
  var some_fn = null;
  var some_fn__1 = function(p) {
    return function() {
      var sp1 = null;
      var sp1__0 = function() {
        return null
      };
      var sp1__1 = function(x) {
        return p.call(null, x)
      };
      var sp1__2 = function(x, y) {
        var or__3824__auto____67788 = p.call(null, x);
        if(cljs.core.truth_(or__3824__auto____67788)) {
          return or__3824__auto____67788
        }else {
          return p.call(null, y)
        }
      };
      var sp1__3 = function(x, y, z) {
        var or__3824__auto____67789 = p.call(null, x);
        if(cljs.core.truth_(or__3824__auto____67789)) {
          return or__3824__auto____67789
        }else {
          var or__3824__auto____67790 = p.call(null, y);
          if(cljs.core.truth_(or__3824__auto____67790)) {
            return or__3824__auto____67790
          }else {
            return p.call(null, z)
          }
        }
      };
      var sp1__4 = function() {
        var G__67859__delegate = function(x, y, z, args) {
          var or__3824__auto____67791 = sp1.call(null, x, y, z);
          if(cljs.core.truth_(or__3824__auto____67791)) {
            return or__3824__auto____67791
          }else {
            return cljs.core.some.call(null, p, args)
          }
        };
        var G__67859 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__67859__delegate.call(this, x, y, z, args)
        };
        G__67859.cljs$lang$maxFixedArity = 3;
        G__67859.cljs$lang$applyTo = function(arglist__67860) {
          var x = cljs.core.first(arglist__67860);
          var y = cljs.core.first(cljs.core.next(arglist__67860));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__67860)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__67860)));
          return G__67859__delegate(x, y, z, args)
        };
        G__67859.cljs$lang$arity$variadic = G__67859__delegate;
        return G__67859
      }();
      sp1 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return sp1__0.call(this);
          case 1:
            return sp1__1.call(this, x);
          case 2:
            return sp1__2.call(this, x, y);
          case 3:
            return sp1__3.call(this, x, y, z);
          default:
            return sp1__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      sp1.cljs$lang$maxFixedArity = 3;
      sp1.cljs$lang$applyTo = sp1__4.cljs$lang$applyTo;
      sp1.cljs$lang$arity$0 = sp1__0;
      sp1.cljs$lang$arity$1 = sp1__1;
      sp1.cljs$lang$arity$2 = sp1__2;
      sp1.cljs$lang$arity$3 = sp1__3;
      sp1.cljs$lang$arity$variadic = sp1__4.cljs$lang$arity$variadic;
      return sp1
    }()
  };
  var some_fn__2 = function(p1, p2) {
    return function() {
      var sp2 = null;
      var sp2__0 = function() {
        return null
      };
      var sp2__1 = function(x) {
        var or__3824__auto____67803 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____67803)) {
          return or__3824__auto____67803
        }else {
          return p2.call(null, x)
        }
      };
      var sp2__2 = function(x, y) {
        var or__3824__auto____67804 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____67804)) {
          return or__3824__auto____67804
        }else {
          var or__3824__auto____67805 = p1.call(null, y);
          if(cljs.core.truth_(or__3824__auto____67805)) {
            return or__3824__auto____67805
          }else {
            var or__3824__auto____67806 = p2.call(null, x);
            if(cljs.core.truth_(or__3824__auto____67806)) {
              return or__3824__auto____67806
            }else {
              return p2.call(null, y)
            }
          }
        }
      };
      var sp2__3 = function(x, y, z) {
        var or__3824__auto____67807 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____67807)) {
          return or__3824__auto____67807
        }else {
          var or__3824__auto____67808 = p1.call(null, y);
          if(cljs.core.truth_(or__3824__auto____67808)) {
            return or__3824__auto____67808
          }else {
            var or__3824__auto____67809 = p1.call(null, z);
            if(cljs.core.truth_(or__3824__auto____67809)) {
              return or__3824__auto____67809
            }else {
              var or__3824__auto____67810 = p2.call(null, x);
              if(cljs.core.truth_(or__3824__auto____67810)) {
                return or__3824__auto____67810
              }else {
                var or__3824__auto____67811 = p2.call(null, y);
                if(cljs.core.truth_(or__3824__auto____67811)) {
                  return or__3824__auto____67811
                }else {
                  return p2.call(null, z)
                }
              }
            }
          }
        }
      };
      var sp2__4 = function() {
        var G__67861__delegate = function(x, y, z, args) {
          var or__3824__auto____67812 = sp2.call(null, x, y, z);
          if(cljs.core.truth_(or__3824__auto____67812)) {
            return or__3824__auto____67812
          }else {
            return cljs.core.some.call(null, function(p1__67542_SHARP_) {
              var or__3824__auto____67813 = p1.call(null, p1__67542_SHARP_);
              if(cljs.core.truth_(or__3824__auto____67813)) {
                return or__3824__auto____67813
              }else {
                return p2.call(null, p1__67542_SHARP_)
              }
            }, args)
          }
        };
        var G__67861 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__67861__delegate.call(this, x, y, z, args)
        };
        G__67861.cljs$lang$maxFixedArity = 3;
        G__67861.cljs$lang$applyTo = function(arglist__67862) {
          var x = cljs.core.first(arglist__67862);
          var y = cljs.core.first(cljs.core.next(arglist__67862));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__67862)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__67862)));
          return G__67861__delegate(x, y, z, args)
        };
        G__67861.cljs$lang$arity$variadic = G__67861__delegate;
        return G__67861
      }();
      sp2 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return sp2__0.call(this);
          case 1:
            return sp2__1.call(this, x);
          case 2:
            return sp2__2.call(this, x, y);
          case 3:
            return sp2__3.call(this, x, y, z);
          default:
            return sp2__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      sp2.cljs$lang$maxFixedArity = 3;
      sp2.cljs$lang$applyTo = sp2__4.cljs$lang$applyTo;
      sp2.cljs$lang$arity$0 = sp2__0;
      sp2.cljs$lang$arity$1 = sp2__1;
      sp2.cljs$lang$arity$2 = sp2__2;
      sp2.cljs$lang$arity$3 = sp2__3;
      sp2.cljs$lang$arity$variadic = sp2__4.cljs$lang$arity$variadic;
      return sp2
    }()
  };
  var some_fn__3 = function(p1, p2, p3) {
    return function() {
      var sp3 = null;
      var sp3__0 = function() {
        return null
      };
      var sp3__1 = function(x) {
        var or__3824__auto____67832 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____67832)) {
          return or__3824__auto____67832
        }else {
          var or__3824__auto____67833 = p2.call(null, x);
          if(cljs.core.truth_(or__3824__auto____67833)) {
            return or__3824__auto____67833
          }else {
            return p3.call(null, x)
          }
        }
      };
      var sp3__2 = function(x, y) {
        var or__3824__auto____67834 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____67834)) {
          return or__3824__auto____67834
        }else {
          var or__3824__auto____67835 = p2.call(null, x);
          if(cljs.core.truth_(or__3824__auto____67835)) {
            return or__3824__auto____67835
          }else {
            var or__3824__auto____67836 = p3.call(null, x);
            if(cljs.core.truth_(or__3824__auto____67836)) {
              return or__3824__auto____67836
            }else {
              var or__3824__auto____67837 = p1.call(null, y);
              if(cljs.core.truth_(or__3824__auto____67837)) {
                return or__3824__auto____67837
              }else {
                var or__3824__auto____67838 = p2.call(null, y);
                if(cljs.core.truth_(or__3824__auto____67838)) {
                  return or__3824__auto____67838
                }else {
                  return p3.call(null, y)
                }
              }
            }
          }
        }
      };
      var sp3__3 = function(x, y, z) {
        var or__3824__auto____67839 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____67839)) {
          return or__3824__auto____67839
        }else {
          var or__3824__auto____67840 = p2.call(null, x);
          if(cljs.core.truth_(or__3824__auto____67840)) {
            return or__3824__auto____67840
          }else {
            var or__3824__auto____67841 = p3.call(null, x);
            if(cljs.core.truth_(or__3824__auto____67841)) {
              return or__3824__auto____67841
            }else {
              var or__3824__auto____67842 = p1.call(null, y);
              if(cljs.core.truth_(or__3824__auto____67842)) {
                return or__3824__auto____67842
              }else {
                var or__3824__auto____67843 = p2.call(null, y);
                if(cljs.core.truth_(or__3824__auto____67843)) {
                  return or__3824__auto____67843
                }else {
                  var or__3824__auto____67844 = p3.call(null, y);
                  if(cljs.core.truth_(or__3824__auto____67844)) {
                    return or__3824__auto____67844
                  }else {
                    var or__3824__auto____67845 = p1.call(null, z);
                    if(cljs.core.truth_(or__3824__auto____67845)) {
                      return or__3824__auto____67845
                    }else {
                      var or__3824__auto____67846 = p2.call(null, z);
                      if(cljs.core.truth_(or__3824__auto____67846)) {
                        return or__3824__auto____67846
                      }else {
                        return p3.call(null, z)
                      }
                    }
                  }
                }
              }
            }
          }
        }
      };
      var sp3__4 = function() {
        var G__67863__delegate = function(x, y, z, args) {
          var or__3824__auto____67847 = sp3.call(null, x, y, z);
          if(cljs.core.truth_(or__3824__auto____67847)) {
            return or__3824__auto____67847
          }else {
            return cljs.core.some.call(null, function(p1__67543_SHARP_) {
              var or__3824__auto____67848 = p1.call(null, p1__67543_SHARP_);
              if(cljs.core.truth_(or__3824__auto____67848)) {
                return or__3824__auto____67848
              }else {
                var or__3824__auto____67849 = p2.call(null, p1__67543_SHARP_);
                if(cljs.core.truth_(or__3824__auto____67849)) {
                  return or__3824__auto____67849
                }else {
                  return p3.call(null, p1__67543_SHARP_)
                }
              }
            }, args)
          }
        };
        var G__67863 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__67863__delegate.call(this, x, y, z, args)
        };
        G__67863.cljs$lang$maxFixedArity = 3;
        G__67863.cljs$lang$applyTo = function(arglist__67864) {
          var x = cljs.core.first(arglist__67864);
          var y = cljs.core.first(cljs.core.next(arglist__67864));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__67864)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__67864)));
          return G__67863__delegate(x, y, z, args)
        };
        G__67863.cljs$lang$arity$variadic = G__67863__delegate;
        return G__67863
      }();
      sp3 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return sp3__0.call(this);
          case 1:
            return sp3__1.call(this, x);
          case 2:
            return sp3__2.call(this, x, y);
          case 3:
            return sp3__3.call(this, x, y, z);
          default:
            return sp3__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      sp3.cljs$lang$maxFixedArity = 3;
      sp3.cljs$lang$applyTo = sp3__4.cljs$lang$applyTo;
      sp3.cljs$lang$arity$0 = sp3__0;
      sp3.cljs$lang$arity$1 = sp3__1;
      sp3.cljs$lang$arity$2 = sp3__2;
      sp3.cljs$lang$arity$3 = sp3__3;
      sp3.cljs$lang$arity$variadic = sp3__4.cljs$lang$arity$variadic;
      return sp3
    }()
  };
  var some_fn__4 = function() {
    var G__67865__delegate = function(p1, p2, p3, ps) {
      var ps__67850 = cljs.core.list_STAR_.call(null, p1, p2, p3, ps);
      return function() {
        var spn = null;
        var spn__0 = function() {
          return null
        };
        var spn__1 = function(x) {
          return cljs.core.some.call(null, function(p1__67544_SHARP_) {
            return p1__67544_SHARP_.call(null, x)
          }, ps__67850)
        };
        var spn__2 = function(x, y) {
          return cljs.core.some.call(null, function(p1__67545_SHARP_) {
            var or__3824__auto____67855 = p1__67545_SHARP_.call(null, x);
            if(cljs.core.truth_(or__3824__auto____67855)) {
              return or__3824__auto____67855
            }else {
              return p1__67545_SHARP_.call(null, y)
            }
          }, ps__67850)
        };
        var spn__3 = function(x, y, z) {
          return cljs.core.some.call(null, function(p1__67546_SHARP_) {
            var or__3824__auto____67856 = p1__67546_SHARP_.call(null, x);
            if(cljs.core.truth_(or__3824__auto____67856)) {
              return or__3824__auto____67856
            }else {
              var or__3824__auto____67857 = p1__67546_SHARP_.call(null, y);
              if(cljs.core.truth_(or__3824__auto____67857)) {
                return or__3824__auto____67857
              }else {
                return p1__67546_SHARP_.call(null, z)
              }
            }
          }, ps__67850)
        };
        var spn__4 = function() {
          var G__67866__delegate = function(x, y, z, args) {
            var or__3824__auto____67858 = spn.call(null, x, y, z);
            if(cljs.core.truth_(or__3824__auto____67858)) {
              return or__3824__auto____67858
            }else {
              return cljs.core.some.call(null, function(p1__67547_SHARP_) {
                return cljs.core.some.call(null, p1__67547_SHARP_, args)
              }, ps__67850)
            }
          };
          var G__67866 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__67866__delegate.call(this, x, y, z, args)
          };
          G__67866.cljs$lang$maxFixedArity = 3;
          G__67866.cljs$lang$applyTo = function(arglist__67867) {
            var x = cljs.core.first(arglist__67867);
            var y = cljs.core.first(cljs.core.next(arglist__67867));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__67867)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__67867)));
            return G__67866__delegate(x, y, z, args)
          };
          G__67866.cljs$lang$arity$variadic = G__67866__delegate;
          return G__67866
        }();
        spn = function(x, y, z, var_args) {
          var args = var_args;
          switch(arguments.length) {
            case 0:
              return spn__0.call(this);
            case 1:
              return spn__1.call(this, x);
            case 2:
              return spn__2.call(this, x, y);
            case 3:
              return spn__3.call(this, x, y, z);
            default:
              return spn__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
          }
          throw"Invalid arity: " + arguments.length;
        };
        spn.cljs$lang$maxFixedArity = 3;
        spn.cljs$lang$applyTo = spn__4.cljs$lang$applyTo;
        spn.cljs$lang$arity$0 = spn__0;
        spn.cljs$lang$arity$1 = spn__1;
        spn.cljs$lang$arity$2 = spn__2;
        spn.cljs$lang$arity$3 = spn__3;
        spn.cljs$lang$arity$variadic = spn__4.cljs$lang$arity$variadic;
        return spn
      }()
    };
    var G__67865 = function(p1, p2, p3, var_args) {
      var ps = null;
      if(goog.isDef(var_args)) {
        ps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__67865__delegate.call(this, p1, p2, p3, ps)
    };
    G__67865.cljs$lang$maxFixedArity = 3;
    G__67865.cljs$lang$applyTo = function(arglist__67868) {
      var p1 = cljs.core.first(arglist__67868);
      var p2 = cljs.core.first(cljs.core.next(arglist__67868));
      var p3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__67868)));
      var ps = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__67868)));
      return G__67865__delegate(p1, p2, p3, ps)
    };
    G__67865.cljs$lang$arity$variadic = G__67865__delegate;
    return G__67865
  }();
  some_fn = function(p1, p2, p3, var_args) {
    var ps = var_args;
    switch(arguments.length) {
      case 1:
        return some_fn__1.call(this, p1);
      case 2:
        return some_fn__2.call(this, p1, p2);
      case 3:
        return some_fn__3.call(this, p1, p2, p3);
      default:
        return some_fn__4.cljs$lang$arity$variadic(p1, p2, p3, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  some_fn.cljs$lang$maxFixedArity = 3;
  some_fn.cljs$lang$applyTo = some_fn__4.cljs$lang$applyTo;
  some_fn.cljs$lang$arity$1 = some_fn__1;
  some_fn.cljs$lang$arity$2 = some_fn__2;
  some_fn.cljs$lang$arity$3 = some_fn__3;
  some_fn.cljs$lang$arity$variadic = some_fn__4.cljs$lang$arity$variadic;
  return some_fn
}();
cljs.core.map = function() {
  var map = null;
  var map__2 = function(f, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____67887 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____67887) {
        var s__67888 = temp__3974__auto____67887;
        if(cljs.core.chunked_seq_QMARK_.call(null, s__67888)) {
          var c__67889 = cljs.core.chunk_first.call(null, s__67888);
          var size__67890 = cljs.core.count.call(null, c__67889);
          var b__67891 = cljs.core.chunk_buffer.call(null, size__67890);
          var n__2561__auto____67892 = size__67890;
          var i__67893 = 0;
          while(true) {
            if(i__67893 < n__2561__auto____67892) {
              cljs.core.chunk_append.call(null, b__67891, f.call(null, cljs.core._nth.call(null, c__67889, i__67893)));
              var G__67905 = i__67893 + 1;
              i__67893 = G__67905;
              continue
            }else {
            }
            break
          }
          return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__67891), map.call(null, f, cljs.core.chunk_rest.call(null, s__67888)))
        }else {
          return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s__67888)), map.call(null, f, cljs.core.rest.call(null, s__67888)))
        }
      }else {
        return null
      }
    }, null)
  };
  var map__3 = function(f, c1, c2) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1__67894 = cljs.core.seq.call(null, c1);
      var s2__67895 = cljs.core.seq.call(null, c2);
      if(function() {
        var and__3822__auto____67896 = s1__67894;
        if(and__3822__auto____67896) {
          return s2__67895
        }else {
          return and__3822__auto____67896
        }
      }()) {
        return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s1__67894), cljs.core.first.call(null, s2__67895)), map.call(null, f, cljs.core.rest.call(null, s1__67894), cljs.core.rest.call(null, s2__67895)))
      }else {
        return null
      }
    }, null)
  };
  var map__4 = function(f, c1, c2, c3) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1__67897 = cljs.core.seq.call(null, c1);
      var s2__67898 = cljs.core.seq.call(null, c2);
      var s3__67899 = cljs.core.seq.call(null, c3);
      if(function() {
        var and__3822__auto____67900 = s1__67897;
        if(and__3822__auto____67900) {
          var and__3822__auto____67901 = s2__67898;
          if(and__3822__auto____67901) {
            return s3__67899
          }else {
            return and__3822__auto____67901
          }
        }else {
          return and__3822__auto____67900
        }
      }()) {
        return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s1__67897), cljs.core.first.call(null, s2__67898), cljs.core.first.call(null, s3__67899)), map.call(null, f, cljs.core.rest.call(null, s1__67897), cljs.core.rest.call(null, s2__67898), cljs.core.rest.call(null, s3__67899)))
      }else {
        return null
      }
    }, null)
  };
  var map__5 = function() {
    var G__67906__delegate = function(f, c1, c2, c3, colls) {
      var step__67904 = function step(cs) {
        return new cljs.core.LazySeq(null, false, function() {
          var ss__67903 = map.call(null, cljs.core.seq, cs);
          if(cljs.core.every_QMARK_.call(null, cljs.core.identity, ss__67903)) {
            return cljs.core.cons.call(null, map.call(null, cljs.core.first, ss__67903), step.call(null, map.call(null, cljs.core.rest, ss__67903)))
          }else {
            return null
          }
        }, null)
      };
      return map.call(null, function(p1__67708_SHARP_) {
        return cljs.core.apply.call(null, f, p1__67708_SHARP_)
      }, step__67904.call(null, cljs.core.conj.call(null, colls, c3, c2, c1)))
    };
    var G__67906 = function(f, c1, c2, c3, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__67906__delegate.call(this, f, c1, c2, c3, colls)
    };
    G__67906.cljs$lang$maxFixedArity = 4;
    G__67906.cljs$lang$applyTo = function(arglist__67907) {
      var f = cljs.core.first(arglist__67907);
      var c1 = cljs.core.first(cljs.core.next(arglist__67907));
      var c2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__67907)));
      var c3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__67907))));
      var colls = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__67907))));
      return G__67906__delegate(f, c1, c2, c3, colls)
    };
    G__67906.cljs$lang$arity$variadic = G__67906__delegate;
    return G__67906
  }();
  map = function(f, c1, c2, c3, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return map__2.call(this, f, c1);
      case 3:
        return map__3.call(this, f, c1, c2);
      case 4:
        return map__4.call(this, f, c1, c2, c3);
      default:
        return map__5.cljs$lang$arity$variadic(f, c1, c2, c3, cljs.core.array_seq(arguments, 4))
    }
    throw"Invalid arity: " + arguments.length;
  };
  map.cljs$lang$maxFixedArity = 4;
  map.cljs$lang$applyTo = map__5.cljs$lang$applyTo;
  map.cljs$lang$arity$2 = map__2;
  map.cljs$lang$arity$3 = map__3;
  map.cljs$lang$arity$4 = map__4;
  map.cljs$lang$arity$variadic = map__5.cljs$lang$arity$variadic;
  return map
}();
cljs.core.take = function take(n, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    if(n > 0) {
      var temp__3974__auto____67910 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____67910) {
        var s__67911 = temp__3974__auto____67910;
        return cljs.core.cons.call(null, cljs.core.first.call(null, s__67911), take.call(null, n - 1, cljs.core.rest.call(null, s__67911)))
      }else {
        return null
      }
    }else {
      return null
    }
  }, null)
};
cljs.core.drop = function drop(n, coll) {
  var step__67917 = function(n, coll) {
    while(true) {
      var s__67915 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(function() {
        var and__3822__auto____67916 = n > 0;
        if(and__3822__auto____67916) {
          return s__67915
        }else {
          return and__3822__auto____67916
        }
      }())) {
        var G__67918 = n - 1;
        var G__67919 = cljs.core.rest.call(null, s__67915);
        n = G__67918;
        coll = G__67919;
        continue
      }else {
        return s__67915
      }
      break
    }
  };
  return new cljs.core.LazySeq(null, false, function() {
    return step__67917.call(null, n, coll)
  }, null)
};
cljs.core.drop_last = function() {
  var drop_last = null;
  var drop_last__1 = function(s) {
    return drop_last.call(null, 1, s)
  };
  var drop_last__2 = function(n, s) {
    return cljs.core.map.call(null, function(x, _) {
      return x
    }, s, cljs.core.drop.call(null, n, s))
  };
  drop_last = function(n, s) {
    switch(arguments.length) {
      case 1:
        return drop_last__1.call(this, n);
      case 2:
        return drop_last__2.call(this, n, s)
    }
    throw"Invalid arity: " + arguments.length;
  };
  drop_last.cljs$lang$arity$1 = drop_last__1;
  drop_last.cljs$lang$arity$2 = drop_last__2;
  return drop_last
}();
cljs.core.take_last = function take_last(n, coll) {
  var s__67922 = cljs.core.seq.call(null, coll);
  var lead__67923 = cljs.core.seq.call(null, cljs.core.drop.call(null, n, coll));
  while(true) {
    if(lead__67923) {
      var G__67924 = cljs.core.next.call(null, s__67922);
      var G__67925 = cljs.core.next.call(null, lead__67923);
      s__67922 = G__67924;
      lead__67923 = G__67925;
      continue
    }else {
      return s__67922
    }
    break
  }
};
cljs.core.drop_while = function drop_while(pred, coll) {
  var step__67931 = function(pred, coll) {
    while(true) {
      var s__67929 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(function() {
        var and__3822__auto____67930 = s__67929;
        if(and__3822__auto____67930) {
          return pred.call(null, cljs.core.first.call(null, s__67929))
        }else {
          return and__3822__auto____67930
        }
      }())) {
        var G__67932 = pred;
        var G__67933 = cljs.core.rest.call(null, s__67929);
        pred = G__67932;
        coll = G__67933;
        continue
      }else {
        return s__67929
      }
      break
    }
  };
  return new cljs.core.LazySeq(null, false, function() {
    return step__67931.call(null, pred, coll)
  }, null)
};
cljs.core.cycle = function cycle(coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____67936 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____67936) {
      var s__67937 = temp__3974__auto____67936;
      return cljs.core.concat.call(null, s__67937, cycle.call(null, s__67937))
    }else {
      return null
    }
  }, null)
};
cljs.core.split_at = function split_at(n, coll) {
  return cljs.core.PersistentVector.fromArray([cljs.core.take.call(null, n, coll), cljs.core.drop.call(null, n, coll)], true)
};
cljs.core.repeat = function() {
  var repeat = null;
  var repeat__1 = function(x) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, x, repeat.call(null, x))
    }, null)
  };
  var repeat__2 = function(n, x) {
    return cljs.core.take.call(null, n, repeat.call(null, x))
  };
  repeat = function(n, x) {
    switch(arguments.length) {
      case 1:
        return repeat__1.call(this, n);
      case 2:
        return repeat__2.call(this, n, x)
    }
    throw"Invalid arity: " + arguments.length;
  };
  repeat.cljs$lang$arity$1 = repeat__1;
  repeat.cljs$lang$arity$2 = repeat__2;
  return repeat
}();
cljs.core.replicate = function replicate(n, x) {
  return cljs.core.take.call(null, n, cljs.core.repeat.call(null, x))
};
cljs.core.repeatedly = function() {
  var repeatedly = null;
  var repeatedly__1 = function(f) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, f.call(null), repeatedly.call(null, f))
    }, null)
  };
  var repeatedly__2 = function(n, f) {
    return cljs.core.take.call(null, n, repeatedly.call(null, f))
  };
  repeatedly = function(n, f) {
    switch(arguments.length) {
      case 1:
        return repeatedly__1.call(this, n);
      case 2:
        return repeatedly__2.call(this, n, f)
    }
    throw"Invalid arity: " + arguments.length;
  };
  repeatedly.cljs$lang$arity$1 = repeatedly__1;
  repeatedly.cljs$lang$arity$2 = repeatedly__2;
  return repeatedly
}();
cljs.core.iterate = function iterate(f, x) {
  return cljs.core.cons.call(null, x, new cljs.core.LazySeq(null, false, function() {
    return iterate.call(null, f, f.call(null, x))
  }, null))
};
cljs.core.interleave = function() {
  var interleave = null;
  var interleave__2 = function(c1, c2) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1__67942 = cljs.core.seq.call(null, c1);
      var s2__67943 = cljs.core.seq.call(null, c2);
      if(function() {
        var and__3822__auto____67944 = s1__67942;
        if(and__3822__auto____67944) {
          return s2__67943
        }else {
          return and__3822__auto____67944
        }
      }()) {
        return cljs.core.cons.call(null, cljs.core.first.call(null, s1__67942), cljs.core.cons.call(null, cljs.core.first.call(null, s2__67943), interleave.call(null, cljs.core.rest.call(null, s1__67942), cljs.core.rest.call(null, s2__67943))))
      }else {
        return null
      }
    }, null)
  };
  var interleave__3 = function() {
    var G__67946__delegate = function(c1, c2, colls) {
      return new cljs.core.LazySeq(null, false, function() {
        var ss__67945 = cljs.core.map.call(null, cljs.core.seq, cljs.core.conj.call(null, colls, c2, c1));
        if(cljs.core.every_QMARK_.call(null, cljs.core.identity, ss__67945)) {
          return cljs.core.concat.call(null, cljs.core.map.call(null, cljs.core.first, ss__67945), cljs.core.apply.call(null, interleave, cljs.core.map.call(null, cljs.core.rest, ss__67945)))
        }else {
          return null
        }
      }, null)
    };
    var G__67946 = function(c1, c2, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__67946__delegate.call(this, c1, c2, colls)
    };
    G__67946.cljs$lang$maxFixedArity = 2;
    G__67946.cljs$lang$applyTo = function(arglist__67947) {
      var c1 = cljs.core.first(arglist__67947);
      var c2 = cljs.core.first(cljs.core.next(arglist__67947));
      var colls = cljs.core.rest(cljs.core.next(arglist__67947));
      return G__67946__delegate(c1, c2, colls)
    };
    G__67946.cljs$lang$arity$variadic = G__67946__delegate;
    return G__67946
  }();
  interleave = function(c1, c2, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return interleave__2.call(this, c1, c2);
      default:
        return interleave__3.cljs$lang$arity$variadic(c1, c2, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  interleave.cljs$lang$maxFixedArity = 2;
  interleave.cljs$lang$applyTo = interleave__3.cljs$lang$applyTo;
  interleave.cljs$lang$arity$2 = interleave__2;
  interleave.cljs$lang$arity$variadic = interleave__3.cljs$lang$arity$variadic;
  return interleave
}();
cljs.core.interpose = function interpose(sep, coll) {
  return cljs.core.drop.call(null, 1, cljs.core.interleave.call(null, cljs.core.repeat.call(null, sep), coll))
};
cljs.core.flatten1 = function flatten1(colls) {
  var cat__67957 = function cat(coll, colls) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3971__auto____67955 = cljs.core.seq.call(null, coll);
      if(temp__3971__auto____67955) {
        var coll__67956 = temp__3971__auto____67955;
        return cljs.core.cons.call(null, cljs.core.first.call(null, coll__67956), cat.call(null, cljs.core.rest.call(null, coll__67956), colls))
      }else {
        if(cljs.core.seq.call(null, colls)) {
          return cat.call(null, cljs.core.first.call(null, colls), cljs.core.rest.call(null, colls))
        }else {
          return null
        }
      }
    }, null)
  };
  return cat__67957.call(null, null, colls)
};
cljs.core.mapcat = function() {
  var mapcat = null;
  var mapcat__2 = function(f, coll) {
    return cljs.core.flatten1.call(null, cljs.core.map.call(null, f, coll))
  };
  var mapcat__3 = function() {
    var G__67958__delegate = function(f, coll, colls) {
      return cljs.core.flatten1.call(null, cljs.core.apply.call(null, cljs.core.map, f, coll, colls))
    };
    var G__67958 = function(f, coll, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__67958__delegate.call(this, f, coll, colls)
    };
    G__67958.cljs$lang$maxFixedArity = 2;
    G__67958.cljs$lang$applyTo = function(arglist__67959) {
      var f = cljs.core.first(arglist__67959);
      var coll = cljs.core.first(cljs.core.next(arglist__67959));
      var colls = cljs.core.rest(cljs.core.next(arglist__67959));
      return G__67958__delegate(f, coll, colls)
    };
    G__67958.cljs$lang$arity$variadic = G__67958__delegate;
    return G__67958
  }();
  mapcat = function(f, coll, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return mapcat__2.call(this, f, coll);
      default:
        return mapcat__3.cljs$lang$arity$variadic(f, coll, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  mapcat.cljs$lang$maxFixedArity = 2;
  mapcat.cljs$lang$applyTo = mapcat__3.cljs$lang$applyTo;
  mapcat.cljs$lang$arity$2 = mapcat__2;
  mapcat.cljs$lang$arity$variadic = mapcat__3.cljs$lang$arity$variadic;
  return mapcat
}();
cljs.core.filter = function filter(pred, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____67969 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____67969) {
      var s__67970 = temp__3974__auto____67969;
      if(cljs.core.chunked_seq_QMARK_.call(null, s__67970)) {
        var c__67971 = cljs.core.chunk_first.call(null, s__67970);
        var size__67972 = cljs.core.count.call(null, c__67971);
        var b__67973 = cljs.core.chunk_buffer.call(null, size__67972);
        var n__2561__auto____67974 = size__67972;
        var i__67975 = 0;
        while(true) {
          if(i__67975 < n__2561__auto____67974) {
            if(cljs.core.truth_(pred.call(null, cljs.core._nth.call(null, c__67971, i__67975)))) {
              cljs.core.chunk_append.call(null, b__67973, cljs.core._nth.call(null, c__67971, i__67975))
            }else {
            }
            var G__67978 = i__67975 + 1;
            i__67975 = G__67978;
            continue
          }else {
          }
          break
        }
        return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__67973), filter.call(null, pred, cljs.core.chunk_rest.call(null, s__67970)))
      }else {
        var f__67976 = cljs.core.first.call(null, s__67970);
        var r__67977 = cljs.core.rest.call(null, s__67970);
        if(cljs.core.truth_(pred.call(null, f__67976))) {
          return cljs.core.cons.call(null, f__67976, filter.call(null, pred, r__67977))
        }else {
          return filter.call(null, pred, r__67977)
        }
      }
    }else {
      return null
    }
  }, null)
};
cljs.core.remove = function remove(pred, coll) {
  return cljs.core.filter.call(null, cljs.core.complement.call(null, pred), coll)
};
cljs.core.tree_seq = function tree_seq(branch_QMARK_, children, root) {
  var walk__67981 = function walk(node) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, node, cljs.core.truth_(branch_QMARK_.call(null, node)) ? cljs.core.mapcat.call(null, walk, children.call(null, node)) : null)
    }, null)
  };
  return walk__67981.call(null, root)
};
cljs.core.flatten = function flatten(x) {
  return cljs.core.filter.call(null, function(p1__67979_SHARP_) {
    return!cljs.core.sequential_QMARK_.call(null, p1__67979_SHARP_)
  }, cljs.core.rest.call(null, cljs.core.tree_seq.call(null, cljs.core.sequential_QMARK_, cljs.core.seq, x)))
};
cljs.core.into = function into(to, from) {
  if(function() {
    var G__67985__67986 = to;
    if(G__67985__67986) {
      if(function() {
        var or__3824__auto____67987 = G__67985__67986.cljs$lang$protocol_mask$partition1$ & 1;
        if(or__3824__auto____67987) {
          return or__3824__auto____67987
        }else {
          return G__67985__67986.cljs$core$IEditableCollection$
        }
      }()) {
        return true
      }else {
        if(!G__67985__67986.cljs$lang$protocol_mask$partition1$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IEditableCollection, G__67985__67986)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IEditableCollection, G__67985__67986)
    }
  }()) {
    return cljs.core.persistent_BANG_.call(null, cljs.core.reduce.call(null, cljs.core._conj_BANG_, cljs.core.transient$.call(null, to), from))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, to, from)
  }
};
cljs.core.mapv = function() {
  var mapv = null;
  var mapv__2 = function(f, coll) {
    return cljs.core.persistent_BANG_.call(null, cljs.core.reduce.call(null, function(v, o) {
      return cljs.core.conj_BANG_.call(null, v, f.call(null, o))
    }, cljs.core.transient$.call(null, cljs.core.PersistentVector.EMPTY), coll))
  };
  var mapv__3 = function(f, c1, c2) {
    return cljs.core.into.call(null, cljs.core.PersistentVector.EMPTY, cljs.core.map.call(null, f, c1, c2))
  };
  var mapv__4 = function(f, c1, c2, c3) {
    return cljs.core.into.call(null, cljs.core.PersistentVector.EMPTY, cljs.core.map.call(null, f, c1, c2, c3))
  };
  var mapv__5 = function() {
    var G__67988__delegate = function(f, c1, c2, c3, colls) {
      return cljs.core.into.call(null, cljs.core.PersistentVector.EMPTY, cljs.core.apply.call(null, cljs.core.map, f, c1, c2, c3, colls))
    };
    var G__67988 = function(f, c1, c2, c3, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__67988__delegate.call(this, f, c1, c2, c3, colls)
    };
    G__67988.cljs$lang$maxFixedArity = 4;
    G__67988.cljs$lang$applyTo = function(arglist__67989) {
      var f = cljs.core.first(arglist__67989);
      var c1 = cljs.core.first(cljs.core.next(arglist__67989));
      var c2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__67989)));
      var c3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__67989))));
      var colls = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__67989))));
      return G__67988__delegate(f, c1, c2, c3, colls)
    };
    G__67988.cljs$lang$arity$variadic = G__67988__delegate;
    return G__67988
  }();
  mapv = function(f, c1, c2, c3, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return mapv__2.call(this, f, c1);
      case 3:
        return mapv__3.call(this, f, c1, c2);
      case 4:
        return mapv__4.call(this, f, c1, c2, c3);
      default:
        return mapv__5.cljs$lang$arity$variadic(f, c1, c2, c3, cljs.core.array_seq(arguments, 4))
    }
    throw"Invalid arity: " + arguments.length;
  };
  mapv.cljs$lang$maxFixedArity = 4;
  mapv.cljs$lang$applyTo = mapv__5.cljs$lang$applyTo;
  mapv.cljs$lang$arity$2 = mapv__2;
  mapv.cljs$lang$arity$3 = mapv__3;
  mapv.cljs$lang$arity$4 = mapv__4;
  mapv.cljs$lang$arity$variadic = mapv__5.cljs$lang$arity$variadic;
  return mapv
}();
cljs.core.filterv = function filterv(pred, coll) {
  return cljs.core.persistent_BANG_.call(null, cljs.core.reduce.call(null, function(v, o) {
    if(cljs.core.truth_(pred.call(null, o))) {
      return cljs.core.conj_BANG_.call(null, v, o)
    }else {
      return v
    }
  }, cljs.core.transient$.call(null, cljs.core.PersistentVector.EMPTY), coll))
};
cljs.core.partition = function() {
  var partition = null;
  var partition__2 = function(n, coll) {
    return partition.call(null, n, n, coll)
  };
  var partition__3 = function(n, step, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____67996 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____67996) {
        var s__67997 = temp__3974__auto____67996;
        var p__67998 = cljs.core.take.call(null, n, s__67997);
        if(n === cljs.core.count.call(null, p__67998)) {
          return cljs.core.cons.call(null, p__67998, partition.call(null, n, step, cljs.core.drop.call(null, step, s__67997)))
        }else {
          return null
        }
      }else {
        return null
      }
    }, null)
  };
  var partition__4 = function(n, step, pad, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____67999 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____67999) {
        var s__68000 = temp__3974__auto____67999;
        var p__68001 = cljs.core.take.call(null, n, s__68000);
        if(n === cljs.core.count.call(null, p__68001)) {
          return cljs.core.cons.call(null, p__68001, partition.call(null, n, step, pad, cljs.core.drop.call(null, step, s__68000)))
        }else {
          return cljs.core.list.call(null, cljs.core.take.call(null, n, cljs.core.concat.call(null, p__68001, pad)))
        }
      }else {
        return null
      }
    }, null)
  };
  partition = function(n, step, pad, coll) {
    switch(arguments.length) {
      case 2:
        return partition__2.call(this, n, step);
      case 3:
        return partition__3.call(this, n, step, pad);
      case 4:
        return partition__4.call(this, n, step, pad, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  partition.cljs$lang$arity$2 = partition__2;
  partition.cljs$lang$arity$3 = partition__3;
  partition.cljs$lang$arity$4 = partition__4;
  return partition
}();
cljs.core.get_in = function() {
  var get_in = null;
  var get_in__2 = function(m, ks) {
    return cljs.core.reduce.call(null, cljs.core.get, m, ks)
  };
  var get_in__3 = function(m, ks, not_found) {
    var sentinel__68006 = cljs.core.lookup_sentinel;
    var m__68007 = m;
    var ks__68008 = cljs.core.seq.call(null, ks);
    while(true) {
      if(ks__68008) {
        var m__68009 = cljs.core._lookup.call(null, m__68007, cljs.core.first.call(null, ks__68008), sentinel__68006);
        if(sentinel__68006 === m__68009) {
          return not_found
        }else {
          var G__68010 = sentinel__68006;
          var G__68011 = m__68009;
          var G__68012 = cljs.core.next.call(null, ks__68008);
          sentinel__68006 = G__68010;
          m__68007 = G__68011;
          ks__68008 = G__68012;
          continue
        }
      }else {
        return m__68007
      }
      break
    }
  };
  get_in = function(m, ks, not_found) {
    switch(arguments.length) {
      case 2:
        return get_in__2.call(this, m, ks);
      case 3:
        return get_in__3.call(this, m, ks, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  get_in.cljs$lang$arity$2 = get_in__2;
  get_in.cljs$lang$arity$3 = get_in__3;
  return get_in
}();
cljs.core.assoc_in = function assoc_in(m, p__68013, v) {
  var vec__68018__68019 = p__68013;
  var k__68020 = cljs.core.nth.call(null, vec__68018__68019, 0, null);
  var ks__68021 = cljs.core.nthnext.call(null, vec__68018__68019, 1);
  if(cljs.core.truth_(ks__68021)) {
    return cljs.core.assoc.call(null, m, k__68020, assoc_in.call(null, cljs.core._lookup.call(null, m, k__68020, null), ks__68021, v))
  }else {
    return cljs.core.assoc.call(null, m, k__68020, v)
  }
};
cljs.core.update_in = function() {
  var update_in__delegate = function(m, p__68022, f, args) {
    var vec__68027__68028 = p__68022;
    var k__68029 = cljs.core.nth.call(null, vec__68027__68028, 0, null);
    var ks__68030 = cljs.core.nthnext.call(null, vec__68027__68028, 1);
    if(cljs.core.truth_(ks__68030)) {
      return cljs.core.assoc.call(null, m, k__68029, cljs.core.apply.call(null, update_in, cljs.core._lookup.call(null, m, k__68029, null), ks__68030, f, args))
    }else {
      return cljs.core.assoc.call(null, m, k__68029, cljs.core.apply.call(null, f, cljs.core._lookup.call(null, m, k__68029, null), args))
    }
  };
  var update_in = function(m, p__68022, f, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
    }
    return update_in__delegate.call(this, m, p__68022, f, args)
  };
  update_in.cljs$lang$maxFixedArity = 3;
  update_in.cljs$lang$applyTo = function(arglist__68031) {
    var m = cljs.core.first(arglist__68031);
    var p__68022 = cljs.core.first(cljs.core.next(arglist__68031));
    var f = cljs.core.first(cljs.core.next(cljs.core.next(arglist__68031)));
    var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__68031)));
    return update_in__delegate(m, p__68022, f, args)
  };
  update_in.cljs$lang$arity$variadic = update_in__delegate;
  return update_in
}();
cljs.core.Vector = function(meta, array, __hash) {
  this.meta = meta;
  this.array = array;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32400159
};
cljs.core.Vector.cljs$lang$type = true;
cljs.core.Vector.cljs$lang$ctorPrSeq = function(this__2343__auto__) {
  return cljs.core.list.call(null, "cljs.core/Vector")
};
cljs.core.Vector.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__68034 = this;
  var h__2226__auto____68035 = this__68034.__hash;
  if(!(h__2226__auto____68035 == null)) {
    return h__2226__auto____68035
  }else {
    var h__2226__auto____68036 = cljs.core.hash_coll.call(null, coll);
    this__68034.__hash = h__2226__auto____68036;
    return h__2226__auto____68036
  }
};
cljs.core.Vector.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__68037 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, null)
};
cljs.core.Vector.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__68038 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, not_found)
};
cljs.core.Vector.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__68039 = this;
  var new_array__68040 = this__68039.array.slice();
  new_array__68040[k] = v;
  return new cljs.core.Vector(this__68039.meta, new_array__68040, null)
};
cljs.core.Vector.prototype.call = function() {
  var G__68071 = null;
  var G__68071__2 = function(this_sym68041, k) {
    var this__68043 = this;
    var this_sym68041__68044 = this;
    var coll__68045 = this_sym68041__68044;
    return coll__68045.cljs$core$ILookup$_lookup$arity$2(coll__68045, k)
  };
  var G__68071__3 = function(this_sym68042, k, not_found) {
    var this__68043 = this;
    var this_sym68042__68046 = this;
    var coll__68047 = this_sym68042__68046;
    return coll__68047.cljs$core$ILookup$_lookup$arity$3(coll__68047, k, not_found)
  };
  G__68071 = function(this_sym68042, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__68071__2.call(this, this_sym68042, k);
      case 3:
        return G__68071__3.call(this, this_sym68042, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__68071
}();
cljs.core.Vector.prototype.apply = function(this_sym68032, args68033) {
  var this__68048 = this;
  return this_sym68032.call.apply(this_sym68032, [this_sym68032].concat(args68033.slice()))
};
cljs.core.Vector.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__68049 = this;
  var new_array__68050 = this__68049.array.slice();
  new_array__68050.push(o);
  return new cljs.core.Vector(this__68049.meta, new_array__68050, null)
};
cljs.core.Vector.prototype.toString = function() {
  var this__68051 = this;
  var this__68052 = this;
  return cljs.core.pr_str.call(null, this__68052)
};
cljs.core.Vector.prototype.cljs$core$IReduce$_reduce$arity$2 = function(v, f) {
  var this__68053 = this;
  return cljs.core.ci_reduce.call(null, this__68053.array, f)
};
cljs.core.Vector.prototype.cljs$core$IReduce$_reduce$arity$3 = function(v, f, start) {
  var this__68054 = this;
  return cljs.core.ci_reduce.call(null, this__68054.array, f, start)
};
cljs.core.Vector.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__68055 = this;
  if(this__68055.array.length > 0) {
    var vector_seq__68056 = function vector_seq(i) {
      return new cljs.core.LazySeq(null, false, function() {
        if(i < this__68055.array.length) {
          return cljs.core.cons.call(null, this__68055.array[i], vector_seq.call(null, i + 1))
        }else {
          return null
        }
      }, null)
    };
    return vector_seq__68056.call(null, 0)
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__68057 = this;
  return this__68057.array.length
};
cljs.core.Vector.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__68058 = this;
  var count__68059 = this__68058.array.length;
  if(count__68059 > 0) {
    return this__68058.array[count__68059 - 1]
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__68060 = this;
  if(this__68060.array.length > 0) {
    var new_array__68061 = this__68060.array.slice();
    new_array__68061.pop();
    return new cljs.core.Vector(this__68060.meta, new_array__68061, null)
  }else {
    throw new Error("Can't pop empty vector");
  }
};
cljs.core.Vector.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(coll, n, val) {
  var this__68062 = this;
  return coll.cljs$core$IAssociative$_assoc$arity$3(coll, n, val)
};
cljs.core.Vector.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__68063 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Vector.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__68064 = this;
  return new cljs.core.Vector(meta, this__68064.array, this__68064.__hash)
};
cljs.core.Vector.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__68065 = this;
  return this__68065.meta
};
cljs.core.Vector.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__68066 = this;
  if(function() {
    var and__3822__auto____68067 = 0 <= n;
    if(and__3822__auto____68067) {
      return n < this__68066.array.length
    }else {
      return and__3822__auto____68067
    }
  }()) {
    return this__68066.array[n]
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__68068 = this;
  if(function() {
    var and__3822__auto____68069 = 0 <= n;
    if(and__3822__auto____68069) {
      return n < this__68068.array.length
    }else {
      return and__3822__auto____68069
    }
  }()) {
    return this__68068.array[n]
  }else {
    return not_found
  }
};
cljs.core.Vector.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__68070 = this;
  return cljs.core.with_meta.call(null, cljs.core.Vector.EMPTY, this__68070.meta)
};
cljs.core.Vector;
cljs.core.Vector.EMPTY = new cljs.core.Vector(null, [], 0);
cljs.core.Vector.fromArray = function(xs) {
  return new cljs.core.Vector(null, xs, null)
};
cljs.core.VectorNode = function(edit, arr) {
  this.edit = edit;
  this.arr = arr
};
cljs.core.VectorNode.cljs$lang$type = true;
cljs.core.VectorNode.cljs$lang$ctorPrSeq = function(this__2344__auto__) {
  return cljs.core.list.call(null, "cljs.core/VectorNode")
};
cljs.core.VectorNode;
cljs.core.pv_fresh_node = function pv_fresh_node(edit) {
  return new cljs.core.VectorNode(edit, cljs.core.make_array.call(null, 32))
};
cljs.core.pv_aget = function pv_aget(node, idx) {
  return node.arr[idx]
};
cljs.core.pv_aset = function pv_aset(node, idx, val) {
  return node.arr[idx] = val
};
cljs.core.pv_clone_node = function pv_clone_node(node) {
  return new cljs.core.VectorNode(node.edit, node.arr.slice())
};
cljs.core.tail_off = function tail_off(pv) {
  var cnt__68073 = pv.cnt;
  if(cnt__68073 < 32) {
    return 0
  }else {
    return cnt__68073 - 1 >>> 5 << 5
  }
};
cljs.core.new_path = function new_path(edit, level, node) {
  var ll__68079 = level;
  var ret__68080 = node;
  while(true) {
    if(ll__68079 === 0) {
      return ret__68080
    }else {
      var embed__68081 = ret__68080;
      var r__68082 = cljs.core.pv_fresh_node.call(null, edit);
      var ___68083 = cljs.core.pv_aset.call(null, r__68082, 0, embed__68081);
      var G__68084 = ll__68079 - 5;
      var G__68085 = r__68082;
      ll__68079 = G__68084;
      ret__68080 = G__68085;
      continue
    }
    break
  }
};
cljs.core.push_tail = function push_tail(pv, level, parent, tailnode) {
  var ret__68091 = cljs.core.pv_clone_node.call(null, parent);
  var subidx__68092 = pv.cnt - 1 >>> level & 31;
  if(5 === level) {
    cljs.core.pv_aset.call(null, ret__68091, subidx__68092, tailnode);
    return ret__68091
  }else {
    var child__68093 = cljs.core.pv_aget.call(null, parent, subidx__68092);
    if(!(child__68093 == null)) {
      var node_to_insert__68094 = push_tail.call(null, pv, level - 5, child__68093, tailnode);
      cljs.core.pv_aset.call(null, ret__68091, subidx__68092, node_to_insert__68094);
      return ret__68091
    }else {
      var node_to_insert__68095 = cljs.core.new_path.call(null, null, level - 5, tailnode);
      cljs.core.pv_aset.call(null, ret__68091, subidx__68092, node_to_insert__68095);
      return ret__68091
    }
  }
};
cljs.core.array_for = function array_for(pv, i) {
  if(function() {
    var and__3822__auto____68099 = 0 <= i;
    if(and__3822__auto____68099) {
      return i < pv.cnt
    }else {
      return and__3822__auto____68099
    }
  }()) {
    if(i >= cljs.core.tail_off.call(null, pv)) {
      return pv.tail
    }else {
      var node__68100 = pv.root;
      var level__68101 = pv.shift;
      while(true) {
        if(level__68101 > 0) {
          var G__68102 = cljs.core.pv_aget.call(null, node__68100, i >>> level__68101 & 31);
          var G__68103 = level__68101 - 5;
          node__68100 = G__68102;
          level__68101 = G__68103;
          continue
        }else {
          return node__68100.arr
        }
        break
      }
    }
  }else {
    throw new Error([cljs.core.str("No item "), cljs.core.str(i), cljs.core.str(" in vector of length "), cljs.core.str(pv.cnt)].join(""));
  }
};
cljs.core.do_assoc = function do_assoc(pv, level, node, i, val) {
  var ret__68106 = cljs.core.pv_clone_node.call(null, node);
  if(level === 0) {
    cljs.core.pv_aset.call(null, ret__68106, i & 31, val);
    return ret__68106
  }else {
    var subidx__68107 = i >>> level & 31;
    cljs.core.pv_aset.call(null, ret__68106, subidx__68107, do_assoc.call(null, pv, level - 5, cljs.core.pv_aget.call(null, node, subidx__68107), i, val));
    return ret__68106
  }
};
cljs.core.pop_tail = function pop_tail(pv, level, node) {
  var subidx__68113 = pv.cnt - 2 >>> level & 31;
  if(level > 5) {
    var new_child__68114 = pop_tail.call(null, pv, level - 5, cljs.core.pv_aget.call(null, node, subidx__68113));
    if(function() {
      var and__3822__auto____68115 = new_child__68114 == null;
      if(and__3822__auto____68115) {
        return subidx__68113 === 0
      }else {
        return and__3822__auto____68115
      }
    }()) {
      return null
    }else {
      var ret__68116 = cljs.core.pv_clone_node.call(null, node);
      cljs.core.pv_aset.call(null, ret__68116, subidx__68113, new_child__68114);
      return ret__68116
    }
  }else {
    if(subidx__68113 === 0) {
      return null
    }else {
      if("\ufdd0'else") {
        var ret__68117 = cljs.core.pv_clone_node.call(null, node);
        cljs.core.pv_aset.call(null, ret__68117, subidx__68113, null);
        return ret__68117
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentVector = function(meta, cnt, shift, root, tail, __hash) {
  this.meta = meta;
  this.cnt = cnt;
  this.shift = shift;
  this.root = root;
  this.tail = tail;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 1;
  this.cljs$lang$protocol_mask$partition0$ = 167668511
};
cljs.core.PersistentVector.cljs$lang$type = true;
cljs.core.PersistentVector.cljs$lang$ctorPrSeq = function(this__2343__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentVector")
};
cljs.core.PersistentVector.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var this__68120 = this;
  return new cljs.core.TransientVector(this__68120.cnt, this__68120.shift, cljs.core.tv_editable_root.call(null, this__68120.root), cljs.core.tv_editable_tail.call(null, this__68120.tail))
};
cljs.core.PersistentVector.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__68121 = this;
  var h__2226__auto____68122 = this__68121.__hash;
  if(!(h__2226__auto____68122 == null)) {
    return h__2226__auto____68122
  }else {
    var h__2226__auto____68123 = cljs.core.hash_coll.call(null, coll);
    this__68121.__hash = h__2226__auto____68123;
    return h__2226__auto____68123
  }
};
cljs.core.PersistentVector.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__68124 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, null)
};
cljs.core.PersistentVector.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__68125 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, not_found)
};
cljs.core.PersistentVector.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__68126 = this;
  if(function() {
    var and__3822__auto____68127 = 0 <= k;
    if(and__3822__auto____68127) {
      return k < this__68126.cnt
    }else {
      return and__3822__auto____68127
    }
  }()) {
    if(cljs.core.tail_off.call(null, coll) <= k) {
      var new_tail__68128 = this__68126.tail.slice();
      new_tail__68128[k & 31] = v;
      return new cljs.core.PersistentVector(this__68126.meta, this__68126.cnt, this__68126.shift, this__68126.root, new_tail__68128, null)
    }else {
      return new cljs.core.PersistentVector(this__68126.meta, this__68126.cnt, this__68126.shift, cljs.core.do_assoc.call(null, coll, this__68126.shift, this__68126.root, k, v), this__68126.tail, null)
    }
  }else {
    if(k === this__68126.cnt) {
      return coll.cljs$core$ICollection$_conj$arity$2(coll, v)
    }else {
      if("\ufdd0'else") {
        throw new Error([cljs.core.str("Index "), cljs.core.str(k), cljs.core.str(" out of bounds  [0,"), cljs.core.str(this__68126.cnt), cljs.core.str("]")].join(""));
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentVector.prototype.call = function() {
  var G__68176 = null;
  var G__68176__2 = function(this_sym68129, k) {
    var this__68131 = this;
    var this_sym68129__68132 = this;
    var coll__68133 = this_sym68129__68132;
    return coll__68133.cljs$core$ILookup$_lookup$arity$2(coll__68133, k)
  };
  var G__68176__3 = function(this_sym68130, k, not_found) {
    var this__68131 = this;
    var this_sym68130__68134 = this;
    var coll__68135 = this_sym68130__68134;
    return coll__68135.cljs$core$ILookup$_lookup$arity$3(coll__68135, k, not_found)
  };
  G__68176 = function(this_sym68130, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__68176__2.call(this, this_sym68130, k);
      case 3:
        return G__68176__3.call(this, this_sym68130, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__68176
}();
cljs.core.PersistentVector.prototype.apply = function(this_sym68118, args68119) {
  var this__68136 = this;
  return this_sym68118.call.apply(this_sym68118, [this_sym68118].concat(args68119.slice()))
};
cljs.core.PersistentVector.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(v, f, init) {
  var this__68137 = this;
  var step_init__68138 = [0, init];
  var i__68139 = 0;
  while(true) {
    if(i__68139 < this__68137.cnt) {
      var arr__68140 = cljs.core.array_for.call(null, v, i__68139);
      var len__68141 = arr__68140.length;
      var init__68145 = function() {
        var j__68142 = 0;
        var init__68143 = step_init__68138[1];
        while(true) {
          if(j__68142 < len__68141) {
            var init__68144 = f.call(null, init__68143, j__68142 + i__68139, arr__68140[j__68142]);
            if(cljs.core.reduced_QMARK_.call(null, init__68144)) {
              return init__68144
            }else {
              var G__68177 = j__68142 + 1;
              var G__68178 = init__68144;
              j__68142 = G__68177;
              init__68143 = G__68178;
              continue
            }
          }else {
            step_init__68138[0] = len__68141;
            step_init__68138[1] = init__68143;
            return init__68143
          }
          break
        }
      }();
      if(cljs.core.reduced_QMARK_.call(null, init__68145)) {
        return cljs.core.deref.call(null, init__68145)
      }else {
        var G__68179 = i__68139 + step_init__68138[0];
        i__68139 = G__68179;
        continue
      }
    }else {
      return step_init__68138[1]
    }
    break
  }
};
cljs.core.PersistentVector.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__68146 = this;
  if(this__68146.cnt - cljs.core.tail_off.call(null, coll) < 32) {
    var new_tail__68147 = this__68146.tail.slice();
    new_tail__68147.push(o);
    return new cljs.core.PersistentVector(this__68146.meta, this__68146.cnt + 1, this__68146.shift, this__68146.root, new_tail__68147, null)
  }else {
    var root_overflow_QMARK___68148 = this__68146.cnt >>> 5 > 1 << this__68146.shift;
    var new_shift__68149 = root_overflow_QMARK___68148 ? this__68146.shift + 5 : this__68146.shift;
    var new_root__68151 = root_overflow_QMARK___68148 ? function() {
      var n_r__68150 = cljs.core.pv_fresh_node.call(null, null);
      cljs.core.pv_aset.call(null, n_r__68150, 0, this__68146.root);
      cljs.core.pv_aset.call(null, n_r__68150, 1, cljs.core.new_path.call(null, null, this__68146.shift, new cljs.core.VectorNode(null, this__68146.tail)));
      return n_r__68150
    }() : cljs.core.push_tail.call(null, coll, this__68146.shift, this__68146.root, new cljs.core.VectorNode(null, this__68146.tail));
    return new cljs.core.PersistentVector(this__68146.meta, this__68146.cnt + 1, new_shift__68149, new_root__68151, [o], null)
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__68152 = this;
  if(this__68152.cnt > 0) {
    return new cljs.core.RSeq(coll, this__68152.cnt - 1, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IMapEntry$_key$arity$1 = function(coll) {
  var this__68153 = this;
  return coll.cljs$core$IIndexed$_nth$arity$2(coll, 0)
};
cljs.core.PersistentVector.prototype.cljs$core$IMapEntry$_val$arity$1 = function(coll) {
  var this__68154 = this;
  return coll.cljs$core$IIndexed$_nth$arity$2(coll, 1)
};
cljs.core.PersistentVector.prototype.toString = function() {
  var this__68155 = this;
  var this__68156 = this;
  return cljs.core.pr_str.call(null, this__68156)
};
cljs.core.PersistentVector.prototype.cljs$core$IReduce$_reduce$arity$2 = function(v, f) {
  var this__68157 = this;
  return cljs.core.ci_reduce.call(null, v, f)
};
cljs.core.PersistentVector.prototype.cljs$core$IReduce$_reduce$arity$3 = function(v, f, start) {
  var this__68158 = this;
  return cljs.core.ci_reduce.call(null, v, f, start)
};
cljs.core.PersistentVector.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__68159 = this;
  if(this__68159.cnt === 0) {
    return null
  }else {
    return cljs.core.chunked_seq.call(null, coll, 0, 0)
  }
};
cljs.core.PersistentVector.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__68160 = this;
  return this__68160.cnt
};
cljs.core.PersistentVector.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__68161 = this;
  if(this__68161.cnt > 0) {
    return coll.cljs$core$IIndexed$_nth$arity$2(coll, this__68161.cnt - 1)
  }else {
    return null
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__68162 = this;
  if(this__68162.cnt === 0) {
    throw new Error("Can't pop empty vector");
  }else {
    if(1 === this__68162.cnt) {
      return cljs.core._with_meta.call(null, cljs.core.PersistentVector.EMPTY, this__68162.meta)
    }else {
      if(1 < this__68162.cnt - cljs.core.tail_off.call(null, coll)) {
        return new cljs.core.PersistentVector(this__68162.meta, this__68162.cnt - 1, this__68162.shift, this__68162.root, this__68162.tail.slice(0, -1), null)
      }else {
        if("\ufdd0'else") {
          var new_tail__68163 = cljs.core.array_for.call(null, coll, this__68162.cnt - 2);
          var nr__68164 = cljs.core.pop_tail.call(null, coll, this__68162.shift, this__68162.root);
          var new_root__68165 = nr__68164 == null ? cljs.core.PersistentVector.EMPTY_NODE : nr__68164;
          var cnt_1__68166 = this__68162.cnt - 1;
          if(function() {
            var and__3822__auto____68167 = 5 < this__68162.shift;
            if(and__3822__auto____68167) {
              return cljs.core.pv_aget.call(null, new_root__68165, 1) == null
            }else {
              return and__3822__auto____68167
            }
          }()) {
            return new cljs.core.PersistentVector(this__68162.meta, cnt_1__68166, this__68162.shift - 5, cljs.core.pv_aget.call(null, new_root__68165, 0), new_tail__68163, null)
          }else {
            return new cljs.core.PersistentVector(this__68162.meta, cnt_1__68166, this__68162.shift, new_root__68165, new_tail__68163, null)
          }
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(coll, n, val) {
  var this__68168 = this;
  return coll.cljs$core$IAssociative$_assoc$arity$3(coll, n, val)
};
cljs.core.PersistentVector.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__68169 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentVector.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__68170 = this;
  return new cljs.core.PersistentVector(meta, this__68170.cnt, this__68170.shift, this__68170.root, this__68170.tail, this__68170.__hash)
};
cljs.core.PersistentVector.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__68171 = this;
  return this__68171.meta
};
cljs.core.PersistentVector.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__68172 = this;
  return cljs.core.array_for.call(null, coll, n)[n & 31]
};
cljs.core.PersistentVector.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__68173 = this;
  if(function() {
    var and__3822__auto____68174 = 0 <= n;
    if(and__3822__auto____68174) {
      return n < this__68173.cnt
    }else {
      return and__3822__auto____68174
    }
  }()) {
    return coll.cljs$core$IIndexed$_nth$arity$2(coll, n)
  }else {
    return not_found
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__68175 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.EMPTY, this__68175.meta)
};
cljs.core.PersistentVector;
cljs.core.PersistentVector.EMPTY_NODE = cljs.core.pv_fresh_node.call(null, null);
cljs.core.PersistentVector.EMPTY = new cljs.core.PersistentVector(null, 0, 5, cljs.core.PersistentVector.EMPTY_NODE, [], 0);
cljs.core.PersistentVector.fromArray = function(xs, no_clone) {
  var l__68180 = xs.length;
  var xs__68181 = no_clone === true ? xs : xs.slice();
  if(l__68180 < 32) {
    return new cljs.core.PersistentVector(null, l__68180, 5, cljs.core.PersistentVector.EMPTY_NODE, xs__68181, null)
  }else {
    var node__68182 = xs__68181.slice(0, 32);
    var v__68183 = new cljs.core.PersistentVector(null, 32, 5, cljs.core.PersistentVector.EMPTY_NODE, node__68182, null);
    var i__68184 = 32;
    var out__68185 = cljs.core._as_transient.call(null, v__68183);
    while(true) {
      if(i__68184 < l__68180) {
        var G__68186 = i__68184 + 1;
        var G__68187 = cljs.core.conj_BANG_.call(null, out__68185, xs__68181[i__68184]);
        i__68184 = G__68186;
        out__68185 = G__68187;
        continue
      }else {
        return cljs.core.persistent_BANG_.call(null, out__68185)
      }
      break
    }
  }
};
cljs.core.vec = function vec(coll) {
  return cljs.core._persistent_BANG_.call(null, cljs.core.reduce.call(null, cljs.core._conj_BANG_, cljs.core._as_transient.call(null, cljs.core.PersistentVector.EMPTY), coll))
};
cljs.core.vector = function() {
  var vector__delegate = function(args) {
    return cljs.core.vec.call(null, args)
  };
  var vector = function(var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return vector__delegate.call(this, args)
  };
  vector.cljs$lang$maxFixedArity = 0;
  vector.cljs$lang$applyTo = function(arglist__68188) {
    var args = cljs.core.seq(arglist__68188);
    return vector__delegate(args)
  };
  vector.cljs$lang$arity$variadic = vector__delegate;
  return vector
}();
cljs.core.ChunkedSeq = function(vec, node, i, off, meta) {
  this.vec = vec;
  this.node = node;
  this.i = i;
  this.off = off;
  this.meta = meta;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 27525356
};
cljs.core.ChunkedSeq.cljs$lang$type = true;
cljs.core.ChunkedSeq.cljs$lang$ctorPrSeq = function(this__2343__auto__) {
  return cljs.core.list.call(null, "cljs.core/ChunkedSeq")
};
cljs.core.ChunkedSeq.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var this__68189 = this;
  if(this__68189.off + 1 < this__68189.node.length) {
    var s__68190 = cljs.core.chunked_seq.call(null, this__68189.vec, this__68189.node, this__68189.i, this__68189.off + 1);
    if(s__68190 == null) {
      return null
    }else {
      return s__68190
    }
  }else {
    return coll.cljs$core$IChunkedNext$_chunked_next$arity$1(coll)
  }
};
cljs.core.ChunkedSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__68191 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.ChunkedSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__68192 = this;
  return coll
};
cljs.core.ChunkedSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__68193 = this;
  return this__68193.node[this__68193.off]
};
cljs.core.ChunkedSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__68194 = this;
  if(this__68194.off + 1 < this__68194.node.length) {
    var s__68195 = cljs.core.chunked_seq.call(null, this__68194.vec, this__68194.node, this__68194.i, this__68194.off + 1);
    if(s__68195 == null) {
      return cljs.core.List.EMPTY
    }else {
      return s__68195
    }
  }else {
    return coll.cljs$core$IChunkedSeq$_chunked_rest$arity$1(coll)
  }
};
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedNext$ = true;
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedNext$_chunked_next$arity$1 = function(coll) {
  var this__68196 = this;
  var l__68197 = this__68196.node.length;
  var s__68198 = this__68196.i + l__68197 < cljs.core._count.call(null, this__68196.vec) ? cljs.core.chunked_seq.call(null, this__68196.vec, this__68196.i + l__68197, 0) : null;
  if(s__68198 == null) {
    return null
  }else {
    return s__68198
  }
};
cljs.core.ChunkedSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__68199 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, m) {
  var this__68200 = this;
  return cljs.core.chunked_seq.call(null, this__68200.vec, this__68200.node, this__68200.i, this__68200.off, m)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IWithMeta$_meta$arity$1 = function(coll) {
  var this__68201 = this;
  return this__68201.meta
};
cljs.core.ChunkedSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__68202 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.EMPTY, this__68202.meta)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedSeq$ = true;
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedSeq$_chunked_first$arity$1 = function(coll) {
  var this__68203 = this;
  return cljs.core.array_chunk.call(null, this__68203.node, this__68203.off)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedSeq$_chunked_rest$arity$1 = function(coll) {
  var this__68204 = this;
  var l__68205 = this__68204.node.length;
  var s__68206 = this__68204.i + l__68205 < cljs.core._count.call(null, this__68204.vec) ? cljs.core.chunked_seq.call(null, this__68204.vec, this__68204.i + l__68205, 0) : null;
  if(s__68206 == null) {
    return cljs.core.List.EMPTY
  }else {
    return s__68206
  }
};
cljs.core.ChunkedSeq;
cljs.core.chunked_seq = function() {
  var chunked_seq = null;
  var chunked_seq__3 = function(vec, i, off) {
    return chunked_seq.call(null, vec, cljs.core.array_for.call(null, vec, i), i, off, null)
  };
  var chunked_seq__4 = function(vec, node, i, off) {
    return chunked_seq.call(null, vec, node, i, off, null)
  };
  var chunked_seq__5 = function(vec, node, i, off, meta) {
    return new cljs.core.ChunkedSeq(vec, node, i, off, meta)
  };
  chunked_seq = function(vec, node, i, off, meta) {
    switch(arguments.length) {
      case 3:
        return chunked_seq__3.call(this, vec, node, i);
      case 4:
        return chunked_seq__4.call(this, vec, node, i, off);
      case 5:
        return chunked_seq__5.call(this, vec, node, i, off, meta)
    }
    throw"Invalid arity: " + arguments.length;
  };
  chunked_seq.cljs$lang$arity$3 = chunked_seq__3;
  chunked_seq.cljs$lang$arity$4 = chunked_seq__4;
  chunked_seq.cljs$lang$arity$5 = chunked_seq__5;
  return chunked_seq
}();
cljs.core.Subvec = function(meta, v, start, end, __hash) {
  this.meta = meta;
  this.v = v;
  this.start = start;
  this.end = end;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32400159
};
cljs.core.Subvec.cljs$lang$type = true;
cljs.core.Subvec.cljs$lang$ctorPrSeq = function(this__2343__auto__) {
  return cljs.core.list.call(null, "cljs.core/Subvec")
};
cljs.core.Subvec.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__68209 = this;
  var h__2226__auto____68210 = this__68209.__hash;
  if(!(h__2226__auto____68210 == null)) {
    return h__2226__auto____68210
  }else {
    var h__2226__auto____68211 = cljs.core.hash_coll.call(null, coll);
    this__68209.__hash = h__2226__auto____68211;
    return h__2226__auto____68211
  }
};
cljs.core.Subvec.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__68212 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, null)
};
cljs.core.Subvec.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__68213 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, not_found)
};
cljs.core.Subvec.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, key, val) {
  var this__68214 = this;
  var v_pos__68215 = this__68214.start + key;
  return new cljs.core.Subvec(this__68214.meta, cljs.core._assoc.call(null, this__68214.v, v_pos__68215, val), this__68214.start, this__68214.end > v_pos__68215 + 1 ? this__68214.end : v_pos__68215 + 1, null)
};
cljs.core.Subvec.prototype.call = function() {
  var G__68241 = null;
  var G__68241__2 = function(this_sym68216, k) {
    var this__68218 = this;
    var this_sym68216__68219 = this;
    var coll__68220 = this_sym68216__68219;
    return coll__68220.cljs$core$ILookup$_lookup$arity$2(coll__68220, k)
  };
  var G__68241__3 = function(this_sym68217, k, not_found) {
    var this__68218 = this;
    var this_sym68217__68221 = this;
    var coll__68222 = this_sym68217__68221;
    return coll__68222.cljs$core$ILookup$_lookup$arity$3(coll__68222, k, not_found)
  };
  G__68241 = function(this_sym68217, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__68241__2.call(this, this_sym68217, k);
      case 3:
        return G__68241__3.call(this, this_sym68217, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__68241
}();
cljs.core.Subvec.prototype.apply = function(this_sym68207, args68208) {
  var this__68223 = this;
  return this_sym68207.call.apply(this_sym68207, [this_sym68207].concat(args68208.slice()))
};
cljs.core.Subvec.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__68224 = this;
  return new cljs.core.Subvec(this__68224.meta, cljs.core._assoc_n.call(null, this__68224.v, this__68224.end, o), this__68224.start, this__68224.end + 1, null)
};
cljs.core.Subvec.prototype.toString = function() {
  var this__68225 = this;
  var this__68226 = this;
  return cljs.core.pr_str.call(null, this__68226)
};
cljs.core.Subvec.prototype.cljs$core$IReduce$_reduce$arity$2 = function(coll, f) {
  var this__68227 = this;
  return cljs.core.ci_reduce.call(null, coll, f)
};
cljs.core.Subvec.prototype.cljs$core$IReduce$_reduce$arity$3 = function(coll, f, start) {
  var this__68228 = this;
  return cljs.core.ci_reduce.call(null, coll, f, start)
};
cljs.core.Subvec.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__68229 = this;
  var subvec_seq__68230 = function subvec_seq(i) {
    if(i === this__68229.end) {
      return null
    }else {
      return cljs.core.cons.call(null, cljs.core._nth.call(null, this__68229.v, i), new cljs.core.LazySeq(null, false, function() {
        return subvec_seq.call(null, i + 1)
      }, null))
    }
  };
  return subvec_seq__68230.call(null, this__68229.start)
};
cljs.core.Subvec.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__68231 = this;
  return this__68231.end - this__68231.start
};
cljs.core.Subvec.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__68232 = this;
  return cljs.core._nth.call(null, this__68232.v, this__68232.end - 1)
};
cljs.core.Subvec.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__68233 = this;
  if(this__68233.start === this__68233.end) {
    throw new Error("Can't pop empty vector");
  }else {
    return new cljs.core.Subvec(this__68233.meta, this__68233.v, this__68233.start, this__68233.end - 1, null)
  }
};
cljs.core.Subvec.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(coll, n, val) {
  var this__68234 = this;
  return coll.cljs$core$IAssociative$_assoc$arity$3(coll, n, val)
};
cljs.core.Subvec.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__68235 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Subvec.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__68236 = this;
  return new cljs.core.Subvec(meta, this__68236.v, this__68236.start, this__68236.end, this__68236.__hash)
};
cljs.core.Subvec.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__68237 = this;
  return this__68237.meta
};
cljs.core.Subvec.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__68238 = this;
  return cljs.core._nth.call(null, this__68238.v, this__68238.start + n)
};
cljs.core.Subvec.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__68239 = this;
  return cljs.core._nth.call(null, this__68239.v, this__68239.start + n, not_found)
};
cljs.core.Subvec.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__68240 = this;
  return cljs.core.with_meta.call(null, cljs.core.Vector.EMPTY, this__68240.meta)
};
cljs.core.Subvec;
cljs.core.subvec = function() {
  var subvec = null;
  var subvec__2 = function(v, start) {
    return subvec.call(null, v, start, cljs.core.count.call(null, v))
  };
  var subvec__3 = function(v, start, end) {
    return new cljs.core.Subvec(null, v, start, end, null)
  };
  subvec = function(v, start, end) {
    switch(arguments.length) {
      case 2:
        return subvec__2.call(this, v, start);
      case 3:
        return subvec__3.call(this, v, start, end)
    }
    throw"Invalid arity: " + arguments.length;
  };
  subvec.cljs$lang$arity$2 = subvec__2;
  subvec.cljs$lang$arity$3 = subvec__3;
  return subvec
}();
cljs.core.tv_ensure_editable = function tv_ensure_editable(edit, node) {
  if(edit === node.edit) {
    return node
  }else {
    return new cljs.core.VectorNode(edit, node.arr.slice())
  }
};
cljs.core.tv_editable_root = function tv_editable_root(node) {
  return new cljs.core.VectorNode({}, node.arr.slice())
};
cljs.core.tv_editable_tail = function tv_editable_tail(tl) {
  var ret__68243 = cljs.core.make_array.call(null, 32);
  cljs.core.array_copy.call(null, tl, 0, ret__68243, 0, tl.length);
  return ret__68243
};
cljs.core.tv_push_tail = function tv_push_tail(tv, level, parent, tail_node) {
  var ret__68247 = cljs.core.tv_ensure_editable.call(null, tv.root.edit, parent);
  var subidx__68248 = tv.cnt - 1 >>> level & 31;
  cljs.core.pv_aset.call(null, ret__68247, subidx__68248, level === 5 ? tail_node : function() {
    var child__68249 = cljs.core.pv_aget.call(null, ret__68247, subidx__68248);
    if(!(child__68249 == null)) {
      return tv_push_tail.call(null, tv, level - 5, child__68249, tail_node)
    }else {
      return cljs.core.new_path.call(null, tv.root.edit, level - 5, tail_node)
    }
  }());
  return ret__68247
};
cljs.core.tv_pop_tail = function tv_pop_tail(tv, level, node) {
  var node__68254 = cljs.core.tv_ensure_editable.call(null, tv.root.edit, node);
  var subidx__68255 = tv.cnt - 2 >>> level & 31;
  if(level > 5) {
    var new_child__68256 = tv_pop_tail.call(null, tv, level - 5, cljs.core.pv_aget.call(null, node__68254, subidx__68255));
    if(function() {
      var and__3822__auto____68257 = new_child__68256 == null;
      if(and__3822__auto____68257) {
        return subidx__68255 === 0
      }else {
        return and__3822__auto____68257
      }
    }()) {
      return null
    }else {
      cljs.core.pv_aset.call(null, node__68254, subidx__68255, new_child__68256);
      return node__68254
    }
  }else {
    if(subidx__68255 === 0) {
      return null
    }else {
      if("\ufdd0'else") {
        cljs.core.pv_aset.call(null, node__68254, subidx__68255, null);
        return node__68254
      }else {
        return null
      }
    }
  }
};
cljs.core.editable_array_for = function editable_array_for(tv, i) {
  if(function() {
    var and__3822__auto____68262 = 0 <= i;
    if(and__3822__auto____68262) {
      return i < tv.cnt
    }else {
      return and__3822__auto____68262
    }
  }()) {
    if(i >= cljs.core.tail_off.call(null, tv)) {
      return tv.tail
    }else {
      var root__68263 = tv.root;
      var node__68264 = root__68263;
      var level__68265 = tv.shift;
      while(true) {
        if(level__68265 > 0) {
          var G__68266 = cljs.core.tv_ensure_editable.call(null, root__68263.edit, cljs.core.pv_aget.call(null, node__68264, i >>> level__68265 & 31));
          var G__68267 = level__68265 - 5;
          node__68264 = G__68266;
          level__68265 = G__68267;
          continue
        }else {
          return node__68264.arr
        }
        break
      }
    }
  }else {
    throw new Error([cljs.core.str("No item "), cljs.core.str(i), cljs.core.str(" in transient vector of length "), cljs.core.str(tv.cnt)].join(""));
  }
};
cljs.core.TransientVector = function(cnt, shift, root, tail) {
  this.cnt = cnt;
  this.shift = shift;
  this.root = root;
  this.tail = tail;
  this.cljs$lang$protocol_mask$partition0$ = 275;
  this.cljs$lang$protocol_mask$partition1$ = 22
};
cljs.core.TransientVector.cljs$lang$type = true;
cljs.core.TransientVector.cljs$lang$ctorPrSeq = function(this__2343__auto__) {
  return cljs.core.list.call(null, "cljs.core/TransientVector")
};
cljs.core.TransientVector.prototype.call = function() {
  var G__68307 = null;
  var G__68307__2 = function(this_sym68270, k) {
    var this__68272 = this;
    var this_sym68270__68273 = this;
    var coll__68274 = this_sym68270__68273;
    return coll__68274.cljs$core$ILookup$_lookup$arity$2(coll__68274, k)
  };
  var G__68307__3 = function(this_sym68271, k, not_found) {
    var this__68272 = this;
    var this_sym68271__68275 = this;
    var coll__68276 = this_sym68271__68275;
    return coll__68276.cljs$core$ILookup$_lookup$arity$3(coll__68276, k, not_found)
  };
  G__68307 = function(this_sym68271, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__68307__2.call(this, this_sym68271, k);
      case 3:
        return G__68307__3.call(this, this_sym68271, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__68307
}();
cljs.core.TransientVector.prototype.apply = function(this_sym68268, args68269) {
  var this__68277 = this;
  return this_sym68268.call.apply(this_sym68268, [this_sym68268].concat(args68269.slice()))
};
cljs.core.TransientVector.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__68278 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, null)
};
cljs.core.TransientVector.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__68279 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, not_found)
};
cljs.core.TransientVector.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__68280 = this;
  if(this__68280.root.edit) {
    return cljs.core.array_for.call(null, coll, n)[n & 31]
  }else {
    throw new Error("nth after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__68281 = this;
  if(function() {
    var and__3822__auto____68282 = 0 <= n;
    if(and__3822__auto____68282) {
      return n < this__68281.cnt
    }else {
      return and__3822__auto____68282
    }
  }()) {
    return coll.cljs$core$IIndexed$_nth$arity$2(coll, n)
  }else {
    return not_found
  }
};
cljs.core.TransientVector.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__68283 = this;
  if(this__68283.root.edit) {
    return this__68283.cnt
  }else {
    throw new Error("count after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3 = function(tcoll, n, val) {
  var this__68284 = this;
  if(this__68284.root.edit) {
    if(function() {
      var and__3822__auto____68285 = 0 <= n;
      if(and__3822__auto____68285) {
        return n < this__68284.cnt
      }else {
        return and__3822__auto____68285
      }
    }()) {
      if(cljs.core.tail_off.call(null, tcoll) <= n) {
        this__68284.tail[n & 31] = val;
        return tcoll
      }else {
        var new_root__68290 = function go(level, node) {
          var node__68288 = cljs.core.tv_ensure_editable.call(null, this__68284.root.edit, node);
          if(level === 0) {
            cljs.core.pv_aset.call(null, node__68288, n & 31, val);
            return node__68288
          }else {
            var subidx__68289 = n >>> level & 31;
            cljs.core.pv_aset.call(null, node__68288, subidx__68289, go.call(null, level - 5, cljs.core.pv_aget.call(null, node__68288, subidx__68289)));
            return node__68288
          }
        }.call(null, this__68284.shift, this__68284.root);
        this__68284.root = new_root__68290;
        return tcoll
      }
    }else {
      if(n === this__68284.cnt) {
        return tcoll.cljs$core$ITransientCollection$_conj_BANG_$arity$2(tcoll, val)
      }else {
        if("\ufdd0'else") {
          throw new Error([cljs.core.str("Index "), cljs.core.str(n), cljs.core.str(" out of bounds for TransientVector of length"), cljs.core.str(this__68284.cnt)].join(""));
        }else {
          return null
        }
      }
    }
  }else {
    throw new Error("assoc! after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientVector$_pop_BANG_$arity$1 = function(tcoll) {
  var this__68291 = this;
  if(this__68291.root.edit) {
    if(this__68291.cnt === 0) {
      throw new Error("Can't pop empty vector");
    }else {
      if(1 === this__68291.cnt) {
        this__68291.cnt = 0;
        return tcoll
      }else {
        if((this__68291.cnt - 1 & 31) > 0) {
          this__68291.cnt = this__68291.cnt - 1;
          return tcoll
        }else {
          if("\ufdd0'else") {
            var new_tail__68292 = cljs.core.editable_array_for.call(null, tcoll, this__68291.cnt - 2);
            var new_root__68294 = function() {
              var nr__68293 = cljs.core.tv_pop_tail.call(null, tcoll, this__68291.shift, this__68291.root);
              if(!(nr__68293 == null)) {
                return nr__68293
              }else {
                return new cljs.core.VectorNode(this__68291.root.edit, cljs.core.make_array.call(null, 32))
              }
            }();
            if(function() {
              var and__3822__auto____68295 = 5 < this__68291.shift;
              if(and__3822__auto____68295) {
                return cljs.core.pv_aget.call(null, new_root__68294, 1) == null
              }else {
                return and__3822__auto____68295
              }
            }()) {
              var new_root__68296 = cljs.core.tv_ensure_editable.call(null, this__68291.root.edit, cljs.core.pv_aget.call(null, new_root__68294, 0));
              this__68291.root = new_root__68296;
              this__68291.shift = this__68291.shift - 5;
              this__68291.cnt = this__68291.cnt - 1;
              this__68291.tail = new_tail__68292;
              return tcoll
            }else {
              this__68291.root = new_root__68294;
              this__68291.cnt = this__68291.cnt - 1;
              this__68291.tail = new_tail__68292;
              return tcoll
            }
          }else {
            return null
          }
        }
      }
    }
  }else {
    throw new Error("pop! after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3 = function(tcoll, key, val) {
  var this__68297 = this;
  return tcoll.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3(tcoll, key, val)
};
cljs.core.TransientVector.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, o) {
  var this__68298 = this;
  if(this__68298.root.edit) {
    if(this__68298.cnt - cljs.core.tail_off.call(null, tcoll) < 32) {
      this__68298.tail[this__68298.cnt & 31] = o;
      this__68298.cnt = this__68298.cnt + 1;
      return tcoll
    }else {
      var tail_node__68299 = new cljs.core.VectorNode(this__68298.root.edit, this__68298.tail);
      var new_tail__68300 = cljs.core.make_array.call(null, 32);
      new_tail__68300[0] = o;
      this__68298.tail = new_tail__68300;
      if(this__68298.cnt >>> 5 > 1 << this__68298.shift) {
        var new_root_array__68301 = cljs.core.make_array.call(null, 32);
        var new_shift__68302 = this__68298.shift + 5;
        new_root_array__68301[0] = this__68298.root;
        new_root_array__68301[1] = cljs.core.new_path.call(null, this__68298.root.edit, this__68298.shift, tail_node__68299);
        this__68298.root = new cljs.core.VectorNode(this__68298.root.edit, new_root_array__68301);
        this__68298.shift = new_shift__68302;
        this__68298.cnt = this__68298.cnt + 1;
        return tcoll
      }else {
        var new_root__68303 = cljs.core.tv_push_tail.call(null, tcoll, this__68298.shift, this__68298.root, tail_node__68299);
        this__68298.root = new_root__68303;
        this__68298.cnt = this__68298.cnt + 1;
        return tcoll
      }
    }
  }else {
    throw new Error("conj! after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__68304 = this;
  if(this__68304.root.edit) {
    this__68304.root.edit = null;
    var len__68305 = this__68304.cnt - cljs.core.tail_off.call(null, tcoll);
    var trimmed_tail__68306 = cljs.core.make_array.call(null, len__68305);
    cljs.core.array_copy.call(null, this__68304.tail, 0, trimmed_tail__68306, 0, len__68305);
    return new cljs.core.PersistentVector(null, this__68304.cnt, this__68304.shift, this__68304.root, trimmed_tail__68306, null)
  }else {
    throw new Error("persistent! called twice");
  }
};
cljs.core.TransientVector;
cljs.core.PersistentQueueSeq = function(meta, front, rear, __hash) {
  this.meta = meta;
  this.front = front;
  this.rear = rear;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31850572
};
cljs.core.PersistentQueueSeq.cljs$lang$type = true;
cljs.core.PersistentQueueSeq.cljs$lang$ctorPrSeq = function(this__2343__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentQueueSeq")
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__68308 = this;
  var h__2226__auto____68309 = this__68308.__hash;
  if(!(h__2226__auto____68309 == null)) {
    return h__2226__auto____68309
  }else {
    var h__2226__auto____68310 = cljs.core.hash_coll.call(null, coll);
    this__68308.__hash = h__2226__auto____68310;
    return h__2226__auto____68310
  }
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__68311 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.PersistentQueueSeq.prototype.toString = function() {
  var this__68312 = this;
  var this__68313 = this;
  return cljs.core.pr_str.call(null, this__68313)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__68314 = this;
  return coll
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__68315 = this;
  return cljs.core._first.call(null, this__68315.front)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__68316 = this;
  var temp__3971__auto____68317 = cljs.core.next.call(null, this__68316.front);
  if(temp__3971__auto____68317) {
    var f1__68318 = temp__3971__auto____68317;
    return new cljs.core.PersistentQueueSeq(this__68316.meta, f1__68318, this__68316.rear, null)
  }else {
    if(this__68316.rear == null) {
      return coll.cljs$core$IEmptyableCollection$_empty$arity$1(coll)
    }else {
      return new cljs.core.PersistentQueueSeq(this__68316.meta, this__68316.rear, null, null)
    }
  }
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__68319 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__68320 = this;
  return new cljs.core.PersistentQueueSeq(meta, this__68320.front, this__68320.rear, this__68320.__hash)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__68321 = this;
  return this__68321.meta
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__68322 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__68322.meta)
};
cljs.core.PersistentQueueSeq;
cljs.core.PersistentQueue = function(meta, count, front, rear, __hash) {
  this.meta = meta;
  this.count = count;
  this.front = front;
  this.rear = rear;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31858766
};
cljs.core.PersistentQueue.cljs$lang$type = true;
cljs.core.PersistentQueue.cljs$lang$ctorPrSeq = function(this__2343__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentQueue")
};
cljs.core.PersistentQueue.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__68323 = this;
  var h__2226__auto____68324 = this__68323.__hash;
  if(!(h__2226__auto____68324 == null)) {
    return h__2226__auto____68324
  }else {
    var h__2226__auto____68325 = cljs.core.hash_coll.call(null, coll);
    this__68323.__hash = h__2226__auto____68325;
    return h__2226__auto____68325
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__68326 = this;
  if(cljs.core.truth_(this__68326.front)) {
    return new cljs.core.PersistentQueue(this__68326.meta, this__68326.count + 1, this__68326.front, cljs.core.conj.call(null, function() {
      var or__3824__auto____68327 = this__68326.rear;
      if(cljs.core.truth_(or__3824__auto____68327)) {
        return or__3824__auto____68327
      }else {
        return cljs.core.PersistentVector.EMPTY
      }
    }(), o), null)
  }else {
    return new cljs.core.PersistentQueue(this__68326.meta, this__68326.count + 1, cljs.core.conj.call(null, this__68326.front, o), cljs.core.PersistentVector.EMPTY, null)
  }
};
cljs.core.PersistentQueue.prototype.toString = function() {
  var this__68328 = this;
  var this__68329 = this;
  return cljs.core.pr_str.call(null, this__68329)
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__68330 = this;
  var rear__68331 = cljs.core.seq.call(null, this__68330.rear);
  if(cljs.core.truth_(function() {
    var or__3824__auto____68332 = this__68330.front;
    if(cljs.core.truth_(or__3824__auto____68332)) {
      return or__3824__auto____68332
    }else {
      return rear__68331
    }
  }())) {
    return new cljs.core.PersistentQueueSeq(null, this__68330.front, cljs.core.seq.call(null, rear__68331), null)
  }else {
    return null
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__68333 = this;
  return this__68333.count
};
cljs.core.PersistentQueue.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__68334 = this;
  return cljs.core._first.call(null, this__68334.front)
};
cljs.core.PersistentQueue.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__68335 = this;
  if(cljs.core.truth_(this__68335.front)) {
    var temp__3971__auto____68336 = cljs.core.next.call(null, this__68335.front);
    if(temp__3971__auto____68336) {
      var f1__68337 = temp__3971__auto____68336;
      return new cljs.core.PersistentQueue(this__68335.meta, this__68335.count - 1, f1__68337, this__68335.rear, null)
    }else {
      return new cljs.core.PersistentQueue(this__68335.meta, this__68335.count - 1, cljs.core.seq.call(null, this__68335.rear), cljs.core.PersistentVector.EMPTY, null)
    }
  }else {
    return coll
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__68338 = this;
  return cljs.core.first.call(null, this__68338.front)
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__68339 = this;
  return cljs.core.rest.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.PersistentQueue.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__68340 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentQueue.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__68341 = this;
  return new cljs.core.PersistentQueue(meta, this__68341.count, this__68341.front, this__68341.rear, this__68341.__hash)
};
cljs.core.PersistentQueue.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__68342 = this;
  return this__68342.meta
};
cljs.core.PersistentQueue.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__68343 = this;
  return cljs.core.PersistentQueue.EMPTY
};
cljs.core.PersistentQueue;
cljs.core.PersistentQueue.EMPTY = new cljs.core.PersistentQueue(null, 0, null, cljs.core.PersistentVector.EMPTY, 0);
cljs.core.NeverEquiv = function() {
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 2097152
};
cljs.core.NeverEquiv.cljs$lang$type = true;
cljs.core.NeverEquiv.cljs$lang$ctorPrSeq = function(this__2343__auto__) {
  return cljs.core.list.call(null, "cljs.core/NeverEquiv")
};
cljs.core.NeverEquiv.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(o, other) {
  var this__68344 = this;
  return false
};
cljs.core.NeverEquiv;
cljs.core.never_equiv = new cljs.core.NeverEquiv;
cljs.core.equiv_map = function equiv_map(x, y) {
  return cljs.core.boolean$.call(null, cljs.core.map_QMARK_.call(null, y) ? cljs.core.count.call(null, x) === cljs.core.count.call(null, y) ? cljs.core.every_QMARK_.call(null, cljs.core.identity, cljs.core.map.call(null, function(xkv) {
    return cljs.core._EQ_.call(null, cljs.core._lookup.call(null, y, cljs.core.first.call(null, xkv), cljs.core.never_equiv), cljs.core.second.call(null, xkv))
  }, x)) : null : null)
};
cljs.core.scan_array = function scan_array(incr, k, array) {
  var len__68347 = array.length;
  var i__68348 = 0;
  while(true) {
    if(i__68348 < len__68347) {
      if(k === array[i__68348]) {
        return i__68348
      }else {
        var G__68349 = i__68348 + incr;
        i__68348 = G__68349;
        continue
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.obj_map_compare_keys = function obj_map_compare_keys(a, b) {
  var a__68352 = cljs.core.hash.call(null, a);
  var b__68353 = cljs.core.hash.call(null, b);
  if(a__68352 < b__68353) {
    return-1
  }else {
    if(a__68352 > b__68353) {
      return 1
    }else {
      if("\ufdd0'else") {
        return 0
      }else {
        return null
      }
    }
  }
};
cljs.core.obj_map__GT_hash_map = function obj_map__GT_hash_map(m, k, v) {
  var ks__68361 = m.keys;
  var len__68362 = ks__68361.length;
  var so__68363 = m.strobj;
  var out__68364 = cljs.core.with_meta.call(null, cljs.core.PersistentHashMap.EMPTY, cljs.core.meta.call(null, m));
  var i__68365 = 0;
  var out__68366 = cljs.core.transient$.call(null, out__68364);
  while(true) {
    if(i__68365 < len__68362) {
      var k__68367 = ks__68361[i__68365];
      var G__68368 = i__68365 + 1;
      var G__68369 = cljs.core.assoc_BANG_.call(null, out__68366, k__68367, so__68363[k__68367]);
      i__68365 = G__68368;
      out__68366 = G__68369;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, cljs.core.assoc_BANG_.call(null, out__68366, k, v))
    }
    break
  }
};
cljs.core.obj_clone = function obj_clone(obj, ks) {
  var new_obj__68375 = {};
  var l__68376 = ks.length;
  var i__68377 = 0;
  while(true) {
    if(i__68377 < l__68376) {
      var k__68378 = ks[i__68377];
      new_obj__68375[k__68378] = obj[k__68378];
      var G__68379 = i__68377 + 1;
      i__68377 = G__68379;
      continue
    }else {
    }
    break
  }
  return new_obj__68375
};
cljs.core.ObjMap = function(meta, keys, strobj, update_count, __hash) {
  this.meta = meta;
  this.keys = keys;
  this.strobj = strobj;
  this.update_count = update_count;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 1;
  this.cljs$lang$protocol_mask$partition0$ = 15075087
};
cljs.core.ObjMap.cljs$lang$type = true;
cljs.core.ObjMap.cljs$lang$ctorPrSeq = function(this__2343__auto__) {
  return cljs.core.list.call(null, "cljs.core/ObjMap")
};
cljs.core.ObjMap.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var this__68382 = this;
  return cljs.core.transient$.call(null, cljs.core.into.call(null, cljs.core.hash_map.call(null), coll))
};
cljs.core.ObjMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__68383 = this;
  var h__2226__auto____68384 = this__68383.__hash;
  if(!(h__2226__auto____68384 == null)) {
    return h__2226__auto____68384
  }else {
    var h__2226__auto____68385 = cljs.core.hash_imap.call(null, coll);
    this__68383.__hash = h__2226__auto____68385;
    return h__2226__auto____68385
  }
};
cljs.core.ObjMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__68386 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.ObjMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__68387 = this;
  if(function() {
    var and__3822__auto____68388 = goog.isString(k);
    if(and__3822__auto____68388) {
      return!(cljs.core.scan_array.call(null, 1, k, this__68387.keys) == null)
    }else {
      return and__3822__auto____68388
    }
  }()) {
    return this__68387.strobj[k]
  }else {
    return not_found
  }
};
cljs.core.ObjMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__68389 = this;
  if(goog.isString(k)) {
    if(function() {
      var or__3824__auto____68390 = this__68389.update_count > cljs.core.ObjMap.HASHMAP_THRESHOLD;
      if(or__3824__auto____68390) {
        return or__3824__auto____68390
      }else {
        return this__68389.keys.length >= cljs.core.ObjMap.HASHMAP_THRESHOLD
      }
    }()) {
      return cljs.core.obj_map__GT_hash_map.call(null, coll, k, v)
    }else {
      if(!(cljs.core.scan_array.call(null, 1, k, this__68389.keys) == null)) {
        var new_strobj__68391 = cljs.core.obj_clone.call(null, this__68389.strobj, this__68389.keys);
        new_strobj__68391[k] = v;
        return new cljs.core.ObjMap(this__68389.meta, this__68389.keys, new_strobj__68391, this__68389.update_count + 1, null)
      }else {
        var new_strobj__68392 = cljs.core.obj_clone.call(null, this__68389.strobj, this__68389.keys);
        var new_keys__68393 = this__68389.keys.slice();
        new_strobj__68392[k] = v;
        new_keys__68393.push(k);
        return new cljs.core.ObjMap(this__68389.meta, new_keys__68393, new_strobj__68392, this__68389.update_count + 1, null)
      }
    }
  }else {
    return cljs.core.obj_map__GT_hash_map.call(null, coll, k, v)
  }
};
cljs.core.ObjMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__68394 = this;
  if(function() {
    var and__3822__auto____68395 = goog.isString(k);
    if(and__3822__auto____68395) {
      return!(cljs.core.scan_array.call(null, 1, k, this__68394.keys) == null)
    }else {
      return and__3822__auto____68395
    }
  }()) {
    return true
  }else {
    return false
  }
};
cljs.core.ObjMap.prototype.call = function() {
  var G__68417 = null;
  var G__68417__2 = function(this_sym68396, k) {
    var this__68398 = this;
    var this_sym68396__68399 = this;
    var coll__68400 = this_sym68396__68399;
    return coll__68400.cljs$core$ILookup$_lookup$arity$2(coll__68400, k)
  };
  var G__68417__3 = function(this_sym68397, k, not_found) {
    var this__68398 = this;
    var this_sym68397__68401 = this;
    var coll__68402 = this_sym68397__68401;
    return coll__68402.cljs$core$ILookup$_lookup$arity$3(coll__68402, k, not_found)
  };
  G__68417 = function(this_sym68397, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__68417__2.call(this, this_sym68397, k);
      case 3:
        return G__68417__3.call(this, this_sym68397, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__68417
}();
cljs.core.ObjMap.prototype.apply = function(this_sym68380, args68381) {
  var this__68403 = this;
  return this_sym68380.call.apply(this_sym68380, [this_sym68380].concat(args68381.slice()))
};
cljs.core.ObjMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__68404 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.ObjMap.prototype.toString = function() {
  var this__68405 = this;
  var this__68406 = this;
  return cljs.core.pr_str.call(null, this__68406)
};
cljs.core.ObjMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__68407 = this;
  if(this__68407.keys.length > 0) {
    return cljs.core.map.call(null, function(p1__68370_SHARP_) {
      return cljs.core.vector.call(null, p1__68370_SHARP_, this__68407.strobj[p1__68370_SHARP_])
    }, this__68407.keys.sort(cljs.core.obj_map_compare_keys))
  }else {
    return null
  }
};
cljs.core.ObjMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__68408 = this;
  return this__68408.keys.length
};
cljs.core.ObjMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__68409 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.ObjMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__68410 = this;
  return new cljs.core.ObjMap(meta, this__68410.keys, this__68410.strobj, this__68410.update_count, this__68410.__hash)
};
cljs.core.ObjMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__68411 = this;
  return this__68411.meta
};
cljs.core.ObjMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__68412 = this;
  return cljs.core.with_meta.call(null, cljs.core.ObjMap.EMPTY, this__68412.meta)
};
cljs.core.ObjMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__68413 = this;
  if(function() {
    var and__3822__auto____68414 = goog.isString(k);
    if(and__3822__auto____68414) {
      return!(cljs.core.scan_array.call(null, 1, k, this__68413.keys) == null)
    }else {
      return and__3822__auto____68414
    }
  }()) {
    var new_keys__68415 = this__68413.keys.slice();
    var new_strobj__68416 = cljs.core.obj_clone.call(null, this__68413.strobj, this__68413.keys);
    new_keys__68415.splice(cljs.core.scan_array.call(null, 1, k, new_keys__68415), 1);
    cljs.core.js_delete.call(null, new_strobj__68416, k);
    return new cljs.core.ObjMap(this__68413.meta, new_keys__68415, new_strobj__68416, this__68413.update_count + 1, null)
  }else {
    return coll
  }
};
cljs.core.ObjMap;
cljs.core.ObjMap.EMPTY = new cljs.core.ObjMap(null, [], {}, 0, 0);
cljs.core.ObjMap.HASHMAP_THRESHOLD = 32;
cljs.core.ObjMap.fromObject = function(ks, obj) {
  return new cljs.core.ObjMap(null, ks, obj, 0, null)
};
cljs.core.HashMap = function(meta, count, hashobj, __hash) {
  this.meta = meta;
  this.count = count;
  this.hashobj = hashobj;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 15075087
};
cljs.core.HashMap.cljs$lang$type = true;
cljs.core.HashMap.cljs$lang$ctorPrSeq = function(this__2343__auto__) {
  return cljs.core.list.call(null, "cljs.core/HashMap")
};
cljs.core.HashMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__68421 = this;
  var h__2226__auto____68422 = this__68421.__hash;
  if(!(h__2226__auto____68422 == null)) {
    return h__2226__auto____68422
  }else {
    var h__2226__auto____68423 = cljs.core.hash_imap.call(null, coll);
    this__68421.__hash = h__2226__auto____68423;
    return h__2226__auto____68423
  }
};
cljs.core.HashMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__68424 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.HashMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__68425 = this;
  var bucket__68426 = this__68425.hashobj[cljs.core.hash.call(null, k)];
  var i__68427 = cljs.core.truth_(bucket__68426) ? cljs.core.scan_array.call(null, 2, k, bucket__68426) : null;
  if(cljs.core.truth_(i__68427)) {
    return bucket__68426[i__68427 + 1]
  }else {
    return not_found
  }
};
cljs.core.HashMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__68428 = this;
  var h__68429 = cljs.core.hash.call(null, k);
  var bucket__68430 = this__68428.hashobj[h__68429];
  if(cljs.core.truth_(bucket__68430)) {
    var new_bucket__68431 = bucket__68430.slice();
    var new_hashobj__68432 = goog.object.clone(this__68428.hashobj);
    new_hashobj__68432[h__68429] = new_bucket__68431;
    var temp__3971__auto____68433 = cljs.core.scan_array.call(null, 2, k, new_bucket__68431);
    if(cljs.core.truth_(temp__3971__auto____68433)) {
      var i__68434 = temp__3971__auto____68433;
      new_bucket__68431[i__68434 + 1] = v;
      return new cljs.core.HashMap(this__68428.meta, this__68428.count, new_hashobj__68432, null)
    }else {
      new_bucket__68431.push(k, v);
      return new cljs.core.HashMap(this__68428.meta, this__68428.count + 1, new_hashobj__68432, null)
    }
  }else {
    var new_hashobj__68435 = goog.object.clone(this__68428.hashobj);
    new_hashobj__68435[h__68429] = [k, v];
    return new cljs.core.HashMap(this__68428.meta, this__68428.count + 1, new_hashobj__68435, null)
  }
};
cljs.core.HashMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__68436 = this;
  var bucket__68437 = this__68436.hashobj[cljs.core.hash.call(null, k)];
  var i__68438 = cljs.core.truth_(bucket__68437) ? cljs.core.scan_array.call(null, 2, k, bucket__68437) : null;
  if(cljs.core.truth_(i__68438)) {
    return true
  }else {
    return false
  }
};
cljs.core.HashMap.prototype.call = function() {
  var G__68463 = null;
  var G__68463__2 = function(this_sym68439, k) {
    var this__68441 = this;
    var this_sym68439__68442 = this;
    var coll__68443 = this_sym68439__68442;
    return coll__68443.cljs$core$ILookup$_lookup$arity$2(coll__68443, k)
  };
  var G__68463__3 = function(this_sym68440, k, not_found) {
    var this__68441 = this;
    var this_sym68440__68444 = this;
    var coll__68445 = this_sym68440__68444;
    return coll__68445.cljs$core$ILookup$_lookup$arity$3(coll__68445, k, not_found)
  };
  G__68463 = function(this_sym68440, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__68463__2.call(this, this_sym68440, k);
      case 3:
        return G__68463__3.call(this, this_sym68440, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__68463
}();
cljs.core.HashMap.prototype.apply = function(this_sym68419, args68420) {
  var this__68446 = this;
  return this_sym68419.call.apply(this_sym68419, [this_sym68419].concat(args68420.slice()))
};
cljs.core.HashMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__68447 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.HashMap.prototype.toString = function() {
  var this__68448 = this;
  var this__68449 = this;
  return cljs.core.pr_str.call(null, this__68449)
};
cljs.core.HashMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__68450 = this;
  if(this__68450.count > 0) {
    var hashes__68451 = cljs.core.js_keys.call(null, this__68450.hashobj).sort();
    return cljs.core.mapcat.call(null, function(p1__68418_SHARP_) {
      return cljs.core.map.call(null, cljs.core.vec, cljs.core.partition.call(null, 2, this__68450.hashobj[p1__68418_SHARP_]))
    }, hashes__68451)
  }else {
    return null
  }
};
cljs.core.HashMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__68452 = this;
  return this__68452.count
};
cljs.core.HashMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__68453 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.HashMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__68454 = this;
  return new cljs.core.HashMap(meta, this__68454.count, this__68454.hashobj, this__68454.__hash)
};
cljs.core.HashMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__68455 = this;
  return this__68455.meta
};
cljs.core.HashMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__68456 = this;
  return cljs.core.with_meta.call(null, cljs.core.HashMap.EMPTY, this__68456.meta)
};
cljs.core.HashMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__68457 = this;
  var h__68458 = cljs.core.hash.call(null, k);
  var bucket__68459 = this__68457.hashobj[h__68458];
  var i__68460 = cljs.core.truth_(bucket__68459) ? cljs.core.scan_array.call(null, 2, k, bucket__68459) : null;
  if(cljs.core.not.call(null, i__68460)) {
    return coll
  }else {
    var new_hashobj__68461 = goog.object.clone(this__68457.hashobj);
    if(3 > bucket__68459.length) {
      cljs.core.js_delete.call(null, new_hashobj__68461, h__68458)
    }else {
      var new_bucket__68462 = bucket__68459.slice();
      new_bucket__68462.splice(i__68460, 2);
      new_hashobj__68461[h__68458] = new_bucket__68462
    }
    return new cljs.core.HashMap(this__68457.meta, this__68457.count - 1, new_hashobj__68461, null)
  }
};
cljs.core.HashMap;
cljs.core.HashMap.EMPTY = new cljs.core.HashMap(null, 0, {}, 0);
cljs.core.HashMap.fromArrays = function(ks, vs) {
  var len__68464 = ks.length;
  var i__68465 = 0;
  var out__68466 = cljs.core.HashMap.EMPTY;
  while(true) {
    if(i__68465 < len__68464) {
      var G__68467 = i__68465 + 1;
      var G__68468 = cljs.core.assoc.call(null, out__68466, ks[i__68465], vs[i__68465]);
      i__68465 = G__68467;
      out__68466 = G__68468;
      continue
    }else {
      return out__68466
    }
    break
  }
};
cljs.core.array_map_index_of = function array_map_index_of(m, k) {
  var arr__68472 = m.arr;
  var len__68473 = arr__68472.length;
  var i__68474 = 0;
  while(true) {
    if(len__68473 <= i__68474) {
      return-1
    }else {
      if(cljs.core._EQ_.call(null, arr__68472[i__68474], k)) {
        return i__68474
      }else {
        if("\ufdd0'else") {
          var G__68475 = i__68474 + 2;
          i__68474 = G__68475;
          continue
        }else {
          return null
        }
      }
    }
    break
  }
};
cljs.core.PersistentArrayMap = function(meta, cnt, arr, __hash) {
  this.meta = meta;
  this.cnt = cnt;
  this.arr = arr;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 1;
  this.cljs$lang$protocol_mask$partition0$ = 16123663
};
cljs.core.PersistentArrayMap.cljs$lang$type = true;
cljs.core.PersistentArrayMap.cljs$lang$ctorPrSeq = function(this__2343__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentArrayMap")
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var this__68478 = this;
  return new cljs.core.TransientArrayMap({}, this__68478.arr.length, this__68478.arr.slice())
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__68479 = this;
  var h__2226__auto____68480 = this__68479.__hash;
  if(!(h__2226__auto____68480 == null)) {
    return h__2226__auto____68480
  }else {
    var h__2226__auto____68481 = cljs.core.hash_imap.call(null, coll);
    this__68479.__hash = h__2226__auto____68481;
    return h__2226__auto____68481
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__68482 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__68483 = this;
  var idx__68484 = cljs.core.array_map_index_of.call(null, coll, k);
  if(idx__68484 === -1) {
    return not_found
  }else {
    return this__68483.arr[idx__68484 + 1]
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__68485 = this;
  var idx__68486 = cljs.core.array_map_index_of.call(null, coll, k);
  if(idx__68486 === -1) {
    if(this__68485.cnt < cljs.core.PersistentArrayMap.HASHMAP_THRESHOLD) {
      return new cljs.core.PersistentArrayMap(this__68485.meta, this__68485.cnt + 1, function() {
        var G__68487__68488 = this__68485.arr.slice();
        G__68487__68488.push(k);
        G__68487__68488.push(v);
        return G__68487__68488
      }(), null)
    }else {
      return cljs.core.persistent_BANG_.call(null, cljs.core.assoc_BANG_.call(null, cljs.core.transient$.call(null, cljs.core.into.call(null, cljs.core.PersistentHashMap.EMPTY, coll)), k, v))
    }
  }else {
    if(v === this__68485.arr[idx__68486 + 1]) {
      return coll
    }else {
      if("\ufdd0'else") {
        return new cljs.core.PersistentArrayMap(this__68485.meta, this__68485.cnt, function() {
          var G__68489__68490 = this__68485.arr.slice();
          G__68489__68490[idx__68486 + 1] = v;
          return G__68489__68490
        }(), null)
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__68491 = this;
  return!(cljs.core.array_map_index_of.call(null, coll, k) === -1)
};
cljs.core.PersistentArrayMap.prototype.call = function() {
  var G__68523 = null;
  var G__68523__2 = function(this_sym68492, k) {
    var this__68494 = this;
    var this_sym68492__68495 = this;
    var coll__68496 = this_sym68492__68495;
    return coll__68496.cljs$core$ILookup$_lookup$arity$2(coll__68496, k)
  };
  var G__68523__3 = function(this_sym68493, k, not_found) {
    var this__68494 = this;
    var this_sym68493__68497 = this;
    var coll__68498 = this_sym68493__68497;
    return coll__68498.cljs$core$ILookup$_lookup$arity$3(coll__68498, k, not_found)
  };
  G__68523 = function(this_sym68493, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__68523__2.call(this, this_sym68493, k);
      case 3:
        return G__68523__3.call(this, this_sym68493, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__68523
}();
cljs.core.PersistentArrayMap.prototype.apply = function(this_sym68476, args68477) {
  var this__68499 = this;
  return this_sym68476.call.apply(this_sym68476, [this_sym68476].concat(args68477.slice()))
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(coll, f, init) {
  var this__68500 = this;
  var len__68501 = this__68500.arr.length;
  var i__68502 = 0;
  var init__68503 = init;
  while(true) {
    if(i__68502 < len__68501) {
      var init__68504 = f.call(null, init__68503, this__68500.arr[i__68502], this__68500.arr[i__68502 + 1]);
      if(cljs.core.reduced_QMARK_.call(null, init__68504)) {
        return cljs.core.deref.call(null, init__68504)
      }else {
        var G__68524 = i__68502 + 2;
        var G__68525 = init__68504;
        i__68502 = G__68524;
        init__68503 = G__68525;
        continue
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__68505 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.PersistentArrayMap.prototype.toString = function() {
  var this__68506 = this;
  var this__68507 = this;
  return cljs.core.pr_str.call(null, this__68507)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__68508 = this;
  if(this__68508.cnt > 0) {
    var len__68509 = this__68508.arr.length;
    var array_map_seq__68510 = function array_map_seq(i) {
      return new cljs.core.LazySeq(null, false, function() {
        if(i < len__68509) {
          return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([this__68508.arr[i], this__68508.arr[i + 1]], true), array_map_seq.call(null, i + 2))
        }else {
          return null
        }
      }, null)
    };
    return array_map_seq__68510.call(null, 0)
  }else {
    return null
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__68511 = this;
  return this__68511.cnt
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__68512 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__68513 = this;
  return new cljs.core.PersistentArrayMap(meta, this__68513.cnt, this__68513.arr, this__68513.__hash)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__68514 = this;
  return this__68514.meta
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__68515 = this;
  return cljs.core._with_meta.call(null, cljs.core.PersistentArrayMap.EMPTY, this__68515.meta)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__68516 = this;
  var idx__68517 = cljs.core.array_map_index_of.call(null, coll, k);
  if(idx__68517 >= 0) {
    var len__68518 = this__68516.arr.length;
    var new_len__68519 = len__68518 - 2;
    if(new_len__68519 === 0) {
      return coll.cljs$core$IEmptyableCollection$_empty$arity$1(coll)
    }else {
      var new_arr__68520 = cljs.core.make_array.call(null, new_len__68519);
      var s__68521 = 0;
      var d__68522 = 0;
      while(true) {
        if(s__68521 >= len__68518) {
          return new cljs.core.PersistentArrayMap(this__68516.meta, this__68516.cnt - 1, new_arr__68520, null)
        }else {
          if(cljs.core._EQ_.call(null, k, this__68516.arr[s__68521])) {
            var G__68526 = s__68521 + 2;
            var G__68527 = d__68522;
            s__68521 = G__68526;
            d__68522 = G__68527;
            continue
          }else {
            if("\ufdd0'else") {
              new_arr__68520[d__68522] = this__68516.arr[s__68521];
              new_arr__68520[d__68522 + 1] = this__68516.arr[s__68521 + 1];
              var G__68528 = s__68521 + 2;
              var G__68529 = d__68522 + 2;
              s__68521 = G__68528;
              d__68522 = G__68529;
              continue
            }else {
              return null
            }
          }
        }
        break
      }
    }
  }else {
    return coll
  }
};
cljs.core.PersistentArrayMap;
cljs.core.PersistentArrayMap.EMPTY = new cljs.core.PersistentArrayMap(null, 0, [], null);
cljs.core.PersistentArrayMap.HASHMAP_THRESHOLD = 16;
cljs.core.PersistentArrayMap.fromArrays = function(ks, vs) {
  var len__68530 = cljs.core.count.call(null, ks);
  var i__68531 = 0;
  var out__68532 = cljs.core.transient$.call(null, cljs.core.PersistentArrayMap.EMPTY);
  while(true) {
    if(i__68531 < len__68530) {
      var G__68533 = i__68531 + 1;
      var G__68534 = cljs.core.assoc_BANG_.call(null, out__68532, ks[i__68531], vs[i__68531]);
      i__68531 = G__68533;
      out__68532 = G__68534;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, out__68532)
    }
    break
  }
};
cljs.core.TransientArrayMap = function(editable_QMARK_, len, arr) {
  this.editable_QMARK_ = editable_QMARK_;
  this.len = len;
  this.arr = arr;
  this.cljs$lang$protocol_mask$partition1$ = 14;
  this.cljs$lang$protocol_mask$partition0$ = 258
};
cljs.core.TransientArrayMap.cljs$lang$type = true;
cljs.core.TransientArrayMap.cljs$lang$ctorPrSeq = function(this__2343__auto__) {
  return cljs.core.list.call(null, "cljs.core/TransientArrayMap")
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientMap$_dissoc_BANG_$arity$2 = function(tcoll, key) {
  var this__68535 = this;
  if(cljs.core.truth_(this__68535.editable_QMARK_)) {
    var idx__68536 = cljs.core.array_map_index_of.call(null, tcoll, key);
    if(idx__68536 >= 0) {
      this__68535.arr[idx__68536] = this__68535.arr[this__68535.len - 2];
      this__68535.arr[idx__68536 + 1] = this__68535.arr[this__68535.len - 1];
      var G__68537__68538 = this__68535.arr;
      G__68537__68538.pop();
      G__68537__68538.pop();
      G__68537__68538;
      this__68535.len = this__68535.len - 2
    }else {
    }
    return tcoll
  }else {
    throw new Error("dissoc! after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3 = function(tcoll, key, val) {
  var this__68539 = this;
  if(cljs.core.truth_(this__68539.editable_QMARK_)) {
    var idx__68540 = cljs.core.array_map_index_of.call(null, tcoll, key);
    if(idx__68540 === -1) {
      if(this__68539.len + 2 <= 2 * cljs.core.PersistentArrayMap.HASHMAP_THRESHOLD) {
        this__68539.len = this__68539.len + 2;
        this__68539.arr.push(key);
        this__68539.arr.push(val);
        return tcoll
      }else {
        return cljs.core.assoc_BANG_.call(null, cljs.core.array__GT_transient_hash_map.call(null, this__68539.len, this__68539.arr), key, val)
      }
    }else {
      if(val === this__68539.arr[idx__68540 + 1]) {
        return tcoll
      }else {
        this__68539.arr[idx__68540 + 1] = val;
        return tcoll
      }
    }
  }else {
    throw new Error("assoc! after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, o) {
  var this__68541 = this;
  if(cljs.core.truth_(this__68541.editable_QMARK_)) {
    if(function() {
      var G__68542__68543 = o;
      if(G__68542__68543) {
        if(function() {
          var or__3824__auto____68544 = G__68542__68543.cljs$lang$protocol_mask$partition0$ & 2048;
          if(or__3824__auto____68544) {
            return or__3824__auto____68544
          }else {
            return G__68542__68543.cljs$core$IMapEntry$
          }
        }()) {
          return true
        }else {
          if(!G__68542__68543.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__68542__68543)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__68542__68543)
      }
    }()) {
      return tcoll.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3(tcoll, cljs.core.key.call(null, o), cljs.core.val.call(null, o))
    }else {
      var es__68545 = cljs.core.seq.call(null, o);
      var tcoll__68546 = tcoll;
      while(true) {
        var temp__3971__auto____68547 = cljs.core.first.call(null, es__68545);
        if(cljs.core.truth_(temp__3971__auto____68547)) {
          var e__68548 = temp__3971__auto____68547;
          var G__68554 = cljs.core.next.call(null, es__68545);
          var G__68555 = tcoll__68546.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3(tcoll__68546, cljs.core.key.call(null, e__68548), cljs.core.val.call(null, e__68548));
          es__68545 = G__68554;
          tcoll__68546 = G__68555;
          continue
        }else {
          return tcoll__68546
        }
        break
      }
    }
  }else {
    throw new Error("conj! after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__68549 = this;
  if(cljs.core.truth_(this__68549.editable_QMARK_)) {
    this__68549.editable_QMARK_ = false;
    return new cljs.core.PersistentArrayMap(null, cljs.core.quot.call(null, this__68549.len, 2), this__68549.arr, null)
  }else {
    throw new Error("persistent! called twice");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(tcoll, k) {
  var this__68550 = this;
  return tcoll.cljs$core$ILookup$_lookup$arity$3(tcoll, k, null)
};
cljs.core.TransientArrayMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(tcoll, k, not_found) {
  var this__68551 = this;
  if(cljs.core.truth_(this__68551.editable_QMARK_)) {
    var idx__68552 = cljs.core.array_map_index_of.call(null, tcoll, k);
    if(idx__68552 === -1) {
      return not_found
    }else {
      return this__68551.arr[idx__68552 + 1]
    }
  }else {
    throw new Error("lookup after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ICounted$_count$arity$1 = function(tcoll) {
  var this__68553 = this;
  if(cljs.core.truth_(this__68553.editable_QMARK_)) {
    return cljs.core.quot.call(null, this__68553.len, 2)
  }else {
    throw new Error("count after persistent!");
  }
};
cljs.core.TransientArrayMap;
cljs.core.array__GT_transient_hash_map = function array__GT_transient_hash_map(len, arr) {
  var out__68558 = cljs.core.transient$.call(null, cljs.core.ObjMap.EMPTY);
  var i__68559 = 0;
  while(true) {
    if(i__68559 < len) {
      var G__68560 = cljs.core.assoc_BANG_.call(null, out__68558, arr[i__68559], arr[i__68559 + 1]);
      var G__68561 = i__68559 + 2;
      out__68558 = G__68560;
      i__68559 = G__68561;
      continue
    }else {
      return out__68558
    }
    break
  }
};
cljs.core.Box = function(val) {
  this.val = val
};
cljs.core.Box.cljs$lang$type = true;
cljs.core.Box.cljs$lang$ctorPrSeq = function(this__2344__auto__) {
  return cljs.core.list.call(null, "cljs.core/Box")
};
cljs.core.Box;
cljs.core.key_test = function key_test(key, other) {
  if(goog.isString(key)) {
    return key === other
  }else {
    return cljs.core._EQ_.call(null, key, other)
  }
};
cljs.core.mask = function mask(hash, shift) {
  return hash >>> shift & 31
};
cljs.core.clone_and_set = function() {
  var clone_and_set = null;
  var clone_and_set__3 = function(arr, i, a) {
    var G__68566__68567 = arr.slice();
    G__68566__68567[i] = a;
    return G__68566__68567
  };
  var clone_and_set__5 = function(arr, i, a, j, b) {
    var G__68568__68569 = arr.slice();
    G__68568__68569[i] = a;
    G__68568__68569[j] = b;
    return G__68568__68569
  };
  clone_and_set = function(arr, i, a, j, b) {
    switch(arguments.length) {
      case 3:
        return clone_and_set__3.call(this, arr, i, a);
      case 5:
        return clone_and_set__5.call(this, arr, i, a, j, b)
    }
    throw"Invalid arity: " + arguments.length;
  };
  clone_and_set.cljs$lang$arity$3 = clone_and_set__3;
  clone_and_set.cljs$lang$arity$5 = clone_and_set__5;
  return clone_and_set
}();
cljs.core.remove_pair = function remove_pair(arr, i) {
  var new_arr__68571 = cljs.core.make_array.call(null, arr.length - 2);
  cljs.core.array_copy.call(null, arr, 0, new_arr__68571, 0, 2 * i);
  cljs.core.array_copy.call(null, arr, 2 * (i + 1), new_arr__68571, 2 * i, new_arr__68571.length - 2 * i);
  return new_arr__68571
};
cljs.core.bitmap_indexed_node_index = function bitmap_indexed_node_index(bitmap, bit) {
  return cljs.core.bit_count.call(null, bitmap & bit - 1)
};
cljs.core.bitpos = function bitpos(hash, shift) {
  return 1 << (hash >>> shift & 31)
};
cljs.core.edit_and_set = function() {
  var edit_and_set = null;
  var edit_and_set__4 = function(inode, edit, i, a) {
    var editable__68574 = inode.ensure_editable(edit);
    editable__68574.arr[i] = a;
    return editable__68574
  };
  var edit_and_set__6 = function(inode, edit, i, a, j, b) {
    var editable__68575 = inode.ensure_editable(edit);
    editable__68575.arr[i] = a;
    editable__68575.arr[j] = b;
    return editable__68575
  };
  edit_and_set = function(inode, edit, i, a, j, b) {
    switch(arguments.length) {
      case 4:
        return edit_and_set__4.call(this, inode, edit, i, a);
      case 6:
        return edit_and_set__6.call(this, inode, edit, i, a, j, b)
    }
    throw"Invalid arity: " + arguments.length;
  };
  edit_and_set.cljs$lang$arity$4 = edit_and_set__4;
  edit_and_set.cljs$lang$arity$6 = edit_and_set__6;
  return edit_and_set
}();
cljs.core.inode_kv_reduce = function inode_kv_reduce(arr, f, init) {
  var len__68582 = arr.length;
  var i__68583 = 0;
  var init__68584 = init;
  while(true) {
    if(i__68583 < len__68582) {
      var init__68587 = function() {
        var k__68585 = arr[i__68583];
        if(!(k__68585 == null)) {
          return f.call(null, init__68584, k__68585, arr[i__68583 + 1])
        }else {
          var node__68586 = arr[i__68583 + 1];
          if(!(node__68586 == null)) {
            return node__68586.kv_reduce(f, init__68584)
          }else {
            return init__68584
          }
        }
      }();
      if(cljs.core.reduced_QMARK_.call(null, init__68587)) {
        return cljs.core.deref.call(null, init__68587)
      }else {
        var G__68588 = i__68583 + 2;
        var G__68589 = init__68587;
        i__68583 = G__68588;
        init__68584 = G__68589;
        continue
      }
    }else {
      return init__68584
    }
    break
  }
};
cljs.core.BitmapIndexedNode = function(edit, bitmap, arr) {
  this.edit = edit;
  this.bitmap = bitmap;
  this.arr = arr
};
cljs.core.BitmapIndexedNode.cljs$lang$type = true;
cljs.core.BitmapIndexedNode.cljs$lang$ctorPrSeq = function(this__2343__auto__) {
  return cljs.core.list.call(null, "cljs.core/BitmapIndexedNode")
};
cljs.core.BitmapIndexedNode.prototype.edit_and_remove_pair = function(e, bit, i) {
  var this__68590 = this;
  var inode__68591 = this;
  if(this__68590.bitmap === bit) {
    return null
  }else {
    var editable__68592 = inode__68591.ensure_editable(e);
    var earr__68593 = editable__68592.arr;
    var len__68594 = earr__68593.length;
    editable__68592.bitmap = bit ^ editable__68592.bitmap;
    cljs.core.array_copy.call(null, earr__68593, 2 * (i + 1), earr__68593, 2 * i, len__68594 - 2 * (i + 1));
    earr__68593[len__68594 - 2] = null;
    earr__68593[len__68594 - 1] = null;
    return editable__68592
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_assoc_BANG_ = function(edit, shift, hash, key, val, added_leaf_QMARK_) {
  var this__68595 = this;
  var inode__68596 = this;
  var bit__68597 = 1 << (hash >>> shift & 31);
  var idx__68598 = cljs.core.bitmap_indexed_node_index.call(null, this__68595.bitmap, bit__68597);
  if((this__68595.bitmap & bit__68597) === 0) {
    var n__68599 = cljs.core.bit_count.call(null, this__68595.bitmap);
    if(2 * n__68599 < this__68595.arr.length) {
      var editable__68600 = inode__68596.ensure_editable(edit);
      var earr__68601 = editable__68600.arr;
      added_leaf_QMARK_.val = true;
      cljs.core.array_copy_downward.call(null, earr__68601, 2 * idx__68598, earr__68601, 2 * (idx__68598 + 1), 2 * (n__68599 - idx__68598));
      earr__68601[2 * idx__68598] = key;
      earr__68601[2 * idx__68598 + 1] = val;
      editable__68600.bitmap = editable__68600.bitmap | bit__68597;
      return editable__68600
    }else {
      if(n__68599 >= 16) {
        var nodes__68602 = cljs.core.make_array.call(null, 32);
        var jdx__68603 = hash >>> shift & 31;
        nodes__68602[jdx__68603] = cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_);
        var i__68604 = 0;
        var j__68605 = 0;
        while(true) {
          if(i__68604 < 32) {
            if((this__68595.bitmap >>> i__68604 & 1) === 0) {
              var G__68658 = i__68604 + 1;
              var G__68659 = j__68605;
              i__68604 = G__68658;
              j__68605 = G__68659;
              continue
            }else {
              nodes__68602[i__68604] = !(this__68595.arr[j__68605] == null) ? cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift + 5, cljs.core.hash.call(null, this__68595.arr[j__68605]), this__68595.arr[j__68605], this__68595.arr[j__68605 + 1], added_leaf_QMARK_) : this__68595.arr[j__68605 + 1];
              var G__68660 = i__68604 + 1;
              var G__68661 = j__68605 + 2;
              i__68604 = G__68660;
              j__68605 = G__68661;
              continue
            }
          }else {
          }
          break
        }
        return new cljs.core.ArrayNode(edit, n__68599 + 1, nodes__68602)
      }else {
        if("\ufdd0'else") {
          var new_arr__68606 = cljs.core.make_array.call(null, 2 * (n__68599 + 4));
          cljs.core.array_copy.call(null, this__68595.arr, 0, new_arr__68606, 0, 2 * idx__68598);
          new_arr__68606[2 * idx__68598] = key;
          new_arr__68606[2 * idx__68598 + 1] = val;
          cljs.core.array_copy.call(null, this__68595.arr, 2 * idx__68598, new_arr__68606, 2 * (idx__68598 + 1), 2 * (n__68599 - idx__68598));
          added_leaf_QMARK_.val = true;
          var editable__68607 = inode__68596.ensure_editable(edit);
          editable__68607.arr = new_arr__68606;
          editable__68607.bitmap = editable__68607.bitmap | bit__68597;
          return editable__68607
        }else {
          return null
        }
      }
    }
  }else {
    var key_or_nil__68608 = this__68595.arr[2 * idx__68598];
    var val_or_node__68609 = this__68595.arr[2 * idx__68598 + 1];
    if(key_or_nil__68608 == null) {
      var n__68610 = val_or_node__68609.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_);
      if(n__68610 === val_or_node__68609) {
        return inode__68596
      }else {
        return cljs.core.edit_and_set.call(null, inode__68596, edit, 2 * idx__68598 + 1, n__68610)
      }
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__68608)) {
        if(val === val_or_node__68609) {
          return inode__68596
        }else {
          return cljs.core.edit_and_set.call(null, inode__68596, edit, 2 * idx__68598 + 1, val)
        }
      }else {
        if("\ufdd0'else") {
          added_leaf_QMARK_.val = true;
          return cljs.core.edit_and_set.call(null, inode__68596, edit, 2 * idx__68598, null, 2 * idx__68598 + 1, cljs.core.create_node.call(null, edit, shift + 5, key_or_nil__68608, val_or_node__68609, hash, key, val))
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_seq = function() {
  var this__68611 = this;
  var inode__68612 = this;
  return cljs.core.create_inode_seq.call(null, this__68611.arr)
};
cljs.core.BitmapIndexedNode.prototype.inode_without_BANG_ = function(edit, shift, hash, key, removed_leaf_QMARK_) {
  var this__68613 = this;
  var inode__68614 = this;
  var bit__68615 = 1 << (hash >>> shift & 31);
  if((this__68613.bitmap & bit__68615) === 0) {
    return inode__68614
  }else {
    var idx__68616 = cljs.core.bitmap_indexed_node_index.call(null, this__68613.bitmap, bit__68615);
    var key_or_nil__68617 = this__68613.arr[2 * idx__68616];
    var val_or_node__68618 = this__68613.arr[2 * idx__68616 + 1];
    if(key_or_nil__68617 == null) {
      var n__68619 = val_or_node__68618.inode_without_BANG_(edit, shift + 5, hash, key, removed_leaf_QMARK_);
      if(n__68619 === val_or_node__68618) {
        return inode__68614
      }else {
        if(!(n__68619 == null)) {
          return cljs.core.edit_and_set.call(null, inode__68614, edit, 2 * idx__68616 + 1, n__68619)
        }else {
          if(this__68613.bitmap === bit__68615) {
            return null
          }else {
            if("\ufdd0'else") {
              return inode__68614.edit_and_remove_pair(edit, bit__68615, idx__68616)
            }else {
              return null
            }
          }
        }
      }
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__68617)) {
        removed_leaf_QMARK_[0] = true;
        return inode__68614.edit_and_remove_pair(edit, bit__68615, idx__68616)
      }else {
        if("\ufdd0'else") {
          return inode__68614
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.ensure_editable = function(e) {
  var this__68620 = this;
  var inode__68621 = this;
  if(e === this__68620.edit) {
    return inode__68621
  }else {
    var n__68622 = cljs.core.bit_count.call(null, this__68620.bitmap);
    var new_arr__68623 = cljs.core.make_array.call(null, n__68622 < 0 ? 4 : 2 * (n__68622 + 1));
    cljs.core.array_copy.call(null, this__68620.arr, 0, new_arr__68623, 0, 2 * n__68622);
    return new cljs.core.BitmapIndexedNode(e, this__68620.bitmap, new_arr__68623)
  }
};
cljs.core.BitmapIndexedNode.prototype.kv_reduce = function(f, init) {
  var this__68624 = this;
  var inode__68625 = this;
  return cljs.core.inode_kv_reduce.call(null, this__68624.arr, f, init)
};
cljs.core.BitmapIndexedNode.prototype.inode_find = function(shift, hash, key, not_found) {
  var this__68626 = this;
  var inode__68627 = this;
  var bit__68628 = 1 << (hash >>> shift & 31);
  if((this__68626.bitmap & bit__68628) === 0) {
    return not_found
  }else {
    var idx__68629 = cljs.core.bitmap_indexed_node_index.call(null, this__68626.bitmap, bit__68628);
    var key_or_nil__68630 = this__68626.arr[2 * idx__68629];
    var val_or_node__68631 = this__68626.arr[2 * idx__68629 + 1];
    if(key_or_nil__68630 == null) {
      return val_or_node__68631.inode_find(shift + 5, hash, key, not_found)
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__68630)) {
        return cljs.core.PersistentVector.fromArray([key_or_nil__68630, val_or_node__68631], true)
      }else {
        if("\ufdd0'else") {
          return not_found
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_without = function(shift, hash, key) {
  var this__68632 = this;
  var inode__68633 = this;
  var bit__68634 = 1 << (hash >>> shift & 31);
  if((this__68632.bitmap & bit__68634) === 0) {
    return inode__68633
  }else {
    var idx__68635 = cljs.core.bitmap_indexed_node_index.call(null, this__68632.bitmap, bit__68634);
    var key_or_nil__68636 = this__68632.arr[2 * idx__68635];
    var val_or_node__68637 = this__68632.arr[2 * idx__68635 + 1];
    if(key_or_nil__68636 == null) {
      var n__68638 = val_or_node__68637.inode_without(shift + 5, hash, key);
      if(n__68638 === val_or_node__68637) {
        return inode__68633
      }else {
        if(!(n__68638 == null)) {
          return new cljs.core.BitmapIndexedNode(null, this__68632.bitmap, cljs.core.clone_and_set.call(null, this__68632.arr, 2 * idx__68635 + 1, n__68638))
        }else {
          if(this__68632.bitmap === bit__68634) {
            return null
          }else {
            if("\ufdd0'else") {
              return new cljs.core.BitmapIndexedNode(null, this__68632.bitmap ^ bit__68634, cljs.core.remove_pair.call(null, this__68632.arr, idx__68635))
            }else {
              return null
            }
          }
        }
      }
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__68636)) {
        return new cljs.core.BitmapIndexedNode(null, this__68632.bitmap ^ bit__68634, cljs.core.remove_pair.call(null, this__68632.arr, idx__68635))
      }else {
        if("\ufdd0'else") {
          return inode__68633
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_assoc = function(shift, hash, key, val, added_leaf_QMARK_) {
  var this__68639 = this;
  var inode__68640 = this;
  var bit__68641 = 1 << (hash >>> shift & 31);
  var idx__68642 = cljs.core.bitmap_indexed_node_index.call(null, this__68639.bitmap, bit__68641);
  if((this__68639.bitmap & bit__68641) === 0) {
    var n__68643 = cljs.core.bit_count.call(null, this__68639.bitmap);
    if(n__68643 >= 16) {
      var nodes__68644 = cljs.core.make_array.call(null, 32);
      var jdx__68645 = hash >>> shift & 31;
      nodes__68644[jdx__68645] = cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_);
      var i__68646 = 0;
      var j__68647 = 0;
      while(true) {
        if(i__68646 < 32) {
          if((this__68639.bitmap >>> i__68646 & 1) === 0) {
            var G__68662 = i__68646 + 1;
            var G__68663 = j__68647;
            i__68646 = G__68662;
            j__68647 = G__68663;
            continue
          }else {
            nodes__68644[i__68646] = !(this__68639.arr[j__68647] == null) ? cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift + 5, cljs.core.hash.call(null, this__68639.arr[j__68647]), this__68639.arr[j__68647], this__68639.arr[j__68647 + 1], added_leaf_QMARK_) : this__68639.arr[j__68647 + 1];
            var G__68664 = i__68646 + 1;
            var G__68665 = j__68647 + 2;
            i__68646 = G__68664;
            j__68647 = G__68665;
            continue
          }
        }else {
        }
        break
      }
      return new cljs.core.ArrayNode(null, n__68643 + 1, nodes__68644)
    }else {
      var new_arr__68648 = cljs.core.make_array.call(null, 2 * (n__68643 + 1));
      cljs.core.array_copy.call(null, this__68639.arr, 0, new_arr__68648, 0, 2 * idx__68642);
      new_arr__68648[2 * idx__68642] = key;
      new_arr__68648[2 * idx__68642 + 1] = val;
      cljs.core.array_copy.call(null, this__68639.arr, 2 * idx__68642, new_arr__68648, 2 * (idx__68642 + 1), 2 * (n__68643 - idx__68642));
      added_leaf_QMARK_.val = true;
      return new cljs.core.BitmapIndexedNode(null, this__68639.bitmap | bit__68641, new_arr__68648)
    }
  }else {
    var key_or_nil__68649 = this__68639.arr[2 * idx__68642];
    var val_or_node__68650 = this__68639.arr[2 * idx__68642 + 1];
    if(key_or_nil__68649 == null) {
      var n__68651 = val_or_node__68650.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_);
      if(n__68651 === val_or_node__68650) {
        return inode__68640
      }else {
        return new cljs.core.BitmapIndexedNode(null, this__68639.bitmap, cljs.core.clone_and_set.call(null, this__68639.arr, 2 * idx__68642 + 1, n__68651))
      }
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__68649)) {
        if(val === val_or_node__68650) {
          return inode__68640
        }else {
          return new cljs.core.BitmapIndexedNode(null, this__68639.bitmap, cljs.core.clone_and_set.call(null, this__68639.arr, 2 * idx__68642 + 1, val))
        }
      }else {
        if("\ufdd0'else") {
          added_leaf_QMARK_.val = true;
          return new cljs.core.BitmapIndexedNode(null, this__68639.bitmap, cljs.core.clone_and_set.call(null, this__68639.arr, 2 * idx__68642, null, 2 * idx__68642 + 1, cljs.core.create_node.call(null, shift + 5, key_or_nil__68649, val_or_node__68650, hash, key, val)))
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_lookup = function(shift, hash, key, not_found) {
  var this__68652 = this;
  var inode__68653 = this;
  var bit__68654 = 1 << (hash >>> shift & 31);
  if((this__68652.bitmap & bit__68654) === 0) {
    return not_found
  }else {
    var idx__68655 = cljs.core.bitmap_indexed_node_index.call(null, this__68652.bitmap, bit__68654);
    var key_or_nil__68656 = this__68652.arr[2 * idx__68655];
    var val_or_node__68657 = this__68652.arr[2 * idx__68655 + 1];
    if(key_or_nil__68656 == null) {
      return val_or_node__68657.inode_lookup(shift + 5, hash, key, not_found)
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__68656)) {
        return val_or_node__68657
      }else {
        if("\ufdd0'else") {
          return not_found
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode;
cljs.core.BitmapIndexedNode.EMPTY = new cljs.core.BitmapIndexedNode(null, 0, cljs.core.make_array.call(null, 0));
cljs.core.pack_array_node = function pack_array_node(array_node, edit, idx) {
  var arr__68673 = array_node.arr;
  var len__68674 = 2 * (array_node.cnt - 1);
  var new_arr__68675 = cljs.core.make_array.call(null, len__68674);
  var i__68676 = 0;
  var j__68677 = 1;
  var bitmap__68678 = 0;
  while(true) {
    if(i__68676 < len__68674) {
      if(function() {
        var and__3822__auto____68679 = !(i__68676 === idx);
        if(and__3822__auto____68679) {
          return!(arr__68673[i__68676] == null)
        }else {
          return and__3822__auto____68679
        }
      }()) {
        new_arr__68675[j__68677] = arr__68673[i__68676];
        var G__68680 = i__68676 + 1;
        var G__68681 = j__68677 + 2;
        var G__68682 = bitmap__68678 | 1 << i__68676;
        i__68676 = G__68680;
        j__68677 = G__68681;
        bitmap__68678 = G__68682;
        continue
      }else {
        var G__68683 = i__68676 + 1;
        var G__68684 = j__68677;
        var G__68685 = bitmap__68678;
        i__68676 = G__68683;
        j__68677 = G__68684;
        bitmap__68678 = G__68685;
        continue
      }
    }else {
      return new cljs.core.BitmapIndexedNode(edit, bitmap__68678, new_arr__68675)
    }
    break
  }
};
cljs.core.ArrayNode = function(edit, cnt, arr) {
  this.edit = edit;
  this.cnt = cnt;
  this.arr = arr
};
cljs.core.ArrayNode.cljs$lang$type = true;
cljs.core.ArrayNode.cljs$lang$ctorPrSeq = function(this__2343__auto__) {
  return cljs.core.list.call(null, "cljs.core/ArrayNode")
};
cljs.core.ArrayNode.prototype.inode_assoc_BANG_ = function(edit, shift, hash, key, val, added_leaf_QMARK_) {
  var this__68686 = this;
  var inode__68687 = this;
  var idx__68688 = hash >>> shift & 31;
  var node__68689 = this__68686.arr[idx__68688];
  if(node__68689 == null) {
    var editable__68690 = cljs.core.edit_and_set.call(null, inode__68687, edit, idx__68688, cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_));
    editable__68690.cnt = editable__68690.cnt + 1;
    return editable__68690
  }else {
    var n__68691 = node__68689.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_);
    if(n__68691 === node__68689) {
      return inode__68687
    }else {
      return cljs.core.edit_and_set.call(null, inode__68687, edit, idx__68688, n__68691)
    }
  }
};
cljs.core.ArrayNode.prototype.inode_seq = function() {
  var this__68692 = this;
  var inode__68693 = this;
  return cljs.core.create_array_node_seq.call(null, this__68692.arr)
};
cljs.core.ArrayNode.prototype.inode_without_BANG_ = function(edit, shift, hash, key, removed_leaf_QMARK_) {
  var this__68694 = this;
  var inode__68695 = this;
  var idx__68696 = hash >>> shift & 31;
  var node__68697 = this__68694.arr[idx__68696];
  if(node__68697 == null) {
    return inode__68695
  }else {
    var n__68698 = node__68697.inode_without_BANG_(edit, shift + 5, hash, key, removed_leaf_QMARK_);
    if(n__68698 === node__68697) {
      return inode__68695
    }else {
      if(n__68698 == null) {
        if(this__68694.cnt <= 8) {
          return cljs.core.pack_array_node.call(null, inode__68695, edit, idx__68696)
        }else {
          var editable__68699 = cljs.core.edit_and_set.call(null, inode__68695, edit, idx__68696, n__68698);
          editable__68699.cnt = editable__68699.cnt - 1;
          return editable__68699
        }
      }else {
        if("\ufdd0'else") {
          return cljs.core.edit_and_set.call(null, inode__68695, edit, idx__68696, n__68698)
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.ArrayNode.prototype.ensure_editable = function(e) {
  var this__68700 = this;
  var inode__68701 = this;
  if(e === this__68700.edit) {
    return inode__68701
  }else {
    return new cljs.core.ArrayNode(e, this__68700.cnt, this__68700.arr.slice())
  }
};
cljs.core.ArrayNode.prototype.kv_reduce = function(f, init) {
  var this__68702 = this;
  var inode__68703 = this;
  var len__68704 = this__68702.arr.length;
  var i__68705 = 0;
  var init__68706 = init;
  while(true) {
    if(i__68705 < len__68704) {
      var node__68707 = this__68702.arr[i__68705];
      if(!(node__68707 == null)) {
        var init__68708 = node__68707.kv_reduce(f, init__68706);
        if(cljs.core.reduced_QMARK_.call(null, init__68708)) {
          return cljs.core.deref.call(null, init__68708)
        }else {
          var G__68727 = i__68705 + 1;
          var G__68728 = init__68708;
          i__68705 = G__68727;
          init__68706 = G__68728;
          continue
        }
      }else {
        return null
      }
    }else {
      return init__68706
    }
    break
  }
};
cljs.core.ArrayNode.prototype.inode_find = function(shift, hash, key, not_found) {
  var this__68709 = this;
  var inode__68710 = this;
  var idx__68711 = hash >>> shift & 31;
  var node__68712 = this__68709.arr[idx__68711];
  if(!(node__68712 == null)) {
    return node__68712.inode_find(shift + 5, hash, key, not_found)
  }else {
    return not_found
  }
};
cljs.core.ArrayNode.prototype.inode_without = function(shift, hash, key) {
  var this__68713 = this;
  var inode__68714 = this;
  var idx__68715 = hash >>> shift & 31;
  var node__68716 = this__68713.arr[idx__68715];
  if(!(node__68716 == null)) {
    var n__68717 = node__68716.inode_without(shift + 5, hash, key);
    if(n__68717 === node__68716) {
      return inode__68714
    }else {
      if(n__68717 == null) {
        if(this__68713.cnt <= 8) {
          return cljs.core.pack_array_node.call(null, inode__68714, null, idx__68715)
        }else {
          return new cljs.core.ArrayNode(null, this__68713.cnt - 1, cljs.core.clone_and_set.call(null, this__68713.arr, idx__68715, n__68717))
        }
      }else {
        if("\ufdd0'else") {
          return new cljs.core.ArrayNode(null, this__68713.cnt, cljs.core.clone_and_set.call(null, this__68713.arr, idx__68715, n__68717))
        }else {
          return null
        }
      }
    }
  }else {
    return inode__68714
  }
};
cljs.core.ArrayNode.prototype.inode_assoc = function(shift, hash, key, val, added_leaf_QMARK_) {
  var this__68718 = this;
  var inode__68719 = this;
  var idx__68720 = hash >>> shift & 31;
  var node__68721 = this__68718.arr[idx__68720];
  if(node__68721 == null) {
    return new cljs.core.ArrayNode(null, this__68718.cnt + 1, cljs.core.clone_and_set.call(null, this__68718.arr, idx__68720, cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_)))
  }else {
    var n__68722 = node__68721.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_);
    if(n__68722 === node__68721) {
      return inode__68719
    }else {
      return new cljs.core.ArrayNode(null, this__68718.cnt, cljs.core.clone_and_set.call(null, this__68718.arr, idx__68720, n__68722))
    }
  }
};
cljs.core.ArrayNode.prototype.inode_lookup = function(shift, hash, key, not_found) {
  var this__68723 = this;
  var inode__68724 = this;
  var idx__68725 = hash >>> shift & 31;
  var node__68726 = this__68723.arr[idx__68725];
  if(!(node__68726 == null)) {
    return node__68726.inode_lookup(shift + 5, hash, key, not_found)
  }else {
    return not_found
  }
};
cljs.core.ArrayNode;
cljs.core.hash_collision_node_find_index = function hash_collision_node_find_index(arr, cnt, key) {
  var lim__68731 = 2 * cnt;
  var i__68732 = 0;
  while(true) {
    if(i__68732 < lim__68731) {
      if(cljs.core.key_test.call(null, key, arr[i__68732])) {
        return i__68732
      }else {
        var G__68733 = i__68732 + 2;
        i__68732 = G__68733;
        continue
      }
    }else {
      return-1
    }
    break
  }
};
cljs.core.HashCollisionNode = function(edit, collision_hash, cnt, arr) {
  this.edit = edit;
  this.collision_hash = collision_hash;
  this.cnt = cnt;
  this.arr = arr
};
cljs.core.HashCollisionNode.cljs$lang$type = true;
cljs.core.HashCollisionNode.cljs$lang$ctorPrSeq = function(this__2343__auto__) {
  return cljs.core.list.call(null, "cljs.core/HashCollisionNode")
};
cljs.core.HashCollisionNode.prototype.inode_assoc_BANG_ = function(edit, shift, hash, key, val, added_leaf_QMARK_) {
  var this__68734 = this;
  var inode__68735 = this;
  if(hash === this__68734.collision_hash) {
    var idx__68736 = cljs.core.hash_collision_node_find_index.call(null, this__68734.arr, this__68734.cnt, key);
    if(idx__68736 === -1) {
      if(this__68734.arr.length > 2 * this__68734.cnt) {
        var editable__68737 = cljs.core.edit_and_set.call(null, inode__68735, edit, 2 * this__68734.cnt, key, 2 * this__68734.cnt + 1, val);
        added_leaf_QMARK_.val = true;
        editable__68737.cnt = editable__68737.cnt + 1;
        return editable__68737
      }else {
        var len__68738 = this__68734.arr.length;
        var new_arr__68739 = cljs.core.make_array.call(null, len__68738 + 2);
        cljs.core.array_copy.call(null, this__68734.arr, 0, new_arr__68739, 0, len__68738);
        new_arr__68739[len__68738] = key;
        new_arr__68739[len__68738 + 1] = val;
        added_leaf_QMARK_.val = true;
        return inode__68735.ensure_editable_array(edit, this__68734.cnt + 1, new_arr__68739)
      }
    }else {
      if(this__68734.arr[idx__68736 + 1] === val) {
        return inode__68735
      }else {
        return cljs.core.edit_and_set.call(null, inode__68735, edit, idx__68736 + 1, val)
      }
    }
  }else {
    return(new cljs.core.BitmapIndexedNode(edit, 1 << (this__68734.collision_hash >>> shift & 31), [null, inode__68735, null, null])).inode_assoc_BANG_(edit, shift, hash, key, val, added_leaf_QMARK_)
  }
};
cljs.core.HashCollisionNode.prototype.inode_seq = function() {
  var this__68740 = this;
  var inode__68741 = this;
  return cljs.core.create_inode_seq.call(null, this__68740.arr)
};
cljs.core.HashCollisionNode.prototype.inode_without_BANG_ = function(edit, shift, hash, key, removed_leaf_QMARK_) {
  var this__68742 = this;
  var inode__68743 = this;
  var idx__68744 = cljs.core.hash_collision_node_find_index.call(null, this__68742.arr, this__68742.cnt, key);
  if(idx__68744 === -1) {
    return inode__68743
  }else {
    removed_leaf_QMARK_[0] = true;
    if(this__68742.cnt === 1) {
      return null
    }else {
      var editable__68745 = inode__68743.ensure_editable(edit);
      var earr__68746 = editable__68745.arr;
      earr__68746[idx__68744] = earr__68746[2 * this__68742.cnt - 2];
      earr__68746[idx__68744 + 1] = earr__68746[2 * this__68742.cnt - 1];
      earr__68746[2 * this__68742.cnt - 1] = null;
      earr__68746[2 * this__68742.cnt - 2] = null;
      editable__68745.cnt = editable__68745.cnt - 1;
      return editable__68745
    }
  }
};
cljs.core.HashCollisionNode.prototype.ensure_editable = function(e) {
  var this__68747 = this;
  var inode__68748 = this;
  if(e === this__68747.edit) {
    return inode__68748
  }else {
    var new_arr__68749 = cljs.core.make_array.call(null, 2 * (this__68747.cnt + 1));
    cljs.core.array_copy.call(null, this__68747.arr, 0, new_arr__68749, 0, 2 * this__68747.cnt);
    return new cljs.core.HashCollisionNode(e, this__68747.collision_hash, this__68747.cnt, new_arr__68749)
  }
};
cljs.core.HashCollisionNode.prototype.kv_reduce = function(f, init) {
  var this__68750 = this;
  var inode__68751 = this;
  return cljs.core.inode_kv_reduce.call(null, this__68750.arr, f, init)
};
cljs.core.HashCollisionNode.prototype.inode_find = function(shift, hash, key, not_found) {
  var this__68752 = this;
  var inode__68753 = this;
  var idx__68754 = cljs.core.hash_collision_node_find_index.call(null, this__68752.arr, this__68752.cnt, key);
  if(idx__68754 < 0) {
    return not_found
  }else {
    if(cljs.core.key_test.call(null, key, this__68752.arr[idx__68754])) {
      return cljs.core.PersistentVector.fromArray([this__68752.arr[idx__68754], this__68752.arr[idx__68754 + 1]], true)
    }else {
      if("\ufdd0'else") {
        return not_found
      }else {
        return null
      }
    }
  }
};
cljs.core.HashCollisionNode.prototype.inode_without = function(shift, hash, key) {
  var this__68755 = this;
  var inode__68756 = this;
  var idx__68757 = cljs.core.hash_collision_node_find_index.call(null, this__68755.arr, this__68755.cnt, key);
  if(idx__68757 === -1) {
    return inode__68756
  }else {
    if(this__68755.cnt === 1) {
      return null
    }else {
      if("\ufdd0'else") {
        return new cljs.core.HashCollisionNode(null, this__68755.collision_hash, this__68755.cnt - 1, cljs.core.remove_pair.call(null, this__68755.arr, cljs.core.quot.call(null, idx__68757, 2)))
      }else {
        return null
      }
    }
  }
};
cljs.core.HashCollisionNode.prototype.inode_assoc = function(shift, hash, key, val, added_leaf_QMARK_) {
  var this__68758 = this;
  var inode__68759 = this;
  if(hash === this__68758.collision_hash) {
    var idx__68760 = cljs.core.hash_collision_node_find_index.call(null, this__68758.arr, this__68758.cnt, key);
    if(idx__68760 === -1) {
      var len__68761 = this__68758.arr.length;
      var new_arr__68762 = cljs.core.make_array.call(null, len__68761 + 2);
      cljs.core.array_copy.call(null, this__68758.arr, 0, new_arr__68762, 0, len__68761);
      new_arr__68762[len__68761] = key;
      new_arr__68762[len__68761 + 1] = val;
      added_leaf_QMARK_.val = true;
      return new cljs.core.HashCollisionNode(null, this__68758.collision_hash, this__68758.cnt + 1, new_arr__68762)
    }else {
      if(cljs.core._EQ_.call(null, this__68758.arr[idx__68760], val)) {
        return inode__68759
      }else {
        return new cljs.core.HashCollisionNode(null, this__68758.collision_hash, this__68758.cnt, cljs.core.clone_and_set.call(null, this__68758.arr, idx__68760 + 1, val))
      }
    }
  }else {
    return(new cljs.core.BitmapIndexedNode(null, 1 << (this__68758.collision_hash >>> shift & 31), [null, inode__68759])).inode_assoc(shift, hash, key, val, added_leaf_QMARK_)
  }
};
cljs.core.HashCollisionNode.prototype.inode_lookup = function(shift, hash, key, not_found) {
  var this__68763 = this;
  var inode__68764 = this;
  var idx__68765 = cljs.core.hash_collision_node_find_index.call(null, this__68763.arr, this__68763.cnt, key);
  if(idx__68765 < 0) {
    return not_found
  }else {
    if(cljs.core.key_test.call(null, key, this__68763.arr[idx__68765])) {
      return this__68763.arr[idx__68765 + 1]
    }else {
      if("\ufdd0'else") {
        return not_found
      }else {
        return null
      }
    }
  }
};
cljs.core.HashCollisionNode.prototype.ensure_editable_array = function(e, count, array) {
  var this__68766 = this;
  var inode__68767 = this;
  if(e === this__68766.edit) {
    this__68766.arr = array;
    this__68766.cnt = count;
    return inode__68767
  }else {
    return new cljs.core.HashCollisionNode(this__68766.edit, this__68766.collision_hash, count, array)
  }
};
cljs.core.HashCollisionNode;
cljs.core.create_node = function() {
  var create_node = null;
  var create_node__6 = function(shift, key1, val1, key2hash, key2, val2) {
    var key1hash__68772 = cljs.core.hash.call(null, key1);
    if(key1hash__68772 === key2hash) {
      return new cljs.core.HashCollisionNode(null, key1hash__68772, 2, [key1, val1, key2, val2])
    }else {
      var added_leaf_QMARK___68773 = new cljs.core.Box(false);
      return cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift, key1hash__68772, key1, val1, added_leaf_QMARK___68773).inode_assoc(shift, key2hash, key2, val2, added_leaf_QMARK___68773)
    }
  };
  var create_node__7 = function(edit, shift, key1, val1, key2hash, key2, val2) {
    var key1hash__68774 = cljs.core.hash.call(null, key1);
    if(key1hash__68774 === key2hash) {
      return new cljs.core.HashCollisionNode(null, key1hash__68774, 2, [key1, val1, key2, val2])
    }else {
      var added_leaf_QMARK___68775 = new cljs.core.Box(false);
      return cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift, key1hash__68774, key1, val1, added_leaf_QMARK___68775).inode_assoc_BANG_(edit, shift, key2hash, key2, val2, added_leaf_QMARK___68775)
    }
  };
  create_node = function(edit, shift, key1, val1, key2hash, key2, val2) {
    switch(arguments.length) {
      case 6:
        return create_node__6.call(this, edit, shift, key1, val1, key2hash, key2);
      case 7:
        return create_node__7.call(this, edit, shift, key1, val1, key2hash, key2, val2)
    }
    throw"Invalid arity: " + arguments.length;
  };
  create_node.cljs$lang$arity$6 = create_node__6;
  create_node.cljs$lang$arity$7 = create_node__7;
  return create_node
}();
cljs.core.NodeSeq = function(meta, nodes, i, s, __hash) {
  this.meta = meta;
  this.nodes = nodes;
  this.i = i;
  this.s = s;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31850572
};
cljs.core.NodeSeq.cljs$lang$type = true;
cljs.core.NodeSeq.cljs$lang$ctorPrSeq = function(this__2343__auto__) {
  return cljs.core.list.call(null, "cljs.core/NodeSeq")
};
cljs.core.NodeSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__68776 = this;
  var h__2226__auto____68777 = this__68776.__hash;
  if(!(h__2226__auto____68777 == null)) {
    return h__2226__auto____68777
  }else {
    var h__2226__auto____68778 = cljs.core.hash_coll.call(null, coll);
    this__68776.__hash = h__2226__auto____68778;
    return h__2226__auto____68778
  }
};
cljs.core.NodeSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__68779 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.NodeSeq.prototype.toString = function() {
  var this__68780 = this;
  var this__68781 = this;
  return cljs.core.pr_str.call(null, this__68781)
};
cljs.core.NodeSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__68782 = this;
  return this$
};
cljs.core.NodeSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__68783 = this;
  if(this__68783.s == null) {
    return cljs.core.PersistentVector.fromArray([this__68783.nodes[this__68783.i], this__68783.nodes[this__68783.i + 1]], true)
  }else {
    return cljs.core.first.call(null, this__68783.s)
  }
};
cljs.core.NodeSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__68784 = this;
  if(this__68784.s == null) {
    return cljs.core.create_inode_seq.call(null, this__68784.nodes, this__68784.i + 2, null)
  }else {
    return cljs.core.create_inode_seq.call(null, this__68784.nodes, this__68784.i, cljs.core.next.call(null, this__68784.s))
  }
};
cljs.core.NodeSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__68785 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.NodeSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__68786 = this;
  return new cljs.core.NodeSeq(meta, this__68786.nodes, this__68786.i, this__68786.s, this__68786.__hash)
};
cljs.core.NodeSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__68787 = this;
  return this__68787.meta
};
cljs.core.NodeSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__68788 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__68788.meta)
};
cljs.core.NodeSeq;
cljs.core.create_inode_seq = function() {
  var create_inode_seq = null;
  var create_inode_seq__1 = function(nodes) {
    return create_inode_seq.call(null, nodes, 0, null)
  };
  var create_inode_seq__3 = function(nodes, i, s) {
    if(s == null) {
      var len__68795 = nodes.length;
      var j__68796 = i;
      while(true) {
        if(j__68796 < len__68795) {
          if(!(nodes[j__68796] == null)) {
            return new cljs.core.NodeSeq(null, nodes, j__68796, null, null)
          }else {
            var temp__3971__auto____68797 = nodes[j__68796 + 1];
            if(cljs.core.truth_(temp__3971__auto____68797)) {
              var node__68798 = temp__3971__auto____68797;
              var temp__3971__auto____68799 = node__68798.inode_seq();
              if(cljs.core.truth_(temp__3971__auto____68799)) {
                var node_seq__68800 = temp__3971__auto____68799;
                return new cljs.core.NodeSeq(null, nodes, j__68796 + 2, node_seq__68800, null)
              }else {
                var G__68801 = j__68796 + 2;
                j__68796 = G__68801;
                continue
              }
            }else {
              var G__68802 = j__68796 + 2;
              j__68796 = G__68802;
              continue
            }
          }
        }else {
          return null
        }
        break
      }
    }else {
      return new cljs.core.NodeSeq(null, nodes, i, s, null)
    }
  };
  create_inode_seq = function(nodes, i, s) {
    switch(arguments.length) {
      case 1:
        return create_inode_seq__1.call(this, nodes);
      case 3:
        return create_inode_seq__3.call(this, nodes, i, s)
    }
    throw"Invalid arity: " + arguments.length;
  };
  create_inode_seq.cljs$lang$arity$1 = create_inode_seq__1;
  create_inode_seq.cljs$lang$arity$3 = create_inode_seq__3;
  return create_inode_seq
}();
cljs.core.ArrayNodeSeq = function(meta, nodes, i, s, __hash) {
  this.meta = meta;
  this.nodes = nodes;
  this.i = i;
  this.s = s;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31850572
};
cljs.core.ArrayNodeSeq.cljs$lang$type = true;
cljs.core.ArrayNodeSeq.cljs$lang$ctorPrSeq = function(this__2343__auto__) {
  return cljs.core.list.call(null, "cljs.core/ArrayNodeSeq")
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__68803 = this;
  var h__2226__auto____68804 = this__68803.__hash;
  if(!(h__2226__auto____68804 == null)) {
    return h__2226__auto____68804
  }else {
    var h__2226__auto____68805 = cljs.core.hash_coll.call(null, coll);
    this__68803.__hash = h__2226__auto____68805;
    return h__2226__auto____68805
  }
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__68806 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.ArrayNodeSeq.prototype.toString = function() {
  var this__68807 = this;
  var this__68808 = this;
  return cljs.core.pr_str.call(null, this__68808)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__68809 = this;
  return this$
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__68810 = this;
  return cljs.core.first.call(null, this__68810.s)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__68811 = this;
  return cljs.core.create_array_node_seq.call(null, null, this__68811.nodes, this__68811.i, cljs.core.next.call(null, this__68811.s))
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__68812 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__68813 = this;
  return new cljs.core.ArrayNodeSeq(meta, this__68813.nodes, this__68813.i, this__68813.s, this__68813.__hash)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__68814 = this;
  return this__68814.meta
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__68815 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__68815.meta)
};
cljs.core.ArrayNodeSeq;
cljs.core.create_array_node_seq = function() {
  var create_array_node_seq = null;
  var create_array_node_seq__1 = function(nodes) {
    return create_array_node_seq.call(null, null, nodes, 0, null)
  };
  var create_array_node_seq__4 = function(meta, nodes, i, s) {
    if(s == null) {
      var len__68822 = nodes.length;
      var j__68823 = i;
      while(true) {
        if(j__68823 < len__68822) {
          var temp__3971__auto____68824 = nodes[j__68823];
          if(cljs.core.truth_(temp__3971__auto____68824)) {
            var nj__68825 = temp__3971__auto____68824;
            var temp__3971__auto____68826 = nj__68825.inode_seq();
            if(cljs.core.truth_(temp__3971__auto____68826)) {
              var ns__68827 = temp__3971__auto____68826;
              return new cljs.core.ArrayNodeSeq(meta, nodes, j__68823 + 1, ns__68827, null)
            }else {
              var G__68828 = j__68823 + 1;
              j__68823 = G__68828;
              continue
            }
          }else {
            var G__68829 = j__68823 + 1;
            j__68823 = G__68829;
            continue
          }
        }else {
          return null
        }
        break
      }
    }else {
      return new cljs.core.ArrayNodeSeq(meta, nodes, i, s, null)
    }
  };
  create_array_node_seq = function(meta, nodes, i, s) {
    switch(arguments.length) {
      case 1:
        return create_array_node_seq__1.call(this, meta);
      case 4:
        return create_array_node_seq__4.call(this, meta, nodes, i, s)
    }
    throw"Invalid arity: " + arguments.length;
  };
  create_array_node_seq.cljs$lang$arity$1 = create_array_node_seq__1;
  create_array_node_seq.cljs$lang$arity$4 = create_array_node_seq__4;
  return create_array_node_seq
}();
cljs.core.PersistentHashMap = function(meta, cnt, root, has_nil_QMARK_, nil_val, __hash) {
  this.meta = meta;
  this.cnt = cnt;
  this.root = root;
  this.has_nil_QMARK_ = has_nil_QMARK_;
  this.nil_val = nil_val;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 1;
  this.cljs$lang$protocol_mask$partition0$ = 16123663
};
cljs.core.PersistentHashMap.cljs$lang$type = true;
cljs.core.PersistentHashMap.cljs$lang$ctorPrSeq = function(this__2343__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentHashMap")
};
cljs.core.PersistentHashMap.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var this__68832 = this;
  return new cljs.core.TransientHashMap({}, this__68832.root, this__68832.cnt, this__68832.has_nil_QMARK_, this__68832.nil_val)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__68833 = this;
  var h__2226__auto____68834 = this__68833.__hash;
  if(!(h__2226__auto____68834 == null)) {
    return h__2226__auto____68834
  }else {
    var h__2226__auto____68835 = cljs.core.hash_imap.call(null, coll);
    this__68833.__hash = h__2226__auto____68835;
    return h__2226__auto____68835
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__68836 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.PersistentHashMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__68837 = this;
  if(k == null) {
    if(this__68837.has_nil_QMARK_) {
      return this__68837.nil_val
    }else {
      return not_found
    }
  }else {
    if(this__68837.root == null) {
      return not_found
    }else {
      if("\ufdd0'else") {
        return this__68837.root.inode_lookup(0, cljs.core.hash.call(null, k), k, not_found)
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__68838 = this;
  if(k == null) {
    if(function() {
      var and__3822__auto____68839 = this__68838.has_nil_QMARK_;
      if(and__3822__auto____68839) {
        return v === this__68838.nil_val
      }else {
        return and__3822__auto____68839
      }
    }()) {
      return coll
    }else {
      return new cljs.core.PersistentHashMap(this__68838.meta, this__68838.has_nil_QMARK_ ? this__68838.cnt : this__68838.cnt + 1, this__68838.root, true, v, null)
    }
  }else {
    var added_leaf_QMARK___68840 = new cljs.core.Box(false);
    var new_root__68841 = (this__68838.root == null ? cljs.core.BitmapIndexedNode.EMPTY : this__68838.root).inode_assoc(0, cljs.core.hash.call(null, k), k, v, added_leaf_QMARK___68840);
    if(new_root__68841 === this__68838.root) {
      return coll
    }else {
      return new cljs.core.PersistentHashMap(this__68838.meta, added_leaf_QMARK___68840.val ? this__68838.cnt + 1 : this__68838.cnt, new_root__68841, this__68838.has_nil_QMARK_, this__68838.nil_val, null)
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__68842 = this;
  if(k == null) {
    return this__68842.has_nil_QMARK_
  }else {
    if(this__68842.root == null) {
      return false
    }else {
      if("\ufdd0'else") {
        return!(this__68842.root.inode_lookup(0, cljs.core.hash.call(null, k), k, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel)
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap.prototype.call = function() {
  var G__68865 = null;
  var G__68865__2 = function(this_sym68843, k) {
    var this__68845 = this;
    var this_sym68843__68846 = this;
    var coll__68847 = this_sym68843__68846;
    return coll__68847.cljs$core$ILookup$_lookup$arity$2(coll__68847, k)
  };
  var G__68865__3 = function(this_sym68844, k, not_found) {
    var this__68845 = this;
    var this_sym68844__68848 = this;
    var coll__68849 = this_sym68844__68848;
    return coll__68849.cljs$core$ILookup$_lookup$arity$3(coll__68849, k, not_found)
  };
  G__68865 = function(this_sym68844, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__68865__2.call(this, this_sym68844, k);
      case 3:
        return G__68865__3.call(this, this_sym68844, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__68865
}();
cljs.core.PersistentHashMap.prototype.apply = function(this_sym68830, args68831) {
  var this__68850 = this;
  return this_sym68830.call.apply(this_sym68830, [this_sym68830].concat(args68831.slice()))
};
cljs.core.PersistentHashMap.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(coll, f, init) {
  var this__68851 = this;
  var init__68852 = this__68851.has_nil_QMARK_ ? f.call(null, init, null, this__68851.nil_val) : init;
  if(cljs.core.reduced_QMARK_.call(null, init__68852)) {
    return cljs.core.deref.call(null, init__68852)
  }else {
    if(!(this__68851.root == null)) {
      return this__68851.root.kv_reduce(f, init__68852)
    }else {
      if("\ufdd0'else") {
        return init__68852
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__68853 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.PersistentHashMap.prototype.toString = function() {
  var this__68854 = this;
  var this__68855 = this;
  return cljs.core.pr_str.call(null, this__68855)
};
cljs.core.PersistentHashMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__68856 = this;
  if(this__68856.cnt > 0) {
    var s__68857 = !(this__68856.root == null) ? this__68856.root.inode_seq() : null;
    if(this__68856.has_nil_QMARK_) {
      return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([null, this__68856.nil_val], true), s__68857)
    }else {
      return s__68857
    }
  }else {
    return null
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__68858 = this;
  return this__68858.cnt
};
cljs.core.PersistentHashMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__68859 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__68860 = this;
  return new cljs.core.PersistentHashMap(meta, this__68860.cnt, this__68860.root, this__68860.has_nil_QMARK_, this__68860.nil_val, this__68860.__hash)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__68861 = this;
  return this__68861.meta
};
cljs.core.PersistentHashMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__68862 = this;
  return cljs.core._with_meta.call(null, cljs.core.PersistentHashMap.EMPTY, this__68862.meta)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__68863 = this;
  if(k == null) {
    if(this__68863.has_nil_QMARK_) {
      return new cljs.core.PersistentHashMap(this__68863.meta, this__68863.cnt - 1, this__68863.root, false, null, null)
    }else {
      return coll
    }
  }else {
    if(this__68863.root == null) {
      return coll
    }else {
      if("\ufdd0'else") {
        var new_root__68864 = this__68863.root.inode_without(0, cljs.core.hash.call(null, k), k);
        if(new_root__68864 === this__68863.root) {
          return coll
        }else {
          return new cljs.core.PersistentHashMap(this__68863.meta, this__68863.cnt - 1, new_root__68864, this__68863.has_nil_QMARK_, this__68863.nil_val, null)
        }
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap;
cljs.core.PersistentHashMap.EMPTY = new cljs.core.PersistentHashMap(null, 0, null, false, null, 0);
cljs.core.PersistentHashMap.fromArrays = function(ks, vs) {
  var len__68866 = ks.length;
  var i__68867 = 0;
  var out__68868 = cljs.core.transient$.call(null, cljs.core.PersistentHashMap.EMPTY);
  while(true) {
    if(i__68867 < len__68866) {
      var G__68869 = i__68867 + 1;
      var G__68870 = cljs.core.assoc_BANG_.call(null, out__68868, ks[i__68867], vs[i__68867]);
      i__68867 = G__68869;
      out__68868 = G__68870;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, out__68868)
    }
    break
  }
};
cljs.core.TransientHashMap = function(edit, root, count, has_nil_QMARK_, nil_val) {
  this.edit = edit;
  this.root = root;
  this.count = count;
  this.has_nil_QMARK_ = has_nil_QMARK_;
  this.nil_val = nil_val;
  this.cljs$lang$protocol_mask$partition1$ = 14;
  this.cljs$lang$protocol_mask$partition0$ = 258
};
cljs.core.TransientHashMap.cljs$lang$type = true;
cljs.core.TransientHashMap.cljs$lang$ctorPrSeq = function(this__2343__auto__) {
  return cljs.core.list.call(null, "cljs.core/TransientHashMap")
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientMap$_dissoc_BANG_$arity$2 = function(tcoll, key) {
  var this__68871 = this;
  return tcoll.without_BANG_(key)
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3 = function(tcoll, key, val) {
  var this__68872 = this;
  return tcoll.assoc_BANG_(key, val)
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, val) {
  var this__68873 = this;
  return tcoll.conj_BANG_(val)
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__68874 = this;
  return tcoll.persistent_BANG_()
};
cljs.core.TransientHashMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(tcoll, k) {
  var this__68875 = this;
  if(k == null) {
    if(this__68875.has_nil_QMARK_) {
      return this__68875.nil_val
    }else {
      return null
    }
  }else {
    if(this__68875.root == null) {
      return null
    }else {
      return this__68875.root.inode_lookup(0, cljs.core.hash.call(null, k), k)
    }
  }
};
cljs.core.TransientHashMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(tcoll, k, not_found) {
  var this__68876 = this;
  if(k == null) {
    if(this__68876.has_nil_QMARK_) {
      return this__68876.nil_val
    }else {
      return not_found
    }
  }else {
    if(this__68876.root == null) {
      return not_found
    }else {
      return this__68876.root.inode_lookup(0, cljs.core.hash.call(null, k), k, not_found)
    }
  }
};
cljs.core.TransientHashMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__68877 = this;
  if(this__68877.edit) {
    return this__68877.count
  }else {
    throw new Error("count after persistent!");
  }
};
cljs.core.TransientHashMap.prototype.conj_BANG_ = function(o) {
  var this__68878 = this;
  var tcoll__68879 = this;
  if(this__68878.edit) {
    if(function() {
      var G__68880__68881 = o;
      if(G__68880__68881) {
        if(function() {
          var or__3824__auto____68882 = G__68880__68881.cljs$lang$protocol_mask$partition0$ & 2048;
          if(or__3824__auto____68882) {
            return or__3824__auto____68882
          }else {
            return G__68880__68881.cljs$core$IMapEntry$
          }
        }()) {
          return true
        }else {
          if(!G__68880__68881.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__68880__68881)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__68880__68881)
      }
    }()) {
      return tcoll__68879.assoc_BANG_(cljs.core.key.call(null, o), cljs.core.val.call(null, o))
    }else {
      var es__68883 = cljs.core.seq.call(null, o);
      var tcoll__68884 = tcoll__68879;
      while(true) {
        var temp__3971__auto____68885 = cljs.core.first.call(null, es__68883);
        if(cljs.core.truth_(temp__3971__auto____68885)) {
          var e__68886 = temp__3971__auto____68885;
          var G__68897 = cljs.core.next.call(null, es__68883);
          var G__68898 = tcoll__68884.assoc_BANG_(cljs.core.key.call(null, e__68886), cljs.core.val.call(null, e__68886));
          es__68883 = G__68897;
          tcoll__68884 = G__68898;
          continue
        }else {
          return tcoll__68884
        }
        break
      }
    }
  }else {
    throw new Error("conj! after persistent");
  }
};
cljs.core.TransientHashMap.prototype.assoc_BANG_ = function(k, v) {
  var this__68887 = this;
  var tcoll__68888 = this;
  if(this__68887.edit) {
    if(k == null) {
      if(this__68887.nil_val === v) {
      }else {
        this__68887.nil_val = v
      }
      if(this__68887.has_nil_QMARK_) {
      }else {
        this__68887.count = this__68887.count + 1;
        this__68887.has_nil_QMARK_ = true
      }
      return tcoll__68888
    }else {
      var added_leaf_QMARK___68889 = new cljs.core.Box(false);
      var node__68890 = (this__68887.root == null ? cljs.core.BitmapIndexedNode.EMPTY : this__68887.root).inode_assoc_BANG_(this__68887.edit, 0, cljs.core.hash.call(null, k), k, v, added_leaf_QMARK___68889);
      if(node__68890 === this__68887.root) {
      }else {
        this__68887.root = node__68890
      }
      if(added_leaf_QMARK___68889.val) {
        this__68887.count = this__68887.count + 1
      }else {
      }
      return tcoll__68888
    }
  }else {
    throw new Error("assoc! after persistent!");
  }
};
cljs.core.TransientHashMap.prototype.without_BANG_ = function(k) {
  var this__68891 = this;
  var tcoll__68892 = this;
  if(this__68891.edit) {
    if(k == null) {
      if(this__68891.has_nil_QMARK_) {
        this__68891.has_nil_QMARK_ = false;
        this__68891.nil_val = null;
        this__68891.count = this__68891.count - 1;
        return tcoll__68892
      }else {
        return tcoll__68892
      }
    }else {
      if(this__68891.root == null) {
        return tcoll__68892
      }else {
        var removed_leaf_QMARK___68893 = new cljs.core.Box(false);
        var node__68894 = this__68891.root.inode_without_BANG_(this__68891.edit, 0, cljs.core.hash.call(null, k), k, removed_leaf_QMARK___68893);
        if(node__68894 === this__68891.root) {
        }else {
          this__68891.root = node__68894
        }
        if(cljs.core.truth_(removed_leaf_QMARK___68893[0])) {
          this__68891.count = this__68891.count - 1
        }else {
        }
        return tcoll__68892
      }
    }
  }else {
    throw new Error("dissoc! after persistent!");
  }
};
cljs.core.TransientHashMap.prototype.persistent_BANG_ = function() {
  var this__68895 = this;
  var tcoll__68896 = this;
  if(this__68895.edit) {
    this__68895.edit = null;
    return new cljs.core.PersistentHashMap(null, this__68895.count, this__68895.root, this__68895.has_nil_QMARK_, this__68895.nil_val, null)
  }else {
    throw new Error("persistent! called twice");
  }
};
cljs.core.TransientHashMap;
cljs.core.tree_map_seq_push = function tree_map_seq_push(node, stack, ascending_QMARK_) {
  var t__68901 = node;
  var stack__68902 = stack;
  while(true) {
    if(!(t__68901 == null)) {
      var G__68903 = ascending_QMARK_ ? t__68901.left : t__68901.right;
      var G__68904 = cljs.core.conj.call(null, stack__68902, t__68901);
      t__68901 = G__68903;
      stack__68902 = G__68904;
      continue
    }else {
      return stack__68902
    }
    break
  }
};
cljs.core.PersistentTreeMapSeq = function(meta, stack, ascending_QMARK_, cnt, __hash) {
  this.meta = meta;
  this.stack = stack;
  this.ascending_QMARK_ = ascending_QMARK_;
  this.cnt = cnt;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31850570
};
cljs.core.PersistentTreeMapSeq.cljs$lang$type = true;
cljs.core.PersistentTreeMapSeq.cljs$lang$ctorPrSeq = function(this__2343__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentTreeMapSeq")
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__68905 = this;
  var h__2226__auto____68906 = this__68905.__hash;
  if(!(h__2226__auto____68906 == null)) {
    return h__2226__auto____68906
  }else {
    var h__2226__auto____68907 = cljs.core.hash_coll.call(null, coll);
    this__68905.__hash = h__2226__auto____68907;
    return h__2226__auto____68907
  }
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__68908 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.PersistentTreeMapSeq.prototype.toString = function() {
  var this__68909 = this;
  var this__68910 = this;
  return cljs.core.pr_str.call(null, this__68910)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__68911 = this;
  return this$
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__68912 = this;
  if(this__68912.cnt < 0) {
    return cljs.core.count.call(null, cljs.core.next.call(null, coll)) + 1
  }else {
    return this__68912.cnt
  }
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(this$) {
  var this__68913 = this;
  return cljs.core.peek.call(null, this__68913.stack)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(this$) {
  var this__68914 = this;
  var t__68915 = cljs.core.first.call(null, this__68914.stack);
  var next_stack__68916 = cljs.core.tree_map_seq_push.call(null, this__68914.ascending_QMARK_ ? t__68915.right : t__68915.left, cljs.core.next.call(null, this__68914.stack), this__68914.ascending_QMARK_);
  if(!(next_stack__68916 == null)) {
    return new cljs.core.PersistentTreeMapSeq(null, next_stack__68916, this__68914.ascending_QMARK_, this__68914.cnt - 1, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__68917 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__68918 = this;
  return new cljs.core.PersistentTreeMapSeq(meta, this__68918.stack, this__68918.ascending_QMARK_, this__68918.cnt, this__68918.__hash)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__68919 = this;
  return this__68919.meta
};
cljs.core.PersistentTreeMapSeq;
cljs.core.create_tree_map_seq = function create_tree_map_seq(tree, ascending_QMARK_, cnt) {
  return new cljs.core.PersistentTreeMapSeq(null, cljs.core.tree_map_seq_push.call(null, tree, null, ascending_QMARK_), ascending_QMARK_, cnt, null)
};
cljs.core.balance_left = function balance_left(key, val, ins, right) {
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins)) {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins.left)) {
      return new cljs.core.RedNode(ins.key, ins.val, ins.left.blacken(), new cljs.core.BlackNode(key, val, ins.right, right, null), null)
    }else {
      if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins.right)) {
        return new cljs.core.RedNode(ins.right.key, ins.right.val, new cljs.core.BlackNode(ins.key, ins.val, ins.left, ins.right.left, null), new cljs.core.BlackNode(key, val, ins.right.right, right, null), null)
      }else {
        if("\ufdd0'else") {
          return new cljs.core.BlackNode(key, val, ins, right, null)
        }else {
          return null
        }
      }
    }
  }else {
    return new cljs.core.BlackNode(key, val, ins, right, null)
  }
};
cljs.core.balance_right = function balance_right(key, val, left, ins) {
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins)) {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins.right)) {
      return new cljs.core.RedNode(ins.key, ins.val, new cljs.core.BlackNode(key, val, left, ins.left, null), ins.right.blacken(), null)
    }else {
      if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins.left)) {
        return new cljs.core.RedNode(ins.left.key, ins.left.val, new cljs.core.BlackNode(key, val, left, ins.left.left, null), new cljs.core.BlackNode(ins.key, ins.val, ins.left.right, ins.right, null), null)
      }else {
        if("\ufdd0'else") {
          return new cljs.core.BlackNode(key, val, left, ins, null)
        }else {
          return null
        }
      }
    }
  }else {
    return new cljs.core.BlackNode(key, val, left, ins, null)
  }
};
cljs.core.balance_left_del = function balance_left_del(key, val, del, right) {
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, del)) {
    return new cljs.core.RedNode(key, val, del.blacken(), right, null)
  }else {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, right)) {
      return cljs.core.balance_right.call(null, key, val, del, right.redden())
    }else {
      if(function() {
        var and__3822__auto____68921 = cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, right);
        if(and__3822__auto____68921) {
          return cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, right.left)
        }else {
          return and__3822__auto____68921
        }
      }()) {
        return new cljs.core.RedNode(right.left.key, right.left.val, new cljs.core.BlackNode(key, val, del, right.left.left, null), cljs.core.balance_right.call(null, right.key, right.val, right.left.right, right.right.redden()), null)
      }else {
        if("\ufdd0'else") {
          throw new Error("red-black tree invariant violation");
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.balance_right_del = function balance_right_del(key, val, left, del) {
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, del)) {
    return new cljs.core.RedNode(key, val, left, del.blacken(), null)
  }else {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, left)) {
      return cljs.core.balance_left.call(null, key, val, left.redden(), del)
    }else {
      if(function() {
        var and__3822__auto____68923 = cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, left);
        if(and__3822__auto____68923) {
          return cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, left.right)
        }else {
          return and__3822__auto____68923
        }
      }()) {
        return new cljs.core.RedNode(left.right.key, left.right.val, cljs.core.balance_left.call(null, left.key, left.val, left.left.redden(), left.right.left), new cljs.core.BlackNode(key, val, left.right.right, del, null), null)
      }else {
        if("\ufdd0'else") {
          throw new Error("red-black tree invariant violation");
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.tree_map_kv_reduce = function tree_map_kv_reduce(node, f, init) {
  var init__68927 = f.call(null, init, node.key, node.val);
  if(cljs.core.reduced_QMARK_.call(null, init__68927)) {
    return cljs.core.deref.call(null, init__68927)
  }else {
    var init__68928 = !(node.left == null) ? tree_map_kv_reduce.call(null, node.left, f, init__68927) : init__68927;
    if(cljs.core.reduced_QMARK_.call(null, init__68928)) {
      return cljs.core.deref.call(null, init__68928)
    }else {
      var init__68929 = !(node.right == null) ? tree_map_kv_reduce.call(null, node.right, f, init__68928) : init__68928;
      if(cljs.core.reduced_QMARK_.call(null, init__68929)) {
        return cljs.core.deref.call(null, init__68929)
      }else {
        return init__68929
      }
    }
  }
};
cljs.core.BlackNode = function(key, val, left, right, __hash) {
  this.key = key;
  this.val = val;
  this.left = left;
  this.right = right;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32402207
};
cljs.core.BlackNode.cljs$lang$type = true;
cljs.core.BlackNode.cljs$lang$ctorPrSeq = function(this__2343__auto__) {
  return cljs.core.list.call(null, "cljs.core/BlackNode")
};
cljs.core.BlackNode.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__68932 = this;
  var h__2226__auto____68933 = this__68932.__hash;
  if(!(h__2226__auto____68933 == null)) {
    return h__2226__auto____68933
  }else {
    var h__2226__auto____68934 = cljs.core.hash_coll.call(null, coll);
    this__68932.__hash = h__2226__auto____68934;
    return h__2226__auto____68934
  }
};
cljs.core.BlackNode.prototype.cljs$core$ILookup$_lookup$arity$2 = function(node, k) {
  var this__68935 = this;
  return node.cljs$core$IIndexed$_nth$arity$3(node, k, null)
};
cljs.core.BlackNode.prototype.cljs$core$ILookup$_lookup$arity$3 = function(node, k, not_found) {
  var this__68936 = this;
  return node.cljs$core$IIndexed$_nth$arity$3(node, k, not_found)
};
cljs.core.BlackNode.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(node, k, v) {
  var this__68937 = this;
  return cljs.core.assoc.call(null, cljs.core.PersistentVector.fromArray([this__68937.key, this__68937.val], true), k, v)
};
cljs.core.BlackNode.prototype.call = function() {
  var G__68985 = null;
  var G__68985__2 = function(this_sym68938, k) {
    var this__68940 = this;
    var this_sym68938__68941 = this;
    var node__68942 = this_sym68938__68941;
    return node__68942.cljs$core$ILookup$_lookup$arity$2(node__68942, k)
  };
  var G__68985__3 = function(this_sym68939, k, not_found) {
    var this__68940 = this;
    var this_sym68939__68943 = this;
    var node__68944 = this_sym68939__68943;
    return node__68944.cljs$core$ILookup$_lookup$arity$3(node__68944, k, not_found)
  };
  G__68985 = function(this_sym68939, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__68985__2.call(this, this_sym68939, k);
      case 3:
        return G__68985__3.call(this, this_sym68939, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__68985
}();
cljs.core.BlackNode.prototype.apply = function(this_sym68930, args68931) {
  var this__68945 = this;
  return this_sym68930.call.apply(this_sym68930, [this_sym68930].concat(args68931.slice()))
};
cljs.core.BlackNode.prototype.cljs$core$ICollection$_conj$arity$2 = function(node, o) {
  var this__68946 = this;
  return cljs.core.PersistentVector.fromArray([this__68946.key, this__68946.val, o], true)
};
cljs.core.BlackNode.prototype.cljs$core$IMapEntry$_key$arity$1 = function(node) {
  var this__68947 = this;
  return this__68947.key
};
cljs.core.BlackNode.prototype.cljs$core$IMapEntry$_val$arity$1 = function(node) {
  var this__68948 = this;
  return this__68948.val
};
cljs.core.BlackNode.prototype.add_right = function(ins) {
  var this__68949 = this;
  var node__68950 = this;
  return ins.balance_right(node__68950)
};
cljs.core.BlackNode.prototype.redden = function() {
  var this__68951 = this;
  var node__68952 = this;
  return new cljs.core.RedNode(this__68951.key, this__68951.val, this__68951.left, this__68951.right, null)
};
cljs.core.BlackNode.prototype.remove_right = function(del) {
  var this__68953 = this;
  var node__68954 = this;
  return cljs.core.balance_right_del.call(null, this__68953.key, this__68953.val, this__68953.left, del)
};
cljs.core.BlackNode.prototype.replace = function(key, val, left, right) {
  var this__68955 = this;
  var node__68956 = this;
  return new cljs.core.BlackNode(key, val, left, right, null)
};
cljs.core.BlackNode.prototype.kv_reduce = function(f, init) {
  var this__68957 = this;
  var node__68958 = this;
  return cljs.core.tree_map_kv_reduce.call(null, node__68958, f, init)
};
cljs.core.BlackNode.prototype.remove_left = function(del) {
  var this__68959 = this;
  var node__68960 = this;
  return cljs.core.balance_left_del.call(null, this__68959.key, this__68959.val, del, this__68959.right)
};
cljs.core.BlackNode.prototype.add_left = function(ins) {
  var this__68961 = this;
  var node__68962 = this;
  return ins.balance_left(node__68962)
};
cljs.core.BlackNode.prototype.balance_left = function(parent) {
  var this__68963 = this;
  var node__68964 = this;
  return new cljs.core.BlackNode(parent.key, parent.val, node__68964, parent.right, null)
};
cljs.core.BlackNode.prototype.toString = function() {
  var G__68986 = null;
  var G__68986__0 = function() {
    var this__68965 = this;
    var this__68967 = this;
    return cljs.core.pr_str.call(null, this__68967)
  };
  G__68986 = function() {
    switch(arguments.length) {
      case 0:
        return G__68986__0.call(this)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__68986
}();
cljs.core.BlackNode.prototype.balance_right = function(parent) {
  var this__68968 = this;
  var node__68969 = this;
  return new cljs.core.BlackNode(parent.key, parent.val, parent.left, node__68969, null)
};
cljs.core.BlackNode.prototype.blacken = function() {
  var this__68970 = this;
  var node__68971 = this;
  return node__68971
};
cljs.core.BlackNode.prototype.cljs$core$IReduce$_reduce$arity$2 = function(node, f) {
  var this__68972 = this;
  return cljs.core.ci_reduce.call(null, node, f)
};
cljs.core.BlackNode.prototype.cljs$core$IReduce$_reduce$arity$3 = function(node, f, start) {
  var this__68973 = this;
  return cljs.core.ci_reduce.call(null, node, f, start)
};
cljs.core.BlackNode.prototype.cljs$core$ISeqable$_seq$arity$1 = function(node) {
  var this__68974 = this;
  return cljs.core.list.call(null, this__68974.key, this__68974.val)
};
cljs.core.BlackNode.prototype.cljs$core$ICounted$_count$arity$1 = function(node) {
  var this__68975 = this;
  return 2
};
cljs.core.BlackNode.prototype.cljs$core$IStack$_peek$arity$1 = function(node) {
  var this__68976 = this;
  return this__68976.val
};
cljs.core.BlackNode.prototype.cljs$core$IStack$_pop$arity$1 = function(node) {
  var this__68977 = this;
  return cljs.core.PersistentVector.fromArray([this__68977.key], true)
};
cljs.core.BlackNode.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(node, n, v) {
  var this__68978 = this;
  return cljs.core._assoc_n.call(null, cljs.core.PersistentVector.fromArray([this__68978.key, this__68978.val], true), n, v)
};
cljs.core.BlackNode.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__68979 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.BlackNode.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(node, meta) {
  var this__68980 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.fromArray([this__68980.key, this__68980.val], true), meta)
};
cljs.core.BlackNode.prototype.cljs$core$IMeta$_meta$arity$1 = function(node) {
  var this__68981 = this;
  return null
};
cljs.core.BlackNode.prototype.cljs$core$IIndexed$_nth$arity$2 = function(node, n) {
  var this__68982 = this;
  if(n === 0) {
    return this__68982.key
  }else {
    if(n === 1) {
      return this__68982.val
    }else {
      if("\ufdd0'else") {
        return null
      }else {
        return null
      }
    }
  }
};
cljs.core.BlackNode.prototype.cljs$core$IIndexed$_nth$arity$3 = function(node, n, not_found) {
  var this__68983 = this;
  if(n === 0) {
    return this__68983.key
  }else {
    if(n === 1) {
      return this__68983.val
    }else {
      if("\ufdd0'else") {
        return not_found
      }else {
        return null
      }
    }
  }
};
cljs.core.BlackNode.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(node) {
  var this__68984 = this;
  return cljs.core.PersistentVector.EMPTY
};
cljs.core.BlackNode;
cljs.core.RedNode = function(key, val, left, right, __hash) {
  this.key = key;
  this.val = val;
  this.left = left;
  this.right = right;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32402207
};
cljs.core.RedNode.cljs$lang$type = true;
cljs.core.RedNode.cljs$lang$ctorPrSeq = function(this__2343__auto__) {
  return cljs.core.list.call(null, "cljs.core/RedNode")
};
cljs.core.RedNode.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__68989 = this;
  var h__2226__auto____68990 = this__68989.__hash;
  if(!(h__2226__auto____68990 == null)) {
    return h__2226__auto____68990
  }else {
    var h__2226__auto____68991 = cljs.core.hash_coll.call(null, coll);
    this__68989.__hash = h__2226__auto____68991;
    return h__2226__auto____68991
  }
};
cljs.core.RedNode.prototype.cljs$core$ILookup$_lookup$arity$2 = function(node, k) {
  var this__68992 = this;
  return node.cljs$core$IIndexed$_nth$arity$3(node, k, null)
};
cljs.core.RedNode.prototype.cljs$core$ILookup$_lookup$arity$3 = function(node, k, not_found) {
  var this__68993 = this;
  return node.cljs$core$IIndexed$_nth$arity$3(node, k, not_found)
};
cljs.core.RedNode.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(node, k, v) {
  var this__68994 = this;
  return cljs.core.assoc.call(null, cljs.core.PersistentVector.fromArray([this__68994.key, this__68994.val], true), k, v)
};
cljs.core.RedNode.prototype.call = function() {
  var G__69042 = null;
  var G__69042__2 = function(this_sym68995, k) {
    var this__68997 = this;
    var this_sym68995__68998 = this;
    var node__68999 = this_sym68995__68998;
    return node__68999.cljs$core$ILookup$_lookup$arity$2(node__68999, k)
  };
  var G__69042__3 = function(this_sym68996, k, not_found) {
    var this__68997 = this;
    var this_sym68996__69000 = this;
    var node__69001 = this_sym68996__69000;
    return node__69001.cljs$core$ILookup$_lookup$arity$3(node__69001, k, not_found)
  };
  G__69042 = function(this_sym68996, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__69042__2.call(this, this_sym68996, k);
      case 3:
        return G__69042__3.call(this, this_sym68996, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__69042
}();
cljs.core.RedNode.prototype.apply = function(this_sym68987, args68988) {
  var this__69002 = this;
  return this_sym68987.call.apply(this_sym68987, [this_sym68987].concat(args68988.slice()))
};
cljs.core.RedNode.prototype.cljs$core$ICollection$_conj$arity$2 = function(node, o) {
  var this__69003 = this;
  return cljs.core.PersistentVector.fromArray([this__69003.key, this__69003.val, o], true)
};
cljs.core.RedNode.prototype.cljs$core$IMapEntry$_key$arity$1 = function(node) {
  var this__69004 = this;
  return this__69004.key
};
cljs.core.RedNode.prototype.cljs$core$IMapEntry$_val$arity$1 = function(node) {
  var this__69005 = this;
  return this__69005.val
};
cljs.core.RedNode.prototype.add_right = function(ins) {
  var this__69006 = this;
  var node__69007 = this;
  return new cljs.core.RedNode(this__69006.key, this__69006.val, this__69006.left, ins, null)
};
cljs.core.RedNode.prototype.redden = function() {
  var this__69008 = this;
  var node__69009 = this;
  throw new Error("red-black tree invariant violation");
};
cljs.core.RedNode.prototype.remove_right = function(del) {
  var this__69010 = this;
  var node__69011 = this;
  return new cljs.core.RedNode(this__69010.key, this__69010.val, this__69010.left, del, null)
};
cljs.core.RedNode.prototype.replace = function(key, val, left, right) {
  var this__69012 = this;
  var node__69013 = this;
  return new cljs.core.RedNode(key, val, left, right, null)
};
cljs.core.RedNode.prototype.kv_reduce = function(f, init) {
  var this__69014 = this;
  var node__69015 = this;
  return cljs.core.tree_map_kv_reduce.call(null, node__69015, f, init)
};
cljs.core.RedNode.prototype.remove_left = function(del) {
  var this__69016 = this;
  var node__69017 = this;
  return new cljs.core.RedNode(this__69016.key, this__69016.val, del, this__69016.right, null)
};
cljs.core.RedNode.prototype.add_left = function(ins) {
  var this__69018 = this;
  var node__69019 = this;
  return new cljs.core.RedNode(this__69018.key, this__69018.val, ins, this__69018.right, null)
};
cljs.core.RedNode.prototype.balance_left = function(parent) {
  var this__69020 = this;
  var node__69021 = this;
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__69020.left)) {
    return new cljs.core.RedNode(this__69020.key, this__69020.val, this__69020.left.blacken(), new cljs.core.BlackNode(parent.key, parent.val, this__69020.right, parent.right, null), null)
  }else {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__69020.right)) {
      return new cljs.core.RedNode(this__69020.right.key, this__69020.right.val, new cljs.core.BlackNode(this__69020.key, this__69020.val, this__69020.left, this__69020.right.left, null), new cljs.core.BlackNode(parent.key, parent.val, this__69020.right.right, parent.right, null), null)
    }else {
      if("\ufdd0'else") {
        return new cljs.core.BlackNode(parent.key, parent.val, node__69021, parent.right, null)
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.toString = function() {
  var G__69043 = null;
  var G__69043__0 = function() {
    var this__69022 = this;
    var this__69024 = this;
    return cljs.core.pr_str.call(null, this__69024)
  };
  G__69043 = function() {
    switch(arguments.length) {
      case 0:
        return G__69043__0.call(this)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__69043
}();
cljs.core.RedNode.prototype.balance_right = function(parent) {
  var this__69025 = this;
  var node__69026 = this;
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__69025.right)) {
    return new cljs.core.RedNode(this__69025.key, this__69025.val, new cljs.core.BlackNode(parent.key, parent.val, parent.left, this__69025.left, null), this__69025.right.blacken(), null)
  }else {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__69025.left)) {
      return new cljs.core.RedNode(this__69025.left.key, this__69025.left.val, new cljs.core.BlackNode(parent.key, parent.val, parent.left, this__69025.left.left, null), new cljs.core.BlackNode(this__69025.key, this__69025.val, this__69025.left.right, this__69025.right, null), null)
    }else {
      if("\ufdd0'else") {
        return new cljs.core.BlackNode(parent.key, parent.val, parent.left, node__69026, null)
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.blacken = function() {
  var this__69027 = this;
  var node__69028 = this;
  return new cljs.core.BlackNode(this__69027.key, this__69027.val, this__69027.left, this__69027.right, null)
};
cljs.core.RedNode.prototype.cljs$core$IReduce$_reduce$arity$2 = function(node, f) {
  var this__69029 = this;
  return cljs.core.ci_reduce.call(null, node, f)
};
cljs.core.RedNode.prototype.cljs$core$IReduce$_reduce$arity$3 = function(node, f, start) {
  var this__69030 = this;
  return cljs.core.ci_reduce.call(null, node, f, start)
};
cljs.core.RedNode.prototype.cljs$core$ISeqable$_seq$arity$1 = function(node) {
  var this__69031 = this;
  return cljs.core.list.call(null, this__69031.key, this__69031.val)
};
cljs.core.RedNode.prototype.cljs$core$ICounted$_count$arity$1 = function(node) {
  var this__69032 = this;
  return 2
};
cljs.core.RedNode.prototype.cljs$core$IStack$_peek$arity$1 = function(node) {
  var this__69033 = this;
  return this__69033.val
};
cljs.core.RedNode.prototype.cljs$core$IStack$_pop$arity$1 = function(node) {
  var this__69034 = this;
  return cljs.core.PersistentVector.fromArray([this__69034.key], true)
};
cljs.core.RedNode.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(node, n, v) {
  var this__69035 = this;
  return cljs.core._assoc_n.call(null, cljs.core.PersistentVector.fromArray([this__69035.key, this__69035.val], true), n, v)
};
cljs.core.RedNode.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__69036 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.RedNode.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(node, meta) {
  var this__69037 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.fromArray([this__69037.key, this__69037.val], true), meta)
};
cljs.core.RedNode.prototype.cljs$core$IMeta$_meta$arity$1 = function(node) {
  var this__69038 = this;
  return null
};
cljs.core.RedNode.prototype.cljs$core$IIndexed$_nth$arity$2 = function(node, n) {
  var this__69039 = this;
  if(n === 0) {
    return this__69039.key
  }else {
    if(n === 1) {
      return this__69039.val
    }else {
      if("\ufdd0'else") {
        return null
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.cljs$core$IIndexed$_nth$arity$3 = function(node, n, not_found) {
  var this__69040 = this;
  if(n === 0) {
    return this__69040.key
  }else {
    if(n === 1) {
      return this__69040.val
    }else {
      if("\ufdd0'else") {
        return not_found
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(node) {
  var this__69041 = this;
  return cljs.core.PersistentVector.EMPTY
};
cljs.core.RedNode;
cljs.core.tree_map_add = function tree_map_add(comp, tree, k, v, found) {
  if(tree == null) {
    return new cljs.core.RedNode(k, v, null, null, null)
  }else {
    var c__69047 = comp.call(null, k, tree.key);
    if(c__69047 === 0) {
      found[0] = tree;
      return null
    }else {
      if(c__69047 < 0) {
        var ins__69048 = tree_map_add.call(null, comp, tree.left, k, v, found);
        if(!(ins__69048 == null)) {
          return tree.add_left(ins__69048)
        }else {
          return null
        }
      }else {
        if("\ufdd0'else") {
          var ins__69049 = tree_map_add.call(null, comp, tree.right, k, v, found);
          if(!(ins__69049 == null)) {
            return tree.add_right(ins__69049)
          }else {
            return null
          }
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.tree_map_append = function tree_map_append(left, right) {
  if(left == null) {
    return right
  }else {
    if(right == null) {
      return left
    }else {
      if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, left)) {
        if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, right)) {
          var app__69052 = tree_map_append.call(null, left.right, right.left);
          if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, app__69052)) {
            return new cljs.core.RedNode(app__69052.key, app__69052.val, new cljs.core.RedNode(left.key, left.val, left.left, app__69052.left, null), new cljs.core.RedNode(right.key, right.val, app__69052.right, right.right, null), null)
          }else {
            return new cljs.core.RedNode(left.key, left.val, left.left, new cljs.core.RedNode(right.key, right.val, app__69052, right.right, null), null)
          }
        }else {
          return new cljs.core.RedNode(left.key, left.val, left.left, tree_map_append.call(null, left.right, right), null)
        }
      }else {
        if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, right)) {
          return new cljs.core.RedNode(right.key, right.val, tree_map_append.call(null, left, right.left), right.right, null)
        }else {
          if("\ufdd0'else") {
            var app__69053 = tree_map_append.call(null, left.right, right.left);
            if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, app__69053)) {
              return new cljs.core.RedNode(app__69053.key, app__69053.val, new cljs.core.BlackNode(left.key, left.val, left.left, app__69053.left, null), new cljs.core.BlackNode(right.key, right.val, app__69053.right, right.right, null), null)
            }else {
              return cljs.core.balance_left_del.call(null, left.key, left.val, left.left, new cljs.core.BlackNode(right.key, right.val, app__69053, right.right, null))
            }
          }else {
            return null
          }
        }
      }
    }
  }
};
cljs.core.tree_map_remove = function tree_map_remove(comp, tree, k, found) {
  if(!(tree == null)) {
    var c__69059 = comp.call(null, k, tree.key);
    if(c__69059 === 0) {
      found[0] = tree;
      return cljs.core.tree_map_append.call(null, tree.left, tree.right)
    }else {
      if(c__69059 < 0) {
        var del__69060 = tree_map_remove.call(null, comp, tree.left, k, found);
        if(function() {
          var or__3824__auto____69061 = !(del__69060 == null);
          if(or__3824__auto____69061) {
            return or__3824__auto____69061
          }else {
            return!(found[0] == null)
          }
        }()) {
          if(cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, tree.left)) {
            return cljs.core.balance_left_del.call(null, tree.key, tree.val, del__69060, tree.right)
          }else {
            return new cljs.core.RedNode(tree.key, tree.val, del__69060, tree.right, null)
          }
        }else {
          return null
        }
      }else {
        if("\ufdd0'else") {
          var del__69062 = tree_map_remove.call(null, comp, tree.right, k, found);
          if(function() {
            var or__3824__auto____69063 = !(del__69062 == null);
            if(or__3824__auto____69063) {
              return or__3824__auto____69063
            }else {
              return!(found[0] == null)
            }
          }()) {
            if(cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, tree.right)) {
              return cljs.core.balance_right_del.call(null, tree.key, tree.val, tree.left, del__69062)
            }else {
              return new cljs.core.RedNode(tree.key, tree.val, tree.left, del__69062, null)
            }
          }else {
            return null
          }
        }else {
          return null
        }
      }
    }
  }else {
    return null
  }
};
cljs.core.tree_map_replace = function tree_map_replace(comp, tree, k, v) {
  var tk__69066 = tree.key;
  var c__69067 = comp.call(null, k, tk__69066);
  if(c__69067 === 0) {
    return tree.replace(tk__69066, v, tree.left, tree.right)
  }else {
    if(c__69067 < 0) {
      return tree.replace(tk__69066, tree.val, tree_map_replace.call(null, comp, tree.left, k, v), tree.right)
    }else {
      if("\ufdd0'else") {
        return tree.replace(tk__69066, tree.val, tree.left, tree_map_replace.call(null, comp, tree.right, k, v))
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentTreeMap = function(comp, tree, cnt, meta, __hash) {
  this.comp = comp;
  this.tree = tree;
  this.cnt = cnt;
  this.meta = meta;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 418776847
};
cljs.core.PersistentTreeMap.cljs$lang$type = true;
cljs.core.PersistentTreeMap.cljs$lang$ctorPrSeq = function(this__2343__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentTreeMap")
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__69070 = this;
  var h__2226__auto____69071 = this__69070.__hash;
  if(!(h__2226__auto____69071 == null)) {
    return h__2226__auto____69071
  }else {
    var h__2226__auto____69072 = cljs.core.hash_imap.call(null, coll);
    this__69070.__hash = h__2226__auto____69072;
    return h__2226__auto____69072
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__69073 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__69074 = this;
  var n__69075 = coll.entry_at(k);
  if(!(n__69075 == null)) {
    return n__69075.val
  }else {
    return not_found
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__69076 = this;
  var found__69077 = [null];
  var t__69078 = cljs.core.tree_map_add.call(null, this__69076.comp, this__69076.tree, k, v, found__69077);
  if(t__69078 == null) {
    var found_node__69079 = cljs.core.nth.call(null, found__69077, 0);
    if(cljs.core._EQ_.call(null, v, found_node__69079.val)) {
      return coll
    }else {
      return new cljs.core.PersistentTreeMap(this__69076.comp, cljs.core.tree_map_replace.call(null, this__69076.comp, this__69076.tree, k, v), this__69076.cnt, this__69076.meta, null)
    }
  }else {
    return new cljs.core.PersistentTreeMap(this__69076.comp, t__69078.blacken(), this__69076.cnt + 1, this__69076.meta, null)
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__69080 = this;
  return!(coll.entry_at(k) == null)
};
cljs.core.PersistentTreeMap.prototype.call = function() {
  var G__69114 = null;
  var G__69114__2 = function(this_sym69081, k) {
    var this__69083 = this;
    var this_sym69081__69084 = this;
    var coll__69085 = this_sym69081__69084;
    return coll__69085.cljs$core$ILookup$_lookup$arity$2(coll__69085, k)
  };
  var G__69114__3 = function(this_sym69082, k, not_found) {
    var this__69083 = this;
    var this_sym69082__69086 = this;
    var coll__69087 = this_sym69082__69086;
    return coll__69087.cljs$core$ILookup$_lookup$arity$3(coll__69087, k, not_found)
  };
  G__69114 = function(this_sym69082, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__69114__2.call(this, this_sym69082, k);
      case 3:
        return G__69114__3.call(this, this_sym69082, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__69114
}();
cljs.core.PersistentTreeMap.prototype.apply = function(this_sym69068, args69069) {
  var this__69088 = this;
  return this_sym69068.call.apply(this_sym69068, [this_sym69068].concat(args69069.slice()))
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(coll, f, init) {
  var this__69089 = this;
  if(!(this__69089.tree == null)) {
    return cljs.core.tree_map_kv_reduce.call(null, this__69089.tree, f, init)
  }else {
    return init
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__69090 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__69091 = this;
  if(this__69091.cnt > 0) {
    return cljs.core.create_tree_map_seq.call(null, this__69091.tree, false, this__69091.cnt)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.toString = function() {
  var this__69092 = this;
  var this__69093 = this;
  return cljs.core.pr_str.call(null, this__69093)
};
cljs.core.PersistentTreeMap.prototype.entry_at = function(k) {
  var this__69094 = this;
  var coll__69095 = this;
  var t__69096 = this__69094.tree;
  while(true) {
    if(!(t__69096 == null)) {
      var c__69097 = this__69094.comp.call(null, k, t__69096.key);
      if(c__69097 === 0) {
        return t__69096
      }else {
        if(c__69097 < 0) {
          var G__69115 = t__69096.left;
          t__69096 = G__69115;
          continue
        }else {
          if("\ufdd0'else") {
            var G__69116 = t__69096.right;
            t__69096 = G__69116;
            continue
          }else {
            return null
          }
        }
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_sorted_seq$arity$2 = function(coll, ascending_QMARK_) {
  var this__69098 = this;
  if(this__69098.cnt > 0) {
    return cljs.core.create_tree_map_seq.call(null, this__69098.tree, ascending_QMARK_, this__69098.cnt)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_sorted_seq_from$arity$3 = function(coll, k, ascending_QMARK_) {
  var this__69099 = this;
  if(this__69099.cnt > 0) {
    var stack__69100 = null;
    var t__69101 = this__69099.tree;
    while(true) {
      if(!(t__69101 == null)) {
        var c__69102 = this__69099.comp.call(null, k, t__69101.key);
        if(c__69102 === 0) {
          return new cljs.core.PersistentTreeMapSeq(null, cljs.core.conj.call(null, stack__69100, t__69101), ascending_QMARK_, -1, null)
        }else {
          if(cljs.core.truth_(ascending_QMARK_)) {
            if(c__69102 < 0) {
              var G__69117 = cljs.core.conj.call(null, stack__69100, t__69101);
              var G__69118 = t__69101.left;
              stack__69100 = G__69117;
              t__69101 = G__69118;
              continue
            }else {
              var G__69119 = stack__69100;
              var G__69120 = t__69101.right;
              stack__69100 = G__69119;
              t__69101 = G__69120;
              continue
            }
          }else {
            if("\ufdd0'else") {
              if(c__69102 > 0) {
                var G__69121 = cljs.core.conj.call(null, stack__69100, t__69101);
                var G__69122 = t__69101.right;
                stack__69100 = G__69121;
                t__69101 = G__69122;
                continue
              }else {
                var G__69123 = stack__69100;
                var G__69124 = t__69101.left;
                stack__69100 = G__69123;
                t__69101 = G__69124;
                continue
              }
            }else {
              return null
            }
          }
        }
      }else {
        if(stack__69100 == null) {
          return new cljs.core.PersistentTreeMapSeq(null, stack__69100, ascending_QMARK_, -1, null)
        }else {
          return null
        }
      }
      break
    }
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_entry_key$arity$2 = function(coll, entry) {
  var this__69103 = this;
  return cljs.core.key.call(null, entry)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_comparator$arity$1 = function(coll) {
  var this__69104 = this;
  return this__69104.comp
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__69105 = this;
  if(this__69105.cnt > 0) {
    return cljs.core.create_tree_map_seq.call(null, this__69105.tree, true, this__69105.cnt)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__69106 = this;
  return this__69106.cnt
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__69107 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__69108 = this;
  return new cljs.core.PersistentTreeMap(this__69108.comp, this__69108.tree, this__69108.cnt, meta, this__69108.__hash)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__69109 = this;
  return this__69109.meta
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__69110 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentTreeMap.EMPTY, this__69110.meta)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__69111 = this;
  var found__69112 = [null];
  var t__69113 = cljs.core.tree_map_remove.call(null, this__69111.comp, this__69111.tree, k, found__69112);
  if(t__69113 == null) {
    if(cljs.core.nth.call(null, found__69112, 0) == null) {
      return coll
    }else {
      return new cljs.core.PersistentTreeMap(this__69111.comp, null, 0, this__69111.meta, null)
    }
  }else {
    return new cljs.core.PersistentTreeMap(this__69111.comp, t__69113.blacken(), this__69111.cnt - 1, this__69111.meta, null)
  }
};
cljs.core.PersistentTreeMap;
cljs.core.PersistentTreeMap.EMPTY = new cljs.core.PersistentTreeMap(cljs.core.compare, null, 0, null, 0);
cljs.core.hash_map = function() {
  var hash_map__delegate = function(keyvals) {
    var in__69127 = cljs.core.seq.call(null, keyvals);
    var out__69128 = cljs.core.transient$.call(null, cljs.core.PersistentHashMap.EMPTY);
    while(true) {
      if(in__69127) {
        var G__69129 = cljs.core.nnext.call(null, in__69127);
        var G__69130 = cljs.core.assoc_BANG_.call(null, out__69128, cljs.core.first.call(null, in__69127), cljs.core.second.call(null, in__69127));
        in__69127 = G__69129;
        out__69128 = G__69130;
        continue
      }else {
        return cljs.core.persistent_BANG_.call(null, out__69128)
      }
      break
    }
  };
  var hash_map = function(var_args) {
    var keyvals = null;
    if(goog.isDef(var_args)) {
      keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return hash_map__delegate.call(this, keyvals)
  };
  hash_map.cljs$lang$maxFixedArity = 0;
  hash_map.cljs$lang$applyTo = function(arglist__69131) {
    var keyvals = cljs.core.seq(arglist__69131);
    return hash_map__delegate(keyvals)
  };
  hash_map.cljs$lang$arity$variadic = hash_map__delegate;
  return hash_map
}();
cljs.core.array_map = function() {
  var array_map__delegate = function(keyvals) {
    return new cljs.core.PersistentArrayMap(null, cljs.core.quot.call(null, cljs.core.count.call(null, keyvals), 2), cljs.core.apply.call(null, cljs.core.array, keyvals), null)
  };
  var array_map = function(var_args) {
    var keyvals = null;
    if(goog.isDef(var_args)) {
      keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return array_map__delegate.call(this, keyvals)
  };
  array_map.cljs$lang$maxFixedArity = 0;
  array_map.cljs$lang$applyTo = function(arglist__69132) {
    var keyvals = cljs.core.seq(arglist__69132);
    return array_map__delegate(keyvals)
  };
  array_map.cljs$lang$arity$variadic = array_map__delegate;
  return array_map
}();
cljs.core.obj_map = function() {
  var obj_map__delegate = function(keyvals) {
    var ks__69136 = [];
    var obj__69137 = {};
    var kvs__69138 = cljs.core.seq.call(null, keyvals);
    while(true) {
      if(kvs__69138) {
        ks__69136.push(cljs.core.first.call(null, kvs__69138));
        obj__69137[cljs.core.first.call(null, kvs__69138)] = cljs.core.second.call(null, kvs__69138);
        var G__69139 = cljs.core.nnext.call(null, kvs__69138);
        kvs__69138 = G__69139;
        continue
      }else {
        return cljs.core.ObjMap.fromObject.call(null, ks__69136, obj__69137)
      }
      break
    }
  };
  var obj_map = function(var_args) {
    var keyvals = null;
    if(goog.isDef(var_args)) {
      keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return obj_map__delegate.call(this, keyvals)
  };
  obj_map.cljs$lang$maxFixedArity = 0;
  obj_map.cljs$lang$applyTo = function(arglist__69140) {
    var keyvals = cljs.core.seq(arglist__69140);
    return obj_map__delegate(keyvals)
  };
  obj_map.cljs$lang$arity$variadic = obj_map__delegate;
  return obj_map
}();
cljs.core.sorted_map = function() {
  var sorted_map__delegate = function(keyvals) {
    var in__69143 = cljs.core.seq.call(null, keyvals);
    var out__69144 = cljs.core.PersistentTreeMap.EMPTY;
    while(true) {
      if(in__69143) {
        var G__69145 = cljs.core.nnext.call(null, in__69143);
        var G__69146 = cljs.core.assoc.call(null, out__69144, cljs.core.first.call(null, in__69143), cljs.core.second.call(null, in__69143));
        in__69143 = G__69145;
        out__69144 = G__69146;
        continue
      }else {
        return out__69144
      }
      break
    }
  };
  var sorted_map = function(var_args) {
    var keyvals = null;
    if(goog.isDef(var_args)) {
      keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return sorted_map__delegate.call(this, keyvals)
  };
  sorted_map.cljs$lang$maxFixedArity = 0;
  sorted_map.cljs$lang$applyTo = function(arglist__69147) {
    var keyvals = cljs.core.seq(arglist__69147);
    return sorted_map__delegate(keyvals)
  };
  sorted_map.cljs$lang$arity$variadic = sorted_map__delegate;
  return sorted_map
}();
cljs.core.sorted_map_by = function() {
  var sorted_map_by__delegate = function(comparator, keyvals) {
    var in__69150 = cljs.core.seq.call(null, keyvals);
    var out__69151 = new cljs.core.PersistentTreeMap(comparator, null, 0, null, 0);
    while(true) {
      if(in__69150) {
        var G__69152 = cljs.core.nnext.call(null, in__69150);
        var G__69153 = cljs.core.assoc.call(null, out__69151, cljs.core.first.call(null, in__69150), cljs.core.second.call(null, in__69150));
        in__69150 = G__69152;
        out__69151 = G__69153;
        continue
      }else {
        return out__69151
      }
      break
    }
  };
  var sorted_map_by = function(comparator, var_args) {
    var keyvals = null;
    if(goog.isDef(var_args)) {
      keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return sorted_map_by__delegate.call(this, comparator, keyvals)
  };
  sorted_map_by.cljs$lang$maxFixedArity = 1;
  sorted_map_by.cljs$lang$applyTo = function(arglist__69154) {
    var comparator = cljs.core.first(arglist__69154);
    var keyvals = cljs.core.rest(arglist__69154);
    return sorted_map_by__delegate(comparator, keyvals)
  };
  sorted_map_by.cljs$lang$arity$variadic = sorted_map_by__delegate;
  return sorted_map_by
}();
cljs.core.keys = function keys(hash_map) {
  return cljs.core.seq.call(null, cljs.core.map.call(null, cljs.core.first, hash_map))
};
cljs.core.key = function key(map_entry) {
  return cljs.core._key.call(null, map_entry)
};
cljs.core.vals = function vals(hash_map) {
  return cljs.core.seq.call(null, cljs.core.map.call(null, cljs.core.second, hash_map))
};
cljs.core.val = function val(map_entry) {
  return cljs.core._val.call(null, map_entry)
};
cljs.core.merge = function() {
  var merge__delegate = function(maps) {
    if(cljs.core.truth_(cljs.core.some.call(null, cljs.core.identity, maps))) {
      return cljs.core.reduce.call(null, function(p1__69155_SHARP_, p2__69156_SHARP_) {
        return cljs.core.conj.call(null, function() {
          var or__3824__auto____69158 = p1__69155_SHARP_;
          if(cljs.core.truth_(or__3824__auto____69158)) {
            return or__3824__auto____69158
          }else {
            return cljs.core.ObjMap.EMPTY
          }
        }(), p2__69156_SHARP_)
      }, maps)
    }else {
      return null
    }
  };
  var merge = function(var_args) {
    var maps = null;
    if(goog.isDef(var_args)) {
      maps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return merge__delegate.call(this, maps)
  };
  merge.cljs$lang$maxFixedArity = 0;
  merge.cljs$lang$applyTo = function(arglist__69159) {
    var maps = cljs.core.seq(arglist__69159);
    return merge__delegate(maps)
  };
  merge.cljs$lang$arity$variadic = merge__delegate;
  return merge
}();
cljs.core.merge_with = function() {
  var merge_with__delegate = function(f, maps) {
    if(cljs.core.truth_(cljs.core.some.call(null, cljs.core.identity, maps))) {
      var merge_entry__69167 = function(m, e) {
        var k__69165 = cljs.core.first.call(null, e);
        var v__69166 = cljs.core.second.call(null, e);
        if(cljs.core.contains_QMARK_.call(null, m, k__69165)) {
          return cljs.core.assoc.call(null, m, k__69165, f.call(null, cljs.core._lookup.call(null, m, k__69165, null), v__69166))
        }else {
          return cljs.core.assoc.call(null, m, k__69165, v__69166)
        }
      };
      var merge2__69169 = function(m1, m2) {
        return cljs.core.reduce.call(null, merge_entry__69167, function() {
          var or__3824__auto____69168 = m1;
          if(cljs.core.truth_(or__3824__auto____69168)) {
            return or__3824__auto____69168
          }else {
            return cljs.core.ObjMap.EMPTY
          }
        }(), cljs.core.seq.call(null, m2))
      };
      return cljs.core.reduce.call(null, merge2__69169, maps)
    }else {
      return null
    }
  };
  var merge_with = function(f, var_args) {
    var maps = null;
    if(goog.isDef(var_args)) {
      maps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return merge_with__delegate.call(this, f, maps)
  };
  merge_with.cljs$lang$maxFixedArity = 1;
  merge_with.cljs$lang$applyTo = function(arglist__69170) {
    var f = cljs.core.first(arglist__69170);
    var maps = cljs.core.rest(arglist__69170);
    return merge_with__delegate(f, maps)
  };
  merge_with.cljs$lang$arity$variadic = merge_with__delegate;
  return merge_with
}();
cljs.core.select_keys = function select_keys(map, keyseq) {
  var ret__69175 = cljs.core.ObjMap.EMPTY;
  var keys__69176 = cljs.core.seq.call(null, keyseq);
  while(true) {
    if(keys__69176) {
      var key__69177 = cljs.core.first.call(null, keys__69176);
      var entry__69178 = cljs.core._lookup.call(null, map, key__69177, "\ufdd0'cljs.core/not-found");
      var G__69179 = cljs.core.not_EQ_.call(null, entry__69178, "\ufdd0'cljs.core/not-found") ? cljs.core.assoc.call(null, ret__69175, key__69177, entry__69178) : ret__69175;
      var G__69180 = cljs.core.next.call(null, keys__69176);
      ret__69175 = G__69179;
      keys__69176 = G__69180;
      continue
    }else {
      return ret__69175
    }
    break
  }
};
cljs.core.PersistentHashSet = function(meta, hash_map, __hash) {
  this.meta = meta;
  this.hash_map = hash_map;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 1;
  this.cljs$lang$protocol_mask$partition0$ = 15077647
};
cljs.core.PersistentHashSet.cljs$lang$type = true;
cljs.core.PersistentHashSet.cljs$lang$ctorPrSeq = function(this__2343__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentHashSet")
};
cljs.core.PersistentHashSet.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var this__69184 = this;
  return new cljs.core.TransientHashSet(cljs.core.transient$.call(null, this__69184.hash_map))
};
cljs.core.PersistentHashSet.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__69185 = this;
  var h__2226__auto____69186 = this__69185.__hash;
  if(!(h__2226__auto____69186 == null)) {
    return h__2226__auto____69186
  }else {
    var h__2226__auto____69187 = cljs.core.hash_iset.call(null, coll);
    this__69185.__hash = h__2226__auto____69187;
    return h__2226__auto____69187
  }
};
cljs.core.PersistentHashSet.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, v) {
  var this__69188 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, v, null)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, v, not_found) {
  var this__69189 = this;
  if(cljs.core.truth_(cljs.core._contains_key_QMARK_.call(null, this__69189.hash_map, v))) {
    return v
  }else {
    return not_found
  }
};
cljs.core.PersistentHashSet.prototype.call = function() {
  var G__69210 = null;
  var G__69210__2 = function(this_sym69190, k) {
    var this__69192 = this;
    var this_sym69190__69193 = this;
    var coll__69194 = this_sym69190__69193;
    return coll__69194.cljs$core$ILookup$_lookup$arity$2(coll__69194, k)
  };
  var G__69210__3 = function(this_sym69191, k, not_found) {
    var this__69192 = this;
    var this_sym69191__69195 = this;
    var coll__69196 = this_sym69191__69195;
    return coll__69196.cljs$core$ILookup$_lookup$arity$3(coll__69196, k, not_found)
  };
  G__69210 = function(this_sym69191, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__69210__2.call(this, this_sym69191, k);
      case 3:
        return G__69210__3.call(this, this_sym69191, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__69210
}();
cljs.core.PersistentHashSet.prototype.apply = function(this_sym69182, args69183) {
  var this__69197 = this;
  return this_sym69182.call.apply(this_sym69182, [this_sym69182].concat(args69183.slice()))
};
cljs.core.PersistentHashSet.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__69198 = this;
  return new cljs.core.PersistentHashSet(this__69198.meta, cljs.core.assoc.call(null, this__69198.hash_map, o, null), null)
};
cljs.core.PersistentHashSet.prototype.toString = function() {
  var this__69199 = this;
  var this__69200 = this;
  return cljs.core.pr_str.call(null, this__69200)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__69201 = this;
  return cljs.core.keys.call(null, this__69201.hash_map)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ISet$_disjoin$arity$2 = function(coll, v) {
  var this__69202 = this;
  return new cljs.core.PersistentHashSet(this__69202.meta, cljs.core.dissoc.call(null, this__69202.hash_map, v), null)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__69203 = this;
  return cljs.core.count.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.PersistentHashSet.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__69204 = this;
  var and__3822__auto____69205 = cljs.core.set_QMARK_.call(null, other);
  if(and__3822__auto____69205) {
    var and__3822__auto____69206 = cljs.core.count.call(null, coll) === cljs.core.count.call(null, other);
    if(and__3822__auto____69206) {
      return cljs.core.every_QMARK_.call(null, function(p1__69181_SHARP_) {
        return cljs.core.contains_QMARK_.call(null, coll, p1__69181_SHARP_)
      }, other)
    }else {
      return and__3822__auto____69206
    }
  }else {
    return and__3822__auto____69205
  }
};
cljs.core.PersistentHashSet.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__69207 = this;
  return new cljs.core.PersistentHashSet(meta, this__69207.hash_map, this__69207.__hash)
};
cljs.core.PersistentHashSet.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__69208 = this;
  return this__69208.meta
};
cljs.core.PersistentHashSet.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__69209 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentHashSet.EMPTY, this__69209.meta)
};
cljs.core.PersistentHashSet;
cljs.core.PersistentHashSet.EMPTY = new cljs.core.PersistentHashSet(null, cljs.core.hash_map.call(null), 0);
cljs.core.PersistentHashSet.fromArray = function(items) {
  var len__69211 = cljs.core.count.call(null, items);
  var i__69212 = 0;
  var out__69213 = cljs.core.transient$.call(null, cljs.core.PersistentHashSet.EMPTY);
  while(true) {
    if(i__69212 < len__69211) {
      var G__69214 = i__69212 + 1;
      var G__69215 = cljs.core.conj_BANG_.call(null, out__69213, items[i__69212]);
      i__69212 = G__69214;
      out__69213 = G__69215;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, out__69213)
    }
    break
  }
};
cljs.core.TransientHashSet = function(transient_map) {
  this.transient_map = transient_map;
  this.cljs$lang$protocol_mask$partition0$ = 259;
  this.cljs$lang$protocol_mask$partition1$ = 34
};
cljs.core.TransientHashSet.cljs$lang$type = true;
cljs.core.TransientHashSet.cljs$lang$ctorPrSeq = function(this__2343__auto__) {
  return cljs.core.list.call(null, "cljs.core/TransientHashSet")
};
cljs.core.TransientHashSet.prototype.call = function() {
  var G__69233 = null;
  var G__69233__2 = function(this_sym69219, k) {
    var this__69221 = this;
    var this_sym69219__69222 = this;
    var tcoll__69223 = this_sym69219__69222;
    if(cljs.core._lookup.call(null, this__69221.transient_map, k, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
      return null
    }else {
      return k
    }
  };
  var G__69233__3 = function(this_sym69220, k, not_found) {
    var this__69221 = this;
    var this_sym69220__69224 = this;
    var tcoll__69225 = this_sym69220__69224;
    if(cljs.core._lookup.call(null, this__69221.transient_map, k, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
      return not_found
    }else {
      return k
    }
  };
  G__69233 = function(this_sym69220, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__69233__2.call(this, this_sym69220, k);
      case 3:
        return G__69233__3.call(this, this_sym69220, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__69233
}();
cljs.core.TransientHashSet.prototype.apply = function(this_sym69217, args69218) {
  var this__69226 = this;
  return this_sym69217.call.apply(this_sym69217, [this_sym69217].concat(args69218.slice()))
};
cljs.core.TransientHashSet.prototype.cljs$core$ILookup$_lookup$arity$2 = function(tcoll, v) {
  var this__69227 = this;
  return tcoll.cljs$core$ILookup$_lookup$arity$3(tcoll, v, null)
};
cljs.core.TransientHashSet.prototype.cljs$core$ILookup$_lookup$arity$3 = function(tcoll, v, not_found) {
  var this__69228 = this;
  if(cljs.core._lookup.call(null, this__69228.transient_map, v, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
    return not_found
  }else {
    return v
  }
};
cljs.core.TransientHashSet.prototype.cljs$core$ICounted$_count$arity$1 = function(tcoll) {
  var this__69229 = this;
  return cljs.core.count.call(null, this__69229.transient_map)
};
cljs.core.TransientHashSet.prototype.cljs$core$ITransientSet$_disjoin_BANG_$arity$2 = function(tcoll, v) {
  var this__69230 = this;
  this__69230.transient_map = cljs.core.dissoc_BANG_.call(null, this__69230.transient_map, v);
  return tcoll
};
cljs.core.TransientHashSet.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, o) {
  var this__69231 = this;
  this__69231.transient_map = cljs.core.assoc_BANG_.call(null, this__69231.transient_map, o, null);
  return tcoll
};
cljs.core.TransientHashSet.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__69232 = this;
  return new cljs.core.PersistentHashSet(null, cljs.core.persistent_BANG_.call(null, this__69232.transient_map), null)
};
cljs.core.TransientHashSet;
cljs.core.PersistentTreeSet = function(meta, tree_map, __hash) {
  this.meta = meta;
  this.tree_map = tree_map;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 417730831
};
cljs.core.PersistentTreeSet.cljs$lang$type = true;
cljs.core.PersistentTreeSet.cljs$lang$ctorPrSeq = function(this__2343__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentTreeSet")
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__69236 = this;
  var h__2226__auto____69237 = this__69236.__hash;
  if(!(h__2226__auto____69237 == null)) {
    return h__2226__auto____69237
  }else {
    var h__2226__auto____69238 = cljs.core.hash_iset.call(null, coll);
    this__69236.__hash = h__2226__auto____69238;
    return h__2226__auto____69238
  }
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, v) {
  var this__69239 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, v, null)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, v, not_found) {
  var this__69240 = this;
  if(cljs.core.truth_(cljs.core._contains_key_QMARK_.call(null, this__69240.tree_map, v))) {
    return v
  }else {
    return not_found
  }
};
cljs.core.PersistentTreeSet.prototype.call = function() {
  var G__69266 = null;
  var G__69266__2 = function(this_sym69241, k) {
    var this__69243 = this;
    var this_sym69241__69244 = this;
    var coll__69245 = this_sym69241__69244;
    return coll__69245.cljs$core$ILookup$_lookup$arity$2(coll__69245, k)
  };
  var G__69266__3 = function(this_sym69242, k, not_found) {
    var this__69243 = this;
    var this_sym69242__69246 = this;
    var coll__69247 = this_sym69242__69246;
    return coll__69247.cljs$core$ILookup$_lookup$arity$3(coll__69247, k, not_found)
  };
  G__69266 = function(this_sym69242, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__69266__2.call(this, this_sym69242, k);
      case 3:
        return G__69266__3.call(this, this_sym69242, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__69266
}();
cljs.core.PersistentTreeSet.prototype.apply = function(this_sym69234, args69235) {
  var this__69248 = this;
  return this_sym69234.call.apply(this_sym69234, [this_sym69234].concat(args69235.slice()))
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__69249 = this;
  return new cljs.core.PersistentTreeSet(this__69249.meta, cljs.core.assoc.call(null, this__69249.tree_map, o, null), null)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__69250 = this;
  return cljs.core.map.call(null, cljs.core.key, cljs.core.rseq.call(null, this__69250.tree_map))
};
cljs.core.PersistentTreeSet.prototype.toString = function() {
  var this__69251 = this;
  var this__69252 = this;
  return cljs.core.pr_str.call(null, this__69252)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_sorted_seq$arity$2 = function(coll, ascending_QMARK_) {
  var this__69253 = this;
  return cljs.core.map.call(null, cljs.core.key, cljs.core._sorted_seq.call(null, this__69253.tree_map, ascending_QMARK_))
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_sorted_seq_from$arity$3 = function(coll, k, ascending_QMARK_) {
  var this__69254 = this;
  return cljs.core.map.call(null, cljs.core.key, cljs.core._sorted_seq_from.call(null, this__69254.tree_map, k, ascending_QMARK_))
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_entry_key$arity$2 = function(coll, entry) {
  var this__69255 = this;
  return entry
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_comparator$arity$1 = function(coll) {
  var this__69256 = this;
  return cljs.core._comparator.call(null, this__69256.tree_map)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__69257 = this;
  return cljs.core.keys.call(null, this__69257.tree_map)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISet$_disjoin$arity$2 = function(coll, v) {
  var this__69258 = this;
  return new cljs.core.PersistentTreeSet(this__69258.meta, cljs.core.dissoc.call(null, this__69258.tree_map, v), null)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__69259 = this;
  return cljs.core.count.call(null, this__69259.tree_map)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__69260 = this;
  var and__3822__auto____69261 = cljs.core.set_QMARK_.call(null, other);
  if(and__3822__auto____69261) {
    var and__3822__auto____69262 = cljs.core.count.call(null, coll) === cljs.core.count.call(null, other);
    if(and__3822__auto____69262) {
      return cljs.core.every_QMARK_.call(null, function(p1__69216_SHARP_) {
        return cljs.core.contains_QMARK_.call(null, coll, p1__69216_SHARP_)
      }, other)
    }else {
      return and__3822__auto____69262
    }
  }else {
    return and__3822__auto____69261
  }
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__69263 = this;
  return new cljs.core.PersistentTreeSet(meta, this__69263.tree_map, this__69263.__hash)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__69264 = this;
  return this__69264.meta
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__69265 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentTreeSet.EMPTY, this__69265.meta)
};
cljs.core.PersistentTreeSet;
cljs.core.PersistentTreeSet.EMPTY = new cljs.core.PersistentTreeSet(null, cljs.core.sorted_map.call(null), 0);
cljs.core.hash_set = function() {
  var hash_set = null;
  var hash_set__0 = function() {
    return cljs.core.PersistentHashSet.EMPTY
  };
  var hash_set__1 = function() {
    var G__69271__delegate = function(keys) {
      var in__69269 = cljs.core.seq.call(null, keys);
      var out__69270 = cljs.core.transient$.call(null, cljs.core.PersistentHashSet.EMPTY);
      while(true) {
        if(cljs.core.seq.call(null, in__69269)) {
          var G__69272 = cljs.core.next.call(null, in__69269);
          var G__69273 = cljs.core.conj_BANG_.call(null, out__69270, cljs.core.first.call(null, in__69269));
          in__69269 = G__69272;
          out__69270 = G__69273;
          continue
        }else {
          return cljs.core.persistent_BANG_.call(null, out__69270)
        }
        break
      }
    };
    var G__69271 = function(var_args) {
      var keys = null;
      if(goog.isDef(var_args)) {
        keys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__69271__delegate.call(this, keys)
    };
    G__69271.cljs$lang$maxFixedArity = 0;
    G__69271.cljs$lang$applyTo = function(arglist__69274) {
      var keys = cljs.core.seq(arglist__69274);
      return G__69271__delegate(keys)
    };
    G__69271.cljs$lang$arity$variadic = G__69271__delegate;
    return G__69271
  }();
  hash_set = function(var_args) {
    var keys = var_args;
    switch(arguments.length) {
      case 0:
        return hash_set__0.call(this);
      default:
        return hash_set__1.cljs$lang$arity$variadic(cljs.core.array_seq(arguments, 0))
    }
    throw"Invalid arity: " + arguments.length;
  };
  hash_set.cljs$lang$maxFixedArity = 0;
  hash_set.cljs$lang$applyTo = hash_set__1.cljs$lang$applyTo;
  hash_set.cljs$lang$arity$0 = hash_set__0;
  hash_set.cljs$lang$arity$variadic = hash_set__1.cljs$lang$arity$variadic;
  return hash_set
}();
cljs.core.set = function set(coll) {
  return cljs.core.apply.call(null, cljs.core.hash_set, coll)
};
cljs.core.sorted_set = function() {
  var sorted_set__delegate = function(keys) {
    return cljs.core.reduce.call(null, cljs.core._conj, cljs.core.PersistentTreeSet.EMPTY, keys)
  };
  var sorted_set = function(var_args) {
    var keys = null;
    if(goog.isDef(var_args)) {
      keys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return sorted_set__delegate.call(this, keys)
  };
  sorted_set.cljs$lang$maxFixedArity = 0;
  sorted_set.cljs$lang$applyTo = function(arglist__69275) {
    var keys = cljs.core.seq(arglist__69275);
    return sorted_set__delegate(keys)
  };
  sorted_set.cljs$lang$arity$variadic = sorted_set__delegate;
  return sorted_set
}();
cljs.core.sorted_set_by = function() {
  var sorted_set_by__delegate = function(comparator, keys) {
    return cljs.core.reduce.call(null, cljs.core._conj, new cljs.core.PersistentTreeSet(null, cljs.core.sorted_map_by.call(null, comparator), 0), keys)
  };
  var sorted_set_by = function(comparator, var_args) {
    var keys = null;
    if(goog.isDef(var_args)) {
      keys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return sorted_set_by__delegate.call(this, comparator, keys)
  };
  sorted_set_by.cljs$lang$maxFixedArity = 1;
  sorted_set_by.cljs$lang$applyTo = function(arglist__69277) {
    var comparator = cljs.core.first(arglist__69277);
    var keys = cljs.core.rest(arglist__69277);
    return sorted_set_by__delegate(comparator, keys)
  };
  sorted_set_by.cljs$lang$arity$variadic = sorted_set_by__delegate;
  return sorted_set_by
}();
cljs.core.replace = function replace(smap, coll) {
  if(cljs.core.vector_QMARK_.call(null, coll)) {
    var n__69283 = cljs.core.count.call(null, coll);
    return cljs.core.reduce.call(null, function(v, i) {
      var temp__3971__auto____69284 = cljs.core.find.call(null, smap, cljs.core.nth.call(null, v, i));
      if(cljs.core.truth_(temp__3971__auto____69284)) {
        var e__69285 = temp__3971__auto____69284;
        return cljs.core.assoc.call(null, v, i, cljs.core.second.call(null, e__69285))
      }else {
        return v
      }
    }, coll, cljs.core.take.call(null, n__69283, cljs.core.iterate.call(null, cljs.core.inc, 0)))
  }else {
    return cljs.core.map.call(null, function(p1__69276_SHARP_) {
      var temp__3971__auto____69286 = cljs.core.find.call(null, smap, p1__69276_SHARP_);
      if(cljs.core.truth_(temp__3971__auto____69286)) {
        var e__69287 = temp__3971__auto____69286;
        return cljs.core.second.call(null, e__69287)
      }else {
        return p1__69276_SHARP_
      }
    }, coll)
  }
};
cljs.core.distinct = function distinct(coll) {
  var step__69317 = function step(xs, seen) {
    return new cljs.core.LazySeq(null, false, function() {
      return function(p__69310, seen) {
        while(true) {
          var vec__69311__69312 = p__69310;
          var f__69313 = cljs.core.nth.call(null, vec__69311__69312, 0, null);
          var xs__69314 = vec__69311__69312;
          var temp__3974__auto____69315 = cljs.core.seq.call(null, xs__69314);
          if(temp__3974__auto____69315) {
            var s__69316 = temp__3974__auto____69315;
            if(cljs.core.contains_QMARK_.call(null, seen, f__69313)) {
              var G__69318 = cljs.core.rest.call(null, s__69316);
              var G__69319 = seen;
              p__69310 = G__69318;
              seen = G__69319;
              continue
            }else {
              return cljs.core.cons.call(null, f__69313, step.call(null, cljs.core.rest.call(null, s__69316), cljs.core.conj.call(null, seen, f__69313)))
            }
          }else {
            return null
          }
          break
        }
      }.call(null, xs, seen)
    }, null)
  };
  return step__69317.call(null, coll, cljs.core.PersistentHashSet.EMPTY)
};
cljs.core.butlast = function butlast(s) {
  var ret__69322 = cljs.core.PersistentVector.EMPTY;
  var s__69323 = s;
  while(true) {
    if(cljs.core.next.call(null, s__69323)) {
      var G__69324 = cljs.core.conj.call(null, ret__69322, cljs.core.first.call(null, s__69323));
      var G__69325 = cljs.core.next.call(null, s__69323);
      ret__69322 = G__69324;
      s__69323 = G__69325;
      continue
    }else {
      return cljs.core.seq.call(null, ret__69322)
    }
    break
  }
};
cljs.core.name = function name(x) {
  if(cljs.core.string_QMARK_.call(null, x)) {
    return x
  }else {
    if(function() {
      var or__3824__auto____69328 = cljs.core.keyword_QMARK_.call(null, x);
      if(or__3824__auto____69328) {
        return or__3824__auto____69328
      }else {
        return cljs.core.symbol_QMARK_.call(null, x)
      }
    }()) {
      var i__69329 = x.lastIndexOf("/");
      if(i__69329 < 0) {
        return cljs.core.subs.call(null, x, 2)
      }else {
        return cljs.core.subs.call(null, x, i__69329 + 1)
      }
    }else {
      if("\ufdd0'else") {
        throw new Error([cljs.core.str("Doesn't support name: "), cljs.core.str(x)].join(""));
      }else {
        return null
      }
    }
  }
};
cljs.core.namespace = function namespace(x) {
  if(function() {
    var or__3824__auto____69332 = cljs.core.keyword_QMARK_.call(null, x);
    if(or__3824__auto____69332) {
      return or__3824__auto____69332
    }else {
      return cljs.core.symbol_QMARK_.call(null, x)
    }
  }()) {
    var i__69333 = x.lastIndexOf("/");
    if(i__69333 > -1) {
      return cljs.core.subs.call(null, x, 2, i__69333)
    }else {
      return null
    }
  }else {
    throw new Error([cljs.core.str("Doesn't support namespace: "), cljs.core.str(x)].join(""));
  }
};
cljs.core.zipmap = function zipmap(keys, vals) {
  var map__69340 = cljs.core.ObjMap.EMPTY;
  var ks__69341 = cljs.core.seq.call(null, keys);
  var vs__69342 = cljs.core.seq.call(null, vals);
  while(true) {
    if(function() {
      var and__3822__auto____69343 = ks__69341;
      if(and__3822__auto____69343) {
        return vs__69342
      }else {
        return and__3822__auto____69343
      }
    }()) {
      var G__69344 = cljs.core.assoc.call(null, map__69340, cljs.core.first.call(null, ks__69341), cljs.core.first.call(null, vs__69342));
      var G__69345 = cljs.core.next.call(null, ks__69341);
      var G__69346 = cljs.core.next.call(null, vs__69342);
      map__69340 = G__69344;
      ks__69341 = G__69345;
      vs__69342 = G__69346;
      continue
    }else {
      return map__69340
    }
    break
  }
};
cljs.core.max_key = function() {
  var max_key = null;
  var max_key__2 = function(k, x) {
    return x
  };
  var max_key__3 = function(k, x, y) {
    if(k.call(null, x) > k.call(null, y)) {
      return x
    }else {
      return y
    }
  };
  var max_key__4 = function() {
    var G__69349__delegate = function(k, x, y, more) {
      return cljs.core.reduce.call(null, function(p1__69334_SHARP_, p2__69335_SHARP_) {
        return max_key.call(null, k, p1__69334_SHARP_, p2__69335_SHARP_)
      }, max_key.call(null, k, x, y), more)
    };
    var G__69349 = function(k, x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__69349__delegate.call(this, k, x, y, more)
    };
    G__69349.cljs$lang$maxFixedArity = 3;
    G__69349.cljs$lang$applyTo = function(arglist__69350) {
      var k = cljs.core.first(arglist__69350);
      var x = cljs.core.first(cljs.core.next(arglist__69350));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(arglist__69350)));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__69350)));
      return G__69349__delegate(k, x, y, more)
    };
    G__69349.cljs$lang$arity$variadic = G__69349__delegate;
    return G__69349
  }();
  max_key = function(k, x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return max_key__2.call(this, k, x);
      case 3:
        return max_key__3.call(this, k, x, y);
      default:
        return max_key__4.cljs$lang$arity$variadic(k, x, y, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  max_key.cljs$lang$maxFixedArity = 3;
  max_key.cljs$lang$applyTo = max_key__4.cljs$lang$applyTo;
  max_key.cljs$lang$arity$2 = max_key__2;
  max_key.cljs$lang$arity$3 = max_key__3;
  max_key.cljs$lang$arity$variadic = max_key__4.cljs$lang$arity$variadic;
  return max_key
}();
cljs.core.min_key = function() {
  var min_key = null;
  var min_key__2 = function(k, x) {
    return x
  };
  var min_key__3 = function(k, x, y) {
    if(k.call(null, x) < k.call(null, y)) {
      return x
    }else {
      return y
    }
  };
  var min_key__4 = function() {
    var G__69351__delegate = function(k, x, y, more) {
      return cljs.core.reduce.call(null, function(p1__69347_SHARP_, p2__69348_SHARP_) {
        return min_key.call(null, k, p1__69347_SHARP_, p2__69348_SHARP_)
      }, min_key.call(null, k, x, y), more)
    };
    var G__69351 = function(k, x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__69351__delegate.call(this, k, x, y, more)
    };
    G__69351.cljs$lang$maxFixedArity = 3;
    G__69351.cljs$lang$applyTo = function(arglist__69352) {
      var k = cljs.core.first(arglist__69352);
      var x = cljs.core.first(cljs.core.next(arglist__69352));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(arglist__69352)));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__69352)));
      return G__69351__delegate(k, x, y, more)
    };
    G__69351.cljs$lang$arity$variadic = G__69351__delegate;
    return G__69351
  }();
  min_key = function(k, x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return min_key__2.call(this, k, x);
      case 3:
        return min_key__3.call(this, k, x, y);
      default:
        return min_key__4.cljs$lang$arity$variadic(k, x, y, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  min_key.cljs$lang$maxFixedArity = 3;
  min_key.cljs$lang$applyTo = min_key__4.cljs$lang$applyTo;
  min_key.cljs$lang$arity$2 = min_key__2;
  min_key.cljs$lang$arity$3 = min_key__3;
  min_key.cljs$lang$arity$variadic = min_key__4.cljs$lang$arity$variadic;
  return min_key
}();
cljs.core.partition_all = function() {
  var partition_all = null;
  var partition_all__2 = function(n, coll) {
    return partition_all.call(null, n, n, coll)
  };
  var partition_all__3 = function(n, step, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____69355 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____69355) {
        var s__69356 = temp__3974__auto____69355;
        return cljs.core.cons.call(null, cljs.core.take.call(null, n, s__69356), partition_all.call(null, n, step, cljs.core.drop.call(null, step, s__69356)))
      }else {
        return null
      }
    }, null)
  };
  partition_all = function(n, step, coll) {
    switch(arguments.length) {
      case 2:
        return partition_all__2.call(this, n, step);
      case 3:
        return partition_all__3.call(this, n, step, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  partition_all.cljs$lang$arity$2 = partition_all__2;
  partition_all.cljs$lang$arity$3 = partition_all__3;
  return partition_all
}();
cljs.core.take_while = function take_while(pred, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____69359 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____69359) {
      var s__69360 = temp__3974__auto____69359;
      if(cljs.core.truth_(pred.call(null, cljs.core.first.call(null, s__69360)))) {
        return cljs.core.cons.call(null, cljs.core.first.call(null, s__69360), take_while.call(null, pred, cljs.core.rest.call(null, s__69360)))
      }else {
        return null
      }
    }else {
      return null
    }
  }, null)
};
cljs.core.mk_bound_fn = function mk_bound_fn(sc, test, key) {
  return function(e) {
    var comp__69362 = cljs.core._comparator.call(null, sc);
    return test.call(null, comp__69362.call(null, cljs.core._entry_key.call(null, sc, e), key), 0)
  }
};
cljs.core.subseq = function() {
  var subseq = null;
  var subseq__3 = function(sc, test, key) {
    var include__69374 = cljs.core.mk_bound_fn.call(null, sc, test, key);
    if(cljs.core.truth_(cljs.core.PersistentHashSet.fromArray([cljs.core._GT_, cljs.core._GT__EQ_]).call(null, test))) {
      var temp__3974__auto____69375 = cljs.core._sorted_seq_from.call(null, sc, key, true);
      if(cljs.core.truth_(temp__3974__auto____69375)) {
        var vec__69376__69377 = temp__3974__auto____69375;
        var e__69378 = cljs.core.nth.call(null, vec__69376__69377, 0, null);
        var s__69379 = vec__69376__69377;
        if(cljs.core.truth_(include__69374.call(null, e__69378))) {
          return s__69379
        }else {
          return cljs.core.next.call(null, s__69379)
        }
      }else {
        return null
      }
    }else {
      return cljs.core.take_while.call(null, include__69374, cljs.core._sorted_seq.call(null, sc, true))
    }
  };
  var subseq__5 = function(sc, start_test, start_key, end_test, end_key) {
    var temp__3974__auto____69380 = cljs.core._sorted_seq_from.call(null, sc, start_key, true);
    if(cljs.core.truth_(temp__3974__auto____69380)) {
      var vec__69381__69382 = temp__3974__auto____69380;
      var e__69383 = cljs.core.nth.call(null, vec__69381__69382, 0, null);
      var s__69384 = vec__69381__69382;
      return cljs.core.take_while.call(null, cljs.core.mk_bound_fn.call(null, sc, end_test, end_key), cljs.core.truth_(cljs.core.mk_bound_fn.call(null, sc, start_test, start_key).call(null, e__69383)) ? s__69384 : cljs.core.next.call(null, s__69384))
    }else {
      return null
    }
  };
  subseq = function(sc, start_test, start_key, end_test, end_key) {
    switch(arguments.length) {
      case 3:
        return subseq__3.call(this, sc, start_test, start_key);
      case 5:
        return subseq__5.call(this, sc, start_test, start_key, end_test, end_key)
    }
    throw"Invalid arity: " + arguments.length;
  };
  subseq.cljs$lang$arity$3 = subseq__3;
  subseq.cljs$lang$arity$5 = subseq__5;
  return subseq
}();
cljs.core.rsubseq = function() {
  var rsubseq = null;
  var rsubseq__3 = function(sc, test, key) {
    var include__69396 = cljs.core.mk_bound_fn.call(null, sc, test, key);
    if(cljs.core.truth_(cljs.core.PersistentHashSet.fromArray([cljs.core._LT_, cljs.core._LT__EQ_]).call(null, test))) {
      var temp__3974__auto____69397 = cljs.core._sorted_seq_from.call(null, sc, key, false);
      if(cljs.core.truth_(temp__3974__auto____69397)) {
        var vec__69398__69399 = temp__3974__auto____69397;
        var e__69400 = cljs.core.nth.call(null, vec__69398__69399, 0, null);
        var s__69401 = vec__69398__69399;
        if(cljs.core.truth_(include__69396.call(null, e__69400))) {
          return s__69401
        }else {
          return cljs.core.next.call(null, s__69401)
        }
      }else {
        return null
      }
    }else {
      return cljs.core.take_while.call(null, include__69396, cljs.core._sorted_seq.call(null, sc, false))
    }
  };
  var rsubseq__5 = function(sc, start_test, start_key, end_test, end_key) {
    var temp__3974__auto____69402 = cljs.core._sorted_seq_from.call(null, sc, end_key, false);
    if(cljs.core.truth_(temp__3974__auto____69402)) {
      var vec__69403__69404 = temp__3974__auto____69402;
      var e__69405 = cljs.core.nth.call(null, vec__69403__69404, 0, null);
      var s__69406 = vec__69403__69404;
      return cljs.core.take_while.call(null, cljs.core.mk_bound_fn.call(null, sc, start_test, start_key), cljs.core.truth_(cljs.core.mk_bound_fn.call(null, sc, end_test, end_key).call(null, e__69405)) ? s__69406 : cljs.core.next.call(null, s__69406))
    }else {
      return null
    }
  };
  rsubseq = function(sc, start_test, start_key, end_test, end_key) {
    switch(arguments.length) {
      case 3:
        return rsubseq__3.call(this, sc, start_test, start_key);
      case 5:
        return rsubseq__5.call(this, sc, start_test, start_key, end_test, end_key)
    }
    throw"Invalid arity: " + arguments.length;
  };
  rsubseq.cljs$lang$arity$3 = rsubseq__3;
  rsubseq.cljs$lang$arity$5 = rsubseq__5;
  return rsubseq
}();
cljs.core.Range = function(meta, start, end, step, __hash) {
  this.meta = meta;
  this.start = start;
  this.end = end;
  this.step = step;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32375006
};
cljs.core.Range.cljs$lang$type = true;
cljs.core.Range.cljs$lang$ctorPrSeq = function(this__2343__auto__) {
  return cljs.core.list.call(null, "cljs.core/Range")
};
cljs.core.Range.prototype.cljs$core$IHash$_hash$arity$1 = function(rng) {
  var this__69407 = this;
  var h__2226__auto____69408 = this__69407.__hash;
  if(!(h__2226__auto____69408 == null)) {
    return h__2226__auto____69408
  }else {
    var h__2226__auto____69409 = cljs.core.hash_coll.call(null, rng);
    this__69407.__hash = h__2226__auto____69409;
    return h__2226__auto____69409
  }
};
cljs.core.Range.prototype.cljs$core$INext$_next$arity$1 = function(rng) {
  var this__69410 = this;
  if(this__69410.step > 0) {
    if(this__69410.start + this__69410.step < this__69410.end) {
      return new cljs.core.Range(this__69410.meta, this__69410.start + this__69410.step, this__69410.end, this__69410.step, null)
    }else {
      return null
    }
  }else {
    if(this__69410.start + this__69410.step > this__69410.end) {
      return new cljs.core.Range(this__69410.meta, this__69410.start + this__69410.step, this__69410.end, this__69410.step, null)
    }else {
      return null
    }
  }
};
cljs.core.Range.prototype.cljs$core$ICollection$_conj$arity$2 = function(rng, o) {
  var this__69411 = this;
  return cljs.core.cons.call(null, o, rng)
};
cljs.core.Range.prototype.toString = function() {
  var this__69412 = this;
  var this__69413 = this;
  return cljs.core.pr_str.call(null, this__69413)
};
cljs.core.Range.prototype.cljs$core$IReduce$_reduce$arity$2 = function(rng, f) {
  var this__69414 = this;
  return cljs.core.ci_reduce.call(null, rng, f)
};
cljs.core.Range.prototype.cljs$core$IReduce$_reduce$arity$3 = function(rng, f, s) {
  var this__69415 = this;
  return cljs.core.ci_reduce.call(null, rng, f, s)
};
cljs.core.Range.prototype.cljs$core$ISeqable$_seq$arity$1 = function(rng) {
  var this__69416 = this;
  if(this__69416.step > 0) {
    if(this__69416.start < this__69416.end) {
      return rng
    }else {
      return null
    }
  }else {
    if(this__69416.start > this__69416.end) {
      return rng
    }else {
      return null
    }
  }
};
cljs.core.Range.prototype.cljs$core$ICounted$_count$arity$1 = function(rng) {
  var this__69417 = this;
  if(cljs.core.not.call(null, rng.cljs$core$ISeqable$_seq$arity$1(rng))) {
    return 0
  }else {
    return Math.ceil((this__69417.end - this__69417.start) / this__69417.step)
  }
};
cljs.core.Range.prototype.cljs$core$ISeq$_first$arity$1 = function(rng) {
  var this__69418 = this;
  return this__69418.start
};
cljs.core.Range.prototype.cljs$core$ISeq$_rest$arity$1 = function(rng) {
  var this__69419 = this;
  if(!(rng.cljs$core$ISeqable$_seq$arity$1(rng) == null)) {
    return new cljs.core.Range(this__69419.meta, this__69419.start + this__69419.step, this__69419.end, this__69419.step, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.Range.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(rng, other) {
  var this__69420 = this;
  return cljs.core.equiv_sequential.call(null, rng, other)
};
cljs.core.Range.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(rng, meta) {
  var this__69421 = this;
  return new cljs.core.Range(meta, this__69421.start, this__69421.end, this__69421.step, this__69421.__hash)
};
cljs.core.Range.prototype.cljs$core$IMeta$_meta$arity$1 = function(rng) {
  var this__69422 = this;
  return this__69422.meta
};
cljs.core.Range.prototype.cljs$core$IIndexed$_nth$arity$2 = function(rng, n) {
  var this__69423 = this;
  if(n < rng.cljs$core$ICounted$_count$arity$1(rng)) {
    return this__69423.start + n * this__69423.step
  }else {
    if(function() {
      var and__3822__auto____69424 = this__69423.start > this__69423.end;
      if(and__3822__auto____69424) {
        return this__69423.step === 0
      }else {
        return and__3822__auto____69424
      }
    }()) {
      return this__69423.start
    }else {
      throw new Error("Index out of bounds");
    }
  }
};
cljs.core.Range.prototype.cljs$core$IIndexed$_nth$arity$3 = function(rng, n, not_found) {
  var this__69425 = this;
  if(n < rng.cljs$core$ICounted$_count$arity$1(rng)) {
    return this__69425.start + n * this__69425.step
  }else {
    if(function() {
      var and__3822__auto____69426 = this__69425.start > this__69425.end;
      if(and__3822__auto____69426) {
        return this__69425.step === 0
      }else {
        return and__3822__auto____69426
      }
    }()) {
      return this__69425.start
    }else {
      return not_found
    }
  }
};
cljs.core.Range.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(rng) {
  var this__69427 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__69427.meta)
};
cljs.core.Range;
cljs.core.range = function() {
  var range = null;
  var range__0 = function() {
    return range.call(null, 0, Number.MAX_VALUE, 1)
  };
  var range__1 = function(end) {
    return range.call(null, 0, end, 1)
  };
  var range__2 = function(start, end) {
    return range.call(null, start, end, 1)
  };
  var range__3 = function(start, end, step) {
    return new cljs.core.Range(null, start, end, step, null)
  };
  range = function(start, end, step) {
    switch(arguments.length) {
      case 0:
        return range__0.call(this);
      case 1:
        return range__1.call(this, start);
      case 2:
        return range__2.call(this, start, end);
      case 3:
        return range__3.call(this, start, end, step)
    }
    throw"Invalid arity: " + arguments.length;
  };
  range.cljs$lang$arity$0 = range__0;
  range.cljs$lang$arity$1 = range__1;
  range.cljs$lang$arity$2 = range__2;
  range.cljs$lang$arity$3 = range__3;
  return range
}();
cljs.core.take_nth = function take_nth(n, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____69430 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____69430) {
      var s__69431 = temp__3974__auto____69430;
      return cljs.core.cons.call(null, cljs.core.first.call(null, s__69431), take_nth.call(null, n, cljs.core.drop.call(null, n, s__69431)))
    }else {
      return null
    }
  }, null)
};
cljs.core.split_with = function split_with(pred, coll) {
  return cljs.core.PersistentVector.fromArray([cljs.core.take_while.call(null, pred, coll), cljs.core.drop_while.call(null, pred, coll)], true)
};
cljs.core.partition_by = function partition_by(f, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____69438 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____69438) {
      var s__69439 = temp__3974__auto____69438;
      var fst__69440 = cljs.core.first.call(null, s__69439);
      var fv__69441 = f.call(null, fst__69440);
      var run__69442 = cljs.core.cons.call(null, fst__69440, cljs.core.take_while.call(null, function(p1__69432_SHARP_) {
        return cljs.core._EQ_.call(null, fv__69441, f.call(null, p1__69432_SHARP_))
      }, cljs.core.next.call(null, s__69439)));
      return cljs.core.cons.call(null, run__69442, partition_by.call(null, f, cljs.core.seq.call(null, cljs.core.drop.call(null, cljs.core.count.call(null, run__69442), s__69439))))
    }else {
      return null
    }
  }, null)
};
cljs.core.frequencies = function frequencies(coll) {
  return cljs.core.persistent_BANG_.call(null, cljs.core.reduce.call(null, function(counts, x) {
    return cljs.core.assoc_BANG_.call(null, counts, x, cljs.core._lookup.call(null, counts, x, 0) + 1)
  }, cljs.core.transient$.call(null, cljs.core.ObjMap.EMPTY), coll))
};
cljs.core.reductions = function() {
  var reductions = null;
  var reductions__2 = function(f, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3971__auto____69457 = cljs.core.seq.call(null, coll);
      if(temp__3971__auto____69457) {
        var s__69458 = temp__3971__auto____69457;
        return reductions.call(null, f, cljs.core.first.call(null, s__69458), cljs.core.rest.call(null, s__69458))
      }else {
        return cljs.core.list.call(null, f.call(null))
      }
    }, null)
  };
  var reductions__3 = function(f, init, coll) {
    return cljs.core.cons.call(null, init, new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____69459 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____69459) {
        var s__69460 = temp__3974__auto____69459;
        return reductions.call(null, f, f.call(null, init, cljs.core.first.call(null, s__69460)), cljs.core.rest.call(null, s__69460))
      }else {
        return null
      }
    }, null))
  };
  reductions = function(f, init, coll) {
    switch(arguments.length) {
      case 2:
        return reductions__2.call(this, f, init);
      case 3:
        return reductions__3.call(this, f, init, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  reductions.cljs$lang$arity$2 = reductions__2;
  reductions.cljs$lang$arity$3 = reductions__3;
  return reductions
}();
cljs.core.juxt = function() {
  var juxt = null;
  var juxt__1 = function(f) {
    return function() {
      var G__69463 = null;
      var G__69463__0 = function() {
        return cljs.core.vector.call(null, f.call(null))
      };
      var G__69463__1 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x))
      };
      var G__69463__2 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y))
      };
      var G__69463__3 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z))
      };
      var G__69463__4 = function() {
        var G__69464__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args))
        };
        var G__69464 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__69464__delegate.call(this, x, y, z, args)
        };
        G__69464.cljs$lang$maxFixedArity = 3;
        G__69464.cljs$lang$applyTo = function(arglist__69465) {
          var x = cljs.core.first(arglist__69465);
          var y = cljs.core.first(cljs.core.next(arglist__69465));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__69465)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__69465)));
          return G__69464__delegate(x, y, z, args)
        };
        G__69464.cljs$lang$arity$variadic = G__69464__delegate;
        return G__69464
      }();
      G__69463 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__69463__0.call(this);
          case 1:
            return G__69463__1.call(this, x);
          case 2:
            return G__69463__2.call(this, x, y);
          case 3:
            return G__69463__3.call(this, x, y, z);
          default:
            return G__69463__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__69463.cljs$lang$maxFixedArity = 3;
      G__69463.cljs$lang$applyTo = G__69463__4.cljs$lang$applyTo;
      return G__69463
    }()
  };
  var juxt__2 = function(f, g) {
    return function() {
      var G__69466 = null;
      var G__69466__0 = function() {
        return cljs.core.vector.call(null, f.call(null), g.call(null))
      };
      var G__69466__1 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x), g.call(null, x))
      };
      var G__69466__2 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y), g.call(null, x, y))
      };
      var G__69466__3 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z), g.call(null, x, y, z))
      };
      var G__69466__4 = function() {
        var G__69467__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args), cljs.core.apply.call(null, g, x, y, z, args))
        };
        var G__69467 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__69467__delegate.call(this, x, y, z, args)
        };
        G__69467.cljs$lang$maxFixedArity = 3;
        G__69467.cljs$lang$applyTo = function(arglist__69468) {
          var x = cljs.core.first(arglist__69468);
          var y = cljs.core.first(cljs.core.next(arglist__69468));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__69468)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__69468)));
          return G__69467__delegate(x, y, z, args)
        };
        G__69467.cljs$lang$arity$variadic = G__69467__delegate;
        return G__69467
      }();
      G__69466 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__69466__0.call(this);
          case 1:
            return G__69466__1.call(this, x);
          case 2:
            return G__69466__2.call(this, x, y);
          case 3:
            return G__69466__3.call(this, x, y, z);
          default:
            return G__69466__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__69466.cljs$lang$maxFixedArity = 3;
      G__69466.cljs$lang$applyTo = G__69466__4.cljs$lang$applyTo;
      return G__69466
    }()
  };
  var juxt__3 = function(f, g, h) {
    return function() {
      var G__69469 = null;
      var G__69469__0 = function() {
        return cljs.core.vector.call(null, f.call(null), g.call(null), h.call(null))
      };
      var G__69469__1 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x), g.call(null, x), h.call(null, x))
      };
      var G__69469__2 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y), g.call(null, x, y), h.call(null, x, y))
      };
      var G__69469__3 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z), g.call(null, x, y, z), h.call(null, x, y, z))
      };
      var G__69469__4 = function() {
        var G__69470__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args), cljs.core.apply.call(null, g, x, y, z, args), cljs.core.apply.call(null, h, x, y, z, args))
        };
        var G__69470 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__69470__delegate.call(this, x, y, z, args)
        };
        G__69470.cljs$lang$maxFixedArity = 3;
        G__69470.cljs$lang$applyTo = function(arglist__69471) {
          var x = cljs.core.first(arglist__69471);
          var y = cljs.core.first(cljs.core.next(arglist__69471));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__69471)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__69471)));
          return G__69470__delegate(x, y, z, args)
        };
        G__69470.cljs$lang$arity$variadic = G__69470__delegate;
        return G__69470
      }();
      G__69469 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__69469__0.call(this);
          case 1:
            return G__69469__1.call(this, x);
          case 2:
            return G__69469__2.call(this, x, y);
          case 3:
            return G__69469__3.call(this, x, y, z);
          default:
            return G__69469__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__69469.cljs$lang$maxFixedArity = 3;
      G__69469.cljs$lang$applyTo = G__69469__4.cljs$lang$applyTo;
      return G__69469
    }()
  };
  var juxt__4 = function() {
    var G__69472__delegate = function(f, g, h, fs) {
      var fs__69462 = cljs.core.list_STAR_.call(null, f, g, h, fs);
      return function() {
        var G__69473 = null;
        var G__69473__0 = function() {
          return cljs.core.reduce.call(null, function(p1__69443_SHARP_, p2__69444_SHARP_) {
            return cljs.core.conj.call(null, p1__69443_SHARP_, p2__69444_SHARP_.call(null))
          }, cljs.core.PersistentVector.EMPTY, fs__69462)
        };
        var G__69473__1 = function(x) {
          return cljs.core.reduce.call(null, function(p1__69445_SHARP_, p2__69446_SHARP_) {
            return cljs.core.conj.call(null, p1__69445_SHARP_, p2__69446_SHARP_.call(null, x))
          }, cljs.core.PersistentVector.EMPTY, fs__69462)
        };
        var G__69473__2 = function(x, y) {
          return cljs.core.reduce.call(null, function(p1__69447_SHARP_, p2__69448_SHARP_) {
            return cljs.core.conj.call(null, p1__69447_SHARP_, p2__69448_SHARP_.call(null, x, y))
          }, cljs.core.PersistentVector.EMPTY, fs__69462)
        };
        var G__69473__3 = function(x, y, z) {
          return cljs.core.reduce.call(null, function(p1__69449_SHARP_, p2__69450_SHARP_) {
            return cljs.core.conj.call(null, p1__69449_SHARP_, p2__69450_SHARP_.call(null, x, y, z))
          }, cljs.core.PersistentVector.EMPTY, fs__69462)
        };
        var G__69473__4 = function() {
          var G__69474__delegate = function(x, y, z, args) {
            return cljs.core.reduce.call(null, function(p1__69451_SHARP_, p2__69452_SHARP_) {
              return cljs.core.conj.call(null, p1__69451_SHARP_, cljs.core.apply.call(null, p2__69452_SHARP_, x, y, z, args))
            }, cljs.core.PersistentVector.EMPTY, fs__69462)
          };
          var G__69474 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__69474__delegate.call(this, x, y, z, args)
          };
          G__69474.cljs$lang$maxFixedArity = 3;
          G__69474.cljs$lang$applyTo = function(arglist__69475) {
            var x = cljs.core.first(arglist__69475);
            var y = cljs.core.first(cljs.core.next(arglist__69475));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__69475)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__69475)));
            return G__69474__delegate(x, y, z, args)
          };
          G__69474.cljs$lang$arity$variadic = G__69474__delegate;
          return G__69474
        }();
        G__69473 = function(x, y, z, var_args) {
          var args = var_args;
          switch(arguments.length) {
            case 0:
              return G__69473__0.call(this);
            case 1:
              return G__69473__1.call(this, x);
            case 2:
              return G__69473__2.call(this, x, y);
            case 3:
              return G__69473__3.call(this, x, y, z);
            default:
              return G__69473__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
          }
          throw"Invalid arity: " + arguments.length;
        };
        G__69473.cljs$lang$maxFixedArity = 3;
        G__69473.cljs$lang$applyTo = G__69473__4.cljs$lang$applyTo;
        return G__69473
      }()
    };
    var G__69472 = function(f, g, h, var_args) {
      var fs = null;
      if(goog.isDef(var_args)) {
        fs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__69472__delegate.call(this, f, g, h, fs)
    };
    G__69472.cljs$lang$maxFixedArity = 3;
    G__69472.cljs$lang$applyTo = function(arglist__69476) {
      var f = cljs.core.first(arglist__69476);
      var g = cljs.core.first(cljs.core.next(arglist__69476));
      var h = cljs.core.first(cljs.core.next(cljs.core.next(arglist__69476)));
      var fs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__69476)));
      return G__69472__delegate(f, g, h, fs)
    };
    G__69472.cljs$lang$arity$variadic = G__69472__delegate;
    return G__69472
  }();
  juxt = function(f, g, h, var_args) {
    var fs = var_args;
    switch(arguments.length) {
      case 1:
        return juxt__1.call(this, f);
      case 2:
        return juxt__2.call(this, f, g);
      case 3:
        return juxt__3.call(this, f, g, h);
      default:
        return juxt__4.cljs$lang$arity$variadic(f, g, h, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  juxt.cljs$lang$maxFixedArity = 3;
  juxt.cljs$lang$applyTo = juxt__4.cljs$lang$applyTo;
  juxt.cljs$lang$arity$1 = juxt__1;
  juxt.cljs$lang$arity$2 = juxt__2;
  juxt.cljs$lang$arity$3 = juxt__3;
  juxt.cljs$lang$arity$variadic = juxt__4.cljs$lang$arity$variadic;
  return juxt
}();
cljs.core.dorun = function() {
  var dorun = null;
  var dorun__1 = function(coll) {
    while(true) {
      if(cljs.core.seq.call(null, coll)) {
        var G__69479 = cljs.core.next.call(null, coll);
        coll = G__69479;
        continue
      }else {
        return null
      }
      break
    }
  };
  var dorun__2 = function(n, coll) {
    while(true) {
      if(cljs.core.truth_(function() {
        var and__3822__auto____69478 = cljs.core.seq.call(null, coll);
        if(and__3822__auto____69478) {
          return n > 0
        }else {
          return and__3822__auto____69478
        }
      }())) {
        var G__69480 = n - 1;
        var G__69481 = cljs.core.next.call(null, coll);
        n = G__69480;
        coll = G__69481;
        continue
      }else {
        return null
      }
      break
    }
  };
  dorun = function(n, coll) {
    switch(arguments.length) {
      case 1:
        return dorun__1.call(this, n);
      case 2:
        return dorun__2.call(this, n, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  dorun.cljs$lang$arity$1 = dorun__1;
  dorun.cljs$lang$arity$2 = dorun__2;
  return dorun
}();
cljs.core.doall = function() {
  var doall = null;
  var doall__1 = function(coll) {
    cljs.core.dorun.call(null, coll);
    return coll
  };
  var doall__2 = function(n, coll) {
    cljs.core.dorun.call(null, n, coll);
    return coll
  };
  doall = function(n, coll) {
    switch(arguments.length) {
      case 1:
        return doall__1.call(this, n);
      case 2:
        return doall__2.call(this, n, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  doall.cljs$lang$arity$1 = doall__1;
  doall.cljs$lang$arity$2 = doall__2;
  return doall
}();
cljs.core.regexp_QMARK_ = function regexp_QMARK_(o) {
  return o instanceof RegExp
};
cljs.core.re_matches = function re_matches(re, s) {
  var matches__69483 = re.exec(s);
  if(cljs.core._EQ_.call(null, cljs.core.first.call(null, matches__69483), s)) {
    if(cljs.core.count.call(null, matches__69483) === 1) {
      return cljs.core.first.call(null, matches__69483)
    }else {
      return cljs.core.vec.call(null, matches__69483)
    }
  }else {
    return null
  }
};
cljs.core.re_find = function re_find(re, s) {
  var matches__69485 = re.exec(s);
  if(matches__69485 == null) {
    return null
  }else {
    if(cljs.core.count.call(null, matches__69485) === 1) {
      return cljs.core.first.call(null, matches__69485)
    }else {
      return cljs.core.vec.call(null, matches__69485)
    }
  }
};
cljs.core.re_seq = function re_seq(re, s) {
  var match_data__69490 = cljs.core.re_find.call(null, re, s);
  var match_idx__69491 = s.search(re);
  var match_str__69492 = cljs.core.coll_QMARK_.call(null, match_data__69490) ? cljs.core.first.call(null, match_data__69490) : match_data__69490;
  var post_match__69493 = cljs.core.subs.call(null, s, match_idx__69491 + cljs.core.count.call(null, match_str__69492));
  if(cljs.core.truth_(match_data__69490)) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, match_data__69490, re_seq.call(null, re, post_match__69493))
    }, null)
  }else {
    return null
  }
};
cljs.core.re_pattern = function re_pattern(s) {
  var vec__69500__69501 = cljs.core.re_find.call(null, /^(?:\(\?([idmsux]*)\))?(.*)/, s);
  var ___69502 = cljs.core.nth.call(null, vec__69500__69501, 0, null);
  var flags__69503 = cljs.core.nth.call(null, vec__69500__69501, 1, null);
  var pattern__69504 = cljs.core.nth.call(null, vec__69500__69501, 2, null);
  return new RegExp(pattern__69504, flags__69503)
};
cljs.core.pr_sequential = function pr_sequential(print_one, begin, sep, end, opts, coll) {
  return cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray([begin], true), cljs.core.flatten1.call(null, cljs.core.interpose.call(null, cljs.core.PersistentVector.fromArray([sep], true), cljs.core.map.call(null, function(p1__69494_SHARP_) {
    return print_one.call(null, p1__69494_SHARP_, opts)
  }, coll))), cljs.core.PersistentVector.fromArray([end], true))
};
cljs.core.string_print = function string_print(x) {
  cljs.core._STAR_print_fn_STAR_.call(null, x);
  return null
};
cljs.core.flush = function flush() {
  return null
};
cljs.core.pr_seq = function pr_seq(obj, opts) {
  if(obj == null) {
    return cljs.core.list.call(null, "nil")
  }else {
    if(void 0 === obj) {
      return cljs.core.list.call(null, "#<undefined>")
    }else {
      if("\ufdd0'else") {
        return cljs.core.concat.call(null, cljs.core.truth_(function() {
          var and__3822__auto____69514 = cljs.core._lookup.call(null, opts, "\ufdd0'meta", null);
          if(cljs.core.truth_(and__3822__auto____69514)) {
            var and__3822__auto____69518 = function() {
              var G__69515__69516 = obj;
              if(G__69515__69516) {
                if(function() {
                  var or__3824__auto____69517 = G__69515__69516.cljs$lang$protocol_mask$partition0$ & 131072;
                  if(or__3824__auto____69517) {
                    return or__3824__auto____69517
                  }else {
                    return G__69515__69516.cljs$core$IMeta$
                  }
                }()) {
                  return true
                }else {
                  if(!G__69515__69516.cljs$lang$protocol_mask$partition0$) {
                    return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__69515__69516)
                  }else {
                    return false
                  }
                }
              }else {
                return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__69515__69516)
              }
            }();
            if(cljs.core.truth_(and__3822__auto____69518)) {
              return cljs.core.meta.call(null, obj)
            }else {
              return and__3822__auto____69518
            }
          }else {
            return and__3822__auto____69514
          }
        }()) ? cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray(["^"], true), pr_seq.call(null, cljs.core.meta.call(null, obj), opts), cljs.core.PersistentVector.fromArray([" "], true)) : null, function() {
          var and__3822__auto____69519 = !(obj == null);
          if(and__3822__auto____69519) {
            return obj.cljs$lang$type
          }else {
            return and__3822__auto____69519
          }
        }() ? obj.cljs$lang$ctorPrSeq(obj) : function() {
          var G__69520__69521 = obj;
          if(G__69520__69521) {
            if(function() {
              var or__3824__auto____69522 = G__69520__69521.cljs$lang$protocol_mask$partition0$ & 536870912;
              if(or__3824__auto____69522) {
                return or__3824__auto____69522
              }else {
                return G__69520__69521.cljs$core$IPrintable$
              }
            }()) {
              return true
            }else {
              if(!G__69520__69521.cljs$lang$protocol_mask$partition0$) {
                return cljs.core.type_satisfies_.call(null, cljs.core.IPrintable, G__69520__69521)
              }else {
                return false
              }
            }
          }else {
            return cljs.core.type_satisfies_.call(null, cljs.core.IPrintable, G__69520__69521)
          }
        }() ? cljs.core._pr_seq.call(null, obj, opts) : cljs.core.truth_(cljs.core.regexp_QMARK_.call(null, obj)) ? cljs.core.list.call(null, '#"', obj.source, '"') : "\ufdd0'else" ? cljs.core.list.call(null, "#<", [cljs.core.str(obj)].join(""), ">") : null)
      }else {
        return null
      }
    }
  }
};
cljs.core.pr_sb = function pr_sb(objs, opts) {
  var sb__69542 = new goog.string.StringBuffer;
  var G__69543__69544 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, cljs.core.first.call(null, objs), opts));
  if(G__69543__69544) {
    var string__69545 = cljs.core.first.call(null, G__69543__69544);
    var G__69543__69546 = G__69543__69544;
    while(true) {
      sb__69542.append(string__69545);
      var temp__3974__auto____69547 = cljs.core.next.call(null, G__69543__69546);
      if(temp__3974__auto____69547) {
        var G__69543__69548 = temp__3974__auto____69547;
        var G__69561 = cljs.core.first.call(null, G__69543__69548);
        var G__69562 = G__69543__69548;
        string__69545 = G__69561;
        G__69543__69546 = G__69562;
        continue
      }else {
      }
      break
    }
  }else {
  }
  var G__69549__69550 = cljs.core.seq.call(null, cljs.core.next.call(null, objs));
  if(G__69549__69550) {
    var obj__69551 = cljs.core.first.call(null, G__69549__69550);
    var G__69549__69552 = G__69549__69550;
    while(true) {
      sb__69542.append(" ");
      var G__69553__69554 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, obj__69551, opts));
      if(G__69553__69554) {
        var string__69555 = cljs.core.first.call(null, G__69553__69554);
        var G__69553__69556 = G__69553__69554;
        while(true) {
          sb__69542.append(string__69555);
          var temp__3974__auto____69557 = cljs.core.next.call(null, G__69553__69556);
          if(temp__3974__auto____69557) {
            var G__69553__69558 = temp__3974__auto____69557;
            var G__69563 = cljs.core.first.call(null, G__69553__69558);
            var G__69564 = G__69553__69558;
            string__69555 = G__69563;
            G__69553__69556 = G__69564;
            continue
          }else {
          }
          break
        }
      }else {
      }
      var temp__3974__auto____69559 = cljs.core.next.call(null, G__69549__69552);
      if(temp__3974__auto____69559) {
        var G__69549__69560 = temp__3974__auto____69559;
        var G__69565 = cljs.core.first.call(null, G__69549__69560);
        var G__69566 = G__69549__69560;
        obj__69551 = G__69565;
        G__69549__69552 = G__69566;
        continue
      }else {
      }
      break
    }
  }else {
  }
  return sb__69542
};
cljs.core.pr_str_with_opts = function pr_str_with_opts(objs, opts) {
  return[cljs.core.str(cljs.core.pr_sb.call(null, objs, opts))].join("")
};
cljs.core.prn_str_with_opts = function prn_str_with_opts(objs, opts) {
  var sb__69568 = cljs.core.pr_sb.call(null, objs, opts);
  sb__69568.append("\n");
  return[cljs.core.str(sb__69568)].join("")
};
cljs.core.pr_with_opts = function pr_with_opts(objs, opts) {
  var G__69587__69588 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, cljs.core.first.call(null, objs), opts));
  if(G__69587__69588) {
    var string__69589 = cljs.core.first.call(null, G__69587__69588);
    var G__69587__69590 = G__69587__69588;
    while(true) {
      cljs.core.string_print.call(null, string__69589);
      var temp__3974__auto____69591 = cljs.core.next.call(null, G__69587__69590);
      if(temp__3974__auto____69591) {
        var G__69587__69592 = temp__3974__auto____69591;
        var G__69605 = cljs.core.first.call(null, G__69587__69592);
        var G__69606 = G__69587__69592;
        string__69589 = G__69605;
        G__69587__69590 = G__69606;
        continue
      }else {
      }
      break
    }
  }else {
  }
  var G__69593__69594 = cljs.core.seq.call(null, cljs.core.next.call(null, objs));
  if(G__69593__69594) {
    var obj__69595 = cljs.core.first.call(null, G__69593__69594);
    var G__69593__69596 = G__69593__69594;
    while(true) {
      cljs.core.string_print.call(null, " ");
      var G__69597__69598 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, obj__69595, opts));
      if(G__69597__69598) {
        var string__69599 = cljs.core.first.call(null, G__69597__69598);
        var G__69597__69600 = G__69597__69598;
        while(true) {
          cljs.core.string_print.call(null, string__69599);
          var temp__3974__auto____69601 = cljs.core.next.call(null, G__69597__69600);
          if(temp__3974__auto____69601) {
            var G__69597__69602 = temp__3974__auto____69601;
            var G__69607 = cljs.core.first.call(null, G__69597__69602);
            var G__69608 = G__69597__69602;
            string__69599 = G__69607;
            G__69597__69600 = G__69608;
            continue
          }else {
          }
          break
        }
      }else {
      }
      var temp__3974__auto____69603 = cljs.core.next.call(null, G__69593__69596);
      if(temp__3974__auto____69603) {
        var G__69593__69604 = temp__3974__auto____69603;
        var G__69609 = cljs.core.first.call(null, G__69593__69604);
        var G__69610 = G__69593__69604;
        obj__69595 = G__69609;
        G__69593__69596 = G__69610;
        continue
      }else {
        return null
      }
      break
    }
  }else {
    return null
  }
};
cljs.core.newline = function newline(opts) {
  cljs.core.string_print.call(null, "\n");
  if(cljs.core.truth_(cljs.core._lookup.call(null, opts, "\ufdd0'flush-on-newline", null))) {
    return cljs.core.flush.call(null)
  }else {
    return null
  }
};
cljs.core._STAR_flush_on_newline_STAR_ = true;
cljs.core._STAR_print_readably_STAR_ = true;
cljs.core._STAR_print_meta_STAR_ = false;
cljs.core._STAR_print_dup_STAR_ = false;
cljs.core.pr_opts = function pr_opts() {
  return cljs.core.ObjMap.fromObject(["\ufdd0'flush-on-newline", "\ufdd0'readably", "\ufdd0'meta", "\ufdd0'dup"], {"\ufdd0'flush-on-newline":cljs.core._STAR_flush_on_newline_STAR_, "\ufdd0'readably":cljs.core._STAR_print_readably_STAR_, "\ufdd0'meta":cljs.core._STAR_print_meta_STAR_, "\ufdd0'dup":cljs.core._STAR_print_dup_STAR_})
};
cljs.core.pr_str = function() {
  var pr_str__delegate = function(objs) {
    return cljs.core.pr_str_with_opts.call(null, objs, cljs.core.pr_opts.call(null))
  };
  var pr_str = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return pr_str__delegate.call(this, objs)
  };
  pr_str.cljs$lang$maxFixedArity = 0;
  pr_str.cljs$lang$applyTo = function(arglist__69611) {
    var objs = cljs.core.seq(arglist__69611);
    return pr_str__delegate(objs)
  };
  pr_str.cljs$lang$arity$variadic = pr_str__delegate;
  return pr_str
}();
cljs.core.prn_str = function() {
  var prn_str__delegate = function(objs) {
    return cljs.core.prn_str_with_opts.call(null, objs, cljs.core.pr_opts.call(null))
  };
  var prn_str = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return prn_str__delegate.call(this, objs)
  };
  prn_str.cljs$lang$maxFixedArity = 0;
  prn_str.cljs$lang$applyTo = function(arglist__69612) {
    var objs = cljs.core.seq(arglist__69612);
    return prn_str__delegate(objs)
  };
  prn_str.cljs$lang$arity$variadic = prn_str__delegate;
  return prn_str
}();
cljs.core.pr = function() {
  var pr__delegate = function(objs) {
    return cljs.core.pr_with_opts.call(null, objs, cljs.core.pr_opts.call(null))
  };
  var pr = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return pr__delegate.call(this, objs)
  };
  pr.cljs$lang$maxFixedArity = 0;
  pr.cljs$lang$applyTo = function(arglist__69613) {
    var objs = cljs.core.seq(arglist__69613);
    return pr__delegate(objs)
  };
  pr.cljs$lang$arity$variadic = pr__delegate;
  return pr
}();
cljs.core.print = function() {
  var cljs_core_print__delegate = function(objs) {
    return cljs.core.pr_with_opts.call(null, objs, cljs.core.assoc.call(null, cljs.core.pr_opts.call(null), "\ufdd0'readably", false))
  };
  var cljs_core_print = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return cljs_core_print__delegate.call(this, objs)
  };
  cljs_core_print.cljs$lang$maxFixedArity = 0;
  cljs_core_print.cljs$lang$applyTo = function(arglist__69614) {
    var objs = cljs.core.seq(arglist__69614);
    return cljs_core_print__delegate(objs)
  };
  cljs_core_print.cljs$lang$arity$variadic = cljs_core_print__delegate;
  return cljs_core_print
}();
cljs.core.print_str = function() {
  var print_str__delegate = function(objs) {
    return cljs.core.pr_str_with_opts.call(null, objs, cljs.core.assoc.call(null, cljs.core.pr_opts.call(null), "\ufdd0'readably", false))
  };
  var print_str = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return print_str__delegate.call(this, objs)
  };
  print_str.cljs$lang$maxFixedArity = 0;
  print_str.cljs$lang$applyTo = function(arglist__69615) {
    var objs = cljs.core.seq(arglist__69615);
    return print_str__delegate(objs)
  };
  print_str.cljs$lang$arity$variadic = print_str__delegate;
  return print_str
}();
cljs.core.println = function() {
  var println__delegate = function(objs) {
    cljs.core.pr_with_opts.call(null, objs, cljs.core.assoc.call(null, cljs.core.pr_opts.call(null), "\ufdd0'readably", false));
    return cljs.core.newline.call(null, cljs.core.pr_opts.call(null))
  };
  var println = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return println__delegate.call(this, objs)
  };
  println.cljs$lang$maxFixedArity = 0;
  println.cljs$lang$applyTo = function(arglist__69616) {
    var objs = cljs.core.seq(arglist__69616);
    return println__delegate(objs)
  };
  println.cljs$lang$arity$variadic = println__delegate;
  return println
}();
cljs.core.println_str = function() {
  var println_str__delegate = function(objs) {
    return cljs.core.prn_str_with_opts.call(null, objs, cljs.core.assoc.call(null, cljs.core.pr_opts.call(null), "\ufdd0'readably", false))
  };
  var println_str = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return println_str__delegate.call(this, objs)
  };
  println_str.cljs$lang$maxFixedArity = 0;
  println_str.cljs$lang$applyTo = function(arglist__69617) {
    var objs = cljs.core.seq(arglist__69617);
    return println_str__delegate(objs)
  };
  println_str.cljs$lang$arity$variadic = println_str__delegate;
  return println_str
}();
cljs.core.prn = function() {
  var prn__delegate = function(objs) {
    cljs.core.pr_with_opts.call(null, objs, cljs.core.pr_opts.call(null));
    return cljs.core.newline.call(null, cljs.core.pr_opts.call(null))
  };
  var prn = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return prn__delegate.call(this, objs)
  };
  prn.cljs$lang$maxFixedArity = 0;
  prn.cljs$lang$applyTo = function(arglist__69618) {
    var objs = cljs.core.seq(arglist__69618);
    return prn__delegate(objs)
  };
  prn.cljs$lang$arity$variadic = prn__delegate;
  return prn
}();
cljs.core.printf = function() {
  var printf__delegate = function(fmt, args) {
    return cljs.core.print.call(null, cljs.core.apply.call(null, cljs.core.format, fmt, args))
  };
  var printf = function(fmt, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return printf__delegate.call(this, fmt, args)
  };
  printf.cljs$lang$maxFixedArity = 1;
  printf.cljs$lang$applyTo = function(arglist__69619) {
    var fmt = cljs.core.first(arglist__69619);
    var args = cljs.core.rest(arglist__69619);
    return printf__delegate(fmt, args)
  };
  printf.cljs$lang$arity$variadic = printf__delegate;
  return printf
}();
cljs.core.HashMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.HashMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__69620 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__69620, "{", ", ", "}", opts, coll)
};
cljs.core.IPrintable["number"] = true;
cljs.core._pr_seq["number"] = function(n, opts) {
  return cljs.core.list.call(null, [cljs.core.str(n)].join(""))
};
cljs.core.IndexedSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.Subvec.prototype.cljs$core$IPrintable$ = true;
cljs.core.Subvec.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
cljs.core.ChunkedCons.prototype.cljs$core$IPrintable$ = true;
cljs.core.ChunkedCons.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__69621 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__69621, "{", ", ", "}", opts, coll)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__69622 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__69622, "{", ", ", "}", opts, coll)
};
cljs.core.PersistentQueue.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "#queue [", " ", "]", opts, cljs.core.seq.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.LazySeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.RSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.RSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "#{", " ", "}", opts, coll)
};
cljs.core.IPrintable["boolean"] = true;
cljs.core._pr_seq["boolean"] = function(bool, opts) {
  return cljs.core.list.call(null, [cljs.core.str(bool)].join(""))
};
cljs.core.IPrintable["string"] = true;
cljs.core._pr_seq["string"] = function(obj, opts) {
  if(cljs.core.keyword_QMARK_.call(null, obj)) {
    return cljs.core.list.call(null, [cljs.core.str(":"), cljs.core.str(function() {
      var temp__3974__auto____69623 = cljs.core.namespace.call(null, obj);
      if(cljs.core.truth_(temp__3974__auto____69623)) {
        var nspc__69624 = temp__3974__auto____69623;
        return[cljs.core.str(nspc__69624), cljs.core.str("/")].join("")
      }else {
        return null
      }
    }()), cljs.core.str(cljs.core.name.call(null, obj))].join(""))
  }else {
    if(cljs.core.symbol_QMARK_.call(null, obj)) {
      return cljs.core.list.call(null, [cljs.core.str(function() {
        var temp__3974__auto____69625 = cljs.core.namespace.call(null, obj);
        if(cljs.core.truth_(temp__3974__auto____69625)) {
          var nspc__69626 = temp__3974__auto____69625;
          return[cljs.core.str(nspc__69626), cljs.core.str("/")].join("")
        }else {
          return null
        }
      }()), cljs.core.str(cljs.core.name.call(null, obj))].join(""))
    }else {
      if("\ufdd0'else") {
        return cljs.core.list.call(null, cljs.core.truth_((new cljs.core.Keyword("\ufdd0'readably")).call(null, opts)) ? goog.string.quote(obj) : obj)
      }else {
        return null
      }
    }
  }
};
cljs.core.NodeSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.NodeSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.RedNode.prototype.cljs$core$IPrintable$ = true;
cljs.core.RedNode.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.ChunkedSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__69627 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__69627, "{", ", ", "}", opts, coll)
};
cljs.core.Vector.prototype.cljs$core$IPrintable$ = true;
cljs.core.Vector.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
cljs.core.PersistentHashSet.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "#{", " ", "}", opts, coll)
};
cljs.core.PersistentVector.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
cljs.core.List.prototype.cljs$core$IPrintable$ = true;
cljs.core.List.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.IPrintable["array"] = true;
cljs.core._pr_seq["array"] = function(a, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "#<Array [", ", ", "]>", opts, a)
};
cljs.core.IPrintable["function"] = true;
cljs.core._pr_seq["function"] = function(this$) {
  return cljs.core.list.call(null, "#<", [cljs.core.str(this$)].join(""), ">")
};
cljs.core.EmptyList.prototype.cljs$core$IPrintable$ = true;
cljs.core.EmptyList.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.list.call(null, "()")
};
cljs.core.BlackNode.prototype.cljs$core$IPrintable$ = true;
cljs.core.BlackNode.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
Date.prototype.cljs$core$IPrintable$ = true;
Date.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(d, _) {
  var normalize__69629 = function(n, len) {
    var ns__69628 = [cljs.core.str(n)].join("");
    while(true) {
      if(cljs.core.count.call(null, ns__69628) < len) {
        var G__69631 = [cljs.core.str("0"), cljs.core.str(ns__69628)].join("");
        ns__69628 = G__69631;
        continue
      }else {
        return ns__69628
      }
      break
    }
  };
  return cljs.core.list.call(null, [cljs.core.str('#inst "'), cljs.core.str(d.getUTCFullYear()), cljs.core.str("-"), cljs.core.str(normalize__69629.call(null, d.getUTCMonth() + 1, 2)), cljs.core.str("-"), cljs.core.str(normalize__69629.call(null, d.getUTCDate(), 2)), cljs.core.str("T"), cljs.core.str(normalize__69629.call(null, d.getUTCHours(), 2)), cljs.core.str(":"), cljs.core.str(normalize__69629.call(null, d.getUTCMinutes(), 2)), cljs.core.str(":"), cljs.core.str(normalize__69629.call(null, d.getUTCSeconds(), 
  2)), cljs.core.str("."), cljs.core.str(normalize__69629.call(null, d.getUTCMilliseconds(), 3)), cljs.core.str("-"), cljs.core.str('00:00"')].join(""))
};
cljs.core.Cons.prototype.cljs$core$IPrintable$ = true;
cljs.core.Cons.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.Range.prototype.cljs$core$IPrintable$ = true;
cljs.core.Range.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.ArrayNodeSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.ObjMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.ObjMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__69630 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__69630, "{", ", ", "}", opts, coll)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.PersistentVector.prototype.cljs$core$IComparable$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IComparable$_compare$arity$2 = function(x, y) {
  return cljs.core.compare_indexed.call(null, x, y)
};
cljs.core.Atom = function(state, meta, validator, watches) {
  this.state = state;
  this.meta = meta;
  this.validator = validator;
  this.watches = watches;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 2690809856
};
cljs.core.Atom.cljs$lang$type = true;
cljs.core.Atom.cljs$lang$ctorPrSeq = function(this__2343__auto__) {
  return cljs.core.list.call(null, "cljs.core/Atom")
};
cljs.core.Atom.prototype.cljs$core$IHash$_hash$arity$1 = function(this$) {
  var this__69632 = this;
  return goog.getUid(this$)
};
cljs.core.Atom.prototype.cljs$core$IWatchable$_notify_watches$arity$3 = function(this$, oldval, newval) {
  var this__69633 = this;
  var G__69634__69635 = cljs.core.seq.call(null, this__69633.watches);
  if(G__69634__69635) {
    var G__69637__69639 = cljs.core.first.call(null, G__69634__69635);
    var vec__69638__69640 = G__69637__69639;
    var key__69641 = cljs.core.nth.call(null, vec__69638__69640, 0, null);
    var f__69642 = cljs.core.nth.call(null, vec__69638__69640, 1, null);
    var G__69634__69643 = G__69634__69635;
    var G__69637__69644 = G__69637__69639;
    var G__69634__69645 = G__69634__69643;
    while(true) {
      var vec__69646__69647 = G__69637__69644;
      var key__69648 = cljs.core.nth.call(null, vec__69646__69647, 0, null);
      var f__69649 = cljs.core.nth.call(null, vec__69646__69647, 1, null);
      var G__69634__69650 = G__69634__69645;
      f__69649.call(null, key__69648, this$, oldval, newval);
      var temp__3974__auto____69651 = cljs.core.next.call(null, G__69634__69650);
      if(temp__3974__auto____69651) {
        var G__69634__69652 = temp__3974__auto____69651;
        var G__69659 = cljs.core.first.call(null, G__69634__69652);
        var G__69660 = G__69634__69652;
        G__69637__69644 = G__69659;
        G__69634__69645 = G__69660;
        continue
      }else {
        return null
      }
      break
    }
  }else {
    return null
  }
};
cljs.core.Atom.prototype.cljs$core$IWatchable$_add_watch$arity$3 = function(this$, key, f) {
  var this__69653 = this;
  return this$.watches = cljs.core.assoc.call(null, this__69653.watches, key, f)
};
cljs.core.Atom.prototype.cljs$core$IWatchable$_remove_watch$arity$2 = function(this$, key) {
  var this__69654 = this;
  return this$.watches = cljs.core.dissoc.call(null, this__69654.watches, key)
};
cljs.core.Atom.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(a, opts) {
  var this__69655 = this;
  return cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray(["#<Atom: "], true), cljs.core._pr_seq.call(null, this__69655.state, opts), ">")
};
cljs.core.Atom.prototype.cljs$core$IMeta$_meta$arity$1 = function(_) {
  var this__69656 = this;
  return this__69656.meta
};
cljs.core.Atom.prototype.cljs$core$IDeref$_deref$arity$1 = function(_) {
  var this__69657 = this;
  return this__69657.state
};
cljs.core.Atom.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(o, other) {
  var this__69658 = this;
  return o === other
};
cljs.core.Atom;
cljs.core.atom = function() {
  var atom = null;
  var atom__1 = function(x) {
    return new cljs.core.Atom(x, null, null, null)
  };
  var atom__2 = function() {
    var G__69672__delegate = function(x, p__69661) {
      var map__69667__69668 = p__69661;
      var map__69667__69669 = cljs.core.seq_QMARK_.call(null, map__69667__69668) ? cljs.core.apply.call(null, cljs.core.hash_map, map__69667__69668) : map__69667__69668;
      var validator__69670 = cljs.core._lookup.call(null, map__69667__69669, "\ufdd0'validator", null);
      var meta__69671 = cljs.core._lookup.call(null, map__69667__69669, "\ufdd0'meta", null);
      return new cljs.core.Atom(x, meta__69671, validator__69670, null)
    };
    var G__69672 = function(x, var_args) {
      var p__69661 = null;
      if(goog.isDef(var_args)) {
        p__69661 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__69672__delegate.call(this, x, p__69661)
    };
    G__69672.cljs$lang$maxFixedArity = 1;
    G__69672.cljs$lang$applyTo = function(arglist__69673) {
      var x = cljs.core.first(arglist__69673);
      var p__69661 = cljs.core.rest(arglist__69673);
      return G__69672__delegate(x, p__69661)
    };
    G__69672.cljs$lang$arity$variadic = G__69672__delegate;
    return G__69672
  }();
  atom = function(x, var_args) {
    var p__69661 = var_args;
    switch(arguments.length) {
      case 1:
        return atom__1.call(this, x);
      default:
        return atom__2.cljs$lang$arity$variadic(x, cljs.core.array_seq(arguments, 1))
    }
    throw"Invalid arity: " + arguments.length;
  };
  atom.cljs$lang$maxFixedArity = 1;
  atom.cljs$lang$applyTo = atom__2.cljs$lang$applyTo;
  atom.cljs$lang$arity$1 = atom__1;
  atom.cljs$lang$arity$variadic = atom__2.cljs$lang$arity$variadic;
  return atom
}();
cljs.core.reset_BANG_ = function reset_BANG_(a, new_value) {
  var temp__3974__auto____69677 = a.validator;
  if(cljs.core.truth_(temp__3974__auto____69677)) {
    var validate__69678 = temp__3974__auto____69677;
    if(cljs.core.truth_(validate__69678.call(null, new_value))) {
    }else {
      throw new Error([cljs.core.str("Assert failed: "), cljs.core.str("Validator rejected reference state"), cljs.core.str("\n"), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'validate", "\ufdd1'new-value"), cljs.core.hash_map("\ufdd0'line", 6440))))].join(""));
    }
  }else {
  }
  var old_value__69679 = a.state;
  a.state = new_value;
  cljs.core._notify_watches.call(null, a, old_value__69679, new_value);
  return new_value
};
cljs.core.swap_BANG_ = function() {
  var swap_BANG_ = null;
  var swap_BANG___2 = function(a, f) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state))
  };
  var swap_BANG___3 = function(a, f, x) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state, x))
  };
  var swap_BANG___4 = function(a, f, x, y) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state, x, y))
  };
  var swap_BANG___5 = function(a, f, x, y, z) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state, x, y, z))
  };
  var swap_BANG___6 = function() {
    var G__69680__delegate = function(a, f, x, y, z, more) {
      return cljs.core.reset_BANG_.call(null, a, cljs.core.apply.call(null, f, a.state, x, y, z, more))
    };
    var G__69680 = function(a, f, x, y, z, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 5), 0)
      }
      return G__69680__delegate.call(this, a, f, x, y, z, more)
    };
    G__69680.cljs$lang$maxFixedArity = 5;
    G__69680.cljs$lang$applyTo = function(arglist__69681) {
      var a = cljs.core.first(arglist__69681);
      var f = cljs.core.first(cljs.core.next(arglist__69681));
      var x = cljs.core.first(cljs.core.next(cljs.core.next(arglist__69681)));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__69681))));
      var z = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__69681)))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__69681)))));
      return G__69680__delegate(a, f, x, y, z, more)
    };
    G__69680.cljs$lang$arity$variadic = G__69680__delegate;
    return G__69680
  }();
  swap_BANG_ = function(a, f, x, y, z, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return swap_BANG___2.call(this, a, f);
      case 3:
        return swap_BANG___3.call(this, a, f, x);
      case 4:
        return swap_BANG___4.call(this, a, f, x, y);
      case 5:
        return swap_BANG___5.call(this, a, f, x, y, z);
      default:
        return swap_BANG___6.cljs$lang$arity$variadic(a, f, x, y, z, cljs.core.array_seq(arguments, 5))
    }
    throw"Invalid arity: " + arguments.length;
  };
  swap_BANG_.cljs$lang$maxFixedArity = 5;
  swap_BANG_.cljs$lang$applyTo = swap_BANG___6.cljs$lang$applyTo;
  swap_BANG_.cljs$lang$arity$2 = swap_BANG___2;
  swap_BANG_.cljs$lang$arity$3 = swap_BANG___3;
  swap_BANG_.cljs$lang$arity$4 = swap_BANG___4;
  swap_BANG_.cljs$lang$arity$5 = swap_BANG___5;
  swap_BANG_.cljs$lang$arity$variadic = swap_BANG___6.cljs$lang$arity$variadic;
  return swap_BANG_
}();
cljs.core.compare_and_set_BANG_ = function compare_and_set_BANG_(a, oldval, newval) {
  if(cljs.core._EQ_.call(null, a.state, oldval)) {
    cljs.core.reset_BANG_.call(null, a, newval);
    return true
  }else {
    return false
  }
};
cljs.core.deref = function deref(o) {
  return cljs.core._deref.call(null, o)
};
cljs.core.set_validator_BANG_ = function set_validator_BANG_(iref, val) {
  return iref.validator = val
};
cljs.core.get_validator = function get_validator(iref) {
  return iref.validator
};
cljs.core.alter_meta_BANG_ = function() {
  var alter_meta_BANG___delegate = function(iref, f, args) {
    return iref.meta = cljs.core.apply.call(null, f, iref.meta, args)
  };
  var alter_meta_BANG_ = function(iref, f, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
    }
    return alter_meta_BANG___delegate.call(this, iref, f, args)
  };
  alter_meta_BANG_.cljs$lang$maxFixedArity = 2;
  alter_meta_BANG_.cljs$lang$applyTo = function(arglist__69682) {
    var iref = cljs.core.first(arglist__69682);
    var f = cljs.core.first(cljs.core.next(arglist__69682));
    var args = cljs.core.rest(cljs.core.next(arglist__69682));
    return alter_meta_BANG___delegate(iref, f, args)
  };
  alter_meta_BANG_.cljs$lang$arity$variadic = alter_meta_BANG___delegate;
  return alter_meta_BANG_
}();
cljs.core.reset_meta_BANG_ = function reset_meta_BANG_(iref, m) {
  return iref.meta = m
};
cljs.core.add_watch = function add_watch(iref, key, f) {
  return cljs.core._add_watch.call(null, iref, key, f)
};
cljs.core.remove_watch = function remove_watch(iref, key) {
  return cljs.core._remove_watch.call(null, iref, key)
};
cljs.core.gensym_counter = null;
cljs.core.gensym = function() {
  var gensym = null;
  var gensym__0 = function() {
    return gensym.call(null, "G__")
  };
  var gensym__1 = function(prefix_string) {
    if(cljs.core.gensym_counter == null) {
      cljs.core.gensym_counter = cljs.core.atom.call(null, 0)
    }else {
    }
    return cljs.core.symbol.call(null, [cljs.core.str(prefix_string), cljs.core.str(cljs.core.swap_BANG_.call(null, cljs.core.gensym_counter, cljs.core.inc))].join(""))
  };
  gensym = function(prefix_string) {
    switch(arguments.length) {
      case 0:
        return gensym__0.call(this);
      case 1:
        return gensym__1.call(this, prefix_string)
    }
    throw"Invalid arity: " + arguments.length;
  };
  gensym.cljs$lang$arity$0 = gensym__0;
  gensym.cljs$lang$arity$1 = gensym__1;
  return gensym
}();
cljs.core.fixture1 = 1;
cljs.core.fixture2 = 2;
cljs.core.Delay = function(state, f) {
  this.state = state;
  this.f = f;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 1073774592
};
cljs.core.Delay.cljs$lang$type = true;
cljs.core.Delay.cljs$lang$ctorPrSeq = function(this__2343__auto__) {
  return cljs.core.list.call(null, "cljs.core/Delay")
};
cljs.core.Delay.prototype.cljs$core$IPending$_realized_QMARK_$arity$1 = function(d) {
  var this__69683 = this;
  return(new cljs.core.Keyword("\ufdd0'done")).call(null, cljs.core.deref.call(null, this__69683.state))
};
cljs.core.Delay.prototype.cljs$core$IDeref$_deref$arity$1 = function(_) {
  var this__69684 = this;
  return(new cljs.core.Keyword("\ufdd0'value")).call(null, cljs.core.swap_BANG_.call(null, this__69684.state, function(p__69685) {
    var map__69686__69687 = p__69685;
    var map__69686__69688 = cljs.core.seq_QMARK_.call(null, map__69686__69687) ? cljs.core.apply.call(null, cljs.core.hash_map, map__69686__69687) : map__69686__69687;
    var curr_state__69689 = map__69686__69688;
    var done__69690 = cljs.core._lookup.call(null, map__69686__69688, "\ufdd0'done", null);
    if(cljs.core.truth_(done__69690)) {
      return curr_state__69689
    }else {
      return cljs.core.ObjMap.fromObject(["\ufdd0'done", "\ufdd0'value"], {"\ufdd0'done":true, "\ufdd0'value":this__69684.f.call(null)})
    }
  }))
};
cljs.core.Delay;
cljs.core.delay_QMARK_ = function delay_QMARK_(x) {
  return cljs.core.instance_QMARK_.call(null, cljs.core.Delay, x)
};
cljs.core.force = function force(x) {
  if(cljs.core.delay_QMARK_.call(null, x)) {
    return cljs.core.deref.call(null, x)
  }else {
    return x
  }
};
cljs.core.realized_QMARK_ = function realized_QMARK_(d) {
  return cljs.core._realized_QMARK_.call(null, d)
};
cljs.core.js__GT_clj = function() {
  var js__GT_clj__delegate = function(x, options) {
    var map__69711__69712 = options;
    var map__69711__69713 = cljs.core.seq_QMARK_.call(null, map__69711__69712) ? cljs.core.apply.call(null, cljs.core.hash_map, map__69711__69712) : map__69711__69712;
    var keywordize_keys__69714 = cljs.core._lookup.call(null, map__69711__69713, "\ufdd0'keywordize-keys", null);
    var keyfn__69715 = cljs.core.truth_(keywordize_keys__69714) ? cljs.core.keyword : cljs.core.str;
    var f__69730 = function thisfn(x) {
      if(cljs.core.seq_QMARK_.call(null, x)) {
        return cljs.core.doall.call(null, cljs.core.map.call(null, thisfn, x))
      }else {
        if(cljs.core.coll_QMARK_.call(null, x)) {
          return cljs.core.into.call(null, cljs.core.empty.call(null, x), cljs.core.map.call(null, thisfn, x))
        }else {
          if(cljs.core.truth_(goog.isArray(x))) {
            return cljs.core.vec.call(null, cljs.core.map.call(null, thisfn, x))
          }else {
            if(cljs.core.type.call(null, x) === Object) {
              return cljs.core.into.call(null, cljs.core.ObjMap.EMPTY, function() {
                var iter__2496__auto____69729 = function iter__69723(s__69724) {
                  return new cljs.core.LazySeq(null, false, function() {
                    var s__69724__69727 = s__69724;
                    while(true) {
                      if(cljs.core.seq.call(null, s__69724__69727)) {
                        var k__69728 = cljs.core.first.call(null, s__69724__69727);
                        return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([keyfn__69715.call(null, k__69728), thisfn.call(null, x[k__69728])], true), iter__69723.call(null, cljs.core.rest.call(null, s__69724__69727)))
                      }else {
                        return null
                      }
                      break
                    }
                  }, null)
                };
                return iter__2496__auto____69729.call(null, cljs.core.js_keys.call(null, x))
              }())
            }else {
              if("\ufdd0'else") {
                return x
              }else {
                return null
              }
            }
          }
        }
      }
    };
    return f__69730.call(null, x)
  };
  var js__GT_clj = function(x, var_args) {
    var options = null;
    if(goog.isDef(var_args)) {
      options = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return js__GT_clj__delegate.call(this, x, options)
  };
  js__GT_clj.cljs$lang$maxFixedArity = 1;
  js__GT_clj.cljs$lang$applyTo = function(arglist__69731) {
    var x = cljs.core.first(arglist__69731);
    var options = cljs.core.rest(arglist__69731);
    return js__GT_clj__delegate(x, options)
  };
  js__GT_clj.cljs$lang$arity$variadic = js__GT_clj__delegate;
  return js__GT_clj
}();
cljs.core.memoize = function memoize(f) {
  var mem__69736 = cljs.core.atom.call(null, cljs.core.ObjMap.EMPTY);
  return function() {
    var G__69740__delegate = function(args) {
      var temp__3971__auto____69737 = cljs.core._lookup.call(null, cljs.core.deref.call(null, mem__69736), args, null);
      if(cljs.core.truth_(temp__3971__auto____69737)) {
        var v__69738 = temp__3971__auto____69737;
        return v__69738
      }else {
        var ret__69739 = cljs.core.apply.call(null, f, args);
        cljs.core.swap_BANG_.call(null, mem__69736, cljs.core.assoc, args, ret__69739);
        return ret__69739
      }
    };
    var G__69740 = function(var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__69740__delegate.call(this, args)
    };
    G__69740.cljs$lang$maxFixedArity = 0;
    G__69740.cljs$lang$applyTo = function(arglist__69741) {
      var args = cljs.core.seq(arglist__69741);
      return G__69740__delegate(args)
    };
    G__69740.cljs$lang$arity$variadic = G__69740__delegate;
    return G__69740
  }()
};
cljs.core.trampoline = function() {
  var trampoline = null;
  var trampoline__1 = function(f) {
    while(true) {
      var ret__69743 = f.call(null);
      if(cljs.core.fn_QMARK_.call(null, ret__69743)) {
        var G__69744 = ret__69743;
        f = G__69744;
        continue
      }else {
        return ret__69743
      }
      break
    }
  };
  var trampoline__2 = function() {
    var G__69745__delegate = function(f, args) {
      return trampoline.call(null, function() {
        return cljs.core.apply.call(null, f, args)
      })
    };
    var G__69745 = function(f, var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__69745__delegate.call(this, f, args)
    };
    G__69745.cljs$lang$maxFixedArity = 1;
    G__69745.cljs$lang$applyTo = function(arglist__69746) {
      var f = cljs.core.first(arglist__69746);
      var args = cljs.core.rest(arglist__69746);
      return G__69745__delegate(f, args)
    };
    G__69745.cljs$lang$arity$variadic = G__69745__delegate;
    return G__69745
  }();
  trampoline = function(f, var_args) {
    var args = var_args;
    switch(arguments.length) {
      case 1:
        return trampoline__1.call(this, f);
      default:
        return trampoline__2.cljs$lang$arity$variadic(f, cljs.core.array_seq(arguments, 1))
    }
    throw"Invalid arity: " + arguments.length;
  };
  trampoline.cljs$lang$maxFixedArity = 1;
  trampoline.cljs$lang$applyTo = trampoline__2.cljs$lang$applyTo;
  trampoline.cljs$lang$arity$1 = trampoline__1;
  trampoline.cljs$lang$arity$variadic = trampoline__2.cljs$lang$arity$variadic;
  return trampoline
}();
cljs.core.rand = function() {
  var rand = null;
  var rand__0 = function() {
    return rand.call(null, 1)
  };
  var rand__1 = function(n) {
    return Math.random.call(null) * n
  };
  rand = function(n) {
    switch(arguments.length) {
      case 0:
        return rand__0.call(this);
      case 1:
        return rand__1.call(this, n)
    }
    throw"Invalid arity: " + arguments.length;
  };
  rand.cljs$lang$arity$0 = rand__0;
  rand.cljs$lang$arity$1 = rand__1;
  return rand
}();
cljs.core.rand_int = function rand_int(n) {
  return Math.floor.call(null, Math.random.call(null) * n)
};
cljs.core.rand_nth = function rand_nth(coll) {
  return cljs.core.nth.call(null, coll, cljs.core.rand_int.call(null, cljs.core.count.call(null, coll)))
};
cljs.core.group_by = function group_by(f, coll) {
  return cljs.core.reduce.call(null, function(ret, x) {
    var k__69748 = f.call(null, x);
    return cljs.core.assoc.call(null, ret, k__69748, cljs.core.conj.call(null, cljs.core._lookup.call(null, ret, k__69748, cljs.core.PersistentVector.EMPTY), x))
  }, cljs.core.ObjMap.EMPTY, coll)
};
cljs.core.make_hierarchy = function make_hierarchy() {
  return cljs.core.ObjMap.fromObject(["\ufdd0'parents", "\ufdd0'descendants", "\ufdd0'ancestors"], {"\ufdd0'parents":cljs.core.ObjMap.EMPTY, "\ufdd0'descendants":cljs.core.ObjMap.EMPTY, "\ufdd0'ancestors":cljs.core.ObjMap.EMPTY})
};
cljs.core.global_hierarchy = cljs.core.atom.call(null, cljs.core.make_hierarchy.call(null));
cljs.core.isa_QMARK_ = function() {
  var isa_QMARK_ = null;
  var isa_QMARK___2 = function(child, parent) {
    return isa_QMARK_.call(null, cljs.core.deref.call(null, cljs.core.global_hierarchy), child, parent)
  };
  var isa_QMARK___3 = function(h, child, parent) {
    var or__3824__auto____69757 = cljs.core._EQ_.call(null, child, parent);
    if(or__3824__auto____69757) {
      return or__3824__auto____69757
    }else {
      var or__3824__auto____69758 = cljs.core.contains_QMARK_.call(null, (new cljs.core.Keyword("\ufdd0'ancestors")).call(null, h).call(null, child), parent);
      if(or__3824__auto____69758) {
        return or__3824__auto____69758
      }else {
        var and__3822__auto____69759 = cljs.core.vector_QMARK_.call(null, parent);
        if(and__3822__auto____69759) {
          var and__3822__auto____69760 = cljs.core.vector_QMARK_.call(null, child);
          if(and__3822__auto____69760) {
            var and__3822__auto____69761 = cljs.core.count.call(null, parent) === cljs.core.count.call(null, child);
            if(and__3822__auto____69761) {
              var ret__69762 = true;
              var i__69763 = 0;
              while(true) {
                if(function() {
                  var or__3824__auto____69764 = cljs.core.not.call(null, ret__69762);
                  if(or__3824__auto____69764) {
                    return or__3824__auto____69764
                  }else {
                    return i__69763 === cljs.core.count.call(null, parent)
                  }
                }()) {
                  return ret__69762
                }else {
                  var G__69765 = isa_QMARK_.call(null, h, child.call(null, i__69763), parent.call(null, i__69763));
                  var G__69766 = i__69763 + 1;
                  ret__69762 = G__69765;
                  i__69763 = G__69766;
                  continue
                }
                break
              }
            }else {
              return and__3822__auto____69761
            }
          }else {
            return and__3822__auto____69760
          }
        }else {
          return and__3822__auto____69759
        }
      }
    }
  };
  isa_QMARK_ = function(h, child, parent) {
    switch(arguments.length) {
      case 2:
        return isa_QMARK___2.call(this, h, child);
      case 3:
        return isa_QMARK___3.call(this, h, child, parent)
    }
    throw"Invalid arity: " + arguments.length;
  };
  isa_QMARK_.cljs$lang$arity$2 = isa_QMARK___2;
  isa_QMARK_.cljs$lang$arity$3 = isa_QMARK___3;
  return isa_QMARK_
}();
cljs.core.parents = function() {
  var parents = null;
  var parents__1 = function(tag) {
    return parents.call(null, cljs.core.deref.call(null, cljs.core.global_hierarchy), tag)
  };
  var parents__2 = function(h, tag) {
    return cljs.core.not_empty.call(null, cljs.core._lookup.call(null, (new cljs.core.Keyword("\ufdd0'parents")).call(null, h), tag, null))
  };
  parents = function(h, tag) {
    switch(arguments.length) {
      case 1:
        return parents__1.call(this, h);
      case 2:
        return parents__2.call(this, h, tag)
    }
    throw"Invalid arity: " + arguments.length;
  };
  parents.cljs$lang$arity$1 = parents__1;
  parents.cljs$lang$arity$2 = parents__2;
  return parents
}();
cljs.core.ancestors = function() {
  var ancestors = null;
  var ancestors__1 = function(tag) {
    return ancestors.call(null, cljs.core.deref.call(null, cljs.core.global_hierarchy), tag)
  };
  var ancestors__2 = function(h, tag) {
    return cljs.core.not_empty.call(null, cljs.core._lookup.call(null, (new cljs.core.Keyword("\ufdd0'ancestors")).call(null, h), tag, null))
  };
  ancestors = function(h, tag) {
    switch(arguments.length) {
      case 1:
        return ancestors__1.call(this, h);
      case 2:
        return ancestors__2.call(this, h, tag)
    }
    throw"Invalid arity: " + arguments.length;
  };
  ancestors.cljs$lang$arity$1 = ancestors__1;
  ancestors.cljs$lang$arity$2 = ancestors__2;
  return ancestors
}();
cljs.core.descendants = function() {
  var descendants = null;
  var descendants__1 = function(tag) {
    return descendants.call(null, cljs.core.deref.call(null, cljs.core.global_hierarchy), tag)
  };
  var descendants__2 = function(h, tag) {
    return cljs.core.not_empty.call(null, cljs.core._lookup.call(null, (new cljs.core.Keyword("\ufdd0'descendants")).call(null, h), tag, null))
  };
  descendants = function(h, tag) {
    switch(arguments.length) {
      case 1:
        return descendants__1.call(this, h);
      case 2:
        return descendants__2.call(this, h, tag)
    }
    throw"Invalid arity: " + arguments.length;
  };
  descendants.cljs$lang$arity$1 = descendants__1;
  descendants.cljs$lang$arity$2 = descendants__2;
  return descendants
}();
cljs.core.derive = function() {
  var derive = null;
  var derive__2 = function(tag, parent) {
    if(cljs.core.truth_(cljs.core.namespace.call(null, parent))) {
    }else {
      throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'namespace", "\ufdd1'parent"), cljs.core.hash_map("\ufdd0'line", 6724))))].join(""));
    }
    cljs.core.swap_BANG_.call(null, cljs.core.global_hierarchy, derive, tag, parent);
    return null
  };
  var derive__3 = function(h, tag, parent) {
    if(cljs.core.not_EQ_.call(null, tag, parent)) {
    }else {
      throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'not=", "\ufdd1'tag", "\ufdd1'parent"), cljs.core.hash_map("\ufdd0'line", 6728))))].join(""));
    }
    var tp__69775 = (new cljs.core.Keyword("\ufdd0'parents")).call(null, h);
    var td__69776 = (new cljs.core.Keyword("\ufdd0'descendants")).call(null, h);
    var ta__69777 = (new cljs.core.Keyword("\ufdd0'ancestors")).call(null, h);
    var tf__69778 = function(m, source, sources, target, targets) {
      return cljs.core.reduce.call(null, function(ret, k) {
        return cljs.core.assoc.call(null, ret, k, cljs.core.reduce.call(null, cljs.core.conj, cljs.core._lookup.call(null, targets, k, cljs.core.PersistentHashSet.EMPTY), cljs.core.cons.call(null, target, targets.call(null, target))))
      }, m, cljs.core.cons.call(null, source, sources.call(null, source)))
    };
    var or__3824__auto____69779 = cljs.core.contains_QMARK_.call(null, tp__69775.call(null, tag), parent) ? null : function() {
      if(cljs.core.contains_QMARK_.call(null, ta__69777.call(null, tag), parent)) {
        throw new Error([cljs.core.str(tag), cljs.core.str("already has"), cljs.core.str(parent), cljs.core.str("as ancestor")].join(""));
      }else {
      }
      if(cljs.core.contains_QMARK_.call(null, ta__69777.call(null, parent), tag)) {
        throw new Error([cljs.core.str("Cyclic derivation:"), cljs.core.str(parent), cljs.core.str("has"), cljs.core.str(tag), cljs.core.str("as ancestor")].join(""));
      }else {
      }
      return cljs.core.ObjMap.fromObject(["\ufdd0'parents", "\ufdd0'ancestors", "\ufdd0'descendants"], {"\ufdd0'parents":cljs.core.assoc.call(null, (new cljs.core.Keyword("\ufdd0'parents")).call(null, h), tag, cljs.core.conj.call(null, cljs.core._lookup.call(null, tp__69775, tag, cljs.core.PersistentHashSet.EMPTY), parent)), "\ufdd0'ancestors":tf__69778.call(null, (new cljs.core.Keyword("\ufdd0'ancestors")).call(null, h), tag, td__69776, parent, ta__69777), "\ufdd0'descendants":tf__69778.call(null, 
      (new cljs.core.Keyword("\ufdd0'descendants")).call(null, h), parent, ta__69777, tag, td__69776)})
    }();
    if(cljs.core.truth_(or__3824__auto____69779)) {
      return or__3824__auto____69779
    }else {
      return h
    }
  };
  derive = function(h, tag, parent) {
    switch(arguments.length) {
      case 2:
        return derive__2.call(this, h, tag);
      case 3:
        return derive__3.call(this, h, tag, parent)
    }
    throw"Invalid arity: " + arguments.length;
  };
  derive.cljs$lang$arity$2 = derive__2;
  derive.cljs$lang$arity$3 = derive__3;
  return derive
}();
cljs.core.underive = function() {
  var underive = null;
  var underive__2 = function(tag, parent) {
    cljs.core.swap_BANG_.call(null, cljs.core.global_hierarchy, underive, tag, parent);
    return null
  };
  var underive__3 = function(h, tag, parent) {
    var parentMap__69784 = (new cljs.core.Keyword("\ufdd0'parents")).call(null, h);
    var childsParents__69785 = cljs.core.truth_(parentMap__69784.call(null, tag)) ? cljs.core.disj.call(null, parentMap__69784.call(null, tag), parent) : cljs.core.PersistentHashSet.EMPTY;
    var newParents__69786 = cljs.core.truth_(cljs.core.not_empty.call(null, childsParents__69785)) ? cljs.core.assoc.call(null, parentMap__69784, tag, childsParents__69785) : cljs.core.dissoc.call(null, parentMap__69784, tag);
    var deriv_seq__69787 = cljs.core.flatten.call(null, cljs.core.map.call(null, function(p1__69767_SHARP_) {
      return cljs.core.cons.call(null, cljs.core.first.call(null, p1__69767_SHARP_), cljs.core.interpose.call(null, cljs.core.first.call(null, p1__69767_SHARP_), cljs.core.second.call(null, p1__69767_SHARP_)))
    }, cljs.core.seq.call(null, newParents__69786)));
    if(cljs.core.contains_QMARK_.call(null, parentMap__69784.call(null, tag), parent)) {
      return cljs.core.reduce.call(null, function(p1__69768_SHARP_, p2__69769_SHARP_) {
        return cljs.core.apply.call(null, cljs.core.derive, p1__69768_SHARP_, p2__69769_SHARP_)
      }, cljs.core.make_hierarchy.call(null), cljs.core.partition.call(null, 2, deriv_seq__69787))
    }else {
      return h
    }
  };
  underive = function(h, tag, parent) {
    switch(arguments.length) {
      case 2:
        return underive__2.call(this, h, tag);
      case 3:
        return underive__3.call(this, h, tag, parent)
    }
    throw"Invalid arity: " + arguments.length;
  };
  underive.cljs$lang$arity$2 = underive__2;
  underive.cljs$lang$arity$3 = underive__3;
  return underive
}();
cljs.core.reset_cache = function reset_cache(method_cache, method_table, cached_hierarchy, hierarchy) {
  cljs.core.swap_BANG_.call(null, method_cache, function(_) {
    return cljs.core.deref.call(null, method_table)
  });
  return cljs.core.swap_BANG_.call(null, cached_hierarchy, function(_) {
    return cljs.core.deref.call(null, hierarchy)
  })
};
cljs.core.prefers_STAR_ = function prefers_STAR_(x, y, prefer_table) {
  var xprefs__69795 = cljs.core.deref.call(null, prefer_table).call(null, x);
  var or__3824__auto____69797 = cljs.core.truth_(function() {
    var and__3822__auto____69796 = xprefs__69795;
    if(cljs.core.truth_(and__3822__auto____69796)) {
      return xprefs__69795.call(null, y)
    }else {
      return and__3822__auto____69796
    }
  }()) ? true : null;
  if(cljs.core.truth_(or__3824__auto____69797)) {
    return or__3824__auto____69797
  }else {
    var or__3824__auto____69799 = function() {
      var ps__69798 = cljs.core.parents.call(null, y);
      while(true) {
        if(cljs.core.count.call(null, ps__69798) > 0) {
          if(cljs.core.truth_(prefers_STAR_.call(null, x, cljs.core.first.call(null, ps__69798), prefer_table))) {
          }else {
          }
          var G__69802 = cljs.core.rest.call(null, ps__69798);
          ps__69798 = G__69802;
          continue
        }else {
          return null
        }
        break
      }
    }();
    if(cljs.core.truth_(or__3824__auto____69799)) {
      return or__3824__auto____69799
    }else {
      var or__3824__auto____69801 = function() {
        var ps__69800 = cljs.core.parents.call(null, x);
        while(true) {
          if(cljs.core.count.call(null, ps__69800) > 0) {
            if(cljs.core.truth_(prefers_STAR_.call(null, cljs.core.first.call(null, ps__69800), y, prefer_table))) {
            }else {
            }
            var G__69803 = cljs.core.rest.call(null, ps__69800);
            ps__69800 = G__69803;
            continue
          }else {
            return null
          }
          break
        }
      }();
      if(cljs.core.truth_(or__3824__auto____69801)) {
        return or__3824__auto____69801
      }else {
        return false
      }
    }
  }
};
cljs.core.dominates = function dominates(x, y, prefer_table) {
  var or__3824__auto____69805 = cljs.core.prefers_STAR_.call(null, x, y, prefer_table);
  if(cljs.core.truth_(or__3824__auto____69805)) {
    return or__3824__auto____69805
  }else {
    return cljs.core.isa_QMARK_.call(null, x, y)
  }
};
cljs.core.find_and_cache_best_method = function find_and_cache_best_method(name, dispatch_val, hierarchy, method_table, prefer_table, method_cache, cached_hierarchy) {
  var best_entry__69823 = cljs.core.reduce.call(null, function(be, p__69815) {
    var vec__69816__69817 = p__69815;
    var k__69818 = cljs.core.nth.call(null, vec__69816__69817, 0, null);
    var ___69819 = cljs.core.nth.call(null, vec__69816__69817, 1, null);
    var e__69820 = vec__69816__69817;
    if(cljs.core.isa_QMARK_.call(null, dispatch_val, k__69818)) {
      var be2__69822 = cljs.core.truth_(function() {
        var or__3824__auto____69821 = be == null;
        if(or__3824__auto____69821) {
          return or__3824__auto____69821
        }else {
          return cljs.core.dominates.call(null, k__69818, cljs.core.first.call(null, be), prefer_table)
        }
      }()) ? e__69820 : be;
      if(cljs.core.truth_(cljs.core.dominates.call(null, cljs.core.first.call(null, be2__69822), k__69818, prefer_table))) {
      }else {
        throw new Error([cljs.core.str("Multiple methods in multimethod '"), cljs.core.str(name), cljs.core.str("' match dispatch value: "), cljs.core.str(dispatch_val), cljs.core.str(" -> "), cljs.core.str(k__69818), cljs.core.str(" and "), cljs.core.str(cljs.core.first.call(null, be2__69822)), cljs.core.str(", and neither is preferred")].join(""));
      }
      return be2__69822
    }else {
      return be
    }
  }, null, cljs.core.deref.call(null, method_table));
  if(cljs.core.truth_(best_entry__69823)) {
    if(cljs.core._EQ_.call(null, cljs.core.deref.call(null, cached_hierarchy), cljs.core.deref.call(null, hierarchy))) {
      cljs.core.swap_BANG_.call(null, method_cache, cljs.core.assoc, dispatch_val, cljs.core.second.call(null, best_entry__69823));
      return cljs.core.second.call(null, best_entry__69823)
    }else {
      cljs.core.reset_cache.call(null, method_cache, method_table, cached_hierarchy, hierarchy);
      return find_and_cache_best_method.call(null, name, dispatch_val, hierarchy, method_table, prefer_table, method_cache, cached_hierarchy)
    }
  }else {
    return null
  }
};
cljs.core.IMultiFn = {};
cljs.core._reset = function _reset(mf) {
  if(function() {
    var and__3822__auto____69828 = mf;
    if(and__3822__auto____69828) {
      return mf.cljs$core$IMultiFn$_reset$arity$1
    }else {
      return and__3822__auto____69828
    }
  }()) {
    return mf.cljs$core$IMultiFn$_reset$arity$1(mf)
  }else {
    var x__2397__auto____69829 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____69830 = cljs.core._reset[goog.typeOf(x__2397__auto____69829)];
      if(or__3824__auto____69830) {
        return or__3824__auto____69830
      }else {
        var or__3824__auto____69831 = cljs.core._reset["_"];
        if(or__3824__auto____69831) {
          return or__3824__auto____69831
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-reset", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._add_method = function _add_method(mf, dispatch_val, method) {
  if(function() {
    var and__3822__auto____69836 = mf;
    if(and__3822__auto____69836) {
      return mf.cljs$core$IMultiFn$_add_method$arity$3
    }else {
      return and__3822__auto____69836
    }
  }()) {
    return mf.cljs$core$IMultiFn$_add_method$arity$3(mf, dispatch_val, method)
  }else {
    var x__2397__auto____69837 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____69838 = cljs.core._add_method[goog.typeOf(x__2397__auto____69837)];
      if(or__3824__auto____69838) {
        return or__3824__auto____69838
      }else {
        var or__3824__auto____69839 = cljs.core._add_method["_"];
        if(or__3824__auto____69839) {
          return or__3824__auto____69839
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-add-method", mf);
        }
      }
    }().call(null, mf, dispatch_val, method)
  }
};
cljs.core._remove_method = function _remove_method(mf, dispatch_val) {
  if(function() {
    var and__3822__auto____69844 = mf;
    if(and__3822__auto____69844) {
      return mf.cljs$core$IMultiFn$_remove_method$arity$2
    }else {
      return and__3822__auto____69844
    }
  }()) {
    return mf.cljs$core$IMultiFn$_remove_method$arity$2(mf, dispatch_val)
  }else {
    var x__2397__auto____69845 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____69846 = cljs.core._remove_method[goog.typeOf(x__2397__auto____69845)];
      if(or__3824__auto____69846) {
        return or__3824__auto____69846
      }else {
        var or__3824__auto____69847 = cljs.core._remove_method["_"];
        if(or__3824__auto____69847) {
          return or__3824__auto____69847
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-remove-method", mf);
        }
      }
    }().call(null, mf, dispatch_val)
  }
};
cljs.core._prefer_method = function _prefer_method(mf, dispatch_val, dispatch_val_y) {
  if(function() {
    var and__3822__auto____69852 = mf;
    if(and__3822__auto____69852) {
      return mf.cljs$core$IMultiFn$_prefer_method$arity$3
    }else {
      return and__3822__auto____69852
    }
  }()) {
    return mf.cljs$core$IMultiFn$_prefer_method$arity$3(mf, dispatch_val, dispatch_val_y)
  }else {
    var x__2397__auto____69853 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____69854 = cljs.core._prefer_method[goog.typeOf(x__2397__auto____69853)];
      if(or__3824__auto____69854) {
        return or__3824__auto____69854
      }else {
        var or__3824__auto____69855 = cljs.core._prefer_method["_"];
        if(or__3824__auto____69855) {
          return or__3824__auto____69855
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-prefer-method", mf);
        }
      }
    }().call(null, mf, dispatch_val, dispatch_val_y)
  }
};
cljs.core._get_method = function _get_method(mf, dispatch_val) {
  if(function() {
    var and__3822__auto____69860 = mf;
    if(and__3822__auto____69860) {
      return mf.cljs$core$IMultiFn$_get_method$arity$2
    }else {
      return and__3822__auto____69860
    }
  }()) {
    return mf.cljs$core$IMultiFn$_get_method$arity$2(mf, dispatch_val)
  }else {
    var x__2397__auto____69861 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____69862 = cljs.core._get_method[goog.typeOf(x__2397__auto____69861)];
      if(or__3824__auto____69862) {
        return or__3824__auto____69862
      }else {
        var or__3824__auto____69863 = cljs.core._get_method["_"];
        if(or__3824__auto____69863) {
          return or__3824__auto____69863
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-get-method", mf);
        }
      }
    }().call(null, mf, dispatch_val)
  }
};
cljs.core._methods = function _methods(mf) {
  if(function() {
    var and__3822__auto____69868 = mf;
    if(and__3822__auto____69868) {
      return mf.cljs$core$IMultiFn$_methods$arity$1
    }else {
      return and__3822__auto____69868
    }
  }()) {
    return mf.cljs$core$IMultiFn$_methods$arity$1(mf)
  }else {
    var x__2397__auto____69869 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____69870 = cljs.core._methods[goog.typeOf(x__2397__auto____69869)];
      if(or__3824__auto____69870) {
        return or__3824__auto____69870
      }else {
        var or__3824__auto____69871 = cljs.core._methods["_"];
        if(or__3824__auto____69871) {
          return or__3824__auto____69871
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-methods", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._prefers = function _prefers(mf) {
  if(function() {
    var and__3822__auto____69876 = mf;
    if(and__3822__auto____69876) {
      return mf.cljs$core$IMultiFn$_prefers$arity$1
    }else {
      return and__3822__auto____69876
    }
  }()) {
    return mf.cljs$core$IMultiFn$_prefers$arity$1(mf)
  }else {
    var x__2397__auto____69877 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____69878 = cljs.core._prefers[goog.typeOf(x__2397__auto____69877)];
      if(or__3824__auto____69878) {
        return or__3824__auto____69878
      }else {
        var or__3824__auto____69879 = cljs.core._prefers["_"];
        if(or__3824__auto____69879) {
          return or__3824__auto____69879
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-prefers", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._dispatch = function _dispatch(mf, args) {
  if(function() {
    var and__3822__auto____69884 = mf;
    if(and__3822__auto____69884) {
      return mf.cljs$core$IMultiFn$_dispatch$arity$2
    }else {
      return and__3822__auto____69884
    }
  }()) {
    return mf.cljs$core$IMultiFn$_dispatch$arity$2(mf, args)
  }else {
    var x__2397__auto____69885 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____69886 = cljs.core._dispatch[goog.typeOf(x__2397__auto____69885)];
      if(or__3824__auto____69886) {
        return or__3824__auto____69886
      }else {
        var or__3824__auto____69887 = cljs.core._dispatch["_"];
        if(or__3824__auto____69887) {
          return or__3824__auto____69887
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-dispatch", mf);
        }
      }
    }().call(null, mf, args)
  }
};
cljs.core.do_dispatch = function do_dispatch(mf, dispatch_fn, args) {
  var dispatch_val__69890 = cljs.core.apply.call(null, dispatch_fn, args);
  var target_fn__69891 = cljs.core._get_method.call(null, mf, dispatch_val__69890);
  if(cljs.core.truth_(target_fn__69891)) {
  }else {
    throw new Error([cljs.core.str("No method in multimethod '"), cljs.core.str(cljs.core.name), cljs.core.str("' for dispatch value: "), cljs.core.str(dispatch_val__69890)].join(""));
  }
  return cljs.core.apply.call(null, target_fn__69891, args)
};
cljs.core.MultiFn = function(name, dispatch_fn, default_dispatch_val, hierarchy, method_table, prefer_table, method_cache, cached_hierarchy) {
  this.name = name;
  this.dispatch_fn = dispatch_fn;
  this.default_dispatch_val = default_dispatch_val;
  this.hierarchy = hierarchy;
  this.method_table = method_table;
  this.prefer_table = prefer_table;
  this.method_cache = method_cache;
  this.cached_hierarchy = cached_hierarchy;
  this.cljs$lang$protocol_mask$partition0$ = 4194304;
  this.cljs$lang$protocol_mask$partition1$ = 64
};
cljs.core.MultiFn.cljs$lang$type = true;
cljs.core.MultiFn.cljs$lang$ctorPrSeq = function(this__2343__auto__) {
  return cljs.core.list.call(null, "cljs.core/MultiFn")
};
cljs.core.MultiFn.prototype.cljs$core$IHash$_hash$arity$1 = function(this$) {
  var this__69892 = this;
  return goog.getUid(this$)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_reset$arity$1 = function(mf) {
  var this__69893 = this;
  cljs.core.swap_BANG_.call(null, this__69893.method_table, function(mf) {
    return cljs.core.ObjMap.EMPTY
  });
  cljs.core.swap_BANG_.call(null, this__69893.method_cache, function(mf) {
    return cljs.core.ObjMap.EMPTY
  });
  cljs.core.swap_BANG_.call(null, this__69893.prefer_table, function(mf) {
    return cljs.core.ObjMap.EMPTY
  });
  cljs.core.swap_BANG_.call(null, this__69893.cached_hierarchy, function(mf) {
    return null
  });
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_add_method$arity$3 = function(mf, dispatch_val, method) {
  var this__69894 = this;
  cljs.core.swap_BANG_.call(null, this__69894.method_table, cljs.core.assoc, dispatch_val, method);
  cljs.core.reset_cache.call(null, this__69894.method_cache, this__69894.method_table, this__69894.cached_hierarchy, this__69894.hierarchy);
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_remove_method$arity$2 = function(mf, dispatch_val) {
  var this__69895 = this;
  cljs.core.swap_BANG_.call(null, this__69895.method_table, cljs.core.dissoc, dispatch_val);
  cljs.core.reset_cache.call(null, this__69895.method_cache, this__69895.method_table, this__69895.cached_hierarchy, this__69895.hierarchy);
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_get_method$arity$2 = function(mf, dispatch_val) {
  var this__69896 = this;
  if(cljs.core._EQ_.call(null, cljs.core.deref.call(null, this__69896.cached_hierarchy), cljs.core.deref.call(null, this__69896.hierarchy))) {
  }else {
    cljs.core.reset_cache.call(null, this__69896.method_cache, this__69896.method_table, this__69896.cached_hierarchy, this__69896.hierarchy)
  }
  var temp__3971__auto____69897 = cljs.core.deref.call(null, this__69896.method_cache).call(null, dispatch_val);
  if(cljs.core.truth_(temp__3971__auto____69897)) {
    var target_fn__69898 = temp__3971__auto____69897;
    return target_fn__69898
  }else {
    var temp__3971__auto____69899 = cljs.core.find_and_cache_best_method.call(null, this__69896.name, dispatch_val, this__69896.hierarchy, this__69896.method_table, this__69896.prefer_table, this__69896.method_cache, this__69896.cached_hierarchy);
    if(cljs.core.truth_(temp__3971__auto____69899)) {
      var target_fn__69900 = temp__3971__auto____69899;
      return target_fn__69900
    }else {
      return cljs.core.deref.call(null, this__69896.method_table).call(null, this__69896.default_dispatch_val)
    }
  }
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_prefer_method$arity$3 = function(mf, dispatch_val_x, dispatch_val_y) {
  var this__69901 = this;
  if(cljs.core.truth_(cljs.core.prefers_STAR_.call(null, dispatch_val_x, dispatch_val_y, this__69901.prefer_table))) {
    throw new Error([cljs.core.str("Preference conflict in multimethod '"), cljs.core.str(this__69901.name), cljs.core.str("': "), cljs.core.str(dispatch_val_y), cljs.core.str(" is already preferred to "), cljs.core.str(dispatch_val_x)].join(""));
  }else {
  }
  cljs.core.swap_BANG_.call(null, this__69901.prefer_table, function(old) {
    return cljs.core.assoc.call(null, old, dispatch_val_x, cljs.core.conj.call(null, cljs.core._lookup.call(null, old, dispatch_val_x, cljs.core.PersistentHashSet.EMPTY), dispatch_val_y))
  });
  return cljs.core.reset_cache.call(null, this__69901.method_cache, this__69901.method_table, this__69901.cached_hierarchy, this__69901.hierarchy)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_methods$arity$1 = function(mf) {
  var this__69902 = this;
  return cljs.core.deref.call(null, this__69902.method_table)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_prefers$arity$1 = function(mf) {
  var this__69903 = this;
  return cljs.core.deref.call(null, this__69903.prefer_table)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_dispatch$arity$2 = function(mf, args) {
  var this__69904 = this;
  return cljs.core.do_dispatch.call(null, mf, this__69904.dispatch_fn, args)
};
cljs.core.MultiFn;
cljs.core.MultiFn.prototype.call = function() {
  var G__69906__delegate = function(_, args) {
    var self__69905 = this;
    return cljs.core._dispatch.call(null, self__69905, args)
  };
  var G__69906 = function(_, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return G__69906__delegate.call(this, _, args)
  };
  G__69906.cljs$lang$maxFixedArity = 1;
  G__69906.cljs$lang$applyTo = function(arglist__69907) {
    var _ = cljs.core.first(arglist__69907);
    var args = cljs.core.rest(arglist__69907);
    return G__69906__delegate(_, args)
  };
  G__69906.cljs$lang$arity$variadic = G__69906__delegate;
  return G__69906
}();
cljs.core.MultiFn.prototype.apply = function(_, args) {
  var self__69908 = this;
  return cljs.core._dispatch.call(null, self__69908, args)
};
cljs.core.remove_all_methods = function remove_all_methods(multifn) {
  return cljs.core._reset.call(null, multifn)
};
cljs.core.remove_method = function remove_method(multifn, dispatch_val) {
  return cljs.core._remove_method.call(null, multifn, dispatch_val)
};
cljs.core.prefer_method = function prefer_method(multifn, dispatch_val_x, dispatch_val_y) {
  return cljs.core._prefer_method.call(null, multifn, dispatch_val_x, dispatch_val_y)
};
cljs.core.methods$ = function methods$(multifn) {
  return cljs.core._methods.call(null, multifn)
};
cljs.core.get_method = function get_method(multifn, dispatch_val) {
  return cljs.core._get_method.call(null, multifn, dispatch_val)
};
cljs.core.prefers = function prefers(multifn) {
  return cljs.core._prefers.call(null, multifn)
};
cljs.core.UUID = function(uuid) {
  this.uuid = uuid;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 543162368
};
cljs.core.UUID.cljs$lang$type = true;
cljs.core.UUID.cljs$lang$ctorPrSeq = function(this__2343__auto__) {
  return cljs.core.list.call(null, "cljs.core/UUID")
};
cljs.core.UUID.prototype.cljs$core$IHash$_hash$arity$1 = function(this$) {
  var this__69909 = this;
  return goog.string.hashCode(cljs.core.pr_str.call(null, this$))
};
cljs.core.UUID.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(_69911, _) {
  var this__69910 = this;
  return cljs.core.list.call(null, [cljs.core.str('#uuid "'), cljs.core.str(this__69910.uuid), cljs.core.str('"')].join(""))
};
cljs.core.UUID.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(_, other) {
  var this__69912 = this;
  var and__3822__auto____69913 = cljs.core.instance_QMARK_.call(null, cljs.core.UUID, other);
  if(and__3822__auto____69913) {
    return this__69912.uuid === other.uuid
  }else {
    return and__3822__auto____69913
  }
};
cljs.core.UUID.prototype.toString = function() {
  var this__69914 = this;
  var this__69915 = this;
  return cljs.core.pr_str.call(null, this__69915)
};
cljs.core.UUID;
goog.provide("onedit.core");
goog.require("cljs.core");
onedit.core.editor = {};
goog.provide("goog.events.EventWrapper");
goog.events.EventWrapper = function() {
};
goog.events.EventWrapper.prototype.listen = function(src, listener, opt_capt, opt_scope, opt_eventHandler) {
};
goog.events.EventWrapper.prototype.unlisten = function(src, listener, opt_capt, opt_scope, opt_eventHandler) {
};
goog.provide("goog.userAgent");
goog.require("goog.string");
goog.userAgent.ASSUME_IE = false;
goog.userAgent.ASSUME_GECKO = false;
goog.userAgent.ASSUME_WEBKIT = false;
goog.userAgent.ASSUME_MOBILE_WEBKIT = false;
goog.userAgent.ASSUME_OPERA = false;
goog.userAgent.BROWSER_KNOWN_ = goog.userAgent.ASSUME_IE || goog.userAgent.ASSUME_GECKO || goog.userAgent.ASSUME_MOBILE_WEBKIT || goog.userAgent.ASSUME_WEBKIT || goog.userAgent.ASSUME_OPERA;
goog.userAgent.getUserAgentString = function() {
  return goog.global["navigator"] ? goog.global["navigator"].userAgent : null
};
goog.userAgent.getNavigator = function() {
  return goog.global["navigator"]
};
goog.userAgent.init_ = function() {
  goog.userAgent.detectedOpera_ = false;
  goog.userAgent.detectedIe_ = false;
  goog.userAgent.detectedWebkit_ = false;
  goog.userAgent.detectedMobile_ = false;
  goog.userAgent.detectedGecko_ = false;
  var ua;
  if(!goog.userAgent.BROWSER_KNOWN_ && (ua = goog.userAgent.getUserAgentString())) {
    var navigator = goog.userAgent.getNavigator();
    goog.userAgent.detectedOpera_ = ua.indexOf("Opera") == 0;
    goog.userAgent.detectedIe_ = !goog.userAgent.detectedOpera_ && ua.indexOf("MSIE") != -1;
    goog.userAgent.detectedWebkit_ = !goog.userAgent.detectedOpera_ && ua.indexOf("WebKit") != -1;
    goog.userAgent.detectedMobile_ = goog.userAgent.detectedWebkit_ && ua.indexOf("Mobile") != -1;
    goog.userAgent.detectedGecko_ = !goog.userAgent.detectedOpera_ && !goog.userAgent.detectedWebkit_ && navigator.product == "Gecko"
  }
};
if(!goog.userAgent.BROWSER_KNOWN_) {
  goog.userAgent.init_()
}
goog.userAgent.OPERA = goog.userAgent.BROWSER_KNOWN_ ? goog.userAgent.ASSUME_OPERA : goog.userAgent.detectedOpera_;
goog.userAgent.IE = goog.userAgent.BROWSER_KNOWN_ ? goog.userAgent.ASSUME_IE : goog.userAgent.detectedIe_;
goog.userAgent.GECKO = goog.userAgent.BROWSER_KNOWN_ ? goog.userAgent.ASSUME_GECKO : goog.userAgent.detectedGecko_;
goog.userAgent.WEBKIT = goog.userAgent.BROWSER_KNOWN_ ? goog.userAgent.ASSUME_WEBKIT || goog.userAgent.ASSUME_MOBILE_WEBKIT : goog.userAgent.detectedWebkit_;
goog.userAgent.MOBILE = goog.userAgent.ASSUME_MOBILE_WEBKIT || goog.userAgent.detectedMobile_;
goog.userAgent.SAFARI = goog.userAgent.WEBKIT;
goog.userAgent.determinePlatform_ = function() {
  var navigator = goog.userAgent.getNavigator();
  return navigator && navigator.platform || ""
};
goog.userAgent.PLATFORM = goog.userAgent.determinePlatform_();
goog.userAgent.ASSUME_MAC = false;
goog.userAgent.ASSUME_WINDOWS = false;
goog.userAgent.ASSUME_LINUX = false;
goog.userAgent.ASSUME_X11 = false;
goog.userAgent.PLATFORM_KNOWN_ = goog.userAgent.ASSUME_MAC || goog.userAgent.ASSUME_WINDOWS || goog.userAgent.ASSUME_LINUX || goog.userAgent.ASSUME_X11;
goog.userAgent.initPlatform_ = function() {
  goog.userAgent.detectedMac_ = goog.string.contains(goog.userAgent.PLATFORM, "Mac");
  goog.userAgent.detectedWindows_ = goog.string.contains(goog.userAgent.PLATFORM, "Win");
  goog.userAgent.detectedLinux_ = goog.string.contains(goog.userAgent.PLATFORM, "Linux");
  goog.userAgent.detectedX11_ = !!goog.userAgent.getNavigator() && goog.string.contains(goog.userAgent.getNavigator()["appVersion"] || "", "X11")
};
if(!goog.userAgent.PLATFORM_KNOWN_) {
  goog.userAgent.initPlatform_()
}
goog.userAgent.MAC = goog.userAgent.PLATFORM_KNOWN_ ? goog.userAgent.ASSUME_MAC : goog.userAgent.detectedMac_;
goog.userAgent.WINDOWS = goog.userAgent.PLATFORM_KNOWN_ ? goog.userAgent.ASSUME_WINDOWS : goog.userAgent.detectedWindows_;
goog.userAgent.LINUX = goog.userAgent.PLATFORM_KNOWN_ ? goog.userAgent.ASSUME_LINUX : goog.userAgent.detectedLinux_;
goog.userAgent.X11 = goog.userAgent.PLATFORM_KNOWN_ ? goog.userAgent.ASSUME_X11 : goog.userAgent.detectedX11_;
goog.userAgent.determineVersion_ = function() {
  var version = "", re;
  if(goog.userAgent.OPERA && goog.global["opera"]) {
    var operaVersion = goog.global["opera"].version;
    version = typeof operaVersion == "function" ? operaVersion() : operaVersion
  }else {
    if(goog.userAgent.GECKO) {
      re = /rv\:([^\);]+)(\)|;)/
    }else {
      if(goog.userAgent.IE) {
        re = /MSIE\s+([^\);]+)(\)|;)/
      }else {
        if(goog.userAgent.WEBKIT) {
          re = /WebKit\/(\S+)/
        }
      }
    }
    if(re) {
      var arr = re.exec(goog.userAgent.getUserAgentString());
      version = arr ? arr[1] : ""
    }
  }
  if(goog.userAgent.IE) {
    var docMode = goog.userAgent.getDocumentMode_();
    if(docMode > parseFloat(version)) {
      return String(docMode)
    }
  }
  return version
};
goog.userAgent.getDocumentMode_ = function() {
  var doc = goog.global["document"];
  return doc ? doc["documentMode"] : undefined
};
goog.userAgent.VERSION = goog.userAgent.determineVersion_();
goog.userAgent.compare = function(v1, v2) {
  return goog.string.compareVersions(v1, v2)
};
goog.userAgent.isVersionCache_ = {};
goog.userAgent.isVersion = function(version) {
  return goog.userAgent.isVersionCache_[version] || (goog.userAgent.isVersionCache_[version] = goog.string.compareVersions(goog.userAgent.VERSION, version) >= 0)
};
goog.userAgent.isDocumentModeCache_ = {};
goog.userAgent.isDocumentMode = function(documentMode) {
  return goog.userAgent.isDocumentModeCache_[documentMode] || (goog.userAgent.isDocumentModeCache_[documentMode] = goog.userAgent.IE && document.documentMode && document.documentMode >= documentMode)
};
goog.provide("goog.events.BrowserFeature");
goog.require("goog.userAgent");
goog.events.BrowserFeature = {HAS_W3C_BUTTON:!goog.userAgent.IE || goog.userAgent.isDocumentMode(9), HAS_W3C_EVENT_SUPPORT:!goog.userAgent.IE || goog.userAgent.isDocumentMode(9), SET_KEY_CODE_TO_PREVENT_DEFAULT:goog.userAgent.IE && !goog.userAgent.isVersion("8")};
goog.provide("goog.disposable.IDisposable");
goog.disposable.IDisposable = function() {
};
goog.disposable.IDisposable.prototype.dispose;
goog.disposable.IDisposable.prototype.isDisposed;
goog.provide("goog.Disposable");
goog.provide("goog.dispose");
goog.require("goog.disposable.IDisposable");
goog.Disposable = function() {
  if(goog.Disposable.ENABLE_MONITORING) {
    goog.Disposable.instances_[goog.getUid(this)] = this
  }
};
goog.Disposable.ENABLE_MONITORING = false;
goog.Disposable.instances_ = {};
goog.Disposable.getUndisposedObjects = function() {
  var ret = [];
  for(var id in goog.Disposable.instances_) {
    if(goog.Disposable.instances_.hasOwnProperty(id)) {
      ret.push(goog.Disposable.instances_[Number(id)])
    }
  }
  return ret
};
goog.Disposable.clearUndisposedObjects = function() {
  goog.Disposable.instances_ = {}
};
goog.Disposable.prototype.disposed_ = false;
goog.Disposable.prototype.dependentDisposables_;
goog.Disposable.prototype.isDisposed = function() {
  return this.disposed_
};
goog.Disposable.prototype.getDisposed = goog.Disposable.prototype.isDisposed;
goog.Disposable.prototype.dispose = function() {
  if(!this.disposed_) {
    this.disposed_ = true;
    this.disposeInternal();
    if(goog.Disposable.ENABLE_MONITORING) {
      var uid = goog.getUid(this);
      if(!goog.Disposable.instances_.hasOwnProperty(uid)) {
        throw Error(this + " did not call the goog.Disposable base " + "constructor or was disposed of after a clearUndisposedObjects " + "call");
      }
      delete goog.Disposable.instances_[uid]
    }
  }
};
goog.Disposable.prototype.registerDisposable = function(disposable) {
  if(!this.dependentDisposables_) {
    this.dependentDisposables_ = []
  }
  this.dependentDisposables_.push(disposable)
};
goog.Disposable.prototype.disposeInternal = function() {
  if(this.dependentDisposables_) {
    goog.disposeAll.apply(null, this.dependentDisposables_)
  }
};
goog.dispose = function(obj) {
  if(obj && typeof obj.dispose == "function") {
    obj.dispose()
  }
};
goog.disposeAll = function(var_args) {
  for(var i = 0, len = arguments.length;i < len;++i) {
    var disposable = arguments[i];
    if(goog.isArrayLike(disposable)) {
      goog.disposeAll.apply(null, disposable)
    }else {
      goog.dispose(disposable)
    }
  }
};
goog.provide("goog.events.Event");
goog.require("goog.Disposable");
goog.events.Event = function(type, opt_target) {
  goog.Disposable.call(this);
  this.type = type;
  this.target = opt_target;
  this.currentTarget = this.target
};
goog.inherits(goog.events.Event, goog.Disposable);
goog.events.Event.prototype.disposeInternal = function() {
  delete this.type;
  delete this.target;
  delete this.currentTarget
};
goog.events.Event.prototype.propagationStopped_ = false;
goog.events.Event.prototype.returnValue_ = true;
goog.events.Event.prototype.stopPropagation = function() {
  this.propagationStopped_ = true
};
goog.events.Event.prototype.preventDefault = function() {
  this.returnValue_ = false
};
goog.events.Event.stopPropagation = function(e) {
  e.stopPropagation()
};
goog.events.Event.preventDefault = function(e) {
  e.preventDefault()
};
goog.provide("goog.events.EventType");
goog.require("goog.userAgent");
goog.events.EventType = {CLICK:"click", DBLCLICK:"dblclick", MOUSEDOWN:"mousedown", MOUSEUP:"mouseup", MOUSEOVER:"mouseover", MOUSEOUT:"mouseout", MOUSEMOVE:"mousemove", SELECTSTART:"selectstart", KEYPRESS:"keypress", KEYDOWN:"keydown", KEYUP:"keyup", BLUR:"blur", FOCUS:"focus", DEACTIVATE:"deactivate", FOCUSIN:goog.userAgent.IE ? "focusin" : "DOMFocusIn", FOCUSOUT:goog.userAgent.IE ? "focusout" : "DOMFocusOut", CHANGE:"change", SELECT:"select", SUBMIT:"submit", INPUT:"input", PROPERTYCHANGE:"propertychange", 
DRAGSTART:"dragstart", DRAGENTER:"dragenter", DRAGOVER:"dragover", DRAGLEAVE:"dragleave", DROP:"drop", TOUCHSTART:"touchstart", TOUCHMOVE:"touchmove", TOUCHEND:"touchend", TOUCHCANCEL:"touchcancel", CONTEXTMENU:"contextmenu", ERROR:"error", HELP:"help", LOAD:"load", LOSECAPTURE:"losecapture", READYSTATECHANGE:"readystatechange", RESIZE:"resize", SCROLL:"scroll", UNLOAD:"unload", HASHCHANGE:"hashchange", PAGEHIDE:"pagehide", PAGESHOW:"pageshow", POPSTATE:"popstate", COPY:"copy", PASTE:"paste", CUT:"cut", 
BEFORECOPY:"beforecopy", BEFORECUT:"beforecut", BEFOREPASTE:"beforepaste", MESSAGE:"message", CONNECT:"connect", TRANSITIONEND:goog.userAgent.WEBKIT ? "webkitTransitionEnd" : goog.userAgent.OPERA ? "oTransitionEnd" : "transitionend"};
goog.provide("goog.reflect");
goog.reflect.object = function(type, object) {
  return object
};
goog.reflect.sinkValue = function(x) {
  goog.reflect.sinkValue[" "](x);
  return x
};
goog.reflect.sinkValue[" "] = goog.nullFunction;
goog.reflect.canAccessProperty = function(obj, prop) {
  try {
    goog.reflect.sinkValue(obj[prop]);
    return true
  }catch(e) {
  }
  return false
};
goog.provide("goog.events.BrowserEvent");
goog.provide("goog.events.BrowserEvent.MouseButton");
goog.require("goog.events.BrowserFeature");
goog.require("goog.events.Event");
goog.require("goog.events.EventType");
goog.require("goog.reflect");
goog.require("goog.userAgent");
goog.events.BrowserEvent = function(opt_e, opt_currentTarget) {
  if(opt_e) {
    this.init(opt_e, opt_currentTarget)
  }
};
goog.inherits(goog.events.BrowserEvent, goog.events.Event);
goog.events.BrowserEvent.MouseButton = {LEFT:0, MIDDLE:1, RIGHT:2};
goog.events.BrowserEvent.IEButtonMap = [1, 4, 2];
goog.events.BrowserEvent.prototype.target = null;
goog.events.BrowserEvent.prototype.currentTarget;
goog.events.BrowserEvent.prototype.relatedTarget = null;
goog.events.BrowserEvent.prototype.offsetX = 0;
goog.events.BrowserEvent.prototype.offsetY = 0;
goog.events.BrowserEvent.prototype.clientX = 0;
goog.events.BrowserEvent.prototype.clientY = 0;
goog.events.BrowserEvent.prototype.screenX = 0;
goog.events.BrowserEvent.prototype.screenY = 0;
goog.events.BrowserEvent.prototype.button = 0;
goog.events.BrowserEvent.prototype.keyCode = 0;
goog.events.BrowserEvent.prototype.charCode = 0;
goog.events.BrowserEvent.prototype.ctrlKey = false;
goog.events.BrowserEvent.prototype.altKey = false;
goog.events.BrowserEvent.prototype.shiftKey = false;
goog.events.BrowserEvent.prototype.metaKey = false;
goog.events.BrowserEvent.prototype.state;
goog.events.BrowserEvent.prototype.platformModifierKey = false;
goog.events.BrowserEvent.prototype.event_ = null;
goog.events.BrowserEvent.prototype.init = function(e, opt_currentTarget) {
  var type = this.type = e.type;
  goog.events.Event.call(this, type);
  this.target = e.target || e.srcElement;
  this.currentTarget = opt_currentTarget;
  var relatedTarget = e.relatedTarget;
  if(relatedTarget) {
    if(goog.userAgent.GECKO) {
      if(!goog.reflect.canAccessProperty(relatedTarget, "nodeName")) {
        relatedTarget = null
      }
    }
  }else {
    if(type == goog.events.EventType.MOUSEOVER) {
      relatedTarget = e.fromElement
    }else {
      if(type == goog.events.EventType.MOUSEOUT) {
        relatedTarget = e.toElement
      }
    }
  }
  this.relatedTarget = relatedTarget;
  this.offsetX = e.offsetX !== undefined ? e.offsetX : e.layerX;
  this.offsetY = e.offsetY !== undefined ? e.offsetY : e.layerY;
  this.clientX = e.clientX !== undefined ? e.clientX : e.pageX;
  this.clientY = e.clientY !== undefined ? e.clientY : e.pageY;
  this.screenX = e.screenX || 0;
  this.screenY = e.screenY || 0;
  this.button = e.button;
  this.keyCode = e.keyCode || 0;
  this.charCode = e.charCode || (type == "keypress" ? e.keyCode : 0);
  this.ctrlKey = e.ctrlKey;
  this.altKey = e.altKey;
  this.shiftKey = e.shiftKey;
  this.metaKey = e.metaKey;
  this.platformModifierKey = goog.userAgent.MAC ? e.metaKey : e.ctrlKey;
  this.state = e.state;
  this.event_ = e;
  delete this.returnValue_;
  delete this.propagationStopped_
};
goog.events.BrowserEvent.prototype.isButton = function(button) {
  if(!goog.events.BrowserFeature.HAS_W3C_BUTTON) {
    if(this.type == "click") {
      return button == goog.events.BrowserEvent.MouseButton.LEFT
    }else {
      return!!(this.event_.button & goog.events.BrowserEvent.IEButtonMap[button])
    }
  }else {
    return this.event_.button == button
  }
};
goog.events.BrowserEvent.prototype.isMouseActionButton = function() {
  return this.isButton(goog.events.BrowserEvent.MouseButton.LEFT) && !(goog.userAgent.WEBKIT && goog.userAgent.MAC && this.ctrlKey)
};
goog.events.BrowserEvent.prototype.stopPropagation = function() {
  goog.events.BrowserEvent.superClass_.stopPropagation.call(this);
  if(this.event_.stopPropagation) {
    this.event_.stopPropagation()
  }else {
    this.event_.cancelBubble = true
  }
};
goog.events.BrowserEvent.prototype.preventDefault = function() {
  goog.events.BrowserEvent.superClass_.preventDefault.call(this);
  var be = this.event_;
  if(!be.preventDefault) {
    be.returnValue = false;
    if(goog.events.BrowserFeature.SET_KEY_CODE_TO_PREVENT_DEFAULT) {
      try {
        var VK_F1 = 112;
        var VK_F12 = 123;
        if(be.ctrlKey || be.keyCode >= VK_F1 && be.keyCode <= VK_F12) {
          be.keyCode = -1
        }
      }catch(ex) {
      }
    }
  }else {
    be.preventDefault()
  }
};
goog.events.BrowserEvent.prototype.getBrowserEvent = function() {
  return this.event_
};
goog.events.BrowserEvent.prototype.disposeInternal = function() {
  goog.events.BrowserEvent.superClass_.disposeInternal.call(this);
  this.event_ = null;
  this.target = null;
  this.currentTarget = null;
  this.relatedTarget = null
};
goog.provide("goog.debug.EntryPointMonitor");
goog.provide("goog.debug.entryPointRegistry");
goog.require("goog.asserts");
goog.debug.EntryPointMonitor = function() {
};
goog.debug.EntryPointMonitor.prototype.wrap;
goog.debug.EntryPointMonitor.prototype.unwrap;
goog.debug.entryPointRegistry.refList_ = [];
goog.debug.entryPointRegistry.monitors_ = [];
goog.debug.entryPointRegistry.monitorsMayExist_ = false;
goog.debug.entryPointRegistry.register = function(callback) {
  goog.debug.entryPointRegistry.refList_[goog.debug.entryPointRegistry.refList_.length] = callback;
  if(goog.debug.entryPointRegistry.monitorsMayExist_) {
    var monitors = goog.debug.entryPointRegistry.monitors_;
    for(var i = 0;i < monitors.length;i++) {
      callback(goog.bind(monitors[i].wrap, monitors[i]))
    }
  }
};
goog.debug.entryPointRegistry.monitorAll = function(monitor) {
  goog.debug.entryPointRegistry.monitorsMayExist_ = true;
  var transformer = goog.bind(monitor.wrap, monitor);
  for(var i = 0;i < goog.debug.entryPointRegistry.refList_.length;i++) {
    goog.debug.entryPointRegistry.refList_[i](transformer)
  }
  goog.debug.entryPointRegistry.monitors_.push(monitor)
};
goog.debug.entryPointRegistry.unmonitorAllIfPossible = function(monitor) {
  var monitors = goog.debug.entryPointRegistry.monitors_;
  goog.asserts.assert(monitor == monitors[monitors.length - 1], "Only the most recent monitor can be unwrapped.");
  var transformer = goog.bind(monitor.unwrap, monitor);
  for(var i = 0;i < goog.debug.entryPointRegistry.refList_.length;i++) {
    goog.debug.entryPointRegistry.refList_[i](transformer)
  }
  monitors.length--
};
goog.provide("goog.debug.errorHandlerWeakDep");
goog.debug.errorHandlerWeakDep = {protectEntryPoint:function(fn, opt_tracers) {
  return fn
}};
goog.provide("goog.events.Listener");
goog.events.Listener = function() {
};
goog.events.Listener.counter_ = 0;
goog.events.Listener.prototype.isFunctionListener_;
goog.events.Listener.prototype.listener;
goog.events.Listener.prototype.proxy;
goog.events.Listener.prototype.src;
goog.events.Listener.prototype.type;
goog.events.Listener.prototype.capture;
goog.events.Listener.prototype.handler;
goog.events.Listener.prototype.key = 0;
goog.events.Listener.prototype.removed = false;
goog.events.Listener.prototype.callOnce = false;
goog.events.Listener.prototype.init = function(listener, proxy, src, type, capture, opt_handler) {
  if(goog.isFunction(listener)) {
    this.isFunctionListener_ = true
  }else {
    if(listener && listener.handleEvent && goog.isFunction(listener.handleEvent)) {
      this.isFunctionListener_ = false
    }else {
      throw Error("Invalid listener argument");
    }
  }
  this.listener = listener;
  this.proxy = proxy;
  this.src = src;
  this.type = type;
  this.capture = !!capture;
  this.handler = opt_handler;
  this.callOnce = false;
  this.key = ++goog.events.Listener.counter_;
  this.removed = false
};
goog.events.Listener.prototype.handleEvent = function(eventObject) {
  if(this.isFunctionListener_) {
    return this.listener.call(this.handler || this.src, eventObject)
  }
  return this.listener.handleEvent.call(this.listener, eventObject)
};
goog.provide("goog.events");
goog.require("goog.array");
goog.require("goog.debug.entryPointRegistry");
goog.require("goog.debug.errorHandlerWeakDep");
goog.require("goog.events.BrowserEvent");
goog.require("goog.events.BrowserFeature");
goog.require("goog.events.Event");
goog.require("goog.events.EventWrapper");
goog.require("goog.events.Listener");
goog.require("goog.object");
goog.require("goog.userAgent");
goog.events.ASSUME_GOOD_GC = false;
goog.events.listeners_ = {};
goog.events.listenerTree_ = {};
goog.events.sources_ = {};
goog.events.onString_ = "on";
goog.events.onStringMap_ = {};
goog.events.keySeparator_ = "_";
goog.events.listen = function(src, type, listener, opt_capt, opt_handler) {
  if(!type) {
    throw Error("Invalid event type");
  }else {
    if(goog.isArray(type)) {
      for(var i = 0;i < type.length;i++) {
        goog.events.listen(src, type[i], listener, opt_capt, opt_handler)
      }
      return null
    }else {
      var capture = !!opt_capt;
      var map = goog.events.listenerTree_;
      if(!(type in map)) {
        map[type] = {count_:0, remaining_:0}
      }
      map = map[type];
      if(!(capture in map)) {
        map[capture] = {count_:0, remaining_:0};
        map.count_++
      }
      map = map[capture];
      var srcUid = goog.getUid(src);
      var listenerArray, listenerObj;
      map.remaining_++;
      if(!map[srcUid]) {
        listenerArray = map[srcUid] = [];
        map.count_++
      }else {
        listenerArray = map[srcUid];
        for(var i = 0;i < listenerArray.length;i++) {
          listenerObj = listenerArray[i];
          if(listenerObj.listener == listener && listenerObj.handler == opt_handler) {
            if(listenerObj.removed) {
              break
            }
            return listenerArray[i].key
          }
        }
      }
      var proxy = goog.events.getProxy();
      proxy.src = src;
      listenerObj = new goog.events.Listener;
      listenerObj.init(listener, proxy, src, type, capture, opt_handler);
      var key = listenerObj.key;
      proxy.key = key;
      listenerArray.push(listenerObj);
      goog.events.listeners_[key] = listenerObj;
      if(!goog.events.sources_[srcUid]) {
        goog.events.sources_[srcUid] = []
      }
      goog.events.sources_[srcUid].push(listenerObj);
      if(src.addEventListener) {
        if(src == goog.global || !src.customEvent_) {
          src.addEventListener(type, proxy, capture)
        }
      }else {
        src.attachEvent(goog.events.getOnString_(type), proxy)
      }
      return key
    }
  }
};
goog.events.getProxy = function() {
  var proxyCallbackFunction = goog.events.handleBrowserEvent_;
  var f = goog.events.BrowserFeature.HAS_W3C_EVENT_SUPPORT ? function(eventObject) {
    return proxyCallbackFunction.call(f.src, f.key, eventObject)
  } : function(eventObject) {
    var v = proxyCallbackFunction.call(f.src, f.key, eventObject);
    if(!v) {
      return v
    }
  };
  return f
};
goog.events.listenOnce = function(src, type, listener, opt_capt, opt_handler) {
  if(goog.isArray(type)) {
    for(var i = 0;i < type.length;i++) {
      goog.events.listenOnce(src, type[i], listener, opt_capt, opt_handler)
    }
    return null
  }
  var key = goog.events.listen(src, type, listener, opt_capt, opt_handler);
  var listenerObj = goog.events.listeners_[key];
  listenerObj.callOnce = true;
  return key
};
goog.events.listenWithWrapper = function(src, wrapper, listener, opt_capt, opt_handler) {
  wrapper.listen(src, listener, opt_capt, opt_handler)
};
goog.events.unlisten = function(src, type, listener, opt_capt, opt_handler) {
  if(goog.isArray(type)) {
    for(var i = 0;i < type.length;i++) {
      goog.events.unlisten(src, type[i], listener, opt_capt, opt_handler)
    }
    return null
  }
  var capture = !!opt_capt;
  var listenerArray = goog.events.getListeners_(src, type, capture);
  if(!listenerArray) {
    return false
  }
  for(var i = 0;i < listenerArray.length;i++) {
    if(listenerArray[i].listener == listener && listenerArray[i].capture == capture && listenerArray[i].handler == opt_handler) {
      return goog.events.unlistenByKey(listenerArray[i].key)
    }
  }
  return false
};
goog.events.unlistenByKey = function(key) {
  if(!goog.events.listeners_[key]) {
    return false
  }
  var listener = goog.events.listeners_[key];
  if(listener.removed) {
    return false
  }
  var src = listener.src;
  var type = listener.type;
  var proxy = listener.proxy;
  var capture = listener.capture;
  if(src.removeEventListener) {
    if(src == goog.global || !src.customEvent_) {
      src.removeEventListener(type, proxy, capture)
    }
  }else {
    if(src.detachEvent) {
      src.detachEvent(goog.events.getOnString_(type), proxy)
    }
  }
  var srcUid = goog.getUid(src);
  var listenerArray = goog.events.listenerTree_[type][capture][srcUid];
  if(goog.events.sources_[srcUid]) {
    var sourcesArray = goog.events.sources_[srcUid];
    goog.array.remove(sourcesArray, listener);
    if(sourcesArray.length == 0) {
      delete goog.events.sources_[srcUid]
    }
  }
  listener.removed = true;
  listenerArray.needsCleanup_ = true;
  goog.events.cleanUp_(type, capture, srcUid, listenerArray);
  delete goog.events.listeners_[key];
  return true
};
goog.events.unlistenWithWrapper = function(src, wrapper, listener, opt_capt, opt_handler) {
  wrapper.unlisten(src, listener, opt_capt, opt_handler)
};
goog.events.cleanUp_ = function(type, capture, srcUid, listenerArray) {
  if(!listenerArray.locked_) {
    if(listenerArray.needsCleanup_) {
      for(var oldIndex = 0, newIndex = 0;oldIndex < listenerArray.length;oldIndex++) {
        if(listenerArray[oldIndex].removed) {
          var proxy = listenerArray[oldIndex].proxy;
          proxy.src = null;
          continue
        }
        if(oldIndex != newIndex) {
          listenerArray[newIndex] = listenerArray[oldIndex]
        }
        newIndex++
      }
      listenerArray.length = newIndex;
      listenerArray.needsCleanup_ = false;
      if(newIndex == 0) {
        delete goog.events.listenerTree_[type][capture][srcUid];
        goog.events.listenerTree_[type][capture].count_--;
        if(goog.events.listenerTree_[type][capture].count_ == 0) {
          delete goog.events.listenerTree_[type][capture];
          goog.events.listenerTree_[type].count_--
        }
        if(goog.events.listenerTree_[type].count_ == 0) {
          delete goog.events.listenerTree_[type]
        }
      }
    }
  }
};
goog.events.removeAll = function(opt_obj, opt_type, opt_capt) {
  var count = 0;
  var noObj = opt_obj == null;
  var noType = opt_type == null;
  var noCapt = opt_capt == null;
  opt_capt = !!opt_capt;
  if(!noObj) {
    var srcUid = goog.getUid(opt_obj);
    if(goog.events.sources_[srcUid]) {
      var sourcesArray = goog.events.sources_[srcUid];
      for(var i = sourcesArray.length - 1;i >= 0;i--) {
        var listener = sourcesArray[i];
        if((noType || opt_type == listener.type) && (noCapt || opt_capt == listener.capture)) {
          goog.events.unlistenByKey(listener.key);
          count++
        }
      }
    }
  }else {
    goog.object.forEach(goog.events.sources_, function(listeners) {
      for(var i = listeners.length - 1;i >= 0;i--) {
        var listener = listeners[i];
        if((noType || opt_type == listener.type) && (noCapt || opt_capt == listener.capture)) {
          goog.events.unlistenByKey(listener.key);
          count++
        }
      }
    })
  }
  return count
};
goog.events.getListeners = function(obj, type, capture) {
  return goog.events.getListeners_(obj, type, capture) || []
};
goog.events.getListeners_ = function(obj, type, capture) {
  var map = goog.events.listenerTree_;
  if(type in map) {
    map = map[type];
    if(capture in map) {
      map = map[capture];
      var objUid = goog.getUid(obj);
      if(map[objUid]) {
        return map[objUid]
      }
    }
  }
  return null
};
goog.events.getListener = function(src, type, listener, opt_capt, opt_handler) {
  var capture = !!opt_capt;
  var listenerArray = goog.events.getListeners_(src, type, capture);
  if(listenerArray) {
    for(var i = 0;i < listenerArray.length;i++) {
      if(!listenerArray[i].removed && listenerArray[i].listener == listener && listenerArray[i].capture == capture && listenerArray[i].handler == opt_handler) {
        return listenerArray[i]
      }
    }
  }
  return null
};
goog.events.hasListener = function(obj, opt_type, opt_capture) {
  var objUid = goog.getUid(obj);
  var listeners = goog.events.sources_[objUid];
  if(listeners) {
    var hasType = goog.isDef(opt_type);
    var hasCapture = goog.isDef(opt_capture);
    if(hasType && hasCapture) {
      var map = goog.events.listenerTree_[opt_type];
      return!!map && !!map[opt_capture] && objUid in map[opt_capture]
    }else {
      if(!(hasType || hasCapture)) {
        return true
      }else {
        return goog.array.some(listeners, function(listener) {
          return hasType && listener.type == opt_type || hasCapture && listener.capture == opt_capture
        })
      }
    }
  }
  return false
};
goog.events.expose = function(e) {
  var str = [];
  for(var key in e) {
    if(e[key] && e[key].id) {
      str.push(key + " = " + e[key] + " (" + e[key].id + ")")
    }else {
      str.push(key + " = " + e[key])
    }
  }
  return str.join("\n")
};
goog.events.getOnString_ = function(type) {
  if(type in goog.events.onStringMap_) {
    return goog.events.onStringMap_[type]
  }
  return goog.events.onStringMap_[type] = goog.events.onString_ + type
};
goog.events.fireListeners = function(obj, type, capture, eventObject) {
  var map = goog.events.listenerTree_;
  if(type in map) {
    map = map[type];
    if(capture in map) {
      return goog.events.fireListeners_(map[capture], obj, type, capture, eventObject)
    }
  }
  return true
};
goog.events.fireListeners_ = function(map, obj, type, capture, eventObject) {
  var retval = 1;
  var objUid = goog.getUid(obj);
  if(map[objUid]) {
    map.remaining_--;
    var listenerArray = map[objUid];
    if(!listenerArray.locked_) {
      listenerArray.locked_ = 1
    }else {
      listenerArray.locked_++
    }
    try {
      var length = listenerArray.length;
      for(var i = 0;i < length;i++) {
        var listener = listenerArray[i];
        if(listener && !listener.removed) {
          retval &= goog.events.fireListener(listener, eventObject) !== false
        }
      }
    }finally {
      listenerArray.locked_--;
      goog.events.cleanUp_(type, capture, objUid, listenerArray)
    }
  }
  return Boolean(retval)
};
goog.events.fireListener = function(listener, eventObject) {
  var rv = listener.handleEvent(eventObject);
  if(listener.callOnce) {
    goog.events.unlistenByKey(listener.key)
  }
  return rv
};
goog.events.getTotalListenerCount = function() {
  return goog.object.getCount(goog.events.listeners_)
};
goog.events.dispatchEvent = function(src, e) {
  var type = e.type || e;
  var map = goog.events.listenerTree_;
  if(!(type in map)) {
    return true
  }
  if(goog.isString(e)) {
    e = new goog.events.Event(e, src)
  }else {
    if(!(e instanceof goog.events.Event)) {
      var oldEvent = e;
      e = new goog.events.Event(type, src);
      goog.object.extend(e, oldEvent)
    }else {
      e.target = e.target || src
    }
  }
  var rv = 1, ancestors;
  map = map[type];
  var hasCapture = true in map;
  var targetsMap;
  if(hasCapture) {
    ancestors = [];
    for(var parent = src;parent;parent = parent.getParentEventTarget()) {
      ancestors.push(parent)
    }
    targetsMap = map[true];
    targetsMap.remaining_ = targetsMap.count_;
    for(var i = ancestors.length - 1;!e.propagationStopped_ && i >= 0 && targetsMap.remaining_;i--) {
      e.currentTarget = ancestors[i];
      rv &= goog.events.fireListeners_(targetsMap, ancestors[i], e.type, true, e) && e.returnValue_ != false
    }
  }
  var hasBubble = false in map;
  if(hasBubble) {
    targetsMap = map[false];
    targetsMap.remaining_ = targetsMap.count_;
    if(hasCapture) {
      for(var i = 0;!e.propagationStopped_ && i < ancestors.length && targetsMap.remaining_;i++) {
        e.currentTarget = ancestors[i];
        rv &= goog.events.fireListeners_(targetsMap, ancestors[i], e.type, false, e) && e.returnValue_ != false
      }
    }else {
      for(var current = src;!e.propagationStopped_ && current && targetsMap.remaining_;current = current.getParentEventTarget()) {
        e.currentTarget = current;
        rv &= goog.events.fireListeners_(targetsMap, current, e.type, false, e) && e.returnValue_ != false
      }
    }
  }
  return Boolean(rv)
};
goog.events.protectBrowserEventEntryPoint = function(errorHandler) {
  goog.events.handleBrowserEvent_ = errorHandler.protectEntryPoint(goog.events.handleBrowserEvent_)
};
goog.events.handleBrowserEvent_ = function(key, opt_evt) {
  if(!goog.events.listeners_[key]) {
    return true
  }
  var listener = goog.events.listeners_[key];
  var type = listener.type;
  var map = goog.events.listenerTree_;
  if(!(type in map)) {
    return true
  }
  map = map[type];
  var retval, targetsMap;
  if(!goog.events.BrowserFeature.HAS_W3C_EVENT_SUPPORT) {
    var ieEvent = opt_evt || goog.getObjectByName("window.event");
    var hasCapture = true in map;
    var hasBubble = false in map;
    if(hasCapture) {
      if(goog.events.isMarkedIeEvent_(ieEvent)) {
        return true
      }
      goog.events.markIeEvent_(ieEvent)
    }
    var evt = new goog.events.BrowserEvent;
    evt.init(ieEvent, this);
    retval = true;
    try {
      if(hasCapture) {
        var ancestors = [];
        for(var parent = evt.currentTarget;parent;parent = parent.parentNode) {
          ancestors.push(parent)
        }
        targetsMap = map[true];
        targetsMap.remaining_ = targetsMap.count_;
        for(var i = ancestors.length - 1;!evt.propagationStopped_ && i >= 0 && targetsMap.remaining_;i--) {
          evt.currentTarget = ancestors[i];
          retval &= goog.events.fireListeners_(targetsMap, ancestors[i], type, true, evt)
        }
        if(hasBubble) {
          targetsMap = map[false];
          targetsMap.remaining_ = targetsMap.count_;
          for(var i = 0;!evt.propagationStopped_ && i < ancestors.length && targetsMap.remaining_;i++) {
            evt.currentTarget = ancestors[i];
            retval &= goog.events.fireListeners_(targetsMap, ancestors[i], type, false, evt)
          }
        }
      }else {
        retval = goog.events.fireListener(listener, evt)
      }
    }finally {
      if(ancestors) {
        ancestors.length = 0
      }
      evt.dispose()
    }
    return retval
  }
  var be = new goog.events.BrowserEvent(opt_evt, this);
  try {
    retval = goog.events.fireListener(listener, be)
  }finally {
    be.dispose()
  }
  return retval
};
goog.events.markIeEvent_ = function(e) {
  var useReturnValue = false;
  if(e.keyCode == 0) {
    try {
      e.keyCode = -1;
      return
    }catch(ex) {
      useReturnValue = true
    }
  }
  if(useReturnValue || e.returnValue == undefined) {
    e.returnValue = true
  }
};
goog.events.isMarkedIeEvent_ = function(e) {
  return e.keyCode < 0 || e.returnValue != undefined
};
goog.events.uniqueIdCounter_ = 0;
goog.events.getUniqueId = function(identifier) {
  return identifier + "_" + goog.events.uniqueIdCounter_++
};
goog.debug.entryPointRegistry.register(function(transformer) {
  goog.events.handleBrowserEvent_ = transformer(goog.events.handleBrowserEvent_)
});
goog.provide("goog.events.EventTarget");
goog.require("goog.Disposable");
goog.require("goog.events");
goog.events.EventTarget = function() {
  goog.Disposable.call(this)
};
goog.inherits(goog.events.EventTarget, goog.Disposable);
goog.events.EventTarget.prototype.customEvent_ = true;
goog.events.EventTarget.prototype.parentEventTarget_ = null;
goog.events.EventTarget.prototype.getParentEventTarget = function() {
  return this.parentEventTarget_
};
goog.events.EventTarget.prototype.setParentEventTarget = function(parent) {
  this.parentEventTarget_ = parent
};
goog.events.EventTarget.prototype.addEventListener = function(type, handler, opt_capture, opt_handlerScope) {
  goog.events.listen(this, type, handler, opt_capture, opt_handlerScope)
};
goog.events.EventTarget.prototype.removeEventListener = function(type, handler, opt_capture, opt_handlerScope) {
  goog.events.unlisten(this, type, handler, opt_capture, opt_handlerScope)
};
goog.events.EventTarget.prototype.dispatchEvent = function(e) {
  return goog.events.dispatchEvent(this, e)
};
goog.events.EventTarget.prototype.disposeInternal = function() {
  goog.events.EventTarget.superClass_.disposeInternal.call(this);
  goog.events.removeAll(this);
  this.parentEventTarget_ = null
};
goog.provide("goog.dom.BrowserFeature");
goog.require("goog.userAgent");
goog.dom.BrowserFeature = {CAN_ADD_NAME_OR_TYPE_ATTRIBUTES:!goog.userAgent.IE || goog.userAgent.isDocumentMode(9), CAN_USE_CHILDREN_ATTRIBUTE:!goog.userAgent.GECKO && !goog.userAgent.IE || goog.userAgent.IE && goog.userAgent.isDocumentMode(9) || goog.userAgent.GECKO && goog.userAgent.isVersion("1.9.1"), CAN_USE_INNER_TEXT:goog.userAgent.IE && !goog.userAgent.isVersion("9"), INNER_HTML_NEEDS_SCOPED_ELEMENT:goog.userAgent.IE};
goog.provide("clojure.browser.event");
goog.require("cljs.core");
goog.require("goog.events.EventType");
goog.require("goog.events.EventTarget");
goog.require("goog.events");
clojure.browser.event.EventType = {};
clojure.browser.event.event_types = function event_types(this$) {
  if(function() {
    var and__3822__auto____65962 = this$;
    if(and__3822__auto____65962) {
      return this$.clojure$browser$event$EventType$event_types$arity$1
    }else {
      return and__3822__auto____65962
    }
  }()) {
    return this$.clojure$browser$event$EventType$event_types$arity$1(this$)
  }else {
    var x__2397__auto____65963 = this$ == null ? null : this$;
    return function() {
      var or__3824__auto____65964 = clojure.browser.event.event_types[goog.typeOf(x__2397__auto____65963)];
      if(or__3824__auto____65964) {
        return or__3824__auto____65964
      }else {
        var or__3824__auto____65965 = clojure.browser.event.event_types["_"];
        if(or__3824__auto____65965) {
          return or__3824__auto____65965
        }else {
          throw cljs.core.missing_protocol.call(null, "EventType.event-types", this$);
        }
      }
    }().call(null, this$)
  }
};
Element.prototype.clojure$browser$event$EventType$ = true;
Element.prototype.clojure$browser$event$EventType$event_types$arity$1 = function(this$) {
  return cljs.core.into.call(null, cljs.core.ObjMap.EMPTY, cljs.core.map.call(null, function(p__65966) {
    var vec__65967__65968 = p__65966;
    var k__65969 = cljs.core.nth.call(null, vec__65967__65968, 0, null);
    var v__65970 = cljs.core.nth.call(null, vec__65967__65968, 1, null);
    return cljs.core.PersistentVector.fromArray([cljs.core.keyword.call(null, k__65969.toLowerCase()), v__65970], true)
  }, cljs.core.merge.call(null, cljs.core.js__GT_clj.call(null, goog.events.EventType))))
};
goog.events.EventTarget.prototype.clojure$browser$event$EventType$ = true;
goog.events.EventTarget.prototype.clojure$browser$event$EventType$event_types$arity$1 = function(this$) {
  return cljs.core.into.call(null, cljs.core.ObjMap.EMPTY, cljs.core.map.call(null, function(p__65971) {
    var vec__65972__65973 = p__65971;
    var k__65974 = cljs.core.nth.call(null, vec__65972__65973, 0, null);
    var v__65975 = cljs.core.nth.call(null, vec__65972__65973, 1, null);
    return cljs.core.PersistentVector.fromArray([cljs.core.keyword.call(null, k__65974.toLowerCase()), v__65975], true)
  }, cljs.core.merge.call(null, cljs.core.js__GT_clj.call(null, goog.events.EventType))))
};
clojure.browser.event.listen = function() {
  var listen = null;
  var listen__3 = function(src, type, fn) {
    return listen.call(null, src, type, fn, false)
  };
  var listen__4 = function(src, type, fn, capture_QMARK_) {
    return goog.events.listen(src, cljs.core._lookup.call(null, clojure.browser.event.event_types.call(null, src), type, type), fn, capture_QMARK_)
  };
  listen = function(src, type, fn, capture_QMARK_) {
    switch(arguments.length) {
      case 3:
        return listen__3.call(this, src, type, fn);
      case 4:
        return listen__4.call(this, src, type, fn, capture_QMARK_)
    }
    throw"Invalid arity: " + arguments.length;
  };
  listen.cljs$lang$arity$3 = listen__3;
  listen.cljs$lang$arity$4 = listen__4;
  return listen
}();
clojure.browser.event.listen_once = function() {
  var listen_once = null;
  var listen_once__3 = function(src, type, fn) {
    return listen_once.call(null, src, type, fn, false)
  };
  var listen_once__4 = function(src, type, fn, capture_QMARK_) {
    return goog.events.listenOnce(src, cljs.core._lookup.call(null, clojure.browser.event.event_types.call(null, src), type, type), fn, capture_QMARK_)
  };
  listen_once = function(src, type, fn, capture_QMARK_) {
    switch(arguments.length) {
      case 3:
        return listen_once__3.call(this, src, type, fn);
      case 4:
        return listen_once__4.call(this, src, type, fn, capture_QMARK_)
    }
    throw"Invalid arity: " + arguments.length;
  };
  listen_once.cljs$lang$arity$3 = listen_once__3;
  listen_once.cljs$lang$arity$4 = listen_once__4;
  return listen_once
}();
clojure.browser.event.unlisten = function() {
  var unlisten = null;
  var unlisten__3 = function(src, type, fn) {
    return unlisten.call(null, src, type, fn, false)
  };
  var unlisten__4 = function(src, type, fn, capture_QMARK_) {
    return goog.events.unlisten(src, cljs.core._lookup.call(null, clojure.browser.event.event_types.call(null, src), type, type), fn, capture_QMARK_)
  };
  unlisten = function(src, type, fn, capture_QMARK_) {
    switch(arguments.length) {
      case 3:
        return unlisten__3.call(this, src, type, fn);
      case 4:
        return unlisten__4.call(this, src, type, fn, capture_QMARK_)
    }
    throw"Invalid arity: " + arguments.length;
  };
  unlisten.cljs$lang$arity$3 = unlisten__3;
  unlisten.cljs$lang$arity$4 = unlisten__4;
  return unlisten
}();
clojure.browser.event.unlisten_by_key = function unlisten_by_key(key) {
  return goog.events.unlistenByKey(key)
};
clojure.browser.event.dispatch_event = function dispatch_event(src, event) {
  return goog.events.dispatchEvent(src, event)
};
clojure.browser.event.expose = function expose(e) {
  return goog.events.expose(e)
};
clojure.browser.event.fire_listeners = function fire_listeners(obj, type, capture, event) {
  return null
};
clojure.browser.event.total_listener_count = function total_listener_count() {
  return goog.events.getTotalListenerCount()
};
clojure.browser.event.get_listener = function get_listener(src, type, listener, opt_capt, opt_handler) {
  return null
};
clojure.browser.event.all_listeners = function all_listeners(obj, type, capture) {
  return null
};
clojure.browser.event.unique_event_id = function unique_event_id(event_type) {
  return null
};
clojure.browser.event.has_listener = function has_listener(obj, opt_type, opt_capture) {
  return null
};
clojure.browser.event.remove_all = function remove_all(opt_obj, opt_type, opt_capt) {
  return null
};
goog.provide("goog.dom.TagName");
goog.dom.TagName = {A:"A", ABBR:"ABBR", ACRONYM:"ACRONYM", ADDRESS:"ADDRESS", APPLET:"APPLET", AREA:"AREA", B:"B", BASE:"BASE", BASEFONT:"BASEFONT", BDO:"BDO", BIG:"BIG", BLOCKQUOTE:"BLOCKQUOTE", BODY:"BODY", BR:"BR", BUTTON:"BUTTON", CANVAS:"CANVAS", CAPTION:"CAPTION", CENTER:"CENTER", CITE:"CITE", CODE:"CODE", COL:"COL", COLGROUP:"COLGROUP", DD:"DD", DEL:"DEL", DFN:"DFN", DIR:"DIR", DIV:"DIV", DL:"DL", DT:"DT", EM:"EM", FIELDSET:"FIELDSET", FONT:"FONT", FORM:"FORM", FRAME:"FRAME", FRAMESET:"FRAMESET", 
H1:"H1", H2:"H2", H3:"H3", H4:"H4", H5:"H5", H6:"H6", HEAD:"HEAD", HR:"HR", HTML:"HTML", I:"I", IFRAME:"IFRAME", IMG:"IMG", INPUT:"INPUT", INS:"INS", ISINDEX:"ISINDEX", KBD:"KBD", LABEL:"LABEL", LEGEND:"LEGEND", LI:"LI", LINK:"LINK", MAP:"MAP", MENU:"MENU", META:"META", NOFRAMES:"NOFRAMES", NOSCRIPT:"NOSCRIPT", OBJECT:"OBJECT", OL:"OL", OPTGROUP:"OPTGROUP", OPTION:"OPTION", P:"P", PARAM:"PARAM", PRE:"PRE", Q:"Q", S:"S", SAMP:"SAMP", SCRIPT:"SCRIPT", SELECT:"SELECT", SMALL:"SMALL", SPAN:"SPAN", STRIKE:"STRIKE", 
STRONG:"STRONG", STYLE:"STYLE", SUB:"SUB", SUP:"SUP", TABLE:"TABLE", TBODY:"TBODY", TD:"TD", TEXTAREA:"TEXTAREA", TFOOT:"TFOOT", TH:"TH", THEAD:"THEAD", TITLE:"TITLE", TR:"TR", TT:"TT", U:"U", UL:"UL", VAR:"VAR"};
goog.provide("goog.dom.classes");
goog.require("goog.array");
goog.dom.classes.set = function(element, className) {
  element.className = className
};
goog.dom.classes.get = function(element) {
  var className = element.className;
  return className && typeof className.split == "function" ? className.split(/\s+/) : []
};
goog.dom.classes.add = function(element, var_args) {
  var classes = goog.dom.classes.get(element);
  var args = goog.array.slice(arguments, 1);
  var b = goog.dom.classes.add_(classes, args);
  element.className = classes.join(" ");
  return b
};
goog.dom.classes.remove = function(element, var_args) {
  var classes = goog.dom.classes.get(element);
  var args = goog.array.slice(arguments, 1);
  var b = goog.dom.classes.remove_(classes, args);
  element.className = classes.join(" ");
  return b
};
goog.dom.classes.add_ = function(classes, args) {
  var rv = 0;
  for(var i = 0;i < args.length;i++) {
    if(!goog.array.contains(classes, args[i])) {
      classes.push(args[i]);
      rv++
    }
  }
  return rv == args.length
};
goog.dom.classes.remove_ = function(classes, args) {
  var rv = 0;
  for(var i = 0;i < classes.length;i++) {
    if(goog.array.contains(args, classes[i])) {
      goog.array.splice(classes, i--, 1);
      rv++
    }
  }
  return rv == args.length
};
goog.dom.classes.swap = function(element, fromClass, toClass) {
  var classes = goog.dom.classes.get(element);
  var removed = false;
  for(var i = 0;i < classes.length;i++) {
    if(classes[i] == fromClass) {
      goog.array.splice(classes, i--, 1);
      removed = true
    }
  }
  if(removed) {
    classes.push(toClass);
    element.className = classes.join(" ")
  }
  return removed
};
goog.dom.classes.addRemove = function(element, classesToRemove, classesToAdd) {
  var classes = goog.dom.classes.get(element);
  if(goog.isString(classesToRemove)) {
    goog.array.remove(classes, classesToRemove)
  }else {
    if(goog.isArray(classesToRemove)) {
      goog.dom.classes.remove_(classes, classesToRemove)
    }
  }
  if(goog.isString(classesToAdd) && !goog.array.contains(classes, classesToAdd)) {
    classes.push(classesToAdd)
  }else {
    if(goog.isArray(classesToAdd)) {
      goog.dom.classes.add_(classes, classesToAdd)
    }
  }
  element.className = classes.join(" ")
};
goog.dom.classes.has = function(element, className) {
  return goog.array.contains(goog.dom.classes.get(element), className)
};
goog.dom.classes.enable = function(element, className, enabled) {
  if(enabled) {
    goog.dom.classes.add(element, className)
  }else {
    goog.dom.classes.remove(element, className)
  }
};
goog.dom.classes.toggle = function(element, className) {
  var add = !goog.dom.classes.has(element, className);
  goog.dom.classes.enable(element, className, add);
  return add
};
goog.provide("goog.math.Coordinate");
goog.math.Coordinate = function(opt_x, opt_y) {
  this.x = goog.isDef(opt_x) ? opt_x : 0;
  this.y = goog.isDef(opt_y) ? opt_y : 0
};
goog.math.Coordinate.prototype.clone = function() {
  return new goog.math.Coordinate(this.x, this.y)
};
if(goog.DEBUG) {
  goog.math.Coordinate.prototype.toString = function() {
    return"(" + this.x + ", " + this.y + ")"
  }
}
goog.math.Coordinate.equals = function(a, b) {
  if(a == b) {
    return true
  }
  if(!a || !b) {
    return false
  }
  return a.x == b.x && a.y == b.y
};
goog.math.Coordinate.distance = function(a, b) {
  var dx = a.x - b.x;
  var dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy)
};
goog.math.Coordinate.squaredDistance = function(a, b) {
  var dx = a.x - b.x;
  var dy = a.y - b.y;
  return dx * dx + dy * dy
};
goog.math.Coordinate.difference = function(a, b) {
  return new goog.math.Coordinate(a.x - b.x, a.y - b.y)
};
goog.math.Coordinate.sum = function(a, b) {
  return new goog.math.Coordinate(a.x + b.x, a.y + b.y)
};
goog.provide("goog.math.Size");
goog.math.Size = function(width, height) {
  this.width = width;
  this.height = height
};
goog.math.Size.equals = function(a, b) {
  if(a == b) {
    return true
  }
  if(!a || !b) {
    return false
  }
  return a.width == b.width && a.height == b.height
};
goog.math.Size.prototype.clone = function() {
  return new goog.math.Size(this.width, this.height)
};
if(goog.DEBUG) {
  goog.math.Size.prototype.toString = function() {
    return"(" + this.width + " x " + this.height + ")"
  }
}
goog.math.Size.prototype.getLongest = function() {
  return Math.max(this.width, this.height)
};
goog.math.Size.prototype.getShortest = function() {
  return Math.min(this.width, this.height)
};
goog.math.Size.prototype.area = function() {
  return this.width * this.height
};
goog.math.Size.prototype.perimeter = function() {
  return(this.width + this.height) * 2
};
goog.math.Size.prototype.aspectRatio = function() {
  return this.width / this.height
};
goog.math.Size.prototype.isEmpty = function() {
  return!this.area()
};
goog.math.Size.prototype.ceil = function() {
  this.width = Math.ceil(this.width);
  this.height = Math.ceil(this.height);
  return this
};
goog.math.Size.prototype.fitsInside = function(target) {
  return this.width <= target.width && this.height <= target.height
};
goog.math.Size.prototype.floor = function() {
  this.width = Math.floor(this.width);
  this.height = Math.floor(this.height);
  return this
};
goog.math.Size.prototype.round = function() {
  this.width = Math.round(this.width);
  this.height = Math.round(this.height);
  return this
};
goog.math.Size.prototype.scale = function(s) {
  this.width *= s;
  this.height *= s;
  return this
};
goog.math.Size.prototype.scaleToFit = function(target) {
  var s = this.aspectRatio() > target.aspectRatio() ? target.width / this.width : target.height / this.height;
  return this.scale(s)
};
goog.provide("goog.dom");
goog.provide("goog.dom.DomHelper");
goog.provide("goog.dom.NodeType");
goog.require("goog.array");
goog.require("goog.dom.BrowserFeature");
goog.require("goog.dom.TagName");
goog.require("goog.dom.classes");
goog.require("goog.math.Coordinate");
goog.require("goog.math.Size");
goog.require("goog.object");
goog.require("goog.string");
goog.require("goog.userAgent");
goog.dom.ASSUME_QUIRKS_MODE = false;
goog.dom.ASSUME_STANDARDS_MODE = false;
goog.dom.COMPAT_MODE_KNOWN_ = goog.dom.ASSUME_QUIRKS_MODE || goog.dom.ASSUME_STANDARDS_MODE;
goog.dom.NodeType = {ELEMENT:1, ATTRIBUTE:2, TEXT:3, CDATA_SECTION:4, ENTITY_REFERENCE:5, ENTITY:6, PROCESSING_INSTRUCTION:7, COMMENT:8, DOCUMENT:9, DOCUMENT_TYPE:10, DOCUMENT_FRAGMENT:11, NOTATION:12};
goog.dom.getDomHelper = function(opt_element) {
  return opt_element ? new goog.dom.DomHelper(goog.dom.getOwnerDocument(opt_element)) : goog.dom.defaultDomHelper_ || (goog.dom.defaultDomHelper_ = new goog.dom.DomHelper)
};
goog.dom.defaultDomHelper_;
goog.dom.getDocument = function() {
  return document
};
goog.dom.getElement = function(element) {
  return goog.isString(element) ? document.getElementById(element) : element
};
goog.dom.$ = goog.dom.getElement;
goog.dom.getElementsByTagNameAndClass = function(opt_tag, opt_class, opt_el) {
  return goog.dom.getElementsByTagNameAndClass_(document, opt_tag, opt_class, opt_el)
};
goog.dom.getElementsByClass = function(className, opt_el) {
  var parent = opt_el || document;
  if(goog.dom.canUseQuerySelector_(parent)) {
    return parent.querySelectorAll("." + className)
  }else {
    if(parent.getElementsByClassName) {
      return parent.getElementsByClassName(className)
    }
  }
  return goog.dom.getElementsByTagNameAndClass_(document, "*", className, opt_el)
};
goog.dom.getElementByClass = function(className, opt_el) {
  var parent = opt_el || document;
  var retVal = null;
  if(goog.dom.canUseQuerySelector_(parent)) {
    retVal = parent.querySelector("." + className)
  }else {
    retVal = goog.dom.getElementsByClass(className, opt_el)[0]
  }
  return retVal || null
};
goog.dom.canUseQuerySelector_ = function(parent) {
  return parent.querySelectorAll && parent.querySelector && (!goog.userAgent.WEBKIT || goog.dom.isCss1CompatMode_(document) || goog.userAgent.isVersion("528"))
};
goog.dom.getElementsByTagNameAndClass_ = function(doc, opt_tag, opt_class, opt_el) {
  var parent = opt_el || doc;
  var tagName = opt_tag && opt_tag != "*" ? opt_tag.toUpperCase() : "";
  if(goog.dom.canUseQuerySelector_(parent) && (tagName || opt_class)) {
    var query = tagName + (opt_class ? "." + opt_class : "");
    return parent.querySelectorAll(query)
  }
  if(opt_class && parent.getElementsByClassName) {
    var els = parent.getElementsByClassName(opt_class);
    if(tagName) {
      var arrayLike = {};
      var len = 0;
      for(var i = 0, el;el = els[i];i++) {
        if(tagName == el.nodeName) {
          arrayLike[len++] = el
        }
      }
      arrayLike.length = len;
      return arrayLike
    }else {
      return els
    }
  }
  var els = parent.getElementsByTagName(tagName || "*");
  if(opt_class) {
    var arrayLike = {};
    var len = 0;
    for(var i = 0, el;el = els[i];i++) {
      var className = el.className;
      if(typeof className.split == "function" && goog.array.contains(className.split(/\s+/), opt_class)) {
        arrayLike[len++] = el
      }
    }
    arrayLike.length = len;
    return arrayLike
  }else {
    return els
  }
};
goog.dom.$$ = goog.dom.getElementsByTagNameAndClass;
goog.dom.setProperties = function(element, properties) {
  goog.object.forEach(properties, function(val, key) {
    if(key == "style") {
      element.style.cssText = val
    }else {
      if(key == "class") {
        element.className = val
      }else {
        if(key == "for") {
          element.htmlFor = val
        }else {
          if(key in goog.dom.DIRECT_ATTRIBUTE_MAP_) {
            element.setAttribute(goog.dom.DIRECT_ATTRIBUTE_MAP_[key], val)
          }else {
            if(goog.string.startsWith(key, "aria-")) {
              element.setAttribute(key, val)
            }else {
              element[key] = val
            }
          }
        }
      }
    }
  })
};
goog.dom.DIRECT_ATTRIBUTE_MAP_ = {"cellpadding":"cellPadding", "cellspacing":"cellSpacing", "colspan":"colSpan", "rowspan":"rowSpan", "valign":"vAlign", "height":"height", "width":"width", "usemap":"useMap", "frameborder":"frameBorder", "maxlength":"maxLength", "type":"type"};
goog.dom.getViewportSize = function(opt_window) {
  return goog.dom.getViewportSize_(opt_window || window)
};
goog.dom.getViewportSize_ = function(win) {
  var doc = win.document;
  if(goog.userAgent.WEBKIT && !goog.userAgent.isVersion("500") && !goog.userAgent.MOBILE) {
    if(typeof win.innerHeight == "undefined") {
      win = window
    }
    var innerHeight = win.innerHeight;
    var scrollHeight = win.document.documentElement.scrollHeight;
    if(win == win.top) {
      if(scrollHeight < innerHeight) {
        innerHeight -= 15
      }
    }
    return new goog.math.Size(win.innerWidth, innerHeight)
  }
  var el = goog.dom.isCss1CompatMode_(doc) ? doc.documentElement : doc.body;
  return new goog.math.Size(el.clientWidth, el.clientHeight)
};
goog.dom.getDocumentHeight = function() {
  return goog.dom.getDocumentHeight_(window)
};
goog.dom.getDocumentHeight_ = function(win) {
  var doc = win.document;
  var height = 0;
  if(doc) {
    var vh = goog.dom.getViewportSize_(win).height;
    var body = doc.body;
    var docEl = doc.documentElement;
    if(goog.dom.isCss1CompatMode_(doc) && docEl.scrollHeight) {
      height = docEl.scrollHeight != vh ? docEl.scrollHeight : docEl.offsetHeight
    }else {
      var sh = docEl.scrollHeight;
      var oh = docEl.offsetHeight;
      if(docEl.clientHeight != oh) {
        sh = body.scrollHeight;
        oh = body.offsetHeight
      }
      if(sh > vh) {
        height = sh > oh ? sh : oh
      }else {
        height = sh < oh ? sh : oh
      }
    }
  }
  return height
};
goog.dom.getPageScroll = function(opt_window) {
  var win = opt_window || goog.global || window;
  return goog.dom.getDomHelper(win.document).getDocumentScroll()
};
goog.dom.getDocumentScroll = function() {
  return goog.dom.getDocumentScroll_(document)
};
goog.dom.getDocumentScroll_ = function(doc) {
  var el = goog.dom.getDocumentScrollElement_(doc);
  var win = goog.dom.getWindow_(doc);
  return new goog.math.Coordinate(win.pageXOffset || el.scrollLeft, win.pageYOffset || el.scrollTop)
};
goog.dom.getDocumentScrollElement = function() {
  return goog.dom.getDocumentScrollElement_(document)
};
goog.dom.getDocumentScrollElement_ = function(doc) {
  return!goog.userAgent.WEBKIT && goog.dom.isCss1CompatMode_(doc) ? doc.documentElement : doc.body
};
goog.dom.getWindow = function(opt_doc) {
  return opt_doc ? goog.dom.getWindow_(opt_doc) : window
};
goog.dom.getWindow_ = function(doc) {
  return doc.parentWindow || doc.defaultView
};
goog.dom.createDom = function(tagName, opt_attributes, var_args) {
  return goog.dom.createDom_(document, arguments)
};
goog.dom.createDom_ = function(doc, args) {
  var tagName = args[0];
  var attributes = args[1];
  if(!goog.dom.BrowserFeature.CAN_ADD_NAME_OR_TYPE_ATTRIBUTES && attributes && (attributes.name || attributes.type)) {
    var tagNameArr = ["<", tagName];
    if(attributes.name) {
      tagNameArr.push(' name="', goog.string.htmlEscape(attributes.name), '"')
    }
    if(attributes.type) {
      tagNameArr.push(' type="', goog.string.htmlEscape(attributes.type), '"');
      var clone = {};
      goog.object.extend(clone, attributes);
      attributes = clone;
      delete attributes.type
    }
    tagNameArr.push(">");
    tagName = tagNameArr.join("")
  }
  var element = doc.createElement(tagName);
  if(attributes) {
    if(goog.isString(attributes)) {
      element.className = attributes
    }else {
      if(goog.isArray(attributes)) {
        goog.dom.classes.add.apply(null, [element].concat(attributes))
      }else {
        goog.dom.setProperties(element, attributes)
      }
    }
  }
  if(args.length > 2) {
    goog.dom.append_(doc, element, args, 2)
  }
  return element
};
goog.dom.append_ = function(doc, parent, args, startIndex) {
  function childHandler(child) {
    if(child) {
      parent.appendChild(goog.isString(child) ? doc.createTextNode(child) : child)
    }
  }
  for(var i = startIndex;i < args.length;i++) {
    var arg = args[i];
    if(goog.isArrayLike(arg) && !goog.dom.isNodeLike(arg)) {
      goog.array.forEach(goog.dom.isNodeList(arg) ? goog.array.clone(arg) : arg, childHandler)
    }else {
      childHandler(arg)
    }
  }
};
goog.dom.$dom = goog.dom.createDom;
goog.dom.createElement = function(name) {
  return document.createElement(name)
};
goog.dom.createTextNode = function(content) {
  return document.createTextNode(content)
};
goog.dom.createTable = function(rows, columns, opt_fillWithNbsp) {
  return goog.dom.createTable_(document, rows, columns, !!opt_fillWithNbsp)
};
goog.dom.createTable_ = function(doc, rows, columns, fillWithNbsp) {
  var rowHtml = ["<tr>"];
  for(var i = 0;i < columns;i++) {
    rowHtml.push(fillWithNbsp ? "<td>&nbsp;</td>" : "<td></td>")
  }
  rowHtml.push("</tr>");
  rowHtml = rowHtml.join("");
  var totalHtml = ["<table>"];
  for(i = 0;i < rows;i++) {
    totalHtml.push(rowHtml)
  }
  totalHtml.push("</table>");
  var elem = doc.createElement(goog.dom.TagName.DIV);
  elem.innerHTML = totalHtml.join("");
  return elem.removeChild(elem.firstChild)
};
goog.dom.htmlToDocumentFragment = function(htmlString) {
  return goog.dom.htmlToDocumentFragment_(document, htmlString)
};
goog.dom.htmlToDocumentFragment_ = function(doc, htmlString) {
  var tempDiv = doc.createElement("div");
  if(goog.dom.BrowserFeature.INNER_HTML_NEEDS_SCOPED_ELEMENT) {
    tempDiv.innerHTML = "<br>" + htmlString;
    tempDiv.removeChild(tempDiv.firstChild)
  }else {
    tempDiv.innerHTML = htmlString
  }
  if(tempDiv.childNodes.length == 1) {
    return tempDiv.removeChild(tempDiv.firstChild)
  }else {
    var fragment = doc.createDocumentFragment();
    while(tempDiv.firstChild) {
      fragment.appendChild(tempDiv.firstChild)
    }
    return fragment
  }
};
goog.dom.getCompatMode = function() {
  return goog.dom.isCss1CompatMode() ? "CSS1Compat" : "BackCompat"
};
goog.dom.isCss1CompatMode = function() {
  return goog.dom.isCss1CompatMode_(document)
};
goog.dom.isCss1CompatMode_ = function(doc) {
  if(goog.dom.COMPAT_MODE_KNOWN_) {
    return goog.dom.ASSUME_STANDARDS_MODE
  }
  return doc.compatMode == "CSS1Compat"
};
goog.dom.canHaveChildren = function(node) {
  if(node.nodeType != goog.dom.NodeType.ELEMENT) {
    return false
  }
  switch(node.tagName) {
    case goog.dom.TagName.APPLET:
    ;
    case goog.dom.TagName.AREA:
    ;
    case goog.dom.TagName.BASE:
    ;
    case goog.dom.TagName.BR:
    ;
    case goog.dom.TagName.COL:
    ;
    case goog.dom.TagName.FRAME:
    ;
    case goog.dom.TagName.HR:
    ;
    case goog.dom.TagName.IMG:
    ;
    case goog.dom.TagName.INPUT:
    ;
    case goog.dom.TagName.IFRAME:
    ;
    case goog.dom.TagName.ISINDEX:
    ;
    case goog.dom.TagName.LINK:
    ;
    case goog.dom.TagName.NOFRAMES:
    ;
    case goog.dom.TagName.NOSCRIPT:
    ;
    case goog.dom.TagName.META:
    ;
    case goog.dom.TagName.OBJECT:
    ;
    case goog.dom.TagName.PARAM:
    ;
    case goog.dom.TagName.SCRIPT:
    ;
    case goog.dom.TagName.STYLE:
      return false
  }
  return true
};
goog.dom.appendChild = function(parent, child) {
  parent.appendChild(child)
};
goog.dom.append = function(parent, var_args) {
  goog.dom.append_(goog.dom.getOwnerDocument(parent), parent, arguments, 1)
};
goog.dom.removeChildren = function(node) {
  var child;
  while(child = node.firstChild) {
    node.removeChild(child)
  }
};
goog.dom.insertSiblingBefore = function(newNode, refNode) {
  if(refNode.parentNode) {
    refNode.parentNode.insertBefore(newNode, refNode)
  }
};
goog.dom.insertSiblingAfter = function(newNode, refNode) {
  if(refNode.parentNode) {
    refNode.parentNode.insertBefore(newNode, refNode.nextSibling)
  }
};
goog.dom.insertChildAt = function(parent, child, index) {
  parent.insertBefore(child, parent.childNodes[index] || null)
};
goog.dom.removeNode = function(node) {
  return node && node.parentNode ? node.parentNode.removeChild(node) : null
};
goog.dom.replaceNode = function(newNode, oldNode) {
  var parent = oldNode.parentNode;
  if(parent) {
    parent.replaceChild(newNode, oldNode)
  }
};
goog.dom.flattenElement = function(element) {
  var child, parent = element.parentNode;
  if(parent && parent.nodeType != goog.dom.NodeType.DOCUMENT_FRAGMENT) {
    if(element.removeNode) {
      return element.removeNode(false)
    }else {
      while(child = element.firstChild) {
        parent.insertBefore(child, element)
      }
      return goog.dom.removeNode(element)
    }
  }
};
goog.dom.getChildren = function(element) {
  if(goog.dom.BrowserFeature.CAN_USE_CHILDREN_ATTRIBUTE && element.children != undefined) {
    return element.children
  }
  return goog.array.filter(element.childNodes, function(node) {
    return node.nodeType == goog.dom.NodeType.ELEMENT
  })
};
goog.dom.getFirstElementChild = function(node) {
  if(node.firstElementChild != undefined) {
    return node.firstElementChild
  }
  return goog.dom.getNextElementNode_(node.firstChild, true)
};
goog.dom.getLastElementChild = function(node) {
  if(node.lastElementChild != undefined) {
    return node.lastElementChild
  }
  return goog.dom.getNextElementNode_(node.lastChild, false)
};
goog.dom.getNextElementSibling = function(node) {
  if(node.nextElementSibling != undefined) {
    return node.nextElementSibling
  }
  return goog.dom.getNextElementNode_(node.nextSibling, true)
};
goog.dom.getPreviousElementSibling = function(node) {
  if(node.previousElementSibling != undefined) {
    return node.previousElementSibling
  }
  return goog.dom.getNextElementNode_(node.previousSibling, false)
};
goog.dom.getNextElementNode_ = function(node, forward) {
  while(node && node.nodeType != goog.dom.NodeType.ELEMENT) {
    node = forward ? node.nextSibling : node.previousSibling
  }
  return node
};
goog.dom.getNextNode = function(node) {
  if(!node) {
    return null
  }
  if(node.firstChild) {
    return node.firstChild
  }
  while(node && !node.nextSibling) {
    node = node.parentNode
  }
  return node ? node.nextSibling : null
};
goog.dom.getPreviousNode = function(node) {
  if(!node) {
    return null
  }
  if(!node.previousSibling) {
    return node.parentNode
  }
  node = node.previousSibling;
  while(node && node.lastChild) {
    node = node.lastChild
  }
  return node
};
goog.dom.isNodeLike = function(obj) {
  return goog.isObject(obj) && obj.nodeType > 0
};
goog.dom.isElement = function(obj) {
  return goog.isObject(obj) && obj.nodeType == goog.dom.NodeType.ELEMENT
};
goog.dom.isWindow = function(obj) {
  return goog.isObject(obj) && obj["window"] == obj
};
goog.dom.contains = function(parent, descendant) {
  if(parent.contains && descendant.nodeType == goog.dom.NodeType.ELEMENT) {
    return parent == descendant || parent.contains(descendant)
  }
  if(typeof parent.compareDocumentPosition != "undefined") {
    return parent == descendant || Boolean(parent.compareDocumentPosition(descendant) & 16)
  }
  while(descendant && parent != descendant) {
    descendant = descendant.parentNode
  }
  return descendant == parent
};
goog.dom.compareNodeOrder = function(node1, node2) {
  if(node1 == node2) {
    return 0
  }
  if(node1.compareDocumentPosition) {
    return node1.compareDocumentPosition(node2) & 2 ? 1 : -1
  }
  if("sourceIndex" in node1 || node1.parentNode && "sourceIndex" in node1.parentNode) {
    var isElement1 = node1.nodeType == goog.dom.NodeType.ELEMENT;
    var isElement2 = node2.nodeType == goog.dom.NodeType.ELEMENT;
    if(isElement1 && isElement2) {
      return node1.sourceIndex - node2.sourceIndex
    }else {
      var parent1 = node1.parentNode;
      var parent2 = node2.parentNode;
      if(parent1 == parent2) {
        return goog.dom.compareSiblingOrder_(node1, node2)
      }
      if(!isElement1 && goog.dom.contains(parent1, node2)) {
        return-1 * goog.dom.compareParentsDescendantNodeIe_(node1, node2)
      }
      if(!isElement2 && goog.dom.contains(parent2, node1)) {
        return goog.dom.compareParentsDescendantNodeIe_(node2, node1)
      }
      return(isElement1 ? node1.sourceIndex : parent1.sourceIndex) - (isElement2 ? node2.sourceIndex : parent2.sourceIndex)
    }
  }
  var doc = goog.dom.getOwnerDocument(node1);
  var range1, range2;
  range1 = doc.createRange();
  range1.selectNode(node1);
  range1.collapse(true);
  range2 = doc.createRange();
  range2.selectNode(node2);
  range2.collapse(true);
  return range1.compareBoundaryPoints(goog.global["Range"].START_TO_END, range2)
};
goog.dom.compareParentsDescendantNodeIe_ = function(textNode, node) {
  var parent = textNode.parentNode;
  if(parent == node) {
    return-1
  }
  var sibling = node;
  while(sibling.parentNode != parent) {
    sibling = sibling.parentNode
  }
  return goog.dom.compareSiblingOrder_(sibling, textNode)
};
goog.dom.compareSiblingOrder_ = function(node1, node2) {
  var s = node2;
  while(s = s.previousSibling) {
    if(s == node1) {
      return-1
    }
  }
  return 1
};
goog.dom.findCommonAncestor = function(var_args) {
  var i, count = arguments.length;
  if(!count) {
    return null
  }else {
    if(count == 1) {
      return arguments[0]
    }
  }
  var paths = [];
  var minLength = Infinity;
  for(i = 0;i < count;i++) {
    var ancestors = [];
    var node = arguments[i];
    while(node) {
      ancestors.unshift(node);
      node = node.parentNode
    }
    paths.push(ancestors);
    minLength = Math.min(minLength, ancestors.length)
  }
  var output = null;
  for(i = 0;i < minLength;i++) {
    var first = paths[0][i];
    for(var j = 1;j < count;j++) {
      if(first != paths[j][i]) {
        return output
      }
    }
    output = first
  }
  return output
};
goog.dom.getOwnerDocument = function(node) {
  return node.nodeType == goog.dom.NodeType.DOCUMENT ? node : node.ownerDocument || node.document
};
goog.dom.getFrameContentDocument = function(frame) {
  var doc = frame.contentDocument || frame.contentWindow.document;
  return doc
};
goog.dom.getFrameContentWindow = function(frame) {
  return frame.contentWindow || goog.dom.getWindow_(goog.dom.getFrameContentDocument(frame))
};
goog.dom.setTextContent = function(element, text) {
  if("textContent" in element) {
    element.textContent = text
  }else {
    if(element.firstChild && element.firstChild.nodeType == goog.dom.NodeType.TEXT) {
      while(element.lastChild != element.firstChild) {
        element.removeChild(element.lastChild)
      }
      element.firstChild.data = text
    }else {
      goog.dom.removeChildren(element);
      var doc = goog.dom.getOwnerDocument(element);
      element.appendChild(doc.createTextNode(text))
    }
  }
};
goog.dom.getOuterHtml = function(element) {
  if("outerHTML" in element) {
    return element.outerHTML
  }else {
    var doc = goog.dom.getOwnerDocument(element);
    var div = doc.createElement("div");
    div.appendChild(element.cloneNode(true));
    return div.innerHTML
  }
};
goog.dom.findNode = function(root, p) {
  var rv = [];
  var found = goog.dom.findNodes_(root, p, rv, true);
  return found ? rv[0] : undefined
};
goog.dom.findNodes = function(root, p) {
  var rv = [];
  goog.dom.findNodes_(root, p, rv, false);
  return rv
};
goog.dom.findNodes_ = function(root, p, rv, findOne) {
  if(root != null) {
    var child = root.firstChild;
    while(child) {
      if(p(child)) {
        rv.push(child);
        if(findOne) {
          return true
        }
      }
      if(goog.dom.findNodes_(child, p, rv, findOne)) {
        return true
      }
      child = child.nextSibling
    }
  }
  return false
};
goog.dom.TAGS_TO_IGNORE_ = {"SCRIPT":1, "STYLE":1, "HEAD":1, "IFRAME":1, "OBJECT":1};
goog.dom.PREDEFINED_TAG_VALUES_ = {"IMG":" ", "BR":"\n"};
goog.dom.isFocusableTabIndex = function(element) {
  var attrNode = element.getAttributeNode("tabindex");
  if(attrNode && attrNode.specified) {
    var index = element.tabIndex;
    return goog.isNumber(index) && index >= 0 && index < 32768
  }
  return false
};
goog.dom.setFocusableTabIndex = function(element, enable) {
  if(enable) {
    element.tabIndex = 0
  }else {
    element.tabIndex = -1;
    element.removeAttribute("tabIndex")
  }
};
goog.dom.getTextContent = function(node) {
  var textContent;
  if(goog.dom.BrowserFeature.CAN_USE_INNER_TEXT && "innerText" in node) {
    textContent = goog.string.canonicalizeNewlines(node.innerText)
  }else {
    var buf = [];
    goog.dom.getTextContent_(node, buf, true);
    textContent = buf.join("")
  }
  textContent = textContent.replace(/ \xAD /g, " ").replace(/\xAD/g, "");
  textContent = textContent.replace(/\u200B/g, "");
  if(!goog.dom.BrowserFeature.CAN_USE_INNER_TEXT) {
    textContent = textContent.replace(/ +/g, " ")
  }
  if(textContent != " ") {
    textContent = textContent.replace(/^\s*/, "")
  }
  return textContent
};
goog.dom.getRawTextContent = function(node) {
  var buf = [];
  goog.dom.getTextContent_(node, buf, false);
  return buf.join("")
};
goog.dom.getTextContent_ = function(node, buf, normalizeWhitespace) {
  if(node.nodeName in goog.dom.TAGS_TO_IGNORE_) {
  }else {
    if(node.nodeType == goog.dom.NodeType.TEXT) {
      if(normalizeWhitespace) {
        buf.push(String(node.nodeValue).replace(/(\r\n|\r|\n)/g, ""))
      }else {
        buf.push(node.nodeValue)
      }
    }else {
      if(node.nodeName in goog.dom.PREDEFINED_TAG_VALUES_) {
        buf.push(goog.dom.PREDEFINED_TAG_VALUES_[node.nodeName])
      }else {
        var child = node.firstChild;
        while(child) {
          goog.dom.getTextContent_(child, buf, normalizeWhitespace);
          child = child.nextSibling
        }
      }
    }
  }
};
goog.dom.getNodeTextLength = function(node) {
  return goog.dom.getTextContent(node).length
};
goog.dom.getNodeTextOffset = function(node, opt_offsetParent) {
  var root = opt_offsetParent || goog.dom.getOwnerDocument(node).body;
  var buf = [];
  while(node && node != root) {
    var cur = node;
    while(cur = cur.previousSibling) {
      buf.unshift(goog.dom.getTextContent(cur))
    }
    node = node.parentNode
  }
  return goog.string.trimLeft(buf.join("")).replace(/ +/g, " ").length
};
goog.dom.getNodeAtOffset = function(parent, offset, opt_result) {
  var stack = [parent], pos = 0, cur;
  while(stack.length > 0 && pos < offset) {
    cur = stack.pop();
    if(cur.nodeName in goog.dom.TAGS_TO_IGNORE_) {
    }else {
      if(cur.nodeType == goog.dom.NodeType.TEXT) {
        var text = cur.nodeValue.replace(/(\r\n|\r|\n)/g, "").replace(/ +/g, " ");
        pos += text.length
      }else {
        if(cur.nodeName in goog.dom.PREDEFINED_TAG_VALUES_) {
          pos += goog.dom.PREDEFINED_TAG_VALUES_[cur.nodeName].length
        }else {
          for(var i = cur.childNodes.length - 1;i >= 0;i--) {
            stack.push(cur.childNodes[i])
          }
        }
      }
    }
  }
  if(goog.isObject(opt_result)) {
    opt_result.remainder = cur ? cur.nodeValue.length + offset - pos - 1 : 0;
    opt_result.node = cur
  }
  return cur
};
goog.dom.isNodeList = function(val) {
  if(val && typeof val.length == "number") {
    if(goog.isObject(val)) {
      return typeof val.item == "function" || typeof val.item == "string"
    }else {
      if(goog.isFunction(val)) {
        return typeof val.item == "function"
      }
    }
  }
  return false
};
goog.dom.getAncestorByTagNameAndClass = function(element, opt_tag, opt_class) {
  var tagName = opt_tag ? opt_tag.toUpperCase() : null;
  return goog.dom.getAncestor(element, function(node) {
    return(!tagName || node.nodeName == tagName) && (!opt_class || goog.dom.classes.has(node, opt_class))
  }, true)
};
goog.dom.getAncestorByClass = function(element, opt_class) {
  return goog.dom.getAncestorByTagNameAndClass(element, null, opt_class)
};
goog.dom.getAncestor = function(element, matcher, opt_includeNode, opt_maxSearchSteps) {
  if(!opt_includeNode) {
    element = element.parentNode
  }
  var ignoreSearchSteps = opt_maxSearchSteps == null;
  var steps = 0;
  while(element && (ignoreSearchSteps || steps <= opt_maxSearchSteps)) {
    if(matcher(element)) {
      return element
    }
    element = element.parentNode;
    steps++
  }
  return null
};
goog.dom.getActiveElement = function(doc) {
  try {
    return doc && doc.activeElement
  }catch(e) {
  }
  return null
};
goog.dom.DomHelper = function(opt_document) {
  this.document_ = opt_document || goog.global.document || document
};
goog.dom.DomHelper.prototype.getDomHelper = goog.dom.getDomHelper;
goog.dom.DomHelper.prototype.setDocument = function(document) {
  this.document_ = document
};
goog.dom.DomHelper.prototype.getDocument = function() {
  return this.document_
};
goog.dom.DomHelper.prototype.getElement = function(element) {
  if(goog.isString(element)) {
    return this.document_.getElementById(element)
  }else {
    return element
  }
};
goog.dom.DomHelper.prototype.$ = goog.dom.DomHelper.prototype.getElement;
goog.dom.DomHelper.prototype.getElementsByTagNameAndClass = function(opt_tag, opt_class, opt_el) {
  return goog.dom.getElementsByTagNameAndClass_(this.document_, opt_tag, opt_class, opt_el)
};
goog.dom.DomHelper.prototype.getElementsByClass = function(className, opt_el) {
  var doc = opt_el || this.document_;
  return goog.dom.getElementsByClass(className, doc)
};
goog.dom.DomHelper.prototype.getElementByClass = function(className, opt_el) {
  var doc = opt_el || this.document_;
  return goog.dom.getElementByClass(className, doc)
};
goog.dom.DomHelper.prototype.$$ = goog.dom.DomHelper.prototype.getElementsByTagNameAndClass;
goog.dom.DomHelper.prototype.setProperties = goog.dom.setProperties;
goog.dom.DomHelper.prototype.getViewportSize = function(opt_window) {
  return goog.dom.getViewportSize(opt_window || this.getWindow())
};
goog.dom.DomHelper.prototype.getDocumentHeight = function() {
  return goog.dom.getDocumentHeight_(this.getWindow())
};
goog.dom.Appendable;
goog.dom.DomHelper.prototype.createDom = function(tagName, opt_attributes, var_args) {
  return goog.dom.createDom_(this.document_, arguments)
};
goog.dom.DomHelper.prototype.$dom = goog.dom.DomHelper.prototype.createDom;
goog.dom.DomHelper.prototype.createElement = function(name) {
  return this.document_.createElement(name)
};
goog.dom.DomHelper.prototype.createTextNode = function(content) {
  return this.document_.createTextNode(content)
};
goog.dom.DomHelper.prototype.createTable = function(rows, columns, opt_fillWithNbsp) {
  return goog.dom.createTable_(this.document_, rows, columns, !!opt_fillWithNbsp)
};
goog.dom.DomHelper.prototype.htmlToDocumentFragment = function(htmlString) {
  return goog.dom.htmlToDocumentFragment_(this.document_, htmlString)
};
goog.dom.DomHelper.prototype.getCompatMode = function() {
  return this.isCss1CompatMode() ? "CSS1Compat" : "BackCompat"
};
goog.dom.DomHelper.prototype.isCss1CompatMode = function() {
  return goog.dom.isCss1CompatMode_(this.document_)
};
goog.dom.DomHelper.prototype.getWindow = function() {
  return goog.dom.getWindow_(this.document_)
};
goog.dom.DomHelper.prototype.getDocumentScrollElement = function() {
  return goog.dom.getDocumentScrollElement_(this.document_)
};
goog.dom.DomHelper.prototype.getDocumentScroll = function() {
  return goog.dom.getDocumentScroll_(this.document_)
};
goog.dom.DomHelper.prototype.appendChild = goog.dom.appendChild;
goog.dom.DomHelper.prototype.append = goog.dom.append;
goog.dom.DomHelper.prototype.removeChildren = goog.dom.removeChildren;
goog.dom.DomHelper.prototype.insertSiblingBefore = goog.dom.insertSiblingBefore;
goog.dom.DomHelper.prototype.insertSiblingAfter = goog.dom.insertSiblingAfter;
goog.dom.DomHelper.prototype.removeNode = goog.dom.removeNode;
goog.dom.DomHelper.prototype.replaceNode = goog.dom.replaceNode;
goog.dom.DomHelper.prototype.flattenElement = goog.dom.flattenElement;
goog.dom.DomHelper.prototype.getFirstElementChild = goog.dom.getFirstElementChild;
goog.dom.DomHelper.prototype.getLastElementChild = goog.dom.getLastElementChild;
goog.dom.DomHelper.prototype.getNextElementSibling = goog.dom.getNextElementSibling;
goog.dom.DomHelper.prototype.getPreviousElementSibling = goog.dom.getPreviousElementSibling;
goog.dom.DomHelper.prototype.getNextNode = goog.dom.getNextNode;
goog.dom.DomHelper.prototype.getPreviousNode = goog.dom.getPreviousNode;
goog.dom.DomHelper.prototype.isNodeLike = goog.dom.isNodeLike;
goog.dom.DomHelper.prototype.contains = goog.dom.contains;
goog.dom.DomHelper.prototype.getOwnerDocument = goog.dom.getOwnerDocument;
goog.dom.DomHelper.prototype.getFrameContentDocument = goog.dom.getFrameContentDocument;
goog.dom.DomHelper.prototype.getFrameContentWindow = goog.dom.getFrameContentWindow;
goog.dom.DomHelper.prototype.setTextContent = goog.dom.setTextContent;
goog.dom.DomHelper.prototype.findNode = goog.dom.findNode;
goog.dom.DomHelper.prototype.findNodes = goog.dom.findNodes;
goog.dom.DomHelper.prototype.getTextContent = goog.dom.getTextContent;
goog.dom.DomHelper.prototype.getNodeTextLength = goog.dom.getNodeTextLength;
goog.dom.DomHelper.prototype.getNodeTextOffset = goog.dom.getNodeTextOffset;
goog.dom.DomHelper.prototype.getAncestorByTagNameAndClass = goog.dom.getAncestorByTagNameAndClass;
goog.dom.DomHelper.prototype.getAncestorByClass = goog.dom.getAncestorByClass;
goog.dom.DomHelper.prototype.getAncestor = goog.dom.getAncestor;
goog.provide("clojure.browser.dom");
goog.require("cljs.core");
goog.require("goog.object");
goog.require("goog.dom");
clojure.browser.dom.append = function() {
  var append__delegate = function(parent, children) {
    cljs.core.apply.call(null, goog.dom.append, parent, children);
    return parent
  };
  var append = function(parent, var_args) {
    var children = null;
    if(goog.isDef(var_args)) {
      children = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return append__delegate.call(this, parent, children)
  };
  append.cljs$lang$maxFixedArity = 1;
  append.cljs$lang$applyTo = function(arglist__69916) {
    var parent = cljs.core.first(arglist__69916);
    var children = cljs.core.rest(arglist__69916);
    return append__delegate(parent, children)
  };
  append.cljs$lang$arity$variadic = append__delegate;
  return append
}();
clojure.browser.dom.DOMBuilder = {};
clojure.browser.dom._element = function() {
  var _element = null;
  var _element__1 = function(this$) {
    if(function() {
      var and__3822__auto____69929 = this$;
      if(and__3822__auto____69929) {
        return this$.clojure$browser$dom$DOMBuilder$_element$arity$1
      }else {
        return and__3822__auto____69929
      }
    }()) {
      return this$.clojure$browser$dom$DOMBuilder$_element$arity$1(this$)
    }else {
      var x__2397__auto____69930 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____69931 = clojure.browser.dom._element[goog.typeOf(x__2397__auto____69930)];
        if(or__3824__auto____69931) {
          return or__3824__auto____69931
        }else {
          var or__3824__auto____69932 = clojure.browser.dom._element["_"];
          if(or__3824__auto____69932) {
            return or__3824__auto____69932
          }else {
            throw cljs.core.missing_protocol.call(null, "DOMBuilder.-element", this$);
          }
        }
      }().call(null, this$)
    }
  };
  var _element__2 = function(this$, attrs_or_children) {
    if(function() {
      var and__3822__auto____69933 = this$;
      if(and__3822__auto____69933) {
        return this$.clojure$browser$dom$DOMBuilder$_element$arity$2
      }else {
        return and__3822__auto____69933
      }
    }()) {
      return this$.clojure$browser$dom$DOMBuilder$_element$arity$2(this$, attrs_or_children)
    }else {
      var x__2397__auto____69934 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____69935 = clojure.browser.dom._element[goog.typeOf(x__2397__auto____69934)];
        if(or__3824__auto____69935) {
          return or__3824__auto____69935
        }else {
          var or__3824__auto____69936 = clojure.browser.dom._element["_"];
          if(or__3824__auto____69936) {
            return or__3824__auto____69936
          }else {
            throw cljs.core.missing_protocol.call(null, "DOMBuilder.-element", this$);
          }
        }
      }().call(null, this$, attrs_or_children)
    }
  };
  var _element__3 = function(this$, attrs, children) {
    if(function() {
      var and__3822__auto____69937 = this$;
      if(and__3822__auto____69937) {
        return this$.clojure$browser$dom$DOMBuilder$_element$arity$3
      }else {
        return and__3822__auto____69937
      }
    }()) {
      return this$.clojure$browser$dom$DOMBuilder$_element$arity$3(this$, attrs, children)
    }else {
      var x__2397__auto____69938 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____69939 = clojure.browser.dom._element[goog.typeOf(x__2397__auto____69938)];
        if(or__3824__auto____69939) {
          return or__3824__auto____69939
        }else {
          var or__3824__auto____69940 = clojure.browser.dom._element["_"];
          if(or__3824__auto____69940) {
            return or__3824__auto____69940
          }else {
            throw cljs.core.missing_protocol.call(null, "DOMBuilder.-element", this$);
          }
        }
      }().call(null, this$, attrs, children)
    }
  };
  _element = function(this$, attrs, children) {
    switch(arguments.length) {
      case 1:
        return _element__1.call(this, this$);
      case 2:
        return _element__2.call(this, this$, attrs);
      case 3:
        return _element__3.call(this, this$, attrs, children)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _element.cljs$lang$arity$1 = _element__1;
  _element.cljs$lang$arity$2 = _element__2;
  _element.cljs$lang$arity$3 = _element__3;
  return _element
}();
clojure.browser.dom.log = function() {
  var log__delegate = function(args) {
    return console.log(cljs.core.apply.call(null, cljs.core.pr_str, args))
  };
  var log = function(var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return log__delegate.call(this, args)
  };
  log.cljs$lang$maxFixedArity = 0;
  log.cljs$lang$applyTo = function(arglist__69941) {
    var args = cljs.core.seq(arglist__69941);
    return log__delegate(args)
  };
  log.cljs$lang$arity$variadic = log__delegate;
  return log
}();
clojure.browser.dom.log_obj = function log_obj(obj) {
  return console.log(obj)
};
Element.prototype.clojure$browser$dom$DOMBuilder$ = true;
Element.prototype.clojure$browser$dom$DOMBuilder$_element$arity$1 = function(this$) {
  clojure.browser.dom.log.call(null, "js/Element (-element ", this$, ")");
  return this$
};
cljs.core.PersistentVector.prototype.clojure$browser$dom$DOMBuilder$ = true;
cljs.core.PersistentVector.prototype.clojure$browser$dom$DOMBuilder$_element$arity$1 = function(this$) {
  clojure.browser.dom.log.call(null, "PersistentVector (-element ", this$, ")");
  var tag__69942 = cljs.core.first.call(null, this$);
  var attrs__69943 = cljs.core.second.call(null, this$);
  var children__69944 = cljs.core.drop.call(null, 2, this$);
  if(cljs.core.map_QMARK_.call(null, attrs__69943)) {
    return clojure.browser.dom._element.call(null, tag__69942, attrs__69943, children__69944)
  }else {
    return clojure.browser.dom._element.call(null, tag__69942, null, cljs.core.rest.call(null, this$))
  }
};
clojure.browser.dom.DOMBuilder["string"] = true;
clojure.browser.dom._element["string"] = function() {
  var G__69957 = null;
  var G__69957__1 = function(this$) {
    clojure.browser.dom.log.call(null, "string (-element ", this$, ")");
    if(cljs.core.keyword_QMARK_.call(null, this$)) {
      return goog.dom.createElement(cljs.core.name.call(null, this$))
    }else {
      if("\ufdd0'else") {
        return goog.dom.createTextNode(cljs.core.name.call(null, this$))
      }else {
        return null
      }
    }
  };
  var G__69957__2 = function(this$, attrs_or_children) {
    clojure.browser.dom.log.call(null, "string (-element ", this$, " ", attrs_or_children, ")");
    var attrs__69945 = cljs.core.first.call(null, attrs_or_children);
    if(cljs.core.map_QMARK_.call(null, attrs__69945)) {
      return clojure.browser.dom._element.call(null, this$, attrs__69945, cljs.core.rest.call(null, attrs_or_children))
    }else {
      return clojure.browser.dom._element.call(null, this$, null, attrs_or_children)
    }
  };
  var G__69957__3 = function(this$, attrs, children) {
    clojure.browser.dom.log.call(null, "string (-element ", this$, " ", attrs, " ", children, ")");
    var str_attrs__69956 = cljs.core.truth_(function() {
      var and__3822__auto____69946 = cljs.core.map_QMARK_.call(null, attrs);
      if(and__3822__auto____69946) {
        return cljs.core.seq.call(null, attrs)
      }else {
        return and__3822__auto____69946
      }
    }()) ? cljs.core.reduce.call(null, function(o, p__69947) {
      var vec__69948__69949 = p__69947;
      var k__69950 = cljs.core.nth.call(null, vec__69948__69949, 0, null);
      var v__69951 = cljs.core.nth.call(null, vec__69948__69949, 1, null);
      var o__69952 = o == null ? {} : o;
      clojure.browser.dom.log.call(null, "o = ", o__69952);
      clojure.browser.dom.log.call(null, "k = ", k__69950);
      clojure.browser.dom.log.call(null, "v = ", v__69951);
      if(function() {
        var or__3824__auto____69953 = cljs.core.keyword_QMARK_.call(null, k__69950);
        if(or__3824__auto____69953) {
          return or__3824__auto____69953
        }else {
          return cljs.core.string_QMARK_.call(null, k__69950)
        }
      }()) {
        var G__69954__69955 = o__69952;
        G__69954__69955[cljs.core.name.call(null, k__69950)] = v__69951;
        return G__69954__69955
      }else {
        return null
      }
    }, {}, attrs) : null;
    clojure.browser.dom.log_obj.call(null, str_attrs__69956);
    if(cljs.core.seq.call(null, children)) {
      return cljs.core.apply.call(null, goog.dom.createDom, cljs.core.name.call(null, this$), str_attrs__69956, cljs.core.map.call(null, clojure.browser.dom._element, children))
    }else {
      return goog.dom.createDom(cljs.core.name.call(null, this$), str_attrs__69956)
    }
  };
  G__69957 = function(this$, attrs, children) {
    switch(arguments.length) {
      case 1:
        return G__69957__1.call(this, this$);
      case 2:
        return G__69957__2.call(this, this$, attrs);
      case 3:
        return G__69957__3.call(this, this$, attrs, children)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__69957
}();
clojure.browser.dom.element = function() {
  var element = null;
  var element__1 = function(tag_or_text) {
    clojure.browser.dom.log.call(null, "(element ", tag_or_text, ")");
    return clojure.browser.dom._element.call(null, tag_or_text)
  };
  var element__2 = function() {
    var G__69960__delegate = function(tag, children) {
      clojure.browser.dom.log.call(null, "(element ", tag, " ", children, ")");
      var attrs__69959 = cljs.core.first.call(null, children);
      if(cljs.core.map_QMARK_.call(null, attrs__69959)) {
        return clojure.browser.dom._element.call(null, tag, attrs__69959, cljs.core.rest.call(null, children))
      }else {
        return clojure.browser.dom._element.call(null, tag, null, children)
      }
    };
    var G__69960 = function(tag, var_args) {
      var children = null;
      if(goog.isDef(var_args)) {
        children = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__69960__delegate.call(this, tag, children)
    };
    G__69960.cljs$lang$maxFixedArity = 1;
    G__69960.cljs$lang$applyTo = function(arglist__69961) {
      var tag = cljs.core.first(arglist__69961);
      var children = cljs.core.rest(arglist__69961);
      return G__69960__delegate(tag, children)
    };
    G__69960.cljs$lang$arity$variadic = G__69960__delegate;
    return G__69960
  }();
  element = function(tag, var_args) {
    var children = var_args;
    switch(arguments.length) {
      case 1:
        return element__1.call(this, tag);
      default:
        return element__2.cljs$lang$arity$variadic(tag, cljs.core.array_seq(arguments, 1))
    }
    throw"Invalid arity: " + arguments.length;
  };
  element.cljs$lang$maxFixedArity = 1;
  element.cljs$lang$applyTo = element__2.cljs$lang$applyTo;
  element.cljs$lang$arity$1 = element__1;
  element.cljs$lang$arity$variadic = element__2.cljs$lang$arity$variadic;
  return element
}();
clojure.browser.dom.remove_children = function remove_children(id) {
  var parent__69963 = goog.dom.getElement(cljs.core.name.call(null, id));
  return goog.dom.removeChildren(parent__69963)
};
clojure.browser.dom.get_element = function get_element(id) {
  return goog.dom.getElement(cljs.core.name.call(null, id))
};
clojure.browser.dom.html__GT_dom = function html__GT_dom(s) {
  return goog.dom.htmlToDocumentFragment(s)
};
clojure.browser.dom.insert_at = function insert_at(parent, child, index) {
  return goog.dom.insertChildAt(parent, child, index)
};
clojure.browser.dom.ensure_element = function ensure_element(e) {
  if(cljs.core.keyword_QMARK_.call(null, e)) {
    return clojure.browser.dom.get_element.call(null, e)
  }else {
    if(cljs.core.string_QMARK_.call(null, e)) {
      return clojure.browser.dom.html__GT_dom.call(null, e)
    }else {
      if("\ufdd0'else") {
        return e
      }else {
        return null
      }
    }
  }
};
clojure.browser.dom.replace_node = function replace_node(old_node, new_node) {
  var old_node__69966 = clojure.browser.dom.ensure_element.call(null, old_node);
  var new_node__69967 = clojure.browser.dom.ensure_element.call(null, new_node);
  goog.dom.replaceNode(new_node__69967, old_node__69966);
  return new_node__69967
};
clojure.browser.dom.set_text = function set_text(e, s) {
  return goog.dom.setTextContent(clojure.browser.dom.ensure_element.call(null, e), s)
};
clojure.browser.dom.get_value = function get_value(e) {
  return clojure.browser.dom.ensure_element.call(null, e).value
};
clojure.browser.dom.set_properties = function set_properties(e, m) {
  return goog.dom.setProperties(clojure.browser.dom.ensure_element.call(null, e), cljs.core.apply.call(null, goog.object.create, cljs.core.interleave.call(null, cljs.core.keys.call(null, m), cljs.core.vals.call(null, m))))
};
clojure.browser.dom.set_value = function set_value(e, v) {
  return clojure.browser.dom.set_properties.call(null, e, cljs.core.ObjMap.fromObject(["value"], {"value":v}))
};
clojure.browser.dom.click_element = function click_element(e) {
  return clojure.browser.dom.ensure_element.call(null, e).click(cljs.core.List.EMPTY)
};
goog.provide("clojure.string");
goog.require("cljs.core");
goog.require("goog.string.StringBuffer");
goog.require("goog.string");
clojure.string.seq_reverse = function seq_reverse(coll) {
  return cljs.core.reduce.call(null, cljs.core.conj, cljs.core.List.EMPTY, coll)
};
clojure.string.reverse = function reverse(s) {
  return s.split("").reverse().join("")
};
clojure.string.replace = function replace(s, match, replacement) {
  if(cljs.core.string_QMARK_.call(null, match)) {
    return s.replace(new RegExp(goog.string.regExpEscape(match), "g"), replacement)
  }else {
    if(cljs.core.truth_(match.hasOwnProperty("source"))) {
      return s.replace(new RegExp(match.source, "g"), replacement)
    }else {
      if("\ufdd0'else") {
        throw[cljs.core.str("Invalid match arg: "), cljs.core.str(match)].join("");
      }else {
        return null
      }
    }
  }
};
clojure.string.replace_first = function replace_first(s, match, replacement) {
  return s.replace(match, replacement)
};
clojure.string.join = function() {
  var join = null;
  var join__1 = function(coll) {
    return cljs.core.apply.call(null, cljs.core.str, coll)
  };
  var join__2 = function(separator, coll) {
    return cljs.core.apply.call(null, cljs.core.str, cljs.core.interpose.call(null, separator, coll))
  };
  join = function(separator, coll) {
    switch(arguments.length) {
      case 1:
        return join__1.call(this, separator);
      case 2:
        return join__2.call(this, separator, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  join.cljs$lang$arity$1 = join__1;
  join.cljs$lang$arity$2 = join__2;
  return join
}();
clojure.string.upper_case = function upper_case(s) {
  return s.toUpperCase()
};
clojure.string.lower_case = function lower_case(s) {
  return s.toLowerCase()
};
clojure.string.capitalize = function capitalize(s) {
  if(cljs.core.count.call(null, s) < 2) {
    return clojure.string.upper_case.call(null, s)
  }else {
    return[cljs.core.str(clojure.string.upper_case.call(null, cljs.core.subs.call(null, s, 0, 1))), cljs.core.str(clojure.string.lower_case.call(null, cljs.core.subs.call(null, s, 1)))].join("")
  }
};
clojure.string.split = function() {
  var split = null;
  var split__2 = function(s, re) {
    return cljs.core.vec.call(null, [cljs.core.str(s)].join("").split(re))
  };
  var split__3 = function(s, re, limit) {
    if(limit < 1) {
      return cljs.core.vec.call(null, [cljs.core.str(s)].join("").split(re))
    }else {
      var s__69974 = s;
      var limit__69975 = limit;
      var parts__69976 = cljs.core.PersistentVector.EMPTY;
      while(true) {
        if(cljs.core._EQ_.call(null, limit__69975, 1)) {
          return cljs.core.conj.call(null, parts__69976, s__69974)
        }else {
          var temp__3971__auto____69977 = cljs.core.re_find.call(null, re, s__69974);
          if(cljs.core.truth_(temp__3971__auto____69977)) {
            var m__69978 = temp__3971__auto____69977;
            var index__69979 = s__69974.indexOf(m__69978);
            var G__69980 = s__69974.substring(index__69979 + cljs.core.count.call(null, m__69978));
            var G__69981 = limit__69975 - 1;
            var G__69982 = cljs.core.conj.call(null, parts__69976, s__69974.substring(0, index__69979));
            s__69974 = G__69980;
            limit__69975 = G__69981;
            parts__69976 = G__69982;
            continue
          }else {
            return cljs.core.conj.call(null, parts__69976, s__69974)
          }
        }
        break
      }
    }
  };
  split = function(s, re, limit) {
    switch(arguments.length) {
      case 2:
        return split__2.call(this, s, re);
      case 3:
        return split__3.call(this, s, re, limit)
    }
    throw"Invalid arity: " + arguments.length;
  };
  split.cljs$lang$arity$2 = split__2;
  split.cljs$lang$arity$3 = split__3;
  return split
}();
clojure.string.split_lines = function split_lines(s) {
  return clojure.string.split.call(null, s, /\n|\r\n/)
};
clojure.string.trim = function trim(s) {
  return goog.string.trim(s)
};
clojure.string.triml = function triml(s) {
  return goog.string.trimLeft(s)
};
clojure.string.trimr = function trimr(s) {
  return goog.string.trimRight(s)
};
clojure.string.trim_newline = function trim_newline(s) {
  var index__69986 = s.length;
  while(true) {
    if(index__69986 === 0) {
      return""
    }else {
      var ch__69987 = cljs.core._lookup.call(null, s, index__69986 - 1, null);
      if(function() {
        var or__3824__auto____69988 = cljs.core._EQ_.call(null, ch__69987, "\n");
        if(or__3824__auto____69988) {
          return or__3824__auto____69988
        }else {
          return cljs.core._EQ_.call(null, ch__69987, "\r")
        }
      }()) {
        var G__69989 = index__69986 - 1;
        index__69986 = G__69989;
        continue
      }else {
        return s.substring(0, index__69986)
      }
    }
    break
  }
};
clojure.string.blank_QMARK_ = function blank_QMARK_(s) {
  var s__69993 = [cljs.core.str(s)].join("");
  if(cljs.core.truth_(function() {
    var or__3824__auto____69994 = cljs.core.not.call(null, s__69993);
    if(or__3824__auto____69994) {
      return or__3824__auto____69994
    }else {
      var or__3824__auto____69995 = cljs.core._EQ_.call(null, "", s__69993);
      if(or__3824__auto____69995) {
        return or__3824__auto____69995
      }else {
        return cljs.core.re_matches.call(null, /\s+/, s__69993)
      }
    }
  }())) {
    return true
  }else {
    return false
  }
};
clojure.string.escape = function escape(s, cmap) {
  var buffer__70002 = new goog.string.StringBuffer;
  var length__70003 = s.length;
  var index__70004 = 0;
  while(true) {
    if(cljs.core._EQ_.call(null, length__70003, index__70004)) {
      return buffer__70002.toString()
    }else {
      var ch__70005 = s.charAt(index__70004);
      var temp__3971__auto____70006 = cljs.core._lookup.call(null, cmap, ch__70005, null);
      if(cljs.core.truth_(temp__3971__auto____70006)) {
        var replacement__70007 = temp__3971__auto____70006;
        buffer__70002.append([cljs.core.str(replacement__70007)].join(""))
      }else {
        buffer__70002.append(ch__70005)
      }
      var G__70008 = index__70004 + 1;
      index__70004 = G__70008;
      continue
    }
    break
  }
};
goog.provide("onedit");
goog.require("cljs.core");
goog.require("onedit.core");
goog.require("goog.events.EventType");
goog.require("goog.dom");
goog.require("clojure.browser.event");
goog.require("clojure.browser.dom");
goog.require("clojure.string");
onedit.Editor = function(buffer, cursor, __meta, __extmap) {
  this.buffer = buffer;
  this.cursor = cursor;
  this.__meta = __meta;
  this.__extmap = __extmap;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 619054858;
  if(arguments.length > 2) {
    this.__meta = __meta;
    this.__extmap = __extmap
  }else {
    this.__meta = null;
    this.__extmap = null
  }
};
onedit.Editor.prototype.cljs$core$IHash$_hash$arity$1 = function(this__2357__auto__) {
  var this__13977 = this;
  var h__2231__auto____13978 = this__13977.__hash;
  if(!(h__2231__auto____13978 == null)) {
    return h__2231__auto____13978
  }else {
    var h__2231__auto____13979 = cljs.core.hash_imap.call(null, this__2357__auto__);
    this__13977.__hash = h__2231__auto____13979;
    return h__2231__auto____13979
  }
};
onedit.Editor.prototype.cljs$core$ILookup$_lookup$arity$2 = function(this__2362__auto__, k__2363__auto__) {
  var this__13980 = this;
  return this__2362__auto__.cljs$core$ILookup$_lookup$arity$3(this__2362__auto__, k__2363__auto__, null)
};
onedit.Editor.prototype.cljs$core$ILookup$_lookup$arity$3 = function(this__2364__auto__, k13975, else__2365__auto__) {
  var this__13981 = this;
  if(k13975 === "\ufdd0'buffer") {
    return this__13981.buffer
  }else {
    if(k13975 === "\ufdd0'cursor") {
      return this__13981.cursor
    }else {
      if("\ufdd0'else") {
        return cljs.core._lookup.call(null, this__13981.__extmap, k13975, else__2365__auto__)
      }else {
        return null
      }
    }
  }
};
onedit.Editor.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(this__2369__auto__, k__2370__auto__, G__13974) {
  var this__13982 = this;
  var pred__13983__13986 = cljs.core.identical_QMARK_;
  var expr__13984__13987 = k__2370__auto__;
  if(pred__13983__13986.call(null, "\ufdd0'buffer", expr__13984__13987)) {
    return new onedit.Editor(G__13974, this__13982.cursor, this__13982.__meta, this__13982.__extmap, null)
  }else {
    if(pred__13983__13986.call(null, "\ufdd0'cursor", expr__13984__13987)) {
      return new onedit.Editor(this__13982.buffer, G__13974, this__13982.__meta, this__13982.__extmap, null)
    }else {
      return new onedit.Editor(this__13982.buffer, this__13982.cursor, this__13982.__meta, cljs.core.assoc.call(null, this__13982.__extmap, k__2370__auto__, G__13974), null)
    }
  }
};
onedit.Editor.prototype.cljs$core$ICollection$_conj$arity$2 = function(this__2367__auto__, entry__2368__auto__) {
  var this__13988 = this;
  if(cljs.core.vector_QMARK_.call(null, entry__2368__auto__)) {
    return this__2367__auto__.cljs$core$IAssociative$_assoc$arity$3(this__2367__auto__, cljs.core._nth.call(null, entry__2368__auto__, 0), cljs.core._nth.call(null, entry__2368__auto__, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, this__2367__auto__, entry__2368__auto__)
  }
};
onedit.Editor.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this__2374__auto__) {
  var this__13989 = this;
  return cljs.core.seq.call(null, cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray([cljs.core.vector.call(null, "\ufdd0'buffer", this__13989.buffer), cljs.core.vector.call(null, "\ufdd0'cursor", this__13989.cursor)], true), this__13989.__extmap))
};
onedit.Editor.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(this__2376__auto__, opts__2377__auto__) {
  var this__13990 = this;
  var pr_pair__2378__auto____13991 = function(keyval__2379__auto__) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts__2377__auto__, keyval__2379__auto__)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__2378__auto____13991, [cljs.core.str("#"), cljs.core.str("Editor"), cljs.core.str("{")].join(""), ", ", "}", opts__2377__auto__, cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray([cljs.core.vector.call(null, "\ufdd0'buffer", this__13990.buffer), cljs.core.vector.call(null, "\ufdd0'cursor", this__13990.cursor)], true), this__13990.__extmap))
};
onedit.Editor.prototype.cljs$core$ICounted$_count$arity$1 = function(this__2366__auto__) {
  var this__13992 = this;
  return 2 + cljs.core.count.call(null, this__13992.__extmap)
};
onedit.Editor.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(this__2358__auto__, other__2359__auto__) {
  var this__13993 = this;
  if(cljs.core.truth_(function() {
    var and__3822__auto____13994 = other__2359__auto__;
    if(cljs.core.truth_(and__3822__auto____13994)) {
      var and__3822__auto____13995 = this__2358__auto__.constructor === other__2359__auto__.constructor;
      if(and__3822__auto____13995) {
        return cljs.core.equiv_map.call(null, this__2358__auto__, other__2359__auto__)
      }else {
        return and__3822__auto____13995
      }
    }else {
      return and__3822__auto____13994
    }
  }())) {
    return true
  }else {
    return false
  }
};
onedit.Editor.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(this__2361__auto__, G__13974) {
  var this__13996 = this;
  return new onedit.Editor(this__13996.buffer, this__13996.cursor, G__13974, this__13996.__extmap, this__13996.__hash)
};
onedit.Editor.prototype.cljs$core$IMeta$_meta$arity$1 = function(this__2360__auto__) {
  var this__13997 = this;
  return this__13997.__meta
};
onedit.Editor.prototype.cljs$core$IMap$_dissoc$arity$2 = function(this__2371__auto__, k__2372__auto__) {
  var this__13998 = this;
  if(cljs.core.contains_QMARK_.call(null, cljs.core.PersistentHashSet.fromArray(["\ufdd0'buffer", "\ufdd0'cursor"]), k__2372__auto__)) {
    return cljs.core.dissoc.call(null, cljs.core.with_meta.call(null, cljs.core.into.call(null, cljs.core.ObjMap.EMPTY, this__2371__auto__), this__13998.__meta), k__2372__auto__)
  }else {
    return new onedit.Editor(this__13998.buffer, this__13998.cursor, this__13998.__meta, cljs.core.not_empty.call(null, cljs.core.dissoc.call(null, this__13998.__extmap, k__2372__auto__)), null)
  }
};
onedit.Editor.cljs$lang$type = true;
onedit.Editor.cljs$lang$ctorPrSeq = function(this__2396__auto__) {
  return cljs.core.list.call(null, "onedit/Editor")
};
onedit.__GT_Editor = function __GT_Editor(buffer, cursor) {
  return new onedit.Editor(buffer, cursor)
};
onedit.map__GT_Editor = function map__GT_Editor(G__13976) {
  return new onedit.Editor((new cljs.core.Keyword("\ufdd0'buffer")).call(null, G__13976), (new cljs.core.Keyword("\ufdd0'cursor")).call(null, G__13976), null, cljs.core.dissoc.call(null, G__13976, "\ufdd0'buffer", "\ufdd0'cursor"))
};
onedit.Editor;
onedit.editor = function editor() {
  var buffer__14000 = goog.dom.getRawTextContent(clojure.browser.dom.ensure_element.call(null, "\ufdd0'buffer"));
  return new onedit.Editor(buffer__14000, 0)
};
onedit.open = function open(file) {
  var reader__14002 = new FileReader;
  return reader__14002.readAsText(file)
};
onedit.save = function save() {
  return null
};
onedit.core.editor[[cljs.core.str("\ufdd1'insert")].join("")] = function(string, editor) {
  var buffer__14003 = clojure.string.join.call(null, cljs.core.split_at.call(null, (new cljs.core.Keyword("\ufdd0'cursor")).call(null, editor), (new cljs.core.Keyword("\ufdd0'buffer")).call(null, editor)));
  return cljs.core.assoc.call(null, editor, "\ufdd0'buffer", buffer__14003)
};
onedit.exec = function exec(event) {
  var value__14011 = clojure.browser.dom.get_value.call(null, "\ufdd0'minibuffer");
  var vec__14010__14012 = clojure.string.split.call(null, value__14011, / /);
  var f__14013 = cljs.core.nth.call(null, vec__14010__14012, 0, null);
  var args__14014 = cljs.core.nthnext.call(null, vec__14010__14012, 1);
  var editor__14015 = cljs.core.apply.call(null, onedit.core.editor[f__14013], args__14014);
  return clojure.browser.dom.set_text.call(null, "\ufdd0'buffer", (new cljs.core.Keyword("\ufdd0'buffer")).call(null, editor__14015))
};
onedit.main = function main() {
  var buffer__14018 = clojure.browser.dom.ensure_element.call(null, "\ufdd0'buffer");
  var minibuffer__14019 = clojure.browser.dom.ensure_element.call(null, "\ufdd0'minibuffer");
  return clojure.browser.event.listen.call(null, minibuffer__14019, goog.events.EventType.CHANGE, onedit.exec)
};
