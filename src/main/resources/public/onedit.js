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
goog.provide("cljs.core");
goog.require("goog.string");
goog.require("goog.string.StringBuffer");
goog.require("goog.object");
goog.require("goog.array");
cljs.core._STAR_print_fn_STAR_ = function _STAR_print_fn_STAR_(_) {
  throw new Error("No *print-fn* fn set for evaluation environment");
};
cljs.core.truth_ = function truth_(x) {
  return x != null && x !== false
};
cljs.core.type_satisfies_ = function type_satisfies_(p, x) {
  var or__3824__auto____14286 = p[goog.typeOf.call(null, x)];
  if(cljs.core.truth_(or__3824__auto____14286)) {
    return or__3824__auto____14286
  }else {
    var or__3824__auto____14287 = p["_"];
    if(cljs.core.truth_(or__3824__auto____14287)) {
      return or__3824__auto____14287
    }else {
      return false
    }
  }
};
cljs.core.is_proto_ = function is_proto_(x) {
  return x.constructor.prototype === x
};
cljs.core._STAR_main_cli_fn_STAR_ = null;
cljs.core.missing_protocol = function missing_protocol(proto, obj) {
  return Error.call(null, "No protocol method " + proto + " defined for type " + goog.typeOf.call(null, obj) + ": " + obj)
};
cljs.core.aclone = function aclone(array_like) {
  return Array.prototype.slice.call(array_like)
};
cljs.core.array = function array(var_args) {
  return Array.prototype.slice.call(arguments)
};
cljs.core.aget = function aget(array, i) {
  return array[i]
};
cljs.core.aset = function aset(array, i, val) {
  return array[i] = val
};
cljs.core.alength = function alength(array) {
  return array.length
};
cljs.core.IFn = {};
cljs.core._invoke = function() {
  var _invoke = null;
  var _invoke__14351 = function(this$) {
    if(cljs.core.truth_(function() {
      var and__3822__auto____14288 = this$;
      if(cljs.core.truth_(and__3822__auto____14288)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3822__auto____14288
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$)
    }else {
      return function() {
        var or__3824__auto____14289 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3824__auto____14289)) {
          return or__3824__auto____14289
        }else {
          var or__3824__auto____14290 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3824__auto____14290)) {
            return or__3824__auto____14290
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$)
    }
  };
  var _invoke__14352 = function(this$, a) {
    if(cljs.core.truth_(function() {
      var and__3822__auto____14291 = this$;
      if(cljs.core.truth_(and__3822__auto____14291)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3822__auto____14291
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a)
    }else {
      return function() {
        var or__3824__auto____14292 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3824__auto____14292)) {
          return or__3824__auto____14292
        }else {
          var or__3824__auto____14293 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3824__auto____14293)) {
            return or__3824__auto____14293
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a)
    }
  };
  var _invoke__14353 = function(this$, a, b) {
    if(cljs.core.truth_(function() {
      var and__3822__auto____14294 = this$;
      if(cljs.core.truth_(and__3822__auto____14294)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3822__auto____14294
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b)
    }else {
      return function() {
        var or__3824__auto____14295 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3824__auto____14295)) {
          return or__3824__auto____14295
        }else {
          var or__3824__auto____14296 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3824__auto____14296)) {
            return or__3824__auto____14296
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b)
    }
  };
  var _invoke__14354 = function(this$, a, b, c) {
    if(cljs.core.truth_(function() {
      var and__3822__auto____14297 = this$;
      if(cljs.core.truth_(and__3822__auto____14297)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3822__auto____14297
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c)
    }else {
      return function() {
        var or__3824__auto____14298 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3824__auto____14298)) {
          return or__3824__auto____14298
        }else {
          var or__3824__auto____14299 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3824__auto____14299)) {
            return or__3824__auto____14299
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c)
    }
  };
  var _invoke__14355 = function(this$, a, b, c, d) {
    if(cljs.core.truth_(function() {
      var and__3822__auto____14300 = this$;
      if(cljs.core.truth_(and__3822__auto____14300)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3822__auto____14300
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d)
    }else {
      return function() {
        var or__3824__auto____14301 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3824__auto____14301)) {
          return or__3824__auto____14301
        }else {
          var or__3824__auto____14302 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3824__auto____14302)) {
            return or__3824__auto____14302
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d)
    }
  };
  var _invoke__14356 = function(this$, a, b, c, d, e) {
    if(cljs.core.truth_(function() {
      var and__3822__auto____14303 = this$;
      if(cljs.core.truth_(and__3822__auto____14303)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3822__auto____14303
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e)
    }else {
      return function() {
        var or__3824__auto____14304 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3824__auto____14304)) {
          return or__3824__auto____14304
        }else {
          var or__3824__auto____14305 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3824__auto____14305)) {
            return or__3824__auto____14305
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e)
    }
  };
  var _invoke__14357 = function(this$, a, b, c, d, e, f) {
    if(cljs.core.truth_(function() {
      var and__3822__auto____14306 = this$;
      if(cljs.core.truth_(and__3822__auto____14306)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3822__auto____14306
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f)
    }else {
      return function() {
        var or__3824__auto____14307 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3824__auto____14307)) {
          return or__3824__auto____14307
        }else {
          var or__3824__auto____14308 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3824__auto____14308)) {
            return or__3824__auto____14308
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f)
    }
  };
  var _invoke__14358 = function(this$, a, b, c, d, e, f, g) {
    if(cljs.core.truth_(function() {
      var and__3822__auto____14309 = this$;
      if(cljs.core.truth_(and__3822__auto____14309)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3822__auto____14309
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f, g)
    }else {
      return function() {
        var or__3824__auto____14310 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3824__auto____14310)) {
          return or__3824__auto____14310
        }else {
          var or__3824__auto____14311 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3824__auto____14311)) {
            return or__3824__auto____14311
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g)
    }
  };
  var _invoke__14359 = function(this$, a, b, c, d, e, f, g, h) {
    if(cljs.core.truth_(function() {
      var and__3822__auto____14312 = this$;
      if(cljs.core.truth_(and__3822__auto____14312)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3822__auto____14312
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f, g, h)
    }else {
      return function() {
        var or__3824__auto____14313 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3824__auto____14313)) {
          return or__3824__auto____14313
        }else {
          var or__3824__auto____14314 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3824__auto____14314)) {
            return or__3824__auto____14314
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h)
    }
  };
  var _invoke__14360 = function(this$, a, b, c, d, e, f, g, h, i) {
    if(cljs.core.truth_(function() {
      var and__3822__auto____14315 = this$;
      if(cljs.core.truth_(and__3822__auto____14315)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3822__auto____14315
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f, g, h, i)
    }else {
      return function() {
        var or__3824__auto____14316 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3824__auto____14316)) {
          return or__3824__auto____14316
        }else {
          var or__3824__auto____14317 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3824__auto____14317)) {
            return or__3824__auto____14317
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i)
    }
  };
  var _invoke__14361 = function(this$, a, b, c, d, e, f, g, h, i, j) {
    if(cljs.core.truth_(function() {
      var and__3822__auto____14318 = this$;
      if(cljs.core.truth_(and__3822__auto____14318)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3822__auto____14318
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f, g, h, i, j)
    }else {
      return function() {
        var or__3824__auto____14319 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3824__auto____14319)) {
          return or__3824__auto____14319
        }else {
          var or__3824__auto____14320 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3824__auto____14320)) {
            return or__3824__auto____14320
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j)
    }
  };
  var _invoke__14362 = function(this$, a, b, c, d, e, f, g, h, i, j, k) {
    if(cljs.core.truth_(function() {
      var and__3822__auto____14321 = this$;
      if(cljs.core.truth_(and__3822__auto____14321)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3822__auto____14321
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f, g, h, i, j, k)
    }else {
      return function() {
        var or__3824__auto____14322 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3824__auto____14322)) {
          return or__3824__auto____14322
        }else {
          var or__3824__auto____14323 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3824__auto____14323)) {
            return or__3824__auto____14323
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k)
    }
  };
  var _invoke__14363 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l) {
    if(cljs.core.truth_(function() {
      var and__3822__auto____14324 = this$;
      if(cljs.core.truth_(and__3822__auto____14324)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3822__auto____14324
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f, g, h, i, j, k, l)
    }else {
      return function() {
        var or__3824__auto____14325 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3824__auto____14325)) {
          return or__3824__auto____14325
        }else {
          var or__3824__auto____14326 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3824__auto____14326)) {
            return or__3824__auto____14326
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l)
    }
  };
  var _invoke__14364 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m) {
    if(cljs.core.truth_(function() {
      var and__3822__auto____14327 = this$;
      if(cljs.core.truth_(and__3822__auto____14327)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3822__auto____14327
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f, g, h, i, j, k, l, m)
    }else {
      return function() {
        var or__3824__auto____14328 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3824__auto____14328)) {
          return or__3824__auto____14328
        }else {
          var or__3824__auto____14329 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3824__auto____14329)) {
            return or__3824__auto____14329
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m)
    }
  };
  var _invoke__14365 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n) {
    if(cljs.core.truth_(function() {
      var and__3822__auto____14330 = this$;
      if(cljs.core.truth_(and__3822__auto____14330)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3822__auto____14330
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n)
    }else {
      return function() {
        var or__3824__auto____14331 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3824__auto____14331)) {
          return or__3824__auto____14331
        }else {
          var or__3824__auto____14332 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3824__auto____14332)) {
            return or__3824__auto____14332
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n)
    }
  };
  var _invoke__14366 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o) {
    if(cljs.core.truth_(function() {
      var and__3822__auto____14333 = this$;
      if(cljs.core.truth_(and__3822__auto____14333)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3822__auto____14333
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o)
    }else {
      return function() {
        var or__3824__auto____14334 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3824__auto____14334)) {
          return or__3824__auto____14334
        }else {
          var or__3824__auto____14335 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3824__auto____14335)) {
            return or__3824__auto____14335
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o)
    }
  };
  var _invoke__14367 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p) {
    if(cljs.core.truth_(function() {
      var and__3822__auto____14336 = this$;
      if(cljs.core.truth_(and__3822__auto____14336)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3822__auto____14336
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p)
    }else {
      return function() {
        var or__3824__auto____14337 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3824__auto____14337)) {
          return or__3824__auto____14337
        }else {
          var or__3824__auto____14338 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3824__auto____14338)) {
            return or__3824__auto____14338
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p)
    }
  };
  var _invoke__14368 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q) {
    if(cljs.core.truth_(function() {
      var and__3822__auto____14339 = this$;
      if(cljs.core.truth_(and__3822__auto____14339)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3822__auto____14339
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q)
    }else {
      return function() {
        var or__3824__auto____14340 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3824__auto____14340)) {
          return or__3824__auto____14340
        }else {
          var or__3824__auto____14341 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3824__auto____14341)) {
            return or__3824__auto____14341
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q)
    }
  };
  var _invoke__14369 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s) {
    if(cljs.core.truth_(function() {
      var and__3822__auto____14342 = this$;
      if(cljs.core.truth_(and__3822__auto____14342)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3822__auto____14342
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s)
    }else {
      return function() {
        var or__3824__auto____14343 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3824__auto____14343)) {
          return or__3824__auto____14343
        }else {
          var or__3824__auto____14344 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3824__auto____14344)) {
            return or__3824__auto____14344
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s)
    }
  };
  var _invoke__14370 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t) {
    if(cljs.core.truth_(function() {
      var and__3822__auto____14345 = this$;
      if(cljs.core.truth_(and__3822__auto____14345)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3822__auto____14345
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t)
    }else {
      return function() {
        var or__3824__auto____14346 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3824__auto____14346)) {
          return or__3824__auto____14346
        }else {
          var or__3824__auto____14347 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3824__auto____14347)) {
            return or__3824__auto____14347
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t)
    }
  };
  var _invoke__14371 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest) {
    if(cljs.core.truth_(function() {
      var and__3822__auto____14348 = this$;
      if(cljs.core.truth_(and__3822__auto____14348)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3822__auto____14348
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest)
    }else {
      return function() {
        var or__3824__auto____14349 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3824__auto____14349)) {
          return or__3824__auto____14349
        }else {
          var or__3824__auto____14350 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3824__auto____14350)) {
            return or__3824__auto____14350
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
        return _invoke__14351.call(this, this$);
      case 2:
        return _invoke__14352.call(this, this$, a);
      case 3:
        return _invoke__14353.call(this, this$, a, b);
      case 4:
        return _invoke__14354.call(this, this$, a, b, c);
      case 5:
        return _invoke__14355.call(this, this$, a, b, c, d);
      case 6:
        return _invoke__14356.call(this, this$, a, b, c, d, e);
      case 7:
        return _invoke__14357.call(this, this$, a, b, c, d, e, f);
      case 8:
        return _invoke__14358.call(this, this$, a, b, c, d, e, f, g);
      case 9:
        return _invoke__14359.call(this, this$, a, b, c, d, e, f, g, h);
      case 10:
        return _invoke__14360.call(this, this$, a, b, c, d, e, f, g, h, i);
      case 11:
        return _invoke__14361.call(this, this$, a, b, c, d, e, f, g, h, i, j);
      case 12:
        return _invoke__14362.call(this, this$, a, b, c, d, e, f, g, h, i, j, k);
      case 13:
        return _invoke__14363.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l);
      case 14:
        return _invoke__14364.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m);
      case 15:
        return _invoke__14365.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n);
      case 16:
        return _invoke__14366.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o);
      case 17:
        return _invoke__14367.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p);
      case 18:
        return _invoke__14368.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q);
      case 19:
        return _invoke__14369.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s);
      case 20:
        return _invoke__14370.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t);
      case 21:
        return _invoke__14371.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return _invoke
}();
cljs.core.ICounted = {};
cljs.core._count = function _count(coll) {
  if(cljs.core.truth_(function() {
    var and__3822__auto____14373 = coll;
    if(cljs.core.truth_(and__3822__auto____14373)) {
      return coll.cljs$core$ICounted$_count
    }else {
      return and__3822__auto____14373
    }
  }())) {
    return coll.cljs$core$ICounted$_count(coll)
  }else {
    return function() {
      var or__3824__auto____14374 = cljs.core._count[goog.typeOf.call(null, coll)];
      if(cljs.core.truth_(or__3824__auto____14374)) {
        return or__3824__auto____14374
      }else {
        var or__3824__auto____14375 = cljs.core._count["_"];
        if(cljs.core.truth_(or__3824__auto____14375)) {
          return or__3824__auto____14375
        }else {
          throw cljs.core.missing_protocol.call(null, "ICounted.-count", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.IEmptyableCollection = {};
cljs.core._empty = function _empty(coll) {
  if(cljs.core.truth_(function() {
    var and__3822__auto____14376 = coll;
    if(cljs.core.truth_(and__3822__auto____14376)) {
      return coll.cljs$core$IEmptyableCollection$_empty
    }else {
      return and__3822__auto____14376
    }
  }())) {
    return coll.cljs$core$IEmptyableCollection$_empty(coll)
  }else {
    return function() {
      var or__3824__auto____14377 = cljs.core._empty[goog.typeOf.call(null, coll)];
      if(cljs.core.truth_(or__3824__auto____14377)) {
        return or__3824__auto____14377
      }else {
        var or__3824__auto____14378 = cljs.core._empty["_"];
        if(cljs.core.truth_(or__3824__auto____14378)) {
          return or__3824__auto____14378
        }else {
          throw cljs.core.missing_protocol.call(null, "IEmptyableCollection.-empty", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.ICollection = {};
cljs.core._conj = function _conj(coll, o) {
  if(cljs.core.truth_(function() {
    var and__3822__auto____14379 = coll;
    if(cljs.core.truth_(and__3822__auto____14379)) {
      return coll.cljs$core$ICollection$_conj
    }else {
      return and__3822__auto____14379
    }
  }())) {
    return coll.cljs$core$ICollection$_conj(coll, o)
  }else {
    return function() {
      var or__3824__auto____14380 = cljs.core._conj[goog.typeOf.call(null, coll)];
      if(cljs.core.truth_(or__3824__auto____14380)) {
        return or__3824__auto____14380
      }else {
        var or__3824__auto____14381 = cljs.core._conj["_"];
        if(cljs.core.truth_(or__3824__auto____14381)) {
          return or__3824__auto____14381
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
  var _nth__14388 = function(coll, n) {
    if(cljs.core.truth_(function() {
      var and__3822__auto____14382 = coll;
      if(cljs.core.truth_(and__3822__auto____14382)) {
        return coll.cljs$core$IIndexed$_nth
      }else {
        return and__3822__auto____14382
      }
    }())) {
      return coll.cljs$core$IIndexed$_nth(coll, n)
    }else {
      return function() {
        var or__3824__auto____14383 = cljs.core._nth[goog.typeOf.call(null, coll)];
        if(cljs.core.truth_(or__3824__auto____14383)) {
          return or__3824__auto____14383
        }else {
          var or__3824__auto____14384 = cljs.core._nth["_"];
          if(cljs.core.truth_(or__3824__auto____14384)) {
            return or__3824__auto____14384
          }else {
            throw cljs.core.missing_protocol.call(null, "IIndexed.-nth", coll);
          }
        }
      }().call(null, coll, n)
    }
  };
  var _nth__14389 = function(coll, n, not_found) {
    if(cljs.core.truth_(function() {
      var and__3822__auto____14385 = coll;
      if(cljs.core.truth_(and__3822__auto____14385)) {
        return coll.cljs$core$IIndexed$_nth
      }else {
        return and__3822__auto____14385
      }
    }())) {
      return coll.cljs$core$IIndexed$_nth(coll, n, not_found)
    }else {
      return function() {
        var or__3824__auto____14386 = cljs.core._nth[goog.typeOf.call(null, coll)];
        if(cljs.core.truth_(or__3824__auto____14386)) {
          return or__3824__auto____14386
        }else {
          var or__3824__auto____14387 = cljs.core._nth["_"];
          if(cljs.core.truth_(or__3824__auto____14387)) {
            return or__3824__auto____14387
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
        return _nth__14388.call(this, coll, n);
      case 3:
        return _nth__14389.call(this, coll, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return _nth
}();
cljs.core.ISeq = {};
cljs.core._first = function _first(coll) {
  if(cljs.core.truth_(function() {
    var and__3822__auto____14391 = coll;
    if(cljs.core.truth_(and__3822__auto____14391)) {
      return coll.cljs$core$ISeq$_first
    }else {
      return and__3822__auto____14391
    }
  }())) {
    return coll.cljs$core$ISeq$_first(coll)
  }else {
    return function() {
      var or__3824__auto____14392 = cljs.core._first[goog.typeOf.call(null, coll)];
      if(cljs.core.truth_(or__3824__auto____14392)) {
        return or__3824__auto____14392
      }else {
        var or__3824__auto____14393 = cljs.core._first["_"];
        if(cljs.core.truth_(or__3824__auto____14393)) {
          return or__3824__auto____14393
        }else {
          throw cljs.core.missing_protocol.call(null, "ISeq.-first", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._rest = function _rest(coll) {
  if(cljs.core.truth_(function() {
    var and__3822__auto____14394 = coll;
    if(cljs.core.truth_(and__3822__auto____14394)) {
      return coll.cljs$core$ISeq$_rest
    }else {
      return and__3822__auto____14394
    }
  }())) {
    return coll.cljs$core$ISeq$_rest(coll)
  }else {
    return function() {
      var or__3824__auto____14395 = cljs.core._rest[goog.typeOf.call(null, coll)];
      if(cljs.core.truth_(or__3824__auto____14395)) {
        return or__3824__auto____14395
      }else {
        var or__3824__auto____14396 = cljs.core._rest["_"];
        if(cljs.core.truth_(or__3824__auto____14396)) {
          return or__3824__auto____14396
        }else {
          throw cljs.core.missing_protocol.call(null, "ISeq.-rest", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.ILookup = {};
cljs.core._lookup = function() {
  var _lookup = null;
  var _lookup__14403 = function(o, k) {
    if(cljs.core.truth_(function() {
      var and__3822__auto____14397 = o;
      if(cljs.core.truth_(and__3822__auto____14397)) {
        return o.cljs$core$ILookup$_lookup
      }else {
        return and__3822__auto____14397
      }
    }())) {
      return o.cljs$core$ILookup$_lookup(o, k)
    }else {
      return function() {
        var or__3824__auto____14398 = cljs.core._lookup[goog.typeOf.call(null, o)];
        if(cljs.core.truth_(or__3824__auto____14398)) {
          return or__3824__auto____14398
        }else {
          var or__3824__auto____14399 = cljs.core._lookup["_"];
          if(cljs.core.truth_(or__3824__auto____14399)) {
            return or__3824__auto____14399
          }else {
            throw cljs.core.missing_protocol.call(null, "ILookup.-lookup", o);
          }
        }
      }().call(null, o, k)
    }
  };
  var _lookup__14404 = function(o, k, not_found) {
    if(cljs.core.truth_(function() {
      var and__3822__auto____14400 = o;
      if(cljs.core.truth_(and__3822__auto____14400)) {
        return o.cljs$core$ILookup$_lookup
      }else {
        return and__3822__auto____14400
      }
    }())) {
      return o.cljs$core$ILookup$_lookup(o, k, not_found)
    }else {
      return function() {
        var or__3824__auto____14401 = cljs.core._lookup[goog.typeOf.call(null, o)];
        if(cljs.core.truth_(or__3824__auto____14401)) {
          return or__3824__auto____14401
        }else {
          var or__3824__auto____14402 = cljs.core._lookup["_"];
          if(cljs.core.truth_(or__3824__auto____14402)) {
            return or__3824__auto____14402
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
        return _lookup__14403.call(this, o, k);
      case 3:
        return _lookup__14404.call(this, o, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return _lookup
}();
cljs.core.IAssociative = {};
cljs.core._contains_key_QMARK_ = function _contains_key_QMARK_(coll, k) {
  if(cljs.core.truth_(function() {
    var and__3822__auto____14406 = coll;
    if(cljs.core.truth_(and__3822__auto____14406)) {
      return coll.cljs$core$IAssociative$_contains_key_QMARK_
    }else {
      return and__3822__auto____14406
    }
  }())) {
    return coll.cljs$core$IAssociative$_contains_key_QMARK_(coll, k)
  }else {
    return function() {
      var or__3824__auto____14407 = cljs.core._contains_key_QMARK_[goog.typeOf.call(null, coll)];
      if(cljs.core.truth_(or__3824__auto____14407)) {
        return or__3824__auto____14407
      }else {
        var or__3824__auto____14408 = cljs.core._contains_key_QMARK_["_"];
        if(cljs.core.truth_(or__3824__auto____14408)) {
          return or__3824__auto____14408
        }else {
          throw cljs.core.missing_protocol.call(null, "IAssociative.-contains-key?", coll);
        }
      }
    }().call(null, coll, k)
  }
};
cljs.core._assoc = function _assoc(coll, k, v) {
  if(cljs.core.truth_(function() {
    var and__3822__auto____14409 = coll;
    if(cljs.core.truth_(and__3822__auto____14409)) {
      return coll.cljs$core$IAssociative$_assoc
    }else {
      return and__3822__auto____14409
    }
  }())) {
    return coll.cljs$core$IAssociative$_assoc(coll, k, v)
  }else {
    return function() {
      var or__3824__auto____14410 = cljs.core._assoc[goog.typeOf.call(null, coll)];
      if(cljs.core.truth_(or__3824__auto____14410)) {
        return or__3824__auto____14410
      }else {
        var or__3824__auto____14411 = cljs.core._assoc["_"];
        if(cljs.core.truth_(or__3824__auto____14411)) {
          return or__3824__auto____14411
        }else {
          throw cljs.core.missing_protocol.call(null, "IAssociative.-assoc", coll);
        }
      }
    }().call(null, coll, k, v)
  }
};
cljs.core.IMap = {};
cljs.core._dissoc = function _dissoc(coll, k) {
  if(cljs.core.truth_(function() {
    var and__3822__auto____14412 = coll;
    if(cljs.core.truth_(and__3822__auto____14412)) {
      return coll.cljs$core$IMap$_dissoc
    }else {
      return and__3822__auto____14412
    }
  }())) {
    return coll.cljs$core$IMap$_dissoc(coll, k)
  }else {
    return function() {
      var or__3824__auto____14413 = cljs.core._dissoc[goog.typeOf.call(null, coll)];
      if(cljs.core.truth_(or__3824__auto____14413)) {
        return or__3824__auto____14413
      }else {
        var or__3824__auto____14414 = cljs.core._dissoc["_"];
        if(cljs.core.truth_(or__3824__auto____14414)) {
          return or__3824__auto____14414
        }else {
          throw cljs.core.missing_protocol.call(null, "IMap.-dissoc", coll);
        }
      }
    }().call(null, coll, k)
  }
};
cljs.core.ISet = {};
cljs.core._disjoin = function _disjoin(coll, v) {
  if(cljs.core.truth_(function() {
    var and__3822__auto____14415 = coll;
    if(cljs.core.truth_(and__3822__auto____14415)) {
      return coll.cljs$core$ISet$_disjoin
    }else {
      return and__3822__auto____14415
    }
  }())) {
    return coll.cljs$core$ISet$_disjoin(coll, v)
  }else {
    return function() {
      var or__3824__auto____14416 = cljs.core._disjoin[goog.typeOf.call(null, coll)];
      if(cljs.core.truth_(or__3824__auto____14416)) {
        return or__3824__auto____14416
      }else {
        var or__3824__auto____14417 = cljs.core._disjoin["_"];
        if(cljs.core.truth_(or__3824__auto____14417)) {
          return or__3824__auto____14417
        }else {
          throw cljs.core.missing_protocol.call(null, "ISet.-disjoin", coll);
        }
      }
    }().call(null, coll, v)
  }
};
cljs.core.IStack = {};
cljs.core._peek = function _peek(coll) {
  if(cljs.core.truth_(function() {
    var and__3822__auto____14418 = coll;
    if(cljs.core.truth_(and__3822__auto____14418)) {
      return coll.cljs$core$IStack$_peek
    }else {
      return and__3822__auto____14418
    }
  }())) {
    return coll.cljs$core$IStack$_peek(coll)
  }else {
    return function() {
      var or__3824__auto____14419 = cljs.core._peek[goog.typeOf.call(null, coll)];
      if(cljs.core.truth_(or__3824__auto____14419)) {
        return or__3824__auto____14419
      }else {
        var or__3824__auto____14420 = cljs.core._peek["_"];
        if(cljs.core.truth_(or__3824__auto____14420)) {
          return or__3824__auto____14420
        }else {
          throw cljs.core.missing_protocol.call(null, "IStack.-peek", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._pop = function _pop(coll) {
  if(cljs.core.truth_(function() {
    var and__3822__auto____14421 = coll;
    if(cljs.core.truth_(and__3822__auto____14421)) {
      return coll.cljs$core$IStack$_pop
    }else {
      return and__3822__auto____14421
    }
  }())) {
    return coll.cljs$core$IStack$_pop(coll)
  }else {
    return function() {
      var or__3824__auto____14422 = cljs.core._pop[goog.typeOf.call(null, coll)];
      if(cljs.core.truth_(or__3824__auto____14422)) {
        return or__3824__auto____14422
      }else {
        var or__3824__auto____14423 = cljs.core._pop["_"];
        if(cljs.core.truth_(or__3824__auto____14423)) {
          return or__3824__auto____14423
        }else {
          throw cljs.core.missing_protocol.call(null, "IStack.-pop", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.IVector = {};
cljs.core._assoc_n = function _assoc_n(coll, n, val) {
  if(cljs.core.truth_(function() {
    var and__3822__auto____14424 = coll;
    if(cljs.core.truth_(and__3822__auto____14424)) {
      return coll.cljs$core$IVector$_assoc_n
    }else {
      return and__3822__auto____14424
    }
  }())) {
    return coll.cljs$core$IVector$_assoc_n(coll, n, val)
  }else {
    return function() {
      var or__3824__auto____14425 = cljs.core._assoc_n[goog.typeOf.call(null, coll)];
      if(cljs.core.truth_(or__3824__auto____14425)) {
        return or__3824__auto____14425
      }else {
        var or__3824__auto____14426 = cljs.core._assoc_n["_"];
        if(cljs.core.truth_(or__3824__auto____14426)) {
          return or__3824__auto____14426
        }else {
          throw cljs.core.missing_protocol.call(null, "IVector.-assoc-n", coll);
        }
      }
    }().call(null, coll, n, val)
  }
};
cljs.core.IDeref = {};
cljs.core._deref = function _deref(o) {
  if(cljs.core.truth_(function() {
    var and__3822__auto____14427 = o;
    if(cljs.core.truth_(and__3822__auto____14427)) {
      return o.cljs$core$IDeref$_deref
    }else {
      return and__3822__auto____14427
    }
  }())) {
    return o.cljs$core$IDeref$_deref(o)
  }else {
    return function() {
      var or__3824__auto____14428 = cljs.core._deref[goog.typeOf.call(null, o)];
      if(cljs.core.truth_(or__3824__auto____14428)) {
        return or__3824__auto____14428
      }else {
        var or__3824__auto____14429 = cljs.core._deref["_"];
        if(cljs.core.truth_(or__3824__auto____14429)) {
          return or__3824__auto____14429
        }else {
          throw cljs.core.missing_protocol.call(null, "IDeref.-deref", o);
        }
      }
    }().call(null, o)
  }
};
cljs.core.IDerefWithTimeout = {};
cljs.core._deref_with_timeout = function _deref_with_timeout(o, msec, timeout_val) {
  if(cljs.core.truth_(function() {
    var and__3822__auto____14430 = o;
    if(cljs.core.truth_(and__3822__auto____14430)) {
      return o.cljs$core$IDerefWithTimeout$_deref_with_timeout
    }else {
      return and__3822__auto____14430
    }
  }())) {
    return o.cljs$core$IDerefWithTimeout$_deref_with_timeout(o, msec, timeout_val)
  }else {
    return function() {
      var or__3824__auto____14431 = cljs.core._deref_with_timeout[goog.typeOf.call(null, o)];
      if(cljs.core.truth_(or__3824__auto____14431)) {
        return or__3824__auto____14431
      }else {
        var or__3824__auto____14432 = cljs.core._deref_with_timeout["_"];
        if(cljs.core.truth_(or__3824__auto____14432)) {
          return or__3824__auto____14432
        }else {
          throw cljs.core.missing_protocol.call(null, "IDerefWithTimeout.-deref-with-timeout", o);
        }
      }
    }().call(null, o, msec, timeout_val)
  }
};
cljs.core.IMeta = {};
cljs.core._meta = function _meta(o) {
  if(cljs.core.truth_(function() {
    var and__3822__auto____14433 = o;
    if(cljs.core.truth_(and__3822__auto____14433)) {
      return o.cljs$core$IMeta$_meta
    }else {
      return and__3822__auto____14433
    }
  }())) {
    return o.cljs$core$IMeta$_meta(o)
  }else {
    return function() {
      var or__3824__auto____14434 = cljs.core._meta[goog.typeOf.call(null, o)];
      if(cljs.core.truth_(or__3824__auto____14434)) {
        return or__3824__auto____14434
      }else {
        var or__3824__auto____14435 = cljs.core._meta["_"];
        if(cljs.core.truth_(or__3824__auto____14435)) {
          return or__3824__auto____14435
        }else {
          throw cljs.core.missing_protocol.call(null, "IMeta.-meta", o);
        }
      }
    }().call(null, o)
  }
};
cljs.core.IWithMeta = {};
cljs.core._with_meta = function _with_meta(o, meta) {
  if(cljs.core.truth_(function() {
    var and__3822__auto____14436 = o;
    if(cljs.core.truth_(and__3822__auto____14436)) {
      return o.cljs$core$IWithMeta$_with_meta
    }else {
      return and__3822__auto____14436
    }
  }())) {
    return o.cljs$core$IWithMeta$_with_meta(o, meta)
  }else {
    return function() {
      var or__3824__auto____14437 = cljs.core._with_meta[goog.typeOf.call(null, o)];
      if(cljs.core.truth_(or__3824__auto____14437)) {
        return or__3824__auto____14437
      }else {
        var or__3824__auto____14438 = cljs.core._with_meta["_"];
        if(cljs.core.truth_(or__3824__auto____14438)) {
          return or__3824__auto____14438
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
  var _reduce__14445 = function(coll, f) {
    if(cljs.core.truth_(function() {
      var and__3822__auto____14439 = coll;
      if(cljs.core.truth_(and__3822__auto____14439)) {
        return coll.cljs$core$IReduce$_reduce
      }else {
        return and__3822__auto____14439
      }
    }())) {
      return coll.cljs$core$IReduce$_reduce(coll, f)
    }else {
      return function() {
        var or__3824__auto____14440 = cljs.core._reduce[goog.typeOf.call(null, coll)];
        if(cljs.core.truth_(or__3824__auto____14440)) {
          return or__3824__auto____14440
        }else {
          var or__3824__auto____14441 = cljs.core._reduce["_"];
          if(cljs.core.truth_(or__3824__auto____14441)) {
            return or__3824__auto____14441
          }else {
            throw cljs.core.missing_protocol.call(null, "IReduce.-reduce", coll);
          }
        }
      }().call(null, coll, f)
    }
  };
  var _reduce__14446 = function(coll, f, start) {
    if(cljs.core.truth_(function() {
      var and__3822__auto____14442 = coll;
      if(cljs.core.truth_(and__3822__auto____14442)) {
        return coll.cljs$core$IReduce$_reduce
      }else {
        return and__3822__auto____14442
      }
    }())) {
      return coll.cljs$core$IReduce$_reduce(coll, f, start)
    }else {
      return function() {
        var or__3824__auto____14443 = cljs.core._reduce[goog.typeOf.call(null, coll)];
        if(cljs.core.truth_(or__3824__auto____14443)) {
          return or__3824__auto____14443
        }else {
          var or__3824__auto____14444 = cljs.core._reduce["_"];
          if(cljs.core.truth_(or__3824__auto____14444)) {
            return or__3824__auto____14444
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
        return _reduce__14445.call(this, coll, f);
      case 3:
        return _reduce__14446.call(this, coll, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return _reduce
}();
cljs.core.IEquiv = {};
cljs.core._equiv = function _equiv(o, other) {
  if(cljs.core.truth_(function() {
    var and__3822__auto____14448 = o;
    if(cljs.core.truth_(and__3822__auto____14448)) {
      return o.cljs$core$IEquiv$_equiv
    }else {
      return and__3822__auto____14448
    }
  }())) {
    return o.cljs$core$IEquiv$_equiv(o, other)
  }else {
    return function() {
      var or__3824__auto____14449 = cljs.core._equiv[goog.typeOf.call(null, o)];
      if(cljs.core.truth_(or__3824__auto____14449)) {
        return or__3824__auto____14449
      }else {
        var or__3824__auto____14450 = cljs.core._equiv["_"];
        if(cljs.core.truth_(or__3824__auto____14450)) {
          return or__3824__auto____14450
        }else {
          throw cljs.core.missing_protocol.call(null, "IEquiv.-equiv", o);
        }
      }
    }().call(null, o, other)
  }
};
cljs.core.IHash = {};
cljs.core._hash = function _hash(o) {
  if(cljs.core.truth_(function() {
    var and__3822__auto____14451 = o;
    if(cljs.core.truth_(and__3822__auto____14451)) {
      return o.cljs$core$IHash$_hash
    }else {
      return and__3822__auto____14451
    }
  }())) {
    return o.cljs$core$IHash$_hash(o)
  }else {
    return function() {
      var or__3824__auto____14452 = cljs.core._hash[goog.typeOf.call(null, o)];
      if(cljs.core.truth_(or__3824__auto____14452)) {
        return or__3824__auto____14452
      }else {
        var or__3824__auto____14453 = cljs.core._hash["_"];
        if(cljs.core.truth_(or__3824__auto____14453)) {
          return or__3824__auto____14453
        }else {
          throw cljs.core.missing_protocol.call(null, "IHash.-hash", o);
        }
      }
    }().call(null, o)
  }
};
cljs.core.ISeqable = {};
cljs.core._seq = function _seq(o) {
  if(cljs.core.truth_(function() {
    var and__3822__auto____14454 = o;
    if(cljs.core.truth_(and__3822__auto____14454)) {
      return o.cljs$core$ISeqable$_seq
    }else {
      return and__3822__auto____14454
    }
  }())) {
    return o.cljs$core$ISeqable$_seq(o)
  }else {
    return function() {
      var or__3824__auto____14455 = cljs.core._seq[goog.typeOf.call(null, o)];
      if(cljs.core.truth_(or__3824__auto____14455)) {
        return or__3824__auto____14455
      }else {
        var or__3824__auto____14456 = cljs.core._seq["_"];
        if(cljs.core.truth_(or__3824__auto____14456)) {
          return or__3824__auto____14456
        }else {
          throw cljs.core.missing_protocol.call(null, "ISeqable.-seq", o);
        }
      }
    }().call(null, o)
  }
};
cljs.core.ISequential = {};
cljs.core.IRecord = {};
cljs.core.IPrintable = {};
cljs.core._pr_seq = function _pr_seq(o, opts) {
  if(cljs.core.truth_(function() {
    var and__3822__auto____14457 = o;
    if(cljs.core.truth_(and__3822__auto____14457)) {
      return o.cljs$core$IPrintable$_pr_seq
    }else {
      return and__3822__auto____14457
    }
  }())) {
    return o.cljs$core$IPrintable$_pr_seq(o, opts)
  }else {
    return function() {
      var or__3824__auto____14458 = cljs.core._pr_seq[goog.typeOf.call(null, o)];
      if(cljs.core.truth_(or__3824__auto____14458)) {
        return or__3824__auto____14458
      }else {
        var or__3824__auto____14459 = cljs.core._pr_seq["_"];
        if(cljs.core.truth_(or__3824__auto____14459)) {
          return or__3824__auto____14459
        }else {
          throw cljs.core.missing_protocol.call(null, "IPrintable.-pr-seq", o);
        }
      }
    }().call(null, o, opts)
  }
};
cljs.core.IPending = {};
cljs.core._realized_QMARK_ = function _realized_QMARK_(d) {
  if(cljs.core.truth_(function() {
    var and__3822__auto____14460 = d;
    if(cljs.core.truth_(and__3822__auto____14460)) {
      return d.cljs$core$IPending$_realized_QMARK_
    }else {
      return and__3822__auto____14460
    }
  }())) {
    return d.cljs$core$IPending$_realized_QMARK_(d)
  }else {
    return function() {
      var or__3824__auto____14461 = cljs.core._realized_QMARK_[goog.typeOf.call(null, d)];
      if(cljs.core.truth_(or__3824__auto____14461)) {
        return or__3824__auto____14461
      }else {
        var or__3824__auto____14462 = cljs.core._realized_QMARK_["_"];
        if(cljs.core.truth_(or__3824__auto____14462)) {
          return or__3824__auto____14462
        }else {
          throw cljs.core.missing_protocol.call(null, "IPending.-realized?", d);
        }
      }
    }().call(null, d)
  }
};
cljs.core.IWatchable = {};
cljs.core._notify_watches = function _notify_watches(this$, oldval, newval) {
  if(cljs.core.truth_(function() {
    var and__3822__auto____14463 = this$;
    if(cljs.core.truth_(and__3822__auto____14463)) {
      return this$.cljs$core$IWatchable$_notify_watches
    }else {
      return and__3822__auto____14463
    }
  }())) {
    return this$.cljs$core$IWatchable$_notify_watches(this$, oldval, newval)
  }else {
    return function() {
      var or__3824__auto____14464 = cljs.core._notify_watches[goog.typeOf.call(null, this$)];
      if(cljs.core.truth_(or__3824__auto____14464)) {
        return or__3824__auto____14464
      }else {
        var or__3824__auto____14465 = cljs.core._notify_watches["_"];
        if(cljs.core.truth_(or__3824__auto____14465)) {
          return or__3824__auto____14465
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-notify-watches", this$);
        }
      }
    }().call(null, this$, oldval, newval)
  }
};
cljs.core._add_watch = function _add_watch(this$, key, f) {
  if(cljs.core.truth_(function() {
    var and__3822__auto____14466 = this$;
    if(cljs.core.truth_(and__3822__auto____14466)) {
      return this$.cljs$core$IWatchable$_add_watch
    }else {
      return and__3822__auto____14466
    }
  }())) {
    return this$.cljs$core$IWatchable$_add_watch(this$, key, f)
  }else {
    return function() {
      var or__3824__auto____14467 = cljs.core._add_watch[goog.typeOf.call(null, this$)];
      if(cljs.core.truth_(or__3824__auto____14467)) {
        return or__3824__auto____14467
      }else {
        var or__3824__auto____14468 = cljs.core._add_watch["_"];
        if(cljs.core.truth_(or__3824__auto____14468)) {
          return or__3824__auto____14468
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-add-watch", this$);
        }
      }
    }().call(null, this$, key, f)
  }
};
cljs.core._remove_watch = function _remove_watch(this$, key) {
  if(cljs.core.truth_(function() {
    var and__3822__auto____14469 = this$;
    if(cljs.core.truth_(and__3822__auto____14469)) {
      return this$.cljs$core$IWatchable$_remove_watch
    }else {
      return and__3822__auto____14469
    }
  }())) {
    return this$.cljs$core$IWatchable$_remove_watch(this$, key)
  }else {
    return function() {
      var or__3824__auto____14470 = cljs.core._remove_watch[goog.typeOf.call(null, this$)];
      if(cljs.core.truth_(or__3824__auto____14470)) {
        return or__3824__auto____14470
      }else {
        var or__3824__auto____14471 = cljs.core._remove_watch["_"];
        if(cljs.core.truth_(or__3824__auto____14471)) {
          return or__3824__auto____14471
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-remove-watch", this$);
        }
      }
    }().call(null, this$, key)
  }
};
cljs.core.identical_QMARK_ = function identical_QMARK_(x, y) {
  return x === y
};
cljs.core._EQ_ = function _EQ_(x, y) {
  return cljs.core._equiv.call(null, x, y)
};
cljs.core.nil_QMARK_ = function nil_QMARK_(x) {
  return x === null
};
cljs.core.type = function type(x) {
  return x.constructor
};
cljs.core.IHash["null"] = true;
cljs.core._hash["null"] = function(o) {
  return 0
};
cljs.core.ILookup["null"] = true;
cljs.core._lookup["null"] = function() {
  var G__14472 = null;
  var G__14472__14473 = function(o, k) {
    return null
  };
  var G__14472__14474 = function(o, k, not_found) {
    return not_found
  };
  G__14472 = function(o, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__14472__14473.call(this, o, k);
      case 3:
        return G__14472__14474.call(this, o, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__14472
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
  var G__14476 = null;
  var G__14476__14477 = function(_, f) {
    return f.call(null)
  };
  var G__14476__14478 = function(_, f, start) {
    return start
  };
  G__14476 = function(_, f, start) {
    switch(arguments.length) {
      case 2:
        return G__14476__14477.call(this, _, f);
      case 3:
        return G__14476__14478.call(this, _, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__14476
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
  return o === null
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
  var G__14480 = null;
  var G__14480__14481 = function(_, n) {
    return null
  };
  var G__14480__14482 = function(_, n, not_found) {
    return not_found
  };
  G__14480 = function(_, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__14480__14481.call(this, _, n);
      case 3:
        return G__14480__14482.call(this, _, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__14480
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
Date.prototype.cljs$core$IEquiv$_equiv = function(o, other) {
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
cljs.core.ci_reduce = function() {
  var ci_reduce = null;
  var ci_reduce__14490 = function(cicoll, f) {
    if(cljs.core.truth_(cljs.core._EQ_.call(null, 0, cljs.core._count.call(null, cicoll)))) {
      return f.call(null)
    }else {
      var val__14484 = cljs.core._nth.call(null, cicoll, 0);
      var n__14485 = 1;
      while(true) {
        if(cljs.core.truth_(n__14485 < cljs.core._count.call(null, cicoll))) {
          var G__14494 = f.call(null, val__14484, cljs.core._nth.call(null, cicoll, n__14485));
          var G__14495 = n__14485 + 1;
          val__14484 = G__14494;
          n__14485 = G__14495;
          continue
        }else {
          return val__14484
        }
        break
      }
    }
  };
  var ci_reduce__14491 = function(cicoll, f, val) {
    var val__14486 = val;
    var n__14487 = 0;
    while(true) {
      if(cljs.core.truth_(n__14487 < cljs.core._count.call(null, cicoll))) {
        var G__14496 = f.call(null, val__14486, cljs.core._nth.call(null, cicoll, n__14487));
        var G__14497 = n__14487 + 1;
        val__14486 = G__14496;
        n__14487 = G__14497;
        continue
      }else {
        return val__14486
      }
      break
    }
  };
  var ci_reduce__14492 = function(cicoll, f, val, idx) {
    var val__14488 = val;
    var n__14489 = idx;
    while(true) {
      if(cljs.core.truth_(n__14489 < cljs.core._count.call(null, cicoll))) {
        var G__14498 = f.call(null, val__14488, cljs.core._nth.call(null, cicoll, n__14489));
        var G__14499 = n__14489 + 1;
        val__14488 = G__14498;
        n__14489 = G__14499;
        continue
      }else {
        return val__14488
      }
      break
    }
  };
  ci_reduce = function(cicoll, f, val, idx) {
    switch(arguments.length) {
      case 2:
        return ci_reduce__14490.call(this, cicoll, f);
      case 3:
        return ci_reduce__14491.call(this, cicoll, f, val);
      case 4:
        return ci_reduce__14492.call(this, cicoll, f, val, idx)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return ci_reduce
}();
cljs.core.IndexedSeq = function(a, i) {
  this.a = a;
  this.i = i
};
cljs.core.IndexedSeq.cljs$core$IPrintable$_pr_seq = function(this__367__auto__) {
  return cljs.core.list.call(null, "cljs.core.IndexedSeq")
};
cljs.core.IndexedSeq.prototype.cljs$core$IHash$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$IHash$_hash = function(coll) {
  var this__14500 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.IndexedSeq.prototype.cljs$core$IReduce$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$IReduce$_reduce = function() {
  var G__14513 = null;
  var G__14513__14514 = function(_, f) {
    var this__14501 = this;
    return cljs.core.ci_reduce.call(null, this__14501.a, f, this__14501.a[this__14501.i], this__14501.i + 1)
  };
  var G__14513__14515 = function(_, f, start) {
    var this__14502 = this;
    return cljs.core.ci_reduce.call(null, this__14502.a, f, start, this__14502.i)
  };
  G__14513 = function(_, f, start) {
    switch(arguments.length) {
      case 2:
        return G__14513__14514.call(this, _, f);
      case 3:
        return G__14513__14515.call(this, _, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__14513
}();
cljs.core.IndexedSeq.prototype.cljs$core$ICollection$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$ICollection$_conj = function(coll, o) {
  var this__14503 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.IndexedSeq.prototype.cljs$core$IEquiv$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$IEquiv$_equiv = function(coll, other) {
  var this__14504 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.IndexedSeq.prototype.cljs$core$ISequential$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$IIndexed$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$IIndexed$_nth = function() {
  var G__14517 = null;
  var G__14517__14518 = function(coll, n) {
    var this__14505 = this;
    var i__14506 = n + this__14505.i;
    if(cljs.core.truth_(i__14506 < this__14505.a.length)) {
      return this__14505.a[i__14506]
    }else {
      return null
    }
  };
  var G__14517__14519 = function(coll, n, not_found) {
    var this__14507 = this;
    var i__14508 = n + this__14507.i;
    if(cljs.core.truth_(i__14508 < this__14507.a.length)) {
      return this__14507.a[i__14508]
    }else {
      return not_found
    }
  };
  G__14517 = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__14517__14518.call(this, coll, n);
      case 3:
        return G__14517__14519.call(this, coll, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__14517
}();
cljs.core.IndexedSeq.prototype.cljs$core$ICounted$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$ICounted$_count = function(_) {
  var this__14509 = this;
  return this__14509.a.length - this__14509.i
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeq$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$ISeq$_first = function(_) {
  var this__14510 = this;
  return this__14510.a[this__14510.i]
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeq$_rest = function(_) {
  var this__14511 = this;
  if(cljs.core.truth_(this__14511.i + 1 < this__14511.a.length)) {
    return new cljs.core.IndexedSeq(this__14511.a, this__14511.i + 1)
  }else {
    return cljs.core.list.call(null)
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeqable$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$ISeqable$_seq = function(this$) {
  var this__14512 = this;
  return this$
};
cljs.core.IndexedSeq;
cljs.core.prim_seq = function prim_seq(prim, i) {
  if(cljs.core.truth_(cljs.core._EQ_.call(null, 0, prim.length))) {
    return null
  }else {
    return new cljs.core.IndexedSeq(prim, i)
  }
};
cljs.core.array_seq = function array_seq(array, i) {
  return cljs.core.prim_seq.call(null, array, i)
};
cljs.core.IReduce["array"] = true;
cljs.core._reduce["array"] = function() {
  var G__14521 = null;
  var G__14521__14522 = function(array, f) {
    return cljs.core.ci_reduce.call(null, array, f)
  };
  var G__14521__14523 = function(array, f, start) {
    return cljs.core.ci_reduce.call(null, array, f, start)
  };
  G__14521 = function(array, f, start) {
    switch(arguments.length) {
      case 2:
        return G__14521__14522.call(this, array, f);
      case 3:
        return G__14521__14523.call(this, array, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__14521
}();
cljs.core.ILookup["array"] = true;
cljs.core._lookup["array"] = function() {
  var G__14525 = null;
  var G__14525__14526 = function(array, k) {
    return array[k]
  };
  var G__14525__14527 = function(array, k, not_found) {
    return cljs.core._nth.call(null, array, k, not_found)
  };
  G__14525 = function(array, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__14525__14526.call(this, array, k);
      case 3:
        return G__14525__14527.call(this, array, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__14525
}();
cljs.core.IIndexed["array"] = true;
cljs.core._nth["array"] = function() {
  var G__14529 = null;
  var G__14529__14530 = function(array, n) {
    if(cljs.core.truth_(n < array.length)) {
      return array[n]
    }else {
      return null
    }
  };
  var G__14529__14531 = function(array, n, not_found) {
    if(cljs.core.truth_(n < array.length)) {
      return array[n]
    }else {
      return not_found
    }
  };
  G__14529 = function(array, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__14529__14530.call(this, array, n);
      case 3:
        return G__14529__14531.call(this, array, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__14529
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
  if(cljs.core.truth_(coll)) {
    return cljs.core._seq.call(null, coll)
  }else {
    return null
  }
};
cljs.core.first = function first(coll) {
  var temp__3974__auto____14533 = cljs.core.seq.call(null, coll);
  if(cljs.core.truth_(temp__3974__auto____14533)) {
    var s__14534 = temp__3974__auto____14533;
    return cljs.core._first.call(null, s__14534)
  }else {
    return null
  }
};
cljs.core.rest = function rest(coll) {
  return cljs.core._rest.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.next = function next(coll) {
  if(cljs.core.truth_(coll)) {
    return cljs.core.seq.call(null, cljs.core.rest.call(null, coll))
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
      var G__14535 = cljs.core.next.call(null, s);
      s = G__14535;
      continue
    }else {
      return cljs.core.first.call(null, s)
    }
    break
  }
};
cljs.core.ICounted["_"] = true;
cljs.core._count["_"] = function(x) {
  var s__14536 = cljs.core.seq.call(null, x);
  var n__14537 = 0;
  while(true) {
    if(cljs.core.truth_(s__14536)) {
      var G__14538 = cljs.core.next.call(null, s__14536);
      var G__14539 = n__14537 + 1;
      s__14536 = G__14538;
      n__14537 = G__14539;
      continue
    }else {
      return n__14537
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
  var conj__14540 = function(coll, x) {
    return cljs.core._conj.call(null, coll, x)
  };
  var conj__14541 = function() {
    var G__14543__delegate = function(coll, x, xs) {
      while(true) {
        if(cljs.core.truth_(xs)) {
          var G__14544 = conj.call(null, coll, x);
          var G__14545 = cljs.core.first.call(null, xs);
          var G__14546 = cljs.core.next.call(null, xs);
          coll = G__14544;
          x = G__14545;
          xs = G__14546;
          continue
        }else {
          return conj.call(null, coll, x)
        }
        break
      }
    };
    var G__14543 = function(coll, x, var_args) {
      var xs = null;
      if(goog.isDef(var_args)) {
        xs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__14543__delegate.call(this, coll, x, xs)
    };
    G__14543.cljs$lang$maxFixedArity = 2;
    G__14543.cljs$lang$applyTo = function(arglist__14547) {
      var coll = cljs.core.first(arglist__14547);
      var x = cljs.core.first(cljs.core.next(arglist__14547));
      var xs = cljs.core.rest(cljs.core.next(arglist__14547));
      return G__14543__delegate.call(this, coll, x, xs)
    };
    return G__14543
  }();
  conj = function(coll, x, var_args) {
    var xs = var_args;
    switch(arguments.length) {
      case 2:
        return conj__14540.call(this, coll, x);
      default:
        return conj__14541.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  conj.cljs$lang$maxFixedArity = 2;
  conj.cljs$lang$applyTo = conj__14541.cljs$lang$applyTo;
  return conj
}();
cljs.core.empty = function empty(coll) {
  return cljs.core._empty.call(null, coll)
};
cljs.core.count = function count(coll) {
  return cljs.core._count.call(null, coll)
};
cljs.core.nth = function() {
  var nth = null;
  var nth__14548 = function(coll, n) {
    return cljs.core._nth.call(null, coll, Math.floor(n))
  };
  var nth__14549 = function(coll, n, not_found) {
    return cljs.core._nth.call(null, coll, Math.floor(n), not_found)
  };
  nth = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return nth__14548.call(this, coll, n);
      case 3:
        return nth__14549.call(this, coll, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return nth
}();
cljs.core.get = function() {
  var get = null;
  var get__14551 = function(o, k) {
    return cljs.core._lookup.call(null, o, k)
  };
  var get__14552 = function(o, k, not_found) {
    return cljs.core._lookup.call(null, o, k, not_found)
  };
  get = function(o, k, not_found) {
    switch(arguments.length) {
      case 2:
        return get__14551.call(this, o, k);
      case 3:
        return get__14552.call(this, o, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return get
}();
cljs.core.assoc = function() {
  var assoc = null;
  var assoc__14555 = function(coll, k, v) {
    return cljs.core._assoc.call(null, coll, k, v)
  };
  var assoc__14556 = function() {
    var G__14558__delegate = function(coll, k, v, kvs) {
      while(true) {
        var ret__14554 = assoc.call(null, coll, k, v);
        if(cljs.core.truth_(kvs)) {
          var G__14559 = ret__14554;
          var G__14560 = cljs.core.first.call(null, kvs);
          var G__14561 = cljs.core.second.call(null, kvs);
          var G__14562 = cljs.core.nnext.call(null, kvs);
          coll = G__14559;
          k = G__14560;
          v = G__14561;
          kvs = G__14562;
          continue
        }else {
          return ret__14554
        }
        break
      }
    };
    var G__14558 = function(coll, k, v, var_args) {
      var kvs = null;
      if(goog.isDef(var_args)) {
        kvs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__14558__delegate.call(this, coll, k, v, kvs)
    };
    G__14558.cljs$lang$maxFixedArity = 3;
    G__14558.cljs$lang$applyTo = function(arglist__14563) {
      var coll = cljs.core.first(arglist__14563);
      var k = cljs.core.first(cljs.core.next(arglist__14563));
      var v = cljs.core.first(cljs.core.next(cljs.core.next(arglist__14563)));
      var kvs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__14563)));
      return G__14558__delegate.call(this, coll, k, v, kvs)
    };
    return G__14558
  }();
  assoc = function(coll, k, v, var_args) {
    var kvs = var_args;
    switch(arguments.length) {
      case 3:
        return assoc__14555.call(this, coll, k, v);
      default:
        return assoc__14556.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  assoc.cljs$lang$maxFixedArity = 3;
  assoc.cljs$lang$applyTo = assoc__14556.cljs$lang$applyTo;
  return assoc
}();
cljs.core.dissoc = function() {
  var dissoc = null;
  var dissoc__14565 = function(coll) {
    return coll
  };
  var dissoc__14566 = function(coll, k) {
    return cljs.core._dissoc.call(null, coll, k)
  };
  var dissoc__14567 = function() {
    var G__14569__delegate = function(coll, k, ks) {
      while(true) {
        var ret__14564 = dissoc.call(null, coll, k);
        if(cljs.core.truth_(ks)) {
          var G__14570 = ret__14564;
          var G__14571 = cljs.core.first.call(null, ks);
          var G__14572 = cljs.core.next.call(null, ks);
          coll = G__14570;
          k = G__14571;
          ks = G__14572;
          continue
        }else {
          return ret__14564
        }
        break
      }
    };
    var G__14569 = function(coll, k, var_args) {
      var ks = null;
      if(goog.isDef(var_args)) {
        ks = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__14569__delegate.call(this, coll, k, ks)
    };
    G__14569.cljs$lang$maxFixedArity = 2;
    G__14569.cljs$lang$applyTo = function(arglist__14573) {
      var coll = cljs.core.first(arglist__14573);
      var k = cljs.core.first(cljs.core.next(arglist__14573));
      var ks = cljs.core.rest(cljs.core.next(arglist__14573));
      return G__14569__delegate.call(this, coll, k, ks)
    };
    return G__14569
  }();
  dissoc = function(coll, k, var_args) {
    var ks = var_args;
    switch(arguments.length) {
      case 1:
        return dissoc__14565.call(this, coll);
      case 2:
        return dissoc__14566.call(this, coll, k);
      default:
        return dissoc__14567.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  dissoc.cljs$lang$maxFixedArity = 2;
  dissoc.cljs$lang$applyTo = dissoc__14567.cljs$lang$applyTo;
  return dissoc
}();
cljs.core.with_meta = function with_meta(o, meta) {
  return cljs.core._with_meta.call(null, o, meta)
};
cljs.core.meta = function meta(o) {
  if(cljs.core.truth_(function() {
    var x__451__auto____14574 = o;
    if(cljs.core.truth_(function() {
      var and__3822__auto____14575 = x__451__auto____14574;
      if(cljs.core.truth_(and__3822__auto____14575)) {
        var and__3822__auto____14576 = x__451__auto____14574.cljs$core$IMeta$;
        if(cljs.core.truth_(and__3822__auto____14576)) {
          return cljs.core.not.call(null, x__451__auto____14574.hasOwnProperty("cljs$core$IMeta$"))
        }else {
          return and__3822__auto____14576
        }
      }else {
        return and__3822__auto____14575
      }
    }())) {
      return true
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, x__451__auto____14574)
    }
  }())) {
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
  var disj__14578 = function(coll) {
    return coll
  };
  var disj__14579 = function(coll, k) {
    return cljs.core._disjoin.call(null, coll, k)
  };
  var disj__14580 = function() {
    var G__14582__delegate = function(coll, k, ks) {
      while(true) {
        var ret__14577 = disj.call(null, coll, k);
        if(cljs.core.truth_(ks)) {
          var G__14583 = ret__14577;
          var G__14584 = cljs.core.first.call(null, ks);
          var G__14585 = cljs.core.next.call(null, ks);
          coll = G__14583;
          k = G__14584;
          ks = G__14585;
          continue
        }else {
          return ret__14577
        }
        break
      }
    };
    var G__14582 = function(coll, k, var_args) {
      var ks = null;
      if(goog.isDef(var_args)) {
        ks = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__14582__delegate.call(this, coll, k, ks)
    };
    G__14582.cljs$lang$maxFixedArity = 2;
    G__14582.cljs$lang$applyTo = function(arglist__14586) {
      var coll = cljs.core.first(arglist__14586);
      var k = cljs.core.first(cljs.core.next(arglist__14586));
      var ks = cljs.core.rest(cljs.core.next(arglist__14586));
      return G__14582__delegate.call(this, coll, k, ks)
    };
    return G__14582
  }();
  disj = function(coll, k, var_args) {
    var ks = var_args;
    switch(arguments.length) {
      case 1:
        return disj__14578.call(this, coll);
      case 2:
        return disj__14579.call(this, coll, k);
      default:
        return disj__14580.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  disj.cljs$lang$maxFixedArity = 2;
  disj.cljs$lang$applyTo = disj__14580.cljs$lang$applyTo;
  return disj
}();
cljs.core.hash = function hash(o) {
  return cljs.core._hash.call(null, o)
};
cljs.core.empty_QMARK_ = function empty_QMARK_(coll) {
  return cljs.core.not.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.coll_QMARK_ = function coll_QMARK_(x) {
  if(cljs.core.truth_(x === null)) {
    return false
  }else {
    var x__451__auto____14587 = x;
    if(cljs.core.truth_(function() {
      var and__3822__auto____14588 = x__451__auto____14587;
      if(cljs.core.truth_(and__3822__auto____14588)) {
        var and__3822__auto____14589 = x__451__auto____14587.cljs$core$ICollection$;
        if(cljs.core.truth_(and__3822__auto____14589)) {
          return cljs.core.not.call(null, x__451__auto____14587.hasOwnProperty("cljs$core$ICollection$"))
        }else {
          return and__3822__auto____14589
        }
      }else {
        return and__3822__auto____14588
      }
    }())) {
      return true
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ICollection, x__451__auto____14587)
    }
  }
};
cljs.core.set_QMARK_ = function set_QMARK_(x) {
  if(cljs.core.truth_(x === null)) {
    return false
  }else {
    var x__451__auto____14590 = x;
    if(cljs.core.truth_(function() {
      var and__3822__auto____14591 = x__451__auto____14590;
      if(cljs.core.truth_(and__3822__auto____14591)) {
        var and__3822__auto____14592 = x__451__auto____14590.cljs$core$ISet$;
        if(cljs.core.truth_(and__3822__auto____14592)) {
          return cljs.core.not.call(null, x__451__auto____14590.hasOwnProperty("cljs$core$ISet$"))
        }else {
          return and__3822__auto____14592
        }
      }else {
        return and__3822__auto____14591
      }
    }())) {
      return true
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ISet, x__451__auto____14590)
    }
  }
};
cljs.core.associative_QMARK_ = function associative_QMARK_(x) {
  var x__451__auto____14593 = x;
  if(cljs.core.truth_(function() {
    var and__3822__auto____14594 = x__451__auto____14593;
    if(cljs.core.truth_(and__3822__auto____14594)) {
      var and__3822__auto____14595 = x__451__auto____14593.cljs$core$IAssociative$;
      if(cljs.core.truth_(and__3822__auto____14595)) {
        return cljs.core.not.call(null, x__451__auto____14593.hasOwnProperty("cljs$core$IAssociative$"))
      }else {
        return and__3822__auto____14595
      }
    }else {
      return and__3822__auto____14594
    }
  }())) {
    return true
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IAssociative, x__451__auto____14593)
  }
};
cljs.core.sequential_QMARK_ = function sequential_QMARK_(x) {
  var x__451__auto____14596 = x;
  if(cljs.core.truth_(function() {
    var and__3822__auto____14597 = x__451__auto____14596;
    if(cljs.core.truth_(and__3822__auto____14597)) {
      var and__3822__auto____14598 = x__451__auto____14596.cljs$core$ISequential$;
      if(cljs.core.truth_(and__3822__auto____14598)) {
        return cljs.core.not.call(null, x__451__auto____14596.hasOwnProperty("cljs$core$ISequential$"))
      }else {
        return and__3822__auto____14598
      }
    }else {
      return and__3822__auto____14597
    }
  }())) {
    return true
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ISequential, x__451__auto____14596)
  }
};
cljs.core.counted_QMARK_ = function counted_QMARK_(x) {
  var x__451__auto____14599 = x;
  if(cljs.core.truth_(function() {
    var and__3822__auto____14600 = x__451__auto____14599;
    if(cljs.core.truth_(and__3822__auto____14600)) {
      var and__3822__auto____14601 = x__451__auto____14599.cljs$core$ICounted$;
      if(cljs.core.truth_(and__3822__auto____14601)) {
        return cljs.core.not.call(null, x__451__auto____14599.hasOwnProperty("cljs$core$ICounted$"))
      }else {
        return and__3822__auto____14601
      }
    }else {
      return and__3822__auto____14600
    }
  }())) {
    return true
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ICounted, x__451__auto____14599)
  }
};
cljs.core.map_QMARK_ = function map_QMARK_(x) {
  if(cljs.core.truth_(x === null)) {
    return false
  }else {
    var x__451__auto____14602 = x;
    if(cljs.core.truth_(function() {
      var and__3822__auto____14603 = x__451__auto____14602;
      if(cljs.core.truth_(and__3822__auto____14603)) {
        var and__3822__auto____14604 = x__451__auto____14602.cljs$core$IMap$;
        if(cljs.core.truth_(and__3822__auto____14604)) {
          return cljs.core.not.call(null, x__451__auto____14602.hasOwnProperty("cljs$core$IMap$"))
        }else {
          return and__3822__auto____14604
        }
      }else {
        return and__3822__auto____14603
      }
    }())) {
      return true
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IMap, x__451__auto____14602)
    }
  }
};
cljs.core.vector_QMARK_ = function vector_QMARK_(x) {
  var x__451__auto____14605 = x;
  if(cljs.core.truth_(function() {
    var and__3822__auto____14606 = x__451__auto____14605;
    if(cljs.core.truth_(and__3822__auto____14606)) {
      var and__3822__auto____14607 = x__451__auto____14605.cljs$core$IVector$;
      if(cljs.core.truth_(and__3822__auto____14607)) {
        return cljs.core.not.call(null, x__451__auto____14605.hasOwnProperty("cljs$core$IVector$"))
      }else {
        return and__3822__auto____14607
      }
    }else {
      return and__3822__auto____14606
    }
  }())) {
    return true
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IVector, x__451__auto____14605)
  }
};
cljs.core.js_obj = function js_obj() {
  return{}
};
cljs.core.js_keys = function js_keys(obj) {
  var keys__14608 = [];
  goog.object.forEach.call(null, obj, function(val, key, obj) {
    return keys__14608.push(key)
  });
  return keys__14608
};
cljs.core.js_delete = function js_delete(obj, key) {
  return delete obj[key]
};
cljs.core.lookup_sentinel = cljs.core.js_obj.call(null);
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
  if(cljs.core.truth_(s === null)) {
    return false
  }else {
    var x__451__auto____14609 = s;
    if(cljs.core.truth_(function() {
      var and__3822__auto____14610 = x__451__auto____14609;
      if(cljs.core.truth_(and__3822__auto____14610)) {
        var and__3822__auto____14611 = x__451__auto____14609.cljs$core$ISeq$;
        if(cljs.core.truth_(and__3822__auto____14611)) {
          return cljs.core.not.call(null, x__451__auto____14609.hasOwnProperty("cljs$core$ISeq$"))
        }else {
          return and__3822__auto____14611
        }
      }else {
        return and__3822__auto____14610
      }
    }())) {
      return true
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, x__451__auto____14609)
    }
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
  var and__3822__auto____14612 = goog.isString.call(null, x);
  if(cljs.core.truth_(and__3822__auto____14612)) {
    return cljs.core.not.call(null, function() {
      var or__3824__auto____14613 = cljs.core._EQ_.call(null, x.charAt(0), "\ufdd0");
      if(cljs.core.truth_(or__3824__auto____14613)) {
        return or__3824__auto____14613
      }else {
        return cljs.core._EQ_.call(null, x.charAt(0), "\ufdd1")
      }
    }())
  }else {
    return and__3822__auto____14612
  }
};
cljs.core.keyword_QMARK_ = function keyword_QMARK_(x) {
  var and__3822__auto____14614 = goog.isString.call(null, x);
  if(cljs.core.truth_(and__3822__auto____14614)) {
    return cljs.core._EQ_.call(null, x.charAt(0), "\ufdd0")
  }else {
    return and__3822__auto____14614
  }
};
cljs.core.symbol_QMARK_ = function symbol_QMARK_(x) {
  var and__3822__auto____14615 = goog.isString.call(null, x);
  if(cljs.core.truth_(and__3822__auto____14615)) {
    return cljs.core._EQ_.call(null, x.charAt(0), "\ufdd1")
  }else {
    return and__3822__auto____14615
  }
};
cljs.core.number_QMARK_ = function number_QMARK_(n) {
  return goog.isNumber.call(null, n)
};
cljs.core.fn_QMARK_ = function fn_QMARK_(f) {
  return goog.isFunction.call(null, f)
};
cljs.core.integer_QMARK_ = function integer_QMARK_(n) {
  var and__3822__auto____14616 = cljs.core.number_QMARK_.call(null, n);
  if(cljs.core.truth_(and__3822__auto____14616)) {
    return n == n.toFixed()
  }else {
    return and__3822__auto____14616
  }
};
cljs.core.contains_QMARK_ = function contains_QMARK_(coll, v) {
  if(cljs.core.truth_(cljs.core._lookup.call(null, coll, v, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel)) {
    return false
  }else {
    return true
  }
};
cljs.core.find = function find(coll, k) {
  if(cljs.core.truth_(function() {
    var and__3822__auto____14617 = coll;
    if(cljs.core.truth_(and__3822__auto____14617)) {
      var and__3822__auto____14618 = cljs.core.associative_QMARK_.call(null, coll);
      if(cljs.core.truth_(and__3822__auto____14618)) {
        return cljs.core.contains_QMARK_.call(null, coll, k)
      }else {
        return and__3822__auto____14618
      }
    }else {
      return and__3822__auto____14617
    }
  }())) {
    return cljs.core.PersistentVector.fromArray([k, cljs.core._lookup.call(null, coll, k)])
  }else {
    return null
  }
};
cljs.core.distinct_QMARK_ = function() {
  var distinct_QMARK_ = null;
  var distinct_QMARK___14623 = function(x) {
    return true
  };
  var distinct_QMARK___14624 = function(x, y) {
    return cljs.core.not.call(null, cljs.core._EQ_.call(null, x, y))
  };
  var distinct_QMARK___14625 = function() {
    var G__14627__delegate = function(x, y, more) {
      if(cljs.core.truth_(cljs.core.not.call(null, cljs.core._EQ_.call(null, x, y)))) {
        var s__14619 = cljs.core.set([y, x]);
        var xs__14620 = more;
        while(true) {
          var x__14621 = cljs.core.first.call(null, xs__14620);
          var etc__14622 = cljs.core.next.call(null, xs__14620);
          if(cljs.core.truth_(xs__14620)) {
            if(cljs.core.truth_(cljs.core.contains_QMARK_.call(null, s__14619, x__14621))) {
              return false
            }else {
              var G__14628 = cljs.core.conj.call(null, s__14619, x__14621);
              var G__14629 = etc__14622;
              s__14619 = G__14628;
              xs__14620 = G__14629;
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
    var G__14627 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__14627__delegate.call(this, x, y, more)
    };
    G__14627.cljs$lang$maxFixedArity = 2;
    G__14627.cljs$lang$applyTo = function(arglist__14630) {
      var x = cljs.core.first(arglist__14630);
      var y = cljs.core.first(cljs.core.next(arglist__14630));
      var more = cljs.core.rest(cljs.core.next(arglist__14630));
      return G__14627__delegate.call(this, x, y, more)
    };
    return G__14627
  }();
  distinct_QMARK_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return distinct_QMARK___14623.call(this, x);
      case 2:
        return distinct_QMARK___14624.call(this, x, y);
      default:
        return distinct_QMARK___14625.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  distinct_QMARK_.cljs$lang$maxFixedArity = 2;
  distinct_QMARK_.cljs$lang$applyTo = distinct_QMARK___14625.cljs$lang$applyTo;
  return distinct_QMARK_
}();
cljs.core.compare = function compare(x, y) {
  return goog.array.defaultCompare.call(null, x, y)
};
cljs.core.fn__GT_comparator = function fn__GT_comparator(f) {
  if(cljs.core.truth_(cljs.core._EQ_.call(null, f, cljs.core.compare))) {
    return cljs.core.compare
  }else {
    return function(x, y) {
      var r__14631 = f.call(null, x, y);
      if(cljs.core.truth_(cljs.core.number_QMARK_.call(null, r__14631))) {
        return r__14631
      }else {
        if(cljs.core.truth_(r__14631)) {
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
  var sort__14633 = function(coll) {
    return sort.call(null, cljs.core.compare, coll)
  };
  var sort__14634 = function(comp, coll) {
    if(cljs.core.truth_(cljs.core.seq.call(null, coll))) {
      var a__14632 = cljs.core.to_array.call(null, coll);
      goog.array.stableSort.call(null, a__14632, cljs.core.fn__GT_comparator.call(null, comp));
      return cljs.core.seq.call(null, a__14632)
    }else {
      return cljs.core.List.EMPTY
    }
  };
  sort = function(comp, coll) {
    switch(arguments.length) {
      case 1:
        return sort__14633.call(this, comp);
      case 2:
        return sort__14634.call(this, comp, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return sort
}();
cljs.core.sort_by = function() {
  var sort_by = null;
  var sort_by__14636 = function(keyfn, coll) {
    return sort_by.call(null, keyfn, cljs.core.compare, coll)
  };
  var sort_by__14637 = function(keyfn, comp, coll) {
    return cljs.core.sort.call(null, function(x, y) {
      return cljs.core.fn__GT_comparator.call(null, comp).call(null, keyfn.call(null, x), keyfn.call(null, y))
    }, coll)
  };
  sort_by = function(keyfn, comp, coll) {
    switch(arguments.length) {
      case 2:
        return sort_by__14636.call(this, keyfn, comp);
      case 3:
        return sort_by__14637.call(this, keyfn, comp, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return sort_by
}();
cljs.core.reduce = function() {
  var reduce = null;
  var reduce__14639 = function(f, coll) {
    return cljs.core._reduce.call(null, coll, f)
  };
  var reduce__14640 = function(f, val, coll) {
    return cljs.core._reduce.call(null, coll, f, val)
  };
  reduce = function(f, val, coll) {
    switch(arguments.length) {
      case 2:
        return reduce__14639.call(this, f, val);
      case 3:
        return reduce__14640.call(this, f, val, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return reduce
}();
cljs.core.seq_reduce = function() {
  var seq_reduce = null;
  var seq_reduce__14646 = function(f, coll) {
    var temp__3971__auto____14642 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3971__auto____14642)) {
      var s__14643 = temp__3971__auto____14642;
      return cljs.core.reduce.call(null, f, cljs.core.first.call(null, s__14643), cljs.core.next.call(null, s__14643))
    }else {
      return f.call(null)
    }
  };
  var seq_reduce__14647 = function(f, val, coll) {
    var val__14644 = val;
    var coll__14645 = cljs.core.seq.call(null, coll);
    while(true) {
      if(cljs.core.truth_(coll__14645)) {
        var G__14649 = f.call(null, val__14644, cljs.core.first.call(null, coll__14645));
        var G__14650 = cljs.core.next.call(null, coll__14645);
        val__14644 = G__14649;
        coll__14645 = G__14650;
        continue
      }else {
        return val__14644
      }
      break
    }
  };
  seq_reduce = function(f, val, coll) {
    switch(arguments.length) {
      case 2:
        return seq_reduce__14646.call(this, f, val);
      case 3:
        return seq_reduce__14647.call(this, f, val, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return seq_reduce
}();
cljs.core.IReduce["_"] = true;
cljs.core._reduce["_"] = function() {
  var G__14651 = null;
  var G__14651__14652 = function(coll, f) {
    return cljs.core.seq_reduce.call(null, f, coll)
  };
  var G__14651__14653 = function(coll, f, start) {
    return cljs.core.seq_reduce.call(null, f, start, coll)
  };
  G__14651 = function(coll, f, start) {
    switch(arguments.length) {
      case 2:
        return G__14651__14652.call(this, coll, f);
      case 3:
        return G__14651__14653.call(this, coll, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__14651
}();
cljs.core._PLUS_ = function() {
  var _PLUS_ = null;
  var _PLUS___14655 = function() {
    return 0
  };
  var _PLUS___14656 = function(x) {
    return x
  };
  var _PLUS___14657 = function(x, y) {
    return x + y
  };
  var _PLUS___14658 = function() {
    var G__14660__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _PLUS_, x + y, more)
    };
    var G__14660 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__14660__delegate.call(this, x, y, more)
    };
    G__14660.cljs$lang$maxFixedArity = 2;
    G__14660.cljs$lang$applyTo = function(arglist__14661) {
      var x = cljs.core.first(arglist__14661);
      var y = cljs.core.first(cljs.core.next(arglist__14661));
      var more = cljs.core.rest(cljs.core.next(arglist__14661));
      return G__14660__delegate.call(this, x, y, more)
    };
    return G__14660
  }();
  _PLUS_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 0:
        return _PLUS___14655.call(this);
      case 1:
        return _PLUS___14656.call(this, x);
      case 2:
        return _PLUS___14657.call(this, x, y);
      default:
        return _PLUS___14658.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _PLUS_.cljs$lang$maxFixedArity = 2;
  _PLUS_.cljs$lang$applyTo = _PLUS___14658.cljs$lang$applyTo;
  return _PLUS_
}();
cljs.core._ = function() {
  var _ = null;
  var ___14662 = function(x) {
    return-x
  };
  var ___14663 = function(x, y) {
    return x - y
  };
  var ___14664 = function() {
    var G__14666__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _, x - y, more)
    };
    var G__14666 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__14666__delegate.call(this, x, y, more)
    };
    G__14666.cljs$lang$maxFixedArity = 2;
    G__14666.cljs$lang$applyTo = function(arglist__14667) {
      var x = cljs.core.first(arglist__14667);
      var y = cljs.core.first(cljs.core.next(arglist__14667));
      var more = cljs.core.rest(cljs.core.next(arglist__14667));
      return G__14666__delegate.call(this, x, y, more)
    };
    return G__14666
  }();
  _ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return ___14662.call(this, x);
      case 2:
        return ___14663.call(this, x, y);
      default:
        return ___14664.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _.cljs$lang$maxFixedArity = 2;
  _.cljs$lang$applyTo = ___14664.cljs$lang$applyTo;
  return _
}();
cljs.core._STAR_ = function() {
  var _STAR_ = null;
  var _STAR___14668 = function() {
    return 1
  };
  var _STAR___14669 = function(x) {
    return x
  };
  var _STAR___14670 = function(x, y) {
    return x * y
  };
  var _STAR___14671 = function() {
    var G__14673__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _STAR_, x * y, more)
    };
    var G__14673 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__14673__delegate.call(this, x, y, more)
    };
    G__14673.cljs$lang$maxFixedArity = 2;
    G__14673.cljs$lang$applyTo = function(arglist__14674) {
      var x = cljs.core.first(arglist__14674);
      var y = cljs.core.first(cljs.core.next(arglist__14674));
      var more = cljs.core.rest(cljs.core.next(arglist__14674));
      return G__14673__delegate.call(this, x, y, more)
    };
    return G__14673
  }();
  _STAR_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 0:
        return _STAR___14668.call(this);
      case 1:
        return _STAR___14669.call(this, x);
      case 2:
        return _STAR___14670.call(this, x, y);
      default:
        return _STAR___14671.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _STAR_.cljs$lang$maxFixedArity = 2;
  _STAR_.cljs$lang$applyTo = _STAR___14671.cljs$lang$applyTo;
  return _STAR_
}();
cljs.core._SLASH_ = function() {
  var _SLASH_ = null;
  var _SLASH___14675 = function(x) {
    return _SLASH_.call(null, 1, x)
  };
  var _SLASH___14676 = function(x, y) {
    return x / y
  };
  var _SLASH___14677 = function() {
    var G__14679__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _SLASH_, _SLASH_.call(null, x, y), more)
    };
    var G__14679 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__14679__delegate.call(this, x, y, more)
    };
    G__14679.cljs$lang$maxFixedArity = 2;
    G__14679.cljs$lang$applyTo = function(arglist__14680) {
      var x = cljs.core.first(arglist__14680);
      var y = cljs.core.first(cljs.core.next(arglist__14680));
      var more = cljs.core.rest(cljs.core.next(arglist__14680));
      return G__14679__delegate.call(this, x, y, more)
    };
    return G__14679
  }();
  _SLASH_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _SLASH___14675.call(this, x);
      case 2:
        return _SLASH___14676.call(this, x, y);
      default:
        return _SLASH___14677.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _SLASH_.cljs$lang$maxFixedArity = 2;
  _SLASH_.cljs$lang$applyTo = _SLASH___14677.cljs$lang$applyTo;
  return _SLASH_
}();
cljs.core._LT_ = function() {
  var _LT_ = null;
  var _LT___14681 = function(x) {
    return true
  };
  var _LT___14682 = function(x, y) {
    return x < y
  };
  var _LT___14683 = function() {
    var G__14685__delegate = function(x, y, more) {
      while(true) {
        if(cljs.core.truth_(x < y)) {
          if(cljs.core.truth_(cljs.core.next.call(null, more))) {
            var G__14686 = y;
            var G__14687 = cljs.core.first.call(null, more);
            var G__14688 = cljs.core.next.call(null, more);
            x = G__14686;
            y = G__14687;
            more = G__14688;
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
    var G__14685 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__14685__delegate.call(this, x, y, more)
    };
    G__14685.cljs$lang$maxFixedArity = 2;
    G__14685.cljs$lang$applyTo = function(arglist__14689) {
      var x = cljs.core.first(arglist__14689);
      var y = cljs.core.first(cljs.core.next(arglist__14689));
      var more = cljs.core.rest(cljs.core.next(arglist__14689));
      return G__14685__delegate.call(this, x, y, more)
    };
    return G__14685
  }();
  _LT_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _LT___14681.call(this, x);
      case 2:
        return _LT___14682.call(this, x, y);
      default:
        return _LT___14683.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _LT_.cljs$lang$maxFixedArity = 2;
  _LT_.cljs$lang$applyTo = _LT___14683.cljs$lang$applyTo;
  return _LT_
}();
cljs.core._LT__EQ_ = function() {
  var _LT__EQ_ = null;
  var _LT__EQ___14690 = function(x) {
    return true
  };
  var _LT__EQ___14691 = function(x, y) {
    return x <= y
  };
  var _LT__EQ___14692 = function() {
    var G__14694__delegate = function(x, y, more) {
      while(true) {
        if(cljs.core.truth_(x <= y)) {
          if(cljs.core.truth_(cljs.core.next.call(null, more))) {
            var G__14695 = y;
            var G__14696 = cljs.core.first.call(null, more);
            var G__14697 = cljs.core.next.call(null, more);
            x = G__14695;
            y = G__14696;
            more = G__14697;
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
    var G__14694 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__14694__delegate.call(this, x, y, more)
    };
    G__14694.cljs$lang$maxFixedArity = 2;
    G__14694.cljs$lang$applyTo = function(arglist__14698) {
      var x = cljs.core.first(arglist__14698);
      var y = cljs.core.first(cljs.core.next(arglist__14698));
      var more = cljs.core.rest(cljs.core.next(arglist__14698));
      return G__14694__delegate.call(this, x, y, more)
    };
    return G__14694
  }();
  _LT__EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _LT__EQ___14690.call(this, x);
      case 2:
        return _LT__EQ___14691.call(this, x, y);
      default:
        return _LT__EQ___14692.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _LT__EQ_.cljs$lang$maxFixedArity = 2;
  _LT__EQ_.cljs$lang$applyTo = _LT__EQ___14692.cljs$lang$applyTo;
  return _LT__EQ_
}();
cljs.core._GT_ = function() {
  var _GT_ = null;
  var _GT___14699 = function(x) {
    return true
  };
  var _GT___14700 = function(x, y) {
    return x > y
  };
  var _GT___14701 = function() {
    var G__14703__delegate = function(x, y, more) {
      while(true) {
        if(cljs.core.truth_(x > y)) {
          if(cljs.core.truth_(cljs.core.next.call(null, more))) {
            var G__14704 = y;
            var G__14705 = cljs.core.first.call(null, more);
            var G__14706 = cljs.core.next.call(null, more);
            x = G__14704;
            y = G__14705;
            more = G__14706;
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
    var G__14703 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__14703__delegate.call(this, x, y, more)
    };
    G__14703.cljs$lang$maxFixedArity = 2;
    G__14703.cljs$lang$applyTo = function(arglist__14707) {
      var x = cljs.core.first(arglist__14707);
      var y = cljs.core.first(cljs.core.next(arglist__14707));
      var more = cljs.core.rest(cljs.core.next(arglist__14707));
      return G__14703__delegate.call(this, x, y, more)
    };
    return G__14703
  }();
  _GT_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _GT___14699.call(this, x);
      case 2:
        return _GT___14700.call(this, x, y);
      default:
        return _GT___14701.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _GT_.cljs$lang$maxFixedArity = 2;
  _GT_.cljs$lang$applyTo = _GT___14701.cljs$lang$applyTo;
  return _GT_
}();
cljs.core._GT__EQ_ = function() {
  var _GT__EQ_ = null;
  var _GT__EQ___14708 = function(x) {
    return true
  };
  var _GT__EQ___14709 = function(x, y) {
    return x >= y
  };
  var _GT__EQ___14710 = function() {
    var G__14712__delegate = function(x, y, more) {
      while(true) {
        if(cljs.core.truth_(x >= y)) {
          if(cljs.core.truth_(cljs.core.next.call(null, more))) {
            var G__14713 = y;
            var G__14714 = cljs.core.first.call(null, more);
            var G__14715 = cljs.core.next.call(null, more);
            x = G__14713;
            y = G__14714;
            more = G__14715;
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
    var G__14712 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__14712__delegate.call(this, x, y, more)
    };
    G__14712.cljs$lang$maxFixedArity = 2;
    G__14712.cljs$lang$applyTo = function(arglist__14716) {
      var x = cljs.core.first(arglist__14716);
      var y = cljs.core.first(cljs.core.next(arglist__14716));
      var more = cljs.core.rest(cljs.core.next(arglist__14716));
      return G__14712__delegate.call(this, x, y, more)
    };
    return G__14712
  }();
  _GT__EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _GT__EQ___14708.call(this, x);
      case 2:
        return _GT__EQ___14709.call(this, x, y);
      default:
        return _GT__EQ___14710.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _GT__EQ_.cljs$lang$maxFixedArity = 2;
  _GT__EQ_.cljs$lang$applyTo = _GT__EQ___14710.cljs$lang$applyTo;
  return _GT__EQ_
}();
cljs.core.dec = function dec(x) {
  return x - 1
};
cljs.core.max = function() {
  var max = null;
  var max__14717 = function(x) {
    return x
  };
  var max__14718 = function(x, y) {
    return x > y ? x : y
  };
  var max__14719 = function() {
    var G__14721__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, max, x > y ? x : y, more)
    };
    var G__14721 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__14721__delegate.call(this, x, y, more)
    };
    G__14721.cljs$lang$maxFixedArity = 2;
    G__14721.cljs$lang$applyTo = function(arglist__14722) {
      var x = cljs.core.first(arglist__14722);
      var y = cljs.core.first(cljs.core.next(arglist__14722));
      var more = cljs.core.rest(cljs.core.next(arglist__14722));
      return G__14721__delegate.call(this, x, y, more)
    };
    return G__14721
  }();
  max = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return max__14717.call(this, x);
      case 2:
        return max__14718.call(this, x, y);
      default:
        return max__14719.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  max.cljs$lang$maxFixedArity = 2;
  max.cljs$lang$applyTo = max__14719.cljs$lang$applyTo;
  return max
}();
cljs.core.min = function() {
  var min = null;
  var min__14723 = function(x) {
    return x
  };
  var min__14724 = function(x, y) {
    return x < y ? x : y
  };
  var min__14725 = function() {
    var G__14727__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, min, x < y ? x : y, more)
    };
    var G__14727 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__14727__delegate.call(this, x, y, more)
    };
    G__14727.cljs$lang$maxFixedArity = 2;
    G__14727.cljs$lang$applyTo = function(arglist__14728) {
      var x = cljs.core.first(arglist__14728);
      var y = cljs.core.first(cljs.core.next(arglist__14728));
      var more = cljs.core.rest(cljs.core.next(arglist__14728));
      return G__14727__delegate.call(this, x, y, more)
    };
    return G__14727
  }();
  min = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return min__14723.call(this, x);
      case 2:
        return min__14724.call(this, x, y);
      default:
        return min__14725.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  min.cljs$lang$maxFixedArity = 2;
  min.cljs$lang$applyTo = min__14725.cljs$lang$applyTo;
  return min
}();
cljs.core.fix = function fix(q) {
  if(cljs.core.truth_(q >= 0)) {
    return Math.floor.call(null, q)
  }else {
    return Math.ceil.call(null, q)
  }
};
cljs.core.mod = function mod(n, d) {
  return n % d
};
cljs.core.quot = function quot(n, d) {
  var rem__14729 = n % d;
  return cljs.core.fix.call(null, (n - rem__14729) / d)
};
cljs.core.rem = function rem(n, d) {
  var q__14730 = cljs.core.quot.call(null, n, d);
  return n - d * q__14730
};
cljs.core.rand = function() {
  var rand = null;
  var rand__14731 = function() {
    return Math.random.call(null)
  };
  var rand__14732 = function(n) {
    return n * rand.call(null)
  };
  rand = function(n) {
    switch(arguments.length) {
      case 0:
        return rand__14731.call(this);
      case 1:
        return rand__14732.call(this, n)
    }
    throw"Invalid arity: " + arguments.length;
  };
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
cljs.core._EQ__EQ_ = function() {
  var _EQ__EQ_ = null;
  var _EQ__EQ___14734 = function(x) {
    return true
  };
  var _EQ__EQ___14735 = function(x, y) {
    return cljs.core._equiv.call(null, x, y)
  };
  var _EQ__EQ___14736 = function() {
    var G__14738__delegate = function(x, y, more) {
      while(true) {
        if(cljs.core.truth_(_EQ__EQ_.call(null, x, y))) {
          if(cljs.core.truth_(cljs.core.next.call(null, more))) {
            var G__14739 = y;
            var G__14740 = cljs.core.first.call(null, more);
            var G__14741 = cljs.core.next.call(null, more);
            x = G__14739;
            y = G__14740;
            more = G__14741;
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
    var G__14738 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__14738__delegate.call(this, x, y, more)
    };
    G__14738.cljs$lang$maxFixedArity = 2;
    G__14738.cljs$lang$applyTo = function(arglist__14742) {
      var x = cljs.core.first(arglist__14742);
      var y = cljs.core.first(cljs.core.next(arglist__14742));
      var more = cljs.core.rest(cljs.core.next(arglist__14742));
      return G__14738__delegate.call(this, x, y, more)
    };
    return G__14738
  }();
  _EQ__EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _EQ__EQ___14734.call(this, x);
      case 2:
        return _EQ__EQ___14735.call(this, x, y);
      default:
        return _EQ__EQ___14736.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _EQ__EQ_.cljs$lang$maxFixedArity = 2;
  _EQ__EQ_.cljs$lang$applyTo = _EQ__EQ___14736.cljs$lang$applyTo;
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
  var n__14743 = n;
  var xs__14744 = cljs.core.seq.call(null, coll);
  while(true) {
    if(cljs.core.truth_(function() {
      var and__3822__auto____14745 = xs__14744;
      if(cljs.core.truth_(and__3822__auto____14745)) {
        return n__14743 > 0
      }else {
        return and__3822__auto____14745
      }
    }())) {
      var G__14746 = n__14743 - 1;
      var G__14747 = cljs.core.next.call(null, xs__14744);
      n__14743 = G__14746;
      xs__14744 = G__14747;
      continue
    }else {
      return xs__14744
    }
    break
  }
};
cljs.core.IIndexed["_"] = true;
cljs.core._nth["_"] = function() {
  var G__14752 = null;
  var G__14752__14753 = function(coll, n) {
    var temp__3971__auto____14748 = cljs.core.nthnext.call(null, coll, n);
    if(cljs.core.truth_(temp__3971__auto____14748)) {
      var xs__14749 = temp__3971__auto____14748;
      return cljs.core.first.call(null, xs__14749)
    }else {
      throw new Error("Index out of bounds");
    }
  };
  var G__14752__14754 = function(coll, n, not_found) {
    var temp__3971__auto____14750 = cljs.core.nthnext.call(null, coll, n);
    if(cljs.core.truth_(temp__3971__auto____14750)) {
      var xs__14751 = temp__3971__auto____14750;
      return cljs.core.first.call(null, xs__14751)
    }else {
      return not_found
    }
  };
  G__14752 = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__14752__14753.call(this, coll, n);
      case 3:
        return G__14752__14754.call(this, coll, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__14752
}();
cljs.core.str_STAR_ = function() {
  var str_STAR_ = null;
  var str_STAR___14756 = function() {
    return""
  };
  var str_STAR___14757 = function(x) {
    if(cljs.core.truth_(x === null)) {
      return""
    }else {
      if(cljs.core.truth_("\ufdd0'else")) {
        return x.toString()
      }else {
        return null
      }
    }
  };
  var str_STAR___14758 = function() {
    var G__14760__delegate = function(x, ys) {
      return function(sb, more) {
        while(true) {
          if(cljs.core.truth_(more)) {
            var G__14761 = sb.append(str_STAR_.call(null, cljs.core.first.call(null, more)));
            var G__14762 = cljs.core.next.call(null, more);
            sb = G__14761;
            more = G__14762;
            continue
          }else {
            return str_STAR_.call(null, sb)
          }
          break
        }
      }.call(null, new goog.string.StringBuffer(str_STAR_.call(null, x)), ys)
    };
    var G__14760 = function(x, var_args) {
      var ys = null;
      if(goog.isDef(var_args)) {
        ys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__14760__delegate.call(this, x, ys)
    };
    G__14760.cljs$lang$maxFixedArity = 1;
    G__14760.cljs$lang$applyTo = function(arglist__14763) {
      var x = cljs.core.first(arglist__14763);
      var ys = cljs.core.rest(arglist__14763);
      return G__14760__delegate.call(this, x, ys)
    };
    return G__14760
  }();
  str_STAR_ = function(x, var_args) {
    var ys = var_args;
    switch(arguments.length) {
      case 0:
        return str_STAR___14756.call(this);
      case 1:
        return str_STAR___14757.call(this, x);
      default:
        return str_STAR___14758.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  str_STAR_.cljs$lang$maxFixedArity = 1;
  str_STAR_.cljs$lang$applyTo = str_STAR___14758.cljs$lang$applyTo;
  return str_STAR_
}();
cljs.core.str = function() {
  var str = null;
  var str__14764 = function() {
    return""
  };
  var str__14765 = function(x) {
    if(cljs.core.truth_(cljs.core.symbol_QMARK_.call(null, x))) {
      return x.substring(2, x.length)
    }else {
      if(cljs.core.truth_(cljs.core.keyword_QMARK_.call(null, x))) {
        return cljs.core.str_STAR_.call(null, ":", x.substring(2, x.length))
      }else {
        if(cljs.core.truth_(x === null)) {
          return""
        }else {
          if(cljs.core.truth_("\ufdd0'else")) {
            return x.toString()
          }else {
            return null
          }
        }
      }
    }
  };
  var str__14766 = function() {
    var G__14768__delegate = function(x, ys) {
      return function(sb, more) {
        while(true) {
          if(cljs.core.truth_(more)) {
            var G__14769 = sb.append(str.call(null, cljs.core.first.call(null, more)));
            var G__14770 = cljs.core.next.call(null, more);
            sb = G__14769;
            more = G__14770;
            continue
          }else {
            return cljs.core.str_STAR_.call(null, sb)
          }
          break
        }
      }.call(null, new goog.string.StringBuffer(str.call(null, x)), ys)
    };
    var G__14768 = function(x, var_args) {
      var ys = null;
      if(goog.isDef(var_args)) {
        ys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__14768__delegate.call(this, x, ys)
    };
    G__14768.cljs$lang$maxFixedArity = 1;
    G__14768.cljs$lang$applyTo = function(arglist__14771) {
      var x = cljs.core.first(arglist__14771);
      var ys = cljs.core.rest(arglist__14771);
      return G__14768__delegate.call(this, x, ys)
    };
    return G__14768
  }();
  str = function(x, var_args) {
    var ys = var_args;
    switch(arguments.length) {
      case 0:
        return str__14764.call(this);
      case 1:
        return str__14765.call(this, x);
      default:
        return str__14766.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  str.cljs$lang$maxFixedArity = 1;
  str.cljs$lang$applyTo = str__14766.cljs$lang$applyTo;
  return str
}();
cljs.core.subs = function() {
  var subs = null;
  var subs__14772 = function(s, start) {
    return s.substring(start)
  };
  var subs__14773 = function(s, start, end) {
    return s.substring(start, end)
  };
  subs = function(s, start, end) {
    switch(arguments.length) {
      case 2:
        return subs__14772.call(this, s, start);
      case 3:
        return subs__14773.call(this, s, start, end)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return subs
}();
cljs.core.symbol = function() {
  var symbol = null;
  var symbol__14775 = function(name) {
    if(cljs.core.truth_(cljs.core.symbol_QMARK_.call(null, name))) {
      name
    }else {
      if(cljs.core.truth_(cljs.core.keyword_QMARK_.call(null, name))) {
        cljs.core.str_STAR_.call(null, "\ufdd1", "'", cljs.core.subs.call(null, name, 2))
      }else {
      }
    }
    return cljs.core.str_STAR_.call(null, "\ufdd1", "'", name)
  };
  var symbol__14776 = function(ns, name) {
    return symbol.call(null, cljs.core.str_STAR_.call(null, ns, "/", name))
  };
  symbol = function(ns, name) {
    switch(arguments.length) {
      case 1:
        return symbol__14775.call(this, ns);
      case 2:
        return symbol__14776.call(this, ns, name)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return symbol
}();
cljs.core.keyword = function() {
  var keyword = null;
  var keyword__14778 = function(name) {
    if(cljs.core.truth_(cljs.core.keyword_QMARK_.call(null, name))) {
      return name
    }else {
      if(cljs.core.truth_(cljs.core.symbol_QMARK_.call(null, name))) {
        return cljs.core.str_STAR_.call(null, "\ufdd0", "'", cljs.core.subs.call(null, name, 2))
      }else {
        if(cljs.core.truth_("\ufdd0'else")) {
          return cljs.core.str_STAR_.call(null, "\ufdd0", "'", name)
        }else {
          return null
        }
      }
    }
  };
  var keyword__14779 = function(ns, name) {
    return keyword.call(null, cljs.core.str_STAR_.call(null, ns, "/", name))
  };
  keyword = function(ns, name) {
    switch(arguments.length) {
      case 1:
        return keyword__14778.call(this, ns);
      case 2:
        return keyword__14779.call(this, ns, name)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return keyword
}();
cljs.core.equiv_sequential = function equiv_sequential(x, y) {
  return cljs.core.boolean$.call(null, cljs.core.truth_(cljs.core.sequential_QMARK_.call(null, y)) ? function() {
    var xs__14781 = cljs.core.seq.call(null, x);
    var ys__14782 = cljs.core.seq.call(null, y);
    while(true) {
      if(cljs.core.truth_(xs__14781 === null)) {
        return ys__14782 === null
      }else {
        if(cljs.core.truth_(ys__14782 === null)) {
          return false
        }else {
          if(cljs.core.truth_(cljs.core._EQ_.call(null, cljs.core.first.call(null, xs__14781), cljs.core.first.call(null, ys__14782)))) {
            var G__14783 = cljs.core.next.call(null, xs__14781);
            var G__14784 = cljs.core.next.call(null, ys__14782);
            xs__14781 = G__14783;
            ys__14782 = G__14784;
            continue
          }else {
            if(cljs.core.truth_("\ufdd0'else")) {
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
  return cljs.core.reduce.call(null, function(p1__14785_SHARP_, p2__14786_SHARP_) {
    return cljs.core.hash_combine.call(null, p1__14785_SHARP_, cljs.core.hash.call(null, p2__14786_SHARP_))
  }, cljs.core.hash.call(null, cljs.core.first.call(null, coll)), cljs.core.next.call(null, coll))
};
cljs.core.extend_object_BANG_ = function extend_object_BANG_(obj, fn_map) {
  var G__14787__14788 = cljs.core.seq.call(null, fn_map);
  if(cljs.core.truth_(G__14787__14788)) {
    var G__14790__14792 = cljs.core.first.call(null, G__14787__14788);
    var vec__14791__14793 = G__14790__14792;
    var key_name__14794 = cljs.core.nth.call(null, vec__14791__14793, 0, null);
    var f__14795 = cljs.core.nth.call(null, vec__14791__14793, 1, null);
    var G__14787__14796 = G__14787__14788;
    var G__14790__14797 = G__14790__14792;
    var G__14787__14798 = G__14787__14796;
    while(true) {
      var vec__14799__14800 = G__14790__14797;
      var key_name__14801 = cljs.core.nth.call(null, vec__14799__14800, 0, null);
      var f__14802 = cljs.core.nth.call(null, vec__14799__14800, 1, null);
      var G__14787__14803 = G__14787__14798;
      var str_name__14804 = cljs.core.name.call(null, key_name__14801);
      obj[str_name__14804] = f__14802;
      var temp__3974__auto____14805 = cljs.core.next.call(null, G__14787__14803);
      if(cljs.core.truth_(temp__3974__auto____14805)) {
        var G__14787__14806 = temp__3974__auto____14805;
        var G__14807 = cljs.core.first.call(null, G__14787__14806);
        var G__14808 = G__14787__14806;
        G__14790__14797 = G__14807;
        G__14787__14798 = G__14808;
        continue
      }else {
      }
      break
    }
  }else {
  }
  return obj
};
cljs.core.List = function(meta, first, rest, count) {
  this.meta = meta;
  this.first = first;
  this.rest = rest;
  this.count = count
};
cljs.core.List.cljs$core$IPrintable$_pr_seq = function(this__367__auto__) {
  return cljs.core.list.call(null, "cljs.core.List")
};
cljs.core.List.prototype.cljs$core$IHash$ = true;
cljs.core.List.prototype.cljs$core$IHash$_hash = function(coll) {
  var this__14809 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.List.prototype.cljs$core$ISequential$ = true;
cljs.core.List.prototype.cljs$core$ICollection$ = true;
cljs.core.List.prototype.cljs$core$ICollection$_conj = function(coll, o) {
  var this__14810 = this;
  return new cljs.core.List(this__14810.meta, o, coll, this__14810.count + 1)
};
cljs.core.List.prototype.cljs$core$ISeqable$ = true;
cljs.core.List.prototype.cljs$core$ISeqable$_seq = function(coll) {
  var this__14811 = this;
  return coll
};
cljs.core.List.prototype.cljs$core$ICounted$ = true;
cljs.core.List.prototype.cljs$core$ICounted$_count = function(coll) {
  var this__14812 = this;
  return this__14812.count
};
cljs.core.List.prototype.cljs$core$IStack$ = true;
cljs.core.List.prototype.cljs$core$IStack$_peek = function(coll) {
  var this__14813 = this;
  return this__14813.first
};
cljs.core.List.prototype.cljs$core$IStack$_pop = function(coll) {
  var this__14814 = this;
  return cljs.core._rest.call(null, coll)
};
cljs.core.List.prototype.cljs$core$ISeq$ = true;
cljs.core.List.prototype.cljs$core$ISeq$_first = function(coll) {
  var this__14815 = this;
  return this__14815.first
};
cljs.core.List.prototype.cljs$core$ISeq$_rest = function(coll) {
  var this__14816 = this;
  return this__14816.rest
};
cljs.core.List.prototype.cljs$core$IEquiv$ = true;
cljs.core.List.prototype.cljs$core$IEquiv$_equiv = function(coll, other) {
  var this__14817 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.List.prototype.cljs$core$IWithMeta$ = true;
cljs.core.List.prototype.cljs$core$IWithMeta$_with_meta = function(coll, meta) {
  var this__14818 = this;
  return new cljs.core.List(meta, this__14818.first, this__14818.rest, this__14818.count)
};
cljs.core.List.prototype.cljs$core$IMeta$ = true;
cljs.core.List.prototype.cljs$core$IMeta$_meta = function(coll) {
  var this__14819 = this;
  return this__14819.meta
};
cljs.core.List.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.List.prototype.cljs$core$IEmptyableCollection$_empty = function(coll) {
  var this__14820 = this;
  return cljs.core.List.EMPTY
};
cljs.core.List;
cljs.core.EmptyList = function(meta) {
  this.meta = meta
};
cljs.core.EmptyList.cljs$core$IPrintable$_pr_seq = function(this__367__auto__) {
  return cljs.core.list.call(null, "cljs.core.EmptyList")
};
cljs.core.EmptyList.prototype.cljs$core$IHash$ = true;
cljs.core.EmptyList.prototype.cljs$core$IHash$_hash = function(coll) {
  var this__14821 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.EmptyList.prototype.cljs$core$ISequential$ = true;
cljs.core.EmptyList.prototype.cljs$core$ICollection$ = true;
cljs.core.EmptyList.prototype.cljs$core$ICollection$_conj = function(coll, o) {
  var this__14822 = this;
  return new cljs.core.List(this__14822.meta, o, null, 1)
};
cljs.core.EmptyList.prototype.cljs$core$ISeqable$ = true;
cljs.core.EmptyList.prototype.cljs$core$ISeqable$_seq = function(coll) {
  var this__14823 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ICounted$ = true;
cljs.core.EmptyList.prototype.cljs$core$ICounted$_count = function(coll) {
  var this__14824 = this;
  return 0
};
cljs.core.EmptyList.prototype.cljs$core$IStack$ = true;
cljs.core.EmptyList.prototype.cljs$core$IStack$_peek = function(coll) {
  var this__14825 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$IStack$_pop = function(coll) {
  var this__14826 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ISeq$ = true;
cljs.core.EmptyList.prototype.cljs$core$ISeq$_first = function(coll) {
  var this__14827 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ISeq$_rest = function(coll) {
  var this__14828 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$IEquiv$ = true;
cljs.core.EmptyList.prototype.cljs$core$IEquiv$_equiv = function(coll, other) {
  var this__14829 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.EmptyList.prototype.cljs$core$IWithMeta$ = true;
cljs.core.EmptyList.prototype.cljs$core$IWithMeta$_with_meta = function(coll, meta) {
  var this__14830 = this;
  return new cljs.core.EmptyList(meta)
};
cljs.core.EmptyList.prototype.cljs$core$IMeta$ = true;
cljs.core.EmptyList.prototype.cljs$core$IMeta$_meta = function(coll) {
  var this__14831 = this;
  return this__14831.meta
};
cljs.core.EmptyList.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.EmptyList.prototype.cljs$core$IEmptyableCollection$_empty = function(coll) {
  var this__14832 = this;
  return coll
};
cljs.core.EmptyList;
cljs.core.List.EMPTY = new cljs.core.EmptyList(null);
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
  list.cljs$lang$applyTo = function(arglist__14833) {
    var items = cljs.core.seq(arglist__14833);
    return list__delegate.call(this, items)
  };
  return list
}();
cljs.core.Cons = function(meta, first, rest) {
  this.meta = meta;
  this.first = first;
  this.rest = rest
};
cljs.core.Cons.cljs$core$IPrintable$_pr_seq = function(this__367__auto__) {
  return cljs.core.list.call(null, "cljs.core.Cons")
};
cljs.core.Cons.prototype.cljs$core$ISeqable$ = true;
cljs.core.Cons.prototype.cljs$core$ISeqable$_seq = function(coll) {
  var this__14834 = this;
  return coll
};
cljs.core.Cons.prototype.cljs$core$IHash$ = true;
cljs.core.Cons.prototype.cljs$core$IHash$_hash = function(coll) {
  var this__14835 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.Cons.prototype.cljs$core$IEquiv$ = true;
cljs.core.Cons.prototype.cljs$core$IEquiv$_equiv = function(coll, other) {
  var this__14836 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Cons.prototype.cljs$core$ISequential$ = true;
cljs.core.Cons.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.Cons.prototype.cljs$core$IEmptyableCollection$_empty = function(coll) {
  var this__14837 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__14837.meta)
};
cljs.core.Cons.prototype.cljs$core$ICollection$ = true;
cljs.core.Cons.prototype.cljs$core$ICollection$_conj = function(coll, o) {
  var this__14838 = this;
  return new cljs.core.Cons(null, o, coll)
};
cljs.core.Cons.prototype.cljs$core$ISeq$ = true;
cljs.core.Cons.prototype.cljs$core$ISeq$_first = function(coll) {
  var this__14839 = this;
  return this__14839.first
};
cljs.core.Cons.prototype.cljs$core$ISeq$_rest = function(coll) {
  var this__14840 = this;
  if(cljs.core.truth_(this__14840.rest === null)) {
    return cljs.core.List.EMPTY
  }else {
    return this__14840.rest
  }
};
cljs.core.Cons.prototype.cljs$core$IMeta$ = true;
cljs.core.Cons.prototype.cljs$core$IMeta$_meta = function(coll) {
  var this__14841 = this;
  return this__14841.meta
};
cljs.core.Cons.prototype.cljs$core$IWithMeta$ = true;
cljs.core.Cons.prototype.cljs$core$IWithMeta$_with_meta = function(coll, meta) {
  var this__14842 = this;
  return new cljs.core.Cons(meta, this__14842.first, this__14842.rest)
};
cljs.core.Cons;
cljs.core.cons = function cons(x, seq) {
  return new cljs.core.Cons(null, x, seq)
};
cljs.core.IReduce["string"] = true;
cljs.core._reduce["string"] = function() {
  var G__14843 = null;
  var G__14843__14844 = function(string, f) {
    return cljs.core.ci_reduce.call(null, string, f)
  };
  var G__14843__14845 = function(string, f, start) {
    return cljs.core.ci_reduce.call(null, string, f, start)
  };
  G__14843 = function(string, f, start) {
    switch(arguments.length) {
      case 2:
        return G__14843__14844.call(this, string, f);
      case 3:
        return G__14843__14845.call(this, string, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__14843
}();
cljs.core.ILookup["string"] = true;
cljs.core._lookup["string"] = function() {
  var G__14847 = null;
  var G__14847__14848 = function(string, k) {
    return cljs.core._nth.call(null, string, k)
  };
  var G__14847__14849 = function(string, k, not_found) {
    return cljs.core._nth.call(null, string, k, not_found)
  };
  G__14847 = function(string, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__14847__14848.call(this, string, k);
      case 3:
        return G__14847__14849.call(this, string, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__14847
}();
cljs.core.IIndexed["string"] = true;
cljs.core._nth["string"] = function() {
  var G__14851 = null;
  var G__14851__14852 = function(string, n) {
    if(cljs.core.truth_(n < cljs.core._count.call(null, string))) {
      return string.charAt(n)
    }else {
      return null
    }
  };
  var G__14851__14853 = function(string, n, not_found) {
    if(cljs.core.truth_(n < cljs.core._count.call(null, string))) {
      return string.charAt(n)
    }else {
      return not_found
    }
  };
  G__14851 = function(string, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__14851__14852.call(this, string, n);
      case 3:
        return G__14851__14853.call(this, string, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__14851
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
  var G__14861 = null;
  var G__14861__14862 = function(tsym14855, coll) {
    var tsym14855__14857 = this;
    var this$__14858 = tsym14855__14857;
    return cljs.core.get.call(null, coll, this$__14858.toString())
  };
  var G__14861__14863 = function(tsym14856, coll, not_found) {
    var tsym14856__14859 = this;
    var this$__14860 = tsym14856__14859;
    return cljs.core.get.call(null, coll, this$__14860.toString(), not_found)
  };
  G__14861 = function(tsym14856, coll, not_found) {
    switch(arguments.length) {
      case 2:
        return G__14861__14862.call(this, tsym14856, coll);
      case 3:
        return G__14861__14863.call(this, tsym14856, coll, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__14861
}();
String["prototype"]["apply"] = function(s, args) {
  if(cljs.core.truth_(cljs.core.count.call(null, args) < 2)) {
    return cljs.core.get.call(null, args[0], s)
  }else {
    return cljs.core.get.call(null, args[0], s, args[1])
  }
};
cljs.core.lazy_seq_value = function lazy_seq_value(lazy_seq) {
  var x__14865 = lazy_seq.x;
  if(cljs.core.truth_(lazy_seq.realized)) {
    return x__14865
  }else {
    lazy_seq.x = x__14865.call(null);
    lazy_seq.realized = true;
    return lazy_seq.x
  }
};
cljs.core.LazySeq = function(meta, realized, x) {
  this.meta = meta;
  this.realized = realized;
  this.x = x
};
cljs.core.LazySeq.cljs$core$IPrintable$_pr_seq = function(this__367__auto__) {
  return cljs.core.list.call(null, "cljs.core.LazySeq")
};
cljs.core.LazySeq.prototype.cljs$core$ISeqable$ = true;
cljs.core.LazySeq.prototype.cljs$core$ISeqable$_seq = function(coll) {
  var this__14866 = this;
  return cljs.core.seq.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$IHash$ = true;
cljs.core.LazySeq.prototype.cljs$core$IHash$_hash = function(coll) {
  var this__14867 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.LazySeq.prototype.cljs$core$IEquiv$ = true;
cljs.core.LazySeq.prototype.cljs$core$IEquiv$_equiv = function(coll, other) {
  var this__14868 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.LazySeq.prototype.cljs$core$ISequential$ = true;
cljs.core.LazySeq.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.LazySeq.prototype.cljs$core$IEmptyableCollection$_empty = function(coll) {
  var this__14869 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__14869.meta)
};
cljs.core.LazySeq.prototype.cljs$core$ICollection$ = true;
cljs.core.LazySeq.prototype.cljs$core$ICollection$_conj = function(coll, o) {
  var this__14870 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.LazySeq.prototype.cljs$core$ISeq$ = true;
cljs.core.LazySeq.prototype.cljs$core$ISeq$_first = function(coll) {
  var this__14871 = this;
  return cljs.core.first.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$ISeq$_rest = function(coll) {
  var this__14872 = this;
  return cljs.core.rest.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$IMeta$ = true;
cljs.core.LazySeq.prototype.cljs$core$IMeta$_meta = function(coll) {
  var this__14873 = this;
  return this__14873.meta
};
cljs.core.LazySeq.prototype.cljs$core$IWithMeta$ = true;
cljs.core.LazySeq.prototype.cljs$core$IWithMeta$_with_meta = function(coll, meta) {
  var this__14874 = this;
  return new cljs.core.LazySeq(meta, this__14874.realized, this__14874.x)
};
cljs.core.LazySeq;
cljs.core.to_array = function to_array(s) {
  var ary__14875 = [];
  var s__14876 = s;
  while(true) {
    if(cljs.core.truth_(cljs.core.seq.call(null, s__14876))) {
      ary__14875.push(cljs.core.first.call(null, s__14876));
      var G__14877 = cljs.core.next.call(null, s__14876);
      s__14876 = G__14877;
      continue
    }else {
      return ary__14875
    }
    break
  }
};
cljs.core.bounded_count = function bounded_count(s, n) {
  var s__14878 = s;
  var i__14879 = n;
  var sum__14880 = 0;
  while(true) {
    if(cljs.core.truth_(function() {
      var and__3822__auto____14881 = i__14879 > 0;
      if(cljs.core.truth_(and__3822__auto____14881)) {
        return cljs.core.seq.call(null, s__14878)
      }else {
        return and__3822__auto____14881
      }
    }())) {
      var G__14882 = cljs.core.next.call(null, s__14878);
      var G__14883 = i__14879 - 1;
      var G__14884 = sum__14880 + 1;
      s__14878 = G__14882;
      i__14879 = G__14883;
      sum__14880 = G__14884;
      continue
    }else {
      return sum__14880
    }
    break
  }
};
cljs.core.spread = function spread(arglist) {
  if(cljs.core.truth_(arglist === null)) {
    return null
  }else {
    if(cljs.core.truth_(cljs.core.next.call(null, arglist) === null)) {
      return cljs.core.seq.call(null, cljs.core.first.call(null, arglist))
    }else {
      if(cljs.core.truth_("\ufdd0'else")) {
        return cljs.core.cons.call(null, cljs.core.first.call(null, arglist), spread.call(null, cljs.core.next.call(null, arglist)))
      }else {
        return null
      }
    }
  }
};
cljs.core.concat = function() {
  var concat = null;
  var concat__14888 = function() {
    return new cljs.core.LazySeq(null, false, function() {
      return null
    })
  };
  var concat__14889 = function(x) {
    return new cljs.core.LazySeq(null, false, function() {
      return x
    })
  };
  var concat__14890 = function(x, y) {
    return new cljs.core.LazySeq(null, false, function() {
      var s__14885 = cljs.core.seq.call(null, x);
      if(cljs.core.truth_(s__14885)) {
        return cljs.core.cons.call(null, cljs.core.first.call(null, s__14885), concat.call(null, cljs.core.rest.call(null, s__14885), y))
      }else {
        return y
      }
    })
  };
  var concat__14891 = function() {
    var G__14893__delegate = function(x, y, zs) {
      var cat__14887 = function cat(xys, zs) {
        return new cljs.core.LazySeq(null, false, function() {
          var xys__14886 = cljs.core.seq.call(null, xys);
          if(cljs.core.truth_(xys__14886)) {
            return cljs.core.cons.call(null, cljs.core.first.call(null, xys__14886), cat.call(null, cljs.core.rest.call(null, xys__14886), zs))
          }else {
            if(cljs.core.truth_(zs)) {
              return cat.call(null, cljs.core.first.call(null, zs), cljs.core.next.call(null, zs))
            }else {
              return null
            }
          }
        })
      };
      return cat__14887.call(null, concat.call(null, x, y), zs)
    };
    var G__14893 = function(x, y, var_args) {
      var zs = null;
      if(goog.isDef(var_args)) {
        zs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__14893__delegate.call(this, x, y, zs)
    };
    G__14893.cljs$lang$maxFixedArity = 2;
    G__14893.cljs$lang$applyTo = function(arglist__14894) {
      var x = cljs.core.first(arglist__14894);
      var y = cljs.core.first(cljs.core.next(arglist__14894));
      var zs = cljs.core.rest(cljs.core.next(arglist__14894));
      return G__14893__delegate.call(this, x, y, zs)
    };
    return G__14893
  }();
  concat = function(x, y, var_args) {
    var zs = var_args;
    switch(arguments.length) {
      case 0:
        return concat__14888.call(this);
      case 1:
        return concat__14889.call(this, x);
      case 2:
        return concat__14890.call(this, x, y);
      default:
        return concat__14891.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  concat.cljs$lang$maxFixedArity = 2;
  concat.cljs$lang$applyTo = concat__14891.cljs$lang$applyTo;
  return concat
}();
cljs.core.list_STAR_ = function() {
  var list_STAR_ = null;
  var list_STAR___14895 = function(args) {
    return cljs.core.seq.call(null, args)
  };
  var list_STAR___14896 = function(a, args) {
    return cljs.core.cons.call(null, a, args)
  };
  var list_STAR___14897 = function(a, b, args) {
    return cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, args))
  };
  var list_STAR___14898 = function(a, b, c, args) {
    return cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, args)))
  };
  var list_STAR___14899 = function() {
    var G__14901__delegate = function(a, b, c, d, more) {
      return cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, cljs.core.cons.call(null, d, cljs.core.spread.call(null, more)))))
    };
    var G__14901 = function(a, b, c, d, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__14901__delegate.call(this, a, b, c, d, more)
    };
    G__14901.cljs$lang$maxFixedArity = 4;
    G__14901.cljs$lang$applyTo = function(arglist__14902) {
      var a = cljs.core.first(arglist__14902);
      var b = cljs.core.first(cljs.core.next(arglist__14902));
      var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__14902)));
      var d = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__14902))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__14902))));
      return G__14901__delegate.call(this, a, b, c, d, more)
    };
    return G__14901
  }();
  list_STAR_ = function(a, b, c, d, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return list_STAR___14895.call(this, a);
      case 2:
        return list_STAR___14896.call(this, a, b);
      case 3:
        return list_STAR___14897.call(this, a, b, c);
      case 4:
        return list_STAR___14898.call(this, a, b, c, d);
      default:
        return list_STAR___14899.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  list_STAR_.cljs$lang$maxFixedArity = 4;
  list_STAR_.cljs$lang$applyTo = list_STAR___14899.cljs$lang$applyTo;
  return list_STAR_
}();
cljs.core.apply = function() {
  var apply = null;
  var apply__14912 = function(f, args) {
    var fixed_arity__14903 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      if(cljs.core.truth_(cljs.core.bounded_count.call(null, args, fixed_arity__14903 + 1) <= fixed_arity__14903)) {
        return f.apply(f, cljs.core.to_array.call(null, args))
      }else {
        return f.cljs$lang$applyTo(args)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, args))
    }
  };
  var apply__14913 = function(f, x, args) {
    var arglist__14904 = cljs.core.list_STAR_.call(null, x, args);
    var fixed_arity__14905 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      if(cljs.core.truth_(cljs.core.bounded_count.call(null, arglist__14904, fixed_arity__14905) <= fixed_arity__14905)) {
        return f.apply(f, cljs.core.to_array.call(null, arglist__14904))
      }else {
        return f.cljs$lang$applyTo(arglist__14904)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__14904))
    }
  };
  var apply__14914 = function(f, x, y, args) {
    var arglist__14906 = cljs.core.list_STAR_.call(null, x, y, args);
    var fixed_arity__14907 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      if(cljs.core.truth_(cljs.core.bounded_count.call(null, arglist__14906, fixed_arity__14907) <= fixed_arity__14907)) {
        return f.apply(f, cljs.core.to_array.call(null, arglist__14906))
      }else {
        return f.cljs$lang$applyTo(arglist__14906)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__14906))
    }
  };
  var apply__14915 = function(f, x, y, z, args) {
    var arglist__14908 = cljs.core.list_STAR_.call(null, x, y, z, args);
    var fixed_arity__14909 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      if(cljs.core.truth_(cljs.core.bounded_count.call(null, arglist__14908, fixed_arity__14909) <= fixed_arity__14909)) {
        return f.apply(f, cljs.core.to_array.call(null, arglist__14908))
      }else {
        return f.cljs$lang$applyTo(arglist__14908)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__14908))
    }
  };
  var apply__14916 = function() {
    var G__14918__delegate = function(f, a, b, c, d, args) {
      var arglist__14910 = cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, cljs.core.cons.call(null, d, cljs.core.spread.call(null, args)))));
      var fixed_arity__14911 = f.cljs$lang$maxFixedArity;
      if(cljs.core.truth_(f.cljs$lang$applyTo)) {
        if(cljs.core.truth_(cljs.core.bounded_count.call(null, arglist__14910, fixed_arity__14911) <= fixed_arity__14911)) {
          return f.apply(f, cljs.core.to_array.call(null, arglist__14910))
        }else {
          return f.cljs$lang$applyTo(arglist__14910)
        }
      }else {
        return f.apply(f, cljs.core.to_array.call(null, arglist__14910))
      }
    };
    var G__14918 = function(f, a, b, c, d, var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 5), 0)
      }
      return G__14918__delegate.call(this, f, a, b, c, d, args)
    };
    G__14918.cljs$lang$maxFixedArity = 5;
    G__14918.cljs$lang$applyTo = function(arglist__14919) {
      var f = cljs.core.first(arglist__14919);
      var a = cljs.core.first(cljs.core.next(arglist__14919));
      var b = cljs.core.first(cljs.core.next(cljs.core.next(arglist__14919)));
      var c = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__14919))));
      var d = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__14919)))));
      var args = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__14919)))));
      return G__14918__delegate.call(this, f, a, b, c, d, args)
    };
    return G__14918
  }();
  apply = function(f, a, b, c, d, var_args) {
    var args = var_args;
    switch(arguments.length) {
      case 2:
        return apply__14912.call(this, f, a);
      case 3:
        return apply__14913.call(this, f, a, b);
      case 4:
        return apply__14914.call(this, f, a, b, c);
      case 5:
        return apply__14915.call(this, f, a, b, c, d);
      default:
        return apply__14916.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  apply.cljs$lang$maxFixedArity = 5;
  apply.cljs$lang$applyTo = apply__14916.cljs$lang$applyTo;
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
  vary_meta.cljs$lang$applyTo = function(arglist__14920) {
    var obj = cljs.core.first(arglist__14920);
    var f = cljs.core.first(cljs.core.next(arglist__14920));
    var args = cljs.core.rest(cljs.core.next(arglist__14920));
    return vary_meta__delegate.call(this, obj, f, args)
  };
  return vary_meta
}();
cljs.core.not_EQ_ = function() {
  var not_EQ_ = null;
  var not_EQ___14921 = function(x) {
    return false
  };
  var not_EQ___14922 = function(x, y) {
    return cljs.core.not.call(null, cljs.core._EQ_.call(null, x, y))
  };
  var not_EQ___14923 = function() {
    var G__14925__delegate = function(x, y, more) {
      return cljs.core.not.call(null, cljs.core.apply.call(null, cljs.core._EQ_, x, y, more))
    };
    var G__14925 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__14925__delegate.call(this, x, y, more)
    };
    G__14925.cljs$lang$maxFixedArity = 2;
    G__14925.cljs$lang$applyTo = function(arglist__14926) {
      var x = cljs.core.first(arglist__14926);
      var y = cljs.core.first(cljs.core.next(arglist__14926));
      var more = cljs.core.rest(cljs.core.next(arglist__14926));
      return G__14925__delegate.call(this, x, y, more)
    };
    return G__14925
  }();
  not_EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return not_EQ___14921.call(this, x);
      case 2:
        return not_EQ___14922.call(this, x, y);
      default:
        return not_EQ___14923.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  not_EQ_.cljs$lang$maxFixedArity = 2;
  not_EQ_.cljs$lang$applyTo = not_EQ___14923.cljs$lang$applyTo;
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
    if(cljs.core.truth_(cljs.core.seq.call(null, coll) === null)) {
      return true
    }else {
      if(cljs.core.truth_(pred.call(null, cljs.core.first.call(null, coll)))) {
        var G__14927 = pred;
        var G__14928 = cljs.core.next.call(null, coll);
        pred = G__14927;
        coll = G__14928;
        continue
      }else {
        if(cljs.core.truth_("\ufdd0'else")) {
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
      var or__3824__auto____14929 = pred.call(null, cljs.core.first.call(null, coll));
      if(cljs.core.truth_(or__3824__auto____14929)) {
        return or__3824__auto____14929
      }else {
        var G__14930 = pred;
        var G__14931 = cljs.core.next.call(null, coll);
        pred = G__14930;
        coll = G__14931;
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
  if(cljs.core.truth_(cljs.core.integer_QMARK_.call(null, n))) {
    return(n & 1) === 0
  }else {
    throw new Error(cljs.core.str.call(null, "Argument must be an integer: ", n));
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
    var G__14932 = null;
    var G__14932__14933 = function() {
      return cljs.core.not.call(null, f.call(null))
    };
    var G__14932__14934 = function(x) {
      return cljs.core.not.call(null, f.call(null, x))
    };
    var G__14932__14935 = function(x, y) {
      return cljs.core.not.call(null, f.call(null, x, y))
    };
    var G__14932__14936 = function() {
      var G__14938__delegate = function(x, y, zs) {
        return cljs.core.not.call(null, cljs.core.apply.call(null, f, x, y, zs))
      };
      var G__14938 = function(x, y, var_args) {
        var zs = null;
        if(goog.isDef(var_args)) {
          zs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
        }
        return G__14938__delegate.call(this, x, y, zs)
      };
      G__14938.cljs$lang$maxFixedArity = 2;
      G__14938.cljs$lang$applyTo = function(arglist__14939) {
        var x = cljs.core.first(arglist__14939);
        var y = cljs.core.first(cljs.core.next(arglist__14939));
        var zs = cljs.core.rest(cljs.core.next(arglist__14939));
        return G__14938__delegate.call(this, x, y, zs)
      };
      return G__14938
    }();
    G__14932 = function(x, y, var_args) {
      var zs = var_args;
      switch(arguments.length) {
        case 0:
          return G__14932__14933.call(this);
        case 1:
          return G__14932__14934.call(this, x);
        case 2:
          return G__14932__14935.call(this, x, y);
        default:
          return G__14932__14936.apply(this, arguments)
      }
      throw"Invalid arity: " + arguments.length;
    };
    G__14932.cljs$lang$maxFixedArity = 2;
    G__14932.cljs$lang$applyTo = G__14932__14936.cljs$lang$applyTo;
    return G__14932
  }()
};
cljs.core.constantly = function constantly(x) {
  return function() {
    var G__14940__delegate = function(args) {
      return x
    };
    var G__14940 = function(var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__14940__delegate.call(this, args)
    };
    G__14940.cljs$lang$maxFixedArity = 0;
    G__14940.cljs$lang$applyTo = function(arglist__14941) {
      var args = cljs.core.seq(arglist__14941);
      return G__14940__delegate.call(this, args)
    };
    return G__14940
  }()
};
cljs.core.comp = function() {
  var comp = null;
  var comp__14945 = function() {
    return cljs.core.identity
  };
  var comp__14946 = function(f) {
    return f
  };
  var comp__14947 = function(f, g) {
    return function() {
      var G__14951 = null;
      var G__14951__14952 = function() {
        return f.call(null, g.call(null))
      };
      var G__14951__14953 = function(x) {
        return f.call(null, g.call(null, x))
      };
      var G__14951__14954 = function(x, y) {
        return f.call(null, g.call(null, x, y))
      };
      var G__14951__14955 = function(x, y, z) {
        return f.call(null, g.call(null, x, y, z))
      };
      var G__14951__14956 = function() {
        var G__14958__delegate = function(x, y, z, args) {
          return f.call(null, cljs.core.apply.call(null, g, x, y, z, args))
        };
        var G__14958 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__14958__delegate.call(this, x, y, z, args)
        };
        G__14958.cljs$lang$maxFixedArity = 3;
        G__14958.cljs$lang$applyTo = function(arglist__14959) {
          var x = cljs.core.first(arglist__14959);
          var y = cljs.core.first(cljs.core.next(arglist__14959));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__14959)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__14959)));
          return G__14958__delegate.call(this, x, y, z, args)
        };
        return G__14958
      }();
      G__14951 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__14951__14952.call(this);
          case 1:
            return G__14951__14953.call(this, x);
          case 2:
            return G__14951__14954.call(this, x, y);
          case 3:
            return G__14951__14955.call(this, x, y, z);
          default:
            return G__14951__14956.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__14951.cljs$lang$maxFixedArity = 3;
      G__14951.cljs$lang$applyTo = G__14951__14956.cljs$lang$applyTo;
      return G__14951
    }()
  };
  var comp__14948 = function(f, g, h) {
    return function() {
      var G__14960 = null;
      var G__14960__14961 = function() {
        return f.call(null, g.call(null, h.call(null)))
      };
      var G__14960__14962 = function(x) {
        return f.call(null, g.call(null, h.call(null, x)))
      };
      var G__14960__14963 = function(x, y) {
        return f.call(null, g.call(null, h.call(null, x, y)))
      };
      var G__14960__14964 = function(x, y, z) {
        return f.call(null, g.call(null, h.call(null, x, y, z)))
      };
      var G__14960__14965 = function() {
        var G__14967__delegate = function(x, y, z, args) {
          return f.call(null, g.call(null, cljs.core.apply.call(null, h, x, y, z, args)))
        };
        var G__14967 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__14967__delegate.call(this, x, y, z, args)
        };
        G__14967.cljs$lang$maxFixedArity = 3;
        G__14967.cljs$lang$applyTo = function(arglist__14968) {
          var x = cljs.core.first(arglist__14968);
          var y = cljs.core.first(cljs.core.next(arglist__14968));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__14968)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__14968)));
          return G__14967__delegate.call(this, x, y, z, args)
        };
        return G__14967
      }();
      G__14960 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__14960__14961.call(this);
          case 1:
            return G__14960__14962.call(this, x);
          case 2:
            return G__14960__14963.call(this, x, y);
          case 3:
            return G__14960__14964.call(this, x, y, z);
          default:
            return G__14960__14965.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__14960.cljs$lang$maxFixedArity = 3;
      G__14960.cljs$lang$applyTo = G__14960__14965.cljs$lang$applyTo;
      return G__14960
    }()
  };
  var comp__14949 = function() {
    var G__14969__delegate = function(f1, f2, f3, fs) {
      var fs__14942 = cljs.core.reverse.call(null, cljs.core.list_STAR_.call(null, f1, f2, f3, fs));
      return function() {
        var G__14970__delegate = function(args) {
          var ret__14943 = cljs.core.apply.call(null, cljs.core.first.call(null, fs__14942), args);
          var fs__14944 = cljs.core.next.call(null, fs__14942);
          while(true) {
            if(cljs.core.truth_(fs__14944)) {
              var G__14971 = cljs.core.first.call(null, fs__14944).call(null, ret__14943);
              var G__14972 = cljs.core.next.call(null, fs__14944);
              ret__14943 = G__14971;
              fs__14944 = G__14972;
              continue
            }else {
              return ret__14943
            }
            break
          }
        };
        var G__14970 = function(var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
          }
          return G__14970__delegate.call(this, args)
        };
        G__14970.cljs$lang$maxFixedArity = 0;
        G__14970.cljs$lang$applyTo = function(arglist__14973) {
          var args = cljs.core.seq(arglist__14973);
          return G__14970__delegate.call(this, args)
        };
        return G__14970
      }()
    };
    var G__14969 = function(f1, f2, f3, var_args) {
      var fs = null;
      if(goog.isDef(var_args)) {
        fs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__14969__delegate.call(this, f1, f2, f3, fs)
    };
    G__14969.cljs$lang$maxFixedArity = 3;
    G__14969.cljs$lang$applyTo = function(arglist__14974) {
      var f1 = cljs.core.first(arglist__14974);
      var f2 = cljs.core.first(cljs.core.next(arglist__14974));
      var f3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__14974)));
      var fs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__14974)));
      return G__14969__delegate.call(this, f1, f2, f3, fs)
    };
    return G__14969
  }();
  comp = function(f1, f2, f3, var_args) {
    var fs = var_args;
    switch(arguments.length) {
      case 0:
        return comp__14945.call(this);
      case 1:
        return comp__14946.call(this, f1);
      case 2:
        return comp__14947.call(this, f1, f2);
      case 3:
        return comp__14948.call(this, f1, f2, f3);
      default:
        return comp__14949.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  comp.cljs$lang$maxFixedArity = 3;
  comp.cljs$lang$applyTo = comp__14949.cljs$lang$applyTo;
  return comp
}();
cljs.core.partial = function() {
  var partial = null;
  var partial__14975 = function(f, arg1) {
    return function() {
      var G__14980__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, args)
      };
      var G__14980 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__14980__delegate.call(this, args)
      };
      G__14980.cljs$lang$maxFixedArity = 0;
      G__14980.cljs$lang$applyTo = function(arglist__14981) {
        var args = cljs.core.seq(arglist__14981);
        return G__14980__delegate.call(this, args)
      };
      return G__14980
    }()
  };
  var partial__14976 = function(f, arg1, arg2) {
    return function() {
      var G__14982__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, arg2, args)
      };
      var G__14982 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__14982__delegate.call(this, args)
      };
      G__14982.cljs$lang$maxFixedArity = 0;
      G__14982.cljs$lang$applyTo = function(arglist__14983) {
        var args = cljs.core.seq(arglist__14983);
        return G__14982__delegate.call(this, args)
      };
      return G__14982
    }()
  };
  var partial__14977 = function(f, arg1, arg2, arg3) {
    return function() {
      var G__14984__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, arg2, arg3, args)
      };
      var G__14984 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__14984__delegate.call(this, args)
      };
      G__14984.cljs$lang$maxFixedArity = 0;
      G__14984.cljs$lang$applyTo = function(arglist__14985) {
        var args = cljs.core.seq(arglist__14985);
        return G__14984__delegate.call(this, args)
      };
      return G__14984
    }()
  };
  var partial__14978 = function() {
    var G__14986__delegate = function(f, arg1, arg2, arg3, more) {
      return function() {
        var G__14987__delegate = function(args) {
          return cljs.core.apply.call(null, f, arg1, arg2, arg3, cljs.core.concat.call(null, more, args))
        };
        var G__14987 = function(var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
          }
          return G__14987__delegate.call(this, args)
        };
        G__14987.cljs$lang$maxFixedArity = 0;
        G__14987.cljs$lang$applyTo = function(arglist__14988) {
          var args = cljs.core.seq(arglist__14988);
          return G__14987__delegate.call(this, args)
        };
        return G__14987
      }()
    };
    var G__14986 = function(f, arg1, arg2, arg3, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__14986__delegate.call(this, f, arg1, arg2, arg3, more)
    };
    G__14986.cljs$lang$maxFixedArity = 4;
    G__14986.cljs$lang$applyTo = function(arglist__14989) {
      var f = cljs.core.first(arglist__14989);
      var arg1 = cljs.core.first(cljs.core.next(arglist__14989));
      var arg2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__14989)));
      var arg3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__14989))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__14989))));
      return G__14986__delegate.call(this, f, arg1, arg2, arg3, more)
    };
    return G__14986
  }();
  partial = function(f, arg1, arg2, arg3, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return partial__14975.call(this, f, arg1);
      case 3:
        return partial__14976.call(this, f, arg1, arg2);
      case 4:
        return partial__14977.call(this, f, arg1, arg2, arg3);
      default:
        return partial__14978.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  partial.cljs$lang$maxFixedArity = 4;
  partial.cljs$lang$applyTo = partial__14978.cljs$lang$applyTo;
  return partial
}();
cljs.core.fnil = function() {
  var fnil = null;
  var fnil__14990 = function(f, x) {
    return function() {
      var G__14994 = null;
      var G__14994__14995 = function(a) {
        return f.call(null, cljs.core.truth_(a === null) ? x : a)
      };
      var G__14994__14996 = function(a, b) {
        return f.call(null, cljs.core.truth_(a === null) ? x : a, b)
      };
      var G__14994__14997 = function(a, b, c) {
        return f.call(null, cljs.core.truth_(a === null) ? x : a, b, c)
      };
      var G__14994__14998 = function() {
        var G__15000__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, cljs.core.truth_(a === null) ? x : a, b, c, ds)
        };
        var G__15000 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__15000__delegate.call(this, a, b, c, ds)
        };
        G__15000.cljs$lang$maxFixedArity = 3;
        G__15000.cljs$lang$applyTo = function(arglist__15001) {
          var a = cljs.core.first(arglist__15001);
          var b = cljs.core.first(cljs.core.next(arglist__15001));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__15001)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__15001)));
          return G__15000__delegate.call(this, a, b, c, ds)
        };
        return G__15000
      }();
      G__14994 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 1:
            return G__14994__14995.call(this, a);
          case 2:
            return G__14994__14996.call(this, a, b);
          case 3:
            return G__14994__14997.call(this, a, b, c);
          default:
            return G__14994__14998.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__14994.cljs$lang$maxFixedArity = 3;
      G__14994.cljs$lang$applyTo = G__14994__14998.cljs$lang$applyTo;
      return G__14994
    }()
  };
  var fnil__14991 = function(f, x, y) {
    return function() {
      var G__15002 = null;
      var G__15002__15003 = function(a, b) {
        return f.call(null, cljs.core.truth_(a === null) ? x : a, cljs.core.truth_(b === null) ? y : b)
      };
      var G__15002__15004 = function(a, b, c) {
        return f.call(null, cljs.core.truth_(a === null) ? x : a, cljs.core.truth_(b === null) ? y : b, c)
      };
      var G__15002__15005 = function() {
        var G__15007__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, cljs.core.truth_(a === null) ? x : a, cljs.core.truth_(b === null) ? y : b, c, ds)
        };
        var G__15007 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__15007__delegate.call(this, a, b, c, ds)
        };
        G__15007.cljs$lang$maxFixedArity = 3;
        G__15007.cljs$lang$applyTo = function(arglist__15008) {
          var a = cljs.core.first(arglist__15008);
          var b = cljs.core.first(cljs.core.next(arglist__15008));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__15008)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__15008)));
          return G__15007__delegate.call(this, a, b, c, ds)
        };
        return G__15007
      }();
      G__15002 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 2:
            return G__15002__15003.call(this, a, b);
          case 3:
            return G__15002__15004.call(this, a, b, c);
          default:
            return G__15002__15005.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__15002.cljs$lang$maxFixedArity = 3;
      G__15002.cljs$lang$applyTo = G__15002__15005.cljs$lang$applyTo;
      return G__15002
    }()
  };
  var fnil__14992 = function(f, x, y, z) {
    return function() {
      var G__15009 = null;
      var G__15009__15010 = function(a, b) {
        return f.call(null, cljs.core.truth_(a === null) ? x : a, cljs.core.truth_(b === null) ? y : b)
      };
      var G__15009__15011 = function(a, b, c) {
        return f.call(null, cljs.core.truth_(a === null) ? x : a, cljs.core.truth_(b === null) ? y : b, cljs.core.truth_(c === null) ? z : c)
      };
      var G__15009__15012 = function() {
        var G__15014__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, cljs.core.truth_(a === null) ? x : a, cljs.core.truth_(b === null) ? y : b, cljs.core.truth_(c === null) ? z : c, ds)
        };
        var G__15014 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__15014__delegate.call(this, a, b, c, ds)
        };
        G__15014.cljs$lang$maxFixedArity = 3;
        G__15014.cljs$lang$applyTo = function(arglist__15015) {
          var a = cljs.core.first(arglist__15015);
          var b = cljs.core.first(cljs.core.next(arglist__15015));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__15015)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__15015)));
          return G__15014__delegate.call(this, a, b, c, ds)
        };
        return G__15014
      }();
      G__15009 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 2:
            return G__15009__15010.call(this, a, b);
          case 3:
            return G__15009__15011.call(this, a, b, c);
          default:
            return G__15009__15012.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__15009.cljs$lang$maxFixedArity = 3;
      G__15009.cljs$lang$applyTo = G__15009__15012.cljs$lang$applyTo;
      return G__15009
    }()
  };
  fnil = function(f, x, y, z) {
    switch(arguments.length) {
      case 2:
        return fnil__14990.call(this, f, x);
      case 3:
        return fnil__14991.call(this, f, x, y);
      case 4:
        return fnil__14992.call(this, f, x, y, z)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return fnil
}();
cljs.core.map_indexed = function map_indexed(f, coll) {
  var mapi__15018 = function mpi(idx, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____15016 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3974__auto____15016)) {
        var s__15017 = temp__3974__auto____15016;
        return cljs.core.cons.call(null, f.call(null, idx, cljs.core.first.call(null, s__15017)), mpi.call(null, idx + 1, cljs.core.rest.call(null, s__15017)))
      }else {
        return null
      }
    })
  };
  return mapi__15018.call(null, 0, coll)
};
cljs.core.keep = function keep(f, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____15019 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3974__auto____15019)) {
      var s__15020 = temp__3974__auto____15019;
      var x__15021 = f.call(null, cljs.core.first.call(null, s__15020));
      if(cljs.core.truth_(x__15021 === null)) {
        return keep.call(null, f, cljs.core.rest.call(null, s__15020))
      }else {
        return cljs.core.cons.call(null, x__15021, keep.call(null, f, cljs.core.rest.call(null, s__15020)))
      }
    }else {
      return null
    }
  })
};
cljs.core.keep_indexed = function keep_indexed(f, coll) {
  var keepi__15031 = function kpi(idx, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____15028 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3974__auto____15028)) {
        var s__15029 = temp__3974__auto____15028;
        var x__15030 = f.call(null, idx, cljs.core.first.call(null, s__15029));
        if(cljs.core.truth_(x__15030 === null)) {
          return kpi.call(null, idx + 1, cljs.core.rest.call(null, s__15029))
        }else {
          return cljs.core.cons.call(null, x__15030, kpi.call(null, idx + 1, cljs.core.rest.call(null, s__15029)))
        }
      }else {
        return null
      }
    })
  };
  return keepi__15031.call(null, 0, coll)
};
cljs.core.every_pred = function() {
  var every_pred = null;
  var every_pred__15076 = function(p) {
    return function() {
      var ep1 = null;
      var ep1__15081 = function() {
        return true
      };
      var ep1__15082 = function(x) {
        return cljs.core.boolean$.call(null, p.call(null, x))
      };
      var ep1__15083 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____15038 = p.call(null, x);
          if(cljs.core.truth_(and__3822__auto____15038)) {
            return p.call(null, y)
          }else {
            return and__3822__auto____15038
          }
        }())
      };
      var ep1__15084 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____15039 = p.call(null, x);
          if(cljs.core.truth_(and__3822__auto____15039)) {
            var and__3822__auto____15040 = p.call(null, y);
            if(cljs.core.truth_(and__3822__auto____15040)) {
              return p.call(null, z)
            }else {
              return and__3822__auto____15040
            }
          }else {
            return and__3822__auto____15039
          }
        }())
      };
      var ep1__15085 = function() {
        var G__15087__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3822__auto____15041 = ep1.call(null, x, y, z);
            if(cljs.core.truth_(and__3822__auto____15041)) {
              return cljs.core.every_QMARK_.call(null, p, args)
            }else {
              return and__3822__auto____15041
            }
          }())
        };
        var G__15087 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__15087__delegate.call(this, x, y, z, args)
        };
        G__15087.cljs$lang$maxFixedArity = 3;
        G__15087.cljs$lang$applyTo = function(arglist__15088) {
          var x = cljs.core.first(arglist__15088);
          var y = cljs.core.first(cljs.core.next(arglist__15088));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__15088)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__15088)));
          return G__15087__delegate.call(this, x, y, z, args)
        };
        return G__15087
      }();
      ep1 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return ep1__15081.call(this);
          case 1:
            return ep1__15082.call(this, x);
          case 2:
            return ep1__15083.call(this, x, y);
          case 3:
            return ep1__15084.call(this, x, y, z);
          default:
            return ep1__15085.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      ep1.cljs$lang$maxFixedArity = 3;
      ep1.cljs$lang$applyTo = ep1__15085.cljs$lang$applyTo;
      return ep1
    }()
  };
  var every_pred__15077 = function(p1, p2) {
    return function() {
      var ep2 = null;
      var ep2__15089 = function() {
        return true
      };
      var ep2__15090 = function(x) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____15042 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____15042)) {
            return p2.call(null, x)
          }else {
            return and__3822__auto____15042
          }
        }())
      };
      var ep2__15091 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____15043 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____15043)) {
            var and__3822__auto____15044 = p1.call(null, y);
            if(cljs.core.truth_(and__3822__auto____15044)) {
              var and__3822__auto____15045 = p2.call(null, x);
              if(cljs.core.truth_(and__3822__auto____15045)) {
                return p2.call(null, y)
              }else {
                return and__3822__auto____15045
              }
            }else {
              return and__3822__auto____15044
            }
          }else {
            return and__3822__auto____15043
          }
        }())
      };
      var ep2__15092 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____15046 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____15046)) {
            var and__3822__auto____15047 = p1.call(null, y);
            if(cljs.core.truth_(and__3822__auto____15047)) {
              var and__3822__auto____15048 = p1.call(null, z);
              if(cljs.core.truth_(and__3822__auto____15048)) {
                var and__3822__auto____15049 = p2.call(null, x);
                if(cljs.core.truth_(and__3822__auto____15049)) {
                  var and__3822__auto____15050 = p2.call(null, y);
                  if(cljs.core.truth_(and__3822__auto____15050)) {
                    return p2.call(null, z)
                  }else {
                    return and__3822__auto____15050
                  }
                }else {
                  return and__3822__auto____15049
                }
              }else {
                return and__3822__auto____15048
              }
            }else {
              return and__3822__auto____15047
            }
          }else {
            return and__3822__auto____15046
          }
        }())
      };
      var ep2__15093 = function() {
        var G__15095__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3822__auto____15051 = ep2.call(null, x, y, z);
            if(cljs.core.truth_(and__3822__auto____15051)) {
              return cljs.core.every_QMARK_.call(null, function(p1__15022_SHARP_) {
                var and__3822__auto____15052 = p1.call(null, p1__15022_SHARP_);
                if(cljs.core.truth_(and__3822__auto____15052)) {
                  return p2.call(null, p1__15022_SHARP_)
                }else {
                  return and__3822__auto____15052
                }
              }, args)
            }else {
              return and__3822__auto____15051
            }
          }())
        };
        var G__15095 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__15095__delegate.call(this, x, y, z, args)
        };
        G__15095.cljs$lang$maxFixedArity = 3;
        G__15095.cljs$lang$applyTo = function(arglist__15096) {
          var x = cljs.core.first(arglist__15096);
          var y = cljs.core.first(cljs.core.next(arglist__15096));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__15096)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__15096)));
          return G__15095__delegate.call(this, x, y, z, args)
        };
        return G__15095
      }();
      ep2 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return ep2__15089.call(this);
          case 1:
            return ep2__15090.call(this, x);
          case 2:
            return ep2__15091.call(this, x, y);
          case 3:
            return ep2__15092.call(this, x, y, z);
          default:
            return ep2__15093.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      ep2.cljs$lang$maxFixedArity = 3;
      ep2.cljs$lang$applyTo = ep2__15093.cljs$lang$applyTo;
      return ep2
    }()
  };
  var every_pred__15078 = function(p1, p2, p3) {
    return function() {
      var ep3 = null;
      var ep3__15097 = function() {
        return true
      };
      var ep3__15098 = function(x) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____15053 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____15053)) {
            var and__3822__auto____15054 = p2.call(null, x);
            if(cljs.core.truth_(and__3822__auto____15054)) {
              return p3.call(null, x)
            }else {
              return and__3822__auto____15054
            }
          }else {
            return and__3822__auto____15053
          }
        }())
      };
      var ep3__15099 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____15055 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____15055)) {
            var and__3822__auto____15056 = p2.call(null, x);
            if(cljs.core.truth_(and__3822__auto____15056)) {
              var and__3822__auto____15057 = p3.call(null, x);
              if(cljs.core.truth_(and__3822__auto____15057)) {
                var and__3822__auto____15058 = p1.call(null, y);
                if(cljs.core.truth_(and__3822__auto____15058)) {
                  var and__3822__auto____15059 = p2.call(null, y);
                  if(cljs.core.truth_(and__3822__auto____15059)) {
                    return p3.call(null, y)
                  }else {
                    return and__3822__auto____15059
                  }
                }else {
                  return and__3822__auto____15058
                }
              }else {
                return and__3822__auto____15057
              }
            }else {
              return and__3822__auto____15056
            }
          }else {
            return and__3822__auto____15055
          }
        }())
      };
      var ep3__15100 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____15060 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____15060)) {
            var and__3822__auto____15061 = p2.call(null, x);
            if(cljs.core.truth_(and__3822__auto____15061)) {
              var and__3822__auto____15062 = p3.call(null, x);
              if(cljs.core.truth_(and__3822__auto____15062)) {
                var and__3822__auto____15063 = p1.call(null, y);
                if(cljs.core.truth_(and__3822__auto____15063)) {
                  var and__3822__auto____15064 = p2.call(null, y);
                  if(cljs.core.truth_(and__3822__auto____15064)) {
                    var and__3822__auto____15065 = p3.call(null, y);
                    if(cljs.core.truth_(and__3822__auto____15065)) {
                      var and__3822__auto____15066 = p1.call(null, z);
                      if(cljs.core.truth_(and__3822__auto____15066)) {
                        var and__3822__auto____15067 = p2.call(null, z);
                        if(cljs.core.truth_(and__3822__auto____15067)) {
                          return p3.call(null, z)
                        }else {
                          return and__3822__auto____15067
                        }
                      }else {
                        return and__3822__auto____15066
                      }
                    }else {
                      return and__3822__auto____15065
                    }
                  }else {
                    return and__3822__auto____15064
                  }
                }else {
                  return and__3822__auto____15063
                }
              }else {
                return and__3822__auto____15062
              }
            }else {
              return and__3822__auto____15061
            }
          }else {
            return and__3822__auto____15060
          }
        }())
      };
      var ep3__15101 = function() {
        var G__15103__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3822__auto____15068 = ep3.call(null, x, y, z);
            if(cljs.core.truth_(and__3822__auto____15068)) {
              return cljs.core.every_QMARK_.call(null, function(p1__15023_SHARP_) {
                var and__3822__auto____15069 = p1.call(null, p1__15023_SHARP_);
                if(cljs.core.truth_(and__3822__auto____15069)) {
                  var and__3822__auto____15070 = p2.call(null, p1__15023_SHARP_);
                  if(cljs.core.truth_(and__3822__auto____15070)) {
                    return p3.call(null, p1__15023_SHARP_)
                  }else {
                    return and__3822__auto____15070
                  }
                }else {
                  return and__3822__auto____15069
                }
              }, args)
            }else {
              return and__3822__auto____15068
            }
          }())
        };
        var G__15103 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__15103__delegate.call(this, x, y, z, args)
        };
        G__15103.cljs$lang$maxFixedArity = 3;
        G__15103.cljs$lang$applyTo = function(arglist__15104) {
          var x = cljs.core.first(arglist__15104);
          var y = cljs.core.first(cljs.core.next(arglist__15104));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__15104)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__15104)));
          return G__15103__delegate.call(this, x, y, z, args)
        };
        return G__15103
      }();
      ep3 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return ep3__15097.call(this);
          case 1:
            return ep3__15098.call(this, x);
          case 2:
            return ep3__15099.call(this, x, y);
          case 3:
            return ep3__15100.call(this, x, y, z);
          default:
            return ep3__15101.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      ep3.cljs$lang$maxFixedArity = 3;
      ep3.cljs$lang$applyTo = ep3__15101.cljs$lang$applyTo;
      return ep3
    }()
  };
  var every_pred__15079 = function() {
    var G__15105__delegate = function(p1, p2, p3, ps) {
      var ps__15071 = cljs.core.list_STAR_.call(null, p1, p2, p3, ps);
      return function() {
        var epn = null;
        var epn__15106 = function() {
          return true
        };
        var epn__15107 = function(x) {
          return cljs.core.every_QMARK_.call(null, function(p1__15024_SHARP_) {
            return p1__15024_SHARP_.call(null, x)
          }, ps__15071)
        };
        var epn__15108 = function(x, y) {
          return cljs.core.every_QMARK_.call(null, function(p1__15025_SHARP_) {
            var and__3822__auto____15072 = p1__15025_SHARP_.call(null, x);
            if(cljs.core.truth_(and__3822__auto____15072)) {
              return p1__15025_SHARP_.call(null, y)
            }else {
              return and__3822__auto____15072
            }
          }, ps__15071)
        };
        var epn__15109 = function(x, y, z) {
          return cljs.core.every_QMARK_.call(null, function(p1__15026_SHARP_) {
            var and__3822__auto____15073 = p1__15026_SHARP_.call(null, x);
            if(cljs.core.truth_(and__3822__auto____15073)) {
              var and__3822__auto____15074 = p1__15026_SHARP_.call(null, y);
              if(cljs.core.truth_(and__3822__auto____15074)) {
                return p1__15026_SHARP_.call(null, z)
              }else {
                return and__3822__auto____15074
              }
            }else {
              return and__3822__auto____15073
            }
          }, ps__15071)
        };
        var epn__15110 = function() {
          var G__15112__delegate = function(x, y, z, args) {
            return cljs.core.boolean$.call(null, function() {
              var and__3822__auto____15075 = epn.call(null, x, y, z);
              if(cljs.core.truth_(and__3822__auto____15075)) {
                return cljs.core.every_QMARK_.call(null, function(p1__15027_SHARP_) {
                  return cljs.core.every_QMARK_.call(null, p1__15027_SHARP_, args)
                }, ps__15071)
              }else {
                return and__3822__auto____15075
              }
            }())
          };
          var G__15112 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__15112__delegate.call(this, x, y, z, args)
          };
          G__15112.cljs$lang$maxFixedArity = 3;
          G__15112.cljs$lang$applyTo = function(arglist__15113) {
            var x = cljs.core.first(arglist__15113);
            var y = cljs.core.first(cljs.core.next(arglist__15113));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__15113)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__15113)));
            return G__15112__delegate.call(this, x, y, z, args)
          };
          return G__15112
        }();
        epn = function(x, y, z, var_args) {
          var args = var_args;
          switch(arguments.length) {
            case 0:
              return epn__15106.call(this);
            case 1:
              return epn__15107.call(this, x);
            case 2:
              return epn__15108.call(this, x, y);
            case 3:
              return epn__15109.call(this, x, y, z);
            default:
              return epn__15110.apply(this, arguments)
          }
          throw"Invalid arity: " + arguments.length;
        };
        epn.cljs$lang$maxFixedArity = 3;
        epn.cljs$lang$applyTo = epn__15110.cljs$lang$applyTo;
        return epn
      }()
    };
    var G__15105 = function(p1, p2, p3, var_args) {
      var ps = null;
      if(goog.isDef(var_args)) {
        ps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__15105__delegate.call(this, p1, p2, p3, ps)
    };
    G__15105.cljs$lang$maxFixedArity = 3;
    G__15105.cljs$lang$applyTo = function(arglist__15114) {
      var p1 = cljs.core.first(arglist__15114);
      var p2 = cljs.core.first(cljs.core.next(arglist__15114));
      var p3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__15114)));
      var ps = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__15114)));
      return G__15105__delegate.call(this, p1, p2, p3, ps)
    };
    return G__15105
  }();
  every_pred = function(p1, p2, p3, var_args) {
    var ps = var_args;
    switch(arguments.length) {
      case 1:
        return every_pred__15076.call(this, p1);
      case 2:
        return every_pred__15077.call(this, p1, p2);
      case 3:
        return every_pred__15078.call(this, p1, p2, p3);
      default:
        return every_pred__15079.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  every_pred.cljs$lang$maxFixedArity = 3;
  every_pred.cljs$lang$applyTo = every_pred__15079.cljs$lang$applyTo;
  return every_pred
}();
cljs.core.some_fn = function() {
  var some_fn = null;
  var some_fn__15154 = function(p) {
    return function() {
      var sp1 = null;
      var sp1__15159 = function() {
        return null
      };
      var sp1__15160 = function(x) {
        return p.call(null, x)
      };
      var sp1__15161 = function(x, y) {
        var or__3824__auto____15116 = p.call(null, x);
        if(cljs.core.truth_(or__3824__auto____15116)) {
          return or__3824__auto____15116
        }else {
          return p.call(null, y)
        }
      };
      var sp1__15162 = function(x, y, z) {
        var or__3824__auto____15117 = p.call(null, x);
        if(cljs.core.truth_(or__3824__auto____15117)) {
          return or__3824__auto____15117
        }else {
          var or__3824__auto____15118 = p.call(null, y);
          if(cljs.core.truth_(or__3824__auto____15118)) {
            return or__3824__auto____15118
          }else {
            return p.call(null, z)
          }
        }
      };
      var sp1__15163 = function() {
        var G__15165__delegate = function(x, y, z, args) {
          var or__3824__auto____15119 = sp1.call(null, x, y, z);
          if(cljs.core.truth_(or__3824__auto____15119)) {
            return or__3824__auto____15119
          }else {
            return cljs.core.some.call(null, p, args)
          }
        };
        var G__15165 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__15165__delegate.call(this, x, y, z, args)
        };
        G__15165.cljs$lang$maxFixedArity = 3;
        G__15165.cljs$lang$applyTo = function(arglist__15166) {
          var x = cljs.core.first(arglist__15166);
          var y = cljs.core.first(cljs.core.next(arglist__15166));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__15166)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__15166)));
          return G__15165__delegate.call(this, x, y, z, args)
        };
        return G__15165
      }();
      sp1 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return sp1__15159.call(this);
          case 1:
            return sp1__15160.call(this, x);
          case 2:
            return sp1__15161.call(this, x, y);
          case 3:
            return sp1__15162.call(this, x, y, z);
          default:
            return sp1__15163.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      sp1.cljs$lang$maxFixedArity = 3;
      sp1.cljs$lang$applyTo = sp1__15163.cljs$lang$applyTo;
      return sp1
    }()
  };
  var some_fn__15155 = function(p1, p2) {
    return function() {
      var sp2 = null;
      var sp2__15167 = function() {
        return null
      };
      var sp2__15168 = function(x) {
        var or__3824__auto____15120 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____15120)) {
          return or__3824__auto____15120
        }else {
          return p2.call(null, x)
        }
      };
      var sp2__15169 = function(x, y) {
        var or__3824__auto____15121 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____15121)) {
          return or__3824__auto____15121
        }else {
          var or__3824__auto____15122 = p1.call(null, y);
          if(cljs.core.truth_(or__3824__auto____15122)) {
            return or__3824__auto____15122
          }else {
            var or__3824__auto____15123 = p2.call(null, x);
            if(cljs.core.truth_(or__3824__auto____15123)) {
              return or__3824__auto____15123
            }else {
              return p2.call(null, y)
            }
          }
        }
      };
      var sp2__15170 = function(x, y, z) {
        var or__3824__auto____15124 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____15124)) {
          return or__3824__auto____15124
        }else {
          var or__3824__auto____15125 = p1.call(null, y);
          if(cljs.core.truth_(or__3824__auto____15125)) {
            return or__3824__auto____15125
          }else {
            var or__3824__auto____15126 = p1.call(null, z);
            if(cljs.core.truth_(or__3824__auto____15126)) {
              return or__3824__auto____15126
            }else {
              var or__3824__auto____15127 = p2.call(null, x);
              if(cljs.core.truth_(or__3824__auto____15127)) {
                return or__3824__auto____15127
              }else {
                var or__3824__auto____15128 = p2.call(null, y);
                if(cljs.core.truth_(or__3824__auto____15128)) {
                  return or__3824__auto____15128
                }else {
                  return p2.call(null, z)
                }
              }
            }
          }
        }
      };
      var sp2__15171 = function() {
        var G__15173__delegate = function(x, y, z, args) {
          var or__3824__auto____15129 = sp2.call(null, x, y, z);
          if(cljs.core.truth_(or__3824__auto____15129)) {
            return or__3824__auto____15129
          }else {
            return cljs.core.some.call(null, function(p1__15032_SHARP_) {
              var or__3824__auto____15130 = p1.call(null, p1__15032_SHARP_);
              if(cljs.core.truth_(or__3824__auto____15130)) {
                return or__3824__auto____15130
              }else {
                return p2.call(null, p1__15032_SHARP_)
              }
            }, args)
          }
        };
        var G__15173 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__15173__delegate.call(this, x, y, z, args)
        };
        G__15173.cljs$lang$maxFixedArity = 3;
        G__15173.cljs$lang$applyTo = function(arglist__15174) {
          var x = cljs.core.first(arglist__15174);
          var y = cljs.core.first(cljs.core.next(arglist__15174));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__15174)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__15174)));
          return G__15173__delegate.call(this, x, y, z, args)
        };
        return G__15173
      }();
      sp2 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return sp2__15167.call(this);
          case 1:
            return sp2__15168.call(this, x);
          case 2:
            return sp2__15169.call(this, x, y);
          case 3:
            return sp2__15170.call(this, x, y, z);
          default:
            return sp2__15171.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      sp2.cljs$lang$maxFixedArity = 3;
      sp2.cljs$lang$applyTo = sp2__15171.cljs$lang$applyTo;
      return sp2
    }()
  };
  var some_fn__15156 = function(p1, p2, p3) {
    return function() {
      var sp3 = null;
      var sp3__15175 = function() {
        return null
      };
      var sp3__15176 = function(x) {
        var or__3824__auto____15131 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____15131)) {
          return or__3824__auto____15131
        }else {
          var or__3824__auto____15132 = p2.call(null, x);
          if(cljs.core.truth_(or__3824__auto____15132)) {
            return or__3824__auto____15132
          }else {
            return p3.call(null, x)
          }
        }
      };
      var sp3__15177 = function(x, y) {
        var or__3824__auto____15133 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____15133)) {
          return or__3824__auto____15133
        }else {
          var or__3824__auto____15134 = p2.call(null, x);
          if(cljs.core.truth_(or__3824__auto____15134)) {
            return or__3824__auto____15134
          }else {
            var or__3824__auto____15135 = p3.call(null, x);
            if(cljs.core.truth_(or__3824__auto____15135)) {
              return or__3824__auto____15135
            }else {
              var or__3824__auto____15136 = p1.call(null, y);
              if(cljs.core.truth_(or__3824__auto____15136)) {
                return or__3824__auto____15136
              }else {
                var or__3824__auto____15137 = p2.call(null, y);
                if(cljs.core.truth_(or__3824__auto____15137)) {
                  return or__3824__auto____15137
                }else {
                  return p3.call(null, y)
                }
              }
            }
          }
        }
      };
      var sp3__15178 = function(x, y, z) {
        var or__3824__auto____15138 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____15138)) {
          return or__3824__auto____15138
        }else {
          var or__3824__auto____15139 = p2.call(null, x);
          if(cljs.core.truth_(or__3824__auto____15139)) {
            return or__3824__auto____15139
          }else {
            var or__3824__auto____15140 = p3.call(null, x);
            if(cljs.core.truth_(or__3824__auto____15140)) {
              return or__3824__auto____15140
            }else {
              var or__3824__auto____15141 = p1.call(null, y);
              if(cljs.core.truth_(or__3824__auto____15141)) {
                return or__3824__auto____15141
              }else {
                var or__3824__auto____15142 = p2.call(null, y);
                if(cljs.core.truth_(or__3824__auto____15142)) {
                  return or__3824__auto____15142
                }else {
                  var or__3824__auto____15143 = p3.call(null, y);
                  if(cljs.core.truth_(or__3824__auto____15143)) {
                    return or__3824__auto____15143
                  }else {
                    var or__3824__auto____15144 = p1.call(null, z);
                    if(cljs.core.truth_(or__3824__auto____15144)) {
                      return or__3824__auto____15144
                    }else {
                      var or__3824__auto____15145 = p2.call(null, z);
                      if(cljs.core.truth_(or__3824__auto____15145)) {
                        return or__3824__auto____15145
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
      var sp3__15179 = function() {
        var G__15181__delegate = function(x, y, z, args) {
          var or__3824__auto____15146 = sp3.call(null, x, y, z);
          if(cljs.core.truth_(or__3824__auto____15146)) {
            return or__3824__auto____15146
          }else {
            return cljs.core.some.call(null, function(p1__15033_SHARP_) {
              var or__3824__auto____15147 = p1.call(null, p1__15033_SHARP_);
              if(cljs.core.truth_(or__3824__auto____15147)) {
                return or__3824__auto____15147
              }else {
                var or__3824__auto____15148 = p2.call(null, p1__15033_SHARP_);
                if(cljs.core.truth_(or__3824__auto____15148)) {
                  return or__3824__auto____15148
                }else {
                  return p3.call(null, p1__15033_SHARP_)
                }
              }
            }, args)
          }
        };
        var G__15181 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__15181__delegate.call(this, x, y, z, args)
        };
        G__15181.cljs$lang$maxFixedArity = 3;
        G__15181.cljs$lang$applyTo = function(arglist__15182) {
          var x = cljs.core.first(arglist__15182);
          var y = cljs.core.first(cljs.core.next(arglist__15182));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__15182)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__15182)));
          return G__15181__delegate.call(this, x, y, z, args)
        };
        return G__15181
      }();
      sp3 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return sp3__15175.call(this);
          case 1:
            return sp3__15176.call(this, x);
          case 2:
            return sp3__15177.call(this, x, y);
          case 3:
            return sp3__15178.call(this, x, y, z);
          default:
            return sp3__15179.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      sp3.cljs$lang$maxFixedArity = 3;
      sp3.cljs$lang$applyTo = sp3__15179.cljs$lang$applyTo;
      return sp3
    }()
  };
  var some_fn__15157 = function() {
    var G__15183__delegate = function(p1, p2, p3, ps) {
      var ps__15149 = cljs.core.list_STAR_.call(null, p1, p2, p3, ps);
      return function() {
        var spn = null;
        var spn__15184 = function() {
          return null
        };
        var spn__15185 = function(x) {
          return cljs.core.some.call(null, function(p1__15034_SHARP_) {
            return p1__15034_SHARP_.call(null, x)
          }, ps__15149)
        };
        var spn__15186 = function(x, y) {
          return cljs.core.some.call(null, function(p1__15035_SHARP_) {
            var or__3824__auto____15150 = p1__15035_SHARP_.call(null, x);
            if(cljs.core.truth_(or__3824__auto____15150)) {
              return or__3824__auto____15150
            }else {
              return p1__15035_SHARP_.call(null, y)
            }
          }, ps__15149)
        };
        var spn__15187 = function(x, y, z) {
          return cljs.core.some.call(null, function(p1__15036_SHARP_) {
            var or__3824__auto____15151 = p1__15036_SHARP_.call(null, x);
            if(cljs.core.truth_(or__3824__auto____15151)) {
              return or__3824__auto____15151
            }else {
              var or__3824__auto____15152 = p1__15036_SHARP_.call(null, y);
              if(cljs.core.truth_(or__3824__auto____15152)) {
                return or__3824__auto____15152
              }else {
                return p1__15036_SHARP_.call(null, z)
              }
            }
          }, ps__15149)
        };
        var spn__15188 = function() {
          var G__15190__delegate = function(x, y, z, args) {
            var or__3824__auto____15153 = spn.call(null, x, y, z);
            if(cljs.core.truth_(or__3824__auto____15153)) {
              return or__3824__auto____15153
            }else {
              return cljs.core.some.call(null, function(p1__15037_SHARP_) {
                return cljs.core.some.call(null, p1__15037_SHARP_, args)
              }, ps__15149)
            }
          };
          var G__15190 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__15190__delegate.call(this, x, y, z, args)
          };
          G__15190.cljs$lang$maxFixedArity = 3;
          G__15190.cljs$lang$applyTo = function(arglist__15191) {
            var x = cljs.core.first(arglist__15191);
            var y = cljs.core.first(cljs.core.next(arglist__15191));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__15191)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__15191)));
            return G__15190__delegate.call(this, x, y, z, args)
          };
          return G__15190
        }();
        spn = function(x, y, z, var_args) {
          var args = var_args;
          switch(arguments.length) {
            case 0:
              return spn__15184.call(this);
            case 1:
              return spn__15185.call(this, x);
            case 2:
              return spn__15186.call(this, x, y);
            case 3:
              return spn__15187.call(this, x, y, z);
            default:
              return spn__15188.apply(this, arguments)
          }
          throw"Invalid arity: " + arguments.length;
        };
        spn.cljs$lang$maxFixedArity = 3;
        spn.cljs$lang$applyTo = spn__15188.cljs$lang$applyTo;
        return spn
      }()
    };
    var G__15183 = function(p1, p2, p3, var_args) {
      var ps = null;
      if(goog.isDef(var_args)) {
        ps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__15183__delegate.call(this, p1, p2, p3, ps)
    };
    G__15183.cljs$lang$maxFixedArity = 3;
    G__15183.cljs$lang$applyTo = function(arglist__15192) {
      var p1 = cljs.core.first(arglist__15192);
      var p2 = cljs.core.first(cljs.core.next(arglist__15192));
      var p3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__15192)));
      var ps = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__15192)));
      return G__15183__delegate.call(this, p1, p2, p3, ps)
    };
    return G__15183
  }();
  some_fn = function(p1, p2, p3, var_args) {
    var ps = var_args;
    switch(arguments.length) {
      case 1:
        return some_fn__15154.call(this, p1);
      case 2:
        return some_fn__15155.call(this, p1, p2);
      case 3:
        return some_fn__15156.call(this, p1, p2, p3);
      default:
        return some_fn__15157.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  some_fn.cljs$lang$maxFixedArity = 3;
  some_fn.cljs$lang$applyTo = some_fn__15157.cljs$lang$applyTo;
  return some_fn
}();
cljs.core.map = function() {
  var map = null;
  var map__15205 = function(f, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____15193 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3974__auto____15193)) {
        var s__15194 = temp__3974__auto____15193;
        return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s__15194)), map.call(null, f, cljs.core.rest.call(null, s__15194)))
      }else {
        return null
      }
    })
  };
  var map__15206 = function(f, c1, c2) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1__15195 = cljs.core.seq.call(null, c1);
      var s2__15196 = cljs.core.seq.call(null, c2);
      if(cljs.core.truth_(function() {
        var and__3822__auto____15197 = s1__15195;
        if(cljs.core.truth_(and__3822__auto____15197)) {
          return s2__15196
        }else {
          return and__3822__auto____15197
        }
      }())) {
        return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s1__15195), cljs.core.first.call(null, s2__15196)), map.call(null, f, cljs.core.rest.call(null, s1__15195), cljs.core.rest.call(null, s2__15196)))
      }else {
        return null
      }
    })
  };
  var map__15207 = function(f, c1, c2, c3) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1__15198 = cljs.core.seq.call(null, c1);
      var s2__15199 = cljs.core.seq.call(null, c2);
      var s3__15200 = cljs.core.seq.call(null, c3);
      if(cljs.core.truth_(function() {
        var and__3822__auto____15201 = s1__15198;
        if(cljs.core.truth_(and__3822__auto____15201)) {
          var and__3822__auto____15202 = s2__15199;
          if(cljs.core.truth_(and__3822__auto____15202)) {
            return s3__15200
          }else {
            return and__3822__auto____15202
          }
        }else {
          return and__3822__auto____15201
        }
      }())) {
        return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s1__15198), cljs.core.first.call(null, s2__15199), cljs.core.first.call(null, s3__15200)), map.call(null, f, cljs.core.rest.call(null, s1__15198), cljs.core.rest.call(null, s2__15199), cljs.core.rest.call(null, s3__15200)))
      }else {
        return null
      }
    })
  };
  var map__15208 = function() {
    var G__15210__delegate = function(f, c1, c2, c3, colls) {
      var step__15204 = function step(cs) {
        return new cljs.core.LazySeq(null, false, function() {
          var ss__15203 = map.call(null, cljs.core.seq, cs);
          if(cljs.core.truth_(cljs.core.every_QMARK_.call(null, cljs.core.identity, ss__15203))) {
            return cljs.core.cons.call(null, map.call(null, cljs.core.first, ss__15203), step.call(null, map.call(null, cljs.core.rest, ss__15203)))
          }else {
            return null
          }
        })
      };
      return map.call(null, function(p1__15115_SHARP_) {
        return cljs.core.apply.call(null, f, p1__15115_SHARP_)
      }, step__15204.call(null, cljs.core.conj.call(null, colls, c3, c2, c1)))
    };
    var G__15210 = function(f, c1, c2, c3, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__15210__delegate.call(this, f, c1, c2, c3, colls)
    };
    G__15210.cljs$lang$maxFixedArity = 4;
    G__15210.cljs$lang$applyTo = function(arglist__15211) {
      var f = cljs.core.first(arglist__15211);
      var c1 = cljs.core.first(cljs.core.next(arglist__15211));
      var c2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__15211)));
      var c3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__15211))));
      var colls = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__15211))));
      return G__15210__delegate.call(this, f, c1, c2, c3, colls)
    };
    return G__15210
  }();
  map = function(f, c1, c2, c3, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return map__15205.call(this, f, c1);
      case 3:
        return map__15206.call(this, f, c1, c2);
      case 4:
        return map__15207.call(this, f, c1, c2, c3);
      default:
        return map__15208.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  map.cljs$lang$maxFixedArity = 4;
  map.cljs$lang$applyTo = map__15208.cljs$lang$applyTo;
  return map
}();
cljs.core.take = function take(n, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    if(cljs.core.truth_(n > 0)) {
      var temp__3974__auto____15212 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3974__auto____15212)) {
        var s__15213 = temp__3974__auto____15212;
        return cljs.core.cons.call(null, cljs.core.first.call(null, s__15213), take.call(null, n - 1, cljs.core.rest.call(null, s__15213)))
      }else {
        return null
      }
    }else {
      return null
    }
  })
};
cljs.core.drop = function drop(n, coll) {
  var step__15216 = function(n, coll) {
    while(true) {
      var s__15214 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(function() {
        var and__3822__auto____15215 = n > 0;
        if(cljs.core.truth_(and__3822__auto____15215)) {
          return s__15214
        }else {
          return and__3822__auto____15215
        }
      }())) {
        var G__15217 = n - 1;
        var G__15218 = cljs.core.rest.call(null, s__15214);
        n = G__15217;
        coll = G__15218;
        continue
      }else {
        return s__15214
      }
      break
    }
  };
  return new cljs.core.LazySeq(null, false, function() {
    return step__15216.call(null, n, coll)
  })
};
cljs.core.drop_last = function() {
  var drop_last = null;
  var drop_last__15219 = function(s) {
    return drop_last.call(null, 1, s)
  };
  var drop_last__15220 = function(n, s) {
    return cljs.core.map.call(null, function(x, _) {
      return x
    }, s, cljs.core.drop.call(null, n, s))
  };
  drop_last = function(n, s) {
    switch(arguments.length) {
      case 1:
        return drop_last__15219.call(this, n);
      case 2:
        return drop_last__15220.call(this, n, s)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return drop_last
}();
cljs.core.take_last = function take_last(n, coll) {
  var s__15222 = cljs.core.seq.call(null, coll);
  var lead__15223 = cljs.core.seq.call(null, cljs.core.drop.call(null, n, coll));
  while(true) {
    if(cljs.core.truth_(lead__15223)) {
      var G__15224 = cljs.core.next.call(null, s__15222);
      var G__15225 = cljs.core.next.call(null, lead__15223);
      s__15222 = G__15224;
      lead__15223 = G__15225;
      continue
    }else {
      return s__15222
    }
    break
  }
};
cljs.core.drop_while = function drop_while(pred, coll) {
  var step__15228 = function(pred, coll) {
    while(true) {
      var s__15226 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(function() {
        var and__3822__auto____15227 = s__15226;
        if(cljs.core.truth_(and__3822__auto____15227)) {
          return pred.call(null, cljs.core.first.call(null, s__15226))
        }else {
          return and__3822__auto____15227
        }
      }())) {
        var G__15229 = pred;
        var G__15230 = cljs.core.rest.call(null, s__15226);
        pred = G__15229;
        coll = G__15230;
        continue
      }else {
        return s__15226
      }
      break
    }
  };
  return new cljs.core.LazySeq(null, false, function() {
    return step__15228.call(null, pred, coll)
  })
};
cljs.core.cycle = function cycle(coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____15231 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3974__auto____15231)) {
      var s__15232 = temp__3974__auto____15231;
      return cljs.core.concat.call(null, s__15232, cycle.call(null, s__15232))
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
  var repeat__15233 = function(x) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, x, repeat.call(null, x))
    })
  };
  var repeat__15234 = function(n, x) {
    return cljs.core.take.call(null, n, repeat.call(null, x))
  };
  repeat = function(n, x) {
    switch(arguments.length) {
      case 1:
        return repeat__15233.call(this, n);
      case 2:
        return repeat__15234.call(this, n, x)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return repeat
}();
cljs.core.replicate = function replicate(n, x) {
  return cljs.core.take.call(null, n, cljs.core.repeat.call(null, x))
};
cljs.core.repeatedly = function() {
  var repeatedly = null;
  var repeatedly__15236 = function(f) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, f.call(null), repeatedly.call(null, f))
    })
  };
  var repeatedly__15237 = function(n, f) {
    return cljs.core.take.call(null, n, repeatedly.call(null, f))
  };
  repeatedly = function(n, f) {
    switch(arguments.length) {
      case 1:
        return repeatedly__15236.call(this, n);
      case 2:
        return repeatedly__15237.call(this, n, f)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return repeatedly
}();
cljs.core.iterate = function iterate(f, x) {
  return cljs.core.cons.call(null, x, new cljs.core.LazySeq(null, false, function() {
    return iterate.call(null, f, f.call(null, x))
  }))
};
cljs.core.interleave = function() {
  var interleave = null;
  var interleave__15243 = function(c1, c2) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1__15239 = cljs.core.seq.call(null, c1);
      var s2__15240 = cljs.core.seq.call(null, c2);
      if(cljs.core.truth_(function() {
        var and__3822__auto____15241 = s1__15239;
        if(cljs.core.truth_(and__3822__auto____15241)) {
          return s2__15240
        }else {
          return and__3822__auto____15241
        }
      }())) {
        return cljs.core.cons.call(null, cljs.core.first.call(null, s1__15239), cljs.core.cons.call(null, cljs.core.first.call(null, s2__15240), interleave.call(null, cljs.core.rest.call(null, s1__15239), cljs.core.rest.call(null, s2__15240))))
      }else {
        return null
      }
    })
  };
  var interleave__15244 = function() {
    var G__15246__delegate = function(c1, c2, colls) {
      return new cljs.core.LazySeq(null, false, function() {
        var ss__15242 = cljs.core.map.call(null, cljs.core.seq, cljs.core.conj.call(null, colls, c2, c1));
        if(cljs.core.truth_(cljs.core.every_QMARK_.call(null, cljs.core.identity, ss__15242))) {
          return cljs.core.concat.call(null, cljs.core.map.call(null, cljs.core.first, ss__15242), cljs.core.apply.call(null, interleave, cljs.core.map.call(null, cljs.core.rest, ss__15242)))
        }else {
          return null
        }
      })
    };
    var G__15246 = function(c1, c2, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__15246__delegate.call(this, c1, c2, colls)
    };
    G__15246.cljs$lang$maxFixedArity = 2;
    G__15246.cljs$lang$applyTo = function(arglist__15247) {
      var c1 = cljs.core.first(arglist__15247);
      var c2 = cljs.core.first(cljs.core.next(arglist__15247));
      var colls = cljs.core.rest(cljs.core.next(arglist__15247));
      return G__15246__delegate.call(this, c1, c2, colls)
    };
    return G__15246
  }();
  interleave = function(c1, c2, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return interleave__15243.call(this, c1, c2);
      default:
        return interleave__15244.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  interleave.cljs$lang$maxFixedArity = 2;
  interleave.cljs$lang$applyTo = interleave__15244.cljs$lang$applyTo;
  return interleave
}();
cljs.core.interpose = function interpose(sep, coll) {
  return cljs.core.drop.call(null, 1, cljs.core.interleave.call(null, cljs.core.repeat.call(null, sep), coll))
};
cljs.core.flatten1 = function flatten1(colls) {
  var cat__15250 = function cat(coll, colls) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3971__auto____15248 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3971__auto____15248)) {
        var coll__15249 = temp__3971__auto____15248;
        return cljs.core.cons.call(null, cljs.core.first.call(null, coll__15249), cat.call(null, cljs.core.rest.call(null, coll__15249), colls))
      }else {
        if(cljs.core.truth_(cljs.core.seq.call(null, colls))) {
          return cat.call(null, cljs.core.first.call(null, colls), cljs.core.rest.call(null, colls))
        }else {
          return null
        }
      }
    })
  };
  return cat__15250.call(null, null, colls)
};
cljs.core.mapcat = function() {
  var mapcat = null;
  var mapcat__15251 = function(f, coll) {
    return cljs.core.flatten1.call(null, cljs.core.map.call(null, f, coll))
  };
  var mapcat__15252 = function() {
    var G__15254__delegate = function(f, coll, colls) {
      return cljs.core.flatten1.call(null, cljs.core.apply.call(null, cljs.core.map, f, coll, colls))
    };
    var G__15254 = function(f, coll, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__15254__delegate.call(this, f, coll, colls)
    };
    G__15254.cljs$lang$maxFixedArity = 2;
    G__15254.cljs$lang$applyTo = function(arglist__15255) {
      var f = cljs.core.first(arglist__15255);
      var coll = cljs.core.first(cljs.core.next(arglist__15255));
      var colls = cljs.core.rest(cljs.core.next(arglist__15255));
      return G__15254__delegate.call(this, f, coll, colls)
    };
    return G__15254
  }();
  mapcat = function(f, coll, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return mapcat__15251.call(this, f, coll);
      default:
        return mapcat__15252.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  mapcat.cljs$lang$maxFixedArity = 2;
  mapcat.cljs$lang$applyTo = mapcat__15252.cljs$lang$applyTo;
  return mapcat
}();
cljs.core.filter = function filter(pred, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____15256 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3974__auto____15256)) {
      var s__15257 = temp__3974__auto____15256;
      var f__15258 = cljs.core.first.call(null, s__15257);
      var r__15259 = cljs.core.rest.call(null, s__15257);
      if(cljs.core.truth_(pred.call(null, f__15258))) {
        return cljs.core.cons.call(null, f__15258, filter.call(null, pred, r__15259))
      }else {
        return filter.call(null, pred, r__15259)
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
  var walk__15261 = function walk(node) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, node, cljs.core.truth_(branch_QMARK_.call(null, node)) ? cljs.core.mapcat.call(null, walk, children.call(null, node)) : null)
    })
  };
  return walk__15261.call(null, root)
};
cljs.core.flatten = function flatten(x) {
  return cljs.core.filter.call(null, function(p1__15260_SHARP_) {
    return cljs.core.not.call(null, cljs.core.sequential_QMARK_.call(null, p1__15260_SHARP_))
  }, cljs.core.rest.call(null, cljs.core.tree_seq.call(null, cljs.core.sequential_QMARK_, cljs.core.seq, x)))
};
cljs.core.into = function into(to, from) {
  return cljs.core.reduce.call(null, cljs.core._conj, to, from)
};
cljs.core.partition = function() {
  var partition = null;
  var partition__15268 = function(n, coll) {
    return partition.call(null, n, n, coll)
  };
  var partition__15269 = function(n, step, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____15262 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3974__auto____15262)) {
        var s__15263 = temp__3974__auto____15262;
        var p__15264 = cljs.core.take.call(null, n, s__15263);
        if(cljs.core.truth_(cljs.core._EQ_.call(null, n, cljs.core.count.call(null, p__15264)))) {
          return cljs.core.cons.call(null, p__15264, partition.call(null, n, step, cljs.core.drop.call(null, step, s__15263)))
        }else {
          return null
        }
      }else {
        return null
      }
    })
  };
  var partition__15270 = function(n, step, pad, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____15265 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3974__auto____15265)) {
        var s__15266 = temp__3974__auto____15265;
        var p__15267 = cljs.core.take.call(null, n, s__15266);
        if(cljs.core.truth_(cljs.core._EQ_.call(null, n, cljs.core.count.call(null, p__15267)))) {
          return cljs.core.cons.call(null, p__15267, partition.call(null, n, step, pad, cljs.core.drop.call(null, step, s__15266)))
        }else {
          return cljs.core.list.call(null, cljs.core.take.call(null, n, cljs.core.concat.call(null, p__15267, pad)))
        }
      }else {
        return null
      }
    })
  };
  partition = function(n, step, pad, coll) {
    switch(arguments.length) {
      case 2:
        return partition__15268.call(this, n, step);
      case 3:
        return partition__15269.call(this, n, step, pad);
      case 4:
        return partition__15270.call(this, n, step, pad, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return partition
}();
cljs.core.get_in = function() {
  var get_in = null;
  var get_in__15276 = function(m, ks) {
    return cljs.core.reduce.call(null, cljs.core.get, m, ks)
  };
  var get_in__15277 = function(m, ks, not_found) {
    var sentinel__15272 = cljs.core.lookup_sentinel;
    var m__15273 = m;
    var ks__15274 = cljs.core.seq.call(null, ks);
    while(true) {
      if(cljs.core.truth_(ks__15274)) {
        var m__15275 = cljs.core.get.call(null, m__15273, cljs.core.first.call(null, ks__15274), sentinel__15272);
        if(cljs.core.truth_(sentinel__15272 === m__15275)) {
          return not_found
        }else {
          var G__15279 = sentinel__15272;
          var G__15280 = m__15275;
          var G__15281 = cljs.core.next.call(null, ks__15274);
          sentinel__15272 = G__15279;
          m__15273 = G__15280;
          ks__15274 = G__15281;
          continue
        }
      }else {
        return m__15273
      }
      break
    }
  };
  get_in = function(m, ks, not_found) {
    switch(arguments.length) {
      case 2:
        return get_in__15276.call(this, m, ks);
      case 3:
        return get_in__15277.call(this, m, ks, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return get_in
}();
cljs.core.assoc_in = function assoc_in(m, p__15282, v) {
  var vec__15283__15284 = p__15282;
  var k__15285 = cljs.core.nth.call(null, vec__15283__15284, 0, null);
  var ks__15286 = cljs.core.nthnext.call(null, vec__15283__15284, 1);
  if(cljs.core.truth_(ks__15286)) {
    return cljs.core.assoc.call(null, m, k__15285, assoc_in.call(null, cljs.core.get.call(null, m, k__15285), ks__15286, v))
  }else {
    return cljs.core.assoc.call(null, m, k__15285, v)
  }
};
cljs.core.update_in = function() {
  var update_in__delegate = function(m, p__15287, f, args) {
    var vec__15288__15289 = p__15287;
    var k__15290 = cljs.core.nth.call(null, vec__15288__15289, 0, null);
    var ks__15291 = cljs.core.nthnext.call(null, vec__15288__15289, 1);
    if(cljs.core.truth_(ks__15291)) {
      return cljs.core.assoc.call(null, m, k__15290, cljs.core.apply.call(null, update_in, cljs.core.get.call(null, m, k__15290), ks__15291, f, args))
    }else {
      return cljs.core.assoc.call(null, m, k__15290, cljs.core.apply.call(null, f, cljs.core.get.call(null, m, k__15290), args))
    }
  };
  var update_in = function(m, p__15287, f, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
    }
    return update_in__delegate.call(this, m, p__15287, f, args)
  };
  update_in.cljs$lang$maxFixedArity = 3;
  update_in.cljs$lang$applyTo = function(arglist__15292) {
    var m = cljs.core.first(arglist__15292);
    var p__15287 = cljs.core.first(cljs.core.next(arglist__15292));
    var f = cljs.core.first(cljs.core.next(cljs.core.next(arglist__15292)));
    var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__15292)));
    return update_in__delegate.call(this, m, p__15287, f, args)
  };
  return update_in
}();
cljs.core.Vector = function(meta, array) {
  this.meta = meta;
  this.array = array
};
cljs.core.Vector.cljs$core$IPrintable$_pr_seq = function(this__367__auto__) {
  return cljs.core.list.call(null, "cljs.core.Vector")
};
cljs.core.Vector.prototype.cljs$core$IHash$ = true;
cljs.core.Vector.prototype.cljs$core$IHash$_hash = function(coll) {
  var this__15293 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.Vector.prototype.cljs$core$ILookup$ = true;
cljs.core.Vector.prototype.cljs$core$ILookup$_lookup = function() {
  var G__15326 = null;
  var G__15326__15327 = function(coll, k) {
    var this__15294 = this;
    return cljs.core._nth.call(null, coll, k, null)
  };
  var G__15326__15328 = function(coll, k, not_found) {
    var this__15295 = this;
    return cljs.core._nth.call(null, coll, k, not_found)
  };
  G__15326 = function(coll, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__15326__15327.call(this, coll, k);
      case 3:
        return G__15326__15328.call(this, coll, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__15326
}();
cljs.core.Vector.prototype.cljs$core$IAssociative$ = true;
cljs.core.Vector.prototype.cljs$core$IAssociative$_assoc = function(coll, k, v) {
  var this__15296 = this;
  var new_array__15297 = cljs.core.aclone.call(null, this__15296.array);
  new_array__15297[k] = v;
  return new cljs.core.Vector(this__15296.meta, new_array__15297)
};
cljs.core.Vector.prototype.cljs$core$IFn$ = true;
cljs.core.Vector.prototype.call = function() {
  var G__15330 = null;
  var G__15330__15331 = function(tsym15298, k) {
    var this__15300 = this;
    var tsym15298__15301 = this;
    var coll__15302 = tsym15298__15301;
    return cljs.core._lookup.call(null, coll__15302, k)
  };
  var G__15330__15332 = function(tsym15299, k, not_found) {
    var this__15303 = this;
    var tsym15299__15304 = this;
    var coll__15305 = tsym15299__15304;
    return cljs.core._lookup.call(null, coll__15305, k, not_found)
  };
  G__15330 = function(tsym15299, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__15330__15331.call(this, tsym15299, k);
      case 3:
        return G__15330__15332.call(this, tsym15299, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__15330
}();
cljs.core.Vector.prototype.cljs$core$ISequential$ = true;
cljs.core.Vector.prototype.cljs$core$ICollection$ = true;
cljs.core.Vector.prototype.cljs$core$ICollection$_conj = function(coll, o) {
  var this__15306 = this;
  var new_array__15307 = cljs.core.aclone.call(null, this__15306.array);
  new_array__15307.push(o);
  return new cljs.core.Vector(this__15306.meta, new_array__15307)
};
cljs.core.Vector.prototype.cljs$core$IReduce$ = true;
cljs.core.Vector.prototype.cljs$core$IReduce$_reduce = function() {
  var G__15334 = null;
  var G__15334__15335 = function(v, f) {
    var this__15308 = this;
    return cljs.core.ci_reduce.call(null, this__15308.array, f)
  };
  var G__15334__15336 = function(v, f, start) {
    var this__15309 = this;
    return cljs.core.ci_reduce.call(null, this__15309.array, f, start)
  };
  G__15334 = function(v, f, start) {
    switch(arguments.length) {
      case 2:
        return G__15334__15335.call(this, v, f);
      case 3:
        return G__15334__15336.call(this, v, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__15334
}();
cljs.core.Vector.prototype.cljs$core$ISeqable$ = true;
cljs.core.Vector.prototype.cljs$core$ISeqable$_seq = function(coll) {
  var this__15310 = this;
  if(cljs.core.truth_(this__15310.array.length > 0)) {
    var vector_seq__15311 = function vector_seq(i) {
      return new cljs.core.LazySeq(null, false, function() {
        if(cljs.core.truth_(i < this__15310.array.length)) {
          return cljs.core.cons.call(null, this__15310.array[i], vector_seq.call(null, i + 1))
        }else {
          return null
        }
      })
    };
    return vector_seq__15311.call(null, 0)
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$ICounted$ = true;
cljs.core.Vector.prototype.cljs$core$ICounted$_count = function(coll) {
  var this__15312 = this;
  return this__15312.array.length
};
cljs.core.Vector.prototype.cljs$core$IStack$ = true;
cljs.core.Vector.prototype.cljs$core$IStack$_peek = function(coll) {
  var this__15313 = this;
  var count__15314 = this__15313.array.length;
  if(cljs.core.truth_(count__15314 > 0)) {
    return this__15313.array[count__15314 - 1]
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$IStack$_pop = function(coll) {
  var this__15315 = this;
  if(cljs.core.truth_(this__15315.array.length > 0)) {
    var new_array__15316 = cljs.core.aclone.call(null, this__15315.array);
    new_array__15316.pop();
    return new cljs.core.Vector(this__15315.meta, new_array__15316)
  }else {
    throw new Error("Can't pop empty vector");
  }
};
cljs.core.Vector.prototype.cljs$core$IVector$ = true;
cljs.core.Vector.prototype.cljs$core$IVector$_assoc_n = function(coll, n, val) {
  var this__15317 = this;
  return cljs.core._assoc.call(null, coll, n, val)
};
cljs.core.Vector.prototype.cljs$core$IEquiv$ = true;
cljs.core.Vector.prototype.cljs$core$IEquiv$_equiv = function(coll, other) {
  var this__15318 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Vector.prototype.cljs$core$IWithMeta$ = true;
cljs.core.Vector.prototype.cljs$core$IWithMeta$_with_meta = function(coll, meta) {
  var this__15319 = this;
  return new cljs.core.Vector(meta, this__15319.array)
};
cljs.core.Vector.prototype.cljs$core$IMeta$ = true;
cljs.core.Vector.prototype.cljs$core$IMeta$_meta = function(coll) {
  var this__15320 = this;
  return this__15320.meta
};
cljs.core.Vector.prototype.cljs$core$IIndexed$ = true;
cljs.core.Vector.prototype.cljs$core$IIndexed$_nth = function() {
  var G__15338 = null;
  var G__15338__15339 = function(coll, n) {
    var this__15321 = this;
    if(cljs.core.truth_(function() {
      var and__3822__auto____15322 = 0 <= n;
      if(cljs.core.truth_(and__3822__auto____15322)) {
        return n < this__15321.array.length
      }else {
        return and__3822__auto____15322
      }
    }())) {
      return this__15321.array[n]
    }else {
      return null
    }
  };
  var G__15338__15340 = function(coll, n, not_found) {
    var this__15323 = this;
    if(cljs.core.truth_(function() {
      var and__3822__auto____15324 = 0 <= n;
      if(cljs.core.truth_(and__3822__auto____15324)) {
        return n < this__15323.array.length
      }else {
        return and__3822__auto____15324
      }
    }())) {
      return this__15323.array[n]
    }else {
      return not_found
    }
  };
  G__15338 = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__15338__15339.call(this, coll, n);
      case 3:
        return G__15338__15340.call(this, coll, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__15338
}();
cljs.core.Vector.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.Vector.prototype.cljs$core$IEmptyableCollection$_empty = function(coll) {
  var this__15325 = this;
  return cljs.core.with_meta.call(null, cljs.core.Vector.EMPTY, this__15325.meta)
};
cljs.core.Vector;
cljs.core.Vector.EMPTY = new cljs.core.Vector(null, []);
cljs.core.Vector.fromArray = function(xs) {
  return new cljs.core.Vector(null, xs)
};
cljs.core.tail_off = function tail_off(pv) {
  var cnt__15342 = pv.cnt;
  if(cljs.core.truth_(cnt__15342 < 32)) {
    return 0
  }else {
    return cnt__15342 - 1 >> 5 << 5
  }
};
cljs.core.new_path = function new_path(level, node) {
  var ll__15343 = level;
  var ret__15344 = node;
  while(true) {
    if(cljs.core.truth_(cljs.core._EQ_.call(null, 0, ll__15343))) {
      return ret__15344
    }else {
      var embed__15345 = ret__15344;
      var r__15346 = cljs.core.aclone.call(null, cljs.core.PersistentVector.EMPTY_NODE);
      var ___15347 = r__15346[0] = embed__15345;
      var G__15348 = ll__15343 - 5;
      var G__15349 = r__15346;
      ll__15343 = G__15348;
      ret__15344 = G__15349;
      continue
    }
    break
  }
};
cljs.core.push_tail = function push_tail(pv, level, parent, tailnode) {
  var ret__15350 = cljs.core.aclone.call(null, parent);
  var subidx__15351 = pv.cnt - 1 >> level & 31;
  if(cljs.core.truth_(cljs.core._EQ_.call(null, 5, level))) {
    ret__15350[subidx__15351] = tailnode;
    return ret__15350
  }else {
    var temp__3971__auto____15352 = parent[subidx__15351];
    if(cljs.core.truth_(temp__3971__auto____15352)) {
      var child__15353 = temp__3971__auto____15352;
      var node_to_insert__15354 = push_tail.call(null, pv, level - 5, child__15353, tailnode);
      var ___15355 = ret__15350[subidx__15351] = node_to_insert__15354;
      return ret__15350
    }else {
      var node_to_insert__15356 = cljs.core.new_path.call(null, level - 5, tailnode);
      var ___15357 = ret__15350[subidx__15351] = node_to_insert__15356;
      return ret__15350
    }
  }
};
cljs.core.array_for = function array_for(pv, i) {
  if(cljs.core.truth_(function() {
    var and__3822__auto____15358 = 0 <= i;
    if(cljs.core.truth_(and__3822__auto____15358)) {
      return i < pv.cnt
    }else {
      return and__3822__auto____15358
    }
  }())) {
    if(cljs.core.truth_(i >= cljs.core.tail_off.call(null, pv))) {
      return pv.tail
    }else {
      var node__15359 = pv.root;
      var level__15360 = pv.shift;
      while(true) {
        if(cljs.core.truth_(level__15360 > 0)) {
          var G__15361 = node__15359[i >> level__15360 & 31];
          var G__15362 = level__15360 - 5;
          node__15359 = G__15361;
          level__15360 = G__15362;
          continue
        }else {
          return node__15359
        }
        break
      }
    }
  }else {
    throw new Error(cljs.core.str.call(null, "No item ", i, " in vector of length ", pv.cnt));
  }
};
cljs.core.do_assoc = function do_assoc(pv, level, node, i, val) {
  var ret__15363 = cljs.core.aclone.call(null, node);
  if(cljs.core.truth_(level === 0)) {
    ret__15363[i & 31] = val;
    return ret__15363
  }else {
    var subidx__15364 = i >> level & 31;
    var ___15365 = ret__15363[subidx__15364] = do_assoc.call(null, pv, level - 5, node[subidx__15364], i, val);
    return ret__15363
  }
};
cljs.core.pop_tail = function pop_tail(pv, level, node) {
  var subidx__15366 = pv.cnt - 2 >> level & 31;
  if(cljs.core.truth_(level > 5)) {
    var new_child__15367 = pop_tail.call(null, pv, level - 5, node[subidx__15366]);
    if(cljs.core.truth_(function() {
      var and__3822__auto____15368 = new_child__15367 === null;
      if(cljs.core.truth_(and__3822__auto____15368)) {
        return subidx__15366 === 0
      }else {
        return and__3822__auto____15368
      }
    }())) {
      return null
    }else {
      var ret__15369 = cljs.core.aclone.call(null, node);
      var ___15370 = ret__15369[subidx__15366] = new_child__15367;
      return ret__15369
    }
  }else {
    if(cljs.core.truth_(subidx__15366 === 0)) {
      return null
    }else {
      if(cljs.core.truth_("\ufdd0'else")) {
        var ret__15371 = cljs.core.aclone.call(null, node);
        var ___15372 = ret__15371[subidx__15366] = null;
        return ret__15371
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentVector = function(meta, cnt, shift, root, tail) {
  this.meta = meta;
  this.cnt = cnt;
  this.shift = shift;
  this.root = root;
  this.tail = tail
};
cljs.core.PersistentVector.cljs$core$IPrintable$_pr_seq = function(this__367__auto__) {
  return cljs.core.list.call(null, "cljs.core.PersistentVector")
};
cljs.core.PersistentVector.prototype.cljs$core$IHash$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IHash$_hash = function(coll) {
  var this__15373 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.PersistentVector.prototype.cljs$core$ILookup$ = true;
cljs.core.PersistentVector.prototype.cljs$core$ILookup$_lookup = function() {
  var G__15413 = null;
  var G__15413__15414 = function(coll, k) {
    var this__15374 = this;
    return cljs.core._nth.call(null, coll, k, null)
  };
  var G__15413__15415 = function(coll, k, not_found) {
    var this__15375 = this;
    return cljs.core._nth.call(null, coll, k, not_found)
  };
  G__15413 = function(coll, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__15413__15414.call(this, coll, k);
      case 3:
        return G__15413__15415.call(this, coll, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__15413
}();
cljs.core.PersistentVector.prototype.cljs$core$IAssociative$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IAssociative$_assoc = function(coll, k, v) {
  var this__15376 = this;
  if(cljs.core.truth_(function() {
    var and__3822__auto____15377 = 0 <= k;
    if(cljs.core.truth_(and__3822__auto____15377)) {
      return k < this__15376.cnt
    }else {
      return and__3822__auto____15377
    }
  }())) {
    if(cljs.core.truth_(cljs.core.tail_off.call(null, coll) <= k)) {
      var new_tail__15378 = cljs.core.aclone.call(null, this__15376.tail);
      new_tail__15378[k & 31] = v;
      return new cljs.core.PersistentVector(this__15376.meta, this__15376.cnt, this__15376.shift, this__15376.root, new_tail__15378)
    }else {
      return new cljs.core.PersistentVector(this__15376.meta, this__15376.cnt, this__15376.shift, cljs.core.do_assoc.call(null, coll, this__15376.shift, this__15376.root, k, v), this__15376.tail)
    }
  }else {
    if(cljs.core.truth_(cljs.core._EQ_.call(null, k, this__15376.cnt))) {
      return cljs.core._conj.call(null, coll, v)
    }else {
      if(cljs.core.truth_("\ufdd0'else")) {
        throw new Error(cljs.core.str.call(null, "Index ", k, " out of bounds  [0,", this__15376.cnt, "]"));
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IFn$ = true;
cljs.core.PersistentVector.prototype.call = function() {
  var G__15417 = null;
  var G__15417__15418 = function(tsym15379, k) {
    var this__15381 = this;
    var tsym15379__15382 = this;
    var coll__15383 = tsym15379__15382;
    return cljs.core._lookup.call(null, coll__15383, k)
  };
  var G__15417__15419 = function(tsym15380, k, not_found) {
    var this__15384 = this;
    var tsym15380__15385 = this;
    var coll__15386 = tsym15380__15385;
    return cljs.core._lookup.call(null, coll__15386, k, not_found)
  };
  G__15417 = function(tsym15380, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__15417__15418.call(this, tsym15380, k);
      case 3:
        return G__15417__15419.call(this, tsym15380, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__15417
}();
cljs.core.PersistentVector.prototype.cljs$core$ISequential$ = true;
cljs.core.PersistentVector.prototype.cljs$core$ICollection$ = true;
cljs.core.PersistentVector.prototype.cljs$core$ICollection$_conj = function(coll, o) {
  var this__15387 = this;
  if(cljs.core.truth_(this__15387.cnt - cljs.core.tail_off.call(null, coll) < 32)) {
    var new_tail__15388 = cljs.core.aclone.call(null, this__15387.tail);
    new_tail__15388.push(o);
    return new cljs.core.PersistentVector(this__15387.meta, this__15387.cnt + 1, this__15387.shift, this__15387.root, new_tail__15388)
  }else {
    var root_overflow_QMARK___15389 = this__15387.cnt >> 5 > 1 << this__15387.shift;
    var new_shift__15390 = cljs.core.truth_(root_overflow_QMARK___15389) ? this__15387.shift + 5 : this__15387.shift;
    var new_root__15392 = cljs.core.truth_(root_overflow_QMARK___15389) ? function() {
      var n_r__15391 = cljs.core.aclone.call(null, cljs.core.PersistentVector.EMPTY_NODE);
      n_r__15391[0] = this__15387.root;
      n_r__15391[1] = cljs.core.new_path.call(null, this__15387.shift, this__15387.tail);
      return n_r__15391
    }() : cljs.core.push_tail.call(null, coll, this__15387.shift, this__15387.root, this__15387.tail);
    return new cljs.core.PersistentVector(this__15387.meta, this__15387.cnt + 1, new_shift__15390, new_root__15392, [o])
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IReduce$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IReduce$_reduce = function() {
  var G__15421 = null;
  var G__15421__15422 = function(v, f) {
    var this__15393 = this;
    return cljs.core.ci_reduce.call(null, v, f)
  };
  var G__15421__15423 = function(v, f, start) {
    var this__15394 = this;
    return cljs.core.ci_reduce.call(null, v, f, start)
  };
  G__15421 = function(v, f, start) {
    switch(arguments.length) {
      case 2:
        return G__15421__15422.call(this, v, f);
      case 3:
        return G__15421__15423.call(this, v, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__15421
}();
cljs.core.PersistentVector.prototype.cljs$core$ISeqable$ = true;
cljs.core.PersistentVector.prototype.cljs$core$ISeqable$_seq = function(coll) {
  var this__15395 = this;
  if(cljs.core.truth_(this__15395.cnt > 0)) {
    var vector_seq__15396 = function vector_seq(i) {
      return new cljs.core.LazySeq(null, false, function() {
        if(cljs.core.truth_(i < this__15395.cnt)) {
          return cljs.core.cons.call(null, cljs.core._nth.call(null, coll, i), vector_seq.call(null, i + 1))
        }else {
          return null
        }
      })
    };
    return vector_seq__15396.call(null, 0)
  }else {
    return null
  }
};
cljs.core.PersistentVector.prototype.cljs$core$ICounted$ = true;
cljs.core.PersistentVector.prototype.cljs$core$ICounted$_count = function(coll) {
  var this__15397 = this;
  return this__15397.cnt
};
cljs.core.PersistentVector.prototype.cljs$core$IStack$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IStack$_peek = function(coll) {
  var this__15398 = this;
  if(cljs.core.truth_(this__15398.cnt > 0)) {
    return cljs.core._nth.call(null, coll, this__15398.cnt - 1)
  }else {
    return null
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IStack$_pop = function(coll) {
  var this__15399 = this;
  if(cljs.core.truth_(this__15399.cnt === 0)) {
    throw new Error("Can't pop empty vector");
  }else {
    if(cljs.core.truth_(cljs.core._EQ_.call(null, 1, this__15399.cnt))) {
      return cljs.core._with_meta.call(null, cljs.core.PersistentVector.EMPTY, this__15399.meta)
    }else {
      if(cljs.core.truth_(1 < this__15399.cnt - cljs.core.tail_off.call(null, coll))) {
        return new cljs.core.PersistentVector(this__15399.meta, this__15399.cnt - 1, this__15399.shift, this__15399.root, cljs.core.aclone.call(null, this__15399.tail))
      }else {
        if(cljs.core.truth_("\ufdd0'else")) {
          var new_tail__15400 = cljs.core.array_for.call(null, coll, this__15399.cnt - 2);
          var nr__15401 = cljs.core.pop_tail.call(null, this__15399.shift, this__15399.root);
          var new_root__15402 = cljs.core.truth_(nr__15401 === null) ? cljs.core.PersistentVector.EMPTY_NODE : nr__15401;
          var cnt_1__15403 = this__15399.cnt - 1;
          if(cljs.core.truth_(function() {
            var and__3822__auto____15404 = 5 < this__15399.shift;
            if(cljs.core.truth_(and__3822__auto____15404)) {
              return new_root__15402[1] === null
            }else {
              return and__3822__auto____15404
            }
          }())) {
            return new cljs.core.PersistentVector(this__15399.meta, cnt_1__15403, this__15399.shift - 5, new_root__15402[0], new_tail__15400)
          }else {
            return new cljs.core.PersistentVector(this__15399.meta, cnt_1__15403, this__15399.shift, new_root__15402, new_tail__15400)
          }
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IVector$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IVector$_assoc_n = function(coll, n, val) {
  var this__15405 = this;
  return cljs.core._assoc.call(null, coll, n, val)
};
cljs.core.PersistentVector.prototype.cljs$core$IEquiv$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IEquiv$_equiv = function(coll, other) {
  var this__15406 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentVector.prototype.cljs$core$IWithMeta$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IWithMeta$_with_meta = function(coll, meta) {
  var this__15407 = this;
  return new cljs.core.PersistentVector(meta, this__15407.cnt, this__15407.shift, this__15407.root, this__15407.tail)
};
cljs.core.PersistentVector.prototype.cljs$core$IMeta$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IMeta$_meta = function(coll) {
  var this__15408 = this;
  return this__15408.meta
};
cljs.core.PersistentVector.prototype.cljs$core$IIndexed$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IIndexed$_nth = function() {
  var G__15425 = null;
  var G__15425__15426 = function(coll, n) {
    var this__15409 = this;
    return cljs.core.array_for.call(null, coll, n)[n & 31]
  };
  var G__15425__15427 = function(coll, n, not_found) {
    var this__15410 = this;
    if(cljs.core.truth_(function() {
      var and__3822__auto____15411 = 0 <= n;
      if(cljs.core.truth_(and__3822__auto____15411)) {
        return n < this__15410.cnt
      }else {
        return and__3822__auto____15411
      }
    }())) {
      return cljs.core._nth.call(null, coll, n)
    }else {
      return not_found
    }
  };
  G__15425 = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__15425__15426.call(this, coll, n);
      case 3:
        return G__15425__15427.call(this, coll, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__15425
}();
cljs.core.PersistentVector.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IEmptyableCollection$_empty = function(coll) {
  var this__15412 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.EMPTY, this__15412.meta)
};
cljs.core.PersistentVector;
cljs.core.PersistentVector.EMPTY_NODE = new Array(32);
cljs.core.PersistentVector.EMPTY = new cljs.core.PersistentVector(null, 0, 5, cljs.core.PersistentVector.EMPTY_NODE, []);
cljs.core.PersistentVector.fromArray = function(xs) {
  return cljs.core.into.call(null, cljs.core.PersistentVector.EMPTY, xs)
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
  vector.cljs$lang$applyTo = function(arglist__15429) {
    var args = cljs.core.seq(arglist__15429);
    return vector__delegate.call(this, args)
  };
  return vector
}();
cljs.core.Subvec = function(meta, v, start, end) {
  this.meta = meta;
  this.v = v;
  this.start = start;
  this.end = end
};
cljs.core.Subvec.cljs$core$IPrintable$_pr_seq = function(this__367__auto__) {
  return cljs.core.list.call(null, "cljs.core.Subvec")
};
cljs.core.Subvec.prototype.cljs$core$IHash$ = true;
cljs.core.Subvec.prototype.cljs$core$IHash$_hash = function(coll) {
  var this__15430 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.Subvec.prototype.cljs$core$ILookup$ = true;
cljs.core.Subvec.prototype.cljs$core$ILookup$_lookup = function() {
  var G__15458 = null;
  var G__15458__15459 = function(coll, k) {
    var this__15431 = this;
    return cljs.core._nth.call(null, coll, k, null)
  };
  var G__15458__15460 = function(coll, k, not_found) {
    var this__15432 = this;
    return cljs.core._nth.call(null, coll, k, not_found)
  };
  G__15458 = function(coll, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__15458__15459.call(this, coll, k);
      case 3:
        return G__15458__15460.call(this, coll, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__15458
}();
cljs.core.Subvec.prototype.cljs$core$IAssociative$ = true;
cljs.core.Subvec.prototype.cljs$core$IAssociative$_assoc = function(coll, key, val) {
  var this__15433 = this;
  var v_pos__15434 = this__15433.start + key;
  return new cljs.core.Subvec(this__15433.meta, cljs.core._assoc.call(null, this__15433.v, v_pos__15434, val), this__15433.start, this__15433.end > v_pos__15434 + 1 ? this__15433.end : v_pos__15434 + 1)
};
cljs.core.Subvec.prototype.cljs$core$IFn$ = true;
cljs.core.Subvec.prototype.call = function() {
  var G__15462 = null;
  var G__15462__15463 = function(tsym15435, k) {
    var this__15437 = this;
    var tsym15435__15438 = this;
    var coll__15439 = tsym15435__15438;
    return cljs.core._lookup.call(null, coll__15439, k)
  };
  var G__15462__15464 = function(tsym15436, k, not_found) {
    var this__15440 = this;
    var tsym15436__15441 = this;
    var coll__15442 = tsym15436__15441;
    return cljs.core._lookup.call(null, coll__15442, k, not_found)
  };
  G__15462 = function(tsym15436, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__15462__15463.call(this, tsym15436, k);
      case 3:
        return G__15462__15464.call(this, tsym15436, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__15462
}();
cljs.core.Subvec.prototype.cljs$core$ISequential$ = true;
cljs.core.Subvec.prototype.cljs$core$ICollection$ = true;
cljs.core.Subvec.prototype.cljs$core$ICollection$_conj = function(coll, o) {
  var this__15443 = this;
  return new cljs.core.Subvec(this__15443.meta, cljs.core._assoc_n.call(null, this__15443.v, this__15443.end, o), this__15443.start, this__15443.end + 1)
};
cljs.core.Subvec.prototype.cljs$core$IReduce$ = true;
cljs.core.Subvec.prototype.cljs$core$IReduce$_reduce = function() {
  var G__15466 = null;
  var G__15466__15467 = function(coll, f) {
    var this__15444 = this;
    return cljs.core.ci_reduce.call(null, coll, f)
  };
  var G__15466__15468 = function(coll, f, start) {
    var this__15445 = this;
    return cljs.core.ci_reduce.call(null, coll, f, start)
  };
  G__15466 = function(coll, f, start) {
    switch(arguments.length) {
      case 2:
        return G__15466__15467.call(this, coll, f);
      case 3:
        return G__15466__15468.call(this, coll, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__15466
}();
cljs.core.Subvec.prototype.cljs$core$ISeqable$ = true;
cljs.core.Subvec.prototype.cljs$core$ISeqable$_seq = function(coll) {
  var this__15446 = this;
  var subvec_seq__15447 = function subvec_seq(i) {
    if(cljs.core.truth_(cljs.core._EQ_.call(null, i, this__15446.end))) {
      return null
    }else {
      return cljs.core.cons.call(null, cljs.core._nth.call(null, this__15446.v, i), new cljs.core.LazySeq(null, false, function() {
        return subvec_seq.call(null, i + 1)
      }))
    }
  };
  return subvec_seq__15447.call(null, this__15446.start)
};
cljs.core.Subvec.prototype.cljs$core$ICounted$ = true;
cljs.core.Subvec.prototype.cljs$core$ICounted$_count = function(coll) {
  var this__15448 = this;
  return this__15448.end - this__15448.start
};
cljs.core.Subvec.prototype.cljs$core$IStack$ = true;
cljs.core.Subvec.prototype.cljs$core$IStack$_peek = function(coll) {
  var this__15449 = this;
  return cljs.core._nth.call(null, this__15449.v, this__15449.end - 1)
};
cljs.core.Subvec.prototype.cljs$core$IStack$_pop = function(coll) {
  var this__15450 = this;
  if(cljs.core.truth_(cljs.core._EQ_.call(null, this__15450.start, this__15450.end))) {
    throw new Error("Can't pop empty vector");
  }else {
    return new cljs.core.Subvec(this__15450.meta, this__15450.v, this__15450.start, this__15450.end - 1)
  }
};
cljs.core.Subvec.prototype.cljs$core$IVector$ = true;
cljs.core.Subvec.prototype.cljs$core$IVector$_assoc_n = function(coll, n, val) {
  var this__15451 = this;
  return cljs.core._assoc.call(null, coll, n, val)
};
cljs.core.Subvec.prototype.cljs$core$IEquiv$ = true;
cljs.core.Subvec.prototype.cljs$core$IEquiv$_equiv = function(coll, other) {
  var this__15452 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Subvec.prototype.cljs$core$IWithMeta$ = true;
cljs.core.Subvec.prototype.cljs$core$IWithMeta$_with_meta = function(coll, meta) {
  var this__15453 = this;
  return new cljs.core.Subvec(meta, this__15453.v, this__15453.start, this__15453.end)
};
cljs.core.Subvec.prototype.cljs$core$IMeta$ = true;
cljs.core.Subvec.prototype.cljs$core$IMeta$_meta = function(coll) {
  var this__15454 = this;
  return this__15454.meta
};
cljs.core.Subvec.prototype.cljs$core$IIndexed$ = true;
cljs.core.Subvec.prototype.cljs$core$IIndexed$_nth = function() {
  var G__15470 = null;
  var G__15470__15471 = function(coll, n) {
    var this__15455 = this;
    return cljs.core._nth.call(null, this__15455.v, this__15455.start + n)
  };
  var G__15470__15472 = function(coll, n, not_found) {
    var this__15456 = this;
    return cljs.core._nth.call(null, this__15456.v, this__15456.start + n, not_found)
  };
  G__15470 = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__15470__15471.call(this, coll, n);
      case 3:
        return G__15470__15472.call(this, coll, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__15470
}();
cljs.core.Subvec.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.Subvec.prototype.cljs$core$IEmptyableCollection$_empty = function(coll) {
  var this__15457 = this;
  return cljs.core.with_meta.call(null, cljs.core.Vector.EMPTY, this__15457.meta)
};
cljs.core.Subvec;
cljs.core.subvec = function() {
  var subvec = null;
  var subvec__15474 = function(v, start) {
    return subvec.call(null, v, start, cljs.core.count.call(null, v))
  };
  var subvec__15475 = function(v, start, end) {
    return new cljs.core.Subvec(null, v, start, end)
  };
  subvec = function(v, start, end) {
    switch(arguments.length) {
      case 2:
        return subvec__15474.call(this, v, start);
      case 3:
        return subvec__15475.call(this, v, start, end)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return subvec
}();
cljs.core.PersistentQueueSeq = function(meta, front, rear) {
  this.meta = meta;
  this.front = front;
  this.rear = rear
};
cljs.core.PersistentQueueSeq.cljs$core$IPrintable$_pr_seq = function(this__367__auto__) {
  return cljs.core.list.call(null, "cljs.core.PersistentQueueSeq")
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeqable$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeqable$_seq = function(coll) {
  var this__15477 = this;
  return coll
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IHash$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$IHash$_hash = function(coll) {
  var this__15478 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEquiv$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEquiv$_equiv = function(coll, other) {
  var this__15479 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISequential$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEmptyableCollection$_empty = function(coll) {
  var this__15480 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__15480.meta)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ICollection$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$ICollection$_conj = function(coll, o) {
  var this__15481 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeq$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeq$_first = function(coll) {
  var this__15482 = this;
  return cljs.core._first.call(null, this__15482.front)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeq$_rest = function(coll) {
  var this__15483 = this;
  var temp__3971__auto____15484 = cljs.core.next.call(null, this__15483.front);
  if(cljs.core.truth_(temp__3971__auto____15484)) {
    var f1__15485 = temp__3971__auto____15484;
    return new cljs.core.PersistentQueueSeq(this__15483.meta, f1__15485, this__15483.rear)
  }else {
    if(cljs.core.truth_(this__15483.rear === null)) {
      return cljs.core._empty.call(null, coll)
    }else {
      return new cljs.core.PersistentQueueSeq(this__15483.meta, this__15483.rear, null)
    }
  }
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IMeta$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$IMeta$_meta = function(coll) {
  var this__15486 = this;
  return this__15486.meta
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IWithMeta$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$IWithMeta$_with_meta = function(coll, meta) {
  var this__15487 = this;
  return new cljs.core.PersistentQueueSeq(meta, this__15487.front, this__15487.rear)
};
cljs.core.PersistentQueueSeq;
cljs.core.PersistentQueue = function(meta, count, front, rear) {
  this.meta = meta;
  this.count = count;
  this.front = front;
  this.rear = rear
};
cljs.core.PersistentQueue.cljs$core$IPrintable$_pr_seq = function(this__367__auto__) {
  return cljs.core.list.call(null, "cljs.core.PersistentQueue")
};
cljs.core.PersistentQueue.prototype.cljs$core$IHash$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IHash$_hash = function(coll) {
  var this__15488 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.PersistentQueue.prototype.cljs$core$ISequential$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$ICollection$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$ICollection$_conj = function(coll, o) {
  var this__15489 = this;
  if(cljs.core.truth_(this__15489.front)) {
    return new cljs.core.PersistentQueue(this__15489.meta, this__15489.count + 1, this__15489.front, cljs.core.conj.call(null, function() {
      var or__3824__auto____15490 = this__15489.rear;
      if(cljs.core.truth_(or__3824__auto____15490)) {
        return or__3824__auto____15490
      }else {
        return cljs.core.PersistentVector.fromArray([])
      }
    }(), o))
  }else {
    return new cljs.core.PersistentQueue(this__15489.meta, this__15489.count + 1, cljs.core.conj.call(null, this__15489.front, o), cljs.core.PersistentVector.fromArray([]))
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeqable$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$ISeqable$_seq = function(coll) {
  var this__15491 = this;
  var rear__15492 = cljs.core.seq.call(null, this__15491.rear);
  if(cljs.core.truth_(function() {
    var or__3824__auto____15493 = this__15491.front;
    if(cljs.core.truth_(or__3824__auto____15493)) {
      return or__3824__auto____15493
    }else {
      return rear__15492
    }
  }())) {
    return new cljs.core.PersistentQueueSeq(null, this__15491.front, cljs.core.seq.call(null, rear__15492))
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ICounted$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$ICounted$_count = function(coll) {
  var this__15494 = this;
  return this__15494.count
};
cljs.core.PersistentQueue.prototype.cljs$core$IStack$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IStack$_peek = function(coll) {
  var this__15495 = this;
  return cljs.core._first.call(null, this__15495.front)
};
cljs.core.PersistentQueue.prototype.cljs$core$IStack$_pop = function(coll) {
  var this__15496 = this;
  if(cljs.core.truth_(this__15496.front)) {
    var temp__3971__auto____15497 = cljs.core.next.call(null, this__15496.front);
    if(cljs.core.truth_(temp__3971__auto____15497)) {
      var f1__15498 = temp__3971__auto____15497;
      return new cljs.core.PersistentQueue(this__15496.meta, this__15496.count - 1, f1__15498, this__15496.rear)
    }else {
      return new cljs.core.PersistentQueue(this__15496.meta, this__15496.count - 1, cljs.core.seq.call(null, this__15496.rear), cljs.core.PersistentVector.fromArray([]))
    }
  }else {
    return coll
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeq$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$ISeq$_first = function(coll) {
  var this__15499 = this;
  return cljs.core.first.call(null, this__15499.front)
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeq$_rest = function(coll) {
  var this__15500 = this;
  return cljs.core.rest.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.PersistentQueue.prototype.cljs$core$IEquiv$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IEquiv$_equiv = function(coll, other) {
  var this__15501 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentQueue.prototype.cljs$core$IWithMeta$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IWithMeta$_with_meta = function(coll, meta) {
  var this__15502 = this;
  return new cljs.core.PersistentQueue(meta, this__15502.count, this__15502.front, this__15502.rear)
};
cljs.core.PersistentQueue.prototype.cljs$core$IMeta$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IMeta$_meta = function(coll) {
  var this__15503 = this;
  return this__15503.meta
};
cljs.core.PersistentQueue.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IEmptyableCollection$_empty = function(coll) {
  var this__15504 = this;
  return cljs.core.PersistentQueue.EMPTY
};
cljs.core.PersistentQueue;
cljs.core.PersistentQueue.EMPTY = new cljs.core.PersistentQueue(null, 0, null, cljs.core.PersistentVector.fromArray([]));
cljs.core.NeverEquiv = function() {
};
cljs.core.NeverEquiv.cljs$core$IPrintable$_pr_seq = function(this__367__auto__) {
  return cljs.core.list.call(null, "cljs.core.NeverEquiv")
};
cljs.core.NeverEquiv.prototype.cljs$core$IEquiv$ = true;
cljs.core.NeverEquiv.prototype.cljs$core$IEquiv$_equiv = function(o, other) {
  var this__15505 = this;
  return false
};
cljs.core.NeverEquiv;
cljs.core.never_equiv = new cljs.core.NeverEquiv;
cljs.core.equiv_map = function equiv_map(x, y) {
  return cljs.core.boolean$.call(null, cljs.core.truth_(cljs.core.map_QMARK_.call(null, y)) ? cljs.core.truth_(cljs.core._EQ_.call(null, cljs.core.count.call(null, x), cljs.core.count.call(null, y))) ? cljs.core.every_QMARK_.call(null, cljs.core.identity, cljs.core.map.call(null, function(xkv) {
    return cljs.core._EQ_.call(null, cljs.core.get.call(null, y, cljs.core.first.call(null, xkv), cljs.core.never_equiv), cljs.core.second.call(null, xkv))
  }, x)) : null : null)
};
cljs.core.scan_array = function scan_array(incr, k, array) {
  var len__15506 = array.length;
  var i__15507 = 0;
  while(true) {
    if(cljs.core.truth_(i__15507 < len__15506)) {
      if(cljs.core.truth_(cljs.core._EQ_.call(null, k, array[i__15507]))) {
        return i__15507
      }else {
        var G__15508 = i__15507 + incr;
        i__15507 = G__15508;
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
  var obj_map_contains_key_QMARK___15510 = function(k, strobj) {
    return obj_map_contains_key_QMARK_.call(null, k, strobj, true, false)
  };
  var obj_map_contains_key_QMARK___15511 = function(k, strobj, true_val, false_val) {
    if(cljs.core.truth_(function() {
      var and__3822__auto____15509 = goog.isString.call(null, k);
      if(cljs.core.truth_(and__3822__auto____15509)) {
        return strobj.hasOwnProperty(k)
      }else {
        return and__3822__auto____15509
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
        return obj_map_contains_key_QMARK___15510.call(this, k, strobj);
      case 4:
        return obj_map_contains_key_QMARK___15511.call(this, k, strobj, true_val, false_val)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return obj_map_contains_key_QMARK_
}();
cljs.core.obj_map_compare_keys = function obj_map_compare_keys(a, b) {
  var a__15514 = cljs.core.hash.call(null, a);
  var b__15515 = cljs.core.hash.call(null, b);
  if(cljs.core.truth_(a__15514 < b__15515)) {
    return-1
  }else {
    if(cljs.core.truth_(a__15514 > b__15515)) {
      return 1
    }else {
      if(cljs.core.truth_("\ufdd0'else")) {
        return 0
      }else {
        return null
      }
    }
  }
};
cljs.core.ObjMap = function(meta, keys, strobj) {
  this.meta = meta;
  this.keys = keys;
  this.strobj = strobj
};
cljs.core.ObjMap.cljs$core$IPrintable$_pr_seq = function(this__367__auto__) {
  return cljs.core.list.call(null, "cljs.core.ObjMap")
};
cljs.core.ObjMap.prototype.cljs$core$IHash$ = true;
cljs.core.ObjMap.prototype.cljs$core$IHash$_hash = function(coll) {
  var this__15516 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.ObjMap.prototype.cljs$core$ILookup$ = true;
cljs.core.ObjMap.prototype.cljs$core$ILookup$_lookup = function() {
  var G__15543 = null;
  var G__15543__15544 = function(coll, k) {
    var this__15517 = this;
    return cljs.core._lookup.call(null, coll, k, null)
  };
  var G__15543__15545 = function(coll, k, not_found) {
    var this__15518 = this;
    return cljs.core.obj_map_contains_key_QMARK_.call(null, k, this__15518.strobj, this__15518.strobj[k], not_found)
  };
  G__15543 = function(coll, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__15543__15544.call(this, coll, k);
      case 3:
        return G__15543__15545.call(this, coll, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__15543
}();
cljs.core.ObjMap.prototype.cljs$core$IAssociative$ = true;
cljs.core.ObjMap.prototype.cljs$core$IAssociative$_assoc = function(coll, k, v) {
  var this__15519 = this;
  if(cljs.core.truth_(goog.isString.call(null, k))) {
    var new_strobj__15520 = goog.object.clone.call(null, this__15519.strobj);
    var overwrite_QMARK___15521 = new_strobj__15520.hasOwnProperty(k);
    new_strobj__15520[k] = v;
    if(cljs.core.truth_(overwrite_QMARK___15521)) {
      return new cljs.core.ObjMap(this__15519.meta, this__15519.keys, new_strobj__15520)
    }else {
      var new_keys__15522 = cljs.core.aclone.call(null, this__15519.keys);
      new_keys__15522.push(k);
      return new cljs.core.ObjMap(this__15519.meta, new_keys__15522, new_strobj__15520)
    }
  }else {
    return cljs.core.with_meta.call(null, cljs.core.into.call(null, cljs.core.hash_map.call(null, k, v), cljs.core.seq.call(null, coll)), this__15519.meta)
  }
};
cljs.core.ObjMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_ = function(coll, k) {
  var this__15523 = this;
  return cljs.core.obj_map_contains_key_QMARK_.call(null, k, this__15523.strobj)
};
cljs.core.ObjMap.prototype.cljs$core$IFn$ = true;
cljs.core.ObjMap.prototype.call = function() {
  var G__15547 = null;
  var G__15547__15548 = function(tsym15524, k) {
    var this__15526 = this;
    var tsym15524__15527 = this;
    var coll__15528 = tsym15524__15527;
    return cljs.core._lookup.call(null, coll__15528, k)
  };
  var G__15547__15549 = function(tsym15525, k, not_found) {
    var this__15529 = this;
    var tsym15525__15530 = this;
    var coll__15531 = tsym15525__15530;
    return cljs.core._lookup.call(null, coll__15531, k, not_found)
  };
  G__15547 = function(tsym15525, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__15547__15548.call(this, tsym15525, k);
      case 3:
        return G__15547__15549.call(this, tsym15525, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__15547
}();
cljs.core.ObjMap.prototype.cljs$core$ICollection$ = true;
cljs.core.ObjMap.prototype.cljs$core$ICollection$_conj = function(coll, entry) {
  var this__15532 = this;
  if(cljs.core.truth_(cljs.core.vector_QMARK_.call(null, entry))) {
    return cljs.core._assoc.call(null, coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.ObjMap.prototype.cljs$core$ISeqable$ = true;
cljs.core.ObjMap.prototype.cljs$core$ISeqable$_seq = function(coll) {
  var this__15533 = this;
  if(cljs.core.truth_(this__15533.keys.length > 0)) {
    return cljs.core.map.call(null, function(p1__15513_SHARP_) {
      return cljs.core.vector.call(null, p1__15513_SHARP_, this__15533.strobj[p1__15513_SHARP_])
    }, this__15533.keys.sort(cljs.core.obj_map_compare_keys))
  }else {
    return null
  }
};
cljs.core.ObjMap.prototype.cljs$core$ICounted$ = true;
cljs.core.ObjMap.prototype.cljs$core$ICounted$_count = function(coll) {
  var this__15534 = this;
  return this__15534.keys.length
};
cljs.core.ObjMap.prototype.cljs$core$IEquiv$ = true;
cljs.core.ObjMap.prototype.cljs$core$IEquiv$_equiv = function(coll, other) {
  var this__15535 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.ObjMap.prototype.cljs$core$IWithMeta$ = true;
cljs.core.ObjMap.prototype.cljs$core$IWithMeta$_with_meta = function(coll, meta) {
  var this__15536 = this;
  return new cljs.core.ObjMap(meta, this__15536.keys, this__15536.strobj)
};
cljs.core.ObjMap.prototype.cljs$core$IMeta$ = true;
cljs.core.ObjMap.prototype.cljs$core$IMeta$_meta = function(coll) {
  var this__15537 = this;
  return this__15537.meta
};
cljs.core.ObjMap.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.ObjMap.prototype.cljs$core$IEmptyableCollection$_empty = function(coll) {
  var this__15538 = this;
  return cljs.core.with_meta.call(null, cljs.core.ObjMap.EMPTY, this__15538.meta)
};
cljs.core.ObjMap.prototype.cljs$core$IMap$ = true;
cljs.core.ObjMap.prototype.cljs$core$IMap$_dissoc = function(coll, k) {
  var this__15539 = this;
  if(cljs.core.truth_(function() {
    var and__3822__auto____15540 = goog.isString.call(null, k);
    if(cljs.core.truth_(and__3822__auto____15540)) {
      return this__15539.strobj.hasOwnProperty(k)
    }else {
      return and__3822__auto____15540
    }
  }())) {
    var new_keys__15541 = cljs.core.aclone.call(null, this__15539.keys);
    var new_strobj__15542 = goog.object.clone.call(null, this__15539.strobj);
    new_keys__15541.splice(cljs.core.scan_array.call(null, 1, k, new_keys__15541), 1);
    cljs.core.js_delete.call(null, new_strobj__15542, k);
    return new cljs.core.ObjMap(this__15539.meta, new_keys__15541, new_strobj__15542)
  }else {
    return coll
  }
};
cljs.core.ObjMap;
cljs.core.ObjMap.EMPTY = new cljs.core.ObjMap(null, [], cljs.core.js_obj.call(null));
cljs.core.ObjMap.fromObject = function(ks, obj) {
  return new cljs.core.ObjMap(null, ks, obj)
};
cljs.core.HashMap = function(meta, count, hashobj) {
  this.meta = meta;
  this.count = count;
  this.hashobj = hashobj
};
cljs.core.HashMap.cljs$core$IPrintable$_pr_seq = function(this__367__auto__) {
  return cljs.core.list.call(null, "cljs.core.HashMap")
};
cljs.core.HashMap.prototype.cljs$core$IHash$ = true;
cljs.core.HashMap.prototype.cljs$core$IHash$_hash = function(coll) {
  var this__15552 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.HashMap.prototype.cljs$core$ILookup$ = true;
cljs.core.HashMap.prototype.cljs$core$ILookup$_lookup = function() {
  var G__15590 = null;
  var G__15590__15591 = function(coll, k) {
    var this__15553 = this;
    return cljs.core._lookup.call(null, coll, k, null)
  };
  var G__15590__15592 = function(coll, k, not_found) {
    var this__15554 = this;
    var bucket__15555 = this__15554.hashobj[cljs.core.hash.call(null, k)];
    var i__15556 = cljs.core.truth_(bucket__15555) ? cljs.core.scan_array.call(null, 2, k, bucket__15555) : null;
    if(cljs.core.truth_(i__15556)) {
      return bucket__15555[i__15556 + 1]
    }else {
      return not_found
    }
  };
  G__15590 = function(coll, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__15590__15591.call(this, coll, k);
      case 3:
        return G__15590__15592.call(this, coll, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__15590
}();
cljs.core.HashMap.prototype.cljs$core$IAssociative$ = true;
cljs.core.HashMap.prototype.cljs$core$IAssociative$_assoc = function(coll, k, v) {
  var this__15557 = this;
  var h__15558 = cljs.core.hash.call(null, k);
  var bucket__15559 = this__15557.hashobj[h__15558];
  if(cljs.core.truth_(bucket__15559)) {
    var new_bucket__15560 = cljs.core.aclone.call(null, bucket__15559);
    var new_hashobj__15561 = goog.object.clone.call(null, this__15557.hashobj);
    new_hashobj__15561[h__15558] = new_bucket__15560;
    var temp__3971__auto____15562 = cljs.core.scan_array.call(null, 2, k, new_bucket__15560);
    if(cljs.core.truth_(temp__3971__auto____15562)) {
      var i__15563 = temp__3971__auto____15562;
      new_bucket__15560[i__15563 + 1] = v;
      return new cljs.core.HashMap(this__15557.meta, this__15557.count, new_hashobj__15561)
    }else {
      new_bucket__15560.push(k, v);
      return new cljs.core.HashMap(this__15557.meta, this__15557.count + 1, new_hashobj__15561)
    }
  }else {
    var new_hashobj__15564 = goog.object.clone.call(null, this__15557.hashobj);
    new_hashobj__15564[h__15558] = [k, v];
    return new cljs.core.HashMap(this__15557.meta, this__15557.count + 1, new_hashobj__15564)
  }
};
cljs.core.HashMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_ = function(coll, k) {
  var this__15565 = this;
  var bucket__15566 = this__15565.hashobj[cljs.core.hash.call(null, k)];
  var i__15567 = cljs.core.truth_(bucket__15566) ? cljs.core.scan_array.call(null, 2, k, bucket__15566) : null;
  if(cljs.core.truth_(i__15567)) {
    return true
  }else {
    return false
  }
};
cljs.core.HashMap.prototype.cljs$core$IFn$ = true;
cljs.core.HashMap.prototype.call = function() {
  var G__15594 = null;
  var G__15594__15595 = function(tsym15568, k) {
    var this__15570 = this;
    var tsym15568__15571 = this;
    var coll__15572 = tsym15568__15571;
    return cljs.core._lookup.call(null, coll__15572, k)
  };
  var G__15594__15596 = function(tsym15569, k, not_found) {
    var this__15573 = this;
    var tsym15569__15574 = this;
    var coll__15575 = tsym15569__15574;
    return cljs.core._lookup.call(null, coll__15575, k, not_found)
  };
  G__15594 = function(tsym15569, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__15594__15595.call(this, tsym15569, k);
      case 3:
        return G__15594__15596.call(this, tsym15569, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__15594
}();
cljs.core.HashMap.prototype.cljs$core$ICollection$ = true;
cljs.core.HashMap.prototype.cljs$core$ICollection$_conj = function(coll, entry) {
  var this__15576 = this;
  if(cljs.core.truth_(cljs.core.vector_QMARK_.call(null, entry))) {
    return cljs.core._assoc.call(null, coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.HashMap.prototype.cljs$core$ISeqable$ = true;
cljs.core.HashMap.prototype.cljs$core$ISeqable$_seq = function(coll) {
  var this__15577 = this;
  if(cljs.core.truth_(this__15577.count > 0)) {
    var hashes__15578 = cljs.core.js_keys.call(null, this__15577.hashobj).sort();
    return cljs.core.mapcat.call(null, function(p1__15551_SHARP_) {
      return cljs.core.map.call(null, cljs.core.vec, cljs.core.partition.call(null, 2, this__15577.hashobj[p1__15551_SHARP_]))
    }, hashes__15578)
  }else {
    return null
  }
};
cljs.core.HashMap.prototype.cljs$core$ICounted$ = true;
cljs.core.HashMap.prototype.cljs$core$ICounted$_count = function(coll) {
  var this__15579 = this;
  return this__15579.count
};
cljs.core.HashMap.prototype.cljs$core$IEquiv$ = true;
cljs.core.HashMap.prototype.cljs$core$IEquiv$_equiv = function(coll, other) {
  var this__15580 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.HashMap.prototype.cljs$core$IWithMeta$ = true;
cljs.core.HashMap.prototype.cljs$core$IWithMeta$_with_meta = function(coll, meta) {
  var this__15581 = this;
  return new cljs.core.HashMap(meta, this__15581.count, this__15581.hashobj)
};
cljs.core.HashMap.prototype.cljs$core$IMeta$ = true;
cljs.core.HashMap.prototype.cljs$core$IMeta$_meta = function(coll) {
  var this__15582 = this;
  return this__15582.meta
};
cljs.core.HashMap.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.HashMap.prototype.cljs$core$IEmptyableCollection$_empty = function(coll) {
  var this__15583 = this;
  return cljs.core.with_meta.call(null, cljs.core.HashMap.EMPTY, this__15583.meta)
};
cljs.core.HashMap.prototype.cljs$core$IMap$ = true;
cljs.core.HashMap.prototype.cljs$core$IMap$_dissoc = function(coll, k) {
  var this__15584 = this;
  var h__15585 = cljs.core.hash.call(null, k);
  var bucket__15586 = this__15584.hashobj[h__15585];
  var i__15587 = cljs.core.truth_(bucket__15586) ? cljs.core.scan_array.call(null, 2, k, bucket__15586) : null;
  if(cljs.core.truth_(cljs.core.not.call(null, i__15587))) {
    return coll
  }else {
    var new_hashobj__15588 = goog.object.clone.call(null, this__15584.hashobj);
    if(cljs.core.truth_(3 > bucket__15586.length)) {
      cljs.core.js_delete.call(null, new_hashobj__15588, h__15585)
    }else {
      var new_bucket__15589 = cljs.core.aclone.call(null, bucket__15586);
      new_bucket__15589.splice(i__15587, 2);
      new_hashobj__15588[h__15585] = new_bucket__15589
    }
    return new cljs.core.HashMap(this__15584.meta, this__15584.count - 1, new_hashobj__15588)
  }
};
cljs.core.HashMap;
cljs.core.HashMap.EMPTY = new cljs.core.HashMap(null, 0, cljs.core.js_obj.call(null));
cljs.core.HashMap.fromArrays = function(ks, vs) {
  var len__15598 = ks.length;
  var i__15599 = 0;
  var out__15600 = cljs.core.HashMap.EMPTY;
  while(true) {
    if(cljs.core.truth_(i__15599 < len__15598)) {
      var G__15601 = i__15599 + 1;
      var G__15602 = cljs.core.assoc.call(null, out__15600, ks[i__15599], vs[i__15599]);
      i__15599 = G__15601;
      out__15600 = G__15602;
      continue
    }else {
      return out__15600
    }
    break
  }
};
cljs.core.hash_map = function() {
  var hash_map__delegate = function(keyvals) {
    var in$__15603 = cljs.core.seq.call(null, keyvals);
    var out__15604 = cljs.core.HashMap.EMPTY;
    while(true) {
      if(cljs.core.truth_(in$__15603)) {
        var G__15605 = cljs.core.nnext.call(null, in$__15603);
        var G__15606 = cljs.core.assoc.call(null, out__15604, cljs.core.first.call(null, in$__15603), cljs.core.second.call(null, in$__15603));
        in$__15603 = G__15605;
        out__15604 = G__15606;
        continue
      }else {
        return out__15604
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
  hash_map.cljs$lang$applyTo = function(arglist__15607) {
    var keyvals = cljs.core.seq(arglist__15607);
    return hash_map__delegate.call(this, keyvals)
  };
  return hash_map
}();
cljs.core.keys = function keys(hash_map) {
  return cljs.core.seq.call(null, cljs.core.map.call(null, cljs.core.first, hash_map))
};
cljs.core.vals = function vals(hash_map) {
  return cljs.core.seq.call(null, cljs.core.map.call(null, cljs.core.second, hash_map))
};
cljs.core.merge = function() {
  var merge__delegate = function(maps) {
    if(cljs.core.truth_(cljs.core.some.call(null, cljs.core.identity, maps))) {
      return cljs.core.reduce.call(null, function(p1__15608_SHARP_, p2__15609_SHARP_) {
        return cljs.core.conj.call(null, function() {
          var or__3824__auto____15610 = p1__15608_SHARP_;
          if(cljs.core.truth_(or__3824__auto____15610)) {
            return or__3824__auto____15610
          }else {
            return cljs.core.ObjMap.fromObject([], {})
          }
        }(), p2__15609_SHARP_)
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
  merge.cljs$lang$applyTo = function(arglist__15611) {
    var maps = cljs.core.seq(arglist__15611);
    return merge__delegate.call(this, maps)
  };
  return merge
}();
cljs.core.merge_with = function() {
  var merge_with__delegate = function(f, maps) {
    if(cljs.core.truth_(cljs.core.some.call(null, cljs.core.identity, maps))) {
      var merge_entry__15614 = function(m, e) {
        var k__15612 = cljs.core.first.call(null, e);
        var v__15613 = cljs.core.second.call(null, e);
        if(cljs.core.truth_(cljs.core.contains_QMARK_.call(null, m, k__15612))) {
          return cljs.core.assoc.call(null, m, k__15612, f.call(null, cljs.core.get.call(null, m, k__15612), v__15613))
        }else {
          return cljs.core.assoc.call(null, m, k__15612, v__15613)
        }
      };
      var merge2__15616 = function(m1, m2) {
        return cljs.core.reduce.call(null, merge_entry__15614, function() {
          var or__3824__auto____15615 = m1;
          if(cljs.core.truth_(or__3824__auto____15615)) {
            return or__3824__auto____15615
          }else {
            return cljs.core.ObjMap.fromObject([], {})
          }
        }(), cljs.core.seq.call(null, m2))
      };
      return cljs.core.reduce.call(null, merge2__15616, maps)
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
  merge_with.cljs$lang$applyTo = function(arglist__15617) {
    var f = cljs.core.first(arglist__15617);
    var maps = cljs.core.rest(arglist__15617);
    return merge_with__delegate.call(this, f, maps)
  };
  return merge_with
}();
cljs.core.select_keys = function select_keys(map, keyseq) {
  var ret__15619 = cljs.core.ObjMap.fromObject([], {});
  var keys__15620 = cljs.core.seq.call(null, keyseq);
  while(true) {
    if(cljs.core.truth_(keys__15620)) {
      var key__15621 = cljs.core.first.call(null, keys__15620);
      var entry__15622 = cljs.core.get.call(null, map, key__15621, "\ufdd0'user/not-found");
      var G__15623 = cljs.core.truth_(cljs.core.not_EQ_.call(null, entry__15622, "\ufdd0'user/not-found")) ? cljs.core.assoc.call(null, ret__15619, key__15621, entry__15622) : ret__15619;
      var G__15624 = cljs.core.next.call(null, keys__15620);
      ret__15619 = G__15623;
      keys__15620 = G__15624;
      continue
    }else {
      return ret__15619
    }
    break
  }
};
cljs.core.Set = function(meta, hash_map) {
  this.meta = meta;
  this.hash_map = hash_map
};
cljs.core.Set.cljs$core$IPrintable$_pr_seq = function(this__367__auto__) {
  return cljs.core.list.call(null, "cljs.core.Set")
};
cljs.core.Set.prototype.cljs$core$IHash$ = true;
cljs.core.Set.prototype.cljs$core$IHash$_hash = function(coll) {
  var this__15625 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.Set.prototype.cljs$core$ILookup$ = true;
cljs.core.Set.prototype.cljs$core$ILookup$_lookup = function() {
  var G__15646 = null;
  var G__15646__15647 = function(coll, v) {
    var this__15626 = this;
    return cljs.core._lookup.call(null, coll, v, null)
  };
  var G__15646__15648 = function(coll, v, not_found) {
    var this__15627 = this;
    if(cljs.core.truth_(cljs.core._contains_key_QMARK_.call(null, this__15627.hash_map, v))) {
      return v
    }else {
      return not_found
    }
  };
  G__15646 = function(coll, v, not_found) {
    switch(arguments.length) {
      case 2:
        return G__15646__15647.call(this, coll, v);
      case 3:
        return G__15646__15648.call(this, coll, v, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__15646
}();
cljs.core.Set.prototype.cljs$core$IFn$ = true;
cljs.core.Set.prototype.call = function() {
  var G__15650 = null;
  var G__15650__15651 = function(tsym15628, k) {
    var this__15630 = this;
    var tsym15628__15631 = this;
    var coll__15632 = tsym15628__15631;
    return cljs.core._lookup.call(null, coll__15632, k)
  };
  var G__15650__15652 = function(tsym15629, k, not_found) {
    var this__15633 = this;
    var tsym15629__15634 = this;
    var coll__15635 = tsym15629__15634;
    return cljs.core._lookup.call(null, coll__15635, k, not_found)
  };
  G__15650 = function(tsym15629, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__15650__15651.call(this, tsym15629, k);
      case 3:
        return G__15650__15652.call(this, tsym15629, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__15650
}();
cljs.core.Set.prototype.cljs$core$ICollection$ = true;
cljs.core.Set.prototype.cljs$core$ICollection$_conj = function(coll, o) {
  var this__15636 = this;
  return new cljs.core.Set(this__15636.meta, cljs.core.assoc.call(null, this__15636.hash_map, o, null))
};
cljs.core.Set.prototype.cljs$core$ISeqable$ = true;
cljs.core.Set.prototype.cljs$core$ISeqable$_seq = function(coll) {
  var this__15637 = this;
  return cljs.core.keys.call(null, this__15637.hash_map)
};
cljs.core.Set.prototype.cljs$core$ISet$ = true;
cljs.core.Set.prototype.cljs$core$ISet$_disjoin = function(coll, v) {
  var this__15638 = this;
  return new cljs.core.Set(this__15638.meta, cljs.core.dissoc.call(null, this__15638.hash_map, v))
};
cljs.core.Set.prototype.cljs$core$ICounted$ = true;
cljs.core.Set.prototype.cljs$core$ICounted$_count = function(coll) {
  var this__15639 = this;
  return cljs.core.count.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.Set.prototype.cljs$core$IEquiv$ = true;
cljs.core.Set.prototype.cljs$core$IEquiv$_equiv = function(coll, other) {
  var this__15640 = this;
  var and__3822__auto____15641 = cljs.core.set_QMARK_.call(null, other);
  if(cljs.core.truth_(and__3822__auto____15641)) {
    var and__3822__auto____15642 = cljs.core._EQ_.call(null, cljs.core.count.call(null, coll), cljs.core.count.call(null, other));
    if(cljs.core.truth_(and__3822__auto____15642)) {
      return cljs.core.every_QMARK_.call(null, function(p1__15618_SHARP_) {
        return cljs.core.contains_QMARK_.call(null, coll, p1__15618_SHARP_)
      }, other)
    }else {
      return and__3822__auto____15642
    }
  }else {
    return and__3822__auto____15641
  }
};
cljs.core.Set.prototype.cljs$core$IWithMeta$ = true;
cljs.core.Set.prototype.cljs$core$IWithMeta$_with_meta = function(coll, meta) {
  var this__15643 = this;
  return new cljs.core.Set(meta, this__15643.hash_map)
};
cljs.core.Set.prototype.cljs$core$IMeta$ = true;
cljs.core.Set.prototype.cljs$core$IMeta$_meta = function(coll) {
  var this__15644 = this;
  return this__15644.meta
};
cljs.core.Set.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.Set.prototype.cljs$core$IEmptyableCollection$_empty = function(coll) {
  var this__15645 = this;
  return cljs.core.with_meta.call(null, cljs.core.Set.EMPTY, this__15645.meta)
};
cljs.core.Set;
cljs.core.Set.EMPTY = new cljs.core.Set(null, cljs.core.hash_map.call(null));
cljs.core.set = function set(coll) {
  var in$__15655 = cljs.core.seq.call(null, coll);
  var out__15656 = cljs.core.Set.EMPTY;
  while(true) {
    if(cljs.core.truth_(cljs.core.not.call(null, cljs.core.empty_QMARK_.call(null, in$__15655)))) {
      var G__15657 = cljs.core.rest.call(null, in$__15655);
      var G__15658 = cljs.core.conj.call(null, out__15656, cljs.core.first.call(null, in$__15655));
      in$__15655 = G__15657;
      out__15656 = G__15658;
      continue
    }else {
      return out__15656
    }
    break
  }
};
cljs.core.replace = function replace(smap, coll) {
  if(cljs.core.truth_(cljs.core.vector_QMARK_.call(null, coll))) {
    var n__15659 = cljs.core.count.call(null, coll);
    return cljs.core.reduce.call(null, function(v, i) {
      var temp__3971__auto____15660 = cljs.core.find.call(null, smap, cljs.core.nth.call(null, v, i));
      if(cljs.core.truth_(temp__3971__auto____15660)) {
        var e__15661 = temp__3971__auto____15660;
        return cljs.core.assoc.call(null, v, i, cljs.core.second.call(null, e__15661))
      }else {
        return v
      }
    }, coll, cljs.core.take.call(null, n__15659, cljs.core.iterate.call(null, cljs.core.inc, 0)))
  }else {
    return cljs.core.map.call(null, function(p1__15654_SHARP_) {
      var temp__3971__auto____15662 = cljs.core.find.call(null, smap, p1__15654_SHARP_);
      if(cljs.core.truth_(temp__3971__auto____15662)) {
        var e__15663 = temp__3971__auto____15662;
        return cljs.core.second.call(null, e__15663)
      }else {
        return p1__15654_SHARP_
      }
    }, coll)
  }
};
cljs.core.distinct = function distinct(coll) {
  var step__15671 = function step(xs, seen) {
    return new cljs.core.LazySeq(null, false, function() {
      return function(p__15664, seen) {
        while(true) {
          var vec__15665__15666 = p__15664;
          var f__15667 = cljs.core.nth.call(null, vec__15665__15666, 0, null);
          var xs__15668 = vec__15665__15666;
          var temp__3974__auto____15669 = cljs.core.seq.call(null, xs__15668);
          if(cljs.core.truth_(temp__3974__auto____15669)) {
            var s__15670 = temp__3974__auto____15669;
            if(cljs.core.truth_(cljs.core.contains_QMARK_.call(null, seen, f__15667))) {
              var G__15672 = cljs.core.rest.call(null, s__15670);
              var G__15673 = seen;
              p__15664 = G__15672;
              seen = G__15673;
              continue
            }else {
              return cljs.core.cons.call(null, f__15667, step.call(null, cljs.core.rest.call(null, s__15670), cljs.core.conj.call(null, seen, f__15667)))
            }
          }else {
            return null
          }
          break
        }
      }.call(null, xs, seen)
    })
  };
  return step__15671.call(null, coll, cljs.core.set([]))
};
cljs.core.butlast = function butlast(s) {
  var ret__15674 = cljs.core.PersistentVector.fromArray([]);
  var s__15675 = s;
  while(true) {
    if(cljs.core.truth_(cljs.core.next.call(null, s__15675))) {
      var G__15676 = cljs.core.conj.call(null, ret__15674, cljs.core.first.call(null, s__15675));
      var G__15677 = cljs.core.next.call(null, s__15675);
      ret__15674 = G__15676;
      s__15675 = G__15677;
      continue
    }else {
      return cljs.core.seq.call(null, ret__15674)
    }
    break
  }
};
cljs.core.name = function name(x) {
  if(cljs.core.truth_(cljs.core.string_QMARK_.call(null, x))) {
    return x
  }else {
    if(cljs.core.truth_(function() {
      var or__3824__auto____15678 = cljs.core.keyword_QMARK_.call(null, x);
      if(cljs.core.truth_(or__3824__auto____15678)) {
        return or__3824__auto____15678
      }else {
        return cljs.core.symbol_QMARK_.call(null, x)
      }
    }())) {
      var i__15679 = x.lastIndexOf("/");
      if(cljs.core.truth_(i__15679 < 0)) {
        return cljs.core.subs.call(null, x, 2)
      }else {
        return cljs.core.subs.call(null, x, i__15679 + 1)
      }
    }else {
      if(cljs.core.truth_("\ufdd0'else")) {
        throw new Error(cljs.core.str.call(null, "Doesn't support name: ", x));
      }else {
        return null
      }
    }
  }
};
cljs.core.namespace = function namespace(x) {
  if(cljs.core.truth_(function() {
    var or__3824__auto____15680 = cljs.core.keyword_QMARK_.call(null, x);
    if(cljs.core.truth_(or__3824__auto____15680)) {
      return or__3824__auto____15680
    }else {
      return cljs.core.symbol_QMARK_.call(null, x)
    }
  }())) {
    var i__15681 = x.lastIndexOf("/");
    if(cljs.core.truth_(i__15681 > -1)) {
      return cljs.core.subs.call(null, x, 2, i__15681)
    }else {
      return null
    }
  }else {
    throw new Error(cljs.core.str.call(null, "Doesn't support namespace: ", x));
  }
};
cljs.core.zipmap = function zipmap(keys, vals) {
  var map__15684 = cljs.core.ObjMap.fromObject([], {});
  var ks__15685 = cljs.core.seq.call(null, keys);
  var vs__15686 = cljs.core.seq.call(null, vals);
  while(true) {
    if(cljs.core.truth_(function() {
      var and__3822__auto____15687 = ks__15685;
      if(cljs.core.truth_(and__3822__auto____15687)) {
        return vs__15686
      }else {
        return and__3822__auto____15687
      }
    }())) {
      var G__15688 = cljs.core.assoc.call(null, map__15684, cljs.core.first.call(null, ks__15685), cljs.core.first.call(null, vs__15686));
      var G__15689 = cljs.core.next.call(null, ks__15685);
      var G__15690 = cljs.core.next.call(null, vs__15686);
      map__15684 = G__15688;
      ks__15685 = G__15689;
      vs__15686 = G__15690;
      continue
    }else {
      return map__15684
    }
    break
  }
};
cljs.core.max_key = function() {
  var max_key = null;
  var max_key__15693 = function(k, x) {
    return x
  };
  var max_key__15694 = function(k, x, y) {
    if(cljs.core.truth_(k.call(null, x) > k.call(null, y))) {
      return x
    }else {
      return y
    }
  };
  var max_key__15695 = function() {
    var G__15697__delegate = function(k, x, y, more) {
      return cljs.core.reduce.call(null, function(p1__15682_SHARP_, p2__15683_SHARP_) {
        return max_key.call(null, k, p1__15682_SHARP_, p2__15683_SHARP_)
      }, max_key.call(null, k, x, y), more)
    };
    var G__15697 = function(k, x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__15697__delegate.call(this, k, x, y, more)
    };
    G__15697.cljs$lang$maxFixedArity = 3;
    G__15697.cljs$lang$applyTo = function(arglist__15698) {
      var k = cljs.core.first(arglist__15698);
      var x = cljs.core.first(cljs.core.next(arglist__15698));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(arglist__15698)));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__15698)));
      return G__15697__delegate.call(this, k, x, y, more)
    };
    return G__15697
  }();
  max_key = function(k, x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return max_key__15693.call(this, k, x);
      case 3:
        return max_key__15694.call(this, k, x, y);
      default:
        return max_key__15695.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  max_key.cljs$lang$maxFixedArity = 3;
  max_key.cljs$lang$applyTo = max_key__15695.cljs$lang$applyTo;
  return max_key
}();
cljs.core.min_key = function() {
  var min_key = null;
  var min_key__15699 = function(k, x) {
    return x
  };
  var min_key__15700 = function(k, x, y) {
    if(cljs.core.truth_(k.call(null, x) < k.call(null, y))) {
      return x
    }else {
      return y
    }
  };
  var min_key__15701 = function() {
    var G__15703__delegate = function(k, x, y, more) {
      return cljs.core.reduce.call(null, function(p1__15691_SHARP_, p2__15692_SHARP_) {
        return min_key.call(null, k, p1__15691_SHARP_, p2__15692_SHARP_)
      }, min_key.call(null, k, x, y), more)
    };
    var G__15703 = function(k, x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__15703__delegate.call(this, k, x, y, more)
    };
    G__15703.cljs$lang$maxFixedArity = 3;
    G__15703.cljs$lang$applyTo = function(arglist__15704) {
      var k = cljs.core.first(arglist__15704);
      var x = cljs.core.first(cljs.core.next(arglist__15704));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(arglist__15704)));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__15704)));
      return G__15703__delegate.call(this, k, x, y, more)
    };
    return G__15703
  }();
  min_key = function(k, x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return min_key__15699.call(this, k, x);
      case 3:
        return min_key__15700.call(this, k, x, y);
      default:
        return min_key__15701.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  min_key.cljs$lang$maxFixedArity = 3;
  min_key.cljs$lang$applyTo = min_key__15701.cljs$lang$applyTo;
  return min_key
}();
cljs.core.partition_all = function() {
  var partition_all = null;
  var partition_all__15707 = function(n, coll) {
    return partition_all.call(null, n, n, coll)
  };
  var partition_all__15708 = function(n, step, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____15705 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3974__auto____15705)) {
        var s__15706 = temp__3974__auto____15705;
        return cljs.core.cons.call(null, cljs.core.take.call(null, n, s__15706), partition_all.call(null, n, step, cljs.core.drop.call(null, step, s__15706)))
      }else {
        return null
      }
    })
  };
  partition_all = function(n, step, coll) {
    switch(arguments.length) {
      case 2:
        return partition_all__15707.call(this, n, step);
      case 3:
        return partition_all__15708.call(this, n, step, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return partition_all
}();
cljs.core.take_while = function take_while(pred, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____15710 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3974__auto____15710)) {
      var s__15711 = temp__3974__auto____15710;
      if(cljs.core.truth_(pred.call(null, cljs.core.first.call(null, s__15711)))) {
        return cljs.core.cons.call(null, cljs.core.first.call(null, s__15711), take_while.call(null, pred, cljs.core.rest.call(null, s__15711)))
      }else {
        return null
      }
    }else {
      return null
    }
  })
};
cljs.core.Range = function(meta, start, end, step) {
  this.meta = meta;
  this.start = start;
  this.end = end;
  this.step = step
};
cljs.core.Range.cljs$core$IPrintable$_pr_seq = function(this__367__auto__) {
  return cljs.core.list.call(null, "cljs.core.Range")
};
cljs.core.Range.prototype.cljs$core$IHash$ = true;
cljs.core.Range.prototype.cljs$core$IHash$_hash = function(rng) {
  var this__15712 = this;
  return cljs.core.hash_coll.call(null, rng)
};
cljs.core.Range.prototype.cljs$core$ISequential$ = true;
cljs.core.Range.prototype.cljs$core$ICollection$ = true;
cljs.core.Range.prototype.cljs$core$ICollection$_conj = function(rng, o) {
  var this__15713 = this;
  return cljs.core.cons.call(null, o, rng)
};
cljs.core.Range.prototype.cljs$core$IReduce$ = true;
cljs.core.Range.prototype.cljs$core$IReduce$_reduce = function() {
  var G__15729 = null;
  var G__15729__15730 = function(rng, f) {
    var this__15714 = this;
    return cljs.core.ci_reduce.call(null, rng, f)
  };
  var G__15729__15731 = function(rng, f, s) {
    var this__15715 = this;
    return cljs.core.ci_reduce.call(null, rng, f, s)
  };
  G__15729 = function(rng, f, s) {
    switch(arguments.length) {
      case 2:
        return G__15729__15730.call(this, rng, f);
      case 3:
        return G__15729__15731.call(this, rng, f, s)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__15729
}();
cljs.core.Range.prototype.cljs$core$ISeqable$ = true;
cljs.core.Range.prototype.cljs$core$ISeqable$_seq = function(rng) {
  var this__15716 = this;
  var comp__15717 = cljs.core.truth_(this__15716.step > 0) ? cljs.core._LT_ : cljs.core._GT_;
  if(cljs.core.truth_(comp__15717.call(null, this__15716.start, this__15716.end))) {
    return rng
  }else {
    return null
  }
};
cljs.core.Range.prototype.cljs$core$ICounted$ = true;
cljs.core.Range.prototype.cljs$core$ICounted$_count = function(rng) {
  var this__15718 = this;
  if(cljs.core.truth_(cljs.core.not.call(null, cljs.core._seq.call(null, rng)))) {
    return 0
  }else {
    return Math["ceil"].call(null, (this__15718.end - this__15718.start) / this__15718.step)
  }
};
cljs.core.Range.prototype.cljs$core$ISeq$ = true;
cljs.core.Range.prototype.cljs$core$ISeq$_first = function(rng) {
  var this__15719 = this;
  return this__15719.start
};
cljs.core.Range.prototype.cljs$core$ISeq$_rest = function(rng) {
  var this__15720 = this;
  if(cljs.core.truth_(cljs.core._seq.call(null, rng))) {
    return new cljs.core.Range(this__15720.meta, this__15720.start + this__15720.step, this__15720.end, this__15720.step)
  }else {
    return cljs.core.list.call(null)
  }
};
cljs.core.Range.prototype.cljs$core$IEquiv$ = true;
cljs.core.Range.prototype.cljs$core$IEquiv$_equiv = function(rng, other) {
  var this__15721 = this;
  return cljs.core.equiv_sequential.call(null, rng, other)
};
cljs.core.Range.prototype.cljs$core$IWithMeta$ = true;
cljs.core.Range.prototype.cljs$core$IWithMeta$_with_meta = function(rng, meta) {
  var this__15722 = this;
  return new cljs.core.Range(meta, this__15722.start, this__15722.end, this__15722.step)
};
cljs.core.Range.prototype.cljs$core$IMeta$ = true;
cljs.core.Range.prototype.cljs$core$IMeta$_meta = function(rng) {
  var this__15723 = this;
  return this__15723.meta
};
cljs.core.Range.prototype.cljs$core$IIndexed$ = true;
cljs.core.Range.prototype.cljs$core$IIndexed$_nth = function() {
  var G__15733 = null;
  var G__15733__15734 = function(rng, n) {
    var this__15724 = this;
    if(cljs.core.truth_(n < cljs.core._count.call(null, rng))) {
      return this__15724.start + n * this__15724.step
    }else {
      if(cljs.core.truth_(function() {
        var and__3822__auto____15725 = this__15724.start > this__15724.end;
        if(cljs.core.truth_(and__3822__auto____15725)) {
          return cljs.core._EQ_.call(null, this__15724.step, 0)
        }else {
          return and__3822__auto____15725
        }
      }())) {
        return this__15724.start
      }else {
        throw new Error("Index out of bounds");
      }
    }
  };
  var G__15733__15735 = function(rng, n, not_found) {
    var this__15726 = this;
    if(cljs.core.truth_(n < cljs.core._count.call(null, rng))) {
      return this__15726.start + n * this__15726.step
    }else {
      if(cljs.core.truth_(function() {
        var and__3822__auto____15727 = this__15726.start > this__15726.end;
        if(cljs.core.truth_(and__3822__auto____15727)) {
          return cljs.core._EQ_.call(null, this__15726.step, 0)
        }else {
          return and__3822__auto____15727
        }
      }())) {
        return this__15726.start
      }else {
        return not_found
      }
    }
  };
  G__15733 = function(rng, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__15733__15734.call(this, rng, n);
      case 3:
        return G__15733__15735.call(this, rng, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__15733
}();
cljs.core.Range.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.Range.prototype.cljs$core$IEmptyableCollection$_empty = function(rng) {
  var this__15728 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__15728.meta)
};
cljs.core.Range;
cljs.core.range = function() {
  var range = null;
  var range__15737 = function() {
    return range.call(null, 0, Number["MAX_VALUE"], 1)
  };
  var range__15738 = function(end) {
    return range.call(null, 0, end, 1)
  };
  var range__15739 = function(start, end) {
    return range.call(null, start, end, 1)
  };
  var range__15740 = function(start, end, step) {
    return new cljs.core.Range(null, start, end, step)
  };
  range = function(start, end, step) {
    switch(arguments.length) {
      case 0:
        return range__15737.call(this);
      case 1:
        return range__15738.call(this, start);
      case 2:
        return range__15739.call(this, start, end);
      case 3:
        return range__15740.call(this, start, end, step)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return range
}();
cljs.core.take_nth = function take_nth(n, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____15742 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3974__auto____15742)) {
      var s__15743 = temp__3974__auto____15742;
      return cljs.core.cons.call(null, cljs.core.first.call(null, s__15743), take_nth.call(null, n, cljs.core.drop.call(null, n, s__15743)))
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
    var temp__3974__auto____15745 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3974__auto____15745)) {
      var s__15746 = temp__3974__auto____15745;
      var fst__15747 = cljs.core.first.call(null, s__15746);
      var fv__15748 = f.call(null, fst__15747);
      var run__15749 = cljs.core.cons.call(null, fst__15747, cljs.core.take_while.call(null, function(p1__15744_SHARP_) {
        return cljs.core._EQ_.call(null, fv__15748, f.call(null, p1__15744_SHARP_))
      }, cljs.core.next.call(null, s__15746)));
      return cljs.core.cons.call(null, run__15749, partition_by.call(null, f, cljs.core.seq.call(null, cljs.core.drop.call(null, cljs.core.count.call(null, run__15749), s__15746))))
    }else {
      return null
    }
  })
};
cljs.core.frequencies = function frequencies(coll) {
  return cljs.core.reduce.call(null, function(counts, x) {
    return cljs.core.assoc.call(null, counts, x, cljs.core.get.call(null, counts, x, 0) + 1)
  }, cljs.core.ObjMap.fromObject([], {}), coll)
};
cljs.core.reductions = function() {
  var reductions = null;
  var reductions__15764 = function(f, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3971__auto____15760 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3971__auto____15760)) {
        var s__15761 = temp__3971__auto____15760;
        return reductions.call(null, f, cljs.core.first.call(null, s__15761), cljs.core.rest.call(null, s__15761))
      }else {
        return cljs.core.list.call(null, f.call(null))
      }
    })
  };
  var reductions__15765 = function(f, init, coll) {
    return cljs.core.cons.call(null, init, new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____15762 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3974__auto____15762)) {
        var s__15763 = temp__3974__auto____15762;
        return reductions.call(null, f, f.call(null, init, cljs.core.first.call(null, s__15763)), cljs.core.rest.call(null, s__15763))
      }else {
        return null
      }
    }))
  };
  reductions = function(f, init, coll) {
    switch(arguments.length) {
      case 2:
        return reductions__15764.call(this, f, init);
      case 3:
        return reductions__15765.call(this, f, init, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return reductions
}();
cljs.core.juxt = function() {
  var juxt = null;
  var juxt__15768 = function(f) {
    return function() {
      var G__15773 = null;
      var G__15773__15774 = function() {
        return cljs.core.vector.call(null, f.call(null))
      };
      var G__15773__15775 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x))
      };
      var G__15773__15776 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y))
      };
      var G__15773__15777 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z))
      };
      var G__15773__15778 = function() {
        var G__15780__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args))
        };
        var G__15780 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__15780__delegate.call(this, x, y, z, args)
        };
        G__15780.cljs$lang$maxFixedArity = 3;
        G__15780.cljs$lang$applyTo = function(arglist__15781) {
          var x = cljs.core.first(arglist__15781);
          var y = cljs.core.first(cljs.core.next(arglist__15781));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__15781)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__15781)));
          return G__15780__delegate.call(this, x, y, z, args)
        };
        return G__15780
      }();
      G__15773 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__15773__15774.call(this);
          case 1:
            return G__15773__15775.call(this, x);
          case 2:
            return G__15773__15776.call(this, x, y);
          case 3:
            return G__15773__15777.call(this, x, y, z);
          default:
            return G__15773__15778.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__15773.cljs$lang$maxFixedArity = 3;
      G__15773.cljs$lang$applyTo = G__15773__15778.cljs$lang$applyTo;
      return G__15773
    }()
  };
  var juxt__15769 = function(f, g) {
    return function() {
      var G__15782 = null;
      var G__15782__15783 = function() {
        return cljs.core.vector.call(null, f.call(null), g.call(null))
      };
      var G__15782__15784 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x), g.call(null, x))
      };
      var G__15782__15785 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y), g.call(null, x, y))
      };
      var G__15782__15786 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z), g.call(null, x, y, z))
      };
      var G__15782__15787 = function() {
        var G__15789__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args), cljs.core.apply.call(null, g, x, y, z, args))
        };
        var G__15789 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__15789__delegate.call(this, x, y, z, args)
        };
        G__15789.cljs$lang$maxFixedArity = 3;
        G__15789.cljs$lang$applyTo = function(arglist__15790) {
          var x = cljs.core.first(arglist__15790);
          var y = cljs.core.first(cljs.core.next(arglist__15790));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__15790)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__15790)));
          return G__15789__delegate.call(this, x, y, z, args)
        };
        return G__15789
      }();
      G__15782 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__15782__15783.call(this);
          case 1:
            return G__15782__15784.call(this, x);
          case 2:
            return G__15782__15785.call(this, x, y);
          case 3:
            return G__15782__15786.call(this, x, y, z);
          default:
            return G__15782__15787.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__15782.cljs$lang$maxFixedArity = 3;
      G__15782.cljs$lang$applyTo = G__15782__15787.cljs$lang$applyTo;
      return G__15782
    }()
  };
  var juxt__15770 = function(f, g, h) {
    return function() {
      var G__15791 = null;
      var G__15791__15792 = function() {
        return cljs.core.vector.call(null, f.call(null), g.call(null), h.call(null))
      };
      var G__15791__15793 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x), g.call(null, x), h.call(null, x))
      };
      var G__15791__15794 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y), g.call(null, x, y), h.call(null, x, y))
      };
      var G__15791__15795 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z), g.call(null, x, y, z), h.call(null, x, y, z))
      };
      var G__15791__15796 = function() {
        var G__15798__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args), cljs.core.apply.call(null, g, x, y, z, args), cljs.core.apply.call(null, h, x, y, z, args))
        };
        var G__15798 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__15798__delegate.call(this, x, y, z, args)
        };
        G__15798.cljs$lang$maxFixedArity = 3;
        G__15798.cljs$lang$applyTo = function(arglist__15799) {
          var x = cljs.core.first(arglist__15799);
          var y = cljs.core.first(cljs.core.next(arglist__15799));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__15799)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__15799)));
          return G__15798__delegate.call(this, x, y, z, args)
        };
        return G__15798
      }();
      G__15791 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__15791__15792.call(this);
          case 1:
            return G__15791__15793.call(this, x);
          case 2:
            return G__15791__15794.call(this, x, y);
          case 3:
            return G__15791__15795.call(this, x, y, z);
          default:
            return G__15791__15796.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__15791.cljs$lang$maxFixedArity = 3;
      G__15791.cljs$lang$applyTo = G__15791__15796.cljs$lang$applyTo;
      return G__15791
    }()
  };
  var juxt__15771 = function() {
    var G__15800__delegate = function(f, g, h, fs) {
      var fs__15767 = cljs.core.list_STAR_.call(null, f, g, h, fs);
      return function() {
        var G__15801 = null;
        var G__15801__15802 = function() {
          return cljs.core.reduce.call(null, function(p1__15750_SHARP_, p2__15751_SHARP_) {
            return cljs.core.conj.call(null, p1__15750_SHARP_, p2__15751_SHARP_.call(null))
          }, cljs.core.PersistentVector.fromArray([]), fs__15767)
        };
        var G__15801__15803 = function(x) {
          return cljs.core.reduce.call(null, function(p1__15752_SHARP_, p2__15753_SHARP_) {
            return cljs.core.conj.call(null, p1__15752_SHARP_, p2__15753_SHARP_.call(null, x))
          }, cljs.core.PersistentVector.fromArray([]), fs__15767)
        };
        var G__15801__15804 = function(x, y) {
          return cljs.core.reduce.call(null, function(p1__15754_SHARP_, p2__15755_SHARP_) {
            return cljs.core.conj.call(null, p1__15754_SHARP_, p2__15755_SHARP_.call(null, x, y))
          }, cljs.core.PersistentVector.fromArray([]), fs__15767)
        };
        var G__15801__15805 = function(x, y, z) {
          return cljs.core.reduce.call(null, function(p1__15756_SHARP_, p2__15757_SHARP_) {
            return cljs.core.conj.call(null, p1__15756_SHARP_, p2__15757_SHARP_.call(null, x, y, z))
          }, cljs.core.PersistentVector.fromArray([]), fs__15767)
        };
        var G__15801__15806 = function() {
          var G__15808__delegate = function(x, y, z, args) {
            return cljs.core.reduce.call(null, function(p1__15758_SHARP_, p2__15759_SHARP_) {
              return cljs.core.conj.call(null, p1__15758_SHARP_, cljs.core.apply.call(null, p2__15759_SHARP_, x, y, z, args))
            }, cljs.core.PersistentVector.fromArray([]), fs__15767)
          };
          var G__15808 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__15808__delegate.call(this, x, y, z, args)
          };
          G__15808.cljs$lang$maxFixedArity = 3;
          G__15808.cljs$lang$applyTo = function(arglist__15809) {
            var x = cljs.core.first(arglist__15809);
            var y = cljs.core.first(cljs.core.next(arglist__15809));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__15809)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__15809)));
            return G__15808__delegate.call(this, x, y, z, args)
          };
          return G__15808
        }();
        G__15801 = function(x, y, z, var_args) {
          var args = var_args;
          switch(arguments.length) {
            case 0:
              return G__15801__15802.call(this);
            case 1:
              return G__15801__15803.call(this, x);
            case 2:
              return G__15801__15804.call(this, x, y);
            case 3:
              return G__15801__15805.call(this, x, y, z);
            default:
              return G__15801__15806.apply(this, arguments)
          }
          throw"Invalid arity: " + arguments.length;
        };
        G__15801.cljs$lang$maxFixedArity = 3;
        G__15801.cljs$lang$applyTo = G__15801__15806.cljs$lang$applyTo;
        return G__15801
      }()
    };
    var G__15800 = function(f, g, h, var_args) {
      var fs = null;
      if(goog.isDef(var_args)) {
        fs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__15800__delegate.call(this, f, g, h, fs)
    };
    G__15800.cljs$lang$maxFixedArity = 3;
    G__15800.cljs$lang$applyTo = function(arglist__15810) {
      var f = cljs.core.first(arglist__15810);
      var g = cljs.core.first(cljs.core.next(arglist__15810));
      var h = cljs.core.first(cljs.core.next(cljs.core.next(arglist__15810)));
      var fs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__15810)));
      return G__15800__delegate.call(this, f, g, h, fs)
    };
    return G__15800
  }();
  juxt = function(f, g, h, var_args) {
    var fs = var_args;
    switch(arguments.length) {
      case 1:
        return juxt__15768.call(this, f);
      case 2:
        return juxt__15769.call(this, f, g);
      case 3:
        return juxt__15770.call(this, f, g, h);
      default:
        return juxt__15771.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  juxt.cljs$lang$maxFixedArity = 3;
  juxt.cljs$lang$applyTo = juxt__15771.cljs$lang$applyTo;
  return juxt
}();
cljs.core.dorun = function() {
  var dorun = null;
  var dorun__15812 = function(coll) {
    while(true) {
      if(cljs.core.truth_(cljs.core.seq.call(null, coll))) {
        var G__15815 = cljs.core.next.call(null, coll);
        coll = G__15815;
        continue
      }else {
        return null
      }
      break
    }
  };
  var dorun__15813 = function(n, coll) {
    while(true) {
      if(cljs.core.truth_(function() {
        var and__3822__auto____15811 = cljs.core.seq.call(null, coll);
        if(cljs.core.truth_(and__3822__auto____15811)) {
          return n > 0
        }else {
          return and__3822__auto____15811
        }
      }())) {
        var G__15816 = n - 1;
        var G__15817 = cljs.core.next.call(null, coll);
        n = G__15816;
        coll = G__15817;
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
        return dorun__15812.call(this, n);
      case 2:
        return dorun__15813.call(this, n, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return dorun
}();
cljs.core.doall = function() {
  var doall = null;
  var doall__15818 = function(coll) {
    cljs.core.dorun.call(null, coll);
    return coll
  };
  var doall__15819 = function(n, coll) {
    cljs.core.dorun.call(null, n, coll);
    return coll
  };
  doall = function(n, coll) {
    switch(arguments.length) {
      case 1:
        return doall__15818.call(this, n);
      case 2:
        return doall__15819.call(this, n, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return doall
}();
cljs.core.re_matches = function re_matches(re, s) {
  var matches__15821 = re.exec(s);
  if(cljs.core.truth_(cljs.core._EQ_.call(null, cljs.core.first.call(null, matches__15821), s))) {
    if(cljs.core.truth_(cljs.core._EQ_.call(null, cljs.core.count.call(null, matches__15821), 1))) {
      return cljs.core.first.call(null, matches__15821)
    }else {
      return cljs.core.vec.call(null, matches__15821)
    }
  }else {
    return null
  }
};
cljs.core.re_find = function re_find(re, s) {
  var matches__15822 = re.exec(s);
  if(cljs.core.truth_(matches__15822 === null)) {
    return null
  }else {
    if(cljs.core.truth_(cljs.core._EQ_.call(null, cljs.core.count.call(null, matches__15822), 1))) {
      return cljs.core.first.call(null, matches__15822)
    }else {
      return cljs.core.vec.call(null, matches__15822)
    }
  }
};
cljs.core.re_seq = function re_seq(re, s) {
  var match_data__15823 = cljs.core.re_find.call(null, re, s);
  var match_idx__15824 = s.search(re);
  var match_str__15825 = cljs.core.truth_(cljs.core.coll_QMARK_.call(null, match_data__15823)) ? cljs.core.first.call(null, match_data__15823) : match_data__15823;
  var post_match__15826 = cljs.core.subs.call(null, s, match_idx__15824 + cljs.core.count.call(null, match_str__15825));
  if(cljs.core.truth_(match_data__15823)) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, match_data__15823, re_seq.call(null, re, post_match__15826))
    })
  }else {
    return null
  }
};
cljs.core.re_pattern = function re_pattern(s) {
  var vec__15828__15829 = cljs.core.re_find.call(null, /^(?:\(\?([idmsux]*)\))?(.*)/, s);
  var ___15830 = cljs.core.nth.call(null, vec__15828__15829, 0, null);
  var flags__15831 = cljs.core.nth.call(null, vec__15828__15829, 1, null);
  var pattern__15832 = cljs.core.nth.call(null, vec__15828__15829, 2, null);
  return new RegExp(pattern__15832, flags__15831)
};
cljs.core.pr_sequential = function pr_sequential(print_one, begin, sep, end, opts, coll) {
  return cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray([begin]), cljs.core.flatten1.call(null, cljs.core.interpose.call(null, cljs.core.PersistentVector.fromArray([sep]), cljs.core.map.call(null, function(p1__15827_SHARP_) {
    return print_one.call(null, p1__15827_SHARP_, opts)
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
  if(cljs.core.truth_(obj === null)) {
    return cljs.core.list.call(null, "nil")
  }else {
    if(cljs.core.truth_(void 0 === obj)) {
      return cljs.core.list.call(null, "#<undefined>")
    }else {
      if(cljs.core.truth_("\ufdd0'else")) {
        return cljs.core.concat.call(null, cljs.core.truth_(function() {
          var and__3822__auto____15833 = cljs.core.get.call(null, opts, "\ufdd0'meta");
          if(cljs.core.truth_(and__3822__auto____15833)) {
            var and__3822__auto____15837 = function() {
              var x__451__auto____15834 = obj;
              if(cljs.core.truth_(function() {
                var and__3822__auto____15835 = x__451__auto____15834;
                if(cljs.core.truth_(and__3822__auto____15835)) {
                  var and__3822__auto____15836 = x__451__auto____15834.cljs$core$IMeta$;
                  if(cljs.core.truth_(and__3822__auto____15836)) {
                    return cljs.core.not.call(null, x__451__auto____15834.hasOwnProperty("cljs$core$IMeta$"))
                  }else {
                    return and__3822__auto____15836
                  }
                }else {
                  return and__3822__auto____15835
                }
              }())) {
                return true
              }else {
                return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, x__451__auto____15834)
              }
            }();
            if(cljs.core.truth_(and__3822__auto____15837)) {
              return cljs.core.meta.call(null, obj)
            }else {
              return and__3822__auto____15837
            }
          }else {
            return and__3822__auto____15833
          }
        }()) ? cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray(["^"]), pr_seq.call(null, cljs.core.meta.call(null, obj), opts), cljs.core.PersistentVector.fromArray([" "])) : null, cljs.core.truth_(function() {
          var x__451__auto____15838 = obj;
          if(cljs.core.truth_(function() {
            var and__3822__auto____15839 = x__451__auto____15838;
            if(cljs.core.truth_(and__3822__auto____15839)) {
              var and__3822__auto____15840 = x__451__auto____15838.cljs$core$IPrintable$;
              if(cljs.core.truth_(and__3822__auto____15840)) {
                return cljs.core.not.call(null, x__451__auto____15838.hasOwnProperty("cljs$core$IPrintable$"))
              }else {
                return and__3822__auto____15840
              }
            }else {
              return and__3822__auto____15839
            }
          }())) {
            return true
          }else {
            return cljs.core.type_satisfies_.call(null, cljs.core.IPrintable, x__451__auto____15838)
          }
        }()) ? cljs.core._pr_seq.call(null, obj, opts) : cljs.core.list.call(null, "#<", cljs.core.str.call(null, obj), ">"))
      }else {
        return null
      }
    }
  }
};
cljs.core.pr_sb = function pr_sb(objs, opts) {
  var first_obj__15841 = cljs.core.first.call(null, objs);
  var sb__15842 = new goog.string.StringBuffer;
  var G__15843__15844 = cljs.core.seq.call(null, objs);
  if(cljs.core.truth_(G__15843__15844)) {
    var obj__15845 = cljs.core.first.call(null, G__15843__15844);
    var G__15843__15846 = G__15843__15844;
    while(true) {
      if(cljs.core.truth_(obj__15845 === first_obj__15841)) {
      }else {
        sb__15842.append(" ")
      }
      var G__15847__15848 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, obj__15845, opts));
      if(cljs.core.truth_(G__15847__15848)) {
        var string__15849 = cljs.core.first.call(null, G__15847__15848);
        var G__15847__15850 = G__15847__15848;
        while(true) {
          sb__15842.append(string__15849);
          var temp__3974__auto____15851 = cljs.core.next.call(null, G__15847__15850);
          if(cljs.core.truth_(temp__3974__auto____15851)) {
            var G__15847__15852 = temp__3974__auto____15851;
            var G__15855 = cljs.core.first.call(null, G__15847__15852);
            var G__15856 = G__15847__15852;
            string__15849 = G__15855;
            G__15847__15850 = G__15856;
            continue
          }else {
          }
          break
        }
      }else {
      }
      var temp__3974__auto____15853 = cljs.core.next.call(null, G__15843__15846);
      if(cljs.core.truth_(temp__3974__auto____15853)) {
        var G__15843__15854 = temp__3974__auto____15853;
        var G__15857 = cljs.core.first.call(null, G__15843__15854);
        var G__15858 = G__15843__15854;
        obj__15845 = G__15857;
        G__15843__15846 = G__15858;
        continue
      }else {
      }
      break
    }
  }else {
  }
  return sb__15842
};
cljs.core.pr_str_with_opts = function pr_str_with_opts(objs, opts) {
  return cljs.core.str.call(null, cljs.core.pr_sb.call(null, objs, opts))
};
cljs.core.prn_str_with_opts = function prn_str_with_opts(objs, opts) {
  var sb__15859 = cljs.core.pr_sb.call(null, objs, opts);
  sb__15859.append("\n");
  return cljs.core.str.call(null, sb__15859)
};
cljs.core.pr_with_opts = function pr_with_opts(objs, opts) {
  var first_obj__15860 = cljs.core.first.call(null, objs);
  var G__15861__15862 = cljs.core.seq.call(null, objs);
  if(cljs.core.truth_(G__15861__15862)) {
    var obj__15863 = cljs.core.first.call(null, G__15861__15862);
    var G__15861__15864 = G__15861__15862;
    while(true) {
      if(cljs.core.truth_(obj__15863 === first_obj__15860)) {
      }else {
        cljs.core.string_print.call(null, " ")
      }
      var G__15865__15866 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, obj__15863, opts));
      if(cljs.core.truth_(G__15865__15866)) {
        var string__15867 = cljs.core.first.call(null, G__15865__15866);
        var G__15865__15868 = G__15865__15866;
        while(true) {
          cljs.core.string_print.call(null, string__15867);
          var temp__3974__auto____15869 = cljs.core.next.call(null, G__15865__15868);
          if(cljs.core.truth_(temp__3974__auto____15869)) {
            var G__15865__15870 = temp__3974__auto____15869;
            var G__15873 = cljs.core.first.call(null, G__15865__15870);
            var G__15874 = G__15865__15870;
            string__15867 = G__15873;
            G__15865__15868 = G__15874;
            continue
          }else {
          }
          break
        }
      }else {
      }
      var temp__3974__auto____15871 = cljs.core.next.call(null, G__15861__15864);
      if(cljs.core.truth_(temp__3974__auto____15871)) {
        var G__15861__15872 = temp__3974__auto____15871;
        var G__15875 = cljs.core.first.call(null, G__15861__15872);
        var G__15876 = G__15861__15872;
        obj__15863 = G__15875;
        G__15861__15864 = G__15876;
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
  pr_str.cljs$lang$applyTo = function(arglist__15877) {
    var objs = cljs.core.seq(arglist__15877);
    return pr_str__delegate.call(this, objs)
  };
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
  prn_str.cljs$lang$applyTo = function(arglist__15878) {
    var objs = cljs.core.seq(arglist__15878);
    return prn_str__delegate.call(this, objs)
  };
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
  pr.cljs$lang$applyTo = function(arglist__15879) {
    var objs = cljs.core.seq(arglist__15879);
    return pr__delegate.call(this, objs)
  };
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
  cljs_core_print.cljs$lang$applyTo = function(arglist__15880) {
    var objs = cljs.core.seq(arglist__15880);
    return cljs_core_print__delegate.call(this, objs)
  };
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
  print_str.cljs$lang$applyTo = function(arglist__15881) {
    var objs = cljs.core.seq(arglist__15881);
    return print_str__delegate.call(this, objs)
  };
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
  println.cljs$lang$applyTo = function(arglist__15882) {
    var objs = cljs.core.seq(arglist__15882);
    return println__delegate.call(this, objs)
  };
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
  println_str.cljs$lang$applyTo = function(arglist__15883) {
    var objs = cljs.core.seq(arglist__15883);
    return println_str__delegate.call(this, objs)
  };
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
  prn.cljs$lang$applyTo = function(arglist__15884) {
    var objs = cljs.core.seq(arglist__15884);
    return prn__delegate.call(this, objs)
  };
  return prn
}();
cljs.core.HashMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.HashMap.prototype.cljs$core$IPrintable$_pr_seq = function(coll, opts) {
  var pr_pair__15885 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__15885, "{", ", ", "}", opts, coll)
};
cljs.core.IPrintable["number"] = true;
cljs.core._pr_seq["number"] = function(n, opts) {
  return cljs.core.list.call(null, cljs.core.str.call(null, n))
};
cljs.core.IndexedSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$IPrintable$_pr_seq = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.Subvec.prototype.cljs$core$IPrintable$ = true;
cljs.core.Subvec.prototype.cljs$core$IPrintable$_pr_seq = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
cljs.core.LazySeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.LazySeq.prototype.cljs$core$IPrintable$_pr_seq = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.IPrintable["boolean"] = true;
cljs.core._pr_seq["boolean"] = function(bool, opts) {
  return cljs.core.list.call(null, cljs.core.str.call(null, bool))
};
cljs.core.Set.prototype.cljs$core$IPrintable$ = true;
cljs.core.Set.prototype.cljs$core$IPrintable$_pr_seq = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "#{", " ", "}", opts, coll)
};
cljs.core.IPrintable["string"] = true;
cljs.core._pr_seq["string"] = function(obj, opts) {
  if(cljs.core.truth_(cljs.core.keyword_QMARK_.call(null, obj))) {
    return cljs.core.list.call(null, cljs.core.str.call(null, ":", function() {
      var temp__3974__auto____15886 = cljs.core.namespace.call(null, obj);
      if(cljs.core.truth_(temp__3974__auto____15886)) {
        var nspc__15887 = temp__3974__auto____15886;
        return cljs.core.str.call(null, nspc__15887, "/")
      }else {
        return null
      }
    }(), cljs.core.name.call(null, obj)))
  }else {
    if(cljs.core.truth_(cljs.core.symbol_QMARK_.call(null, obj))) {
      return cljs.core.list.call(null, cljs.core.str.call(null, function() {
        var temp__3974__auto____15888 = cljs.core.namespace.call(null, obj);
        if(cljs.core.truth_(temp__3974__auto____15888)) {
          var nspc__15889 = temp__3974__auto____15888;
          return cljs.core.str.call(null, nspc__15889, "/")
        }else {
          return null
        }
      }(), cljs.core.name.call(null, obj)))
    }else {
      if(cljs.core.truth_("\ufdd0'else")) {
        return cljs.core.list.call(null, cljs.core.truth_("\ufdd0'readably".call(null, opts)) ? goog.string.quote.call(null, obj) : obj)
      }else {
        return null
      }
    }
  }
};
cljs.core.Vector.prototype.cljs$core$IPrintable$ = true;
cljs.core.Vector.prototype.cljs$core$IPrintable$_pr_seq = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
cljs.core.PersistentVector.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IPrintable$_pr_seq = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
cljs.core.List.prototype.cljs$core$IPrintable$ = true;
cljs.core.List.prototype.cljs$core$IPrintable$_pr_seq = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.IPrintable["array"] = true;
cljs.core._pr_seq["array"] = function(a, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "#<Array [", ", ", "]>", opts, a)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$IPrintable$_pr_seq = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.IPrintable["function"] = true;
cljs.core._pr_seq["function"] = function(this$) {
  return cljs.core.list.call(null, "#<", cljs.core.str.call(null, this$), ">")
};
cljs.core.EmptyList.prototype.cljs$core$IPrintable$ = true;
cljs.core.EmptyList.prototype.cljs$core$IPrintable$_pr_seq = function(coll, opts) {
  return cljs.core.list.call(null, "()")
};
cljs.core.Cons.prototype.cljs$core$IPrintable$ = true;
cljs.core.Cons.prototype.cljs$core$IPrintable$_pr_seq = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.Range.prototype.cljs$core$IPrintable$ = true;
cljs.core.Range.prototype.cljs$core$IPrintable$_pr_seq = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.ObjMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.ObjMap.prototype.cljs$core$IPrintable$_pr_seq = function(coll, opts) {
  var pr_pair__15890 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__15890, "{", ", ", "}", opts, coll)
};
cljs.core.Atom = function(state, meta, validator, watches) {
  this.state = state;
  this.meta = meta;
  this.validator = validator;
  this.watches = watches
};
cljs.core.Atom.cljs$core$IPrintable$_pr_seq = function(this__367__auto__) {
  return cljs.core.list.call(null, "cljs.core.Atom")
};
cljs.core.Atom.prototype.cljs$core$IHash$ = true;
cljs.core.Atom.prototype.cljs$core$IHash$_hash = function(this$) {
  var this__15891 = this;
  return goog.getUid.call(null, this$)
};
cljs.core.Atom.prototype.cljs$core$IWatchable$ = true;
cljs.core.Atom.prototype.cljs$core$IWatchable$_notify_watches = function(this$, oldval, newval) {
  var this__15892 = this;
  var G__15893__15894 = cljs.core.seq.call(null, this__15892.watches);
  if(cljs.core.truth_(G__15893__15894)) {
    var G__15896__15898 = cljs.core.first.call(null, G__15893__15894);
    var vec__15897__15899 = G__15896__15898;
    var key__15900 = cljs.core.nth.call(null, vec__15897__15899, 0, null);
    var f__15901 = cljs.core.nth.call(null, vec__15897__15899, 1, null);
    var G__15893__15902 = G__15893__15894;
    var G__15896__15903 = G__15896__15898;
    var G__15893__15904 = G__15893__15902;
    while(true) {
      var vec__15905__15906 = G__15896__15903;
      var key__15907 = cljs.core.nth.call(null, vec__15905__15906, 0, null);
      var f__15908 = cljs.core.nth.call(null, vec__15905__15906, 1, null);
      var G__15893__15909 = G__15893__15904;
      f__15908.call(null, key__15907, this$, oldval, newval);
      var temp__3974__auto____15910 = cljs.core.next.call(null, G__15893__15909);
      if(cljs.core.truth_(temp__3974__auto____15910)) {
        var G__15893__15911 = temp__3974__auto____15910;
        var G__15918 = cljs.core.first.call(null, G__15893__15911);
        var G__15919 = G__15893__15911;
        G__15896__15903 = G__15918;
        G__15893__15904 = G__15919;
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
cljs.core.Atom.prototype.cljs$core$IWatchable$_add_watch = function(this$, key, f) {
  var this__15912 = this;
  return this$.watches = cljs.core.assoc.call(null, this__15912.watches, key, f)
};
cljs.core.Atom.prototype.cljs$core$IWatchable$_remove_watch = function(this$, key) {
  var this__15913 = this;
  return this$.watches = cljs.core.dissoc.call(null, this__15913.watches, key)
};
cljs.core.Atom.prototype.cljs$core$IPrintable$ = true;
cljs.core.Atom.prototype.cljs$core$IPrintable$_pr_seq = function(a, opts) {
  var this__15914 = this;
  return cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray(["#<Atom: "]), cljs.core._pr_seq.call(null, this__15914.state, opts), ">")
};
cljs.core.Atom.prototype.cljs$core$IMeta$ = true;
cljs.core.Atom.prototype.cljs$core$IMeta$_meta = function(_) {
  var this__15915 = this;
  return this__15915.meta
};
cljs.core.Atom.prototype.cljs$core$IDeref$ = true;
cljs.core.Atom.prototype.cljs$core$IDeref$_deref = function(_) {
  var this__15916 = this;
  return this__15916.state
};
cljs.core.Atom.prototype.cljs$core$IEquiv$ = true;
cljs.core.Atom.prototype.cljs$core$IEquiv$_equiv = function(o, other) {
  var this__15917 = this;
  return o === other
};
cljs.core.Atom;
cljs.core.atom = function() {
  var atom = null;
  var atom__15926 = function(x) {
    return new cljs.core.Atom(x, null, null, null)
  };
  var atom__15927 = function() {
    var G__15929__delegate = function(x, p__15920) {
      var map__15921__15922 = p__15920;
      var map__15921__15923 = cljs.core.truth_(cljs.core.seq_QMARK_.call(null, map__15921__15922)) ? cljs.core.apply.call(null, cljs.core.hash_map, map__15921__15922) : map__15921__15922;
      var validator__15924 = cljs.core.get.call(null, map__15921__15923, "\ufdd0'validator");
      var meta__15925 = cljs.core.get.call(null, map__15921__15923, "\ufdd0'meta");
      return new cljs.core.Atom(x, meta__15925, validator__15924, null)
    };
    var G__15929 = function(x, var_args) {
      var p__15920 = null;
      if(goog.isDef(var_args)) {
        p__15920 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__15929__delegate.call(this, x, p__15920)
    };
    G__15929.cljs$lang$maxFixedArity = 1;
    G__15929.cljs$lang$applyTo = function(arglist__15930) {
      var x = cljs.core.first(arglist__15930);
      var p__15920 = cljs.core.rest(arglist__15930);
      return G__15929__delegate.call(this, x, p__15920)
    };
    return G__15929
  }();
  atom = function(x, var_args) {
    var p__15920 = var_args;
    switch(arguments.length) {
      case 1:
        return atom__15926.call(this, x);
      default:
        return atom__15927.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  atom.cljs$lang$maxFixedArity = 1;
  atom.cljs$lang$applyTo = atom__15927.cljs$lang$applyTo;
  return atom
}();
cljs.core.reset_BANG_ = function reset_BANG_(a, new_value) {
  var temp__3974__auto____15931 = a.validator;
  if(cljs.core.truth_(temp__3974__auto____15931)) {
    var validate__15932 = temp__3974__auto____15931;
    if(cljs.core.truth_(validate__15932.call(null, new_value))) {
    }else {
      throw new Error(cljs.core.str.call(null, "Assert failed: ", "Validator rejected reference state", "\n", cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'validate", "\ufdd1'new-value"), cljs.core.hash_map("\ufdd0'line", 3282)))));
    }
  }else {
  }
  var old_value__15933 = a.state;
  a.state = new_value;
  cljs.core._notify_watches.call(null, a, old_value__15933, new_value);
  return new_value
};
cljs.core.swap_BANG_ = function() {
  var swap_BANG_ = null;
  var swap_BANG___15934 = function(a, f) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state))
  };
  var swap_BANG___15935 = function(a, f, x) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state, x))
  };
  var swap_BANG___15936 = function(a, f, x, y) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state, x, y))
  };
  var swap_BANG___15937 = function(a, f, x, y, z) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state, x, y, z))
  };
  var swap_BANG___15938 = function() {
    var G__15940__delegate = function(a, f, x, y, z, more) {
      return cljs.core.reset_BANG_.call(null, a, cljs.core.apply.call(null, f, a.state, x, y, z, more))
    };
    var G__15940 = function(a, f, x, y, z, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 5), 0)
      }
      return G__15940__delegate.call(this, a, f, x, y, z, more)
    };
    G__15940.cljs$lang$maxFixedArity = 5;
    G__15940.cljs$lang$applyTo = function(arglist__15941) {
      var a = cljs.core.first(arglist__15941);
      var f = cljs.core.first(cljs.core.next(arglist__15941));
      var x = cljs.core.first(cljs.core.next(cljs.core.next(arglist__15941)));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__15941))));
      var z = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__15941)))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__15941)))));
      return G__15940__delegate.call(this, a, f, x, y, z, more)
    };
    return G__15940
  }();
  swap_BANG_ = function(a, f, x, y, z, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return swap_BANG___15934.call(this, a, f);
      case 3:
        return swap_BANG___15935.call(this, a, f, x);
      case 4:
        return swap_BANG___15936.call(this, a, f, x, y);
      case 5:
        return swap_BANG___15937.call(this, a, f, x, y, z);
      default:
        return swap_BANG___15938.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  swap_BANG_.cljs$lang$maxFixedArity = 5;
  swap_BANG_.cljs$lang$applyTo = swap_BANG___15938.cljs$lang$applyTo;
  return swap_BANG_
}();
cljs.core.compare_and_set_BANG_ = function compare_and_set_BANG_(a, oldval, newval) {
  if(cljs.core.truth_(cljs.core._EQ_.call(null, a.state, oldval))) {
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
  alter_meta_BANG_.cljs$lang$applyTo = function(arglist__15942) {
    var iref = cljs.core.first(arglist__15942);
    var f = cljs.core.first(cljs.core.next(arglist__15942));
    var args = cljs.core.rest(cljs.core.next(arglist__15942));
    return alter_meta_BANG___delegate.call(this, iref, f, args)
  };
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
  var gensym__15943 = function() {
    return gensym.call(null, "G__")
  };
  var gensym__15944 = function(prefix_string) {
    if(cljs.core.truth_(cljs.core.gensym_counter === null)) {
      cljs.core.gensym_counter = cljs.core.atom.call(null, 0)
    }else {
    }
    return cljs.core.symbol.call(null, cljs.core.str.call(null, prefix_string, cljs.core.swap_BANG_.call(null, cljs.core.gensym_counter, cljs.core.inc)))
  };
  gensym = function(prefix_string) {
    switch(arguments.length) {
      case 0:
        return gensym__15943.call(this);
      case 1:
        return gensym__15944.call(this, prefix_string)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return gensym
}();
cljs.core.fixture1 = 1;
cljs.core.fixture2 = 2;
cljs.core.Delay = function(state, f) {
  this.state = state;
  this.f = f
};
cljs.core.Delay.cljs$core$IPrintable$_pr_seq = function(this__367__auto__) {
  return cljs.core.list.call(null, "cljs.core.Delay")
};
cljs.core.Delay.prototype.cljs$core$IPending$ = true;
cljs.core.Delay.prototype.cljs$core$IPending$_realized_QMARK_ = function(d) {
  var this__15946 = this;
  return"\ufdd0'done".call(null, cljs.core.deref.call(null, this__15946.state))
};
cljs.core.Delay.prototype.cljs$core$IDeref$ = true;
cljs.core.Delay.prototype.cljs$core$IDeref$_deref = function(_) {
  var this__15947 = this;
  return"\ufdd0'value".call(null, cljs.core.swap_BANG_.call(null, this__15947.state, function(p__15948) {
    var curr_state__15949 = p__15948;
    var curr_state__15950 = cljs.core.truth_(cljs.core.seq_QMARK_.call(null, curr_state__15949)) ? cljs.core.apply.call(null, cljs.core.hash_map, curr_state__15949) : curr_state__15949;
    var done__15951 = cljs.core.get.call(null, curr_state__15950, "\ufdd0'done");
    if(cljs.core.truth_(done__15951)) {
      return curr_state__15950
    }else {
      return cljs.core.ObjMap.fromObject(["\ufdd0'done", "\ufdd0'value"], {"\ufdd0'done":true, "\ufdd0'value":this__15947.f.call(null)})
    }
  }))
};
cljs.core.Delay;
cljs.core.delay_QMARK_ = function delay_QMARK_(x) {
  return cljs.core.instance_QMARK_.call(null, cljs.core.Delay, x)
};
cljs.core.force = function force(x) {
  if(cljs.core.truth_(cljs.core.delay_QMARK_.call(null, x))) {
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
    var map__15952__15953 = options;
    var map__15952__15954 = cljs.core.truth_(cljs.core.seq_QMARK_.call(null, map__15952__15953)) ? cljs.core.apply.call(null, cljs.core.hash_map, map__15952__15953) : map__15952__15953;
    var keywordize_keys__15955 = cljs.core.get.call(null, map__15952__15954, "\ufdd0'keywordize-keys");
    var keyfn__15956 = cljs.core.truth_(keywordize_keys__15955) ? cljs.core.keyword : cljs.core.str;
    var f__15962 = function thisfn(x) {
      if(cljs.core.truth_(cljs.core.seq_QMARK_.call(null, x))) {
        return cljs.core.doall.call(null, cljs.core.map.call(null, thisfn, x))
      }else {
        if(cljs.core.truth_(cljs.core.coll_QMARK_.call(null, x))) {
          return cljs.core.into.call(null, cljs.core.empty.call(null, x), cljs.core.map.call(null, thisfn, x))
        }else {
          if(cljs.core.truth_(goog.isArray.call(null, x))) {
            return cljs.core.vec.call(null, cljs.core.map.call(null, thisfn, x))
          }else {
            if(cljs.core.truth_(goog.isObject.call(null, x))) {
              return cljs.core.into.call(null, cljs.core.ObjMap.fromObject([], {}), function() {
                var iter__520__auto____15961 = function iter__15957(s__15958) {
                  return new cljs.core.LazySeq(null, false, function() {
                    var s__15958__15959 = s__15958;
                    while(true) {
                      if(cljs.core.truth_(cljs.core.seq.call(null, s__15958__15959))) {
                        var k__15960 = cljs.core.first.call(null, s__15958__15959);
                        return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([keyfn__15956.call(null, k__15960), thisfn.call(null, x[k__15960])]), iter__15957.call(null, cljs.core.rest.call(null, s__15958__15959)))
                      }else {
                        return null
                      }
                      break
                    }
                  })
                };
                return iter__520__auto____15961.call(null, cljs.core.js_keys.call(null, x))
              }())
            }else {
              if(cljs.core.truth_("\ufdd0'else")) {
                return x
              }else {
                return null
              }
            }
          }
        }
      }
    };
    return f__15962.call(null, x)
  };
  var js__GT_clj = function(x, var_args) {
    var options = null;
    if(goog.isDef(var_args)) {
      options = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return js__GT_clj__delegate.call(this, x, options)
  };
  js__GT_clj.cljs$lang$maxFixedArity = 1;
  js__GT_clj.cljs$lang$applyTo = function(arglist__15963) {
    var x = cljs.core.first(arglist__15963);
    var options = cljs.core.rest(arglist__15963);
    return js__GT_clj__delegate.call(this, x, options)
  };
  return js__GT_clj
}();
cljs.core.memoize = function memoize(f) {
  var mem__15964 = cljs.core.atom.call(null, cljs.core.ObjMap.fromObject([], {}));
  return function() {
    var G__15968__delegate = function(args) {
      var temp__3971__auto____15965 = cljs.core.get.call(null, cljs.core.deref.call(null, mem__15964), args);
      if(cljs.core.truth_(temp__3971__auto____15965)) {
        var v__15966 = temp__3971__auto____15965;
        return v__15966
      }else {
        var ret__15967 = cljs.core.apply.call(null, f, args);
        cljs.core.swap_BANG_.call(null, mem__15964, cljs.core.assoc, args, ret__15967);
        return ret__15967
      }
    };
    var G__15968 = function(var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__15968__delegate.call(this, args)
    };
    G__15968.cljs$lang$maxFixedArity = 0;
    G__15968.cljs$lang$applyTo = function(arglist__15969) {
      var args = cljs.core.seq(arglist__15969);
      return G__15968__delegate.call(this, args)
    };
    return G__15968
  }()
};
cljs.core.trampoline = function() {
  var trampoline = null;
  var trampoline__15971 = function(f) {
    while(true) {
      var ret__15970 = f.call(null);
      if(cljs.core.truth_(cljs.core.fn_QMARK_.call(null, ret__15970))) {
        var G__15974 = ret__15970;
        f = G__15974;
        continue
      }else {
        return ret__15970
      }
      break
    }
  };
  var trampoline__15972 = function() {
    var G__15975__delegate = function(f, args) {
      return trampoline.call(null, function() {
        return cljs.core.apply.call(null, f, args)
      })
    };
    var G__15975 = function(f, var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__15975__delegate.call(this, f, args)
    };
    G__15975.cljs$lang$maxFixedArity = 1;
    G__15975.cljs$lang$applyTo = function(arglist__15976) {
      var f = cljs.core.first(arglist__15976);
      var args = cljs.core.rest(arglist__15976);
      return G__15975__delegate.call(this, f, args)
    };
    return G__15975
  }();
  trampoline = function(f, var_args) {
    var args = var_args;
    switch(arguments.length) {
      case 1:
        return trampoline__15971.call(this, f);
      default:
        return trampoline__15972.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  trampoline.cljs$lang$maxFixedArity = 1;
  trampoline.cljs$lang$applyTo = trampoline__15972.cljs$lang$applyTo;
  return trampoline
}();
cljs.core.rand = function() {
  var rand = null;
  var rand__15977 = function() {
    return rand.call(null, 1)
  };
  var rand__15978 = function(n) {
    return Math.random() * n
  };
  rand = function(n) {
    switch(arguments.length) {
      case 0:
        return rand__15977.call(this);
      case 1:
        return rand__15978.call(this, n)
    }
    throw"Invalid arity: " + arguments.length;
  };
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
    var k__15980 = f.call(null, x);
    return cljs.core.assoc.call(null, ret, k__15980, cljs.core.conj.call(null, cljs.core.get.call(null, ret, k__15980, cljs.core.PersistentVector.fromArray([])), x))
  }, cljs.core.ObjMap.fromObject([], {}), coll)
};
cljs.core.make_hierarchy = function make_hierarchy() {
  return cljs.core.ObjMap.fromObject(["\ufdd0'parents", "\ufdd0'descendants", "\ufdd0'ancestors"], {"\ufdd0'parents":cljs.core.ObjMap.fromObject([], {}), "\ufdd0'descendants":cljs.core.ObjMap.fromObject([], {}), "\ufdd0'ancestors":cljs.core.ObjMap.fromObject([], {})})
};
cljs.core.global_hierarchy = cljs.core.atom.call(null, cljs.core.make_hierarchy.call(null));
cljs.core.isa_QMARK_ = function() {
  var isa_QMARK_ = null;
  var isa_QMARK___15989 = function(child, parent) {
    return isa_QMARK_.call(null, cljs.core.deref.call(null, cljs.core.global_hierarchy), child, parent)
  };
  var isa_QMARK___15990 = function(h, child, parent) {
    var or__3824__auto____15981 = cljs.core._EQ_.call(null, child, parent);
    if(cljs.core.truth_(or__3824__auto____15981)) {
      return or__3824__auto____15981
    }else {
      var or__3824__auto____15982 = cljs.core.contains_QMARK_.call(null, "\ufdd0'ancestors".call(null, h).call(null, child), parent);
      if(cljs.core.truth_(or__3824__auto____15982)) {
        return or__3824__auto____15982
      }else {
        var and__3822__auto____15983 = cljs.core.vector_QMARK_.call(null, parent);
        if(cljs.core.truth_(and__3822__auto____15983)) {
          var and__3822__auto____15984 = cljs.core.vector_QMARK_.call(null, child);
          if(cljs.core.truth_(and__3822__auto____15984)) {
            var and__3822__auto____15985 = cljs.core._EQ_.call(null, cljs.core.count.call(null, parent), cljs.core.count.call(null, child));
            if(cljs.core.truth_(and__3822__auto____15985)) {
              var ret__15986 = true;
              var i__15987 = 0;
              while(true) {
                if(cljs.core.truth_(function() {
                  var or__3824__auto____15988 = cljs.core.not.call(null, ret__15986);
                  if(cljs.core.truth_(or__3824__auto____15988)) {
                    return or__3824__auto____15988
                  }else {
                    return cljs.core._EQ_.call(null, i__15987, cljs.core.count.call(null, parent))
                  }
                }())) {
                  return ret__15986
                }else {
                  var G__15992 = isa_QMARK_.call(null, h, child.call(null, i__15987), parent.call(null, i__15987));
                  var G__15993 = i__15987 + 1;
                  ret__15986 = G__15992;
                  i__15987 = G__15993;
                  continue
                }
                break
              }
            }else {
              return and__3822__auto____15985
            }
          }else {
            return and__3822__auto____15984
          }
        }else {
          return and__3822__auto____15983
        }
      }
    }
  };
  isa_QMARK_ = function(h, child, parent) {
    switch(arguments.length) {
      case 2:
        return isa_QMARK___15989.call(this, h, child);
      case 3:
        return isa_QMARK___15990.call(this, h, child, parent)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return isa_QMARK_
}();
cljs.core.parents = function() {
  var parents = null;
  var parents__15994 = function(tag) {
    return parents.call(null, cljs.core.deref.call(null, cljs.core.global_hierarchy), tag)
  };
  var parents__15995 = function(h, tag) {
    return cljs.core.not_empty.call(null, cljs.core.get.call(null, "\ufdd0'parents".call(null, h), tag))
  };
  parents = function(h, tag) {
    switch(arguments.length) {
      case 1:
        return parents__15994.call(this, h);
      case 2:
        return parents__15995.call(this, h, tag)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return parents
}();
cljs.core.ancestors = function() {
  var ancestors = null;
  var ancestors__15997 = function(tag) {
    return ancestors.call(null, cljs.core.deref.call(null, cljs.core.global_hierarchy), tag)
  };
  var ancestors__15998 = function(h, tag) {
    return cljs.core.not_empty.call(null, cljs.core.get.call(null, "\ufdd0'ancestors".call(null, h), tag))
  };
  ancestors = function(h, tag) {
    switch(arguments.length) {
      case 1:
        return ancestors__15997.call(this, h);
      case 2:
        return ancestors__15998.call(this, h, tag)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return ancestors
}();
cljs.core.descendants = function() {
  var descendants = null;
  var descendants__16000 = function(tag) {
    return descendants.call(null, cljs.core.deref.call(null, cljs.core.global_hierarchy), tag)
  };
  var descendants__16001 = function(h, tag) {
    return cljs.core.not_empty.call(null, cljs.core.get.call(null, "\ufdd0'descendants".call(null, h), tag))
  };
  descendants = function(h, tag) {
    switch(arguments.length) {
      case 1:
        return descendants__16000.call(this, h);
      case 2:
        return descendants__16001.call(this, h, tag)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return descendants
}();
cljs.core.derive = function() {
  var derive = null;
  var derive__16011 = function(tag, parent) {
    if(cljs.core.truth_(cljs.core.namespace.call(null, parent))) {
    }else {
      throw new Error(cljs.core.str.call(null, "Assert failed: ", cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'namespace", "\ufdd1'parent"), cljs.core.hash_map("\ufdd0'line", 3566)))));
    }
    cljs.core.swap_BANG_.call(null, cljs.core.global_hierarchy, derive, tag, parent);
    return null
  };
  var derive__16012 = function(h, tag, parent) {
    if(cljs.core.truth_(cljs.core.not_EQ_.call(null, tag, parent))) {
    }else {
      throw new Error(cljs.core.str.call(null, "Assert failed: ", cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'not=", "\ufdd1'tag", "\ufdd1'parent"), cljs.core.hash_map("\ufdd0'line", 3570)))));
    }
    var tp__16006 = "\ufdd0'parents".call(null, h);
    var td__16007 = "\ufdd0'descendants".call(null, h);
    var ta__16008 = "\ufdd0'ancestors".call(null, h);
    var tf__16009 = function(m, source, sources, target, targets) {
      return cljs.core.reduce.call(null, function(ret, k) {
        return cljs.core.assoc.call(null, ret, k, cljs.core.reduce.call(null, cljs.core.conj, cljs.core.get.call(null, targets, k, cljs.core.set([])), cljs.core.cons.call(null, target, targets.call(null, target))))
      }, m, cljs.core.cons.call(null, source, sources.call(null, source)))
    };
    var or__3824__auto____16010 = cljs.core.truth_(cljs.core.contains_QMARK_.call(null, tp__16006.call(null, tag), parent)) ? null : function() {
      if(cljs.core.truth_(cljs.core.contains_QMARK_.call(null, ta__16008.call(null, tag), parent))) {
        throw new Error(cljs.core.str.call(null, tag, "already has", parent, "as ancestor"));
      }else {
      }
      if(cljs.core.truth_(cljs.core.contains_QMARK_.call(null, ta__16008.call(null, parent), tag))) {
        throw new Error(cljs.core.str.call(null, "Cyclic derivation:", parent, "has", tag, "as ancestor"));
      }else {
      }
      return cljs.core.ObjMap.fromObject(["\ufdd0'parents", "\ufdd0'ancestors", "\ufdd0'descendants"], {"\ufdd0'parents":cljs.core.assoc.call(null, "\ufdd0'parents".call(null, h), tag, cljs.core.conj.call(null, cljs.core.get.call(null, tp__16006, tag, cljs.core.set([])), parent)), "\ufdd0'ancestors":tf__16009.call(null, "\ufdd0'ancestors".call(null, h), tag, td__16007, parent, ta__16008), "\ufdd0'descendants":tf__16009.call(null, "\ufdd0'descendants".call(null, h), parent, ta__16008, tag, td__16007)})
    }();
    if(cljs.core.truth_(or__3824__auto____16010)) {
      return or__3824__auto____16010
    }else {
      return h
    }
  };
  derive = function(h, tag, parent) {
    switch(arguments.length) {
      case 2:
        return derive__16011.call(this, h, tag);
      case 3:
        return derive__16012.call(this, h, tag, parent)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return derive
}();
cljs.core.underive = function() {
  var underive = null;
  var underive__16018 = function(tag, parent) {
    cljs.core.swap_BANG_.call(null, cljs.core.global_hierarchy, underive, tag, parent);
    return null
  };
  var underive__16019 = function(h, tag, parent) {
    var parentMap__16014 = "\ufdd0'parents".call(null, h);
    var childsParents__16015 = cljs.core.truth_(parentMap__16014.call(null, tag)) ? cljs.core.disj.call(null, parentMap__16014.call(null, tag), parent) : cljs.core.set([]);
    var newParents__16016 = cljs.core.truth_(cljs.core.not_empty.call(null, childsParents__16015)) ? cljs.core.assoc.call(null, parentMap__16014, tag, childsParents__16015) : cljs.core.dissoc.call(null, parentMap__16014, tag);
    var deriv_seq__16017 = cljs.core.flatten.call(null, cljs.core.map.call(null, function(p1__16003_SHARP_) {
      return cljs.core.cons.call(null, cljs.core.first.call(null, p1__16003_SHARP_), cljs.core.interpose.call(null, cljs.core.first.call(null, p1__16003_SHARP_), cljs.core.second.call(null, p1__16003_SHARP_)))
    }, cljs.core.seq.call(null, newParents__16016)));
    if(cljs.core.truth_(cljs.core.contains_QMARK_.call(null, parentMap__16014.call(null, tag), parent))) {
      return cljs.core.reduce.call(null, function(p1__16004_SHARP_, p2__16005_SHARP_) {
        return cljs.core.apply.call(null, cljs.core.derive, p1__16004_SHARP_, p2__16005_SHARP_)
      }, cljs.core.make_hierarchy.call(null), cljs.core.partition.call(null, 2, deriv_seq__16017))
    }else {
      return h
    }
  };
  underive = function(h, tag, parent) {
    switch(arguments.length) {
      case 2:
        return underive__16018.call(this, h, tag);
      case 3:
        return underive__16019.call(this, h, tag, parent)
    }
    throw"Invalid arity: " + arguments.length;
  };
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
  var xprefs__16021 = cljs.core.deref.call(null, prefer_table).call(null, x);
  var or__3824__auto____16023 = cljs.core.truth_(function() {
    var and__3822__auto____16022 = xprefs__16021;
    if(cljs.core.truth_(and__3822__auto____16022)) {
      return xprefs__16021.call(null, y)
    }else {
      return and__3822__auto____16022
    }
  }()) ? true : null;
  if(cljs.core.truth_(or__3824__auto____16023)) {
    return or__3824__auto____16023
  }else {
    var or__3824__auto____16025 = function() {
      var ps__16024 = cljs.core.parents.call(null, y);
      while(true) {
        if(cljs.core.truth_(cljs.core.count.call(null, ps__16024) > 0)) {
          if(cljs.core.truth_(prefers_STAR_.call(null, x, cljs.core.first.call(null, ps__16024), prefer_table))) {
          }else {
          }
          var G__16028 = cljs.core.rest.call(null, ps__16024);
          ps__16024 = G__16028;
          continue
        }else {
          return null
        }
        break
      }
    }();
    if(cljs.core.truth_(or__3824__auto____16025)) {
      return or__3824__auto____16025
    }else {
      var or__3824__auto____16027 = function() {
        var ps__16026 = cljs.core.parents.call(null, x);
        while(true) {
          if(cljs.core.truth_(cljs.core.count.call(null, ps__16026) > 0)) {
            if(cljs.core.truth_(prefers_STAR_.call(null, cljs.core.first.call(null, ps__16026), y, prefer_table))) {
            }else {
            }
            var G__16029 = cljs.core.rest.call(null, ps__16026);
            ps__16026 = G__16029;
            continue
          }else {
            return null
          }
          break
        }
      }();
      if(cljs.core.truth_(or__3824__auto____16027)) {
        return or__3824__auto____16027
      }else {
        return false
      }
    }
  }
};
cljs.core.dominates = function dominates(x, y, prefer_table) {
  var or__3824__auto____16030 = cljs.core.prefers_STAR_.call(null, x, y, prefer_table);
  if(cljs.core.truth_(or__3824__auto____16030)) {
    return or__3824__auto____16030
  }else {
    return cljs.core.isa_QMARK_.call(null, x, y)
  }
};
cljs.core.find_and_cache_best_method = function find_and_cache_best_method(name, dispatch_val, hierarchy, method_table, prefer_table, method_cache, cached_hierarchy) {
  var best_entry__16039 = cljs.core.reduce.call(null, function(be, p__16031) {
    var vec__16032__16033 = p__16031;
    var k__16034 = cljs.core.nth.call(null, vec__16032__16033, 0, null);
    var ___16035 = cljs.core.nth.call(null, vec__16032__16033, 1, null);
    var e__16036 = vec__16032__16033;
    if(cljs.core.truth_(cljs.core.isa_QMARK_.call(null, dispatch_val, k__16034))) {
      var be2__16038 = cljs.core.truth_(function() {
        var or__3824__auto____16037 = be === null;
        if(cljs.core.truth_(or__3824__auto____16037)) {
          return or__3824__auto____16037
        }else {
          return cljs.core.dominates.call(null, k__16034, cljs.core.first.call(null, be), prefer_table)
        }
      }()) ? e__16036 : be;
      if(cljs.core.truth_(cljs.core.dominates.call(null, cljs.core.first.call(null, be2__16038), k__16034, prefer_table))) {
      }else {
        throw new Error(cljs.core.str.call(null, "Multiple methods in multimethod '", name, "' match dispatch value: ", dispatch_val, " -> ", k__16034, " and ", cljs.core.first.call(null, be2__16038), ", and neither is preferred"));
      }
      return be2__16038
    }else {
      return be
    }
  }, null, cljs.core.deref.call(null, method_table));
  if(cljs.core.truth_(best_entry__16039)) {
    if(cljs.core.truth_(cljs.core._EQ_.call(null, cljs.core.deref.call(null, cached_hierarchy), cljs.core.deref.call(null, hierarchy)))) {
      cljs.core.swap_BANG_.call(null, method_cache, cljs.core.assoc, dispatch_val, cljs.core.second.call(null, best_entry__16039));
      return cljs.core.second.call(null, best_entry__16039)
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
  if(cljs.core.truth_(function() {
    var and__3822__auto____16040 = mf;
    if(cljs.core.truth_(and__3822__auto____16040)) {
      return mf.cljs$core$IMultiFn$_reset
    }else {
      return and__3822__auto____16040
    }
  }())) {
    return mf.cljs$core$IMultiFn$_reset(mf)
  }else {
    return function() {
      var or__3824__auto____16041 = cljs.core._reset[goog.typeOf.call(null, mf)];
      if(cljs.core.truth_(or__3824__auto____16041)) {
        return or__3824__auto____16041
      }else {
        var or__3824__auto____16042 = cljs.core._reset["_"];
        if(cljs.core.truth_(or__3824__auto____16042)) {
          return or__3824__auto____16042
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-reset", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._add_method = function _add_method(mf, dispatch_val, method) {
  if(cljs.core.truth_(function() {
    var and__3822__auto____16043 = mf;
    if(cljs.core.truth_(and__3822__auto____16043)) {
      return mf.cljs$core$IMultiFn$_add_method
    }else {
      return and__3822__auto____16043
    }
  }())) {
    return mf.cljs$core$IMultiFn$_add_method(mf, dispatch_val, method)
  }else {
    return function() {
      var or__3824__auto____16044 = cljs.core._add_method[goog.typeOf.call(null, mf)];
      if(cljs.core.truth_(or__3824__auto____16044)) {
        return or__3824__auto____16044
      }else {
        var or__3824__auto____16045 = cljs.core._add_method["_"];
        if(cljs.core.truth_(or__3824__auto____16045)) {
          return or__3824__auto____16045
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-add-method", mf);
        }
      }
    }().call(null, mf, dispatch_val, method)
  }
};
cljs.core._remove_method = function _remove_method(mf, dispatch_val) {
  if(cljs.core.truth_(function() {
    var and__3822__auto____16046 = mf;
    if(cljs.core.truth_(and__3822__auto____16046)) {
      return mf.cljs$core$IMultiFn$_remove_method
    }else {
      return and__3822__auto____16046
    }
  }())) {
    return mf.cljs$core$IMultiFn$_remove_method(mf, dispatch_val)
  }else {
    return function() {
      var or__3824__auto____16047 = cljs.core._remove_method[goog.typeOf.call(null, mf)];
      if(cljs.core.truth_(or__3824__auto____16047)) {
        return or__3824__auto____16047
      }else {
        var or__3824__auto____16048 = cljs.core._remove_method["_"];
        if(cljs.core.truth_(or__3824__auto____16048)) {
          return or__3824__auto____16048
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-remove-method", mf);
        }
      }
    }().call(null, mf, dispatch_val)
  }
};
cljs.core._prefer_method = function _prefer_method(mf, dispatch_val, dispatch_val_y) {
  if(cljs.core.truth_(function() {
    var and__3822__auto____16049 = mf;
    if(cljs.core.truth_(and__3822__auto____16049)) {
      return mf.cljs$core$IMultiFn$_prefer_method
    }else {
      return and__3822__auto____16049
    }
  }())) {
    return mf.cljs$core$IMultiFn$_prefer_method(mf, dispatch_val, dispatch_val_y)
  }else {
    return function() {
      var or__3824__auto____16050 = cljs.core._prefer_method[goog.typeOf.call(null, mf)];
      if(cljs.core.truth_(or__3824__auto____16050)) {
        return or__3824__auto____16050
      }else {
        var or__3824__auto____16051 = cljs.core._prefer_method["_"];
        if(cljs.core.truth_(or__3824__auto____16051)) {
          return or__3824__auto____16051
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-prefer-method", mf);
        }
      }
    }().call(null, mf, dispatch_val, dispatch_val_y)
  }
};
cljs.core._get_method = function _get_method(mf, dispatch_val) {
  if(cljs.core.truth_(function() {
    var and__3822__auto____16052 = mf;
    if(cljs.core.truth_(and__3822__auto____16052)) {
      return mf.cljs$core$IMultiFn$_get_method
    }else {
      return and__3822__auto____16052
    }
  }())) {
    return mf.cljs$core$IMultiFn$_get_method(mf, dispatch_val)
  }else {
    return function() {
      var or__3824__auto____16053 = cljs.core._get_method[goog.typeOf.call(null, mf)];
      if(cljs.core.truth_(or__3824__auto____16053)) {
        return or__3824__auto____16053
      }else {
        var or__3824__auto____16054 = cljs.core._get_method["_"];
        if(cljs.core.truth_(or__3824__auto____16054)) {
          return or__3824__auto____16054
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-get-method", mf);
        }
      }
    }().call(null, mf, dispatch_val)
  }
};
cljs.core._methods = function _methods(mf) {
  if(cljs.core.truth_(function() {
    var and__3822__auto____16055 = mf;
    if(cljs.core.truth_(and__3822__auto____16055)) {
      return mf.cljs$core$IMultiFn$_methods
    }else {
      return and__3822__auto____16055
    }
  }())) {
    return mf.cljs$core$IMultiFn$_methods(mf)
  }else {
    return function() {
      var or__3824__auto____16056 = cljs.core._methods[goog.typeOf.call(null, mf)];
      if(cljs.core.truth_(or__3824__auto____16056)) {
        return or__3824__auto____16056
      }else {
        var or__3824__auto____16057 = cljs.core._methods["_"];
        if(cljs.core.truth_(or__3824__auto____16057)) {
          return or__3824__auto____16057
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-methods", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._prefers = function _prefers(mf) {
  if(cljs.core.truth_(function() {
    var and__3822__auto____16058 = mf;
    if(cljs.core.truth_(and__3822__auto____16058)) {
      return mf.cljs$core$IMultiFn$_prefers
    }else {
      return and__3822__auto____16058
    }
  }())) {
    return mf.cljs$core$IMultiFn$_prefers(mf)
  }else {
    return function() {
      var or__3824__auto____16059 = cljs.core._prefers[goog.typeOf.call(null, mf)];
      if(cljs.core.truth_(or__3824__auto____16059)) {
        return or__3824__auto____16059
      }else {
        var or__3824__auto____16060 = cljs.core._prefers["_"];
        if(cljs.core.truth_(or__3824__auto____16060)) {
          return or__3824__auto____16060
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-prefers", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._dispatch = function _dispatch(mf, args) {
  if(cljs.core.truth_(function() {
    var and__3822__auto____16061 = mf;
    if(cljs.core.truth_(and__3822__auto____16061)) {
      return mf.cljs$core$IMultiFn$_dispatch
    }else {
      return and__3822__auto____16061
    }
  }())) {
    return mf.cljs$core$IMultiFn$_dispatch(mf, args)
  }else {
    return function() {
      var or__3824__auto____16062 = cljs.core._dispatch[goog.typeOf.call(null, mf)];
      if(cljs.core.truth_(or__3824__auto____16062)) {
        return or__3824__auto____16062
      }else {
        var or__3824__auto____16063 = cljs.core._dispatch["_"];
        if(cljs.core.truth_(or__3824__auto____16063)) {
          return or__3824__auto____16063
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-dispatch", mf);
        }
      }
    }().call(null, mf, args)
  }
};
cljs.core.do_dispatch = function do_dispatch(mf, dispatch_fn, args) {
  var dispatch_val__16064 = cljs.core.apply.call(null, dispatch_fn, args);
  var target_fn__16065 = cljs.core._get_method.call(null, mf, dispatch_val__16064);
  if(cljs.core.truth_(target_fn__16065)) {
  }else {
    throw new Error(cljs.core.str.call(null, "No method in multimethod '", cljs.core.name, "' for dispatch value: ", dispatch_val__16064));
  }
  return cljs.core.apply.call(null, target_fn__16065, args)
};
cljs.core.MultiFn = function(name, dispatch_fn, default_dispatch_val, hierarchy, method_table, prefer_table, method_cache, cached_hierarchy) {
  this.name = name;
  this.dispatch_fn = dispatch_fn;
  this.default_dispatch_val = default_dispatch_val;
  this.hierarchy = hierarchy;
  this.method_table = method_table;
  this.prefer_table = prefer_table;
  this.method_cache = method_cache;
  this.cached_hierarchy = cached_hierarchy
};
cljs.core.MultiFn.cljs$core$IPrintable$_pr_seq = function(this__367__auto__) {
  return cljs.core.list.call(null, "cljs.core.MultiFn")
};
cljs.core.MultiFn.prototype.cljs$core$IHash$ = true;
cljs.core.MultiFn.prototype.cljs$core$IHash$_hash = function(this$) {
  var this__16066 = this;
  return goog.getUid.call(null, this$)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$ = true;
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_reset = function(mf) {
  var this__16067 = this;
  cljs.core.swap_BANG_.call(null, this__16067.method_table, function(mf) {
    return cljs.core.ObjMap.fromObject([], {})
  });
  cljs.core.swap_BANG_.call(null, this__16067.method_cache, function(mf) {
    return cljs.core.ObjMap.fromObject([], {})
  });
  cljs.core.swap_BANG_.call(null, this__16067.prefer_table, function(mf) {
    return cljs.core.ObjMap.fromObject([], {})
  });
  cljs.core.swap_BANG_.call(null, this__16067.cached_hierarchy, function(mf) {
    return null
  });
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_add_method = function(mf, dispatch_val, method) {
  var this__16068 = this;
  cljs.core.swap_BANG_.call(null, this__16068.method_table, cljs.core.assoc, dispatch_val, method);
  cljs.core.reset_cache.call(null, this__16068.method_cache, this__16068.method_table, this__16068.cached_hierarchy, this__16068.hierarchy);
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_remove_method = function(mf, dispatch_val) {
  var this__16069 = this;
  cljs.core.swap_BANG_.call(null, this__16069.method_table, cljs.core.dissoc, dispatch_val);
  cljs.core.reset_cache.call(null, this__16069.method_cache, this__16069.method_table, this__16069.cached_hierarchy, this__16069.hierarchy);
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_get_method = function(mf, dispatch_val) {
  var this__16070 = this;
  if(cljs.core.truth_(cljs.core._EQ_.call(null, cljs.core.deref.call(null, this__16070.cached_hierarchy), cljs.core.deref.call(null, this__16070.hierarchy)))) {
  }else {
    cljs.core.reset_cache.call(null, this__16070.method_cache, this__16070.method_table, this__16070.cached_hierarchy, this__16070.hierarchy)
  }
  var temp__3971__auto____16071 = cljs.core.deref.call(null, this__16070.method_cache).call(null, dispatch_val);
  if(cljs.core.truth_(temp__3971__auto____16071)) {
    var target_fn__16072 = temp__3971__auto____16071;
    return target_fn__16072
  }else {
    var temp__3971__auto____16073 = cljs.core.find_and_cache_best_method.call(null, this__16070.name, dispatch_val, this__16070.hierarchy, this__16070.method_table, this__16070.prefer_table, this__16070.method_cache, this__16070.cached_hierarchy);
    if(cljs.core.truth_(temp__3971__auto____16073)) {
      var target_fn__16074 = temp__3971__auto____16073;
      return target_fn__16074
    }else {
      return cljs.core.deref.call(null, this__16070.method_table).call(null, this__16070.default_dispatch_val)
    }
  }
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_prefer_method = function(mf, dispatch_val_x, dispatch_val_y) {
  var this__16075 = this;
  if(cljs.core.truth_(cljs.core.prefers_STAR_.call(null, dispatch_val_x, dispatch_val_y, this__16075.prefer_table))) {
    throw new Error(cljs.core.str.call(null, "Preference conflict in multimethod '", this__16075.name, "': ", dispatch_val_y, " is already preferred to ", dispatch_val_x));
  }else {
  }
  cljs.core.swap_BANG_.call(null, this__16075.prefer_table, function(old) {
    return cljs.core.assoc.call(null, old, dispatch_val_x, cljs.core.conj.call(null, cljs.core.get.call(null, old, dispatch_val_x, cljs.core.set([])), dispatch_val_y))
  });
  return cljs.core.reset_cache.call(null, this__16075.method_cache, this__16075.method_table, this__16075.cached_hierarchy, this__16075.hierarchy)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_methods = function(mf) {
  var this__16076 = this;
  return cljs.core.deref.call(null, this__16076.method_table)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_prefers = function(mf) {
  var this__16077 = this;
  return cljs.core.deref.call(null, this__16077.prefer_table)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_dispatch = function(mf, args) {
  var this__16078 = this;
  return cljs.core.do_dispatch.call(null, mf, this__16078.dispatch_fn, args)
};
cljs.core.MultiFn;
cljs.core.MultiFn.prototype.call = function() {
  var G__16079__delegate = function(_, args) {
    return cljs.core._dispatch.call(null, this, args)
  };
  var G__16079 = function(_, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return G__16079__delegate.call(this, _, args)
  };
  G__16079.cljs$lang$maxFixedArity = 1;
  G__16079.cljs$lang$applyTo = function(arglist__16080) {
    var _ = cljs.core.first(arglist__16080);
    var args = cljs.core.rest(arglist__16080);
    return G__16079__delegate.call(this, _, args)
  };
  return G__16079
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
goog.provide("onedit.core");
goog.require("cljs.core");
goog.require("goog.debug.Logger");
goog.require("goog.dom");
onedit.core.logger = goog.debug.Logger.getLogger("onedit");
onedit.core.log = function log(p1__7134_SHARP_) {
  return onedit.core.logger.info(p1__7134_SHARP_)
};
onedit.core.local = window.localStorage;
onedit.core.Mode = {};
onedit.core.action = function action(mode, editor, e) {
  if(function() {
    var and__3822__auto____7139 = mode;
    if(and__3822__auto____7139) {
      return mode.onedit$core$Mode$action$arity$3
    }else {
      return and__3822__auto____7139
    }
  }()) {
    return mode.onedit$core$Mode$action$arity$3(mode, editor, e)
  }else {
    var x__2387__auto____7140 = mode == null ? null : mode;
    return function() {
      var or__3824__auto____7141 = onedit.core.action[goog.typeOf(x__2387__auto____7140)];
      if(or__3824__auto____7141) {
        return or__3824__auto____7141
      }else {
        var or__3824__auto____7142 = onedit.core.action["_"];
        if(or__3824__auto____7142) {
          return or__3824__auto____7142
        }else {
          throw cljs.core.missing_protocol.call(null, "Mode.action", mode);
        }
      }
    }().call(null, mode, editor, e)
  }
};
onedit.core.IEditor = {};
onedit.core.mode = function mode(this$) {
  if(function() {
    var and__3822__auto____7147 = this$;
    if(and__3822__auto____7147) {
      return this$.onedit$core$IEditor$mode$arity$1
    }else {
      return and__3822__auto____7147
    }
  }()) {
    return this$.onedit$core$IEditor$mode$arity$1(this$)
  }else {
    var x__2387__auto____7148 = this$ == null ? null : this$;
    return function() {
      var or__3824__auto____7149 = onedit.core.mode[goog.typeOf(x__2387__auto____7148)];
      if(or__3824__auto____7149) {
        return or__3824__auto____7149
      }else {
        var or__3824__auto____7150 = onedit.core.mode["_"];
        if(or__3824__auto____7150) {
          return or__3824__auto____7150
        }else {
          throw cljs.core.missing_protocol.call(null, "IEditor.mode", this$);
        }
      }
    }().call(null, this$)
  }
};
onedit.core.buffer = function buffer(this$) {
  if(function() {
    var and__3822__auto____7155 = this$;
    if(and__3822__auto____7155) {
      return this$.onedit$core$IEditor$buffer$arity$1
    }else {
      return and__3822__auto____7155
    }
  }()) {
    return this$.onedit$core$IEditor$buffer$arity$1(this$)
  }else {
    var x__2387__auto____7156 = this$ == null ? null : this$;
    return function() {
      var or__3824__auto____7157 = onedit.core.buffer[goog.typeOf(x__2387__auto____7156)];
      if(or__3824__auto____7157) {
        return or__3824__auto____7157
      }else {
        var or__3824__auto____7158 = onedit.core.buffer["_"];
        if(or__3824__auto____7158) {
          return or__3824__auto____7158
        }else {
          throw cljs.core.missing_protocol.call(null, "IEditor.buffer", this$);
        }
      }
    }().call(null, this$)
  }
};
onedit.core.minibuffer = function minibuffer(this$) {
  if(function() {
    var and__3822__auto____7163 = this$;
    if(and__3822__auto____7163) {
      return this$.onedit$core$IEditor$minibuffer$arity$1
    }else {
      return and__3822__auto____7163
    }
  }()) {
    return this$.onedit$core$IEditor$minibuffer$arity$1(this$)
  }else {
    var x__2387__auto____7164 = this$ == null ? null : this$;
    return function() {
      var or__3824__auto____7165 = onedit.core.minibuffer[goog.typeOf(x__2387__auto____7164)];
      if(or__3824__auto____7165) {
        return or__3824__auto____7165
      }else {
        var or__3824__auto____7166 = onedit.core.minibuffer["_"];
        if(or__3824__auto____7166) {
          return or__3824__auto____7166
        }else {
          throw cljs.core.missing_protocol.call(null, "IEditor.minibuffer", this$);
        }
      }
    }().call(null, this$)
  }
};
onedit.core.key_handler = function key_handler(this$) {
  if(function() {
    var and__3822__auto____7171 = this$;
    if(and__3822__auto____7171) {
      return this$.onedit$core$IEditor$key_handler$arity$1
    }else {
      return and__3822__auto____7171
    }
  }()) {
    return this$.onedit$core$IEditor$key_handler$arity$1(this$)
  }else {
    var x__2387__auto____7172 = this$ == null ? null : this$;
    return function() {
      var or__3824__auto____7173 = onedit.core.key_handler[goog.typeOf(x__2387__auto____7172)];
      if(or__3824__auto____7173) {
        return or__3824__auto____7173
      }else {
        var or__3824__auto____7174 = onedit.core.key_handler["_"];
        if(or__3824__auto____7174) {
          return or__3824__auto____7174
        }else {
          throw cljs.core.missing_protocol.call(null, "IEditor.key-handler", this$);
        }
      }
    }().call(null, this$)
  }
};
onedit.core.normal = function normal(this$) {
  if(function() {
    var and__3822__auto____7179 = this$;
    if(and__3822__auto____7179) {
      return this$.onedit$core$IEditor$normal$arity$1
    }else {
      return and__3822__auto____7179
    }
  }()) {
    return this$.onedit$core$IEditor$normal$arity$1(this$)
  }else {
    var x__2387__auto____7180 = this$ == null ? null : this$;
    return function() {
      var or__3824__auto____7181 = onedit.core.normal[goog.typeOf(x__2387__auto____7180)];
      if(or__3824__auto____7181) {
        return or__3824__auto____7181
      }else {
        var or__3824__auto____7182 = onedit.core.normal["_"];
        if(or__3824__auto____7182) {
          return or__3824__auto____7182
        }else {
          throw cljs.core.missing_protocol.call(null, "IEditor.normal", this$);
        }
      }
    }().call(null, this$)
  }
};
onedit.core.cursor = function cursor(this$) {
  if(function() {
    var and__3822__auto____7187 = this$;
    if(and__3822__auto____7187) {
      return this$.onedit$core$IEditor$cursor$arity$1
    }else {
      return and__3822__auto____7187
    }
  }()) {
    return this$.onedit$core$IEditor$cursor$arity$1(this$)
  }else {
    var x__2387__auto____7188 = this$ == null ? null : this$;
    return function() {
      var or__3824__auto____7189 = onedit.core.cursor[goog.typeOf(x__2387__auto____7188)];
      if(or__3824__auto____7189) {
        return or__3824__auto____7189
      }else {
        var or__3824__auto____7190 = onedit.core.cursor["_"];
        if(or__3824__auto____7190) {
          return or__3824__auto____7190
        }else {
          throw cljs.core.missing_protocol.call(null, "IEditor.cursor", this$);
        }
      }
    }().call(null, this$)
  }
};
goog.provide("onedit.vi.insert");
goog.require("cljs.core");
goog.require("onedit.vi.core");
goog.require("onedit.core");
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
goog.require("goog.dom.selection");
goog.require("onedit.vi.insert");
goog.require("onedit.vi.core");
goog.require("onedit.core");
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
  var code__7296 = echarCode;
  var buffer__7297 = onedit.core.buffer.call(null);
  if(cljs.core._EQ_.call(null, onedit.vi.core.mode, "insert")) {
  }else {
    e.preventDefault()
  }
  var pred__7298__7301 = cljs.core._EQ_;
  var expr__7299__7302 = code__7296;
  if(pred__7298__7301.call(null, onedit.vi.insert_code, expr__7299__7302)) {
    onedit.vi.insert.insert.call(null)
  }else {
    if(pred__7298__7301.call(null, onedit.vi.l, expr__7299__7302)) {
      onedit.core.log.call(null, goog.dom.selection.getEnd(buffer__7297));
      goog.dom.selection.setStart(buffer__7297, goog.dom.selection.getStart(buffer__7297) + 1)
    }else {
      if(pred__7298__7301.call(null, onedit.vi.escape_code, expr__7299__7302)) {
        onedit.vi.escape.call(null)
      }else {
        if(pred__7298__7301.call(null, onedit.vi.command_code, expr__7299__7302)) {
        }else {
        }
      }
    }
  }
  return onedit.core.logger.info(code__7296)
};
goog.provide("goog.events.EventWrapper");
goog.events.EventWrapper = function() {
};
goog.events.EventWrapper.prototype.listen = function(src, listener, opt_capt, opt_scope, opt_eventHandler) {
};
goog.events.EventWrapper.prototype.unlisten = function(src, listener, opt_capt, opt_scope, opt_eventHandler) {
};
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
goog.provide("goog.dom.SavedRange");
goog.require("goog.Disposable");
goog.require("goog.debug.Logger");
goog.dom.SavedRange = function() {
  goog.Disposable.call(this)
};
goog.inherits(goog.dom.SavedRange, goog.Disposable);
goog.dom.SavedRange.logger_ = goog.debug.Logger.getLogger("goog.dom.SavedRange");
goog.dom.SavedRange.prototype.restore = function(opt_stayAlive) {
  if(this.isDisposed()) {
    goog.dom.SavedRange.logger_.severe("Disposed SavedRange objects cannot be restored.")
  }
  var range = this.restoreInternal();
  if(!opt_stayAlive) {
    this.dispose()
  }
  return range
};
goog.dom.SavedRange.prototype.restoreInternal = goog.abstractMethod;
goog.provide("goog.dom.SavedCaretRange");
goog.require("goog.array");
goog.require("goog.dom");
goog.require("goog.dom.SavedRange");
goog.require("goog.dom.TagName");
goog.require("goog.string");
goog.dom.SavedCaretRange = function(range) {
  goog.dom.SavedRange.call(this);
  this.startCaretId_ = goog.string.createUniqueString();
  this.endCaretId_ = goog.string.createUniqueString();
  this.dom_ = goog.dom.getDomHelper(range.getDocument());
  range.surroundWithNodes(this.createCaret_(true), this.createCaret_(false))
};
goog.inherits(goog.dom.SavedCaretRange, goog.dom.SavedRange);
goog.dom.SavedCaretRange.prototype.toAbstractRange = function() {
  var range = null;
  var startCaret = this.getCaret(true);
  var endCaret = this.getCaret(false);
  if(startCaret && endCaret) {
    range = goog.dom.Range.createFromNodes(startCaret, 0, endCaret, 0)
  }
  return range
};
goog.dom.SavedCaretRange.prototype.getCaret = function(start) {
  return this.dom_.getElement(start ? this.startCaretId_ : this.endCaretId_)
};
goog.dom.SavedCaretRange.prototype.removeCarets = function(opt_range) {
  goog.dom.removeNode(this.getCaret(true));
  goog.dom.removeNode(this.getCaret(false));
  return opt_range
};
goog.dom.SavedCaretRange.prototype.setRestorationDocument = function(doc) {
  this.dom_.setDocument(doc)
};
goog.dom.SavedCaretRange.prototype.restoreInternal = function() {
  var range = null;
  var startCaret = this.getCaret(true);
  var endCaret = this.getCaret(false);
  if(startCaret && endCaret) {
    var startNode = startCaret.parentNode;
    var startOffset = goog.array.indexOf(startNode.childNodes, startCaret);
    var endNode = endCaret.parentNode;
    var endOffset = goog.array.indexOf(endNode.childNodes, endCaret);
    if(endNode == startNode) {
      endOffset -= 1
    }
    range = goog.dom.Range.createFromNodes(startNode, startOffset, endNode, endOffset);
    range = this.removeCarets(range);
    range.select()
  }else {
    this.removeCarets()
  }
  return range
};
goog.dom.SavedCaretRange.prototype.disposeInternal = function() {
  this.removeCarets();
  this.dom_ = null
};
goog.dom.SavedCaretRange.prototype.createCaret_ = function(start) {
  return this.dom_.createDom(goog.dom.TagName.SPAN, {"id":start ? this.startCaretId_ : this.endCaretId_})
};
goog.dom.SavedCaretRange.CARET_REGEX = /<span\s+id="?goog_\d+"?><\/span>/ig;
goog.dom.SavedCaretRange.htmlEqual = function(str1, str2) {
  return str1 == str2 || str1.replace(goog.dom.SavedCaretRange.CARET_REGEX, "") == str2.replace(goog.dom.SavedCaretRange.CARET_REGEX, "")
};
goog.provide("goog.dom.TagIterator");
goog.provide("goog.dom.TagWalkType");
goog.require("goog.dom.NodeType");
goog.require("goog.iter.Iterator");
goog.require("goog.iter.StopIteration");
goog.dom.TagWalkType = {START_TAG:1, OTHER:0, END_TAG:-1};
goog.dom.TagIterator = function(opt_node, opt_reversed, opt_unconstrained, opt_tagType, opt_depth) {
  this.reversed = !!opt_reversed;
  if(opt_node) {
    this.setPosition(opt_node, opt_tagType)
  }
  this.depth = opt_depth != undefined ? opt_depth : this.tagType || 0;
  if(this.reversed) {
    this.depth *= -1
  }
  this.constrained = !opt_unconstrained
};
goog.inherits(goog.dom.TagIterator, goog.iter.Iterator);
goog.dom.TagIterator.prototype.node = null;
goog.dom.TagIterator.prototype.tagType = goog.dom.TagWalkType.OTHER;
goog.dom.TagIterator.prototype.depth;
goog.dom.TagIterator.prototype.reversed;
goog.dom.TagIterator.prototype.constrained;
goog.dom.TagIterator.prototype.started_ = false;
goog.dom.TagIterator.prototype.setPosition = function(node, opt_tagType, opt_depth) {
  this.node = node;
  if(node) {
    if(goog.isNumber(opt_tagType)) {
      this.tagType = opt_tagType
    }else {
      this.tagType = this.node.nodeType != goog.dom.NodeType.ELEMENT ? goog.dom.TagWalkType.OTHER : this.reversed ? goog.dom.TagWalkType.END_TAG : goog.dom.TagWalkType.START_TAG
    }
  }
  if(goog.isNumber(opt_depth)) {
    this.depth = opt_depth
  }
};
goog.dom.TagIterator.prototype.copyFrom = function(other) {
  this.node = other.node;
  this.tagType = other.tagType;
  this.depth = other.depth;
  this.reversed = other.reversed;
  this.constrained = other.constrained
};
goog.dom.TagIterator.prototype.clone = function() {
  return new goog.dom.TagIterator(this.node, this.reversed, !this.constrained, this.tagType, this.depth)
};
goog.dom.TagIterator.prototype.skipTag = function() {
  var check = this.reversed ? goog.dom.TagWalkType.END_TAG : goog.dom.TagWalkType.START_TAG;
  if(this.tagType == check) {
    this.tagType = check * -1;
    this.depth += this.tagType * (this.reversed ? -1 : 1)
  }
};
goog.dom.TagIterator.prototype.restartTag = function() {
  var check = this.reversed ? goog.dom.TagWalkType.START_TAG : goog.dom.TagWalkType.END_TAG;
  if(this.tagType == check) {
    this.tagType = check * -1;
    this.depth += this.tagType * (this.reversed ? -1 : 1)
  }
};
goog.dom.TagIterator.prototype.next = function() {
  var node;
  if(this.started_) {
    if(!this.node || this.constrained && this.depth == 0) {
      throw goog.iter.StopIteration;
    }
    node = this.node;
    var startType = this.reversed ? goog.dom.TagWalkType.END_TAG : goog.dom.TagWalkType.START_TAG;
    if(this.tagType == startType) {
      var child = this.reversed ? node.lastChild : node.firstChild;
      if(child) {
        this.setPosition(child)
      }else {
        this.setPosition(node, startType * -1)
      }
    }else {
      var sibling = this.reversed ? node.previousSibling : node.nextSibling;
      if(sibling) {
        this.setPosition(sibling)
      }else {
        this.setPosition(node.parentNode, startType * -1)
      }
    }
    this.depth += this.tagType * (this.reversed ? -1 : 1)
  }else {
    this.started_ = true
  }
  node = this.node;
  if(!this.node) {
    throw goog.iter.StopIteration;
  }
  return node
};
goog.dom.TagIterator.prototype.isStarted = function() {
  return this.started_
};
goog.dom.TagIterator.prototype.isStartTag = function() {
  return this.tagType == goog.dom.TagWalkType.START_TAG
};
goog.dom.TagIterator.prototype.isEndTag = function() {
  return this.tagType == goog.dom.TagWalkType.END_TAG
};
goog.dom.TagIterator.prototype.isNonElement = function() {
  return this.tagType == goog.dom.TagWalkType.OTHER
};
goog.dom.TagIterator.prototype.equals = function(other) {
  return other.node == this.node && (!this.node || other.tagType == this.tagType)
};
goog.dom.TagIterator.prototype.splice = function(var_args) {
  var node = this.node;
  this.restartTag();
  this.reversed = !this.reversed;
  goog.dom.TagIterator.prototype.next.call(this);
  this.reversed = !this.reversed;
  var arr = goog.isArrayLike(arguments[0]) ? arguments[0] : arguments;
  for(var i = arr.length - 1;i >= 0;i--) {
    goog.dom.insertSiblingAfter(arr[i], node)
  }
  goog.dom.removeNode(node)
};
goog.provide("goog.dom.AbstractRange");
goog.provide("goog.dom.RangeIterator");
goog.provide("goog.dom.RangeType");
goog.require("goog.dom");
goog.require("goog.dom.NodeType");
goog.require("goog.dom.SavedCaretRange");
goog.require("goog.dom.TagIterator");
goog.require("goog.userAgent");
goog.dom.RangeType = {TEXT:"text", CONTROL:"control", MULTI:"mutli"};
goog.dom.AbstractRange = function() {
};
goog.dom.AbstractRange.getBrowserSelectionForWindow = function(win) {
  if(win.getSelection) {
    return win.getSelection()
  }else {
    var doc = win.document;
    var sel = doc.selection;
    if(sel) {
      try {
        var range = sel.createRange();
        if(range.parentElement) {
          if(range.parentElement().document != doc) {
            return null
          }
        }else {
          if(!range.length || range.item(0).document != doc) {
            return null
          }
        }
      }catch(e) {
        return null
      }
      return sel
    }
    return null
  }
};
goog.dom.AbstractRange.isNativeControlRange = function(range) {
  return!!range && !!range.addElement
};
goog.dom.AbstractRange.prototype.clone = goog.abstractMethod;
goog.dom.AbstractRange.prototype.getType = goog.abstractMethod;
goog.dom.AbstractRange.prototype.getBrowserRangeObject = goog.abstractMethod;
goog.dom.AbstractRange.prototype.setBrowserRangeObject = function(nativeRange) {
  return false
};
goog.dom.AbstractRange.prototype.getTextRangeCount = goog.abstractMethod;
goog.dom.AbstractRange.prototype.getTextRange = goog.abstractMethod;
goog.dom.AbstractRange.prototype.getTextRanges = function() {
  var output = [];
  for(var i = 0, len = this.getTextRangeCount();i < len;i++) {
    output.push(this.getTextRange(i))
  }
  return output
};
goog.dom.AbstractRange.prototype.getContainer = goog.abstractMethod;
goog.dom.AbstractRange.prototype.getContainerElement = function() {
  var node = this.getContainer();
  return node.nodeType == goog.dom.NodeType.ELEMENT ? node : node.parentNode
};
goog.dom.AbstractRange.prototype.getStartNode = goog.abstractMethod;
goog.dom.AbstractRange.prototype.getStartOffset = goog.abstractMethod;
goog.dom.AbstractRange.prototype.getEndNode = goog.abstractMethod;
goog.dom.AbstractRange.prototype.getEndOffset = goog.abstractMethod;
goog.dom.AbstractRange.prototype.getAnchorNode = function() {
  return this.isReversed() ? this.getEndNode() : this.getStartNode()
};
goog.dom.AbstractRange.prototype.getAnchorOffset = function() {
  return this.isReversed() ? this.getEndOffset() : this.getStartOffset()
};
goog.dom.AbstractRange.prototype.getFocusNode = function() {
  return this.isReversed() ? this.getStartNode() : this.getEndNode()
};
goog.dom.AbstractRange.prototype.getFocusOffset = function() {
  return this.isReversed() ? this.getStartOffset() : this.getEndOffset()
};
goog.dom.AbstractRange.prototype.isReversed = function() {
  return false
};
goog.dom.AbstractRange.prototype.getDocument = function() {
  return goog.dom.getOwnerDocument(goog.userAgent.IE ? this.getContainer() : this.getStartNode())
};
goog.dom.AbstractRange.prototype.getWindow = function() {
  return goog.dom.getWindow(this.getDocument())
};
goog.dom.AbstractRange.prototype.containsRange = goog.abstractMethod;
goog.dom.AbstractRange.prototype.containsNode = function(node, opt_allowPartial) {
  return this.containsRange(goog.dom.Range.createFromNodeContents(node), opt_allowPartial)
};
goog.dom.AbstractRange.prototype.isRangeInDocument = goog.abstractMethod;
goog.dom.AbstractRange.prototype.isCollapsed = goog.abstractMethod;
goog.dom.AbstractRange.prototype.getText = goog.abstractMethod;
goog.dom.AbstractRange.prototype.getHtmlFragment = goog.abstractMethod;
goog.dom.AbstractRange.prototype.getValidHtml = goog.abstractMethod;
goog.dom.AbstractRange.prototype.getPastableHtml = goog.abstractMethod;
goog.dom.AbstractRange.prototype.__iterator__ = goog.abstractMethod;
goog.dom.AbstractRange.prototype.select = goog.abstractMethod;
goog.dom.AbstractRange.prototype.removeContents = goog.abstractMethod;
goog.dom.AbstractRange.prototype.insertNode = goog.abstractMethod;
goog.dom.AbstractRange.prototype.replaceContentsWithNode = function(node) {
  if(!this.isCollapsed()) {
    this.removeContents()
  }
  return this.insertNode(node, true)
};
goog.dom.AbstractRange.prototype.surroundWithNodes = goog.abstractMethod;
goog.dom.AbstractRange.prototype.saveUsingDom = goog.abstractMethod;
goog.dom.AbstractRange.prototype.saveUsingCarets = function() {
  return this.getStartNode() && this.getEndNode() ? new goog.dom.SavedCaretRange(this) : null
};
goog.dom.AbstractRange.prototype.collapse = goog.abstractMethod;
goog.dom.RangeIterator = function(node, opt_reverse) {
  goog.dom.TagIterator.call(this, node, opt_reverse, true)
};
goog.inherits(goog.dom.RangeIterator, goog.dom.TagIterator);
goog.dom.RangeIterator.prototype.getStartTextOffset = goog.abstractMethod;
goog.dom.RangeIterator.prototype.getEndTextOffset = goog.abstractMethod;
goog.dom.RangeIterator.prototype.getStartNode = goog.abstractMethod;
goog.dom.RangeIterator.prototype.getEndNode = goog.abstractMethod;
goog.dom.RangeIterator.prototype.isLast = goog.abstractMethod;
goog.provide("goog.dom.AbstractMultiRange");
goog.require("goog.array");
goog.require("goog.dom");
goog.require("goog.dom.AbstractRange");
goog.dom.AbstractMultiRange = function() {
};
goog.inherits(goog.dom.AbstractMultiRange, goog.dom.AbstractRange);
goog.dom.AbstractMultiRange.prototype.containsRange = function(otherRange, opt_allowPartial) {
  var ranges = this.getTextRanges();
  var otherRanges = otherRange.getTextRanges();
  var fn = opt_allowPartial ? goog.array.some : goog.array.every;
  return fn(otherRanges, function(otherRange) {
    return goog.array.some(ranges, function(range) {
      return range.containsRange(otherRange, opt_allowPartial)
    })
  })
};
goog.dom.AbstractMultiRange.prototype.insertNode = function(node, before) {
  if(before) {
    goog.dom.insertSiblingBefore(node, this.getStartNode())
  }else {
    goog.dom.insertSiblingAfter(node, this.getEndNode())
  }
  return node
};
goog.dom.AbstractMultiRange.prototype.surroundWithNodes = function(startNode, endNode) {
  this.insertNode(startNode, true);
  this.insertNode(endNode, false)
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
goog.require("goog.ui.FormPost");
goog.require("goog.events");
goog.require("goog.dom");
goog.require("goog.string");
goog.require("onedit.core");
onedit.file.file_form = function() {
  var submit__7236 = goog.dom.createDom("input", {"type":"submit"});
  var file__7239 = function() {
    var G__7237__7238 = goog.dom.createDom("input", {"type":"file", "name":"file"});
    goog.events.listen(G__7237__7238, goog.events.EventType.CHANGE, function() {
      return submit__7236.click()
    });
    return G__7237__7238
  }();
  goog.dom.createDom("form", {"method":"POST", "action":"/open", "enctype":"multipart/form-data"}, file__7239, submit__7236);
  return file__7239
}();
onedit.file.open = function open(editor) {
  return onedit.file.file_form.click()
};
onedit.file.form_post = new goog.ui.FormPost;
onedit.file.save = function save(editor) {
  var text__7241 = goog.dom.getRawTextContent(editorbuffer);
  if(cljs.core.empty_QMARK_.call(null, text__7241)) {
    return null
  }else {
    return onedit.file.form_post.post({"content":text__7241}, [cljs.core.str("/save/"), cljs.core.str(document.title)].join(""))
  }
};
goog.provide("goog.dom.NodeIterator");
goog.require("goog.dom.TagIterator");
goog.dom.NodeIterator = function(opt_node, opt_reversed, opt_unconstrained, opt_depth) {
  goog.dom.TagIterator.call(this, opt_node, opt_reversed, opt_unconstrained, null, opt_depth)
};
goog.inherits(goog.dom.NodeIterator, goog.dom.TagIterator);
goog.dom.NodeIterator.prototype.next = function() {
  do {
    goog.dom.NodeIterator.superClass_.next.call(this)
  }while(this.isEndTag());
  return this.node
};
goog.provide("goog.dom.RangeEndpoint");
goog.dom.RangeEndpoint = {START:1, END:0};
goog.provide("goog.dom.TextRangeIterator");
goog.require("goog.array");
goog.require("goog.dom.NodeType");
goog.require("goog.dom.RangeIterator");
goog.require("goog.dom.TagName");
goog.require("goog.iter.StopIteration");
goog.dom.TextRangeIterator = function(startNode, startOffset, endNode, endOffset, opt_reverse) {
  var goNext;
  if(startNode) {
    this.startNode_ = startNode;
    this.startOffset_ = startOffset;
    this.endNode_ = endNode;
    this.endOffset_ = endOffset;
    if(startNode.nodeType == goog.dom.NodeType.ELEMENT && startNode.tagName != goog.dom.TagName.BR) {
      var startChildren = startNode.childNodes;
      var candidate = startChildren[startOffset];
      if(candidate) {
        this.startNode_ = candidate;
        this.startOffset_ = 0
      }else {
        if(startChildren.length) {
          this.startNode_ = goog.array.peek(startChildren)
        }
        goNext = true
      }
    }
    if(endNode.nodeType == goog.dom.NodeType.ELEMENT) {
      this.endNode_ = endNode.childNodes[endOffset];
      if(this.endNode_) {
        this.endOffset_ = 0
      }else {
        this.endNode_ = endNode
      }
    }
  }
  goog.dom.RangeIterator.call(this, opt_reverse ? this.endNode_ : this.startNode_, opt_reverse);
  if(goNext) {
    try {
      this.next()
    }catch(e) {
      if(e != goog.iter.StopIteration) {
        throw e;
      }
    }
  }
};
goog.inherits(goog.dom.TextRangeIterator, goog.dom.RangeIterator);
goog.dom.TextRangeIterator.prototype.startNode_ = null;
goog.dom.TextRangeIterator.prototype.endNode_ = null;
goog.dom.TextRangeIterator.prototype.startOffset_ = 0;
goog.dom.TextRangeIterator.prototype.endOffset_ = 0;
goog.dom.TextRangeIterator.prototype.getStartTextOffset = function() {
  return this.node.nodeType != goog.dom.NodeType.TEXT ? -1 : this.node == this.startNode_ ? this.startOffset_ : 0
};
goog.dom.TextRangeIterator.prototype.getEndTextOffset = function() {
  return this.node.nodeType != goog.dom.NodeType.TEXT ? -1 : this.node == this.endNode_ ? this.endOffset_ : this.node.nodeValue.length
};
goog.dom.TextRangeIterator.prototype.getStartNode = function() {
  return this.startNode_
};
goog.dom.TextRangeIterator.prototype.setStartNode = function(node) {
  if(!this.isStarted()) {
    this.setPosition(node)
  }
  this.startNode_ = node;
  this.startOffset_ = 0
};
goog.dom.TextRangeIterator.prototype.getEndNode = function() {
  return this.endNode_
};
goog.dom.TextRangeIterator.prototype.setEndNode = function(node) {
  this.endNode_ = node;
  this.endOffset_ = 0
};
goog.dom.TextRangeIterator.prototype.isLast = function() {
  return this.isStarted() && this.node == this.endNode_ && (!this.endOffset_ || !this.isStartTag())
};
goog.dom.TextRangeIterator.prototype.next = function() {
  if(this.isLast()) {
    throw goog.iter.StopIteration;
  }
  return goog.dom.TextRangeIterator.superClass_.next.call(this)
};
goog.dom.TextRangeIterator.prototype.skipTag = function() {
  goog.dom.TextRangeIterator.superClass_.skipTag.apply(this);
  if(goog.dom.contains(this.node, this.endNode_)) {
    throw goog.iter.StopIteration;
  }
};
goog.dom.TextRangeIterator.prototype.copyFrom = function(other) {
  this.startNode_ = other.startNode_;
  this.endNode_ = other.endNode_;
  this.startOffset_ = other.startOffset_;
  this.endOffset_ = other.endOffset_;
  this.isReversed_ = other.isReversed_;
  goog.dom.TextRangeIterator.superClass_.copyFrom.call(this, other)
};
goog.dom.TextRangeIterator.prototype.clone = function() {
  var copy = new goog.dom.TextRangeIterator(this.startNode_, this.startOffset_, this.endNode_, this.endOffset_, this.isReversed_);
  copy.copyFrom(this);
  return copy
};
goog.provide("goog.dom.browserrange.AbstractRange");
goog.require("goog.dom");
goog.require("goog.dom.NodeType");
goog.require("goog.dom.RangeEndpoint");
goog.require("goog.dom.TagName");
goog.require("goog.dom.TextRangeIterator");
goog.require("goog.iter");
goog.require("goog.string");
goog.require("goog.string.StringBuffer");
goog.require("goog.userAgent");
goog.dom.browserrange.AbstractRange = function() {
};
goog.dom.browserrange.AbstractRange.prototype.clone = goog.abstractMethod;
goog.dom.browserrange.AbstractRange.prototype.getBrowserRange = goog.abstractMethod;
goog.dom.browserrange.AbstractRange.prototype.getContainer = goog.abstractMethod;
goog.dom.browserrange.AbstractRange.prototype.getStartNode = goog.abstractMethod;
goog.dom.browserrange.AbstractRange.prototype.getStartOffset = goog.abstractMethod;
goog.dom.browserrange.AbstractRange.prototype.getEndNode = goog.abstractMethod;
goog.dom.browserrange.AbstractRange.prototype.getEndOffset = goog.abstractMethod;
goog.dom.browserrange.AbstractRange.prototype.compareBrowserRangeEndpoints = goog.abstractMethod;
goog.dom.browserrange.AbstractRange.prototype.containsRange = function(abstractRange, opt_allowPartial) {
  var checkPartial = opt_allowPartial && !abstractRange.isCollapsed();
  var range = abstractRange.getBrowserRange();
  var start = goog.dom.RangeEndpoint.START, end = goog.dom.RangeEndpoint.END;
  try {
    if(checkPartial) {
      return this.compareBrowserRangeEndpoints(range, end, start) >= 0 && this.compareBrowserRangeEndpoints(range, start, end) <= 0
    }else {
      return this.compareBrowserRangeEndpoints(range, end, end) >= 0 && this.compareBrowserRangeEndpoints(range, start, start) <= 0
    }
  }catch(e) {
    if(!goog.userAgent.IE) {
      throw e;
    }
    return false
  }
};
goog.dom.browserrange.AbstractRange.prototype.containsNode = function(node, opt_allowPartial) {
  return this.containsRange(goog.dom.browserrange.createRangeFromNodeContents(node), opt_allowPartial)
};
goog.dom.browserrange.AbstractRange.prototype.isCollapsed = goog.abstractMethod;
goog.dom.browserrange.AbstractRange.prototype.getText = goog.abstractMethod;
goog.dom.browserrange.AbstractRange.prototype.getHtmlFragment = function() {
  var output = new goog.string.StringBuffer;
  goog.iter.forEach(this, function(node, ignore, it) {
    if(node.nodeType == goog.dom.NodeType.TEXT) {
      output.append(goog.string.htmlEscape(node.nodeValue.substring(it.getStartTextOffset(), it.getEndTextOffset())))
    }else {
      if(node.nodeType == goog.dom.NodeType.ELEMENT) {
        if(it.isEndTag()) {
          if(goog.dom.canHaveChildren(node)) {
            output.append("</" + node.tagName + ">")
          }
        }else {
          var shallow = node.cloneNode(false);
          var html = goog.dom.getOuterHtml(shallow);
          if(goog.userAgent.IE && node.tagName == goog.dom.TagName.LI) {
            output.append(html)
          }else {
            var index = html.lastIndexOf("<");
            output.append(index ? html.substr(0, index) : html)
          }
        }
      }
    }
  }, this);
  return output.toString()
};
goog.dom.browserrange.AbstractRange.prototype.getValidHtml = goog.abstractMethod;
goog.dom.browserrange.AbstractRange.prototype.__iterator__ = function(opt_keys) {
  return new goog.dom.TextRangeIterator(this.getStartNode(), this.getStartOffset(), this.getEndNode(), this.getEndOffset())
};
goog.dom.browserrange.AbstractRange.prototype.select = goog.abstractMethod;
goog.dom.browserrange.AbstractRange.prototype.removeContents = goog.abstractMethod;
goog.dom.browserrange.AbstractRange.prototype.surroundContents = goog.abstractMethod;
goog.dom.browserrange.AbstractRange.prototype.insertNode = goog.abstractMethod;
goog.dom.browserrange.AbstractRange.prototype.surroundWithNodes = goog.abstractMethod;
goog.dom.browserrange.AbstractRange.prototype.collapse = goog.abstractMethod;
goog.provide("goog.dom.browserrange.IeRange");
goog.require("goog.array");
goog.require("goog.debug.Logger");
goog.require("goog.dom");
goog.require("goog.dom.NodeIterator");
goog.require("goog.dom.NodeType");
goog.require("goog.dom.RangeEndpoint");
goog.require("goog.dom.TagName");
goog.require("goog.dom.browserrange.AbstractRange");
goog.require("goog.iter");
goog.require("goog.iter.StopIteration");
goog.require("goog.string");
goog.dom.browserrange.IeRange = function(range, doc) {
  this.range_ = range;
  this.doc_ = doc
};
goog.inherits(goog.dom.browserrange.IeRange, goog.dom.browserrange.AbstractRange);
goog.dom.browserrange.IeRange.logger_ = goog.debug.Logger.getLogger("goog.dom.browserrange.IeRange");
goog.dom.browserrange.IeRange.getBrowserRangeForNode_ = function(node) {
  var nodeRange = goog.dom.getOwnerDocument(node).body.createTextRange();
  if(node.nodeType == goog.dom.NodeType.ELEMENT) {
    nodeRange.moveToElementText(node);
    if(goog.dom.browserrange.canContainRangeEndpoint(node) && !node.childNodes.length) {
      nodeRange.collapse(false)
    }
  }else {
    var offset = 0;
    var sibling = node;
    while(sibling = sibling.previousSibling) {
      var nodeType = sibling.nodeType;
      if(nodeType == goog.dom.NodeType.TEXT) {
        offset += sibling.length
      }else {
        if(nodeType == goog.dom.NodeType.ELEMENT) {
          nodeRange.moveToElementText(sibling);
          break
        }
      }
    }
    if(!sibling) {
      nodeRange.moveToElementText(node.parentNode)
    }
    nodeRange.collapse(!sibling);
    if(offset) {
      nodeRange.move("character", offset)
    }
    nodeRange.moveEnd("character", node.length)
  }
  return nodeRange
};
goog.dom.browserrange.IeRange.getBrowserRangeForNodes_ = function(startNode, startOffset, endNode, endOffset) {
  var child, collapse = false;
  if(startNode.nodeType == goog.dom.NodeType.ELEMENT) {
    if(startOffset > startNode.childNodes.length) {
      goog.dom.browserrange.IeRange.logger_.severe("Cannot have startOffset > startNode child count")
    }
    child = startNode.childNodes[startOffset];
    collapse = !child;
    startNode = child || startNode.lastChild || startNode;
    startOffset = 0
  }
  var leftRange = goog.dom.browserrange.IeRange.getBrowserRangeForNode_(startNode);
  if(startOffset) {
    leftRange.move("character", startOffset)
  }
  if(startNode == endNode && startOffset == endOffset) {
    leftRange.collapse(true);
    return leftRange
  }
  if(collapse) {
    leftRange.collapse(false)
  }
  collapse = false;
  if(endNode.nodeType == goog.dom.NodeType.ELEMENT) {
    if(endOffset > endNode.childNodes.length) {
      goog.dom.browserrange.IeRange.logger_.severe("Cannot have endOffset > endNode child count")
    }
    child = endNode.childNodes[endOffset];
    endNode = child || endNode.lastChild || endNode;
    endOffset = 0;
    collapse = !child
  }
  var rightRange = goog.dom.browserrange.IeRange.getBrowserRangeForNode_(endNode);
  rightRange.collapse(!collapse);
  if(endOffset) {
    rightRange.moveEnd("character", endOffset)
  }
  leftRange.setEndPoint("EndToEnd", rightRange);
  return leftRange
};
goog.dom.browserrange.IeRange.createFromNodeContents = function(node) {
  var range = new goog.dom.browserrange.IeRange(goog.dom.browserrange.IeRange.getBrowserRangeForNode_(node), goog.dom.getOwnerDocument(node));
  if(!goog.dom.browserrange.canContainRangeEndpoint(node)) {
    range.startNode_ = range.endNode_ = range.parentNode_ = node.parentNode;
    range.startOffset_ = goog.array.indexOf(range.parentNode_.childNodes, node);
    range.endOffset_ = range.startOffset_ + 1
  }else {
    var tempNode, leaf = node;
    while((tempNode = leaf.firstChild) && goog.dom.browserrange.canContainRangeEndpoint(tempNode)) {
      leaf = tempNode
    }
    range.startNode_ = leaf;
    range.startOffset_ = 0;
    leaf = node;
    while((tempNode = leaf.lastChild) && goog.dom.browserrange.canContainRangeEndpoint(tempNode)) {
      leaf = tempNode
    }
    range.endNode_ = leaf;
    range.endOffset_ = leaf.nodeType == goog.dom.NodeType.ELEMENT ? leaf.childNodes.length : leaf.length;
    range.parentNode_ = node
  }
  return range
};
goog.dom.browserrange.IeRange.createFromNodes = function(startNode, startOffset, endNode, endOffset) {
  var range = new goog.dom.browserrange.IeRange(goog.dom.browserrange.IeRange.getBrowserRangeForNodes_(startNode, startOffset, endNode, endOffset), goog.dom.getOwnerDocument(startNode));
  range.startNode_ = startNode;
  range.startOffset_ = startOffset;
  range.endNode_ = endNode;
  range.endOffset_ = endOffset;
  return range
};
goog.dom.browserrange.IeRange.prototype.parentNode_ = null;
goog.dom.browserrange.IeRange.prototype.startNode_ = null;
goog.dom.browserrange.IeRange.prototype.endNode_ = null;
goog.dom.browserrange.IeRange.prototype.startOffset_ = -1;
goog.dom.browserrange.IeRange.prototype.endOffset_ = -1;
goog.dom.browserrange.IeRange.prototype.clone = function() {
  var range = new goog.dom.browserrange.IeRange(this.range_.duplicate(), this.doc_);
  range.parentNode_ = this.parentNode_;
  range.startNode_ = this.startNode_;
  range.endNode_ = this.endNode_;
  return range
};
goog.dom.browserrange.IeRange.prototype.getBrowserRange = function() {
  return this.range_
};
goog.dom.browserrange.IeRange.prototype.clearCachedValues_ = function() {
  this.parentNode_ = this.startNode_ = this.endNode_ = null;
  this.startOffset_ = this.endOffset_ = -1
};
goog.dom.browserrange.IeRange.prototype.getContainer = function() {
  if(!this.parentNode_) {
    var selectText = this.range_.text;
    var range = this.range_.duplicate();
    var rightTrimmedSelectText = selectText.replace(/ +$/, "");
    var numSpacesAtEnd = selectText.length - rightTrimmedSelectText.length;
    if(numSpacesAtEnd) {
      range.moveEnd("character", -numSpacesAtEnd)
    }
    var parent = range.parentElement();
    var htmlText = range.htmlText;
    var htmlTextLen = goog.string.stripNewlines(htmlText).length;
    if(this.isCollapsed() && htmlTextLen > 0) {
      return this.parentNode_ = parent
    }
    while(htmlTextLen > goog.string.stripNewlines(parent.outerHTML).length) {
      parent = parent.parentNode
    }
    while(parent.childNodes.length == 1 && parent.innerText == goog.dom.browserrange.IeRange.getNodeText_(parent.firstChild)) {
      if(!goog.dom.browserrange.canContainRangeEndpoint(parent.firstChild)) {
        break
      }
      parent = parent.firstChild
    }
    if(selectText.length == 0) {
      parent = this.findDeepestContainer_(parent)
    }
    this.parentNode_ = parent
  }
  return this.parentNode_
};
goog.dom.browserrange.IeRange.prototype.findDeepestContainer_ = function(node) {
  var childNodes = node.childNodes;
  for(var i = 0, len = childNodes.length;i < len;i++) {
    var child = childNodes[i];
    if(goog.dom.browserrange.canContainRangeEndpoint(child)) {
      var childRange = goog.dom.browserrange.IeRange.getBrowserRangeForNode_(child);
      var start = goog.dom.RangeEndpoint.START;
      var end = goog.dom.RangeEndpoint.END;
      var isChildRangeErratic = childRange.htmlText != child.outerHTML;
      var isNativeInRangeErratic = this.isCollapsed() && isChildRangeErratic;
      var inChildRange = isNativeInRangeErratic ? this.compareBrowserRangeEndpoints(childRange, start, start) >= 0 && this.compareBrowserRangeEndpoints(childRange, start, end) <= 0 : this.range_.inRange(childRange);
      if(inChildRange) {
        return this.findDeepestContainer_(child)
      }
    }
  }
  return node
};
goog.dom.browserrange.IeRange.prototype.getStartNode = function() {
  if(!this.startNode_) {
    this.startNode_ = this.getEndpointNode_(goog.dom.RangeEndpoint.START);
    if(this.isCollapsed()) {
      this.endNode_ = this.startNode_
    }
  }
  return this.startNode_
};
goog.dom.browserrange.IeRange.prototype.getStartOffset = function() {
  if(this.startOffset_ < 0) {
    this.startOffset_ = this.getOffset_(goog.dom.RangeEndpoint.START);
    if(this.isCollapsed()) {
      this.endOffset_ = this.startOffset_
    }
  }
  return this.startOffset_
};
goog.dom.browserrange.IeRange.prototype.getEndNode = function() {
  if(this.isCollapsed()) {
    return this.getStartNode()
  }
  if(!this.endNode_) {
    this.endNode_ = this.getEndpointNode_(goog.dom.RangeEndpoint.END)
  }
  return this.endNode_
};
goog.dom.browserrange.IeRange.prototype.getEndOffset = function() {
  if(this.isCollapsed()) {
    return this.getStartOffset()
  }
  if(this.endOffset_ < 0) {
    this.endOffset_ = this.getOffset_(goog.dom.RangeEndpoint.END);
    if(this.isCollapsed()) {
      this.startOffset_ = this.endOffset_
    }
  }
  return this.endOffset_
};
goog.dom.browserrange.IeRange.prototype.compareBrowserRangeEndpoints = function(range, thisEndpoint, otherEndpoint) {
  return this.range_.compareEndPoints((thisEndpoint == goog.dom.RangeEndpoint.START ? "Start" : "End") + "To" + (otherEndpoint == goog.dom.RangeEndpoint.START ? "Start" : "End"), range)
};
goog.dom.browserrange.IeRange.prototype.getEndpointNode_ = function(endpoint, opt_node) {
  var node = opt_node || this.getContainer();
  if(!node || !node.firstChild) {
    return node
  }
  var start = goog.dom.RangeEndpoint.START, end = goog.dom.RangeEndpoint.END;
  var isStartEndpoint = endpoint == start;
  for(var j = 0, length = node.childNodes.length;j < length;j++) {
    var i = isStartEndpoint ? j : length - j - 1;
    var child = node.childNodes[i];
    var childRange;
    try {
      childRange = goog.dom.browserrange.createRangeFromNodeContents(child)
    }catch(e) {
      continue
    }
    var ieRange = childRange.getBrowserRange();
    if(this.isCollapsed()) {
      if(!goog.dom.browserrange.canContainRangeEndpoint(child)) {
        if(this.compareBrowserRangeEndpoints(ieRange, start, start) == 0) {
          this.startOffset_ = this.endOffset_ = i;
          return node
        }
      }else {
        if(childRange.containsRange(this)) {
          return this.getEndpointNode_(endpoint, child)
        }
      }
    }else {
      if(this.containsRange(childRange)) {
        if(!goog.dom.browserrange.canContainRangeEndpoint(child)) {
          if(isStartEndpoint) {
            this.startOffset_ = i
          }else {
            this.endOffset_ = i + 1
          }
          return node
        }
        return this.getEndpointNode_(endpoint, child)
      }else {
        if(this.compareBrowserRangeEndpoints(ieRange, start, end) < 0 && this.compareBrowserRangeEndpoints(ieRange, end, start) > 0) {
          return this.getEndpointNode_(endpoint, child)
        }
      }
    }
  }
  return node
};
goog.dom.browserrange.IeRange.prototype.compareNodeEndpoints_ = function(node, thisEndpoint, otherEndpoint) {
  return this.range_.compareEndPoints((thisEndpoint == goog.dom.RangeEndpoint.START ? "Start" : "End") + "To" + (otherEndpoint == goog.dom.RangeEndpoint.START ? "Start" : "End"), goog.dom.browserrange.createRangeFromNodeContents(node).getBrowserRange())
};
goog.dom.browserrange.IeRange.prototype.getOffset_ = function(endpoint, opt_container) {
  var isStartEndpoint = endpoint == goog.dom.RangeEndpoint.START;
  var container = opt_container || (isStartEndpoint ? this.getStartNode() : this.getEndNode());
  if(container.nodeType == goog.dom.NodeType.ELEMENT) {
    var children = container.childNodes;
    var len = children.length;
    var edge = isStartEndpoint ? 0 : len - 1;
    var sign = isStartEndpoint ? 1 : -1;
    for(var i = edge;i >= 0 && i < len;i += sign) {
      var child = children[i];
      if(goog.dom.browserrange.canContainRangeEndpoint(child)) {
        continue
      }
      var endPointCompare = this.compareNodeEndpoints_(child, endpoint, endpoint);
      if(endPointCompare == 0) {
        return isStartEndpoint ? i : i + 1
      }
    }
    return i == -1 ? 0 : i
  }else {
    var range = this.range_.duplicate();
    var nodeRange = goog.dom.browserrange.IeRange.getBrowserRangeForNode_(container);
    range.setEndPoint(isStartEndpoint ? "EndToEnd" : "StartToStart", nodeRange);
    var rangeLength = range.text.length;
    return isStartEndpoint ? container.length - rangeLength : rangeLength
  }
};
goog.dom.browserrange.IeRange.getNodeText_ = function(node) {
  return node.nodeType == goog.dom.NodeType.TEXT ? node.nodeValue : node.innerText
};
goog.dom.browserrange.IeRange.prototype.isRangeInDocument = function() {
  var range = this.doc_.body.createTextRange();
  range.moveToElementText(this.doc_.body);
  return this.containsRange(new goog.dom.browserrange.IeRange(range, this.doc_), true)
};
goog.dom.browserrange.IeRange.prototype.isCollapsed = function() {
  return this.range_.compareEndPoints("StartToEnd", this.range_) == 0
};
goog.dom.browserrange.IeRange.prototype.getText = function() {
  return this.range_.text
};
goog.dom.browserrange.IeRange.prototype.getValidHtml = function() {
  return this.range_.htmlText
};
goog.dom.browserrange.IeRange.prototype.select = function(opt_reverse) {
  this.range_.select()
};
goog.dom.browserrange.IeRange.prototype.removeContents = function() {
  if(!this.isCollapsed() && this.range_.htmlText) {
    var startNode = this.getStartNode();
    var endNode = this.getEndNode();
    var oldText = this.range_.text;
    var clone = this.range_.duplicate();
    clone.moveStart("character", 1);
    clone.moveStart("character", -1);
    if(clone.text == oldText) {
      this.range_ = clone
    }
    this.range_.text = "";
    this.clearCachedValues_();
    var newStartNode = this.getStartNode();
    var newStartOffset = this.getStartOffset();
    try {
      var sibling = startNode.nextSibling;
      if(startNode == endNode && startNode.parentNode && startNode.nodeType == goog.dom.NodeType.TEXT && sibling && sibling.nodeType == goog.dom.NodeType.TEXT) {
        startNode.nodeValue += sibling.nodeValue;
        goog.dom.removeNode(sibling);
        this.range_ = goog.dom.browserrange.IeRange.getBrowserRangeForNode_(newStartNode);
        this.range_.move("character", newStartOffset);
        this.clearCachedValues_()
      }
    }catch(e) {
    }
  }
};
goog.dom.browserrange.IeRange.getDomHelper_ = function(range) {
  return goog.dom.getDomHelper(range.parentElement())
};
goog.dom.browserrange.IeRange.pasteElement_ = function(range, element, opt_domHelper) {
  opt_domHelper = opt_domHelper || goog.dom.browserrange.IeRange.getDomHelper_(range);
  var id;
  var originalId = id = element.id;
  if(!id) {
    id = element.id = goog.string.createUniqueString()
  }
  range.pasteHTML(element.outerHTML);
  element = opt_domHelper.getElement(id);
  if(element) {
    if(!originalId) {
      element.removeAttribute("id")
    }
  }
  return element
};
goog.dom.browserrange.IeRange.prototype.surroundContents = function(element) {
  goog.dom.removeNode(element);
  element.innerHTML = this.range_.htmlText;
  element = goog.dom.browserrange.IeRange.pasteElement_(this.range_, element);
  if(element) {
    this.range_.moveToElementText(element)
  }
  this.clearCachedValues_();
  return element
};
goog.dom.browserrange.IeRange.insertNode_ = function(clone, node, before, opt_domHelper) {
  opt_domHelper = opt_domHelper || goog.dom.browserrange.IeRange.getDomHelper_(clone);
  var isNonElement;
  if(node.nodeType != goog.dom.NodeType.ELEMENT) {
    isNonElement = true;
    node = opt_domHelper.createDom(goog.dom.TagName.DIV, null, node)
  }
  clone.collapse(before);
  node = goog.dom.browserrange.IeRange.pasteElement_(clone, node, opt_domHelper);
  if(isNonElement) {
    var newNonElement = node.firstChild;
    opt_domHelper.flattenElement(node);
    node = newNonElement
  }
  return node
};
goog.dom.browserrange.IeRange.prototype.insertNode = function(node, before) {
  var output = goog.dom.browserrange.IeRange.insertNode_(this.range_.duplicate(), node, before);
  this.clearCachedValues_();
  return output
};
goog.dom.browserrange.IeRange.prototype.surroundWithNodes = function(startNode, endNode) {
  var clone1 = this.range_.duplicate();
  var clone2 = this.range_.duplicate();
  goog.dom.browserrange.IeRange.insertNode_(clone1, startNode, true);
  goog.dom.browserrange.IeRange.insertNode_(clone2, endNode, false);
  this.clearCachedValues_()
};
goog.dom.browserrange.IeRange.prototype.collapse = function(toStart) {
  this.range_.collapse(toStart);
  if(toStart) {
    this.endNode_ = this.startNode_;
    this.endOffset_ = this.startOffset_
  }else {
    this.startNode_ = this.endNode_;
    this.startOffset_ = this.endOffset_
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
goog.provide("goog.dom.browserrange.W3cRange");
goog.require("goog.dom");
goog.require("goog.dom.NodeType");
goog.require("goog.dom.RangeEndpoint");
goog.require("goog.dom.browserrange.AbstractRange");
goog.require("goog.string");
goog.dom.browserrange.W3cRange = function(range) {
  this.range_ = range
};
goog.inherits(goog.dom.browserrange.W3cRange, goog.dom.browserrange.AbstractRange);
goog.dom.browserrange.W3cRange.getBrowserRangeForNode = function(node) {
  var nodeRange = goog.dom.getOwnerDocument(node).createRange();
  if(node.nodeType == goog.dom.NodeType.TEXT) {
    nodeRange.setStart(node, 0);
    nodeRange.setEnd(node, node.length)
  }else {
    if(!goog.dom.browserrange.canContainRangeEndpoint(node)) {
      var rangeParent = node.parentNode;
      var rangeStartOffset = goog.array.indexOf(rangeParent.childNodes, node);
      nodeRange.setStart(rangeParent, rangeStartOffset);
      nodeRange.setEnd(rangeParent, rangeStartOffset + 1)
    }else {
      var tempNode, leaf = node;
      while((tempNode = leaf.firstChild) && goog.dom.browserrange.canContainRangeEndpoint(tempNode)) {
        leaf = tempNode
      }
      nodeRange.setStart(leaf, 0);
      leaf = node;
      while((tempNode = leaf.lastChild) && goog.dom.browserrange.canContainRangeEndpoint(tempNode)) {
        leaf = tempNode
      }
      nodeRange.setEnd(leaf, leaf.nodeType == goog.dom.NodeType.ELEMENT ? leaf.childNodes.length : leaf.length)
    }
  }
  return nodeRange
};
goog.dom.browserrange.W3cRange.getBrowserRangeForNodes = function(startNode, startOffset, endNode, endOffset) {
  var nodeRange = goog.dom.getOwnerDocument(startNode).createRange();
  nodeRange.setStart(startNode, startOffset);
  nodeRange.setEnd(endNode, endOffset);
  return nodeRange
};
goog.dom.browserrange.W3cRange.createFromNodeContents = function(node) {
  return new goog.dom.browserrange.W3cRange(goog.dom.browserrange.W3cRange.getBrowserRangeForNode(node))
};
goog.dom.browserrange.W3cRange.createFromNodes = function(startNode, startOffset, endNode, endOffset) {
  return new goog.dom.browserrange.W3cRange(goog.dom.browserrange.W3cRange.getBrowserRangeForNodes(startNode, startOffset, endNode, endOffset))
};
goog.dom.browserrange.W3cRange.prototype.clone = function() {
  return new this.constructor(this.range_.cloneRange())
};
goog.dom.browserrange.W3cRange.prototype.getBrowserRange = function() {
  return this.range_
};
goog.dom.browserrange.W3cRange.prototype.getContainer = function() {
  return this.range_.commonAncestorContainer
};
goog.dom.browserrange.W3cRange.prototype.getStartNode = function() {
  return this.range_.startContainer
};
goog.dom.browserrange.W3cRange.prototype.getStartOffset = function() {
  return this.range_.startOffset
};
goog.dom.browserrange.W3cRange.prototype.getEndNode = function() {
  return this.range_.endContainer
};
goog.dom.browserrange.W3cRange.prototype.getEndOffset = function() {
  return this.range_.endOffset
};
goog.dom.browserrange.W3cRange.prototype.compareBrowserRangeEndpoints = function(range, thisEndpoint, otherEndpoint) {
  return this.range_.compareBoundaryPoints(otherEndpoint == goog.dom.RangeEndpoint.START ? thisEndpoint == goog.dom.RangeEndpoint.START ? goog.global["Range"].START_TO_START : goog.global["Range"].START_TO_END : thisEndpoint == goog.dom.RangeEndpoint.START ? goog.global["Range"].END_TO_START : goog.global["Range"].END_TO_END, range)
};
goog.dom.browserrange.W3cRange.prototype.isCollapsed = function() {
  return this.range_.collapsed
};
goog.dom.browserrange.W3cRange.prototype.getText = function() {
  return this.range_.toString()
};
goog.dom.browserrange.W3cRange.prototype.getValidHtml = function() {
  var div = goog.dom.getDomHelper(this.range_.startContainer).createDom("div");
  div.appendChild(this.range_.cloneContents());
  var result = div.innerHTML;
  if(goog.string.startsWith(result, "<") || !this.isCollapsed() && !goog.string.contains(result, "<")) {
    return result
  }
  var container = this.getContainer();
  container = container.nodeType == goog.dom.NodeType.ELEMENT ? container : container.parentNode;
  var html = goog.dom.getOuterHtml(container.cloneNode(false));
  return html.replace(">", ">" + result)
};
goog.dom.browserrange.W3cRange.prototype.select = function(reverse) {
  var win = goog.dom.getWindow(goog.dom.getOwnerDocument(this.getStartNode()));
  this.selectInternal(win.getSelection(), reverse)
};
goog.dom.browserrange.W3cRange.prototype.selectInternal = function(selection, reverse) {
  selection.removeAllRanges();
  selection.addRange(this.range_)
};
goog.dom.browserrange.W3cRange.prototype.removeContents = function() {
  var range = this.range_;
  range.extractContents();
  if(range.startContainer.hasChildNodes()) {
    var rangeStartContainer = range.startContainer.childNodes[range.startOffset];
    if(rangeStartContainer) {
      var rangePrevious = rangeStartContainer.previousSibling;
      if(goog.dom.getRawTextContent(rangeStartContainer) == "") {
        goog.dom.removeNode(rangeStartContainer)
      }
      if(rangePrevious && goog.dom.getRawTextContent(rangePrevious) == "") {
        goog.dom.removeNode(rangePrevious)
      }
    }
  }
};
goog.dom.browserrange.W3cRange.prototype.surroundContents = function(element) {
  this.range_.surroundContents(element);
  return element
};
goog.dom.browserrange.W3cRange.prototype.insertNode = function(node, before) {
  var range = this.range_.cloneRange();
  range.collapse(before);
  range.insertNode(node);
  range.detach();
  return node
};
goog.dom.browserrange.W3cRange.prototype.surroundWithNodes = function(startNode, endNode) {
  var win = goog.dom.getWindow(goog.dom.getOwnerDocument(this.getStartNode()));
  var selectionRange = goog.dom.Range.createFromWindow(win);
  if(selectionRange) {
    var sNode = selectionRange.getStartNode();
    var eNode = selectionRange.getEndNode();
    var sOffset = selectionRange.getStartOffset();
    var eOffset = selectionRange.getEndOffset()
  }
  var clone1 = this.range_.cloneRange();
  var clone2 = this.range_.cloneRange();
  clone1.collapse(false);
  clone2.collapse(true);
  clone1.insertNode(endNode);
  clone2.insertNode(startNode);
  clone1.detach();
  clone2.detach();
  if(selectionRange) {
    var isInsertedNode = function(n) {
      return n == startNode || n == endNode
    };
    if(sNode.nodeType == goog.dom.NodeType.TEXT) {
      while(sOffset > sNode.length) {
        sOffset -= sNode.length;
        do {
          sNode = sNode.nextSibling
        }while(isInsertedNode(sNode))
      }
    }
    if(eNode.nodeType == goog.dom.NodeType.TEXT) {
      while(eOffset > eNode.length) {
        eOffset -= eNode.length;
        do {
          eNode = eNode.nextSibling
        }while(isInsertedNode(eNode))
      }
    }
    goog.dom.Range.createFromNodes(sNode, sOffset, eNode, eOffset).select()
  }
};
goog.dom.browserrange.W3cRange.prototype.collapse = function(toStart) {
  this.range_.collapse(toStart)
};
goog.provide("goog.dom.browserrange.GeckoRange");
goog.require("goog.dom.browserrange.W3cRange");
goog.dom.browserrange.GeckoRange = function(range) {
  goog.dom.browserrange.W3cRange.call(this, range)
};
goog.inherits(goog.dom.browserrange.GeckoRange, goog.dom.browserrange.W3cRange);
goog.dom.browserrange.GeckoRange.createFromNodeContents = function(node) {
  return new goog.dom.browserrange.GeckoRange(goog.dom.browserrange.W3cRange.getBrowserRangeForNode(node))
};
goog.dom.browserrange.GeckoRange.createFromNodes = function(startNode, startOffset, endNode, endOffset) {
  return new goog.dom.browserrange.GeckoRange(goog.dom.browserrange.W3cRange.getBrowserRangeForNodes(startNode, startOffset, endNode, endOffset))
};
goog.dom.browserrange.GeckoRange.prototype.selectInternal = function(selection, reversed) {
  var anchorNode = reversed ? this.getEndNode() : this.getStartNode();
  var anchorOffset = reversed ? this.getEndOffset() : this.getStartOffset();
  var focusNode = reversed ? this.getStartNode() : this.getEndNode();
  var focusOffset = reversed ? this.getStartOffset() : this.getEndOffset();
  selection.collapse(anchorNode, anchorOffset);
  if(anchorNode != focusNode || anchorOffset != focusOffset) {
    selection.extend(focusNode, focusOffset)
  }
};
goog.provide("goog.dom.browserrange.OperaRange");
goog.require("goog.dom.browserrange.W3cRange");
goog.dom.browserrange.OperaRange = function(range) {
  goog.dom.browserrange.W3cRange.call(this, range)
};
goog.inherits(goog.dom.browserrange.OperaRange, goog.dom.browserrange.W3cRange);
goog.dom.browserrange.OperaRange.createFromNodeContents = function(node) {
  return new goog.dom.browserrange.OperaRange(goog.dom.browserrange.W3cRange.getBrowserRangeForNode(node))
};
goog.dom.browserrange.OperaRange.createFromNodes = function(startNode, startOffset, endNode, endOffset) {
  return new goog.dom.browserrange.OperaRange(goog.dom.browserrange.W3cRange.getBrowserRangeForNodes(startNode, startOffset, endNode, endOffset))
};
goog.dom.browserrange.OperaRange.prototype.selectInternal = function(selection, reversed) {
  selection.collapse(this.getStartNode(), this.getStartOffset());
  if(this.getEndNode() != this.getStartNode() || this.getEndOffset() != this.getStartOffset()) {
    selection.extend(this.getEndNode(), this.getEndOffset())
  }
  if(selection.rangeCount == 0) {
    selection.addRange(this.range_)
  }
};
goog.provide("goog.dom.browserrange.WebKitRange");
goog.require("goog.dom.RangeEndpoint");
goog.require("goog.dom.browserrange.W3cRange");
goog.require("goog.userAgent");
goog.dom.browserrange.WebKitRange = function(range) {
  goog.dom.browserrange.W3cRange.call(this, range)
};
goog.inherits(goog.dom.browserrange.WebKitRange, goog.dom.browserrange.W3cRange);
goog.dom.browserrange.WebKitRange.createFromNodeContents = function(node) {
  return new goog.dom.browserrange.WebKitRange(goog.dom.browserrange.W3cRange.getBrowserRangeForNode(node))
};
goog.dom.browserrange.WebKitRange.createFromNodes = function(startNode, startOffset, endNode, endOffset) {
  return new goog.dom.browserrange.WebKitRange(goog.dom.browserrange.W3cRange.getBrowserRangeForNodes(startNode, startOffset, endNode, endOffset))
};
goog.dom.browserrange.WebKitRange.prototype.compareBrowserRangeEndpoints = function(range, thisEndpoint, otherEndpoint) {
  if(goog.userAgent.isVersion("528")) {
    return goog.dom.browserrange.WebKitRange.superClass_.compareBrowserRangeEndpoints.call(this, range, thisEndpoint, otherEndpoint)
  }
  return this.range_.compareBoundaryPoints(otherEndpoint == goog.dom.RangeEndpoint.START ? thisEndpoint == goog.dom.RangeEndpoint.START ? goog.global["Range"].START_TO_START : goog.global["Range"].END_TO_START : thisEndpoint == goog.dom.RangeEndpoint.START ? goog.global["Range"].START_TO_END : goog.global["Range"].END_TO_END, range)
};
goog.dom.browserrange.WebKitRange.prototype.selectInternal = function(selection, reversed) {
  selection.removeAllRanges();
  if(reversed) {
    selection.setBaseAndExtent(this.getEndNode(), this.getEndOffset(), this.getStartNode(), this.getStartOffset())
  }else {
    selection.setBaseAndExtent(this.getStartNode(), this.getStartOffset(), this.getEndNode(), this.getEndOffset())
  }
};
goog.provide("goog.dom.browserrange");
goog.provide("goog.dom.browserrange.Error");
goog.require("goog.dom");
goog.require("goog.dom.browserrange.GeckoRange");
goog.require("goog.dom.browserrange.IeRange");
goog.require("goog.dom.browserrange.OperaRange");
goog.require("goog.dom.browserrange.W3cRange");
goog.require("goog.dom.browserrange.WebKitRange");
goog.require("goog.userAgent");
goog.dom.browserrange.Error = {NOT_IMPLEMENTED:"Not Implemented"};
goog.dom.browserrange.createRange = function(range) {
  if(goog.userAgent.IE && !goog.userAgent.isDocumentMode(9)) {
    return new goog.dom.browserrange.IeRange(range, goog.dom.getOwnerDocument(range.parentElement()))
  }else {
    if(goog.userAgent.WEBKIT) {
      return new goog.dom.browserrange.WebKitRange(range)
    }else {
      if(goog.userAgent.GECKO) {
        return new goog.dom.browserrange.GeckoRange(range)
      }else {
        if(goog.userAgent.OPERA) {
          return new goog.dom.browserrange.OperaRange(range)
        }else {
          return new goog.dom.browserrange.W3cRange(range)
        }
      }
    }
  }
};
goog.dom.browserrange.createRangeFromNodeContents = function(node) {
  if(goog.userAgent.IE && !goog.userAgent.isDocumentMode(9)) {
    return goog.dom.browserrange.IeRange.createFromNodeContents(node)
  }else {
    if(goog.userAgent.WEBKIT) {
      return goog.dom.browserrange.WebKitRange.createFromNodeContents(node)
    }else {
      if(goog.userAgent.GECKO) {
        return goog.dom.browserrange.GeckoRange.createFromNodeContents(node)
      }else {
        if(goog.userAgent.OPERA) {
          return goog.dom.browserrange.OperaRange.createFromNodeContents(node)
        }else {
          return goog.dom.browserrange.W3cRange.createFromNodeContents(node)
        }
      }
    }
  }
};
goog.dom.browserrange.createRangeFromNodes = function(startNode, startOffset, endNode, endOffset) {
  if(goog.userAgent.IE && !goog.userAgent.isDocumentMode(9)) {
    return goog.dom.browserrange.IeRange.createFromNodes(startNode, startOffset, endNode, endOffset)
  }else {
    if(goog.userAgent.WEBKIT) {
      return goog.dom.browserrange.WebKitRange.createFromNodes(startNode, startOffset, endNode, endOffset)
    }else {
      if(goog.userAgent.GECKO) {
        return goog.dom.browserrange.GeckoRange.createFromNodes(startNode, startOffset, endNode, endOffset)
      }else {
        if(goog.userAgent.OPERA) {
          return goog.dom.browserrange.OperaRange.createFromNodes(startNode, startOffset, endNode, endOffset)
        }else {
          return goog.dom.browserrange.W3cRange.createFromNodes(startNode, startOffset, endNode, endOffset)
        }
      }
    }
  }
};
goog.dom.browserrange.canContainRangeEndpoint = function(node) {
  return goog.dom.canHaveChildren(node) || node.nodeType == goog.dom.NodeType.TEXT
};
goog.provide("goog.dom.TextRange");
goog.require("goog.array");
goog.require("goog.dom");
goog.require("goog.dom.AbstractRange");
goog.require("goog.dom.RangeType");
goog.require("goog.dom.SavedRange");
goog.require("goog.dom.TagName");
goog.require("goog.dom.TextRangeIterator");
goog.require("goog.dom.browserrange");
goog.require("goog.string");
goog.require("goog.userAgent");
goog.dom.TextRange = function() {
};
goog.inherits(goog.dom.TextRange, goog.dom.AbstractRange);
goog.dom.TextRange.createFromBrowserRange = function(range, opt_isReversed) {
  return goog.dom.TextRange.createFromBrowserRangeWrapper_(goog.dom.browserrange.createRange(range), opt_isReversed)
};
goog.dom.TextRange.createFromBrowserRangeWrapper_ = function(browserRange, opt_isReversed) {
  var range = new goog.dom.TextRange;
  range.browserRangeWrapper_ = browserRange;
  range.isReversed_ = !!opt_isReversed;
  return range
};
goog.dom.TextRange.createFromNodeContents = function(node, opt_isReversed) {
  return goog.dom.TextRange.createFromBrowserRangeWrapper_(goog.dom.browserrange.createRangeFromNodeContents(node), opt_isReversed)
};
goog.dom.TextRange.createFromNodes = function(anchorNode, anchorOffset, focusNode, focusOffset) {
  var range = new goog.dom.TextRange;
  range.isReversed_ = goog.dom.Range.isReversed(anchorNode, anchorOffset, focusNode, focusOffset);
  if(anchorNode.tagName == "BR") {
    var parent = anchorNode.parentNode;
    anchorOffset = goog.array.indexOf(parent.childNodes, anchorNode);
    anchorNode = parent
  }
  if(focusNode.tagName == "BR") {
    var parent = focusNode.parentNode;
    focusOffset = goog.array.indexOf(parent.childNodes, focusNode);
    focusNode = parent
  }
  if(range.isReversed_) {
    range.startNode_ = focusNode;
    range.startOffset_ = focusOffset;
    range.endNode_ = anchorNode;
    range.endOffset_ = anchorOffset
  }else {
    range.startNode_ = anchorNode;
    range.startOffset_ = anchorOffset;
    range.endNode_ = focusNode;
    range.endOffset_ = focusOffset
  }
  return range
};
goog.dom.TextRange.prototype.browserRangeWrapper_ = null;
goog.dom.TextRange.prototype.startNode_ = null;
goog.dom.TextRange.prototype.startOffset_ = null;
goog.dom.TextRange.prototype.endNode_ = null;
goog.dom.TextRange.prototype.endOffset_ = null;
goog.dom.TextRange.prototype.isReversed_ = false;
goog.dom.TextRange.prototype.clone = function() {
  var range = new goog.dom.TextRange;
  range.browserRangeWrapper_ = this.browserRangeWrapper_;
  range.startNode_ = this.startNode_;
  range.startOffset_ = this.startOffset_;
  range.endNode_ = this.endNode_;
  range.endOffset_ = this.endOffset_;
  range.isReversed_ = this.isReversed_;
  return range
};
goog.dom.TextRange.prototype.getType = function() {
  return goog.dom.RangeType.TEXT
};
goog.dom.TextRange.prototype.getBrowserRangeObject = function() {
  return this.getBrowserRangeWrapper_().getBrowserRange()
};
goog.dom.TextRange.prototype.setBrowserRangeObject = function(nativeRange) {
  if(goog.dom.AbstractRange.isNativeControlRange(nativeRange)) {
    return false
  }
  this.browserRangeWrapper_ = goog.dom.browserrange.createRange(nativeRange);
  this.clearCachedValues_();
  return true
};
goog.dom.TextRange.prototype.clearCachedValues_ = function() {
  this.startNode_ = this.startOffset_ = this.endNode_ = this.endOffset_ = null
};
goog.dom.TextRange.prototype.getTextRangeCount = function() {
  return 1
};
goog.dom.TextRange.prototype.getTextRange = function(i) {
  return this
};
goog.dom.TextRange.prototype.getBrowserRangeWrapper_ = function() {
  return this.browserRangeWrapper_ || (this.browserRangeWrapper_ = goog.dom.browserrange.createRangeFromNodes(this.getStartNode(), this.getStartOffset(), this.getEndNode(), this.getEndOffset()))
};
goog.dom.TextRange.prototype.getContainer = function() {
  return this.getBrowserRangeWrapper_().getContainer()
};
goog.dom.TextRange.prototype.getStartNode = function() {
  return this.startNode_ || (this.startNode_ = this.getBrowserRangeWrapper_().getStartNode())
};
goog.dom.TextRange.prototype.getStartOffset = function() {
  return this.startOffset_ != null ? this.startOffset_ : this.startOffset_ = this.getBrowserRangeWrapper_().getStartOffset()
};
goog.dom.TextRange.prototype.getEndNode = function() {
  return this.endNode_ || (this.endNode_ = this.getBrowserRangeWrapper_().getEndNode())
};
goog.dom.TextRange.prototype.getEndOffset = function() {
  return this.endOffset_ != null ? this.endOffset_ : this.endOffset_ = this.getBrowserRangeWrapper_().getEndOffset()
};
goog.dom.TextRange.prototype.moveToNodes = function(startNode, startOffset, endNode, endOffset, isReversed) {
  this.startNode_ = startNode;
  this.startOffset_ = startOffset;
  this.endNode_ = endNode;
  this.endOffset_ = endOffset;
  this.isReversed_ = isReversed;
  this.browserRangeWrapper_ = null
};
goog.dom.TextRange.prototype.isReversed = function() {
  return this.isReversed_
};
goog.dom.TextRange.prototype.containsRange = function(otherRange, opt_allowPartial) {
  var otherRangeType = otherRange.getType();
  if(otherRangeType == goog.dom.RangeType.TEXT) {
    return this.getBrowserRangeWrapper_().containsRange(otherRange.getBrowserRangeWrapper_(), opt_allowPartial)
  }else {
    if(otherRangeType == goog.dom.RangeType.CONTROL) {
      var elements = otherRange.getElements();
      var fn = opt_allowPartial ? goog.array.some : goog.array.every;
      return fn(elements, function(el) {
        return this.containsNode(el, opt_allowPartial)
      }, this)
    }
  }
  return false
};
goog.dom.TextRange.isAttachedNode = function(node) {
  if(goog.userAgent.IE && !goog.userAgent.isDocumentMode(9)) {
    var returnValue = false;
    try {
      returnValue = node.parentNode
    }catch(e) {
    }
    return!!returnValue
  }else {
    return goog.dom.contains(node.ownerDocument.body, node)
  }
};
goog.dom.TextRange.prototype.isRangeInDocument = function() {
  return(!this.startNode_ || goog.dom.TextRange.isAttachedNode(this.startNode_)) && (!this.endNode_ || goog.dom.TextRange.isAttachedNode(this.endNode_)) && (!(goog.userAgent.IE && !goog.userAgent.isDocumentMode(9)) || this.getBrowserRangeWrapper_().isRangeInDocument())
};
goog.dom.TextRange.prototype.isCollapsed = function() {
  return this.getBrowserRangeWrapper_().isCollapsed()
};
goog.dom.TextRange.prototype.getText = function() {
  return this.getBrowserRangeWrapper_().getText()
};
goog.dom.TextRange.prototype.getHtmlFragment = function() {
  return this.getBrowserRangeWrapper_().getHtmlFragment()
};
goog.dom.TextRange.prototype.getValidHtml = function() {
  return this.getBrowserRangeWrapper_().getValidHtml()
};
goog.dom.TextRange.prototype.getPastableHtml = function() {
  var html = this.getValidHtml();
  if(html.match(/^\s*<td\b/i)) {
    html = "<table><tbody><tr>" + html + "</tr></tbody></table>"
  }else {
    if(html.match(/^\s*<tr\b/i)) {
      html = "<table><tbody>" + html + "</tbody></table>"
    }else {
      if(html.match(/^\s*<tbody\b/i)) {
        html = "<table>" + html + "</table>"
      }else {
        if(html.match(/^\s*<li\b/i)) {
          var container = this.getContainer();
          var tagType = goog.dom.TagName.UL;
          while(container) {
            if(container.tagName == goog.dom.TagName.OL) {
              tagType = goog.dom.TagName.OL;
              break
            }else {
              if(container.tagName == goog.dom.TagName.UL) {
                break
              }
            }
            container = container.parentNode
          }
          html = goog.string.buildString("<", tagType, ">", html, "</", tagType, ">")
        }
      }
    }
  }
  return html
};
goog.dom.TextRange.prototype.__iterator__ = function(opt_keys) {
  return new goog.dom.TextRangeIterator(this.getStartNode(), this.getStartOffset(), this.getEndNode(), this.getEndOffset())
};
goog.dom.TextRange.prototype.select = function() {
  this.getBrowserRangeWrapper_().select(this.isReversed_)
};
goog.dom.TextRange.prototype.removeContents = function() {
  this.getBrowserRangeWrapper_().removeContents();
  this.clearCachedValues_()
};
goog.dom.TextRange.prototype.surroundContents = function(element) {
  var output = this.getBrowserRangeWrapper_().surroundContents(element);
  this.clearCachedValues_();
  return output
};
goog.dom.TextRange.prototype.insertNode = function(node, before) {
  var output = this.getBrowserRangeWrapper_().insertNode(node, before);
  this.clearCachedValues_();
  return output
};
goog.dom.TextRange.prototype.surroundWithNodes = function(startNode, endNode) {
  this.getBrowserRangeWrapper_().surroundWithNodes(startNode, endNode);
  this.clearCachedValues_()
};
goog.dom.TextRange.prototype.saveUsingDom = function() {
  return new goog.dom.DomSavedTextRange_(this)
};
goog.dom.TextRange.prototype.collapse = function(toAnchor) {
  var toStart = this.isReversed() ? !toAnchor : toAnchor;
  if(this.browserRangeWrapper_) {
    this.browserRangeWrapper_.collapse(toStart)
  }
  if(toStart) {
    this.endNode_ = this.startNode_;
    this.endOffset_ = this.startOffset_
  }else {
    this.startNode_ = this.endNode_;
    this.startOffset_ = this.endOffset_
  }
  this.isReversed_ = false
};
goog.dom.DomSavedTextRange_ = function(range) {
  this.anchorNode_ = range.getAnchorNode();
  this.anchorOffset_ = range.getAnchorOffset();
  this.focusNode_ = range.getFocusNode();
  this.focusOffset_ = range.getFocusOffset()
};
goog.inherits(goog.dom.DomSavedTextRange_, goog.dom.SavedRange);
goog.dom.DomSavedTextRange_.prototype.restoreInternal = function() {
  return goog.dom.Range.createFromNodes(this.anchorNode_, this.anchorOffset_, this.focusNode_, this.focusOffset_)
};
goog.dom.DomSavedTextRange_.prototype.disposeInternal = function() {
  goog.dom.DomSavedTextRange_.superClass_.disposeInternal.call(this);
  this.anchorNode_ = null;
  this.focusNode_ = null
};
goog.provide("goog.dom.ControlRange");
goog.provide("goog.dom.ControlRangeIterator");
goog.require("goog.array");
goog.require("goog.dom");
goog.require("goog.dom.AbstractMultiRange");
goog.require("goog.dom.AbstractRange");
goog.require("goog.dom.RangeIterator");
goog.require("goog.dom.RangeType");
goog.require("goog.dom.SavedRange");
goog.require("goog.dom.TagWalkType");
goog.require("goog.dom.TextRange");
goog.require("goog.iter.StopIteration");
goog.require("goog.userAgent");
goog.dom.ControlRange = function() {
};
goog.inherits(goog.dom.ControlRange, goog.dom.AbstractMultiRange);
goog.dom.ControlRange.createFromBrowserRange = function(controlRange) {
  var range = new goog.dom.ControlRange;
  range.range_ = controlRange;
  return range
};
goog.dom.ControlRange.createFromElements = function(var_args) {
  var range = goog.dom.getOwnerDocument(arguments[0]).body.createControlRange();
  for(var i = 0, len = arguments.length;i < len;i++) {
    range.addElement(arguments[i])
  }
  return goog.dom.ControlRange.createFromBrowserRange(range)
};
goog.dom.ControlRange.prototype.range_ = null;
goog.dom.ControlRange.prototype.elements_ = null;
goog.dom.ControlRange.prototype.sortedElements_ = null;
goog.dom.ControlRange.prototype.clearCachedValues_ = function() {
  this.elements_ = null;
  this.sortedElements_ = null
};
goog.dom.ControlRange.prototype.clone = function() {
  return goog.dom.ControlRange.createFromElements.apply(this, this.getElements())
};
goog.dom.ControlRange.prototype.getType = function() {
  return goog.dom.RangeType.CONTROL
};
goog.dom.ControlRange.prototype.getBrowserRangeObject = function() {
  return this.range_ || document.body.createControlRange()
};
goog.dom.ControlRange.prototype.setBrowserRangeObject = function(nativeRange) {
  if(!goog.dom.AbstractRange.isNativeControlRange(nativeRange)) {
    return false
  }
  this.range_ = nativeRange;
  return true
};
goog.dom.ControlRange.prototype.getTextRangeCount = function() {
  return this.range_ ? this.range_.length : 0
};
goog.dom.ControlRange.prototype.getTextRange = function(i) {
  return goog.dom.TextRange.createFromNodeContents(this.range_.item(i))
};
goog.dom.ControlRange.prototype.getContainer = function() {
  return goog.dom.findCommonAncestor.apply(null, this.getElements())
};
goog.dom.ControlRange.prototype.getStartNode = function() {
  return this.getSortedElements()[0]
};
goog.dom.ControlRange.prototype.getStartOffset = function() {
  return 0
};
goog.dom.ControlRange.prototype.getEndNode = function() {
  var sorted = this.getSortedElements();
  var startsLast = goog.array.peek(sorted);
  return goog.array.find(sorted, function(el) {
    return goog.dom.contains(el, startsLast)
  })
};
goog.dom.ControlRange.prototype.getEndOffset = function() {
  return this.getEndNode().childNodes.length
};
goog.dom.ControlRange.prototype.getElements = function() {
  if(!this.elements_) {
    this.elements_ = [];
    if(this.range_) {
      for(var i = 0;i < this.range_.length;i++) {
        this.elements_.push(this.range_.item(i))
      }
    }
  }
  return this.elements_
};
goog.dom.ControlRange.prototype.getSortedElements = function() {
  if(!this.sortedElements_) {
    this.sortedElements_ = this.getElements().concat();
    this.sortedElements_.sort(function(a, b) {
      return a.sourceIndex - b.sourceIndex
    })
  }
  return this.sortedElements_
};
goog.dom.ControlRange.prototype.isRangeInDocument = function() {
  var returnValue = false;
  try {
    returnValue = goog.array.every(this.getElements(), function(element) {
      return goog.userAgent.IE ? element.parentNode : goog.dom.contains(element.ownerDocument.body, element)
    })
  }catch(e) {
  }
  return returnValue
};
goog.dom.ControlRange.prototype.isCollapsed = function() {
  return!this.range_ || !this.range_.length
};
goog.dom.ControlRange.prototype.getText = function() {
  return""
};
goog.dom.ControlRange.prototype.getHtmlFragment = function() {
  return goog.array.map(this.getSortedElements(), goog.dom.getOuterHtml).join("")
};
goog.dom.ControlRange.prototype.getValidHtml = function() {
  return this.getHtmlFragment()
};
goog.dom.ControlRange.prototype.getPastableHtml = goog.dom.ControlRange.prototype.getValidHtml;
goog.dom.ControlRange.prototype.__iterator__ = function(opt_keys) {
  return new goog.dom.ControlRangeIterator(this)
};
goog.dom.ControlRange.prototype.select = function() {
  if(this.range_) {
    this.range_.select()
  }
};
goog.dom.ControlRange.prototype.removeContents = function() {
  if(this.range_) {
    var nodes = [];
    for(var i = 0, len = this.range_.length;i < len;i++) {
      nodes.push(this.range_.item(i))
    }
    goog.array.forEach(nodes, goog.dom.removeNode);
    this.collapse(false)
  }
};
goog.dom.ControlRange.prototype.replaceContentsWithNode = function(node) {
  var result = this.insertNode(node, true);
  if(!this.isCollapsed()) {
    this.removeContents()
  }
  return result
};
goog.dom.ControlRange.prototype.saveUsingDom = function() {
  return new goog.dom.DomSavedControlRange_(this)
};
goog.dom.ControlRange.prototype.collapse = function(toAnchor) {
  this.range_ = null;
  this.clearCachedValues_()
};
goog.dom.DomSavedControlRange_ = function(range) {
  this.elements_ = range.getElements()
};
goog.inherits(goog.dom.DomSavedControlRange_, goog.dom.SavedRange);
goog.dom.DomSavedControlRange_.prototype.restoreInternal = function() {
  var doc = this.elements_.length ? goog.dom.getOwnerDocument(this.elements_[0]) : document;
  var controlRange = doc.body.createControlRange();
  for(var i = 0, len = this.elements_.length;i < len;i++) {
    controlRange.addElement(this.elements_[i])
  }
  return goog.dom.ControlRange.createFromBrowserRange(controlRange)
};
goog.dom.DomSavedControlRange_.prototype.disposeInternal = function() {
  goog.dom.DomSavedControlRange_.superClass_.disposeInternal.call(this);
  delete this.elements_
};
goog.dom.ControlRangeIterator = function(range) {
  if(range) {
    this.elements_ = range.getSortedElements();
    this.startNode_ = this.elements_.shift();
    this.endNode_ = goog.array.peek(this.elements_) || this.startNode_
  }
  goog.dom.RangeIterator.call(this, this.startNode_, false)
};
goog.inherits(goog.dom.ControlRangeIterator, goog.dom.RangeIterator);
goog.dom.ControlRangeIterator.prototype.startNode_ = null;
goog.dom.ControlRangeIterator.prototype.endNode_ = null;
goog.dom.ControlRangeIterator.prototype.elements_ = null;
goog.dom.ControlRangeIterator.prototype.getStartTextOffset = function() {
  return 0
};
goog.dom.ControlRangeIterator.prototype.getEndTextOffset = function() {
  return 0
};
goog.dom.ControlRangeIterator.prototype.getStartNode = function() {
  return this.startNode_
};
goog.dom.ControlRangeIterator.prototype.getEndNode = function() {
  return this.endNode_
};
goog.dom.ControlRangeIterator.prototype.isLast = function() {
  return!this.depth && !this.elements_.length
};
goog.dom.ControlRangeIterator.prototype.next = function() {
  if(this.isLast()) {
    throw goog.iter.StopIteration;
  }else {
    if(!this.depth) {
      var el = this.elements_.shift();
      this.setPosition(el, goog.dom.TagWalkType.START_TAG, goog.dom.TagWalkType.START_TAG);
      return el
    }
  }
  return goog.dom.ControlRangeIterator.superClass_.next.call(this)
};
goog.dom.ControlRangeIterator.prototype.copyFrom = function(other) {
  this.elements_ = other.elements_;
  this.startNode_ = other.startNode_;
  this.endNode_ = other.endNode_;
  goog.dom.ControlRangeIterator.superClass_.copyFrom.call(this, other)
};
goog.dom.ControlRangeIterator.prototype.clone = function() {
  var copy = new goog.dom.ControlRangeIterator(null);
  copy.copyFrom(this);
  return copy
};
goog.provide("goog.dom.MultiRange");
goog.provide("goog.dom.MultiRangeIterator");
goog.require("goog.array");
goog.require("goog.debug.Logger");
goog.require("goog.dom.AbstractMultiRange");
goog.require("goog.dom.AbstractRange");
goog.require("goog.dom.RangeIterator");
goog.require("goog.dom.RangeType");
goog.require("goog.dom.SavedRange");
goog.require("goog.dom.TextRange");
goog.require("goog.iter.StopIteration");
goog.dom.MultiRange = function() {
  this.browserRanges_ = [];
  this.ranges_ = [];
  this.sortedRanges_ = null;
  this.container_ = null
};
goog.inherits(goog.dom.MultiRange, goog.dom.AbstractMultiRange);
goog.dom.MultiRange.createFromBrowserSelection = function(selection) {
  var range = new goog.dom.MultiRange;
  for(var i = 0, len = selection.rangeCount;i < len;i++) {
    range.browserRanges_.push(selection.getRangeAt(i))
  }
  return range
};
goog.dom.MultiRange.createFromBrowserRanges = function(browserRanges) {
  var range = new goog.dom.MultiRange;
  range.browserRanges_ = goog.array.clone(browserRanges);
  return range
};
goog.dom.MultiRange.createFromTextRanges = function(textRanges) {
  var range = new goog.dom.MultiRange;
  range.ranges_ = textRanges;
  range.browserRanges_ = goog.array.map(textRanges, function(range) {
    return range.getBrowserRangeObject()
  });
  return range
};
goog.dom.MultiRange.prototype.logger_ = goog.debug.Logger.getLogger("goog.dom.MultiRange");
goog.dom.MultiRange.prototype.clearCachedValues_ = function() {
  this.ranges_ = [];
  this.sortedRanges_ = null;
  this.container_ = null
};
goog.dom.MultiRange.prototype.clone = function() {
  return goog.dom.MultiRange.createFromBrowserRanges(this.browserRanges_)
};
goog.dom.MultiRange.prototype.getType = function() {
  return goog.dom.RangeType.MULTI
};
goog.dom.MultiRange.prototype.getBrowserRangeObject = function() {
  if(this.browserRanges_.length > 1) {
    this.logger_.warning("getBrowserRangeObject called on MultiRange with more than 1 range")
  }
  return this.browserRanges_[0]
};
goog.dom.MultiRange.prototype.setBrowserRangeObject = function(nativeRange) {
  return false
};
goog.dom.MultiRange.prototype.getTextRangeCount = function() {
  return this.browserRanges_.length
};
goog.dom.MultiRange.prototype.getTextRange = function(i) {
  if(!this.ranges_[i]) {
    this.ranges_[i] = goog.dom.TextRange.createFromBrowserRange(this.browserRanges_[i])
  }
  return this.ranges_[i]
};
goog.dom.MultiRange.prototype.getContainer = function() {
  if(!this.container_) {
    var nodes = [];
    for(var i = 0, len = this.getTextRangeCount();i < len;i++) {
      nodes.push(this.getTextRange(i).getContainer())
    }
    this.container_ = goog.dom.findCommonAncestor.apply(null, nodes)
  }
  return this.container_
};
goog.dom.MultiRange.prototype.getSortedRanges = function() {
  if(!this.sortedRanges_) {
    this.sortedRanges_ = this.getTextRanges();
    this.sortedRanges_.sort(function(a, b) {
      var aStartNode = a.getStartNode();
      var aStartOffset = a.getStartOffset();
      var bStartNode = b.getStartNode();
      var bStartOffset = b.getStartOffset();
      if(aStartNode == bStartNode && aStartOffset == bStartOffset) {
        return 0
      }
      return goog.dom.Range.isReversed(aStartNode, aStartOffset, bStartNode, bStartOffset) ? 1 : -1
    })
  }
  return this.sortedRanges_
};
goog.dom.MultiRange.prototype.getStartNode = function() {
  return this.getSortedRanges()[0].getStartNode()
};
goog.dom.MultiRange.prototype.getStartOffset = function() {
  return this.getSortedRanges()[0].getStartOffset()
};
goog.dom.MultiRange.prototype.getEndNode = function() {
  return goog.array.peek(this.getSortedRanges()).getEndNode()
};
goog.dom.MultiRange.prototype.getEndOffset = function() {
  return goog.array.peek(this.getSortedRanges()).getEndOffset()
};
goog.dom.MultiRange.prototype.isRangeInDocument = function() {
  return goog.array.every(this.getTextRanges(), function(range) {
    return range.isRangeInDocument()
  })
};
goog.dom.MultiRange.prototype.isCollapsed = function() {
  return this.browserRanges_.length == 0 || this.browserRanges_.length == 1 && this.getTextRange(0).isCollapsed()
};
goog.dom.MultiRange.prototype.getText = function() {
  return goog.array.map(this.getTextRanges(), function(range) {
    return range.getText()
  }).join("")
};
goog.dom.MultiRange.prototype.getHtmlFragment = function() {
  return this.getValidHtml()
};
goog.dom.MultiRange.prototype.getValidHtml = function() {
  return goog.array.map(this.getTextRanges(), function(range) {
    return range.getValidHtml()
  }).join("")
};
goog.dom.MultiRange.prototype.getPastableHtml = function() {
  return this.getValidHtml()
};
goog.dom.MultiRange.prototype.__iterator__ = function(opt_keys) {
  return new goog.dom.MultiRangeIterator(this)
};
goog.dom.MultiRange.prototype.select = function() {
  var selection = goog.dom.AbstractRange.getBrowserSelectionForWindow(this.getWindow());
  selection.removeAllRanges();
  for(var i = 0, len = this.getTextRangeCount();i < len;i++) {
    selection.addRange(this.getTextRange(i).getBrowserRangeObject())
  }
};
goog.dom.MultiRange.prototype.removeContents = function() {
  goog.array.forEach(this.getTextRanges(), function(range) {
    range.removeContents()
  })
};
goog.dom.MultiRange.prototype.saveUsingDom = function() {
  return new goog.dom.DomSavedMultiRange_(this)
};
goog.dom.MultiRange.prototype.collapse = function(toAnchor) {
  if(!this.isCollapsed()) {
    var range = toAnchor ? this.getTextRange(0) : this.getTextRange(this.getTextRangeCount() - 1);
    this.clearCachedValues_();
    range.collapse(toAnchor);
    this.ranges_ = [range];
    this.sortedRanges_ = [range];
    this.browserRanges_ = [range.getBrowserRangeObject()]
  }
};
goog.dom.DomSavedMultiRange_ = function(range) {
  this.savedRanges_ = goog.array.map(range.getTextRanges(), function(range) {
    return range.saveUsingDom()
  })
};
goog.inherits(goog.dom.DomSavedMultiRange_, goog.dom.SavedRange);
goog.dom.DomSavedMultiRange_.prototype.restoreInternal = function() {
  var ranges = goog.array.map(this.savedRanges_, function(savedRange) {
    return savedRange.restore()
  });
  return goog.dom.MultiRange.createFromTextRanges(ranges)
};
goog.dom.DomSavedMultiRange_.prototype.disposeInternal = function() {
  goog.dom.DomSavedMultiRange_.superClass_.disposeInternal.call(this);
  goog.array.forEach(this.savedRanges_, function(savedRange) {
    savedRange.dispose()
  });
  delete this.savedRanges_
};
goog.dom.MultiRangeIterator = function(range) {
  if(range) {
    this.iterators_ = goog.array.map(range.getSortedRanges(), function(r) {
      return goog.iter.toIterator(r)
    })
  }
  goog.dom.RangeIterator.call(this, range ? this.getStartNode() : null, false)
};
goog.inherits(goog.dom.MultiRangeIterator, goog.dom.RangeIterator);
goog.dom.MultiRangeIterator.prototype.iterators_ = null;
goog.dom.MultiRangeIterator.prototype.currentIdx_ = 0;
goog.dom.MultiRangeIterator.prototype.getStartTextOffset = function() {
  return this.iterators_[this.currentIdx_].getStartTextOffset()
};
goog.dom.MultiRangeIterator.prototype.getEndTextOffset = function() {
  return this.iterators_[this.currentIdx_].getEndTextOffset()
};
goog.dom.MultiRangeIterator.prototype.getStartNode = function() {
  return this.iterators_[0].getStartNode()
};
goog.dom.MultiRangeIterator.prototype.getEndNode = function() {
  return goog.array.peek(this.iterators_).getEndNode()
};
goog.dom.MultiRangeIterator.prototype.isLast = function() {
  return this.iterators_[this.currentIdx_].isLast()
};
goog.dom.MultiRangeIterator.prototype.next = function() {
  try {
    var it = this.iterators_[this.currentIdx_];
    var next = it.next();
    this.setPosition(it.node, it.tagType, it.depth);
    return next
  }catch(ex) {
    if(ex !== goog.iter.StopIteration || this.iterators_.length - 1 == this.currentIdx_) {
      throw ex;
    }else {
      this.currentIdx_++;
      return this.next()
    }
  }
};
goog.dom.MultiRangeIterator.prototype.copyFrom = function(other) {
  this.iterators_ = goog.array.clone(other.iterators_);
  goog.dom.MultiRangeIterator.superClass_.copyFrom.call(this, other)
};
goog.dom.MultiRangeIterator.prototype.clone = function() {
  var copy = new goog.dom.MultiRangeIterator(null);
  copy.copyFrom(this);
  return copy
};
goog.provide("goog.dom.Range");
goog.require("goog.dom");
goog.require("goog.dom.AbstractRange");
goog.require("goog.dom.ControlRange");
goog.require("goog.dom.MultiRange");
goog.require("goog.dom.NodeType");
goog.require("goog.dom.TextRange");
goog.require("goog.userAgent");
goog.dom.Range.createFromWindow = function(opt_win) {
  var sel = goog.dom.AbstractRange.getBrowserSelectionForWindow(opt_win || window);
  return sel && goog.dom.Range.createFromBrowserSelection(sel)
};
goog.dom.Range.createFromBrowserSelection = function(selection) {
  var range;
  var isReversed = false;
  if(selection.createRange) {
    try {
      range = selection.createRange()
    }catch(e) {
      return null
    }
  }else {
    if(selection.rangeCount) {
      if(selection.rangeCount > 1) {
        return goog.dom.MultiRange.createFromBrowserSelection(selection)
      }else {
        range = selection.getRangeAt(0);
        isReversed = goog.dom.Range.isReversed(selection.anchorNode, selection.anchorOffset, selection.focusNode, selection.focusOffset)
      }
    }else {
      return null
    }
  }
  return goog.dom.Range.createFromBrowserRange(range, isReversed)
};
goog.dom.Range.createFromBrowserRange = function(range, opt_isReversed) {
  return goog.dom.AbstractRange.isNativeControlRange(range) ? goog.dom.ControlRange.createFromBrowserRange(range) : goog.dom.TextRange.createFromBrowserRange(range, opt_isReversed)
};
goog.dom.Range.createFromNodeContents = function(node, opt_isReversed) {
  return goog.dom.TextRange.createFromNodeContents(node, opt_isReversed)
};
goog.dom.Range.createCaret = function(node, offset) {
  return goog.dom.TextRange.createFromNodes(node, offset, node, offset)
};
goog.dom.Range.createFromNodes = function(startNode, startOffset, endNode, endOffset) {
  return goog.dom.TextRange.createFromNodes(startNode, startOffset, endNode, endOffset)
};
goog.dom.Range.clearSelection = function(opt_win) {
  var sel = goog.dom.AbstractRange.getBrowserSelectionForWindow(opt_win || window);
  if(!sel) {
    return
  }
  if(sel.empty) {
    try {
      sel.empty()
    }catch(e) {
    }
  }else {
    try {
      sel.removeAllRanges()
    }catch(e) {
    }
  }
};
goog.dom.Range.hasSelection = function(opt_win) {
  var sel = goog.dom.AbstractRange.getBrowserSelectionForWindow(opt_win || window);
  return!!sel && (goog.userAgent.IE ? sel.type != "None" : !!sel.rangeCount)
};
goog.dom.Range.isReversed = function(anchorNode, anchorOffset, focusNode, focusOffset) {
  if(anchorNode == focusNode) {
    return focusOffset < anchorOffset
  }
  var child;
  if(anchorNode.nodeType == goog.dom.NodeType.ELEMENT && anchorOffset) {
    child = anchorNode.childNodes[anchorOffset];
    if(child) {
      anchorNode = child;
      anchorOffset = 0
    }else {
      if(goog.dom.contains(anchorNode, focusNode)) {
        return true
      }
    }
  }
  if(focusNode.nodeType == goog.dom.NodeType.ELEMENT && focusOffset) {
    child = focusNode.childNodes[focusOffset];
    if(child) {
      focusNode = child;
      focusOffset = 0
    }else {
      if(goog.dom.contains(focusNode, anchorNode)) {
        return false
      }
    }
  }
  return(goog.dom.compareNodeOrder(anchorNode, focusNode) || anchorOffset - focusOffset) > 0
};
goog.provide("onedit.buffer");
goog.require("cljs.core");
goog.require("goog.events");
goog.require("goog.dom");
goog.require("onedit.core");
onedit.buffer.buffer = cljs.core.PersistentVector.EMPTY;
onedit.buffer.x = 0;
onedit.buffer.y = 0;
onedit.buffer.key_handler = function key_handler(editor, e) {
  var mode__15126 = onedit.core.action.call(null, editormode, editor, e);
  console.log(mode__15126);
  return editormode = mode__15126
};
onedit.buffer.init = function init(editor) {
  return goog.events.listen(new goog.events.KeyHandler(editorbuffer), goog.events.KeyHandler.EventType.KEY, cljs.core.partial.call(null, onedit.buffer.key_handler, editor))
};
goog.provide("goog.editor.focus");
goog.require("goog.dom.selection");
goog.editor.focus.focusInputField = function(inputElem) {
  inputElem.focus();
  goog.dom.selection.setCursorPosition(inputElem, inputElem.value.length)
};
goog.provide("goog.Timer");
goog.require("goog.events.EventTarget");
goog.Timer = function(opt_interval, opt_timerObject) {
  goog.events.EventTarget.call(this);
  this.interval_ = opt_interval || 1;
  this.timerObject_ = opt_timerObject || goog.Timer.defaultTimerObject;
  this.boundTick_ = goog.bind(this.tick_, this);
  this.last_ = goog.now()
};
goog.inherits(goog.Timer, goog.events.EventTarget);
goog.Timer.MAX_TIMEOUT_ = 2147483647;
goog.Timer.prototype.enabled = false;
goog.Timer.defaultTimerObject = goog.global["window"];
goog.Timer.intervalScale = 0.8;
goog.Timer.prototype.timer_ = null;
goog.Timer.prototype.getInterval = function() {
  return this.interval_
};
goog.Timer.prototype.setInterval = function(interval) {
  this.interval_ = interval;
  if(this.timer_ && this.enabled) {
    this.stop();
    this.start()
  }else {
    if(this.timer_) {
      this.stop()
    }
  }
};
goog.Timer.prototype.tick_ = function() {
  if(this.enabled) {
    var elapsed = goog.now() - this.last_;
    if(elapsed > 0 && elapsed < this.interval_ * goog.Timer.intervalScale) {
      this.timer_ = this.timerObject_.setTimeout(this.boundTick_, this.interval_ - elapsed);
      return
    }
    this.dispatchTick();
    if(this.enabled) {
      this.timer_ = this.timerObject_.setTimeout(this.boundTick_, this.interval_);
      this.last_ = goog.now()
    }
  }
};
goog.Timer.prototype.dispatchTick = function() {
  this.dispatchEvent(goog.Timer.TICK)
};
goog.Timer.prototype.start = function() {
  this.enabled = true;
  if(!this.timer_) {
    this.timer_ = this.timerObject_.setTimeout(this.boundTick_, this.interval_);
    this.last_ = goog.now()
  }
};
goog.Timer.prototype.stop = function() {
  this.enabled = false;
  if(this.timer_) {
    this.timerObject_.clearTimeout(this.timer_);
    this.timer_ = null
  }
};
goog.Timer.prototype.disposeInternal = function() {
  goog.Timer.superClass_.disposeInternal.call(this);
  this.stop();
  delete this.timerObject_
};
goog.Timer.TICK = "tick";
goog.Timer.callOnce = function(listener, opt_delay, opt_handler) {
  if(goog.isFunction(listener)) {
    if(opt_handler) {
      listener = goog.bind(listener, opt_handler)
    }
  }else {
    if(listener && typeof listener.handleEvent == "function") {
      listener = goog.bind(listener.handleEvent, listener)
    }else {
      throw Error("Invalid listener argument");
    }
  }
  if(opt_delay > goog.Timer.MAX_TIMEOUT_) {
    return-1
  }else {
    return goog.Timer.defaultTimerObject.setTimeout(listener, opt_delay || 0)
  }
};
goog.Timer.clear = function(timerId) {
  goog.Timer.defaultTimerObject.clearTimeout(timerId)
};
goog.provide("goog.ui.ControlContent");
goog.ui.ControlContent;
goog.provide("goog.dom.a11y");
goog.provide("goog.dom.a11y.Announcer");
goog.provide("goog.dom.a11y.LivePriority");
goog.provide("goog.dom.a11y.Role");
goog.provide("goog.dom.a11y.State");
goog.require("goog.Disposable");
goog.require("goog.dom");
goog.require("goog.object");
goog.dom.a11y.State = {ACTIVEDESCENDANT:"activedescendant", ATOMIC:"atomic", AUTOCOMPLETE:"autocomplete", BUSY:"busy", CHECKED:"checked", CONTROLS:"controls", DESCRIBEDBY:"describedby", DISABLED:"disabled", DROPEFFECT:"dropeffect", EXPANDED:"expanded", FLOWTO:"flowto", GRABBED:"grabbed", HASPOPUP:"haspopup", HIDDEN:"hidden", INVALID:"invalid", LABEL:"label", LABELLEDBY:"labelledby", LEVEL:"level", LIVE:"live", MULTILINE:"multiline", MULTISELECTABLE:"multiselectable", ORIENTATION:"orientation", OWNS:"owns", 
POSINSET:"posinset", PRESSED:"pressed", READONLY:"readonly", RELEVANT:"relevant", REQUIRED:"required", SELECTED:"selected", SETSIZE:"setsize", SORT:"sort", VALUEMAX:"valuemax", VALUEMIN:"valuemin", VALUENOW:"valuenow", VALUETEXT:"valuetext"};
goog.dom.a11y.Role = {ALERT:"alert", ALERTDIALOG:"alertdialog", APPLICATION:"application", ARTICLE:"article", BANNER:"banner", BUTTON:"button", CHECKBOX:"checkbox", COLUMNHEADER:"columnheader", COMBOBOX:"combobox", COMPLEMENTARY:"complementary", DIALOG:"dialog", DIRECTORY:"directory", DOCUMENT:"document", FORM:"form", GRID:"grid", GRIDCELL:"gridcell", GROUP:"group", HEADING:"heading", IMG:"img", LINK:"link", LIST:"list", LISTBOX:"listbox", LISTITEM:"listitem", LOG:"log", MAIN:"main", MARQUEE:"marquee", 
MATH:"math", MENU:"menu", MENUBAR:"menubar", MENU_ITEM:"menuitem", MENU_ITEM_CHECKBOX:"menuitemcheckbox", MENU_ITEM_RADIO:"menuitemradio", NAVIGATION:"navigation", NOTE:"note", OPTION:"option", PRESENTATION:"presentation", PROGRESSBAR:"progressbar", RADIO:"radio", RADIOGROUP:"radiogroup", REGION:"region", ROW:"row", ROWGROUP:"rowgroup", ROWHEADER:"rowheader", SCROLLBAR:"scrollbar", SEARCH:"search", SEPARATOR:"separator", SLIDER:"slider", SPINBUTTON:"spinbutton", STATUS:"status", TAB:"tab", TAB_LIST:"tablist", 
TAB_PANEL:"tabpanel", TEXTBOX:"textbox", TIMER:"timer", TOOLBAR:"toolbar", TOOLTIP:"tooltip", TREE:"tree", TREEGRID:"treegrid", TREEITEM:"treeitem"};
goog.dom.a11y.LivePriority = {OFF:"off", POLITE:"polite", ASSERTIVE:"assertive"};
goog.dom.a11y.setRole = function(element, roleName) {
  element.setAttribute("role", roleName);
  element.roleName = roleName
};
goog.dom.a11y.getRole = function(element) {
  return element.roleName || ""
};
goog.dom.a11y.setState = function(element, state, value) {
  element.setAttribute("aria-" + state, value)
};
goog.dom.a11y.getState = function(element, stateName) {
  var attrb = element.getAttribute("aria-" + stateName);
  if(attrb === true || attrb === false) {
    return attrb ? "true" : "false"
  }else {
    if(!attrb) {
      return""
    }else {
      return String(attrb)
    }
  }
};
goog.dom.a11y.getActiveDescendant = function(element) {
  var id = goog.dom.a11y.getState(element, goog.dom.a11y.State.ACTIVEDESCENDANT);
  return goog.dom.getOwnerDocument(element).getElementById(id)
};
goog.dom.a11y.setActiveDescendant = function(element, activeElement) {
  goog.dom.a11y.setState(element, goog.dom.a11y.State.ACTIVEDESCENDANT, activeElement ? activeElement.id : "")
};
goog.dom.a11y.Announcer = function(domHelper) {
  goog.base(this);
  this.domHelper_ = domHelper;
  this.liveRegions_ = {}
};
goog.inherits(goog.dom.a11y.Announcer, goog.Disposable);
goog.dom.a11y.Announcer.prototype.disposeInternal = function() {
  goog.object.forEach(this.liveRegions_, this.domHelper_.removeNode, this.domHelper_);
  this.liveRegions_ = null;
  this.domHelper_ = null;
  goog.base(this, "disposeInternal")
};
goog.dom.a11y.Announcer.prototype.say = function(message, opt_priority) {
  goog.dom.setTextContent(this.getLiveRegion_(opt_priority || goog.dom.a11y.LivePriority.POLITE), message)
};
goog.dom.a11y.Announcer.prototype.getLiveRegion_ = function(priority) {
  if(this.liveRegions_[priority]) {
    return this.liveRegions_[priority]
  }
  var liveRegion;
  liveRegion = this.domHelper_.createElement("div");
  liveRegion.style.position = "absolute";
  liveRegion.style.top = "-1000px";
  goog.dom.a11y.setState(liveRegion, "live", priority);
  goog.dom.a11y.setState(liveRegion, "atomic", "true");
  this.domHelper_.getDocument().body.appendChild(liveRegion);
  this.liveRegions_[priority] = liveRegion;
  return liveRegion
};
goog.provide("goog.ui.ControlRenderer");
goog.require("goog.array");
goog.require("goog.dom");
goog.require("goog.dom.a11y");
goog.require("goog.dom.a11y.State");
goog.require("goog.dom.classes");
goog.require("goog.object");
goog.require("goog.style");
goog.require("goog.ui.Component.State");
goog.require("goog.ui.ControlContent");
goog.require("goog.userAgent");
goog.ui.ControlRenderer = function() {
};
goog.addSingletonGetter(goog.ui.ControlRenderer);
goog.ui.ControlRenderer.getCustomRenderer = function(ctor, cssClassName) {
  var renderer = new ctor;
  renderer.getCssClass = function() {
    return cssClassName
  };
  return renderer
};
goog.ui.ControlRenderer.CSS_CLASS = goog.getCssName("goog-control");
goog.ui.ControlRenderer.IE6_CLASS_COMBINATIONS = [];
goog.ui.ControlRenderer.ARIA_STATE_MAP_;
goog.ui.ControlRenderer.prototype.getAriaRole = function() {
  return undefined
};
goog.ui.ControlRenderer.prototype.createDom = function(control) {
  var element = control.getDomHelper().createDom("div", this.getClassNames(control).join(" "), control.getContent());
  this.setAriaStates(control, element);
  return element
};
goog.ui.ControlRenderer.prototype.getContentElement = function(element) {
  return element
};
goog.ui.ControlRenderer.prototype.enableClassName = function(control, className, enable) {
  var element = control.getElement ? control.getElement() : control;
  if(element) {
    if(goog.userAgent.IE && !goog.userAgent.isVersion("7")) {
      var combinedClasses = this.getAppliedCombinedClassNames_(goog.dom.classes.get(element), className);
      combinedClasses.push(className);
      var f = enable ? goog.dom.classes.add : goog.dom.classes.remove;
      goog.partial(f, element).apply(null, combinedClasses)
    }else {
      goog.dom.classes.enable(element, className, enable)
    }
  }
};
goog.ui.ControlRenderer.prototype.enableExtraClassName = function(control, className, enable) {
  this.enableClassName(control, className, enable)
};
goog.ui.ControlRenderer.prototype.canDecorate = function(element) {
  return true
};
goog.ui.ControlRenderer.prototype.decorate = function(control, element) {
  if(element.id) {
    control.setId(element.id)
  }
  var contentElem = this.getContentElement(element);
  if(contentElem && contentElem.firstChild) {
    control.setContentInternal(contentElem.firstChild.nextSibling ? goog.array.clone(contentElem.childNodes) : contentElem.firstChild)
  }else {
    control.setContentInternal(null)
  }
  var state = 0;
  var rendererClassName = this.getCssClass();
  var structuralClassName = this.getStructuralCssClass();
  var hasRendererClassName = false;
  var hasStructuralClassName = false;
  var hasCombinedClassName = false;
  var classNames = goog.dom.classes.get(element);
  goog.array.forEach(classNames, function(className) {
    if(!hasRendererClassName && className == rendererClassName) {
      hasRendererClassName = true;
      if(structuralClassName == rendererClassName) {
        hasStructuralClassName = true
      }
    }else {
      if(!hasStructuralClassName && className == structuralClassName) {
        hasStructuralClassName = true
      }else {
        state |= this.getStateFromClass(className)
      }
    }
  }, this);
  control.setStateInternal(state);
  if(!hasRendererClassName) {
    classNames.push(rendererClassName);
    if(structuralClassName == rendererClassName) {
      hasStructuralClassName = true
    }
  }
  if(!hasStructuralClassName) {
    classNames.push(structuralClassName)
  }
  var extraClassNames = control.getExtraClassNames();
  if(extraClassNames) {
    classNames.push.apply(classNames, extraClassNames)
  }
  if(goog.userAgent.IE && !goog.userAgent.isVersion("7")) {
    var combinedClasses = this.getAppliedCombinedClassNames_(classNames);
    if(combinedClasses.length > 0) {
      classNames.push.apply(classNames, combinedClasses);
      hasCombinedClassName = true
    }
  }
  if(!hasRendererClassName || !hasStructuralClassName || extraClassNames || hasCombinedClassName) {
    goog.dom.classes.set(element, classNames.join(" "))
  }
  this.setAriaStates(control, element);
  return element
};
goog.ui.ControlRenderer.prototype.initializeDom = function(control) {
  if(control.isRightToLeft()) {
    this.setRightToLeft(control.getElement(), true)
  }
  if(control.isEnabled()) {
    this.setFocusable(control, control.isVisible())
  }
};
goog.ui.ControlRenderer.prototype.setAriaRole = function(element, opt_preferredRole) {
  var ariaRole = opt_preferredRole || this.getAriaRole();
  if(ariaRole) {
    goog.dom.a11y.setRole(element, ariaRole)
  }
};
goog.ui.ControlRenderer.prototype.setAriaStates = function(control, element) {
  goog.asserts.assert(control);
  goog.asserts.assert(element);
  if(!control.isEnabled()) {
    this.updateAriaState(element, goog.ui.Component.State.DISABLED, true)
  }
  if(control.isSelected()) {
    this.updateAriaState(element, goog.ui.Component.State.SELECTED, true)
  }
  if(control.isSupportedState(goog.ui.Component.State.CHECKED)) {
    this.updateAriaState(element, goog.ui.Component.State.CHECKED, control.isChecked())
  }
  if(control.isSupportedState(goog.ui.Component.State.OPENED)) {
    this.updateAriaState(element, goog.ui.Component.State.OPENED, control.isOpen())
  }
};
goog.ui.ControlRenderer.prototype.setAllowTextSelection = function(element, allow) {
  goog.style.setUnselectable(element, !allow, !goog.userAgent.IE && !goog.userAgent.OPERA)
};
goog.ui.ControlRenderer.prototype.setRightToLeft = function(element, rightToLeft) {
  this.enableClassName(element, goog.getCssName(this.getStructuralCssClass(), "rtl"), rightToLeft)
};
goog.ui.ControlRenderer.prototype.isFocusable = function(control) {
  var keyTarget;
  if(control.isSupportedState(goog.ui.Component.State.FOCUSED) && (keyTarget = control.getKeyEventTarget())) {
    return goog.dom.isFocusableTabIndex(keyTarget)
  }
  return false
};
goog.ui.ControlRenderer.prototype.setFocusable = function(control, focusable) {
  var keyTarget;
  if(control.isSupportedState(goog.ui.Component.State.FOCUSED) && (keyTarget = control.getKeyEventTarget())) {
    if(!focusable && control.isFocused()) {
      try {
        keyTarget.blur()
      }catch(e) {
      }
      if(control.isFocused()) {
        control.handleBlur(null)
      }
    }
    if(goog.dom.isFocusableTabIndex(keyTarget) != focusable) {
      goog.dom.setFocusableTabIndex(keyTarget, focusable)
    }
  }
};
goog.ui.ControlRenderer.prototype.setVisible = function(element, visible) {
  goog.style.showElement(element, visible)
};
goog.ui.ControlRenderer.prototype.setState = function(control, state, enable) {
  var element = control.getElement();
  if(element) {
    var className = this.getClassForState(state);
    if(className) {
      this.enableClassName(control, className, enable)
    }
    this.updateAriaState(element, state, enable)
  }
};
goog.ui.ControlRenderer.prototype.updateAriaState = function(element, state, enable) {
  if(!goog.ui.ControlRenderer.ARIA_STATE_MAP_) {
    goog.ui.ControlRenderer.ARIA_STATE_MAP_ = goog.object.create(goog.ui.Component.State.DISABLED, goog.dom.a11y.State.DISABLED, goog.ui.Component.State.SELECTED, goog.dom.a11y.State.SELECTED, goog.ui.Component.State.CHECKED, goog.dom.a11y.State.CHECKED, goog.ui.Component.State.OPENED, goog.dom.a11y.State.EXPANDED)
  }
  var ariaState = goog.ui.ControlRenderer.ARIA_STATE_MAP_[state];
  if(ariaState) {
    goog.dom.a11y.setState(element, ariaState, enable)
  }
};
goog.ui.ControlRenderer.prototype.setContent = function(element, content) {
  var contentElem = this.getContentElement(element);
  if(contentElem) {
    goog.dom.removeChildren(contentElem);
    if(content) {
      if(goog.isString(content)) {
        goog.dom.setTextContent(contentElem, content)
      }else {
        var childHandler = function(child) {
          if(child) {
            var doc = goog.dom.getOwnerDocument(contentElem);
            contentElem.appendChild(goog.isString(child) ? doc.createTextNode(child) : child)
          }
        };
        if(goog.isArray(content)) {
          goog.array.forEach(content, childHandler)
        }else {
          if(goog.isArrayLike(content) && !("nodeType" in content)) {
            goog.array.forEach(goog.array.clone(content), childHandler)
          }else {
            childHandler(content)
          }
        }
      }
    }
  }
};
goog.ui.ControlRenderer.prototype.getKeyEventTarget = function(control) {
  return control.getElement()
};
goog.ui.ControlRenderer.prototype.getCssClass = function() {
  return goog.ui.ControlRenderer.CSS_CLASS
};
goog.ui.ControlRenderer.prototype.getIe6ClassCombinations = function() {
  return[]
};
goog.ui.ControlRenderer.prototype.getStructuralCssClass = function() {
  return this.getCssClass()
};
goog.ui.ControlRenderer.prototype.getClassNames = function(control) {
  var cssClass = this.getCssClass();
  var classNames = [cssClass];
  var structuralCssClass = this.getStructuralCssClass();
  if(structuralCssClass != cssClass) {
    classNames.push(structuralCssClass)
  }
  var classNamesForState = this.getClassNamesForState(control.getState());
  classNames.push.apply(classNames, classNamesForState);
  var extraClassNames = control.getExtraClassNames();
  if(extraClassNames) {
    classNames.push.apply(classNames, extraClassNames)
  }
  if(goog.userAgent.IE && !goog.userAgent.isVersion("7")) {
    classNames.push.apply(classNames, this.getAppliedCombinedClassNames_(classNames))
  }
  return classNames
};
goog.ui.ControlRenderer.prototype.getAppliedCombinedClassNames_ = function(classes, opt_includedClass) {
  var toAdd = [];
  if(opt_includedClass) {
    classes = classes.concat([opt_includedClass])
  }
  goog.array.forEach(this.getIe6ClassCombinations(), function(combo) {
    if(goog.array.every(combo, goog.partial(goog.array.contains, classes)) && (!opt_includedClass || goog.array.contains(combo, opt_includedClass))) {
      toAdd.push(combo.join("_"))
    }
  });
  return toAdd
};
goog.ui.ControlRenderer.prototype.getClassNamesForState = function(state) {
  var classNames = [];
  while(state) {
    var mask = state & -state;
    classNames.push(this.getClassForState(mask));
    state &= ~mask
  }
  return classNames
};
goog.ui.ControlRenderer.prototype.getClassForState = function(state) {
  if(!this.classByState_) {
    this.createClassByStateMap_()
  }
  return this.classByState_[state]
};
goog.ui.ControlRenderer.prototype.getStateFromClass = function(className) {
  if(!this.stateByClass_) {
    this.createStateByClassMap_()
  }
  var state = parseInt(this.stateByClass_[className], 10);
  return isNaN(state) ? 0 : state
};
goog.ui.ControlRenderer.prototype.createClassByStateMap_ = function() {
  var baseClass = this.getStructuralCssClass();
  this.classByState_ = goog.object.create(goog.ui.Component.State.DISABLED, goog.getCssName(baseClass, "disabled"), goog.ui.Component.State.HOVER, goog.getCssName(baseClass, "hover"), goog.ui.Component.State.ACTIVE, goog.getCssName(baseClass, "active"), goog.ui.Component.State.SELECTED, goog.getCssName(baseClass, "selected"), goog.ui.Component.State.CHECKED, goog.getCssName(baseClass, "checked"), goog.ui.Component.State.FOCUSED, goog.getCssName(baseClass, "focused"), goog.ui.Component.State.OPENED, 
  goog.getCssName(baseClass, "open"))
};
goog.ui.ControlRenderer.prototype.createStateByClassMap_ = function() {
  if(!this.classByState_) {
    this.createClassByStateMap_()
  }
  this.stateByClass_ = goog.object.transpose(this.classByState_)
};
goog.provide("goog.ui.registry");
goog.require("goog.dom.classes");
goog.ui.registry.getDefaultRenderer = function(componentCtor) {
  var key;
  var rendererCtor;
  while(componentCtor) {
    key = goog.getUid(componentCtor);
    if(rendererCtor = goog.ui.registry.defaultRenderers_[key]) {
      break
    }
    componentCtor = componentCtor.superClass_ ? componentCtor.superClass_.constructor : null
  }
  if(rendererCtor) {
    return goog.isFunction(rendererCtor.getInstance) ? rendererCtor.getInstance() : new rendererCtor
  }
  return null
};
goog.ui.registry.setDefaultRenderer = function(componentCtor, rendererCtor) {
  if(!goog.isFunction(componentCtor)) {
    throw Error("Invalid component class " + componentCtor);
  }
  if(!goog.isFunction(rendererCtor)) {
    throw Error("Invalid renderer class " + rendererCtor);
  }
  var key = goog.getUid(componentCtor);
  goog.ui.registry.defaultRenderers_[key] = rendererCtor
};
goog.ui.registry.getDecoratorByClassName = function(className) {
  return className in goog.ui.registry.decoratorFunctions_ ? goog.ui.registry.decoratorFunctions_[className]() : null
};
goog.ui.registry.setDecoratorByClassName = function(className, decoratorFn) {
  if(!className) {
    throw Error("Invalid class name " + className);
  }
  if(!goog.isFunction(decoratorFn)) {
    throw Error("Invalid decorator function " + decoratorFn);
  }
  goog.ui.registry.decoratorFunctions_[className] = decoratorFn
};
goog.ui.registry.getDecorator = function(element) {
  var decorator;
  var classNames = goog.dom.classes.get(element);
  for(var i = 0, len = classNames.length;i < len;i++) {
    if(decorator = goog.ui.registry.getDecoratorByClassName(classNames[i])) {
      return decorator
    }
  }
  return null
};
goog.ui.registry.reset = function() {
  goog.ui.registry.defaultRenderers_ = {};
  goog.ui.registry.decoratorFunctions_ = {}
};
goog.ui.registry.defaultRenderers_ = {};
goog.ui.registry.decoratorFunctions_ = {};
goog.provide("goog.ui.decorate");
goog.require("goog.ui.registry");
goog.ui.decorate = function(element) {
  var decorator = goog.ui.registry.getDecorator(element);
  if(decorator) {
    decorator.decorate(element)
  }
  return decorator
};
goog.provide("goog.ui.Control");
goog.require("goog.array");
goog.require("goog.dom");
goog.require("goog.events.BrowserEvent.MouseButton");
goog.require("goog.events.Event");
goog.require("goog.events.EventType");
goog.require("goog.events.KeyCodes");
goog.require("goog.events.KeyHandler");
goog.require("goog.events.KeyHandler.EventType");
goog.require("goog.string");
goog.require("goog.ui.Component");
goog.require("goog.ui.Component.Error");
goog.require("goog.ui.Component.EventType");
goog.require("goog.ui.Component.State");
goog.require("goog.ui.ControlContent");
goog.require("goog.ui.ControlRenderer");
goog.require("goog.ui.decorate");
goog.require("goog.ui.registry");
goog.require("goog.userAgent");
goog.ui.Control = function(content, opt_renderer, opt_domHelper) {
  goog.ui.Component.call(this, opt_domHelper);
  this.renderer_ = opt_renderer || goog.ui.registry.getDefaultRenderer(this.constructor);
  this.setContentInternal(content)
};
goog.inherits(goog.ui.Control, goog.ui.Component);
goog.ui.Control.registerDecorator = goog.ui.registry.setDecoratorByClassName;
goog.ui.Control.getDecorator = goog.ui.registry.getDecorator;
goog.ui.Control.decorate = goog.ui.decorate;
goog.ui.Control.prototype.renderer_;
goog.ui.Control.prototype.content_ = null;
goog.ui.Control.prototype.state_ = 0;
goog.ui.Control.prototype.supportedStates_ = goog.ui.Component.State.DISABLED | goog.ui.Component.State.HOVER | goog.ui.Component.State.ACTIVE | goog.ui.Component.State.FOCUSED;
goog.ui.Control.prototype.autoStates_ = goog.ui.Component.State.ALL;
goog.ui.Control.prototype.statesWithTransitionEvents_ = 0;
goog.ui.Control.prototype.visible_ = true;
goog.ui.Control.prototype.keyHandler_;
goog.ui.Control.prototype.extraClassNames_ = null;
goog.ui.Control.prototype.handleMouseEvents_ = true;
goog.ui.Control.prototype.allowTextSelection_ = false;
goog.ui.Control.prototype.preferredAriaRole_ = null;
goog.ui.Control.prototype.isHandleMouseEvents = function() {
  return this.handleMouseEvents_
};
goog.ui.Control.prototype.setHandleMouseEvents = function(enable) {
  if(this.isInDocument() && enable != this.handleMouseEvents_) {
    this.enableMouseEventHandling_(enable)
  }
  this.handleMouseEvents_ = enable
};
goog.ui.Control.prototype.getKeyEventTarget = function() {
  return this.renderer_.getKeyEventTarget(this)
};
goog.ui.Control.prototype.getKeyHandler = function() {
  return this.keyHandler_ || (this.keyHandler_ = new goog.events.KeyHandler)
};
goog.ui.Control.prototype.getRenderer = function() {
  return this.renderer_
};
goog.ui.Control.prototype.setRenderer = function(renderer) {
  if(this.isInDocument()) {
    throw Error(goog.ui.Component.Error.ALREADY_RENDERED);
  }
  if(this.getElement()) {
    this.setElementInternal(null)
  }
  this.renderer_ = renderer
};
goog.ui.Control.prototype.getExtraClassNames = function() {
  return this.extraClassNames_
};
goog.ui.Control.prototype.addClassName = function(className) {
  if(className) {
    if(this.extraClassNames_) {
      if(!goog.array.contains(this.extraClassNames_, className)) {
        this.extraClassNames_.push(className)
      }
    }else {
      this.extraClassNames_ = [className]
    }
    this.renderer_.enableExtraClassName(this, className, true)
  }
};
goog.ui.Control.prototype.removeClassName = function(className) {
  if(className && this.extraClassNames_) {
    goog.array.remove(this.extraClassNames_, className);
    if(this.extraClassNames_.length == 0) {
      this.extraClassNames_ = null
    }
    this.renderer_.enableExtraClassName(this, className, false)
  }
};
goog.ui.Control.prototype.enableClassName = function(className, enable) {
  if(enable) {
    this.addClassName(className)
  }else {
    this.removeClassName(className)
  }
};
goog.ui.Control.prototype.createDom = function() {
  var element = this.renderer_.createDom(this);
  this.setElementInternal(element);
  this.renderer_.setAriaRole(element, this.getPreferredAriaRole());
  if(!this.isAllowTextSelection()) {
    this.renderer_.setAllowTextSelection(element, false)
  }
  if(!this.isVisible()) {
    this.renderer_.setVisible(element, false)
  }
};
goog.ui.Control.prototype.getPreferredAriaRole = function() {
  return this.preferredAriaRole_
};
goog.ui.Control.prototype.setPreferredAriaRole = function(role) {
  this.preferredAriaRole_ = role
};
goog.ui.Control.prototype.getContentElement = function() {
  return this.renderer_.getContentElement(this.getElement())
};
goog.ui.Control.prototype.canDecorate = function(element) {
  return this.renderer_.canDecorate(element)
};
goog.ui.Control.prototype.decorateInternal = function(element) {
  element = this.renderer_.decorate(this, element);
  this.setElementInternal(element);
  this.renderer_.setAriaRole(element, this.getPreferredAriaRole());
  if(!this.isAllowTextSelection()) {
    this.renderer_.setAllowTextSelection(element, false)
  }
  this.visible_ = element.style.display != "none"
};
goog.ui.Control.prototype.enterDocument = function() {
  goog.ui.Control.superClass_.enterDocument.call(this);
  this.renderer_.initializeDom(this);
  if(this.supportedStates_ & ~goog.ui.Component.State.DISABLED) {
    if(this.isHandleMouseEvents()) {
      this.enableMouseEventHandling_(true)
    }
    if(this.isSupportedState(goog.ui.Component.State.FOCUSED)) {
      var keyTarget = this.getKeyEventTarget();
      if(keyTarget) {
        var keyHandler = this.getKeyHandler();
        keyHandler.attach(keyTarget);
        this.getHandler().listen(keyHandler, goog.events.KeyHandler.EventType.KEY, this.handleKeyEvent).listen(keyTarget, goog.events.EventType.FOCUS, this.handleFocus).listen(keyTarget, goog.events.EventType.BLUR, this.handleBlur)
      }
    }
  }
};
goog.ui.Control.prototype.enableMouseEventHandling_ = function(enable) {
  var handler = this.getHandler();
  var element = this.getElement();
  if(enable) {
    handler.listen(element, goog.events.EventType.MOUSEOVER, this.handleMouseOver).listen(element, goog.events.EventType.MOUSEDOWN, this.handleMouseDown).listen(element, goog.events.EventType.MOUSEUP, this.handleMouseUp).listen(element, goog.events.EventType.MOUSEOUT, this.handleMouseOut);
    if(goog.userAgent.IE) {
      handler.listen(element, goog.events.EventType.DBLCLICK, this.handleDblClick)
    }
  }else {
    handler.unlisten(element, goog.events.EventType.MOUSEOVER, this.handleMouseOver).unlisten(element, goog.events.EventType.MOUSEDOWN, this.handleMouseDown).unlisten(element, goog.events.EventType.MOUSEUP, this.handleMouseUp).unlisten(element, goog.events.EventType.MOUSEOUT, this.handleMouseOut);
    if(goog.userAgent.IE) {
      handler.unlisten(element, goog.events.EventType.DBLCLICK, this.handleDblClick)
    }
  }
};
goog.ui.Control.prototype.exitDocument = function() {
  goog.ui.Control.superClass_.exitDocument.call(this);
  if(this.keyHandler_) {
    this.keyHandler_.detach()
  }
  if(this.isVisible() && this.isEnabled()) {
    this.renderer_.setFocusable(this, false)
  }
};
goog.ui.Control.prototype.disposeInternal = function() {
  goog.ui.Control.superClass_.disposeInternal.call(this);
  if(this.keyHandler_) {
    this.keyHandler_.dispose();
    delete this.keyHandler_
  }
  delete this.renderer_;
  this.content_ = null;
  this.extraClassNames_ = null
};
goog.ui.Control.prototype.getContent = function() {
  return this.content_
};
goog.ui.Control.prototype.setContent = function(content) {
  this.renderer_.setContent(this.getElement(), content);
  this.setContentInternal(content)
};
goog.ui.Control.prototype.setContentInternal = function(content) {
  this.content_ = content
};
goog.ui.Control.prototype.getCaption = function() {
  var content = this.getContent();
  if(!content) {
    return""
  }
  var caption = goog.isString(content) ? content : goog.isArray(content) ? goog.array.map(content, goog.dom.getRawTextContent).join("") : goog.dom.getTextContent(content);
  return goog.string.collapseBreakingSpaces(caption)
};
goog.ui.Control.prototype.setCaption = function(caption) {
  this.setContent(caption)
};
goog.ui.Control.prototype.setRightToLeft = function(rightToLeft) {
  goog.ui.Control.superClass_.setRightToLeft.call(this, rightToLeft);
  var element = this.getElement();
  if(element) {
    this.renderer_.setRightToLeft(element, rightToLeft)
  }
};
goog.ui.Control.prototype.isAllowTextSelection = function() {
  return this.allowTextSelection_
};
goog.ui.Control.prototype.setAllowTextSelection = function(allow) {
  this.allowTextSelection_ = allow;
  var element = this.getElement();
  if(element) {
    this.renderer_.setAllowTextSelection(element, allow)
  }
};
goog.ui.Control.prototype.isVisible = function() {
  return this.visible_
};
goog.ui.Control.prototype.setVisible = function(visible, opt_force) {
  if(opt_force || this.visible_ != visible && this.dispatchEvent(visible ? goog.ui.Component.EventType.SHOW : goog.ui.Component.EventType.HIDE)) {
    var element = this.getElement();
    if(element) {
      this.renderer_.setVisible(element, visible)
    }
    if(this.isEnabled()) {
      this.renderer_.setFocusable(this, visible)
    }
    this.visible_ = visible;
    return true
  }
  return false
};
goog.ui.Control.prototype.isEnabled = function() {
  return!this.hasState(goog.ui.Component.State.DISABLED)
};
goog.ui.Control.prototype.isParentDisabled_ = function() {
  var parent = this.getParent();
  return!!parent && typeof parent.isEnabled == "function" && !parent.isEnabled()
};
goog.ui.Control.prototype.setEnabled = function(enable) {
  if(!this.isParentDisabled_() && this.isTransitionAllowed(goog.ui.Component.State.DISABLED, !enable)) {
    if(!enable) {
      this.setActive(false);
      this.setHighlighted(false)
    }
    if(this.isVisible()) {
      this.renderer_.setFocusable(this, enable)
    }
    this.setState(goog.ui.Component.State.DISABLED, !enable)
  }
};
goog.ui.Control.prototype.isHighlighted = function() {
  return this.hasState(goog.ui.Component.State.HOVER)
};
goog.ui.Control.prototype.setHighlighted = function(highlight) {
  if(this.isTransitionAllowed(goog.ui.Component.State.HOVER, highlight)) {
    this.setState(goog.ui.Component.State.HOVER, highlight)
  }
};
goog.ui.Control.prototype.isActive = function() {
  return this.hasState(goog.ui.Component.State.ACTIVE)
};
goog.ui.Control.prototype.setActive = function(active) {
  if(this.isTransitionAllowed(goog.ui.Component.State.ACTIVE, active)) {
    this.setState(goog.ui.Component.State.ACTIVE, active)
  }
};
goog.ui.Control.prototype.isSelected = function() {
  return this.hasState(goog.ui.Component.State.SELECTED)
};
goog.ui.Control.prototype.setSelected = function(select) {
  if(this.isTransitionAllowed(goog.ui.Component.State.SELECTED, select)) {
    this.setState(goog.ui.Component.State.SELECTED, select)
  }
};
goog.ui.Control.prototype.isChecked = function() {
  return this.hasState(goog.ui.Component.State.CHECKED)
};
goog.ui.Control.prototype.setChecked = function(check) {
  if(this.isTransitionAllowed(goog.ui.Component.State.CHECKED, check)) {
    this.setState(goog.ui.Component.State.CHECKED, check)
  }
};
goog.ui.Control.prototype.isFocused = function() {
  return this.hasState(goog.ui.Component.State.FOCUSED)
};
goog.ui.Control.prototype.setFocused = function(focused) {
  if(this.isTransitionAllowed(goog.ui.Component.State.FOCUSED, focused)) {
    this.setState(goog.ui.Component.State.FOCUSED, focused)
  }
};
goog.ui.Control.prototype.isOpen = function() {
  return this.hasState(goog.ui.Component.State.OPENED)
};
goog.ui.Control.prototype.setOpen = function(open) {
  if(this.isTransitionAllowed(goog.ui.Component.State.OPENED, open)) {
    this.setState(goog.ui.Component.State.OPENED, open)
  }
};
goog.ui.Control.prototype.getState = function() {
  return this.state_
};
goog.ui.Control.prototype.hasState = function(state) {
  return!!(this.state_ & state)
};
goog.ui.Control.prototype.setState = function(state, enable) {
  if(this.isSupportedState(state) && enable != this.hasState(state)) {
    this.renderer_.setState(this, state, enable);
    this.state_ = enable ? this.state_ | state : this.state_ & ~state
  }
};
goog.ui.Control.prototype.setStateInternal = function(state) {
  this.state_ = state
};
goog.ui.Control.prototype.isSupportedState = function(state) {
  return!!(this.supportedStates_ & state)
};
goog.ui.Control.prototype.setSupportedState = function(state, support) {
  if(this.isInDocument() && this.hasState(state) && !support) {
    throw Error(goog.ui.Component.Error.ALREADY_RENDERED);
  }
  if(!support && this.hasState(state)) {
    this.setState(state, false)
  }
  this.supportedStates_ = support ? this.supportedStates_ | state : this.supportedStates_ & ~state
};
goog.ui.Control.prototype.isAutoState = function(state) {
  return!!(this.autoStates_ & state) && this.isSupportedState(state)
};
goog.ui.Control.prototype.setAutoStates = function(states, enable) {
  this.autoStates_ = enable ? this.autoStates_ | states : this.autoStates_ & ~states
};
goog.ui.Control.prototype.isDispatchTransitionEvents = function(state) {
  return!!(this.statesWithTransitionEvents_ & state) && this.isSupportedState(state)
};
goog.ui.Control.prototype.setDispatchTransitionEvents = function(states, enable) {
  this.statesWithTransitionEvents_ = enable ? this.statesWithTransitionEvents_ | states : this.statesWithTransitionEvents_ & ~states
};
goog.ui.Control.prototype.isTransitionAllowed = function(state, enable) {
  return this.isSupportedState(state) && this.hasState(state) != enable && (!(this.statesWithTransitionEvents_ & state) || this.dispatchEvent(goog.ui.Component.getStateTransitionEvent(state, enable))) && !this.isDisposed()
};
goog.ui.Control.prototype.handleMouseOver = function(e) {
  if(!goog.ui.Control.isMouseEventWithinElement_(e, this.getElement()) && this.dispatchEvent(goog.ui.Component.EventType.ENTER) && this.isEnabled() && this.isAutoState(goog.ui.Component.State.HOVER)) {
    this.setHighlighted(true)
  }
};
goog.ui.Control.prototype.handleMouseOut = function(e) {
  if(!goog.ui.Control.isMouseEventWithinElement_(e, this.getElement()) && this.dispatchEvent(goog.ui.Component.EventType.LEAVE)) {
    if(this.isAutoState(goog.ui.Component.State.ACTIVE)) {
      this.setActive(false)
    }
    if(this.isAutoState(goog.ui.Component.State.HOVER)) {
      this.setHighlighted(false)
    }
  }
};
goog.ui.Control.isMouseEventWithinElement_ = function(e, elem) {
  return!!e.relatedTarget && goog.dom.contains(elem, e.relatedTarget)
};
goog.ui.Control.prototype.handleMouseDown = function(e) {
  if(this.isEnabled()) {
    if(this.isAutoState(goog.ui.Component.State.HOVER)) {
      this.setHighlighted(true)
    }
    if(e.isMouseActionButton()) {
      if(this.isAutoState(goog.ui.Component.State.ACTIVE)) {
        this.setActive(true)
      }
      if(this.renderer_.isFocusable(this)) {
        this.getKeyEventTarget().focus()
      }
    }
  }
  if(!this.isAllowTextSelection() && e.isMouseActionButton()) {
    e.preventDefault()
  }
};
goog.ui.Control.prototype.handleMouseUp = function(e) {
  if(this.isEnabled()) {
    if(this.isAutoState(goog.ui.Component.State.HOVER)) {
      this.setHighlighted(true)
    }
    if(this.isActive() && this.performActionInternal(e) && this.isAutoState(goog.ui.Component.State.ACTIVE)) {
      this.setActive(false)
    }
  }
};
goog.ui.Control.prototype.handleDblClick = function(e) {
  if(this.isEnabled()) {
    this.performActionInternal(e)
  }
};
goog.ui.Control.prototype.performActionInternal = function(e) {
  if(this.isAutoState(goog.ui.Component.State.CHECKED)) {
    this.setChecked(!this.isChecked())
  }
  if(this.isAutoState(goog.ui.Component.State.SELECTED)) {
    this.setSelected(true)
  }
  if(this.isAutoState(goog.ui.Component.State.OPENED)) {
    this.setOpen(!this.isOpen())
  }
  var actionEvent = new goog.events.Event(goog.ui.Component.EventType.ACTION, this);
  if(e) {
    var properties = ["altKey", "ctrlKey", "metaKey", "shiftKey", "platformModifierKey"];
    for(var property, i = 0;property = properties[i];i++) {
      actionEvent[property] = e[property]
    }
  }
  return this.dispatchEvent(actionEvent)
};
goog.ui.Control.prototype.handleFocus = function(e) {
  if(this.isAutoState(goog.ui.Component.State.FOCUSED)) {
    this.setFocused(true)
  }
};
goog.ui.Control.prototype.handleBlur = function(e) {
  if(this.isAutoState(goog.ui.Component.State.ACTIVE)) {
    this.setActive(false)
  }
  if(this.isAutoState(goog.ui.Component.State.FOCUSED)) {
    this.setFocused(false)
  }
};
goog.ui.Control.prototype.handleKeyEvent = function(e) {
  if(this.isVisible() && this.isEnabled() && this.handleKeyEventInternal(e)) {
    e.preventDefault();
    e.stopPropagation();
    return true
  }
  return false
};
goog.ui.Control.prototype.handleKeyEventInternal = function(e) {
  return e.keyCode == goog.events.KeyCodes.ENTER && this.performActionInternal(e)
};
goog.ui.registry.setDefaultRenderer(goog.ui.Control, goog.ui.ControlRenderer);
goog.ui.registry.setDecoratorByClassName(goog.ui.ControlRenderer.CSS_CLASS, function() {
  return new goog.ui.Control(null)
});
goog.provide("goog.ui.TextareaRenderer");
goog.require("goog.ui.Component.State");
goog.require("goog.ui.ControlRenderer");
goog.ui.TextareaRenderer = function() {
  goog.ui.ControlRenderer.call(this)
};
goog.inherits(goog.ui.TextareaRenderer, goog.ui.ControlRenderer);
goog.addSingletonGetter(goog.ui.TextareaRenderer);
goog.ui.TextareaRenderer.CSS_CLASS = goog.getCssName("goog-textarea");
goog.ui.TextareaRenderer.prototype.getAriaRole = function() {
  return undefined
};
goog.ui.TextareaRenderer.prototype.decorate = function(control, element) {
  goog.ui.TextareaRenderer.superClass_.decorate.call(this, control, element);
  control.setContentInternal(element.value);
  return element
};
goog.ui.TextareaRenderer.prototype.createDom = function(textarea) {
  this.setUpTextarea_(textarea);
  var element = textarea.getDomHelper().createDom("textarea", {"class":this.getClassNames(textarea).join(" "), "disabled":!textarea.isEnabled()}, textarea.getContent() || "");
  return element
};
goog.ui.TextareaRenderer.prototype.canDecorate = function(element) {
  return element.tagName == goog.dom.TagName.TEXTAREA
};
goog.ui.TextareaRenderer.prototype.setRightToLeft = goog.nullFunction;
goog.ui.TextareaRenderer.prototype.isFocusable = function(textarea) {
  return textarea.isEnabled()
};
goog.ui.TextareaRenderer.prototype.setFocusable = goog.nullFunction;
goog.ui.TextareaRenderer.prototype.setState = function(textarea, state, enable) {
  goog.ui.TextareaRenderer.superClass_.setState.call(this, textarea, state, enable);
  var element = textarea.getElement();
  if(element && state == goog.ui.Component.State.DISABLED) {
    element.disabled = enable
  }
};
goog.ui.TextareaRenderer.prototype.updateAriaState = goog.nullFunction;
goog.ui.TextareaRenderer.prototype.setUpTextarea_ = function(textarea) {
  textarea.setHandleMouseEvents(false);
  textarea.setAutoStates(goog.ui.Component.State.ALL, false);
  textarea.setSupportedState(goog.ui.Component.State.FOCUSED, false)
};
goog.ui.TextareaRenderer.prototype.setContent = function(element, value) {
  if(element) {
    element.value = value
  }
};
goog.ui.TextareaRenderer.prototype.getCssClass = function() {
  return goog.ui.TextareaRenderer.CSS_CLASS
};
goog.provide("goog.userAgent.product");
goog.require("goog.userAgent");
goog.userAgent.product.ASSUME_FIREFOX = false;
goog.userAgent.product.ASSUME_CAMINO = false;
goog.userAgent.product.ASSUME_IPHONE = false;
goog.userAgent.product.ASSUME_IPAD = false;
goog.userAgent.product.ASSUME_ANDROID = false;
goog.userAgent.product.ASSUME_CHROME = false;
goog.userAgent.product.ASSUME_SAFARI = false;
goog.userAgent.product.PRODUCT_KNOWN_ = goog.userAgent.ASSUME_IE || goog.userAgent.ASSUME_OPERA || goog.userAgent.product.ASSUME_FIREFOX || goog.userAgent.product.ASSUME_CAMINO || goog.userAgent.product.ASSUME_IPHONE || goog.userAgent.product.ASSUME_IPAD || goog.userAgent.product.ASSUME_ANDROID || goog.userAgent.product.ASSUME_CHROME || goog.userAgent.product.ASSUME_SAFARI;
goog.userAgent.product.init_ = function() {
  goog.userAgent.product.detectedFirefox_ = false;
  goog.userAgent.product.detectedCamino_ = false;
  goog.userAgent.product.detectedIphone_ = false;
  goog.userAgent.product.detectedIpad_ = false;
  goog.userAgent.product.detectedAndroid_ = false;
  goog.userAgent.product.detectedChrome_ = false;
  goog.userAgent.product.detectedSafari_ = false;
  var ua = goog.userAgent.getUserAgentString();
  if(!ua) {
    return
  }
  if(ua.indexOf("Firefox") != -1) {
    goog.userAgent.product.detectedFirefox_ = true
  }else {
    if(ua.indexOf("Camino") != -1) {
      goog.userAgent.product.detectedCamino_ = true
    }else {
      if(ua.indexOf("iPhone") != -1 || ua.indexOf("iPod") != -1) {
        goog.userAgent.product.detectedIphone_ = true
      }else {
        if(ua.indexOf("iPad") != -1) {
          goog.userAgent.product.detectedIpad_ = true
        }else {
          if(ua.indexOf("Android") != -1) {
            goog.userAgent.product.detectedAndroid_ = true
          }else {
            if(ua.indexOf("Chrome") != -1) {
              goog.userAgent.product.detectedChrome_ = true
            }else {
              if(ua.indexOf("Safari") != -1) {
                goog.userAgent.product.detectedSafari_ = true
              }
            }
          }
        }
      }
    }
  }
};
if(!goog.userAgent.product.PRODUCT_KNOWN_) {
  goog.userAgent.product.init_()
}
goog.userAgent.product.OPERA = goog.userAgent.OPERA;
goog.userAgent.product.IE = goog.userAgent.IE;
goog.userAgent.product.FIREFOX = goog.userAgent.product.PRODUCT_KNOWN_ ? goog.userAgent.product.ASSUME_FIREFOX : goog.userAgent.product.detectedFirefox_;
goog.userAgent.product.CAMINO = goog.userAgent.product.PRODUCT_KNOWN_ ? goog.userAgent.product.ASSUME_CAMINO : goog.userAgent.product.detectedCamino_;
goog.userAgent.product.IPHONE = goog.userAgent.product.PRODUCT_KNOWN_ ? goog.userAgent.product.ASSUME_IPHONE : goog.userAgent.product.detectedIphone_;
goog.userAgent.product.IPAD = goog.userAgent.product.PRODUCT_KNOWN_ ? goog.userAgent.product.ASSUME_IPAD : goog.userAgent.product.detectedIpad_;
goog.userAgent.product.ANDROID = goog.userAgent.product.PRODUCT_KNOWN_ ? goog.userAgent.product.ASSUME_ANDROID : goog.userAgent.product.detectedAndroid_;
goog.userAgent.product.CHROME = goog.userAgent.product.PRODUCT_KNOWN_ ? goog.userAgent.product.ASSUME_CHROME : goog.userAgent.product.detectedChrome_;
goog.userAgent.product.SAFARI = goog.userAgent.product.PRODUCT_KNOWN_ ? goog.userAgent.product.ASSUME_SAFARI : goog.userAgent.product.detectedSafari_;
goog.provide("goog.ui.Textarea");
goog.require("goog.Timer");
goog.require("goog.events.EventType");
goog.require("goog.events.KeyCodes");
goog.require("goog.style");
goog.require("goog.ui.Control");
goog.require("goog.ui.TextareaRenderer");
goog.require("goog.userAgent");
goog.require("goog.userAgent.product");
goog.ui.Textarea = function(content, opt_renderer, opt_domHelper) {
  goog.ui.Control.call(this, content, opt_renderer || goog.ui.TextareaRenderer.getInstance(), opt_domHelper);
  this.setHandleMouseEvents(false);
  this.setAllowTextSelection(true);
  if(!content) {
    this.setContentInternal("")
  }
};
goog.inherits(goog.ui.Textarea, goog.ui.Control);
goog.ui.Textarea.NEEDS_HELP_SHRINKING_ = goog.userAgent.GECKO || goog.userAgent.WEBKIT;
goog.ui.Textarea.prototype.isResizing_ = false;
goog.ui.Textarea.prototype.height_ = 0;
goog.ui.Textarea.prototype.maxHeight_ = 0;
goog.ui.Textarea.prototype.minHeight_ = 0;
goog.ui.Textarea.prototype.hasDiscoveredTextareaCharacteristics_ = false;
goog.ui.Textarea.prototype.needsPaddingBorderFix_ = false;
goog.ui.Textarea.prototype.scrollHeightIncludesPadding_ = false;
goog.ui.Textarea.prototype.scrollHeightIncludesBorder_ = false;
goog.ui.Textarea.prototype.paddingBox_;
goog.ui.Textarea.prototype.borderBox_;
goog.ui.Textarea.prototype.getPaddingBorderBoxHeight_ = function() {
  var paddingBorderBoxHeight = this.paddingBox_.top + this.paddingBox_.bottom + this.borderBox_.top + this.borderBox_.bottom;
  return paddingBorderBoxHeight
};
goog.ui.Textarea.prototype.getMinHeight = function() {
  return this.minHeight_
};
goog.ui.Textarea.prototype.getMinHeight_ = function() {
  var minHeight = this.minHeight_;
  var textarea = this.getElement();
  if(minHeight && textarea && this.needsPaddingBorderFix_) {
    minHeight -= this.getPaddingBorderBoxHeight_()
  }
  return minHeight
};
goog.ui.Textarea.prototype.setMinHeight = function(height) {
  this.minHeight_ = height;
  this.resize()
};
goog.ui.Textarea.prototype.getMaxHeight = function() {
  return this.maxHeight_
};
goog.ui.Textarea.prototype.getMaxHeight_ = function() {
  var maxHeight = this.maxHeight_;
  var textarea = this.getElement();
  if(maxHeight && textarea && this.needsPaddingBorderFix_) {
    maxHeight -= this.getPaddingBorderBoxHeight_()
  }
  return maxHeight
};
goog.ui.Textarea.prototype.setMaxHeight = function(height) {
  this.maxHeight_ = height;
  this.resize()
};
goog.ui.Textarea.prototype.setValue = function(value) {
  this.setContent(String(value))
};
goog.ui.Textarea.prototype.getValue = function() {
  return this.getElement().value
};
goog.ui.Textarea.prototype.setContent = function(content) {
  goog.ui.Textarea.superClass_.setContent.call(this, content);
  this.resize()
};
goog.ui.Textarea.prototype.setEnabled = function(enable) {
  goog.ui.Textarea.superClass_.setEnabled.call(this, enable);
  this.getElement().disabled = !enable
};
goog.ui.Textarea.prototype.resize = function() {
  if(this.getElement()) {
    this.grow_()
  }
};
goog.ui.Textarea.prototype.enterDocument = function() {
  var textarea = this.getElement();
  goog.style.setStyle(textarea, {"overflowY":"hidden", "overflowX":"auto", "boxSizing":"border-box", "MsBoxSizing":"border-box", "WebkitBoxSizing":"border-box", "MozBoxSizing":"border-box"});
  this.paddingBox_ = goog.style.getPaddingBox(textarea);
  this.borderBox_ = goog.style.getBorderBox(textarea);
  this.getHandler().listen(textarea, goog.events.EventType.SCROLL, this.grow_).listen(textarea, goog.events.EventType.FOCUS, this.grow_).listen(textarea, goog.events.EventType.KEYUP, this.grow_).listen(textarea, goog.events.EventType.MOUSEUP, this.mouseUpListener_);
  this.resize()
};
goog.ui.Textarea.prototype.getHeight_ = function() {
  this.discoverTextareaCharacteristics_();
  var textarea = this.getElement();
  var height = this.getElement().scrollHeight + this.getHorizontalScrollBarHeight_();
  if(this.needsPaddingBorderFix_) {
    height -= this.getPaddingBorderBoxHeight_()
  }else {
    if(!this.scrollHeightIncludesPadding_) {
      var paddingBox = this.paddingBox_;
      var paddingBoxHeight = paddingBox.top + paddingBox.bottom;
      height += paddingBoxHeight
    }
    if(!this.scrollHeightIncludesBorder_) {
      var borderBox = goog.style.getBorderBox(textarea);
      var borderBoxHeight = borderBox.top + borderBox.bottom;
      height += borderBoxHeight
    }
  }
  return height
};
goog.ui.Textarea.prototype.setHeight_ = function(height) {
  if(this.height_ != height) {
    this.height_ = height;
    this.getElement().style.height = height + "px"
  }
};
goog.ui.Textarea.prototype.setHeightToEstimate_ = function() {
  var textarea = this.getElement();
  textarea.style.height = "auto";
  var newlines = textarea.value.match(/\n/g) || [];
  textarea.rows = newlines.length + 1
};
goog.ui.Textarea.prototype.getHorizontalScrollBarHeight_ = function() {
  var textarea = this.getElement();
  var height = textarea.offsetHeight - textarea.clientHeight;
  if(!this.scrollHeightIncludesPadding_) {
    var paddingBox = this.paddingBox_;
    var paddingBoxHeight = paddingBox.top + paddingBox.bottom;
    height -= paddingBoxHeight
  }
  if(!this.scrollHeightIncludesBorder_) {
    var borderBox = goog.style.getBorderBox(textarea);
    var borderBoxHeight = borderBox.top + borderBox.bottom;
    height -= borderBoxHeight
  }
  return height > 0 ? height : 0
};
goog.ui.Textarea.prototype.discoverTextareaCharacteristics_ = function() {
  if(!this.hasDiscoveredTextareaCharacteristics_) {
    var textarea = this.getElement().cloneNode(false);
    goog.style.setStyle(textarea, {"position":"absolute", "height":"auto", "top":"-9999px", "margin":"0", "padding":"1px", "border":"1px solid #000", "overflow":"hidden"});
    goog.dom.appendChild(this.getDomHelper().getDocument().body, textarea);
    var initialScrollHeight = textarea.scrollHeight;
    textarea.style.padding = "10px";
    var paddingScrollHeight = textarea.scrollHeight;
    this.scrollHeightIncludesPadding_ = paddingScrollHeight > initialScrollHeight;
    initialScrollHeight = paddingScrollHeight;
    textarea.style.borderWidth = "10px";
    var borderScrollHeight = textarea.scrollHeight;
    this.scrollHeightIncludesBorder_ = borderScrollHeight > initialScrollHeight;
    textarea.style.height = "100px";
    var offsetHeightAtHeight100 = textarea.offsetHeight;
    if(offsetHeightAtHeight100 != 100) {
      this.needsPaddingBorderFix_ = true
    }
    goog.dom.removeNode(textarea);
    this.hasDiscoveredTextareaCharacteristics_ = true
  }
};
goog.ui.Textarea.prototype.grow_ = function(opt_e) {
  if(this.isResizing_) {
    return
  }
  var shouldCallShrink = false;
  this.isResizing_ = true;
  var textarea = this.getElement();
  if(textarea.scrollHeight) {
    var setMinHeight = false;
    var setMaxHeight = false;
    var newHeight = this.getHeight_();
    var currentHeight = textarea.offsetHeight;
    var minHeight = this.getMinHeight_();
    var maxHeight = this.getMaxHeight_();
    if(minHeight && newHeight < minHeight) {
      this.setHeight_(minHeight);
      setMinHeight = true
    }else {
      if(maxHeight && newHeight > maxHeight) {
        this.setHeight_(maxHeight);
        textarea.style.overflowY = "";
        setMaxHeight = true
      }else {
        if(currentHeight != newHeight) {
          this.setHeight_(newHeight)
        }else {
          if(!this.height_) {
            this.height_ = newHeight
          }
        }
      }
    }
    if(!setMinHeight && !setMaxHeight && goog.ui.Textarea.NEEDS_HELP_SHRINKING_) {
      shouldCallShrink = true
    }
  }else {
    this.setHeightToEstimate_()
  }
  this.isResizing_ = false;
  if(shouldCallShrink) {
    this.shrink_()
  }
};
goog.ui.Textarea.prototype.shrink_ = function() {
  var textarea = this.getElement();
  if(!this.isResizing_) {
    this.isResizing_ = true;
    var isEmpty = false;
    if(!textarea.value) {
      textarea.value = " ";
      isEmpty = true
    }
    var scrollHeight = textarea.scrollHeight;
    if(!scrollHeight) {
      this.setHeightToEstimate_()
    }else {
      var currentHeight = this.getHeight_();
      var minHeight = this.getMinHeight_();
      var maxHeight = this.getMaxHeight_();
      if(!(minHeight && currentHeight <= minHeight) && !(maxHeight && currentHeight >= maxHeight)) {
        var paddingBox = this.paddingBox_;
        textarea.style.paddingBottom = paddingBox.bottom + 1 + "px";
        var heightAfterNudge = this.getHeight_();
        if(heightAfterNudge == currentHeight) {
          textarea.style.paddingBottom = paddingBox.bottom + scrollHeight + "px";
          textarea.scrollTop = 0;
          var shrinkToHeight = this.getHeight_() - scrollHeight;
          if(shrinkToHeight >= minHeight) {
            this.setHeight_(shrinkToHeight)
          }else {
            this.setHeight_(minHeight)
          }
        }
        textarea.style.paddingBottom = paddingBox.bottom + "px"
      }
    }
    if(isEmpty) {
      textarea.value = ""
    }
    this.isResizing_ = false
  }
};
goog.ui.Textarea.prototype.mouseUpListener_ = function(e) {
  var textarea = this.getElement();
  var height = textarea.offsetHeight;
  if(textarea["filters"] && textarea["filters"].length) {
    var dropShadow = textarea["filters"]["item"]("DXImageTransform.Microsoft.DropShadow");
    if(dropShadow) {
      height -= dropShadow["offX"]
    }
  }
  if(height != this.height_) {
    this.minHeight_ = height;
    this.height_ = height
  }
};
goog.provide("onedit.util");
goog.require("cljs.core");
onedit.util.collfn = function collfn(p1__7242_SHARP_) {
  return cljs.core.partial.call(null, cljs.core.apply, p1__7242_SHARP_)
};
onedit.util.sum = onedit.util.collfn.call(null, cljs.core._PLUS_);
onedit.util.join = onedit.util.collfn.call(null, cljs.core.str);
onedit.util.double$ = function double$(p1__7243_SHARP_) {
  return cljs.core.comp.call(null, p1__7243_SHARP_, p1__7243_SHARP_)
};
onedit.util.split = function split(n, s) {
  return cljs.core.PersistentVector.fromArray([cljs.core.subs.call(null, s, 0, n), cljs.core.subs.call(null, s, n, cljs.core.count.call(null, s))], true)
};
goog.provide("clojure.set");
goog.require("cljs.core");
clojure.set.bubble_max_key = function bubble_max_key(k, coll) {
  var max__7881 = cljs.core.apply.call(null, cljs.core.max_key, k, coll);
  return cljs.core.cons.call(null, max__7881, cljs.core.remove.call(null, function(p1__7879_SHARP_) {
    return max__7881 === p1__7879_SHARP_
  }, coll))
};
clojure.set.union = function() {
  var union = null;
  var union__0 = function() {
    return cljs.core.PersistentHashSet.EMPTY
  };
  var union__1 = function(s1) {
    return s1
  };
  var union__2 = function(s1, s2) {
    if(cljs.core.count.call(null, s1) < cljs.core.count.call(null, s2)) {
      return cljs.core.reduce.call(null, cljs.core.conj, s2, s1)
    }else {
      return cljs.core.reduce.call(null, cljs.core.conj, s1, s2)
    }
  };
  var union__3 = function() {
    var G__7885__delegate = function(s1, s2, sets) {
      var bubbled_sets__7884 = clojure.set.bubble_max_key.call(null, cljs.core.count, cljs.core.conj.call(null, sets, s2, s1));
      return cljs.core.reduce.call(null, cljs.core.into, cljs.core.first.call(null, bubbled_sets__7884), cljs.core.rest.call(null, bubbled_sets__7884))
    };
    var G__7885 = function(s1, s2, var_args) {
      var sets = null;
      if(goog.isDef(var_args)) {
        sets = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7885__delegate.call(this, s1, s2, sets)
    };
    G__7885.cljs$lang$maxFixedArity = 2;
    G__7885.cljs$lang$applyTo = function(arglist__7886) {
      var s1 = cljs.core.first(arglist__7886);
      var s2 = cljs.core.first(cljs.core.next(arglist__7886));
      var sets = cljs.core.rest(cljs.core.next(arglist__7886));
      return G__7885__delegate(s1, s2, sets)
    };
    G__7885.cljs$lang$arity$variadic = G__7885__delegate;
    return G__7885
  }();
  union = function(s1, s2, var_args) {
    var sets = var_args;
    switch(arguments.length) {
      case 0:
        return union__0.call(this);
      case 1:
        return union__1.call(this, s1);
      case 2:
        return union__2.call(this, s1, s2);
      default:
        return union__3.cljs$lang$arity$variadic(s1, s2, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  union.cljs$lang$maxFixedArity = 2;
  union.cljs$lang$applyTo = union__3.cljs$lang$applyTo;
  union.cljs$lang$arity$0 = union__0;
  union.cljs$lang$arity$1 = union__1;
  union.cljs$lang$arity$2 = union__2;
  union.cljs$lang$arity$variadic = union__3.cljs$lang$arity$variadic;
  return union
}();
clojure.set.intersection = function() {
  var intersection = null;
  var intersection__1 = function(s1) {
    return s1
  };
  var intersection__2 = function(s1, s2) {
    while(true) {
      if(cljs.core.count.call(null, s2) < cljs.core.count.call(null, s1)) {
        var G__7889 = s2;
        var G__7890 = s1;
        s1 = G__7889;
        s2 = G__7890;
        continue
      }else {
        return cljs.core.reduce.call(null, function(s1, s2) {
          return function(result, item) {
            if(cljs.core.contains_QMARK_.call(null, s2, item)) {
              return result
            }else {
              return cljs.core.disj.call(null, result, item)
            }
          }
        }(s1, s2), s1, s1)
      }
      break
    }
  };
  var intersection__3 = function() {
    var G__7891__delegate = function(s1, s2, sets) {
      var bubbled_sets__7888 = clojure.set.bubble_max_key.call(null, function(p1__7882_SHARP_) {
        return-cljs.core.count.call(null, p1__7882_SHARP_)
      }, cljs.core.conj.call(null, sets, s2, s1));
      return cljs.core.reduce.call(null, intersection, cljs.core.first.call(null, bubbled_sets__7888), cljs.core.rest.call(null, bubbled_sets__7888))
    };
    var G__7891 = function(s1, s2, var_args) {
      var sets = null;
      if(goog.isDef(var_args)) {
        sets = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7891__delegate.call(this, s1, s2, sets)
    };
    G__7891.cljs$lang$maxFixedArity = 2;
    G__7891.cljs$lang$applyTo = function(arglist__7892) {
      var s1 = cljs.core.first(arglist__7892);
      var s2 = cljs.core.first(cljs.core.next(arglist__7892));
      var sets = cljs.core.rest(cljs.core.next(arglist__7892));
      return G__7891__delegate(s1, s2, sets)
    };
    G__7891.cljs$lang$arity$variadic = G__7891__delegate;
    return G__7891
  }();
  intersection = function(s1, s2, var_args) {
    var sets = var_args;
    switch(arguments.length) {
      case 1:
        return intersection__1.call(this, s1);
      case 2:
        return intersection__2.call(this, s1, s2);
      default:
        return intersection__3.cljs$lang$arity$variadic(s1, s2, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  intersection.cljs$lang$maxFixedArity = 2;
  intersection.cljs$lang$applyTo = intersection__3.cljs$lang$applyTo;
  intersection.cljs$lang$arity$1 = intersection__1;
  intersection.cljs$lang$arity$2 = intersection__2;
  intersection.cljs$lang$arity$variadic = intersection__3.cljs$lang$arity$variadic;
  return intersection
}();
clojure.set.difference = function() {
  var difference = null;
  var difference__1 = function(s1) {
    return s1
  };
  var difference__2 = function(s1, s2) {
    if(cljs.core.count.call(null, s1) < cljs.core.count.call(null, s2)) {
      return cljs.core.reduce.call(null, function(result, item) {
        if(cljs.core.contains_QMARK_.call(null, s2, item)) {
          return cljs.core.disj.call(null, result, item)
        }else {
          return result
        }
      }, s1, s1)
    }else {
      return cljs.core.reduce.call(null, cljs.core.disj, s1, s2)
    }
  };
  var difference__3 = function() {
    var G__7893__delegate = function(s1, s2, sets) {
      return cljs.core.reduce.call(null, difference, s1, cljs.core.conj.call(null, sets, s2))
    };
    var G__7893 = function(s1, s2, var_args) {
      var sets = null;
      if(goog.isDef(var_args)) {
        sets = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7893__delegate.call(this, s1, s2, sets)
    };
    G__7893.cljs$lang$maxFixedArity = 2;
    G__7893.cljs$lang$applyTo = function(arglist__7894) {
      var s1 = cljs.core.first(arglist__7894);
      var s2 = cljs.core.first(cljs.core.next(arglist__7894));
      var sets = cljs.core.rest(cljs.core.next(arglist__7894));
      return G__7893__delegate(s1, s2, sets)
    };
    G__7893.cljs$lang$arity$variadic = G__7893__delegate;
    return G__7893
  }();
  difference = function(s1, s2, var_args) {
    var sets = var_args;
    switch(arguments.length) {
      case 1:
        return difference__1.call(this, s1);
      case 2:
        return difference__2.call(this, s1, s2);
      default:
        return difference__3.cljs$lang$arity$variadic(s1, s2, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  difference.cljs$lang$maxFixedArity = 2;
  difference.cljs$lang$applyTo = difference__3.cljs$lang$applyTo;
  difference.cljs$lang$arity$1 = difference__1;
  difference.cljs$lang$arity$2 = difference__2;
  difference.cljs$lang$arity$variadic = difference__3.cljs$lang$arity$variadic;
  return difference
}();
clojure.set.select = function select(pred, xset) {
  return cljs.core.reduce.call(null, function(s, k) {
    if(cljs.core.truth_(pred.call(null, k))) {
      return s
    }else {
      return cljs.core.disj.call(null, s, k)
    }
  }, xset, xset)
};
clojure.set.project = function project(xrel, ks) {
  return cljs.core.set.call(null, cljs.core.map.call(null, function(p1__7895_SHARP_) {
    return cljs.core.select_keys.call(null, p1__7895_SHARP_, ks)
  }, xrel))
};
clojure.set.rename_keys = function rename_keys(map, kmap) {
  return cljs.core.reduce.call(null, function(m, p__7903) {
    var vec__7904__7905 = p__7903;
    var old__7906 = cljs.core.nth.call(null, vec__7904__7905, 0, null);
    var new__7907 = cljs.core.nth.call(null, vec__7904__7905, 1, null);
    if(function() {
      var and__3822__auto____7908 = cljs.core.not_EQ_.call(null, old__7906, new__7907);
      if(and__3822__auto____7908) {
        return cljs.core.contains_QMARK_.call(null, m, old__7906)
      }else {
        return and__3822__auto____7908
      }
    }()) {
      return cljs.core.dissoc.call(null, cljs.core.assoc.call(null, m, new__7907, cljs.core._lookup.call(null, m, old__7906, null)), old__7906)
    }else {
      return m
    }
  }, map, kmap)
};
clojure.set.rename = function rename(xrel, kmap) {
  return cljs.core.set.call(null, cljs.core.map.call(null, function(p1__7896_SHARP_) {
    return clojure.set.rename_keys.call(null, p1__7896_SHARP_, kmap)
  }, xrel))
};
clojure.set.index = function index(xrel, ks) {
  return cljs.core.reduce.call(null, function(m, x) {
    var ik__7910 = cljs.core.select_keys.call(null, x, ks);
    return cljs.core.assoc.call(null, m, ik__7910, cljs.core.conj.call(null, cljs.core._lookup.call(null, m, ik__7910, cljs.core.PersistentHashSet.EMPTY), x))
  }, cljs.core.ObjMap.EMPTY, xrel)
};
clojure.set.map_invert = function map_invert(m) {
  return cljs.core.reduce.call(null, function(m, p__7920) {
    var vec__7921__7922 = p__7920;
    var k__7923 = cljs.core.nth.call(null, vec__7921__7922, 0, null);
    var v__7924 = cljs.core.nth.call(null, vec__7921__7922, 1, null);
    return cljs.core.assoc.call(null, m, v__7924, k__7923)
  }, cljs.core.ObjMap.EMPTY, m)
};
clojure.set.join = function() {
  var join = null;
  var join__2 = function(xrel, yrel) {
    if(function() {
      var and__3822__auto____7941 = cljs.core.seq.call(null, xrel);
      if(and__3822__auto____7941) {
        return cljs.core.seq.call(null, yrel)
      }else {
        return and__3822__auto____7941
      }
    }()) {
      var ks__7943 = clojure.set.intersection.call(null, cljs.core.set.call(null, cljs.core.keys.call(null, cljs.core.first.call(null, xrel))), cljs.core.set.call(null, cljs.core.keys.call(null, cljs.core.first.call(null, yrel))));
      var vec__7942__7944 = cljs.core.count.call(null, xrel) <= cljs.core.count.call(null, yrel) ? cljs.core.PersistentVector.fromArray([xrel, yrel], true) : cljs.core.PersistentVector.fromArray([yrel, xrel], true);
      var r__7945 = cljs.core.nth.call(null, vec__7942__7944, 0, null);
      var s__7946 = cljs.core.nth.call(null, vec__7942__7944, 1, null);
      var idx__7947 = clojure.set.index.call(null, r__7945, ks__7943);
      return cljs.core.reduce.call(null, function(ret, x) {
        var found__7948 = idx__7947.call(null, cljs.core.select_keys.call(null, x, ks__7943));
        if(cljs.core.truth_(found__7948)) {
          return cljs.core.reduce.call(null, function(p1__7911_SHARP_, p2__7912_SHARP_) {
            return cljs.core.conj.call(null, p1__7911_SHARP_, cljs.core.merge.call(null, p2__7912_SHARP_, x))
          }, ret, found__7948)
        }else {
          return ret
        }
      }, cljs.core.PersistentHashSet.EMPTY, s__7946)
    }else {
      return cljs.core.PersistentHashSet.EMPTY
    }
  };
  var join__3 = function(xrel, yrel, km) {
    var vec__7949__7950 = cljs.core.count.call(null, xrel) <= cljs.core.count.call(null, yrel) ? cljs.core.PersistentVector.fromArray([xrel, yrel, clojure.set.map_invert.call(null, km)], true) : cljs.core.PersistentVector.fromArray([yrel, xrel, km], true);
    var r__7951 = cljs.core.nth.call(null, vec__7949__7950, 0, null);
    var s__7952 = cljs.core.nth.call(null, vec__7949__7950, 1, null);
    var k__7953 = cljs.core.nth.call(null, vec__7949__7950, 2, null);
    var idx__7954 = clojure.set.index.call(null, r__7951, cljs.core.vals.call(null, k__7953));
    return cljs.core.reduce.call(null, function(ret, x) {
      var found__7955 = idx__7954.call(null, clojure.set.rename_keys.call(null, cljs.core.select_keys.call(null, x, cljs.core.keys.call(null, k__7953)), k__7953));
      if(cljs.core.truth_(found__7955)) {
        return cljs.core.reduce.call(null, function(p1__7913_SHARP_, p2__7914_SHARP_) {
          return cljs.core.conj.call(null, p1__7913_SHARP_, cljs.core.merge.call(null, p2__7914_SHARP_, x))
        }, ret, found__7955)
      }else {
        return ret
      }
    }, cljs.core.PersistentHashSet.EMPTY, s__7952)
  };
  join = function(xrel, yrel, km) {
    switch(arguments.length) {
      case 2:
        return join__2.call(this, xrel, yrel);
      case 3:
        return join__3.call(this, xrel, yrel, km)
    }
    throw"Invalid arity: " + arguments.length;
  };
  join.cljs$lang$arity$2 = join__2;
  join.cljs$lang$arity$3 = join__3;
  return join
}();
clojure.set.subset_QMARK_ = function subset_QMARK_(set1, set2) {
  var and__3822__auto____7958 = cljs.core.count.call(null, set1) <= cljs.core.count.call(null, set2);
  if(and__3822__auto____7958) {
    return cljs.core.every_QMARK_.call(null, function(p1__7925_SHARP_) {
      return cljs.core.contains_QMARK_.call(null, set2, p1__7925_SHARP_)
    }, set1)
  }else {
    return and__3822__auto____7958
  }
};
clojure.set.superset_QMARK_ = function superset_QMARK_(set1, set2) {
  var and__3822__auto____7960 = cljs.core.count.call(null, set1) >= cljs.core.count.call(null, set2);
  if(and__3822__auto____7960) {
    return cljs.core.every_QMARK_.call(null, function(p1__7956_SHARP_) {
      return cljs.core.contains_QMARK_.call(null, set1, p1__7956_SHARP_)
    }, set2)
  }else {
    return and__3822__auto____7960
  }
};
goog.provide("cljs.core.logic");
goog.require("cljs.core");
goog.require("clojure.set");
cljs.core.logic._STAR_occurs_check_STAR_ = true;
cljs.core.logic.IUnifyTerms = {};
cljs.core.logic._unify_terms = function _unify_terms(u, v, s) {
  if(function() {
    var and__3822__auto____7307 = u;
    if(and__3822__auto____7307) {
      return u.cljs$core$logic$IUnifyTerms$_unify_terms$arity$3
    }else {
      return and__3822__auto____7307
    }
  }()) {
    return u.cljs$core$logic$IUnifyTerms$_unify_terms$arity$3(u, v, s)
  }else {
    var x__2387__auto____7308 = u == null ? null : u;
    return function() {
      var or__3824__auto____7309 = cljs.core.logic._unify_terms[goog.typeOf(x__2387__auto____7308)];
      if(or__3824__auto____7309) {
        return or__3824__auto____7309
      }else {
        var or__3824__auto____7310 = cljs.core.logic._unify_terms["_"];
        if(or__3824__auto____7310) {
          return or__3824__auto____7310
        }else {
          throw cljs.core.missing_protocol.call(null, "IUnifyTerms.-unify-terms", u);
        }
      }
    }().call(null, u, v, s)
  }
};
cljs.core.logic.IUnifyWithNil = {};
cljs.core.logic._unify_with_nil = function _unify_with_nil(v, u, s) {
  if(function() {
    var and__3822__auto____7315 = v;
    if(and__3822__auto____7315) {
      return v.cljs$core$logic$IUnifyWithNil$_unify_with_nil$arity$3
    }else {
      return and__3822__auto____7315
    }
  }()) {
    return v.cljs$core$logic$IUnifyWithNil$_unify_with_nil$arity$3(v, u, s)
  }else {
    var x__2387__auto____7316 = v == null ? null : v;
    return function() {
      var or__3824__auto____7317 = cljs.core.logic._unify_with_nil[goog.typeOf(x__2387__auto____7316)];
      if(or__3824__auto____7317) {
        return or__3824__auto____7317
      }else {
        var or__3824__auto____7318 = cljs.core.logic._unify_with_nil["_"];
        if(or__3824__auto____7318) {
          return or__3824__auto____7318
        }else {
          throw cljs.core.missing_protocol.call(null, "IUnifyWithNil.-unify-with-nil", v);
        }
      }
    }().call(null, v, u, s)
  }
};
cljs.core.logic.IUnifyWithObject = {};
cljs.core.logic._unify_with_object = function _unify_with_object(v, u, s) {
  if(function() {
    var and__3822__auto____7323 = v;
    if(and__3822__auto____7323) {
      return v.cljs$core$logic$IUnifyWithObject$_unify_with_object$arity$3
    }else {
      return and__3822__auto____7323
    }
  }()) {
    return v.cljs$core$logic$IUnifyWithObject$_unify_with_object$arity$3(v, u, s)
  }else {
    var x__2387__auto____7324 = v == null ? null : v;
    return function() {
      var or__3824__auto____7325 = cljs.core.logic._unify_with_object[goog.typeOf(x__2387__auto____7324)];
      if(or__3824__auto____7325) {
        return or__3824__auto____7325
      }else {
        var or__3824__auto____7326 = cljs.core.logic._unify_with_object["_"];
        if(or__3824__auto____7326) {
          return or__3824__auto____7326
        }else {
          throw cljs.core.missing_protocol.call(null, "IUnifyWithObject.-unify-with-object", v);
        }
      }
    }().call(null, v, u, s)
  }
};
cljs.core.logic.IUnifyWithLVar = {};
cljs.core.logic._unify_with_lvar = function _unify_with_lvar(v, u, s) {
  if(function() {
    var and__3822__auto____7331 = v;
    if(and__3822__auto____7331) {
      return v.cljs$core$logic$IUnifyWithLVar$_unify_with_lvar$arity$3
    }else {
      return and__3822__auto____7331
    }
  }()) {
    return v.cljs$core$logic$IUnifyWithLVar$_unify_with_lvar$arity$3(v, u, s)
  }else {
    var x__2387__auto____7332 = v == null ? null : v;
    return function() {
      var or__3824__auto____7333 = cljs.core.logic._unify_with_lvar[goog.typeOf(x__2387__auto____7332)];
      if(or__3824__auto____7333) {
        return or__3824__auto____7333
      }else {
        var or__3824__auto____7334 = cljs.core.logic._unify_with_lvar["_"];
        if(or__3824__auto____7334) {
          return or__3824__auto____7334
        }else {
          throw cljs.core.missing_protocol.call(null, "IUnifyWithLVar.-unify-with-lvar", v);
        }
      }
    }().call(null, v, u, s)
  }
};
cljs.core.logic.IUnifyWithLSeq = {};
cljs.core.logic._unify_with_lseq = function _unify_with_lseq(v, u, s) {
  if(function() {
    var and__3822__auto____7339 = v;
    if(and__3822__auto____7339) {
      return v.cljs$core$logic$IUnifyWithLSeq$_unify_with_lseq$arity$3
    }else {
      return and__3822__auto____7339
    }
  }()) {
    return v.cljs$core$logic$IUnifyWithLSeq$_unify_with_lseq$arity$3(v, u, s)
  }else {
    var x__2387__auto____7340 = v == null ? null : v;
    return function() {
      var or__3824__auto____7341 = cljs.core.logic._unify_with_lseq[goog.typeOf(x__2387__auto____7340)];
      if(or__3824__auto____7341) {
        return or__3824__auto____7341
      }else {
        var or__3824__auto____7342 = cljs.core.logic._unify_with_lseq["_"];
        if(or__3824__auto____7342) {
          return or__3824__auto____7342
        }else {
          throw cljs.core.missing_protocol.call(null, "IUnifyWithLSeq.-unify-with-lseq", v);
        }
      }
    }().call(null, v, u, s)
  }
};
cljs.core.logic.IUnifyWithSequential = {};
cljs.core.logic._unify_with_seq = function _unify_with_seq(v, u, s) {
  if(function() {
    var and__3822__auto____7347 = v;
    if(and__3822__auto____7347) {
      return v.cljs$core$logic$IUnifyWithSequential$_unify_with_seq$arity$3
    }else {
      return and__3822__auto____7347
    }
  }()) {
    return v.cljs$core$logic$IUnifyWithSequential$_unify_with_seq$arity$3(v, u, s)
  }else {
    var x__2387__auto____7348 = v == null ? null : v;
    return function() {
      var or__3824__auto____7349 = cljs.core.logic._unify_with_seq[goog.typeOf(x__2387__auto____7348)];
      if(or__3824__auto____7349) {
        return or__3824__auto____7349
      }else {
        var or__3824__auto____7350 = cljs.core.logic._unify_with_seq["_"];
        if(or__3824__auto____7350) {
          return or__3824__auto____7350
        }else {
          throw cljs.core.missing_protocol.call(null, "IUnifyWithSequential.-unify-with-seq", v);
        }
      }
    }().call(null, v, u, s)
  }
};
cljs.core.logic.IUnifyWithMap = {};
cljs.core.logic._unify_with_map = function _unify_with_map(v, u, s) {
  if(function() {
    var and__3822__auto____7355 = v;
    if(and__3822__auto____7355) {
      return v.cljs$core$logic$IUnifyWithMap$_unify_with_map$arity$3
    }else {
      return and__3822__auto____7355
    }
  }()) {
    return v.cljs$core$logic$IUnifyWithMap$_unify_with_map$arity$3(v, u, s)
  }else {
    var x__2387__auto____7356 = v == null ? null : v;
    return function() {
      var or__3824__auto____7357 = cljs.core.logic._unify_with_map[goog.typeOf(x__2387__auto____7356)];
      if(or__3824__auto____7357) {
        return or__3824__auto____7357
      }else {
        var or__3824__auto____7358 = cljs.core.logic._unify_with_map["_"];
        if(or__3824__auto____7358) {
          return or__3824__auto____7358
        }else {
          throw cljs.core.missing_protocol.call(null, "IUnifyWithMap.-unify-with-map", v);
        }
      }
    }().call(null, v, u, s)
  }
};
cljs.core.logic.IUnifyWithSet = {};
cljs.core.logic._unify_with_set = function _unify_with_set(v, u, s) {
  if(function() {
    var and__3822__auto____7363 = v;
    if(and__3822__auto____7363) {
      return v.cljs$core$logic$IUnifyWithSet$_unify_with_set$arity$3
    }else {
      return and__3822__auto____7363
    }
  }()) {
    return v.cljs$core$logic$IUnifyWithSet$_unify_with_set$arity$3(v, u, s)
  }else {
    var x__2387__auto____7364 = v == null ? null : v;
    return function() {
      var or__3824__auto____7365 = cljs.core.logic._unify_with_set[goog.typeOf(x__2387__auto____7364)];
      if(or__3824__auto____7365) {
        return or__3824__auto____7365
      }else {
        var or__3824__auto____7366 = cljs.core.logic._unify_with_set["_"];
        if(or__3824__auto____7366) {
          return or__3824__auto____7366
        }else {
          throw cljs.core.missing_protocol.call(null, "IUnifyWithSet.-unify-with-set", v);
        }
      }
    }().call(null, v, u, s)
  }
};
cljs.core.logic.IReifyTerm = {};
cljs.core.logic._reify_term = function _reify_term(v, s) {
  if(function() {
    var and__3822__auto____7371 = v;
    if(and__3822__auto____7371) {
      return v.cljs$core$logic$IReifyTerm$_reify_term$arity$2
    }else {
      return and__3822__auto____7371
    }
  }()) {
    return v.cljs$core$logic$IReifyTerm$_reify_term$arity$2(v, s)
  }else {
    var x__2387__auto____7372 = v == null ? null : v;
    return function() {
      var or__3824__auto____7373 = cljs.core.logic._reify_term[goog.typeOf(x__2387__auto____7372)];
      if(or__3824__auto____7373) {
        return or__3824__auto____7373
      }else {
        var or__3824__auto____7374 = cljs.core.logic._reify_term["_"];
        if(or__3824__auto____7374) {
          return or__3824__auto____7374
        }else {
          throw cljs.core.missing_protocol.call(null, "IReifyTerm.-reify-term", v);
        }
      }
    }().call(null, v, s)
  }
};
cljs.core.logic.IWalkTerm = {};
cljs.core.logic._walk_term = function _walk_term(v, s) {
  if(function() {
    var and__3822__auto____7379 = v;
    if(and__3822__auto____7379) {
      return v.cljs$core$logic$IWalkTerm$_walk_term$arity$2
    }else {
      return and__3822__auto____7379
    }
  }()) {
    return v.cljs$core$logic$IWalkTerm$_walk_term$arity$2(v, s)
  }else {
    var x__2387__auto____7380 = v == null ? null : v;
    return function() {
      var or__3824__auto____7381 = cljs.core.logic._walk_term[goog.typeOf(x__2387__auto____7380)];
      if(or__3824__auto____7381) {
        return or__3824__auto____7381
      }else {
        var or__3824__auto____7382 = cljs.core.logic._walk_term["_"];
        if(or__3824__auto____7382) {
          return or__3824__auto____7382
        }else {
          throw cljs.core.missing_protocol.call(null, "IWalkTerm.-walk-term", v);
        }
      }
    }().call(null, v, s)
  }
};
cljs.core.logic.IOccursCheckTerm = {};
cljs.core.logic._occurs_check_term = function _occurs_check_term(v, x, s) {
  if(function() {
    var and__3822__auto____7387 = v;
    if(and__3822__auto____7387) {
      return v.cljs$core$logic$IOccursCheckTerm$_occurs_check_term$arity$3
    }else {
      return and__3822__auto____7387
    }
  }()) {
    return v.cljs$core$logic$IOccursCheckTerm$_occurs_check_term$arity$3(v, x, s)
  }else {
    var x__2387__auto____7388 = v == null ? null : v;
    return function() {
      var or__3824__auto____7389 = cljs.core.logic._occurs_check_term[goog.typeOf(x__2387__auto____7388)];
      if(or__3824__auto____7389) {
        return or__3824__auto____7389
      }else {
        var or__3824__auto____7390 = cljs.core.logic._occurs_check_term["_"];
        if(or__3824__auto____7390) {
          return or__3824__auto____7390
        }else {
          throw cljs.core.missing_protocol.call(null, "IOccursCheckTerm.-occurs-check-term", v);
        }
      }
    }().call(null, v, x, s)
  }
};
cljs.core.logic.IBuildTerm = {};
cljs.core.logic._build_term = function _build_term(u, s) {
  if(function() {
    var and__3822__auto____7395 = u;
    if(and__3822__auto____7395) {
      return u.cljs$core$logic$IBuildTerm$_build_term$arity$2
    }else {
      return and__3822__auto____7395
    }
  }()) {
    return u.cljs$core$logic$IBuildTerm$_build_term$arity$2(u, s)
  }else {
    var x__2387__auto____7396 = u == null ? null : u;
    return function() {
      var or__3824__auto____7397 = cljs.core.logic._build_term[goog.typeOf(x__2387__auto____7396)];
      if(or__3824__auto____7397) {
        return or__3824__auto____7397
      }else {
        var or__3824__auto____7398 = cljs.core.logic._build_term["_"];
        if(or__3824__auto____7398) {
          return or__3824__auto____7398
        }else {
          throw cljs.core.missing_protocol.call(null, "IBuildTerm.-build-term", u);
        }
      }
    }().call(null, u, s)
  }
};
cljs.core.logic.IBind = {};
cljs.core.logic._bind = function _bind(this$, g) {
  if(function() {
    var and__3822__auto____7403 = this$;
    if(and__3822__auto____7403) {
      return this$.cljs$core$logic$IBind$_bind$arity$2
    }else {
      return and__3822__auto____7403
    }
  }()) {
    return this$.cljs$core$logic$IBind$_bind$arity$2(this$, g)
  }else {
    var x__2387__auto____7404 = this$ == null ? null : this$;
    return function() {
      var or__3824__auto____7405 = cljs.core.logic._bind[goog.typeOf(x__2387__auto____7404)];
      if(or__3824__auto____7405) {
        return or__3824__auto____7405
      }else {
        var or__3824__auto____7406 = cljs.core.logic._bind["_"];
        if(or__3824__auto____7406) {
          return or__3824__auto____7406
        }else {
          throw cljs.core.missing_protocol.call(null, "IBind.-bind", this$);
        }
      }
    }().call(null, this$, g)
  }
};
cljs.core.logic.IMPlus = {};
cljs.core.logic._mplus = function _mplus(a, f) {
  if(function() {
    var and__3822__auto____7411 = a;
    if(and__3822__auto____7411) {
      return a.cljs$core$logic$IMPlus$_mplus$arity$2
    }else {
      return and__3822__auto____7411
    }
  }()) {
    return a.cljs$core$logic$IMPlus$_mplus$arity$2(a, f)
  }else {
    var x__2387__auto____7412 = a == null ? null : a;
    return function() {
      var or__3824__auto____7413 = cljs.core.logic._mplus[goog.typeOf(x__2387__auto____7412)];
      if(or__3824__auto____7413) {
        return or__3824__auto____7413
      }else {
        var or__3824__auto____7414 = cljs.core.logic._mplus["_"];
        if(or__3824__auto____7414) {
          return or__3824__auto____7414
        }else {
          throw cljs.core.missing_protocol.call(null, "IMPlus.-mplus", a);
        }
      }
    }().call(null, a, f)
  }
};
cljs.core.logic.ITake = {};
cljs.core.logic._take_STAR_ = function _take_STAR_(a) {
  if(function() {
    var and__3822__auto____7419 = a;
    if(and__3822__auto____7419) {
      return a.cljs$core$logic$ITake$_take_STAR_$arity$1
    }else {
      return and__3822__auto____7419
    }
  }()) {
    return a.cljs$core$logic$ITake$_take_STAR_$arity$1(a)
  }else {
    var x__2387__auto____7420 = a == null ? null : a;
    return function() {
      var or__3824__auto____7421 = cljs.core.logic._take_STAR_[goog.typeOf(x__2387__auto____7420)];
      if(or__3824__auto____7421) {
        return or__3824__auto____7421
      }else {
        var or__3824__auto____7422 = cljs.core.logic._take_STAR_["_"];
        if(or__3824__auto____7422) {
          return or__3824__auto____7422
        }else {
          throw cljs.core.missing_protocol.call(null, "ITake.-take*", a);
        }
      }
    }().call(null, a)
  }
};
cljs.core.logic.IPair = {};
cljs.core.logic._lhs = function _lhs(this$) {
  if(function() {
    var and__3822__auto____7427 = this$;
    if(and__3822__auto____7427) {
      return this$.cljs$core$logic$IPair$_lhs$arity$1
    }else {
      return and__3822__auto____7427
    }
  }()) {
    return this$.cljs$core$logic$IPair$_lhs$arity$1(this$)
  }else {
    var x__2387__auto____7428 = this$ == null ? null : this$;
    return function() {
      var or__3824__auto____7429 = cljs.core.logic._lhs[goog.typeOf(x__2387__auto____7428)];
      if(or__3824__auto____7429) {
        return or__3824__auto____7429
      }else {
        var or__3824__auto____7430 = cljs.core.logic._lhs["_"];
        if(or__3824__auto____7430) {
          return or__3824__auto____7430
        }else {
          throw cljs.core.missing_protocol.call(null, "IPair.-lhs", this$);
        }
      }
    }().call(null, this$)
  }
};
cljs.core.logic._rhs = function _rhs(this$) {
  if(function() {
    var and__3822__auto____7435 = this$;
    if(and__3822__auto____7435) {
      return this$.cljs$core$logic$IPair$_rhs$arity$1
    }else {
      return and__3822__auto____7435
    }
  }()) {
    return this$.cljs$core$logic$IPair$_rhs$arity$1(this$)
  }else {
    var x__2387__auto____7436 = this$ == null ? null : this$;
    return function() {
      var or__3824__auto____7437 = cljs.core.logic._rhs[goog.typeOf(x__2387__auto____7436)];
      if(or__3824__auto____7437) {
        return or__3824__auto____7437
      }else {
        var or__3824__auto____7438 = cljs.core.logic._rhs["_"];
        if(or__3824__auto____7438) {
          return or__3824__auto____7438
        }else {
          throw cljs.core.missing_protocol.call(null, "IPair.-rhs", this$);
        }
      }
    }().call(null, this$)
  }
};
cljs.core.logic.Pair = function(lhs, rhs) {
  this.lhs = lhs;
  this.rhs = rhs;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 538968082
};
cljs.core.logic.Pair.cljs$lang$type = true;
cljs.core.logic.Pair.cljs$lang$ctorPrSeq = function(this__2333__auto__) {
  return cljs.core.list.call(null, "cljs.core.logic/Pair")
};
cljs.core.logic.Pair.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, options) {
  var this__7439 = this;
  return cljs.core.list.call(null, "(", [cljs.core.str(this__7439.lhs)].join(""), " . ", [cljs.core.str(this__7439.rhs)].join(""), ")")
};
cljs.core.logic.Pair.prototype.cljs$core$logic$IPair$ = true;
cljs.core.logic.Pair.prototype.cljs$core$logic$IPair$_lhs$arity$1 = function(_) {
  var this__7440 = this;
  return this__7440.lhs
};
cljs.core.logic.Pair.prototype.cljs$core$logic$IPair$_rhs$arity$1 = function(_) {
  var this__7441 = this;
  return this__7441.rhs
};
cljs.core.logic.Pair.prototype.cljs$core$IIndexed$_nth$arity$2 = function(_, i) {
  var this__7442 = this;
  var pred__7443__7446 = cljs.core._EQ_;
  var expr__7444__7447 = i;
  if(pred__7443__7446.call(null, 0, expr__7444__7447)) {
    return this__7442.lhs
  }else {
    if(pred__7443__7446.call(null, 1, expr__7444__7447)) {
      return this__7442.rhs
    }else {
      throw new Error("Index out of bounds");
    }
  }
};
cljs.core.logic.Pair.prototype.cljs$core$IIndexed$_nth$arity$3 = function(_, i, not_found) {
  var this__7448 = this;
  var pred__7449__7452 = cljs.core._EQ_;
  var expr__7450__7453 = i;
  if(pred__7449__7452.call(null, 0, expr__7450__7453)) {
    return this__7448.lhs
  }else {
    if(pred__7449__7452.call(null, 1, expr__7450__7453)) {
      return this__7448.rhs
    }else {
      return not_found
    }
  }
};
cljs.core.logic.Pair.prototype.cljs$core$ICounted$_count$arity$1 = function(_) {
  var this__7454 = this;
  return 2
};
cljs.core.logic.Pair.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(this$, other) {
  var this__7455 = this;
  var and__3822__auto____7456 = cljs.core._EQ_.call(null, this__7455.lhs, other.lhs);
  if(and__3822__auto____7456) {
    return cljs.core._EQ_.call(null, this__7455.rhs, other.rhs)
  }else {
    return and__3822__auto____7456
  }
};
cljs.core.logic.Pair;
cljs.core.logic.pair = function pair(lhs, rhs) {
  return new cljs.core.logic.Pair(lhs, rhs)
};
cljs.core.logic.ISubstitutions = {};
cljs.core.logic._occurs_check = function _occurs_check(this$, u, v) {
  if(function() {
    var and__3822__auto____7461 = this$;
    if(and__3822__auto____7461) {
      return this$.cljs$core$logic$ISubstitutions$_occurs_check$arity$3
    }else {
      return and__3822__auto____7461
    }
  }()) {
    return this$.cljs$core$logic$ISubstitutions$_occurs_check$arity$3(this$, u, v)
  }else {
    var x__2387__auto____7462 = this$ == null ? null : this$;
    return function() {
      var or__3824__auto____7463 = cljs.core.logic._occurs_check[goog.typeOf(x__2387__auto____7462)];
      if(or__3824__auto____7463) {
        return or__3824__auto____7463
      }else {
        var or__3824__auto____7464 = cljs.core.logic._occurs_check["_"];
        if(or__3824__auto____7464) {
          return or__3824__auto____7464
        }else {
          throw cljs.core.missing_protocol.call(null, "ISubstitutions.-occurs-check", this$);
        }
      }
    }().call(null, this$, u, v)
  }
};
cljs.core.logic._ext = function _ext(this$, u, v) {
  if(function() {
    var and__3822__auto____7469 = this$;
    if(and__3822__auto____7469) {
      return this$.cljs$core$logic$ISubstitutions$_ext$arity$3
    }else {
      return and__3822__auto____7469
    }
  }()) {
    return this$.cljs$core$logic$ISubstitutions$_ext$arity$3(this$, u, v)
  }else {
    var x__2387__auto____7470 = this$ == null ? null : this$;
    return function() {
      var or__3824__auto____7471 = cljs.core.logic._ext[goog.typeOf(x__2387__auto____7470)];
      if(or__3824__auto____7471) {
        return or__3824__auto____7471
      }else {
        var or__3824__auto____7472 = cljs.core.logic._ext["_"];
        if(or__3824__auto____7472) {
          return or__3824__auto____7472
        }else {
          throw cljs.core.missing_protocol.call(null, "ISubstitutions.-ext", this$);
        }
      }
    }().call(null, this$, u, v)
  }
};
cljs.core.logic._ext_no_check = function _ext_no_check(this$, u, v) {
  if(function() {
    var and__3822__auto____7477 = this$;
    if(and__3822__auto____7477) {
      return this$.cljs$core$logic$ISubstitutions$_ext_no_check$arity$3
    }else {
      return and__3822__auto____7477
    }
  }()) {
    return this$.cljs$core$logic$ISubstitutions$_ext_no_check$arity$3(this$, u, v)
  }else {
    var x__2387__auto____7478 = this$ == null ? null : this$;
    return function() {
      var or__3824__auto____7479 = cljs.core.logic._ext_no_check[goog.typeOf(x__2387__auto____7478)];
      if(or__3824__auto____7479) {
        return or__3824__auto____7479
      }else {
        var or__3824__auto____7480 = cljs.core.logic._ext_no_check["_"];
        if(or__3824__auto____7480) {
          return or__3824__auto____7480
        }else {
          throw cljs.core.missing_protocol.call(null, "ISubstitutions.-ext-no-check", this$);
        }
      }
    }().call(null, this$, u, v)
  }
};
cljs.core.logic._walk = function _walk(this$, v) {
  if(function() {
    var and__3822__auto____7485 = this$;
    if(and__3822__auto____7485) {
      return this$.cljs$core$logic$ISubstitutions$_walk$arity$2
    }else {
      return and__3822__auto____7485
    }
  }()) {
    return this$.cljs$core$logic$ISubstitutions$_walk$arity$2(this$, v)
  }else {
    var x__2387__auto____7486 = this$ == null ? null : this$;
    return function() {
      var or__3824__auto____7487 = cljs.core.logic._walk[goog.typeOf(x__2387__auto____7486)];
      if(or__3824__auto____7487) {
        return or__3824__auto____7487
      }else {
        var or__3824__auto____7488 = cljs.core.logic._walk["_"];
        if(or__3824__auto____7488) {
          return or__3824__auto____7488
        }else {
          throw cljs.core.missing_protocol.call(null, "ISubstitutions.-walk", this$);
        }
      }
    }().call(null, this$, v)
  }
};
cljs.core.logic._walk_STAR_ = function _walk_STAR_(this$, v) {
  if(function() {
    var and__3822__auto____7493 = this$;
    if(and__3822__auto____7493) {
      return this$.cljs$core$logic$ISubstitutions$_walk_STAR_$arity$2
    }else {
      return and__3822__auto____7493
    }
  }()) {
    return this$.cljs$core$logic$ISubstitutions$_walk_STAR_$arity$2(this$, v)
  }else {
    var x__2387__auto____7494 = this$ == null ? null : this$;
    return function() {
      var or__3824__auto____7495 = cljs.core.logic._walk_STAR_[goog.typeOf(x__2387__auto____7494)];
      if(or__3824__auto____7495) {
        return or__3824__auto____7495
      }else {
        var or__3824__auto____7496 = cljs.core.logic._walk_STAR_["_"];
        if(or__3824__auto____7496) {
          return or__3824__auto____7496
        }else {
          throw cljs.core.missing_protocol.call(null, "ISubstitutions.-walk*", this$);
        }
      }
    }().call(null, this$, v)
  }
};
cljs.core.logic._unify = function _unify(this$, u, v) {
  if(function() {
    var and__3822__auto____7501 = this$;
    if(and__3822__auto____7501) {
      return this$.cljs$core$logic$ISubstitutions$_unify$arity$3
    }else {
      return and__3822__auto____7501
    }
  }()) {
    return this$.cljs$core$logic$ISubstitutions$_unify$arity$3(this$, u, v)
  }else {
    var x__2387__auto____7502 = this$ == null ? null : this$;
    return function() {
      var or__3824__auto____7503 = cljs.core.logic._unify[goog.typeOf(x__2387__auto____7502)];
      if(or__3824__auto____7503) {
        return or__3824__auto____7503
      }else {
        var or__3824__auto____7504 = cljs.core.logic._unify["_"];
        if(or__3824__auto____7504) {
          return or__3824__auto____7504
        }else {
          throw cljs.core.missing_protocol.call(null, "ISubstitutions.-unify", this$);
        }
      }
    }().call(null, this$, u, v)
  }
};
cljs.core.logic._reify_lvar_name = function _reify_lvar_name(_) {
  if(function() {
    var and__3822__auto____7509 = _;
    if(and__3822__auto____7509) {
      return _.cljs$core$logic$ISubstitutions$_reify_lvar_name$arity$1
    }else {
      return and__3822__auto____7509
    }
  }()) {
    return _.cljs$core$logic$ISubstitutions$_reify_lvar_name$arity$1(_)
  }else {
    var x__2387__auto____7510 = _ == null ? null : _;
    return function() {
      var or__3824__auto____7511 = cljs.core.logic._reify_lvar_name[goog.typeOf(x__2387__auto____7510)];
      if(or__3824__auto____7511) {
        return or__3824__auto____7511
      }else {
        var or__3824__auto____7512 = cljs.core.logic._reify_lvar_name["_"];
        if(or__3824__auto____7512) {
          return or__3824__auto____7512
        }else {
          throw cljs.core.missing_protocol.call(null, "ISubstitutions.-reify-lvar-name", _);
        }
      }
    }().call(null, _)
  }
};
cljs.core.logic._reify_STAR_ = function _reify_STAR_(this$, v) {
  if(function() {
    var and__3822__auto____7517 = this$;
    if(and__3822__auto____7517) {
      return this$.cljs$core$logic$ISubstitutions$_reify_STAR_$arity$2
    }else {
      return and__3822__auto____7517
    }
  }()) {
    return this$.cljs$core$logic$ISubstitutions$_reify_STAR_$arity$2(this$, v)
  }else {
    var x__2387__auto____7518 = this$ == null ? null : this$;
    return function() {
      var or__3824__auto____7519 = cljs.core.logic._reify_STAR_[goog.typeOf(x__2387__auto____7518)];
      if(or__3824__auto____7519) {
        return or__3824__auto____7519
      }else {
        var or__3824__auto____7520 = cljs.core.logic._reify_STAR_["_"];
        if(or__3824__auto____7520) {
          return or__3824__auto____7520
        }else {
          throw cljs.core.missing_protocol.call(null, "ISubstitutions.-reify*", this$);
        }
      }
    }().call(null, this$, v)
  }
};
cljs.core.logic._reify = function _reify(this$, v) {
  if(function() {
    var and__3822__auto____7525 = this$;
    if(and__3822__auto____7525) {
      return this$.cljs$core$logic$ISubstitutions$_reify$arity$2
    }else {
      return and__3822__auto____7525
    }
  }()) {
    return this$.cljs$core$logic$ISubstitutions$_reify$arity$2(this$, v)
  }else {
    var x__2387__auto____7526 = this$ == null ? null : this$;
    return function() {
      var or__3824__auto____7527 = cljs.core.logic._reify[goog.typeOf(x__2387__auto____7526)];
      if(or__3824__auto____7527) {
        return or__3824__auto____7527
      }else {
        var or__3824__auto____7528 = cljs.core.logic._reify["_"];
        if(or__3824__auto____7528) {
          return or__3824__auto____7528
        }else {
          throw cljs.core.missing_protocol.call(null, "ISubstitutions.-reify", this$);
        }
      }
    }().call(null, this$, v)
  }
};
cljs.core.logic.not_found = {};
cljs.core.logic.assq = function assq(k, xs) {
  var xs__7532 = cljs.core._seq.call(null, xs);
  while(true) {
    if(xs__7532 == null) {
      return cljs.core.logic.not_found
    }else {
      var x__7533 = cljs.core._first.call(null, xs__7532);
      var lhs__7534 = x__7533.lhs;
      if(k === lhs__7534) {
        return x__7533.rhs
      }else {
        var G__7535 = cljs.core._next.call(null, xs__7532);
        xs__7532 = G__7535;
        continue
      }
    }
    break
  }
};
cljs.core.logic.Substitutions = function(s) {
  this.s = s;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 538968064
};
cljs.core.logic.Substitutions.cljs$lang$type = true;
cljs.core.logic.Substitutions.cljs$lang$ctorPrSeq = function(this__2333__auto__) {
  return cljs.core.list.call(null, "cljs.core.logic/Substitutions")
};
cljs.core.logic.Substitutions.prototype.cljs$core$logic$ITake$ = true;
cljs.core.logic.Substitutions.prototype.cljs$core$logic$ITake$_take_STAR_$arity$1 = function(this$) {
  var this__7536 = this;
  return this$
};
cljs.core.logic.Substitutions.prototype.cljs$core$logic$IMPlus$ = true;
cljs.core.logic.Substitutions.prototype.cljs$core$logic$IMPlus$_mplus$arity$2 = function(this$, f) {
  var this__7537 = this;
  return cljs.core.logic.choice.call(null, this$, f)
};
cljs.core.logic.Substitutions.prototype.cljs$core$logic$IBind$ = true;
cljs.core.logic.Substitutions.prototype.cljs$core$logic$IBind$_bind$arity$2 = function(this$, g) {
  var this__7538 = this;
  return g.call(null, this$)
};
cljs.core.logic.Substitutions.prototype.cljs$core$logic$ISubstitutions$ = true;
cljs.core.logic.Substitutions.prototype.cljs$core$logic$ISubstitutions$_walk$arity$2 = function(this$, v) {
  var this__7539 = this;
  if(cljs.core.logic.lvar_QMARK_.call(null, v)) {
    var rhs__7540 = cljs.core.logic.assq.call(null, v, this__7539.s);
    var vp__7541 = this$.cljs$core$logic$ISubstitutions$_walk$arity$2(this$, rhs__7540);
    if(cljs.core.logic.not_found === vp__7541) {
      return v
    }else {
      return vp__7541
    }
  }else {
    if("\ufdd0'else") {
      return v
    }else {
      return null
    }
  }
};
cljs.core.logic.Substitutions.prototype.cljs$core$logic$ISubstitutions$_reify_STAR_$arity$2 = function(this$, v) {
  var this__7542 = this;
  var v__7543 = this$.cljs$core$logic$ISubstitutions$_walk$arity$2(this$, v);
  return cljs.core.logic._reify_term.call(null, v__7543, this$)
};
cljs.core.logic.Substitutions.prototype.cljs$core$logic$ISubstitutions$_walk_STAR_$arity$2 = function(this$, v) {
  var this__7544 = this;
  var v__7545 = this$.cljs$core$logic$ISubstitutions$_walk$arity$2(this$, v);
  return cljs.core.logic._walk_term.call(null, v__7545, this$)
};
cljs.core.logic.Substitutions.prototype.cljs$core$logic$ISubstitutions$_reify_lvar_name$arity$1 = function(this$) {
  var this__7546 = this;
  return cljs.core.symbol.call(null, [cljs.core.str("_."), cljs.core.str(cljs.core.count.call(null, this__7546.s))].join(""))
};
cljs.core.logic.Substitutions.prototype.cljs$core$logic$ISubstitutions$_reify$arity$2 = function(this$, v) {
  var this__7547 = this;
  var v__7548 = this$.cljs$core$logic$ISubstitutions$_walk_STAR_$arity$2(this$, v);
  return cljs.core.logic._walk_STAR_.call(null, cljs.core.logic._reify_STAR_.call(null, cljs.core.logic.empty_s, v__7548), v__7548)
};
cljs.core.logic.Substitutions.prototype.cljs$core$logic$ISubstitutions$_unify$arity$3 = function(this$, u, v) {
  var this__7549 = this;
  if(u === v) {
    return this$
  }else {
    var u__7550 = this$.cljs$core$logic$ISubstitutions$_walk$arity$2(this$, u);
    var v__7551 = this$.cljs$core$logic$ISubstitutions$_walk$arity$2(this$, v);
    if(u__7550 === v__7551) {
      return this$
    }else {
      return cljs.core.logic._unify_terms.call(null, u__7550, v__7551, this$)
    }
  }
};
cljs.core.logic.Substitutions.prototype.cljs$core$logic$ISubstitutions$_ext$arity$3 = function(this$, u, v) {
  var this__7552 = this;
  if(cljs.core.truth_(function() {
    var and__3822__auto____7553 = cljs.core.logic._STAR_occurs_check_STAR_;
    if(cljs.core.truth_(and__3822__auto____7553)) {
      return this$.cljs$core$logic$ISubstitutions$_occurs_check$arity$3(this$, u, v)
    }else {
      return and__3822__auto____7553
    }
  }())) {
    return null
  }else {
    return this$.cljs$core$logic$ISubstitutions$_ext_no_check$arity$3(this$, u, v)
  }
};
cljs.core.logic.Substitutions.prototype.cljs$core$logic$ISubstitutions$_ext_no_check$arity$3 = function(this$, u, v) {
  var this__7554 = this;
  return new cljs.core.logic.Substitutions(cljs.core.conj.call(null, this__7554.s, new cljs.core.logic.Pair(u, v)))
};
cljs.core.logic.Substitutions.prototype.cljs$core$logic$ISubstitutions$_occurs_check$arity$3 = function(this$, u, v) {
  var this__7555 = this;
  var v__7556 = this$.cljs$core$logic$ISubstitutions$_walk$arity$2(this$, v);
  return cljs.core.logic._occurs_check_term.call(null, v__7556, u, this$)
};
cljs.core.logic.Substitutions.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(this$, opts) {
  var this__7557 = this;
  return cljs.core._pr_seq.call(null, this__7557.s, opts)
};
cljs.core.logic.Substitutions.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(this$, o) {
  var this__7558 = this;
  var or__3824__auto____7559 = this$ === o;
  if(or__3824__auto____7559) {
    return or__3824__auto____7559
  }else {
    var and__3822__auto____7560 = cljs.core.instance_QMARK_.call(null, cljs.core.logic.Substitutions, o);
    if(and__3822__auto____7560) {
      return cljs.core._EQ_.call(null, this__7558.s, o.s)
    }else {
      return and__3822__auto____7560
    }
  }
};
cljs.core.logic.Substitutions;
cljs.core.logic.make_s = function make_s(s) {
  return new cljs.core.logic.Substitutions(s)
};
cljs.core.logic.empty_s = cljs.core.logic.make_s.call(null, cljs.core.List.EMPTY);
cljs.core.logic.subst_QMARK_ = function subst_QMARK_(x) {
  return cljs.core.instance_QMARK_.call(null, cljs.core.logic.Substitutions, x)
};
cljs.core.logic.to_s = function to_s(v) {
  var s__7572 = cljs.core.reduce.call(null, function(l, p__7567) {
    var vec__7568__7569 = p__7567;
    var k__7570 = cljs.core.nth.call(null, vec__7568__7569, 0, null);
    var v__7571 = cljs.core.nth.call(null, vec__7568__7569, 1, null);
    return cljs.core.cons.call(null, cljs.core.logic.pair.call(null, k__7570, v__7571), l)
  }, cljs.core.List.EMPTY, v);
  return cljs.core.logic.make_s.call(null, s__7572)
};
cljs.core.logic.LVar = function(name, meta) {
  this.name = name;
  this.meta = meta;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 543555584
};
cljs.core.logic.LVar.cljs$lang$type = true;
cljs.core.logic.LVar.cljs$lang$ctorPrSeq = function(this__2333__auto__) {
  return cljs.core.list.call(null, "cljs.core.logic/LVar")
};
cljs.core.logic.LVar.prototype.cljs$core$IHash$_hash$arity$1 = function(this$) {
  var this__7573 = this;
  return cljs.core._hash.call(null, this__7573.name)
};
cljs.core.logic.LVar.prototype.cljs$core$logic$IUnifyWithLVar$ = true;
cljs.core.logic.LVar.prototype.cljs$core$logic$IUnifyWithLVar$_unify_with_lvar$arity$3 = function(v, u, s) {
  var this__7574 = this;
  return cljs.core.logic._ext_no_check.call(null, s, u, v)
};
cljs.core.logic.LVar.prototype.cljs$core$logic$IUnifyWithSequential$ = true;
cljs.core.logic.LVar.prototype.cljs$core$logic$IUnifyWithSequential$_unify_with_seq$arity$3 = function(v, u, s) {
  var this__7575 = this;
  return cljs.core.logic._ext.call(null, s, v, u)
};
cljs.core.logic.LVar.prototype.cljs$core$logic$IReifyTerm$ = true;
cljs.core.logic.LVar.prototype.cljs$core$logic$IReifyTerm$_reify_term$arity$2 = function(v, s) {
  var this__7576 = this;
  return cljs.core.logic._ext.call(null, s, v, cljs.core.logic._reify_lvar_name.call(null, s))
};
cljs.core.logic.LVar.prototype.cljs$core$logic$IUnifyTerms$ = true;
cljs.core.logic.LVar.prototype.cljs$core$logic$IUnifyTerms$_unify_terms$arity$3 = function(u, v, s) {
  var this__7577 = this;
  return cljs.core.logic._unify_with_lvar.call(null, v, u, s)
};
cljs.core.logic.LVar.prototype.cljs$core$logic$IUnifyWithNil$ = true;
cljs.core.logic.LVar.prototype.cljs$core$logic$IUnifyWithNil$_unify_with_nil$arity$3 = function(v, u, s) {
  var this__7578 = this;
  return cljs.core.logic._ext_no_check.call(null, s, v, u)
};
cljs.core.logic.LVar.prototype.cljs$core$logic$IUnifyWithMap$ = true;
cljs.core.logic.LVar.prototype.cljs$core$logic$IUnifyWithMap$_unify_with_map$arity$3 = function(v, u, s) {
  var this__7579 = this;
  return cljs.core.logic._ext.call(null, s, v, u)
};
cljs.core.logic.LVar.prototype.cljs$core$logic$IOccursCheckTerm$ = true;
cljs.core.logic.LVar.prototype.cljs$core$logic$IOccursCheckTerm$_occurs_check_term$arity$3 = function(v, x, s) {
  var this__7580 = this;
  return cljs.core._EQ_.call(null, cljs.core.logic._walk.call(null, s, v), x)
};
cljs.core.logic.LVar.prototype.toString = function() {
  var this__7581 = this;
  var this__7582 = this;
  return cljs.core.pr_str.call(null, this__7582)
};
cljs.core.logic.LVar.prototype.cljs$core$logic$IUnifyWithSet$ = true;
cljs.core.logic.LVar.prototype.cljs$core$logic$IUnifyWithSet$_unify_with_set$arity$3 = function(v, u, s) {
  var this__7583 = this;
  return cljs.core.logic._ext.call(null, s, v, u)
};
cljs.core.logic.LVar.prototype.cljs$core$logic$IWalkTerm$ = true;
cljs.core.logic.LVar.prototype.cljs$core$logic$IWalkTerm$_walk_term$arity$2 = function(v, s) {
  var this__7584 = this;
  return v
};
cljs.core.logic.LVar.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(_, opts) {
  var this__7585 = this;
  return cljs.core.list.call(null, "<lvar:", [cljs.core.str(this__7585.name)].join(""), ">")
};
cljs.core.logic.LVar.prototype.cljs$core$logic$IUnifyWithObject$ = true;
cljs.core.logic.LVar.prototype.cljs$core$logic$IUnifyWithObject$_unify_with_object$arity$3 = function(v, u, s) {
  var this__7586 = this;
  return cljs.core.logic._ext.call(null, s, v, u)
};
cljs.core.logic.LVar.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(this$, o) {
  var this__7587 = this;
  var and__3822__auto____7588 = cljs.core.instance_QMARK_.call(null, cljs.core.logic.LVar, o);
  if(and__3822__auto____7588) {
    var o__7589 = o;
    return this__7587.name === o__7589.name
  }else {
    return and__3822__auto____7588
  }
};
cljs.core.logic.LVar.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(this$, new_meta) {
  var this__7590 = this;
  return new cljs.core.logic.LVar(this__7590.name, this__7590.meta)
};
cljs.core.logic.LVar.prototype.cljs$core$IMeta$_meta$arity$1 = function(this$) {
  var this__7591 = this;
  return this__7591.meta
};
cljs.core.logic.LVar.prototype.cljs$core$logic$IUnifyWithLSeq$ = true;
cljs.core.logic.LVar.prototype.cljs$core$logic$IUnifyWithLSeq$_unify_with_lseq$arity$3 = function(v, u, s) {
  var this__7592 = this;
  return cljs.core.logic._ext.call(null, s, v, u)
};
cljs.core.logic.LVar;
cljs.core.logic.lvar_sym_counter = cljs.core.atom.call(null, 0);
cljs.core.logic.lvar = function() {
  var lvar = null;
  var lvar__0 = function() {
    return lvar.call(null, "\ufdd1'gen")
  };
  var lvar__1 = function(name) {
    var name__7594 = name.substring(2, name.length) + "_" + cljs.core.swap_BANG_.call(null, cljs.core.logic.lvar_sym_counter, cljs.core.inc);
    return new cljs.core.logic.LVar(name__7594, null)
  };
  lvar = function(name) {
    switch(arguments.length) {
      case 0:
        return lvar__0.call(this);
      case 1:
        return lvar__1.call(this, name)
    }
    throw"Invalid arity: " + arguments.length;
  };
  lvar.cljs$lang$arity$0 = lvar__0;
  lvar.cljs$lang$arity$1 = lvar__1;
  return lvar
}();
cljs.core.logic.lvar_QMARK_ = function lvar_QMARK_(x) {
  return cljs.core.instance_QMARK_.call(null, cljs.core.logic.LVar, x)
};
cljs.core.logic.LConsSeq = {};
cljs.core.logic._lfirst = function _lfirst(this$) {
  if(function() {
    var and__3822__auto____7599 = this$;
    if(and__3822__auto____7599) {
      return this$.cljs$core$logic$LConsSeq$_lfirst$arity$1
    }else {
      return and__3822__auto____7599
    }
  }()) {
    return this$.cljs$core$logic$LConsSeq$_lfirst$arity$1(this$)
  }else {
    var x__2387__auto____7600 = this$ == null ? null : this$;
    return function() {
      var or__3824__auto____7601 = cljs.core.logic._lfirst[goog.typeOf(x__2387__auto____7600)];
      if(or__3824__auto____7601) {
        return or__3824__auto____7601
      }else {
        var or__3824__auto____7602 = cljs.core.logic._lfirst["_"];
        if(or__3824__auto____7602) {
          return or__3824__auto____7602
        }else {
          throw cljs.core.missing_protocol.call(null, "LConsSeq.-lfirst", this$);
        }
      }
    }().call(null, this$)
  }
};
cljs.core.logic._lnext = function _lnext(this$) {
  if(function() {
    var and__3822__auto____7607 = this$;
    if(and__3822__auto____7607) {
      return this$.cljs$core$logic$LConsSeq$_lnext$arity$1
    }else {
      return and__3822__auto____7607
    }
  }()) {
    return this$.cljs$core$logic$LConsSeq$_lnext$arity$1(this$)
  }else {
    var x__2387__auto____7608 = this$ == null ? null : this$;
    return function() {
      var or__3824__auto____7609 = cljs.core.logic._lnext[goog.typeOf(x__2387__auto____7608)];
      if(or__3824__auto____7609) {
        return or__3824__auto____7609
      }else {
        var or__3824__auto____7610 = cljs.core.logic._lnext["_"];
        if(or__3824__auto____7610) {
          return or__3824__auto____7610
        }else {
          throw cljs.core.missing_protocol.call(null, "LConsSeq.-lnext", this$);
        }
      }
    }().call(null, this$)
  }
};
cljs.core.logic.lcons_pr_seq = function lcons_pr_seq(x) {
  if(cljs.core.logic.lcons_QMARK_.call(null, x)) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, cljs.core.logic._lfirst.call(null, x), lcons_pr_seq.call(null, cljs.core.logic._lnext.call(null, x)))
    }, null)
  }else {
    if("\ufdd0'else") {
      return cljs.core.list.call(null, "\ufdd1'.", x)
    }else {
      return null
    }
  }
};
cljs.core.logic.LCons = function(a, d, meta) {
  this.a = a;
  this.d = d;
  this.meta = meta;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 539361280
};
cljs.core.logic.LCons.cljs$lang$type = true;
cljs.core.logic.LCons.cljs$lang$ctorPrSeq = function(this__2333__auto__) {
  return cljs.core.list.call(null, "cljs.core.logic/LCons")
};
cljs.core.logic.LCons.prototype.cljs$core$logic$IUnifyWithSequential$ = true;
cljs.core.logic.LCons.prototype.cljs$core$logic$IUnifyWithSequential$_unify_with_seq$arity$3 = function(v, u, s) {
  var this__7611 = this;
  return cljs.core.logic._unify_with_lseq.call(null, u, v, s)
};
cljs.core.logic.LCons.prototype.cljs$core$logic$IReifyTerm$ = true;
cljs.core.logic.LCons.prototype.cljs$core$logic$IReifyTerm$_reify_term$arity$2 = function(v, s) {
  var this__7612 = this;
  var v__7613 = v;
  var s__7614 = s;
  while(true) {
    if(cljs.core.logic.lcons_QMARK_.call(null, v__7613)) {
      var G__7649 = v__7613.cljs$core$logic$LConsSeq$_lnext$arity$1(v__7613);
      var G__7650 = cljs.core.logic._reify_STAR_.call(null, s__7614, v__7613.cljs$core$logic$LConsSeq$_lfirst$arity$1(v__7613));
      v__7613 = G__7649;
      s__7614 = G__7650;
      continue
    }else {
      return cljs.core.logic._reify_STAR_.call(null, s__7614, v__7613)
    }
    break
  }
};
cljs.core.logic.LCons.prototype.cljs$core$logic$IUnifyTerms$ = true;
cljs.core.logic.LCons.prototype.cljs$core$logic$IUnifyTerms$_unify_terms$arity$3 = function(u, v, s) {
  var this__7615 = this;
  return cljs.core.logic._unify_with_lseq.call(null, v, u, s)
};
cljs.core.logic.LCons.prototype.cljs$core$logic$IUnifyWithNil$ = true;
cljs.core.logic.LCons.prototype.cljs$core$logic$IUnifyWithNil$_unify_with_nil$arity$3 = function(v, u, s) {
  var this__7616 = this;
  return false
};
cljs.core.logic.LCons.prototype.cljs$core$logic$IUnifyWithMap$ = true;
cljs.core.logic.LCons.prototype.cljs$core$logic$IUnifyWithMap$_unify_with_map$arity$3 = function(v, u, s) {
  var this__7617 = this;
  return false
};
cljs.core.logic.LCons.prototype.cljs$core$logic$IOccursCheckTerm$ = true;
cljs.core.logic.LCons.prototype.cljs$core$logic$IOccursCheckTerm$_occurs_check_term$arity$3 = function(v, x, s) {
  var this__7618 = this;
  var v__7619 = v;
  var x__7620 = x;
  var s__7621 = s;
  while(true) {
    if(cljs.core.logic.lcons_QMARK_.call(null, v__7619)) {
      var or__3824__auto____7622 = cljs.core.logic._occurs_check.call(null, s__7621, x__7620, v__7619.cljs$core$logic$LConsSeq$_lfirst$arity$1(v__7619));
      if(cljs.core.truth_(or__3824__auto____7622)) {
        return or__3824__auto____7622
      }else {
        var G__7651 = v__7619.cljs$core$logic$LConsSeq$_lnext$arity$1(v__7619);
        var G__7652 = x__7620;
        var G__7653 = s__7621;
        v__7619 = G__7651;
        x__7620 = G__7652;
        s__7621 = G__7653;
        continue
      }
    }else {
      return cljs.core.logic._occurs_check.call(null, s__7621, x__7620, v__7619)
    }
    break
  }
};
cljs.core.logic.LCons.prototype.cljs$core$logic$IUnifyWithSet$ = true;
cljs.core.logic.LCons.prototype.cljs$core$logic$IUnifyWithSet$_unify_with_set$arity$3 = function(v, u, s) {
  var this__7623 = this;
  return false
};
cljs.core.logic.LCons.prototype.cljs$core$logic$IWalkTerm$ = true;
cljs.core.logic.LCons.prototype.cljs$core$logic$IWalkTerm$_walk_term$arity$2 = function(v, s) {
  var this__7624 = this;
  return cljs.core.logic.lcons.call(null, cljs.core.logic._walk_STAR_.call(null, s, v.cljs$core$logic$LConsSeq$_lfirst$arity$1(v)), cljs.core.logic._walk_STAR_.call(null, s, v.cljs$core$logic$LConsSeq$_lnext$arity$1(v)))
};
cljs.core.logic.LCons.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(this$, opts) {
  var this__7625 = this;
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, cljs.core.logic.lcons_pr_seq.call(null, this$))
};
cljs.core.logic.LCons.prototype.cljs$core$logic$IUnifyWithObject$ = true;
cljs.core.logic.LCons.prototype.cljs$core$logic$IUnifyWithObject$_unify_with_object$arity$3 = function(v, u, s) {
  var this__7626 = this;
  return false
};
cljs.core.logic.LCons.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(this$, o) {
  var this__7627 = this;
  var or__3824__auto____7628 = this$ === o;
  if(or__3824__auto____7628) {
    return or__3824__auto____7628
  }else {
    var and__3822__auto____7629 = cljs.core.instance_QMARK_.call(null, cljs.core.logic.LCons, o);
    if(and__3822__auto____7629) {
      var me__7630 = this$;
      var you__7631 = o;
      while(true) {
        if(me__7630 == null) {
          return you__7631 == null
        }else {
          if(cljs.core.logic.lvar_QMARK_.call(null, me__7630)) {
            return true
          }else {
            if(cljs.core.logic.lvar_QMARK_.call(null, you__7631)) {
              return true
            }else {
              if(function() {
                var and__3822__auto____7632 = cljs.core.logic.lcons_QMARK_.call(null, me__7630);
                if(and__3822__auto____7632) {
                  return cljs.core.logic.lcons_QMARK_.call(null, you__7631)
                }else {
                  return and__3822__auto____7632
                }
              }()) {
                var mef__7633 = me__7630.cljs$core$logic$LConsSeq$_lfirst$arity$1(me__7630);
                var youf__7634 = cljs.core.logic._lfirst.call(null, you__7631);
                var and__3822__auto____7637 = function() {
                  var or__3824__auto____7635 = cljs.core._EQ_.call(null, mef__7633, youf__7634);
                  if(or__3824__auto____7635) {
                    return or__3824__auto____7635
                  }else {
                    var or__3824__auto____7636 = cljs.core.logic.lvar_QMARK_.call(null, mef__7633);
                    if(or__3824__auto____7636) {
                      return or__3824__auto____7636
                    }else {
                      return cljs.core.logic.lvar_QMARK_.call(null, youf__7634)
                    }
                  }
                }();
                if(cljs.core.truth_(and__3822__auto____7637)) {
                  var G__7654 = me__7630.cljs$core$logic$LConsSeq$_lnext$arity$1(me__7630);
                  var G__7655 = cljs.core.logic._lnext.call(null, you__7631);
                  me__7630 = G__7654;
                  you__7631 = G__7655;
                  continue
                }else {
                  return and__3822__auto____7637
                }
              }else {
                if("\ufdd0'else") {
                  return cljs.core._EQ_.call(null, me__7630, you__7631)
                }else {
                  return null
                }
              }
            }
          }
        }
        break
      }
    }else {
      return and__3822__auto____7629
    }
  }
};
cljs.core.logic.LCons.prototype.cljs$core$IWithMeta$_withMeta$arity$2 = function(this$, new_meta) {
  var this__7638 = this;
  return new cljs.core.logic.LCons(this__7638.a, this__7638.d, new_meta)
};
cljs.core.logic.LCons.prototype.cljs$core$IMeta$_meta$arity$1 = function(this$) {
  var this__7639 = this;
  return this__7639.meta
};
cljs.core.logic.LCons.prototype.cljs$core$logic$LConsSeq$ = true;
cljs.core.logic.LCons.prototype.cljs$core$logic$LConsSeq$_lfirst$arity$1 = function(_) {
  var this__7640 = this;
  return this__7640.a
};
cljs.core.logic.LCons.prototype.cljs$core$logic$LConsSeq$_lnext$arity$1 = function(_) {
  var this__7641 = this;
  return this__7641.d
};
cljs.core.logic.LCons.prototype.cljs$core$logic$IUnifyWithLSeq$ = true;
cljs.core.logic.LCons.prototype.cljs$core$logic$IUnifyWithLSeq$_unify_with_lseq$arity$3 = function(v, u, s) {
  var this__7642 = this;
  var u__7643 = u;
  var v__7644 = v;
  var s__7645 = s;
  while(true) {
    if(cljs.core.logic.lvar_QMARK_.call(null, u__7643)) {
      return cljs.core.logic._unify.call(null, s__7645, u__7643, v__7644)
    }else {
      if(cljs.core.logic.lvar_QMARK_.call(null, v__7644)) {
        return cljs.core.logic._unify.call(null, s__7645, v__7644, u__7643)
      }else {
        if(function() {
          var and__3822__auto____7646 = cljs.core.logic.lcons_QMARK_.call(null, u__7643);
          if(and__3822__auto____7646) {
            return cljs.core.logic.lcons_QMARK_.call(null, v__7644)
          }else {
            return and__3822__auto____7646
          }
        }()) {
          var temp__3971__auto____7647 = cljs.core.logic._unify.call(null, s__7645, cljs.core.logic._lfirst.call(null, u__7643), v__7644.cljs$core$logic$LConsSeq$_lfirst$arity$1(v__7644));
          if(cljs.core.truth_(temp__3971__auto____7647)) {
            var s__7648 = temp__3971__auto____7647;
            var G__7656 = cljs.core.logic._lnext.call(null, u__7643);
            var G__7657 = v__7644.cljs$core$logic$LConsSeq$_lnext$arity$1(v__7644);
            var G__7658 = s__7648;
            u__7643 = G__7656;
            v__7644 = G__7657;
            s__7645 = G__7658;
            continue
          }else {
            return false
          }
        }else {
          if("\ufdd0'else") {
            return cljs.core.logic._unify.call(null, s__7645, u__7643, v__7644)
          }else {
            return null
          }
        }
      }
    }
    break
  }
};
cljs.core.logic.LCons;
cljs.core.logic.lcons = function lcons(a, d) {
  if(function() {
    var or__3824__auto____7660 = cljs.core.coll_QMARK_.call(null, d);
    if(or__3824__auto____7660) {
      return or__3824__auto____7660
    }else {
      return d == null
    }
  }()) {
    return cljs.core.cons.call(null, a, cljs.core.seq.call(null, d))
  }else {
    return new cljs.core.logic.LCons(a, d, null)
  }
};
cljs.core.logic.lcons_QMARK_ = function lcons_QMARK_(x) {
  return cljs.core.instance_QMARK_.call(null, cljs.core.logic.LCons, x)
};
cljs.core.PersistentHashSet.prototype.cljs$core$logic$IUnifyTerms$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$logic$IUnifyTerms$_unify_terms$arity$3 = function(u, v, s) {
  return cljs.core.logic._unify_with_set.call(null, v, u, s)
};
cljs.core.PersistentHashMap.prototype.cljs$core$logic$IUnifyTerms$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$logic$IUnifyTerms$_unify_terms$arity$3 = function(u, v, s) {
  return cljs.core.logic._unify_with_map.call(null, v, u, s)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$logic$IUnifyTerms$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$logic$IUnifyTerms$_unify_terms$arity$3 = function(u, v, s) {
  return cljs.core.logic._unify_with_map.call(null, v, u, s)
};
cljs.core.ObjMap.prototype.cljs$core$logic$IUnifyTerms$ = true;
cljs.core.ObjMap.prototype.cljs$core$logic$IUnifyTerms$_unify_terms$arity$3 = function(u, v, s) {
  return cljs.core.logic._unify_with_map.call(null, v, u, s)
};
cljs.core.logic.IUnifyTerms["_"] = true;
cljs.core.logic._unify_terms["_"] = function(u, v, s) {
  if(cljs.core.sequential_QMARK_.call(null, u)) {
    return cljs.core.logic._unify_with_seq.call(null, v, u, s)
  }else {
    return cljs.core.logic._unify_with_object.call(null, v, u, s)
  }
};
cljs.core.logic.IUnifyTerms["null"] = true;
cljs.core.logic._unify_terms["null"] = function(u, v, s) {
  return cljs.core.logic._unify_with_nil.call(null, v, u, s)
};
cljs.core.logic.IUnifyWithNil["_"] = true;
cljs.core.logic._unify_with_nil["_"] = function(v, u, s) {
  return false
};
cljs.core.logic.IUnifyWithNil["null"] = true;
cljs.core.logic._unify_with_nil["null"] = function(v, u, s) {
  return s
};
cljs.core.logic.IUnifyWithObject["_"] = true;
cljs.core.logic._unify_with_object["_"] = function(v, u, s) {
  if(cljs.core._EQ_.call(null, u, v)) {
    return s
  }else {
    return false
  }
};
cljs.core.logic.IUnifyWithObject["null"] = true;
cljs.core.logic._unify_with_object["null"] = function(v, u, s) {
  return false
};
cljs.core.logic.IUnifyWithLVar["_"] = true;
cljs.core.logic._unify_with_lvar["_"] = function(v, u, s) {
  return cljs.core.logic._ext.call(null, s, u, v)
};
cljs.core.logic.IUnifyWithLVar["null"] = true;
cljs.core.logic._unify_with_lvar["null"] = function(v, u, s) {
  return cljs.core.logic._ext_no_check.call(null, s, u, v)
};
cljs.core.logic.IUnifyWithLSeq["_"] = true;
cljs.core.logic._unify_with_lseq["_"] = function(v, u, s) {
  if(cljs.core.sequential_QMARK_.call(null, v)) {
    var u__7661 = u;
    var v__7662 = v;
    var s__7663 = s;
    while(true) {
      if(cljs.core.seq.call(null, v__7662)) {
        if(cljs.core.logic.lcons_QMARK_.call(null, u__7661)) {
          var temp__3971__auto____7664 = cljs.core.logic._unify.call(null, s__7663, cljs.core.logic._lfirst.call(null, u__7661), cljs.core.first.call(null, v__7662));
          if(cljs.core.truth_(temp__3971__auto____7664)) {
            var s__7665 = temp__3971__auto____7664;
            var G__7666 = cljs.core.logic._lnext.call(null, u__7661);
            var G__7667 = cljs.core.next.call(null, v__7662);
            var G__7668 = s__7665;
            u__7661 = G__7666;
            v__7662 = G__7667;
            s__7663 = G__7668;
            continue
          }else {
            return false
          }
        }else {
          return cljs.core.logic._unify.call(null, s__7663, u__7661, v__7662)
        }
      }else {
        if(cljs.core.logic.lvar_QMARK_.call(null, u__7661)) {
          return cljs.core.logic._unify.call(null, s__7663, u__7661, cljs.core.List.EMPTY)
        }else {
          return false
        }
      }
      break
    }
  }else {
    return false
  }
};
cljs.core.logic.IUnifyWithLSeq["null"] = true;
cljs.core.logic._unify_with_lseq["null"] = function(v, u, s) {
  return false
};
cljs.core.logic.IUnifyWithSequential["_"] = true;
cljs.core.logic._unify_with_seq["_"] = function(v, u, s) {
  if(cljs.core.sequential_QMARK_.call(null, v)) {
    var u__7669 = u;
    var v__7670 = v;
    var s__7671 = s;
    while(true) {
      if(cljs.core.seq.call(null, u__7669)) {
        if(cljs.core.seq.call(null, v__7670)) {
          var temp__3971__auto____7672 = cljs.core.logic._unify.call(null, s__7671, cljs.core.first.call(null, u__7669), cljs.core.first.call(null, v__7670));
          if(cljs.core.truth_(temp__3971__auto____7672)) {
            var s__7673 = temp__3971__auto____7672;
            var G__7674 = cljs.core.next.call(null, u__7669);
            var G__7675 = cljs.core.next.call(null, v__7670);
            var G__7676 = s__7673;
            u__7669 = G__7674;
            v__7670 = G__7675;
            s__7671 = G__7676;
            continue
          }else {
            return false
          }
        }else {
          return false
        }
      }else {
        if(cljs.core.seq.call(null, v__7670)) {
          return false
        }else {
          return s__7671
        }
      }
      break
    }
  }else {
    return false
  }
};
cljs.core.logic.IUnifyWithSequential["null"] = true;
cljs.core.logic._unify_with_seq["null"] = function(v, u, s) {
  return false
};
cljs.core.logic.not_found = {};
cljs.core.logic.unify_with_map_STAR_ = function unify_with_map_STAR_(v, u, s) {
  if(!(cljs.core.count.call(null, v) === cljs.core.count.call(null, u))) {
    return false
  }else {
    var ks__7683 = cljs.core.seq.call(null, cljs.core.keys.call(null, u));
    var s__7684 = s;
    while(true) {
      if(ks__7683) {
        var kf__7685 = cljs.core.first.call(null, ks__7683);
        var vf__7686 = cljs.core._lookup.call(null, v, kf__7685, cljs.core.logic.not_found);
        if(vf__7686 === cljs.core.logic.not_found) {
          return false
        }else {
          var temp__3971__auto____7687 = cljs.core.logic._unify.call(null, s__7684, cljs.core._lookup.call(null, u, kf__7685, null), vf__7686);
          if(cljs.core.truth_(temp__3971__auto____7687)) {
            var s__7688 = temp__3971__auto____7687;
            var G__7689 = cljs.core.next.call(null, ks__7683);
            var G__7690 = s__7688;
            ks__7683 = G__7689;
            s__7684 = G__7690;
            continue
          }else {
            return false
          }
        }
      }else {
        return s__7684
      }
      break
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$logic$IUnifyWithMap$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$logic$IUnifyWithMap$_unify_with_map$arity$3 = function(v, u, s) {
  return cljs.core.logic.unify_with_map_STAR_.call(null, v, u, s)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$logic$IUnifyWithMap$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$logic$IUnifyWithMap$_unify_with_map$arity$3 = function(v, u, s) {
  return cljs.core.logic.unify_with_map_STAR_.call(null, v, u, s)
};
cljs.core.ObjMap.prototype.cljs$core$logic$IUnifyWithMap$ = true;
cljs.core.ObjMap.prototype.cljs$core$logic$IUnifyWithMap$_unify_with_map$arity$3 = function(v, u, s) {
  return cljs.core.logic.unify_with_map_STAR_.call(null, v, u, s)
};
cljs.core.logic.IUnifyWithMap["_"] = true;
cljs.core.logic._unify_with_map["_"] = function(v, u, s) {
  return false
};
cljs.core.logic.IUnifyWithMap["null"] = true;
cljs.core.logic._unify_with_map["null"] = function(v, u, s) {
  return false
};
cljs.core.PersistentHashSet.prototype.cljs$core$logic$IUnifyWithSet$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$logic$IUnifyWithSet$_unify_with_set$arity$3 = function(v, u, s) {
  var u__7691 = u;
  var v__7692 = v;
  var ulvars__7693 = cljs.core.PersistentVector.EMPTY;
  var umissing__7694 = cljs.core.PersistentVector.EMPTY;
  while(true) {
    if(cljs.core.seq.call(null, u__7691)) {
      if(cljs.core.seq.call(null, v__7692)) {
        var uf__7695 = cljs.core.first.call(null, u__7691);
        if(cljs.core.logic.lvar_QMARK_.call(null, uf__7695)) {
          var G__7700 = cljs.core.disj.call(null, u__7691, uf__7695);
          var G__7701 = v__7692;
          var G__7702 = cljs.core.conj.call(null, ulvars__7693, uf__7695);
          var G__7703 = umissing__7694;
          u__7691 = G__7700;
          v__7692 = G__7701;
          ulvars__7693 = G__7702;
          umissing__7694 = G__7703;
          continue
        }else {
          if(cljs.core.contains_QMARK_.call(null, v__7692, uf__7695)) {
            var G__7704 = cljs.core.disj.call(null, u__7691, uf__7695);
            var G__7705 = cljs.core.disj.call(null, v__7692, uf__7695);
            var G__7706 = ulvars__7693;
            var G__7707 = umissing__7694;
            u__7691 = G__7704;
            v__7692 = G__7705;
            ulvars__7693 = G__7706;
            umissing__7694 = G__7707;
            continue
          }else {
            var G__7708 = cljs.core.disj.call(null, u__7691, uf__7695);
            var G__7709 = v__7692;
            var G__7710 = ulvars__7693;
            var G__7711 = cljs.core.conj.call(null, umissing__7694, uf__7695);
            u__7691 = G__7708;
            v__7692 = G__7709;
            ulvars__7693 = G__7710;
            umissing__7694 = G__7711;
            continue
          }
        }
      }else {
        return false
      }
    }else {
      if(cljs.core.seq.call(null, v__7692)) {
        if(cljs.core.seq.call(null, ulvars__7693)) {
          var v__7696 = v__7692;
          var vlvars__7697 = cljs.core.PersistentVector.EMPTY;
          var vmissing__7698 = cljs.core.PersistentVector.EMPTY;
          while(true) {
            if(cljs.core.seq.call(null, v__7696)) {
              var vf__7699 = cljs.core.first.call(null, v__7696);
              if(cljs.core.logic.lvar_QMARK_.call(null, vf__7699)) {
                var G__7712 = cljs.core.disj.call(null, v__7696, vf__7699);
                var G__7713 = cljs.core.conj.call(null, vlvars__7697, vf__7699);
                var G__7714 = vmissing__7698;
                v__7696 = G__7712;
                vlvars__7697 = G__7713;
                vmissing__7698 = G__7714;
                continue
              }else {
                var G__7715 = cljs.core.disj.call(null, v__7696, vf__7699);
                var G__7716 = vlvars__7697;
                var G__7717 = cljs.core.conj.call(null, vmissing__7698, vf__7699);
                v__7696 = G__7715;
                vlvars__7697 = G__7716;
                vmissing__7698 = G__7717;
                continue
              }
            }else {
              return cljs.core.logic._unify.call(null, s, cljs.core.concat.call(null, ulvars__7693, umissing__7694), cljs.core.concat.call(null, vmissing__7698, vlvars__7697))
            }
            break
          }
        }else {
          return false
        }
      }else {
        return s
      }
    }
    break
  }
};
cljs.core.logic.IUnifyWithSet["_"] = true;
cljs.core.logic._unify_with_set["_"] = function(v, u, s) {
  return false
};
cljs.core.logic.IUnifyWithSet["null"] = true;
cljs.core.logic._unify_with_set["null"] = function(v, u, s) {
  return false
};
cljs.core.logic.IReifyTerm["_"] = true;
cljs.core.logic._reify_term["_"] = function(v, s) {
  if(cljs.core.sequential_QMARK_.call(null, v)) {
    var v__7718 = v;
    var s__7719 = s;
    while(true) {
      if(cljs.core.seq.call(null, v__7718)) {
        var G__7720 = cljs.core.next.call(null, v__7718);
        var G__7721 = cljs.core.logic._reify_STAR_.call(null, s__7719, cljs.core.first.call(null, v__7718));
        v__7718 = G__7720;
        s__7719 = G__7721;
        continue
      }else {
        return s__7719
      }
      break
    }
  }else {
    return s
  }
};
cljs.core.logic.IReifyTerm["null"] = true;
cljs.core.logic._reify_term["null"] = function(v, s) {
  return s
};
cljs.core.logic.walk_term_map_STAR_ = function walk_term_map_STAR_(v, s) {
  var v__7729 = v;
  var r__7730 = cljs.core.ObjMap.EMPTY;
  while(true) {
    if(cljs.core.seq.call(null, v__7729)) {
      var vec__7731__7732 = cljs.core.first.call(null, v__7729);
      var vfk__7733 = cljs.core.nth.call(null, vec__7731__7732, 0, null);
      var vfv__7734 = cljs.core.nth.call(null, vec__7731__7732, 1, null);
      var G__7735 = cljs.core.next.call(null, v__7729);
      var G__7736 = cljs.core.assoc.call(null, r__7730, vfk__7733, cljs.core.logic._walk_STAR_.call(null, s, vfv__7734));
      v__7729 = G__7735;
      r__7730 = G__7736;
      continue
    }else {
      return r__7730
    }
    break
  }
};
cljs.core.PersistentHashSet.prototype.cljs$core$logic$IWalkTerm$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$logic$IWalkTerm$_walk_term$arity$2 = function(v, s) {
  var v__7737 = v;
  var r__7738 = cljs.core.ObjMap.EMPTY;
  while(true) {
    if(cljs.core.seq.call(null, v__7737)) {
      var G__7741 = cljs.core.next.call(null, v__7737);
      var G__7742 = cljs.core.conj.call(null, r__7738, cljs.core.logic._walk_STAR_.call(null, s, cljs.core.first.call(null, v__7737)));
      v__7737 = G__7741;
      r__7738 = G__7742;
      continue
    }else {
      return r__7738
    }
    break
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$logic$IWalkTerm$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$logic$IWalkTerm$_walk_term$arity$2 = function(v, s) {
  return cljs.core.logic.walk_term_map_STAR_.call(null, v, s)
};
cljs.core.ObjMap.prototype.cljs$core$logic$IWalkTerm$ = true;
cljs.core.ObjMap.prototype.cljs$core$logic$IWalkTerm$_walk_term$arity$2 = function(v, s) {
  return cljs.core.logic.walk_term_map_STAR_.call(null, v, s)
};
cljs.core.PersistentVector.prototype.cljs$core$logic$IWalkTerm$ = true;
cljs.core.PersistentVector.prototype.cljs$core$logic$IWalkTerm$_walk_term$arity$2 = function(v, s) {
  var v__7739 = v;
  var r__7740 = cljs.core.PersistentVector.EMPTY;
  while(true) {
    if(cljs.core.seq.call(null, v__7739)) {
      var G__7743 = cljs.core.next.call(null, v__7739);
      var G__7744 = cljs.core.conj.call(null, r__7740, cljs.core.logic._walk_STAR_.call(null, s, cljs.core.first.call(null, v__7739)));
      v__7739 = G__7743;
      r__7740 = G__7744;
      continue
    }else {
      return r__7740
    }
    break
  }
};
cljs.core.logic.IWalkTerm["_"] = true;
cljs.core.logic._walk_term["_"] = function(v, s) {
  if(cljs.core.sequential_QMARK_.call(null, v)) {
    return cljs.core.map.call(null, function(p1__7722_SHARP_) {
      return cljs.core.logic._walk_STAR_.call(null, s, p1__7722_SHARP_)
    }, v)
  }else {
    return v
  }
};
cljs.core.logic.IWalkTerm["null"] = true;
cljs.core.logic._walk_term["null"] = function(v, s) {
  return null
};
cljs.core.logic.IOccursCheckTerm["_"] = true;
cljs.core.logic._occurs_check_term["_"] = function(v, x, s) {
  if(cljs.core.sequential_QMARK_.call(null, v)) {
    var v__7745 = v;
    var x__7746 = x;
    var s__7747 = s;
    while(true) {
      if(cljs.core.seq.call(null, v__7745)) {
        var or__3824__auto____7748 = cljs.core.logic._occurs_check.call(null, s__7747, x__7746, cljs.core.first.call(null, v__7745));
        if(cljs.core.truth_(or__3824__auto____7748)) {
          return or__3824__auto____7748
        }else {
          var G__7749 = cljs.core.next.call(null, v__7745);
          var G__7750 = x__7746;
          var G__7751 = s__7747;
          v__7745 = G__7749;
          x__7746 = G__7750;
          s__7747 = G__7751;
          continue
        }
      }else {
        return false
      }
      break
    }
  }else {
    return false
  }
};
cljs.core.logic.IOccursCheckTerm["null"] = true;
cljs.core.logic._occurs_check_term["null"] = function(v, x, s) {
  return false
};
cljs.core.logic.ITake["_"] = true;
cljs.core.logic._take_STAR_["_"] = function(this$) {
  return this$
};
cljs.core.logic.Choice = function(a, f) {
  this.a = a;
  this.f = f
};
cljs.core.logic.Choice.cljs$lang$type = true;
cljs.core.logic.Choice.cljs$lang$ctorPrSeq = function(this__2333__auto__) {
  return cljs.core.list.call(null, "cljs.core.logic/Choice")
};
cljs.core.logic.Choice.prototype.cljs$core$logic$ITake$ = true;
cljs.core.logic.Choice.prototype.cljs$core$logic$ITake$_take_STAR_$arity$1 = function(this$) {
  var this__7752 = this;
  return new cljs.core.LazySeq(null, false, function() {
    return cljs.core.cons.call(null, cljs.core.first.call(null, this__7752.a), new cljs.core.LazySeq(null, false, function() {
      return cljs.core.logic._take_STAR_.call(null, this__7752.f)
    }, null))
  }, null)
};
cljs.core.logic.Choice.prototype.cljs$core$logic$IMPlus$ = true;
cljs.core.logic.Choice.prototype.cljs$core$logic$IMPlus$_mplus$arity$2 = function(this$, fp) {
  var this__7753 = this;
  return new cljs.core.logic.Choice(this__7753.a, new cljs.core.logic.Inc(function() {
    return cljs.core.logic._mplus.call(null, fp.call(null), this__7753.f)
  }))
};
cljs.core.logic.Choice.prototype.cljs$core$logic$IBind$ = true;
cljs.core.logic.Choice.prototype.cljs$core$logic$IBind$_bind$arity$2 = function(this$, g) {
  var this__7754 = this;
  return cljs.core.logic._mplus.call(null, g.call(null, this__7754.a), new cljs.core.logic.Inc(function() {
    return cljs.core.logic._bind.call(null, this__7754.f, g)
  }))
};
cljs.core.logic.Choice;
cljs.core.logic.choice = function choice(a, f) {
  return new cljs.core.logic.Choice(a, f)
};
cljs.core.logic.IBind["null"] = true;
cljs.core.logic._bind["null"] = function(_, g) {
  return null
};
cljs.core.logic.IMPlus["null"] = true;
cljs.core.logic._mplus["null"] = function(_, b) {
  return b
};
cljs.core.logic.ITake["null"] = true;
cljs.core.logic._take_STAR_["null"] = function(_) {
  return cljs.core.List.EMPTY
};
cljs.core.logic.IMPlus["_"] = true;
cljs.core.logic._mplus["_"] = function(this$, f) {
  return new cljs.core.logic.Choice(this$, f)
};
cljs.core.logic.Inc = function(f) {
  this.f = f;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 1
};
cljs.core.logic.Inc.cljs$lang$type = true;
cljs.core.logic.Inc.cljs$lang$ctorPrSeq = function(this__2333__auto__) {
  return cljs.core.list.call(null, "cljs.core.logic/Inc")
};
cljs.core.logic.Inc.prototype.cljs$core$logic$ITake$ = true;
cljs.core.logic.Inc.prototype.cljs$core$logic$ITake$_take_STAR_$arity$1 = function(this$) {
  var this__7757 = this;
  return new cljs.core.LazySeq(null, false, function() {
    return cljs.core.logic._take_STAR_.call(null, this__7757.f.call(null))
  }, null)
};
cljs.core.logic.Inc.prototype.cljs$core$logic$IMPlus$ = true;
cljs.core.logic.Inc.prototype.cljs$core$logic$IMPlus$_mplus$arity$2 = function(this$, fp) {
  var this__7758 = this;
  return new cljs.core.logic.Inc(function() {
    return cljs.core.logic._mplus.call(null, fp.call(null), this$)
  })
};
cljs.core.logic.Inc.prototype.cljs$core$logic$IBind$ = true;
cljs.core.logic.Inc.prototype.cljs$core$logic$IBind$_bind$arity$2 = function(this$, g) {
  var this__7759 = this;
  return new cljs.core.logic.Inc(function() {
    return cljs.core.logic._bind.call(null, this__7759.f.call(null), g)
  })
};
cljs.core.logic.Inc.prototype.call = function(this_sym7760) {
  var this__7761 = this;
  var this_sym7760__7762 = this;
  var ___7763 = this_sym7760__7762;
  return this__7761.f.call(null)
};
cljs.core.logic.Inc.prototype.apply = function(this_sym7755, args7756) {
  var this__7764 = this;
  return this_sym7755.call.apply(this_sym7755, [this_sym7755].concat(args7756.slice()))
};
cljs.core.logic.Inc;
cljs.core.logic.succeed = function succeed(a) {
  return a
};
cljs.core.logic.fail = function fail(a) {
  return null
};
cljs.core.logic.s_SHARP_ = cljs.core.logic.succeed;
cljs.core.logic.u_SHARP_ = cljs.core.logic.fail;
cljs.core.logic.IIfA = {};
cljs.core.logic._ifa = function _ifa(b, gs, c) {
  if(function() {
    var and__3822__auto____7769 = b;
    if(and__3822__auto____7769) {
      return b.cljs$core$logic$IIfA$_ifa$arity$3
    }else {
      return and__3822__auto____7769
    }
  }()) {
    return b.cljs$core$logic$IIfA$_ifa$arity$3(b, gs, c)
  }else {
    var x__2387__auto____7770 = b == null ? null : b;
    return function() {
      var or__3824__auto____7771 = cljs.core.logic._ifa[goog.typeOf(x__2387__auto____7770)];
      if(or__3824__auto____7771) {
        return or__3824__auto____7771
      }else {
        var or__3824__auto____7772 = cljs.core.logic._ifa["_"];
        if(or__3824__auto____7772) {
          return or__3824__auto____7772
        }else {
          throw cljs.core.missing_protocol.call(null, "IIfA.-ifa", b);
        }
      }
    }().call(null, b, gs, c)
  }
};
cljs.core.logic.IIfU = {};
cljs.core.logic._ifu = function _ifu(b, gs, c) {
  if(function() {
    var and__3822__auto____7777 = b;
    if(and__3822__auto____7777) {
      return b.cljs$core$logic$IIfU$_ifu$arity$3
    }else {
      return and__3822__auto____7777
    }
  }()) {
    return b.cljs$core$logic$IIfU$_ifu$arity$3(b, gs, c)
  }else {
    var x__2387__auto____7778 = b == null ? null : b;
    return function() {
      var or__3824__auto____7779 = cljs.core.logic._ifu[goog.typeOf(x__2387__auto____7778)];
      if(or__3824__auto____7779) {
        return or__3824__auto____7779
      }else {
        var or__3824__auto____7780 = cljs.core.logic._ifu["_"];
        if(or__3824__auto____7780) {
          return or__3824__auto____7780
        }else {
          throw cljs.core.missing_protocol.call(null, "IIfU.-ifu", b);
        }
      }
    }().call(null, b, gs, c)
  }
};
cljs.core.logic.IIfA["null"] = true;
cljs.core.logic._ifa["null"] = function(b, gs, c) {
  if(cljs.core.truth_(c)) {
    return cljs.core.force.call(null, c)
  }else {
    return null
  }
};
cljs.core.logic.IIfU["null"] = true;
cljs.core.logic._ifu["null"] = function(b, gs, c) {
  if(cljs.core.truth_(c)) {
    return cljs.core.force.call(null, c)
  }else {
    return null
  }
};
cljs.core.logic.Substitutions.prototype.cljs$core$logic$IIfA$ = true;
cljs.core.logic.Substitutions.prototype.cljs$core$logic$IIfA$_ifa$arity$3 = function(b, gs, c) {
  var b__7784 = b;
  var G__7782__7785 = gs;
  var vec__7783__7786 = G__7782__7785;
  var g0__7787 = cljs.core.nth.call(null, vec__7783__7786, 0, null);
  var gr__7788 = cljs.core.nthnext.call(null, vec__7783__7786, 1);
  var b__7789 = b__7784;
  var G__7782__7790 = G__7782__7785;
  while(true) {
    var b__7792 = b__7789;
    var vec__7791__7793 = G__7782__7790;
    var g0__7794 = cljs.core.nth.call(null, vec__7791__7793, 0, null);
    var gr__7795 = cljs.core.nthnext.call(null, vec__7791__7793, 1);
    if(cljs.core.truth_(g0__7794)) {
      var temp__3974__auto____7796 = g0__7794.call(null, b__7792);
      if(cljs.core.truth_(temp__3974__auto____7796)) {
        var b__7797 = temp__3974__auto____7796;
        var G__7798 = b__7797;
        var G__7799 = gr__7795;
        b__7789 = G__7798;
        G__7782__7790 = G__7799;
        continue
      }else {
        return null
      }
    }else {
      return b__7792
    }
    break
  }
};
cljs.core.logic.Substitutions.prototype.cljs$core$logic$IIfU$ = true;
cljs.core.logic.Substitutions.prototype.cljs$core$logic$IIfU$_ifu$arity$3 = function(b, gs, c) {
  var b__7803 = b;
  var G__7801__7804 = gs;
  var vec__7802__7805 = G__7801__7804;
  var g0__7806 = cljs.core.nth.call(null, vec__7802__7805, 0, null);
  var gr__7807 = cljs.core.nthnext.call(null, vec__7802__7805, 1);
  var b__7808 = b__7803;
  var G__7801__7809 = G__7801__7804;
  while(true) {
    var b__7811 = b__7808;
    var vec__7810__7812 = G__7801__7809;
    var g0__7813 = cljs.core.nth.call(null, vec__7810__7812, 0, null);
    var gr__7814 = cljs.core.nthnext.call(null, vec__7810__7812, 1);
    if(cljs.core.truth_(g0__7813)) {
      var temp__3974__auto____7815 = g0__7813.call(null, b__7811);
      if(cljs.core.truth_(temp__3974__auto____7815)) {
        var b__7816 = temp__3974__auto____7815;
        var G__7817 = b__7816;
        var G__7818 = gr__7814;
        b__7808 = G__7817;
        G__7801__7809 = G__7818;
        continue
      }else {
        return null
      }
    }else {
      return b__7811
    }
    break
  }
};
cljs.core.logic.Inc.prototype.cljs$core$logic$IIfU$ = true;
cljs.core.logic.Inc.prototype.cljs$core$logic$IIfU$_ifu$arity$3 = function(b, gs, c) {
  return new cljs.core.logic.Inc(function() {
    return cljs.core.logic._ifu.call(null, b.call(null), gs, c)
  })
};
cljs.core.logic.Inc.prototype.cljs$core$logic$IIfA$ = true;
cljs.core.logic.Inc.prototype.cljs$core$logic$IIfA$_ifa$arity$3 = function(b, gs, c) {
  return new cljs.core.logic.Inc(function() {
    return cljs.core.logic._ifa.call(null, b.call(null), gs, c)
  })
};
cljs.core.logic.Choice.prototype.cljs$core$logic$IIfA$ = true;
cljs.core.logic.Choice.prototype.cljs$core$logic$IIfA$_ifa$arity$3 = function(b, gs, c) {
  return cljs.core.reduce.call(null, cljs.core.logic._bind, b, gs)
};
cljs.core.logic.Choice.prototype.cljs$core$logic$IIfU$ = true;
cljs.core.logic.Choice.prototype.cljs$core$logic$IIfU$_ifu$arity$3 = function(b, gs, c) {
  return cljs.core.reduce.call(null, cljs.core.logic._bind, b.a, gs)
};
cljs.core.logic.nilo = function nilo(a) {
  return function(a__6233__auto__) {
    var temp__3971__auto____7821 = cljs.core.logic._unify.call(null, a__6233__auto__, null, a);
    if(cljs.core.truth_(temp__3971__auto____7821)) {
      var b__6234__auto____7822 = temp__3971__auto____7821;
      return b__6234__auto____7822
    }else {
      return null
    }
  }
};
cljs.core.logic.emptyo = function emptyo(a) {
  return function(a__6233__auto__) {
    var temp__3971__auto____7825 = cljs.core.logic._unify.call(null, a__6233__auto__, cljs.core.List.EMPTY, a);
    if(cljs.core.truth_(temp__3971__auto____7825)) {
      var b__6234__auto____7826 = temp__3971__auto____7825;
      return b__6234__auto____7826
    }else {
      return null
    }
  }
};
cljs.core.logic.conso = function conso(a, d, l) {
  return function(a__6233__auto__) {
    var temp__3971__auto____7829 = cljs.core.logic._unify.call(null, a__6233__auto__, cljs.core.logic.lcons.call(null, a, d), l);
    if(cljs.core.truth_(temp__3971__auto____7829)) {
      var b__6234__auto____7830 = temp__3971__auto____7829;
      return b__6234__auto____7830
    }else {
      return null
    }
  }
};
cljs.core.logic.firsto = function firsto(l, a) {
  return function(a__6245__auto__) {
    return new cljs.core.logic.Inc(function() {
      var d__7832 = cljs.core.logic.lvar.call(null, "\ufdd1'd");
      return cljs.core.logic._bind.call(null, a__6245__auto__, cljs.core.logic.conso.call(null, a, d__7832, l))
    })
  }
};
cljs.core.logic.resto = function resto(l, d) {
  return function(a__6245__auto__) {
    return new cljs.core.logic.Inc(function() {
      var a__7836 = cljs.core.logic.lvar.call(null, "\ufdd1'a");
      return cljs.core.logic._bind.call(null, a__6245__auto__, function(a__6233__auto__) {
        var temp__3971__auto____7837 = cljs.core.logic._unify.call(null, a__6233__auto__, cljs.core.logic.lcons.call(null, a__7836, d), l);
        if(cljs.core.truth_(temp__3971__auto____7837)) {
          var b__6234__auto____7838 = temp__3971__auto____7837;
          return b__6234__auto____7838
        }else {
          return null
        }
      })
    })
  }
};
cljs.core.logic.membero = function membero(x, l) {
  return function(a7847) {
    return new cljs.core.logic.Inc(function() {
      return cljs.core.logic._mplus.call(null, cljs.core.logic._bind.call(null, a7847, function(a__6245__auto__) {
        return new cljs.core.logic.Inc(function() {
          var tail__7848 = cljs.core.logic.lvar.call(null, "\ufdd1'tail");
          return cljs.core.logic._bind.call(null, a__6245__auto__, function(a__6233__auto__) {
            var temp__3971__auto____7849 = cljs.core.logic._unify.call(null, a__6233__auto__, cljs.core.logic.lcons.call(null, x, tail__7848), l);
            if(cljs.core.truth_(temp__3971__auto____7849)) {
              var b__6234__auto____7850 = temp__3971__auto____7849;
              return b__6234__auto____7850
            }else {
              return null
            }
          })
        })
      }), new cljs.core.logic.Inc(function() {
        return cljs.core.logic._bind.call(null, a7847, function(a__6245__auto__) {
          return new cljs.core.logic.Inc(function() {
            var head__7851 = cljs.core.logic.lvar.call(null, "\ufdd1'head");
            var tail__7852 = cljs.core.logic.lvar.call(null, "\ufdd1'tail");
            return cljs.core.logic._bind.call(null, cljs.core.logic._bind.call(null, a__6245__auto__, function(a__6233__auto__) {
              var temp__3971__auto____7853 = cljs.core.logic._unify.call(null, a__6233__auto__, cljs.core.logic.lcons.call(null, head__7851, tail__7852), l);
              if(cljs.core.truth_(temp__3971__auto____7853)) {
                var b__6234__auto____7854 = temp__3971__auto____7853;
                return b__6234__auto____7854
              }else {
                return null
              }
            }), membero.call(null, x, tail__7852))
          })
        })
      }))
    })
  }
};
cljs.core.logic.appendo = function appendo(x, y, z) {
  return function(a7867) {
    return new cljs.core.logic.Inc(function() {
      return cljs.core.logic._mplus.call(null, cljs.core.logic._bind.call(null, a7867, function(a__6245__auto__) {
        return new cljs.core.logic.Inc(function() {
          return cljs.core.logic._bind.call(null, cljs.core.logic._bind.call(null, a__6245__auto__, function(a__6233__auto__) {
            var temp__3971__auto____7868 = cljs.core.logic._unify.call(null, a__6233__auto__, cljs.core.List.EMPTY, x);
            if(cljs.core.truth_(temp__3971__auto____7868)) {
              var b__6234__auto____7869 = temp__3971__auto____7868;
              return b__6234__auto____7869
            }else {
              return null
            }
          }), function(a__6245__auto__) {
            return new cljs.core.logic.Inc(function() {
              return cljs.core.logic._bind.call(null, a__6245__auto__, function(a__6233__auto__) {
                var temp__3971__auto____7870 = cljs.core.logic._unify.call(null, a__6233__auto__, y, z);
                if(cljs.core.truth_(temp__3971__auto____7870)) {
                  var b__6234__auto____7871 = temp__3971__auto____7870;
                  return b__6234__auto____7871
                }else {
                  return null
                }
              })
            })
          })
        })
      }), new cljs.core.logic.Inc(function() {
        return cljs.core.logic._bind.call(null, a7867, function(a__6245__auto__) {
          return new cljs.core.logic.Inc(function() {
            var a__7872 = cljs.core.logic.lvar.call(null, "\ufdd1'a");
            var d__7873 = cljs.core.logic.lvar.call(null, "\ufdd1'd");
            return cljs.core.logic._bind.call(null, cljs.core.logic._bind.call(null, a__6245__auto__, function(a__6233__auto__) {
              var temp__3971__auto____7874 = cljs.core.logic._unify.call(null, a__6233__auto__, cljs.core.logic.lcons.call(null, a__7872, d__7873), x);
              if(cljs.core.truth_(temp__3971__auto____7874)) {
                var b__6234__auto____7875 = temp__3971__auto____7874;
                return b__6234__auto____7875
              }else {
                return null
              }
            }), function(a__6245__auto__) {
              return new cljs.core.logic.Inc(function() {
                var r__7876 = cljs.core.logic.lvar.call(null, "\ufdd1'r");
                return cljs.core.logic._bind.call(null, cljs.core.logic._bind.call(null, a__6245__auto__, function(a__6233__auto__) {
                  var temp__3971__auto____7877 = cljs.core.logic._unify.call(null, a__6233__auto__, cljs.core.logic.lcons.call(null, a__7872, r__7876), z);
                  if(cljs.core.truth_(temp__3971__auto____7877)) {
                    var b__6234__auto____7878 = temp__3971__auto____7877;
                    return b__6234__auto____7878
                  }else {
                    return null
                  }
                }), appendo.call(null, d__7873, y, r__7876))
              })
            })
          })
        })
      }))
    })
  }
};
cljs.core.logic.prefix = function prefix(s, _LT_s) {
  if(cljs.core._EQ_.call(null, s, _LT_s)) {
    return cljs.core.List.EMPTY
  }else {
    return cljs.core.cons.call(null, cljs.core.first.call(null, s), prefix.call(null, cljs.core.rest.call(null, s), _LT_s))
  }
};
goog.provide("goog.dom.forms");
goog.require("goog.structs.Map");
goog.dom.forms.getFormDataMap = function(form) {
  var map = new goog.structs.Map;
  goog.dom.forms.getFormDataHelper_(form, map, goog.dom.forms.addFormDataToMap_);
  return map
};
goog.dom.forms.getFormDataString = function(form) {
  var sb = [];
  goog.dom.forms.getFormDataHelper_(form, sb, goog.dom.forms.addFormDataToStringBuffer_);
  return sb.join("&")
};
goog.dom.forms.getFormDataHelper_ = function(form, result, fnAppend) {
  var els = form.elements;
  for(var el, i = 0;el = els[i];i++) {
    if(el.disabled || el.tagName.toLowerCase() == "fieldset") {
      continue
    }
    var name = el.name;
    var type = el.type.toLowerCase();
    switch(type) {
      case "file":
      ;
      case "submit":
      ;
      case "reset":
      ;
      case "button":
        break;
      case "select-multiple":
        var values = goog.dom.forms.getValue(el);
        if(values != null) {
          for(var value, j = 0;value = values[j];j++) {
            fnAppend(result, name, value)
          }
        }
        break;
      default:
        var value = goog.dom.forms.getValue(el);
        if(value != null) {
          fnAppend(result, name, value)
        }
    }
  }
  var inputs = form.getElementsByTagName("input");
  for(var input, i = 0;input = inputs[i];i++) {
    if(input.form == form && input.type.toLowerCase() == "image") {
      name = input.name;
      fnAppend(result, name, input.value);
      fnAppend(result, name + ".x", "0");
      fnAppend(result, name + ".y", "0")
    }
  }
};
goog.dom.forms.addFormDataToMap_ = function(map, name, value) {
  var array = map.get(name);
  if(!array) {
    array = [];
    map.set(name, array)
  }
  array.push(value)
};
goog.dom.forms.addFormDataToStringBuffer_ = function(sb, name, value) {
  sb.push(encodeURIComponent(name) + "=" + encodeURIComponent(value))
};
goog.dom.forms.hasFileInput = function(form) {
  var els = form.elements;
  for(var el, i = 0;el = els[i];i++) {
    if(!el.disabled && el.type && el.type.toLowerCase() == "file") {
      return true
    }
  }
  return false
};
goog.dom.forms.setDisabled = function(el, disabled) {
  if(el.tagName == "FORM") {
    var els = el.elements;
    for(var i = 0;el = els[i];i++) {
      goog.dom.forms.setDisabled(el, disabled)
    }
  }else {
    if(disabled == true) {
      el.blur()
    }
    el.disabled = disabled
  }
};
goog.dom.forms.focusAndSelect = function(el) {
  el.focus();
  if(el.select) {
    el.select()
  }
};
goog.dom.forms.hasValue = function(el) {
  var value = goog.dom.forms.getValue(el);
  return!!value
};
goog.dom.forms.hasValueByName = function(form, name) {
  var value = goog.dom.forms.getValueByName(form, name);
  return!!value
};
goog.dom.forms.getValue = function(el) {
  var type = el.type;
  if(!goog.isDef(type)) {
    return null
  }
  switch(type.toLowerCase()) {
    case "checkbox":
    ;
    case "radio":
      return goog.dom.forms.getInputChecked_(el);
    case "select-one":
      return goog.dom.forms.getSelectSingle_(el);
    case "select-multiple":
      return goog.dom.forms.getSelectMultiple_(el);
    default:
      return goog.isDef(el.value) ? el.value : null
  }
};
goog.dom.$F = goog.dom.forms.getValue;
goog.dom.forms.getValueByName = function(form, name) {
  var els = form.elements[name];
  if(els.type) {
    return goog.dom.forms.getValue(els)
  }else {
    for(var i = 0;i < els.length;i++) {
      var val = goog.dom.forms.getValue(els[i]);
      if(val) {
        return val
      }
    }
    return null
  }
};
goog.dom.forms.getInputChecked_ = function(el) {
  return el.checked ? el.value : null
};
goog.dom.forms.getSelectSingle_ = function(el) {
  var selectedIndex = el.selectedIndex;
  return selectedIndex >= 0 ? el.options[selectedIndex].value : null
};
goog.dom.forms.getSelectMultiple_ = function(el) {
  var values = [];
  for(var option, i = 0;option = el.options[i];i++) {
    if(option.selected) {
      values.push(option.value)
    }
  }
  return values.length ? values : null
};
goog.dom.forms.setValue = function(el, opt_value) {
  var type = el.type;
  if(goog.isDef(type)) {
    switch(type.toLowerCase()) {
      case "checkbox":
      ;
      case "radio":
        goog.dom.forms.setInputChecked_(el, opt_value);
        break;
      case "select-one":
        goog.dom.forms.setSelectSingle_(el, opt_value);
        break;
      case "select-multiple":
        goog.dom.forms.setSelectMultiple_(el, opt_value);
        break;
      default:
        el.value = goog.isDefAndNotNull(opt_value) ? opt_value : ""
    }
  }
};
goog.dom.forms.setInputChecked_ = function(el, opt_value) {
  el.checked = opt_value ? "checked" : null
};
goog.dom.forms.setSelectSingle_ = function(el, opt_value) {
  el.selectedIndex = -1;
  if(goog.isString(opt_value)) {
    for(var option, i = 0;option = el.options[i];i++) {
      if(option.value == opt_value) {
        option.selected = true;
        break
      }
    }
  }
};
goog.dom.forms.setSelectMultiple_ = function(el, opt_value) {
  if(goog.isString(opt_value)) {
    opt_value = [opt_value]
  }
  for(var option, i = 0;option = el.options[i];i++) {
    option.selected = false;
    if(opt_value) {
      for(var value, j = 0;value = opt_value[j];j++) {
        if(option.value == value) {
          option.selected = true
        }
      }
    }
  }
};
goog.provide("onedit.minibuffer");
goog.require("cljs.core");
goog.require("goog.ui.Textarea");
goog.require("goog.editor.focus");
goog.require("goog.events");
goog.require("goog.dom.forms");
goog.require("goog.dom");
goog.require("onedit.core");
onedit.minibuffer.focus_out = function focus_out(editor, e) {
  return onedit.core.minibuffer.call(null, editor).setVisible(false)
};
onedit.minibuffer.handle_key = function handle_key(editor, functionmap, e) {
  if(cljs.core._EQ_.call(null, ekeyCode, goog.events.KeyCodes.ENTER)) {
    var temp__3974__auto____7281 = functionmap.call(null, cljs.core.keyword.call(null, goog.dom.forms.getValue(editorminibuffer.getContentElement())));
    if(cljs.core.truth_(temp__3974__auto____7281)) {
      var f__7282 = temp__3974__auto____7281;
      e.preventDefault();
      return f__7282.call(null, editor)
    }else {
      return null
    }
  }else {
    return null
  }
};
onedit.minibuffer.create = function create() {
  return new goog.ui.Textarea("")
};
onedit.minibuffer.init = function init(editor, functionmap) {
  var element__7286 = goog.dom.getElement("minibuffer");
  goog.events.listen(new goog.events.KeyHandler(element__7286), goog.events.KeyHandler.EventType.KEY, cljs.core.partial.call(null, onedit.minibuffer.handle_key, editor, functionmap));
  var G__7287__7288 = editorminibuffer;
  goog.events.listen(G__7287__7288, goog.events.EventType.FOCUSOUT, cljs.core.partial.call(null, onedit.minibuffer.focus_out, editor));
  G__7287__7288.setVisible(false);
  G__7287__7288.decorate(element__7286);
  return G__7287__7288
};
onedit.minibuffer.focus = function focus(minibuffer) {
  return goog.editor.focus.focusInputField(minibuffer)
};
goog.provide("onedit.cursor");
goog.require("cljs.core");
goog.require("goog.string");
goog.require("goog.dom.Range");
goog.require("goog.dom");
goog.require("onedit.buffer");
goog.require("onedit.util");
goog.require("onedit.core");
onedit.cursor.select = function select(range, node, offset) {
  var G__7193__7194 = range;
  G__7193__7194.moveToNodes(node, offset, node, offset, false);
  G__7193__7194.select();
  return G__7193__7194
};
onedit.cursor.move = function move(f, g, editor) {
  var range__7197 = goog.dom.Range.createFromWindow();
  onedit.cursor.select.call(null, range__7197, f.call(null, range__7197), g.call(null, range__7197));
  return onedit.core.mode.call(null, editor)
};
onedit.cursor.offset = function offset(p1__7195_SHARP_) {
  return p1__7195_SHARP_.getStartOffset()
};
onedit.cursor.node = function node(p1__7198_SHARP_) {
  return p1__7198_SHARP_.getStartNode()
};
onedit.cursor.inc_offset = cljs.core.comp.call(null, onedit.util.collfn.call(null, cljs.core.min), cljs.core.juxt.call(null, cljs.core.comp.call(null, cljs.core.alength, onedit.cursor.node), cljs.core.comp.call(null, cljs.core.inc, onedit.cursor.offset)));
onedit.cursor.dec_offset = cljs.core.comp.call(null, cljs.core.partial.call(null, cljs.core.max, 0), cljs.core.dec, onedit.cursor.offset);
onedit.cursor.move_right = cljs.core.partial.call(null, onedit.cursor.move, onedit.cursor.node, onedit.cursor.inc_offset);
onedit.cursor.move_left = cljs.core.partial.call(null, onedit.cursor.move, onedit.cursor.node, onedit.cursor.dec_offset);
onedit.cursor.move_line = function move_line(p1__7199_SHARP_) {
  return cljs.core.comp.call(null, cljs.core.first, cljs.core.partial.call(null, cljs.core.drop_while, cljs.core.nil_QMARK_), cljs.core.juxt.call(null, cljs.core.comp.call(null, onedit.util.double$.call(null, p1__7199_SHARP_), onedit.cursor.node), onedit.cursor.node))
};
onedit.cursor.next_line = onedit.cursor.move_line.call(null, goog.dom.getNextNode);
onedit.cursor.prev_line = onedit.cursor.move_line.call(null, goog.dom.getPreviousNode);
onedit.cursor.move_bottom = cljs.core.partial.call(null, onedit.cursor.move, onedit.cursor.next_line, onedit.cursor.offset);
onedit.cursor.move_top = cljs.core.partial.call(null, onedit.cursor.move, onedit.cursor.prev_line, onedit.cursor.offset);
onedit.cursor.word = cljs.core.comp.call(null, cljs.core.partial.call(null, cljs.core.map, onedit.util.join), onedit.util.collfn.call(null, cljs.core.split_at), cljs.core.juxt.call(null, onedit.cursor.offset, cljs.core.comp.call(null, goog.dom.getRawTextContent, onedit.cursor.node)));
onedit.cursor.forward = cljs.core.comp.call(null, onedit.util.sum, cljs.core.juxt.call(null, cljs.core.comp.call(null, cljs.core.count, cljs.core.first), cljs.core.comp.call(null, cljs.core.count, cljs.core.partial.call(null, cljs.core.re_find, /\s*\w+/), cljs.core.second)));
onedit.cursor.backward = cljs.core.comp.call(null, onedit.util.collfn.call(null, cljs.core._), cljs.core.juxt.call(null, cljs.core.count, cljs.core.comp.call(null, cljs.core.count, cljs.core.last, cljs.core.partial.call(null, cljs.core.re_seq, /\w+\s*/))), cljs.core.first);
onedit.cursor.move_forward = cljs.core.partial.call(null, onedit.cursor.move, onedit.cursor.node, cljs.core.comp.call(null, onedit.cursor.forward, onedit.cursor.word));
onedit.cursor.move_backward = cljs.core.partial.call(null, onedit.cursor.move, onedit.cursor.node, cljs.core.comp.call(null, onedit.cursor.backward, onedit.cursor.word));
onedit.cursor.line = function line(f, range) {
  var node__7202 = range.getStartNode();
  var offset__7203 = f.call(null, node__7202);
  return range.moveToNodes(node__7202, offset__7203, node__7202, offset__7203)
};
onedit.cursor.start = cljs.core.constantly.call(null, 0);
onedit.cursor.end = cljs.core.comp.call(null, cljs.core.count, goog.dom.getRawTextContent, onedit.cursor.node);
onedit.cursor.move_start = cljs.core.partial.call(null, onedit.cursor.move, cljs.core.partial.call(null, onedit.cursor.line, onedit.cursor.start));
onedit.cursor.move_end = cljs.core.partial.call(null, onedit.cursor.move, cljs.core.partial.call(null, onedit.cursor.line, onedit.cursor.end));
goog.provide("onedit.deletion");
goog.require("cljs.core");
goog.require("goog.events.KeyCodes");
goog.require("goog.dom");
goog.require("onedit.cursor");
goog.require("onedit.core");
onedit.deletion.delete_character = function delete_character(editor) {
  var range__7253 = onedit.cursor.create.call(null);
  var offset__7254 = range__7253.getStartOffset();
  var node__7255 = range__7253.getStartNode();
  var vec__7252__7256 = cljs.core.split_at.call(null, offset__7254, goog.dom.getRawTextContent(node__7255));
  var s1__7257 = cljs.core.nth.call(null, vec__7252__7256, 0, null);
  var s2__7258 = cljs.core.nth.call(null, vec__7252__7256, 1, null);
  var new_node__7259 = goog.dom.createTextNode([cljs.core.str(cljs.core.apply.call(null, cljs.core.str, s1__7257)), cljs.core.str(cljs.core.apply.call(null, cljs.core.str, cljs.core.subs.call(null, cljs.core.apply.call(null, cljs.core.str, s2__7258), 1)))].join(""));
  goog.dom.replaceNode(new_node__7259, node__7255);
  onedit.cursor.move_to_node.call(null, editor, new_node__7259, offset__7254);
  return editormode
};
onedit.deletion.delete_rest = function delete_rest(editor) {
  var range__7264 = onedit.cursor.create.call(null);
  var offset__7265 = range__7264.getStartOffset();
  var node__7266 = range__7264.getStartNode();
  var new_node__7267 = goog.dom.createTextNode(cljs.core.subs.call(null, goog.dom.getRawTextContent(node__7266), 0, offset__7265));
  goog.dom.replaceNode(new_node__7267, node__7266);
  onedit.cursor.move_to_node.call(null, editor, new_node__7267, offset__7265);
  return editormode
};
onedit.deletion.delete_line = function delete_line(editor) {
  var range__7272 = onedit.cursor.create.call(null);
  var node__7273 = range__7272.getStartNode();
  var offset__7274 = range__7272.getStartOffset();
  var prev__7275 = goog.dom.getPreviousNode(node__7273);
  goog.dom.removeNode(node__7273);
  goog.dom.removeNode(goog.dom.getNextNode(node__7273));
  onedit.cursor.move_to_node.call(null, editor, prev__7275, offset__7274);
  return onedit.core.normal.call(null, editor)
};
onedit.deletion.keymap = cljs.core.PersistentArrayMap.fromArrays([false, true], [cljs.core.PersistentArrayMap.fromArrays([goog.events.KeyCodes.D], [onedit.deletion.delete_line]), cljs.core.ObjMap.EMPTY]);
onedit.deletion.Mode = function() {
};
onedit.deletion.Mode.cljs$lang$type = true;
onedit.deletion.Mode.cljs$lang$ctorPrSeq = function(this__2333__auto__) {
  return cljs.core.list.call(null, "onedit.deletion/Mode")
};
onedit.deletion.Mode.prototype.onedit$core$Mode$ = true;
onedit.deletion.Mode.prototype.onedit$core$Mode$action$arity$3 = function(this$, editor, e) {
  var this__7276 = this;
  e.preventDefault();
  var temp__3971__auto____7277 = onedit.deletion.keymap.call(null, eshiftKey).call(null, ekeyCode);
  if(cljs.core.truth_(temp__3971__auto____7277)) {
    var f__7278 = temp__3971__auto____7277;
    return f__7278.call(null, editor)
  }else {
    return this$
  }
};
onedit.deletion.Mode;
goog.provide("onedit.replacement");
goog.require("cljs.core");
goog.require("onedit.deletion");
goog.require("onedit.core");
onedit.replacement.Mode = function(editor) {
  this.editor = editor
};
onedit.replacement.Mode.cljs$lang$type = true;
onedit.replacement.Mode.cljs$lang$ctorPrSeq = function(this__2333__auto__) {
  return cljs.core.list.call(null, "onedit.replacement/Mode")
};
onedit.replacement.Mode.prototype.onedit$core$Mode$ = true;
onedit.replacement.Mode.prototype.onedit$core$Mode$action$arity$3 = function(this$, editor, e) {
  var this__7223 = this;
  onedit.deletion.delete_character.call(null, editor);
  return onedit.core.normal.call(null, editor)
};
onedit.replacement.Mode;
goog.provide("onedit.insertion");
goog.require("cljs.core");
goog.require("goog.events.KeyCodes");
goog.require("goog.dom.Range");
goog.require("goog.dom");
goog.require("onedit.util");
goog.require("onedit.cursor");
goog.require("onedit.core");
onedit.insertion.append_br = function append_br(editor) {
  var range__7213 = goog.dom.Range.createFromWindow();
  var offset__7214 = onedit.cursor.offset.call(null, range__7213);
  var old_node__7215 = onedit.cursor.node.call(null, range__7213);
  var br__7216 = goog.dom.createElement(goog.dom.TagName.BR);
  var vec__7212__7217 = cljs.core.map.call(null, goog.dom.createTextNode, onedit.util.split.call(null, offset__7214, goog.dom.getRawTextContent(old_node__7215)));
  var node1__7218 = cljs.core.nth.call(null, vec__7212__7217, 0, null);
  var node2__7219 = cljs.core.nth.call(null, vec__7212__7217, 1, null);
  goog.dom.replaceNode(node1__7218, old_node__7215);
  goog.dom.insertSiblingAfter(br__7216, node1__7218);
  goog.dom.insertSiblingAfter(node2__7219, br__7216);
  onedit.cursor.select.call(null, range__7213, node2__7219, 0);
  return onedit.core.mode.call(null, editor)
};
onedit.insertion.keymap = cljs.core.PersistentArrayMap.fromArrays([false, true], [cljs.core.PersistentArrayMap.fromArrays([goog.events.KeyCodes.ESC, goog.events.KeyCodes.ENTER], [onedit.core.normal, onedit.insertion.append_br]), cljs.core.ObjMap.EMPTY]);
onedit.insertion.Mode = function() {
};
onedit.insertion.Mode.cljs$lang$type = true;
onedit.insertion.Mode.cljs$lang$ctorPrSeq = function(this__2333__auto__) {
  return cljs.core.list.call(null, "onedit.insertion/Mode")
};
onedit.insertion.Mode.prototype.onedit$core$Mode$ = true;
onedit.insertion.Mode.prototype.onedit$core$Mode$action$arity$3 = function(this$, editor, e) {
  var this__7220 = this;
  var temp__3971__auto____7221 = onedit.insertion.keymap.call(null, eshiftKey).call(null, ekeyCode);
  if(cljs.core.truth_(temp__3971__auto____7221)) {
    var f__7222 = temp__3971__auto____7221;
    e.preventDefault();
    return f__7222.call(null, editor)
  }else {
    return this$
  }
};
onedit.insertion.Mode;
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
goog.require("onedit.deletion");
goog.require("goog.events.KeyCodes");
goog.require("goog.dom.Range");
goog.require("onedit.buffer");
goog.require("goog.dom");
goog.require("onedit.insertion");
goog.require("cljs.core.logic");
goog.require("onedit.replacement");
goog.require("onedit.cursor");
goog.require("onedit.minibuffer");
goog.require("goog.debug.Console");
goog.require("onedit.core");
onedit.keymap = cljs.core.PersistentArrayMap.fromArrays([false, true], [cljs.core.PersistentArrayMap.fromArrays([goog.events.KeyCodes.ZERO, goog.events.KeyCodes.W, goog.events.KeyCodes.RIGHT, goog.events.KeyCodes.LEFT, goog.events.KeyCodes.R, goog.events.KeyCodes.DOWN, goog.events.KeyCodes.X, goog.events.KeyCodes.B, goog.events.KeyCodes.SEMICOLON, goog.events.KeyCodes.D, goog.events.KeyCodes.J, goog.events.KeyCodes.K, goog.events.KeyCodes.H, goog.events.KeyCodes.I, goog.events.KeyCodes.UP, goog.events.KeyCodes.L], 
[onedit.cursor.move_start, onedit.cursor.move_forward, onedit.cursor.move_right, onedit.cursor.move_left, function keymap(_) {
  return new onedit.replacement.Mode
}, onedit.cursor.move_bottom, onedit.deletion.delete_character, onedit.cursor.move_backward, onedit.minibuffer.focus, function keymap(_) {
  return new onedit.deletion.Mode
}, onedit.cursor.move_bottom, onedit.cursor.move_top, onedit.cursor.move_left, function keymap(_) {
  return new onedit.insertion.Mode
}, onedit.cursor.move_top, onedit.cursor.move_right]), cljs.core.PersistentArrayMap.fromArrays([goog.events.KeyCodes.FOUR], [onedit.cursor.move_end])]);
onedit.Mode = function() {
};
onedit.Mode.cljs$lang$type = true;
onedit.Mode.cljs$lang$ctorPrSeq = function(this__2333__auto__) {
  return cljs.core.list.call(null, "onedit/Mode")
};
onedit.Mode.prototype.onedit$core$Mode$ = true;
onedit.Mode.prototype.onedit$core$Mode$action$arity$3 = function(this$, editor, e) {
  var this__7115 = this;
  e.preventDefault();
  var temp__3971__auto____7116 = onedit.keymap.call(null, eshiftKey).call(null, ekeyCode);
  if(cljs.core.truth_(temp__3971__auto____7116)) {
    var f__7117 = temp__3971__auto____7116;
    return f__7117.call(null, editor)
  }else {
    return this$
  }
};
onedit.Mode;
onedit.Editor = function(mode, buffer, minibuffer) {
  this.mode = mode;
  this.buffer = buffer;
  this.minibuffer = minibuffer
};
onedit.Editor.cljs$lang$type = true;
onedit.Editor.cljs$lang$ctorPrSeq = function(this__2333__auto__) {
  return cljs.core.list.call(null, "onedit/Editor")
};
onedit.Editor.prototype.onedit$core$IEditor$ = true;
onedit.Editor.prototype.onedit$core$IEditor$mode$arity$1 = function(this$) {
  var this__7118 = this;
  return thismode
};
onedit.Editor.prototype.onedit$core$IEditor$buffer$arity$1 = function(this$) {
  var this__7119 = this;
  return thisbuffer
};
onedit.Editor.prototype.onedit$core$IEditor$minibuffer$arity$1 = function(this$) {
  var this__7120 = this;
  return thisminibuffer
};
onedit.Editor.prototype.onedit$core$IEditor$normal$arity$1 = function(this$) {
  var this__7121 = this;
  return new onedit.Mode
};
onedit.Editor;
onedit.init = function init() {
  goog.debug.Console.autoInstall();
  var G__7124__7125 = new onedit.Editor(new onedit.Mode, goog.dom.getElement("buffer"), onedit.minibuffer.create.call(null));
  onedit.buffer.init.call(null, G__7124__7125);
  return G__7124__7125
};
goog.provide("onedit.live");
goog.require("cljs.core");
goog.require("onedit.file");
goog.require("onedit.core");
onedit.live.live = function() {
  var live = null;
  var live__0 = function() {
    var socket__7233 = new WebSocket([cljs.core.str("ws://localhost:5000/live/"), cljs.core.str(tab.get.call(null).attr("id"))].join(""));
    socket__7233onmessage = function(e) {
      return onedit.core.log.call(null, edata)
    };
    return tab.data.call(null, "socket", socket__7233)
  };
  var live__2 = function(id, filename) {
    onedit.file.create.call(null, filename);
    var socket__7234 = new WebSocket([cljs.core.str("ws://localhost:5000/live/"), cljs.core.str(id), cljs.core.str("/"), cljs.core.str(filename)].join(""));
    var i__7235 = tab.get.call(null).attr("id");
    onedit.core.log.call(null, i__7235);
    return socket__7234onmessage = function(e) {
      onedit.core.log.call(null, edata);
      return onedit.core.jquery.call(null, [cljs.core.str("#"), cljs.core.str(i__7235)].join("")).html(edata)
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
goog.require("goog.string");
goog.require("goog.object");
goog.require("onedit.core");
onedit.highlighter.language = function language(lang) {
  buffer.get_buffer.call(null).attr("class", [cljs.core.str("prettyprint lang-"), cljs.core.str(lang)].join(""));
  return prettyPrint()
};
onedit.highlighter.filename = function filename(name) {
  return onedit.highlighter.language.call(null, cljs.core.last.call(null, cljs.core.re_seq.call(null, /\./, name)))
};
onedit.highlighter.highlight = function highlight() {
  var tab__7129 = tab.get_tab.call(null);
  var temp__3971__auto____7130 = tab.get_tab.call(null).data("language");
  if(cljs.core.truth_(temp__3971__auto____7130)) {
    var lang__7131 = temp__3971__auto____7130;
    return onedit.highlighter.language.call(null, lang__7131)
  }else {
    return onedit.highlighter.filename.call(null, tab.get_tab.call(null).text())
  }
};
