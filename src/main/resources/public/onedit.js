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
goog.provide("goog.debug.Error");
goog.debug.Error = function(opt_msg) {
  this.stack = (new Error).stack || "";
  if(opt_msg) {
    this.message = String(opt_msg)
  }
};
goog.inherits(goog.debug.Error, Error);
goog.debug.Error.prototype.name = "CustomError";
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
goog.require("goog.string");
goog.require("goog.string.StringBuffer");
goog.require("goog.object");
goog.require("goog.array");
cljs.core._STAR_unchecked_if_STAR_ = false;
cljs.core._STAR_print_fn_STAR_ = function _STAR_print_fn_STAR_(_) {
  throw new Error("No *print-fn* fn set for evaluation environment");
};
void 0;
void 0;
void 0;
cljs.core.truth_ = function truth_(x) {
  return x != null && x !== false
};
void 0;
cljs.core.type_satisfies_ = function type_satisfies_(p, x) {
  if(p[goog.typeOf.call(null, x)]) {
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
void 0;
cljs.core.is_proto_ = function is_proto_(x) {
  return x.constructor.prototype === x
};
cljs.core._STAR_main_cli_fn_STAR_ = null;
cljs.core.missing_protocol = function missing_protocol(proto, obj) {
  return Error("No protocol method " + proto + " defined for type " + goog.typeOf.call(null, obj) + ": " + obj)
};
cljs.core.aclone = function aclone(array_like) {
  return Array.prototype.slice.call(array_like)
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
void 0;
cljs.core.aget = function() {
  var aget = null;
  var aget__2 = function(array, i) {
    return array[i]
  };
  var aget__3 = function() {
    var G__4452__delegate = function(array, i, idxs) {
      return cljs.core.apply.call(null, aget, aget.call(null, array, i), idxs)
    };
    var G__4452 = function(array, i, var_args) {
      var idxs = null;
      if(goog.isDef(var_args)) {
        idxs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__4452__delegate.call(this, array, i, idxs)
    };
    G__4452.cljs$lang$maxFixedArity = 2;
    G__4452.cljs$lang$applyTo = function(arglist__4453) {
      var array = cljs.core.first(arglist__4453);
      var i = cljs.core.first(cljs.core.next(arglist__4453));
      var idxs = cljs.core.rest(cljs.core.next(arglist__4453));
      return G__4452__delegate(array, i, idxs)
    };
    G__4452.cljs$lang$arity$variadic = G__4452__delegate;
    return G__4452
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
void 0;
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
void 0;
cljs.core.IFn = {};
cljs.core._invoke = function() {
  var _invoke = null;
  var _invoke__1 = function(this$) {
    if(function() {
      var and__3822__auto____4454 = this$;
      if(and__3822__auto____4454) {
        return this$.cljs$core$IFn$_invoke$arity$1
      }else {
        return and__3822__auto____4454
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$1(this$)
    }else {
      return function() {
        var or__3824__auto____4455 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3824__auto____4455) {
          return or__3824__auto____4455
        }else {
          var or__3824__auto____4456 = cljs.core._invoke["_"];
          if(or__3824__auto____4456) {
            return or__3824__auto____4456
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$)
    }
  };
  var _invoke__2 = function(this$, a) {
    if(function() {
      var and__3822__auto____4457 = this$;
      if(and__3822__auto____4457) {
        return this$.cljs$core$IFn$_invoke$arity$2
      }else {
        return and__3822__auto____4457
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$2(this$, a)
    }else {
      return function() {
        var or__3824__auto____4458 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3824__auto____4458) {
          return or__3824__auto____4458
        }else {
          var or__3824__auto____4459 = cljs.core._invoke["_"];
          if(or__3824__auto____4459) {
            return or__3824__auto____4459
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a)
    }
  };
  var _invoke__3 = function(this$, a, b) {
    if(function() {
      var and__3822__auto____4460 = this$;
      if(and__3822__auto____4460) {
        return this$.cljs$core$IFn$_invoke$arity$3
      }else {
        return and__3822__auto____4460
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$3(this$, a, b)
    }else {
      return function() {
        var or__3824__auto____4461 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3824__auto____4461) {
          return or__3824__auto____4461
        }else {
          var or__3824__auto____4462 = cljs.core._invoke["_"];
          if(or__3824__auto____4462) {
            return or__3824__auto____4462
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b)
    }
  };
  var _invoke__4 = function(this$, a, b, c) {
    if(function() {
      var and__3822__auto____4463 = this$;
      if(and__3822__auto____4463) {
        return this$.cljs$core$IFn$_invoke$arity$4
      }else {
        return and__3822__auto____4463
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$4(this$, a, b, c)
    }else {
      return function() {
        var or__3824__auto____4464 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3824__auto____4464) {
          return or__3824__auto____4464
        }else {
          var or__3824__auto____4465 = cljs.core._invoke["_"];
          if(or__3824__auto____4465) {
            return or__3824__auto____4465
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c)
    }
  };
  var _invoke__5 = function(this$, a, b, c, d) {
    if(function() {
      var and__3822__auto____4466 = this$;
      if(and__3822__auto____4466) {
        return this$.cljs$core$IFn$_invoke$arity$5
      }else {
        return and__3822__auto____4466
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$5(this$, a, b, c, d)
    }else {
      return function() {
        var or__3824__auto____4467 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3824__auto____4467) {
          return or__3824__auto____4467
        }else {
          var or__3824__auto____4468 = cljs.core._invoke["_"];
          if(or__3824__auto____4468) {
            return or__3824__auto____4468
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d)
    }
  };
  var _invoke__6 = function(this$, a, b, c, d, e) {
    if(function() {
      var and__3822__auto____4469 = this$;
      if(and__3822__auto____4469) {
        return this$.cljs$core$IFn$_invoke$arity$6
      }else {
        return and__3822__auto____4469
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$6(this$, a, b, c, d, e)
    }else {
      return function() {
        var or__3824__auto____4470 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3824__auto____4470) {
          return or__3824__auto____4470
        }else {
          var or__3824__auto____4471 = cljs.core._invoke["_"];
          if(or__3824__auto____4471) {
            return or__3824__auto____4471
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e)
    }
  };
  var _invoke__7 = function(this$, a, b, c, d, e, f) {
    if(function() {
      var and__3822__auto____4472 = this$;
      if(and__3822__auto____4472) {
        return this$.cljs$core$IFn$_invoke$arity$7
      }else {
        return and__3822__auto____4472
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$7(this$, a, b, c, d, e, f)
    }else {
      return function() {
        var or__3824__auto____4473 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3824__auto____4473) {
          return or__3824__auto____4473
        }else {
          var or__3824__auto____4474 = cljs.core._invoke["_"];
          if(or__3824__auto____4474) {
            return or__3824__auto____4474
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f)
    }
  };
  var _invoke__8 = function(this$, a, b, c, d, e, f, g) {
    if(function() {
      var and__3822__auto____4475 = this$;
      if(and__3822__auto____4475) {
        return this$.cljs$core$IFn$_invoke$arity$8
      }else {
        return and__3822__auto____4475
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$8(this$, a, b, c, d, e, f, g)
    }else {
      return function() {
        var or__3824__auto____4476 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3824__auto____4476) {
          return or__3824__auto____4476
        }else {
          var or__3824__auto____4477 = cljs.core._invoke["_"];
          if(or__3824__auto____4477) {
            return or__3824__auto____4477
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g)
    }
  };
  var _invoke__9 = function(this$, a, b, c, d, e, f, g, h) {
    if(function() {
      var and__3822__auto____4478 = this$;
      if(and__3822__auto____4478) {
        return this$.cljs$core$IFn$_invoke$arity$9
      }else {
        return and__3822__auto____4478
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$9(this$, a, b, c, d, e, f, g, h)
    }else {
      return function() {
        var or__3824__auto____4479 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3824__auto____4479) {
          return or__3824__auto____4479
        }else {
          var or__3824__auto____4480 = cljs.core._invoke["_"];
          if(or__3824__auto____4480) {
            return or__3824__auto____4480
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h)
    }
  };
  var _invoke__10 = function(this$, a, b, c, d, e, f, g, h, i) {
    if(function() {
      var and__3822__auto____4481 = this$;
      if(and__3822__auto____4481) {
        return this$.cljs$core$IFn$_invoke$arity$10
      }else {
        return and__3822__auto____4481
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$10(this$, a, b, c, d, e, f, g, h, i)
    }else {
      return function() {
        var or__3824__auto____4482 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3824__auto____4482) {
          return or__3824__auto____4482
        }else {
          var or__3824__auto____4483 = cljs.core._invoke["_"];
          if(or__3824__auto____4483) {
            return or__3824__auto____4483
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i)
    }
  };
  var _invoke__11 = function(this$, a, b, c, d, e, f, g, h, i, j) {
    if(function() {
      var and__3822__auto____4484 = this$;
      if(and__3822__auto____4484) {
        return this$.cljs$core$IFn$_invoke$arity$11
      }else {
        return and__3822__auto____4484
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$11(this$, a, b, c, d, e, f, g, h, i, j)
    }else {
      return function() {
        var or__3824__auto____4485 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3824__auto____4485) {
          return or__3824__auto____4485
        }else {
          var or__3824__auto____4486 = cljs.core._invoke["_"];
          if(or__3824__auto____4486) {
            return or__3824__auto____4486
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j)
    }
  };
  var _invoke__12 = function(this$, a, b, c, d, e, f, g, h, i, j, k) {
    if(function() {
      var and__3822__auto____4487 = this$;
      if(and__3822__auto____4487) {
        return this$.cljs$core$IFn$_invoke$arity$12
      }else {
        return and__3822__auto____4487
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$12(this$, a, b, c, d, e, f, g, h, i, j, k)
    }else {
      return function() {
        var or__3824__auto____4488 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3824__auto____4488) {
          return or__3824__auto____4488
        }else {
          var or__3824__auto____4489 = cljs.core._invoke["_"];
          if(or__3824__auto____4489) {
            return or__3824__auto____4489
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k)
    }
  };
  var _invoke__13 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l) {
    if(function() {
      var and__3822__auto____4490 = this$;
      if(and__3822__auto____4490) {
        return this$.cljs$core$IFn$_invoke$arity$13
      }else {
        return and__3822__auto____4490
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$13(this$, a, b, c, d, e, f, g, h, i, j, k, l)
    }else {
      return function() {
        var or__3824__auto____4491 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3824__auto____4491) {
          return or__3824__auto____4491
        }else {
          var or__3824__auto____4492 = cljs.core._invoke["_"];
          if(or__3824__auto____4492) {
            return or__3824__auto____4492
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l)
    }
  };
  var _invoke__14 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m) {
    if(function() {
      var and__3822__auto____4493 = this$;
      if(and__3822__auto____4493) {
        return this$.cljs$core$IFn$_invoke$arity$14
      }else {
        return and__3822__auto____4493
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$14(this$, a, b, c, d, e, f, g, h, i, j, k, l, m)
    }else {
      return function() {
        var or__3824__auto____4494 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3824__auto____4494) {
          return or__3824__auto____4494
        }else {
          var or__3824__auto____4495 = cljs.core._invoke["_"];
          if(or__3824__auto____4495) {
            return or__3824__auto____4495
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m)
    }
  };
  var _invoke__15 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n) {
    if(function() {
      var and__3822__auto____4496 = this$;
      if(and__3822__auto____4496) {
        return this$.cljs$core$IFn$_invoke$arity$15
      }else {
        return and__3822__auto____4496
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$15(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n)
    }else {
      return function() {
        var or__3824__auto____4497 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3824__auto____4497) {
          return or__3824__auto____4497
        }else {
          var or__3824__auto____4498 = cljs.core._invoke["_"];
          if(or__3824__auto____4498) {
            return or__3824__auto____4498
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n)
    }
  };
  var _invoke__16 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o) {
    if(function() {
      var and__3822__auto____4499 = this$;
      if(and__3822__auto____4499) {
        return this$.cljs$core$IFn$_invoke$arity$16
      }else {
        return and__3822__auto____4499
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$16(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o)
    }else {
      return function() {
        var or__3824__auto____4500 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3824__auto____4500) {
          return or__3824__auto____4500
        }else {
          var or__3824__auto____4501 = cljs.core._invoke["_"];
          if(or__3824__auto____4501) {
            return or__3824__auto____4501
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o)
    }
  };
  var _invoke__17 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p) {
    if(function() {
      var and__3822__auto____4502 = this$;
      if(and__3822__auto____4502) {
        return this$.cljs$core$IFn$_invoke$arity$17
      }else {
        return and__3822__auto____4502
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$17(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p)
    }else {
      return function() {
        var or__3824__auto____4503 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3824__auto____4503) {
          return or__3824__auto____4503
        }else {
          var or__3824__auto____4504 = cljs.core._invoke["_"];
          if(or__3824__auto____4504) {
            return or__3824__auto____4504
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p)
    }
  };
  var _invoke__18 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q) {
    if(function() {
      var and__3822__auto____4505 = this$;
      if(and__3822__auto____4505) {
        return this$.cljs$core$IFn$_invoke$arity$18
      }else {
        return and__3822__auto____4505
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$18(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q)
    }else {
      return function() {
        var or__3824__auto____4506 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3824__auto____4506) {
          return or__3824__auto____4506
        }else {
          var or__3824__auto____4507 = cljs.core._invoke["_"];
          if(or__3824__auto____4507) {
            return or__3824__auto____4507
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q)
    }
  };
  var _invoke__19 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s) {
    if(function() {
      var and__3822__auto____4508 = this$;
      if(and__3822__auto____4508) {
        return this$.cljs$core$IFn$_invoke$arity$19
      }else {
        return and__3822__auto____4508
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$19(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s)
    }else {
      return function() {
        var or__3824__auto____4509 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3824__auto____4509) {
          return or__3824__auto____4509
        }else {
          var or__3824__auto____4510 = cljs.core._invoke["_"];
          if(or__3824__auto____4510) {
            return or__3824__auto____4510
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s)
    }
  };
  var _invoke__20 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t) {
    if(function() {
      var and__3822__auto____4511 = this$;
      if(and__3822__auto____4511) {
        return this$.cljs$core$IFn$_invoke$arity$20
      }else {
        return and__3822__auto____4511
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$20(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t)
    }else {
      return function() {
        var or__3824__auto____4512 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3824__auto____4512) {
          return or__3824__auto____4512
        }else {
          var or__3824__auto____4513 = cljs.core._invoke["_"];
          if(or__3824__auto____4513) {
            return or__3824__auto____4513
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t)
    }
  };
  var _invoke__21 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest) {
    if(function() {
      var and__3822__auto____4514 = this$;
      if(and__3822__auto____4514) {
        return this$.cljs$core$IFn$_invoke$arity$21
      }else {
        return and__3822__auto____4514
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$21(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest)
    }else {
      return function() {
        var or__3824__auto____4515 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3824__auto____4515) {
          return or__3824__auto____4515
        }else {
          var or__3824__auto____4516 = cljs.core._invoke["_"];
          if(or__3824__auto____4516) {
            return or__3824__auto____4516
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
void 0;
void 0;
cljs.core.ICounted = {};
cljs.core._count = function _count(coll) {
  if(function() {
    var and__3822__auto____4517 = coll;
    if(and__3822__auto____4517) {
      return coll.cljs$core$ICounted$_count$arity$1
    }else {
      return and__3822__auto____4517
    }
  }()) {
    return coll.cljs$core$ICounted$_count$arity$1(coll)
  }else {
    return function() {
      var or__3824__auto____4518 = cljs.core._count[goog.typeOf.call(null, coll)];
      if(or__3824__auto____4518) {
        return or__3824__auto____4518
      }else {
        var or__3824__auto____4519 = cljs.core._count["_"];
        if(or__3824__auto____4519) {
          return or__3824__auto____4519
        }else {
          throw cljs.core.missing_protocol.call(null, "ICounted.-count", coll);
        }
      }
    }().call(null, coll)
  }
};
void 0;
void 0;
cljs.core.IEmptyableCollection = {};
cljs.core._empty = function _empty(coll) {
  if(function() {
    var and__3822__auto____4520 = coll;
    if(and__3822__auto____4520) {
      return coll.cljs$core$IEmptyableCollection$_empty$arity$1
    }else {
      return and__3822__auto____4520
    }
  }()) {
    return coll.cljs$core$IEmptyableCollection$_empty$arity$1(coll)
  }else {
    return function() {
      var or__3824__auto____4521 = cljs.core._empty[goog.typeOf.call(null, coll)];
      if(or__3824__auto____4521) {
        return or__3824__auto____4521
      }else {
        var or__3824__auto____4522 = cljs.core._empty["_"];
        if(or__3824__auto____4522) {
          return or__3824__auto____4522
        }else {
          throw cljs.core.missing_protocol.call(null, "IEmptyableCollection.-empty", coll);
        }
      }
    }().call(null, coll)
  }
};
void 0;
void 0;
cljs.core.ICollection = {};
cljs.core._conj = function _conj(coll, o) {
  if(function() {
    var and__3822__auto____4523 = coll;
    if(and__3822__auto____4523) {
      return coll.cljs$core$ICollection$_conj$arity$2
    }else {
      return and__3822__auto____4523
    }
  }()) {
    return coll.cljs$core$ICollection$_conj$arity$2(coll, o)
  }else {
    return function() {
      var or__3824__auto____4524 = cljs.core._conj[goog.typeOf.call(null, coll)];
      if(or__3824__auto____4524) {
        return or__3824__auto____4524
      }else {
        var or__3824__auto____4525 = cljs.core._conj["_"];
        if(or__3824__auto____4525) {
          return or__3824__auto____4525
        }else {
          throw cljs.core.missing_protocol.call(null, "ICollection.-conj", coll);
        }
      }
    }().call(null, coll, o)
  }
};
void 0;
void 0;
cljs.core.IIndexed = {};
cljs.core._nth = function() {
  var _nth = null;
  var _nth__2 = function(coll, n) {
    if(function() {
      var and__3822__auto____4526 = coll;
      if(and__3822__auto____4526) {
        return coll.cljs$core$IIndexed$_nth$arity$2
      }else {
        return and__3822__auto____4526
      }
    }()) {
      return coll.cljs$core$IIndexed$_nth$arity$2(coll, n)
    }else {
      return function() {
        var or__3824__auto____4527 = cljs.core._nth[goog.typeOf.call(null, coll)];
        if(or__3824__auto____4527) {
          return or__3824__auto____4527
        }else {
          var or__3824__auto____4528 = cljs.core._nth["_"];
          if(or__3824__auto____4528) {
            return or__3824__auto____4528
          }else {
            throw cljs.core.missing_protocol.call(null, "IIndexed.-nth", coll);
          }
        }
      }().call(null, coll, n)
    }
  };
  var _nth__3 = function(coll, n, not_found) {
    if(function() {
      var and__3822__auto____4529 = coll;
      if(and__3822__auto____4529) {
        return coll.cljs$core$IIndexed$_nth$arity$3
      }else {
        return and__3822__auto____4529
      }
    }()) {
      return coll.cljs$core$IIndexed$_nth$arity$3(coll, n, not_found)
    }else {
      return function() {
        var or__3824__auto____4530 = cljs.core._nth[goog.typeOf.call(null, coll)];
        if(or__3824__auto____4530) {
          return or__3824__auto____4530
        }else {
          var or__3824__auto____4531 = cljs.core._nth["_"];
          if(or__3824__auto____4531) {
            return or__3824__auto____4531
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
void 0;
void 0;
cljs.core.ASeq = {};
void 0;
void 0;
cljs.core.ISeq = {};
cljs.core._first = function _first(coll) {
  if(function() {
    var and__3822__auto____4532 = coll;
    if(and__3822__auto____4532) {
      return coll.cljs$core$ISeq$_first$arity$1
    }else {
      return and__3822__auto____4532
    }
  }()) {
    return coll.cljs$core$ISeq$_first$arity$1(coll)
  }else {
    return function() {
      var or__3824__auto____4533 = cljs.core._first[goog.typeOf.call(null, coll)];
      if(or__3824__auto____4533) {
        return or__3824__auto____4533
      }else {
        var or__3824__auto____4534 = cljs.core._first["_"];
        if(or__3824__auto____4534) {
          return or__3824__auto____4534
        }else {
          throw cljs.core.missing_protocol.call(null, "ISeq.-first", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._rest = function _rest(coll) {
  if(function() {
    var and__3822__auto____4535 = coll;
    if(and__3822__auto____4535) {
      return coll.cljs$core$ISeq$_rest$arity$1
    }else {
      return and__3822__auto____4535
    }
  }()) {
    return coll.cljs$core$ISeq$_rest$arity$1(coll)
  }else {
    return function() {
      var or__3824__auto____4536 = cljs.core._rest[goog.typeOf.call(null, coll)];
      if(or__3824__auto____4536) {
        return or__3824__auto____4536
      }else {
        var or__3824__auto____4537 = cljs.core._rest["_"];
        if(or__3824__auto____4537) {
          return or__3824__auto____4537
        }else {
          throw cljs.core.missing_protocol.call(null, "ISeq.-rest", coll);
        }
      }
    }().call(null, coll)
  }
};
void 0;
void 0;
cljs.core.ILookup = {};
cljs.core._lookup = function() {
  var _lookup = null;
  var _lookup__2 = function(o, k) {
    if(function() {
      var and__3822__auto____4538 = o;
      if(and__3822__auto____4538) {
        return o.cljs$core$ILookup$_lookup$arity$2
      }else {
        return and__3822__auto____4538
      }
    }()) {
      return o.cljs$core$ILookup$_lookup$arity$2(o, k)
    }else {
      return function() {
        var or__3824__auto____4539 = cljs.core._lookup[goog.typeOf.call(null, o)];
        if(or__3824__auto____4539) {
          return or__3824__auto____4539
        }else {
          var or__3824__auto____4540 = cljs.core._lookup["_"];
          if(or__3824__auto____4540) {
            return or__3824__auto____4540
          }else {
            throw cljs.core.missing_protocol.call(null, "ILookup.-lookup", o);
          }
        }
      }().call(null, o, k)
    }
  };
  var _lookup__3 = function(o, k, not_found) {
    if(function() {
      var and__3822__auto____4541 = o;
      if(and__3822__auto____4541) {
        return o.cljs$core$ILookup$_lookup$arity$3
      }else {
        return and__3822__auto____4541
      }
    }()) {
      return o.cljs$core$ILookup$_lookup$arity$3(o, k, not_found)
    }else {
      return function() {
        var or__3824__auto____4542 = cljs.core._lookup[goog.typeOf.call(null, o)];
        if(or__3824__auto____4542) {
          return or__3824__auto____4542
        }else {
          var or__3824__auto____4543 = cljs.core._lookup["_"];
          if(or__3824__auto____4543) {
            return or__3824__auto____4543
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
void 0;
void 0;
cljs.core.IAssociative = {};
cljs.core._contains_key_QMARK_ = function _contains_key_QMARK_(coll, k) {
  if(function() {
    var and__3822__auto____4544 = coll;
    if(and__3822__auto____4544) {
      return coll.cljs$core$IAssociative$_contains_key_QMARK_$arity$2
    }else {
      return and__3822__auto____4544
    }
  }()) {
    return coll.cljs$core$IAssociative$_contains_key_QMARK_$arity$2(coll, k)
  }else {
    return function() {
      var or__3824__auto____4545 = cljs.core._contains_key_QMARK_[goog.typeOf.call(null, coll)];
      if(or__3824__auto____4545) {
        return or__3824__auto____4545
      }else {
        var or__3824__auto____4546 = cljs.core._contains_key_QMARK_["_"];
        if(or__3824__auto____4546) {
          return or__3824__auto____4546
        }else {
          throw cljs.core.missing_protocol.call(null, "IAssociative.-contains-key?", coll);
        }
      }
    }().call(null, coll, k)
  }
};
cljs.core._assoc = function _assoc(coll, k, v) {
  if(function() {
    var and__3822__auto____4547 = coll;
    if(and__3822__auto____4547) {
      return coll.cljs$core$IAssociative$_assoc$arity$3
    }else {
      return and__3822__auto____4547
    }
  }()) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, k, v)
  }else {
    return function() {
      var or__3824__auto____4548 = cljs.core._assoc[goog.typeOf.call(null, coll)];
      if(or__3824__auto____4548) {
        return or__3824__auto____4548
      }else {
        var or__3824__auto____4549 = cljs.core._assoc["_"];
        if(or__3824__auto____4549) {
          return or__3824__auto____4549
        }else {
          throw cljs.core.missing_protocol.call(null, "IAssociative.-assoc", coll);
        }
      }
    }().call(null, coll, k, v)
  }
};
void 0;
void 0;
cljs.core.IMap = {};
cljs.core._dissoc = function _dissoc(coll, k) {
  if(function() {
    var and__3822__auto____4550 = coll;
    if(and__3822__auto____4550) {
      return coll.cljs$core$IMap$_dissoc$arity$2
    }else {
      return and__3822__auto____4550
    }
  }()) {
    return coll.cljs$core$IMap$_dissoc$arity$2(coll, k)
  }else {
    return function() {
      var or__3824__auto____4551 = cljs.core._dissoc[goog.typeOf.call(null, coll)];
      if(or__3824__auto____4551) {
        return or__3824__auto____4551
      }else {
        var or__3824__auto____4552 = cljs.core._dissoc["_"];
        if(or__3824__auto____4552) {
          return or__3824__auto____4552
        }else {
          throw cljs.core.missing_protocol.call(null, "IMap.-dissoc", coll);
        }
      }
    }().call(null, coll, k)
  }
};
void 0;
void 0;
cljs.core.IMapEntry = {};
cljs.core._key = function _key(coll) {
  if(function() {
    var and__3822__auto____4553 = coll;
    if(and__3822__auto____4553) {
      return coll.cljs$core$IMapEntry$_key$arity$1
    }else {
      return and__3822__auto____4553
    }
  }()) {
    return coll.cljs$core$IMapEntry$_key$arity$1(coll)
  }else {
    return function() {
      var or__3824__auto____4554 = cljs.core._key[goog.typeOf.call(null, coll)];
      if(or__3824__auto____4554) {
        return or__3824__auto____4554
      }else {
        var or__3824__auto____4555 = cljs.core._key["_"];
        if(or__3824__auto____4555) {
          return or__3824__auto____4555
        }else {
          throw cljs.core.missing_protocol.call(null, "IMapEntry.-key", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._val = function _val(coll) {
  if(function() {
    var and__3822__auto____4556 = coll;
    if(and__3822__auto____4556) {
      return coll.cljs$core$IMapEntry$_val$arity$1
    }else {
      return and__3822__auto____4556
    }
  }()) {
    return coll.cljs$core$IMapEntry$_val$arity$1(coll)
  }else {
    return function() {
      var or__3824__auto____4557 = cljs.core._val[goog.typeOf.call(null, coll)];
      if(or__3824__auto____4557) {
        return or__3824__auto____4557
      }else {
        var or__3824__auto____4558 = cljs.core._val["_"];
        if(or__3824__auto____4558) {
          return or__3824__auto____4558
        }else {
          throw cljs.core.missing_protocol.call(null, "IMapEntry.-val", coll);
        }
      }
    }().call(null, coll)
  }
};
void 0;
void 0;
cljs.core.ISet = {};
cljs.core._disjoin = function _disjoin(coll, v) {
  if(function() {
    var and__3822__auto____4559 = coll;
    if(and__3822__auto____4559) {
      return coll.cljs$core$ISet$_disjoin$arity$2
    }else {
      return and__3822__auto____4559
    }
  }()) {
    return coll.cljs$core$ISet$_disjoin$arity$2(coll, v)
  }else {
    return function() {
      var or__3824__auto____4560 = cljs.core._disjoin[goog.typeOf.call(null, coll)];
      if(or__3824__auto____4560) {
        return or__3824__auto____4560
      }else {
        var or__3824__auto____4561 = cljs.core._disjoin["_"];
        if(or__3824__auto____4561) {
          return or__3824__auto____4561
        }else {
          throw cljs.core.missing_protocol.call(null, "ISet.-disjoin", coll);
        }
      }
    }().call(null, coll, v)
  }
};
void 0;
void 0;
cljs.core.IStack = {};
cljs.core._peek = function _peek(coll) {
  if(function() {
    var and__3822__auto____4562 = coll;
    if(and__3822__auto____4562) {
      return coll.cljs$core$IStack$_peek$arity$1
    }else {
      return and__3822__auto____4562
    }
  }()) {
    return coll.cljs$core$IStack$_peek$arity$1(coll)
  }else {
    return function() {
      var or__3824__auto____4563 = cljs.core._peek[goog.typeOf.call(null, coll)];
      if(or__3824__auto____4563) {
        return or__3824__auto____4563
      }else {
        var or__3824__auto____4564 = cljs.core._peek["_"];
        if(or__3824__auto____4564) {
          return or__3824__auto____4564
        }else {
          throw cljs.core.missing_protocol.call(null, "IStack.-peek", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._pop = function _pop(coll) {
  if(function() {
    var and__3822__auto____4565 = coll;
    if(and__3822__auto____4565) {
      return coll.cljs$core$IStack$_pop$arity$1
    }else {
      return and__3822__auto____4565
    }
  }()) {
    return coll.cljs$core$IStack$_pop$arity$1(coll)
  }else {
    return function() {
      var or__3824__auto____4566 = cljs.core._pop[goog.typeOf.call(null, coll)];
      if(or__3824__auto____4566) {
        return or__3824__auto____4566
      }else {
        var or__3824__auto____4567 = cljs.core._pop["_"];
        if(or__3824__auto____4567) {
          return or__3824__auto____4567
        }else {
          throw cljs.core.missing_protocol.call(null, "IStack.-pop", coll);
        }
      }
    }().call(null, coll)
  }
};
void 0;
void 0;
cljs.core.IVector = {};
cljs.core._assoc_n = function _assoc_n(coll, n, val) {
  if(function() {
    var and__3822__auto____4568 = coll;
    if(and__3822__auto____4568) {
      return coll.cljs$core$IVector$_assoc_n$arity$3
    }else {
      return and__3822__auto____4568
    }
  }()) {
    return coll.cljs$core$IVector$_assoc_n$arity$3(coll, n, val)
  }else {
    return function() {
      var or__3824__auto____4569 = cljs.core._assoc_n[goog.typeOf.call(null, coll)];
      if(or__3824__auto____4569) {
        return or__3824__auto____4569
      }else {
        var or__3824__auto____4570 = cljs.core._assoc_n["_"];
        if(or__3824__auto____4570) {
          return or__3824__auto____4570
        }else {
          throw cljs.core.missing_protocol.call(null, "IVector.-assoc-n", coll);
        }
      }
    }().call(null, coll, n, val)
  }
};
void 0;
void 0;
cljs.core.IDeref = {};
cljs.core._deref = function _deref(o) {
  if(function() {
    var and__3822__auto____4571 = o;
    if(and__3822__auto____4571) {
      return o.cljs$core$IDeref$_deref$arity$1
    }else {
      return and__3822__auto____4571
    }
  }()) {
    return o.cljs$core$IDeref$_deref$arity$1(o)
  }else {
    return function() {
      var or__3824__auto____4572 = cljs.core._deref[goog.typeOf.call(null, o)];
      if(or__3824__auto____4572) {
        return or__3824__auto____4572
      }else {
        var or__3824__auto____4573 = cljs.core._deref["_"];
        if(or__3824__auto____4573) {
          return or__3824__auto____4573
        }else {
          throw cljs.core.missing_protocol.call(null, "IDeref.-deref", o);
        }
      }
    }().call(null, o)
  }
};
void 0;
void 0;
cljs.core.IDerefWithTimeout = {};
cljs.core._deref_with_timeout = function _deref_with_timeout(o, msec, timeout_val) {
  if(function() {
    var and__3822__auto____4574 = o;
    if(and__3822__auto____4574) {
      return o.cljs$core$IDerefWithTimeout$_deref_with_timeout$arity$3
    }else {
      return and__3822__auto____4574
    }
  }()) {
    return o.cljs$core$IDerefWithTimeout$_deref_with_timeout$arity$3(o, msec, timeout_val)
  }else {
    return function() {
      var or__3824__auto____4575 = cljs.core._deref_with_timeout[goog.typeOf.call(null, o)];
      if(or__3824__auto____4575) {
        return or__3824__auto____4575
      }else {
        var or__3824__auto____4576 = cljs.core._deref_with_timeout["_"];
        if(or__3824__auto____4576) {
          return or__3824__auto____4576
        }else {
          throw cljs.core.missing_protocol.call(null, "IDerefWithTimeout.-deref-with-timeout", o);
        }
      }
    }().call(null, o, msec, timeout_val)
  }
};
void 0;
void 0;
cljs.core.IMeta = {};
cljs.core._meta = function _meta(o) {
  if(function() {
    var and__3822__auto____4577 = o;
    if(and__3822__auto____4577) {
      return o.cljs$core$IMeta$_meta$arity$1
    }else {
      return and__3822__auto____4577
    }
  }()) {
    return o.cljs$core$IMeta$_meta$arity$1(o)
  }else {
    return function() {
      var or__3824__auto____4578 = cljs.core._meta[goog.typeOf.call(null, o)];
      if(or__3824__auto____4578) {
        return or__3824__auto____4578
      }else {
        var or__3824__auto____4579 = cljs.core._meta["_"];
        if(or__3824__auto____4579) {
          return or__3824__auto____4579
        }else {
          throw cljs.core.missing_protocol.call(null, "IMeta.-meta", o);
        }
      }
    }().call(null, o)
  }
};
void 0;
void 0;
cljs.core.IWithMeta = {};
cljs.core._with_meta = function _with_meta(o, meta) {
  if(function() {
    var and__3822__auto____4580 = o;
    if(and__3822__auto____4580) {
      return o.cljs$core$IWithMeta$_with_meta$arity$2
    }else {
      return and__3822__auto____4580
    }
  }()) {
    return o.cljs$core$IWithMeta$_with_meta$arity$2(o, meta)
  }else {
    return function() {
      var or__3824__auto____4581 = cljs.core._with_meta[goog.typeOf.call(null, o)];
      if(or__3824__auto____4581) {
        return or__3824__auto____4581
      }else {
        var or__3824__auto____4582 = cljs.core._with_meta["_"];
        if(or__3824__auto____4582) {
          return or__3824__auto____4582
        }else {
          throw cljs.core.missing_protocol.call(null, "IWithMeta.-with-meta", o);
        }
      }
    }().call(null, o, meta)
  }
};
void 0;
void 0;
cljs.core.IReduce = {};
cljs.core._reduce = function() {
  var _reduce = null;
  var _reduce__2 = function(coll, f) {
    if(function() {
      var and__3822__auto____4583 = coll;
      if(and__3822__auto____4583) {
        return coll.cljs$core$IReduce$_reduce$arity$2
      }else {
        return and__3822__auto____4583
      }
    }()) {
      return coll.cljs$core$IReduce$_reduce$arity$2(coll, f)
    }else {
      return function() {
        var or__3824__auto____4584 = cljs.core._reduce[goog.typeOf.call(null, coll)];
        if(or__3824__auto____4584) {
          return or__3824__auto____4584
        }else {
          var or__3824__auto____4585 = cljs.core._reduce["_"];
          if(or__3824__auto____4585) {
            return or__3824__auto____4585
          }else {
            throw cljs.core.missing_protocol.call(null, "IReduce.-reduce", coll);
          }
        }
      }().call(null, coll, f)
    }
  };
  var _reduce__3 = function(coll, f, start) {
    if(function() {
      var and__3822__auto____4586 = coll;
      if(and__3822__auto____4586) {
        return coll.cljs$core$IReduce$_reduce$arity$3
      }else {
        return and__3822__auto____4586
      }
    }()) {
      return coll.cljs$core$IReduce$_reduce$arity$3(coll, f, start)
    }else {
      return function() {
        var or__3824__auto____4587 = cljs.core._reduce[goog.typeOf.call(null, coll)];
        if(or__3824__auto____4587) {
          return or__3824__auto____4587
        }else {
          var or__3824__auto____4588 = cljs.core._reduce["_"];
          if(or__3824__auto____4588) {
            return or__3824__auto____4588
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
void 0;
void 0;
cljs.core.IKVReduce = {};
cljs.core._kv_reduce = function _kv_reduce(coll, f, init) {
  if(function() {
    var and__3822__auto____4589 = coll;
    if(and__3822__auto____4589) {
      return coll.cljs$core$IKVReduce$_kv_reduce$arity$3
    }else {
      return and__3822__auto____4589
    }
  }()) {
    return coll.cljs$core$IKVReduce$_kv_reduce$arity$3(coll, f, init)
  }else {
    return function() {
      var or__3824__auto____4590 = cljs.core._kv_reduce[goog.typeOf.call(null, coll)];
      if(or__3824__auto____4590) {
        return or__3824__auto____4590
      }else {
        var or__3824__auto____4591 = cljs.core._kv_reduce["_"];
        if(or__3824__auto____4591) {
          return or__3824__auto____4591
        }else {
          throw cljs.core.missing_protocol.call(null, "IKVReduce.-kv-reduce", coll);
        }
      }
    }().call(null, coll, f, init)
  }
};
void 0;
void 0;
cljs.core.IEquiv = {};
cljs.core._equiv = function _equiv(o, other) {
  if(function() {
    var and__3822__auto____4592 = o;
    if(and__3822__auto____4592) {
      return o.cljs$core$IEquiv$_equiv$arity$2
    }else {
      return and__3822__auto____4592
    }
  }()) {
    return o.cljs$core$IEquiv$_equiv$arity$2(o, other)
  }else {
    return function() {
      var or__3824__auto____4593 = cljs.core._equiv[goog.typeOf.call(null, o)];
      if(or__3824__auto____4593) {
        return or__3824__auto____4593
      }else {
        var or__3824__auto____4594 = cljs.core._equiv["_"];
        if(or__3824__auto____4594) {
          return or__3824__auto____4594
        }else {
          throw cljs.core.missing_protocol.call(null, "IEquiv.-equiv", o);
        }
      }
    }().call(null, o, other)
  }
};
void 0;
void 0;
cljs.core.IHash = {};
cljs.core._hash = function _hash(o) {
  if(function() {
    var and__3822__auto____4595 = o;
    if(and__3822__auto____4595) {
      return o.cljs$core$IHash$_hash$arity$1
    }else {
      return and__3822__auto____4595
    }
  }()) {
    return o.cljs$core$IHash$_hash$arity$1(o)
  }else {
    return function() {
      var or__3824__auto____4596 = cljs.core._hash[goog.typeOf.call(null, o)];
      if(or__3824__auto____4596) {
        return or__3824__auto____4596
      }else {
        var or__3824__auto____4597 = cljs.core._hash["_"];
        if(or__3824__auto____4597) {
          return or__3824__auto____4597
        }else {
          throw cljs.core.missing_protocol.call(null, "IHash.-hash", o);
        }
      }
    }().call(null, o)
  }
};
void 0;
void 0;
cljs.core.ISeqable = {};
cljs.core._seq = function _seq(o) {
  if(function() {
    var and__3822__auto____4598 = o;
    if(and__3822__auto____4598) {
      return o.cljs$core$ISeqable$_seq$arity$1
    }else {
      return and__3822__auto____4598
    }
  }()) {
    return o.cljs$core$ISeqable$_seq$arity$1(o)
  }else {
    return function() {
      var or__3824__auto____4599 = cljs.core._seq[goog.typeOf.call(null, o)];
      if(or__3824__auto____4599) {
        return or__3824__auto____4599
      }else {
        var or__3824__auto____4600 = cljs.core._seq["_"];
        if(or__3824__auto____4600) {
          return or__3824__auto____4600
        }else {
          throw cljs.core.missing_protocol.call(null, "ISeqable.-seq", o);
        }
      }
    }().call(null, o)
  }
};
void 0;
void 0;
cljs.core.ISequential = {};
void 0;
void 0;
cljs.core.IList = {};
void 0;
void 0;
cljs.core.IRecord = {};
void 0;
void 0;
cljs.core.IReversible = {};
cljs.core._rseq = function _rseq(coll) {
  if(function() {
    var and__3822__auto____4601 = coll;
    if(and__3822__auto____4601) {
      return coll.cljs$core$IReversible$_rseq$arity$1
    }else {
      return and__3822__auto____4601
    }
  }()) {
    return coll.cljs$core$IReversible$_rseq$arity$1(coll)
  }else {
    return function() {
      var or__3824__auto____4602 = cljs.core._rseq[goog.typeOf.call(null, coll)];
      if(or__3824__auto____4602) {
        return or__3824__auto____4602
      }else {
        var or__3824__auto____4603 = cljs.core._rseq["_"];
        if(or__3824__auto____4603) {
          return or__3824__auto____4603
        }else {
          throw cljs.core.missing_protocol.call(null, "IReversible.-rseq", coll);
        }
      }
    }().call(null, coll)
  }
};
void 0;
void 0;
cljs.core.ISorted = {};
cljs.core._sorted_seq = function _sorted_seq(coll, ascending_QMARK_) {
  if(function() {
    var and__3822__auto____4604 = coll;
    if(and__3822__auto____4604) {
      return coll.cljs$core$ISorted$_sorted_seq$arity$2
    }else {
      return and__3822__auto____4604
    }
  }()) {
    return coll.cljs$core$ISorted$_sorted_seq$arity$2(coll, ascending_QMARK_)
  }else {
    return function() {
      var or__3824__auto____4605 = cljs.core._sorted_seq[goog.typeOf.call(null, coll)];
      if(or__3824__auto____4605) {
        return or__3824__auto____4605
      }else {
        var or__3824__auto____4606 = cljs.core._sorted_seq["_"];
        if(or__3824__auto____4606) {
          return or__3824__auto____4606
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-sorted-seq", coll);
        }
      }
    }().call(null, coll, ascending_QMARK_)
  }
};
cljs.core._sorted_seq_from = function _sorted_seq_from(coll, k, ascending_QMARK_) {
  if(function() {
    var and__3822__auto____4607 = coll;
    if(and__3822__auto____4607) {
      return coll.cljs$core$ISorted$_sorted_seq_from$arity$3
    }else {
      return and__3822__auto____4607
    }
  }()) {
    return coll.cljs$core$ISorted$_sorted_seq_from$arity$3(coll, k, ascending_QMARK_)
  }else {
    return function() {
      var or__3824__auto____4608 = cljs.core._sorted_seq_from[goog.typeOf.call(null, coll)];
      if(or__3824__auto____4608) {
        return or__3824__auto____4608
      }else {
        var or__3824__auto____4609 = cljs.core._sorted_seq_from["_"];
        if(or__3824__auto____4609) {
          return or__3824__auto____4609
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-sorted-seq-from", coll);
        }
      }
    }().call(null, coll, k, ascending_QMARK_)
  }
};
cljs.core._entry_key = function _entry_key(coll, entry) {
  if(function() {
    var and__3822__auto____4610 = coll;
    if(and__3822__auto____4610) {
      return coll.cljs$core$ISorted$_entry_key$arity$2
    }else {
      return and__3822__auto____4610
    }
  }()) {
    return coll.cljs$core$ISorted$_entry_key$arity$2(coll, entry)
  }else {
    return function() {
      var or__3824__auto____4611 = cljs.core._entry_key[goog.typeOf.call(null, coll)];
      if(or__3824__auto____4611) {
        return or__3824__auto____4611
      }else {
        var or__3824__auto____4612 = cljs.core._entry_key["_"];
        if(or__3824__auto____4612) {
          return or__3824__auto____4612
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-entry-key", coll);
        }
      }
    }().call(null, coll, entry)
  }
};
cljs.core._comparator = function _comparator(coll) {
  if(function() {
    var and__3822__auto____4613 = coll;
    if(and__3822__auto____4613) {
      return coll.cljs$core$ISorted$_comparator$arity$1
    }else {
      return and__3822__auto____4613
    }
  }()) {
    return coll.cljs$core$ISorted$_comparator$arity$1(coll)
  }else {
    return function() {
      var or__3824__auto____4614 = cljs.core._comparator[goog.typeOf.call(null, coll)];
      if(or__3824__auto____4614) {
        return or__3824__auto____4614
      }else {
        var or__3824__auto____4615 = cljs.core._comparator["_"];
        if(or__3824__auto____4615) {
          return or__3824__auto____4615
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-comparator", coll);
        }
      }
    }().call(null, coll)
  }
};
void 0;
void 0;
cljs.core.IPrintable = {};
cljs.core._pr_seq = function _pr_seq(o, opts) {
  if(function() {
    var and__3822__auto____4616 = o;
    if(and__3822__auto____4616) {
      return o.cljs$core$IPrintable$_pr_seq$arity$2
    }else {
      return and__3822__auto____4616
    }
  }()) {
    return o.cljs$core$IPrintable$_pr_seq$arity$2(o, opts)
  }else {
    return function() {
      var or__3824__auto____4617 = cljs.core._pr_seq[goog.typeOf.call(null, o)];
      if(or__3824__auto____4617) {
        return or__3824__auto____4617
      }else {
        var or__3824__auto____4618 = cljs.core._pr_seq["_"];
        if(or__3824__auto____4618) {
          return or__3824__auto____4618
        }else {
          throw cljs.core.missing_protocol.call(null, "IPrintable.-pr-seq", o);
        }
      }
    }().call(null, o, opts)
  }
};
void 0;
void 0;
cljs.core.IPending = {};
cljs.core._realized_QMARK_ = function _realized_QMARK_(d) {
  if(function() {
    var and__3822__auto____4619 = d;
    if(and__3822__auto____4619) {
      return d.cljs$core$IPending$_realized_QMARK_$arity$1
    }else {
      return and__3822__auto____4619
    }
  }()) {
    return d.cljs$core$IPending$_realized_QMARK_$arity$1(d)
  }else {
    return function() {
      var or__3824__auto____4620 = cljs.core._realized_QMARK_[goog.typeOf.call(null, d)];
      if(or__3824__auto____4620) {
        return or__3824__auto____4620
      }else {
        var or__3824__auto____4621 = cljs.core._realized_QMARK_["_"];
        if(or__3824__auto____4621) {
          return or__3824__auto____4621
        }else {
          throw cljs.core.missing_protocol.call(null, "IPending.-realized?", d);
        }
      }
    }().call(null, d)
  }
};
void 0;
void 0;
cljs.core.IWatchable = {};
cljs.core._notify_watches = function _notify_watches(this$, oldval, newval) {
  if(function() {
    var and__3822__auto____4622 = this$;
    if(and__3822__auto____4622) {
      return this$.cljs$core$IWatchable$_notify_watches$arity$3
    }else {
      return and__3822__auto____4622
    }
  }()) {
    return this$.cljs$core$IWatchable$_notify_watches$arity$3(this$, oldval, newval)
  }else {
    return function() {
      var or__3824__auto____4623 = cljs.core._notify_watches[goog.typeOf.call(null, this$)];
      if(or__3824__auto____4623) {
        return or__3824__auto____4623
      }else {
        var or__3824__auto____4624 = cljs.core._notify_watches["_"];
        if(or__3824__auto____4624) {
          return or__3824__auto____4624
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-notify-watches", this$);
        }
      }
    }().call(null, this$, oldval, newval)
  }
};
cljs.core._add_watch = function _add_watch(this$, key, f) {
  if(function() {
    var and__3822__auto____4625 = this$;
    if(and__3822__auto____4625) {
      return this$.cljs$core$IWatchable$_add_watch$arity$3
    }else {
      return and__3822__auto____4625
    }
  }()) {
    return this$.cljs$core$IWatchable$_add_watch$arity$3(this$, key, f)
  }else {
    return function() {
      var or__3824__auto____4626 = cljs.core._add_watch[goog.typeOf.call(null, this$)];
      if(or__3824__auto____4626) {
        return or__3824__auto____4626
      }else {
        var or__3824__auto____4627 = cljs.core._add_watch["_"];
        if(or__3824__auto____4627) {
          return or__3824__auto____4627
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-add-watch", this$);
        }
      }
    }().call(null, this$, key, f)
  }
};
cljs.core._remove_watch = function _remove_watch(this$, key) {
  if(function() {
    var and__3822__auto____4628 = this$;
    if(and__3822__auto____4628) {
      return this$.cljs$core$IWatchable$_remove_watch$arity$2
    }else {
      return and__3822__auto____4628
    }
  }()) {
    return this$.cljs$core$IWatchable$_remove_watch$arity$2(this$, key)
  }else {
    return function() {
      var or__3824__auto____4629 = cljs.core._remove_watch[goog.typeOf.call(null, this$)];
      if(or__3824__auto____4629) {
        return or__3824__auto____4629
      }else {
        var or__3824__auto____4630 = cljs.core._remove_watch["_"];
        if(or__3824__auto____4630) {
          return or__3824__auto____4630
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-remove-watch", this$);
        }
      }
    }().call(null, this$, key)
  }
};
void 0;
void 0;
cljs.core.IEditableCollection = {};
cljs.core._as_transient = function _as_transient(coll) {
  if(function() {
    var and__3822__auto____4631 = coll;
    if(and__3822__auto____4631) {
      return coll.cljs$core$IEditableCollection$_as_transient$arity$1
    }else {
      return and__3822__auto____4631
    }
  }()) {
    return coll.cljs$core$IEditableCollection$_as_transient$arity$1(coll)
  }else {
    return function() {
      var or__3824__auto____4632 = cljs.core._as_transient[goog.typeOf.call(null, coll)];
      if(or__3824__auto____4632) {
        return or__3824__auto____4632
      }else {
        var or__3824__auto____4633 = cljs.core._as_transient["_"];
        if(or__3824__auto____4633) {
          return or__3824__auto____4633
        }else {
          throw cljs.core.missing_protocol.call(null, "IEditableCollection.-as-transient", coll);
        }
      }
    }().call(null, coll)
  }
};
void 0;
void 0;
cljs.core.ITransientCollection = {};
cljs.core._conj_BANG_ = function _conj_BANG_(tcoll, val) {
  if(function() {
    var and__3822__auto____4634 = tcoll;
    if(and__3822__auto____4634) {
      return tcoll.cljs$core$ITransientCollection$_conj_BANG_$arity$2
    }else {
      return and__3822__auto____4634
    }
  }()) {
    return tcoll.cljs$core$ITransientCollection$_conj_BANG_$arity$2(tcoll, val)
  }else {
    return function() {
      var or__3824__auto____4635 = cljs.core._conj_BANG_[goog.typeOf.call(null, tcoll)];
      if(or__3824__auto____4635) {
        return or__3824__auto____4635
      }else {
        var or__3824__auto____4636 = cljs.core._conj_BANG_["_"];
        if(or__3824__auto____4636) {
          return or__3824__auto____4636
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientCollection.-conj!", tcoll);
        }
      }
    }().call(null, tcoll, val)
  }
};
cljs.core._persistent_BANG_ = function _persistent_BANG_(tcoll) {
  if(function() {
    var and__3822__auto____4637 = tcoll;
    if(and__3822__auto____4637) {
      return tcoll.cljs$core$ITransientCollection$_persistent_BANG_$arity$1
    }else {
      return and__3822__auto____4637
    }
  }()) {
    return tcoll.cljs$core$ITransientCollection$_persistent_BANG_$arity$1(tcoll)
  }else {
    return function() {
      var or__3824__auto____4638 = cljs.core._persistent_BANG_[goog.typeOf.call(null, tcoll)];
      if(or__3824__auto____4638) {
        return or__3824__auto____4638
      }else {
        var or__3824__auto____4639 = cljs.core._persistent_BANG_["_"];
        if(or__3824__auto____4639) {
          return or__3824__auto____4639
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientCollection.-persistent!", tcoll);
        }
      }
    }().call(null, tcoll)
  }
};
void 0;
void 0;
cljs.core.ITransientAssociative = {};
cljs.core._assoc_BANG_ = function _assoc_BANG_(tcoll, key, val) {
  if(function() {
    var and__3822__auto____4640 = tcoll;
    if(and__3822__auto____4640) {
      return tcoll.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3
    }else {
      return and__3822__auto____4640
    }
  }()) {
    return tcoll.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3(tcoll, key, val)
  }else {
    return function() {
      var or__3824__auto____4641 = cljs.core._assoc_BANG_[goog.typeOf.call(null, tcoll)];
      if(or__3824__auto____4641) {
        return or__3824__auto____4641
      }else {
        var or__3824__auto____4642 = cljs.core._assoc_BANG_["_"];
        if(or__3824__auto____4642) {
          return or__3824__auto____4642
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientAssociative.-assoc!", tcoll);
        }
      }
    }().call(null, tcoll, key, val)
  }
};
void 0;
void 0;
cljs.core.ITransientMap = {};
cljs.core._dissoc_BANG_ = function _dissoc_BANG_(tcoll, key) {
  if(function() {
    var and__3822__auto____4643 = tcoll;
    if(and__3822__auto____4643) {
      return tcoll.cljs$core$ITransientMap$_dissoc_BANG_$arity$2
    }else {
      return and__3822__auto____4643
    }
  }()) {
    return tcoll.cljs$core$ITransientMap$_dissoc_BANG_$arity$2(tcoll, key)
  }else {
    return function() {
      var or__3824__auto____4644 = cljs.core._dissoc_BANG_[goog.typeOf.call(null, tcoll)];
      if(or__3824__auto____4644) {
        return or__3824__auto____4644
      }else {
        var or__3824__auto____4645 = cljs.core._dissoc_BANG_["_"];
        if(or__3824__auto____4645) {
          return or__3824__auto____4645
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientMap.-dissoc!", tcoll);
        }
      }
    }().call(null, tcoll, key)
  }
};
void 0;
void 0;
cljs.core.ITransientVector = {};
cljs.core._assoc_n_BANG_ = function _assoc_n_BANG_(tcoll, n, val) {
  if(function() {
    var and__3822__auto____4646 = tcoll;
    if(and__3822__auto____4646) {
      return tcoll.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3
    }else {
      return and__3822__auto____4646
    }
  }()) {
    return tcoll.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3(tcoll, n, val)
  }else {
    return function() {
      var or__3824__auto____4647 = cljs.core._assoc_n_BANG_[goog.typeOf.call(null, tcoll)];
      if(or__3824__auto____4647) {
        return or__3824__auto____4647
      }else {
        var or__3824__auto____4648 = cljs.core._assoc_n_BANG_["_"];
        if(or__3824__auto____4648) {
          return or__3824__auto____4648
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientVector.-assoc-n!", tcoll);
        }
      }
    }().call(null, tcoll, n, val)
  }
};
cljs.core._pop_BANG_ = function _pop_BANG_(tcoll) {
  if(function() {
    var and__3822__auto____4649 = tcoll;
    if(and__3822__auto____4649) {
      return tcoll.cljs$core$ITransientVector$_pop_BANG_$arity$1
    }else {
      return and__3822__auto____4649
    }
  }()) {
    return tcoll.cljs$core$ITransientVector$_pop_BANG_$arity$1(tcoll)
  }else {
    return function() {
      var or__3824__auto____4650 = cljs.core._pop_BANG_[goog.typeOf.call(null, tcoll)];
      if(or__3824__auto____4650) {
        return or__3824__auto____4650
      }else {
        var or__3824__auto____4651 = cljs.core._pop_BANG_["_"];
        if(or__3824__auto____4651) {
          return or__3824__auto____4651
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientVector.-pop!", tcoll);
        }
      }
    }().call(null, tcoll)
  }
};
void 0;
void 0;
cljs.core.ITransientSet = {};
cljs.core._disjoin_BANG_ = function _disjoin_BANG_(tcoll, v) {
  if(function() {
    var and__3822__auto____4652 = tcoll;
    if(and__3822__auto____4652) {
      return tcoll.cljs$core$ITransientSet$_disjoin_BANG_$arity$2
    }else {
      return and__3822__auto____4652
    }
  }()) {
    return tcoll.cljs$core$ITransientSet$_disjoin_BANG_$arity$2(tcoll, v)
  }else {
    return function() {
      var or__3824__auto____4653 = cljs.core._disjoin_BANG_[goog.typeOf.call(null, tcoll)];
      if(or__3824__auto____4653) {
        return or__3824__auto____4653
      }else {
        var or__3824__auto____4654 = cljs.core._disjoin_BANG_["_"];
        if(or__3824__auto____4654) {
          return or__3824__auto____4654
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientSet.-disjoin!", tcoll);
        }
      }
    }().call(null, tcoll, v)
  }
};
void 0;
cljs.core.identical_QMARK_ = function identical_QMARK_(x, y) {
  return x === y
};
void 0;
void 0;
cljs.core._EQ_ = function() {
  var _EQ_ = null;
  var _EQ___1 = function(x) {
    return true
  };
  var _EQ___2 = function(x, y) {
    var or__3824__auto____4655 = x === y;
    if(or__3824__auto____4655) {
      return or__3824__auto____4655
    }else {
      return cljs.core._equiv.call(null, x, y)
    }
  };
  var _EQ___3 = function() {
    var G__4656__delegate = function(x, y, more) {
      while(true) {
        if(cljs.core.truth_(_EQ_.call(null, x, y))) {
          if(cljs.core.truth_(cljs.core.next.call(null, more))) {
            var G__4657 = y;
            var G__4658 = cljs.core.first.call(null, more);
            var G__4659 = cljs.core.next.call(null, more);
            x = G__4657;
            y = G__4658;
            more = G__4659;
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
    var G__4656 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__4656__delegate.call(this, x, y, more)
    };
    G__4656.cljs$lang$maxFixedArity = 2;
    G__4656.cljs$lang$applyTo = function(arglist__4660) {
      var x = cljs.core.first(arglist__4660);
      var y = cljs.core.first(cljs.core.next(arglist__4660));
      var more = cljs.core.rest(cljs.core.next(arglist__4660));
      return G__4656__delegate(x, y, more)
    };
    G__4656.cljs$lang$arity$variadic = G__4656__delegate;
    return G__4656
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
  if(function() {
    var or__3824__auto____4661 = x == null;
    if(or__3824__auto____4661) {
      return or__3824__auto____4661
    }else {
      return void 0 === x
    }
  }()) {
    return null
  }else {
    return x.constructor
  }
};
void 0;
void 0;
void 0;
cljs.core.IHash["null"] = true;
cljs.core._hash["null"] = function(o) {
  return 0
};
cljs.core.ILookup["null"] = true;
cljs.core._lookup["null"] = function() {
  var G__4662 = null;
  var G__4662__2 = function(o, k) {
    return null
  };
  var G__4662__3 = function(o, k, not_found) {
    return not_found
  };
  G__4662 = function(o, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__4662__2.call(this, o, k);
      case 3:
        return G__4662__3.call(this, o, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__4662
}();
cljs.core.IAssociative["null"] = true;
cljs.core._assoc["null"] = function(_, k, v) {
  return cljs.core.hash_map.call(null, k, v)
};
cljs.core.ICollection["null"] = true;
cljs.core._conj["null"] = function(_, o) {
  return cljs.core.list.call(null, o)
};
cljs.core.IReduce["null"] = true;
cljs.core._reduce["null"] = function() {
  var G__4663 = null;
  var G__4663__2 = function(_, f) {
    return f.call(null)
  };
  var G__4663__3 = function(_, f, start) {
    return start
  };
  G__4663 = function(_, f, start) {
    switch(arguments.length) {
      case 2:
        return G__4663__2.call(this, _, f);
      case 3:
        return G__4663__3.call(this, _, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__4663
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
  var G__4664 = null;
  var G__4664__2 = function(_, n) {
    return null
  };
  var G__4664__3 = function(_, n, not_found) {
    return not_found
  };
  G__4664 = function(_, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__4664__2.call(this, _, n);
      case 3:
        return G__4664__3.call(this, _, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__4664
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
  return o.toString() === other.toString()
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
  return o === true ? 1 : 0
};
cljs.core.IHash["function"] = true;
cljs.core._hash["function"] = function(o) {
  return goog.getUid.call(null, o)
};
cljs.core.inc = function inc(x) {
  return x + 1
};
void 0;
void 0;
cljs.core.ci_reduce = function() {
  var ci_reduce = null;
  var ci_reduce__2 = function(cicoll, f) {
    if(cljs.core._count.call(null, cicoll) === 0) {
      return f.call(null)
    }else {
      var val__4665 = cljs.core._nth.call(null, cicoll, 0);
      var n__4666 = 1;
      while(true) {
        if(n__4666 < cljs.core._count.call(null, cicoll)) {
          var nval__4667 = f.call(null, val__4665, cljs.core._nth.call(null, cicoll, n__4666));
          if(cljs.core.reduced_QMARK_.call(null, nval__4667)) {
            return cljs.core.deref.call(null, nval__4667)
          }else {
            var G__4674 = nval__4667;
            var G__4675 = n__4666 + 1;
            val__4665 = G__4674;
            n__4666 = G__4675;
            continue
          }
        }else {
          return val__4665
        }
        break
      }
    }
  };
  var ci_reduce__3 = function(cicoll, f, val) {
    var val__4668 = val;
    var n__4669 = 0;
    while(true) {
      if(n__4669 < cljs.core._count.call(null, cicoll)) {
        var nval__4670 = f.call(null, val__4668, cljs.core._nth.call(null, cicoll, n__4669));
        if(cljs.core.reduced_QMARK_.call(null, nval__4670)) {
          return cljs.core.deref.call(null, nval__4670)
        }else {
          var G__4676 = nval__4670;
          var G__4677 = n__4669 + 1;
          val__4668 = G__4676;
          n__4669 = G__4677;
          continue
        }
      }else {
        return val__4668
      }
      break
    }
  };
  var ci_reduce__4 = function(cicoll, f, val, idx) {
    var val__4671 = val;
    var n__4672 = idx;
    while(true) {
      if(n__4672 < cljs.core._count.call(null, cicoll)) {
        var nval__4673 = f.call(null, val__4671, cljs.core._nth.call(null, cicoll, n__4672));
        if(cljs.core.reduced_QMARK_.call(null, nval__4673)) {
          return cljs.core.deref.call(null, nval__4673)
        }else {
          var G__4678 = nval__4673;
          var G__4679 = n__4672 + 1;
          val__4671 = G__4678;
          n__4672 = G__4679;
          continue
        }
      }else {
        return val__4671
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
void 0;
void 0;
void 0;
void 0;
cljs.core.IndexedSeq = function(a, i) {
  this.a = a;
  this.i = i;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 15990906
};
cljs.core.IndexedSeq.cljs$lang$type = true;
cljs.core.IndexedSeq.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.IndexedSeq")
};
cljs.core.IndexedSeq.prototype.cljs$core$IHash$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__4680 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.IndexedSeq.prototype.cljs$core$ISequential$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$ICollection$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__4681 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.IndexedSeq.prototype.cljs$core$ASeq$ = true;
cljs.core.IndexedSeq.prototype.toString = function() {
  var this__4682 = this;
  var this$__4683 = this;
  return cljs.core.pr_str.call(null, this$__4683)
};
cljs.core.IndexedSeq.prototype.cljs$core$IReduce$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$IReduce$_reduce$arity$2 = function(coll, f) {
  var this__4684 = this;
  if(cljs.core.counted_QMARK_.call(null, this__4684.a)) {
    return cljs.core.ci_reduce.call(null, this__4684.a, f, this__4684.a[this__4684.i], this__4684.i + 1)
  }else {
    return cljs.core.ci_reduce.call(null, coll, f, this__4684.a[this__4684.i], 0)
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$IReduce$_reduce$arity$3 = function(coll, f, start) {
  var this__4685 = this;
  if(cljs.core.counted_QMARK_.call(null, this__4685.a)) {
    return cljs.core.ci_reduce.call(null, this__4685.a, f, start, this__4685.i)
  }else {
    return cljs.core.ci_reduce.call(null, coll, f, start, 0)
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeqable$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__4686 = this;
  return this$
};
cljs.core.IndexedSeq.prototype.cljs$core$ICounted$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$ICounted$_count$arity$1 = function(_) {
  var this__4687 = this;
  return this__4687.a.length - this__4687.i
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeq$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(_) {
  var this__4688 = this;
  return this__4688.a[this__4688.i]
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(_) {
  var this__4689 = this;
  if(this__4689.i + 1 < this__4689.a.length) {
    return new cljs.core.IndexedSeq(this__4689.a, this__4689.i + 1)
  }else {
    return cljs.core.list.call(null)
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$IEquiv$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__4690 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.IndexedSeq.prototype.cljs$core$IIndexed$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__4691 = this;
  var i__4692 = n + this__4691.i;
  if(i__4692 < this__4691.a.length) {
    return this__4691.a[i__4692]
  }else {
    return null
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__4693 = this;
  var i__4694 = n + this__4693.i;
  if(i__4694 < this__4693.a.length) {
    return this__4693.a[i__4694]
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
  var G__4695 = null;
  var G__4695__2 = function(array, f) {
    return cljs.core.ci_reduce.call(null, array, f)
  };
  var G__4695__3 = function(array, f, start) {
    return cljs.core.ci_reduce.call(null, array, f, start)
  };
  G__4695 = function(array, f, start) {
    switch(arguments.length) {
      case 2:
        return G__4695__2.call(this, array, f);
      case 3:
        return G__4695__3.call(this, array, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__4695
}();
cljs.core.ILookup["array"] = true;
cljs.core._lookup["array"] = function() {
  var G__4696 = null;
  var G__4696__2 = function(array, k) {
    return array[k]
  };
  var G__4696__3 = function(array, k, not_found) {
    return cljs.core._nth.call(null, array, k, not_found)
  };
  G__4696 = function(array, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__4696__2.call(this, array, k);
      case 3:
        return G__4696__3.call(this, array, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__4696
}();
cljs.core.IIndexed["array"] = true;
cljs.core._nth["array"] = function() {
  var G__4697 = null;
  var G__4697__2 = function(array, n) {
    if(n < array.length) {
      return array[n]
    }else {
      return null
    }
  };
  var G__4697__3 = function(array, n, not_found) {
    if(n < array.length) {
      return array[n]
    }else {
      return not_found
    }
  };
  G__4697 = function(array, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__4697__2.call(this, array, n);
      case 3:
        return G__4697__3.call(this, array, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__4697
}();
cljs.core.ICounted["array"] = true;
cljs.core._count["array"] = function(a) {
  return a.length
};
cljs.core.ISeqable["array"] = true;
cljs.core._seq["array"] = function(array) {
  return cljs.core.array_seq.call(null, array, 0)
};
cljs.core.seq = function seq(coll) {
  if(coll != null) {
    if(function() {
      var G__4698__4699 = coll;
      if(G__4698__4699 != null) {
        if(function() {
          var or__3824__auto____4700 = G__4698__4699.cljs$lang$protocol_mask$partition0$ & 32;
          if(or__3824__auto____4700) {
            return or__3824__auto____4700
          }else {
            return G__4698__4699.cljs$core$ASeq$
          }
        }()) {
          return true
        }else {
          if(!G__4698__4699.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ASeq, G__4698__4699)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ASeq, G__4698__4699)
      }
    }()) {
      return coll
    }else {
      return cljs.core._seq.call(null, coll)
    }
  }else {
    return null
  }
};
cljs.core.first = function first(coll) {
  if(coll != null) {
    if(function() {
      var G__4701__4702 = coll;
      if(G__4701__4702 != null) {
        if(function() {
          var or__3824__auto____4703 = G__4701__4702.cljs$lang$protocol_mask$partition0$ & 64;
          if(or__3824__auto____4703) {
            return or__3824__auto____4703
          }else {
            return G__4701__4702.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          if(!G__4701__4702.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__4701__4702)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__4701__4702)
      }
    }()) {
      return cljs.core._first.call(null, coll)
    }else {
      var s__4704 = cljs.core.seq.call(null, coll);
      if(s__4704 != null) {
        return cljs.core._first.call(null, s__4704)
      }else {
        return null
      }
    }
  }else {
    return null
  }
};
cljs.core.rest = function rest(coll) {
  if(coll != null) {
    if(function() {
      var G__4705__4706 = coll;
      if(G__4705__4706 != null) {
        if(function() {
          var or__3824__auto____4707 = G__4705__4706.cljs$lang$protocol_mask$partition0$ & 64;
          if(or__3824__auto____4707) {
            return or__3824__auto____4707
          }else {
            return G__4705__4706.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          if(!G__4705__4706.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__4705__4706)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__4705__4706)
      }
    }()) {
      return cljs.core._rest.call(null, coll)
    }else {
      var s__4708 = cljs.core.seq.call(null, coll);
      if(s__4708 != null) {
        return cljs.core._rest.call(null, s__4708)
      }else {
        return cljs.core.List.EMPTY
      }
    }
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.next = function next(coll) {
  if(coll != null) {
    if(function() {
      var G__4709__4710 = coll;
      if(G__4709__4710 != null) {
        if(function() {
          var or__3824__auto____4711 = G__4709__4710.cljs$lang$protocol_mask$partition0$ & 64;
          if(or__3824__auto____4711) {
            return or__3824__auto____4711
          }else {
            return G__4709__4710.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          if(!G__4709__4710.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__4709__4710)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__4709__4710)
      }
    }()) {
      var coll__4712 = cljs.core._rest.call(null, coll);
      if(coll__4712 != null) {
        if(function() {
          var G__4713__4714 = coll__4712;
          if(G__4713__4714 != null) {
            if(function() {
              var or__3824__auto____4715 = G__4713__4714.cljs$lang$protocol_mask$partition0$ & 32;
              if(or__3824__auto____4715) {
                return or__3824__auto____4715
              }else {
                return G__4713__4714.cljs$core$ASeq$
              }
            }()) {
              return true
            }else {
              if(!G__4713__4714.cljs$lang$protocol_mask$partition0$) {
                return cljs.core.type_satisfies_.call(null, cljs.core.ASeq, G__4713__4714)
              }else {
                return false
              }
            }
          }else {
            return cljs.core.type_satisfies_.call(null, cljs.core.ASeq, G__4713__4714)
          }
        }()) {
          return coll__4712
        }else {
          return cljs.core._seq.call(null, coll__4712)
        }
      }else {
        return null
      }
    }else {
      return cljs.core.seq.call(null, cljs.core.rest.call(null, coll))
    }
  }else {
    return null
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
    if(cljs.core.truth_(cljs.core.next.call(null, s))) {
      var G__4716 = cljs.core.next.call(null, s);
      s = G__4716;
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
    var G__4717__delegate = function(coll, x, xs) {
      while(true) {
        if(cljs.core.truth_(xs)) {
          var G__4718 = conj.call(null, coll, x);
          var G__4719 = cljs.core.first.call(null, xs);
          var G__4720 = cljs.core.next.call(null, xs);
          coll = G__4718;
          x = G__4719;
          xs = G__4720;
          continue
        }else {
          return conj.call(null, coll, x)
        }
        break
      }
    };
    var G__4717 = function(coll, x, var_args) {
      var xs = null;
      if(goog.isDef(var_args)) {
        xs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__4717__delegate.call(this, coll, x, xs)
    };
    G__4717.cljs$lang$maxFixedArity = 2;
    G__4717.cljs$lang$applyTo = function(arglist__4721) {
      var coll = cljs.core.first(arglist__4721);
      var x = cljs.core.first(cljs.core.next(arglist__4721));
      var xs = cljs.core.rest(cljs.core.next(arglist__4721));
      return G__4717__delegate(coll, x, xs)
    };
    G__4717.cljs$lang$arity$variadic = G__4717__delegate;
    return G__4717
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
void 0;
cljs.core.accumulating_seq_count = function accumulating_seq_count(coll) {
  var s__4722 = cljs.core.seq.call(null, coll);
  var acc__4723 = 0;
  while(true) {
    if(cljs.core.counted_QMARK_.call(null, s__4722)) {
      return acc__4723 + cljs.core._count.call(null, s__4722)
    }else {
      var G__4724 = cljs.core.next.call(null, s__4722);
      var G__4725 = acc__4723 + 1;
      s__4722 = G__4724;
      acc__4723 = G__4725;
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
void 0;
cljs.core.linear_traversal_nth = function() {
  var linear_traversal_nth = null;
  var linear_traversal_nth__2 = function(coll, n) {
    if(coll == null) {
      throw new Error("Index out of bounds");
    }else {
      if(n === 0) {
        if(cljs.core.truth_(cljs.core.seq.call(null, coll))) {
          return cljs.core.first.call(null, coll)
        }else {
          throw new Error("Index out of bounds");
        }
      }else {
        if(cljs.core.indexed_QMARK_.call(null, coll)) {
          return cljs.core._nth.call(null, coll, n)
        }else {
          if(cljs.core.truth_(cljs.core.seq.call(null, coll))) {
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
        if(cljs.core.truth_(cljs.core.seq.call(null, coll))) {
          return cljs.core.first.call(null, coll)
        }else {
          return not_found
        }
      }else {
        if(cljs.core.indexed_QMARK_.call(null, coll)) {
          return cljs.core._nth.call(null, coll, n, not_found)
        }else {
          if(cljs.core.truth_(cljs.core.seq.call(null, coll))) {
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
    if(coll != null) {
      if(function() {
        var G__4726__4727 = coll;
        if(G__4726__4727 != null) {
          if(function() {
            var or__3824__auto____4728 = G__4726__4727.cljs$lang$protocol_mask$partition0$ & 16;
            if(or__3824__auto____4728) {
              return or__3824__auto____4728
            }else {
              return G__4726__4727.cljs$core$IIndexed$
            }
          }()) {
            return true
          }else {
            if(!G__4726__4727.cljs$lang$protocol_mask$partition0$) {
              return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__4726__4727)
            }else {
              return false
            }
          }
        }else {
          return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__4726__4727)
        }
      }()) {
        return cljs.core._nth.call(null, coll, Math.floor(n))
      }else {
        return cljs.core.linear_traversal_nth.call(null, coll, Math.floor(n))
      }
    }else {
      return null
    }
  };
  var nth__3 = function(coll, n, not_found) {
    if(coll != null) {
      if(function() {
        var G__4729__4730 = coll;
        if(G__4729__4730 != null) {
          if(function() {
            var or__3824__auto____4731 = G__4729__4730.cljs$lang$protocol_mask$partition0$ & 16;
            if(or__3824__auto____4731) {
              return or__3824__auto____4731
            }else {
              return G__4729__4730.cljs$core$IIndexed$
            }
          }()) {
            return true
          }else {
            if(!G__4729__4730.cljs$lang$protocol_mask$partition0$) {
              return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__4729__4730)
            }else {
              return false
            }
          }
        }else {
          return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__4729__4730)
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
    var G__4733__delegate = function(coll, k, v, kvs) {
      while(true) {
        var ret__4732 = assoc.call(null, coll, k, v);
        if(cljs.core.truth_(kvs)) {
          var G__4734 = ret__4732;
          var G__4735 = cljs.core.first.call(null, kvs);
          var G__4736 = cljs.core.second.call(null, kvs);
          var G__4737 = cljs.core.nnext.call(null, kvs);
          coll = G__4734;
          k = G__4735;
          v = G__4736;
          kvs = G__4737;
          continue
        }else {
          return ret__4732
        }
        break
      }
    };
    var G__4733 = function(coll, k, v, var_args) {
      var kvs = null;
      if(goog.isDef(var_args)) {
        kvs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__4733__delegate.call(this, coll, k, v, kvs)
    };
    G__4733.cljs$lang$maxFixedArity = 3;
    G__4733.cljs$lang$applyTo = function(arglist__4738) {
      var coll = cljs.core.first(arglist__4738);
      var k = cljs.core.first(cljs.core.next(arglist__4738));
      var v = cljs.core.first(cljs.core.next(cljs.core.next(arglist__4738)));
      var kvs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__4738)));
      return G__4733__delegate(coll, k, v, kvs)
    };
    G__4733.cljs$lang$arity$variadic = G__4733__delegate;
    return G__4733
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
    var G__4740__delegate = function(coll, k, ks) {
      while(true) {
        var ret__4739 = dissoc.call(null, coll, k);
        if(cljs.core.truth_(ks)) {
          var G__4741 = ret__4739;
          var G__4742 = cljs.core.first.call(null, ks);
          var G__4743 = cljs.core.next.call(null, ks);
          coll = G__4741;
          k = G__4742;
          ks = G__4743;
          continue
        }else {
          return ret__4739
        }
        break
      }
    };
    var G__4740 = function(coll, k, var_args) {
      var ks = null;
      if(goog.isDef(var_args)) {
        ks = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__4740__delegate.call(this, coll, k, ks)
    };
    G__4740.cljs$lang$maxFixedArity = 2;
    G__4740.cljs$lang$applyTo = function(arglist__4744) {
      var coll = cljs.core.first(arglist__4744);
      var k = cljs.core.first(cljs.core.next(arglist__4744));
      var ks = cljs.core.rest(cljs.core.next(arglist__4744));
      return G__4740__delegate(coll, k, ks)
    };
    G__4740.cljs$lang$arity$variadic = G__4740__delegate;
    return G__4740
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
    var G__4745__4746 = o;
    if(G__4745__4746 != null) {
      if(function() {
        var or__3824__auto____4747 = G__4745__4746.cljs$lang$protocol_mask$partition0$ & 65536;
        if(or__3824__auto____4747) {
          return or__3824__auto____4747
        }else {
          return G__4745__4746.cljs$core$IMeta$
        }
      }()) {
        return true
      }else {
        if(!G__4745__4746.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__4745__4746)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__4745__4746)
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
    var G__4749__delegate = function(coll, k, ks) {
      while(true) {
        var ret__4748 = disj.call(null, coll, k);
        if(cljs.core.truth_(ks)) {
          var G__4750 = ret__4748;
          var G__4751 = cljs.core.first.call(null, ks);
          var G__4752 = cljs.core.next.call(null, ks);
          coll = G__4750;
          k = G__4751;
          ks = G__4752;
          continue
        }else {
          return ret__4748
        }
        break
      }
    };
    var G__4749 = function(coll, k, var_args) {
      var ks = null;
      if(goog.isDef(var_args)) {
        ks = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__4749__delegate.call(this, coll, k, ks)
    };
    G__4749.cljs$lang$maxFixedArity = 2;
    G__4749.cljs$lang$applyTo = function(arglist__4753) {
      var coll = cljs.core.first(arglist__4753);
      var k = cljs.core.first(cljs.core.next(arglist__4753));
      var ks = cljs.core.rest(cljs.core.next(arglist__4753));
      return G__4749__delegate(coll, k, ks)
    };
    G__4749.cljs$lang$arity$variadic = G__4749__delegate;
    return G__4749
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
cljs.core.hash = function hash(o) {
  return cljs.core._hash.call(null, o)
};
cljs.core.empty_QMARK_ = function empty_QMARK_(coll) {
  return cljs.core.not.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.coll_QMARK_ = function coll_QMARK_(x) {
  if(x == null) {
    return false
  }else {
    var G__4754__4755 = x;
    if(G__4754__4755 != null) {
      if(function() {
        var or__3824__auto____4756 = G__4754__4755.cljs$lang$protocol_mask$partition0$ & 8;
        if(or__3824__auto____4756) {
          return or__3824__auto____4756
        }else {
          return G__4754__4755.cljs$core$ICollection$
        }
      }()) {
        return true
      }else {
        if(!G__4754__4755.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.ICollection, G__4754__4755)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ICollection, G__4754__4755)
    }
  }
};
cljs.core.set_QMARK_ = function set_QMARK_(x) {
  if(x == null) {
    return false
  }else {
    var G__4757__4758 = x;
    if(G__4757__4758 != null) {
      if(function() {
        var or__3824__auto____4759 = G__4757__4758.cljs$lang$protocol_mask$partition0$ & 2048;
        if(or__3824__auto____4759) {
          return or__3824__auto____4759
        }else {
          return G__4757__4758.cljs$core$ISet$
        }
      }()) {
        return true
      }else {
        if(!G__4757__4758.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.ISet, G__4757__4758)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ISet, G__4757__4758)
    }
  }
};
cljs.core.associative_QMARK_ = function associative_QMARK_(x) {
  var G__4760__4761 = x;
  if(G__4760__4761 != null) {
    if(function() {
      var or__3824__auto____4762 = G__4760__4761.cljs$lang$protocol_mask$partition0$ & 256;
      if(or__3824__auto____4762) {
        return or__3824__auto____4762
      }else {
        return G__4760__4761.cljs$core$IAssociative$
      }
    }()) {
      return true
    }else {
      if(!G__4760__4761.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IAssociative, G__4760__4761)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IAssociative, G__4760__4761)
  }
};
cljs.core.sequential_QMARK_ = function sequential_QMARK_(x) {
  var G__4763__4764 = x;
  if(G__4763__4764 != null) {
    if(function() {
      var or__3824__auto____4765 = G__4763__4764.cljs$lang$protocol_mask$partition0$ & 8388608;
      if(or__3824__auto____4765) {
        return or__3824__auto____4765
      }else {
        return G__4763__4764.cljs$core$ISequential$
      }
    }()) {
      return true
    }else {
      if(!G__4763__4764.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISequential, G__4763__4764)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ISequential, G__4763__4764)
  }
};
cljs.core.counted_QMARK_ = function counted_QMARK_(x) {
  var G__4766__4767 = x;
  if(G__4766__4767 != null) {
    if(function() {
      var or__3824__auto____4768 = G__4766__4767.cljs$lang$protocol_mask$partition0$ & 2;
      if(or__3824__auto____4768) {
        return or__3824__auto____4768
      }else {
        return G__4766__4767.cljs$core$ICounted$
      }
    }()) {
      return true
    }else {
      if(!G__4766__4767.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.ICounted, G__4766__4767)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ICounted, G__4766__4767)
  }
};
cljs.core.indexed_QMARK_ = function indexed_QMARK_(x) {
  var G__4769__4770 = x;
  if(G__4769__4770 != null) {
    if(function() {
      var or__3824__auto____4771 = G__4769__4770.cljs$lang$protocol_mask$partition0$ & 16;
      if(or__3824__auto____4771) {
        return or__3824__auto____4771
      }else {
        return G__4769__4770.cljs$core$IIndexed$
      }
    }()) {
      return true
    }else {
      if(!G__4769__4770.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__4769__4770)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__4769__4770)
  }
};
cljs.core.reduceable_QMARK_ = function reduceable_QMARK_(x) {
  var G__4772__4773 = x;
  if(G__4772__4773 != null) {
    if(function() {
      var or__3824__auto____4774 = G__4772__4773.cljs$lang$protocol_mask$partition0$ & 262144;
      if(or__3824__auto____4774) {
        return or__3824__auto____4774
      }else {
        return G__4772__4773.cljs$core$IReduce$
      }
    }()) {
      return true
    }else {
      if(!G__4772__4773.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__4772__4773)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__4772__4773)
  }
};
cljs.core.map_QMARK_ = function map_QMARK_(x) {
  if(x == null) {
    return false
  }else {
    var G__4775__4776 = x;
    if(G__4775__4776 != null) {
      if(function() {
        var or__3824__auto____4777 = G__4775__4776.cljs$lang$protocol_mask$partition0$ & 512;
        if(or__3824__auto____4777) {
          return or__3824__auto____4777
        }else {
          return G__4775__4776.cljs$core$IMap$
        }
      }()) {
        return true
      }else {
        if(!G__4775__4776.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IMap, G__4775__4776)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IMap, G__4775__4776)
    }
  }
};
cljs.core.vector_QMARK_ = function vector_QMARK_(x) {
  var G__4778__4779 = x;
  if(G__4778__4779 != null) {
    if(function() {
      var or__3824__auto____4780 = G__4778__4779.cljs$lang$protocol_mask$partition0$ & 8192;
      if(or__3824__auto____4780) {
        return or__3824__auto____4780
      }else {
        return G__4778__4779.cljs$core$IVector$
      }
    }()) {
      return true
    }else {
      if(!G__4778__4779.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IVector, G__4778__4779)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IVector, G__4778__4779)
  }
};
cljs.core.js_obj = function() {
  var js_obj = null;
  var js_obj__0 = function() {
    return{}
  };
  var js_obj__1 = function() {
    var G__4781__delegate = function(keyvals) {
      return cljs.core.apply.call(null, goog.object.create, keyvals)
    };
    var G__4781 = function(var_args) {
      var keyvals = null;
      if(goog.isDef(var_args)) {
        keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__4781__delegate.call(this, keyvals)
    };
    G__4781.cljs$lang$maxFixedArity = 0;
    G__4781.cljs$lang$applyTo = function(arglist__4782) {
      var keyvals = cljs.core.seq(arglist__4782);
      return G__4781__delegate(keyvals)
    };
    G__4781.cljs$lang$arity$variadic = G__4781__delegate;
    return G__4781
  }();
  js_obj = function(var_args) {
    var keyvals = var_args;
    switch(arguments.length) {
      case 0:
        return js_obj__0.call(this);
      default:
        return js_obj__1.cljs$lang$arity$variadic(falsecljs.core.array_seq(arguments, 0))
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
  var keys__4783 = [];
  goog.object.forEach.call(null, obj, function(val, key, obj) {
    return keys__4783.push(key)
  });
  return keys__4783
};
cljs.core.js_delete = function js_delete(obj, key) {
  return delete obj[key]
};
cljs.core.array_copy = function array_copy(from, i, to, j, len) {
  var i__4784 = i;
  var j__4785 = j;
  var len__4786 = len;
  while(true) {
    if(len__4786 === 0) {
      return to
    }else {
      to[j__4785] = from[i__4784];
      var G__4787 = i__4784 + 1;
      var G__4788 = j__4785 + 1;
      var G__4789 = len__4786 - 1;
      i__4784 = G__4787;
      j__4785 = G__4788;
      len__4786 = G__4789;
      continue
    }
    break
  }
};
cljs.core.array_copy_downward = function array_copy_downward(from, i, to, j, len) {
  var i__4790 = i + (len - 1);
  var j__4791 = j + (len - 1);
  var len__4792 = len;
  while(true) {
    if(len__4792 === 0) {
      return to
    }else {
      to[j__4791] = from[i__4790];
      var G__4793 = i__4790 - 1;
      var G__4794 = j__4791 - 1;
      var G__4795 = len__4792 - 1;
      i__4790 = G__4793;
      j__4791 = G__4794;
      len__4792 = G__4795;
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
cljs.core.instance_QMARK_ = function instance_QMARK_(t, o) {
  return o != null && (o instanceof t || o.constructor === t || t === Object)
};
cljs.core.seq_QMARK_ = function seq_QMARK_(s) {
  if(s == null) {
    return false
  }else {
    var G__4796__4797 = s;
    if(G__4796__4797 != null) {
      if(function() {
        var or__3824__auto____4798 = G__4796__4797.cljs$lang$protocol_mask$partition0$ & 64;
        if(or__3824__auto____4798) {
          return or__3824__auto____4798
        }else {
          return G__4796__4797.cljs$core$ISeq$
        }
      }()) {
        return true
      }else {
        if(!G__4796__4797.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__4796__4797)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__4796__4797)
    }
  }
};
cljs.core.seqable_QMARK_ = function seqable_QMARK_(s) {
  var G__4799__4800 = s;
  if(G__4799__4800 != null) {
    if(function() {
      var or__3824__auto____4801 = G__4799__4800.cljs$lang$protocol_mask$partition0$ & 4194304;
      if(or__3824__auto____4801) {
        return or__3824__auto____4801
      }else {
        return G__4799__4800.cljs$core$ISeqable$
      }
    }()) {
      return true
    }else {
      if(!G__4799__4800.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeqable, G__4799__4800)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ISeqable, G__4799__4800)
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
  var and__3822__auto____4802 = goog.isString.call(null, x);
  if(cljs.core.truth_(and__3822__auto____4802)) {
    return cljs.core.not.call(null, function() {
      var or__3824__auto____4803 = x.charAt(0) === "\ufdd0";
      if(or__3824__auto____4803) {
        return or__3824__auto____4803
      }else {
        return x.charAt(0) === "\ufdd1"
      }
    }())
  }else {
    return and__3822__auto____4802
  }
};
cljs.core.keyword_QMARK_ = function keyword_QMARK_(x) {
  var and__3822__auto____4804 = goog.isString.call(null, x);
  if(cljs.core.truth_(and__3822__auto____4804)) {
    return x.charAt(0) === "\ufdd0"
  }else {
    return and__3822__auto____4804
  }
};
cljs.core.symbol_QMARK_ = function symbol_QMARK_(x) {
  var and__3822__auto____4805 = goog.isString.call(null, x);
  if(cljs.core.truth_(and__3822__auto____4805)) {
    return x.charAt(0) === "\ufdd1"
  }else {
    return and__3822__auto____4805
  }
};
cljs.core.number_QMARK_ = function number_QMARK_(n) {
  return goog.isNumber.call(null, n)
};
cljs.core.fn_QMARK_ = function fn_QMARK_(f) {
  return goog.isFunction.call(null, f)
};
cljs.core.ifn_QMARK_ = function ifn_QMARK_(f) {
  var or__3824__auto____4806 = cljs.core.fn_QMARK_.call(null, f);
  if(or__3824__auto____4806) {
    return or__3824__auto____4806
  }else {
    var G__4807__4808 = f;
    if(G__4807__4808 != null) {
      if(function() {
        var or__3824__auto____4809 = G__4807__4808.cljs$lang$protocol_mask$partition0$ & 1;
        if(or__3824__auto____4809) {
          return or__3824__auto____4809
        }else {
          return G__4807__4808.cljs$core$IFn$
        }
      }()) {
        return true
      }else {
        if(!G__4807__4808.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IFn, G__4807__4808)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IFn, G__4807__4808)
    }
  }
};
cljs.core.integer_QMARK_ = function integer_QMARK_(n) {
  var and__3822__auto____4810 = cljs.core.number_QMARK_.call(null, n);
  if(and__3822__auto____4810) {
    return n == n.toFixed()
  }else {
    return and__3822__auto____4810
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
    var and__3822__auto____4811 = coll;
    if(cljs.core.truth_(and__3822__auto____4811)) {
      var and__3822__auto____4812 = cljs.core.associative_QMARK_.call(null, coll);
      if(and__3822__auto____4812) {
        return cljs.core.contains_QMARK_.call(null, coll, k)
      }else {
        return and__3822__auto____4812
      }
    }else {
      return and__3822__auto____4811
    }
  }())) {
    return cljs.core.PersistentVector.fromArray([k, cljs.core._lookup.call(null, coll, k)])
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
    return cljs.core.not.call(null, cljs.core._EQ_.call(null, x, y))
  };
  var distinct_QMARK___3 = function() {
    var G__4817__delegate = function(x, y, more) {
      if(cljs.core.not.call(null, cljs.core._EQ_.call(null, x, y))) {
        var s__4813 = cljs.core.set([y, x]);
        var xs__4814 = more;
        while(true) {
          var x__4815 = cljs.core.first.call(null, xs__4814);
          var etc__4816 = cljs.core.next.call(null, xs__4814);
          if(cljs.core.truth_(xs__4814)) {
            if(cljs.core.contains_QMARK_.call(null, s__4813, x__4815)) {
              return false
            }else {
              var G__4818 = cljs.core.conj.call(null, s__4813, x__4815);
              var G__4819 = etc__4816;
              s__4813 = G__4818;
              xs__4814 = G__4819;
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
    var G__4817 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__4817__delegate.call(this, x, y, more)
    };
    G__4817.cljs$lang$maxFixedArity = 2;
    G__4817.cljs$lang$applyTo = function(arglist__4820) {
      var x = cljs.core.first(arglist__4820);
      var y = cljs.core.first(cljs.core.next(arglist__4820));
      var more = cljs.core.rest(cljs.core.next(arglist__4820));
      return G__4817__delegate(x, y, more)
    };
    G__4817.cljs$lang$arity$variadic = G__4817__delegate;
    return G__4817
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
  if(cljs.core.type.call(null, x) === cljs.core.type.call(null, y)) {
    return goog.array.defaultCompare.call(null, x, y)
  }else {
    if(x == null) {
      return-1
    }else {
      if(y == null) {
        return 1
      }else {
        if("\ufdd0'else") {
          throw new Error("compare on non-nil objects of different types");
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.fn__GT_comparator = function fn__GT_comparator(f) {
  if(cljs.core._EQ_.call(null, f, cljs.core.compare)) {
    return cljs.core.compare
  }else {
    return function(x, y) {
      var r__4821 = f.call(null, x, y);
      if(cljs.core.number_QMARK_.call(null, r__4821)) {
        return r__4821
      }else {
        if(cljs.core.truth_(r__4821)) {
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
void 0;
cljs.core.sort = function() {
  var sort = null;
  var sort__1 = function(coll) {
    return sort.call(null, cljs.core.compare, coll)
  };
  var sort__2 = function(comp, coll) {
    if(cljs.core.truth_(cljs.core.seq.call(null, coll))) {
      var a__4822 = cljs.core.to_array.call(null, coll);
      goog.array.stableSort.call(null, a__4822, cljs.core.fn__GT_comparator.call(null, comp));
      return cljs.core.seq.call(null, a__4822)
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
    var temp__3971__auto____4823 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3971__auto____4823)) {
      var s__4824 = temp__3971__auto____4823;
      return cljs.core.reduce.call(null, f, cljs.core.first.call(null, s__4824), cljs.core.next.call(null, s__4824))
    }else {
      return f.call(null)
    }
  };
  var seq_reduce__3 = function(f, val, coll) {
    var val__4825 = val;
    var coll__4826 = cljs.core.seq.call(null, coll);
    while(true) {
      if(cljs.core.truth_(coll__4826)) {
        var nval__4827 = f.call(null, val__4825, cljs.core.first.call(null, coll__4826));
        if(cljs.core.reduced_QMARK_.call(null, nval__4827)) {
          return cljs.core.deref.call(null, nval__4827)
        }else {
          var G__4828 = nval__4827;
          var G__4829 = cljs.core.next.call(null, coll__4826);
          val__4825 = G__4828;
          coll__4826 = G__4829;
          continue
        }
      }else {
        return val__4825
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
cljs.core.reduce = function() {
  var reduce = null;
  var reduce__2 = function(f, coll) {
    if(function() {
      var G__4830__4831 = coll;
      if(G__4830__4831 != null) {
        if(function() {
          var or__3824__auto____4832 = G__4830__4831.cljs$lang$protocol_mask$partition0$ & 262144;
          if(or__3824__auto____4832) {
            return or__3824__auto____4832
          }else {
            return G__4830__4831.cljs$core$IReduce$
          }
        }()) {
          return true
        }else {
          if(!G__4830__4831.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__4830__4831)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__4830__4831)
      }
    }()) {
      return cljs.core._reduce.call(null, coll, f)
    }else {
      return cljs.core.seq_reduce.call(null, f, coll)
    }
  };
  var reduce__3 = function(f, val, coll) {
    if(function() {
      var G__4833__4834 = coll;
      if(G__4833__4834 != null) {
        if(function() {
          var or__3824__auto____4835 = G__4833__4834.cljs$lang$protocol_mask$partition0$ & 262144;
          if(or__3824__auto____4835) {
            return or__3824__auto____4835
          }else {
            return G__4833__4834.cljs$core$IReduce$
          }
        }()) {
          return true
        }else {
          if(!G__4833__4834.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__4833__4834)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__4833__4834)
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
  this.cljs$lang$protocol_mask$partition0$ = 16384
};
cljs.core.Reduced.cljs$lang$type = true;
cljs.core.Reduced.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.Reduced")
};
cljs.core.Reduced.prototype.cljs$core$IDeref$ = true;
cljs.core.Reduced.prototype.cljs$core$IDeref$_deref$arity$1 = function(o) {
  var this__4836 = this;
  return this__4836.val
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
    var G__4837__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _PLUS_, x + y, more)
    };
    var G__4837 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__4837__delegate.call(this, x, y, more)
    };
    G__4837.cljs$lang$maxFixedArity = 2;
    G__4837.cljs$lang$applyTo = function(arglist__4838) {
      var x = cljs.core.first(arglist__4838);
      var y = cljs.core.first(cljs.core.next(arglist__4838));
      var more = cljs.core.rest(cljs.core.next(arglist__4838));
      return G__4837__delegate(x, y, more)
    };
    G__4837.cljs$lang$arity$variadic = G__4837__delegate;
    return G__4837
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
    var G__4839__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _, x - y, more)
    };
    var G__4839 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__4839__delegate.call(this, x, y, more)
    };
    G__4839.cljs$lang$maxFixedArity = 2;
    G__4839.cljs$lang$applyTo = function(arglist__4840) {
      var x = cljs.core.first(arglist__4840);
      var y = cljs.core.first(cljs.core.next(arglist__4840));
      var more = cljs.core.rest(cljs.core.next(arglist__4840));
      return G__4839__delegate(x, y, more)
    };
    G__4839.cljs$lang$arity$variadic = G__4839__delegate;
    return G__4839
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
    var G__4841__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _STAR_, x * y, more)
    };
    var G__4841 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__4841__delegate.call(this, x, y, more)
    };
    G__4841.cljs$lang$maxFixedArity = 2;
    G__4841.cljs$lang$applyTo = function(arglist__4842) {
      var x = cljs.core.first(arglist__4842);
      var y = cljs.core.first(cljs.core.next(arglist__4842));
      var more = cljs.core.rest(cljs.core.next(arglist__4842));
      return G__4841__delegate(x, y, more)
    };
    G__4841.cljs$lang$arity$variadic = G__4841__delegate;
    return G__4841
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
    var G__4843__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _SLASH_, _SLASH_.call(null, x, y), more)
    };
    var G__4843 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__4843__delegate.call(this, x, y, more)
    };
    G__4843.cljs$lang$maxFixedArity = 2;
    G__4843.cljs$lang$applyTo = function(arglist__4844) {
      var x = cljs.core.first(arglist__4844);
      var y = cljs.core.first(cljs.core.next(arglist__4844));
      var more = cljs.core.rest(cljs.core.next(arglist__4844));
      return G__4843__delegate(x, y, more)
    };
    G__4843.cljs$lang$arity$variadic = G__4843__delegate;
    return G__4843
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
    var G__4845__delegate = function(x, y, more) {
      while(true) {
        if(x < y) {
          if(cljs.core.truth_(cljs.core.next.call(null, more))) {
            var G__4846 = y;
            var G__4847 = cljs.core.first.call(null, more);
            var G__4848 = cljs.core.next.call(null, more);
            x = G__4846;
            y = G__4847;
            more = G__4848;
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
    var G__4845 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__4845__delegate.call(this, x, y, more)
    };
    G__4845.cljs$lang$maxFixedArity = 2;
    G__4845.cljs$lang$applyTo = function(arglist__4849) {
      var x = cljs.core.first(arglist__4849);
      var y = cljs.core.first(cljs.core.next(arglist__4849));
      var more = cljs.core.rest(cljs.core.next(arglist__4849));
      return G__4845__delegate(x, y, more)
    };
    G__4845.cljs$lang$arity$variadic = G__4845__delegate;
    return G__4845
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
    var G__4850__delegate = function(x, y, more) {
      while(true) {
        if(x <= y) {
          if(cljs.core.truth_(cljs.core.next.call(null, more))) {
            var G__4851 = y;
            var G__4852 = cljs.core.first.call(null, more);
            var G__4853 = cljs.core.next.call(null, more);
            x = G__4851;
            y = G__4852;
            more = G__4853;
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
    var G__4850 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__4850__delegate.call(this, x, y, more)
    };
    G__4850.cljs$lang$maxFixedArity = 2;
    G__4850.cljs$lang$applyTo = function(arglist__4854) {
      var x = cljs.core.first(arglist__4854);
      var y = cljs.core.first(cljs.core.next(arglist__4854));
      var more = cljs.core.rest(cljs.core.next(arglist__4854));
      return G__4850__delegate(x, y, more)
    };
    G__4850.cljs$lang$arity$variadic = G__4850__delegate;
    return G__4850
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
    var G__4855__delegate = function(x, y, more) {
      while(true) {
        if(x > y) {
          if(cljs.core.truth_(cljs.core.next.call(null, more))) {
            var G__4856 = y;
            var G__4857 = cljs.core.first.call(null, more);
            var G__4858 = cljs.core.next.call(null, more);
            x = G__4856;
            y = G__4857;
            more = G__4858;
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
    var G__4855 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__4855__delegate.call(this, x, y, more)
    };
    G__4855.cljs$lang$maxFixedArity = 2;
    G__4855.cljs$lang$applyTo = function(arglist__4859) {
      var x = cljs.core.first(arglist__4859);
      var y = cljs.core.first(cljs.core.next(arglist__4859));
      var more = cljs.core.rest(cljs.core.next(arglist__4859));
      return G__4855__delegate(x, y, more)
    };
    G__4855.cljs$lang$arity$variadic = G__4855__delegate;
    return G__4855
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
    var G__4860__delegate = function(x, y, more) {
      while(true) {
        if(x >= y) {
          if(cljs.core.truth_(cljs.core.next.call(null, more))) {
            var G__4861 = y;
            var G__4862 = cljs.core.first.call(null, more);
            var G__4863 = cljs.core.next.call(null, more);
            x = G__4861;
            y = G__4862;
            more = G__4863;
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
    var G__4860 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__4860__delegate.call(this, x, y, more)
    };
    G__4860.cljs$lang$maxFixedArity = 2;
    G__4860.cljs$lang$applyTo = function(arglist__4864) {
      var x = cljs.core.first(arglist__4864);
      var y = cljs.core.first(cljs.core.next(arglist__4864));
      var more = cljs.core.rest(cljs.core.next(arglist__4864));
      return G__4860__delegate(x, y, more)
    };
    G__4860.cljs$lang$arity$variadic = G__4860__delegate;
    return G__4860
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
    var G__4865__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, max, x > y ? x : y, more)
    };
    var G__4865 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__4865__delegate.call(this, x, y, more)
    };
    G__4865.cljs$lang$maxFixedArity = 2;
    G__4865.cljs$lang$applyTo = function(arglist__4866) {
      var x = cljs.core.first(arglist__4866);
      var y = cljs.core.first(cljs.core.next(arglist__4866));
      var more = cljs.core.rest(cljs.core.next(arglist__4866));
      return G__4865__delegate(x, y, more)
    };
    G__4865.cljs$lang$arity$variadic = G__4865__delegate;
    return G__4865
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
    var G__4867__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, min, x < y ? x : y, more)
    };
    var G__4867 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__4867__delegate.call(this, x, y, more)
    };
    G__4867.cljs$lang$maxFixedArity = 2;
    G__4867.cljs$lang$applyTo = function(arglist__4868) {
      var x = cljs.core.first(arglist__4868);
      var y = cljs.core.first(cljs.core.next(arglist__4868));
      var more = cljs.core.rest(cljs.core.next(arglist__4868));
      return G__4867__delegate(x, y, more)
    };
    G__4867.cljs$lang$arity$variadic = G__4867__delegate;
    return G__4867
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
  var rem__4869 = n % d;
  return cljs.core.fix.call(null, (n - rem__4869) / d)
};
cljs.core.rem = function rem(n, d) {
  var q__4870 = cljs.core.quot.call(null, n, d);
  return n - d * q__4870
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
cljs.core.bit_count = function bit_count(n) {
  var c__4871 = 0;
  var n__4872 = n;
  while(true) {
    if(n__4872 === 0) {
      return c__4871
    }else {
      var G__4873 = c__4871 + 1;
      var G__4874 = n__4872 & n__4872 - 1;
      c__4871 = G__4873;
      n__4872 = G__4874;
      continue
    }
    break
  }
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
    var G__4875__delegate = function(x, y, more) {
      while(true) {
        if(cljs.core.truth_(_EQ__EQ_.call(null, x, y))) {
          if(cljs.core.truth_(cljs.core.next.call(null, more))) {
            var G__4876 = y;
            var G__4877 = cljs.core.first.call(null, more);
            var G__4878 = cljs.core.next.call(null, more);
            x = G__4876;
            y = G__4877;
            more = G__4878;
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
    var G__4875 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__4875__delegate.call(this, x, y, more)
    };
    G__4875.cljs$lang$maxFixedArity = 2;
    G__4875.cljs$lang$applyTo = function(arglist__4879) {
      var x = cljs.core.first(arglist__4879);
      var y = cljs.core.first(cljs.core.next(arglist__4879));
      var more = cljs.core.rest(cljs.core.next(arglist__4879));
      return G__4875__delegate(x, y, more)
    };
    G__4875.cljs$lang$arity$variadic = G__4875__delegate;
    return G__4875
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
  var n__4880 = n;
  var xs__4881 = cljs.core.seq.call(null, coll);
  while(true) {
    if(cljs.core.truth_(function() {
      var and__3822__auto____4882 = xs__4881;
      if(cljs.core.truth_(and__3822__auto____4882)) {
        return n__4880 > 0
      }else {
        return and__3822__auto____4882
      }
    }())) {
      var G__4883 = n__4880 - 1;
      var G__4884 = cljs.core.next.call(null, xs__4881);
      n__4880 = G__4883;
      xs__4881 = G__4884;
      continue
    }else {
      return xs__4881
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
    var G__4885__delegate = function(x, ys) {
      return function(sb, more) {
        while(true) {
          if(cljs.core.truth_(more)) {
            var G__4886 = sb.append(str_STAR_.call(null, cljs.core.first.call(null, more)));
            var G__4887 = cljs.core.next.call(null, more);
            sb = G__4886;
            more = G__4887;
            continue
          }else {
            return str_STAR_.call(null, sb)
          }
          break
        }
      }.call(null, new goog.string.StringBuffer(str_STAR_.call(null, x)), ys)
    };
    var G__4885 = function(x, var_args) {
      var ys = null;
      if(goog.isDef(var_args)) {
        ys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__4885__delegate.call(this, x, ys)
    };
    G__4885.cljs$lang$maxFixedArity = 1;
    G__4885.cljs$lang$applyTo = function(arglist__4888) {
      var x = cljs.core.first(arglist__4888);
      var ys = cljs.core.rest(arglist__4888);
      return G__4885__delegate(x, ys)
    };
    G__4885.cljs$lang$arity$variadic = G__4885__delegate;
    return G__4885
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
    var G__4889__delegate = function(x, ys) {
      return function(sb, more) {
        while(true) {
          if(cljs.core.truth_(more)) {
            var G__4890 = sb.append(str.call(null, cljs.core.first.call(null, more)));
            var G__4891 = cljs.core.next.call(null, more);
            sb = G__4890;
            more = G__4891;
            continue
          }else {
            return cljs.core.str_STAR_.call(null, sb)
          }
          break
        }
      }.call(null, new goog.string.StringBuffer(str.call(null, x)), ys)
    };
    var G__4889 = function(x, var_args) {
      var ys = null;
      if(goog.isDef(var_args)) {
        ys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__4889__delegate.call(this, x, ys)
    };
    G__4889.cljs$lang$maxFixedArity = 1;
    G__4889.cljs$lang$applyTo = function(arglist__4892) {
      var x = cljs.core.first(arglist__4892);
      var ys = cljs.core.rest(arglist__4892);
      return G__4889__delegate(x, ys)
    };
    G__4889.cljs$lang$arity$variadic = G__4889__delegate;
    return G__4889
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
    var xs__4893 = cljs.core.seq.call(null, x);
    var ys__4894 = cljs.core.seq.call(null, y);
    while(true) {
      if(xs__4893 == null) {
        return ys__4894 == null
      }else {
        if(ys__4894 == null) {
          return false
        }else {
          if(cljs.core._EQ_.call(null, cljs.core.first.call(null, xs__4893), cljs.core.first.call(null, ys__4894))) {
            var G__4895 = cljs.core.next.call(null, xs__4893);
            var G__4896 = cljs.core.next.call(null, ys__4894);
            xs__4893 = G__4895;
            ys__4894 = G__4896;
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
  return cljs.core.reduce.call(null, function(p1__4897_SHARP_, p2__4898_SHARP_) {
    return cljs.core.hash_combine.call(null, p1__4897_SHARP_, cljs.core.hash.call(null, p2__4898_SHARP_))
  }, cljs.core.hash.call(null, cljs.core.first.call(null, coll)), cljs.core.next.call(null, coll))
};
void 0;
void 0;
cljs.core.hash_imap = function hash_imap(m) {
  var h__4899 = 0;
  var s__4900 = cljs.core.seq.call(null, m);
  while(true) {
    if(cljs.core.truth_(s__4900)) {
      var e__4901 = cljs.core.first.call(null, s__4900);
      var G__4902 = (h__4899 + (cljs.core.hash.call(null, cljs.core.key.call(null, e__4901)) ^ cljs.core.hash.call(null, cljs.core.val.call(null, e__4901)))) % 4503599627370496;
      var G__4903 = cljs.core.next.call(null, s__4900);
      h__4899 = G__4902;
      s__4900 = G__4903;
      continue
    }else {
      return h__4899
    }
    break
  }
};
cljs.core.hash_iset = function hash_iset(s) {
  var h__4904 = 0;
  var s__4905 = cljs.core.seq.call(null, s);
  while(true) {
    if(cljs.core.truth_(s__4905)) {
      var e__4906 = cljs.core.first.call(null, s__4905);
      var G__4907 = (h__4904 + cljs.core.hash.call(null, e__4906)) % 4503599627370496;
      var G__4908 = cljs.core.next.call(null, s__4905);
      h__4904 = G__4907;
      s__4905 = G__4908;
      continue
    }else {
      return h__4904
    }
    break
  }
};
void 0;
cljs.core.extend_object_BANG_ = function extend_object_BANG_(obj, fn_map) {
  var G__4909__4910 = cljs.core.seq.call(null, fn_map);
  if(cljs.core.truth_(G__4909__4910)) {
    var G__4912__4914 = cljs.core.first.call(null, G__4909__4910);
    var vec__4913__4915 = G__4912__4914;
    var key_name__4916 = cljs.core.nth.call(null, vec__4913__4915, 0, null);
    var f__4917 = cljs.core.nth.call(null, vec__4913__4915, 1, null);
    var G__4909__4918 = G__4909__4910;
    var G__4912__4919 = G__4912__4914;
    var G__4909__4920 = G__4909__4918;
    while(true) {
      var vec__4921__4922 = G__4912__4919;
      var key_name__4923 = cljs.core.nth.call(null, vec__4921__4922, 0, null);
      var f__4924 = cljs.core.nth.call(null, vec__4921__4922, 1, null);
      var G__4909__4925 = G__4909__4920;
      var str_name__4926 = cljs.core.name.call(null, key_name__4923);
      obj[str_name__4926] = f__4924;
      var temp__3974__auto____4927 = cljs.core.next.call(null, G__4909__4925);
      if(cljs.core.truth_(temp__3974__auto____4927)) {
        var G__4909__4928 = temp__3974__auto____4927;
        var G__4929 = cljs.core.first.call(null, G__4909__4928);
        var G__4930 = G__4909__4928;
        G__4912__4919 = G__4929;
        G__4909__4920 = G__4930;
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
  this.cljs$lang$protocol_mask$partition0$ = 32706670
};
cljs.core.List.cljs$lang$type = true;
cljs.core.List.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.List")
};
cljs.core.List.prototype.cljs$core$IHash$ = true;
cljs.core.List.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__4931 = this;
  var h__364__auto____4932 = this__4931.__hash;
  if(h__364__auto____4932 != null) {
    return h__364__auto____4932
  }else {
    var h__364__auto____4933 = cljs.core.hash_coll.call(null, coll);
    this__4931.__hash = h__364__auto____4933;
    return h__364__auto____4933
  }
};
cljs.core.List.prototype.cljs$core$ISequential$ = true;
cljs.core.List.prototype.cljs$core$ICollection$ = true;
cljs.core.List.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__4934 = this;
  return new cljs.core.List(this__4934.meta, o, coll, this__4934.count + 1, null)
};
cljs.core.List.prototype.cljs$core$ASeq$ = true;
cljs.core.List.prototype.toString = function() {
  var this__4935 = this;
  var this$__4936 = this;
  return cljs.core.pr_str.call(null, this$__4936)
};
cljs.core.List.prototype.cljs$core$ISeqable$ = true;
cljs.core.List.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__4937 = this;
  return coll
};
cljs.core.List.prototype.cljs$core$ICounted$ = true;
cljs.core.List.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__4938 = this;
  return this__4938.count
};
cljs.core.List.prototype.cljs$core$IStack$ = true;
cljs.core.List.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__4939 = this;
  return this__4939.first
};
cljs.core.List.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__4940 = this;
  return cljs.core._rest.call(null, coll)
};
cljs.core.List.prototype.cljs$core$ISeq$ = true;
cljs.core.List.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__4941 = this;
  return this__4941.first
};
cljs.core.List.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__4942 = this;
  return this__4942.rest
};
cljs.core.List.prototype.cljs$core$IEquiv$ = true;
cljs.core.List.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__4943 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.List.prototype.cljs$core$IWithMeta$ = true;
cljs.core.List.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__4944 = this;
  return new cljs.core.List(meta, this__4944.first, this__4944.rest, this__4944.count, this__4944.__hash)
};
cljs.core.List.prototype.cljs$core$IMeta$ = true;
cljs.core.List.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__4945 = this;
  return this__4945.meta
};
cljs.core.List.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.List.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__4946 = this;
  return cljs.core.List.EMPTY
};
cljs.core.List.prototype.cljs$core$IList$ = true;
cljs.core.List;
cljs.core.EmptyList = function(meta) {
  this.meta = meta;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32706638
};
cljs.core.EmptyList.cljs$lang$type = true;
cljs.core.EmptyList.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.EmptyList")
};
cljs.core.EmptyList.prototype.cljs$core$IHash$ = true;
cljs.core.EmptyList.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__4947 = this;
  return 0
};
cljs.core.EmptyList.prototype.cljs$core$ISequential$ = true;
cljs.core.EmptyList.prototype.cljs$core$ICollection$ = true;
cljs.core.EmptyList.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__4948 = this;
  return new cljs.core.List(this__4948.meta, o, null, 1, null)
};
cljs.core.EmptyList.prototype.toString = function() {
  var this__4949 = this;
  var this$__4950 = this;
  return cljs.core.pr_str.call(null, this$__4950)
};
cljs.core.EmptyList.prototype.cljs$core$ISeqable$ = true;
cljs.core.EmptyList.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__4951 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ICounted$ = true;
cljs.core.EmptyList.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__4952 = this;
  return 0
};
cljs.core.EmptyList.prototype.cljs$core$IStack$ = true;
cljs.core.EmptyList.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__4953 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__4954 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ISeq$ = true;
cljs.core.EmptyList.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__4955 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__4956 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$IEquiv$ = true;
cljs.core.EmptyList.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__4957 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.EmptyList.prototype.cljs$core$IWithMeta$ = true;
cljs.core.EmptyList.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__4958 = this;
  return new cljs.core.EmptyList(meta)
};
cljs.core.EmptyList.prototype.cljs$core$IMeta$ = true;
cljs.core.EmptyList.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__4959 = this;
  return this__4959.meta
};
cljs.core.EmptyList.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.EmptyList.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__4960 = this;
  return coll
};
cljs.core.EmptyList.prototype.cljs$core$IList$ = true;
cljs.core.EmptyList;
cljs.core.List.EMPTY = new cljs.core.EmptyList(null);
cljs.core.reversible_QMARK_ = function reversible_QMARK_(coll) {
  var G__4961__4962 = coll;
  if(G__4961__4962 != null) {
    if(function() {
      var or__3824__auto____4963 = G__4961__4962.cljs$lang$protocol_mask$partition0$ & 67108864;
      if(or__3824__auto____4963) {
        return or__3824__auto____4963
      }else {
        return G__4961__4962.cljs$core$IReversible$
      }
    }()) {
      return true
    }else {
      if(!G__4961__4962.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReversible, G__4961__4962)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IReversible, G__4961__4962)
  }
};
cljs.core.rseq = function rseq(coll) {
  return cljs.core._rseq.call(null, coll)
};
cljs.core.reverse = function reverse(coll) {
  return cljs.core.reduce.call(null, cljs.core.conj, cljs.core.List.EMPTY, coll)
};
cljs.core.list = function() {
  var list__delegate = function(items) {
    return cljs.core.reduce.call(null, cljs.core.conj, cljs.core.List.EMPTY, cljs.core.reverse.call(null, items))
  };
  var list = function(var_args) {
    var items = null;
    if(goog.isDef(var_args)) {
      items = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return list__delegate.call(this, items)
  };
  list.cljs$lang$maxFixedArity = 0;
  list.cljs$lang$applyTo = function(arglist__4964) {
    var items = cljs.core.seq(arglist__4964);
    return list__delegate(items)
  };
  list.cljs$lang$arity$variadic = list__delegate;
  return list
}();
cljs.core.Cons = function(meta, first, rest, __hash) {
  this.meta = meta;
  this.first = first;
  this.rest = rest;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32702572
};
cljs.core.Cons.cljs$lang$type = true;
cljs.core.Cons.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.Cons")
};
cljs.core.Cons.prototype.cljs$core$IHash$ = true;
cljs.core.Cons.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__4965 = this;
  var h__364__auto____4966 = this__4965.__hash;
  if(h__364__auto____4966 != null) {
    return h__364__auto____4966
  }else {
    var h__364__auto____4967 = cljs.core.hash_coll.call(null, coll);
    this__4965.__hash = h__364__auto____4967;
    return h__364__auto____4967
  }
};
cljs.core.Cons.prototype.cljs$core$ISequential$ = true;
cljs.core.Cons.prototype.cljs$core$ICollection$ = true;
cljs.core.Cons.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__4968 = this;
  return new cljs.core.Cons(null, o, coll, this__4968.__hash)
};
cljs.core.Cons.prototype.cljs$core$ASeq$ = true;
cljs.core.Cons.prototype.toString = function() {
  var this__4969 = this;
  var this$__4970 = this;
  return cljs.core.pr_str.call(null, this$__4970)
};
cljs.core.Cons.prototype.cljs$core$ISeqable$ = true;
cljs.core.Cons.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__4971 = this;
  return coll
};
cljs.core.Cons.prototype.cljs$core$ISeq$ = true;
cljs.core.Cons.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__4972 = this;
  return this__4972.first
};
cljs.core.Cons.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__4973 = this;
  if(this__4973.rest == null) {
    return cljs.core.List.EMPTY
  }else {
    return this__4973.rest
  }
};
cljs.core.Cons.prototype.cljs$core$IEquiv$ = true;
cljs.core.Cons.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__4974 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Cons.prototype.cljs$core$IWithMeta$ = true;
cljs.core.Cons.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__4975 = this;
  return new cljs.core.Cons(meta, this__4975.first, this__4975.rest, this__4975.__hash)
};
cljs.core.Cons.prototype.cljs$core$IMeta$ = true;
cljs.core.Cons.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__4976 = this;
  return this__4976.meta
};
cljs.core.Cons.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.Cons.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__4977 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__4977.meta)
};
cljs.core.Cons.prototype.cljs$core$IList$ = true;
cljs.core.Cons;
cljs.core.cons = function cons(x, coll) {
  if(function() {
    var or__3824__auto____4978 = coll == null;
    if(or__3824__auto____4978) {
      return or__3824__auto____4978
    }else {
      var G__4979__4980 = coll;
      if(G__4979__4980 != null) {
        if(function() {
          var or__3824__auto____4981 = G__4979__4980.cljs$lang$protocol_mask$partition0$ & 64;
          if(or__3824__auto____4981) {
            return or__3824__auto____4981
          }else {
            return G__4979__4980.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          if(!G__4979__4980.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__4979__4980)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__4979__4980)
      }
    }
  }()) {
    return new cljs.core.Cons(null, x, coll, null)
  }else {
    return new cljs.core.Cons(null, x, cljs.core.seq.call(null, coll), null)
  }
};
cljs.core.list_QMARK_ = function list_QMARK_(x) {
  var G__4982__4983 = x;
  if(G__4982__4983 != null) {
    if(function() {
      var or__3824__auto____4984 = G__4982__4983.cljs$lang$protocol_mask$partition0$ & 16777216;
      if(or__3824__auto____4984) {
        return or__3824__auto____4984
      }else {
        return G__4982__4983.cljs$core$IList$
      }
    }()) {
      return true
    }else {
      if(!G__4982__4983.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IList, G__4982__4983)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IList, G__4982__4983)
  }
};
cljs.core.IReduce["string"] = true;
cljs.core._reduce["string"] = function() {
  var G__4985 = null;
  var G__4985__2 = function(string, f) {
    return cljs.core.ci_reduce.call(null, string, f)
  };
  var G__4985__3 = function(string, f, start) {
    return cljs.core.ci_reduce.call(null, string, f, start)
  };
  G__4985 = function(string, f, start) {
    switch(arguments.length) {
      case 2:
        return G__4985__2.call(this, string, f);
      case 3:
        return G__4985__3.call(this, string, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__4985
}();
cljs.core.ILookup["string"] = true;
cljs.core._lookup["string"] = function() {
  var G__4986 = null;
  var G__4986__2 = function(string, k) {
    return cljs.core._nth.call(null, string, k)
  };
  var G__4986__3 = function(string, k, not_found) {
    return cljs.core._nth.call(null, string, k, not_found)
  };
  G__4986 = function(string, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__4986__2.call(this, string, k);
      case 3:
        return G__4986__3.call(this, string, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__4986
}();
cljs.core.IIndexed["string"] = true;
cljs.core._nth["string"] = function() {
  var G__4987 = null;
  var G__4987__2 = function(string, n) {
    if(n < cljs.core._count.call(null, string)) {
      return string.charAt(n)
    }else {
      return null
    }
  };
  var G__4987__3 = function(string, n, not_found) {
    if(n < cljs.core._count.call(null, string)) {
      return string.charAt(n)
    }else {
      return not_found
    }
  };
  G__4987 = function(string, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__4987__2.call(this, string, n);
      case 3:
        return G__4987__3.call(this, string, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__4987
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
  return goog.string.hashCode.call(null, o)
};
String.prototype.cljs$core$IFn$ = true;
String.prototype.call = function() {
  var G__4996 = null;
  var G__4996__2 = function(tsym4990, coll) {
    var tsym4990__4992 = this;
    var this$__4993 = tsym4990__4992;
    return cljs.core.get.call(null, coll, this$__4993.toString())
  };
  var G__4996__3 = function(tsym4991, coll, not_found) {
    var tsym4991__4994 = this;
    var this$__4995 = tsym4991__4994;
    return cljs.core.get.call(null, coll, this$__4995.toString(), not_found)
  };
  G__4996 = function(tsym4991, coll, not_found) {
    switch(arguments.length) {
      case 2:
        return G__4996__2.call(this, tsym4991, coll);
      case 3:
        return G__4996__3.call(this, tsym4991, coll, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__4996
}();
String.prototype.apply = function(tsym4988, args4989) {
  return tsym4988.call.apply(tsym4988, [tsym4988].concat(cljs.core.aclone.call(null, args4989)))
};
String["prototype"]["apply"] = function(s, args) {
  if(cljs.core.count.call(null, args) < 2) {
    return cljs.core.get.call(null, args[0], s)
  }else {
    return cljs.core.get.call(null, args[0], s, args[1])
  }
};
cljs.core.lazy_seq_value = function lazy_seq_value(lazy_seq) {
  var x__4997 = lazy_seq.x;
  if(cljs.core.truth_(lazy_seq.realized)) {
    return x__4997
  }else {
    lazy_seq.x = x__4997.call(null);
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
  this.cljs$lang$protocol_mask$partition0$ = 15925324
};
cljs.core.LazySeq.cljs$lang$type = true;
cljs.core.LazySeq.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.LazySeq")
};
cljs.core.LazySeq.prototype.cljs$core$IHash$ = true;
cljs.core.LazySeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__4998 = this;
  var h__364__auto____4999 = this__4998.__hash;
  if(h__364__auto____4999 != null) {
    return h__364__auto____4999
  }else {
    var h__364__auto____5000 = cljs.core.hash_coll.call(null, coll);
    this__4998.__hash = h__364__auto____5000;
    return h__364__auto____5000
  }
};
cljs.core.LazySeq.prototype.cljs$core$ISequential$ = true;
cljs.core.LazySeq.prototype.cljs$core$ICollection$ = true;
cljs.core.LazySeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__5001 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.LazySeq.prototype.toString = function() {
  var this__5002 = this;
  var this$__5003 = this;
  return cljs.core.pr_str.call(null, this$__5003)
};
cljs.core.LazySeq.prototype.cljs$core$ISeqable$ = true;
cljs.core.LazySeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__5004 = this;
  return cljs.core.seq.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$ISeq$ = true;
cljs.core.LazySeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__5005 = this;
  return cljs.core.first.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__5006 = this;
  return cljs.core.rest.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$IEquiv$ = true;
cljs.core.LazySeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__5007 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.LazySeq.prototype.cljs$core$IWithMeta$ = true;
cljs.core.LazySeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__5008 = this;
  return new cljs.core.LazySeq(meta, this__5008.realized, this__5008.x, this__5008.__hash)
};
cljs.core.LazySeq.prototype.cljs$core$IMeta$ = true;
cljs.core.LazySeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__5009 = this;
  return this__5009.meta
};
cljs.core.LazySeq.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.LazySeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__5010 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__5010.meta)
};
cljs.core.LazySeq;
cljs.core.to_array = function to_array(s) {
  var ary__5011 = [];
  var s__5012 = s;
  while(true) {
    if(cljs.core.truth_(cljs.core.seq.call(null, s__5012))) {
      ary__5011.push(cljs.core.first.call(null, s__5012));
      var G__5013 = cljs.core.next.call(null, s__5012);
      s__5012 = G__5013;
      continue
    }else {
      return ary__5011
    }
    break
  }
};
cljs.core.to_array_2d = function to_array_2d(coll) {
  var ret__5014 = cljs.core.make_array.call(null, cljs.core.count.call(null, coll));
  var i__5015 = 0;
  var xs__5016 = cljs.core.seq.call(null, coll);
  while(true) {
    if(cljs.core.truth_(xs__5016)) {
      ret__5014[i__5015] = cljs.core.to_array.call(null, cljs.core.first.call(null, xs__5016));
      var G__5017 = i__5015 + 1;
      var G__5018 = cljs.core.next.call(null, xs__5016);
      i__5015 = G__5017;
      xs__5016 = G__5018;
      continue
    }else {
    }
    break
  }
  return ret__5014
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
    var a__5019 = cljs.core.make_array.call(null, size);
    if(cljs.core.seq_QMARK_.call(null, init_val_or_seq)) {
      var s__5020 = cljs.core.seq.call(null, init_val_or_seq);
      var i__5021 = 0;
      var s__5022 = s__5020;
      while(true) {
        if(cljs.core.truth_(function() {
          var and__3822__auto____5023 = s__5022;
          if(cljs.core.truth_(and__3822__auto____5023)) {
            return i__5021 < size
          }else {
            return and__3822__auto____5023
          }
        }())) {
          a__5019[i__5021] = cljs.core.first.call(null, s__5022);
          var G__5026 = i__5021 + 1;
          var G__5027 = cljs.core.next.call(null, s__5022);
          i__5021 = G__5026;
          s__5022 = G__5027;
          continue
        }else {
          return a__5019
        }
        break
      }
    }else {
      var n__685__auto____5024 = size;
      var i__5025 = 0;
      while(true) {
        if(i__5025 < n__685__auto____5024) {
          a__5019[i__5025] = init_val_or_seq;
          var G__5028 = i__5025 + 1;
          i__5025 = G__5028;
          continue
        }else {
        }
        break
      }
      return a__5019
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
    var a__5029 = cljs.core.make_array.call(null, size);
    if(cljs.core.seq_QMARK_.call(null, init_val_or_seq)) {
      var s__5030 = cljs.core.seq.call(null, init_val_or_seq);
      var i__5031 = 0;
      var s__5032 = s__5030;
      while(true) {
        if(cljs.core.truth_(function() {
          var and__3822__auto____5033 = s__5032;
          if(cljs.core.truth_(and__3822__auto____5033)) {
            return i__5031 < size
          }else {
            return and__3822__auto____5033
          }
        }())) {
          a__5029[i__5031] = cljs.core.first.call(null, s__5032);
          var G__5036 = i__5031 + 1;
          var G__5037 = cljs.core.next.call(null, s__5032);
          i__5031 = G__5036;
          s__5032 = G__5037;
          continue
        }else {
          return a__5029
        }
        break
      }
    }else {
      var n__685__auto____5034 = size;
      var i__5035 = 0;
      while(true) {
        if(i__5035 < n__685__auto____5034) {
          a__5029[i__5035] = init_val_or_seq;
          var G__5038 = i__5035 + 1;
          i__5035 = G__5038;
          continue
        }else {
        }
        break
      }
      return a__5029
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
    var a__5039 = cljs.core.make_array.call(null, size);
    if(cljs.core.seq_QMARK_.call(null, init_val_or_seq)) {
      var s__5040 = cljs.core.seq.call(null, init_val_or_seq);
      var i__5041 = 0;
      var s__5042 = s__5040;
      while(true) {
        if(cljs.core.truth_(function() {
          var and__3822__auto____5043 = s__5042;
          if(cljs.core.truth_(and__3822__auto____5043)) {
            return i__5041 < size
          }else {
            return and__3822__auto____5043
          }
        }())) {
          a__5039[i__5041] = cljs.core.first.call(null, s__5042);
          var G__5046 = i__5041 + 1;
          var G__5047 = cljs.core.next.call(null, s__5042);
          i__5041 = G__5046;
          s__5042 = G__5047;
          continue
        }else {
          return a__5039
        }
        break
      }
    }else {
      var n__685__auto____5044 = size;
      var i__5045 = 0;
      while(true) {
        if(i__5045 < n__685__auto____5044) {
          a__5039[i__5045] = init_val_or_seq;
          var G__5048 = i__5045 + 1;
          i__5045 = G__5048;
          continue
        }else {
        }
        break
      }
      return a__5039
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
    var s__5049 = s;
    var i__5050 = n;
    var sum__5051 = 0;
    while(true) {
      if(cljs.core.truth_(function() {
        var and__3822__auto____5052 = i__5050 > 0;
        if(and__3822__auto____5052) {
          return cljs.core.seq.call(null, s__5049)
        }else {
          return and__3822__auto____5052
        }
      }())) {
        var G__5053 = cljs.core.next.call(null, s__5049);
        var G__5054 = i__5050 - 1;
        var G__5055 = sum__5051 + 1;
        s__5049 = G__5053;
        i__5050 = G__5054;
        sum__5051 = G__5055;
        continue
      }else {
        return sum__5051
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
    })
  };
  var concat__1 = function(x) {
    return new cljs.core.LazySeq(null, false, function() {
      return x
    })
  };
  var concat__2 = function(x, y) {
    return new cljs.core.LazySeq(null, false, function() {
      var s__5056 = cljs.core.seq.call(null, x);
      if(cljs.core.truth_(s__5056)) {
        return cljs.core.cons.call(null, cljs.core.first.call(null, s__5056), concat.call(null, cljs.core.rest.call(null, s__5056), y))
      }else {
        return y
      }
    })
  };
  var concat__3 = function() {
    var G__5059__delegate = function(x, y, zs) {
      var cat__5058 = function cat(xys, zs) {
        return new cljs.core.LazySeq(null, false, function() {
          var xys__5057 = cljs.core.seq.call(null, xys);
          if(cljs.core.truth_(xys__5057)) {
            return cljs.core.cons.call(null, cljs.core.first.call(null, xys__5057), cat.call(null, cljs.core.rest.call(null, xys__5057), zs))
          }else {
            if(cljs.core.truth_(zs)) {
              return cat.call(null, cljs.core.first.call(null, zs), cljs.core.next.call(null, zs))
            }else {
              return null
            }
          }
        })
      };
      return cat__5058.call(null, concat.call(null, x, y), zs)
    };
    var G__5059 = function(x, y, var_args) {
      var zs = null;
      if(goog.isDef(var_args)) {
        zs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__5059__delegate.call(this, x, y, zs)
    };
    G__5059.cljs$lang$maxFixedArity = 2;
    G__5059.cljs$lang$applyTo = function(arglist__5060) {
      var x = cljs.core.first(arglist__5060);
      var y = cljs.core.first(cljs.core.next(arglist__5060));
      var zs = cljs.core.rest(cljs.core.next(arglist__5060));
      return G__5059__delegate(x, y, zs)
    };
    G__5059.cljs$lang$arity$variadic = G__5059__delegate;
    return G__5059
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
    var G__5061__delegate = function(a, b, c, d, more) {
      return cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, cljs.core.cons.call(null, d, cljs.core.spread.call(null, more)))))
    };
    var G__5061 = function(a, b, c, d, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__5061__delegate.call(this, a, b, c, d, more)
    };
    G__5061.cljs$lang$maxFixedArity = 4;
    G__5061.cljs$lang$applyTo = function(arglist__5062) {
      var a = cljs.core.first(arglist__5062);
      var b = cljs.core.first(cljs.core.next(arglist__5062));
      var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__5062)));
      var d = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__5062))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__5062))));
      return G__5061__delegate(a, b, c, d, more)
    };
    G__5061.cljs$lang$arity$variadic = G__5061__delegate;
    return G__5061
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
void 0;
cljs.core.apply_to = function apply_to(f, argc, args) {
  var args__5063 = cljs.core.seq.call(null, args);
  if(argc === 0) {
    return f.call(null)
  }else {
    var a__5064 = cljs.core._first.call(null, args__5063);
    var args__5065 = cljs.core._rest.call(null, args__5063);
    if(argc === 1) {
      if(f.cljs$lang$arity$1) {
        return f.cljs$lang$arity$1(a__5064)
      }else {
        return f.call(null, a__5064)
      }
    }else {
      var b__5066 = cljs.core._first.call(null, args__5065);
      var args__5067 = cljs.core._rest.call(null, args__5065);
      if(argc === 2) {
        if(f.cljs$lang$arity$2) {
          return f.cljs$lang$arity$2(a__5064, b__5066)
        }else {
          return f.call(null, a__5064, b__5066)
        }
      }else {
        var c__5068 = cljs.core._first.call(null, args__5067);
        var args__5069 = cljs.core._rest.call(null, args__5067);
        if(argc === 3) {
          if(f.cljs$lang$arity$3) {
            return f.cljs$lang$arity$3(a__5064, b__5066, c__5068)
          }else {
            return f.call(null, a__5064, b__5066, c__5068)
          }
        }else {
          var d__5070 = cljs.core._first.call(null, args__5069);
          var args__5071 = cljs.core._rest.call(null, args__5069);
          if(argc === 4) {
            if(f.cljs$lang$arity$4) {
              return f.cljs$lang$arity$4(a__5064, b__5066, c__5068, d__5070)
            }else {
              return f.call(null, a__5064, b__5066, c__5068, d__5070)
            }
          }else {
            var e__5072 = cljs.core._first.call(null, args__5071);
            var args__5073 = cljs.core._rest.call(null, args__5071);
            if(argc === 5) {
              if(f.cljs$lang$arity$5) {
                return f.cljs$lang$arity$5(a__5064, b__5066, c__5068, d__5070, e__5072)
              }else {
                return f.call(null, a__5064, b__5066, c__5068, d__5070, e__5072)
              }
            }else {
              var f__5074 = cljs.core._first.call(null, args__5073);
              var args__5075 = cljs.core._rest.call(null, args__5073);
              if(argc === 6) {
                if(f__5074.cljs$lang$arity$6) {
                  return f__5074.cljs$lang$arity$6(a__5064, b__5066, c__5068, d__5070, e__5072, f__5074)
                }else {
                  return f__5074.call(null, a__5064, b__5066, c__5068, d__5070, e__5072, f__5074)
                }
              }else {
                var g__5076 = cljs.core._first.call(null, args__5075);
                var args__5077 = cljs.core._rest.call(null, args__5075);
                if(argc === 7) {
                  if(f__5074.cljs$lang$arity$7) {
                    return f__5074.cljs$lang$arity$7(a__5064, b__5066, c__5068, d__5070, e__5072, f__5074, g__5076)
                  }else {
                    return f__5074.call(null, a__5064, b__5066, c__5068, d__5070, e__5072, f__5074, g__5076)
                  }
                }else {
                  var h__5078 = cljs.core._first.call(null, args__5077);
                  var args__5079 = cljs.core._rest.call(null, args__5077);
                  if(argc === 8) {
                    if(f__5074.cljs$lang$arity$8) {
                      return f__5074.cljs$lang$arity$8(a__5064, b__5066, c__5068, d__5070, e__5072, f__5074, g__5076, h__5078)
                    }else {
                      return f__5074.call(null, a__5064, b__5066, c__5068, d__5070, e__5072, f__5074, g__5076, h__5078)
                    }
                  }else {
                    var i__5080 = cljs.core._first.call(null, args__5079);
                    var args__5081 = cljs.core._rest.call(null, args__5079);
                    if(argc === 9) {
                      if(f__5074.cljs$lang$arity$9) {
                        return f__5074.cljs$lang$arity$9(a__5064, b__5066, c__5068, d__5070, e__5072, f__5074, g__5076, h__5078, i__5080)
                      }else {
                        return f__5074.call(null, a__5064, b__5066, c__5068, d__5070, e__5072, f__5074, g__5076, h__5078, i__5080)
                      }
                    }else {
                      var j__5082 = cljs.core._first.call(null, args__5081);
                      var args__5083 = cljs.core._rest.call(null, args__5081);
                      if(argc === 10) {
                        if(f__5074.cljs$lang$arity$10) {
                          return f__5074.cljs$lang$arity$10(a__5064, b__5066, c__5068, d__5070, e__5072, f__5074, g__5076, h__5078, i__5080, j__5082)
                        }else {
                          return f__5074.call(null, a__5064, b__5066, c__5068, d__5070, e__5072, f__5074, g__5076, h__5078, i__5080, j__5082)
                        }
                      }else {
                        var k__5084 = cljs.core._first.call(null, args__5083);
                        var args__5085 = cljs.core._rest.call(null, args__5083);
                        if(argc === 11) {
                          if(f__5074.cljs$lang$arity$11) {
                            return f__5074.cljs$lang$arity$11(a__5064, b__5066, c__5068, d__5070, e__5072, f__5074, g__5076, h__5078, i__5080, j__5082, k__5084)
                          }else {
                            return f__5074.call(null, a__5064, b__5066, c__5068, d__5070, e__5072, f__5074, g__5076, h__5078, i__5080, j__5082, k__5084)
                          }
                        }else {
                          var l__5086 = cljs.core._first.call(null, args__5085);
                          var args__5087 = cljs.core._rest.call(null, args__5085);
                          if(argc === 12) {
                            if(f__5074.cljs$lang$arity$12) {
                              return f__5074.cljs$lang$arity$12(a__5064, b__5066, c__5068, d__5070, e__5072, f__5074, g__5076, h__5078, i__5080, j__5082, k__5084, l__5086)
                            }else {
                              return f__5074.call(null, a__5064, b__5066, c__5068, d__5070, e__5072, f__5074, g__5076, h__5078, i__5080, j__5082, k__5084, l__5086)
                            }
                          }else {
                            var m__5088 = cljs.core._first.call(null, args__5087);
                            var args__5089 = cljs.core._rest.call(null, args__5087);
                            if(argc === 13) {
                              if(f__5074.cljs$lang$arity$13) {
                                return f__5074.cljs$lang$arity$13(a__5064, b__5066, c__5068, d__5070, e__5072, f__5074, g__5076, h__5078, i__5080, j__5082, k__5084, l__5086, m__5088)
                              }else {
                                return f__5074.call(null, a__5064, b__5066, c__5068, d__5070, e__5072, f__5074, g__5076, h__5078, i__5080, j__5082, k__5084, l__5086, m__5088)
                              }
                            }else {
                              var n__5090 = cljs.core._first.call(null, args__5089);
                              var args__5091 = cljs.core._rest.call(null, args__5089);
                              if(argc === 14) {
                                if(f__5074.cljs$lang$arity$14) {
                                  return f__5074.cljs$lang$arity$14(a__5064, b__5066, c__5068, d__5070, e__5072, f__5074, g__5076, h__5078, i__5080, j__5082, k__5084, l__5086, m__5088, n__5090)
                                }else {
                                  return f__5074.call(null, a__5064, b__5066, c__5068, d__5070, e__5072, f__5074, g__5076, h__5078, i__5080, j__5082, k__5084, l__5086, m__5088, n__5090)
                                }
                              }else {
                                var o__5092 = cljs.core._first.call(null, args__5091);
                                var args__5093 = cljs.core._rest.call(null, args__5091);
                                if(argc === 15) {
                                  if(f__5074.cljs$lang$arity$15) {
                                    return f__5074.cljs$lang$arity$15(a__5064, b__5066, c__5068, d__5070, e__5072, f__5074, g__5076, h__5078, i__5080, j__5082, k__5084, l__5086, m__5088, n__5090, o__5092)
                                  }else {
                                    return f__5074.call(null, a__5064, b__5066, c__5068, d__5070, e__5072, f__5074, g__5076, h__5078, i__5080, j__5082, k__5084, l__5086, m__5088, n__5090, o__5092)
                                  }
                                }else {
                                  var p__5094 = cljs.core._first.call(null, args__5093);
                                  var args__5095 = cljs.core._rest.call(null, args__5093);
                                  if(argc === 16) {
                                    if(f__5074.cljs$lang$arity$16) {
                                      return f__5074.cljs$lang$arity$16(a__5064, b__5066, c__5068, d__5070, e__5072, f__5074, g__5076, h__5078, i__5080, j__5082, k__5084, l__5086, m__5088, n__5090, o__5092, p__5094)
                                    }else {
                                      return f__5074.call(null, a__5064, b__5066, c__5068, d__5070, e__5072, f__5074, g__5076, h__5078, i__5080, j__5082, k__5084, l__5086, m__5088, n__5090, o__5092, p__5094)
                                    }
                                  }else {
                                    var q__5096 = cljs.core._first.call(null, args__5095);
                                    var args__5097 = cljs.core._rest.call(null, args__5095);
                                    if(argc === 17) {
                                      if(f__5074.cljs$lang$arity$17) {
                                        return f__5074.cljs$lang$arity$17(a__5064, b__5066, c__5068, d__5070, e__5072, f__5074, g__5076, h__5078, i__5080, j__5082, k__5084, l__5086, m__5088, n__5090, o__5092, p__5094, q__5096)
                                      }else {
                                        return f__5074.call(null, a__5064, b__5066, c__5068, d__5070, e__5072, f__5074, g__5076, h__5078, i__5080, j__5082, k__5084, l__5086, m__5088, n__5090, o__5092, p__5094, q__5096)
                                      }
                                    }else {
                                      var r__5098 = cljs.core._first.call(null, args__5097);
                                      var args__5099 = cljs.core._rest.call(null, args__5097);
                                      if(argc === 18) {
                                        if(f__5074.cljs$lang$arity$18) {
                                          return f__5074.cljs$lang$arity$18(a__5064, b__5066, c__5068, d__5070, e__5072, f__5074, g__5076, h__5078, i__5080, j__5082, k__5084, l__5086, m__5088, n__5090, o__5092, p__5094, q__5096, r__5098)
                                        }else {
                                          return f__5074.call(null, a__5064, b__5066, c__5068, d__5070, e__5072, f__5074, g__5076, h__5078, i__5080, j__5082, k__5084, l__5086, m__5088, n__5090, o__5092, p__5094, q__5096, r__5098)
                                        }
                                      }else {
                                        var s__5100 = cljs.core._first.call(null, args__5099);
                                        var args__5101 = cljs.core._rest.call(null, args__5099);
                                        if(argc === 19) {
                                          if(f__5074.cljs$lang$arity$19) {
                                            return f__5074.cljs$lang$arity$19(a__5064, b__5066, c__5068, d__5070, e__5072, f__5074, g__5076, h__5078, i__5080, j__5082, k__5084, l__5086, m__5088, n__5090, o__5092, p__5094, q__5096, r__5098, s__5100)
                                          }else {
                                            return f__5074.call(null, a__5064, b__5066, c__5068, d__5070, e__5072, f__5074, g__5076, h__5078, i__5080, j__5082, k__5084, l__5086, m__5088, n__5090, o__5092, p__5094, q__5096, r__5098, s__5100)
                                          }
                                        }else {
                                          var t__5102 = cljs.core._first.call(null, args__5101);
                                          var args__5103 = cljs.core._rest.call(null, args__5101);
                                          if(argc === 20) {
                                            if(f__5074.cljs$lang$arity$20) {
                                              return f__5074.cljs$lang$arity$20(a__5064, b__5066, c__5068, d__5070, e__5072, f__5074, g__5076, h__5078, i__5080, j__5082, k__5084, l__5086, m__5088, n__5090, o__5092, p__5094, q__5096, r__5098, s__5100, t__5102)
                                            }else {
                                              return f__5074.call(null, a__5064, b__5066, c__5068, d__5070, e__5072, f__5074, g__5076, h__5078, i__5080, j__5082, k__5084, l__5086, m__5088, n__5090, o__5092, p__5094, q__5096, r__5098, s__5100, t__5102)
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
void 0;
cljs.core.apply = function() {
  var apply = null;
  var apply__2 = function(f, args) {
    var fixed_arity__5104 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__5105 = cljs.core.bounded_count.call(null, args, fixed_arity__5104 + 1);
      if(bc__5105 <= fixed_arity__5104) {
        return cljs.core.apply_to.call(null, f, bc__5105, args)
      }else {
        return f.cljs$lang$applyTo(args)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, args))
    }
  };
  var apply__3 = function(f, x, args) {
    var arglist__5106 = cljs.core.list_STAR_.call(null, x, args);
    var fixed_arity__5107 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__5108 = cljs.core.bounded_count.call(null, arglist__5106, fixed_arity__5107 + 1);
      if(bc__5108 <= fixed_arity__5107) {
        return cljs.core.apply_to.call(null, f, bc__5108, arglist__5106)
      }else {
        return f.cljs$lang$applyTo(arglist__5106)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__5106))
    }
  };
  var apply__4 = function(f, x, y, args) {
    var arglist__5109 = cljs.core.list_STAR_.call(null, x, y, args);
    var fixed_arity__5110 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__5111 = cljs.core.bounded_count.call(null, arglist__5109, fixed_arity__5110 + 1);
      if(bc__5111 <= fixed_arity__5110) {
        return cljs.core.apply_to.call(null, f, bc__5111, arglist__5109)
      }else {
        return f.cljs$lang$applyTo(arglist__5109)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__5109))
    }
  };
  var apply__5 = function(f, x, y, z, args) {
    var arglist__5112 = cljs.core.list_STAR_.call(null, x, y, z, args);
    var fixed_arity__5113 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__5114 = cljs.core.bounded_count.call(null, arglist__5112, fixed_arity__5113 + 1);
      if(bc__5114 <= fixed_arity__5113) {
        return cljs.core.apply_to.call(null, f, bc__5114, arglist__5112)
      }else {
        return f.cljs$lang$applyTo(arglist__5112)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__5112))
    }
  };
  var apply__6 = function() {
    var G__5118__delegate = function(f, a, b, c, d, args) {
      var arglist__5115 = cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, cljs.core.cons.call(null, d, cljs.core.spread.call(null, args)))));
      var fixed_arity__5116 = f.cljs$lang$maxFixedArity;
      if(cljs.core.truth_(f.cljs$lang$applyTo)) {
        var bc__5117 = cljs.core.bounded_count.call(null, arglist__5115, fixed_arity__5116 + 1);
        if(bc__5117 <= fixed_arity__5116) {
          return cljs.core.apply_to.call(null, f, bc__5117, arglist__5115)
        }else {
          return f.cljs$lang$applyTo(arglist__5115)
        }
      }else {
        return f.apply(f, cljs.core.to_array.call(null, arglist__5115))
      }
    };
    var G__5118 = function(f, a, b, c, d, var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 5), 0)
      }
      return G__5118__delegate.call(this, f, a, b, c, d, args)
    };
    G__5118.cljs$lang$maxFixedArity = 5;
    G__5118.cljs$lang$applyTo = function(arglist__5119) {
      var f = cljs.core.first(arglist__5119);
      var a = cljs.core.first(cljs.core.next(arglist__5119));
      var b = cljs.core.first(cljs.core.next(cljs.core.next(arglist__5119)));
      var c = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__5119))));
      var d = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__5119)))));
      var args = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__5119)))));
      return G__5118__delegate(f, a, b, c, d, args)
    };
    G__5118.cljs$lang$arity$variadic = G__5118__delegate;
    return G__5118
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
  vary_meta.cljs$lang$applyTo = function(arglist__5120) {
    var obj = cljs.core.first(arglist__5120);
    var f = cljs.core.first(cljs.core.next(arglist__5120));
    var args = cljs.core.rest(cljs.core.next(arglist__5120));
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
    return cljs.core.not.call(null, cljs.core._EQ_.call(null, x, y))
  };
  var not_EQ___3 = function() {
    var G__5121__delegate = function(x, y, more) {
      return cljs.core.not.call(null, cljs.core.apply.call(null, cljs.core._EQ_, x, y, more))
    };
    var G__5121 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__5121__delegate.call(this, x, y, more)
    };
    G__5121.cljs$lang$maxFixedArity = 2;
    G__5121.cljs$lang$applyTo = function(arglist__5122) {
      var x = cljs.core.first(arglist__5122);
      var y = cljs.core.first(cljs.core.next(arglist__5122));
      var more = cljs.core.rest(cljs.core.next(arglist__5122));
      return G__5121__delegate(x, y, more)
    };
    G__5121.cljs$lang$arity$variadic = G__5121__delegate;
    return G__5121
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
  if(cljs.core.truth_(cljs.core.seq.call(null, coll))) {
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
        var G__5123 = pred;
        var G__5124 = cljs.core.next.call(null, coll);
        pred = G__5123;
        coll = G__5124;
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
  return cljs.core.not.call(null, cljs.core.every_QMARK_.call(null, pred, coll))
};
cljs.core.some = function some(pred, coll) {
  while(true) {
    if(cljs.core.truth_(cljs.core.seq.call(null, coll))) {
      var or__3824__auto____5125 = pred.call(null, cljs.core.first.call(null, coll));
      if(cljs.core.truth_(or__3824__auto____5125)) {
        return or__3824__auto____5125
      }else {
        var G__5126 = pred;
        var G__5127 = cljs.core.next.call(null, coll);
        pred = G__5126;
        coll = G__5127;
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
  return cljs.core.not.call(null, cljs.core.even_QMARK_.call(null, n))
};
cljs.core.identity = function identity(x) {
  return x
};
cljs.core.complement = function complement(f) {
  return function() {
    var G__5128 = null;
    var G__5128__0 = function() {
      return cljs.core.not.call(null, f.call(null))
    };
    var G__5128__1 = function(x) {
      return cljs.core.not.call(null, f.call(null, x))
    };
    var G__5128__2 = function(x, y) {
      return cljs.core.not.call(null, f.call(null, x, y))
    };
    var G__5128__3 = function() {
      var G__5129__delegate = function(x, y, zs) {
        return cljs.core.not.call(null, cljs.core.apply.call(null, f, x, y, zs))
      };
      var G__5129 = function(x, y, var_args) {
        var zs = null;
        if(goog.isDef(var_args)) {
          zs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
        }
        return G__5129__delegate.call(this, x, y, zs)
      };
      G__5129.cljs$lang$maxFixedArity = 2;
      G__5129.cljs$lang$applyTo = function(arglist__5130) {
        var x = cljs.core.first(arglist__5130);
        var y = cljs.core.first(cljs.core.next(arglist__5130));
        var zs = cljs.core.rest(cljs.core.next(arglist__5130));
        return G__5129__delegate(x, y, zs)
      };
      G__5129.cljs$lang$arity$variadic = G__5129__delegate;
      return G__5129
    }();
    G__5128 = function(x, y, var_args) {
      var zs = var_args;
      switch(arguments.length) {
        case 0:
          return G__5128__0.call(this);
        case 1:
          return G__5128__1.call(this, x);
        case 2:
          return G__5128__2.call(this, x, y);
        default:
          return G__5128__3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
      }
      throw"Invalid arity: " + arguments.length;
    };
    G__5128.cljs$lang$maxFixedArity = 2;
    G__5128.cljs$lang$applyTo = G__5128__3.cljs$lang$applyTo;
    return G__5128
  }()
};
cljs.core.constantly = function constantly(x) {
  return function() {
    var G__5131__delegate = function(args) {
      return x
    };
    var G__5131 = function(var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__5131__delegate.call(this, args)
    };
    G__5131.cljs$lang$maxFixedArity = 0;
    G__5131.cljs$lang$applyTo = function(arglist__5132) {
      var args = cljs.core.seq(arglist__5132);
      return G__5131__delegate(args)
    };
    G__5131.cljs$lang$arity$variadic = G__5131__delegate;
    return G__5131
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
      var G__5136 = null;
      var G__5136__0 = function() {
        return f.call(null, g.call(null))
      };
      var G__5136__1 = function(x) {
        return f.call(null, g.call(null, x))
      };
      var G__5136__2 = function(x, y) {
        return f.call(null, g.call(null, x, y))
      };
      var G__5136__3 = function(x, y, z) {
        return f.call(null, g.call(null, x, y, z))
      };
      var G__5136__4 = function() {
        var G__5137__delegate = function(x, y, z, args) {
          return f.call(null, cljs.core.apply.call(null, g, x, y, z, args))
        };
        var G__5137 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__5137__delegate.call(this, x, y, z, args)
        };
        G__5137.cljs$lang$maxFixedArity = 3;
        G__5137.cljs$lang$applyTo = function(arglist__5138) {
          var x = cljs.core.first(arglist__5138);
          var y = cljs.core.first(cljs.core.next(arglist__5138));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__5138)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__5138)));
          return G__5137__delegate(x, y, z, args)
        };
        G__5137.cljs$lang$arity$variadic = G__5137__delegate;
        return G__5137
      }();
      G__5136 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__5136__0.call(this);
          case 1:
            return G__5136__1.call(this, x);
          case 2:
            return G__5136__2.call(this, x, y);
          case 3:
            return G__5136__3.call(this, x, y, z);
          default:
            return G__5136__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__5136.cljs$lang$maxFixedArity = 3;
      G__5136.cljs$lang$applyTo = G__5136__4.cljs$lang$applyTo;
      return G__5136
    }()
  };
  var comp__3 = function(f, g, h) {
    return function() {
      var G__5139 = null;
      var G__5139__0 = function() {
        return f.call(null, g.call(null, h.call(null)))
      };
      var G__5139__1 = function(x) {
        return f.call(null, g.call(null, h.call(null, x)))
      };
      var G__5139__2 = function(x, y) {
        return f.call(null, g.call(null, h.call(null, x, y)))
      };
      var G__5139__3 = function(x, y, z) {
        return f.call(null, g.call(null, h.call(null, x, y, z)))
      };
      var G__5139__4 = function() {
        var G__5140__delegate = function(x, y, z, args) {
          return f.call(null, g.call(null, cljs.core.apply.call(null, h, x, y, z, args)))
        };
        var G__5140 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__5140__delegate.call(this, x, y, z, args)
        };
        G__5140.cljs$lang$maxFixedArity = 3;
        G__5140.cljs$lang$applyTo = function(arglist__5141) {
          var x = cljs.core.first(arglist__5141);
          var y = cljs.core.first(cljs.core.next(arglist__5141));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__5141)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__5141)));
          return G__5140__delegate(x, y, z, args)
        };
        G__5140.cljs$lang$arity$variadic = G__5140__delegate;
        return G__5140
      }();
      G__5139 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__5139__0.call(this);
          case 1:
            return G__5139__1.call(this, x);
          case 2:
            return G__5139__2.call(this, x, y);
          case 3:
            return G__5139__3.call(this, x, y, z);
          default:
            return G__5139__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__5139.cljs$lang$maxFixedArity = 3;
      G__5139.cljs$lang$applyTo = G__5139__4.cljs$lang$applyTo;
      return G__5139
    }()
  };
  var comp__4 = function() {
    var G__5142__delegate = function(f1, f2, f3, fs) {
      var fs__5133 = cljs.core.reverse.call(null, cljs.core.list_STAR_.call(null, f1, f2, f3, fs));
      return function() {
        var G__5143__delegate = function(args) {
          var ret__5134 = cljs.core.apply.call(null, cljs.core.first.call(null, fs__5133), args);
          var fs__5135 = cljs.core.next.call(null, fs__5133);
          while(true) {
            if(cljs.core.truth_(fs__5135)) {
              var G__5144 = cljs.core.first.call(null, fs__5135).call(null, ret__5134);
              var G__5145 = cljs.core.next.call(null, fs__5135);
              ret__5134 = G__5144;
              fs__5135 = G__5145;
              continue
            }else {
              return ret__5134
            }
            break
          }
        };
        var G__5143 = function(var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
          }
          return G__5143__delegate.call(this, args)
        };
        G__5143.cljs$lang$maxFixedArity = 0;
        G__5143.cljs$lang$applyTo = function(arglist__5146) {
          var args = cljs.core.seq(arglist__5146);
          return G__5143__delegate(args)
        };
        G__5143.cljs$lang$arity$variadic = G__5143__delegate;
        return G__5143
      }()
    };
    var G__5142 = function(f1, f2, f3, var_args) {
      var fs = null;
      if(goog.isDef(var_args)) {
        fs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__5142__delegate.call(this, f1, f2, f3, fs)
    };
    G__5142.cljs$lang$maxFixedArity = 3;
    G__5142.cljs$lang$applyTo = function(arglist__5147) {
      var f1 = cljs.core.first(arglist__5147);
      var f2 = cljs.core.first(cljs.core.next(arglist__5147));
      var f3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__5147)));
      var fs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__5147)));
      return G__5142__delegate(f1, f2, f3, fs)
    };
    G__5142.cljs$lang$arity$variadic = G__5142__delegate;
    return G__5142
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
      var G__5148__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, args)
      };
      var G__5148 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__5148__delegate.call(this, args)
      };
      G__5148.cljs$lang$maxFixedArity = 0;
      G__5148.cljs$lang$applyTo = function(arglist__5149) {
        var args = cljs.core.seq(arglist__5149);
        return G__5148__delegate(args)
      };
      G__5148.cljs$lang$arity$variadic = G__5148__delegate;
      return G__5148
    }()
  };
  var partial__3 = function(f, arg1, arg2) {
    return function() {
      var G__5150__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, arg2, args)
      };
      var G__5150 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__5150__delegate.call(this, args)
      };
      G__5150.cljs$lang$maxFixedArity = 0;
      G__5150.cljs$lang$applyTo = function(arglist__5151) {
        var args = cljs.core.seq(arglist__5151);
        return G__5150__delegate(args)
      };
      G__5150.cljs$lang$arity$variadic = G__5150__delegate;
      return G__5150
    }()
  };
  var partial__4 = function(f, arg1, arg2, arg3) {
    return function() {
      var G__5152__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, arg2, arg3, args)
      };
      var G__5152 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__5152__delegate.call(this, args)
      };
      G__5152.cljs$lang$maxFixedArity = 0;
      G__5152.cljs$lang$applyTo = function(arglist__5153) {
        var args = cljs.core.seq(arglist__5153);
        return G__5152__delegate(args)
      };
      G__5152.cljs$lang$arity$variadic = G__5152__delegate;
      return G__5152
    }()
  };
  var partial__5 = function() {
    var G__5154__delegate = function(f, arg1, arg2, arg3, more) {
      return function() {
        var G__5155__delegate = function(args) {
          return cljs.core.apply.call(null, f, arg1, arg2, arg3, cljs.core.concat.call(null, more, args))
        };
        var G__5155 = function(var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
          }
          return G__5155__delegate.call(this, args)
        };
        G__5155.cljs$lang$maxFixedArity = 0;
        G__5155.cljs$lang$applyTo = function(arglist__5156) {
          var args = cljs.core.seq(arglist__5156);
          return G__5155__delegate(args)
        };
        G__5155.cljs$lang$arity$variadic = G__5155__delegate;
        return G__5155
      }()
    };
    var G__5154 = function(f, arg1, arg2, arg3, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__5154__delegate.call(this, f, arg1, arg2, arg3, more)
    };
    G__5154.cljs$lang$maxFixedArity = 4;
    G__5154.cljs$lang$applyTo = function(arglist__5157) {
      var f = cljs.core.first(arglist__5157);
      var arg1 = cljs.core.first(cljs.core.next(arglist__5157));
      var arg2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__5157)));
      var arg3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__5157))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__5157))));
      return G__5154__delegate(f, arg1, arg2, arg3, more)
    };
    G__5154.cljs$lang$arity$variadic = G__5154__delegate;
    return G__5154
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
      var G__5158 = null;
      var G__5158__1 = function(a) {
        return f.call(null, a == null ? x : a)
      };
      var G__5158__2 = function(a, b) {
        return f.call(null, a == null ? x : a, b)
      };
      var G__5158__3 = function(a, b, c) {
        return f.call(null, a == null ? x : a, b, c)
      };
      var G__5158__4 = function() {
        var G__5159__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, a == null ? x : a, b, c, ds)
        };
        var G__5159 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__5159__delegate.call(this, a, b, c, ds)
        };
        G__5159.cljs$lang$maxFixedArity = 3;
        G__5159.cljs$lang$applyTo = function(arglist__5160) {
          var a = cljs.core.first(arglist__5160);
          var b = cljs.core.first(cljs.core.next(arglist__5160));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__5160)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__5160)));
          return G__5159__delegate(a, b, c, ds)
        };
        G__5159.cljs$lang$arity$variadic = G__5159__delegate;
        return G__5159
      }();
      G__5158 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 1:
            return G__5158__1.call(this, a);
          case 2:
            return G__5158__2.call(this, a, b);
          case 3:
            return G__5158__3.call(this, a, b, c);
          default:
            return G__5158__4.cljs$lang$arity$variadic(a, b, c, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__5158.cljs$lang$maxFixedArity = 3;
      G__5158.cljs$lang$applyTo = G__5158__4.cljs$lang$applyTo;
      return G__5158
    }()
  };
  var fnil__3 = function(f, x, y) {
    return function() {
      var G__5161 = null;
      var G__5161__2 = function(a, b) {
        return f.call(null, a == null ? x : a, b == null ? y : b)
      };
      var G__5161__3 = function(a, b, c) {
        return f.call(null, a == null ? x : a, b == null ? y : b, c)
      };
      var G__5161__4 = function() {
        var G__5162__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, a == null ? x : a, b == null ? y : b, c, ds)
        };
        var G__5162 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__5162__delegate.call(this, a, b, c, ds)
        };
        G__5162.cljs$lang$maxFixedArity = 3;
        G__5162.cljs$lang$applyTo = function(arglist__5163) {
          var a = cljs.core.first(arglist__5163);
          var b = cljs.core.first(cljs.core.next(arglist__5163));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__5163)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__5163)));
          return G__5162__delegate(a, b, c, ds)
        };
        G__5162.cljs$lang$arity$variadic = G__5162__delegate;
        return G__5162
      }();
      G__5161 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 2:
            return G__5161__2.call(this, a, b);
          case 3:
            return G__5161__3.call(this, a, b, c);
          default:
            return G__5161__4.cljs$lang$arity$variadic(a, b, c, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__5161.cljs$lang$maxFixedArity = 3;
      G__5161.cljs$lang$applyTo = G__5161__4.cljs$lang$applyTo;
      return G__5161
    }()
  };
  var fnil__4 = function(f, x, y, z) {
    return function() {
      var G__5164 = null;
      var G__5164__2 = function(a, b) {
        return f.call(null, a == null ? x : a, b == null ? y : b)
      };
      var G__5164__3 = function(a, b, c) {
        return f.call(null, a == null ? x : a, b == null ? y : b, c == null ? z : c)
      };
      var G__5164__4 = function() {
        var G__5165__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, a == null ? x : a, b == null ? y : b, c == null ? z : c, ds)
        };
        var G__5165 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__5165__delegate.call(this, a, b, c, ds)
        };
        G__5165.cljs$lang$maxFixedArity = 3;
        G__5165.cljs$lang$applyTo = function(arglist__5166) {
          var a = cljs.core.first(arglist__5166);
          var b = cljs.core.first(cljs.core.next(arglist__5166));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__5166)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__5166)));
          return G__5165__delegate(a, b, c, ds)
        };
        G__5165.cljs$lang$arity$variadic = G__5165__delegate;
        return G__5165
      }();
      G__5164 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 2:
            return G__5164__2.call(this, a, b);
          case 3:
            return G__5164__3.call(this, a, b, c);
          default:
            return G__5164__4.cljs$lang$arity$variadic(a, b, c, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__5164.cljs$lang$maxFixedArity = 3;
      G__5164.cljs$lang$applyTo = G__5164__4.cljs$lang$applyTo;
      return G__5164
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
  var mapi__5169 = function mpi(idx, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____5167 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3974__auto____5167)) {
        var s__5168 = temp__3974__auto____5167;
        return cljs.core.cons.call(null, f.call(null, idx, cljs.core.first.call(null, s__5168)), mpi.call(null, idx + 1, cljs.core.rest.call(null, s__5168)))
      }else {
        return null
      }
    })
  };
  return mapi__5169.call(null, 0, coll)
};
cljs.core.keep = function keep(f, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____5170 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3974__auto____5170)) {
      var s__5171 = temp__3974__auto____5170;
      var x__5172 = f.call(null, cljs.core.first.call(null, s__5171));
      if(x__5172 == null) {
        return keep.call(null, f, cljs.core.rest.call(null, s__5171))
      }else {
        return cljs.core.cons.call(null, x__5172, keep.call(null, f, cljs.core.rest.call(null, s__5171)))
      }
    }else {
      return null
    }
  })
};
cljs.core.keep_indexed = function keep_indexed(f, coll) {
  var keepi__5182 = function kpi(idx, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____5179 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3974__auto____5179)) {
        var s__5180 = temp__3974__auto____5179;
        var x__5181 = f.call(null, idx, cljs.core.first.call(null, s__5180));
        if(x__5181 == null) {
          return kpi.call(null, idx + 1, cljs.core.rest.call(null, s__5180))
        }else {
          return cljs.core.cons.call(null, x__5181, kpi.call(null, idx + 1, cljs.core.rest.call(null, s__5180)))
        }
      }else {
        return null
      }
    })
  };
  return keepi__5182.call(null, 0, coll)
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
          var and__3822__auto____5189 = p.call(null, x);
          if(cljs.core.truth_(and__3822__auto____5189)) {
            return p.call(null, y)
          }else {
            return and__3822__auto____5189
          }
        }())
      };
      var ep1__3 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____5190 = p.call(null, x);
          if(cljs.core.truth_(and__3822__auto____5190)) {
            var and__3822__auto____5191 = p.call(null, y);
            if(cljs.core.truth_(and__3822__auto____5191)) {
              return p.call(null, z)
            }else {
              return and__3822__auto____5191
            }
          }else {
            return and__3822__auto____5190
          }
        }())
      };
      var ep1__4 = function() {
        var G__5227__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3822__auto____5192 = ep1.call(null, x, y, z);
            if(cljs.core.truth_(and__3822__auto____5192)) {
              return cljs.core.every_QMARK_.call(null, p, args)
            }else {
              return and__3822__auto____5192
            }
          }())
        };
        var G__5227 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__5227__delegate.call(this, x, y, z, args)
        };
        G__5227.cljs$lang$maxFixedArity = 3;
        G__5227.cljs$lang$applyTo = function(arglist__5228) {
          var x = cljs.core.first(arglist__5228);
          var y = cljs.core.first(cljs.core.next(arglist__5228));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__5228)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__5228)));
          return G__5227__delegate(x, y, z, args)
        };
        G__5227.cljs$lang$arity$variadic = G__5227__delegate;
        return G__5227
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
          var and__3822__auto____5193 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____5193)) {
            return p2.call(null, x)
          }else {
            return and__3822__auto____5193
          }
        }())
      };
      var ep2__2 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____5194 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____5194)) {
            var and__3822__auto____5195 = p1.call(null, y);
            if(cljs.core.truth_(and__3822__auto____5195)) {
              var and__3822__auto____5196 = p2.call(null, x);
              if(cljs.core.truth_(and__3822__auto____5196)) {
                return p2.call(null, y)
              }else {
                return and__3822__auto____5196
              }
            }else {
              return and__3822__auto____5195
            }
          }else {
            return and__3822__auto____5194
          }
        }())
      };
      var ep2__3 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____5197 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____5197)) {
            var and__3822__auto____5198 = p1.call(null, y);
            if(cljs.core.truth_(and__3822__auto____5198)) {
              var and__3822__auto____5199 = p1.call(null, z);
              if(cljs.core.truth_(and__3822__auto____5199)) {
                var and__3822__auto____5200 = p2.call(null, x);
                if(cljs.core.truth_(and__3822__auto____5200)) {
                  var and__3822__auto____5201 = p2.call(null, y);
                  if(cljs.core.truth_(and__3822__auto____5201)) {
                    return p2.call(null, z)
                  }else {
                    return and__3822__auto____5201
                  }
                }else {
                  return and__3822__auto____5200
                }
              }else {
                return and__3822__auto____5199
              }
            }else {
              return and__3822__auto____5198
            }
          }else {
            return and__3822__auto____5197
          }
        }())
      };
      var ep2__4 = function() {
        var G__5229__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3822__auto____5202 = ep2.call(null, x, y, z);
            if(cljs.core.truth_(and__3822__auto____5202)) {
              return cljs.core.every_QMARK_.call(null, function(p1__5173_SHARP_) {
                var and__3822__auto____5203 = p1.call(null, p1__5173_SHARP_);
                if(cljs.core.truth_(and__3822__auto____5203)) {
                  return p2.call(null, p1__5173_SHARP_)
                }else {
                  return and__3822__auto____5203
                }
              }, args)
            }else {
              return and__3822__auto____5202
            }
          }())
        };
        var G__5229 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__5229__delegate.call(this, x, y, z, args)
        };
        G__5229.cljs$lang$maxFixedArity = 3;
        G__5229.cljs$lang$applyTo = function(arglist__5230) {
          var x = cljs.core.first(arglist__5230);
          var y = cljs.core.first(cljs.core.next(arglist__5230));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__5230)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__5230)));
          return G__5229__delegate(x, y, z, args)
        };
        G__5229.cljs$lang$arity$variadic = G__5229__delegate;
        return G__5229
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
          var and__3822__auto____5204 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____5204)) {
            var and__3822__auto____5205 = p2.call(null, x);
            if(cljs.core.truth_(and__3822__auto____5205)) {
              return p3.call(null, x)
            }else {
              return and__3822__auto____5205
            }
          }else {
            return and__3822__auto____5204
          }
        }())
      };
      var ep3__2 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____5206 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____5206)) {
            var and__3822__auto____5207 = p2.call(null, x);
            if(cljs.core.truth_(and__3822__auto____5207)) {
              var and__3822__auto____5208 = p3.call(null, x);
              if(cljs.core.truth_(and__3822__auto____5208)) {
                var and__3822__auto____5209 = p1.call(null, y);
                if(cljs.core.truth_(and__3822__auto____5209)) {
                  var and__3822__auto____5210 = p2.call(null, y);
                  if(cljs.core.truth_(and__3822__auto____5210)) {
                    return p3.call(null, y)
                  }else {
                    return and__3822__auto____5210
                  }
                }else {
                  return and__3822__auto____5209
                }
              }else {
                return and__3822__auto____5208
              }
            }else {
              return and__3822__auto____5207
            }
          }else {
            return and__3822__auto____5206
          }
        }())
      };
      var ep3__3 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____5211 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____5211)) {
            var and__3822__auto____5212 = p2.call(null, x);
            if(cljs.core.truth_(and__3822__auto____5212)) {
              var and__3822__auto____5213 = p3.call(null, x);
              if(cljs.core.truth_(and__3822__auto____5213)) {
                var and__3822__auto____5214 = p1.call(null, y);
                if(cljs.core.truth_(and__3822__auto____5214)) {
                  var and__3822__auto____5215 = p2.call(null, y);
                  if(cljs.core.truth_(and__3822__auto____5215)) {
                    var and__3822__auto____5216 = p3.call(null, y);
                    if(cljs.core.truth_(and__3822__auto____5216)) {
                      var and__3822__auto____5217 = p1.call(null, z);
                      if(cljs.core.truth_(and__3822__auto____5217)) {
                        var and__3822__auto____5218 = p2.call(null, z);
                        if(cljs.core.truth_(and__3822__auto____5218)) {
                          return p3.call(null, z)
                        }else {
                          return and__3822__auto____5218
                        }
                      }else {
                        return and__3822__auto____5217
                      }
                    }else {
                      return and__3822__auto____5216
                    }
                  }else {
                    return and__3822__auto____5215
                  }
                }else {
                  return and__3822__auto____5214
                }
              }else {
                return and__3822__auto____5213
              }
            }else {
              return and__3822__auto____5212
            }
          }else {
            return and__3822__auto____5211
          }
        }())
      };
      var ep3__4 = function() {
        var G__5231__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3822__auto____5219 = ep3.call(null, x, y, z);
            if(cljs.core.truth_(and__3822__auto____5219)) {
              return cljs.core.every_QMARK_.call(null, function(p1__5174_SHARP_) {
                var and__3822__auto____5220 = p1.call(null, p1__5174_SHARP_);
                if(cljs.core.truth_(and__3822__auto____5220)) {
                  var and__3822__auto____5221 = p2.call(null, p1__5174_SHARP_);
                  if(cljs.core.truth_(and__3822__auto____5221)) {
                    return p3.call(null, p1__5174_SHARP_)
                  }else {
                    return and__3822__auto____5221
                  }
                }else {
                  return and__3822__auto____5220
                }
              }, args)
            }else {
              return and__3822__auto____5219
            }
          }())
        };
        var G__5231 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__5231__delegate.call(this, x, y, z, args)
        };
        G__5231.cljs$lang$maxFixedArity = 3;
        G__5231.cljs$lang$applyTo = function(arglist__5232) {
          var x = cljs.core.first(arglist__5232);
          var y = cljs.core.first(cljs.core.next(arglist__5232));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__5232)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__5232)));
          return G__5231__delegate(x, y, z, args)
        };
        G__5231.cljs$lang$arity$variadic = G__5231__delegate;
        return G__5231
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
    var G__5233__delegate = function(p1, p2, p3, ps) {
      var ps__5222 = cljs.core.list_STAR_.call(null, p1, p2, p3, ps);
      return function() {
        var epn = null;
        var epn__0 = function() {
          return true
        };
        var epn__1 = function(x) {
          return cljs.core.every_QMARK_.call(null, function(p1__5175_SHARP_) {
            return p1__5175_SHARP_.call(null, x)
          }, ps__5222)
        };
        var epn__2 = function(x, y) {
          return cljs.core.every_QMARK_.call(null, function(p1__5176_SHARP_) {
            var and__3822__auto____5223 = p1__5176_SHARP_.call(null, x);
            if(cljs.core.truth_(and__3822__auto____5223)) {
              return p1__5176_SHARP_.call(null, y)
            }else {
              return and__3822__auto____5223
            }
          }, ps__5222)
        };
        var epn__3 = function(x, y, z) {
          return cljs.core.every_QMARK_.call(null, function(p1__5177_SHARP_) {
            var and__3822__auto____5224 = p1__5177_SHARP_.call(null, x);
            if(cljs.core.truth_(and__3822__auto____5224)) {
              var and__3822__auto____5225 = p1__5177_SHARP_.call(null, y);
              if(cljs.core.truth_(and__3822__auto____5225)) {
                return p1__5177_SHARP_.call(null, z)
              }else {
                return and__3822__auto____5225
              }
            }else {
              return and__3822__auto____5224
            }
          }, ps__5222)
        };
        var epn__4 = function() {
          var G__5234__delegate = function(x, y, z, args) {
            return cljs.core.boolean$.call(null, function() {
              var and__3822__auto____5226 = epn.call(null, x, y, z);
              if(cljs.core.truth_(and__3822__auto____5226)) {
                return cljs.core.every_QMARK_.call(null, function(p1__5178_SHARP_) {
                  return cljs.core.every_QMARK_.call(null, p1__5178_SHARP_, args)
                }, ps__5222)
              }else {
                return and__3822__auto____5226
              }
            }())
          };
          var G__5234 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__5234__delegate.call(this, x, y, z, args)
          };
          G__5234.cljs$lang$maxFixedArity = 3;
          G__5234.cljs$lang$applyTo = function(arglist__5235) {
            var x = cljs.core.first(arglist__5235);
            var y = cljs.core.first(cljs.core.next(arglist__5235));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__5235)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__5235)));
            return G__5234__delegate(x, y, z, args)
          };
          G__5234.cljs$lang$arity$variadic = G__5234__delegate;
          return G__5234
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
    var G__5233 = function(p1, p2, p3, var_args) {
      var ps = null;
      if(goog.isDef(var_args)) {
        ps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__5233__delegate.call(this, p1, p2, p3, ps)
    };
    G__5233.cljs$lang$maxFixedArity = 3;
    G__5233.cljs$lang$applyTo = function(arglist__5236) {
      var p1 = cljs.core.first(arglist__5236);
      var p2 = cljs.core.first(cljs.core.next(arglist__5236));
      var p3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__5236)));
      var ps = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__5236)));
      return G__5233__delegate(p1, p2, p3, ps)
    };
    G__5233.cljs$lang$arity$variadic = G__5233__delegate;
    return G__5233
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
        var or__3824__auto____5238 = p.call(null, x);
        if(cljs.core.truth_(or__3824__auto____5238)) {
          return or__3824__auto____5238
        }else {
          return p.call(null, y)
        }
      };
      var sp1__3 = function(x, y, z) {
        var or__3824__auto____5239 = p.call(null, x);
        if(cljs.core.truth_(or__3824__auto____5239)) {
          return or__3824__auto____5239
        }else {
          var or__3824__auto____5240 = p.call(null, y);
          if(cljs.core.truth_(or__3824__auto____5240)) {
            return or__3824__auto____5240
          }else {
            return p.call(null, z)
          }
        }
      };
      var sp1__4 = function() {
        var G__5276__delegate = function(x, y, z, args) {
          var or__3824__auto____5241 = sp1.call(null, x, y, z);
          if(cljs.core.truth_(or__3824__auto____5241)) {
            return or__3824__auto____5241
          }else {
            return cljs.core.some.call(null, p, args)
          }
        };
        var G__5276 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__5276__delegate.call(this, x, y, z, args)
        };
        G__5276.cljs$lang$maxFixedArity = 3;
        G__5276.cljs$lang$applyTo = function(arglist__5277) {
          var x = cljs.core.first(arglist__5277);
          var y = cljs.core.first(cljs.core.next(arglist__5277));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__5277)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__5277)));
          return G__5276__delegate(x, y, z, args)
        };
        G__5276.cljs$lang$arity$variadic = G__5276__delegate;
        return G__5276
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
        var or__3824__auto____5242 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____5242)) {
          return or__3824__auto____5242
        }else {
          return p2.call(null, x)
        }
      };
      var sp2__2 = function(x, y) {
        var or__3824__auto____5243 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____5243)) {
          return or__3824__auto____5243
        }else {
          var or__3824__auto____5244 = p1.call(null, y);
          if(cljs.core.truth_(or__3824__auto____5244)) {
            return or__3824__auto____5244
          }else {
            var or__3824__auto____5245 = p2.call(null, x);
            if(cljs.core.truth_(or__3824__auto____5245)) {
              return or__3824__auto____5245
            }else {
              return p2.call(null, y)
            }
          }
        }
      };
      var sp2__3 = function(x, y, z) {
        var or__3824__auto____5246 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____5246)) {
          return or__3824__auto____5246
        }else {
          var or__3824__auto____5247 = p1.call(null, y);
          if(cljs.core.truth_(or__3824__auto____5247)) {
            return or__3824__auto____5247
          }else {
            var or__3824__auto____5248 = p1.call(null, z);
            if(cljs.core.truth_(or__3824__auto____5248)) {
              return or__3824__auto____5248
            }else {
              var or__3824__auto____5249 = p2.call(null, x);
              if(cljs.core.truth_(or__3824__auto____5249)) {
                return or__3824__auto____5249
              }else {
                var or__3824__auto____5250 = p2.call(null, y);
                if(cljs.core.truth_(or__3824__auto____5250)) {
                  return or__3824__auto____5250
                }else {
                  return p2.call(null, z)
                }
              }
            }
          }
        }
      };
      var sp2__4 = function() {
        var G__5278__delegate = function(x, y, z, args) {
          var or__3824__auto____5251 = sp2.call(null, x, y, z);
          if(cljs.core.truth_(or__3824__auto____5251)) {
            return or__3824__auto____5251
          }else {
            return cljs.core.some.call(null, function(p1__5183_SHARP_) {
              var or__3824__auto____5252 = p1.call(null, p1__5183_SHARP_);
              if(cljs.core.truth_(or__3824__auto____5252)) {
                return or__3824__auto____5252
              }else {
                return p2.call(null, p1__5183_SHARP_)
              }
            }, args)
          }
        };
        var G__5278 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__5278__delegate.call(this, x, y, z, args)
        };
        G__5278.cljs$lang$maxFixedArity = 3;
        G__5278.cljs$lang$applyTo = function(arglist__5279) {
          var x = cljs.core.first(arglist__5279);
          var y = cljs.core.first(cljs.core.next(arglist__5279));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__5279)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__5279)));
          return G__5278__delegate(x, y, z, args)
        };
        G__5278.cljs$lang$arity$variadic = G__5278__delegate;
        return G__5278
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
        var or__3824__auto____5253 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____5253)) {
          return or__3824__auto____5253
        }else {
          var or__3824__auto____5254 = p2.call(null, x);
          if(cljs.core.truth_(or__3824__auto____5254)) {
            return or__3824__auto____5254
          }else {
            return p3.call(null, x)
          }
        }
      };
      var sp3__2 = function(x, y) {
        var or__3824__auto____5255 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____5255)) {
          return or__3824__auto____5255
        }else {
          var or__3824__auto____5256 = p2.call(null, x);
          if(cljs.core.truth_(or__3824__auto____5256)) {
            return or__3824__auto____5256
          }else {
            var or__3824__auto____5257 = p3.call(null, x);
            if(cljs.core.truth_(or__3824__auto____5257)) {
              return or__3824__auto____5257
            }else {
              var or__3824__auto____5258 = p1.call(null, y);
              if(cljs.core.truth_(or__3824__auto____5258)) {
                return or__3824__auto____5258
              }else {
                var or__3824__auto____5259 = p2.call(null, y);
                if(cljs.core.truth_(or__3824__auto____5259)) {
                  return or__3824__auto____5259
                }else {
                  return p3.call(null, y)
                }
              }
            }
          }
        }
      };
      var sp3__3 = function(x, y, z) {
        var or__3824__auto____5260 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____5260)) {
          return or__3824__auto____5260
        }else {
          var or__3824__auto____5261 = p2.call(null, x);
          if(cljs.core.truth_(or__3824__auto____5261)) {
            return or__3824__auto____5261
          }else {
            var or__3824__auto____5262 = p3.call(null, x);
            if(cljs.core.truth_(or__3824__auto____5262)) {
              return or__3824__auto____5262
            }else {
              var or__3824__auto____5263 = p1.call(null, y);
              if(cljs.core.truth_(or__3824__auto____5263)) {
                return or__3824__auto____5263
              }else {
                var or__3824__auto____5264 = p2.call(null, y);
                if(cljs.core.truth_(or__3824__auto____5264)) {
                  return or__3824__auto____5264
                }else {
                  var or__3824__auto____5265 = p3.call(null, y);
                  if(cljs.core.truth_(or__3824__auto____5265)) {
                    return or__3824__auto____5265
                  }else {
                    var or__3824__auto____5266 = p1.call(null, z);
                    if(cljs.core.truth_(or__3824__auto____5266)) {
                      return or__3824__auto____5266
                    }else {
                      var or__3824__auto____5267 = p2.call(null, z);
                      if(cljs.core.truth_(or__3824__auto____5267)) {
                        return or__3824__auto____5267
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
        var G__5280__delegate = function(x, y, z, args) {
          var or__3824__auto____5268 = sp3.call(null, x, y, z);
          if(cljs.core.truth_(or__3824__auto____5268)) {
            return or__3824__auto____5268
          }else {
            return cljs.core.some.call(null, function(p1__5184_SHARP_) {
              var or__3824__auto____5269 = p1.call(null, p1__5184_SHARP_);
              if(cljs.core.truth_(or__3824__auto____5269)) {
                return or__3824__auto____5269
              }else {
                var or__3824__auto____5270 = p2.call(null, p1__5184_SHARP_);
                if(cljs.core.truth_(or__3824__auto____5270)) {
                  return or__3824__auto____5270
                }else {
                  return p3.call(null, p1__5184_SHARP_)
                }
              }
            }, args)
          }
        };
        var G__5280 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__5280__delegate.call(this, x, y, z, args)
        };
        G__5280.cljs$lang$maxFixedArity = 3;
        G__5280.cljs$lang$applyTo = function(arglist__5281) {
          var x = cljs.core.first(arglist__5281);
          var y = cljs.core.first(cljs.core.next(arglist__5281));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__5281)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__5281)));
          return G__5280__delegate(x, y, z, args)
        };
        G__5280.cljs$lang$arity$variadic = G__5280__delegate;
        return G__5280
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
    var G__5282__delegate = function(p1, p2, p3, ps) {
      var ps__5271 = cljs.core.list_STAR_.call(null, p1, p2, p3, ps);
      return function() {
        var spn = null;
        var spn__0 = function() {
          return null
        };
        var spn__1 = function(x) {
          return cljs.core.some.call(null, function(p1__5185_SHARP_) {
            return p1__5185_SHARP_.call(null, x)
          }, ps__5271)
        };
        var spn__2 = function(x, y) {
          return cljs.core.some.call(null, function(p1__5186_SHARP_) {
            var or__3824__auto____5272 = p1__5186_SHARP_.call(null, x);
            if(cljs.core.truth_(or__3824__auto____5272)) {
              return or__3824__auto____5272
            }else {
              return p1__5186_SHARP_.call(null, y)
            }
          }, ps__5271)
        };
        var spn__3 = function(x, y, z) {
          return cljs.core.some.call(null, function(p1__5187_SHARP_) {
            var or__3824__auto____5273 = p1__5187_SHARP_.call(null, x);
            if(cljs.core.truth_(or__3824__auto____5273)) {
              return or__3824__auto____5273
            }else {
              var or__3824__auto____5274 = p1__5187_SHARP_.call(null, y);
              if(cljs.core.truth_(or__3824__auto____5274)) {
                return or__3824__auto____5274
              }else {
                return p1__5187_SHARP_.call(null, z)
              }
            }
          }, ps__5271)
        };
        var spn__4 = function() {
          var G__5283__delegate = function(x, y, z, args) {
            var or__3824__auto____5275 = spn.call(null, x, y, z);
            if(cljs.core.truth_(or__3824__auto____5275)) {
              return or__3824__auto____5275
            }else {
              return cljs.core.some.call(null, function(p1__5188_SHARP_) {
                return cljs.core.some.call(null, p1__5188_SHARP_, args)
              }, ps__5271)
            }
          };
          var G__5283 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__5283__delegate.call(this, x, y, z, args)
          };
          G__5283.cljs$lang$maxFixedArity = 3;
          G__5283.cljs$lang$applyTo = function(arglist__5284) {
            var x = cljs.core.first(arglist__5284);
            var y = cljs.core.first(cljs.core.next(arglist__5284));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__5284)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__5284)));
            return G__5283__delegate(x, y, z, args)
          };
          G__5283.cljs$lang$arity$variadic = G__5283__delegate;
          return G__5283
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
    var G__5282 = function(p1, p2, p3, var_args) {
      var ps = null;
      if(goog.isDef(var_args)) {
        ps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__5282__delegate.call(this, p1, p2, p3, ps)
    };
    G__5282.cljs$lang$maxFixedArity = 3;
    G__5282.cljs$lang$applyTo = function(arglist__5285) {
      var p1 = cljs.core.first(arglist__5285);
      var p2 = cljs.core.first(cljs.core.next(arglist__5285));
      var p3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__5285)));
      var ps = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__5285)));
      return G__5282__delegate(p1, p2, p3, ps)
    };
    G__5282.cljs$lang$arity$variadic = G__5282__delegate;
    return G__5282
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
      var temp__3974__auto____5286 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3974__auto____5286)) {
        var s__5287 = temp__3974__auto____5286;
        return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s__5287)), map.call(null, f, cljs.core.rest.call(null, s__5287)))
      }else {
        return null
      }
    })
  };
  var map__3 = function(f, c1, c2) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1__5288 = cljs.core.seq.call(null, c1);
      var s2__5289 = cljs.core.seq.call(null, c2);
      if(cljs.core.truth_(function() {
        var and__3822__auto____5290 = s1__5288;
        if(cljs.core.truth_(and__3822__auto____5290)) {
          return s2__5289
        }else {
          return and__3822__auto____5290
        }
      }())) {
        return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s1__5288), cljs.core.first.call(null, s2__5289)), map.call(null, f, cljs.core.rest.call(null, s1__5288), cljs.core.rest.call(null, s2__5289)))
      }else {
        return null
      }
    })
  };
  var map__4 = function(f, c1, c2, c3) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1__5291 = cljs.core.seq.call(null, c1);
      var s2__5292 = cljs.core.seq.call(null, c2);
      var s3__5293 = cljs.core.seq.call(null, c3);
      if(cljs.core.truth_(function() {
        var and__3822__auto____5294 = s1__5291;
        if(cljs.core.truth_(and__3822__auto____5294)) {
          var and__3822__auto____5295 = s2__5292;
          if(cljs.core.truth_(and__3822__auto____5295)) {
            return s3__5293
          }else {
            return and__3822__auto____5295
          }
        }else {
          return and__3822__auto____5294
        }
      }())) {
        return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s1__5291), cljs.core.first.call(null, s2__5292), cljs.core.first.call(null, s3__5293)), map.call(null, f, cljs.core.rest.call(null, s1__5291), cljs.core.rest.call(null, s2__5292), cljs.core.rest.call(null, s3__5293)))
      }else {
        return null
      }
    })
  };
  var map__5 = function() {
    var G__5298__delegate = function(f, c1, c2, c3, colls) {
      var step__5297 = function step(cs) {
        return new cljs.core.LazySeq(null, false, function() {
          var ss__5296 = map.call(null, cljs.core.seq, cs);
          if(cljs.core.every_QMARK_.call(null, cljs.core.identity, ss__5296)) {
            return cljs.core.cons.call(null, map.call(null, cljs.core.first, ss__5296), step.call(null, map.call(null, cljs.core.rest, ss__5296)))
          }else {
            return null
          }
        })
      };
      return map.call(null, function(p1__5237_SHARP_) {
        return cljs.core.apply.call(null, f, p1__5237_SHARP_)
      }, step__5297.call(null, cljs.core.conj.call(null, colls, c3, c2, c1)))
    };
    var G__5298 = function(f, c1, c2, c3, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__5298__delegate.call(this, f, c1, c2, c3, colls)
    };
    G__5298.cljs$lang$maxFixedArity = 4;
    G__5298.cljs$lang$applyTo = function(arglist__5299) {
      var f = cljs.core.first(arglist__5299);
      var c1 = cljs.core.first(cljs.core.next(arglist__5299));
      var c2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__5299)));
      var c3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__5299))));
      var colls = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__5299))));
      return G__5298__delegate(f, c1, c2, c3, colls)
    };
    G__5298.cljs$lang$arity$variadic = G__5298__delegate;
    return G__5298
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
      var temp__3974__auto____5300 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3974__auto____5300)) {
        var s__5301 = temp__3974__auto____5300;
        return cljs.core.cons.call(null, cljs.core.first.call(null, s__5301), take.call(null, n - 1, cljs.core.rest.call(null, s__5301)))
      }else {
        return null
      }
    }else {
      return null
    }
  })
};
cljs.core.drop = function drop(n, coll) {
  var step__5304 = function(n, coll) {
    while(true) {
      var s__5302 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(function() {
        var and__3822__auto____5303 = n > 0;
        if(and__3822__auto____5303) {
          return s__5302
        }else {
          return and__3822__auto____5303
        }
      }())) {
        var G__5305 = n - 1;
        var G__5306 = cljs.core.rest.call(null, s__5302);
        n = G__5305;
        coll = G__5306;
        continue
      }else {
        return s__5302
      }
      break
    }
  };
  return new cljs.core.LazySeq(null, false, function() {
    return step__5304.call(null, n, coll)
  })
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
  var s__5307 = cljs.core.seq.call(null, coll);
  var lead__5308 = cljs.core.seq.call(null, cljs.core.drop.call(null, n, coll));
  while(true) {
    if(cljs.core.truth_(lead__5308)) {
      var G__5309 = cljs.core.next.call(null, s__5307);
      var G__5310 = cljs.core.next.call(null, lead__5308);
      s__5307 = G__5309;
      lead__5308 = G__5310;
      continue
    }else {
      return s__5307
    }
    break
  }
};
cljs.core.drop_while = function drop_while(pred, coll) {
  var step__5313 = function(pred, coll) {
    while(true) {
      var s__5311 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(function() {
        var and__3822__auto____5312 = s__5311;
        if(cljs.core.truth_(and__3822__auto____5312)) {
          return pred.call(null, cljs.core.first.call(null, s__5311))
        }else {
          return and__3822__auto____5312
        }
      }())) {
        var G__5314 = pred;
        var G__5315 = cljs.core.rest.call(null, s__5311);
        pred = G__5314;
        coll = G__5315;
        continue
      }else {
        return s__5311
      }
      break
    }
  };
  return new cljs.core.LazySeq(null, false, function() {
    return step__5313.call(null, pred, coll)
  })
};
cljs.core.cycle = function cycle(coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____5316 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3974__auto____5316)) {
      var s__5317 = temp__3974__auto____5316;
      return cljs.core.concat.call(null, s__5317, cycle.call(null, s__5317))
    }else {
      return null
    }
  })
};
cljs.core.split_at = function split_at(n, coll) {
  return cljs.core.PersistentVector.fromArray([cljs.core.take.call(null, n, coll), cljs.core.drop.call(null, n, coll)])
};
cljs.core.repeat = function() {
  var repeat = null;
  var repeat__1 = function(x) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, x, repeat.call(null, x))
    })
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
    })
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
  }))
};
cljs.core.interleave = function() {
  var interleave = null;
  var interleave__2 = function(c1, c2) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1__5318 = cljs.core.seq.call(null, c1);
      var s2__5319 = cljs.core.seq.call(null, c2);
      if(cljs.core.truth_(function() {
        var and__3822__auto____5320 = s1__5318;
        if(cljs.core.truth_(and__3822__auto____5320)) {
          return s2__5319
        }else {
          return and__3822__auto____5320
        }
      }())) {
        return cljs.core.cons.call(null, cljs.core.first.call(null, s1__5318), cljs.core.cons.call(null, cljs.core.first.call(null, s2__5319), interleave.call(null, cljs.core.rest.call(null, s1__5318), cljs.core.rest.call(null, s2__5319))))
      }else {
        return null
      }
    })
  };
  var interleave__3 = function() {
    var G__5322__delegate = function(c1, c2, colls) {
      return new cljs.core.LazySeq(null, false, function() {
        var ss__5321 = cljs.core.map.call(null, cljs.core.seq, cljs.core.conj.call(null, colls, c2, c1));
        if(cljs.core.every_QMARK_.call(null, cljs.core.identity, ss__5321)) {
          return cljs.core.concat.call(null, cljs.core.map.call(null, cljs.core.first, ss__5321), cljs.core.apply.call(null, interleave, cljs.core.map.call(null, cljs.core.rest, ss__5321)))
        }else {
          return null
        }
      })
    };
    var G__5322 = function(c1, c2, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__5322__delegate.call(this, c1, c2, colls)
    };
    G__5322.cljs$lang$maxFixedArity = 2;
    G__5322.cljs$lang$applyTo = function(arglist__5323) {
      var c1 = cljs.core.first(arglist__5323);
      var c2 = cljs.core.first(cljs.core.next(arglist__5323));
      var colls = cljs.core.rest(cljs.core.next(arglist__5323));
      return G__5322__delegate(c1, c2, colls)
    };
    G__5322.cljs$lang$arity$variadic = G__5322__delegate;
    return G__5322
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
  var cat__5326 = function cat(coll, colls) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3971__auto____5324 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3971__auto____5324)) {
        var coll__5325 = temp__3971__auto____5324;
        return cljs.core.cons.call(null, cljs.core.first.call(null, coll__5325), cat.call(null, cljs.core.rest.call(null, coll__5325), colls))
      }else {
        if(cljs.core.truth_(cljs.core.seq.call(null, colls))) {
          return cat.call(null, cljs.core.first.call(null, colls), cljs.core.rest.call(null, colls))
        }else {
          return null
        }
      }
    })
  };
  return cat__5326.call(null, null, colls)
};
cljs.core.mapcat = function() {
  var mapcat = null;
  var mapcat__2 = function(f, coll) {
    return cljs.core.flatten1.call(null, cljs.core.map.call(null, f, coll))
  };
  var mapcat__3 = function() {
    var G__5327__delegate = function(f, coll, colls) {
      return cljs.core.flatten1.call(null, cljs.core.apply.call(null, cljs.core.map, f, coll, colls))
    };
    var G__5327 = function(f, coll, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__5327__delegate.call(this, f, coll, colls)
    };
    G__5327.cljs$lang$maxFixedArity = 2;
    G__5327.cljs$lang$applyTo = function(arglist__5328) {
      var f = cljs.core.first(arglist__5328);
      var coll = cljs.core.first(cljs.core.next(arglist__5328));
      var colls = cljs.core.rest(cljs.core.next(arglist__5328));
      return G__5327__delegate(f, coll, colls)
    };
    G__5327.cljs$lang$arity$variadic = G__5327__delegate;
    return G__5327
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
    var temp__3974__auto____5329 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3974__auto____5329)) {
      var s__5330 = temp__3974__auto____5329;
      var f__5331 = cljs.core.first.call(null, s__5330);
      var r__5332 = cljs.core.rest.call(null, s__5330);
      if(cljs.core.truth_(pred.call(null, f__5331))) {
        return cljs.core.cons.call(null, f__5331, filter.call(null, pred, r__5332))
      }else {
        return filter.call(null, pred, r__5332)
      }
    }else {
      return null
    }
  })
};
cljs.core.remove = function remove(pred, coll) {
  return cljs.core.filter.call(null, cljs.core.complement.call(null, pred), coll)
};
cljs.core.tree_seq = function tree_seq(branch_QMARK_, children, root) {
  var walk__5334 = function walk(node) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, node, cljs.core.truth_(branch_QMARK_.call(null, node)) ? cljs.core.mapcat.call(null, walk, children.call(null, node)) : null)
    })
  };
  return walk__5334.call(null, root)
};
cljs.core.flatten = function flatten(x) {
  return cljs.core.filter.call(null, function(p1__5333_SHARP_) {
    return cljs.core.not.call(null, cljs.core.sequential_QMARK_.call(null, p1__5333_SHARP_))
  }, cljs.core.rest.call(null, cljs.core.tree_seq.call(null, cljs.core.sequential_QMARK_, cljs.core.seq, x)))
};
cljs.core.into = function into(to, from) {
  if(function() {
    var G__5335__5336 = to;
    if(G__5335__5336 != null) {
      if(function() {
        var or__3824__auto____5337 = G__5335__5336.cljs$lang$protocol_mask$partition0$ & 2147483648;
        if(or__3824__auto____5337) {
          return or__3824__auto____5337
        }else {
          return G__5335__5336.cljs$core$IEditableCollection$
        }
      }()) {
        return true
      }else {
        if(!G__5335__5336.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IEditableCollection, G__5335__5336)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IEditableCollection, G__5335__5336)
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
    }, cljs.core.transient$.call(null, cljs.core.PersistentVector.fromArray([])), coll))
  };
  var mapv__3 = function(f, c1, c2) {
    return cljs.core.into.call(null, cljs.core.PersistentVector.fromArray([]), cljs.core.map.call(null, f, c1, c2))
  };
  var mapv__4 = function(f, c1, c2, c3) {
    return cljs.core.into.call(null, cljs.core.PersistentVector.fromArray([]), cljs.core.map.call(null, f, c1, c2, c3))
  };
  var mapv__5 = function() {
    var G__5338__delegate = function(f, c1, c2, c3, colls) {
      return cljs.core.into.call(null, cljs.core.PersistentVector.fromArray([]), cljs.core.apply.call(null, cljs.core.map, f, c1, c2, c3, colls))
    };
    var G__5338 = function(f, c1, c2, c3, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__5338__delegate.call(this, f, c1, c2, c3, colls)
    };
    G__5338.cljs$lang$maxFixedArity = 4;
    G__5338.cljs$lang$applyTo = function(arglist__5339) {
      var f = cljs.core.first(arglist__5339);
      var c1 = cljs.core.first(cljs.core.next(arglist__5339));
      var c2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__5339)));
      var c3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__5339))));
      var colls = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__5339))));
      return G__5338__delegate(f, c1, c2, c3, colls)
    };
    G__5338.cljs$lang$arity$variadic = G__5338__delegate;
    return G__5338
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
  }, cljs.core.transient$.call(null, cljs.core.PersistentVector.fromArray([])), coll))
};
cljs.core.partition = function() {
  var partition = null;
  var partition__2 = function(n, coll) {
    return partition.call(null, n, n, coll)
  };
  var partition__3 = function(n, step, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____5340 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3974__auto____5340)) {
        var s__5341 = temp__3974__auto____5340;
        var p__5342 = cljs.core.take.call(null, n, s__5341);
        if(n === cljs.core.count.call(null, p__5342)) {
          return cljs.core.cons.call(null, p__5342, partition.call(null, n, step, cljs.core.drop.call(null, step, s__5341)))
        }else {
          return null
        }
      }else {
        return null
      }
    })
  };
  var partition__4 = function(n, step, pad, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____5343 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3974__auto____5343)) {
        var s__5344 = temp__3974__auto____5343;
        var p__5345 = cljs.core.take.call(null, n, s__5344);
        if(n === cljs.core.count.call(null, p__5345)) {
          return cljs.core.cons.call(null, p__5345, partition.call(null, n, step, pad, cljs.core.drop.call(null, step, s__5344)))
        }else {
          return cljs.core.list.call(null, cljs.core.take.call(null, n, cljs.core.concat.call(null, p__5345, pad)))
        }
      }else {
        return null
      }
    })
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
    var sentinel__5346 = cljs.core.lookup_sentinel;
    var m__5347 = m;
    var ks__5348 = cljs.core.seq.call(null, ks);
    while(true) {
      if(cljs.core.truth_(ks__5348)) {
        var m__5349 = cljs.core.get.call(null, m__5347, cljs.core.first.call(null, ks__5348), sentinel__5346);
        if(sentinel__5346 === m__5349) {
          return not_found
        }else {
          var G__5350 = sentinel__5346;
          var G__5351 = m__5349;
          var G__5352 = cljs.core.next.call(null, ks__5348);
          sentinel__5346 = G__5350;
          m__5347 = G__5351;
          ks__5348 = G__5352;
          continue
        }
      }else {
        return m__5347
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
cljs.core.assoc_in = function assoc_in(m, p__5353, v) {
  var vec__5354__5355 = p__5353;
  var k__5356 = cljs.core.nth.call(null, vec__5354__5355, 0, null);
  var ks__5357 = cljs.core.nthnext.call(null, vec__5354__5355, 1);
  if(cljs.core.truth_(ks__5357)) {
    return cljs.core.assoc.call(null, m, k__5356, assoc_in.call(null, cljs.core.get.call(null, m, k__5356), ks__5357, v))
  }else {
    return cljs.core.assoc.call(null, m, k__5356, v)
  }
};
cljs.core.update_in = function() {
  var update_in__delegate = function(m, p__5358, f, args) {
    var vec__5359__5360 = p__5358;
    var k__5361 = cljs.core.nth.call(null, vec__5359__5360, 0, null);
    var ks__5362 = cljs.core.nthnext.call(null, vec__5359__5360, 1);
    if(cljs.core.truth_(ks__5362)) {
      return cljs.core.assoc.call(null, m, k__5361, cljs.core.apply.call(null, update_in, cljs.core.get.call(null, m, k__5361), ks__5362, f, args))
    }else {
      return cljs.core.assoc.call(null, m, k__5361, cljs.core.apply.call(null, f, cljs.core.get.call(null, m, k__5361), args))
    }
  };
  var update_in = function(m, p__5358, f, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
    }
    return update_in__delegate.call(this, m, p__5358, f, args)
  };
  update_in.cljs$lang$maxFixedArity = 3;
  update_in.cljs$lang$applyTo = function(arglist__5363) {
    var m = cljs.core.first(arglist__5363);
    var p__5358 = cljs.core.first(cljs.core.next(arglist__5363));
    var f = cljs.core.first(cljs.core.next(cljs.core.next(arglist__5363)));
    var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__5363)));
    return update_in__delegate(m, p__5358, f, args)
  };
  update_in.cljs$lang$arity$variadic = update_in__delegate;
  return update_in
}();
cljs.core.Vector = function(meta, array, __hash) {
  this.meta = meta;
  this.array = array;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 16200095
};
cljs.core.Vector.cljs$lang$type = true;
cljs.core.Vector.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.Vector")
};
cljs.core.Vector.prototype.cljs$core$IHash$ = true;
cljs.core.Vector.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__5368 = this;
  var h__364__auto____5369 = this__5368.__hash;
  if(h__364__auto____5369 != null) {
    return h__364__auto____5369
  }else {
    var h__364__auto____5370 = cljs.core.hash_coll.call(null, coll);
    this__5368.__hash = h__364__auto____5370;
    return h__364__auto____5370
  }
};
cljs.core.Vector.prototype.cljs$core$ILookup$ = true;
cljs.core.Vector.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__5371 = this;
  return cljs.core._nth.call(null, coll, k, null)
};
cljs.core.Vector.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__5372 = this;
  return cljs.core._nth.call(null, coll, k, not_found)
};
cljs.core.Vector.prototype.cljs$core$IAssociative$ = true;
cljs.core.Vector.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__5373 = this;
  var new_array__5374 = cljs.core.aclone.call(null, this__5373.array);
  new_array__5374[k] = v;
  return new cljs.core.Vector(this__5373.meta, new_array__5374, null)
};
cljs.core.Vector.prototype.cljs$core$IFn$ = true;
cljs.core.Vector.prototype.call = function() {
  var G__5403 = null;
  var G__5403__2 = function(tsym5366, k) {
    var this__5375 = this;
    var tsym5366__5376 = this;
    var coll__5377 = tsym5366__5376;
    return cljs.core._lookup.call(null, coll__5377, k)
  };
  var G__5403__3 = function(tsym5367, k, not_found) {
    var this__5378 = this;
    var tsym5367__5379 = this;
    var coll__5380 = tsym5367__5379;
    return cljs.core._lookup.call(null, coll__5380, k, not_found)
  };
  G__5403 = function(tsym5367, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__5403__2.call(this, tsym5367, k);
      case 3:
        return G__5403__3.call(this, tsym5367, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__5403
}();
cljs.core.Vector.prototype.apply = function(tsym5364, args5365) {
  return tsym5364.call.apply(tsym5364, [tsym5364].concat(cljs.core.aclone.call(null, args5365)))
};
cljs.core.Vector.prototype.cljs$core$ISequential$ = true;
cljs.core.Vector.prototype.cljs$core$ICollection$ = true;
cljs.core.Vector.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__5381 = this;
  var new_array__5382 = cljs.core.aclone.call(null, this__5381.array);
  new_array__5382.push(o);
  return new cljs.core.Vector(this__5381.meta, new_array__5382, null)
};
cljs.core.Vector.prototype.toString = function() {
  var this__5383 = this;
  var this$__5384 = this;
  return cljs.core.pr_str.call(null, this$__5384)
};
cljs.core.Vector.prototype.cljs$core$IReduce$ = true;
cljs.core.Vector.prototype.cljs$core$IReduce$_reduce$arity$2 = function(v, f) {
  var this__5385 = this;
  return cljs.core.ci_reduce.call(null, this__5385.array, f)
};
cljs.core.Vector.prototype.cljs$core$IReduce$_reduce$arity$3 = function(v, f, start) {
  var this__5386 = this;
  return cljs.core.ci_reduce.call(null, this__5386.array, f, start)
};
cljs.core.Vector.prototype.cljs$core$ISeqable$ = true;
cljs.core.Vector.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__5387 = this;
  if(this__5387.array.length > 0) {
    var vector_seq__5388 = function vector_seq(i) {
      return new cljs.core.LazySeq(null, false, function() {
        if(i < this__5387.array.length) {
          return cljs.core.cons.call(null, this__5387.array[i], vector_seq.call(null, i + 1))
        }else {
          return null
        }
      })
    };
    return vector_seq__5388.call(null, 0)
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$ICounted$ = true;
cljs.core.Vector.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__5389 = this;
  return this__5389.array.length
};
cljs.core.Vector.prototype.cljs$core$IStack$ = true;
cljs.core.Vector.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__5390 = this;
  var count__5391 = this__5390.array.length;
  if(count__5391 > 0) {
    return this__5390.array[count__5391 - 1]
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__5392 = this;
  if(this__5392.array.length > 0) {
    var new_array__5393 = cljs.core.aclone.call(null, this__5392.array);
    new_array__5393.pop();
    return new cljs.core.Vector(this__5392.meta, new_array__5393, null)
  }else {
    throw new Error("Can't pop empty vector");
  }
};
cljs.core.Vector.prototype.cljs$core$IVector$ = true;
cljs.core.Vector.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(coll, n, val) {
  var this__5394 = this;
  return cljs.core._assoc.call(null, coll, n, val)
};
cljs.core.Vector.prototype.cljs$core$IEquiv$ = true;
cljs.core.Vector.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__5395 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Vector.prototype.cljs$core$IWithMeta$ = true;
cljs.core.Vector.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__5396 = this;
  return new cljs.core.Vector(meta, this__5396.array, this__5396.__hash)
};
cljs.core.Vector.prototype.cljs$core$IMeta$ = true;
cljs.core.Vector.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__5397 = this;
  return this__5397.meta
};
cljs.core.Vector.prototype.cljs$core$IIndexed$ = true;
cljs.core.Vector.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__5399 = this;
  if(function() {
    var and__3822__auto____5400 = 0 <= n;
    if(and__3822__auto____5400) {
      return n < this__5399.array.length
    }else {
      return and__3822__auto____5400
    }
  }()) {
    return this__5399.array[n]
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__5401 = this;
  if(function() {
    var and__3822__auto____5402 = 0 <= n;
    if(and__3822__auto____5402) {
      return n < this__5401.array.length
    }else {
      return and__3822__auto____5402
    }
  }()) {
    return this__5401.array[n]
  }else {
    return not_found
  }
};
cljs.core.Vector.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.Vector.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__5398 = this;
  return cljs.core.with_meta.call(null, cljs.core.Vector.EMPTY, this__5398.meta)
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
cljs.core.VectorNode.cljs$lang$ctorPrSeq = function(this__455__auto__) {
  return cljs.core.list.call(null, "cljs.core.VectorNode")
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
  return new cljs.core.VectorNode(node.edit, cljs.core.aclone.call(null, node.arr))
};
cljs.core.tail_off = function tail_off(pv) {
  var cnt__5404 = pv.cnt;
  if(cnt__5404 < 32) {
    return 0
  }else {
    return cnt__5404 - 1 >>> 5 << 5
  }
};
cljs.core.new_path = function new_path(edit, level, node) {
  var ll__5405 = level;
  var ret__5406 = node;
  while(true) {
    if(ll__5405 === 0) {
      return ret__5406
    }else {
      var embed__5407 = ret__5406;
      var r__5408 = cljs.core.pv_fresh_node.call(null, edit);
      var ___5409 = cljs.core.pv_aset.call(null, r__5408, 0, embed__5407);
      var G__5410 = ll__5405 - 5;
      var G__5411 = r__5408;
      ll__5405 = G__5410;
      ret__5406 = G__5411;
      continue
    }
    break
  }
};
cljs.core.push_tail = function push_tail(pv, level, parent, tailnode) {
  var ret__5412 = cljs.core.pv_clone_node.call(null, parent);
  var subidx__5413 = pv.cnt - 1 >>> level & 31;
  if(5 === level) {
    cljs.core.pv_aset.call(null, ret__5412, subidx__5413, tailnode);
    return ret__5412
  }else {
    var temp__3971__auto____5414 = cljs.core.pv_aget.call(null, parent, subidx__5413);
    if(cljs.core.truth_(temp__3971__auto____5414)) {
      var child__5415 = temp__3971__auto____5414;
      var node_to_insert__5416 = push_tail.call(null, pv, level - 5, child__5415, tailnode);
      cljs.core.pv_aset.call(null, ret__5412, subidx__5413, node_to_insert__5416);
      return ret__5412
    }else {
      var node_to_insert__5417 = cljs.core.new_path.call(null, null, level - 5, tailnode);
      cljs.core.pv_aset.call(null, ret__5412, subidx__5413, node_to_insert__5417);
      return ret__5412
    }
  }
};
cljs.core.array_for = function array_for(pv, i) {
  if(function() {
    var and__3822__auto____5418 = 0 <= i;
    if(and__3822__auto____5418) {
      return i < pv.cnt
    }else {
      return and__3822__auto____5418
    }
  }()) {
    if(i >= cljs.core.tail_off.call(null, pv)) {
      return pv.tail
    }else {
      var node__5419 = pv.root;
      var level__5420 = pv.shift;
      while(true) {
        if(level__5420 > 0) {
          var G__5421 = cljs.core.pv_aget.call(null, node__5419, i >>> level__5420 & 31);
          var G__5422 = level__5420 - 5;
          node__5419 = G__5421;
          level__5420 = G__5422;
          continue
        }else {
          return node__5419.arr
        }
        break
      }
    }
  }else {
    throw new Error([cljs.core.str("No item "), cljs.core.str(i), cljs.core.str(" in vector of length "), cljs.core.str(pv.cnt)].join(""));
  }
};
cljs.core.do_assoc = function do_assoc(pv, level, node, i, val) {
  var ret__5423 = cljs.core.pv_clone_node.call(null, node);
  if(level === 0) {
    cljs.core.pv_aset.call(null, ret__5423, i & 31, val);
    return ret__5423
  }else {
    var subidx__5424 = i >>> level & 31;
    cljs.core.pv_aset.call(null, ret__5423, subidx__5424, do_assoc.call(null, pv, level - 5, cljs.core.pv_aget.call(null, node, subidx__5424), i, val));
    return ret__5423
  }
};
cljs.core.pop_tail = function pop_tail(pv, level, node) {
  var subidx__5425 = pv.cnt - 2 >>> level & 31;
  if(level > 5) {
    var new_child__5426 = pop_tail.call(null, pv, level - 5, cljs.core.pv_aget.call(null, node, subidx__5425));
    if(function() {
      var and__3822__auto____5427 = new_child__5426 == null;
      if(and__3822__auto____5427) {
        return subidx__5425 === 0
      }else {
        return and__3822__auto____5427
      }
    }()) {
      return null
    }else {
      var ret__5428 = cljs.core.pv_clone_node.call(null, node);
      cljs.core.pv_aset.call(null, ret__5428, subidx__5425, new_child__5426);
      return ret__5428
    }
  }else {
    if(subidx__5425 === 0) {
      return null
    }else {
      if("\ufdd0'else") {
        var ret__5429 = cljs.core.pv_clone_node.call(null, node);
        cljs.core.pv_aset.call(null, ret__5429, subidx__5425, null);
        return ret__5429
      }else {
        return null
      }
    }
  }
};
void 0;
void 0;
void 0;
void 0;
void 0;
void 0;
cljs.core.vector_seq = function vector_seq(v, offset) {
  var c__5430 = cljs.core._count.call(null, v);
  if(c__5430 > 0) {
    if(void 0 === cljs.core.t5431) {
      cljs.core.t5431 = function(c, offset, v, vector_seq, __meta__389__auto__) {
        this.c = c;
        this.offset = offset;
        this.v = v;
        this.vector_seq = vector_seq;
        this.__meta__389__auto__ = __meta__389__auto__;
        this.cljs$lang$protocol_mask$partition1$ = 0;
        this.cljs$lang$protocol_mask$partition0$ = 282263648
      };
      cljs.core.t5431.cljs$lang$type = true;
      cljs.core.t5431.cljs$lang$ctorPrSeq = function(this__454__auto__) {
        return cljs.core.list.call(null, "cljs.core.t5431")
      };
      cljs.core.t5431.prototype.cljs$core$ISeqable$ = true;
      cljs.core.t5431.prototype.cljs$core$ISeqable$_seq$arity$1 = function(vseq) {
        var this__5432 = this;
        return vseq
      };
      cljs.core.t5431.prototype.cljs$core$ISeq$ = true;
      cljs.core.t5431.prototype.cljs$core$ISeq$_first$arity$1 = function(_) {
        var this__5433 = this;
        return cljs.core._nth.call(null, this__5433.v, this__5433.offset)
      };
      cljs.core.t5431.prototype.cljs$core$ISeq$_rest$arity$1 = function(_) {
        var this__5434 = this;
        var offset__5435 = this__5434.offset + 1;
        if(offset__5435 < this__5434.c) {
          return this__5434.vector_seq.call(null, this__5434.v, offset__5435)
        }else {
          return cljs.core.List.EMPTY
        }
      };
      cljs.core.t5431.prototype.cljs$core$ASeq$ = true;
      cljs.core.t5431.prototype.cljs$core$IEquiv$ = true;
      cljs.core.t5431.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(vseq, other) {
        var this__5436 = this;
        return cljs.core.equiv_sequential.call(null, vseq, other)
      };
      cljs.core.t5431.prototype.cljs$core$ISequential$ = true;
      cljs.core.t5431.prototype.cljs$core$IPrintable$ = true;
      cljs.core.t5431.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(vseq, opts) {
        var this__5437 = this;
        return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, vseq)
      };
      cljs.core.t5431.prototype.cljs$core$IMeta$ = true;
      cljs.core.t5431.prototype.cljs$core$IMeta$_meta$arity$1 = function(___390__auto__) {
        var this__5438 = this;
        return this__5438.__meta__389__auto__
      };
      cljs.core.t5431.prototype.cljs$core$IWithMeta$ = true;
      cljs.core.t5431.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(___390__auto__, __meta__389__auto__) {
        var this__5439 = this;
        return new cljs.core.t5431(this__5439.c, this__5439.offset, this__5439.v, this__5439.vector_seq, __meta__389__auto__)
      };
      cljs.core.t5431
    }else {
    }
    return new cljs.core.t5431(c__5430, offset, v, vector_seq, null)
  }else {
    return null
  }
};
cljs.core.PersistentVector = function(meta, cnt, shift, root, tail, __hash) {
  this.meta = meta;
  this.cnt = cnt;
  this.shift = shift;
  this.root = root;
  this.tail = tail;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 2164209055
};
cljs.core.PersistentVector.cljs$lang$type = true;
cljs.core.PersistentVector.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.PersistentVector")
};
cljs.core.PersistentVector.prototype.cljs$core$IEditableCollection$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var this__5444 = this;
  return new cljs.core.TransientVector(this__5444.cnt, this__5444.shift, cljs.core.tv_editable_root.call(null, this__5444.root), cljs.core.tv_editable_tail.call(null, this__5444.tail))
};
cljs.core.PersistentVector.prototype.cljs$core$IHash$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__5445 = this;
  var h__364__auto____5446 = this__5445.__hash;
  if(h__364__auto____5446 != null) {
    return h__364__auto____5446
  }else {
    var h__364__auto____5447 = cljs.core.hash_coll.call(null, coll);
    this__5445.__hash = h__364__auto____5447;
    return h__364__auto____5447
  }
};
cljs.core.PersistentVector.prototype.cljs$core$ILookup$ = true;
cljs.core.PersistentVector.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__5448 = this;
  return cljs.core._nth.call(null, coll, k, null)
};
cljs.core.PersistentVector.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__5449 = this;
  return cljs.core._nth.call(null, coll, k, not_found)
};
cljs.core.PersistentVector.prototype.cljs$core$IAssociative$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__5450 = this;
  if(function() {
    var and__3822__auto____5451 = 0 <= k;
    if(and__3822__auto____5451) {
      return k < this__5450.cnt
    }else {
      return and__3822__auto____5451
    }
  }()) {
    if(cljs.core.tail_off.call(null, coll) <= k) {
      var new_tail__5452 = cljs.core.aclone.call(null, this__5450.tail);
      new_tail__5452[k & 31] = v;
      return new cljs.core.PersistentVector(this__5450.meta, this__5450.cnt, this__5450.shift, this__5450.root, new_tail__5452, null)
    }else {
      return new cljs.core.PersistentVector(this__5450.meta, this__5450.cnt, this__5450.shift, cljs.core.do_assoc.call(null, coll, this__5450.shift, this__5450.root, k, v), this__5450.tail, null)
    }
  }else {
    if(k === this__5450.cnt) {
      return cljs.core._conj.call(null, coll, v)
    }else {
      if("\ufdd0'else") {
        throw new Error([cljs.core.str("Index "), cljs.core.str(k), cljs.core.str(" out of bounds  [0,"), cljs.core.str(this__5450.cnt), cljs.core.str("]")].join(""));
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IFn$ = true;
cljs.core.PersistentVector.prototype.call = function() {
  var G__5497 = null;
  var G__5497__2 = function(tsym5442, k) {
    var this__5453 = this;
    var tsym5442__5454 = this;
    var coll__5455 = tsym5442__5454;
    return cljs.core._lookup.call(null, coll__5455, k)
  };
  var G__5497__3 = function(tsym5443, k, not_found) {
    var this__5456 = this;
    var tsym5443__5457 = this;
    var coll__5458 = tsym5443__5457;
    return cljs.core._lookup.call(null, coll__5458, k, not_found)
  };
  G__5497 = function(tsym5443, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__5497__2.call(this, tsym5443, k);
      case 3:
        return G__5497__3.call(this, tsym5443, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__5497
}();
cljs.core.PersistentVector.prototype.apply = function(tsym5440, args5441) {
  return tsym5440.call.apply(tsym5440, [tsym5440].concat(cljs.core.aclone.call(null, args5441)))
};
cljs.core.PersistentVector.prototype.cljs$core$ISequential$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IKVReduce$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(v, f, init) {
  var this__5459 = this;
  var step_init__5460 = [0, init];
  var i__5461 = 0;
  while(true) {
    if(i__5461 < this__5459.cnt) {
      var arr__5462 = cljs.core.array_for.call(null, v, i__5461);
      var len__5463 = arr__5462.length;
      var init__5467 = function() {
        var j__5464 = 0;
        var init__5465 = step_init__5460[1];
        while(true) {
          if(j__5464 < len__5463) {
            var init__5466 = f.call(null, init__5465, j__5464 + i__5461, arr__5462[j__5464]);
            if(cljs.core.reduced_QMARK_.call(null, init__5466)) {
              return init__5466
            }else {
              var G__5498 = j__5464 + 1;
              var G__5499 = init__5466;
              j__5464 = G__5498;
              init__5465 = G__5499;
              continue
            }
          }else {
            step_init__5460[0] = len__5463;
            step_init__5460[1] = init__5465;
            return init__5465
          }
          break
        }
      }();
      if(cljs.core.reduced_QMARK_.call(null, init__5467)) {
        return cljs.core.deref.call(null, init__5467)
      }else {
        var G__5500 = i__5461 + step_init__5460[0];
        i__5461 = G__5500;
        continue
      }
    }else {
      return step_init__5460[1]
    }
    break
  }
};
cljs.core.PersistentVector.prototype.cljs$core$ICollection$ = true;
cljs.core.PersistentVector.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__5468 = this;
  if(this__5468.cnt - cljs.core.tail_off.call(null, coll) < 32) {
    var new_tail__5469 = cljs.core.aclone.call(null, this__5468.tail);
    new_tail__5469.push(o);
    return new cljs.core.PersistentVector(this__5468.meta, this__5468.cnt + 1, this__5468.shift, this__5468.root, new_tail__5469, null)
  }else {
    var root_overflow_QMARK___5470 = this__5468.cnt >>> 5 > 1 << this__5468.shift;
    var new_shift__5471 = root_overflow_QMARK___5470 ? this__5468.shift + 5 : this__5468.shift;
    var new_root__5473 = root_overflow_QMARK___5470 ? function() {
      var n_r__5472 = cljs.core.pv_fresh_node.call(null, null);
      cljs.core.pv_aset.call(null, n_r__5472, 0, this__5468.root);
      cljs.core.pv_aset.call(null, n_r__5472, 1, cljs.core.new_path.call(null, null, this__5468.shift, new cljs.core.VectorNode(null, this__5468.tail)));
      return n_r__5472
    }() : cljs.core.push_tail.call(null, coll, this__5468.shift, this__5468.root, new cljs.core.VectorNode(null, this__5468.tail));
    return new cljs.core.PersistentVector(this__5468.meta, this__5468.cnt + 1, new_shift__5471, new_root__5473, [o], null)
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IMapEntry$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IMapEntry$_key$arity$1 = function(coll) {
  var this__5474 = this;
  return cljs.core._nth.call(null, coll, 0)
};
cljs.core.PersistentVector.prototype.cljs$core$IMapEntry$_val$arity$1 = function(coll) {
  var this__5475 = this;
  return cljs.core._nth.call(null, coll, 1)
};
cljs.core.PersistentVector.prototype.toString = function() {
  var this__5476 = this;
  var this$__5477 = this;
  return cljs.core.pr_str.call(null, this$__5477)
};
cljs.core.PersistentVector.prototype.cljs$core$IReduce$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IReduce$_reduce$arity$2 = function(v, f) {
  var this__5478 = this;
  return cljs.core.ci_reduce.call(null, v, f)
};
cljs.core.PersistentVector.prototype.cljs$core$IReduce$_reduce$arity$3 = function(v, f, start) {
  var this__5479 = this;
  return cljs.core.ci_reduce.call(null, v, f, start)
};
cljs.core.PersistentVector.prototype.cljs$core$ISeqable$ = true;
cljs.core.PersistentVector.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__5480 = this;
  return cljs.core.vector_seq.call(null, coll, 0)
};
cljs.core.PersistentVector.prototype.cljs$core$ICounted$ = true;
cljs.core.PersistentVector.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__5481 = this;
  return this__5481.cnt
};
cljs.core.PersistentVector.prototype.cljs$core$IStack$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__5482 = this;
  if(this__5482.cnt > 0) {
    return cljs.core._nth.call(null, coll, this__5482.cnt - 1)
  }else {
    return null
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__5483 = this;
  if(this__5483.cnt === 0) {
    throw new Error("Can't pop empty vector");
  }else {
    if(1 === this__5483.cnt) {
      return cljs.core._with_meta.call(null, cljs.core.PersistentVector.EMPTY, this__5483.meta)
    }else {
      if(1 < this__5483.cnt - cljs.core.tail_off.call(null, coll)) {
        return new cljs.core.PersistentVector(this__5483.meta, this__5483.cnt - 1, this__5483.shift, this__5483.root, this__5483.tail.slice(0, -1), null)
      }else {
        if("\ufdd0'else") {
          var new_tail__5484 = cljs.core.array_for.call(null, coll, this__5483.cnt - 2);
          var nr__5485 = cljs.core.pop_tail.call(null, coll, this__5483.shift, this__5483.root);
          var new_root__5486 = nr__5485 == null ? cljs.core.PersistentVector.EMPTY_NODE : nr__5485;
          var cnt_1__5487 = this__5483.cnt - 1;
          if(function() {
            var and__3822__auto____5488 = 5 < this__5483.shift;
            if(and__3822__auto____5488) {
              return cljs.core.pv_aget.call(null, new_root__5486, 1) == null
            }else {
              return and__3822__auto____5488
            }
          }()) {
            return new cljs.core.PersistentVector(this__5483.meta, cnt_1__5487, this__5483.shift - 5, cljs.core.pv_aget.call(null, new_root__5486, 0), new_tail__5484, null)
          }else {
            return new cljs.core.PersistentVector(this__5483.meta, cnt_1__5487, this__5483.shift, new_root__5486, new_tail__5484, null)
          }
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IVector$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(coll, n, val) {
  var this__5490 = this;
  return cljs.core._assoc.call(null, coll, n, val)
};
cljs.core.PersistentVector.prototype.cljs$core$IEquiv$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__5491 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentVector.prototype.cljs$core$IWithMeta$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__5492 = this;
  return new cljs.core.PersistentVector(meta, this__5492.cnt, this__5492.shift, this__5492.root, this__5492.tail, this__5492.__hash)
};
cljs.core.PersistentVector.prototype.cljs$core$IMeta$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__5493 = this;
  return this__5493.meta
};
cljs.core.PersistentVector.prototype.cljs$core$IIndexed$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__5494 = this;
  return cljs.core.array_for.call(null, coll, n)[n & 31]
};
cljs.core.PersistentVector.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__5495 = this;
  if(function() {
    var and__3822__auto____5496 = 0 <= n;
    if(and__3822__auto____5496) {
      return n < this__5495.cnt
    }else {
      return and__3822__auto____5496
    }
  }()) {
    return cljs.core._nth.call(null, coll, n)
  }else {
    return not_found
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__5489 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.EMPTY, this__5489.meta)
};
cljs.core.PersistentVector;
cljs.core.PersistentVector.EMPTY_NODE = cljs.core.pv_fresh_node.call(null, null);
cljs.core.PersistentVector.EMPTY = new cljs.core.PersistentVector(null, 0, 5, cljs.core.PersistentVector.EMPTY_NODE, [], 0);
cljs.core.PersistentVector.fromArray = function(xs) {
  var xs__5501 = cljs.core.seq.call(null, xs);
  var out__5502 = cljs.core.transient$.call(null, cljs.core.PersistentVector.EMPTY);
  while(true) {
    if(cljs.core.truth_(xs__5501)) {
      var G__5503 = cljs.core.next.call(null, xs__5501);
      var G__5504 = cljs.core.conj_BANG_.call(null, out__5502, cljs.core.first.call(null, xs__5501));
      xs__5501 = G__5503;
      out__5502 = G__5504;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, out__5502)
    }
    break
  }
};
cljs.core.vec = function vec(coll) {
  return cljs.core.reduce.call(null, cljs.core.conj, cljs.core.PersistentVector.EMPTY, coll)
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
  vector.cljs$lang$applyTo = function(arglist__5505) {
    var args = cljs.core.seq(arglist__5505);
    return vector__delegate(args)
  };
  vector.cljs$lang$arity$variadic = vector__delegate;
  return vector
}();
cljs.core.Subvec = function(meta, v, start, end, __hash) {
  this.meta = meta;
  this.v = v;
  this.start = start;
  this.end = end;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 16200095
};
cljs.core.Subvec.cljs$lang$type = true;
cljs.core.Subvec.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.Subvec")
};
cljs.core.Subvec.prototype.cljs$core$IHash$ = true;
cljs.core.Subvec.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__5510 = this;
  var h__364__auto____5511 = this__5510.__hash;
  if(h__364__auto____5511 != null) {
    return h__364__auto____5511
  }else {
    var h__364__auto____5512 = cljs.core.hash_coll.call(null, coll);
    this__5510.__hash = h__364__auto____5512;
    return h__364__auto____5512
  }
};
cljs.core.Subvec.prototype.cljs$core$ILookup$ = true;
cljs.core.Subvec.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__5513 = this;
  return cljs.core._nth.call(null, coll, k, null)
};
cljs.core.Subvec.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__5514 = this;
  return cljs.core._nth.call(null, coll, k, not_found)
};
cljs.core.Subvec.prototype.cljs$core$IAssociative$ = true;
cljs.core.Subvec.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, key, val) {
  var this__5515 = this;
  var v_pos__5516 = this__5515.start + key;
  return new cljs.core.Subvec(this__5515.meta, cljs.core._assoc.call(null, this__5515.v, v_pos__5516, val), this__5515.start, this__5515.end > v_pos__5516 + 1 ? this__5515.end : v_pos__5516 + 1, null)
};
cljs.core.Subvec.prototype.cljs$core$IFn$ = true;
cljs.core.Subvec.prototype.call = function() {
  var G__5540 = null;
  var G__5540__2 = function(tsym5508, k) {
    var this__5517 = this;
    var tsym5508__5518 = this;
    var coll__5519 = tsym5508__5518;
    return cljs.core._lookup.call(null, coll__5519, k)
  };
  var G__5540__3 = function(tsym5509, k, not_found) {
    var this__5520 = this;
    var tsym5509__5521 = this;
    var coll__5522 = tsym5509__5521;
    return cljs.core._lookup.call(null, coll__5522, k, not_found)
  };
  G__5540 = function(tsym5509, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__5540__2.call(this, tsym5509, k);
      case 3:
        return G__5540__3.call(this, tsym5509, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__5540
}();
cljs.core.Subvec.prototype.apply = function(tsym5506, args5507) {
  return tsym5506.call.apply(tsym5506, [tsym5506].concat(cljs.core.aclone.call(null, args5507)))
};
cljs.core.Subvec.prototype.cljs$core$ISequential$ = true;
cljs.core.Subvec.prototype.cljs$core$ICollection$ = true;
cljs.core.Subvec.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__5523 = this;
  return new cljs.core.Subvec(this__5523.meta, cljs.core._assoc_n.call(null, this__5523.v, this__5523.end, o), this__5523.start, this__5523.end + 1, null)
};
cljs.core.Subvec.prototype.toString = function() {
  var this__5524 = this;
  var this$__5525 = this;
  return cljs.core.pr_str.call(null, this$__5525)
};
cljs.core.Subvec.prototype.cljs$core$IReduce$ = true;
cljs.core.Subvec.prototype.cljs$core$IReduce$_reduce$arity$2 = function(coll, f) {
  var this__5526 = this;
  return cljs.core.ci_reduce.call(null, coll, f)
};
cljs.core.Subvec.prototype.cljs$core$IReduce$_reduce$arity$3 = function(coll, f, start) {
  var this__5527 = this;
  return cljs.core.ci_reduce.call(null, coll, f, start)
};
cljs.core.Subvec.prototype.cljs$core$ISeqable$ = true;
cljs.core.Subvec.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__5528 = this;
  var subvec_seq__5529 = function subvec_seq(i) {
    if(i === this__5528.end) {
      return null
    }else {
      return cljs.core.cons.call(null, cljs.core._nth.call(null, this__5528.v, i), new cljs.core.LazySeq(null, false, function() {
        return subvec_seq.call(null, i + 1)
      }))
    }
  };
  return subvec_seq__5529.call(null, this__5528.start)
};
cljs.core.Subvec.prototype.cljs$core$ICounted$ = true;
cljs.core.Subvec.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__5530 = this;
  return this__5530.end - this__5530.start
};
cljs.core.Subvec.prototype.cljs$core$IStack$ = true;
cljs.core.Subvec.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__5531 = this;
  return cljs.core._nth.call(null, this__5531.v, this__5531.end - 1)
};
cljs.core.Subvec.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__5532 = this;
  if(this__5532.start === this__5532.end) {
    throw new Error("Can't pop empty vector");
  }else {
    return new cljs.core.Subvec(this__5532.meta, this__5532.v, this__5532.start, this__5532.end - 1, null)
  }
};
cljs.core.Subvec.prototype.cljs$core$IVector$ = true;
cljs.core.Subvec.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(coll, n, val) {
  var this__5533 = this;
  return cljs.core._assoc.call(null, coll, n, val)
};
cljs.core.Subvec.prototype.cljs$core$IEquiv$ = true;
cljs.core.Subvec.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__5534 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Subvec.prototype.cljs$core$IWithMeta$ = true;
cljs.core.Subvec.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__5535 = this;
  return new cljs.core.Subvec(meta, this__5535.v, this__5535.start, this__5535.end, this__5535.__hash)
};
cljs.core.Subvec.prototype.cljs$core$IMeta$ = true;
cljs.core.Subvec.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__5536 = this;
  return this__5536.meta
};
cljs.core.Subvec.prototype.cljs$core$IIndexed$ = true;
cljs.core.Subvec.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__5538 = this;
  return cljs.core._nth.call(null, this__5538.v, this__5538.start + n)
};
cljs.core.Subvec.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__5539 = this;
  return cljs.core._nth.call(null, this__5539.v, this__5539.start + n, not_found)
};
cljs.core.Subvec.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.Subvec.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__5537 = this;
  return cljs.core.with_meta.call(null, cljs.core.Vector.EMPTY, this__5537.meta)
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
    return new cljs.core.VectorNode(edit, cljs.core.aclone.call(null, node.arr))
  }
};
cljs.core.tv_editable_root = function tv_editable_root(node) {
  return new cljs.core.VectorNode({}, cljs.core.aclone.call(null, node.arr))
};
cljs.core.tv_editable_tail = function tv_editable_tail(tl) {
  var ret__5541 = cljs.core.make_array.call(null, 32);
  cljs.core.array_copy.call(null, tl, 0, ret__5541, 0, tl.length);
  return ret__5541
};
cljs.core.tv_push_tail = function tv_push_tail(tv, level, parent, tail_node) {
  var ret__5542 = cljs.core.tv_ensure_editable.call(null, tv.root.edit, parent);
  var subidx__5543 = tv.cnt - 1 >>> level & 31;
  cljs.core.pv_aset.call(null, ret__5542, subidx__5543, level === 5 ? tail_node : function() {
    var child__5544 = cljs.core.pv_aget.call(null, ret__5542, subidx__5543);
    if(child__5544 != null) {
      return tv_push_tail.call(null, tv, level - 5, child__5544, tail_node)
    }else {
      return cljs.core.new_path.call(null, tv.root.edit, level - 5, tail_node)
    }
  }());
  return ret__5542
};
cljs.core.tv_pop_tail = function tv_pop_tail(tv, level, node) {
  var node__5545 = cljs.core.tv_ensure_editable.call(null, tv.root.edit, node);
  var subidx__5546 = tv.cnt - 2 >>> level & 31;
  if(level > 5) {
    var new_child__5547 = tv_pop_tail.call(null, tv, level - 5, cljs.core.pv_aget.call(null, node__5545, subidx__5546));
    if(function() {
      var and__3822__auto____5548 = new_child__5547 == null;
      if(and__3822__auto____5548) {
        return subidx__5546 === 0
      }else {
        return and__3822__auto____5548
      }
    }()) {
      return null
    }else {
      cljs.core.pv_aset.call(null, node__5545, subidx__5546, new_child__5547);
      return node__5545
    }
  }else {
    if(subidx__5546 === 0) {
      return null
    }else {
      if("\ufdd0'else") {
        cljs.core.pv_aset.call(null, node__5545, subidx__5546, null);
        return node__5545
      }else {
        return null
      }
    }
  }
};
cljs.core.editable_array_for = function editable_array_for(tv, i) {
  if(function() {
    var and__3822__auto____5549 = 0 <= i;
    if(and__3822__auto____5549) {
      return i < tv.cnt
    }else {
      return and__3822__auto____5549
    }
  }()) {
    if(i >= cljs.core.tail_off.call(null, tv)) {
      return tv.tail
    }else {
      var root__5550 = tv.root;
      var node__5551 = root__5550;
      var level__5552 = tv.shift;
      while(true) {
        if(level__5552 > 0) {
          var G__5553 = cljs.core.tv_ensure_editable.call(null, root__5550.edit, cljs.core.pv_aget.call(null, node__5551, i >>> level__5552 & 31));
          var G__5554 = level__5552 - 5;
          node__5551 = G__5553;
          level__5552 = G__5554;
          continue
        }else {
          return node__5551.arr
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
  this.cljs$lang$protocol_mask$partition0$ = 147;
  this.cljs$lang$protocol_mask$partition1$ = 11
};
cljs.core.TransientVector.cljs$lang$type = true;
cljs.core.TransientVector.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.TransientVector")
};
cljs.core.TransientVector.prototype.cljs$core$IFn$ = true;
cljs.core.TransientVector.prototype.call = function() {
  var G__5592 = null;
  var G__5592__2 = function(tsym5557, k) {
    var this__5559 = this;
    var tsym5557__5560 = this;
    var coll__5561 = tsym5557__5560;
    return cljs.core._lookup.call(null, coll__5561, k)
  };
  var G__5592__3 = function(tsym5558, k, not_found) {
    var this__5562 = this;
    var tsym5558__5563 = this;
    var coll__5564 = tsym5558__5563;
    return cljs.core._lookup.call(null, coll__5564, k, not_found)
  };
  G__5592 = function(tsym5558, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__5592__2.call(this, tsym5558, k);
      case 3:
        return G__5592__3.call(this, tsym5558, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__5592
}();
cljs.core.TransientVector.prototype.apply = function(tsym5555, args5556) {
  return tsym5555.call.apply(tsym5555, [tsym5555].concat(cljs.core.aclone.call(null, args5556)))
};
cljs.core.TransientVector.prototype.cljs$core$ILookup$ = true;
cljs.core.TransientVector.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__5565 = this;
  return cljs.core._nth.call(null, coll, k, null)
};
cljs.core.TransientVector.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__5566 = this;
  return cljs.core._nth.call(null, coll, k, not_found)
};
cljs.core.TransientVector.prototype.cljs$core$IIndexed$ = true;
cljs.core.TransientVector.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__5567 = this;
  if(cljs.core.truth_(this__5567.root.edit)) {
    return cljs.core.array_for.call(null, coll, n)[n & 31]
  }else {
    throw new Error("nth after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__5568 = this;
  if(function() {
    var and__3822__auto____5569 = 0 <= n;
    if(and__3822__auto____5569) {
      return n < this__5568.cnt
    }else {
      return and__3822__auto____5569
    }
  }()) {
    return cljs.core._nth.call(null, coll, n)
  }else {
    return not_found
  }
};
cljs.core.TransientVector.prototype.cljs$core$ICounted$ = true;
cljs.core.TransientVector.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__5570 = this;
  if(cljs.core.truth_(this__5570.root.edit)) {
    return this__5570.cnt
  }else {
    throw new Error("count after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientVector$ = true;
cljs.core.TransientVector.prototype.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3 = function(tcoll, n, val) {
  var this__5571 = this;
  if(cljs.core.truth_(this__5571.root.edit)) {
    if(function() {
      var and__3822__auto____5572 = 0 <= n;
      if(and__3822__auto____5572) {
        return n < this__5571.cnt
      }else {
        return and__3822__auto____5572
      }
    }()) {
      if(cljs.core.tail_off.call(null, tcoll) <= n) {
        this__5571.tail[n & 31] = val;
        return tcoll
      }else {
        var new_root__5575 = function go(level, node) {
          var node__5573 = cljs.core.tv_ensure_editable.call(null, this__5571.root.edit, node);
          if(level === 0) {
            cljs.core.pv_aset.call(null, node__5573, n & 31, val);
            return node__5573
          }else {
            var subidx__5574 = n >>> level & 31;
            cljs.core.pv_aset.call(null, node__5573, subidx__5574, go.call(null, level - 5, cljs.core.pv_aget.call(null, node__5573, subidx__5574)));
            return node__5573
          }
        }.call(null, this__5571.shift, this__5571.root);
        this__5571.root = new_root__5575;
        return tcoll
      }
    }else {
      if(n === this__5571.cnt) {
        return cljs.core._conj_BANG_.call(null, tcoll, val)
      }else {
        if("\ufdd0'else") {
          throw new Error([cljs.core.str("Index "), cljs.core.str(n), cljs.core.str(" out of bounds for TransientVector of length"), cljs.core.str(this__5571.cnt)].join(""));
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
  var this__5576 = this;
  if(cljs.core.truth_(this__5576.root.edit)) {
    if(this__5576.cnt === 0) {
      throw new Error("Can't pop empty vector");
    }else {
      if(1 === this__5576.cnt) {
        this__5576.cnt = 0;
        return tcoll
      }else {
        if((this__5576.cnt - 1 & 31) > 0) {
          this__5576.cnt = this__5576.cnt - 1;
          return tcoll
        }else {
          if("\ufdd0'else") {
            var new_tail__5577 = cljs.core.editable_array_for.call(null, tcoll, this__5576.cnt - 2);
            var new_root__5579 = function() {
              var nr__5578 = cljs.core.tv_pop_tail.call(null, tcoll, this__5576.shift, this__5576.root);
              if(nr__5578 != null) {
                return nr__5578
              }else {
                return new cljs.core.VectorNode(this__5576.root.edit, cljs.core.make_array.call(null, 32))
              }
            }();
            if(function() {
              var and__3822__auto____5580 = 5 < this__5576.shift;
              if(and__3822__auto____5580) {
                return cljs.core.pv_aget.call(null, new_root__5579, 1) == null
              }else {
                return and__3822__auto____5580
              }
            }()) {
              var new_root__5581 = cljs.core.tv_ensure_editable.call(null, this__5576.root.edit, cljs.core.pv_aget.call(null, new_root__5579, 0));
              this__5576.root = new_root__5581;
              this__5576.shift = this__5576.shift - 5;
              this__5576.cnt = this__5576.cnt - 1;
              this__5576.tail = new_tail__5577;
              return tcoll
            }else {
              this__5576.root = new_root__5579;
              this__5576.cnt = this__5576.cnt - 1;
              this__5576.tail = new_tail__5577;
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
cljs.core.TransientVector.prototype.cljs$core$ITransientAssociative$ = true;
cljs.core.TransientVector.prototype.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3 = function(tcoll, key, val) {
  var this__5582 = this;
  return cljs.core._assoc_n_BANG_.call(null, tcoll, key, val)
};
cljs.core.TransientVector.prototype.cljs$core$ITransientCollection$ = true;
cljs.core.TransientVector.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, o) {
  var this__5583 = this;
  if(cljs.core.truth_(this__5583.root.edit)) {
    if(this__5583.cnt - cljs.core.tail_off.call(null, tcoll) < 32) {
      this__5583.tail[this__5583.cnt & 31] = o;
      this__5583.cnt = this__5583.cnt + 1;
      return tcoll
    }else {
      var tail_node__5584 = new cljs.core.VectorNode(this__5583.root.edit, this__5583.tail);
      var new_tail__5585 = cljs.core.make_array.call(null, 32);
      new_tail__5585[0] = o;
      this__5583.tail = new_tail__5585;
      if(this__5583.cnt >>> 5 > 1 << this__5583.shift) {
        var new_root_array__5586 = cljs.core.make_array.call(null, 32);
        var new_shift__5587 = this__5583.shift + 5;
        new_root_array__5586[0] = this__5583.root;
        new_root_array__5586[1] = cljs.core.new_path.call(null, this__5583.root.edit, this__5583.shift, tail_node__5584);
        this__5583.root = new cljs.core.VectorNode(this__5583.root.edit, new_root_array__5586);
        this__5583.shift = new_shift__5587;
        this__5583.cnt = this__5583.cnt + 1;
        return tcoll
      }else {
        var new_root__5588 = cljs.core.tv_push_tail.call(null, tcoll, this__5583.shift, this__5583.root, tail_node__5584);
        this__5583.root = new_root__5588;
        this__5583.cnt = this__5583.cnt + 1;
        return tcoll
      }
    }
  }else {
    throw new Error("conj! after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__5589 = this;
  if(cljs.core.truth_(this__5589.root.edit)) {
    this__5589.root.edit = null;
    var len__5590 = this__5589.cnt - cljs.core.tail_off.call(null, tcoll);
    var trimmed_tail__5591 = cljs.core.make_array.call(null, len__5590);
    cljs.core.array_copy.call(null, this__5589.tail, 0, trimmed_tail__5591, 0, len__5590);
    return new cljs.core.PersistentVector(null, this__5589.cnt, this__5589.shift, this__5589.root, trimmed_tail__5591, null)
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
  this.cljs$lang$protocol_mask$partition0$ = 15925324
};
cljs.core.PersistentQueueSeq.cljs$lang$type = true;
cljs.core.PersistentQueueSeq.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.PersistentQueueSeq")
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IHash$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__5593 = this;
  var h__364__auto____5594 = this__5593.__hash;
  if(h__364__auto____5594 != null) {
    return h__364__auto____5594
  }else {
    var h__364__auto____5595 = cljs.core.hash_coll.call(null, coll);
    this__5593.__hash = h__364__auto____5595;
    return h__364__auto____5595
  }
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISequential$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$ICollection$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__5596 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.PersistentQueueSeq.prototype.toString = function() {
  var this__5597 = this;
  var this$__5598 = this;
  return cljs.core.pr_str.call(null, this$__5598)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeqable$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__5599 = this;
  return coll
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeq$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__5600 = this;
  return cljs.core._first.call(null, this__5600.front)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__5601 = this;
  var temp__3971__auto____5602 = cljs.core.next.call(null, this__5601.front);
  if(cljs.core.truth_(temp__3971__auto____5602)) {
    var f1__5603 = temp__3971__auto____5602;
    return new cljs.core.PersistentQueueSeq(this__5601.meta, f1__5603, this__5601.rear, null)
  }else {
    if(this__5601.rear == null) {
      return cljs.core._empty.call(null, coll)
    }else {
      return new cljs.core.PersistentQueueSeq(this__5601.meta, this__5601.rear, null, null)
    }
  }
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEquiv$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__5604 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IWithMeta$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__5605 = this;
  return new cljs.core.PersistentQueueSeq(meta, this__5605.front, this__5605.rear, this__5605.__hash)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IMeta$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__5606 = this;
  return this__5606.meta
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__5607 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__5607.meta)
};
cljs.core.PersistentQueueSeq;
cljs.core.PersistentQueue = function(meta, count, front, rear, __hash) {
  this.meta = meta;
  this.count = count;
  this.front = front;
  this.rear = rear;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 15929422
};
cljs.core.PersistentQueue.cljs$lang$type = true;
cljs.core.PersistentQueue.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.PersistentQueue")
};
cljs.core.PersistentQueue.prototype.cljs$core$IHash$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__5608 = this;
  var h__364__auto____5609 = this__5608.__hash;
  if(h__364__auto____5609 != null) {
    return h__364__auto____5609
  }else {
    var h__364__auto____5610 = cljs.core.hash_coll.call(null, coll);
    this__5608.__hash = h__364__auto____5610;
    return h__364__auto____5610
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ISequential$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$ICollection$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__5611 = this;
  if(cljs.core.truth_(this__5611.front)) {
    return new cljs.core.PersistentQueue(this__5611.meta, this__5611.count + 1, this__5611.front, cljs.core.conj.call(null, function() {
      var or__3824__auto____5612 = this__5611.rear;
      if(cljs.core.truth_(or__3824__auto____5612)) {
        return or__3824__auto____5612
      }else {
        return cljs.core.PersistentVector.fromArray([])
      }
    }(), o), null)
  }else {
    return new cljs.core.PersistentQueue(this__5611.meta, this__5611.count + 1, cljs.core.conj.call(null, this__5611.front, o), cljs.core.PersistentVector.fromArray([]), null)
  }
};
cljs.core.PersistentQueue.prototype.toString = function() {
  var this__5613 = this;
  var this$__5614 = this;
  return cljs.core.pr_str.call(null, this$__5614)
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeqable$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__5615 = this;
  var rear__5616 = cljs.core.seq.call(null, this__5615.rear);
  if(cljs.core.truth_(function() {
    var or__3824__auto____5617 = this__5615.front;
    if(cljs.core.truth_(or__3824__auto____5617)) {
      return or__3824__auto____5617
    }else {
      return rear__5616
    }
  }())) {
    return new cljs.core.PersistentQueueSeq(null, this__5615.front, cljs.core.seq.call(null, rear__5616), null, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ICounted$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__5618 = this;
  return this__5618.count
};
cljs.core.PersistentQueue.prototype.cljs$core$IStack$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__5619 = this;
  return cljs.core._first.call(null, this__5619.front)
};
cljs.core.PersistentQueue.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__5620 = this;
  if(cljs.core.truth_(this__5620.front)) {
    var temp__3971__auto____5621 = cljs.core.next.call(null, this__5620.front);
    if(cljs.core.truth_(temp__3971__auto____5621)) {
      var f1__5622 = temp__3971__auto____5621;
      return new cljs.core.PersistentQueue(this__5620.meta, this__5620.count - 1, f1__5622, this__5620.rear, null)
    }else {
      return new cljs.core.PersistentQueue(this__5620.meta, this__5620.count - 1, cljs.core.seq.call(null, this__5620.rear), cljs.core.PersistentVector.fromArray([]), null)
    }
  }else {
    return coll
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeq$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__5623 = this;
  return cljs.core.first.call(null, this__5623.front)
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__5624 = this;
  return cljs.core.rest.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.PersistentQueue.prototype.cljs$core$IEquiv$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__5625 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentQueue.prototype.cljs$core$IWithMeta$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__5626 = this;
  return new cljs.core.PersistentQueue(meta, this__5626.count, this__5626.front, this__5626.rear, this__5626.__hash)
};
cljs.core.PersistentQueue.prototype.cljs$core$IMeta$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__5627 = this;
  return this__5627.meta
};
cljs.core.PersistentQueue.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__5628 = this;
  return cljs.core.PersistentQueue.EMPTY
};
cljs.core.PersistentQueue;
cljs.core.PersistentQueue.EMPTY = new cljs.core.PersistentQueue(null, 0, null, cljs.core.PersistentVector.fromArray([]), 0);
cljs.core.NeverEquiv = function() {
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 1048576
};
cljs.core.NeverEquiv.cljs$lang$type = true;
cljs.core.NeverEquiv.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.NeverEquiv")
};
cljs.core.NeverEquiv.prototype.cljs$core$IEquiv$ = true;
cljs.core.NeverEquiv.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(o, other) {
  var this__5629 = this;
  return false
};
cljs.core.NeverEquiv;
cljs.core.never_equiv = new cljs.core.NeverEquiv;
cljs.core.equiv_map = function equiv_map(x, y) {
  return cljs.core.boolean$.call(null, cljs.core.map_QMARK_.call(null, y) ? cljs.core.count.call(null, x) === cljs.core.count.call(null, y) ? cljs.core.every_QMARK_.call(null, cljs.core.identity, cljs.core.map.call(null, function(xkv) {
    return cljs.core._EQ_.call(null, cljs.core.get.call(null, y, cljs.core.first.call(null, xkv), cljs.core.never_equiv), cljs.core.second.call(null, xkv))
  }, x)) : null : null)
};
cljs.core.scan_array = function scan_array(incr, k, array) {
  var len__5630 = array.length;
  var i__5631 = 0;
  while(true) {
    if(i__5631 < len__5630) {
      if(cljs.core._EQ_.call(null, k, array[i__5631])) {
        return i__5631
      }else {
        var G__5632 = i__5631 + incr;
        i__5631 = G__5632;
        continue
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.obj_map_contains_key_QMARK_ = function() {
  var obj_map_contains_key_QMARK_ = null;
  var obj_map_contains_key_QMARK___2 = function(k, strobj) {
    return obj_map_contains_key_QMARK_.call(null, k, strobj, true, false)
  };
  var obj_map_contains_key_QMARK___4 = function(k, strobj, true_val, false_val) {
    if(cljs.core.truth_(function() {
      var and__3822__auto____5633 = goog.isString.call(null, k);
      if(cljs.core.truth_(and__3822__auto____5633)) {
        return strobj.hasOwnProperty(k)
      }else {
        return and__3822__auto____5633
      }
    }())) {
      return true_val
    }else {
      return false_val
    }
  };
  obj_map_contains_key_QMARK_ = function(k, strobj, true_val, false_val) {
    switch(arguments.length) {
      case 2:
        return obj_map_contains_key_QMARK___2.call(this, k, strobj);
      case 4:
        return obj_map_contains_key_QMARK___4.call(this, k, strobj, true_val, false_val)
    }
    throw"Invalid arity: " + arguments.length;
  };
  obj_map_contains_key_QMARK_.cljs$lang$arity$2 = obj_map_contains_key_QMARK___2;
  obj_map_contains_key_QMARK_.cljs$lang$arity$4 = obj_map_contains_key_QMARK___4;
  return obj_map_contains_key_QMARK_
}();
cljs.core.obj_map_compare_keys = function obj_map_compare_keys(a, b) {
  var a__5634 = cljs.core.hash.call(null, a);
  var b__5635 = cljs.core.hash.call(null, b);
  if(a__5634 < b__5635) {
    return-1
  }else {
    if(a__5634 > b__5635) {
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
  var ks__5637 = m.keys;
  var len__5638 = ks__5637.length;
  var so__5639 = m.strobj;
  var out__5640 = cljs.core.with_meta.call(null, cljs.core.PersistentHashMap.EMPTY, cljs.core.meta.call(null, m));
  var i__5641 = 0;
  var out__5642 = cljs.core.transient$.call(null, out__5640);
  while(true) {
    if(i__5641 < len__5638) {
      var k__5643 = ks__5637[i__5641];
      var G__5644 = i__5641 + 1;
      var G__5645 = cljs.core.assoc_BANG_.call(null, out__5642, k__5643, so__5639[k__5643]);
      i__5641 = G__5644;
      out__5642 = G__5645;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, cljs.core.assoc_BANG_.call(null, out__5642, k, v))
    }
    break
  }
};
cljs.core.ObjMap = function(meta, keys, strobj, update_count, __hash) {
  this.meta = meta;
  this.keys = keys;
  this.strobj = strobj;
  this.update_count = update_count;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 2155021199
};
cljs.core.ObjMap.cljs$lang$type = true;
cljs.core.ObjMap.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.ObjMap")
};
cljs.core.ObjMap.prototype.cljs$core$IEditableCollection$ = true;
cljs.core.ObjMap.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var this__5650 = this;
  return cljs.core.transient$.call(null, cljs.core.into.call(null, cljs.core.hash_map.call(null), coll))
};
cljs.core.ObjMap.prototype.cljs$core$IHash$ = true;
cljs.core.ObjMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__5651 = this;
  var h__364__auto____5652 = this__5651.__hash;
  if(h__364__auto____5652 != null) {
    return h__364__auto____5652
  }else {
    var h__364__auto____5653 = cljs.core.hash_imap.call(null, coll);
    this__5651.__hash = h__364__auto____5653;
    return h__364__auto____5653
  }
};
cljs.core.ObjMap.prototype.cljs$core$ILookup$ = true;
cljs.core.ObjMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__5654 = this;
  return cljs.core._lookup.call(null, coll, k, null)
};
cljs.core.ObjMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__5655 = this;
  return cljs.core.obj_map_contains_key_QMARK_.call(null, k, this__5655.strobj, this__5655.strobj[k], not_found)
};
cljs.core.ObjMap.prototype.cljs$core$IAssociative$ = true;
cljs.core.ObjMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__5656 = this;
  if(cljs.core.truth_(goog.isString.call(null, k))) {
    var overwrite_QMARK___5657 = this__5656.strobj.hasOwnProperty(k);
    if(cljs.core.truth_(overwrite_QMARK___5657)) {
      var new_strobj__5658 = goog.object.clone.call(null, this__5656.strobj);
      new_strobj__5658[k] = v;
      return new cljs.core.ObjMap(this__5656.meta, this__5656.keys, new_strobj__5658, this__5656.update_count + 1, null)
    }else {
      if(this__5656.update_count < cljs.core.ObjMap.HASHMAP_THRESHOLD) {
        var new_strobj__5659 = goog.object.clone.call(null, this__5656.strobj);
        var new_keys__5660 = cljs.core.aclone.call(null, this__5656.keys);
        new_strobj__5659[k] = v;
        new_keys__5660.push(k);
        return new cljs.core.ObjMap(this__5656.meta, new_keys__5660, new_strobj__5659, this__5656.update_count + 1, null)
      }else {
        return cljs.core.obj_map__GT_hash_map.call(null, coll, k, v)
      }
    }
  }else {
    return cljs.core.obj_map__GT_hash_map.call(null, coll, k, v)
  }
};
cljs.core.ObjMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__5661 = this;
  return cljs.core.obj_map_contains_key_QMARK_.call(null, k, this__5661.strobj)
};
cljs.core.ObjMap.prototype.cljs$core$IFn$ = true;
cljs.core.ObjMap.prototype.call = function() {
  var G__5681 = null;
  var G__5681__2 = function(tsym5648, k) {
    var this__5662 = this;
    var tsym5648__5663 = this;
    var coll__5664 = tsym5648__5663;
    return cljs.core._lookup.call(null, coll__5664, k)
  };
  var G__5681__3 = function(tsym5649, k, not_found) {
    var this__5665 = this;
    var tsym5649__5666 = this;
    var coll__5667 = tsym5649__5666;
    return cljs.core._lookup.call(null, coll__5667, k, not_found)
  };
  G__5681 = function(tsym5649, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__5681__2.call(this, tsym5649, k);
      case 3:
        return G__5681__3.call(this, tsym5649, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__5681
}();
cljs.core.ObjMap.prototype.apply = function(tsym5646, args5647) {
  return tsym5646.call.apply(tsym5646, [tsym5646].concat(cljs.core.aclone.call(null, args5647)))
};
cljs.core.ObjMap.prototype.cljs$core$ICollection$ = true;
cljs.core.ObjMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__5668 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return cljs.core._assoc.call(null, coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.ObjMap.prototype.toString = function() {
  var this__5669 = this;
  var this$__5670 = this;
  return cljs.core.pr_str.call(null, this$__5670)
};
cljs.core.ObjMap.prototype.cljs$core$ISeqable$ = true;
cljs.core.ObjMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__5671 = this;
  if(this__5671.keys.length > 0) {
    return cljs.core.map.call(null, function(p1__5636_SHARP_) {
      return cljs.core.vector.call(null, p1__5636_SHARP_, this__5671.strobj[p1__5636_SHARP_])
    }, this__5671.keys.sort(cljs.core.obj_map_compare_keys))
  }else {
    return null
  }
};
cljs.core.ObjMap.prototype.cljs$core$ICounted$ = true;
cljs.core.ObjMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__5672 = this;
  return this__5672.keys.length
};
cljs.core.ObjMap.prototype.cljs$core$IEquiv$ = true;
cljs.core.ObjMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__5673 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.ObjMap.prototype.cljs$core$IWithMeta$ = true;
cljs.core.ObjMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__5674 = this;
  return new cljs.core.ObjMap(meta, this__5674.keys, this__5674.strobj, this__5674.update_count, this__5674.__hash)
};
cljs.core.ObjMap.prototype.cljs$core$IMeta$ = true;
cljs.core.ObjMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__5675 = this;
  return this__5675.meta
};
cljs.core.ObjMap.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.ObjMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__5676 = this;
  return cljs.core.with_meta.call(null, cljs.core.ObjMap.EMPTY, this__5676.meta)
};
cljs.core.ObjMap.prototype.cljs$core$IMap$ = true;
cljs.core.ObjMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__5677 = this;
  if(cljs.core.truth_(function() {
    var and__3822__auto____5678 = goog.isString.call(null, k);
    if(cljs.core.truth_(and__3822__auto____5678)) {
      return this__5677.strobj.hasOwnProperty(k)
    }else {
      return and__3822__auto____5678
    }
  }())) {
    var new_keys__5679 = cljs.core.aclone.call(null, this__5677.keys);
    var new_strobj__5680 = goog.object.clone.call(null, this__5677.strobj);
    new_keys__5679.splice(cljs.core.scan_array.call(null, 1, k, new_keys__5679), 1);
    cljs.core.js_delete.call(null, new_strobj__5680, k);
    return new cljs.core.ObjMap(this__5677.meta, new_keys__5679, new_strobj__5680, this__5677.update_count + 1, null)
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
  this.cljs$lang$protocol_mask$partition0$ = 7537551
};
cljs.core.HashMap.cljs$lang$type = true;
cljs.core.HashMap.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.HashMap")
};
cljs.core.HashMap.prototype.cljs$core$IHash$ = true;
cljs.core.HashMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__5687 = this;
  var h__364__auto____5688 = this__5687.__hash;
  if(h__364__auto____5688 != null) {
    return h__364__auto____5688
  }else {
    var h__364__auto____5689 = cljs.core.hash_imap.call(null, coll);
    this__5687.__hash = h__364__auto____5689;
    return h__364__auto____5689
  }
};
cljs.core.HashMap.prototype.cljs$core$ILookup$ = true;
cljs.core.HashMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__5690 = this;
  return cljs.core._lookup.call(null, coll, k, null)
};
cljs.core.HashMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__5691 = this;
  var bucket__5692 = this__5691.hashobj[cljs.core.hash.call(null, k)];
  var i__5693 = cljs.core.truth_(bucket__5692) ? cljs.core.scan_array.call(null, 2, k, bucket__5692) : null;
  if(cljs.core.truth_(i__5693)) {
    return bucket__5692[i__5693 + 1]
  }else {
    return not_found
  }
};
cljs.core.HashMap.prototype.cljs$core$IAssociative$ = true;
cljs.core.HashMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__5694 = this;
  var h__5695 = cljs.core.hash.call(null, k);
  var bucket__5696 = this__5694.hashobj[h__5695];
  if(cljs.core.truth_(bucket__5696)) {
    var new_bucket__5697 = cljs.core.aclone.call(null, bucket__5696);
    var new_hashobj__5698 = goog.object.clone.call(null, this__5694.hashobj);
    new_hashobj__5698[h__5695] = new_bucket__5697;
    var temp__3971__auto____5699 = cljs.core.scan_array.call(null, 2, k, new_bucket__5697);
    if(cljs.core.truth_(temp__3971__auto____5699)) {
      var i__5700 = temp__3971__auto____5699;
      new_bucket__5697[i__5700 + 1] = v;
      return new cljs.core.HashMap(this__5694.meta, this__5694.count, new_hashobj__5698, null)
    }else {
      new_bucket__5697.push(k, v);
      return new cljs.core.HashMap(this__5694.meta, this__5694.count + 1, new_hashobj__5698, null)
    }
  }else {
    var new_hashobj__5701 = goog.object.clone.call(null, this__5694.hashobj);
    new_hashobj__5701[h__5695] = [k, v];
    return new cljs.core.HashMap(this__5694.meta, this__5694.count + 1, new_hashobj__5701, null)
  }
};
cljs.core.HashMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__5702 = this;
  var bucket__5703 = this__5702.hashobj[cljs.core.hash.call(null, k)];
  var i__5704 = cljs.core.truth_(bucket__5703) ? cljs.core.scan_array.call(null, 2, k, bucket__5703) : null;
  if(cljs.core.truth_(i__5704)) {
    return true
  }else {
    return false
  }
};
cljs.core.HashMap.prototype.cljs$core$IFn$ = true;
cljs.core.HashMap.prototype.call = function() {
  var G__5727 = null;
  var G__5727__2 = function(tsym5685, k) {
    var this__5705 = this;
    var tsym5685__5706 = this;
    var coll__5707 = tsym5685__5706;
    return cljs.core._lookup.call(null, coll__5707, k)
  };
  var G__5727__3 = function(tsym5686, k, not_found) {
    var this__5708 = this;
    var tsym5686__5709 = this;
    var coll__5710 = tsym5686__5709;
    return cljs.core._lookup.call(null, coll__5710, k, not_found)
  };
  G__5727 = function(tsym5686, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__5727__2.call(this, tsym5686, k);
      case 3:
        return G__5727__3.call(this, tsym5686, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__5727
}();
cljs.core.HashMap.prototype.apply = function(tsym5683, args5684) {
  return tsym5683.call.apply(tsym5683, [tsym5683].concat(cljs.core.aclone.call(null, args5684)))
};
cljs.core.HashMap.prototype.cljs$core$ICollection$ = true;
cljs.core.HashMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__5711 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return cljs.core._assoc.call(null, coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.HashMap.prototype.toString = function() {
  var this__5712 = this;
  var this$__5713 = this;
  return cljs.core.pr_str.call(null, this$__5713)
};
cljs.core.HashMap.prototype.cljs$core$ISeqable$ = true;
cljs.core.HashMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__5714 = this;
  if(this__5714.count > 0) {
    var hashes__5715 = cljs.core.js_keys.call(null, this__5714.hashobj).sort();
    return cljs.core.mapcat.call(null, function(p1__5682_SHARP_) {
      return cljs.core.map.call(null, cljs.core.vec, cljs.core.partition.call(null, 2, this__5714.hashobj[p1__5682_SHARP_]))
    }, hashes__5715)
  }else {
    return null
  }
};
cljs.core.HashMap.prototype.cljs$core$ICounted$ = true;
cljs.core.HashMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__5716 = this;
  return this__5716.count
};
cljs.core.HashMap.prototype.cljs$core$IEquiv$ = true;
cljs.core.HashMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__5717 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.HashMap.prototype.cljs$core$IWithMeta$ = true;
cljs.core.HashMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__5718 = this;
  return new cljs.core.HashMap(meta, this__5718.count, this__5718.hashobj, this__5718.__hash)
};
cljs.core.HashMap.prototype.cljs$core$IMeta$ = true;
cljs.core.HashMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__5719 = this;
  return this__5719.meta
};
cljs.core.HashMap.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.HashMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__5720 = this;
  return cljs.core.with_meta.call(null, cljs.core.HashMap.EMPTY, this__5720.meta)
};
cljs.core.HashMap.prototype.cljs$core$IMap$ = true;
cljs.core.HashMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__5721 = this;
  var h__5722 = cljs.core.hash.call(null, k);
  var bucket__5723 = this__5721.hashobj[h__5722];
  var i__5724 = cljs.core.truth_(bucket__5723) ? cljs.core.scan_array.call(null, 2, k, bucket__5723) : null;
  if(cljs.core.not.call(null, i__5724)) {
    return coll
  }else {
    var new_hashobj__5725 = goog.object.clone.call(null, this__5721.hashobj);
    if(3 > bucket__5723.length) {
      cljs.core.js_delete.call(null, new_hashobj__5725, h__5722)
    }else {
      var new_bucket__5726 = cljs.core.aclone.call(null, bucket__5723);
      new_bucket__5726.splice(i__5724, 2);
      new_hashobj__5725[h__5722] = new_bucket__5726
    }
    return new cljs.core.HashMap(this__5721.meta, this__5721.count - 1, new_hashobj__5725, null)
  }
};
cljs.core.HashMap;
cljs.core.HashMap.EMPTY = new cljs.core.HashMap(null, 0, {}, 0);
cljs.core.HashMap.fromArrays = function(ks, vs) {
  var len__5728 = ks.length;
  var i__5729 = 0;
  var out__5730 = cljs.core.HashMap.EMPTY;
  while(true) {
    if(i__5729 < len__5728) {
      var G__5731 = i__5729 + 1;
      var G__5732 = cljs.core.assoc.call(null, out__5730, ks[i__5729], vs[i__5729]);
      i__5729 = G__5731;
      out__5730 = G__5732;
      continue
    }else {
      return out__5730
    }
    break
  }
};
cljs.core.array_map_index_of = function array_map_index_of(m, k) {
  var arr__5733 = m.arr;
  var len__5734 = arr__5733.length;
  var i__5735 = 0;
  while(true) {
    if(len__5734 <= i__5735) {
      return-1
    }else {
      if(cljs.core._EQ_.call(null, arr__5733[i__5735], k)) {
        return i__5735
      }else {
        if("\ufdd0'else") {
          var G__5736 = i__5735 + 2;
          i__5735 = G__5736;
          continue
        }else {
          return null
        }
      }
    }
    break
  }
};
void 0;
cljs.core.PersistentArrayMap = function(meta, cnt, arr, __hash) {
  this.meta = meta;
  this.cnt = cnt;
  this.arr = arr;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 2155545487
};
cljs.core.PersistentArrayMap.cljs$lang$type = true;
cljs.core.PersistentArrayMap.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.PersistentArrayMap")
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IEditableCollection$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var this__5741 = this;
  return new cljs.core.TransientArrayMap({}, this__5741.arr.length, cljs.core.aclone.call(null, this__5741.arr))
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IHash$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__5742 = this;
  var h__364__auto____5743 = this__5742.__hash;
  if(h__364__auto____5743 != null) {
    return h__364__auto____5743
  }else {
    var h__364__auto____5744 = cljs.core.hash_imap.call(null, coll);
    this__5742.__hash = h__364__auto____5744;
    return h__364__auto____5744
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ILookup$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__5745 = this;
  return cljs.core._lookup.call(null, coll, k, null)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__5746 = this;
  var idx__5747 = cljs.core.array_map_index_of.call(null, coll, k);
  if(idx__5747 === -1) {
    return not_found
  }else {
    return this__5746.arr[idx__5747 + 1]
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IAssociative$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__5748 = this;
  var idx__5749 = cljs.core.array_map_index_of.call(null, coll, k);
  if(idx__5749 === -1) {
    if(this__5748.cnt < cljs.core.PersistentArrayMap.HASHMAP_THRESHOLD) {
      return new cljs.core.PersistentArrayMap(this__5748.meta, this__5748.cnt + 1, function() {
        var G__5750__5751 = cljs.core.aclone.call(null, this__5748.arr);
        G__5750__5751.push(k);
        G__5750__5751.push(v);
        return G__5750__5751
      }(), null)
    }else {
      return cljs.core.persistent_BANG_.call(null, cljs.core.assoc_BANG_.call(null, cljs.core.transient$.call(null, cljs.core.into.call(null, cljs.core.PersistentHashMap.EMPTY, coll)), k, v))
    }
  }else {
    if(v === this__5748.arr[idx__5749 + 1]) {
      return coll
    }else {
      if("\ufdd0'else") {
        return new cljs.core.PersistentArrayMap(this__5748.meta, this__5748.cnt, function() {
          var G__5752__5753 = cljs.core.aclone.call(null, this__5748.arr);
          G__5752__5753[idx__5749 + 1] = v;
          return G__5752__5753
        }(), null)
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__5754 = this;
  return cljs.core.array_map_index_of.call(null, coll, k) != -1
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IFn$ = true;
cljs.core.PersistentArrayMap.prototype.call = function() {
  var G__5784 = null;
  var G__5784__2 = function(tsym5739, k) {
    var this__5755 = this;
    var tsym5739__5756 = this;
    var coll__5757 = tsym5739__5756;
    return cljs.core._lookup.call(null, coll__5757, k)
  };
  var G__5784__3 = function(tsym5740, k, not_found) {
    var this__5758 = this;
    var tsym5740__5759 = this;
    var coll__5760 = tsym5740__5759;
    return cljs.core._lookup.call(null, coll__5760, k, not_found)
  };
  G__5784 = function(tsym5740, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__5784__2.call(this, tsym5740, k);
      case 3:
        return G__5784__3.call(this, tsym5740, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__5784
}();
cljs.core.PersistentArrayMap.prototype.apply = function(tsym5737, args5738) {
  return tsym5737.call.apply(tsym5737, [tsym5737].concat(cljs.core.aclone.call(null, args5738)))
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IKVReduce$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(coll, f, init) {
  var this__5761 = this;
  var len__5762 = this__5761.arr.length;
  var i__5763 = 0;
  var init__5764 = init;
  while(true) {
    if(i__5763 < len__5762) {
      var init__5765 = f.call(null, init__5764, this__5761.arr[i__5763], this__5761.arr[i__5763 + 1]);
      if(cljs.core.reduced_QMARK_.call(null, init__5765)) {
        return cljs.core.deref.call(null, init__5765)
      }else {
        var G__5785 = i__5763 + 2;
        var G__5786 = init__5765;
        i__5763 = G__5785;
        init__5764 = G__5786;
        continue
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ICollection$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__5766 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return cljs.core._assoc.call(null, coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.PersistentArrayMap.prototype.toString = function() {
  var this__5767 = this;
  var this$__5768 = this;
  return cljs.core.pr_str.call(null, this$__5768)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ISeqable$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__5769 = this;
  if(this__5769.cnt > 0) {
    var len__5770 = this__5769.arr.length;
    var array_map_seq__5771 = function array_map_seq(i) {
      return new cljs.core.LazySeq(null, false, function() {
        if(i < len__5770) {
          return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([this__5769.arr[i], this__5769.arr[i + 1]]), array_map_seq.call(null, i + 2))
        }else {
          return null
        }
      })
    };
    return array_map_seq__5771.call(null, 0)
  }else {
    return null
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ICounted$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__5772 = this;
  return this__5772.cnt
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IEquiv$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__5773 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IWithMeta$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__5774 = this;
  return new cljs.core.PersistentArrayMap(meta, this__5774.cnt, this__5774.arr, this__5774.__hash)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IMeta$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__5775 = this;
  return this__5775.meta
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__5776 = this;
  return cljs.core._with_meta.call(null, cljs.core.PersistentArrayMap.EMPTY, this__5776.meta)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IMap$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__5777 = this;
  var idx__5778 = cljs.core.array_map_index_of.call(null, coll, k);
  if(idx__5778 >= 0) {
    var len__5779 = this__5777.arr.length;
    var new_len__5780 = len__5779 - 2;
    if(new_len__5780 === 0) {
      return cljs.core._empty.call(null, coll)
    }else {
      var new_arr__5781 = cljs.core.make_array.call(null, new_len__5780);
      var s__5782 = 0;
      var d__5783 = 0;
      while(true) {
        if(s__5782 >= len__5779) {
          return new cljs.core.PersistentArrayMap(this__5777.meta, this__5777.cnt - 1, new_arr__5781, null)
        }else {
          if(cljs.core._EQ_.call(null, k, this__5777.arr[s__5782])) {
            var G__5787 = s__5782 + 2;
            var G__5788 = d__5783;
            s__5782 = G__5787;
            d__5783 = G__5788;
            continue
          }else {
            if("\ufdd0'else") {
              new_arr__5781[d__5783] = this__5777.arr[s__5782];
              new_arr__5781[d__5783 + 1] = this__5777.arr[s__5782 + 1];
              var G__5789 = s__5782 + 2;
              var G__5790 = d__5783 + 2;
              s__5782 = G__5789;
              d__5783 = G__5790;
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
  var len__5791 = cljs.core.count.call(null, ks);
  var i__5792 = 0;
  var out__5793 = cljs.core.transient$.call(null, cljs.core.PersistentArrayMap.EMPTY);
  while(true) {
    if(i__5792 < len__5791) {
      var G__5794 = i__5792 + 1;
      var G__5795 = cljs.core.assoc_BANG_.call(null, out__5793, ks[i__5792], vs[i__5792]);
      i__5792 = G__5794;
      out__5793 = G__5795;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, out__5793)
    }
    break
  }
};
void 0;
cljs.core.TransientArrayMap = function(editable_QMARK_, len, arr) {
  this.editable_QMARK_ = editable_QMARK_;
  this.len = len;
  this.arr = arr;
  this.cljs$lang$protocol_mask$partition1$ = 7;
  this.cljs$lang$protocol_mask$partition0$ = 130
};
cljs.core.TransientArrayMap.cljs$lang$type = true;
cljs.core.TransientArrayMap.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.TransientArrayMap")
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientMap$ = true;
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientMap$_dissoc_BANG_$arity$2 = function(tcoll, key) {
  var this__5796 = this;
  if(cljs.core.truth_(this__5796.editable_QMARK_)) {
    var idx__5797 = cljs.core.array_map_index_of.call(null, tcoll, key);
    if(idx__5797 >= 0) {
      this__5796.arr[idx__5797] = this__5796.arr[this__5796.len - 2];
      this__5796.arr[idx__5797 + 1] = this__5796.arr[this__5796.len - 1];
      var G__5798__5799 = this__5796.arr;
      G__5798__5799.pop();
      G__5798__5799.pop();
      G__5798__5799;
      this__5796.len = this__5796.len - 2
    }else {
    }
    return tcoll
  }else {
    throw new Error("dissoc! after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientAssociative$ = true;
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3 = function(tcoll, key, val) {
  var this__5800 = this;
  if(cljs.core.truth_(this__5800.editable_QMARK_)) {
    var idx__5801 = cljs.core.array_map_index_of.call(null, tcoll, key);
    if(idx__5801 === -1) {
      if(this__5800.len + 2 <= 2 * cljs.core.PersistentArrayMap.HASHMAP_THRESHOLD) {
        this__5800.len = this__5800.len + 2;
        this__5800.arr.push(key);
        this__5800.arr.push(val);
        return tcoll
      }else {
        return cljs.core.assoc_BANG_.call(null, cljs.core.array__GT_transient_hash_map.call(null, this__5800.len, this__5800.arr), key, val)
      }
    }else {
      if(val === this__5800.arr[idx__5801 + 1]) {
        return tcoll
      }else {
        this__5800.arr[idx__5801 + 1] = val;
        return tcoll
      }
    }
  }else {
    throw new Error("assoc! after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientCollection$ = true;
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, o) {
  var this__5802 = this;
  if(cljs.core.truth_(this__5802.editable_QMARK_)) {
    if(function() {
      var G__5803__5804 = o;
      if(G__5803__5804 != null) {
        if(function() {
          var or__3824__auto____5805 = G__5803__5804.cljs$lang$protocol_mask$partition0$ & 1024;
          if(or__3824__auto____5805) {
            return or__3824__auto____5805
          }else {
            return G__5803__5804.cljs$core$IMapEntry$
          }
        }()) {
          return true
        }else {
          if(!G__5803__5804.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__5803__5804)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__5803__5804)
      }
    }()) {
      return cljs.core._assoc_BANG_.call(null, tcoll, cljs.core.key.call(null, o), cljs.core.val.call(null, o))
    }else {
      var es__5806 = cljs.core.seq.call(null, o);
      var tcoll__5807 = tcoll;
      while(true) {
        var temp__3971__auto____5808 = cljs.core.first.call(null, es__5806);
        if(cljs.core.truth_(temp__3971__auto____5808)) {
          var e__5809 = temp__3971__auto____5808;
          var G__5815 = cljs.core.next.call(null, es__5806);
          var G__5816 = cljs.core._assoc_BANG_.call(null, tcoll__5807, cljs.core.key.call(null, e__5809), cljs.core.val.call(null, e__5809));
          es__5806 = G__5815;
          tcoll__5807 = G__5816;
          continue
        }else {
          return tcoll__5807
        }
        break
      }
    }
  }else {
    throw new Error("conj! after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__5810 = this;
  if(cljs.core.truth_(this__5810.editable_QMARK_)) {
    this__5810.editable_QMARK_ = false;
    return new cljs.core.PersistentArrayMap(null, cljs.core.quot.call(null, this__5810.len, 2), this__5810.arr, null)
  }else {
    throw new Error("persistent! called twice");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ILookup$ = true;
cljs.core.TransientArrayMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(tcoll, k) {
  var this__5811 = this;
  return cljs.core._lookup.call(null, tcoll, k, null)
};
cljs.core.TransientArrayMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(tcoll, k, not_found) {
  var this__5812 = this;
  if(cljs.core.truth_(this__5812.editable_QMARK_)) {
    var idx__5813 = cljs.core.array_map_index_of.call(null, tcoll, k);
    if(idx__5813 === -1) {
      return not_found
    }else {
      return this__5812.arr[idx__5813 + 1]
    }
  }else {
    throw new Error("lookup after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ICounted$ = true;
cljs.core.TransientArrayMap.prototype.cljs$core$ICounted$_count$arity$1 = function(tcoll) {
  var this__5814 = this;
  if(cljs.core.truth_(this__5814.editable_QMARK_)) {
    return cljs.core.quot.call(null, this__5814.len, 2)
  }else {
    throw new Error("count after persistent!");
  }
};
cljs.core.TransientArrayMap;
void 0;
cljs.core.array__GT_transient_hash_map = function array__GT_transient_hash_map(len, arr) {
  var out__5817 = cljs.core.transient$.call(null, cljs.core.ObjMap.fromObject([], {}));
  var i__5818 = 0;
  while(true) {
    if(i__5818 < len) {
      var G__5819 = cljs.core.assoc_BANG_.call(null, out__5817, arr[i__5818], arr[i__5818 + 1]);
      var G__5820 = i__5818 + 2;
      out__5817 = G__5819;
      i__5818 = G__5820;
      continue
    }else {
      return out__5817
    }
    break
  }
};
void 0;
void 0;
void 0;
void 0;
void 0;
void 0;
cljs.core.mask = function mask(hash, shift) {
  return hash >>> shift & 31
};
cljs.core.clone_and_set = function() {
  var clone_and_set = null;
  var clone_and_set__3 = function(arr, i, a) {
    var G__5821__5822 = cljs.core.aclone.call(null, arr);
    G__5821__5822[i] = a;
    return G__5821__5822
  };
  var clone_and_set__5 = function(arr, i, a, j, b) {
    var G__5823__5824 = cljs.core.aclone.call(null, arr);
    G__5823__5824[i] = a;
    G__5823__5824[j] = b;
    return G__5823__5824
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
  var new_arr__5825 = cljs.core.make_array.call(null, arr.length - 2);
  cljs.core.array_copy.call(null, arr, 0, new_arr__5825, 0, 2 * i);
  cljs.core.array_copy.call(null, arr, 2 * (i + 1), new_arr__5825, 2 * i, new_arr__5825.length - 2 * i);
  return new_arr__5825
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
    var editable__5826 = inode.ensure_editable(edit);
    editable__5826.arr[i] = a;
    return editable__5826
  };
  var edit_and_set__6 = function(inode, edit, i, a, j, b) {
    var editable__5827 = inode.ensure_editable(edit);
    editable__5827.arr[i] = a;
    editable__5827.arr[j] = b;
    return editable__5827
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
  var len__5828 = arr.length;
  var i__5829 = 0;
  var init__5830 = init;
  while(true) {
    if(i__5829 < len__5828) {
      var init__5833 = function() {
        var k__5831 = arr[i__5829];
        if(k__5831 != null) {
          return f.call(null, init__5830, k__5831, arr[i__5829 + 1])
        }else {
          var node__5832 = arr[i__5829 + 1];
          if(node__5832 != null) {
            return node__5832.kv_reduce(f, init__5830)
          }else {
            return init__5830
          }
        }
      }();
      if(cljs.core.reduced_QMARK_.call(null, init__5833)) {
        return cljs.core.deref.call(null, init__5833)
      }else {
        var G__5834 = i__5829 + 2;
        var G__5835 = init__5833;
        i__5829 = G__5834;
        init__5830 = G__5835;
        continue
      }
    }else {
      return init__5830
    }
    break
  }
};
void 0;
cljs.core.BitmapIndexedNode = function(edit, bitmap, arr) {
  this.edit = edit;
  this.bitmap = bitmap;
  this.arr = arr
};
cljs.core.BitmapIndexedNode.cljs$lang$type = true;
cljs.core.BitmapIndexedNode.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.BitmapIndexedNode")
};
cljs.core.BitmapIndexedNode.prototype.edit_and_remove_pair = function(e, bit, i) {
  var this__5836 = this;
  var inode__5837 = this;
  if(this__5836.bitmap === bit) {
    return null
  }else {
    var editable__5838 = inode__5837.ensure_editable(e);
    var earr__5839 = editable__5838.arr;
    var len__5840 = earr__5839.length;
    editable__5838.bitmap = bit ^ editable__5838.bitmap;
    cljs.core.array_copy.call(null, earr__5839, 2 * (i + 1), earr__5839, 2 * i, len__5840 - 2 * (i + 1));
    earr__5839[len__5840 - 2] = null;
    earr__5839[len__5840 - 1] = null;
    return editable__5838
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_assoc_BANG_ = function(edit, shift, hash, key, val, added_leaf_QMARK_) {
  var this__5841 = this;
  var inode__5842 = this;
  var bit__5843 = 1 << (hash >>> shift & 31);
  var idx__5844 = cljs.core.bitmap_indexed_node_index.call(null, this__5841.bitmap, bit__5843);
  if((this__5841.bitmap & bit__5843) === 0) {
    var n__5845 = cljs.core.bit_count.call(null, this__5841.bitmap);
    if(2 * n__5845 < this__5841.arr.length) {
      var editable__5846 = inode__5842.ensure_editable(edit);
      var earr__5847 = editable__5846.arr;
      added_leaf_QMARK_[0] = true;
      cljs.core.array_copy_downward.call(null, earr__5847, 2 * idx__5844, earr__5847, 2 * (idx__5844 + 1), 2 * (n__5845 - idx__5844));
      earr__5847[2 * idx__5844] = key;
      earr__5847[2 * idx__5844 + 1] = val;
      editable__5846.bitmap = editable__5846.bitmap | bit__5843;
      return editable__5846
    }else {
      if(n__5845 >= 16) {
        var nodes__5848 = cljs.core.make_array.call(null, 32);
        var jdx__5849 = hash >>> shift & 31;
        nodes__5848[jdx__5849] = cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_);
        var i__5850 = 0;
        var j__5851 = 0;
        while(true) {
          if(i__5850 < 32) {
            if((this__5841.bitmap >>> i__5850 & 1) === 0) {
              var G__5904 = i__5850 + 1;
              var G__5905 = j__5851;
              i__5850 = G__5904;
              j__5851 = G__5905;
              continue
            }else {
              nodes__5848[i__5850] = null != this__5841.arr[j__5851] ? cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift + 5, cljs.core.hash.call(null, this__5841.arr[j__5851]), this__5841.arr[j__5851], this__5841.arr[j__5851 + 1], added_leaf_QMARK_) : this__5841.arr[j__5851 + 1];
              var G__5906 = i__5850 + 1;
              var G__5907 = j__5851 + 2;
              i__5850 = G__5906;
              j__5851 = G__5907;
              continue
            }
          }else {
          }
          break
        }
        return new cljs.core.ArrayNode(edit, n__5845 + 1, nodes__5848)
      }else {
        if("\ufdd0'else") {
          var new_arr__5852 = cljs.core.make_array.call(null, 2 * (n__5845 + 4));
          cljs.core.array_copy.call(null, this__5841.arr, 0, new_arr__5852, 0, 2 * idx__5844);
          new_arr__5852[2 * idx__5844] = key;
          added_leaf_QMARK_[0] = true;
          new_arr__5852[2 * idx__5844 + 1] = val;
          cljs.core.array_copy.call(null, this__5841.arr, 2 * idx__5844, new_arr__5852, 2 * (idx__5844 + 1), 2 * (n__5845 - idx__5844));
          var editable__5853 = inode__5842.ensure_editable(edit);
          editable__5853.arr = new_arr__5852;
          editable__5853.bitmap = editable__5853.bitmap | bit__5843;
          return editable__5853
        }else {
          return null
        }
      }
    }
  }else {
    var key_or_nil__5854 = this__5841.arr[2 * idx__5844];
    var val_or_node__5855 = this__5841.arr[2 * idx__5844 + 1];
    if(null == key_or_nil__5854) {
      var n__5856 = val_or_node__5855.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_);
      if(n__5856 === val_or_node__5855) {
        return inode__5842
      }else {
        return cljs.core.edit_and_set.call(null, inode__5842, edit, 2 * idx__5844 + 1, n__5856)
      }
    }else {
      if(cljs.core._EQ_.call(null, key, key_or_nil__5854)) {
        if(val === val_or_node__5855) {
          return inode__5842
        }else {
          return cljs.core.edit_and_set.call(null, inode__5842, edit, 2 * idx__5844 + 1, val)
        }
      }else {
        if("\ufdd0'else") {
          added_leaf_QMARK_[0] = true;
          return cljs.core.edit_and_set.call(null, inode__5842, edit, 2 * idx__5844, null, 2 * idx__5844 + 1, cljs.core.create_node.call(null, edit, shift + 5, key_or_nil__5854, val_or_node__5855, hash, key, val))
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_seq = function() {
  var this__5857 = this;
  var inode__5858 = this;
  return cljs.core.create_inode_seq.call(null, this__5857.arr)
};
cljs.core.BitmapIndexedNode.prototype.inode_without_BANG_ = function(edit, shift, hash, key, removed_leaf_QMARK_) {
  var this__5859 = this;
  var inode__5860 = this;
  var bit__5861 = 1 << (hash >>> shift & 31);
  if((this__5859.bitmap & bit__5861) === 0) {
    return inode__5860
  }else {
    var idx__5862 = cljs.core.bitmap_indexed_node_index.call(null, this__5859.bitmap, bit__5861);
    var key_or_nil__5863 = this__5859.arr[2 * idx__5862];
    var val_or_node__5864 = this__5859.arr[2 * idx__5862 + 1];
    if(null == key_or_nil__5863) {
      var n__5865 = val_or_node__5864.inode_without_BANG_(edit, shift + 5, hash, key, removed_leaf_QMARK_);
      if(n__5865 === val_or_node__5864) {
        return inode__5860
      }else {
        if(null != n__5865) {
          return cljs.core.edit_and_set.call(null, inode__5860, edit, 2 * idx__5862 + 1, n__5865)
        }else {
          if(this__5859.bitmap === bit__5861) {
            return null
          }else {
            if("\ufdd0'else") {
              return inode__5860.edit_and_remove_pair(edit, bit__5861, idx__5862)
            }else {
              return null
            }
          }
        }
      }
    }else {
      if(cljs.core._EQ_.call(null, key, key_or_nil__5863)) {
        removed_leaf_QMARK_[0] = true;
        return inode__5860.edit_and_remove_pair(edit, bit__5861, idx__5862)
      }else {
        if("\ufdd0'else") {
          return inode__5860
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.ensure_editable = function(e) {
  var this__5866 = this;
  var inode__5867 = this;
  if(e === this__5866.edit) {
    return inode__5867
  }else {
    var n__5868 = cljs.core.bit_count.call(null, this__5866.bitmap);
    var new_arr__5869 = cljs.core.make_array.call(null, n__5868 < 0 ? 4 : 2 * (n__5868 + 1));
    cljs.core.array_copy.call(null, this__5866.arr, 0, new_arr__5869, 0, 2 * n__5868);
    return new cljs.core.BitmapIndexedNode(e, this__5866.bitmap, new_arr__5869)
  }
};
cljs.core.BitmapIndexedNode.prototype.kv_reduce = function(f, init) {
  var this__5870 = this;
  var inode__5871 = this;
  return cljs.core.inode_kv_reduce.call(null, this__5870.arr, f, init)
};
cljs.core.BitmapIndexedNode.prototype.inode_find = function() {
  var G__5908 = null;
  var G__5908__3 = function(shift, hash, key) {
    var this__5872 = this;
    var inode__5873 = this;
    var bit__5874 = 1 << (hash >>> shift & 31);
    if((this__5872.bitmap & bit__5874) === 0) {
      return null
    }else {
      var idx__5875 = cljs.core.bitmap_indexed_node_index.call(null, this__5872.bitmap, bit__5874);
      var key_or_nil__5876 = this__5872.arr[2 * idx__5875];
      var val_or_node__5877 = this__5872.arr[2 * idx__5875 + 1];
      if(null == key_or_nil__5876) {
        return val_or_node__5877.inode_find(shift + 5, hash, key)
      }else {
        if(cljs.core._EQ_.call(null, key, key_or_nil__5876)) {
          return cljs.core.PersistentVector.fromArray([key_or_nil__5876, val_or_node__5877])
        }else {
          if("\ufdd0'else") {
            return null
          }else {
            return null
          }
        }
      }
    }
  };
  var G__5908__4 = function(shift, hash, key, not_found) {
    var this__5878 = this;
    var inode__5879 = this;
    var bit__5880 = 1 << (hash >>> shift & 31);
    if((this__5878.bitmap & bit__5880) === 0) {
      return not_found
    }else {
      var idx__5881 = cljs.core.bitmap_indexed_node_index.call(null, this__5878.bitmap, bit__5880);
      var key_or_nil__5882 = this__5878.arr[2 * idx__5881];
      var val_or_node__5883 = this__5878.arr[2 * idx__5881 + 1];
      if(null == key_or_nil__5882) {
        return val_or_node__5883.inode_find(shift + 5, hash, key, not_found)
      }else {
        if(cljs.core._EQ_.call(null, key, key_or_nil__5882)) {
          return cljs.core.PersistentVector.fromArray([key_or_nil__5882, val_or_node__5883])
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
  G__5908 = function(shift, hash, key, not_found) {
    switch(arguments.length) {
      case 3:
        return G__5908__3.call(this, shift, hash, key);
      case 4:
        return G__5908__4.call(this, shift, hash, key, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__5908
}();
cljs.core.BitmapIndexedNode.prototype.inode_without = function(shift, hash, key) {
  var this__5884 = this;
  var inode__5885 = this;
  var bit__5886 = 1 << (hash >>> shift & 31);
  if((this__5884.bitmap & bit__5886) === 0) {
    return inode__5885
  }else {
    var idx__5887 = cljs.core.bitmap_indexed_node_index.call(null, this__5884.bitmap, bit__5886);
    var key_or_nil__5888 = this__5884.arr[2 * idx__5887];
    var val_or_node__5889 = this__5884.arr[2 * idx__5887 + 1];
    if(null == key_or_nil__5888) {
      var n__5890 = val_or_node__5889.inode_without(shift + 5, hash, key);
      if(n__5890 === val_or_node__5889) {
        return inode__5885
      }else {
        if(null != n__5890) {
          return new cljs.core.BitmapIndexedNode(null, this__5884.bitmap, cljs.core.clone_and_set.call(null, this__5884.arr, 2 * idx__5887 + 1, n__5890))
        }else {
          if(this__5884.bitmap === bit__5886) {
            return null
          }else {
            if("\ufdd0'else") {
              return new cljs.core.BitmapIndexedNode(null, this__5884.bitmap ^ bit__5886, cljs.core.remove_pair.call(null, this__5884.arr, idx__5887))
            }else {
              return null
            }
          }
        }
      }
    }else {
      if(cljs.core._EQ_.call(null, key, key_or_nil__5888)) {
        return new cljs.core.BitmapIndexedNode(null, this__5884.bitmap ^ bit__5886, cljs.core.remove_pair.call(null, this__5884.arr, idx__5887))
      }else {
        if("\ufdd0'else") {
          return inode__5885
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_assoc = function(shift, hash, key, val, added_leaf_QMARK_) {
  var this__5891 = this;
  var inode__5892 = this;
  var bit__5893 = 1 << (hash >>> shift & 31);
  var idx__5894 = cljs.core.bitmap_indexed_node_index.call(null, this__5891.bitmap, bit__5893);
  if((this__5891.bitmap & bit__5893) === 0) {
    var n__5895 = cljs.core.bit_count.call(null, this__5891.bitmap);
    if(n__5895 >= 16) {
      var nodes__5896 = cljs.core.make_array.call(null, 32);
      var jdx__5897 = hash >>> shift & 31;
      nodes__5896[jdx__5897] = cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_);
      var i__5898 = 0;
      var j__5899 = 0;
      while(true) {
        if(i__5898 < 32) {
          if((this__5891.bitmap >>> i__5898 & 1) === 0) {
            var G__5909 = i__5898 + 1;
            var G__5910 = j__5899;
            i__5898 = G__5909;
            j__5899 = G__5910;
            continue
          }else {
            nodes__5896[i__5898] = null != this__5891.arr[j__5899] ? cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift + 5, cljs.core.hash.call(null, this__5891.arr[j__5899]), this__5891.arr[j__5899], this__5891.arr[j__5899 + 1], added_leaf_QMARK_) : this__5891.arr[j__5899 + 1];
            var G__5911 = i__5898 + 1;
            var G__5912 = j__5899 + 2;
            i__5898 = G__5911;
            j__5899 = G__5912;
            continue
          }
        }else {
        }
        break
      }
      return new cljs.core.ArrayNode(null, n__5895 + 1, nodes__5896)
    }else {
      var new_arr__5900 = cljs.core.make_array.call(null, 2 * (n__5895 + 1));
      cljs.core.array_copy.call(null, this__5891.arr, 0, new_arr__5900, 0, 2 * idx__5894);
      new_arr__5900[2 * idx__5894] = key;
      added_leaf_QMARK_[0] = true;
      new_arr__5900[2 * idx__5894 + 1] = val;
      cljs.core.array_copy.call(null, this__5891.arr, 2 * idx__5894, new_arr__5900, 2 * (idx__5894 + 1), 2 * (n__5895 - idx__5894));
      return new cljs.core.BitmapIndexedNode(null, this__5891.bitmap | bit__5893, new_arr__5900)
    }
  }else {
    var key_or_nil__5901 = this__5891.arr[2 * idx__5894];
    var val_or_node__5902 = this__5891.arr[2 * idx__5894 + 1];
    if(null == key_or_nil__5901) {
      var n__5903 = val_or_node__5902.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_);
      if(n__5903 === val_or_node__5902) {
        return inode__5892
      }else {
        return new cljs.core.BitmapIndexedNode(null, this__5891.bitmap, cljs.core.clone_and_set.call(null, this__5891.arr, 2 * idx__5894 + 1, n__5903))
      }
    }else {
      if(cljs.core._EQ_.call(null, key, key_or_nil__5901)) {
        if(val === val_or_node__5902) {
          return inode__5892
        }else {
          return new cljs.core.BitmapIndexedNode(null, this__5891.bitmap, cljs.core.clone_and_set.call(null, this__5891.arr, 2 * idx__5894 + 1, val))
        }
      }else {
        if("\ufdd0'else") {
          added_leaf_QMARK_[0] = true;
          return new cljs.core.BitmapIndexedNode(null, this__5891.bitmap, cljs.core.clone_and_set.call(null, this__5891.arr, 2 * idx__5894, null, 2 * idx__5894 + 1, cljs.core.create_node.call(null, shift + 5, key_or_nil__5901, val_or_node__5902, hash, key, val)))
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
  var arr__5913 = array_node.arr;
  var len__5914 = 2 * (array_node.cnt - 1);
  var new_arr__5915 = cljs.core.make_array.call(null, len__5914);
  var i__5916 = 0;
  var j__5917 = 1;
  var bitmap__5918 = 0;
  while(true) {
    if(i__5916 < len__5914) {
      if(function() {
        var and__3822__auto____5919 = i__5916 != idx;
        if(and__3822__auto____5919) {
          return null != arr__5913[i__5916]
        }else {
          return and__3822__auto____5919
        }
      }()) {
        new_arr__5915[j__5917] = arr__5913[i__5916];
        var G__5920 = i__5916 + 1;
        var G__5921 = j__5917 + 2;
        var G__5922 = bitmap__5918 | 1 << i__5916;
        i__5916 = G__5920;
        j__5917 = G__5921;
        bitmap__5918 = G__5922;
        continue
      }else {
        var G__5923 = i__5916 + 1;
        var G__5924 = j__5917;
        var G__5925 = bitmap__5918;
        i__5916 = G__5923;
        j__5917 = G__5924;
        bitmap__5918 = G__5925;
        continue
      }
    }else {
      return new cljs.core.BitmapIndexedNode(edit, bitmap__5918, new_arr__5915)
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
cljs.core.ArrayNode.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.ArrayNode")
};
cljs.core.ArrayNode.prototype.inode_assoc = function(shift, hash, key, val, added_leaf_QMARK_) {
  var this__5926 = this;
  var inode__5927 = this;
  var idx__5928 = hash >>> shift & 31;
  var node__5929 = this__5926.arr[idx__5928];
  if(null == node__5929) {
    return new cljs.core.ArrayNode(null, this__5926.cnt + 1, cljs.core.clone_and_set.call(null, this__5926.arr, idx__5928, cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_)))
  }else {
    var n__5930 = node__5929.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_);
    if(n__5930 === node__5929) {
      return inode__5927
    }else {
      return new cljs.core.ArrayNode(null, this__5926.cnt, cljs.core.clone_and_set.call(null, this__5926.arr, idx__5928, n__5930))
    }
  }
};
cljs.core.ArrayNode.prototype.inode_without = function(shift, hash, key) {
  var this__5931 = this;
  var inode__5932 = this;
  var idx__5933 = hash >>> shift & 31;
  var node__5934 = this__5931.arr[idx__5933];
  if(null != node__5934) {
    var n__5935 = node__5934.inode_without(shift + 5, hash, key);
    if(n__5935 === node__5934) {
      return inode__5932
    }else {
      if(n__5935 == null) {
        if(this__5931.cnt <= 8) {
          return cljs.core.pack_array_node.call(null, inode__5932, null, idx__5933)
        }else {
          return new cljs.core.ArrayNode(null, this__5931.cnt - 1, cljs.core.clone_and_set.call(null, this__5931.arr, idx__5933, n__5935))
        }
      }else {
        if("\ufdd0'else") {
          return new cljs.core.ArrayNode(null, this__5931.cnt, cljs.core.clone_and_set.call(null, this__5931.arr, idx__5933, n__5935))
        }else {
          return null
        }
      }
    }
  }else {
    return inode__5932
  }
};
cljs.core.ArrayNode.prototype.inode_find = function() {
  var G__5967 = null;
  var G__5967__3 = function(shift, hash, key) {
    var this__5936 = this;
    var inode__5937 = this;
    var idx__5938 = hash >>> shift & 31;
    var node__5939 = this__5936.arr[idx__5938];
    if(null != node__5939) {
      return node__5939.inode_find(shift + 5, hash, key)
    }else {
      return null
    }
  };
  var G__5967__4 = function(shift, hash, key, not_found) {
    var this__5940 = this;
    var inode__5941 = this;
    var idx__5942 = hash >>> shift & 31;
    var node__5943 = this__5940.arr[idx__5942];
    if(null != node__5943) {
      return node__5943.inode_find(shift + 5, hash, key, not_found)
    }else {
      return not_found
    }
  };
  G__5967 = function(shift, hash, key, not_found) {
    switch(arguments.length) {
      case 3:
        return G__5967__3.call(this, shift, hash, key);
      case 4:
        return G__5967__4.call(this, shift, hash, key, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__5967
}();
cljs.core.ArrayNode.prototype.inode_seq = function() {
  var this__5944 = this;
  var inode__5945 = this;
  return cljs.core.create_array_node_seq.call(null, this__5944.arr)
};
cljs.core.ArrayNode.prototype.ensure_editable = function(e) {
  var this__5946 = this;
  var inode__5947 = this;
  if(e === this__5946.edit) {
    return inode__5947
  }else {
    return new cljs.core.ArrayNode(e, this__5946.cnt, cljs.core.aclone.call(null, this__5946.arr))
  }
};
cljs.core.ArrayNode.prototype.inode_assoc_BANG_ = function(edit, shift, hash, key, val, added_leaf_QMARK_) {
  var this__5948 = this;
  var inode__5949 = this;
  var idx__5950 = hash >>> shift & 31;
  var node__5951 = this__5948.arr[idx__5950];
  if(null == node__5951) {
    var editable__5952 = cljs.core.edit_and_set.call(null, inode__5949, edit, idx__5950, cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_));
    editable__5952.cnt = editable__5952.cnt + 1;
    return editable__5952
  }else {
    var n__5953 = node__5951.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_);
    if(n__5953 === node__5951) {
      return inode__5949
    }else {
      return cljs.core.edit_and_set.call(null, inode__5949, edit, idx__5950, n__5953)
    }
  }
};
cljs.core.ArrayNode.prototype.inode_without_BANG_ = function(edit, shift, hash, key, removed_leaf_QMARK_) {
  var this__5954 = this;
  var inode__5955 = this;
  var idx__5956 = hash >>> shift & 31;
  var node__5957 = this__5954.arr[idx__5956];
  if(null == node__5957) {
    return inode__5955
  }else {
    var n__5958 = node__5957.inode_without_BANG_(edit, shift + 5, hash, key, removed_leaf_QMARK_);
    if(n__5958 === node__5957) {
      return inode__5955
    }else {
      if(null == n__5958) {
        if(this__5954.cnt <= 8) {
          return cljs.core.pack_array_node.call(null, inode__5955, edit, idx__5956)
        }else {
          var editable__5959 = cljs.core.edit_and_set.call(null, inode__5955, edit, idx__5956, n__5958);
          editable__5959.cnt = editable__5959.cnt - 1;
          return editable__5959
        }
      }else {
        if("\ufdd0'else") {
          return cljs.core.edit_and_set.call(null, inode__5955, edit, idx__5956, n__5958)
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.ArrayNode.prototype.kv_reduce = function(f, init) {
  var this__5960 = this;
  var inode__5961 = this;
  var len__5962 = this__5960.arr.length;
  var i__5963 = 0;
  var init__5964 = init;
  while(true) {
    if(i__5963 < len__5962) {
      var node__5965 = this__5960.arr[i__5963];
      if(node__5965 != null) {
        var init__5966 = node__5965.kv_reduce(f, init__5964);
        if(cljs.core.reduced_QMARK_.call(null, init__5966)) {
          return cljs.core.deref.call(null, init__5966)
        }else {
          var G__5968 = i__5963 + 1;
          var G__5969 = init__5966;
          i__5963 = G__5968;
          init__5964 = G__5969;
          continue
        }
      }else {
        return null
      }
    }else {
      return init__5964
    }
    break
  }
};
cljs.core.ArrayNode;
cljs.core.hash_collision_node_find_index = function hash_collision_node_find_index(arr, cnt, key) {
  var lim__5970 = 2 * cnt;
  var i__5971 = 0;
  while(true) {
    if(i__5971 < lim__5970) {
      if(cljs.core._EQ_.call(null, key, arr[i__5971])) {
        return i__5971
      }else {
        var G__5972 = i__5971 + 2;
        i__5971 = G__5972;
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
cljs.core.HashCollisionNode.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.HashCollisionNode")
};
cljs.core.HashCollisionNode.prototype.inode_assoc = function(shift, hash, key, val, added_leaf_QMARK_) {
  var this__5973 = this;
  var inode__5974 = this;
  if(hash === this__5973.collision_hash) {
    var idx__5975 = cljs.core.hash_collision_node_find_index.call(null, this__5973.arr, this__5973.cnt, key);
    if(idx__5975 === -1) {
      var len__5976 = this__5973.arr.length;
      var new_arr__5977 = cljs.core.make_array.call(null, len__5976 + 2);
      cljs.core.array_copy.call(null, this__5973.arr, 0, new_arr__5977, 0, len__5976);
      new_arr__5977[len__5976] = key;
      new_arr__5977[len__5976 + 1] = val;
      added_leaf_QMARK_[0] = true;
      return new cljs.core.HashCollisionNode(null, this__5973.collision_hash, this__5973.cnt + 1, new_arr__5977)
    }else {
      if(cljs.core._EQ_.call(null, this__5973.arr[idx__5975], val)) {
        return inode__5974
      }else {
        return new cljs.core.HashCollisionNode(null, this__5973.collision_hash, this__5973.cnt, cljs.core.clone_and_set.call(null, this__5973.arr, idx__5975 + 1, val))
      }
    }
  }else {
    return(new cljs.core.BitmapIndexedNode(null, 1 << (this__5973.collision_hash >>> shift & 31), [null, inode__5974])).inode_assoc(shift, hash, key, val, added_leaf_QMARK_)
  }
};
cljs.core.HashCollisionNode.prototype.inode_without = function(shift, hash, key) {
  var this__5978 = this;
  var inode__5979 = this;
  var idx__5980 = cljs.core.hash_collision_node_find_index.call(null, this__5978.arr, this__5978.cnt, key);
  if(idx__5980 === -1) {
    return inode__5979
  }else {
    if(this__5978.cnt === 1) {
      return null
    }else {
      if("\ufdd0'else") {
        return new cljs.core.HashCollisionNode(null, this__5978.collision_hash, this__5978.cnt - 1, cljs.core.remove_pair.call(null, this__5978.arr, cljs.core.quot.call(null, idx__5980, 2)))
      }else {
        return null
      }
    }
  }
};
cljs.core.HashCollisionNode.prototype.inode_find = function() {
  var G__6007 = null;
  var G__6007__3 = function(shift, hash, key) {
    var this__5981 = this;
    var inode__5982 = this;
    var idx__5983 = cljs.core.hash_collision_node_find_index.call(null, this__5981.arr, this__5981.cnt, key);
    if(idx__5983 < 0) {
      return null
    }else {
      if(cljs.core._EQ_.call(null, key, this__5981.arr[idx__5983])) {
        return cljs.core.PersistentVector.fromArray([this__5981.arr[idx__5983], this__5981.arr[idx__5983 + 1]])
      }else {
        if("\ufdd0'else") {
          return null
        }else {
          return null
        }
      }
    }
  };
  var G__6007__4 = function(shift, hash, key, not_found) {
    var this__5984 = this;
    var inode__5985 = this;
    var idx__5986 = cljs.core.hash_collision_node_find_index.call(null, this__5984.arr, this__5984.cnt, key);
    if(idx__5986 < 0) {
      return not_found
    }else {
      if(cljs.core._EQ_.call(null, key, this__5984.arr[idx__5986])) {
        return cljs.core.PersistentVector.fromArray([this__5984.arr[idx__5986], this__5984.arr[idx__5986 + 1]])
      }else {
        if("\ufdd0'else") {
          return not_found
        }else {
          return null
        }
      }
    }
  };
  G__6007 = function(shift, hash, key, not_found) {
    switch(arguments.length) {
      case 3:
        return G__6007__3.call(this, shift, hash, key);
      case 4:
        return G__6007__4.call(this, shift, hash, key, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6007
}();
cljs.core.HashCollisionNode.prototype.inode_seq = function() {
  var this__5987 = this;
  var inode__5988 = this;
  return cljs.core.create_inode_seq.call(null, this__5987.arr)
};
cljs.core.HashCollisionNode.prototype.ensure_editable = function() {
  var G__6008 = null;
  var G__6008__1 = function(e) {
    var this__5989 = this;
    var inode__5990 = this;
    if(e === this__5989.edit) {
      return inode__5990
    }else {
      var new_arr__5991 = cljs.core.make_array.call(null, 2 * (this__5989.cnt + 1));
      cljs.core.array_copy.call(null, this__5989.arr, 0, new_arr__5991, 0, 2 * this__5989.cnt);
      return new cljs.core.HashCollisionNode(e, this__5989.collision_hash, this__5989.cnt, new_arr__5991)
    }
  };
  var G__6008__3 = function(e, count, array) {
    var this__5992 = this;
    var inode__5993 = this;
    if(e === this__5992.edit) {
      this__5992.arr = array;
      this__5992.cnt = count;
      return inode__5993
    }else {
      return new cljs.core.HashCollisionNode(this__5992.edit, this__5992.collision_hash, count, array)
    }
  };
  G__6008 = function(e, count, array) {
    switch(arguments.length) {
      case 1:
        return G__6008__1.call(this, e);
      case 3:
        return G__6008__3.call(this, e, count, array)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6008
}();
cljs.core.HashCollisionNode.prototype.inode_assoc_BANG_ = function(edit, shift, hash, key, val, added_leaf_QMARK_) {
  var this__5994 = this;
  var inode__5995 = this;
  if(hash === this__5994.collision_hash) {
    var idx__5996 = cljs.core.hash_collision_node_find_index.call(null, this__5994.arr, this__5994.cnt, key);
    if(idx__5996 === -1) {
      if(this__5994.arr.length > 2 * this__5994.cnt) {
        var editable__5997 = cljs.core.edit_and_set.call(null, inode__5995, edit, 2 * this__5994.cnt, key, 2 * this__5994.cnt + 1, val);
        added_leaf_QMARK_[0] = true;
        editable__5997.cnt = editable__5997.cnt + 1;
        return editable__5997
      }else {
        var len__5998 = this__5994.arr.length;
        var new_arr__5999 = cljs.core.make_array.call(null, len__5998 + 2);
        cljs.core.array_copy.call(null, this__5994.arr, 0, new_arr__5999, 0, len__5998);
        new_arr__5999[len__5998] = key;
        new_arr__5999[len__5998 + 1] = val;
        added_leaf_QMARK_[0] = true;
        return inode__5995.ensure_editable(edit, this__5994.cnt + 1, new_arr__5999)
      }
    }else {
      if(this__5994.arr[idx__5996 + 1] === val) {
        return inode__5995
      }else {
        return cljs.core.edit_and_set.call(null, inode__5995, edit, idx__5996 + 1, val)
      }
    }
  }else {
    return(new cljs.core.BitmapIndexedNode(edit, 1 << (this__5994.collision_hash >>> shift & 31), [null, inode__5995, null, null])).inode_assoc_BANG_(edit, shift, hash, key, val, added_leaf_QMARK_)
  }
};
cljs.core.HashCollisionNode.prototype.inode_without_BANG_ = function(edit, shift, hash, key, removed_leaf_QMARK_) {
  var this__6000 = this;
  var inode__6001 = this;
  var idx__6002 = cljs.core.hash_collision_node_find_index.call(null, this__6000.arr, this__6000.cnt, key);
  if(idx__6002 === -1) {
    return inode__6001
  }else {
    removed_leaf_QMARK_[0] = true;
    if(this__6000.cnt === 1) {
      return null
    }else {
      var editable__6003 = inode__6001.ensure_editable(edit);
      var earr__6004 = editable__6003.arr;
      earr__6004[idx__6002] = earr__6004[2 * this__6000.cnt - 2];
      earr__6004[idx__6002 + 1] = earr__6004[2 * this__6000.cnt - 1];
      earr__6004[2 * this__6000.cnt - 1] = null;
      earr__6004[2 * this__6000.cnt - 2] = null;
      editable__6003.cnt = editable__6003.cnt - 1;
      return editable__6003
    }
  }
};
cljs.core.HashCollisionNode.prototype.kv_reduce = function(f, init) {
  var this__6005 = this;
  var inode__6006 = this;
  return cljs.core.inode_kv_reduce.call(null, this__6005.arr, f, init)
};
cljs.core.HashCollisionNode;
cljs.core.create_node = function() {
  var create_node = null;
  var create_node__6 = function(shift, key1, val1, key2hash, key2, val2) {
    var key1hash__6009 = cljs.core.hash.call(null, key1);
    if(key1hash__6009 === key2hash) {
      return new cljs.core.HashCollisionNode(null, key1hash__6009, 2, [key1, val1, key2, val2])
    }else {
      var added_leaf_QMARK___6010 = [false];
      return cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift, key1hash__6009, key1, val1, added_leaf_QMARK___6010).inode_assoc(shift, key2hash, key2, val2, added_leaf_QMARK___6010)
    }
  };
  var create_node__7 = function(edit, shift, key1, val1, key2hash, key2, val2) {
    var key1hash__6011 = cljs.core.hash.call(null, key1);
    if(key1hash__6011 === key2hash) {
      return new cljs.core.HashCollisionNode(null, key1hash__6011, 2, [key1, val1, key2, val2])
    }else {
      var added_leaf_QMARK___6012 = [false];
      return cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift, key1hash__6011, key1, val1, added_leaf_QMARK___6012).inode_assoc_BANG_(edit, shift, key2hash, key2, val2, added_leaf_QMARK___6012)
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
  this.cljs$lang$protocol_mask$partition0$ = 15925324
};
cljs.core.NodeSeq.cljs$lang$type = true;
cljs.core.NodeSeq.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.NodeSeq")
};
cljs.core.NodeSeq.prototype.cljs$core$IHash$ = true;
cljs.core.NodeSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__6013 = this;
  var h__364__auto____6014 = this__6013.__hash;
  if(h__364__auto____6014 != null) {
    return h__364__auto____6014
  }else {
    var h__364__auto____6015 = cljs.core.hash_coll.call(null, coll);
    this__6013.__hash = h__364__auto____6015;
    return h__364__auto____6015
  }
};
cljs.core.NodeSeq.prototype.cljs$core$ISequential$ = true;
cljs.core.NodeSeq.prototype.cljs$core$ICollection$ = true;
cljs.core.NodeSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__6016 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.NodeSeq.prototype.toString = function() {
  var this__6017 = this;
  var this$__6018 = this;
  return cljs.core.pr_str.call(null, this$__6018)
};
cljs.core.NodeSeq.prototype.cljs$core$ISeqable$ = true;
cljs.core.NodeSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__6019 = this;
  return this$
};
cljs.core.NodeSeq.prototype.cljs$core$ISeq$ = true;
cljs.core.NodeSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__6020 = this;
  if(this__6020.s == null) {
    return cljs.core.PersistentVector.fromArray([this__6020.nodes[this__6020.i], this__6020.nodes[this__6020.i + 1]])
  }else {
    return cljs.core.first.call(null, this__6020.s)
  }
};
cljs.core.NodeSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__6021 = this;
  if(this__6021.s == null) {
    return cljs.core.create_inode_seq.call(null, this__6021.nodes, this__6021.i + 2, null)
  }else {
    return cljs.core.create_inode_seq.call(null, this__6021.nodes, this__6021.i, cljs.core.next.call(null, this__6021.s))
  }
};
cljs.core.NodeSeq.prototype.cljs$core$IEquiv$ = true;
cljs.core.NodeSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__6022 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.NodeSeq.prototype.cljs$core$IWithMeta$ = true;
cljs.core.NodeSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__6023 = this;
  return new cljs.core.NodeSeq(meta, this__6023.nodes, this__6023.i, this__6023.s, this__6023.__hash)
};
cljs.core.NodeSeq.prototype.cljs$core$IMeta$ = true;
cljs.core.NodeSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__6024 = this;
  return this__6024.meta
};
cljs.core.NodeSeq.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.NodeSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__6025 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__6025.meta)
};
cljs.core.NodeSeq;
cljs.core.create_inode_seq = function() {
  var create_inode_seq = null;
  var create_inode_seq__1 = function(nodes) {
    return create_inode_seq.call(null, nodes, 0, null)
  };
  var create_inode_seq__3 = function(nodes, i, s) {
    if(s == null) {
      var len__6026 = nodes.length;
      var j__6027 = i;
      while(true) {
        if(j__6027 < len__6026) {
          if(null != nodes[j__6027]) {
            return new cljs.core.NodeSeq(null, nodes, j__6027, null, null)
          }else {
            var temp__3971__auto____6028 = nodes[j__6027 + 1];
            if(cljs.core.truth_(temp__3971__auto____6028)) {
              var node__6029 = temp__3971__auto____6028;
              var temp__3971__auto____6030 = node__6029.inode_seq();
              if(cljs.core.truth_(temp__3971__auto____6030)) {
                var node_seq__6031 = temp__3971__auto____6030;
                return new cljs.core.NodeSeq(null, nodes, j__6027 + 2, node_seq__6031, null)
              }else {
                var G__6032 = j__6027 + 2;
                j__6027 = G__6032;
                continue
              }
            }else {
              var G__6033 = j__6027 + 2;
              j__6027 = G__6033;
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
  this.cljs$lang$protocol_mask$partition0$ = 15925324
};
cljs.core.ArrayNodeSeq.cljs$lang$type = true;
cljs.core.ArrayNodeSeq.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.ArrayNodeSeq")
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IHash$ = true;
cljs.core.ArrayNodeSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__6034 = this;
  var h__364__auto____6035 = this__6034.__hash;
  if(h__364__auto____6035 != null) {
    return h__364__auto____6035
  }else {
    var h__364__auto____6036 = cljs.core.hash_coll.call(null, coll);
    this__6034.__hash = h__364__auto____6036;
    return h__364__auto____6036
  }
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISequential$ = true;
cljs.core.ArrayNodeSeq.prototype.cljs$core$ICollection$ = true;
cljs.core.ArrayNodeSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__6037 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.ArrayNodeSeq.prototype.toString = function() {
  var this__6038 = this;
  var this$__6039 = this;
  return cljs.core.pr_str.call(null, this$__6039)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeqable$ = true;
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__6040 = this;
  return this$
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeq$ = true;
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__6041 = this;
  return cljs.core.first.call(null, this__6041.s)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__6042 = this;
  return cljs.core.create_array_node_seq.call(null, null, this__6042.nodes, this__6042.i, cljs.core.next.call(null, this__6042.s))
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IEquiv$ = true;
cljs.core.ArrayNodeSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__6043 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IWithMeta$ = true;
cljs.core.ArrayNodeSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__6044 = this;
  return new cljs.core.ArrayNodeSeq(meta, this__6044.nodes, this__6044.i, this__6044.s, this__6044.__hash)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IMeta$ = true;
cljs.core.ArrayNodeSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__6045 = this;
  return this__6045.meta
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.ArrayNodeSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__6046 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__6046.meta)
};
cljs.core.ArrayNodeSeq;
cljs.core.create_array_node_seq = function() {
  var create_array_node_seq = null;
  var create_array_node_seq__1 = function(nodes) {
    return create_array_node_seq.call(null, null, nodes, 0, null)
  };
  var create_array_node_seq__4 = function(meta, nodes, i, s) {
    if(s == null) {
      var len__6047 = nodes.length;
      var j__6048 = i;
      while(true) {
        if(j__6048 < len__6047) {
          var temp__3971__auto____6049 = nodes[j__6048];
          if(cljs.core.truth_(temp__3971__auto____6049)) {
            var nj__6050 = temp__3971__auto____6049;
            var temp__3971__auto____6051 = nj__6050.inode_seq();
            if(cljs.core.truth_(temp__3971__auto____6051)) {
              var ns__6052 = temp__3971__auto____6051;
              return new cljs.core.ArrayNodeSeq(meta, nodes, j__6048 + 1, ns__6052, null)
            }else {
              var G__6053 = j__6048 + 1;
              j__6048 = G__6053;
              continue
            }
          }else {
            var G__6054 = j__6048 + 1;
            j__6048 = G__6054;
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
void 0;
cljs.core.PersistentHashMap = function(meta, cnt, root, has_nil_QMARK_, nil_val, __hash) {
  this.meta = meta;
  this.cnt = cnt;
  this.root = root;
  this.has_nil_QMARK_ = has_nil_QMARK_;
  this.nil_val = nil_val;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 2155545487
};
cljs.core.PersistentHashMap.cljs$lang$type = true;
cljs.core.PersistentHashMap.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.PersistentHashMap")
};
cljs.core.PersistentHashMap.prototype.cljs$core$IEditableCollection$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var this__6059 = this;
  return new cljs.core.TransientHashMap({}, this__6059.root, this__6059.cnt, this__6059.has_nil_QMARK_, this__6059.nil_val)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IHash$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__6060 = this;
  var h__364__auto____6061 = this__6060.__hash;
  if(h__364__auto____6061 != null) {
    return h__364__auto____6061
  }else {
    var h__364__auto____6062 = cljs.core.hash_imap.call(null, coll);
    this__6060.__hash = h__364__auto____6062;
    return h__364__auto____6062
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$ILookup$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__6063 = this;
  return cljs.core._lookup.call(null, coll, k, null)
};
cljs.core.PersistentHashMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__6064 = this;
  if(k == null) {
    if(cljs.core.truth_(this__6064.has_nil_QMARK_)) {
      return this__6064.nil_val
    }else {
      return not_found
    }
  }else {
    if(this__6064.root == null) {
      return not_found
    }else {
      if("\ufdd0'else") {
        return cljs.core.nth.call(null, this__6064.root.inode_find(0, cljs.core.hash.call(null, k), k, [null, not_found]), 1)
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$IAssociative$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__6065 = this;
  if(k == null) {
    if(cljs.core.truth_(function() {
      var and__3822__auto____6066 = this__6065.has_nil_QMARK_;
      if(cljs.core.truth_(and__3822__auto____6066)) {
        return v === this__6065.nil_val
      }else {
        return and__3822__auto____6066
      }
    }())) {
      return coll
    }else {
      return new cljs.core.PersistentHashMap(this__6065.meta, cljs.core.truth_(this__6065.has_nil_QMARK_) ? this__6065.cnt : this__6065.cnt + 1, this__6065.root, true, v, null)
    }
  }else {
    var added_leaf_QMARK___6067 = [false];
    var new_root__6068 = (this__6065.root == null ? cljs.core.BitmapIndexedNode.EMPTY : this__6065.root).inode_assoc(0, cljs.core.hash.call(null, k), k, v, added_leaf_QMARK___6067);
    if(new_root__6068 === this__6065.root) {
      return coll
    }else {
      return new cljs.core.PersistentHashMap(this__6065.meta, cljs.core.truth_(added_leaf_QMARK___6067[0]) ? this__6065.cnt + 1 : this__6065.cnt, new_root__6068, this__6065.has_nil_QMARK_, this__6065.nil_val, null)
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__6069 = this;
  if(k == null) {
    return this__6069.has_nil_QMARK_
  }else {
    if(this__6069.root == null) {
      return false
    }else {
      if("\ufdd0'else") {
        return cljs.core.not.call(null, this__6069.root.inode_find(0, cljs.core.hash.call(null, k), k, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel)
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$IFn$ = true;
cljs.core.PersistentHashMap.prototype.call = function() {
  var G__6090 = null;
  var G__6090__2 = function(tsym6057, k) {
    var this__6070 = this;
    var tsym6057__6071 = this;
    var coll__6072 = tsym6057__6071;
    return cljs.core._lookup.call(null, coll__6072, k)
  };
  var G__6090__3 = function(tsym6058, k, not_found) {
    var this__6073 = this;
    var tsym6058__6074 = this;
    var coll__6075 = tsym6058__6074;
    return cljs.core._lookup.call(null, coll__6075, k, not_found)
  };
  G__6090 = function(tsym6058, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__6090__2.call(this, tsym6058, k);
      case 3:
        return G__6090__3.call(this, tsym6058, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6090
}();
cljs.core.PersistentHashMap.prototype.apply = function(tsym6055, args6056) {
  return tsym6055.call.apply(tsym6055, [tsym6055].concat(cljs.core.aclone.call(null, args6056)))
};
cljs.core.PersistentHashMap.prototype.cljs$core$IKVReduce$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(coll, f, init) {
  var this__6076 = this;
  var init__6077 = cljs.core.truth_(this__6076.has_nil_QMARK_) ? f.call(null, init, null, this__6076.nil_val) : init;
  if(cljs.core.reduced_QMARK_.call(null, init__6077)) {
    return cljs.core.deref.call(null, init__6077)
  }else {
    if(null != this__6076.root) {
      return this__6076.root.kv_reduce(f, init__6077)
    }else {
      if("\ufdd0'else") {
        return init__6077
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$ICollection$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__6078 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return cljs.core._assoc.call(null, coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.PersistentHashMap.prototype.toString = function() {
  var this__6079 = this;
  var this$__6080 = this;
  return cljs.core.pr_str.call(null, this$__6080)
};
cljs.core.PersistentHashMap.prototype.cljs$core$ISeqable$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__6081 = this;
  if(this__6081.cnt > 0) {
    var s__6082 = null != this__6081.root ? this__6081.root.inode_seq() : null;
    if(cljs.core.truth_(this__6081.has_nil_QMARK_)) {
      return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([null, this__6081.nil_val]), s__6082)
    }else {
      return s__6082
    }
  }else {
    return null
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$ICounted$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__6083 = this;
  return this__6083.cnt
};
cljs.core.PersistentHashMap.prototype.cljs$core$IEquiv$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__6084 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IWithMeta$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__6085 = this;
  return new cljs.core.PersistentHashMap(meta, this__6085.cnt, this__6085.root, this__6085.has_nil_QMARK_, this__6085.nil_val, this__6085.__hash)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IMeta$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__6086 = this;
  return this__6086.meta
};
cljs.core.PersistentHashMap.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__6087 = this;
  return cljs.core._with_meta.call(null, cljs.core.PersistentHashMap.EMPTY, this__6087.meta)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IMap$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__6088 = this;
  if(k == null) {
    if(cljs.core.truth_(this__6088.has_nil_QMARK_)) {
      return new cljs.core.PersistentHashMap(this__6088.meta, this__6088.cnt - 1, this__6088.root, false, null, null)
    }else {
      return coll
    }
  }else {
    if(this__6088.root == null) {
      return coll
    }else {
      if("\ufdd0'else") {
        var new_root__6089 = this__6088.root.inode_without(0, cljs.core.hash.call(null, k), k);
        if(new_root__6089 === this__6088.root) {
          return coll
        }else {
          return new cljs.core.PersistentHashMap(this__6088.meta, this__6088.cnt - 1, new_root__6089, this__6088.has_nil_QMARK_, this__6088.nil_val, null)
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
  var len__6091 = ks.length;
  var i__6092 = 0;
  var out__6093 = cljs.core.transient$.call(null, cljs.core.PersistentHashMap.EMPTY);
  while(true) {
    if(i__6092 < len__6091) {
      var G__6094 = i__6092 + 1;
      var G__6095 = cljs.core.assoc_BANG_.call(null, out__6093, ks[i__6092], vs[i__6092]);
      i__6092 = G__6094;
      out__6093 = G__6095;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, out__6093)
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
  this.cljs$lang$protocol_mask$partition1$ = 7;
  this.cljs$lang$protocol_mask$partition0$ = 130
};
cljs.core.TransientHashMap.cljs$lang$type = true;
cljs.core.TransientHashMap.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.TransientHashMap")
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientMap$ = true;
cljs.core.TransientHashMap.prototype.cljs$core$ITransientMap$_dissoc_BANG_$arity$2 = function(tcoll, key) {
  var this__6096 = this;
  return tcoll.without_BANG_(key)
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientAssociative$ = true;
cljs.core.TransientHashMap.prototype.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3 = function(tcoll, key, val) {
  var this__6097 = this;
  return tcoll.assoc_BANG_(key, val)
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientCollection$ = true;
cljs.core.TransientHashMap.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, val) {
  var this__6098 = this;
  return tcoll.conj_BANG_(val)
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__6099 = this;
  return tcoll.persistent_BANG_()
};
cljs.core.TransientHashMap.prototype.cljs$core$ILookup$ = true;
cljs.core.TransientHashMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(tcoll, k) {
  var this__6100 = this;
  if(k == null) {
    if(cljs.core.truth_(this__6100.has_nil_QMARK_)) {
      return this__6100.nil_val
    }else {
      return null
    }
  }else {
    if(this__6100.root == null) {
      return null
    }else {
      return cljs.core.nth.call(null, this__6100.root.inode_find(0, cljs.core.hash.call(null, k), k), 1)
    }
  }
};
cljs.core.TransientHashMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(tcoll, k, not_found) {
  var this__6101 = this;
  if(k == null) {
    if(cljs.core.truth_(this__6101.has_nil_QMARK_)) {
      return this__6101.nil_val
    }else {
      return not_found
    }
  }else {
    if(this__6101.root == null) {
      return not_found
    }else {
      return cljs.core.nth.call(null, this__6101.root.inode_find(0, cljs.core.hash.call(null, k), k, [null, not_found]), 1)
    }
  }
};
cljs.core.TransientHashMap.prototype.cljs$core$ICounted$ = true;
cljs.core.TransientHashMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__6102 = this;
  if(cljs.core.truth_(this__6102.edit)) {
    return this__6102.count
  }else {
    throw new Error("count after persistent!");
  }
};
cljs.core.TransientHashMap.prototype.conj_BANG_ = function(o) {
  var this__6103 = this;
  var tcoll__6104 = this;
  if(cljs.core.truth_(this__6103.edit)) {
    if(function() {
      var G__6105__6106 = o;
      if(G__6105__6106 != null) {
        if(function() {
          var or__3824__auto____6107 = G__6105__6106.cljs$lang$protocol_mask$partition0$ & 1024;
          if(or__3824__auto____6107) {
            return or__3824__auto____6107
          }else {
            return G__6105__6106.cljs$core$IMapEntry$
          }
        }()) {
          return true
        }else {
          if(!G__6105__6106.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__6105__6106)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__6105__6106)
      }
    }()) {
      return tcoll__6104.assoc_BANG_(cljs.core.key.call(null, o), cljs.core.val.call(null, o))
    }else {
      var es__6108 = cljs.core.seq.call(null, o);
      var tcoll__6109 = tcoll__6104;
      while(true) {
        var temp__3971__auto____6110 = cljs.core.first.call(null, es__6108);
        if(cljs.core.truth_(temp__3971__auto____6110)) {
          var e__6111 = temp__3971__auto____6110;
          var G__6122 = cljs.core.next.call(null, es__6108);
          var G__6123 = tcoll__6109.assoc_BANG_(cljs.core.key.call(null, e__6111), cljs.core.val.call(null, e__6111));
          es__6108 = G__6122;
          tcoll__6109 = G__6123;
          continue
        }else {
          return tcoll__6109
        }
        break
      }
    }
  }else {
    throw new Error("conj! after persistent");
  }
};
cljs.core.TransientHashMap.prototype.assoc_BANG_ = function(k, v) {
  var this__6112 = this;
  var tcoll__6113 = this;
  if(cljs.core.truth_(this__6112.edit)) {
    if(k == null) {
      if(this__6112.nil_val === v) {
      }else {
        this__6112.nil_val = v
      }
      if(cljs.core.truth_(this__6112.has_nil_QMARK_)) {
      }else {
        this__6112.count = this__6112.count + 1;
        this__6112.has_nil_QMARK_ = true
      }
      return tcoll__6113
    }else {
      var added_leaf_QMARK___6114 = [false];
      var node__6115 = (this__6112.root == null ? cljs.core.BitmapIndexedNode.EMPTY : this__6112.root).inode_assoc_BANG_(this__6112.edit, 0, cljs.core.hash.call(null, k), k, v, added_leaf_QMARK___6114);
      if(node__6115 === this__6112.root) {
      }else {
        this__6112.root = node__6115
      }
      if(cljs.core.truth_(added_leaf_QMARK___6114[0])) {
        this__6112.count = this__6112.count + 1
      }else {
      }
      return tcoll__6113
    }
  }else {
    throw new Error("assoc! after persistent!");
  }
};
cljs.core.TransientHashMap.prototype.without_BANG_ = function(k) {
  var this__6116 = this;
  var tcoll__6117 = this;
  if(cljs.core.truth_(this__6116.edit)) {
    if(k == null) {
      if(cljs.core.truth_(this__6116.has_nil_QMARK_)) {
        this__6116.has_nil_QMARK_ = false;
        this__6116.nil_val = null;
        this__6116.count = this__6116.count - 1;
        return tcoll__6117
      }else {
        return tcoll__6117
      }
    }else {
      if(this__6116.root == null) {
        return tcoll__6117
      }else {
        var removed_leaf_QMARK___6118 = [false];
        var node__6119 = this__6116.root.inode_without_BANG_(this__6116.edit, 0, cljs.core.hash.call(null, k), k, removed_leaf_QMARK___6118);
        if(node__6119 === this__6116.root) {
        }else {
          this__6116.root = node__6119
        }
        if(cljs.core.truth_(removed_leaf_QMARK___6118[0])) {
          this__6116.count = this__6116.count - 1
        }else {
        }
        return tcoll__6117
      }
    }
  }else {
    throw new Error("dissoc! after persistent!");
  }
};
cljs.core.TransientHashMap.prototype.persistent_BANG_ = function() {
  var this__6120 = this;
  var tcoll__6121 = this;
  if(cljs.core.truth_(this__6120.edit)) {
    this__6120.edit = null;
    return new cljs.core.PersistentHashMap(null, this__6120.count, this__6120.root, this__6120.has_nil_QMARK_, this__6120.nil_val, null)
  }else {
    throw new Error("persistent! called twice");
  }
};
cljs.core.TransientHashMap;
cljs.core.tree_map_seq_push = function tree_map_seq_push(node, stack, ascending_QMARK_) {
  var t__6124 = node;
  var stack__6125 = stack;
  while(true) {
    if(t__6124 != null) {
      var G__6126 = cljs.core.truth_(ascending_QMARK_) ? t__6124.left : t__6124.right;
      var G__6127 = cljs.core.conj.call(null, stack__6125, t__6124);
      t__6124 = G__6126;
      stack__6125 = G__6127;
      continue
    }else {
      return stack__6125
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
  this.cljs$lang$protocol_mask$partition0$ = 15925322
};
cljs.core.PersistentTreeMapSeq.cljs$lang$type = true;
cljs.core.PersistentTreeMapSeq.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.PersistentTreeMapSeq")
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IHash$ = true;
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__6128 = this;
  var h__364__auto____6129 = this__6128.__hash;
  if(h__364__auto____6129 != null) {
    return h__364__auto____6129
  }else {
    var h__364__auto____6130 = cljs.core.hash_coll.call(null, coll);
    this__6128.__hash = h__364__auto____6130;
    return h__364__auto____6130
  }
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISequential$ = true;
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ICollection$ = true;
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__6131 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.PersistentTreeMapSeq.prototype.toString = function() {
  var this__6132 = this;
  var this$__6133 = this;
  return cljs.core.pr_str.call(null, this$__6133)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeqable$ = true;
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__6134 = this;
  return this$
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ICounted$ = true;
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__6135 = this;
  if(this__6135.cnt < 0) {
    return cljs.core.count.call(null, cljs.core.next.call(null, coll)) + 1
  }else {
    return this__6135.cnt
  }
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeq$ = true;
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(this$) {
  var this__6136 = this;
  return cljs.core.peek.call(null, this__6136.stack)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(this$) {
  var this__6137 = this;
  var t__6138 = cljs.core.peek.call(null, this__6137.stack);
  var next_stack__6139 = cljs.core.tree_map_seq_push.call(null, cljs.core.truth_(this__6137.ascending_QMARK_) ? t__6138.right : t__6138.left, cljs.core.pop.call(null, this__6137.stack), this__6137.ascending_QMARK_);
  if(next_stack__6139 != null) {
    return new cljs.core.PersistentTreeMapSeq(null, next_stack__6139, this__6137.ascending_QMARK_, this__6137.cnt - 1, null)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IEquiv$ = true;
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__6140 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IWithMeta$ = true;
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__6141 = this;
  return new cljs.core.PersistentTreeMapSeq(meta, this__6141.stack, this__6141.ascending_QMARK_, this__6141.cnt, this__6141.__hash)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IMeta$ = true;
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__6142 = this;
  return this__6142.meta
};
cljs.core.PersistentTreeMapSeq;
cljs.core.create_tree_map_seq = function create_tree_map_seq(tree, ascending_QMARK_, cnt) {
  return new cljs.core.PersistentTreeMapSeq(null, cljs.core.tree_map_seq_push.call(null, tree, null, ascending_QMARK_), ascending_QMARK_, cnt, null)
};
void 0;
void 0;
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
        var and__3822__auto____6143 = cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, right);
        if(and__3822__auto____6143) {
          return cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, right.left)
        }else {
          return and__3822__auto____6143
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
        var and__3822__auto____6144 = cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, left);
        if(and__3822__auto____6144) {
          return cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, left.right)
        }else {
          return and__3822__auto____6144
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
  var init__6145 = f.call(null, init, node.key, node.val);
  if(cljs.core.reduced_QMARK_.call(null, init__6145)) {
    return cljs.core.deref.call(null, init__6145)
  }else {
    var init__6146 = node.left != null ? tree_map_kv_reduce.call(null, node.left, f, init__6145) : init__6145;
    if(cljs.core.reduced_QMARK_.call(null, init__6146)) {
      return cljs.core.deref.call(null, init__6146)
    }else {
      var init__6147 = node.right != null ? tree_map_kv_reduce.call(null, node.right, f, init__6146) : init__6146;
      if(cljs.core.reduced_QMARK_.call(null, init__6147)) {
        return cljs.core.deref.call(null, init__6147)
      }else {
        return init__6147
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
  this.cljs$lang$protocol_mask$partition0$ = 16201119
};
cljs.core.BlackNode.cljs$lang$type = true;
cljs.core.BlackNode.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.BlackNode")
};
cljs.core.BlackNode.prototype.cljs$core$IHash$ = true;
cljs.core.BlackNode.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__6152 = this;
  var h__364__auto____6153 = this__6152.__hash;
  if(h__364__auto____6153 != null) {
    return h__364__auto____6153
  }else {
    var h__364__auto____6154 = cljs.core.hash_coll.call(null, coll);
    this__6152.__hash = h__364__auto____6154;
    return h__364__auto____6154
  }
};
cljs.core.BlackNode.prototype.cljs$core$ILookup$ = true;
cljs.core.BlackNode.prototype.cljs$core$ILookup$_lookup$arity$2 = function(node, k) {
  var this__6155 = this;
  return cljs.core._nth.call(null, node, k, null)
};
cljs.core.BlackNode.prototype.cljs$core$ILookup$_lookup$arity$3 = function(node, k, not_found) {
  var this__6156 = this;
  return cljs.core._nth.call(null, node, k, not_found)
};
cljs.core.BlackNode.prototype.cljs$core$IAssociative$ = true;
cljs.core.BlackNode.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(node, k, v) {
  var this__6157 = this;
  return cljs.core.assoc.call(null, cljs.core.PersistentVector.fromArray([this__6157.key, this__6157.val]), k, v)
};
cljs.core.BlackNode.prototype.cljs$core$IFn$ = true;
cljs.core.BlackNode.prototype.call = function() {
  var G__6204 = null;
  var G__6204__2 = function(tsym6150, k) {
    var this__6158 = this;
    var tsym6150__6159 = this;
    var node__6160 = tsym6150__6159;
    return cljs.core._lookup.call(null, node__6160, k)
  };
  var G__6204__3 = function(tsym6151, k, not_found) {
    var this__6161 = this;
    var tsym6151__6162 = this;
    var node__6163 = tsym6151__6162;
    return cljs.core._lookup.call(null, node__6163, k, not_found)
  };
  G__6204 = function(tsym6151, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__6204__2.call(this, tsym6151, k);
      case 3:
        return G__6204__3.call(this, tsym6151, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6204
}();
cljs.core.BlackNode.prototype.apply = function(tsym6148, args6149) {
  return tsym6148.call.apply(tsym6148, [tsym6148].concat(cljs.core.aclone.call(null, args6149)))
};
cljs.core.BlackNode.prototype.cljs$core$ISequential$ = true;
cljs.core.BlackNode.prototype.cljs$core$ICollection$ = true;
cljs.core.BlackNode.prototype.cljs$core$ICollection$_conj$arity$2 = function(node, o) {
  var this__6164 = this;
  return cljs.core.PersistentVector.fromArray([this__6164.key, this__6164.val, o])
};
cljs.core.BlackNode.prototype.cljs$core$IMapEntry$ = true;
cljs.core.BlackNode.prototype.cljs$core$IMapEntry$_key$arity$1 = function(node) {
  var this__6165 = this;
  return this__6165.key
};
cljs.core.BlackNode.prototype.cljs$core$IMapEntry$_val$arity$1 = function(node) {
  var this__6166 = this;
  return this__6166.val
};
cljs.core.BlackNode.prototype.add_right = function(ins) {
  var this__6167 = this;
  var node__6168 = this;
  return ins.balance_right(node__6168)
};
cljs.core.BlackNode.prototype.redden = function() {
  var this__6169 = this;
  var node__6170 = this;
  return new cljs.core.RedNode(this__6169.key, this__6169.val, this__6169.left, this__6169.right, null)
};
cljs.core.BlackNode.prototype.remove_right = function(del) {
  var this__6171 = this;
  var node__6172 = this;
  return cljs.core.balance_right_del.call(null, this__6171.key, this__6171.val, this__6171.left, del)
};
cljs.core.BlackNode.prototype.replace = function(key, val, left, right) {
  var this__6173 = this;
  var node__6174 = this;
  return new cljs.core.BlackNode(key, val, left, right, null)
};
cljs.core.BlackNode.prototype.kv_reduce = function(f, init) {
  var this__6175 = this;
  var node__6176 = this;
  return cljs.core.tree_map_kv_reduce.call(null, node__6176, f, init)
};
cljs.core.BlackNode.prototype.remove_left = function(del) {
  var this__6177 = this;
  var node__6178 = this;
  return cljs.core.balance_left_del.call(null, this__6177.key, this__6177.val, del, this__6177.right)
};
cljs.core.BlackNode.prototype.add_left = function(ins) {
  var this__6179 = this;
  var node__6180 = this;
  return ins.balance_left(node__6180)
};
cljs.core.BlackNode.prototype.balance_left = function(parent) {
  var this__6181 = this;
  var node__6182 = this;
  return new cljs.core.BlackNode(parent.key, parent.val, node__6182, parent.right, null)
};
cljs.core.BlackNode.prototype.toString = function() {
  var G__6205 = null;
  var G__6205__0 = function() {
    var this__6185 = this;
    var this$__6186 = this;
    return cljs.core.pr_str.call(null, this$__6186)
  };
  G__6205 = function() {
    switch(arguments.length) {
      case 0:
        return G__6205__0.call(this)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6205
}();
cljs.core.BlackNode.prototype.balance_right = function(parent) {
  var this__6187 = this;
  var node__6188 = this;
  return new cljs.core.BlackNode(parent.key, parent.val, parent.left, node__6188, null)
};
cljs.core.BlackNode.prototype.blacken = function() {
  var this__6189 = this;
  var node__6190 = this;
  return node__6190
};
cljs.core.BlackNode.prototype.cljs$core$IReduce$ = true;
cljs.core.BlackNode.prototype.cljs$core$IReduce$_reduce$arity$2 = function(node, f) {
  var this__6191 = this;
  return cljs.core.ci_reduce.call(null, node, f)
};
cljs.core.BlackNode.prototype.cljs$core$IReduce$_reduce$arity$3 = function(node, f, start) {
  var this__6192 = this;
  return cljs.core.ci_reduce.call(null, node, f, start)
};
cljs.core.BlackNode.prototype.cljs$core$ISeqable$ = true;
cljs.core.BlackNode.prototype.cljs$core$ISeqable$_seq$arity$1 = function(node) {
  var this__6193 = this;
  return cljs.core.list.call(null, this__6193.key, this__6193.val)
};
cljs.core.BlackNode.prototype.cljs$core$ICounted$ = true;
cljs.core.BlackNode.prototype.cljs$core$ICounted$_count$arity$1 = function(node) {
  var this__6195 = this;
  return 2
};
cljs.core.BlackNode.prototype.cljs$core$IStack$ = true;
cljs.core.BlackNode.prototype.cljs$core$IStack$_peek$arity$1 = function(node) {
  var this__6196 = this;
  return this__6196.val
};
cljs.core.BlackNode.prototype.cljs$core$IStack$_pop$arity$1 = function(node) {
  var this__6197 = this;
  return cljs.core.PersistentVector.fromArray([this__6197.key])
};
cljs.core.BlackNode.prototype.cljs$core$IVector$ = true;
cljs.core.BlackNode.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(node, n, v) {
  var this__6198 = this;
  return cljs.core._assoc_n.call(null, cljs.core.PersistentVector.fromArray([this__6198.key, this__6198.val]), n, v)
};
cljs.core.BlackNode.prototype.cljs$core$IEquiv$ = true;
cljs.core.BlackNode.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__6199 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.BlackNode.prototype.cljs$core$IWithMeta$ = true;
cljs.core.BlackNode.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(node, meta) {
  var this__6200 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.fromArray([this__6200.key, this__6200.val]), meta)
};
cljs.core.BlackNode.prototype.cljs$core$IMeta$ = true;
cljs.core.BlackNode.prototype.cljs$core$IMeta$_meta$arity$1 = function(node) {
  var this__6201 = this;
  return null
};
cljs.core.BlackNode.prototype.cljs$core$IIndexed$ = true;
cljs.core.BlackNode.prototype.cljs$core$IIndexed$_nth$arity$2 = function(node, n) {
  var this__6202 = this;
  if(n === 0) {
    return this__6202.key
  }else {
    if(n === 1) {
      return this__6202.val
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
  var this__6203 = this;
  if(n === 0) {
    return this__6203.key
  }else {
    if(n === 1) {
      return this__6203.val
    }else {
      if("\ufdd0'else") {
        return not_found
      }else {
        return null
      }
    }
  }
};
cljs.core.BlackNode.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.BlackNode.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(node) {
  var this__6194 = this;
  return cljs.core.PersistentVector.fromArray([])
};
cljs.core.BlackNode;
cljs.core.RedNode = function(key, val, left, right, __hash) {
  this.key = key;
  this.val = val;
  this.left = left;
  this.right = right;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 16201119
};
cljs.core.RedNode.cljs$lang$type = true;
cljs.core.RedNode.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.RedNode")
};
cljs.core.RedNode.prototype.cljs$core$IHash$ = true;
cljs.core.RedNode.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__6210 = this;
  var h__364__auto____6211 = this__6210.__hash;
  if(h__364__auto____6211 != null) {
    return h__364__auto____6211
  }else {
    var h__364__auto____6212 = cljs.core.hash_coll.call(null, coll);
    this__6210.__hash = h__364__auto____6212;
    return h__364__auto____6212
  }
};
cljs.core.RedNode.prototype.cljs$core$ILookup$ = true;
cljs.core.RedNode.prototype.cljs$core$ILookup$_lookup$arity$2 = function(node, k) {
  var this__6213 = this;
  return cljs.core._nth.call(null, node, k, null)
};
cljs.core.RedNode.prototype.cljs$core$ILookup$_lookup$arity$3 = function(node, k, not_found) {
  var this__6214 = this;
  return cljs.core._nth.call(null, node, k, not_found)
};
cljs.core.RedNode.prototype.cljs$core$IAssociative$ = true;
cljs.core.RedNode.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(node, k, v) {
  var this__6215 = this;
  return cljs.core.assoc.call(null, cljs.core.PersistentVector.fromArray([this__6215.key, this__6215.val]), k, v)
};
cljs.core.RedNode.prototype.cljs$core$IFn$ = true;
cljs.core.RedNode.prototype.call = function() {
  var G__6262 = null;
  var G__6262__2 = function(tsym6208, k) {
    var this__6216 = this;
    var tsym6208__6217 = this;
    var node__6218 = tsym6208__6217;
    return cljs.core._lookup.call(null, node__6218, k)
  };
  var G__6262__3 = function(tsym6209, k, not_found) {
    var this__6219 = this;
    var tsym6209__6220 = this;
    var node__6221 = tsym6209__6220;
    return cljs.core._lookup.call(null, node__6221, k, not_found)
  };
  G__6262 = function(tsym6209, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__6262__2.call(this, tsym6209, k);
      case 3:
        return G__6262__3.call(this, tsym6209, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6262
}();
cljs.core.RedNode.prototype.apply = function(tsym6206, args6207) {
  return tsym6206.call.apply(tsym6206, [tsym6206].concat(cljs.core.aclone.call(null, args6207)))
};
cljs.core.RedNode.prototype.cljs$core$ISequential$ = true;
cljs.core.RedNode.prototype.cljs$core$ICollection$ = true;
cljs.core.RedNode.prototype.cljs$core$ICollection$_conj$arity$2 = function(node, o) {
  var this__6222 = this;
  return cljs.core.PersistentVector.fromArray([this__6222.key, this__6222.val, o])
};
cljs.core.RedNode.prototype.cljs$core$IMapEntry$ = true;
cljs.core.RedNode.prototype.cljs$core$IMapEntry$_key$arity$1 = function(node) {
  var this__6223 = this;
  return this__6223.key
};
cljs.core.RedNode.prototype.cljs$core$IMapEntry$_val$arity$1 = function(node) {
  var this__6224 = this;
  return this__6224.val
};
cljs.core.RedNode.prototype.add_right = function(ins) {
  var this__6225 = this;
  var node__6226 = this;
  return new cljs.core.RedNode(this__6225.key, this__6225.val, this__6225.left, ins, null)
};
cljs.core.RedNode.prototype.redden = function() {
  var this__6227 = this;
  var node__6228 = this;
  throw new Error("red-black tree invariant violation");
};
cljs.core.RedNode.prototype.remove_right = function(del) {
  var this__6229 = this;
  var node__6230 = this;
  return new cljs.core.RedNode(this__6229.key, this__6229.val, this__6229.left, del, null)
};
cljs.core.RedNode.prototype.replace = function(key, val, left, right) {
  var this__6231 = this;
  var node__6232 = this;
  return new cljs.core.RedNode(key, val, left, right, null)
};
cljs.core.RedNode.prototype.kv_reduce = function(f, init) {
  var this__6233 = this;
  var node__6234 = this;
  return cljs.core.tree_map_kv_reduce.call(null, node__6234, f, init)
};
cljs.core.RedNode.prototype.remove_left = function(del) {
  var this__6235 = this;
  var node__6236 = this;
  return new cljs.core.RedNode(this__6235.key, this__6235.val, del, this__6235.right, null)
};
cljs.core.RedNode.prototype.add_left = function(ins) {
  var this__6237 = this;
  var node__6238 = this;
  return new cljs.core.RedNode(this__6237.key, this__6237.val, ins, this__6237.right, null)
};
cljs.core.RedNode.prototype.balance_left = function(parent) {
  var this__6239 = this;
  var node__6240 = this;
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__6239.left)) {
    return new cljs.core.RedNode(this__6239.key, this__6239.val, this__6239.left.blacken(), new cljs.core.BlackNode(parent.key, parent.val, this__6239.right, parent.right, null), null)
  }else {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__6239.right)) {
      return new cljs.core.RedNode(this__6239.right.key, this__6239.right.val, new cljs.core.BlackNode(this__6239.key, this__6239.val, this__6239.left, this__6239.right.left, null), new cljs.core.BlackNode(parent.key, parent.val, this__6239.right.right, parent.right, null), null)
    }else {
      if("\ufdd0'else") {
        return new cljs.core.BlackNode(parent.key, parent.val, node__6240, parent.right, null)
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.toString = function() {
  var G__6263 = null;
  var G__6263__0 = function() {
    var this__6243 = this;
    var this$__6244 = this;
    return cljs.core.pr_str.call(null, this$__6244)
  };
  G__6263 = function() {
    switch(arguments.length) {
      case 0:
        return G__6263__0.call(this)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6263
}();
cljs.core.RedNode.prototype.balance_right = function(parent) {
  var this__6245 = this;
  var node__6246 = this;
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__6245.right)) {
    return new cljs.core.RedNode(this__6245.key, this__6245.val, new cljs.core.BlackNode(parent.key, parent.val, parent.left, this__6245.left, null), this__6245.right.blacken(), null)
  }else {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__6245.left)) {
      return new cljs.core.RedNode(this__6245.left.key, this__6245.left.val, new cljs.core.BlackNode(parent.key, parent.val, parent.left, this__6245.left.left, null), new cljs.core.BlackNode(this__6245.key, this__6245.val, this__6245.left.right, this__6245.right, null), null)
    }else {
      if("\ufdd0'else") {
        return new cljs.core.BlackNode(parent.key, parent.val, parent.left, node__6246, null)
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.blacken = function() {
  var this__6247 = this;
  var node__6248 = this;
  return new cljs.core.BlackNode(this__6247.key, this__6247.val, this__6247.left, this__6247.right, null)
};
cljs.core.RedNode.prototype.cljs$core$IReduce$ = true;
cljs.core.RedNode.prototype.cljs$core$IReduce$_reduce$arity$2 = function(node, f) {
  var this__6249 = this;
  return cljs.core.ci_reduce.call(null, node, f)
};
cljs.core.RedNode.prototype.cljs$core$IReduce$_reduce$arity$3 = function(node, f, start) {
  var this__6250 = this;
  return cljs.core.ci_reduce.call(null, node, f, start)
};
cljs.core.RedNode.prototype.cljs$core$ISeqable$ = true;
cljs.core.RedNode.prototype.cljs$core$ISeqable$_seq$arity$1 = function(node) {
  var this__6251 = this;
  return cljs.core.list.call(null, this__6251.key, this__6251.val)
};
cljs.core.RedNode.prototype.cljs$core$ICounted$ = true;
cljs.core.RedNode.prototype.cljs$core$ICounted$_count$arity$1 = function(node) {
  var this__6253 = this;
  return 2
};
cljs.core.RedNode.prototype.cljs$core$IStack$ = true;
cljs.core.RedNode.prototype.cljs$core$IStack$_peek$arity$1 = function(node) {
  var this__6254 = this;
  return this__6254.val
};
cljs.core.RedNode.prototype.cljs$core$IStack$_pop$arity$1 = function(node) {
  var this__6255 = this;
  return cljs.core.PersistentVector.fromArray([this__6255.key])
};
cljs.core.RedNode.prototype.cljs$core$IVector$ = true;
cljs.core.RedNode.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(node, n, v) {
  var this__6256 = this;
  return cljs.core._assoc_n.call(null, cljs.core.PersistentVector.fromArray([this__6256.key, this__6256.val]), n, v)
};
cljs.core.RedNode.prototype.cljs$core$IEquiv$ = true;
cljs.core.RedNode.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__6257 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.RedNode.prototype.cljs$core$IWithMeta$ = true;
cljs.core.RedNode.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(node, meta) {
  var this__6258 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.fromArray([this__6258.key, this__6258.val]), meta)
};
cljs.core.RedNode.prototype.cljs$core$IMeta$ = true;
cljs.core.RedNode.prototype.cljs$core$IMeta$_meta$arity$1 = function(node) {
  var this__6259 = this;
  return null
};
cljs.core.RedNode.prototype.cljs$core$IIndexed$ = true;
cljs.core.RedNode.prototype.cljs$core$IIndexed$_nth$arity$2 = function(node, n) {
  var this__6260 = this;
  if(n === 0) {
    return this__6260.key
  }else {
    if(n === 1) {
      return this__6260.val
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
  var this__6261 = this;
  if(n === 0) {
    return this__6261.key
  }else {
    if(n === 1) {
      return this__6261.val
    }else {
      if("\ufdd0'else") {
        return not_found
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.RedNode.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(node) {
  var this__6252 = this;
  return cljs.core.PersistentVector.fromArray([])
};
cljs.core.RedNode;
cljs.core.tree_map_add = function tree_map_add(comp, tree, k, v, found) {
  if(tree == null) {
    return new cljs.core.RedNode(k, v, null, null, null)
  }else {
    var c__6264 = comp.call(null, k, tree.key);
    if(c__6264 === 0) {
      found[0] = tree;
      return null
    }else {
      if(c__6264 < 0) {
        var ins__6265 = tree_map_add.call(null, comp, tree.left, k, v, found);
        if(ins__6265 != null) {
          return tree.add_left(ins__6265)
        }else {
          return null
        }
      }else {
        if("\ufdd0'else") {
          var ins__6266 = tree_map_add.call(null, comp, tree.right, k, v, found);
          if(ins__6266 != null) {
            return tree.add_right(ins__6266)
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
          var app__6267 = tree_map_append.call(null, left.right, right.left);
          if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, app__6267)) {
            return new cljs.core.RedNode(app__6267.key, app__6267.val, new cljs.core.RedNode(left.key, left.val, left.left, app__6267.left), new cljs.core.RedNode(right.key, right.val, app__6267.right, right.right), null)
          }else {
            return new cljs.core.RedNode(left.key, left.val, left.left, new cljs.core.RedNode(right.key, right.val, app__6267, right.right, null), null)
          }
        }else {
          return new cljs.core.RedNode(left.key, left.val, left.left, tree_map_append.call(null, left.right, right), null)
        }
      }else {
        if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, right)) {
          return new cljs.core.RedNode(right.key, right.val, tree_map_append.call(null, left, right.left), right.right, null)
        }else {
          if("\ufdd0'else") {
            var app__6268 = tree_map_append.call(null, left.right, right.left);
            if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, app__6268)) {
              return new cljs.core.RedNode(app__6268.key, app__6268.val, new cljs.core.BlackNode(left.key, left.val, left.left, app__6268.left, null), new cljs.core.BlackNode(right.key, right.val, app__6268.right, right.right, null), null)
            }else {
              return cljs.core.balance_left_del.call(null, left.key, left.val, left.left, new cljs.core.BlackNode(right.key, right.val, app__6268, right.right, null))
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
  if(tree != null) {
    var c__6269 = comp.call(null, k, tree.key);
    if(c__6269 === 0) {
      found[0] = tree;
      return cljs.core.tree_map_append.call(null, tree.left, tree.right)
    }else {
      if(c__6269 < 0) {
        var del__6270 = tree_map_remove.call(null, comp, tree.left, k, found);
        if(function() {
          var or__3824__auto____6271 = del__6270 != null;
          if(or__3824__auto____6271) {
            return or__3824__auto____6271
          }else {
            return found[0] != null
          }
        }()) {
          if(cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, tree.left)) {
            return cljs.core.balance_left_del.call(null, tree.key, tree.val, del__6270, tree.right)
          }else {
            return new cljs.core.RedNode(tree.key, tree.val, del__6270, tree.right, null)
          }
        }else {
          return null
        }
      }else {
        if("\ufdd0'else") {
          var del__6272 = tree_map_remove.call(null, comp, tree.right, k, found);
          if(function() {
            var or__3824__auto____6273 = del__6272 != null;
            if(or__3824__auto____6273) {
              return or__3824__auto____6273
            }else {
              return found[0] != null
            }
          }()) {
            if(cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, tree.right)) {
              return cljs.core.balance_right_del.call(null, tree.key, tree.val, tree.left, del__6272)
            }else {
              return new cljs.core.RedNode(tree.key, tree.val, tree.left, del__6272, null)
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
  var tk__6274 = tree.key;
  var c__6275 = comp.call(null, k, tk__6274);
  if(c__6275 === 0) {
    return tree.replace(tk__6274, v, tree.left, tree.right)
  }else {
    if(c__6275 < 0) {
      return tree.replace(tk__6274, tree.val, tree_map_replace.call(null, comp, tree.left, k, v), tree.right)
    }else {
      if("\ufdd0'else") {
        return tree.replace(tk__6274, tree.val, tree.left, tree_map_replace.call(null, comp, tree.right, k, v))
      }else {
        return null
      }
    }
  }
};
void 0;
cljs.core.PersistentTreeMap = function(comp, tree, cnt, meta, __hash) {
  this.comp = comp;
  this.tree = tree;
  this.cnt = cnt;
  this.meta = meta;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 209388431
};
cljs.core.PersistentTreeMap.cljs$lang$type = true;
cljs.core.PersistentTreeMap.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.PersistentTreeMap")
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IHash$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__6280 = this;
  var h__364__auto____6281 = this__6280.__hash;
  if(h__364__auto____6281 != null) {
    return h__364__auto____6281
  }else {
    var h__364__auto____6282 = cljs.core.hash_imap.call(null, coll);
    this__6280.__hash = h__364__auto____6282;
    return h__364__auto____6282
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ILookup$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__6283 = this;
  return cljs.core._lookup.call(null, coll, k, null)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__6284 = this;
  var n__6285 = coll.entry_at(k);
  if(n__6285 != null) {
    return n__6285.val
  }else {
    return not_found
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IAssociative$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__6286 = this;
  var found__6287 = [null];
  var t__6288 = cljs.core.tree_map_add.call(null, this__6286.comp, this__6286.tree, k, v, found__6287);
  if(t__6288 == null) {
    var found_node__6289 = cljs.core.nth.call(null, found__6287, 0);
    if(cljs.core._EQ_.call(null, v, found_node__6289.val)) {
      return coll
    }else {
      return new cljs.core.PersistentTreeMap(this__6286.comp, cljs.core.tree_map_replace.call(null, this__6286.comp, this__6286.tree, k, v), this__6286.cnt, this__6286.meta, null)
    }
  }else {
    return new cljs.core.PersistentTreeMap(this__6286.comp, t__6288.blacken(), this__6286.cnt + 1, this__6286.meta, null)
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__6290 = this;
  return coll.entry_at(k) != null
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IFn$ = true;
cljs.core.PersistentTreeMap.prototype.call = function() {
  var G__6322 = null;
  var G__6322__2 = function(tsym6278, k) {
    var this__6291 = this;
    var tsym6278__6292 = this;
    var coll__6293 = tsym6278__6292;
    return cljs.core._lookup.call(null, coll__6293, k)
  };
  var G__6322__3 = function(tsym6279, k, not_found) {
    var this__6294 = this;
    var tsym6279__6295 = this;
    var coll__6296 = tsym6279__6295;
    return cljs.core._lookup.call(null, coll__6296, k, not_found)
  };
  G__6322 = function(tsym6279, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__6322__2.call(this, tsym6279, k);
      case 3:
        return G__6322__3.call(this, tsym6279, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6322
}();
cljs.core.PersistentTreeMap.prototype.apply = function(tsym6276, args6277) {
  return tsym6276.call.apply(tsym6276, [tsym6276].concat(cljs.core.aclone.call(null, args6277)))
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IKVReduce$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(coll, f, init) {
  var this__6297 = this;
  if(this__6297.tree != null) {
    return cljs.core.tree_map_kv_reduce.call(null, this__6297.tree, f, init)
  }else {
    return init
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ICollection$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__6298 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return cljs.core._assoc.call(null, coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IReversible$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__6299 = this;
  if(this__6299.cnt > 0) {
    return cljs.core.create_tree_map_seq.call(null, this__6299.tree, false, this__6299.cnt)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.toString = function() {
  var this__6300 = this;
  var this$__6301 = this;
  return cljs.core.pr_str.call(null, this$__6301)
};
cljs.core.PersistentTreeMap.prototype.entry_at = function(k) {
  var this__6302 = this;
  var coll__6303 = this;
  var t__6304 = this__6302.tree;
  while(true) {
    if(t__6304 != null) {
      var c__6305 = this__6302.comp.call(null, k, t__6304.key);
      if(c__6305 === 0) {
        return t__6304
      }else {
        if(c__6305 < 0) {
          var G__6323 = t__6304.left;
          t__6304 = G__6323;
          continue
        }else {
          if("\ufdd0'else") {
            var G__6324 = t__6304.right;
            t__6304 = G__6324;
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
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_sorted_seq$arity$2 = function(coll, ascending_QMARK_) {
  var this__6306 = this;
  if(this__6306.cnt > 0) {
    return cljs.core.create_tree_map_seq.call(null, this__6306.tree, ascending_QMARK_, this__6306.cnt)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_sorted_seq_from$arity$3 = function(coll, k, ascending_QMARK_) {
  var this__6307 = this;
  if(this__6307.cnt > 0) {
    var stack__6308 = null;
    var t__6309 = this__6307.tree;
    while(true) {
      if(t__6309 != null) {
        var c__6310 = this__6307.comp.call(null, k, t__6309.key);
        if(c__6310 === 0) {
          return new cljs.core.PersistentTreeMapSeq(null, cljs.core.conj.call(null, stack__6308, t__6309), ascending_QMARK_, -1)
        }else {
          if(cljs.core.truth_(ascending_QMARK_)) {
            if(c__6310 < 0) {
              var G__6325 = cljs.core.conj.call(null, stack__6308, t__6309);
              var G__6326 = t__6309.left;
              stack__6308 = G__6325;
              t__6309 = G__6326;
              continue
            }else {
              var G__6327 = stack__6308;
              var G__6328 = t__6309.right;
              stack__6308 = G__6327;
              t__6309 = G__6328;
              continue
            }
          }else {
            if("\ufdd0'else") {
              if(c__6310 > 0) {
                var G__6329 = cljs.core.conj.call(null, stack__6308, t__6309);
                var G__6330 = t__6309.right;
                stack__6308 = G__6329;
                t__6309 = G__6330;
                continue
              }else {
                var G__6331 = stack__6308;
                var G__6332 = t__6309.left;
                stack__6308 = G__6331;
                t__6309 = G__6332;
                continue
              }
            }else {
              return null
            }
          }
        }
      }else {
        if(stack__6308 == null) {
          return new cljs.core.PersistentTreeMapSeq(null, stack__6308, ascending_QMARK_, -1)
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
  var this__6311 = this;
  return cljs.core.key.call(null, entry)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_comparator$arity$1 = function(coll) {
  var this__6312 = this;
  return this__6312.comp
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISeqable$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__6313 = this;
  if(this__6313.cnt > 0) {
    return cljs.core.create_tree_map_seq.call(null, this__6313.tree, true, this__6313.cnt)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ICounted$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__6314 = this;
  return this__6314.cnt
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IEquiv$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__6315 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IWithMeta$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__6316 = this;
  return new cljs.core.PersistentTreeMap(this__6316.comp, this__6316.tree, this__6316.cnt, meta, this__6316.__hash)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IMeta$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__6320 = this;
  return this__6320.meta
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__6321 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentTreeMap.EMPTY, this__6321.meta)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IMap$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__6317 = this;
  var found__6318 = [null];
  var t__6319 = cljs.core.tree_map_remove.call(null, this__6317.comp, this__6317.tree, k, found__6318);
  if(t__6319 == null) {
    if(cljs.core.nth.call(null, found__6318, 0) == null) {
      return coll
    }else {
      return new cljs.core.PersistentTreeMap(this__6317.comp, null, 0, this__6317.meta, null)
    }
  }else {
    return new cljs.core.PersistentTreeMap(this__6317.comp, t__6319.blacken(), this__6317.cnt - 1, this__6317.meta, null)
  }
};
cljs.core.PersistentTreeMap;
cljs.core.PersistentTreeMap.EMPTY = new cljs.core.PersistentTreeMap(cljs.core.compare, null, 0, null, 0);
cljs.core.hash_map = function() {
  var hash_map__delegate = function(keyvals) {
    var in$__6333 = cljs.core.seq.call(null, keyvals);
    var out__6334 = cljs.core.transient$.call(null, cljs.core.PersistentHashMap.EMPTY);
    while(true) {
      if(cljs.core.truth_(in$__6333)) {
        var G__6335 = cljs.core.nnext.call(null, in$__6333);
        var G__6336 = cljs.core.assoc_BANG_.call(null, out__6334, cljs.core.first.call(null, in$__6333), cljs.core.second.call(null, in$__6333));
        in$__6333 = G__6335;
        out__6334 = G__6336;
        continue
      }else {
        return cljs.core.persistent_BANG_.call(null, out__6334)
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
  hash_map.cljs$lang$applyTo = function(arglist__6337) {
    var keyvals = cljs.core.seq(arglist__6337);
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
  array_map.cljs$lang$applyTo = function(arglist__6338) {
    var keyvals = cljs.core.seq(arglist__6338);
    return array_map__delegate(keyvals)
  };
  array_map.cljs$lang$arity$variadic = array_map__delegate;
  return array_map
}();
cljs.core.sorted_map = function() {
  var sorted_map__delegate = function(keyvals) {
    var in$__6339 = cljs.core.seq.call(null, keyvals);
    var out__6340 = cljs.core.PersistentTreeMap.EMPTY;
    while(true) {
      if(cljs.core.truth_(in$__6339)) {
        var G__6341 = cljs.core.nnext.call(null, in$__6339);
        var G__6342 = cljs.core.assoc.call(null, out__6340, cljs.core.first.call(null, in$__6339), cljs.core.second.call(null, in$__6339));
        in$__6339 = G__6341;
        out__6340 = G__6342;
        continue
      }else {
        return out__6340
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
  sorted_map.cljs$lang$applyTo = function(arglist__6343) {
    var keyvals = cljs.core.seq(arglist__6343);
    return sorted_map__delegate(keyvals)
  };
  sorted_map.cljs$lang$arity$variadic = sorted_map__delegate;
  return sorted_map
}();
cljs.core.sorted_map_by = function() {
  var sorted_map_by__delegate = function(comparator, keyvals) {
    var in$__6344 = cljs.core.seq.call(null, keyvals);
    var out__6345 = new cljs.core.PersistentTreeMap(comparator, null, 0, null, 0);
    while(true) {
      if(cljs.core.truth_(in$__6344)) {
        var G__6346 = cljs.core.nnext.call(null, in$__6344);
        var G__6347 = cljs.core.assoc.call(null, out__6345, cljs.core.first.call(null, in$__6344), cljs.core.second.call(null, in$__6344));
        in$__6344 = G__6346;
        out__6345 = G__6347;
        continue
      }else {
        return out__6345
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
  sorted_map_by.cljs$lang$applyTo = function(arglist__6348) {
    var comparator = cljs.core.first(arglist__6348);
    var keyvals = cljs.core.rest(arglist__6348);
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
      return cljs.core.reduce.call(null, function(p1__6349_SHARP_, p2__6350_SHARP_) {
        return cljs.core.conj.call(null, function() {
          var or__3824__auto____6351 = p1__6349_SHARP_;
          if(cljs.core.truth_(or__3824__auto____6351)) {
            return or__3824__auto____6351
          }else {
            return cljs.core.ObjMap.fromObject([], {})
          }
        }(), p2__6350_SHARP_)
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
  merge.cljs$lang$applyTo = function(arglist__6352) {
    var maps = cljs.core.seq(arglist__6352);
    return merge__delegate(maps)
  };
  merge.cljs$lang$arity$variadic = merge__delegate;
  return merge
}();
cljs.core.merge_with = function() {
  var merge_with__delegate = function(f, maps) {
    if(cljs.core.truth_(cljs.core.some.call(null, cljs.core.identity, maps))) {
      var merge_entry__6355 = function(m, e) {
        var k__6353 = cljs.core.first.call(null, e);
        var v__6354 = cljs.core.second.call(null, e);
        if(cljs.core.contains_QMARK_.call(null, m, k__6353)) {
          return cljs.core.assoc.call(null, m, k__6353, f.call(null, cljs.core.get.call(null, m, k__6353), v__6354))
        }else {
          return cljs.core.assoc.call(null, m, k__6353, v__6354)
        }
      };
      var merge2__6357 = function(m1, m2) {
        return cljs.core.reduce.call(null, merge_entry__6355, function() {
          var or__3824__auto____6356 = m1;
          if(cljs.core.truth_(or__3824__auto____6356)) {
            return or__3824__auto____6356
          }else {
            return cljs.core.ObjMap.fromObject([], {})
          }
        }(), cljs.core.seq.call(null, m2))
      };
      return cljs.core.reduce.call(null, merge2__6357, maps)
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
  merge_with.cljs$lang$applyTo = function(arglist__6358) {
    var f = cljs.core.first(arglist__6358);
    var maps = cljs.core.rest(arglist__6358);
    return merge_with__delegate(f, maps)
  };
  merge_with.cljs$lang$arity$variadic = merge_with__delegate;
  return merge_with
}();
cljs.core.select_keys = function select_keys(map, keyseq) {
  var ret__6359 = cljs.core.ObjMap.fromObject([], {});
  var keys__6360 = cljs.core.seq.call(null, keyseq);
  while(true) {
    if(cljs.core.truth_(keys__6360)) {
      var key__6361 = cljs.core.first.call(null, keys__6360);
      var entry__6362 = cljs.core.get.call(null, map, key__6361, "\ufdd0'user/not-found");
      var G__6363 = cljs.core.not_EQ_.call(null, entry__6362, "\ufdd0'user/not-found") ? cljs.core.assoc.call(null, ret__6359, key__6361, entry__6362) : ret__6359;
      var G__6364 = cljs.core.next.call(null, keys__6360);
      ret__6359 = G__6363;
      keys__6360 = G__6364;
      continue
    }else {
      return ret__6359
    }
    break
  }
};
void 0;
cljs.core.PersistentHashSet = function(meta, hash_map, __hash) {
  this.meta = meta;
  this.hash_map = hash_map;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 2155022479
};
cljs.core.PersistentHashSet.cljs$lang$type = true;
cljs.core.PersistentHashSet.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.PersistentHashSet")
};
cljs.core.PersistentHashSet.prototype.cljs$core$IEditableCollection$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var this__6370 = this;
  return new cljs.core.TransientHashSet(cljs.core.transient$.call(null, this__6370.hash_map))
};
cljs.core.PersistentHashSet.prototype.cljs$core$IHash$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__6371 = this;
  var h__364__auto____6372 = this__6371.__hash;
  if(h__364__auto____6372 != null) {
    return h__364__auto____6372
  }else {
    var h__364__auto____6373 = cljs.core.hash_iset.call(null, coll);
    this__6371.__hash = h__364__auto____6373;
    return h__364__auto____6373
  }
};
cljs.core.PersistentHashSet.prototype.cljs$core$ILookup$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, v) {
  var this__6374 = this;
  return cljs.core._lookup.call(null, coll, v, null)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, v, not_found) {
  var this__6375 = this;
  if(cljs.core.truth_(cljs.core._contains_key_QMARK_.call(null, this__6375.hash_map, v))) {
    return v
  }else {
    return not_found
  }
};
cljs.core.PersistentHashSet.prototype.cljs$core$IFn$ = true;
cljs.core.PersistentHashSet.prototype.call = function() {
  var G__6394 = null;
  var G__6394__2 = function(tsym6368, k) {
    var this__6376 = this;
    var tsym6368__6377 = this;
    var coll__6378 = tsym6368__6377;
    return cljs.core._lookup.call(null, coll__6378, k)
  };
  var G__6394__3 = function(tsym6369, k, not_found) {
    var this__6379 = this;
    var tsym6369__6380 = this;
    var coll__6381 = tsym6369__6380;
    return cljs.core._lookup.call(null, coll__6381, k, not_found)
  };
  G__6394 = function(tsym6369, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__6394__2.call(this, tsym6369, k);
      case 3:
        return G__6394__3.call(this, tsym6369, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6394
}();
cljs.core.PersistentHashSet.prototype.apply = function(tsym6366, args6367) {
  return tsym6366.call.apply(tsym6366, [tsym6366].concat(cljs.core.aclone.call(null, args6367)))
};
cljs.core.PersistentHashSet.prototype.cljs$core$ICollection$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__6382 = this;
  return new cljs.core.PersistentHashSet(this__6382.meta, cljs.core.assoc.call(null, this__6382.hash_map, o, null), null)
};
cljs.core.PersistentHashSet.prototype.toString = function() {
  var this__6383 = this;
  var this$__6384 = this;
  return cljs.core.pr_str.call(null, this$__6384)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ISeqable$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__6385 = this;
  return cljs.core.keys.call(null, this__6385.hash_map)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ISet$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$ISet$_disjoin$arity$2 = function(coll, v) {
  var this__6386 = this;
  return new cljs.core.PersistentHashSet(this__6386.meta, cljs.core.dissoc.call(null, this__6386.hash_map, v), null)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ICounted$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__6387 = this;
  return cljs.core.count.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.PersistentHashSet.prototype.cljs$core$IEquiv$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__6388 = this;
  var and__3822__auto____6389 = cljs.core.set_QMARK_.call(null, other);
  if(and__3822__auto____6389) {
    var and__3822__auto____6390 = cljs.core.count.call(null, coll) === cljs.core.count.call(null, other);
    if(and__3822__auto____6390) {
      return cljs.core.every_QMARK_.call(null, function(p1__6365_SHARP_) {
        return cljs.core.contains_QMARK_.call(null, coll, p1__6365_SHARP_)
      }, other)
    }else {
      return and__3822__auto____6390
    }
  }else {
    return and__3822__auto____6389
  }
};
cljs.core.PersistentHashSet.prototype.cljs$core$IWithMeta$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__6391 = this;
  return new cljs.core.PersistentHashSet(meta, this__6391.hash_map, this__6391.__hash)
};
cljs.core.PersistentHashSet.prototype.cljs$core$IMeta$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__6392 = this;
  return this__6392.meta
};
cljs.core.PersistentHashSet.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__6393 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentHashSet.EMPTY, this__6393.meta)
};
cljs.core.PersistentHashSet;
cljs.core.PersistentHashSet.EMPTY = new cljs.core.PersistentHashSet(null, cljs.core.hash_map.call(null), 0);
cljs.core.TransientHashSet = function(transient_map) {
  this.transient_map = transient_map;
  this.cljs$lang$protocol_mask$partition0$ = 131;
  this.cljs$lang$protocol_mask$partition1$ = 17
};
cljs.core.TransientHashSet.cljs$lang$type = true;
cljs.core.TransientHashSet.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.TransientHashSet")
};
cljs.core.TransientHashSet.prototype.cljs$core$IFn$ = true;
cljs.core.TransientHashSet.prototype.call = function() {
  var G__6412 = null;
  var G__6412__2 = function(tsym6398, k) {
    var this__6400 = this;
    var tsym6398__6401 = this;
    var tcoll__6402 = tsym6398__6401;
    if(cljs.core._lookup.call(null, this__6400.transient_map, k, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
      return null
    }else {
      return k
    }
  };
  var G__6412__3 = function(tsym6399, k, not_found) {
    var this__6403 = this;
    var tsym6399__6404 = this;
    var tcoll__6405 = tsym6399__6404;
    if(cljs.core._lookup.call(null, this__6403.transient_map, k, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
      return not_found
    }else {
      return k
    }
  };
  G__6412 = function(tsym6399, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__6412__2.call(this, tsym6399, k);
      case 3:
        return G__6412__3.call(this, tsym6399, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6412
}();
cljs.core.TransientHashSet.prototype.apply = function(tsym6396, args6397) {
  return tsym6396.call.apply(tsym6396, [tsym6396].concat(cljs.core.aclone.call(null, args6397)))
};
cljs.core.TransientHashSet.prototype.cljs$core$ILookup$ = true;
cljs.core.TransientHashSet.prototype.cljs$core$ILookup$_lookup$arity$2 = function(tcoll, v) {
  var this__6406 = this;
  return cljs.core._lookup.call(null, tcoll, v, null)
};
cljs.core.TransientHashSet.prototype.cljs$core$ILookup$_lookup$arity$3 = function(tcoll, v, not_found) {
  var this__6407 = this;
  if(cljs.core._lookup.call(null, this__6407.transient_map, v, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
    return not_found
  }else {
    return v
  }
};
cljs.core.TransientHashSet.prototype.cljs$core$ICounted$ = true;
cljs.core.TransientHashSet.prototype.cljs$core$ICounted$_count$arity$1 = function(tcoll) {
  var this__6408 = this;
  return cljs.core.count.call(null, this__6408.transient_map)
};
cljs.core.TransientHashSet.prototype.cljs$core$ITransientSet$ = true;
cljs.core.TransientHashSet.prototype.cljs$core$ITransientSet$_disjoin_BANG_$arity$2 = function(tcoll, v) {
  var this__6409 = this;
  this__6409.transient_map = cljs.core.dissoc_BANG_.call(null, this__6409.transient_map, v);
  return tcoll
};
cljs.core.TransientHashSet.prototype.cljs$core$ITransientCollection$ = true;
cljs.core.TransientHashSet.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, o) {
  var this__6410 = this;
  this__6410.transient_map = cljs.core.assoc_BANG_.call(null, this__6410.transient_map, o, null);
  return tcoll
};
cljs.core.TransientHashSet.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__6411 = this;
  return new cljs.core.PersistentHashSet(null, cljs.core.persistent_BANG_.call(null, this__6411.transient_map), null)
};
cljs.core.TransientHashSet;
cljs.core.PersistentTreeSet = function(meta, tree_map, __hash) {
  this.meta = meta;
  this.tree_map = tree_map;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 208865423
};
cljs.core.PersistentTreeSet.cljs$lang$type = true;
cljs.core.PersistentTreeSet.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.PersistentTreeSet")
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IHash$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__6417 = this;
  var h__364__auto____6418 = this__6417.__hash;
  if(h__364__auto____6418 != null) {
    return h__364__auto____6418
  }else {
    var h__364__auto____6419 = cljs.core.hash_iset.call(null, coll);
    this__6417.__hash = h__364__auto____6419;
    return h__364__auto____6419
  }
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ILookup$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, v) {
  var this__6420 = this;
  return cljs.core._lookup.call(null, coll, v, null)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, v, not_found) {
  var this__6421 = this;
  if(cljs.core.truth_(cljs.core._contains_key_QMARK_.call(null, this__6421.tree_map, v))) {
    return v
  }else {
    return not_found
  }
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IFn$ = true;
cljs.core.PersistentTreeSet.prototype.call = function() {
  var G__6445 = null;
  var G__6445__2 = function(tsym6415, k) {
    var this__6422 = this;
    var tsym6415__6423 = this;
    var coll__6424 = tsym6415__6423;
    return cljs.core._lookup.call(null, coll__6424, k)
  };
  var G__6445__3 = function(tsym6416, k, not_found) {
    var this__6425 = this;
    var tsym6416__6426 = this;
    var coll__6427 = tsym6416__6426;
    return cljs.core._lookup.call(null, coll__6427, k, not_found)
  };
  G__6445 = function(tsym6416, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__6445__2.call(this, tsym6416, k);
      case 3:
        return G__6445__3.call(this, tsym6416, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6445
}();
cljs.core.PersistentTreeSet.prototype.apply = function(tsym6413, args6414) {
  return tsym6413.call.apply(tsym6413, [tsym6413].concat(cljs.core.aclone.call(null, args6414)))
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ICollection$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__6428 = this;
  return new cljs.core.PersistentTreeSet(this__6428.meta, cljs.core.assoc.call(null, this__6428.tree_map, o, null), null)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IReversible$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__6429 = this;
  return cljs.core.map.call(null, cljs.core.key, cljs.core.rseq.call(null, this__6429.tree_map))
};
cljs.core.PersistentTreeSet.prototype.toString = function() {
  var this__6430 = this;
  var this$__6431 = this;
  return cljs.core.pr_str.call(null, this$__6431)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_sorted_seq$arity$2 = function(coll, ascending_QMARK_) {
  var this__6432 = this;
  return cljs.core.map.call(null, cljs.core.key, cljs.core._sorted_seq.call(null, this__6432.tree_map, ascending_QMARK_))
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_sorted_seq_from$arity$3 = function(coll, k, ascending_QMARK_) {
  var this__6433 = this;
  return cljs.core.map.call(null, cljs.core.key, cljs.core._sorted_seq_from.call(null, this__6433.tree_map, k, ascending_QMARK_))
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_entry_key$arity$2 = function(coll, entry) {
  var this__6434 = this;
  return entry
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_comparator$arity$1 = function(coll) {
  var this__6435 = this;
  return cljs.core._comparator.call(null, this__6435.tree_map)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISeqable$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__6436 = this;
  return cljs.core.keys.call(null, this__6436.tree_map)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISet$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$ISet$_disjoin$arity$2 = function(coll, v) {
  var this__6437 = this;
  return new cljs.core.PersistentTreeSet(this__6437.meta, cljs.core.dissoc.call(null, this__6437.tree_map, v), null)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ICounted$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__6438 = this;
  return cljs.core.count.call(null, this__6438.tree_map)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IEquiv$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__6439 = this;
  var and__3822__auto____6440 = cljs.core.set_QMARK_.call(null, other);
  if(and__3822__auto____6440) {
    var and__3822__auto____6441 = cljs.core.count.call(null, coll) === cljs.core.count.call(null, other);
    if(and__3822__auto____6441) {
      return cljs.core.every_QMARK_.call(null, function(p1__6395_SHARP_) {
        return cljs.core.contains_QMARK_.call(null, coll, p1__6395_SHARP_)
      }, other)
    }else {
      return and__3822__auto____6441
    }
  }else {
    return and__3822__auto____6440
  }
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IWithMeta$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__6442 = this;
  return new cljs.core.PersistentTreeSet(meta, this__6442.tree_map, this__6442.__hash)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IMeta$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__6443 = this;
  return this__6443.meta
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__6444 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentTreeSet.EMPTY, this__6444.meta)
};
cljs.core.PersistentTreeSet;
cljs.core.PersistentTreeSet.EMPTY = new cljs.core.PersistentTreeSet(null, cljs.core.sorted_map.call(null), 0);
cljs.core.set = function set(coll) {
  var in$__6446 = cljs.core.seq.call(null, coll);
  var out__6447 = cljs.core.transient$.call(null, cljs.core.PersistentHashSet.EMPTY);
  while(true) {
    if(cljs.core.truth_(cljs.core.seq.call(null, in$__6446))) {
      var G__6448 = cljs.core.next.call(null, in$__6446);
      var G__6449 = cljs.core.conj_BANG_.call(null, out__6447, cljs.core.first.call(null, in$__6446));
      in$__6446 = G__6448;
      out__6447 = G__6449;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, out__6447)
    }
    break
  }
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
  sorted_set.cljs$lang$applyTo = function(arglist__6450) {
    var keys = cljs.core.seq(arglist__6450);
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
  sorted_set_by.cljs$lang$applyTo = function(arglist__6452) {
    var comparator = cljs.core.first(arglist__6452);
    var keys = cljs.core.rest(arglist__6452);
    return sorted_set_by__delegate(comparator, keys)
  };
  sorted_set_by.cljs$lang$arity$variadic = sorted_set_by__delegate;
  return sorted_set_by
}();
cljs.core.replace = function replace(smap, coll) {
  if(cljs.core.vector_QMARK_.call(null, coll)) {
    var n__6453 = cljs.core.count.call(null, coll);
    return cljs.core.reduce.call(null, function(v, i) {
      var temp__3971__auto____6454 = cljs.core.find.call(null, smap, cljs.core.nth.call(null, v, i));
      if(cljs.core.truth_(temp__3971__auto____6454)) {
        var e__6455 = temp__3971__auto____6454;
        return cljs.core.assoc.call(null, v, i, cljs.core.second.call(null, e__6455))
      }else {
        return v
      }
    }, coll, cljs.core.take.call(null, n__6453, cljs.core.iterate.call(null, cljs.core.inc, 0)))
  }else {
    return cljs.core.map.call(null, function(p1__6451_SHARP_) {
      var temp__3971__auto____6456 = cljs.core.find.call(null, smap, p1__6451_SHARP_);
      if(cljs.core.truth_(temp__3971__auto____6456)) {
        var e__6457 = temp__3971__auto____6456;
        return cljs.core.second.call(null, e__6457)
      }else {
        return p1__6451_SHARP_
      }
    }, coll)
  }
};
cljs.core.distinct = function distinct(coll) {
  var step__6465 = function step(xs, seen) {
    return new cljs.core.LazySeq(null, false, function() {
      return function(p__6458, seen) {
        while(true) {
          var vec__6459__6460 = p__6458;
          var f__6461 = cljs.core.nth.call(null, vec__6459__6460, 0, null);
          var xs__6462 = vec__6459__6460;
          var temp__3974__auto____6463 = cljs.core.seq.call(null, xs__6462);
          if(cljs.core.truth_(temp__3974__auto____6463)) {
            var s__6464 = temp__3974__auto____6463;
            if(cljs.core.contains_QMARK_.call(null, seen, f__6461)) {
              var G__6466 = cljs.core.rest.call(null, s__6464);
              var G__6467 = seen;
              p__6458 = G__6466;
              seen = G__6467;
              continue
            }else {
              return cljs.core.cons.call(null, f__6461, step.call(null, cljs.core.rest.call(null, s__6464), cljs.core.conj.call(null, seen, f__6461)))
            }
          }else {
            return null
          }
          break
        }
      }.call(null, xs, seen)
    })
  };
  return step__6465.call(null, coll, cljs.core.set([]))
};
cljs.core.butlast = function butlast(s) {
  var ret__6468 = cljs.core.PersistentVector.fromArray([]);
  var s__6469 = s;
  while(true) {
    if(cljs.core.truth_(cljs.core.next.call(null, s__6469))) {
      var G__6470 = cljs.core.conj.call(null, ret__6468, cljs.core.first.call(null, s__6469));
      var G__6471 = cljs.core.next.call(null, s__6469);
      ret__6468 = G__6470;
      s__6469 = G__6471;
      continue
    }else {
      return cljs.core.seq.call(null, ret__6468)
    }
    break
  }
};
cljs.core.name = function name(x) {
  if(cljs.core.string_QMARK_.call(null, x)) {
    return x
  }else {
    if(function() {
      var or__3824__auto____6472 = cljs.core.keyword_QMARK_.call(null, x);
      if(or__3824__auto____6472) {
        return or__3824__auto____6472
      }else {
        return cljs.core.symbol_QMARK_.call(null, x)
      }
    }()) {
      var i__6473 = x.lastIndexOf("/");
      if(i__6473 < 0) {
        return cljs.core.subs.call(null, x, 2)
      }else {
        return cljs.core.subs.call(null, x, i__6473 + 1)
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
    var or__3824__auto____6474 = cljs.core.keyword_QMARK_.call(null, x);
    if(or__3824__auto____6474) {
      return or__3824__auto____6474
    }else {
      return cljs.core.symbol_QMARK_.call(null, x)
    }
  }()) {
    var i__6475 = x.lastIndexOf("/");
    if(i__6475 > -1) {
      return cljs.core.subs.call(null, x, 2, i__6475)
    }else {
      return null
    }
  }else {
    throw new Error([cljs.core.str("Doesn't support namespace: "), cljs.core.str(x)].join(""));
  }
};
cljs.core.zipmap = function zipmap(keys, vals) {
  var map__6478 = cljs.core.ObjMap.fromObject([], {});
  var ks__6479 = cljs.core.seq.call(null, keys);
  var vs__6480 = cljs.core.seq.call(null, vals);
  while(true) {
    if(cljs.core.truth_(function() {
      var and__3822__auto____6481 = ks__6479;
      if(cljs.core.truth_(and__3822__auto____6481)) {
        return vs__6480
      }else {
        return and__3822__auto____6481
      }
    }())) {
      var G__6482 = cljs.core.assoc.call(null, map__6478, cljs.core.first.call(null, ks__6479), cljs.core.first.call(null, vs__6480));
      var G__6483 = cljs.core.next.call(null, ks__6479);
      var G__6484 = cljs.core.next.call(null, vs__6480);
      map__6478 = G__6482;
      ks__6479 = G__6483;
      vs__6480 = G__6484;
      continue
    }else {
      return map__6478
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
    var G__6487__delegate = function(k, x, y, more) {
      return cljs.core.reduce.call(null, function(p1__6476_SHARP_, p2__6477_SHARP_) {
        return max_key.call(null, k, p1__6476_SHARP_, p2__6477_SHARP_)
      }, max_key.call(null, k, x, y), more)
    };
    var G__6487 = function(k, x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__6487__delegate.call(this, k, x, y, more)
    };
    G__6487.cljs$lang$maxFixedArity = 3;
    G__6487.cljs$lang$applyTo = function(arglist__6488) {
      var k = cljs.core.first(arglist__6488);
      var x = cljs.core.first(cljs.core.next(arglist__6488));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(arglist__6488)));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__6488)));
      return G__6487__delegate(k, x, y, more)
    };
    G__6487.cljs$lang$arity$variadic = G__6487__delegate;
    return G__6487
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
    var G__6489__delegate = function(k, x, y, more) {
      return cljs.core.reduce.call(null, function(p1__6485_SHARP_, p2__6486_SHARP_) {
        return min_key.call(null, k, p1__6485_SHARP_, p2__6486_SHARP_)
      }, min_key.call(null, k, x, y), more)
    };
    var G__6489 = function(k, x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__6489__delegate.call(this, k, x, y, more)
    };
    G__6489.cljs$lang$maxFixedArity = 3;
    G__6489.cljs$lang$applyTo = function(arglist__6490) {
      var k = cljs.core.first(arglist__6490);
      var x = cljs.core.first(cljs.core.next(arglist__6490));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(arglist__6490)));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__6490)));
      return G__6489__delegate(k, x, y, more)
    };
    G__6489.cljs$lang$arity$variadic = G__6489__delegate;
    return G__6489
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
      var temp__3974__auto____6491 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3974__auto____6491)) {
        var s__6492 = temp__3974__auto____6491;
        return cljs.core.cons.call(null, cljs.core.take.call(null, n, s__6492), partition_all.call(null, n, step, cljs.core.drop.call(null, step, s__6492)))
      }else {
        return null
      }
    })
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
    var temp__3974__auto____6493 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3974__auto____6493)) {
      var s__6494 = temp__3974__auto____6493;
      if(cljs.core.truth_(pred.call(null, cljs.core.first.call(null, s__6494)))) {
        return cljs.core.cons.call(null, cljs.core.first.call(null, s__6494), take_while.call(null, pred, cljs.core.rest.call(null, s__6494)))
      }else {
        return null
      }
    }else {
      return null
    }
  })
};
cljs.core.mk_bound_fn = function mk_bound_fn(sc, test, key) {
  return function(e) {
    var comp__6495 = cljs.core._comparator.call(null, sc);
    return test.call(null, comp__6495.call(null, cljs.core._entry_key.call(null, sc, e), key), 0)
  }
};
cljs.core.subseq = function() {
  var subseq = null;
  var subseq__3 = function(sc, test, key) {
    var include__6496 = cljs.core.mk_bound_fn.call(null, sc, test, key);
    if(cljs.core.truth_(cljs.core.set([cljs.core._GT_, cljs.core._GT__EQ_]).call(null, test))) {
      var temp__3974__auto____6497 = cljs.core._sorted_seq_from.call(null, sc, key, true);
      if(cljs.core.truth_(temp__3974__auto____6497)) {
        var vec__6498__6499 = temp__3974__auto____6497;
        var e__6500 = cljs.core.nth.call(null, vec__6498__6499, 0, null);
        var s__6501 = vec__6498__6499;
        if(cljs.core.truth_(include__6496.call(null, e__6500))) {
          return s__6501
        }else {
          return cljs.core.next.call(null, s__6501)
        }
      }else {
        return null
      }
    }else {
      return cljs.core.take_while.call(null, include__6496, cljs.core._sorted_seq.call(null, sc, true))
    }
  };
  var subseq__5 = function(sc, start_test, start_key, end_test, end_key) {
    var temp__3974__auto____6502 = cljs.core._sorted_seq_from.call(null, sc, start_key, true);
    if(cljs.core.truth_(temp__3974__auto____6502)) {
      var vec__6503__6504 = temp__3974__auto____6502;
      var e__6505 = cljs.core.nth.call(null, vec__6503__6504, 0, null);
      var s__6506 = vec__6503__6504;
      return cljs.core.take_while.call(null, cljs.core.mk_bound_fn.call(null, sc, end_test, end_key), cljs.core.truth_(cljs.core.mk_bound_fn.call(null, sc, start_test, start_key).call(null, e__6505)) ? s__6506 : cljs.core.next.call(null, s__6506))
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
    var include__6507 = cljs.core.mk_bound_fn.call(null, sc, test, key);
    if(cljs.core.truth_(cljs.core.set([cljs.core._LT_, cljs.core._LT__EQ_]).call(null, test))) {
      var temp__3974__auto____6508 = cljs.core._sorted_seq_from.call(null, sc, key, false);
      if(cljs.core.truth_(temp__3974__auto____6508)) {
        var vec__6509__6510 = temp__3974__auto____6508;
        var e__6511 = cljs.core.nth.call(null, vec__6509__6510, 0, null);
        var s__6512 = vec__6509__6510;
        if(cljs.core.truth_(include__6507.call(null, e__6511))) {
          return s__6512
        }else {
          return cljs.core.next.call(null, s__6512)
        }
      }else {
        return null
      }
    }else {
      return cljs.core.take_while.call(null, include__6507, cljs.core._sorted_seq.call(null, sc, false))
    }
  };
  var rsubseq__5 = function(sc, start_test, start_key, end_test, end_key) {
    var temp__3974__auto____6513 = cljs.core._sorted_seq_from.call(null, sc, end_key, false);
    if(cljs.core.truth_(temp__3974__auto____6513)) {
      var vec__6514__6515 = temp__3974__auto____6513;
      var e__6516 = cljs.core.nth.call(null, vec__6514__6515, 0, null);
      var s__6517 = vec__6514__6515;
      return cljs.core.take_while.call(null, cljs.core.mk_bound_fn.call(null, sc, start_test, start_key), cljs.core.truth_(cljs.core.mk_bound_fn.call(null, sc, end_test, end_key).call(null, e__6516)) ? s__6517 : cljs.core.next.call(null, s__6517))
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
  this.cljs$lang$protocol_mask$partition0$ = 16187486
};
cljs.core.Range.cljs$lang$type = true;
cljs.core.Range.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.Range")
};
cljs.core.Range.prototype.cljs$core$IHash$ = true;
cljs.core.Range.prototype.cljs$core$IHash$_hash$arity$1 = function(rng) {
  var this__6518 = this;
  var h__364__auto____6519 = this__6518.__hash;
  if(h__364__auto____6519 != null) {
    return h__364__auto____6519
  }else {
    var h__364__auto____6520 = cljs.core.hash_coll.call(null, rng);
    this__6518.__hash = h__364__auto____6520;
    return h__364__auto____6520
  }
};
cljs.core.Range.prototype.cljs$core$ISequential$ = true;
cljs.core.Range.prototype.cljs$core$ICollection$ = true;
cljs.core.Range.prototype.cljs$core$ICollection$_conj$arity$2 = function(rng, o) {
  var this__6521 = this;
  return cljs.core.cons.call(null, o, rng)
};
cljs.core.Range.prototype.toString = function() {
  var this__6522 = this;
  var this$__6523 = this;
  return cljs.core.pr_str.call(null, this$__6523)
};
cljs.core.Range.prototype.cljs$core$IReduce$ = true;
cljs.core.Range.prototype.cljs$core$IReduce$_reduce$arity$2 = function(rng, f) {
  var this__6524 = this;
  return cljs.core.ci_reduce.call(null, rng, f)
};
cljs.core.Range.prototype.cljs$core$IReduce$_reduce$arity$3 = function(rng, f, s) {
  var this__6525 = this;
  return cljs.core.ci_reduce.call(null, rng, f, s)
};
cljs.core.Range.prototype.cljs$core$ISeqable$ = true;
cljs.core.Range.prototype.cljs$core$ISeqable$_seq$arity$1 = function(rng) {
  var this__6526 = this;
  var comp__6527 = this__6526.step > 0 ? cljs.core._LT_ : cljs.core._GT_;
  if(cljs.core.truth_(comp__6527.call(null, this__6526.start, this__6526.end))) {
    return rng
  }else {
    return null
  }
};
cljs.core.Range.prototype.cljs$core$ICounted$ = true;
cljs.core.Range.prototype.cljs$core$ICounted$_count$arity$1 = function(rng) {
  var this__6528 = this;
  if(cljs.core.not.call(null, cljs.core._seq.call(null, rng))) {
    return 0
  }else {
    return Math["ceil"]((this__6528.end - this__6528.start) / this__6528.step)
  }
};
cljs.core.Range.prototype.cljs$core$ISeq$ = true;
cljs.core.Range.prototype.cljs$core$ISeq$_first$arity$1 = function(rng) {
  var this__6529 = this;
  return this__6529.start
};
cljs.core.Range.prototype.cljs$core$ISeq$_rest$arity$1 = function(rng) {
  var this__6530 = this;
  if(cljs.core.truth_(cljs.core._seq.call(null, rng))) {
    return new cljs.core.Range(this__6530.meta, this__6530.start + this__6530.step, this__6530.end, this__6530.step, null)
  }else {
    return cljs.core.list.call(null)
  }
};
cljs.core.Range.prototype.cljs$core$IEquiv$ = true;
cljs.core.Range.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(rng, other) {
  var this__6531 = this;
  return cljs.core.equiv_sequential.call(null, rng, other)
};
cljs.core.Range.prototype.cljs$core$IWithMeta$ = true;
cljs.core.Range.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(rng, meta) {
  var this__6532 = this;
  return new cljs.core.Range(meta, this__6532.start, this__6532.end, this__6532.step, this__6532.__hash)
};
cljs.core.Range.prototype.cljs$core$IMeta$ = true;
cljs.core.Range.prototype.cljs$core$IMeta$_meta$arity$1 = function(rng) {
  var this__6533 = this;
  return this__6533.meta
};
cljs.core.Range.prototype.cljs$core$IIndexed$ = true;
cljs.core.Range.prototype.cljs$core$IIndexed$_nth$arity$2 = function(rng, n) {
  var this__6534 = this;
  if(n < cljs.core._count.call(null, rng)) {
    return this__6534.start + n * this__6534.step
  }else {
    if(function() {
      var and__3822__auto____6535 = this__6534.start > this__6534.end;
      if(and__3822__auto____6535) {
        return this__6534.step === 0
      }else {
        return and__3822__auto____6535
      }
    }()) {
      return this__6534.start
    }else {
      throw new Error("Index out of bounds");
    }
  }
};
cljs.core.Range.prototype.cljs$core$IIndexed$_nth$arity$3 = function(rng, n, not_found) {
  var this__6536 = this;
  if(n < cljs.core._count.call(null, rng)) {
    return this__6536.start + n * this__6536.step
  }else {
    if(function() {
      var and__3822__auto____6537 = this__6536.start > this__6536.end;
      if(and__3822__auto____6537) {
        return this__6536.step === 0
      }else {
        return and__3822__auto____6537
      }
    }()) {
      return this__6536.start
    }else {
      return not_found
    }
  }
};
cljs.core.Range.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.Range.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(rng) {
  var this__6538 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__6538.meta)
};
cljs.core.Range;
cljs.core.range = function() {
  var range = null;
  var range__0 = function() {
    return range.call(null, 0, Number["MAX_VALUE"], 1)
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
    var temp__3974__auto____6539 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3974__auto____6539)) {
      var s__6540 = temp__3974__auto____6539;
      return cljs.core.cons.call(null, cljs.core.first.call(null, s__6540), take_nth.call(null, n, cljs.core.drop.call(null, n, s__6540)))
    }else {
      return null
    }
  })
};
cljs.core.split_with = function split_with(pred, coll) {
  return cljs.core.PersistentVector.fromArray([cljs.core.take_while.call(null, pred, coll), cljs.core.drop_while.call(null, pred, coll)])
};
cljs.core.partition_by = function partition_by(f, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____6542 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3974__auto____6542)) {
      var s__6543 = temp__3974__auto____6542;
      var fst__6544 = cljs.core.first.call(null, s__6543);
      var fv__6545 = f.call(null, fst__6544);
      var run__6546 = cljs.core.cons.call(null, fst__6544, cljs.core.take_while.call(null, function(p1__6541_SHARP_) {
        return cljs.core._EQ_.call(null, fv__6545, f.call(null, p1__6541_SHARP_))
      }, cljs.core.next.call(null, s__6543)));
      return cljs.core.cons.call(null, run__6546, partition_by.call(null, f, cljs.core.seq.call(null, cljs.core.drop.call(null, cljs.core.count.call(null, run__6546), s__6543))))
    }else {
      return null
    }
  })
};
cljs.core.frequencies = function frequencies(coll) {
  return cljs.core.persistent_BANG_.call(null, cljs.core.reduce.call(null, function(counts, x) {
    return cljs.core.assoc_BANG_.call(null, counts, x, cljs.core.get.call(null, counts, x, 0) + 1)
  }, cljs.core.transient$.call(null, cljs.core.ObjMap.fromObject([], {})), coll))
};
cljs.core.reductions = function() {
  var reductions = null;
  var reductions__2 = function(f, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3971__auto____6557 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3971__auto____6557)) {
        var s__6558 = temp__3971__auto____6557;
        return reductions.call(null, f, cljs.core.first.call(null, s__6558), cljs.core.rest.call(null, s__6558))
      }else {
        return cljs.core.list.call(null, f.call(null))
      }
    })
  };
  var reductions__3 = function(f, init, coll) {
    return cljs.core.cons.call(null, init, new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____6559 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3974__auto____6559)) {
        var s__6560 = temp__3974__auto____6559;
        return reductions.call(null, f, f.call(null, init, cljs.core.first.call(null, s__6560)), cljs.core.rest.call(null, s__6560))
      }else {
        return null
      }
    }))
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
      var G__6562 = null;
      var G__6562__0 = function() {
        return cljs.core.vector.call(null, f.call(null))
      };
      var G__6562__1 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x))
      };
      var G__6562__2 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y))
      };
      var G__6562__3 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z))
      };
      var G__6562__4 = function() {
        var G__6563__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args))
        };
        var G__6563 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__6563__delegate.call(this, x, y, z, args)
        };
        G__6563.cljs$lang$maxFixedArity = 3;
        G__6563.cljs$lang$applyTo = function(arglist__6564) {
          var x = cljs.core.first(arglist__6564);
          var y = cljs.core.first(cljs.core.next(arglist__6564));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__6564)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__6564)));
          return G__6563__delegate(x, y, z, args)
        };
        G__6563.cljs$lang$arity$variadic = G__6563__delegate;
        return G__6563
      }();
      G__6562 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__6562__0.call(this);
          case 1:
            return G__6562__1.call(this, x);
          case 2:
            return G__6562__2.call(this, x, y);
          case 3:
            return G__6562__3.call(this, x, y, z);
          default:
            return G__6562__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__6562.cljs$lang$maxFixedArity = 3;
      G__6562.cljs$lang$applyTo = G__6562__4.cljs$lang$applyTo;
      return G__6562
    }()
  };
  var juxt__2 = function(f, g) {
    return function() {
      var G__6565 = null;
      var G__6565__0 = function() {
        return cljs.core.vector.call(null, f.call(null), g.call(null))
      };
      var G__6565__1 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x), g.call(null, x))
      };
      var G__6565__2 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y), g.call(null, x, y))
      };
      var G__6565__3 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z), g.call(null, x, y, z))
      };
      var G__6565__4 = function() {
        var G__6566__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args), cljs.core.apply.call(null, g, x, y, z, args))
        };
        var G__6566 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__6566__delegate.call(this, x, y, z, args)
        };
        G__6566.cljs$lang$maxFixedArity = 3;
        G__6566.cljs$lang$applyTo = function(arglist__6567) {
          var x = cljs.core.first(arglist__6567);
          var y = cljs.core.first(cljs.core.next(arglist__6567));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__6567)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__6567)));
          return G__6566__delegate(x, y, z, args)
        };
        G__6566.cljs$lang$arity$variadic = G__6566__delegate;
        return G__6566
      }();
      G__6565 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__6565__0.call(this);
          case 1:
            return G__6565__1.call(this, x);
          case 2:
            return G__6565__2.call(this, x, y);
          case 3:
            return G__6565__3.call(this, x, y, z);
          default:
            return G__6565__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__6565.cljs$lang$maxFixedArity = 3;
      G__6565.cljs$lang$applyTo = G__6565__4.cljs$lang$applyTo;
      return G__6565
    }()
  };
  var juxt__3 = function(f, g, h) {
    return function() {
      var G__6568 = null;
      var G__6568__0 = function() {
        return cljs.core.vector.call(null, f.call(null), g.call(null), h.call(null))
      };
      var G__6568__1 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x), g.call(null, x), h.call(null, x))
      };
      var G__6568__2 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y), g.call(null, x, y), h.call(null, x, y))
      };
      var G__6568__3 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z), g.call(null, x, y, z), h.call(null, x, y, z))
      };
      var G__6568__4 = function() {
        var G__6569__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args), cljs.core.apply.call(null, g, x, y, z, args), cljs.core.apply.call(null, h, x, y, z, args))
        };
        var G__6569 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__6569__delegate.call(this, x, y, z, args)
        };
        G__6569.cljs$lang$maxFixedArity = 3;
        G__6569.cljs$lang$applyTo = function(arglist__6570) {
          var x = cljs.core.first(arglist__6570);
          var y = cljs.core.first(cljs.core.next(arglist__6570));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__6570)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__6570)));
          return G__6569__delegate(x, y, z, args)
        };
        G__6569.cljs$lang$arity$variadic = G__6569__delegate;
        return G__6569
      }();
      G__6568 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__6568__0.call(this);
          case 1:
            return G__6568__1.call(this, x);
          case 2:
            return G__6568__2.call(this, x, y);
          case 3:
            return G__6568__3.call(this, x, y, z);
          default:
            return G__6568__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__6568.cljs$lang$maxFixedArity = 3;
      G__6568.cljs$lang$applyTo = G__6568__4.cljs$lang$applyTo;
      return G__6568
    }()
  };
  var juxt__4 = function() {
    var G__6571__delegate = function(f, g, h, fs) {
      var fs__6561 = cljs.core.list_STAR_.call(null, f, g, h, fs);
      return function() {
        var G__6572 = null;
        var G__6572__0 = function() {
          return cljs.core.reduce.call(null, function(p1__6547_SHARP_, p2__6548_SHARP_) {
            return cljs.core.conj.call(null, p1__6547_SHARP_, p2__6548_SHARP_.call(null))
          }, cljs.core.PersistentVector.fromArray([]), fs__6561)
        };
        var G__6572__1 = function(x) {
          return cljs.core.reduce.call(null, function(p1__6549_SHARP_, p2__6550_SHARP_) {
            return cljs.core.conj.call(null, p1__6549_SHARP_, p2__6550_SHARP_.call(null, x))
          }, cljs.core.PersistentVector.fromArray([]), fs__6561)
        };
        var G__6572__2 = function(x, y) {
          return cljs.core.reduce.call(null, function(p1__6551_SHARP_, p2__6552_SHARP_) {
            return cljs.core.conj.call(null, p1__6551_SHARP_, p2__6552_SHARP_.call(null, x, y))
          }, cljs.core.PersistentVector.fromArray([]), fs__6561)
        };
        var G__6572__3 = function(x, y, z) {
          return cljs.core.reduce.call(null, function(p1__6553_SHARP_, p2__6554_SHARP_) {
            return cljs.core.conj.call(null, p1__6553_SHARP_, p2__6554_SHARP_.call(null, x, y, z))
          }, cljs.core.PersistentVector.fromArray([]), fs__6561)
        };
        var G__6572__4 = function() {
          var G__6573__delegate = function(x, y, z, args) {
            return cljs.core.reduce.call(null, function(p1__6555_SHARP_, p2__6556_SHARP_) {
              return cljs.core.conj.call(null, p1__6555_SHARP_, cljs.core.apply.call(null, p2__6556_SHARP_, x, y, z, args))
            }, cljs.core.PersistentVector.fromArray([]), fs__6561)
          };
          var G__6573 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__6573__delegate.call(this, x, y, z, args)
          };
          G__6573.cljs$lang$maxFixedArity = 3;
          G__6573.cljs$lang$applyTo = function(arglist__6574) {
            var x = cljs.core.first(arglist__6574);
            var y = cljs.core.first(cljs.core.next(arglist__6574));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__6574)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__6574)));
            return G__6573__delegate(x, y, z, args)
          };
          G__6573.cljs$lang$arity$variadic = G__6573__delegate;
          return G__6573
        }();
        G__6572 = function(x, y, z, var_args) {
          var args = var_args;
          switch(arguments.length) {
            case 0:
              return G__6572__0.call(this);
            case 1:
              return G__6572__1.call(this, x);
            case 2:
              return G__6572__2.call(this, x, y);
            case 3:
              return G__6572__3.call(this, x, y, z);
            default:
              return G__6572__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
          }
          throw"Invalid arity: " + arguments.length;
        };
        G__6572.cljs$lang$maxFixedArity = 3;
        G__6572.cljs$lang$applyTo = G__6572__4.cljs$lang$applyTo;
        return G__6572
      }()
    };
    var G__6571 = function(f, g, h, var_args) {
      var fs = null;
      if(goog.isDef(var_args)) {
        fs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__6571__delegate.call(this, f, g, h, fs)
    };
    G__6571.cljs$lang$maxFixedArity = 3;
    G__6571.cljs$lang$applyTo = function(arglist__6575) {
      var f = cljs.core.first(arglist__6575);
      var g = cljs.core.first(cljs.core.next(arglist__6575));
      var h = cljs.core.first(cljs.core.next(cljs.core.next(arglist__6575)));
      var fs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__6575)));
      return G__6571__delegate(f, g, h, fs)
    };
    G__6571.cljs$lang$arity$variadic = G__6571__delegate;
    return G__6571
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
      if(cljs.core.truth_(cljs.core.seq.call(null, coll))) {
        var G__6577 = cljs.core.next.call(null, coll);
        coll = G__6577;
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
        var and__3822__auto____6576 = cljs.core.seq.call(null, coll);
        if(cljs.core.truth_(and__3822__auto____6576)) {
          return n > 0
        }else {
          return and__3822__auto____6576
        }
      }())) {
        var G__6578 = n - 1;
        var G__6579 = cljs.core.next.call(null, coll);
        n = G__6578;
        coll = G__6579;
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
cljs.core.re_matches = function re_matches(re, s) {
  var matches__6580 = re.exec(s);
  if(cljs.core._EQ_.call(null, cljs.core.first.call(null, matches__6580), s)) {
    if(cljs.core.count.call(null, matches__6580) === 1) {
      return cljs.core.first.call(null, matches__6580)
    }else {
      return cljs.core.vec.call(null, matches__6580)
    }
  }else {
    return null
  }
};
cljs.core.re_find = function re_find(re, s) {
  var matches__6581 = re.exec(s);
  if(matches__6581 == null) {
    return null
  }else {
    if(cljs.core.count.call(null, matches__6581) === 1) {
      return cljs.core.first.call(null, matches__6581)
    }else {
      return cljs.core.vec.call(null, matches__6581)
    }
  }
};
cljs.core.re_seq = function re_seq(re, s) {
  var match_data__6582 = cljs.core.re_find.call(null, re, s);
  var match_idx__6583 = s.search(re);
  var match_str__6584 = cljs.core.coll_QMARK_.call(null, match_data__6582) ? cljs.core.first.call(null, match_data__6582) : match_data__6582;
  var post_match__6585 = cljs.core.subs.call(null, s, match_idx__6583 + cljs.core.count.call(null, match_str__6584));
  if(cljs.core.truth_(match_data__6582)) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, match_data__6582, re_seq.call(null, re, post_match__6585))
    })
  }else {
    return null
  }
};
cljs.core.re_pattern = function re_pattern(s) {
  var vec__6587__6588 = cljs.core.re_find.call(null, /^(?:\(\?([idmsux]*)\))?(.*)/, s);
  var ___6589 = cljs.core.nth.call(null, vec__6587__6588, 0, null);
  var flags__6590 = cljs.core.nth.call(null, vec__6587__6588, 1, null);
  var pattern__6591 = cljs.core.nth.call(null, vec__6587__6588, 2, null);
  return new RegExp(pattern__6591, flags__6590)
};
cljs.core.pr_sequential = function pr_sequential(print_one, begin, sep, end, opts, coll) {
  return cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray([begin]), cljs.core.flatten1.call(null, cljs.core.interpose.call(null, cljs.core.PersistentVector.fromArray([sep]), cljs.core.map.call(null, function(p1__6586_SHARP_) {
    return print_one.call(null, p1__6586_SHARP_, opts)
  }, coll))), cljs.core.PersistentVector.fromArray([end]))
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
          var and__3822__auto____6592 = cljs.core.get.call(null, opts, "\ufdd0'meta");
          if(cljs.core.truth_(and__3822__auto____6592)) {
            var and__3822__auto____6596 = function() {
              var G__6593__6594 = obj;
              if(G__6593__6594 != null) {
                if(function() {
                  var or__3824__auto____6595 = G__6593__6594.cljs$lang$protocol_mask$partition0$ & 65536;
                  if(or__3824__auto____6595) {
                    return or__3824__auto____6595
                  }else {
                    return G__6593__6594.cljs$core$IMeta$
                  }
                }()) {
                  return true
                }else {
                  if(!G__6593__6594.cljs$lang$protocol_mask$partition0$) {
                    return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__6593__6594)
                  }else {
                    return false
                  }
                }
              }else {
                return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__6593__6594)
              }
            }();
            if(cljs.core.truth_(and__3822__auto____6596)) {
              return cljs.core.meta.call(null, obj)
            }else {
              return and__3822__auto____6596
            }
          }else {
            return and__3822__auto____6592
          }
        }()) ? cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray(["^"]), pr_seq.call(null, cljs.core.meta.call(null, obj), opts), cljs.core.PersistentVector.fromArray([" "])) : null, cljs.core.truth_(function() {
          var and__3822__auto____6597 = obj != null;
          if(and__3822__auto____6597) {
            return obj.cljs$lang$type
          }else {
            return and__3822__auto____6597
          }
        }()) ? obj.cljs$lang$ctorPrSeq(obj) : function() {
          var G__6598__6599 = obj;
          if(G__6598__6599 != null) {
            if(function() {
              var or__3824__auto____6600 = G__6598__6599.cljs$lang$protocol_mask$partition0$ & 268435456;
              if(or__3824__auto____6600) {
                return or__3824__auto____6600
              }else {
                return G__6598__6599.cljs$core$IPrintable$
              }
            }()) {
              return true
            }else {
              if(!G__6598__6599.cljs$lang$protocol_mask$partition0$) {
                return cljs.core.type_satisfies_.call(null, cljs.core.IPrintable, G__6598__6599)
              }else {
                return false
              }
            }
          }else {
            return cljs.core.type_satisfies_.call(null, cljs.core.IPrintable, G__6598__6599)
          }
        }() ? cljs.core._pr_seq.call(null, obj, opts) : "\ufdd0'else" ? cljs.core.list.call(null, "#<", [cljs.core.str(obj)].join(""), ">") : null)
      }else {
        return null
      }
    }
  }
};
cljs.core.pr_sb = function pr_sb(objs, opts) {
  var first_obj__6601 = cljs.core.first.call(null, objs);
  var sb__6602 = new goog.string.StringBuffer;
  var G__6603__6604 = cljs.core.seq.call(null, objs);
  if(cljs.core.truth_(G__6603__6604)) {
    var obj__6605 = cljs.core.first.call(null, G__6603__6604);
    var G__6603__6606 = G__6603__6604;
    while(true) {
      if(obj__6605 === first_obj__6601) {
      }else {
        sb__6602.append(" ")
      }
      var G__6607__6608 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, obj__6605, opts));
      if(cljs.core.truth_(G__6607__6608)) {
        var string__6609 = cljs.core.first.call(null, G__6607__6608);
        var G__6607__6610 = G__6607__6608;
        while(true) {
          sb__6602.append(string__6609);
          var temp__3974__auto____6611 = cljs.core.next.call(null, G__6607__6610);
          if(cljs.core.truth_(temp__3974__auto____6611)) {
            var G__6607__6612 = temp__3974__auto____6611;
            var G__6615 = cljs.core.first.call(null, G__6607__6612);
            var G__6616 = G__6607__6612;
            string__6609 = G__6615;
            G__6607__6610 = G__6616;
            continue
          }else {
          }
          break
        }
      }else {
      }
      var temp__3974__auto____6613 = cljs.core.next.call(null, G__6603__6606);
      if(cljs.core.truth_(temp__3974__auto____6613)) {
        var G__6603__6614 = temp__3974__auto____6613;
        var G__6617 = cljs.core.first.call(null, G__6603__6614);
        var G__6618 = G__6603__6614;
        obj__6605 = G__6617;
        G__6603__6606 = G__6618;
        continue
      }else {
      }
      break
    }
  }else {
  }
  return sb__6602
};
cljs.core.pr_str_with_opts = function pr_str_with_opts(objs, opts) {
  return[cljs.core.str(cljs.core.pr_sb.call(null, objs, opts))].join("")
};
cljs.core.prn_str_with_opts = function prn_str_with_opts(objs, opts) {
  var sb__6619 = cljs.core.pr_sb.call(null, objs, opts);
  sb__6619.append("\n");
  return[cljs.core.str(sb__6619)].join("")
};
cljs.core.pr_with_opts = function pr_with_opts(objs, opts) {
  var first_obj__6620 = cljs.core.first.call(null, objs);
  var G__6621__6622 = cljs.core.seq.call(null, objs);
  if(cljs.core.truth_(G__6621__6622)) {
    var obj__6623 = cljs.core.first.call(null, G__6621__6622);
    var G__6621__6624 = G__6621__6622;
    while(true) {
      if(obj__6623 === first_obj__6620) {
      }else {
        cljs.core.string_print.call(null, " ")
      }
      var G__6625__6626 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, obj__6623, opts));
      if(cljs.core.truth_(G__6625__6626)) {
        var string__6627 = cljs.core.first.call(null, G__6625__6626);
        var G__6625__6628 = G__6625__6626;
        while(true) {
          cljs.core.string_print.call(null, string__6627);
          var temp__3974__auto____6629 = cljs.core.next.call(null, G__6625__6628);
          if(cljs.core.truth_(temp__3974__auto____6629)) {
            var G__6625__6630 = temp__3974__auto____6629;
            var G__6633 = cljs.core.first.call(null, G__6625__6630);
            var G__6634 = G__6625__6630;
            string__6627 = G__6633;
            G__6625__6628 = G__6634;
            continue
          }else {
          }
          break
        }
      }else {
      }
      var temp__3974__auto____6631 = cljs.core.next.call(null, G__6621__6624);
      if(cljs.core.truth_(temp__3974__auto____6631)) {
        var G__6621__6632 = temp__3974__auto____6631;
        var G__6635 = cljs.core.first.call(null, G__6621__6632);
        var G__6636 = G__6621__6632;
        obj__6623 = G__6635;
        G__6621__6624 = G__6636;
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
  if(cljs.core.truth_(cljs.core.get.call(null, opts, "\ufdd0'flush-on-newline"))) {
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
  pr_str.cljs$lang$applyTo = function(arglist__6637) {
    var objs = cljs.core.seq(arglist__6637);
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
  prn_str.cljs$lang$applyTo = function(arglist__6638) {
    var objs = cljs.core.seq(arglist__6638);
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
  pr.cljs$lang$applyTo = function(arglist__6639) {
    var objs = cljs.core.seq(arglist__6639);
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
  cljs_core_print.cljs$lang$applyTo = function(arglist__6640) {
    var objs = cljs.core.seq(arglist__6640);
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
  print_str.cljs$lang$applyTo = function(arglist__6641) {
    var objs = cljs.core.seq(arglist__6641);
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
  println.cljs$lang$applyTo = function(arglist__6642) {
    var objs = cljs.core.seq(arglist__6642);
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
  println_str.cljs$lang$applyTo = function(arglist__6643) {
    var objs = cljs.core.seq(arglist__6643);
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
  prn.cljs$lang$applyTo = function(arglist__6644) {
    var objs = cljs.core.seq(arglist__6644);
    return prn__delegate(objs)
  };
  prn.cljs$lang$arity$variadic = prn__delegate;
  return prn
}();
cljs.core.HashMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.HashMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__6645 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__6645, "{", ", ", "}", opts, coll)
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
cljs.core.PersistentTreeMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__6646 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__6646, "{", ", ", "}", opts, coll)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__6647 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__6647, "{", ", ", "}", opts, coll)
};
cljs.core.PersistentQueue.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "#queue [", " ", "]", opts, cljs.core.seq.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.LazySeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
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
      var temp__3974__auto____6648 = cljs.core.namespace.call(null, obj);
      if(cljs.core.truth_(temp__3974__auto____6648)) {
        var nspc__6649 = temp__3974__auto____6648;
        return[cljs.core.str(nspc__6649), cljs.core.str("/")].join("")
      }else {
        return null
      }
    }()), cljs.core.str(cljs.core.name.call(null, obj))].join(""))
  }else {
    if(cljs.core.symbol_QMARK_.call(null, obj)) {
      return cljs.core.list.call(null, [cljs.core.str(function() {
        var temp__3974__auto____6650 = cljs.core.namespace.call(null, obj);
        if(cljs.core.truth_(temp__3974__auto____6650)) {
          var nspc__6651 = temp__3974__auto____6650;
          return[cljs.core.str(nspc__6651), cljs.core.str("/")].join("")
        }else {
          return null
        }
      }()), cljs.core.str(cljs.core.name.call(null, obj))].join(""))
    }else {
      if("\ufdd0'else") {
        return cljs.core.list.call(null, cljs.core.truth_("\ufdd0'readably".call(null, opts)) ? goog.string.quote.call(null, obj) : obj)
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
cljs.core.PersistentHashMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__6652 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__6652, "{", ", ", "}", opts, coll)
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
  var pr_pair__6653 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__6653, "{", ", ", "}", opts, coll)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.Atom = function(state, meta, validator, watches) {
  this.state = state;
  this.meta = meta;
  this.validator = validator;
  this.watches = watches;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 1345404928
};
cljs.core.Atom.cljs$lang$type = true;
cljs.core.Atom.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.Atom")
};
cljs.core.Atom.prototype.cljs$core$IHash$ = true;
cljs.core.Atom.prototype.cljs$core$IHash$_hash$arity$1 = function(this$) {
  var this__6654 = this;
  return goog.getUid.call(null, this$)
};
cljs.core.Atom.prototype.cljs$core$IWatchable$ = true;
cljs.core.Atom.prototype.cljs$core$IWatchable$_notify_watches$arity$3 = function(this$, oldval, newval) {
  var this__6655 = this;
  var G__6656__6657 = cljs.core.seq.call(null, this__6655.watches);
  if(cljs.core.truth_(G__6656__6657)) {
    var G__6659__6661 = cljs.core.first.call(null, G__6656__6657);
    var vec__6660__6662 = G__6659__6661;
    var key__6663 = cljs.core.nth.call(null, vec__6660__6662, 0, null);
    var f__6664 = cljs.core.nth.call(null, vec__6660__6662, 1, null);
    var G__6656__6665 = G__6656__6657;
    var G__6659__6666 = G__6659__6661;
    var G__6656__6667 = G__6656__6665;
    while(true) {
      var vec__6668__6669 = G__6659__6666;
      var key__6670 = cljs.core.nth.call(null, vec__6668__6669, 0, null);
      var f__6671 = cljs.core.nth.call(null, vec__6668__6669, 1, null);
      var G__6656__6672 = G__6656__6667;
      f__6671.call(null, key__6670, this$, oldval, newval);
      var temp__3974__auto____6673 = cljs.core.next.call(null, G__6656__6672);
      if(cljs.core.truth_(temp__3974__auto____6673)) {
        var G__6656__6674 = temp__3974__auto____6673;
        var G__6681 = cljs.core.first.call(null, G__6656__6674);
        var G__6682 = G__6656__6674;
        G__6659__6666 = G__6681;
        G__6656__6667 = G__6682;
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
  var this__6675 = this;
  return this$.watches = cljs.core.assoc.call(null, this__6675.watches, key, f)
};
cljs.core.Atom.prototype.cljs$core$IWatchable$_remove_watch$arity$2 = function(this$, key) {
  var this__6676 = this;
  return this$.watches = cljs.core.dissoc.call(null, this__6676.watches, key)
};
cljs.core.Atom.prototype.cljs$core$IPrintable$ = true;
cljs.core.Atom.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(a, opts) {
  var this__6677 = this;
  return cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray(["#<Atom: "]), cljs.core._pr_seq.call(null, this__6677.state, opts), ">")
};
cljs.core.Atom.prototype.cljs$core$IMeta$ = true;
cljs.core.Atom.prototype.cljs$core$IMeta$_meta$arity$1 = function(_) {
  var this__6678 = this;
  return this__6678.meta
};
cljs.core.Atom.prototype.cljs$core$IDeref$ = true;
cljs.core.Atom.prototype.cljs$core$IDeref$_deref$arity$1 = function(_) {
  var this__6679 = this;
  return this__6679.state
};
cljs.core.Atom.prototype.cljs$core$IEquiv$ = true;
cljs.core.Atom.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(o, other) {
  var this__6680 = this;
  return o === other
};
cljs.core.Atom;
cljs.core.atom = function() {
  var atom = null;
  var atom__1 = function(x) {
    return new cljs.core.Atom(x, null, null, null)
  };
  var atom__2 = function() {
    var G__6689__delegate = function(x, p__6683) {
      var map__6684__6685 = p__6683;
      var map__6684__6686 = cljs.core.seq_QMARK_.call(null, map__6684__6685) ? cljs.core.apply.call(null, cljs.core.hash_map, map__6684__6685) : map__6684__6685;
      var validator__6687 = cljs.core.get.call(null, map__6684__6686, "\ufdd0'validator");
      var meta__6688 = cljs.core.get.call(null, map__6684__6686, "\ufdd0'meta");
      return new cljs.core.Atom(x, meta__6688, validator__6687, null)
    };
    var G__6689 = function(x, var_args) {
      var p__6683 = null;
      if(goog.isDef(var_args)) {
        p__6683 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__6689__delegate.call(this, x, p__6683)
    };
    G__6689.cljs$lang$maxFixedArity = 1;
    G__6689.cljs$lang$applyTo = function(arglist__6690) {
      var x = cljs.core.first(arglist__6690);
      var p__6683 = cljs.core.rest(arglist__6690);
      return G__6689__delegate(x, p__6683)
    };
    G__6689.cljs$lang$arity$variadic = G__6689__delegate;
    return G__6689
  }();
  atom = function(x, var_args) {
    var p__6683 = var_args;
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
  var temp__3974__auto____6691 = a.validator;
  if(cljs.core.truth_(temp__3974__auto____6691)) {
    var validate__6692 = temp__3974__auto____6691;
    if(cljs.core.truth_(validate__6692.call(null, new_value))) {
    }else {
      throw new Error([cljs.core.str("Assert failed: "), cljs.core.str("Validator rejected reference state"), cljs.core.str("\n"), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'validate", "\ufdd1'new-value"), cljs.core.hash_map("\ufdd0'line", 5917))))].join(""));
    }
  }else {
  }
  var old_value__6693 = a.state;
  a.state = new_value;
  cljs.core._notify_watches.call(null, a, old_value__6693, new_value);
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
    var G__6694__delegate = function(a, f, x, y, z, more) {
      return cljs.core.reset_BANG_.call(null, a, cljs.core.apply.call(null, f, a.state, x, y, z, more))
    };
    var G__6694 = function(a, f, x, y, z, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 5), 0)
      }
      return G__6694__delegate.call(this, a, f, x, y, z, more)
    };
    G__6694.cljs$lang$maxFixedArity = 5;
    G__6694.cljs$lang$applyTo = function(arglist__6695) {
      var a = cljs.core.first(arglist__6695);
      var f = cljs.core.first(cljs.core.next(arglist__6695));
      var x = cljs.core.first(cljs.core.next(cljs.core.next(arglist__6695)));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__6695))));
      var z = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__6695)))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__6695)))));
      return G__6694__delegate(a, f, x, y, z, more)
    };
    G__6694.cljs$lang$arity$variadic = G__6694__delegate;
    return G__6694
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
  alter_meta_BANG_.cljs$lang$applyTo = function(arglist__6696) {
    var iref = cljs.core.first(arglist__6696);
    var f = cljs.core.first(cljs.core.next(arglist__6696));
    var args = cljs.core.rest(cljs.core.next(arglist__6696));
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
  this.cljs$lang$protocol_mask$partition0$ = 536887296
};
cljs.core.Delay.cljs$lang$type = true;
cljs.core.Delay.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.Delay")
};
cljs.core.Delay.prototype.cljs$core$IPending$ = true;
cljs.core.Delay.prototype.cljs$core$IPending$_realized_QMARK_$arity$1 = function(d) {
  var this__6697 = this;
  return"\ufdd0'done".call(null, cljs.core.deref.call(null, this__6697.state))
};
cljs.core.Delay.prototype.cljs$core$IDeref$ = true;
cljs.core.Delay.prototype.cljs$core$IDeref$_deref$arity$1 = function(_) {
  var this__6698 = this;
  return"\ufdd0'value".call(null, cljs.core.swap_BANG_.call(null, this__6698.state, function(p__6699) {
    var curr_state__6700 = p__6699;
    var curr_state__6701 = cljs.core.seq_QMARK_.call(null, curr_state__6700) ? cljs.core.apply.call(null, cljs.core.hash_map, curr_state__6700) : curr_state__6700;
    var done__6702 = cljs.core.get.call(null, curr_state__6701, "\ufdd0'done");
    if(cljs.core.truth_(done__6702)) {
      return curr_state__6701
    }else {
      return cljs.core.ObjMap.fromObject(["\ufdd0'done", "\ufdd0'value"], {"\ufdd0'done":true, "\ufdd0'value":this__6698.f.call(null)})
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
    var map__6703__6704 = options;
    var map__6703__6705 = cljs.core.seq_QMARK_.call(null, map__6703__6704) ? cljs.core.apply.call(null, cljs.core.hash_map, map__6703__6704) : map__6703__6704;
    var keywordize_keys__6706 = cljs.core.get.call(null, map__6703__6705, "\ufdd0'keywordize-keys");
    var keyfn__6707 = cljs.core.truth_(keywordize_keys__6706) ? cljs.core.keyword : cljs.core.str;
    var f__6713 = function thisfn(x) {
      if(cljs.core.seq_QMARK_.call(null, x)) {
        return cljs.core.doall.call(null, cljs.core.map.call(null, thisfn, x))
      }else {
        if(cljs.core.coll_QMARK_.call(null, x)) {
          return cljs.core.into.call(null, cljs.core.empty.call(null, x), cljs.core.map.call(null, thisfn, x))
        }else {
          if(cljs.core.truth_(goog.isArray.call(null, x))) {
            return cljs.core.vec.call(null, cljs.core.map.call(null, thisfn, x))
          }else {
            if(cljs.core.type.call(null, x) === Object) {
              return cljs.core.into.call(null, cljs.core.ObjMap.fromObject([], {}), function() {
                var iter__625__auto____6712 = function iter__6708(s__6709) {
                  return new cljs.core.LazySeq(null, false, function() {
                    var s__6709__6710 = s__6709;
                    while(true) {
                      if(cljs.core.truth_(cljs.core.seq.call(null, s__6709__6710))) {
                        var k__6711 = cljs.core.first.call(null, s__6709__6710);
                        return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([keyfn__6707.call(null, k__6711), thisfn.call(null, x[k__6711])]), iter__6708.call(null, cljs.core.rest.call(null, s__6709__6710)))
                      }else {
                        return null
                      }
                      break
                    }
                  })
                };
                return iter__625__auto____6712.call(null, cljs.core.js_keys.call(null, x))
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
    return f__6713.call(null, x)
  };
  var js__GT_clj = function(x, var_args) {
    var options = null;
    if(goog.isDef(var_args)) {
      options = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return js__GT_clj__delegate.call(this, x, options)
  };
  js__GT_clj.cljs$lang$maxFixedArity = 1;
  js__GT_clj.cljs$lang$applyTo = function(arglist__6714) {
    var x = cljs.core.first(arglist__6714);
    var options = cljs.core.rest(arglist__6714);
    return js__GT_clj__delegate(x, options)
  };
  js__GT_clj.cljs$lang$arity$variadic = js__GT_clj__delegate;
  return js__GT_clj
}();
cljs.core.memoize = function memoize(f) {
  var mem__6715 = cljs.core.atom.call(null, cljs.core.ObjMap.fromObject([], {}));
  return function() {
    var G__6719__delegate = function(args) {
      var temp__3971__auto____6716 = cljs.core.get.call(null, cljs.core.deref.call(null, mem__6715), args);
      if(cljs.core.truth_(temp__3971__auto____6716)) {
        var v__6717 = temp__3971__auto____6716;
        return v__6717
      }else {
        var ret__6718 = cljs.core.apply.call(null, f, args);
        cljs.core.swap_BANG_.call(null, mem__6715, cljs.core.assoc, args, ret__6718);
        return ret__6718
      }
    };
    var G__6719 = function(var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__6719__delegate.call(this, args)
    };
    G__6719.cljs$lang$maxFixedArity = 0;
    G__6719.cljs$lang$applyTo = function(arglist__6720) {
      var args = cljs.core.seq(arglist__6720);
      return G__6719__delegate(args)
    };
    G__6719.cljs$lang$arity$variadic = G__6719__delegate;
    return G__6719
  }()
};
cljs.core.trampoline = function() {
  var trampoline = null;
  var trampoline__1 = function(f) {
    while(true) {
      var ret__6721 = f.call(null);
      if(cljs.core.fn_QMARK_.call(null, ret__6721)) {
        var G__6722 = ret__6721;
        f = G__6722;
        continue
      }else {
        return ret__6721
      }
      break
    }
  };
  var trampoline__2 = function() {
    var G__6723__delegate = function(f, args) {
      return trampoline.call(null, function() {
        return cljs.core.apply.call(null, f, args)
      })
    };
    var G__6723 = function(f, var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__6723__delegate.call(this, f, args)
    };
    G__6723.cljs$lang$maxFixedArity = 1;
    G__6723.cljs$lang$applyTo = function(arglist__6724) {
      var f = cljs.core.first(arglist__6724);
      var args = cljs.core.rest(arglist__6724);
      return G__6723__delegate(f, args)
    };
    G__6723.cljs$lang$arity$variadic = G__6723__delegate;
    return G__6723
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
    return Math.random() * n
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
  return Math.floor(Math.random() * n)
};
cljs.core.rand_nth = function rand_nth(coll) {
  return cljs.core.nth.call(null, coll, cljs.core.rand_int.call(null, cljs.core.count.call(null, coll)))
};
cljs.core.group_by = function group_by(f, coll) {
  return cljs.core.reduce.call(null, function(ret, x) {
    var k__6725 = f.call(null, x);
    return cljs.core.assoc.call(null, ret, k__6725, cljs.core.conj.call(null, cljs.core.get.call(null, ret, k__6725, cljs.core.PersistentVector.fromArray([])), x))
  }, cljs.core.ObjMap.fromObject([], {}), coll)
};
cljs.core.make_hierarchy = function make_hierarchy() {
  return cljs.core.ObjMap.fromObject(["\ufdd0'parents", "\ufdd0'descendants", "\ufdd0'ancestors"], {"\ufdd0'parents":cljs.core.ObjMap.fromObject([], {}), "\ufdd0'descendants":cljs.core.ObjMap.fromObject([], {}), "\ufdd0'ancestors":cljs.core.ObjMap.fromObject([], {})})
};
cljs.core.global_hierarchy = cljs.core.atom.call(null, cljs.core.make_hierarchy.call(null));
cljs.core.isa_QMARK_ = function() {
  var isa_QMARK_ = null;
  var isa_QMARK___2 = function(child, parent) {
    return isa_QMARK_.call(null, cljs.core.deref.call(null, cljs.core.global_hierarchy), child, parent)
  };
  var isa_QMARK___3 = function(h, child, parent) {
    var or__3824__auto____6726 = cljs.core._EQ_.call(null, child, parent);
    if(or__3824__auto____6726) {
      return or__3824__auto____6726
    }else {
      var or__3824__auto____6727 = cljs.core.contains_QMARK_.call(null, "\ufdd0'ancestors".call(null, h).call(null, child), parent);
      if(or__3824__auto____6727) {
        return or__3824__auto____6727
      }else {
        var and__3822__auto____6728 = cljs.core.vector_QMARK_.call(null, parent);
        if(and__3822__auto____6728) {
          var and__3822__auto____6729 = cljs.core.vector_QMARK_.call(null, child);
          if(and__3822__auto____6729) {
            var and__3822__auto____6730 = cljs.core.count.call(null, parent) === cljs.core.count.call(null, child);
            if(and__3822__auto____6730) {
              var ret__6731 = true;
              var i__6732 = 0;
              while(true) {
                if(function() {
                  var or__3824__auto____6733 = cljs.core.not.call(null, ret__6731);
                  if(or__3824__auto____6733) {
                    return or__3824__auto____6733
                  }else {
                    return i__6732 === cljs.core.count.call(null, parent)
                  }
                }()) {
                  return ret__6731
                }else {
                  var G__6734 = isa_QMARK_.call(null, h, child.call(null, i__6732), parent.call(null, i__6732));
                  var G__6735 = i__6732 + 1;
                  ret__6731 = G__6734;
                  i__6732 = G__6735;
                  continue
                }
                break
              }
            }else {
              return and__3822__auto____6730
            }
          }else {
            return and__3822__auto____6729
          }
        }else {
          return and__3822__auto____6728
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
    return cljs.core.not_empty.call(null, cljs.core.get.call(null, "\ufdd0'parents".call(null, h), tag))
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
    return cljs.core.not_empty.call(null, cljs.core.get.call(null, "\ufdd0'ancestors".call(null, h), tag))
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
    return cljs.core.not_empty.call(null, cljs.core.get.call(null, "\ufdd0'descendants".call(null, h), tag))
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
      throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'namespace", "\ufdd1'parent"), cljs.core.hash_map("\ufdd0'line", 6201))))].join(""));
    }
    cljs.core.swap_BANG_.call(null, cljs.core.global_hierarchy, derive, tag, parent);
    return null
  };
  var derive__3 = function(h, tag, parent) {
    if(cljs.core.not_EQ_.call(null, tag, parent)) {
    }else {
      throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'not=", "\ufdd1'tag", "\ufdd1'parent"), cljs.core.hash_map("\ufdd0'line", 6205))))].join(""));
    }
    var tp__6739 = "\ufdd0'parents".call(null, h);
    var td__6740 = "\ufdd0'descendants".call(null, h);
    var ta__6741 = "\ufdd0'ancestors".call(null, h);
    var tf__6742 = function(m, source, sources, target, targets) {
      return cljs.core.reduce.call(null, function(ret, k) {
        return cljs.core.assoc.call(null, ret, k, cljs.core.reduce.call(null, cljs.core.conj, cljs.core.get.call(null, targets, k, cljs.core.set([])), cljs.core.cons.call(null, target, targets.call(null, target))))
      }, m, cljs.core.cons.call(null, source, sources.call(null, source)))
    };
    var or__3824__auto____6743 = cljs.core.contains_QMARK_.call(null, tp__6739.call(null, tag), parent) ? null : function() {
      if(cljs.core.contains_QMARK_.call(null, ta__6741.call(null, tag), parent)) {
        throw new Error([cljs.core.str(tag), cljs.core.str("already has"), cljs.core.str(parent), cljs.core.str("as ancestor")].join(""));
      }else {
      }
      if(cljs.core.contains_QMARK_.call(null, ta__6741.call(null, parent), tag)) {
        throw new Error([cljs.core.str("Cyclic derivation:"), cljs.core.str(parent), cljs.core.str("has"), cljs.core.str(tag), cljs.core.str("as ancestor")].join(""));
      }else {
      }
      return cljs.core.ObjMap.fromObject(["\ufdd0'parents", "\ufdd0'ancestors", "\ufdd0'descendants"], {"\ufdd0'parents":cljs.core.assoc.call(null, "\ufdd0'parents".call(null, h), tag, cljs.core.conj.call(null, cljs.core.get.call(null, tp__6739, tag, cljs.core.set([])), parent)), "\ufdd0'ancestors":tf__6742.call(null, "\ufdd0'ancestors".call(null, h), tag, td__6740, parent, ta__6741), "\ufdd0'descendants":tf__6742.call(null, "\ufdd0'descendants".call(null, h), parent, ta__6741, tag, td__6740)})
    }();
    if(cljs.core.truth_(or__3824__auto____6743)) {
      return or__3824__auto____6743
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
    var parentMap__6744 = "\ufdd0'parents".call(null, h);
    var childsParents__6745 = cljs.core.truth_(parentMap__6744.call(null, tag)) ? cljs.core.disj.call(null, parentMap__6744.call(null, tag), parent) : cljs.core.set([]);
    var newParents__6746 = cljs.core.truth_(cljs.core.not_empty.call(null, childsParents__6745)) ? cljs.core.assoc.call(null, parentMap__6744, tag, childsParents__6745) : cljs.core.dissoc.call(null, parentMap__6744, tag);
    var deriv_seq__6747 = cljs.core.flatten.call(null, cljs.core.map.call(null, function(p1__6736_SHARP_) {
      return cljs.core.cons.call(null, cljs.core.first.call(null, p1__6736_SHARP_), cljs.core.interpose.call(null, cljs.core.first.call(null, p1__6736_SHARP_), cljs.core.second.call(null, p1__6736_SHARP_)))
    }, cljs.core.seq.call(null, newParents__6746)));
    if(cljs.core.contains_QMARK_.call(null, parentMap__6744.call(null, tag), parent)) {
      return cljs.core.reduce.call(null, function(p1__6737_SHARP_, p2__6738_SHARP_) {
        return cljs.core.apply.call(null, cljs.core.derive, p1__6737_SHARP_, p2__6738_SHARP_)
      }, cljs.core.make_hierarchy.call(null), cljs.core.partition.call(null, 2, deriv_seq__6747))
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
  var xprefs__6748 = cljs.core.deref.call(null, prefer_table).call(null, x);
  var or__3824__auto____6750 = cljs.core.truth_(function() {
    var and__3822__auto____6749 = xprefs__6748;
    if(cljs.core.truth_(and__3822__auto____6749)) {
      return xprefs__6748.call(null, y)
    }else {
      return and__3822__auto____6749
    }
  }()) ? true : null;
  if(cljs.core.truth_(or__3824__auto____6750)) {
    return or__3824__auto____6750
  }else {
    var or__3824__auto____6752 = function() {
      var ps__6751 = cljs.core.parents.call(null, y);
      while(true) {
        if(cljs.core.count.call(null, ps__6751) > 0) {
          if(cljs.core.truth_(prefers_STAR_.call(null, x, cljs.core.first.call(null, ps__6751), prefer_table))) {
          }else {
          }
          var G__6755 = cljs.core.rest.call(null, ps__6751);
          ps__6751 = G__6755;
          continue
        }else {
          return null
        }
        break
      }
    }();
    if(cljs.core.truth_(or__3824__auto____6752)) {
      return or__3824__auto____6752
    }else {
      var or__3824__auto____6754 = function() {
        var ps__6753 = cljs.core.parents.call(null, x);
        while(true) {
          if(cljs.core.count.call(null, ps__6753) > 0) {
            if(cljs.core.truth_(prefers_STAR_.call(null, cljs.core.first.call(null, ps__6753), y, prefer_table))) {
            }else {
            }
            var G__6756 = cljs.core.rest.call(null, ps__6753);
            ps__6753 = G__6756;
            continue
          }else {
            return null
          }
          break
        }
      }();
      if(cljs.core.truth_(or__3824__auto____6754)) {
        return or__3824__auto____6754
      }else {
        return false
      }
    }
  }
};
cljs.core.dominates = function dominates(x, y, prefer_table) {
  var or__3824__auto____6757 = cljs.core.prefers_STAR_.call(null, x, y, prefer_table);
  if(cljs.core.truth_(or__3824__auto____6757)) {
    return or__3824__auto____6757
  }else {
    return cljs.core.isa_QMARK_.call(null, x, y)
  }
};
cljs.core.find_and_cache_best_method = function find_and_cache_best_method(name, dispatch_val, hierarchy, method_table, prefer_table, method_cache, cached_hierarchy) {
  var best_entry__6766 = cljs.core.reduce.call(null, function(be, p__6758) {
    var vec__6759__6760 = p__6758;
    var k__6761 = cljs.core.nth.call(null, vec__6759__6760, 0, null);
    var ___6762 = cljs.core.nth.call(null, vec__6759__6760, 1, null);
    var e__6763 = vec__6759__6760;
    if(cljs.core.isa_QMARK_.call(null, dispatch_val, k__6761)) {
      var be2__6765 = cljs.core.truth_(function() {
        var or__3824__auto____6764 = be == null;
        if(or__3824__auto____6764) {
          return or__3824__auto____6764
        }else {
          return cljs.core.dominates.call(null, k__6761, cljs.core.first.call(null, be), prefer_table)
        }
      }()) ? e__6763 : be;
      if(cljs.core.truth_(cljs.core.dominates.call(null, cljs.core.first.call(null, be2__6765), k__6761, prefer_table))) {
      }else {
        throw new Error([cljs.core.str("Multiple methods in multimethod '"), cljs.core.str(name), cljs.core.str("' match dispatch value: "), cljs.core.str(dispatch_val), cljs.core.str(" -> "), cljs.core.str(k__6761), cljs.core.str(" and "), cljs.core.str(cljs.core.first.call(null, be2__6765)), cljs.core.str(", and neither is preferred")].join(""));
      }
      return be2__6765
    }else {
      return be
    }
  }, null, cljs.core.deref.call(null, method_table));
  if(cljs.core.truth_(best_entry__6766)) {
    if(cljs.core._EQ_.call(null, cljs.core.deref.call(null, cached_hierarchy), cljs.core.deref.call(null, hierarchy))) {
      cljs.core.swap_BANG_.call(null, method_cache, cljs.core.assoc, dispatch_val, cljs.core.second.call(null, best_entry__6766));
      return cljs.core.second.call(null, best_entry__6766)
    }else {
      cljs.core.reset_cache.call(null, method_cache, method_table, cached_hierarchy, hierarchy);
      return find_and_cache_best_method.call(null, name, dispatch_val, hierarchy, method_table, prefer_table, method_cache, cached_hierarchy)
    }
  }else {
    return null
  }
};
void 0;
cljs.core.IMultiFn = {};
cljs.core._reset = function _reset(mf) {
  if(function() {
    var and__3822__auto____6767 = mf;
    if(and__3822__auto____6767) {
      return mf.cljs$core$IMultiFn$_reset$arity$1
    }else {
      return and__3822__auto____6767
    }
  }()) {
    return mf.cljs$core$IMultiFn$_reset$arity$1(mf)
  }else {
    return function() {
      var or__3824__auto____6768 = cljs.core._reset[goog.typeOf.call(null, mf)];
      if(or__3824__auto____6768) {
        return or__3824__auto____6768
      }else {
        var or__3824__auto____6769 = cljs.core._reset["_"];
        if(or__3824__auto____6769) {
          return or__3824__auto____6769
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-reset", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._add_method = function _add_method(mf, dispatch_val, method) {
  if(function() {
    var and__3822__auto____6770 = mf;
    if(and__3822__auto____6770) {
      return mf.cljs$core$IMultiFn$_add_method$arity$3
    }else {
      return and__3822__auto____6770
    }
  }()) {
    return mf.cljs$core$IMultiFn$_add_method$arity$3(mf, dispatch_val, method)
  }else {
    return function() {
      var or__3824__auto____6771 = cljs.core._add_method[goog.typeOf.call(null, mf)];
      if(or__3824__auto____6771) {
        return or__3824__auto____6771
      }else {
        var or__3824__auto____6772 = cljs.core._add_method["_"];
        if(or__3824__auto____6772) {
          return or__3824__auto____6772
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-add-method", mf);
        }
      }
    }().call(null, mf, dispatch_val, method)
  }
};
cljs.core._remove_method = function _remove_method(mf, dispatch_val) {
  if(function() {
    var and__3822__auto____6773 = mf;
    if(and__3822__auto____6773) {
      return mf.cljs$core$IMultiFn$_remove_method$arity$2
    }else {
      return and__3822__auto____6773
    }
  }()) {
    return mf.cljs$core$IMultiFn$_remove_method$arity$2(mf, dispatch_val)
  }else {
    return function() {
      var or__3824__auto____6774 = cljs.core._remove_method[goog.typeOf.call(null, mf)];
      if(or__3824__auto____6774) {
        return or__3824__auto____6774
      }else {
        var or__3824__auto____6775 = cljs.core._remove_method["_"];
        if(or__3824__auto____6775) {
          return or__3824__auto____6775
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-remove-method", mf);
        }
      }
    }().call(null, mf, dispatch_val)
  }
};
cljs.core._prefer_method = function _prefer_method(mf, dispatch_val, dispatch_val_y) {
  if(function() {
    var and__3822__auto____6776 = mf;
    if(and__3822__auto____6776) {
      return mf.cljs$core$IMultiFn$_prefer_method$arity$3
    }else {
      return and__3822__auto____6776
    }
  }()) {
    return mf.cljs$core$IMultiFn$_prefer_method$arity$3(mf, dispatch_val, dispatch_val_y)
  }else {
    return function() {
      var or__3824__auto____6777 = cljs.core._prefer_method[goog.typeOf.call(null, mf)];
      if(or__3824__auto____6777) {
        return or__3824__auto____6777
      }else {
        var or__3824__auto____6778 = cljs.core._prefer_method["_"];
        if(or__3824__auto____6778) {
          return or__3824__auto____6778
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-prefer-method", mf);
        }
      }
    }().call(null, mf, dispatch_val, dispatch_val_y)
  }
};
cljs.core._get_method = function _get_method(mf, dispatch_val) {
  if(function() {
    var and__3822__auto____6779 = mf;
    if(and__3822__auto____6779) {
      return mf.cljs$core$IMultiFn$_get_method$arity$2
    }else {
      return and__3822__auto____6779
    }
  }()) {
    return mf.cljs$core$IMultiFn$_get_method$arity$2(mf, dispatch_val)
  }else {
    return function() {
      var or__3824__auto____6780 = cljs.core._get_method[goog.typeOf.call(null, mf)];
      if(or__3824__auto____6780) {
        return or__3824__auto____6780
      }else {
        var or__3824__auto____6781 = cljs.core._get_method["_"];
        if(or__3824__auto____6781) {
          return or__3824__auto____6781
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-get-method", mf);
        }
      }
    }().call(null, mf, dispatch_val)
  }
};
cljs.core._methods = function _methods(mf) {
  if(function() {
    var and__3822__auto____6782 = mf;
    if(and__3822__auto____6782) {
      return mf.cljs$core$IMultiFn$_methods$arity$1
    }else {
      return and__3822__auto____6782
    }
  }()) {
    return mf.cljs$core$IMultiFn$_methods$arity$1(mf)
  }else {
    return function() {
      var or__3824__auto____6783 = cljs.core._methods[goog.typeOf.call(null, mf)];
      if(or__3824__auto____6783) {
        return or__3824__auto____6783
      }else {
        var or__3824__auto____6784 = cljs.core._methods["_"];
        if(or__3824__auto____6784) {
          return or__3824__auto____6784
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-methods", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._prefers = function _prefers(mf) {
  if(function() {
    var and__3822__auto____6785 = mf;
    if(and__3822__auto____6785) {
      return mf.cljs$core$IMultiFn$_prefers$arity$1
    }else {
      return and__3822__auto____6785
    }
  }()) {
    return mf.cljs$core$IMultiFn$_prefers$arity$1(mf)
  }else {
    return function() {
      var or__3824__auto____6786 = cljs.core._prefers[goog.typeOf.call(null, mf)];
      if(or__3824__auto____6786) {
        return or__3824__auto____6786
      }else {
        var or__3824__auto____6787 = cljs.core._prefers["_"];
        if(or__3824__auto____6787) {
          return or__3824__auto____6787
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-prefers", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._dispatch = function _dispatch(mf, args) {
  if(function() {
    var and__3822__auto____6788 = mf;
    if(and__3822__auto____6788) {
      return mf.cljs$core$IMultiFn$_dispatch$arity$2
    }else {
      return and__3822__auto____6788
    }
  }()) {
    return mf.cljs$core$IMultiFn$_dispatch$arity$2(mf, args)
  }else {
    return function() {
      var or__3824__auto____6789 = cljs.core._dispatch[goog.typeOf.call(null, mf)];
      if(or__3824__auto____6789) {
        return or__3824__auto____6789
      }else {
        var or__3824__auto____6790 = cljs.core._dispatch["_"];
        if(or__3824__auto____6790) {
          return or__3824__auto____6790
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-dispatch", mf);
        }
      }
    }().call(null, mf, args)
  }
};
void 0;
cljs.core.do_dispatch = function do_dispatch(mf, dispatch_fn, args) {
  var dispatch_val__6791 = cljs.core.apply.call(null, dispatch_fn, args);
  var target_fn__6792 = cljs.core._get_method.call(null, mf, dispatch_val__6791);
  if(cljs.core.truth_(target_fn__6792)) {
  }else {
    throw new Error([cljs.core.str("No method in multimethod '"), cljs.core.str(cljs.core.name), cljs.core.str("' for dispatch value: "), cljs.core.str(dispatch_val__6791)].join(""));
  }
  return cljs.core.apply.call(null, target_fn__6792, args)
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
  this.cljs$lang$protocol_mask$partition0$ = 2097152;
  this.cljs$lang$protocol_mask$partition1$ = 32
};
cljs.core.MultiFn.cljs$lang$type = true;
cljs.core.MultiFn.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.MultiFn")
};
cljs.core.MultiFn.prototype.cljs$core$IHash$ = true;
cljs.core.MultiFn.prototype.cljs$core$IHash$_hash$arity$1 = function(this$) {
  var this__6793 = this;
  return goog.getUid.call(null, this$)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$ = true;
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_reset$arity$1 = function(mf) {
  var this__6794 = this;
  cljs.core.swap_BANG_.call(null, this__6794.method_table, function(mf) {
    return cljs.core.ObjMap.fromObject([], {})
  });
  cljs.core.swap_BANG_.call(null, this__6794.method_cache, function(mf) {
    return cljs.core.ObjMap.fromObject([], {})
  });
  cljs.core.swap_BANG_.call(null, this__6794.prefer_table, function(mf) {
    return cljs.core.ObjMap.fromObject([], {})
  });
  cljs.core.swap_BANG_.call(null, this__6794.cached_hierarchy, function(mf) {
    return null
  });
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_add_method$arity$3 = function(mf, dispatch_val, method) {
  var this__6795 = this;
  cljs.core.swap_BANG_.call(null, this__6795.method_table, cljs.core.assoc, dispatch_val, method);
  cljs.core.reset_cache.call(null, this__6795.method_cache, this__6795.method_table, this__6795.cached_hierarchy, this__6795.hierarchy);
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_remove_method$arity$2 = function(mf, dispatch_val) {
  var this__6796 = this;
  cljs.core.swap_BANG_.call(null, this__6796.method_table, cljs.core.dissoc, dispatch_val);
  cljs.core.reset_cache.call(null, this__6796.method_cache, this__6796.method_table, this__6796.cached_hierarchy, this__6796.hierarchy);
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_get_method$arity$2 = function(mf, dispatch_val) {
  var this__6797 = this;
  if(cljs.core._EQ_.call(null, cljs.core.deref.call(null, this__6797.cached_hierarchy), cljs.core.deref.call(null, this__6797.hierarchy))) {
  }else {
    cljs.core.reset_cache.call(null, this__6797.method_cache, this__6797.method_table, this__6797.cached_hierarchy, this__6797.hierarchy)
  }
  var temp__3971__auto____6798 = cljs.core.deref.call(null, this__6797.method_cache).call(null, dispatch_val);
  if(cljs.core.truth_(temp__3971__auto____6798)) {
    var target_fn__6799 = temp__3971__auto____6798;
    return target_fn__6799
  }else {
    var temp__3971__auto____6800 = cljs.core.find_and_cache_best_method.call(null, this__6797.name, dispatch_val, this__6797.hierarchy, this__6797.method_table, this__6797.prefer_table, this__6797.method_cache, this__6797.cached_hierarchy);
    if(cljs.core.truth_(temp__3971__auto____6800)) {
      var target_fn__6801 = temp__3971__auto____6800;
      return target_fn__6801
    }else {
      return cljs.core.deref.call(null, this__6797.method_table).call(null, this__6797.default_dispatch_val)
    }
  }
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_prefer_method$arity$3 = function(mf, dispatch_val_x, dispatch_val_y) {
  var this__6802 = this;
  if(cljs.core.truth_(cljs.core.prefers_STAR_.call(null, dispatch_val_x, dispatch_val_y, this__6802.prefer_table))) {
    throw new Error([cljs.core.str("Preference conflict in multimethod '"), cljs.core.str(this__6802.name), cljs.core.str("': "), cljs.core.str(dispatch_val_y), cljs.core.str(" is already preferred to "), cljs.core.str(dispatch_val_x)].join(""));
  }else {
  }
  cljs.core.swap_BANG_.call(null, this__6802.prefer_table, function(old) {
    return cljs.core.assoc.call(null, old, dispatch_val_x, cljs.core.conj.call(null, cljs.core.get.call(null, old, dispatch_val_x, cljs.core.set([])), dispatch_val_y))
  });
  return cljs.core.reset_cache.call(null, this__6802.method_cache, this__6802.method_table, this__6802.cached_hierarchy, this__6802.hierarchy)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_methods$arity$1 = function(mf) {
  var this__6803 = this;
  return cljs.core.deref.call(null, this__6803.method_table)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_prefers$arity$1 = function(mf) {
  var this__6804 = this;
  return cljs.core.deref.call(null, this__6804.prefer_table)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_dispatch$arity$2 = function(mf, args) {
  var this__6805 = this;
  return cljs.core.do_dispatch.call(null, mf, this__6805.dispatch_fn, args)
};
cljs.core.MultiFn;
cljs.core.MultiFn.prototype.call = function() {
  var G__6806__delegate = function(_, args) {
    return cljs.core._dispatch.call(null, this, args)
  };
  var G__6806 = function(_, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return G__6806__delegate.call(this, _, args)
  };
  G__6806.cljs$lang$maxFixedArity = 1;
  G__6806.cljs$lang$applyTo = function(arglist__6807) {
    var _ = cljs.core.first(arglist__6807);
    var args = cljs.core.rest(arglist__6807);
    return G__6806__delegate(_, args)
  };
  G__6806.cljs$lang$arity$variadic = G__6806__delegate;
  return G__6806
}();
cljs.core.MultiFn.prototype.apply = function(_, args) {
  return cljs.core._dispatch.call(null, this, args)
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
goog.provide("onedit.vi.core");
goog.require("cljs.core");
onedit.vi.core.mode = null;
goog.provide("goog.structs");
goog.require("goog.array");
goog.require("goog.object");
goog.structs.getCount = function(col) {
  if(typeof col.getCount == "function") {
    return col.getCount()
  }
  if(goog.isArrayLike(col) || goog.isString(col)) {
    return col.length
  }
  return goog.object.getCount(col)
};
goog.structs.getValues = function(col) {
  if(typeof col.getValues == "function") {
    return col.getValues()
  }
  if(goog.isString(col)) {
    return col.split("")
  }
  if(goog.isArrayLike(col)) {
    var rv = [];
    var l = col.length;
    for(var i = 0;i < l;i++) {
      rv.push(col[i])
    }
    return rv
  }
  return goog.object.getValues(col)
};
goog.structs.getKeys = function(col) {
  if(typeof col.getKeys == "function") {
    return col.getKeys()
  }
  if(typeof col.getValues == "function") {
    return undefined
  }
  if(goog.isArrayLike(col) || goog.isString(col)) {
    var rv = [];
    var l = col.length;
    for(var i = 0;i < l;i++) {
      rv.push(i)
    }
    return rv
  }
  return goog.object.getKeys(col)
};
goog.structs.contains = function(col, val) {
  if(typeof col.contains == "function") {
    return col.contains(val)
  }
  if(typeof col.containsValue == "function") {
    return col.containsValue(val)
  }
  if(goog.isArrayLike(col) || goog.isString(col)) {
    return goog.array.contains(col, val)
  }
  return goog.object.containsValue(col, val)
};
goog.structs.isEmpty = function(col) {
  if(typeof col.isEmpty == "function") {
    return col.isEmpty()
  }
  if(goog.isArrayLike(col) || goog.isString(col)) {
    return goog.array.isEmpty(col)
  }
  return goog.object.isEmpty(col)
};
goog.structs.clear = function(col) {
  if(typeof col.clear == "function") {
    col.clear()
  }else {
    if(goog.isArrayLike(col)) {
      goog.array.clear(col)
    }else {
      goog.object.clear(col)
    }
  }
};
goog.structs.forEach = function(col, f, opt_obj) {
  if(typeof col.forEach == "function") {
    col.forEach(f, opt_obj)
  }else {
    if(goog.isArrayLike(col) || goog.isString(col)) {
      goog.array.forEach(col, f, opt_obj)
    }else {
      var keys = goog.structs.getKeys(col);
      var values = goog.structs.getValues(col);
      var l = values.length;
      for(var i = 0;i < l;i++) {
        f.call(opt_obj, values[i], keys && keys[i], col)
      }
    }
  }
};
goog.structs.filter = function(col, f, opt_obj) {
  if(typeof col.filter == "function") {
    return col.filter(f, opt_obj)
  }
  if(goog.isArrayLike(col) || goog.isString(col)) {
    return goog.array.filter(col, f, opt_obj)
  }
  var rv;
  var keys = goog.structs.getKeys(col);
  var values = goog.structs.getValues(col);
  var l = values.length;
  if(keys) {
    rv = {};
    for(var i = 0;i < l;i++) {
      if(f.call(opt_obj, values[i], keys[i], col)) {
        rv[keys[i]] = values[i]
      }
    }
  }else {
    rv = [];
    for(var i = 0;i < l;i++) {
      if(f.call(opt_obj, values[i], undefined, col)) {
        rv.push(values[i])
      }
    }
  }
  return rv
};
goog.structs.map = function(col, f, opt_obj) {
  if(typeof col.map == "function") {
    return col.map(f, opt_obj)
  }
  if(goog.isArrayLike(col) || goog.isString(col)) {
    return goog.array.map(col, f, opt_obj)
  }
  var rv;
  var keys = goog.structs.getKeys(col);
  var values = goog.structs.getValues(col);
  var l = values.length;
  if(keys) {
    rv = {};
    for(var i = 0;i < l;i++) {
      rv[keys[i]] = f.call(opt_obj, values[i], keys[i], col)
    }
  }else {
    rv = [];
    for(var i = 0;i < l;i++) {
      rv[i] = f.call(opt_obj, values[i], undefined, col)
    }
  }
  return rv
};
goog.structs.some = function(col, f, opt_obj) {
  if(typeof col.some == "function") {
    return col.some(f, opt_obj)
  }
  if(goog.isArrayLike(col) || goog.isString(col)) {
    return goog.array.some(col, f, opt_obj)
  }
  var keys = goog.structs.getKeys(col);
  var values = goog.structs.getValues(col);
  var l = values.length;
  for(var i = 0;i < l;i++) {
    if(f.call(opt_obj, values[i], keys && keys[i], col)) {
      return true
    }
  }
  return false
};
goog.structs.every = function(col, f, opt_obj) {
  if(typeof col.every == "function") {
    return col.every(f, opt_obj)
  }
  if(goog.isArrayLike(col) || goog.isString(col)) {
    return goog.array.every(col, f, opt_obj)
  }
  var keys = goog.structs.getKeys(col);
  var values = goog.structs.getValues(col);
  var l = values.length;
  for(var i = 0;i < l;i++) {
    if(!f.call(opt_obj, values[i], keys && keys[i], col)) {
      return false
    }
  }
  return true
};
goog.provide("goog.structs.Collection");
goog.structs.Collection = function() {
};
goog.structs.Collection.prototype.add;
goog.structs.Collection.prototype.remove;
goog.structs.Collection.prototype.contains;
goog.structs.Collection.prototype.getCount;
goog.provide("goog.iter");
goog.provide("goog.iter.Iterator");
goog.provide("goog.iter.StopIteration");
goog.require("goog.array");
goog.require("goog.asserts");
goog.iter.Iterable;
if("StopIteration" in goog.global) {
  goog.iter.StopIteration = goog.global["StopIteration"]
}else {
  goog.iter.StopIteration = Error("StopIteration")
}
goog.iter.Iterator = function() {
};
goog.iter.Iterator.prototype.next = function() {
  throw goog.iter.StopIteration;
};
goog.iter.Iterator.prototype.__iterator__ = function(opt_keys) {
  return this
};
goog.iter.toIterator = function(iterable) {
  if(iterable instanceof goog.iter.Iterator) {
    return iterable
  }
  if(typeof iterable.__iterator__ == "function") {
    return iterable.__iterator__(false)
  }
  if(goog.isArrayLike(iterable)) {
    var i = 0;
    var newIter = new goog.iter.Iterator;
    newIter.next = function() {
      while(true) {
        if(i >= iterable.length) {
          throw goog.iter.StopIteration;
        }
        if(!(i in iterable)) {
          i++;
          continue
        }
        return iterable[i++]
      }
    };
    return newIter
  }
  throw Error("Not implemented");
};
goog.iter.forEach = function(iterable, f, opt_obj) {
  if(goog.isArrayLike(iterable)) {
    try {
      goog.array.forEach(iterable, f, opt_obj)
    }catch(ex) {
      if(ex !== goog.iter.StopIteration) {
        throw ex;
      }
    }
  }else {
    iterable = goog.iter.toIterator(iterable);
    try {
      while(true) {
        f.call(opt_obj, iterable.next(), undefined, iterable)
      }
    }catch(ex) {
      if(ex !== goog.iter.StopIteration) {
        throw ex;
      }
    }
  }
};
goog.iter.filter = function(iterable, f, opt_obj) {
  iterable = goog.iter.toIterator(iterable);
  var newIter = new goog.iter.Iterator;
  newIter.next = function() {
    while(true) {
      var val = iterable.next();
      if(f.call(opt_obj, val, undefined, iterable)) {
        return val
      }
    }
  };
  return newIter
};
goog.iter.range = function(startOrStop, opt_stop, opt_step) {
  var start = 0;
  var stop = startOrStop;
  var step = opt_step || 1;
  if(arguments.length > 1) {
    start = startOrStop;
    stop = opt_stop
  }
  if(step == 0) {
    throw Error("Range step argument must not be zero");
  }
  var newIter = new goog.iter.Iterator;
  newIter.next = function() {
    if(step > 0 && start >= stop || step < 0 && start <= stop) {
      throw goog.iter.StopIteration;
    }
    var rv = start;
    start += step;
    return rv
  };
  return newIter
};
goog.iter.join = function(iterable, deliminator) {
  return goog.iter.toArray(iterable).join(deliminator)
};
goog.iter.map = function(iterable, f, opt_obj) {
  iterable = goog.iter.toIterator(iterable);
  var newIter = new goog.iter.Iterator;
  newIter.next = function() {
    while(true) {
      var val = iterable.next();
      return f.call(opt_obj, val, undefined, iterable)
    }
  };
  return newIter
};
goog.iter.reduce = function(iterable, f, val, opt_obj) {
  var rval = val;
  goog.iter.forEach(iterable, function(val) {
    rval = f.call(opt_obj, rval, val)
  });
  return rval
};
goog.iter.some = function(iterable, f, opt_obj) {
  iterable = goog.iter.toIterator(iterable);
  try {
    while(true) {
      if(f.call(opt_obj, iterable.next(), undefined, iterable)) {
        return true
      }
    }
  }catch(ex) {
    if(ex !== goog.iter.StopIteration) {
      throw ex;
    }
  }
  return false
};
goog.iter.every = function(iterable, f, opt_obj) {
  iterable = goog.iter.toIterator(iterable);
  try {
    while(true) {
      if(!f.call(opt_obj, iterable.next(), undefined, iterable)) {
        return false
      }
    }
  }catch(ex) {
    if(ex !== goog.iter.StopIteration) {
      throw ex;
    }
  }
  return true
};
goog.iter.chain = function(var_args) {
  var args = arguments;
  var length = args.length;
  var i = 0;
  var newIter = new goog.iter.Iterator;
  newIter.next = function() {
    try {
      if(i >= length) {
        throw goog.iter.StopIteration;
      }
      var current = goog.iter.toIterator(args[i]);
      return current.next()
    }catch(ex) {
      if(ex !== goog.iter.StopIteration || i >= length) {
        throw ex;
      }else {
        i++;
        return this.next()
      }
    }
  };
  return newIter
};
goog.iter.dropWhile = function(iterable, f, opt_obj) {
  iterable = goog.iter.toIterator(iterable);
  var newIter = new goog.iter.Iterator;
  var dropping = true;
  newIter.next = function() {
    while(true) {
      var val = iterable.next();
      if(dropping && f.call(opt_obj, val, undefined, iterable)) {
        continue
      }else {
        dropping = false
      }
      return val
    }
  };
  return newIter
};
goog.iter.takeWhile = function(iterable, f, opt_obj) {
  iterable = goog.iter.toIterator(iterable);
  var newIter = new goog.iter.Iterator;
  var taking = true;
  newIter.next = function() {
    while(true) {
      if(taking) {
        var val = iterable.next();
        if(f.call(opt_obj, val, undefined, iterable)) {
          return val
        }else {
          taking = false
        }
      }else {
        throw goog.iter.StopIteration;
      }
    }
  };
  return newIter
};
goog.iter.toArray = function(iterable) {
  if(goog.isArrayLike(iterable)) {
    return goog.array.toArray(iterable)
  }
  iterable = goog.iter.toIterator(iterable);
  var array = [];
  goog.iter.forEach(iterable, function(val) {
    array.push(val)
  });
  return array
};
goog.iter.equals = function(iterable1, iterable2) {
  iterable1 = goog.iter.toIterator(iterable1);
  iterable2 = goog.iter.toIterator(iterable2);
  var b1, b2;
  try {
    while(true) {
      b1 = b2 = false;
      var val1 = iterable1.next();
      b1 = true;
      var val2 = iterable2.next();
      b2 = true;
      if(val1 != val2) {
        return false
      }
    }
  }catch(ex) {
    if(ex !== goog.iter.StopIteration) {
      throw ex;
    }else {
      if(b1 && !b2) {
        return false
      }
      if(!b2) {
        try {
          val2 = iterable2.next();
          return false
        }catch(ex1) {
          if(ex1 !== goog.iter.StopIteration) {
            throw ex1;
          }
          return true
        }
      }
    }
  }
  return false
};
goog.iter.nextOrValue = function(iterable, defaultValue) {
  try {
    return goog.iter.toIterator(iterable).next()
  }catch(e) {
    if(e != goog.iter.StopIteration) {
      throw e;
    }
    return defaultValue
  }
};
goog.iter.product = function(var_args) {
  var someArrayEmpty = goog.array.some(arguments, function(arr) {
    return!arr.length
  });
  if(someArrayEmpty || !arguments.length) {
    return new goog.iter.Iterator
  }
  var iter = new goog.iter.Iterator;
  var arrays = arguments;
  var indicies = goog.array.repeat(0, arrays.length);
  iter.next = function() {
    if(indicies) {
      var retVal = goog.array.map(indicies, function(valueIndex, arrayIndex) {
        return arrays[arrayIndex][valueIndex]
      });
      for(var i = indicies.length - 1;i >= 0;i--) {
        goog.asserts.assert(indicies);
        if(indicies[i] < arrays[i].length - 1) {
          indicies[i]++;
          break
        }
        if(i == 0) {
          indicies = null;
          break
        }
        indicies[i] = 0
      }
      return retVal
    }
    throw goog.iter.StopIteration;
  };
  return iter
};
goog.iter.cycle = function(iterable) {
  var baseIterator = goog.iter.toIterator(iterable);
  var cache = [];
  var cacheIndex = 0;
  var iter = new goog.iter.Iterator;
  var useCache = false;
  iter.next = function() {
    var returnElement = null;
    if(!useCache) {
      try {
        returnElement = baseIterator.next();
        cache.push(returnElement);
        return returnElement
      }catch(e) {
        if(e != goog.iter.StopIteration || goog.array.isEmpty(cache)) {
          throw e;
        }
        useCache = true
      }
    }
    returnElement = cache[cacheIndex];
    cacheIndex = (cacheIndex + 1) % cache.length;
    return returnElement
  };
  return iter
};
goog.provide("goog.structs.Map");
goog.require("goog.iter.Iterator");
goog.require("goog.iter.StopIteration");
goog.require("goog.object");
goog.require("goog.structs");
goog.structs.Map = function(opt_map, var_args) {
  this.map_ = {};
  this.keys_ = [];
  var argLength = arguments.length;
  if(argLength > 1) {
    if(argLength % 2) {
      throw Error("Uneven number of arguments");
    }
    for(var i = 0;i < argLength;i += 2) {
      this.set(arguments[i], arguments[i + 1])
    }
  }else {
    if(opt_map) {
      this.addAll(opt_map)
    }
  }
};
goog.structs.Map.prototype.count_ = 0;
goog.structs.Map.prototype.version_ = 0;
goog.structs.Map.prototype.getCount = function() {
  return this.count_
};
goog.structs.Map.prototype.getValues = function() {
  this.cleanupKeysArray_();
  var rv = [];
  for(var i = 0;i < this.keys_.length;i++) {
    var key = this.keys_[i];
    rv.push(this.map_[key])
  }
  return rv
};
goog.structs.Map.prototype.getKeys = function() {
  this.cleanupKeysArray_();
  return this.keys_.concat()
};
goog.structs.Map.prototype.containsKey = function(key) {
  return goog.structs.Map.hasKey_(this.map_, key)
};
goog.structs.Map.prototype.containsValue = function(val) {
  for(var i = 0;i < this.keys_.length;i++) {
    var key = this.keys_[i];
    if(goog.structs.Map.hasKey_(this.map_, key) && this.map_[key] == val) {
      return true
    }
  }
  return false
};
goog.structs.Map.prototype.equals = function(otherMap, opt_equalityFn) {
  if(this === otherMap) {
    return true
  }
  if(this.count_ != otherMap.getCount()) {
    return false
  }
  var equalityFn = opt_equalityFn || goog.structs.Map.defaultEquals;
  this.cleanupKeysArray_();
  for(var key, i = 0;key = this.keys_[i];i++) {
    if(!equalityFn(this.get(key), otherMap.get(key))) {
      return false
    }
  }
  return true
};
goog.structs.Map.defaultEquals = function(a, b) {
  return a === b
};
goog.structs.Map.prototype.isEmpty = function() {
  return this.count_ == 0
};
goog.structs.Map.prototype.clear = function() {
  this.map_ = {};
  this.keys_.length = 0;
  this.count_ = 0;
  this.version_ = 0
};
goog.structs.Map.prototype.remove = function(key) {
  if(goog.structs.Map.hasKey_(this.map_, key)) {
    delete this.map_[key];
    this.count_--;
    this.version_++;
    if(this.keys_.length > 2 * this.count_) {
      this.cleanupKeysArray_()
    }
    return true
  }
  return false
};
goog.structs.Map.prototype.cleanupKeysArray_ = function() {
  if(this.count_ != this.keys_.length) {
    var srcIndex = 0;
    var destIndex = 0;
    while(srcIndex < this.keys_.length) {
      var key = this.keys_[srcIndex];
      if(goog.structs.Map.hasKey_(this.map_, key)) {
        this.keys_[destIndex++] = key
      }
      srcIndex++
    }
    this.keys_.length = destIndex
  }
  if(this.count_ != this.keys_.length) {
    var seen = {};
    var srcIndex = 0;
    var destIndex = 0;
    while(srcIndex < this.keys_.length) {
      var key = this.keys_[srcIndex];
      if(!goog.structs.Map.hasKey_(seen, key)) {
        this.keys_[destIndex++] = key;
        seen[key] = 1
      }
      srcIndex++
    }
    this.keys_.length = destIndex
  }
};
goog.structs.Map.prototype.get = function(key, opt_val) {
  if(goog.structs.Map.hasKey_(this.map_, key)) {
    return this.map_[key]
  }
  return opt_val
};
goog.structs.Map.prototype.set = function(key, value) {
  if(!goog.structs.Map.hasKey_(this.map_, key)) {
    this.count_++;
    this.keys_.push(key);
    this.version_++
  }
  this.map_[key] = value
};
goog.structs.Map.prototype.addAll = function(map) {
  var keys, values;
  if(map instanceof goog.structs.Map) {
    keys = map.getKeys();
    values = map.getValues()
  }else {
    keys = goog.object.getKeys(map);
    values = goog.object.getValues(map)
  }
  for(var i = 0;i < keys.length;i++) {
    this.set(keys[i], values[i])
  }
};
goog.structs.Map.prototype.clone = function() {
  return new goog.structs.Map(this)
};
goog.structs.Map.prototype.transpose = function() {
  var transposed = new goog.structs.Map;
  for(var i = 0;i < this.keys_.length;i++) {
    var key = this.keys_[i];
    var value = this.map_[key];
    transposed.set(value, key)
  }
  return transposed
};
goog.structs.Map.prototype.toObject = function() {
  this.cleanupKeysArray_();
  var obj = {};
  for(var i = 0;i < this.keys_.length;i++) {
    var key = this.keys_[i];
    obj[key] = this.map_[key]
  }
  return obj
};
goog.structs.Map.prototype.getKeyIterator = function() {
  return this.__iterator__(true)
};
goog.structs.Map.prototype.getValueIterator = function() {
  return this.__iterator__(false)
};
goog.structs.Map.prototype.__iterator__ = function(opt_keys) {
  this.cleanupKeysArray_();
  var i = 0;
  var keys = this.keys_;
  var map = this.map_;
  var version = this.version_;
  var selfObj = this;
  var newIter = new goog.iter.Iterator;
  newIter.next = function() {
    while(true) {
      if(version != selfObj.version_) {
        throw Error("The map has changed since the iterator was created");
      }
      if(i >= keys.length) {
        throw goog.iter.StopIteration;
      }
      var key = keys[i++];
      return opt_keys ? key : map[key]
    }
  };
  return newIter
};
goog.structs.Map.hasKey_ = function(obj, key) {
  return Object.prototype.hasOwnProperty.call(obj, key)
};
goog.provide("goog.structs.Set");
goog.require("goog.structs");
goog.require("goog.structs.Collection");
goog.require("goog.structs.Map");
goog.structs.Set = function(opt_values) {
  this.map_ = new goog.structs.Map;
  if(opt_values) {
    this.addAll(opt_values)
  }
};
goog.structs.Set.getKey_ = function(val) {
  var type = typeof val;
  if(type == "object" && val || type == "function") {
    return"o" + goog.getUid(val)
  }else {
    return type.substr(0, 1) + val
  }
};
goog.structs.Set.prototype.getCount = function() {
  return this.map_.getCount()
};
goog.structs.Set.prototype.add = function(element) {
  this.map_.set(goog.structs.Set.getKey_(element), element)
};
goog.structs.Set.prototype.addAll = function(col) {
  var values = goog.structs.getValues(col);
  var l = values.length;
  for(var i = 0;i < l;i++) {
    this.add(values[i])
  }
};
goog.structs.Set.prototype.removeAll = function(col) {
  var values = goog.structs.getValues(col);
  var l = values.length;
  for(var i = 0;i < l;i++) {
    this.remove(values[i])
  }
};
goog.structs.Set.prototype.remove = function(element) {
  return this.map_.remove(goog.structs.Set.getKey_(element))
};
goog.structs.Set.prototype.clear = function() {
  this.map_.clear()
};
goog.structs.Set.prototype.isEmpty = function() {
  return this.map_.isEmpty()
};
goog.structs.Set.prototype.contains = function(element) {
  return this.map_.containsKey(goog.structs.Set.getKey_(element))
};
goog.structs.Set.prototype.containsAll = function(col) {
  return goog.structs.every(col, this.contains, this)
};
goog.structs.Set.prototype.intersection = function(col) {
  var result = new goog.structs.Set;
  var values = goog.structs.getValues(col);
  for(var i = 0;i < values.length;i++) {
    var value = values[i];
    if(this.contains(value)) {
      result.add(value)
    }
  }
  return result
};
goog.structs.Set.prototype.getValues = function() {
  return this.map_.getValues()
};
goog.structs.Set.prototype.clone = function() {
  return new goog.structs.Set(this)
};
goog.structs.Set.prototype.equals = function(col) {
  return this.getCount() == goog.structs.getCount(col) && this.isSubsetOf(col)
};
goog.structs.Set.prototype.isSubsetOf = function(col) {
  var colCount = goog.structs.getCount(col);
  if(this.getCount() > colCount) {
    return false
  }
  if(!(col instanceof goog.structs.Set) && colCount > 5) {
    col = new goog.structs.Set(col)
  }
  return goog.structs.every(this, function(value) {
    return goog.structs.contains(col, value)
  })
};
goog.structs.Set.prototype.__iterator__ = function(opt_keys) {
  return this.map_.__iterator__(false)
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
goog.provide("goog.debug");
goog.require("goog.array");
goog.require("goog.string");
goog.require("goog.structs.Set");
goog.require("goog.userAgent");
goog.debug.catchErrors = function(logFunc, opt_cancel, opt_target) {
  var target = opt_target || goog.global;
  var oldErrorHandler = target.onerror;
  var retVal = goog.userAgent.WEBKIT ? !opt_cancel : !!opt_cancel;
  target.onerror = function(message, url, line) {
    if(oldErrorHandler) {
      oldErrorHandler(message, url, line)
    }
    logFunc({message:message, fileName:url, line:line});
    return retVal
  }
};
goog.debug.expose = function(obj, opt_showFn) {
  if(typeof obj == "undefined") {
    return"undefined"
  }
  if(obj == null) {
    return"NULL"
  }
  var str = [];
  for(var x in obj) {
    if(!opt_showFn && goog.isFunction(obj[x])) {
      continue
    }
    var s = x + " = ";
    try {
      s += obj[x]
    }catch(e) {
      s += "*** " + e + " ***"
    }
    str.push(s)
  }
  return str.join("\n")
};
goog.debug.deepExpose = function(obj, opt_showFn) {
  var previous = new goog.structs.Set;
  var str = [];
  var helper = function(obj, space) {
    var nestspace = space + "  ";
    var indentMultiline = function(str) {
      return str.replace(/\n/g, "\n" + space)
    };
    try {
      if(!goog.isDef(obj)) {
        str.push("undefined")
      }else {
        if(goog.isNull(obj)) {
          str.push("NULL")
        }else {
          if(goog.isString(obj)) {
            str.push('"' + indentMultiline(obj) + '"')
          }else {
            if(goog.isFunction(obj)) {
              str.push(indentMultiline(String(obj)))
            }else {
              if(goog.isObject(obj)) {
                if(previous.contains(obj)) {
                  str.push("*** reference loop detected ***")
                }else {
                  previous.add(obj);
                  str.push("{");
                  for(var x in obj) {
                    if(!opt_showFn && goog.isFunction(obj[x])) {
                      continue
                    }
                    str.push("\n");
                    str.push(nestspace);
                    str.push(x + " = ");
                    helper(obj[x], nestspace)
                  }
                  str.push("\n" + space + "}")
                }
              }else {
                str.push(obj)
              }
            }
          }
        }
      }
    }catch(e) {
      str.push("*** " + e + " ***")
    }
  };
  helper(obj, "");
  return str.join("")
};
goog.debug.exposeArray = function(arr) {
  var str = [];
  for(var i = 0;i < arr.length;i++) {
    if(goog.isArray(arr[i])) {
      str.push(goog.debug.exposeArray(arr[i]))
    }else {
      str.push(arr[i])
    }
  }
  return"[ " + str.join(", ") + " ]"
};
goog.debug.exposeException = function(err, opt_fn) {
  try {
    var e = goog.debug.normalizeErrorObject(err);
    var error = "Message: " + goog.string.htmlEscape(e.message) + '\nUrl: <a href="view-source:' + e.fileName + '" target="_new">' + e.fileName + "</a>\nLine: " + e.lineNumber + "\n\nBrowser stack:\n" + goog.string.htmlEscape(e.stack + "-> ") + "[end]\n\nJS stack traversal:\n" + goog.string.htmlEscape(goog.debug.getStacktrace(opt_fn) + "-> ");
    return error
  }catch(e2) {
    return"Exception trying to expose exception! You win, we lose. " + e2
  }
};
goog.debug.normalizeErrorObject = function(err) {
  var href = goog.getObjectByName("window.location.href");
  if(goog.isString(err)) {
    return{"message":err, "name":"Unknown error", "lineNumber":"Not available", "fileName":href, "stack":"Not available"}
  }
  var lineNumber, fileName;
  var threwError = false;
  try {
    lineNumber = err.lineNumber || err.line || "Not available"
  }catch(e) {
    lineNumber = "Not available";
    threwError = true
  }
  try {
    fileName = err.fileName || err.filename || err.sourceURL || href
  }catch(e) {
    fileName = "Not available";
    threwError = true
  }
  if(threwError || !err.lineNumber || !err.fileName || !err.stack) {
    return{"message":err.message, "name":err.name, "lineNumber":lineNumber, "fileName":fileName, "stack":err.stack || "Not available"}
  }
  return err
};
goog.debug.enhanceError = function(err, opt_message) {
  var error = typeof err == "string" ? Error(err) : err;
  if(!error.stack) {
    error.stack = goog.debug.getStacktrace(arguments.callee.caller)
  }
  if(opt_message) {
    var x = 0;
    while(error["message" + x]) {
      ++x
    }
    error["message" + x] = String(opt_message)
  }
  return error
};
goog.debug.getStacktraceSimple = function(opt_depth) {
  var sb = [];
  var fn = arguments.callee.caller;
  var depth = 0;
  while(fn && (!opt_depth || depth < opt_depth)) {
    sb.push(goog.debug.getFunctionName(fn));
    sb.push("()\n");
    try {
      fn = fn.caller
    }catch(e) {
      sb.push("[exception trying to get caller]\n");
      break
    }
    depth++;
    if(depth >= goog.debug.MAX_STACK_DEPTH) {
      sb.push("[...long stack...]");
      break
    }
  }
  if(opt_depth && depth >= opt_depth) {
    sb.push("[...reached max depth limit...]")
  }else {
    sb.push("[end]")
  }
  return sb.join("")
};
goog.debug.MAX_STACK_DEPTH = 50;
goog.debug.getStacktrace = function(opt_fn) {
  return goog.debug.getStacktraceHelper_(opt_fn || arguments.callee.caller, [])
};
goog.debug.getStacktraceHelper_ = function(fn, visited) {
  var sb = [];
  if(goog.array.contains(visited, fn)) {
    sb.push("[...circular reference...]")
  }else {
    if(fn && visited.length < goog.debug.MAX_STACK_DEPTH) {
      sb.push(goog.debug.getFunctionName(fn) + "(");
      var args = fn.arguments;
      for(var i = 0;i < args.length;i++) {
        if(i > 0) {
          sb.push(", ")
        }
        var argDesc;
        var arg = args[i];
        switch(typeof arg) {
          case "object":
            argDesc = arg ? "object" : "null";
            break;
          case "string":
            argDesc = arg;
            break;
          case "number":
            argDesc = String(arg);
            break;
          case "boolean":
            argDesc = arg ? "true" : "false";
            break;
          case "function":
            argDesc = goog.debug.getFunctionName(arg);
            argDesc = argDesc ? argDesc : "[fn]";
            break;
          case "undefined":
          ;
          default:
            argDesc = typeof arg;
            break
        }
        if(argDesc.length > 40) {
          argDesc = argDesc.substr(0, 40) + "..."
        }
        sb.push(argDesc)
      }
      visited.push(fn);
      sb.push(")\n");
      try {
        sb.push(goog.debug.getStacktraceHelper_(fn.caller, visited))
      }catch(e) {
        sb.push("[exception trying to get caller]\n")
      }
    }else {
      if(fn) {
        sb.push("[...long stack...]")
      }else {
        sb.push("[end]")
      }
    }
  }
  return sb.join("")
};
goog.debug.setFunctionResolver = function(resolver) {
  goog.debug.fnNameResolver_ = resolver
};
goog.debug.getFunctionName = function(fn) {
  if(goog.debug.fnNameCache_[fn]) {
    return goog.debug.fnNameCache_[fn]
  }
  if(goog.debug.fnNameResolver_) {
    var name = goog.debug.fnNameResolver_(fn);
    if(name) {
      goog.debug.fnNameCache_[fn] = name;
      return name
    }
  }
  var functionSource = String(fn);
  if(!goog.debug.fnNameCache_[functionSource]) {
    var matches = /function ([^\(]+)/.exec(functionSource);
    if(matches) {
      var method = matches[1];
      goog.debug.fnNameCache_[functionSource] = method
    }else {
      goog.debug.fnNameCache_[functionSource] = "[Anonymous]"
    }
  }
  return goog.debug.fnNameCache_[functionSource]
};
goog.debug.makeWhitespaceVisible = function(string) {
  return string.replace(/ /g, "[_]").replace(/\f/g, "[f]").replace(/\n/g, "[n]\n").replace(/\r/g, "[r]").replace(/\t/g, "[t]")
};
goog.debug.fnNameCache_ = {};
goog.debug.fnNameResolver_;
goog.provide("goog.debug.LogRecord");
goog.debug.LogRecord = function(level, msg, loggerName, opt_time, opt_sequenceNumber) {
  this.reset(level, msg, loggerName, opt_time, opt_sequenceNumber)
};
goog.debug.LogRecord.prototype.time_;
goog.debug.LogRecord.prototype.level_;
goog.debug.LogRecord.prototype.msg_;
goog.debug.LogRecord.prototype.loggerName_;
goog.debug.LogRecord.prototype.sequenceNumber_ = 0;
goog.debug.LogRecord.prototype.exception_ = null;
goog.debug.LogRecord.prototype.exceptionText_ = null;
goog.debug.LogRecord.ENABLE_SEQUENCE_NUMBERS = true;
goog.debug.LogRecord.nextSequenceNumber_ = 0;
goog.debug.LogRecord.prototype.reset = function(level, msg, loggerName, opt_time, opt_sequenceNumber) {
  if(goog.debug.LogRecord.ENABLE_SEQUENCE_NUMBERS) {
    this.sequenceNumber_ = typeof opt_sequenceNumber == "number" ? opt_sequenceNumber : goog.debug.LogRecord.nextSequenceNumber_++
  }
  this.time_ = opt_time || goog.now();
  this.level_ = level;
  this.msg_ = msg;
  this.loggerName_ = loggerName;
  delete this.exception_;
  delete this.exceptionText_
};
goog.debug.LogRecord.prototype.getLoggerName = function() {
  return this.loggerName_
};
goog.debug.LogRecord.prototype.getException = function() {
  return this.exception_
};
goog.debug.LogRecord.prototype.setException = function(exception) {
  this.exception_ = exception
};
goog.debug.LogRecord.prototype.getExceptionText = function() {
  return this.exceptionText_
};
goog.debug.LogRecord.prototype.setExceptionText = function(text) {
  this.exceptionText_ = text
};
goog.debug.LogRecord.prototype.setLoggerName = function(loggerName) {
  this.loggerName_ = loggerName
};
goog.debug.LogRecord.prototype.getLevel = function() {
  return this.level_
};
goog.debug.LogRecord.prototype.setLevel = function(level) {
  this.level_ = level
};
goog.debug.LogRecord.prototype.getMessage = function() {
  return this.msg_
};
goog.debug.LogRecord.prototype.setMessage = function(msg) {
  this.msg_ = msg
};
goog.debug.LogRecord.prototype.getMillis = function() {
  return this.time_
};
goog.debug.LogRecord.prototype.setMillis = function(time) {
  this.time_ = time
};
goog.debug.LogRecord.prototype.getSequenceNumber = function() {
  return this.sequenceNumber_
};
goog.provide("goog.debug.LogBuffer");
goog.require("goog.asserts");
goog.require("goog.debug.LogRecord");
goog.debug.LogBuffer = function() {
  goog.asserts.assert(goog.debug.LogBuffer.isBufferingEnabled(), "Cannot use goog.debug.LogBuffer without defining " + "goog.debug.LogBuffer.CAPACITY.");
  this.clear()
};
goog.debug.LogBuffer.getInstance = function() {
  if(!goog.debug.LogBuffer.instance_) {
    goog.debug.LogBuffer.instance_ = new goog.debug.LogBuffer
  }
  return goog.debug.LogBuffer.instance_
};
goog.debug.LogBuffer.CAPACITY = 0;
goog.debug.LogBuffer.prototype.buffer_;
goog.debug.LogBuffer.prototype.curIndex_;
goog.debug.LogBuffer.prototype.isFull_;
goog.debug.LogBuffer.prototype.addRecord = function(level, msg, loggerName) {
  var curIndex = (this.curIndex_ + 1) % goog.debug.LogBuffer.CAPACITY;
  this.curIndex_ = curIndex;
  if(this.isFull_) {
    var ret = this.buffer_[curIndex];
    ret.reset(level, msg, loggerName);
    return ret
  }
  this.isFull_ = curIndex == goog.debug.LogBuffer.CAPACITY - 1;
  return this.buffer_[curIndex] = new goog.debug.LogRecord(level, msg, loggerName)
};
goog.debug.LogBuffer.isBufferingEnabled = function() {
  return goog.debug.LogBuffer.CAPACITY > 0
};
goog.debug.LogBuffer.prototype.clear = function() {
  this.buffer_ = new Array(goog.debug.LogBuffer.CAPACITY);
  this.curIndex_ = -1;
  this.isFull_ = false
};
goog.debug.LogBuffer.prototype.forEachRecord = function(func) {
  var buffer = this.buffer_;
  if(!buffer[0]) {
    return
  }
  var curIndex = this.curIndex_;
  var i = this.isFull_ ? curIndex : -1;
  do {
    i = (i + 1) % goog.debug.LogBuffer.CAPACITY;
    func(buffer[i])
  }while(i != curIndex)
};
goog.provide("goog.debug.LogManager");
goog.provide("goog.debug.Logger");
goog.provide("goog.debug.Logger.Level");
goog.require("goog.array");
goog.require("goog.asserts");
goog.require("goog.debug");
goog.require("goog.debug.LogBuffer");
goog.require("goog.debug.LogRecord");
goog.debug.Logger = function(name) {
  this.name_ = name
};
goog.debug.Logger.prototype.parent_ = null;
goog.debug.Logger.prototype.level_ = null;
goog.debug.Logger.prototype.children_ = null;
goog.debug.Logger.prototype.handlers_ = null;
goog.debug.Logger.ENABLE_HIERARCHY = true;
if(!goog.debug.Logger.ENABLE_HIERARCHY) {
  goog.debug.Logger.rootHandlers_ = [];
  goog.debug.Logger.rootLevel_
}
goog.debug.Logger.Level = function(name, value) {
  this.name = name;
  this.value = value
};
goog.debug.Logger.Level.prototype.toString = function() {
  return this.name
};
goog.debug.Logger.Level.OFF = new goog.debug.Logger.Level("OFF", Infinity);
goog.debug.Logger.Level.SHOUT = new goog.debug.Logger.Level("SHOUT", 1200);
goog.debug.Logger.Level.SEVERE = new goog.debug.Logger.Level("SEVERE", 1E3);
goog.debug.Logger.Level.WARNING = new goog.debug.Logger.Level("WARNING", 900);
goog.debug.Logger.Level.INFO = new goog.debug.Logger.Level("INFO", 800);
goog.debug.Logger.Level.CONFIG = new goog.debug.Logger.Level("CONFIG", 700);
goog.debug.Logger.Level.FINE = new goog.debug.Logger.Level("FINE", 500);
goog.debug.Logger.Level.FINER = new goog.debug.Logger.Level("FINER", 400);
goog.debug.Logger.Level.FINEST = new goog.debug.Logger.Level("FINEST", 300);
goog.debug.Logger.Level.ALL = new goog.debug.Logger.Level("ALL", 0);
goog.debug.Logger.Level.PREDEFINED_LEVELS = [goog.debug.Logger.Level.OFF, goog.debug.Logger.Level.SHOUT, goog.debug.Logger.Level.SEVERE, goog.debug.Logger.Level.WARNING, goog.debug.Logger.Level.INFO, goog.debug.Logger.Level.CONFIG, goog.debug.Logger.Level.FINE, goog.debug.Logger.Level.FINER, goog.debug.Logger.Level.FINEST, goog.debug.Logger.Level.ALL];
goog.debug.Logger.Level.predefinedLevelsCache_ = null;
goog.debug.Logger.Level.createPredefinedLevelsCache_ = function() {
  goog.debug.Logger.Level.predefinedLevelsCache_ = {};
  for(var i = 0, level;level = goog.debug.Logger.Level.PREDEFINED_LEVELS[i];i++) {
    goog.debug.Logger.Level.predefinedLevelsCache_[level.value] = level;
    goog.debug.Logger.Level.predefinedLevelsCache_[level.name] = level
  }
};
goog.debug.Logger.Level.getPredefinedLevel = function(name) {
  if(!goog.debug.Logger.Level.predefinedLevelsCache_) {
    goog.debug.Logger.Level.createPredefinedLevelsCache_()
  }
  return goog.debug.Logger.Level.predefinedLevelsCache_[name] || null
};
goog.debug.Logger.Level.getPredefinedLevelByValue = function(value) {
  if(!goog.debug.Logger.Level.predefinedLevelsCache_) {
    goog.debug.Logger.Level.createPredefinedLevelsCache_()
  }
  if(value in goog.debug.Logger.Level.predefinedLevelsCache_) {
    return goog.debug.Logger.Level.predefinedLevelsCache_[value]
  }
  for(var i = 0;i < goog.debug.Logger.Level.PREDEFINED_LEVELS.length;++i) {
    var level = goog.debug.Logger.Level.PREDEFINED_LEVELS[i];
    if(level.value <= value) {
      return level
    }
  }
  return null
};
goog.debug.Logger.getLogger = function(name) {
  return goog.debug.LogManager.getLogger(name)
};
goog.debug.Logger.logToProfilers = function(msg) {
  if(goog.global["console"]) {
    if(goog.global["console"]["timeStamp"]) {
      goog.global["console"]["timeStamp"](msg)
    }else {
      if(goog.global["console"]["markTimeline"]) {
        goog.global["console"]["markTimeline"](msg)
      }
    }
  }
  if(goog.global["msWriteProfilerMark"]) {
    goog.global["msWriteProfilerMark"](msg)
  }
};
goog.debug.Logger.prototype.getName = function() {
  return this.name_
};
goog.debug.Logger.prototype.addHandler = function(handler) {
  if(goog.debug.Logger.ENABLE_HIERARCHY) {
    if(!this.handlers_) {
      this.handlers_ = []
    }
    this.handlers_.push(handler)
  }else {
    goog.asserts.assert(!this.name_, "Cannot call addHandler on a non-root logger when " + "goog.debug.Logger.ENABLE_HIERARCHY is false.");
    goog.debug.Logger.rootHandlers_.push(handler)
  }
};
goog.debug.Logger.prototype.removeHandler = function(handler) {
  var handlers = goog.debug.Logger.ENABLE_HIERARCHY ? this.handlers_ : goog.debug.Logger.rootHandlers_;
  return!!handlers && goog.array.remove(handlers, handler)
};
goog.debug.Logger.prototype.getParent = function() {
  return this.parent_
};
goog.debug.Logger.prototype.getChildren = function() {
  if(!this.children_) {
    this.children_ = {}
  }
  return this.children_
};
goog.debug.Logger.prototype.setLevel = function(level) {
  if(goog.debug.Logger.ENABLE_HIERARCHY) {
    this.level_ = level
  }else {
    goog.asserts.assert(!this.name_, "Cannot call setLevel() on a non-root logger when " + "goog.debug.Logger.ENABLE_HIERARCHY is false.");
    goog.debug.Logger.rootLevel_ = level
  }
};
goog.debug.Logger.prototype.getLevel = function() {
  return this.level_
};
goog.debug.Logger.prototype.getEffectiveLevel = function() {
  if(!goog.debug.Logger.ENABLE_HIERARCHY) {
    return goog.debug.Logger.rootLevel_
  }
  if(this.level_) {
    return this.level_
  }
  if(this.parent_) {
    return this.parent_.getEffectiveLevel()
  }
  goog.asserts.fail("Root logger has no level set.");
  return null
};
goog.debug.Logger.prototype.isLoggable = function(level) {
  return level.value >= this.getEffectiveLevel().value
};
goog.debug.Logger.prototype.log = function(level, msg, opt_exception) {
  if(this.isLoggable(level)) {
    this.doLogRecord_(this.getLogRecord(level, msg, opt_exception))
  }
};
goog.debug.Logger.prototype.getLogRecord = function(level, msg, opt_exception) {
  if(goog.debug.LogBuffer.isBufferingEnabled()) {
    var logRecord = goog.debug.LogBuffer.getInstance().addRecord(level, msg, this.name_)
  }else {
    logRecord = new goog.debug.LogRecord(level, String(msg), this.name_)
  }
  if(opt_exception) {
    logRecord.setException(opt_exception);
    logRecord.setExceptionText(goog.debug.exposeException(opt_exception, arguments.callee.caller))
  }
  return logRecord
};
goog.debug.Logger.prototype.shout = function(msg, opt_exception) {
  this.log(goog.debug.Logger.Level.SHOUT, msg, opt_exception)
};
goog.debug.Logger.prototype.severe = function(msg, opt_exception) {
  this.log(goog.debug.Logger.Level.SEVERE, msg, opt_exception)
};
goog.debug.Logger.prototype.warning = function(msg, opt_exception) {
  this.log(goog.debug.Logger.Level.WARNING, msg, opt_exception)
};
goog.debug.Logger.prototype.info = function(msg, opt_exception) {
  this.log(goog.debug.Logger.Level.INFO, msg, opt_exception)
};
goog.debug.Logger.prototype.config = function(msg, opt_exception) {
  this.log(goog.debug.Logger.Level.CONFIG, msg, opt_exception)
};
goog.debug.Logger.prototype.fine = function(msg, opt_exception) {
  this.log(goog.debug.Logger.Level.FINE, msg, opt_exception)
};
goog.debug.Logger.prototype.finer = function(msg, opt_exception) {
  this.log(goog.debug.Logger.Level.FINER, msg, opt_exception)
};
goog.debug.Logger.prototype.finest = function(msg, opt_exception) {
  this.log(goog.debug.Logger.Level.FINEST, msg, opt_exception)
};
goog.debug.Logger.prototype.logRecord = function(logRecord) {
  if(this.isLoggable(logRecord.getLevel())) {
    this.doLogRecord_(logRecord)
  }
};
goog.debug.Logger.prototype.doLogRecord_ = function(logRecord) {
  goog.debug.Logger.logToProfilers("log:" + logRecord.getMessage());
  if(goog.debug.Logger.ENABLE_HIERARCHY) {
    var target = this;
    while(target) {
      target.callPublish_(logRecord);
      target = target.getParent()
    }
  }else {
    for(var i = 0, handler;handler = goog.debug.Logger.rootHandlers_[i++];) {
      handler(logRecord)
    }
  }
};
goog.debug.Logger.prototype.callPublish_ = function(logRecord) {
  if(this.handlers_) {
    for(var i = 0, handler;handler = this.handlers_[i];i++) {
      handler(logRecord)
    }
  }
};
goog.debug.Logger.prototype.setParent_ = function(parent) {
  this.parent_ = parent
};
goog.debug.Logger.prototype.addChild_ = function(name, logger) {
  this.getChildren()[name] = logger
};
goog.debug.LogManager = {};
goog.debug.LogManager.loggers_ = {};
goog.debug.LogManager.rootLogger_ = null;
goog.debug.LogManager.initialize = function() {
  if(!goog.debug.LogManager.rootLogger_) {
    goog.debug.LogManager.rootLogger_ = new goog.debug.Logger("");
    goog.debug.LogManager.loggers_[""] = goog.debug.LogManager.rootLogger_;
    goog.debug.LogManager.rootLogger_.setLevel(goog.debug.Logger.Level.CONFIG)
  }
};
goog.debug.LogManager.getLoggers = function() {
  return goog.debug.LogManager.loggers_
};
goog.debug.LogManager.getRoot = function() {
  goog.debug.LogManager.initialize();
  return goog.debug.LogManager.rootLogger_
};
goog.debug.LogManager.getLogger = function(name) {
  goog.debug.LogManager.initialize();
  var ret = goog.debug.LogManager.loggers_[name];
  return ret || goog.debug.LogManager.createLogger_(name)
};
goog.debug.LogManager.createFunctionForCatchErrors = function(opt_logger) {
  return function(info) {
    var logger = opt_logger || goog.debug.LogManager.getRoot();
    logger.severe("Error: " + info.message + " (" + info.fileName + " @ Line: " + info.line + ")")
  }
};
goog.debug.LogManager.createLogger_ = function(name) {
  var logger = new goog.debug.Logger(name);
  if(goog.debug.Logger.ENABLE_HIERARCHY) {
    var lastDotIndex = name.lastIndexOf(".");
    var parentName = name.substr(0, lastDotIndex);
    var leafName = name.substr(lastDotIndex + 1);
    var parentLogger = goog.debug.LogManager.getLogger(parentName);
    parentLogger.addChild_(leafName, logger);
    logger.setParent_(parentLogger)
  }
  goog.debug.LogManager.loggers_[name] = logger;
  return logger
};
goog.provide("onedit.core");
goog.require("cljs.core");
goog.require("goog.debug.Logger");
onedit.core.logger = goog.debug.Logger.getLogger.call(null, "onedit");
onedit.core.log = function log(p1__4433_SHARP_) {
  return onedit.core.logger.info(p1__4433_SHARP_)
};
onedit.core.local = window["localStorage"];
goog.provide("onedit.vi.insert");
goog.require("cljs.core");
goog.require("onedit.core");
goog.require("onedit.vi.core");
onedit.vi.insert.insert = function insert() {
  onedit.vi.core.mode = "insert";
  return onedit.core.set_text_mini.call(null, "Insert Mode")
};
goog.provide("goog.dom.selection");
goog.require("goog.string");
goog.require("goog.userAgent");
goog.dom.selection.setStart = function(textfield, pos) {
  if(goog.dom.selection.useSelectionProperties_(textfield)) {
    textfield.selectionStart = pos
  }else {
    if(goog.userAgent.IE) {
      var tmp = goog.dom.selection.getRangeIe_(textfield);
      var range = tmp[0];
      var selectionRange = tmp[1];
      if(range.inRange(selectionRange)) {
        pos = goog.dom.selection.canonicalizePositionIe_(textfield, pos);
        range.collapse(true);
        range.move("character", pos);
        range.select()
      }
    }
  }
};
goog.dom.selection.getStart = function(textfield) {
  return goog.dom.selection.getEndPoints_(textfield, true)[0]
};
goog.dom.selection.getEndPointsTextareaIe_ = function(range, selRange, getOnlyStart) {
  var selectionRange = selRange.duplicate();
  var beforeSelectionText = range.text;
  var untrimmedBeforeSelectionText = beforeSelectionText;
  var selectionText = selectionRange.text;
  var untrimmedSelectionText = selectionText;
  var isRangeEndTrimmed = false;
  while(!isRangeEndTrimmed) {
    if(range.compareEndPoints("StartToEnd", range) == 0) {
      isRangeEndTrimmed = true
    }else {
      range.moveEnd("character", -1);
      if(range.text == beforeSelectionText) {
        untrimmedBeforeSelectionText += "\r\n"
      }else {
        isRangeEndTrimmed = true
      }
    }
  }
  if(getOnlyStart) {
    return[untrimmedBeforeSelectionText.length, -1]
  }
  var isSelectionRangeEndTrimmed = false;
  while(!isSelectionRangeEndTrimmed) {
    if(selectionRange.compareEndPoints("StartToEnd", selectionRange) == 0) {
      isSelectionRangeEndTrimmed = true
    }else {
      selectionRange.moveEnd("character", -1);
      if(selectionRange.text == selectionText) {
        untrimmedSelectionText += "\r\n"
      }else {
        isSelectionRangeEndTrimmed = true
      }
    }
  }
  return[untrimmedBeforeSelectionText.length, untrimmedBeforeSelectionText.length + untrimmedSelectionText.length]
};
goog.dom.selection.getEndPoints = function(textfield) {
  return goog.dom.selection.getEndPoints_(textfield, false)
};
goog.dom.selection.getEndPoints_ = function(textfield, getOnlyStart) {
  var startPos = 0;
  var endPos = 0;
  if(goog.dom.selection.useSelectionProperties_(textfield)) {
    startPos = textfield.selectionStart;
    endPos = getOnlyStart ? -1 : textfield.selectionEnd
  }else {
    if(goog.userAgent.IE) {
      var tmp = goog.dom.selection.getRangeIe_(textfield);
      var range = tmp[0];
      var selectionRange = tmp[1];
      if(range.inRange(selectionRange)) {
        range.setEndPoint("EndToStart", selectionRange);
        if(textfield.type == "textarea") {
          return goog.dom.selection.getEndPointsTextareaIe_(range, selectionRange, getOnlyStart)
        }
        startPos = range.text.length;
        if(!getOnlyStart) {
          endPos = range.text.length + selectionRange.text.length
        }else {
          endPos = -1
        }
      }
    }
  }
  return[startPos, endPos]
};
goog.dom.selection.setEnd = function(textfield, pos) {
  if(goog.dom.selection.useSelectionProperties_(textfield)) {
    textfield.selectionEnd = pos
  }else {
    if(goog.userAgent.IE) {
      var tmp = goog.dom.selection.getRangeIe_(textfield);
      var range = tmp[0];
      var selectionRange = tmp[1];
      if(range.inRange(selectionRange)) {
        pos = goog.dom.selection.canonicalizePositionIe_(textfield, pos);
        var startCursorPos = goog.dom.selection.canonicalizePositionIe_(textfield, goog.dom.selection.getStart(textfield));
        selectionRange.collapse(true);
        selectionRange.moveEnd("character", pos - startCursorPos);
        selectionRange.select()
      }
    }
  }
};
goog.dom.selection.getEnd = function(textfield) {
  return goog.dom.selection.getEndPoints_(textfield, false)[1]
};
goog.dom.selection.setCursorPosition = function(textfield, pos) {
  if(goog.dom.selection.useSelectionProperties_(textfield)) {
    textfield.selectionStart = pos;
    textfield.selectionEnd = pos
  }else {
    if(goog.userAgent.IE) {
      pos = goog.dom.selection.canonicalizePositionIe_(textfield, pos);
      var sel = textfield.createTextRange();
      sel.collapse(true);
      sel.move("character", pos);
      sel.select()
    }
  }
};
goog.dom.selection.setText = function(textfield, text) {
  if(goog.dom.selection.useSelectionProperties_(textfield)) {
    var value = textfield.value;
    var oldSelectionStart = textfield.selectionStart;
    var before = value.substr(0, oldSelectionStart);
    var after = value.substr(textfield.selectionEnd);
    textfield.value = before + text + after;
    textfield.selectionStart = oldSelectionStart;
    textfield.selectionEnd = oldSelectionStart + text.length
  }else {
    if(goog.userAgent.IE) {
      var tmp = goog.dom.selection.getRangeIe_(textfield);
      var range = tmp[0];
      var selectionRange = tmp[1];
      if(!range.inRange(selectionRange)) {
        return
      }
      var range2 = selectionRange.duplicate();
      selectionRange.text = text;
      selectionRange.setEndPoint("StartToStart", range2);
      selectionRange.select()
    }else {
      throw Error("Cannot set the selection end");
    }
  }
};
goog.dom.selection.getText = function(textfield) {
  if(goog.dom.selection.useSelectionProperties_(textfield)) {
    var s = textfield.value;
    return s.substring(textfield.selectionStart, textfield.selectionEnd)
  }
  if(goog.userAgent.IE) {
    var tmp = goog.dom.selection.getRangeIe_(textfield);
    var range = tmp[0];
    var selectionRange = tmp[1];
    if(!range.inRange(selectionRange)) {
      return""
    }else {
      if(textfield.type == "textarea") {
        return goog.dom.selection.getSelectionRangeText_(selectionRange)
      }
    }
    return selectionRange.text
  }
  throw Error("Cannot get the selection text");
};
goog.dom.selection.getSelectionRangeText_ = function(selRange) {
  var selectionRange = selRange.duplicate();
  var selectionText = selectionRange.text;
  var untrimmedSelectionText = selectionText;
  var isSelectionRangeEndTrimmed = false;
  while(!isSelectionRangeEndTrimmed) {
    if(selectionRange.compareEndPoints("StartToEnd", selectionRange) == 0) {
      isSelectionRangeEndTrimmed = true
    }else {
      selectionRange.moveEnd("character", -1);
      if(selectionRange.text == selectionText) {
        untrimmedSelectionText += "\r\n"
      }else {
        isSelectionRangeEndTrimmed = true
      }
    }
  }
  return untrimmedSelectionText
};
goog.dom.selection.getRangeIe_ = function(el) {
  var doc = el.ownerDocument || el.document;
  var selectionRange = doc.selection.createRange();
  var range;
  if(el.type == "textarea") {
    range = doc.body.createTextRange();
    range.moveToElementText(el)
  }else {
    range = el.createTextRange()
  }
  return[range, selectionRange]
};
goog.dom.selection.canonicalizePositionIe_ = function(textfield, pos) {
  if(textfield.type == "textarea") {
    var value = textfield.value.substring(0, pos);
    pos = goog.string.canonicalizeNewlines(value).length
  }
  return pos
};
goog.dom.selection.useSelectionProperties_ = function(el) {
  try {
    return typeof el.selectionStart == "number"
  }catch(e) {
    return false
  }
};
goog.provide("onedit.vi");
goog.require("cljs.core");
goog.require("onedit.core");
goog.require("onedit.vi.core");
goog.require("onedit.vi.insert");
goog.require("goog.dom.selection");
onedit.vi.insert_code = 105;
onedit.vi.escape_code = 27;
onedit.vi.command_code = 58;
onedit.vi.j = 106;
onedit.vi.k = 107;
onedit.vi.l = 108;
onedit.vi.escape = function escape() {
  onedit.vi.core.mode = null;
  return onedit.core.set_text_mini.call(null, "")
};
onedit.vi.keypress = function keypress(e) {
  var code__4445 = e.charCode;
  var buffer__4446 = onedit.core.buffer.call(null);
  if(cljs.core._EQ_.call(null, onedit.vi.core.mode, "insert")) {
  }else {
    e.preventDefault()
  }
  var pred__4447__4450 = cljs.core._EQ_;
  var expr__4448__4451 = code__4445;
  if(cljs.core.truth_(pred__4447__4450.call(null, onedit.vi.insert_code, expr__4448__4451))) {
    onedit.vi.insert.insert.call(null)
  }else {
    if(cljs.core.truth_(pred__4447__4450.call(null, onedit.vi.l, expr__4448__4451))) {
      onedit.core.log.call(null, goog.dom.selection.getEnd.call(null, buffer__4446));
      goog.dom.selection.setStart.call(null, buffer__4446, goog.dom.selection.getStart.call(null, buffer__4446) + 1)
    }else {
      if(cljs.core.truth_(pred__4447__4450.call(null, onedit.vi.escape_code, expr__4448__4451))) {
        onedit.vi.escape.call(null)
      }else {
        if(cljs.core.truth_(pred__4447__4450.call(null, onedit.vi.command_code, expr__4448__4451))) {
        }else {
        }
      }
    }
  }
  return onedit.core.logger.info(code__4445)
};
goog.provide("goog.events.EventWrapper");
goog.events.EventWrapper = function() {
};
goog.events.EventWrapper.prototype.listen = function(src, listener, opt_capt, opt_scope, opt_eventHandler) {
};
goog.events.EventWrapper.prototype.unlisten = function(src, listener, opt_capt, opt_scope, opt_eventHandler) {
};
goog.provide("goog.debug.RelativeTimeProvider");
goog.debug.RelativeTimeProvider = function() {
  this.relativeTimeStart_ = goog.now()
};
goog.debug.RelativeTimeProvider.defaultInstance_ = new goog.debug.RelativeTimeProvider;
goog.debug.RelativeTimeProvider.prototype.set = function(timeStamp) {
  this.relativeTimeStart_ = timeStamp
};
goog.debug.RelativeTimeProvider.prototype.reset = function() {
  this.set(goog.now())
};
goog.debug.RelativeTimeProvider.prototype.get = function() {
  return this.relativeTimeStart_
};
goog.debug.RelativeTimeProvider.getDefaultInstance = function() {
  return goog.debug.RelativeTimeProvider.defaultInstance_
};
goog.provide("goog.debug.Formatter");
goog.provide("goog.debug.HtmlFormatter");
goog.provide("goog.debug.TextFormatter");
goog.require("goog.debug.RelativeTimeProvider");
goog.require("goog.string");
goog.debug.Formatter = function(opt_prefix) {
  this.prefix_ = opt_prefix || "";
  this.startTimeProvider_ = goog.debug.RelativeTimeProvider.getDefaultInstance()
};
goog.debug.Formatter.prototype.showAbsoluteTime = true;
goog.debug.Formatter.prototype.showRelativeTime = true;
goog.debug.Formatter.prototype.showLoggerName = true;
goog.debug.Formatter.prototype.showExceptionText = false;
goog.debug.Formatter.prototype.showSeverityLevel = false;
goog.debug.Formatter.prototype.formatRecord = goog.abstractMethod;
goog.debug.Formatter.prototype.setStartTimeProvider = function(provider) {
  this.startTimeProvider_ = provider
};
goog.debug.Formatter.prototype.getStartTimeProvider = function() {
  return this.startTimeProvider_
};
goog.debug.Formatter.prototype.resetRelativeTimeStart = function() {
  this.startTimeProvider_.reset()
};
goog.debug.Formatter.getDateTimeStamp_ = function(logRecord) {
  var time = new Date(logRecord.getMillis());
  return goog.debug.Formatter.getTwoDigitString_(time.getFullYear() - 2E3) + goog.debug.Formatter.getTwoDigitString_(time.getMonth() + 1) + goog.debug.Formatter.getTwoDigitString_(time.getDate()) + " " + goog.debug.Formatter.getTwoDigitString_(time.getHours()) + ":" + goog.debug.Formatter.getTwoDigitString_(time.getMinutes()) + ":" + goog.debug.Formatter.getTwoDigitString_(time.getSeconds()) + "." + goog.debug.Formatter.getTwoDigitString_(Math.floor(time.getMilliseconds() / 10))
};
goog.debug.Formatter.getTwoDigitString_ = function(n) {
  if(n < 10) {
    return"0" + n
  }
  return String(n)
};
goog.debug.Formatter.getRelativeTime_ = function(logRecord, relativeTimeStart) {
  var ms = logRecord.getMillis() - relativeTimeStart;
  var sec = ms / 1E3;
  var str = sec.toFixed(3);
  var spacesToPrepend = 0;
  if(sec < 1) {
    spacesToPrepend = 2
  }else {
    while(sec < 100) {
      spacesToPrepend++;
      sec *= 10
    }
  }
  while(spacesToPrepend-- > 0) {
    str = " " + str
  }
  return str
};
goog.debug.HtmlFormatter = function(opt_prefix) {
  goog.debug.Formatter.call(this, opt_prefix)
};
goog.inherits(goog.debug.HtmlFormatter, goog.debug.Formatter);
goog.debug.HtmlFormatter.prototype.showExceptionText = true;
goog.debug.HtmlFormatter.prototype.formatRecord = function(logRecord) {
  var className;
  switch(logRecord.getLevel().value) {
    case goog.debug.Logger.Level.SHOUT.value:
      className = "dbg-sh";
      break;
    case goog.debug.Logger.Level.SEVERE.value:
      className = "dbg-sev";
      break;
    case goog.debug.Logger.Level.WARNING.value:
      className = "dbg-w";
      break;
    case goog.debug.Logger.Level.INFO.value:
      className = "dbg-i";
      break;
    case goog.debug.Logger.Level.FINE.value:
    ;
    default:
      className = "dbg-f";
      break
  }
  var sb = [];
  sb.push(this.prefix_, " ");
  if(this.showAbsoluteTime) {
    sb.push("[", goog.debug.Formatter.getDateTimeStamp_(logRecord), "] ")
  }
  if(this.showRelativeTime) {
    sb.push("[", goog.string.whitespaceEscape(goog.debug.Formatter.getRelativeTime_(logRecord, this.startTimeProvider_.get())), "s] ")
  }
  if(this.showLoggerName) {
    sb.push("[", goog.string.htmlEscape(logRecord.getLoggerName()), "] ")
  }
  sb.push('<span class="', className, '">', goog.string.newLineToBr(goog.string.whitespaceEscape(goog.string.htmlEscape(logRecord.getMessage()))));
  if(this.showExceptionText && logRecord.getException()) {
    sb.push("<br>", goog.string.newLineToBr(goog.string.whitespaceEscape(logRecord.getExceptionText() || "")))
  }
  sb.push("</span><br>");
  return sb.join("")
};
goog.debug.TextFormatter = function(opt_prefix) {
  goog.debug.Formatter.call(this, opt_prefix)
};
goog.inherits(goog.debug.TextFormatter, goog.debug.Formatter);
goog.debug.TextFormatter.prototype.formatRecord = function(logRecord) {
  var sb = [];
  sb.push(this.prefix_, " ");
  if(this.showAbsoluteTime) {
    sb.push("[", goog.debug.Formatter.getDateTimeStamp_(logRecord), "] ")
  }
  if(this.showRelativeTime) {
    sb.push("[", goog.debug.Formatter.getRelativeTime_(logRecord, this.startTimeProvider_.get()), "s] ")
  }
  if(this.showLoggerName) {
    sb.push("[", logRecord.getLoggerName(), "] ")
  }
  if(this.showSeverityLevel) {
    sb.push("[", logRecord.getLevel().name, "] ")
  }
  sb.push(logRecord.getMessage(), "\n");
  if(this.showExceptionText && logRecord.getException()) {
    sb.push(logRecord.getExceptionText(), "\n")
  }
  return sb.join("")
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
goog.provide("goog.events.EventHandler");
goog.require("goog.Disposable");
goog.require("goog.array");
goog.require("goog.events");
goog.require("goog.events.EventWrapper");
goog.events.EventHandler = function(opt_handler) {
  goog.Disposable.call(this);
  this.handler_ = opt_handler;
  this.keys_ = []
};
goog.inherits(goog.events.EventHandler, goog.Disposable);
goog.events.EventHandler.typeArray_ = [];
goog.events.EventHandler.prototype.listen = function(src, type, opt_fn, opt_capture, opt_handler) {
  if(!goog.isArray(type)) {
    goog.events.EventHandler.typeArray_[0] = type;
    type = goog.events.EventHandler.typeArray_
  }
  for(var i = 0;i < type.length;i++) {
    var key = goog.events.listen(src, type[i], opt_fn || this, opt_capture || false, opt_handler || this.handler_ || this);
    this.keys_.push(key)
  }
  return this
};
goog.events.EventHandler.prototype.listenOnce = function(src, type, opt_fn, opt_capture, opt_handler) {
  if(goog.isArray(type)) {
    for(var i = 0;i < type.length;i++) {
      this.listenOnce(src, type[i], opt_fn, opt_capture, opt_handler)
    }
  }else {
    var key = goog.events.listenOnce(src, type, opt_fn || this, opt_capture, opt_handler || this.handler_ || this);
    this.keys_.push(key)
  }
  return this
};
goog.events.EventHandler.prototype.listenWithWrapper = function(src, wrapper, listener, opt_capt, opt_handler) {
  wrapper.listen(src, listener, opt_capt, opt_handler || this.handler_, this);
  return this
};
goog.events.EventHandler.prototype.getListenerCount = function() {
  return this.keys_.length
};
goog.events.EventHandler.prototype.unlisten = function(src, type, opt_fn, opt_capture, opt_handler) {
  if(goog.isArray(type)) {
    for(var i = 0;i < type.length;i++) {
      this.unlisten(src, type[i], opt_fn, opt_capture, opt_handler)
    }
  }else {
    var listener = goog.events.getListener(src, type, opt_fn || this, opt_capture, opt_handler || this.handler_ || this);
    if(listener) {
      var key = listener.key;
      goog.events.unlistenByKey(key);
      goog.array.remove(this.keys_, key)
    }
  }
  return this
};
goog.events.EventHandler.prototype.unlistenWithWrapper = function(src, wrapper, listener, opt_capt, opt_handler) {
  wrapper.unlisten(src, listener, opt_capt, opt_handler || this.handler_, this);
  return this
};
goog.events.EventHandler.prototype.removeAll = function() {
  goog.array.forEach(this.keys_, goog.events.unlistenByKey);
  this.keys_.length = 0
};
goog.events.EventHandler.prototype.disposeInternal = function() {
  goog.events.EventHandler.superClass_.disposeInternal.call(this);
  this.removeAll()
};
goog.events.EventHandler.prototype.handleEvent = function(e) {
  throw Error("EventHandler.handleEvent not implemented");
};
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
goog.provide("goog.math.Box");
goog.require("goog.math.Coordinate");
goog.math.Box = function(top, right, bottom, left) {
  this.top = top;
  this.right = right;
  this.bottom = bottom;
  this.left = left
};
goog.math.Box.boundingBox = function(var_args) {
  var box = new goog.math.Box(arguments[0].y, arguments[0].x, arguments[0].y, arguments[0].x);
  for(var i = 1;i < arguments.length;i++) {
    var coord = arguments[i];
    box.top = Math.min(box.top, coord.y);
    box.right = Math.max(box.right, coord.x);
    box.bottom = Math.max(box.bottom, coord.y);
    box.left = Math.min(box.left, coord.x)
  }
  return box
};
goog.math.Box.prototype.clone = function() {
  return new goog.math.Box(this.top, this.right, this.bottom, this.left)
};
if(goog.DEBUG) {
  goog.math.Box.prototype.toString = function() {
    return"(" + this.top + "t, " + this.right + "r, " + this.bottom + "b, " + this.left + "l)"
  }
}
goog.math.Box.prototype.contains = function(other) {
  return goog.math.Box.contains(this, other)
};
goog.math.Box.prototype.expand = function(top, opt_right, opt_bottom, opt_left) {
  if(goog.isObject(top)) {
    this.top -= top.top;
    this.right += top.right;
    this.bottom += top.bottom;
    this.left -= top.left
  }else {
    this.top -= top;
    this.right += opt_right;
    this.bottom += opt_bottom;
    this.left -= opt_left
  }
  return this
};
goog.math.Box.prototype.expandToInclude = function(box) {
  this.left = Math.min(this.left, box.left);
  this.top = Math.min(this.top, box.top);
  this.right = Math.max(this.right, box.right);
  this.bottom = Math.max(this.bottom, box.bottom)
};
goog.math.Box.equals = function(a, b) {
  if(a == b) {
    return true
  }
  if(!a || !b) {
    return false
  }
  return a.top == b.top && a.right == b.right && a.bottom == b.bottom && a.left == b.left
};
goog.math.Box.contains = function(box, other) {
  if(!box || !other) {
    return false
  }
  if(other instanceof goog.math.Box) {
    return other.left >= box.left && other.right <= box.right && other.top >= box.top && other.bottom <= box.bottom
  }
  return other.x >= box.left && other.x <= box.right && other.y >= box.top && other.y <= box.bottom
};
goog.math.Box.distance = function(box, coord) {
  if(coord.x >= box.left && coord.x <= box.right) {
    if(coord.y >= box.top && coord.y <= box.bottom) {
      return 0
    }
    return coord.y < box.top ? box.top - coord.y : coord.y - box.bottom
  }
  if(coord.y >= box.top && coord.y <= box.bottom) {
    return coord.x < box.left ? box.left - coord.x : coord.x - box.right
  }
  return goog.math.Coordinate.distance(coord, new goog.math.Coordinate(coord.x < box.left ? box.left : box.right, coord.y < box.top ? box.top : box.bottom))
};
goog.math.Box.intersects = function(a, b) {
  return a.left <= b.right && b.left <= a.right && a.top <= b.bottom && b.top <= a.bottom
};
goog.math.Box.intersectsWithPadding = function(a, b, padding) {
  return a.left <= b.right + padding && b.left <= a.right + padding && a.top <= b.bottom + padding && b.top <= a.bottom + padding
};
goog.provide("goog.math.Rect");
goog.require("goog.math.Box");
goog.require("goog.math.Size");
goog.math.Rect = function(x, y, w, h) {
  this.left = x;
  this.top = y;
  this.width = w;
  this.height = h
};
goog.math.Rect.prototype.clone = function() {
  return new goog.math.Rect(this.left, this.top, this.width, this.height)
};
goog.math.Rect.prototype.toBox = function() {
  var right = this.left + this.width;
  var bottom = this.top + this.height;
  return new goog.math.Box(this.top, right, bottom, this.left)
};
goog.math.Rect.createFromBox = function(box) {
  return new goog.math.Rect(box.left, box.top, box.right - box.left, box.bottom - box.top)
};
if(goog.DEBUG) {
  goog.math.Rect.prototype.toString = function() {
    return"(" + this.left + ", " + this.top + " - " + this.width + "w x " + this.height + "h)"
  }
}
goog.math.Rect.equals = function(a, b) {
  if(a == b) {
    return true
  }
  if(!a || !b) {
    return false
  }
  return a.left == b.left && a.width == b.width && a.top == b.top && a.height == b.height
};
goog.math.Rect.prototype.intersection = function(rect) {
  var x0 = Math.max(this.left, rect.left);
  var x1 = Math.min(this.left + this.width, rect.left + rect.width);
  if(x0 <= x1) {
    var y0 = Math.max(this.top, rect.top);
    var y1 = Math.min(this.top + this.height, rect.top + rect.height);
    if(y0 <= y1) {
      this.left = x0;
      this.top = y0;
      this.width = x1 - x0;
      this.height = y1 - y0;
      return true
    }
  }
  return false
};
goog.math.Rect.intersection = function(a, b) {
  var x0 = Math.max(a.left, b.left);
  var x1 = Math.min(a.left + a.width, b.left + b.width);
  if(x0 <= x1) {
    var y0 = Math.max(a.top, b.top);
    var y1 = Math.min(a.top + a.height, b.top + b.height);
    if(y0 <= y1) {
      return new goog.math.Rect(x0, y0, x1 - x0, y1 - y0)
    }
  }
  return null
};
goog.math.Rect.intersects = function(a, b) {
  return a.left <= b.left + b.width && b.left <= a.left + a.width && a.top <= b.top + b.height && b.top <= a.top + a.height
};
goog.math.Rect.prototype.intersects = function(rect) {
  return goog.math.Rect.intersects(this, rect)
};
goog.math.Rect.difference = function(a, b) {
  var intersection = goog.math.Rect.intersection(a, b);
  if(!intersection || !intersection.height || !intersection.width) {
    return[a.clone()]
  }
  var result = [];
  var top = a.top;
  var height = a.height;
  var ar = a.left + a.width;
  var ab = a.top + a.height;
  var br = b.left + b.width;
  var bb = b.top + b.height;
  if(b.top > a.top) {
    result.push(new goog.math.Rect(a.left, a.top, a.width, b.top - a.top));
    top = b.top;
    height -= b.top - a.top
  }
  if(bb < ab) {
    result.push(new goog.math.Rect(a.left, bb, a.width, ab - bb));
    height = bb - top
  }
  if(b.left > a.left) {
    result.push(new goog.math.Rect(a.left, top, b.left - a.left, height))
  }
  if(br < ar) {
    result.push(new goog.math.Rect(br, top, ar - br, height))
  }
  return result
};
goog.math.Rect.prototype.difference = function(rect) {
  return goog.math.Rect.difference(this, rect)
};
goog.math.Rect.prototype.boundingRect = function(rect) {
  var right = Math.max(this.left + this.width, rect.left + rect.width);
  var bottom = Math.max(this.top + this.height, rect.top + rect.height);
  this.left = Math.min(this.left, rect.left);
  this.top = Math.min(this.top, rect.top);
  this.width = right - this.left;
  this.height = bottom - this.top
};
goog.math.Rect.boundingRect = function(a, b) {
  if(!a || !b) {
    return null
  }
  var clone = a.clone();
  clone.boundingRect(b);
  return clone
};
goog.math.Rect.prototype.contains = function(another) {
  if(another instanceof goog.math.Rect) {
    return this.left <= another.left && this.left + this.width >= another.left + another.width && this.top <= another.top && this.top + this.height >= another.top + another.height
  }else {
    return another.x >= this.left && another.x <= this.left + this.width && another.y >= this.top && another.y <= this.top + this.height
  }
};
goog.math.Rect.prototype.getSize = function() {
  return new goog.math.Size(this.width, this.height)
};
goog.provide("goog.style");
goog.require("goog.array");
goog.require("goog.dom");
goog.require("goog.math.Box");
goog.require("goog.math.Coordinate");
goog.require("goog.math.Rect");
goog.require("goog.math.Size");
goog.require("goog.object");
goog.require("goog.string");
goog.require("goog.userAgent");
goog.style.setStyle = function(element, style, opt_value) {
  if(goog.isString(style)) {
    goog.style.setStyle_(element, opt_value, style)
  }else {
    goog.object.forEach(style, goog.partial(goog.style.setStyle_, element))
  }
};
goog.style.setStyle_ = function(element, value, style) {
  element.style[goog.string.toCamelCase(style)] = value
};
goog.style.getStyle = function(element, property) {
  return element.style[goog.string.toCamelCase(property)] || ""
};
goog.style.getComputedStyle = function(element, property) {
  var doc = goog.dom.getOwnerDocument(element);
  if(doc.defaultView && doc.defaultView.getComputedStyle) {
    var styles = doc.defaultView.getComputedStyle(element, null);
    if(styles) {
      return styles[property] || styles.getPropertyValue(property)
    }
  }
  return""
};
goog.style.getCascadedStyle = function(element, style) {
  return element.currentStyle ? element.currentStyle[style] : null
};
goog.style.getStyle_ = function(element, style) {
  return goog.style.getComputedStyle(element, style) || goog.style.getCascadedStyle(element, style) || element.style[style]
};
goog.style.getComputedPosition = function(element) {
  return goog.style.getStyle_(element, "position")
};
goog.style.getBackgroundColor = function(element) {
  return goog.style.getStyle_(element, "backgroundColor")
};
goog.style.getComputedOverflowX = function(element) {
  return goog.style.getStyle_(element, "overflowX")
};
goog.style.getComputedOverflowY = function(element) {
  return goog.style.getStyle_(element, "overflowY")
};
goog.style.getComputedZIndex = function(element) {
  return goog.style.getStyle_(element, "zIndex")
};
goog.style.getComputedTextAlign = function(element) {
  return goog.style.getStyle_(element, "textAlign")
};
goog.style.getComputedCursor = function(element) {
  return goog.style.getStyle_(element, "cursor")
};
goog.style.setPosition = function(el, arg1, opt_arg2) {
  var x, y;
  var buggyGeckoSubPixelPos = goog.userAgent.GECKO && (goog.userAgent.MAC || goog.userAgent.X11) && goog.userAgent.isVersion("1.9");
  if(arg1 instanceof goog.math.Coordinate) {
    x = arg1.x;
    y = arg1.y
  }else {
    x = arg1;
    y = opt_arg2
  }
  el.style.left = goog.style.getPixelStyleValue_(x, buggyGeckoSubPixelPos);
  el.style.top = goog.style.getPixelStyleValue_(y, buggyGeckoSubPixelPos)
};
goog.style.getPosition = function(element) {
  return new goog.math.Coordinate(element.offsetLeft, element.offsetTop)
};
goog.style.getClientViewportElement = function(opt_node) {
  var doc;
  if(opt_node) {
    if(opt_node.nodeType == goog.dom.NodeType.DOCUMENT) {
      doc = opt_node
    }else {
      doc = goog.dom.getOwnerDocument(opt_node)
    }
  }else {
    doc = goog.dom.getDocument()
  }
  if(goog.userAgent.IE && !goog.userAgent.isDocumentMode(9) && !goog.dom.getDomHelper(doc).isCss1CompatMode()) {
    return doc.body
  }
  return doc.documentElement
};
goog.style.getBoundingClientRect_ = function(el) {
  var rect = el.getBoundingClientRect();
  if(goog.userAgent.IE) {
    var doc = el.ownerDocument;
    rect.left -= doc.documentElement.clientLeft + doc.body.clientLeft;
    rect.top -= doc.documentElement.clientTop + doc.body.clientTop
  }
  return rect
};
goog.style.getOffsetParent = function(element) {
  if(goog.userAgent.IE) {
    return element.offsetParent
  }
  var doc = goog.dom.getOwnerDocument(element);
  var positionStyle = goog.style.getStyle_(element, "position");
  var skipStatic = positionStyle == "fixed" || positionStyle == "absolute";
  for(var parent = element.parentNode;parent && parent != doc;parent = parent.parentNode) {
    positionStyle = goog.style.getStyle_(parent, "position");
    skipStatic = skipStatic && positionStyle == "static" && parent != doc.documentElement && parent != doc.body;
    if(!skipStatic && (parent.scrollWidth > parent.clientWidth || parent.scrollHeight > parent.clientHeight || positionStyle == "fixed" || positionStyle == "absolute" || positionStyle == "relative")) {
      return parent
    }
  }
  return null
};
goog.style.getVisibleRectForElement = function(element) {
  var visibleRect = new goog.math.Box(0, Infinity, Infinity, 0);
  var dom = goog.dom.getDomHelper(element);
  var body = dom.getDocument().body;
  var documentElement = dom.getDocument().documentElement;
  var scrollEl = dom.getDocumentScrollElement();
  for(var el = element;el = goog.style.getOffsetParent(el);) {
    if((!goog.userAgent.IE || el.clientWidth != 0) && (!goog.userAgent.WEBKIT || el.clientHeight != 0 || el != body) && el != body && el != documentElement && goog.style.getStyle_(el, "overflow") != "visible") {
      var pos = goog.style.getPageOffset(el);
      var client = goog.style.getClientLeftTop(el);
      pos.x += client.x;
      pos.y += client.y;
      visibleRect.top = Math.max(visibleRect.top, pos.y);
      visibleRect.right = Math.min(visibleRect.right, pos.x + el.clientWidth);
      visibleRect.bottom = Math.min(visibleRect.bottom, pos.y + el.clientHeight);
      visibleRect.left = Math.max(visibleRect.left, pos.x)
    }
  }
  var scrollX = scrollEl.scrollLeft, scrollY = scrollEl.scrollTop;
  visibleRect.left = Math.max(visibleRect.left, scrollX);
  visibleRect.top = Math.max(visibleRect.top, scrollY);
  var winSize = dom.getViewportSize();
  visibleRect.right = Math.min(visibleRect.right, scrollX + winSize.width);
  visibleRect.bottom = Math.min(visibleRect.bottom, scrollY + winSize.height);
  return visibleRect.top >= 0 && visibleRect.left >= 0 && visibleRect.bottom > visibleRect.top && visibleRect.right > visibleRect.left ? visibleRect : null
};
goog.style.scrollIntoContainerView = function(element, container, opt_center) {
  var elementPos = goog.style.getPageOffset(element);
  var containerPos = goog.style.getPageOffset(container);
  var containerBorder = goog.style.getBorderBox(container);
  var relX = elementPos.x - containerPos.x - containerBorder.left;
  var relY = elementPos.y - containerPos.y - containerBorder.top;
  var spaceX = container.clientWidth - element.offsetWidth;
  var spaceY = container.clientHeight - element.offsetHeight;
  if(opt_center) {
    container.scrollLeft += relX - spaceX / 2;
    container.scrollTop += relY - spaceY / 2
  }else {
    container.scrollLeft += Math.min(relX, Math.max(relX - spaceX, 0));
    container.scrollTop += Math.min(relY, Math.max(relY - spaceY, 0))
  }
};
goog.style.getClientLeftTop = function(el) {
  if(goog.userAgent.GECKO && !goog.userAgent.isVersion("1.9")) {
    var left = parseFloat(goog.style.getComputedStyle(el, "borderLeftWidth"));
    if(goog.style.isRightToLeft(el)) {
      var scrollbarWidth = el.offsetWidth - el.clientWidth - left - parseFloat(goog.style.getComputedStyle(el, "borderRightWidth"));
      left += scrollbarWidth
    }
    return new goog.math.Coordinate(left, parseFloat(goog.style.getComputedStyle(el, "borderTopWidth")))
  }
  return new goog.math.Coordinate(el.clientLeft, el.clientTop)
};
goog.style.getPageOffset = function(el) {
  var box, doc = goog.dom.getOwnerDocument(el);
  var positionStyle = goog.style.getStyle_(el, "position");
  var BUGGY_GECKO_BOX_OBJECT = goog.userAgent.GECKO && doc.getBoxObjectFor && !el.getBoundingClientRect && positionStyle == "absolute" && (box = doc.getBoxObjectFor(el)) && (box.screenX < 0 || box.screenY < 0);
  var pos = new goog.math.Coordinate(0, 0);
  var viewportElement = goog.style.getClientViewportElement(doc);
  if(el == viewportElement) {
    return pos
  }
  if(el.getBoundingClientRect) {
    box = goog.style.getBoundingClientRect_(el);
    var scrollCoord = goog.dom.getDomHelper(doc).getDocumentScroll();
    pos.x = box.left + scrollCoord.x;
    pos.y = box.top + scrollCoord.y
  }else {
    if(doc.getBoxObjectFor && !BUGGY_GECKO_BOX_OBJECT) {
      box = doc.getBoxObjectFor(el);
      var vpBox = doc.getBoxObjectFor(viewportElement);
      pos.x = box.screenX - vpBox.screenX;
      pos.y = box.screenY - vpBox.screenY
    }else {
      var parent = el;
      do {
        pos.x += parent.offsetLeft;
        pos.y += parent.offsetTop;
        if(parent != el) {
          pos.x += parent.clientLeft || 0;
          pos.y += parent.clientTop || 0
        }
        if(goog.userAgent.WEBKIT && goog.style.getComputedPosition(parent) == "fixed") {
          pos.x += doc.body.scrollLeft;
          pos.y += doc.body.scrollTop;
          break
        }
        parent = parent.offsetParent
      }while(parent && parent != el);
      if(goog.userAgent.OPERA || goog.userAgent.WEBKIT && positionStyle == "absolute") {
        pos.y -= doc.body.offsetTop
      }
      for(parent = el;(parent = goog.style.getOffsetParent(parent)) && parent != doc.body && parent != viewportElement;) {
        pos.x -= parent.scrollLeft;
        if(!goog.userAgent.OPERA || parent.tagName != "TR") {
          pos.y -= parent.scrollTop
        }
      }
    }
  }
  return pos
};
goog.style.getPageOffsetLeft = function(el) {
  return goog.style.getPageOffset(el).x
};
goog.style.getPageOffsetTop = function(el) {
  return goog.style.getPageOffset(el).y
};
goog.style.getFramedPageOffset = function(el, relativeWin) {
  var position = new goog.math.Coordinate(0, 0);
  var currentWin = goog.dom.getWindow(goog.dom.getOwnerDocument(el));
  var currentEl = el;
  do {
    var offset = currentWin == relativeWin ? goog.style.getPageOffset(currentEl) : goog.style.getClientPosition(currentEl);
    position.x += offset.x;
    position.y += offset.y
  }while(currentWin && currentWin != relativeWin && (currentEl = currentWin.frameElement) && (currentWin = currentWin.parent));
  return position
};
goog.style.translateRectForAnotherFrame = function(rect, origBase, newBase) {
  if(origBase.getDocument() != newBase.getDocument()) {
    var body = origBase.getDocument().body;
    var pos = goog.style.getFramedPageOffset(body, newBase.getWindow());
    pos = goog.math.Coordinate.difference(pos, goog.style.getPageOffset(body));
    if(goog.userAgent.IE && !origBase.isCss1CompatMode()) {
      pos = goog.math.Coordinate.difference(pos, origBase.getDocumentScroll())
    }
    rect.left += pos.x;
    rect.top += pos.y
  }
};
goog.style.getRelativePosition = function(a, b) {
  var ap = goog.style.getClientPosition(a);
  var bp = goog.style.getClientPosition(b);
  return new goog.math.Coordinate(ap.x - bp.x, ap.y - bp.y)
};
goog.style.getClientPosition = function(el) {
  var pos = new goog.math.Coordinate;
  if(el.nodeType == goog.dom.NodeType.ELEMENT) {
    if(el.getBoundingClientRect) {
      var box = goog.style.getBoundingClientRect_(el);
      pos.x = box.left;
      pos.y = box.top
    }else {
      var scrollCoord = goog.dom.getDomHelper(el).getDocumentScroll();
      var pageCoord = goog.style.getPageOffset(el);
      pos.x = pageCoord.x - scrollCoord.x;
      pos.y = pageCoord.y - scrollCoord.y
    }
  }else {
    var isAbstractedEvent = goog.isFunction(el.getBrowserEvent);
    var targetEvent = el;
    if(el.targetTouches) {
      targetEvent = el.targetTouches[0]
    }else {
      if(isAbstractedEvent && el.getBrowserEvent().targetTouches) {
        targetEvent = el.getBrowserEvent().targetTouches[0]
      }
    }
    pos.x = targetEvent.clientX;
    pos.y = targetEvent.clientY
  }
  return pos
};
goog.style.setPageOffset = function(el, x, opt_y) {
  var cur = goog.style.getPageOffset(el);
  if(x instanceof goog.math.Coordinate) {
    opt_y = x.y;
    x = x.x
  }
  var dx = x - cur.x;
  var dy = opt_y - cur.y;
  goog.style.setPosition(el, el.offsetLeft + dx, el.offsetTop + dy)
};
goog.style.setSize = function(element, w, opt_h) {
  var h;
  if(w instanceof goog.math.Size) {
    h = w.height;
    w = w.width
  }else {
    if(opt_h == undefined) {
      throw Error("missing height argument");
    }
    h = opt_h
  }
  goog.style.setWidth(element, w);
  goog.style.setHeight(element, h)
};
goog.style.getPixelStyleValue_ = function(value, round) {
  if(typeof value == "number") {
    value = (round ? Math.round(value) : value) + "px"
  }
  return value
};
goog.style.setHeight = function(element, height) {
  element.style.height = goog.style.getPixelStyleValue_(height, true)
};
goog.style.setWidth = function(element, width) {
  element.style.width = goog.style.getPixelStyleValue_(width, true)
};
goog.style.getSize = function(element) {
  if(goog.style.getStyle_(element, "display") != "none") {
    return goog.style.getSizeWithDisplay_(element)
  }
  var style = element.style;
  var originalDisplay = style.display;
  var originalVisibility = style.visibility;
  var originalPosition = style.position;
  style.visibility = "hidden";
  style.position = "absolute";
  style.display = "inline";
  var size = goog.style.getSizeWithDisplay_(element);
  style.display = originalDisplay;
  style.position = originalPosition;
  style.visibility = originalVisibility;
  return size
};
goog.style.getSizeWithDisplay_ = function(element) {
  var offsetWidth = element.offsetWidth;
  var offsetHeight = element.offsetHeight;
  var webkitOffsetsZero = goog.userAgent.WEBKIT && !offsetWidth && !offsetHeight;
  if((!goog.isDef(offsetWidth) || webkitOffsetsZero) && element.getBoundingClientRect) {
    var clientRect = goog.style.getBoundingClientRect_(element);
    return new goog.math.Size(clientRect.right - clientRect.left, clientRect.bottom - clientRect.top)
  }
  return new goog.math.Size(offsetWidth, offsetHeight)
};
goog.style.getBounds = function(element) {
  var o = goog.style.getPageOffset(element);
  var s = goog.style.getSize(element);
  return new goog.math.Rect(o.x, o.y, s.width, s.height)
};
goog.style.toCamelCase = function(selector) {
  return goog.string.toCamelCase(String(selector))
};
goog.style.toSelectorCase = function(selector) {
  return goog.string.toSelectorCase(selector)
};
goog.style.getOpacity = function(el) {
  var style = el.style;
  var result = "";
  if("opacity" in style) {
    result = style.opacity
  }else {
    if("MozOpacity" in style) {
      result = style.MozOpacity
    }else {
      if("filter" in style) {
        var match = style.filter.match(/alpha\(opacity=([\d.]+)\)/);
        if(match) {
          result = String(match[1] / 100)
        }
      }
    }
  }
  return result == "" ? result : Number(result)
};
goog.style.setOpacity = function(el, alpha) {
  var style = el.style;
  if("opacity" in style) {
    style.opacity = alpha
  }else {
    if("MozOpacity" in style) {
      style.MozOpacity = alpha
    }else {
      if("filter" in style) {
        if(alpha === "") {
          style.filter = ""
        }else {
          style.filter = "alpha(opacity=" + alpha * 100 + ")"
        }
      }
    }
  }
};
goog.style.setTransparentBackgroundImage = function(el, src) {
  var style = el.style;
  if(goog.userAgent.IE && !goog.userAgent.isVersion("8")) {
    style.filter = "progid:DXImageTransform.Microsoft.AlphaImageLoader(" + 'src="' + src + '", sizingMethod="crop")'
  }else {
    style.backgroundImage = "url(" + src + ")";
    style.backgroundPosition = "top left";
    style.backgroundRepeat = "no-repeat"
  }
};
goog.style.clearTransparentBackgroundImage = function(el) {
  var style = el.style;
  if("filter" in style) {
    style.filter = ""
  }else {
    style.backgroundImage = "none"
  }
};
goog.style.showElement = function(el, display) {
  el.style.display = display ? "" : "none"
};
goog.style.isElementShown = function(el) {
  return el.style.display != "none"
};
goog.style.installStyles = function(stylesString, opt_node) {
  var dh = goog.dom.getDomHelper(opt_node);
  var styleSheet = null;
  if(goog.userAgent.IE) {
    styleSheet = dh.getDocument().createStyleSheet();
    goog.style.setStyles(styleSheet, stylesString)
  }else {
    var head = dh.getElementsByTagNameAndClass("head")[0];
    if(!head) {
      var body = dh.getElementsByTagNameAndClass("body")[0];
      head = dh.createDom("head");
      body.parentNode.insertBefore(head, body)
    }
    styleSheet = dh.createDom("style");
    goog.style.setStyles(styleSheet, stylesString);
    dh.appendChild(head, styleSheet)
  }
  return styleSheet
};
goog.style.uninstallStyles = function(styleSheet) {
  var node = styleSheet.ownerNode || styleSheet.owningElement || styleSheet;
  goog.dom.removeNode(node)
};
goog.style.setStyles = function(element, stylesString) {
  if(goog.userAgent.IE) {
    element.cssText = stylesString
  }else {
    var propToSet = goog.userAgent.WEBKIT ? "innerText" : "innerHTML";
    element[propToSet] = stylesString
  }
};
goog.style.setPreWrap = function(el) {
  var style = el.style;
  if(goog.userAgent.IE && !goog.userAgent.isVersion("8")) {
    style.whiteSpace = "pre";
    style.wordWrap = "break-word"
  }else {
    if(goog.userAgent.GECKO) {
      style.whiteSpace = "-moz-pre-wrap"
    }else {
      style.whiteSpace = "pre-wrap"
    }
  }
};
goog.style.setInlineBlock = function(el) {
  var style = el.style;
  style.position = "relative";
  if(goog.userAgent.IE && !goog.userAgent.isVersion("8")) {
    style.zoom = "1";
    style.display = "inline"
  }else {
    if(goog.userAgent.GECKO) {
      style.display = goog.userAgent.isVersion("1.9a") ? "inline-block" : "-moz-inline-box"
    }else {
      style.display = "inline-block"
    }
  }
};
goog.style.isRightToLeft = function(el) {
  return"rtl" == goog.style.getStyle_(el, "direction")
};
goog.style.unselectableStyle_ = goog.userAgent.GECKO ? "MozUserSelect" : goog.userAgent.WEBKIT ? "WebkitUserSelect" : null;
goog.style.isUnselectable = function(el) {
  if(goog.style.unselectableStyle_) {
    return el.style[goog.style.unselectableStyle_].toLowerCase() == "none"
  }else {
    if(goog.userAgent.IE || goog.userAgent.OPERA) {
      return el.getAttribute("unselectable") == "on"
    }
  }
  return false
};
goog.style.setUnselectable = function(el, unselectable, opt_noRecurse) {
  var descendants = !opt_noRecurse ? el.getElementsByTagName("*") : null;
  var name = goog.style.unselectableStyle_;
  if(name) {
    var value = unselectable ? "none" : "";
    el.style[name] = value;
    if(descendants) {
      for(var i = 0, descendant;descendant = descendants[i];i++) {
        descendant.style[name] = value
      }
    }
  }else {
    if(goog.userAgent.IE || goog.userAgent.OPERA) {
      var value = unselectable ? "on" : "";
      el.setAttribute("unselectable", value);
      if(descendants) {
        for(var i = 0, descendant;descendant = descendants[i];i++) {
          descendant.setAttribute("unselectable", value)
        }
      }
    }
  }
};
goog.style.getBorderBoxSize = function(element) {
  return new goog.math.Size(element.offsetWidth, element.offsetHeight)
};
goog.style.setBorderBoxSize = function(element, size) {
  var doc = goog.dom.getOwnerDocument(element);
  var isCss1CompatMode = goog.dom.getDomHelper(doc).isCss1CompatMode();
  if(goog.userAgent.IE && (!isCss1CompatMode || !goog.userAgent.isVersion("8"))) {
    var style = element.style;
    if(isCss1CompatMode) {
      var paddingBox = goog.style.getPaddingBox(element);
      var borderBox = goog.style.getBorderBox(element);
      style.pixelWidth = size.width - borderBox.left - paddingBox.left - paddingBox.right - borderBox.right;
      style.pixelHeight = size.height - borderBox.top - paddingBox.top - paddingBox.bottom - borderBox.bottom
    }else {
      style.pixelWidth = size.width;
      style.pixelHeight = size.height
    }
  }else {
    goog.style.setBoxSizingSize_(element, size, "border-box")
  }
};
goog.style.getContentBoxSize = function(element) {
  var doc = goog.dom.getOwnerDocument(element);
  var ieCurrentStyle = goog.userAgent.IE && element.currentStyle;
  if(ieCurrentStyle && goog.dom.getDomHelper(doc).isCss1CompatMode() && ieCurrentStyle.width != "auto" && ieCurrentStyle.height != "auto" && !ieCurrentStyle.boxSizing) {
    var width = goog.style.getIePixelValue_(element, ieCurrentStyle.width, "width", "pixelWidth");
    var height = goog.style.getIePixelValue_(element, ieCurrentStyle.height, "height", "pixelHeight");
    return new goog.math.Size(width, height)
  }else {
    var borderBoxSize = goog.style.getBorderBoxSize(element);
    var paddingBox = goog.style.getPaddingBox(element);
    var borderBox = goog.style.getBorderBox(element);
    return new goog.math.Size(borderBoxSize.width - borderBox.left - paddingBox.left - paddingBox.right - borderBox.right, borderBoxSize.height - borderBox.top - paddingBox.top - paddingBox.bottom - borderBox.bottom)
  }
};
goog.style.setContentBoxSize = function(element, size) {
  var doc = goog.dom.getOwnerDocument(element);
  var isCss1CompatMode = goog.dom.getDomHelper(doc).isCss1CompatMode();
  if(goog.userAgent.IE && (!isCss1CompatMode || !goog.userAgent.isVersion("8"))) {
    var style = element.style;
    if(isCss1CompatMode) {
      style.pixelWidth = size.width;
      style.pixelHeight = size.height
    }else {
      var paddingBox = goog.style.getPaddingBox(element);
      var borderBox = goog.style.getBorderBox(element);
      style.pixelWidth = size.width + borderBox.left + paddingBox.left + paddingBox.right + borderBox.right;
      style.pixelHeight = size.height + borderBox.top + paddingBox.top + paddingBox.bottom + borderBox.bottom
    }
  }else {
    goog.style.setBoxSizingSize_(element, size, "content-box")
  }
};
goog.style.setBoxSizingSize_ = function(element, size, boxSizing) {
  var style = element.style;
  if(goog.userAgent.GECKO) {
    style.MozBoxSizing = boxSizing
  }else {
    if(goog.userAgent.WEBKIT) {
      style.WebkitBoxSizing = boxSizing
    }else {
      style.boxSizing = boxSizing
    }
  }
  style.width = size.width + "px";
  style.height = size.height + "px"
};
goog.style.getIePixelValue_ = function(element, value, name, pixelName) {
  if(/^\d+px?$/.test(value)) {
    return parseInt(value, 10)
  }else {
    var oldStyleValue = element.style[name];
    var oldRuntimeValue = element.runtimeStyle[name];
    element.runtimeStyle[name] = element.currentStyle[name];
    element.style[name] = value;
    var pixelValue = element.style[pixelName];
    element.style[name] = oldStyleValue;
    element.runtimeStyle[name] = oldRuntimeValue;
    return pixelValue
  }
};
goog.style.getIePixelDistance_ = function(element, propName) {
  return goog.style.getIePixelValue_(element, goog.style.getCascadedStyle(element, propName), "left", "pixelLeft")
};
goog.style.getBox_ = function(element, stylePrefix) {
  if(goog.userAgent.IE) {
    var left = goog.style.getIePixelDistance_(element, stylePrefix + "Left");
    var right = goog.style.getIePixelDistance_(element, stylePrefix + "Right");
    var top = goog.style.getIePixelDistance_(element, stylePrefix + "Top");
    var bottom = goog.style.getIePixelDistance_(element, stylePrefix + "Bottom");
    return new goog.math.Box(top, right, bottom, left)
  }else {
    var left = goog.style.getComputedStyle(element, stylePrefix + "Left");
    var right = goog.style.getComputedStyle(element, stylePrefix + "Right");
    var top = goog.style.getComputedStyle(element, stylePrefix + "Top");
    var bottom = goog.style.getComputedStyle(element, stylePrefix + "Bottom");
    return new goog.math.Box(parseFloat(top), parseFloat(right), parseFloat(bottom), parseFloat(left))
  }
};
goog.style.getPaddingBox = function(element) {
  return goog.style.getBox_(element, "padding")
};
goog.style.getMarginBox = function(element) {
  return goog.style.getBox_(element, "margin")
};
goog.style.ieBorderWidthKeywords_ = {"thin":2, "medium":4, "thick":6};
goog.style.getIePixelBorder_ = function(element, prop) {
  if(goog.style.getCascadedStyle(element, prop + "Style") == "none") {
    return 0
  }
  var width = goog.style.getCascadedStyle(element, prop + "Width");
  if(width in goog.style.ieBorderWidthKeywords_) {
    return goog.style.ieBorderWidthKeywords_[width]
  }
  return goog.style.getIePixelValue_(element, width, "left", "pixelLeft")
};
goog.style.getBorderBox = function(element) {
  if(goog.userAgent.IE) {
    var left = goog.style.getIePixelBorder_(element, "borderLeft");
    var right = goog.style.getIePixelBorder_(element, "borderRight");
    var top = goog.style.getIePixelBorder_(element, "borderTop");
    var bottom = goog.style.getIePixelBorder_(element, "borderBottom");
    return new goog.math.Box(top, right, bottom, left)
  }else {
    var left = goog.style.getComputedStyle(element, "borderLeftWidth");
    var right = goog.style.getComputedStyle(element, "borderRightWidth");
    var top = goog.style.getComputedStyle(element, "borderTopWidth");
    var bottom = goog.style.getComputedStyle(element, "borderBottomWidth");
    return new goog.math.Box(parseFloat(top), parseFloat(right), parseFloat(bottom), parseFloat(left))
  }
};
goog.style.getFontFamily = function(el) {
  var doc = goog.dom.getOwnerDocument(el);
  var font = "";
  if(doc.body.createTextRange) {
    var range = doc.body.createTextRange();
    range.moveToElementText(el);
    try {
      font = range.queryCommandValue("FontName")
    }catch(e) {
      font = ""
    }
  }
  if(!font) {
    font = goog.style.getStyle_(el, "fontFamily")
  }
  var fontsArray = font.split(",");
  if(fontsArray.length > 1) {
    font = fontsArray[0]
  }
  return goog.string.stripQuotes(font, "\"'")
};
goog.style.lengthUnitRegex_ = /[^\d]+$/;
goog.style.getLengthUnits = function(value) {
  var units = value.match(goog.style.lengthUnitRegex_);
  return units && units[0] || null
};
goog.style.ABSOLUTE_CSS_LENGTH_UNITS_ = {"cm":1, "in":1, "mm":1, "pc":1, "pt":1};
goog.style.CONVERTIBLE_RELATIVE_CSS_UNITS_ = {"em":1, "ex":1};
goog.style.getFontSize = function(el) {
  var fontSize = goog.style.getStyle_(el, "fontSize");
  var sizeUnits = goog.style.getLengthUnits(fontSize);
  if(fontSize && "px" == sizeUnits) {
    return parseInt(fontSize, 10)
  }
  if(goog.userAgent.IE) {
    if(sizeUnits in goog.style.ABSOLUTE_CSS_LENGTH_UNITS_) {
      return goog.style.getIePixelValue_(el, fontSize, "left", "pixelLeft")
    }else {
      if(el.parentNode && el.parentNode.nodeType == goog.dom.NodeType.ELEMENT && sizeUnits in goog.style.CONVERTIBLE_RELATIVE_CSS_UNITS_) {
        var parentElement = el.parentNode;
        var parentSize = goog.style.getStyle_(parentElement, "fontSize");
        return goog.style.getIePixelValue_(parentElement, fontSize == parentSize ? "1em" : fontSize, "left", "pixelLeft")
      }
    }
  }
  var sizeElement = goog.dom.createDom("span", {"style":"visibility:hidden;position:absolute;" + "line-height:0;padding:0;margin:0;border:0;height:1em;"});
  goog.dom.appendChild(el, sizeElement);
  fontSize = sizeElement.offsetHeight;
  goog.dom.removeNode(sizeElement);
  return fontSize
};
goog.style.parseStyleAttribute = function(value) {
  var result = {};
  goog.array.forEach(value.split(/\s*;\s*/), function(pair) {
    var keyValue = pair.split(/\s*:\s*/);
    if(keyValue.length == 2) {
      result[goog.string.toCamelCase(keyValue[0].toLowerCase())] = keyValue[1]
    }
  });
  return result
};
goog.style.toStyleAttribute = function(obj) {
  var buffer = [];
  goog.object.forEach(obj, function(value, key) {
    buffer.push(goog.string.toSelectorCase(key), ":", value, ";")
  });
  return buffer.join("")
};
goog.style.setFloat = function(el, value) {
  el.style[goog.userAgent.IE ? "styleFloat" : "cssFloat"] = value
};
goog.style.getFloat = function(el) {
  return el.style[goog.userAgent.IE ? "styleFloat" : "cssFloat"] || ""
};
goog.style.getScrollbarWidth = function(opt_className) {
  var outerDiv = goog.dom.createElement("div");
  if(opt_className) {
    outerDiv.className = opt_className
  }
  outerDiv.style.cssText = "visiblity:hidden;overflow:auto;" + "position:absolute;top:0;width:100px;height:100px";
  var innerDiv = goog.dom.createElement("div");
  goog.style.setSize(innerDiv, "200px", "200px");
  outerDiv.appendChild(innerDiv);
  goog.dom.appendChild(goog.dom.getDocument().body, outerDiv);
  var width = outerDiv.offsetWidth - outerDiv.clientWidth;
  goog.dom.removeNode(outerDiv);
  return width
};
goog.provide("goog.ui.IdGenerator");
goog.ui.IdGenerator = function() {
};
goog.addSingletonGetter(goog.ui.IdGenerator);
goog.ui.IdGenerator.prototype.nextId_ = 0;
goog.ui.IdGenerator.prototype.getNextUniqueId = function() {
  return":" + (this.nextId_++).toString(36)
};
goog.ui.IdGenerator.instance = goog.ui.IdGenerator.getInstance();
goog.provide("goog.ui.Component");
goog.provide("goog.ui.Component.Error");
goog.provide("goog.ui.Component.EventType");
goog.provide("goog.ui.Component.State");
goog.require("goog.array");
goog.require("goog.array.ArrayLike");
goog.require("goog.dom");
goog.require("goog.events.EventHandler");
goog.require("goog.events.EventTarget");
goog.require("goog.object");
goog.require("goog.style");
goog.require("goog.ui.IdGenerator");
goog.ui.Component = function(opt_domHelper) {
  goog.events.EventTarget.call(this);
  this.dom_ = opt_domHelper || goog.dom.getDomHelper();
  this.rightToLeft_ = goog.ui.Component.defaultRightToLeft_
};
goog.inherits(goog.ui.Component, goog.events.EventTarget);
goog.ui.Component.prototype.idGenerator_ = goog.ui.IdGenerator.getInstance();
goog.ui.Component.defaultRightToLeft_ = null;
goog.ui.Component.EventType = {BEFORE_SHOW:"beforeshow", SHOW:"show", HIDE:"hide", DISABLE:"disable", ENABLE:"enable", HIGHLIGHT:"highlight", UNHIGHLIGHT:"unhighlight", ACTIVATE:"activate", DEACTIVATE:"deactivate", SELECT:"select", UNSELECT:"unselect", CHECK:"check", UNCHECK:"uncheck", FOCUS:"focus", BLUR:"blur", OPEN:"open", CLOSE:"close", ENTER:"enter", LEAVE:"leave", ACTION:"action", CHANGE:"change"};
goog.ui.Component.Error = {NOT_SUPPORTED:"Method not supported", DECORATE_INVALID:"Invalid element to decorate", ALREADY_RENDERED:"Component already rendered", PARENT_UNABLE_TO_BE_SET:"Unable to set parent component", CHILD_INDEX_OUT_OF_BOUNDS:"Child component index out of bounds", NOT_OUR_CHILD:"Child is not in parent component", NOT_IN_DOCUMENT:"Operation not supported while component is not in document", STATE_INVALID:"Invalid component state"};
goog.ui.Component.State = {ALL:255, DISABLED:1, HOVER:2, ACTIVE:4, SELECTED:8, CHECKED:16, FOCUSED:32, OPENED:64};
goog.ui.Component.getStateTransitionEvent = function(state, isEntering) {
  switch(state) {
    case goog.ui.Component.State.DISABLED:
      return isEntering ? goog.ui.Component.EventType.DISABLE : goog.ui.Component.EventType.ENABLE;
    case goog.ui.Component.State.HOVER:
      return isEntering ? goog.ui.Component.EventType.HIGHLIGHT : goog.ui.Component.EventType.UNHIGHLIGHT;
    case goog.ui.Component.State.ACTIVE:
      return isEntering ? goog.ui.Component.EventType.ACTIVATE : goog.ui.Component.EventType.DEACTIVATE;
    case goog.ui.Component.State.SELECTED:
      return isEntering ? goog.ui.Component.EventType.SELECT : goog.ui.Component.EventType.UNSELECT;
    case goog.ui.Component.State.CHECKED:
      return isEntering ? goog.ui.Component.EventType.CHECK : goog.ui.Component.EventType.UNCHECK;
    case goog.ui.Component.State.FOCUSED:
      return isEntering ? goog.ui.Component.EventType.FOCUS : goog.ui.Component.EventType.BLUR;
    case goog.ui.Component.State.OPENED:
      return isEntering ? goog.ui.Component.EventType.OPEN : goog.ui.Component.EventType.CLOSE;
    default:
  }
  throw Error(goog.ui.Component.Error.STATE_INVALID);
};
goog.ui.Component.setDefaultRightToLeft = function(rightToLeft) {
  goog.ui.Component.defaultRightToLeft_ = rightToLeft
};
goog.ui.Component.prototype.id_ = null;
goog.ui.Component.prototype.dom_;
goog.ui.Component.prototype.inDocument_ = false;
goog.ui.Component.prototype.element_ = null;
goog.ui.Component.prototype.googUiComponentHandler_;
goog.ui.Component.prototype.rightToLeft_ = null;
goog.ui.Component.prototype.model_ = null;
goog.ui.Component.prototype.parent_ = null;
goog.ui.Component.prototype.children_ = null;
goog.ui.Component.prototype.childIndex_ = null;
goog.ui.Component.prototype.wasDecorated_ = false;
goog.ui.Component.prototype.getId = function() {
  return this.id_ || (this.id_ = this.idGenerator_.getNextUniqueId())
};
goog.ui.Component.prototype.setId = function(id) {
  if(this.parent_ && this.parent_.childIndex_) {
    goog.object.remove(this.parent_.childIndex_, this.id_);
    goog.object.add(this.parent_.childIndex_, id, this)
  }
  this.id_ = id
};
goog.ui.Component.prototype.getElement = function() {
  return this.element_
};
goog.ui.Component.prototype.setElementInternal = function(element) {
  this.element_ = element
};
goog.ui.Component.prototype.getElementsByClass = function(className) {
  return this.element_ ? this.dom_.getElementsByClass(className, this.element_) : []
};
goog.ui.Component.prototype.getElementByClass = function(className) {
  return this.element_ ? this.dom_.getElementByClass(className, this.element_) : null
};
goog.ui.Component.prototype.getHandler = function() {
  return this.googUiComponentHandler_ || (this.googUiComponentHandler_ = new goog.events.EventHandler(this))
};
goog.ui.Component.prototype.setParent = function(parent) {
  if(this == parent) {
    throw Error(goog.ui.Component.Error.PARENT_UNABLE_TO_BE_SET);
  }
  if(parent && this.parent_ && this.id_ && this.parent_.getChild(this.id_) && this.parent_ != parent) {
    throw Error(goog.ui.Component.Error.PARENT_UNABLE_TO_BE_SET);
  }
  this.parent_ = parent;
  goog.ui.Component.superClass_.setParentEventTarget.call(this, parent)
};
goog.ui.Component.prototype.getParent = function() {
  return this.parent_
};
goog.ui.Component.prototype.setParentEventTarget = function(parent) {
  if(this.parent_ && this.parent_ != parent) {
    throw Error(goog.ui.Component.Error.NOT_SUPPORTED);
  }
  goog.ui.Component.superClass_.setParentEventTarget.call(this, parent)
};
goog.ui.Component.prototype.getDomHelper = function() {
  return this.dom_
};
goog.ui.Component.prototype.isInDocument = function() {
  return this.inDocument_
};
goog.ui.Component.prototype.createDom = function() {
  this.element_ = this.dom_.createElement("div")
};
goog.ui.Component.prototype.render = function(opt_parentElement) {
  this.render_(opt_parentElement)
};
goog.ui.Component.prototype.renderBefore = function(sibling) {
  this.render_(sibling.parentNode, sibling)
};
goog.ui.Component.prototype.render_ = function(opt_parentElement, opt_beforeNode) {
  if(this.inDocument_) {
    throw Error(goog.ui.Component.Error.ALREADY_RENDERED);
  }
  if(!this.element_) {
    this.createDom()
  }
  if(opt_parentElement) {
    opt_parentElement.insertBefore(this.element_, opt_beforeNode || null)
  }else {
    this.dom_.getDocument().body.appendChild(this.element_)
  }
  if(!this.parent_ || this.parent_.isInDocument()) {
    this.enterDocument()
  }
};
goog.ui.Component.prototype.decorate = function(element) {
  if(this.inDocument_) {
    throw Error(goog.ui.Component.Error.ALREADY_RENDERED);
  }else {
    if(element && this.canDecorate(element)) {
      this.wasDecorated_ = true;
      if(!this.dom_ || this.dom_.getDocument() != goog.dom.getOwnerDocument(element)) {
        this.dom_ = goog.dom.getDomHelper(element)
      }
      this.decorateInternal(element);
      this.enterDocument()
    }else {
      throw Error(goog.ui.Component.Error.DECORATE_INVALID);
    }
  }
};
goog.ui.Component.prototype.canDecorate = function(element) {
  return true
};
goog.ui.Component.prototype.wasDecorated = function() {
  return this.wasDecorated_
};
goog.ui.Component.prototype.decorateInternal = function(element) {
  this.element_ = element
};
goog.ui.Component.prototype.enterDocument = function() {
  this.inDocument_ = true;
  this.forEachChild(function(child) {
    if(!child.isInDocument() && child.getElement()) {
      child.enterDocument()
    }
  })
};
goog.ui.Component.prototype.exitDocument = function() {
  this.forEachChild(function(child) {
    if(child.isInDocument()) {
      child.exitDocument()
    }
  });
  if(this.googUiComponentHandler_) {
    this.googUiComponentHandler_.removeAll()
  }
  this.inDocument_ = false
};
goog.ui.Component.prototype.disposeInternal = function() {
  goog.ui.Component.superClass_.disposeInternal.call(this);
  if(this.inDocument_) {
    this.exitDocument()
  }
  if(this.googUiComponentHandler_) {
    this.googUiComponentHandler_.dispose();
    delete this.googUiComponentHandler_
  }
  this.forEachChild(function(child) {
    child.dispose()
  });
  if(!this.wasDecorated_ && this.element_) {
    goog.dom.removeNode(this.element_)
  }
  this.children_ = null;
  this.childIndex_ = null;
  this.element_ = null;
  this.model_ = null;
  this.parent_ = null
};
goog.ui.Component.prototype.makeId = function(idFragment) {
  return this.getId() + "." + idFragment
};
goog.ui.Component.prototype.makeIds = function(object) {
  var ids = {};
  for(var key in object) {
    ids[key] = this.makeId(object[key])
  }
  return ids
};
goog.ui.Component.prototype.getModel = function() {
  return this.model_
};
goog.ui.Component.prototype.setModel = function(obj) {
  this.model_ = obj
};
goog.ui.Component.prototype.getFragmentFromId = function(id) {
  return id.substring(this.getId().length + 1)
};
goog.ui.Component.prototype.getElementByFragment = function(idFragment) {
  if(!this.inDocument_) {
    throw Error(goog.ui.Component.Error.NOT_IN_DOCUMENT);
  }
  return this.dom_.getElement(this.makeId(idFragment))
};
goog.ui.Component.prototype.addChild = function(child, opt_render) {
  this.addChildAt(child, this.getChildCount(), opt_render)
};
goog.ui.Component.prototype.addChildAt = function(child, index, opt_render) {
  if(child.inDocument_ && (opt_render || !this.inDocument_)) {
    throw Error(goog.ui.Component.Error.ALREADY_RENDERED);
  }
  if(index < 0 || index > this.getChildCount()) {
    throw Error(goog.ui.Component.Error.CHILD_INDEX_OUT_OF_BOUNDS);
  }
  if(!this.childIndex_ || !this.children_) {
    this.childIndex_ = {};
    this.children_ = []
  }
  if(child.getParent() == this) {
    goog.object.set(this.childIndex_, child.getId(), child);
    goog.array.remove(this.children_, child)
  }else {
    goog.object.add(this.childIndex_, child.getId(), child)
  }
  child.setParent(this);
  goog.array.insertAt(this.children_, child, index);
  if(child.inDocument_ && this.inDocument_ && child.getParent() == this) {
    var contentElement = this.getContentElement();
    contentElement.insertBefore(child.getElement(), contentElement.childNodes[index] || null)
  }else {
    if(opt_render) {
      if(!this.element_) {
        this.createDom()
      }
      var sibling = this.getChildAt(index + 1);
      child.render_(this.getContentElement(), sibling ? sibling.element_ : null)
    }else {
      if(this.inDocument_ && !child.inDocument_ && child.element_) {
        child.enterDocument()
      }
    }
  }
};
goog.ui.Component.prototype.getContentElement = function() {
  return this.element_
};
goog.ui.Component.prototype.isRightToLeft = function() {
  if(this.rightToLeft_ == null) {
    this.rightToLeft_ = goog.style.isRightToLeft(this.inDocument_ ? this.element_ : this.dom_.getDocument().body)
  }
  return this.rightToLeft_
};
goog.ui.Component.prototype.setRightToLeft = function(rightToLeft) {
  if(this.inDocument_) {
    throw Error(goog.ui.Component.Error.ALREADY_RENDERED);
  }
  this.rightToLeft_ = rightToLeft
};
goog.ui.Component.prototype.hasChildren = function() {
  return!!this.children_ && this.children_.length != 0
};
goog.ui.Component.prototype.getChildCount = function() {
  return this.children_ ? this.children_.length : 0
};
goog.ui.Component.prototype.getChildIds = function() {
  var ids = [];
  this.forEachChild(function(child) {
    ids.push(child.getId())
  });
  return ids
};
goog.ui.Component.prototype.getChild = function(id) {
  return this.childIndex_ && id ? goog.object.get(this.childIndex_, id) || null : null
};
goog.ui.Component.prototype.getChildAt = function(index) {
  return this.children_ ? this.children_[index] || null : null
};
goog.ui.Component.prototype.forEachChild = function(f, opt_obj) {
  if(this.children_) {
    goog.array.forEach(this.children_, f, opt_obj)
  }
};
goog.ui.Component.prototype.indexOfChild = function(child) {
  return this.children_ && child ? goog.array.indexOf(this.children_, child) : -1
};
goog.ui.Component.prototype.removeChild = function(child, opt_unrender) {
  if(child) {
    var id = goog.isString(child) ? child : child.getId();
    child = this.getChild(id);
    if(id && child) {
      goog.object.remove(this.childIndex_, id);
      goog.array.remove(this.children_, child);
      if(opt_unrender) {
        child.exitDocument();
        if(child.element_) {
          goog.dom.removeNode(child.element_)
        }
      }
      child.setParent(null)
    }
  }
  if(!child) {
    throw Error(goog.ui.Component.Error.NOT_OUR_CHILD);
  }
  return child
};
goog.ui.Component.prototype.removeChildAt = function(index, opt_unrender) {
  return this.removeChild(this.getChildAt(index), opt_unrender)
};
goog.ui.Component.prototype.removeChildren = function(opt_unrender) {
  while(this.hasChildren()) {
    this.removeChildAt(0, opt_unrender)
  }
};
goog.provide("goog.ui.FormPost");
goog.require("goog.array");
goog.require("goog.dom.TagName");
goog.require("goog.string");
goog.require("goog.string.StringBuffer");
goog.require("goog.ui.Component");
goog.ui.FormPost = function(opt_dom) {
  goog.ui.Component.call(this, opt_dom)
};
goog.inherits(goog.ui.FormPost, goog.ui.Component);
goog.ui.FormPost.prototype.createDom = function() {
  this.setElementInternal(this.getDomHelper().createDom(goog.dom.TagName.FORM, {"method":"POST", "style":"display:none"}))
};
goog.ui.FormPost.prototype.post = function(parameters, opt_url, opt_target) {
  var form = this.getElement();
  if(!form) {
    this.render();
    form = this.getElement()
  }
  form.action = opt_url || "";
  form.target = opt_target || "";
  this.setParameters_(form, parameters);
  form.submit()
};
goog.ui.FormPost.prototype.setParameters_ = function(form, parameters) {
  var name, value, sb = new goog.string.StringBuffer;
  for(name in parameters) {
    value = parameters[name];
    if(goog.isArrayLike(value)) {
      goog.array.forEach(value, goog.bind(this.appendInput_, this, sb, name))
    }else {
      this.appendInput_(sb, name, value)
    }
  }
  form.innerHTML = sb.toString()
};
goog.ui.FormPost.prototype.appendInput_ = function(out, name, value) {
  out.append('<input type="hidden" name="', goog.string.htmlEscape(name), '" value="', goog.string.htmlEscape(value), '">')
};
goog.provide("onedit.file");
goog.require("cljs.core");
goog.require("onedit.core");
goog.require("goog.object");
goog.require("goog.string");
goog.require("goog.dom");
goog.require("goog.events");
goog.require("goog.ui.FormPost");
onedit.file.file_form = function() {
  var submit__4434 = goog.dom.createDom.call(null, "input", goog.object.create.call(null, "type", "submit"));
  var file__4437 = function() {
    var G__4435__4436 = goog.dom.createDom.call(null, "input", goog.object.create.call(null, "type", "file", "name", "file"));
    goog.events.listen.call(null, G__4435__4436, goog.events.EventType.CHANGE, function() {
      return submit__4434.click()
    });
    return G__4435__4436
  }();
  goog.dom.createDom.call(null, "form", goog.object.create.call(null, "method", "POST", "action", "/open", "enctype", "multipart/form-data"), file__4437, submit__4434);
  return file__4437
}();
onedit.file.open = function open() {
  return onedit.file.file_form.click()
};
onedit.file.form_post = new goog.ui.FormPost;
onedit.file.save = function save(buffer) {
  var text__4438 = goog.dom.getRawTextContent.call(null, buffer);
  if(cljs.core.empty_QMARK_.call(null, text__4438)) {
    return null
  }else {
    return onedit.file.form_post.post(goog.object.create.call(null, "content", text__4438), [cljs.core.str("/save/"), cljs.core.str(document["title"])].join(""))
  }
};
goog.provide("goog.events.KeyCodes");
goog.require("goog.userAgent");
goog.events.KeyCodes = {MAC_ENTER:3, BACKSPACE:8, TAB:9, NUM_CENTER:12, ENTER:13, SHIFT:16, CTRL:17, ALT:18, PAUSE:19, CAPS_LOCK:20, ESC:27, SPACE:32, PAGE_UP:33, PAGE_DOWN:34, END:35, HOME:36, LEFT:37, UP:38, RIGHT:39, DOWN:40, PRINT_SCREEN:44, INSERT:45, DELETE:46, ZERO:48, ONE:49, TWO:50, THREE:51, FOUR:52, FIVE:53, SIX:54, SEVEN:55, EIGHT:56, NINE:57, FF_SEMICOLON:59, QUESTION_MARK:63, A:65, B:66, C:67, D:68, E:69, F:70, G:71, H:72, I:73, J:74, K:75, L:76, M:77, N:78, O:79, P:80, Q:81, R:82, 
S:83, T:84, U:85, V:86, W:87, X:88, Y:89, Z:90, META:91, WIN_KEY_RIGHT:92, CONTEXT_MENU:93, NUM_ZERO:96, NUM_ONE:97, NUM_TWO:98, NUM_THREE:99, NUM_FOUR:100, NUM_FIVE:101, NUM_SIX:102, NUM_SEVEN:103, NUM_EIGHT:104, NUM_NINE:105, NUM_MULTIPLY:106, NUM_PLUS:107, NUM_MINUS:109, NUM_PERIOD:110, NUM_DIVISION:111, F1:112, F2:113, F3:114, F4:115, F5:116, F6:117, F7:118, F8:119, F9:120, F10:121, F11:122, F12:123, NUMLOCK:144, SCROLL_LOCK:145, FIRST_MEDIA_KEY:166, LAST_MEDIA_KEY:183, SEMICOLON:186, DASH:189, 
EQUALS:187, COMMA:188, PERIOD:190, SLASH:191, APOSTROPHE:192, TILDE:192, SINGLE_QUOTE:222, OPEN_SQUARE_BRACKET:219, BACKSLASH:220, CLOSE_SQUARE_BRACKET:221, WIN_KEY:224, MAC_FF_META:224, WIN_IME:229, PHANTOM:255};
goog.events.KeyCodes.isTextModifyingKeyEvent = function(e) {
  if(e.altKey && !e.ctrlKey || e.metaKey || e.keyCode >= goog.events.KeyCodes.F1 && e.keyCode <= goog.events.KeyCodes.F12) {
    return false
  }
  switch(e.keyCode) {
    case goog.events.KeyCodes.ALT:
    ;
    case goog.events.KeyCodes.CAPS_LOCK:
    ;
    case goog.events.KeyCodes.CONTEXT_MENU:
    ;
    case goog.events.KeyCodes.CTRL:
    ;
    case goog.events.KeyCodes.DOWN:
    ;
    case goog.events.KeyCodes.END:
    ;
    case goog.events.KeyCodes.ESC:
    ;
    case goog.events.KeyCodes.HOME:
    ;
    case goog.events.KeyCodes.INSERT:
    ;
    case goog.events.KeyCodes.LEFT:
    ;
    case goog.events.KeyCodes.MAC_FF_META:
    ;
    case goog.events.KeyCodes.META:
    ;
    case goog.events.KeyCodes.NUMLOCK:
    ;
    case goog.events.KeyCodes.NUM_CENTER:
    ;
    case goog.events.KeyCodes.PAGE_DOWN:
    ;
    case goog.events.KeyCodes.PAGE_UP:
    ;
    case goog.events.KeyCodes.PAUSE:
    ;
    case goog.events.KeyCodes.PHANTOM:
    ;
    case goog.events.KeyCodes.PRINT_SCREEN:
    ;
    case goog.events.KeyCodes.RIGHT:
    ;
    case goog.events.KeyCodes.SCROLL_LOCK:
    ;
    case goog.events.KeyCodes.SHIFT:
    ;
    case goog.events.KeyCodes.UP:
    ;
    case goog.events.KeyCodes.WIN_KEY:
    ;
    case goog.events.KeyCodes.WIN_KEY_RIGHT:
      return false;
    default:
      return e.keyCode < goog.events.KeyCodes.FIRST_MEDIA_KEY || e.keyCode > goog.events.KeyCodes.LAST_MEDIA_KEY
  }
};
goog.events.KeyCodes.firesKeyPressEvent = function(keyCode, opt_heldKeyCode, opt_shiftKey, opt_ctrlKey, opt_altKey) {
  if(!goog.userAgent.IE && !(goog.userAgent.WEBKIT && goog.userAgent.isVersion("525"))) {
    return true
  }
  if(goog.userAgent.MAC && opt_altKey) {
    return goog.events.KeyCodes.isCharacterKey(keyCode)
  }
  if(opt_altKey && !opt_ctrlKey) {
    return false
  }
  if(!opt_shiftKey && (opt_heldKeyCode == goog.events.KeyCodes.CTRL || opt_heldKeyCode == goog.events.KeyCodes.ALT)) {
    return false
  }
  if(goog.userAgent.IE && opt_ctrlKey && opt_heldKeyCode == keyCode) {
    return false
  }
  switch(keyCode) {
    case goog.events.KeyCodes.ENTER:
      return!(goog.userAgent.IE && goog.userAgent.isDocumentMode(9));
    case goog.events.KeyCodes.ESC:
      return!goog.userAgent.WEBKIT
  }
  return goog.events.KeyCodes.isCharacterKey(keyCode)
};
goog.events.KeyCodes.isCharacterKey = function(keyCode) {
  if(keyCode >= goog.events.KeyCodes.ZERO && keyCode <= goog.events.KeyCodes.NINE) {
    return true
  }
  if(keyCode >= goog.events.KeyCodes.NUM_ZERO && keyCode <= goog.events.KeyCodes.NUM_MULTIPLY) {
    return true
  }
  if(keyCode >= goog.events.KeyCodes.A && keyCode <= goog.events.KeyCodes.Z) {
    return true
  }
  if(goog.userAgent.WEBKIT && keyCode == 0) {
    return true
  }
  switch(keyCode) {
    case goog.events.KeyCodes.SPACE:
    ;
    case goog.events.KeyCodes.QUESTION_MARK:
    ;
    case goog.events.KeyCodes.NUM_PLUS:
    ;
    case goog.events.KeyCodes.NUM_MINUS:
    ;
    case goog.events.KeyCodes.NUM_PERIOD:
    ;
    case goog.events.KeyCodes.NUM_DIVISION:
    ;
    case goog.events.KeyCodes.SEMICOLON:
    ;
    case goog.events.KeyCodes.FF_SEMICOLON:
    ;
    case goog.events.KeyCodes.DASH:
    ;
    case goog.events.KeyCodes.EQUALS:
    ;
    case goog.events.KeyCodes.COMMA:
    ;
    case goog.events.KeyCodes.PERIOD:
    ;
    case goog.events.KeyCodes.SLASH:
    ;
    case goog.events.KeyCodes.APOSTROPHE:
    ;
    case goog.events.KeyCodes.SINGLE_QUOTE:
    ;
    case goog.events.KeyCodes.OPEN_SQUARE_BRACKET:
    ;
    case goog.events.KeyCodes.BACKSLASH:
    ;
    case goog.events.KeyCodes.CLOSE_SQUARE_BRACKET:
      return true;
    default:
      return false
  }
};
goog.provide("goog.events.KeyEvent");
goog.provide("goog.events.KeyHandler");
goog.provide("goog.events.KeyHandler.EventType");
goog.require("goog.events");
goog.require("goog.events.BrowserEvent");
goog.require("goog.events.EventTarget");
goog.require("goog.events.EventType");
goog.require("goog.events.KeyCodes");
goog.require("goog.userAgent");
goog.events.KeyHandler = function(opt_element, opt_capture) {
  goog.events.EventTarget.call(this);
  if(opt_element) {
    this.attach(opt_element, opt_capture)
  }
};
goog.inherits(goog.events.KeyHandler, goog.events.EventTarget);
goog.events.KeyHandler.prototype.element_ = null;
goog.events.KeyHandler.prototype.keyPressKey_ = null;
goog.events.KeyHandler.prototype.keyDownKey_ = null;
goog.events.KeyHandler.prototype.keyUpKey_ = null;
goog.events.KeyHandler.prototype.lastKey_ = -1;
goog.events.KeyHandler.prototype.keyCode_ = -1;
goog.events.KeyHandler.EventType = {KEY:"key"};
goog.events.KeyHandler.safariKey_ = {3:goog.events.KeyCodes.ENTER, 12:goog.events.KeyCodes.NUMLOCK, 63232:goog.events.KeyCodes.UP, 63233:goog.events.KeyCodes.DOWN, 63234:goog.events.KeyCodes.LEFT, 63235:goog.events.KeyCodes.RIGHT, 63236:goog.events.KeyCodes.F1, 63237:goog.events.KeyCodes.F2, 63238:goog.events.KeyCodes.F3, 63239:goog.events.KeyCodes.F4, 63240:goog.events.KeyCodes.F5, 63241:goog.events.KeyCodes.F6, 63242:goog.events.KeyCodes.F7, 63243:goog.events.KeyCodes.F8, 63244:goog.events.KeyCodes.F9, 
63245:goog.events.KeyCodes.F10, 63246:goog.events.KeyCodes.F11, 63247:goog.events.KeyCodes.F12, 63248:goog.events.KeyCodes.PRINT_SCREEN, 63272:goog.events.KeyCodes.DELETE, 63273:goog.events.KeyCodes.HOME, 63275:goog.events.KeyCodes.END, 63276:goog.events.KeyCodes.PAGE_UP, 63277:goog.events.KeyCodes.PAGE_DOWN, 63289:goog.events.KeyCodes.NUMLOCK, 63302:goog.events.KeyCodes.INSERT};
goog.events.KeyHandler.keyIdentifier_ = {"Up":goog.events.KeyCodes.UP, "Down":goog.events.KeyCodes.DOWN, "Left":goog.events.KeyCodes.LEFT, "Right":goog.events.KeyCodes.RIGHT, "Enter":goog.events.KeyCodes.ENTER, "F1":goog.events.KeyCodes.F1, "F2":goog.events.KeyCodes.F2, "F3":goog.events.KeyCodes.F3, "F4":goog.events.KeyCodes.F4, "F5":goog.events.KeyCodes.F5, "F6":goog.events.KeyCodes.F6, "F7":goog.events.KeyCodes.F7, "F8":goog.events.KeyCodes.F8, "F9":goog.events.KeyCodes.F9, "F10":goog.events.KeyCodes.F10, 
"F11":goog.events.KeyCodes.F11, "F12":goog.events.KeyCodes.F12, "U+007F":goog.events.KeyCodes.DELETE, "Home":goog.events.KeyCodes.HOME, "End":goog.events.KeyCodes.END, "PageUp":goog.events.KeyCodes.PAGE_UP, "PageDown":goog.events.KeyCodes.PAGE_DOWN, "Insert":goog.events.KeyCodes.INSERT};
goog.events.KeyHandler.mozKeyCodeToKeyCodeMap_ = {61:187, 59:186};
goog.events.KeyHandler.USES_KEYDOWN_ = goog.userAgent.IE || goog.userAgent.WEBKIT && goog.userAgent.isVersion("525");
goog.events.KeyHandler.prototype.handleKeyDown_ = function(e) {
  if(goog.userAgent.WEBKIT && (this.lastKey_ == goog.events.KeyCodes.CTRL && !e.ctrlKey || this.lastKey_ == goog.events.KeyCodes.ALT && !e.altKey)) {
    this.lastKey_ = -1;
    this.keyCode_ = -1
  }
  if(goog.events.KeyHandler.USES_KEYDOWN_ && !goog.events.KeyCodes.firesKeyPressEvent(e.keyCode, this.lastKey_, e.shiftKey, e.ctrlKey, e.altKey)) {
    this.handleEvent(e)
  }else {
    if(goog.userAgent.GECKO && e.keyCode in goog.events.KeyHandler.mozKeyCodeToKeyCodeMap_) {
      this.keyCode_ = goog.events.KeyHandler.mozKeyCodeToKeyCodeMap_[e.keyCode]
    }else {
      this.keyCode_ = e.keyCode
    }
  }
};
goog.events.KeyHandler.prototype.handleKeyup_ = function(e) {
  this.lastKey_ = -1;
  this.keyCode_ = -1
};
goog.events.KeyHandler.prototype.handleEvent = function(e) {
  var be = e.getBrowserEvent();
  var keyCode, charCode;
  if(goog.userAgent.IE && e.type == goog.events.EventType.KEYPRESS) {
    keyCode = this.keyCode_;
    charCode = keyCode != goog.events.KeyCodes.ENTER && keyCode != goog.events.KeyCodes.ESC ? be.keyCode : 0
  }else {
    if(goog.userAgent.WEBKIT && e.type == goog.events.EventType.KEYPRESS) {
      keyCode = this.keyCode_;
      charCode = be.charCode >= 0 && be.charCode < 63232 && goog.events.KeyCodes.isCharacterKey(keyCode) ? be.charCode : 0
    }else {
      if(goog.userAgent.OPERA) {
        keyCode = this.keyCode_;
        charCode = goog.events.KeyCodes.isCharacterKey(keyCode) ? be.keyCode : 0
      }else {
        keyCode = be.keyCode || this.keyCode_;
        charCode = be.charCode || 0;
        if(goog.userAgent.MAC && charCode == goog.events.KeyCodes.QUESTION_MARK && !keyCode) {
          keyCode = goog.events.KeyCodes.SLASH
        }
      }
    }
  }
  var key = keyCode;
  var keyIdentifier = be.keyIdentifier;
  if(keyCode) {
    if(keyCode >= 63232 && keyCode in goog.events.KeyHandler.safariKey_) {
      key = goog.events.KeyHandler.safariKey_[keyCode]
    }else {
      if(keyCode == 25 && e.shiftKey) {
        key = 9
      }
    }
  }else {
    if(keyIdentifier && keyIdentifier in goog.events.KeyHandler.keyIdentifier_) {
      key = goog.events.KeyHandler.keyIdentifier_[keyIdentifier]
    }
  }
  var repeat = key == this.lastKey_;
  this.lastKey_ = key;
  var event = new goog.events.KeyEvent(key, charCode, repeat, be);
  try {
    this.dispatchEvent(event)
  }finally {
    event.dispose()
  }
};
goog.events.KeyHandler.prototype.getElement = function() {
  return this.element_
};
goog.events.KeyHandler.prototype.attach = function(element, opt_capture) {
  if(this.keyUpKey_) {
    this.detach()
  }
  this.element_ = element;
  this.keyPressKey_ = goog.events.listen(this.element_, goog.events.EventType.KEYPRESS, this, opt_capture);
  this.keyDownKey_ = goog.events.listen(this.element_, goog.events.EventType.KEYDOWN, this.handleKeyDown_, opt_capture, this);
  this.keyUpKey_ = goog.events.listen(this.element_, goog.events.EventType.KEYUP, this.handleKeyup_, opt_capture, this)
};
goog.events.KeyHandler.prototype.detach = function() {
  if(this.keyPressKey_) {
    goog.events.unlistenByKey(this.keyPressKey_);
    goog.events.unlistenByKey(this.keyDownKey_);
    goog.events.unlistenByKey(this.keyUpKey_);
    this.keyPressKey_ = null;
    this.keyDownKey_ = null;
    this.keyUpKey_ = null
  }
  this.element_ = null;
  this.lastKey_ = -1;
  this.keyCode_ = -1
};
goog.events.KeyHandler.prototype.disposeInternal = function() {
  goog.events.KeyHandler.superClass_.disposeInternal.call(this);
  this.detach()
};
goog.events.KeyEvent = function(keyCode, charCode, repeat, browserEvent) {
  goog.events.BrowserEvent.call(this, browserEvent);
  this.type = goog.events.KeyHandler.EventType.KEY;
  this.keyCode = keyCode;
  this.charCode = charCode;
  this.repeat = repeat
};
goog.inherits(goog.events.KeyEvent, goog.events.BrowserEvent);
goog.provide("goog.debug.Console");
goog.require("goog.debug.LogManager");
goog.require("goog.debug.Logger.Level");
goog.require("goog.debug.TextFormatter");
goog.debug.Console = function() {
  this.publishHandler_ = goog.bind(this.addLogRecord, this);
  this.formatter_ = new goog.debug.TextFormatter;
  this.formatter_.showAbsoluteTime = false;
  this.formatter_.showExceptionText = false;
  this.isCapturing_ = false;
  this.logBuffer_ = "";
  this.filteredLoggers_ = {}
};
goog.debug.Console.prototype.getFormatter = function() {
  return this.formatter_
};
goog.debug.Console.prototype.setCapturing = function(capturing) {
  if(capturing == this.isCapturing_) {
    return
  }
  var rootLogger = goog.debug.LogManager.getRoot();
  if(capturing) {
    rootLogger.addHandler(this.publishHandler_)
  }else {
    rootLogger.removeHandler(this.publishHandler_);
    this.logBuffer = ""
  }
  this.isCapturing_ = capturing
};
goog.debug.Console.prototype.addLogRecord = function(logRecord) {
  if(this.filteredLoggers_[logRecord.getLoggerName()]) {
    return
  }
  var record = this.formatter_.formatRecord(logRecord);
  var console = goog.debug.Console.console_;
  if(console && console["firebug"]) {
    switch(logRecord.getLevel()) {
      case goog.debug.Logger.Level.SHOUT:
        console["info"](record);
        break;
      case goog.debug.Logger.Level.SEVERE:
        console["error"](record);
        break;
      case goog.debug.Logger.Level.WARNING:
        console["warn"](record);
        break;
      default:
        console["debug"](record);
        break
    }
  }else {
    if(console) {
      console.log(record)
    }else {
      if(window.opera) {
        window.opera["postError"](record)
      }else {
        this.logBuffer_ += record
      }
    }
  }
};
goog.debug.Console.prototype.addFilter = function(loggerName) {
  this.filteredLoggers_[loggerName] = true
};
goog.debug.Console.prototype.removeFilter = function(loggerName) {
  delete this.filteredLoggers_[loggerName]
};
goog.debug.Console.instance = null;
goog.debug.Console.console_ = window.console;
goog.debug.Console.autoInstall = function() {
  if(!goog.debug.Console.instance) {
    goog.debug.Console.instance = new goog.debug.Console
  }
  if(window.location.href.indexOf("Debug=true") != -1) {
    goog.debug.Console.instance.setCapturing(true)
  }
};
goog.debug.Console.show = function() {
  alert(goog.debug.Console.instance.logBuffer_)
};
goog.provide("onedit");
goog.require("cljs.core");
goog.require("onedit.core");
goog.require("onedit.file");
goog.require("goog.debug.Console");
goog.require("goog.dom");
goog.require("goog.events");
goog.require("goog.events.KeyHandler");
onedit.create_keymap = function create_keymap(field) {
  return cljs.core.PersistentArrayMap.fromArrays([true, false], [cljs.core.PersistentArrayMap.fromArrays([79, 83], [function() {
    return onedit.file.open.call(null)
  }, function() {
    return onedit.file.save.call(null, field)
  }]), cljs.core.ObjMap.fromObject([], {})])
};
onedit.key_handler = function key_handler(field, keymap, e) {
  console.log(e);
  onedit.core.log.call(null, [cljs.core.str("keyhandler:"), cljs.core.str(e.charCode)].join(""));
  onedit.core.log.call(null, [cljs.core.str("keyhandler:"), cljs.core.str(e.keyCode)].join(""));
  var temp__3974__auto____4426 = keymap.call(null, e.ctrlKey).call(null, e.keyCode);
  if(cljs.core.truth_(temp__3974__auto____4426)) {
    var f__4427 = temp__3974__auto____4426;
    e.preventDefault();
    return f__4427.call(null)
  }else {
    return null
  }
};
onedit.init_buffer = function init_buffer(buffer) {
  var keymap__4428 = onedit.create_keymap.call(null, buffer);
  if(cljs.core.empty_QMARK_.call(null, goog.dom.getRawTextContent.call(null, buffer))) {
    goog.dom.setTextContent.call(null, buffer, function() {
      var temp__3971__auto____4429 = onedit.core.local.getItem(document["title"]);
      if(cljs.core.truth_(temp__3971__auto____4429)) {
        var t__4430 = temp__3971__auto____4429;
        return t__4430
      }else {
        return""
      }
    }())
  }else {
  }
  return goog.events.listen.call(null, new goog.events.KeyHandler(buffer), goog.events.KeyHandler.EventType.KEY, cljs.core.partial.call(null, onedit.key_handler, buffer, keymap__4428))
};
onedit.init = function init() {
  goog.debug.Console.autoInstall.call(null);
  var G__4431__4432 = goog.dom.getElement.call(null, "buffer");
  onedit.init_buffer.call(null, G__4431__4432);
  return G__4431__4432
};
goog.provide("onedit.live");
goog.require("cljs.core");
goog.require("onedit.core");
goog.require("onedit.file");
onedit.live.live = function() {
  var live = null;
  var live__0 = function() {
    var socket__4442 = new WebSocket([cljs.core.str("ws://localhost:5000/live/"), cljs.core.str(tab.get.call(null).attr("id"))].join(""));
    socket__4442.onmessage = function(e) {
      return onedit.core.log.call(null, e.data)
    };
    return tab.data.call(null, "socket", socket__4442)
  };
  var live__2 = function(id, filename) {
    onedit.file.create.call(null, filename);
    var socket__4443 = new WebSocket([cljs.core.str("ws://localhost:5000/live/"), cljs.core.str(id), cljs.core.str("/"), cljs.core.str(filename)].join(""));
    var i__4444 = tab.get.call(null).attr("id");
    onedit.core.log.call(null, i__4444);
    return socket__4443.onmessage = function(e) {
      onedit.core.log.call(null, e.data);
      return onedit.core.jquery.call(null, [cljs.core.str("#"), cljs.core.str(i__4444)].join("")).html(e.data)
    }
  };
  live = function(id, filename) {
    switch(arguments.length) {
      case 0:
        return live__0.call(this);
      case 2:
        return live__2.call(this, id, filename)
    }
    throw"Invalid arity: " + arguments.length;
  };
  live.cljs$lang$arity$0 = live__0;
  live.cljs$lang$arity$2 = live__2;
  return live
}();
goog.provide("onedit.highlighter");
goog.require("cljs.core");
goog.require("onedit.core");
goog.require("goog.object");
goog.require("goog.string");
onedit.highlighter.language = function language(lang) {
  buffer.get_buffer.call(null).attr("class", [cljs.core.str("prettyprint lang-"), cljs.core.str(lang)].join(""));
  return prettyPrint()
};
onedit.highlighter.filename = function filename(name) {
  return onedit.highlighter.language.call(null, cljs.core.last.call(null, cljs.core.re_seq.call(null, /\./, name)))
};
onedit.highlighter.highlight = function highlight() {
  var tab__4439 = tab.get_tab.call(null);
  var temp__3971__auto____4440 = tab.get_tab.call(null).data("language");
  if(cljs.core.truth_(temp__3971__auto____4440)) {
    var lang__4441 = temp__3971__auto____4440;
    return onedit.highlighter.language.call(null, lang__4441)
  }else {
    return onedit.highlighter.filename.call(null, tab.get_tab.call(null).text())
  }
};
