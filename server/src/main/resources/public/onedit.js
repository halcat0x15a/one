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
  var x__6132 = x == null ? null : x;
  if(p[goog.typeOf(x__6132)]) {
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
    var G__6133__delegate = function(array, i, idxs) {
      return cljs.core.apply.call(null, aget, aget.call(null, array, i), idxs)
    };
    var G__6133 = function(array, i, var_args) {
      var idxs = null;
      if(goog.isDef(var_args)) {
        idxs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__6133__delegate.call(this, array, i, idxs)
    };
    G__6133.cljs$lang$maxFixedArity = 2;
    G__6133.cljs$lang$applyTo = function(arglist__6134) {
      var array = cljs.core.first(arglist__6134);
      var i = cljs.core.first(cljs.core.next(arglist__6134));
      var idxs = cljs.core.rest(cljs.core.next(arglist__6134));
      return G__6133__delegate(array, i, idxs)
    };
    G__6133.cljs$lang$arity$variadic = G__6133__delegate;
    return G__6133
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
      var and__3822__auto____6219 = this$;
      if(and__3822__auto____6219) {
        return this$.cljs$core$IFn$_invoke$arity$1
      }else {
        return and__3822__auto____6219
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$1(this$)
    }else {
      var x__2391__auto____6220 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6221 = cljs.core._invoke[goog.typeOf(x__2391__auto____6220)];
        if(or__3824__auto____6221) {
          return or__3824__auto____6221
        }else {
          var or__3824__auto____6222 = cljs.core._invoke["_"];
          if(or__3824__auto____6222) {
            return or__3824__auto____6222
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$)
    }
  };
  var _invoke__2 = function(this$, a) {
    if(function() {
      var and__3822__auto____6223 = this$;
      if(and__3822__auto____6223) {
        return this$.cljs$core$IFn$_invoke$arity$2
      }else {
        return and__3822__auto____6223
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$2(this$, a)
    }else {
      var x__2391__auto____6224 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6225 = cljs.core._invoke[goog.typeOf(x__2391__auto____6224)];
        if(or__3824__auto____6225) {
          return or__3824__auto____6225
        }else {
          var or__3824__auto____6226 = cljs.core._invoke["_"];
          if(or__3824__auto____6226) {
            return or__3824__auto____6226
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a)
    }
  };
  var _invoke__3 = function(this$, a, b) {
    if(function() {
      var and__3822__auto____6227 = this$;
      if(and__3822__auto____6227) {
        return this$.cljs$core$IFn$_invoke$arity$3
      }else {
        return and__3822__auto____6227
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$3(this$, a, b)
    }else {
      var x__2391__auto____6228 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6229 = cljs.core._invoke[goog.typeOf(x__2391__auto____6228)];
        if(or__3824__auto____6229) {
          return or__3824__auto____6229
        }else {
          var or__3824__auto____6230 = cljs.core._invoke["_"];
          if(or__3824__auto____6230) {
            return or__3824__auto____6230
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b)
    }
  };
  var _invoke__4 = function(this$, a, b, c) {
    if(function() {
      var and__3822__auto____6231 = this$;
      if(and__3822__auto____6231) {
        return this$.cljs$core$IFn$_invoke$arity$4
      }else {
        return and__3822__auto____6231
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$4(this$, a, b, c)
    }else {
      var x__2391__auto____6232 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6233 = cljs.core._invoke[goog.typeOf(x__2391__auto____6232)];
        if(or__3824__auto____6233) {
          return or__3824__auto____6233
        }else {
          var or__3824__auto____6234 = cljs.core._invoke["_"];
          if(or__3824__auto____6234) {
            return or__3824__auto____6234
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c)
    }
  };
  var _invoke__5 = function(this$, a, b, c, d) {
    if(function() {
      var and__3822__auto____6235 = this$;
      if(and__3822__auto____6235) {
        return this$.cljs$core$IFn$_invoke$arity$5
      }else {
        return and__3822__auto____6235
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$5(this$, a, b, c, d)
    }else {
      var x__2391__auto____6236 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6237 = cljs.core._invoke[goog.typeOf(x__2391__auto____6236)];
        if(or__3824__auto____6237) {
          return or__3824__auto____6237
        }else {
          var or__3824__auto____6238 = cljs.core._invoke["_"];
          if(or__3824__auto____6238) {
            return or__3824__auto____6238
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d)
    }
  };
  var _invoke__6 = function(this$, a, b, c, d, e) {
    if(function() {
      var and__3822__auto____6239 = this$;
      if(and__3822__auto____6239) {
        return this$.cljs$core$IFn$_invoke$arity$6
      }else {
        return and__3822__auto____6239
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$6(this$, a, b, c, d, e)
    }else {
      var x__2391__auto____6240 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6241 = cljs.core._invoke[goog.typeOf(x__2391__auto____6240)];
        if(or__3824__auto____6241) {
          return or__3824__auto____6241
        }else {
          var or__3824__auto____6242 = cljs.core._invoke["_"];
          if(or__3824__auto____6242) {
            return or__3824__auto____6242
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e)
    }
  };
  var _invoke__7 = function(this$, a, b, c, d, e, f) {
    if(function() {
      var and__3822__auto____6243 = this$;
      if(and__3822__auto____6243) {
        return this$.cljs$core$IFn$_invoke$arity$7
      }else {
        return and__3822__auto____6243
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$7(this$, a, b, c, d, e, f)
    }else {
      var x__2391__auto____6244 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6245 = cljs.core._invoke[goog.typeOf(x__2391__auto____6244)];
        if(or__3824__auto____6245) {
          return or__3824__auto____6245
        }else {
          var or__3824__auto____6246 = cljs.core._invoke["_"];
          if(or__3824__auto____6246) {
            return or__3824__auto____6246
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f)
    }
  };
  var _invoke__8 = function(this$, a, b, c, d, e, f, g) {
    if(function() {
      var and__3822__auto____6247 = this$;
      if(and__3822__auto____6247) {
        return this$.cljs$core$IFn$_invoke$arity$8
      }else {
        return and__3822__auto____6247
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$8(this$, a, b, c, d, e, f, g)
    }else {
      var x__2391__auto____6248 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6249 = cljs.core._invoke[goog.typeOf(x__2391__auto____6248)];
        if(or__3824__auto____6249) {
          return or__3824__auto____6249
        }else {
          var or__3824__auto____6250 = cljs.core._invoke["_"];
          if(or__3824__auto____6250) {
            return or__3824__auto____6250
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g)
    }
  };
  var _invoke__9 = function(this$, a, b, c, d, e, f, g, h) {
    if(function() {
      var and__3822__auto____6251 = this$;
      if(and__3822__auto____6251) {
        return this$.cljs$core$IFn$_invoke$arity$9
      }else {
        return and__3822__auto____6251
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$9(this$, a, b, c, d, e, f, g, h)
    }else {
      var x__2391__auto____6252 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6253 = cljs.core._invoke[goog.typeOf(x__2391__auto____6252)];
        if(or__3824__auto____6253) {
          return or__3824__auto____6253
        }else {
          var or__3824__auto____6254 = cljs.core._invoke["_"];
          if(or__3824__auto____6254) {
            return or__3824__auto____6254
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h)
    }
  };
  var _invoke__10 = function(this$, a, b, c, d, e, f, g, h, i) {
    if(function() {
      var and__3822__auto____6255 = this$;
      if(and__3822__auto____6255) {
        return this$.cljs$core$IFn$_invoke$arity$10
      }else {
        return and__3822__auto____6255
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$10(this$, a, b, c, d, e, f, g, h, i)
    }else {
      var x__2391__auto____6256 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6257 = cljs.core._invoke[goog.typeOf(x__2391__auto____6256)];
        if(or__3824__auto____6257) {
          return or__3824__auto____6257
        }else {
          var or__3824__auto____6258 = cljs.core._invoke["_"];
          if(or__3824__auto____6258) {
            return or__3824__auto____6258
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i)
    }
  };
  var _invoke__11 = function(this$, a, b, c, d, e, f, g, h, i, j) {
    if(function() {
      var and__3822__auto____6259 = this$;
      if(and__3822__auto____6259) {
        return this$.cljs$core$IFn$_invoke$arity$11
      }else {
        return and__3822__auto____6259
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$11(this$, a, b, c, d, e, f, g, h, i, j)
    }else {
      var x__2391__auto____6260 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6261 = cljs.core._invoke[goog.typeOf(x__2391__auto____6260)];
        if(or__3824__auto____6261) {
          return or__3824__auto____6261
        }else {
          var or__3824__auto____6262 = cljs.core._invoke["_"];
          if(or__3824__auto____6262) {
            return or__3824__auto____6262
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j)
    }
  };
  var _invoke__12 = function(this$, a, b, c, d, e, f, g, h, i, j, k) {
    if(function() {
      var and__3822__auto____6263 = this$;
      if(and__3822__auto____6263) {
        return this$.cljs$core$IFn$_invoke$arity$12
      }else {
        return and__3822__auto____6263
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$12(this$, a, b, c, d, e, f, g, h, i, j, k)
    }else {
      var x__2391__auto____6264 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6265 = cljs.core._invoke[goog.typeOf(x__2391__auto____6264)];
        if(or__3824__auto____6265) {
          return or__3824__auto____6265
        }else {
          var or__3824__auto____6266 = cljs.core._invoke["_"];
          if(or__3824__auto____6266) {
            return or__3824__auto____6266
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k)
    }
  };
  var _invoke__13 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l) {
    if(function() {
      var and__3822__auto____6267 = this$;
      if(and__3822__auto____6267) {
        return this$.cljs$core$IFn$_invoke$arity$13
      }else {
        return and__3822__auto____6267
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$13(this$, a, b, c, d, e, f, g, h, i, j, k, l)
    }else {
      var x__2391__auto____6268 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6269 = cljs.core._invoke[goog.typeOf(x__2391__auto____6268)];
        if(or__3824__auto____6269) {
          return or__3824__auto____6269
        }else {
          var or__3824__auto____6270 = cljs.core._invoke["_"];
          if(or__3824__auto____6270) {
            return or__3824__auto____6270
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l)
    }
  };
  var _invoke__14 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m) {
    if(function() {
      var and__3822__auto____6271 = this$;
      if(and__3822__auto____6271) {
        return this$.cljs$core$IFn$_invoke$arity$14
      }else {
        return and__3822__auto____6271
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$14(this$, a, b, c, d, e, f, g, h, i, j, k, l, m)
    }else {
      var x__2391__auto____6272 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6273 = cljs.core._invoke[goog.typeOf(x__2391__auto____6272)];
        if(or__3824__auto____6273) {
          return or__3824__auto____6273
        }else {
          var or__3824__auto____6274 = cljs.core._invoke["_"];
          if(or__3824__auto____6274) {
            return or__3824__auto____6274
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m)
    }
  };
  var _invoke__15 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n) {
    if(function() {
      var and__3822__auto____6275 = this$;
      if(and__3822__auto____6275) {
        return this$.cljs$core$IFn$_invoke$arity$15
      }else {
        return and__3822__auto____6275
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$15(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n)
    }else {
      var x__2391__auto____6276 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6277 = cljs.core._invoke[goog.typeOf(x__2391__auto____6276)];
        if(or__3824__auto____6277) {
          return or__3824__auto____6277
        }else {
          var or__3824__auto____6278 = cljs.core._invoke["_"];
          if(or__3824__auto____6278) {
            return or__3824__auto____6278
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n)
    }
  };
  var _invoke__16 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o) {
    if(function() {
      var and__3822__auto____6279 = this$;
      if(and__3822__auto____6279) {
        return this$.cljs$core$IFn$_invoke$arity$16
      }else {
        return and__3822__auto____6279
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$16(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o)
    }else {
      var x__2391__auto____6280 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6281 = cljs.core._invoke[goog.typeOf(x__2391__auto____6280)];
        if(or__3824__auto____6281) {
          return or__3824__auto____6281
        }else {
          var or__3824__auto____6282 = cljs.core._invoke["_"];
          if(or__3824__auto____6282) {
            return or__3824__auto____6282
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o)
    }
  };
  var _invoke__17 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p) {
    if(function() {
      var and__3822__auto____6283 = this$;
      if(and__3822__auto____6283) {
        return this$.cljs$core$IFn$_invoke$arity$17
      }else {
        return and__3822__auto____6283
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$17(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p)
    }else {
      var x__2391__auto____6284 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6285 = cljs.core._invoke[goog.typeOf(x__2391__auto____6284)];
        if(or__3824__auto____6285) {
          return or__3824__auto____6285
        }else {
          var or__3824__auto____6286 = cljs.core._invoke["_"];
          if(or__3824__auto____6286) {
            return or__3824__auto____6286
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p)
    }
  };
  var _invoke__18 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q) {
    if(function() {
      var and__3822__auto____6287 = this$;
      if(and__3822__auto____6287) {
        return this$.cljs$core$IFn$_invoke$arity$18
      }else {
        return and__3822__auto____6287
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$18(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q)
    }else {
      var x__2391__auto____6288 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6289 = cljs.core._invoke[goog.typeOf(x__2391__auto____6288)];
        if(or__3824__auto____6289) {
          return or__3824__auto____6289
        }else {
          var or__3824__auto____6290 = cljs.core._invoke["_"];
          if(or__3824__auto____6290) {
            return or__3824__auto____6290
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q)
    }
  };
  var _invoke__19 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s) {
    if(function() {
      var and__3822__auto____6291 = this$;
      if(and__3822__auto____6291) {
        return this$.cljs$core$IFn$_invoke$arity$19
      }else {
        return and__3822__auto____6291
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$19(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s)
    }else {
      var x__2391__auto____6292 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6293 = cljs.core._invoke[goog.typeOf(x__2391__auto____6292)];
        if(or__3824__auto____6293) {
          return or__3824__auto____6293
        }else {
          var or__3824__auto____6294 = cljs.core._invoke["_"];
          if(or__3824__auto____6294) {
            return or__3824__auto____6294
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s)
    }
  };
  var _invoke__20 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t) {
    if(function() {
      var and__3822__auto____6295 = this$;
      if(and__3822__auto____6295) {
        return this$.cljs$core$IFn$_invoke$arity$20
      }else {
        return and__3822__auto____6295
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$20(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t)
    }else {
      var x__2391__auto____6296 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6297 = cljs.core._invoke[goog.typeOf(x__2391__auto____6296)];
        if(or__3824__auto____6297) {
          return or__3824__auto____6297
        }else {
          var or__3824__auto____6298 = cljs.core._invoke["_"];
          if(or__3824__auto____6298) {
            return or__3824__auto____6298
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t)
    }
  };
  var _invoke__21 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest) {
    if(function() {
      var and__3822__auto____6299 = this$;
      if(and__3822__auto____6299) {
        return this$.cljs$core$IFn$_invoke$arity$21
      }else {
        return and__3822__auto____6299
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$21(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest)
    }else {
      var x__2391__auto____6300 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6301 = cljs.core._invoke[goog.typeOf(x__2391__auto____6300)];
        if(or__3824__auto____6301) {
          return or__3824__auto____6301
        }else {
          var or__3824__auto____6302 = cljs.core._invoke["_"];
          if(or__3824__auto____6302) {
            return or__3824__auto____6302
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
    var and__3822__auto____6307 = coll;
    if(and__3822__auto____6307) {
      return coll.cljs$core$ICounted$_count$arity$1
    }else {
      return and__3822__auto____6307
    }
  }()) {
    return coll.cljs$core$ICounted$_count$arity$1(coll)
  }else {
    var x__2391__auto____6308 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6309 = cljs.core._count[goog.typeOf(x__2391__auto____6308)];
      if(or__3824__auto____6309) {
        return or__3824__auto____6309
      }else {
        var or__3824__auto____6310 = cljs.core._count["_"];
        if(or__3824__auto____6310) {
          return or__3824__auto____6310
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
    var and__3822__auto____6315 = coll;
    if(and__3822__auto____6315) {
      return coll.cljs$core$IEmptyableCollection$_empty$arity$1
    }else {
      return and__3822__auto____6315
    }
  }()) {
    return coll.cljs$core$IEmptyableCollection$_empty$arity$1(coll)
  }else {
    var x__2391__auto____6316 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6317 = cljs.core._empty[goog.typeOf(x__2391__auto____6316)];
      if(or__3824__auto____6317) {
        return or__3824__auto____6317
      }else {
        var or__3824__auto____6318 = cljs.core._empty["_"];
        if(or__3824__auto____6318) {
          return or__3824__auto____6318
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
    var and__3822__auto____6323 = coll;
    if(and__3822__auto____6323) {
      return coll.cljs$core$ICollection$_conj$arity$2
    }else {
      return and__3822__auto____6323
    }
  }()) {
    return coll.cljs$core$ICollection$_conj$arity$2(coll, o)
  }else {
    var x__2391__auto____6324 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6325 = cljs.core._conj[goog.typeOf(x__2391__auto____6324)];
      if(or__3824__auto____6325) {
        return or__3824__auto____6325
      }else {
        var or__3824__auto____6326 = cljs.core._conj["_"];
        if(or__3824__auto____6326) {
          return or__3824__auto____6326
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
      var and__3822__auto____6335 = coll;
      if(and__3822__auto____6335) {
        return coll.cljs$core$IIndexed$_nth$arity$2
      }else {
        return and__3822__auto____6335
      }
    }()) {
      return coll.cljs$core$IIndexed$_nth$arity$2(coll, n)
    }else {
      var x__2391__auto____6336 = coll == null ? null : coll;
      return function() {
        var or__3824__auto____6337 = cljs.core._nth[goog.typeOf(x__2391__auto____6336)];
        if(or__3824__auto____6337) {
          return or__3824__auto____6337
        }else {
          var or__3824__auto____6338 = cljs.core._nth["_"];
          if(or__3824__auto____6338) {
            return or__3824__auto____6338
          }else {
            throw cljs.core.missing_protocol.call(null, "IIndexed.-nth", coll);
          }
        }
      }().call(null, coll, n)
    }
  };
  var _nth__3 = function(coll, n, not_found) {
    if(function() {
      var and__3822__auto____6339 = coll;
      if(and__3822__auto____6339) {
        return coll.cljs$core$IIndexed$_nth$arity$3
      }else {
        return and__3822__auto____6339
      }
    }()) {
      return coll.cljs$core$IIndexed$_nth$arity$3(coll, n, not_found)
    }else {
      var x__2391__auto____6340 = coll == null ? null : coll;
      return function() {
        var or__3824__auto____6341 = cljs.core._nth[goog.typeOf(x__2391__auto____6340)];
        if(or__3824__auto____6341) {
          return or__3824__auto____6341
        }else {
          var or__3824__auto____6342 = cljs.core._nth["_"];
          if(or__3824__auto____6342) {
            return or__3824__auto____6342
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
    var and__3822__auto____6347 = coll;
    if(and__3822__auto____6347) {
      return coll.cljs$core$ISeq$_first$arity$1
    }else {
      return and__3822__auto____6347
    }
  }()) {
    return coll.cljs$core$ISeq$_first$arity$1(coll)
  }else {
    var x__2391__auto____6348 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6349 = cljs.core._first[goog.typeOf(x__2391__auto____6348)];
      if(or__3824__auto____6349) {
        return or__3824__auto____6349
      }else {
        var or__3824__auto____6350 = cljs.core._first["_"];
        if(or__3824__auto____6350) {
          return or__3824__auto____6350
        }else {
          throw cljs.core.missing_protocol.call(null, "ISeq.-first", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._rest = function _rest(coll) {
  if(function() {
    var and__3822__auto____6355 = coll;
    if(and__3822__auto____6355) {
      return coll.cljs$core$ISeq$_rest$arity$1
    }else {
      return and__3822__auto____6355
    }
  }()) {
    return coll.cljs$core$ISeq$_rest$arity$1(coll)
  }else {
    var x__2391__auto____6356 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6357 = cljs.core._rest[goog.typeOf(x__2391__auto____6356)];
      if(or__3824__auto____6357) {
        return or__3824__auto____6357
      }else {
        var or__3824__auto____6358 = cljs.core._rest["_"];
        if(or__3824__auto____6358) {
          return or__3824__auto____6358
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
    var and__3822__auto____6363 = coll;
    if(and__3822__auto____6363) {
      return coll.cljs$core$INext$_next$arity$1
    }else {
      return and__3822__auto____6363
    }
  }()) {
    return coll.cljs$core$INext$_next$arity$1(coll)
  }else {
    var x__2391__auto____6364 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6365 = cljs.core._next[goog.typeOf(x__2391__auto____6364)];
      if(or__3824__auto____6365) {
        return or__3824__auto____6365
      }else {
        var or__3824__auto____6366 = cljs.core._next["_"];
        if(or__3824__auto____6366) {
          return or__3824__auto____6366
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
      var and__3822__auto____6375 = o;
      if(and__3822__auto____6375) {
        return o.cljs$core$ILookup$_lookup$arity$2
      }else {
        return and__3822__auto____6375
      }
    }()) {
      return o.cljs$core$ILookup$_lookup$arity$2(o, k)
    }else {
      var x__2391__auto____6376 = o == null ? null : o;
      return function() {
        var or__3824__auto____6377 = cljs.core._lookup[goog.typeOf(x__2391__auto____6376)];
        if(or__3824__auto____6377) {
          return or__3824__auto____6377
        }else {
          var or__3824__auto____6378 = cljs.core._lookup["_"];
          if(or__3824__auto____6378) {
            return or__3824__auto____6378
          }else {
            throw cljs.core.missing_protocol.call(null, "ILookup.-lookup", o);
          }
        }
      }().call(null, o, k)
    }
  };
  var _lookup__3 = function(o, k, not_found) {
    if(function() {
      var and__3822__auto____6379 = o;
      if(and__3822__auto____6379) {
        return o.cljs$core$ILookup$_lookup$arity$3
      }else {
        return and__3822__auto____6379
      }
    }()) {
      return o.cljs$core$ILookup$_lookup$arity$3(o, k, not_found)
    }else {
      var x__2391__auto____6380 = o == null ? null : o;
      return function() {
        var or__3824__auto____6381 = cljs.core._lookup[goog.typeOf(x__2391__auto____6380)];
        if(or__3824__auto____6381) {
          return or__3824__auto____6381
        }else {
          var or__3824__auto____6382 = cljs.core._lookup["_"];
          if(or__3824__auto____6382) {
            return or__3824__auto____6382
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
    var and__3822__auto____6387 = coll;
    if(and__3822__auto____6387) {
      return coll.cljs$core$IAssociative$_contains_key_QMARK_$arity$2
    }else {
      return and__3822__auto____6387
    }
  }()) {
    return coll.cljs$core$IAssociative$_contains_key_QMARK_$arity$2(coll, k)
  }else {
    var x__2391__auto____6388 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6389 = cljs.core._contains_key_QMARK_[goog.typeOf(x__2391__auto____6388)];
      if(or__3824__auto____6389) {
        return or__3824__auto____6389
      }else {
        var or__3824__auto____6390 = cljs.core._contains_key_QMARK_["_"];
        if(or__3824__auto____6390) {
          return or__3824__auto____6390
        }else {
          throw cljs.core.missing_protocol.call(null, "IAssociative.-contains-key?", coll);
        }
      }
    }().call(null, coll, k)
  }
};
cljs.core._assoc = function _assoc(coll, k, v) {
  if(function() {
    var and__3822__auto____6395 = coll;
    if(and__3822__auto____6395) {
      return coll.cljs$core$IAssociative$_assoc$arity$3
    }else {
      return and__3822__auto____6395
    }
  }()) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, k, v)
  }else {
    var x__2391__auto____6396 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6397 = cljs.core._assoc[goog.typeOf(x__2391__auto____6396)];
      if(or__3824__auto____6397) {
        return or__3824__auto____6397
      }else {
        var or__3824__auto____6398 = cljs.core._assoc["_"];
        if(or__3824__auto____6398) {
          return or__3824__auto____6398
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
    var and__3822__auto____6403 = coll;
    if(and__3822__auto____6403) {
      return coll.cljs$core$IMap$_dissoc$arity$2
    }else {
      return and__3822__auto____6403
    }
  }()) {
    return coll.cljs$core$IMap$_dissoc$arity$2(coll, k)
  }else {
    var x__2391__auto____6404 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6405 = cljs.core._dissoc[goog.typeOf(x__2391__auto____6404)];
      if(or__3824__auto____6405) {
        return or__3824__auto____6405
      }else {
        var or__3824__auto____6406 = cljs.core._dissoc["_"];
        if(or__3824__auto____6406) {
          return or__3824__auto____6406
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
    var and__3822__auto____6411 = coll;
    if(and__3822__auto____6411) {
      return coll.cljs$core$IMapEntry$_key$arity$1
    }else {
      return and__3822__auto____6411
    }
  }()) {
    return coll.cljs$core$IMapEntry$_key$arity$1(coll)
  }else {
    var x__2391__auto____6412 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6413 = cljs.core._key[goog.typeOf(x__2391__auto____6412)];
      if(or__3824__auto____6413) {
        return or__3824__auto____6413
      }else {
        var or__3824__auto____6414 = cljs.core._key["_"];
        if(or__3824__auto____6414) {
          return or__3824__auto____6414
        }else {
          throw cljs.core.missing_protocol.call(null, "IMapEntry.-key", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._val = function _val(coll) {
  if(function() {
    var and__3822__auto____6419 = coll;
    if(and__3822__auto____6419) {
      return coll.cljs$core$IMapEntry$_val$arity$1
    }else {
      return and__3822__auto____6419
    }
  }()) {
    return coll.cljs$core$IMapEntry$_val$arity$1(coll)
  }else {
    var x__2391__auto____6420 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6421 = cljs.core._val[goog.typeOf(x__2391__auto____6420)];
      if(or__3824__auto____6421) {
        return or__3824__auto____6421
      }else {
        var or__3824__auto____6422 = cljs.core._val["_"];
        if(or__3824__auto____6422) {
          return or__3824__auto____6422
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
    var and__3822__auto____6427 = coll;
    if(and__3822__auto____6427) {
      return coll.cljs$core$ISet$_disjoin$arity$2
    }else {
      return and__3822__auto____6427
    }
  }()) {
    return coll.cljs$core$ISet$_disjoin$arity$2(coll, v)
  }else {
    var x__2391__auto____6428 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6429 = cljs.core._disjoin[goog.typeOf(x__2391__auto____6428)];
      if(or__3824__auto____6429) {
        return or__3824__auto____6429
      }else {
        var or__3824__auto____6430 = cljs.core._disjoin["_"];
        if(or__3824__auto____6430) {
          return or__3824__auto____6430
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
    var and__3822__auto____6435 = coll;
    if(and__3822__auto____6435) {
      return coll.cljs$core$IStack$_peek$arity$1
    }else {
      return and__3822__auto____6435
    }
  }()) {
    return coll.cljs$core$IStack$_peek$arity$1(coll)
  }else {
    var x__2391__auto____6436 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6437 = cljs.core._peek[goog.typeOf(x__2391__auto____6436)];
      if(or__3824__auto____6437) {
        return or__3824__auto____6437
      }else {
        var or__3824__auto____6438 = cljs.core._peek["_"];
        if(or__3824__auto____6438) {
          return or__3824__auto____6438
        }else {
          throw cljs.core.missing_protocol.call(null, "IStack.-peek", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._pop = function _pop(coll) {
  if(function() {
    var and__3822__auto____6443 = coll;
    if(and__3822__auto____6443) {
      return coll.cljs$core$IStack$_pop$arity$1
    }else {
      return and__3822__auto____6443
    }
  }()) {
    return coll.cljs$core$IStack$_pop$arity$1(coll)
  }else {
    var x__2391__auto____6444 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6445 = cljs.core._pop[goog.typeOf(x__2391__auto____6444)];
      if(or__3824__auto____6445) {
        return or__3824__auto____6445
      }else {
        var or__3824__auto____6446 = cljs.core._pop["_"];
        if(or__3824__auto____6446) {
          return or__3824__auto____6446
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
    var and__3822__auto____6451 = coll;
    if(and__3822__auto____6451) {
      return coll.cljs$core$IVector$_assoc_n$arity$3
    }else {
      return and__3822__auto____6451
    }
  }()) {
    return coll.cljs$core$IVector$_assoc_n$arity$3(coll, n, val)
  }else {
    var x__2391__auto____6452 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6453 = cljs.core._assoc_n[goog.typeOf(x__2391__auto____6452)];
      if(or__3824__auto____6453) {
        return or__3824__auto____6453
      }else {
        var or__3824__auto____6454 = cljs.core._assoc_n["_"];
        if(or__3824__auto____6454) {
          return or__3824__auto____6454
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
    var and__3822__auto____6459 = o;
    if(and__3822__auto____6459) {
      return o.cljs$core$IDeref$_deref$arity$1
    }else {
      return and__3822__auto____6459
    }
  }()) {
    return o.cljs$core$IDeref$_deref$arity$1(o)
  }else {
    var x__2391__auto____6460 = o == null ? null : o;
    return function() {
      var or__3824__auto____6461 = cljs.core._deref[goog.typeOf(x__2391__auto____6460)];
      if(or__3824__auto____6461) {
        return or__3824__auto____6461
      }else {
        var or__3824__auto____6462 = cljs.core._deref["_"];
        if(or__3824__auto____6462) {
          return or__3824__auto____6462
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
    var and__3822__auto____6467 = o;
    if(and__3822__auto____6467) {
      return o.cljs$core$IDerefWithTimeout$_deref_with_timeout$arity$3
    }else {
      return and__3822__auto____6467
    }
  }()) {
    return o.cljs$core$IDerefWithTimeout$_deref_with_timeout$arity$3(o, msec, timeout_val)
  }else {
    var x__2391__auto____6468 = o == null ? null : o;
    return function() {
      var or__3824__auto____6469 = cljs.core._deref_with_timeout[goog.typeOf(x__2391__auto____6468)];
      if(or__3824__auto____6469) {
        return or__3824__auto____6469
      }else {
        var or__3824__auto____6470 = cljs.core._deref_with_timeout["_"];
        if(or__3824__auto____6470) {
          return or__3824__auto____6470
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
    var and__3822__auto____6475 = o;
    if(and__3822__auto____6475) {
      return o.cljs$core$IMeta$_meta$arity$1
    }else {
      return and__3822__auto____6475
    }
  }()) {
    return o.cljs$core$IMeta$_meta$arity$1(o)
  }else {
    var x__2391__auto____6476 = o == null ? null : o;
    return function() {
      var or__3824__auto____6477 = cljs.core._meta[goog.typeOf(x__2391__auto____6476)];
      if(or__3824__auto____6477) {
        return or__3824__auto____6477
      }else {
        var or__3824__auto____6478 = cljs.core._meta["_"];
        if(or__3824__auto____6478) {
          return or__3824__auto____6478
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
    var and__3822__auto____6483 = o;
    if(and__3822__auto____6483) {
      return o.cljs$core$IWithMeta$_with_meta$arity$2
    }else {
      return and__3822__auto____6483
    }
  }()) {
    return o.cljs$core$IWithMeta$_with_meta$arity$2(o, meta)
  }else {
    var x__2391__auto____6484 = o == null ? null : o;
    return function() {
      var or__3824__auto____6485 = cljs.core._with_meta[goog.typeOf(x__2391__auto____6484)];
      if(or__3824__auto____6485) {
        return or__3824__auto____6485
      }else {
        var or__3824__auto____6486 = cljs.core._with_meta["_"];
        if(or__3824__auto____6486) {
          return or__3824__auto____6486
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
      var and__3822__auto____6495 = coll;
      if(and__3822__auto____6495) {
        return coll.cljs$core$IReduce$_reduce$arity$2
      }else {
        return and__3822__auto____6495
      }
    }()) {
      return coll.cljs$core$IReduce$_reduce$arity$2(coll, f)
    }else {
      var x__2391__auto____6496 = coll == null ? null : coll;
      return function() {
        var or__3824__auto____6497 = cljs.core._reduce[goog.typeOf(x__2391__auto____6496)];
        if(or__3824__auto____6497) {
          return or__3824__auto____6497
        }else {
          var or__3824__auto____6498 = cljs.core._reduce["_"];
          if(or__3824__auto____6498) {
            return or__3824__auto____6498
          }else {
            throw cljs.core.missing_protocol.call(null, "IReduce.-reduce", coll);
          }
        }
      }().call(null, coll, f)
    }
  };
  var _reduce__3 = function(coll, f, start) {
    if(function() {
      var and__3822__auto____6499 = coll;
      if(and__3822__auto____6499) {
        return coll.cljs$core$IReduce$_reduce$arity$3
      }else {
        return and__3822__auto____6499
      }
    }()) {
      return coll.cljs$core$IReduce$_reduce$arity$3(coll, f, start)
    }else {
      var x__2391__auto____6500 = coll == null ? null : coll;
      return function() {
        var or__3824__auto____6501 = cljs.core._reduce[goog.typeOf(x__2391__auto____6500)];
        if(or__3824__auto____6501) {
          return or__3824__auto____6501
        }else {
          var or__3824__auto____6502 = cljs.core._reduce["_"];
          if(or__3824__auto____6502) {
            return or__3824__auto____6502
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
    var and__3822__auto____6507 = coll;
    if(and__3822__auto____6507) {
      return coll.cljs$core$IKVReduce$_kv_reduce$arity$3
    }else {
      return and__3822__auto____6507
    }
  }()) {
    return coll.cljs$core$IKVReduce$_kv_reduce$arity$3(coll, f, init)
  }else {
    var x__2391__auto____6508 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6509 = cljs.core._kv_reduce[goog.typeOf(x__2391__auto____6508)];
      if(or__3824__auto____6509) {
        return or__3824__auto____6509
      }else {
        var or__3824__auto____6510 = cljs.core._kv_reduce["_"];
        if(or__3824__auto____6510) {
          return or__3824__auto____6510
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
    var and__3822__auto____6515 = o;
    if(and__3822__auto____6515) {
      return o.cljs$core$IEquiv$_equiv$arity$2
    }else {
      return and__3822__auto____6515
    }
  }()) {
    return o.cljs$core$IEquiv$_equiv$arity$2(o, other)
  }else {
    var x__2391__auto____6516 = o == null ? null : o;
    return function() {
      var or__3824__auto____6517 = cljs.core._equiv[goog.typeOf(x__2391__auto____6516)];
      if(or__3824__auto____6517) {
        return or__3824__auto____6517
      }else {
        var or__3824__auto____6518 = cljs.core._equiv["_"];
        if(or__3824__auto____6518) {
          return or__3824__auto____6518
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
    var and__3822__auto____6523 = o;
    if(and__3822__auto____6523) {
      return o.cljs$core$IHash$_hash$arity$1
    }else {
      return and__3822__auto____6523
    }
  }()) {
    return o.cljs$core$IHash$_hash$arity$1(o)
  }else {
    var x__2391__auto____6524 = o == null ? null : o;
    return function() {
      var or__3824__auto____6525 = cljs.core._hash[goog.typeOf(x__2391__auto____6524)];
      if(or__3824__auto____6525) {
        return or__3824__auto____6525
      }else {
        var or__3824__auto____6526 = cljs.core._hash["_"];
        if(or__3824__auto____6526) {
          return or__3824__auto____6526
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
    var and__3822__auto____6531 = o;
    if(and__3822__auto____6531) {
      return o.cljs$core$ISeqable$_seq$arity$1
    }else {
      return and__3822__auto____6531
    }
  }()) {
    return o.cljs$core$ISeqable$_seq$arity$1(o)
  }else {
    var x__2391__auto____6532 = o == null ? null : o;
    return function() {
      var or__3824__auto____6533 = cljs.core._seq[goog.typeOf(x__2391__auto____6532)];
      if(or__3824__auto____6533) {
        return or__3824__auto____6533
      }else {
        var or__3824__auto____6534 = cljs.core._seq["_"];
        if(or__3824__auto____6534) {
          return or__3824__auto____6534
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
    var and__3822__auto____6539 = coll;
    if(and__3822__auto____6539) {
      return coll.cljs$core$IReversible$_rseq$arity$1
    }else {
      return and__3822__auto____6539
    }
  }()) {
    return coll.cljs$core$IReversible$_rseq$arity$1(coll)
  }else {
    var x__2391__auto____6540 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6541 = cljs.core._rseq[goog.typeOf(x__2391__auto____6540)];
      if(or__3824__auto____6541) {
        return or__3824__auto____6541
      }else {
        var or__3824__auto____6542 = cljs.core._rseq["_"];
        if(or__3824__auto____6542) {
          return or__3824__auto____6542
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
    var and__3822__auto____6547 = coll;
    if(and__3822__auto____6547) {
      return coll.cljs$core$ISorted$_sorted_seq$arity$2
    }else {
      return and__3822__auto____6547
    }
  }()) {
    return coll.cljs$core$ISorted$_sorted_seq$arity$2(coll, ascending_QMARK_)
  }else {
    var x__2391__auto____6548 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6549 = cljs.core._sorted_seq[goog.typeOf(x__2391__auto____6548)];
      if(or__3824__auto____6549) {
        return or__3824__auto____6549
      }else {
        var or__3824__auto____6550 = cljs.core._sorted_seq["_"];
        if(or__3824__auto____6550) {
          return or__3824__auto____6550
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-sorted-seq", coll);
        }
      }
    }().call(null, coll, ascending_QMARK_)
  }
};
cljs.core._sorted_seq_from = function _sorted_seq_from(coll, k, ascending_QMARK_) {
  if(function() {
    var and__3822__auto____6555 = coll;
    if(and__3822__auto____6555) {
      return coll.cljs$core$ISorted$_sorted_seq_from$arity$3
    }else {
      return and__3822__auto____6555
    }
  }()) {
    return coll.cljs$core$ISorted$_sorted_seq_from$arity$3(coll, k, ascending_QMARK_)
  }else {
    var x__2391__auto____6556 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6557 = cljs.core._sorted_seq_from[goog.typeOf(x__2391__auto____6556)];
      if(or__3824__auto____6557) {
        return or__3824__auto____6557
      }else {
        var or__3824__auto____6558 = cljs.core._sorted_seq_from["_"];
        if(or__3824__auto____6558) {
          return or__3824__auto____6558
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-sorted-seq-from", coll);
        }
      }
    }().call(null, coll, k, ascending_QMARK_)
  }
};
cljs.core._entry_key = function _entry_key(coll, entry) {
  if(function() {
    var and__3822__auto____6563 = coll;
    if(and__3822__auto____6563) {
      return coll.cljs$core$ISorted$_entry_key$arity$2
    }else {
      return and__3822__auto____6563
    }
  }()) {
    return coll.cljs$core$ISorted$_entry_key$arity$2(coll, entry)
  }else {
    var x__2391__auto____6564 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6565 = cljs.core._entry_key[goog.typeOf(x__2391__auto____6564)];
      if(or__3824__auto____6565) {
        return or__3824__auto____6565
      }else {
        var or__3824__auto____6566 = cljs.core._entry_key["_"];
        if(or__3824__auto____6566) {
          return or__3824__auto____6566
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-entry-key", coll);
        }
      }
    }().call(null, coll, entry)
  }
};
cljs.core._comparator = function _comparator(coll) {
  if(function() {
    var and__3822__auto____6571 = coll;
    if(and__3822__auto____6571) {
      return coll.cljs$core$ISorted$_comparator$arity$1
    }else {
      return and__3822__auto____6571
    }
  }()) {
    return coll.cljs$core$ISorted$_comparator$arity$1(coll)
  }else {
    var x__2391__auto____6572 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6573 = cljs.core._comparator[goog.typeOf(x__2391__auto____6572)];
      if(or__3824__auto____6573) {
        return or__3824__auto____6573
      }else {
        var or__3824__auto____6574 = cljs.core._comparator["_"];
        if(or__3824__auto____6574) {
          return or__3824__auto____6574
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
    var and__3822__auto____6579 = o;
    if(and__3822__auto____6579) {
      return o.cljs$core$IPrintable$_pr_seq$arity$2
    }else {
      return and__3822__auto____6579
    }
  }()) {
    return o.cljs$core$IPrintable$_pr_seq$arity$2(o, opts)
  }else {
    var x__2391__auto____6580 = o == null ? null : o;
    return function() {
      var or__3824__auto____6581 = cljs.core._pr_seq[goog.typeOf(x__2391__auto____6580)];
      if(or__3824__auto____6581) {
        return or__3824__auto____6581
      }else {
        var or__3824__auto____6582 = cljs.core._pr_seq["_"];
        if(or__3824__auto____6582) {
          return or__3824__auto____6582
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
    var and__3822__auto____6587 = d;
    if(and__3822__auto____6587) {
      return d.cljs$core$IPending$_realized_QMARK_$arity$1
    }else {
      return and__3822__auto____6587
    }
  }()) {
    return d.cljs$core$IPending$_realized_QMARK_$arity$1(d)
  }else {
    var x__2391__auto____6588 = d == null ? null : d;
    return function() {
      var or__3824__auto____6589 = cljs.core._realized_QMARK_[goog.typeOf(x__2391__auto____6588)];
      if(or__3824__auto____6589) {
        return or__3824__auto____6589
      }else {
        var or__3824__auto____6590 = cljs.core._realized_QMARK_["_"];
        if(or__3824__auto____6590) {
          return or__3824__auto____6590
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
    var and__3822__auto____6595 = this$;
    if(and__3822__auto____6595) {
      return this$.cljs$core$IWatchable$_notify_watches$arity$3
    }else {
      return and__3822__auto____6595
    }
  }()) {
    return this$.cljs$core$IWatchable$_notify_watches$arity$3(this$, oldval, newval)
  }else {
    var x__2391__auto____6596 = this$ == null ? null : this$;
    return function() {
      var or__3824__auto____6597 = cljs.core._notify_watches[goog.typeOf(x__2391__auto____6596)];
      if(or__3824__auto____6597) {
        return or__3824__auto____6597
      }else {
        var or__3824__auto____6598 = cljs.core._notify_watches["_"];
        if(or__3824__auto____6598) {
          return or__3824__auto____6598
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-notify-watches", this$);
        }
      }
    }().call(null, this$, oldval, newval)
  }
};
cljs.core._add_watch = function _add_watch(this$, key, f) {
  if(function() {
    var and__3822__auto____6603 = this$;
    if(and__3822__auto____6603) {
      return this$.cljs$core$IWatchable$_add_watch$arity$3
    }else {
      return and__3822__auto____6603
    }
  }()) {
    return this$.cljs$core$IWatchable$_add_watch$arity$3(this$, key, f)
  }else {
    var x__2391__auto____6604 = this$ == null ? null : this$;
    return function() {
      var or__3824__auto____6605 = cljs.core._add_watch[goog.typeOf(x__2391__auto____6604)];
      if(or__3824__auto____6605) {
        return or__3824__auto____6605
      }else {
        var or__3824__auto____6606 = cljs.core._add_watch["_"];
        if(or__3824__auto____6606) {
          return or__3824__auto____6606
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-add-watch", this$);
        }
      }
    }().call(null, this$, key, f)
  }
};
cljs.core._remove_watch = function _remove_watch(this$, key) {
  if(function() {
    var and__3822__auto____6611 = this$;
    if(and__3822__auto____6611) {
      return this$.cljs$core$IWatchable$_remove_watch$arity$2
    }else {
      return and__3822__auto____6611
    }
  }()) {
    return this$.cljs$core$IWatchable$_remove_watch$arity$2(this$, key)
  }else {
    var x__2391__auto____6612 = this$ == null ? null : this$;
    return function() {
      var or__3824__auto____6613 = cljs.core._remove_watch[goog.typeOf(x__2391__auto____6612)];
      if(or__3824__auto____6613) {
        return or__3824__auto____6613
      }else {
        var or__3824__auto____6614 = cljs.core._remove_watch["_"];
        if(or__3824__auto____6614) {
          return or__3824__auto____6614
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
    var and__3822__auto____6619 = coll;
    if(and__3822__auto____6619) {
      return coll.cljs$core$IEditableCollection$_as_transient$arity$1
    }else {
      return and__3822__auto____6619
    }
  }()) {
    return coll.cljs$core$IEditableCollection$_as_transient$arity$1(coll)
  }else {
    var x__2391__auto____6620 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6621 = cljs.core._as_transient[goog.typeOf(x__2391__auto____6620)];
      if(or__3824__auto____6621) {
        return or__3824__auto____6621
      }else {
        var or__3824__auto____6622 = cljs.core._as_transient["_"];
        if(or__3824__auto____6622) {
          return or__3824__auto____6622
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
    var and__3822__auto____6627 = tcoll;
    if(and__3822__auto____6627) {
      return tcoll.cljs$core$ITransientCollection$_conj_BANG_$arity$2
    }else {
      return and__3822__auto____6627
    }
  }()) {
    return tcoll.cljs$core$ITransientCollection$_conj_BANG_$arity$2(tcoll, val)
  }else {
    var x__2391__auto____6628 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____6629 = cljs.core._conj_BANG_[goog.typeOf(x__2391__auto____6628)];
      if(or__3824__auto____6629) {
        return or__3824__auto____6629
      }else {
        var or__3824__auto____6630 = cljs.core._conj_BANG_["_"];
        if(or__3824__auto____6630) {
          return or__3824__auto____6630
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientCollection.-conj!", tcoll);
        }
      }
    }().call(null, tcoll, val)
  }
};
cljs.core._persistent_BANG_ = function _persistent_BANG_(tcoll) {
  if(function() {
    var and__3822__auto____6635 = tcoll;
    if(and__3822__auto____6635) {
      return tcoll.cljs$core$ITransientCollection$_persistent_BANG_$arity$1
    }else {
      return and__3822__auto____6635
    }
  }()) {
    return tcoll.cljs$core$ITransientCollection$_persistent_BANG_$arity$1(tcoll)
  }else {
    var x__2391__auto____6636 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____6637 = cljs.core._persistent_BANG_[goog.typeOf(x__2391__auto____6636)];
      if(or__3824__auto____6637) {
        return or__3824__auto____6637
      }else {
        var or__3824__auto____6638 = cljs.core._persistent_BANG_["_"];
        if(or__3824__auto____6638) {
          return or__3824__auto____6638
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
    var and__3822__auto____6643 = tcoll;
    if(and__3822__auto____6643) {
      return tcoll.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3
    }else {
      return and__3822__auto____6643
    }
  }()) {
    return tcoll.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3(tcoll, key, val)
  }else {
    var x__2391__auto____6644 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____6645 = cljs.core._assoc_BANG_[goog.typeOf(x__2391__auto____6644)];
      if(or__3824__auto____6645) {
        return or__3824__auto____6645
      }else {
        var or__3824__auto____6646 = cljs.core._assoc_BANG_["_"];
        if(or__3824__auto____6646) {
          return or__3824__auto____6646
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
    var and__3822__auto____6651 = tcoll;
    if(and__3822__auto____6651) {
      return tcoll.cljs$core$ITransientMap$_dissoc_BANG_$arity$2
    }else {
      return and__3822__auto____6651
    }
  }()) {
    return tcoll.cljs$core$ITransientMap$_dissoc_BANG_$arity$2(tcoll, key)
  }else {
    var x__2391__auto____6652 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____6653 = cljs.core._dissoc_BANG_[goog.typeOf(x__2391__auto____6652)];
      if(or__3824__auto____6653) {
        return or__3824__auto____6653
      }else {
        var or__3824__auto____6654 = cljs.core._dissoc_BANG_["_"];
        if(or__3824__auto____6654) {
          return or__3824__auto____6654
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
    var and__3822__auto____6659 = tcoll;
    if(and__3822__auto____6659) {
      return tcoll.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3
    }else {
      return and__3822__auto____6659
    }
  }()) {
    return tcoll.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3(tcoll, n, val)
  }else {
    var x__2391__auto____6660 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____6661 = cljs.core._assoc_n_BANG_[goog.typeOf(x__2391__auto____6660)];
      if(or__3824__auto____6661) {
        return or__3824__auto____6661
      }else {
        var or__3824__auto____6662 = cljs.core._assoc_n_BANG_["_"];
        if(or__3824__auto____6662) {
          return or__3824__auto____6662
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientVector.-assoc-n!", tcoll);
        }
      }
    }().call(null, tcoll, n, val)
  }
};
cljs.core._pop_BANG_ = function _pop_BANG_(tcoll) {
  if(function() {
    var and__3822__auto____6667 = tcoll;
    if(and__3822__auto____6667) {
      return tcoll.cljs$core$ITransientVector$_pop_BANG_$arity$1
    }else {
      return and__3822__auto____6667
    }
  }()) {
    return tcoll.cljs$core$ITransientVector$_pop_BANG_$arity$1(tcoll)
  }else {
    var x__2391__auto____6668 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____6669 = cljs.core._pop_BANG_[goog.typeOf(x__2391__auto____6668)];
      if(or__3824__auto____6669) {
        return or__3824__auto____6669
      }else {
        var or__3824__auto____6670 = cljs.core._pop_BANG_["_"];
        if(or__3824__auto____6670) {
          return or__3824__auto____6670
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
    var and__3822__auto____6675 = tcoll;
    if(and__3822__auto____6675) {
      return tcoll.cljs$core$ITransientSet$_disjoin_BANG_$arity$2
    }else {
      return and__3822__auto____6675
    }
  }()) {
    return tcoll.cljs$core$ITransientSet$_disjoin_BANG_$arity$2(tcoll, v)
  }else {
    var x__2391__auto____6676 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____6677 = cljs.core._disjoin_BANG_[goog.typeOf(x__2391__auto____6676)];
      if(or__3824__auto____6677) {
        return or__3824__auto____6677
      }else {
        var or__3824__auto____6678 = cljs.core._disjoin_BANG_["_"];
        if(or__3824__auto____6678) {
          return or__3824__auto____6678
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
    var and__3822__auto____6683 = x;
    if(and__3822__auto____6683) {
      return x.cljs$core$IComparable$_compare$arity$2
    }else {
      return and__3822__auto____6683
    }
  }()) {
    return x.cljs$core$IComparable$_compare$arity$2(x, y)
  }else {
    var x__2391__auto____6684 = x == null ? null : x;
    return function() {
      var or__3824__auto____6685 = cljs.core._compare[goog.typeOf(x__2391__auto____6684)];
      if(or__3824__auto____6685) {
        return or__3824__auto____6685
      }else {
        var or__3824__auto____6686 = cljs.core._compare["_"];
        if(or__3824__auto____6686) {
          return or__3824__auto____6686
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
    var and__3822__auto____6691 = coll;
    if(and__3822__auto____6691) {
      return coll.cljs$core$IChunk$_drop_first$arity$1
    }else {
      return and__3822__auto____6691
    }
  }()) {
    return coll.cljs$core$IChunk$_drop_first$arity$1(coll)
  }else {
    var x__2391__auto____6692 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6693 = cljs.core._drop_first[goog.typeOf(x__2391__auto____6692)];
      if(or__3824__auto____6693) {
        return or__3824__auto____6693
      }else {
        var or__3824__auto____6694 = cljs.core._drop_first["_"];
        if(or__3824__auto____6694) {
          return or__3824__auto____6694
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
    var and__3822__auto____6699 = coll;
    if(and__3822__auto____6699) {
      return coll.cljs$core$IChunkedSeq$_chunked_first$arity$1
    }else {
      return and__3822__auto____6699
    }
  }()) {
    return coll.cljs$core$IChunkedSeq$_chunked_first$arity$1(coll)
  }else {
    var x__2391__auto____6700 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6701 = cljs.core._chunked_first[goog.typeOf(x__2391__auto____6700)];
      if(or__3824__auto____6701) {
        return or__3824__auto____6701
      }else {
        var or__3824__auto____6702 = cljs.core._chunked_first["_"];
        if(or__3824__auto____6702) {
          return or__3824__auto____6702
        }else {
          throw cljs.core.missing_protocol.call(null, "IChunkedSeq.-chunked-first", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._chunked_rest = function _chunked_rest(coll) {
  if(function() {
    var and__3822__auto____6707 = coll;
    if(and__3822__auto____6707) {
      return coll.cljs$core$IChunkedSeq$_chunked_rest$arity$1
    }else {
      return and__3822__auto____6707
    }
  }()) {
    return coll.cljs$core$IChunkedSeq$_chunked_rest$arity$1(coll)
  }else {
    var x__2391__auto____6708 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6709 = cljs.core._chunked_rest[goog.typeOf(x__2391__auto____6708)];
      if(or__3824__auto____6709) {
        return or__3824__auto____6709
      }else {
        var or__3824__auto____6710 = cljs.core._chunked_rest["_"];
        if(or__3824__auto____6710) {
          return or__3824__auto____6710
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
    var and__3822__auto____6715 = coll;
    if(and__3822__auto____6715) {
      return coll.cljs$core$IChunkedNext$_chunked_next$arity$1
    }else {
      return and__3822__auto____6715
    }
  }()) {
    return coll.cljs$core$IChunkedNext$_chunked_next$arity$1(coll)
  }else {
    var x__2391__auto____6716 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6717 = cljs.core._chunked_next[goog.typeOf(x__2391__auto____6716)];
      if(or__3824__auto____6717) {
        return or__3824__auto____6717
      }else {
        var or__3824__auto____6718 = cljs.core._chunked_next["_"];
        if(or__3824__auto____6718) {
          return or__3824__auto____6718
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
    var or__3824__auto____6720 = x === y;
    if(or__3824__auto____6720) {
      return or__3824__auto____6720
    }else {
      return cljs.core._equiv.call(null, x, y)
    }
  };
  var _EQ___3 = function() {
    var G__6721__delegate = function(x, y, more) {
      while(true) {
        if(cljs.core.truth_(_EQ_.call(null, x, y))) {
          if(cljs.core.next.call(null, more)) {
            var G__6722 = y;
            var G__6723 = cljs.core.first.call(null, more);
            var G__6724 = cljs.core.next.call(null, more);
            x = G__6722;
            y = G__6723;
            more = G__6724;
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
    var G__6721 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__6721__delegate.call(this, x, y, more)
    };
    G__6721.cljs$lang$maxFixedArity = 2;
    G__6721.cljs$lang$applyTo = function(arglist__6725) {
      var x = cljs.core.first(arglist__6725);
      var y = cljs.core.first(cljs.core.next(arglist__6725));
      var more = cljs.core.rest(cljs.core.next(arglist__6725));
      return G__6721__delegate(x, y, more)
    };
    G__6721.cljs$lang$arity$variadic = G__6721__delegate;
    return G__6721
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
  var G__6726 = null;
  var G__6726__2 = function(o, k) {
    return null
  };
  var G__6726__3 = function(o, k, not_found) {
    return not_found
  };
  G__6726 = function(o, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__6726__2.call(this, o, k);
      case 3:
        return G__6726__3.call(this, o, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6726
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
  var G__6727 = null;
  var G__6727__2 = function(_, f) {
    return f.call(null)
  };
  var G__6727__3 = function(_, f, start) {
    return start
  };
  G__6727 = function(_, f, start) {
    switch(arguments.length) {
      case 2:
        return G__6727__2.call(this, _, f);
      case 3:
        return G__6727__3.call(this, _, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6727
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
  var G__6728 = null;
  var G__6728__2 = function(_, n) {
    return null
  };
  var G__6728__3 = function(_, n, not_found) {
    return not_found
  };
  G__6728 = function(_, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__6728__2.call(this, _, n);
      case 3:
        return G__6728__3.call(this, _, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6728
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
  var and__3822__auto____6729 = cljs.core.instance_QMARK_.call(null, Date, other);
  if(and__3822__auto____6729) {
    return o.toString() === other.toString()
  }else {
    return and__3822__auto____6729
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
    var cnt__6742 = cljs.core._count.call(null, cicoll);
    if(cnt__6742 === 0) {
      return f.call(null)
    }else {
      var val__6743 = cljs.core._nth.call(null, cicoll, 0);
      var n__6744 = 1;
      while(true) {
        if(n__6744 < cnt__6742) {
          var nval__6745 = f.call(null, val__6743, cljs.core._nth.call(null, cicoll, n__6744));
          if(cljs.core.reduced_QMARK_.call(null, nval__6745)) {
            return cljs.core.deref.call(null, nval__6745)
          }else {
            var G__6754 = nval__6745;
            var G__6755 = n__6744 + 1;
            val__6743 = G__6754;
            n__6744 = G__6755;
            continue
          }
        }else {
          return val__6743
        }
        break
      }
    }
  };
  var ci_reduce__3 = function(cicoll, f, val) {
    var cnt__6746 = cljs.core._count.call(null, cicoll);
    var val__6747 = val;
    var n__6748 = 0;
    while(true) {
      if(n__6748 < cnt__6746) {
        var nval__6749 = f.call(null, val__6747, cljs.core._nth.call(null, cicoll, n__6748));
        if(cljs.core.reduced_QMARK_.call(null, nval__6749)) {
          return cljs.core.deref.call(null, nval__6749)
        }else {
          var G__6756 = nval__6749;
          var G__6757 = n__6748 + 1;
          val__6747 = G__6756;
          n__6748 = G__6757;
          continue
        }
      }else {
        return val__6747
      }
      break
    }
  };
  var ci_reduce__4 = function(cicoll, f, val, idx) {
    var cnt__6750 = cljs.core._count.call(null, cicoll);
    var val__6751 = val;
    var n__6752 = idx;
    while(true) {
      if(n__6752 < cnt__6750) {
        var nval__6753 = f.call(null, val__6751, cljs.core._nth.call(null, cicoll, n__6752));
        if(cljs.core.reduced_QMARK_.call(null, nval__6753)) {
          return cljs.core.deref.call(null, nval__6753)
        }else {
          var G__6758 = nval__6753;
          var G__6759 = n__6752 + 1;
          val__6751 = G__6758;
          n__6752 = G__6759;
          continue
        }
      }else {
        return val__6751
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
    var cnt__6772 = arr.length;
    if(arr.length === 0) {
      return f.call(null)
    }else {
      var val__6773 = arr[0];
      var n__6774 = 1;
      while(true) {
        if(n__6774 < cnt__6772) {
          var nval__6775 = f.call(null, val__6773, arr[n__6774]);
          if(cljs.core.reduced_QMARK_.call(null, nval__6775)) {
            return cljs.core.deref.call(null, nval__6775)
          }else {
            var G__6784 = nval__6775;
            var G__6785 = n__6774 + 1;
            val__6773 = G__6784;
            n__6774 = G__6785;
            continue
          }
        }else {
          return val__6773
        }
        break
      }
    }
  };
  var array_reduce__3 = function(arr, f, val) {
    var cnt__6776 = arr.length;
    var val__6777 = val;
    var n__6778 = 0;
    while(true) {
      if(n__6778 < cnt__6776) {
        var nval__6779 = f.call(null, val__6777, arr[n__6778]);
        if(cljs.core.reduced_QMARK_.call(null, nval__6779)) {
          return cljs.core.deref.call(null, nval__6779)
        }else {
          var G__6786 = nval__6779;
          var G__6787 = n__6778 + 1;
          val__6777 = G__6786;
          n__6778 = G__6787;
          continue
        }
      }else {
        return val__6777
      }
      break
    }
  };
  var array_reduce__4 = function(arr, f, val, idx) {
    var cnt__6780 = arr.length;
    var val__6781 = val;
    var n__6782 = idx;
    while(true) {
      if(n__6782 < cnt__6780) {
        var nval__6783 = f.call(null, val__6781, arr[n__6782]);
        if(cljs.core.reduced_QMARK_.call(null, nval__6783)) {
          return cljs.core.deref.call(null, nval__6783)
        }else {
          var G__6788 = nval__6783;
          var G__6789 = n__6782 + 1;
          val__6781 = G__6788;
          n__6782 = G__6789;
          continue
        }
      }else {
        return val__6781
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
cljs.core.IndexedSeq.cljs$lang$ctorPrSeq = function(this__2337__auto__) {
  return cljs.core.list.call(null, "cljs.core/IndexedSeq")
};
cljs.core.IndexedSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__6790 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.IndexedSeq.prototype.cljs$core$INext$_next$arity$1 = function(_) {
  var this__6791 = this;
  if(this__6791.i + 1 < this__6791.a.length) {
    return new cljs.core.IndexedSeq(this__6791.a, this__6791.i + 1)
  }else {
    return null
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__6792 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.IndexedSeq.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__6793 = this;
  var c__6794 = coll.cljs$core$ICounted$_count$arity$1(coll);
  if(c__6794 > 0) {
    return new cljs.core.RSeq(coll, c__6794 - 1, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.IndexedSeq.prototype.toString = function() {
  var this__6795 = this;
  var this__6796 = this;
  return cljs.core.pr_str.call(null, this__6796)
};
cljs.core.IndexedSeq.prototype.cljs$core$IReduce$_reduce$arity$2 = function(coll, f) {
  var this__6797 = this;
  if(cljs.core.counted_QMARK_.call(null, this__6797.a)) {
    return cljs.core.ci_reduce.call(null, this__6797.a, f, this__6797.a[this__6797.i], this__6797.i + 1)
  }else {
    return cljs.core.ci_reduce.call(null, coll, f, this__6797.a[this__6797.i], 0)
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$IReduce$_reduce$arity$3 = function(coll, f, start) {
  var this__6798 = this;
  if(cljs.core.counted_QMARK_.call(null, this__6798.a)) {
    return cljs.core.ci_reduce.call(null, this__6798.a, f, start, this__6798.i)
  }else {
    return cljs.core.ci_reduce.call(null, coll, f, start, 0)
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__6799 = this;
  return this$
};
cljs.core.IndexedSeq.prototype.cljs$core$ICounted$_count$arity$1 = function(_) {
  var this__6800 = this;
  return this__6800.a.length - this__6800.i
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(_) {
  var this__6801 = this;
  return this__6801.a[this__6801.i]
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(_) {
  var this__6802 = this;
  if(this__6802.i + 1 < this__6802.a.length) {
    return new cljs.core.IndexedSeq(this__6802.a, this__6802.i + 1)
  }else {
    return cljs.core.list.call(null)
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__6803 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.IndexedSeq.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__6804 = this;
  var i__6805 = n + this__6804.i;
  if(i__6805 < this__6804.a.length) {
    return this__6804.a[i__6805]
  }else {
    return null
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__6806 = this;
  var i__6807 = n + this__6806.i;
  if(i__6807 < this__6806.a.length) {
    return this__6806.a[i__6807]
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
  var G__6808 = null;
  var G__6808__2 = function(array, f) {
    return cljs.core.ci_reduce.call(null, array, f)
  };
  var G__6808__3 = function(array, f, start) {
    return cljs.core.ci_reduce.call(null, array, f, start)
  };
  G__6808 = function(array, f, start) {
    switch(arguments.length) {
      case 2:
        return G__6808__2.call(this, array, f);
      case 3:
        return G__6808__3.call(this, array, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6808
}();
cljs.core.ILookup["array"] = true;
cljs.core._lookup["array"] = function() {
  var G__6809 = null;
  var G__6809__2 = function(array, k) {
    return array[k]
  };
  var G__6809__3 = function(array, k, not_found) {
    return cljs.core._nth.call(null, array, k, not_found)
  };
  G__6809 = function(array, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__6809__2.call(this, array, k);
      case 3:
        return G__6809__3.call(this, array, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6809
}();
cljs.core.IIndexed["array"] = true;
cljs.core._nth["array"] = function() {
  var G__6810 = null;
  var G__6810__2 = function(array, n) {
    if(n < array.length) {
      return array[n]
    }else {
      return null
    }
  };
  var G__6810__3 = function(array, n, not_found) {
    if(n < array.length) {
      return array[n]
    }else {
      return not_found
    }
  };
  G__6810 = function(array, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__6810__2.call(this, array, n);
      case 3:
        return G__6810__3.call(this, array, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6810
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
cljs.core.RSeq.cljs$lang$ctorPrSeq = function(this__2337__auto__) {
  return cljs.core.list.call(null, "cljs.core/RSeq")
};
cljs.core.RSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__6811 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.RSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__6812 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.RSeq.prototype.toString = function() {
  var this__6813 = this;
  var this__6814 = this;
  return cljs.core.pr_str.call(null, this__6814)
};
cljs.core.RSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__6815 = this;
  return coll
};
cljs.core.RSeq.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__6816 = this;
  return this__6816.i + 1
};
cljs.core.RSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__6817 = this;
  return cljs.core._nth.call(null, this__6817.ci, this__6817.i)
};
cljs.core.RSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__6818 = this;
  if(this__6818.i > 0) {
    return new cljs.core.RSeq(this__6818.ci, this__6818.i - 1, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.RSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__6819 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.RSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, new_meta) {
  var this__6820 = this;
  return new cljs.core.RSeq(this__6820.ci, this__6820.i, new_meta)
};
cljs.core.RSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__6821 = this;
  return this__6821.meta
};
cljs.core.RSeq;
cljs.core.seq = function seq(coll) {
  if(coll == null) {
    return null
  }else {
    if(function() {
      var G__6825__6826 = coll;
      if(G__6825__6826) {
        if(function() {
          var or__3824__auto____6827 = G__6825__6826.cljs$lang$protocol_mask$partition0$ & 32;
          if(or__3824__auto____6827) {
            return or__3824__auto____6827
          }else {
            return G__6825__6826.cljs$core$ASeq$
          }
        }()) {
          return true
        }else {
          if(!G__6825__6826.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ASeq, G__6825__6826)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ASeq, G__6825__6826)
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
      var G__6832__6833 = coll;
      if(G__6832__6833) {
        if(function() {
          var or__3824__auto____6834 = G__6832__6833.cljs$lang$protocol_mask$partition0$ & 64;
          if(or__3824__auto____6834) {
            return or__3824__auto____6834
          }else {
            return G__6832__6833.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          if(!G__6832__6833.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__6832__6833)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__6832__6833)
      }
    }()) {
      return cljs.core._first.call(null, coll)
    }else {
      var s__6835 = cljs.core.seq.call(null, coll);
      if(s__6835 == null) {
        return null
      }else {
        return cljs.core._first.call(null, s__6835)
      }
    }
  }
};
cljs.core.rest = function rest(coll) {
  if(!(coll == null)) {
    if(function() {
      var G__6840__6841 = coll;
      if(G__6840__6841) {
        if(function() {
          var or__3824__auto____6842 = G__6840__6841.cljs$lang$protocol_mask$partition0$ & 64;
          if(or__3824__auto____6842) {
            return or__3824__auto____6842
          }else {
            return G__6840__6841.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          if(!G__6840__6841.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__6840__6841)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__6840__6841)
      }
    }()) {
      return cljs.core._rest.call(null, coll)
    }else {
      var s__6843 = cljs.core.seq.call(null, coll);
      if(!(s__6843 == null)) {
        return cljs.core._rest.call(null, s__6843)
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
      var G__6847__6848 = coll;
      if(G__6847__6848) {
        if(function() {
          var or__3824__auto____6849 = G__6847__6848.cljs$lang$protocol_mask$partition0$ & 128;
          if(or__3824__auto____6849) {
            return or__3824__auto____6849
          }else {
            return G__6847__6848.cljs$core$INext$
          }
        }()) {
          return true
        }else {
          if(!G__6847__6848.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.INext, G__6847__6848)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.INext, G__6847__6848)
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
    var sn__6851 = cljs.core.next.call(null, s);
    if(!(sn__6851 == null)) {
      var G__6852 = sn__6851;
      s = G__6852;
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
    var G__6853__delegate = function(coll, x, xs) {
      while(true) {
        if(cljs.core.truth_(xs)) {
          var G__6854 = conj.call(null, coll, x);
          var G__6855 = cljs.core.first.call(null, xs);
          var G__6856 = cljs.core.next.call(null, xs);
          coll = G__6854;
          x = G__6855;
          xs = G__6856;
          continue
        }else {
          return conj.call(null, coll, x)
        }
        break
      }
    };
    var G__6853 = function(coll, x, var_args) {
      var xs = null;
      if(goog.isDef(var_args)) {
        xs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__6853__delegate.call(this, coll, x, xs)
    };
    G__6853.cljs$lang$maxFixedArity = 2;
    G__6853.cljs$lang$applyTo = function(arglist__6857) {
      var coll = cljs.core.first(arglist__6857);
      var x = cljs.core.first(cljs.core.next(arglist__6857));
      var xs = cljs.core.rest(cljs.core.next(arglist__6857));
      return G__6853__delegate(coll, x, xs)
    };
    G__6853.cljs$lang$arity$variadic = G__6853__delegate;
    return G__6853
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
  var s__6860 = cljs.core.seq.call(null, coll);
  var acc__6861 = 0;
  while(true) {
    if(cljs.core.counted_QMARK_.call(null, s__6860)) {
      return acc__6861 + cljs.core._count.call(null, s__6860)
    }else {
      var G__6862 = cljs.core.next.call(null, s__6860);
      var G__6863 = acc__6861 + 1;
      s__6860 = G__6862;
      acc__6861 = G__6863;
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
        var G__6870__6871 = coll;
        if(G__6870__6871) {
          if(function() {
            var or__3824__auto____6872 = G__6870__6871.cljs$lang$protocol_mask$partition0$ & 16;
            if(or__3824__auto____6872) {
              return or__3824__auto____6872
            }else {
              return G__6870__6871.cljs$core$IIndexed$
            }
          }()) {
            return true
          }else {
            if(!G__6870__6871.cljs$lang$protocol_mask$partition0$) {
              return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__6870__6871)
            }else {
              return false
            }
          }
        }else {
          return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__6870__6871)
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
        var G__6873__6874 = coll;
        if(G__6873__6874) {
          if(function() {
            var or__3824__auto____6875 = G__6873__6874.cljs$lang$protocol_mask$partition0$ & 16;
            if(or__3824__auto____6875) {
              return or__3824__auto____6875
            }else {
              return G__6873__6874.cljs$core$IIndexed$
            }
          }()) {
            return true
          }else {
            if(!G__6873__6874.cljs$lang$protocol_mask$partition0$) {
              return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__6873__6874)
            }else {
              return false
            }
          }
        }else {
          return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__6873__6874)
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
    var G__6878__delegate = function(coll, k, v, kvs) {
      while(true) {
        var ret__6877 = assoc.call(null, coll, k, v);
        if(cljs.core.truth_(kvs)) {
          var G__6879 = ret__6877;
          var G__6880 = cljs.core.first.call(null, kvs);
          var G__6881 = cljs.core.second.call(null, kvs);
          var G__6882 = cljs.core.nnext.call(null, kvs);
          coll = G__6879;
          k = G__6880;
          v = G__6881;
          kvs = G__6882;
          continue
        }else {
          return ret__6877
        }
        break
      }
    };
    var G__6878 = function(coll, k, v, var_args) {
      var kvs = null;
      if(goog.isDef(var_args)) {
        kvs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__6878__delegate.call(this, coll, k, v, kvs)
    };
    G__6878.cljs$lang$maxFixedArity = 3;
    G__6878.cljs$lang$applyTo = function(arglist__6883) {
      var coll = cljs.core.first(arglist__6883);
      var k = cljs.core.first(cljs.core.next(arglist__6883));
      var v = cljs.core.first(cljs.core.next(cljs.core.next(arglist__6883)));
      var kvs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__6883)));
      return G__6878__delegate(coll, k, v, kvs)
    };
    G__6878.cljs$lang$arity$variadic = G__6878__delegate;
    return G__6878
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
    var G__6886__delegate = function(coll, k, ks) {
      while(true) {
        var ret__6885 = dissoc.call(null, coll, k);
        if(cljs.core.truth_(ks)) {
          var G__6887 = ret__6885;
          var G__6888 = cljs.core.first.call(null, ks);
          var G__6889 = cljs.core.next.call(null, ks);
          coll = G__6887;
          k = G__6888;
          ks = G__6889;
          continue
        }else {
          return ret__6885
        }
        break
      }
    };
    var G__6886 = function(coll, k, var_args) {
      var ks = null;
      if(goog.isDef(var_args)) {
        ks = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__6886__delegate.call(this, coll, k, ks)
    };
    G__6886.cljs$lang$maxFixedArity = 2;
    G__6886.cljs$lang$applyTo = function(arglist__6890) {
      var coll = cljs.core.first(arglist__6890);
      var k = cljs.core.first(cljs.core.next(arglist__6890));
      var ks = cljs.core.rest(cljs.core.next(arglist__6890));
      return G__6886__delegate(coll, k, ks)
    };
    G__6886.cljs$lang$arity$variadic = G__6886__delegate;
    return G__6886
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
    var G__6894__6895 = o;
    if(G__6894__6895) {
      if(function() {
        var or__3824__auto____6896 = G__6894__6895.cljs$lang$protocol_mask$partition0$ & 131072;
        if(or__3824__auto____6896) {
          return or__3824__auto____6896
        }else {
          return G__6894__6895.cljs$core$IMeta$
        }
      }()) {
        return true
      }else {
        if(!G__6894__6895.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__6894__6895)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__6894__6895)
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
    var G__6899__delegate = function(coll, k, ks) {
      while(true) {
        var ret__6898 = disj.call(null, coll, k);
        if(cljs.core.truth_(ks)) {
          var G__6900 = ret__6898;
          var G__6901 = cljs.core.first.call(null, ks);
          var G__6902 = cljs.core.next.call(null, ks);
          coll = G__6900;
          k = G__6901;
          ks = G__6902;
          continue
        }else {
          return ret__6898
        }
        break
      }
    };
    var G__6899 = function(coll, k, var_args) {
      var ks = null;
      if(goog.isDef(var_args)) {
        ks = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__6899__delegate.call(this, coll, k, ks)
    };
    G__6899.cljs$lang$maxFixedArity = 2;
    G__6899.cljs$lang$applyTo = function(arglist__6903) {
      var coll = cljs.core.first(arglist__6903);
      var k = cljs.core.first(cljs.core.next(arglist__6903));
      var ks = cljs.core.rest(cljs.core.next(arglist__6903));
      return G__6899__delegate(coll, k, ks)
    };
    G__6899.cljs$lang$arity$variadic = G__6899__delegate;
    return G__6899
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
  var h__6905 = goog.string.hashCode(k);
  cljs.core.string_hash_cache[k] = h__6905;
  cljs.core.string_hash_cache_count = cljs.core.string_hash_cache_count + 1;
  return h__6905
};
cljs.core.check_string_hash_cache = function check_string_hash_cache(k) {
  if(cljs.core.string_hash_cache_count > 255) {
    cljs.core.string_hash_cache = {};
    cljs.core.string_hash_cache_count = 0
  }else {
  }
  var h__6907 = cljs.core.string_hash_cache[k];
  if(!(h__6907 == null)) {
    return h__6907
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
      var and__3822__auto____6909 = goog.isString(o);
      if(and__3822__auto____6909) {
        return check_cache
      }else {
        return and__3822__auto____6909
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
    var G__6913__6914 = x;
    if(G__6913__6914) {
      if(function() {
        var or__3824__auto____6915 = G__6913__6914.cljs$lang$protocol_mask$partition0$ & 8;
        if(or__3824__auto____6915) {
          return or__3824__auto____6915
        }else {
          return G__6913__6914.cljs$core$ICollection$
        }
      }()) {
        return true
      }else {
        if(!G__6913__6914.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.ICollection, G__6913__6914)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ICollection, G__6913__6914)
    }
  }
};
cljs.core.set_QMARK_ = function set_QMARK_(x) {
  if(x == null) {
    return false
  }else {
    var G__6919__6920 = x;
    if(G__6919__6920) {
      if(function() {
        var or__3824__auto____6921 = G__6919__6920.cljs$lang$protocol_mask$partition0$ & 4096;
        if(or__3824__auto____6921) {
          return or__3824__auto____6921
        }else {
          return G__6919__6920.cljs$core$ISet$
        }
      }()) {
        return true
      }else {
        if(!G__6919__6920.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.ISet, G__6919__6920)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ISet, G__6919__6920)
    }
  }
};
cljs.core.associative_QMARK_ = function associative_QMARK_(x) {
  var G__6925__6926 = x;
  if(G__6925__6926) {
    if(function() {
      var or__3824__auto____6927 = G__6925__6926.cljs$lang$protocol_mask$partition0$ & 512;
      if(or__3824__auto____6927) {
        return or__3824__auto____6927
      }else {
        return G__6925__6926.cljs$core$IAssociative$
      }
    }()) {
      return true
    }else {
      if(!G__6925__6926.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IAssociative, G__6925__6926)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IAssociative, G__6925__6926)
  }
};
cljs.core.sequential_QMARK_ = function sequential_QMARK_(x) {
  var G__6931__6932 = x;
  if(G__6931__6932) {
    if(function() {
      var or__3824__auto____6933 = G__6931__6932.cljs$lang$protocol_mask$partition0$ & 16777216;
      if(or__3824__auto____6933) {
        return or__3824__auto____6933
      }else {
        return G__6931__6932.cljs$core$ISequential$
      }
    }()) {
      return true
    }else {
      if(!G__6931__6932.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISequential, G__6931__6932)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ISequential, G__6931__6932)
  }
};
cljs.core.counted_QMARK_ = function counted_QMARK_(x) {
  var G__6937__6938 = x;
  if(G__6937__6938) {
    if(function() {
      var or__3824__auto____6939 = G__6937__6938.cljs$lang$protocol_mask$partition0$ & 2;
      if(or__3824__auto____6939) {
        return or__3824__auto____6939
      }else {
        return G__6937__6938.cljs$core$ICounted$
      }
    }()) {
      return true
    }else {
      if(!G__6937__6938.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.ICounted, G__6937__6938)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ICounted, G__6937__6938)
  }
};
cljs.core.indexed_QMARK_ = function indexed_QMARK_(x) {
  var G__6943__6944 = x;
  if(G__6943__6944) {
    if(function() {
      var or__3824__auto____6945 = G__6943__6944.cljs$lang$protocol_mask$partition0$ & 16;
      if(or__3824__auto____6945) {
        return or__3824__auto____6945
      }else {
        return G__6943__6944.cljs$core$IIndexed$
      }
    }()) {
      return true
    }else {
      if(!G__6943__6944.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__6943__6944)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__6943__6944)
  }
};
cljs.core.reduceable_QMARK_ = function reduceable_QMARK_(x) {
  var G__6949__6950 = x;
  if(G__6949__6950) {
    if(function() {
      var or__3824__auto____6951 = G__6949__6950.cljs$lang$protocol_mask$partition0$ & 524288;
      if(or__3824__auto____6951) {
        return or__3824__auto____6951
      }else {
        return G__6949__6950.cljs$core$IReduce$
      }
    }()) {
      return true
    }else {
      if(!G__6949__6950.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__6949__6950)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__6949__6950)
  }
};
cljs.core.map_QMARK_ = function map_QMARK_(x) {
  if(x == null) {
    return false
  }else {
    var G__6955__6956 = x;
    if(G__6955__6956) {
      if(function() {
        var or__3824__auto____6957 = G__6955__6956.cljs$lang$protocol_mask$partition0$ & 1024;
        if(or__3824__auto____6957) {
          return or__3824__auto____6957
        }else {
          return G__6955__6956.cljs$core$IMap$
        }
      }()) {
        return true
      }else {
        if(!G__6955__6956.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IMap, G__6955__6956)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IMap, G__6955__6956)
    }
  }
};
cljs.core.vector_QMARK_ = function vector_QMARK_(x) {
  var G__6961__6962 = x;
  if(G__6961__6962) {
    if(function() {
      var or__3824__auto____6963 = G__6961__6962.cljs$lang$protocol_mask$partition0$ & 16384;
      if(or__3824__auto____6963) {
        return or__3824__auto____6963
      }else {
        return G__6961__6962.cljs$core$IVector$
      }
    }()) {
      return true
    }else {
      if(!G__6961__6962.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IVector, G__6961__6962)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IVector, G__6961__6962)
  }
};
cljs.core.chunked_seq_QMARK_ = function chunked_seq_QMARK_(x) {
  var G__6967__6968 = x;
  if(G__6967__6968) {
    if(cljs.core.truth_(function() {
      var or__3824__auto____6969 = null;
      if(cljs.core.truth_(or__3824__auto____6969)) {
        return or__3824__auto____6969
      }else {
        return G__6967__6968.cljs$core$IChunkedSeq$
      }
    }())) {
      return true
    }else {
      if(!G__6967__6968.cljs$lang$protocol_mask$partition$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IChunkedSeq, G__6967__6968)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IChunkedSeq, G__6967__6968)
  }
};
cljs.core.js_obj = function() {
  var js_obj = null;
  var js_obj__0 = function() {
    return{}
  };
  var js_obj__1 = function() {
    var G__6970__delegate = function(keyvals) {
      return cljs.core.apply.call(null, goog.object.create, keyvals)
    };
    var G__6970 = function(var_args) {
      var keyvals = null;
      if(goog.isDef(var_args)) {
        keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__6970__delegate.call(this, keyvals)
    };
    G__6970.cljs$lang$maxFixedArity = 0;
    G__6970.cljs$lang$applyTo = function(arglist__6971) {
      var keyvals = cljs.core.seq(arglist__6971);
      return G__6970__delegate(keyvals)
    };
    G__6970.cljs$lang$arity$variadic = G__6970__delegate;
    return G__6970
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
  var keys__6973 = [];
  goog.object.forEach(obj, function(val, key, obj) {
    return keys__6973.push(key)
  });
  return keys__6973
};
cljs.core.js_delete = function js_delete(obj, key) {
  return delete obj[key]
};
cljs.core.array_copy = function array_copy(from, i, to, j, len) {
  var i__6977 = i;
  var j__6978 = j;
  var len__6979 = len;
  while(true) {
    if(len__6979 === 0) {
      return to
    }else {
      to[j__6978] = from[i__6977];
      var G__6980 = i__6977 + 1;
      var G__6981 = j__6978 + 1;
      var G__6982 = len__6979 - 1;
      i__6977 = G__6980;
      j__6978 = G__6981;
      len__6979 = G__6982;
      continue
    }
    break
  }
};
cljs.core.array_copy_downward = function array_copy_downward(from, i, to, j, len) {
  var i__6986 = i + (len - 1);
  var j__6987 = j + (len - 1);
  var len__6988 = len;
  while(true) {
    if(len__6988 === 0) {
      return to
    }else {
      to[j__6987] = from[i__6986];
      var G__6989 = i__6986 - 1;
      var G__6990 = j__6987 - 1;
      var G__6991 = len__6988 - 1;
      i__6986 = G__6989;
      j__6987 = G__6990;
      len__6988 = G__6991;
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
    var G__6995__6996 = s;
    if(G__6995__6996) {
      if(function() {
        var or__3824__auto____6997 = G__6995__6996.cljs$lang$protocol_mask$partition0$ & 64;
        if(or__3824__auto____6997) {
          return or__3824__auto____6997
        }else {
          return G__6995__6996.cljs$core$ISeq$
        }
      }()) {
        return true
      }else {
        if(!G__6995__6996.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__6995__6996)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__6995__6996)
    }
  }
};
cljs.core.seqable_QMARK_ = function seqable_QMARK_(s) {
  var G__7001__7002 = s;
  if(G__7001__7002) {
    if(function() {
      var or__3824__auto____7003 = G__7001__7002.cljs$lang$protocol_mask$partition0$ & 8388608;
      if(or__3824__auto____7003) {
        return or__3824__auto____7003
      }else {
        return G__7001__7002.cljs$core$ISeqable$
      }
    }()) {
      return true
    }else {
      if(!G__7001__7002.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeqable, G__7001__7002)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ISeqable, G__7001__7002)
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
  var and__3822__auto____7006 = goog.isString(x);
  if(and__3822__auto____7006) {
    return!function() {
      var or__3824__auto____7007 = x.charAt(0) === "\ufdd0";
      if(or__3824__auto____7007) {
        return or__3824__auto____7007
      }else {
        return x.charAt(0) === "\ufdd1"
      }
    }()
  }else {
    return and__3822__auto____7006
  }
};
cljs.core.keyword_QMARK_ = function keyword_QMARK_(x) {
  var and__3822__auto____7009 = goog.isString(x);
  if(and__3822__auto____7009) {
    return x.charAt(0) === "\ufdd0"
  }else {
    return and__3822__auto____7009
  }
};
cljs.core.symbol_QMARK_ = function symbol_QMARK_(x) {
  var and__3822__auto____7011 = goog.isString(x);
  if(and__3822__auto____7011) {
    return x.charAt(0) === "\ufdd1"
  }else {
    return and__3822__auto____7011
  }
};
cljs.core.number_QMARK_ = function number_QMARK_(n) {
  return goog.isNumber(n)
};
cljs.core.fn_QMARK_ = function fn_QMARK_(f) {
  return goog.isFunction(f)
};
cljs.core.ifn_QMARK_ = function ifn_QMARK_(f) {
  var or__3824__auto____7016 = cljs.core.fn_QMARK_.call(null, f);
  if(or__3824__auto____7016) {
    return or__3824__auto____7016
  }else {
    var G__7017__7018 = f;
    if(G__7017__7018) {
      if(function() {
        var or__3824__auto____7019 = G__7017__7018.cljs$lang$protocol_mask$partition0$ & 1;
        if(or__3824__auto____7019) {
          return or__3824__auto____7019
        }else {
          return G__7017__7018.cljs$core$IFn$
        }
      }()) {
        return true
      }else {
        if(!G__7017__7018.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IFn, G__7017__7018)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IFn, G__7017__7018)
    }
  }
};
cljs.core.integer_QMARK_ = function integer_QMARK_(n) {
  var and__3822__auto____7021 = cljs.core.number_QMARK_.call(null, n);
  if(and__3822__auto____7021) {
    return n == n.toFixed()
  }else {
    return and__3822__auto____7021
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
    var and__3822__auto____7024 = coll;
    if(cljs.core.truth_(and__3822__auto____7024)) {
      var and__3822__auto____7025 = cljs.core.associative_QMARK_.call(null, coll);
      if(and__3822__auto____7025) {
        return cljs.core.contains_QMARK_.call(null, coll, k)
      }else {
        return and__3822__auto____7025
      }
    }else {
      return and__3822__auto____7024
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
    var G__7034__delegate = function(x, y, more) {
      if(!cljs.core._EQ_.call(null, x, y)) {
        var s__7030 = cljs.core.PersistentHashSet.fromArray([y, x]);
        var xs__7031 = more;
        while(true) {
          var x__7032 = cljs.core.first.call(null, xs__7031);
          var etc__7033 = cljs.core.next.call(null, xs__7031);
          if(cljs.core.truth_(xs__7031)) {
            if(cljs.core.contains_QMARK_.call(null, s__7030, x__7032)) {
              return false
            }else {
              var G__7035 = cljs.core.conj.call(null, s__7030, x__7032);
              var G__7036 = etc__7033;
              s__7030 = G__7035;
              xs__7031 = G__7036;
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
    var G__7034 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7034__delegate.call(this, x, y, more)
    };
    G__7034.cljs$lang$maxFixedArity = 2;
    G__7034.cljs$lang$applyTo = function(arglist__7037) {
      var x = cljs.core.first(arglist__7037);
      var y = cljs.core.first(cljs.core.next(arglist__7037));
      var more = cljs.core.rest(cljs.core.next(arglist__7037));
      return G__7034__delegate(x, y, more)
    };
    G__7034.cljs$lang$arity$variadic = G__7034__delegate;
    return G__7034
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
            var G__7041__7042 = x;
            if(G__7041__7042) {
              if(cljs.core.truth_(function() {
                var or__3824__auto____7043 = null;
                if(cljs.core.truth_(or__3824__auto____7043)) {
                  return or__3824__auto____7043
                }else {
                  return G__7041__7042.cljs$core$IComparable$
                }
              }())) {
                return true
              }else {
                if(!G__7041__7042.cljs$lang$protocol_mask$partition$) {
                  return cljs.core.type_satisfies_.call(null, cljs.core.IComparable, G__7041__7042)
                }else {
                  return false
                }
              }
            }else {
              return cljs.core.type_satisfies_.call(null, cljs.core.IComparable, G__7041__7042)
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
    var xl__7048 = cljs.core.count.call(null, xs);
    var yl__7049 = cljs.core.count.call(null, ys);
    if(xl__7048 < yl__7049) {
      return-1
    }else {
      if(xl__7048 > yl__7049) {
        return 1
      }else {
        if("\ufdd0'else") {
          return compare_indexed.call(null, xs, ys, xl__7048, 0)
        }else {
          return null
        }
      }
    }
  };
  var compare_indexed__4 = function(xs, ys, len, n) {
    while(true) {
      var d__7050 = cljs.core.compare.call(null, cljs.core.nth.call(null, xs, n), cljs.core.nth.call(null, ys, n));
      if(function() {
        var and__3822__auto____7051 = d__7050 === 0;
        if(and__3822__auto____7051) {
          return n + 1 < len
        }else {
          return and__3822__auto____7051
        }
      }()) {
        var G__7052 = xs;
        var G__7053 = ys;
        var G__7054 = len;
        var G__7055 = n + 1;
        xs = G__7052;
        ys = G__7053;
        len = G__7054;
        n = G__7055;
        continue
      }else {
        return d__7050
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
      var r__7057 = f.call(null, x, y);
      if(cljs.core.number_QMARK_.call(null, r__7057)) {
        return r__7057
      }else {
        if(cljs.core.truth_(r__7057)) {
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
      var a__7059 = cljs.core.to_array.call(null, coll);
      goog.array.stableSort(a__7059, cljs.core.fn__GT_comparator.call(null, comp));
      return cljs.core.seq.call(null, a__7059)
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
    var temp__3971__auto____7065 = cljs.core.seq.call(null, coll);
    if(temp__3971__auto____7065) {
      var s__7066 = temp__3971__auto____7065;
      return cljs.core.reduce.call(null, f, cljs.core.first.call(null, s__7066), cljs.core.next.call(null, s__7066))
    }else {
      return f.call(null)
    }
  };
  var seq_reduce__3 = function(f, val, coll) {
    var val__7067 = val;
    var coll__7068 = cljs.core.seq.call(null, coll);
    while(true) {
      if(coll__7068) {
        var nval__7069 = f.call(null, val__7067, cljs.core.first.call(null, coll__7068));
        if(cljs.core.reduced_QMARK_.call(null, nval__7069)) {
          return cljs.core.deref.call(null, nval__7069)
        }else {
          var G__7070 = nval__7069;
          var G__7071 = cljs.core.next.call(null, coll__7068);
          val__7067 = G__7070;
          coll__7068 = G__7071;
          continue
        }
      }else {
        return val__7067
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
  var a__7073 = cljs.core.to_array.call(null, coll);
  goog.array.shuffle(a__7073);
  return cljs.core.vec.call(null, a__7073)
};
cljs.core.reduce = function() {
  var reduce = null;
  var reduce__2 = function(f, coll) {
    if(function() {
      var G__7080__7081 = coll;
      if(G__7080__7081) {
        if(function() {
          var or__3824__auto____7082 = G__7080__7081.cljs$lang$protocol_mask$partition0$ & 524288;
          if(or__3824__auto____7082) {
            return or__3824__auto____7082
          }else {
            return G__7080__7081.cljs$core$IReduce$
          }
        }()) {
          return true
        }else {
          if(!G__7080__7081.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__7080__7081)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__7080__7081)
      }
    }()) {
      return cljs.core._reduce.call(null, coll, f)
    }else {
      return cljs.core.seq_reduce.call(null, f, coll)
    }
  };
  var reduce__3 = function(f, val, coll) {
    if(function() {
      var G__7083__7084 = coll;
      if(G__7083__7084) {
        if(function() {
          var or__3824__auto____7085 = G__7083__7084.cljs$lang$protocol_mask$partition0$ & 524288;
          if(or__3824__auto____7085) {
            return or__3824__auto____7085
          }else {
            return G__7083__7084.cljs$core$IReduce$
          }
        }()) {
          return true
        }else {
          if(!G__7083__7084.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__7083__7084)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__7083__7084)
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
cljs.core.Reduced.cljs$lang$ctorPrSeq = function(this__2337__auto__) {
  return cljs.core.list.call(null, "cljs.core/Reduced")
};
cljs.core.Reduced.prototype.cljs$core$IDeref$_deref$arity$1 = function(o) {
  var this__7086 = this;
  return this__7086.val
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
    var G__7087__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _PLUS_, x + y, more)
    };
    var G__7087 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7087__delegate.call(this, x, y, more)
    };
    G__7087.cljs$lang$maxFixedArity = 2;
    G__7087.cljs$lang$applyTo = function(arglist__7088) {
      var x = cljs.core.first(arglist__7088);
      var y = cljs.core.first(cljs.core.next(arglist__7088));
      var more = cljs.core.rest(cljs.core.next(arglist__7088));
      return G__7087__delegate(x, y, more)
    };
    G__7087.cljs$lang$arity$variadic = G__7087__delegate;
    return G__7087
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
    var G__7089__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _, x - y, more)
    };
    var G__7089 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7089__delegate.call(this, x, y, more)
    };
    G__7089.cljs$lang$maxFixedArity = 2;
    G__7089.cljs$lang$applyTo = function(arglist__7090) {
      var x = cljs.core.first(arglist__7090);
      var y = cljs.core.first(cljs.core.next(arglist__7090));
      var more = cljs.core.rest(cljs.core.next(arglist__7090));
      return G__7089__delegate(x, y, more)
    };
    G__7089.cljs$lang$arity$variadic = G__7089__delegate;
    return G__7089
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
    var G__7091__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _STAR_, x * y, more)
    };
    var G__7091 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7091__delegate.call(this, x, y, more)
    };
    G__7091.cljs$lang$maxFixedArity = 2;
    G__7091.cljs$lang$applyTo = function(arglist__7092) {
      var x = cljs.core.first(arglist__7092);
      var y = cljs.core.first(cljs.core.next(arglist__7092));
      var more = cljs.core.rest(cljs.core.next(arglist__7092));
      return G__7091__delegate(x, y, more)
    };
    G__7091.cljs$lang$arity$variadic = G__7091__delegate;
    return G__7091
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
    var G__7093__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _SLASH_, _SLASH_.call(null, x, y), more)
    };
    var G__7093 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7093__delegate.call(this, x, y, more)
    };
    G__7093.cljs$lang$maxFixedArity = 2;
    G__7093.cljs$lang$applyTo = function(arglist__7094) {
      var x = cljs.core.first(arglist__7094);
      var y = cljs.core.first(cljs.core.next(arglist__7094));
      var more = cljs.core.rest(cljs.core.next(arglist__7094));
      return G__7093__delegate(x, y, more)
    };
    G__7093.cljs$lang$arity$variadic = G__7093__delegate;
    return G__7093
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
    var G__7095__delegate = function(x, y, more) {
      while(true) {
        if(x < y) {
          if(cljs.core.next.call(null, more)) {
            var G__7096 = y;
            var G__7097 = cljs.core.first.call(null, more);
            var G__7098 = cljs.core.next.call(null, more);
            x = G__7096;
            y = G__7097;
            more = G__7098;
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
    var G__7095 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7095__delegate.call(this, x, y, more)
    };
    G__7095.cljs$lang$maxFixedArity = 2;
    G__7095.cljs$lang$applyTo = function(arglist__7099) {
      var x = cljs.core.first(arglist__7099);
      var y = cljs.core.first(cljs.core.next(arglist__7099));
      var more = cljs.core.rest(cljs.core.next(arglist__7099));
      return G__7095__delegate(x, y, more)
    };
    G__7095.cljs$lang$arity$variadic = G__7095__delegate;
    return G__7095
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
    var G__7100__delegate = function(x, y, more) {
      while(true) {
        if(x <= y) {
          if(cljs.core.next.call(null, more)) {
            var G__7101 = y;
            var G__7102 = cljs.core.first.call(null, more);
            var G__7103 = cljs.core.next.call(null, more);
            x = G__7101;
            y = G__7102;
            more = G__7103;
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
    var G__7100 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7100__delegate.call(this, x, y, more)
    };
    G__7100.cljs$lang$maxFixedArity = 2;
    G__7100.cljs$lang$applyTo = function(arglist__7104) {
      var x = cljs.core.first(arglist__7104);
      var y = cljs.core.first(cljs.core.next(arglist__7104));
      var more = cljs.core.rest(cljs.core.next(arglist__7104));
      return G__7100__delegate(x, y, more)
    };
    G__7100.cljs$lang$arity$variadic = G__7100__delegate;
    return G__7100
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
    var G__7105__delegate = function(x, y, more) {
      while(true) {
        if(x > y) {
          if(cljs.core.next.call(null, more)) {
            var G__7106 = y;
            var G__7107 = cljs.core.first.call(null, more);
            var G__7108 = cljs.core.next.call(null, more);
            x = G__7106;
            y = G__7107;
            more = G__7108;
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
    var G__7105 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7105__delegate.call(this, x, y, more)
    };
    G__7105.cljs$lang$maxFixedArity = 2;
    G__7105.cljs$lang$applyTo = function(arglist__7109) {
      var x = cljs.core.first(arglist__7109);
      var y = cljs.core.first(cljs.core.next(arglist__7109));
      var more = cljs.core.rest(cljs.core.next(arglist__7109));
      return G__7105__delegate(x, y, more)
    };
    G__7105.cljs$lang$arity$variadic = G__7105__delegate;
    return G__7105
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
    var G__7110__delegate = function(x, y, more) {
      while(true) {
        if(x >= y) {
          if(cljs.core.next.call(null, more)) {
            var G__7111 = y;
            var G__7112 = cljs.core.first.call(null, more);
            var G__7113 = cljs.core.next.call(null, more);
            x = G__7111;
            y = G__7112;
            more = G__7113;
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
    var G__7110 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7110__delegate.call(this, x, y, more)
    };
    G__7110.cljs$lang$maxFixedArity = 2;
    G__7110.cljs$lang$applyTo = function(arglist__7114) {
      var x = cljs.core.first(arglist__7114);
      var y = cljs.core.first(cljs.core.next(arglist__7114));
      var more = cljs.core.rest(cljs.core.next(arglist__7114));
      return G__7110__delegate(x, y, more)
    };
    G__7110.cljs$lang$arity$variadic = G__7110__delegate;
    return G__7110
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
    var G__7115__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, max, x > y ? x : y, more)
    };
    var G__7115 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7115__delegate.call(this, x, y, more)
    };
    G__7115.cljs$lang$maxFixedArity = 2;
    G__7115.cljs$lang$applyTo = function(arglist__7116) {
      var x = cljs.core.first(arglist__7116);
      var y = cljs.core.first(cljs.core.next(arglist__7116));
      var more = cljs.core.rest(cljs.core.next(arglist__7116));
      return G__7115__delegate(x, y, more)
    };
    G__7115.cljs$lang$arity$variadic = G__7115__delegate;
    return G__7115
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
    var G__7117__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, min, x < y ? x : y, more)
    };
    var G__7117 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7117__delegate.call(this, x, y, more)
    };
    G__7117.cljs$lang$maxFixedArity = 2;
    G__7117.cljs$lang$applyTo = function(arglist__7118) {
      var x = cljs.core.first(arglist__7118);
      var y = cljs.core.first(cljs.core.next(arglist__7118));
      var more = cljs.core.rest(cljs.core.next(arglist__7118));
      return G__7117__delegate(x, y, more)
    };
    G__7117.cljs$lang$arity$variadic = G__7117__delegate;
    return G__7117
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
  var rem__7120 = n % d;
  return cljs.core.fix.call(null, (n - rem__7120) / d)
};
cljs.core.rem = function rem(n, d) {
  var q__7122 = cljs.core.quot.call(null, n, d);
  return n - d * q__7122
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
  var v__7125 = v - (v >> 1 & 1431655765);
  var v__7126 = (v__7125 & 858993459) + (v__7125 >> 2 & 858993459);
  return(v__7126 + (v__7126 >> 4) & 252645135) * 16843009 >> 24
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
    var G__7127__delegate = function(x, y, more) {
      while(true) {
        if(cljs.core.truth_(_EQ__EQ_.call(null, x, y))) {
          if(cljs.core.next.call(null, more)) {
            var G__7128 = y;
            var G__7129 = cljs.core.first.call(null, more);
            var G__7130 = cljs.core.next.call(null, more);
            x = G__7128;
            y = G__7129;
            more = G__7130;
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
    var G__7127 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7127__delegate.call(this, x, y, more)
    };
    G__7127.cljs$lang$maxFixedArity = 2;
    G__7127.cljs$lang$applyTo = function(arglist__7131) {
      var x = cljs.core.first(arglist__7131);
      var y = cljs.core.first(cljs.core.next(arglist__7131));
      var more = cljs.core.rest(cljs.core.next(arglist__7131));
      return G__7127__delegate(x, y, more)
    };
    G__7127.cljs$lang$arity$variadic = G__7127__delegate;
    return G__7127
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
  var n__7135 = n;
  var xs__7136 = cljs.core.seq.call(null, coll);
  while(true) {
    if(cljs.core.truth_(function() {
      var and__3822__auto____7137 = xs__7136;
      if(and__3822__auto____7137) {
        return n__7135 > 0
      }else {
        return and__3822__auto____7137
      }
    }())) {
      var G__7138 = n__7135 - 1;
      var G__7139 = cljs.core.next.call(null, xs__7136);
      n__7135 = G__7138;
      xs__7136 = G__7139;
      continue
    }else {
      return xs__7136
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
    var G__7140__delegate = function(x, ys) {
      return function(sb, more) {
        while(true) {
          if(cljs.core.truth_(more)) {
            var G__7141 = sb.append(str_STAR_.call(null, cljs.core.first.call(null, more)));
            var G__7142 = cljs.core.next.call(null, more);
            sb = G__7141;
            more = G__7142;
            continue
          }else {
            return str_STAR_.call(null, sb)
          }
          break
        }
      }.call(null, new goog.string.StringBuffer(str_STAR_.call(null, x)), ys)
    };
    var G__7140 = function(x, var_args) {
      var ys = null;
      if(goog.isDef(var_args)) {
        ys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__7140__delegate.call(this, x, ys)
    };
    G__7140.cljs$lang$maxFixedArity = 1;
    G__7140.cljs$lang$applyTo = function(arglist__7143) {
      var x = cljs.core.first(arglist__7143);
      var ys = cljs.core.rest(arglist__7143);
      return G__7140__delegate(x, ys)
    };
    G__7140.cljs$lang$arity$variadic = G__7140__delegate;
    return G__7140
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
    var G__7144__delegate = function(x, ys) {
      return function(sb, more) {
        while(true) {
          if(cljs.core.truth_(more)) {
            var G__7145 = sb.append(str.call(null, cljs.core.first.call(null, more)));
            var G__7146 = cljs.core.next.call(null, more);
            sb = G__7145;
            more = G__7146;
            continue
          }else {
            return cljs.core.str_STAR_.call(null, sb)
          }
          break
        }
      }.call(null, new goog.string.StringBuffer(str.call(null, x)), ys)
    };
    var G__7144 = function(x, var_args) {
      var ys = null;
      if(goog.isDef(var_args)) {
        ys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__7144__delegate.call(this, x, ys)
    };
    G__7144.cljs$lang$maxFixedArity = 1;
    G__7144.cljs$lang$applyTo = function(arglist__7147) {
      var x = cljs.core.first(arglist__7147);
      var ys = cljs.core.rest(arglist__7147);
      return G__7144__delegate(x, ys)
    };
    G__7144.cljs$lang$arity$variadic = G__7144__delegate;
    return G__7144
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
  format.cljs$lang$applyTo = function(arglist__7148) {
    var fmt = cljs.core.first(arglist__7148);
    var args = cljs.core.rest(arglist__7148);
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
    var xs__7151 = cljs.core.seq.call(null, x);
    var ys__7152 = cljs.core.seq.call(null, y);
    while(true) {
      if(xs__7151 == null) {
        return ys__7152 == null
      }else {
        if(ys__7152 == null) {
          return false
        }else {
          if(cljs.core._EQ_.call(null, cljs.core.first.call(null, xs__7151), cljs.core.first.call(null, ys__7152))) {
            var G__7153 = cljs.core.next.call(null, xs__7151);
            var G__7154 = cljs.core.next.call(null, ys__7152);
            xs__7151 = G__7153;
            ys__7152 = G__7154;
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
  return cljs.core.reduce.call(null, function(p1__7155_SHARP_, p2__7156_SHARP_) {
    return cljs.core.hash_combine.call(null, p1__7155_SHARP_, cljs.core.hash.call(null, p2__7156_SHARP_, false))
  }, cljs.core.hash.call(null, cljs.core.first.call(null, coll), false), cljs.core.next.call(null, coll))
};
cljs.core.hash_imap = function hash_imap(m) {
  var h__7160 = 0;
  var s__7161 = cljs.core.seq.call(null, m);
  while(true) {
    if(s__7161) {
      var e__7162 = cljs.core.first.call(null, s__7161);
      var G__7163 = (h__7160 + (cljs.core.hash.call(null, cljs.core.key.call(null, e__7162)) ^ cljs.core.hash.call(null, cljs.core.val.call(null, e__7162)))) % 4503599627370496;
      var G__7164 = cljs.core.next.call(null, s__7161);
      h__7160 = G__7163;
      s__7161 = G__7164;
      continue
    }else {
      return h__7160
    }
    break
  }
};
cljs.core.hash_iset = function hash_iset(s) {
  var h__7168 = 0;
  var s__7169 = cljs.core.seq.call(null, s);
  while(true) {
    if(s__7169) {
      var e__7170 = cljs.core.first.call(null, s__7169);
      var G__7171 = (h__7168 + cljs.core.hash.call(null, e__7170)) % 4503599627370496;
      var G__7172 = cljs.core.next.call(null, s__7169);
      h__7168 = G__7171;
      s__7169 = G__7172;
      continue
    }else {
      return h__7168
    }
    break
  }
};
cljs.core.extend_object_BANG_ = function extend_object_BANG_(obj, fn_map) {
  var G__7193__7194 = cljs.core.seq.call(null, fn_map);
  if(G__7193__7194) {
    var G__7196__7198 = cljs.core.first.call(null, G__7193__7194);
    var vec__7197__7199 = G__7196__7198;
    var key_name__7200 = cljs.core.nth.call(null, vec__7197__7199, 0, null);
    var f__7201 = cljs.core.nth.call(null, vec__7197__7199, 1, null);
    var G__7193__7202 = G__7193__7194;
    var G__7196__7203 = G__7196__7198;
    var G__7193__7204 = G__7193__7202;
    while(true) {
      var vec__7205__7206 = G__7196__7203;
      var key_name__7207 = cljs.core.nth.call(null, vec__7205__7206, 0, null);
      var f__7208 = cljs.core.nth.call(null, vec__7205__7206, 1, null);
      var G__7193__7209 = G__7193__7204;
      var str_name__7210 = cljs.core.name.call(null, key_name__7207);
      obj[str_name__7210] = f__7208;
      var temp__3974__auto____7211 = cljs.core.next.call(null, G__7193__7209);
      if(temp__3974__auto____7211) {
        var G__7193__7212 = temp__3974__auto____7211;
        var G__7213 = cljs.core.first.call(null, G__7193__7212);
        var G__7214 = G__7193__7212;
        G__7196__7203 = G__7213;
        G__7193__7204 = G__7214;
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
cljs.core.List.cljs$lang$ctorPrSeq = function(this__2337__auto__) {
  return cljs.core.list.call(null, "cljs.core/List")
};
cljs.core.List.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__7215 = this;
  var h__2220__auto____7216 = this__7215.__hash;
  if(!(h__2220__auto____7216 == null)) {
    return h__2220__auto____7216
  }else {
    var h__2220__auto____7217 = cljs.core.hash_coll.call(null, coll);
    this__7215.__hash = h__2220__auto____7217;
    return h__2220__auto____7217
  }
};
cljs.core.List.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var this__7218 = this;
  if(this__7218.count === 1) {
    return null
  }else {
    return this__7218.rest
  }
};
cljs.core.List.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__7219 = this;
  return new cljs.core.List(this__7219.meta, o, coll, this__7219.count + 1, null)
};
cljs.core.List.prototype.toString = function() {
  var this__7220 = this;
  var this__7221 = this;
  return cljs.core.pr_str.call(null, this__7221)
};
cljs.core.List.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__7222 = this;
  return coll
};
cljs.core.List.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__7223 = this;
  return this__7223.count
};
cljs.core.List.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__7224 = this;
  return this__7224.first
};
cljs.core.List.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__7225 = this;
  return coll.cljs$core$ISeq$_rest$arity$1(coll)
};
cljs.core.List.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__7226 = this;
  return this__7226.first
};
cljs.core.List.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__7227 = this;
  if(this__7227.count === 1) {
    return cljs.core.List.EMPTY
  }else {
    return this__7227.rest
  }
};
cljs.core.List.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__7228 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.List.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__7229 = this;
  return new cljs.core.List(meta, this__7229.first, this__7229.rest, this__7229.count, this__7229.__hash)
};
cljs.core.List.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__7230 = this;
  return this__7230.meta
};
cljs.core.List.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__7231 = this;
  return cljs.core.List.EMPTY
};
cljs.core.List;
cljs.core.EmptyList = function(meta) {
  this.meta = meta;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 65413326
};
cljs.core.EmptyList.cljs$lang$type = true;
cljs.core.EmptyList.cljs$lang$ctorPrSeq = function(this__2337__auto__) {
  return cljs.core.list.call(null, "cljs.core/EmptyList")
};
cljs.core.EmptyList.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__7232 = this;
  return 0
};
cljs.core.EmptyList.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var this__7233 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__7234 = this;
  return new cljs.core.List(this__7234.meta, o, null, 1, null)
};
cljs.core.EmptyList.prototype.toString = function() {
  var this__7235 = this;
  var this__7236 = this;
  return cljs.core.pr_str.call(null, this__7236)
};
cljs.core.EmptyList.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__7237 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__7238 = this;
  return 0
};
cljs.core.EmptyList.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__7239 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__7240 = this;
  throw new Error("Can't pop empty list");
};
cljs.core.EmptyList.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__7241 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__7242 = this;
  return cljs.core.List.EMPTY
};
cljs.core.EmptyList.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__7243 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.EmptyList.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__7244 = this;
  return new cljs.core.EmptyList(meta)
};
cljs.core.EmptyList.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__7245 = this;
  return this__7245.meta
};
cljs.core.EmptyList.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__7246 = this;
  return coll
};
cljs.core.EmptyList;
cljs.core.List.EMPTY = new cljs.core.EmptyList(null);
cljs.core.reversible_QMARK_ = function reversible_QMARK_(coll) {
  var G__7250__7251 = coll;
  if(G__7250__7251) {
    if(function() {
      var or__3824__auto____7252 = G__7250__7251.cljs$lang$protocol_mask$partition0$ & 134217728;
      if(or__3824__auto____7252) {
        return or__3824__auto____7252
      }else {
        return G__7250__7251.cljs$core$IReversible$
      }
    }()) {
      return true
    }else {
      if(!G__7250__7251.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReversible, G__7250__7251)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IReversible, G__7250__7251)
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
    var G__7253__delegate = function(x, y, z, items) {
      return cljs.core.conj.call(null, cljs.core.conj.call(null, cljs.core.conj.call(null, cljs.core.reduce.call(null, cljs.core.conj, cljs.core.List.EMPTY, cljs.core.reverse.call(null, items)), z), y), x)
    };
    var G__7253 = function(x, y, z, var_args) {
      var items = null;
      if(goog.isDef(var_args)) {
        items = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__7253__delegate.call(this, x, y, z, items)
    };
    G__7253.cljs$lang$maxFixedArity = 3;
    G__7253.cljs$lang$applyTo = function(arglist__7254) {
      var x = cljs.core.first(arglist__7254);
      var y = cljs.core.first(cljs.core.next(arglist__7254));
      var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7254)));
      var items = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7254)));
      return G__7253__delegate(x, y, z, items)
    };
    G__7253.cljs$lang$arity$variadic = G__7253__delegate;
    return G__7253
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
cljs.core.Cons.cljs$lang$ctorPrSeq = function(this__2337__auto__) {
  return cljs.core.list.call(null, "cljs.core/Cons")
};
cljs.core.Cons.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__7255 = this;
  var h__2220__auto____7256 = this__7255.__hash;
  if(!(h__2220__auto____7256 == null)) {
    return h__2220__auto____7256
  }else {
    var h__2220__auto____7257 = cljs.core.hash_coll.call(null, coll);
    this__7255.__hash = h__2220__auto____7257;
    return h__2220__auto____7257
  }
};
cljs.core.Cons.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var this__7258 = this;
  if(this__7258.rest == null) {
    return null
  }else {
    return cljs.core._seq.call(null, this__7258.rest)
  }
};
cljs.core.Cons.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__7259 = this;
  return new cljs.core.Cons(null, o, coll, this__7259.__hash)
};
cljs.core.Cons.prototype.toString = function() {
  var this__7260 = this;
  var this__7261 = this;
  return cljs.core.pr_str.call(null, this__7261)
};
cljs.core.Cons.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__7262 = this;
  return coll
};
cljs.core.Cons.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__7263 = this;
  return this__7263.first
};
cljs.core.Cons.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__7264 = this;
  if(this__7264.rest == null) {
    return cljs.core.List.EMPTY
  }else {
    return this__7264.rest
  }
};
cljs.core.Cons.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__7265 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Cons.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__7266 = this;
  return new cljs.core.Cons(meta, this__7266.first, this__7266.rest, this__7266.__hash)
};
cljs.core.Cons.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__7267 = this;
  return this__7267.meta
};
cljs.core.Cons.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__7268 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__7268.meta)
};
cljs.core.Cons;
cljs.core.cons = function cons(x, coll) {
  if(function() {
    var or__3824__auto____7273 = coll == null;
    if(or__3824__auto____7273) {
      return or__3824__auto____7273
    }else {
      var G__7274__7275 = coll;
      if(G__7274__7275) {
        if(function() {
          var or__3824__auto____7276 = G__7274__7275.cljs$lang$protocol_mask$partition0$ & 64;
          if(or__3824__auto____7276) {
            return or__3824__auto____7276
          }else {
            return G__7274__7275.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          if(!G__7274__7275.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__7274__7275)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__7274__7275)
      }
    }
  }()) {
    return new cljs.core.Cons(null, x, coll, null)
  }else {
    return new cljs.core.Cons(null, x, cljs.core.seq.call(null, coll), null)
  }
};
cljs.core.list_QMARK_ = function list_QMARK_(x) {
  var G__7280__7281 = x;
  if(G__7280__7281) {
    if(function() {
      var or__3824__auto____7282 = G__7280__7281.cljs$lang$protocol_mask$partition0$ & 33554432;
      if(or__3824__auto____7282) {
        return or__3824__auto____7282
      }else {
        return G__7280__7281.cljs$core$IList$
      }
    }()) {
      return true
    }else {
      if(!G__7280__7281.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IList, G__7280__7281)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IList, G__7280__7281)
  }
};
cljs.core.IReduce["string"] = true;
cljs.core._reduce["string"] = function() {
  var G__7283 = null;
  var G__7283__2 = function(string, f) {
    return cljs.core.ci_reduce.call(null, string, f)
  };
  var G__7283__3 = function(string, f, start) {
    return cljs.core.ci_reduce.call(null, string, f, start)
  };
  G__7283 = function(string, f, start) {
    switch(arguments.length) {
      case 2:
        return G__7283__2.call(this, string, f);
      case 3:
        return G__7283__3.call(this, string, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__7283
}();
cljs.core.ILookup["string"] = true;
cljs.core._lookup["string"] = function() {
  var G__7284 = null;
  var G__7284__2 = function(string, k) {
    return cljs.core._nth.call(null, string, k)
  };
  var G__7284__3 = function(string, k, not_found) {
    return cljs.core._nth.call(null, string, k, not_found)
  };
  G__7284 = function(string, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__7284__2.call(this, string, k);
      case 3:
        return G__7284__3.call(this, string, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__7284
}();
cljs.core.IIndexed["string"] = true;
cljs.core._nth["string"] = function() {
  var G__7285 = null;
  var G__7285__2 = function(string, n) {
    if(n < cljs.core._count.call(null, string)) {
      return string.charAt(n)
    }else {
      return null
    }
  };
  var G__7285__3 = function(string, n, not_found) {
    if(n < cljs.core._count.call(null, string)) {
      return string.charAt(n)
    }else {
      return not_found
    }
  };
  G__7285 = function(string, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__7285__2.call(this, string, n);
      case 3:
        return G__7285__3.call(this, string, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__7285
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
cljs.core.Keyword.cljs$lang$ctorPrSeq = function(this__2337__auto__) {
  return cljs.core.list.call(null, "cljs.core/Keyword")
};
cljs.core.Keyword.prototype.call = function() {
  var G__7297 = null;
  var G__7297__2 = function(this_sym7288, coll) {
    var this__7290 = this;
    var this_sym7288__7291 = this;
    var ___7292 = this_sym7288__7291;
    if(coll == null) {
      return null
    }else {
      var strobj__7293 = coll.strobj;
      if(strobj__7293 == null) {
        return cljs.core._lookup.call(null, coll, this__7290.k, null)
      }else {
        return strobj__7293[this__7290.k]
      }
    }
  };
  var G__7297__3 = function(this_sym7289, coll, not_found) {
    var this__7290 = this;
    var this_sym7289__7294 = this;
    var ___7295 = this_sym7289__7294;
    if(coll == null) {
      return not_found
    }else {
      return cljs.core._lookup.call(null, coll, this__7290.k, not_found)
    }
  };
  G__7297 = function(this_sym7289, coll, not_found) {
    switch(arguments.length) {
      case 2:
        return G__7297__2.call(this, this_sym7289, coll);
      case 3:
        return G__7297__3.call(this, this_sym7289, coll, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__7297
}();
cljs.core.Keyword.prototype.apply = function(this_sym7286, args7287) {
  var this__7296 = this;
  return this_sym7286.call.apply(this_sym7286, [this_sym7286].concat(args7287.slice()))
};
cljs.core.Keyword;
String.prototype.cljs$core$IFn$ = true;
String.prototype.call = function() {
  var G__7306 = null;
  var G__7306__2 = function(this_sym7300, coll) {
    var this_sym7300__7302 = this;
    var this__7303 = this_sym7300__7302;
    return cljs.core._lookup.call(null, coll, this__7303.toString(), null)
  };
  var G__7306__3 = function(this_sym7301, coll, not_found) {
    var this_sym7301__7304 = this;
    var this__7305 = this_sym7301__7304;
    return cljs.core._lookup.call(null, coll, this__7305.toString(), not_found)
  };
  G__7306 = function(this_sym7301, coll, not_found) {
    switch(arguments.length) {
      case 2:
        return G__7306__2.call(this, this_sym7301, coll);
      case 3:
        return G__7306__3.call(this, this_sym7301, coll, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__7306
}();
String.prototype.apply = function(this_sym7298, args7299) {
  return this_sym7298.call.apply(this_sym7298, [this_sym7298].concat(args7299.slice()))
};
String.prototype.apply = function(s, args) {
  if(cljs.core.count.call(null, args) < 2) {
    return cljs.core._lookup.call(null, args[0], s, null)
  }else {
    return cljs.core._lookup.call(null, args[0], s, args[1])
  }
};
cljs.core.lazy_seq_value = function lazy_seq_value(lazy_seq) {
  var x__7308 = lazy_seq.x;
  if(lazy_seq.realized) {
    return x__7308
  }else {
    lazy_seq.x = x__7308.call(null);
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
cljs.core.LazySeq.cljs$lang$ctorPrSeq = function(this__2337__auto__) {
  return cljs.core.list.call(null, "cljs.core/LazySeq")
};
cljs.core.LazySeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__7309 = this;
  var h__2220__auto____7310 = this__7309.__hash;
  if(!(h__2220__auto____7310 == null)) {
    return h__2220__auto____7310
  }else {
    var h__2220__auto____7311 = cljs.core.hash_coll.call(null, coll);
    this__7309.__hash = h__2220__auto____7311;
    return h__2220__auto____7311
  }
};
cljs.core.LazySeq.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var this__7312 = this;
  return cljs.core._seq.call(null, coll.cljs$core$ISeq$_rest$arity$1(coll))
};
cljs.core.LazySeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__7313 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.LazySeq.prototype.toString = function() {
  var this__7314 = this;
  var this__7315 = this;
  return cljs.core.pr_str.call(null, this__7315)
};
cljs.core.LazySeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__7316 = this;
  return cljs.core.seq.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__7317 = this;
  return cljs.core.first.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__7318 = this;
  return cljs.core.rest.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__7319 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.LazySeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__7320 = this;
  return new cljs.core.LazySeq(meta, this__7320.realized, this__7320.x, this__7320.__hash)
};
cljs.core.LazySeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__7321 = this;
  return this__7321.meta
};
cljs.core.LazySeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__7322 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__7322.meta)
};
cljs.core.LazySeq;
cljs.core.ChunkBuffer = function(buf, end) {
  this.buf = buf;
  this.end = end;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 2
};
cljs.core.ChunkBuffer.cljs$lang$type = true;
cljs.core.ChunkBuffer.cljs$lang$ctorPrSeq = function(this__2337__auto__) {
  return cljs.core.list.call(null, "cljs.core/ChunkBuffer")
};
cljs.core.ChunkBuffer.prototype.cljs$core$ICounted$_count$arity$1 = function(_) {
  var this__7323 = this;
  return this__7323.end
};
cljs.core.ChunkBuffer.prototype.add = function(o) {
  var this__7324 = this;
  var ___7325 = this;
  this__7324.buf[this__7324.end] = o;
  return this__7324.end = this__7324.end + 1
};
cljs.core.ChunkBuffer.prototype.chunk = function(o) {
  var this__7326 = this;
  var ___7327 = this;
  var ret__7328 = new cljs.core.ArrayChunk(this__7326.buf, 0, this__7326.end);
  this__7326.buf = null;
  return ret__7328
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
cljs.core.ArrayChunk.cljs$lang$ctorPrSeq = function(this__2337__auto__) {
  return cljs.core.list.call(null, "cljs.core/ArrayChunk")
};
cljs.core.ArrayChunk.prototype.cljs$core$IReduce$_reduce$arity$2 = function(coll, f) {
  var this__7329 = this;
  return cljs.core.ci_reduce.call(null, coll, f, this__7329.arr[this__7329.off], this__7329.off + 1)
};
cljs.core.ArrayChunk.prototype.cljs$core$IReduce$_reduce$arity$3 = function(coll, f, start) {
  var this__7330 = this;
  return cljs.core.ci_reduce.call(null, coll, f, start, this__7330.off)
};
cljs.core.ArrayChunk.prototype.cljs$core$IChunk$ = true;
cljs.core.ArrayChunk.prototype.cljs$core$IChunk$_drop_first$arity$1 = function(coll) {
  var this__7331 = this;
  if(this__7331.off === this__7331.end) {
    throw new Error("-drop-first of empty chunk");
  }else {
    return new cljs.core.ArrayChunk(this__7331.arr, this__7331.off + 1, this__7331.end)
  }
};
cljs.core.ArrayChunk.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, i) {
  var this__7332 = this;
  return this__7332.arr[this__7332.off + i]
};
cljs.core.ArrayChunk.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, i, not_found) {
  var this__7333 = this;
  if(function() {
    var and__3822__auto____7334 = i >= 0;
    if(and__3822__auto____7334) {
      return i < this__7333.end - this__7333.off
    }else {
      return and__3822__auto____7334
    }
  }()) {
    return this__7333.arr[this__7333.off + i]
  }else {
    return not_found
  }
};
cljs.core.ArrayChunk.prototype.cljs$core$ICounted$_count$arity$1 = function(_) {
  var this__7335 = this;
  return this__7335.end - this__7335.off
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
cljs.core.ChunkedCons.cljs$lang$ctorPrSeq = function(this__2337__auto__) {
  return cljs.core.list.call(null, "cljs.core/ChunkedCons")
};
cljs.core.ChunkedCons.prototype.cljs$core$ICollection$_conj$arity$2 = function(this$, o) {
  var this__7336 = this;
  return cljs.core.cons.call(null, o, this$)
};
cljs.core.ChunkedCons.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__7337 = this;
  return coll
};
cljs.core.ChunkedCons.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__7338 = this;
  return cljs.core._nth.call(null, this__7338.chunk, 0)
};
cljs.core.ChunkedCons.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__7339 = this;
  if(cljs.core._count.call(null, this__7339.chunk) > 1) {
    return new cljs.core.ChunkedCons(cljs.core._drop_first.call(null, this__7339.chunk), this__7339.more, this__7339.meta)
  }else {
    if(this__7339.more == null) {
      return cljs.core.List.EMPTY
    }else {
      return this__7339.more
    }
  }
};
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedNext$ = true;
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedNext$_chunked_next$arity$1 = function(coll) {
  var this__7340 = this;
  if(this__7340.more == null) {
    return null
  }else {
    return this__7340.more
  }
};
cljs.core.ChunkedCons.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__7341 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.ChunkedCons.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, m) {
  var this__7342 = this;
  return new cljs.core.ChunkedCons(this__7342.chunk, this__7342.more, m)
};
cljs.core.ChunkedCons.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__7343 = this;
  return this__7343.meta
};
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedSeq$ = true;
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedSeq$_chunked_first$arity$1 = function(coll) {
  var this__7344 = this;
  return this__7344.chunk
};
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedSeq$_chunked_rest$arity$1 = function(coll) {
  var this__7345 = this;
  if(this__7345.more == null) {
    return cljs.core.List.EMPTY
  }else {
    return this__7345.more
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
    var G__7349__7350 = s;
    if(G__7349__7350) {
      if(cljs.core.truth_(function() {
        var or__3824__auto____7351 = null;
        if(cljs.core.truth_(or__3824__auto____7351)) {
          return or__3824__auto____7351
        }else {
          return G__7349__7350.cljs$core$IChunkedNext$
        }
      }())) {
        return true
      }else {
        if(!G__7349__7350.cljs$lang$protocol_mask$partition$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IChunkedNext, G__7349__7350)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IChunkedNext, G__7349__7350)
    }
  }()) {
    return cljs.core._chunked_next.call(null, s)
  }else {
    return cljs.core.seq.call(null, cljs.core._chunked_rest.call(null, s))
  }
};
cljs.core.to_array = function to_array(s) {
  var ary__7354 = [];
  var s__7355 = s;
  while(true) {
    if(cljs.core.seq.call(null, s__7355)) {
      ary__7354.push(cljs.core.first.call(null, s__7355));
      var G__7356 = cljs.core.next.call(null, s__7355);
      s__7355 = G__7356;
      continue
    }else {
      return ary__7354
    }
    break
  }
};
cljs.core.to_array_2d = function to_array_2d(coll) {
  var ret__7360 = cljs.core.make_array.call(null, cljs.core.count.call(null, coll));
  var i__7361 = 0;
  var xs__7362 = cljs.core.seq.call(null, coll);
  while(true) {
    if(xs__7362) {
      ret__7360[i__7361] = cljs.core.to_array.call(null, cljs.core.first.call(null, xs__7362));
      var G__7363 = i__7361 + 1;
      var G__7364 = cljs.core.next.call(null, xs__7362);
      i__7361 = G__7363;
      xs__7362 = G__7364;
      continue
    }else {
    }
    break
  }
  return ret__7360
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
    var a__7372 = cljs.core.make_array.call(null, size);
    if(cljs.core.seq_QMARK_.call(null, init_val_or_seq)) {
      var s__7373 = cljs.core.seq.call(null, init_val_or_seq);
      var i__7374 = 0;
      var s__7375 = s__7373;
      while(true) {
        if(cljs.core.truth_(function() {
          var and__3822__auto____7376 = s__7375;
          if(and__3822__auto____7376) {
            return i__7374 < size
          }else {
            return and__3822__auto____7376
          }
        }())) {
          a__7372[i__7374] = cljs.core.first.call(null, s__7375);
          var G__7379 = i__7374 + 1;
          var G__7380 = cljs.core.next.call(null, s__7375);
          i__7374 = G__7379;
          s__7375 = G__7380;
          continue
        }else {
          return a__7372
        }
        break
      }
    }else {
      var n__2555__auto____7377 = size;
      var i__7378 = 0;
      while(true) {
        if(i__7378 < n__2555__auto____7377) {
          a__7372[i__7378] = init_val_or_seq;
          var G__7381 = i__7378 + 1;
          i__7378 = G__7381;
          continue
        }else {
        }
        break
      }
      return a__7372
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
    var a__7389 = cljs.core.make_array.call(null, size);
    if(cljs.core.seq_QMARK_.call(null, init_val_or_seq)) {
      var s__7390 = cljs.core.seq.call(null, init_val_or_seq);
      var i__7391 = 0;
      var s__7392 = s__7390;
      while(true) {
        if(cljs.core.truth_(function() {
          var and__3822__auto____7393 = s__7392;
          if(and__3822__auto____7393) {
            return i__7391 < size
          }else {
            return and__3822__auto____7393
          }
        }())) {
          a__7389[i__7391] = cljs.core.first.call(null, s__7392);
          var G__7396 = i__7391 + 1;
          var G__7397 = cljs.core.next.call(null, s__7392);
          i__7391 = G__7396;
          s__7392 = G__7397;
          continue
        }else {
          return a__7389
        }
        break
      }
    }else {
      var n__2555__auto____7394 = size;
      var i__7395 = 0;
      while(true) {
        if(i__7395 < n__2555__auto____7394) {
          a__7389[i__7395] = init_val_or_seq;
          var G__7398 = i__7395 + 1;
          i__7395 = G__7398;
          continue
        }else {
        }
        break
      }
      return a__7389
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
    var a__7406 = cljs.core.make_array.call(null, size);
    if(cljs.core.seq_QMARK_.call(null, init_val_or_seq)) {
      var s__7407 = cljs.core.seq.call(null, init_val_or_seq);
      var i__7408 = 0;
      var s__7409 = s__7407;
      while(true) {
        if(cljs.core.truth_(function() {
          var and__3822__auto____7410 = s__7409;
          if(and__3822__auto____7410) {
            return i__7408 < size
          }else {
            return and__3822__auto____7410
          }
        }())) {
          a__7406[i__7408] = cljs.core.first.call(null, s__7409);
          var G__7413 = i__7408 + 1;
          var G__7414 = cljs.core.next.call(null, s__7409);
          i__7408 = G__7413;
          s__7409 = G__7414;
          continue
        }else {
          return a__7406
        }
        break
      }
    }else {
      var n__2555__auto____7411 = size;
      var i__7412 = 0;
      while(true) {
        if(i__7412 < n__2555__auto____7411) {
          a__7406[i__7412] = init_val_or_seq;
          var G__7415 = i__7412 + 1;
          i__7412 = G__7415;
          continue
        }else {
        }
        break
      }
      return a__7406
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
    var s__7420 = s;
    var i__7421 = n;
    var sum__7422 = 0;
    while(true) {
      if(cljs.core.truth_(function() {
        var and__3822__auto____7423 = i__7421 > 0;
        if(and__3822__auto____7423) {
          return cljs.core.seq.call(null, s__7420)
        }else {
          return and__3822__auto____7423
        }
      }())) {
        var G__7424 = cljs.core.next.call(null, s__7420);
        var G__7425 = i__7421 - 1;
        var G__7426 = sum__7422 + 1;
        s__7420 = G__7424;
        i__7421 = G__7425;
        sum__7422 = G__7426;
        continue
      }else {
        return sum__7422
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
      var s__7431 = cljs.core.seq.call(null, x);
      if(s__7431) {
        if(cljs.core.chunked_seq_QMARK_.call(null, s__7431)) {
          return cljs.core.chunk_cons.call(null, cljs.core.chunk_first.call(null, s__7431), concat.call(null, cljs.core.chunk_rest.call(null, s__7431), y))
        }else {
          return cljs.core.cons.call(null, cljs.core.first.call(null, s__7431), concat.call(null, cljs.core.rest.call(null, s__7431), y))
        }
      }else {
        return y
      }
    }, null)
  };
  var concat__3 = function() {
    var G__7435__delegate = function(x, y, zs) {
      var cat__7434 = function cat(xys, zs) {
        return new cljs.core.LazySeq(null, false, function() {
          var xys__7433 = cljs.core.seq.call(null, xys);
          if(xys__7433) {
            if(cljs.core.chunked_seq_QMARK_.call(null, xys__7433)) {
              return cljs.core.chunk_cons.call(null, cljs.core.chunk_first.call(null, xys__7433), cat.call(null, cljs.core.chunk_rest.call(null, xys__7433), zs))
            }else {
              return cljs.core.cons.call(null, cljs.core.first.call(null, xys__7433), cat.call(null, cljs.core.rest.call(null, xys__7433), zs))
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
      return cat__7434.call(null, concat.call(null, x, y), zs)
    };
    var G__7435 = function(x, y, var_args) {
      var zs = null;
      if(goog.isDef(var_args)) {
        zs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7435__delegate.call(this, x, y, zs)
    };
    G__7435.cljs$lang$maxFixedArity = 2;
    G__7435.cljs$lang$applyTo = function(arglist__7436) {
      var x = cljs.core.first(arglist__7436);
      var y = cljs.core.first(cljs.core.next(arglist__7436));
      var zs = cljs.core.rest(cljs.core.next(arglist__7436));
      return G__7435__delegate(x, y, zs)
    };
    G__7435.cljs$lang$arity$variadic = G__7435__delegate;
    return G__7435
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
    var G__7437__delegate = function(a, b, c, d, more) {
      return cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, cljs.core.cons.call(null, d, cljs.core.spread.call(null, more)))))
    };
    var G__7437 = function(a, b, c, d, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__7437__delegate.call(this, a, b, c, d, more)
    };
    G__7437.cljs$lang$maxFixedArity = 4;
    G__7437.cljs$lang$applyTo = function(arglist__7438) {
      var a = cljs.core.first(arglist__7438);
      var b = cljs.core.first(cljs.core.next(arglist__7438));
      var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7438)));
      var d = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__7438))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__7438))));
      return G__7437__delegate(a, b, c, d, more)
    };
    G__7437.cljs$lang$arity$variadic = G__7437__delegate;
    return G__7437
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
  var args__7480 = cljs.core.seq.call(null, args);
  if(argc === 0) {
    return f.call(null)
  }else {
    var a__7481 = cljs.core._first.call(null, args__7480);
    var args__7482 = cljs.core._rest.call(null, args__7480);
    if(argc === 1) {
      if(f.cljs$lang$arity$1) {
        return f.cljs$lang$arity$1(a__7481)
      }else {
        return f.call(null, a__7481)
      }
    }else {
      var b__7483 = cljs.core._first.call(null, args__7482);
      var args__7484 = cljs.core._rest.call(null, args__7482);
      if(argc === 2) {
        if(f.cljs$lang$arity$2) {
          return f.cljs$lang$arity$2(a__7481, b__7483)
        }else {
          return f.call(null, a__7481, b__7483)
        }
      }else {
        var c__7485 = cljs.core._first.call(null, args__7484);
        var args__7486 = cljs.core._rest.call(null, args__7484);
        if(argc === 3) {
          if(f.cljs$lang$arity$3) {
            return f.cljs$lang$arity$3(a__7481, b__7483, c__7485)
          }else {
            return f.call(null, a__7481, b__7483, c__7485)
          }
        }else {
          var d__7487 = cljs.core._first.call(null, args__7486);
          var args__7488 = cljs.core._rest.call(null, args__7486);
          if(argc === 4) {
            if(f.cljs$lang$arity$4) {
              return f.cljs$lang$arity$4(a__7481, b__7483, c__7485, d__7487)
            }else {
              return f.call(null, a__7481, b__7483, c__7485, d__7487)
            }
          }else {
            var e__7489 = cljs.core._first.call(null, args__7488);
            var args__7490 = cljs.core._rest.call(null, args__7488);
            if(argc === 5) {
              if(f.cljs$lang$arity$5) {
                return f.cljs$lang$arity$5(a__7481, b__7483, c__7485, d__7487, e__7489)
              }else {
                return f.call(null, a__7481, b__7483, c__7485, d__7487, e__7489)
              }
            }else {
              var f__7491 = cljs.core._first.call(null, args__7490);
              var args__7492 = cljs.core._rest.call(null, args__7490);
              if(argc === 6) {
                if(f__7491.cljs$lang$arity$6) {
                  return f__7491.cljs$lang$arity$6(a__7481, b__7483, c__7485, d__7487, e__7489, f__7491)
                }else {
                  return f__7491.call(null, a__7481, b__7483, c__7485, d__7487, e__7489, f__7491)
                }
              }else {
                var g__7493 = cljs.core._first.call(null, args__7492);
                var args__7494 = cljs.core._rest.call(null, args__7492);
                if(argc === 7) {
                  if(f__7491.cljs$lang$arity$7) {
                    return f__7491.cljs$lang$arity$7(a__7481, b__7483, c__7485, d__7487, e__7489, f__7491, g__7493)
                  }else {
                    return f__7491.call(null, a__7481, b__7483, c__7485, d__7487, e__7489, f__7491, g__7493)
                  }
                }else {
                  var h__7495 = cljs.core._first.call(null, args__7494);
                  var args__7496 = cljs.core._rest.call(null, args__7494);
                  if(argc === 8) {
                    if(f__7491.cljs$lang$arity$8) {
                      return f__7491.cljs$lang$arity$8(a__7481, b__7483, c__7485, d__7487, e__7489, f__7491, g__7493, h__7495)
                    }else {
                      return f__7491.call(null, a__7481, b__7483, c__7485, d__7487, e__7489, f__7491, g__7493, h__7495)
                    }
                  }else {
                    var i__7497 = cljs.core._first.call(null, args__7496);
                    var args__7498 = cljs.core._rest.call(null, args__7496);
                    if(argc === 9) {
                      if(f__7491.cljs$lang$arity$9) {
                        return f__7491.cljs$lang$arity$9(a__7481, b__7483, c__7485, d__7487, e__7489, f__7491, g__7493, h__7495, i__7497)
                      }else {
                        return f__7491.call(null, a__7481, b__7483, c__7485, d__7487, e__7489, f__7491, g__7493, h__7495, i__7497)
                      }
                    }else {
                      var j__7499 = cljs.core._first.call(null, args__7498);
                      var args__7500 = cljs.core._rest.call(null, args__7498);
                      if(argc === 10) {
                        if(f__7491.cljs$lang$arity$10) {
                          return f__7491.cljs$lang$arity$10(a__7481, b__7483, c__7485, d__7487, e__7489, f__7491, g__7493, h__7495, i__7497, j__7499)
                        }else {
                          return f__7491.call(null, a__7481, b__7483, c__7485, d__7487, e__7489, f__7491, g__7493, h__7495, i__7497, j__7499)
                        }
                      }else {
                        var k__7501 = cljs.core._first.call(null, args__7500);
                        var args__7502 = cljs.core._rest.call(null, args__7500);
                        if(argc === 11) {
                          if(f__7491.cljs$lang$arity$11) {
                            return f__7491.cljs$lang$arity$11(a__7481, b__7483, c__7485, d__7487, e__7489, f__7491, g__7493, h__7495, i__7497, j__7499, k__7501)
                          }else {
                            return f__7491.call(null, a__7481, b__7483, c__7485, d__7487, e__7489, f__7491, g__7493, h__7495, i__7497, j__7499, k__7501)
                          }
                        }else {
                          var l__7503 = cljs.core._first.call(null, args__7502);
                          var args__7504 = cljs.core._rest.call(null, args__7502);
                          if(argc === 12) {
                            if(f__7491.cljs$lang$arity$12) {
                              return f__7491.cljs$lang$arity$12(a__7481, b__7483, c__7485, d__7487, e__7489, f__7491, g__7493, h__7495, i__7497, j__7499, k__7501, l__7503)
                            }else {
                              return f__7491.call(null, a__7481, b__7483, c__7485, d__7487, e__7489, f__7491, g__7493, h__7495, i__7497, j__7499, k__7501, l__7503)
                            }
                          }else {
                            var m__7505 = cljs.core._first.call(null, args__7504);
                            var args__7506 = cljs.core._rest.call(null, args__7504);
                            if(argc === 13) {
                              if(f__7491.cljs$lang$arity$13) {
                                return f__7491.cljs$lang$arity$13(a__7481, b__7483, c__7485, d__7487, e__7489, f__7491, g__7493, h__7495, i__7497, j__7499, k__7501, l__7503, m__7505)
                              }else {
                                return f__7491.call(null, a__7481, b__7483, c__7485, d__7487, e__7489, f__7491, g__7493, h__7495, i__7497, j__7499, k__7501, l__7503, m__7505)
                              }
                            }else {
                              var n__7507 = cljs.core._first.call(null, args__7506);
                              var args__7508 = cljs.core._rest.call(null, args__7506);
                              if(argc === 14) {
                                if(f__7491.cljs$lang$arity$14) {
                                  return f__7491.cljs$lang$arity$14(a__7481, b__7483, c__7485, d__7487, e__7489, f__7491, g__7493, h__7495, i__7497, j__7499, k__7501, l__7503, m__7505, n__7507)
                                }else {
                                  return f__7491.call(null, a__7481, b__7483, c__7485, d__7487, e__7489, f__7491, g__7493, h__7495, i__7497, j__7499, k__7501, l__7503, m__7505, n__7507)
                                }
                              }else {
                                var o__7509 = cljs.core._first.call(null, args__7508);
                                var args__7510 = cljs.core._rest.call(null, args__7508);
                                if(argc === 15) {
                                  if(f__7491.cljs$lang$arity$15) {
                                    return f__7491.cljs$lang$arity$15(a__7481, b__7483, c__7485, d__7487, e__7489, f__7491, g__7493, h__7495, i__7497, j__7499, k__7501, l__7503, m__7505, n__7507, o__7509)
                                  }else {
                                    return f__7491.call(null, a__7481, b__7483, c__7485, d__7487, e__7489, f__7491, g__7493, h__7495, i__7497, j__7499, k__7501, l__7503, m__7505, n__7507, o__7509)
                                  }
                                }else {
                                  var p__7511 = cljs.core._first.call(null, args__7510);
                                  var args__7512 = cljs.core._rest.call(null, args__7510);
                                  if(argc === 16) {
                                    if(f__7491.cljs$lang$arity$16) {
                                      return f__7491.cljs$lang$arity$16(a__7481, b__7483, c__7485, d__7487, e__7489, f__7491, g__7493, h__7495, i__7497, j__7499, k__7501, l__7503, m__7505, n__7507, o__7509, p__7511)
                                    }else {
                                      return f__7491.call(null, a__7481, b__7483, c__7485, d__7487, e__7489, f__7491, g__7493, h__7495, i__7497, j__7499, k__7501, l__7503, m__7505, n__7507, o__7509, p__7511)
                                    }
                                  }else {
                                    var q__7513 = cljs.core._first.call(null, args__7512);
                                    var args__7514 = cljs.core._rest.call(null, args__7512);
                                    if(argc === 17) {
                                      if(f__7491.cljs$lang$arity$17) {
                                        return f__7491.cljs$lang$arity$17(a__7481, b__7483, c__7485, d__7487, e__7489, f__7491, g__7493, h__7495, i__7497, j__7499, k__7501, l__7503, m__7505, n__7507, o__7509, p__7511, q__7513)
                                      }else {
                                        return f__7491.call(null, a__7481, b__7483, c__7485, d__7487, e__7489, f__7491, g__7493, h__7495, i__7497, j__7499, k__7501, l__7503, m__7505, n__7507, o__7509, p__7511, q__7513)
                                      }
                                    }else {
                                      var r__7515 = cljs.core._first.call(null, args__7514);
                                      var args__7516 = cljs.core._rest.call(null, args__7514);
                                      if(argc === 18) {
                                        if(f__7491.cljs$lang$arity$18) {
                                          return f__7491.cljs$lang$arity$18(a__7481, b__7483, c__7485, d__7487, e__7489, f__7491, g__7493, h__7495, i__7497, j__7499, k__7501, l__7503, m__7505, n__7507, o__7509, p__7511, q__7513, r__7515)
                                        }else {
                                          return f__7491.call(null, a__7481, b__7483, c__7485, d__7487, e__7489, f__7491, g__7493, h__7495, i__7497, j__7499, k__7501, l__7503, m__7505, n__7507, o__7509, p__7511, q__7513, r__7515)
                                        }
                                      }else {
                                        var s__7517 = cljs.core._first.call(null, args__7516);
                                        var args__7518 = cljs.core._rest.call(null, args__7516);
                                        if(argc === 19) {
                                          if(f__7491.cljs$lang$arity$19) {
                                            return f__7491.cljs$lang$arity$19(a__7481, b__7483, c__7485, d__7487, e__7489, f__7491, g__7493, h__7495, i__7497, j__7499, k__7501, l__7503, m__7505, n__7507, o__7509, p__7511, q__7513, r__7515, s__7517)
                                          }else {
                                            return f__7491.call(null, a__7481, b__7483, c__7485, d__7487, e__7489, f__7491, g__7493, h__7495, i__7497, j__7499, k__7501, l__7503, m__7505, n__7507, o__7509, p__7511, q__7513, r__7515, s__7517)
                                          }
                                        }else {
                                          var t__7519 = cljs.core._first.call(null, args__7518);
                                          var args__7520 = cljs.core._rest.call(null, args__7518);
                                          if(argc === 20) {
                                            if(f__7491.cljs$lang$arity$20) {
                                              return f__7491.cljs$lang$arity$20(a__7481, b__7483, c__7485, d__7487, e__7489, f__7491, g__7493, h__7495, i__7497, j__7499, k__7501, l__7503, m__7505, n__7507, o__7509, p__7511, q__7513, r__7515, s__7517, t__7519)
                                            }else {
                                              return f__7491.call(null, a__7481, b__7483, c__7485, d__7487, e__7489, f__7491, g__7493, h__7495, i__7497, j__7499, k__7501, l__7503, m__7505, n__7507, o__7509, p__7511, q__7513, r__7515, s__7517, t__7519)
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
    var fixed_arity__7535 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__7536 = cljs.core.bounded_count.call(null, args, fixed_arity__7535 + 1);
      if(bc__7536 <= fixed_arity__7535) {
        return cljs.core.apply_to.call(null, f, bc__7536, args)
      }else {
        return f.cljs$lang$applyTo(args)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, args))
    }
  };
  var apply__3 = function(f, x, args) {
    var arglist__7537 = cljs.core.list_STAR_.call(null, x, args);
    var fixed_arity__7538 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__7539 = cljs.core.bounded_count.call(null, arglist__7537, fixed_arity__7538 + 1);
      if(bc__7539 <= fixed_arity__7538) {
        return cljs.core.apply_to.call(null, f, bc__7539, arglist__7537)
      }else {
        return f.cljs$lang$applyTo(arglist__7537)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__7537))
    }
  };
  var apply__4 = function(f, x, y, args) {
    var arglist__7540 = cljs.core.list_STAR_.call(null, x, y, args);
    var fixed_arity__7541 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__7542 = cljs.core.bounded_count.call(null, arglist__7540, fixed_arity__7541 + 1);
      if(bc__7542 <= fixed_arity__7541) {
        return cljs.core.apply_to.call(null, f, bc__7542, arglist__7540)
      }else {
        return f.cljs$lang$applyTo(arglist__7540)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__7540))
    }
  };
  var apply__5 = function(f, x, y, z, args) {
    var arglist__7543 = cljs.core.list_STAR_.call(null, x, y, z, args);
    var fixed_arity__7544 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__7545 = cljs.core.bounded_count.call(null, arglist__7543, fixed_arity__7544 + 1);
      if(bc__7545 <= fixed_arity__7544) {
        return cljs.core.apply_to.call(null, f, bc__7545, arglist__7543)
      }else {
        return f.cljs$lang$applyTo(arglist__7543)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__7543))
    }
  };
  var apply__6 = function() {
    var G__7549__delegate = function(f, a, b, c, d, args) {
      var arglist__7546 = cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, cljs.core.cons.call(null, d, cljs.core.spread.call(null, args)))));
      var fixed_arity__7547 = f.cljs$lang$maxFixedArity;
      if(cljs.core.truth_(f.cljs$lang$applyTo)) {
        var bc__7548 = cljs.core.bounded_count.call(null, arglist__7546, fixed_arity__7547 + 1);
        if(bc__7548 <= fixed_arity__7547) {
          return cljs.core.apply_to.call(null, f, bc__7548, arglist__7546)
        }else {
          return f.cljs$lang$applyTo(arglist__7546)
        }
      }else {
        return f.apply(f, cljs.core.to_array.call(null, arglist__7546))
      }
    };
    var G__7549 = function(f, a, b, c, d, var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 5), 0)
      }
      return G__7549__delegate.call(this, f, a, b, c, d, args)
    };
    G__7549.cljs$lang$maxFixedArity = 5;
    G__7549.cljs$lang$applyTo = function(arglist__7550) {
      var f = cljs.core.first(arglist__7550);
      var a = cljs.core.first(cljs.core.next(arglist__7550));
      var b = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7550)));
      var c = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__7550))));
      var d = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__7550)))));
      var args = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__7550)))));
      return G__7549__delegate(f, a, b, c, d, args)
    };
    G__7549.cljs$lang$arity$variadic = G__7549__delegate;
    return G__7549
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
  vary_meta.cljs$lang$applyTo = function(arglist__7551) {
    var obj = cljs.core.first(arglist__7551);
    var f = cljs.core.first(cljs.core.next(arglist__7551));
    var args = cljs.core.rest(cljs.core.next(arglist__7551));
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
    var G__7552__delegate = function(x, y, more) {
      return cljs.core.not.call(null, cljs.core.apply.call(null, cljs.core._EQ_, x, y, more))
    };
    var G__7552 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7552__delegate.call(this, x, y, more)
    };
    G__7552.cljs$lang$maxFixedArity = 2;
    G__7552.cljs$lang$applyTo = function(arglist__7553) {
      var x = cljs.core.first(arglist__7553);
      var y = cljs.core.first(cljs.core.next(arglist__7553));
      var more = cljs.core.rest(cljs.core.next(arglist__7553));
      return G__7552__delegate(x, y, more)
    };
    G__7552.cljs$lang$arity$variadic = G__7552__delegate;
    return G__7552
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
        var G__7554 = pred;
        var G__7555 = cljs.core.next.call(null, coll);
        pred = G__7554;
        coll = G__7555;
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
      var or__3824__auto____7557 = pred.call(null, cljs.core.first.call(null, coll));
      if(cljs.core.truth_(or__3824__auto____7557)) {
        return or__3824__auto____7557
      }else {
        var G__7558 = pred;
        var G__7559 = cljs.core.next.call(null, coll);
        pred = G__7558;
        coll = G__7559;
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
    var G__7560 = null;
    var G__7560__0 = function() {
      return cljs.core.not.call(null, f.call(null))
    };
    var G__7560__1 = function(x) {
      return cljs.core.not.call(null, f.call(null, x))
    };
    var G__7560__2 = function(x, y) {
      return cljs.core.not.call(null, f.call(null, x, y))
    };
    var G__7560__3 = function() {
      var G__7561__delegate = function(x, y, zs) {
        return cljs.core.not.call(null, cljs.core.apply.call(null, f, x, y, zs))
      };
      var G__7561 = function(x, y, var_args) {
        var zs = null;
        if(goog.isDef(var_args)) {
          zs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
        }
        return G__7561__delegate.call(this, x, y, zs)
      };
      G__7561.cljs$lang$maxFixedArity = 2;
      G__7561.cljs$lang$applyTo = function(arglist__7562) {
        var x = cljs.core.first(arglist__7562);
        var y = cljs.core.first(cljs.core.next(arglist__7562));
        var zs = cljs.core.rest(cljs.core.next(arglist__7562));
        return G__7561__delegate(x, y, zs)
      };
      G__7561.cljs$lang$arity$variadic = G__7561__delegate;
      return G__7561
    }();
    G__7560 = function(x, y, var_args) {
      var zs = var_args;
      switch(arguments.length) {
        case 0:
          return G__7560__0.call(this);
        case 1:
          return G__7560__1.call(this, x);
        case 2:
          return G__7560__2.call(this, x, y);
        default:
          return G__7560__3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
      }
      throw"Invalid arity: " + arguments.length;
    };
    G__7560.cljs$lang$maxFixedArity = 2;
    G__7560.cljs$lang$applyTo = G__7560__3.cljs$lang$applyTo;
    return G__7560
  }()
};
cljs.core.constantly = function constantly(x) {
  return function() {
    var G__7563__delegate = function(args) {
      return x
    };
    var G__7563 = function(var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__7563__delegate.call(this, args)
    };
    G__7563.cljs$lang$maxFixedArity = 0;
    G__7563.cljs$lang$applyTo = function(arglist__7564) {
      var args = cljs.core.seq(arglist__7564);
      return G__7563__delegate(args)
    };
    G__7563.cljs$lang$arity$variadic = G__7563__delegate;
    return G__7563
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
      var G__7571 = null;
      var G__7571__0 = function() {
        return f.call(null, g.call(null))
      };
      var G__7571__1 = function(x) {
        return f.call(null, g.call(null, x))
      };
      var G__7571__2 = function(x, y) {
        return f.call(null, g.call(null, x, y))
      };
      var G__7571__3 = function(x, y, z) {
        return f.call(null, g.call(null, x, y, z))
      };
      var G__7571__4 = function() {
        var G__7572__delegate = function(x, y, z, args) {
          return f.call(null, cljs.core.apply.call(null, g, x, y, z, args))
        };
        var G__7572 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__7572__delegate.call(this, x, y, z, args)
        };
        G__7572.cljs$lang$maxFixedArity = 3;
        G__7572.cljs$lang$applyTo = function(arglist__7573) {
          var x = cljs.core.first(arglist__7573);
          var y = cljs.core.first(cljs.core.next(arglist__7573));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7573)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7573)));
          return G__7572__delegate(x, y, z, args)
        };
        G__7572.cljs$lang$arity$variadic = G__7572__delegate;
        return G__7572
      }();
      G__7571 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__7571__0.call(this);
          case 1:
            return G__7571__1.call(this, x);
          case 2:
            return G__7571__2.call(this, x, y);
          case 3:
            return G__7571__3.call(this, x, y, z);
          default:
            return G__7571__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__7571.cljs$lang$maxFixedArity = 3;
      G__7571.cljs$lang$applyTo = G__7571__4.cljs$lang$applyTo;
      return G__7571
    }()
  };
  var comp__3 = function(f, g, h) {
    return function() {
      var G__7574 = null;
      var G__7574__0 = function() {
        return f.call(null, g.call(null, h.call(null)))
      };
      var G__7574__1 = function(x) {
        return f.call(null, g.call(null, h.call(null, x)))
      };
      var G__7574__2 = function(x, y) {
        return f.call(null, g.call(null, h.call(null, x, y)))
      };
      var G__7574__3 = function(x, y, z) {
        return f.call(null, g.call(null, h.call(null, x, y, z)))
      };
      var G__7574__4 = function() {
        var G__7575__delegate = function(x, y, z, args) {
          return f.call(null, g.call(null, cljs.core.apply.call(null, h, x, y, z, args)))
        };
        var G__7575 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__7575__delegate.call(this, x, y, z, args)
        };
        G__7575.cljs$lang$maxFixedArity = 3;
        G__7575.cljs$lang$applyTo = function(arglist__7576) {
          var x = cljs.core.first(arglist__7576);
          var y = cljs.core.first(cljs.core.next(arglist__7576));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7576)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7576)));
          return G__7575__delegate(x, y, z, args)
        };
        G__7575.cljs$lang$arity$variadic = G__7575__delegate;
        return G__7575
      }();
      G__7574 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__7574__0.call(this);
          case 1:
            return G__7574__1.call(this, x);
          case 2:
            return G__7574__2.call(this, x, y);
          case 3:
            return G__7574__3.call(this, x, y, z);
          default:
            return G__7574__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__7574.cljs$lang$maxFixedArity = 3;
      G__7574.cljs$lang$applyTo = G__7574__4.cljs$lang$applyTo;
      return G__7574
    }()
  };
  var comp__4 = function() {
    var G__7577__delegate = function(f1, f2, f3, fs) {
      var fs__7568 = cljs.core.reverse.call(null, cljs.core.list_STAR_.call(null, f1, f2, f3, fs));
      return function() {
        var G__7578__delegate = function(args) {
          var ret__7569 = cljs.core.apply.call(null, cljs.core.first.call(null, fs__7568), args);
          var fs__7570 = cljs.core.next.call(null, fs__7568);
          while(true) {
            if(fs__7570) {
              var G__7579 = cljs.core.first.call(null, fs__7570).call(null, ret__7569);
              var G__7580 = cljs.core.next.call(null, fs__7570);
              ret__7569 = G__7579;
              fs__7570 = G__7580;
              continue
            }else {
              return ret__7569
            }
            break
          }
        };
        var G__7578 = function(var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
          }
          return G__7578__delegate.call(this, args)
        };
        G__7578.cljs$lang$maxFixedArity = 0;
        G__7578.cljs$lang$applyTo = function(arglist__7581) {
          var args = cljs.core.seq(arglist__7581);
          return G__7578__delegate(args)
        };
        G__7578.cljs$lang$arity$variadic = G__7578__delegate;
        return G__7578
      }()
    };
    var G__7577 = function(f1, f2, f3, var_args) {
      var fs = null;
      if(goog.isDef(var_args)) {
        fs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__7577__delegate.call(this, f1, f2, f3, fs)
    };
    G__7577.cljs$lang$maxFixedArity = 3;
    G__7577.cljs$lang$applyTo = function(arglist__7582) {
      var f1 = cljs.core.first(arglist__7582);
      var f2 = cljs.core.first(cljs.core.next(arglist__7582));
      var f3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7582)));
      var fs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7582)));
      return G__7577__delegate(f1, f2, f3, fs)
    };
    G__7577.cljs$lang$arity$variadic = G__7577__delegate;
    return G__7577
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
      var G__7583__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, args)
      };
      var G__7583 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__7583__delegate.call(this, args)
      };
      G__7583.cljs$lang$maxFixedArity = 0;
      G__7583.cljs$lang$applyTo = function(arglist__7584) {
        var args = cljs.core.seq(arglist__7584);
        return G__7583__delegate(args)
      };
      G__7583.cljs$lang$arity$variadic = G__7583__delegate;
      return G__7583
    }()
  };
  var partial__3 = function(f, arg1, arg2) {
    return function() {
      var G__7585__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, arg2, args)
      };
      var G__7585 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__7585__delegate.call(this, args)
      };
      G__7585.cljs$lang$maxFixedArity = 0;
      G__7585.cljs$lang$applyTo = function(arglist__7586) {
        var args = cljs.core.seq(arglist__7586);
        return G__7585__delegate(args)
      };
      G__7585.cljs$lang$arity$variadic = G__7585__delegate;
      return G__7585
    }()
  };
  var partial__4 = function(f, arg1, arg2, arg3) {
    return function() {
      var G__7587__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, arg2, arg3, args)
      };
      var G__7587 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__7587__delegate.call(this, args)
      };
      G__7587.cljs$lang$maxFixedArity = 0;
      G__7587.cljs$lang$applyTo = function(arglist__7588) {
        var args = cljs.core.seq(arglist__7588);
        return G__7587__delegate(args)
      };
      G__7587.cljs$lang$arity$variadic = G__7587__delegate;
      return G__7587
    }()
  };
  var partial__5 = function() {
    var G__7589__delegate = function(f, arg1, arg2, arg3, more) {
      return function() {
        var G__7590__delegate = function(args) {
          return cljs.core.apply.call(null, f, arg1, arg2, arg3, cljs.core.concat.call(null, more, args))
        };
        var G__7590 = function(var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
          }
          return G__7590__delegate.call(this, args)
        };
        G__7590.cljs$lang$maxFixedArity = 0;
        G__7590.cljs$lang$applyTo = function(arglist__7591) {
          var args = cljs.core.seq(arglist__7591);
          return G__7590__delegate(args)
        };
        G__7590.cljs$lang$arity$variadic = G__7590__delegate;
        return G__7590
      }()
    };
    var G__7589 = function(f, arg1, arg2, arg3, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__7589__delegate.call(this, f, arg1, arg2, arg3, more)
    };
    G__7589.cljs$lang$maxFixedArity = 4;
    G__7589.cljs$lang$applyTo = function(arglist__7592) {
      var f = cljs.core.first(arglist__7592);
      var arg1 = cljs.core.first(cljs.core.next(arglist__7592));
      var arg2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7592)));
      var arg3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__7592))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__7592))));
      return G__7589__delegate(f, arg1, arg2, arg3, more)
    };
    G__7589.cljs$lang$arity$variadic = G__7589__delegate;
    return G__7589
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
      var G__7593 = null;
      var G__7593__1 = function(a) {
        return f.call(null, a == null ? x : a)
      };
      var G__7593__2 = function(a, b) {
        return f.call(null, a == null ? x : a, b)
      };
      var G__7593__3 = function(a, b, c) {
        return f.call(null, a == null ? x : a, b, c)
      };
      var G__7593__4 = function() {
        var G__7594__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, a == null ? x : a, b, c, ds)
        };
        var G__7594 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__7594__delegate.call(this, a, b, c, ds)
        };
        G__7594.cljs$lang$maxFixedArity = 3;
        G__7594.cljs$lang$applyTo = function(arglist__7595) {
          var a = cljs.core.first(arglist__7595);
          var b = cljs.core.first(cljs.core.next(arglist__7595));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7595)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7595)));
          return G__7594__delegate(a, b, c, ds)
        };
        G__7594.cljs$lang$arity$variadic = G__7594__delegate;
        return G__7594
      }();
      G__7593 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 1:
            return G__7593__1.call(this, a);
          case 2:
            return G__7593__2.call(this, a, b);
          case 3:
            return G__7593__3.call(this, a, b, c);
          default:
            return G__7593__4.cljs$lang$arity$variadic(a, b, c, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__7593.cljs$lang$maxFixedArity = 3;
      G__7593.cljs$lang$applyTo = G__7593__4.cljs$lang$applyTo;
      return G__7593
    }()
  };
  var fnil__3 = function(f, x, y) {
    return function() {
      var G__7596 = null;
      var G__7596__2 = function(a, b) {
        return f.call(null, a == null ? x : a, b == null ? y : b)
      };
      var G__7596__3 = function(a, b, c) {
        return f.call(null, a == null ? x : a, b == null ? y : b, c)
      };
      var G__7596__4 = function() {
        var G__7597__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, a == null ? x : a, b == null ? y : b, c, ds)
        };
        var G__7597 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__7597__delegate.call(this, a, b, c, ds)
        };
        G__7597.cljs$lang$maxFixedArity = 3;
        G__7597.cljs$lang$applyTo = function(arglist__7598) {
          var a = cljs.core.first(arglist__7598);
          var b = cljs.core.first(cljs.core.next(arglist__7598));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7598)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7598)));
          return G__7597__delegate(a, b, c, ds)
        };
        G__7597.cljs$lang$arity$variadic = G__7597__delegate;
        return G__7597
      }();
      G__7596 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 2:
            return G__7596__2.call(this, a, b);
          case 3:
            return G__7596__3.call(this, a, b, c);
          default:
            return G__7596__4.cljs$lang$arity$variadic(a, b, c, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__7596.cljs$lang$maxFixedArity = 3;
      G__7596.cljs$lang$applyTo = G__7596__4.cljs$lang$applyTo;
      return G__7596
    }()
  };
  var fnil__4 = function(f, x, y, z) {
    return function() {
      var G__7599 = null;
      var G__7599__2 = function(a, b) {
        return f.call(null, a == null ? x : a, b == null ? y : b)
      };
      var G__7599__3 = function(a, b, c) {
        return f.call(null, a == null ? x : a, b == null ? y : b, c == null ? z : c)
      };
      var G__7599__4 = function() {
        var G__7600__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, a == null ? x : a, b == null ? y : b, c == null ? z : c, ds)
        };
        var G__7600 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__7600__delegate.call(this, a, b, c, ds)
        };
        G__7600.cljs$lang$maxFixedArity = 3;
        G__7600.cljs$lang$applyTo = function(arglist__7601) {
          var a = cljs.core.first(arglist__7601);
          var b = cljs.core.first(cljs.core.next(arglist__7601));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7601)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7601)));
          return G__7600__delegate(a, b, c, ds)
        };
        G__7600.cljs$lang$arity$variadic = G__7600__delegate;
        return G__7600
      }();
      G__7599 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 2:
            return G__7599__2.call(this, a, b);
          case 3:
            return G__7599__3.call(this, a, b, c);
          default:
            return G__7599__4.cljs$lang$arity$variadic(a, b, c, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__7599.cljs$lang$maxFixedArity = 3;
      G__7599.cljs$lang$applyTo = G__7599__4.cljs$lang$applyTo;
      return G__7599
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
  var mapi__7617 = function mapi(idx, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____7625 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____7625) {
        var s__7626 = temp__3974__auto____7625;
        if(cljs.core.chunked_seq_QMARK_.call(null, s__7626)) {
          var c__7627 = cljs.core.chunk_first.call(null, s__7626);
          var size__7628 = cljs.core.count.call(null, c__7627);
          var b__7629 = cljs.core.chunk_buffer.call(null, size__7628);
          var n__2555__auto____7630 = size__7628;
          var i__7631 = 0;
          while(true) {
            if(i__7631 < n__2555__auto____7630) {
              cljs.core.chunk_append.call(null, b__7629, f.call(null, idx + i__7631, cljs.core._nth.call(null, c__7627, i__7631)));
              var G__7632 = i__7631 + 1;
              i__7631 = G__7632;
              continue
            }else {
            }
            break
          }
          return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__7629), mapi.call(null, idx + size__7628, cljs.core.chunk_rest.call(null, s__7626)))
        }else {
          return cljs.core.cons.call(null, f.call(null, idx, cljs.core.first.call(null, s__7626)), mapi.call(null, idx + 1, cljs.core.rest.call(null, s__7626)))
        }
      }else {
        return null
      }
    }, null)
  };
  return mapi__7617.call(null, 0, coll)
};
cljs.core.keep = function keep(f, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____7642 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____7642) {
      var s__7643 = temp__3974__auto____7642;
      if(cljs.core.chunked_seq_QMARK_.call(null, s__7643)) {
        var c__7644 = cljs.core.chunk_first.call(null, s__7643);
        var size__7645 = cljs.core.count.call(null, c__7644);
        var b__7646 = cljs.core.chunk_buffer.call(null, size__7645);
        var n__2555__auto____7647 = size__7645;
        var i__7648 = 0;
        while(true) {
          if(i__7648 < n__2555__auto____7647) {
            var x__7649 = f.call(null, cljs.core._nth.call(null, c__7644, i__7648));
            if(x__7649 == null) {
            }else {
              cljs.core.chunk_append.call(null, b__7646, x__7649)
            }
            var G__7651 = i__7648 + 1;
            i__7648 = G__7651;
            continue
          }else {
          }
          break
        }
        return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__7646), keep.call(null, f, cljs.core.chunk_rest.call(null, s__7643)))
      }else {
        var x__7650 = f.call(null, cljs.core.first.call(null, s__7643));
        if(x__7650 == null) {
          return keep.call(null, f, cljs.core.rest.call(null, s__7643))
        }else {
          return cljs.core.cons.call(null, x__7650, keep.call(null, f, cljs.core.rest.call(null, s__7643)))
        }
      }
    }else {
      return null
    }
  }, null)
};
cljs.core.keep_indexed = function keep_indexed(f, coll) {
  var keepi__7677 = function keepi(idx, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____7687 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____7687) {
        var s__7688 = temp__3974__auto____7687;
        if(cljs.core.chunked_seq_QMARK_.call(null, s__7688)) {
          var c__7689 = cljs.core.chunk_first.call(null, s__7688);
          var size__7690 = cljs.core.count.call(null, c__7689);
          var b__7691 = cljs.core.chunk_buffer.call(null, size__7690);
          var n__2555__auto____7692 = size__7690;
          var i__7693 = 0;
          while(true) {
            if(i__7693 < n__2555__auto____7692) {
              var x__7694 = f.call(null, idx + i__7693, cljs.core._nth.call(null, c__7689, i__7693));
              if(x__7694 == null) {
              }else {
                cljs.core.chunk_append.call(null, b__7691, x__7694)
              }
              var G__7696 = i__7693 + 1;
              i__7693 = G__7696;
              continue
            }else {
            }
            break
          }
          return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__7691), keepi.call(null, idx + size__7690, cljs.core.chunk_rest.call(null, s__7688)))
        }else {
          var x__7695 = f.call(null, idx, cljs.core.first.call(null, s__7688));
          if(x__7695 == null) {
            return keepi.call(null, idx + 1, cljs.core.rest.call(null, s__7688))
          }else {
            return cljs.core.cons.call(null, x__7695, keepi.call(null, idx + 1, cljs.core.rest.call(null, s__7688)))
          }
        }
      }else {
        return null
      }
    }, null)
  };
  return keepi__7677.call(null, 0, coll)
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
          var and__3822__auto____7782 = p.call(null, x);
          if(cljs.core.truth_(and__3822__auto____7782)) {
            return p.call(null, y)
          }else {
            return and__3822__auto____7782
          }
        }())
      };
      var ep1__3 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____7783 = p.call(null, x);
          if(cljs.core.truth_(and__3822__auto____7783)) {
            var and__3822__auto____7784 = p.call(null, y);
            if(cljs.core.truth_(and__3822__auto____7784)) {
              return p.call(null, z)
            }else {
              return and__3822__auto____7784
            }
          }else {
            return and__3822__auto____7783
          }
        }())
      };
      var ep1__4 = function() {
        var G__7853__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3822__auto____7785 = ep1.call(null, x, y, z);
            if(cljs.core.truth_(and__3822__auto____7785)) {
              return cljs.core.every_QMARK_.call(null, p, args)
            }else {
              return and__3822__auto____7785
            }
          }())
        };
        var G__7853 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__7853__delegate.call(this, x, y, z, args)
        };
        G__7853.cljs$lang$maxFixedArity = 3;
        G__7853.cljs$lang$applyTo = function(arglist__7854) {
          var x = cljs.core.first(arglist__7854);
          var y = cljs.core.first(cljs.core.next(arglist__7854));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7854)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7854)));
          return G__7853__delegate(x, y, z, args)
        };
        G__7853.cljs$lang$arity$variadic = G__7853__delegate;
        return G__7853
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
          var and__3822__auto____7797 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____7797)) {
            return p2.call(null, x)
          }else {
            return and__3822__auto____7797
          }
        }())
      };
      var ep2__2 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____7798 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____7798)) {
            var and__3822__auto____7799 = p1.call(null, y);
            if(cljs.core.truth_(and__3822__auto____7799)) {
              var and__3822__auto____7800 = p2.call(null, x);
              if(cljs.core.truth_(and__3822__auto____7800)) {
                return p2.call(null, y)
              }else {
                return and__3822__auto____7800
              }
            }else {
              return and__3822__auto____7799
            }
          }else {
            return and__3822__auto____7798
          }
        }())
      };
      var ep2__3 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____7801 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____7801)) {
            var and__3822__auto____7802 = p1.call(null, y);
            if(cljs.core.truth_(and__3822__auto____7802)) {
              var and__3822__auto____7803 = p1.call(null, z);
              if(cljs.core.truth_(and__3822__auto____7803)) {
                var and__3822__auto____7804 = p2.call(null, x);
                if(cljs.core.truth_(and__3822__auto____7804)) {
                  var and__3822__auto____7805 = p2.call(null, y);
                  if(cljs.core.truth_(and__3822__auto____7805)) {
                    return p2.call(null, z)
                  }else {
                    return and__3822__auto____7805
                  }
                }else {
                  return and__3822__auto____7804
                }
              }else {
                return and__3822__auto____7803
              }
            }else {
              return and__3822__auto____7802
            }
          }else {
            return and__3822__auto____7801
          }
        }())
      };
      var ep2__4 = function() {
        var G__7855__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3822__auto____7806 = ep2.call(null, x, y, z);
            if(cljs.core.truth_(and__3822__auto____7806)) {
              return cljs.core.every_QMARK_.call(null, function(p1__7652_SHARP_) {
                var and__3822__auto____7807 = p1.call(null, p1__7652_SHARP_);
                if(cljs.core.truth_(and__3822__auto____7807)) {
                  return p2.call(null, p1__7652_SHARP_)
                }else {
                  return and__3822__auto____7807
                }
              }, args)
            }else {
              return and__3822__auto____7806
            }
          }())
        };
        var G__7855 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__7855__delegate.call(this, x, y, z, args)
        };
        G__7855.cljs$lang$maxFixedArity = 3;
        G__7855.cljs$lang$applyTo = function(arglist__7856) {
          var x = cljs.core.first(arglist__7856);
          var y = cljs.core.first(cljs.core.next(arglist__7856));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7856)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7856)));
          return G__7855__delegate(x, y, z, args)
        };
        G__7855.cljs$lang$arity$variadic = G__7855__delegate;
        return G__7855
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
          var and__3822__auto____7826 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____7826)) {
            var and__3822__auto____7827 = p2.call(null, x);
            if(cljs.core.truth_(and__3822__auto____7827)) {
              return p3.call(null, x)
            }else {
              return and__3822__auto____7827
            }
          }else {
            return and__3822__auto____7826
          }
        }())
      };
      var ep3__2 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____7828 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____7828)) {
            var and__3822__auto____7829 = p2.call(null, x);
            if(cljs.core.truth_(and__3822__auto____7829)) {
              var and__3822__auto____7830 = p3.call(null, x);
              if(cljs.core.truth_(and__3822__auto____7830)) {
                var and__3822__auto____7831 = p1.call(null, y);
                if(cljs.core.truth_(and__3822__auto____7831)) {
                  var and__3822__auto____7832 = p2.call(null, y);
                  if(cljs.core.truth_(and__3822__auto____7832)) {
                    return p3.call(null, y)
                  }else {
                    return and__3822__auto____7832
                  }
                }else {
                  return and__3822__auto____7831
                }
              }else {
                return and__3822__auto____7830
              }
            }else {
              return and__3822__auto____7829
            }
          }else {
            return and__3822__auto____7828
          }
        }())
      };
      var ep3__3 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____7833 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____7833)) {
            var and__3822__auto____7834 = p2.call(null, x);
            if(cljs.core.truth_(and__3822__auto____7834)) {
              var and__3822__auto____7835 = p3.call(null, x);
              if(cljs.core.truth_(and__3822__auto____7835)) {
                var and__3822__auto____7836 = p1.call(null, y);
                if(cljs.core.truth_(and__3822__auto____7836)) {
                  var and__3822__auto____7837 = p2.call(null, y);
                  if(cljs.core.truth_(and__3822__auto____7837)) {
                    var and__3822__auto____7838 = p3.call(null, y);
                    if(cljs.core.truth_(and__3822__auto____7838)) {
                      var and__3822__auto____7839 = p1.call(null, z);
                      if(cljs.core.truth_(and__3822__auto____7839)) {
                        var and__3822__auto____7840 = p2.call(null, z);
                        if(cljs.core.truth_(and__3822__auto____7840)) {
                          return p3.call(null, z)
                        }else {
                          return and__3822__auto____7840
                        }
                      }else {
                        return and__3822__auto____7839
                      }
                    }else {
                      return and__3822__auto____7838
                    }
                  }else {
                    return and__3822__auto____7837
                  }
                }else {
                  return and__3822__auto____7836
                }
              }else {
                return and__3822__auto____7835
              }
            }else {
              return and__3822__auto____7834
            }
          }else {
            return and__3822__auto____7833
          }
        }())
      };
      var ep3__4 = function() {
        var G__7857__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3822__auto____7841 = ep3.call(null, x, y, z);
            if(cljs.core.truth_(and__3822__auto____7841)) {
              return cljs.core.every_QMARK_.call(null, function(p1__7653_SHARP_) {
                var and__3822__auto____7842 = p1.call(null, p1__7653_SHARP_);
                if(cljs.core.truth_(and__3822__auto____7842)) {
                  var and__3822__auto____7843 = p2.call(null, p1__7653_SHARP_);
                  if(cljs.core.truth_(and__3822__auto____7843)) {
                    return p3.call(null, p1__7653_SHARP_)
                  }else {
                    return and__3822__auto____7843
                  }
                }else {
                  return and__3822__auto____7842
                }
              }, args)
            }else {
              return and__3822__auto____7841
            }
          }())
        };
        var G__7857 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__7857__delegate.call(this, x, y, z, args)
        };
        G__7857.cljs$lang$maxFixedArity = 3;
        G__7857.cljs$lang$applyTo = function(arglist__7858) {
          var x = cljs.core.first(arglist__7858);
          var y = cljs.core.first(cljs.core.next(arglist__7858));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7858)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7858)));
          return G__7857__delegate(x, y, z, args)
        };
        G__7857.cljs$lang$arity$variadic = G__7857__delegate;
        return G__7857
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
    var G__7859__delegate = function(p1, p2, p3, ps) {
      var ps__7844 = cljs.core.list_STAR_.call(null, p1, p2, p3, ps);
      return function() {
        var epn = null;
        var epn__0 = function() {
          return true
        };
        var epn__1 = function(x) {
          return cljs.core.every_QMARK_.call(null, function(p1__7654_SHARP_) {
            return p1__7654_SHARP_.call(null, x)
          }, ps__7844)
        };
        var epn__2 = function(x, y) {
          return cljs.core.every_QMARK_.call(null, function(p1__7655_SHARP_) {
            var and__3822__auto____7849 = p1__7655_SHARP_.call(null, x);
            if(cljs.core.truth_(and__3822__auto____7849)) {
              return p1__7655_SHARP_.call(null, y)
            }else {
              return and__3822__auto____7849
            }
          }, ps__7844)
        };
        var epn__3 = function(x, y, z) {
          return cljs.core.every_QMARK_.call(null, function(p1__7656_SHARP_) {
            var and__3822__auto____7850 = p1__7656_SHARP_.call(null, x);
            if(cljs.core.truth_(and__3822__auto____7850)) {
              var and__3822__auto____7851 = p1__7656_SHARP_.call(null, y);
              if(cljs.core.truth_(and__3822__auto____7851)) {
                return p1__7656_SHARP_.call(null, z)
              }else {
                return and__3822__auto____7851
              }
            }else {
              return and__3822__auto____7850
            }
          }, ps__7844)
        };
        var epn__4 = function() {
          var G__7860__delegate = function(x, y, z, args) {
            return cljs.core.boolean$.call(null, function() {
              var and__3822__auto____7852 = epn.call(null, x, y, z);
              if(cljs.core.truth_(and__3822__auto____7852)) {
                return cljs.core.every_QMARK_.call(null, function(p1__7657_SHARP_) {
                  return cljs.core.every_QMARK_.call(null, p1__7657_SHARP_, args)
                }, ps__7844)
              }else {
                return and__3822__auto____7852
              }
            }())
          };
          var G__7860 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__7860__delegate.call(this, x, y, z, args)
          };
          G__7860.cljs$lang$maxFixedArity = 3;
          G__7860.cljs$lang$applyTo = function(arglist__7861) {
            var x = cljs.core.first(arglist__7861);
            var y = cljs.core.first(cljs.core.next(arglist__7861));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7861)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7861)));
            return G__7860__delegate(x, y, z, args)
          };
          G__7860.cljs$lang$arity$variadic = G__7860__delegate;
          return G__7860
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
    var G__7859 = function(p1, p2, p3, var_args) {
      var ps = null;
      if(goog.isDef(var_args)) {
        ps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__7859__delegate.call(this, p1, p2, p3, ps)
    };
    G__7859.cljs$lang$maxFixedArity = 3;
    G__7859.cljs$lang$applyTo = function(arglist__7862) {
      var p1 = cljs.core.first(arglist__7862);
      var p2 = cljs.core.first(cljs.core.next(arglist__7862));
      var p3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7862)));
      var ps = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7862)));
      return G__7859__delegate(p1, p2, p3, ps)
    };
    G__7859.cljs$lang$arity$variadic = G__7859__delegate;
    return G__7859
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
        var or__3824__auto____7943 = p.call(null, x);
        if(cljs.core.truth_(or__3824__auto____7943)) {
          return or__3824__auto____7943
        }else {
          return p.call(null, y)
        }
      };
      var sp1__3 = function(x, y, z) {
        var or__3824__auto____7944 = p.call(null, x);
        if(cljs.core.truth_(or__3824__auto____7944)) {
          return or__3824__auto____7944
        }else {
          var or__3824__auto____7945 = p.call(null, y);
          if(cljs.core.truth_(or__3824__auto____7945)) {
            return or__3824__auto____7945
          }else {
            return p.call(null, z)
          }
        }
      };
      var sp1__4 = function() {
        var G__8014__delegate = function(x, y, z, args) {
          var or__3824__auto____7946 = sp1.call(null, x, y, z);
          if(cljs.core.truth_(or__3824__auto____7946)) {
            return or__3824__auto____7946
          }else {
            return cljs.core.some.call(null, p, args)
          }
        };
        var G__8014 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__8014__delegate.call(this, x, y, z, args)
        };
        G__8014.cljs$lang$maxFixedArity = 3;
        G__8014.cljs$lang$applyTo = function(arglist__8015) {
          var x = cljs.core.first(arglist__8015);
          var y = cljs.core.first(cljs.core.next(arglist__8015));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8015)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8015)));
          return G__8014__delegate(x, y, z, args)
        };
        G__8014.cljs$lang$arity$variadic = G__8014__delegate;
        return G__8014
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
        var or__3824__auto____7958 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____7958)) {
          return or__3824__auto____7958
        }else {
          return p2.call(null, x)
        }
      };
      var sp2__2 = function(x, y) {
        var or__3824__auto____7959 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____7959)) {
          return or__3824__auto____7959
        }else {
          var or__3824__auto____7960 = p1.call(null, y);
          if(cljs.core.truth_(or__3824__auto____7960)) {
            return or__3824__auto____7960
          }else {
            var or__3824__auto____7961 = p2.call(null, x);
            if(cljs.core.truth_(or__3824__auto____7961)) {
              return or__3824__auto____7961
            }else {
              return p2.call(null, y)
            }
          }
        }
      };
      var sp2__3 = function(x, y, z) {
        var or__3824__auto____7962 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____7962)) {
          return or__3824__auto____7962
        }else {
          var or__3824__auto____7963 = p1.call(null, y);
          if(cljs.core.truth_(or__3824__auto____7963)) {
            return or__3824__auto____7963
          }else {
            var or__3824__auto____7964 = p1.call(null, z);
            if(cljs.core.truth_(or__3824__auto____7964)) {
              return or__3824__auto____7964
            }else {
              var or__3824__auto____7965 = p2.call(null, x);
              if(cljs.core.truth_(or__3824__auto____7965)) {
                return or__3824__auto____7965
              }else {
                var or__3824__auto____7966 = p2.call(null, y);
                if(cljs.core.truth_(or__3824__auto____7966)) {
                  return or__3824__auto____7966
                }else {
                  return p2.call(null, z)
                }
              }
            }
          }
        }
      };
      var sp2__4 = function() {
        var G__8016__delegate = function(x, y, z, args) {
          var or__3824__auto____7967 = sp2.call(null, x, y, z);
          if(cljs.core.truth_(or__3824__auto____7967)) {
            return or__3824__auto____7967
          }else {
            return cljs.core.some.call(null, function(p1__7697_SHARP_) {
              var or__3824__auto____7968 = p1.call(null, p1__7697_SHARP_);
              if(cljs.core.truth_(or__3824__auto____7968)) {
                return or__3824__auto____7968
              }else {
                return p2.call(null, p1__7697_SHARP_)
              }
            }, args)
          }
        };
        var G__8016 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__8016__delegate.call(this, x, y, z, args)
        };
        G__8016.cljs$lang$maxFixedArity = 3;
        G__8016.cljs$lang$applyTo = function(arglist__8017) {
          var x = cljs.core.first(arglist__8017);
          var y = cljs.core.first(cljs.core.next(arglist__8017));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8017)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8017)));
          return G__8016__delegate(x, y, z, args)
        };
        G__8016.cljs$lang$arity$variadic = G__8016__delegate;
        return G__8016
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
        var or__3824__auto____7987 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____7987)) {
          return or__3824__auto____7987
        }else {
          var or__3824__auto____7988 = p2.call(null, x);
          if(cljs.core.truth_(or__3824__auto____7988)) {
            return or__3824__auto____7988
          }else {
            return p3.call(null, x)
          }
        }
      };
      var sp3__2 = function(x, y) {
        var or__3824__auto____7989 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____7989)) {
          return or__3824__auto____7989
        }else {
          var or__3824__auto____7990 = p2.call(null, x);
          if(cljs.core.truth_(or__3824__auto____7990)) {
            return or__3824__auto____7990
          }else {
            var or__3824__auto____7991 = p3.call(null, x);
            if(cljs.core.truth_(or__3824__auto____7991)) {
              return or__3824__auto____7991
            }else {
              var or__3824__auto____7992 = p1.call(null, y);
              if(cljs.core.truth_(or__3824__auto____7992)) {
                return or__3824__auto____7992
              }else {
                var or__3824__auto____7993 = p2.call(null, y);
                if(cljs.core.truth_(or__3824__auto____7993)) {
                  return or__3824__auto____7993
                }else {
                  return p3.call(null, y)
                }
              }
            }
          }
        }
      };
      var sp3__3 = function(x, y, z) {
        var or__3824__auto____7994 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____7994)) {
          return or__3824__auto____7994
        }else {
          var or__3824__auto____7995 = p2.call(null, x);
          if(cljs.core.truth_(or__3824__auto____7995)) {
            return or__3824__auto____7995
          }else {
            var or__3824__auto____7996 = p3.call(null, x);
            if(cljs.core.truth_(or__3824__auto____7996)) {
              return or__3824__auto____7996
            }else {
              var or__3824__auto____7997 = p1.call(null, y);
              if(cljs.core.truth_(or__3824__auto____7997)) {
                return or__3824__auto____7997
              }else {
                var or__3824__auto____7998 = p2.call(null, y);
                if(cljs.core.truth_(or__3824__auto____7998)) {
                  return or__3824__auto____7998
                }else {
                  var or__3824__auto____7999 = p3.call(null, y);
                  if(cljs.core.truth_(or__3824__auto____7999)) {
                    return or__3824__auto____7999
                  }else {
                    var or__3824__auto____8000 = p1.call(null, z);
                    if(cljs.core.truth_(or__3824__auto____8000)) {
                      return or__3824__auto____8000
                    }else {
                      var or__3824__auto____8001 = p2.call(null, z);
                      if(cljs.core.truth_(or__3824__auto____8001)) {
                        return or__3824__auto____8001
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
        var G__8018__delegate = function(x, y, z, args) {
          var or__3824__auto____8002 = sp3.call(null, x, y, z);
          if(cljs.core.truth_(or__3824__auto____8002)) {
            return or__3824__auto____8002
          }else {
            return cljs.core.some.call(null, function(p1__7698_SHARP_) {
              var or__3824__auto____8003 = p1.call(null, p1__7698_SHARP_);
              if(cljs.core.truth_(or__3824__auto____8003)) {
                return or__3824__auto____8003
              }else {
                var or__3824__auto____8004 = p2.call(null, p1__7698_SHARP_);
                if(cljs.core.truth_(or__3824__auto____8004)) {
                  return or__3824__auto____8004
                }else {
                  return p3.call(null, p1__7698_SHARP_)
                }
              }
            }, args)
          }
        };
        var G__8018 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__8018__delegate.call(this, x, y, z, args)
        };
        G__8018.cljs$lang$maxFixedArity = 3;
        G__8018.cljs$lang$applyTo = function(arglist__8019) {
          var x = cljs.core.first(arglist__8019);
          var y = cljs.core.first(cljs.core.next(arglist__8019));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8019)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8019)));
          return G__8018__delegate(x, y, z, args)
        };
        G__8018.cljs$lang$arity$variadic = G__8018__delegate;
        return G__8018
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
    var G__8020__delegate = function(p1, p2, p3, ps) {
      var ps__8005 = cljs.core.list_STAR_.call(null, p1, p2, p3, ps);
      return function() {
        var spn = null;
        var spn__0 = function() {
          return null
        };
        var spn__1 = function(x) {
          return cljs.core.some.call(null, function(p1__7699_SHARP_) {
            return p1__7699_SHARP_.call(null, x)
          }, ps__8005)
        };
        var spn__2 = function(x, y) {
          return cljs.core.some.call(null, function(p1__7700_SHARP_) {
            var or__3824__auto____8010 = p1__7700_SHARP_.call(null, x);
            if(cljs.core.truth_(or__3824__auto____8010)) {
              return or__3824__auto____8010
            }else {
              return p1__7700_SHARP_.call(null, y)
            }
          }, ps__8005)
        };
        var spn__3 = function(x, y, z) {
          return cljs.core.some.call(null, function(p1__7701_SHARP_) {
            var or__3824__auto____8011 = p1__7701_SHARP_.call(null, x);
            if(cljs.core.truth_(or__3824__auto____8011)) {
              return or__3824__auto____8011
            }else {
              var or__3824__auto____8012 = p1__7701_SHARP_.call(null, y);
              if(cljs.core.truth_(or__3824__auto____8012)) {
                return or__3824__auto____8012
              }else {
                return p1__7701_SHARP_.call(null, z)
              }
            }
          }, ps__8005)
        };
        var spn__4 = function() {
          var G__8021__delegate = function(x, y, z, args) {
            var or__3824__auto____8013 = spn.call(null, x, y, z);
            if(cljs.core.truth_(or__3824__auto____8013)) {
              return or__3824__auto____8013
            }else {
              return cljs.core.some.call(null, function(p1__7702_SHARP_) {
                return cljs.core.some.call(null, p1__7702_SHARP_, args)
              }, ps__8005)
            }
          };
          var G__8021 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__8021__delegate.call(this, x, y, z, args)
          };
          G__8021.cljs$lang$maxFixedArity = 3;
          G__8021.cljs$lang$applyTo = function(arglist__8022) {
            var x = cljs.core.first(arglist__8022);
            var y = cljs.core.first(cljs.core.next(arglist__8022));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8022)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8022)));
            return G__8021__delegate(x, y, z, args)
          };
          G__8021.cljs$lang$arity$variadic = G__8021__delegate;
          return G__8021
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
    var G__8020 = function(p1, p2, p3, var_args) {
      var ps = null;
      if(goog.isDef(var_args)) {
        ps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__8020__delegate.call(this, p1, p2, p3, ps)
    };
    G__8020.cljs$lang$maxFixedArity = 3;
    G__8020.cljs$lang$applyTo = function(arglist__8023) {
      var p1 = cljs.core.first(arglist__8023);
      var p2 = cljs.core.first(cljs.core.next(arglist__8023));
      var p3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8023)));
      var ps = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8023)));
      return G__8020__delegate(p1, p2, p3, ps)
    };
    G__8020.cljs$lang$arity$variadic = G__8020__delegate;
    return G__8020
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
      var temp__3974__auto____8042 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____8042) {
        var s__8043 = temp__3974__auto____8042;
        if(cljs.core.chunked_seq_QMARK_.call(null, s__8043)) {
          var c__8044 = cljs.core.chunk_first.call(null, s__8043);
          var size__8045 = cljs.core.count.call(null, c__8044);
          var b__8046 = cljs.core.chunk_buffer.call(null, size__8045);
          var n__2555__auto____8047 = size__8045;
          var i__8048 = 0;
          while(true) {
            if(i__8048 < n__2555__auto____8047) {
              cljs.core.chunk_append.call(null, b__8046, f.call(null, cljs.core._nth.call(null, c__8044, i__8048)));
              var G__8060 = i__8048 + 1;
              i__8048 = G__8060;
              continue
            }else {
            }
            break
          }
          return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__8046), map.call(null, f, cljs.core.chunk_rest.call(null, s__8043)))
        }else {
          return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s__8043)), map.call(null, f, cljs.core.rest.call(null, s__8043)))
        }
      }else {
        return null
      }
    }, null)
  };
  var map__3 = function(f, c1, c2) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1__8049 = cljs.core.seq.call(null, c1);
      var s2__8050 = cljs.core.seq.call(null, c2);
      if(function() {
        var and__3822__auto____8051 = s1__8049;
        if(and__3822__auto____8051) {
          return s2__8050
        }else {
          return and__3822__auto____8051
        }
      }()) {
        return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s1__8049), cljs.core.first.call(null, s2__8050)), map.call(null, f, cljs.core.rest.call(null, s1__8049), cljs.core.rest.call(null, s2__8050)))
      }else {
        return null
      }
    }, null)
  };
  var map__4 = function(f, c1, c2, c3) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1__8052 = cljs.core.seq.call(null, c1);
      var s2__8053 = cljs.core.seq.call(null, c2);
      var s3__8054 = cljs.core.seq.call(null, c3);
      if(function() {
        var and__3822__auto____8055 = s1__8052;
        if(and__3822__auto____8055) {
          var and__3822__auto____8056 = s2__8053;
          if(and__3822__auto____8056) {
            return s3__8054
          }else {
            return and__3822__auto____8056
          }
        }else {
          return and__3822__auto____8055
        }
      }()) {
        return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s1__8052), cljs.core.first.call(null, s2__8053), cljs.core.first.call(null, s3__8054)), map.call(null, f, cljs.core.rest.call(null, s1__8052), cljs.core.rest.call(null, s2__8053), cljs.core.rest.call(null, s3__8054)))
      }else {
        return null
      }
    }, null)
  };
  var map__5 = function() {
    var G__8061__delegate = function(f, c1, c2, c3, colls) {
      var step__8059 = function step(cs) {
        return new cljs.core.LazySeq(null, false, function() {
          var ss__8058 = map.call(null, cljs.core.seq, cs);
          if(cljs.core.every_QMARK_.call(null, cljs.core.identity, ss__8058)) {
            return cljs.core.cons.call(null, map.call(null, cljs.core.first, ss__8058), step.call(null, map.call(null, cljs.core.rest, ss__8058)))
          }else {
            return null
          }
        }, null)
      };
      return map.call(null, function(p1__7863_SHARP_) {
        return cljs.core.apply.call(null, f, p1__7863_SHARP_)
      }, step__8059.call(null, cljs.core.conj.call(null, colls, c3, c2, c1)))
    };
    var G__8061 = function(f, c1, c2, c3, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__8061__delegate.call(this, f, c1, c2, c3, colls)
    };
    G__8061.cljs$lang$maxFixedArity = 4;
    G__8061.cljs$lang$applyTo = function(arglist__8062) {
      var f = cljs.core.first(arglist__8062);
      var c1 = cljs.core.first(cljs.core.next(arglist__8062));
      var c2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8062)));
      var c3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__8062))));
      var colls = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__8062))));
      return G__8061__delegate(f, c1, c2, c3, colls)
    };
    G__8061.cljs$lang$arity$variadic = G__8061__delegate;
    return G__8061
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
      var temp__3974__auto____8065 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____8065) {
        var s__8066 = temp__3974__auto____8065;
        return cljs.core.cons.call(null, cljs.core.first.call(null, s__8066), take.call(null, n - 1, cljs.core.rest.call(null, s__8066)))
      }else {
        return null
      }
    }else {
      return null
    }
  }, null)
};
cljs.core.drop = function drop(n, coll) {
  var step__8072 = function(n, coll) {
    while(true) {
      var s__8070 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(function() {
        var and__3822__auto____8071 = n > 0;
        if(and__3822__auto____8071) {
          return s__8070
        }else {
          return and__3822__auto____8071
        }
      }())) {
        var G__8073 = n - 1;
        var G__8074 = cljs.core.rest.call(null, s__8070);
        n = G__8073;
        coll = G__8074;
        continue
      }else {
        return s__8070
      }
      break
    }
  };
  return new cljs.core.LazySeq(null, false, function() {
    return step__8072.call(null, n, coll)
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
  var s__8077 = cljs.core.seq.call(null, coll);
  var lead__8078 = cljs.core.seq.call(null, cljs.core.drop.call(null, n, coll));
  while(true) {
    if(lead__8078) {
      var G__8079 = cljs.core.next.call(null, s__8077);
      var G__8080 = cljs.core.next.call(null, lead__8078);
      s__8077 = G__8079;
      lead__8078 = G__8080;
      continue
    }else {
      return s__8077
    }
    break
  }
};
cljs.core.drop_while = function drop_while(pred, coll) {
  var step__8086 = function(pred, coll) {
    while(true) {
      var s__8084 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(function() {
        var and__3822__auto____8085 = s__8084;
        if(and__3822__auto____8085) {
          return pred.call(null, cljs.core.first.call(null, s__8084))
        }else {
          return and__3822__auto____8085
        }
      }())) {
        var G__8087 = pred;
        var G__8088 = cljs.core.rest.call(null, s__8084);
        pred = G__8087;
        coll = G__8088;
        continue
      }else {
        return s__8084
      }
      break
    }
  };
  return new cljs.core.LazySeq(null, false, function() {
    return step__8086.call(null, pred, coll)
  }, null)
};
cljs.core.cycle = function cycle(coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____8091 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____8091) {
      var s__8092 = temp__3974__auto____8091;
      return cljs.core.concat.call(null, s__8092, cycle.call(null, s__8092))
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
      var s1__8097 = cljs.core.seq.call(null, c1);
      var s2__8098 = cljs.core.seq.call(null, c2);
      if(function() {
        var and__3822__auto____8099 = s1__8097;
        if(and__3822__auto____8099) {
          return s2__8098
        }else {
          return and__3822__auto____8099
        }
      }()) {
        return cljs.core.cons.call(null, cljs.core.first.call(null, s1__8097), cljs.core.cons.call(null, cljs.core.first.call(null, s2__8098), interleave.call(null, cljs.core.rest.call(null, s1__8097), cljs.core.rest.call(null, s2__8098))))
      }else {
        return null
      }
    }, null)
  };
  var interleave__3 = function() {
    var G__8101__delegate = function(c1, c2, colls) {
      return new cljs.core.LazySeq(null, false, function() {
        var ss__8100 = cljs.core.map.call(null, cljs.core.seq, cljs.core.conj.call(null, colls, c2, c1));
        if(cljs.core.every_QMARK_.call(null, cljs.core.identity, ss__8100)) {
          return cljs.core.concat.call(null, cljs.core.map.call(null, cljs.core.first, ss__8100), cljs.core.apply.call(null, interleave, cljs.core.map.call(null, cljs.core.rest, ss__8100)))
        }else {
          return null
        }
      }, null)
    };
    var G__8101 = function(c1, c2, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__8101__delegate.call(this, c1, c2, colls)
    };
    G__8101.cljs$lang$maxFixedArity = 2;
    G__8101.cljs$lang$applyTo = function(arglist__8102) {
      var c1 = cljs.core.first(arglist__8102);
      var c2 = cljs.core.first(cljs.core.next(arglist__8102));
      var colls = cljs.core.rest(cljs.core.next(arglist__8102));
      return G__8101__delegate(c1, c2, colls)
    };
    G__8101.cljs$lang$arity$variadic = G__8101__delegate;
    return G__8101
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
  var cat__8112 = function cat(coll, colls) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3971__auto____8110 = cljs.core.seq.call(null, coll);
      if(temp__3971__auto____8110) {
        var coll__8111 = temp__3971__auto____8110;
        return cljs.core.cons.call(null, cljs.core.first.call(null, coll__8111), cat.call(null, cljs.core.rest.call(null, coll__8111), colls))
      }else {
        if(cljs.core.seq.call(null, colls)) {
          return cat.call(null, cljs.core.first.call(null, colls), cljs.core.rest.call(null, colls))
        }else {
          return null
        }
      }
    }, null)
  };
  return cat__8112.call(null, null, colls)
};
cljs.core.mapcat = function() {
  var mapcat = null;
  var mapcat__2 = function(f, coll) {
    return cljs.core.flatten1.call(null, cljs.core.map.call(null, f, coll))
  };
  var mapcat__3 = function() {
    var G__8113__delegate = function(f, coll, colls) {
      return cljs.core.flatten1.call(null, cljs.core.apply.call(null, cljs.core.map, f, coll, colls))
    };
    var G__8113 = function(f, coll, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__8113__delegate.call(this, f, coll, colls)
    };
    G__8113.cljs$lang$maxFixedArity = 2;
    G__8113.cljs$lang$applyTo = function(arglist__8114) {
      var f = cljs.core.first(arglist__8114);
      var coll = cljs.core.first(cljs.core.next(arglist__8114));
      var colls = cljs.core.rest(cljs.core.next(arglist__8114));
      return G__8113__delegate(f, coll, colls)
    };
    G__8113.cljs$lang$arity$variadic = G__8113__delegate;
    return G__8113
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
    var temp__3974__auto____8124 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____8124) {
      var s__8125 = temp__3974__auto____8124;
      if(cljs.core.chunked_seq_QMARK_.call(null, s__8125)) {
        var c__8126 = cljs.core.chunk_first.call(null, s__8125);
        var size__8127 = cljs.core.count.call(null, c__8126);
        var b__8128 = cljs.core.chunk_buffer.call(null, size__8127);
        var n__2555__auto____8129 = size__8127;
        var i__8130 = 0;
        while(true) {
          if(i__8130 < n__2555__auto____8129) {
            if(cljs.core.truth_(pred.call(null, cljs.core._nth.call(null, c__8126, i__8130)))) {
              cljs.core.chunk_append.call(null, b__8128, cljs.core._nth.call(null, c__8126, i__8130))
            }else {
            }
            var G__8133 = i__8130 + 1;
            i__8130 = G__8133;
            continue
          }else {
          }
          break
        }
        return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__8128), filter.call(null, pred, cljs.core.chunk_rest.call(null, s__8125)))
      }else {
        var f__8131 = cljs.core.first.call(null, s__8125);
        var r__8132 = cljs.core.rest.call(null, s__8125);
        if(cljs.core.truth_(pred.call(null, f__8131))) {
          return cljs.core.cons.call(null, f__8131, filter.call(null, pred, r__8132))
        }else {
          return filter.call(null, pred, r__8132)
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
  var walk__8136 = function walk(node) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, node, cljs.core.truth_(branch_QMARK_.call(null, node)) ? cljs.core.mapcat.call(null, walk, children.call(null, node)) : null)
    }, null)
  };
  return walk__8136.call(null, root)
};
cljs.core.flatten = function flatten(x) {
  return cljs.core.filter.call(null, function(p1__8134_SHARP_) {
    return!cljs.core.sequential_QMARK_.call(null, p1__8134_SHARP_)
  }, cljs.core.rest.call(null, cljs.core.tree_seq.call(null, cljs.core.sequential_QMARK_, cljs.core.seq, x)))
};
cljs.core.into = function into(to, from) {
  if(function() {
    var G__8140__8141 = to;
    if(G__8140__8141) {
      if(function() {
        var or__3824__auto____8142 = G__8140__8141.cljs$lang$protocol_mask$partition1$ & 1;
        if(or__3824__auto____8142) {
          return or__3824__auto____8142
        }else {
          return G__8140__8141.cljs$core$IEditableCollection$
        }
      }()) {
        return true
      }else {
        if(!G__8140__8141.cljs$lang$protocol_mask$partition1$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IEditableCollection, G__8140__8141)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IEditableCollection, G__8140__8141)
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
    var G__8143__delegate = function(f, c1, c2, c3, colls) {
      return cljs.core.into.call(null, cljs.core.PersistentVector.EMPTY, cljs.core.apply.call(null, cljs.core.map, f, c1, c2, c3, colls))
    };
    var G__8143 = function(f, c1, c2, c3, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__8143__delegate.call(this, f, c1, c2, c3, colls)
    };
    G__8143.cljs$lang$maxFixedArity = 4;
    G__8143.cljs$lang$applyTo = function(arglist__8144) {
      var f = cljs.core.first(arglist__8144);
      var c1 = cljs.core.first(cljs.core.next(arglist__8144));
      var c2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8144)));
      var c3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__8144))));
      var colls = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__8144))));
      return G__8143__delegate(f, c1, c2, c3, colls)
    };
    G__8143.cljs$lang$arity$variadic = G__8143__delegate;
    return G__8143
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
      var temp__3974__auto____8151 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____8151) {
        var s__8152 = temp__3974__auto____8151;
        var p__8153 = cljs.core.take.call(null, n, s__8152);
        if(n === cljs.core.count.call(null, p__8153)) {
          return cljs.core.cons.call(null, p__8153, partition.call(null, n, step, cljs.core.drop.call(null, step, s__8152)))
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
      var temp__3974__auto____8154 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____8154) {
        var s__8155 = temp__3974__auto____8154;
        var p__8156 = cljs.core.take.call(null, n, s__8155);
        if(n === cljs.core.count.call(null, p__8156)) {
          return cljs.core.cons.call(null, p__8156, partition.call(null, n, step, pad, cljs.core.drop.call(null, step, s__8155)))
        }else {
          return cljs.core.list.call(null, cljs.core.take.call(null, n, cljs.core.concat.call(null, p__8156, pad)))
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
    var sentinel__8161 = cljs.core.lookup_sentinel;
    var m__8162 = m;
    var ks__8163 = cljs.core.seq.call(null, ks);
    while(true) {
      if(ks__8163) {
        var m__8164 = cljs.core._lookup.call(null, m__8162, cljs.core.first.call(null, ks__8163), sentinel__8161);
        if(sentinel__8161 === m__8164) {
          return not_found
        }else {
          var G__8165 = sentinel__8161;
          var G__8166 = m__8164;
          var G__8167 = cljs.core.next.call(null, ks__8163);
          sentinel__8161 = G__8165;
          m__8162 = G__8166;
          ks__8163 = G__8167;
          continue
        }
      }else {
        return m__8162
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
cljs.core.assoc_in = function assoc_in(m, p__8168, v) {
  var vec__8173__8174 = p__8168;
  var k__8175 = cljs.core.nth.call(null, vec__8173__8174, 0, null);
  var ks__8176 = cljs.core.nthnext.call(null, vec__8173__8174, 1);
  if(cljs.core.truth_(ks__8176)) {
    return cljs.core.assoc.call(null, m, k__8175, assoc_in.call(null, cljs.core._lookup.call(null, m, k__8175, null), ks__8176, v))
  }else {
    return cljs.core.assoc.call(null, m, k__8175, v)
  }
};
cljs.core.update_in = function() {
  var update_in__delegate = function(m, p__8177, f, args) {
    var vec__8182__8183 = p__8177;
    var k__8184 = cljs.core.nth.call(null, vec__8182__8183, 0, null);
    var ks__8185 = cljs.core.nthnext.call(null, vec__8182__8183, 1);
    if(cljs.core.truth_(ks__8185)) {
      return cljs.core.assoc.call(null, m, k__8184, cljs.core.apply.call(null, update_in, cljs.core._lookup.call(null, m, k__8184, null), ks__8185, f, args))
    }else {
      return cljs.core.assoc.call(null, m, k__8184, cljs.core.apply.call(null, f, cljs.core._lookup.call(null, m, k__8184, null), args))
    }
  };
  var update_in = function(m, p__8177, f, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
    }
    return update_in__delegate.call(this, m, p__8177, f, args)
  };
  update_in.cljs$lang$maxFixedArity = 3;
  update_in.cljs$lang$applyTo = function(arglist__8186) {
    var m = cljs.core.first(arglist__8186);
    var p__8177 = cljs.core.first(cljs.core.next(arglist__8186));
    var f = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8186)));
    var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8186)));
    return update_in__delegate(m, p__8177, f, args)
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
cljs.core.Vector.cljs$lang$ctorPrSeq = function(this__2337__auto__) {
  return cljs.core.list.call(null, "cljs.core/Vector")
};
cljs.core.Vector.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__8189 = this;
  var h__2220__auto____8190 = this__8189.__hash;
  if(!(h__2220__auto____8190 == null)) {
    return h__2220__auto____8190
  }else {
    var h__2220__auto____8191 = cljs.core.hash_coll.call(null, coll);
    this__8189.__hash = h__2220__auto____8191;
    return h__2220__auto____8191
  }
};
cljs.core.Vector.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__8192 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, null)
};
cljs.core.Vector.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__8193 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, not_found)
};
cljs.core.Vector.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__8194 = this;
  var new_array__8195 = this__8194.array.slice();
  new_array__8195[k] = v;
  return new cljs.core.Vector(this__8194.meta, new_array__8195, null)
};
cljs.core.Vector.prototype.call = function() {
  var G__8226 = null;
  var G__8226__2 = function(this_sym8196, k) {
    var this__8198 = this;
    var this_sym8196__8199 = this;
    var coll__8200 = this_sym8196__8199;
    return coll__8200.cljs$core$ILookup$_lookup$arity$2(coll__8200, k)
  };
  var G__8226__3 = function(this_sym8197, k, not_found) {
    var this__8198 = this;
    var this_sym8197__8201 = this;
    var coll__8202 = this_sym8197__8201;
    return coll__8202.cljs$core$ILookup$_lookup$arity$3(coll__8202, k, not_found)
  };
  G__8226 = function(this_sym8197, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__8226__2.call(this, this_sym8197, k);
      case 3:
        return G__8226__3.call(this, this_sym8197, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8226
}();
cljs.core.Vector.prototype.apply = function(this_sym8187, args8188) {
  var this__8203 = this;
  return this_sym8187.call.apply(this_sym8187, [this_sym8187].concat(args8188.slice()))
};
cljs.core.Vector.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__8204 = this;
  var new_array__8205 = this__8204.array.slice();
  new_array__8205.push(o);
  return new cljs.core.Vector(this__8204.meta, new_array__8205, null)
};
cljs.core.Vector.prototype.toString = function() {
  var this__8206 = this;
  var this__8207 = this;
  return cljs.core.pr_str.call(null, this__8207)
};
cljs.core.Vector.prototype.cljs$core$IReduce$_reduce$arity$2 = function(v, f) {
  var this__8208 = this;
  return cljs.core.ci_reduce.call(null, this__8208.array, f)
};
cljs.core.Vector.prototype.cljs$core$IReduce$_reduce$arity$3 = function(v, f, start) {
  var this__8209 = this;
  return cljs.core.ci_reduce.call(null, this__8209.array, f, start)
};
cljs.core.Vector.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8210 = this;
  if(this__8210.array.length > 0) {
    var vector_seq__8211 = function vector_seq(i) {
      return new cljs.core.LazySeq(null, false, function() {
        if(i < this__8210.array.length) {
          return cljs.core.cons.call(null, this__8210.array[i], vector_seq.call(null, i + 1))
        }else {
          return null
        }
      }, null)
    };
    return vector_seq__8211.call(null, 0)
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__8212 = this;
  return this__8212.array.length
};
cljs.core.Vector.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__8213 = this;
  var count__8214 = this__8213.array.length;
  if(count__8214 > 0) {
    return this__8213.array[count__8214 - 1]
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__8215 = this;
  if(this__8215.array.length > 0) {
    var new_array__8216 = this__8215.array.slice();
    new_array__8216.pop();
    return new cljs.core.Vector(this__8215.meta, new_array__8216, null)
  }else {
    throw new Error("Can't pop empty vector");
  }
};
cljs.core.Vector.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(coll, n, val) {
  var this__8217 = this;
  return coll.cljs$core$IAssociative$_assoc$arity$3(coll, n, val)
};
cljs.core.Vector.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8218 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Vector.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8219 = this;
  return new cljs.core.Vector(meta, this__8219.array, this__8219.__hash)
};
cljs.core.Vector.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8220 = this;
  return this__8220.meta
};
cljs.core.Vector.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__8221 = this;
  if(function() {
    var and__3822__auto____8222 = 0 <= n;
    if(and__3822__auto____8222) {
      return n < this__8221.array.length
    }else {
      return and__3822__auto____8222
    }
  }()) {
    return this__8221.array[n]
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__8223 = this;
  if(function() {
    var and__3822__auto____8224 = 0 <= n;
    if(and__3822__auto____8224) {
      return n < this__8223.array.length
    }else {
      return and__3822__auto____8224
    }
  }()) {
    return this__8223.array[n]
  }else {
    return not_found
  }
};
cljs.core.Vector.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8225 = this;
  return cljs.core.with_meta.call(null, cljs.core.Vector.EMPTY, this__8225.meta)
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
cljs.core.VectorNode.cljs$lang$ctorPrSeq = function(this__2338__auto__) {
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
  var cnt__8228 = pv.cnt;
  if(cnt__8228 < 32) {
    return 0
  }else {
    return cnt__8228 - 1 >>> 5 << 5
  }
};
cljs.core.new_path = function new_path(edit, level, node) {
  var ll__8234 = level;
  var ret__8235 = node;
  while(true) {
    if(ll__8234 === 0) {
      return ret__8235
    }else {
      var embed__8236 = ret__8235;
      var r__8237 = cljs.core.pv_fresh_node.call(null, edit);
      var ___8238 = cljs.core.pv_aset.call(null, r__8237, 0, embed__8236);
      var G__8239 = ll__8234 - 5;
      var G__8240 = r__8237;
      ll__8234 = G__8239;
      ret__8235 = G__8240;
      continue
    }
    break
  }
};
cljs.core.push_tail = function push_tail(pv, level, parent, tailnode) {
  var ret__8246 = cljs.core.pv_clone_node.call(null, parent);
  var subidx__8247 = pv.cnt - 1 >>> level & 31;
  if(5 === level) {
    cljs.core.pv_aset.call(null, ret__8246, subidx__8247, tailnode);
    return ret__8246
  }else {
    var child__8248 = cljs.core.pv_aget.call(null, parent, subidx__8247);
    if(!(child__8248 == null)) {
      var node_to_insert__8249 = push_tail.call(null, pv, level - 5, child__8248, tailnode);
      cljs.core.pv_aset.call(null, ret__8246, subidx__8247, node_to_insert__8249);
      return ret__8246
    }else {
      var node_to_insert__8250 = cljs.core.new_path.call(null, null, level - 5, tailnode);
      cljs.core.pv_aset.call(null, ret__8246, subidx__8247, node_to_insert__8250);
      return ret__8246
    }
  }
};
cljs.core.array_for = function array_for(pv, i) {
  if(function() {
    var and__3822__auto____8254 = 0 <= i;
    if(and__3822__auto____8254) {
      return i < pv.cnt
    }else {
      return and__3822__auto____8254
    }
  }()) {
    if(i >= cljs.core.tail_off.call(null, pv)) {
      return pv.tail
    }else {
      var node__8255 = pv.root;
      var level__8256 = pv.shift;
      while(true) {
        if(level__8256 > 0) {
          var G__8257 = cljs.core.pv_aget.call(null, node__8255, i >>> level__8256 & 31);
          var G__8258 = level__8256 - 5;
          node__8255 = G__8257;
          level__8256 = G__8258;
          continue
        }else {
          return node__8255.arr
        }
        break
      }
    }
  }else {
    throw new Error([cljs.core.str("No item "), cljs.core.str(i), cljs.core.str(" in vector of length "), cljs.core.str(pv.cnt)].join(""));
  }
};
cljs.core.do_assoc = function do_assoc(pv, level, node, i, val) {
  var ret__8261 = cljs.core.pv_clone_node.call(null, node);
  if(level === 0) {
    cljs.core.pv_aset.call(null, ret__8261, i & 31, val);
    return ret__8261
  }else {
    var subidx__8262 = i >>> level & 31;
    cljs.core.pv_aset.call(null, ret__8261, subidx__8262, do_assoc.call(null, pv, level - 5, cljs.core.pv_aget.call(null, node, subidx__8262), i, val));
    return ret__8261
  }
};
cljs.core.pop_tail = function pop_tail(pv, level, node) {
  var subidx__8268 = pv.cnt - 2 >>> level & 31;
  if(level > 5) {
    var new_child__8269 = pop_tail.call(null, pv, level - 5, cljs.core.pv_aget.call(null, node, subidx__8268));
    if(function() {
      var and__3822__auto____8270 = new_child__8269 == null;
      if(and__3822__auto____8270) {
        return subidx__8268 === 0
      }else {
        return and__3822__auto____8270
      }
    }()) {
      return null
    }else {
      var ret__8271 = cljs.core.pv_clone_node.call(null, node);
      cljs.core.pv_aset.call(null, ret__8271, subidx__8268, new_child__8269);
      return ret__8271
    }
  }else {
    if(subidx__8268 === 0) {
      return null
    }else {
      if("\ufdd0'else") {
        var ret__8272 = cljs.core.pv_clone_node.call(null, node);
        cljs.core.pv_aset.call(null, ret__8272, subidx__8268, null);
        return ret__8272
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
cljs.core.PersistentVector.cljs$lang$ctorPrSeq = function(this__2337__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentVector")
};
cljs.core.PersistentVector.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var this__8275 = this;
  return new cljs.core.TransientVector(this__8275.cnt, this__8275.shift, cljs.core.tv_editable_root.call(null, this__8275.root), cljs.core.tv_editable_tail.call(null, this__8275.tail))
};
cljs.core.PersistentVector.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__8276 = this;
  var h__2220__auto____8277 = this__8276.__hash;
  if(!(h__2220__auto____8277 == null)) {
    return h__2220__auto____8277
  }else {
    var h__2220__auto____8278 = cljs.core.hash_coll.call(null, coll);
    this__8276.__hash = h__2220__auto____8278;
    return h__2220__auto____8278
  }
};
cljs.core.PersistentVector.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__8279 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, null)
};
cljs.core.PersistentVector.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__8280 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, not_found)
};
cljs.core.PersistentVector.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__8281 = this;
  if(function() {
    var and__3822__auto____8282 = 0 <= k;
    if(and__3822__auto____8282) {
      return k < this__8281.cnt
    }else {
      return and__3822__auto____8282
    }
  }()) {
    if(cljs.core.tail_off.call(null, coll) <= k) {
      var new_tail__8283 = this__8281.tail.slice();
      new_tail__8283[k & 31] = v;
      return new cljs.core.PersistentVector(this__8281.meta, this__8281.cnt, this__8281.shift, this__8281.root, new_tail__8283, null)
    }else {
      return new cljs.core.PersistentVector(this__8281.meta, this__8281.cnt, this__8281.shift, cljs.core.do_assoc.call(null, coll, this__8281.shift, this__8281.root, k, v), this__8281.tail, null)
    }
  }else {
    if(k === this__8281.cnt) {
      return coll.cljs$core$ICollection$_conj$arity$2(coll, v)
    }else {
      if("\ufdd0'else") {
        throw new Error([cljs.core.str("Index "), cljs.core.str(k), cljs.core.str(" out of bounds  [0,"), cljs.core.str(this__8281.cnt), cljs.core.str("]")].join(""));
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentVector.prototype.call = function() {
  var G__8331 = null;
  var G__8331__2 = function(this_sym8284, k) {
    var this__8286 = this;
    var this_sym8284__8287 = this;
    var coll__8288 = this_sym8284__8287;
    return coll__8288.cljs$core$ILookup$_lookup$arity$2(coll__8288, k)
  };
  var G__8331__3 = function(this_sym8285, k, not_found) {
    var this__8286 = this;
    var this_sym8285__8289 = this;
    var coll__8290 = this_sym8285__8289;
    return coll__8290.cljs$core$ILookup$_lookup$arity$3(coll__8290, k, not_found)
  };
  G__8331 = function(this_sym8285, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__8331__2.call(this, this_sym8285, k);
      case 3:
        return G__8331__3.call(this, this_sym8285, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8331
}();
cljs.core.PersistentVector.prototype.apply = function(this_sym8273, args8274) {
  var this__8291 = this;
  return this_sym8273.call.apply(this_sym8273, [this_sym8273].concat(args8274.slice()))
};
cljs.core.PersistentVector.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(v, f, init) {
  var this__8292 = this;
  var step_init__8293 = [0, init];
  var i__8294 = 0;
  while(true) {
    if(i__8294 < this__8292.cnt) {
      var arr__8295 = cljs.core.array_for.call(null, v, i__8294);
      var len__8296 = arr__8295.length;
      var init__8300 = function() {
        var j__8297 = 0;
        var init__8298 = step_init__8293[1];
        while(true) {
          if(j__8297 < len__8296) {
            var init__8299 = f.call(null, init__8298, j__8297 + i__8294, arr__8295[j__8297]);
            if(cljs.core.reduced_QMARK_.call(null, init__8299)) {
              return init__8299
            }else {
              var G__8332 = j__8297 + 1;
              var G__8333 = init__8299;
              j__8297 = G__8332;
              init__8298 = G__8333;
              continue
            }
          }else {
            step_init__8293[0] = len__8296;
            step_init__8293[1] = init__8298;
            return init__8298
          }
          break
        }
      }();
      if(cljs.core.reduced_QMARK_.call(null, init__8300)) {
        return cljs.core.deref.call(null, init__8300)
      }else {
        var G__8334 = i__8294 + step_init__8293[0];
        i__8294 = G__8334;
        continue
      }
    }else {
      return step_init__8293[1]
    }
    break
  }
};
cljs.core.PersistentVector.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__8301 = this;
  if(this__8301.cnt - cljs.core.tail_off.call(null, coll) < 32) {
    var new_tail__8302 = this__8301.tail.slice();
    new_tail__8302.push(o);
    return new cljs.core.PersistentVector(this__8301.meta, this__8301.cnt + 1, this__8301.shift, this__8301.root, new_tail__8302, null)
  }else {
    var root_overflow_QMARK___8303 = this__8301.cnt >>> 5 > 1 << this__8301.shift;
    var new_shift__8304 = root_overflow_QMARK___8303 ? this__8301.shift + 5 : this__8301.shift;
    var new_root__8306 = root_overflow_QMARK___8303 ? function() {
      var n_r__8305 = cljs.core.pv_fresh_node.call(null, null);
      cljs.core.pv_aset.call(null, n_r__8305, 0, this__8301.root);
      cljs.core.pv_aset.call(null, n_r__8305, 1, cljs.core.new_path.call(null, null, this__8301.shift, new cljs.core.VectorNode(null, this__8301.tail)));
      return n_r__8305
    }() : cljs.core.push_tail.call(null, coll, this__8301.shift, this__8301.root, new cljs.core.VectorNode(null, this__8301.tail));
    return new cljs.core.PersistentVector(this__8301.meta, this__8301.cnt + 1, new_shift__8304, new_root__8306, [o], null)
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__8307 = this;
  if(this__8307.cnt > 0) {
    return new cljs.core.RSeq(coll, this__8307.cnt - 1, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IMapEntry$_key$arity$1 = function(coll) {
  var this__8308 = this;
  return coll.cljs$core$IIndexed$_nth$arity$2(coll, 0)
};
cljs.core.PersistentVector.prototype.cljs$core$IMapEntry$_val$arity$1 = function(coll) {
  var this__8309 = this;
  return coll.cljs$core$IIndexed$_nth$arity$2(coll, 1)
};
cljs.core.PersistentVector.prototype.toString = function() {
  var this__8310 = this;
  var this__8311 = this;
  return cljs.core.pr_str.call(null, this__8311)
};
cljs.core.PersistentVector.prototype.cljs$core$IReduce$_reduce$arity$2 = function(v, f) {
  var this__8312 = this;
  return cljs.core.ci_reduce.call(null, v, f)
};
cljs.core.PersistentVector.prototype.cljs$core$IReduce$_reduce$arity$3 = function(v, f, start) {
  var this__8313 = this;
  return cljs.core.ci_reduce.call(null, v, f, start)
};
cljs.core.PersistentVector.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8314 = this;
  if(this__8314.cnt === 0) {
    return null
  }else {
    return cljs.core.chunked_seq.call(null, coll, 0, 0)
  }
};
cljs.core.PersistentVector.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__8315 = this;
  return this__8315.cnt
};
cljs.core.PersistentVector.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__8316 = this;
  if(this__8316.cnt > 0) {
    return coll.cljs$core$IIndexed$_nth$arity$2(coll, this__8316.cnt - 1)
  }else {
    return null
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__8317 = this;
  if(this__8317.cnt === 0) {
    throw new Error("Can't pop empty vector");
  }else {
    if(1 === this__8317.cnt) {
      return cljs.core._with_meta.call(null, cljs.core.PersistentVector.EMPTY, this__8317.meta)
    }else {
      if(1 < this__8317.cnt - cljs.core.tail_off.call(null, coll)) {
        return new cljs.core.PersistentVector(this__8317.meta, this__8317.cnt - 1, this__8317.shift, this__8317.root, this__8317.tail.slice(0, -1), null)
      }else {
        if("\ufdd0'else") {
          var new_tail__8318 = cljs.core.array_for.call(null, coll, this__8317.cnt - 2);
          var nr__8319 = cljs.core.pop_tail.call(null, coll, this__8317.shift, this__8317.root);
          var new_root__8320 = nr__8319 == null ? cljs.core.PersistentVector.EMPTY_NODE : nr__8319;
          var cnt_1__8321 = this__8317.cnt - 1;
          if(function() {
            var and__3822__auto____8322 = 5 < this__8317.shift;
            if(and__3822__auto____8322) {
              return cljs.core.pv_aget.call(null, new_root__8320, 1) == null
            }else {
              return and__3822__auto____8322
            }
          }()) {
            return new cljs.core.PersistentVector(this__8317.meta, cnt_1__8321, this__8317.shift - 5, cljs.core.pv_aget.call(null, new_root__8320, 0), new_tail__8318, null)
          }else {
            return new cljs.core.PersistentVector(this__8317.meta, cnt_1__8321, this__8317.shift, new_root__8320, new_tail__8318, null)
          }
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(coll, n, val) {
  var this__8323 = this;
  return coll.cljs$core$IAssociative$_assoc$arity$3(coll, n, val)
};
cljs.core.PersistentVector.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8324 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentVector.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8325 = this;
  return new cljs.core.PersistentVector(meta, this__8325.cnt, this__8325.shift, this__8325.root, this__8325.tail, this__8325.__hash)
};
cljs.core.PersistentVector.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8326 = this;
  return this__8326.meta
};
cljs.core.PersistentVector.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__8327 = this;
  return cljs.core.array_for.call(null, coll, n)[n & 31]
};
cljs.core.PersistentVector.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__8328 = this;
  if(function() {
    var and__3822__auto____8329 = 0 <= n;
    if(and__3822__auto____8329) {
      return n < this__8328.cnt
    }else {
      return and__3822__auto____8329
    }
  }()) {
    return coll.cljs$core$IIndexed$_nth$arity$2(coll, n)
  }else {
    return not_found
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8330 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.EMPTY, this__8330.meta)
};
cljs.core.PersistentVector;
cljs.core.PersistentVector.EMPTY_NODE = cljs.core.pv_fresh_node.call(null, null);
cljs.core.PersistentVector.EMPTY = new cljs.core.PersistentVector(null, 0, 5, cljs.core.PersistentVector.EMPTY_NODE, [], 0);
cljs.core.PersistentVector.fromArray = function(xs, no_clone) {
  var l__8335 = xs.length;
  var xs__8336 = no_clone === true ? xs : xs.slice();
  if(l__8335 < 32) {
    return new cljs.core.PersistentVector(null, l__8335, 5, cljs.core.PersistentVector.EMPTY_NODE, xs__8336, null)
  }else {
    var node__8337 = xs__8336.slice(0, 32);
    var v__8338 = new cljs.core.PersistentVector(null, 32, 5, cljs.core.PersistentVector.EMPTY_NODE, node__8337, null);
    var i__8339 = 32;
    var out__8340 = cljs.core._as_transient.call(null, v__8338);
    while(true) {
      if(i__8339 < l__8335) {
        var G__8341 = i__8339 + 1;
        var G__8342 = cljs.core.conj_BANG_.call(null, out__8340, xs__8336[i__8339]);
        i__8339 = G__8341;
        out__8340 = G__8342;
        continue
      }else {
        return cljs.core.persistent_BANG_.call(null, out__8340)
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
  vector.cljs$lang$applyTo = function(arglist__8343) {
    var args = cljs.core.seq(arglist__8343);
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
cljs.core.ChunkedSeq.cljs$lang$ctorPrSeq = function(this__2337__auto__) {
  return cljs.core.list.call(null, "cljs.core/ChunkedSeq")
};
cljs.core.ChunkedSeq.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var this__8344 = this;
  if(this__8344.off + 1 < this__8344.node.length) {
    var s__8345 = cljs.core.chunked_seq.call(null, this__8344.vec, this__8344.node, this__8344.i, this__8344.off + 1);
    if(s__8345 == null) {
      return null
    }else {
      return s__8345
    }
  }else {
    return coll.cljs$core$IChunkedNext$_chunked_next$arity$1(coll)
  }
};
cljs.core.ChunkedSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__8346 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.ChunkedSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8347 = this;
  return coll
};
cljs.core.ChunkedSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__8348 = this;
  return this__8348.node[this__8348.off]
};
cljs.core.ChunkedSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__8349 = this;
  if(this__8349.off + 1 < this__8349.node.length) {
    var s__8350 = cljs.core.chunked_seq.call(null, this__8349.vec, this__8349.node, this__8349.i, this__8349.off + 1);
    if(s__8350 == null) {
      return cljs.core.List.EMPTY
    }else {
      return s__8350
    }
  }else {
    return coll.cljs$core$IChunkedSeq$_chunked_rest$arity$1(coll)
  }
};
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedNext$ = true;
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedNext$_chunked_next$arity$1 = function(coll) {
  var this__8351 = this;
  var l__8352 = this__8351.node.length;
  var s__8353 = this__8351.i + l__8352 < cljs.core._count.call(null, this__8351.vec) ? cljs.core.chunked_seq.call(null, this__8351.vec, this__8351.i + l__8352, 0) : null;
  if(s__8353 == null) {
    return null
  }else {
    return s__8353
  }
};
cljs.core.ChunkedSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8354 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, m) {
  var this__8355 = this;
  return cljs.core.chunked_seq.call(null, this__8355.vec, this__8355.node, this__8355.i, this__8355.off, m)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IWithMeta$_meta$arity$1 = function(coll) {
  var this__8356 = this;
  return this__8356.meta
};
cljs.core.ChunkedSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8357 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.EMPTY, this__8357.meta)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedSeq$ = true;
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedSeq$_chunked_first$arity$1 = function(coll) {
  var this__8358 = this;
  return cljs.core.array_chunk.call(null, this__8358.node, this__8358.off)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedSeq$_chunked_rest$arity$1 = function(coll) {
  var this__8359 = this;
  var l__8360 = this__8359.node.length;
  var s__8361 = this__8359.i + l__8360 < cljs.core._count.call(null, this__8359.vec) ? cljs.core.chunked_seq.call(null, this__8359.vec, this__8359.i + l__8360, 0) : null;
  if(s__8361 == null) {
    return cljs.core.List.EMPTY
  }else {
    return s__8361
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
cljs.core.Subvec.cljs$lang$ctorPrSeq = function(this__2337__auto__) {
  return cljs.core.list.call(null, "cljs.core/Subvec")
};
cljs.core.Subvec.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__8364 = this;
  var h__2220__auto____8365 = this__8364.__hash;
  if(!(h__2220__auto____8365 == null)) {
    return h__2220__auto____8365
  }else {
    var h__2220__auto____8366 = cljs.core.hash_coll.call(null, coll);
    this__8364.__hash = h__2220__auto____8366;
    return h__2220__auto____8366
  }
};
cljs.core.Subvec.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__8367 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, null)
};
cljs.core.Subvec.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__8368 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, not_found)
};
cljs.core.Subvec.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, key, val) {
  var this__8369 = this;
  var v_pos__8370 = this__8369.start + key;
  return new cljs.core.Subvec(this__8369.meta, cljs.core._assoc.call(null, this__8369.v, v_pos__8370, val), this__8369.start, this__8369.end > v_pos__8370 + 1 ? this__8369.end : v_pos__8370 + 1, null)
};
cljs.core.Subvec.prototype.call = function() {
  var G__8396 = null;
  var G__8396__2 = function(this_sym8371, k) {
    var this__8373 = this;
    var this_sym8371__8374 = this;
    var coll__8375 = this_sym8371__8374;
    return coll__8375.cljs$core$ILookup$_lookup$arity$2(coll__8375, k)
  };
  var G__8396__3 = function(this_sym8372, k, not_found) {
    var this__8373 = this;
    var this_sym8372__8376 = this;
    var coll__8377 = this_sym8372__8376;
    return coll__8377.cljs$core$ILookup$_lookup$arity$3(coll__8377, k, not_found)
  };
  G__8396 = function(this_sym8372, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__8396__2.call(this, this_sym8372, k);
      case 3:
        return G__8396__3.call(this, this_sym8372, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8396
}();
cljs.core.Subvec.prototype.apply = function(this_sym8362, args8363) {
  var this__8378 = this;
  return this_sym8362.call.apply(this_sym8362, [this_sym8362].concat(args8363.slice()))
};
cljs.core.Subvec.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__8379 = this;
  return new cljs.core.Subvec(this__8379.meta, cljs.core._assoc_n.call(null, this__8379.v, this__8379.end, o), this__8379.start, this__8379.end + 1, null)
};
cljs.core.Subvec.prototype.toString = function() {
  var this__8380 = this;
  var this__8381 = this;
  return cljs.core.pr_str.call(null, this__8381)
};
cljs.core.Subvec.prototype.cljs$core$IReduce$_reduce$arity$2 = function(coll, f) {
  var this__8382 = this;
  return cljs.core.ci_reduce.call(null, coll, f)
};
cljs.core.Subvec.prototype.cljs$core$IReduce$_reduce$arity$3 = function(coll, f, start) {
  var this__8383 = this;
  return cljs.core.ci_reduce.call(null, coll, f, start)
};
cljs.core.Subvec.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8384 = this;
  var subvec_seq__8385 = function subvec_seq(i) {
    if(i === this__8384.end) {
      return null
    }else {
      return cljs.core.cons.call(null, cljs.core._nth.call(null, this__8384.v, i), new cljs.core.LazySeq(null, false, function() {
        return subvec_seq.call(null, i + 1)
      }, null))
    }
  };
  return subvec_seq__8385.call(null, this__8384.start)
};
cljs.core.Subvec.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__8386 = this;
  return this__8386.end - this__8386.start
};
cljs.core.Subvec.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__8387 = this;
  return cljs.core._nth.call(null, this__8387.v, this__8387.end - 1)
};
cljs.core.Subvec.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__8388 = this;
  if(this__8388.start === this__8388.end) {
    throw new Error("Can't pop empty vector");
  }else {
    return new cljs.core.Subvec(this__8388.meta, this__8388.v, this__8388.start, this__8388.end - 1, null)
  }
};
cljs.core.Subvec.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(coll, n, val) {
  var this__8389 = this;
  return coll.cljs$core$IAssociative$_assoc$arity$3(coll, n, val)
};
cljs.core.Subvec.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8390 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Subvec.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8391 = this;
  return new cljs.core.Subvec(meta, this__8391.v, this__8391.start, this__8391.end, this__8391.__hash)
};
cljs.core.Subvec.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8392 = this;
  return this__8392.meta
};
cljs.core.Subvec.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__8393 = this;
  return cljs.core._nth.call(null, this__8393.v, this__8393.start + n)
};
cljs.core.Subvec.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__8394 = this;
  return cljs.core._nth.call(null, this__8394.v, this__8394.start + n, not_found)
};
cljs.core.Subvec.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8395 = this;
  return cljs.core.with_meta.call(null, cljs.core.Vector.EMPTY, this__8395.meta)
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
  var ret__8398 = cljs.core.make_array.call(null, 32);
  cljs.core.array_copy.call(null, tl, 0, ret__8398, 0, tl.length);
  return ret__8398
};
cljs.core.tv_push_tail = function tv_push_tail(tv, level, parent, tail_node) {
  var ret__8402 = cljs.core.tv_ensure_editable.call(null, tv.root.edit, parent);
  var subidx__8403 = tv.cnt - 1 >>> level & 31;
  cljs.core.pv_aset.call(null, ret__8402, subidx__8403, level === 5 ? tail_node : function() {
    var child__8404 = cljs.core.pv_aget.call(null, ret__8402, subidx__8403);
    if(!(child__8404 == null)) {
      return tv_push_tail.call(null, tv, level - 5, child__8404, tail_node)
    }else {
      return cljs.core.new_path.call(null, tv.root.edit, level - 5, tail_node)
    }
  }());
  return ret__8402
};
cljs.core.tv_pop_tail = function tv_pop_tail(tv, level, node) {
  var node__8409 = cljs.core.tv_ensure_editable.call(null, tv.root.edit, node);
  var subidx__8410 = tv.cnt - 2 >>> level & 31;
  if(level > 5) {
    var new_child__8411 = tv_pop_tail.call(null, tv, level - 5, cljs.core.pv_aget.call(null, node__8409, subidx__8410));
    if(function() {
      var and__3822__auto____8412 = new_child__8411 == null;
      if(and__3822__auto____8412) {
        return subidx__8410 === 0
      }else {
        return and__3822__auto____8412
      }
    }()) {
      return null
    }else {
      cljs.core.pv_aset.call(null, node__8409, subidx__8410, new_child__8411);
      return node__8409
    }
  }else {
    if(subidx__8410 === 0) {
      return null
    }else {
      if("\ufdd0'else") {
        cljs.core.pv_aset.call(null, node__8409, subidx__8410, null);
        return node__8409
      }else {
        return null
      }
    }
  }
};
cljs.core.editable_array_for = function editable_array_for(tv, i) {
  if(function() {
    var and__3822__auto____8417 = 0 <= i;
    if(and__3822__auto____8417) {
      return i < tv.cnt
    }else {
      return and__3822__auto____8417
    }
  }()) {
    if(i >= cljs.core.tail_off.call(null, tv)) {
      return tv.tail
    }else {
      var root__8418 = tv.root;
      var node__8419 = root__8418;
      var level__8420 = tv.shift;
      while(true) {
        if(level__8420 > 0) {
          var G__8421 = cljs.core.tv_ensure_editable.call(null, root__8418.edit, cljs.core.pv_aget.call(null, node__8419, i >>> level__8420 & 31));
          var G__8422 = level__8420 - 5;
          node__8419 = G__8421;
          level__8420 = G__8422;
          continue
        }else {
          return node__8419.arr
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
cljs.core.TransientVector.cljs$lang$ctorPrSeq = function(this__2337__auto__) {
  return cljs.core.list.call(null, "cljs.core/TransientVector")
};
cljs.core.TransientVector.prototype.call = function() {
  var G__8462 = null;
  var G__8462__2 = function(this_sym8425, k) {
    var this__8427 = this;
    var this_sym8425__8428 = this;
    var coll__8429 = this_sym8425__8428;
    return coll__8429.cljs$core$ILookup$_lookup$arity$2(coll__8429, k)
  };
  var G__8462__3 = function(this_sym8426, k, not_found) {
    var this__8427 = this;
    var this_sym8426__8430 = this;
    var coll__8431 = this_sym8426__8430;
    return coll__8431.cljs$core$ILookup$_lookup$arity$3(coll__8431, k, not_found)
  };
  G__8462 = function(this_sym8426, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__8462__2.call(this, this_sym8426, k);
      case 3:
        return G__8462__3.call(this, this_sym8426, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8462
}();
cljs.core.TransientVector.prototype.apply = function(this_sym8423, args8424) {
  var this__8432 = this;
  return this_sym8423.call.apply(this_sym8423, [this_sym8423].concat(args8424.slice()))
};
cljs.core.TransientVector.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__8433 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, null)
};
cljs.core.TransientVector.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__8434 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, not_found)
};
cljs.core.TransientVector.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__8435 = this;
  if(this__8435.root.edit) {
    return cljs.core.array_for.call(null, coll, n)[n & 31]
  }else {
    throw new Error("nth after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__8436 = this;
  if(function() {
    var and__3822__auto____8437 = 0 <= n;
    if(and__3822__auto____8437) {
      return n < this__8436.cnt
    }else {
      return and__3822__auto____8437
    }
  }()) {
    return coll.cljs$core$IIndexed$_nth$arity$2(coll, n)
  }else {
    return not_found
  }
};
cljs.core.TransientVector.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__8438 = this;
  if(this__8438.root.edit) {
    return this__8438.cnt
  }else {
    throw new Error("count after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3 = function(tcoll, n, val) {
  var this__8439 = this;
  if(this__8439.root.edit) {
    if(function() {
      var and__3822__auto____8440 = 0 <= n;
      if(and__3822__auto____8440) {
        return n < this__8439.cnt
      }else {
        return and__3822__auto____8440
      }
    }()) {
      if(cljs.core.tail_off.call(null, tcoll) <= n) {
        this__8439.tail[n & 31] = val;
        return tcoll
      }else {
        var new_root__8445 = function go(level, node) {
          var node__8443 = cljs.core.tv_ensure_editable.call(null, this__8439.root.edit, node);
          if(level === 0) {
            cljs.core.pv_aset.call(null, node__8443, n & 31, val);
            return node__8443
          }else {
            var subidx__8444 = n >>> level & 31;
            cljs.core.pv_aset.call(null, node__8443, subidx__8444, go.call(null, level - 5, cljs.core.pv_aget.call(null, node__8443, subidx__8444)));
            return node__8443
          }
        }.call(null, this__8439.shift, this__8439.root);
        this__8439.root = new_root__8445;
        return tcoll
      }
    }else {
      if(n === this__8439.cnt) {
        return tcoll.cljs$core$ITransientCollection$_conj_BANG_$arity$2(tcoll, val)
      }else {
        if("\ufdd0'else") {
          throw new Error([cljs.core.str("Index "), cljs.core.str(n), cljs.core.str(" out of bounds for TransientVector of length"), cljs.core.str(this__8439.cnt)].join(""));
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
  var this__8446 = this;
  if(this__8446.root.edit) {
    if(this__8446.cnt === 0) {
      throw new Error("Can't pop empty vector");
    }else {
      if(1 === this__8446.cnt) {
        this__8446.cnt = 0;
        return tcoll
      }else {
        if((this__8446.cnt - 1 & 31) > 0) {
          this__8446.cnt = this__8446.cnt - 1;
          return tcoll
        }else {
          if("\ufdd0'else") {
            var new_tail__8447 = cljs.core.editable_array_for.call(null, tcoll, this__8446.cnt - 2);
            var new_root__8449 = function() {
              var nr__8448 = cljs.core.tv_pop_tail.call(null, tcoll, this__8446.shift, this__8446.root);
              if(!(nr__8448 == null)) {
                return nr__8448
              }else {
                return new cljs.core.VectorNode(this__8446.root.edit, cljs.core.make_array.call(null, 32))
              }
            }();
            if(function() {
              var and__3822__auto____8450 = 5 < this__8446.shift;
              if(and__3822__auto____8450) {
                return cljs.core.pv_aget.call(null, new_root__8449, 1) == null
              }else {
                return and__3822__auto____8450
              }
            }()) {
              var new_root__8451 = cljs.core.tv_ensure_editable.call(null, this__8446.root.edit, cljs.core.pv_aget.call(null, new_root__8449, 0));
              this__8446.root = new_root__8451;
              this__8446.shift = this__8446.shift - 5;
              this__8446.cnt = this__8446.cnt - 1;
              this__8446.tail = new_tail__8447;
              return tcoll
            }else {
              this__8446.root = new_root__8449;
              this__8446.cnt = this__8446.cnt - 1;
              this__8446.tail = new_tail__8447;
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
  var this__8452 = this;
  return tcoll.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3(tcoll, key, val)
};
cljs.core.TransientVector.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, o) {
  var this__8453 = this;
  if(this__8453.root.edit) {
    if(this__8453.cnt - cljs.core.tail_off.call(null, tcoll) < 32) {
      this__8453.tail[this__8453.cnt & 31] = o;
      this__8453.cnt = this__8453.cnt + 1;
      return tcoll
    }else {
      var tail_node__8454 = new cljs.core.VectorNode(this__8453.root.edit, this__8453.tail);
      var new_tail__8455 = cljs.core.make_array.call(null, 32);
      new_tail__8455[0] = o;
      this__8453.tail = new_tail__8455;
      if(this__8453.cnt >>> 5 > 1 << this__8453.shift) {
        var new_root_array__8456 = cljs.core.make_array.call(null, 32);
        var new_shift__8457 = this__8453.shift + 5;
        new_root_array__8456[0] = this__8453.root;
        new_root_array__8456[1] = cljs.core.new_path.call(null, this__8453.root.edit, this__8453.shift, tail_node__8454);
        this__8453.root = new cljs.core.VectorNode(this__8453.root.edit, new_root_array__8456);
        this__8453.shift = new_shift__8457;
        this__8453.cnt = this__8453.cnt + 1;
        return tcoll
      }else {
        var new_root__8458 = cljs.core.tv_push_tail.call(null, tcoll, this__8453.shift, this__8453.root, tail_node__8454);
        this__8453.root = new_root__8458;
        this__8453.cnt = this__8453.cnt + 1;
        return tcoll
      }
    }
  }else {
    throw new Error("conj! after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__8459 = this;
  if(this__8459.root.edit) {
    this__8459.root.edit = null;
    var len__8460 = this__8459.cnt - cljs.core.tail_off.call(null, tcoll);
    var trimmed_tail__8461 = cljs.core.make_array.call(null, len__8460);
    cljs.core.array_copy.call(null, this__8459.tail, 0, trimmed_tail__8461, 0, len__8460);
    return new cljs.core.PersistentVector(null, this__8459.cnt, this__8459.shift, this__8459.root, trimmed_tail__8461, null)
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
cljs.core.PersistentQueueSeq.cljs$lang$ctorPrSeq = function(this__2337__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentQueueSeq")
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__8463 = this;
  var h__2220__auto____8464 = this__8463.__hash;
  if(!(h__2220__auto____8464 == null)) {
    return h__2220__auto____8464
  }else {
    var h__2220__auto____8465 = cljs.core.hash_coll.call(null, coll);
    this__8463.__hash = h__2220__auto____8465;
    return h__2220__auto____8465
  }
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__8466 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.PersistentQueueSeq.prototype.toString = function() {
  var this__8467 = this;
  var this__8468 = this;
  return cljs.core.pr_str.call(null, this__8468)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8469 = this;
  return coll
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__8470 = this;
  return cljs.core._first.call(null, this__8470.front)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__8471 = this;
  var temp__3971__auto____8472 = cljs.core.next.call(null, this__8471.front);
  if(temp__3971__auto____8472) {
    var f1__8473 = temp__3971__auto____8472;
    return new cljs.core.PersistentQueueSeq(this__8471.meta, f1__8473, this__8471.rear, null)
  }else {
    if(this__8471.rear == null) {
      return coll.cljs$core$IEmptyableCollection$_empty$arity$1(coll)
    }else {
      return new cljs.core.PersistentQueueSeq(this__8471.meta, this__8471.rear, null, null)
    }
  }
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8474 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8475 = this;
  return new cljs.core.PersistentQueueSeq(meta, this__8475.front, this__8475.rear, this__8475.__hash)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8476 = this;
  return this__8476.meta
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8477 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__8477.meta)
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
cljs.core.PersistentQueue.cljs$lang$ctorPrSeq = function(this__2337__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentQueue")
};
cljs.core.PersistentQueue.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__8478 = this;
  var h__2220__auto____8479 = this__8478.__hash;
  if(!(h__2220__auto____8479 == null)) {
    return h__2220__auto____8479
  }else {
    var h__2220__auto____8480 = cljs.core.hash_coll.call(null, coll);
    this__8478.__hash = h__2220__auto____8480;
    return h__2220__auto____8480
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__8481 = this;
  if(cljs.core.truth_(this__8481.front)) {
    return new cljs.core.PersistentQueue(this__8481.meta, this__8481.count + 1, this__8481.front, cljs.core.conj.call(null, function() {
      var or__3824__auto____8482 = this__8481.rear;
      if(cljs.core.truth_(or__3824__auto____8482)) {
        return or__3824__auto____8482
      }else {
        return cljs.core.PersistentVector.EMPTY
      }
    }(), o), null)
  }else {
    return new cljs.core.PersistentQueue(this__8481.meta, this__8481.count + 1, cljs.core.conj.call(null, this__8481.front, o), cljs.core.PersistentVector.EMPTY, null)
  }
};
cljs.core.PersistentQueue.prototype.toString = function() {
  var this__8483 = this;
  var this__8484 = this;
  return cljs.core.pr_str.call(null, this__8484)
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8485 = this;
  var rear__8486 = cljs.core.seq.call(null, this__8485.rear);
  if(cljs.core.truth_(function() {
    var or__3824__auto____8487 = this__8485.front;
    if(cljs.core.truth_(or__3824__auto____8487)) {
      return or__3824__auto____8487
    }else {
      return rear__8486
    }
  }())) {
    return new cljs.core.PersistentQueueSeq(null, this__8485.front, cljs.core.seq.call(null, rear__8486), null)
  }else {
    return null
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__8488 = this;
  return this__8488.count
};
cljs.core.PersistentQueue.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__8489 = this;
  return cljs.core._first.call(null, this__8489.front)
};
cljs.core.PersistentQueue.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__8490 = this;
  if(cljs.core.truth_(this__8490.front)) {
    var temp__3971__auto____8491 = cljs.core.next.call(null, this__8490.front);
    if(temp__3971__auto____8491) {
      var f1__8492 = temp__3971__auto____8491;
      return new cljs.core.PersistentQueue(this__8490.meta, this__8490.count - 1, f1__8492, this__8490.rear, null)
    }else {
      return new cljs.core.PersistentQueue(this__8490.meta, this__8490.count - 1, cljs.core.seq.call(null, this__8490.rear), cljs.core.PersistentVector.EMPTY, null)
    }
  }else {
    return coll
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__8493 = this;
  return cljs.core.first.call(null, this__8493.front)
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__8494 = this;
  return cljs.core.rest.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.PersistentQueue.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8495 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentQueue.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8496 = this;
  return new cljs.core.PersistentQueue(meta, this__8496.count, this__8496.front, this__8496.rear, this__8496.__hash)
};
cljs.core.PersistentQueue.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8497 = this;
  return this__8497.meta
};
cljs.core.PersistentQueue.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8498 = this;
  return cljs.core.PersistentQueue.EMPTY
};
cljs.core.PersistentQueue;
cljs.core.PersistentQueue.EMPTY = new cljs.core.PersistentQueue(null, 0, null, cljs.core.PersistentVector.EMPTY, 0);
cljs.core.NeverEquiv = function() {
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 2097152
};
cljs.core.NeverEquiv.cljs$lang$type = true;
cljs.core.NeverEquiv.cljs$lang$ctorPrSeq = function(this__2337__auto__) {
  return cljs.core.list.call(null, "cljs.core/NeverEquiv")
};
cljs.core.NeverEquiv.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(o, other) {
  var this__8499 = this;
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
  var len__8502 = array.length;
  var i__8503 = 0;
  while(true) {
    if(i__8503 < len__8502) {
      if(k === array[i__8503]) {
        return i__8503
      }else {
        var G__8504 = i__8503 + incr;
        i__8503 = G__8504;
        continue
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.obj_map_compare_keys = function obj_map_compare_keys(a, b) {
  var a__8507 = cljs.core.hash.call(null, a);
  var b__8508 = cljs.core.hash.call(null, b);
  if(a__8507 < b__8508) {
    return-1
  }else {
    if(a__8507 > b__8508) {
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
  var ks__8516 = m.keys;
  var len__8517 = ks__8516.length;
  var so__8518 = m.strobj;
  var out__8519 = cljs.core.with_meta.call(null, cljs.core.PersistentHashMap.EMPTY, cljs.core.meta.call(null, m));
  var i__8520 = 0;
  var out__8521 = cljs.core.transient$.call(null, out__8519);
  while(true) {
    if(i__8520 < len__8517) {
      var k__8522 = ks__8516[i__8520];
      var G__8523 = i__8520 + 1;
      var G__8524 = cljs.core.assoc_BANG_.call(null, out__8521, k__8522, so__8518[k__8522]);
      i__8520 = G__8523;
      out__8521 = G__8524;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, cljs.core.assoc_BANG_.call(null, out__8521, k, v))
    }
    break
  }
};
cljs.core.obj_clone = function obj_clone(obj, ks) {
  var new_obj__8530 = {};
  var l__8531 = ks.length;
  var i__8532 = 0;
  while(true) {
    if(i__8532 < l__8531) {
      var k__8533 = ks[i__8532];
      new_obj__8530[k__8533] = obj[k__8533];
      var G__8534 = i__8532 + 1;
      i__8532 = G__8534;
      continue
    }else {
    }
    break
  }
  return new_obj__8530
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
cljs.core.ObjMap.cljs$lang$ctorPrSeq = function(this__2337__auto__) {
  return cljs.core.list.call(null, "cljs.core/ObjMap")
};
cljs.core.ObjMap.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var this__8537 = this;
  return cljs.core.transient$.call(null, cljs.core.into.call(null, cljs.core.hash_map.call(null), coll))
};
cljs.core.ObjMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__8538 = this;
  var h__2220__auto____8539 = this__8538.__hash;
  if(!(h__2220__auto____8539 == null)) {
    return h__2220__auto____8539
  }else {
    var h__2220__auto____8540 = cljs.core.hash_imap.call(null, coll);
    this__8538.__hash = h__2220__auto____8540;
    return h__2220__auto____8540
  }
};
cljs.core.ObjMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__8541 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.ObjMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__8542 = this;
  if(function() {
    var and__3822__auto____8543 = goog.isString(k);
    if(and__3822__auto____8543) {
      return!(cljs.core.scan_array.call(null, 1, k, this__8542.keys) == null)
    }else {
      return and__3822__auto____8543
    }
  }()) {
    return this__8542.strobj[k]
  }else {
    return not_found
  }
};
cljs.core.ObjMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__8544 = this;
  if(goog.isString(k)) {
    if(function() {
      var or__3824__auto____8545 = this__8544.update_count > cljs.core.ObjMap.HASHMAP_THRESHOLD;
      if(or__3824__auto____8545) {
        return or__3824__auto____8545
      }else {
        return this__8544.keys.length >= cljs.core.ObjMap.HASHMAP_THRESHOLD
      }
    }()) {
      return cljs.core.obj_map__GT_hash_map.call(null, coll, k, v)
    }else {
      if(!(cljs.core.scan_array.call(null, 1, k, this__8544.keys) == null)) {
        var new_strobj__8546 = cljs.core.obj_clone.call(null, this__8544.strobj, this__8544.keys);
        new_strobj__8546[k] = v;
        return new cljs.core.ObjMap(this__8544.meta, this__8544.keys, new_strobj__8546, this__8544.update_count + 1, null)
      }else {
        var new_strobj__8547 = cljs.core.obj_clone.call(null, this__8544.strobj, this__8544.keys);
        var new_keys__8548 = this__8544.keys.slice();
        new_strobj__8547[k] = v;
        new_keys__8548.push(k);
        return new cljs.core.ObjMap(this__8544.meta, new_keys__8548, new_strobj__8547, this__8544.update_count + 1, null)
      }
    }
  }else {
    return cljs.core.obj_map__GT_hash_map.call(null, coll, k, v)
  }
};
cljs.core.ObjMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__8549 = this;
  if(function() {
    var and__3822__auto____8550 = goog.isString(k);
    if(and__3822__auto____8550) {
      return!(cljs.core.scan_array.call(null, 1, k, this__8549.keys) == null)
    }else {
      return and__3822__auto____8550
    }
  }()) {
    return true
  }else {
    return false
  }
};
cljs.core.ObjMap.prototype.call = function() {
  var G__8572 = null;
  var G__8572__2 = function(this_sym8551, k) {
    var this__8553 = this;
    var this_sym8551__8554 = this;
    var coll__8555 = this_sym8551__8554;
    return coll__8555.cljs$core$ILookup$_lookup$arity$2(coll__8555, k)
  };
  var G__8572__3 = function(this_sym8552, k, not_found) {
    var this__8553 = this;
    var this_sym8552__8556 = this;
    var coll__8557 = this_sym8552__8556;
    return coll__8557.cljs$core$ILookup$_lookup$arity$3(coll__8557, k, not_found)
  };
  G__8572 = function(this_sym8552, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__8572__2.call(this, this_sym8552, k);
      case 3:
        return G__8572__3.call(this, this_sym8552, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8572
}();
cljs.core.ObjMap.prototype.apply = function(this_sym8535, args8536) {
  var this__8558 = this;
  return this_sym8535.call.apply(this_sym8535, [this_sym8535].concat(args8536.slice()))
};
cljs.core.ObjMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__8559 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.ObjMap.prototype.toString = function() {
  var this__8560 = this;
  var this__8561 = this;
  return cljs.core.pr_str.call(null, this__8561)
};
cljs.core.ObjMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8562 = this;
  if(this__8562.keys.length > 0) {
    return cljs.core.map.call(null, function(p1__8525_SHARP_) {
      return cljs.core.vector.call(null, p1__8525_SHARP_, this__8562.strobj[p1__8525_SHARP_])
    }, this__8562.keys.sort(cljs.core.obj_map_compare_keys))
  }else {
    return null
  }
};
cljs.core.ObjMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__8563 = this;
  return this__8563.keys.length
};
cljs.core.ObjMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8564 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.ObjMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8565 = this;
  return new cljs.core.ObjMap(meta, this__8565.keys, this__8565.strobj, this__8565.update_count, this__8565.__hash)
};
cljs.core.ObjMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8566 = this;
  return this__8566.meta
};
cljs.core.ObjMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8567 = this;
  return cljs.core.with_meta.call(null, cljs.core.ObjMap.EMPTY, this__8567.meta)
};
cljs.core.ObjMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__8568 = this;
  if(function() {
    var and__3822__auto____8569 = goog.isString(k);
    if(and__3822__auto____8569) {
      return!(cljs.core.scan_array.call(null, 1, k, this__8568.keys) == null)
    }else {
      return and__3822__auto____8569
    }
  }()) {
    var new_keys__8570 = this__8568.keys.slice();
    var new_strobj__8571 = cljs.core.obj_clone.call(null, this__8568.strobj, this__8568.keys);
    new_keys__8570.splice(cljs.core.scan_array.call(null, 1, k, new_keys__8570), 1);
    cljs.core.js_delete.call(null, new_strobj__8571, k);
    return new cljs.core.ObjMap(this__8568.meta, new_keys__8570, new_strobj__8571, this__8568.update_count + 1, null)
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
cljs.core.HashMap.cljs$lang$ctorPrSeq = function(this__2337__auto__) {
  return cljs.core.list.call(null, "cljs.core/HashMap")
};
cljs.core.HashMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__8576 = this;
  var h__2220__auto____8577 = this__8576.__hash;
  if(!(h__2220__auto____8577 == null)) {
    return h__2220__auto____8577
  }else {
    var h__2220__auto____8578 = cljs.core.hash_imap.call(null, coll);
    this__8576.__hash = h__2220__auto____8578;
    return h__2220__auto____8578
  }
};
cljs.core.HashMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__8579 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.HashMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__8580 = this;
  var bucket__8581 = this__8580.hashobj[cljs.core.hash.call(null, k)];
  var i__8582 = cljs.core.truth_(bucket__8581) ? cljs.core.scan_array.call(null, 2, k, bucket__8581) : null;
  if(cljs.core.truth_(i__8582)) {
    return bucket__8581[i__8582 + 1]
  }else {
    return not_found
  }
};
cljs.core.HashMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__8583 = this;
  var h__8584 = cljs.core.hash.call(null, k);
  var bucket__8585 = this__8583.hashobj[h__8584];
  if(cljs.core.truth_(bucket__8585)) {
    var new_bucket__8586 = bucket__8585.slice();
    var new_hashobj__8587 = goog.object.clone(this__8583.hashobj);
    new_hashobj__8587[h__8584] = new_bucket__8586;
    var temp__3971__auto____8588 = cljs.core.scan_array.call(null, 2, k, new_bucket__8586);
    if(cljs.core.truth_(temp__3971__auto____8588)) {
      var i__8589 = temp__3971__auto____8588;
      new_bucket__8586[i__8589 + 1] = v;
      return new cljs.core.HashMap(this__8583.meta, this__8583.count, new_hashobj__8587, null)
    }else {
      new_bucket__8586.push(k, v);
      return new cljs.core.HashMap(this__8583.meta, this__8583.count + 1, new_hashobj__8587, null)
    }
  }else {
    var new_hashobj__8590 = goog.object.clone(this__8583.hashobj);
    new_hashobj__8590[h__8584] = [k, v];
    return new cljs.core.HashMap(this__8583.meta, this__8583.count + 1, new_hashobj__8590, null)
  }
};
cljs.core.HashMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__8591 = this;
  var bucket__8592 = this__8591.hashobj[cljs.core.hash.call(null, k)];
  var i__8593 = cljs.core.truth_(bucket__8592) ? cljs.core.scan_array.call(null, 2, k, bucket__8592) : null;
  if(cljs.core.truth_(i__8593)) {
    return true
  }else {
    return false
  }
};
cljs.core.HashMap.prototype.call = function() {
  var G__8618 = null;
  var G__8618__2 = function(this_sym8594, k) {
    var this__8596 = this;
    var this_sym8594__8597 = this;
    var coll__8598 = this_sym8594__8597;
    return coll__8598.cljs$core$ILookup$_lookup$arity$2(coll__8598, k)
  };
  var G__8618__3 = function(this_sym8595, k, not_found) {
    var this__8596 = this;
    var this_sym8595__8599 = this;
    var coll__8600 = this_sym8595__8599;
    return coll__8600.cljs$core$ILookup$_lookup$arity$3(coll__8600, k, not_found)
  };
  G__8618 = function(this_sym8595, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__8618__2.call(this, this_sym8595, k);
      case 3:
        return G__8618__3.call(this, this_sym8595, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8618
}();
cljs.core.HashMap.prototype.apply = function(this_sym8574, args8575) {
  var this__8601 = this;
  return this_sym8574.call.apply(this_sym8574, [this_sym8574].concat(args8575.slice()))
};
cljs.core.HashMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__8602 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.HashMap.prototype.toString = function() {
  var this__8603 = this;
  var this__8604 = this;
  return cljs.core.pr_str.call(null, this__8604)
};
cljs.core.HashMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8605 = this;
  if(this__8605.count > 0) {
    var hashes__8606 = cljs.core.js_keys.call(null, this__8605.hashobj).sort();
    return cljs.core.mapcat.call(null, function(p1__8573_SHARP_) {
      return cljs.core.map.call(null, cljs.core.vec, cljs.core.partition.call(null, 2, this__8605.hashobj[p1__8573_SHARP_]))
    }, hashes__8606)
  }else {
    return null
  }
};
cljs.core.HashMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__8607 = this;
  return this__8607.count
};
cljs.core.HashMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8608 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.HashMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8609 = this;
  return new cljs.core.HashMap(meta, this__8609.count, this__8609.hashobj, this__8609.__hash)
};
cljs.core.HashMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8610 = this;
  return this__8610.meta
};
cljs.core.HashMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8611 = this;
  return cljs.core.with_meta.call(null, cljs.core.HashMap.EMPTY, this__8611.meta)
};
cljs.core.HashMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__8612 = this;
  var h__8613 = cljs.core.hash.call(null, k);
  var bucket__8614 = this__8612.hashobj[h__8613];
  var i__8615 = cljs.core.truth_(bucket__8614) ? cljs.core.scan_array.call(null, 2, k, bucket__8614) : null;
  if(cljs.core.not.call(null, i__8615)) {
    return coll
  }else {
    var new_hashobj__8616 = goog.object.clone(this__8612.hashobj);
    if(3 > bucket__8614.length) {
      cljs.core.js_delete.call(null, new_hashobj__8616, h__8613)
    }else {
      var new_bucket__8617 = bucket__8614.slice();
      new_bucket__8617.splice(i__8615, 2);
      new_hashobj__8616[h__8613] = new_bucket__8617
    }
    return new cljs.core.HashMap(this__8612.meta, this__8612.count - 1, new_hashobj__8616, null)
  }
};
cljs.core.HashMap;
cljs.core.HashMap.EMPTY = new cljs.core.HashMap(null, 0, {}, 0);
cljs.core.HashMap.fromArrays = function(ks, vs) {
  var len__8619 = ks.length;
  var i__8620 = 0;
  var out__8621 = cljs.core.HashMap.EMPTY;
  while(true) {
    if(i__8620 < len__8619) {
      var G__8622 = i__8620 + 1;
      var G__8623 = cljs.core.assoc.call(null, out__8621, ks[i__8620], vs[i__8620]);
      i__8620 = G__8622;
      out__8621 = G__8623;
      continue
    }else {
      return out__8621
    }
    break
  }
};
cljs.core.array_map_index_of = function array_map_index_of(m, k) {
  var arr__8627 = m.arr;
  var len__8628 = arr__8627.length;
  var i__8629 = 0;
  while(true) {
    if(len__8628 <= i__8629) {
      return-1
    }else {
      if(cljs.core._EQ_.call(null, arr__8627[i__8629], k)) {
        return i__8629
      }else {
        if("\ufdd0'else") {
          var G__8630 = i__8629 + 2;
          i__8629 = G__8630;
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
cljs.core.PersistentArrayMap.cljs$lang$ctorPrSeq = function(this__2337__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentArrayMap")
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var this__8633 = this;
  return new cljs.core.TransientArrayMap({}, this__8633.arr.length, this__8633.arr.slice())
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__8634 = this;
  var h__2220__auto____8635 = this__8634.__hash;
  if(!(h__2220__auto____8635 == null)) {
    return h__2220__auto____8635
  }else {
    var h__2220__auto____8636 = cljs.core.hash_imap.call(null, coll);
    this__8634.__hash = h__2220__auto____8636;
    return h__2220__auto____8636
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__8637 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__8638 = this;
  var idx__8639 = cljs.core.array_map_index_of.call(null, coll, k);
  if(idx__8639 === -1) {
    return not_found
  }else {
    return this__8638.arr[idx__8639 + 1]
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__8640 = this;
  var idx__8641 = cljs.core.array_map_index_of.call(null, coll, k);
  if(idx__8641 === -1) {
    if(this__8640.cnt < cljs.core.PersistentArrayMap.HASHMAP_THRESHOLD) {
      return new cljs.core.PersistentArrayMap(this__8640.meta, this__8640.cnt + 1, function() {
        var G__8642__8643 = this__8640.arr.slice();
        G__8642__8643.push(k);
        G__8642__8643.push(v);
        return G__8642__8643
      }(), null)
    }else {
      return cljs.core.persistent_BANG_.call(null, cljs.core.assoc_BANG_.call(null, cljs.core.transient$.call(null, cljs.core.into.call(null, cljs.core.PersistentHashMap.EMPTY, coll)), k, v))
    }
  }else {
    if(v === this__8640.arr[idx__8641 + 1]) {
      return coll
    }else {
      if("\ufdd0'else") {
        return new cljs.core.PersistentArrayMap(this__8640.meta, this__8640.cnt, function() {
          var G__8644__8645 = this__8640.arr.slice();
          G__8644__8645[idx__8641 + 1] = v;
          return G__8644__8645
        }(), null)
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__8646 = this;
  return!(cljs.core.array_map_index_of.call(null, coll, k) === -1)
};
cljs.core.PersistentArrayMap.prototype.call = function() {
  var G__8678 = null;
  var G__8678__2 = function(this_sym8647, k) {
    var this__8649 = this;
    var this_sym8647__8650 = this;
    var coll__8651 = this_sym8647__8650;
    return coll__8651.cljs$core$ILookup$_lookup$arity$2(coll__8651, k)
  };
  var G__8678__3 = function(this_sym8648, k, not_found) {
    var this__8649 = this;
    var this_sym8648__8652 = this;
    var coll__8653 = this_sym8648__8652;
    return coll__8653.cljs$core$ILookup$_lookup$arity$3(coll__8653, k, not_found)
  };
  G__8678 = function(this_sym8648, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__8678__2.call(this, this_sym8648, k);
      case 3:
        return G__8678__3.call(this, this_sym8648, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8678
}();
cljs.core.PersistentArrayMap.prototype.apply = function(this_sym8631, args8632) {
  var this__8654 = this;
  return this_sym8631.call.apply(this_sym8631, [this_sym8631].concat(args8632.slice()))
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(coll, f, init) {
  var this__8655 = this;
  var len__8656 = this__8655.arr.length;
  var i__8657 = 0;
  var init__8658 = init;
  while(true) {
    if(i__8657 < len__8656) {
      var init__8659 = f.call(null, init__8658, this__8655.arr[i__8657], this__8655.arr[i__8657 + 1]);
      if(cljs.core.reduced_QMARK_.call(null, init__8659)) {
        return cljs.core.deref.call(null, init__8659)
      }else {
        var G__8679 = i__8657 + 2;
        var G__8680 = init__8659;
        i__8657 = G__8679;
        init__8658 = G__8680;
        continue
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__8660 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.PersistentArrayMap.prototype.toString = function() {
  var this__8661 = this;
  var this__8662 = this;
  return cljs.core.pr_str.call(null, this__8662)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8663 = this;
  if(this__8663.cnt > 0) {
    var len__8664 = this__8663.arr.length;
    var array_map_seq__8665 = function array_map_seq(i) {
      return new cljs.core.LazySeq(null, false, function() {
        if(i < len__8664) {
          return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([this__8663.arr[i], this__8663.arr[i + 1]], true), array_map_seq.call(null, i + 2))
        }else {
          return null
        }
      }, null)
    };
    return array_map_seq__8665.call(null, 0)
  }else {
    return null
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__8666 = this;
  return this__8666.cnt
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8667 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8668 = this;
  return new cljs.core.PersistentArrayMap(meta, this__8668.cnt, this__8668.arr, this__8668.__hash)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8669 = this;
  return this__8669.meta
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8670 = this;
  return cljs.core._with_meta.call(null, cljs.core.PersistentArrayMap.EMPTY, this__8670.meta)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__8671 = this;
  var idx__8672 = cljs.core.array_map_index_of.call(null, coll, k);
  if(idx__8672 >= 0) {
    var len__8673 = this__8671.arr.length;
    var new_len__8674 = len__8673 - 2;
    if(new_len__8674 === 0) {
      return coll.cljs$core$IEmptyableCollection$_empty$arity$1(coll)
    }else {
      var new_arr__8675 = cljs.core.make_array.call(null, new_len__8674);
      var s__8676 = 0;
      var d__8677 = 0;
      while(true) {
        if(s__8676 >= len__8673) {
          return new cljs.core.PersistentArrayMap(this__8671.meta, this__8671.cnt - 1, new_arr__8675, null)
        }else {
          if(cljs.core._EQ_.call(null, k, this__8671.arr[s__8676])) {
            var G__8681 = s__8676 + 2;
            var G__8682 = d__8677;
            s__8676 = G__8681;
            d__8677 = G__8682;
            continue
          }else {
            if("\ufdd0'else") {
              new_arr__8675[d__8677] = this__8671.arr[s__8676];
              new_arr__8675[d__8677 + 1] = this__8671.arr[s__8676 + 1];
              var G__8683 = s__8676 + 2;
              var G__8684 = d__8677 + 2;
              s__8676 = G__8683;
              d__8677 = G__8684;
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
  var len__8685 = cljs.core.count.call(null, ks);
  var i__8686 = 0;
  var out__8687 = cljs.core.transient$.call(null, cljs.core.PersistentArrayMap.EMPTY);
  while(true) {
    if(i__8686 < len__8685) {
      var G__8688 = i__8686 + 1;
      var G__8689 = cljs.core.assoc_BANG_.call(null, out__8687, ks[i__8686], vs[i__8686]);
      i__8686 = G__8688;
      out__8687 = G__8689;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, out__8687)
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
cljs.core.TransientArrayMap.cljs$lang$ctorPrSeq = function(this__2337__auto__) {
  return cljs.core.list.call(null, "cljs.core/TransientArrayMap")
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientMap$_dissoc_BANG_$arity$2 = function(tcoll, key) {
  var this__8690 = this;
  if(cljs.core.truth_(this__8690.editable_QMARK_)) {
    var idx__8691 = cljs.core.array_map_index_of.call(null, tcoll, key);
    if(idx__8691 >= 0) {
      this__8690.arr[idx__8691] = this__8690.arr[this__8690.len - 2];
      this__8690.arr[idx__8691 + 1] = this__8690.arr[this__8690.len - 1];
      var G__8692__8693 = this__8690.arr;
      G__8692__8693.pop();
      G__8692__8693.pop();
      G__8692__8693;
      this__8690.len = this__8690.len - 2
    }else {
    }
    return tcoll
  }else {
    throw new Error("dissoc! after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3 = function(tcoll, key, val) {
  var this__8694 = this;
  if(cljs.core.truth_(this__8694.editable_QMARK_)) {
    var idx__8695 = cljs.core.array_map_index_of.call(null, tcoll, key);
    if(idx__8695 === -1) {
      if(this__8694.len + 2 <= 2 * cljs.core.PersistentArrayMap.HASHMAP_THRESHOLD) {
        this__8694.len = this__8694.len + 2;
        this__8694.arr.push(key);
        this__8694.arr.push(val);
        return tcoll
      }else {
        return cljs.core.assoc_BANG_.call(null, cljs.core.array__GT_transient_hash_map.call(null, this__8694.len, this__8694.arr), key, val)
      }
    }else {
      if(val === this__8694.arr[idx__8695 + 1]) {
        return tcoll
      }else {
        this__8694.arr[idx__8695 + 1] = val;
        return tcoll
      }
    }
  }else {
    throw new Error("assoc! after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, o) {
  var this__8696 = this;
  if(cljs.core.truth_(this__8696.editable_QMARK_)) {
    if(function() {
      var G__8697__8698 = o;
      if(G__8697__8698) {
        if(function() {
          var or__3824__auto____8699 = G__8697__8698.cljs$lang$protocol_mask$partition0$ & 2048;
          if(or__3824__auto____8699) {
            return or__3824__auto____8699
          }else {
            return G__8697__8698.cljs$core$IMapEntry$
          }
        }()) {
          return true
        }else {
          if(!G__8697__8698.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__8697__8698)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__8697__8698)
      }
    }()) {
      return tcoll.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3(tcoll, cljs.core.key.call(null, o), cljs.core.val.call(null, o))
    }else {
      var es__8700 = cljs.core.seq.call(null, o);
      var tcoll__8701 = tcoll;
      while(true) {
        var temp__3971__auto____8702 = cljs.core.first.call(null, es__8700);
        if(cljs.core.truth_(temp__3971__auto____8702)) {
          var e__8703 = temp__3971__auto____8702;
          var G__8709 = cljs.core.next.call(null, es__8700);
          var G__8710 = tcoll__8701.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3(tcoll__8701, cljs.core.key.call(null, e__8703), cljs.core.val.call(null, e__8703));
          es__8700 = G__8709;
          tcoll__8701 = G__8710;
          continue
        }else {
          return tcoll__8701
        }
        break
      }
    }
  }else {
    throw new Error("conj! after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__8704 = this;
  if(cljs.core.truth_(this__8704.editable_QMARK_)) {
    this__8704.editable_QMARK_ = false;
    return new cljs.core.PersistentArrayMap(null, cljs.core.quot.call(null, this__8704.len, 2), this__8704.arr, null)
  }else {
    throw new Error("persistent! called twice");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(tcoll, k) {
  var this__8705 = this;
  return tcoll.cljs$core$ILookup$_lookup$arity$3(tcoll, k, null)
};
cljs.core.TransientArrayMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(tcoll, k, not_found) {
  var this__8706 = this;
  if(cljs.core.truth_(this__8706.editable_QMARK_)) {
    var idx__8707 = cljs.core.array_map_index_of.call(null, tcoll, k);
    if(idx__8707 === -1) {
      return not_found
    }else {
      return this__8706.arr[idx__8707 + 1]
    }
  }else {
    throw new Error("lookup after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ICounted$_count$arity$1 = function(tcoll) {
  var this__8708 = this;
  if(cljs.core.truth_(this__8708.editable_QMARK_)) {
    return cljs.core.quot.call(null, this__8708.len, 2)
  }else {
    throw new Error("count after persistent!");
  }
};
cljs.core.TransientArrayMap;
cljs.core.array__GT_transient_hash_map = function array__GT_transient_hash_map(len, arr) {
  var out__8713 = cljs.core.transient$.call(null, cljs.core.ObjMap.EMPTY);
  var i__8714 = 0;
  while(true) {
    if(i__8714 < len) {
      var G__8715 = cljs.core.assoc_BANG_.call(null, out__8713, arr[i__8714], arr[i__8714 + 1]);
      var G__8716 = i__8714 + 2;
      out__8713 = G__8715;
      i__8714 = G__8716;
      continue
    }else {
      return out__8713
    }
    break
  }
};
cljs.core.Box = function(val) {
  this.val = val
};
cljs.core.Box.cljs$lang$type = true;
cljs.core.Box.cljs$lang$ctorPrSeq = function(this__2338__auto__) {
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
    var G__8721__8722 = arr.slice();
    G__8721__8722[i] = a;
    return G__8721__8722
  };
  var clone_and_set__5 = function(arr, i, a, j, b) {
    var G__8723__8724 = arr.slice();
    G__8723__8724[i] = a;
    G__8723__8724[j] = b;
    return G__8723__8724
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
  var new_arr__8726 = cljs.core.make_array.call(null, arr.length - 2);
  cljs.core.array_copy.call(null, arr, 0, new_arr__8726, 0, 2 * i);
  cljs.core.array_copy.call(null, arr, 2 * (i + 1), new_arr__8726, 2 * i, new_arr__8726.length - 2 * i);
  return new_arr__8726
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
    var editable__8729 = inode.ensure_editable(edit);
    editable__8729.arr[i] = a;
    return editable__8729
  };
  var edit_and_set__6 = function(inode, edit, i, a, j, b) {
    var editable__8730 = inode.ensure_editable(edit);
    editable__8730.arr[i] = a;
    editable__8730.arr[j] = b;
    return editable__8730
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
  var len__8737 = arr.length;
  var i__8738 = 0;
  var init__8739 = init;
  while(true) {
    if(i__8738 < len__8737) {
      var init__8742 = function() {
        var k__8740 = arr[i__8738];
        if(!(k__8740 == null)) {
          return f.call(null, init__8739, k__8740, arr[i__8738 + 1])
        }else {
          var node__8741 = arr[i__8738 + 1];
          if(!(node__8741 == null)) {
            return node__8741.kv_reduce(f, init__8739)
          }else {
            return init__8739
          }
        }
      }();
      if(cljs.core.reduced_QMARK_.call(null, init__8742)) {
        return cljs.core.deref.call(null, init__8742)
      }else {
        var G__8743 = i__8738 + 2;
        var G__8744 = init__8742;
        i__8738 = G__8743;
        init__8739 = G__8744;
        continue
      }
    }else {
      return init__8739
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
cljs.core.BitmapIndexedNode.cljs$lang$ctorPrSeq = function(this__2337__auto__) {
  return cljs.core.list.call(null, "cljs.core/BitmapIndexedNode")
};
cljs.core.BitmapIndexedNode.prototype.edit_and_remove_pair = function(e, bit, i) {
  var this__8745 = this;
  var inode__8746 = this;
  if(this__8745.bitmap === bit) {
    return null
  }else {
    var editable__8747 = inode__8746.ensure_editable(e);
    var earr__8748 = editable__8747.arr;
    var len__8749 = earr__8748.length;
    editable__8747.bitmap = bit ^ editable__8747.bitmap;
    cljs.core.array_copy.call(null, earr__8748, 2 * (i + 1), earr__8748, 2 * i, len__8749 - 2 * (i + 1));
    earr__8748[len__8749 - 2] = null;
    earr__8748[len__8749 - 1] = null;
    return editable__8747
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_assoc_BANG_ = function(edit, shift, hash, key, val, added_leaf_QMARK_) {
  var this__8750 = this;
  var inode__8751 = this;
  var bit__8752 = 1 << (hash >>> shift & 31);
  var idx__8753 = cljs.core.bitmap_indexed_node_index.call(null, this__8750.bitmap, bit__8752);
  if((this__8750.bitmap & bit__8752) === 0) {
    var n__8754 = cljs.core.bit_count.call(null, this__8750.bitmap);
    if(2 * n__8754 < this__8750.arr.length) {
      var editable__8755 = inode__8751.ensure_editable(edit);
      var earr__8756 = editable__8755.arr;
      added_leaf_QMARK_.val = true;
      cljs.core.array_copy_downward.call(null, earr__8756, 2 * idx__8753, earr__8756, 2 * (idx__8753 + 1), 2 * (n__8754 - idx__8753));
      earr__8756[2 * idx__8753] = key;
      earr__8756[2 * idx__8753 + 1] = val;
      editable__8755.bitmap = editable__8755.bitmap | bit__8752;
      return editable__8755
    }else {
      if(n__8754 >= 16) {
        var nodes__8757 = cljs.core.make_array.call(null, 32);
        var jdx__8758 = hash >>> shift & 31;
        nodes__8757[jdx__8758] = cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_);
        var i__8759 = 0;
        var j__8760 = 0;
        while(true) {
          if(i__8759 < 32) {
            if((this__8750.bitmap >>> i__8759 & 1) === 0) {
              var G__8813 = i__8759 + 1;
              var G__8814 = j__8760;
              i__8759 = G__8813;
              j__8760 = G__8814;
              continue
            }else {
              nodes__8757[i__8759] = !(this__8750.arr[j__8760] == null) ? cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift + 5, cljs.core.hash.call(null, this__8750.arr[j__8760]), this__8750.arr[j__8760], this__8750.arr[j__8760 + 1], added_leaf_QMARK_) : this__8750.arr[j__8760 + 1];
              var G__8815 = i__8759 + 1;
              var G__8816 = j__8760 + 2;
              i__8759 = G__8815;
              j__8760 = G__8816;
              continue
            }
          }else {
          }
          break
        }
        return new cljs.core.ArrayNode(edit, n__8754 + 1, nodes__8757)
      }else {
        if("\ufdd0'else") {
          var new_arr__8761 = cljs.core.make_array.call(null, 2 * (n__8754 + 4));
          cljs.core.array_copy.call(null, this__8750.arr, 0, new_arr__8761, 0, 2 * idx__8753);
          new_arr__8761[2 * idx__8753] = key;
          new_arr__8761[2 * idx__8753 + 1] = val;
          cljs.core.array_copy.call(null, this__8750.arr, 2 * idx__8753, new_arr__8761, 2 * (idx__8753 + 1), 2 * (n__8754 - idx__8753));
          added_leaf_QMARK_.val = true;
          var editable__8762 = inode__8751.ensure_editable(edit);
          editable__8762.arr = new_arr__8761;
          editable__8762.bitmap = editable__8762.bitmap | bit__8752;
          return editable__8762
        }else {
          return null
        }
      }
    }
  }else {
    var key_or_nil__8763 = this__8750.arr[2 * idx__8753];
    var val_or_node__8764 = this__8750.arr[2 * idx__8753 + 1];
    if(key_or_nil__8763 == null) {
      var n__8765 = val_or_node__8764.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_);
      if(n__8765 === val_or_node__8764) {
        return inode__8751
      }else {
        return cljs.core.edit_and_set.call(null, inode__8751, edit, 2 * idx__8753 + 1, n__8765)
      }
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__8763)) {
        if(val === val_or_node__8764) {
          return inode__8751
        }else {
          return cljs.core.edit_and_set.call(null, inode__8751, edit, 2 * idx__8753 + 1, val)
        }
      }else {
        if("\ufdd0'else") {
          added_leaf_QMARK_.val = true;
          return cljs.core.edit_and_set.call(null, inode__8751, edit, 2 * idx__8753, null, 2 * idx__8753 + 1, cljs.core.create_node.call(null, edit, shift + 5, key_or_nil__8763, val_or_node__8764, hash, key, val))
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_seq = function() {
  var this__8766 = this;
  var inode__8767 = this;
  return cljs.core.create_inode_seq.call(null, this__8766.arr)
};
cljs.core.BitmapIndexedNode.prototype.inode_without_BANG_ = function(edit, shift, hash, key, removed_leaf_QMARK_) {
  var this__8768 = this;
  var inode__8769 = this;
  var bit__8770 = 1 << (hash >>> shift & 31);
  if((this__8768.bitmap & bit__8770) === 0) {
    return inode__8769
  }else {
    var idx__8771 = cljs.core.bitmap_indexed_node_index.call(null, this__8768.bitmap, bit__8770);
    var key_or_nil__8772 = this__8768.arr[2 * idx__8771];
    var val_or_node__8773 = this__8768.arr[2 * idx__8771 + 1];
    if(key_or_nil__8772 == null) {
      var n__8774 = val_or_node__8773.inode_without_BANG_(edit, shift + 5, hash, key, removed_leaf_QMARK_);
      if(n__8774 === val_or_node__8773) {
        return inode__8769
      }else {
        if(!(n__8774 == null)) {
          return cljs.core.edit_and_set.call(null, inode__8769, edit, 2 * idx__8771 + 1, n__8774)
        }else {
          if(this__8768.bitmap === bit__8770) {
            return null
          }else {
            if("\ufdd0'else") {
              return inode__8769.edit_and_remove_pair(edit, bit__8770, idx__8771)
            }else {
              return null
            }
          }
        }
      }
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__8772)) {
        removed_leaf_QMARK_[0] = true;
        return inode__8769.edit_and_remove_pair(edit, bit__8770, idx__8771)
      }else {
        if("\ufdd0'else") {
          return inode__8769
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.ensure_editable = function(e) {
  var this__8775 = this;
  var inode__8776 = this;
  if(e === this__8775.edit) {
    return inode__8776
  }else {
    var n__8777 = cljs.core.bit_count.call(null, this__8775.bitmap);
    var new_arr__8778 = cljs.core.make_array.call(null, n__8777 < 0 ? 4 : 2 * (n__8777 + 1));
    cljs.core.array_copy.call(null, this__8775.arr, 0, new_arr__8778, 0, 2 * n__8777);
    return new cljs.core.BitmapIndexedNode(e, this__8775.bitmap, new_arr__8778)
  }
};
cljs.core.BitmapIndexedNode.prototype.kv_reduce = function(f, init) {
  var this__8779 = this;
  var inode__8780 = this;
  return cljs.core.inode_kv_reduce.call(null, this__8779.arr, f, init)
};
cljs.core.BitmapIndexedNode.prototype.inode_find = function(shift, hash, key, not_found) {
  var this__8781 = this;
  var inode__8782 = this;
  var bit__8783 = 1 << (hash >>> shift & 31);
  if((this__8781.bitmap & bit__8783) === 0) {
    return not_found
  }else {
    var idx__8784 = cljs.core.bitmap_indexed_node_index.call(null, this__8781.bitmap, bit__8783);
    var key_or_nil__8785 = this__8781.arr[2 * idx__8784];
    var val_or_node__8786 = this__8781.arr[2 * idx__8784 + 1];
    if(key_or_nil__8785 == null) {
      return val_or_node__8786.inode_find(shift + 5, hash, key, not_found)
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__8785)) {
        return cljs.core.PersistentVector.fromArray([key_or_nil__8785, val_or_node__8786], true)
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
  var this__8787 = this;
  var inode__8788 = this;
  var bit__8789 = 1 << (hash >>> shift & 31);
  if((this__8787.bitmap & bit__8789) === 0) {
    return inode__8788
  }else {
    var idx__8790 = cljs.core.bitmap_indexed_node_index.call(null, this__8787.bitmap, bit__8789);
    var key_or_nil__8791 = this__8787.arr[2 * idx__8790];
    var val_or_node__8792 = this__8787.arr[2 * idx__8790 + 1];
    if(key_or_nil__8791 == null) {
      var n__8793 = val_or_node__8792.inode_without(shift + 5, hash, key);
      if(n__8793 === val_or_node__8792) {
        return inode__8788
      }else {
        if(!(n__8793 == null)) {
          return new cljs.core.BitmapIndexedNode(null, this__8787.bitmap, cljs.core.clone_and_set.call(null, this__8787.arr, 2 * idx__8790 + 1, n__8793))
        }else {
          if(this__8787.bitmap === bit__8789) {
            return null
          }else {
            if("\ufdd0'else") {
              return new cljs.core.BitmapIndexedNode(null, this__8787.bitmap ^ bit__8789, cljs.core.remove_pair.call(null, this__8787.arr, idx__8790))
            }else {
              return null
            }
          }
        }
      }
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__8791)) {
        return new cljs.core.BitmapIndexedNode(null, this__8787.bitmap ^ bit__8789, cljs.core.remove_pair.call(null, this__8787.arr, idx__8790))
      }else {
        if("\ufdd0'else") {
          return inode__8788
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_assoc = function(shift, hash, key, val, added_leaf_QMARK_) {
  var this__8794 = this;
  var inode__8795 = this;
  var bit__8796 = 1 << (hash >>> shift & 31);
  var idx__8797 = cljs.core.bitmap_indexed_node_index.call(null, this__8794.bitmap, bit__8796);
  if((this__8794.bitmap & bit__8796) === 0) {
    var n__8798 = cljs.core.bit_count.call(null, this__8794.bitmap);
    if(n__8798 >= 16) {
      var nodes__8799 = cljs.core.make_array.call(null, 32);
      var jdx__8800 = hash >>> shift & 31;
      nodes__8799[jdx__8800] = cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_);
      var i__8801 = 0;
      var j__8802 = 0;
      while(true) {
        if(i__8801 < 32) {
          if((this__8794.bitmap >>> i__8801 & 1) === 0) {
            var G__8817 = i__8801 + 1;
            var G__8818 = j__8802;
            i__8801 = G__8817;
            j__8802 = G__8818;
            continue
          }else {
            nodes__8799[i__8801] = !(this__8794.arr[j__8802] == null) ? cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift + 5, cljs.core.hash.call(null, this__8794.arr[j__8802]), this__8794.arr[j__8802], this__8794.arr[j__8802 + 1], added_leaf_QMARK_) : this__8794.arr[j__8802 + 1];
            var G__8819 = i__8801 + 1;
            var G__8820 = j__8802 + 2;
            i__8801 = G__8819;
            j__8802 = G__8820;
            continue
          }
        }else {
        }
        break
      }
      return new cljs.core.ArrayNode(null, n__8798 + 1, nodes__8799)
    }else {
      var new_arr__8803 = cljs.core.make_array.call(null, 2 * (n__8798 + 1));
      cljs.core.array_copy.call(null, this__8794.arr, 0, new_arr__8803, 0, 2 * idx__8797);
      new_arr__8803[2 * idx__8797] = key;
      new_arr__8803[2 * idx__8797 + 1] = val;
      cljs.core.array_copy.call(null, this__8794.arr, 2 * idx__8797, new_arr__8803, 2 * (idx__8797 + 1), 2 * (n__8798 - idx__8797));
      added_leaf_QMARK_.val = true;
      return new cljs.core.BitmapIndexedNode(null, this__8794.bitmap | bit__8796, new_arr__8803)
    }
  }else {
    var key_or_nil__8804 = this__8794.arr[2 * idx__8797];
    var val_or_node__8805 = this__8794.arr[2 * idx__8797 + 1];
    if(key_or_nil__8804 == null) {
      var n__8806 = val_or_node__8805.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_);
      if(n__8806 === val_or_node__8805) {
        return inode__8795
      }else {
        return new cljs.core.BitmapIndexedNode(null, this__8794.bitmap, cljs.core.clone_and_set.call(null, this__8794.arr, 2 * idx__8797 + 1, n__8806))
      }
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__8804)) {
        if(val === val_or_node__8805) {
          return inode__8795
        }else {
          return new cljs.core.BitmapIndexedNode(null, this__8794.bitmap, cljs.core.clone_and_set.call(null, this__8794.arr, 2 * idx__8797 + 1, val))
        }
      }else {
        if("\ufdd0'else") {
          added_leaf_QMARK_.val = true;
          return new cljs.core.BitmapIndexedNode(null, this__8794.bitmap, cljs.core.clone_and_set.call(null, this__8794.arr, 2 * idx__8797, null, 2 * idx__8797 + 1, cljs.core.create_node.call(null, shift + 5, key_or_nil__8804, val_or_node__8805, hash, key, val)))
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_lookup = function(shift, hash, key, not_found) {
  var this__8807 = this;
  var inode__8808 = this;
  var bit__8809 = 1 << (hash >>> shift & 31);
  if((this__8807.bitmap & bit__8809) === 0) {
    return not_found
  }else {
    var idx__8810 = cljs.core.bitmap_indexed_node_index.call(null, this__8807.bitmap, bit__8809);
    var key_or_nil__8811 = this__8807.arr[2 * idx__8810];
    var val_or_node__8812 = this__8807.arr[2 * idx__8810 + 1];
    if(key_or_nil__8811 == null) {
      return val_or_node__8812.inode_lookup(shift + 5, hash, key, not_found)
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__8811)) {
        return val_or_node__8812
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
  var arr__8828 = array_node.arr;
  var len__8829 = 2 * (array_node.cnt - 1);
  var new_arr__8830 = cljs.core.make_array.call(null, len__8829);
  var i__8831 = 0;
  var j__8832 = 1;
  var bitmap__8833 = 0;
  while(true) {
    if(i__8831 < len__8829) {
      if(function() {
        var and__3822__auto____8834 = !(i__8831 === idx);
        if(and__3822__auto____8834) {
          return!(arr__8828[i__8831] == null)
        }else {
          return and__3822__auto____8834
        }
      }()) {
        new_arr__8830[j__8832] = arr__8828[i__8831];
        var G__8835 = i__8831 + 1;
        var G__8836 = j__8832 + 2;
        var G__8837 = bitmap__8833 | 1 << i__8831;
        i__8831 = G__8835;
        j__8832 = G__8836;
        bitmap__8833 = G__8837;
        continue
      }else {
        var G__8838 = i__8831 + 1;
        var G__8839 = j__8832;
        var G__8840 = bitmap__8833;
        i__8831 = G__8838;
        j__8832 = G__8839;
        bitmap__8833 = G__8840;
        continue
      }
    }else {
      return new cljs.core.BitmapIndexedNode(edit, bitmap__8833, new_arr__8830)
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
cljs.core.ArrayNode.cljs$lang$ctorPrSeq = function(this__2337__auto__) {
  return cljs.core.list.call(null, "cljs.core/ArrayNode")
};
cljs.core.ArrayNode.prototype.inode_assoc_BANG_ = function(edit, shift, hash, key, val, added_leaf_QMARK_) {
  var this__8841 = this;
  var inode__8842 = this;
  var idx__8843 = hash >>> shift & 31;
  var node__8844 = this__8841.arr[idx__8843];
  if(node__8844 == null) {
    var editable__8845 = cljs.core.edit_and_set.call(null, inode__8842, edit, idx__8843, cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_));
    editable__8845.cnt = editable__8845.cnt + 1;
    return editable__8845
  }else {
    var n__8846 = node__8844.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_);
    if(n__8846 === node__8844) {
      return inode__8842
    }else {
      return cljs.core.edit_and_set.call(null, inode__8842, edit, idx__8843, n__8846)
    }
  }
};
cljs.core.ArrayNode.prototype.inode_seq = function() {
  var this__8847 = this;
  var inode__8848 = this;
  return cljs.core.create_array_node_seq.call(null, this__8847.arr)
};
cljs.core.ArrayNode.prototype.inode_without_BANG_ = function(edit, shift, hash, key, removed_leaf_QMARK_) {
  var this__8849 = this;
  var inode__8850 = this;
  var idx__8851 = hash >>> shift & 31;
  var node__8852 = this__8849.arr[idx__8851];
  if(node__8852 == null) {
    return inode__8850
  }else {
    var n__8853 = node__8852.inode_without_BANG_(edit, shift + 5, hash, key, removed_leaf_QMARK_);
    if(n__8853 === node__8852) {
      return inode__8850
    }else {
      if(n__8853 == null) {
        if(this__8849.cnt <= 8) {
          return cljs.core.pack_array_node.call(null, inode__8850, edit, idx__8851)
        }else {
          var editable__8854 = cljs.core.edit_and_set.call(null, inode__8850, edit, idx__8851, n__8853);
          editable__8854.cnt = editable__8854.cnt - 1;
          return editable__8854
        }
      }else {
        if("\ufdd0'else") {
          return cljs.core.edit_and_set.call(null, inode__8850, edit, idx__8851, n__8853)
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.ArrayNode.prototype.ensure_editable = function(e) {
  var this__8855 = this;
  var inode__8856 = this;
  if(e === this__8855.edit) {
    return inode__8856
  }else {
    return new cljs.core.ArrayNode(e, this__8855.cnt, this__8855.arr.slice())
  }
};
cljs.core.ArrayNode.prototype.kv_reduce = function(f, init) {
  var this__8857 = this;
  var inode__8858 = this;
  var len__8859 = this__8857.arr.length;
  var i__8860 = 0;
  var init__8861 = init;
  while(true) {
    if(i__8860 < len__8859) {
      var node__8862 = this__8857.arr[i__8860];
      if(!(node__8862 == null)) {
        var init__8863 = node__8862.kv_reduce(f, init__8861);
        if(cljs.core.reduced_QMARK_.call(null, init__8863)) {
          return cljs.core.deref.call(null, init__8863)
        }else {
          var G__8882 = i__8860 + 1;
          var G__8883 = init__8863;
          i__8860 = G__8882;
          init__8861 = G__8883;
          continue
        }
      }else {
        return null
      }
    }else {
      return init__8861
    }
    break
  }
};
cljs.core.ArrayNode.prototype.inode_find = function(shift, hash, key, not_found) {
  var this__8864 = this;
  var inode__8865 = this;
  var idx__8866 = hash >>> shift & 31;
  var node__8867 = this__8864.arr[idx__8866];
  if(!(node__8867 == null)) {
    return node__8867.inode_find(shift + 5, hash, key, not_found)
  }else {
    return not_found
  }
};
cljs.core.ArrayNode.prototype.inode_without = function(shift, hash, key) {
  var this__8868 = this;
  var inode__8869 = this;
  var idx__8870 = hash >>> shift & 31;
  var node__8871 = this__8868.arr[idx__8870];
  if(!(node__8871 == null)) {
    var n__8872 = node__8871.inode_without(shift + 5, hash, key);
    if(n__8872 === node__8871) {
      return inode__8869
    }else {
      if(n__8872 == null) {
        if(this__8868.cnt <= 8) {
          return cljs.core.pack_array_node.call(null, inode__8869, null, idx__8870)
        }else {
          return new cljs.core.ArrayNode(null, this__8868.cnt - 1, cljs.core.clone_and_set.call(null, this__8868.arr, idx__8870, n__8872))
        }
      }else {
        if("\ufdd0'else") {
          return new cljs.core.ArrayNode(null, this__8868.cnt, cljs.core.clone_and_set.call(null, this__8868.arr, idx__8870, n__8872))
        }else {
          return null
        }
      }
    }
  }else {
    return inode__8869
  }
};
cljs.core.ArrayNode.prototype.inode_assoc = function(shift, hash, key, val, added_leaf_QMARK_) {
  var this__8873 = this;
  var inode__8874 = this;
  var idx__8875 = hash >>> shift & 31;
  var node__8876 = this__8873.arr[idx__8875];
  if(node__8876 == null) {
    return new cljs.core.ArrayNode(null, this__8873.cnt + 1, cljs.core.clone_and_set.call(null, this__8873.arr, idx__8875, cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_)))
  }else {
    var n__8877 = node__8876.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_);
    if(n__8877 === node__8876) {
      return inode__8874
    }else {
      return new cljs.core.ArrayNode(null, this__8873.cnt, cljs.core.clone_and_set.call(null, this__8873.arr, idx__8875, n__8877))
    }
  }
};
cljs.core.ArrayNode.prototype.inode_lookup = function(shift, hash, key, not_found) {
  var this__8878 = this;
  var inode__8879 = this;
  var idx__8880 = hash >>> shift & 31;
  var node__8881 = this__8878.arr[idx__8880];
  if(!(node__8881 == null)) {
    return node__8881.inode_lookup(shift + 5, hash, key, not_found)
  }else {
    return not_found
  }
};
cljs.core.ArrayNode;
cljs.core.hash_collision_node_find_index = function hash_collision_node_find_index(arr, cnt, key) {
  var lim__8886 = 2 * cnt;
  var i__8887 = 0;
  while(true) {
    if(i__8887 < lim__8886) {
      if(cljs.core.key_test.call(null, key, arr[i__8887])) {
        return i__8887
      }else {
        var G__8888 = i__8887 + 2;
        i__8887 = G__8888;
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
cljs.core.HashCollisionNode.cljs$lang$ctorPrSeq = function(this__2337__auto__) {
  return cljs.core.list.call(null, "cljs.core/HashCollisionNode")
};
cljs.core.HashCollisionNode.prototype.inode_assoc_BANG_ = function(edit, shift, hash, key, val, added_leaf_QMARK_) {
  var this__8889 = this;
  var inode__8890 = this;
  if(hash === this__8889.collision_hash) {
    var idx__8891 = cljs.core.hash_collision_node_find_index.call(null, this__8889.arr, this__8889.cnt, key);
    if(idx__8891 === -1) {
      if(this__8889.arr.length > 2 * this__8889.cnt) {
        var editable__8892 = cljs.core.edit_and_set.call(null, inode__8890, edit, 2 * this__8889.cnt, key, 2 * this__8889.cnt + 1, val);
        added_leaf_QMARK_.val = true;
        editable__8892.cnt = editable__8892.cnt + 1;
        return editable__8892
      }else {
        var len__8893 = this__8889.arr.length;
        var new_arr__8894 = cljs.core.make_array.call(null, len__8893 + 2);
        cljs.core.array_copy.call(null, this__8889.arr, 0, new_arr__8894, 0, len__8893);
        new_arr__8894[len__8893] = key;
        new_arr__8894[len__8893 + 1] = val;
        added_leaf_QMARK_.val = true;
        return inode__8890.ensure_editable_array(edit, this__8889.cnt + 1, new_arr__8894)
      }
    }else {
      if(this__8889.arr[idx__8891 + 1] === val) {
        return inode__8890
      }else {
        return cljs.core.edit_and_set.call(null, inode__8890, edit, idx__8891 + 1, val)
      }
    }
  }else {
    return(new cljs.core.BitmapIndexedNode(edit, 1 << (this__8889.collision_hash >>> shift & 31), [null, inode__8890, null, null])).inode_assoc_BANG_(edit, shift, hash, key, val, added_leaf_QMARK_)
  }
};
cljs.core.HashCollisionNode.prototype.inode_seq = function() {
  var this__8895 = this;
  var inode__8896 = this;
  return cljs.core.create_inode_seq.call(null, this__8895.arr)
};
cljs.core.HashCollisionNode.prototype.inode_without_BANG_ = function(edit, shift, hash, key, removed_leaf_QMARK_) {
  var this__8897 = this;
  var inode__8898 = this;
  var idx__8899 = cljs.core.hash_collision_node_find_index.call(null, this__8897.arr, this__8897.cnt, key);
  if(idx__8899 === -1) {
    return inode__8898
  }else {
    removed_leaf_QMARK_[0] = true;
    if(this__8897.cnt === 1) {
      return null
    }else {
      var editable__8900 = inode__8898.ensure_editable(edit);
      var earr__8901 = editable__8900.arr;
      earr__8901[idx__8899] = earr__8901[2 * this__8897.cnt - 2];
      earr__8901[idx__8899 + 1] = earr__8901[2 * this__8897.cnt - 1];
      earr__8901[2 * this__8897.cnt - 1] = null;
      earr__8901[2 * this__8897.cnt - 2] = null;
      editable__8900.cnt = editable__8900.cnt - 1;
      return editable__8900
    }
  }
};
cljs.core.HashCollisionNode.prototype.ensure_editable = function(e) {
  var this__8902 = this;
  var inode__8903 = this;
  if(e === this__8902.edit) {
    return inode__8903
  }else {
    var new_arr__8904 = cljs.core.make_array.call(null, 2 * (this__8902.cnt + 1));
    cljs.core.array_copy.call(null, this__8902.arr, 0, new_arr__8904, 0, 2 * this__8902.cnt);
    return new cljs.core.HashCollisionNode(e, this__8902.collision_hash, this__8902.cnt, new_arr__8904)
  }
};
cljs.core.HashCollisionNode.prototype.kv_reduce = function(f, init) {
  var this__8905 = this;
  var inode__8906 = this;
  return cljs.core.inode_kv_reduce.call(null, this__8905.arr, f, init)
};
cljs.core.HashCollisionNode.prototype.inode_find = function(shift, hash, key, not_found) {
  var this__8907 = this;
  var inode__8908 = this;
  var idx__8909 = cljs.core.hash_collision_node_find_index.call(null, this__8907.arr, this__8907.cnt, key);
  if(idx__8909 < 0) {
    return not_found
  }else {
    if(cljs.core.key_test.call(null, key, this__8907.arr[idx__8909])) {
      return cljs.core.PersistentVector.fromArray([this__8907.arr[idx__8909], this__8907.arr[idx__8909 + 1]], true)
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
  var this__8910 = this;
  var inode__8911 = this;
  var idx__8912 = cljs.core.hash_collision_node_find_index.call(null, this__8910.arr, this__8910.cnt, key);
  if(idx__8912 === -1) {
    return inode__8911
  }else {
    if(this__8910.cnt === 1) {
      return null
    }else {
      if("\ufdd0'else") {
        return new cljs.core.HashCollisionNode(null, this__8910.collision_hash, this__8910.cnt - 1, cljs.core.remove_pair.call(null, this__8910.arr, cljs.core.quot.call(null, idx__8912, 2)))
      }else {
        return null
      }
    }
  }
};
cljs.core.HashCollisionNode.prototype.inode_assoc = function(shift, hash, key, val, added_leaf_QMARK_) {
  var this__8913 = this;
  var inode__8914 = this;
  if(hash === this__8913.collision_hash) {
    var idx__8915 = cljs.core.hash_collision_node_find_index.call(null, this__8913.arr, this__8913.cnt, key);
    if(idx__8915 === -1) {
      var len__8916 = this__8913.arr.length;
      var new_arr__8917 = cljs.core.make_array.call(null, len__8916 + 2);
      cljs.core.array_copy.call(null, this__8913.arr, 0, new_arr__8917, 0, len__8916);
      new_arr__8917[len__8916] = key;
      new_arr__8917[len__8916 + 1] = val;
      added_leaf_QMARK_.val = true;
      return new cljs.core.HashCollisionNode(null, this__8913.collision_hash, this__8913.cnt + 1, new_arr__8917)
    }else {
      if(cljs.core._EQ_.call(null, this__8913.arr[idx__8915], val)) {
        return inode__8914
      }else {
        return new cljs.core.HashCollisionNode(null, this__8913.collision_hash, this__8913.cnt, cljs.core.clone_and_set.call(null, this__8913.arr, idx__8915 + 1, val))
      }
    }
  }else {
    return(new cljs.core.BitmapIndexedNode(null, 1 << (this__8913.collision_hash >>> shift & 31), [null, inode__8914])).inode_assoc(shift, hash, key, val, added_leaf_QMARK_)
  }
};
cljs.core.HashCollisionNode.prototype.inode_lookup = function(shift, hash, key, not_found) {
  var this__8918 = this;
  var inode__8919 = this;
  var idx__8920 = cljs.core.hash_collision_node_find_index.call(null, this__8918.arr, this__8918.cnt, key);
  if(idx__8920 < 0) {
    return not_found
  }else {
    if(cljs.core.key_test.call(null, key, this__8918.arr[idx__8920])) {
      return this__8918.arr[idx__8920 + 1]
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
  var this__8921 = this;
  var inode__8922 = this;
  if(e === this__8921.edit) {
    this__8921.arr = array;
    this__8921.cnt = count;
    return inode__8922
  }else {
    return new cljs.core.HashCollisionNode(this__8921.edit, this__8921.collision_hash, count, array)
  }
};
cljs.core.HashCollisionNode;
cljs.core.create_node = function() {
  var create_node = null;
  var create_node__6 = function(shift, key1, val1, key2hash, key2, val2) {
    var key1hash__8927 = cljs.core.hash.call(null, key1);
    if(key1hash__8927 === key2hash) {
      return new cljs.core.HashCollisionNode(null, key1hash__8927, 2, [key1, val1, key2, val2])
    }else {
      var added_leaf_QMARK___8928 = new cljs.core.Box(false);
      return cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift, key1hash__8927, key1, val1, added_leaf_QMARK___8928).inode_assoc(shift, key2hash, key2, val2, added_leaf_QMARK___8928)
    }
  };
  var create_node__7 = function(edit, shift, key1, val1, key2hash, key2, val2) {
    var key1hash__8929 = cljs.core.hash.call(null, key1);
    if(key1hash__8929 === key2hash) {
      return new cljs.core.HashCollisionNode(null, key1hash__8929, 2, [key1, val1, key2, val2])
    }else {
      var added_leaf_QMARK___8930 = new cljs.core.Box(false);
      return cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift, key1hash__8929, key1, val1, added_leaf_QMARK___8930).inode_assoc_BANG_(edit, shift, key2hash, key2, val2, added_leaf_QMARK___8930)
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
cljs.core.NodeSeq.cljs$lang$ctorPrSeq = function(this__2337__auto__) {
  return cljs.core.list.call(null, "cljs.core/NodeSeq")
};
cljs.core.NodeSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__8931 = this;
  var h__2220__auto____8932 = this__8931.__hash;
  if(!(h__2220__auto____8932 == null)) {
    return h__2220__auto____8932
  }else {
    var h__2220__auto____8933 = cljs.core.hash_coll.call(null, coll);
    this__8931.__hash = h__2220__auto____8933;
    return h__2220__auto____8933
  }
};
cljs.core.NodeSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__8934 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.NodeSeq.prototype.toString = function() {
  var this__8935 = this;
  var this__8936 = this;
  return cljs.core.pr_str.call(null, this__8936)
};
cljs.core.NodeSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__8937 = this;
  return this$
};
cljs.core.NodeSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__8938 = this;
  if(this__8938.s == null) {
    return cljs.core.PersistentVector.fromArray([this__8938.nodes[this__8938.i], this__8938.nodes[this__8938.i + 1]], true)
  }else {
    return cljs.core.first.call(null, this__8938.s)
  }
};
cljs.core.NodeSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__8939 = this;
  if(this__8939.s == null) {
    return cljs.core.create_inode_seq.call(null, this__8939.nodes, this__8939.i + 2, null)
  }else {
    return cljs.core.create_inode_seq.call(null, this__8939.nodes, this__8939.i, cljs.core.next.call(null, this__8939.s))
  }
};
cljs.core.NodeSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8940 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.NodeSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8941 = this;
  return new cljs.core.NodeSeq(meta, this__8941.nodes, this__8941.i, this__8941.s, this__8941.__hash)
};
cljs.core.NodeSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8942 = this;
  return this__8942.meta
};
cljs.core.NodeSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8943 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__8943.meta)
};
cljs.core.NodeSeq;
cljs.core.create_inode_seq = function() {
  var create_inode_seq = null;
  var create_inode_seq__1 = function(nodes) {
    return create_inode_seq.call(null, nodes, 0, null)
  };
  var create_inode_seq__3 = function(nodes, i, s) {
    if(s == null) {
      var len__8950 = nodes.length;
      var j__8951 = i;
      while(true) {
        if(j__8951 < len__8950) {
          if(!(nodes[j__8951] == null)) {
            return new cljs.core.NodeSeq(null, nodes, j__8951, null, null)
          }else {
            var temp__3971__auto____8952 = nodes[j__8951 + 1];
            if(cljs.core.truth_(temp__3971__auto____8952)) {
              var node__8953 = temp__3971__auto____8952;
              var temp__3971__auto____8954 = node__8953.inode_seq();
              if(cljs.core.truth_(temp__3971__auto____8954)) {
                var node_seq__8955 = temp__3971__auto____8954;
                return new cljs.core.NodeSeq(null, nodes, j__8951 + 2, node_seq__8955, null)
              }else {
                var G__8956 = j__8951 + 2;
                j__8951 = G__8956;
                continue
              }
            }else {
              var G__8957 = j__8951 + 2;
              j__8951 = G__8957;
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
cljs.core.ArrayNodeSeq.cljs$lang$ctorPrSeq = function(this__2337__auto__) {
  return cljs.core.list.call(null, "cljs.core/ArrayNodeSeq")
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__8958 = this;
  var h__2220__auto____8959 = this__8958.__hash;
  if(!(h__2220__auto____8959 == null)) {
    return h__2220__auto____8959
  }else {
    var h__2220__auto____8960 = cljs.core.hash_coll.call(null, coll);
    this__8958.__hash = h__2220__auto____8960;
    return h__2220__auto____8960
  }
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__8961 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.ArrayNodeSeq.prototype.toString = function() {
  var this__8962 = this;
  var this__8963 = this;
  return cljs.core.pr_str.call(null, this__8963)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__8964 = this;
  return this$
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__8965 = this;
  return cljs.core.first.call(null, this__8965.s)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__8966 = this;
  return cljs.core.create_array_node_seq.call(null, null, this__8966.nodes, this__8966.i, cljs.core.next.call(null, this__8966.s))
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8967 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8968 = this;
  return new cljs.core.ArrayNodeSeq(meta, this__8968.nodes, this__8968.i, this__8968.s, this__8968.__hash)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8969 = this;
  return this__8969.meta
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8970 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__8970.meta)
};
cljs.core.ArrayNodeSeq;
cljs.core.create_array_node_seq = function() {
  var create_array_node_seq = null;
  var create_array_node_seq__1 = function(nodes) {
    return create_array_node_seq.call(null, null, nodes, 0, null)
  };
  var create_array_node_seq__4 = function(meta, nodes, i, s) {
    if(s == null) {
      var len__8977 = nodes.length;
      var j__8978 = i;
      while(true) {
        if(j__8978 < len__8977) {
          var temp__3971__auto____8979 = nodes[j__8978];
          if(cljs.core.truth_(temp__3971__auto____8979)) {
            var nj__8980 = temp__3971__auto____8979;
            var temp__3971__auto____8981 = nj__8980.inode_seq();
            if(cljs.core.truth_(temp__3971__auto____8981)) {
              var ns__8982 = temp__3971__auto____8981;
              return new cljs.core.ArrayNodeSeq(meta, nodes, j__8978 + 1, ns__8982, null)
            }else {
              var G__8983 = j__8978 + 1;
              j__8978 = G__8983;
              continue
            }
          }else {
            var G__8984 = j__8978 + 1;
            j__8978 = G__8984;
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
cljs.core.PersistentHashMap.cljs$lang$ctorPrSeq = function(this__2337__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentHashMap")
};
cljs.core.PersistentHashMap.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var this__8987 = this;
  return new cljs.core.TransientHashMap({}, this__8987.root, this__8987.cnt, this__8987.has_nil_QMARK_, this__8987.nil_val)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__8988 = this;
  var h__2220__auto____8989 = this__8988.__hash;
  if(!(h__2220__auto____8989 == null)) {
    return h__2220__auto____8989
  }else {
    var h__2220__auto____8990 = cljs.core.hash_imap.call(null, coll);
    this__8988.__hash = h__2220__auto____8990;
    return h__2220__auto____8990
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__8991 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.PersistentHashMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__8992 = this;
  if(k == null) {
    if(this__8992.has_nil_QMARK_) {
      return this__8992.nil_val
    }else {
      return not_found
    }
  }else {
    if(this__8992.root == null) {
      return not_found
    }else {
      if("\ufdd0'else") {
        return this__8992.root.inode_lookup(0, cljs.core.hash.call(null, k), k, not_found)
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__8993 = this;
  if(k == null) {
    if(function() {
      var and__3822__auto____8994 = this__8993.has_nil_QMARK_;
      if(and__3822__auto____8994) {
        return v === this__8993.nil_val
      }else {
        return and__3822__auto____8994
      }
    }()) {
      return coll
    }else {
      return new cljs.core.PersistentHashMap(this__8993.meta, this__8993.has_nil_QMARK_ ? this__8993.cnt : this__8993.cnt + 1, this__8993.root, true, v, null)
    }
  }else {
    var added_leaf_QMARK___8995 = new cljs.core.Box(false);
    var new_root__8996 = (this__8993.root == null ? cljs.core.BitmapIndexedNode.EMPTY : this__8993.root).inode_assoc(0, cljs.core.hash.call(null, k), k, v, added_leaf_QMARK___8995);
    if(new_root__8996 === this__8993.root) {
      return coll
    }else {
      return new cljs.core.PersistentHashMap(this__8993.meta, added_leaf_QMARK___8995.val ? this__8993.cnt + 1 : this__8993.cnt, new_root__8996, this__8993.has_nil_QMARK_, this__8993.nil_val, null)
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__8997 = this;
  if(k == null) {
    return this__8997.has_nil_QMARK_
  }else {
    if(this__8997.root == null) {
      return false
    }else {
      if("\ufdd0'else") {
        return!(this__8997.root.inode_lookup(0, cljs.core.hash.call(null, k), k, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel)
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap.prototype.call = function() {
  var G__9020 = null;
  var G__9020__2 = function(this_sym8998, k) {
    var this__9000 = this;
    var this_sym8998__9001 = this;
    var coll__9002 = this_sym8998__9001;
    return coll__9002.cljs$core$ILookup$_lookup$arity$2(coll__9002, k)
  };
  var G__9020__3 = function(this_sym8999, k, not_found) {
    var this__9000 = this;
    var this_sym8999__9003 = this;
    var coll__9004 = this_sym8999__9003;
    return coll__9004.cljs$core$ILookup$_lookup$arity$3(coll__9004, k, not_found)
  };
  G__9020 = function(this_sym8999, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9020__2.call(this, this_sym8999, k);
      case 3:
        return G__9020__3.call(this, this_sym8999, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9020
}();
cljs.core.PersistentHashMap.prototype.apply = function(this_sym8985, args8986) {
  var this__9005 = this;
  return this_sym8985.call.apply(this_sym8985, [this_sym8985].concat(args8986.slice()))
};
cljs.core.PersistentHashMap.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(coll, f, init) {
  var this__9006 = this;
  var init__9007 = this__9006.has_nil_QMARK_ ? f.call(null, init, null, this__9006.nil_val) : init;
  if(cljs.core.reduced_QMARK_.call(null, init__9007)) {
    return cljs.core.deref.call(null, init__9007)
  }else {
    if(!(this__9006.root == null)) {
      return this__9006.root.kv_reduce(f, init__9007)
    }else {
      if("\ufdd0'else") {
        return init__9007
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__9008 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.PersistentHashMap.prototype.toString = function() {
  var this__9009 = this;
  var this__9010 = this;
  return cljs.core.pr_str.call(null, this__9010)
};
cljs.core.PersistentHashMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__9011 = this;
  if(this__9011.cnt > 0) {
    var s__9012 = !(this__9011.root == null) ? this__9011.root.inode_seq() : null;
    if(this__9011.has_nil_QMARK_) {
      return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([null, this__9011.nil_val], true), s__9012)
    }else {
      return s__9012
    }
  }else {
    return null
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__9013 = this;
  return this__9013.cnt
};
cljs.core.PersistentHashMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9014 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__9015 = this;
  return new cljs.core.PersistentHashMap(meta, this__9015.cnt, this__9015.root, this__9015.has_nil_QMARK_, this__9015.nil_val, this__9015.__hash)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__9016 = this;
  return this__9016.meta
};
cljs.core.PersistentHashMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__9017 = this;
  return cljs.core._with_meta.call(null, cljs.core.PersistentHashMap.EMPTY, this__9017.meta)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__9018 = this;
  if(k == null) {
    if(this__9018.has_nil_QMARK_) {
      return new cljs.core.PersistentHashMap(this__9018.meta, this__9018.cnt - 1, this__9018.root, false, null, null)
    }else {
      return coll
    }
  }else {
    if(this__9018.root == null) {
      return coll
    }else {
      if("\ufdd0'else") {
        var new_root__9019 = this__9018.root.inode_without(0, cljs.core.hash.call(null, k), k);
        if(new_root__9019 === this__9018.root) {
          return coll
        }else {
          return new cljs.core.PersistentHashMap(this__9018.meta, this__9018.cnt - 1, new_root__9019, this__9018.has_nil_QMARK_, this__9018.nil_val, null)
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
  var len__9021 = ks.length;
  var i__9022 = 0;
  var out__9023 = cljs.core.transient$.call(null, cljs.core.PersistentHashMap.EMPTY);
  while(true) {
    if(i__9022 < len__9021) {
      var G__9024 = i__9022 + 1;
      var G__9025 = cljs.core.assoc_BANG_.call(null, out__9023, ks[i__9022], vs[i__9022]);
      i__9022 = G__9024;
      out__9023 = G__9025;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, out__9023)
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
cljs.core.TransientHashMap.cljs$lang$ctorPrSeq = function(this__2337__auto__) {
  return cljs.core.list.call(null, "cljs.core/TransientHashMap")
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientMap$_dissoc_BANG_$arity$2 = function(tcoll, key) {
  var this__9026 = this;
  return tcoll.without_BANG_(key)
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3 = function(tcoll, key, val) {
  var this__9027 = this;
  return tcoll.assoc_BANG_(key, val)
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, val) {
  var this__9028 = this;
  return tcoll.conj_BANG_(val)
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__9029 = this;
  return tcoll.persistent_BANG_()
};
cljs.core.TransientHashMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(tcoll, k) {
  var this__9030 = this;
  if(k == null) {
    if(this__9030.has_nil_QMARK_) {
      return this__9030.nil_val
    }else {
      return null
    }
  }else {
    if(this__9030.root == null) {
      return null
    }else {
      return this__9030.root.inode_lookup(0, cljs.core.hash.call(null, k), k)
    }
  }
};
cljs.core.TransientHashMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(tcoll, k, not_found) {
  var this__9031 = this;
  if(k == null) {
    if(this__9031.has_nil_QMARK_) {
      return this__9031.nil_val
    }else {
      return not_found
    }
  }else {
    if(this__9031.root == null) {
      return not_found
    }else {
      return this__9031.root.inode_lookup(0, cljs.core.hash.call(null, k), k, not_found)
    }
  }
};
cljs.core.TransientHashMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__9032 = this;
  if(this__9032.edit) {
    return this__9032.count
  }else {
    throw new Error("count after persistent!");
  }
};
cljs.core.TransientHashMap.prototype.conj_BANG_ = function(o) {
  var this__9033 = this;
  var tcoll__9034 = this;
  if(this__9033.edit) {
    if(function() {
      var G__9035__9036 = o;
      if(G__9035__9036) {
        if(function() {
          var or__3824__auto____9037 = G__9035__9036.cljs$lang$protocol_mask$partition0$ & 2048;
          if(or__3824__auto____9037) {
            return or__3824__auto____9037
          }else {
            return G__9035__9036.cljs$core$IMapEntry$
          }
        }()) {
          return true
        }else {
          if(!G__9035__9036.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__9035__9036)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__9035__9036)
      }
    }()) {
      return tcoll__9034.assoc_BANG_(cljs.core.key.call(null, o), cljs.core.val.call(null, o))
    }else {
      var es__9038 = cljs.core.seq.call(null, o);
      var tcoll__9039 = tcoll__9034;
      while(true) {
        var temp__3971__auto____9040 = cljs.core.first.call(null, es__9038);
        if(cljs.core.truth_(temp__3971__auto____9040)) {
          var e__9041 = temp__3971__auto____9040;
          var G__9052 = cljs.core.next.call(null, es__9038);
          var G__9053 = tcoll__9039.assoc_BANG_(cljs.core.key.call(null, e__9041), cljs.core.val.call(null, e__9041));
          es__9038 = G__9052;
          tcoll__9039 = G__9053;
          continue
        }else {
          return tcoll__9039
        }
        break
      }
    }
  }else {
    throw new Error("conj! after persistent");
  }
};
cljs.core.TransientHashMap.prototype.assoc_BANG_ = function(k, v) {
  var this__9042 = this;
  var tcoll__9043 = this;
  if(this__9042.edit) {
    if(k == null) {
      if(this__9042.nil_val === v) {
      }else {
        this__9042.nil_val = v
      }
      if(this__9042.has_nil_QMARK_) {
      }else {
        this__9042.count = this__9042.count + 1;
        this__9042.has_nil_QMARK_ = true
      }
      return tcoll__9043
    }else {
      var added_leaf_QMARK___9044 = new cljs.core.Box(false);
      var node__9045 = (this__9042.root == null ? cljs.core.BitmapIndexedNode.EMPTY : this__9042.root).inode_assoc_BANG_(this__9042.edit, 0, cljs.core.hash.call(null, k), k, v, added_leaf_QMARK___9044);
      if(node__9045 === this__9042.root) {
      }else {
        this__9042.root = node__9045
      }
      if(added_leaf_QMARK___9044.val) {
        this__9042.count = this__9042.count + 1
      }else {
      }
      return tcoll__9043
    }
  }else {
    throw new Error("assoc! after persistent!");
  }
};
cljs.core.TransientHashMap.prototype.without_BANG_ = function(k) {
  var this__9046 = this;
  var tcoll__9047 = this;
  if(this__9046.edit) {
    if(k == null) {
      if(this__9046.has_nil_QMARK_) {
        this__9046.has_nil_QMARK_ = false;
        this__9046.nil_val = null;
        this__9046.count = this__9046.count - 1;
        return tcoll__9047
      }else {
        return tcoll__9047
      }
    }else {
      if(this__9046.root == null) {
        return tcoll__9047
      }else {
        var removed_leaf_QMARK___9048 = new cljs.core.Box(false);
        var node__9049 = this__9046.root.inode_without_BANG_(this__9046.edit, 0, cljs.core.hash.call(null, k), k, removed_leaf_QMARK___9048);
        if(node__9049 === this__9046.root) {
        }else {
          this__9046.root = node__9049
        }
        if(cljs.core.truth_(removed_leaf_QMARK___9048[0])) {
          this__9046.count = this__9046.count - 1
        }else {
        }
        return tcoll__9047
      }
    }
  }else {
    throw new Error("dissoc! after persistent!");
  }
};
cljs.core.TransientHashMap.prototype.persistent_BANG_ = function() {
  var this__9050 = this;
  var tcoll__9051 = this;
  if(this__9050.edit) {
    this__9050.edit = null;
    return new cljs.core.PersistentHashMap(null, this__9050.count, this__9050.root, this__9050.has_nil_QMARK_, this__9050.nil_val, null)
  }else {
    throw new Error("persistent! called twice");
  }
};
cljs.core.TransientHashMap;
cljs.core.tree_map_seq_push = function tree_map_seq_push(node, stack, ascending_QMARK_) {
  var t__9056 = node;
  var stack__9057 = stack;
  while(true) {
    if(!(t__9056 == null)) {
      var G__9058 = ascending_QMARK_ ? t__9056.left : t__9056.right;
      var G__9059 = cljs.core.conj.call(null, stack__9057, t__9056);
      t__9056 = G__9058;
      stack__9057 = G__9059;
      continue
    }else {
      return stack__9057
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
cljs.core.PersistentTreeMapSeq.cljs$lang$ctorPrSeq = function(this__2337__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentTreeMapSeq")
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__9060 = this;
  var h__2220__auto____9061 = this__9060.__hash;
  if(!(h__2220__auto____9061 == null)) {
    return h__2220__auto____9061
  }else {
    var h__2220__auto____9062 = cljs.core.hash_coll.call(null, coll);
    this__9060.__hash = h__2220__auto____9062;
    return h__2220__auto____9062
  }
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__9063 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.PersistentTreeMapSeq.prototype.toString = function() {
  var this__9064 = this;
  var this__9065 = this;
  return cljs.core.pr_str.call(null, this__9065)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__9066 = this;
  return this$
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__9067 = this;
  if(this__9067.cnt < 0) {
    return cljs.core.count.call(null, cljs.core.next.call(null, coll)) + 1
  }else {
    return this__9067.cnt
  }
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(this$) {
  var this__9068 = this;
  return cljs.core.peek.call(null, this__9068.stack)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(this$) {
  var this__9069 = this;
  var t__9070 = cljs.core.first.call(null, this__9069.stack);
  var next_stack__9071 = cljs.core.tree_map_seq_push.call(null, this__9069.ascending_QMARK_ ? t__9070.right : t__9070.left, cljs.core.next.call(null, this__9069.stack), this__9069.ascending_QMARK_);
  if(!(next_stack__9071 == null)) {
    return new cljs.core.PersistentTreeMapSeq(null, next_stack__9071, this__9069.ascending_QMARK_, this__9069.cnt - 1, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9072 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__9073 = this;
  return new cljs.core.PersistentTreeMapSeq(meta, this__9073.stack, this__9073.ascending_QMARK_, this__9073.cnt, this__9073.__hash)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__9074 = this;
  return this__9074.meta
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
        var and__3822__auto____9076 = cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, right);
        if(and__3822__auto____9076) {
          return cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, right.left)
        }else {
          return and__3822__auto____9076
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
        var and__3822__auto____9078 = cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, left);
        if(and__3822__auto____9078) {
          return cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, left.right)
        }else {
          return and__3822__auto____9078
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
  var init__9082 = f.call(null, init, node.key, node.val);
  if(cljs.core.reduced_QMARK_.call(null, init__9082)) {
    return cljs.core.deref.call(null, init__9082)
  }else {
    var init__9083 = !(node.left == null) ? tree_map_kv_reduce.call(null, node.left, f, init__9082) : init__9082;
    if(cljs.core.reduced_QMARK_.call(null, init__9083)) {
      return cljs.core.deref.call(null, init__9083)
    }else {
      var init__9084 = !(node.right == null) ? tree_map_kv_reduce.call(null, node.right, f, init__9083) : init__9083;
      if(cljs.core.reduced_QMARK_.call(null, init__9084)) {
        return cljs.core.deref.call(null, init__9084)
      }else {
        return init__9084
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
cljs.core.BlackNode.cljs$lang$ctorPrSeq = function(this__2337__auto__) {
  return cljs.core.list.call(null, "cljs.core/BlackNode")
};
cljs.core.BlackNode.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__9087 = this;
  var h__2220__auto____9088 = this__9087.__hash;
  if(!(h__2220__auto____9088 == null)) {
    return h__2220__auto____9088
  }else {
    var h__2220__auto____9089 = cljs.core.hash_coll.call(null, coll);
    this__9087.__hash = h__2220__auto____9089;
    return h__2220__auto____9089
  }
};
cljs.core.BlackNode.prototype.cljs$core$ILookup$_lookup$arity$2 = function(node, k) {
  var this__9090 = this;
  return node.cljs$core$IIndexed$_nth$arity$3(node, k, null)
};
cljs.core.BlackNode.prototype.cljs$core$ILookup$_lookup$arity$3 = function(node, k, not_found) {
  var this__9091 = this;
  return node.cljs$core$IIndexed$_nth$arity$3(node, k, not_found)
};
cljs.core.BlackNode.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(node, k, v) {
  var this__9092 = this;
  return cljs.core.assoc.call(null, cljs.core.PersistentVector.fromArray([this__9092.key, this__9092.val], true), k, v)
};
cljs.core.BlackNode.prototype.call = function() {
  var G__9140 = null;
  var G__9140__2 = function(this_sym9093, k) {
    var this__9095 = this;
    var this_sym9093__9096 = this;
    var node__9097 = this_sym9093__9096;
    return node__9097.cljs$core$ILookup$_lookup$arity$2(node__9097, k)
  };
  var G__9140__3 = function(this_sym9094, k, not_found) {
    var this__9095 = this;
    var this_sym9094__9098 = this;
    var node__9099 = this_sym9094__9098;
    return node__9099.cljs$core$ILookup$_lookup$arity$3(node__9099, k, not_found)
  };
  G__9140 = function(this_sym9094, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9140__2.call(this, this_sym9094, k);
      case 3:
        return G__9140__3.call(this, this_sym9094, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9140
}();
cljs.core.BlackNode.prototype.apply = function(this_sym9085, args9086) {
  var this__9100 = this;
  return this_sym9085.call.apply(this_sym9085, [this_sym9085].concat(args9086.slice()))
};
cljs.core.BlackNode.prototype.cljs$core$ICollection$_conj$arity$2 = function(node, o) {
  var this__9101 = this;
  return cljs.core.PersistentVector.fromArray([this__9101.key, this__9101.val, o], true)
};
cljs.core.BlackNode.prototype.cljs$core$IMapEntry$_key$arity$1 = function(node) {
  var this__9102 = this;
  return this__9102.key
};
cljs.core.BlackNode.prototype.cljs$core$IMapEntry$_val$arity$1 = function(node) {
  var this__9103 = this;
  return this__9103.val
};
cljs.core.BlackNode.prototype.add_right = function(ins) {
  var this__9104 = this;
  var node__9105 = this;
  return ins.balance_right(node__9105)
};
cljs.core.BlackNode.prototype.redden = function() {
  var this__9106 = this;
  var node__9107 = this;
  return new cljs.core.RedNode(this__9106.key, this__9106.val, this__9106.left, this__9106.right, null)
};
cljs.core.BlackNode.prototype.remove_right = function(del) {
  var this__9108 = this;
  var node__9109 = this;
  return cljs.core.balance_right_del.call(null, this__9108.key, this__9108.val, this__9108.left, del)
};
cljs.core.BlackNode.prototype.replace = function(key, val, left, right) {
  var this__9110 = this;
  var node__9111 = this;
  return new cljs.core.BlackNode(key, val, left, right, null)
};
cljs.core.BlackNode.prototype.kv_reduce = function(f, init) {
  var this__9112 = this;
  var node__9113 = this;
  return cljs.core.tree_map_kv_reduce.call(null, node__9113, f, init)
};
cljs.core.BlackNode.prototype.remove_left = function(del) {
  var this__9114 = this;
  var node__9115 = this;
  return cljs.core.balance_left_del.call(null, this__9114.key, this__9114.val, del, this__9114.right)
};
cljs.core.BlackNode.prototype.add_left = function(ins) {
  var this__9116 = this;
  var node__9117 = this;
  return ins.balance_left(node__9117)
};
cljs.core.BlackNode.prototype.balance_left = function(parent) {
  var this__9118 = this;
  var node__9119 = this;
  return new cljs.core.BlackNode(parent.key, parent.val, node__9119, parent.right, null)
};
cljs.core.BlackNode.prototype.toString = function() {
  var G__9141 = null;
  var G__9141__0 = function() {
    var this__9120 = this;
    var this__9122 = this;
    return cljs.core.pr_str.call(null, this__9122)
  };
  G__9141 = function() {
    switch(arguments.length) {
      case 0:
        return G__9141__0.call(this)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9141
}();
cljs.core.BlackNode.prototype.balance_right = function(parent) {
  var this__9123 = this;
  var node__9124 = this;
  return new cljs.core.BlackNode(parent.key, parent.val, parent.left, node__9124, null)
};
cljs.core.BlackNode.prototype.blacken = function() {
  var this__9125 = this;
  var node__9126 = this;
  return node__9126
};
cljs.core.BlackNode.prototype.cljs$core$IReduce$_reduce$arity$2 = function(node, f) {
  var this__9127 = this;
  return cljs.core.ci_reduce.call(null, node, f)
};
cljs.core.BlackNode.prototype.cljs$core$IReduce$_reduce$arity$3 = function(node, f, start) {
  var this__9128 = this;
  return cljs.core.ci_reduce.call(null, node, f, start)
};
cljs.core.BlackNode.prototype.cljs$core$ISeqable$_seq$arity$1 = function(node) {
  var this__9129 = this;
  return cljs.core.list.call(null, this__9129.key, this__9129.val)
};
cljs.core.BlackNode.prototype.cljs$core$ICounted$_count$arity$1 = function(node) {
  var this__9130 = this;
  return 2
};
cljs.core.BlackNode.prototype.cljs$core$IStack$_peek$arity$1 = function(node) {
  var this__9131 = this;
  return this__9131.val
};
cljs.core.BlackNode.prototype.cljs$core$IStack$_pop$arity$1 = function(node) {
  var this__9132 = this;
  return cljs.core.PersistentVector.fromArray([this__9132.key], true)
};
cljs.core.BlackNode.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(node, n, v) {
  var this__9133 = this;
  return cljs.core._assoc_n.call(null, cljs.core.PersistentVector.fromArray([this__9133.key, this__9133.val], true), n, v)
};
cljs.core.BlackNode.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9134 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.BlackNode.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(node, meta) {
  var this__9135 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.fromArray([this__9135.key, this__9135.val], true), meta)
};
cljs.core.BlackNode.prototype.cljs$core$IMeta$_meta$arity$1 = function(node) {
  var this__9136 = this;
  return null
};
cljs.core.BlackNode.prototype.cljs$core$IIndexed$_nth$arity$2 = function(node, n) {
  var this__9137 = this;
  if(n === 0) {
    return this__9137.key
  }else {
    if(n === 1) {
      return this__9137.val
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
  var this__9138 = this;
  if(n === 0) {
    return this__9138.key
  }else {
    if(n === 1) {
      return this__9138.val
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
  var this__9139 = this;
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
cljs.core.RedNode.cljs$lang$ctorPrSeq = function(this__2337__auto__) {
  return cljs.core.list.call(null, "cljs.core/RedNode")
};
cljs.core.RedNode.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__9144 = this;
  var h__2220__auto____9145 = this__9144.__hash;
  if(!(h__2220__auto____9145 == null)) {
    return h__2220__auto____9145
  }else {
    var h__2220__auto____9146 = cljs.core.hash_coll.call(null, coll);
    this__9144.__hash = h__2220__auto____9146;
    return h__2220__auto____9146
  }
};
cljs.core.RedNode.prototype.cljs$core$ILookup$_lookup$arity$2 = function(node, k) {
  var this__9147 = this;
  return node.cljs$core$IIndexed$_nth$arity$3(node, k, null)
};
cljs.core.RedNode.prototype.cljs$core$ILookup$_lookup$arity$3 = function(node, k, not_found) {
  var this__9148 = this;
  return node.cljs$core$IIndexed$_nth$arity$3(node, k, not_found)
};
cljs.core.RedNode.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(node, k, v) {
  var this__9149 = this;
  return cljs.core.assoc.call(null, cljs.core.PersistentVector.fromArray([this__9149.key, this__9149.val], true), k, v)
};
cljs.core.RedNode.prototype.call = function() {
  var G__9197 = null;
  var G__9197__2 = function(this_sym9150, k) {
    var this__9152 = this;
    var this_sym9150__9153 = this;
    var node__9154 = this_sym9150__9153;
    return node__9154.cljs$core$ILookup$_lookup$arity$2(node__9154, k)
  };
  var G__9197__3 = function(this_sym9151, k, not_found) {
    var this__9152 = this;
    var this_sym9151__9155 = this;
    var node__9156 = this_sym9151__9155;
    return node__9156.cljs$core$ILookup$_lookup$arity$3(node__9156, k, not_found)
  };
  G__9197 = function(this_sym9151, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9197__2.call(this, this_sym9151, k);
      case 3:
        return G__9197__3.call(this, this_sym9151, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9197
}();
cljs.core.RedNode.prototype.apply = function(this_sym9142, args9143) {
  var this__9157 = this;
  return this_sym9142.call.apply(this_sym9142, [this_sym9142].concat(args9143.slice()))
};
cljs.core.RedNode.prototype.cljs$core$ICollection$_conj$arity$2 = function(node, o) {
  var this__9158 = this;
  return cljs.core.PersistentVector.fromArray([this__9158.key, this__9158.val, o], true)
};
cljs.core.RedNode.prototype.cljs$core$IMapEntry$_key$arity$1 = function(node) {
  var this__9159 = this;
  return this__9159.key
};
cljs.core.RedNode.prototype.cljs$core$IMapEntry$_val$arity$1 = function(node) {
  var this__9160 = this;
  return this__9160.val
};
cljs.core.RedNode.prototype.add_right = function(ins) {
  var this__9161 = this;
  var node__9162 = this;
  return new cljs.core.RedNode(this__9161.key, this__9161.val, this__9161.left, ins, null)
};
cljs.core.RedNode.prototype.redden = function() {
  var this__9163 = this;
  var node__9164 = this;
  throw new Error("red-black tree invariant violation");
};
cljs.core.RedNode.prototype.remove_right = function(del) {
  var this__9165 = this;
  var node__9166 = this;
  return new cljs.core.RedNode(this__9165.key, this__9165.val, this__9165.left, del, null)
};
cljs.core.RedNode.prototype.replace = function(key, val, left, right) {
  var this__9167 = this;
  var node__9168 = this;
  return new cljs.core.RedNode(key, val, left, right, null)
};
cljs.core.RedNode.prototype.kv_reduce = function(f, init) {
  var this__9169 = this;
  var node__9170 = this;
  return cljs.core.tree_map_kv_reduce.call(null, node__9170, f, init)
};
cljs.core.RedNode.prototype.remove_left = function(del) {
  var this__9171 = this;
  var node__9172 = this;
  return new cljs.core.RedNode(this__9171.key, this__9171.val, del, this__9171.right, null)
};
cljs.core.RedNode.prototype.add_left = function(ins) {
  var this__9173 = this;
  var node__9174 = this;
  return new cljs.core.RedNode(this__9173.key, this__9173.val, ins, this__9173.right, null)
};
cljs.core.RedNode.prototype.balance_left = function(parent) {
  var this__9175 = this;
  var node__9176 = this;
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__9175.left)) {
    return new cljs.core.RedNode(this__9175.key, this__9175.val, this__9175.left.blacken(), new cljs.core.BlackNode(parent.key, parent.val, this__9175.right, parent.right, null), null)
  }else {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__9175.right)) {
      return new cljs.core.RedNode(this__9175.right.key, this__9175.right.val, new cljs.core.BlackNode(this__9175.key, this__9175.val, this__9175.left, this__9175.right.left, null), new cljs.core.BlackNode(parent.key, parent.val, this__9175.right.right, parent.right, null), null)
    }else {
      if("\ufdd0'else") {
        return new cljs.core.BlackNode(parent.key, parent.val, node__9176, parent.right, null)
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.toString = function() {
  var G__9198 = null;
  var G__9198__0 = function() {
    var this__9177 = this;
    var this__9179 = this;
    return cljs.core.pr_str.call(null, this__9179)
  };
  G__9198 = function() {
    switch(arguments.length) {
      case 0:
        return G__9198__0.call(this)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9198
}();
cljs.core.RedNode.prototype.balance_right = function(parent) {
  var this__9180 = this;
  var node__9181 = this;
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__9180.right)) {
    return new cljs.core.RedNode(this__9180.key, this__9180.val, new cljs.core.BlackNode(parent.key, parent.val, parent.left, this__9180.left, null), this__9180.right.blacken(), null)
  }else {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__9180.left)) {
      return new cljs.core.RedNode(this__9180.left.key, this__9180.left.val, new cljs.core.BlackNode(parent.key, parent.val, parent.left, this__9180.left.left, null), new cljs.core.BlackNode(this__9180.key, this__9180.val, this__9180.left.right, this__9180.right, null), null)
    }else {
      if("\ufdd0'else") {
        return new cljs.core.BlackNode(parent.key, parent.val, parent.left, node__9181, null)
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.blacken = function() {
  var this__9182 = this;
  var node__9183 = this;
  return new cljs.core.BlackNode(this__9182.key, this__9182.val, this__9182.left, this__9182.right, null)
};
cljs.core.RedNode.prototype.cljs$core$IReduce$_reduce$arity$2 = function(node, f) {
  var this__9184 = this;
  return cljs.core.ci_reduce.call(null, node, f)
};
cljs.core.RedNode.prototype.cljs$core$IReduce$_reduce$arity$3 = function(node, f, start) {
  var this__9185 = this;
  return cljs.core.ci_reduce.call(null, node, f, start)
};
cljs.core.RedNode.prototype.cljs$core$ISeqable$_seq$arity$1 = function(node) {
  var this__9186 = this;
  return cljs.core.list.call(null, this__9186.key, this__9186.val)
};
cljs.core.RedNode.prototype.cljs$core$ICounted$_count$arity$1 = function(node) {
  var this__9187 = this;
  return 2
};
cljs.core.RedNode.prototype.cljs$core$IStack$_peek$arity$1 = function(node) {
  var this__9188 = this;
  return this__9188.val
};
cljs.core.RedNode.prototype.cljs$core$IStack$_pop$arity$1 = function(node) {
  var this__9189 = this;
  return cljs.core.PersistentVector.fromArray([this__9189.key], true)
};
cljs.core.RedNode.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(node, n, v) {
  var this__9190 = this;
  return cljs.core._assoc_n.call(null, cljs.core.PersistentVector.fromArray([this__9190.key, this__9190.val], true), n, v)
};
cljs.core.RedNode.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9191 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.RedNode.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(node, meta) {
  var this__9192 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.fromArray([this__9192.key, this__9192.val], true), meta)
};
cljs.core.RedNode.prototype.cljs$core$IMeta$_meta$arity$1 = function(node) {
  var this__9193 = this;
  return null
};
cljs.core.RedNode.prototype.cljs$core$IIndexed$_nth$arity$2 = function(node, n) {
  var this__9194 = this;
  if(n === 0) {
    return this__9194.key
  }else {
    if(n === 1) {
      return this__9194.val
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
  var this__9195 = this;
  if(n === 0) {
    return this__9195.key
  }else {
    if(n === 1) {
      return this__9195.val
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
  var this__9196 = this;
  return cljs.core.PersistentVector.EMPTY
};
cljs.core.RedNode;
cljs.core.tree_map_add = function tree_map_add(comp, tree, k, v, found) {
  if(tree == null) {
    return new cljs.core.RedNode(k, v, null, null, null)
  }else {
    var c__9202 = comp.call(null, k, tree.key);
    if(c__9202 === 0) {
      found[0] = tree;
      return null
    }else {
      if(c__9202 < 0) {
        var ins__9203 = tree_map_add.call(null, comp, tree.left, k, v, found);
        if(!(ins__9203 == null)) {
          return tree.add_left(ins__9203)
        }else {
          return null
        }
      }else {
        if("\ufdd0'else") {
          var ins__9204 = tree_map_add.call(null, comp, tree.right, k, v, found);
          if(!(ins__9204 == null)) {
            return tree.add_right(ins__9204)
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
          var app__9207 = tree_map_append.call(null, left.right, right.left);
          if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, app__9207)) {
            return new cljs.core.RedNode(app__9207.key, app__9207.val, new cljs.core.RedNode(left.key, left.val, left.left, app__9207.left, null), new cljs.core.RedNode(right.key, right.val, app__9207.right, right.right, null), null)
          }else {
            return new cljs.core.RedNode(left.key, left.val, left.left, new cljs.core.RedNode(right.key, right.val, app__9207, right.right, null), null)
          }
        }else {
          return new cljs.core.RedNode(left.key, left.val, left.left, tree_map_append.call(null, left.right, right), null)
        }
      }else {
        if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, right)) {
          return new cljs.core.RedNode(right.key, right.val, tree_map_append.call(null, left, right.left), right.right, null)
        }else {
          if("\ufdd0'else") {
            var app__9208 = tree_map_append.call(null, left.right, right.left);
            if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, app__9208)) {
              return new cljs.core.RedNode(app__9208.key, app__9208.val, new cljs.core.BlackNode(left.key, left.val, left.left, app__9208.left, null), new cljs.core.BlackNode(right.key, right.val, app__9208.right, right.right, null), null)
            }else {
              return cljs.core.balance_left_del.call(null, left.key, left.val, left.left, new cljs.core.BlackNode(right.key, right.val, app__9208, right.right, null))
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
    var c__9214 = comp.call(null, k, tree.key);
    if(c__9214 === 0) {
      found[0] = tree;
      return cljs.core.tree_map_append.call(null, tree.left, tree.right)
    }else {
      if(c__9214 < 0) {
        var del__9215 = tree_map_remove.call(null, comp, tree.left, k, found);
        if(function() {
          var or__3824__auto____9216 = !(del__9215 == null);
          if(or__3824__auto____9216) {
            return or__3824__auto____9216
          }else {
            return!(found[0] == null)
          }
        }()) {
          if(cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, tree.left)) {
            return cljs.core.balance_left_del.call(null, tree.key, tree.val, del__9215, tree.right)
          }else {
            return new cljs.core.RedNode(tree.key, tree.val, del__9215, tree.right, null)
          }
        }else {
          return null
        }
      }else {
        if("\ufdd0'else") {
          var del__9217 = tree_map_remove.call(null, comp, tree.right, k, found);
          if(function() {
            var or__3824__auto____9218 = !(del__9217 == null);
            if(or__3824__auto____9218) {
              return or__3824__auto____9218
            }else {
              return!(found[0] == null)
            }
          }()) {
            if(cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, tree.right)) {
              return cljs.core.balance_right_del.call(null, tree.key, tree.val, tree.left, del__9217)
            }else {
              return new cljs.core.RedNode(tree.key, tree.val, tree.left, del__9217, null)
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
  var tk__9221 = tree.key;
  var c__9222 = comp.call(null, k, tk__9221);
  if(c__9222 === 0) {
    return tree.replace(tk__9221, v, tree.left, tree.right)
  }else {
    if(c__9222 < 0) {
      return tree.replace(tk__9221, tree.val, tree_map_replace.call(null, comp, tree.left, k, v), tree.right)
    }else {
      if("\ufdd0'else") {
        return tree.replace(tk__9221, tree.val, tree.left, tree_map_replace.call(null, comp, tree.right, k, v))
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
cljs.core.PersistentTreeMap.cljs$lang$ctorPrSeq = function(this__2337__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentTreeMap")
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__9225 = this;
  var h__2220__auto____9226 = this__9225.__hash;
  if(!(h__2220__auto____9226 == null)) {
    return h__2220__auto____9226
  }else {
    var h__2220__auto____9227 = cljs.core.hash_imap.call(null, coll);
    this__9225.__hash = h__2220__auto____9227;
    return h__2220__auto____9227
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__9228 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__9229 = this;
  var n__9230 = coll.entry_at(k);
  if(!(n__9230 == null)) {
    return n__9230.val
  }else {
    return not_found
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__9231 = this;
  var found__9232 = [null];
  var t__9233 = cljs.core.tree_map_add.call(null, this__9231.comp, this__9231.tree, k, v, found__9232);
  if(t__9233 == null) {
    var found_node__9234 = cljs.core.nth.call(null, found__9232, 0);
    if(cljs.core._EQ_.call(null, v, found_node__9234.val)) {
      return coll
    }else {
      return new cljs.core.PersistentTreeMap(this__9231.comp, cljs.core.tree_map_replace.call(null, this__9231.comp, this__9231.tree, k, v), this__9231.cnt, this__9231.meta, null)
    }
  }else {
    return new cljs.core.PersistentTreeMap(this__9231.comp, t__9233.blacken(), this__9231.cnt + 1, this__9231.meta, null)
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__9235 = this;
  return!(coll.entry_at(k) == null)
};
cljs.core.PersistentTreeMap.prototype.call = function() {
  var G__9269 = null;
  var G__9269__2 = function(this_sym9236, k) {
    var this__9238 = this;
    var this_sym9236__9239 = this;
    var coll__9240 = this_sym9236__9239;
    return coll__9240.cljs$core$ILookup$_lookup$arity$2(coll__9240, k)
  };
  var G__9269__3 = function(this_sym9237, k, not_found) {
    var this__9238 = this;
    var this_sym9237__9241 = this;
    var coll__9242 = this_sym9237__9241;
    return coll__9242.cljs$core$ILookup$_lookup$arity$3(coll__9242, k, not_found)
  };
  G__9269 = function(this_sym9237, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9269__2.call(this, this_sym9237, k);
      case 3:
        return G__9269__3.call(this, this_sym9237, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9269
}();
cljs.core.PersistentTreeMap.prototype.apply = function(this_sym9223, args9224) {
  var this__9243 = this;
  return this_sym9223.call.apply(this_sym9223, [this_sym9223].concat(args9224.slice()))
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(coll, f, init) {
  var this__9244 = this;
  if(!(this__9244.tree == null)) {
    return cljs.core.tree_map_kv_reduce.call(null, this__9244.tree, f, init)
  }else {
    return init
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__9245 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__9246 = this;
  if(this__9246.cnt > 0) {
    return cljs.core.create_tree_map_seq.call(null, this__9246.tree, false, this__9246.cnt)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.toString = function() {
  var this__9247 = this;
  var this__9248 = this;
  return cljs.core.pr_str.call(null, this__9248)
};
cljs.core.PersistentTreeMap.prototype.entry_at = function(k) {
  var this__9249 = this;
  var coll__9250 = this;
  var t__9251 = this__9249.tree;
  while(true) {
    if(!(t__9251 == null)) {
      var c__9252 = this__9249.comp.call(null, k, t__9251.key);
      if(c__9252 === 0) {
        return t__9251
      }else {
        if(c__9252 < 0) {
          var G__9270 = t__9251.left;
          t__9251 = G__9270;
          continue
        }else {
          if("\ufdd0'else") {
            var G__9271 = t__9251.right;
            t__9251 = G__9271;
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
  var this__9253 = this;
  if(this__9253.cnt > 0) {
    return cljs.core.create_tree_map_seq.call(null, this__9253.tree, ascending_QMARK_, this__9253.cnt)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_sorted_seq_from$arity$3 = function(coll, k, ascending_QMARK_) {
  var this__9254 = this;
  if(this__9254.cnt > 0) {
    var stack__9255 = null;
    var t__9256 = this__9254.tree;
    while(true) {
      if(!(t__9256 == null)) {
        var c__9257 = this__9254.comp.call(null, k, t__9256.key);
        if(c__9257 === 0) {
          return new cljs.core.PersistentTreeMapSeq(null, cljs.core.conj.call(null, stack__9255, t__9256), ascending_QMARK_, -1, null)
        }else {
          if(cljs.core.truth_(ascending_QMARK_)) {
            if(c__9257 < 0) {
              var G__9272 = cljs.core.conj.call(null, stack__9255, t__9256);
              var G__9273 = t__9256.left;
              stack__9255 = G__9272;
              t__9256 = G__9273;
              continue
            }else {
              var G__9274 = stack__9255;
              var G__9275 = t__9256.right;
              stack__9255 = G__9274;
              t__9256 = G__9275;
              continue
            }
          }else {
            if("\ufdd0'else") {
              if(c__9257 > 0) {
                var G__9276 = cljs.core.conj.call(null, stack__9255, t__9256);
                var G__9277 = t__9256.right;
                stack__9255 = G__9276;
                t__9256 = G__9277;
                continue
              }else {
                var G__9278 = stack__9255;
                var G__9279 = t__9256.left;
                stack__9255 = G__9278;
                t__9256 = G__9279;
                continue
              }
            }else {
              return null
            }
          }
        }
      }else {
        if(stack__9255 == null) {
          return new cljs.core.PersistentTreeMapSeq(null, stack__9255, ascending_QMARK_, -1, null)
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
  var this__9258 = this;
  return cljs.core.key.call(null, entry)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_comparator$arity$1 = function(coll) {
  var this__9259 = this;
  return this__9259.comp
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__9260 = this;
  if(this__9260.cnt > 0) {
    return cljs.core.create_tree_map_seq.call(null, this__9260.tree, true, this__9260.cnt)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__9261 = this;
  return this__9261.cnt
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9262 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__9263 = this;
  return new cljs.core.PersistentTreeMap(this__9263.comp, this__9263.tree, this__9263.cnt, meta, this__9263.__hash)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__9264 = this;
  return this__9264.meta
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__9265 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentTreeMap.EMPTY, this__9265.meta)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__9266 = this;
  var found__9267 = [null];
  var t__9268 = cljs.core.tree_map_remove.call(null, this__9266.comp, this__9266.tree, k, found__9267);
  if(t__9268 == null) {
    if(cljs.core.nth.call(null, found__9267, 0) == null) {
      return coll
    }else {
      return new cljs.core.PersistentTreeMap(this__9266.comp, null, 0, this__9266.meta, null)
    }
  }else {
    return new cljs.core.PersistentTreeMap(this__9266.comp, t__9268.blacken(), this__9266.cnt - 1, this__9266.meta, null)
  }
};
cljs.core.PersistentTreeMap;
cljs.core.PersistentTreeMap.EMPTY = new cljs.core.PersistentTreeMap(cljs.core.compare, null, 0, null, 0);
cljs.core.hash_map = function() {
  var hash_map__delegate = function(keyvals) {
    var in__9282 = cljs.core.seq.call(null, keyvals);
    var out__9283 = cljs.core.transient$.call(null, cljs.core.PersistentHashMap.EMPTY);
    while(true) {
      if(in__9282) {
        var G__9284 = cljs.core.nnext.call(null, in__9282);
        var G__9285 = cljs.core.assoc_BANG_.call(null, out__9283, cljs.core.first.call(null, in__9282), cljs.core.second.call(null, in__9282));
        in__9282 = G__9284;
        out__9283 = G__9285;
        continue
      }else {
        return cljs.core.persistent_BANG_.call(null, out__9283)
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
  hash_map.cljs$lang$applyTo = function(arglist__9286) {
    var keyvals = cljs.core.seq(arglist__9286);
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
  array_map.cljs$lang$applyTo = function(arglist__9287) {
    var keyvals = cljs.core.seq(arglist__9287);
    return array_map__delegate(keyvals)
  };
  array_map.cljs$lang$arity$variadic = array_map__delegate;
  return array_map
}();
cljs.core.obj_map = function() {
  var obj_map__delegate = function(keyvals) {
    var ks__9291 = [];
    var obj__9292 = {};
    var kvs__9293 = cljs.core.seq.call(null, keyvals);
    while(true) {
      if(kvs__9293) {
        ks__9291.push(cljs.core.first.call(null, kvs__9293));
        obj__9292[cljs.core.first.call(null, kvs__9293)] = cljs.core.second.call(null, kvs__9293);
        var G__9294 = cljs.core.nnext.call(null, kvs__9293);
        kvs__9293 = G__9294;
        continue
      }else {
        return cljs.core.ObjMap.fromObject.call(null, ks__9291, obj__9292)
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
  obj_map.cljs$lang$applyTo = function(arglist__9295) {
    var keyvals = cljs.core.seq(arglist__9295);
    return obj_map__delegate(keyvals)
  };
  obj_map.cljs$lang$arity$variadic = obj_map__delegate;
  return obj_map
}();
cljs.core.sorted_map = function() {
  var sorted_map__delegate = function(keyvals) {
    var in__9298 = cljs.core.seq.call(null, keyvals);
    var out__9299 = cljs.core.PersistentTreeMap.EMPTY;
    while(true) {
      if(in__9298) {
        var G__9300 = cljs.core.nnext.call(null, in__9298);
        var G__9301 = cljs.core.assoc.call(null, out__9299, cljs.core.first.call(null, in__9298), cljs.core.second.call(null, in__9298));
        in__9298 = G__9300;
        out__9299 = G__9301;
        continue
      }else {
        return out__9299
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
  sorted_map.cljs$lang$applyTo = function(arglist__9302) {
    var keyvals = cljs.core.seq(arglist__9302);
    return sorted_map__delegate(keyvals)
  };
  sorted_map.cljs$lang$arity$variadic = sorted_map__delegate;
  return sorted_map
}();
cljs.core.sorted_map_by = function() {
  var sorted_map_by__delegate = function(comparator, keyvals) {
    var in__9305 = cljs.core.seq.call(null, keyvals);
    var out__9306 = new cljs.core.PersistentTreeMap(comparator, null, 0, null, 0);
    while(true) {
      if(in__9305) {
        var G__9307 = cljs.core.nnext.call(null, in__9305);
        var G__9308 = cljs.core.assoc.call(null, out__9306, cljs.core.first.call(null, in__9305), cljs.core.second.call(null, in__9305));
        in__9305 = G__9307;
        out__9306 = G__9308;
        continue
      }else {
        return out__9306
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
  sorted_map_by.cljs$lang$applyTo = function(arglist__9309) {
    var comparator = cljs.core.first(arglist__9309);
    var keyvals = cljs.core.rest(arglist__9309);
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
      return cljs.core.reduce.call(null, function(p1__9310_SHARP_, p2__9311_SHARP_) {
        return cljs.core.conj.call(null, function() {
          var or__3824__auto____9313 = p1__9310_SHARP_;
          if(cljs.core.truth_(or__3824__auto____9313)) {
            return or__3824__auto____9313
          }else {
            return cljs.core.ObjMap.EMPTY
          }
        }(), p2__9311_SHARP_)
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
  merge.cljs$lang$applyTo = function(arglist__9314) {
    var maps = cljs.core.seq(arglist__9314);
    return merge__delegate(maps)
  };
  merge.cljs$lang$arity$variadic = merge__delegate;
  return merge
}();
cljs.core.merge_with = function() {
  var merge_with__delegate = function(f, maps) {
    if(cljs.core.truth_(cljs.core.some.call(null, cljs.core.identity, maps))) {
      var merge_entry__9322 = function(m, e) {
        var k__9320 = cljs.core.first.call(null, e);
        var v__9321 = cljs.core.second.call(null, e);
        if(cljs.core.contains_QMARK_.call(null, m, k__9320)) {
          return cljs.core.assoc.call(null, m, k__9320, f.call(null, cljs.core._lookup.call(null, m, k__9320, null), v__9321))
        }else {
          return cljs.core.assoc.call(null, m, k__9320, v__9321)
        }
      };
      var merge2__9324 = function(m1, m2) {
        return cljs.core.reduce.call(null, merge_entry__9322, function() {
          var or__3824__auto____9323 = m1;
          if(cljs.core.truth_(or__3824__auto____9323)) {
            return or__3824__auto____9323
          }else {
            return cljs.core.ObjMap.EMPTY
          }
        }(), cljs.core.seq.call(null, m2))
      };
      return cljs.core.reduce.call(null, merge2__9324, maps)
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
  merge_with.cljs$lang$applyTo = function(arglist__9325) {
    var f = cljs.core.first(arglist__9325);
    var maps = cljs.core.rest(arglist__9325);
    return merge_with__delegate(f, maps)
  };
  merge_with.cljs$lang$arity$variadic = merge_with__delegate;
  return merge_with
}();
cljs.core.select_keys = function select_keys(map, keyseq) {
  var ret__9330 = cljs.core.ObjMap.EMPTY;
  var keys__9331 = cljs.core.seq.call(null, keyseq);
  while(true) {
    if(keys__9331) {
      var key__9332 = cljs.core.first.call(null, keys__9331);
      var entry__9333 = cljs.core._lookup.call(null, map, key__9332, "\ufdd0'cljs.core/not-found");
      var G__9334 = cljs.core.not_EQ_.call(null, entry__9333, "\ufdd0'cljs.core/not-found") ? cljs.core.assoc.call(null, ret__9330, key__9332, entry__9333) : ret__9330;
      var G__9335 = cljs.core.next.call(null, keys__9331);
      ret__9330 = G__9334;
      keys__9331 = G__9335;
      continue
    }else {
      return ret__9330
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
cljs.core.PersistentHashSet.cljs$lang$ctorPrSeq = function(this__2337__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentHashSet")
};
cljs.core.PersistentHashSet.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var this__9339 = this;
  return new cljs.core.TransientHashSet(cljs.core.transient$.call(null, this__9339.hash_map))
};
cljs.core.PersistentHashSet.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__9340 = this;
  var h__2220__auto____9341 = this__9340.__hash;
  if(!(h__2220__auto____9341 == null)) {
    return h__2220__auto____9341
  }else {
    var h__2220__auto____9342 = cljs.core.hash_iset.call(null, coll);
    this__9340.__hash = h__2220__auto____9342;
    return h__2220__auto____9342
  }
};
cljs.core.PersistentHashSet.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, v) {
  var this__9343 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, v, null)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, v, not_found) {
  var this__9344 = this;
  if(cljs.core.truth_(cljs.core._contains_key_QMARK_.call(null, this__9344.hash_map, v))) {
    return v
  }else {
    return not_found
  }
};
cljs.core.PersistentHashSet.prototype.call = function() {
  var G__9365 = null;
  var G__9365__2 = function(this_sym9345, k) {
    var this__9347 = this;
    var this_sym9345__9348 = this;
    var coll__9349 = this_sym9345__9348;
    return coll__9349.cljs$core$ILookup$_lookup$arity$2(coll__9349, k)
  };
  var G__9365__3 = function(this_sym9346, k, not_found) {
    var this__9347 = this;
    var this_sym9346__9350 = this;
    var coll__9351 = this_sym9346__9350;
    return coll__9351.cljs$core$ILookup$_lookup$arity$3(coll__9351, k, not_found)
  };
  G__9365 = function(this_sym9346, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9365__2.call(this, this_sym9346, k);
      case 3:
        return G__9365__3.call(this, this_sym9346, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9365
}();
cljs.core.PersistentHashSet.prototype.apply = function(this_sym9337, args9338) {
  var this__9352 = this;
  return this_sym9337.call.apply(this_sym9337, [this_sym9337].concat(args9338.slice()))
};
cljs.core.PersistentHashSet.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__9353 = this;
  return new cljs.core.PersistentHashSet(this__9353.meta, cljs.core.assoc.call(null, this__9353.hash_map, o, null), null)
};
cljs.core.PersistentHashSet.prototype.toString = function() {
  var this__9354 = this;
  var this__9355 = this;
  return cljs.core.pr_str.call(null, this__9355)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__9356 = this;
  return cljs.core.keys.call(null, this__9356.hash_map)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ISet$_disjoin$arity$2 = function(coll, v) {
  var this__9357 = this;
  return new cljs.core.PersistentHashSet(this__9357.meta, cljs.core.dissoc.call(null, this__9357.hash_map, v), null)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__9358 = this;
  return cljs.core.count.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.PersistentHashSet.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9359 = this;
  var and__3822__auto____9360 = cljs.core.set_QMARK_.call(null, other);
  if(and__3822__auto____9360) {
    var and__3822__auto____9361 = cljs.core.count.call(null, coll) === cljs.core.count.call(null, other);
    if(and__3822__auto____9361) {
      return cljs.core.every_QMARK_.call(null, function(p1__9336_SHARP_) {
        return cljs.core.contains_QMARK_.call(null, coll, p1__9336_SHARP_)
      }, other)
    }else {
      return and__3822__auto____9361
    }
  }else {
    return and__3822__auto____9360
  }
};
cljs.core.PersistentHashSet.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__9362 = this;
  return new cljs.core.PersistentHashSet(meta, this__9362.hash_map, this__9362.__hash)
};
cljs.core.PersistentHashSet.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__9363 = this;
  return this__9363.meta
};
cljs.core.PersistentHashSet.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__9364 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentHashSet.EMPTY, this__9364.meta)
};
cljs.core.PersistentHashSet;
cljs.core.PersistentHashSet.EMPTY = new cljs.core.PersistentHashSet(null, cljs.core.hash_map.call(null), 0);
cljs.core.PersistentHashSet.fromArray = function(items) {
  var len__9366 = cljs.core.count.call(null, items);
  var i__9367 = 0;
  var out__9368 = cljs.core.transient$.call(null, cljs.core.PersistentHashSet.EMPTY);
  while(true) {
    if(i__9367 < len__9366) {
      var G__9369 = i__9367 + 1;
      var G__9370 = cljs.core.conj_BANG_.call(null, out__9368, items[i__9367]);
      i__9367 = G__9369;
      out__9368 = G__9370;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, out__9368)
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
cljs.core.TransientHashSet.cljs$lang$ctorPrSeq = function(this__2337__auto__) {
  return cljs.core.list.call(null, "cljs.core/TransientHashSet")
};
cljs.core.TransientHashSet.prototype.call = function() {
  var G__9388 = null;
  var G__9388__2 = function(this_sym9374, k) {
    var this__9376 = this;
    var this_sym9374__9377 = this;
    var tcoll__9378 = this_sym9374__9377;
    if(cljs.core._lookup.call(null, this__9376.transient_map, k, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
      return null
    }else {
      return k
    }
  };
  var G__9388__3 = function(this_sym9375, k, not_found) {
    var this__9376 = this;
    var this_sym9375__9379 = this;
    var tcoll__9380 = this_sym9375__9379;
    if(cljs.core._lookup.call(null, this__9376.transient_map, k, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
      return not_found
    }else {
      return k
    }
  };
  G__9388 = function(this_sym9375, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9388__2.call(this, this_sym9375, k);
      case 3:
        return G__9388__3.call(this, this_sym9375, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9388
}();
cljs.core.TransientHashSet.prototype.apply = function(this_sym9372, args9373) {
  var this__9381 = this;
  return this_sym9372.call.apply(this_sym9372, [this_sym9372].concat(args9373.slice()))
};
cljs.core.TransientHashSet.prototype.cljs$core$ILookup$_lookup$arity$2 = function(tcoll, v) {
  var this__9382 = this;
  return tcoll.cljs$core$ILookup$_lookup$arity$3(tcoll, v, null)
};
cljs.core.TransientHashSet.prototype.cljs$core$ILookup$_lookup$arity$3 = function(tcoll, v, not_found) {
  var this__9383 = this;
  if(cljs.core._lookup.call(null, this__9383.transient_map, v, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
    return not_found
  }else {
    return v
  }
};
cljs.core.TransientHashSet.prototype.cljs$core$ICounted$_count$arity$1 = function(tcoll) {
  var this__9384 = this;
  return cljs.core.count.call(null, this__9384.transient_map)
};
cljs.core.TransientHashSet.prototype.cljs$core$ITransientSet$_disjoin_BANG_$arity$2 = function(tcoll, v) {
  var this__9385 = this;
  this__9385.transient_map = cljs.core.dissoc_BANG_.call(null, this__9385.transient_map, v);
  return tcoll
};
cljs.core.TransientHashSet.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, o) {
  var this__9386 = this;
  this__9386.transient_map = cljs.core.assoc_BANG_.call(null, this__9386.transient_map, o, null);
  return tcoll
};
cljs.core.TransientHashSet.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__9387 = this;
  return new cljs.core.PersistentHashSet(null, cljs.core.persistent_BANG_.call(null, this__9387.transient_map), null)
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
cljs.core.PersistentTreeSet.cljs$lang$ctorPrSeq = function(this__2337__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentTreeSet")
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__9391 = this;
  var h__2220__auto____9392 = this__9391.__hash;
  if(!(h__2220__auto____9392 == null)) {
    return h__2220__auto____9392
  }else {
    var h__2220__auto____9393 = cljs.core.hash_iset.call(null, coll);
    this__9391.__hash = h__2220__auto____9393;
    return h__2220__auto____9393
  }
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, v) {
  var this__9394 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, v, null)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, v, not_found) {
  var this__9395 = this;
  if(cljs.core.truth_(cljs.core._contains_key_QMARK_.call(null, this__9395.tree_map, v))) {
    return v
  }else {
    return not_found
  }
};
cljs.core.PersistentTreeSet.prototype.call = function() {
  var G__9421 = null;
  var G__9421__2 = function(this_sym9396, k) {
    var this__9398 = this;
    var this_sym9396__9399 = this;
    var coll__9400 = this_sym9396__9399;
    return coll__9400.cljs$core$ILookup$_lookup$arity$2(coll__9400, k)
  };
  var G__9421__3 = function(this_sym9397, k, not_found) {
    var this__9398 = this;
    var this_sym9397__9401 = this;
    var coll__9402 = this_sym9397__9401;
    return coll__9402.cljs$core$ILookup$_lookup$arity$3(coll__9402, k, not_found)
  };
  G__9421 = function(this_sym9397, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9421__2.call(this, this_sym9397, k);
      case 3:
        return G__9421__3.call(this, this_sym9397, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9421
}();
cljs.core.PersistentTreeSet.prototype.apply = function(this_sym9389, args9390) {
  var this__9403 = this;
  return this_sym9389.call.apply(this_sym9389, [this_sym9389].concat(args9390.slice()))
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__9404 = this;
  return new cljs.core.PersistentTreeSet(this__9404.meta, cljs.core.assoc.call(null, this__9404.tree_map, o, null), null)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__9405 = this;
  return cljs.core.map.call(null, cljs.core.key, cljs.core.rseq.call(null, this__9405.tree_map))
};
cljs.core.PersistentTreeSet.prototype.toString = function() {
  var this__9406 = this;
  var this__9407 = this;
  return cljs.core.pr_str.call(null, this__9407)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_sorted_seq$arity$2 = function(coll, ascending_QMARK_) {
  var this__9408 = this;
  return cljs.core.map.call(null, cljs.core.key, cljs.core._sorted_seq.call(null, this__9408.tree_map, ascending_QMARK_))
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_sorted_seq_from$arity$3 = function(coll, k, ascending_QMARK_) {
  var this__9409 = this;
  return cljs.core.map.call(null, cljs.core.key, cljs.core._sorted_seq_from.call(null, this__9409.tree_map, k, ascending_QMARK_))
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_entry_key$arity$2 = function(coll, entry) {
  var this__9410 = this;
  return entry
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_comparator$arity$1 = function(coll) {
  var this__9411 = this;
  return cljs.core._comparator.call(null, this__9411.tree_map)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__9412 = this;
  return cljs.core.keys.call(null, this__9412.tree_map)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISet$_disjoin$arity$2 = function(coll, v) {
  var this__9413 = this;
  return new cljs.core.PersistentTreeSet(this__9413.meta, cljs.core.dissoc.call(null, this__9413.tree_map, v), null)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__9414 = this;
  return cljs.core.count.call(null, this__9414.tree_map)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9415 = this;
  var and__3822__auto____9416 = cljs.core.set_QMARK_.call(null, other);
  if(and__3822__auto____9416) {
    var and__3822__auto____9417 = cljs.core.count.call(null, coll) === cljs.core.count.call(null, other);
    if(and__3822__auto____9417) {
      return cljs.core.every_QMARK_.call(null, function(p1__9371_SHARP_) {
        return cljs.core.contains_QMARK_.call(null, coll, p1__9371_SHARP_)
      }, other)
    }else {
      return and__3822__auto____9417
    }
  }else {
    return and__3822__auto____9416
  }
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__9418 = this;
  return new cljs.core.PersistentTreeSet(meta, this__9418.tree_map, this__9418.__hash)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__9419 = this;
  return this__9419.meta
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__9420 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentTreeSet.EMPTY, this__9420.meta)
};
cljs.core.PersistentTreeSet;
cljs.core.PersistentTreeSet.EMPTY = new cljs.core.PersistentTreeSet(null, cljs.core.sorted_map.call(null), 0);
cljs.core.hash_set = function() {
  var hash_set = null;
  var hash_set__0 = function() {
    return cljs.core.PersistentHashSet.EMPTY
  };
  var hash_set__1 = function() {
    var G__9426__delegate = function(keys) {
      var in__9424 = cljs.core.seq.call(null, keys);
      var out__9425 = cljs.core.transient$.call(null, cljs.core.PersistentHashSet.EMPTY);
      while(true) {
        if(cljs.core.seq.call(null, in__9424)) {
          var G__9427 = cljs.core.next.call(null, in__9424);
          var G__9428 = cljs.core.conj_BANG_.call(null, out__9425, cljs.core.first.call(null, in__9424));
          in__9424 = G__9427;
          out__9425 = G__9428;
          continue
        }else {
          return cljs.core.persistent_BANG_.call(null, out__9425)
        }
        break
      }
    };
    var G__9426 = function(var_args) {
      var keys = null;
      if(goog.isDef(var_args)) {
        keys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__9426__delegate.call(this, keys)
    };
    G__9426.cljs$lang$maxFixedArity = 0;
    G__9426.cljs$lang$applyTo = function(arglist__9429) {
      var keys = cljs.core.seq(arglist__9429);
      return G__9426__delegate(keys)
    };
    G__9426.cljs$lang$arity$variadic = G__9426__delegate;
    return G__9426
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
  sorted_set.cljs$lang$applyTo = function(arglist__9430) {
    var keys = cljs.core.seq(arglist__9430);
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
  sorted_set_by.cljs$lang$applyTo = function(arglist__9432) {
    var comparator = cljs.core.first(arglist__9432);
    var keys = cljs.core.rest(arglist__9432);
    return sorted_set_by__delegate(comparator, keys)
  };
  sorted_set_by.cljs$lang$arity$variadic = sorted_set_by__delegate;
  return sorted_set_by
}();
cljs.core.replace = function replace(smap, coll) {
  if(cljs.core.vector_QMARK_.call(null, coll)) {
    var n__9438 = cljs.core.count.call(null, coll);
    return cljs.core.reduce.call(null, function(v, i) {
      var temp__3971__auto____9439 = cljs.core.find.call(null, smap, cljs.core.nth.call(null, v, i));
      if(cljs.core.truth_(temp__3971__auto____9439)) {
        var e__9440 = temp__3971__auto____9439;
        return cljs.core.assoc.call(null, v, i, cljs.core.second.call(null, e__9440))
      }else {
        return v
      }
    }, coll, cljs.core.take.call(null, n__9438, cljs.core.iterate.call(null, cljs.core.inc, 0)))
  }else {
    return cljs.core.map.call(null, function(p1__9431_SHARP_) {
      var temp__3971__auto____9441 = cljs.core.find.call(null, smap, p1__9431_SHARP_);
      if(cljs.core.truth_(temp__3971__auto____9441)) {
        var e__9442 = temp__3971__auto____9441;
        return cljs.core.second.call(null, e__9442)
      }else {
        return p1__9431_SHARP_
      }
    }, coll)
  }
};
cljs.core.distinct = function distinct(coll) {
  var step__9472 = function step(xs, seen) {
    return new cljs.core.LazySeq(null, false, function() {
      return function(p__9465, seen) {
        while(true) {
          var vec__9466__9467 = p__9465;
          var f__9468 = cljs.core.nth.call(null, vec__9466__9467, 0, null);
          var xs__9469 = vec__9466__9467;
          var temp__3974__auto____9470 = cljs.core.seq.call(null, xs__9469);
          if(temp__3974__auto____9470) {
            var s__9471 = temp__3974__auto____9470;
            if(cljs.core.contains_QMARK_.call(null, seen, f__9468)) {
              var G__9473 = cljs.core.rest.call(null, s__9471);
              var G__9474 = seen;
              p__9465 = G__9473;
              seen = G__9474;
              continue
            }else {
              return cljs.core.cons.call(null, f__9468, step.call(null, cljs.core.rest.call(null, s__9471), cljs.core.conj.call(null, seen, f__9468)))
            }
          }else {
            return null
          }
          break
        }
      }.call(null, xs, seen)
    }, null)
  };
  return step__9472.call(null, coll, cljs.core.PersistentHashSet.EMPTY)
};
cljs.core.butlast = function butlast(s) {
  var ret__9477 = cljs.core.PersistentVector.EMPTY;
  var s__9478 = s;
  while(true) {
    if(cljs.core.next.call(null, s__9478)) {
      var G__9479 = cljs.core.conj.call(null, ret__9477, cljs.core.first.call(null, s__9478));
      var G__9480 = cljs.core.next.call(null, s__9478);
      ret__9477 = G__9479;
      s__9478 = G__9480;
      continue
    }else {
      return cljs.core.seq.call(null, ret__9477)
    }
    break
  }
};
cljs.core.name = function name(x) {
  if(cljs.core.string_QMARK_.call(null, x)) {
    return x
  }else {
    if(function() {
      var or__3824__auto____9483 = cljs.core.keyword_QMARK_.call(null, x);
      if(or__3824__auto____9483) {
        return or__3824__auto____9483
      }else {
        return cljs.core.symbol_QMARK_.call(null, x)
      }
    }()) {
      var i__9484 = x.lastIndexOf("/");
      if(i__9484 < 0) {
        return cljs.core.subs.call(null, x, 2)
      }else {
        return cljs.core.subs.call(null, x, i__9484 + 1)
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
    var or__3824__auto____9487 = cljs.core.keyword_QMARK_.call(null, x);
    if(or__3824__auto____9487) {
      return or__3824__auto____9487
    }else {
      return cljs.core.symbol_QMARK_.call(null, x)
    }
  }()) {
    var i__9488 = x.lastIndexOf("/");
    if(i__9488 > -1) {
      return cljs.core.subs.call(null, x, 2, i__9488)
    }else {
      return null
    }
  }else {
    throw new Error([cljs.core.str("Doesn't support namespace: "), cljs.core.str(x)].join(""));
  }
};
cljs.core.zipmap = function zipmap(keys, vals) {
  var map__9495 = cljs.core.ObjMap.EMPTY;
  var ks__9496 = cljs.core.seq.call(null, keys);
  var vs__9497 = cljs.core.seq.call(null, vals);
  while(true) {
    if(function() {
      var and__3822__auto____9498 = ks__9496;
      if(and__3822__auto____9498) {
        return vs__9497
      }else {
        return and__3822__auto____9498
      }
    }()) {
      var G__9499 = cljs.core.assoc.call(null, map__9495, cljs.core.first.call(null, ks__9496), cljs.core.first.call(null, vs__9497));
      var G__9500 = cljs.core.next.call(null, ks__9496);
      var G__9501 = cljs.core.next.call(null, vs__9497);
      map__9495 = G__9499;
      ks__9496 = G__9500;
      vs__9497 = G__9501;
      continue
    }else {
      return map__9495
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
    var G__9504__delegate = function(k, x, y, more) {
      return cljs.core.reduce.call(null, function(p1__9489_SHARP_, p2__9490_SHARP_) {
        return max_key.call(null, k, p1__9489_SHARP_, p2__9490_SHARP_)
      }, max_key.call(null, k, x, y), more)
    };
    var G__9504 = function(k, x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__9504__delegate.call(this, k, x, y, more)
    };
    G__9504.cljs$lang$maxFixedArity = 3;
    G__9504.cljs$lang$applyTo = function(arglist__9505) {
      var k = cljs.core.first(arglist__9505);
      var x = cljs.core.first(cljs.core.next(arglist__9505));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9505)));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9505)));
      return G__9504__delegate(k, x, y, more)
    };
    G__9504.cljs$lang$arity$variadic = G__9504__delegate;
    return G__9504
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
    var G__9506__delegate = function(k, x, y, more) {
      return cljs.core.reduce.call(null, function(p1__9502_SHARP_, p2__9503_SHARP_) {
        return min_key.call(null, k, p1__9502_SHARP_, p2__9503_SHARP_)
      }, min_key.call(null, k, x, y), more)
    };
    var G__9506 = function(k, x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__9506__delegate.call(this, k, x, y, more)
    };
    G__9506.cljs$lang$maxFixedArity = 3;
    G__9506.cljs$lang$applyTo = function(arglist__9507) {
      var k = cljs.core.first(arglist__9507);
      var x = cljs.core.first(cljs.core.next(arglist__9507));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9507)));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9507)));
      return G__9506__delegate(k, x, y, more)
    };
    G__9506.cljs$lang$arity$variadic = G__9506__delegate;
    return G__9506
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
      var temp__3974__auto____9510 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____9510) {
        var s__9511 = temp__3974__auto____9510;
        return cljs.core.cons.call(null, cljs.core.take.call(null, n, s__9511), partition_all.call(null, n, step, cljs.core.drop.call(null, step, s__9511)))
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
    var temp__3974__auto____9514 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____9514) {
      var s__9515 = temp__3974__auto____9514;
      if(cljs.core.truth_(pred.call(null, cljs.core.first.call(null, s__9515)))) {
        return cljs.core.cons.call(null, cljs.core.first.call(null, s__9515), take_while.call(null, pred, cljs.core.rest.call(null, s__9515)))
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
    var comp__9517 = cljs.core._comparator.call(null, sc);
    return test.call(null, comp__9517.call(null, cljs.core._entry_key.call(null, sc, e), key), 0)
  }
};
cljs.core.subseq = function() {
  var subseq = null;
  var subseq__3 = function(sc, test, key) {
    var include__9529 = cljs.core.mk_bound_fn.call(null, sc, test, key);
    if(cljs.core.truth_(cljs.core.PersistentHashSet.fromArray([cljs.core._GT_, cljs.core._GT__EQ_]).call(null, test))) {
      var temp__3974__auto____9530 = cljs.core._sorted_seq_from.call(null, sc, key, true);
      if(cljs.core.truth_(temp__3974__auto____9530)) {
        var vec__9531__9532 = temp__3974__auto____9530;
        var e__9533 = cljs.core.nth.call(null, vec__9531__9532, 0, null);
        var s__9534 = vec__9531__9532;
        if(cljs.core.truth_(include__9529.call(null, e__9533))) {
          return s__9534
        }else {
          return cljs.core.next.call(null, s__9534)
        }
      }else {
        return null
      }
    }else {
      return cljs.core.take_while.call(null, include__9529, cljs.core._sorted_seq.call(null, sc, true))
    }
  };
  var subseq__5 = function(sc, start_test, start_key, end_test, end_key) {
    var temp__3974__auto____9535 = cljs.core._sorted_seq_from.call(null, sc, start_key, true);
    if(cljs.core.truth_(temp__3974__auto____9535)) {
      var vec__9536__9537 = temp__3974__auto____9535;
      var e__9538 = cljs.core.nth.call(null, vec__9536__9537, 0, null);
      var s__9539 = vec__9536__9537;
      return cljs.core.take_while.call(null, cljs.core.mk_bound_fn.call(null, sc, end_test, end_key), cljs.core.truth_(cljs.core.mk_bound_fn.call(null, sc, start_test, start_key).call(null, e__9538)) ? s__9539 : cljs.core.next.call(null, s__9539))
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
    var include__9551 = cljs.core.mk_bound_fn.call(null, sc, test, key);
    if(cljs.core.truth_(cljs.core.PersistentHashSet.fromArray([cljs.core._LT_, cljs.core._LT__EQ_]).call(null, test))) {
      var temp__3974__auto____9552 = cljs.core._sorted_seq_from.call(null, sc, key, false);
      if(cljs.core.truth_(temp__3974__auto____9552)) {
        var vec__9553__9554 = temp__3974__auto____9552;
        var e__9555 = cljs.core.nth.call(null, vec__9553__9554, 0, null);
        var s__9556 = vec__9553__9554;
        if(cljs.core.truth_(include__9551.call(null, e__9555))) {
          return s__9556
        }else {
          return cljs.core.next.call(null, s__9556)
        }
      }else {
        return null
      }
    }else {
      return cljs.core.take_while.call(null, include__9551, cljs.core._sorted_seq.call(null, sc, false))
    }
  };
  var rsubseq__5 = function(sc, start_test, start_key, end_test, end_key) {
    var temp__3974__auto____9557 = cljs.core._sorted_seq_from.call(null, sc, end_key, false);
    if(cljs.core.truth_(temp__3974__auto____9557)) {
      var vec__9558__9559 = temp__3974__auto____9557;
      var e__9560 = cljs.core.nth.call(null, vec__9558__9559, 0, null);
      var s__9561 = vec__9558__9559;
      return cljs.core.take_while.call(null, cljs.core.mk_bound_fn.call(null, sc, start_test, start_key), cljs.core.truth_(cljs.core.mk_bound_fn.call(null, sc, end_test, end_key).call(null, e__9560)) ? s__9561 : cljs.core.next.call(null, s__9561))
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
cljs.core.Range.cljs$lang$ctorPrSeq = function(this__2337__auto__) {
  return cljs.core.list.call(null, "cljs.core/Range")
};
cljs.core.Range.prototype.cljs$core$IHash$_hash$arity$1 = function(rng) {
  var this__9562 = this;
  var h__2220__auto____9563 = this__9562.__hash;
  if(!(h__2220__auto____9563 == null)) {
    return h__2220__auto____9563
  }else {
    var h__2220__auto____9564 = cljs.core.hash_coll.call(null, rng);
    this__9562.__hash = h__2220__auto____9564;
    return h__2220__auto____9564
  }
};
cljs.core.Range.prototype.cljs$core$INext$_next$arity$1 = function(rng) {
  var this__9565 = this;
  if(this__9565.step > 0) {
    if(this__9565.start + this__9565.step < this__9565.end) {
      return new cljs.core.Range(this__9565.meta, this__9565.start + this__9565.step, this__9565.end, this__9565.step, null)
    }else {
      return null
    }
  }else {
    if(this__9565.start + this__9565.step > this__9565.end) {
      return new cljs.core.Range(this__9565.meta, this__9565.start + this__9565.step, this__9565.end, this__9565.step, null)
    }else {
      return null
    }
  }
};
cljs.core.Range.prototype.cljs$core$ICollection$_conj$arity$2 = function(rng, o) {
  var this__9566 = this;
  return cljs.core.cons.call(null, o, rng)
};
cljs.core.Range.prototype.toString = function() {
  var this__9567 = this;
  var this__9568 = this;
  return cljs.core.pr_str.call(null, this__9568)
};
cljs.core.Range.prototype.cljs$core$IReduce$_reduce$arity$2 = function(rng, f) {
  var this__9569 = this;
  return cljs.core.ci_reduce.call(null, rng, f)
};
cljs.core.Range.prototype.cljs$core$IReduce$_reduce$arity$3 = function(rng, f, s) {
  var this__9570 = this;
  return cljs.core.ci_reduce.call(null, rng, f, s)
};
cljs.core.Range.prototype.cljs$core$ISeqable$_seq$arity$1 = function(rng) {
  var this__9571 = this;
  if(this__9571.step > 0) {
    if(this__9571.start < this__9571.end) {
      return rng
    }else {
      return null
    }
  }else {
    if(this__9571.start > this__9571.end) {
      return rng
    }else {
      return null
    }
  }
};
cljs.core.Range.prototype.cljs$core$ICounted$_count$arity$1 = function(rng) {
  var this__9572 = this;
  if(cljs.core.not.call(null, rng.cljs$core$ISeqable$_seq$arity$1(rng))) {
    return 0
  }else {
    return Math.ceil((this__9572.end - this__9572.start) / this__9572.step)
  }
};
cljs.core.Range.prototype.cljs$core$ISeq$_first$arity$1 = function(rng) {
  var this__9573 = this;
  return this__9573.start
};
cljs.core.Range.prototype.cljs$core$ISeq$_rest$arity$1 = function(rng) {
  var this__9574 = this;
  if(!(rng.cljs$core$ISeqable$_seq$arity$1(rng) == null)) {
    return new cljs.core.Range(this__9574.meta, this__9574.start + this__9574.step, this__9574.end, this__9574.step, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.Range.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(rng, other) {
  var this__9575 = this;
  return cljs.core.equiv_sequential.call(null, rng, other)
};
cljs.core.Range.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(rng, meta) {
  var this__9576 = this;
  return new cljs.core.Range(meta, this__9576.start, this__9576.end, this__9576.step, this__9576.__hash)
};
cljs.core.Range.prototype.cljs$core$IMeta$_meta$arity$1 = function(rng) {
  var this__9577 = this;
  return this__9577.meta
};
cljs.core.Range.prototype.cljs$core$IIndexed$_nth$arity$2 = function(rng, n) {
  var this__9578 = this;
  if(n < rng.cljs$core$ICounted$_count$arity$1(rng)) {
    return this__9578.start + n * this__9578.step
  }else {
    if(function() {
      var and__3822__auto____9579 = this__9578.start > this__9578.end;
      if(and__3822__auto____9579) {
        return this__9578.step === 0
      }else {
        return and__3822__auto____9579
      }
    }()) {
      return this__9578.start
    }else {
      throw new Error("Index out of bounds");
    }
  }
};
cljs.core.Range.prototype.cljs$core$IIndexed$_nth$arity$3 = function(rng, n, not_found) {
  var this__9580 = this;
  if(n < rng.cljs$core$ICounted$_count$arity$1(rng)) {
    return this__9580.start + n * this__9580.step
  }else {
    if(function() {
      var and__3822__auto____9581 = this__9580.start > this__9580.end;
      if(and__3822__auto____9581) {
        return this__9580.step === 0
      }else {
        return and__3822__auto____9581
      }
    }()) {
      return this__9580.start
    }else {
      return not_found
    }
  }
};
cljs.core.Range.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(rng) {
  var this__9582 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__9582.meta)
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
    var temp__3974__auto____9585 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____9585) {
      var s__9586 = temp__3974__auto____9585;
      return cljs.core.cons.call(null, cljs.core.first.call(null, s__9586), take_nth.call(null, n, cljs.core.drop.call(null, n, s__9586)))
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
    var temp__3974__auto____9593 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____9593) {
      var s__9594 = temp__3974__auto____9593;
      var fst__9595 = cljs.core.first.call(null, s__9594);
      var fv__9596 = f.call(null, fst__9595);
      var run__9597 = cljs.core.cons.call(null, fst__9595, cljs.core.take_while.call(null, function(p1__9587_SHARP_) {
        return cljs.core._EQ_.call(null, fv__9596, f.call(null, p1__9587_SHARP_))
      }, cljs.core.next.call(null, s__9594)));
      return cljs.core.cons.call(null, run__9597, partition_by.call(null, f, cljs.core.seq.call(null, cljs.core.drop.call(null, cljs.core.count.call(null, run__9597), s__9594))))
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
      var temp__3971__auto____9612 = cljs.core.seq.call(null, coll);
      if(temp__3971__auto____9612) {
        var s__9613 = temp__3971__auto____9612;
        return reductions.call(null, f, cljs.core.first.call(null, s__9613), cljs.core.rest.call(null, s__9613))
      }else {
        return cljs.core.list.call(null, f.call(null))
      }
    }, null)
  };
  var reductions__3 = function(f, init, coll) {
    return cljs.core.cons.call(null, init, new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____9614 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____9614) {
        var s__9615 = temp__3974__auto____9614;
        return reductions.call(null, f, f.call(null, init, cljs.core.first.call(null, s__9615)), cljs.core.rest.call(null, s__9615))
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
      var G__9618 = null;
      var G__9618__0 = function() {
        return cljs.core.vector.call(null, f.call(null))
      };
      var G__9618__1 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x))
      };
      var G__9618__2 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y))
      };
      var G__9618__3 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z))
      };
      var G__9618__4 = function() {
        var G__9619__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args))
        };
        var G__9619 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__9619__delegate.call(this, x, y, z, args)
        };
        G__9619.cljs$lang$maxFixedArity = 3;
        G__9619.cljs$lang$applyTo = function(arglist__9620) {
          var x = cljs.core.first(arglist__9620);
          var y = cljs.core.first(cljs.core.next(arglist__9620));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9620)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9620)));
          return G__9619__delegate(x, y, z, args)
        };
        G__9619.cljs$lang$arity$variadic = G__9619__delegate;
        return G__9619
      }();
      G__9618 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__9618__0.call(this);
          case 1:
            return G__9618__1.call(this, x);
          case 2:
            return G__9618__2.call(this, x, y);
          case 3:
            return G__9618__3.call(this, x, y, z);
          default:
            return G__9618__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__9618.cljs$lang$maxFixedArity = 3;
      G__9618.cljs$lang$applyTo = G__9618__4.cljs$lang$applyTo;
      return G__9618
    }()
  };
  var juxt__2 = function(f, g) {
    return function() {
      var G__9621 = null;
      var G__9621__0 = function() {
        return cljs.core.vector.call(null, f.call(null), g.call(null))
      };
      var G__9621__1 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x), g.call(null, x))
      };
      var G__9621__2 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y), g.call(null, x, y))
      };
      var G__9621__3 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z), g.call(null, x, y, z))
      };
      var G__9621__4 = function() {
        var G__9622__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args), cljs.core.apply.call(null, g, x, y, z, args))
        };
        var G__9622 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__9622__delegate.call(this, x, y, z, args)
        };
        G__9622.cljs$lang$maxFixedArity = 3;
        G__9622.cljs$lang$applyTo = function(arglist__9623) {
          var x = cljs.core.first(arglist__9623);
          var y = cljs.core.first(cljs.core.next(arglist__9623));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9623)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9623)));
          return G__9622__delegate(x, y, z, args)
        };
        G__9622.cljs$lang$arity$variadic = G__9622__delegate;
        return G__9622
      }();
      G__9621 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__9621__0.call(this);
          case 1:
            return G__9621__1.call(this, x);
          case 2:
            return G__9621__2.call(this, x, y);
          case 3:
            return G__9621__3.call(this, x, y, z);
          default:
            return G__9621__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__9621.cljs$lang$maxFixedArity = 3;
      G__9621.cljs$lang$applyTo = G__9621__4.cljs$lang$applyTo;
      return G__9621
    }()
  };
  var juxt__3 = function(f, g, h) {
    return function() {
      var G__9624 = null;
      var G__9624__0 = function() {
        return cljs.core.vector.call(null, f.call(null), g.call(null), h.call(null))
      };
      var G__9624__1 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x), g.call(null, x), h.call(null, x))
      };
      var G__9624__2 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y), g.call(null, x, y), h.call(null, x, y))
      };
      var G__9624__3 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z), g.call(null, x, y, z), h.call(null, x, y, z))
      };
      var G__9624__4 = function() {
        var G__9625__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args), cljs.core.apply.call(null, g, x, y, z, args), cljs.core.apply.call(null, h, x, y, z, args))
        };
        var G__9625 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__9625__delegate.call(this, x, y, z, args)
        };
        G__9625.cljs$lang$maxFixedArity = 3;
        G__9625.cljs$lang$applyTo = function(arglist__9626) {
          var x = cljs.core.first(arglist__9626);
          var y = cljs.core.first(cljs.core.next(arglist__9626));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9626)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9626)));
          return G__9625__delegate(x, y, z, args)
        };
        G__9625.cljs$lang$arity$variadic = G__9625__delegate;
        return G__9625
      }();
      G__9624 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__9624__0.call(this);
          case 1:
            return G__9624__1.call(this, x);
          case 2:
            return G__9624__2.call(this, x, y);
          case 3:
            return G__9624__3.call(this, x, y, z);
          default:
            return G__9624__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__9624.cljs$lang$maxFixedArity = 3;
      G__9624.cljs$lang$applyTo = G__9624__4.cljs$lang$applyTo;
      return G__9624
    }()
  };
  var juxt__4 = function() {
    var G__9627__delegate = function(f, g, h, fs) {
      var fs__9617 = cljs.core.list_STAR_.call(null, f, g, h, fs);
      return function() {
        var G__9628 = null;
        var G__9628__0 = function() {
          return cljs.core.reduce.call(null, function(p1__9598_SHARP_, p2__9599_SHARP_) {
            return cljs.core.conj.call(null, p1__9598_SHARP_, p2__9599_SHARP_.call(null))
          }, cljs.core.PersistentVector.EMPTY, fs__9617)
        };
        var G__9628__1 = function(x) {
          return cljs.core.reduce.call(null, function(p1__9600_SHARP_, p2__9601_SHARP_) {
            return cljs.core.conj.call(null, p1__9600_SHARP_, p2__9601_SHARP_.call(null, x))
          }, cljs.core.PersistentVector.EMPTY, fs__9617)
        };
        var G__9628__2 = function(x, y) {
          return cljs.core.reduce.call(null, function(p1__9602_SHARP_, p2__9603_SHARP_) {
            return cljs.core.conj.call(null, p1__9602_SHARP_, p2__9603_SHARP_.call(null, x, y))
          }, cljs.core.PersistentVector.EMPTY, fs__9617)
        };
        var G__9628__3 = function(x, y, z) {
          return cljs.core.reduce.call(null, function(p1__9604_SHARP_, p2__9605_SHARP_) {
            return cljs.core.conj.call(null, p1__9604_SHARP_, p2__9605_SHARP_.call(null, x, y, z))
          }, cljs.core.PersistentVector.EMPTY, fs__9617)
        };
        var G__9628__4 = function() {
          var G__9629__delegate = function(x, y, z, args) {
            return cljs.core.reduce.call(null, function(p1__9606_SHARP_, p2__9607_SHARP_) {
              return cljs.core.conj.call(null, p1__9606_SHARP_, cljs.core.apply.call(null, p2__9607_SHARP_, x, y, z, args))
            }, cljs.core.PersistentVector.EMPTY, fs__9617)
          };
          var G__9629 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__9629__delegate.call(this, x, y, z, args)
          };
          G__9629.cljs$lang$maxFixedArity = 3;
          G__9629.cljs$lang$applyTo = function(arglist__9630) {
            var x = cljs.core.first(arglist__9630);
            var y = cljs.core.first(cljs.core.next(arglist__9630));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9630)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9630)));
            return G__9629__delegate(x, y, z, args)
          };
          G__9629.cljs$lang$arity$variadic = G__9629__delegate;
          return G__9629
        }();
        G__9628 = function(x, y, z, var_args) {
          var args = var_args;
          switch(arguments.length) {
            case 0:
              return G__9628__0.call(this);
            case 1:
              return G__9628__1.call(this, x);
            case 2:
              return G__9628__2.call(this, x, y);
            case 3:
              return G__9628__3.call(this, x, y, z);
            default:
              return G__9628__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
          }
          throw"Invalid arity: " + arguments.length;
        };
        G__9628.cljs$lang$maxFixedArity = 3;
        G__9628.cljs$lang$applyTo = G__9628__4.cljs$lang$applyTo;
        return G__9628
      }()
    };
    var G__9627 = function(f, g, h, var_args) {
      var fs = null;
      if(goog.isDef(var_args)) {
        fs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__9627__delegate.call(this, f, g, h, fs)
    };
    G__9627.cljs$lang$maxFixedArity = 3;
    G__9627.cljs$lang$applyTo = function(arglist__9631) {
      var f = cljs.core.first(arglist__9631);
      var g = cljs.core.first(cljs.core.next(arglist__9631));
      var h = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9631)));
      var fs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9631)));
      return G__9627__delegate(f, g, h, fs)
    };
    G__9627.cljs$lang$arity$variadic = G__9627__delegate;
    return G__9627
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
        var G__9634 = cljs.core.next.call(null, coll);
        coll = G__9634;
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
        var and__3822__auto____9633 = cljs.core.seq.call(null, coll);
        if(and__3822__auto____9633) {
          return n > 0
        }else {
          return and__3822__auto____9633
        }
      }())) {
        var G__9635 = n - 1;
        var G__9636 = cljs.core.next.call(null, coll);
        n = G__9635;
        coll = G__9636;
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
  var matches__9638 = re.exec(s);
  if(cljs.core._EQ_.call(null, cljs.core.first.call(null, matches__9638), s)) {
    if(cljs.core.count.call(null, matches__9638) === 1) {
      return cljs.core.first.call(null, matches__9638)
    }else {
      return cljs.core.vec.call(null, matches__9638)
    }
  }else {
    return null
  }
};
cljs.core.re_find = function re_find(re, s) {
  var matches__9640 = re.exec(s);
  if(matches__9640 == null) {
    return null
  }else {
    if(cljs.core.count.call(null, matches__9640) === 1) {
      return cljs.core.first.call(null, matches__9640)
    }else {
      return cljs.core.vec.call(null, matches__9640)
    }
  }
};
cljs.core.re_seq = function re_seq(re, s) {
  var match_data__9645 = cljs.core.re_find.call(null, re, s);
  var match_idx__9646 = s.search(re);
  var match_str__9647 = cljs.core.coll_QMARK_.call(null, match_data__9645) ? cljs.core.first.call(null, match_data__9645) : match_data__9645;
  var post_match__9648 = cljs.core.subs.call(null, s, match_idx__9646 + cljs.core.count.call(null, match_str__9647));
  if(cljs.core.truth_(match_data__9645)) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, match_data__9645, re_seq.call(null, re, post_match__9648))
    }, null)
  }else {
    return null
  }
};
cljs.core.re_pattern = function re_pattern(s) {
  var vec__9655__9656 = cljs.core.re_find.call(null, /^(?:\(\?([idmsux]*)\))?(.*)/, s);
  var ___9657 = cljs.core.nth.call(null, vec__9655__9656, 0, null);
  var flags__9658 = cljs.core.nth.call(null, vec__9655__9656, 1, null);
  var pattern__9659 = cljs.core.nth.call(null, vec__9655__9656, 2, null);
  return new RegExp(pattern__9659, flags__9658)
};
cljs.core.pr_sequential = function pr_sequential(print_one, begin, sep, end, opts, coll) {
  return cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray([begin], true), cljs.core.flatten1.call(null, cljs.core.interpose.call(null, cljs.core.PersistentVector.fromArray([sep], true), cljs.core.map.call(null, function(p1__9649_SHARP_) {
    return print_one.call(null, p1__9649_SHARP_, opts)
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
          var and__3822__auto____9669 = cljs.core._lookup.call(null, opts, "\ufdd0'meta", null);
          if(cljs.core.truth_(and__3822__auto____9669)) {
            var and__3822__auto____9673 = function() {
              var G__9670__9671 = obj;
              if(G__9670__9671) {
                if(function() {
                  var or__3824__auto____9672 = G__9670__9671.cljs$lang$protocol_mask$partition0$ & 131072;
                  if(or__3824__auto____9672) {
                    return or__3824__auto____9672
                  }else {
                    return G__9670__9671.cljs$core$IMeta$
                  }
                }()) {
                  return true
                }else {
                  if(!G__9670__9671.cljs$lang$protocol_mask$partition0$) {
                    return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__9670__9671)
                  }else {
                    return false
                  }
                }
              }else {
                return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__9670__9671)
              }
            }();
            if(cljs.core.truth_(and__3822__auto____9673)) {
              return cljs.core.meta.call(null, obj)
            }else {
              return and__3822__auto____9673
            }
          }else {
            return and__3822__auto____9669
          }
        }()) ? cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray(["^"], true), pr_seq.call(null, cljs.core.meta.call(null, obj), opts), cljs.core.PersistentVector.fromArray([" "], true)) : null, function() {
          var and__3822__auto____9674 = !(obj == null);
          if(and__3822__auto____9674) {
            return obj.cljs$lang$type
          }else {
            return and__3822__auto____9674
          }
        }() ? obj.cljs$lang$ctorPrSeq(obj) : function() {
          var G__9675__9676 = obj;
          if(G__9675__9676) {
            if(function() {
              var or__3824__auto____9677 = G__9675__9676.cljs$lang$protocol_mask$partition0$ & 536870912;
              if(or__3824__auto____9677) {
                return or__3824__auto____9677
              }else {
                return G__9675__9676.cljs$core$IPrintable$
              }
            }()) {
              return true
            }else {
              if(!G__9675__9676.cljs$lang$protocol_mask$partition0$) {
                return cljs.core.type_satisfies_.call(null, cljs.core.IPrintable, G__9675__9676)
              }else {
                return false
              }
            }
          }else {
            return cljs.core.type_satisfies_.call(null, cljs.core.IPrintable, G__9675__9676)
          }
        }() ? cljs.core._pr_seq.call(null, obj, opts) : cljs.core.truth_(cljs.core.regexp_QMARK_.call(null, obj)) ? cljs.core.list.call(null, '#"', obj.source, '"') : "\ufdd0'else" ? cljs.core.list.call(null, "#<", [cljs.core.str(obj)].join(""), ">") : null)
      }else {
        return null
      }
    }
  }
};
cljs.core.pr_sb = function pr_sb(objs, opts) {
  var sb__9697 = new goog.string.StringBuffer;
  var G__9698__9699 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, cljs.core.first.call(null, objs), opts));
  if(G__9698__9699) {
    var string__9700 = cljs.core.first.call(null, G__9698__9699);
    var G__9698__9701 = G__9698__9699;
    while(true) {
      sb__9697.append(string__9700);
      var temp__3974__auto____9702 = cljs.core.next.call(null, G__9698__9701);
      if(temp__3974__auto____9702) {
        var G__9698__9703 = temp__3974__auto____9702;
        var G__9716 = cljs.core.first.call(null, G__9698__9703);
        var G__9717 = G__9698__9703;
        string__9700 = G__9716;
        G__9698__9701 = G__9717;
        continue
      }else {
      }
      break
    }
  }else {
  }
  var G__9704__9705 = cljs.core.seq.call(null, cljs.core.next.call(null, objs));
  if(G__9704__9705) {
    var obj__9706 = cljs.core.first.call(null, G__9704__9705);
    var G__9704__9707 = G__9704__9705;
    while(true) {
      sb__9697.append(" ");
      var G__9708__9709 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, obj__9706, opts));
      if(G__9708__9709) {
        var string__9710 = cljs.core.first.call(null, G__9708__9709);
        var G__9708__9711 = G__9708__9709;
        while(true) {
          sb__9697.append(string__9710);
          var temp__3974__auto____9712 = cljs.core.next.call(null, G__9708__9711);
          if(temp__3974__auto____9712) {
            var G__9708__9713 = temp__3974__auto____9712;
            var G__9718 = cljs.core.first.call(null, G__9708__9713);
            var G__9719 = G__9708__9713;
            string__9710 = G__9718;
            G__9708__9711 = G__9719;
            continue
          }else {
          }
          break
        }
      }else {
      }
      var temp__3974__auto____9714 = cljs.core.next.call(null, G__9704__9707);
      if(temp__3974__auto____9714) {
        var G__9704__9715 = temp__3974__auto____9714;
        var G__9720 = cljs.core.first.call(null, G__9704__9715);
        var G__9721 = G__9704__9715;
        obj__9706 = G__9720;
        G__9704__9707 = G__9721;
        continue
      }else {
      }
      break
    }
  }else {
  }
  return sb__9697
};
cljs.core.pr_str_with_opts = function pr_str_with_opts(objs, opts) {
  return[cljs.core.str(cljs.core.pr_sb.call(null, objs, opts))].join("")
};
cljs.core.prn_str_with_opts = function prn_str_with_opts(objs, opts) {
  var sb__9723 = cljs.core.pr_sb.call(null, objs, opts);
  sb__9723.append("\n");
  return[cljs.core.str(sb__9723)].join("")
};
cljs.core.pr_with_opts = function pr_with_opts(objs, opts) {
  var G__9742__9743 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, cljs.core.first.call(null, objs), opts));
  if(G__9742__9743) {
    var string__9744 = cljs.core.first.call(null, G__9742__9743);
    var G__9742__9745 = G__9742__9743;
    while(true) {
      cljs.core.string_print.call(null, string__9744);
      var temp__3974__auto____9746 = cljs.core.next.call(null, G__9742__9745);
      if(temp__3974__auto____9746) {
        var G__9742__9747 = temp__3974__auto____9746;
        var G__9760 = cljs.core.first.call(null, G__9742__9747);
        var G__9761 = G__9742__9747;
        string__9744 = G__9760;
        G__9742__9745 = G__9761;
        continue
      }else {
      }
      break
    }
  }else {
  }
  var G__9748__9749 = cljs.core.seq.call(null, cljs.core.next.call(null, objs));
  if(G__9748__9749) {
    var obj__9750 = cljs.core.first.call(null, G__9748__9749);
    var G__9748__9751 = G__9748__9749;
    while(true) {
      cljs.core.string_print.call(null, " ");
      var G__9752__9753 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, obj__9750, opts));
      if(G__9752__9753) {
        var string__9754 = cljs.core.first.call(null, G__9752__9753);
        var G__9752__9755 = G__9752__9753;
        while(true) {
          cljs.core.string_print.call(null, string__9754);
          var temp__3974__auto____9756 = cljs.core.next.call(null, G__9752__9755);
          if(temp__3974__auto____9756) {
            var G__9752__9757 = temp__3974__auto____9756;
            var G__9762 = cljs.core.first.call(null, G__9752__9757);
            var G__9763 = G__9752__9757;
            string__9754 = G__9762;
            G__9752__9755 = G__9763;
            continue
          }else {
          }
          break
        }
      }else {
      }
      var temp__3974__auto____9758 = cljs.core.next.call(null, G__9748__9751);
      if(temp__3974__auto____9758) {
        var G__9748__9759 = temp__3974__auto____9758;
        var G__9764 = cljs.core.first.call(null, G__9748__9759);
        var G__9765 = G__9748__9759;
        obj__9750 = G__9764;
        G__9748__9751 = G__9765;
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
  pr_str.cljs$lang$applyTo = function(arglist__9766) {
    var objs = cljs.core.seq(arglist__9766);
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
  prn_str.cljs$lang$applyTo = function(arglist__9767) {
    var objs = cljs.core.seq(arglist__9767);
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
  pr.cljs$lang$applyTo = function(arglist__9768) {
    var objs = cljs.core.seq(arglist__9768);
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
  cljs_core_print.cljs$lang$applyTo = function(arglist__9769) {
    var objs = cljs.core.seq(arglist__9769);
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
  print_str.cljs$lang$applyTo = function(arglist__9770) {
    var objs = cljs.core.seq(arglist__9770);
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
  println.cljs$lang$applyTo = function(arglist__9771) {
    var objs = cljs.core.seq(arglist__9771);
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
  println_str.cljs$lang$applyTo = function(arglist__9772) {
    var objs = cljs.core.seq(arglist__9772);
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
  prn.cljs$lang$applyTo = function(arglist__9773) {
    var objs = cljs.core.seq(arglist__9773);
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
  printf.cljs$lang$applyTo = function(arglist__9774) {
    var fmt = cljs.core.first(arglist__9774);
    var args = cljs.core.rest(arglist__9774);
    return printf__delegate(fmt, args)
  };
  printf.cljs$lang$arity$variadic = printf__delegate;
  return printf
}();
cljs.core.HashMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.HashMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__9775 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__9775, "{", ", ", "}", opts, coll)
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
  var pr_pair__9776 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__9776, "{", ", ", "}", opts, coll)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__9777 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__9777, "{", ", ", "}", opts, coll)
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
      var temp__3974__auto____9778 = cljs.core.namespace.call(null, obj);
      if(cljs.core.truth_(temp__3974__auto____9778)) {
        var nspc__9779 = temp__3974__auto____9778;
        return[cljs.core.str(nspc__9779), cljs.core.str("/")].join("")
      }else {
        return null
      }
    }()), cljs.core.str(cljs.core.name.call(null, obj))].join(""))
  }else {
    if(cljs.core.symbol_QMARK_.call(null, obj)) {
      return cljs.core.list.call(null, [cljs.core.str(function() {
        var temp__3974__auto____9780 = cljs.core.namespace.call(null, obj);
        if(cljs.core.truth_(temp__3974__auto____9780)) {
          var nspc__9781 = temp__3974__auto____9780;
          return[cljs.core.str(nspc__9781), cljs.core.str("/")].join("")
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
  var pr_pair__9782 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__9782, "{", ", ", "}", opts, coll)
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
  var normalize__9784 = function(n, len) {
    var ns__9783 = [cljs.core.str(n)].join("");
    while(true) {
      if(cljs.core.count.call(null, ns__9783) < len) {
        var G__9786 = [cljs.core.str("0"), cljs.core.str(ns__9783)].join("");
        ns__9783 = G__9786;
        continue
      }else {
        return ns__9783
      }
      break
    }
  };
  return cljs.core.list.call(null, [cljs.core.str('#inst "'), cljs.core.str(d.getUTCFullYear()), cljs.core.str("-"), cljs.core.str(normalize__9784.call(null, d.getUTCMonth() + 1, 2)), cljs.core.str("-"), cljs.core.str(normalize__9784.call(null, d.getUTCDate(), 2)), cljs.core.str("T"), cljs.core.str(normalize__9784.call(null, d.getUTCHours(), 2)), cljs.core.str(":"), cljs.core.str(normalize__9784.call(null, d.getUTCMinutes(), 2)), cljs.core.str(":"), cljs.core.str(normalize__9784.call(null, d.getUTCSeconds(), 
  2)), cljs.core.str("."), cljs.core.str(normalize__9784.call(null, d.getUTCMilliseconds(), 3)), cljs.core.str("-"), cljs.core.str('00:00"')].join(""))
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
  var pr_pair__9785 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__9785, "{", ", ", "}", opts, coll)
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
cljs.core.Atom.cljs$lang$ctorPrSeq = function(this__2337__auto__) {
  return cljs.core.list.call(null, "cljs.core/Atom")
};
cljs.core.Atom.prototype.cljs$core$IHash$_hash$arity$1 = function(this$) {
  var this__9787 = this;
  return goog.getUid(this$)
};
cljs.core.Atom.prototype.cljs$core$IWatchable$_notify_watches$arity$3 = function(this$, oldval, newval) {
  var this__9788 = this;
  var G__9789__9790 = cljs.core.seq.call(null, this__9788.watches);
  if(G__9789__9790) {
    var G__9792__9794 = cljs.core.first.call(null, G__9789__9790);
    var vec__9793__9795 = G__9792__9794;
    var key__9796 = cljs.core.nth.call(null, vec__9793__9795, 0, null);
    var f__9797 = cljs.core.nth.call(null, vec__9793__9795, 1, null);
    var G__9789__9798 = G__9789__9790;
    var G__9792__9799 = G__9792__9794;
    var G__9789__9800 = G__9789__9798;
    while(true) {
      var vec__9801__9802 = G__9792__9799;
      var key__9803 = cljs.core.nth.call(null, vec__9801__9802, 0, null);
      var f__9804 = cljs.core.nth.call(null, vec__9801__9802, 1, null);
      var G__9789__9805 = G__9789__9800;
      f__9804.call(null, key__9803, this$, oldval, newval);
      var temp__3974__auto____9806 = cljs.core.next.call(null, G__9789__9805);
      if(temp__3974__auto____9806) {
        var G__9789__9807 = temp__3974__auto____9806;
        var G__9814 = cljs.core.first.call(null, G__9789__9807);
        var G__9815 = G__9789__9807;
        G__9792__9799 = G__9814;
        G__9789__9800 = G__9815;
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
  var this__9808 = this;
  return this$.watches = cljs.core.assoc.call(null, this__9808.watches, key, f)
};
cljs.core.Atom.prototype.cljs$core$IWatchable$_remove_watch$arity$2 = function(this$, key) {
  var this__9809 = this;
  return this$.watches = cljs.core.dissoc.call(null, this__9809.watches, key)
};
cljs.core.Atom.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(a, opts) {
  var this__9810 = this;
  return cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray(["#<Atom: "], true), cljs.core._pr_seq.call(null, this__9810.state, opts), ">")
};
cljs.core.Atom.prototype.cljs$core$IMeta$_meta$arity$1 = function(_) {
  var this__9811 = this;
  return this__9811.meta
};
cljs.core.Atom.prototype.cljs$core$IDeref$_deref$arity$1 = function(_) {
  var this__9812 = this;
  return this__9812.state
};
cljs.core.Atom.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(o, other) {
  var this__9813 = this;
  return o === other
};
cljs.core.Atom;
cljs.core.atom = function() {
  var atom = null;
  var atom__1 = function(x) {
    return new cljs.core.Atom(x, null, null, null)
  };
  var atom__2 = function() {
    var G__9827__delegate = function(x, p__9816) {
      var map__9822__9823 = p__9816;
      var map__9822__9824 = cljs.core.seq_QMARK_.call(null, map__9822__9823) ? cljs.core.apply.call(null, cljs.core.hash_map, map__9822__9823) : map__9822__9823;
      var validator__9825 = cljs.core._lookup.call(null, map__9822__9824, "\ufdd0'validator", null);
      var meta__9826 = cljs.core._lookup.call(null, map__9822__9824, "\ufdd0'meta", null);
      return new cljs.core.Atom(x, meta__9826, validator__9825, null)
    };
    var G__9827 = function(x, var_args) {
      var p__9816 = null;
      if(goog.isDef(var_args)) {
        p__9816 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__9827__delegate.call(this, x, p__9816)
    };
    G__9827.cljs$lang$maxFixedArity = 1;
    G__9827.cljs$lang$applyTo = function(arglist__9828) {
      var x = cljs.core.first(arglist__9828);
      var p__9816 = cljs.core.rest(arglist__9828);
      return G__9827__delegate(x, p__9816)
    };
    G__9827.cljs$lang$arity$variadic = G__9827__delegate;
    return G__9827
  }();
  atom = function(x, var_args) {
    var p__9816 = var_args;
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
  var temp__3974__auto____9832 = a.validator;
  if(cljs.core.truth_(temp__3974__auto____9832)) {
    var validate__9833 = temp__3974__auto____9832;
    if(cljs.core.truth_(validate__9833.call(null, new_value))) {
    }else {
      throw new Error([cljs.core.str("Assert failed: "), cljs.core.str("Validator rejected reference state"), cljs.core.str("\n"), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'validate", "\ufdd1'new-value"), cljs.core.hash_map("\ufdd0'line", 6440))))].join(""));
    }
  }else {
  }
  var old_value__9834 = a.state;
  a.state = new_value;
  cljs.core._notify_watches.call(null, a, old_value__9834, new_value);
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
    var G__9835__delegate = function(a, f, x, y, z, more) {
      return cljs.core.reset_BANG_.call(null, a, cljs.core.apply.call(null, f, a.state, x, y, z, more))
    };
    var G__9835 = function(a, f, x, y, z, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 5), 0)
      }
      return G__9835__delegate.call(this, a, f, x, y, z, more)
    };
    G__9835.cljs$lang$maxFixedArity = 5;
    G__9835.cljs$lang$applyTo = function(arglist__9836) {
      var a = cljs.core.first(arglist__9836);
      var f = cljs.core.first(cljs.core.next(arglist__9836));
      var x = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9836)));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__9836))));
      var z = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__9836)))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__9836)))));
      return G__9835__delegate(a, f, x, y, z, more)
    };
    G__9835.cljs$lang$arity$variadic = G__9835__delegate;
    return G__9835
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
  alter_meta_BANG_.cljs$lang$applyTo = function(arglist__9837) {
    var iref = cljs.core.first(arglist__9837);
    var f = cljs.core.first(cljs.core.next(arglist__9837));
    var args = cljs.core.rest(cljs.core.next(arglist__9837));
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
cljs.core.Delay.cljs$lang$ctorPrSeq = function(this__2337__auto__) {
  return cljs.core.list.call(null, "cljs.core/Delay")
};
cljs.core.Delay.prototype.cljs$core$IPending$_realized_QMARK_$arity$1 = function(d) {
  var this__9838 = this;
  return(new cljs.core.Keyword("\ufdd0'done")).call(null, cljs.core.deref.call(null, this__9838.state))
};
cljs.core.Delay.prototype.cljs$core$IDeref$_deref$arity$1 = function(_) {
  var this__9839 = this;
  return(new cljs.core.Keyword("\ufdd0'value")).call(null, cljs.core.swap_BANG_.call(null, this__9839.state, function(p__9840) {
    var map__9841__9842 = p__9840;
    var map__9841__9843 = cljs.core.seq_QMARK_.call(null, map__9841__9842) ? cljs.core.apply.call(null, cljs.core.hash_map, map__9841__9842) : map__9841__9842;
    var curr_state__9844 = map__9841__9843;
    var done__9845 = cljs.core._lookup.call(null, map__9841__9843, "\ufdd0'done", null);
    if(cljs.core.truth_(done__9845)) {
      return curr_state__9844
    }else {
      return cljs.core.ObjMap.fromObject(["\ufdd0'done", "\ufdd0'value"], {"\ufdd0'done":true, "\ufdd0'value":this__9839.f.call(null)})
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
    var map__9866__9867 = options;
    var map__9866__9868 = cljs.core.seq_QMARK_.call(null, map__9866__9867) ? cljs.core.apply.call(null, cljs.core.hash_map, map__9866__9867) : map__9866__9867;
    var keywordize_keys__9869 = cljs.core._lookup.call(null, map__9866__9868, "\ufdd0'keywordize-keys", null);
    var keyfn__9870 = cljs.core.truth_(keywordize_keys__9869) ? cljs.core.keyword : cljs.core.str;
    var f__9885 = function thisfn(x) {
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
                var iter__2490__auto____9884 = function iter__9878(s__9879) {
                  return new cljs.core.LazySeq(null, false, function() {
                    var s__9879__9882 = s__9879;
                    while(true) {
                      if(cljs.core.seq.call(null, s__9879__9882)) {
                        var k__9883 = cljs.core.first.call(null, s__9879__9882);
                        return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([keyfn__9870.call(null, k__9883), thisfn.call(null, x[k__9883])], true), iter__9878.call(null, cljs.core.rest.call(null, s__9879__9882)))
                      }else {
                        return null
                      }
                      break
                    }
                  }, null)
                };
                return iter__2490__auto____9884.call(null, cljs.core.js_keys.call(null, x))
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
    return f__9885.call(null, x)
  };
  var js__GT_clj = function(x, var_args) {
    var options = null;
    if(goog.isDef(var_args)) {
      options = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return js__GT_clj__delegate.call(this, x, options)
  };
  js__GT_clj.cljs$lang$maxFixedArity = 1;
  js__GT_clj.cljs$lang$applyTo = function(arglist__9886) {
    var x = cljs.core.first(arglist__9886);
    var options = cljs.core.rest(arglist__9886);
    return js__GT_clj__delegate(x, options)
  };
  js__GT_clj.cljs$lang$arity$variadic = js__GT_clj__delegate;
  return js__GT_clj
}();
cljs.core.memoize = function memoize(f) {
  var mem__9891 = cljs.core.atom.call(null, cljs.core.ObjMap.EMPTY);
  return function() {
    var G__9895__delegate = function(args) {
      var temp__3971__auto____9892 = cljs.core._lookup.call(null, cljs.core.deref.call(null, mem__9891), args, null);
      if(cljs.core.truth_(temp__3971__auto____9892)) {
        var v__9893 = temp__3971__auto____9892;
        return v__9893
      }else {
        var ret__9894 = cljs.core.apply.call(null, f, args);
        cljs.core.swap_BANG_.call(null, mem__9891, cljs.core.assoc, args, ret__9894);
        return ret__9894
      }
    };
    var G__9895 = function(var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__9895__delegate.call(this, args)
    };
    G__9895.cljs$lang$maxFixedArity = 0;
    G__9895.cljs$lang$applyTo = function(arglist__9896) {
      var args = cljs.core.seq(arglist__9896);
      return G__9895__delegate(args)
    };
    G__9895.cljs$lang$arity$variadic = G__9895__delegate;
    return G__9895
  }()
};
cljs.core.trampoline = function() {
  var trampoline = null;
  var trampoline__1 = function(f) {
    while(true) {
      var ret__9898 = f.call(null);
      if(cljs.core.fn_QMARK_.call(null, ret__9898)) {
        var G__9899 = ret__9898;
        f = G__9899;
        continue
      }else {
        return ret__9898
      }
      break
    }
  };
  var trampoline__2 = function() {
    var G__9900__delegate = function(f, args) {
      return trampoline.call(null, function() {
        return cljs.core.apply.call(null, f, args)
      })
    };
    var G__9900 = function(f, var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__9900__delegate.call(this, f, args)
    };
    G__9900.cljs$lang$maxFixedArity = 1;
    G__9900.cljs$lang$applyTo = function(arglist__9901) {
      var f = cljs.core.first(arglist__9901);
      var args = cljs.core.rest(arglist__9901);
      return G__9900__delegate(f, args)
    };
    G__9900.cljs$lang$arity$variadic = G__9900__delegate;
    return G__9900
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
    var k__9903 = f.call(null, x);
    return cljs.core.assoc.call(null, ret, k__9903, cljs.core.conj.call(null, cljs.core._lookup.call(null, ret, k__9903, cljs.core.PersistentVector.EMPTY), x))
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
    var or__3824__auto____9912 = cljs.core._EQ_.call(null, child, parent);
    if(or__3824__auto____9912) {
      return or__3824__auto____9912
    }else {
      var or__3824__auto____9913 = cljs.core.contains_QMARK_.call(null, (new cljs.core.Keyword("\ufdd0'ancestors")).call(null, h).call(null, child), parent);
      if(or__3824__auto____9913) {
        return or__3824__auto____9913
      }else {
        var and__3822__auto____9914 = cljs.core.vector_QMARK_.call(null, parent);
        if(and__3822__auto____9914) {
          var and__3822__auto____9915 = cljs.core.vector_QMARK_.call(null, child);
          if(and__3822__auto____9915) {
            var and__3822__auto____9916 = cljs.core.count.call(null, parent) === cljs.core.count.call(null, child);
            if(and__3822__auto____9916) {
              var ret__9917 = true;
              var i__9918 = 0;
              while(true) {
                if(function() {
                  var or__3824__auto____9919 = cljs.core.not.call(null, ret__9917);
                  if(or__3824__auto____9919) {
                    return or__3824__auto____9919
                  }else {
                    return i__9918 === cljs.core.count.call(null, parent)
                  }
                }()) {
                  return ret__9917
                }else {
                  var G__9920 = isa_QMARK_.call(null, h, child.call(null, i__9918), parent.call(null, i__9918));
                  var G__9921 = i__9918 + 1;
                  ret__9917 = G__9920;
                  i__9918 = G__9921;
                  continue
                }
                break
              }
            }else {
              return and__3822__auto____9916
            }
          }else {
            return and__3822__auto____9915
          }
        }else {
          return and__3822__auto____9914
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
    var tp__9930 = (new cljs.core.Keyword("\ufdd0'parents")).call(null, h);
    var td__9931 = (new cljs.core.Keyword("\ufdd0'descendants")).call(null, h);
    var ta__9932 = (new cljs.core.Keyword("\ufdd0'ancestors")).call(null, h);
    var tf__9933 = function(m, source, sources, target, targets) {
      return cljs.core.reduce.call(null, function(ret, k) {
        return cljs.core.assoc.call(null, ret, k, cljs.core.reduce.call(null, cljs.core.conj, cljs.core._lookup.call(null, targets, k, cljs.core.PersistentHashSet.EMPTY), cljs.core.cons.call(null, target, targets.call(null, target))))
      }, m, cljs.core.cons.call(null, source, sources.call(null, source)))
    };
    var or__3824__auto____9934 = cljs.core.contains_QMARK_.call(null, tp__9930.call(null, tag), parent) ? null : function() {
      if(cljs.core.contains_QMARK_.call(null, ta__9932.call(null, tag), parent)) {
        throw new Error([cljs.core.str(tag), cljs.core.str("already has"), cljs.core.str(parent), cljs.core.str("as ancestor")].join(""));
      }else {
      }
      if(cljs.core.contains_QMARK_.call(null, ta__9932.call(null, parent), tag)) {
        throw new Error([cljs.core.str("Cyclic derivation:"), cljs.core.str(parent), cljs.core.str("has"), cljs.core.str(tag), cljs.core.str("as ancestor")].join(""));
      }else {
      }
      return cljs.core.ObjMap.fromObject(["\ufdd0'parents", "\ufdd0'ancestors", "\ufdd0'descendants"], {"\ufdd0'parents":cljs.core.assoc.call(null, (new cljs.core.Keyword("\ufdd0'parents")).call(null, h), tag, cljs.core.conj.call(null, cljs.core._lookup.call(null, tp__9930, tag, cljs.core.PersistentHashSet.EMPTY), parent)), "\ufdd0'ancestors":tf__9933.call(null, (new cljs.core.Keyword("\ufdd0'ancestors")).call(null, h), tag, td__9931, parent, ta__9932), "\ufdd0'descendants":tf__9933.call(null, (new cljs.core.Keyword("\ufdd0'descendants")).call(null, 
      h), parent, ta__9932, tag, td__9931)})
    }();
    if(cljs.core.truth_(or__3824__auto____9934)) {
      return or__3824__auto____9934
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
    var parentMap__9939 = (new cljs.core.Keyword("\ufdd0'parents")).call(null, h);
    var childsParents__9940 = cljs.core.truth_(parentMap__9939.call(null, tag)) ? cljs.core.disj.call(null, parentMap__9939.call(null, tag), parent) : cljs.core.PersistentHashSet.EMPTY;
    var newParents__9941 = cljs.core.truth_(cljs.core.not_empty.call(null, childsParents__9940)) ? cljs.core.assoc.call(null, parentMap__9939, tag, childsParents__9940) : cljs.core.dissoc.call(null, parentMap__9939, tag);
    var deriv_seq__9942 = cljs.core.flatten.call(null, cljs.core.map.call(null, function(p1__9922_SHARP_) {
      return cljs.core.cons.call(null, cljs.core.first.call(null, p1__9922_SHARP_), cljs.core.interpose.call(null, cljs.core.first.call(null, p1__9922_SHARP_), cljs.core.second.call(null, p1__9922_SHARP_)))
    }, cljs.core.seq.call(null, newParents__9941)));
    if(cljs.core.contains_QMARK_.call(null, parentMap__9939.call(null, tag), parent)) {
      return cljs.core.reduce.call(null, function(p1__9923_SHARP_, p2__9924_SHARP_) {
        return cljs.core.apply.call(null, cljs.core.derive, p1__9923_SHARP_, p2__9924_SHARP_)
      }, cljs.core.make_hierarchy.call(null), cljs.core.partition.call(null, 2, deriv_seq__9942))
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
  var xprefs__9950 = cljs.core.deref.call(null, prefer_table).call(null, x);
  var or__3824__auto____9952 = cljs.core.truth_(function() {
    var and__3822__auto____9951 = xprefs__9950;
    if(cljs.core.truth_(and__3822__auto____9951)) {
      return xprefs__9950.call(null, y)
    }else {
      return and__3822__auto____9951
    }
  }()) ? true : null;
  if(cljs.core.truth_(or__3824__auto____9952)) {
    return or__3824__auto____9952
  }else {
    var or__3824__auto____9954 = function() {
      var ps__9953 = cljs.core.parents.call(null, y);
      while(true) {
        if(cljs.core.count.call(null, ps__9953) > 0) {
          if(cljs.core.truth_(prefers_STAR_.call(null, x, cljs.core.first.call(null, ps__9953), prefer_table))) {
          }else {
          }
          var G__9957 = cljs.core.rest.call(null, ps__9953);
          ps__9953 = G__9957;
          continue
        }else {
          return null
        }
        break
      }
    }();
    if(cljs.core.truth_(or__3824__auto____9954)) {
      return or__3824__auto____9954
    }else {
      var or__3824__auto____9956 = function() {
        var ps__9955 = cljs.core.parents.call(null, x);
        while(true) {
          if(cljs.core.count.call(null, ps__9955) > 0) {
            if(cljs.core.truth_(prefers_STAR_.call(null, cljs.core.first.call(null, ps__9955), y, prefer_table))) {
            }else {
            }
            var G__9958 = cljs.core.rest.call(null, ps__9955);
            ps__9955 = G__9958;
            continue
          }else {
            return null
          }
          break
        }
      }();
      if(cljs.core.truth_(or__3824__auto____9956)) {
        return or__3824__auto____9956
      }else {
        return false
      }
    }
  }
};
cljs.core.dominates = function dominates(x, y, prefer_table) {
  var or__3824__auto____9960 = cljs.core.prefers_STAR_.call(null, x, y, prefer_table);
  if(cljs.core.truth_(or__3824__auto____9960)) {
    return or__3824__auto____9960
  }else {
    return cljs.core.isa_QMARK_.call(null, x, y)
  }
};
cljs.core.find_and_cache_best_method = function find_and_cache_best_method(name, dispatch_val, hierarchy, method_table, prefer_table, method_cache, cached_hierarchy) {
  var best_entry__9978 = cljs.core.reduce.call(null, function(be, p__9970) {
    var vec__9971__9972 = p__9970;
    var k__9973 = cljs.core.nth.call(null, vec__9971__9972, 0, null);
    var ___9974 = cljs.core.nth.call(null, vec__9971__9972, 1, null);
    var e__9975 = vec__9971__9972;
    if(cljs.core.isa_QMARK_.call(null, dispatch_val, k__9973)) {
      var be2__9977 = cljs.core.truth_(function() {
        var or__3824__auto____9976 = be == null;
        if(or__3824__auto____9976) {
          return or__3824__auto____9976
        }else {
          return cljs.core.dominates.call(null, k__9973, cljs.core.first.call(null, be), prefer_table)
        }
      }()) ? e__9975 : be;
      if(cljs.core.truth_(cljs.core.dominates.call(null, cljs.core.first.call(null, be2__9977), k__9973, prefer_table))) {
      }else {
        throw new Error([cljs.core.str("Multiple methods in multimethod '"), cljs.core.str(name), cljs.core.str("' match dispatch value: "), cljs.core.str(dispatch_val), cljs.core.str(" -> "), cljs.core.str(k__9973), cljs.core.str(" and "), cljs.core.str(cljs.core.first.call(null, be2__9977)), cljs.core.str(", and neither is preferred")].join(""));
      }
      return be2__9977
    }else {
      return be
    }
  }, null, cljs.core.deref.call(null, method_table));
  if(cljs.core.truth_(best_entry__9978)) {
    if(cljs.core._EQ_.call(null, cljs.core.deref.call(null, cached_hierarchy), cljs.core.deref.call(null, hierarchy))) {
      cljs.core.swap_BANG_.call(null, method_cache, cljs.core.assoc, dispatch_val, cljs.core.second.call(null, best_entry__9978));
      return cljs.core.second.call(null, best_entry__9978)
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
    var and__3822__auto____9983 = mf;
    if(and__3822__auto____9983) {
      return mf.cljs$core$IMultiFn$_reset$arity$1
    }else {
      return and__3822__auto____9983
    }
  }()) {
    return mf.cljs$core$IMultiFn$_reset$arity$1(mf)
  }else {
    var x__2391__auto____9984 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____9985 = cljs.core._reset[goog.typeOf(x__2391__auto____9984)];
      if(or__3824__auto____9985) {
        return or__3824__auto____9985
      }else {
        var or__3824__auto____9986 = cljs.core._reset["_"];
        if(or__3824__auto____9986) {
          return or__3824__auto____9986
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-reset", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._add_method = function _add_method(mf, dispatch_val, method) {
  if(function() {
    var and__3822__auto____9991 = mf;
    if(and__3822__auto____9991) {
      return mf.cljs$core$IMultiFn$_add_method$arity$3
    }else {
      return and__3822__auto____9991
    }
  }()) {
    return mf.cljs$core$IMultiFn$_add_method$arity$3(mf, dispatch_val, method)
  }else {
    var x__2391__auto____9992 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____9993 = cljs.core._add_method[goog.typeOf(x__2391__auto____9992)];
      if(or__3824__auto____9993) {
        return or__3824__auto____9993
      }else {
        var or__3824__auto____9994 = cljs.core._add_method["_"];
        if(or__3824__auto____9994) {
          return or__3824__auto____9994
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-add-method", mf);
        }
      }
    }().call(null, mf, dispatch_val, method)
  }
};
cljs.core._remove_method = function _remove_method(mf, dispatch_val) {
  if(function() {
    var and__3822__auto____9999 = mf;
    if(and__3822__auto____9999) {
      return mf.cljs$core$IMultiFn$_remove_method$arity$2
    }else {
      return and__3822__auto____9999
    }
  }()) {
    return mf.cljs$core$IMultiFn$_remove_method$arity$2(mf, dispatch_val)
  }else {
    var x__2391__auto____10000 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____10001 = cljs.core._remove_method[goog.typeOf(x__2391__auto____10000)];
      if(or__3824__auto____10001) {
        return or__3824__auto____10001
      }else {
        var or__3824__auto____10002 = cljs.core._remove_method["_"];
        if(or__3824__auto____10002) {
          return or__3824__auto____10002
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-remove-method", mf);
        }
      }
    }().call(null, mf, dispatch_val)
  }
};
cljs.core._prefer_method = function _prefer_method(mf, dispatch_val, dispatch_val_y) {
  if(function() {
    var and__3822__auto____10007 = mf;
    if(and__3822__auto____10007) {
      return mf.cljs$core$IMultiFn$_prefer_method$arity$3
    }else {
      return and__3822__auto____10007
    }
  }()) {
    return mf.cljs$core$IMultiFn$_prefer_method$arity$3(mf, dispatch_val, dispatch_val_y)
  }else {
    var x__2391__auto____10008 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____10009 = cljs.core._prefer_method[goog.typeOf(x__2391__auto____10008)];
      if(or__3824__auto____10009) {
        return or__3824__auto____10009
      }else {
        var or__3824__auto____10010 = cljs.core._prefer_method["_"];
        if(or__3824__auto____10010) {
          return or__3824__auto____10010
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-prefer-method", mf);
        }
      }
    }().call(null, mf, dispatch_val, dispatch_val_y)
  }
};
cljs.core._get_method = function _get_method(mf, dispatch_val) {
  if(function() {
    var and__3822__auto____10015 = mf;
    if(and__3822__auto____10015) {
      return mf.cljs$core$IMultiFn$_get_method$arity$2
    }else {
      return and__3822__auto____10015
    }
  }()) {
    return mf.cljs$core$IMultiFn$_get_method$arity$2(mf, dispatch_val)
  }else {
    var x__2391__auto____10016 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____10017 = cljs.core._get_method[goog.typeOf(x__2391__auto____10016)];
      if(or__3824__auto____10017) {
        return or__3824__auto____10017
      }else {
        var or__3824__auto____10018 = cljs.core._get_method["_"];
        if(or__3824__auto____10018) {
          return or__3824__auto____10018
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-get-method", mf);
        }
      }
    }().call(null, mf, dispatch_val)
  }
};
cljs.core._methods = function _methods(mf) {
  if(function() {
    var and__3822__auto____10023 = mf;
    if(and__3822__auto____10023) {
      return mf.cljs$core$IMultiFn$_methods$arity$1
    }else {
      return and__3822__auto____10023
    }
  }()) {
    return mf.cljs$core$IMultiFn$_methods$arity$1(mf)
  }else {
    var x__2391__auto____10024 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____10025 = cljs.core._methods[goog.typeOf(x__2391__auto____10024)];
      if(or__3824__auto____10025) {
        return or__3824__auto____10025
      }else {
        var or__3824__auto____10026 = cljs.core._methods["_"];
        if(or__3824__auto____10026) {
          return or__3824__auto____10026
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-methods", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._prefers = function _prefers(mf) {
  if(function() {
    var and__3822__auto____10031 = mf;
    if(and__3822__auto____10031) {
      return mf.cljs$core$IMultiFn$_prefers$arity$1
    }else {
      return and__3822__auto____10031
    }
  }()) {
    return mf.cljs$core$IMultiFn$_prefers$arity$1(mf)
  }else {
    var x__2391__auto____10032 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____10033 = cljs.core._prefers[goog.typeOf(x__2391__auto____10032)];
      if(or__3824__auto____10033) {
        return or__3824__auto____10033
      }else {
        var or__3824__auto____10034 = cljs.core._prefers["_"];
        if(or__3824__auto____10034) {
          return or__3824__auto____10034
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-prefers", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._dispatch = function _dispatch(mf, args) {
  if(function() {
    var and__3822__auto____10039 = mf;
    if(and__3822__auto____10039) {
      return mf.cljs$core$IMultiFn$_dispatch$arity$2
    }else {
      return and__3822__auto____10039
    }
  }()) {
    return mf.cljs$core$IMultiFn$_dispatch$arity$2(mf, args)
  }else {
    var x__2391__auto____10040 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____10041 = cljs.core._dispatch[goog.typeOf(x__2391__auto____10040)];
      if(or__3824__auto____10041) {
        return or__3824__auto____10041
      }else {
        var or__3824__auto____10042 = cljs.core._dispatch["_"];
        if(or__3824__auto____10042) {
          return or__3824__auto____10042
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-dispatch", mf);
        }
      }
    }().call(null, mf, args)
  }
};
cljs.core.do_dispatch = function do_dispatch(mf, dispatch_fn, args) {
  var dispatch_val__10045 = cljs.core.apply.call(null, dispatch_fn, args);
  var target_fn__10046 = cljs.core._get_method.call(null, mf, dispatch_val__10045);
  if(cljs.core.truth_(target_fn__10046)) {
  }else {
    throw new Error([cljs.core.str("No method in multimethod '"), cljs.core.str(cljs.core.name), cljs.core.str("' for dispatch value: "), cljs.core.str(dispatch_val__10045)].join(""));
  }
  return cljs.core.apply.call(null, target_fn__10046, args)
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
cljs.core.MultiFn.cljs$lang$ctorPrSeq = function(this__2337__auto__) {
  return cljs.core.list.call(null, "cljs.core/MultiFn")
};
cljs.core.MultiFn.prototype.cljs$core$IHash$_hash$arity$1 = function(this$) {
  var this__10047 = this;
  return goog.getUid(this$)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_reset$arity$1 = function(mf) {
  var this__10048 = this;
  cljs.core.swap_BANG_.call(null, this__10048.method_table, function(mf) {
    return cljs.core.ObjMap.EMPTY
  });
  cljs.core.swap_BANG_.call(null, this__10048.method_cache, function(mf) {
    return cljs.core.ObjMap.EMPTY
  });
  cljs.core.swap_BANG_.call(null, this__10048.prefer_table, function(mf) {
    return cljs.core.ObjMap.EMPTY
  });
  cljs.core.swap_BANG_.call(null, this__10048.cached_hierarchy, function(mf) {
    return null
  });
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_add_method$arity$3 = function(mf, dispatch_val, method) {
  var this__10049 = this;
  cljs.core.swap_BANG_.call(null, this__10049.method_table, cljs.core.assoc, dispatch_val, method);
  cljs.core.reset_cache.call(null, this__10049.method_cache, this__10049.method_table, this__10049.cached_hierarchy, this__10049.hierarchy);
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_remove_method$arity$2 = function(mf, dispatch_val) {
  var this__10050 = this;
  cljs.core.swap_BANG_.call(null, this__10050.method_table, cljs.core.dissoc, dispatch_val);
  cljs.core.reset_cache.call(null, this__10050.method_cache, this__10050.method_table, this__10050.cached_hierarchy, this__10050.hierarchy);
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_get_method$arity$2 = function(mf, dispatch_val) {
  var this__10051 = this;
  if(cljs.core._EQ_.call(null, cljs.core.deref.call(null, this__10051.cached_hierarchy), cljs.core.deref.call(null, this__10051.hierarchy))) {
  }else {
    cljs.core.reset_cache.call(null, this__10051.method_cache, this__10051.method_table, this__10051.cached_hierarchy, this__10051.hierarchy)
  }
  var temp__3971__auto____10052 = cljs.core.deref.call(null, this__10051.method_cache).call(null, dispatch_val);
  if(cljs.core.truth_(temp__3971__auto____10052)) {
    var target_fn__10053 = temp__3971__auto____10052;
    return target_fn__10053
  }else {
    var temp__3971__auto____10054 = cljs.core.find_and_cache_best_method.call(null, this__10051.name, dispatch_val, this__10051.hierarchy, this__10051.method_table, this__10051.prefer_table, this__10051.method_cache, this__10051.cached_hierarchy);
    if(cljs.core.truth_(temp__3971__auto____10054)) {
      var target_fn__10055 = temp__3971__auto____10054;
      return target_fn__10055
    }else {
      return cljs.core.deref.call(null, this__10051.method_table).call(null, this__10051.default_dispatch_val)
    }
  }
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_prefer_method$arity$3 = function(mf, dispatch_val_x, dispatch_val_y) {
  var this__10056 = this;
  if(cljs.core.truth_(cljs.core.prefers_STAR_.call(null, dispatch_val_x, dispatch_val_y, this__10056.prefer_table))) {
    throw new Error([cljs.core.str("Preference conflict in multimethod '"), cljs.core.str(this__10056.name), cljs.core.str("': "), cljs.core.str(dispatch_val_y), cljs.core.str(" is already preferred to "), cljs.core.str(dispatch_val_x)].join(""));
  }else {
  }
  cljs.core.swap_BANG_.call(null, this__10056.prefer_table, function(old) {
    return cljs.core.assoc.call(null, old, dispatch_val_x, cljs.core.conj.call(null, cljs.core._lookup.call(null, old, dispatch_val_x, cljs.core.PersistentHashSet.EMPTY), dispatch_val_y))
  });
  return cljs.core.reset_cache.call(null, this__10056.method_cache, this__10056.method_table, this__10056.cached_hierarchy, this__10056.hierarchy)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_methods$arity$1 = function(mf) {
  var this__10057 = this;
  return cljs.core.deref.call(null, this__10057.method_table)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_prefers$arity$1 = function(mf) {
  var this__10058 = this;
  return cljs.core.deref.call(null, this__10058.prefer_table)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_dispatch$arity$2 = function(mf, args) {
  var this__10059 = this;
  return cljs.core.do_dispatch.call(null, mf, this__10059.dispatch_fn, args)
};
cljs.core.MultiFn;
cljs.core.MultiFn.prototype.call = function() {
  var G__10061__delegate = function(_, args) {
    var self__10060 = this;
    return cljs.core._dispatch.call(null, self__10060, args)
  };
  var G__10061 = function(_, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return G__10061__delegate.call(this, _, args)
  };
  G__10061.cljs$lang$maxFixedArity = 1;
  G__10061.cljs$lang$applyTo = function(arglist__10062) {
    var _ = cljs.core.first(arglist__10062);
    var args = cljs.core.rest(arglist__10062);
    return G__10061__delegate(_, args)
  };
  G__10061.cljs$lang$arity$variadic = G__10061__delegate;
  return G__10061
}();
cljs.core.MultiFn.prototype.apply = function(_, args) {
  var self__10063 = this;
  return cljs.core._dispatch.call(null, self__10063, args)
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
cljs.core.UUID.cljs$lang$ctorPrSeq = function(this__2337__auto__) {
  return cljs.core.list.call(null, "cljs.core/UUID")
};
cljs.core.UUID.prototype.cljs$core$IHash$_hash$arity$1 = function(this$) {
  var this__10064 = this;
  return goog.string.hashCode(cljs.core.pr_str.call(null, this$))
};
cljs.core.UUID.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(_10066, _) {
  var this__10065 = this;
  return cljs.core.list.call(null, [cljs.core.str('#uuid "'), cljs.core.str(this__10065.uuid), cljs.core.str('"')].join(""))
};
cljs.core.UUID.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(_, other) {
  var this__10067 = this;
  var and__3822__auto____10068 = cljs.core.instance_QMARK_.call(null, cljs.core.UUID, other);
  if(and__3822__auto____10068) {
    return this__10067.uuid === other.uuid
  }else {
    return and__3822__auto____10068
  }
};
cljs.core.UUID.prototype.toString = function() {
  var this__10069 = this;
  var this__10070 = this;
  return cljs.core.pr_str.call(null, this__10070)
};
cljs.core.UUID;
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
goog.provide("goog.events.EventType");
goog.require("goog.userAgent");
goog.events.EventType = {CLICK:"click", DBLCLICK:"dblclick", MOUSEDOWN:"mousedown", MOUSEUP:"mouseup", MOUSEOVER:"mouseover", MOUSEOUT:"mouseout", MOUSEMOVE:"mousemove", SELECTSTART:"selectstart", KEYPRESS:"keypress", KEYDOWN:"keydown", KEYUP:"keyup", BLUR:"blur", FOCUS:"focus", DEACTIVATE:"deactivate", FOCUSIN:goog.userAgent.IE ? "focusin" : "DOMFocusIn", FOCUSOUT:goog.userAgent.IE ? "focusout" : "DOMFocusOut", CHANGE:"change", SELECT:"select", SUBMIT:"submit", INPUT:"input", PROPERTYCHANGE:"propertychange", 
DRAGSTART:"dragstart", DRAGENTER:"dragenter", DRAGOVER:"dragover", DRAGLEAVE:"dragleave", DROP:"drop", TOUCHSTART:"touchstart", TOUCHMOVE:"touchmove", TOUCHEND:"touchend", TOUCHCANCEL:"touchcancel", CONTEXTMENU:"contextmenu", ERROR:"error", HELP:"help", LOAD:"load", LOSECAPTURE:"losecapture", READYSTATECHANGE:"readystatechange", RESIZE:"resize", SCROLL:"scroll", UNLOAD:"unload", HASHCHANGE:"hashchange", PAGEHIDE:"pagehide", PAGESHOW:"pageshow", POPSTATE:"popstate", COPY:"copy", PASTE:"paste", CUT:"cut", 
BEFORECOPY:"beforecopy", BEFORECUT:"beforecut", BEFOREPASTE:"beforepaste", MESSAGE:"message", CONNECT:"connect", TRANSITIONEND:goog.userAgent.WEBKIT ? "webkitTransitionEnd" : goog.userAgent.OPERA ? "oTransitionEnd" : "transitionend"};
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
goog.provide("goog.events.BrowserFeature");
goog.require("goog.userAgent");
goog.events.BrowserFeature = {HAS_W3C_BUTTON:!goog.userAgent.IE || goog.userAgent.isDocumentMode(9), HAS_W3C_EVENT_SUPPORT:!goog.userAgent.IE || goog.userAgent.isDocumentMode(9), SET_KEY_CODE_TO_PREVENT_DEFAULT:goog.userAgent.IE && !goog.userAgent.isVersion("8")};
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
goog.provide("goog.events.EventWrapper");
goog.events.EventWrapper = function() {
};
goog.events.EventWrapper.prototype.listen = function(src, listener, opt_capt, opt_scope, opt_eventHandler) {
};
goog.events.EventWrapper.prototype.unlisten = function(src, listener, opt_capt, opt_scope, opt_eventHandler) {
};
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
goog.provide("clojure.browser.event");
goog.require("cljs.core");
goog.require("goog.events.EventType");
goog.require("goog.events.EventTarget");
goog.require("goog.events");
clojure.browser.event.EventType = {};
clojure.browser.event.event_types = function event_types(this$) {
  if(function() {
    var and__3822__auto____34855 = this$;
    if(and__3822__auto____34855) {
      return this$.clojure$browser$event$EventType$event_types$arity$1
    }else {
      return and__3822__auto____34855
    }
  }()) {
    return this$.clojure$browser$event$EventType$event_types$arity$1(this$)
  }else {
    var x__2391__auto____34856 = this$ == null ? null : this$;
    return function() {
      var or__3824__auto____34857 = clojure.browser.event.event_types[goog.typeOf(x__2391__auto____34856)];
      if(or__3824__auto____34857) {
        return or__3824__auto____34857
      }else {
        var or__3824__auto____34858 = clojure.browser.event.event_types["_"];
        if(or__3824__auto____34858) {
          return or__3824__auto____34858
        }else {
          throw cljs.core.missing_protocol.call(null, "EventType.event-types", this$);
        }
      }
    }().call(null, this$)
  }
};
Element.prototype.clojure$browser$event$EventType$ = true;
Element.prototype.clojure$browser$event$EventType$event_types$arity$1 = function(this$) {
  return cljs.core.into.call(null, cljs.core.ObjMap.EMPTY, cljs.core.map.call(null, function(p__34859) {
    var vec__34860__34861 = p__34859;
    var k__34862 = cljs.core.nth.call(null, vec__34860__34861, 0, null);
    var v__34863 = cljs.core.nth.call(null, vec__34860__34861, 1, null);
    return cljs.core.PersistentVector.fromArray([cljs.core.keyword.call(null, k__34862.toLowerCase()), v__34863], true)
  }, cljs.core.merge.call(null, cljs.core.js__GT_clj.call(null, goog.events.EventType))))
};
goog.events.EventTarget.prototype.clojure$browser$event$EventType$ = true;
goog.events.EventTarget.prototype.clojure$browser$event$EventType$event_types$arity$1 = function(this$) {
  return cljs.core.into.call(null, cljs.core.ObjMap.EMPTY, cljs.core.map.call(null, function(p__34864) {
    var vec__34865__34866 = p__34864;
    var k__34867 = cljs.core.nth.call(null, vec__34865__34866, 0, null);
    var v__34868 = cljs.core.nth.call(null, vec__34865__34866, 1, null);
    return cljs.core.PersistentVector.fromArray([cljs.core.keyword.call(null, k__34867.toLowerCase()), v__34868], true)
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
goog.provide("goog.dom.BrowserFeature");
goog.require("goog.userAgent");
goog.dom.BrowserFeature = {CAN_ADD_NAME_OR_TYPE_ATTRIBUTES:!goog.userAgent.IE || goog.userAgent.isDocumentMode(9), CAN_USE_CHILDREN_ATTRIBUTE:!goog.userAgent.GECKO && !goog.userAgent.IE || goog.userAgent.IE && goog.userAgent.isDocumentMode(9) || goog.userAgent.GECKO && goog.userAgent.isVersion("1.9.1"), CAN_USE_INNER_TEXT:goog.userAgent.IE && !goog.userAgent.isVersion("9"), INNER_HTML_NEEDS_SCOPED_ELEMENT:goog.userAgent.IE};
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
  append.cljs$lang$applyTo = function(arglist__16854) {
    var parent = cljs.core.first(arglist__16854);
    var children = cljs.core.rest(arglist__16854);
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
      var and__3822__auto____16867 = this$;
      if(and__3822__auto____16867) {
        return this$.clojure$browser$dom$DOMBuilder$_element$arity$1
      }else {
        return and__3822__auto____16867
      }
    }()) {
      return this$.clojure$browser$dom$DOMBuilder$_element$arity$1(this$)
    }else {
      var x__2391__auto____16868 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____16869 = clojure.browser.dom._element[goog.typeOf(x__2391__auto____16868)];
        if(or__3824__auto____16869) {
          return or__3824__auto____16869
        }else {
          var or__3824__auto____16870 = clojure.browser.dom._element["_"];
          if(or__3824__auto____16870) {
            return or__3824__auto____16870
          }else {
            throw cljs.core.missing_protocol.call(null, "DOMBuilder.-element", this$);
          }
        }
      }().call(null, this$)
    }
  };
  var _element__2 = function(this$, attrs_or_children) {
    if(function() {
      var and__3822__auto____16871 = this$;
      if(and__3822__auto____16871) {
        return this$.clojure$browser$dom$DOMBuilder$_element$arity$2
      }else {
        return and__3822__auto____16871
      }
    }()) {
      return this$.clojure$browser$dom$DOMBuilder$_element$arity$2(this$, attrs_or_children)
    }else {
      var x__2391__auto____16872 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____16873 = clojure.browser.dom._element[goog.typeOf(x__2391__auto____16872)];
        if(or__3824__auto____16873) {
          return or__3824__auto____16873
        }else {
          var or__3824__auto____16874 = clojure.browser.dom._element["_"];
          if(or__3824__auto____16874) {
            return or__3824__auto____16874
          }else {
            throw cljs.core.missing_protocol.call(null, "DOMBuilder.-element", this$);
          }
        }
      }().call(null, this$, attrs_or_children)
    }
  };
  var _element__3 = function(this$, attrs, children) {
    if(function() {
      var and__3822__auto____16875 = this$;
      if(and__3822__auto____16875) {
        return this$.clojure$browser$dom$DOMBuilder$_element$arity$3
      }else {
        return and__3822__auto____16875
      }
    }()) {
      return this$.clojure$browser$dom$DOMBuilder$_element$arity$3(this$, attrs, children)
    }else {
      var x__2391__auto____16876 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____16877 = clojure.browser.dom._element[goog.typeOf(x__2391__auto____16876)];
        if(or__3824__auto____16877) {
          return or__3824__auto____16877
        }else {
          var or__3824__auto____16878 = clojure.browser.dom._element["_"];
          if(or__3824__auto____16878) {
            return or__3824__auto____16878
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
  log.cljs$lang$applyTo = function(arglist__16879) {
    var args = cljs.core.seq(arglist__16879);
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
  var tag__16880 = cljs.core.first.call(null, this$);
  var attrs__16881 = cljs.core.second.call(null, this$);
  var children__16882 = cljs.core.drop.call(null, 2, this$);
  if(cljs.core.map_QMARK_.call(null, attrs__16881)) {
    return clojure.browser.dom._element.call(null, tag__16880, attrs__16881, children__16882)
  }else {
    return clojure.browser.dom._element.call(null, tag__16880, null, cljs.core.rest.call(null, this$))
  }
};
clojure.browser.dom.DOMBuilder["string"] = true;
clojure.browser.dom._element["string"] = function() {
  var G__16895 = null;
  var G__16895__1 = function(this$) {
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
  var G__16895__2 = function(this$, attrs_or_children) {
    clojure.browser.dom.log.call(null, "string (-element ", this$, " ", attrs_or_children, ")");
    var attrs__16883 = cljs.core.first.call(null, attrs_or_children);
    if(cljs.core.map_QMARK_.call(null, attrs__16883)) {
      return clojure.browser.dom._element.call(null, this$, attrs__16883, cljs.core.rest.call(null, attrs_or_children))
    }else {
      return clojure.browser.dom._element.call(null, this$, null, attrs_or_children)
    }
  };
  var G__16895__3 = function(this$, attrs, children) {
    clojure.browser.dom.log.call(null, "string (-element ", this$, " ", attrs, " ", children, ")");
    var str_attrs__16894 = cljs.core.truth_(function() {
      var and__3822__auto____16884 = cljs.core.map_QMARK_.call(null, attrs);
      if(and__3822__auto____16884) {
        return cljs.core.seq.call(null, attrs)
      }else {
        return and__3822__auto____16884
      }
    }()) ? cljs.core.reduce.call(null, function(o, p__16885) {
      var vec__16886__16887 = p__16885;
      var k__16888 = cljs.core.nth.call(null, vec__16886__16887, 0, null);
      var v__16889 = cljs.core.nth.call(null, vec__16886__16887, 1, null);
      var o__16890 = o == null ? {} : o;
      clojure.browser.dom.log.call(null, "o = ", o__16890);
      clojure.browser.dom.log.call(null, "k = ", k__16888);
      clojure.browser.dom.log.call(null, "v = ", v__16889);
      if(function() {
        var or__3824__auto____16891 = cljs.core.keyword_QMARK_.call(null, k__16888);
        if(or__3824__auto____16891) {
          return or__3824__auto____16891
        }else {
          return cljs.core.string_QMARK_.call(null, k__16888)
        }
      }()) {
        var G__16892__16893 = o__16890;
        G__16892__16893[cljs.core.name.call(null, k__16888)] = v__16889;
        return G__16892__16893
      }else {
        return null
      }
    }, {}, attrs) : null;
    clojure.browser.dom.log_obj.call(null, str_attrs__16894);
    if(cljs.core.seq.call(null, children)) {
      return cljs.core.apply.call(null, goog.dom.createDom, cljs.core.name.call(null, this$), str_attrs__16894, cljs.core.map.call(null, clojure.browser.dom._element, children))
    }else {
      return goog.dom.createDom(cljs.core.name.call(null, this$), str_attrs__16894)
    }
  };
  G__16895 = function(this$, attrs, children) {
    switch(arguments.length) {
      case 1:
        return G__16895__1.call(this, this$);
      case 2:
        return G__16895__2.call(this, this$, attrs);
      case 3:
        return G__16895__3.call(this, this$, attrs, children)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__16895
}();
clojure.browser.dom.element = function() {
  var element = null;
  var element__1 = function(tag_or_text) {
    clojure.browser.dom.log.call(null, "(element ", tag_or_text, ")");
    return clojure.browser.dom._element.call(null, tag_or_text)
  };
  var element__2 = function() {
    var G__16898__delegate = function(tag, children) {
      clojure.browser.dom.log.call(null, "(element ", tag, " ", children, ")");
      var attrs__16897 = cljs.core.first.call(null, children);
      if(cljs.core.map_QMARK_.call(null, attrs__16897)) {
        return clojure.browser.dom._element.call(null, tag, attrs__16897, cljs.core.rest.call(null, children))
      }else {
        return clojure.browser.dom._element.call(null, tag, null, children)
      }
    };
    var G__16898 = function(tag, var_args) {
      var children = null;
      if(goog.isDef(var_args)) {
        children = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__16898__delegate.call(this, tag, children)
    };
    G__16898.cljs$lang$maxFixedArity = 1;
    G__16898.cljs$lang$applyTo = function(arglist__16899) {
      var tag = cljs.core.first(arglist__16899);
      var children = cljs.core.rest(arglist__16899);
      return G__16898__delegate(tag, children)
    };
    G__16898.cljs$lang$arity$variadic = G__16898__delegate;
    return G__16898
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
  var parent__16901 = goog.dom.getElement(cljs.core.name.call(null, id));
  return goog.dom.removeChildren(parent__16901)
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
  var old_node__16904 = clojure.browser.dom.ensure_element.call(null, old_node);
  var new_node__16905 = clojure.browser.dom.ensure_element.call(null, new_node);
  goog.dom.replaceNode(new_node__16905, old_node__16904);
  return new_node__16905
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
      var s__42188 = s;
      var limit__42189 = limit;
      var parts__42190 = cljs.core.PersistentVector.EMPTY;
      while(true) {
        if(cljs.core._EQ_.call(null, limit__42189, 1)) {
          return cljs.core.conj.call(null, parts__42190, s__42188)
        }else {
          var temp__3971__auto____42191 = cljs.core.re_find.call(null, re, s__42188);
          if(cljs.core.truth_(temp__3971__auto____42191)) {
            var m__42192 = temp__3971__auto____42191;
            var index__42193 = s__42188.indexOf(m__42192);
            var G__42194 = s__42188.substring(index__42193 + cljs.core.count.call(null, m__42192));
            var G__42195 = limit__42189 - 1;
            var G__42196 = cljs.core.conj.call(null, parts__42190, s__42188.substring(0, index__42193));
            s__42188 = G__42194;
            limit__42189 = G__42195;
            parts__42190 = G__42196;
            continue
          }else {
            return cljs.core.conj.call(null, parts__42190, s__42188)
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
  var index__42200 = s.length;
  while(true) {
    if(index__42200 === 0) {
      return""
    }else {
      var ch__42201 = cljs.core._lookup.call(null, s, index__42200 - 1, null);
      if(function() {
        var or__3824__auto____42202 = cljs.core._EQ_.call(null, ch__42201, "\n");
        if(or__3824__auto____42202) {
          return or__3824__auto____42202
        }else {
          return cljs.core._EQ_.call(null, ch__42201, "\r")
        }
      }()) {
        var G__42203 = index__42200 - 1;
        index__42200 = G__42203;
        continue
      }else {
        return s.substring(0, index__42200)
      }
    }
    break
  }
};
clojure.string.blank_QMARK_ = function blank_QMARK_(s) {
  var s__42207 = [cljs.core.str(s)].join("");
  if(cljs.core.truth_(function() {
    var or__3824__auto____42208 = cljs.core.not.call(null, s__42207);
    if(or__3824__auto____42208) {
      return or__3824__auto____42208
    }else {
      var or__3824__auto____42209 = cljs.core._EQ_.call(null, "", s__42207);
      if(or__3824__auto____42209) {
        return or__3824__auto____42209
      }else {
        return cljs.core.re_matches.call(null, /\s+/, s__42207)
      }
    }
  }())) {
    return true
  }else {
    return false
  }
};
clojure.string.escape = function escape(s, cmap) {
  var buffer__42216 = new goog.string.StringBuffer;
  var length__42217 = s.length;
  var index__42218 = 0;
  while(true) {
    if(cljs.core._EQ_.call(null, length__42217, index__42218)) {
      return buffer__42216.toString()
    }else {
      var ch__42219 = s.charAt(index__42218);
      var temp__3971__auto____42220 = cljs.core._lookup.call(null, cmap, ch__42219, null);
      if(cljs.core.truth_(temp__3971__auto____42220)) {
        var replacement__42221 = temp__3971__auto____42220;
        buffer__42216.append([cljs.core.str(replacement__42221)].join(""))
      }else {
        buffer__42216.append(ch__42219)
      }
      var G__42222 = index__42218 + 1;
      index__42218 = G__42222;
      continue
    }
    break
  }
};
goog.provide("onedit");
goog.require("cljs.core");
goog.require("goog.events.EventType");
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
onedit.Editor.prototype.cljs$core$IHash$_hash$arity$1 = function(this__2346__auto__) {
  var this__140617 = this;
  var h__2220__auto____140618 = this__140617.__hash;
  if(!(h__2220__auto____140618 == null)) {
    return h__2220__auto____140618
  }else {
    var h__2220__auto____140619 = cljs.core.hash_imap.call(null, this__2346__auto__);
    this__140617.__hash = h__2220__auto____140619;
    return h__2220__auto____140619
  }
};
onedit.Editor.prototype.cljs$core$ILookup$_lookup$arity$2 = function(this__2351__auto__, k__2352__auto__) {
  var this__140620 = this;
  return this__2351__auto__.cljs$core$ILookup$_lookup$arity$3(this__2351__auto__, k__2352__auto__, null)
};
onedit.Editor.prototype.cljs$core$ILookup$_lookup$arity$3 = function(this__2353__auto__, k140615, else__2354__auto__) {
  var this__140621 = this;
  if(k140615 === "\ufdd0'buffer") {
    return this__140621.buffer
  }else {
    if(k140615 === "\ufdd0'cursor") {
      return this__140621.cursor
    }else {
      if("\ufdd0'else") {
        return cljs.core._lookup.call(null, this__140621.__extmap, k140615, else__2354__auto__)
      }else {
        return null
      }
    }
  }
};
onedit.Editor.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(this__2358__auto__, k__2359__auto__, G__140614) {
  var this__140622 = this;
  var pred__140623__140626 = cljs.core.identical_QMARK_;
  var expr__140624__140627 = k__2359__auto__;
  if(pred__140623__140626.call(null, "\ufdd0'buffer", expr__140624__140627)) {
    return new onedit.Editor(G__140614, this__140622.cursor, this__140622.__meta, this__140622.__extmap, null)
  }else {
    if(pred__140623__140626.call(null, "\ufdd0'cursor", expr__140624__140627)) {
      return new onedit.Editor(this__140622.buffer, G__140614, this__140622.__meta, this__140622.__extmap, null)
    }else {
      return new onedit.Editor(this__140622.buffer, this__140622.cursor, this__140622.__meta, cljs.core.assoc.call(null, this__140622.__extmap, k__2359__auto__, G__140614), null)
    }
  }
};
onedit.Editor.prototype.cljs$core$ICollection$_conj$arity$2 = function(this__2356__auto__, entry__2357__auto__) {
  var this__140628 = this;
  if(cljs.core.vector_QMARK_.call(null, entry__2357__auto__)) {
    return this__2356__auto__.cljs$core$IAssociative$_assoc$arity$3(this__2356__auto__, cljs.core._nth.call(null, entry__2357__auto__, 0), cljs.core._nth.call(null, entry__2357__auto__, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, this__2356__auto__, entry__2357__auto__)
  }
};
onedit.Editor.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this__2363__auto__) {
  var this__140629 = this;
  return cljs.core.seq.call(null, cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray([cljs.core.vector.call(null, "\ufdd0'buffer", this__140629.buffer), cljs.core.vector.call(null, "\ufdd0'cursor", this__140629.cursor)], true), this__140629.__extmap))
};
onedit.Editor.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(this__2365__auto__, opts__2366__auto__) {
  var this__140630 = this;
  var pr_pair__2367__auto____140631 = function(keyval__2368__auto__) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts__2366__auto__, keyval__2368__auto__)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__2367__auto____140631, [cljs.core.str("#"), cljs.core.str("Editor"), cljs.core.str("{")].join(""), ", ", "}", opts__2366__auto__, cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray([cljs.core.vector.call(null, "\ufdd0'buffer", this__140630.buffer), cljs.core.vector.call(null, "\ufdd0'cursor", this__140630.cursor)], true), this__140630.__extmap))
};
onedit.Editor.prototype.cljs$core$ICounted$_count$arity$1 = function(this__2355__auto__) {
  var this__140632 = this;
  return 2 + cljs.core.count.call(null, this__140632.__extmap)
};
onedit.Editor.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(this__2347__auto__, other__2348__auto__) {
  var this__140633 = this;
  if(cljs.core.truth_(function() {
    var and__3822__auto____140634 = other__2348__auto__;
    if(cljs.core.truth_(and__3822__auto____140634)) {
      var and__3822__auto____140635 = this__2347__auto__.constructor === other__2348__auto__.constructor;
      if(and__3822__auto____140635) {
        return cljs.core.equiv_map.call(null, this__2347__auto__, other__2348__auto__)
      }else {
        return and__3822__auto____140635
      }
    }else {
      return and__3822__auto____140634
    }
  }())) {
    return true
  }else {
    return false
  }
};
onedit.Editor.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(this__2350__auto__, G__140614) {
  var this__140636 = this;
  return new onedit.Editor(this__140636.buffer, this__140636.cursor, G__140614, this__140636.__extmap, this__140636.__hash)
};
onedit.Editor.prototype.cljs$core$IMeta$_meta$arity$1 = function(this__2349__auto__) {
  var this__140637 = this;
  return this__140637.__meta
};
onedit.Editor.prototype.cljs$core$IMap$_dissoc$arity$2 = function(this__2360__auto__, k__2361__auto__) {
  var this__140638 = this;
  if(cljs.core.contains_QMARK_.call(null, cljs.core.PersistentHashSet.fromArray(["\ufdd0'buffer", "\ufdd0'cursor"]), k__2361__auto__)) {
    return cljs.core.dissoc.call(null, cljs.core.with_meta.call(null, cljs.core.into.call(null, cljs.core.ObjMap.EMPTY, this__2360__auto__), this__140638.__meta), k__2361__auto__)
  }else {
    return new onedit.Editor(this__140638.buffer, this__140638.cursor, this__140638.__meta, cljs.core.not_empty.call(null, cljs.core.dissoc.call(null, this__140638.__extmap, k__2361__auto__)), null)
  }
};
onedit.Editor.cljs$lang$type = true;
onedit.Editor.cljs$lang$ctorPrSeq = function(this__2385__auto__) {
  return cljs.core.list.call(null, "onedit/Editor")
};
onedit.__GT_Editor = function __GT_Editor(buffer, cursor) {
  return new onedit.Editor(buffer, cursor)
};
onedit.map__GT_Editor = function map__GT_Editor(G__140616) {
  return new onedit.Editor((new cljs.core.Keyword("\ufdd0'buffer")).call(null, G__140616), (new cljs.core.Keyword("\ufdd0'cursor")).call(null, G__140616), null, cljs.core.dissoc.call(null, G__140616, "\ufdd0'buffer", "\ufdd0'cursor"))
};
onedit.Editor;
onedit.open = function open(file) {
  var reader__140640 = new FileReader;
  return reader__140640.readAsText(file)
};
onedit.save = function save() {
  return null
};
onedit.insert = function insert(string, editor) {
  var buffer__140642 = clojure.string.join.call(null, cljs.core.split_at.call(null, (new cljs.core.Keyword("\ufdd0'cursor")).call(null, editor), (new cljs.core.Keyword("\ufdd0'buffer")).call(null, editor)));
  return cljs.core.assoc.call(null, editor, "\ufdd0'buffer", buffer__140642)
};
onedit.functions = cljs.core.PersistentVector.fromArray([onedit.insert], true);
onedit.function_map = function function_map() {
  return onedit.functions
};
onedit.exec = function exec(buffer, minibuffer, event) {
  var value__140649 = clojure.browser.dom.get_value.call(null, minibuffer);
  var vec__140648__140650 = clojure.string.split.call(null, value__140649, / /);
  var f__140651 = cljs.core.nth.call(null, vec__140648__140650, 0, null);
  var args__140652 = cljs.core.nthnext.call(null, vec__140648__140650, 1);
  clojure.browser.dom.log.call(null, f__140651);
  clojure.browser.dom.log.call(null, args__140652);
  return clojure.browser.dom.set_text.call(null, buffer, "")
};
onedit.main = function main() {
  var buffer__140655 = clojure.browser.dom.get_element.call(null, "buffer");
  var minibuffer__140656 = clojure.browser.dom.get_element.call(null, "minibuffer");
  return clojure.browser.event.listen.call(null, minibuffer__140656, goog.events.EventType.CHANGE, cljs.core.partial.call(null, onedit.exec, buffer__140655, minibuffer__140656))
};
