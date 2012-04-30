var COMPILED = false;
var goog = goog || {};
goog.global = this;
goog.DEBUG = true;
goog.LOCALE = "en";
goog.evalWorksForGlobals_ = null;
goog.provide = function(name) {
  if(!COMPILED) {
    if(goog.getObjectByName(name) && !goog.implicitNamespaces_[name]) {
      throw Error('Namespace "' + name + '" already declared.');
    }
    var namespace = name;
    while(namespace = namespace.substring(0, namespace.lastIndexOf("."))) {
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
goog.require = function(rule) {
  if(!COMPILED) {
    if(goog.getObjectByName(rule)) {
      return
    }
    var path = goog.getPathFromDeps_(rule);
    if(path) {
      goog.included_[path] = true;
      goog.writeScripts_()
    }else {
      var errorMessage = "goog.require could not find: " + rule;
      if(goog.global.console) {
        goog.global.console["error"](errorMessage)
      }
      throw Error(errorMessage);
    }
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
if(!COMPILED) {
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
          if(requireName in deps.nameToPath) {
            visitNode(deps.nameToPath[requireName])
          }else {
            if(!goog.getObjectByName(requireName)) {
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
  var context = selfObj || goog.global;
  if(arguments.length > 2) {
    var boundArgs = Array.prototype.slice.call(arguments, 2);
    return function() {
      var newArgs = Array.prototype.slice.call(arguments);
      Array.prototype.unshift.apply(newArgs, boundArgs);
      return fn.apply(context, newArgs)
    }
  }else {
    return function() {
      return fn.apply(context, arguments)
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
goog.setCssNameMapping = function(mapping, style) {
  goog.cssNameMapping_ = mapping;
  goog.cssNameMappingStyle_ = style
};
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
    if("document" in goog.global && !goog.string.contains(str, "<")) {
      return goog.string.unescapeEntitiesUsingDom_(str)
    }else {
      return goog.string.unescapePureXmlEntities_(str)
    }
  }
  return str
};
goog.string.unescapeEntitiesUsingDom_ = function(str) {
  var el = goog.global["document"]["createElement"]("div");
  el["innerHTML"] = "<pre>x" + str + "</pre>";
  if(el["firstChild"][goog.string.NORMALIZE_FN_]) {
    el["firstChild"][goog.string.NORMALIZE_FN_]()
  }
  str = el["firstChild"]["firstChild"]["nodeValue"].slice(1);
  el["innerHTML"] = "";
  return goog.string.canonicalizeNewlines(str)
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
goog.string.NORMALIZE_FN_ = "normalize";
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
  if(opt_trailingChars) {
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
goog.string.specialEscapeChars_ = {"\x00":"\\0", "\u0008":"\\b", "\u000c":"\\f", "\n":"\\n", "\r":"\\r", "\t":"\\t", "\u000b":"\\x0B", '"':'\\"', "\\":"\\\\"};
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
cljs.core._STAR_print_fn_STAR_ = function _STAR_print_fn_STAR_(_) {
  throw new Error("No *print-fn* fn set for evaluation environment");
};
cljs.core.truth_ = function truth_(x) {
  return x != null && x !== false
};
cljs.core.type_satisfies_ = function type_satisfies_(p, x) {
  var or__3824__auto____10597 = p[goog.typeOf.call(null, x)];
  if(cljs.core.truth_(or__3824__auto____10597)) {
    return or__3824__auto____10597
  }else {
    var or__3824__auto____10598 = p["_"];
    if(cljs.core.truth_(or__3824__auto____10598)) {
      return or__3824__auto____10598
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
  var _invoke__10662 = function(this$) {
    if(cljs.core.truth_(function() {
      var and__3822__auto____10599 = this$;
      if(cljs.core.truth_(and__3822__auto____10599)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3822__auto____10599
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$)
    }else {
      return function() {
        var or__3824__auto____10600 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3824__auto____10600)) {
          return or__3824__auto____10600
        }else {
          var or__3824__auto____10601 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3824__auto____10601)) {
            return or__3824__auto____10601
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$)
    }
  };
  var _invoke__10663 = function(this$, a) {
    if(cljs.core.truth_(function() {
      var and__3822__auto____10602 = this$;
      if(cljs.core.truth_(and__3822__auto____10602)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3822__auto____10602
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a)
    }else {
      return function() {
        var or__3824__auto____10603 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3824__auto____10603)) {
          return or__3824__auto____10603
        }else {
          var or__3824__auto____10604 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3824__auto____10604)) {
            return or__3824__auto____10604
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a)
    }
  };
  var _invoke__10664 = function(this$, a, b) {
    if(cljs.core.truth_(function() {
      var and__3822__auto____10605 = this$;
      if(cljs.core.truth_(and__3822__auto____10605)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3822__auto____10605
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b)
    }else {
      return function() {
        var or__3824__auto____10606 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3824__auto____10606)) {
          return or__3824__auto____10606
        }else {
          var or__3824__auto____10607 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3824__auto____10607)) {
            return or__3824__auto____10607
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b)
    }
  };
  var _invoke__10665 = function(this$, a, b, c) {
    if(cljs.core.truth_(function() {
      var and__3822__auto____10608 = this$;
      if(cljs.core.truth_(and__3822__auto____10608)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3822__auto____10608
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c)
    }else {
      return function() {
        var or__3824__auto____10609 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3824__auto____10609)) {
          return or__3824__auto____10609
        }else {
          var or__3824__auto____10610 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3824__auto____10610)) {
            return or__3824__auto____10610
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c)
    }
  };
  var _invoke__10666 = function(this$, a, b, c, d) {
    if(cljs.core.truth_(function() {
      var and__3822__auto____10611 = this$;
      if(cljs.core.truth_(and__3822__auto____10611)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3822__auto____10611
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d)
    }else {
      return function() {
        var or__3824__auto____10612 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3824__auto____10612)) {
          return or__3824__auto____10612
        }else {
          var or__3824__auto____10613 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3824__auto____10613)) {
            return or__3824__auto____10613
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d)
    }
  };
  var _invoke__10667 = function(this$, a, b, c, d, e) {
    if(cljs.core.truth_(function() {
      var and__3822__auto____10614 = this$;
      if(cljs.core.truth_(and__3822__auto____10614)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3822__auto____10614
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e)
    }else {
      return function() {
        var or__3824__auto____10615 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3824__auto____10615)) {
          return or__3824__auto____10615
        }else {
          var or__3824__auto____10616 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3824__auto____10616)) {
            return or__3824__auto____10616
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e)
    }
  };
  var _invoke__10668 = function(this$, a, b, c, d, e, f) {
    if(cljs.core.truth_(function() {
      var and__3822__auto____10617 = this$;
      if(cljs.core.truth_(and__3822__auto____10617)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3822__auto____10617
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f)
    }else {
      return function() {
        var or__3824__auto____10618 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3824__auto____10618)) {
          return or__3824__auto____10618
        }else {
          var or__3824__auto____10619 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3824__auto____10619)) {
            return or__3824__auto____10619
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f)
    }
  };
  var _invoke__10669 = function(this$, a, b, c, d, e, f, g) {
    if(cljs.core.truth_(function() {
      var and__3822__auto____10620 = this$;
      if(cljs.core.truth_(and__3822__auto____10620)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3822__auto____10620
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f, g)
    }else {
      return function() {
        var or__3824__auto____10621 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3824__auto____10621)) {
          return or__3824__auto____10621
        }else {
          var or__3824__auto____10622 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3824__auto____10622)) {
            return or__3824__auto____10622
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g)
    }
  };
  var _invoke__10670 = function(this$, a, b, c, d, e, f, g, h) {
    if(cljs.core.truth_(function() {
      var and__3822__auto____10623 = this$;
      if(cljs.core.truth_(and__3822__auto____10623)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3822__auto____10623
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f, g, h)
    }else {
      return function() {
        var or__3824__auto____10624 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3824__auto____10624)) {
          return or__3824__auto____10624
        }else {
          var or__3824__auto____10625 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3824__auto____10625)) {
            return or__3824__auto____10625
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h)
    }
  };
  var _invoke__10671 = function(this$, a, b, c, d, e, f, g, h, i) {
    if(cljs.core.truth_(function() {
      var and__3822__auto____10626 = this$;
      if(cljs.core.truth_(and__3822__auto____10626)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3822__auto____10626
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f, g, h, i)
    }else {
      return function() {
        var or__3824__auto____10627 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3824__auto____10627)) {
          return or__3824__auto____10627
        }else {
          var or__3824__auto____10628 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3824__auto____10628)) {
            return or__3824__auto____10628
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i)
    }
  };
  var _invoke__10672 = function(this$, a, b, c, d, e, f, g, h, i, j) {
    if(cljs.core.truth_(function() {
      var and__3822__auto____10629 = this$;
      if(cljs.core.truth_(and__3822__auto____10629)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3822__auto____10629
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f, g, h, i, j)
    }else {
      return function() {
        var or__3824__auto____10630 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3824__auto____10630)) {
          return or__3824__auto____10630
        }else {
          var or__3824__auto____10631 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3824__auto____10631)) {
            return or__3824__auto____10631
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j)
    }
  };
  var _invoke__10673 = function(this$, a, b, c, d, e, f, g, h, i, j, k) {
    if(cljs.core.truth_(function() {
      var and__3822__auto____10632 = this$;
      if(cljs.core.truth_(and__3822__auto____10632)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3822__auto____10632
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f, g, h, i, j, k)
    }else {
      return function() {
        var or__3824__auto____10633 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3824__auto____10633)) {
          return or__3824__auto____10633
        }else {
          var or__3824__auto____10634 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3824__auto____10634)) {
            return or__3824__auto____10634
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k)
    }
  };
  var _invoke__10674 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l) {
    if(cljs.core.truth_(function() {
      var and__3822__auto____10635 = this$;
      if(cljs.core.truth_(and__3822__auto____10635)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3822__auto____10635
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f, g, h, i, j, k, l)
    }else {
      return function() {
        var or__3824__auto____10636 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3824__auto____10636)) {
          return or__3824__auto____10636
        }else {
          var or__3824__auto____10637 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3824__auto____10637)) {
            return or__3824__auto____10637
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l)
    }
  };
  var _invoke__10675 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m) {
    if(cljs.core.truth_(function() {
      var and__3822__auto____10638 = this$;
      if(cljs.core.truth_(and__3822__auto____10638)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3822__auto____10638
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f, g, h, i, j, k, l, m)
    }else {
      return function() {
        var or__3824__auto____10639 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3824__auto____10639)) {
          return or__3824__auto____10639
        }else {
          var or__3824__auto____10640 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3824__auto____10640)) {
            return or__3824__auto____10640
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m)
    }
  };
  var _invoke__10676 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n) {
    if(cljs.core.truth_(function() {
      var and__3822__auto____10641 = this$;
      if(cljs.core.truth_(and__3822__auto____10641)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3822__auto____10641
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n)
    }else {
      return function() {
        var or__3824__auto____10642 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3824__auto____10642)) {
          return or__3824__auto____10642
        }else {
          var or__3824__auto____10643 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3824__auto____10643)) {
            return or__3824__auto____10643
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n)
    }
  };
  var _invoke__10677 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o) {
    if(cljs.core.truth_(function() {
      var and__3822__auto____10644 = this$;
      if(cljs.core.truth_(and__3822__auto____10644)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3822__auto____10644
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o)
    }else {
      return function() {
        var or__3824__auto____10645 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3824__auto____10645)) {
          return or__3824__auto____10645
        }else {
          var or__3824__auto____10646 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3824__auto____10646)) {
            return or__3824__auto____10646
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o)
    }
  };
  var _invoke__10678 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p) {
    if(cljs.core.truth_(function() {
      var and__3822__auto____10647 = this$;
      if(cljs.core.truth_(and__3822__auto____10647)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3822__auto____10647
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p)
    }else {
      return function() {
        var or__3824__auto____10648 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3824__auto____10648)) {
          return or__3824__auto____10648
        }else {
          var or__3824__auto____10649 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3824__auto____10649)) {
            return or__3824__auto____10649
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p)
    }
  };
  var _invoke__10679 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q) {
    if(cljs.core.truth_(function() {
      var and__3822__auto____10650 = this$;
      if(cljs.core.truth_(and__3822__auto____10650)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3822__auto____10650
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q)
    }else {
      return function() {
        var or__3824__auto____10651 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3824__auto____10651)) {
          return or__3824__auto____10651
        }else {
          var or__3824__auto____10652 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3824__auto____10652)) {
            return or__3824__auto____10652
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q)
    }
  };
  var _invoke__10680 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s) {
    if(cljs.core.truth_(function() {
      var and__3822__auto____10653 = this$;
      if(cljs.core.truth_(and__3822__auto____10653)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3822__auto____10653
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s)
    }else {
      return function() {
        var or__3824__auto____10654 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3824__auto____10654)) {
          return or__3824__auto____10654
        }else {
          var or__3824__auto____10655 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3824__auto____10655)) {
            return or__3824__auto____10655
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s)
    }
  };
  var _invoke__10681 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t) {
    if(cljs.core.truth_(function() {
      var and__3822__auto____10656 = this$;
      if(cljs.core.truth_(and__3822__auto____10656)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3822__auto____10656
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t)
    }else {
      return function() {
        var or__3824__auto____10657 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3824__auto____10657)) {
          return or__3824__auto____10657
        }else {
          var or__3824__auto____10658 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3824__auto____10658)) {
            return or__3824__auto____10658
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t)
    }
  };
  var _invoke__10682 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest) {
    if(cljs.core.truth_(function() {
      var and__3822__auto____10659 = this$;
      if(cljs.core.truth_(and__3822__auto____10659)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3822__auto____10659
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest)
    }else {
      return function() {
        var or__3824__auto____10660 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3824__auto____10660)) {
          return or__3824__auto____10660
        }else {
          var or__3824__auto____10661 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3824__auto____10661)) {
            return or__3824__auto____10661
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
        return _invoke__10662.call(this, this$);
      case 2:
        return _invoke__10663.call(this, this$, a);
      case 3:
        return _invoke__10664.call(this, this$, a, b);
      case 4:
        return _invoke__10665.call(this, this$, a, b, c);
      case 5:
        return _invoke__10666.call(this, this$, a, b, c, d);
      case 6:
        return _invoke__10667.call(this, this$, a, b, c, d, e);
      case 7:
        return _invoke__10668.call(this, this$, a, b, c, d, e, f);
      case 8:
        return _invoke__10669.call(this, this$, a, b, c, d, e, f, g);
      case 9:
        return _invoke__10670.call(this, this$, a, b, c, d, e, f, g, h);
      case 10:
        return _invoke__10671.call(this, this$, a, b, c, d, e, f, g, h, i);
      case 11:
        return _invoke__10672.call(this, this$, a, b, c, d, e, f, g, h, i, j);
      case 12:
        return _invoke__10673.call(this, this$, a, b, c, d, e, f, g, h, i, j, k);
      case 13:
        return _invoke__10674.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l);
      case 14:
        return _invoke__10675.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m);
      case 15:
        return _invoke__10676.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n);
      case 16:
        return _invoke__10677.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o);
      case 17:
        return _invoke__10678.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p);
      case 18:
        return _invoke__10679.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q);
      case 19:
        return _invoke__10680.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s);
      case 20:
        return _invoke__10681.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t);
      case 21:
        return _invoke__10682.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return _invoke
}();
cljs.core.ICounted = {};
cljs.core._count = function _count(coll) {
  if(cljs.core.truth_(function() {
    var and__3822__auto____10684 = coll;
    if(cljs.core.truth_(and__3822__auto____10684)) {
      return coll.cljs$core$ICounted$_count
    }else {
      return and__3822__auto____10684
    }
  }())) {
    return coll.cljs$core$ICounted$_count(coll)
  }else {
    return function() {
      var or__3824__auto____10685 = cljs.core._count[goog.typeOf.call(null, coll)];
      if(cljs.core.truth_(or__3824__auto____10685)) {
        return or__3824__auto____10685
      }else {
        var or__3824__auto____10686 = cljs.core._count["_"];
        if(cljs.core.truth_(or__3824__auto____10686)) {
          return or__3824__auto____10686
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
    var and__3822__auto____10687 = coll;
    if(cljs.core.truth_(and__3822__auto____10687)) {
      return coll.cljs$core$IEmptyableCollection$_empty
    }else {
      return and__3822__auto____10687
    }
  }())) {
    return coll.cljs$core$IEmptyableCollection$_empty(coll)
  }else {
    return function() {
      var or__3824__auto____10688 = cljs.core._empty[goog.typeOf.call(null, coll)];
      if(cljs.core.truth_(or__3824__auto____10688)) {
        return or__3824__auto____10688
      }else {
        var or__3824__auto____10689 = cljs.core._empty["_"];
        if(cljs.core.truth_(or__3824__auto____10689)) {
          return or__3824__auto____10689
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
    var and__3822__auto____10690 = coll;
    if(cljs.core.truth_(and__3822__auto____10690)) {
      return coll.cljs$core$ICollection$_conj
    }else {
      return and__3822__auto____10690
    }
  }())) {
    return coll.cljs$core$ICollection$_conj(coll, o)
  }else {
    return function() {
      var or__3824__auto____10691 = cljs.core._conj[goog.typeOf.call(null, coll)];
      if(cljs.core.truth_(or__3824__auto____10691)) {
        return or__3824__auto____10691
      }else {
        var or__3824__auto____10692 = cljs.core._conj["_"];
        if(cljs.core.truth_(or__3824__auto____10692)) {
          return or__3824__auto____10692
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
  var _nth__10699 = function(coll, n) {
    if(cljs.core.truth_(function() {
      var and__3822__auto____10693 = coll;
      if(cljs.core.truth_(and__3822__auto____10693)) {
        return coll.cljs$core$IIndexed$_nth
      }else {
        return and__3822__auto____10693
      }
    }())) {
      return coll.cljs$core$IIndexed$_nth(coll, n)
    }else {
      return function() {
        var or__3824__auto____10694 = cljs.core._nth[goog.typeOf.call(null, coll)];
        if(cljs.core.truth_(or__3824__auto____10694)) {
          return or__3824__auto____10694
        }else {
          var or__3824__auto____10695 = cljs.core._nth["_"];
          if(cljs.core.truth_(or__3824__auto____10695)) {
            return or__3824__auto____10695
          }else {
            throw cljs.core.missing_protocol.call(null, "IIndexed.-nth", coll);
          }
        }
      }().call(null, coll, n)
    }
  };
  var _nth__10700 = function(coll, n, not_found) {
    if(cljs.core.truth_(function() {
      var and__3822__auto____10696 = coll;
      if(cljs.core.truth_(and__3822__auto____10696)) {
        return coll.cljs$core$IIndexed$_nth
      }else {
        return and__3822__auto____10696
      }
    }())) {
      return coll.cljs$core$IIndexed$_nth(coll, n, not_found)
    }else {
      return function() {
        var or__3824__auto____10697 = cljs.core._nth[goog.typeOf.call(null, coll)];
        if(cljs.core.truth_(or__3824__auto____10697)) {
          return or__3824__auto____10697
        }else {
          var or__3824__auto____10698 = cljs.core._nth["_"];
          if(cljs.core.truth_(or__3824__auto____10698)) {
            return or__3824__auto____10698
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
        return _nth__10699.call(this, coll, n);
      case 3:
        return _nth__10700.call(this, coll, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return _nth
}();
cljs.core.ISeq = {};
cljs.core._first = function _first(coll) {
  if(cljs.core.truth_(function() {
    var and__3822__auto____10702 = coll;
    if(cljs.core.truth_(and__3822__auto____10702)) {
      return coll.cljs$core$ISeq$_first
    }else {
      return and__3822__auto____10702
    }
  }())) {
    return coll.cljs$core$ISeq$_first(coll)
  }else {
    return function() {
      var or__3824__auto____10703 = cljs.core._first[goog.typeOf.call(null, coll)];
      if(cljs.core.truth_(or__3824__auto____10703)) {
        return or__3824__auto____10703
      }else {
        var or__3824__auto____10704 = cljs.core._first["_"];
        if(cljs.core.truth_(or__3824__auto____10704)) {
          return or__3824__auto____10704
        }else {
          throw cljs.core.missing_protocol.call(null, "ISeq.-first", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._rest = function _rest(coll) {
  if(cljs.core.truth_(function() {
    var and__3822__auto____10705 = coll;
    if(cljs.core.truth_(and__3822__auto____10705)) {
      return coll.cljs$core$ISeq$_rest
    }else {
      return and__3822__auto____10705
    }
  }())) {
    return coll.cljs$core$ISeq$_rest(coll)
  }else {
    return function() {
      var or__3824__auto____10706 = cljs.core._rest[goog.typeOf.call(null, coll)];
      if(cljs.core.truth_(or__3824__auto____10706)) {
        return or__3824__auto____10706
      }else {
        var or__3824__auto____10707 = cljs.core._rest["_"];
        if(cljs.core.truth_(or__3824__auto____10707)) {
          return or__3824__auto____10707
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
  var _lookup__10714 = function(o, k) {
    if(cljs.core.truth_(function() {
      var and__3822__auto____10708 = o;
      if(cljs.core.truth_(and__3822__auto____10708)) {
        return o.cljs$core$ILookup$_lookup
      }else {
        return and__3822__auto____10708
      }
    }())) {
      return o.cljs$core$ILookup$_lookup(o, k)
    }else {
      return function() {
        var or__3824__auto____10709 = cljs.core._lookup[goog.typeOf.call(null, o)];
        if(cljs.core.truth_(or__3824__auto____10709)) {
          return or__3824__auto____10709
        }else {
          var or__3824__auto____10710 = cljs.core._lookup["_"];
          if(cljs.core.truth_(or__3824__auto____10710)) {
            return or__3824__auto____10710
          }else {
            throw cljs.core.missing_protocol.call(null, "ILookup.-lookup", o);
          }
        }
      }().call(null, o, k)
    }
  };
  var _lookup__10715 = function(o, k, not_found) {
    if(cljs.core.truth_(function() {
      var and__3822__auto____10711 = o;
      if(cljs.core.truth_(and__3822__auto____10711)) {
        return o.cljs$core$ILookup$_lookup
      }else {
        return and__3822__auto____10711
      }
    }())) {
      return o.cljs$core$ILookup$_lookup(o, k, not_found)
    }else {
      return function() {
        var or__3824__auto____10712 = cljs.core._lookup[goog.typeOf.call(null, o)];
        if(cljs.core.truth_(or__3824__auto____10712)) {
          return or__3824__auto____10712
        }else {
          var or__3824__auto____10713 = cljs.core._lookup["_"];
          if(cljs.core.truth_(or__3824__auto____10713)) {
            return or__3824__auto____10713
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
        return _lookup__10714.call(this, o, k);
      case 3:
        return _lookup__10715.call(this, o, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return _lookup
}();
cljs.core.IAssociative = {};
cljs.core._contains_key_QMARK_ = function _contains_key_QMARK_(coll, k) {
  if(cljs.core.truth_(function() {
    var and__3822__auto____10717 = coll;
    if(cljs.core.truth_(and__3822__auto____10717)) {
      return coll.cljs$core$IAssociative$_contains_key_QMARK_
    }else {
      return and__3822__auto____10717
    }
  }())) {
    return coll.cljs$core$IAssociative$_contains_key_QMARK_(coll, k)
  }else {
    return function() {
      var or__3824__auto____10718 = cljs.core._contains_key_QMARK_[goog.typeOf.call(null, coll)];
      if(cljs.core.truth_(or__3824__auto____10718)) {
        return or__3824__auto____10718
      }else {
        var or__3824__auto____10719 = cljs.core._contains_key_QMARK_["_"];
        if(cljs.core.truth_(or__3824__auto____10719)) {
          return or__3824__auto____10719
        }else {
          throw cljs.core.missing_protocol.call(null, "IAssociative.-contains-key?", coll);
        }
      }
    }().call(null, coll, k)
  }
};
cljs.core._assoc = function _assoc(coll, k, v) {
  if(cljs.core.truth_(function() {
    var and__3822__auto____10720 = coll;
    if(cljs.core.truth_(and__3822__auto____10720)) {
      return coll.cljs$core$IAssociative$_assoc
    }else {
      return and__3822__auto____10720
    }
  }())) {
    return coll.cljs$core$IAssociative$_assoc(coll, k, v)
  }else {
    return function() {
      var or__3824__auto____10721 = cljs.core._assoc[goog.typeOf.call(null, coll)];
      if(cljs.core.truth_(or__3824__auto____10721)) {
        return or__3824__auto____10721
      }else {
        var or__3824__auto____10722 = cljs.core._assoc["_"];
        if(cljs.core.truth_(or__3824__auto____10722)) {
          return or__3824__auto____10722
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
    var and__3822__auto____10723 = coll;
    if(cljs.core.truth_(and__3822__auto____10723)) {
      return coll.cljs$core$IMap$_dissoc
    }else {
      return and__3822__auto____10723
    }
  }())) {
    return coll.cljs$core$IMap$_dissoc(coll, k)
  }else {
    return function() {
      var or__3824__auto____10724 = cljs.core._dissoc[goog.typeOf.call(null, coll)];
      if(cljs.core.truth_(or__3824__auto____10724)) {
        return or__3824__auto____10724
      }else {
        var or__3824__auto____10725 = cljs.core._dissoc["_"];
        if(cljs.core.truth_(or__3824__auto____10725)) {
          return or__3824__auto____10725
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
    var and__3822__auto____10726 = coll;
    if(cljs.core.truth_(and__3822__auto____10726)) {
      return coll.cljs$core$ISet$_disjoin
    }else {
      return and__3822__auto____10726
    }
  }())) {
    return coll.cljs$core$ISet$_disjoin(coll, v)
  }else {
    return function() {
      var or__3824__auto____10727 = cljs.core._disjoin[goog.typeOf.call(null, coll)];
      if(cljs.core.truth_(or__3824__auto____10727)) {
        return or__3824__auto____10727
      }else {
        var or__3824__auto____10728 = cljs.core._disjoin["_"];
        if(cljs.core.truth_(or__3824__auto____10728)) {
          return or__3824__auto____10728
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
    var and__3822__auto____10729 = coll;
    if(cljs.core.truth_(and__3822__auto____10729)) {
      return coll.cljs$core$IStack$_peek
    }else {
      return and__3822__auto____10729
    }
  }())) {
    return coll.cljs$core$IStack$_peek(coll)
  }else {
    return function() {
      var or__3824__auto____10730 = cljs.core._peek[goog.typeOf.call(null, coll)];
      if(cljs.core.truth_(or__3824__auto____10730)) {
        return or__3824__auto____10730
      }else {
        var or__3824__auto____10731 = cljs.core._peek["_"];
        if(cljs.core.truth_(or__3824__auto____10731)) {
          return or__3824__auto____10731
        }else {
          throw cljs.core.missing_protocol.call(null, "IStack.-peek", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._pop = function _pop(coll) {
  if(cljs.core.truth_(function() {
    var and__3822__auto____10732 = coll;
    if(cljs.core.truth_(and__3822__auto____10732)) {
      return coll.cljs$core$IStack$_pop
    }else {
      return and__3822__auto____10732
    }
  }())) {
    return coll.cljs$core$IStack$_pop(coll)
  }else {
    return function() {
      var or__3824__auto____10733 = cljs.core._pop[goog.typeOf.call(null, coll)];
      if(cljs.core.truth_(or__3824__auto____10733)) {
        return or__3824__auto____10733
      }else {
        var or__3824__auto____10734 = cljs.core._pop["_"];
        if(cljs.core.truth_(or__3824__auto____10734)) {
          return or__3824__auto____10734
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
    var and__3822__auto____10735 = coll;
    if(cljs.core.truth_(and__3822__auto____10735)) {
      return coll.cljs$core$IVector$_assoc_n
    }else {
      return and__3822__auto____10735
    }
  }())) {
    return coll.cljs$core$IVector$_assoc_n(coll, n, val)
  }else {
    return function() {
      var or__3824__auto____10736 = cljs.core._assoc_n[goog.typeOf.call(null, coll)];
      if(cljs.core.truth_(or__3824__auto____10736)) {
        return or__3824__auto____10736
      }else {
        var or__3824__auto____10737 = cljs.core._assoc_n["_"];
        if(cljs.core.truth_(or__3824__auto____10737)) {
          return or__3824__auto____10737
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
    var and__3822__auto____10738 = o;
    if(cljs.core.truth_(and__3822__auto____10738)) {
      return o.cljs$core$IDeref$_deref
    }else {
      return and__3822__auto____10738
    }
  }())) {
    return o.cljs$core$IDeref$_deref(o)
  }else {
    return function() {
      var or__3824__auto____10739 = cljs.core._deref[goog.typeOf.call(null, o)];
      if(cljs.core.truth_(or__3824__auto____10739)) {
        return or__3824__auto____10739
      }else {
        var or__3824__auto____10740 = cljs.core._deref["_"];
        if(cljs.core.truth_(or__3824__auto____10740)) {
          return or__3824__auto____10740
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
    var and__3822__auto____10741 = o;
    if(cljs.core.truth_(and__3822__auto____10741)) {
      return o.cljs$core$IDerefWithTimeout$_deref_with_timeout
    }else {
      return and__3822__auto____10741
    }
  }())) {
    return o.cljs$core$IDerefWithTimeout$_deref_with_timeout(o, msec, timeout_val)
  }else {
    return function() {
      var or__3824__auto____10742 = cljs.core._deref_with_timeout[goog.typeOf.call(null, o)];
      if(cljs.core.truth_(or__3824__auto____10742)) {
        return or__3824__auto____10742
      }else {
        var or__3824__auto____10743 = cljs.core._deref_with_timeout["_"];
        if(cljs.core.truth_(or__3824__auto____10743)) {
          return or__3824__auto____10743
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
    var and__3822__auto____10744 = o;
    if(cljs.core.truth_(and__3822__auto____10744)) {
      return o.cljs$core$IMeta$_meta
    }else {
      return and__3822__auto____10744
    }
  }())) {
    return o.cljs$core$IMeta$_meta(o)
  }else {
    return function() {
      var or__3824__auto____10745 = cljs.core._meta[goog.typeOf.call(null, o)];
      if(cljs.core.truth_(or__3824__auto____10745)) {
        return or__3824__auto____10745
      }else {
        var or__3824__auto____10746 = cljs.core._meta["_"];
        if(cljs.core.truth_(or__3824__auto____10746)) {
          return or__3824__auto____10746
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
    var and__3822__auto____10747 = o;
    if(cljs.core.truth_(and__3822__auto____10747)) {
      return o.cljs$core$IWithMeta$_with_meta
    }else {
      return and__3822__auto____10747
    }
  }())) {
    return o.cljs$core$IWithMeta$_with_meta(o, meta)
  }else {
    return function() {
      var or__3824__auto____10748 = cljs.core._with_meta[goog.typeOf.call(null, o)];
      if(cljs.core.truth_(or__3824__auto____10748)) {
        return or__3824__auto____10748
      }else {
        var or__3824__auto____10749 = cljs.core._with_meta["_"];
        if(cljs.core.truth_(or__3824__auto____10749)) {
          return or__3824__auto____10749
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
  var _reduce__10756 = function(coll, f) {
    if(cljs.core.truth_(function() {
      var and__3822__auto____10750 = coll;
      if(cljs.core.truth_(and__3822__auto____10750)) {
        return coll.cljs$core$IReduce$_reduce
      }else {
        return and__3822__auto____10750
      }
    }())) {
      return coll.cljs$core$IReduce$_reduce(coll, f)
    }else {
      return function() {
        var or__3824__auto____10751 = cljs.core._reduce[goog.typeOf.call(null, coll)];
        if(cljs.core.truth_(or__3824__auto____10751)) {
          return or__3824__auto____10751
        }else {
          var or__3824__auto____10752 = cljs.core._reduce["_"];
          if(cljs.core.truth_(or__3824__auto____10752)) {
            return or__3824__auto____10752
          }else {
            throw cljs.core.missing_protocol.call(null, "IReduce.-reduce", coll);
          }
        }
      }().call(null, coll, f)
    }
  };
  var _reduce__10757 = function(coll, f, start) {
    if(cljs.core.truth_(function() {
      var and__3822__auto____10753 = coll;
      if(cljs.core.truth_(and__3822__auto____10753)) {
        return coll.cljs$core$IReduce$_reduce
      }else {
        return and__3822__auto____10753
      }
    }())) {
      return coll.cljs$core$IReduce$_reduce(coll, f, start)
    }else {
      return function() {
        var or__3824__auto____10754 = cljs.core._reduce[goog.typeOf.call(null, coll)];
        if(cljs.core.truth_(or__3824__auto____10754)) {
          return or__3824__auto____10754
        }else {
          var or__3824__auto____10755 = cljs.core._reduce["_"];
          if(cljs.core.truth_(or__3824__auto____10755)) {
            return or__3824__auto____10755
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
        return _reduce__10756.call(this, coll, f);
      case 3:
        return _reduce__10757.call(this, coll, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return _reduce
}();
cljs.core.IEquiv = {};
cljs.core._equiv = function _equiv(o, other) {
  if(cljs.core.truth_(function() {
    var and__3822__auto____10759 = o;
    if(cljs.core.truth_(and__3822__auto____10759)) {
      return o.cljs$core$IEquiv$_equiv
    }else {
      return and__3822__auto____10759
    }
  }())) {
    return o.cljs$core$IEquiv$_equiv(o, other)
  }else {
    return function() {
      var or__3824__auto____10760 = cljs.core._equiv[goog.typeOf.call(null, o)];
      if(cljs.core.truth_(or__3824__auto____10760)) {
        return or__3824__auto____10760
      }else {
        var or__3824__auto____10761 = cljs.core._equiv["_"];
        if(cljs.core.truth_(or__3824__auto____10761)) {
          return or__3824__auto____10761
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
    var and__3822__auto____10762 = o;
    if(cljs.core.truth_(and__3822__auto____10762)) {
      return o.cljs$core$IHash$_hash
    }else {
      return and__3822__auto____10762
    }
  }())) {
    return o.cljs$core$IHash$_hash(o)
  }else {
    return function() {
      var or__3824__auto____10763 = cljs.core._hash[goog.typeOf.call(null, o)];
      if(cljs.core.truth_(or__3824__auto____10763)) {
        return or__3824__auto____10763
      }else {
        var or__3824__auto____10764 = cljs.core._hash["_"];
        if(cljs.core.truth_(or__3824__auto____10764)) {
          return or__3824__auto____10764
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
    var and__3822__auto____10765 = o;
    if(cljs.core.truth_(and__3822__auto____10765)) {
      return o.cljs$core$ISeqable$_seq
    }else {
      return and__3822__auto____10765
    }
  }())) {
    return o.cljs$core$ISeqable$_seq(o)
  }else {
    return function() {
      var or__3824__auto____10766 = cljs.core._seq[goog.typeOf.call(null, o)];
      if(cljs.core.truth_(or__3824__auto____10766)) {
        return or__3824__auto____10766
      }else {
        var or__3824__auto____10767 = cljs.core._seq["_"];
        if(cljs.core.truth_(or__3824__auto____10767)) {
          return or__3824__auto____10767
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
    var and__3822__auto____10768 = o;
    if(cljs.core.truth_(and__3822__auto____10768)) {
      return o.cljs$core$IPrintable$_pr_seq
    }else {
      return and__3822__auto____10768
    }
  }())) {
    return o.cljs$core$IPrintable$_pr_seq(o, opts)
  }else {
    return function() {
      var or__3824__auto____10769 = cljs.core._pr_seq[goog.typeOf.call(null, o)];
      if(cljs.core.truth_(or__3824__auto____10769)) {
        return or__3824__auto____10769
      }else {
        var or__3824__auto____10770 = cljs.core._pr_seq["_"];
        if(cljs.core.truth_(or__3824__auto____10770)) {
          return or__3824__auto____10770
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
    var and__3822__auto____10771 = d;
    if(cljs.core.truth_(and__3822__auto____10771)) {
      return d.cljs$core$IPending$_realized_QMARK_
    }else {
      return and__3822__auto____10771
    }
  }())) {
    return d.cljs$core$IPending$_realized_QMARK_(d)
  }else {
    return function() {
      var or__3824__auto____10772 = cljs.core._realized_QMARK_[goog.typeOf.call(null, d)];
      if(cljs.core.truth_(or__3824__auto____10772)) {
        return or__3824__auto____10772
      }else {
        var or__3824__auto____10773 = cljs.core._realized_QMARK_["_"];
        if(cljs.core.truth_(or__3824__auto____10773)) {
          return or__3824__auto____10773
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
    var and__3822__auto____10774 = this$;
    if(cljs.core.truth_(and__3822__auto____10774)) {
      return this$.cljs$core$IWatchable$_notify_watches
    }else {
      return and__3822__auto____10774
    }
  }())) {
    return this$.cljs$core$IWatchable$_notify_watches(this$, oldval, newval)
  }else {
    return function() {
      var or__3824__auto____10775 = cljs.core._notify_watches[goog.typeOf.call(null, this$)];
      if(cljs.core.truth_(or__3824__auto____10775)) {
        return or__3824__auto____10775
      }else {
        var or__3824__auto____10776 = cljs.core._notify_watches["_"];
        if(cljs.core.truth_(or__3824__auto____10776)) {
          return or__3824__auto____10776
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-notify-watches", this$);
        }
      }
    }().call(null, this$, oldval, newval)
  }
};
cljs.core._add_watch = function _add_watch(this$, key, f) {
  if(cljs.core.truth_(function() {
    var and__3822__auto____10777 = this$;
    if(cljs.core.truth_(and__3822__auto____10777)) {
      return this$.cljs$core$IWatchable$_add_watch
    }else {
      return and__3822__auto____10777
    }
  }())) {
    return this$.cljs$core$IWatchable$_add_watch(this$, key, f)
  }else {
    return function() {
      var or__3824__auto____10778 = cljs.core._add_watch[goog.typeOf.call(null, this$)];
      if(cljs.core.truth_(or__3824__auto____10778)) {
        return or__3824__auto____10778
      }else {
        var or__3824__auto____10779 = cljs.core._add_watch["_"];
        if(cljs.core.truth_(or__3824__auto____10779)) {
          return or__3824__auto____10779
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-add-watch", this$);
        }
      }
    }().call(null, this$, key, f)
  }
};
cljs.core._remove_watch = function _remove_watch(this$, key) {
  if(cljs.core.truth_(function() {
    var and__3822__auto____10780 = this$;
    if(cljs.core.truth_(and__3822__auto____10780)) {
      return this$.cljs$core$IWatchable$_remove_watch
    }else {
      return and__3822__auto____10780
    }
  }())) {
    return this$.cljs$core$IWatchable$_remove_watch(this$, key)
  }else {
    return function() {
      var or__3824__auto____10781 = cljs.core._remove_watch[goog.typeOf.call(null, this$)];
      if(cljs.core.truth_(or__3824__auto____10781)) {
        return or__3824__auto____10781
      }else {
        var or__3824__auto____10782 = cljs.core._remove_watch["_"];
        if(cljs.core.truth_(or__3824__auto____10782)) {
          return or__3824__auto____10782
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
  var G__10783 = null;
  var G__10783__10784 = function(o, k) {
    return null
  };
  var G__10783__10785 = function(o, k, not_found) {
    return not_found
  };
  G__10783 = function(o, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__10783__10784.call(this, o, k);
      case 3:
        return G__10783__10785.call(this, o, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__10783
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
  var G__10787 = null;
  var G__10787__10788 = function(_, f) {
    return f.call(null)
  };
  var G__10787__10789 = function(_, f, start) {
    return start
  };
  G__10787 = function(_, f, start) {
    switch(arguments.length) {
      case 2:
        return G__10787__10788.call(this, _, f);
      case 3:
        return G__10787__10789.call(this, _, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__10787
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
  var G__10791 = null;
  var G__10791__10792 = function(_, n) {
    return null
  };
  var G__10791__10793 = function(_, n, not_found) {
    return not_found
  };
  G__10791 = function(_, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__10791__10792.call(this, _, n);
      case 3:
        return G__10791__10793.call(this, _, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__10791
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
  var ci_reduce__10801 = function(cicoll, f) {
    if(cljs.core.truth_(cljs.core._EQ_.call(null, 0, cljs.core._count.call(null, cicoll)))) {
      return f.call(null)
    }else {
      var val__10795 = cljs.core._nth.call(null, cicoll, 0);
      var n__10796 = 1;
      while(true) {
        if(cljs.core.truth_(n__10796 < cljs.core._count.call(null, cicoll))) {
          var G__10805 = f.call(null, val__10795, cljs.core._nth.call(null, cicoll, n__10796));
          var G__10806 = n__10796 + 1;
          val__10795 = G__10805;
          n__10796 = G__10806;
          continue
        }else {
          return val__10795
        }
        break
      }
    }
  };
  var ci_reduce__10802 = function(cicoll, f, val) {
    var val__10797 = val;
    var n__10798 = 0;
    while(true) {
      if(cljs.core.truth_(n__10798 < cljs.core._count.call(null, cicoll))) {
        var G__10807 = f.call(null, val__10797, cljs.core._nth.call(null, cicoll, n__10798));
        var G__10808 = n__10798 + 1;
        val__10797 = G__10807;
        n__10798 = G__10808;
        continue
      }else {
        return val__10797
      }
      break
    }
  };
  var ci_reduce__10803 = function(cicoll, f, val, idx) {
    var val__10799 = val;
    var n__10800 = idx;
    while(true) {
      if(cljs.core.truth_(n__10800 < cljs.core._count.call(null, cicoll))) {
        var G__10809 = f.call(null, val__10799, cljs.core._nth.call(null, cicoll, n__10800));
        var G__10810 = n__10800 + 1;
        val__10799 = G__10809;
        n__10800 = G__10810;
        continue
      }else {
        return val__10799
      }
      break
    }
  };
  ci_reduce = function(cicoll, f, val, idx) {
    switch(arguments.length) {
      case 2:
        return ci_reduce__10801.call(this, cicoll, f);
      case 3:
        return ci_reduce__10802.call(this, cicoll, f, val);
      case 4:
        return ci_reduce__10803.call(this, cicoll, f, val, idx)
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
  var this__10811 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.IndexedSeq.prototype.cljs$core$IReduce$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$IReduce$_reduce = function() {
  var G__10824 = null;
  var G__10824__10825 = function(_, f) {
    var this__10812 = this;
    return cljs.core.ci_reduce.call(null, this__10812.a, f, this__10812.a[this__10812.i], this__10812.i + 1)
  };
  var G__10824__10826 = function(_, f, start) {
    var this__10813 = this;
    return cljs.core.ci_reduce.call(null, this__10813.a, f, start, this__10813.i)
  };
  G__10824 = function(_, f, start) {
    switch(arguments.length) {
      case 2:
        return G__10824__10825.call(this, _, f);
      case 3:
        return G__10824__10826.call(this, _, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__10824
}();
cljs.core.IndexedSeq.prototype.cljs$core$ICollection$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$ICollection$_conj = function(coll, o) {
  var this__10814 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.IndexedSeq.prototype.cljs$core$IEquiv$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$IEquiv$_equiv = function(coll, other) {
  var this__10815 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.IndexedSeq.prototype.cljs$core$ISequential$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$IIndexed$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$IIndexed$_nth = function() {
  var G__10828 = null;
  var G__10828__10829 = function(coll, n) {
    var this__10816 = this;
    var i__10817 = n + this__10816.i;
    if(cljs.core.truth_(i__10817 < this__10816.a.length)) {
      return this__10816.a[i__10817]
    }else {
      return null
    }
  };
  var G__10828__10830 = function(coll, n, not_found) {
    var this__10818 = this;
    var i__10819 = n + this__10818.i;
    if(cljs.core.truth_(i__10819 < this__10818.a.length)) {
      return this__10818.a[i__10819]
    }else {
      return not_found
    }
  };
  G__10828 = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__10828__10829.call(this, coll, n);
      case 3:
        return G__10828__10830.call(this, coll, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__10828
}();
cljs.core.IndexedSeq.prototype.cljs$core$ICounted$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$ICounted$_count = function(_) {
  var this__10820 = this;
  return this__10820.a.length - this__10820.i
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeq$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$ISeq$_first = function(_) {
  var this__10821 = this;
  return this__10821.a[this__10821.i]
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeq$_rest = function(_) {
  var this__10822 = this;
  if(cljs.core.truth_(this__10822.i + 1 < this__10822.a.length)) {
    return new cljs.core.IndexedSeq(this__10822.a, this__10822.i + 1)
  }else {
    return cljs.core.list.call(null)
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeqable$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$ISeqable$_seq = function(this$) {
  var this__10823 = this;
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
  var G__10832 = null;
  var G__10832__10833 = function(array, f) {
    return cljs.core.ci_reduce.call(null, array, f)
  };
  var G__10832__10834 = function(array, f, start) {
    return cljs.core.ci_reduce.call(null, array, f, start)
  };
  G__10832 = function(array, f, start) {
    switch(arguments.length) {
      case 2:
        return G__10832__10833.call(this, array, f);
      case 3:
        return G__10832__10834.call(this, array, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__10832
}();
cljs.core.ILookup["array"] = true;
cljs.core._lookup["array"] = function() {
  var G__10836 = null;
  var G__10836__10837 = function(array, k) {
    return array[k]
  };
  var G__10836__10838 = function(array, k, not_found) {
    return cljs.core._nth.call(null, array, k, not_found)
  };
  G__10836 = function(array, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__10836__10837.call(this, array, k);
      case 3:
        return G__10836__10838.call(this, array, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__10836
}();
cljs.core.IIndexed["array"] = true;
cljs.core._nth["array"] = function() {
  var G__10840 = null;
  var G__10840__10841 = function(array, n) {
    if(cljs.core.truth_(n < array.length)) {
      return array[n]
    }else {
      return null
    }
  };
  var G__10840__10842 = function(array, n, not_found) {
    if(cljs.core.truth_(n < array.length)) {
      return array[n]
    }else {
      return not_found
    }
  };
  G__10840 = function(array, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__10840__10841.call(this, array, n);
      case 3:
        return G__10840__10842.call(this, array, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__10840
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
  var temp__3974__auto____10844 = cljs.core.seq.call(null, coll);
  if(cljs.core.truth_(temp__3974__auto____10844)) {
    var s__10845 = temp__3974__auto____10844;
    return cljs.core._first.call(null, s__10845)
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
      var G__10846 = cljs.core.next.call(null, s);
      s = G__10846;
      continue
    }else {
      return cljs.core.first.call(null, s)
    }
    break
  }
};
cljs.core.ICounted["_"] = true;
cljs.core._count["_"] = function(x) {
  var s__10847 = cljs.core.seq.call(null, x);
  var n__10848 = 0;
  while(true) {
    if(cljs.core.truth_(s__10847)) {
      var G__10849 = cljs.core.next.call(null, s__10847);
      var G__10850 = n__10848 + 1;
      s__10847 = G__10849;
      n__10848 = G__10850;
      continue
    }else {
      return n__10848
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
  var conj__10851 = function(coll, x) {
    return cljs.core._conj.call(null, coll, x)
  };
  var conj__10852 = function() {
    var G__10854__delegate = function(coll, x, xs) {
      while(true) {
        if(cljs.core.truth_(xs)) {
          var G__10855 = conj.call(null, coll, x);
          var G__10856 = cljs.core.first.call(null, xs);
          var G__10857 = cljs.core.next.call(null, xs);
          coll = G__10855;
          x = G__10856;
          xs = G__10857;
          continue
        }else {
          return conj.call(null, coll, x)
        }
        break
      }
    };
    var G__10854 = function(coll, x, var_args) {
      var xs = null;
      if(goog.isDef(var_args)) {
        xs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__10854__delegate.call(this, coll, x, xs)
    };
    G__10854.cljs$lang$maxFixedArity = 2;
    G__10854.cljs$lang$applyTo = function(arglist__10858) {
      var coll = cljs.core.first(arglist__10858);
      var x = cljs.core.first(cljs.core.next(arglist__10858));
      var xs = cljs.core.rest(cljs.core.next(arglist__10858));
      return G__10854__delegate.call(this, coll, x, xs)
    };
    return G__10854
  }();
  conj = function(coll, x, var_args) {
    var xs = var_args;
    switch(arguments.length) {
      case 2:
        return conj__10851.call(this, coll, x);
      default:
        return conj__10852.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  conj.cljs$lang$maxFixedArity = 2;
  conj.cljs$lang$applyTo = conj__10852.cljs$lang$applyTo;
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
  var nth__10859 = function(coll, n) {
    return cljs.core._nth.call(null, coll, Math.floor(n))
  };
  var nth__10860 = function(coll, n, not_found) {
    return cljs.core._nth.call(null, coll, Math.floor(n), not_found)
  };
  nth = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return nth__10859.call(this, coll, n);
      case 3:
        return nth__10860.call(this, coll, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return nth
}();
cljs.core.get = function() {
  var get = null;
  var get__10862 = function(o, k) {
    return cljs.core._lookup.call(null, o, k)
  };
  var get__10863 = function(o, k, not_found) {
    return cljs.core._lookup.call(null, o, k, not_found)
  };
  get = function(o, k, not_found) {
    switch(arguments.length) {
      case 2:
        return get__10862.call(this, o, k);
      case 3:
        return get__10863.call(this, o, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return get
}();
cljs.core.assoc = function() {
  var assoc = null;
  var assoc__10866 = function(coll, k, v) {
    return cljs.core._assoc.call(null, coll, k, v)
  };
  var assoc__10867 = function() {
    var G__10869__delegate = function(coll, k, v, kvs) {
      while(true) {
        var ret__10865 = assoc.call(null, coll, k, v);
        if(cljs.core.truth_(kvs)) {
          var G__10870 = ret__10865;
          var G__10871 = cljs.core.first.call(null, kvs);
          var G__10872 = cljs.core.second.call(null, kvs);
          var G__10873 = cljs.core.nnext.call(null, kvs);
          coll = G__10870;
          k = G__10871;
          v = G__10872;
          kvs = G__10873;
          continue
        }else {
          return ret__10865
        }
        break
      }
    };
    var G__10869 = function(coll, k, v, var_args) {
      var kvs = null;
      if(goog.isDef(var_args)) {
        kvs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__10869__delegate.call(this, coll, k, v, kvs)
    };
    G__10869.cljs$lang$maxFixedArity = 3;
    G__10869.cljs$lang$applyTo = function(arglist__10874) {
      var coll = cljs.core.first(arglist__10874);
      var k = cljs.core.first(cljs.core.next(arglist__10874));
      var v = cljs.core.first(cljs.core.next(cljs.core.next(arglist__10874)));
      var kvs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__10874)));
      return G__10869__delegate.call(this, coll, k, v, kvs)
    };
    return G__10869
  }();
  assoc = function(coll, k, v, var_args) {
    var kvs = var_args;
    switch(arguments.length) {
      case 3:
        return assoc__10866.call(this, coll, k, v);
      default:
        return assoc__10867.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  assoc.cljs$lang$maxFixedArity = 3;
  assoc.cljs$lang$applyTo = assoc__10867.cljs$lang$applyTo;
  return assoc
}();
cljs.core.dissoc = function() {
  var dissoc = null;
  var dissoc__10876 = function(coll) {
    return coll
  };
  var dissoc__10877 = function(coll, k) {
    return cljs.core._dissoc.call(null, coll, k)
  };
  var dissoc__10878 = function() {
    var G__10880__delegate = function(coll, k, ks) {
      while(true) {
        var ret__10875 = dissoc.call(null, coll, k);
        if(cljs.core.truth_(ks)) {
          var G__10881 = ret__10875;
          var G__10882 = cljs.core.first.call(null, ks);
          var G__10883 = cljs.core.next.call(null, ks);
          coll = G__10881;
          k = G__10882;
          ks = G__10883;
          continue
        }else {
          return ret__10875
        }
        break
      }
    };
    var G__10880 = function(coll, k, var_args) {
      var ks = null;
      if(goog.isDef(var_args)) {
        ks = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__10880__delegate.call(this, coll, k, ks)
    };
    G__10880.cljs$lang$maxFixedArity = 2;
    G__10880.cljs$lang$applyTo = function(arglist__10884) {
      var coll = cljs.core.first(arglist__10884);
      var k = cljs.core.first(cljs.core.next(arglist__10884));
      var ks = cljs.core.rest(cljs.core.next(arglist__10884));
      return G__10880__delegate.call(this, coll, k, ks)
    };
    return G__10880
  }();
  dissoc = function(coll, k, var_args) {
    var ks = var_args;
    switch(arguments.length) {
      case 1:
        return dissoc__10876.call(this, coll);
      case 2:
        return dissoc__10877.call(this, coll, k);
      default:
        return dissoc__10878.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  dissoc.cljs$lang$maxFixedArity = 2;
  dissoc.cljs$lang$applyTo = dissoc__10878.cljs$lang$applyTo;
  return dissoc
}();
cljs.core.with_meta = function with_meta(o, meta) {
  return cljs.core._with_meta.call(null, o, meta)
};
cljs.core.meta = function meta(o) {
  if(cljs.core.truth_(function() {
    var x__451__auto____10885 = o;
    if(cljs.core.truth_(function() {
      var and__3822__auto____10886 = x__451__auto____10885;
      if(cljs.core.truth_(and__3822__auto____10886)) {
        var and__3822__auto____10887 = x__451__auto____10885.cljs$core$IMeta$;
        if(cljs.core.truth_(and__3822__auto____10887)) {
          return cljs.core.not.call(null, x__451__auto____10885.hasOwnProperty("cljs$core$IMeta$"))
        }else {
          return and__3822__auto____10887
        }
      }else {
        return and__3822__auto____10886
      }
    }())) {
      return true
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, x__451__auto____10885)
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
  var disj__10889 = function(coll) {
    return coll
  };
  var disj__10890 = function(coll, k) {
    return cljs.core._disjoin.call(null, coll, k)
  };
  var disj__10891 = function() {
    var G__10893__delegate = function(coll, k, ks) {
      while(true) {
        var ret__10888 = disj.call(null, coll, k);
        if(cljs.core.truth_(ks)) {
          var G__10894 = ret__10888;
          var G__10895 = cljs.core.first.call(null, ks);
          var G__10896 = cljs.core.next.call(null, ks);
          coll = G__10894;
          k = G__10895;
          ks = G__10896;
          continue
        }else {
          return ret__10888
        }
        break
      }
    };
    var G__10893 = function(coll, k, var_args) {
      var ks = null;
      if(goog.isDef(var_args)) {
        ks = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__10893__delegate.call(this, coll, k, ks)
    };
    G__10893.cljs$lang$maxFixedArity = 2;
    G__10893.cljs$lang$applyTo = function(arglist__10897) {
      var coll = cljs.core.first(arglist__10897);
      var k = cljs.core.first(cljs.core.next(arglist__10897));
      var ks = cljs.core.rest(cljs.core.next(arglist__10897));
      return G__10893__delegate.call(this, coll, k, ks)
    };
    return G__10893
  }();
  disj = function(coll, k, var_args) {
    var ks = var_args;
    switch(arguments.length) {
      case 1:
        return disj__10889.call(this, coll);
      case 2:
        return disj__10890.call(this, coll, k);
      default:
        return disj__10891.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  disj.cljs$lang$maxFixedArity = 2;
  disj.cljs$lang$applyTo = disj__10891.cljs$lang$applyTo;
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
    var x__451__auto____10898 = x;
    if(cljs.core.truth_(function() {
      var and__3822__auto____10899 = x__451__auto____10898;
      if(cljs.core.truth_(and__3822__auto____10899)) {
        var and__3822__auto____10900 = x__451__auto____10898.cljs$core$ICollection$;
        if(cljs.core.truth_(and__3822__auto____10900)) {
          return cljs.core.not.call(null, x__451__auto____10898.hasOwnProperty("cljs$core$ICollection$"))
        }else {
          return and__3822__auto____10900
        }
      }else {
        return and__3822__auto____10899
      }
    }())) {
      return true
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ICollection, x__451__auto____10898)
    }
  }
};
cljs.core.set_QMARK_ = function set_QMARK_(x) {
  if(cljs.core.truth_(x === null)) {
    return false
  }else {
    var x__451__auto____10901 = x;
    if(cljs.core.truth_(function() {
      var and__3822__auto____10902 = x__451__auto____10901;
      if(cljs.core.truth_(and__3822__auto____10902)) {
        var and__3822__auto____10903 = x__451__auto____10901.cljs$core$ISet$;
        if(cljs.core.truth_(and__3822__auto____10903)) {
          return cljs.core.not.call(null, x__451__auto____10901.hasOwnProperty("cljs$core$ISet$"))
        }else {
          return and__3822__auto____10903
        }
      }else {
        return and__3822__auto____10902
      }
    }())) {
      return true
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ISet, x__451__auto____10901)
    }
  }
};
cljs.core.associative_QMARK_ = function associative_QMARK_(x) {
  var x__451__auto____10904 = x;
  if(cljs.core.truth_(function() {
    var and__3822__auto____10905 = x__451__auto____10904;
    if(cljs.core.truth_(and__3822__auto____10905)) {
      var and__3822__auto____10906 = x__451__auto____10904.cljs$core$IAssociative$;
      if(cljs.core.truth_(and__3822__auto____10906)) {
        return cljs.core.not.call(null, x__451__auto____10904.hasOwnProperty("cljs$core$IAssociative$"))
      }else {
        return and__3822__auto____10906
      }
    }else {
      return and__3822__auto____10905
    }
  }())) {
    return true
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IAssociative, x__451__auto____10904)
  }
};
cljs.core.sequential_QMARK_ = function sequential_QMARK_(x) {
  var x__451__auto____10907 = x;
  if(cljs.core.truth_(function() {
    var and__3822__auto____10908 = x__451__auto____10907;
    if(cljs.core.truth_(and__3822__auto____10908)) {
      var and__3822__auto____10909 = x__451__auto____10907.cljs$core$ISequential$;
      if(cljs.core.truth_(and__3822__auto____10909)) {
        return cljs.core.not.call(null, x__451__auto____10907.hasOwnProperty("cljs$core$ISequential$"))
      }else {
        return and__3822__auto____10909
      }
    }else {
      return and__3822__auto____10908
    }
  }())) {
    return true
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ISequential, x__451__auto____10907)
  }
};
cljs.core.counted_QMARK_ = function counted_QMARK_(x) {
  var x__451__auto____10910 = x;
  if(cljs.core.truth_(function() {
    var and__3822__auto____10911 = x__451__auto____10910;
    if(cljs.core.truth_(and__3822__auto____10911)) {
      var and__3822__auto____10912 = x__451__auto____10910.cljs$core$ICounted$;
      if(cljs.core.truth_(and__3822__auto____10912)) {
        return cljs.core.not.call(null, x__451__auto____10910.hasOwnProperty("cljs$core$ICounted$"))
      }else {
        return and__3822__auto____10912
      }
    }else {
      return and__3822__auto____10911
    }
  }())) {
    return true
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ICounted, x__451__auto____10910)
  }
};
cljs.core.map_QMARK_ = function map_QMARK_(x) {
  if(cljs.core.truth_(x === null)) {
    return false
  }else {
    var x__451__auto____10913 = x;
    if(cljs.core.truth_(function() {
      var and__3822__auto____10914 = x__451__auto____10913;
      if(cljs.core.truth_(and__3822__auto____10914)) {
        var and__3822__auto____10915 = x__451__auto____10913.cljs$core$IMap$;
        if(cljs.core.truth_(and__3822__auto____10915)) {
          return cljs.core.not.call(null, x__451__auto____10913.hasOwnProperty("cljs$core$IMap$"))
        }else {
          return and__3822__auto____10915
        }
      }else {
        return and__3822__auto____10914
      }
    }())) {
      return true
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IMap, x__451__auto____10913)
    }
  }
};
cljs.core.vector_QMARK_ = function vector_QMARK_(x) {
  var x__451__auto____10916 = x;
  if(cljs.core.truth_(function() {
    var and__3822__auto____10917 = x__451__auto____10916;
    if(cljs.core.truth_(and__3822__auto____10917)) {
      var and__3822__auto____10918 = x__451__auto____10916.cljs$core$IVector$;
      if(cljs.core.truth_(and__3822__auto____10918)) {
        return cljs.core.not.call(null, x__451__auto____10916.hasOwnProperty("cljs$core$IVector$"))
      }else {
        return and__3822__auto____10918
      }
    }else {
      return and__3822__auto____10917
    }
  }())) {
    return true
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IVector, x__451__auto____10916)
  }
};
cljs.core.js_obj = function js_obj() {
  return{}
};
cljs.core.js_keys = function js_keys(obj) {
  var keys__10919 = [];
  goog.object.forEach.call(null, obj, function(val, key, obj) {
    return keys__10919.push(key)
  });
  return keys__10919
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
    var x__451__auto____10920 = s;
    if(cljs.core.truth_(function() {
      var and__3822__auto____10921 = x__451__auto____10920;
      if(cljs.core.truth_(and__3822__auto____10921)) {
        var and__3822__auto____10922 = x__451__auto____10920.cljs$core$ISeq$;
        if(cljs.core.truth_(and__3822__auto____10922)) {
          return cljs.core.not.call(null, x__451__auto____10920.hasOwnProperty("cljs$core$ISeq$"))
        }else {
          return and__3822__auto____10922
        }
      }else {
        return and__3822__auto____10921
      }
    }())) {
      return true
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, x__451__auto____10920)
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
  var and__3822__auto____10923 = goog.isString.call(null, x);
  if(cljs.core.truth_(and__3822__auto____10923)) {
    return cljs.core.not.call(null, function() {
      var or__3824__auto____10924 = cljs.core._EQ_.call(null, x.charAt(0), "\ufdd0");
      if(cljs.core.truth_(or__3824__auto____10924)) {
        return or__3824__auto____10924
      }else {
        return cljs.core._EQ_.call(null, x.charAt(0), "\ufdd1")
      }
    }())
  }else {
    return and__3822__auto____10923
  }
};
cljs.core.keyword_QMARK_ = function keyword_QMARK_(x) {
  var and__3822__auto____10925 = goog.isString.call(null, x);
  if(cljs.core.truth_(and__3822__auto____10925)) {
    return cljs.core._EQ_.call(null, x.charAt(0), "\ufdd0")
  }else {
    return and__3822__auto____10925
  }
};
cljs.core.symbol_QMARK_ = function symbol_QMARK_(x) {
  var and__3822__auto____10926 = goog.isString.call(null, x);
  if(cljs.core.truth_(and__3822__auto____10926)) {
    return cljs.core._EQ_.call(null, x.charAt(0), "\ufdd1")
  }else {
    return and__3822__auto____10926
  }
};
cljs.core.number_QMARK_ = function number_QMARK_(n) {
  return goog.isNumber.call(null, n)
};
cljs.core.fn_QMARK_ = function fn_QMARK_(f) {
  return goog.isFunction.call(null, f)
};
cljs.core.integer_QMARK_ = function integer_QMARK_(n) {
  var and__3822__auto____10927 = cljs.core.number_QMARK_.call(null, n);
  if(cljs.core.truth_(and__3822__auto____10927)) {
    return n == n.toFixed()
  }else {
    return and__3822__auto____10927
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
    var and__3822__auto____10928 = coll;
    if(cljs.core.truth_(and__3822__auto____10928)) {
      var and__3822__auto____10929 = cljs.core.associative_QMARK_.call(null, coll);
      if(cljs.core.truth_(and__3822__auto____10929)) {
        return cljs.core.contains_QMARK_.call(null, coll, k)
      }else {
        return and__3822__auto____10929
      }
    }else {
      return and__3822__auto____10928
    }
  }())) {
    return cljs.core.PersistentVector.fromArray([k, cljs.core._lookup.call(null, coll, k)])
  }else {
    return null
  }
};
cljs.core.distinct_QMARK_ = function() {
  var distinct_QMARK_ = null;
  var distinct_QMARK___10934 = function(x) {
    return true
  };
  var distinct_QMARK___10935 = function(x, y) {
    return cljs.core.not.call(null, cljs.core._EQ_.call(null, x, y))
  };
  var distinct_QMARK___10936 = function() {
    var G__10938__delegate = function(x, y, more) {
      if(cljs.core.truth_(cljs.core.not.call(null, cljs.core._EQ_.call(null, x, y)))) {
        var s__10930 = cljs.core.set([y, x]);
        var xs__10931 = more;
        while(true) {
          var x__10932 = cljs.core.first.call(null, xs__10931);
          var etc__10933 = cljs.core.next.call(null, xs__10931);
          if(cljs.core.truth_(xs__10931)) {
            if(cljs.core.truth_(cljs.core.contains_QMARK_.call(null, s__10930, x__10932))) {
              return false
            }else {
              var G__10939 = cljs.core.conj.call(null, s__10930, x__10932);
              var G__10940 = etc__10933;
              s__10930 = G__10939;
              xs__10931 = G__10940;
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
    var G__10938 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__10938__delegate.call(this, x, y, more)
    };
    G__10938.cljs$lang$maxFixedArity = 2;
    G__10938.cljs$lang$applyTo = function(arglist__10941) {
      var x = cljs.core.first(arglist__10941);
      var y = cljs.core.first(cljs.core.next(arglist__10941));
      var more = cljs.core.rest(cljs.core.next(arglist__10941));
      return G__10938__delegate.call(this, x, y, more)
    };
    return G__10938
  }();
  distinct_QMARK_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return distinct_QMARK___10934.call(this, x);
      case 2:
        return distinct_QMARK___10935.call(this, x, y);
      default:
        return distinct_QMARK___10936.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  distinct_QMARK_.cljs$lang$maxFixedArity = 2;
  distinct_QMARK_.cljs$lang$applyTo = distinct_QMARK___10936.cljs$lang$applyTo;
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
      var r__10942 = f.call(null, x, y);
      if(cljs.core.truth_(cljs.core.number_QMARK_.call(null, r__10942))) {
        return r__10942
      }else {
        if(cljs.core.truth_(r__10942)) {
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
  var sort__10944 = function(coll) {
    return sort.call(null, cljs.core.compare, coll)
  };
  var sort__10945 = function(comp, coll) {
    if(cljs.core.truth_(cljs.core.seq.call(null, coll))) {
      var a__10943 = cljs.core.to_array.call(null, coll);
      goog.array.stableSort.call(null, a__10943, cljs.core.fn__GT_comparator.call(null, comp));
      return cljs.core.seq.call(null, a__10943)
    }else {
      return cljs.core.List.EMPTY
    }
  };
  sort = function(comp, coll) {
    switch(arguments.length) {
      case 1:
        return sort__10944.call(this, comp);
      case 2:
        return sort__10945.call(this, comp, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return sort
}();
cljs.core.sort_by = function() {
  var sort_by = null;
  var sort_by__10947 = function(keyfn, coll) {
    return sort_by.call(null, keyfn, cljs.core.compare, coll)
  };
  var sort_by__10948 = function(keyfn, comp, coll) {
    return cljs.core.sort.call(null, function(x, y) {
      return cljs.core.fn__GT_comparator.call(null, comp).call(null, keyfn.call(null, x), keyfn.call(null, y))
    }, coll)
  };
  sort_by = function(keyfn, comp, coll) {
    switch(arguments.length) {
      case 2:
        return sort_by__10947.call(this, keyfn, comp);
      case 3:
        return sort_by__10948.call(this, keyfn, comp, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return sort_by
}();
cljs.core.reduce = function() {
  var reduce = null;
  var reduce__10950 = function(f, coll) {
    return cljs.core._reduce.call(null, coll, f)
  };
  var reduce__10951 = function(f, val, coll) {
    return cljs.core._reduce.call(null, coll, f, val)
  };
  reduce = function(f, val, coll) {
    switch(arguments.length) {
      case 2:
        return reduce__10950.call(this, f, val);
      case 3:
        return reduce__10951.call(this, f, val, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return reduce
}();
cljs.core.seq_reduce = function() {
  var seq_reduce = null;
  var seq_reduce__10957 = function(f, coll) {
    var temp__3971__auto____10953 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3971__auto____10953)) {
      var s__10954 = temp__3971__auto____10953;
      return cljs.core.reduce.call(null, f, cljs.core.first.call(null, s__10954), cljs.core.next.call(null, s__10954))
    }else {
      return f.call(null)
    }
  };
  var seq_reduce__10958 = function(f, val, coll) {
    var val__10955 = val;
    var coll__10956 = cljs.core.seq.call(null, coll);
    while(true) {
      if(cljs.core.truth_(coll__10956)) {
        var G__10960 = f.call(null, val__10955, cljs.core.first.call(null, coll__10956));
        var G__10961 = cljs.core.next.call(null, coll__10956);
        val__10955 = G__10960;
        coll__10956 = G__10961;
        continue
      }else {
        return val__10955
      }
      break
    }
  };
  seq_reduce = function(f, val, coll) {
    switch(arguments.length) {
      case 2:
        return seq_reduce__10957.call(this, f, val);
      case 3:
        return seq_reduce__10958.call(this, f, val, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return seq_reduce
}();
cljs.core.IReduce["_"] = true;
cljs.core._reduce["_"] = function() {
  var G__10962 = null;
  var G__10962__10963 = function(coll, f) {
    return cljs.core.seq_reduce.call(null, f, coll)
  };
  var G__10962__10964 = function(coll, f, start) {
    return cljs.core.seq_reduce.call(null, f, start, coll)
  };
  G__10962 = function(coll, f, start) {
    switch(arguments.length) {
      case 2:
        return G__10962__10963.call(this, coll, f);
      case 3:
        return G__10962__10964.call(this, coll, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__10962
}();
cljs.core._PLUS_ = function() {
  var _PLUS_ = null;
  var _PLUS___10966 = function() {
    return 0
  };
  var _PLUS___10967 = function(x) {
    return x
  };
  var _PLUS___10968 = function(x, y) {
    return x + y
  };
  var _PLUS___10969 = function() {
    var G__10971__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _PLUS_, x + y, more)
    };
    var G__10971 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__10971__delegate.call(this, x, y, more)
    };
    G__10971.cljs$lang$maxFixedArity = 2;
    G__10971.cljs$lang$applyTo = function(arglist__10972) {
      var x = cljs.core.first(arglist__10972);
      var y = cljs.core.first(cljs.core.next(arglist__10972));
      var more = cljs.core.rest(cljs.core.next(arglist__10972));
      return G__10971__delegate.call(this, x, y, more)
    };
    return G__10971
  }();
  _PLUS_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 0:
        return _PLUS___10966.call(this);
      case 1:
        return _PLUS___10967.call(this, x);
      case 2:
        return _PLUS___10968.call(this, x, y);
      default:
        return _PLUS___10969.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _PLUS_.cljs$lang$maxFixedArity = 2;
  _PLUS_.cljs$lang$applyTo = _PLUS___10969.cljs$lang$applyTo;
  return _PLUS_
}();
cljs.core._ = function() {
  var _ = null;
  var ___10973 = function(x) {
    return-x
  };
  var ___10974 = function(x, y) {
    return x - y
  };
  var ___10975 = function() {
    var G__10977__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _, x - y, more)
    };
    var G__10977 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__10977__delegate.call(this, x, y, more)
    };
    G__10977.cljs$lang$maxFixedArity = 2;
    G__10977.cljs$lang$applyTo = function(arglist__10978) {
      var x = cljs.core.first(arglist__10978);
      var y = cljs.core.first(cljs.core.next(arglist__10978));
      var more = cljs.core.rest(cljs.core.next(arglist__10978));
      return G__10977__delegate.call(this, x, y, more)
    };
    return G__10977
  }();
  _ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return ___10973.call(this, x);
      case 2:
        return ___10974.call(this, x, y);
      default:
        return ___10975.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _.cljs$lang$maxFixedArity = 2;
  _.cljs$lang$applyTo = ___10975.cljs$lang$applyTo;
  return _
}();
cljs.core._STAR_ = function() {
  var _STAR_ = null;
  var _STAR___10979 = function() {
    return 1
  };
  var _STAR___10980 = function(x) {
    return x
  };
  var _STAR___10981 = function(x, y) {
    return x * y
  };
  var _STAR___10982 = function() {
    var G__10984__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _STAR_, x * y, more)
    };
    var G__10984 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__10984__delegate.call(this, x, y, more)
    };
    G__10984.cljs$lang$maxFixedArity = 2;
    G__10984.cljs$lang$applyTo = function(arglist__10985) {
      var x = cljs.core.first(arglist__10985);
      var y = cljs.core.first(cljs.core.next(arglist__10985));
      var more = cljs.core.rest(cljs.core.next(arglist__10985));
      return G__10984__delegate.call(this, x, y, more)
    };
    return G__10984
  }();
  _STAR_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 0:
        return _STAR___10979.call(this);
      case 1:
        return _STAR___10980.call(this, x);
      case 2:
        return _STAR___10981.call(this, x, y);
      default:
        return _STAR___10982.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _STAR_.cljs$lang$maxFixedArity = 2;
  _STAR_.cljs$lang$applyTo = _STAR___10982.cljs$lang$applyTo;
  return _STAR_
}();
cljs.core._SLASH_ = function() {
  var _SLASH_ = null;
  var _SLASH___10986 = function(x) {
    return _SLASH_.call(null, 1, x)
  };
  var _SLASH___10987 = function(x, y) {
    return x / y
  };
  var _SLASH___10988 = function() {
    var G__10990__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _SLASH_, _SLASH_.call(null, x, y), more)
    };
    var G__10990 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__10990__delegate.call(this, x, y, more)
    };
    G__10990.cljs$lang$maxFixedArity = 2;
    G__10990.cljs$lang$applyTo = function(arglist__10991) {
      var x = cljs.core.first(arglist__10991);
      var y = cljs.core.first(cljs.core.next(arglist__10991));
      var more = cljs.core.rest(cljs.core.next(arglist__10991));
      return G__10990__delegate.call(this, x, y, more)
    };
    return G__10990
  }();
  _SLASH_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _SLASH___10986.call(this, x);
      case 2:
        return _SLASH___10987.call(this, x, y);
      default:
        return _SLASH___10988.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _SLASH_.cljs$lang$maxFixedArity = 2;
  _SLASH_.cljs$lang$applyTo = _SLASH___10988.cljs$lang$applyTo;
  return _SLASH_
}();
cljs.core._LT_ = function() {
  var _LT_ = null;
  var _LT___10992 = function(x) {
    return true
  };
  var _LT___10993 = function(x, y) {
    return x < y
  };
  var _LT___10994 = function() {
    var G__10996__delegate = function(x, y, more) {
      while(true) {
        if(cljs.core.truth_(x < y)) {
          if(cljs.core.truth_(cljs.core.next.call(null, more))) {
            var G__10997 = y;
            var G__10998 = cljs.core.first.call(null, more);
            var G__10999 = cljs.core.next.call(null, more);
            x = G__10997;
            y = G__10998;
            more = G__10999;
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
    var G__10996 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__10996__delegate.call(this, x, y, more)
    };
    G__10996.cljs$lang$maxFixedArity = 2;
    G__10996.cljs$lang$applyTo = function(arglist__11000) {
      var x = cljs.core.first(arglist__11000);
      var y = cljs.core.first(cljs.core.next(arglist__11000));
      var more = cljs.core.rest(cljs.core.next(arglist__11000));
      return G__10996__delegate.call(this, x, y, more)
    };
    return G__10996
  }();
  _LT_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _LT___10992.call(this, x);
      case 2:
        return _LT___10993.call(this, x, y);
      default:
        return _LT___10994.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _LT_.cljs$lang$maxFixedArity = 2;
  _LT_.cljs$lang$applyTo = _LT___10994.cljs$lang$applyTo;
  return _LT_
}();
cljs.core._LT__EQ_ = function() {
  var _LT__EQ_ = null;
  var _LT__EQ___11001 = function(x) {
    return true
  };
  var _LT__EQ___11002 = function(x, y) {
    return x <= y
  };
  var _LT__EQ___11003 = function() {
    var G__11005__delegate = function(x, y, more) {
      while(true) {
        if(cljs.core.truth_(x <= y)) {
          if(cljs.core.truth_(cljs.core.next.call(null, more))) {
            var G__11006 = y;
            var G__11007 = cljs.core.first.call(null, more);
            var G__11008 = cljs.core.next.call(null, more);
            x = G__11006;
            y = G__11007;
            more = G__11008;
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
    var G__11005 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__11005__delegate.call(this, x, y, more)
    };
    G__11005.cljs$lang$maxFixedArity = 2;
    G__11005.cljs$lang$applyTo = function(arglist__11009) {
      var x = cljs.core.first(arglist__11009);
      var y = cljs.core.first(cljs.core.next(arglist__11009));
      var more = cljs.core.rest(cljs.core.next(arglist__11009));
      return G__11005__delegate.call(this, x, y, more)
    };
    return G__11005
  }();
  _LT__EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _LT__EQ___11001.call(this, x);
      case 2:
        return _LT__EQ___11002.call(this, x, y);
      default:
        return _LT__EQ___11003.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _LT__EQ_.cljs$lang$maxFixedArity = 2;
  _LT__EQ_.cljs$lang$applyTo = _LT__EQ___11003.cljs$lang$applyTo;
  return _LT__EQ_
}();
cljs.core._GT_ = function() {
  var _GT_ = null;
  var _GT___11010 = function(x) {
    return true
  };
  var _GT___11011 = function(x, y) {
    return x > y
  };
  var _GT___11012 = function() {
    var G__11014__delegate = function(x, y, more) {
      while(true) {
        if(cljs.core.truth_(x > y)) {
          if(cljs.core.truth_(cljs.core.next.call(null, more))) {
            var G__11015 = y;
            var G__11016 = cljs.core.first.call(null, more);
            var G__11017 = cljs.core.next.call(null, more);
            x = G__11015;
            y = G__11016;
            more = G__11017;
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
    var G__11014 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__11014__delegate.call(this, x, y, more)
    };
    G__11014.cljs$lang$maxFixedArity = 2;
    G__11014.cljs$lang$applyTo = function(arglist__11018) {
      var x = cljs.core.first(arglist__11018);
      var y = cljs.core.first(cljs.core.next(arglist__11018));
      var more = cljs.core.rest(cljs.core.next(arglist__11018));
      return G__11014__delegate.call(this, x, y, more)
    };
    return G__11014
  }();
  _GT_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _GT___11010.call(this, x);
      case 2:
        return _GT___11011.call(this, x, y);
      default:
        return _GT___11012.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _GT_.cljs$lang$maxFixedArity = 2;
  _GT_.cljs$lang$applyTo = _GT___11012.cljs$lang$applyTo;
  return _GT_
}();
cljs.core._GT__EQ_ = function() {
  var _GT__EQ_ = null;
  var _GT__EQ___11019 = function(x) {
    return true
  };
  var _GT__EQ___11020 = function(x, y) {
    return x >= y
  };
  var _GT__EQ___11021 = function() {
    var G__11023__delegate = function(x, y, more) {
      while(true) {
        if(cljs.core.truth_(x >= y)) {
          if(cljs.core.truth_(cljs.core.next.call(null, more))) {
            var G__11024 = y;
            var G__11025 = cljs.core.first.call(null, more);
            var G__11026 = cljs.core.next.call(null, more);
            x = G__11024;
            y = G__11025;
            more = G__11026;
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
    var G__11023 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__11023__delegate.call(this, x, y, more)
    };
    G__11023.cljs$lang$maxFixedArity = 2;
    G__11023.cljs$lang$applyTo = function(arglist__11027) {
      var x = cljs.core.first(arglist__11027);
      var y = cljs.core.first(cljs.core.next(arglist__11027));
      var more = cljs.core.rest(cljs.core.next(arglist__11027));
      return G__11023__delegate.call(this, x, y, more)
    };
    return G__11023
  }();
  _GT__EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _GT__EQ___11019.call(this, x);
      case 2:
        return _GT__EQ___11020.call(this, x, y);
      default:
        return _GT__EQ___11021.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _GT__EQ_.cljs$lang$maxFixedArity = 2;
  _GT__EQ_.cljs$lang$applyTo = _GT__EQ___11021.cljs$lang$applyTo;
  return _GT__EQ_
}();
cljs.core.dec = function dec(x) {
  return x - 1
};
cljs.core.max = function() {
  var max = null;
  var max__11028 = function(x) {
    return x
  };
  var max__11029 = function(x, y) {
    return x > y ? x : y
  };
  var max__11030 = function() {
    var G__11032__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, max, x > y ? x : y, more)
    };
    var G__11032 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__11032__delegate.call(this, x, y, more)
    };
    G__11032.cljs$lang$maxFixedArity = 2;
    G__11032.cljs$lang$applyTo = function(arglist__11033) {
      var x = cljs.core.first(arglist__11033);
      var y = cljs.core.first(cljs.core.next(arglist__11033));
      var more = cljs.core.rest(cljs.core.next(arglist__11033));
      return G__11032__delegate.call(this, x, y, more)
    };
    return G__11032
  }();
  max = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return max__11028.call(this, x);
      case 2:
        return max__11029.call(this, x, y);
      default:
        return max__11030.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  max.cljs$lang$maxFixedArity = 2;
  max.cljs$lang$applyTo = max__11030.cljs$lang$applyTo;
  return max
}();
cljs.core.min = function() {
  var min = null;
  var min__11034 = function(x) {
    return x
  };
  var min__11035 = function(x, y) {
    return x < y ? x : y
  };
  var min__11036 = function() {
    var G__11038__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, min, x < y ? x : y, more)
    };
    var G__11038 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__11038__delegate.call(this, x, y, more)
    };
    G__11038.cljs$lang$maxFixedArity = 2;
    G__11038.cljs$lang$applyTo = function(arglist__11039) {
      var x = cljs.core.first(arglist__11039);
      var y = cljs.core.first(cljs.core.next(arglist__11039));
      var more = cljs.core.rest(cljs.core.next(arglist__11039));
      return G__11038__delegate.call(this, x, y, more)
    };
    return G__11038
  }();
  min = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return min__11034.call(this, x);
      case 2:
        return min__11035.call(this, x, y);
      default:
        return min__11036.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  min.cljs$lang$maxFixedArity = 2;
  min.cljs$lang$applyTo = min__11036.cljs$lang$applyTo;
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
  var rem__11040 = n % d;
  return cljs.core.fix.call(null, (n - rem__11040) / d)
};
cljs.core.rem = function rem(n, d) {
  var q__11041 = cljs.core.quot.call(null, n, d);
  return n - d * q__11041
};
cljs.core.rand = function() {
  var rand = null;
  var rand__11042 = function() {
    return Math.random.call(null)
  };
  var rand__11043 = function(n) {
    return n * rand.call(null)
  };
  rand = function(n) {
    switch(arguments.length) {
      case 0:
        return rand__11042.call(this);
      case 1:
        return rand__11043.call(this, n)
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
  var _EQ__EQ___11045 = function(x) {
    return true
  };
  var _EQ__EQ___11046 = function(x, y) {
    return cljs.core._equiv.call(null, x, y)
  };
  var _EQ__EQ___11047 = function() {
    var G__11049__delegate = function(x, y, more) {
      while(true) {
        if(cljs.core.truth_(_EQ__EQ_.call(null, x, y))) {
          if(cljs.core.truth_(cljs.core.next.call(null, more))) {
            var G__11050 = y;
            var G__11051 = cljs.core.first.call(null, more);
            var G__11052 = cljs.core.next.call(null, more);
            x = G__11050;
            y = G__11051;
            more = G__11052;
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
    var G__11049 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__11049__delegate.call(this, x, y, more)
    };
    G__11049.cljs$lang$maxFixedArity = 2;
    G__11049.cljs$lang$applyTo = function(arglist__11053) {
      var x = cljs.core.first(arglist__11053);
      var y = cljs.core.first(cljs.core.next(arglist__11053));
      var more = cljs.core.rest(cljs.core.next(arglist__11053));
      return G__11049__delegate.call(this, x, y, more)
    };
    return G__11049
  }();
  _EQ__EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _EQ__EQ___11045.call(this, x);
      case 2:
        return _EQ__EQ___11046.call(this, x, y);
      default:
        return _EQ__EQ___11047.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _EQ__EQ_.cljs$lang$maxFixedArity = 2;
  _EQ__EQ_.cljs$lang$applyTo = _EQ__EQ___11047.cljs$lang$applyTo;
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
  var n__11054 = n;
  var xs__11055 = cljs.core.seq.call(null, coll);
  while(true) {
    if(cljs.core.truth_(function() {
      var and__3822__auto____11056 = xs__11055;
      if(cljs.core.truth_(and__3822__auto____11056)) {
        return n__11054 > 0
      }else {
        return and__3822__auto____11056
      }
    }())) {
      var G__11057 = n__11054 - 1;
      var G__11058 = cljs.core.next.call(null, xs__11055);
      n__11054 = G__11057;
      xs__11055 = G__11058;
      continue
    }else {
      return xs__11055
    }
    break
  }
};
cljs.core.IIndexed["_"] = true;
cljs.core._nth["_"] = function() {
  var G__11063 = null;
  var G__11063__11064 = function(coll, n) {
    var temp__3971__auto____11059 = cljs.core.nthnext.call(null, coll, n);
    if(cljs.core.truth_(temp__3971__auto____11059)) {
      var xs__11060 = temp__3971__auto____11059;
      return cljs.core.first.call(null, xs__11060)
    }else {
      throw new Error("Index out of bounds");
    }
  };
  var G__11063__11065 = function(coll, n, not_found) {
    var temp__3971__auto____11061 = cljs.core.nthnext.call(null, coll, n);
    if(cljs.core.truth_(temp__3971__auto____11061)) {
      var xs__11062 = temp__3971__auto____11061;
      return cljs.core.first.call(null, xs__11062)
    }else {
      return not_found
    }
  };
  G__11063 = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__11063__11064.call(this, coll, n);
      case 3:
        return G__11063__11065.call(this, coll, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__11063
}();
cljs.core.str_STAR_ = function() {
  var str_STAR_ = null;
  var str_STAR___11067 = function() {
    return""
  };
  var str_STAR___11068 = function(x) {
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
  var str_STAR___11069 = function() {
    var G__11071__delegate = function(x, ys) {
      return function(sb, more) {
        while(true) {
          if(cljs.core.truth_(more)) {
            var G__11072 = sb.append(str_STAR_.call(null, cljs.core.first.call(null, more)));
            var G__11073 = cljs.core.next.call(null, more);
            sb = G__11072;
            more = G__11073;
            continue
          }else {
            return str_STAR_.call(null, sb)
          }
          break
        }
      }.call(null, new goog.string.StringBuffer(str_STAR_.call(null, x)), ys)
    };
    var G__11071 = function(x, var_args) {
      var ys = null;
      if(goog.isDef(var_args)) {
        ys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__11071__delegate.call(this, x, ys)
    };
    G__11071.cljs$lang$maxFixedArity = 1;
    G__11071.cljs$lang$applyTo = function(arglist__11074) {
      var x = cljs.core.first(arglist__11074);
      var ys = cljs.core.rest(arglist__11074);
      return G__11071__delegate.call(this, x, ys)
    };
    return G__11071
  }();
  str_STAR_ = function(x, var_args) {
    var ys = var_args;
    switch(arguments.length) {
      case 0:
        return str_STAR___11067.call(this);
      case 1:
        return str_STAR___11068.call(this, x);
      default:
        return str_STAR___11069.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  str_STAR_.cljs$lang$maxFixedArity = 1;
  str_STAR_.cljs$lang$applyTo = str_STAR___11069.cljs$lang$applyTo;
  return str_STAR_
}();
cljs.core.str = function() {
  var str = null;
  var str__11075 = function() {
    return""
  };
  var str__11076 = function(x) {
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
  var str__11077 = function() {
    var G__11079__delegate = function(x, ys) {
      return function(sb, more) {
        while(true) {
          if(cljs.core.truth_(more)) {
            var G__11080 = sb.append(str.call(null, cljs.core.first.call(null, more)));
            var G__11081 = cljs.core.next.call(null, more);
            sb = G__11080;
            more = G__11081;
            continue
          }else {
            return cljs.core.str_STAR_.call(null, sb)
          }
          break
        }
      }.call(null, new goog.string.StringBuffer(str.call(null, x)), ys)
    };
    var G__11079 = function(x, var_args) {
      var ys = null;
      if(goog.isDef(var_args)) {
        ys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__11079__delegate.call(this, x, ys)
    };
    G__11079.cljs$lang$maxFixedArity = 1;
    G__11079.cljs$lang$applyTo = function(arglist__11082) {
      var x = cljs.core.first(arglist__11082);
      var ys = cljs.core.rest(arglist__11082);
      return G__11079__delegate.call(this, x, ys)
    };
    return G__11079
  }();
  str = function(x, var_args) {
    var ys = var_args;
    switch(arguments.length) {
      case 0:
        return str__11075.call(this);
      case 1:
        return str__11076.call(this, x);
      default:
        return str__11077.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  str.cljs$lang$maxFixedArity = 1;
  str.cljs$lang$applyTo = str__11077.cljs$lang$applyTo;
  return str
}();
cljs.core.subs = function() {
  var subs = null;
  var subs__11083 = function(s, start) {
    return s.substring(start)
  };
  var subs__11084 = function(s, start, end) {
    return s.substring(start, end)
  };
  subs = function(s, start, end) {
    switch(arguments.length) {
      case 2:
        return subs__11083.call(this, s, start);
      case 3:
        return subs__11084.call(this, s, start, end)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return subs
}();
cljs.core.symbol = function() {
  var symbol = null;
  var symbol__11086 = function(name) {
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
  var symbol__11087 = function(ns, name) {
    return symbol.call(null, cljs.core.str_STAR_.call(null, ns, "/", name))
  };
  symbol = function(ns, name) {
    switch(arguments.length) {
      case 1:
        return symbol__11086.call(this, ns);
      case 2:
        return symbol__11087.call(this, ns, name)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return symbol
}();
cljs.core.keyword = function() {
  var keyword = null;
  var keyword__11089 = function(name) {
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
  var keyword__11090 = function(ns, name) {
    return keyword.call(null, cljs.core.str_STAR_.call(null, ns, "/", name))
  };
  keyword = function(ns, name) {
    switch(arguments.length) {
      case 1:
        return keyword__11089.call(this, ns);
      case 2:
        return keyword__11090.call(this, ns, name)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return keyword
}();
cljs.core.equiv_sequential = function equiv_sequential(x, y) {
  return cljs.core.boolean$.call(null, cljs.core.truth_(cljs.core.sequential_QMARK_.call(null, y)) ? function() {
    var xs__11092 = cljs.core.seq.call(null, x);
    var ys__11093 = cljs.core.seq.call(null, y);
    while(true) {
      if(cljs.core.truth_(xs__11092 === null)) {
        return ys__11093 === null
      }else {
        if(cljs.core.truth_(ys__11093 === null)) {
          return false
        }else {
          if(cljs.core.truth_(cljs.core._EQ_.call(null, cljs.core.first.call(null, xs__11092), cljs.core.first.call(null, ys__11093)))) {
            var G__11094 = cljs.core.next.call(null, xs__11092);
            var G__11095 = cljs.core.next.call(null, ys__11093);
            xs__11092 = G__11094;
            ys__11093 = G__11095;
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
  return cljs.core.reduce.call(null, function(p1__11096_SHARP_, p2__11097_SHARP_) {
    return cljs.core.hash_combine.call(null, p1__11096_SHARP_, cljs.core.hash.call(null, p2__11097_SHARP_))
  }, cljs.core.hash.call(null, cljs.core.first.call(null, coll)), cljs.core.next.call(null, coll))
};
cljs.core.extend_object_BANG_ = function extend_object_BANG_(obj, fn_map) {
  var G__11098__11099 = cljs.core.seq.call(null, fn_map);
  if(cljs.core.truth_(G__11098__11099)) {
    var G__11101__11103 = cljs.core.first.call(null, G__11098__11099);
    var vec__11102__11104 = G__11101__11103;
    var key_name__11105 = cljs.core.nth.call(null, vec__11102__11104, 0, null);
    var f__11106 = cljs.core.nth.call(null, vec__11102__11104, 1, null);
    var G__11098__11107 = G__11098__11099;
    var G__11101__11108 = G__11101__11103;
    var G__11098__11109 = G__11098__11107;
    while(true) {
      var vec__11110__11111 = G__11101__11108;
      var key_name__11112 = cljs.core.nth.call(null, vec__11110__11111, 0, null);
      var f__11113 = cljs.core.nth.call(null, vec__11110__11111, 1, null);
      var G__11098__11114 = G__11098__11109;
      var str_name__11115 = cljs.core.name.call(null, key_name__11112);
      obj[str_name__11115] = f__11113;
      var temp__3974__auto____11116 = cljs.core.next.call(null, G__11098__11114);
      if(cljs.core.truth_(temp__3974__auto____11116)) {
        var G__11098__11117 = temp__3974__auto____11116;
        var G__11118 = cljs.core.first.call(null, G__11098__11117);
        var G__11119 = G__11098__11117;
        G__11101__11108 = G__11118;
        G__11098__11109 = G__11119;
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
  var this__11120 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.List.prototype.cljs$core$ISequential$ = true;
cljs.core.List.prototype.cljs$core$ICollection$ = true;
cljs.core.List.prototype.cljs$core$ICollection$_conj = function(coll, o) {
  var this__11121 = this;
  return new cljs.core.List(this__11121.meta, o, coll, this__11121.count + 1)
};
cljs.core.List.prototype.cljs$core$ISeqable$ = true;
cljs.core.List.prototype.cljs$core$ISeqable$_seq = function(coll) {
  var this__11122 = this;
  return coll
};
cljs.core.List.prototype.cljs$core$ICounted$ = true;
cljs.core.List.prototype.cljs$core$ICounted$_count = function(coll) {
  var this__11123 = this;
  return this__11123.count
};
cljs.core.List.prototype.cljs$core$IStack$ = true;
cljs.core.List.prototype.cljs$core$IStack$_peek = function(coll) {
  var this__11124 = this;
  return this__11124.first
};
cljs.core.List.prototype.cljs$core$IStack$_pop = function(coll) {
  var this__11125 = this;
  return cljs.core._rest.call(null, coll)
};
cljs.core.List.prototype.cljs$core$ISeq$ = true;
cljs.core.List.prototype.cljs$core$ISeq$_first = function(coll) {
  var this__11126 = this;
  return this__11126.first
};
cljs.core.List.prototype.cljs$core$ISeq$_rest = function(coll) {
  var this__11127 = this;
  return this__11127.rest
};
cljs.core.List.prototype.cljs$core$IEquiv$ = true;
cljs.core.List.prototype.cljs$core$IEquiv$_equiv = function(coll, other) {
  var this__11128 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.List.prototype.cljs$core$IWithMeta$ = true;
cljs.core.List.prototype.cljs$core$IWithMeta$_with_meta = function(coll, meta) {
  var this__11129 = this;
  return new cljs.core.List(meta, this__11129.first, this__11129.rest, this__11129.count)
};
cljs.core.List.prototype.cljs$core$IMeta$ = true;
cljs.core.List.prototype.cljs$core$IMeta$_meta = function(coll) {
  var this__11130 = this;
  return this__11130.meta
};
cljs.core.List.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.List.prototype.cljs$core$IEmptyableCollection$_empty = function(coll) {
  var this__11131 = this;
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
  var this__11132 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.EmptyList.prototype.cljs$core$ISequential$ = true;
cljs.core.EmptyList.prototype.cljs$core$ICollection$ = true;
cljs.core.EmptyList.prototype.cljs$core$ICollection$_conj = function(coll, o) {
  var this__11133 = this;
  return new cljs.core.List(this__11133.meta, o, null, 1)
};
cljs.core.EmptyList.prototype.cljs$core$ISeqable$ = true;
cljs.core.EmptyList.prototype.cljs$core$ISeqable$_seq = function(coll) {
  var this__11134 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ICounted$ = true;
cljs.core.EmptyList.prototype.cljs$core$ICounted$_count = function(coll) {
  var this__11135 = this;
  return 0
};
cljs.core.EmptyList.prototype.cljs$core$IStack$ = true;
cljs.core.EmptyList.prototype.cljs$core$IStack$_peek = function(coll) {
  var this__11136 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$IStack$_pop = function(coll) {
  var this__11137 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ISeq$ = true;
cljs.core.EmptyList.prototype.cljs$core$ISeq$_first = function(coll) {
  var this__11138 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ISeq$_rest = function(coll) {
  var this__11139 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$IEquiv$ = true;
cljs.core.EmptyList.prototype.cljs$core$IEquiv$_equiv = function(coll, other) {
  var this__11140 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.EmptyList.prototype.cljs$core$IWithMeta$ = true;
cljs.core.EmptyList.prototype.cljs$core$IWithMeta$_with_meta = function(coll, meta) {
  var this__11141 = this;
  return new cljs.core.EmptyList(meta)
};
cljs.core.EmptyList.prototype.cljs$core$IMeta$ = true;
cljs.core.EmptyList.prototype.cljs$core$IMeta$_meta = function(coll) {
  var this__11142 = this;
  return this__11142.meta
};
cljs.core.EmptyList.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.EmptyList.prototype.cljs$core$IEmptyableCollection$_empty = function(coll) {
  var this__11143 = this;
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
  list.cljs$lang$applyTo = function(arglist__11144) {
    var items = cljs.core.seq(arglist__11144);
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
  var this__11145 = this;
  return coll
};
cljs.core.Cons.prototype.cljs$core$IHash$ = true;
cljs.core.Cons.prototype.cljs$core$IHash$_hash = function(coll) {
  var this__11146 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.Cons.prototype.cljs$core$IEquiv$ = true;
cljs.core.Cons.prototype.cljs$core$IEquiv$_equiv = function(coll, other) {
  var this__11147 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Cons.prototype.cljs$core$ISequential$ = true;
cljs.core.Cons.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.Cons.prototype.cljs$core$IEmptyableCollection$_empty = function(coll) {
  var this__11148 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__11148.meta)
};
cljs.core.Cons.prototype.cljs$core$ICollection$ = true;
cljs.core.Cons.prototype.cljs$core$ICollection$_conj = function(coll, o) {
  var this__11149 = this;
  return new cljs.core.Cons(null, o, coll)
};
cljs.core.Cons.prototype.cljs$core$ISeq$ = true;
cljs.core.Cons.prototype.cljs$core$ISeq$_first = function(coll) {
  var this__11150 = this;
  return this__11150.first
};
cljs.core.Cons.prototype.cljs$core$ISeq$_rest = function(coll) {
  var this__11151 = this;
  if(cljs.core.truth_(this__11151.rest === null)) {
    return cljs.core.List.EMPTY
  }else {
    return this__11151.rest
  }
};
cljs.core.Cons.prototype.cljs$core$IMeta$ = true;
cljs.core.Cons.prototype.cljs$core$IMeta$_meta = function(coll) {
  var this__11152 = this;
  return this__11152.meta
};
cljs.core.Cons.prototype.cljs$core$IWithMeta$ = true;
cljs.core.Cons.prototype.cljs$core$IWithMeta$_with_meta = function(coll, meta) {
  var this__11153 = this;
  return new cljs.core.Cons(meta, this__11153.first, this__11153.rest)
};
cljs.core.Cons;
cljs.core.cons = function cons(x, seq) {
  return new cljs.core.Cons(null, x, seq)
};
cljs.core.IReduce["string"] = true;
cljs.core._reduce["string"] = function() {
  var G__11154 = null;
  var G__11154__11155 = function(string, f) {
    return cljs.core.ci_reduce.call(null, string, f)
  };
  var G__11154__11156 = function(string, f, start) {
    return cljs.core.ci_reduce.call(null, string, f, start)
  };
  G__11154 = function(string, f, start) {
    switch(arguments.length) {
      case 2:
        return G__11154__11155.call(this, string, f);
      case 3:
        return G__11154__11156.call(this, string, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__11154
}();
cljs.core.ILookup["string"] = true;
cljs.core._lookup["string"] = function() {
  var G__11158 = null;
  var G__11158__11159 = function(string, k) {
    return cljs.core._nth.call(null, string, k)
  };
  var G__11158__11160 = function(string, k, not_found) {
    return cljs.core._nth.call(null, string, k, not_found)
  };
  G__11158 = function(string, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__11158__11159.call(this, string, k);
      case 3:
        return G__11158__11160.call(this, string, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__11158
}();
cljs.core.IIndexed["string"] = true;
cljs.core._nth["string"] = function() {
  var G__11162 = null;
  var G__11162__11163 = function(string, n) {
    if(cljs.core.truth_(n < cljs.core._count.call(null, string))) {
      return string.charAt(n)
    }else {
      return null
    }
  };
  var G__11162__11164 = function(string, n, not_found) {
    if(cljs.core.truth_(n < cljs.core._count.call(null, string))) {
      return string.charAt(n)
    }else {
      return not_found
    }
  };
  G__11162 = function(string, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__11162__11163.call(this, string, n);
      case 3:
        return G__11162__11164.call(this, string, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__11162
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
  var G__11172 = null;
  var G__11172__11173 = function(tsym11166, coll) {
    var tsym11166__11168 = this;
    var this$__11169 = tsym11166__11168;
    return cljs.core.get.call(null, coll, this$__11169.toString())
  };
  var G__11172__11174 = function(tsym11167, coll, not_found) {
    var tsym11167__11170 = this;
    var this$__11171 = tsym11167__11170;
    return cljs.core.get.call(null, coll, this$__11171.toString(), not_found)
  };
  G__11172 = function(tsym11167, coll, not_found) {
    switch(arguments.length) {
      case 2:
        return G__11172__11173.call(this, tsym11167, coll);
      case 3:
        return G__11172__11174.call(this, tsym11167, coll, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__11172
}();
String["prototype"]["apply"] = function(s, args) {
  if(cljs.core.truth_(cljs.core.count.call(null, args) < 2)) {
    return cljs.core.get.call(null, args[0], s)
  }else {
    return cljs.core.get.call(null, args[0], s, args[1])
  }
};
cljs.core.lazy_seq_value = function lazy_seq_value(lazy_seq) {
  var x__11176 = lazy_seq.x;
  if(cljs.core.truth_(lazy_seq.realized)) {
    return x__11176
  }else {
    lazy_seq.x = x__11176.call(null);
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
  var this__11177 = this;
  return cljs.core.seq.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$IHash$ = true;
cljs.core.LazySeq.prototype.cljs$core$IHash$_hash = function(coll) {
  var this__11178 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.LazySeq.prototype.cljs$core$IEquiv$ = true;
cljs.core.LazySeq.prototype.cljs$core$IEquiv$_equiv = function(coll, other) {
  var this__11179 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.LazySeq.prototype.cljs$core$ISequential$ = true;
cljs.core.LazySeq.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.LazySeq.prototype.cljs$core$IEmptyableCollection$_empty = function(coll) {
  var this__11180 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__11180.meta)
};
cljs.core.LazySeq.prototype.cljs$core$ICollection$ = true;
cljs.core.LazySeq.prototype.cljs$core$ICollection$_conj = function(coll, o) {
  var this__11181 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.LazySeq.prototype.cljs$core$ISeq$ = true;
cljs.core.LazySeq.prototype.cljs$core$ISeq$_first = function(coll) {
  var this__11182 = this;
  return cljs.core.first.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$ISeq$_rest = function(coll) {
  var this__11183 = this;
  return cljs.core.rest.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$IMeta$ = true;
cljs.core.LazySeq.prototype.cljs$core$IMeta$_meta = function(coll) {
  var this__11184 = this;
  return this__11184.meta
};
cljs.core.LazySeq.prototype.cljs$core$IWithMeta$ = true;
cljs.core.LazySeq.prototype.cljs$core$IWithMeta$_with_meta = function(coll, meta) {
  var this__11185 = this;
  return new cljs.core.LazySeq(meta, this__11185.realized, this__11185.x)
};
cljs.core.LazySeq;
cljs.core.to_array = function to_array(s) {
  var ary__11186 = [];
  var s__11187 = s;
  while(true) {
    if(cljs.core.truth_(cljs.core.seq.call(null, s__11187))) {
      ary__11186.push(cljs.core.first.call(null, s__11187));
      var G__11188 = cljs.core.next.call(null, s__11187);
      s__11187 = G__11188;
      continue
    }else {
      return ary__11186
    }
    break
  }
};
cljs.core.bounded_count = function bounded_count(s, n) {
  var s__11189 = s;
  var i__11190 = n;
  var sum__11191 = 0;
  while(true) {
    if(cljs.core.truth_(function() {
      var and__3822__auto____11192 = i__11190 > 0;
      if(cljs.core.truth_(and__3822__auto____11192)) {
        return cljs.core.seq.call(null, s__11189)
      }else {
        return and__3822__auto____11192
      }
    }())) {
      var G__11193 = cljs.core.next.call(null, s__11189);
      var G__11194 = i__11190 - 1;
      var G__11195 = sum__11191 + 1;
      s__11189 = G__11193;
      i__11190 = G__11194;
      sum__11191 = G__11195;
      continue
    }else {
      return sum__11191
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
  var concat__11199 = function() {
    return new cljs.core.LazySeq(null, false, function() {
      return null
    })
  };
  var concat__11200 = function(x) {
    return new cljs.core.LazySeq(null, false, function() {
      return x
    })
  };
  var concat__11201 = function(x, y) {
    return new cljs.core.LazySeq(null, false, function() {
      var s__11196 = cljs.core.seq.call(null, x);
      if(cljs.core.truth_(s__11196)) {
        return cljs.core.cons.call(null, cljs.core.first.call(null, s__11196), concat.call(null, cljs.core.rest.call(null, s__11196), y))
      }else {
        return y
      }
    })
  };
  var concat__11202 = function() {
    var G__11204__delegate = function(x, y, zs) {
      var cat__11198 = function cat(xys, zs) {
        return new cljs.core.LazySeq(null, false, function() {
          var xys__11197 = cljs.core.seq.call(null, xys);
          if(cljs.core.truth_(xys__11197)) {
            return cljs.core.cons.call(null, cljs.core.first.call(null, xys__11197), cat.call(null, cljs.core.rest.call(null, xys__11197), zs))
          }else {
            if(cljs.core.truth_(zs)) {
              return cat.call(null, cljs.core.first.call(null, zs), cljs.core.next.call(null, zs))
            }else {
              return null
            }
          }
        })
      };
      return cat__11198.call(null, concat.call(null, x, y), zs)
    };
    var G__11204 = function(x, y, var_args) {
      var zs = null;
      if(goog.isDef(var_args)) {
        zs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__11204__delegate.call(this, x, y, zs)
    };
    G__11204.cljs$lang$maxFixedArity = 2;
    G__11204.cljs$lang$applyTo = function(arglist__11205) {
      var x = cljs.core.first(arglist__11205);
      var y = cljs.core.first(cljs.core.next(arglist__11205));
      var zs = cljs.core.rest(cljs.core.next(arglist__11205));
      return G__11204__delegate.call(this, x, y, zs)
    };
    return G__11204
  }();
  concat = function(x, y, var_args) {
    var zs = var_args;
    switch(arguments.length) {
      case 0:
        return concat__11199.call(this);
      case 1:
        return concat__11200.call(this, x);
      case 2:
        return concat__11201.call(this, x, y);
      default:
        return concat__11202.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  concat.cljs$lang$maxFixedArity = 2;
  concat.cljs$lang$applyTo = concat__11202.cljs$lang$applyTo;
  return concat
}();
cljs.core.list_STAR_ = function() {
  var list_STAR_ = null;
  var list_STAR___11206 = function(args) {
    return cljs.core.seq.call(null, args)
  };
  var list_STAR___11207 = function(a, args) {
    return cljs.core.cons.call(null, a, args)
  };
  var list_STAR___11208 = function(a, b, args) {
    return cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, args))
  };
  var list_STAR___11209 = function(a, b, c, args) {
    return cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, args)))
  };
  var list_STAR___11210 = function() {
    var G__11212__delegate = function(a, b, c, d, more) {
      return cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, cljs.core.cons.call(null, d, cljs.core.spread.call(null, more)))))
    };
    var G__11212 = function(a, b, c, d, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__11212__delegate.call(this, a, b, c, d, more)
    };
    G__11212.cljs$lang$maxFixedArity = 4;
    G__11212.cljs$lang$applyTo = function(arglist__11213) {
      var a = cljs.core.first(arglist__11213);
      var b = cljs.core.first(cljs.core.next(arglist__11213));
      var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__11213)));
      var d = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__11213))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__11213))));
      return G__11212__delegate.call(this, a, b, c, d, more)
    };
    return G__11212
  }();
  list_STAR_ = function(a, b, c, d, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return list_STAR___11206.call(this, a);
      case 2:
        return list_STAR___11207.call(this, a, b);
      case 3:
        return list_STAR___11208.call(this, a, b, c);
      case 4:
        return list_STAR___11209.call(this, a, b, c, d);
      default:
        return list_STAR___11210.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  list_STAR_.cljs$lang$maxFixedArity = 4;
  list_STAR_.cljs$lang$applyTo = list_STAR___11210.cljs$lang$applyTo;
  return list_STAR_
}();
cljs.core.apply = function() {
  var apply = null;
  var apply__11223 = function(f, args) {
    var fixed_arity__11214 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      if(cljs.core.truth_(cljs.core.bounded_count.call(null, args, fixed_arity__11214 + 1) <= fixed_arity__11214)) {
        return f.apply(f, cljs.core.to_array.call(null, args))
      }else {
        return f.cljs$lang$applyTo(args)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, args))
    }
  };
  var apply__11224 = function(f, x, args) {
    var arglist__11215 = cljs.core.list_STAR_.call(null, x, args);
    var fixed_arity__11216 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      if(cljs.core.truth_(cljs.core.bounded_count.call(null, arglist__11215, fixed_arity__11216) <= fixed_arity__11216)) {
        return f.apply(f, cljs.core.to_array.call(null, arglist__11215))
      }else {
        return f.cljs$lang$applyTo(arglist__11215)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__11215))
    }
  };
  var apply__11225 = function(f, x, y, args) {
    var arglist__11217 = cljs.core.list_STAR_.call(null, x, y, args);
    var fixed_arity__11218 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      if(cljs.core.truth_(cljs.core.bounded_count.call(null, arglist__11217, fixed_arity__11218) <= fixed_arity__11218)) {
        return f.apply(f, cljs.core.to_array.call(null, arglist__11217))
      }else {
        return f.cljs$lang$applyTo(arglist__11217)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__11217))
    }
  };
  var apply__11226 = function(f, x, y, z, args) {
    var arglist__11219 = cljs.core.list_STAR_.call(null, x, y, z, args);
    var fixed_arity__11220 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      if(cljs.core.truth_(cljs.core.bounded_count.call(null, arglist__11219, fixed_arity__11220) <= fixed_arity__11220)) {
        return f.apply(f, cljs.core.to_array.call(null, arglist__11219))
      }else {
        return f.cljs$lang$applyTo(arglist__11219)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__11219))
    }
  };
  var apply__11227 = function() {
    var G__11229__delegate = function(f, a, b, c, d, args) {
      var arglist__11221 = cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, cljs.core.cons.call(null, d, cljs.core.spread.call(null, args)))));
      var fixed_arity__11222 = f.cljs$lang$maxFixedArity;
      if(cljs.core.truth_(f.cljs$lang$applyTo)) {
        if(cljs.core.truth_(cljs.core.bounded_count.call(null, arglist__11221, fixed_arity__11222) <= fixed_arity__11222)) {
          return f.apply(f, cljs.core.to_array.call(null, arglist__11221))
        }else {
          return f.cljs$lang$applyTo(arglist__11221)
        }
      }else {
        return f.apply(f, cljs.core.to_array.call(null, arglist__11221))
      }
    };
    var G__11229 = function(f, a, b, c, d, var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 5), 0)
      }
      return G__11229__delegate.call(this, f, a, b, c, d, args)
    };
    G__11229.cljs$lang$maxFixedArity = 5;
    G__11229.cljs$lang$applyTo = function(arglist__11230) {
      var f = cljs.core.first(arglist__11230);
      var a = cljs.core.first(cljs.core.next(arglist__11230));
      var b = cljs.core.first(cljs.core.next(cljs.core.next(arglist__11230)));
      var c = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__11230))));
      var d = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__11230)))));
      var args = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__11230)))));
      return G__11229__delegate.call(this, f, a, b, c, d, args)
    };
    return G__11229
  }();
  apply = function(f, a, b, c, d, var_args) {
    var args = var_args;
    switch(arguments.length) {
      case 2:
        return apply__11223.call(this, f, a);
      case 3:
        return apply__11224.call(this, f, a, b);
      case 4:
        return apply__11225.call(this, f, a, b, c);
      case 5:
        return apply__11226.call(this, f, a, b, c, d);
      default:
        return apply__11227.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  apply.cljs$lang$maxFixedArity = 5;
  apply.cljs$lang$applyTo = apply__11227.cljs$lang$applyTo;
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
  vary_meta.cljs$lang$applyTo = function(arglist__11231) {
    var obj = cljs.core.first(arglist__11231);
    var f = cljs.core.first(cljs.core.next(arglist__11231));
    var args = cljs.core.rest(cljs.core.next(arglist__11231));
    return vary_meta__delegate.call(this, obj, f, args)
  };
  return vary_meta
}();
cljs.core.not_EQ_ = function() {
  var not_EQ_ = null;
  var not_EQ___11232 = function(x) {
    return false
  };
  var not_EQ___11233 = function(x, y) {
    return cljs.core.not.call(null, cljs.core._EQ_.call(null, x, y))
  };
  var not_EQ___11234 = function() {
    var G__11236__delegate = function(x, y, more) {
      return cljs.core.not.call(null, cljs.core.apply.call(null, cljs.core._EQ_, x, y, more))
    };
    var G__11236 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__11236__delegate.call(this, x, y, more)
    };
    G__11236.cljs$lang$maxFixedArity = 2;
    G__11236.cljs$lang$applyTo = function(arglist__11237) {
      var x = cljs.core.first(arglist__11237);
      var y = cljs.core.first(cljs.core.next(arglist__11237));
      var more = cljs.core.rest(cljs.core.next(arglist__11237));
      return G__11236__delegate.call(this, x, y, more)
    };
    return G__11236
  }();
  not_EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return not_EQ___11232.call(this, x);
      case 2:
        return not_EQ___11233.call(this, x, y);
      default:
        return not_EQ___11234.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  not_EQ_.cljs$lang$maxFixedArity = 2;
  not_EQ_.cljs$lang$applyTo = not_EQ___11234.cljs$lang$applyTo;
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
        var G__11238 = pred;
        var G__11239 = cljs.core.next.call(null, coll);
        pred = G__11238;
        coll = G__11239;
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
      var or__3824__auto____11240 = pred.call(null, cljs.core.first.call(null, coll));
      if(cljs.core.truth_(or__3824__auto____11240)) {
        return or__3824__auto____11240
      }else {
        var G__11241 = pred;
        var G__11242 = cljs.core.next.call(null, coll);
        pred = G__11241;
        coll = G__11242;
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
    var G__11243 = null;
    var G__11243__11244 = function() {
      return cljs.core.not.call(null, f.call(null))
    };
    var G__11243__11245 = function(x) {
      return cljs.core.not.call(null, f.call(null, x))
    };
    var G__11243__11246 = function(x, y) {
      return cljs.core.not.call(null, f.call(null, x, y))
    };
    var G__11243__11247 = function() {
      var G__11249__delegate = function(x, y, zs) {
        return cljs.core.not.call(null, cljs.core.apply.call(null, f, x, y, zs))
      };
      var G__11249 = function(x, y, var_args) {
        var zs = null;
        if(goog.isDef(var_args)) {
          zs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
        }
        return G__11249__delegate.call(this, x, y, zs)
      };
      G__11249.cljs$lang$maxFixedArity = 2;
      G__11249.cljs$lang$applyTo = function(arglist__11250) {
        var x = cljs.core.first(arglist__11250);
        var y = cljs.core.first(cljs.core.next(arglist__11250));
        var zs = cljs.core.rest(cljs.core.next(arglist__11250));
        return G__11249__delegate.call(this, x, y, zs)
      };
      return G__11249
    }();
    G__11243 = function(x, y, var_args) {
      var zs = var_args;
      switch(arguments.length) {
        case 0:
          return G__11243__11244.call(this);
        case 1:
          return G__11243__11245.call(this, x);
        case 2:
          return G__11243__11246.call(this, x, y);
        default:
          return G__11243__11247.apply(this, arguments)
      }
      throw"Invalid arity: " + arguments.length;
    };
    G__11243.cljs$lang$maxFixedArity = 2;
    G__11243.cljs$lang$applyTo = G__11243__11247.cljs$lang$applyTo;
    return G__11243
  }()
};
cljs.core.constantly = function constantly(x) {
  return function() {
    var G__11251__delegate = function(args) {
      return x
    };
    var G__11251 = function(var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__11251__delegate.call(this, args)
    };
    G__11251.cljs$lang$maxFixedArity = 0;
    G__11251.cljs$lang$applyTo = function(arglist__11252) {
      var args = cljs.core.seq(arglist__11252);
      return G__11251__delegate.call(this, args)
    };
    return G__11251
  }()
};
cljs.core.comp = function() {
  var comp = null;
  var comp__11256 = function() {
    return cljs.core.identity
  };
  var comp__11257 = function(f) {
    return f
  };
  var comp__11258 = function(f, g) {
    return function() {
      var G__11262 = null;
      var G__11262__11263 = function() {
        return f.call(null, g.call(null))
      };
      var G__11262__11264 = function(x) {
        return f.call(null, g.call(null, x))
      };
      var G__11262__11265 = function(x, y) {
        return f.call(null, g.call(null, x, y))
      };
      var G__11262__11266 = function(x, y, z) {
        return f.call(null, g.call(null, x, y, z))
      };
      var G__11262__11267 = function() {
        var G__11269__delegate = function(x, y, z, args) {
          return f.call(null, cljs.core.apply.call(null, g, x, y, z, args))
        };
        var G__11269 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__11269__delegate.call(this, x, y, z, args)
        };
        G__11269.cljs$lang$maxFixedArity = 3;
        G__11269.cljs$lang$applyTo = function(arglist__11270) {
          var x = cljs.core.first(arglist__11270);
          var y = cljs.core.first(cljs.core.next(arglist__11270));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__11270)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__11270)));
          return G__11269__delegate.call(this, x, y, z, args)
        };
        return G__11269
      }();
      G__11262 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__11262__11263.call(this);
          case 1:
            return G__11262__11264.call(this, x);
          case 2:
            return G__11262__11265.call(this, x, y);
          case 3:
            return G__11262__11266.call(this, x, y, z);
          default:
            return G__11262__11267.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__11262.cljs$lang$maxFixedArity = 3;
      G__11262.cljs$lang$applyTo = G__11262__11267.cljs$lang$applyTo;
      return G__11262
    }()
  };
  var comp__11259 = function(f, g, h) {
    return function() {
      var G__11271 = null;
      var G__11271__11272 = function() {
        return f.call(null, g.call(null, h.call(null)))
      };
      var G__11271__11273 = function(x) {
        return f.call(null, g.call(null, h.call(null, x)))
      };
      var G__11271__11274 = function(x, y) {
        return f.call(null, g.call(null, h.call(null, x, y)))
      };
      var G__11271__11275 = function(x, y, z) {
        return f.call(null, g.call(null, h.call(null, x, y, z)))
      };
      var G__11271__11276 = function() {
        var G__11278__delegate = function(x, y, z, args) {
          return f.call(null, g.call(null, cljs.core.apply.call(null, h, x, y, z, args)))
        };
        var G__11278 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__11278__delegate.call(this, x, y, z, args)
        };
        G__11278.cljs$lang$maxFixedArity = 3;
        G__11278.cljs$lang$applyTo = function(arglist__11279) {
          var x = cljs.core.first(arglist__11279);
          var y = cljs.core.first(cljs.core.next(arglist__11279));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__11279)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__11279)));
          return G__11278__delegate.call(this, x, y, z, args)
        };
        return G__11278
      }();
      G__11271 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__11271__11272.call(this);
          case 1:
            return G__11271__11273.call(this, x);
          case 2:
            return G__11271__11274.call(this, x, y);
          case 3:
            return G__11271__11275.call(this, x, y, z);
          default:
            return G__11271__11276.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__11271.cljs$lang$maxFixedArity = 3;
      G__11271.cljs$lang$applyTo = G__11271__11276.cljs$lang$applyTo;
      return G__11271
    }()
  };
  var comp__11260 = function() {
    var G__11280__delegate = function(f1, f2, f3, fs) {
      var fs__11253 = cljs.core.reverse.call(null, cljs.core.list_STAR_.call(null, f1, f2, f3, fs));
      return function() {
        var G__11281__delegate = function(args) {
          var ret__11254 = cljs.core.apply.call(null, cljs.core.first.call(null, fs__11253), args);
          var fs__11255 = cljs.core.next.call(null, fs__11253);
          while(true) {
            if(cljs.core.truth_(fs__11255)) {
              var G__11282 = cljs.core.first.call(null, fs__11255).call(null, ret__11254);
              var G__11283 = cljs.core.next.call(null, fs__11255);
              ret__11254 = G__11282;
              fs__11255 = G__11283;
              continue
            }else {
              return ret__11254
            }
            break
          }
        };
        var G__11281 = function(var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
          }
          return G__11281__delegate.call(this, args)
        };
        G__11281.cljs$lang$maxFixedArity = 0;
        G__11281.cljs$lang$applyTo = function(arglist__11284) {
          var args = cljs.core.seq(arglist__11284);
          return G__11281__delegate.call(this, args)
        };
        return G__11281
      }()
    };
    var G__11280 = function(f1, f2, f3, var_args) {
      var fs = null;
      if(goog.isDef(var_args)) {
        fs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__11280__delegate.call(this, f1, f2, f3, fs)
    };
    G__11280.cljs$lang$maxFixedArity = 3;
    G__11280.cljs$lang$applyTo = function(arglist__11285) {
      var f1 = cljs.core.first(arglist__11285);
      var f2 = cljs.core.first(cljs.core.next(arglist__11285));
      var f3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__11285)));
      var fs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__11285)));
      return G__11280__delegate.call(this, f1, f2, f3, fs)
    };
    return G__11280
  }();
  comp = function(f1, f2, f3, var_args) {
    var fs = var_args;
    switch(arguments.length) {
      case 0:
        return comp__11256.call(this);
      case 1:
        return comp__11257.call(this, f1);
      case 2:
        return comp__11258.call(this, f1, f2);
      case 3:
        return comp__11259.call(this, f1, f2, f3);
      default:
        return comp__11260.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  comp.cljs$lang$maxFixedArity = 3;
  comp.cljs$lang$applyTo = comp__11260.cljs$lang$applyTo;
  return comp
}();
cljs.core.partial = function() {
  var partial = null;
  var partial__11286 = function(f, arg1) {
    return function() {
      var G__11291__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, args)
      };
      var G__11291 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__11291__delegate.call(this, args)
      };
      G__11291.cljs$lang$maxFixedArity = 0;
      G__11291.cljs$lang$applyTo = function(arglist__11292) {
        var args = cljs.core.seq(arglist__11292);
        return G__11291__delegate.call(this, args)
      };
      return G__11291
    }()
  };
  var partial__11287 = function(f, arg1, arg2) {
    return function() {
      var G__11293__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, arg2, args)
      };
      var G__11293 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__11293__delegate.call(this, args)
      };
      G__11293.cljs$lang$maxFixedArity = 0;
      G__11293.cljs$lang$applyTo = function(arglist__11294) {
        var args = cljs.core.seq(arglist__11294);
        return G__11293__delegate.call(this, args)
      };
      return G__11293
    }()
  };
  var partial__11288 = function(f, arg1, arg2, arg3) {
    return function() {
      var G__11295__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, arg2, arg3, args)
      };
      var G__11295 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__11295__delegate.call(this, args)
      };
      G__11295.cljs$lang$maxFixedArity = 0;
      G__11295.cljs$lang$applyTo = function(arglist__11296) {
        var args = cljs.core.seq(arglist__11296);
        return G__11295__delegate.call(this, args)
      };
      return G__11295
    }()
  };
  var partial__11289 = function() {
    var G__11297__delegate = function(f, arg1, arg2, arg3, more) {
      return function() {
        var G__11298__delegate = function(args) {
          return cljs.core.apply.call(null, f, arg1, arg2, arg3, cljs.core.concat.call(null, more, args))
        };
        var G__11298 = function(var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
          }
          return G__11298__delegate.call(this, args)
        };
        G__11298.cljs$lang$maxFixedArity = 0;
        G__11298.cljs$lang$applyTo = function(arglist__11299) {
          var args = cljs.core.seq(arglist__11299);
          return G__11298__delegate.call(this, args)
        };
        return G__11298
      }()
    };
    var G__11297 = function(f, arg1, arg2, arg3, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__11297__delegate.call(this, f, arg1, arg2, arg3, more)
    };
    G__11297.cljs$lang$maxFixedArity = 4;
    G__11297.cljs$lang$applyTo = function(arglist__11300) {
      var f = cljs.core.first(arglist__11300);
      var arg1 = cljs.core.first(cljs.core.next(arglist__11300));
      var arg2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__11300)));
      var arg3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__11300))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__11300))));
      return G__11297__delegate.call(this, f, arg1, arg2, arg3, more)
    };
    return G__11297
  }();
  partial = function(f, arg1, arg2, arg3, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return partial__11286.call(this, f, arg1);
      case 3:
        return partial__11287.call(this, f, arg1, arg2);
      case 4:
        return partial__11288.call(this, f, arg1, arg2, arg3);
      default:
        return partial__11289.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  partial.cljs$lang$maxFixedArity = 4;
  partial.cljs$lang$applyTo = partial__11289.cljs$lang$applyTo;
  return partial
}();
cljs.core.fnil = function() {
  var fnil = null;
  var fnil__11301 = function(f, x) {
    return function() {
      var G__11305 = null;
      var G__11305__11306 = function(a) {
        return f.call(null, cljs.core.truth_(a === null) ? x : a)
      };
      var G__11305__11307 = function(a, b) {
        return f.call(null, cljs.core.truth_(a === null) ? x : a, b)
      };
      var G__11305__11308 = function(a, b, c) {
        return f.call(null, cljs.core.truth_(a === null) ? x : a, b, c)
      };
      var G__11305__11309 = function() {
        var G__11311__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, cljs.core.truth_(a === null) ? x : a, b, c, ds)
        };
        var G__11311 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__11311__delegate.call(this, a, b, c, ds)
        };
        G__11311.cljs$lang$maxFixedArity = 3;
        G__11311.cljs$lang$applyTo = function(arglist__11312) {
          var a = cljs.core.first(arglist__11312);
          var b = cljs.core.first(cljs.core.next(arglist__11312));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__11312)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__11312)));
          return G__11311__delegate.call(this, a, b, c, ds)
        };
        return G__11311
      }();
      G__11305 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 1:
            return G__11305__11306.call(this, a);
          case 2:
            return G__11305__11307.call(this, a, b);
          case 3:
            return G__11305__11308.call(this, a, b, c);
          default:
            return G__11305__11309.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__11305.cljs$lang$maxFixedArity = 3;
      G__11305.cljs$lang$applyTo = G__11305__11309.cljs$lang$applyTo;
      return G__11305
    }()
  };
  var fnil__11302 = function(f, x, y) {
    return function() {
      var G__11313 = null;
      var G__11313__11314 = function(a, b) {
        return f.call(null, cljs.core.truth_(a === null) ? x : a, cljs.core.truth_(b === null) ? y : b)
      };
      var G__11313__11315 = function(a, b, c) {
        return f.call(null, cljs.core.truth_(a === null) ? x : a, cljs.core.truth_(b === null) ? y : b, c)
      };
      var G__11313__11316 = function() {
        var G__11318__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, cljs.core.truth_(a === null) ? x : a, cljs.core.truth_(b === null) ? y : b, c, ds)
        };
        var G__11318 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__11318__delegate.call(this, a, b, c, ds)
        };
        G__11318.cljs$lang$maxFixedArity = 3;
        G__11318.cljs$lang$applyTo = function(arglist__11319) {
          var a = cljs.core.first(arglist__11319);
          var b = cljs.core.first(cljs.core.next(arglist__11319));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__11319)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__11319)));
          return G__11318__delegate.call(this, a, b, c, ds)
        };
        return G__11318
      }();
      G__11313 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 2:
            return G__11313__11314.call(this, a, b);
          case 3:
            return G__11313__11315.call(this, a, b, c);
          default:
            return G__11313__11316.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__11313.cljs$lang$maxFixedArity = 3;
      G__11313.cljs$lang$applyTo = G__11313__11316.cljs$lang$applyTo;
      return G__11313
    }()
  };
  var fnil__11303 = function(f, x, y, z) {
    return function() {
      var G__11320 = null;
      var G__11320__11321 = function(a, b) {
        return f.call(null, cljs.core.truth_(a === null) ? x : a, cljs.core.truth_(b === null) ? y : b)
      };
      var G__11320__11322 = function(a, b, c) {
        return f.call(null, cljs.core.truth_(a === null) ? x : a, cljs.core.truth_(b === null) ? y : b, cljs.core.truth_(c === null) ? z : c)
      };
      var G__11320__11323 = function() {
        var G__11325__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, cljs.core.truth_(a === null) ? x : a, cljs.core.truth_(b === null) ? y : b, cljs.core.truth_(c === null) ? z : c, ds)
        };
        var G__11325 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__11325__delegate.call(this, a, b, c, ds)
        };
        G__11325.cljs$lang$maxFixedArity = 3;
        G__11325.cljs$lang$applyTo = function(arglist__11326) {
          var a = cljs.core.first(arglist__11326);
          var b = cljs.core.first(cljs.core.next(arglist__11326));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__11326)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__11326)));
          return G__11325__delegate.call(this, a, b, c, ds)
        };
        return G__11325
      }();
      G__11320 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 2:
            return G__11320__11321.call(this, a, b);
          case 3:
            return G__11320__11322.call(this, a, b, c);
          default:
            return G__11320__11323.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__11320.cljs$lang$maxFixedArity = 3;
      G__11320.cljs$lang$applyTo = G__11320__11323.cljs$lang$applyTo;
      return G__11320
    }()
  };
  fnil = function(f, x, y, z) {
    switch(arguments.length) {
      case 2:
        return fnil__11301.call(this, f, x);
      case 3:
        return fnil__11302.call(this, f, x, y);
      case 4:
        return fnil__11303.call(this, f, x, y, z)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return fnil
}();
cljs.core.map_indexed = function map_indexed(f, coll) {
  var mapi__11329 = function mpi(idx, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____11327 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3974__auto____11327)) {
        var s__11328 = temp__3974__auto____11327;
        return cljs.core.cons.call(null, f.call(null, idx, cljs.core.first.call(null, s__11328)), mpi.call(null, idx + 1, cljs.core.rest.call(null, s__11328)))
      }else {
        return null
      }
    })
  };
  return mapi__11329.call(null, 0, coll)
};
cljs.core.keep = function keep(f, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____11330 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3974__auto____11330)) {
      var s__11331 = temp__3974__auto____11330;
      var x__11332 = f.call(null, cljs.core.first.call(null, s__11331));
      if(cljs.core.truth_(x__11332 === null)) {
        return keep.call(null, f, cljs.core.rest.call(null, s__11331))
      }else {
        return cljs.core.cons.call(null, x__11332, keep.call(null, f, cljs.core.rest.call(null, s__11331)))
      }
    }else {
      return null
    }
  })
};
cljs.core.keep_indexed = function keep_indexed(f, coll) {
  var keepi__11342 = function kpi(idx, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____11339 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3974__auto____11339)) {
        var s__11340 = temp__3974__auto____11339;
        var x__11341 = f.call(null, idx, cljs.core.first.call(null, s__11340));
        if(cljs.core.truth_(x__11341 === null)) {
          return kpi.call(null, idx + 1, cljs.core.rest.call(null, s__11340))
        }else {
          return cljs.core.cons.call(null, x__11341, kpi.call(null, idx + 1, cljs.core.rest.call(null, s__11340)))
        }
      }else {
        return null
      }
    })
  };
  return keepi__11342.call(null, 0, coll)
};
cljs.core.every_pred = function() {
  var every_pred = null;
  var every_pred__11387 = function(p) {
    return function() {
      var ep1 = null;
      var ep1__11392 = function() {
        return true
      };
      var ep1__11393 = function(x) {
        return cljs.core.boolean$.call(null, p.call(null, x))
      };
      var ep1__11394 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____11349 = p.call(null, x);
          if(cljs.core.truth_(and__3822__auto____11349)) {
            return p.call(null, y)
          }else {
            return and__3822__auto____11349
          }
        }())
      };
      var ep1__11395 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____11350 = p.call(null, x);
          if(cljs.core.truth_(and__3822__auto____11350)) {
            var and__3822__auto____11351 = p.call(null, y);
            if(cljs.core.truth_(and__3822__auto____11351)) {
              return p.call(null, z)
            }else {
              return and__3822__auto____11351
            }
          }else {
            return and__3822__auto____11350
          }
        }())
      };
      var ep1__11396 = function() {
        var G__11398__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3822__auto____11352 = ep1.call(null, x, y, z);
            if(cljs.core.truth_(and__3822__auto____11352)) {
              return cljs.core.every_QMARK_.call(null, p, args)
            }else {
              return and__3822__auto____11352
            }
          }())
        };
        var G__11398 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__11398__delegate.call(this, x, y, z, args)
        };
        G__11398.cljs$lang$maxFixedArity = 3;
        G__11398.cljs$lang$applyTo = function(arglist__11399) {
          var x = cljs.core.first(arglist__11399);
          var y = cljs.core.first(cljs.core.next(arglist__11399));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__11399)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__11399)));
          return G__11398__delegate.call(this, x, y, z, args)
        };
        return G__11398
      }();
      ep1 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return ep1__11392.call(this);
          case 1:
            return ep1__11393.call(this, x);
          case 2:
            return ep1__11394.call(this, x, y);
          case 3:
            return ep1__11395.call(this, x, y, z);
          default:
            return ep1__11396.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      ep1.cljs$lang$maxFixedArity = 3;
      ep1.cljs$lang$applyTo = ep1__11396.cljs$lang$applyTo;
      return ep1
    }()
  };
  var every_pred__11388 = function(p1, p2) {
    return function() {
      var ep2 = null;
      var ep2__11400 = function() {
        return true
      };
      var ep2__11401 = function(x) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____11353 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____11353)) {
            return p2.call(null, x)
          }else {
            return and__3822__auto____11353
          }
        }())
      };
      var ep2__11402 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____11354 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____11354)) {
            var and__3822__auto____11355 = p1.call(null, y);
            if(cljs.core.truth_(and__3822__auto____11355)) {
              var and__3822__auto____11356 = p2.call(null, x);
              if(cljs.core.truth_(and__3822__auto____11356)) {
                return p2.call(null, y)
              }else {
                return and__3822__auto____11356
              }
            }else {
              return and__3822__auto____11355
            }
          }else {
            return and__3822__auto____11354
          }
        }())
      };
      var ep2__11403 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____11357 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____11357)) {
            var and__3822__auto____11358 = p1.call(null, y);
            if(cljs.core.truth_(and__3822__auto____11358)) {
              var and__3822__auto____11359 = p1.call(null, z);
              if(cljs.core.truth_(and__3822__auto____11359)) {
                var and__3822__auto____11360 = p2.call(null, x);
                if(cljs.core.truth_(and__3822__auto____11360)) {
                  var and__3822__auto____11361 = p2.call(null, y);
                  if(cljs.core.truth_(and__3822__auto____11361)) {
                    return p2.call(null, z)
                  }else {
                    return and__3822__auto____11361
                  }
                }else {
                  return and__3822__auto____11360
                }
              }else {
                return and__3822__auto____11359
              }
            }else {
              return and__3822__auto____11358
            }
          }else {
            return and__3822__auto____11357
          }
        }())
      };
      var ep2__11404 = function() {
        var G__11406__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3822__auto____11362 = ep2.call(null, x, y, z);
            if(cljs.core.truth_(and__3822__auto____11362)) {
              return cljs.core.every_QMARK_.call(null, function(p1__11333_SHARP_) {
                var and__3822__auto____11363 = p1.call(null, p1__11333_SHARP_);
                if(cljs.core.truth_(and__3822__auto____11363)) {
                  return p2.call(null, p1__11333_SHARP_)
                }else {
                  return and__3822__auto____11363
                }
              }, args)
            }else {
              return and__3822__auto____11362
            }
          }())
        };
        var G__11406 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__11406__delegate.call(this, x, y, z, args)
        };
        G__11406.cljs$lang$maxFixedArity = 3;
        G__11406.cljs$lang$applyTo = function(arglist__11407) {
          var x = cljs.core.first(arglist__11407);
          var y = cljs.core.first(cljs.core.next(arglist__11407));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__11407)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__11407)));
          return G__11406__delegate.call(this, x, y, z, args)
        };
        return G__11406
      }();
      ep2 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return ep2__11400.call(this);
          case 1:
            return ep2__11401.call(this, x);
          case 2:
            return ep2__11402.call(this, x, y);
          case 3:
            return ep2__11403.call(this, x, y, z);
          default:
            return ep2__11404.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      ep2.cljs$lang$maxFixedArity = 3;
      ep2.cljs$lang$applyTo = ep2__11404.cljs$lang$applyTo;
      return ep2
    }()
  };
  var every_pred__11389 = function(p1, p2, p3) {
    return function() {
      var ep3 = null;
      var ep3__11408 = function() {
        return true
      };
      var ep3__11409 = function(x) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____11364 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____11364)) {
            var and__3822__auto____11365 = p2.call(null, x);
            if(cljs.core.truth_(and__3822__auto____11365)) {
              return p3.call(null, x)
            }else {
              return and__3822__auto____11365
            }
          }else {
            return and__3822__auto____11364
          }
        }())
      };
      var ep3__11410 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____11366 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____11366)) {
            var and__3822__auto____11367 = p2.call(null, x);
            if(cljs.core.truth_(and__3822__auto____11367)) {
              var and__3822__auto____11368 = p3.call(null, x);
              if(cljs.core.truth_(and__3822__auto____11368)) {
                var and__3822__auto____11369 = p1.call(null, y);
                if(cljs.core.truth_(and__3822__auto____11369)) {
                  var and__3822__auto____11370 = p2.call(null, y);
                  if(cljs.core.truth_(and__3822__auto____11370)) {
                    return p3.call(null, y)
                  }else {
                    return and__3822__auto____11370
                  }
                }else {
                  return and__3822__auto____11369
                }
              }else {
                return and__3822__auto____11368
              }
            }else {
              return and__3822__auto____11367
            }
          }else {
            return and__3822__auto____11366
          }
        }())
      };
      var ep3__11411 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____11371 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____11371)) {
            var and__3822__auto____11372 = p2.call(null, x);
            if(cljs.core.truth_(and__3822__auto____11372)) {
              var and__3822__auto____11373 = p3.call(null, x);
              if(cljs.core.truth_(and__3822__auto____11373)) {
                var and__3822__auto____11374 = p1.call(null, y);
                if(cljs.core.truth_(and__3822__auto____11374)) {
                  var and__3822__auto____11375 = p2.call(null, y);
                  if(cljs.core.truth_(and__3822__auto____11375)) {
                    var and__3822__auto____11376 = p3.call(null, y);
                    if(cljs.core.truth_(and__3822__auto____11376)) {
                      var and__3822__auto____11377 = p1.call(null, z);
                      if(cljs.core.truth_(and__3822__auto____11377)) {
                        var and__3822__auto____11378 = p2.call(null, z);
                        if(cljs.core.truth_(and__3822__auto____11378)) {
                          return p3.call(null, z)
                        }else {
                          return and__3822__auto____11378
                        }
                      }else {
                        return and__3822__auto____11377
                      }
                    }else {
                      return and__3822__auto____11376
                    }
                  }else {
                    return and__3822__auto____11375
                  }
                }else {
                  return and__3822__auto____11374
                }
              }else {
                return and__3822__auto____11373
              }
            }else {
              return and__3822__auto____11372
            }
          }else {
            return and__3822__auto____11371
          }
        }())
      };
      var ep3__11412 = function() {
        var G__11414__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3822__auto____11379 = ep3.call(null, x, y, z);
            if(cljs.core.truth_(and__3822__auto____11379)) {
              return cljs.core.every_QMARK_.call(null, function(p1__11334_SHARP_) {
                var and__3822__auto____11380 = p1.call(null, p1__11334_SHARP_);
                if(cljs.core.truth_(and__3822__auto____11380)) {
                  var and__3822__auto____11381 = p2.call(null, p1__11334_SHARP_);
                  if(cljs.core.truth_(and__3822__auto____11381)) {
                    return p3.call(null, p1__11334_SHARP_)
                  }else {
                    return and__3822__auto____11381
                  }
                }else {
                  return and__3822__auto____11380
                }
              }, args)
            }else {
              return and__3822__auto____11379
            }
          }())
        };
        var G__11414 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__11414__delegate.call(this, x, y, z, args)
        };
        G__11414.cljs$lang$maxFixedArity = 3;
        G__11414.cljs$lang$applyTo = function(arglist__11415) {
          var x = cljs.core.first(arglist__11415);
          var y = cljs.core.first(cljs.core.next(arglist__11415));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__11415)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__11415)));
          return G__11414__delegate.call(this, x, y, z, args)
        };
        return G__11414
      }();
      ep3 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return ep3__11408.call(this);
          case 1:
            return ep3__11409.call(this, x);
          case 2:
            return ep3__11410.call(this, x, y);
          case 3:
            return ep3__11411.call(this, x, y, z);
          default:
            return ep3__11412.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      ep3.cljs$lang$maxFixedArity = 3;
      ep3.cljs$lang$applyTo = ep3__11412.cljs$lang$applyTo;
      return ep3
    }()
  };
  var every_pred__11390 = function() {
    var G__11416__delegate = function(p1, p2, p3, ps) {
      var ps__11382 = cljs.core.list_STAR_.call(null, p1, p2, p3, ps);
      return function() {
        var epn = null;
        var epn__11417 = function() {
          return true
        };
        var epn__11418 = function(x) {
          return cljs.core.every_QMARK_.call(null, function(p1__11335_SHARP_) {
            return p1__11335_SHARP_.call(null, x)
          }, ps__11382)
        };
        var epn__11419 = function(x, y) {
          return cljs.core.every_QMARK_.call(null, function(p1__11336_SHARP_) {
            var and__3822__auto____11383 = p1__11336_SHARP_.call(null, x);
            if(cljs.core.truth_(and__3822__auto____11383)) {
              return p1__11336_SHARP_.call(null, y)
            }else {
              return and__3822__auto____11383
            }
          }, ps__11382)
        };
        var epn__11420 = function(x, y, z) {
          return cljs.core.every_QMARK_.call(null, function(p1__11337_SHARP_) {
            var and__3822__auto____11384 = p1__11337_SHARP_.call(null, x);
            if(cljs.core.truth_(and__3822__auto____11384)) {
              var and__3822__auto____11385 = p1__11337_SHARP_.call(null, y);
              if(cljs.core.truth_(and__3822__auto____11385)) {
                return p1__11337_SHARP_.call(null, z)
              }else {
                return and__3822__auto____11385
              }
            }else {
              return and__3822__auto____11384
            }
          }, ps__11382)
        };
        var epn__11421 = function() {
          var G__11423__delegate = function(x, y, z, args) {
            return cljs.core.boolean$.call(null, function() {
              var and__3822__auto____11386 = epn.call(null, x, y, z);
              if(cljs.core.truth_(and__3822__auto____11386)) {
                return cljs.core.every_QMARK_.call(null, function(p1__11338_SHARP_) {
                  return cljs.core.every_QMARK_.call(null, p1__11338_SHARP_, args)
                }, ps__11382)
              }else {
                return and__3822__auto____11386
              }
            }())
          };
          var G__11423 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__11423__delegate.call(this, x, y, z, args)
          };
          G__11423.cljs$lang$maxFixedArity = 3;
          G__11423.cljs$lang$applyTo = function(arglist__11424) {
            var x = cljs.core.first(arglist__11424);
            var y = cljs.core.first(cljs.core.next(arglist__11424));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__11424)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__11424)));
            return G__11423__delegate.call(this, x, y, z, args)
          };
          return G__11423
        }();
        epn = function(x, y, z, var_args) {
          var args = var_args;
          switch(arguments.length) {
            case 0:
              return epn__11417.call(this);
            case 1:
              return epn__11418.call(this, x);
            case 2:
              return epn__11419.call(this, x, y);
            case 3:
              return epn__11420.call(this, x, y, z);
            default:
              return epn__11421.apply(this, arguments)
          }
          throw"Invalid arity: " + arguments.length;
        };
        epn.cljs$lang$maxFixedArity = 3;
        epn.cljs$lang$applyTo = epn__11421.cljs$lang$applyTo;
        return epn
      }()
    };
    var G__11416 = function(p1, p2, p3, var_args) {
      var ps = null;
      if(goog.isDef(var_args)) {
        ps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__11416__delegate.call(this, p1, p2, p3, ps)
    };
    G__11416.cljs$lang$maxFixedArity = 3;
    G__11416.cljs$lang$applyTo = function(arglist__11425) {
      var p1 = cljs.core.first(arglist__11425);
      var p2 = cljs.core.first(cljs.core.next(arglist__11425));
      var p3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__11425)));
      var ps = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__11425)));
      return G__11416__delegate.call(this, p1, p2, p3, ps)
    };
    return G__11416
  }();
  every_pred = function(p1, p2, p3, var_args) {
    var ps = var_args;
    switch(arguments.length) {
      case 1:
        return every_pred__11387.call(this, p1);
      case 2:
        return every_pred__11388.call(this, p1, p2);
      case 3:
        return every_pred__11389.call(this, p1, p2, p3);
      default:
        return every_pred__11390.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  every_pred.cljs$lang$maxFixedArity = 3;
  every_pred.cljs$lang$applyTo = every_pred__11390.cljs$lang$applyTo;
  return every_pred
}();
cljs.core.some_fn = function() {
  var some_fn = null;
  var some_fn__11465 = function(p) {
    return function() {
      var sp1 = null;
      var sp1__11470 = function() {
        return null
      };
      var sp1__11471 = function(x) {
        return p.call(null, x)
      };
      var sp1__11472 = function(x, y) {
        var or__3824__auto____11427 = p.call(null, x);
        if(cljs.core.truth_(or__3824__auto____11427)) {
          return or__3824__auto____11427
        }else {
          return p.call(null, y)
        }
      };
      var sp1__11473 = function(x, y, z) {
        var or__3824__auto____11428 = p.call(null, x);
        if(cljs.core.truth_(or__3824__auto____11428)) {
          return or__3824__auto____11428
        }else {
          var or__3824__auto____11429 = p.call(null, y);
          if(cljs.core.truth_(or__3824__auto____11429)) {
            return or__3824__auto____11429
          }else {
            return p.call(null, z)
          }
        }
      };
      var sp1__11474 = function() {
        var G__11476__delegate = function(x, y, z, args) {
          var or__3824__auto____11430 = sp1.call(null, x, y, z);
          if(cljs.core.truth_(or__3824__auto____11430)) {
            return or__3824__auto____11430
          }else {
            return cljs.core.some.call(null, p, args)
          }
        };
        var G__11476 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__11476__delegate.call(this, x, y, z, args)
        };
        G__11476.cljs$lang$maxFixedArity = 3;
        G__11476.cljs$lang$applyTo = function(arglist__11477) {
          var x = cljs.core.first(arglist__11477);
          var y = cljs.core.first(cljs.core.next(arglist__11477));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__11477)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__11477)));
          return G__11476__delegate.call(this, x, y, z, args)
        };
        return G__11476
      }();
      sp1 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return sp1__11470.call(this);
          case 1:
            return sp1__11471.call(this, x);
          case 2:
            return sp1__11472.call(this, x, y);
          case 3:
            return sp1__11473.call(this, x, y, z);
          default:
            return sp1__11474.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      sp1.cljs$lang$maxFixedArity = 3;
      sp1.cljs$lang$applyTo = sp1__11474.cljs$lang$applyTo;
      return sp1
    }()
  };
  var some_fn__11466 = function(p1, p2) {
    return function() {
      var sp2 = null;
      var sp2__11478 = function() {
        return null
      };
      var sp2__11479 = function(x) {
        var or__3824__auto____11431 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____11431)) {
          return or__3824__auto____11431
        }else {
          return p2.call(null, x)
        }
      };
      var sp2__11480 = function(x, y) {
        var or__3824__auto____11432 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____11432)) {
          return or__3824__auto____11432
        }else {
          var or__3824__auto____11433 = p1.call(null, y);
          if(cljs.core.truth_(or__3824__auto____11433)) {
            return or__3824__auto____11433
          }else {
            var or__3824__auto____11434 = p2.call(null, x);
            if(cljs.core.truth_(or__3824__auto____11434)) {
              return or__3824__auto____11434
            }else {
              return p2.call(null, y)
            }
          }
        }
      };
      var sp2__11481 = function(x, y, z) {
        var or__3824__auto____11435 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____11435)) {
          return or__3824__auto____11435
        }else {
          var or__3824__auto____11436 = p1.call(null, y);
          if(cljs.core.truth_(or__3824__auto____11436)) {
            return or__3824__auto____11436
          }else {
            var or__3824__auto____11437 = p1.call(null, z);
            if(cljs.core.truth_(or__3824__auto____11437)) {
              return or__3824__auto____11437
            }else {
              var or__3824__auto____11438 = p2.call(null, x);
              if(cljs.core.truth_(or__3824__auto____11438)) {
                return or__3824__auto____11438
              }else {
                var or__3824__auto____11439 = p2.call(null, y);
                if(cljs.core.truth_(or__3824__auto____11439)) {
                  return or__3824__auto____11439
                }else {
                  return p2.call(null, z)
                }
              }
            }
          }
        }
      };
      var sp2__11482 = function() {
        var G__11484__delegate = function(x, y, z, args) {
          var or__3824__auto____11440 = sp2.call(null, x, y, z);
          if(cljs.core.truth_(or__3824__auto____11440)) {
            return or__3824__auto____11440
          }else {
            return cljs.core.some.call(null, function(p1__11343_SHARP_) {
              var or__3824__auto____11441 = p1.call(null, p1__11343_SHARP_);
              if(cljs.core.truth_(or__3824__auto____11441)) {
                return or__3824__auto____11441
              }else {
                return p2.call(null, p1__11343_SHARP_)
              }
            }, args)
          }
        };
        var G__11484 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__11484__delegate.call(this, x, y, z, args)
        };
        G__11484.cljs$lang$maxFixedArity = 3;
        G__11484.cljs$lang$applyTo = function(arglist__11485) {
          var x = cljs.core.first(arglist__11485);
          var y = cljs.core.first(cljs.core.next(arglist__11485));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__11485)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__11485)));
          return G__11484__delegate.call(this, x, y, z, args)
        };
        return G__11484
      }();
      sp2 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return sp2__11478.call(this);
          case 1:
            return sp2__11479.call(this, x);
          case 2:
            return sp2__11480.call(this, x, y);
          case 3:
            return sp2__11481.call(this, x, y, z);
          default:
            return sp2__11482.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      sp2.cljs$lang$maxFixedArity = 3;
      sp2.cljs$lang$applyTo = sp2__11482.cljs$lang$applyTo;
      return sp2
    }()
  };
  var some_fn__11467 = function(p1, p2, p3) {
    return function() {
      var sp3 = null;
      var sp3__11486 = function() {
        return null
      };
      var sp3__11487 = function(x) {
        var or__3824__auto____11442 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____11442)) {
          return or__3824__auto____11442
        }else {
          var or__3824__auto____11443 = p2.call(null, x);
          if(cljs.core.truth_(or__3824__auto____11443)) {
            return or__3824__auto____11443
          }else {
            return p3.call(null, x)
          }
        }
      };
      var sp3__11488 = function(x, y) {
        var or__3824__auto____11444 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____11444)) {
          return or__3824__auto____11444
        }else {
          var or__3824__auto____11445 = p2.call(null, x);
          if(cljs.core.truth_(or__3824__auto____11445)) {
            return or__3824__auto____11445
          }else {
            var or__3824__auto____11446 = p3.call(null, x);
            if(cljs.core.truth_(or__3824__auto____11446)) {
              return or__3824__auto____11446
            }else {
              var or__3824__auto____11447 = p1.call(null, y);
              if(cljs.core.truth_(or__3824__auto____11447)) {
                return or__3824__auto____11447
              }else {
                var or__3824__auto____11448 = p2.call(null, y);
                if(cljs.core.truth_(or__3824__auto____11448)) {
                  return or__3824__auto____11448
                }else {
                  return p3.call(null, y)
                }
              }
            }
          }
        }
      };
      var sp3__11489 = function(x, y, z) {
        var or__3824__auto____11449 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____11449)) {
          return or__3824__auto____11449
        }else {
          var or__3824__auto____11450 = p2.call(null, x);
          if(cljs.core.truth_(or__3824__auto____11450)) {
            return or__3824__auto____11450
          }else {
            var or__3824__auto____11451 = p3.call(null, x);
            if(cljs.core.truth_(or__3824__auto____11451)) {
              return or__3824__auto____11451
            }else {
              var or__3824__auto____11452 = p1.call(null, y);
              if(cljs.core.truth_(or__3824__auto____11452)) {
                return or__3824__auto____11452
              }else {
                var or__3824__auto____11453 = p2.call(null, y);
                if(cljs.core.truth_(or__3824__auto____11453)) {
                  return or__3824__auto____11453
                }else {
                  var or__3824__auto____11454 = p3.call(null, y);
                  if(cljs.core.truth_(or__3824__auto____11454)) {
                    return or__3824__auto____11454
                  }else {
                    var or__3824__auto____11455 = p1.call(null, z);
                    if(cljs.core.truth_(or__3824__auto____11455)) {
                      return or__3824__auto____11455
                    }else {
                      var or__3824__auto____11456 = p2.call(null, z);
                      if(cljs.core.truth_(or__3824__auto____11456)) {
                        return or__3824__auto____11456
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
      var sp3__11490 = function() {
        var G__11492__delegate = function(x, y, z, args) {
          var or__3824__auto____11457 = sp3.call(null, x, y, z);
          if(cljs.core.truth_(or__3824__auto____11457)) {
            return or__3824__auto____11457
          }else {
            return cljs.core.some.call(null, function(p1__11344_SHARP_) {
              var or__3824__auto____11458 = p1.call(null, p1__11344_SHARP_);
              if(cljs.core.truth_(or__3824__auto____11458)) {
                return or__3824__auto____11458
              }else {
                var or__3824__auto____11459 = p2.call(null, p1__11344_SHARP_);
                if(cljs.core.truth_(or__3824__auto____11459)) {
                  return or__3824__auto____11459
                }else {
                  return p3.call(null, p1__11344_SHARP_)
                }
              }
            }, args)
          }
        };
        var G__11492 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__11492__delegate.call(this, x, y, z, args)
        };
        G__11492.cljs$lang$maxFixedArity = 3;
        G__11492.cljs$lang$applyTo = function(arglist__11493) {
          var x = cljs.core.first(arglist__11493);
          var y = cljs.core.first(cljs.core.next(arglist__11493));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__11493)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__11493)));
          return G__11492__delegate.call(this, x, y, z, args)
        };
        return G__11492
      }();
      sp3 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return sp3__11486.call(this);
          case 1:
            return sp3__11487.call(this, x);
          case 2:
            return sp3__11488.call(this, x, y);
          case 3:
            return sp3__11489.call(this, x, y, z);
          default:
            return sp3__11490.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      sp3.cljs$lang$maxFixedArity = 3;
      sp3.cljs$lang$applyTo = sp3__11490.cljs$lang$applyTo;
      return sp3
    }()
  };
  var some_fn__11468 = function() {
    var G__11494__delegate = function(p1, p2, p3, ps) {
      var ps__11460 = cljs.core.list_STAR_.call(null, p1, p2, p3, ps);
      return function() {
        var spn = null;
        var spn__11495 = function() {
          return null
        };
        var spn__11496 = function(x) {
          return cljs.core.some.call(null, function(p1__11345_SHARP_) {
            return p1__11345_SHARP_.call(null, x)
          }, ps__11460)
        };
        var spn__11497 = function(x, y) {
          return cljs.core.some.call(null, function(p1__11346_SHARP_) {
            var or__3824__auto____11461 = p1__11346_SHARP_.call(null, x);
            if(cljs.core.truth_(or__3824__auto____11461)) {
              return or__3824__auto____11461
            }else {
              return p1__11346_SHARP_.call(null, y)
            }
          }, ps__11460)
        };
        var spn__11498 = function(x, y, z) {
          return cljs.core.some.call(null, function(p1__11347_SHARP_) {
            var or__3824__auto____11462 = p1__11347_SHARP_.call(null, x);
            if(cljs.core.truth_(or__3824__auto____11462)) {
              return or__3824__auto____11462
            }else {
              var or__3824__auto____11463 = p1__11347_SHARP_.call(null, y);
              if(cljs.core.truth_(or__3824__auto____11463)) {
                return or__3824__auto____11463
              }else {
                return p1__11347_SHARP_.call(null, z)
              }
            }
          }, ps__11460)
        };
        var spn__11499 = function() {
          var G__11501__delegate = function(x, y, z, args) {
            var or__3824__auto____11464 = spn.call(null, x, y, z);
            if(cljs.core.truth_(or__3824__auto____11464)) {
              return or__3824__auto____11464
            }else {
              return cljs.core.some.call(null, function(p1__11348_SHARP_) {
                return cljs.core.some.call(null, p1__11348_SHARP_, args)
              }, ps__11460)
            }
          };
          var G__11501 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__11501__delegate.call(this, x, y, z, args)
          };
          G__11501.cljs$lang$maxFixedArity = 3;
          G__11501.cljs$lang$applyTo = function(arglist__11502) {
            var x = cljs.core.first(arglist__11502);
            var y = cljs.core.first(cljs.core.next(arglist__11502));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__11502)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__11502)));
            return G__11501__delegate.call(this, x, y, z, args)
          };
          return G__11501
        }();
        spn = function(x, y, z, var_args) {
          var args = var_args;
          switch(arguments.length) {
            case 0:
              return spn__11495.call(this);
            case 1:
              return spn__11496.call(this, x);
            case 2:
              return spn__11497.call(this, x, y);
            case 3:
              return spn__11498.call(this, x, y, z);
            default:
              return spn__11499.apply(this, arguments)
          }
          throw"Invalid arity: " + arguments.length;
        };
        spn.cljs$lang$maxFixedArity = 3;
        spn.cljs$lang$applyTo = spn__11499.cljs$lang$applyTo;
        return spn
      }()
    };
    var G__11494 = function(p1, p2, p3, var_args) {
      var ps = null;
      if(goog.isDef(var_args)) {
        ps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__11494__delegate.call(this, p1, p2, p3, ps)
    };
    G__11494.cljs$lang$maxFixedArity = 3;
    G__11494.cljs$lang$applyTo = function(arglist__11503) {
      var p1 = cljs.core.first(arglist__11503);
      var p2 = cljs.core.first(cljs.core.next(arglist__11503));
      var p3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__11503)));
      var ps = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__11503)));
      return G__11494__delegate.call(this, p1, p2, p3, ps)
    };
    return G__11494
  }();
  some_fn = function(p1, p2, p3, var_args) {
    var ps = var_args;
    switch(arguments.length) {
      case 1:
        return some_fn__11465.call(this, p1);
      case 2:
        return some_fn__11466.call(this, p1, p2);
      case 3:
        return some_fn__11467.call(this, p1, p2, p3);
      default:
        return some_fn__11468.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  some_fn.cljs$lang$maxFixedArity = 3;
  some_fn.cljs$lang$applyTo = some_fn__11468.cljs$lang$applyTo;
  return some_fn
}();
cljs.core.map = function() {
  var map = null;
  var map__11516 = function(f, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____11504 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3974__auto____11504)) {
        var s__11505 = temp__3974__auto____11504;
        return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s__11505)), map.call(null, f, cljs.core.rest.call(null, s__11505)))
      }else {
        return null
      }
    })
  };
  var map__11517 = function(f, c1, c2) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1__11506 = cljs.core.seq.call(null, c1);
      var s2__11507 = cljs.core.seq.call(null, c2);
      if(cljs.core.truth_(function() {
        var and__3822__auto____11508 = s1__11506;
        if(cljs.core.truth_(and__3822__auto____11508)) {
          return s2__11507
        }else {
          return and__3822__auto____11508
        }
      }())) {
        return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s1__11506), cljs.core.first.call(null, s2__11507)), map.call(null, f, cljs.core.rest.call(null, s1__11506), cljs.core.rest.call(null, s2__11507)))
      }else {
        return null
      }
    })
  };
  var map__11518 = function(f, c1, c2, c3) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1__11509 = cljs.core.seq.call(null, c1);
      var s2__11510 = cljs.core.seq.call(null, c2);
      var s3__11511 = cljs.core.seq.call(null, c3);
      if(cljs.core.truth_(function() {
        var and__3822__auto____11512 = s1__11509;
        if(cljs.core.truth_(and__3822__auto____11512)) {
          var and__3822__auto____11513 = s2__11510;
          if(cljs.core.truth_(and__3822__auto____11513)) {
            return s3__11511
          }else {
            return and__3822__auto____11513
          }
        }else {
          return and__3822__auto____11512
        }
      }())) {
        return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s1__11509), cljs.core.first.call(null, s2__11510), cljs.core.first.call(null, s3__11511)), map.call(null, f, cljs.core.rest.call(null, s1__11509), cljs.core.rest.call(null, s2__11510), cljs.core.rest.call(null, s3__11511)))
      }else {
        return null
      }
    })
  };
  var map__11519 = function() {
    var G__11521__delegate = function(f, c1, c2, c3, colls) {
      var step__11515 = function step(cs) {
        return new cljs.core.LazySeq(null, false, function() {
          var ss__11514 = map.call(null, cljs.core.seq, cs);
          if(cljs.core.truth_(cljs.core.every_QMARK_.call(null, cljs.core.identity, ss__11514))) {
            return cljs.core.cons.call(null, map.call(null, cljs.core.first, ss__11514), step.call(null, map.call(null, cljs.core.rest, ss__11514)))
          }else {
            return null
          }
        })
      };
      return map.call(null, function(p1__11426_SHARP_) {
        return cljs.core.apply.call(null, f, p1__11426_SHARP_)
      }, step__11515.call(null, cljs.core.conj.call(null, colls, c3, c2, c1)))
    };
    var G__11521 = function(f, c1, c2, c3, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__11521__delegate.call(this, f, c1, c2, c3, colls)
    };
    G__11521.cljs$lang$maxFixedArity = 4;
    G__11521.cljs$lang$applyTo = function(arglist__11522) {
      var f = cljs.core.first(arglist__11522);
      var c1 = cljs.core.first(cljs.core.next(arglist__11522));
      var c2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__11522)));
      var c3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__11522))));
      var colls = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__11522))));
      return G__11521__delegate.call(this, f, c1, c2, c3, colls)
    };
    return G__11521
  }();
  map = function(f, c1, c2, c3, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return map__11516.call(this, f, c1);
      case 3:
        return map__11517.call(this, f, c1, c2);
      case 4:
        return map__11518.call(this, f, c1, c2, c3);
      default:
        return map__11519.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  map.cljs$lang$maxFixedArity = 4;
  map.cljs$lang$applyTo = map__11519.cljs$lang$applyTo;
  return map
}();
cljs.core.take = function take(n, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    if(cljs.core.truth_(n > 0)) {
      var temp__3974__auto____11523 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3974__auto____11523)) {
        var s__11524 = temp__3974__auto____11523;
        return cljs.core.cons.call(null, cljs.core.first.call(null, s__11524), take.call(null, n - 1, cljs.core.rest.call(null, s__11524)))
      }else {
        return null
      }
    }else {
      return null
    }
  })
};
cljs.core.drop = function drop(n, coll) {
  var step__11527 = function(n, coll) {
    while(true) {
      var s__11525 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(function() {
        var and__3822__auto____11526 = n > 0;
        if(cljs.core.truth_(and__3822__auto____11526)) {
          return s__11525
        }else {
          return and__3822__auto____11526
        }
      }())) {
        var G__11528 = n - 1;
        var G__11529 = cljs.core.rest.call(null, s__11525);
        n = G__11528;
        coll = G__11529;
        continue
      }else {
        return s__11525
      }
      break
    }
  };
  return new cljs.core.LazySeq(null, false, function() {
    return step__11527.call(null, n, coll)
  })
};
cljs.core.drop_last = function() {
  var drop_last = null;
  var drop_last__11530 = function(s) {
    return drop_last.call(null, 1, s)
  };
  var drop_last__11531 = function(n, s) {
    return cljs.core.map.call(null, function(x, _) {
      return x
    }, s, cljs.core.drop.call(null, n, s))
  };
  drop_last = function(n, s) {
    switch(arguments.length) {
      case 1:
        return drop_last__11530.call(this, n);
      case 2:
        return drop_last__11531.call(this, n, s)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return drop_last
}();
cljs.core.take_last = function take_last(n, coll) {
  var s__11533 = cljs.core.seq.call(null, coll);
  var lead__11534 = cljs.core.seq.call(null, cljs.core.drop.call(null, n, coll));
  while(true) {
    if(cljs.core.truth_(lead__11534)) {
      var G__11535 = cljs.core.next.call(null, s__11533);
      var G__11536 = cljs.core.next.call(null, lead__11534);
      s__11533 = G__11535;
      lead__11534 = G__11536;
      continue
    }else {
      return s__11533
    }
    break
  }
};
cljs.core.drop_while = function drop_while(pred, coll) {
  var step__11539 = function(pred, coll) {
    while(true) {
      var s__11537 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(function() {
        var and__3822__auto____11538 = s__11537;
        if(cljs.core.truth_(and__3822__auto____11538)) {
          return pred.call(null, cljs.core.first.call(null, s__11537))
        }else {
          return and__3822__auto____11538
        }
      }())) {
        var G__11540 = pred;
        var G__11541 = cljs.core.rest.call(null, s__11537);
        pred = G__11540;
        coll = G__11541;
        continue
      }else {
        return s__11537
      }
      break
    }
  };
  return new cljs.core.LazySeq(null, false, function() {
    return step__11539.call(null, pred, coll)
  })
};
cljs.core.cycle = function cycle(coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____11542 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3974__auto____11542)) {
      var s__11543 = temp__3974__auto____11542;
      return cljs.core.concat.call(null, s__11543, cycle.call(null, s__11543))
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
  var repeat__11544 = function(x) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, x, repeat.call(null, x))
    })
  };
  var repeat__11545 = function(n, x) {
    return cljs.core.take.call(null, n, repeat.call(null, x))
  };
  repeat = function(n, x) {
    switch(arguments.length) {
      case 1:
        return repeat__11544.call(this, n);
      case 2:
        return repeat__11545.call(this, n, x)
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
  var repeatedly__11547 = function(f) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, f.call(null), repeatedly.call(null, f))
    })
  };
  var repeatedly__11548 = function(n, f) {
    return cljs.core.take.call(null, n, repeatedly.call(null, f))
  };
  repeatedly = function(n, f) {
    switch(arguments.length) {
      case 1:
        return repeatedly__11547.call(this, n);
      case 2:
        return repeatedly__11548.call(this, n, f)
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
  var interleave__11554 = function(c1, c2) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1__11550 = cljs.core.seq.call(null, c1);
      var s2__11551 = cljs.core.seq.call(null, c2);
      if(cljs.core.truth_(function() {
        var and__3822__auto____11552 = s1__11550;
        if(cljs.core.truth_(and__3822__auto____11552)) {
          return s2__11551
        }else {
          return and__3822__auto____11552
        }
      }())) {
        return cljs.core.cons.call(null, cljs.core.first.call(null, s1__11550), cljs.core.cons.call(null, cljs.core.first.call(null, s2__11551), interleave.call(null, cljs.core.rest.call(null, s1__11550), cljs.core.rest.call(null, s2__11551))))
      }else {
        return null
      }
    })
  };
  var interleave__11555 = function() {
    var G__11557__delegate = function(c1, c2, colls) {
      return new cljs.core.LazySeq(null, false, function() {
        var ss__11553 = cljs.core.map.call(null, cljs.core.seq, cljs.core.conj.call(null, colls, c2, c1));
        if(cljs.core.truth_(cljs.core.every_QMARK_.call(null, cljs.core.identity, ss__11553))) {
          return cljs.core.concat.call(null, cljs.core.map.call(null, cljs.core.first, ss__11553), cljs.core.apply.call(null, interleave, cljs.core.map.call(null, cljs.core.rest, ss__11553)))
        }else {
          return null
        }
      })
    };
    var G__11557 = function(c1, c2, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__11557__delegate.call(this, c1, c2, colls)
    };
    G__11557.cljs$lang$maxFixedArity = 2;
    G__11557.cljs$lang$applyTo = function(arglist__11558) {
      var c1 = cljs.core.first(arglist__11558);
      var c2 = cljs.core.first(cljs.core.next(arglist__11558));
      var colls = cljs.core.rest(cljs.core.next(arglist__11558));
      return G__11557__delegate.call(this, c1, c2, colls)
    };
    return G__11557
  }();
  interleave = function(c1, c2, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return interleave__11554.call(this, c1, c2);
      default:
        return interleave__11555.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  interleave.cljs$lang$maxFixedArity = 2;
  interleave.cljs$lang$applyTo = interleave__11555.cljs$lang$applyTo;
  return interleave
}();
cljs.core.interpose = function interpose(sep, coll) {
  return cljs.core.drop.call(null, 1, cljs.core.interleave.call(null, cljs.core.repeat.call(null, sep), coll))
};
cljs.core.flatten1 = function flatten1(colls) {
  var cat__11561 = function cat(coll, colls) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3971__auto____11559 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3971__auto____11559)) {
        var coll__11560 = temp__3971__auto____11559;
        return cljs.core.cons.call(null, cljs.core.first.call(null, coll__11560), cat.call(null, cljs.core.rest.call(null, coll__11560), colls))
      }else {
        if(cljs.core.truth_(cljs.core.seq.call(null, colls))) {
          return cat.call(null, cljs.core.first.call(null, colls), cljs.core.rest.call(null, colls))
        }else {
          return null
        }
      }
    })
  };
  return cat__11561.call(null, null, colls)
};
cljs.core.mapcat = function() {
  var mapcat = null;
  var mapcat__11562 = function(f, coll) {
    return cljs.core.flatten1.call(null, cljs.core.map.call(null, f, coll))
  };
  var mapcat__11563 = function() {
    var G__11565__delegate = function(f, coll, colls) {
      return cljs.core.flatten1.call(null, cljs.core.apply.call(null, cljs.core.map, f, coll, colls))
    };
    var G__11565 = function(f, coll, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__11565__delegate.call(this, f, coll, colls)
    };
    G__11565.cljs$lang$maxFixedArity = 2;
    G__11565.cljs$lang$applyTo = function(arglist__11566) {
      var f = cljs.core.first(arglist__11566);
      var coll = cljs.core.first(cljs.core.next(arglist__11566));
      var colls = cljs.core.rest(cljs.core.next(arglist__11566));
      return G__11565__delegate.call(this, f, coll, colls)
    };
    return G__11565
  }();
  mapcat = function(f, coll, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return mapcat__11562.call(this, f, coll);
      default:
        return mapcat__11563.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  mapcat.cljs$lang$maxFixedArity = 2;
  mapcat.cljs$lang$applyTo = mapcat__11563.cljs$lang$applyTo;
  return mapcat
}();
cljs.core.filter = function filter(pred, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____11567 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3974__auto____11567)) {
      var s__11568 = temp__3974__auto____11567;
      var f__11569 = cljs.core.first.call(null, s__11568);
      var r__11570 = cljs.core.rest.call(null, s__11568);
      if(cljs.core.truth_(pred.call(null, f__11569))) {
        return cljs.core.cons.call(null, f__11569, filter.call(null, pred, r__11570))
      }else {
        return filter.call(null, pred, r__11570)
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
  var walk__11572 = function walk(node) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, node, cljs.core.truth_(branch_QMARK_.call(null, node)) ? cljs.core.mapcat.call(null, walk, children.call(null, node)) : null)
    })
  };
  return walk__11572.call(null, root)
};
cljs.core.flatten = function flatten(x) {
  return cljs.core.filter.call(null, function(p1__11571_SHARP_) {
    return cljs.core.not.call(null, cljs.core.sequential_QMARK_.call(null, p1__11571_SHARP_))
  }, cljs.core.rest.call(null, cljs.core.tree_seq.call(null, cljs.core.sequential_QMARK_, cljs.core.seq, x)))
};
cljs.core.into = function into(to, from) {
  return cljs.core.reduce.call(null, cljs.core._conj, to, from)
};
cljs.core.partition = function() {
  var partition = null;
  var partition__11579 = function(n, coll) {
    return partition.call(null, n, n, coll)
  };
  var partition__11580 = function(n, step, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____11573 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3974__auto____11573)) {
        var s__11574 = temp__3974__auto____11573;
        var p__11575 = cljs.core.take.call(null, n, s__11574);
        if(cljs.core.truth_(cljs.core._EQ_.call(null, n, cljs.core.count.call(null, p__11575)))) {
          return cljs.core.cons.call(null, p__11575, partition.call(null, n, step, cljs.core.drop.call(null, step, s__11574)))
        }else {
          return null
        }
      }else {
        return null
      }
    })
  };
  var partition__11581 = function(n, step, pad, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____11576 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3974__auto____11576)) {
        var s__11577 = temp__3974__auto____11576;
        var p__11578 = cljs.core.take.call(null, n, s__11577);
        if(cljs.core.truth_(cljs.core._EQ_.call(null, n, cljs.core.count.call(null, p__11578)))) {
          return cljs.core.cons.call(null, p__11578, partition.call(null, n, step, pad, cljs.core.drop.call(null, step, s__11577)))
        }else {
          return cljs.core.list.call(null, cljs.core.take.call(null, n, cljs.core.concat.call(null, p__11578, pad)))
        }
      }else {
        return null
      }
    })
  };
  partition = function(n, step, pad, coll) {
    switch(arguments.length) {
      case 2:
        return partition__11579.call(this, n, step);
      case 3:
        return partition__11580.call(this, n, step, pad);
      case 4:
        return partition__11581.call(this, n, step, pad, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return partition
}();
cljs.core.get_in = function() {
  var get_in = null;
  var get_in__11587 = function(m, ks) {
    return cljs.core.reduce.call(null, cljs.core.get, m, ks)
  };
  var get_in__11588 = function(m, ks, not_found) {
    var sentinel__11583 = cljs.core.lookup_sentinel;
    var m__11584 = m;
    var ks__11585 = cljs.core.seq.call(null, ks);
    while(true) {
      if(cljs.core.truth_(ks__11585)) {
        var m__11586 = cljs.core.get.call(null, m__11584, cljs.core.first.call(null, ks__11585), sentinel__11583);
        if(cljs.core.truth_(sentinel__11583 === m__11586)) {
          return not_found
        }else {
          var G__11590 = sentinel__11583;
          var G__11591 = m__11586;
          var G__11592 = cljs.core.next.call(null, ks__11585);
          sentinel__11583 = G__11590;
          m__11584 = G__11591;
          ks__11585 = G__11592;
          continue
        }
      }else {
        return m__11584
      }
      break
    }
  };
  get_in = function(m, ks, not_found) {
    switch(arguments.length) {
      case 2:
        return get_in__11587.call(this, m, ks);
      case 3:
        return get_in__11588.call(this, m, ks, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return get_in
}();
cljs.core.assoc_in = function assoc_in(m, p__11593, v) {
  var vec__11594__11595 = p__11593;
  var k__11596 = cljs.core.nth.call(null, vec__11594__11595, 0, null);
  var ks__11597 = cljs.core.nthnext.call(null, vec__11594__11595, 1);
  if(cljs.core.truth_(ks__11597)) {
    return cljs.core.assoc.call(null, m, k__11596, assoc_in.call(null, cljs.core.get.call(null, m, k__11596), ks__11597, v))
  }else {
    return cljs.core.assoc.call(null, m, k__11596, v)
  }
};
cljs.core.update_in = function() {
  var update_in__delegate = function(m, p__11598, f, args) {
    var vec__11599__11600 = p__11598;
    var k__11601 = cljs.core.nth.call(null, vec__11599__11600, 0, null);
    var ks__11602 = cljs.core.nthnext.call(null, vec__11599__11600, 1);
    if(cljs.core.truth_(ks__11602)) {
      return cljs.core.assoc.call(null, m, k__11601, cljs.core.apply.call(null, update_in, cljs.core.get.call(null, m, k__11601), ks__11602, f, args))
    }else {
      return cljs.core.assoc.call(null, m, k__11601, cljs.core.apply.call(null, f, cljs.core.get.call(null, m, k__11601), args))
    }
  };
  var update_in = function(m, p__11598, f, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
    }
    return update_in__delegate.call(this, m, p__11598, f, args)
  };
  update_in.cljs$lang$maxFixedArity = 3;
  update_in.cljs$lang$applyTo = function(arglist__11603) {
    var m = cljs.core.first(arglist__11603);
    var p__11598 = cljs.core.first(cljs.core.next(arglist__11603));
    var f = cljs.core.first(cljs.core.next(cljs.core.next(arglist__11603)));
    var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__11603)));
    return update_in__delegate.call(this, m, p__11598, f, args)
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
  var this__11604 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.Vector.prototype.cljs$core$ILookup$ = true;
cljs.core.Vector.prototype.cljs$core$ILookup$_lookup = function() {
  var G__11637 = null;
  var G__11637__11638 = function(coll, k) {
    var this__11605 = this;
    return cljs.core._nth.call(null, coll, k, null)
  };
  var G__11637__11639 = function(coll, k, not_found) {
    var this__11606 = this;
    return cljs.core._nth.call(null, coll, k, not_found)
  };
  G__11637 = function(coll, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__11637__11638.call(this, coll, k);
      case 3:
        return G__11637__11639.call(this, coll, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__11637
}();
cljs.core.Vector.prototype.cljs$core$IAssociative$ = true;
cljs.core.Vector.prototype.cljs$core$IAssociative$_assoc = function(coll, k, v) {
  var this__11607 = this;
  var new_array__11608 = cljs.core.aclone.call(null, this__11607.array);
  new_array__11608[k] = v;
  return new cljs.core.Vector(this__11607.meta, new_array__11608)
};
cljs.core.Vector.prototype.cljs$core$IFn$ = true;
cljs.core.Vector.prototype.call = function() {
  var G__11641 = null;
  var G__11641__11642 = function(tsym11609, k) {
    var this__11611 = this;
    var tsym11609__11612 = this;
    var coll__11613 = tsym11609__11612;
    return cljs.core._lookup.call(null, coll__11613, k)
  };
  var G__11641__11643 = function(tsym11610, k, not_found) {
    var this__11614 = this;
    var tsym11610__11615 = this;
    var coll__11616 = tsym11610__11615;
    return cljs.core._lookup.call(null, coll__11616, k, not_found)
  };
  G__11641 = function(tsym11610, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__11641__11642.call(this, tsym11610, k);
      case 3:
        return G__11641__11643.call(this, tsym11610, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__11641
}();
cljs.core.Vector.prototype.cljs$core$ISequential$ = true;
cljs.core.Vector.prototype.cljs$core$ICollection$ = true;
cljs.core.Vector.prototype.cljs$core$ICollection$_conj = function(coll, o) {
  var this__11617 = this;
  var new_array__11618 = cljs.core.aclone.call(null, this__11617.array);
  new_array__11618.push(o);
  return new cljs.core.Vector(this__11617.meta, new_array__11618)
};
cljs.core.Vector.prototype.cljs$core$IReduce$ = true;
cljs.core.Vector.prototype.cljs$core$IReduce$_reduce = function() {
  var G__11645 = null;
  var G__11645__11646 = function(v, f) {
    var this__11619 = this;
    return cljs.core.ci_reduce.call(null, this__11619.array, f)
  };
  var G__11645__11647 = function(v, f, start) {
    var this__11620 = this;
    return cljs.core.ci_reduce.call(null, this__11620.array, f, start)
  };
  G__11645 = function(v, f, start) {
    switch(arguments.length) {
      case 2:
        return G__11645__11646.call(this, v, f);
      case 3:
        return G__11645__11647.call(this, v, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__11645
}();
cljs.core.Vector.prototype.cljs$core$ISeqable$ = true;
cljs.core.Vector.prototype.cljs$core$ISeqable$_seq = function(coll) {
  var this__11621 = this;
  if(cljs.core.truth_(this__11621.array.length > 0)) {
    var vector_seq__11622 = function vector_seq(i) {
      return new cljs.core.LazySeq(null, false, function() {
        if(cljs.core.truth_(i < this__11621.array.length)) {
          return cljs.core.cons.call(null, this__11621.array[i], vector_seq.call(null, i + 1))
        }else {
          return null
        }
      })
    };
    return vector_seq__11622.call(null, 0)
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$ICounted$ = true;
cljs.core.Vector.prototype.cljs$core$ICounted$_count = function(coll) {
  var this__11623 = this;
  return this__11623.array.length
};
cljs.core.Vector.prototype.cljs$core$IStack$ = true;
cljs.core.Vector.prototype.cljs$core$IStack$_peek = function(coll) {
  var this__11624 = this;
  var count__11625 = this__11624.array.length;
  if(cljs.core.truth_(count__11625 > 0)) {
    return this__11624.array[count__11625 - 1]
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$IStack$_pop = function(coll) {
  var this__11626 = this;
  if(cljs.core.truth_(this__11626.array.length > 0)) {
    var new_array__11627 = cljs.core.aclone.call(null, this__11626.array);
    new_array__11627.pop();
    return new cljs.core.Vector(this__11626.meta, new_array__11627)
  }else {
    throw new Error("Can't pop empty vector");
  }
};
cljs.core.Vector.prototype.cljs$core$IVector$ = true;
cljs.core.Vector.prototype.cljs$core$IVector$_assoc_n = function(coll, n, val) {
  var this__11628 = this;
  return cljs.core._assoc.call(null, coll, n, val)
};
cljs.core.Vector.prototype.cljs$core$IEquiv$ = true;
cljs.core.Vector.prototype.cljs$core$IEquiv$_equiv = function(coll, other) {
  var this__11629 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Vector.prototype.cljs$core$IWithMeta$ = true;
cljs.core.Vector.prototype.cljs$core$IWithMeta$_with_meta = function(coll, meta) {
  var this__11630 = this;
  return new cljs.core.Vector(meta, this__11630.array)
};
cljs.core.Vector.prototype.cljs$core$IMeta$ = true;
cljs.core.Vector.prototype.cljs$core$IMeta$_meta = function(coll) {
  var this__11631 = this;
  return this__11631.meta
};
cljs.core.Vector.prototype.cljs$core$IIndexed$ = true;
cljs.core.Vector.prototype.cljs$core$IIndexed$_nth = function() {
  var G__11649 = null;
  var G__11649__11650 = function(coll, n) {
    var this__11632 = this;
    if(cljs.core.truth_(function() {
      var and__3822__auto____11633 = 0 <= n;
      if(cljs.core.truth_(and__3822__auto____11633)) {
        return n < this__11632.array.length
      }else {
        return and__3822__auto____11633
      }
    }())) {
      return this__11632.array[n]
    }else {
      return null
    }
  };
  var G__11649__11651 = function(coll, n, not_found) {
    var this__11634 = this;
    if(cljs.core.truth_(function() {
      var and__3822__auto____11635 = 0 <= n;
      if(cljs.core.truth_(and__3822__auto____11635)) {
        return n < this__11634.array.length
      }else {
        return and__3822__auto____11635
      }
    }())) {
      return this__11634.array[n]
    }else {
      return not_found
    }
  };
  G__11649 = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__11649__11650.call(this, coll, n);
      case 3:
        return G__11649__11651.call(this, coll, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__11649
}();
cljs.core.Vector.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.Vector.prototype.cljs$core$IEmptyableCollection$_empty = function(coll) {
  var this__11636 = this;
  return cljs.core.with_meta.call(null, cljs.core.Vector.EMPTY, this__11636.meta)
};
cljs.core.Vector;
cljs.core.Vector.EMPTY = new cljs.core.Vector(null, []);
cljs.core.Vector.fromArray = function(xs) {
  return new cljs.core.Vector(null, xs)
};
cljs.core.tail_off = function tail_off(pv) {
  var cnt__11653 = pv.cnt;
  if(cljs.core.truth_(cnt__11653 < 32)) {
    return 0
  }else {
    return cnt__11653 - 1 >> 5 << 5
  }
};
cljs.core.new_path = function new_path(level, node) {
  var ll__11654 = level;
  var ret__11655 = node;
  while(true) {
    if(cljs.core.truth_(cljs.core._EQ_.call(null, 0, ll__11654))) {
      return ret__11655
    }else {
      var embed__11656 = ret__11655;
      var r__11657 = cljs.core.aclone.call(null, cljs.core.PersistentVector.EMPTY_NODE);
      var ___11658 = r__11657[0] = embed__11656;
      var G__11659 = ll__11654 - 5;
      var G__11660 = r__11657;
      ll__11654 = G__11659;
      ret__11655 = G__11660;
      continue
    }
    break
  }
};
cljs.core.push_tail = function push_tail(pv, level, parent, tailnode) {
  var ret__11661 = cljs.core.aclone.call(null, parent);
  var subidx__11662 = pv.cnt - 1 >> level & 31;
  if(cljs.core.truth_(cljs.core._EQ_.call(null, 5, level))) {
    ret__11661[subidx__11662] = tailnode;
    return ret__11661
  }else {
    var temp__3971__auto____11663 = parent[subidx__11662];
    if(cljs.core.truth_(temp__3971__auto____11663)) {
      var child__11664 = temp__3971__auto____11663;
      var node_to_insert__11665 = push_tail.call(null, pv, level - 5, child__11664, tailnode);
      var ___11666 = ret__11661[subidx__11662] = node_to_insert__11665;
      return ret__11661
    }else {
      var node_to_insert__11667 = cljs.core.new_path.call(null, level - 5, tailnode);
      var ___11668 = ret__11661[subidx__11662] = node_to_insert__11667;
      return ret__11661
    }
  }
};
cljs.core.array_for = function array_for(pv, i) {
  if(cljs.core.truth_(function() {
    var and__3822__auto____11669 = 0 <= i;
    if(cljs.core.truth_(and__3822__auto____11669)) {
      return i < pv.cnt
    }else {
      return and__3822__auto____11669
    }
  }())) {
    if(cljs.core.truth_(i >= cljs.core.tail_off.call(null, pv))) {
      return pv.tail
    }else {
      var node__11670 = pv.root;
      var level__11671 = pv.shift;
      while(true) {
        if(cljs.core.truth_(level__11671 > 0)) {
          var G__11672 = node__11670[i >> level__11671 & 31];
          var G__11673 = level__11671 - 5;
          node__11670 = G__11672;
          level__11671 = G__11673;
          continue
        }else {
          return node__11670
        }
        break
      }
    }
  }else {
    throw new Error(cljs.core.str.call(null, "No item ", i, " in vector of length ", pv.cnt));
  }
};
cljs.core.do_assoc = function do_assoc(pv, level, node, i, val) {
  var ret__11674 = cljs.core.aclone.call(null, node);
  if(cljs.core.truth_(level === 0)) {
    ret__11674[i & 31] = val;
    return ret__11674
  }else {
    var subidx__11675 = i >> level & 31;
    var ___11676 = ret__11674[subidx__11675] = do_assoc.call(null, pv, level - 5, node[subidx__11675], i, val);
    return ret__11674
  }
};
cljs.core.pop_tail = function pop_tail(pv, level, node) {
  var subidx__11677 = pv.cnt - 2 >> level & 31;
  if(cljs.core.truth_(level > 5)) {
    var new_child__11678 = pop_tail.call(null, pv, level - 5, node[subidx__11677]);
    if(cljs.core.truth_(function() {
      var and__3822__auto____11679 = new_child__11678 === null;
      if(cljs.core.truth_(and__3822__auto____11679)) {
        return subidx__11677 === 0
      }else {
        return and__3822__auto____11679
      }
    }())) {
      return null
    }else {
      var ret__11680 = cljs.core.aclone.call(null, node);
      var ___11681 = ret__11680[subidx__11677] = new_child__11678;
      return ret__11680
    }
  }else {
    if(cljs.core.truth_(subidx__11677 === 0)) {
      return null
    }else {
      if(cljs.core.truth_("\ufdd0'else")) {
        var ret__11682 = cljs.core.aclone.call(null, node);
        var ___11683 = ret__11682[subidx__11677] = null;
        return ret__11682
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
  var this__11684 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.PersistentVector.prototype.cljs$core$ILookup$ = true;
cljs.core.PersistentVector.prototype.cljs$core$ILookup$_lookup = function() {
  var G__11724 = null;
  var G__11724__11725 = function(coll, k) {
    var this__11685 = this;
    return cljs.core._nth.call(null, coll, k, null)
  };
  var G__11724__11726 = function(coll, k, not_found) {
    var this__11686 = this;
    return cljs.core._nth.call(null, coll, k, not_found)
  };
  G__11724 = function(coll, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__11724__11725.call(this, coll, k);
      case 3:
        return G__11724__11726.call(this, coll, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__11724
}();
cljs.core.PersistentVector.prototype.cljs$core$IAssociative$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IAssociative$_assoc = function(coll, k, v) {
  var this__11687 = this;
  if(cljs.core.truth_(function() {
    var and__3822__auto____11688 = 0 <= k;
    if(cljs.core.truth_(and__3822__auto____11688)) {
      return k < this__11687.cnt
    }else {
      return and__3822__auto____11688
    }
  }())) {
    if(cljs.core.truth_(cljs.core.tail_off.call(null, coll) <= k)) {
      var new_tail__11689 = cljs.core.aclone.call(null, this__11687.tail);
      new_tail__11689[k & 31] = v;
      return new cljs.core.PersistentVector(this__11687.meta, this__11687.cnt, this__11687.shift, this__11687.root, new_tail__11689)
    }else {
      return new cljs.core.PersistentVector(this__11687.meta, this__11687.cnt, this__11687.shift, cljs.core.do_assoc.call(null, coll, this__11687.shift, this__11687.root, k, v), this__11687.tail)
    }
  }else {
    if(cljs.core.truth_(cljs.core._EQ_.call(null, k, this__11687.cnt))) {
      return cljs.core._conj.call(null, coll, v)
    }else {
      if(cljs.core.truth_("\ufdd0'else")) {
        throw new Error(cljs.core.str.call(null, "Index ", k, " out of bounds  [0,", this__11687.cnt, "]"));
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IFn$ = true;
cljs.core.PersistentVector.prototype.call = function() {
  var G__11728 = null;
  var G__11728__11729 = function(tsym11690, k) {
    var this__11692 = this;
    var tsym11690__11693 = this;
    var coll__11694 = tsym11690__11693;
    return cljs.core._lookup.call(null, coll__11694, k)
  };
  var G__11728__11730 = function(tsym11691, k, not_found) {
    var this__11695 = this;
    var tsym11691__11696 = this;
    var coll__11697 = tsym11691__11696;
    return cljs.core._lookup.call(null, coll__11697, k, not_found)
  };
  G__11728 = function(tsym11691, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__11728__11729.call(this, tsym11691, k);
      case 3:
        return G__11728__11730.call(this, tsym11691, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__11728
}();
cljs.core.PersistentVector.prototype.cljs$core$ISequential$ = true;
cljs.core.PersistentVector.prototype.cljs$core$ICollection$ = true;
cljs.core.PersistentVector.prototype.cljs$core$ICollection$_conj = function(coll, o) {
  var this__11698 = this;
  if(cljs.core.truth_(this__11698.cnt - cljs.core.tail_off.call(null, coll) < 32)) {
    var new_tail__11699 = cljs.core.aclone.call(null, this__11698.tail);
    new_tail__11699.push(o);
    return new cljs.core.PersistentVector(this__11698.meta, this__11698.cnt + 1, this__11698.shift, this__11698.root, new_tail__11699)
  }else {
    var root_overflow_QMARK___11700 = this__11698.cnt >> 5 > 1 << this__11698.shift;
    var new_shift__11701 = cljs.core.truth_(root_overflow_QMARK___11700) ? this__11698.shift + 5 : this__11698.shift;
    var new_root__11703 = cljs.core.truth_(root_overflow_QMARK___11700) ? function() {
      var n_r__11702 = cljs.core.aclone.call(null, cljs.core.PersistentVector.EMPTY_NODE);
      n_r__11702[0] = this__11698.root;
      n_r__11702[1] = cljs.core.new_path.call(null, this__11698.shift, this__11698.tail);
      return n_r__11702
    }() : cljs.core.push_tail.call(null, coll, this__11698.shift, this__11698.root, this__11698.tail);
    return new cljs.core.PersistentVector(this__11698.meta, this__11698.cnt + 1, new_shift__11701, new_root__11703, [o])
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IReduce$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IReduce$_reduce = function() {
  var G__11732 = null;
  var G__11732__11733 = function(v, f) {
    var this__11704 = this;
    return cljs.core.ci_reduce.call(null, v, f)
  };
  var G__11732__11734 = function(v, f, start) {
    var this__11705 = this;
    return cljs.core.ci_reduce.call(null, v, f, start)
  };
  G__11732 = function(v, f, start) {
    switch(arguments.length) {
      case 2:
        return G__11732__11733.call(this, v, f);
      case 3:
        return G__11732__11734.call(this, v, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__11732
}();
cljs.core.PersistentVector.prototype.cljs$core$ISeqable$ = true;
cljs.core.PersistentVector.prototype.cljs$core$ISeqable$_seq = function(coll) {
  var this__11706 = this;
  if(cljs.core.truth_(this__11706.cnt > 0)) {
    var vector_seq__11707 = function vector_seq(i) {
      return new cljs.core.LazySeq(null, false, function() {
        if(cljs.core.truth_(i < this__11706.cnt)) {
          return cljs.core.cons.call(null, cljs.core._nth.call(null, coll, i), vector_seq.call(null, i + 1))
        }else {
          return null
        }
      })
    };
    return vector_seq__11707.call(null, 0)
  }else {
    return null
  }
};
cljs.core.PersistentVector.prototype.cljs$core$ICounted$ = true;
cljs.core.PersistentVector.prototype.cljs$core$ICounted$_count = function(coll) {
  var this__11708 = this;
  return this__11708.cnt
};
cljs.core.PersistentVector.prototype.cljs$core$IStack$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IStack$_peek = function(coll) {
  var this__11709 = this;
  if(cljs.core.truth_(this__11709.cnt > 0)) {
    return cljs.core._nth.call(null, coll, this__11709.cnt - 1)
  }else {
    return null
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IStack$_pop = function(coll) {
  var this__11710 = this;
  if(cljs.core.truth_(this__11710.cnt === 0)) {
    throw new Error("Can't pop empty vector");
  }else {
    if(cljs.core.truth_(cljs.core._EQ_.call(null, 1, this__11710.cnt))) {
      return cljs.core._with_meta.call(null, cljs.core.PersistentVector.EMPTY, this__11710.meta)
    }else {
      if(cljs.core.truth_(1 < this__11710.cnt - cljs.core.tail_off.call(null, coll))) {
        return new cljs.core.PersistentVector(this__11710.meta, this__11710.cnt - 1, this__11710.shift, this__11710.root, cljs.core.aclone.call(null, this__11710.tail))
      }else {
        if(cljs.core.truth_("\ufdd0'else")) {
          var new_tail__11711 = cljs.core.array_for.call(null, coll, this__11710.cnt - 2);
          var nr__11712 = cljs.core.pop_tail.call(null, this__11710.shift, this__11710.root);
          var new_root__11713 = cljs.core.truth_(nr__11712 === null) ? cljs.core.PersistentVector.EMPTY_NODE : nr__11712;
          var cnt_1__11714 = this__11710.cnt - 1;
          if(cljs.core.truth_(function() {
            var and__3822__auto____11715 = 5 < this__11710.shift;
            if(cljs.core.truth_(and__3822__auto____11715)) {
              return new_root__11713[1] === null
            }else {
              return and__3822__auto____11715
            }
          }())) {
            return new cljs.core.PersistentVector(this__11710.meta, cnt_1__11714, this__11710.shift - 5, new_root__11713[0], new_tail__11711)
          }else {
            return new cljs.core.PersistentVector(this__11710.meta, cnt_1__11714, this__11710.shift, new_root__11713, new_tail__11711)
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
  var this__11716 = this;
  return cljs.core._assoc.call(null, coll, n, val)
};
cljs.core.PersistentVector.prototype.cljs$core$IEquiv$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IEquiv$_equiv = function(coll, other) {
  var this__11717 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentVector.prototype.cljs$core$IWithMeta$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IWithMeta$_with_meta = function(coll, meta) {
  var this__11718 = this;
  return new cljs.core.PersistentVector(meta, this__11718.cnt, this__11718.shift, this__11718.root, this__11718.tail)
};
cljs.core.PersistentVector.prototype.cljs$core$IMeta$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IMeta$_meta = function(coll) {
  var this__11719 = this;
  return this__11719.meta
};
cljs.core.PersistentVector.prototype.cljs$core$IIndexed$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IIndexed$_nth = function() {
  var G__11736 = null;
  var G__11736__11737 = function(coll, n) {
    var this__11720 = this;
    return cljs.core.array_for.call(null, coll, n)[n & 31]
  };
  var G__11736__11738 = function(coll, n, not_found) {
    var this__11721 = this;
    if(cljs.core.truth_(function() {
      var and__3822__auto____11722 = 0 <= n;
      if(cljs.core.truth_(and__3822__auto____11722)) {
        return n < this__11721.cnt
      }else {
        return and__3822__auto____11722
      }
    }())) {
      return cljs.core._nth.call(null, coll, n)
    }else {
      return not_found
    }
  };
  G__11736 = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__11736__11737.call(this, coll, n);
      case 3:
        return G__11736__11738.call(this, coll, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__11736
}();
cljs.core.PersistentVector.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IEmptyableCollection$_empty = function(coll) {
  var this__11723 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.EMPTY, this__11723.meta)
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
  vector.cljs$lang$applyTo = function(arglist__11740) {
    var args = cljs.core.seq(arglist__11740);
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
  var this__11741 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.Subvec.prototype.cljs$core$ILookup$ = true;
cljs.core.Subvec.prototype.cljs$core$ILookup$_lookup = function() {
  var G__11769 = null;
  var G__11769__11770 = function(coll, k) {
    var this__11742 = this;
    return cljs.core._nth.call(null, coll, k, null)
  };
  var G__11769__11771 = function(coll, k, not_found) {
    var this__11743 = this;
    return cljs.core._nth.call(null, coll, k, not_found)
  };
  G__11769 = function(coll, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__11769__11770.call(this, coll, k);
      case 3:
        return G__11769__11771.call(this, coll, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__11769
}();
cljs.core.Subvec.prototype.cljs$core$IAssociative$ = true;
cljs.core.Subvec.prototype.cljs$core$IAssociative$_assoc = function(coll, key, val) {
  var this__11744 = this;
  var v_pos__11745 = this__11744.start + key;
  return new cljs.core.Subvec(this__11744.meta, cljs.core._assoc.call(null, this__11744.v, v_pos__11745, val), this__11744.start, this__11744.end > v_pos__11745 + 1 ? this__11744.end : v_pos__11745 + 1)
};
cljs.core.Subvec.prototype.cljs$core$IFn$ = true;
cljs.core.Subvec.prototype.call = function() {
  var G__11773 = null;
  var G__11773__11774 = function(tsym11746, k) {
    var this__11748 = this;
    var tsym11746__11749 = this;
    var coll__11750 = tsym11746__11749;
    return cljs.core._lookup.call(null, coll__11750, k)
  };
  var G__11773__11775 = function(tsym11747, k, not_found) {
    var this__11751 = this;
    var tsym11747__11752 = this;
    var coll__11753 = tsym11747__11752;
    return cljs.core._lookup.call(null, coll__11753, k, not_found)
  };
  G__11773 = function(tsym11747, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__11773__11774.call(this, tsym11747, k);
      case 3:
        return G__11773__11775.call(this, tsym11747, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__11773
}();
cljs.core.Subvec.prototype.cljs$core$ISequential$ = true;
cljs.core.Subvec.prototype.cljs$core$ICollection$ = true;
cljs.core.Subvec.prototype.cljs$core$ICollection$_conj = function(coll, o) {
  var this__11754 = this;
  return new cljs.core.Subvec(this__11754.meta, cljs.core._assoc_n.call(null, this__11754.v, this__11754.end, o), this__11754.start, this__11754.end + 1)
};
cljs.core.Subvec.prototype.cljs$core$IReduce$ = true;
cljs.core.Subvec.prototype.cljs$core$IReduce$_reduce = function() {
  var G__11777 = null;
  var G__11777__11778 = function(coll, f) {
    var this__11755 = this;
    return cljs.core.ci_reduce.call(null, coll, f)
  };
  var G__11777__11779 = function(coll, f, start) {
    var this__11756 = this;
    return cljs.core.ci_reduce.call(null, coll, f, start)
  };
  G__11777 = function(coll, f, start) {
    switch(arguments.length) {
      case 2:
        return G__11777__11778.call(this, coll, f);
      case 3:
        return G__11777__11779.call(this, coll, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__11777
}();
cljs.core.Subvec.prototype.cljs$core$ISeqable$ = true;
cljs.core.Subvec.prototype.cljs$core$ISeqable$_seq = function(coll) {
  var this__11757 = this;
  var subvec_seq__11758 = function subvec_seq(i) {
    if(cljs.core.truth_(cljs.core._EQ_.call(null, i, this__11757.end))) {
      return null
    }else {
      return cljs.core.cons.call(null, cljs.core._nth.call(null, this__11757.v, i), new cljs.core.LazySeq(null, false, function() {
        return subvec_seq.call(null, i + 1)
      }))
    }
  };
  return subvec_seq__11758.call(null, this__11757.start)
};
cljs.core.Subvec.prototype.cljs$core$ICounted$ = true;
cljs.core.Subvec.prototype.cljs$core$ICounted$_count = function(coll) {
  var this__11759 = this;
  return this__11759.end - this__11759.start
};
cljs.core.Subvec.prototype.cljs$core$IStack$ = true;
cljs.core.Subvec.prototype.cljs$core$IStack$_peek = function(coll) {
  var this__11760 = this;
  return cljs.core._nth.call(null, this__11760.v, this__11760.end - 1)
};
cljs.core.Subvec.prototype.cljs$core$IStack$_pop = function(coll) {
  var this__11761 = this;
  if(cljs.core.truth_(cljs.core._EQ_.call(null, this__11761.start, this__11761.end))) {
    throw new Error("Can't pop empty vector");
  }else {
    return new cljs.core.Subvec(this__11761.meta, this__11761.v, this__11761.start, this__11761.end - 1)
  }
};
cljs.core.Subvec.prototype.cljs$core$IVector$ = true;
cljs.core.Subvec.prototype.cljs$core$IVector$_assoc_n = function(coll, n, val) {
  var this__11762 = this;
  return cljs.core._assoc.call(null, coll, n, val)
};
cljs.core.Subvec.prototype.cljs$core$IEquiv$ = true;
cljs.core.Subvec.prototype.cljs$core$IEquiv$_equiv = function(coll, other) {
  var this__11763 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Subvec.prototype.cljs$core$IWithMeta$ = true;
cljs.core.Subvec.prototype.cljs$core$IWithMeta$_with_meta = function(coll, meta) {
  var this__11764 = this;
  return new cljs.core.Subvec(meta, this__11764.v, this__11764.start, this__11764.end)
};
cljs.core.Subvec.prototype.cljs$core$IMeta$ = true;
cljs.core.Subvec.prototype.cljs$core$IMeta$_meta = function(coll) {
  var this__11765 = this;
  return this__11765.meta
};
cljs.core.Subvec.prototype.cljs$core$IIndexed$ = true;
cljs.core.Subvec.prototype.cljs$core$IIndexed$_nth = function() {
  var G__11781 = null;
  var G__11781__11782 = function(coll, n) {
    var this__11766 = this;
    return cljs.core._nth.call(null, this__11766.v, this__11766.start + n)
  };
  var G__11781__11783 = function(coll, n, not_found) {
    var this__11767 = this;
    return cljs.core._nth.call(null, this__11767.v, this__11767.start + n, not_found)
  };
  G__11781 = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__11781__11782.call(this, coll, n);
      case 3:
        return G__11781__11783.call(this, coll, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__11781
}();
cljs.core.Subvec.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.Subvec.prototype.cljs$core$IEmptyableCollection$_empty = function(coll) {
  var this__11768 = this;
  return cljs.core.with_meta.call(null, cljs.core.Vector.EMPTY, this__11768.meta)
};
cljs.core.Subvec;
cljs.core.subvec = function() {
  var subvec = null;
  var subvec__11785 = function(v, start) {
    return subvec.call(null, v, start, cljs.core.count.call(null, v))
  };
  var subvec__11786 = function(v, start, end) {
    return new cljs.core.Subvec(null, v, start, end)
  };
  subvec = function(v, start, end) {
    switch(arguments.length) {
      case 2:
        return subvec__11785.call(this, v, start);
      case 3:
        return subvec__11786.call(this, v, start, end)
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
  var this__11788 = this;
  return coll
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IHash$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$IHash$_hash = function(coll) {
  var this__11789 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEquiv$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEquiv$_equiv = function(coll, other) {
  var this__11790 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISequential$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEmptyableCollection$_empty = function(coll) {
  var this__11791 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__11791.meta)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ICollection$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$ICollection$_conj = function(coll, o) {
  var this__11792 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeq$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeq$_first = function(coll) {
  var this__11793 = this;
  return cljs.core._first.call(null, this__11793.front)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeq$_rest = function(coll) {
  var this__11794 = this;
  var temp__3971__auto____11795 = cljs.core.next.call(null, this__11794.front);
  if(cljs.core.truth_(temp__3971__auto____11795)) {
    var f1__11796 = temp__3971__auto____11795;
    return new cljs.core.PersistentQueueSeq(this__11794.meta, f1__11796, this__11794.rear)
  }else {
    if(cljs.core.truth_(this__11794.rear === null)) {
      return cljs.core._empty.call(null, coll)
    }else {
      return new cljs.core.PersistentQueueSeq(this__11794.meta, this__11794.rear, null)
    }
  }
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IMeta$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$IMeta$_meta = function(coll) {
  var this__11797 = this;
  return this__11797.meta
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IWithMeta$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$IWithMeta$_with_meta = function(coll, meta) {
  var this__11798 = this;
  return new cljs.core.PersistentQueueSeq(meta, this__11798.front, this__11798.rear)
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
  var this__11799 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.PersistentQueue.prototype.cljs$core$ISequential$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$ICollection$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$ICollection$_conj = function(coll, o) {
  var this__11800 = this;
  if(cljs.core.truth_(this__11800.front)) {
    return new cljs.core.PersistentQueue(this__11800.meta, this__11800.count + 1, this__11800.front, cljs.core.conj.call(null, function() {
      var or__3824__auto____11801 = this__11800.rear;
      if(cljs.core.truth_(or__3824__auto____11801)) {
        return or__3824__auto____11801
      }else {
        return cljs.core.PersistentVector.fromArray([])
      }
    }(), o))
  }else {
    return new cljs.core.PersistentQueue(this__11800.meta, this__11800.count + 1, cljs.core.conj.call(null, this__11800.front, o), cljs.core.PersistentVector.fromArray([]))
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeqable$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$ISeqable$_seq = function(coll) {
  var this__11802 = this;
  var rear__11803 = cljs.core.seq.call(null, this__11802.rear);
  if(cljs.core.truth_(function() {
    var or__3824__auto____11804 = this__11802.front;
    if(cljs.core.truth_(or__3824__auto____11804)) {
      return or__3824__auto____11804
    }else {
      return rear__11803
    }
  }())) {
    return new cljs.core.PersistentQueueSeq(null, this__11802.front, cljs.core.seq.call(null, rear__11803))
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ICounted$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$ICounted$_count = function(coll) {
  var this__11805 = this;
  return this__11805.count
};
cljs.core.PersistentQueue.prototype.cljs$core$IStack$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IStack$_peek = function(coll) {
  var this__11806 = this;
  return cljs.core._first.call(null, this__11806.front)
};
cljs.core.PersistentQueue.prototype.cljs$core$IStack$_pop = function(coll) {
  var this__11807 = this;
  if(cljs.core.truth_(this__11807.front)) {
    var temp__3971__auto____11808 = cljs.core.next.call(null, this__11807.front);
    if(cljs.core.truth_(temp__3971__auto____11808)) {
      var f1__11809 = temp__3971__auto____11808;
      return new cljs.core.PersistentQueue(this__11807.meta, this__11807.count - 1, f1__11809, this__11807.rear)
    }else {
      return new cljs.core.PersistentQueue(this__11807.meta, this__11807.count - 1, cljs.core.seq.call(null, this__11807.rear), cljs.core.PersistentVector.fromArray([]))
    }
  }else {
    return coll
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeq$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$ISeq$_first = function(coll) {
  var this__11810 = this;
  return cljs.core.first.call(null, this__11810.front)
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeq$_rest = function(coll) {
  var this__11811 = this;
  return cljs.core.rest.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.PersistentQueue.prototype.cljs$core$IEquiv$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IEquiv$_equiv = function(coll, other) {
  var this__11812 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentQueue.prototype.cljs$core$IWithMeta$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IWithMeta$_with_meta = function(coll, meta) {
  var this__11813 = this;
  return new cljs.core.PersistentQueue(meta, this__11813.count, this__11813.front, this__11813.rear)
};
cljs.core.PersistentQueue.prototype.cljs$core$IMeta$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IMeta$_meta = function(coll) {
  var this__11814 = this;
  return this__11814.meta
};
cljs.core.PersistentQueue.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IEmptyableCollection$_empty = function(coll) {
  var this__11815 = this;
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
  var this__11816 = this;
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
  var len__11817 = array.length;
  var i__11818 = 0;
  while(true) {
    if(cljs.core.truth_(i__11818 < len__11817)) {
      if(cljs.core.truth_(cljs.core._EQ_.call(null, k, array[i__11818]))) {
        return i__11818
      }else {
        var G__11819 = i__11818 + incr;
        i__11818 = G__11819;
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
  var obj_map_contains_key_QMARK___11821 = function(k, strobj) {
    return obj_map_contains_key_QMARK_.call(null, k, strobj, true, false)
  };
  var obj_map_contains_key_QMARK___11822 = function(k, strobj, true_val, false_val) {
    if(cljs.core.truth_(function() {
      var and__3822__auto____11820 = goog.isString.call(null, k);
      if(cljs.core.truth_(and__3822__auto____11820)) {
        return strobj.hasOwnProperty(k)
      }else {
        return and__3822__auto____11820
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
        return obj_map_contains_key_QMARK___11821.call(this, k, strobj);
      case 4:
        return obj_map_contains_key_QMARK___11822.call(this, k, strobj, true_val, false_val)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return obj_map_contains_key_QMARK_
}();
cljs.core.obj_map_compare_keys = function obj_map_compare_keys(a, b) {
  var a__11825 = cljs.core.hash.call(null, a);
  var b__11826 = cljs.core.hash.call(null, b);
  if(cljs.core.truth_(a__11825 < b__11826)) {
    return-1
  }else {
    if(cljs.core.truth_(a__11825 > b__11826)) {
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
  var this__11827 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.ObjMap.prototype.cljs$core$ILookup$ = true;
cljs.core.ObjMap.prototype.cljs$core$ILookup$_lookup = function() {
  var G__11854 = null;
  var G__11854__11855 = function(coll, k) {
    var this__11828 = this;
    return cljs.core._lookup.call(null, coll, k, null)
  };
  var G__11854__11856 = function(coll, k, not_found) {
    var this__11829 = this;
    return cljs.core.obj_map_contains_key_QMARK_.call(null, k, this__11829.strobj, this__11829.strobj[k], not_found)
  };
  G__11854 = function(coll, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__11854__11855.call(this, coll, k);
      case 3:
        return G__11854__11856.call(this, coll, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__11854
}();
cljs.core.ObjMap.prototype.cljs$core$IAssociative$ = true;
cljs.core.ObjMap.prototype.cljs$core$IAssociative$_assoc = function(coll, k, v) {
  var this__11830 = this;
  if(cljs.core.truth_(goog.isString.call(null, k))) {
    var new_strobj__11831 = goog.object.clone.call(null, this__11830.strobj);
    var overwrite_QMARK___11832 = new_strobj__11831.hasOwnProperty(k);
    new_strobj__11831[k] = v;
    if(cljs.core.truth_(overwrite_QMARK___11832)) {
      return new cljs.core.ObjMap(this__11830.meta, this__11830.keys, new_strobj__11831)
    }else {
      var new_keys__11833 = cljs.core.aclone.call(null, this__11830.keys);
      new_keys__11833.push(k);
      return new cljs.core.ObjMap(this__11830.meta, new_keys__11833, new_strobj__11831)
    }
  }else {
    return cljs.core.with_meta.call(null, cljs.core.into.call(null, cljs.core.hash_map.call(null, k, v), cljs.core.seq.call(null, coll)), this__11830.meta)
  }
};
cljs.core.ObjMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_ = function(coll, k) {
  var this__11834 = this;
  return cljs.core.obj_map_contains_key_QMARK_.call(null, k, this__11834.strobj)
};
cljs.core.ObjMap.prototype.cljs$core$IFn$ = true;
cljs.core.ObjMap.prototype.call = function() {
  var G__11858 = null;
  var G__11858__11859 = function(tsym11835, k) {
    var this__11837 = this;
    var tsym11835__11838 = this;
    var coll__11839 = tsym11835__11838;
    return cljs.core._lookup.call(null, coll__11839, k)
  };
  var G__11858__11860 = function(tsym11836, k, not_found) {
    var this__11840 = this;
    var tsym11836__11841 = this;
    var coll__11842 = tsym11836__11841;
    return cljs.core._lookup.call(null, coll__11842, k, not_found)
  };
  G__11858 = function(tsym11836, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__11858__11859.call(this, tsym11836, k);
      case 3:
        return G__11858__11860.call(this, tsym11836, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__11858
}();
cljs.core.ObjMap.prototype.cljs$core$ICollection$ = true;
cljs.core.ObjMap.prototype.cljs$core$ICollection$_conj = function(coll, entry) {
  var this__11843 = this;
  if(cljs.core.truth_(cljs.core.vector_QMARK_.call(null, entry))) {
    return cljs.core._assoc.call(null, coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.ObjMap.prototype.cljs$core$ISeqable$ = true;
cljs.core.ObjMap.prototype.cljs$core$ISeqable$_seq = function(coll) {
  var this__11844 = this;
  if(cljs.core.truth_(this__11844.keys.length > 0)) {
    return cljs.core.map.call(null, function(p1__11824_SHARP_) {
      return cljs.core.vector.call(null, p1__11824_SHARP_, this__11844.strobj[p1__11824_SHARP_])
    }, this__11844.keys.sort(cljs.core.obj_map_compare_keys))
  }else {
    return null
  }
};
cljs.core.ObjMap.prototype.cljs$core$ICounted$ = true;
cljs.core.ObjMap.prototype.cljs$core$ICounted$_count = function(coll) {
  var this__11845 = this;
  return this__11845.keys.length
};
cljs.core.ObjMap.prototype.cljs$core$IEquiv$ = true;
cljs.core.ObjMap.prototype.cljs$core$IEquiv$_equiv = function(coll, other) {
  var this__11846 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.ObjMap.prototype.cljs$core$IWithMeta$ = true;
cljs.core.ObjMap.prototype.cljs$core$IWithMeta$_with_meta = function(coll, meta) {
  var this__11847 = this;
  return new cljs.core.ObjMap(meta, this__11847.keys, this__11847.strobj)
};
cljs.core.ObjMap.prototype.cljs$core$IMeta$ = true;
cljs.core.ObjMap.prototype.cljs$core$IMeta$_meta = function(coll) {
  var this__11848 = this;
  return this__11848.meta
};
cljs.core.ObjMap.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.ObjMap.prototype.cljs$core$IEmptyableCollection$_empty = function(coll) {
  var this__11849 = this;
  return cljs.core.with_meta.call(null, cljs.core.ObjMap.EMPTY, this__11849.meta)
};
cljs.core.ObjMap.prototype.cljs$core$IMap$ = true;
cljs.core.ObjMap.prototype.cljs$core$IMap$_dissoc = function(coll, k) {
  var this__11850 = this;
  if(cljs.core.truth_(function() {
    var and__3822__auto____11851 = goog.isString.call(null, k);
    if(cljs.core.truth_(and__3822__auto____11851)) {
      return this__11850.strobj.hasOwnProperty(k)
    }else {
      return and__3822__auto____11851
    }
  }())) {
    var new_keys__11852 = cljs.core.aclone.call(null, this__11850.keys);
    var new_strobj__11853 = goog.object.clone.call(null, this__11850.strobj);
    new_keys__11852.splice(cljs.core.scan_array.call(null, 1, k, new_keys__11852), 1);
    cljs.core.js_delete.call(null, new_strobj__11853, k);
    return new cljs.core.ObjMap(this__11850.meta, new_keys__11852, new_strobj__11853)
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
  var this__11863 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.HashMap.prototype.cljs$core$ILookup$ = true;
cljs.core.HashMap.prototype.cljs$core$ILookup$_lookup = function() {
  var G__11901 = null;
  var G__11901__11902 = function(coll, k) {
    var this__11864 = this;
    return cljs.core._lookup.call(null, coll, k, null)
  };
  var G__11901__11903 = function(coll, k, not_found) {
    var this__11865 = this;
    var bucket__11866 = this__11865.hashobj[cljs.core.hash.call(null, k)];
    var i__11867 = cljs.core.truth_(bucket__11866) ? cljs.core.scan_array.call(null, 2, k, bucket__11866) : null;
    if(cljs.core.truth_(i__11867)) {
      return bucket__11866[i__11867 + 1]
    }else {
      return not_found
    }
  };
  G__11901 = function(coll, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__11901__11902.call(this, coll, k);
      case 3:
        return G__11901__11903.call(this, coll, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__11901
}();
cljs.core.HashMap.prototype.cljs$core$IAssociative$ = true;
cljs.core.HashMap.prototype.cljs$core$IAssociative$_assoc = function(coll, k, v) {
  var this__11868 = this;
  var h__11869 = cljs.core.hash.call(null, k);
  var bucket__11870 = this__11868.hashobj[h__11869];
  if(cljs.core.truth_(bucket__11870)) {
    var new_bucket__11871 = cljs.core.aclone.call(null, bucket__11870);
    var new_hashobj__11872 = goog.object.clone.call(null, this__11868.hashobj);
    new_hashobj__11872[h__11869] = new_bucket__11871;
    var temp__3971__auto____11873 = cljs.core.scan_array.call(null, 2, k, new_bucket__11871);
    if(cljs.core.truth_(temp__3971__auto____11873)) {
      var i__11874 = temp__3971__auto____11873;
      new_bucket__11871[i__11874 + 1] = v;
      return new cljs.core.HashMap(this__11868.meta, this__11868.count, new_hashobj__11872)
    }else {
      new_bucket__11871.push(k, v);
      return new cljs.core.HashMap(this__11868.meta, this__11868.count + 1, new_hashobj__11872)
    }
  }else {
    var new_hashobj__11875 = goog.object.clone.call(null, this__11868.hashobj);
    new_hashobj__11875[h__11869] = [k, v];
    return new cljs.core.HashMap(this__11868.meta, this__11868.count + 1, new_hashobj__11875)
  }
};
cljs.core.HashMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_ = function(coll, k) {
  var this__11876 = this;
  var bucket__11877 = this__11876.hashobj[cljs.core.hash.call(null, k)];
  var i__11878 = cljs.core.truth_(bucket__11877) ? cljs.core.scan_array.call(null, 2, k, bucket__11877) : null;
  if(cljs.core.truth_(i__11878)) {
    return true
  }else {
    return false
  }
};
cljs.core.HashMap.prototype.cljs$core$IFn$ = true;
cljs.core.HashMap.prototype.call = function() {
  var G__11905 = null;
  var G__11905__11906 = function(tsym11879, k) {
    var this__11881 = this;
    var tsym11879__11882 = this;
    var coll__11883 = tsym11879__11882;
    return cljs.core._lookup.call(null, coll__11883, k)
  };
  var G__11905__11907 = function(tsym11880, k, not_found) {
    var this__11884 = this;
    var tsym11880__11885 = this;
    var coll__11886 = tsym11880__11885;
    return cljs.core._lookup.call(null, coll__11886, k, not_found)
  };
  G__11905 = function(tsym11880, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__11905__11906.call(this, tsym11880, k);
      case 3:
        return G__11905__11907.call(this, tsym11880, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__11905
}();
cljs.core.HashMap.prototype.cljs$core$ICollection$ = true;
cljs.core.HashMap.prototype.cljs$core$ICollection$_conj = function(coll, entry) {
  var this__11887 = this;
  if(cljs.core.truth_(cljs.core.vector_QMARK_.call(null, entry))) {
    return cljs.core._assoc.call(null, coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.HashMap.prototype.cljs$core$ISeqable$ = true;
cljs.core.HashMap.prototype.cljs$core$ISeqable$_seq = function(coll) {
  var this__11888 = this;
  if(cljs.core.truth_(this__11888.count > 0)) {
    var hashes__11889 = cljs.core.js_keys.call(null, this__11888.hashobj).sort();
    return cljs.core.mapcat.call(null, function(p1__11862_SHARP_) {
      return cljs.core.map.call(null, cljs.core.vec, cljs.core.partition.call(null, 2, this__11888.hashobj[p1__11862_SHARP_]))
    }, hashes__11889)
  }else {
    return null
  }
};
cljs.core.HashMap.prototype.cljs$core$ICounted$ = true;
cljs.core.HashMap.prototype.cljs$core$ICounted$_count = function(coll) {
  var this__11890 = this;
  return this__11890.count
};
cljs.core.HashMap.prototype.cljs$core$IEquiv$ = true;
cljs.core.HashMap.prototype.cljs$core$IEquiv$_equiv = function(coll, other) {
  var this__11891 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.HashMap.prototype.cljs$core$IWithMeta$ = true;
cljs.core.HashMap.prototype.cljs$core$IWithMeta$_with_meta = function(coll, meta) {
  var this__11892 = this;
  return new cljs.core.HashMap(meta, this__11892.count, this__11892.hashobj)
};
cljs.core.HashMap.prototype.cljs$core$IMeta$ = true;
cljs.core.HashMap.prototype.cljs$core$IMeta$_meta = function(coll) {
  var this__11893 = this;
  return this__11893.meta
};
cljs.core.HashMap.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.HashMap.prototype.cljs$core$IEmptyableCollection$_empty = function(coll) {
  var this__11894 = this;
  return cljs.core.with_meta.call(null, cljs.core.HashMap.EMPTY, this__11894.meta)
};
cljs.core.HashMap.prototype.cljs$core$IMap$ = true;
cljs.core.HashMap.prototype.cljs$core$IMap$_dissoc = function(coll, k) {
  var this__11895 = this;
  var h__11896 = cljs.core.hash.call(null, k);
  var bucket__11897 = this__11895.hashobj[h__11896];
  var i__11898 = cljs.core.truth_(bucket__11897) ? cljs.core.scan_array.call(null, 2, k, bucket__11897) : null;
  if(cljs.core.truth_(cljs.core.not.call(null, i__11898))) {
    return coll
  }else {
    var new_hashobj__11899 = goog.object.clone.call(null, this__11895.hashobj);
    if(cljs.core.truth_(3 > bucket__11897.length)) {
      cljs.core.js_delete.call(null, new_hashobj__11899, h__11896)
    }else {
      var new_bucket__11900 = cljs.core.aclone.call(null, bucket__11897);
      new_bucket__11900.splice(i__11898, 2);
      new_hashobj__11899[h__11896] = new_bucket__11900
    }
    return new cljs.core.HashMap(this__11895.meta, this__11895.count - 1, new_hashobj__11899)
  }
};
cljs.core.HashMap;
cljs.core.HashMap.EMPTY = new cljs.core.HashMap(null, 0, cljs.core.js_obj.call(null));
cljs.core.HashMap.fromArrays = function(ks, vs) {
  var len__11909 = ks.length;
  var i__11910 = 0;
  var out__11911 = cljs.core.HashMap.EMPTY;
  while(true) {
    if(cljs.core.truth_(i__11910 < len__11909)) {
      var G__11912 = i__11910 + 1;
      var G__11913 = cljs.core.assoc.call(null, out__11911, ks[i__11910], vs[i__11910]);
      i__11910 = G__11912;
      out__11911 = G__11913;
      continue
    }else {
      return out__11911
    }
    break
  }
};
cljs.core.hash_map = function() {
  var hash_map__delegate = function(keyvals) {
    var in$__11914 = cljs.core.seq.call(null, keyvals);
    var out__11915 = cljs.core.HashMap.EMPTY;
    while(true) {
      if(cljs.core.truth_(in$__11914)) {
        var G__11916 = cljs.core.nnext.call(null, in$__11914);
        var G__11917 = cljs.core.assoc.call(null, out__11915, cljs.core.first.call(null, in$__11914), cljs.core.second.call(null, in$__11914));
        in$__11914 = G__11916;
        out__11915 = G__11917;
        continue
      }else {
        return out__11915
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
  hash_map.cljs$lang$applyTo = function(arglist__11918) {
    var keyvals = cljs.core.seq(arglist__11918);
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
      return cljs.core.reduce.call(null, function(p1__11919_SHARP_, p2__11920_SHARP_) {
        return cljs.core.conj.call(null, function() {
          var or__3824__auto____11921 = p1__11919_SHARP_;
          if(cljs.core.truth_(or__3824__auto____11921)) {
            return or__3824__auto____11921
          }else {
            return cljs.core.ObjMap.fromObject([], {})
          }
        }(), p2__11920_SHARP_)
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
  merge.cljs$lang$applyTo = function(arglist__11922) {
    var maps = cljs.core.seq(arglist__11922);
    return merge__delegate.call(this, maps)
  };
  return merge
}();
cljs.core.merge_with = function() {
  var merge_with__delegate = function(f, maps) {
    if(cljs.core.truth_(cljs.core.some.call(null, cljs.core.identity, maps))) {
      var merge_entry__11925 = function(m, e) {
        var k__11923 = cljs.core.first.call(null, e);
        var v__11924 = cljs.core.second.call(null, e);
        if(cljs.core.truth_(cljs.core.contains_QMARK_.call(null, m, k__11923))) {
          return cljs.core.assoc.call(null, m, k__11923, f.call(null, cljs.core.get.call(null, m, k__11923), v__11924))
        }else {
          return cljs.core.assoc.call(null, m, k__11923, v__11924)
        }
      };
      var merge2__11927 = function(m1, m2) {
        return cljs.core.reduce.call(null, merge_entry__11925, function() {
          var or__3824__auto____11926 = m1;
          if(cljs.core.truth_(or__3824__auto____11926)) {
            return or__3824__auto____11926
          }else {
            return cljs.core.ObjMap.fromObject([], {})
          }
        }(), cljs.core.seq.call(null, m2))
      };
      return cljs.core.reduce.call(null, merge2__11927, maps)
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
  merge_with.cljs$lang$applyTo = function(arglist__11928) {
    var f = cljs.core.first(arglist__11928);
    var maps = cljs.core.rest(arglist__11928);
    return merge_with__delegate.call(this, f, maps)
  };
  return merge_with
}();
cljs.core.select_keys = function select_keys(map, keyseq) {
  var ret__11930 = cljs.core.ObjMap.fromObject([], {});
  var keys__11931 = cljs.core.seq.call(null, keyseq);
  while(true) {
    if(cljs.core.truth_(keys__11931)) {
      var key__11932 = cljs.core.first.call(null, keys__11931);
      var entry__11933 = cljs.core.get.call(null, map, key__11932, "\ufdd0'user/not-found");
      var G__11934 = cljs.core.truth_(cljs.core.not_EQ_.call(null, entry__11933, "\ufdd0'user/not-found")) ? cljs.core.assoc.call(null, ret__11930, key__11932, entry__11933) : ret__11930;
      var G__11935 = cljs.core.next.call(null, keys__11931);
      ret__11930 = G__11934;
      keys__11931 = G__11935;
      continue
    }else {
      return ret__11930
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
  var this__11936 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.Set.prototype.cljs$core$ILookup$ = true;
cljs.core.Set.prototype.cljs$core$ILookup$_lookup = function() {
  var G__11957 = null;
  var G__11957__11958 = function(coll, v) {
    var this__11937 = this;
    return cljs.core._lookup.call(null, coll, v, null)
  };
  var G__11957__11959 = function(coll, v, not_found) {
    var this__11938 = this;
    if(cljs.core.truth_(cljs.core._contains_key_QMARK_.call(null, this__11938.hash_map, v))) {
      return v
    }else {
      return not_found
    }
  };
  G__11957 = function(coll, v, not_found) {
    switch(arguments.length) {
      case 2:
        return G__11957__11958.call(this, coll, v);
      case 3:
        return G__11957__11959.call(this, coll, v, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__11957
}();
cljs.core.Set.prototype.cljs$core$IFn$ = true;
cljs.core.Set.prototype.call = function() {
  var G__11961 = null;
  var G__11961__11962 = function(tsym11939, k) {
    var this__11941 = this;
    var tsym11939__11942 = this;
    var coll__11943 = tsym11939__11942;
    return cljs.core._lookup.call(null, coll__11943, k)
  };
  var G__11961__11963 = function(tsym11940, k, not_found) {
    var this__11944 = this;
    var tsym11940__11945 = this;
    var coll__11946 = tsym11940__11945;
    return cljs.core._lookup.call(null, coll__11946, k, not_found)
  };
  G__11961 = function(tsym11940, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__11961__11962.call(this, tsym11940, k);
      case 3:
        return G__11961__11963.call(this, tsym11940, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__11961
}();
cljs.core.Set.prototype.cljs$core$ICollection$ = true;
cljs.core.Set.prototype.cljs$core$ICollection$_conj = function(coll, o) {
  var this__11947 = this;
  return new cljs.core.Set(this__11947.meta, cljs.core.assoc.call(null, this__11947.hash_map, o, null))
};
cljs.core.Set.prototype.cljs$core$ISeqable$ = true;
cljs.core.Set.prototype.cljs$core$ISeqable$_seq = function(coll) {
  var this__11948 = this;
  return cljs.core.keys.call(null, this__11948.hash_map)
};
cljs.core.Set.prototype.cljs$core$ISet$ = true;
cljs.core.Set.prototype.cljs$core$ISet$_disjoin = function(coll, v) {
  var this__11949 = this;
  return new cljs.core.Set(this__11949.meta, cljs.core.dissoc.call(null, this__11949.hash_map, v))
};
cljs.core.Set.prototype.cljs$core$ICounted$ = true;
cljs.core.Set.prototype.cljs$core$ICounted$_count = function(coll) {
  var this__11950 = this;
  return cljs.core.count.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.Set.prototype.cljs$core$IEquiv$ = true;
cljs.core.Set.prototype.cljs$core$IEquiv$_equiv = function(coll, other) {
  var this__11951 = this;
  var and__3822__auto____11952 = cljs.core.set_QMARK_.call(null, other);
  if(cljs.core.truth_(and__3822__auto____11952)) {
    var and__3822__auto____11953 = cljs.core._EQ_.call(null, cljs.core.count.call(null, coll), cljs.core.count.call(null, other));
    if(cljs.core.truth_(and__3822__auto____11953)) {
      return cljs.core.every_QMARK_.call(null, function(p1__11929_SHARP_) {
        return cljs.core.contains_QMARK_.call(null, coll, p1__11929_SHARP_)
      }, other)
    }else {
      return and__3822__auto____11953
    }
  }else {
    return and__3822__auto____11952
  }
};
cljs.core.Set.prototype.cljs$core$IWithMeta$ = true;
cljs.core.Set.prototype.cljs$core$IWithMeta$_with_meta = function(coll, meta) {
  var this__11954 = this;
  return new cljs.core.Set(meta, this__11954.hash_map)
};
cljs.core.Set.prototype.cljs$core$IMeta$ = true;
cljs.core.Set.prototype.cljs$core$IMeta$_meta = function(coll) {
  var this__11955 = this;
  return this__11955.meta
};
cljs.core.Set.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.Set.prototype.cljs$core$IEmptyableCollection$_empty = function(coll) {
  var this__11956 = this;
  return cljs.core.with_meta.call(null, cljs.core.Set.EMPTY, this__11956.meta)
};
cljs.core.Set;
cljs.core.Set.EMPTY = new cljs.core.Set(null, cljs.core.hash_map.call(null));
cljs.core.set = function set(coll) {
  var in$__11966 = cljs.core.seq.call(null, coll);
  var out__11967 = cljs.core.Set.EMPTY;
  while(true) {
    if(cljs.core.truth_(cljs.core.not.call(null, cljs.core.empty_QMARK_.call(null, in$__11966)))) {
      var G__11968 = cljs.core.rest.call(null, in$__11966);
      var G__11969 = cljs.core.conj.call(null, out__11967, cljs.core.first.call(null, in$__11966));
      in$__11966 = G__11968;
      out__11967 = G__11969;
      continue
    }else {
      return out__11967
    }
    break
  }
};
cljs.core.replace = function replace(smap, coll) {
  if(cljs.core.truth_(cljs.core.vector_QMARK_.call(null, coll))) {
    var n__11970 = cljs.core.count.call(null, coll);
    return cljs.core.reduce.call(null, function(v, i) {
      var temp__3971__auto____11971 = cljs.core.find.call(null, smap, cljs.core.nth.call(null, v, i));
      if(cljs.core.truth_(temp__3971__auto____11971)) {
        var e__11972 = temp__3971__auto____11971;
        return cljs.core.assoc.call(null, v, i, cljs.core.second.call(null, e__11972))
      }else {
        return v
      }
    }, coll, cljs.core.take.call(null, n__11970, cljs.core.iterate.call(null, cljs.core.inc, 0)))
  }else {
    return cljs.core.map.call(null, function(p1__11965_SHARP_) {
      var temp__3971__auto____11973 = cljs.core.find.call(null, smap, p1__11965_SHARP_);
      if(cljs.core.truth_(temp__3971__auto____11973)) {
        var e__11974 = temp__3971__auto____11973;
        return cljs.core.second.call(null, e__11974)
      }else {
        return p1__11965_SHARP_
      }
    }, coll)
  }
};
cljs.core.distinct = function distinct(coll) {
  var step__11982 = function step(xs, seen) {
    return new cljs.core.LazySeq(null, false, function() {
      return function(p__11975, seen) {
        while(true) {
          var vec__11976__11977 = p__11975;
          var f__11978 = cljs.core.nth.call(null, vec__11976__11977, 0, null);
          var xs__11979 = vec__11976__11977;
          var temp__3974__auto____11980 = cljs.core.seq.call(null, xs__11979);
          if(cljs.core.truth_(temp__3974__auto____11980)) {
            var s__11981 = temp__3974__auto____11980;
            if(cljs.core.truth_(cljs.core.contains_QMARK_.call(null, seen, f__11978))) {
              var G__11983 = cljs.core.rest.call(null, s__11981);
              var G__11984 = seen;
              p__11975 = G__11983;
              seen = G__11984;
              continue
            }else {
              return cljs.core.cons.call(null, f__11978, step.call(null, cljs.core.rest.call(null, s__11981), cljs.core.conj.call(null, seen, f__11978)))
            }
          }else {
            return null
          }
          break
        }
      }.call(null, xs, seen)
    })
  };
  return step__11982.call(null, coll, cljs.core.set([]))
};
cljs.core.butlast = function butlast(s) {
  var ret__11985 = cljs.core.PersistentVector.fromArray([]);
  var s__11986 = s;
  while(true) {
    if(cljs.core.truth_(cljs.core.next.call(null, s__11986))) {
      var G__11987 = cljs.core.conj.call(null, ret__11985, cljs.core.first.call(null, s__11986));
      var G__11988 = cljs.core.next.call(null, s__11986);
      ret__11985 = G__11987;
      s__11986 = G__11988;
      continue
    }else {
      return cljs.core.seq.call(null, ret__11985)
    }
    break
  }
};
cljs.core.name = function name(x) {
  if(cljs.core.truth_(cljs.core.string_QMARK_.call(null, x))) {
    return x
  }else {
    if(cljs.core.truth_(function() {
      var or__3824__auto____11989 = cljs.core.keyword_QMARK_.call(null, x);
      if(cljs.core.truth_(or__3824__auto____11989)) {
        return or__3824__auto____11989
      }else {
        return cljs.core.symbol_QMARK_.call(null, x)
      }
    }())) {
      var i__11990 = x.lastIndexOf("/");
      if(cljs.core.truth_(i__11990 < 0)) {
        return cljs.core.subs.call(null, x, 2)
      }else {
        return cljs.core.subs.call(null, x, i__11990 + 1)
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
    var or__3824__auto____11991 = cljs.core.keyword_QMARK_.call(null, x);
    if(cljs.core.truth_(or__3824__auto____11991)) {
      return or__3824__auto____11991
    }else {
      return cljs.core.symbol_QMARK_.call(null, x)
    }
  }())) {
    var i__11992 = x.lastIndexOf("/");
    if(cljs.core.truth_(i__11992 > -1)) {
      return cljs.core.subs.call(null, x, 2, i__11992)
    }else {
      return null
    }
  }else {
    throw new Error(cljs.core.str.call(null, "Doesn't support namespace: ", x));
  }
};
cljs.core.zipmap = function zipmap(keys, vals) {
  var map__11995 = cljs.core.ObjMap.fromObject([], {});
  var ks__11996 = cljs.core.seq.call(null, keys);
  var vs__11997 = cljs.core.seq.call(null, vals);
  while(true) {
    if(cljs.core.truth_(function() {
      var and__3822__auto____11998 = ks__11996;
      if(cljs.core.truth_(and__3822__auto____11998)) {
        return vs__11997
      }else {
        return and__3822__auto____11998
      }
    }())) {
      var G__11999 = cljs.core.assoc.call(null, map__11995, cljs.core.first.call(null, ks__11996), cljs.core.first.call(null, vs__11997));
      var G__12000 = cljs.core.next.call(null, ks__11996);
      var G__12001 = cljs.core.next.call(null, vs__11997);
      map__11995 = G__11999;
      ks__11996 = G__12000;
      vs__11997 = G__12001;
      continue
    }else {
      return map__11995
    }
    break
  }
};
cljs.core.max_key = function() {
  var max_key = null;
  var max_key__12004 = function(k, x) {
    return x
  };
  var max_key__12005 = function(k, x, y) {
    if(cljs.core.truth_(k.call(null, x) > k.call(null, y))) {
      return x
    }else {
      return y
    }
  };
  var max_key__12006 = function() {
    var G__12008__delegate = function(k, x, y, more) {
      return cljs.core.reduce.call(null, function(p1__11993_SHARP_, p2__11994_SHARP_) {
        return max_key.call(null, k, p1__11993_SHARP_, p2__11994_SHARP_)
      }, max_key.call(null, k, x, y), more)
    };
    var G__12008 = function(k, x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__12008__delegate.call(this, k, x, y, more)
    };
    G__12008.cljs$lang$maxFixedArity = 3;
    G__12008.cljs$lang$applyTo = function(arglist__12009) {
      var k = cljs.core.first(arglist__12009);
      var x = cljs.core.first(cljs.core.next(arglist__12009));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(arglist__12009)));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__12009)));
      return G__12008__delegate.call(this, k, x, y, more)
    };
    return G__12008
  }();
  max_key = function(k, x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return max_key__12004.call(this, k, x);
      case 3:
        return max_key__12005.call(this, k, x, y);
      default:
        return max_key__12006.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  max_key.cljs$lang$maxFixedArity = 3;
  max_key.cljs$lang$applyTo = max_key__12006.cljs$lang$applyTo;
  return max_key
}();
cljs.core.min_key = function() {
  var min_key = null;
  var min_key__12010 = function(k, x) {
    return x
  };
  var min_key__12011 = function(k, x, y) {
    if(cljs.core.truth_(k.call(null, x) < k.call(null, y))) {
      return x
    }else {
      return y
    }
  };
  var min_key__12012 = function() {
    var G__12014__delegate = function(k, x, y, more) {
      return cljs.core.reduce.call(null, function(p1__12002_SHARP_, p2__12003_SHARP_) {
        return min_key.call(null, k, p1__12002_SHARP_, p2__12003_SHARP_)
      }, min_key.call(null, k, x, y), more)
    };
    var G__12014 = function(k, x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__12014__delegate.call(this, k, x, y, more)
    };
    G__12014.cljs$lang$maxFixedArity = 3;
    G__12014.cljs$lang$applyTo = function(arglist__12015) {
      var k = cljs.core.first(arglist__12015);
      var x = cljs.core.first(cljs.core.next(arglist__12015));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(arglist__12015)));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__12015)));
      return G__12014__delegate.call(this, k, x, y, more)
    };
    return G__12014
  }();
  min_key = function(k, x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return min_key__12010.call(this, k, x);
      case 3:
        return min_key__12011.call(this, k, x, y);
      default:
        return min_key__12012.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  min_key.cljs$lang$maxFixedArity = 3;
  min_key.cljs$lang$applyTo = min_key__12012.cljs$lang$applyTo;
  return min_key
}();
cljs.core.partition_all = function() {
  var partition_all = null;
  var partition_all__12018 = function(n, coll) {
    return partition_all.call(null, n, n, coll)
  };
  var partition_all__12019 = function(n, step, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____12016 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3974__auto____12016)) {
        var s__12017 = temp__3974__auto____12016;
        return cljs.core.cons.call(null, cljs.core.take.call(null, n, s__12017), partition_all.call(null, n, step, cljs.core.drop.call(null, step, s__12017)))
      }else {
        return null
      }
    })
  };
  partition_all = function(n, step, coll) {
    switch(arguments.length) {
      case 2:
        return partition_all__12018.call(this, n, step);
      case 3:
        return partition_all__12019.call(this, n, step, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return partition_all
}();
cljs.core.take_while = function take_while(pred, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____12021 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3974__auto____12021)) {
      var s__12022 = temp__3974__auto____12021;
      if(cljs.core.truth_(pred.call(null, cljs.core.first.call(null, s__12022)))) {
        return cljs.core.cons.call(null, cljs.core.first.call(null, s__12022), take_while.call(null, pred, cljs.core.rest.call(null, s__12022)))
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
  var this__12023 = this;
  return cljs.core.hash_coll.call(null, rng)
};
cljs.core.Range.prototype.cljs$core$ISequential$ = true;
cljs.core.Range.prototype.cljs$core$ICollection$ = true;
cljs.core.Range.prototype.cljs$core$ICollection$_conj = function(rng, o) {
  var this__12024 = this;
  return cljs.core.cons.call(null, o, rng)
};
cljs.core.Range.prototype.cljs$core$IReduce$ = true;
cljs.core.Range.prototype.cljs$core$IReduce$_reduce = function() {
  var G__12040 = null;
  var G__12040__12041 = function(rng, f) {
    var this__12025 = this;
    return cljs.core.ci_reduce.call(null, rng, f)
  };
  var G__12040__12042 = function(rng, f, s) {
    var this__12026 = this;
    return cljs.core.ci_reduce.call(null, rng, f, s)
  };
  G__12040 = function(rng, f, s) {
    switch(arguments.length) {
      case 2:
        return G__12040__12041.call(this, rng, f);
      case 3:
        return G__12040__12042.call(this, rng, f, s)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__12040
}();
cljs.core.Range.prototype.cljs$core$ISeqable$ = true;
cljs.core.Range.prototype.cljs$core$ISeqable$_seq = function(rng) {
  var this__12027 = this;
  var comp__12028 = cljs.core.truth_(this__12027.step > 0) ? cljs.core._LT_ : cljs.core._GT_;
  if(cljs.core.truth_(comp__12028.call(null, this__12027.start, this__12027.end))) {
    return rng
  }else {
    return null
  }
};
cljs.core.Range.prototype.cljs$core$ICounted$ = true;
cljs.core.Range.prototype.cljs$core$ICounted$_count = function(rng) {
  var this__12029 = this;
  if(cljs.core.truth_(cljs.core.not.call(null, cljs.core._seq.call(null, rng)))) {
    return 0
  }else {
    return Math["ceil"].call(null, (this__12029.end - this__12029.start) / this__12029.step)
  }
};
cljs.core.Range.prototype.cljs$core$ISeq$ = true;
cljs.core.Range.prototype.cljs$core$ISeq$_first = function(rng) {
  var this__12030 = this;
  return this__12030.start
};
cljs.core.Range.prototype.cljs$core$ISeq$_rest = function(rng) {
  var this__12031 = this;
  if(cljs.core.truth_(cljs.core._seq.call(null, rng))) {
    return new cljs.core.Range(this__12031.meta, this__12031.start + this__12031.step, this__12031.end, this__12031.step)
  }else {
    return cljs.core.list.call(null)
  }
};
cljs.core.Range.prototype.cljs$core$IEquiv$ = true;
cljs.core.Range.prototype.cljs$core$IEquiv$_equiv = function(rng, other) {
  var this__12032 = this;
  return cljs.core.equiv_sequential.call(null, rng, other)
};
cljs.core.Range.prototype.cljs$core$IWithMeta$ = true;
cljs.core.Range.prototype.cljs$core$IWithMeta$_with_meta = function(rng, meta) {
  var this__12033 = this;
  return new cljs.core.Range(meta, this__12033.start, this__12033.end, this__12033.step)
};
cljs.core.Range.prototype.cljs$core$IMeta$ = true;
cljs.core.Range.prototype.cljs$core$IMeta$_meta = function(rng) {
  var this__12034 = this;
  return this__12034.meta
};
cljs.core.Range.prototype.cljs$core$IIndexed$ = true;
cljs.core.Range.prototype.cljs$core$IIndexed$_nth = function() {
  var G__12044 = null;
  var G__12044__12045 = function(rng, n) {
    var this__12035 = this;
    if(cljs.core.truth_(n < cljs.core._count.call(null, rng))) {
      return this__12035.start + n * this__12035.step
    }else {
      if(cljs.core.truth_(function() {
        var and__3822__auto____12036 = this__12035.start > this__12035.end;
        if(cljs.core.truth_(and__3822__auto____12036)) {
          return cljs.core._EQ_.call(null, this__12035.step, 0)
        }else {
          return and__3822__auto____12036
        }
      }())) {
        return this__12035.start
      }else {
        throw new Error("Index out of bounds");
      }
    }
  };
  var G__12044__12046 = function(rng, n, not_found) {
    var this__12037 = this;
    if(cljs.core.truth_(n < cljs.core._count.call(null, rng))) {
      return this__12037.start + n * this__12037.step
    }else {
      if(cljs.core.truth_(function() {
        var and__3822__auto____12038 = this__12037.start > this__12037.end;
        if(cljs.core.truth_(and__3822__auto____12038)) {
          return cljs.core._EQ_.call(null, this__12037.step, 0)
        }else {
          return and__3822__auto____12038
        }
      }())) {
        return this__12037.start
      }else {
        return not_found
      }
    }
  };
  G__12044 = function(rng, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__12044__12045.call(this, rng, n);
      case 3:
        return G__12044__12046.call(this, rng, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__12044
}();
cljs.core.Range.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.Range.prototype.cljs$core$IEmptyableCollection$_empty = function(rng) {
  var this__12039 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__12039.meta)
};
cljs.core.Range;
cljs.core.range = function() {
  var range = null;
  var range__12048 = function() {
    return range.call(null, 0, Number["MAX_VALUE"], 1)
  };
  var range__12049 = function(end) {
    return range.call(null, 0, end, 1)
  };
  var range__12050 = function(start, end) {
    return range.call(null, start, end, 1)
  };
  var range__12051 = function(start, end, step) {
    return new cljs.core.Range(null, start, end, step)
  };
  range = function(start, end, step) {
    switch(arguments.length) {
      case 0:
        return range__12048.call(this);
      case 1:
        return range__12049.call(this, start);
      case 2:
        return range__12050.call(this, start, end);
      case 3:
        return range__12051.call(this, start, end, step)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return range
}();
cljs.core.take_nth = function take_nth(n, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____12053 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3974__auto____12053)) {
      var s__12054 = temp__3974__auto____12053;
      return cljs.core.cons.call(null, cljs.core.first.call(null, s__12054), take_nth.call(null, n, cljs.core.drop.call(null, n, s__12054)))
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
    var temp__3974__auto____12056 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3974__auto____12056)) {
      var s__12057 = temp__3974__auto____12056;
      var fst__12058 = cljs.core.first.call(null, s__12057);
      var fv__12059 = f.call(null, fst__12058);
      var run__12060 = cljs.core.cons.call(null, fst__12058, cljs.core.take_while.call(null, function(p1__12055_SHARP_) {
        return cljs.core._EQ_.call(null, fv__12059, f.call(null, p1__12055_SHARP_))
      }, cljs.core.next.call(null, s__12057)));
      return cljs.core.cons.call(null, run__12060, partition_by.call(null, f, cljs.core.seq.call(null, cljs.core.drop.call(null, cljs.core.count.call(null, run__12060), s__12057))))
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
  var reductions__12075 = function(f, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3971__auto____12071 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3971__auto____12071)) {
        var s__12072 = temp__3971__auto____12071;
        return reductions.call(null, f, cljs.core.first.call(null, s__12072), cljs.core.rest.call(null, s__12072))
      }else {
        return cljs.core.list.call(null, f.call(null))
      }
    })
  };
  var reductions__12076 = function(f, init, coll) {
    return cljs.core.cons.call(null, init, new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____12073 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3974__auto____12073)) {
        var s__12074 = temp__3974__auto____12073;
        return reductions.call(null, f, f.call(null, init, cljs.core.first.call(null, s__12074)), cljs.core.rest.call(null, s__12074))
      }else {
        return null
      }
    }))
  };
  reductions = function(f, init, coll) {
    switch(arguments.length) {
      case 2:
        return reductions__12075.call(this, f, init);
      case 3:
        return reductions__12076.call(this, f, init, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return reductions
}();
cljs.core.juxt = function() {
  var juxt = null;
  var juxt__12079 = function(f) {
    return function() {
      var G__12084 = null;
      var G__12084__12085 = function() {
        return cljs.core.vector.call(null, f.call(null))
      };
      var G__12084__12086 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x))
      };
      var G__12084__12087 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y))
      };
      var G__12084__12088 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z))
      };
      var G__12084__12089 = function() {
        var G__12091__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args))
        };
        var G__12091 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__12091__delegate.call(this, x, y, z, args)
        };
        G__12091.cljs$lang$maxFixedArity = 3;
        G__12091.cljs$lang$applyTo = function(arglist__12092) {
          var x = cljs.core.first(arglist__12092);
          var y = cljs.core.first(cljs.core.next(arglist__12092));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__12092)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__12092)));
          return G__12091__delegate.call(this, x, y, z, args)
        };
        return G__12091
      }();
      G__12084 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__12084__12085.call(this);
          case 1:
            return G__12084__12086.call(this, x);
          case 2:
            return G__12084__12087.call(this, x, y);
          case 3:
            return G__12084__12088.call(this, x, y, z);
          default:
            return G__12084__12089.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__12084.cljs$lang$maxFixedArity = 3;
      G__12084.cljs$lang$applyTo = G__12084__12089.cljs$lang$applyTo;
      return G__12084
    }()
  };
  var juxt__12080 = function(f, g) {
    return function() {
      var G__12093 = null;
      var G__12093__12094 = function() {
        return cljs.core.vector.call(null, f.call(null), g.call(null))
      };
      var G__12093__12095 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x), g.call(null, x))
      };
      var G__12093__12096 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y), g.call(null, x, y))
      };
      var G__12093__12097 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z), g.call(null, x, y, z))
      };
      var G__12093__12098 = function() {
        var G__12100__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args), cljs.core.apply.call(null, g, x, y, z, args))
        };
        var G__12100 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__12100__delegate.call(this, x, y, z, args)
        };
        G__12100.cljs$lang$maxFixedArity = 3;
        G__12100.cljs$lang$applyTo = function(arglist__12101) {
          var x = cljs.core.first(arglist__12101);
          var y = cljs.core.first(cljs.core.next(arglist__12101));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__12101)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__12101)));
          return G__12100__delegate.call(this, x, y, z, args)
        };
        return G__12100
      }();
      G__12093 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__12093__12094.call(this);
          case 1:
            return G__12093__12095.call(this, x);
          case 2:
            return G__12093__12096.call(this, x, y);
          case 3:
            return G__12093__12097.call(this, x, y, z);
          default:
            return G__12093__12098.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__12093.cljs$lang$maxFixedArity = 3;
      G__12093.cljs$lang$applyTo = G__12093__12098.cljs$lang$applyTo;
      return G__12093
    }()
  };
  var juxt__12081 = function(f, g, h) {
    return function() {
      var G__12102 = null;
      var G__12102__12103 = function() {
        return cljs.core.vector.call(null, f.call(null), g.call(null), h.call(null))
      };
      var G__12102__12104 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x), g.call(null, x), h.call(null, x))
      };
      var G__12102__12105 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y), g.call(null, x, y), h.call(null, x, y))
      };
      var G__12102__12106 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z), g.call(null, x, y, z), h.call(null, x, y, z))
      };
      var G__12102__12107 = function() {
        var G__12109__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args), cljs.core.apply.call(null, g, x, y, z, args), cljs.core.apply.call(null, h, x, y, z, args))
        };
        var G__12109 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__12109__delegate.call(this, x, y, z, args)
        };
        G__12109.cljs$lang$maxFixedArity = 3;
        G__12109.cljs$lang$applyTo = function(arglist__12110) {
          var x = cljs.core.first(arglist__12110);
          var y = cljs.core.first(cljs.core.next(arglist__12110));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__12110)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__12110)));
          return G__12109__delegate.call(this, x, y, z, args)
        };
        return G__12109
      }();
      G__12102 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__12102__12103.call(this);
          case 1:
            return G__12102__12104.call(this, x);
          case 2:
            return G__12102__12105.call(this, x, y);
          case 3:
            return G__12102__12106.call(this, x, y, z);
          default:
            return G__12102__12107.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__12102.cljs$lang$maxFixedArity = 3;
      G__12102.cljs$lang$applyTo = G__12102__12107.cljs$lang$applyTo;
      return G__12102
    }()
  };
  var juxt__12082 = function() {
    var G__12111__delegate = function(f, g, h, fs) {
      var fs__12078 = cljs.core.list_STAR_.call(null, f, g, h, fs);
      return function() {
        var G__12112 = null;
        var G__12112__12113 = function() {
          return cljs.core.reduce.call(null, function(p1__12061_SHARP_, p2__12062_SHARP_) {
            return cljs.core.conj.call(null, p1__12061_SHARP_, p2__12062_SHARP_.call(null))
          }, cljs.core.PersistentVector.fromArray([]), fs__12078)
        };
        var G__12112__12114 = function(x) {
          return cljs.core.reduce.call(null, function(p1__12063_SHARP_, p2__12064_SHARP_) {
            return cljs.core.conj.call(null, p1__12063_SHARP_, p2__12064_SHARP_.call(null, x))
          }, cljs.core.PersistentVector.fromArray([]), fs__12078)
        };
        var G__12112__12115 = function(x, y) {
          return cljs.core.reduce.call(null, function(p1__12065_SHARP_, p2__12066_SHARP_) {
            return cljs.core.conj.call(null, p1__12065_SHARP_, p2__12066_SHARP_.call(null, x, y))
          }, cljs.core.PersistentVector.fromArray([]), fs__12078)
        };
        var G__12112__12116 = function(x, y, z) {
          return cljs.core.reduce.call(null, function(p1__12067_SHARP_, p2__12068_SHARP_) {
            return cljs.core.conj.call(null, p1__12067_SHARP_, p2__12068_SHARP_.call(null, x, y, z))
          }, cljs.core.PersistentVector.fromArray([]), fs__12078)
        };
        var G__12112__12117 = function() {
          var G__12119__delegate = function(x, y, z, args) {
            return cljs.core.reduce.call(null, function(p1__12069_SHARP_, p2__12070_SHARP_) {
              return cljs.core.conj.call(null, p1__12069_SHARP_, cljs.core.apply.call(null, p2__12070_SHARP_, x, y, z, args))
            }, cljs.core.PersistentVector.fromArray([]), fs__12078)
          };
          var G__12119 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__12119__delegate.call(this, x, y, z, args)
          };
          G__12119.cljs$lang$maxFixedArity = 3;
          G__12119.cljs$lang$applyTo = function(arglist__12120) {
            var x = cljs.core.first(arglist__12120);
            var y = cljs.core.first(cljs.core.next(arglist__12120));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__12120)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__12120)));
            return G__12119__delegate.call(this, x, y, z, args)
          };
          return G__12119
        }();
        G__12112 = function(x, y, z, var_args) {
          var args = var_args;
          switch(arguments.length) {
            case 0:
              return G__12112__12113.call(this);
            case 1:
              return G__12112__12114.call(this, x);
            case 2:
              return G__12112__12115.call(this, x, y);
            case 3:
              return G__12112__12116.call(this, x, y, z);
            default:
              return G__12112__12117.apply(this, arguments)
          }
          throw"Invalid arity: " + arguments.length;
        };
        G__12112.cljs$lang$maxFixedArity = 3;
        G__12112.cljs$lang$applyTo = G__12112__12117.cljs$lang$applyTo;
        return G__12112
      }()
    };
    var G__12111 = function(f, g, h, var_args) {
      var fs = null;
      if(goog.isDef(var_args)) {
        fs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__12111__delegate.call(this, f, g, h, fs)
    };
    G__12111.cljs$lang$maxFixedArity = 3;
    G__12111.cljs$lang$applyTo = function(arglist__12121) {
      var f = cljs.core.first(arglist__12121);
      var g = cljs.core.first(cljs.core.next(arglist__12121));
      var h = cljs.core.first(cljs.core.next(cljs.core.next(arglist__12121)));
      var fs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__12121)));
      return G__12111__delegate.call(this, f, g, h, fs)
    };
    return G__12111
  }();
  juxt = function(f, g, h, var_args) {
    var fs = var_args;
    switch(arguments.length) {
      case 1:
        return juxt__12079.call(this, f);
      case 2:
        return juxt__12080.call(this, f, g);
      case 3:
        return juxt__12081.call(this, f, g, h);
      default:
        return juxt__12082.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  juxt.cljs$lang$maxFixedArity = 3;
  juxt.cljs$lang$applyTo = juxt__12082.cljs$lang$applyTo;
  return juxt
}();
cljs.core.dorun = function() {
  var dorun = null;
  var dorun__12123 = function(coll) {
    while(true) {
      if(cljs.core.truth_(cljs.core.seq.call(null, coll))) {
        var G__12126 = cljs.core.next.call(null, coll);
        coll = G__12126;
        continue
      }else {
        return null
      }
      break
    }
  };
  var dorun__12124 = function(n, coll) {
    while(true) {
      if(cljs.core.truth_(function() {
        var and__3822__auto____12122 = cljs.core.seq.call(null, coll);
        if(cljs.core.truth_(and__3822__auto____12122)) {
          return n > 0
        }else {
          return and__3822__auto____12122
        }
      }())) {
        var G__12127 = n - 1;
        var G__12128 = cljs.core.next.call(null, coll);
        n = G__12127;
        coll = G__12128;
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
        return dorun__12123.call(this, n);
      case 2:
        return dorun__12124.call(this, n, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return dorun
}();
cljs.core.doall = function() {
  var doall = null;
  var doall__12129 = function(coll) {
    cljs.core.dorun.call(null, coll);
    return coll
  };
  var doall__12130 = function(n, coll) {
    cljs.core.dorun.call(null, n, coll);
    return coll
  };
  doall = function(n, coll) {
    switch(arguments.length) {
      case 1:
        return doall__12129.call(this, n);
      case 2:
        return doall__12130.call(this, n, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return doall
}();
cljs.core.re_matches = function re_matches(re, s) {
  var matches__12132 = re.exec(s);
  if(cljs.core.truth_(cljs.core._EQ_.call(null, cljs.core.first.call(null, matches__12132), s))) {
    if(cljs.core.truth_(cljs.core._EQ_.call(null, cljs.core.count.call(null, matches__12132), 1))) {
      return cljs.core.first.call(null, matches__12132)
    }else {
      return cljs.core.vec.call(null, matches__12132)
    }
  }else {
    return null
  }
};
cljs.core.re_find = function re_find(re, s) {
  var matches__12133 = re.exec(s);
  if(cljs.core.truth_(matches__12133 === null)) {
    return null
  }else {
    if(cljs.core.truth_(cljs.core._EQ_.call(null, cljs.core.count.call(null, matches__12133), 1))) {
      return cljs.core.first.call(null, matches__12133)
    }else {
      return cljs.core.vec.call(null, matches__12133)
    }
  }
};
cljs.core.re_seq = function re_seq(re, s) {
  var match_data__12134 = cljs.core.re_find.call(null, re, s);
  var match_idx__12135 = s.search(re);
  var match_str__12136 = cljs.core.truth_(cljs.core.coll_QMARK_.call(null, match_data__12134)) ? cljs.core.first.call(null, match_data__12134) : match_data__12134;
  var post_match__12137 = cljs.core.subs.call(null, s, match_idx__12135 + cljs.core.count.call(null, match_str__12136));
  if(cljs.core.truth_(match_data__12134)) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, match_data__12134, re_seq.call(null, re, post_match__12137))
    })
  }else {
    return null
  }
};
cljs.core.re_pattern = function re_pattern(s) {
  var vec__12139__12140 = cljs.core.re_find.call(null, /^(?:\(\?([idmsux]*)\))?(.*)/, s);
  var ___12141 = cljs.core.nth.call(null, vec__12139__12140, 0, null);
  var flags__12142 = cljs.core.nth.call(null, vec__12139__12140, 1, null);
  var pattern__12143 = cljs.core.nth.call(null, vec__12139__12140, 2, null);
  return new RegExp(pattern__12143, flags__12142)
};
cljs.core.pr_sequential = function pr_sequential(print_one, begin, sep, end, opts, coll) {
  return cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray([begin]), cljs.core.flatten1.call(null, cljs.core.interpose.call(null, cljs.core.PersistentVector.fromArray([sep]), cljs.core.map.call(null, function(p1__12138_SHARP_) {
    return print_one.call(null, p1__12138_SHARP_, opts)
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
          var and__3822__auto____12144 = cljs.core.get.call(null, opts, "\ufdd0'meta");
          if(cljs.core.truth_(and__3822__auto____12144)) {
            var and__3822__auto____12148 = function() {
              var x__451__auto____12145 = obj;
              if(cljs.core.truth_(function() {
                var and__3822__auto____12146 = x__451__auto____12145;
                if(cljs.core.truth_(and__3822__auto____12146)) {
                  var and__3822__auto____12147 = x__451__auto____12145.cljs$core$IMeta$;
                  if(cljs.core.truth_(and__3822__auto____12147)) {
                    return cljs.core.not.call(null, x__451__auto____12145.hasOwnProperty("cljs$core$IMeta$"))
                  }else {
                    return and__3822__auto____12147
                  }
                }else {
                  return and__3822__auto____12146
                }
              }())) {
                return true
              }else {
                return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, x__451__auto____12145)
              }
            }();
            if(cljs.core.truth_(and__3822__auto____12148)) {
              return cljs.core.meta.call(null, obj)
            }else {
              return and__3822__auto____12148
            }
          }else {
            return and__3822__auto____12144
          }
        }()) ? cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray(["^"]), pr_seq.call(null, cljs.core.meta.call(null, obj), opts), cljs.core.PersistentVector.fromArray([" "])) : null, cljs.core.truth_(function() {
          var x__451__auto____12149 = obj;
          if(cljs.core.truth_(function() {
            var and__3822__auto____12150 = x__451__auto____12149;
            if(cljs.core.truth_(and__3822__auto____12150)) {
              var and__3822__auto____12151 = x__451__auto____12149.cljs$core$IPrintable$;
              if(cljs.core.truth_(and__3822__auto____12151)) {
                return cljs.core.not.call(null, x__451__auto____12149.hasOwnProperty("cljs$core$IPrintable$"))
              }else {
                return and__3822__auto____12151
              }
            }else {
              return and__3822__auto____12150
            }
          }())) {
            return true
          }else {
            return cljs.core.type_satisfies_.call(null, cljs.core.IPrintable, x__451__auto____12149)
          }
        }()) ? cljs.core._pr_seq.call(null, obj, opts) : cljs.core.list.call(null, "#<", cljs.core.str.call(null, obj), ">"))
      }else {
        return null
      }
    }
  }
};
cljs.core.pr_sb = function pr_sb(objs, opts) {
  var first_obj__12152 = cljs.core.first.call(null, objs);
  var sb__12153 = new goog.string.StringBuffer;
  var G__12154__12155 = cljs.core.seq.call(null, objs);
  if(cljs.core.truth_(G__12154__12155)) {
    var obj__12156 = cljs.core.first.call(null, G__12154__12155);
    var G__12154__12157 = G__12154__12155;
    while(true) {
      if(cljs.core.truth_(obj__12156 === first_obj__12152)) {
      }else {
        sb__12153.append(" ")
      }
      var G__12158__12159 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, obj__12156, opts));
      if(cljs.core.truth_(G__12158__12159)) {
        var string__12160 = cljs.core.first.call(null, G__12158__12159);
        var G__12158__12161 = G__12158__12159;
        while(true) {
          sb__12153.append(string__12160);
          var temp__3974__auto____12162 = cljs.core.next.call(null, G__12158__12161);
          if(cljs.core.truth_(temp__3974__auto____12162)) {
            var G__12158__12163 = temp__3974__auto____12162;
            var G__12166 = cljs.core.first.call(null, G__12158__12163);
            var G__12167 = G__12158__12163;
            string__12160 = G__12166;
            G__12158__12161 = G__12167;
            continue
          }else {
          }
          break
        }
      }else {
      }
      var temp__3974__auto____12164 = cljs.core.next.call(null, G__12154__12157);
      if(cljs.core.truth_(temp__3974__auto____12164)) {
        var G__12154__12165 = temp__3974__auto____12164;
        var G__12168 = cljs.core.first.call(null, G__12154__12165);
        var G__12169 = G__12154__12165;
        obj__12156 = G__12168;
        G__12154__12157 = G__12169;
        continue
      }else {
      }
      break
    }
  }else {
  }
  return sb__12153
};
cljs.core.pr_str_with_opts = function pr_str_with_opts(objs, opts) {
  return cljs.core.str.call(null, cljs.core.pr_sb.call(null, objs, opts))
};
cljs.core.prn_str_with_opts = function prn_str_with_opts(objs, opts) {
  var sb__12170 = cljs.core.pr_sb.call(null, objs, opts);
  sb__12170.append("\n");
  return cljs.core.str.call(null, sb__12170)
};
cljs.core.pr_with_opts = function pr_with_opts(objs, opts) {
  var first_obj__12171 = cljs.core.first.call(null, objs);
  var G__12172__12173 = cljs.core.seq.call(null, objs);
  if(cljs.core.truth_(G__12172__12173)) {
    var obj__12174 = cljs.core.first.call(null, G__12172__12173);
    var G__12172__12175 = G__12172__12173;
    while(true) {
      if(cljs.core.truth_(obj__12174 === first_obj__12171)) {
      }else {
        cljs.core.string_print.call(null, " ")
      }
      var G__12176__12177 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, obj__12174, opts));
      if(cljs.core.truth_(G__12176__12177)) {
        var string__12178 = cljs.core.first.call(null, G__12176__12177);
        var G__12176__12179 = G__12176__12177;
        while(true) {
          cljs.core.string_print.call(null, string__12178);
          var temp__3974__auto____12180 = cljs.core.next.call(null, G__12176__12179);
          if(cljs.core.truth_(temp__3974__auto____12180)) {
            var G__12176__12181 = temp__3974__auto____12180;
            var G__12184 = cljs.core.first.call(null, G__12176__12181);
            var G__12185 = G__12176__12181;
            string__12178 = G__12184;
            G__12176__12179 = G__12185;
            continue
          }else {
          }
          break
        }
      }else {
      }
      var temp__3974__auto____12182 = cljs.core.next.call(null, G__12172__12175);
      if(cljs.core.truth_(temp__3974__auto____12182)) {
        var G__12172__12183 = temp__3974__auto____12182;
        var G__12186 = cljs.core.first.call(null, G__12172__12183);
        var G__12187 = G__12172__12183;
        obj__12174 = G__12186;
        G__12172__12175 = G__12187;
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
  pr_str.cljs$lang$applyTo = function(arglist__12188) {
    var objs = cljs.core.seq(arglist__12188);
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
  prn_str.cljs$lang$applyTo = function(arglist__12189) {
    var objs = cljs.core.seq(arglist__12189);
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
  pr.cljs$lang$applyTo = function(arglist__12190) {
    var objs = cljs.core.seq(arglist__12190);
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
  cljs_core_print.cljs$lang$applyTo = function(arglist__12191) {
    var objs = cljs.core.seq(arglist__12191);
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
  print_str.cljs$lang$applyTo = function(arglist__12192) {
    var objs = cljs.core.seq(arglist__12192);
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
  println.cljs$lang$applyTo = function(arglist__12193) {
    var objs = cljs.core.seq(arglist__12193);
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
  println_str.cljs$lang$applyTo = function(arglist__12194) {
    var objs = cljs.core.seq(arglist__12194);
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
  prn.cljs$lang$applyTo = function(arglist__12195) {
    var objs = cljs.core.seq(arglist__12195);
    return prn__delegate.call(this, objs)
  };
  return prn
}();
cljs.core.HashMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.HashMap.prototype.cljs$core$IPrintable$_pr_seq = function(coll, opts) {
  var pr_pair__12196 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__12196, "{", ", ", "}", opts, coll)
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
      var temp__3974__auto____12197 = cljs.core.namespace.call(null, obj);
      if(cljs.core.truth_(temp__3974__auto____12197)) {
        var nspc__12198 = temp__3974__auto____12197;
        return cljs.core.str.call(null, nspc__12198, "/")
      }else {
        return null
      }
    }(), cljs.core.name.call(null, obj)))
  }else {
    if(cljs.core.truth_(cljs.core.symbol_QMARK_.call(null, obj))) {
      return cljs.core.list.call(null, cljs.core.str.call(null, function() {
        var temp__3974__auto____12199 = cljs.core.namespace.call(null, obj);
        if(cljs.core.truth_(temp__3974__auto____12199)) {
          var nspc__12200 = temp__3974__auto____12199;
          return cljs.core.str.call(null, nspc__12200, "/")
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
  var pr_pair__12201 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__12201, "{", ", ", "}", opts, coll)
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
  var this__12202 = this;
  return goog.getUid.call(null, this$)
};
cljs.core.Atom.prototype.cljs$core$IWatchable$ = true;
cljs.core.Atom.prototype.cljs$core$IWatchable$_notify_watches = function(this$, oldval, newval) {
  var this__12203 = this;
  var G__12204__12205 = cljs.core.seq.call(null, this__12203.watches);
  if(cljs.core.truth_(G__12204__12205)) {
    var G__12207__12209 = cljs.core.first.call(null, G__12204__12205);
    var vec__12208__12210 = G__12207__12209;
    var key__12211 = cljs.core.nth.call(null, vec__12208__12210, 0, null);
    var f__12212 = cljs.core.nth.call(null, vec__12208__12210, 1, null);
    var G__12204__12213 = G__12204__12205;
    var G__12207__12214 = G__12207__12209;
    var G__12204__12215 = G__12204__12213;
    while(true) {
      var vec__12216__12217 = G__12207__12214;
      var key__12218 = cljs.core.nth.call(null, vec__12216__12217, 0, null);
      var f__12219 = cljs.core.nth.call(null, vec__12216__12217, 1, null);
      var G__12204__12220 = G__12204__12215;
      f__12219.call(null, key__12218, this$, oldval, newval);
      var temp__3974__auto____12221 = cljs.core.next.call(null, G__12204__12220);
      if(cljs.core.truth_(temp__3974__auto____12221)) {
        var G__12204__12222 = temp__3974__auto____12221;
        var G__12229 = cljs.core.first.call(null, G__12204__12222);
        var G__12230 = G__12204__12222;
        G__12207__12214 = G__12229;
        G__12204__12215 = G__12230;
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
  var this__12223 = this;
  return this$.watches = cljs.core.assoc.call(null, this__12223.watches, key, f)
};
cljs.core.Atom.prototype.cljs$core$IWatchable$_remove_watch = function(this$, key) {
  var this__12224 = this;
  return this$.watches = cljs.core.dissoc.call(null, this__12224.watches, key)
};
cljs.core.Atom.prototype.cljs$core$IPrintable$ = true;
cljs.core.Atom.prototype.cljs$core$IPrintable$_pr_seq = function(a, opts) {
  var this__12225 = this;
  return cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray(["#<Atom: "]), cljs.core._pr_seq.call(null, this__12225.state, opts), ">")
};
cljs.core.Atom.prototype.cljs$core$IMeta$ = true;
cljs.core.Atom.prototype.cljs$core$IMeta$_meta = function(_) {
  var this__12226 = this;
  return this__12226.meta
};
cljs.core.Atom.prototype.cljs$core$IDeref$ = true;
cljs.core.Atom.prototype.cljs$core$IDeref$_deref = function(_) {
  var this__12227 = this;
  return this__12227.state
};
cljs.core.Atom.prototype.cljs$core$IEquiv$ = true;
cljs.core.Atom.prototype.cljs$core$IEquiv$_equiv = function(o, other) {
  var this__12228 = this;
  return o === other
};
cljs.core.Atom;
cljs.core.atom = function() {
  var atom = null;
  var atom__12237 = function(x) {
    return new cljs.core.Atom(x, null, null, null)
  };
  var atom__12238 = function() {
    var G__12240__delegate = function(x, p__12231) {
      var map__12232__12233 = p__12231;
      var map__12232__12234 = cljs.core.truth_(cljs.core.seq_QMARK_.call(null, map__12232__12233)) ? cljs.core.apply.call(null, cljs.core.hash_map, map__12232__12233) : map__12232__12233;
      var validator__12235 = cljs.core.get.call(null, map__12232__12234, "\ufdd0'validator");
      var meta__12236 = cljs.core.get.call(null, map__12232__12234, "\ufdd0'meta");
      return new cljs.core.Atom(x, meta__12236, validator__12235, null)
    };
    var G__12240 = function(x, var_args) {
      var p__12231 = null;
      if(goog.isDef(var_args)) {
        p__12231 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__12240__delegate.call(this, x, p__12231)
    };
    G__12240.cljs$lang$maxFixedArity = 1;
    G__12240.cljs$lang$applyTo = function(arglist__12241) {
      var x = cljs.core.first(arglist__12241);
      var p__12231 = cljs.core.rest(arglist__12241);
      return G__12240__delegate.call(this, x, p__12231)
    };
    return G__12240
  }();
  atom = function(x, var_args) {
    var p__12231 = var_args;
    switch(arguments.length) {
      case 1:
        return atom__12237.call(this, x);
      default:
        return atom__12238.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  atom.cljs$lang$maxFixedArity = 1;
  atom.cljs$lang$applyTo = atom__12238.cljs$lang$applyTo;
  return atom
}();
cljs.core.reset_BANG_ = function reset_BANG_(a, new_value) {
  var temp__3974__auto____12242 = a.validator;
  if(cljs.core.truth_(temp__3974__auto____12242)) {
    var validate__12243 = temp__3974__auto____12242;
    if(cljs.core.truth_(validate__12243.call(null, new_value))) {
    }else {
      throw new Error(cljs.core.str.call(null, "Assert failed: ", "Validator rejected reference state", "\n", cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'validate", "\ufdd1'new-value"), cljs.core.hash_map("\ufdd0'line", 3282)))));
    }
  }else {
  }
  var old_value__12244 = a.state;
  a.state = new_value;
  cljs.core._notify_watches.call(null, a, old_value__12244, new_value);
  return new_value
};
cljs.core.swap_BANG_ = function() {
  var swap_BANG_ = null;
  var swap_BANG___12245 = function(a, f) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state))
  };
  var swap_BANG___12246 = function(a, f, x) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state, x))
  };
  var swap_BANG___12247 = function(a, f, x, y) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state, x, y))
  };
  var swap_BANG___12248 = function(a, f, x, y, z) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state, x, y, z))
  };
  var swap_BANG___12249 = function() {
    var G__12251__delegate = function(a, f, x, y, z, more) {
      return cljs.core.reset_BANG_.call(null, a, cljs.core.apply.call(null, f, a.state, x, y, z, more))
    };
    var G__12251 = function(a, f, x, y, z, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 5), 0)
      }
      return G__12251__delegate.call(this, a, f, x, y, z, more)
    };
    G__12251.cljs$lang$maxFixedArity = 5;
    G__12251.cljs$lang$applyTo = function(arglist__12252) {
      var a = cljs.core.first(arglist__12252);
      var f = cljs.core.first(cljs.core.next(arglist__12252));
      var x = cljs.core.first(cljs.core.next(cljs.core.next(arglist__12252)));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__12252))));
      var z = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__12252)))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__12252)))));
      return G__12251__delegate.call(this, a, f, x, y, z, more)
    };
    return G__12251
  }();
  swap_BANG_ = function(a, f, x, y, z, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return swap_BANG___12245.call(this, a, f);
      case 3:
        return swap_BANG___12246.call(this, a, f, x);
      case 4:
        return swap_BANG___12247.call(this, a, f, x, y);
      case 5:
        return swap_BANG___12248.call(this, a, f, x, y, z);
      default:
        return swap_BANG___12249.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  swap_BANG_.cljs$lang$maxFixedArity = 5;
  swap_BANG_.cljs$lang$applyTo = swap_BANG___12249.cljs$lang$applyTo;
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
  alter_meta_BANG_.cljs$lang$applyTo = function(arglist__12253) {
    var iref = cljs.core.first(arglist__12253);
    var f = cljs.core.first(cljs.core.next(arglist__12253));
    var args = cljs.core.rest(cljs.core.next(arglist__12253));
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
  var gensym__12254 = function() {
    return gensym.call(null, "G__")
  };
  var gensym__12255 = function(prefix_string) {
    if(cljs.core.truth_(cljs.core.gensym_counter === null)) {
      cljs.core.gensym_counter = cljs.core.atom.call(null, 0)
    }else {
    }
    return cljs.core.symbol.call(null, cljs.core.str.call(null, prefix_string, cljs.core.swap_BANG_.call(null, cljs.core.gensym_counter, cljs.core.inc)))
  };
  gensym = function(prefix_string) {
    switch(arguments.length) {
      case 0:
        return gensym__12254.call(this);
      case 1:
        return gensym__12255.call(this, prefix_string)
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
  var this__12257 = this;
  return"\ufdd0'done".call(null, cljs.core.deref.call(null, this__12257.state))
};
cljs.core.Delay.prototype.cljs$core$IDeref$ = true;
cljs.core.Delay.prototype.cljs$core$IDeref$_deref = function(_) {
  var this__12258 = this;
  return"\ufdd0'value".call(null, cljs.core.swap_BANG_.call(null, this__12258.state, function(p__12259) {
    var curr_state__12260 = p__12259;
    var curr_state__12261 = cljs.core.truth_(cljs.core.seq_QMARK_.call(null, curr_state__12260)) ? cljs.core.apply.call(null, cljs.core.hash_map, curr_state__12260) : curr_state__12260;
    var done__12262 = cljs.core.get.call(null, curr_state__12261, "\ufdd0'done");
    if(cljs.core.truth_(done__12262)) {
      return curr_state__12261
    }else {
      return cljs.core.ObjMap.fromObject(["\ufdd0'done", "\ufdd0'value"], {"\ufdd0'done":true, "\ufdd0'value":this__12258.f.call(null)})
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
    var map__12263__12264 = options;
    var map__12263__12265 = cljs.core.truth_(cljs.core.seq_QMARK_.call(null, map__12263__12264)) ? cljs.core.apply.call(null, cljs.core.hash_map, map__12263__12264) : map__12263__12264;
    var keywordize_keys__12266 = cljs.core.get.call(null, map__12263__12265, "\ufdd0'keywordize-keys");
    var keyfn__12267 = cljs.core.truth_(keywordize_keys__12266) ? cljs.core.keyword : cljs.core.str;
    var f__12273 = function thisfn(x) {
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
                var iter__520__auto____12272 = function iter__12268(s__12269) {
                  return new cljs.core.LazySeq(null, false, function() {
                    var s__12269__12270 = s__12269;
                    while(true) {
                      if(cljs.core.truth_(cljs.core.seq.call(null, s__12269__12270))) {
                        var k__12271 = cljs.core.first.call(null, s__12269__12270);
                        return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([keyfn__12267.call(null, k__12271), thisfn.call(null, x[k__12271])]), iter__12268.call(null, cljs.core.rest.call(null, s__12269__12270)))
                      }else {
                        return null
                      }
                      break
                    }
                  })
                };
                return iter__520__auto____12272.call(null, cljs.core.js_keys.call(null, x))
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
    return f__12273.call(null, x)
  };
  var js__GT_clj = function(x, var_args) {
    var options = null;
    if(goog.isDef(var_args)) {
      options = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return js__GT_clj__delegate.call(this, x, options)
  };
  js__GT_clj.cljs$lang$maxFixedArity = 1;
  js__GT_clj.cljs$lang$applyTo = function(arglist__12274) {
    var x = cljs.core.first(arglist__12274);
    var options = cljs.core.rest(arglist__12274);
    return js__GT_clj__delegate.call(this, x, options)
  };
  return js__GT_clj
}();
cljs.core.memoize = function memoize(f) {
  var mem__12275 = cljs.core.atom.call(null, cljs.core.ObjMap.fromObject([], {}));
  return function() {
    var G__12279__delegate = function(args) {
      var temp__3971__auto____12276 = cljs.core.get.call(null, cljs.core.deref.call(null, mem__12275), args);
      if(cljs.core.truth_(temp__3971__auto____12276)) {
        var v__12277 = temp__3971__auto____12276;
        return v__12277
      }else {
        var ret__12278 = cljs.core.apply.call(null, f, args);
        cljs.core.swap_BANG_.call(null, mem__12275, cljs.core.assoc, args, ret__12278);
        return ret__12278
      }
    };
    var G__12279 = function(var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__12279__delegate.call(this, args)
    };
    G__12279.cljs$lang$maxFixedArity = 0;
    G__12279.cljs$lang$applyTo = function(arglist__12280) {
      var args = cljs.core.seq(arglist__12280);
      return G__12279__delegate.call(this, args)
    };
    return G__12279
  }()
};
cljs.core.trampoline = function() {
  var trampoline = null;
  var trampoline__12282 = function(f) {
    while(true) {
      var ret__12281 = f.call(null);
      if(cljs.core.truth_(cljs.core.fn_QMARK_.call(null, ret__12281))) {
        var G__12285 = ret__12281;
        f = G__12285;
        continue
      }else {
        return ret__12281
      }
      break
    }
  };
  var trampoline__12283 = function() {
    var G__12286__delegate = function(f, args) {
      return trampoline.call(null, function() {
        return cljs.core.apply.call(null, f, args)
      })
    };
    var G__12286 = function(f, var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__12286__delegate.call(this, f, args)
    };
    G__12286.cljs$lang$maxFixedArity = 1;
    G__12286.cljs$lang$applyTo = function(arglist__12287) {
      var f = cljs.core.first(arglist__12287);
      var args = cljs.core.rest(arglist__12287);
      return G__12286__delegate.call(this, f, args)
    };
    return G__12286
  }();
  trampoline = function(f, var_args) {
    var args = var_args;
    switch(arguments.length) {
      case 1:
        return trampoline__12282.call(this, f);
      default:
        return trampoline__12283.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  trampoline.cljs$lang$maxFixedArity = 1;
  trampoline.cljs$lang$applyTo = trampoline__12283.cljs$lang$applyTo;
  return trampoline
}();
cljs.core.rand = function() {
  var rand = null;
  var rand__12288 = function() {
    return rand.call(null, 1)
  };
  var rand__12289 = function(n) {
    return Math.random() * n
  };
  rand = function(n) {
    switch(arguments.length) {
      case 0:
        return rand__12288.call(this);
      case 1:
        return rand__12289.call(this, n)
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
    var k__12291 = f.call(null, x);
    return cljs.core.assoc.call(null, ret, k__12291, cljs.core.conj.call(null, cljs.core.get.call(null, ret, k__12291, cljs.core.PersistentVector.fromArray([])), x))
  }, cljs.core.ObjMap.fromObject([], {}), coll)
};
cljs.core.make_hierarchy = function make_hierarchy() {
  return cljs.core.ObjMap.fromObject(["\ufdd0'parents", "\ufdd0'descendants", "\ufdd0'ancestors"], {"\ufdd0'parents":cljs.core.ObjMap.fromObject([], {}), "\ufdd0'descendants":cljs.core.ObjMap.fromObject([], {}), "\ufdd0'ancestors":cljs.core.ObjMap.fromObject([], {})})
};
cljs.core.global_hierarchy = cljs.core.atom.call(null, cljs.core.make_hierarchy.call(null));
cljs.core.isa_QMARK_ = function() {
  var isa_QMARK_ = null;
  var isa_QMARK___12300 = function(child, parent) {
    return isa_QMARK_.call(null, cljs.core.deref.call(null, cljs.core.global_hierarchy), child, parent)
  };
  var isa_QMARK___12301 = function(h, child, parent) {
    var or__3824__auto____12292 = cljs.core._EQ_.call(null, child, parent);
    if(cljs.core.truth_(or__3824__auto____12292)) {
      return or__3824__auto____12292
    }else {
      var or__3824__auto____12293 = cljs.core.contains_QMARK_.call(null, "\ufdd0'ancestors".call(null, h).call(null, child), parent);
      if(cljs.core.truth_(or__3824__auto____12293)) {
        return or__3824__auto____12293
      }else {
        var and__3822__auto____12294 = cljs.core.vector_QMARK_.call(null, parent);
        if(cljs.core.truth_(and__3822__auto____12294)) {
          var and__3822__auto____12295 = cljs.core.vector_QMARK_.call(null, child);
          if(cljs.core.truth_(and__3822__auto____12295)) {
            var and__3822__auto____12296 = cljs.core._EQ_.call(null, cljs.core.count.call(null, parent), cljs.core.count.call(null, child));
            if(cljs.core.truth_(and__3822__auto____12296)) {
              var ret__12297 = true;
              var i__12298 = 0;
              while(true) {
                if(cljs.core.truth_(function() {
                  var or__3824__auto____12299 = cljs.core.not.call(null, ret__12297);
                  if(cljs.core.truth_(or__3824__auto____12299)) {
                    return or__3824__auto____12299
                  }else {
                    return cljs.core._EQ_.call(null, i__12298, cljs.core.count.call(null, parent))
                  }
                }())) {
                  return ret__12297
                }else {
                  var G__12303 = isa_QMARK_.call(null, h, child.call(null, i__12298), parent.call(null, i__12298));
                  var G__12304 = i__12298 + 1;
                  ret__12297 = G__12303;
                  i__12298 = G__12304;
                  continue
                }
                break
              }
            }else {
              return and__3822__auto____12296
            }
          }else {
            return and__3822__auto____12295
          }
        }else {
          return and__3822__auto____12294
        }
      }
    }
  };
  isa_QMARK_ = function(h, child, parent) {
    switch(arguments.length) {
      case 2:
        return isa_QMARK___12300.call(this, h, child);
      case 3:
        return isa_QMARK___12301.call(this, h, child, parent)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return isa_QMARK_
}();
cljs.core.parents = function() {
  var parents = null;
  var parents__12305 = function(tag) {
    return parents.call(null, cljs.core.deref.call(null, cljs.core.global_hierarchy), tag)
  };
  var parents__12306 = function(h, tag) {
    return cljs.core.not_empty.call(null, cljs.core.get.call(null, "\ufdd0'parents".call(null, h), tag))
  };
  parents = function(h, tag) {
    switch(arguments.length) {
      case 1:
        return parents__12305.call(this, h);
      case 2:
        return parents__12306.call(this, h, tag)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return parents
}();
cljs.core.ancestors = function() {
  var ancestors = null;
  var ancestors__12308 = function(tag) {
    return ancestors.call(null, cljs.core.deref.call(null, cljs.core.global_hierarchy), tag)
  };
  var ancestors__12309 = function(h, tag) {
    return cljs.core.not_empty.call(null, cljs.core.get.call(null, "\ufdd0'ancestors".call(null, h), tag))
  };
  ancestors = function(h, tag) {
    switch(arguments.length) {
      case 1:
        return ancestors__12308.call(this, h);
      case 2:
        return ancestors__12309.call(this, h, tag)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return ancestors
}();
cljs.core.descendants = function() {
  var descendants = null;
  var descendants__12311 = function(tag) {
    return descendants.call(null, cljs.core.deref.call(null, cljs.core.global_hierarchy), tag)
  };
  var descendants__12312 = function(h, tag) {
    return cljs.core.not_empty.call(null, cljs.core.get.call(null, "\ufdd0'descendants".call(null, h), tag))
  };
  descendants = function(h, tag) {
    switch(arguments.length) {
      case 1:
        return descendants__12311.call(this, h);
      case 2:
        return descendants__12312.call(this, h, tag)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return descendants
}();
cljs.core.derive = function() {
  var derive = null;
  var derive__12322 = function(tag, parent) {
    if(cljs.core.truth_(cljs.core.namespace.call(null, parent))) {
    }else {
      throw new Error(cljs.core.str.call(null, "Assert failed: ", cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'namespace", "\ufdd1'parent"), cljs.core.hash_map("\ufdd0'line", 3566)))));
    }
    cljs.core.swap_BANG_.call(null, cljs.core.global_hierarchy, derive, tag, parent);
    return null
  };
  var derive__12323 = function(h, tag, parent) {
    if(cljs.core.truth_(cljs.core.not_EQ_.call(null, tag, parent))) {
    }else {
      throw new Error(cljs.core.str.call(null, "Assert failed: ", cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'not=", "\ufdd1'tag", "\ufdd1'parent"), cljs.core.hash_map("\ufdd0'line", 3570)))));
    }
    var tp__12317 = "\ufdd0'parents".call(null, h);
    var td__12318 = "\ufdd0'descendants".call(null, h);
    var ta__12319 = "\ufdd0'ancestors".call(null, h);
    var tf__12320 = function(m, source, sources, target, targets) {
      return cljs.core.reduce.call(null, function(ret, k) {
        return cljs.core.assoc.call(null, ret, k, cljs.core.reduce.call(null, cljs.core.conj, cljs.core.get.call(null, targets, k, cljs.core.set([])), cljs.core.cons.call(null, target, targets.call(null, target))))
      }, m, cljs.core.cons.call(null, source, sources.call(null, source)))
    };
    var or__3824__auto____12321 = cljs.core.truth_(cljs.core.contains_QMARK_.call(null, tp__12317.call(null, tag), parent)) ? null : function() {
      if(cljs.core.truth_(cljs.core.contains_QMARK_.call(null, ta__12319.call(null, tag), parent))) {
        throw new Error(cljs.core.str.call(null, tag, "already has", parent, "as ancestor"));
      }else {
      }
      if(cljs.core.truth_(cljs.core.contains_QMARK_.call(null, ta__12319.call(null, parent), tag))) {
        throw new Error(cljs.core.str.call(null, "Cyclic derivation:", parent, "has", tag, "as ancestor"));
      }else {
      }
      return cljs.core.ObjMap.fromObject(["\ufdd0'parents", "\ufdd0'ancestors", "\ufdd0'descendants"], {"\ufdd0'parents":cljs.core.assoc.call(null, "\ufdd0'parents".call(null, h), tag, cljs.core.conj.call(null, cljs.core.get.call(null, tp__12317, tag, cljs.core.set([])), parent)), "\ufdd0'ancestors":tf__12320.call(null, "\ufdd0'ancestors".call(null, h), tag, td__12318, parent, ta__12319), "\ufdd0'descendants":tf__12320.call(null, "\ufdd0'descendants".call(null, h), parent, ta__12319, tag, td__12318)})
    }();
    if(cljs.core.truth_(or__3824__auto____12321)) {
      return or__3824__auto____12321
    }else {
      return h
    }
  };
  derive = function(h, tag, parent) {
    switch(arguments.length) {
      case 2:
        return derive__12322.call(this, h, tag);
      case 3:
        return derive__12323.call(this, h, tag, parent)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return derive
}();
cljs.core.underive = function() {
  var underive = null;
  var underive__12329 = function(tag, parent) {
    cljs.core.swap_BANG_.call(null, cljs.core.global_hierarchy, underive, tag, parent);
    return null
  };
  var underive__12330 = function(h, tag, parent) {
    var parentMap__12325 = "\ufdd0'parents".call(null, h);
    var childsParents__12326 = cljs.core.truth_(parentMap__12325.call(null, tag)) ? cljs.core.disj.call(null, parentMap__12325.call(null, tag), parent) : cljs.core.set([]);
    var newParents__12327 = cljs.core.truth_(cljs.core.not_empty.call(null, childsParents__12326)) ? cljs.core.assoc.call(null, parentMap__12325, tag, childsParents__12326) : cljs.core.dissoc.call(null, parentMap__12325, tag);
    var deriv_seq__12328 = cljs.core.flatten.call(null, cljs.core.map.call(null, function(p1__12314_SHARP_) {
      return cljs.core.cons.call(null, cljs.core.first.call(null, p1__12314_SHARP_), cljs.core.interpose.call(null, cljs.core.first.call(null, p1__12314_SHARP_), cljs.core.second.call(null, p1__12314_SHARP_)))
    }, cljs.core.seq.call(null, newParents__12327)));
    if(cljs.core.truth_(cljs.core.contains_QMARK_.call(null, parentMap__12325.call(null, tag), parent))) {
      return cljs.core.reduce.call(null, function(p1__12315_SHARP_, p2__12316_SHARP_) {
        return cljs.core.apply.call(null, cljs.core.derive, p1__12315_SHARP_, p2__12316_SHARP_)
      }, cljs.core.make_hierarchy.call(null), cljs.core.partition.call(null, 2, deriv_seq__12328))
    }else {
      return h
    }
  };
  underive = function(h, tag, parent) {
    switch(arguments.length) {
      case 2:
        return underive__12329.call(this, h, tag);
      case 3:
        return underive__12330.call(this, h, tag, parent)
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
  var xprefs__12332 = cljs.core.deref.call(null, prefer_table).call(null, x);
  var or__3824__auto____12334 = cljs.core.truth_(function() {
    var and__3822__auto____12333 = xprefs__12332;
    if(cljs.core.truth_(and__3822__auto____12333)) {
      return xprefs__12332.call(null, y)
    }else {
      return and__3822__auto____12333
    }
  }()) ? true : null;
  if(cljs.core.truth_(or__3824__auto____12334)) {
    return or__3824__auto____12334
  }else {
    var or__3824__auto____12336 = function() {
      var ps__12335 = cljs.core.parents.call(null, y);
      while(true) {
        if(cljs.core.truth_(cljs.core.count.call(null, ps__12335) > 0)) {
          if(cljs.core.truth_(prefers_STAR_.call(null, x, cljs.core.first.call(null, ps__12335), prefer_table))) {
          }else {
          }
          var G__12339 = cljs.core.rest.call(null, ps__12335);
          ps__12335 = G__12339;
          continue
        }else {
          return null
        }
        break
      }
    }();
    if(cljs.core.truth_(or__3824__auto____12336)) {
      return or__3824__auto____12336
    }else {
      var or__3824__auto____12338 = function() {
        var ps__12337 = cljs.core.parents.call(null, x);
        while(true) {
          if(cljs.core.truth_(cljs.core.count.call(null, ps__12337) > 0)) {
            if(cljs.core.truth_(prefers_STAR_.call(null, cljs.core.first.call(null, ps__12337), y, prefer_table))) {
            }else {
            }
            var G__12340 = cljs.core.rest.call(null, ps__12337);
            ps__12337 = G__12340;
            continue
          }else {
            return null
          }
          break
        }
      }();
      if(cljs.core.truth_(or__3824__auto____12338)) {
        return or__3824__auto____12338
      }else {
        return false
      }
    }
  }
};
cljs.core.dominates = function dominates(x, y, prefer_table) {
  var or__3824__auto____12341 = cljs.core.prefers_STAR_.call(null, x, y, prefer_table);
  if(cljs.core.truth_(or__3824__auto____12341)) {
    return or__3824__auto____12341
  }else {
    return cljs.core.isa_QMARK_.call(null, x, y)
  }
};
cljs.core.find_and_cache_best_method = function find_and_cache_best_method(name, dispatch_val, hierarchy, method_table, prefer_table, method_cache, cached_hierarchy) {
  var best_entry__12350 = cljs.core.reduce.call(null, function(be, p__12342) {
    var vec__12343__12344 = p__12342;
    var k__12345 = cljs.core.nth.call(null, vec__12343__12344, 0, null);
    var ___12346 = cljs.core.nth.call(null, vec__12343__12344, 1, null);
    var e__12347 = vec__12343__12344;
    if(cljs.core.truth_(cljs.core.isa_QMARK_.call(null, dispatch_val, k__12345))) {
      var be2__12349 = cljs.core.truth_(function() {
        var or__3824__auto____12348 = be === null;
        if(cljs.core.truth_(or__3824__auto____12348)) {
          return or__3824__auto____12348
        }else {
          return cljs.core.dominates.call(null, k__12345, cljs.core.first.call(null, be), prefer_table)
        }
      }()) ? e__12347 : be;
      if(cljs.core.truth_(cljs.core.dominates.call(null, cljs.core.first.call(null, be2__12349), k__12345, prefer_table))) {
      }else {
        throw new Error(cljs.core.str.call(null, "Multiple methods in multimethod '", name, "' match dispatch value: ", dispatch_val, " -> ", k__12345, " and ", cljs.core.first.call(null, be2__12349), ", and neither is preferred"));
      }
      return be2__12349
    }else {
      return be
    }
  }, null, cljs.core.deref.call(null, method_table));
  if(cljs.core.truth_(best_entry__12350)) {
    if(cljs.core.truth_(cljs.core._EQ_.call(null, cljs.core.deref.call(null, cached_hierarchy), cljs.core.deref.call(null, hierarchy)))) {
      cljs.core.swap_BANG_.call(null, method_cache, cljs.core.assoc, dispatch_val, cljs.core.second.call(null, best_entry__12350));
      return cljs.core.second.call(null, best_entry__12350)
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
    var and__3822__auto____12351 = mf;
    if(cljs.core.truth_(and__3822__auto____12351)) {
      return mf.cljs$core$IMultiFn$_reset
    }else {
      return and__3822__auto____12351
    }
  }())) {
    return mf.cljs$core$IMultiFn$_reset(mf)
  }else {
    return function() {
      var or__3824__auto____12352 = cljs.core._reset[goog.typeOf.call(null, mf)];
      if(cljs.core.truth_(or__3824__auto____12352)) {
        return or__3824__auto____12352
      }else {
        var or__3824__auto____12353 = cljs.core._reset["_"];
        if(cljs.core.truth_(or__3824__auto____12353)) {
          return or__3824__auto____12353
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-reset", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._add_method = function _add_method(mf, dispatch_val, method) {
  if(cljs.core.truth_(function() {
    var and__3822__auto____12354 = mf;
    if(cljs.core.truth_(and__3822__auto____12354)) {
      return mf.cljs$core$IMultiFn$_add_method
    }else {
      return and__3822__auto____12354
    }
  }())) {
    return mf.cljs$core$IMultiFn$_add_method(mf, dispatch_val, method)
  }else {
    return function() {
      var or__3824__auto____12355 = cljs.core._add_method[goog.typeOf.call(null, mf)];
      if(cljs.core.truth_(or__3824__auto____12355)) {
        return or__3824__auto____12355
      }else {
        var or__3824__auto____12356 = cljs.core._add_method["_"];
        if(cljs.core.truth_(or__3824__auto____12356)) {
          return or__3824__auto____12356
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-add-method", mf);
        }
      }
    }().call(null, mf, dispatch_val, method)
  }
};
cljs.core._remove_method = function _remove_method(mf, dispatch_val) {
  if(cljs.core.truth_(function() {
    var and__3822__auto____12357 = mf;
    if(cljs.core.truth_(and__3822__auto____12357)) {
      return mf.cljs$core$IMultiFn$_remove_method
    }else {
      return and__3822__auto____12357
    }
  }())) {
    return mf.cljs$core$IMultiFn$_remove_method(mf, dispatch_val)
  }else {
    return function() {
      var or__3824__auto____12358 = cljs.core._remove_method[goog.typeOf.call(null, mf)];
      if(cljs.core.truth_(or__3824__auto____12358)) {
        return or__3824__auto____12358
      }else {
        var or__3824__auto____12359 = cljs.core._remove_method["_"];
        if(cljs.core.truth_(or__3824__auto____12359)) {
          return or__3824__auto____12359
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-remove-method", mf);
        }
      }
    }().call(null, mf, dispatch_val)
  }
};
cljs.core._prefer_method = function _prefer_method(mf, dispatch_val, dispatch_val_y) {
  if(cljs.core.truth_(function() {
    var and__3822__auto____12360 = mf;
    if(cljs.core.truth_(and__3822__auto____12360)) {
      return mf.cljs$core$IMultiFn$_prefer_method
    }else {
      return and__3822__auto____12360
    }
  }())) {
    return mf.cljs$core$IMultiFn$_prefer_method(mf, dispatch_val, dispatch_val_y)
  }else {
    return function() {
      var or__3824__auto____12361 = cljs.core._prefer_method[goog.typeOf.call(null, mf)];
      if(cljs.core.truth_(or__3824__auto____12361)) {
        return or__3824__auto____12361
      }else {
        var or__3824__auto____12362 = cljs.core._prefer_method["_"];
        if(cljs.core.truth_(or__3824__auto____12362)) {
          return or__3824__auto____12362
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-prefer-method", mf);
        }
      }
    }().call(null, mf, dispatch_val, dispatch_val_y)
  }
};
cljs.core._get_method = function _get_method(mf, dispatch_val) {
  if(cljs.core.truth_(function() {
    var and__3822__auto____12363 = mf;
    if(cljs.core.truth_(and__3822__auto____12363)) {
      return mf.cljs$core$IMultiFn$_get_method
    }else {
      return and__3822__auto____12363
    }
  }())) {
    return mf.cljs$core$IMultiFn$_get_method(mf, dispatch_val)
  }else {
    return function() {
      var or__3824__auto____12364 = cljs.core._get_method[goog.typeOf.call(null, mf)];
      if(cljs.core.truth_(or__3824__auto____12364)) {
        return or__3824__auto____12364
      }else {
        var or__3824__auto____12365 = cljs.core._get_method["_"];
        if(cljs.core.truth_(or__3824__auto____12365)) {
          return or__3824__auto____12365
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-get-method", mf);
        }
      }
    }().call(null, mf, dispatch_val)
  }
};
cljs.core._methods = function _methods(mf) {
  if(cljs.core.truth_(function() {
    var and__3822__auto____12366 = mf;
    if(cljs.core.truth_(and__3822__auto____12366)) {
      return mf.cljs$core$IMultiFn$_methods
    }else {
      return and__3822__auto____12366
    }
  }())) {
    return mf.cljs$core$IMultiFn$_methods(mf)
  }else {
    return function() {
      var or__3824__auto____12367 = cljs.core._methods[goog.typeOf.call(null, mf)];
      if(cljs.core.truth_(or__3824__auto____12367)) {
        return or__3824__auto____12367
      }else {
        var or__3824__auto____12368 = cljs.core._methods["_"];
        if(cljs.core.truth_(or__3824__auto____12368)) {
          return or__3824__auto____12368
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-methods", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._prefers = function _prefers(mf) {
  if(cljs.core.truth_(function() {
    var and__3822__auto____12369 = mf;
    if(cljs.core.truth_(and__3822__auto____12369)) {
      return mf.cljs$core$IMultiFn$_prefers
    }else {
      return and__3822__auto____12369
    }
  }())) {
    return mf.cljs$core$IMultiFn$_prefers(mf)
  }else {
    return function() {
      var or__3824__auto____12370 = cljs.core._prefers[goog.typeOf.call(null, mf)];
      if(cljs.core.truth_(or__3824__auto____12370)) {
        return or__3824__auto____12370
      }else {
        var or__3824__auto____12371 = cljs.core._prefers["_"];
        if(cljs.core.truth_(or__3824__auto____12371)) {
          return or__3824__auto____12371
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-prefers", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._dispatch = function _dispatch(mf, args) {
  if(cljs.core.truth_(function() {
    var and__3822__auto____12372 = mf;
    if(cljs.core.truth_(and__3822__auto____12372)) {
      return mf.cljs$core$IMultiFn$_dispatch
    }else {
      return and__3822__auto____12372
    }
  }())) {
    return mf.cljs$core$IMultiFn$_dispatch(mf, args)
  }else {
    return function() {
      var or__3824__auto____12373 = cljs.core._dispatch[goog.typeOf.call(null, mf)];
      if(cljs.core.truth_(or__3824__auto____12373)) {
        return or__3824__auto____12373
      }else {
        var or__3824__auto____12374 = cljs.core._dispatch["_"];
        if(cljs.core.truth_(or__3824__auto____12374)) {
          return or__3824__auto____12374
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-dispatch", mf);
        }
      }
    }().call(null, mf, args)
  }
};
cljs.core.do_dispatch = function do_dispatch(mf, dispatch_fn, args) {
  var dispatch_val__12375 = cljs.core.apply.call(null, dispatch_fn, args);
  var target_fn__12376 = cljs.core._get_method.call(null, mf, dispatch_val__12375);
  if(cljs.core.truth_(target_fn__12376)) {
  }else {
    throw new Error(cljs.core.str.call(null, "No method in multimethod '", cljs.core.name, "' for dispatch value: ", dispatch_val__12375));
  }
  return cljs.core.apply.call(null, target_fn__12376, args)
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
  var this__12377 = this;
  return goog.getUid.call(null, this$)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$ = true;
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_reset = function(mf) {
  var this__12378 = this;
  cljs.core.swap_BANG_.call(null, this__12378.method_table, function(mf) {
    return cljs.core.ObjMap.fromObject([], {})
  });
  cljs.core.swap_BANG_.call(null, this__12378.method_cache, function(mf) {
    return cljs.core.ObjMap.fromObject([], {})
  });
  cljs.core.swap_BANG_.call(null, this__12378.prefer_table, function(mf) {
    return cljs.core.ObjMap.fromObject([], {})
  });
  cljs.core.swap_BANG_.call(null, this__12378.cached_hierarchy, function(mf) {
    return null
  });
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_add_method = function(mf, dispatch_val, method) {
  var this__12379 = this;
  cljs.core.swap_BANG_.call(null, this__12379.method_table, cljs.core.assoc, dispatch_val, method);
  cljs.core.reset_cache.call(null, this__12379.method_cache, this__12379.method_table, this__12379.cached_hierarchy, this__12379.hierarchy);
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_remove_method = function(mf, dispatch_val) {
  var this__12380 = this;
  cljs.core.swap_BANG_.call(null, this__12380.method_table, cljs.core.dissoc, dispatch_val);
  cljs.core.reset_cache.call(null, this__12380.method_cache, this__12380.method_table, this__12380.cached_hierarchy, this__12380.hierarchy);
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_get_method = function(mf, dispatch_val) {
  var this__12381 = this;
  if(cljs.core.truth_(cljs.core._EQ_.call(null, cljs.core.deref.call(null, this__12381.cached_hierarchy), cljs.core.deref.call(null, this__12381.hierarchy)))) {
  }else {
    cljs.core.reset_cache.call(null, this__12381.method_cache, this__12381.method_table, this__12381.cached_hierarchy, this__12381.hierarchy)
  }
  var temp__3971__auto____12382 = cljs.core.deref.call(null, this__12381.method_cache).call(null, dispatch_val);
  if(cljs.core.truth_(temp__3971__auto____12382)) {
    var target_fn__12383 = temp__3971__auto____12382;
    return target_fn__12383
  }else {
    var temp__3971__auto____12384 = cljs.core.find_and_cache_best_method.call(null, this__12381.name, dispatch_val, this__12381.hierarchy, this__12381.method_table, this__12381.prefer_table, this__12381.method_cache, this__12381.cached_hierarchy);
    if(cljs.core.truth_(temp__3971__auto____12384)) {
      var target_fn__12385 = temp__3971__auto____12384;
      return target_fn__12385
    }else {
      return cljs.core.deref.call(null, this__12381.method_table).call(null, this__12381.default_dispatch_val)
    }
  }
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_prefer_method = function(mf, dispatch_val_x, dispatch_val_y) {
  var this__12386 = this;
  if(cljs.core.truth_(cljs.core.prefers_STAR_.call(null, dispatch_val_x, dispatch_val_y, this__12386.prefer_table))) {
    throw new Error(cljs.core.str.call(null, "Preference conflict in multimethod '", this__12386.name, "': ", dispatch_val_y, " is already preferred to ", dispatch_val_x));
  }else {
  }
  cljs.core.swap_BANG_.call(null, this__12386.prefer_table, function(old) {
    return cljs.core.assoc.call(null, old, dispatch_val_x, cljs.core.conj.call(null, cljs.core.get.call(null, old, dispatch_val_x, cljs.core.set([])), dispatch_val_y))
  });
  return cljs.core.reset_cache.call(null, this__12386.method_cache, this__12386.method_table, this__12386.cached_hierarchy, this__12386.hierarchy)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_methods = function(mf) {
  var this__12387 = this;
  return cljs.core.deref.call(null, this__12387.method_table)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_prefers = function(mf) {
  var this__12388 = this;
  return cljs.core.deref.call(null, this__12388.prefer_table)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_dispatch = function(mf, args) {
  var this__12389 = this;
  return cljs.core.do_dispatch.call(null, mf, this__12389.dispatch_fn, args)
};
cljs.core.MultiFn;
cljs.core.MultiFn.prototype.call = function() {
  var G__12390__delegate = function(_, args) {
    return cljs.core._dispatch.call(null, this, args)
  };
  var G__12390 = function(_, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return G__12390__delegate.call(this, _, args)
  };
  G__12390.cljs$lang$maxFixedArity = 1;
  G__12390.cljs$lang$applyTo = function(arglist__12391) {
    var _ = cljs.core.first(arglist__12391);
    var args = cljs.core.rest(arglist__12391);
    return G__12390__delegate.call(this, _, args)
  };
  return G__12390
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
goog.provide("goog.debug");
goog.require("goog.array");
goog.require("goog.string");
goog.require("goog.structs.Set");
goog.debug.catchErrors = function(logFunc, opt_cancel, opt_target) {
  var target = opt_target || goog.global;
  var oldErrorHandler = target.onerror;
  target.onerror = function(message, url, line) {
    if(oldErrorHandler) {
      oldErrorHandler(message, url, line)
    }
    logFunc({message:message, fileName:url, line:line});
    return Boolean(opt_cancel)
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
goog.debug.getFunctionName = function(fn) {
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
goog.debug.Logger.prototype.logToSpeedTracer_ = function(msg) {
  if(goog.global["console"] && goog.global["console"]["markTimeline"]) {
    goog.global["console"]["markTimeline"](msg)
  }
};
goog.debug.Logger.prototype.doLogRecord_ = function(logRecord) {
  this.logToSpeedTracer_("log:" + logRecord.getMessage());
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
goog.provide("goog.dom.BrowserFeature");
goog.require("goog.userAgent");
goog.dom.BrowserFeature = {CAN_ADD_NAME_OR_TYPE_ATTRIBUTES:!goog.userAgent.IE || goog.userAgent.isVersion("9"), CAN_USE_CHILDREN_ATTRIBUTE:!goog.userAgent.GECKO && !goog.userAgent.IE || goog.userAgent.IE && goog.userAgent.isVersion("9") || goog.userAgent.GECKO && goog.userAgent.isVersion("1.9.1"), CAN_USE_INNER_TEXT:goog.userAgent.IE && !goog.userAgent.isVersion("9"), INNER_HTML_NEEDS_SCOPED_ELEMENT:goog.userAgent.IE};
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
            element[key] = val
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
  var doc;
  if(goog.userAgent.WEBKIT) {
    doc = frame.document || frame.contentWindow.document
  }else {
    doc = frame.contentDocument || frame.contentWindow.document
  }
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
    for(var i = 0, child;child = root.childNodes[i];i++) {
      if(p(child)) {
        rv.push(child);
        if(findOne) {
          return true
        }
      }
      if(goog.dom.findNodes_(child, p, rv, findOne)) {
        return true
      }
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
    return goog.isNumber(index) && index >= 0
  }
  return false
};
goog.dom.setFocusableTabIndex = function(element, enable) {
  if(enable) {
    element.tabIndex = 0
  }else {
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
  if(!goog.userAgent.IE) {
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
goog.dom.DomHelper.prototype.getAncestor = goog.dom.getAncestor;
goog.provide("onedit.core");
goog.require("cljs.core");
goog.require("goog.dom");
goog.require("goog.debug.Logger");
onedit.core.logger = goog.debug.Logger.getLogger.call(null, "onedit");
onedit.core.jquery = $;
onedit.core.log = function log(p1__10589_SHARP_) {
  return onedit.core.logger.info(p1__10589_SHARP_)
};
onedit.core.tab_pane = function tab_pane() {
  return onedit.core.jquery.call(null, "div.active")
};
onedit.core.filename = function() {
  var filename = null;
  var filename__10590 = function() {
    return onedit.core.tab_pane.call(null).data("filename")
  };
  var filename__10591 = function(filename) {
    return onedit.core.tab_pane.call(null).data("filename", filename)
  };
  filename = function(filename) {
    switch(arguments.length) {
      case 0:
        return filename__10590.call(this);
      case 1:
        return filename__10591.call(this, filename)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return filename
}();
onedit.core.data = function() {
  var data = null;
  var data__10593 = function(key) {
    return onedit.core.tab_pane.call(null).data(key)
  };
  var data__10594 = function(key, value) {
    return onedit.core.tab_pane.call(null).data(key, value)
  };
  data = function(key, value) {
    switch(arguments.length) {
      case 1:
        return data__10593.call(this, key);
      case 2:
        return data__10594.call(this, key, value)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return data
}();
onedit.core.buffer_array = function buffer_array() {
  return onedit.core.jquery.call(null, ".active pre")
};
onedit.core.buffer = function buffer() {
  return onedit.core.buffer_array.call(null)[0]
};
onedit.core.buffer_content = cljs.core.comp.call(null, goog.dom.getRawTextContent, onedit.core.buffer);
onedit.core.unique = function unique(f) {
  return onedit.core.jquery.getJSON("unique", function(p1__10596_SHARP_) {
    return f.call(null, p1__10596_SHARP_["id"])
  })
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
goog.Disposable.prototype.disposeInternal = function() {
};
goog.dispose = function(obj) {
  if(obj && typeof obj.dispose == "function") {
    obj.dispose()
  }
};
goog.provide("goog.debug.EntryPointMonitor");
goog.provide("goog.debug.entryPointRegistry");
goog.debug.EntryPointMonitor = function() {
};
goog.debug.EntryPointMonitor.prototype.wrap;
goog.debug.EntryPointMonitor.prototype.unwrap;
goog.debug.entryPointRegistry.refList_ = [];
goog.debug.entryPointRegistry.register = function(callback) {
  goog.debug.entryPointRegistry.refList_[goog.debug.entryPointRegistry.refList_.length] = callback
};
goog.debug.entryPointRegistry.monitorAll = function(monitor) {
  var transformer = goog.bind(monitor.wrap, monitor);
  for(var i = 0;i < goog.debug.entryPointRegistry.refList_.length;i++) {
    goog.debug.entryPointRegistry.refList_[i](transformer)
  }
};
goog.debug.entryPointRegistry.unmonitorAllIfPossible = function(monitor) {
  var transformer = goog.bind(monitor.unwrap, monitor);
  for(var i = 0;i < goog.debug.entryPointRegistry.refList_.length;i++) {
    goog.debug.entryPointRegistry.refList_[i](transformer)
  }
};
goog.provide("goog.debug.errorHandlerWeakDep");
goog.debug.errorHandlerWeakDep = {protectEntryPoint:function(fn, opt_tracers) {
  return fn
}};
goog.provide("goog.events.BrowserFeature");
goog.require("goog.userAgent");
goog.events.BrowserFeature = {HAS_W3C_BUTTON:!goog.userAgent.IE || goog.userAgent.isVersion("9"), SET_KEY_CODE_TO_PREVENT_DEFAULT:goog.userAgent.IE && !goog.userAgent.isVersion("8")};
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
MESSAGE:"message", CONNECT:"connect"};
goog.provide("goog.reflect");
goog.reflect.object = function(type, object) {
  return object
};
goog.reflect.sinkValue = new Function("a", "return a");
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
      try {
        goog.reflect.sinkValue(relatedTarget.nodeName)
      }catch(err) {
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
goog.provide("goog.structs.SimplePool");
goog.require("goog.Disposable");
goog.structs.SimplePool = function(initialCount, maxCount) {
  goog.Disposable.call(this);
  this.maxCount_ = maxCount;
  this.freeQueue_ = [];
  this.createInitial_(initialCount)
};
goog.inherits(goog.structs.SimplePool, goog.Disposable);
goog.structs.SimplePool.prototype.createObjectFn_ = null;
goog.structs.SimplePool.prototype.disposeObjectFn_ = null;
goog.structs.SimplePool.prototype.setCreateObjectFn = function(createObjectFn) {
  this.createObjectFn_ = createObjectFn
};
goog.structs.SimplePool.prototype.setDisposeObjectFn = function(disposeObjectFn) {
  this.disposeObjectFn_ = disposeObjectFn
};
goog.structs.SimplePool.prototype.getObject = function() {
  if(this.freeQueue_.length) {
    return this.freeQueue_.pop()
  }
  return this.createObject()
};
goog.structs.SimplePool.prototype.releaseObject = function(obj) {
  if(this.freeQueue_.length < this.maxCount_) {
    this.freeQueue_.push(obj)
  }else {
    this.disposeObject(obj)
  }
};
goog.structs.SimplePool.prototype.createInitial_ = function(initialCount) {
  if(initialCount > this.maxCount_) {
    throw Error("[goog.structs.SimplePool] Initial cannot be greater than max");
  }
  for(var i = 0;i < initialCount;i++) {
    this.freeQueue_.push(this.createObject())
  }
};
goog.structs.SimplePool.prototype.createObject = function() {
  if(this.createObjectFn_) {
    return this.createObjectFn_()
  }else {
    return{}
  }
};
goog.structs.SimplePool.prototype.disposeObject = function(obj) {
  if(this.disposeObjectFn_) {
    this.disposeObjectFn_(obj)
  }else {
    if(goog.isObject(obj)) {
      if(goog.isFunction(obj.dispose)) {
        obj.dispose()
      }else {
        for(var i in obj) {
          delete obj[i]
        }
      }
    }
  }
};
goog.structs.SimplePool.prototype.disposeInternal = function() {
  goog.structs.SimplePool.superClass_.disposeInternal.call(this);
  var freeQueue = this.freeQueue_;
  while(freeQueue.length) {
    this.disposeObject(freeQueue.pop())
  }
  delete this.freeQueue_
};
goog.provide("goog.events.pools");
goog.require("goog.events.BrowserEvent");
goog.require("goog.events.Listener");
goog.require("goog.structs.SimplePool");
goog.require("goog.userAgent.jscript");
goog.events.ASSUME_GOOD_GC = false;
goog.events.pools.getObject;
goog.events.pools.releaseObject;
goog.events.pools.getArray;
goog.events.pools.releaseArray;
goog.events.pools.getProxy;
goog.events.pools.setProxyCallbackFunction;
goog.events.pools.releaseProxy;
goog.events.pools.getListener;
goog.events.pools.releaseListener;
goog.events.pools.getEvent;
goog.events.pools.releaseEvent;
(function() {
  var BAD_GC = !goog.events.ASSUME_GOOD_GC && goog.userAgent.jscript.HAS_JSCRIPT && !goog.userAgent.jscript.isVersion("5.7");
  function getObject() {
    return{count_:0, remaining_:0}
  }
  function getArray() {
    return[]
  }
  var proxyCallbackFunction;
  goog.events.pools.setProxyCallbackFunction = function(cb) {
    proxyCallbackFunction = cb
  };
  function getProxy() {
    var f = function(eventObject) {
      return proxyCallbackFunction.call(f.src, f.key, eventObject)
    };
    return f
  }
  function getListener() {
    return new goog.events.Listener
  }
  function getEvent() {
    return new goog.events.BrowserEvent
  }
  if(!BAD_GC) {
    goog.events.pools.getObject = getObject;
    goog.events.pools.releaseObject = goog.nullFunction;
    goog.events.pools.getArray = getArray;
    goog.events.pools.releaseArray = goog.nullFunction;
    goog.events.pools.getProxy = getProxy;
    goog.events.pools.releaseProxy = goog.nullFunction;
    goog.events.pools.getListener = getListener;
    goog.events.pools.releaseListener = goog.nullFunction;
    goog.events.pools.getEvent = getEvent;
    goog.events.pools.releaseEvent = goog.nullFunction
  }else {
    goog.events.pools.getObject = function() {
      return objectPool.getObject()
    };
    goog.events.pools.releaseObject = function(obj) {
      objectPool.releaseObject(obj)
    };
    goog.events.pools.getArray = function() {
      return arrayPool.getObject()
    };
    goog.events.pools.releaseArray = function(obj) {
      arrayPool.releaseObject(obj)
    };
    goog.events.pools.getProxy = function() {
      return proxyPool.getObject()
    };
    goog.events.pools.releaseProxy = function(obj) {
      proxyPool.releaseObject(getProxy())
    };
    goog.events.pools.getListener = function() {
      return listenerPool.getObject()
    };
    goog.events.pools.releaseListener = function(obj) {
      listenerPool.releaseObject(obj)
    };
    goog.events.pools.getEvent = function() {
      return eventPool.getObject()
    };
    goog.events.pools.releaseEvent = function(obj) {
      eventPool.releaseObject(obj)
    };
    var OBJECT_POOL_INITIAL_COUNT = 0;
    var OBJECT_POOL_MAX_COUNT = 600;
    var objectPool = new goog.structs.SimplePool(OBJECT_POOL_INITIAL_COUNT, OBJECT_POOL_MAX_COUNT);
    objectPool.setCreateObjectFn(getObject);
    var ARRAY_POOL_INITIAL_COUNT = 0;
    var ARRAY_POOL_MAX_COUNT = 600;
    var arrayPool = new goog.structs.SimplePool(ARRAY_POOL_INITIAL_COUNT, ARRAY_POOL_MAX_COUNT);
    arrayPool.setCreateObjectFn(getArray);
    var HANDLE_EVENT_PROXY_POOL_INITIAL_COUNT = 0;
    var HANDLE_EVENT_PROXY_POOL_MAX_COUNT = 600;
    var proxyPool = new goog.structs.SimplePool(HANDLE_EVENT_PROXY_POOL_INITIAL_COUNT, HANDLE_EVENT_PROXY_POOL_MAX_COUNT);
    proxyPool.setCreateObjectFn(getProxy);
    var LISTENER_POOL_INITIAL_COUNT = 0;
    var LISTENER_POOL_MAX_COUNT = 600;
    var listenerPool = new goog.structs.SimplePool(LISTENER_POOL_INITIAL_COUNT, LISTENER_POOL_MAX_COUNT);
    listenerPool.setCreateObjectFn(getListener);
    var EVENT_POOL_INITIAL_COUNT = 0;
    var EVENT_POOL_MAX_COUNT = 600;
    var eventPool = new goog.structs.SimplePool(EVENT_POOL_INITIAL_COUNT, EVENT_POOL_MAX_COUNT);
    eventPool.setCreateObjectFn(getEvent)
  }
})();
goog.provide("goog.events");
goog.require("goog.array");
goog.require("goog.debug.entryPointRegistry");
goog.require("goog.debug.errorHandlerWeakDep");
goog.require("goog.events.BrowserEvent");
goog.require("goog.events.Event");
goog.require("goog.events.EventWrapper");
goog.require("goog.events.pools");
goog.require("goog.object");
goog.require("goog.userAgent");
goog.events.listeners_ = {};
goog.events.listenerTree_ = {};
goog.events.sources_ = {};
goog.events.onString_ = "on";
goog.events.onStringMap_ = {};
goog.events.keySeparator_ = "_";
goog.events.requiresSyntheticEventPropagation_;
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
        map[type] = goog.events.pools.getObject()
      }
      map = map[type];
      if(!(capture in map)) {
        map[capture] = goog.events.pools.getObject();
        map.count_++
      }
      map = map[capture];
      var srcUid = goog.getUid(src);
      var listenerArray, listenerObj;
      map.remaining_++;
      if(!map[srcUid]) {
        listenerArray = map[srcUid] = goog.events.pools.getArray();
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
      var proxy = goog.events.pools.getProxy();
      proxy.src = src;
      listenerObj = goog.events.pools.getListener();
      listenerObj.init(listener, proxy, src, type, capture, opt_handler);
      var key = listenerObj.key;
      proxy.key = key;
      listenerArray.push(listenerObj);
      goog.events.listeners_[key] = listenerObj;
      if(!goog.events.sources_[srcUid]) {
        goog.events.sources_[srcUid] = goog.events.pools.getArray()
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
          goog.events.pools.releaseProxy(proxy);
          goog.events.pools.releaseListener(listenerArray[oldIndex]);
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
        goog.events.pools.releaseArray(listenerArray);
        delete goog.events.listenerTree_[type][capture][srcUid];
        goog.events.listenerTree_[type][capture].count_--;
        if(goog.events.listenerTree_[type][capture].count_ == 0) {
          goog.events.pools.releaseObject(goog.events.listenerTree_[type][capture]);
          delete goog.events.listenerTree_[type][capture];
          goog.events.listenerTree_[type].count_--
        }
        if(goog.events.listenerTree_[type].count_ == 0) {
          goog.events.pools.releaseObject(goog.events.listenerTree_[type]);
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
      if(listenerArray[i].listener == listener && listenerArray[i].capture == capture && listenerArray[i].handler == opt_handler) {
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
  goog.events.handleBrowserEvent_ = errorHandler.protectEntryPoint(goog.events.handleBrowserEvent_);
  goog.events.pools.setProxyCallbackFunction(goog.events.handleBrowserEvent_)
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
  if(goog.events.synthesizeEventPropagation_()) {
    var ieEvent = opt_evt || goog.getObjectByName("window.event");
    var hasCapture = true in map;
    var hasBubble = false in map;
    if(hasCapture) {
      if(goog.events.isMarkedIeEvent_(ieEvent)) {
        return true
      }
      goog.events.markIeEvent_(ieEvent)
    }
    var evt = goog.events.pools.getEvent();
    evt.init(ieEvent, this);
    retval = true;
    try {
      if(hasCapture) {
        var ancestors = goog.events.pools.getArray();
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
        ancestors.length = 0;
        goog.events.pools.releaseArray(ancestors)
      }
      evt.dispose();
      goog.events.pools.releaseEvent(evt)
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
goog.events.pools.setProxyCallbackFunction(goog.events.handleBrowserEvent_);
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
goog.events.synthesizeEventPropagation_ = function() {
  if(goog.events.requiresSyntheticEventPropagation_ === undefined) {
    goog.events.requiresSyntheticEventPropagation_ = goog.userAgent.IE && !goog.global["addEventListener"]
  }
  return goog.events.requiresSyntheticEventPropagation_
};
goog.debug.entryPointRegistry.register(function(transformer) {
  goog.events.handleBrowserEvent_ = transformer(goog.events.handleBrowserEvent_);
  goog.events.pools.setProxyCallbackFunction(goog.events.handleBrowserEvent_)
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
goog.provide("goog.json");
goog.provide("goog.json.Serializer");
goog.json.isValid_ = function(s) {
  if(/^\s*$/.test(s)) {
    return false
  }
  var backslashesRe = /\\["\\\/bfnrtu]/g;
  var simpleValuesRe = /"[^"\\\n\r\u2028\u2029\x00-\x08\x10-\x1f\x80-\x9f]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g;
  var openBracketsRe = /(?:^|:|,)(?:[\s\u2028\u2029]*\[)+/g;
  var remainderRe = /^[\],:{}\s\u2028\u2029]*$/;
  return remainderRe.test(s.replace(backslashesRe, "@").replace(simpleValuesRe, "]").replace(openBracketsRe, ""))
};
goog.json.parse = function(s) {
  var o = String(s);
  if(goog.json.isValid_(o)) {
    try {
      return eval("(" + o + ")")
    }catch(ex) {
    }
  }
  throw Error("Invalid JSON string: " + o);
};
goog.json.unsafeParse = function(s) {
  return eval("(" + s + ")")
};
goog.json.serialize = function(object) {
  return(new goog.json.Serializer).serialize(object)
};
goog.json.Serializer = function() {
};
goog.json.Serializer.prototype.serialize = function(object) {
  var sb = [];
  this.serialize_(object, sb);
  return sb.join("")
};
goog.json.Serializer.prototype.serialize_ = function(object, sb) {
  switch(typeof object) {
    case "string":
      this.serializeString_(object, sb);
      break;
    case "number":
      this.serializeNumber_(object, sb);
      break;
    case "boolean":
      sb.push(object);
      break;
    case "undefined":
      sb.push("null");
      break;
    case "object":
      if(object == null) {
        sb.push("null");
        break
      }
      if(goog.isArray(object)) {
        this.serializeArray_(object, sb);
        break
      }
      this.serializeObject_(object, sb);
      break;
    case "function":
      break;
    default:
      throw Error("Unknown type: " + typeof object);
  }
};
goog.json.Serializer.charToJsonCharCache_ = {'"':'\\"', "\\":"\\\\", "/":"\\/", "\u0008":"\\b", "\u000c":"\\f", "\n":"\\n", "\r":"\\r", "\t":"\\t", "\u000b":"\\u000b"};
goog.json.Serializer.charsToReplace_ = /\uffff/.test("\uffff") ? /[\\\"\x00-\x1f\x7f-\uffff]/g : /[\\\"\x00-\x1f\x7f-\xff]/g;
goog.json.Serializer.prototype.serializeString_ = function(s, sb) {
  sb.push('"', s.replace(goog.json.Serializer.charsToReplace_, function(c) {
    if(c in goog.json.Serializer.charToJsonCharCache_) {
      return goog.json.Serializer.charToJsonCharCache_[c]
    }
    var cc = c.charCodeAt(0);
    var rv = "\\u";
    if(cc < 16) {
      rv += "000"
    }else {
      if(cc < 256) {
        rv += "00"
      }else {
        if(cc < 4096) {
          rv += "0"
        }
      }
    }
    return goog.json.Serializer.charToJsonCharCache_[c] = rv + cc.toString(16)
  }), '"')
};
goog.json.Serializer.prototype.serializeNumber_ = function(n, sb) {
  sb.push(isFinite(n) && !isNaN(n) ? n : "null")
};
goog.json.Serializer.prototype.serializeArray_ = function(arr, sb) {
  var l = arr.length;
  sb.push("[");
  var sep = "";
  for(var i = 0;i < l;i++) {
    sb.push(sep);
    this.serialize_(arr[i], sb);
    sep = ","
  }
  sb.push("]")
};
goog.json.Serializer.prototype.serializeObject_ = function(obj, sb) {
  sb.push("{");
  var sep = "";
  for(var key in obj) {
    if(Object.prototype.hasOwnProperty.call(obj, key)) {
      var value = obj[key];
      if(typeof value != "function") {
        sb.push(sep);
        this.serializeString_(key, sb);
        sb.push(":");
        this.serialize_(value, sb);
        sep = ","
      }
    }
  }
  sb.push("}")
};
goog.provide("goog.net.ErrorCode");
goog.net.ErrorCode = {NO_ERROR:0, ACCESS_DENIED:1, FILE_NOT_FOUND:2, FF_SILENT_ERROR:3, CUSTOM_ERROR:4, EXCEPTION:5, HTTP_ERROR:6, ABORT:7, TIMEOUT:8, OFFLINE:9};
goog.net.ErrorCode.getDebugMessage = function(errorCode) {
  switch(errorCode) {
    case goog.net.ErrorCode.NO_ERROR:
      return"No Error";
    case goog.net.ErrorCode.ACCESS_DENIED:
      return"Access denied to content document";
    case goog.net.ErrorCode.FILE_NOT_FOUND:
      return"File not found";
    case goog.net.ErrorCode.FF_SILENT_ERROR:
      return"Firefox silently errored";
    case goog.net.ErrorCode.CUSTOM_ERROR:
      return"Application custom error";
    case goog.net.ErrorCode.EXCEPTION:
      return"An exception occurred";
    case goog.net.ErrorCode.HTTP_ERROR:
      return"Http response at 400 or 500 level";
    case goog.net.ErrorCode.ABORT:
      return"Request was aborted";
    case goog.net.ErrorCode.TIMEOUT:
      return"Request timed out";
    case goog.net.ErrorCode.OFFLINE:
      return"The resource is not available offline";
    default:
      return"Unrecognized error code"
  }
};
goog.provide("goog.net.EventType");
goog.net.EventType = {COMPLETE:"complete", SUCCESS:"success", ERROR:"error", ABORT:"abort", READY:"ready", READY_STATE_CHANGE:"readystatechange", TIMEOUT:"timeout", INCREMENTAL_DATA:"incrementaldata", PROGRESS:"progress"};
goog.provide("goog.net.HttpStatus");
goog.net.HttpStatus = {CONTINUE:100, SWITCHING_PROTOCOLS:101, OK:200, CREATED:201, ACCEPTED:202, NON_AUTHORITATIVE_INFORMATION:203, NO_CONTENT:204, RESET_CONTENT:205, PARTIAL_CONTENT:206, MULTIPLE_CHOICES:300, MOVED_PERMANENTLY:301, FOUND:302, SEE_OTHER:303, NOT_MODIFIED:304, USE_PROXY:305, TEMPORARY_REDIRECT:307, BAD_REQUEST:400, UNAUTHORIZED:401, PAYMENT_REQUIRED:402, FORBIDDEN:403, NOT_FOUND:404, METHOD_NOT_ALLOWED:405, NOT_ACCEPTABLE:406, PROXY_AUTHENTICATION_REQUIRED:407, REQUEST_TIMEOUT:408, 
CONFLICT:409, GONE:410, LENGTH_REQUIRED:411, PRECONDITION_FAILED:412, REQUEST_ENTITY_TOO_LARGE:413, REQUEST_URI_TOO_LONG:414, UNSUPPORTED_MEDIA_TYPE:415, REQUEST_RANGE_NOT_SATISFIABLE:416, EXPECTATION_FAILED:417, INTERNAL_SERVER_ERROR:500, NOT_IMPLEMENTED:501, BAD_GATEWAY:502, SERVICE_UNAVAILABLE:503, GATEWAY_TIMEOUT:504, HTTP_VERSION_NOT_SUPPORTED:505};
goog.provide("goog.net.XmlHttpFactory");
goog.net.XmlHttpFactory = function() {
};
goog.net.XmlHttpFactory.prototype.cachedOptions_ = null;
goog.net.XmlHttpFactory.prototype.createInstance = goog.abstractMethod;
goog.net.XmlHttpFactory.prototype.getOptions = function() {
  return this.cachedOptions_ || (this.cachedOptions_ = this.internalGetOptions())
};
goog.net.XmlHttpFactory.prototype.internalGetOptions = goog.abstractMethod;
goog.provide("goog.net.WrapperXmlHttpFactory");
goog.require("goog.net.XmlHttpFactory");
goog.net.WrapperXmlHttpFactory = function(xhrFactory, optionsFactory) {
  goog.net.XmlHttpFactory.call(this);
  this.xhrFactory_ = xhrFactory;
  this.optionsFactory_ = optionsFactory
};
goog.inherits(goog.net.WrapperXmlHttpFactory, goog.net.XmlHttpFactory);
goog.net.WrapperXmlHttpFactory.prototype.createInstance = function() {
  return this.xhrFactory_()
};
goog.net.WrapperXmlHttpFactory.prototype.getOptions = function() {
  return this.optionsFactory_()
};
goog.provide("goog.net.DefaultXmlHttpFactory");
goog.provide("goog.net.XmlHttp");
goog.provide("goog.net.XmlHttp.OptionType");
goog.provide("goog.net.XmlHttp.ReadyState");
goog.require("goog.net.WrapperXmlHttpFactory");
goog.require("goog.net.XmlHttpFactory");
goog.net.XmlHttp = function() {
  return goog.net.XmlHttp.factory_.createInstance()
};
goog.net.XmlHttp.getOptions = function() {
  return goog.net.XmlHttp.factory_.getOptions()
};
goog.net.XmlHttp.OptionType = {USE_NULL_FUNCTION:0, LOCAL_REQUEST_ERROR:1};
goog.net.XmlHttp.ReadyState = {UNINITIALIZED:0, LOADING:1, LOADED:2, INTERACTIVE:3, COMPLETE:4};
goog.net.XmlHttp.factory_;
goog.net.XmlHttp.setFactory = function(factory, optionsFactory) {
  goog.net.XmlHttp.setGlobalFactory(new goog.net.WrapperXmlHttpFactory(factory, optionsFactory))
};
goog.net.XmlHttp.setGlobalFactory = function(factory) {
  goog.net.XmlHttp.factory_ = factory
};
goog.net.DefaultXmlHttpFactory = function() {
  goog.net.XmlHttpFactory.call(this)
};
goog.inherits(goog.net.DefaultXmlHttpFactory, goog.net.XmlHttpFactory);
goog.net.DefaultXmlHttpFactory.prototype.createInstance = function() {
  var progId = this.getProgId_();
  if(progId) {
    return new ActiveXObject(progId)
  }else {
    return new XMLHttpRequest
  }
};
goog.net.DefaultXmlHttpFactory.prototype.internalGetOptions = function() {
  var progId = this.getProgId_();
  var options = {};
  if(progId) {
    options[goog.net.XmlHttp.OptionType.USE_NULL_FUNCTION] = true;
    options[goog.net.XmlHttp.OptionType.LOCAL_REQUEST_ERROR] = true
  }
  return options
};
goog.net.DefaultXmlHttpFactory.prototype.ieProgId_ = null;
goog.net.DefaultXmlHttpFactory.prototype.getProgId_ = function() {
  if(!this.ieProgId_ && typeof XMLHttpRequest == "undefined" && typeof ActiveXObject != "undefined") {
    var ACTIVE_X_IDENTS = ["MSXML2.XMLHTTP.6.0", "MSXML2.XMLHTTP.3.0", "MSXML2.XMLHTTP", "Microsoft.XMLHTTP"];
    for(var i = 0;i < ACTIVE_X_IDENTS.length;i++) {
      var candidate = ACTIVE_X_IDENTS[i];
      try {
        new ActiveXObject(candidate);
        this.ieProgId_ = candidate;
        return candidate
      }catch(e) {
      }
    }
    throw Error("Could not create ActiveXObject. ActiveX might be disabled," + " or MSXML might not be installed");
  }
  return this.ieProgId_
};
goog.net.XmlHttp.setGlobalFactory(new goog.net.DefaultXmlHttpFactory);
goog.provide("goog.net.xhrMonitor");
goog.require("goog.array");
goog.require("goog.debug.Logger");
goog.require("goog.userAgent");
goog.net.XhrMonitor_ = function() {
  if(!goog.userAgent.GECKO) {
    return
  }
  this.contextsToXhr_ = {};
  this.xhrToContexts_ = {};
  this.stack_ = []
};
goog.net.XhrMonitor_.getKey = function(obj) {
  return goog.isString(obj) ? obj : goog.isObject(obj) ? goog.getUid(obj) : ""
};
goog.net.XhrMonitor_.prototype.logger_ = goog.debug.Logger.getLogger("goog.net.xhrMonitor");
goog.net.XhrMonitor_.prototype.enabled_ = goog.userAgent.GECKO;
goog.net.XhrMonitor_.prototype.setEnabled = function(val) {
  this.enabled_ = goog.userAgent.GECKO && val
};
goog.net.XhrMonitor_.prototype.pushContext = function(context) {
  if(!this.enabled_) {
    return
  }
  var key = goog.net.XhrMonitor_.getKey(context);
  this.logger_.finest("Pushing context: " + context + " (" + key + ")");
  this.stack_.push(key)
};
goog.net.XhrMonitor_.prototype.popContext = function() {
  if(!this.enabled_) {
    return
  }
  var context = this.stack_.pop();
  this.logger_.finest("Popping context: " + context);
  this.updateDependentContexts_(context)
};
goog.net.XhrMonitor_.prototype.isContextSafe = function(context) {
  if(!this.enabled_) {
    return true
  }
  var deps = this.contextsToXhr_[goog.net.XhrMonitor_.getKey(context)];
  this.logger_.fine("Context is safe : " + context + " - " + deps);
  return!deps
};
goog.net.XhrMonitor_.prototype.markXhrOpen = function(xhr) {
  if(!this.enabled_) {
    return
  }
  var uid = goog.getUid(xhr);
  this.logger_.fine("Opening XHR : " + uid);
  for(var i = 0;i < this.stack_.length;i++) {
    var context = this.stack_[i];
    this.addToMap_(this.contextsToXhr_, context, uid);
    this.addToMap_(this.xhrToContexts_, uid, context)
  }
};
goog.net.XhrMonitor_.prototype.markXhrClosed = function(xhr) {
  if(!this.enabled_) {
    return
  }
  var uid = goog.getUid(xhr);
  this.logger_.fine("Closing XHR : " + uid);
  delete this.xhrToContexts_[uid];
  for(var context in this.contextsToXhr_) {
    goog.array.remove(this.contextsToXhr_[context], uid);
    if(this.contextsToXhr_[context].length == 0) {
      delete this.contextsToXhr_[context]
    }
  }
};
goog.net.XhrMonitor_.prototype.updateDependentContexts_ = function(xhrUid) {
  var contexts = this.xhrToContexts_[xhrUid];
  var xhrs = this.contextsToXhr_[xhrUid];
  if(contexts && xhrs) {
    this.logger_.finest("Updating dependent contexts");
    goog.array.forEach(contexts, function(context) {
      goog.array.forEach(xhrs, function(xhr) {
        this.addToMap_(this.contextsToXhr_, context, xhr);
        this.addToMap_(this.xhrToContexts_, xhr, context)
      }, this)
    }, this)
  }
};
goog.net.XhrMonitor_.prototype.addToMap_ = function(map, key, value) {
  if(!map[key]) {
    map[key] = []
  }
  if(!goog.array.contains(map[key], value)) {
    map[key].push(value)
  }
};
goog.net.xhrMonitor = new goog.net.XhrMonitor_;
goog.provide("goog.uri.utils");
goog.provide("goog.uri.utils.ComponentIndex");
goog.require("goog.asserts");
goog.require("goog.string");
goog.uri.utils.CharCode_ = {AMPERSAND:38, EQUAL:61, HASH:35, QUESTION:63};
goog.uri.utils.buildFromEncodedParts = function(opt_scheme, opt_userInfo, opt_domain, opt_port, opt_path, opt_queryData, opt_fragment) {
  var out = [];
  if(opt_scheme) {
    out.push(opt_scheme, ":")
  }
  if(opt_domain) {
    out.push("//");
    if(opt_userInfo) {
      out.push(opt_userInfo, "@")
    }
    out.push(opt_domain);
    if(opt_port) {
      out.push(":", opt_port)
    }
  }
  if(opt_path) {
    out.push(opt_path)
  }
  if(opt_queryData) {
    out.push("?", opt_queryData)
  }
  if(opt_fragment) {
    out.push("#", opt_fragment)
  }
  return out.join("")
};
goog.uri.utils.splitRe_ = new RegExp("^" + "(?:" + "([^:/?#.]+)" + ":)?" + "(?://" + "(?:([^/?#]*)@)?" + "([\\w\\d\\-\\u0100-\\uffff.%]*)" + "(?::([0-9]+))?" + ")?" + "([^?#]+)?" + "(?:\\?([^#]*))?" + "(?:#(.*))?" + "$");
goog.uri.utils.ComponentIndex = {SCHEME:1, USER_INFO:2, DOMAIN:3, PORT:4, PATH:5, QUERY_DATA:6, FRAGMENT:7};
goog.uri.utils.split = function(uri) {
  return uri.match(goog.uri.utils.splitRe_)
};
goog.uri.utils.decodeIfPossible_ = function(uri) {
  return uri && decodeURIComponent(uri)
};
goog.uri.utils.getComponentByIndex_ = function(componentIndex, uri) {
  return goog.uri.utils.split(uri)[componentIndex] || null
};
goog.uri.utils.getScheme = function(uri) {
  return goog.uri.utils.getComponentByIndex_(goog.uri.utils.ComponentIndex.SCHEME, uri)
};
goog.uri.utils.getUserInfoEncoded = function(uri) {
  return goog.uri.utils.getComponentByIndex_(goog.uri.utils.ComponentIndex.USER_INFO, uri)
};
goog.uri.utils.getUserInfo = function(uri) {
  return goog.uri.utils.decodeIfPossible_(goog.uri.utils.getUserInfoEncoded(uri))
};
goog.uri.utils.getDomainEncoded = function(uri) {
  return goog.uri.utils.getComponentByIndex_(goog.uri.utils.ComponentIndex.DOMAIN, uri)
};
goog.uri.utils.getDomain = function(uri) {
  return goog.uri.utils.decodeIfPossible_(goog.uri.utils.getDomainEncoded(uri))
};
goog.uri.utils.getPort = function(uri) {
  return Number(goog.uri.utils.getComponentByIndex_(goog.uri.utils.ComponentIndex.PORT, uri)) || null
};
goog.uri.utils.getPathEncoded = function(uri) {
  return goog.uri.utils.getComponentByIndex_(goog.uri.utils.ComponentIndex.PATH, uri)
};
goog.uri.utils.getPath = function(uri) {
  return goog.uri.utils.decodeIfPossible_(goog.uri.utils.getPathEncoded(uri))
};
goog.uri.utils.getQueryData = function(uri) {
  return goog.uri.utils.getComponentByIndex_(goog.uri.utils.ComponentIndex.QUERY_DATA, uri)
};
goog.uri.utils.getFragmentEncoded = function(uri) {
  var hashIndex = uri.indexOf("#");
  return hashIndex < 0 ? null : uri.substr(hashIndex + 1)
};
goog.uri.utils.setFragmentEncoded = function(uri, fragment) {
  return goog.uri.utils.removeFragment(uri) + (fragment ? "#" + fragment : "")
};
goog.uri.utils.getFragment = function(uri) {
  return goog.uri.utils.decodeIfPossible_(goog.uri.utils.getFragmentEncoded(uri))
};
goog.uri.utils.getHost = function(uri) {
  var pieces = goog.uri.utils.split(uri);
  return goog.uri.utils.buildFromEncodedParts(pieces[goog.uri.utils.ComponentIndex.SCHEME], pieces[goog.uri.utils.ComponentIndex.USER_INFO], pieces[goog.uri.utils.ComponentIndex.DOMAIN], pieces[goog.uri.utils.ComponentIndex.PORT])
};
goog.uri.utils.getPathAndAfter = function(uri) {
  var pieces = goog.uri.utils.split(uri);
  return goog.uri.utils.buildFromEncodedParts(null, null, null, null, pieces[goog.uri.utils.ComponentIndex.PATH], pieces[goog.uri.utils.ComponentIndex.QUERY_DATA], pieces[goog.uri.utils.ComponentIndex.FRAGMENT])
};
goog.uri.utils.removeFragment = function(uri) {
  var hashIndex = uri.indexOf("#");
  return hashIndex < 0 ? uri : uri.substr(0, hashIndex)
};
goog.uri.utils.haveSameDomain = function(uri1, uri2) {
  var pieces1 = goog.uri.utils.split(uri1);
  var pieces2 = goog.uri.utils.split(uri2);
  return pieces1[goog.uri.utils.ComponentIndex.DOMAIN] == pieces2[goog.uri.utils.ComponentIndex.DOMAIN] && pieces1[goog.uri.utils.ComponentIndex.SCHEME] == pieces2[goog.uri.utils.ComponentIndex.SCHEME] && pieces1[goog.uri.utils.ComponentIndex.PORT] == pieces2[goog.uri.utils.ComponentIndex.PORT]
};
goog.uri.utils.assertNoFragmentsOrQueries_ = function(uri) {
  if(goog.DEBUG && (uri.indexOf("#") >= 0 || uri.indexOf("?") >= 0)) {
    throw Error("goog.uri.utils: Fragment or query identifiers are not " + "supported: [" + uri + "]");
  }
};
goog.uri.utils.QueryValue;
goog.uri.utils.QueryArray;
goog.uri.utils.appendQueryData_ = function(buffer) {
  if(buffer[1]) {
    var baseUri = buffer[0];
    var hashIndex = baseUri.indexOf("#");
    if(hashIndex >= 0) {
      buffer.push(baseUri.substr(hashIndex));
      buffer[0] = baseUri = baseUri.substr(0, hashIndex)
    }
    var questionIndex = baseUri.indexOf("?");
    if(questionIndex < 0) {
      buffer[1] = "?"
    }else {
      if(questionIndex == baseUri.length - 1) {
        buffer[1] = undefined
      }
    }
  }
  return buffer.join("")
};
goog.uri.utils.appendKeyValuePairs_ = function(key, value, pairs) {
  if(goog.isArray(value)) {
    value = value;
    for(var j = 0;j < value.length;j++) {
      pairs.push("&", key);
      if(value[j] !== "") {
        pairs.push("=", goog.string.urlEncode(value[j]))
      }
    }
  }else {
    if(value != null) {
      pairs.push("&", key);
      if(value !== "") {
        pairs.push("=", goog.string.urlEncode(value))
      }
    }
  }
};
goog.uri.utils.buildQueryDataBuffer_ = function(buffer, keysAndValues, opt_startIndex) {
  goog.asserts.assert(Math.max(keysAndValues.length - (opt_startIndex || 0), 0) % 2 == 0, "goog.uri.utils: Key/value lists must be even in length.");
  for(var i = opt_startIndex || 0;i < keysAndValues.length;i += 2) {
    goog.uri.utils.appendKeyValuePairs_(keysAndValues[i], keysAndValues[i + 1], buffer)
  }
  return buffer
};
goog.uri.utils.buildQueryData = function(keysAndValues, opt_startIndex) {
  var buffer = goog.uri.utils.buildQueryDataBuffer_([], keysAndValues, opt_startIndex);
  buffer[0] = "";
  return buffer.join("")
};
goog.uri.utils.buildQueryDataBufferFromMap_ = function(buffer, map) {
  for(var key in map) {
    goog.uri.utils.appendKeyValuePairs_(key, map[key], buffer)
  }
  return buffer
};
goog.uri.utils.buildQueryDataFromMap = function(map) {
  var buffer = goog.uri.utils.buildQueryDataBufferFromMap_([], map);
  buffer[0] = "";
  return buffer.join("")
};
goog.uri.utils.appendParams = function(uri, var_args) {
  return goog.uri.utils.appendQueryData_(arguments.length == 2 ? goog.uri.utils.buildQueryDataBuffer_([uri], arguments[1], 0) : goog.uri.utils.buildQueryDataBuffer_([uri], arguments, 1))
};
goog.uri.utils.appendParamsFromMap = function(uri, map) {
  return goog.uri.utils.appendQueryData_(goog.uri.utils.buildQueryDataBufferFromMap_([uri], map))
};
goog.uri.utils.appendParam = function(uri, key, value) {
  return goog.uri.utils.appendQueryData_([uri, "&", key, "=", goog.string.urlEncode(value)])
};
goog.uri.utils.findParam_ = function(uri, startIndex, keyEncoded, hashOrEndIndex) {
  var index = startIndex;
  var keyLength = keyEncoded.length;
  while((index = uri.indexOf(keyEncoded, index)) >= 0 && index < hashOrEndIndex) {
    var precedingChar = uri.charCodeAt(index - 1);
    if(precedingChar == goog.uri.utils.CharCode_.AMPERSAND || precedingChar == goog.uri.utils.CharCode_.QUESTION) {
      var followingChar = uri.charCodeAt(index + keyLength);
      if(!followingChar || followingChar == goog.uri.utils.CharCode_.EQUAL || followingChar == goog.uri.utils.CharCode_.AMPERSAND || followingChar == goog.uri.utils.CharCode_.HASH) {
        return index
      }
    }
    index += keyLength + 1
  }
  return-1
};
goog.uri.utils.hashOrEndRe_ = /#|$/;
goog.uri.utils.hasParam = function(uri, keyEncoded) {
  return goog.uri.utils.findParam_(uri, 0, keyEncoded, uri.search(goog.uri.utils.hashOrEndRe_)) >= 0
};
goog.uri.utils.getParamValue = function(uri, keyEncoded) {
  var hashOrEndIndex = uri.search(goog.uri.utils.hashOrEndRe_);
  var foundIndex = goog.uri.utils.findParam_(uri, 0, keyEncoded, hashOrEndIndex);
  if(foundIndex < 0) {
    return null
  }else {
    var endPosition = uri.indexOf("&", foundIndex);
    if(endPosition < 0 || endPosition > hashOrEndIndex) {
      endPosition = hashOrEndIndex
    }
    foundIndex += keyEncoded.length + 1;
    return goog.string.urlDecode(uri.substr(foundIndex, endPosition - foundIndex))
  }
};
goog.uri.utils.getParamValues = function(uri, keyEncoded) {
  var hashOrEndIndex = uri.search(goog.uri.utils.hashOrEndRe_);
  var position = 0;
  var foundIndex;
  var result = [];
  while((foundIndex = goog.uri.utils.findParam_(uri, position, keyEncoded, hashOrEndIndex)) >= 0) {
    position = uri.indexOf("&", foundIndex);
    if(position < 0 || position > hashOrEndIndex) {
      position = hashOrEndIndex
    }
    foundIndex += keyEncoded.length + 1;
    result.push(goog.string.urlDecode(uri.substr(foundIndex, position - foundIndex)))
  }
  return result
};
goog.uri.utils.trailingQueryPunctuationRe_ = /[?&]($|#)/;
goog.uri.utils.removeParam = function(uri, keyEncoded) {
  var hashOrEndIndex = uri.search(goog.uri.utils.hashOrEndRe_);
  var position = 0;
  var foundIndex;
  var buffer = [];
  while((foundIndex = goog.uri.utils.findParam_(uri, position, keyEncoded, hashOrEndIndex)) >= 0) {
    buffer.push(uri.substring(position, foundIndex));
    position = Math.min(uri.indexOf("&", foundIndex) + 1 || hashOrEndIndex, hashOrEndIndex)
  }
  buffer.push(uri.substr(position));
  return buffer.join("").replace(goog.uri.utils.trailingQueryPunctuationRe_, "$1")
};
goog.uri.utils.setParam = function(uri, keyEncoded, value) {
  return goog.uri.utils.appendParam(goog.uri.utils.removeParam(uri, keyEncoded), keyEncoded, value)
};
goog.uri.utils.appendPath = function(baseUri, path) {
  goog.uri.utils.assertNoFragmentsOrQueries_(baseUri);
  if(goog.string.endsWith(baseUri, "/")) {
    baseUri = baseUri.substr(0, baseUri.length - 1)
  }
  if(goog.string.startsWith(path, "/")) {
    path = path.substr(1)
  }
  return goog.string.buildString(baseUri, "/", path)
};
goog.uri.utils.StandardQueryParam = {RANDOM:"zx"};
goog.uri.utils.makeUnique = function(uri) {
  return goog.uri.utils.setParam(uri, goog.uri.utils.StandardQueryParam.RANDOM, goog.string.getRandomString())
};
goog.provide("goog.net.XhrIo");
goog.provide("goog.net.XhrIo.ResponseType");
goog.require("goog.Timer");
goog.require("goog.debug.Logger");
goog.require("goog.debug.entryPointRegistry");
goog.require("goog.debug.errorHandlerWeakDep");
goog.require("goog.events.EventTarget");
goog.require("goog.json");
goog.require("goog.net.ErrorCode");
goog.require("goog.net.EventType");
goog.require("goog.net.HttpStatus");
goog.require("goog.net.XmlHttp");
goog.require("goog.net.xhrMonitor");
goog.require("goog.object");
goog.require("goog.structs");
goog.require("goog.structs.Map");
goog.require("goog.uri.utils");
goog.net.XhrIo = function(opt_xmlHttpFactory) {
  goog.events.EventTarget.call(this);
  this.headers = new goog.structs.Map;
  this.xmlHttpFactory_ = opt_xmlHttpFactory || null
};
goog.inherits(goog.net.XhrIo, goog.events.EventTarget);
goog.net.XhrIo.ResponseType = {DEFAULT:"", TEXT:"text", DOCUMENT:"document", BLOB:"blob", ARRAY_BUFFER:"arraybuffer"};
goog.net.XhrIo.prototype.logger_ = goog.debug.Logger.getLogger("goog.net.XhrIo");
goog.net.XhrIo.CONTENT_TYPE_HEADER = "Content-Type";
goog.net.XhrIo.HTTP_SCHEME_PATTERN = /^https?:?$/i;
goog.net.XhrIo.FORM_CONTENT_TYPE = "application/x-www-form-urlencoded;charset=utf-8";
goog.net.XhrIo.sendInstances_ = [];
goog.net.XhrIo.send = function(url, opt_callback, opt_method, opt_content, opt_headers, opt_timeoutInterval) {
  var x = new goog.net.XhrIo;
  goog.net.XhrIo.sendInstances_.push(x);
  if(opt_callback) {
    goog.events.listen(x, goog.net.EventType.COMPLETE, opt_callback)
  }
  goog.events.listen(x, goog.net.EventType.READY, goog.partial(goog.net.XhrIo.cleanupSend_, x));
  if(opt_timeoutInterval) {
    x.setTimeoutInterval(opt_timeoutInterval)
  }
  x.send(url, opt_method, opt_content, opt_headers)
};
goog.net.XhrIo.cleanup = function() {
  var instances = goog.net.XhrIo.sendInstances_;
  while(instances.length) {
    instances.pop().dispose()
  }
};
goog.net.XhrIo.protectEntryPoints = function(errorHandler) {
  goog.net.XhrIo.prototype.onReadyStateChangeEntryPoint_ = errorHandler.protectEntryPoint(goog.net.XhrIo.prototype.onReadyStateChangeEntryPoint_)
};
goog.net.XhrIo.cleanupSend_ = function(XhrIo) {
  XhrIo.dispose();
  goog.array.remove(goog.net.XhrIo.sendInstances_, XhrIo)
};
goog.net.XhrIo.prototype.active_ = false;
goog.net.XhrIo.prototype.xhr_ = null;
goog.net.XhrIo.prototype.xhrOptions_ = null;
goog.net.XhrIo.prototype.lastUri_ = "";
goog.net.XhrIo.prototype.lastMethod_ = "";
goog.net.XhrIo.prototype.lastErrorCode_ = goog.net.ErrorCode.NO_ERROR;
goog.net.XhrIo.prototype.lastError_ = "";
goog.net.XhrIo.prototype.errorDispatched_ = false;
goog.net.XhrIo.prototype.inSend_ = false;
goog.net.XhrIo.prototype.inOpen_ = false;
goog.net.XhrIo.prototype.inAbort_ = false;
goog.net.XhrIo.prototype.timeoutInterval_ = 0;
goog.net.XhrIo.prototype.timeoutId_ = null;
goog.net.XhrIo.prototype.responseType_ = goog.net.XhrIo.ResponseType.DEFAULT;
goog.net.XhrIo.prototype.withCredentials_ = false;
goog.net.XhrIo.prototype.getTimeoutInterval = function() {
  return this.timeoutInterval_
};
goog.net.XhrIo.prototype.setTimeoutInterval = function(ms) {
  this.timeoutInterval_ = Math.max(0, ms)
};
goog.net.XhrIo.prototype.setResponseType = function(type) {
  this.responseType_ = type
};
goog.net.XhrIo.prototype.getResponseType = function() {
  return this.responseType_
};
goog.net.XhrIo.prototype.setWithCredentials = function(withCredentials) {
  this.withCredentials_ = withCredentials
};
goog.net.XhrIo.prototype.getWithCredentials = function() {
  return this.withCredentials_
};
goog.net.XhrIo.prototype.send = function(url, opt_method, opt_content, opt_headers) {
  if(this.xhr_) {
    throw Error("[goog.net.XhrIo] Object is active with another request");
  }
  var method = opt_method || "GET";
  this.lastUri_ = url;
  this.lastError_ = "";
  this.lastErrorCode_ = goog.net.ErrorCode.NO_ERROR;
  this.lastMethod_ = method;
  this.errorDispatched_ = false;
  this.active_ = true;
  this.xhr_ = this.createXhr();
  this.xhrOptions_ = this.xmlHttpFactory_ ? this.xmlHttpFactory_.getOptions() : goog.net.XmlHttp.getOptions();
  goog.net.xhrMonitor.markXhrOpen(this.xhr_);
  this.xhr_.onreadystatechange = goog.bind(this.onReadyStateChange_, this);
  try {
    this.logger_.fine(this.formatMsg_("Opening Xhr"));
    this.inOpen_ = true;
    this.xhr_.open(method, url, true);
    this.inOpen_ = false
  }catch(err) {
    this.logger_.fine(this.formatMsg_("Error opening Xhr: " + err.message));
    this.error_(goog.net.ErrorCode.EXCEPTION, err);
    return
  }
  var content = opt_content || "";
  var headers = this.headers.clone();
  if(opt_headers) {
    goog.structs.forEach(opt_headers, function(value, key) {
      headers.set(key, value)
    })
  }
  if(method == "POST" && !headers.containsKey(goog.net.XhrIo.CONTENT_TYPE_HEADER)) {
    headers.set(goog.net.XhrIo.CONTENT_TYPE_HEADER, goog.net.XhrIo.FORM_CONTENT_TYPE)
  }
  goog.structs.forEach(headers, function(value, key) {
    this.xhr_.setRequestHeader(key, value)
  }, this);
  if(this.responseType_) {
    this.xhr_.responseType = this.responseType_
  }
  if(goog.object.containsKey(this.xhr_, "withCredentials")) {
    this.xhr_.withCredentials = this.withCredentials_
  }
  try {
    if(this.timeoutId_) {
      goog.Timer.defaultTimerObject.clearTimeout(this.timeoutId_);
      this.timeoutId_ = null
    }
    if(this.timeoutInterval_ > 0) {
      this.logger_.fine(this.formatMsg_("Will abort after " + this.timeoutInterval_ + "ms if incomplete"));
      this.timeoutId_ = goog.Timer.defaultTimerObject.setTimeout(goog.bind(this.timeout_, this), this.timeoutInterval_)
    }
    this.logger_.fine(this.formatMsg_("Sending request"));
    this.inSend_ = true;
    this.xhr_.send(content);
    this.inSend_ = false
  }catch(err) {
    this.logger_.fine(this.formatMsg_("Send error: " + err.message));
    this.error_(goog.net.ErrorCode.EXCEPTION, err)
  }
};
goog.net.XhrIo.prototype.createXhr = function() {
  return this.xmlHttpFactory_ ? this.xmlHttpFactory_.createInstance() : new goog.net.XmlHttp
};
goog.net.XhrIo.prototype.dispatchEvent = function(e) {
  if(this.xhr_) {
    goog.net.xhrMonitor.pushContext(this.xhr_);
    try {
      return goog.net.XhrIo.superClass_.dispatchEvent.call(this, e)
    }finally {
      goog.net.xhrMonitor.popContext()
    }
  }else {
    return goog.net.XhrIo.superClass_.dispatchEvent.call(this, e)
  }
};
goog.net.XhrIo.prototype.timeout_ = function() {
  if(typeof goog == "undefined") {
  }else {
    if(this.xhr_) {
      this.lastError_ = "Timed out after " + this.timeoutInterval_ + "ms, aborting";
      this.lastErrorCode_ = goog.net.ErrorCode.TIMEOUT;
      this.logger_.fine(this.formatMsg_(this.lastError_));
      this.dispatchEvent(goog.net.EventType.TIMEOUT);
      this.abort(goog.net.ErrorCode.TIMEOUT)
    }
  }
};
goog.net.XhrIo.prototype.error_ = function(errorCode, err) {
  this.active_ = false;
  if(this.xhr_) {
    this.inAbort_ = true;
    this.xhr_.abort();
    this.inAbort_ = false
  }
  this.lastError_ = err;
  this.lastErrorCode_ = errorCode;
  this.dispatchErrors_();
  this.cleanUpXhr_()
};
goog.net.XhrIo.prototype.dispatchErrors_ = function() {
  if(!this.errorDispatched_) {
    this.errorDispatched_ = true;
    this.dispatchEvent(goog.net.EventType.COMPLETE);
    this.dispatchEvent(goog.net.EventType.ERROR)
  }
};
goog.net.XhrIo.prototype.abort = function(opt_failureCode) {
  if(this.xhr_ && this.active_) {
    this.logger_.fine(this.formatMsg_("Aborting"));
    this.active_ = false;
    this.inAbort_ = true;
    this.xhr_.abort();
    this.inAbort_ = false;
    this.lastErrorCode_ = opt_failureCode || goog.net.ErrorCode.ABORT;
    this.dispatchEvent(goog.net.EventType.COMPLETE);
    this.dispatchEvent(goog.net.EventType.ABORT);
    this.cleanUpXhr_()
  }
};
goog.net.XhrIo.prototype.disposeInternal = function() {
  if(this.xhr_) {
    if(this.active_) {
      this.active_ = false;
      this.inAbort_ = true;
      this.xhr_.abort();
      this.inAbort_ = false
    }
    this.cleanUpXhr_(true)
  }
  goog.net.XhrIo.superClass_.disposeInternal.call(this)
};
goog.net.XhrIo.prototype.onReadyStateChange_ = function() {
  if(!this.inOpen_ && !this.inSend_ && !this.inAbort_) {
    this.onReadyStateChangeEntryPoint_()
  }else {
    this.onReadyStateChangeHelper_()
  }
};
goog.net.XhrIo.prototype.onReadyStateChangeEntryPoint_ = function() {
  this.onReadyStateChangeHelper_()
};
goog.net.XhrIo.prototype.onReadyStateChangeHelper_ = function() {
  if(!this.active_) {
    return
  }
  if(typeof goog == "undefined") {
  }else {
    if(this.xhrOptions_[goog.net.XmlHttp.OptionType.LOCAL_REQUEST_ERROR] && this.getReadyState() == goog.net.XmlHttp.ReadyState.COMPLETE && this.getStatus() == 2) {
      this.logger_.fine(this.formatMsg_("Local request error detected and ignored"))
    }else {
      if(this.inSend_ && this.getReadyState() == goog.net.XmlHttp.ReadyState.COMPLETE) {
        goog.Timer.defaultTimerObject.setTimeout(goog.bind(this.onReadyStateChange_, this), 0);
        return
      }
      this.dispatchEvent(goog.net.EventType.READY_STATE_CHANGE);
      if(this.isComplete()) {
        this.logger_.fine(this.formatMsg_("Request complete"));
        this.active_ = false;
        if(this.isSuccess()) {
          this.dispatchEvent(goog.net.EventType.COMPLETE);
          this.dispatchEvent(goog.net.EventType.SUCCESS)
        }else {
          this.lastErrorCode_ = goog.net.ErrorCode.HTTP_ERROR;
          this.lastError_ = this.getStatusText() + " [" + this.getStatus() + "]";
          this.dispatchErrors_()
        }
        this.cleanUpXhr_()
      }
    }
  }
};
goog.net.XhrIo.prototype.cleanUpXhr_ = function(opt_fromDispose) {
  if(this.xhr_) {
    var xhr = this.xhr_;
    var clearedOnReadyStateChange = this.xhrOptions_[goog.net.XmlHttp.OptionType.USE_NULL_FUNCTION] ? goog.nullFunction : null;
    this.xhr_ = null;
    this.xhrOptions_ = null;
    if(this.timeoutId_) {
      goog.Timer.defaultTimerObject.clearTimeout(this.timeoutId_);
      this.timeoutId_ = null
    }
    if(!opt_fromDispose) {
      goog.net.xhrMonitor.pushContext(xhr);
      this.dispatchEvent(goog.net.EventType.READY);
      goog.net.xhrMonitor.popContext()
    }
    goog.net.xhrMonitor.markXhrClosed(xhr);
    try {
      xhr.onreadystatechange = clearedOnReadyStateChange
    }catch(e) {
      this.logger_.severe("Problem encountered resetting onreadystatechange: " + e.message)
    }
  }
};
goog.net.XhrIo.prototype.isActive = function() {
  return!!this.xhr_
};
goog.net.XhrIo.prototype.isComplete = function() {
  return this.getReadyState() == goog.net.XmlHttp.ReadyState.COMPLETE
};
goog.net.XhrIo.prototype.isSuccess = function() {
  switch(this.getStatus()) {
    case 0:
      return!this.isLastUriEffectiveSchemeHttp_();
    case goog.net.HttpStatus.OK:
    ;
    case goog.net.HttpStatus.NO_CONTENT:
    ;
    case goog.net.HttpStatus.NOT_MODIFIED:
      return true;
    default:
      return false
  }
};
goog.net.XhrIo.prototype.isLastUriEffectiveSchemeHttp_ = function() {
  var lastUriScheme = goog.isString(this.lastUri_) ? goog.uri.utils.getScheme(this.lastUri_) : this.lastUri_.getScheme();
  if(lastUriScheme) {
    return goog.net.XhrIo.HTTP_SCHEME_PATTERN.test(lastUriScheme)
  }
  if(self.location) {
    return goog.net.XhrIo.HTTP_SCHEME_PATTERN.test(self.location.protocol)
  }else {
    return true
  }
};
goog.net.XhrIo.prototype.getReadyState = function() {
  return this.xhr_ ? this.xhr_.readyState : goog.net.XmlHttp.ReadyState.UNINITIALIZED
};
goog.net.XhrIo.prototype.getStatus = function() {
  try {
    return this.getReadyState() > goog.net.XmlHttp.ReadyState.LOADED ? this.xhr_.status : -1
  }catch(e) {
    this.logger_.warning("Can not get status: " + e.message);
    return-1
  }
};
goog.net.XhrIo.prototype.getStatusText = function() {
  try {
    return this.getReadyState() > goog.net.XmlHttp.ReadyState.LOADED ? this.xhr_.statusText : ""
  }catch(e) {
    this.logger_.fine("Can not get status: " + e.message);
    return""
  }
};
goog.net.XhrIo.prototype.getLastUri = function() {
  return String(this.lastUri_)
};
goog.net.XhrIo.prototype.getResponseText = function() {
  try {
    return this.xhr_ ? this.xhr_.responseText : ""
  }catch(e) {
    this.logger_.fine("Can not get responseText: " + e.message);
    return""
  }
};
goog.net.XhrIo.prototype.getResponseXml = function() {
  try {
    return this.xhr_ ? this.xhr_.responseXML : null
  }catch(e) {
    this.logger_.fine("Can not get responseXML: " + e.message);
    return null
  }
};
goog.net.XhrIo.prototype.getResponseJson = function(opt_xssiPrefix) {
  if(!this.xhr_) {
    return undefined
  }
  var responseText = this.xhr_.responseText;
  if(opt_xssiPrefix && responseText.indexOf(opt_xssiPrefix) == 0) {
    responseText = responseText.substring(opt_xssiPrefix.length)
  }
  return goog.json.parse(responseText)
};
goog.net.XhrIo.prototype.getResponse = function() {
  try {
    return this.xhr_ && this.xhr_.response
  }catch(e) {
    this.logger_.fine("Can not get response: " + e.message);
    return null
  }
};
goog.net.XhrIo.prototype.getResponseHeader = function(key) {
  return this.xhr_ && this.isComplete() ? this.xhr_.getResponseHeader(key) : undefined
};
goog.net.XhrIo.prototype.getAllResponseHeaders = function() {
  return this.xhr_ && this.isComplete() ? this.xhr_.getAllResponseHeaders() : ""
};
goog.net.XhrIo.prototype.getLastErrorCode = function() {
  return this.lastErrorCode_
};
goog.net.XhrIo.prototype.getLastError = function() {
  return goog.isString(this.lastError_) ? this.lastError_ : String(this.lastError_)
};
goog.net.XhrIo.prototype.formatMsg_ = function(msg) {
  return msg + " [" + this.lastMethod_ + " " + this.lastUri_ + " " + this.getStatus() + "]"
};
goog.debug.entryPointRegistry.register(function(transformer) {
  goog.net.XhrIo.prototype.onReadyStateChangeEntryPoint_ = transformer(goog.net.XhrIo.prototype.onReadyStateChangeEntryPoint_)
});
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
goog.provide("goog.ui.editor.messages");
goog.ui.editor.messages.MSG_LINK_CAPTION = goog.getMsg("Link");
goog.ui.editor.messages.MSG_EDIT_LINK = goog.getMsg("Edit Link");
goog.ui.editor.messages.MSG_TEXT_TO_DISPLAY = goog.getMsg("Text to display:");
goog.ui.editor.messages.MSG_LINK_TO = goog.getMsg("Link to:");
goog.ui.editor.messages.MSG_ON_THE_WEB = goog.getMsg("Web address");
goog.ui.editor.messages.MSG_ON_THE_WEB_TIP = goog.getMsg("Link to a page or file somewhere else on the web");
goog.ui.editor.messages.MSG_TEST_THIS_LINK = goog.getMsg("Test this link");
goog.ui.editor.messages.MSG_TR_LINK_EXPLANATION = goog.getMsg("{$startBold}Not sure what to put in the box?{$endBold} " + "First, find the page on the web that you want to " + "link to. (A {$searchEngineLink}search engine{$endLink} " + "might be useful.) Then, copy the web address from " + "the box in your browser's address bar, and paste it into " + "the box above.", {"startBold":"<b>", "endBold":"</b>", "searchEngineLink":"<a href='http://www.google.com/' target='_new'>", "endLink":"</a>"});
goog.ui.editor.messages.MSG_WHAT_URL = goog.getMsg("To what URL should this link go?");
goog.ui.editor.messages.MSG_EMAIL_ADDRESS = goog.getMsg("Email address");
goog.ui.editor.messages.MSG_EMAIL_ADDRESS_TIP = goog.getMsg("Link to an email address");
goog.ui.editor.messages.MSG_INVALID_EMAIL = goog.getMsg("Invalid email address");
goog.ui.editor.messages.MSG_WHAT_EMAIL = goog.getMsg("To what email address should this link?");
goog.ui.editor.messages.MSG_EMAIL_EXPLANATION = goog.getMsg("{$preb}Be careful.{$postb} " + "Remember that any time you include an email address on a web page, " + "nasty spammers can find it too.", {"preb":"<b>", "postb":"</b>"});
goog.ui.editor.messages.MSG_IMAGE_CAPTION = goog.getMsg("Image");
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
goog.provide("goog.editor.defines");
goog.editor.defines.USE_CONTENTEDITABLE_IN_FIREFOX_3 = false;
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
goog.provide("goog.userAgent.product.isVersion");
goog.require("goog.userAgent.product");
goog.userAgent.product.determineVersion_ = function() {
  var version = "", re, combine;
  if(goog.userAgent.product.FIREFOX) {
    re = /Firefox\/([0-9.]+)/
  }else {
    if(goog.userAgent.product.IE || goog.userAgent.product.OPERA) {
      return goog.userAgent.VERSION
    }else {
      if(goog.userAgent.product.CHROME) {
        re = /Chrome\/([0-9.]+)/
      }else {
        if(goog.userAgent.product.SAFARI) {
          re = /Version\/([0-9.]+)/
        }else {
          if(goog.userAgent.product.IPHONE || goog.userAgent.product.IPAD) {
            re = /Version\/(\S+).*Mobile\/(\S+)/;
            combine = true
          }else {
            if(goog.userAgent.product.ANDROID) {
              re = /Android\s+([0-9.]+)(?:.*Version\/([0-9.]+))?/
            }else {
              if(goog.userAgent.product.CAMINO) {
                re = /Camino\/([0-9.]+)/
              }
            }
          }
        }
      }
    }
  }
  if(re) {
    var arr = re.exec(goog.userAgent.getUserAgentString());
    if(arr) {
      version = combine ? arr[1] + "." + arr[2] : arr[2] || arr[1]
    }else {
      version = ""
    }
  }
  return version
};
goog.userAgent.product.VERSION = goog.userAgent.product.determineVersion_();
goog.userAgent.product.isVersion = function(version) {
  return goog.string.compareVersions(goog.userAgent.product.VERSION, version) >= 0
};
goog.provide("goog.editor.BrowserFeature");
goog.require("goog.editor.defines");
goog.require("goog.userAgent");
goog.require("goog.userAgent.product");
goog.require("goog.userAgent.product.isVersion");
goog.editor.BrowserFeature = {HAS_IE_RANGES:goog.userAgent.IE && !goog.userAgent.isVersion("9"), HAS_W3C_RANGES:goog.userAgent.GECKO || goog.userAgent.WEBKIT || goog.userAgent.OPERA || goog.userAgent.IE && goog.userAgent.isVersion("9"), HAS_CONTENT_EDITABLE:goog.userAgent.IE || goog.userAgent.WEBKIT || goog.userAgent.OPERA || goog.editor.defines.USE_CONTENTEDITABLE_IN_FIREFOX_3 && goog.userAgent.GECKO && goog.userAgent.isVersion("1.9"), USE_MUTATION_EVENTS:goog.userAgent.GECKO, HAS_DOM_SUBTREE_MODIFIED_EVENT:goog.userAgent.WEBKIT || 
goog.editor.defines.USE_CONTENTEDITABLE_IN_FIREFOX_3 && goog.userAgent.GECKO && goog.userAgent.isVersion("1.9"), HAS_DOCUMENT_INDEPENDENT_NODES:goog.userAgent.GECKO, PUTS_CURSOR_BEFORE_FIRST_BLOCK_ELEMENT_ON_FOCUS:goog.userAgent.GECKO, CLEARS_SELECTION_WHEN_FOCUS_LEAVES:goog.userAgent.IE || goog.userAgent.WEBKIT || goog.userAgent.OPERA, HAS_UNSELECTABLE_STYLE:goog.userAgent.GECKO || goog.userAgent.WEBKIT, FORMAT_BLOCK_WORKS_FOR_BLOCKQUOTES:goog.userAgent.GECKO || goog.userAgent.WEBKIT || goog.userAgent.OPERA, 
CREATES_MULTIPLE_BLOCKQUOTES:goog.userAgent.WEBKIT || goog.userAgent.OPERA, WRAPS_BLOCKQUOTE_IN_DIVS:goog.userAgent.OPERA, PREFERS_READY_STATE_CHANGE_EVENT:goog.userAgent.IE, TAB_FIRES_KEYPRESS:!goog.userAgent.IE, NEEDS_99_WIDTH_IN_STANDARDS_MODE:goog.userAgent.IE, USE_DOCUMENT_FOR_KEY_EVENTS:goog.userAgent.GECKO && !goog.editor.defines.USE_CONTENTEDITABLE_IN_FIREFOX_3, SHOWS_CUSTOM_ATTRS_IN_INNER_HTML:goog.userAgent.IE, COLLAPSES_EMPTY_NODES:goog.userAgent.GECKO || goog.userAgent.WEBKIT || goog.userAgent.OPERA, 
CONVERT_TO_B_AND_I_TAGS:goog.userAgent.GECKO || goog.userAgent.OPERA, TABS_THROUGH_IMAGES:goog.userAgent.IE, UNESCAPES_URLS_WITHOUT_ASKING:goog.userAgent.IE && !goog.userAgent.isVersion("7.0"), HAS_STYLE_WITH_CSS:goog.userAgent.GECKO && goog.userAgent.isVersion("1.8") || goog.userAgent.WEBKIT || goog.userAgent.OPERA, FOLLOWS_EDITABLE_LINKS:goog.userAgent.WEBKIT, HAS_ACTIVE_ELEMENT:goog.userAgent.IE || goog.userAgent.OPERA || goog.userAgent.GECKO && goog.userAgent.isVersion("1.9"), HAS_SET_CAPTURE:goog.userAgent.IE, 
EATS_EMPTY_BACKGROUND_COLOR:goog.userAgent.GECKO || goog.userAgent.WEBKIT, SUPPORTS_FOCUSIN:goog.userAgent.IE || goog.userAgent.OPERA, SELECTS_IMAGES_ON_CLICK:goog.userAgent.IE || goog.userAgent.OPERA, MOVES_STYLE_TO_HEAD:goog.userAgent.WEBKIT, COLLAPSES_SELECTION_ONMOUSEDOWN:false, CARET_INSIDE_SELECTION:goog.userAgent.OPERA, FOCUSES_EDITABLE_BODY_ON_HTML_CLICK:true, USES_KEYDOWN:goog.userAgent.IE || goog.userAgent.WEBKIT && goog.userAgent.isVersion("525"), ADDS_NBSPS_IN_REMOVE_FORMAT:goog.userAgent.WEBKIT && 
!goog.userAgent.isVersion("531"), GETS_STUCK_IN_LINKS:goog.userAgent.WEBKIT && !goog.userAgent.isVersion("528"), NORMALIZE_CORRUPTS_EMPTY_TEXT_NODES:goog.userAgent.GECKO && goog.userAgent.isVersion("1.9") || goog.userAgent.IE || goog.userAgent.OPERA || goog.userAgent.WEBKIT && goog.userAgent.isVersion("531"), NORMALIZE_CORRUPTS_ALL_TEXT_NODES:goog.userAgent.IE, NESTS_SUBSCRIPT_SUPERSCRIPT:goog.userAgent.IE || goog.userAgent.GECKO || goog.userAgent.OPERA, CAN_SELECT_EMPTY_ELEMENT:!goog.userAgent.IE && 
!goog.userAgent.WEBKIT, FORGETS_FORMATTING_WHEN_LISTIFYING:goog.userAgent.GECKO || goog.userAgent.WEBKIT && !goog.userAgent.isVersion("526"), LEAVES_P_WHEN_REMOVING_LISTS:goog.userAgent.IE || goog.userAgent.OPERA, CAN_LISTIFY_BR:!goog.userAgent.IE && !goog.userAgent.OPERA, DOESNT_OVERRIDE_FONT_SIZE_IN_STYLE_ATTR:!goog.userAgent.WEBKIT, SUPPORTS_HTML5_FILE_DRAGGING:goog.userAgent.product.CHROME && goog.userAgent.product.isVersion("4") || goog.userAgent.product.SAFARI && goog.userAgent.isVersion("533")};
goog.provide("goog.Uri");
goog.provide("goog.Uri.QueryData");
goog.require("goog.array");
goog.require("goog.string");
goog.require("goog.structs");
goog.require("goog.structs.Map");
goog.require("goog.uri.utils");
goog.require("goog.uri.utils.ComponentIndex");
goog.Uri = function(opt_uri, opt_ignoreCase) {
  var m;
  if(opt_uri instanceof goog.Uri) {
    this.setIgnoreCase(opt_ignoreCase == null ? opt_uri.getIgnoreCase() : opt_ignoreCase);
    this.setScheme(opt_uri.getScheme());
    this.setUserInfo(opt_uri.getUserInfo());
    this.setDomain(opt_uri.getDomain());
    this.setPort(opt_uri.getPort());
    this.setPath(opt_uri.getPath());
    this.setQueryData(opt_uri.getQueryData().clone());
    this.setFragment(opt_uri.getFragment())
  }else {
    if(opt_uri && (m = goog.uri.utils.split(String(opt_uri)))) {
      this.setIgnoreCase(!!opt_ignoreCase);
      this.setScheme(m[goog.uri.utils.ComponentIndex.SCHEME] || "", true);
      this.setUserInfo(m[goog.uri.utils.ComponentIndex.USER_INFO] || "", true);
      this.setDomain(m[goog.uri.utils.ComponentIndex.DOMAIN] || "", true);
      this.setPort(m[goog.uri.utils.ComponentIndex.PORT]);
      this.setPath(m[goog.uri.utils.ComponentIndex.PATH] || "", true);
      this.setQuery(m[goog.uri.utils.ComponentIndex.QUERY_DATA] || "", true);
      this.setFragment(m[goog.uri.utils.ComponentIndex.FRAGMENT] || "", true)
    }else {
      this.setIgnoreCase(!!opt_ignoreCase);
      this.queryData_ = new goog.Uri.QueryData(null, this, this.ignoreCase_)
    }
  }
};
goog.Uri.RANDOM_PARAM = goog.uri.utils.StandardQueryParam.RANDOM;
goog.Uri.prototype.scheme_ = "";
goog.Uri.prototype.userInfo_ = "";
goog.Uri.prototype.domain_ = "";
goog.Uri.prototype.port_ = null;
goog.Uri.prototype.path_ = "";
goog.Uri.prototype.queryData_;
goog.Uri.prototype.fragment_ = "";
goog.Uri.prototype.isReadOnly_ = false;
goog.Uri.prototype.ignoreCase_ = false;
goog.Uri.prototype.toString = function() {
  if(this.cachedToString_) {
    return this.cachedToString_
  }
  var out = [];
  if(this.scheme_) {
    out.push(goog.Uri.encodeSpecialChars_(this.scheme_, goog.Uri.reDisallowedInSchemeOrUserInfo_), ":")
  }
  if(this.domain_) {
    out.push("//");
    if(this.userInfo_) {
      out.push(goog.Uri.encodeSpecialChars_(this.userInfo_, goog.Uri.reDisallowedInSchemeOrUserInfo_), "@")
    }
    out.push(goog.Uri.encodeString_(this.domain_));
    if(this.port_ != null) {
      out.push(":", String(this.getPort()))
    }
  }
  if(this.path_) {
    if(this.hasDomain() && this.path_.charAt(0) != "/") {
      out.push("/")
    }
    out.push(goog.Uri.encodeSpecialChars_(this.path_, goog.Uri.reDisallowedInPath_))
  }
  var query = String(this.queryData_);
  if(query) {
    out.push("?", query)
  }
  if(this.fragment_) {
    out.push("#", goog.Uri.encodeSpecialChars_(this.fragment_, goog.Uri.reDisallowedInFragment_))
  }
  return this.cachedToString_ = out.join("")
};
goog.Uri.prototype.resolve = function(relativeUri) {
  var absoluteUri = this.clone();
  var overridden = relativeUri.hasScheme();
  if(overridden) {
    absoluteUri.setScheme(relativeUri.getScheme())
  }else {
    overridden = relativeUri.hasUserInfo()
  }
  if(overridden) {
    absoluteUri.setUserInfo(relativeUri.getUserInfo())
  }else {
    overridden = relativeUri.hasDomain()
  }
  if(overridden) {
    absoluteUri.setDomain(relativeUri.getDomain())
  }else {
    overridden = relativeUri.hasPort()
  }
  var path = relativeUri.getPath();
  if(overridden) {
    absoluteUri.setPort(relativeUri.getPort())
  }else {
    overridden = relativeUri.hasPath();
    if(overridden) {
      if(path.charAt(0) != "/") {
        if(this.hasDomain() && !this.hasPath()) {
          path = "/" + path
        }else {
          var lastSlashIndex = absoluteUri.getPath().lastIndexOf("/");
          if(lastSlashIndex != -1) {
            path = absoluteUri.getPath().substr(0, lastSlashIndex + 1) + path
          }
        }
      }
      path = goog.Uri.removeDotSegments(path)
    }
  }
  if(overridden) {
    absoluteUri.setPath(path)
  }else {
    overridden = relativeUri.hasQuery()
  }
  if(overridden) {
    absoluteUri.setQuery(relativeUri.getDecodedQuery())
  }else {
    overridden = relativeUri.hasFragment()
  }
  if(overridden) {
    absoluteUri.setFragment(relativeUri.getFragment())
  }
  return absoluteUri
};
goog.Uri.prototype.clone = function() {
  return goog.Uri.create(this.scheme_, this.userInfo_, this.domain_, this.port_, this.path_, this.queryData_.clone(), this.fragment_, this.ignoreCase_)
};
goog.Uri.prototype.getScheme = function() {
  return this.scheme_
};
goog.Uri.prototype.setScheme = function(newScheme, opt_decode) {
  this.enforceReadOnly();
  delete this.cachedToString_;
  this.scheme_ = opt_decode ? goog.Uri.decodeOrEmpty_(newScheme) : newScheme;
  if(this.scheme_) {
    this.scheme_ = this.scheme_.replace(/:$/, "")
  }
  return this
};
goog.Uri.prototype.hasScheme = function() {
  return!!this.scheme_
};
goog.Uri.prototype.getUserInfo = function() {
  return this.userInfo_
};
goog.Uri.prototype.setUserInfo = function(newUserInfo, opt_decode) {
  this.enforceReadOnly();
  delete this.cachedToString_;
  this.userInfo_ = opt_decode ? goog.Uri.decodeOrEmpty_(newUserInfo) : newUserInfo;
  return this
};
goog.Uri.prototype.hasUserInfo = function() {
  return!!this.userInfo_
};
goog.Uri.prototype.getDomain = function() {
  return this.domain_
};
goog.Uri.prototype.setDomain = function(newDomain, opt_decode) {
  this.enforceReadOnly();
  delete this.cachedToString_;
  this.domain_ = opt_decode ? goog.Uri.decodeOrEmpty_(newDomain) : newDomain;
  return this
};
goog.Uri.prototype.hasDomain = function() {
  return!!this.domain_
};
goog.Uri.prototype.getPort = function() {
  return this.port_
};
goog.Uri.prototype.setPort = function(newPort) {
  this.enforceReadOnly();
  delete this.cachedToString_;
  if(newPort) {
    newPort = Number(newPort);
    if(isNaN(newPort) || newPort < 0) {
      throw Error("Bad port number " + newPort);
    }
    this.port_ = newPort
  }else {
    this.port_ = null
  }
  return this
};
goog.Uri.prototype.hasPort = function() {
  return this.port_ != null
};
goog.Uri.prototype.getPath = function() {
  return this.path_
};
goog.Uri.prototype.setPath = function(newPath, opt_decode) {
  this.enforceReadOnly();
  delete this.cachedToString_;
  this.path_ = opt_decode ? goog.Uri.decodeOrEmpty_(newPath) : newPath;
  return this
};
goog.Uri.prototype.hasPath = function() {
  return!!this.path_
};
goog.Uri.prototype.hasQuery = function() {
  return this.queryData_.toString() !== ""
};
goog.Uri.prototype.setQueryData = function(queryData, opt_decode) {
  this.enforceReadOnly();
  delete this.cachedToString_;
  if(queryData instanceof goog.Uri.QueryData) {
    this.queryData_ = queryData;
    this.queryData_.uri_ = this;
    this.queryData_.setIgnoreCase(this.ignoreCase_)
  }else {
    if(!opt_decode) {
      queryData = goog.Uri.encodeSpecialChars_(queryData, goog.Uri.reDisallowedInQuery_)
    }
    this.queryData_ = new goog.Uri.QueryData(queryData, this, this.ignoreCase_)
  }
  return this
};
goog.Uri.prototype.setQuery = function(newQuery, opt_decode) {
  return this.setQueryData(newQuery, opt_decode)
};
goog.Uri.prototype.getEncodedQuery = function() {
  return this.queryData_.toString()
};
goog.Uri.prototype.getDecodedQuery = function() {
  return this.queryData_.toDecodedString()
};
goog.Uri.prototype.getQueryData = function() {
  return this.queryData_
};
goog.Uri.prototype.getQuery = function() {
  return this.getEncodedQuery()
};
goog.Uri.prototype.setParameterValue = function(key, value) {
  this.enforceReadOnly();
  delete this.cachedToString_;
  this.queryData_.set(key, value);
  return this
};
goog.Uri.prototype.setParameterValues = function(key, values) {
  this.enforceReadOnly();
  delete this.cachedToString_;
  if(!goog.isArray(values)) {
    values = [String(values)]
  }
  this.queryData_.setValues(key, values);
  return this
};
goog.Uri.prototype.getParameterValues = function(name) {
  return this.queryData_.getValues(name)
};
goog.Uri.prototype.getParameterValue = function(paramName) {
  return this.queryData_.get(paramName)
};
goog.Uri.prototype.getFragment = function() {
  return this.fragment_
};
goog.Uri.prototype.setFragment = function(newFragment, opt_decode) {
  this.enforceReadOnly();
  delete this.cachedToString_;
  this.fragment_ = opt_decode ? goog.Uri.decodeOrEmpty_(newFragment) : newFragment;
  return this
};
goog.Uri.prototype.hasFragment = function() {
  return!!this.fragment_
};
goog.Uri.prototype.hasSameDomainAs = function(uri2) {
  return(!this.hasDomain() && !uri2.hasDomain() || this.getDomain() == uri2.getDomain()) && (!this.hasPort() && !uri2.hasPort() || this.getPort() == uri2.getPort())
};
goog.Uri.prototype.makeUnique = function() {
  this.enforceReadOnly();
  this.setParameterValue(goog.Uri.RANDOM_PARAM, goog.string.getRandomString());
  return this
};
goog.Uri.prototype.removeParameter = function(key) {
  this.enforceReadOnly();
  this.queryData_.remove(key);
  return this
};
goog.Uri.prototype.setReadOnly = function(isReadOnly) {
  this.isReadOnly_ = isReadOnly;
  return this
};
goog.Uri.prototype.isReadOnly = function() {
  return this.isReadOnly_
};
goog.Uri.prototype.enforceReadOnly = function() {
  if(this.isReadOnly_) {
    throw Error("Tried to modify a read-only Uri");
  }
};
goog.Uri.prototype.setIgnoreCase = function(ignoreCase) {
  this.ignoreCase_ = ignoreCase;
  if(this.queryData_) {
    this.queryData_.setIgnoreCase(ignoreCase)
  }
  return this
};
goog.Uri.prototype.getIgnoreCase = function() {
  return this.ignoreCase_
};
goog.Uri.parse = function(uri, opt_ignoreCase) {
  return uri instanceof goog.Uri ? uri.clone() : new goog.Uri(uri, opt_ignoreCase)
};
goog.Uri.create = function(opt_scheme, opt_userInfo, opt_domain, opt_port, opt_path, opt_query, opt_fragment, opt_ignoreCase) {
  var uri = new goog.Uri(null, opt_ignoreCase);
  opt_scheme && uri.setScheme(opt_scheme);
  opt_userInfo && uri.setUserInfo(opt_userInfo);
  opt_domain && uri.setDomain(opt_domain);
  opt_port && uri.setPort(opt_port);
  opt_path && uri.setPath(opt_path);
  opt_query && uri.setQueryData(opt_query);
  opt_fragment && uri.setFragment(opt_fragment);
  return uri
};
goog.Uri.resolve = function(base, rel) {
  if(!(base instanceof goog.Uri)) {
    base = goog.Uri.parse(base)
  }
  if(!(rel instanceof goog.Uri)) {
    rel = goog.Uri.parse(rel)
  }
  return base.resolve(rel)
};
goog.Uri.removeDotSegments = function(path) {
  if(path == ".." || path == ".") {
    return""
  }else {
    if(!goog.string.contains(path, "./") && !goog.string.contains(path, "/.")) {
      return path
    }else {
      var leadingSlash = goog.string.startsWith(path, "/");
      var segments = path.split("/");
      var out = [];
      for(var pos = 0;pos < segments.length;) {
        var segment = segments[pos++];
        if(segment == ".") {
          if(leadingSlash && pos == segments.length) {
            out.push("")
          }
        }else {
          if(segment == "..") {
            if(out.length > 1 || out.length == 1 && out[0] != "") {
              out.pop()
            }
            if(leadingSlash && pos == segments.length) {
              out.push("")
            }
          }else {
            out.push(segment);
            leadingSlash = true
          }
        }
      }
      return out.join("/")
    }
  }
};
goog.Uri.decodeOrEmpty_ = function(val) {
  return val ? decodeURIComponent(val) : ""
};
goog.Uri.encodeString_ = function(unescapedPart) {
  if(goog.isString(unescapedPart)) {
    return encodeURIComponent(unescapedPart)
  }
  return null
};
goog.Uri.encodeSpecialRegExp_ = /^[a-zA-Z0-9\-_.!~*'():\/;?]*$/;
goog.Uri.encodeSpecialChars_ = function(unescapedPart, extra) {
  var ret = null;
  if(goog.isString(unescapedPart)) {
    ret = unescapedPart;
    if(!goog.Uri.encodeSpecialRegExp_.test(ret)) {
      ret = encodeURI(unescapedPart)
    }
    if(ret.search(extra) >= 0) {
      ret = ret.replace(extra, goog.Uri.encodeChar_)
    }
  }
  return ret
};
goog.Uri.encodeChar_ = function(ch) {
  var n = ch.charCodeAt(0);
  return"%" + (n >> 4 & 15).toString(16) + (n & 15).toString(16)
};
goog.Uri.reDisallowedInSchemeOrUserInfo_ = /[#\/\?@]/g;
goog.Uri.reDisallowedInPath_ = /[\#\?]/g;
goog.Uri.reDisallowedInQuery_ = /[\#\?@]/g;
goog.Uri.reDisallowedInFragment_ = /#/g;
goog.Uri.haveSameDomain = function(uri1String, uri2String) {
  var pieces1 = goog.uri.utils.split(uri1String);
  var pieces2 = goog.uri.utils.split(uri2String);
  return pieces1[goog.uri.utils.ComponentIndex.DOMAIN] == pieces2[goog.uri.utils.ComponentIndex.DOMAIN] && pieces1[goog.uri.utils.ComponentIndex.PORT] == pieces2[goog.uri.utils.ComponentIndex.PORT]
};
goog.Uri.QueryData = function(opt_query, opt_uri, opt_ignoreCase) {
  this.encodedQuery_ = opt_query || null;
  this.uri_ = opt_uri || null;
  this.ignoreCase_ = !!opt_ignoreCase
};
goog.Uri.QueryData.prototype.ensureKeyMapInitialized_ = function() {
  if(!this.keyMap_) {
    this.keyMap_ = new goog.structs.Map;
    if(this.encodedQuery_) {
      var pairs = this.encodedQuery_.split("&");
      for(var i = 0;i < pairs.length;i++) {
        var indexOfEquals = pairs[i].indexOf("=");
        var name = null;
        var value = null;
        if(indexOfEquals >= 0) {
          name = pairs[i].substring(0, indexOfEquals);
          value = pairs[i].substring(indexOfEquals + 1)
        }else {
          name = pairs[i]
        }
        name = goog.string.urlDecode(name);
        name = this.getKeyName_(name);
        this.add(name, value ? goog.string.urlDecode(value) : "")
      }
    }
  }
};
goog.Uri.QueryData.createFromMap = function(map, opt_uri, opt_ignoreCase) {
  var keys = goog.structs.getKeys(map);
  if(typeof keys == "undefined") {
    throw Error("Keys are undefined");
  }
  return goog.Uri.QueryData.createFromKeysValues(keys, goog.structs.getValues(map), opt_uri, opt_ignoreCase)
};
goog.Uri.QueryData.createFromKeysValues = function(keys, values, opt_uri, opt_ignoreCase) {
  if(keys.length != values.length) {
    throw Error("Mismatched lengths for keys/values");
  }
  var queryData = new goog.Uri.QueryData(null, opt_uri, opt_ignoreCase);
  for(var i = 0;i < keys.length;i++) {
    queryData.add(keys[i], values[i])
  }
  return queryData
};
goog.Uri.QueryData.prototype.keyMap_ = null;
goog.Uri.QueryData.prototype.count_ = null;
goog.Uri.QueryData.decodedQuery_ = null;
goog.Uri.QueryData.prototype.getCount = function() {
  this.ensureKeyMapInitialized_();
  return this.count_
};
goog.Uri.QueryData.prototype.add = function(key, value) {
  this.ensureKeyMapInitialized_();
  this.invalidateCache_();
  key = this.getKeyName_(key);
  if(!this.containsKey(key)) {
    this.keyMap_.set(key, value)
  }else {
    var current = this.keyMap_.get(key);
    if(goog.isArray(current)) {
      current.push(value)
    }else {
      this.keyMap_.set(key, [current, value])
    }
  }
  this.count_++;
  return this
};
goog.Uri.QueryData.prototype.remove = function(key) {
  this.ensureKeyMapInitialized_();
  key = this.getKeyName_(key);
  if(this.keyMap_.containsKey(key)) {
    this.invalidateCache_();
    var old = this.keyMap_.get(key);
    if(goog.isArray(old)) {
      this.count_ -= old.length
    }else {
      this.count_--
    }
    return this.keyMap_.remove(key)
  }
  return false
};
goog.Uri.QueryData.prototype.clear = function() {
  this.invalidateCache_();
  if(this.keyMap_) {
    this.keyMap_.clear()
  }
  this.count_ = 0
};
goog.Uri.QueryData.prototype.isEmpty = function() {
  this.ensureKeyMapInitialized_();
  return this.count_ == 0
};
goog.Uri.QueryData.prototype.containsKey = function(key) {
  this.ensureKeyMapInitialized_();
  key = this.getKeyName_(key);
  return this.keyMap_.containsKey(key)
};
goog.Uri.QueryData.prototype.containsValue = function(value) {
  var vals = this.getValues();
  return goog.array.contains(vals, value)
};
goog.Uri.QueryData.prototype.getKeys = function() {
  this.ensureKeyMapInitialized_();
  var vals = this.keyMap_.getValues();
  var keys = this.keyMap_.getKeys();
  var rv = [];
  for(var i = 0;i < keys.length;i++) {
    var val = vals[i];
    if(goog.isArray(val)) {
      for(var j = 0;j < val.length;j++) {
        rv.push(keys[i])
      }
    }else {
      rv.push(keys[i])
    }
  }
  return rv
};
goog.Uri.QueryData.prototype.getValues = function(opt_key) {
  this.ensureKeyMapInitialized_();
  var rv;
  if(opt_key) {
    var key = this.getKeyName_(opt_key);
    if(this.containsKey(key)) {
      var value = this.keyMap_.get(key);
      if(goog.isArray(value)) {
        return value
      }else {
        rv = [];
        rv.push(value)
      }
    }else {
      rv = []
    }
  }else {
    var vals = this.keyMap_.getValues();
    rv = [];
    for(var i = 0;i < vals.length;i++) {
      var val = vals[i];
      if(goog.isArray(val)) {
        goog.array.extend(rv, val)
      }else {
        rv.push(val)
      }
    }
  }
  return rv
};
goog.Uri.QueryData.prototype.set = function(key, value) {
  this.ensureKeyMapInitialized_();
  this.invalidateCache_();
  key = this.getKeyName_(key);
  if(this.containsKey(key)) {
    var old = this.keyMap_.get(key);
    if(goog.isArray(old)) {
      this.count_ -= old.length
    }else {
      this.count_--
    }
  }
  this.keyMap_.set(key, value);
  this.count_++;
  return this
};
goog.Uri.QueryData.prototype.get = function(key, opt_default) {
  this.ensureKeyMapInitialized_();
  key = this.getKeyName_(key);
  if(this.containsKey(key)) {
    var val = this.keyMap_.get(key);
    if(goog.isArray(val)) {
      return val[0]
    }else {
      return val
    }
  }else {
    return opt_default
  }
};
goog.Uri.QueryData.prototype.setValues = function(key, values) {
  this.ensureKeyMapInitialized_();
  this.invalidateCache_();
  key = this.getKeyName_(key);
  if(this.containsKey(key)) {
    var old = this.keyMap_.get(key);
    if(goog.isArray(old)) {
      this.count_ -= old.length
    }else {
      this.count_--
    }
  }
  if(values.length > 0) {
    this.keyMap_.set(key, values);
    this.count_ += values.length
  }
};
goog.Uri.QueryData.prototype.toString = function() {
  if(this.encodedQuery_) {
    return this.encodedQuery_
  }
  if(!this.keyMap_) {
    return""
  }
  var sb = [];
  var count = 0;
  var keys = this.keyMap_.getKeys();
  for(var i = 0;i < keys.length;i++) {
    var key = keys[i];
    var encodedKey = goog.string.urlEncode(key);
    var val = this.keyMap_.get(key);
    if(goog.isArray(val)) {
      for(var j = 0;j < val.length;j++) {
        if(count > 0) {
          sb.push("&")
        }
        sb.push(encodedKey);
        if(val[j] !== "") {
          sb.push("=", goog.string.urlEncode(val[j]))
        }
        count++
      }
    }else {
      if(count > 0) {
        sb.push("&")
      }
      sb.push(encodedKey);
      if(val !== "") {
        sb.push("=", goog.string.urlEncode(val))
      }
      count++
    }
  }
  return this.encodedQuery_ = sb.join("")
};
goog.Uri.QueryData.prototype.toDecodedString = function() {
  if(!this.decodedQuery_) {
    this.decodedQuery_ = goog.Uri.decodeOrEmpty_(this.toString())
  }
  return this.decodedQuery_
};
goog.Uri.QueryData.prototype.invalidateCache_ = function() {
  delete this.decodedQuery_;
  delete this.encodedQuery_;
  if(this.uri_) {
    delete this.uri_.cachedToString_
  }
};
goog.Uri.QueryData.prototype.filterKeys = function(keys) {
  this.ensureKeyMapInitialized_();
  goog.structs.forEach(this.keyMap_, function(value, key, map) {
    if(!goog.array.contains(keys, key)) {
      this.remove(key)
    }
  }, this);
  return this
};
goog.Uri.QueryData.prototype.clone = function() {
  var rv = new goog.Uri.QueryData;
  if(this.decodedQuery_) {
    rv.decodedQuery_ = this.decodedQuery_
  }
  if(this.encodedQuery_) {
    rv.encodedQuery_ = this.encodedQuery_
  }
  if(this.keyMap_) {
    rv.keyMap_ = this.keyMap_.clone()
  }
  return rv
};
goog.Uri.QueryData.prototype.getKeyName_ = function(arg) {
  var keyName = String(arg);
  if(this.ignoreCase_) {
    keyName = keyName.toLowerCase()
  }
  return keyName
};
goog.Uri.QueryData.prototype.setIgnoreCase = function(ignoreCase) {
  var resetKeys = ignoreCase && !this.ignoreCase_;
  if(resetKeys) {
    this.ensureKeyMapInitialized_();
    this.invalidateCache_();
    goog.structs.forEach(this.keyMap_, function(value, key, map) {
      var lowerCase = key.toLowerCase();
      if(key != lowerCase) {
        this.remove(key);
        this.add(lowerCase, value)
      }
    }, this)
  }
  this.ignoreCase_ = ignoreCase
};
goog.Uri.QueryData.prototype.extend = function(var_args) {
  for(var i = 0;i < arguments.length;i++) {
    var data = arguments[i];
    goog.structs.forEach(data, function(value, key) {
      this.add(key, value)
    }, this)
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
  if(this.range_.htmlText) {
    var startNode = this.getStartNode();
    var endNode = this.getEndNode();
    var oldText = this.range_.text;
    var clone = this.range_.duplicate();
    clone.moveStart("character", 1);
    clone.moveStart("character", -1);
    if(clone.text != oldText) {
      var iter = new goog.dom.NodeIterator(startNode, false, true);
      var toDelete = [];
      goog.iter.forEach(iter, function(node) {
        if(node.nodeType != goog.dom.NodeType.TEXT && this.containsNode(node)) {
          toDelete.push(node);
          iter.skipTag()
        }
        if(node == endNode) {
          throw goog.iter.StopIteration;
        }
      });
      this.collapse(true);
      goog.array.forEach(toDelete, goog.dom.removeNode);
      this.clearCachedValues_();
      return
    }
    this.range_ = clone;
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
goog.provide("goog.cssom");
goog.provide("goog.cssom.CssRuleType");
goog.require("goog.array");
goog.require("goog.dom");
goog.cssom.CssRuleType = {STYLE:1, IMPORT:3, MEDIA:4, FONT_FACE:5, PAGE:6, NAMESPACE:7};
goog.cssom.getAllCssText = function(opt_styleSheet) {
  var styleSheet = opt_styleSheet || document.styleSheets;
  return goog.cssom.getAllCss_(styleSheet, true)
};
goog.cssom.getAllCssStyleRules = function(opt_styleSheet) {
  var styleSheet = opt_styleSheet || document.styleSheets;
  return goog.cssom.getAllCss_(styleSheet, false)
};
goog.cssom.getCssRulesFromStyleSheet = function(styleSheet) {
  var cssRuleList = null;
  try {
    cssRuleList = styleSheet.rules || styleSheet.cssRules
  }catch(e) {
    if(e.code == 15) {
      e.styleSheet = styleSheet;
      throw e;
    }
  }
  return cssRuleList
};
goog.cssom.getAllCssStyleSheets = function(opt_styleSheet, opt_includeDisabled) {
  var styleSheetsOutput = [];
  var styleSheet = opt_styleSheet || document.styleSheets;
  var includeDisabled = goog.isDef(opt_includeDisabled) ? opt_includeDisabled : false;
  if(styleSheet.imports && styleSheet.imports.length) {
    for(var i = 0, n = styleSheet.imports.length;i < n;i++) {
      goog.array.extend(styleSheetsOutput, goog.cssom.getAllCssStyleSheets(styleSheet.imports[i]))
    }
  }else {
    if(styleSheet.length) {
      for(var i = 0, n = styleSheet.length;i < n;i++) {
        goog.array.extend(styleSheetsOutput, goog.cssom.getAllCssStyleSheets(styleSheet[i]))
      }
    }else {
      var cssRuleList = goog.cssom.getCssRulesFromStyleSheet(styleSheet);
      if(cssRuleList && cssRuleList.length) {
        for(var i = 0, n = cssRuleList.length, cssRule;i < n;i++) {
          cssRule = cssRuleList[i];
          if(cssRule.styleSheet) {
            goog.array.extend(styleSheetsOutput, goog.cssom.getAllCssStyleSheets(cssRule.styleSheet))
          }
        }
      }
    }
  }
  if((styleSheet.type || styleSheet.rules || styleSheet.cssRules) && (!styleSheet.disabled || includeDisabled)) {
    styleSheetsOutput.push(styleSheet)
  }
  return styleSheetsOutput
};
goog.cssom.getCssTextFromCssRule = function(cssRule) {
  var cssText = "";
  if(cssRule.cssText) {
    cssText = cssRule.cssText
  }else {
    if(cssRule.style && cssRule.style.cssText && cssRule.selectorText) {
      var styleCssText = cssRule.style.cssText.replace(/\s*-closure-parent-stylesheet:\s*\[object\];?\s*/gi, "").replace(/\s*-closure-rule-index:\s*[\d]+;?\s*/gi, "");
      var thisCssText = cssRule.selectorText + " { " + styleCssText + " }";
      cssText = thisCssText
    }
  }
  return cssText
};
goog.cssom.getCssRuleIndexInParentStyleSheet = function(cssRule, opt_parentStyleSheet) {
  if(cssRule.style && cssRule.style["-closure-rule-index"]) {
    return cssRule.style["-closure-rule-index"]
  }
  var parentStyleSheet = opt_parentStyleSheet || goog.cssom.getParentStyleSheet(cssRule);
  if(!parentStyleSheet) {
    throw Error("Cannot find a parentStyleSheet.");
  }
  var cssRuleList = goog.cssom.getCssRulesFromStyleSheet(parentStyleSheet);
  if(cssRuleList && cssRuleList.length) {
    for(var i = 0, n = cssRuleList.length, thisCssRule;i < n;i++) {
      thisCssRule = cssRuleList[i];
      if(thisCssRule == cssRule) {
        return i
      }
    }
  }
  return-1
};
goog.cssom.getParentStyleSheet = function(cssRule) {
  return cssRule.parentStyleSheet || cssRule.style["-closure-parent-stylesheet"]
};
goog.cssom.replaceCssRule = function(cssRule, cssText, opt_parentStyleSheet, opt_index) {
  var parentStyleSheet = opt_parentStyleSheet || goog.cssom.getParentStyleSheet(cssRule);
  if(parentStyleSheet) {
    var index = opt_index >= 0 ? opt_index : goog.cssom.getCssRuleIndexInParentStyleSheet(cssRule, parentStyleSheet);
    if(index) {
      goog.cssom.removeCssRule(parentStyleSheet, index);
      goog.cssom.addCssRule(parentStyleSheet, cssText, index)
    }else {
      throw Error("Cannot proceed without the index of the cssRule.");
    }
  }else {
    throw Error("Cannot proceed without the parentStyleSheet.");
  }
};
goog.cssom.addCssRule = function(cssStyleSheet, cssText, opt_index) {
  var index = opt_index;
  if(index < 0 || index == undefined) {
    var rules = cssStyleSheet.rules || cssStyleSheet.cssRules;
    index = rules.length
  }
  if(cssStyleSheet.insertRule) {
    cssStyleSheet.insertRule(cssText, index)
  }else {
    var matches = /^([^\{]+)\{([^\{]+)\}/.exec(cssText);
    if(matches.length == 3) {
      var selector = matches[1];
      var style = matches[2];
      cssStyleSheet.addRule(selector, style, index)
    }else {
      throw Error("Your CSSRule appears to be ill-formatted.");
    }
  }
};
goog.cssom.removeCssRule = function(cssStyleSheet, index) {
  if(cssStyleSheet.deleteRule) {
    cssStyleSheet.deleteRule(index)
  }else {
    cssStyleSheet.removeRule(index)
  }
};
goog.cssom.addCssText = function(cssText, opt_domHelper) {
  var document = opt_domHelper ? opt_domHelper.getDocument() : goog.dom.getDocument();
  var cssNode = document.createElement("style");
  cssNode.type = "text/css";
  var head = document.getElementsByTagName("head")[0];
  head.appendChild(cssNode);
  if(cssNode.styleSheet) {
    cssNode.styleSheet.cssText = cssText
  }else {
    cssText = document.createTextNode(cssText);
    cssNode.appendChild(cssText)
  }
  return cssNode
};
goog.cssom.getFileNameFromStyleSheet = function(styleSheet) {
  var href = styleSheet.href;
  if(!href) {
    return null
  }
  var matches = /([^\/\?]+)[^\/]*$/.exec(href);
  var filename = matches[1];
  return filename
};
goog.cssom.getAllCss_ = function(styleSheet, isTextOutput) {
  var cssOut = [];
  var styleSheets = goog.cssom.getAllCssStyleSheets(styleSheet);
  for(var i = 0;styleSheet = styleSheets[i];i++) {
    var cssRuleList = goog.cssom.getCssRulesFromStyleSheet(styleSheet);
    if(cssRuleList && cssRuleList.length) {
      if(!isTextOutput) {
        var ruleIndex = 0
      }
      for(var j = 0, n = cssRuleList.length, cssRule;j < n;j++) {
        cssRule = cssRuleList[j];
        if(isTextOutput && !cssRule.href) {
          var res = goog.cssom.getCssTextFromCssRule(cssRule);
          cssOut.push(res)
        }else {
          if(!cssRule.href) {
            if(cssRule.style) {
              if(!cssRule.parentStyleSheet) {
                cssRule.style["-closure-parent-stylesheet"] = styleSheet
              }
              cssRule.style["-closure-rule-index"] = ruleIndex
            }
            cssOut.push(cssRule)
          }
        }
        if(!isTextOutput) {
          ruleIndex++
        }
      }
    }
  }
  return isTextOutput ? cssOut.join(" ") : cssOut
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
  if(goog.userAgent.IE && !goog.userAgent.isVersion(9) && !goog.dom.getDomHelper(doc).isCss1CompatMode()) {
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
    if(!skipStatic && (parent.scrollWidth > parent.clientWidth || parent.scrollHeight > parent.clientHeight || positionStyle == "fixed" || positionStyle == "absolute")) {
      return parent
    }
  }
  return null
};
goog.style.getVisibleRectForElement = function(element) {
  var visibleRect = new goog.math.Box(0, Infinity, Infinity, 0);
  var dom = goog.dom.getDomHelper(element);
  var body = dom.getDocument().body;
  var scrollEl = dom.getDocumentScrollElement();
  var inContainer;
  for(var el = element;el = goog.style.getOffsetParent(el);) {
    if((!goog.userAgent.IE || el.clientWidth != 0) && (!goog.userAgent.WEBKIT || el.clientHeight != 0 || el != body) && (el.scrollWidth != el.clientWidth || el.scrollHeight != el.clientHeight) && goog.style.getStyle_(el, "overflow") != "visible") {
      var pos = goog.style.getPageOffset(el);
      var client = goog.style.getClientLeftTop(el);
      pos.x += client.x;
      pos.y += client.y;
      visibleRect.top = Math.max(visibleRect.top, pos.y);
      visibleRect.right = Math.min(visibleRect.right, pos.x + el.clientWidth);
      visibleRect.bottom = Math.min(visibleRect.bottom, pos.y + el.clientHeight);
      visibleRect.left = Math.max(visibleRect.left, pos.x);
      inContainer = inContainer || el != scrollEl
    }
  }
  var scrollX = scrollEl.scrollLeft, scrollY = scrollEl.scrollTop;
  if(goog.userAgent.WEBKIT) {
    visibleRect.left += scrollX;
    visibleRect.top += scrollY
  }else {
    visibleRect.left = Math.max(visibleRect.left, scrollX);
    visibleRect.top = Math.max(visibleRect.top, scrollY)
  }
  if(!inContainer || goog.userAgent.WEBKIT) {
    visibleRect.right += scrollX;
    visibleRect.bottom += scrollY
  }
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
    return new goog.math.Size(element.offsetWidth, element.offsetHeight)
  }
  var style = element.style;
  var originalDisplay = style.display;
  var originalVisibility = style.visibility;
  var originalPosition = style.position;
  style.visibility = "hidden";
  style.position = "absolute";
  style.display = "inline";
  var originalWidth = element.offsetWidth;
  var originalHeight = element.offsetHeight;
  style.display = originalDisplay;
  style.position = originalPosition;
  style.visibility = originalVisibility;
  return new goog.math.Size(originalWidth, originalHeight)
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
goog.style.getScrollbarWidth = function() {
  var mockElement = goog.dom.createElement("div");
  mockElement.style.cssText = "visibility:hidden;overflow:scroll;" + "position:absolute;top:0;width:100px;height:100px";
  goog.dom.appendChild(goog.dom.getDocument().body, mockElement);
  var width = mockElement.offsetWidth - mockElement.clientWidth;
  goog.dom.removeNode(mockElement);
  return width
};
goog.provide("goog.cssom.iframe.style");
goog.require("goog.cssom");
goog.require("goog.dom");
goog.require("goog.dom.NodeType");
goog.require("goog.dom.classes");
goog.require("goog.string");
goog.require("goog.style");
goog.require("goog.userAgent");
goog.cssom.iframe.style.selectorPartAnchorRegex_ = /a(:(link|visited|active|hover))?/;
goog.cssom.iframe.style.SELECTOR_DELIMITER_ = ",";
goog.cssom.iframe.style.SELECTOR_PART_DELIMITER_ = " ";
goog.cssom.iframe.style.DECLARATION_START_DELIMITER_ = "{";
goog.cssom.iframe.style.DECLARATION_END_DELIMITER_ = "}\n";
goog.cssom.iframe.style.CssRuleSet_ = function() {
  this.declarationText = "";
  this.selectors = []
};
goog.cssom.iframe.style.CssRuleSet_.prototype.initializeFromCssRule = function(cssRule) {
  var ruleStyle = cssRule.style;
  if(!ruleStyle) {
    return false
  }
  var selector;
  var declarations;
  if(ruleStyle && (selector = cssRule.selectorText) && (declarations = ruleStyle.cssText)) {
    if(goog.userAgent.IE) {
      declarations += "/* */"
    }
  }else {
    if(cssRule.cssText) {
      var cssSelectorMatch = /([^\{]+)\{/;
      var endTagMatch = /\}[^\}]*$/g;
      selector = cssSelectorMatch.exec(cssRule.cssText)[1];
      declarations = cssRule.cssText.replace(cssSelectorMatch, "").replace(endTagMatch, "")
    }
  }
  if(selector) {
    this.setSelectorsFromString(selector);
    this.declarationText = declarations;
    return true
  }
  return false
};
goog.cssom.iframe.style.CssRuleSet_.prototype.setSelectorsFromString = function(selectorsString) {
  this.selectors = [];
  var selectors = selectorsString.split(/,\s*/gm);
  for(var i = 0;i < selectors.length;i++) {
    var selector = selectors[i];
    if(selector.length > 0) {
      this.selectors.push(new goog.cssom.iframe.style.CssSelector_(selector))
    }
  }
};
goog.cssom.iframe.style.CssRuleSet_.prototype.clone = function() {
  var newRuleSet = new goog.cssom.iframe.style.CssRuleSet_;
  newRuleSet.selectors = this.selectors.concat();
  newRuleSet.declarationText = this.declarationText;
  return newRuleSet
};
goog.cssom.iframe.style.CssRuleSet_.prototype.setDeclarationTextFromObject = function(sourceObject, opt_important) {
  var stringParts = [];
  for(var prop in sourceObject) {
    var value = sourceObject[prop];
    if(value) {
      stringParts.push(prop, ":", value, opt_important ? " !important" : "", ";")
    }
  }
  this.declarationText = stringParts.join("")
};
goog.cssom.iframe.style.CssRuleSet_.prototype.writeToArray = function(array) {
  var selectorCount = this.selectors.length;
  var matchesAnchorTag = false;
  for(var i = 0;i < selectorCount;i++) {
    var selectorParts = this.selectors[i].parts;
    var partCount = selectorParts.length;
    for(var j = 0;j < partCount;j++) {
      array.push(selectorParts[j].inputString_, goog.cssom.iframe.style.SELECTOR_PART_DELIMITER_)
    }
    if(i < selectorCount - 1) {
      array.push(goog.cssom.iframe.style.SELECTOR_DELIMITER_)
    }
    if(goog.userAgent.GECKO && !goog.userAgent.isVersion("1.9a")) {
      matchesAnchorTag = matchesAnchorTag || goog.cssom.iframe.style.selectorPartAnchorRegex_.test(selectorParts[partCount - 1].inputString_)
    }
  }
  var declarationText = this.declarationText;
  if(matchesAnchorTag) {
    declarationText = goog.cssom.iframe.style.makeColorRuleImportant_(declarationText)
  }
  array.push(goog.cssom.iframe.style.DECLARATION_START_DELIMITER_, declarationText, goog.cssom.iframe.style.DECLARATION_END_DELIMITER_)
};
goog.cssom.iframe.style.colorImportantReplaceRegex_ = /(^|;|{)\s*color:([^;]+);/g;
goog.cssom.iframe.style.makeColorRuleImportant_ = function(cssText) {
  return cssText.replace(goog.cssom.iframe.style.colorImportantReplaceRegex_, "$1 color: $2 ! important; ")
};
goog.cssom.iframe.style.CssSelector_ = function(opt_selectorString) {
  this.parts_ = [];
  this.ancestryMatchCache_ = {};
  if(opt_selectorString) {
    this.setPartsFromString_(opt_selectorString)
  }
};
goog.cssom.iframe.style.CssSelector_.prototype.setPartsFromString_ = function(selectorString) {
  var parts = [];
  var selectorPartStrings = selectorString.split(/\s+/gm);
  for(var i = 0;i < selectorPartStrings.length;i++) {
    if(!selectorPartStrings[i]) {
      continue
    }
    var part = new goog.cssom.iframe.style.CssSelectorPart_(selectorPartStrings[i]);
    parts.push(part)
  }
  this.parts = parts
};
goog.cssom.iframe.style.CssSelector_.prototype.matchElementAncestry = function(elementAncestry) {
  var ancestryUid = elementAncestry.uid;
  if(this.ancestryMatchCache_[ancestryUid]) {
    return this.ancestryMatchCache_[ancestryUid]
  }
  var elementIndex = 0;
  var match = null;
  var selectorPart = null;
  var lastSelectorPart = null;
  var ancestorNodes = elementAncestry.nodes;
  var ancestorNodeCount = ancestorNodes.length;
  for(var i = 0;i <= this.parts.length;i++) {
    selectorPart = this.parts[i];
    while(elementIndex < ancestorNodeCount) {
      var currentElementInfo = ancestorNodes[elementIndex];
      if(selectorPart && selectorPart.testElement(currentElementInfo)) {
        match = {elementIndex:elementIndex, selectorPartIndex:i};
        elementIndex++;
        break
      }else {
        if(lastSelectorPart && lastSelectorPart.testElement(currentElementInfo)) {
          match = {elementIndex:elementIndex, selectorPartIndex:i - 1}
        }
      }
      elementIndex++
    }
    lastSelectorPart = selectorPart
  }
  this.ancestryMatchCache_[ancestryUid] = match;
  return match
};
goog.cssom.iframe.style.CssSelectorPart_ = function(selectorPartString) {
  var cacheEntry = goog.cssom.iframe.style.CssSelectorPart_.instances_[selectorPartString];
  if(cacheEntry) {
    return cacheEntry
  }
  var identifiers;
  if(selectorPartString.match(/[#\.]/)) {
    identifiers = selectorPartString.split(/(?=[#\.])/)
  }else {
    identifiers = [selectorPartString]
  }
  var properties = {};
  for(var i = 0;i < identifiers.length;i++) {
    var identifier = identifiers[i];
    if(identifier.charAt(0) == ".") {
      properties.className = identifier.substring(1, identifier.length)
    }else {
      if(identifier.charAt(0) == "#") {
        properties.id = identifier.substring(1, identifier.length)
      }else {
        properties.tagName = identifier.toUpperCase()
      }
    }
  }
  this.inputString_ = selectorPartString;
  this.matchProperties_ = properties;
  this.testedElements_ = {};
  goog.cssom.iframe.style.CssSelectorPart_.instances_[selectorPartString] = this
};
goog.cssom.iframe.style.CssSelectorPart_.instances_ = {};
goog.cssom.iframe.style.CssSelectorPart_.prototype.testElement = function(elementInfo) {
  var elementUid = elementInfo.uid;
  var cachedMatch = this.testedElements_[elementUid];
  if(typeof cachedMatch != "undefined") {
    return cachedMatch
  }
  var matchProperties = this.matchProperties_;
  var testTag = matchProperties.tagName;
  var testClass = matchProperties.className;
  var testId = matchProperties.id;
  var matched = true;
  if(testTag && testTag != "*" && testTag != elementInfo.nodeName) {
    matched = false
  }else {
    if(testId && testId != elementInfo.id) {
      matched = false
    }else {
      if(testClass && !elementInfo.classNames[testClass]) {
        matched = false
      }
    }
  }
  this.testedElements_[elementUid] = matched;
  return matched
};
goog.cssom.iframe.style.NodeAncestry_ = function(node) {
  var nodeUid = goog.getUid(node);
  var ancestry = goog.cssom.iframe.style.NodeAncestry_.instances_[nodeUid];
  if(ancestry) {
    return ancestry
  }
  var nodes = [];
  do {
    var nodeInfo = {id:node.id, nodeName:node.nodeName};
    nodeInfo.uid = goog.getUid(nodeInfo);
    var className = node.className;
    var classNamesLookup = {};
    if(className) {
      var classNames = goog.dom.classes.get(node);
      for(var i = 0;i < classNames.length;i++) {
        classNamesLookup[classNames[i]] = 1
      }
    }
    nodeInfo.classNames = classNamesLookup;
    nodes.unshift(nodeInfo)
  }while(node = node.parentNode);
  this.nodes = nodes;
  this.uid = goog.getUid(this);
  goog.cssom.iframe.style.NodeAncestry_.instances_[nodeUid] = this
};
goog.cssom.iframe.style.NodeAncestry_.instances_ = {};
goog.cssom.iframe.style.resetDomCache = function() {
  goog.cssom.iframe.style.NodeAncestry_.instances_ = {}
};
goog.cssom.iframe.style.getRuleSetsFromDocument_ = function(doc) {
  var ruleSets = [];
  var styleSheets = goog.cssom.getAllCssStyleSheets(doc.styleSheets);
  for(var i = 0, styleSheet;styleSheet = styleSheets[i];i++) {
    var domRuleSets = goog.cssom.getCssRulesFromStyleSheet(styleSheet);
    if(domRuleSets && domRuleSets.length) {
      for(var j = 0, n = domRuleSets.length;j < n;j++) {
        var ruleSet = new goog.cssom.iframe.style.CssRuleSet_;
        if(ruleSet.initializeFromCssRule(domRuleSets[j])) {
          ruleSets.push(ruleSet)
        }
      }
    }
  }
  return ruleSets
};
goog.cssom.iframe.style.ruleSetCache_ = {};
goog.cssom.iframe.style.ruleSetCache_.ruleSetCache_ = {};
goog.cssom.iframe.style.ruleSetCache_.loadRuleSetsForDocument = function(doc) {
  var docUid = goog.getUid(doc);
  goog.cssom.iframe.style.ruleSetCache_.ruleSetCache_[docUid] = goog.cssom.iframe.style.getRuleSetsFromDocument_(doc)
};
goog.cssom.iframe.style.ruleSetCache_.getRuleSetsForDocument = function(doc) {
  var docUid = goog.getUid(doc);
  var cache = goog.cssom.iframe.style.ruleSetCache_.ruleSetCache_;
  if(!cache[docUid]) {
    goog.cssom.iframe.style.ruleSetCache_.loadRuleSetsForDocument(doc)
  }
  var ruleSets = cache[docUid];
  var ruleSetsCopy = [];
  for(var i = 0;i < ruleSets.length;i++) {
    ruleSetsCopy.push(ruleSets[i].clone())
  }
  return ruleSetsCopy
};
goog.cssom.iframe.style.inheritedProperties_ = ["color", "visibility", "quotes", "list-style-type", "list-style-image", "list-style-position", "list-style", "page-break-inside", "orphans", "widows", "font-family", "font-style", "font-variant", "font-weight", "text-indent", "text-align", "text-transform", "white-space", "caption-side", "border-collapse", "border-spacing", "empty-cells", "cursor"];
goog.cssom.iframe.style.textProperties_ = ["font-family", "font-size", "font-weight", "font-variant", "font-style", "color", "text-align", "text-decoration", "text-indent", "text-transform", "letter-spacing", "white-space", "word-spacing"];
goog.cssom.iframe.style.getElementContext = function(element, opt_forceRuleSetCacheUpdate, opt_copyBackgroundContext) {
  var sourceDocument = element.ownerDocument;
  if(opt_forceRuleSetCacheUpdate) {
    goog.cssom.iframe.style.ruleSetCache_.loadRuleSetsForDocument(sourceDocument)
  }
  var ruleSets = goog.cssom.iframe.style.ruleSetCache_.getRuleSetsForDocument(sourceDocument);
  var elementAncestry = new goog.cssom.iframe.style.NodeAncestry_(element);
  var bodySelectorPart = new goog.cssom.iframe.style.CssSelectorPart_("body");
  for(var i = 0;i < ruleSets.length;i++) {
    var ruleSet = ruleSets[i];
    var selectors = ruleSet.selectors;
    var ruleCount = selectors.length;
    for(var j = 0;j < ruleCount;j++) {
      var selector = selectors[j];
      var match = selector.matchElementAncestry(elementAncestry);
      if(match) {
        var ruleIndex = match.selectorPartIndex;
        var selectorParts = selector.parts;
        var lastSelectorPartIndex = selectorParts.length - 1;
        var selectorCopy;
        if(match.elementIndex == elementAncestry.nodes.length - 1 || ruleIndex < lastSelectorPartIndex) {
          var selectorPartsCopy = selectorParts.concat();
          selectorPartsCopy.splice(0, ruleIndex + 1, bodySelectorPart);
          selectorCopy = new goog.cssom.iframe.style.CssSelector_;
          selectorCopy.parts = selectorPartsCopy;
          selectors.push(selectorCopy)
        }else {
          if(ruleIndex > 0 && ruleIndex == lastSelectorPartIndex) {
            selectorCopy = new goog.cssom.iframe.style.CssSelector_;
            selectorCopy.parts = [bodySelectorPart, selectorParts[lastSelectorPartIndex]];
            selectors.push(selectorCopy)
          }
        }
      }
    }
  }
  var defaultPropertiesRuleSet = new goog.cssom.iframe.style.CssRuleSet_;
  var declarationParts = [];
  var computedStyle = goog.cssom.iframe.style.getComputedStyleObject_(element);
  var htmlSelector = new goog.cssom.iframe.style.CssSelector_;
  htmlSelector.parts = [new goog.cssom.iframe.style.CssSelectorPart_("html")];
  defaultPropertiesRuleSet.selectors = [htmlSelector];
  var defaultProperties = {};
  for(var i = 0, prop;prop = goog.cssom.iframe.style.inheritedProperties_[i];i++) {
    defaultProperties[prop] = computedStyle[goog.string.toCamelCase(prop)]
  }
  defaultPropertiesRuleSet.setDeclarationTextFromObject(defaultProperties);
  ruleSets.push(defaultPropertiesRuleSet);
  var bodyRuleSet = new goog.cssom.iframe.style.CssRuleSet_;
  var bodySelector = new goog.cssom.iframe.style.CssSelector_;
  bodySelector.parts = [new goog.cssom.iframe.style.CssSelectorPart_("body")];
  var bodyProperties = {position:"relative", top:"0", left:"0", right:"auto", display:"block", visibility:"visible"};
  for(i = 0, prop;prop = goog.cssom.iframe.style.textProperties_[i];i++) {
    bodyProperties[prop] = computedStyle[goog.string.toCamelCase(prop)]
  }
  if(opt_copyBackgroundContext && goog.cssom.iframe.style.isTransparentValue_(computedStyle["backgroundColor"])) {
    var bgProperties = goog.cssom.iframe.style.getBackgroundContext(element);
    bodyProperties["background-color"] = bgProperties["backgroundColor"];
    var elementBgImage = computedStyle["backgroundImage"];
    if(!elementBgImage || elementBgImage == "none") {
      bodyProperties["background-image"] = bgProperties["backgroundImage"];
      bodyProperties["background-repeat"] = bgProperties["backgroundRepeat"];
      bodyProperties["background-position"] = bgProperties["backgroundPosition"]
    }
  }
  bodyRuleSet.setDeclarationTextFromObject(bodyProperties, true);
  bodyRuleSet.selectors = [bodySelector];
  ruleSets.push(bodyRuleSet);
  var ruleSetStrings = [];
  ruleCount = ruleSets.length;
  for(i = 0;i < ruleCount;i++) {
    ruleSets[i].writeToArray(ruleSetStrings)
  }
  return ruleSetStrings.join("")
};
goog.cssom.iframe.style.isTransparentValue_ = function(colorValue) {
  return colorValue == "transparent" || colorValue == "rgba(0, 0, 0, 0)"
};
goog.cssom.iframe.style.getComputedStyleObject_ = function(element) {
  return element.currentStyle || goog.dom.getOwnerDocument(element).defaultView.getComputedStyle(element, "") || {}
};
goog.cssom.iframe.style.valueWithUnitsRegEx_ = /^(-?)([0-9]+)([a-z]*|%)/;
goog.cssom.iframe.style.getBackgroundXYValues_ = function(styleObject) {
  if(styleObject["backgroundPositionY"]) {
    return[styleObject["backgroundPositionX"], styleObject["backgroundPositionY"]]
  }else {
    return(styleObject["backgroundPosition"] || "0 0").split(" ")
  }
};
goog.cssom.iframe.style.getBackgroundContext = function(element) {
  var propertyValues = {"backgroundImage":"none"};
  var ancestor = element;
  var currentIframeWindow;
  while((ancestor = ancestor.parentNode) && ancestor.nodeType == goog.dom.NodeType.ELEMENT) {
    var computedStyle = goog.cssom.iframe.style.getComputedStyleObject_(ancestor);
    var backgroundColorValue = computedStyle["backgroundColor"];
    if(!goog.cssom.iframe.style.isTransparentValue_(backgroundColorValue)) {
      propertyValues["backgroundColor"] = backgroundColorValue
    }
    if(computedStyle["backgroundImage"] && computedStyle["backgroundImage"] != "none") {
      propertyValues["backgroundImage"] = computedStyle["backgroundImage"];
      propertyValues["backgroundRepeat"] = computedStyle["backgroundRepeat"];
      var relativePosition;
      if(currentIframeWindow) {
        relativePosition = goog.style.getFramedPageOffset(element, currentIframeWindow);
        var frameElement = currentIframeWindow.frameElement;
        var iframeRelativePosition = goog.style.getRelativePosition(frameElement, ancestor);
        var iframeBorders = goog.style.getBorderBox(frameElement);
        relativePosition.x += iframeRelativePosition.x + iframeBorders.left;
        relativePosition.y += iframeRelativePosition.y + iframeBorders.top
      }else {
        relativePosition = goog.style.getRelativePosition(element, ancestor)
      }
      var backgroundXYValues = goog.cssom.iframe.style.getBackgroundXYValues_(computedStyle);
      for(var i = 0;i < 2;i++) {
        var positionValue = backgroundXYValues[i];
        var coordinate = i == 0 ? "X" : "Y";
        var positionProperty = "backgroundPosition" + coordinate;
        var positionValueParts = goog.cssom.iframe.style.valueWithUnitsRegEx_.exec(positionValue);
        if(positionValueParts) {
          var value = parseInt(positionValueParts[1] + positionValueParts[2], 10);
          var units = positionValueParts[3];
          if(value == 0 || units == "px") {
            value -= coordinate == "X" ? relativePosition.x : relativePosition.y
          }
          positionValue = value + units
        }
        propertyValues[positionProperty] = positionValue
      }
      propertyValues["backgroundPosition"] = propertyValues["backgroundPositionX"] + " " + propertyValues["backgroundPositionY"]
    }
    if(propertyValues["backgroundColor"]) {
      break
    }
    if(ancestor.tagName == goog.dom.TagName.HTML) {
      try {
        currentIframeWindow = goog.dom.getWindow(ancestor.parentNode);
        ancestor = currentIframeWindow.frameElement;
        if(!ancestor) {
          break
        }
      }catch(e) {
        break
      }
    }
  }
  return propertyValues
};
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
  if(goog.userAgent.IE && !goog.userAgent.isVersion("9")) {
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
  if(goog.userAgent.IE && !goog.userAgent.isVersion("9")) {
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
  if(goog.userAgent.IE && !goog.userAgent.isVersion("9")) {
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
  if(goog.userAgent.IE && !goog.userAgent.isVersion("9")) {
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
  return(!this.startNode_ || goog.dom.TextRange.isAttachedNode(this.startNode_)) && (!this.endNode_ || goog.dom.TextRange.isAttachedNode(this.endNode_)) && (!(goog.userAgent.IE && !goog.userAgent.isVersion("9")) || this.getBrowserRangeWrapper_().isRangeInDocument())
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
    sel.removeAllRanges()
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
goog.provide("goog.editor.icontent");
goog.provide("goog.editor.icontent.FieldFormatInfo");
goog.provide("goog.editor.icontent.FieldStyleInfo");
goog.require("goog.editor.BrowserFeature");
goog.require("goog.style");
goog.require("goog.userAgent");
goog.editor.icontent.FieldFormatInfo = function(fieldId, standards, blended, fixedHeight, opt_extraStyles) {
  this.fieldId_ = fieldId;
  this.standards_ = standards;
  this.blended_ = blended;
  this.fixedHeight_ = fixedHeight;
  this.extraStyles_ = opt_extraStyles || {}
};
goog.editor.icontent.FieldStyleInfo = function(wrapper, css) {
  this.wrapper_ = wrapper;
  this.css_ = css
};
goog.editor.icontent.useStandardsModeIframes_ = false;
goog.editor.icontent.forceStandardsModeIframes = function() {
  goog.editor.icontent.useStandardsModeIframes_ = true
};
goog.editor.icontent.getInitialIframeContent_ = function(info, bodyHtml, style) {
  var html = [];
  if(info.blended_ && info.standards_ || goog.editor.icontent.useStandardsModeIframes_) {
    html.push("<!DOCTYPE HTML>")
  }
  html.push('<html style="background:none transparent;');
  if(info.blended_) {
    html.push("height:", info.fixedHeight_ ? "100%" : "auto")
  }
  html.push('">');
  html.push("<head><style>");
  if(style && style.css_) {
    html.push(style.css_)
  }
  if(goog.userAgent.GECKO && info.standards_) {
    html.push(" img {-moz-force-broken-image-icon: 1;}")
  }
  html.push("</style></head>");
  html.push('<body g_editable="true" hidefocus="true" ');
  if(goog.editor.BrowserFeature.HAS_CONTENT_EDITABLE) {
    html.push("contentEditable ")
  }
  html.push('class="editable ');
  html.push('" id="', info.fieldId_, '" style="');
  if(goog.userAgent.GECKO && info.blended_) {
    html.push(";width:100%;border:0;margin:0;background:none transparent;", ";height:", info.standards_ ? "100%" : "auto");
    if(info.fixedHeight_) {
      html.push(";overflow:auto")
    }else {
      html.push(";overflow-y:hidden;overflow-x:auto")
    }
  }
  if(goog.userAgent.OPERA) {
    html.push(";outline:hidden")
  }
  for(var key in info.extraStyles_) {
    html.push(";" + key + ":" + info.extraStyles_[key])
  }
  html.push('">', bodyHtml, "</body></html>");
  return html.join("")
};
goog.editor.icontent.writeNormalInitialBlendedIframe = function(info, bodyHtml, style, iframe) {
  if(info.blended_) {
    var field = style.wrapper_;
    var paddingBox = goog.style.getPaddingBox(field);
    if(paddingBox.top || paddingBox.left || paddingBox.right || paddingBox.bottom) {
      goog.style.setStyle(iframe, "margin", -paddingBox.top + "px " + -paddingBox.right + "px " + -paddingBox.bottom + "px " + -paddingBox.left + "px")
    }
  }
  goog.editor.icontent.writeNormalInitialIframe(info, bodyHtml, style, iframe)
};
goog.editor.icontent.writeNormalInitialIframe = function(info, bodyHtml, style, iframe) {
  var html = goog.editor.icontent.getInitialIframeContent_(info, bodyHtml, style);
  var doc = goog.dom.getFrameContentDocument(iframe);
  doc.open();
  doc.write(html);
  doc.close()
};
goog.editor.icontent.writeHttpsInitialIframe = function(info, doc, bodyHtml) {
  var body = doc.body;
  if(goog.editor.BrowserFeature.HAS_CONTENT_EDITABLE) {
    body.contentEditable = true
  }
  body.className = "editable";
  body.setAttribute("g_editable", true);
  body.hideFocus = true;
  body.id = info.fieldId_;
  goog.style.setStyle(body, info.extraStyles_);
  body.innerHTML = bodyHtml
};
goog.provide("goog.Delay");
goog.provide("goog.async.Delay");
goog.require("goog.Disposable");
goog.require("goog.Timer");
goog.async.Delay = function(listener, opt_interval, opt_handler) {
  goog.Disposable.call(this);
  this.listener_ = listener;
  this.interval_ = opt_interval || 0;
  this.handler_ = opt_handler;
  this.callback_ = goog.bind(this.doAction_, this)
};
goog.inherits(goog.async.Delay, goog.Disposable);
goog.Delay = goog.async.Delay;
goog.async.Delay.prototype.id_ = 0;
goog.async.Delay.prototype.disposeInternal = function() {
  goog.async.Delay.superClass_.disposeInternal.call(this);
  this.stop();
  delete this.listener_;
  delete this.handler_
};
goog.async.Delay.prototype.start = function(opt_interval) {
  this.stop();
  this.id_ = goog.Timer.callOnce(this.callback_, goog.isDef(opt_interval) ? opt_interval : this.interval_)
};
goog.async.Delay.prototype.stop = function() {
  if(this.isActive()) {
    goog.Timer.clear(this.id_)
  }
  this.id_ = 0
};
goog.async.Delay.prototype.fire = function() {
  this.stop();
  this.doAction_()
};
goog.async.Delay.prototype.fireIfActive = function() {
  if(this.isActive()) {
    this.fire()
  }
};
goog.async.Delay.prototype.isActive = function() {
  return this.id_ != 0
};
goog.async.Delay.prototype.doAction_ = function() {
  this.id_ = 0;
  if(this.listener_) {
    this.listener_.call(this.handler_)
  }
};
goog.provide("goog.editor.Command");
goog.editor.Command = {UNDO:"+undo", REDO:"+redo", LINK:"+link", FORMAT_BLOCK:"+formatBlock", INDENT:"+indent", OUTDENT:"+outdent", REMOVE_FORMAT:"+removeFormat", STRIKE_THROUGH:"+strikeThrough", HORIZONTAL_RULE:"+insertHorizontalRule", SUBSCRIPT:"+subscript", SUPERSCRIPT:"+superscript", UNDERLINE:"+underline", BOLD:"+bold", ITALIC:"+italic", FONT_SIZE:"+fontSize", FONT_FACE:"+fontName", FONT_COLOR:"+foreColor", EMOTICON:"+emoticon", BACKGROUND_COLOR:"+backColor", ORDERED_LIST:"+insertOrderedList", 
UNORDERED_LIST:"+insertUnorderedList", TABLE:"+table", JUSTIFY_CENTER:"+justifyCenter", JUSTIFY_FULL:"+justifyFull", JUSTIFY_RIGHT:"+justifyRight", JUSTIFY_LEFT:"+justifyLeft", BLOCKQUOTE:"+BLOCKQUOTE", DIR_LTR:"ltr", DIR_RTL:"rtl", IMAGE:"image", EDIT_HTML:"editHtml", DEFAULT_TAG:"+defaultTag", CLEAR_LOREM:"clearlorem", UPDATE_LOREM:"updatelorem", USING_LOREM:"usinglorem", MODAL_LINK_EDITOR:"link"};
goog.provide("goog.functions");
goog.functions.constant = function(retValue) {
  return function() {
    return retValue
  }
};
goog.functions.FALSE = goog.functions.constant(false);
goog.functions.TRUE = goog.functions.constant(true);
goog.functions.NULL = goog.functions.constant(null);
goog.functions.identity = function(opt_returnValue, var_args) {
  return opt_returnValue
};
goog.functions.error = function(message) {
  return function() {
    throw Error(message);
  }
};
goog.functions.lock = function(f) {
  return function() {
    return f.call(this)
  }
};
goog.functions.withReturnValue = function(f, retValue) {
  return goog.functions.sequence(f, goog.functions.constant(retValue))
};
goog.functions.compose = function(var_args) {
  var functions = arguments;
  var length = functions.length;
  return function() {
    var result;
    if(length) {
      result = functions[length - 1].apply(this, arguments)
    }
    for(var i = length - 2;i >= 0;i--) {
      result = functions[i].call(this, result)
    }
    return result
  }
};
goog.functions.sequence = function(var_args) {
  var functions = arguments;
  var length = functions.length;
  return function() {
    var result;
    for(var i = 0;i < length;i++) {
      result = functions[i].apply(this, arguments)
    }
    return result
  }
};
goog.functions.and = function(var_args) {
  var functions = arguments;
  var length = functions.length;
  return function() {
    for(var i = 0;i < length;i++) {
      if(!functions[i].apply(this, arguments)) {
        return false
      }
    }
    return true
  }
};
goog.functions.or = function(var_args) {
  var functions = arguments;
  var length = functions.length;
  return function() {
    for(var i = 0;i < length;i++) {
      if(functions[i].apply(this, arguments)) {
        return true
      }
    }
    return false
  }
};
goog.functions.not = function(f) {
  return function() {
    return!f.apply(this, arguments)
  }
};
goog.functions.create = function(constructor, var_args) {
  var temp = function() {
  };
  temp.prototype = constructor.prototype;
  var obj = new temp;
  constructor.apply(obj, Array.prototype.slice.call(arguments, 1));
  return obj
};
goog.provide("goog.editor.Plugin");
goog.require("goog.debug.Logger");
goog.require("goog.editor.Command");
goog.require("goog.events.EventTarget");
goog.require("goog.functions");
goog.require("goog.object");
goog.require("goog.reflect");
goog.editor.Plugin = function() {
  goog.events.EventTarget.call(this);
  this.enabled_ = this.activeOnUneditableFields()
};
goog.inherits(goog.editor.Plugin, goog.events.EventTarget);
goog.editor.Plugin.prototype.fieldObject = null;
goog.editor.Plugin.prototype.getFieldDomHelper = function() {
  return this.fieldObject && this.fieldObject.getEditableDomHelper()
};
goog.editor.Plugin.prototype.autoDispose_ = true;
goog.editor.Plugin.prototype.logger = goog.debug.Logger.getLogger("goog.editor.Plugin");
goog.editor.Plugin.prototype.registerFieldObject = function(fieldObject) {
  this.fieldObject = fieldObject
};
goog.editor.Plugin.prototype.unregisterFieldObject = function(fieldObj) {
  if(this.fieldObject) {
    this.disable(this.fieldObject);
    this.fieldObject = null
  }
};
goog.editor.Plugin.prototype.enable = function(fieldObject) {
  if(this.fieldObject == fieldObject) {
    this.enabled_ = true
  }else {
    this.logger.severe("Trying to enable an unregistered field with " + "this plugin.")
  }
};
goog.editor.Plugin.prototype.disable = function(fieldObject) {
  if(this.fieldObject == fieldObject) {
    this.enabled_ = false
  }else {
    this.logger.severe("Trying to disable an unregistered field " + "with this plugin.")
  }
};
goog.editor.Plugin.prototype.isEnabled = function(fieldObject) {
  return this.fieldObject == fieldObject ? this.enabled_ : false
};
goog.editor.Plugin.prototype.setAutoDispose = function(autoDispose) {
  this.autoDispose_ = autoDispose
};
goog.editor.Plugin.prototype.isAutoDispose = function() {
  return this.autoDispose_
};
goog.editor.Plugin.prototype.activeOnUneditableFields = goog.functions.FALSE;
goog.editor.Plugin.prototype.isSilentCommand = goog.functions.FALSE;
goog.editor.Plugin.prototype.disposeInternal = function() {
  if(this.fieldObject) {
    this.unregisterFieldObject(this.fieldObject)
  }
  goog.editor.Plugin.superClass_.disposeInternal.call(this)
};
goog.editor.Plugin.prototype.getTrogClassId;
goog.editor.Plugin.Op = {KEYDOWN:1, KEYPRESS:2, KEYUP:3, SELECTION:4, SHORTCUT:5, EXEC_COMMAND:6, QUERY_COMMAND:7, PREPARE_CONTENTS_HTML:8, CLEAN_CONTENTS_HTML:10, CLEAN_CONTENTS_DOM:11};
goog.editor.Plugin.OPCODE = goog.object.transpose(goog.reflect.object(goog.editor.Plugin, {handleKeyDown:goog.editor.Plugin.Op.KEYDOWN, handleKeyPress:goog.editor.Plugin.Op.KEYPRESS, handleKeyUp:goog.editor.Plugin.Op.KEYUP, handleSelectionChange:goog.editor.Plugin.Op.SELECTION, handleKeyboardShortcut:goog.editor.Plugin.Op.SHORTCUT, execCommand:goog.editor.Plugin.Op.EXEC_COMMAND, queryCommandValue:goog.editor.Plugin.Op.QUERY_COMMAND, prepareContentsHtml:goog.editor.Plugin.Op.PREPARE_CONTENTS_HTML, 
cleanContentsHtml:goog.editor.Plugin.Op.CLEAN_CONTENTS_HTML, cleanContentsDom:goog.editor.Plugin.Op.CLEAN_CONTENTS_DOM}));
goog.editor.Plugin.IRREPRESSIBLE_OPS = goog.object.createSet(goog.editor.Plugin.Op.PREPARE_CONTENTS_HTML, goog.editor.Plugin.Op.CLEAN_CONTENTS_HTML, goog.editor.Plugin.Op.CLEAN_CONTENTS_DOM);
goog.editor.Plugin.prototype.handleKeyDown;
goog.editor.Plugin.prototype.handleKeyPress;
goog.editor.Plugin.prototype.handleKeyUp;
goog.editor.Plugin.prototype.handleSelectionChange;
goog.editor.Plugin.prototype.handleKeyboardShortcut;
goog.editor.Plugin.prototype.execCommand = function(command, var_args) {
  var silent = this.isSilentCommand(command);
  if(!silent) {
    if(goog.userAgent.GECKO) {
      this.fieldObject.stopChangeEvents(true, true)
    }
    this.fieldObject.dispatchBeforeChange()
  }
  try {
    var result = this.execCommandInternal.apply(this, arguments)
  }finally {
    if(!silent) {
      this.fieldObject.dispatchChange();
      if(command != goog.editor.Command.LINK) {
        this.fieldObject.dispatchSelectionChangeEvent()
      }
    }
  }
  return result
};
goog.editor.Plugin.prototype.execCommandInternal;
goog.editor.Plugin.prototype.queryCommandValue;
goog.editor.Plugin.prototype.prepareContentsHtml;
goog.editor.Plugin.prototype.cleanContentsDom;
goog.editor.Plugin.prototype.cleanContentsHtml;
goog.editor.Plugin.prototype.isSupportedCommand = function(command) {
  return false
};
goog.provide("goog.dom.iter.AncestorIterator");
goog.provide("goog.dom.iter.ChildIterator");
goog.provide("goog.dom.iter.SiblingIterator");
goog.require("goog.iter.Iterator");
goog.require("goog.iter.StopIteration");
goog.dom.iter.SiblingIterator = function(node, opt_includeNode, opt_reverse) {
  this.node_ = node;
  this.reverse_ = !!opt_reverse;
  if(node && !opt_includeNode) {
    this.next()
  }
};
goog.inherits(goog.dom.iter.SiblingIterator, goog.iter.Iterator);
goog.dom.iter.SiblingIterator.prototype.next = function() {
  var node = this.node_;
  if(!node) {
    throw goog.iter.StopIteration;
  }
  this.node_ = this.reverse_ ? node.previousSibling : node.nextSibling;
  return node
};
goog.dom.iter.ChildIterator = function(element, opt_reverse, opt_startIndex) {
  if(!goog.isDef(opt_startIndex)) {
    opt_startIndex = opt_reverse && element.childNodes.length ? element.childNodes.length - 1 : 0
  }
  goog.dom.iter.SiblingIterator.call(this, element.childNodes[opt_startIndex], true, opt_reverse)
};
goog.inherits(goog.dom.iter.ChildIterator, goog.dom.iter.SiblingIterator);
goog.dom.iter.AncestorIterator = function(node, opt_includeNode) {
  this.node_ = node;
  if(node && !opt_includeNode) {
    this.next()
  }
};
goog.inherits(goog.dom.iter.AncestorIterator, goog.iter.Iterator);
goog.dom.iter.AncestorIterator.prototype.next = function() {
  var node = this.node_;
  if(!node) {
    throw goog.iter.StopIteration;
  }
  this.node_ = node.parentNode;
  return node
};
goog.provide("goog.editor.node");
goog.require("goog.dom");
goog.require("goog.dom.NodeType");
goog.require("goog.dom.TagName");
goog.require("goog.dom.iter.ChildIterator");
goog.require("goog.dom.iter.SiblingIterator");
goog.require("goog.iter");
goog.require("goog.object");
goog.require("goog.string");
goog.require("goog.string.Unicode");
goog.editor.node.BLOCK_TAG_NAMES_ = goog.object.createSet("ADDRESS", "BLOCKQUOTE", "BODY", "CAPTION", "CENTER", "COL", "COLGROUP", "DIR", "DIV", "DL", "DD", "DT", "FIELDSET", "FORM", "H1", "H2", "H3", "H4", "H5", "H6", "HR", "ISINDEX", "OL", "LI", "MAP", "MENU", "OPTGROUP", "OPTION", "P", "PRE", "TABLE", "TBODY", "TD", "TFOOT", "TH", "THEAD", "TR", "TL", "UL");
goog.editor.node.NON_EMPTY_TAGS_ = goog.object.createSet(goog.dom.TagName.IMG, goog.dom.TagName.IFRAME, "EMBED");
goog.editor.node.isStandardsMode = function(node) {
  return goog.dom.getDomHelper(node).isCss1CompatMode()
};
goog.editor.node.getRightMostLeaf = function(parent) {
  var temp;
  while(temp = goog.editor.node.getLastChild(parent)) {
    parent = temp
  }
  return parent
};
goog.editor.node.getLeftMostLeaf = function(parent) {
  var temp;
  while(temp = goog.editor.node.getFirstChild(parent)) {
    parent = temp
  }
  return parent
};
goog.editor.node.getFirstChild = function(parent) {
  return goog.editor.node.getChildHelper_(parent, false)
};
goog.editor.node.getLastChild = function(parent) {
  return goog.editor.node.getChildHelper_(parent, true)
};
goog.editor.node.getPreviousSibling = function(sibling) {
  return goog.editor.node.getFirstValue_(goog.iter.filter(new goog.dom.iter.SiblingIterator(sibling, false, true), goog.editor.node.isImportant))
};
goog.editor.node.getNextSibling = function(sibling) {
  return goog.editor.node.getFirstValue_(goog.iter.filter(new goog.dom.iter.SiblingIterator(sibling), goog.editor.node.isImportant))
};
goog.editor.node.getChildHelper_ = function(parent, isReversed) {
  return!parent || parent.nodeType != goog.dom.NodeType.ELEMENT ? null : goog.editor.node.getFirstValue_(goog.iter.filter(new goog.dom.iter.ChildIterator(parent, isReversed), goog.editor.node.isImportant))
};
goog.editor.node.getFirstValue_ = function(iterator) {
  try {
    return iterator.next()
  }catch(e) {
    return null
  }
};
goog.editor.node.isImportant = function(node) {
  return node.nodeType == goog.dom.NodeType.ELEMENT || node.nodeType == goog.dom.NodeType.TEXT && !goog.editor.node.isAllNonNbspWhiteSpace(node)
};
goog.editor.node.isAllNonNbspWhiteSpace = function(textNode) {
  return goog.string.isBreakingWhitespace(textNode.nodeValue)
};
goog.editor.node.isEmpty = function(node, opt_prohibitSingleNbsp) {
  var nodeData = goog.dom.getRawTextContent(node);
  if(node.getElementsByTagName) {
    for(var tag in goog.editor.node.NON_EMPTY_TAGS_) {
      if(node.tagName == tag || node.getElementsByTagName(tag).length > 0) {
        return false
      }
    }
  }
  return!opt_prohibitSingleNbsp && nodeData == goog.string.Unicode.NBSP || goog.string.isBreakingWhitespace(nodeData)
};
goog.editor.node.getActiveElementIE = function(doc) {
  try {
    return doc.activeElement
  }catch(e) {
  }
  return null
};
goog.editor.node.getLength = function(node) {
  return node.length || node.childNodes.length
};
goog.editor.node.findInChildren = function(parent, hasProperty) {
  for(var i = 0, len = parent.childNodes.length;i < len;i++) {
    if(hasProperty(parent.childNodes[i])) {
      return i
    }
  }
  return null
};
goog.editor.node.findHighestMatchingAncestor = function(node, hasProperty) {
  var parent = node.parentNode;
  var ancestor = null;
  while(parent && hasProperty(parent)) {
    ancestor = parent;
    parent = parent.parentNode
  }
  return ancestor
};
goog.editor.node.isBlockTag = function(node) {
  return!!goog.editor.node.BLOCK_TAG_NAMES_[node.tagName]
};
goog.editor.node.skipEmptyTextNodes = function(node) {
  while(node && node.nodeType == goog.dom.NodeType.TEXT && !node.nodeValue) {
    node = node.nextSibling
  }
  return node
};
goog.editor.node.isEditableContainer = function(element) {
  return element.getAttribute && element.getAttribute("g_editable") == "true"
};
goog.editor.node.isEditable = function(node) {
  return!!goog.dom.getAncestor(node, goog.editor.node.isEditableContainer)
};
goog.editor.node.findTopMostEditableAncestor = function(node, criteria) {
  var targetNode = null;
  while(node && !goog.editor.node.isEditableContainer(node)) {
    if(criteria(node)) {
      targetNode = node
    }
    node = node.parentNode
  }
  return targetNode
};
goog.editor.node.splitDomTreeAt = function(currentNode, opt_secondHalf, opt_root) {
  var parent;
  while(currentNode != opt_root && (parent = currentNode.parentNode)) {
    opt_secondHalf = goog.editor.node.getSecondHalfOfNode_(parent, currentNode, opt_secondHalf);
    currentNode = parent
  }
  return opt_secondHalf
};
goog.editor.node.getSecondHalfOfNode_ = function(node, startNode, firstChild) {
  var secondHalf = node.cloneNode(false);
  while(startNode.nextSibling) {
    goog.dom.appendChild(secondHalf, startNode.nextSibling)
  }
  if(firstChild) {
    secondHalf.insertBefore(firstChild, secondHalf.firstChild)
  }
  return secondHalf
};
goog.editor.node.transferChildren = function(newNode, oldNode) {
  goog.dom.append(newNode, oldNode.childNodes)
};
goog.provide("goog.editor.style");
goog.require("goog.dom");
goog.require("goog.dom.NodeType");
goog.require("goog.editor.BrowserFeature");
goog.require("goog.events.EventType");
goog.require("goog.object");
goog.require("goog.style");
goog.require("goog.userAgent");
goog.editor.style.getComputedOrCascadedStyle_ = function(node, stylePropertyName) {
  if(node.nodeType != goog.dom.NodeType.ELEMENT) {
    return null
  }
  return goog.userAgent.IE ? goog.style.getCascadedStyle(node, stylePropertyName) : goog.style.getComputedStyle(node, stylePropertyName)
};
goog.editor.style.isDisplayBlock = function(node) {
  return goog.editor.style.getComputedOrCascadedStyle_(node, "display") == "block"
};
goog.editor.style.isContainer = function(element) {
  var nodeName = element && element.nodeName.toLowerCase();
  return!!(element && (goog.editor.style.isDisplayBlock(element) || nodeName == "td" || nodeName == "table" || nodeName == "li"))
};
goog.editor.style.getContainer = function(node) {
  return goog.dom.getAncestor(node, goog.editor.style.isContainer, true)
};
goog.editor.style.SELECTABLE_INPUT_TYPES_ = goog.object.createSet("text", "file", "url");
goog.editor.style.cancelMouseDownHelper_ = function(e) {
  var targetTagName = e.target.tagName;
  if(targetTagName != goog.dom.TagName.TEXTAREA && targetTagName != goog.dom.TagName.INPUT) {
    e.preventDefault()
  }
};
goog.editor.style.makeUnselectable = function(element, eventHandler) {
  if(goog.editor.BrowserFeature.HAS_UNSELECTABLE_STYLE) {
    eventHandler.listen(element, goog.events.EventType.MOUSEDOWN, goog.editor.style.cancelMouseDownHelper_, true)
  }
  goog.style.setUnselectable(element, true);
  var inputs = element.getElementsByTagName(goog.dom.TagName.INPUT);
  for(var i = 0, len = inputs.length;i < len;i++) {
    var input = inputs[i];
    if(input.type in goog.editor.style.SELECTABLE_INPUT_TYPES_) {
      goog.editor.style.makeSelectable(input)
    }
  }
  goog.array.forEach(element.getElementsByTagName(goog.dom.TagName.TEXTAREA), goog.editor.style.makeSelectable)
};
goog.editor.style.makeSelectable = function(element) {
  goog.style.setUnselectable(element, false);
  if(goog.editor.BrowserFeature.HAS_UNSELECTABLE_STYLE) {
    var child = element;
    var current = element.parentNode;
    while(current && current.tagName != goog.dom.TagName.HTML) {
      if(goog.style.isUnselectable(current)) {
        goog.style.setUnselectable(current, false, true);
        for(var i = 0, len = current.childNodes.length;i < len;i++) {
          var node = current.childNodes[i];
          if(node != child && node.nodeType == goog.dom.NodeType.ELEMENT) {
            goog.style.setUnselectable(current.childNodes[i], true)
          }
        }
      }
      child = current;
      current = current.parentNode
    }
  }
};
goog.provide("goog.editor.range");
goog.provide("goog.editor.range.Point");
goog.require("goog.array");
goog.require("goog.dom");
goog.require("goog.dom.NodeType");
goog.require("goog.dom.Range");
goog.require("goog.dom.RangeEndpoint");
goog.require("goog.dom.SavedCaretRange");
goog.require("goog.editor.BrowserFeature");
goog.require("goog.editor.node");
goog.require("goog.editor.style");
goog.require("goog.iter");
goog.editor.range.narrow = function(range, el) {
  var startContainer = range.getStartNode();
  var endContainer = range.getEndNode();
  if(startContainer && endContainer) {
    var isElement = function(node) {
      return node == el
    };
    var hasStart = goog.dom.getAncestor(startContainer, isElement, true);
    var hasEnd = goog.dom.getAncestor(endContainer, isElement, true);
    if(hasStart && hasEnd) {
      return range.clone()
    }else {
      if(hasStart) {
        var leaf = goog.editor.node.getRightMostLeaf(el);
        return goog.dom.Range.createFromNodes(range.getStartNode(), range.getStartOffset(), leaf, goog.editor.node.getLength(leaf))
      }else {
        if(hasEnd) {
          return goog.dom.Range.createFromNodes(goog.editor.node.getLeftMostLeaf(el), 0, range.getEndNode(), range.getEndOffset())
        }
      }
    }
  }
  return null
};
goog.editor.range.expand = function(range, opt_stopNode) {
  var expandedRange = goog.editor.range.expandEndPointToContainer_(range, goog.dom.RangeEndpoint.START, opt_stopNode);
  expandedRange = goog.editor.range.expandEndPointToContainer_(expandedRange, goog.dom.RangeEndpoint.END, opt_stopNode);
  var startNode = expandedRange.getStartNode();
  var endNode = expandedRange.getEndNode();
  var startOffset = expandedRange.getStartOffset();
  var endOffset = expandedRange.getEndOffset();
  if(startNode == endNode) {
    while(endNode != opt_stopNode && startOffset == 0 && endOffset == goog.editor.node.getLength(endNode)) {
      var parentNode = endNode.parentNode;
      startOffset = goog.array.indexOf(parentNode.childNodes, endNode);
      endOffset = startOffset + 1;
      endNode = parentNode
    }
    startNode = endNode
  }
  return goog.dom.Range.createFromNodes(startNode, startOffset, endNode, endOffset)
};
goog.editor.range.expandEndPointToContainer_ = function(range, endpoint, opt_stopNode) {
  var expandStart = endpoint == goog.dom.RangeEndpoint.START;
  var node = expandStart ? range.getStartNode() : range.getEndNode();
  var offset = expandStart ? range.getStartOffset() : range.getEndOffset();
  var container = range.getContainerElement();
  while(node != container && node != opt_stopNode) {
    if(expandStart && offset != 0 || !expandStart && offset != goog.editor.node.getLength(node)) {
      break
    }
    var parentNode = node.parentNode;
    var index = goog.array.indexOf(parentNode.childNodes, node);
    offset = expandStart ? index : index + 1;
    node = parentNode
  }
  return goog.dom.Range.createFromNodes(expandStart ? node : range.getStartNode(), expandStart ? offset : range.getStartOffset(), expandStart ? range.getEndNode() : node, expandStart ? range.getEndOffset() : offset)
};
goog.editor.range.selectNodeStart = function(node) {
  goog.dom.Range.createCaret(goog.editor.node.getLeftMostLeaf(node), 0).select()
};
goog.editor.range.placeCursorNextTo = function(node, toLeft) {
  var parent = node.parentNode;
  var offset = goog.array.indexOf(parent.childNodes, node) + (toLeft ? 0 : 1);
  var point = goog.editor.range.Point.createDeepestPoint(parent, offset, toLeft);
  var range = goog.dom.Range.createCaret(point.node, point.offset);
  range.select();
  return range
};
goog.editor.range.selectionPreservingNormalize = function(node) {
  var doc = goog.dom.getOwnerDocument(node);
  var selection = goog.dom.Range.createFromWindow(goog.dom.getWindow(doc));
  var normalizedRange = goog.editor.range.rangePreservingNormalize(node, selection);
  if(normalizedRange) {
    normalizedRange.select()
  }
};
goog.editor.range.normalizeNodeIe_ = function(node) {
  var lastText = null;
  var child = node.firstChild;
  while(child) {
    var next = child.nextSibling;
    if(child.nodeType == goog.dom.NodeType.TEXT) {
      if(child.nodeValue == "") {
        node.removeChild(child)
      }else {
        if(lastText) {
          lastText.nodeValue += child.nodeValue;
          node.removeChild(child)
        }else {
          lastText = child
        }
      }
    }else {
      goog.editor.range.normalizeNodeIe_(child);
      lastText = null
    }
    child = next
  }
};
goog.editor.range.normalizeNode = function(node) {
  if(goog.userAgent.IE) {
    goog.editor.range.normalizeNodeIe_(node)
  }else {
    node.normalize()
  }
};
goog.editor.range.rangePreservingNormalize = function(node, range) {
  if(range) {
    var rangeFactory = goog.editor.range.normalize(range);
    var container = goog.editor.style.getContainer(range.getContainerElement())
  }
  if(container) {
    goog.editor.range.normalizeNode(goog.dom.findCommonAncestor(container, node))
  }else {
    if(node) {
      goog.editor.range.normalizeNode(node)
    }
  }
  if(rangeFactory) {
    return rangeFactory()
  }else {
    return null
  }
};
goog.editor.range.getDeepEndPoint = function(range, atStart) {
  return atStart ? goog.editor.range.Point.createDeepestPoint(range.getStartNode(), range.getStartOffset()) : goog.editor.range.Point.createDeepestPoint(range.getEndNode(), range.getEndOffset())
};
goog.editor.range.normalize = function(range) {
  var startPoint = goog.editor.range.normalizePoint_(goog.editor.range.getDeepEndPoint(range, true));
  var startParent = startPoint.getParentPoint();
  var startPreviousSibling = startPoint.node.previousSibling;
  if(startPoint.node.nodeType == goog.dom.NodeType.TEXT) {
    startPoint.node = null
  }
  var endPoint = goog.editor.range.normalizePoint_(goog.editor.range.getDeepEndPoint(range, false));
  var endParent = endPoint.getParentPoint();
  var endPreviousSibling = endPoint.node.previousSibling;
  if(endPoint.node.nodeType == goog.dom.NodeType.TEXT) {
    endPoint.node = null
  }
  return function() {
    if(!startPoint.node && startPreviousSibling) {
      startPoint.node = startPreviousSibling.nextSibling;
      if(!startPoint.node) {
        startPoint = goog.editor.range.Point.getPointAtEndOfNode(startPreviousSibling)
      }
    }
    if(!endPoint.node && endPreviousSibling) {
      endPoint.node = endPreviousSibling.nextSibling;
      if(!endPoint.node) {
        endPoint = goog.editor.range.Point.getPointAtEndOfNode(endPreviousSibling)
      }
    }
    return goog.dom.Range.createFromNodes(startPoint.node || startParent.node.firstChild || startParent.node, startPoint.offset, endPoint.node || endParent.node.firstChild || endParent.node, endPoint.offset)
  }
};
goog.editor.range.normalizePoint_ = function(point) {
  var previous;
  if(point.node.nodeType == goog.dom.NodeType.TEXT) {
    for(var current = point.node.previousSibling;current && current.nodeType == goog.dom.NodeType.TEXT;current = current.previousSibling) {
      point.offset += goog.editor.node.getLength(current)
    }
    previous = current
  }else {
    previous = point.node.previousSibling
  }
  var parent = point.node.parentNode;
  point.node = previous ? previous.nextSibling : parent.firstChild;
  return point
};
goog.editor.range.isEditable = function(range) {
  var rangeContainer = range.getContainerElement();
  var rangeContainerIsOutsideRange = range.getStartNode() != rangeContainer.parentElement;
  return rangeContainerIsOutsideRange && goog.editor.node.isEditableContainer(rangeContainer) || goog.editor.node.isEditable(rangeContainer)
};
goog.editor.range.intersectsTag = function(range, tagName) {
  if(goog.dom.getAncestorByTagNameAndClass(range.getContainerElement(), tagName)) {
    return true
  }
  return goog.iter.some(range, function(node) {
    return node.tagName == tagName
  })
};
goog.editor.range.Point = function(node, offset) {
  this.node = node;
  this.offset = offset
};
goog.editor.range.Point.prototype.getParentPoint = function() {
  var parent = this.node.parentNode;
  return new goog.editor.range.Point(parent, goog.array.indexOf(parent.childNodes, this.node))
};
goog.editor.range.Point.createDeepestPoint = function(node, offset, opt_trendLeft) {
  while(node.nodeType == goog.dom.NodeType.ELEMENT) {
    var child = node.childNodes[offset];
    if(!child && !node.lastChild) {
      break
    }
    if(child) {
      var prevSibling = child.previousSibling;
      if(opt_trendLeft && prevSibling) {
        node = prevSibling;
        offset = goog.editor.node.getLength(node)
      }else {
        node = child;
        offset = 0
      }
    }else {
      node = node.lastChild;
      offset = goog.editor.node.getLength(node)
    }
  }
  return new goog.editor.range.Point(node, offset)
};
goog.editor.range.Point.getPointAtEndOfNode = function(node) {
  return new goog.editor.range.Point(node, goog.editor.node.getLength(node))
};
goog.editor.range.saveUsingNormalizedCarets = function(range) {
  return new goog.editor.range.NormalizedCaretRange_(range)
};
goog.editor.range.NormalizedCaretRange_ = function(range) {
  goog.dom.SavedCaretRange.call(this, range)
};
goog.inherits(goog.editor.range.NormalizedCaretRange_, goog.dom.SavedCaretRange);
goog.editor.range.NormalizedCaretRange_.prototype.removeCarets = function(opt_range) {
  var startCaret = this.getCaret(true);
  var endCaret = this.getCaret(false);
  var node = startCaret && endCaret ? goog.dom.findCommonAncestor(startCaret, endCaret) : startCaret || endCaret;
  goog.editor.range.NormalizedCaretRange_.superClass_.removeCarets.call(this);
  if(opt_range) {
    return goog.editor.range.rangePreservingNormalize(node, opt_range)
  }else {
    if(node) {
      goog.editor.range.selectionPreservingNormalize(node)
    }
  }
};
goog.provide("goog.events.EventHandler");
goog.require("goog.Disposable");
goog.require("goog.events");
goog.require("goog.events.EventWrapper");
goog.require("goog.object");
goog.require("goog.structs.SimplePool");
goog.events.EventHandler = function(opt_handler) {
  goog.Disposable.call(this);
  this.handler_ = opt_handler
};
goog.inherits(goog.events.EventHandler, goog.Disposable);
goog.events.EventHandler.KEY_POOL_INITIAL_COUNT = 0;
goog.events.EventHandler.KEY_POOL_MAX_COUNT = 100;
goog.events.EventHandler.keyPool_ = new goog.structs.SimplePool(goog.events.EventHandler.KEY_POOL_INITIAL_COUNT, goog.events.EventHandler.KEY_POOL_MAX_COUNT);
goog.events.EventHandler.keys_ = null;
goog.events.EventHandler.key_ = null;
goog.events.EventHandler.typeArray_ = [];
goog.events.EventHandler.prototype.listen = function(src, type, opt_fn, opt_capture, opt_handler) {
  if(!goog.isArray(type)) {
    goog.events.EventHandler.typeArray_[0] = type;
    type = goog.events.EventHandler.typeArray_
  }
  for(var i = 0;i < type.length;i++) {
    var key = goog.events.listen(src, type[i], opt_fn || this, opt_capture || false, opt_handler || this.handler_ || this);
    this.recordListenerKey_(key)
  }
  return this
};
goog.events.EventHandler.prototype.listenOnce = function(src, type, opt_fn, opt_capture, opt_handler) {
  if(goog.isArray(type)) {
    for(var i = 0;i < type.length;i++) {
      this.listenOnce(src, type[i], opt_fn, opt_capture, opt_handler)
    }
  }else {
    var key = goog.events.listenOnce(src, type, opt_fn || this, opt_capture || false, opt_handler || this.handler_ || this);
    this.recordListenerKey_(key)
  }
  return this
};
goog.events.EventHandler.prototype.listenWithWrapper = function(src, wrapper, listener, opt_capt, opt_handler) {
  wrapper.listen(src, listener, opt_capt, opt_handler || this.handler_, this);
  return this
};
goog.events.EventHandler.prototype.recordListenerKey_ = function(key) {
  if(this.keys_) {
    this.keys_[key] = true
  }else {
    if(this.key_) {
      this.keys_ = goog.events.EventHandler.keyPool_.getObject();
      this.keys_[this.key_] = true;
      this.key_ = null;
      this.keys_[key] = true
    }else {
      this.key_ = key
    }
  }
};
goog.events.EventHandler.prototype.unlisten = function(src, type, opt_fn, opt_capture, opt_handler) {
  if(this.key_ || this.keys_) {
    if(goog.isArray(type)) {
      for(var i = 0;i < type.length;i++) {
        this.unlisten(src, type[i], opt_fn, opt_capture, opt_handler)
      }
    }else {
      var listener = goog.events.getListener(src, type, opt_fn || this, opt_capture || false, opt_handler || this.handler_ || this);
      if(listener) {
        var key = listener.key;
        goog.events.unlistenByKey(key);
        if(this.keys_) {
          goog.object.remove(this.keys_, key)
        }else {
          if(this.key_ == key) {
            this.key_ = null
          }
        }
      }
    }
  }
  return this
};
goog.events.EventHandler.prototype.unlistenWithWrapper = function(src, wrapper, listener, opt_capt, opt_handler) {
  wrapper.unlisten(src, listener, opt_capt, opt_handler || this.handler_, this);
  return this
};
goog.events.EventHandler.prototype.removeAll = function() {
  if(this.keys_) {
    for(var key in this.keys_) {
      goog.events.unlistenByKey(key);
      delete this.keys_[key]
    }
    goog.events.EventHandler.keyPool_.releaseObject(this.keys_);
    this.keys_ = null
  }else {
    if(this.key_) {
      goog.events.unlistenByKey(this.key_)
    }
  }
};
goog.events.EventHandler.prototype.disposeInternal = function() {
  goog.events.EventHandler.superClass_.disposeInternal.call(this);
  this.removeAll()
};
goog.events.EventHandler.prototype.handleEvent = function(e) {
  throw Error("EventHandler.handleEvent not implemented");
};
goog.provide("goog.events.KeyCodes");
goog.require("goog.userAgent");
goog.events.KeyCodes = {MAC_ENTER:3, BACKSPACE:8, TAB:9, NUM_CENTER:12, ENTER:13, SHIFT:16, CTRL:17, ALT:18, PAUSE:19, CAPS_LOCK:20, ESC:27, SPACE:32, PAGE_UP:33, PAGE_DOWN:34, END:35, HOME:36, LEFT:37, UP:38, RIGHT:39, DOWN:40, PRINT_SCREEN:44, INSERT:45, DELETE:46, ZERO:48, ONE:49, TWO:50, THREE:51, FOUR:52, FIVE:53, SIX:54, SEVEN:55, EIGHT:56, NINE:57, QUESTION_MARK:63, A:65, B:66, C:67, D:68, E:69, F:70, G:71, H:72, I:73, J:74, K:75, L:76, M:77, N:78, O:79, P:80, Q:81, R:82, S:83, T:84, U:85, 
V:86, W:87, X:88, Y:89, Z:90, META:91, CONTEXT_MENU:93, NUM_ZERO:96, NUM_ONE:97, NUM_TWO:98, NUM_THREE:99, NUM_FOUR:100, NUM_FIVE:101, NUM_SIX:102, NUM_SEVEN:103, NUM_EIGHT:104, NUM_NINE:105, NUM_MULTIPLY:106, NUM_PLUS:107, NUM_MINUS:109, NUM_PERIOD:110, NUM_DIVISION:111, F1:112, F2:113, F3:114, F4:115, F5:116, F6:117, F7:118, F8:119, F9:120, F10:121, F11:122, F12:123, NUMLOCK:144, SEMICOLON:186, DASH:189, EQUALS:187, COMMA:188, PERIOD:190, SLASH:191, APOSTROPHE:192, SINGLE_QUOTE:222, OPEN_SQUARE_BRACKET:219, 
BACKSLASH:220, CLOSE_SQUARE_BRACKET:221, WIN_KEY:224, MAC_FF_META:224, WIN_IME:229, PHANTOM:255};
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
    case goog.events.KeyCodes.SHIFT:
    ;
    case goog.events.KeyCodes.UP:
    ;
    case goog.events.KeyCodes.WIN_KEY:
      return false;
    default:
      return true
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
      return true;
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
goog.provide("goog.editor.Field");
goog.provide("goog.editor.Field.EventType");
goog.require("goog.array");
goog.require("goog.async.Delay");
goog.require("goog.debug.Logger");
goog.require("goog.dom");
goog.require("goog.dom.Range");
goog.require("goog.dom.TagName");
goog.require("goog.dom.classes");
goog.require("goog.editor.BrowserFeature");
goog.require("goog.editor.Command");
goog.require("goog.editor.Plugin");
goog.require("goog.editor.icontent");
goog.require("goog.editor.icontent.FieldFormatInfo");
goog.require("goog.editor.icontent.FieldStyleInfo");
goog.require("goog.editor.node");
goog.require("goog.editor.range");
goog.require("goog.events");
goog.require("goog.events.BrowserEvent");
goog.require("goog.events.EventHandler");
goog.require("goog.events.EventType");
goog.require("goog.events.KeyCodes");
goog.require("goog.functions");
goog.require("goog.string");
goog.require("goog.string.Unicode");
goog.require("goog.style");
goog.require("goog.userAgent");
goog.editor.Field = function(id, opt_doc) {
  goog.events.EventTarget.call(this);
  this.id = id;
  this.hashCode_ = id;
  this.editableDomHelper = null;
  this.plugins_ = {};
  this.indexedPlugins_ = {};
  for(var op in goog.editor.Plugin.OPCODE) {
    this.indexedPlugins_[op] = []
  }
  this.cssStyles = "";
  if(goog.userAgent.WEBKIT && goog.userAgent.isVersion("525.13") && goog.string.compareVersions(goog.userAgent.VERSION, "525.18") <= 0) {
    this.workaroundClassName_ = goog.getCssName("tr-webkit-workaround");
    this.cssStyles = "." + this.workaroundClassName_ + ">*{padding-right:1}"
  }
  this.stoppedEvents_ = {};
  this.stopEvent(goog.editor.Field.EventType.CHANGE);
  this.stopEvent(goog.editor.Field.EventType.DELAYEDCHANGE);
  this.isModified_ = false;
  this.isEverModified_ = false;
  this.delayedChangeTimer_ = new goog.async.Delay(this.dispatchDelayedChange_, goog.editor.Field.DELAYED_CHANGE_FREQUENCY, this);
  this.debouncedEvents_ = {};
  for(var key in goog.editor.Field.EventType) {
    this.debouncedEvents_[goog.editor.Field.EventType[key]] = 0
  }
  if(goog.editor.BrowserFeature.USE_MUTATION_EVENTS) {
    this.changeTimerGecko_ = new goog.async.Delay(this.handleChange, goog.editor.Field.CHANGE_FREQUENCY, this)
  }
  this.eventRegister = new goog.events.EventHandler(this);
  this.wrappers_ = [];
  this.loadState_ = goog.editor.Field.LoadState_.UNEDITABLE;
  var doc = opt_doc || document;
  this.originalDomHelper = goog.dom.getDomHelper(doc);
  this.originalElement = this.originalDomHelper.getElement(this.id);
  this.appWindow_ = this.originalDomHelper.getWindow()
};
goog.inherits(goog.editor.Field, goog.events.EventTarget);
goog.editor.Field.prototype.field = null;
goog.editor.Field.prototype.originalElement = null;
goog.editor.Field.prototype.logger = goog.debug.Logger.getLogger("goog.editor.Field");
goog.editor.Field.EventType = {COMMAND_VALUE_CHANGE:"cvc", LOAD:"load", UNLOAD:"unload", BEFORECHANGE:"beforechange", CHANGE:"change", DELAYEDCHANGE:"delayedchange", BEFOREFOCUS:"beforefocus", FOCUS:"focus", BLUR:"blur", BEFORETAB:"beforetab", SELECTIONCHANGE:"selectionchange"};
goog.editor.Field.LoadState_ = {UNEDITABLE:0, LOADING:1, EDITABLE:2};
goog.editor.Field.DEBOUNCE_TIME_MS_ = 500;
goog.editor.Field.activeFieldId_ = null;
goog.editor.Field.prototype.inModalMode_ = false;
goog.editor.Field.prototype.appWindow_;
goog.editor.Field.prototype.originalDomHelper;
goog.editor.Field.prototype.selectionChangeTarget_;
goog.editor.Field.setActiveFieldId = function(fieldId) {
  goog.editor.Field.activeFieldId_ = fieldId
};
goog.editor.Field.getActiveFieldId = function() {
  return goog.editor.Field.activeFieldId_
};
goog.editor.Field.prototype.inModalMode = function() {
  return this.inModalMode_
};
goog.editor.Field.prototype.setModalMode = function(inModalMode) {
  this.inModalMode_ = inModalMode
};
goog.editor.Field.prototype.getHashCode = function() {
  return this.hashCode_
};
goog.editor.Field.prototype.getElement = function() {
  return this.field
};
goog.editor.Field.prototype.getOriginalElement = function() {
  return this.originalElement
};
goog.editor.Field.prototype.addListener = function(type, listener, opt_capture, opt_handler) {
  var elem = this.getElement();
  if(elem && goog.editor.BrowserFeature.USE_DOCUMENT_FOR_KEY_EVENTS) {
    elem = elem.ownerDocument
  }
  this.eventRegister.listen(elem, type, listener, opt_capture, opt_handler)
};
goog.editor.Field.prototype.getPluginByClassId = function(classId) {
  return this.plugins_[classId]
};
goog.editor.Field.prototype.registerPlugin = function(plugin) {
  var classId = plugin.getTrogClassId();
  if(this.plugins_[classId]) {
    this.logger.severe("Cannot register the same class of plugin twice.")
  }
  this.plugins_[classId] = plugin;
  for(var op in goog.editor.Plugin.OPCODE) {
    var opcode = goog.editor.Plugin.OPCODE[op];
    if(plugin[opcode]) {
      this.indexedPlugins_[op].push(plugin)
    }
  }
  plugin.registerFieldObject(this);
  if(this.isLoaded()) {
    plugin.enable(this)
  }
};
goog.editor.Field.prototype.unregisterPlugin = function(plugin) {
  var classId = plugin.getTrogClassId();
  if(!this.plugins_[classId]) {
    this.logger.severe("Cannot unregister a plugin that isn't registered.")
  }
  delete this.plugins_[classId];
  for(var op in goog.editor.Plugin.OPCODE) {
    var opcode = goog.editor.Plugin.OPCODE[op];
    if(plugin[opcode]) {
      goog.array.remove(this.indexedPlugins_[op], plugin)
    }
  }
  plugin.unregisterFieldObject(this)
};
goog.editor.Field.prototype.setInitialStyle = function(cssText) {
  this.cssText = cssText
};
goog.editor.Field.prototype.resetOriginalElemProperties = function() {
  var field = this.getOriginalElement();
  field.removeAttribute("contentEditable");
  field.removeAttribute("g_editable");
  if(!this.id) {
    field.removeAttribute("id")
  }else {
    field.id = this.id
  }
  field.className = this.savedClassName_ || "";
  var cssText = this.cssText;
  if(!cssText) {
    field.removeAttribute("style")
  }else {
    goog.dom.setProperties(field, {"style":cssText})
  }
  if(goog.isString(this.originalFieldLineHeight_)) {
    goog.style.setStyle(field, "lineHeight", this.originalFieldLineHeight_);
    this.originalFieldLineHeight_ = null
  }
};
goog.editor.Field.prototype.isModified = function(opt_useIsEverModified) {
  return opt_useIsEverModified ? this.isEverModified_ : this.isModified_
};
goog.editor.Field.CHANGE_FREQUENCY = 15;
goog.editor.Field.DELAYED_CHANGE_FREQUENCY = 250;
goog.editor.Field.prototype.usesIframe = goog.functions.TRUE;
goog.editor.Field.prototype.isFixedHeight = goog.functions.TRUE;
goog.editor.Field.KEYS_CAUSING_CHANGES_ = {46:true, 8:true};
if(!goog.userAgent.IE) {
  goog.editor.Field.KEYS_CAUSING_CHANGES_[9] = true
}
goog.editor.Field.CTRL_KEYS_CAUSING_CHANGES_ = {86:true, 88:true};
if(goog.userAgent.IE) {
  goog.editor.Field.KEYS_CAUSING_CHANGES_[229] = true
}
goog.editor.Field.isGeneratingKey_ = function(e, testAllKeys) {
  if(goog.editor.Field.isSpecialGeneratingKey_(e)) {
    return true
  }
  return!!(testAllKeys && !(e.ctrlKey || e.metaKey) && (!goog.userAgent.GECKO || e.charCode))
};
goog.editor.Field.isSpecialGeneratingKey_ = function(e) {
  var testCtrlKeys = (e.ctrlKey || e.metaKey) && e.keyCode in goog.editor.Field.CTRL_KEYS_CAUSING_CHANGES_;
  var testRegularKeys = !(e.ctrlKey || e.metaKey) && e.keyCode in goog.editor.Field.KEYS_CAUSING_CHANGES_;
  return testCtrlKeys || testRegularKeys
};
goog.editor.Field.prototype.setAppWindow = function(appWindow) {
  this.appWindow_ = appWindow
};
goog.editor.Field.prototype.getAppWindow = function() {
  return this.appWindow_
};
goog.editor.Field.prototype.setBaseZindex = function(zindex) {
  this.baseZindex_ = zindex
};
goog.editor.Field.prototype.getBaseZindex = function() {
  return this.baseZindex_ || 0
};
goog.editor.Field.prototype.setupFieldObject = function(field) {
  this.loadState_ = goog.editor.Field.LoadState_.EDITABLE;
  this.field = field;
  this.editableDomHelper = goog.dom.getDomHelper(field);
  this.isModified_ = false;
  this.isEverModified_ = false;
  field.setAttribute("g_editable", "true")
};
goog.editor.Field.prototype.tearDownFieldObject_ = function() {
  this.loadState_ = goog.editor.Field.LoadState_.UNEDITABLE;
  for(var classId in this.plugins_) {
    var plugin = this.plugins_[classId];
    if(!plugin.activeOnUneditableFields()) {
      plugin.disable(this)
    }
  }
  this.field = null;
  this.editableDomHelper = null
};
goog.editor.Field.prototype.setupChangeListeners_ = function() {
  if(goog.userAgent.OPERA && this.usesIframe()) {
    this.boundFocusListenerOpera_ = goog.bind(this.dispatchFocusAndBeforeFocus_, this);
    this.boundBlurListenerOpera_ = goog.bind(this.dispatchBlur, this);
    var editWindow = this.getEditableDomHelper().getWindow();
    editWindow.addEventListener(goog.events.EventType.FOCUS, this.boundFocusListenerOpera_, false);
    editWindow.addEventListener(goog.events.EventType.BLUR, this.boundBlurListenerOpera_, false)
  }else {
    if(goog.editor.BrowserFeature.SUPPORTS_FOCUSIN) {
      this.addListener(goog.events.EventType.FOCUS, this.dispatchFocus_);
      this.addListener(goog.events.EventType.FOCUSIN, this.dispatchBeforeFocus_)
    }else {
      this.addListener(goog.events.EventType.FOCUS, this.dispatchFocusAndBeforeFocus_)
    }
    this.addListener(goog.events.EventType.BLUR, this.dispatchBlur, goog.editor.BrowserFeature.USE_MUTATION_EVENTS)
  }
  if(goog.editor.BrowserFeature.USE_MUTATION_EVENTS) {
    this.setupMutationEventHandlersGecko()
  }else {
    this.addListener(["beforecut", "beforepaste", "drop", "dragend"], this.dispatchBeforeChange);
    this.addListener(["cut", "paste"], this.dispatchChange);
    this.addListener("drop", this.handleDrop_)
  }
  var dropEventName = goog.userAgent.WEBKIT ? "dragend" : "dragdrop";
  this.addListener(dropEventName, this.handleDrop_);
  this.addListener(goog.events.EventType.KEYDOWN, this.handleKeyDown_);
  this.addListener(goog.events.EventType.KEYPRESS, this.handleKeyPress_);
  this.addListener(goog.events.EventType.KEYUP, this.handleKeyUp_);
  this.selectionChangeTimer_ = new goog.async.Delay(this.handleSelectionChangeTimer_, goog.editor.Field.SELECTION_CHANGE_FREQUENCY_, this);
  if(goog.editor.BrowserFeature.FOLLOWS_EDITABLE_LINKS) {
    this.addListener(goog.events.EventType.CLICK, goog.editor.Field.cancelLinkClick_)
  }
  this.addListener(goog.events.EventType.MOUSEDOWN, this.handleMouseDown_);
  this.addListener(goog.events.EventType.MOUSEUP, this.handleMouseUp_)
};
goog.editor.Field.SELECTION_CHANGE_FREQUENCY_ = 250;
goog.editor.Field.prototype.clearListeners_ = function() {
  if(this.eventRegister) {
    this.eventRegister.removeAll()
  }
  if(goog.userAgent.OPERA && this.usesIframe()) {
    try {
      var editWindow = this.getEditableDomHelper().getWindow();
      editWindow.removeEventListener(goog.events.EventType.FOCUS, this.boundFocusListenerOpera_, false);
      editWindow.removeEventListener(goog.events.EventType.BLUR, this.boundBlurListenerOpera_, false)
    }catch(e) {
    }
    delete this.boundFocusListenerOpera_;
    delete this.boundBlurListenerOpera_
  }
  if(this.changeTimerGecko_) {
    this.changeTimerGecko_.stop()
  }
  this.delayedChangeTimer_.stop()
};
goog.editor.Field.prototype.disposeInternal = function() {
  if(this.isLoading() || this.isLoaded()) {
    this.logger.warning("Disposing a field that is in use.")
  }
  if(this.getOriginalElement()) {
    this.execCommand(goog.editor.Command.CLEAR_LOREM)
  }
  this.tearDownFieldObject_();
  this.clearListeners_();
  this.originalDomHelper = null;
  if(this.eventRegister) {
    this.eventRegister.dispose();
    this.eventRegister = null
  }
  this.removeAllWrappers();
  if(goog.editor.Field.getActiveFieldId() == this.id) {
    goog.editor.Field.setActiveFieldId(null)
  }
  for(var classId in this.plugins_) {
    var plugin = this.plugins_[classId];
    if(plugin.isAutoDispose()) {
      plugin.dispose()
    }
  }
  delete this.plugins_;
  goog.editor.Field.superClass_.disposeInternal.call(this)
};
goog.editor.Field.prototype.attachWrapper = function(wrapper) {
  this.wrappers_.push(wrapper)
};
goog.editor.Field.prototype.removeAllWrappers = function() {
  var wrapper;
  while(wrapper = this.wrappers_.pop()) {
    wrapper.dispose()
  }
};
goog.editor.Field.MUTATION_EVENTS_GECKO = ["DOMNodeInserted", "DOMNodeRemoved", "DOMNodeRemovedFromDocument", "DOMNodeInsertedIntoDocument", "DOMCharacterDataModified"];
goog.editor.Field.prototype.setupMutationEventHandlersGecko = function() {
  if(goog.editor.BrowserFeature.HAS_DOM_SUBTREE_MODIFIED_EVENT) {
    this.eventRegister.listen(this.getElement(), "DOMSubtreeModified", this.handleMutationEventGecko_)
  }else {
    var doc = this.getEditableDomHelper().getDocument();
    this.eventRegister.listen(doc, goog.editor.Field.MUTATION_EVENTS_GECKO, this.handleMutationEventGecko_, true);
    this.eventRegister.listen(doc, "DOMAttrModified", goog.bind(this.handleDomAttrChange, this, this.handleMutationEventGecko_), true)
  }
};
goog.editor.Field.prototype.handleBeforeChangeKeyEvent_ = function(e) {
  var block = e.keyCode == goog.events.KeyCodes.TAB && !this.dispatchBeforeTab_(e) || goog.userAgent.GECKO && e.metaKey && (e.keyCode == goog.events.KeyCodes.LEFT || e.keyCode == goog.events.KeyCodes.RIGHT);
  if(block) {
    e.preventDefault();
    return false
  }else {
    this.gotGeneratingKey_ = e.charCode || goog.editor.Field.isGeneratingKey_(e, goog.userAgent.GECKO);
    if(this.gotGeneratingKey_) {
      this.dispatchBeforeChange()
    }
  }
  return true
};
goog.editor.Field.SELECTION_CHANGE_KEYCODES_ = {8:1, 9:1, 13:1, 33:1, 34:1, 35:1, 36:1, 37:1, 38:1, 39:1, 40:1, 46:1};
goog.editor.Field.CTRL_KEYS_CAUSING_SELECTION_CHANGES_ = {65:true, 86:true, 88:true};
goog.editor.Field.POTENTIAL_SHORTCUT_KEYCODES_ = {8:1, 9:1, 13:1, 27:1, 33:1, 34:1, 37:1, 38:1, 39:1, 40:1};
goog.editor.Field.prototype.invokeShortCircuitingOp_ = function(op, var_args) {
  var plugins = this.indexedPlugins_[op];
  var argList = goog.array.slice(arguments, 1);
  for(var i = 0;i < plugins.length;++i) {
    var plugin = plugins[i];
    if((plugin.isEnabled(this) || goog.editor.Plugin.IRREPRESSIBLE_OPS[op]) && plugin[goog.editor.Plugin.OPCODE[op]].apply(plugin, argList)) {
      return true
    }
  }
  return false
};
goog.editor.Field.prototype.invokeOp_ = function(op, var_args) {
  var plugins = this.indexedPlugins_[op];
  var argList = goog.array.slice(arguments, 1);
  for(var i = 0;i < plugins.length;++i) {
    var plugin = plugins[i];
    if(plugin.isEnabled(this) || goog.editor.Plugin.IRREPRESSIBLE_OPS[op]) {
      plugin[goog.editor.Plugin.OPCODE[op]].apply(plugin, argList)
    }
  }
};
goog.editor.Field.prototype.reduceOp_ = function(op, arg, var_args) {
  var plugins = this.indexedPlugins_[op];
  var argList = goog.array.slice(arguments, 1);
  for(var i = 0;i < plugins.length;++i) {
    var plugin = plugins[i];
    if(plugin.isEnabled(this) || goog.editor.Plugin.IRREPRESSIBLE_OPS[op]) {
      argList[0] = plugin[goog.editor.Plugin.OPCODE[op]].apply(plugin, argList)
    }
  }
  return argList[0]
};
goog.editor.Field.prototype.injectContents = function(contents, field) {
  var styles = {};
  var newHtml = this.getInjectableContents(contents, styles);
  goog.style.setStyle(field, styles);
  field.innerHTML = newHtml
};
goog.editor.Field.prototype.getInjectableContents = function(contents, styles) {
  return this.reduceOp_(goog.editor.Plugin.Op.PREPARE_CONTENTS_HTML, contents || "", styles)
};
goog.editor.Field.prototype.handleKeyDown_ = function(e) {
  if(!goog.editor.BrowserFeature.USE_MUTATION_EVENTS) {
    if(!this.handleBeforeChangeKeyEvent_(e)) {
      return
    }
  }
  if(!this.invokeShortCircuitingOp_(goog.editor.Plugin.Op.KEYDOWN, e) && goog.editor.BrowserFeature.USES_KEYDOWN) {
    this.handleKeyboardShortcut_(e)
  }
};
goog.editor.Field.prototype.handleKeyPress_ = function(e) {
  if(goog.editor.BrowserFeature.USE_MUTATION_EVENTS) {
    if(!this.handleBeforeChangeKeyEvent_(e)) {
      return
    }
  }else {
    this.gotGeneratingKey_ = true;
    this.dispatchBeforeChange()
  }
  if(!this.invokeShortCircuitingOp_(goog.editor.Plugin.Op.KEYPRESS, e) && !goog.editor.BrowserFeature.USES_KEYDOWN) {
    this.handleKeyboardShortcut_(e)
  }
};
goog.editor.Field.prototype.handleKeyUp_ = function(e) {
  if(!goog.editor.BrowserFeature.USE_MUTATION_EVENTS && (this.gotGeneratingKey_ || goog.editor.Field.isSpecialGeneratingKey_(e))) {
    this.handleChange()
  }
  this.invokeShortCircuitingOp_(goog.editor.Plugin.Op.KEYUP, e);
  if(this.isEventStopped(goog.editor.Field.EventType.SELECTIONCHANGE)) {
    return
  }
  if(goog.editor.Field.SELECTION_CHANGE_KEYCODES_[e.keyCode] || (e.ctrlKey || e.metaKey) && goog.editor.Field.CTRL_KEYS_CAUSING_SELECTION_CHANGES_[e.keyCode]) {
    this.selectionChangeTimer_.start()
  }
};
goog.editor.Field.prototype.handleKeyboardShortcut_ = function(e) {
  if(e.altKey) {
    return
  }
  var isModifierPressed = goog.userAgent.MAC ? e.metaKey : e.ctrlKey;
  if(isModifierPressed || goog.editor.Field.POTENTIAL_SHORTCUT_KEYCODES_[e.keyCode]) {
    var key = e.charCode || e.keyCode;
    if(key == 17) {
      return
    }
    var stringKey = String.fromCharCode(key).toLowerCase();
    if(this.invokeShortCircuitingOp_(goog.editor.Plugin.Op.SHORTCUT, e, stringKey, isModifierPressed)) {
      e.preventDefault()
    }
  }
};
goog.editor.Field.prototype.execCommand = function(command, var_args) {
  var args = arguments;
  var result;
  var plugins = this.indexedPlugins_[goog.editor.Plugin.Op.EXEC_COMMAND];
  for(var i = 0;i < plugins.length;++i) {
    var plugin = plugins[i];
    if(plugin.isEnabled(this) && plugin.isSupportedCommand(command)) {
      result = plugin.execCommand.apply(plugin, args);
      break
    }
  }
  return result
};
goog.editor.Field.prototype.queryCommandValue = function(commands) {
  var isEditable = this.isLoaded() && this.isSelectionEditable();
  if(goog.isString(commands)) {
    return this.queryCommandValueInternal_(commands, isEditable)
  }else {
    var state = {};
    for(var i = 0;i < commands.length;i++) {
      state[commands[i]] = this.queryCommandValueInternal_(commands[i], isEditable)
    }
    return state
  }
};
goog.editor.Field.prototype.queryCommandValueInternal_ = function(command, isEditable) {
  var plugins = this.indexedPlugins_[goog.editor.Plugin.Op.QUERY_COMMAND];
  for(var i = 0;i < plugins.length;++i) {
    var plugin = plugins[i];
    if(plugin.isEnabled(this) && plugin.isSupportedCommand(command) && (isEditable || plugin.activeOnUneditableFields())) {
      return plugin.queryCommandValue(command)
    }
  }
  return isEditable ? null : false
};
goog.editor.Field.prototype.handleDomAttrChange = function(handler, e) {
  if(this.isEventStopped(goog.editor.Field.EventType.CHANGE)) {
    return
  }
  e = e.getBrowserEvent();
  try {
    if(e.originalTarget.prefix || e.originalTarget.nodeName == "scrollbar") {
      return
    }
  }catch(ex1) {
    return
  }
  if(e.prevValue == e.newValue) {
    return
  }
  handler.call(this, e)
};
goog.editor.Field.prototype.handleMutationEventGecko_ = function(e) {
  if(this.isEventStopped(goog.editor.Field.EventType.CHANGE)) {
    return
  }
  e = e.getBrowserEvent ? e.getBrowserEvent() : e;
  if(e.target.firebugIgnore) {
    return
  }
  this.isModified_ = true;
  this.isEverModified_ = true;
  this.changeTimerGecko_.start()
};
goog.editor.Field.prototype.handleDrop_ = function(e) {
  if(goog.userAgent.IE) {
    this.execCommand(goog.editor.Command.CLEAR_LOREM, true)
  }
  if(goog.editor.BrowserFeature.USE_MUTATION_EVENTS) {
    this.dispatchFocusAndBeforeFocus_()
  }
  this.dispatchChange()
};
goog.editor.Field.prototype.getEditableIframe = function() {
  var dh;
  if(this.usesIframe() && (dh = this.getEditableDomHelper())) {
    var win = dh.getWindow();
    return win && win.frameElement
  }
  return null
};
goog.editor.Field.prototype.getEditableDomHelper = function() {
  return this.editableDomHelper
};
goog.editor.Field.prototype.getRange = function() {
  var win = this.editableDomHelper && this.editableDomHelper.getWindow();
  return win && goog.dom.Range.createFromWindow(win)
};
goog.editor.Field.prototype.dispatchSelectionChangeEvent = function(opt_e, opt_target) {
  if(this.isEventStopped(goog.editor.Field.EventType.SELECTIONCHANGE)) {
    return
  }
  var range = this.getRange();
  var rangeContainer = range && range.getContainerElement();
  this.isSelectionEditable_ = !!rangeContainer && goog.dom.contains(this.getElement(), rangeContainer);
  this.dispatchCommandValueChange();
  this.dispatchEvent({type:goog.editor.Field.EventType.SELECTIONCHANGE, originalType:opt_e && opt_e.type});
  this.invokeShortCircuitingOp_(goog.editor.Plugin.Op.SELECTION, opt_e, opt_target)
};
goog.editor.Field.prototype.handleSelectionChangeTimer_ = function() {
  var t = this.selectionChangeTarget_;
  this.selectionChangeTarget_ = null;
  this.dispatchSelectionChangeEvent(undefined, t)
};
goog.editor.Field.prototype.dispatchBeforeChange = function() {
  if(this.isEventStopped(goog.editor.Field.EventType.BEFORECHANGE)) {
    return
  }
  this.dispatchEvent(goog.editor.Field.EventType.BEFORECHANGE)
};
goog.editor.Field.prototype.dispatchBeforeTab_ = function(e) {
  return this.dispatchEvent({type:goog.editor.Field.EventType.BEFORETAB, shiftKey:e.shiftKey, altKey:e.altKey, ctrlKey:e.ctrlKey})
};
goog.editor.Field.prototype.stopChangeEvents = function(opt_stopChange, opt_stopDelayedChange) {
  if(opt_stopChange) {
    if(this.changeTimerGecko_) {
      this.changeTimerGecko_.fireIfActive()
    }
    this.stopEvent(goog.editor.Field.EventType.CHANGE)
  }
  if(opt_stopDelayedChange) {
    this.clearDelayedChange();
    this.stopEvent(goog.editor.Field.EventType.DELAYEDCHANGE)
  }
};
goog.editor.Field.prototype.startChangeEvents = function(opt_fireChange, opt_fireDelayedChange) {
  if(!opt_fireChange && this.changeTimerGecko_) {
    this.changeTimerGecko_.fireIfActive()
  }
  this.startEvent(goog.editor.Field.EventType.CHANGE);
  this.startEvent(goog.editor.Field.EventType.DELAYEDCHANGE);
  if(opt_fireChange) {
    this.handleChange()
  }
  if(opt_fireDelayedChange) {
    this.dispatchDelayedChange_()
  }
};
goog.editor.Field.prototype.stopEvent = function(eventType) {
  this.stoppedEvents_[eventType] = 1
};
goog.editor.Field.prototype.startEvent = function(eventType) {
  this.stoppedEvents_[eventType] = 0
};
goog.editor.Field.prototype.debounceEvent = function(eventType) {
  this.debouncedEvents_[eventType] = goog.now()
};
goog.editor.Field.prototype.isEventStopped = function(eventType) {
  return!!this.stoppedEvents_[eventType] || this.debouncedEvents_[eventType] && goog.now() - this.debouncedEvents_[eventType] <= goog.editor.Field.DEBOUNCE_TIME_MS_
};
goog.editor.Field.prototype.manipulateDom = function(func, opt_preventDelayedChange, opt_handler) {
  this.stopChangeEvents(true, true);
  try {
    func.call(opt_handler)
  }finally {
    if(this.isLoaded()) {
      if(opt_preventDelayedChange) {
        this.startEvent(goog.editor.Field.EventType.CHANGE);
        this.handleChange();
        this.startEvent(goog.editor.Field.EventType.DELAYEDCHANGE)
      }else {
        this.dispatchChange()
      }
    }
  }
};
goog.editor.Field.prototype.dispatchCommandValueChange = function(opt_commands) {
  if(opt_commands) {
    this.dispatchEvent({type:goog.editor.Field.EventType.COMMAND_VALUE_CHANGE, commands:opt_commands})
  }else {
    this.dispatchEvent(goog.editor.Field.EventType.COMMAND_VALUE_CHANGE)
  }
};
goog.editor.Field.prototype.dispatchChange = function(opt_noDelay) {
  this.startChangeEvents(true, opt_noDelay)
};
goog.editor.Field.prototype.handleChange = function() {
  if(this.isEventStopped(goog.editor.Field.EventType.CHANGE)) {
    return
  }
  if(this.changeTimerGecko_) {
    this.changeTimerGecko_.stop()
  }
  this.isModified_ = true;
  this.isEverModified_ = true;
  if(this.isEventStopped(goog.editor.Field.EventType.DELAYEDCHANGE)) {
    return
  }
  this.delayedChangeTimer_.start()
};
goog.editor.Field.prototype.dispatchDelayedChange_ = function() {
  if(this.isEventStopped(goog.editor.Field.EventType.DELAYEDCHANGE)) {
    return
  }
  this.delayedChangeTimer_.stop();
  this.isModified_ = false;
  this.dispatchEvent(goog.editor.Field.EventType.DELAYEDCHANGE)
};
goog.editor.Field.prototype.clearDelayedChange = function() {
  if(this.changeTimerGecko_) {
    this.changeTimerGecko_.fireIfActive()
  }
  this.delayedChangeTimer_.fireIfActive()
};
goog.editor.Field.prototype.dispatchFocusAndBeforeFocus_ = function() {
  this.dispatchBeforeFocus_();
  this.dispatchFocus_()
};
goog.editor.Field.prototype.dispatchBeforeFocus_ = function() {
  if(this.isEventStopped(goog.editor.Field.EventType.BEFOREFOCUS)) {
    return
  }
  this.execCommand(goog.editor.Command.CLEAR_LOREM, true);
  this.dispatchEvent(goog.editor.Field.EventType.BEFOREFOCUS)
};
goog.editor.Field.prototype.dispatchFocus_ = function() {
  if(this.isEventStopped(goog.editor.Field.EventType.FOCUS)) {
    return
  }
  goog.editor.Field.setActiveFieldId(this.id);
  this.isSelectionEditable_ = true;
  this.dispatchEvent(goog.editor.Field.EventType.FOCUS);
  if(goog.editor.BrowserFeature.PUTS_CURSOR_BEFORE_FIRST_BLOCK_ELEMENT_ON_FOCUS) {
    var field = this.getElement();
    var range = this.getRange();
    if(range) {
      var focusNode = range.getFocusNode();
      if(range.getFocusOffset() == 0 && (!focusNode || focusNode == field || focusNode.tagName == goog.dom.TagName.BODY)) {
        goog.editor.range.selectNodeStart(field)
      }
    }
  }
  if(!goog.editor.BrowserFeature.CLEARS_SELECTION_WHEN_FOCUS_LEAVES && this.usesIframe()) {
    var parent = this.getEditableDomHelper().getWindow().parent;
    parent.getSelection().removeAllRanges()
  }
};
goog.editor.Field.prototype.dispatchBlur = function() {
  if(this.isEventStopped(goog.editor.Field.EventType.BLUR)) {
    return
  }
  if(goog.editor.Field.getActiveFieldId() == this.id) {
    goog.editor.Field.setActiveFieldId(null)
  }
  this.isSelectionEditable_ = false;
  this.dispatchEvent(goog.editor.Field.EventType.BLUR)
};
goog.editor.Field.prototype.isSelectionEditable = function() {
  return this.isSelectionEditable_
};
goog.editor.Field.cancelLinkClick_ = function(e) {
  if(goog.dom.getAncestorByTagNameAndClass(e.target, goog.dom.TagName.A)) {
    e.preventDefault()
  }
};
goog.editor.Field.prototype.handleMouseDown_ = function(e) {
  if(!goog.editor.Field.getActiveFieldId()) {
    goog.editor.Field.setActiveFieldId(this.id)
  }
  if(goog.userAgent.IE) {
    var targetElement = e.target;
    if(targetElement && targetElement.tagName == goog.dom.TagName.A && e.ctrlKey) {
      this.originalDomHelper.getWindow().open(targetElement.href)
    }
  }
};
goog.editor.Field.prototype.handleMouseUp_ = function(e) {
  this.dispatchSelectionChangeEvent(e);
  if(goog.userAgent.IE) {
    this.selectionChangeTarget_ = e.target;
    this.selectionChangeTimer_.start()
  }
};
goog.editor.Field.prototype.getCleanContents = function() {
  if(this.queryCommandValue(goog.editor.Command.USING_LOREM)) {
    return goog.string.Unicode.NBSP
  }
  if(!this.isLoaded()) {
    var elem = this.getOriginalElement();
    if(!elem) {
      this.logger.shout("Couldn't get the field element to read the contents")
    }
    return elem.innerHTML
  }
  var fieldCopy = this.getFieldCopy();
  this.invokeOp_(goog.editor.Plugin.Op.CLEAN_CONTENTS_DOM, fieldCopy);
  return this.reduceOp_(goog.editor.Plugin.Op.CLEAN_CONTENTS_HTML, fieldCopy.innerHTML)
};
goog.editor.Field.prototype.getFieldCopy = function() {
  var field = this.getElement();
  var fieldCopy = field.cloneNode(false);
  var html = field.innerHTML;
  if(goog.userAgent.IE && html.match(/^\s*<script/i)) {
    html = goog.string.Unicode.NBSP + html
  }
  fieldCopy.innerHTML = html;
  return fieldCopy
};
goog.editor.Field.prototype.setHtml = function(addParas, html, opt_dontFireDelayedChange, opt_applyLorem) {
  if(this.isLoading()) {
    this.logger.severe("Can't set html while loading Trogedit");
    return
  }
  if(opt_applyLorem) {
    this.execCommand(goog.editor.Command.CLEAR_LOREM)
  }
  if(html && addParas) {
    html = "<p>" + html + "</p>"
  }
  if(opt_dontFireDelayedChange) {
    this.stopChangeEvents(false, true)
  }
  this.setInnerHtml_(html);
  if(opt_applyLorem) {
    this.execCommand(goog.editor.Command.UPDATE_LOREM)
  }
  if(this.isLoaded()) {
    if(opt_dontFireDelayedChange) {
      if(goog.editor.BrowserFeature.USE_MUTATION_EVENTS) {
        this.changeTimerGecko_.fireIfActive()
      }
      this.startChangeEvents()
    }else {
      this.dispatchChange()
    }
  }
};
goog.editor.Field.prototype.setInnerHtml_ = function(html) {
  var field = this.getElement();
  if(field) {
    if(this.usesIframe() && goog.editor.BrowserFeature.MOVES_STYLE_TO_HEAD) {
      var heads = field.ownerDocument.getElementsByTagName("HEAD");
      for(var i = heads.length - 1;i >= 1;--i) {
        heads[i].parentNode.removeChild(heads[i])
      }
    }
  }else {
    field = this.getOriginalElement()
  }
  if(field) {
    this.injectContents(html, field)
  }
};
goog.editor.Field.prototype.turnOnDesignModeGecko = function() {
  var doc = this.getEditableDomHelper().getDocument();
  doc.designMode = "on";
  if(goog.editor.BrowserFeature.HAS_STYLE_WITH_CSS) {
    doc.execCommand("styleWithCSS", false, false)
  }
};
goog.editor.Field.prototype.installStyles = function() {
  if(this.cssStyles && this.shouldLoadAsynchronously()) {
    goog.style.installStyles(this.cssStyles, this.getElement())
  }
};
goog.editor.Field.prototype.dispatchLoadEvent_ = function() {
  var field = this.getElement();
  if(this.workaroundClassName_) {
    goog.dom.classes.add(field, this.workaroundClassName_)
  }
  this.installStyles();
  this.startChangeEvents();
  this.logger.info("Dispatching load " + this.id);
  this.dispatchEvent(goog.editor.Field.EventType.LOAD)
};
goog.editor.Field.prototype.isUneditable = function() {
  return this.loadState_ == goog.editor.Field.LoadState_.UNEDITABLE
};
goog.editor.Field.prototype.isLoaded = function() {
  return this.loadState_ == goog.editor.Field.LoadState_.EDITABLE
};
goog.editor.Field.prototype.isLoading = function() {
  return this.loadState_ == goog.editor.Field.LoadState_.LOADING
};
goog.editor.Field.prototype.focus = function() {
  if(!goog.editor.BrowserFeature.HAS_CONTENT_EDITABLE || goog.userAgent.WEBKIT) {
    this.getEditableDomHelper().getWindow().focus()
  }else {
    if(goog.userAgent.OPERA) {
      var scrollX = this.appWindow_.pageXOffset;
      var scrollY = this.appWindow_.pageYOffset
    }
    this.getElement().focus();
    if(goog.userAgent.OPERA) {
      this.appWindow_.scrollTo(scrollX, scrollY)
    }
  }
};
goog.editor.Field.prototype.focusAndPlaceCursorAtStart = function() {
  if(goog.editor.BrowserFeature.HAS_IE_RANGES || goog.userAgent.WEBKIT) {
    this.placeCursorAtStart()
  }
  this.focus()
};
goog.editor.Field.prototype.placeCursorAtStart = function() {
  var field = this.getElement();
  if(field) {
    var cursorPosition = goog.editor.node.getLeftMostLeaf(field);
    if(field == cursorPosition) {
      goog.dom.Range.createCaret(field, 0).select()
    }else {
      goog.editor.range.placeCursorNextTo(cursorPosition, true)
    }
    this.dispatchSelectionChangeEvent()
  }
};
goog.editor.Field.prototype.makeEditable = function(opt_iframeSrc) {
  this.loadState_ = goog.editor.Field.LoadState_.LOADING;
  var field = this.getOriginalElement();
  this.nodeName = field.nodeName;
  this.savedClassName_ = field.className;
  this.setInitialStyle(field.style.cssText);
  field.className += " editable";
  this.makeEditableInternal(opt_iframeSrc)
};
goog.editor.Field.prototype.makeEditableInternal = function(opt_iframeSrc) {
  this.makeIframeField_(opt_iframeSrc)
};
goog.editor.Field.prototype.handleFieldLoad = function() {
  if(goog.userAgent.IE) {
    goog.dom.Range.clearSelection(this.editableDomHelper.getWindow())
  }
  if(goog.editor.Field.getActiveFieldId() != this.id) {
    this.execCommand(goog.editor.Command.UPDATE_LOREM)
  }
  this.setupChangeListeners_();
  this.dispatchLoadEvent_();
  for(var classId in this.plugins_) {
    this.plugins_[classId].enable(this)
  }
};
goog.editor.Field.prototype.makeUneditable = function(opt_skipRestore) {
  if(this.isUneditable()) {
    throw Error("makeUneditable: Field is already uneditable");
  }
  this.clearDelayedChange();
  this.selectionChangeTimer_.fireIfActive();
  this.execCommand(goog.editor.Command.CLEAR_LOREM);
  var html = null;
  if(!opt_skipRestore && this.getElement()) {
    html = this.getCleanContents()
  }
  this.clearFieldLoadListener_();
  var field = this.getOriginalElement();
  if(goog.editor.Field.getActiveFieldId() == field.id) {
    goog.editor.Field.setActiveFieldId(null)
  }
  this.clearListeners_();
  if(goog.isString(html)) {
    field.innerHTML = html;
    this.resetOriginalElemProperties()
  }
  this.restoreDom();
  this.tearDownFieldObject_();
  if(goog.userAgent.WEBKIT) {
    field.blur()
  }
  this.execCommand(goog.editor.Command.UPDATE_LOREM);
  this.dispatchEvent(goog.editor.Field.EventType.UNLOAD)
};
goog.editor.Field.prototype.restoreDom = function() {
  var field = this.getOriginalElement();
  if(field) {
    var iframe = this.getEditableIframe();
    if(iframe) {
      goog.dom.replaceNode(field, iframe)
    }
  }
};
goog.editor.Field.prototype.shouldLoadAsynchronously = function() {
  if(!goog.isDef(this.isHttps_)) {
    this.isHttps_ = false;
    if(goog.userAgent.IE && this.usesIframe()) {
      var win = this.originalDomHelper.getWindow();
      while(win != win.parent) {
        try {
          win = win.parent
        }catch(e) {
          break
        }
      }
      var loc = win.location;
      this.isHttps_ = loc.protocol == "https:" && loc.search.indexOf("nocheckhttps") == -1
    }
  }
  return this.isHttps_
};
goog.editor.Field.prototype.makeIframeField_ = function(opt_iframeSrc) {
  var field = this.getOriginalElement();
  if(field) {
    var html = field.innerHTML;
    var styles = {};
    html = this.reduceOp_(goog.editor.Plugin.Op.PREPARE_CONTENTS_HTML, html, styles);
    var iframe = this.originalDomHelper.createDom(goog.dom.TagName.IFRAME, this.getIframeAttributes());
    if(this.shouldLoadAsynchronously()) {
      var onLoad = goog.bind(this.iframeFieldLoadHandler, this, iframe, html, styles);
      this.fieldLoadListenerKey_ = goog.events.listen(iframe, goog.events.EventType.LOAD, onLoad, true);
      if(opt_iframeSrc) {
        iframe.src = opt_iframeSrc
      }
    }
    this.attachIframe(iframe);
    if(!this.shouldLoadAsynchronously()) {
      this.iframeFieldLoadHandler(iframe, html, styles)
    }
  }
};
goog.editor.Field.prototype.attachIframe = function(iframe) {
  var field = this.getOriginalElement();
  iframe.className = field.className;
  iframe.id = field.id;
  goog.dom.replaceNode(iframe, field)
};
goog.editor.Field.prototype.getFieldFormatInfo = function(extraStyles) {
  var originalElement = this.getOriginalElement();
  var isStandardsMode = goog.editor.node.isStandardsMode(originalElement);
  return new goog.editor.icontent.FieldFormatInfo(this.id, isStandardsMode, false, false, extraStyles)
};
goog.editor.Field.prototype.writeIframeContent = function(iframe, innerHtml, extraStyles) {
  var formatInfo = this.getFieldFormatInfo(extraStyles);
  if(this.shouldLoadAsynchronously()) {
    var doc = goog.dom.getFrameContentDocument(iframe);
    goog.editor.icontent.writeHttpsInitialIframe(formatInfo, doc, innerHtml)
  }else {
    var styleInfo = new goog.editor.icontent.FieldStyleInfo(this.getElement(), this.cssStyles);
    goog.editor.icontent.writeNormalInitialIframe(formatInfo, innerHtml, styleInfo, iframe)
  }
};
goog.editor.Field.prototype.iframeFieldLoadHandler = function(iframe, innerHtml, styles) {
  this.clearFieldLoadListener_();
  iframe.allowTransparency = "true";
  this.writeIframeContent(iframe, innerHtml, styles);
  var doc = goog.dom.getFrameContentDocument(iframe);
  var body = doc.body;
  this.setupFieldObject(body);
  if(!goog.editor.BrowserFeature.HAS_CONTENT_EDITABLE) {
    this.turnOnDesignModeGecko()
  }
  this.handleFieldLoad()
};
goog.editor.Field.prototype.clearFieldLoadListener_ = function() {
  if(this.fieldLoadListenerKey_) {
    goog.events.unlistenByKey(this.fieldLoadListenerKey_);
    this.fieldLoadListenerKey_ = null
  }
};
goog.editor.Field.prototype.getIframeAttributes = function() {
  var iframeStyle = "padding:0;" + this.getOriginalElement().style.cssText;
  if(!goog.string.endsWith(iframeStyle, ";")) {
    iframeStyle += ";"
  }
  iframeStyle += "background-color:white;";
  if(goog.userAgent.IE) {
    iframeStyle += "overflow:visible;"
  }
  return{"frameBorder":0, "style":iframeStyle}
};
goog.provide("goog.net.Cookies");
goog.provide("goog.net.cookies");
goog.require("goog.userAgent");
goog.net.Cookies = function(context) {
  this.document_ = context
};
goog.net.Cookies.MAX_COOKIE_LENGTH = 3950;
goog.net.Cookies.SPLIT_RE_ = /\s*;\s*/;
goog.net.Cookies.TEST_COOKIE_NAME_ = "COOKIES_TEST_";
goog.net.Cookies.prototype.isEnabled = function() {
  var isEnabled = this.isNavigatorCookieEnabled_();
  if(isEnabled && goog.userAgent.WEBKIT) {
    var cookieName = goog.net.Cookies.TEST_COOKIE_NAME_ + goog.now();
    goog.net.cookies.set(cookieName, "1");
    if(!this.get(cookieName)) {
      return false
    }
    this.remove(cookieName)
  }
  return isEnabled
};
goog.net.Cookies.prototype.isValidName = function(name) {
  return!/[;=\s]/.test(name)
};
goog.net.Cookies.prototype.isValidValue = function(value) {
  return!/[;\r\n]/.test(value)
};
goog.net.Cookies.prototype.set = function(name, value, opt_maxAge, opt_path, opt_domain, opt_secure) {
  if(!this.isValidName(name)) {
    throw Error('Invalid cookie name "' + name + '"');
  }
  if(!this.isValidValue(value)) {
    throw Error('Invalid cookie value "' + value + '"');
  }
  if(!goog.isDef(opt_maxAge)) {
    opt_maxAge = -1
  }
  var domainStr = opt_domain ? ";domain=" + opt_domain : "";
  var pathStr = opt_path ? ";path=" + opt_path : "";
  var secureStr = opt_secure ? ";secure" : "";
  var expiresStr;
  if(opt_maxAge < 0) {
    expiresStr = ""
  }else {
    if(opt_maxAge == 0) {
      var pastDate = new Date(1970, 1, 1);
      expiresStr = ";expires=" + pastDate.toUTCString()
    }else {
      var futureDate = new Date(goog.now() + opt_maxAge * 1E3);
      expiresStr = ";expires=" + futureDate.toUTCString()
    }
  }
  this.setCookie_(name + "=" + value + domainStr + pathStr + expiresStr + secureStr)
};
goog.net.Cookies.prototype.get = function(name, opt_default) {
  var nameEq = name + "=";
  var parts = this.getParts_();
  for(var i = 0, part;part = parts[i];i++) {
    if(part.indexOf(nameEq) == 0) {
      return part.substr(nameEq.length)
    }
  }
  return opt_default
};
goog.net.Cookies.prototype.remove = function(name, opt_path, opt_domain) {
  var rv = this.containsKey(name);
  this.set(name, "", 0, opt_path, opt_domain);
  return rv
};
goog.net.Cookies.prototype.getKeys = function() {
  return this.getKeyValues_().keys
};
goog.net.Cookies.prototype.getValues = function() {
  return this.getKeyValues_().values
};
goog.net.Cookies.prototype.isEmpty = function() {
  return!this.getCookie_()
};
goog.net.Cookies.prototype.getCount = function() {
  var cookie = this.getCookie_();
  if(!cookie) {
    return 0
  }
  return this.getParts_().length
};
goog.net.Cookies.prototype.containsKey = function(key) {
  return goog.isDef(this.get(key))
};
goog.net.Cookies.prototype.containsValue = function(value) {
  var values = this.getKeyValues_().values;
  for(var i = 0;i < values.length;i++) {
    if(values[i] == value) {
      return true
    }
  }
  return false
};
goog.net.Cookies.prototype.clear = function() {
  var keys = this.getKeyValues_().keys;
  for(var i = keys.length - 1;i >= 0;i--) {
    this.remove(keys[i])
  }
};
goog.net.Cookies.prototype.setCookie_ = function(s) {
  this.document_.cookie = s
};
goog.net.Cookies.prototype.getCookie_ = function() {
  return this.document_.cookie
};
goog.net.Cookies.prototype.getParts_ = function() {
  return(this.getCookie_() || "").split(goog.net.Cookies.SPLIT_RE_)
};
goog.net.Cookies.prototype.isNavigatorCookieEnabled_ = function() {
  return navigator.cookieEnabled
};
goog.net.Cookies.prototype.getKeyValues_ = function() {
  var parts = this.getParts_();
  var keys = [], values = [], index, part;
  for(var i = 0;part = parts[i];i++) {
    index = part.indexOf("=");
    if(index == -1) {
      keys.push("");
      values.push(part)
    }else {
      keys.push(part.substring(0, index));
      values.push(part.substring(index + 1))
    }
  }
  return{keys:keys, values:values}
};
goog.net.cookies = new goog.net.Cookies(document);
goog.net.cookies.MAX_COOKIE_LENGTH = goog.net.Cookies.MAX_COOKIE_LENGTH;
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
goog.require("goog.dom");
goog.require("goog.dom.DomHelper");
goog.require("goog.events");
goog.require("goog.events.Event");
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
goog.ui.Component.prototype.renderBefore = function(siblingElement) {
  this.render_(siblingElement.parentNode, siblingElement)
};
goog.ui.Component.prototype.render_ = function(opt_parentElement, opt_beforeElement) {
  if(this.inDocument_) {
    throw Error(goog.ui.Component.Error.ALREADY_RENDERED);
  }
  if(!this.element_) {
    this.createDom()
  }
  if(opt_parentElement) {
    opt_parentElement.insertBefore(this.element_, opt_beforeElement || null)
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
goog.provide("goog.editor.Link");
goog.require("goog.dom");
goog.require("goog.dom.NodeType");
goog.require("goog.dom.Range");
goog.require("goog.editor.BrowserFeature");
goog.require("goog.editor.node");
goog.require("goog.editor.range");
goog.require("goog.string.Unicode");
goog.require("goog.uri.utils");
goog.editor.Link = function(anchor, isNew) {
  this.anchor_ = anchor;
  this.isNew_ = isNew
};
goog.editor.Link.prototype.getAnchor = function() {
  return this.anchor_
};
goog.editor.Link.prototype.getCurrentText = function() {
  if(!this.currentText_) {
    this.currentText_ = goog.dom.getRawTextContent(this.getAnchor())
  }
  return this.currentText_
};
goog.editor.Link.prototype.isNew = function() {
  return this.isNew_
};
goog.editor.Link.prototype.initializeUrl = function(url) {
  this.getAnchor().href = url
};
goog.editor.Link.prototype.removeLink = function() {
  goog.dom.flattenElement(this.anchor_);
  this.anchor_ = null
};
goog.editor.Link.prototype.setTextAndUrl = function(newText, newUrl) {
  var anchor = this.getAnchor();
  anchor.href = newUrl;
  var currentText = this.getCurrentText();
  if(newText != currentText) {
    var leaf = goog.editor.node.getLeftMostLeaf(anchor);
    if(leaf.nodeType == goog.dom.NodeType.TEXT) {
      leaf = leaf.parentNode
    }
    if(goog.dom.getRawTextContent(leaf) != currentText) {
      leaf = anchor
    }
    goog.dom.removeChildren(leaf);
    var domHelper = goog.dom.getDomHelper(leaf);
    goog.dom.appendChild(leaf, domHelper.createTextNode(newText));
    this.currentText_ = null
  }
  this.isNew_ = false
};
goog.editor.Link.prototype.placeCursorRightOf = function() {
  var anchor = this.getAnchor();
  if(goog.editor.BrowserFeature.GETS_STUCK_IN_LINKS) {
    var spaceNode;
    var nextSibling = anchor.nextSibling;
    if(nextSibling && nextSibling.nodeType == goog.dom.NodeType.TEXT && (goog.string.startsWith(nextSibling.data, goog.string.Unicode.NBSP) || goog.string.startsWith(nextSibling.data, " "))) {
      spaceNode = nextSibling
    }else {
      var dh = goog.dom.getDomHelper(anchor);
      spaceNode = dh.createTextNode(goog.string.Unicode.NBSP);
      goog.dom.insertSiblingAfter(spaceNode, anchor)
    }
    var range = goog.dom.Range.createCaret(spaceNode, 1);
    range.select()
  }else {
    goog.editor.range.placeCursorNextTo(anchor, false)
  }
};
goog.editor.Link.createNewLink = function(anchor, url, opt_target) {
  var link = new goog.editor.Link(anchor, true);
  link.initializeUrl(url);
  if(opt_target) {
    anchor.target = opt_target
  }
  return link
};
goog.editor.Link.isLikelyUrl = function(str) {
  if(/\s/.test(str)) {
    return false
  }
  if(goog.editor.Link.isLikelyEmailAddress(str)) {
    return false
  }
  var addedScheme = false;
  if(!/^[^:\/?#.]+:/.test(str)) {
    str = "http://" + str;
    addedScheme = true
  }
  var parts = goog.uri.utils.split(str);
  var scheme = parts[goog.uri.utils.ComponentIndex.SCHEME];
  if(goog.array.indexOf(["mailto", "aim"], scheme) != -1) {
    return true
  }
  var domain = parts[goog.uri.utils.ComponentIndex.DOMAIN];
  if(!domain || addedScheme && domain.indexOf(".") == -1) {
    return false
  }
  var path = parts[goog.uri.utils.ComponentIndex.PATH];
  return!path || path.indexOf("/") == 0
};
goog.editor.Link.LIKELY_EMAIL_ADDRESS_ = new RegExp("^" + "[\\w-]+(\\.[\\w-]+)*" + "\\@" + "([\\w-]+\\.)+" + "(\\d+|\\w\\w+)$", "i");
goog.editor.Link.isLikelyEmailAddress = function(str) {
  return goog.editor.Link.LIKELY_EMAIL_ADDRESS_.test(str)
};
goog.editor.Link.isMailto = function(url) {
  return!!url && goog.string.startsWith(url, "mailto:")
};
goog.provide("goog.editor.plugins.BasicTextFormatter");
goog.provide("goog.editor.plugins.BasicTextFormatter.COMMAND");
goog.require("goog.array");
goog.require("goog.debug.Logger");
goog.require("goog.dom");
goog.require("goog.dom.NodeType");
goog.require("goog.dom.TagName");
goog.require("goog.editor.BrowserFeature");
goog.require("goog.editor.Link");
goog.require("goog.editor.Plugin");
goog.require("goog.editor.node");
goog.require("goog.editor.range");
goog.require("goog.iter");
goog.require("goog.object");
goog.require("goog.string");
goog.require("goog.string.Unicode");
goog.require("goog.style");
goog.require("goog.ui.editor.messages");
goog.require("goog.userAgent");
goog.editor.plugins.BasicTextFormatter = function() {
  goog.editor.Plugin.call(this)
};
goog.inherits(goog.editor.plugins.BasicTextFormatter, goog.editor.Plugin);
goog.editor.plugins.BasicTextFormatter.prototype.getTrogClassId = function() {
  return"BTF"
};
goog.editor.plugins.BasicTextFormatter.prototype.logger = goog.debug.Logger.getLogger("goog.editor.plugins.BasicTextFormatter");
goog.editor.plugins.BasicTextFormatter.COMMAND = {LINK:"+link", FORMAT_BLOCK:"+formatBlock", INDENT:"+indent", OUTDENT:"+outdent", STRIKE_THROUGH:"+strikeThrough", HORIZONTAL_RULE:"+insertHorizontalRule", SUBSCRIPT:"+subscript", SUPERSCRIPT:"+superscript", UNDERLINE:"+underline", BOLD:"+bold", ITALIC:"+italic", FONT_SIZE:"+fontSize", FONT_FACE:"+fontName", FONT_COLOR:"+foreColor", BACKGROUND_COLOR:"+backColor", ORDERED_LIST:"+insertOrderedList", UNORDERED_LIST:"+insertUnorderedList", JUSTIFY_CENTER:"+justifyCenter", 
JUSTIFY_FULL:"+justifyFull", JUSTIFY_RIGHT:"+justifyRight", JUSTIFY_LEFT:"+justifyLeft"};
goog.editor.plugins.BasicTextFormatter.SUPPORTED_COMMANDS_ = goog.object.transpose(goog.editor.plugins.BasicTextFormatter.COMMAND);
goog.editor.plugins.BasicTextFormatter.prototype.isSupportedCommand = function(command) {
  return command in goog.editor.plugins.BasicTextFormatter.SUPPORTED_COMMANDS_
};
goog.editor.plugins.BasicTextFormatter.prototype.getRange_ = function() {
  return this.fieldObject.getRange()
};
goog.editor.plugins.BasicTextFormatter.prototype.getDocument_ = function() {
  return this.getFieldDomHelper().getDocument()
};
goog.editor.plugins.BasicTextFormatter.prototype.execCommandInternal = function(command, var_args) {
  var preserveDir, styleWithCss, needsFormatBlockDiv, hasDummySelection;
  var result;
  var opt_arg = arguments[1];
  switch(command) {
    case goog.editor.plugins.BasicTextFormatter.COMMAND.BACKGROUND_COLOR:
      if(!goog.isNull(opt_arg)) {
        if(goog.editor.BrowserFeature.EATS_EMPTY_BACKGROUND_COLOR) {
          this.applyBgColorManually_(opt_arg)
        }else {
          if(goog.userAgent.OPERA) {
            this.execCommandHelper_("hiliteColor", opt_arg)
          }else {
            this.execCommandHelper_(command, opt_arg)
          }
        }
      }
      break;
    case goog.editor.plugins.BasicTextFormatter.COMMAND.LINK:
      result = this.toggleLink_(opt_arg);
      break;
    case goog.editor.plugins.BasicTextFormatter.COMMAND.JUSTIFY_CENTER:
    ;
    case goog.editor.plugins.BasicTextFormatter.COMMAND.JUSTIFY_FULL:
    ;
    case goog.editor.plugins.BasicTextFormatter.COMMAND.JUSTIFY_RIGHT:
    ;
    case goog.editor.plugins.BasicTextFormatter.COMMAND.JUSTIFY_LEFT:
      this.justify_(command);
      break;
    default:
      if(goog.userAgent.IE && command == goog.editor.plugins.BasicTextFormatter.COMMAND.FORMAT_BLOCK && opt_arg) {
        opt_arg = "<" + opt_arg + ">"
      }
      if(command == goog.editor.plugins.BasicTextFormatter.COMMAND.FONT_COLOR && goog.isNull(opt_arg)) {
        break
      }
      switch(command) {
        case goog.editor.plugins.BasicTextFormatter.COMMAND.INDENT:
        ;
        case goog.editor.plugins.BasicTextFormatter.COMMAND.OUTDENT:
          if(goog.editor.BrowserFeature.HAS_STYLE_WITH_CSS) {
            if(goog.userAgent.GECKO) {
              styleWithCss = true
            }
            if(goog.userAgent.OPERA) {
              if(command == goog.editor.plugins.BasicTextFormatter.COMMAND.OUTDENT) {
                styleWithCss = !this.getDocument_().queryCommandEnabled("outdent")
              }else {
                styleWithCss = true
              }
            }
          }
        ;
        case goog.editor.plugins.BasicTextFormatter.COMMAND.ORDERED_LIST:
        ;
        case goog.editor.plugins.BasicTextFormatter.COMMAND.UNORDERED_LIST:
          if(goog.editor.BrowserFeature.LEAVES_P_WHEN_REMOVING_LISTS && this.queryCommandStateInternal_(this.getDocument_(), command)) {
            needsFormatBlockDiv = this.fieldObject.queryCommandValue(goog.editor.Command.DEFAULT_TAG) != goog.dom.TagName.P
          }else {
            if(!goog.editor.BrowserFeature.CAN_LISTIFY_BR) {
              this.convertBreaksToDivs_()
            }
          }
          if(goog.userAgent.GECKO && goog.editor.BrowserFeature.FORGETS_FORMATTING_WHEN_LISTIFYING && !this.queryCommandValue(command)) {
            hasDummySelection |= this.beforeInsertListGecko_()
          }
        ;
        case goog.editor.plugins.BasicTextFormatter.COMMAND.FORMAT_BLOCK:
          preserveDir = !!this.fieldObject.getPluginByClassId("Bidi");
          break;
        case goog.editor.plugins.BasicTextFormatter.COMMAND.SUBSCRIPT:
        ;
        case goog.editor.plugins.BasicTextFormatter.COMMAND.SUPERSCRIPT:
          if(goog.editor.BrowserFeature.NESTS_SUBSCRIPT_SUPERSCRIPT) {
            this.applySubscriptSuperscriptWorkarounds_(command)
          }
          break;
        case goog.editor.plugins.BasicTextFormatter.COMMAND.UNDERLINE:
        ;
        case goog.editor.plugins.BasicTextFormatter.COMMAND.BOLD:
        ;
        case goog.editor.plugins.BasicTextFormatter.COMMAND.ITALIC:
          styleWithCss = goog.userAgent.GECKO && goog.editor.BrowserFeature.HAS_STYLE_WITH_CSS && this.queryCommandValue(command);
          break;
        case goog.editor.plugins.BasicTextFormatter.COMMAND.FONT_COLOR:
        ;
        case goog.editor.plugins.BasicTextFormatter.COMMAND.FONT_FACE:
          styleWithCss = goog.editor.BrowserFeature.HAS_STYLE_WITH_CSS && goog.userAgent.GECKO
      }
      this.execCommandHelper_(command, opt_arg, preserveDir, styleWithCss);
      if(hasDummySelection) {
        this.getDocument_().execCommand("Delete", false, true)
      }
      if(needsFormatBlockDiv) {
        this.getDocument_().execCommand("FormatBlock", false, "<div>")
      }
  }
  if(goog.userAgent.GECKO && !this.fieldObject.inModalMode()) {
    this.focusField_()
  }
  return result
};
goog.editor.plugins.BasicTextFormatter.prototype.focusField_ = function() {
  this.getFieldDomHelper().getWindow().focus()
};
goog.editor.plugins.BasicTextFormatter.prototype.queryCommandValue = function(command) {
  var styleWithCss;
  switch(command) {
    case goog.editor.plugins.BasicTextFormatter.COMMAND.LINK:
      return this.isNodeInState_(goog.dom.TagName.A);
    case goog.editor.plugins.BasicTextFormatter.COMMAND.JUSTIFY_CENTER:
    ;
    case goog.editor.plugins.BasicTextFormatter.COMMAND.JUSTIFY_FULL:
    ;
    case goog.editor.plugins.BasicTextFormatter.COMMAND.JUSTIFY_RIGHT:
    ;
    case goog.editor.plugins.BasicTextFormatter.COMMAND.JUSTIFY_LEFT:
      return this.isJustification_(command);
    case goog.editor.plugins.BasicTextFormatter.COMMAND.FORMAT_BLOCK:
      return goog.editor.plugins.BasicTextFormatter.getSelectionBlockState_(this.fieldObject.getRange());
    case goog.editor.plugins.BasicTextFormatter.COMMAND.INDENT:
    ;
    case goog.editor.plugins.BasicTextFormatter.COMMAND.OUTDENT:
    ;
    case goog.editor.plugins.BasicTextFormatter.COMMAND.HORIZONTAL_RULE:
      return false;
    case goog.editor.plugins.BasicTextFormatter.COMMAND.FONT_SIZE:
    ;
    case goog.editor.plugins.BasicTextFormatter.COMMAND.FONT_FACE:
    ;
    case goog.editor.plugins.BasicTextFormatter.COMMAND.FONT_COLOR:
    ;
    case goog.editor.plugins.BasicTextFormatter.COMMAND.BACKGROUND_COLOR:
      return this.queryCommandValueInternal_(this.getDocument_(), command, goog.editor.BrowserFeature.HAS_STYLE_WITH_CSS && goog.userAgent.GECKO);
    case goog.editor.plugins.BasicTextFormatter.COMMAND.UNDERLINE:
    ;
    case goog.editor.plugins.BasicTextFormatter.COMMAND.BOLD:
    ;
    case goog.editor.plugins.BasicTextFormatter.COMMAND.ITALIC:
      styleWithCss = goog.editor.BrowserFeature.HAS_STYLE_WITH_CSS && goog.userAgent.GECKO;
    default:
      return this.queryCommandStateInternal_(this.getDocument_(), command, styleWithCss)
  }
};
goog.editor.plugins.BasicTextFormatter.prototype.prepareContentsHtml = function(html) {
  if(goog.editor.BrowserFeature.COLLAPSES_EMPTY_NODES && html.match(/^\s*<script/i)) {
    html = "&nbsp;" + html
  }
  if(goog.editor.BrowserFeature.CONVERT_TO_B_AND_I_TAGS) {
    html = html.replace(/<(\/?)strong([^\w])/gi, "<$1b$2");
    html = html.replace(/<(\/?)em([^\w])/gi, "<$1i$2")
  }
  return html
};
goog.editor.plugins.BasicTextFormatter.prototype.cleanContentsDom = function(fieldCopy) {
  var images = fieldCopy.getElementsByTagName(goog.dom.TagName.IMG);
  for(var i = 0, image;image = images[i];i++) {
    if(goog.editor.BrowserFeature.SHOWS_CUSTOM_ATTRS_IN_INNER_HTML) {
      image.removeAttribute("tabIndex");
      image.removeAttribute("tabIndexSet");
      goog.removeUid(image);
      image.oldTabIndex;
      if(image.oldTabIndex) {
        image.tabIndex = image.oldTabIndex
      }
    }
  }
};
goog.editor.plugins.BasicTextFormatter.prototype.cleanContentsHtml = function(html) {
  if(goog.editor.BrowserFeature.MOVES_STYLE_TO_HEAD) {
    var heads = this.fieldObject.getEditableDomHelper().getElementsByTagNameAndClass(goog.dom.TagName.HEAD);
    var stylesHtmlArr = [];
    var numHeads = heads.length;
    for(var i = 1;i < numHeads;++i) {
      var styles = heads[i].getElementsByTagName(goog.dom.TagName.STYLE);
      var numStyles = styles.length;
      for(var j = 0;j < numStyles;++j) {
        stylesHtmlArr.push(styles[j].outerHTML)
      }
    }
    return stylesHtmlArr.join("") + html
  }
  return html
};
goog.editor.plugins.BasicTextFormatter.prototype.handleKeyboardShortcut = function(e, key, isModifierPressed) {
  if(!isModifierPressed) {
    return false
  }
  var command;
  switch(key) {
    case "b":
      command = goog.editor.plugins.BasicTextFormatter.COMMAND.BOLD;
      break;
    case "i":
      command = goog.editor.plugins.BasicTextFormatter.COMMAND.ITALIC;
      break;
    case "u":
      command = goog.editor.plugins.BasicTextFormatter.COMMAND.UNDERLINE;
      break;
    case "s":
      return true
  }
  if(command) {
    this.fieldObject.execCommand(command);
    return true
  }
  return false
};
goog.editor.plugins.BasicTextFormatter.BR_REGEXP_ = goog.userAgent.IE ? /<br([^\/>]*)\/?>/gi : /<br([^\/>]*)\/?>(?!<\/(div|p)>)/gi;
goog.editor.plugins.BasicTextFormatter.prototype.convertBreaksToDivs_ = function() {
  if(!goog.userAgent.IE && !goog.userAgent.OPERA) {
    return false
  }
  var range = this.getRange_();
  var parent = range.getContainerElement();
  var doc = this.getDocument_();
  goog.editor.plugins.BasicTextFormatter.BR_REGEXP_.lastIndex = 0;
  if(goog.editor.plugins.BasicTextFormatter.BR_REGEXP_.test(parent.innerHTML)) {
    var savedRange = range.saveUsingCarets();
    if(parent.tagName == goog.dom.TagName.P) {
      goog.editor.plugins.BasicTextFormatter.convertParagraphToDiv_(parent, true)
    }else {
      var attribute = "trtempbr";
      var value = "temp_br";
      parent.innerHTML = parent.innerHTML.replace(goog.editor.plugins.BasicTextFormatter.BR_REGEXP_, "<p$1 " + attribute + '="' + value + '">');
      var paragraphs = goog.array.toArray(parent.getElementsByTagName(goog.dom.TagName.P));
      goog.iter.forEach(paragraphs, function(paragraph) {
        if(paragraph.getAttribute(attribute) == value) {
          paragraph.removeAttribute(attribute);
          if(goog.string.isBreakingWhitespace(goog.dom.getTextContent(paragraph))) {
            var child = goog.userAgent.IE ? doc.createTextNode(goog.string.Unicode.NBSP) : doc.createElement(goog.dom.TagName.BR);
            paragraph.appendChild(child)
          }
          goog.editor.plugins.BasicTextFormatter.convertParagraphToDiv_(paragraph)
        }
      })
    }
    savedRange.restore();
    return true
  }
  return false
};
goog.editor.plugins.BasicTextFormatter.convertParagraphToDiv_ = function(paragraph, opt_convertBrs) {
  if(!goog.userAgent.IE && !goog.userAgent.OPERA) {
    return
  }
  var outerHTML = paragraph.outerHTML.replace(/<(\/?)p/gi, "<$1div");
  if(opt_convertBrs) {
    outerHTML = outerHTML.replace(goog.editor.plugins.BasicTextFormatter.BR_REGEXP_, "</div><div$1>")
  }
  if(goog.userAgent.OPERA && !/<\/div>$/i.test(outerHTML)) {
    outerHTML += "</div>"
  }
  paragraph.outerHTML = outerHTML
};
goog.editor.plugins.BasicTextFormatter.convertToRealExecCommand_ = function(command) {
  return command.indexOf("+") == 0 ? command.substring(1) : command
};
goog.editor.plugins.BasicTextFormatter.prototype.justify_ = function(command) {
  this.execCommandHelper_(command, null, false, true);
  if(goog.userAgent.GECKO) {
    this.execCommandHelper_(command, null, false, true)
  }
  if(!(goog.editor.BrowserFeature.HAS_STYLE_WITH_CSS && goog.userAgent.GECKO)) {
    goog.iter.forEach(this.fieldObject.getRange(), goog.editor.plugins.BasicTextFormatter.convertContainerToTextAlign_)
  }
};
goog.editor.plugins.BasicTextFormatter.convertContainerToTextAlign_ = function(node) {
  var container = goog.editor.style.getContainer(node);
  if(container.align) {
    container.style.textAlign = container.align;
    container.removeAttribute("align")
  }
};
goog.editor.plugins.BasicTextFormatter.prototype.execCommandHelper_ = function(command, opt_value, opt_preserveDir, opt_styleWithCss) {
  var dir = null;
  if(opt_preserveDir) {
    dir = this.fieldObject.queryCommandValue(goog.editor.Command.DIR_RTL) ? "rtl" : this.fieldObject.queryCommandValue(goog.editor.Command.DIR_LTR) ? "ltr" : null
  }
  command = goog.editor.plugins.BasicTextFormatter.convertToRealExecCommand_(command);
  var endDiv, nbsp;
  if(goog.userAgent.IE) {
    var ret = this.applyExecCommandIEFixes_(command);
    endDiv = ret[0];
    nbsp = ret[1]
  }
  if(goog.userAgent.WEBKIT) {
    endDiv = this.applyExecCommandSafariFixes_(command)
  }
  if(goog.userAgent.GECKO) {
    this.applyExecCommandGeckoFixes_(command)
  }
  if(goog.editor.BrowserFeature.DOESNT_OVERRIDE_FONT_SIZE_IN_STYLE_ATTR && command.toLowerCase() == "fontsize") {
    this.removeFontSizeFromStyleAttrs_()
  }
  var doc = this.getDocument_();
  if(opt_styleWithCss && goog.editor.BrowserFeature.HAS_STYLE_WITH_CSS) {
    doc.execCommand("styleWithCSS", false, true);
    if(goog.userAgent.OPERA) {
      this.invalidateInlineCss_()
    }
  }
  doc.execCommand(command, false, opt_value);
  if(opt_styleWithCss && goog.editor.BrowserFeature.HAS_STYLE_WITH_CSS) {
    doc.execCommand("styleWithCSS", false, false)
  }
  if(goog.userAgent.WEBKIT && !goog.userAgent.isVersion("526") && command.toLowerCase() == "formatblock" && opt_value && /^[<]?h\d[>]?$/i.test(opt_value)) {
    this.cleanUpSafariHeadings_()
  }
  if(/insert(un)?orderedlist/i.test(command)) {
    if(goog.userAgent.WEBKIT) {
      this.fixSafariLists_()
    }
    if(goog.userAgent.IE) {
      this.fixIELists_();
      if(nbsp) {
        goog.dom.removeNode(nbsp)
      }
    }
  }
  if(endDiv) {
    goog.dom.removeNode(endDiv)
  }
  if(dir) {
    this.fieldObject.execCommand(dir)
  }
};
goog.editor.plugins.BasicTextFormatter.prototype.applyBgColorManually_ = function(bgColor) {
  var needsSpaceInTextNode = goog.userAgent.GECKO;
  var range = this.fieldObject.getRange();
  var textNode;
  var parentTag;
  if(range && range.isCollapsed()) {
    textNode = this.getFieldDomHelper().createTextNode(needsSpaceInTextNode ? " " : "");
    var containerNode = range.getStartNode();
    parentTag = containerNode.nodeType == goog.dom.NodeType.ELEMENT ? containerNode : containerNode.parentNode;
    if(parentTag.innerHTML == "") {
      parentTag.style.textIndent = "-10000px";
      parentTag.appendChild(textNode)
    }else {
      parentTag = this.getFieldDomHelper().createDom("span", {"style":"text-indent:-10000px"}, textNode);
      range.replaceContentsWithNode(parentTag)
    }
    goog.dom.Range.createFromNodeContents(textNode).select()
  }
  this.execCommandHelper_("hiliteColor", bgColor, false, true);
  if(textNode) {
    if(needsSpaceInTextNode) {
      textNode.data = ""
    }
    parentTag.style.textIndent = ""
  }
};
goog.editor.plugins.BasicTextFormatter.prototype.toggleLink_ = function(opt_target) {
  if(!this.fieldObject.isSelectionEditable()) {
    this.focusField_()
  }
  var range = this.getRange_();
  var parent = range && range.getContainerElement();
  var link = goog.dom.getAncestorByTagNameAndClass(parent, goog.dom.TagName.A);
  if(link && goog.editor.node.isEditable(link)) {
    goog.dom.flattenElement(link)
  }else {
    var editableLink = this.createLink_(range, "/", opt_target);
    if(editableLink) {
      if(!this.fieldObject.execCommand(goog.editor.Command.MODAL_LINK_EDITOR, editableLink)) {
        var url = this.fieldObject.getAppWindow().prompt(goog.ui.editor.messages.MSG_LINK_TO, "http://");
        if(url) {
          editableLink.setTextAndUrl(editableLink.getCurrentText() || url, url);
          editableLink.placeCursorRightOf()
        }else {
          var savedRange = goog.editor.range.saveUsingNormalizedCarets(goog.dom.Range.createFromNodeContents(editableLink.getAnchor()));
          editableLink.removeLink();
          savedRange.restore().select();
          return null
        }
      }
      return editableLink
    }
  }
  return null
};
goog.editor.plugins.BasicTextFormatter.prototype.createLink_ = function(range, url, opt_target) {
  var anchor = null;
  var parent = range && range.getContainerElement();
  if(parent && parent.tagName == goog.dom.TagName.IMG) {
    return null
  }
  if(range && range.isCollapsed()) {
    var textRange = range.getTextRange(0).getBrowserRangeObject();
    if(goog.editor.BrowserFeature.HAS_W3C_RANGES) {
      anchor = this.getFieldDomHelper().createElement(goog.dom.TagName.A);
      textRange.insertNode(anchor)
    }else {
      if(goog.editor.BrowserFeature.HAS_IE_RANGES) {
        textRange.pasteHTML("<a id='newLink'></a>");
        anchor = this.getFieldDomHelper().getElement("newLink");
        anchor.removeAttribute("id")
      }
    }
  }else {
    var uniqueId = goog.string.createUniqueString();
    this.execCommandHelper_("CreateLink", uniqueId);
    var setHrefAndLink = function(element, index, arr) {
      if(goog.string.endsWith(element.href, uniqueId)) {
        anchor = element
      }
    };
    goog.array.forEach(this.fieldObject.getElement().getElementsByTagName(goog.dom.TagName.A), setHrefAndLink)
  }
  return goog.editor.Link.createNewLink(anchor, url, opt_target)
};
goog.editor.plugins.BasicTextFormatter.brokenExecCommandsIE_ = {"indent":1, "outdent":1, "insertOrderedList":1, "insertUnorderedList":1, "justifyCenter":1, "justifyFull":1, "justifyRight":1, "justifyLeft":1, "ltr":1, "rtl":1};
goog.editor.plugins.BasicTextFormatter.blockquoteHatingCommandsIE_ = {"insertOrderedList":1, "insertUnorderedList":1};
goog.editor.plugins.BasicTextFormatter.prototype.applySubscriptSuperscriptWorkarounds_ = function(command) {
  if(!this.queryCommandValue(command)) {
    var oppositeCommand = command == goog.editor.plugins.BasicTextFormatter.COMMAND.SUBSCRIPT ? goog.editor.plugins.BasicTextFormatter.COMMAND.SUPERSCRIPT : goog.editor.plugins.BasicTextFormatter.COMMAND.SUBSCRIPT;
    var oppositeExecCommand = goog.editor.plugins.BasicTextFormatter.convertToRealExecCommand_(oppositeCommand);
    if(!this.queryCommandValue(oppositeCommand)) {
      this.getDocument_().execCommand(oppositeExecCommand, false, null)
    }
    this.getDocument_().execCommand(oppositeExecCommand, false, null)
  }
};
goog.editor.plugins.BasicTextFormatter.prototype.removeFontSizeFromStyleAttrs_ = function() {
  var range = goog.editor.range.expand(this.fieldObject.getRange(), this.fieldObject.getElement());
  goog.iter.forEach(goog.iter.filter(range, function(tag, dummy, iter) {
    return iter.isStartTag() && range.containsNode(tag)
  }), function(node) {
    goog.style.setStyle(node, "font-size", "");
    if(goog.userAgent.GECKO && node.style.length == 0 && node.getAttribute("style") != null) {
      node.removeAttribute("style")
    }
  })
};
goog.editor.plugins.BasicTextFormatter.prototype.applyExecCommandIEFixes_ = function(command) {
  var toRemove = [];
  var endDiv = null;
  var range = this.getRange_();
  var dh = this.getFieldDomHelper();
  if(command in goog.editor.plugins.BasicTextFormatter.blockquoteHatingCommandsIE_) {
    var parent = range && range.getContainerElement();
    if(parent) {
      var blockquotes = goog.dom.getElementsByTagNameAndClass(goog.dom.TagName.BLOCKQUOTE, null, parent);
      var bq;
      for(var i = 0;i < blockquotes.length;i++) {
        if(range.containsNode(blockquotes[i])) {
          bq = blockquotes[i];
          break
        }
      }
      var bqThatNeedsDummyDiv = bq || goog.dom.getAncestorByTagNameAndClass(parent, "BLOCKQUOTE");
      if(bqThatNeedsDummyDiv) {
        endDiv = dh.createDom("div", {style:"height:0"});
        goog.dom.appendChild(bqThatNeedsDummyDiv, endDiv);
        toRemove.push(endDiv);
        if(bq) {
          range = goog.dom.Range.createFromNodes(bq, 0, endDiv, 0)
        }else {
          if(range.containsNode(endDiv)) {
            range = goog.dom.Range.createFromNodes(range.getStartNode(), range.getStartOffset(), endDiv, 0)
          }
        }
        range.select()
      }
    }
  }
  var fieldObject = this.fieldObject;
  if(!fieldObject.usesIframe() && !endDiv) {
    if(command in goog.editor.plugins.BasicTextFormatter.brokenExecCommandsIE_) {
      var field = fieldObject.getElement();
      if(range && range.isCollapsed() && !goog.dom.getFirstElementChild(field)) {
        var selection = range.getTextRange(0).getBrowserRangeObject();
        var testRange = selection.duplicate();
        testRange.moveToElementText(field);
        testRange.collapse(false);
        if(testRange.isEqual(selection)) {
          var nbsp = dh.createTextNode(goog.string.Unicode.NBSP);
          field.appendChild(nbsp);
          selection.move("character", 1);
          selection.move("character", -1);
          selection.select();
          toRemove.push(nbsp)
        }
      }
      endDiv = dh.createDom("div", {style:"height:0"});
      goog.dom.appendChild(field, endDiv);
      toRemove.push(endDiv)
    }
  }
  return toRemove
};
goog.editor.plugins.BasicTextFormatter.prototype.cleanUpSafariHeadings_ = function() {
  goog.iter.forEach(this.getRange_(), function(node) {
    if(node.className == "Apple-style-span") {
      node.style.fontSize = "";
      node.style.fontWeight = ""
    }
  })
};
goog.editor.plugins.BasicTextFormatter.prototype.fixSafariLists_ = function() {
  var previousList = false;
  goog.iter.forEach(this.getRange_(), function(node) {
    var tagName = node.tagName;
    if(tagName == goog.dom.TagName.UL || tagName == goog.dom.TagName.OL) {
      if(!previousList) {
        previousList = true;
        return
      }
      var previousElementSibling = goog.dom.getPreviousElementSibling(node);
      if(!previousElementSibling) {
        return
      }
      var range = node.ownerDocument.createRange();
      range.setStartAfter(previousElementSibling);
      range.setEndBefore(node);
      if(!goog.string.isEmpty(range.toString())) {
        return
      }
      if(previousElementSibling.nodeName == node.nodeName) {
        while(previousElementSibling.lastChild) {
          node.insertBefore(previousElementSibling.lastChild, node.firstChild)
        }
        previousElementSibling.parentNode.removeChild(previousElementSibling)
      }
    }
  })
};
goog.editor.plugins.BasicTextFormatter.orderedListTypes_ = {1:1, "a":1, "A":1, "i":1, "I":1};
goog.editor.plugins.BasicTextFormatter.unorderedListTypes_ = {"disc":1, "circle":1, "square":1};
goog.editor.plugins.BasicTextFormatter.prototype.fixIELists_ = function() {
  var range = this.getRange_();
  var container = range && range.getContainer();
  while(container && container.tagName != goog.dom.TagName.UL && container.tagName != goog.dom.TagName.OL) {
    container = container.parentNode
  }
  if(container) {
    container = container.parentNode
  }
  if(!container) {
    return
  }
  var lists = goog.array.toArray(container.getElementsByTagName(goog.dom.TagName.UL));
  goog.array.extend(lists, goog.array.toArray(container.getElementsByTagName(goog.dom.TagName.OL)));
  goog.array.forEach(lists, function(node) {
    var type = node.type;
    if(type) {
      var saneTypes = node.tagName == goog.dom.TagName.UL ? goog.editor.plugins.BasicTextFormatter.unorderedListTypes_ : goog.editor.plugins.BasicTextFormatter.orderedListTypes_;
      if(!saneTypes[type]) {
        node.type = ""
      }
    }
  })
};
goog.editor.plugins.BasicTextFormatter.brokenExecCommandsSafari_ = {"justifyCenter":1, "justifyFull":1, "justifyRight":1, "justifyLeft":1, "formatBlock":1};
goog.editor.plugins.BasicTextFormatter.hangingExecCommandWebkit_ = {"insertOrderedList":1, "insertUnorderedList":1};
goog.editor.plugins.BasicTextFormatter.prototype.applyExecCommandSafariFixes_ = function(command) {
  var div;
  if(goog.editor.plugins.BasicTextFormatter.brokenExecCommandsSafari_[command]) {
    div = this.getFieldDomHelper().createDom("div", {"style":"height: 0"}, "x");
    goog.dom.appendChild(this.fieldObject.getElement(), div)
  }
  if(goog.editor.plugins.BasicTextFormatter.hangingExecCommandWebkit_[command]) {
    var field = this.fieldObject.getElement();
    div = this.getFieldDomHelper().createDom("div", {"style":"height: 0"}, "x");
    field.insertBefore(div, field.firstChild)
  }
  return div
};
goog.editor.plugins.BasicTextFormatter.prototype.applyExecCommandGeckoFixes_ = function(command) {
  if(goog.userAgent.isVersion("1.9") && command.toLowerCase() == "formatblock") {
    var range = this.getRange_();
    var startNode = range.getStartNode();
    if(range.isCollapsed() && startNode && startNode.tagName == goog.dom.TagName.BODY) {
      var startOffset = range.getStartOffset();
      var childNode = startNode.childNodes[startOffset];
      if(childNode && childNode.tagName == goog.dom.TagName.BR) {
        var browserRange = range.getBrowserRangeObject();
        browserRange.setStart(childNode, 0);
        browserRange.setEnd(childNode, 0)
      }
    }
  }
};
goog.editor.plugins.BasicTextFormatter.prototype.invalidateInlineCss_ = function() {
  var ancestors = [];
  var ancestor = this.fieldObject.getRange().getContainerElement();
  do {
    ancestors.push(ancestor)
  }while(ancestor = ancestor.parentNode);
  var nodesInSelection = goog.iter.chain(goog.iter.toIterator(this.fieldObject.getRange()), goog.iter.toIterator(ancestors));
  var containersInSelection = goog.iter.filter(nodesInSelection, goog.editor.style.isContainer);
  goog.iter.forEach(containersInSelection, function(element) {
    var oldOutline = element.style.outline;
    element.style.outline = "0px solid red";
    element.style.outline = oldOutline
  })
};
goog.editor.plugins.BasicTextFormatter.prototype.beforeInsertListGecko_ = function() {
  var tag = this.fieldObject.queryCommandValue(goog.editor.Command.DEFAULT_TAG);
  if(tag == goog.dom.TagName.P || tag == goog.dom.TagName.DIV) {
    return false
  }
  var range = this.getRange_();
  if(range.isCollapsed() && range.getContainer().nodeType != goog.dom.NodeType.TEXT) {
    var tempTextNode = this.getFieldDomHelper().createTextNode(goog.string.Unicode.NBSP);
    range.insertNode(tempTextNode, false);
    goog.dom.Range.createFromNodeContents(tempTextNode).select();
    return true
  }
  return false
};
goog.editor.plugins.BasicTextFormatter.getSelectionBlockState_ = function(range) {
  var tagName = null;
  goog.iter.forEach(range, function(node, ignore, it) {
    if(!it.isEndTag()) {
      var container = goog.editor.style.getContainer(node);
      var thisTagName = container.tagName;
      tagName = tagName || thisTagName;
      if(tagName != thisTagName) {
        tagName = null;
        throw goog.iter.StopIteration;
      }
      it.skipTag()
    }
  });
  return tagName
};
goog.editor.plugins.BasicTextFormatter.SUPPORTED_JUSTIFICATIONS_ = {"center":1, "justify":1, "right":1, "left":1};
goog.editor.plugins.BasicTextFormatter.prototype.isJustification_ = function(command) {
  var alignment = command.replace("+justify", "").toLowerCase();
  if(alignment == "full") {
    alignment = "justify"
  }
  var bidiPlugin = this.fieldObject.getPluginByClassId("Bidi");
  if(bidiPlugin) {
    bidiPlugin.getSelectionAlignment;
    return alignment == bidiPlugin.getSelectionAlignment()
  }else {
    var range = this.getRange_();
    if(!range) {
      return false
    }
    var parent = range.getContainerElement();
    var nodes = goog.array.filter(parent.childNodes, function(node) {
      return goog.editor.node.isImportant(node) && range.containsNode(node, true)
    });
    nodes = nodes.length ? nodes : [parent];
    for(var i = 0;i < nodes.length;i++) {
      var current = nodes[i];
      var container = goog.editor.style.getContainer(current);
      if(alignment != goog.editor.plugins.BasicTextFormatter.getNodeJustification_(container)) {
        return false
      }
    }
    return true
  }
};
goog.editor.plugins.BasicTextFormatter.getNodeJustification_ = function(element) {
  var value = goog.style.getComputedTextAlign(element);
  value = value.replace(/^-(moz|webkit)-/, "");
  if(!goog.editor.plugins.BasicTextFormatter.SUPPORTED_JUSTIFICATIONS_[value]) {
    value = element.align || "left"
  }
  return value
};
goog.editor.plugins.BasicTextFormatter.prototype.isNodeInState_ = function(nodeName) {
  var range = this.getRange_();
  var node = range && range.getContainerElement();
  var ancestor = goog.dom.getAncestorByTagNameAndClass(node, nodeName);
  return!!ancestor && goog.editor.node.isEditable(ancestor)
};
goog.editor.plugins.BasicTextFormatter.prototype.queryCommandStateInternal_ = function(queryObject, command, opt_styleWithCss) {
  return this.queryCommandHelper_(true, queryObject, command, opt_styleWithCss)
};
goog.editor.plugins.BasicTextFormatter.prototype.queryCommandValueInternal_ = function(queryObject, command, opt_styleWithCss) {
  return this.queryCommandHelper_(false, queryObject, command, opt_styleWithCss)
};
goog.editor.plugins.BasicTextFormatter.prototype.queryCommandHelper_ = function(isGetQueryCommandState, queryObject, command, opt_styleWithCss) {
  command = goog.editor.plugins.BasicTextFormatter.convertToRealExecCommand_(command);
  if(opt_styleWithCss) {
    var doc = this.getDocument_();
    doc.execCommand("styleWithCSS", false, true)
  }
  var ret = isGetQueryCommandState ? queryObject.queryCommandState(command) : queryObject.queryCommandValue(command);
  if(opt_styleWithCss) {
    doc.execCommand("styleWithCSS", false, false)
  }
  return ret
};
goog.provide("goog.editor.SeamlessField");
goog.require("goog.cssom.iframe.style");
goog.require("goog.debug.Logger");
goog.require("goog.dom");
goog.require("goog.dom.Range");
goog.require("goog.dom.TagName");
goog.require("goog.editor.BrowserFeature");
goog.require("goog.editor.Field");
goog.require("goog.editor.Field.EventType");
goog.require("goog.editor.icontent");
goog.require("goog.editor.icontent.FieldFormatInfo");
goog.require("goog.editor.icontent.FieldStyleInfo");
goog.require("goog.editor.node");
goog.require("goog.events");
goog.require("goog.events.EventType");
goog.require("goog.style");
goog.editor.SeamlessField = function(id, opt_doc) {
  goog.editor.Field.call(this, id, opt_doc)
};
goog.inherits(goog.editor.SeamlessField, goog.editor.Field);
goog.editor.SeamlessField.prototype.logger = goog.debug.Logger.getLogger("goog.editor.SeamlessField");
goog.editor.SeamlessField.prototype.listenForDragOverEventKey_;
goog.editor.SeamlessField.prototype.setMinHeight = function(height) {
  if(height == this.minHeight_) {
    return
  }
  this.minHeight_ = height;
  if(this.usesIframe()) {
    this.doFieldSizingGecko()
  }
};
goog.editor.SeamlessField.prototype.isFixedHeight_ = false;
goog.editor.SeamlessField.prototype.isFixedHeightOverridden_ = false;
goog.editor.SeamlessField.prototype.isFixedHeight = function() {
  return this.isFixedHeight_
};
goog.editor.SeamlessField.prototype.overrideFixedHeight = function(newVal) {
  this.isFixedHeight_ = newVal;
  this.isFixedHeightOverridden_ = true
};
goog.editor.SeamlessField.prototype.autoDetectFixedHeight_ = function() {
  if(!this.isFixedHeightOverridden_) {
    var originalElement = this.getOriginalElement();
    if(originalElement) {
      this.isFixedHeight_ = goog.style.getComputedOverflowY(originalElement) == "auto"
    }
  }
};
goog.editor.SeamlessField.prototype.handleOuterDocChange_ = function() {
  if(this.isEventStopped(goog.editor.Field.EventType.CHANGE)) {
    return
  }
  this.sizeIframeToWrapperGecko_()
};
goog.editor.SeamlessField.prototype.sizeIframeToBodyHeightGecko_ = function() {
  if(this.acquireSizeIframeLockGecko_()) {
    var ifr = this.getEditableIframe();
    var fieldHeight = this.getIframeBodyHeightGecko_();
    if(this.minHeight_) {
      fieldHeight = Math.max(fieldHeight, this.minHeight_)
    }
    if(parseInt(goog.style.getStyle(ifr, "height"), 10) != fieldHeight) {
      ifr.style.height = fieldHeight + "px"
    }
    this.releaseSizeIframeLockGecko_()
  }
};
goog.editor.SeamlessField.prototype.getIframeBodyHeightGecko_ = function() {
  var ifr = this.getEditableIframe();
  var body = ifr.contentDocument.body;
  var htmlElement = body.parentNode;
  if(parseInt(goog.style.getStyle(ifr, "height"), 10) === 0) {
    goog.style.setStyle(ifr, "height", 1 + "px")
  }
  var fieldHeight;
  if(goog.editor.node.isStandardsMode(body)) {
    fieldHeight = htmlElement.offsetHeight
  }else {
    fieldHeight = htmlElement.scrollHeight;
    if(htmlElement.clientHeight != htmlElement.offsetHeight) {
      fieldHeight += goog.editor.SeamlessField.getScrollbarThickness_()
    }
  }
  return fieldHeight
};
goog.editor.SeamlessField.getScrollbarThickness_ = function() {
  if(!goog.editor.SeamlessField.scrollbarThickness_) {
    var div = goog.dom.createDom("div", {"style":"overflow:scroll;position:absolute;visibility:hidden;"});
    goog.dom.appendChild(goog.dom.getDocument().body, div);
    goog.editor.SeamlessField.scrollbarThickness_ = div.offsetWidth - div.clientWidth;
    goog.dom.removeNode(div)
  }
  return goog.editor.SeamlessField.scrollbarThickness_
};
goog.editor.SeamlessField.prototype.sizeIframeToWrapperGecko_ = function() {
  if(this.acquireSizeIframeLockGecko_()) {
    var ifr = this.getEditableIframe();
    var field = this.getElement();
    if(field) {
      var fieldPaddingBox = goog.style.getPaddingBox(field);
      var widthDiv = ifr.parentNode;
      var width = widthDiv.offsetWidth;
      if(parseInt(goog.style.getStyle(ifr, "width"), 10) != width) {
        ifr.style.width = width + "px";
        field.style.width = width - fieldPaddingBox.left - fieldPaddingBox.right + "px"
      }
      var height = widthDiv.offsetHeight;
      if(this.isFixedHeight() && parseInt(goog.style.getStyle(ifr, "height"), 10) != height) {
        ifr.style.height = height + "px";
        field.style.height = height - fieldPaddingBox.top - fieldPaddingBox.bottom + "px"
      }
      this.releaseSizeIframeLockGecko_()
    }
  }
};
goog.editor.SeamlessField.prototype.doFieldSizingGecko = function() {
  if(this.getElement()) {
    this.sizeIframeToWrapperGecko_();
    if(!this.isFixedHeight()) {
      this.sizeIframeToBodyHeightGecko_()
    }
  }
};
goog.editor.SeamlessField.prototype.acquireSizeIframeLockGecko_ = function() {
  if(this.sizeIframeLock_) {
    return false
  }
  return this.sizeIframeLock_ = true
};
goog.editor.SeamlessField.prototype.releaseSizeIframeLockGecko_ = function() {
  this.sizeIframeLock_ = false
};
goog.editor.SeamlessField.prototype.iframeableCss_ = "";
goog.editor.SeamlessField.prototype.getIframeableCss = function(opt_forceRegeneration) {
  if(!this.iframeableCss_ || opt_forceRegeneration) {
    var originalElement = this.getOriginalElement();
    if(originalElement) {
      this.iframeableCss_ = goog.cssom.iframe.style.getElementContext(originalElement, opt_forceRegeneration)
    }
  }
  return this.iframeableCss_
};
goog.editor.SeamlessField.prototype.setIframeableCss = function(iframeableCss) {
  this.iframeableCss_ = iframeableCss
};
goog.editor.SeamlessField.haveInstalledCss_ = false;
goog.editor.SeamlessField.prototype.inheritBlendedCSS = function() {
  if(!this.usesIframe()) {
    return
  }
  var field = this.getElement();
  var head = goog.dom.getDomHelper(field).getElementsByTagNameAndClass("head")[0];
  if(head) {
    goog.dom.removeChildren(head)
  }
  var newCSS = this.getIframeableCss(true);
  goog.style.installStyles(newCSS, field)
};
goog.editor.SeamlessField.prototype.usesIframe = function() {
  return!goog.editor.BrowserFeature.HAS_CONTENT_EDITABLE
};
goog.editor.SeamlessField.prototype.setupMutationEventHandlersGecko = function() {
  goog.editor.SeamlessField.superClass_.setupMutationEventHandlersGecko.call(this);
  if(this.usesIframe()) {
    var iframe = this.getEditableIframe();
    var outerDoc = iframe.ownerDocument;
    this.eventRegister.listen(outerDoc, goog.editor.Field.MUTATION_EVENTS_GECKO, this.handleOuterDocChange_, true);
    this.eventRegister.listen(this.getEditableDomHelper().getWindow(), goog.events.EventType.LOAD, this.sizeIframeToBodyHeightGecko_, true);
    this.eventRegister.listen(outerDoc, "DOMAttrModified", goog.bind(this.handleDomAttrChange, this, this.handleOuterDocChange_), true)
  }
};
goog.editor.SeamlessField.prototype.handleChange = function() {
  if(this.isEventStopped(goog.editor.Field.EventType.CHANGE)) {
    return
  }
  goog.editor.SeamlessField.superClass_.handleChange.call(this);
  if(this.usesIframe()) {
    this.sizeIframeToBodyHeightGecko_()
  }
};
goog.editor.SeamlessField.prototype.dispatchBlur = function() {
  if(this.isEventStopped(goog.editor.Field.EventType.BLUR)) {
    return
  }
  goog.editor.SeamlessField.superClass_.dispatchBlur.call(this);
  if(!goog.editor.BrowserFeature.HAS_CONTENT_EDITABLE && !goog.editor.BrowserFeature.CLEARS_SELECTION_WHEN_FOCUS_LEAVES) {
    var win = this.getEditableDomHelper().getWindow();
    var dragging = false;
    goog.events.unlistenByKey(this.listenForDragOverEventKey_);
    this.listenForDragOverEventKey_ = goog.events.listenOnce(win.document.body, "dragover", function() {
      dragging = true
    });
    goog.global.setTimeout(goog.bind(function() {
      if(!dragging) {
        if(this.editableDomHelper) {
          var rng = this.getRange();
          var iframeWindow = this.editableDomHelper.getWindow();
          goog.dom.Range.clearSelection(iframeWindow);
          if(rng) {
            rng.collapse(true);
            rng.select()
          }
        }
      }
    }, this), 0)
  }
};
goog.editor.SeamlessField.prototype.turnOnDesignModeGecko = function() {
  goog.editor.SeamlessField.superClass_.turnOnDesignModeGecko.call(this);
  var doc = this.getEditableDomHelper().getDocument();
  doc.execCommand("enableInlineTableEditing", false, "false");
  doc.execCommand("enableObjectResizing", false, "false")
};
goog.editor.SeamlessField.prototype.installStyles = function() {
  if(!this.usesIframe()) {
    if(!goog.editor.SeamlessField.haveInstalledCss_) {
      if(this.cssStyles) {
        goog.style.installStyles(this.cssStyles, this.getElement())
      }
      goog.editor.SeamlessField.haveInstalledCss_ = true
    }
  }
};
goog.editor.SeamlessField.prototype.makeEditableInternal = function(opt_iframeSrc) {
  if(this.usesIframe()) {
    goog.editor.SeamlessField.superClass_.makeEditableInternal.call(this, opt_iframeSrc)
  }else {
    var field = this.getOriginalElement();
    if(field) {
      this.setupFieldObject(field);
      field.contentEditable = true;
      this.injectContents(field.innerHTML, field);
      this.handleFieldLoad()
    }
  }
};
goog.editor.SeamlessField.prototype.handleFieldLoad = function() {
  if(this.usesIframe()) {
    var self = this;
    goog.global.setTimeout(function() {
      self.doFieldSizingGecko()
    }, 0)
  }
  goog.editor.SeamlessField.superClass_.handleFieldLoad.call(this)
};
goog.editor.SeamlessField.prototype.getIframeAttributes = function() {
  return{"frameBorder":0, "style":"padding:0;"}
};
goog.editor.SeamlessField.prototype.attachIframe = function(iframe) {
  this.autoDetectFixedHeight_();
  var field = this.getOriginalElement();
  var dh = goog.dom.getDomHelper(field);
  var oldWidth = field.style.width;
  var oldHeight = field.style.height;
  goog.style.setStyle(field, "visibility", "hidden");
  var startDiv = dh.createDom(goog.dom.TagName.DIV, {"style":"height:0;clear:both", "innerHTML":"&nbsp;"});
  var endDiv = startDiv.cloneNode(true);
  field.insertBefore(startDiv, field.firstChild);
  goog.dom.appendChild(field, endDiv);
  var contentBox = goog.style.getContentBoxSize(field);
  var width = contentBox.width;
  var height = contentBox.height;
  var html = "";
  if(this.isFixedHeight()) {
    html = "&nbsp;";
    goog.style.setStyle(field, "position", "relative");
    goog.style.setStyle(field, "overflow", "visible");
    goog.style.setStyle(iframe, "position", "absolute");
    goog.style.setStyle(iframe, "top", "0");
    goog.style.setStyle(iframe, "left", "0")
  }
  goog.style.setSize(field, width, height);
  if(goog.editor.node.isStandardsMode(field)) {
    this.originalFieldLineHeight_ = field.style.lineHeight;
    goog.style.setStyle(field, "lineHeight", "0")
  }
  field.innerHTML = html;
  goog.style.setSize(iframe, width, height);
  goog.style.setSize(field, oldWidth, oldHeight);
  goog.style.setStyle(field, "visibility", "");
  goog.dom.appendChild(field, iframe);
  if(!this.shouldLoadAsynchronously()) {
    var doc = iframe.contentWindow.document;
    if(goog.editor.node.isStandardsMode(iframe.ownerDocument)) {
      doc.open();
      doc.write("<!DOCTYPE HTML><html></html>");
      doc.close()
    }
  }
};
goog.editor.SeamlessField.prototype.getFieldFormatInfo = function(extraStyles) {
  var originalElement = this.getOriginalElement();
  if(originalElement) {
    return new goog.editor.icontent.FieldFormatInfo(this.id, goog.editor.node.isStandardsMode(originalElement), true, this.isFixedHeight(), extraStyles)
  }
  throw Error("no field");
};
goog.editor.SeamlessField.prototype.writeIframeContent = function(iframe, innerHtml, extraStyles) {
  goog.style.setStyle(iframe, "visibility", "hidden");
  var formatInfo = this.getFieldFormatInfo(extraStyles);
  var styleInfo = new goog.editor.icontent.FieldStyleInfo(this.getOriginalElement(), this.cssStyles + this.getIframeableCss());
  goog.editor.icontent.writeNormalInitialBlendedIframe(formatInfo, innerHtml, styleInfo, iframe);
  this.doFieldSizingGecko();
  goog.style.setStyle(iframe, "visibility", "visible")
};
goog.editor.SeamlessField.prototype.restoreDom = function() {
  if(this.usesIframe()) {
    goog.dom.removeNode(this.getEditableIframe())
  }
};
goog.editor.SeamlessField.prototype.disposeInternal = function() {
  goog.events.unlistenByKey(this.listenForDragOverEventKey_);
  goog.base(this, "disposeInternal")
};
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
  this.logBuffer_ = ""
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
  var record = this.formatter_.formatRecord(logRecord);
  if(window.console && window.console["firebug"]) {
    switch(logRecord.getLevel()) {
      case goog.debug.Logger.Level.SHOUT:
        window.console["info"](record);
        break;
      case goog.debug.Logger.Level.SEVERE:
        window.console["error"](record);
        break;
      case goog.debug.Logger.Level.WARNING:
        window.console["warn"](record);
        break;
      default:
        window.console["debug"](record);
        break
    }
  }else {
    if(window.console) {
      window.console.log(record)
    }else {
      if(window.opera) {
        window.opera["postError"](record)
      }else {
        this.logBuffer_ += record
      }
    }
  }
};
goog.debug.Console.instance = null;
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
goog.provide("goog.events.FileDropHandler");
goog.provide("goog.events.FileDropHandler.EventType");
goog.require("goog.array");
goog.require("goog.debug.Logger");
goog.require("goog.dom");
goog.require("goog.events");
goog.require("goog.events.BrowserEvent");
goog.require("goog.events.EventHandler");
goog.require("goog.events.EventTarget");
goog.require("goog.events.EventType");
goog.events.FileDropHandler = function(element, opt_preventDropOutside) {
  goog.events.EventTarget.call(this);
  this.eventHandler_ = new goog.events.EventHandler(this);
  var doc = element;
  if(opt_preventDropOutside) {
    doc = goog.dom.getOwnerDocument(element)
  }
  this.eventHandler_.listen(doc, goog.events.EventType.DRAGENTER, this.onDocDragEnter_);
  if(doc != element) {
    this.eventHandler_.listen(doc, goog.events.EventType.DRAGOVER, this.onDocDragOver_)
  }
  this.eventHandler_.listen(element, goog.events.EventType.DRAGOVER, this.onElemDragOver_);
  this.eventHandler_.listen(element, goog.events.EventType.DROP, this.onElemDrop_)
};
goog.inherits(goog.events.FileDropHandler, goog.events.EventTarget);
goog.events.FileDropHandler.prototype.dndContainsFiles_ = false;
goog.events.FileDropHandler.prototype.logger_ = goog.debug.Logger.getLogger("goog.events.FileDropHandler");
goog.events.FileDropHandler.EventType = {DROP:goog.events.EventType.DROP};
goog.events.FileDropHandler.prototype.disposeInternal = function() {
  goog.events.FileDropHandler.superClass_.disposeInternal.call(this);
  this.eventHandler_.dispose()
};
goog.events.FileDropHandler.prototype.dispatch_ = function(e) {
  this.logger_.fine("Firing DROP event...");
  var event = new goog.events.BrowserEvent(e.getBrowserEvent());
  event.type = goog.events.FileDropHandler.EventType.DROP;
  try {
    this.dispatchEvent(event)
  }finally {
    event.dispose()
  }
};
goog.events.FileDropHandler.prototype.onDocDragEnter_ = function(e) {
  this.logger_.finer('"' + e.target.id + '" (' + e.target + ") dispatched: " + e.type);
  var dt = e.getBrowserEvent().dataTransfer;
  this.dndContainsFiles_ = !!(dt && (dt.types && (goog.array.contains(dt.types, "Files") || goog.array.contains(dt.types, "public.file-url")) || dt.files && dt.files.length > 0));
  if(this.dndContainsFiles_) {
    e.preventDefault()
  }
  this.logger_.finer("dndContainsFiles_: " + this.dndContainsFiles_)
};
goog.events.FileDropHandler.prototype.onDocDragOver_ = function(e) {
  this.logger_.finest('"' + e.target.id + '" (' + e.target + ") dispatched: " + e.type);
  if(this.dndContainsFiles_) {
    e.preventDefault();
    var dt = e.getBrowserEvent().dataTransfer;
    dt.dropEffect = "none"
  }
};
goog.events.FileDropHandler.prototype.onElemDragOver_ = function(e) {
  this.logger_.finest('"' + e.target.id + '" (' + e.target + ") dispatched: " + e.type);
  if(this.dndContainsFiles_) {
    e.preventDefault();
    e.stopPropagation();
    var dt = e.getBrowserEvent().dataTransfer;
    dt.effectAllowed = "all";
    dt.dropEffect = "copy"
  }
};
goog.events.FileDropHandler.prototype.onElemDrop_ = function(e) {
  this.logger_.finer('"' + e.target.id + '" (' + e.target + ") dispatched: " + e.type);
  if(this.dndContainsFiles_) {
    e.preventDefault();
    e.stopPropagation();
    this.dispatch_(e)
  }
};
goog.provide("onedit");
goog.require("cljs.core");
goog.require("goog.events.FileDropHandler");
goog.require("goog.events");
goog.require("goog.editor.plugins.BasicTextFormatter");
goog.require("goog.dom.forms");
goog.require("goog.dom");
goog.require("goog.string");
goog.require("goog.editor.SeamlessField");
goog.require("goog.uri.utils");
goog.require("goog.ui.FormPost");
goog.require("goog.net.cookies");
goog.require("goog.style");
goog.require("goog.array");
goog.require("goog.object");
goog.require("goog.Uri");
goog.require("goog.debug.Console");
goog.require("goog.net.XhrIo");
goog.require("onedit.core");
onedit.highlight_success = function highlight_success(e, callback) {
  var text__10548 = goog.string.newLineToBr.call(null, e.target.getResponseText(), true);
  onedit.core.log.call(null, text__10548);
  return callback.call(null, text__10548)
};
onedit.highlight_xhr = function highlight_xhr(callback) {
  var G__10549__10550 = new goog.net.XhrIo;
  goog.events.listen.call(null, G__10549__10550, goog.net.EventType.SUCCESS, function(p1__10547_SHARP_) {
    return onedit.highlight_success.call(null, p1__10547_SHARP_, callback)
  });
  goog.events.listen.call(null, G__10549__10550, goog.net.EventType.ERROR, function(e) {
    return onedit.core.log.call(null, e.target.getLastError())
  });
  return G__10549__10550
};
onedit.highlight = function() {
  var highlight = null;
  var highlight__10553 = function(content, callback) {
    return highlight.call(null, content, callback, "language", goog.net.cookies.get("language", "plain"))
  };
  var highlight__10554 = function(content, callback, filename) {
    return highlight.call(null, content, callback, "filename", filename)
  };
  var highlight__10555 = function(content, callback, key, value) {
    if(cljs.core.truth_(goog.string.isEmpty.call(null, content))) {
      return null
    }else {
      var url__10552 = cljs.core.str.call(null, "highlight/", key, "/", value);
      onedit.core.log.call(null, content);
      onedit.core.log.call(null, url__10552);
      return onedit.highlight_xhr.call(null, callback).send(url__10552, "POST", goog.uri.utils.buildQueryDataFromMap.call(null, goog.object.create.call(null, "content", content)))
    }
  };
  highlight = function(content, callback, key, value) {
    switch(arguments.length) {
      case 2:
        return highlight__10553.call(this, content, callback);
      case 3:
        return highlight__10554.call(this, content, callback, key);
      case 4:
        return highlight__10555.call(this, content, callback, key, value)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return highlight
}();
onedit.set_html = function set_html(p1__10551_SHARP_) {
  return onedit.core.buffer_array.call(null).html(p1__10551_SHARP_)
};
onedit.highlight_buffer = function highlight_buffer() {
  var temp__3971__auto____10557 = onedit.core.tab_pane.call(null).data("filename");
  if(cljs.core.truth_(temp__3971__auto____10557)) {
    var filename__10558 = temp__3971__auto____10557;
    return onedit.highlight.call(null, onedit.core.buffer_content.call(null), onedit.set_html, filename__10558)
  }else {
    return onedit.highlight.call(null, onedit.core.buffer_content.call(null), onedit.set_html)
  }
};
onedit.open_file = function open_file(target) {
  var reader__10559 = new FileReader;
  var file__10560 = target.files[0];
  onedit.core.tab_pane.call(null).data("filename", file__10560.name);
  onedit.core.jquery.call(null, ".nav-tabs .active a").text(file__10560.name);
  reader__10559.onload = function(e) {
    return onedit.highlight.call(null, e.target.result, onedit.set_html, file__10560.name)
  };
  return reader__10559.readAsText(file__10560)
};
onedit.save = function save() {
  var text__10561 = onedit.core.buffer_content.call(null);
  if(cljs.core.truth_(goog.string.isEmpty.call(null, text__10561))) {
    return null
  }else {
    return(new goog.ui.FormPost).post(goog.object.create.call(null, "content", text__10561), cljs.core.str.call(null, "save/", onedit.core.filename.call(null)))
  }
};
onedit.send_lexers = function send_lexers(callback) {
  return onedit.core.jquery.getJSON("lexers", callback)
};
onedit.set_lexers = function set_lexers(lexers) {
  onedit.core.log.call(null, lexers);
  return onedit.core.jquery.call(null, "#lang").typeahead(goog.object.create.call(null, "source", goog.array.map.call(null, lexers, function(lang) {
    return lang.name
  })))
};
onedit.set_lang = function set_lang(lang) {
  return function(lexers) {
    var temp__3971__auto____10563 = goog.array.find.call(null, lexers, function(p1__10562_SHARP_) {
      return goog.object.contains.call(null, p1__10562_SHARP_, lang)
    });
    if(cljs.core.truth_(temp__3971__auto____10563)) {
      var aliases__10564 = temp__3971__auto____10563;
      var alias__10565 = aliases__10564["alias"];
      onedit.core.log.call(null, lang);
      onedit.core.log.call(null, alias__10565);
      goog.net.cookies.set("language", alias__10565);
      return onedit.highlight_buffer.call(null)
    }else {
      return null
    }
  }
};
onedit.chage_lang = function chage_lang(e) {
  var lang__10566 = goog.dom.forms.getValue.call(null, e.target);
  return onedit.send_lexers.call(null, onedit.set_lang.call(null, lang__10566))
};
onedit.file_drop = function file_drop(e) {
  var browser__10568 = e.getBrowserEvent();
  return onedit.open_file.call(null, browser__10568.dataTransfer)
};
onedit.show_tab = function show_tab(p1__10567_SHARP_) {
  return p1__10567_SHARP_.tab("show")
};
onedit.add_tab = function add_tab(id, name, elem) {
  var a__10569 = goog.dom.createDom.call(null, "a", goog.object.create.call(null, "href", cljs.core.str.call(null, "#", id)), name);
  var div__10570 = goog.dom.createDom.call(null, "div", goog.object.create.call(null, "id", id, "class", "tab-pane"), elem);
  onedit.core.log.call(null, id);
  onedit.core.log.call(null, name);
  onedit.core.log.call(null, elem);
  onedit.core.jquery.call(null, ".nav-tabs").append(goog.dom.createDom.call(null, "li", null, a__10569));
  onedit.core.jquery.call(null, ".tab-content").append(div__10570);
  goog.events.listen.call(null, a__10569, goog.events.EventType.CLICK, function(e) {
    onedit.core.log.call(null, e.target);
    e.preventDefault();
    return onedit.show_tab.call(null, onedit.core.jquery.call(null, e.target))
  });
  return onedit.show_tab.call(null, onedit.core.jquery.call(null, ".nav-tabs li a:last"))
};
onedit.buffer_blur = function buffer_blur(e) {
  return onedit.highlight_buffer.call(null)
};
onedit.buffer_delayed_change = function buffer_delayed_change(e) {
  var temp__3971__auto____10572 = onedit.core.data.call(null, "socket");
  if(cljs.core.truth_(temp__3971__auto____10572)) {
    var socket__10573 = temp__3971__auto____10572;
    return socket__10573.send(onedit.core.buffer_content.call(null))
  }else {
    return null
  }
};
onedit.add_buffer = function() {
  var add_buffer = null;
  var add_buffer__10579 = function(name) {
    return add_buffer.call(null, name, "")
  };
  var add_buffer__10580 = function(name, content) {
    var pre__10576 = function() {
      var G__10574__10575 = goog.dom.createDom.call(null, "pre", null, content);
      G__10574__10575.setAttribute("contenteditable", "true");
      return G__10574__10575
    }();
    onedit.core.unique.call(null, function(p1__10571_SHARP_) {
      return onedit.add_tab.call(null, p1__10571_SHARP_, name, pre__10576)
    });
    goog.events.listen.call(null, new goog.events.FileDropHandler(pre__10576), goog.events.FileDropHandler.EventType.DROP, onedit.file_drop);
    var G__10577__10578 = pre__10576;
    goog.events.listen.call(null, G__10577__10578, "DOMCharacterDataModified", onedit.buffer_delayed_change);
    goog.events.listen.call(null, G__10577__10578, goog.events.EventType.BLUR, onedit.buffer_blur);
    return G__10577__10578
  };
  add_buffer = function(name, content) {
    switch(arguments.length) {
      case 1:
        return add_buffer__10579.call(this, name);
      case 2:
        return add_buffer__10580.call(this, name, content)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return add_buffer
}();
onedit.live = function() {
  var live = null;
  var live__10585 = function() {
    var socket__10582 = new WebSocket(cljs.core.str.call(null, "ws://localhost:5000/live/", onedit.core.tab_pane.call(null).attr("id")));
    socket__10582.onmessage = function(e) {
      return onedit.core.log.call(null, e.data)
    };
    return onedit.core.data.call(null, "socket", socket__10582)
  };
  var live__10586 = function(id, filename) {
    onedit.add_buffer.call(null, filename);
    var socket__10583 = new WebSocket(cljs.core.str.call(null, "ws://localhost:5000/live/", id, "/", filename));
    var i__10584 = onedit.core.tab_pane.call(null).attr("id");
    onedit.core.log.call(null, i__10584);
    return socket__10583.onmessage = function(e) {
      onedit.core.log.call(null, e.data);
      return onedit.core.jquery.call(null, cljs.core.str.call(null, "#", i__10584)).html(e.data)
    }
  };
  live = function(id, filename) {
    switch(arguments.length) {
      case 0:
        return live__10585.call(this);
      case 2:
        return live__10586.call(this, id, filename)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return live
}();
onedit.listen_events = function listen_events() {
  var file__10588 = onedit.core.jquery.call(null, "#file");
  onedit.core.jquery.call(null, "#new-tab").click(function() {
    return onedit.add_buffer.call(null, "scratch")
  });
  onedit.core.jquery.call(null, "#open").click(function() {
    return file__10588.click()
  });
  file__10588.change(function(e) {
    return onedit.open_file.call(null, e.target)
  });
  onedit.core.jquery.call(null, "#save").click(onedit.save);
  return onedit.core.jquery.call(null, "#lang").change(onedit.chage_lang)
};
onedit.init = function init() {
  goog.debug.Console.autoInstall.call(null);
  onedit.send_lexers.call(null, onedit.set_lexers);
  onedit.add_buffer.call(null, "scratch");
  return onedit.listen_events.call(null)
};
