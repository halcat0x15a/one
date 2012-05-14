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
  var or__3824__auto____12395 = p[goog.typeOf.call(null, x)];
  if(cljs.core.truth_(or__3824__auto____12395)) {
    return or__3824__auto____12395
  }else {
    var or__3824__auto____12396 = p["_"];
    if(cljs.core.truth_(or__3824__auto____12396)) {
      return or__3824__auto____12396
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
  var _invoke__12460 = function(this$) {
    if(cljs.core.truth_(function() {
      var and__3822__auto____12397 = this$;
      if(cljs.core.truth_(and__3822__auto____12397)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3822__auto____12397
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$)
    }else {
      return function() {
        var or__3824__auto____12398 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3824__auto____12398)) {
          return or__3824__auto____12398
        }else {
          var or__3824__auto____12399 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3824__auto____12399)) {
            return or__3824__auto____12399
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$)
    }
  };
  var _invoke__12461 = function(this$, a) {
    if(cljs.core.truth_(function() {
      var and__3822__auto____12400 = this$;
      if(cljs.core.truth_(and__3822__auto____12400)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3822__auto____12400
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a)
    }else {
      return function() {
        var or__3824__auto____12401 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3824__auto____12401)) {
          return or__3824__auto____12401
        }else {
          var or__3824__auto____12402 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3824__auto____12402)) {
            return or__3824__auto____12402
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a)
    }
  };
  var _invoke__12462 = function(this$, a, b) {
    if(cljs.core.truth_(function() {
      var and__3822__auto____12403 = this$;
      if(cljs.core.truth_(and__3822__auto____12403)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3822__auto____12403
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b)
    }else {
      return function() {
        var or__3824__auto____12404 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3824__auto____12404)) {
          return or__3824__auto____12404
        }else {
          var or__3824__auto____12405 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3824__auto____12405)) {
            return or__3824__auto____12405
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b)
    }
  };
  var _invoke__12463 = function(this$, a, b, c) {
    if(cljs.core.truth_(function() {
      var and__3822__auto____12406 = this$;
      if(cljs.core.truth_(and__3822__auto____12406)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3822__auto____12406
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c)
    }else {
      return function() {
        var or__3824__auto____12407 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3824__auto____12407)) {
          return or__3824__auto____12407
        }else {
          var or__3824__auto____12408 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3824__auto____12408)) {
            return or__3824__auto____12408
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c)
    }
  };
  var _invoke__12464 = function(this$, a, b, c, d) {
    if(cljs.core.truth_(function() {
      var and__3822__auto____12409 = this$;
      if(cljs.core.truth_(and__3822__auto____12409)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3822__auto____12409
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d)
    }else {
      return function() {
        var or__3824__auto____12410 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3824__auto____12410)) {
          return or__3824__auto____12410
        }else {
          var or__3824__auto____12411 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3824__auto____12411)) {
            return or__3824__auto____12411
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d)
    }
  };
  var _invoke__12465 = function(this$, a, b, c, d, e) {
    if(cljs.core.truth_(function() {
      var and__3822__auto____12412 = this$;
      if(cljs.core.truth_(and__3822__auto____12412)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3822__auto____12412
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e)
    }else {
      return function() {
        var or__3824__auto____12413 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3824__auto____12413)) {
          return or__3824__auto____12413
        }else {
          var or__3824__auto____12414 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3824__auto____12414)) {
            return or__3824__auto____12414
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e)
    }
  };
  var _invoke__12466 = function(this$, a, b, c, d, e, f) {
    if(cljs.core.truth_(function() {
      var and__3822__auto____12415 = this$;
      if(cljs.core.truth_(and__3822__auto____12415)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3822__auto____12415
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f)
    }else {
      return function() {
        var or__3824__auto____12416 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3824__auto____12416)) {
          return or__3824__auto____12416
        }else {
          var or__3824__auto____12417 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3824__auto____12417)) {
            return or__3824__auto____12417
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f)
    }
  };
  var _invoke__12467 = function(this$, a, b, c, d, e, f, g) {
    if(cljs.core.truth_(function() {
      var and__3822__auto____12418 = this$;
      if(cljs.core.truth_(and__3822__auto____12418)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3822__auto____12418
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f, g)
    }else {
      return function() {
        var or__3824__auto____12419 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3824__auto____12419)) {
          return or__3824__auto____12419
        }else {
          var or__3824__auto____12420 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3824__auto____12420)) {
            return or__3824__auto____12420
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g)
    }
  };
  var _invoke__12468 = function(this$, a, b, c, d, e, f, g, h) {
    if(cljs.core.truth_(function() {
      var and__3822__auto____12421 = this$;
      if(cljs.core.truth_(and__3822__auto____12421)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3822__auto____12421
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f, g, h)
    }else {
      return function() {
        var or__3824__auto____12422 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3824__auto____12422)) {
          return or__3824__auto____12422
        }else {
          var or__3824__auto____12423 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3824__auto____12423)) {
            return or__3824__auto____12423
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h)
    }
  };
  var _invoke__12469 = function(this$, a, b, c, d, e, f, g, h, i) {
    if(cljs.core.truth_(function() {
      var and__3822__auto____12424 = this$;
      if(cljs.core.truth_(and__3822__auto____12424)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3822__auto____12424
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f, g, h, i)
    }else {
      return function() {
        var or__3824__auto____12425 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3824__auto____12425)) {
          return or__3824__auto____12425
        }else {
          var or__3824__auto____12426 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3824__auto____12426)) {
            return or__3824__auto____12426
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i)
    }
  };
  var _invoke__12470 = function(this$, a, b, c, d, e, f, g, h, i, j) {
    if(cljs.core.truth_(function() {
      var and__3822__auto____12427 = this$;
      if(cljs.core.truth_(and__3822__auto____12427)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3822__auto____12427
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f, g, h, i, j)
    }else {
      return function() {
        var or__3824__auto____12428 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3824__auto____12428)) {
          return or__3824__auto____12428
        }else {
          var or__3824__auto____12429 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3824__auto____12429)) {
            return or__3824__auto____12429
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j)
    }
  };
  var _invoke__12471 = function(this$, a, b, c, d, e, f, g, h, i, j, k) {
    if(cljs.core.truth_(function() {
      var and__3822__auto____12430 = this$;
      if(cljs.core.truth_(and__3822__auto____12430)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3822__auto____12430
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f, g, h, i, j, k)
    }else {
      return function() {
        var or__3824__auto____12431 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3824__auto____12431)) {
          return or__3824__auto____12431
        }else {
          var or__3824__auto____12432 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3824__auto____12432)) {
            return or__3824__auto____12432
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k)
    }
  };
  var _invoke__12472 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l) {
    if(cljs.core.truth_(function() {
      var and__3822__auto____12433 = this$;
      if(cljs.core.truth_(and__3822__auto____12433)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3822__auto____12433
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f, g, h, i, j, k, l)
    }else {
      return function() {
        var or__3824__auto____12434 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3824__auto____12434)) {
          return or__3824__auto____12434
        }else {
          var or__3824__auto____12435 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3824__auto____12435)) {
            return or__3824__auto____12435
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l)
    }
  };
  var _invoke__12473 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m) {
    if(cljs.core.truth_(function() {
      var and__3822__auto____12436 = this$;
      if(cljs.core.truth_(and__3822__auto____12436)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3822__auto____12436
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f, g, h, i, j, k, l, m)
    }else {
      return function() {
        var or__3824__auto____12437 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3824__auto____12437)) {
          return or__3824__auto____12437
        }else {
          var or__3824__auto____12438 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3824__auto____12438)) {
            return or__3824__auto____12438
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m)
    }
  };
  var _invoke__12474 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n) {
    if(cljs.core.truth_(function() {
      var and__3822__auto____12439 = this$;
      if(cljs.core.truth_(and__3822__auto____12439)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3822__auto____12439
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n)
    }else {
      return function() {
        var or__3824__auto____12440 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3824__auto____12440)) {
          return or__3824__auto____12440
        }else {
          var or__3824__auto____12441 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3824__auto____12441)) {
            return or__3824__auto____12441
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n)
    }
  };
  var _invoke__12475 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o) {
    if(cljs.core.truth_(function() {
      var and__3822__auto____12442 = this$;
      if(cljs.core.truth_(and__3822__auto____12442)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3822__auto____12442
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o)
    }else {
      return function() {
        var or__3824__auto____12443 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3824__auto____12443)) {
          return or__3824__auto____12443
        }else {
          var or__3824__auto____12444 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3824__auto____12444)) {
            return or__3824__auto____12444
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o)
    }
  };
  var _invoke__12476 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p) {
    if(cljs.core.truth_(function() {
      var and__3822__auto____12445 = this$;
      if(cljs.core.truth_(and__3822__auto____12445)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3822__auto____12445
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p)
    }else {
      return function() {
        var or__3824__auto____12446 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3824__auto____12446)) {
          return or__3824__auto____12446
        }else {
          var or__3824__auto____12447 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3824__auto____12447)) {
            return or__3824__auto____12447
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p)
    }
  };
  var _invoke__12477 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q) {
    if(cljs.core.truth_(function() {
      var and__3822__auto____12448 = this$;
      if(cljs.core.truth_(and__3822__auto____12448)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3822__auto____12448
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q)
    }else {
      return function() {
        var or__3824__auto____12449 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3824__auto____12449)) {
          return or__3824__auto____12449
        }else {
          var or__3824__auto____12450 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3824__auto____12450)) {
            return or__3824__auto____12450
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q)
    }
  };
  var _invoke__12478 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s) {
    if(cljs.core.truth_(function() {
      var and__3822__auto____12451 = this$;
      if(cljs.core.truth_(and__3822__auto____12451)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3822__auto____12451
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s)
    }else {
      return function() {
        var or__3824__auto____12452 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3824__auto____12452)) {
          return or__3824__auto____12452
        }else {
          var or__3824__auto____12453 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3824__auto____12453)) {
            return or__3824__auto____12453
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s)
    }
  };
  var _invoke__12479 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t) {
    if(cljs.core.truth_(function() {
      var and__3822__auto____12454 = this$;
      if(cljs.core.truth_(and__3822__auto____12454)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3822__auto____12454
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t)
    }else {
      return function() {
        var or__3824__auto____12455 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3824__auto____12455)) {
          return or__3824__auto____12455
        }else {
          var or__3824__auto____12456 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3824__auto____12456)) {
            return or__3824__auto____12456
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t)
    }
  };
  var _invoke__12480 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest) {
    if(cljs.core.truth_(function() {
      var and__3822__auto____12457 = this$;
      if(cljs.core.truth_(and__3822__auto____12457)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3822__auto____12457
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest)
    }else {
      return function() {
        var or__3824__auto____12458 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3824__auto____12458)) {
          return or__3824__auto____12458
        }else {
          var or__3824__auto____12459 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3824__auto____12459)) {
            return or__3824__auto____12459
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
        return _invoke__12460.call(this, this$);
      case 2:
        return _invoke__12461.call(this, this$, a);
      case 3:
        return _invoke__12462.call(this, this$, a, b);
      case 4:
        return _invoke__12463.call(this, this$, a, b, c);
      case 5:
        return _invoke__12464.call(this, this$, a, b, c, d);
      case 6:
        return _invoke__12465.call(this, this$, a, b, c, d, e);
      case 7:
        return _invoke__12466.call(this, this$, a, b, c, d, e, f);
      case 8:
        return _invoke__12467.call(this, this$, a, b, c, d, e, f, g);
      case 9:
        return _invoke__12468.call(this, this$, a, b, c, d, e, f, g, h);
      case 10:
        return _invoke__12469.call(this, this$, a, b, c, d, e, f, g, h, i);
      case 11:
        return _invoke__12470.call(this, this$, a, b, c, d, e, f, g, h, i, j);
      case 12:
        return _invoke__12471.call(this, this$, a, b, c, d, e, f, g, h, i, j, k);
      case 13:
        return _invoke__12472.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l);
      case 14:
        return _invoke__12473.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m);
      case 15:
        return _invoke__12474.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n);
      case 16:
        return _invoke__12475.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o);
      case 17:
        return _invoke__12476.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p);
      case 18:
        return _invoke__12477.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q);
      case 19:
        return _invoke__12478.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s);
      case 20:
        return _invoke__12479.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t);
      case 21:
        return _invoke__12480.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return _invoke
}();
cljs.core.ICounted = {};
cljs.core._count = function _count(coll) {
  if(cljs.core.truth_(function() {
    var and__3822__auto____12482 = coll;
    if(cljs.core.truth_(and__3822__auto____12482)) {
      return coll.cljs$core$ICounted$_count
    }else {
      return and__3822__auto____12482
    }
  }())) {
    return coll.cljs$core$ICounted$_count(coll)
  }else {
    return function() {
      var or__3824__auto____12483 = cljs.core._count[goog.typeOf.call(null, coll)];
      if(cljs.core.truth_(or__3824__auto____12483)) {
        return or__3824__auto____12483
      }else {
        var or__3824__auto____12484 = cljs.core._count["_"];
        if(cljs.core.truth_(or__3824__auto____12484)) {
          return or__3824__auto____12484
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
    var and__3822__auto____12485 = coll;
    if(cljs.core.truth_(and__3822__auto____12485)) {
      return coll.cljs$core$IEmptyableCollection$_empty
    }else {
      return and__3822__auto____12485
    }
  }())) {
    return coll.cljs$core$IEmptyableCollection$_empty(coll)
  }else {
    return function() {
      var or__3824__auto____12486 = cljs.core._empty[goog.typeOf.call(null, coll)];
      if(cljs.core.truth_(or__3824__auto____12486)) {
        return or__3824__auto____12486
      }else {
        var or__3824__auto____12487 = cljs.core._empty["_"];
        if(cljs.core.truth_(or__3824__auto____12487)) {
          return or__3824__auto____12487
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
    var and__3822__auto____12488 = coll;
    if(cljs.core.truth_(and__3822__auto____12488)) {
      return coll.cljs$core$ICollection$_conj
    }else {
      return and__3822__auto____12488
    }
  }())) {
    return coll.cljs$core$ICollection$_conj(coll, o)
  }else {
    return function() {
      var or__3824__auto____12489 = cljs.core._conj[goog.typeOf.call(null, coll)];
      if(cljs.core.truth_(or__3824__auto____12489)) {
        return or__3824__auto____12489
      }else {
        var or__3824__auto____12490 = cljs.core._conj["_"];
        if(cljs.core.truth_(or__3824__auto____12490)) {
          return or__3824__auto____12490
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
  var _nth__12497 = function(coll, n) {
    if(cljs.core.truth_(function() {
      var and__3822__auto____12491 = coll;
      if(cljs.core.truth_(and__3822__auto____12491)) {
        return coll.cljs$core$IIndexed$_nth
      }else {
        return and__3822__auto____12491
      }
    }())) {
      return coll.cljs$core$IIndexed$_nth(coll, n)
    }else {
      return function() {
        var or__3824__auto____12492 = cljs.core._nth[goog.typeOf.call(null, coll)];
        if(cljs.core.truth_(or__3824__auto____12492)) {
          return or__3824__auto____12492
        }else {
          var or__3824__auto____12493 = cljs.core._nth["_"];
          if(cljs.core.truth_(or__3824__auto____12493)) {
            return or__3824__auto____12493
          }else {
            throw cljs.core.missing_protocol.call(null, "IIndexed.-nth", coll);
          }
        }
      }().call(null, coll, n)
    }
  };
  var _nth__12498 = function(coll, n, not_found) {
    if(cljs.core.truth_(function() {
      var and__3822__auto____12494 = coll;
      if(cljs.core.truth_(and__3822__auto____12494)) {
        return coll.cljs$core$IIndexed$_nth
      }else {
        return and__3822__auto____12494
      }
    }())) {
      return coll.cljs$core$IIndexed$_nth(coll, n, not_found)
    }else {
      return function() {
        var or__3824__auto____12495 = cljs.core._nth[goog.typeOf.call(null, coll)];
        if(cljs.core.truth_(or__3824__auto____12495)) {
          return or__3824__auto____12495
        }else {
          var or__3824__auto____12496 = cljs.core._nth["_"];
          if(cljs.core.truth_(or__3824__auto____12496)) {
            return or__3824__auto____12496
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
        return _nth__12497.call(this, coll, n);
      case 3:
        return _nth__12498.call(this, coll, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return _nth
}();
cljs.core.ISeq = {};
cljs.core._first = function _first(coll) {
  if(cljs.core.truth_(function() {
    var and__3822__auto____12500 = coll;
    if(cljs.core.truth_(and__3822__auto____12500)) {
      return coll.cljs$core$ISeq$_first
    }else {
      return and__3822__auto____12500
    }
  }())) {
    return coll.cljs$core$ISeq$_first(coll)
  }else {
    return function() {
      var or__3824__auto____12501 = cljs.core._first[goog.typeOf.call(null, coll)];
      if(cljs.core.truth_(or__3824__auto____12501)) {
        return or__3824__auto____12501
      }else {
        var or__3824__auto____12502 = cljs.core._first["_"];
        if(cljs.core.truth_(or__3824__auto____12502)) {
          return or__3824__auto____12502
        }else {
          throw cljs.core.missing_protocol.call(null, "ISeq.-first", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._rest = function _rest(coll) {
  if(cljs.core.truth_(function() {
    var and__3822__auto____12503 = coll;
    if(cljs.core.truth_(and__3822__auto____12503)) {
      return coll.cljs$core$ISeq$_rest
    }else {
      return and__3822__auto____12503
    }
  }())) {
    return coll.cljs$core$ISeq$_rest(coll)
  }else {
    return function() {
      var or__3824__auto____12504 = cljs.core._rest[goog.typeOf.call(null, coll)];
      if(cljs.core.truth_(or__3824__auto____12504)) {
        return or__3824__auto____12504
      }else {
        var or__3824__auto____12505 = cljs.core._rest["_"];
        if(cljs.core.truth_(or__3824__auto____12505)) {
          return or__3824__auto____12505
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
  var _lookup__12512 = function(o, k) {
    if(cljs.core.truth_(function() {
      var and__3822__auto____12506 = o;
      if(cljs.core.truth_(and__3822__auto____12506)) {
        return o.cljs$core$ILookup$_lookup
      }else {
        return and__3822__auto____12506
      }
    }())) {
      return o.cljs$core$ILookup$_lookup(o, k)
    }else {
      return function() {
        var or__3824__auto____12507 = cljs.core._lookup[goog.typeOf.call(null, o)];
        if(cljs.core.truth_(or__3824__auto____12507)) {
          return or__3824__auto____12507
        }else {
          var or__3824__auto____12508 = cljs.core._lookup["_"];
          if(cljs.core.truth_(or__3824__auto____12508)) {
            return or__3824__auto____12508
          }else {
            throw cljs.core.missing_protocol.call(null, "ILookup.-lookup", o);
          }
        }
      }().call(null, o, k)
    }
  };
  var _lookup__12513 = function(o, k, not_found) {
    if(cljs.core.truth_(function() {
      var and__3822__auto____12509 = o;
      if(cljs.core.truth_(and__3822__auto____12509)) {
        return o.cljs$core$ILookup$_lookup
      }else {
        return and__3822__auto____12509
      }
    }())) {
      return o.cljs$core$ILookup$_lookup(o, k, not_found)
    }else {
      return function() {
        var or__3824__auto____12510 = cljs.core._lookup[goog.typeOf.call(null, o)];
        if(cljs.core.truth_(or__3824__auto____12510)) {
          return or__3824__auto____12510
        }else {
          var or__3824__auto____12511 = cljs.core._lookup["_"];
          if(cljs.core.truth_(or__3824__auto____12511)) {
            return or__3824__auto____12511
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
        return _lookup__12512.call(this, o, k);
      case 3:
        return _lookup__12513.call(this, o, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return _lookup
}();
cljs.core.IAssociative = {};
cljs.core._contains_key_QMARK_ = function _contains_key_QMARK_(coll, k) {
  if(cljs.core.truth_(function() {
    var and__3822__auto____12515 = coll;
    if(cljs.core.truth_(and__3822__auto____12515)) {
      return coll.cljs$core$IAssociative$_contains_key_QMARK_
    }else {
      return and__3822__auto____12515
    }
  }())) {
    return coll.cljs$core$IAssociative$_contains_key_QMARK_(coll, k)
  }else {
    return function() {
      var or__3824__auto____12516 = cljs.core._contains_key_QMARK_[goog.typeOf.call(null, coll)];
      if(cljs.core.truth_(or__3824__auto____12516)) {
        return or__3824__auto____12516
      }else {
        var or__3824__auto____12517 = cljs.core._contains_key_QMARK_["_"];
        if(cljs.core.truth_(or__3824__auto____12517)) {
          return or__3824__auto____12517
        }else {
          throw cljs.core.missing_protocol.call(null, "IAssociative.-contains-key?", coll);
        }
      }
    }().call(null, coll, k)
  }
};
cljs.core._assoc = function _assoc(coll, k, v) {
  if(cljs.core.truth_(function() {
    var and__3822__auto____12518 = coll;
    if(cljs.core.truth_(and__3822__auto____12518)) {
      return coll.cljs$core$IAssociative$_assoc
    }else {
      return and__3822__auto____12518
    }
  }())) {
    return coll.cljs$core$IAssociative$_assoc(coll, k, v)
  }else {
    return function() {
      var or__3824__auto____12519 = cljs.core._assoc[goog.typeOf.call(null, coll)];
      if(cljs.core.truth_(or__3824__auto____12519)) {
        return or__3824__auto____12519
      }else {
        var or__3824__auto____12520 = cljs.core._assoc["_"];
        if(cljs.core.truth_(or__3824__auto____12520)) {
          return or__3824__auto____12520
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
    var and__3822__auto____12521 = coll;
    if(cljs.core.truth_(and__3822__auto____12521)) {
      return coll.cljs$core$IMap$_dissoc
    }else {
      return and__3822__auto____12521
    }
  }())) {
    return coll.cljs$core$IMap$_dissoc(coll, k)
  }else {
    return function() {
      var or__3824__auto____12522 = cljs.core._dissoc[goog.typeOf.call(null, coll)];
      if(cljs.core.truth_(or__3824__auto____12522)) {
        return or__3824__auto____12522
      }else {
        var or__3824__auto____12523 = cljs.core._dissoc["_"];
        if(cljs.core.truth_(or__3824__auto____12523)) {
          return or__3824__auto____12523
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
    var and__3822__auto____12524 = coll;
    if(cljs.core.truth_(and__3822__auto____12524)) {
      return coll.cljs$core$ISet$_disjoin
    }else {
      return and__3822__auto____12524
    }
  }())) {
    return coll.cljs$core$ISet$_disjoin(coll, v)
  }else {
    return function() {
      var or__3824__auto____12525 = cljs.core._disjoin[goog.typeOf.call(null, coll)];
      if(cljs.core.truth_(or__3824__auto____12525)) {
        return or__3824__auto____12525
      }else {
        var or__3824__auto____12526 = cljs.core._disjoin["_"];
        if(cljs.core.truth_(or__3824__auto____12526)) {
          return or__3824__auto____12526
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
    var and__3822__auto____12527 = coll;
    if(cljs.core.truth_(and__3822__auto____12527)) {
      return coll.cljs$core$IStack$_peek
    }else {
      return and__3822__auto____12527
    }
  }())) {
    return coll.cljs$core$IStack$_peek(coll)
  }else {
    return function() {
      var or__3824__auto____12528 = cljs.core._peek[goog.typeOf.call(null, coll)];
      if(cljs.core.truth_(or__3824__auto____12528)) {
        return or__3824__auto____12528
      }else {
        var or__3824__auto____12529 = cljs.core._peek["_"];
        if(cljs.core.truth_(or__3824__auto____12529)) {
          return or__3824__auto____12529
        }else {
          throw cljs.core.missing_protocol.call(null, "IStack.-peek", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._pop = function _pop(coll) {
  if(cljs.core.truth_(function() {
    var and__3822__auto____12530 = coll;
    if(cljs.core.truth_(and__3822__auto____12530)) {
      return coll.cljs$core$IStack$_pop
    }else {
      return and__3822__auto____12530
    }
  }())) {
    return coll.cljs$core$IStack$_pop(coll)
  }else {
    return function() {
      var or__3824__auto____12531 = cljs.core._pop[goog.typeOf.call(null, coll)];
      if(cljs.core.truth_(or__3824__auto____12531)) {
        return or__3824__auto____12531
      }else {
        var or__3824__auto____12532 = cljs.core._pop["_"];
        if(cljs.core.truth_(or__3824__auto____12532)) {
          return or__3824__auto____12532
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
    var and__3822__auto____12533 = coll;
    if(cljs.core.truth_(and__3822__auto____12533)) {
      return coll.cljs$core$IVector$_assoc_n
    }else {
      return and__3822__auto____12533
    }
  }())) {
    return coll.cljs$core$IVector$_assoc_n(coll, n, val)
  }else {
    return function() {
      var or__3824__auto____12534 = cljs.core._assoc_n[goog.typeOf.call(null, coll)];
      if(cljs.core.truth_(or__3824__auto____12534)) {
        return or__3824__auto____12534
      }else {
        var or__3824__auto____12535 = cljs.core._assoc_n["_"];
        if(cljs.core.truth_(or__3824__auto____12535)) {
          return or__3824__auto____12535
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
    var and__3822__auto____12536 = o;
    if(cljs.core.truth_(and__3822__auto____12536)) {
      return o.cljs$core$IDeref$_deref
    }else {
      return and__3822__auto____12536
    }
  }())) {
    return o.cljs$core$IDeref$_deref(o)
  }else {
    return function() {
      var or__3824__auto____12537 = cljs.core._deref[goog.typeOf.call(null, o)];
      if(cljs.core.truth_(or__3824__auto____12537)) {
        return or__3824__auto____12537
      }else {
        var or__3824__auto____12538 = cljs.core._deref["_"];
        if(cljs.core.truth_(or__3824__auto____12538)) {
          return or__3824__auto____12538
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
    var and__3822__auto____12539 = o;
    if(cljs.core.truth_(and__3822__auto____12539)) {
      return o.cljs$core$IDerefWithTimeout$_deref_with_timeout
    }else {
      return and__3822__auto____12539
    }
  }())) {
    return o.cljs$core$IDerefWithTimeout$_deref_with_timeout(o, msec, timeout_val)
  }else {
    return function() {
      var or__3824__auto____12540 = cljs.core._deref_with_timeout[goog.typeOf.call(null, o)];
      if(cljs.core.truth_(or__3824__auto____12540)) {
        return or__3824__auto____12540
      }else {
        var or__3824__auto____12541 = cljs.core._deref_with_timeout["_"];
        if(cljs.core.truth_(or__3824__auto____12541)) {
          return or__3824__auto____12541
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
    var and__3822__auto____12542 = o;
    if(cljs.core.truth_(and__3822__auto____12542)) {
      return o.cljs$core$IMeta$_meta
    }else {
      return and__3822__auto____12542
    }
  }())) {
    return o.cljs$core$IMeta$_meta(o)
  }else {
    return function() {
      var or__3824__auto____12543 = cljs.core._meta[goog.typeOf.call(null, o)];
      if(cljs.core.truth_(or__3824__auto____12543)) {
        return or__3824__auto____12543
      }else {
        var or__3824__auto____12544 = cljs.core._meta["_"];
        if(cljs.core.truth_(or__3824__auto____12544)) {
          return or__3824__auto____12544
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
    var and__3822__auto____12545 = o;
    if(cljs.core.truth_(and__3822__auto____12545)) {
      return o.cljs$core$IWithMeta$_with_meta
    }else {
      return and__3822__auto____12545
    }
  }())) {
    return o.cljs$core$IWithMeta$_with_meta(o, meta)
  }else {
    return function() {
      var or__3824__auto____12546 = cljs.core._with_meta[goog.typeOf.call(null, o)];
      if(cljs.core.truth_(or__3824__auto____12546)) {
        return or__3824__auto____12546
      }else {
        var or__3824__auto____12547 = cljs.core._with_meta["_"];
        if(cljs.core.truth_(or__3824__auto____12547)) {
          return or__3824__auto____12547
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
  var _reduce__12554 = function(coll, f) {
    if(cljs.core.truth_(function() {
      var and__3822__auto____12548 = coll;
      if(cljs.core.truth_(and__3822__auto____12548)) {
        return coll.cljs$core$IReduce$_reduce
      }else {
        return and__3822__auto____12548
      }
    }())) {
      return coll.cljs$core$IReduce$_reduce(coll, f)
    }else {
      return function() {
        var or__3824__auto____12549 = cljs.core._reduce[goog.typeOf.call(null, coll)];
        if(cljs.core.truth_(or__3824__auto____12549)) {
          return or__3824__auto____12549
        }else {
          var or__3824__auto____12550 = cljs.core._reduce["_"];
          if(cljs.core.truth_(or__3824__auto____12550)) {
            return or__3824__auto____12550
          }else {
            throw cljs.core.missing_protocol.call(null, "IReduce.-reduce", coll);
          }
        }
      }().call(null, coll, f)
    }
  };
  var _reduce__12555 = function(coll, f, start) {
    if(cljs.core.truth_(function() {
      var and__3822__auto____12551 = coll;
      if(cljs.core.truth_(and__3822__auto____12551)) {
        return coll.cljs$core$IReduce$_reduce
      }else {
        return and__3822__auto____12551
      }
    }())) {
      return coll.cljs$core$IReduce$_reduce(coll, f, start)
    }else {
      return function() {
        var or__3824__auto____12552 = cljs.core._reduce[goog.typeOf.call(null, coll)];
        if(cljs.core.truth_(or__3824__auto____12552)) {
          return or__3824__auto____12552
        }else {
          var or__3824__auto____12553 = cljs.core._reduce["_"];
          if(cljs.core.truth_(or__3824__auto____12553)) {
            return or__3824__auto____12553
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
        return _reduce__12554.call(this, coll, f);
      case 3:
        return _reduce__12555.call(this, coll, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return _reduce
}();
cljs.core.IEquiv = {};
cljs.core._equiv = function _equiv(o, other) {
  if(cljs.core.truth_(function() {
    var and__3822__auto____12557 = o;
    if(cljs.core.truth_(and__3822__auto____12557)) {
      return o.cljs$core$IEquiv$_equiv
    }else {
      return and__3822__auto____12557
    }
  }())) {
    return o.cljs$core$IEquiv$_equiv(o, other)
  }else {
    return function() {
      var or__3824__auto____12558 = cljs.core._equiv[goog.typeOf.call(null, o)];
      if(cljs.core.truth_(or__3824__auto____12558)) {
        return or__3824__auto____12558
      }else {
        var or__3824__auto____12559 = cljs.core._equiv["_"];
        if(cljs.core.truth_(or__3824__auto____12559)) {
          return or__3824__auto____12559
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
    var and__3822__auto____12560 = o;
    if(cljs.core.truth_(and__3822__auto____12560)) {
      return o.cljs$core$IHash$_hash
    }else {
      return and__3822__auto____12560
    }
  }())) {
    return o.cljs$core$IHash$_hash(o)
  }else {
    return function() {
      var or__3824__auto____12561 = cljs.core._hash[goog.typeOf.call(null, o)];
      if(cljs.core.truth_(or__3824__auto____12561)) {
        return or__3824__auto____12561
      }else {
        var or__3824__auto____12562 = cljs.core._hash["_"];
        if(cljs.core.truth_(or__3824__auto____12562)) {
          return or__3824__auto____12562
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
    var and__3822__auto____12563 = o;
    if(cljs.core.truth_(and__3822__auto____12563)) {
      return o.cljs$core$ISeqable$_seq
    }else {
      return and__3822__auto____12563
    }
  }())) {
    return o.cljs$core$ISeqable$_seq(o)
  }else {
    return function() {
      var or__3824__auto____12564 = cljs.core._seq[goog.typeOf.call(null, o)];
      if(cljs.core.truth_(or__3824__auto____12564)) {
        return or__3824__auto____12564
      }else {
        var or__3824__auto____12565 = cljs.core._seq["_"];
        if(cljs.core.truth_(or__3824__auto____12565)) {
          return or__3824__auto____12565
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
    var and__3822__auto____12566 = o;
    if(cljs.core.truth_(and__3822__auto____12566)) {
      return o.cljs$core$IPrintable$_pr_seq
    }else {
      return and__3822__auto____12566
    }
  }())) {
    return o.cljs$core$IPrintable$_pr_seq(o, opts)
  }else {
    return function() {
      var or__3824__auto____12567 = cljs.core._pr_seq[goog.typeOf.call(null, o)];
      if(cljs.core.truth_(or__3824__auto____12567)) {
        return or__3824__auto____12567
      }else {
        var or__3824__auto____12568 = cljs.core._pr_seq["_"];
        if(cljs.core.truth_(or__3824__auto____12568)) {
          return or__3824__auto____12568
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
    var and__3822__auto____12569 = d;
    if(cljs.core.truth_(and__3822__auto____12569)) {
      return d.cljs$core$IPending$_realized_QMARK_
    }else {
      return and__3822__auto____12569
    }
  }())) {
    return d.cljs$core$IPending$_realized_QMARK_(d)
  }else {
    return function() {
      var or__3824__auto____12570 = cljs.core._realized_QMARK_[goog.typeOf.call(null, d)];
      if(cljs.core.truth_(or__3824__auto____12570)) {
        return or__3824__auto____12570
      }else {
        var or__3824__auto____12571 = cljs.core._realized_QMARK_["_"];
        if(cljs.core.truth_(or__3824__auto____12571)) {
          return or__3824__auto____12571
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
    var and__3822__auto____12572 = this$;
    if(cljs.core.truth_(and__3822__auto____12572)) {
      return this$.cljs$core$IWatchable$_notify_watches
    }else {
      return and__3822__auto____12572
    }
  }())) {
    return this$.cljs$core$IWatchable$_notify_watches(this$, oldval, newval)
  }else {
    return function() {
      var or__3824__auto____12573 = cljs.core._notify_watches[goog.typeOf.call(null, this$)];
      if(cljs.core.truth_(or__3824__auto____12573)) {
        return or__3824__auto____12573
      }else {
        var or__3824__auto____12574 = cljs.core._notify_watches["_"];
        if(cljs.core.truth_(or__3824__auto____12574)) {
          return or__3824__auto____12574
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-notify-watches", this$);
        }
      }
    }().call(null, this$, oldval, newval)
  }
};
cljs.core._add_watch = function _add_watch(this$, key, f) {
  if(cljs.core.truth_(function() {
    var and__3822__auto____12575 = this$;
    if(cljs.core.truth_(and__3822__auto____12575)) {
      return this$.cljs$core$IWatchable$_add_watch
    }else {
      return and__3822__auto____12575
    }
  }())) {
    return this$.cljs$core$IWatchable$_add_watch(this$, key, f)
  }else {
    return function() {
      var or__3824__auto____12576 = cljs.core._add_watch[goog.typeOf.call(null, this$)];
      if(cljs.core.truth_(or__3824__auto____12576)) {
        return or__3824__auto____12576
      }else {
        var or__3824__auto____12577 = cljs.core._add_watch["_"];
        if(cljs.core.truth_(or__3824__auto____12577)) {
          return or__3824__auto____12577
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-add-watch", this$);
        }
      }
    }().call(null, this$, key, f)
  }
};
cljs.core._remove_watch = function _remove_watch(this$, key) {
  if(cljs.core.truth_(function() {
    var and__3822__auto____12578 = this$;
    if(cljs.core.truth_(and__3822__auto____12578)) {
      return this$.cljs$core$IWatchable$_remove_watch
    }else {
      return and__3822__auto____12578
    }
  }())) {
    return this$.cljs$core$IWatchable$_remove_watch(this$, key)
  }else {
    return function() {
      var or__3824__auto____12579 = cljs.core._remove_watch[goog.typeOf.call(null, this$)];
      if(cljs.core.truth_(or__3824__auto____12579)) {
        return or__3824__auto____12579
      }else {
        var or__3824__auto____12580 = cljs.core._remove_watch["_"];
        if(cljs.core.truth_(or__3824__auto____12580)) {
          return or__3824__auto____12580
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
  var G__12581 = null;
  var G__12581__12582 = function(o, k) {
    return null
  };
  var G__12581__12583 = function(o, k, not_found) {
    return not_found
  };
  G__12581 = function(o, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__12581__12582.call(this, o, k);
      case 3:
        return G__12581__12583.call(this, o, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__12581
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
  var G__12585 = null;
  var G__12585__12586 = function(_, f) {
    return f.call(null)
  };
  var G__12585__12587 = function(_, f, start) {
    return start
  };
  G__12585 = function(_, f, start) {
    switch(arguments.length) {
      case 2:
        return G__12585__12586.call(this, _, f);
      case 3:
        return G__12585__12587.call(this, _, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__12585
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
  var G__12589 = null;
  var G__12589__12590 = function(_, n) {
    return null
  };
  var G__12589__12591 = function(_, n, not_found) {
    return not_found
  };
  G__12589 = function(_, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__12589__12590.call(this, _, n);
      case 3:
        return G__12589__12591.call(this, _, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__12589
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
  var ci_reduce__12599 = function(cicoll, f) {
    if(cljs.core.truth_(cljs.core._EQ_.call(null, 0, cljs.core._count.call(null, cicoll)))) {
      return f.call(null)
    }else {
      var val__12593 = cljs.core._nth.call(null, cicoll, 0);
      var n__12594 = 1;
      while(true) {
        if(cljs.core.truth_(n__12594 < cljs.core._count.call(null, cicoll))) {
          var G__12603 = f.call(null, val__12593, cljs.core._nth.call(null, cicoll, n__12594));
          var G__12604 = n__12594 + 1;
          val__12593 = G__12603;
          n__12594 = G__12604;
          continue
        }else {
          return val__12593
        }
        break
      }
    }
  };
  var ci_reduce__12600 = function(cicoll, f, val) {
    var val__12595 = val;
    var n__12596 = 0;
    while(true) {
      if(cljs.core.truth_(n__12596 < cljs.core._count.call(null, cicoll))) {
        var G__12605 = f.call(null, val__12595, cljs.core._nth.call(null, cicoll, n__12596));
        var G__12606 = n__12596 + 1;
        val__12595 = G__12605;
        n__12596 = G__12606;
        continue
      }else {
        return val__12595
      }
      break
    }
  };
  var ci_reduce__12601 = function(cicoll, f, val, idx) {
    var val__12597 = val;
    var n__12598 = idx;
    while(true) {
      if(cljs.core.truth_(n__12598 < cljs.core._count.call(null, cicoll))) {
        var G__12607 = f.call(null, val__12597, cljs.core._nth.call(null, cicoll, n__12598));
        var G__12608 = n__12598 + 1;
        val__12597 = G__12607;
        n__12598 = G__12608;
        continue
      }else {
        return val__12597
      }
      break
    }
  };
  ci_reduce = function(cicoll, f, val, idx) {
    switch(arguments.length) {
      case 2:
        return ci_reduce__12599.call(this, cicoll, f);
      case 3:
        return ci_reduce__12600.call(this, cicoll, f, val);
      case 4:
        return ci_reduce__12601.call(this, cicoll, f, val, idx)
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
  var this__12609 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.IndexedSeq.prototype.cljs$core$IReduce$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$IReduce$_reduce = function() {
  var G__12622 = null;
  var G__12622__12623 = function(_, f) {
    var this__12610 = this;
    return cljs.core.ci_reduce.call(null, this__12610.a, f, this__12610.a[this__12610.i], this__12610.i + 1)
  };
  var G__12622__12624 = function(_, f, start) {
    var this__12611 = this;
    return cljs.core.ci_reduce.call(null, this__12611.a, f, start, this__12611.i)
  };
  G__12622 = function(_, f, start) {
    switch(arguments.length) {
      case 2:
        return G__12622__12623.call(this, _, f);
      case 3:
        return G__12622__12624.call(this, _, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__12622
}();
cljs.core.IndexedSeq.prototype.cljs$core$ICollection$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$ICollection$_conj = function(coll, o) {
  var this__12612 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.IndexedSeq.prototype.cljs$core$IEquiv$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$IEquiv$_equiv = function(coll, other) {
  var this__12613 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.IndexedSeq.prototype.cljs$core$ISequential$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$IIndexed$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$IIndexed$_nth = function() {
  var G__12626 = null;
  var G__12626__12627 = function(coll, n) {
    var this__12614 = this;
    var i__12615 = n + this__12614.i;
    if(cljs.core.truth_(i__12615 < this__12614.a.length)) {
      return this__12614.a[i__12615]
    }else {
      return null
    }
  };
  var G__12626__12628 = function(coll, n, not_found) {
    var this__12616 = this;
    var i__12617 = n + this__12616.i;
    if(cljs.core.truth_(i__12617 < this__12616.a.length)) {
      return this__12616.a[i__12617]
    }else {
      return not_found
    }
  };
  G__12626 = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__12626__12627.call(this, coll, n);
      case 3:
        return G__12626__12628.call(this, coll, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__12626
}();
cljs.core.IndexedSeq.prototype.cljs$core$ICounted$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$ICounted$_count = function(_) {
  var this__12618 = this;
  return this__12618.a.length - this__12618.i
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeq$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$ISeq$_first = function(_) {
  var this__12619 = this;
  return this__12619.a[this__12619.i]
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeq$_rest = function(_) {
  var this__12620 = this;
  if(cljs.core.truth_(this__12620.i + 1 < this__12620.a.length)) {
    return new cljs.core.IndexedSeq(this__12620.a, this__12620.i + 1)
  }else {
    return cljs.core.list.call(null)
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeqable$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$ISeqable$_seq = function(this$) {
  var this__12621 = this;
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
  var G__12630 = null;
  var G__12630__12631 = function(array, f) {
    return cljs.core.ci_reduce.call(null, array, f)
  };
  var G__12630__12632 = function(array, f, start) {
    return cljs.core.ci_reduce.call(null, array, f, start)
  };
  G__12630 = function(array, f, start) {
    switch(arguments.length) {
      case 2:
        return G__12630__12631.call(this, array, f);
      case 3:
        return G__12630__12632.call(this, array, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__12630
}();
cljs.core.ILookup["array"] = true;
cljs.core._lookup["array"] = function() {
  var G__12634 = null;
  var G__12634__12635 = function(array, k) {
    return array[k]
  };
  var G__12634__12636 = function(array, k, not_found) {
    return cljs.core._nth.call(null, array, k, not_found)
  };
  G__12634 = function(array, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__12634__12635.call(this, array, k);
      case 3:
        return G__12634__12636.call(this, array, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__12634
}();
cljs.core.IIndexed["array"] = true;
cljs.core._nth["array"] = function() {
  var G__12638 = null;
  var G__12638__12639 = function(array, n) {
    if(cljs.core.truth_(n < array.length)) {
      return array[n]
    }else {
      return null
    }
  };
  var G__12638__12640 = function(array, n, not_found) {
    if(cljs.core.truth_(n < array.length)) {
      return array[n]
    }else {
      return not_found
    }
  };
  G__12638 = function(array, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__12638__12639.call(this, array, n);
      case 3:
        return G__12638__12640.call(this, array, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__12638
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
  var temp__3974__auto____12642 = cljs.core.seq.call(null, coll);
  if(cljs.core.truth_(temp__3974__auto____12642)) {
    var s__12643 = temp__3974__auto____12642;
    return cljs.core._first.call(null, s__12643)
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
      var G__12644 = cljs.core.next.call(null, s);
      s = G__12644;
      continue
    }else {
      return cljs.core.first.call(null, s)
    }
    break
  }
};
cljs.core.ICounted["_"] = true;
cljs.core._count["_"] = function(x) {
  var s__12645 = cljs.core.seq.call(null, x);
  var n__12646 = 0;
  while(true) {
    if(cljs.core.truth_(s__12645)) {
      var G__12647 = cljs.core.next.call(null, s__12645);
      var G__12648 = n__12646 + 1;
      s__12645 = G__12647;
      n__12646 = G__12648;
      continue
    }else {
      return n__12646
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
  var conj__12649 = function(coll, x) {
    return cljs.core._conj.call(null, coll, x)
  };
  var conj__12650 = function() {
    var G__12652__delegate = function(coll, x, xs) {
      while(true) {
        if(cljs.core.truth_(xs)) {
          var G__12653 = conj.call(null, coll, x);
          var G__12654 = cljs.core.first.call(null, xs);
          var G__12655 = cljs.core.next.call(null, xs);
          coll = G__12653;
          x = G__12654;
          xs = G__12655;
          continue
        }else {
          return conj.call(null, coll, x)
        }
        break
      }
    };
    var G__12652 = function(coll, x, var_args) {
      var xs = null;
      if(goog.isDef(var_args)) {
        xs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__12652__delegate.call(this, coll, x, xs)
    };
    G__12652.cljs$lang$maxFixedArity = 2;
    G__12652.cljs$lang$applyTo = function(arglist__12656) {
      var coll = cljs.core.first(arglist__12656);
      var x = cljs.core.first(cljs.core.next(arglist__12656));
      var xs = cljs.core.rest(cljs.core.next(arglist__12656));
      return G__12652__delegate.call(this, coll, x, xs)
    };
    return G__12652
  }();
  conj = function(coll, x, var_args) {
    var xs = var_args;
    switch(arguments.length) {
      case 2:
        return conj__12649.call(this, coll, x);
      default:
        return conj__12650.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  conj.cljs$lang$maxFixedArity = 2;
  conj.cljs$lang$applyTo = conj__12650.cljs$lang$applyTo;
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
  var nth__12657 = function(coll, n) {
    return cljs.core._nth.call(null, coll, Math.floor(n))
  };
  var nth__12658 = function(coll, n, not_found) {
    return cljs.core._nth.call(null, coll, Math.floor(n), not_found)
  };
  nth = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return nth__12657.call(this, coll, n);
      case 3:
        return nth__12658.call(this, coll, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return nth
}();
cljs.core.get = function() {
  var get = null;
  var get__12660 = function(o, k) {
    return cljs.core._lookup.call(null, o, k)
  };
  var get__12661 = function(o, k, not_found) {
    return cljs.core._lookup.call(null, o, k, not_found)
  };
  get = function(o, k, not_found) {
    switch(arguments.length) {
      case 2:
        return get__12660.call(this, o, k);
      case 3:
        return get__12661.call(this, o, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return get
}();
cljs.core.assoc = function() {
  var assoc = null;
  var assoc__12664 = function(coll, k, v) {
    return cljs.core._assoc.call(null, coll, k, v)
  };
  var assoc__12665 = function() {
    var G__12667__delegate = function(coll, k, v, kvs) {
      while(true) {
        var ret__12663 = assoc.call(null, coll, k, v);
        if(cljs.core.truth_(kvs)) {
          var G__12668 = ret__12663;
          var G__12669 = cljs.core.first.call(null, kvs);
          var G__12670 = cljs.core.second.call(null, kvs);
          var G__12671 = cljs.core.nnext.call(null, kvs);
          coll = G__12668;
          k = G__12669;
          v = G__12670;
          kvs = G__12671;
          continue
        }else {
          return ret__12663
        }
        break
      }
    };
    var G__12667 = function(coll, k, v, var_args) {
      var kvs = null;
      if(goog.isDef(var_args)) {
        kvs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__12667__delegate.call(this, coll, k, v, kvs)
    };
    G__12667.cljs$lang$maxFixedArity = 3;
    G__12667.cljs$lang$applyTo = function(arglist__12672) {
      var coll = cljs.core.first(arglist__12672);
      var k = cljs.core.first(cljs.core.next(arglist__12672));
      var v = cljs.core.first(cljs.core.next(cljs.core.next(arglist__12672)));
      var kvs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__12672)));
      return G__12667__delegate.call(this, coll, k, v, kvs)
    };
    return G__12667
  }();
  assoc = function(coll, k, v, var_args) {
    var kvs = var_args;
    switch(arguments.length) {
      case 3:
        return assoc__12664.call(this, coll, k, v);
      default:
        return assoc__12665.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  assoc.cljs$lang$maxFixedArity = 3;
  assoc.cljs$lang$applyTo = assoc__12665.cljs$lang$applyTo;
  return assoc
}();
cljs.core.dissoc = function() {
  var dissoc = null;
  var dissoc__12674 = function(coll) {
    return coll
  };
  var dissoc__12675 = function(coll, k) {
    return cljs.core._dissoc.call(null, coll, k)
  };
  var dissoc__12676 = function() {
    var G__12678__delegate = function(coll, k, ks) {
      while(true) {
        var ret__12673 = dissoc.call(null, coll, k);
        if(cljs.core.truth_(ks)) {
          var G__12679 = ret__12673;
          var G__12680 = cljs.core.first.call(null, ks);
          var G__12681 = cljs.core.next.call(null, ks);
          coll = G__12679;
          k = G__12680;
          ks = G__12681;
          continue
        }else {
          return ret__12673
        }
        break
      }
    };
    var G__12678 = function(coll, k, var_args) {
      var ks = null;
      if(goog.isDef(var_args)) {
        ks = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__12678__delegate.call(this, coll, k, ks)
    };
    G__12678.cljs$lang$maxFixedArity = 2;
    G__12678.cljs$lang$applyTo = function(arglist__12682) {
      var coll = cljs.core.first(arglist__12682);
      var k = cljs.core.first(cljs.core.next(arglist__12682));
      var ks = cljs.core.rest(cljs.core.next(arglist__12682));
      return G__12678__delegate.call(this, coll, k, ks)
    };
    return G__12678
  }();
  dissoc = function(coll, k, var_args) {
    var ks = var_args;
    switch(arguments.length) {
      case 1:
        return dissoc__12674.call(this, coll);
      case 2:
        return dissoc__12675.call(this, coll, k);
      default:
        return dissoc__12676.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  dissoc.cljs$lang$maxFixedArity = 2;
  dissoc.cljs$lang$applyTo = dissoc__12676.cljs$lang$applyTo;
  return dissoc
}();
cljs.core.with_meta = function with_meta(o, meta) {
  return cljs.core._with_meta.call(null, o, meta)
};
cljs.core.meta = function meta(o) {
  if(cljs.core.truth_(function() {
    var x__451__auto____12683 = o;
    if(cljs.core.truth_(function() {
      var and__3822__auto____12684 = x__451__auto____12683;
      if(cljs.core.truth_(and__3822__auto____12684)) {
        var and__3822__auto____12685 = x__451__auto____12683.cljs$core$IMeta$;
        if(cljs.core.truth_(and__3822__auto____12685)) {
          return cljs.core.not.call(null, x__451__auto____12683.hasOwnProperty("cljs$core$IMeta$"))
        }else {
          return and__3822__auto____12685
        }
      }else {
        return and__3822__auto____12684
      }
    }())) {
      return true
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, x__451__auto____12683)
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
  var disj__12687 = function(coll) {
    return coll
  };
  var disj__12688 = function(coll, k) {
    return cljs.core._disjoin.call(null, coll, k)
  };
  var disj__12689 = function() {
    var G__12691__delegate = function(coll, k, ks) {
      while(true) {
        var ret__12686 = disj.call(null, coll, k);
        if(cljs.core.truth_(ks)) {
          var G__12692 = ret__12686;
          var G__12693 = cljs.core.first.call(null, ks);
          var G__12694 = cljs.core.next.call(null, ks);
          coll = G__12692;
          k = G__12693;
          ks = G__12694;
          continue
        }else {
          return ret__12686
        }
        break
      }
    };
    var G__12691 = function(coll, k, var_args) {
      var ks = null;
      if(goog.isDef(var_args)) {
        ks = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__12691__delegate.call(this, coll, k, ks)
    };
    G__12691.cljs$lang$maxFixedArity = 2;
    G__12691.cljs$lang$applyTo = function(arglist__12695) {
      var coll = cljs.core.first(arglist__12695);
      var k = cljs.core.first(cljs.core.next(arglist__12695));
      var ks = cljs.core.rest(cljs.core.next(arglist__12695));
      return G__12691__delegate.call(this, coll, k, ks)
    };
    return G__12691
  }();
  disj = function(coll, k, var_args) {
    var ks = var_args;
    switch(arguments.length) {
      case 1:
        return disj__12687.call(this, coll);
      case 2:
        return disj__12688.call(this, coll, k);
      default:
        return disj__12689.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  disj.cljs$lang$maxFixedArity = 2;
  disj.cljs$lang$applyTo = disj__12689.cljs$lang$applyTo;
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
    var x__451__auto____12696 = x;
    if(cljs.core.truth_(function() {
      var and__3822__auto____12697 = x__451__auto____12696;
      if(cljs.core.truth_(and__3822__auto____12697)) {
        var and__3822__auto____12698 = x__451__auto____12696.cljs$core$ICollection$;
        if(cljs.core.truth_(and__3822__auto____12698)) {
          return cljs.core.not.call(null, x__451__auto____12696.hasOwnProperty("cljs$core$ICollection$"))
        }else {
          return and__3822__auto____12698
        }
      }else {
        return and__3822__auto____12697
      }
    }())) {
      return true
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ICollection, x__451__auto____12696)
    }
  }
};
cljs.core.set_QMARK_ = function set_QMARK_(x) {
  if(cljs.core.truth_(x === null)) {
    return false
  }else {
    var x__451__auto____12699 = x;
    if(cljs.core.truth_(function() {
      var and__3822__auto____12700 = x__451__auto____12699;
      if(cljs.core.truth_(and__3822__auto____12700)) {
        var and__3822__auto____12701 = x__451__auto____12699.cljs$core$ISet$;
        if(cljs.core.truth_(and__3822__auto____12701)) {
          return cljs.core.not.call(null, x__451__auto____12699.hasOwnProperty("cljs$core$ISet$"))
        }else {
          return and__3822__auto____12701
        }
      }else {
        return and__3822__auto____12700
      }
    }())) {
      return true
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ISet, x__451__auto____12699)
    }
  }
};
cljs.core.associative_QMARK_ = function associative_QMARK_(x) {
  var x__451__auto____12702 = x;
  if(cljs.core.truth_(function() {
    var and__3822__auto____12703 = x__451__auto____12702;
    if(cljs.core.truth_(and__3822__auto____12703)) {
      var and__3822__auto____12704 = x__451__auto____12702.cljs$core$IAssociative$;
      if(cljs.core.truth_(and__3822__auto____12704)) {
        return cljs.core.not.call(null, x__451__auto____12702.hasOwnProperty("cljs$core$IAssociative$"))
      }else {
        return and__3822__auto____12704
      }
    }else {
      return and__3822__auto____12703
    }
  }())) {
    return true
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IAssociative, x__451__auto____12702)
  }
};
cljs.core.sequential_QMARK_ = function sequential_QMARK_(x) {
  var x__451__auto____12705 = x;
  if(cljs.core.truth_(function() {
    var and__3822__auto____12706 = x__451__auto____12705;
    if(cljs.core.truth_(and__3822__auto____12706)) {
      var and__3822__auto____12707 = x__451__auto____12705.cljs$core$ISequential$;
      if(cljs.core.truth_(and__3822__auto____12707)) {
        return cljs.core.not.call(null, x__451__auto____12705.hasOwnProperty("cljs$core$ISequential$"))
      }else {
        return and__3822__auto____12707
      }
    }else {
      return and__3822__auto____12706
    }
  }())) {
    return true
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ISequential, x__451__auto____12705)
  }
};
cljs.core.counted_QMARK_ = function counted_QMARK_(x) {
  var x__451__auto____12708 = x;
  if(cljs.core.truth_(function() {
    var and__3822__auto____12709 = x__451__auto____12708;
    if(cljs.core.truth_(and__3822__auto____12709)) {
      var and__3822__auto____12710 = x__451__auto____12708.cljs$core$ICounted$;
      if(cljs.core.truth_(and__3822__auto____12710)) {
        return cljs.core.not.call(null, x__451__auto____12708.hasOwnProperty("cljs$core$ICounted$"))
      }else {
        return and__3822__auto____12710
      }
    }else {
      return and__3822__auto____12709
    }
  }())) {
    return true
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ICounted, x__451__auto____12708)
  }
};
cljs.core.map_QMARK_ = function map_QMARK_(x) {
  if(cljs.core.truth_(x === null)) {
    return false
  }else {
    var x__451__auto____12711 = x;
    if(cljs.core.truth_(function() {
      var and__3822__auto____12712 = x__451__auto____12711;
      if(cljs.core.truth_(and__3822__auto____12712)) {
        var and__3822__auto____12713 = x__451__auto____12711.cljs$core$IMap$;
        if(cljs.core.truth_(and__3822__auto____12713)) {
          return cljs.core.not.call(null, x__451__auto____12711.hasOwnProperty("cljs$core$IMap$"))
        }else {
          return and__3822__auto____12713
        }
      }else {
        return and__3822__auto____12712
      }
    }())) {
      return true
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IMap, x__451__auto____12711)
    }
  }
};
cljs.core.vector_QMARK_ = function vector_QMARK_(x) {
  var x__451__auto____12714 = x;
  if(cljs.core.truth_(function() {
    var and__3822__auto____12715 = x__451__auto____12714;
    if(cljs.core.truth_(and__3822__auto____12715)) {
      var and__3822__auto____12716 = x__451__auto____12714.cljs$core$IVector$;
      if(cljs.core.truth_(and__3822__auto____12716)) {
        return cljs.core.not.call(null, x__451__auto____12714.hasOwnProperty("cljs$core$IVector$"))
      }else {
        return and__3822__auto____12716
      }
    }else {
      return and__3822__auto____12715
    }
  }())) {
    return true
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IVector, x__451__auto____12714)
  }
};
cljs.core.js_obj = function js_obj() {
  return{}
};
cljs.core.js_keys = function js_keys(obj) {
  var keys__12717 = [];
  goog.object.forEach.call(null, obj, function(val, key, obj) {
    return keys__12717.push(key)
  });
  return keys__12717
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
    var x__451__auto____12718 = s;
    if(cljs.core.truth_(function() {
      var and__3822__auto____12719 = x__451__auto____12718;
      if(cljs.core.truth_(and__3822__auto____12719)) {
        var and__3822__auto____12720 = x__451__auto____12718.cljs$core$ISeq$;
        if(cljs.core.truth_(and__3822__auto____12720)) {
          return cljs.core.not.call(null, x__451__auto____12718.hasOwnProperty("cljs$core$ISeq$"))
        }else {
          return and__3822__auto____12720
        }
      }else {
        return and__3822__auto____12719
      }
    }())) {
      return true
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, x__451__auto____12718)
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
  var and__3822__auto____12721 = goog.isString.call(null, x);
  if(cljs.core.truth_(and__3822__auto____12721)) {
    return cljs.core.not.call(null, function() {
      var or__3824__auto____12722 = cljs.core._EQ_.call(null, x.charAt(0), "\ufdd0");
      if(cljs.core.truth_(or__3824__auto____12722)) {
        return or__3824__auto____12722
      }else {
        return cljs.core._EQ_.call(null, x.charAt(0), "\ufdd1")
      }
    }())
  }else {
    return and__3822__auto____12721
  }
};
cljs.core.keyword_QMARK_ = function keyword_QMARK_(x) {
  var and__3822__auto____12723 = goog.isString.call(null, x);
  if(cljs.core.truth_(and__3822__auto____12723)) {
    return cljs.core._EQ_.call(null, x.charAt(0), "\ufdd0")
  }else {
    return and__3822__auto____12723
  }
};
cljs.core.symbol_QMARK_ = function symbol_QMARK_(x) {
  var and__3822__auto____12724 = goog.isString.call(null, x);
  if(cljs.core.truth_(and__3822__auto____12724)) {
    return cljs.core._EQ_.call(null, x.charAt(0), "\ufdd1")
  }else {
    return and__3822__auto____12724
  }
};
cljs.core.number_QMARK_ = function number_QMARK_(n) {
  return goog.isNumber.call(null, n)
};
cljs.core.fn_QMARK_ = function fn_QMARK_(f) {
  return goog.isFunction.call(null, f)
};
cljs.core.integer_QMARK_ = function integer_QMARK_(n) {
  var and__3822__auto____12725 = cljs.core.number_QMARK_.call(null, n);
  if(cljs.core.truth_(and__3822__auto____12725)) {
    return n == n.toFixed()
  }else {
    return and__3822__auto____12725
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
    var and__3822__auto____12726 = coll;
    if(cljs.core.truth_(and__3822__auto____12726)) {
      var and__3822__auto____12727 = cljs.core.associative_QMARK_.call(null, coll);
      if(cljs.core.truth_(and__3822__auto____12727)) {
        return cljs.core.contains_QMARK_.call(null, coll, k)
      }else {
        return and__3822__auto____12727
      }
    }else {
      return and__3822__auto____12726
    }
  }())) {
    return cljs.core.PersistentVector.fromArray([k, cljs.core._lookup.call(null, coll, k)])
  }else {
    return null
  }
};
cljs.core.distinct_QMARK_ = function() {
  var distinct_QMARK_ = null;
  var distinct_QMARK___12732 = function(x) {
    return true
  };
  var distinct_QMARK___12733 = function(x, y) {
    return cljs.core.not.call(null, cljs.core._EQ_.call(null, x, y))
  };
  var distinct_QMARK___12734 = function() {
    var G__12736__delegate = function(x, y, more) {
      if(cljs.core.truth_(cljs.core.not.call(null, cljs.core._EQ_.call(null, x, y)))) {
        var s__12728 = cljs.core.set([y, x]);
        var xs__12729 = more;
        while(true) {
          var x__12730 = cljs.core.first.call(null, xs__12729);
          var etc__12731 = cljs.core.next.call(null, xs__12729);
          if(cljs.core.truth_(xs__12729)) {
            if(cljs.core.truth_(cljs.core.contains_QMARK_.call(null, s__12728, x__12730))) {
              return false
            }else {
              var G__12737 = cljs.core.conj.call(null, s__12728, x__12730);
              var G__12738 = etc__12731;
              s__12728 = G__12737;
              xs__12729 = G__12738;
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
    var G__12736 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__12736__delegate.call(this, x, y, more)
    };
    G__12736.cljs$lang$maxFixedArity = 2;
    G__12736.cljs$lang$applyTo = function(arglist__12739) {
      var x = cljs.core.first(arglist__12739);
      var y = cljs.core.first(cljs.core.next(arglist__12739));
      var more = cljs.core.rest(cljs.core.next(arglist__12739));
      return G__12736__delegate.call(this, x, y, more)
    };
    return G__12736
  }();
  distinct_QMARK_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return distinct_QMARK___12732.call(this, x);
      case 2:
        return distinct_QMARK___12733.call(this, x, y);
      default:
        return distinct_QMARK___12734.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  distinct_QMARK_.cljs$lang$maxFixedArity = 2;
  distinct_QMARK_.cljs$lang$applyTo = distinct_QMARK___12734.cljs$lang$applyTo;
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
      var r__12740 = f.call(null, x, y);
      if(cljs.core.truth_(cljs.core.number_QMARK_.call(null, r__12740))) {
        return r__12740
      }else {
        if(cljs.core.truth_(r__12740)) {
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
  var sort__12742 = function(coll) {
    return sort.call(null, cljs.core.compare, coll)
  };
  var sort__12743 = function(comp, coll) {
    if(cljs.core.truth_(cljs.core.seq.call(null, coll))) {
      var a__12741 = cljs.core.to_array.call(null, coll);
      goog.array.stableSort.call(null, a__12741, cljs.core.fn__GT_comparator.call(null, comp));
      return cljs.core.seq.call(null, a__12741)
    }else {
      return cljs.core.List.EMPTY
    }
  };
  sort = function(comp, coll) {
    switch(arguments.length) {
      case 1:
        return sort__12742.call(this, comp);
      case 2:
        return sort__12743.call(this, comp, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return sort
}();
cljs.core.sort_by = function() {
  var sort_by = null;
  var sort_by__12745 = function(keyfn, coll) {
    return sort_by.call(null, keyfn, cljs.core.compare, coll)
  };
  var sort_by__12746 = function(keyfn, comp, coll) {
    return cljs.core.sort.call(null, function(x, y) {
      return cljs.core.fn__GT_comparator.call(null, comp).call(null, keyfn.call(null, x), keyfn.call(null, y))
    }, coll)
  };
  sort_by = function(keyfn, comp, coll) {
    switch(arguments.length) {
      case 2:
        return sort_by__12745.call(this, keyfn, comp);
      case 3:
        return sort_by__12746.call(this, keyfn, comp, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return sort_by
}();
cljs.core.reduce = function() {
  var reduce = null;
  var reduce__12748 = function(f, coll) {
    return cljs.core._reduce.call(null, coll, f)
  };
  var reduce__12749 = function(f, val, coll) {
    return cljs.core._reduce.call(null, coll, f, val)
  };
  reduce = function(f, val, coll) {
    switch(arguments.length) {
      case 2:
        return reduce__12748.call(this, f, val);
      case 3:
        return reduce__12749.call(this, f, val, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return reduce
}();
cljs.core.seq_reduce = function() {
  var seq_reduce = null;
  var seq_reduce__12755 = function(f, coll) {
    var temp__3971__auto____12751 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3971__auto____12751)) {
      var s__12752 = temp__3971__auto____12751;
      return cljs.core.reduce.call(null, f, cljs.core.first.call(null, s__12752), cljs.core.next.call(null, s__12752))
    }else {
      return f.call(null)
    }
  };
  var seq_reduce__12756 = function(f, val, coll) {
    var val__12753 = val;
    var coll__12754 = cljs.core.seq.call(null, coll);
    while(true) {
      if(cljs.core.truth_(coll__12754)) {
        var G__12758 = f.call(null, val__12753, cljs.core.first.call(null, coll__12754));
        var G__12759 = cljs.core.next.call(null, coll__12754);
        val__12753 = G__12758;
        coll__12754 = G__12759;
        continue
      }else {
        return val__12753
      }
      break
    }
  };
  seq_reduce = function(f, val, coll) {
    switch(arguments.length) {
      case 2:
        return seq_reduce__12755.call(this, f, val);
      case 3:
        return seq_reduce__12756.call(this, f, val, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return seq_reduce
}();
cljs.core.IReduce["_"] = true;
cljs.core._reduce["_"] = function() {
  var G__12760 = null;
  var G__12760__12761 = function(coll, f) {
    return cljs.core.seq_reduce.call(null, f, coll)
  };
  var G__12760__12762 = function(coll, f, start) {
    return cljs.core.seq_reduce.call(null, f, start, coll)
  };
  G__12760 = function(coll, f, start) {
    switch(arguments.length) {
      case 2:
        return G__12760__12761.call(this, coll, f);
      case 3:
        return G__12760__12762.call(this, coll, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__12760
}();
cljs.core._PLUS_ = function() {
  var _PLUS_ = null;
  var _PLUS___12764 = function() {
    return 0
  };
  var _PLUS___12765 = function(x) {
    return x
  };
  var _PLUS___12766 = function(x, y) {
    return x + y
  };
  var _PLUS___12767 = function() {
    var G__12769__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _PLUS_, x + y, more)
    };
    var G__12769 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__12769__delegate.call(this, x, y, more)
    };
    G__12769.cljs$lang$maxFixedArity = 2;
    G__12769.cljs$lang$applyTo = function(arglist__12770) {
      var x = cljs.core.first(arglist__12770);
      var y = cljs.core.first(cljs.core.next(arglist__12770));
      var more = cljs.core.rest(cljs.core.next(arglist__12770));
      return G__12769__delegate.call(this, x, y, more)
    };
    return G__12769
  }();
  _PLUS_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 0:
        return _PLUS___12764.call(this);
      case 1:
        return _PLUS___12765.call(this, x);
      case 2:
        return _PLUS___12766.call(this, x, y);
      default:
        return _PLUS___12767.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _PLUS_.cljs$lang$maxFixedArity = 2;
  _PLUS_.cljs$lang$applyTo = _PLUS___12767.cljs$lang$applyTo;
  return _PLUS_
}();
cljs.core._ = function() {
  var _ = null;
  var ___12771 = function(x) {
    return-x
  };
  var ___12772 = function(x, y) {
    return x - y
  };
  var ___12773 = function() {
    var G__12775__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _, x - y, more)
    };
    var G__12775 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__12775__delegate.call(this, x, y, more)
    };
    G__12775.cljs$lang$maxFixedArity = 2;
    G__12775.cljs$lang$applyTo = function(arglist__12776) {
      var x = cljs.core.first(arglist__12776);
      var y = cljs.core.first(cljs.core.next(arglist__12776));
      var more = cljs.core.rest(cljs.core.next(arglist__12776));
      return G__12775__delegate.call(this, x, y, more)
    };
    return G__12775
  }();
  _ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return ___12771.call(this, x);
      case 2:
        return ___12772.call(this, x, y);
      default:
        return ___12773.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _.cljs$lang$maxFixedArity = 2;
  _.cljs$lang$applyTo = ___12773.cljs$lang$applyTo;
  return _
}();
cljs.core._STAR_ = function() {
  var _STAR_ = null;
  var _STAR___12777 = function() {
    return 1
  };
  var _STAR___12778 = function(x) {
    return x
  };
  var _STAR___12779 = function(x, y) {
    return x * y
  };
  var _STAR___12780 = function() {
    var G__12782__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _STAR_, x * y, more)
    };
    var G__12782 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__12782__delegate.call(this, x, y, more)
    };
    G__12782.cljs$lang$maxFixedArity = 2;
    G__12782.cljs$lang$applyTo = function(arglist__12783) {
      var x = cljs.core.first(arglist__12783);
      var y = cljs.core.first(cljs.core.next(arglist__12783));
      var more = cljs.core.rest(cljs.core.next(arglist__12783));
      return G__12782__delegate.call(this, x, y, more)
    };
    return G__12782
  }();
  _STAR_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 0:
        return _STAR___12777.call(this);
      case 1:
        return _STAR___12778.call(this, x);
      case 2:
        return _STAR___12779.call(this, x, y);
      default:
        return _STAR___12780.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _STAR_.cljs$lang$maxFixedArity = 2;
  _STAR_.cljs$lang$applyTo = _STAR___12780.cljs$lang$applyTo;
  return _STAR_
}();
cljs.core._SLASH_ = function() {
  var _SLASH_ = null;
  var _SLASH___12784 = function(x) {
    return _SLASH_.call(null, 1, x)
  };
  var _SLASH___12785 = function(x, y) {
    return x / y
  };
  var _SLASH___12786 = function() {
    var G__12788__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _SLASH_, _SLASH_.call(null, x, y), more)
    };
    var G__12788 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__12788__delegate.call(this, x, y, more)
    };
    G__12788.cljs$lang$maxFixedArity = 2;
    G__12788.cljs$lang$applyTo = function(arglist__12789) {
      var x = cljs.core.first(arglist__12789);
      var y = cljs.core.first(cljs.core.next(arglist__12789));
      var more = cljs.core.rest(cljs.core.next(arglist__12789));
      return G__12788__delegate.call(this, x, y, more)
    };
    return G__12788
  }();
  _SLASH_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _SLASH___12784.call(this, x);
      case 2:
        return _SLASH___12785.call(this, x, y);
      default:
        return _SLASH___12786.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _SLASH_.cljs$lang$maxFixedArity = 2;
  _SLASH_.cljs$lang$applyTo = _SLASH___12786.cljs$lang$applyTo;
  return _SLASH_
}();
cljs.core._LT_ = function() {
  var _LT_ = null;
  var _LT___12790 = function(x) {
    return true
  };
  var _LT___12791 = function(x, y) {
    return x < y
  };
  var _LT___12792 = function() {
    var G__12794__delegate = function(x, y, more) {
      while(true) {
        if(cljs.core.truth_(x < y)) {
          if(cljs.core.truth_(cljs.core.next.call(null, more))) {
            var G__12795 = y;
            var G__12796 = cljs.core.first.call(null, more);
            var G__12797 = cljs.core.next.call(null, more);
            x = G__12795;
            y = G__12796;
            more = G__12797;
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
    var G__12794 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__12794__delegate.call(this, x, y, more)
    };
    G__12794.cljs$lang$maxFixedArity = 2;
    G__12794.cljs$lang$applyTo = function(arglist__12798) {
      var x = cljs.core.first(arglist__12798);
      var y = cljs.core.first(cljs.core.next(arglist__12798));
      var more = cljs.core.rest(cljs.core.next(arglist__12798));
      return G__12794__delegate.call(this, x, y, more)
    };
    return G__12794
  }();
  _LT_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _LT___12790.call(this, x);
      case 2:
        return _LT___12791.call(this, x, y);
      default:
        return _LT___12792.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _LT_.cljs$lang$maxFixedArity = 2;
  _LT_.cljs$lang$applyTo = _LT___12792.cljs$lang$applyTo;
  return _LT_
}();
cljs.core._LT__EQ_ = function() {
  var _LT__EQ_ = null;
  var _LT__EQ___12799 = function(x) {
    return true
  };
  var _LT__EQ___12800 = function(x, y) {
    return x <= y
  };
  var _LT__EQ___12801 = function() {
    var G__12803__delegate = function(x, y, more) {
      while(true) {
        if(cljs.core.truth_(x <= y)) {
          if(cljs.core.truth_(cljs.core.next.call(null, more))) {
            var G__12804 = y;
            var G__12805 = cljs.core.first.call(null, more);
            var G__12806 = cljs.core.next.call(null, more);
            x = G__12804;
            y = G__12805;
            more = G__12806;
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
    var G__12803 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__12803__delegate.call(this, x, y, more)
    };
    G__12803.cljs$lang$maxFixedArity = 2;
    G__12803.cljs$lang$applyTo = function(arglist__12807) {
      var x = cljs.core.first(arglist__12807);
      var y = cljs.core.first(cljs.core.next(arglist__12807));
      var more = cljs.core.rest(cljs.core.next(arglist__12807));
      return G__12803__delegate.call(this, x, y, more)
    };
    return G__12803
  }();
  _LT__EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _LT__EQ___12799.call(this, x);
      case 2:
        return _LT__EQ___12800.call(this, x, y);
      default:
        return _LT__EQ___12801.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _LT__EQ_.cljs$lang$maxFixedArity = 2;
  _LT__EQ_.cljs$lang$applyTo = _LT__EQ___12801.cljs$lang$applyTo;
  return _LT__EQ_
}();
cljs.core._GT_ = function() {
  var _GT_ = null;
  var _GT___12808 = function(x) {
    return true
  };
  var _GT___12809 = function(x, y) {
    return x > y
  };
  var _GT___12810 = function() {
    var G__12812__delegate = function(x, y, more) {
      while(true) {
        if(cljs.core.truth_(x > y)) {
          if(cljs.core.truth_(cljs.core.next.call(null, more))) {
            var G__12813 = y;
            var G__12814 = cljs.core.first.call(null, more);
            var G__12815 = cljs.core.next.call(null, more);
            x = G__12813;
            y = G__12814;
            more = G__12815;
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
    var G__12812 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__12812__delegate.call(this, x, y, more)
    };
    G__12812.cljs$lang$maxFixedArity = 2;
    G__12812.cljs$lang$applyTo = function(arglist__12816) {
      var x = cljs.core.first(arglist__12816);
      var y = cljs.core.first(cljs.core.next(arglist__12816));
      var more = cljs.core.rest(cljs.core.next(arglist__12816));
      return G__12812__delegate.call(this, x, y, more)
    };
    return G__12812
  }();
  _GT_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _GT___12808.call(this, x);
      case 2:
        return _GT___12809.call(this, x, y);
      default:
        return _GT___12810.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _GT_.cljs$lang$maxFixedArity = 2;
  _GT_.cljs$lang$applyTo = _GT___12810.cljs$lang$applyTo;
  return _GT_
}();
cljs.core._GT__EQ_ = function() {
  var _GT__EQ_ = null;
  var _GT__EQ___12817 = function(x) {
    return true
  };
  var _GT__EQ___12818 = function(x, y) {
    return x >= y
  };
  var _GT__EQ___12819 = function() {
    var G__12821__delegate = function(x, y, more) {
      while(true) {
        if(cljs.core.truth_(x >= y)) {
          if(cljs.core.truth_(cljs.core.next.call(null, more))) {
            var G__12822 = y;
            var G__12823 = cljs.core.first.call(null, more);
            var G__12824 = cljs.core.next.call(null, more);
            x = G__12822;
            y = G__12823;
            more = G__12824;
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
    var G__12821 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__12821__delegate.call(this, x, y, more)
    };
    G__12821.cljs$lang$maxFixedArity = 2;
    G__12821.cljs$lang$applyTo = function(arglist__12825) {
      var x = cljs.core.first(arglist__12825);
      var y = cljs.core.first(cljs.core.next(arglist__12825));
      var more = cljs.core.rest(cljs.core.next(arglist__12825));
      return G__12821__delegate.call(this, x, y, more)
    };
    return G__12821
  }();
  _GT__EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _GT__EQ___12817.call(this, x);
      case 2:
        return _GT__EQ___12818.call(this, x, y);
      default:
        return _GT__EQ___12819.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _GT__EQ_.cljs$lang$maxFixedArity = 2;
  _GT__EQ_.cljs$lang$applyTo = _GT__EQ___12819.cljs$lang$applyTo;
  return _GT__EQ_
}();
cljs.core.dec = function dec(x) {
  return x - 1
};
cljs.core.max = function() {
  var max = null;
  var max__12826 = function(x) {
    return x
  };
  var max__12827 = function(x, y) {
    return x > y ? x : y
  };
  var max__12828 = function() {
    var G__12830__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, max, x > y ? x : y, more)
    };
    var G__12830 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__12830__delegate.call(this, x, y, more)
    };
    G__12830.cljs$lang$maxFixedArity = 2;
    G__12830.cljs$lang$applyTo = function(arglist__12831) {
      var x = cljs.core.first(arglist__12831);
      var y = cljs.core.first(cljs.core.next(arglist__12831));
      var more = cljs.core.rest(cljs.core.next(arglist__12831));
      return G__12830__delegate.call(this, x, y, more)
    };
    return G__12830
  }();
  max = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return max__12826.call(this, x);
      case 2:
        return max__12827.call(this, x, y);
      default:
        return max__12828.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  max.cljs$lang$maxFixedArity = 2;
  max.cljs$lang$applyTo = max__12828.cljs$lang$applyTo;
  return max
}();
cljs.core.min = function() {
  var min = null;
  var min__12832 = function(x) {
    return x
  };
  var min__12833 = function(x, y) {
    return x < y ? x : y
  };
  var min__12834 = function() {
    var G__12836__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, min, x < y ? x : y, more)
    };
    var G__12836 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__12836__delegate.call(this, x, y, more)
    };
    G__12836.cljs$lang$maxFixedArity = 2;
    G__12836.cljs$lang$applyTo = function(arglist__12837) {
      var x = cljs.core.first(arglist__12837);
      var y = cljs.core.first(cljs.core.next(arglist__12837));
      var more = cljs.core.rest(cljs.core.next(arglist__12837));
      return G__12836__delegate.call(this, x, y, more)
    };
    return G__12836
  }();
  min = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return min__12832.call(this, x);
      case 2:
        return min__12833.call(this, x, y);
      default:
        return min__12834.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  min.cljs$lang$maxFixedArity = 2;
  min.cljs$lang$applyTo = min__12834.cljs$lang$applyTo;
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
  var rem__12838 = n % d;
  return cljs.core.fix.call(null, (n - rem__12838) / d)
};
cljs.core.rem = function rem(n, d) {
  var q__12839 = cljs.core.quot.call(null, n, d);
  return n - d * q__12839
};
cljs.core.rand = function() {
  var rand = null;
  var rand__12840 = function() {
    return Math.random.call(null)
  };
  var rand__12841 = function(n) {
    return n * rand.call(null)
  };
  rand = function(n) {
    switch(arguments.length) {
      case 0:
        return rand__12840.call(this);
      case 1:
        return rand__12841.call(this, n)
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
  var _EQ__EQ___12843 = function(x) {
    return true
  };
  var _EQ__EQ___12844 = function(x, y) {
    return cljs.core._equiv.call(null, x, y)
  };
  var _EQ__EQ___12845 = function() {
    var G__12847__delegate = function(x, y, more) {
      while(true) {
        if(cljs.core.truth_(_EQ__EQ_.call(null, x, y))) {
          if(cljs.core.truth_(cljs.core.next.call(null, more))) {
            var G__12848 = y;
            var G__12849 = cljs.core.first.call(null, more);
            var G__12850 = cljs.core.next.call(null, more);
            x = G__12848;
            y = G__12849;
            more = G__12850;
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
    var G__12847 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__12847__delegate.call(this, x, y, more)
    };
    G__12847.cljs$lang$maxFixedArity = 2;
    G__12847.cljs$lang$applyTo = function(arglist__12851) {
      var x = cljs.core.first(arglist__12851);
      var y = cljs.core.first(cljs.core.next(arglist__12851));
      var more = cljs.core.rest(cljs.core.next(arglist__12851));
      return G__12847__delegate.call(this, x, y, more)
    };
    return G__12847
  }();
  _EQ__EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _EQ__EQ___12843.call(this, x);
      case 2:
        return _EQ__EQ___12844.call(this, x, y);
      default:
        return _EQ__EQ___12845.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _EQ__EQ_.cljs$lang$maxFixedArity = 2;
  _EQ__EQ_.cljs$lang$applyTo = _EQ__EQ___12845.cljs$lang$applyTo;
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
  var n__12852 = n;
  var xs__12853 = cljs.core.seq.call(null, coll);
  while(true) {
    if(cljs.core.truth_(function() {
      var and__3822__auto____12854 = xs__12853;
      if(cljs.core.truth_(and__3822__auto____12854)) {
        return n__12852 > 0
      }else {
        return and__3822__auto____12854
      }
    }())) {
      var G__12855 = n__12852 - 1;
      var G__12856 = cljs.core.next.call(null, xs__12853);
      n__12852 = G__12855;
      xs__12853 = G__12856;
      continue
    }else {
      return xs__12853
    }
    break
  }
};
cljs.core.IIndexed["_"] = true;
cljs.core._nth["_"] = function() {
  var G__12861 = null;
  var G__12861__12862 = function(coll, n) {
    var temp__3971__auto____12857 = cljs.core.nthnext.call(null, coll, n);
    if(cljs.core.truth_(temp__3971__auto____12857)) {
      var xs__12858 = temp__3971__auto____12857;
      return cljs.core.first.call(null, xs__12858)
    }else {
      throw new Error("Index out of bounds");
    }
  };
  var G__12861__12863 = function(coll, n, not_found) {
    var temp__3971__auto____12859 = cljs.core.nthnext.call(null, coll, n);
    if(cljs.core.truth_(temp__3971__auto____12859)) {
      var xs__12860 = temp__3971__auto____12859;
      return cljs.core.first.call(null, xs__12860)
    }else {
      return not_found
    }
  };
  G__12861 = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__12861__12862.call(this, coll, n);
      case 3:
        return G__12861__12863.call(this, coll, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__12861
}();
cljs.core.str_STAR_ = function() {
  var str_STAR_ = null;
  var str_STAR___12865 = function() {
    return""
  };
  var str_STAR___12866 = function(x) {
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
  var str_STAR___12867 = function() {
    var G__12869__delegate = function(x, ys) {
      return function(sb, more) {
        while(true) {
          if(cljs.core.truth_(more)) {
            var G__12870 = sb.append(str_STAR_.call(null, cljs.core.first.call(null, more)));
            var G__12871 = cljs.core.next.call(null, more);
            sb = G__12870;
            more = G__12871;
            continue
          }else {
            return str_STAR_.call(null, sb)
          }
          break
        }
      }.call(null, new goog.string.StringBuffer(str_STAR_.call(null, x)), ys)
    };
    var G__12869 = function(x, var_args) {
      var ys = null;
      if(goog.isDef(var_args)) {
        ys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__12869__delegate.call(this, x, ys)
    };
    G__12869.cljs$lang$maxFixedArity = 1;
    G__12869.cljs$lang$applyTo = function(arglist__12872) {
      var x = cljs.core.first(arglist__12872);
      var ys = cljs.core.rest(arglist__12872);
      return G__12869__delegate.call(this, x, ys)
    };
    return G__12869
  }();
  str_STAR_ = function(x, var_args) {
    var ys = var_args;
    switch(arguments.length) {
      case 0:
        return str_STAR___12865.call(this);
      case 1:
        return str_STAR___12866.call(this, x);
      default:
        return str_STAR___12867.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  str_STAR_.cljs$lang$maxFixedArity = 1;
  str_STAR_.cljs$lang$applyTo = str_STAR___12867.cljs$lang$applyTo;
  return str_STAR_
}();
cljs.core.str = function() {
  var str = null;
  var str__12873 = function() {
    return""
  };
  var str__12874 = function(x) {
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
  var str__12875 = function() {
    var G__12877__delegate = function(x, ys) {
      return function(sb, more) {
        while(true) {
          if(cljs.core.truth_(more)) {
            var G__12878 = sb.append(str.call(null, cljs.core.first.call(null, more)));
            var G__12879 = cljs.core.next.call(null, more);
            sb = G__12878;
            more = G__12879;
            continue
          }else {
            return cljs.core.str_STAR_.call(null, sb)
          }
          break
        }
      }.call(null, new goog.string.StringBuffer(str.call(null, x)), ys)
    };
    var G__12877 = function(x, var_args) {
      var ys = null;
      if(goog.isDef(var_args)) {
        ys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__12877__delegate.call(this, x, ys)
    };
    G__12877.cljs$lang$maxFixedArity = 1;
    G__12877.cljs$lang$applyTo = function(arglist__12880) {
      var x = cljs.core.first(arglist__12880);
      var ys = cljs.core.rest(arglist__12880);
      return G__12877__delegate.call(this, x, ys)
    };
    return G__12877
  }();
  str = function(x, var_args) {
    var ys = var_args;
    switch(arguments.length) {
      case 0:
        return str__12873.call(this);
      case 1:
        return str__12874.call(this, x);
      default:
        return str__12875.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  str.cljs$lang$maxFixedArity = 1;
  str.cljs$lang$applyTo = str__12875.cljs$lang$applyTo;
  return str
}();
cljs.core.subs = function() {
  var subs = null;
  var subs__12881 = function(s, start) {
    return s.substring(start)
  };
  var subs__12882 = function(s, start, end) {
    return s.substring(start, end)
  };
  subs = function(s, start, end) {
    switch(arguments.length) {
      case 2:
        return subs__12881.call(this, s, start);
      case 3:
        return subs__12882.call(this, s, start, end)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return subs
}();
cljs.core.symbol = function() {
  var symbol = null;
  var symbol__12884 = function(name) {
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
  var symbol__12885 = function(ns, name) {
    return symbol.call(null, cljs.core.str_STAR_.call(null, ns, "/", name))
  };
  symbol = function(ns, name) {
    switch(arguments.length) {
      case 1:
        return symbol__12884.call(this, ns);
      case 2:
        return symbol__12885.call(this, ns, name)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return symbol
}();
cljs.core.keyword = function() {
  var keyword = null;
  var keyword__12887 = function(name) {
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
  var keyword__12888 = function(ns, name) {
    return keyword.call(null, cljs.core.str_STAR_.call(null, ns, "/", name))
  };
  keyword = function(ns, name) {
    switch(arguments.length) {
      case 1:
        return keyword__12887.call(this, ns);
      case 2:
        return keyword__12888.call(this, ns, name)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return keyword
}();
cljs.core.equiv_sequential = function equiv_sequential(x, y) {
  return cljs.core.boolean$.call(null, cljs.core.truth_(cljs.core.sequential_QMARK_.call(null, y)) ? function() {
    var xs__12890 = cljs.core.seq.call(null, x);
    var ys__12891 = cljs.core.seq.call(null, y);
    while(true) {
      if(cljs.core.truth_(xs__12890 === null)) {
        return ys__12891 === null
      }else {
        if(cljs.core.truth_(ys__12891 === null)) {
          return false
        }else {
          if(cljs.core.truth_(cljs.core._EQ_.call(null, cljs.core.first.call(null, xs__12890), cljs.core.first.call(null, ys__12891)))) {
            var G__12892 = cljs.core.next.call(null, xs__12890);
            var G__12893 = cljs.core.next.call(null, ys__12891);
            xs__12890 = G__12892;
            ys__12891 = G__12893;
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
  return cljs.core.reduce.call(null, function(p1__12894_SHARP_, p2__12895_SHARP_) {
    return cljs.core.hash_combine.call(null, p1__12894_SHARP_, cljs.core.hash.call(null, p2__12895_SHARP_))
  }, cljs.core.hash.call(null, cljs.core.first.call(null, coll)), cljs.core.next.call(null, coll))
};
cljs.core.extend_object_BANG_ = function extend_object_BANG_(obj, fn_map) {
  var G__12896__12897 = cljs.core.seq.call(null, fn_map);
  if(cljs.core.truth_(G__12896__12897)) {
    var G__12899__12901 = cljs.core.first.call(null, G__12896__12897);
    var vec__12900__12902 = G__12899__12901;
    var key_name__12903 = cljs.core.nth.call(null, vec__12900__12902, 0, null);
    var f__12904 = cljs.core.nth.call(null, vec__12900__12902, 1, null);
    var G__12896__12905 = G__12896__12897;
    var G__12899__12906 = G__12899__12901;
    var G__12896__12907 = G__12896__12905;
    while(true) {
      var vec__12908__12909 = G__12899__12906;
      var key_name__12910 = cljs.core.nth.call(null, vec__12908__12909, 0, null);
      var f__12911 = cljs.core.nth.call(null, vec__12908__12909, 1, null);
      var G__12896__12912 = G__12896__12907;
      var str_name__12913 = cljs.core.name.call(null, key_name__12910);
      obj[str_name__12913] = f__12911;
      var temp__3974__auto____12914 = cljs.core.next.call(null, G__12896__12912);
      if(cljs.core.truth_(temp__3974__auto____12914)) {
        var G__12896__12915 = temp__3974__auto____12914;
        var G__12916 = cljs.core.first.call(null, G__12896__12915);
        var G__12917 = G__12896__12915;
        G__12899__12906 = G__12916;
        G__12896__12907 = G__12917;
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
  var this__12918 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.List.prototype.cljs$core$ISequential$ = true;
cljs.core.List.prototype.cljs$core$ICollection$ = true;
cljs.core.List.prototype.cljs$core$ICollection$_conj = function(coll, o) {
  var this__12919 = this;
  return new cljs.core.List(this__12919.meta, o, coll, this__12919.count + 1)
};
cljs.core.List.prototype.cljs$core$ISeqable$ = true;
cljs.core.List.prototype.cljs$core$ISeqable$_seq = function(coll) {
  var this__12920 = this;
  return coll
};
cljs.core.List.prototype.cljs$core$ICounted$ = true;
cljs.core.List.prototype.cljs$core$ICounted$_count = function(coll) {
  var this__12921 = this;
  return this__12921.count
};
cljs.core.List.prototype.cljs$core$IStack$ = true;
cljs.core.List.prototype.cljs$core$IStack$_peek = function(coll) {
  var this__12922 = this;
  return this__12922.first
};
cljs.core.List.prototype.cljs$core$IStack$_pop = function(coll) {
  var this__12923 = this;
  return cljs.core._rest.call(null, coll)
};
cljs.core.List.prototype.cljs$core$ISeq$ = true;
cljs.core.List.prototype.cljs$core$ISeq$_first = function(coll) {
  var this__12924 = this;
  return this__12924.first
};
cljs.core.List.prototype.cljs$core$ISeq$_rest = function(coll) {
  var this__12925 = this;
  return this__12925.rest
};
cljs.core.List.prototype.cljs$core$IEquiv$ = true;
cljs.core.List.prototype.cljs$core$IEquiv$_equiv = function(coll, other) {
  var this__12926 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.List.prototype.cljs$core$IWithMeta$ = true;
cljs.core.List.prototype.cljs$core$IWithMeta$_with_meta = function(coll, meta) {
  var this__12927 = this;
  return new cljs.core.List(meta, this__12927.first, this__12927.rest, this__12927.count)
};
cljs.core.List.prototype.cljs$core$IMeta$ = true;
cljs.core.List.prototype.cljs$core$IMeta$_meta = function(coll) {
  var this__12928 = this;
  return this__12928.meta
};
cljs.core.List.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.List.prototype.cljs$core$IEmptyableCollection$_empty = function(coll) {
  var this__12929 = this;
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
  var this__12930 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.EmptyList.prototype.cljs$core$ISequential$ = true;
cljs.core.EmptyList.prototype.cljs$core$ICollection$ = true;
cljs.core.EmptyList.prototype.cljs$core$ICollection$_conj = function(coll, o) {
  var this__12931 = this;
  return new cljs.core.List(this__12931.meta, o, null, 1)
};
cljs.core.EmptyList.prototype.cljs$core$ISeqable$ = true;
cljs.core.EmptyList.prototype.cljs$core$ISeqable$_seq = function(coll) {
  var this__12932 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ICounted$ = true;
cljs.core.EmptyList.prototype.cljs$core$ICounted$_count = function(coll) {
  var this__12933 = this;
  return 0
};
cljs.core.EmptyList.prototype.cljs$core$IStack$ = true;
cljs.core.EmptyList.prototype.cljs$core$IStack$_peek = function(coll) {
  var this__12934 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$IStack$_pop = function(coll) {
  var this__12935 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ISeq$ = true;
cljs.core.EmptyList.prototype.cljs$core$ISeq$_first = function(coll) {
  var this__12936 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ISeq$_rest = function(coll) {
  var this__12937 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$IEquiv$ = true;
cljs.core.EmptyList.prototype.cljs$core$IEquiv$_equiv = function(coll, other) {
  var this__12938 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.EmptyList.prototype.cljs$core$IWithMeta$ = true;
cljs.core.EmptyList.prototype.cljs$core$IWithMeta$_with_meta = function(coll, meta) {
  var this__12939 = this;
  return new cljs.core.EmptyList(meta)
};
cljs.core.EmptyList.prototype.cljs$core$IMeta$ = true;
cljs.core.EmptyList.prototype.cljs$core$IMeta$_meta = function(coll) {
  var this__12940 = this;
  return this__12940.meta
};
cljs.core.EmptyList.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.EmptyList.prototype.cljs$core$IEmptyableCollection$_empty = function(coll) {
  var this__12941 = this;
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
  list.cljs$lang$applyTo = function(arglist__12942) {
    var items = cljs.core.seq(arglist__12942);
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
  var this__12943 = this;
  return coll
};
cljs.core.Cons.prototype.cljs$core$IHash$ = true;
cljs.core.Cons.prototype.cljs$core$IHash$_hash = function(coll) {
  var this__12944 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.Cons.prototype.cljs$core$IEquiv$ = true;
cljs.core.Cons.prototype.cljs$core$IEquiv$_equiv = function(coll, other) {
  var this__12945 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Cons.prototype.cljs$core$ISequential$ = true;
cljs.core.Cons.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.Cons.prototype.cljs$core$IEmptyableCollection$_empty = function(coll) {
  var this__12946 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__12946.meta)
};
cljs.core.Cons.prototype.cljs$core$ICollection$ = true;
cljs.core.Cons.prototype.cljs$core$ICollection$_conj = function(coll, o) {
  var this__12947 = this;
  return new cljs.core.Cons(null, o, coll)
};
cljs.core.Cons.prototype.cljs$core$ISeq$ = true;
cljs.core.Cons.prototype.cljs$core$ISeq$_first = function(coll) {
  var this__12948 = this;
  return this__12948.first
};
cljs.core.Cons.prototype.cljs$core$ISeq$_rest = function(coll) {
  var this__12949 = this;
  if(cljs.core.truth_(this__12949.rest === null)) {
    return cljs.core.List.EMPTY
  }else {
    return this__12949.rest
  }
};
cljs.core.Cons.prototype.cljs$core$IMeta$ = true;
cljs.core.Cons.prototype.cljs$core$IMeta$_meta = function(coll) {
  var this__12950 = this;
  return this__12950.meta
};
cljs.core.Cons.prototype.cljs$core$IWithMeta$ = true;
cljs.core.Cons.prototype.cljs$core$IWithMeta$_with_meta = function(coll, meta) {
  var this__12951 = this;
  return new cljs.core.Cons(meta, this__12951.first, this__12951.rest)
};
cljs.core.Cons;
cljs.core.cons = function cons(x, seq) {
  return new cljs.core.Cons(null, x, seq)
};
cljs.core.IReduce["string"] = true;
cljs.core._reduce["string"] = function() {
  var G__12952 = null;
  var G__12952__12953 = function(string, f) {
    return cljs.core.ci_reduce.call(null, string, f)
  };
  var G__12952__12954 = function(string, f, start) {
    return cljs.core.ci_reduce.call(null, string, f, start)
  };
  G__12952 = function(string, f, start) {
    switch(arguments.length) {
      case 2:
        return G__12952__12953.call(this, string, f);
      case 3:
        return G__12952__12954.call(this, string, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__12952
}();
cljs.core.ILookup["string"] = true;
cljs.core._lookup["string"] = function() {
  var G__12956 = null;
  var G__12956__12957 = function(string, k) {
    return cljs.core._nth.call(null, string, k)
  };
  var G__12956__12958 = function(string, k, not_found) {
    return cljs.core._nth.call(null, string, k, not_found)
  };
  G__12956 = function(string, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__12956__12957.call(this, string, k);
      case 3:
        return G__12956__12958.call(this, string, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__12956
}();
cljs.core.IIndexed["string"] = true;
cljs.core._nth["string"] = function() {
  var G__12960 = null;
  var G__12960__12961 = function(string, n) {
    if(cljs.core.truth_(n < cljs.core._count.call(null, string))) {
      return string.charAt(n)
    }else {
      return null
    }
  };
  var G__12960__12962 = function(string, n, not_found) {
    if(cljs.core.truth_(n < cljs.core._count.call(null, string))) {
      return string.charAt(n)
    }else {
      return not_found
    }
  };
  G__12960 = function(string, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__12960__12961.call(this, string, n);
      case 3:
        return G__12960__12962.call(this, string, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__12960
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
  var G__12970 = null;
  var G__12970__12971 = function(tsym12964, coll) {
    var tsym12964__12966 = this;
    var this$__12967 = tsym12964__12966;
    return cljs.core.get.call(null, coll, this$__12967.toString())
  };
  var G__12970__12972 = function(tsym12965, coll, not_found) {
    var tsym12965__12968 = this;
    var this$__12969 = tsym12965__12968;
    return cljs.core.get.call(null, coll, this$__12969.toString(), not_found)
  };
  G__12970 = function(tsym12965, coll, not_found) {
    switch(arguments.length) {
      case 2:
        return G__12970__12971.call(this, tsym12965, coll);
      case 3:
        return G__12970__12972.call(this, tsym12965, coll, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__12970
}();
String["prototype"]["apply"] = function(s, args) {
  if(cljs.core.truth_(cljs.core.count.call(null, args) < 2)) {
    return cljs.core.get.call(null, args[0], s)
  }else {
    return cljs.core.get.call(null, args[0], s, args[1])
  }
};
cljs.core.lazy_seq_value = function lazy_seq_value(lazy_seq) {
  var x__12974 = lazy_seq.x;
  if(cljs.core.truth_(lazy_seq.realized)) {
    return x__12974
  }else {
    lazy_seq.x = x__12974.call(null);
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
  var this__12975 = this;
  return cljs.core.seq.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$IHash$ = true;
cljs.core.LazySeq.prototype.cljs$core$IHash$_hash = function(coll) {
  var this__12976 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.LazySeq.prototype.cljs$core$IEquiv$ = true;
cljs.core.LazySeq.prototype.cljs$core$IEquiv$_equiv = function(coll, other) {
  var this__12977 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.LazySeq.prototype.cljs$core$ISequential$ = true;
cljs.core.LazySeq.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.LazySeq.prototype.cljs$core$IEmptyableCollection$_empty = function(coll) {
  var this__12978 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__12978.meta)
};
cljs.core.LazySeq.prototype.cljs$core$ICollection$ = true;
cljs.core.LazySeq.prototype.cljs$core$ICollection$_conj = function(coll, o) {
  var this__12979 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.LazySeq.prototype.cljs$core$ISeq$ = true;
cljs.core.LazySeq.prototype.cljs$core$ISeq$_first = function(coll) {
  var this__12980 = this;
  return cljs.core.first.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$ISeq$_rest = function(coll) {
  var this__12981 = this;
  return cljs.core.rest.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$IMeta$ = true;
cljs.core.LazySeq.prototype.cljs$core$IMeta$_meta = function(coll) {
  var this__12982 = this;
  return this__12982.meta
};
cljs.core.LazySeq.prototype.cljs$core$IWithMeta$ = true;
cljs.core.LazySeq.prototype.cljs$core$IWithMeta$_with_meta = function(coll, meta) {
  var this__12983 = this;
  return new cljs.core.LazySeq(meta, this__12983.realized, this__12983.x)
};
cljs.core.LazySeq;
cljs.core.to_array = function to_array(s) {
  var ary__12984 = [];
  var s__12985 = s;
  while(true) {
    if(cljs.core.truth_(cljs.core.seq.call(null, s__12985))) {
      ary__12984.push(cljs.core.first.call(null, s__12985));
      var G__12986 = cljs.core.next.call(null, s__12985);
      s__12985 = G__12986;
      continue
    }else {
      return ary__12984
    }
    break
  }
};
cljs.core.bounded_count = function bounded_count(s, n) {
  var s__12987 = s;
  var i__12988 = n;
  var sum__12989 = 0;
  while(true) {
    if(cljs.core.truth_(function() {
      var and__3822__auto____12990 = i__12988 > 0;
      if(cljs.core.truth_(and__3822__auto____12990)) {
        return cljs.core.seq.call(null, s__12987)
      }else {
        return and__3822__auto____12990
      }
    }())) {
      var G__12991 = cljs.core.next.call(null, s__12987);
      var G__12992 = i__12988 - 1;
      var G__12993 = sum__12989 + 1;
      s__12987 = G__12991;
      i__12988 = G__12992;
      sum__12989 = G__12993;
      continue
    }else {
      return sum__12989
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
  var concat__12997 = function() {
    return new cljs.core.LazySeq(null, false, function() {
      return null
    })
  };
  var concat__12998 = function(x) {
    return new cljs.core.LazySeq(null, false, function() {
      return x
    })
  };
  var concat__12999 = function(x, y) {
    return new cljs.core.LazySeq(null, false, function() {
      var s__12994 = cljs.core.seq.call(null, x);
      if(cljs.core.truth_(s__12994)) {
        return cljs.core.cons.call(null, cljs.core.first.call(null, s__12994), concat.call(null, cljs.core.rest.call(null, s__12994), y))
      }else {
        return y
      }
    })
  };
  var concat__13000 = function() {
    var G__13002__delegate = function(x, y, zs) {
      var cat__12996 = function cat(xys, zs) {
        return new cljs.core.LazySeq(null, false, function() {
          var xys__12995 = cljs.core.seq.call(null, xys);
          if(cljs.core.truth_(xys__12995)) {
            return cljs.core.cons.call(null, cljs.core.first.call(null, xys__12995), cat.call(null, cljs.core.rest.call(null, xys__12995), zs))
          }else {
            if(cljs.core.truth_(zs)) {
              return cat.call(null, cljs.core.first.call(null, zs), cljs.core.next.call(null, zs))
            }else {
              return null
            }
          }
        })
      };
      return cat__12996.call(null, concat.call(null, x, y), zs)
    };
    var G__13002 = function(x, y, var_args) {
      var zs = null;
      if(goog.isDef(var_args)) {
        zs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__13002__delegate.call(this, x, y, zs)
    };
    G__13002.cljs$lang$maxFixedArity = 2;
    G__13002.cljs$lang$applyTo = function(arglist__13003) {
      var x = cljs.core.first(arglist__13003);
      var y = cljs.core.first(cljs.core.next(arglist__13003));
      var zs = cljs.core.rest(cljs.core.next(arglist__13003));
      return G__13002__delegate.call(this, x, y, zs)
    };
    return G__13002
  }();
  concat = function(x, y, var_args) {
    var zs = var_args;
    switch(arguments.length) {
      case 0:
        return concat__12997.call(this);
      case 1:
        return concat__12998.call(this, x);
      case 2:
        return concat__12999.call(this, x, y);
      default:
        return concat__13000.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  concat.cljs$lang$maxFixedArity = 2;
  concat.cljs$lang$applyTo = concat__13000.cljs$lang$applyTo;
  return concat
}();
cljs.core.list_STAR_ = function() {
  var list_STAR_ = null;
  var list_STAR___13004 = function(args) {
    return cljs.core.seq.call(null, args)
  };
  var list_STAR___13005 = function(a, args) {
    return cljs.core.cons.call(null, a, args)
  };
  var list_STAR___13006 = function(a, b, args) {
    return cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, args))
  };
  var list_STAR___13007 = function(a, b, c, args) {
    return cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, args)))
  };
  var list_STAR___13008 = function() {
    var G__13010__delegate = function(a, b, c, d, more) {
      return cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, cljs.core.cons.call(null, d, cljs.core.spread.call(null, more)))))
    };
    var G__13010 = function(a, b, c, d, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__13010__delegate.call(this, a, b, c, d, more)
    };
    G__13010.cljs$lang$maxFixedArity = 4;
    G__13010.cljs$lang$applyTo = function(arglist__13011) {
      var a = cljs.core.first(arglist__13011);
      var b = cljs.core.first(cljs.core.next(arglist__13011));
      var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__13011)));
      var d = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__13011))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__13011))));
      return G__13010__delegate.call(this, a, b, c, d, more)
    };
    return G__13010
  }();
  list_STAR_ = function(a, b, c, d, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return list_STAR___13004.call(this, a);
      case 2:
        return list_STAR___13005.call(this, a, b);
      case 3:
        return list_STAR___13006.call(this, a, b, c);
      case 4:
        return list_STAR___13007.call(this, a, b, c, d);
      default:
        return list_STAR___13008.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  list_STAR_.cljs$lang$maxFixedArity = 4;
  list_STAR_.cljs$lang$applyTo = list_STAR___13008.cljs$lang$applyTo;
  return list_STAR_
}();
cljs.core.apply = function() {
  var apply = null;
  var apply__13021 = function(f, args) {
    var fixed_arity__13012 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      if(cljs.core.truth_(cljs.core.bounded_count.call(null, args, fixed_arity__13012 + 1) <= fixed_arity__13012)) {
        return f.apply(f, cljs.core.to_array.call(null, args))
      }else {
        return f.cljs$lang$applyTo(args)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, args))
    }
  };
  var apply__13022 = function(f, x, args) {
    var arglist__13013 = cljs.core.list_STAR_.call(null, x, args);
    var fixed_arity__13014 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      if(cljs.core.truth_(cljs.core.bounded_count.call(null, arglist__13013, fixed_arity__13014) <= fixed_arity__13014)) {
        return f.apply(f, cljs.core.to_array.call(null, arglist__13013))
      }else {
        return f.cljs$lang$applyTo(arglist__13013)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__13013))
    }
  };
  var apply__13023 = function(f, x, y, args) {
    var arglist__13015 = cljs.core.list_STAR_.call(null, x, y, args);
    var fixed_arity__13016 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      if(cljs.core.truth_(cljs.core.bounded_count.call(null, arglist__13015, fixed_arity__13016) <= fixed_arity__13016)) {
        return f.apply(f, cljs.core.to_array.call(null, arglist__13015))
      }else {
        return f.cljs$lang$applyTo(arglist__13015)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__13015))
    }
  };
  var apply__13024 = function(f, x, y, z, args) {
    var arglist__13017 = cljs.core.list_STAR_.call(null, x, y, z, args);
    var fixed_arity__13018 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      if(cljs.core.truth_(cljs.core.bounded_count.call(null, arglist__13017, fixed_arity__13018) <= fixed_arity__13018)) {
        return f.apply(f, cljs.core.to_array.call(null, arglist__13017))
      }else {
        return f.cljs$lang$applyTo(arglist__13017)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__13017))
    }
  };
  var apply__13025 = function() {
    var G__13027__delegate = function(f, a, b, c, d, args) {
      var arglist__13019 = cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, cljs.core.cons.call(null, d, cljs.core.spread.call(null, args)))));
      var fixed_arity__13020 = f.cljs$lang$maxFixedArity;
      if(cljs.core.truth_(f.cljs$lang$applyTo)) {
        if(cljs.core.truth_(cljs.core.bounded_count.call(null, arglist__13019, fixed_arity__13020) <= fixed_arity__13020)) {
          return f.apply(f, cljs.core.to_array.call(null, arglist__13019))
        }else {
          return f.cljs$lang$applyTo(arglist__13019)
        }
      }else {
        return f.apply(f, cljs.core.to_array.call(null, arglist__13019))
      }
    };
    var G__13027 = function(f, a, b, c, d, var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 5), 0)
      }
      return G__13027__delegate.call(this, f, a, b, c, d, args)
    };
    G__13027.cljs$lang$maxFixedArity = 5;
    G__13027.cljs$lang$applyTo = function(arglist__13028) {
      var f = cljs.core.first(arglist__13028);
      var a = cljs.core.first(cljs.core.next(arglist__13028));
      var b = cljs.core.first(cljs.core.next(cljs.core.next(arglist__13028)));
      var c = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__13028))));
      var d = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__13028)))));
      var args = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__13028)))));
      return G__13027__delegate.call(this, f, a, b, c, d, args)
    };
    return G__13027
  }();
  apply = function(f, a, b, c, d, var_args) {
    var args = var_args;
    switch(arguments.length) {
      case 2:
        return apply__13021.call(this, f, a);
      case 3:
        return apply__13022.call(this, f, a, b);
      case 4:
        return apply__13023.call(this, f, a, b, c);
      case 5:
        return apply__13024.call(this, f, a, b, c, d);
      default:
        return apply__13025.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  apply.cljs$lang$maxFixedArity = 5;
  apply.cljs$lang$applyTo = apply__13025.cljs$lang$applyTo;
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
  vary_meta.cljs$lang$applyTo = function(arglist__13029) {
    var obj = cljs.core.first(arglist__13029);
    var f = cljs.core.first(cljs.core.next(arglist__13029));
    var args = cljs.core.rest(cljs.core.next(arglist__13029));
    return vary_meta__delegate.call(this, obj, f, args)
  };
  return vary_meta
}();
cljs.core.not_EQ_ = function() {
  var not_EQ_ = null;
  var not_EQ___13030 = function(x) {
    return false
  };
  var not_EQ___13031 = function(x, y) {
    return cljs.core.not.call(null, cljs.core._EQ_.call(null, x, y))
  };
  var not_EQ___13032 = function() {
    var G__13034__delegate = function(x, y, more) {
      return cljs.core.not.call(null, cljs.core.apply.call(null, cljs.core._EQ_, x, y, more))
    };
    var G__13034 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__13034__delegate.call(this, x, y, more)
    };
    G__13034.cljs$lang$maxFixedArity = 2;
    G__13034.cljs$lang$applyTo = function(arglist__13035) {
      var x = cljs.core.first(arglist__13035);
      var y = cljs.core.first(cljs.core.next(arglist__13035));
      var more = cljs.core.rest(cljs.core.next(arglist__13035));
      return G__13034__delegate.call(this, x, y, more)
    };
    return G__13034
  }();
  not_EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return not_EQ___13030.call(this, x);
      case 2:
        return not_EQ___13031.call(this, x, y);
      default:
        return not_EQ___13032.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  not_EQ_.cljs$lang$maxFixedArity = 2;
  not_EQ_.cljs$lang$applyTo = not_EQ___13032.cljs$lang$applyTo;
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
        var G__13036 = pred;
        var G__13037 = cljs.core.next.call(null, coll);
        pred = G__13036;
        coll = G__13037;
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
      var or__3824__auto____13038 = pred.call(null, cljs.core.first.call(null, coll));
      if(cljs.core.truth_(or__3824__auto____13038)) {
        return or__3824__auto____13038
      }else {
        var G__13039 = pred;
        var G__13040 = cljs.core.next.call(null, coll);
        pred = G__13039;
        coll = G__13040;
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
    var G__13041 = null;
    var G__13041__13042 = function() {
      return cljs.core.not.call(null, f.call(null))
    };
    var G__13041__13043 = function(x) {
      return cljs.core.not.call(null, f.call(null, x))
    };
    var G__13041__13044 = function(x, y) {
      return cljs.core.not.call(null, f.call(null, x, y))
    };
    var G__13041__13045 = function() {
      var G__13047__delegate = function(x, y, zs) {
        return cljs.core.not.call(null, cljs.core.apply.call(null, f, x, y, zs))
      };
      var G__13047 = function(x, y, var_args) {
        var zs = null;
        if(goog.isDef(var_args)) {
          zs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
        }
        return G__13047__delegate.call(this, x, y, zs)
      };
      G__13047.cljs$lang$maxFixedArity = 2;
      G__13047.cljs$lang$applyTo = function(arglist__13048) {
        var x = cljs.core.first(arglist__13048);
        var y = cljs.core.first(cljs.core.next(arglist__13048));
        var zs = cljs.core.rest(cljs.core.next(arglist__13048));
        return G__13047__delegate.call(this, x, y, zs)
      };
      return G__13047
    }();
    G__13041 = function(x, y, var_args) {
      var zs = var_args;
      switch(arguments.length) {
        case 0:
          return G__13041__13042.call(this);
        case 1:
          return G__13041__13043.call(this, x);
        case 2:
          return G__13041__13044.call(this, x, y);
        default:
          return G__13041__13045.apply(this, arguments)
      }
      throw"Invalid arity: " + arguments.length;
    };
    G__13041.cljs$lang$maxFixedArity = 2;
    G__13041.cljs$lang$applyTo = G__13041__13045.cljs$lang$applyTo;
    return G__13041
  }()
};
cljs.core.constantly = function constantly(x) {
  return function() {
    var G__13049__delegate = function(args) {
      return x
    };
    var G__13049 = function(var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__13049__delegate.call(this, args)
    };
    G__13049.cljs$lang$maxFixedArity = 0;
    G__13049.cljs$lang$applyTo = function(arglist__13050) {
      var args = cljs.core.seq(arglist__13050);
      return G__13049__delegate.call(this, args)
    };
    return G__13049
  }()
};
cljs.core.comp = function() {
  var comp = null;
  var comp__13054 = function() {
    return cljs.core.identity
  };
  var comp__13055 = function(f) {
    return f
  };
  var comp__13056 = function(f, g) {
    return function() {
      var G__13060 = null;
      var G__13060__13061 = function() {
        return f.call(null, g.call(null))
      };
      var G__13060__13062 = function(x) {
        return f.call(null, g.call(null, x))
      };
      var G__13060__13063 = function(x, y) {
        return f.call(null, g.call(null, x, y))
      };
      var G__13060__13064 = function(x, y, z) {
        return f.call(null, g.call(null, x, y, z))
      };
      var G__13060__13065 = function() {
        var G__13067__delegate = function(x, y, z, args) {
          return f.call(null, cljs.core.apply.call(null, g, x, y, z, args))
        };
        var G__13067 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__13067__delegate.call(this, x, y, z, args)
        };
        G__13067.cljs$lang$maxFixedArity = 3;
        G__13067.cljs$lang$applyTo = function(arglist__13068) {
          var x = cljs.core.first(arglist__13068);
          var y = cljs.core.first(cljs.core.next(arglist__13068));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__13068)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__13068)));
          return G__13067__delegate.call(this, x, y, z, args)
        };
        return G__13067
      }();
      G__13060 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__13060__13061.call(this);
          case 1:
            return G__13060__13062.call(this, x);
          case 2:
            return G__13060__13063.call(this, x, y);
          case 3:
            return G__13060__13064.call(this, x, y, z);
          default:
            return G__13060__13065.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__13060.cljs$lang$maxFixedArity = 3;
      G__13060.cljs$lang$applyTo = G__13060__13065.cljs$lang$applyTo;
      return G__13060
    }()
  };
  var comp__13057 = function(f, g, h) {
    return function() {
      var G__13069 = null;
      var G__13069__13070 = function() {
        return f.call(null, g.call(null, h.call(null)))
      };
      var G__13069__13071 = function(x) {
        return f.call(null, g.call(null, h.call(null, x)))
      };
      var G__13069__13072 = function(x, y) {
        return f.call(null, g.call(null, h.call(null, x, y)))
      };
      var G__13069__13073 = function(x, y, z) {
        return f.call(null, g.call(null, h.call(null, x, y, z)))
      };
      var G__13069__13074 = function() {
        var G__13076__delegate = function(x, y, z, args) {
          return f.call(null, g.call(null, cljs.core.apply.call(null, h, x, y, z, args)))
        };
        var G__13076 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__13076__delegate.call(this, x, y, z, args)
        };
        G__13076.cljs$lang$maxFixedArity = 3;
        G__13076.cljs$lang$applyTo = function(arglist__13077) {
          var x = cljs.core.first(arglist__13077);
          var y = cljs.core.first(cljs.core.next(arglist__13077));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__13077)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__13077)));
          return G__13076__delegate.call(this, x, y, z, args)
        };
        return G__13076
      }();
      G__13069 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__13069__13070.call(this);
          case 1:
            return G__13069__13071.call(this, x);
          case 2:
            return G__13069__13072.call(this, x, y);
          case 3:
            return G__13069__13073.call(this, x, y, z);
          default:
            return G__13069__13074.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__13069.cljs$lang$maxFixedArity = 3;
      G__13069.cljs$lang$applyTo = G__13069__13074.cljs$lang$applyTo;
      return G__13069
    }()
  };
  var comp__13058 = function() {
    var G__13078__delegate = function(f1, f2, f3, fs) {
      var fs__13051 = cljs.core.reverse.call(null, cljs.core.list_STAR_.call(null, f1, f2, f3, fs));
      return function() {
        var G__13079__delegate = function(args) {
          var ret__13052 = cljs.core.apply.call(null, cljs.core.first.call(null, fs__13051), args);
          var fs__13053 = cljs.core.next.call(null, fs__13051);
          while(true) {
            if(cljs.core.truth_(fs__13053)) {
              var G__13080 = cljs.core.first.call(null, fs__13053).call(null, ret__13052);
              var G__13081 = cljs.core.next.call(null, fs__13053);
              ret__13052 = G__13080;
              fs__13053 = G__13081;
              continue
            }else {
              return ret__13052
            }
            break
          }
        };
        var G__13079 = function(var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
          }
          return G__13079__delegate.call(this, args)
        };
        G__13079.cljs$lang$maxFixedArity = 0;
        G__13079.cljs$lang$applyTo = function(arglist__13082) {
          var args = cljs.core.seq(arglist__13082);
          return G__13079__delegate.call(this, args)
        };
        return G__13079
      }()
    };
    var G__13078 = function(f1, f2, f3, var_args) {
      var fs = null;
      if(goog.isDef(var_args)) {
        fs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__13078__delegate.call(this, f1, f2, f3, fs)
    };
    G__13078.cljs$lang$maxFixedArity = 3;
    G__13078.cljs$lang$applyTo = function(arglist__13083) {
      var f1 = cljs.core.first(arglist__13083);
      var f2 = cljs.core.first(cljs.core.next(arglist__13083));
      var f3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__13083)));
      var fs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__13083)));
      return G__13078__delegate.call(this, f1, f2, f3, fs)
    };
    return G__13078
  }();
  comp = function(f1, f2, f3, var_args) {
    var fs = var_args;
    switch(arguments.length) {
      case 0:
        return comp__13054.call(this);
      case 1:
        return comp__13055.call(this, f1);
      case 2:
        return comp__13056.call(this, f1, f2);
      case 3:
        return comp__13057.call(this, f1, f2, f3);
      default:
        return comp__13058.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  comp.cljs$lang$maxFixedArity = 3;
  comp.cljs$lang$applyTo = comp__13058.cljs$lang$applyTo;
  return comp
}();
cljs.core.partial = function() {
  var partial = null;
  var partial__13084 = function(f, arg1) {
    return function() {
      var G__13089__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, args)
      };
      var G__13089 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__13089__delegate.call(this, args)
      };
      G__13089.cljs$lang$maxFixedArity = 0;
      G__13089.cljs$lang$applyTo = function(arglist__13090) {
        var args = cljs.core.seq(arglist__13090);
        return G__13089__delegate.call(this, args)
      };
      return G__13089
    }()
  };
  var partial__13085 = function(f, arg1, arg2) {
    return function() {
      var G__13091__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, arg2, args)
      };
      var G__13091 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__13091__delegate.call(this, args)
      };
      G__13091.cljs$lang$maxFixedArity = 0;
      G__13091.cljs$lang$applyTo = function(arglist__13092) {
        var args = cljs.core.seq(arglist__13092);
        return G__13091__delegate.call(this, args)
      };
      return G__13091
    }()
  };
  var partial__13086 = function(f, arg1, arg2, arg3) {
    return function() {
      var G__13093__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, arg2, arg3, args)
      };
      var G__13093 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__13093__delegate.call(this, args)
      };
      G__13093.cljs$lang$maxFixedArity = 0;
      G__13093.cljs$lang$applyTo = function(arglist__13094) {
        var args = cljs.core.seq(arglist__13094);
        return G__13093__delegate.call(this, args)
      };
      return G__13093
    }()
  };
  var partial__13087 = function() {
    var G__13095__delegate = function(f, arg1, arg2, arg3, more) {
      return function() {
        var G__13096__delegate = function(args) {
          return cljs.core.apply.call(null, f, arg1, arg2, arg3, cljs.core.concat.call(null, more, args))
        };
        var G__13096 = function(var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
          }
          return G__13096__delegate.call(this, args)
        };
        G__13096.cljs$lang$maxFixedArity = 0;
        G__13096.cljs$lang$applyTo = function(arglist__13097) {
          var args = cljs.core.seq(arglist__13097);
          return G__13096__delegate.call(this, args)
        };
        return G__13096
      }()
    };
    var G__13095 = function(f, arg1, arg2, arg3, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__13095__delegate.call(this, f, arg1, arg2, arg3, more)
    };
    G__13095.cljs$lang$maxFixedArity = 4;
    G__13095.cljs$lang$applyTo = function(arglist__13098) {
      var f = cljs.core.first(arglist__13098);
      var arg1 = cljs.core.first(cljs.core.next(arglist__13098));
      var arg2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__13098)));
      var arg3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__13098))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__13098))));
      return G__13095__delegate.call(this, f, arg1, arg2, arg3, more)
    };
    return G__13095
  }();
  partial = function(f, arg1, arg2, arg3, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return partial__13084.call(this, f, arg1);
      case 3:
        return partial__13085.call(this, f, arg1, arg2);
      case 4:
        return partial__13086.call(this, f, arg1, arg2, arg3);
      default:
        return partial__13087.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  partial.cljs$lang$maxFixedArity = 4;
  partial.cljs$lang$applyTo = partial__13087.cljs$lang$applyTo;
  return partial
}();
cljs.core.fnil = function() {
  var fnil = null;
  var fnil__13099 = function(f, x) {
    return function() {
      var G__13103 = null;
      var G__13103__13104 = function(a) {
        return f.call(null, cljs.core.truth_(a === null) ? x : a)
      };
      var G__13103__13105 = function(a, b) {
        return f.call(null, cljs.core.truth_(a === null) ? x : a, b)
      };
      var G__13103__13106 = function(a, b, c) {
        return f.call(null, cljs.core.truth_(a === null) ? x : a, b, c)
      };
      var G__13103__13107 = function() {
        var G__13109__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, cljs.core.truth_(a === null) ? x : a, b, c, ds)
        };
        var G__13109 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__13109__delegate.call(this, a, b, c, ds)
        };
        G__13109.cljs$lang$maxFixedArity = 3;
        G__13109.cljs$lang$applyTo = function(arglist__13110) {
          var a = cljs.core.first(arglist__13110);
          var b = cljs.core.first(cljs.core.next(arglist__13110));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__13110)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__13110)));
          return G__13109__delegate.call(this, a, b, c, ds)
        };
        return G__13109
      }();
      G__13103 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 1:
            return G__13103__13104.call(this, a);
          case 2:
            return G__13103__13105.call(this, a, b);
          case 3:
            return G__13103__13106.call(this, a, b, c);
          default:
            return G__13103__13107.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__13103.cljs$lang$maxFixedArity = 3;
      G__13103.cljs$lang$applyTo = G__13103__13107.cljs$lang$applyTo;
      return G__13103
    }()
  };
  var fnil__13100 = function(f, x, y) {
    return function() {
      var G__13111 = null;
      var G__13111__13112 = function(a, b) {
        return f.call(null, cljs.core.truth_(a === null) ? x : a, cljs.core.truth_(b === null) ? y : b)
      };
      var G__13111__13113 = function(a, b, c) {
        return f.call(null, cljs.core.truth_(a === null) ? x : a, cljs.core.truth_(b === null) ? y : b, c)
      };
      var G__13111__13114 = function() {
        var G__13116__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, cljs.core.truth_(a === null) ? x : a, cljs.core.truth_(b === null) ? y : b, c, ds)
        };
        var G__13116 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__13116__delegate.call(this, a, b, c, ds)
        };
        G__13116.cljs$lang$maxFixedArity = 3;
        G__13116.cljs$lang$applyTo = function(arglist__13117) {
          var a = cljs.core.first(arglist__13117);
          var b = cljs.core.first(cljs.core.next(arglist__13117));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__13117)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__13117)));
          return G__13116__delegate.call(this, a, b, c, ds)
        };
        return G__13116
      }();
      G__13111 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 2:
            return G__13111__13112.call(this, a, b);
          case 3:
            return G__13111__13113.call(this, a, b, c);
          default:
            return G__13111__13114.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__13111.cljs$lang$maxFixedArity = 3;
      G__13111.cljs$lang$applyTo = G__13111__13114.cljs$lang$applyTo;
      return G__13111
    }()
  };
  var fnil__13101 = function(f, x, y, z) {
    return function() {
      var G__13118 = null;
      var G__13118__13119 = function(a, b) {
        return f.call(null, cljs.core.truth_(a === null) ? x : a, cljs.core.truth_(b === null) ? y : b)
      };
      var G__13118__13120 = function(a, b, c) {
        return f.call(null, cljs.core.truth_(a === null) ? x : a, cljs.core.truth_(b === null) ? y : b, cljs.core.truth_(c === null) ? z : c)
      };
      var G__13118__13121 = function() {
        var G__13123__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, cljs.core.truth_(a === null) ? x : a, cljs.core.truth_(b === null) ? y : b, cljs.core.truth_(c === null) ? z : c, ds)
        };
        var G__13123 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__13123__delegate.call(this, a, b, c, ds)
        };
        G__13123.cljs$lang$maxFixedArity = 3;
        G__13123.cljs$lang$applyTo = function(arglist__13124) {
          var a = cljs.core.first(arglist__13124);
          var b = cljs.core.first(cljs.core.next(arglist__13124));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__13124)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__13124)));
          return G__13123__delegate.call(this, a, b, c, ds)
        };
        return G__13123
      }();
      G__13118 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 2:
            return G__13118__13119.call(this, a, b);
          case 3:
            return G__13118__13120.call(this, a, b, c);
          default:
            return G__13118__13121.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__13118.cljs$lang$maxFixedArity = 3;
      G__13118.cljs$lang$applyTo = G__13118__13121.cljs$lang$applyTo;
      return G__13118
    }()
  };
  fnil = function(f, x, y, z) {
    switch(arguments.length) {
      case 2:
        return fnil__13099.call(this, f, x);
      case 3:
        return fnil__13100.call(this, f, x, y);
      case 4:
        return fnil__13101.call(this, f, x, y, z)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return fnil
}();
cljs.core.map_indexed = function map_indexed(f, coll) {
  var mapi__13127 = function mpi(idx, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____13125 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3974__auto____13125)) {
        var s__13126 = temp__3974__auto____13125;
        return cljs.core.cons.call(null, f.call(null, idx, cljs.core.first.call(null, s__13126)), mpi.call(null, idx + 1, cljs.core.rest.call(null, s__13126)))
      }else {
        return null
      }
    })
  };
  return mapi__13127.call(null, 0, coll)
};
cljs.core.keep = function keep(f, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____13128 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3974__auto____13128)) {
      var s__13129 = temp__3974__auto____13128;
      var x__13130 = f.call(null, cljs.core.first.call(null, s__13129));
      if(cljs.core.truth_(x__13130 === null)) {
        return keep.call(null, f, cljs.core.rest.call(null, s__13129))
      }else {
        return cljs.core.cons.call(null, x__13130, keep.call(null, f, cljs.core.rest.call(null, s__13129)))
      }
    }else {
      return null
    }
  })
};
cljs.core.keep_indexed = function keep_indexed(f, coll) {
  var keepi__13140 = function kpi(idx, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____13137 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3974__auto____13137)) {
        var s__13138 = temp__3974__auto____13137;
        var x__13139 = f.call(null, idx, cljs.core.first.call(null, s__13138));
        if(cljs.core.truth_(x__13139 === null)) {
          return kpi.call(null, idx + 1, cljs.core.rest.call(null, s__13138))
        }else {
          return cljs.core.cons.call(null, x__13139, kpi.call(null, idx + 1, cljs.core.rest.call(null, s__13138)))
        }
      }else {
        return null
      }
    })
  };
  return keepi__13140.call(null, 0, coll)
};
cljs.core.every_pred = function() {
  var every_pred = null;
  var every_pred__13185 = function(p) {
    return function() {
      var ep1 = null;
      var ep1__13190 = function() {
        return true
      };
      var ep1__13191 = function(x) {
        return cljs.core.boolean$.call(null, p.call(null, x))
      };
      var ep1__13192 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____13147 = p.call(null, x);
          if(cljs.core.truth_(and__3822__auto____13147)) {
            return p.call(null, y)
          }else {
            return and__3822__auto____13147
          }
        }())
      };
      var ep1__13193 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____13148 = p.call(null, x);
          if(cljs.core.truth_(and__3822__auto____13148)) {
            var and__3822__auto____13149 = p.call(null, y);
            if(cljs.core.truth_(and__3822__auto____13149)) {
              return p.call(null, z)
            }else {
              return and__3822__auto____13149
            }
          }else {
            return and__3822__auto____13148
          }
        }())
      };
      var ep1__13194 = function() {
        var G__13196__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3822__auto____13150 = ep1.call(null, x, y, z);
            if(cljs.core.truth_(and__3822__auto____13150)) {
              return cljs.core.every_QMARK_.call(null, p, args)
            }else {
              return and__3822__auto____13150
            }
          }())
        };
        var G__13196 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__13196__delegate.call(this, x, y, z, args)
        };
        G__13196.cljs$lang$maxFixedArity = 3;
        G__13196.cljs$lang$applyTo = function(arglist__13197) {
          var x = cljs.core.first(arglist__13197);
          var y = cljs.core.first(cljs.core.next(arglist__13197));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__13197)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__13197)));
          return G__13196__delegate.call(this, x, y, z, args)
        };
        return G__13196
      }();
      ep1 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return ep1__13190.call(this);
          case 1:
            return ep1__13191.call(this, x);
          case 2:
            return ep1__13192.call(this, x, y);
          case 3:
            return ep1__13193.call(this, x, y, z);
          default:
            return ep1__13194.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      ep1.cljs$lang$maxFixedArity = 3;
      ep1.cljs$lang$applyTo = ep1__13194.cljs$lang$applyTo;
      return ep1
    }()
  };
  var every_pred__13186 = function(p1, p2) {
    return function() {
      var ep2 = null;
      var ep2__13198 = function() {
        return true
      };
      var ep2__13199 = function(x) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____13151 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____13151)) {
            return p2.call(null, x)
          }else {
            return and__3822__auto____13151
          }
        }())
      };
      var ep2__13200 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____13152 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____13152)) {
            var and__3822__auto____13153 = p1.call(null, y);
            if(cljs.core.truth_(and__3822__auto____13153)) {
              var and__3822__auto____13154 = p2.call(null, x);
              if(cljs.core.truth_(and__3822__auto____13154)) {
                return p2.call(null, y)
              }else {
                return and__3822__auto____13154
              }
            }else {
              return and__3822__auto____13153
            }
          }else {
            return and__3822__auto____13152
          }
        }())
      };
      var ep2__13201 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____13155 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____13155)) {
            var and__3822__auto____13156 = p1.call(null, y);
            if(cljs.core.truth_(and__3822__auto____13156)) {
              var and__3822__auto____13157 = p1.call(null, z);
              if(cljs.core.truth_(and__3822__auto____13157)) {
                var and__3822__auto____13158 = p2.call(null, x);
                if(cljs.core.truth_(and__3822__auto____13158)) {
                  var and__3822__auto____13159 = p2.call(null, y);
                  if(cljs.core.truth_(and__3822__auto____13159)) {
                    return p2.call(null, z)
                  }else {
                    return and__3822__auto____13159
                  }
                }else {
                  return and__3822__auto____13158
                }
              }else {
                return and__3822__auto____13157
              }
            }else {
              return and__3822__auto____13156
            }
          }else {
            return and__3822__auto____13155
          }
        }())
      };
      var ep2__13202 = function() {
        var G__13204__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3822__auto____13160 = ep2.call(null, x, y, z);
            if(cljs.core.truth_(and__3822__auto____13160)) {
              return cljs.core.every_QMARK_.call(null, function(p1__13131_SHARP_) {
                var and__3822__auto____13161 = p1.call(null, p1__13131_SHARP_);
                if(cljs.core.truth_(and__3822__auto____13161)) {
                  return p2.call(null, p1__13131_SHARP_)
                }else {
                  return and__3822__auto____13161
                }
              }, args)
            }else {
              return and__3822__auto____13160
            }
          }())
        };
        var G__13204 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__13204__delegate.call(this, x, y, z, args)
        };
        G__13204.cljs$lang$maxFixedArity = 3;
        G__13204.cljs$lang$applyTo = function(arglist__13205) {
          var x = cljs.core.first(arglist__13205);
          var y = cljs.core.first(cljs.core.next(arglist__13205));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__13205)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__13205)));
          return G__13204__delegate.call(this, x, y, z, args)
        };
        return G__13204
      }();
      ep2 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return ep2__13198.call(this);
          case 1:
            return ep2__13199.call(this, x);
          case 2:
            return ep2__13200.call(this, x, y);
          case 3:
            return ep2__13201.call(this, x, y, z);
          default:
            return ep2__13202.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      ep2.cljs$lang$maxFixedArity = 3;
      ep2.cljs$lang$applyTo = ep2__13202.cljs$lang$applyTo;
      return ep2
    }()
  };
  var every_pred__13187 = function(p1, p2, p3) {
    return function() {
      var ep3 = null;
      var ep3__13206 = function() {
        return true
      };
      var ep3__13207 = function(x) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____13162 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____13162)) {
            var and__3822__auto____13163 = p2.call(null, x);
            if(cljs.core.truth_(and__3822__auto____13163)) {
              return p3.call(null, x)
            }else {
              return and__3822__auto____13163
            }
          }else {
            return and__3822__auto____13162
          }
        }())
      };
      var ep3__13208 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____13164 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____13164)) {
            var and__3822__auto____13165 = p2.call(null, x);
            if(cljs.core.truth_(and__3822__auto____13165)) {
              var and__3822__auto____13166 = p3.call(null, x);
              if(cljs.core.truth_(and__3822__auto____13166)) {
                var and__3822__auto____13167 = p1.call(null, y);
                if(cljs.core.truth_(and__3822__auto____13167)) {
                  var and__3822__auto____13168 = p2.call(null, y);
                  if(cljs.core.truth_(and__3822__auto____13168)) {
                    return p3.call(null, y)
                  }else {
                    return and__3822__auto____13168
                  }
                }else {
                  return and__3822__auto____13167
                }
              }else {
                return and__3822__auto____13166
              }
            }else {
              return and__3822__auto____13165
            }
          }else {
            return and__3822__auto____13164
          }
        }())
      };
      var ep3__13209 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____13169 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____13169)) {
            var and__3822__auto____13170 = p2.call(null, x);
            if(cljs.core.truth_(and__3822__auto____13170)) {
              var and__3822__auto____13171 = p3.call(null, x);
              if(cljs.core.truth_(and__3822__auto____13171)) {
                var and__3822__auto____13172 = p1.call(null, y);
                if(cljs.core.truth_(and__3822__auto____13172)) {
                  var and__3822__auto____13173 = p2.call(null, y);
                  if(cljs.core.truth_(and__3822__auto____13173)) {
                    var and__3822__auto____13174 = p3.call(null, y);
                    if(cljs.core.truth_(and__3822__auto____13174)) {
                      var and__3822__auto____13175 = p1.call(null, z);
                      if(cljs.core.truth_(and__3822__auto____13175)) {
                        var and__3822__auto____13176 = p2.call(null, z);
                        if(cljs.core.truth_(and__3822__auto____13176)) {
                          return p3.call(null, z)
                        }else {
                          return and__3822__auto____13176
                        }
                      }else {
                        return and__3822__auto____13175
                      }
                    }else {
                      return and__3822__auto____13174
                    }
                  }else {
                    return and__3822__auto____13173
                  }
                }else {
                  return and__3822__auto____13172
                }
              }else {
                return and__3822__auto____13171
              }
            }else {
              return and__3822__auto____13170
            }
          }else {
            return and__3822__auto____13169
          }
        }())
      };
      var ep3__13210 = function() {
        var G__13212__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3822__auto____13177 = ep3.call(null, x, y, z);
            if(cljs.core.truth_(and__3822__auto____13177)) {
              return cljs.core.every_QMARK_.call(null, function(p1__13132_SHARP_) {
                var and__3822__auto____13178 = p1.call(null, p1__13132_SHARP_);
                if(cljs.core.truth_(and__3822__auto____13178)) {
                  var and__3822__auto____13179 = p2.call(null, p1__13132_SHARP_);
                  if(cljs.core.truth_(and__3822__auto____13179)) {
                    return p3.call(null, p1__13132_SHARP_)
                  }else {
                    return and__3822__auto____13179
                  }
                }else {
                  return and__3822__auto____13178
                }
              }, args)
            }else {
              return and__3822__auto____13177
            }
          }())
        };
        var G__13212 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__13212__delegate.call(this, x, y, z, args)
        };
        G__13212.cljs$lang$maxFixedArity = 3;
        G__13212.cljs$lang$applyTo = function(arglist__13213) {
          var x = cljs.core.first(arglist__13213);
          var y = cljs.core.first(cljs.core.next(arglist__13213));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__13213)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__13213)));
          return G__13212__delegate.call(this, x, y, z, args)
        };
        return G__13212
      }();
      ep3 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return ep3__13206.call(this);
          case 1:
            return ep3__13207.call(this, x);
          case 2:
            return ep3__13208.call(this, x, y);
          case 3:
            return ep3__13209.call(this, x, y, z);
          default:
            return ep3__13210.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      ep3.cljs$lang$maxFixedArity = 3;
      ep3.cljs$lang$applyTo = ep3__13210.cljs$lang$applyTo;
      return ep3
    }()
  };
  var every_pred__13188 = function() {
    var G__13214__delegate = function(p1, p2, p3, ps) {
      var ps__13180 = cljs.core.list_STAR_.call(null, p1, p2, p3, ps);
      return function() {
        var epn = null;
        var epn__13215 = function() {
          return true
        };
        var epn__13216 = function(x) {
          return cljs.core.every_QMARK_.call(null, function(p1__13133_SHARP_) {
            return p1__13133_SHARP_.call(null, x)
          }, ps__13180)
        };
        var epn__13217 = function(x, y) {
          return cljs.core.every_QMARK_.call(null, function(p1__13134_SHARP_) {
            var and__3822__auto____13181 = p1__13134_SHARP_.call(null, x);
            if(cljs.core.truth_(and__3822__auto____13181)) {
              return p1__13134_SHARP_.call(null, y)
            }else {
              return and__3822__auto____13181
            }
          }, ps__13180)
        };
        var epn__13218 = function(x, y, z) {
          return cljs.core.every_QMARK_.call(null, function(p1__13135_SHARP_) {
            var and__3822__auto____13182 = p1__13135_SHARP_.call(null, x);
            if(cljs.core.truth_(and__3822__auto____13182)) {
              var and__3822__auto____13183 = p1__13135_SHARP_.call(null, y);
              if(cljs.core.truth_(and__3822__auto____13183)) {
                return p1__13135_SHARP_.call(null, z)
              }else {
                return and__3822__auto____13183
              }
            }else {
              return and__3822__auto____13182
            }
          }, ps__13180)
        };
        var epn__13219 = function() {
          var G__13221__delegate = function(x, y, z, args) {
            return cljs.core.boolean$.call(null, function() {
              var and__3822__auto____13184 = epn.call(null, x, y, z);
              if(cljs.core.truth_(and__3822__auto____13184)) {
                return cljs.core.every_QMARK_.call(null, function(p1__13136_SHARP_) {
                  return cljs.core.every_QMARK_.call(null, p1__13136_SHARP_, args)
                }, ps__13180)
              }else {
                return and__3822__auto____13184
              }
            }())
          };
          var G__13221 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__13221__delegate.call(this, x, y, z, args)
          };
          G__13221.cljs$lang$maxFixedArity = 3;
          G__13221.cljs$lang$applyTo = function(arglist__13222) {
            var x = cljs.core.first(arglist__13222);
            var y = cljs.core.first(cljs.core.next(arglist__13222));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__13222)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__13222)));
            return G__13221__delegate.call(this, x, y, z, args)
          };
          return G__13221
        }();
        epn = function(x, y, z, var_args) {
          var args = var_args;
          switch(arguments.length) {
            case 0:
              return epn__13215.call(this);
            case 1:
              return epn__13216.call(this, x);
            case 2:
              return epn__13217.call(this, x, y);
            case 3:
              return epn__13218.call(this, x, y, z);
            default:
              return epn__13219.apply(this, arguments)
          }
          throw"Invalid arity: " + arguments.length;
        };
        epn.cljs$lang$maxFixedArity = 3;
        epn.cljs$lang$applyTo = epn__13219.cljs$lang$applyTo;
        return epn
      }()
    };
    var G__13214 = function(p1, p2, p3, var_args) {
      var ps = null;
      if(goog.isDef(var_args)) {
        ps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__13214__delegate.call(this, p1, p2, p3, ps)
    };
    G__13214.cljs$lang$maxFixedArity = 3;
    G__13214.cljs$lang$applyTo = function(arglist__13223) {
      var p1 = cljs.core.first(arglist__13223);
      var p2 = cljs.core.first(cljs.core.next(arglist__13223));
      var p3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__13223)));
      var ps = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__13223)));
      return G__13214__delegate.call(this, p1, p2, p3, ps)
    };
    return G__13214
  }();
  every_pred = function(p1, p2, p3, var_args) {
    var ps = var_args;
    switch(arguments.length) {
      case 1:
        return every_pred__13185.call(this, p1);
      case 2:
        return every_pred__13186.call(this, p1, p2);
      case 3:
        return every_pred__13187.call(this, p1, p2, p3);
      default:
        return every_pred__13188.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  every_pred.cljs$lang$maxFixedArity = 3;
  every_pred.cljs$lang$applyTo = every_pred__13188.cljs$lang$applyTo;
  return every_pred
}();
cljs.core.some_fn = function() {
  var some_fn = null;
  var some_fn__13263 = function(p) {
    return function() {
      var sp1 = null;
      var sp1__13268 = function() {
        return null
      };
      var sp1__13269 = function(x) {
        return p.call(null, x)
      };
      var sp1__13270 = function(x, y) {
        var or__3824__auto____13225 = p.call(null, x);
        if(cljs.core.truth_(or__3824__auto____13225)) {
          return or__3824__auto____13225
        }else {
          return p.call(null, y)
        }
      };
      var sp1__13271 = function(x, y, z) {
        var or__3824__auto____13226 = p.call(null, x);
        if(cljs.core.truth_(or__3824__auto____13226)) {
          return or__3824__auto____13226
        }else {
          var or__3824__auto____13227 = p.call(null, y);
          if(cljs.core.truth_(or__3824__auto____13227)) {
            return or__3824__auto____13227
          }else {
            return p.call(null, z)
          }
        }
      };
      var sp1__13272 = function() {
        var G__13274__delegate = function(x, y, z, args) {
          var or__3824__auto____13228 = sp1.call(null, x, y, z);
          if(cljs.core.truth_(or__3824__auto____13228)) {
            return or__3824__auto____13228
          }else {
            return cljs.core.some.call(null, p, args)
          }
        };
        var G__13274 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__13274__delegate.call(this, x, y, z, args)
        };
        G__13274.cljs$lang$maxFixedArity = 3;
        G__13274.cljs$lang$applyTo = function(arglist__13275) {
          var x = cljs.core.first(arglist__13275);
          var y = cljs.core.first(cljs.core.next(arglist__13275));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__13275)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__13275)));
          return G__13274__delegate.call(this, x, y, z, args)
        };
        return G__13274
      }();
      sp1 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return sp1__13268.call(this);
          case 1:
            return sp1__13269.call(this, x);
          case 2:
            return sp1__13270.call(this, x, y);
          case 3:
            return sp1__13271.call(this, x, y, z);
          default:
            return sp1__13272.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      sp1.cljs$lang$maxFixedArity = 3;
      sp1.cljs$lang$applyTo = sp1__13272.cljs$lang$applyTo;
      return sp1
    }()
  };
  var some_fn__13264 = function(p1, p2) {
    return function() {
      var sp2 = null;
      var sp2__13276 = function() {
        return null
      };
      var sp2__13277 = function(x) {
        var or__3824__auto____13229 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____13229)) {
          return or__3824__auto____13229
        }else {
          return p2.call(null, x)
        }
      };
      var sp2__13278 = function(x, y) {
        var or__3824__auto____13230 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____13230)) {
          return or__3824__auto____13230
        }else {
          var or__3824__auto____13231 = p1.call(null, y);
          if(cljs.core.truth_(or__3824__auto____13231)) {
            return or__3824__auto____13231
          }else {
            var or__3824__auto____13232 = p2.call(null, x);
            if(cljs.core.truth_(or__3824__auto____13232)) {
              return or__3824__auto____13232
            }else {
              return p2.call(null, y)
            }
          }
        }
      };
      var sp2__13279 = function(x, y, z) {
        var or__3824__auto____13233 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____13233)) {
          return or__3824__auto____13233
        }else {
          var or__3824__auto____13234 = p1.call(null, y);
          if(cljs.core.truth_(or__3824__auto____13234)) {
            return or__3824__auto____13234
          }else {
            var or__3824__auto____13235 = p1.call(null, z);
            if(cljs.core.truth_(or__3824__auto____13235)) {
              return or__3824__auto____13235
            }else {
              var or__3824__auto____13236 = p2.call(null, x);
              if(cljs.core.truth_(or__3824__auto____13236)) {
                return or__3824__auto____13236
              }else {
                var or__3824__auto____13237 = p2.call(null, y);
                if(cljs.core.truth_(or__3824__auto____13237)) {
                  return or__3824__auto____13237
                }else {
                  return p2.call(null, z)
                }
              }
            }
          }
        }
      };
      var sp2__13280 = function() {
        var G__13282__delegate = function(x, y, z, args) {
          var or__3824__auto____13238 = sp2.call(null, x, y, z);
          if(cljs.core.truth_(or__3824__auto____13238)) {
            return or__3824__auto____13238
          }else {
            return cljs.core.some.call(null, function(p1__13141_SHARP_) {
              var or__3824__auto____13239 = p1.call(null, p1__13141_SHARP_);
              if(cljs.core.truth_(or__3824__auto____13239)) {
                return or__3824__auto____13239
              }else {
                return p2.call(null, p1__13141_SHARP_)
              }
            }, args)
          }
        };
        var G__13282 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__13282__delegate.call(this, x, y, z, args)
        };
        G__13282.cljs$lang$maxFixedArity = 3;
        G__13282.cljs$lang$applyTo = function(arglist__13283) {
          var x = cljs.core.first(arglist__13283);
          var y = cljs.core.first(cljs.core.next(arglist__13283));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__13283)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__13283)));
          return G__13282__delegate.call(this, x, y, z, args)
        };
        return G__13282
      }();
      sp2 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return sp2__13276.call(this);
          case 1:
            return sp2__13277.call(this, x);
          case 2:
            return sp2__13278.call(this, x, y);
          case 3:
            return sp2__13279.call(this, x, y, z);
          default:
            return sp2__13280.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      sp2.cljs$lang$maxFixedArity = 3;
      sp2.cljs$lang$applyTo = sp2__13280.cljs$lang$applyTo;
      return sp2
    }()
  };
  var some_fn__13265 = function(p1, p2, p3) {
    return function() {
      var sp3 = null;
      var sp3__13284 = function() {
        return null
      };
      var sp3__13285 = function(x) {
        var or__3824__auto____13240 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____13240)) {
          return or__3824__auto____13240
        }else {
          var or__3824__auto____13241 = p2.call(null, x);
          if(cljs.core.truth_(or__3824__auto____13241)) {
            return or__3824__auto____13241
          }else {
            return p3.call(null, x)
          }
        }
      };
      var sp3__13286 = function(x, y) {
        var or__3824__auto____13242 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____13242)) {
          return or__3824__auto____13242
        }else {
          var or__3824__auto____13243 = p2.call(null, x);
          if(cljs.core.truth_(or__3824__auto____13243)) {
            return or__3824__auto____13243
          }else {
            var or__3824__auto____13244 = p3.call(null, x);
            if(cljs.core.truth_(or__3824__auto____13244)) {
              return or__3824__auto____13244
            }else {
              var or__3824__auto____13245 = p1.call(null, y);
              if(cljs.core.truth_(or__3824__auto____13245)) {
                return or__3824__auto____13245
              }else {
                var or__3824__auto____13246 = p2.call(null, y);
                if(cljs.core.truth_(or__3824__auto____13246)) {
                  return or__3824__auto____13246
                }else {
                  return p3.call(null, y)
                }
              }
            }
          }
        }
      };
      var sp3__13287 = function(x, y, z) {
        var or__3824__auto____13247 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____13247)) {
          return or__3824__auto____13247
        }else {
          var or__3824__auto____13248 = p2.call(null, x);
          if(cljs.core.truth_(or__3824__auto____13248)) {
            return or__3824__auto____13248
          }else {
            var or__3824__auto____13249 = p3.call(null, x);
            if(cljs.core.truth_(or__3824__auto____13249)) {
              return or__3824__auto____13249
            }else {
              var or__3824__auto____13250 = p1.call(null, y);
              if(cljs.core.truth_(or__3824__auto____13250)) {
                return or__3824__auto____13250
              }else {
                var or__3824__auto____13251 = p2.call(null, y);
                if(cljs.core.truth_(or__3824__auto____13251)) {
                  return or__3824__auto____13251
                }else {
                  var or__3824__auto____13252 = p3.call(null, y);
                  if(cljs.core.truth_(or__3824__auto____13252)) {
                    return or__3824__auto____13252
                  }else {
                    var or__3824__auto____13253 = p1.call(null, z);
                    if(cljs.core.truth_(or__3824__auto____13253)) {
                      return or__3824__auto____13253
                    }else {
                      var or__3824__auto____13254 = p2.call(null, z);
                      if(cljs.core.truth_(or__3824__auto____13254)) {
                        return or__3824__auto____13254
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
      var sp3__13288 = function() {
        var G__13290__delegate = function(x, y, z, args) {
          var or__3824__auto____13255 = sp3.call(null, x, y, z);
          if(cljs.core.truth_(or__3824__auto____13255)) {
            return or__3824__auto____13255
          }else {
            return cljs.core.some.call(null, function(p1__13142_SHARP_) {
              var or__3824__auto____13256 = p1.call(null, p1__13142_SHARP_);
              if(cljs.core.truth_(or__3824__auto____13256)) {
                return or__3824__auto____13256
              }else {
                var or__3824__auto____13257 = p2.call(null, p1__13142_SHARP_);
                if(cljs.core.truth_(or__3824__auto____13257)) {
                  return or__3824__auto____13257
                }else {
                  return p3.call(null, p1__13142_SHARP_)
                }
              }
            }, args)
          }
        };
        var G__13290 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__13290__delegate.call(this, x, y, z, args)
        };
        G__13290.cljs$lang$maxFixedArity = 3;
        G__13290.cljs$lang$applyTo = function(arglist__13291) {
          var x = cljs.core.first(arglist__13291);
          var y = cljs.core.first(cljs.core.next(arglist__13291));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__13291)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__13291)));
          return G__13290__delegate.call(this, x, y, z, args)
        };
        return G__13290
      }();
      sp3 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return sp3__13284.call(this);
          case 1:
            return sp3__13285.call(this, x);
          case 2:
            return sp3__13286.call(this, x, y);
          case 3:
            return sp3__13287.call(this, x, y, z);
          default:
            return sp3__13288.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      sp3.cljs$lang$maxFixedArity = 3;
      sp3.cljs$lang$applyTo = sp3__13288.cljs$lang$applyTo;
      return sp3
    }()
  };
  var some_fn__13266 = function() {
    var G__13292__delegate = function(p1, p2, p3, ps) {
      var ps__13258 = cljs.core.list_STAR_.call(null, p1, p2, p3, ps);
      return function() {
        var spn = null;
        var spn__13293 = function() {
          return null
        };
        var spn__13294 = function(x) {
          return cljs.core.some.call(null, function(p1__13143_SHARP_) {
            return p1__13143_SHARP_.call(null, x)
          }, ps__13258)
        };
        var spn__13295 = function(x, y) {
          return cljs.core.some.call(null, function(p1__13144_SHARP_) {
            var or__3824__auto____13259 = p1__13144_SHARP_.call(null, x);
            if(cljs.core.truth_(or__3824__auto____13259)) {
              return or__3824__auto____13259
            }else {
              return p1__13144_SHARP_.call(null, y)
            }
          }, ps__13258)
        };
        var spn__13296 = function(x, y, z) {
          return cljs.core.some.call(null, function(p1__13145_SHARP_) {
            var or__3824__auto____13260 = p1__13145_SHARP_.call(null, x);
            if(cljs.core.truth_(or__3824__auto____13260)) {
              return or__3824__auto____13260
            }else {
              var or__3824__auto____13261 = p1__13145_SHARP_.call(null, y);
              if(cljs.core.truth_(or__3824__auto____13261)) {
                return or__3824__auto____13261
              }else {
                return p1__13145_SHARP_.call(null, z)
              }
            }
          }, ps__13258)
        };
        var spn__13297 = function() {
          var G__13299__delegate = function(x, y, z, args) {
            var or__3824__auto____13262 = spn.call(null, x, y, z);
            if(cljs.core.truth_(or__3824__auto____13262)) {
              return or__3824__auto____13262
            }else {
              return cljs.core.some.call(null, function(p1__13146_SHARP_) {
                return cljs.core.some.call(null, p1__13146_SHARP_, args)
              }, ps__13258)
            }
          };
          var G__13299 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__13299__delegate.call(this, x, y, z, args)
          };
          G__13299.cljs$lang$maxFixedArity = 3;
          G__13299.cljs$lang$applyTo = function(arglist__13300) {
            var x = cljs.core.first(arglist__13300);
            var y = cljs.core.first(cljs.core.next(arglist__13300));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__13300)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__13300)));
            return G__13299__delegate.call(this, x, y, z, args)
          };
          return G__13299
        }();
        spn = function(x, y, z, var_args) {
          var args = var_args;
          switch(arguments.length) {
            case 0:
              return spn__13293.call(this);
            case 1:
              return spn__13294.call(this, x);
            case 2:
              return spn__13295.call(this, x, y);
            case 3:
              return spn__13296.call(this, x, y, z);
            default:
              return spn__13297.apply(this, arguments)
          }
          throw"Invalid arity: " + arguments.length;
        };
        spn.cljs$lang$maxFixedArity = 3;
        spn.cljs$lang$applyTo = spn__13297.cljs$lang$applyTo;
        return spn
      }()
    };
    var G__13292 = function(p1, p2, p3, var_args) {
      var ps = null;
      if(goog.isDef(var_args)) {
        ps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__13292__delegate.call(this, p1, p2, p3, ps)
    };
    G__13292.cljs$lang$maxFixedArity = 3;
    G__13292.cljs$lang$applyTo = function(arglist__13301) {
      var p1 = cljs.core.first(arglist__13301);
      var p2 = cljs.core.first(cljs.core.next(arglist__13301));
      var p3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__13301)));
      var ps = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__13301)));
      return G__13292__delegate.call(this, p1, p2, p3, ps)
    };
    return G__13292
  }();
  some_fn = function(p1, p2, p3, var_args) {
    var ps = var_args;
    switch(arguments.length) {
      case 1:
        return some_fn__13263.call(this, p1);
      case 2:
        return some_fn__13264.call(this, p1, p2);
      case 3:
        return some_fn__13265.call(this, p1, p2, p3);
      default:
        return some_fn__13266.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  some_fn.cljs$lang$maxFixedArity = 3;
  some_fn.cljs$lang$applyTo = some_fn__13266.cljs$lang$applyTo;
  return some_fn
}();
cljs.core.map = function() {
  var map = null;
  var map__13314 = function(f, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____13302 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3974__auto____13302)) {
        var s__13303 = temp__3974__auto____13302;
        return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s__13303)), map.call(null, f, cljs.core.rest.call(null, s__13303)))
      }else {
        return null
      }
    })
  };
  var map__13315 = function(f, c1, c2) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1__13304 = cljs.core.seq.call(null, c1);
      var s2__13305 = cljs.core.seq.call(null, c2);
      if(cljs.core.truth_(function() {
        var and__3822__auto____13306 = s1__13304;
        if(cljs.core.truth_(and__3822__auto____13306)) {
          return s2__13305
        }else {
          return and__3822__auto____13306
        }
      }())) {
        return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s1__13304), cljs.core.first.call(null, s2__13305)), map.call(null, f, cljs.core.rest.call(null, s1__13304), cljs.core.rest.call(null, s2__13305)))
      }else {
        return null
      }
    })
  };
  var map__13316 = function(f, c1, c2, c3) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1__13307 = cljs.core.seq.call(null, c1);
      var s2__13308 = cljs.core.seq.call(null, c2);
      var s3__13309 = cljs.core.seq.call(null, c3);
      if(cljs.core.truth_(function() {
        var and__3822__auto____13310 = s1__13307;
        if(cljs.core.truth_(and__3822__auto____13310)) {
          var and__3822__auto____13311 = s2__13308;
          if(cljs.core.truth_(and__3822__auto____13311)) {
            return s3__13309
          }else {
            return and__3822__auto____13311
          }
        }else {
          return and__3822__auto____13310
        }
      }())) {
        return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s1__13307), cljs.core.first.call(null, s2__13308), cljs.core.first.call(null, s3__13309)), map.call(null, f, cljs.core.rest.call(null, s1__13307), cljs.core.rest.call(null, s2__13308), cljs.core.rest.call(null, s3__13309)))
      }else {
        return null
      }
    })
  };
  var map__13317 = function() {
    var G__13319__delegate = function(f, c1, c2, c3, colls) {
      var step__13313 = function step(cs) {
        return new cljs.core.LazySeq(null, false, function() {
          var ss__13312 = map.call(null, cljs.core.seq, cs);
          if(cljs.core.truth_(cljs.core.every_QMARK_.call(null, cljs.core.identity, ss__13312))) {
            return cljs.core.cons.call(null, map.call(null, cljs.core.first, ss__13312), step.call(null, map.call(null, cljs.core.rest, ss__13312)))
          }else {
            return null
          }
        })
      };
      return map.call(null, function(p1__13224_SHARP_) {
        return cljs.core.apply.call(null, f, p1__13224_SHARP_)
      }, step__13313.call(null, cljs.core.conj.call(null, colls, c3, c2, c1)))
    };
    var G__13319 = function(f, c1, c2, c3, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__13319__delegate.call(this, f, c1, c2, c3, colls)
    };
    G__13319.cljs$lang$maxFixedArity = 4;
    G__13319.cljs$lang$applyTo = function(arglist__13320) {
      var f = cljs.core.first(arglist__13320);
      var c1 = cljs.core.first(cljs.core.next(arglist__13320));
      var c2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__13320)));
      var c3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__13320))));
      var colls = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__13320))));
      return G__13319__delegate.call(this, f, c1, c2, c3, colls)
    };
    return G__13319
  }();
  map = function(f, c1, c2, c3, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return map__13314.call(this, f, c1);
      case 3:
        return map__13315.call(this, f, c1, c2);
      case 4:
        return map__13316.call(this, f, c1, c2, c3);
      default:
        return map__13317.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  map.cljs$lang$maxFixedArity = 4;
  map.cljs$lang$applyTo = map__13317.cljs$lang$applyTo;
  return map
}();
cljs.core.take = function take(n, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    if(cljs.core.truth_(n > 0)) {
      var temp__3974__auto____13321 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3974__auto____13321)) {
        var s__13322 = temp__3974__auto____13321;
        return cljs.core.cons.call(null, cljs.core.first.call(null, s__13322), take.call(null, n - 1, cljs.core.rest.call(null, s__13322)))
      }else {
        return null
      }
    }else {
      return null
    }
  })
};
cljs.core.drop = function drop(n, coll) {
  var step__13325 = function(n, coll) {
    while(true) {
      var s__13323 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(function() {
        var and__3822__auto____13324 = n > 0;
        if(cljs.core.truth_(and__3822__auto____13324)) {
          return s__13323
        }else {
          return and__3822__auto____13324
        }
      }())) {
        var G__13326 = n - 1;
        var G__13327 = cljs.core.rest.call(null, s__13323);
        n = G__13326;
        coll = G__13327;
        continue
      }else {
        return s__13323
      }
      break
    }
  };
  return new cljs.core.LazySeq(null, false, function() {
    return step__13325.call(null, n, coll)
  })
};
cljs.core.drop_last = function() {
  var drop_last = null;
  var drop_last__13328 = function(s) {
    return drop_last.call(null, 1, s)
  };
  var drop_last__13329 = function(n, s) {
    return cljs.core.map.call(null, function(x, _) {
      return x
    }, s, cljs.core.drop.call(null, n, s))
  };
  drop_last = function(n, s) {
    switch(arguments.length) {
      case 1:
        return drop_last__13328.call(this, n);
      case 2:
        return drop_last__13329.call(this, n, s)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return drop_last
}();
cljs.core.take_last = function take_last(n, coll) {
  var s__13331 = cljs.core.seq.call(null, coll);
  var lead__13332 = cljs.core.seq.call(null, cljs.core.drop.call(null, n, coll));
  while(true) {
    if(cljs.core.truth_(lead__13332)) {
      var G__13333 = cljs.core.next.call(null, s__13331);
      var G__13334 = cljs.core.next.call(null, lead__13332);
      s__13331 = G__13333;
      lead__13332 = G__13334;
      continue
    }else {
      return s__13331
    }
    break
  }
};
cljs.core.drop_while = function drop_while(pred, coll) {
  var step__13337 = function(pred, coll) {
    while(true) {
      var s__13335 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(function() {
        var and__3822__auto____13336 = s__13335;
        if(cljs.core.truth_(and__3822__auto____13336)) {
          return pred.call(null, cljs.core.first.call(null, s__13335))
        }else {
          return and__3822__auto____13336
        }
      }())) {
        var G__13338 = pred;
        var G__13339 = cljs.core.rest.call(null, s__13335);
        pred = G__13338;
        coll = G__13339;
        continue
      }else {
        return s__13335
      }
      break
    }
  };
  return new cljs.core.LazySeq(null, false, function() {
    return step__13337.call(null, pred, coll)
  })
};
cljs.core.cycle = function cycle(coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____13340 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3974__auto____13340)) {
      var s__13341 = temp__3974__auto____13340;
      return cljs.core.concat.call(null, s__13341, cycle.call(null, s__13341))
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
  var repeat__13342 = function(x) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, x, repeat.call(null, x))
    })
  };
  var repeat__13343 = function(n, x) {
    return cljs.core.take.call(null, n, repeat.call(null, x))
  };
  repeat = function(n, x) {
    switch(arguments.length) {
      case 1:
        return repeat__13342.call(this, n);
      case 2:
        return repeat__13343.call(this, n, x)
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
  var repeatedly__13345 = function(f) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, f.call(null), repeatedly.call(null, f))
    })
  };
  var repeatedly__13346 = function(n, f) {
    return cljs.core.take.call(null, n, repeatedly.call(null, f))
  };
  repeatedly = function(n, f) {
    switch(arguments.length) {
      case 1:
        return repeatedly__13345.call(this, n);
      case 2:
        return repeatedly__13346.call(this, n, f)
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
  var interleave__13352 = function(c1, c2) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1__13348 = cljs.core.seq.call(null, c1);
      var s2__13349 = cljs.core.seq.call(null, c2);
      if(cljs.core.truth_(function() {
        var and__3822__auto____13350 = s1__13348;
        if(cljs.core.truth_(and__3822__auto____13350)) {
          return s2__13349
        }else {
          return and__3822__auto____13350
        }
      }())) {
        return cljs.core.cons.call(null, cljs.core.first.call(null, s1__13348), cljs.core.cons.call(null, cljs.core.first.call(null, s2__13349), interleave.call(null, cljs.core.rest.call(null, s1__13348), cljs.core.rest.call(null, s2__13349))))
      }else {
        return null
      }
    })
  };
  var interleave__13353 = function() {
    var G__13355__delegate = function(c1, c2, colls) {
      return new cljs.core.LazySeq(null, false, function() {
        var ss__13351 = cljs.core.map.call(null, cljs.core.seq, cljs.core.conj.call(null, colls, c2, c1));
        if(cljs.core.truth_(cljs.core.every_QMARK_.call(null, cljs.core.identity, ss__13351))) {
          return cljs.core.concat.call(null, cljs.core.map.call(null, cljs.core.first, ss__13351), cljs.core.apply.call(null, interleave, cljs.core.map.call(null, cljs.core.rest, ss__13351)))
        }else {
          return null
        }
      })
    };
    var G__13355 = function(c1, c2, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__13355__delegate.call(this, c1, c2, colls)
    };
    G__13355.cljs$lang$maxFixedArity = 2;
    G__13355.cljs$lang$applyTo = function(arglist__13356) {
      var c1 = cljs.core.first(arglist__13356);
      var c2 = cljs.core.first(cljs.core.next(arglist__13356));
      var colls = cljs.core.rest(cljs.core.next(arglist__13356));
      return G__13355__delegate.call(this, c1, c2, colls)
    };
    return G__13355
  }();
  interleave = function(c1, c2, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return interleave__13352.call(this, c1, c2);
      default:
        return interleave__13353.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  interleave.cljs$lang$maxFixedArity = 2;
  interleave.cljs$lang$applyTo = interleave__13353.cljs$lang$applyTo;
  return interleave
}();
cljs.core.interpose = function interpose(sep, coll) {
  return cljs.core.drop.call(null, 1, cljs.core.interleave.call(null, cljs.core.repeat.call(null, sep), coll))
};
cljs.core.flatten1 = function flatten1(colls) {
  var cat__13359 = function cat(coll, colls) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3971__auto____13357 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3971__auto____13357)) {
        var coll__13358 = temp__3971__auto____13357;
        return cljs.core.cons.call(null, cljs.core.first.call(null, coll__13358), cat.call(null, cljs.core.rest.call(null, coll__13358), colls))
      }else {
        if(cljs.core.truth_(cljs.core.seq.call(null, colls))) {
          return cat.call(null, cljs.core.first.call(null, colls), cljs.core.rest.call(null, colls))
        }else {
          return null
        }
      }
    })
  };
  return cat__13359.call(null, null, colls)
};
cljs.core.mapcat = function() {
  var mapcat = null;
  var mapcat__13360 = function(f, coll) {
    return cljs.core.flatten1.call(null, cljs.core.map.call(null, f, coll))
  };
  var mapcat__13361 = function() {
    var G__13363__delegate = function(f, coll, colls) {
      return cljs.core.flatten1.call(null, cljs.core.apply.call(null, cljs.core.map, f, coll, colls))
    };
    var G__13363 = function(f, coll, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__13363__delegate.call(this, f, coll, colls)
    };
    G__13363.cljs$lang$maxFixedArity = 2;
    G__13363.cljs$lang$applyTo = function(arglist__13364) {
      var f = cljs.core.first(arglist__13364);
      var coll = cljs.core.first(cljs.core.next(arglist__13364));
      var colls = cljs.core.rest(cljs.core.next(arglist__13364));
      return G__13363__delegate.call(this, f, coll, colls)
    };
    return G__13363
  }();
  mapcat = function(f, coll, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return mapcat__13360.call(this, f, coll);
      default:
        return mapcat__13361.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  mapcat.cljs$lang$maxFixedArity = 2;
  mapcat.cljs$lang$applyTo = mapcat__13361.cljs$lang$applyTo;
  return mapcat
}();
cljs.core.filter = function filter(pred, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____13365 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3974__auto____13365)) {
      var s__13366 = temp__3974__auto____13365;
      var f__13367 = cljs.core.first.call(null, s__13366);
      var r__13368 = cljs.core.rest.call(null, s__13366);
      if(cljs.core.truth_(pred.call(null, f__13367))) {
        return cljs.core.cons.call(null, f__13367, filter.call(null, pred, r__13368))
      }else {
        return filter.call(null, pred, r__13368)
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
  var walk__13370 = function walk(node) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, node, cljs.core.truth_(branch_QMARK_.call(null, node)) ? cljs.core.mapcat.call(null, walk, children.call(null, node)) : null)
    })
  };
  return walk__13370.call(null, root)
};
cljs.core.flatten = function flatten(x) {
  return cljs.core.filter.call(null, function(p1__13369_SHARP_) {
    return cljs.core.not.call(null, cljs.core.sequential_QMARK_.call(null, p1__13369_SHARP_))
  }, cljs.core.rest.call(null, cljs.core.tree_seq.call(null, cljs.core.sequential_QMARK_, cljs.core.seq, x)))
};
cljs.core.into = function into(to, from) {
  return cljs.core.reduce.call(null, cljs.core._conj, to, from)
};
cljs.core.partition = function() {
  var partition = null;
  var partition__13377 = function(n, coll) {
    return partition.call(null, n, n, coll)
  };
  var partition__13378 = function(n, step, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____13371 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3974__auto____13371)) {
        var s__13372 = temp__3974__auto____13371;
        var p__13373 = cljs.core.take.call(null, n, s__13372);
        if(cljs.core.truth_(cljs.core._EQ_.call(null, n, cljs.core.count.call(null, p__13373)))) {
          return cljs.core.cons.call(null, p__13373, partition.call(null, n, step, cljs.core.drop.call(null, step, s__13372)))
        }else {
          return null
        }
      }else {
        return null
      }
    })
  };
  var partition__13379 = function(n, step, pad, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____13374 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3974__auto____13374)) {
        var s__13375 = temp__3974__auto____13374;
        var p__13376 = cljs.core.take.call(null, n, s__13375);
        if(cljs.core.truth_(cljs.core._EQ_.call(null, n, cljs.core.count.call(null, p__13376)))) {
          return cljs.core.cons.call(null, p__13376, partition.call(null, n, step, pad, cljs.core.drop.call(null, step, s__13375)))
        }else {
          return cljs.core.list.call(null, cljs.core.take.call(null, n, cljs.core.concat.call(null, p__13376, pad)))
        }
      }else {
        return null
      }
    })
  };
  partition = function(n, step, pad, coll) {
    switch(arguments.length) {
      case 2:
        return partition__13377.call(this, n, step);
      case 3:
        return partition__13378.call(this, n, step, pad);
      case 4:
        return partition__13379.call(this, n, step, pad, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return partition
}();
cljs.core.get_in = function() {
  var get_in = null;
  var get_in__13385 = function(m, ks) {
    return cljs.core.reduce.call(null, cljs.core.get, m, ks)
  };
  var get_in__13386 = function(m, ks, not_found) {
    var sentinel__13381 = cljs.core.lookup_sentinel;
    var m__13382 = m;
    var ks__13383 = cljs.core.seq.call(null, ks);
    while(true) {
      if(cljs.core.truth_(ks__13383)) {
        var m__13384 = cljs.core.get.call(null, m__13382, cljs.core.first.call(null, ks__13383), sentinel__13381);
        if(cljs.core.truth_(sentinel__13381 === m__13384)) {
          return not_found
        }else {
          var G__13388 = sentinel__13381;
          var G__13389 = m__13384;
          var G__13390 = cljs.core.next.call(null, ks__13383);
          sentinel__13381 = G__13388;
          m__13382 = G__13389;
          ks__13383 = G__13390;
          continue
        }
      }else {
        return m__13382
      }
      break
    }
  };
  get_in = function(m, ks, not_found) {
    switch(arguments.length) {
      case 2:
        return get_in__13385.call(this, m, ks);
      case 3:
        return get_in__13386.call(this, m, ks, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return get_in
}();
cljs.core.assoc_in = function assoc_in(m, p__13391, v) {
  var vec__13392__13393 = p__13391;
  var k__13394 = cljs.core.nth.call(null, vec__13392__13393, 0, null);
  var ks__13395 = cljs.core.nthnext.call(null, vec__13392__13393, 1);
  if(cljs.core.truth_(ks__13395)) {
    return cljs.core.assoc.call(null, m, k__13394, assoc_in.call(null, cljs.core.get.call(null, m, k__13394), ks__13395, v))
  }else {
    return cljs.core.assoc.call(null, m, k__13394, v)
  }
};
cljs.core.update_in = function() {
  var update_in__delegate = function(m, p__13396, f, args) {
    var vec__13397__13398 = p__13396;
    var k__13399 = cljs.core.nth.call(null, vec__13397__13398, 0, null);
    var ks__13400 = cljs.core.nthnext.call(null, vec__13397__13398, 1);
    if(cljs.core.truth_(ks__13400)) {
      return cljs.core.assoc.call(null, m, k__13399, cljs.core.apply.call(null, update_in, cljs.core.get.call(null, m, k__13399), ks__13400, f, args))
    }else {
      return cljs.core.assoc.call(null, m, k__13399, cljs.core.apply.call(null, f, cljs.core.get.call(null, m, k__13399), args))
    }
  };
  var update_in = function(m, p__13396, f, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
    }
    return update_in__delegate.call(this, m, p__13396, f, args)
  };
  update_in.cljs$lang$maxFixedArity = 3;
  update_in.cljs$lang$applyTo = function(arglist__13401) {
    var m = cljs.core.first(arglist__13401);
    var p__13396 = cljs.core.first(cljs.core.next(arglist__13401));
    var f = cljs.core.first(cljs.core.next(cljs.core.next(arglist__13401)));
    var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__13401)));
    return update_in__delegate.call(this, m, p__13396, f, args)
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
  var this__13402 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.Vector.prototype.cljs$core$ILookup$ = true;
cljs.core.Vector.prototype.cljs$core$ILookup$_lookup = function() {
  var G__13435 = null;
  var G__13435__13436 = function(coll, k) {
    var this__13403 = this;
    return cljs.core._nth.call(null, coll, k, null)
  };
  var G__13435__13437 = function(coll, k, not_found) {
    var this__13404 = this;
    return cljs.core._nth.call(null, coll, k, not_found)
  };
  G__13435 = function(coll, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__13435__13436.call(this, coll, k);
      case 3:
        return G__13435__13437.call(this, coll, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__13435
}();
cljs.core.Vector.prototype.cljs$core$IAssociative$ = true;
cljs.core.Vector.prototype.cljs$core$IAssociative$_assoc = function(coll, k, v) {
  var this__13405 = this;
  var new_array__13406 = cljs.core.aclone.call(null, this__13405.array);
  new_array__13406[k] = v;
  return new cljs.core.Vector(this__13405.meta, new_array__13406)
};
cljs.core.Vector.prototype.cljs$core$IFn$ = true;
cljs.core.Vector.prototype.call = function() {
  var G__13439 = null;
  var G__13439__13440 = function(tsym13407, k) {
    var this__13409 = this;
    var tsym13407__13410 = this;
    var coll__13411 = tsym13407__13410;
    return cljs.core._lookup.call(null, coll__13411, k)
  };
  var G__13439__13441 = function(tsym13408, k, not_found) {
    var this__13412 = this;
    var tsym13408__13413 = this;
    var coll__13414 = tsym13408__13413;
    return cljs.core._lookup.call(null, coll__13414, k, not_found)
  };
  G__13439 = function(tsym13408, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__13439__13440.call(this, tsym13408, k);
      case 3:
        return G__13439__13441.call(this, tsym13408, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__13439
}();
cljs.core.Vector.prototype.cljs$core$ISequential$ = true;
cljs.core.Vector.prototype.cljs$core$ICollection$ = true;
cljs.core.Vector.prototype.cljs$core$ICollection$_conj = function(coll, o) {
  var this__13415 = this;
  var new_array__13416 = cljs.core.aclone.call(null, this__13415.array);
  new_array__13416.push(o);
  return new cljs.core.Vector(this__13415.meta, new_array__13416)
};
cljs.core.Vector.prototype.cljs$core$IReduce$ = true;
cljs.core.Vector.prototype.cljs$core$IReduce$_reduce = function() {
  var G__13443 = null;
  var G__13443__13444 = function(v, f) {
    var this__13417 = this;
    return cljs.core.ci_reduce.call(null, this__13417.array, f)
  };
  var G__13443__13445 = function(v, f, start) {
    var this__13418 = this;
    return cljs.core.ci_reduce.call(null, this__13418.array, f, start)
  };
  G__13443 = function(v, f, start) {
    switch(arguments.length) {
      case 2:
        return G__13443__13444.call(this, v, f);
      case 3:
        return G__13443__13445.call(this, v, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__13443
}();
cljs.core.Vector.prototype.cljs$core$ISeqable$ = true;
cljs.core.Vector.prototype.cljs$core$ISeqable$_seq = function(coll) {
  var this__13419 = this;
  if(cljs.core.truth_(this__13419.array.length > 0)) {
    var vector_seq__13420 = function vector_seq(i) {
      return new cljs.core.LazySeq(null, false, function() {
        if(cljs.core.truth_(i < this__13419.array.length)) {
          return cljs.core.cons.call(null, this__13419.array[i], vector_seq.call(null, i + 1))
        }else {
          return null
        }
      })
    };
    return vector_seq__13420.call(null, 0)
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$ICounted$ = true;
cljs.core.Vector.prototype.cljs$core$ICounted$_count = function(coll) {
  var this__13421 = this;
  return this__13421.array.length
};
cljs.core.Vector.prototype.cljs$core$IStack$ = true;
cljs.core.Vector.prototype.cljs$core$IStack$_peek = function(coll) {
  var this__13422 = this;
  var count__13423 = this__13422.array.length;
  if(cljs.core.truth_(count__13423 > 0)) {
    return this__13422.array[count__13423 - 1]
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$IStack$_pop = function(coll) {
  var this__13424 = this;
  if(cljs.core.truth_(this__13424.array.length > 0)) {
    var new_array__13425 = cljs.core.aclone.call(null, this__13424.array);
    new_array__13425.pop();
    return new cljs.core.Vector(this__13424.meta, new_array__13425)
  }else {
    throw new Error("Can't pop empty vector");
  }
};
cljs.core.Vector.prototype.cljs$core$IVector$ = true;
cljs.core.Vector.prototype.cljs$core$IVector$_assoc_n = function(coll, n, val) {
  var this__13426 = this;
  return cljs.core._assoc.call(null, coll, n, val)
};
cljs.core.Vector.prototype.cljs$core$IEquiv$ = true;
cljs.core.Vector.prototype.cljs$core$IEquiv$_equiv = function(coll, other) {
  var this__13427 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Vector.prototype.cljs$core$IWithMeta$ = true;
cljs.core.Vector.prototype.cljs$core$IWithMeta$_with_meta = function(coll, meta) {
  var this__13428 = this;
  return new cljs.core.Vector(meta, this__13428.array)
};
cljs.core.Vector.prototype.cljs$core$IMeta$ = true;
cljs.core.Vector.prototype.cljs$core$IMeta$_meta = function(coll) {
  var this__13429 = this;
  return this__13429.meta
};
cljs.core.Vector.prototype.cljs$core$IIndexed$ = true;
cljs.core.Vector.prototype.cljs$core$IIndexed$_nth = function() {
  var G__13447 = null;
  var G__13447__13448 = function(coll, n) {
    var this__13430 = this;
    if(cljs.core.truth_(function() {
      var and__3822__auto____13431 = 0 <= n;
      if(cljs.core.truth_(and__3822__auto____13431)) {
        return n < this__13430.array.length
      }else {
        return and__3822__auto____13431
      }
    }())) {
      return this__13430.array[n]
    }else {
      return null
    }
  };
  var G__13447__13449 = function(coll, n, not_found) {
    var this__13432 = this;
    if(cljs.core.truth_(function() {
      var and__3822__auto____13433 = 0 <= n;
      if(cljs.core.truth_(and__3822__auto____13433)) {
        return n < this__13432.array.length
      }else {
        return and__3822__auto____13433
      }
    }())) {
      return this__13432.array[n]
    }else {
      return not_found
    }
  };
  G__13447 = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__13447__13448.call(this, coll, n);
      case 3:
        return G__13447__13449.call(this, coll, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__13447
}();
cljs.core.Vector.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.Vector.prototype.cljs$core$IEmptyableCollection$_empty = function(coll) {
  var this__13434 = this;
  return cljs.core.with_meta.call(null, cljs.core.Vector.EMPTY, this__13434.meta)
};
cljs.core.Vector;
cljs.core.Vector.EMPTY = new cljs.core.Vector(null, []);
cljs.core.Vector.fromArray = function(xs) {
  return new cljs.core.Vector(null, xs)
};
cljs.core.tail_off = function tail_off(pv) {
  var cnt__13451 = pv.cnt;
  if(cljs.core.truth_(cnt__13451 < 32)) {
    return 0
  }else {
    return cnt__13451 - 1 >> 5 << 5
  }
};
cljs.core.new_path = function new_path(level, node) {
  var ll__13452 = level;
  var ret__13453 = node;
  while(true) {
    if(cljs.core.truth_(cljs.core._EQ_.call(null, 0, ll__13452))) {
      return ret__13453
    }else {
      var embed__13454 = ret__13453;
      var r__13455 = cljs.core.aclone.call(null, cljs.core.PersistentVector.EMPTY_NODE);
      var ___13456 = r__13455[0] = embed__13454;
      var G__13457 = ll__13452 - 5;
      var G__13458 = r__13455;
      ll__13452 = G__13457;
      ret__13453 = G__13458;
      continue
    }
    break
  }
};
cljs.core.push_tail = function push_tail(pv, level, parent, tailnode) {
  var ret__13459 = cljs.core.aclone.call(null, parent);
  var subidx__13460 = pv.cnt - 1 >> level & 31;
  if(cljs.core.truth_(cljs.core._EQ_.call(null, 5, level))) {
    ret__13459[subidx__13460] = tailnode;
    return ret__13459
  }else {
    var temp__3971__auto____13461 = parent[subidx__13460];
    if(cljs.core.truth_(temp__3971__auto____13461)) {
      var child__13462 = temp__3971__auto____13461;
      var node_to_insert__13463 = push_tail.call(null, pv, level - 5, child__13462, tailnode);
      var ___13464 = ret__13459[subidx__13460] = node_to_insert__13463;
      return ret__13459
    }else {
      var node_to_insert__13465 = cljs.core.new_path.call(null, level - 5, tailnode);
      var ___13466 = ret__13459[subidx__13460] = node_to_insert__13465;
      return ret__13459
    }
  }
};
cljs.core.array_for = function array_for(pv, i) {
  if(cljs.core.truth_(function() {
    var and__3822__auto____13467 = 0 <= i;
    if(cljs.core.truth_(and__3822__auto____13467)) {
      return i < pv.cnt
    }else {
      return and__3822__auto____13467
    }
  }())) {
    if(cljs.core.truth_(i >= cljs.core.tail_off.call(null, pv))) {
      return pv.tail
    }else {
      var node__13468 = pv.root;
      var level__13469 = pv.shift;
      while(true) {
        if(cljs.core.truth_(level__13469 > 0)) {
          var G__13470 = node__13468[i >> level__13469 & 31];
          var G__13471 = level__13469 - 5;
          node__13468 = G__13470;
          level__13469 = G__13471;
          continue
        }else {
          return node__13468
        }
        break
      }
    }
  }else {
    throw new Error(cljs.core.str.call(null, "No item ", i, " in vector of length ", pv.cnt));
  }
};
cljs.core.do_assoc = function do_assoc(pv, level, node, i, val) {
  var ret__13472 = cljs.core.aclone.call(null, node);
  if(cljs.core.truth_(level === 0)) {
    ret__13472[i & 31] = val;
    return ret__13472
  }else {
    var subidx__13473 = i >> level & 31;
    var ___13474 = ret__13472[subidx__13473] = do_assoc.call(null, pv, level - 5, node[subidx__13473], i, val);
    return ret__13472
  }
};
cljs.core.pop_tail = function pop_tail(pv, level, node) {
  var subidx__13475 = pv.cnt - 2 >> level & 31;
  if(cljs.core.truth_(level > 5)) {
    var new_child__13476 = pop_tail.call(null, pv, level - 5, node[subidx__13475]);
    if(cljs.core.truth_(function() {
      var and__3822__auto____13477 = new_child__13476 === null;
      if(cljs.core.truth_(and__3822__auto____13477)) {
        return subidx__13475 === 0
      }else {
        return and__3822__auto____13477
      }
    }())) {
      return null
    }else {
      var ret__13478 = cljs.core.aclone.call(null, node);
      var ___13479 = ret__13478[subidx__13475] = new_child__13476;
      return ret__13478
    }
  }else {
    if(cljs.core.truth_(subidx__13475 === 0)) {
      return null
    }else {
      if(cljs.core.truth_("\ufdd0'else")) {
        var ret__13480 = cljs.core.aclone.call(null, node);
        var ___13481 = ret__13480[subidx__13475] = null;
        return ret__13480
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
  var this__13482 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.PersistentVector.prototype.cljs$core$ILookup$ = true;
cljs.core.PersistentVector.prototype.cljs$core$ILookup$_lookup = function() {
  var G__13522 = null;
  var G__13522__13523 = function(coll, k) {
    var this__13483 = this;
    return cljs.core._nth.call(null, coll, k, null)
  };
  var G__13522__13524 = function(coll, k, not_found) {
    var this__13484 = this;
    return cljs.core._nth.call(null, coll, k, not_found)
  };
  G__13522 = function(coll, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__13522__13523.call(this, coll, k);
      case 3:
        return G__13522__13524.call(this, coll, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__13522
}();
cljs.core.PersistentVector.prototype.cljs$core$IAssociative$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IAssociative$_assoc = function(coll, k, v) {
  var this__13485 = this;
  if(cljs.core.truth_(function() {
    var and__3822__auto____13486 = 0 <= k;
    if(cljs.core.truth_(and__3822__auto____13486)) {
      return k < this__13485.cnt
    }else {
      return and__3822__auto____13486
    }
  }())) {
    if(cljs.core.truth_(cljs.core.tail_off.call(null, coll) <= k)) {
      var new_tail__13487 = cljs.core.aclone.call(null, this__13485.tail);
      new_tail__13487[k & 31] = v;
      return new cljs.core.PersistentVector(this__13485.meta, this__13485.cnt, this__13485.shift, this__13485.root, new_tail__13487)
    }else {
      return new cljs.core.PersistentVector(this__13485.meta, this__13485.cnt, this__13485.shift, cljs.core.do_assoc.call(null, coll, this__13485.shift, this__13485.root, k, v), this__13485.tail)
    }
  }else {
    if(cljs.core.truth_(cljs.core._EQ_.call(null, k, this__13485.cnt))) {
      return cljs.core._conj.call(null, coll, v)
    }else {
      if(cljs.core.truth_("\ufdd0'else")) {
        throw new Error(cljs.core.str.call(null, "Index ", k, " out of bounds  [0,", this__13485.cnt, "]"));
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IFn$ = true;
cljs.core.PersistentVector.prototype.call = function() {
  var G__13526 = null;
  var G__13526__13527 = function(tsym13488, k) {
    var this__13490 = this;
    var tsym13488__13491 = this;
    var coll__13492 = tsym13488__13491;
    return cljs.core._lookup.call(null, coll__13492, k)
  };
  var G__13526__13528 = function(tsym13489, k, not_found) {
    var this__13493 = this;
    var tsym13489__13494 = this;
    var coll__13495 = tsym13489__13494;
    return cljs.core._lookup.call(null, coll__13495, k, not_found)
  };
  G__13526 = function(tsym13489, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__13526__13527.call(this, tsym13489, k);
      case 3:
        return G__13526__13528.call(this, tsym13489, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__13526
}();
cljs.core.PersistentVector.prototype.cljs$core$ISequential$ = true;
cljs.core.PersistentVector.prototype.cljs$core$ICollection$ = true;
cljs.core.PersistentVector.prototype.cljs$core$ICollection$_conj = function(coll, o) {
  var this__13496 = this;
  if(cljs.core.truth_(this__13496.cnt - cljs.core.tail_off.call(null, coll) < 32)) {
    var new_tail__13497 = cljs.core.aclone.call(null, this__13496.tail);
    new_tail__13497.push(o);
    return new cljs.core.PersistentVector(this__13496.meta, this__13496.cnt + 1, this__13496.shift, this__13496.root, new_tail__13497)
  }else {
    var root_overflow_QMARK___13498 = this__13496.cnt >> 5 > 1 << this__13496.shift;
    var new_shift__13499 = cljs.core.truth_(root_overflow_QMARK___13498) ? this__13496.shift + 5 : this__13496.shift;
    var new_root__13501 = cljs.core.truth_(root_overflow_QMARK___13498) ? function() {
      var n_r__13500 = cljs.core.aclone.call(null, cljs.core.PersistentVector.EMPTY_NODE);
      n_r__13500[0] = this__13496.root;
      n_r__13500[1] = cljs.core.new_path.call(null, this__13496.shift, this__13496.tail);
      return n_r__13500
    }() : cljs.core.push_tail.call(null, coll, this__13496.shift, this__13496.root, this__13496.tail);
    return new cljs.core.PersistentVector(this__13496.meta, this__13496.cnt + 1, new_shift__13499, new_root__13501, [o])
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IReduce$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IReduce$_reduce = function() {
  var G__13530 = null;
  var G__13530__13531 = function(v, f) {
    var this__13502 = this;
    return cljs.core.ci_reduce.call(null, v, f)
  };
  var G__13530__13532 = function(v, f, start) {
    var this__13503 = this;
    return cljs.core.ci_reduce.call(null, v, f, start)
  };
  G__13530 = function(v, f, start) {
    switch(arguments.length) {
      case 2:
        return G__13530__13531.call(this, v, f);
      case 3:
        return G__13530__13532.call(this, v, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__13530
}();
cljs.core.PersistentVector.prototype.cljs$core$ISeqable$ = true;
cljs.core.PersistentVector.prototype.cljs$core$ISeqable$_seq = function(coll) {
  var this__13504 = this;
  if(cljs.core.truth_(this__13504.cnt > 0)) {
    var vector_seq__13505 = function vector_seq(i) {
      return new cljs.core.LazySeq(null, false, function() {
        if(cljs.core.truth_(i < this__13504.cnt)) {
          return cljs.core.cons.call(null, cljs.core._nth.call(null, coll, i), vector_seq.call(null, i + 1))
        }else {
          return null
        }
      })
    };
    return vector_seq__13505.call(null, 0)
  }else {
    return null
  }
};
cljs.core.PersistentVector.prototype.cljs$core$ICounted$ = true;
cljs.core.PersistentVector.prototype.cljs$core$ICounted$_count = function(coll) {
  var this__13506 = this;
  return this__13506.cnt
};
cljs.core.PersistentVector.prototype.cljs$core$IStack$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IStack$_peek = function(coll) {
  var this__13507 = this;
  if(cljs.core.truth_(this__13507.cnt > 0)) {
    return cljs.core._nth.call(null, coll, this__13507.cnt - 1)
  }else {
    return null
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IStack$_pop = function(coll) {
  var this__13508 = this;
  if(cljs.core.truth_(this__13508.cnt === 0)) {
    throw new Error("Can't pop empty vector");
  }else {
    if(cljs.core.truth_(cljs.core._EQ_.call(null, 1, this__13508.cnt))) {
      return cljs.core._with_meta.call(null, cljs.core.PersistentVector.EMPTY, this__13508.meta)
    }else {
      if(cljs.core.truth_(1 < this__13508.cnt - cljs.core.tail_off.call(null, coll))) {
        return new cljs.core.PersistentVector(this__13508.meta, this__13508.cnt - 1, this__13508.shift, this__13508.root, cljs.core.aclone.call(null, this__13508.tail))
      }else {
        if(cljs.core.truth_("\ufdd0'else")) {
          var new_tail__13509 = cljs.core.array_for.call(null, coll, this__13508.cnt - 2);
          var nr__13510 = cljs.core.pop_tail.call(null, this__13508.shift, this__13508.root);
          var new_root__13511 = cljs.core.truth_(nr__13510 === null) ? cljs.core.PersistentVector.EMPTY_NODE : nr__13510;
          var cnt_1__13512 = this__13508.cnt - 1;
          if(cljs.core.truth_(function() {
            var and__3822__auto____13513 = 5 < this__13508.shift;
            if(cljs.core.truth_(and__3822__auto____13513)) {
              return new_root__13511[1] === null
            }else {
              return and__3822__auto____13513
            }
          }())) {
            return new cljs.core.PersistentVector(this__13508.meta, cnt_1__13512, this__13508.shift - 5, new_root__13511[0], new_tail__13509)
          }else {
            return new cljs.core.PersistentVector(this__13508.meta, cnt_1__13512, this__13508.shift, new_root__13511, new_tail__13509)
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
  var this__13514 = this;
  return cljs.core._assoc.call(null, coll, n, val)
};
cljs.core.PersistentVector.prototype.cljs$core$IEquiv$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IEquiv$_equiv = function(coll, other) {
  var this__13515 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentVector.prototype.cljs$core$IWithMeta$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IWithMeta$_with_meta = function(coll, meta) {
  var this__13516 = this;
  return new cljs.core.PersistentVector(meta, this__13516.cnt, this__13516.shift, this__13516.root, this__13516.tail)
};
cljs.core.PersistentVector.prototype.cljs$core$IMeta$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IMeta$_meta = function(coll) {
  var this__13517 = this;
  return this__13517.meta
};
cljs.core.PersistentVector.prototype.cljs$core$IIndexed$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IIndexed$_nth = function() {
  var G__13534 = null;
  var G__13534__13535 = function(coll, n) {
    var this__13518 = this;
    return cljs.core.array_for.call(null, coll, n)[n & 31]
  };
  var G__13534__13536 = function(coll, n, not_found) {
    var this__13519 = this;
    if(cljs.core.truth_(function() {
      var and__3822__auto____13520 = 0 <= n;
      if(cljs.core.truth_(and__3822__auto____13520)) {
        return n < this__13519.cnt
      }else {
        return and__3822__auto____13520
      }
    }())) {
      return cljs.core._nth.call(null, coll, n)
    }else {
      return not_found
    }
  };
  G__13534 = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__13534__13535.call(this, coll, n);
      case 3:
        return G__13534__13536.call(this, coll, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__13534
}();
cljs.core.PersistentVector.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IEmptyableCollection$_empty = function(coll) {
  var this__13521 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.EMPTY, this__13521.meta)
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
  vector.cljs$lang$applyTo = function(arglist__13538) {
    var args = cljs.core.seq(arglist__13538);
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
  var this__13539 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.Subvec.prototype.cljs$core$ILookup$ = true;
cljs.core.Subvec.prototype.cljs$core$ILookup$_lookup = function() {
  var G__13567 = null;
  var G__13567__13568 = function(coll, k) {
    var this__13540 = this;
    return cljs.core._nth.call(null, coll, k, null)
  };
  var G__13567__13569 = function(coll, k, not_found) {
    var this__13541 = this;
    return cljs.core._nth.call(null, coll, k, not_found)
  };
  G__13567 = function(coll, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__13567__13568.call(this, coll, k);
      case 3:
        return G__13567__13569.call(this, coll, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__13567
}();
cljs.core.Subvec.prototype.cljs$core$IAssociative$ = true;
cljs.core.Subvec.prototype.cljs$core$IAssociative$_assoc = function(coll, key, val) {
  var this__13542 = this;
  var v_pos__13543 = this__13542.start + key;
  return new cljs.core.Subvec(this__13542.meta, cljs.core._assoc.call(null, this__13542.v, v_pos__13543, val), this__13542.start, this__13542.end > v_pos__13543 + 1 ? this__13542.end : v_pos__13543 + 1)
};
cljs.core.Subvec.prototype.cljs$core$IFn$ = true;
cljs.core.Subvec.prototype.call = function() {
  var G__13571 = null;
  var G__13571__13572 = function(tsym13544, k) {
    var this__13546 = this;
    var tsym13544__13547 = this;
    var coll__13548 = tsym13544__13547;
    return cljs.core._lookup.call(null, coll__13548, k)
  };
  var G__13571__13573 = function(tsym13545, k, not_found) {
    var this__13549 = this;
    var tsym13545__13550 = this;
    var coll__13551 = tsym13545__13550;
    return cljs.core._lookup.call(null, coll__13551, k, not_found)
  };
  G__13571 = function(tsym13545, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__13571__13572.call(this, tsym13545, k);
      case 3:
        return G__13571__13573.call(this, tsym13545, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__13571
}();
cljs.core.Subvec.prototype.cljs$core$ISequential$ = true;
cljs.core.Subvec.prototype.cljs$core$ICollection$ = true;
cljs.core.Subvec.prototype.cljs$core$ICollection$_conj = function(coll, o) {
  var this__13552 = this;
  return new cljs.core.Subvec(this__13552.meta, cljs.core._assoc_n.call(null, this__13552.v, this__13552.end, o), this__13552.start, this__13552.end + 1)
};
cljs.core.Subvec.prototype.cljs$core$IReduce$ = true;
cljs.core.Subvec.prototype.cljs$core$IReduce$_reduce = function() {
  var G__13575 = null;
  var G__13575__13576 = function(coll, f) {
    var this__13553 = this;
    return cljs.core.ci_reduce.call(null, coll, f)
  };
  var G__13575__13577 = function(coll, f, start) {
    var this__13554 = this;
    return cljs.core.ci_reduce.call(null, coll, f, start)
  };
  G__13575 = function(coll, f, start) {
    switch(arguments.length) {
      case 2:
        return G__13575__13576.call(this, coll, f);
      case 3:
        return G__13575__13577.call(this, coll, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__13575
}();
cljs.core.Subvec.prototype.cljs$core$ISeqable$ = true;
cljs.core.Subvec.prototype.cljs$core$ISeqable$_seq = function(coll) {
  var this__13555 = this;
  var subvec_seq__13556 = function subvec_seq(i) {
    if(cljs.core.truth_(cljs.core._EQ_.call(null, i, this__13555.end))) {
      return null
    }else {
      return cljs.core.cons.call(null, cljs.core._nth.call(null, this__13555.v, i), new cljs.core.LazySeq(null, false, function() {
        return subvec_seq.call(null, i + 1)
      }))
    }
  };
  return subvec_seq__13556.call(null, this__13555.start)
};
cljs.core.Subvec.prototype.cljs$core$ICounted$ = true;
cljs.core.Subvec.prototype.cljs$core$ICounted$_count = function(coll) {
  var this__13557 = this;
  return this__13557.end - this__13557.start
};
cljs.core.Subvec.prototype.cljs$core$IStack$ = true;
cljs.core.Subvec.prototype.cljs$core$IStack$_peek = function(coll) {
  var this__13558 = this;
  return cljs.core._nth.call(null, this__13558.v, this__13558.end - 1)
};
cljs.core.Subvec.prototype.cljs$core$IStack$_pop = function(coll) {
  var this__13559 = this;
  if(cljs.core.truth_(cljs.core._EQ_.call(null, this__13559.start, this__13559.end))) {
    throw new Error("Can't pop empty vector");
  }else {
    return new cljs.core.Subvec(this__13559.meta, this__13559.v, this__13559.start, this__13559.end - 1)
  }
};
cljs.core.Subvec.prototype.cljs$core$IVector$ = true;
cljs.core.Subvec.prototype.cljs$core$IVector$_assoc_n = function(coll, n, val) {
  var this__13560 = this;
  return cljs.core._assoc.call(null, coll, n, val)
};
cljs.core.Subvec.prototype.cljs$core$IEquiv$ = true;
cljs.core.Subvec.prototype.cljs$core$IEquiv$_equiv = function(coll, other) {
  var this__13561 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Subvec.prototype.cljs$core$IWithMeta$ = true;
cljs.core.Subvec.prototype.cljs$core$IWithMeta$_with_meta = function(coll, meta) {
  var this__13562 = this;
  return new cljs.core.Subvec(meta, this__13562.v, this__13562.start, this__13562.end)
};
cljs.core.Subvec.prototype.cljs$core$IMeta$ = true;
cljs.core.Subvec.prototype.cljs$core$IMeta$_meta = function(coll) {
  var this__13563 = this;
  return this__13563.meta
};
cljs.core.Subvec.prototype.cljs$core$IIndexed$ = true;
cljs.core.Subvec.prototype.cljs$core$IIndexed$_nth = function() {
  var G__13579 = null;
  var G__13579__13580 = function(coll, n) {
    var this__13564 = this;
    return cljs.core._nth.call(null, this__13564.v, this__13564.start + n)
  };
  var G__13579__13581 = function(coll, n, not_found) {
    var this__13565 = this;
    return cljs.core._nth.call(null, this__13565.v, this__13565.start + n, not_found)
  };
  G__13579 = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__13579__13580.call(this, coll, n);
      case 3:
        return G__13579__13581.call(this, coll, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__13579
}();
cljs.core.Subvec.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.Subvec.prototype.cljs$core$IEmptyableCollection$_empty = function(coll) {
  var this__13566 = this;
  return cljs.core.with_meta.call(null, cljs.core.Vector.EMPTY, this__13566.meta)
};
cljs.core.Subvec;
cljs.core.subvec = function() {
  var subvec = null;
  var subvec__13583 = function(v, start) {
    return subvec.call(null, v, start, cljs.core.count.call(null, v))
  };
  var subvec__13584 = function(v, start, end) {
    return new cljs.core.Subvec(null, v, start, end)
  };
  subvec = function(v, start, end) {
    switch(arguments.length) {
      case 2:
        return subvec__13583.call(this, v, start);
      case 3:
        return subvec__13584.call(this, v, start, end)
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
  var this__13586 = this;
  return coll
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IHash$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$IHash$_hash = function(coll) {
  var this__13587 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEquiv$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEquiv$_equiv = function(coll, other) {
  var this__13588 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISequential$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEmptyableCollection$_empty = function(coll) {
  var this__13589 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__13589.meta)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ICollection$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$ICollection$_conj = function(coll, o) {
  var this__13590 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeq$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeq$_first = function(coll) {
  var this__13591 = this;
  return cljs.core._first.call(null, this__13591.front)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeq$_rest = function(coll) {
  var this__13592 = this;
  var temp__3971__auto____13593 = cljs.core.next.call(null, this__13592.front);
  if(cljs.core.truth_(temp__3971__auto____13593)) {
    var f1__13594 = temp__3971__auto____13593;
    return new cljs.core.PersistentQueueSeq(this__13592.meta, f1__13594, this__13592.rear)
  }else {
    if(cljs.core.truth_(this__13592.rear === null)) {
      return cljs.core._empty.call(null, coll)
    }else {
      return new cljs.core.PersistentQueueSeq(this__13592.meta, this__13592.rear, null)
    }
  }
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IMeta$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$IMeta$_meta = function(coll) {
  var this__13595 = this;
  return this__13595.meta
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IWithMeta$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$IWithMeta$_with_meta = function(coll, meta) {
  var this__13596 = this;
  return new cljs.core.PersistentQueueSeq(meta, this__13596.front, this__13596.rear)
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
  var this__13597 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.PersistentQueue.prototype.cljs$core$ISequential$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$ICollection$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$ICollection$_conj = function(coll, o) {
  var this__13598 = this;
  if(cljs.core.truth_(this__13598.front)) {
    return new cljs.core.PersistentQueue(this__13598.meta, this__13598.count + 1, this__13598.front, cljs.core.conj.call(null, function() {
      var or__3824__auto____13599 = this__13598.rear;
      if(cljs.core.truth_(or__3824__auto____13599)) {
        return or__3824__auto____13599
      }else {
        return cljs.core.PersistentVector.fromArray([])
      }
    }(), o))
  }else {
    return new cljs.core.PersistentQueue(this__13598.meta, this__13598.count + 1, cljs.core.conj.call(null, this__13598.front, o), cljs.core.PersistentVector.fromArray([]))
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeqable$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$ISeqable$_seq = function(coll) {
  var this__13600 = this;
  var rear__13601 = cljs.core.seq.call(null, this__13600.rear);
  if(cljs.core.truth_(function() {
    var or__3824__auto____13602 = this__13600.front;
    if(cljs.core.truth_(or__3824__auto____13602)) {
      return or__3824__auto____13602
    }else {
      return rear__13601
    }
  }())) {
    return new cljs.core.PersistentQueueSeq(null, this__13600.front, cljs.core.seq.call(null, rear__13601))
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ICounted$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$ICounted$_count = function(coll) {
  var this__13603 = this;
  return this__13603.count
};
cljs.core.PersistentQueue.prototype.cljs$core$IStack$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IStack$_peek = function(coll) {
  var this__13604 = this;
  return cljs.core._first.call(null, this__13604.front)
};
cljs.core.PersistentQueue.prototype.cljs$core$IStack$_pop = function(coll) {
  var this__13605 = this;
  if(cljs.core.truth_(this__13605.front)) {
    var temp__3971__auto____13606 = cljs.core.next.call(null, this__13605.front);
    if(cljs.core.truth_(temp__3971__auto____13606)) {
      var f1__13607 = temp__3971__auto____13606;
      return new cljs.core.PersistentQueue(this__13605.meta, this__13605.count - 1, f1__13607, this__13605.rear)
    }else {
      return new cljs.core.PersistentQueue(this__13605.meta, this__13605.count - 1, cljs.core.seq.call(null, this__13605.rear), cljs.core.PersistentVector.fromArray([]))
    }
  }else {
    return coll
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeq$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$ISeq$_first = function(coll) {
  var this__13608 = this;
  return cljs.core.first.call(null, this__13608.front)
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeq$_rest = function(coll) {
  var this__13609 = this;
  return cljs.core.rest.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.PersistentQueue.prototype.cljs$core$IEquiv$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IEquiv$_equiv = function(coll, other) {
  var this__13610 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentQueue.prototype.cljs$core$IWithMeta$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IWithMeta$_with_meta = function(coll, meta) {
  var this__13611 = this;
  return new cljs.core.PersistentQueue(meta, this__13611.count, this__13611.front, this__13611.rear)
};
cljs.core.PersistentQueue.prototype.cljs$core$IMeta$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IMeta$_meta = function(coll) {
  var this__13612 = this;
  return this__13612.meta
};
cljs.core.PersistentQueue.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IEmptyableCollection$_empty = function(coll) {
  var this__13613 = this;
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
  var this__13614 = this;
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
  var len__13615 = array.length;
  var i__13616 = 0;
  while(true) {
    if(cljs.core.truth_(i__13616 < len__13615)) {
      if(cljs.core.truth_(cljs.core._EQ_.call(null, k, array[i__13616]))) {
        return i__13616
      }else {
        var G__13617 = i__13616 + incr;
        i__13616 = G__13617;
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
  var obj_map_contains_key_QMARK___13619 = function(k, strobj) {
    return obj_map_contains_key_QMARK_.call(null, k, strobj, true, false)
  };
  var obj_map_contains_key_QMARK___13620 = function(k, strobj, true_val, false_val) {
    if(cljs.core.truth_(function() {
      var and__3822__auto____13618 = goog.isString.call(null, k);
      if(cljs.core.truth_(and__3822__auto____13618)) {
        return strobj.hasOwnProperty(k)
      }else {
        return and__3822__auto____13618
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
        return obj_map_contains_key_QMARK___13619.call(this, k, strobj);
      case 4:
        return obj_map_contains_key_QMARK___13620.call(this, k, strobj, true_val, false_val)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return obj_map_contains_key_QMARK_
}();
cljs.core.obj_map_compare_keys = function obj_map_compare_keys(a, b) {
  var a__13623 = cljs.core.hash.call(null, a);
  var b__13624 = cljs.core.hash.call(null, b);
  if(cljs.core.truth_(a__13623 < b__13624)) {
    return-1
  }else {
    if(cljs.core.truth_(a__13623 > b__13624)) {
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
  var this__13625 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.ObjMap.prototype.cljs$core$ILookup$ = true;
cljs.core.ObjMap.prototype.cljs$core$ILookup$_lookup = function() {
  var G__13652 = null;
  var G__13652__13653 = function(coll, k) {
    var this__13626 = this;
    return cljs.core._lookup.call(null, coll, k, null)
  };
  var G__13652__13654 = function(coll, k, not_found) {
    var this__13627 = this;
    return cljs.core.obj_map_contains_key_QMARK_.call(null, k, this__13627.strobj, this__13627.strobj[k], not_found)
  };
  G__13652 = function(coll, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__13652__13653.call(this, coll, k);
      case 3:
        return G__13652__13654.call(this, coll, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__13652
}();
cljs.core.ObjMap.prototype.cljs$core$IAssociative$ = true;
cljs.core.ObjMap.prototype.cljs$core$IAssociative$_assoc = function(coll, k, v) {
  var this__13628 = this;
  if(cljs.core.truth_(goog.isString.call(null, k))) {
    var new_strobj__13629 = goog.object.clone.call(null, this__13628.strobj);
    var overwrite_QMARK___13630 = new_strobj__13629.hasOwnProperty(k);
    new_strobj__13629[k] = v;
    if(cljs.core.truth_(overwrite_QMARK___13630)) {
      return new cljs.core.ObjMap(this__13628.meta, this__13628.keys, new_strobj__13629)
    }else {
      var new_keys__13631 = cljs.core.aclone.call(null, this__13628.keys);
      new_keys__13631.push(k);
      return new cljs.core.ObjMap(this__13628.meta, new_keys__13631, new_strobj__13629)
    }
  }else {
    return cljs.core.with_meta.call(null, cljs.core.into.call(null, cljs.core.hash_map.call(null, k, v), cljs.core.seq.call(null, coll)), this__13628.meta)
  }
};
cljs.core.ObjMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_ = function(coll, k) {
  var this__13632 = this;
  return cljs.core.obj_map_contains_key_QMARK_.call(null, k, this__13632.strobj)
};
cljs.core.ObjMap.prototype.cljs$core$IFn$ = true;
cljs.core.ObjMap.prototype.call = function() {
  var G__13656 = null;
  var G__13656__13657 = function(tsym13633, k) {
    var this__13635 = this;
    var tsym13633__13636 = this;
    var coll__13637 = tsym13633__13636;
    return cljs.core._lookup.call(null, coll__13637, k)
  };
  var G__13656__13658 = function(tsym13634, k, not_found) {
    var this__13638 = this;
    var tsym13634__13639 = this;
    var coll__13640 = tsym13634__13639;
    return cljs.core._lookup.call(null, coll__13640, k, not_found)
  };
  G__13656 = function(tsym13634, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__13656__13657.call(this, tsym13634, k);
      case 3:
        return G__13656__13658.call(this, tsym13634, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__13656
}();
cljs.core.ObjMap.prototype.cljs$core$ICollection$ = true;
cljs.core.ObjMap.prototype.cljs$core$ICollection$_conj = function(coll, entry) {
  var this__13641 = this;
  if(cljs.core.truth_(cljs.core.vector_QMARK_.call(null, entry))) {
    return cljs.core._assoc.call(null, coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.ObjMap.prototype.cljs$core$ISeqable$ = true;
cljs.core.ObjMap.prototype.cljs$core$ISeqable$_seq = function(coll) {
  var this__13642 = this;
  if(cljs.core.truth_(this__13642.keys.length > 0)) {
    return cljs.core.map.call(null, function(p1__13622_SHARP_) {
      return cljs.core.vector.call(null, p1__13622_SHARP_, this__13642.strobj[p1__13622_SHARP_])
    }, this__13642.keys.sort(cljs.core.obj_map_compare_keys))
  }else {
    return null
  }
};
cljs.core.ObjMap.prototype.cljs$core$ICounted$ = true;
cljs.core.ObjMap.prototype.cljs$core$ICounted$_count = function(coll) {
  var this__13643 = this;
  return this__13643.keys.length
};
cljs.core.ObjMap.prototype.cljs$core$IEquiv$ = true;
cljs.core.ObjMap.prototype.cljs$core$IEquiv$_equiv = function(coll, other) {
  var this__13644 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.ObjMap.prototype.cljs$core$IWithMeta$ = true;
cljs.core.ObjMap.prototype.cljs$core$IWithMeta$_with_meta = function(coll, meta) {
  var this__13645 = this;
  return new cljs.core.ObjMap(meta, this__13645.keys, this__13645.strobj)
};
cljs.core.ObjMap.prototype.cljs$core$IMeta$ = true;
cljs.core.ObjMap.prototype.cljs$core$IMeta$_meta = function(coll) {
  var this__13646 = this;
  return this__13646.meta
};
cljs.core.ObjMap.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.ObjMap.prototype.cljs$core$IEmptyableCollection$_empty = function(coll) {
  var this__13647 = this;
  return cljs.core.with_meta.call(null, cljs.core.ObjMap.EMPTY, this__13647.meta)
};
cljs.core.ObjMap.prototype.cljs$core$IMap$ = true;
cljs.core.ObjMap.prototype.cljs$core$IMap$_dissoc = function(coll, k) {
  var this__13648 = this;
  if(cljs.core.truth_(function() {
    var and__3822__auto____13649 = goog.isString.call(null, k);
    if(cljs.core.truth_(and__3822__auto____13649)) {
      return this__13648.strobj.hasOwnProperty(k)
    }else {
      return and__3822__auto____13649
    }
  }())) {
    var new_keys__13650 = cljs.core.aclone.call(null, this__13648.keys);
    var new_strobj__13651 = goog.object.clone.call(null, this__13648.strobj);
    new_keys__13650.splice(cljs.core.scan_array.call(null, 1, k, new_keys__13650), 1);
    cljs.core.js_delete.call(null, new_strobj__13651, k);
    return new cljs.core.ObjMap(this__13648.meta, new_keys__13650, new_strobj__13651)
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
  var this__13661 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.HashMap.prototype.cljs$core$ILookup$ = true;
cljs.core.HashMap.prototype.cljs$core$ILookup$_lookup = function() {
  var G__13699 = null;
  var G__13699__13700 = function(coll, k) {
    var this__13662 = this;
    return cljs.core._lookup.call(null, coll, k, null)
  };
  var G__13699__13701 = function(coll, k, not_found) {
    var this__13663 = this;
    var bucket__13664 = this__13663.hashobj[cljs.core.hash.call(null, k)];
    var i__13665 = cljs.core.truth_(bucket__13664) ? cljs.core.scan_array.call(null, 2, k, bucket__13664) : null;
    if(cljs.core.truth_(i__13665)) {
      return bucket__13664[i__13665 + 1]
    }else {
      return not_found
    }
  };
  G__13699 = function(coll, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__13699__13700.call(this, coll, k);
      case 3:
        return G__13699__13701.call(this, coll, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__13699
}();
cljs.core.HashMap.prototype.cljs$core$IAssociative$ = true;
cljs.core.HashMap.prototype.cljs$core$IAssociative$_assoc = function(coll, k, v) {
  var this__13666 = this;
  var h__13667 = cljs.core.hash.call(null, k);
  var bucket__13668 = this__13666.hashobj[h__13667];
  if(cljs.core.truth_(bucket__13668)) {
    var new_bucket__13669 = cljs.core.aclone.call(null, bucket__13668);
    var new_hashobj__13670 = goog.object.clone.call(null, this__13666.hashobj);
    new_hashobj__13670[h__13667] = new_bucket__13669;
    var temp__3971__auto____13671 = cljs.core.scan_array.call(null, 2, k, new_bucket__13669);
    if(cljs.core.truth_(temp__3971__auto____13671)) {
      var i__13672 = temp__3971__auto____13671;
      new_bucket__13669[i__13672 + 1] = v;
      return new cljs.core.HashMap(this__13666.meta, this__13666.count, new_hashobj__13670)
    }else {
      new_bucket__13669.push(k, v);
      return new cljs.core.HashMap(this__13666.meta, this__13666.count + 1, new_hashobj__13670)
    }
  }else {
    var new_hashobj__13673 = goog.object.clone.call(null, this__13666.hashobj);
    new_hashobj__13673[h__13667] = [k, v];
    return new cljs.core.HashMap(this__13666.meta, this__13666.count + 1, new_hashobj__13673)
  }
};
cljs.core.HashMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_ = function(coll, k) {
  var this__13674 = this;
  var bucket__13675 = this__13674.hashobj[cljs.core.hash.call(null, k)];
  var i__13676 = cljs.core.truth_(bucket__13675) ? cljs.core.scan_array.call(null, 2, k, bucket__13675) : null;
  if(cljs.core.truth_(i__13676)) {
    return true
  }else {
    return false
  }
};
cljs.core.HashMap.prototype.cljs$core$IFn$ = true;
cljs.core.HashMap.prototype.call = function() {
  var G__13703 = null;
  var G__13703__13704 = function(tsym13677, k) {
    var this__13679 = this;
    var tsym13677__13680 = this;
    var coll__13681 = tsym13677__13680;
    return cljs.core._lookup.call(null, coll__13681, k)
  };
  var G__13703__13705 = function(tsym13678, k, not_found) {
    var this__13682 = this;
    var tsym13678__13683 = this;
    var coll__13684 = tsym13678__13683;
    return cljs.core._lookup.call(null, coll__13684, k, not_found)
  };
  G__13703 = function(tsym13678, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__13703__13704.call(this, tsym13678, k);
      case 3:
        return G__13703__13705.call(this, tsym13678, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__13703
}();
cljs.core.HashMap.prototype.cljs$core$ICollection$ = true;
cljs.core.HashMap.prototype.cljs$core$ICollection$_conj = function(coll, entry) {
  var this__13685 = this;
  if(cljs.core.truth_(cljs.core.vector_QMARK_.call(null, entry))) {
    return cljs.core._assoc.call(null, coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.HashMap.prototype.cljs$core$ISeqable$ = true;
cljs.core.HashMap.prototype.cljs$core$ISeqable$_seq = function(coll) {
  var this__13686 = this;
  if(cljs.core.truth_(this__13686.count > 0)) {
    var hashes__13687 = cljs.core.js_keys.call(null, this__13686.hashobj).sort();
    return cljs.core.mapcat.call(null, function(p1__13660_SHARP_) {
      return cljs.core.map.call(null, cljs.core.vec, cljs.core.partition.call(null, 2, this__13686.hashobj[p1__13660_SHARP_]))
    }, hashes__13687)
  }else {
    return null
  }
};
cljs.core.HashMap.prototype.cljs$core$ICounted$ = true;
cljs.core.HashMap.prototype.cljs$core$ICounted$_count = function(coll) {
  var this__13688 = this;
  return this__13688.count
};
cljs.core.HashMap.prototype.cljs$core$IEquiv$ = true;
cljs.core.HashMap.prototype.cljs$core$IEquiv$_equiv = function(coll, other) {
  var this__13689 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.HashMap.prototype.cljs$core$IWithMeta$ = true;
cljs.core.HashMap.prototype.cljs$core$IWithMeta$_with_meta = function(coll, meta) {
  var this__13690 = this;
  return new cljs.core.HashMap(meta, this__13690.count, this__13690.hashobj)
};
cljs.core.HashMap.prototype.cljs$core$IMeta$ = true;
cljs.core.HashMap.prototype.cljs$core$IMeta$_meta = function(coll) {
  var this__13691 = this;
  return this__13691.meta
};
cljs.core.HashMap.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.HashMap.prototype.cljs$core$IEmptyableCollection$_empty = function(coll) {
  var this__13692 = this;
  return cljs.core.with_meta.call(null, cljs.core.HashMap.EMPTY, this__13692.meta)
};
cljs.core.HashMap.prototype.cljs$core$IMap$ = true;
cljs.core.HashMap.prototype.cljs$core$IMap$_dissoc = function(coll, k) {
  var this__13693 = this;
  var h__13694 = cljs.core.hash.call(null, k);
  var bucket__13695 = this__13693.hashobj[h__13694];
  var i__13696 = cljs.core.truth_(bucket__13695) ? cljs.core.scan_array.call(null, 2, k, bucket__13695) : null;
  if(cljs.core.truth_(cljs.core.not.call(null, i__13696))) {
    return coll
  }else {
    var new_hashobj__13697 = goog.object.clone.call(null, this__13693.hashobj);
    if(cljs.core.truth_(3 > bucket__13695.length)) {
      cljs.core.js_delete.call(null, new_hashobj__13697, h__13694)
    }else {
      var new_bucket__13698 = cljs.core.aclone.call(null, bucket__13695);
      new_bucket__13698.splice(i__13696, 2);
      new_hashobj__13697[h__13694] = new_bucket__13698
    }
    return new cljs.core.HashMap(this__13693.meta, this__13693.count - 1, new_hashobj__13697)
  }
};
cljs.core.HashMap;
cljs.core.HashMap.EMPTY = new cljs.core.HashMap(null, 0, cljs.core.js_obj.call(null));
cljs.core.HashMap.fromArrays = function(ks, vs) {
  var len__13707 = ks.length;
  var i__13708 = 0;
  var out__13709 = cljs.core.HashMap.EMPTY;
  while(true) {
    if(cljs.core.truth_(i__13708 < len__13707)) {
      var G__13710 = i__13708 + 1;
      var G__13711 = cljs.core.assoc.call(null, out__13709, ks[i__13708], vs[i__13708]);
      i__13708 = G__13710;
      out__13709 = G__13711;
      continue
    }else {
      return out__13709
    }
    break
  }
};
cljs.core.hash_map = function() {
  var hash_map__delegate = function(keyvals) {
    var in$__13712 = cljs.core.seq.call(null, keyvals);
    var out__13713 = cljs.core.HashMap.EMPTY;
    while(true) {
      if(cljs.core.truth_(in$__13712)) {
        var G__13714 = cljs.core.nnext.call(null, in$__13712);
        var G__13715 = cljs.core.assoc.call(null, out__13713, cljs.core.first.call(null, in$__13712), cljs.core.second.call(null, in$__13712));
        in$__13712 = G__13714;
        out__13713 = G__13715;
        continue
      }else {
        return out__13713
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
  hash_map.cljs$lang$applyTo = function(arglist__13716) {
    var keyvals = cljs.core.seq(arglist__13716);
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
      return cljs.core.reduce.call(null, function(p1__13717_SHARP_, p2__13718_SHARP_) {
        return cljs.core.conj.call(null, function() {
          var or__3824__auto____13719 = p1__13717_SHARP_;
          if(cljs.core.truth_(or__3824__auto____13719)) {
            return or__3824__auto____13719
          }else {
            return cljs.core.ObjMap.fromObject([], {})
          }
        }(), p2__13718_SHARP_)
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
  merge.cljs$lang$applyTo = function(arglist__13720) {
    var maps = cljs.core.seq(arglist__13720);
    return merge__delegate.call(this, maps)
  };
  return merge
}();
cljs.core.merge_with = function() {
  var merge_with__delegate = function(f, maps) {
    if(cljs.core.truth_(cljs.core.some.call(null, cljs.core.identity, maps))) {
      var merge_entry__13723 = function(m, e) {
        var k__13721 = cljs.core.first.call(null, e);
        var v__13722 = cljs.core.second.call(null, e);
        if(cljs.core.truth_(cljs.core.contains_QMARK_.call(null, m, k__13721))) {
          return cljs.core.assoc.call(null, m, k__13721, f.call(null, cljs.core.get.call(null, m, k__13721), v__13722))
        }else {
          return cljs.core.assoc.call(null, m, k__13721, v__13722)
        }
      };
      var merge2__13725 = function(m1, m2) {
        return cljs.core.reduce.call(null, merge_entry__13723, function() {
          var or__3824__auto____13724 = m1;
          if(cljs.core.truth_(or__3824__auto____13724)) {
            return or__3824__auto____13724
          }else {
            return cljs.core.ObjMap.fromObject([], {})
          }
        }(), cljs.core.seq.call(null, m2))
      };
      return cljs.core.reduce.call(null, merge2__13725, maps)
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
  merge_with.cljs$lang$applyTo = function(arglist__13726) {
    var f = cljs.core.first(arglist__13726);
    var maps = cljs.core.rest(arglist__13726);
    return merge_with__delegate.call(this, f, maps)
  };
  return merge_with
}();
cljs.core.select_keys = function select_keys(map, keyseq) {
  var ret__13728 = cljs.core.ObjMap.fromObject([], {});
  var keys__13729 = cljs.core.seq.call(null, keyseq);
  while(true) {
    if(cljs.core.truth_(keys__13729)) {
      var key__13730 = cljs.core.first.call(null, keys__13729);
      var entry__13731 = cljs.core.get.call(null, map, key__13730, "\ufdd0'user/not-found");
      var G__13732 = cljs.core.truth_(cljs.core.not_EQ_.call(null, entry__13731, "\ufdd0'user/not-found")) ? cljs.core.assoc.call(null, ret__13728, key__13730, entry__13731) : ret__13728;
      var G__13733 = cljs.core.next.call(null, keys__13729);
      ret__13728 = G__13732;
      keys__13729 = G__13733;
      continue
    }else {
      return ret__13728
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
  var this__13734 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.Set.prototype.cljs$core$ILookup$ = true;
cljs.core.Set.prototype.cljs$core$ILookup$_lookup = function() {
  var G__13755 = null;
  var G__13755__13756 = function(coll, v) {
    var this__13735 = this;
    return cljs.core._lookup.call(null, coll, v, null)
  };
  var G__13755__13757 = function(coll, v, not_found) {
    var this__13736 = this;
    if(cljs.core.truth_(cljs.core._contains_key_QMARK_.call(null, this__13736.hash_map, v))) {
      return v
    }else {
      return not_found
    }
  };
  G__13755 = function(coll, v, not_found) {
    switch(arguments.length) {
      case 2:
        return G__13755__13756.call(this, coll, v);
      case 3:
        return G__13755__13757.call(this, coll, v, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__13755
}();
cljs.core.Set.prototype.cljs$core$IFn$ = true;
cljs.core.Set.prototype.call = function() {
  var G__13759 = null;
  var G__13759__13760 = function(tsym13737, k) {
    var this__13739 = this;
    var tsym13737__13740 = this;
    var coll__13741 = tsym13737__13740;
    return cljs.core._lookup.call(null, coll__13741, k)
  };
  var G__13759__13761 = function(tsym13738, k, not_found) {
    var this__13742 = this;
    var tsym13738__13743 = this;
    var coll__13744 = tsym13738__13743;
    return cljs.core._lookup.call(null, coll__13744, k, not_found)
  };
  G__13759 = function(tsym13738, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__13759__13760.call(this, tsym13738, k);
      case 3:
        return G__13759__13761.call(this, tsym13738, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__13759
}();
cljs.core.Set.prototype.cljs$core$ICollection$ = true;
cljs.core.Set.prototype.cljs$core$ICollection$_conj = function(coll, o) {
  var this__13745 = this;
  return new cljs.core.Set(this__13745.meta, cljs.core.assoc.call(null, this__13745.hash_map, o, null))
};
cljs.core.Set.prototype.cljs$core$ISeqable$ = true;
cljs.core.Set.prototype.cljs$core$ISeqable$_seq = function(coll) {
  var this__13746 = this;
  return cljs.core.keys.call(null, this__13746.hash_map)
};
cljs.core.Set.prototype.cljs$core$ISet$ = true;
cljs.core.Set.prototype.cljs$core$ISet$_disjoin = function(coll, v) {
  var this__13747 = this;
  return new cljs.core.Set(this__13747.meta, cljs.core.dissoc.call(null, this__13747.hash_map, v))
};
cljs.core.Set.prototype.cljs$core$ICounted$ = true;
cljs.core.Set.prototype.cljs$core$ICounted$_count = function(coll) {
  var this__13748 = this;
  return cljs.core.count.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.Set.prototype.cljs$core$IEquiv$ = true;
cljs.core.Set.prototype.cljs$core$IEquiv$_equiv = function(coll, other) {
  var this__13749 = this;
  var and__3822__auto____13750 = cljs.core.set_QMARK_.call(null, other);
  if(cljs.core.truth_(and__3822__auto____13750)) {
    var and__3822__auto____13751 = cljs.core._EQ_.call(null, cljs.core.count.call(null, coll), cljs.core.count.call(null, other));
    if(cljs.core.truth_(and__3822__auto____13751)) {
      return cljs.core.every_QMARK_.call(null, function(p1__13727_SHARP_) {
        return cljs.core.contains_QMARK_.call(null, coll, p1__13727_SHARP_)
      }, other)
    }else {
      return and__3822__auto____13751
    }
  }else {
    return and__3822__auto____13750
  }
};
cljs.core.Set.prototype.cljs$core$IWithMeta$ = true;
cljs.core.Set.prototype.cljs$core$IWithMeta$_with_meta = function(coll, meta) {
  var this__13752 = this;
  return new cljs.core.Set(meta, this__13752.hash_map)
};
cljs.core.Set.prototype.cljs$core$IMeta$ = true;
cljs.core.Set.prototype.cljs$core$IMeta$_meta = function(coll) {
  var this__13753 = this;
  return this__13753.meta
};
cljs.core.Set.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.Set.prototype.cljs$core$IEmptyableCollection$_empty = function(coll) {
  var this__13754 = this;
  return cljs.core.with_meta.call(null, cljs.core.Set.EMPTY, this__13754.meta)
};
cljs.core.Set;
cljs.core.Set.EMPTY = new cljs.core.Set(null, cljs.core.hash_map.call(null));
cljs.core.set = function set(coll) {
  var in$__13764 = cljs.core.seq.call(null, coll);
  var out__13765 = cljs.core.Set.EMPTY;
  while(true) {
    if(cljs.core.truth_(cljs.core.not.call(null, cljs.core.empty_QMARK_.call(null, in$__13764)))) {
      var G__13766 = cljs.core.rest.call(null, in$__13764);
      var G__13767 = cljs.core.conj.call(null, out__13765, cljs.core.first.call(null, in$__13764));
      in$__13764 = G__13766;
      out__13765 = G__13767;
      continue
    }else {
      return out__13765
    }
    break
  }
};
cljs.core.replace = function replace(smap, coll) {
  if(cljs.core.truth_(cljs.core.vector_QMARK_.call(null, coll))) {
    var n__13768 = cljs.core.count.call(null, coll);
    return cljs.core.reduce.call(null, function(v, i) {
      var temp__3971__auto____13769 = cljs.core.find.call(null, smap, cljs.core.nth.call(null, v, i));
      if(cljs.core.truth_(temp__3971__auto____13769)) {
        var e__13770 = temp__3971__auto____13769;
        return cljs.core.assoc.call(null, v, i, cljs.core.second.call(null, e__13770))
      }else {
        return v
      }
    }, coll, cljs.core.take.call(null, n__13768, cljs.core.iterate.call(null, cljs.core.inc, 0)))
  }else {
    return cljs.core.map.call(null, function(p1__13763_SHARP_) {
      var temp__3971__auto____13771 = cljs.core.find.call(null, smap, p1__13763_SHARP_);
      if(cljs.core.truth_(temp__3971__auto____13771)) {
        var e__13772 = temp__3971__auto____13771;
        return cljs.core.second.call(null, e__13772)
      }else {
        return p1__13763_SHARP_
      }
    }, coll)
  }
};
cljs.core.distinct = function distinct(coll) {
  var step__13780 = function step(xs, seen) {
    return new cljs.core.LazySeq(null, false, function() {
      return function(p__13773, seen) {
        while(true) {
          var vec__13774__13775 = p__13773;
          var f__13776 = cljs.core.nth.call(null, vec__13774__13775, 0, null);
          var xs__13777 = vec__13774__13775;
          var temp__3974__auto____13778 = cljs.core.seq.call(null, xs__13777);
          if(cljs.core.truth_(temp__3974__auto____13778)) {
            var s__13779 = temp__3974__auto____13778;
            if(cljs.core.truth_(cljs.core.contains_QMARK_.call(null, seen, f__13776))) {
              var G__13781 = cljs.core.rest.call(null, s__13779);
              var G__13782 = seen;
              p__13773 = G__13781;
              seen = G__13782;
              continue
            }else {
              return cljs.core.cons.call(null, f__13776, step.call(null, cljs.core.rest.call(null, s__13779), cljs.core.conj.call(null, seen, f__13776)))
            }
          }else {
            return null
          }
          break
        }
      }.call(null, xs, seen)
    })
  };
  return step__13780.call(null, coll, cljs.core.set([]))
};
cljs.core.butlast = function butlast(s) {
  var ret__13783 = cljs.core.PersistentVector.fromArray([]);
  var s__13784 = s;
  while(true) {
    if(cljs.core.truth_(cljs.core.next.call(null, s__13784))) {
      var G__13785 = cljs.core.conj.call(null, ret__13783, cljs.core.first.call(null, s__13784));
      var G__13786 = cljs.core.next.call(null, s__13784);
      ret__13783 = G__13785;
      s__13784 = G__13786;
      continue
    }else {
      return cljs.core.seq.call(null, ret__13783)
    }
    break
  }
};
cljs.core.name = function name(x) {
  if(cljs.core.truth_(cljs.core.string_QMARK_.call(null, x))) {
    return x
  }else {
    if(cljs.core.truth_(function() {
      var or__3824__auto____13787 = cljs.core.keyword_QMARK_.call(null, x);
      if(cljs.core.truth_(or__3824__auto____13787)) {
        return or__3824__auto____13787
      }else {
        return cljs.core.symbol_QMARK_.call(null, x)
      }
    }())) {
      var i__13788 = x.lastIndexOf("/");
      if(cljs.core.truth_(i__13788 < 0)) {
        return cljs.core.subs.call(null, x, 2)
      }else {
        return cljs.core.subs.call(null, x, i__13788 + 1)
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
    var or__3824__auto____13789 = cljs.core.keyword_QMARK_.call(null, x);
    if(cljs.core.truth_(or__3824__auto____13789)) {
      return or__3824__auto____13789
    }else {
      return cljs.core.symbol_QMARK_.call(null, x)
    }
  }())) {
    var i__13790 = x.lastIndexOf("/");
    if(cljs.core.truth_(i__13790 > -1)) {
      return cljs.core.subs.call(null, x, 2, i__13790)
    }else {
      return null
    }
  }else {
    throw new Error(cljs.core.str.call(null, "Doesn't support namespace: ", x));
  }
};
cljs.core.zipmap = function zipmap(keys, vals) {
  var map__13793 = cljs.core.ObjMap.fromObject([], {});
  var ks__13794 = cljs.core.seq.call(null, keys);
  var vs__13795 = cljs.core.seq.call(null, vals);
  while(true) {
    if(cljs.core.truth_(function() {
      var and__3822__auto____13796 = ks__13794;
      if(cljs.core.truth_(and__3822__auto____13796)) {
        return vs__13795
      }else {
        return and__3822__auto____13796
      }
    }())) {
      var G__13797 = cljs.core.assoc.call(null, map__13793, cljs.core.first.call(null, ks__13794), cljs.core.first.call(null, vs__13795));
      var G__13798 = cljs.core.next.call(null, ks__13794);
      var G__13799 = cljs.core.next.call(null, vs__13795);
      map__13793 = G__13797;
      ks__13794 = G__13798;
      vs__13795 = G__13799;
      continue
    }else {
      return map__13793
    }
    break
  }
};
cljs.core.max_key = function() {
  var max_key = null;
  var max_key__13802 = function(k, x) {
    return x
  };
  var max_key__13803 = function(k, x, y) {
    if(cljs.core.truth_(k.call(null, x) > k.call(null, y))) {
      return x
    }else {
      return y
    }
  };
  var max_key__13804 = function() {
    var G__13806__delegate = function(k, x, y, more) {
      return cljs.core.reduce.call(null, function(p1__13791_SHARP_, p2__13792_SHARP_) {
        return max_key.call(null, k, p1__13791_SHARP_, p2__13792_SHARP_)
      }, max_key.call(null, k, x, y), more)
    };
    var G__13806 = function(k, x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__13806__delegate.call(this, k, x, y, more)
    };
    G__13806.cljs$lang$maxFixedArity = 3;
    G__13806.cljs$lang$applyTo = function(arglist__13807) {
      var k = cljs.core.first(arglist__13807);
      var x = cljs.core.first(cljs.core.next(arglist__13807));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(arglist__13807)));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__13807)));
      return G__13806__delegate.call(this, k, x, y, more)
    };
    return G__13806
  }();
  max_key = function(k, x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return max_key__13802.call(this, k, x);
      case 3:
        return max_key__13803.call(this, k, x, y);
      default:
        return max_key__13804.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  max_key.cljs$lang$maxFixedArity = 3;
  max_key.cljs$lang$applyTo = max_key__13804.cljs$lang$applyTo;
  return max_key
}();
cljs.core.min_key = function() {
  var min_key = null;
  var min_key__13808 = function(k, x) {
    return x
  };
  var min_key__13809 = function(k, x, y) {
    if(cljs.core.truth_(k.call(null, x) < k.call(null, y))) {
      return x
    }else {
      return y
    }
  };
  var min_key__13810 = function() {
    var G__13812__delegate = function(k, x, y, more) {
      return cljs.core.reduce.call(null, function(p1__13800_SHARP_, p2__13801_SHARP_) {
        return min_key.call(null, k, p1__13800_SHARP_, p2__13801_SHARP_)
      }, min_key.call(null, k, x, y), more)
    };
    var G__13812 = function(k, x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__13812__delegate.call(this, k, x, y, more)
    };
    G__13812.cljs$lang$maxFixedArity = 3;
    G__13812.cljs$lang$applyTo = function(arglist__13813) {
      var k = cljs.core.first(arglist__13813);
      var x = cljs.core.first(cljs.core.next(arglist__13813));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(arglist__13813)));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__13813)));
      return G__13812__delegate.call(this, k, x, y, more)
    };
    return G__13812
  }();
  min_key = function(k, x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return min_key__13808.call(this, k, x);
      case 3:
        return min_key__13809.call(this, k, x, y);
      default:
        return min_key__13810.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  min_key.cljs$lang$maxFixedArity = 3;
  min_key.cljs$lang$applyTo = min_key__13810.cljs$lang$applyTo;
  return min_key
}();
cljs.core.partition_all = function() {
  var partition_all = null;
  var partition_all__13816 = function(n, coll) {
    return partition_all.call(null, n, n, coll)
  };
  var partition_all__13817 = function(n, step, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____13814 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3974__auto____13814)) {
        var s__13815 = temp__3974__auto____13814;
        return cljs.core.cons.call(null, cljs.core.take.call(null, n, s__13815), partition_all.call(null, n, step, cljs.core.drop.call(null, step, s__13815)))
      }else {
        return null
      }
    })
  };
  partition_all = function(n, step, coll) {
    switch(arguments.length) {
      case 2:
        return partition_all__13816.call(this, n, step);
      case 3:
        return partition_all__13817.call(this, n, step, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return partition_all
}();
cljs.core.take_while = function take_while(pred, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____13819 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3974__auto____13819)) {
      var s__13820 = temp__3974__auto____13819;
      if(cljs.core.truth_(pred.call(null, cljs.core.first.call(null, s__13820)))) {
        return cljs.core.cons.call(null, cljs.core.first.call(null, s__13820), take_while.call(null, pred, cljs.core.rest.call(null, s__13820)))
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
  var this__13821 = this;
  return cljs.core.hash_coll.call(null, rng)
};
cljs.core.Range.prototype.cljs$core$ISequential$ = true;
cljs.core.Range.prototype.cljs$core$ICollection$ = true;
cljs.core.Range.prototype.cljs$core$ICollection$_conj = function(rng, o) {
  var this__13822 = this;
  return cljs.core.cons.call(null, o, rng)
};
cljs.core.Range.prototype.cljs$core$IReduce$ = true;
cljs.core.Range.prototype.cljs$core$IReduce$_reduce = function() {
  var G__13838 = null;
  var G__13838__13839 = function(rng, f) {
    var this__13823 = this;
    return cljs.core.ci_reduce.call(null, rng, f)
  };
  var G__13838__13840 = function(rng, f, s) {
    var this__13824 = this;
    return cljs.core.ci_reduce.call(null, rng, f, s)
  };
  G__13838 = function(rng, f, s) {
    switch(arguments.length) {
      case 2:
        return G__13838__13839.call(this, rng, f);
      case 3:
        return G__13838__13840.call(this, rng, f, s)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__13838
}();
cljs.core.Range.prototype.cljs$core$ISeqable$ = true;
cljs.core.Range.prototype.cljs$core$ISeqable$_seq = function(rng) {
  var this__13825 = this;
  var comp__13826 = cljs.core.truth_(this__13825.step > 0) ? cljs.core._LT_ : cljs.core._GT_;
  if(cljs.core.truth_(comp__13826.call(null, this__13825.start, this__13825.end))) {
    return rng
  }else {
    return null
  }
};
cljs.core.Range.prototype.cljs$core$ICounted$ = true;
cljs.core.Range.prototype.cljs$core$ICounted$_count = function(rng) {
  var this__13827 = this;
  if(cljs.core.truth_(cljs.core.not.call(null, cljs.core._seq.call(null, rng)))) {
    return 0
  }else {
    return Math["ceil"].call(null, (this__13827.end - this__13827.start) / this__13827.step)
  }
};
cljs.core.Range.prototype.cljs$core$ISeq$ = true;
cljs.core.Range.prototype.cljs$core$ISeq$_first = function(rng) {
  var this__13828 = this;
  return this__13828.start
};
cljs.core.Range.prototype.cljs$core$ISeq$_rest = function(rng) {
  var this__13829 = this;
  if(cljs.core.truth_(cljs.core._seq.call(null, rng))) {
    return new cljs.core.Range(this__13829.meta, this__13829.start + this__13829.step, this__13829.end, this__13829.step)
  }else {
    return cljs.core.list.call(null)
  }
};
cljs.core.Range.prototype.cljs$core$IEquiv$ = true;
cljs.core.Range.prototype.cljs$core$IEquiv$_equiv = function(rng, other) {
  var this__13830 = this;
  return cljs.core.equiv_sequential.call(null, rng, other)
};
cljs.core.Range.prototype.cljs$core$IWithMeta$ = true;
cljs.core.Range.prototype.cljs$core$IWithMeta$_with_meta = function(rng, meta) {
  var this__13831 = this;
  return new cljs.core.Range(meta, this__13831.start, this__13831.end, this__13831.step)
};
cljs.core.Range.prototype.cljs$core$IMeta$ = true;
cljs.core.Range.prototype.cljs$core$IMeta$_meta = function(rng) {
  var this__13832 = this;
  return this__13832.meta
};
cljs.core.Range.prototype.cljs$core$IIndexed$ = true;
cljs.core.Range.prototype.cljs$core$IIndexed$_nth = function() {
  var G__13842 = null;
  var G__13842__13843 = function(rng, n) {
    var this__13833 = this;
    if(cljs.core.truth_(n < cljs.core._count.call(null, rng))) {
      return this__13833.start + n * this__13833.step
    }else {
      if(cljs.core.truth_(function() {
        var and__3822__auto____13834 = this__13833.start > this__13833.end;
        if(cljs.core.truth_(and__3822__auto____13834)) {
          return cljs.core._EQ_.call(null, this__13833.step, 0)
        }else {
          return and__3822__auto____13834
        }
      }())) {
        return this__13833.start
      }else {
        throw new Error("Index out of bounds");
      }
    }
  };
  var G__13842__13844 = function(rng, n, not_found) {
    var this__13835 = this;
    if(cljs.core.truth_(n < cljs.core._count.call(null, rng))) {
      return this__13835.start + n * this__13835.step
    }else {
      if(cljs.core.truth_(function() {
        var and__3822__auto____13836 = this__13835.start > this__13835.end;
        if(cljs.core.truth_(and__3822__auto____13836)) {
          return cljs.core._EQ_.call(null, this__13835.step, 0)
        }else {
          return and__3822__auto____13836
        }
      }())) {
        return this__13835.start
      }else {
        return not_found
      }
    }
  };
  G__13842 = function(rng, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__13842__13843.call(this, rng, n);
      case 3:
        return G__13842__13844.call(this, rng, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__13842
}();
cljs.core.Range.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.Range.prototype.cljs$core$IEmptyableCollection$_empty = function(rng) {
  var this__13837 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__13837.meta)
};
cljs.core.Range;
cljs.core.range = function() {
  var range = null;
  var range__13846 = function() {
    return range.call(null, 0, Number["MAX_VALUE"], 1)
  };
  var range__13847 = function(end) {
    return range.call(null, 0, end, 1)
  };
  var range__13848 = function(start, end) {
    return range.call(null, start, end, 1)
  };
  var range__13849 = function(start, end, step) {
    return new cljs.core.Range(null, start, end, step)
  };
  range = function(start, end, step) {
    switch(arguments.length) {
      case 0:
        return range__13846.call(this);
      case 1:
        return range__13847.call(this, start);
      case 2:
        return range__13848.call(this, start, end);
      case 3:
        return range__13849.call(this, start, end, step)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return range
}();
cljs.core.take_nth = function take_nth(n, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____13851 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3974__auto____13851)) {
      var s__13852 = temp__3974__auto____13851;
      return cljs.core.cons.call(null, cljs.core.first.call(null, s__13852), take_nth.call(null, n, cljs.core.drop.call(null, n, s__13852)))
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
    var temp__3974__auto____13854 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3974__auto____13854)) {
      var s__13855 = temp__3974__auto____13854;
      var fst__13856 = cljs.core.first.call(null, s__13855);
      var fv__13857 = f.call(null, fst__13856);
      var run__13858 = cljs.core.cons.call(null, fst__13856, cljs.core.take_while.call(null, function(p1__13853_SHARP_) {
        return cljs.core._EQ_.call(null, fv__13857, f.call(null, p1__13853_SHARP_))
      }, cljs.core.next.call(null, s__13855)));
      return cljs.core.cons.call(null, run__13858, partition_by.call(null, f, cljs.core.seq.call(null, cljs.core.drop.call(null, cljs.core.count.call(null, run__13858), s__13855))))
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
  var reductions__13873 = function(f, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3971__auto____13869 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3971__auto____13869)) {
        var s__13870 = temp__3971__auto____13869;
        return reductions.call(null, f, cljs.core.first.call(null, s__13870), cljs.core.rest.call(null, s__13870))
      }else {
        return cljs.core.list.call(null, f.call(null))
      }
    })
  };
  var reductions__13874 = function(f, init, coll) {
    return cljs.core.cons.call(null, init, new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____13871 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3974__auto____13871)) {
        var s__13872 = temp__3974__auto____13871;
        return reductions.call(null, f, f.call(null, init, cljs.core.first.call(null, s__13872)), cljs.core.rest.call(null, s__13872))
      }else {
        return null
      }
    }))
  };
  reductions = function(f, init, coll) {
    switch(arguments.length) {
      case 2:
        return reductions__13873.call(this, f, init);
      case 3:
        return reductions__13874.call(this, f, init, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return reductions
}();
cljs.core.juxt = function() {
  var juxt = null;
  var juxt__13877 = function(f) {
    return function() {
      var G__13882 = null;
      var G__13882__13883 = function() {
        return cljs.core.vector.call(null, f.call(null))
      };
      var G__13882__13884 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x))
      };
      var G__13882__13885 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y))
      };
      var G__13882__13886 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z))
      };
      var G__13882__13887 = function() {
        var G__13889__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args))
        };
        var G__13889 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__13889__delegate.call(this, x, y, z, args)
        };
        G__13889.cljs$lang$maxFixedArity = 3;
        G__13889.cljs$lang$applyTo = function(arglist__13890) {
          var x = cljs.core.first(arglist__13890);
          var y = cljs.core.first(cljs.core.next(arglist__13890));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__13890)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__13890)));
          return G__13889__delegate.call(this, x, y, z, args)
        };
        return G__13889
      }();
      G__13882 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__13882__13883.call(this);
          case 1:
            return G__13882__13884.call(this, x);
          case 2:
            return G__13882__13885.call(this, x, y);
          case 3:
            return G__13882__13886.call(this, x, y, z);
          default:
            return G__13882__13887.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__13882.cljs$lang$maxFixedArity = 3;
      G__13882.cljs$lang$applyTo = G__13882__13887.cljs$lang$applyTo;
      return G__13882
    }()
  };
  var juxt__13878 = function(f, g) {
    return function() {
      var G__13891 = null;
      var G__13891__13892 = function() {
        return cljs.core.vector.call(null, f.call(null), g.call(null))
      };
      var G__13891__13893 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x), g.call(null, x))
      };
      var G__13891__13894 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y), g.call(null, x, y))
      };
      var G__13891__13895 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z), g.call(null, x, y, z))
      };
      var G__13891__13896 = function() {
        var G__13898__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args), cljs.core.apply.call(null, g, x, y, z, args))
        };
        var G__13898 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__13898__delegate.call(this, x, y, z, args)
        };
        G__13898.cljs$lang$maxFixedArity = 3;
        G__13898.cljs$lang$applyTo = function(arglist__13899) {
          var x = cljs.core.first(arglist__13899);
          var y = cljs.core.first(cljs.core.next(arglist__13899));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__13899)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__13899)));
          return G__13898__delegate.call(this, x, y, z, args)
        };
        return G__13898
      }();
      G__13891 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__13891__13892.call(this);
          case 1:
            return G__13891__13893.call(this, x);
          case 2:
            return G__13891__13894.call(this, x, y);
          case 3:
            return G__13891__13895.call(this, x, y, z);
          default:
            return G__13891__13896.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__13891.cljs$lang$maxFixedArity = 3;
      G__13891.cljs$lang$applyTo = G__13891__13896.cljs$lang$applyTo;
      return G__13891
    }()
  };
  var juxt__13879 = function(f, g, h) {
    return function() {
      var G__13900 = null;
      var G__13900__13901 = function() {
        return cljs.core.vector.call(null, f.call(null), g.call(null), h.call(null))
      };
      var G__13900__13902 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x), g.call(null, x), h.call(null, x))
      };
      var G__13900__13903 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y), g.call(null, x, y), h.call(null, x, y))
      };
      var G__13900__13904 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z), g.call(null, x, y, z), h.call(null, x, y, z))
      };
      var G__13900__13905 = function() {
        var G__13907__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args), cljs.core.apply.call(null, g, x, y, z, args), cljs.core.apply.call(null, h, x, y, z, args))
        };
        var G__13907 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__13907__delegate.call(this, x, y, z, args)
        };
        G__13907.cljs$lang$maxFixedArity = 3;
        G__13907.cljs$lang$applyTo = function(arglist__13908) {
          var x = cljs.core.first(arglist__13908);
          var y = cljs.core.first(cljs.core.next(arglist__13908));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__13908)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__13908)));
          return G__13907__delegate.call(this, x, y, z, args)
        };
        return G__13907
      }();
      G__13900 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__13900__13901.call(this);
          case 1:
            return G__13900__13902.call(this, x);
          case 2:
            return G__13900__13903.call(this, x, y);
          case 3:
            return G__13900__13904.call(this, x, y, z);
          default:
            return G__13900__13905.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__13900.cljs$lang$maxFixedArity = 3;
      G__13900.cljs$lang$applyTo = G__13900__13905.cljs$lang$applyTo;
      return G__13900
    }()
  };
  var juxt__13880 = function() {
    var G__13909__delegate = function(f, g, h, fs) {
      var fs__13876 = cljs.core.list_STAR_.call(null, f, g, h, fs);
      return function() {
        var G__13910 = null;
        var G__13910__13911 = function() {
          return cljs.core.reduce.call(null, function(p1__13859_SHARP_, p2__13860_SHARP_) {
            return cljs.core.conj.call(null, p1__13859_SHARP_, p2__13860_SHARP_.call(null))
          }, cljs.core.PersistentVector.fromArray([]), fs__13876)
        };
        var G__13910__13912 = function(x) {
          return cljs.core.reduce.call(null, function(p1__13861_SHARP_, p2__13862_SHARP_) {
            return cljs.core.conj.call(null, p1__13861_SHARP_, p2__13862_SHARP_.call(null, x))
          }, cljs.core.PersistentVector.fromArray([]), fs__13876)
        };
        var G__13910__13913 = function(x, y) {
          return cljs.core.reduce.call(null, function(p1__13863_SHARP_, p2__13864_SHARP_) {
            return cljs.core.conj.call(null, p1__13863_SHARP_, p2__13864_SHARP_.call(null, x, y))
          }, cljs.core.PersistentVector.fromArray([]), fs__13876)
        };
        var G__13910__13914 = function(x, y, z) {
          return cljs.core.reduce.call(null, function(p1__13865_SHARP_, p2__13866_SHARP_) {
            return cljs.core.conj.call(null, p1__13865_SHARP_, p2__13866_SHARP_.call(null, x, y, z))
          }, cljs.core.PersistentVector.fromArray([]), fs__13876)
        };
        var G__13910__13915 = function() {
          var G__13917__delegate = function(x, y, z, args) {
            return cljs.core.reduce.call(null, function(p1__13867_SHARP_, p2__13868_SHARP_) {
              return cljs.core.conj.call(null, p1__13867_SHARP_, cljs.core.apply.call(null, p2__13868_SHARP_, x, y, z, args))
            }, cljs.core.PersistentVector.fromArray([]), fs__13876)
          };
          var G__13917 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__13917__delegate.call(this, x, y, z, args)
          };
          G__13917.cljs$lang$maxFixedArity = 3;
          G__13917.cljs$lang$applyTo = function(arglist__13918) {
            var x = cljs.core.first(arglist__13918);
            var y = cljs.core.first(cljs.core.next(arglist__13918));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__13918)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__13918)));
            return G__13917__delegate.call(this, x, y, z, args)
          };
          return G__13917
        }();
        G__13910 = function(x, y, z, var_args) {
          var args = var_args;
          switch(arguments.length) {
            case 0:
              return G__13910__13911.call(this);
            case 1:
              return G__13910__13912.call(this, x);
            case 2:
              return G__13910__13913.call(this, x, y);
            case 3:
              return G__13910__13914.call(this, x, y, z);
            default:
              return G__13910__13915.apply(this, arguments)
          }
          throw"Invalid arity: " + arguments.length;
        };
        G__13910.cljs$lang$maxFixedArity = 3;
        G__13910.cljs$lang$applyTo = G__13910__13915.cljs$lang$applyTo;
        return G__13910
      }()
    };
    var G__13909 = function(f, g, h, var_args) {
      var fs = null;
      if(goog.isDef(var_args)) {
        fs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__13909__delegate.call(this, f, g, h, fs)
    };
    G__13909.cljs$lang$maxFixedArity = 3;
    G__13909.cljs$lang$applyTo = function(arglist__13919) {
      var f = cljs.core.first(arglist__13919);
      var g = cljs.core.first(cljs.core.next(arglist__13919));
      var h = cljs.core.first(cljs.core.next(cljs.core.next(arglist__13919)));
      var fs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__13919)));
      return G__13909__delegate.call(this, f, g, h, fs)
    };
    return G__13909
  }();
  juxt = function(f, g, h, var_args) {
    var fs = var_args;
    switch(arguments.length) {
      case 1:
        return juxt__13877.call(this, f);
      case 2:
        return juxt__13878.call(this, f, g);
      case 3:
        return juxt__13879.call(this, f, g, h);
      default:
        return juxt__13880.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  juxt.cljs$lang$maxFixedArity = 3;
  juxt.cljs$lang$applyTo = juxt__13880.cljs$lang$applyTo;
  return juxt
}();
cljs.core.dorun = function() {
  var dorun = null;
  var dorun__13921 = function(coll) {
    while(true) {
      if(cljs.core.truth_(cljs.core.seq.call(null, coll))) {
        var G__13924 = cljs.core.next.call(null, coll);
        coll = G__13924;
        continue
      }else {
        return null
      }
      break
    }
  };
  var dorun__13922 = function(n, coll) {
    while(true) {
      if(cljs.core.truth_(function() {
        var and__3822__auto____13920 = cljs.core.seq.call(null, coll);
        if(cljs.core.truth_(and__3822__auto____13920)) {
          return n > 0
        }else {
          return and__3822__auto____13920
        }
      }())) {
        var G__13925 = n - 1;
        var G__13926 = cljs.core.next.call(null, coll);
        n = G__13925;
        coll = G__13926;
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
        return dorun__13921.call(this, n);
      case 2:
        return dorun__13922.call(this, n, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return dorun
}();
cljs.core.doall = function() {
  var doall = null;
  var doall__13927 = function(coll) {
    cljs.core.dorun.call(null, coll);
    return coll
  };
  var doall__13928 = function(n, coll) {
    cljs.core.dorun.call(null, n, coll);
    return coll
  };
  doall = function(n, coll) {
    switch(arguments.length) {
      case 1:
        return doall__13927.call(this, n);
      case 2:
        return doall__13928.call(this, n, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return doall
}();
cljs.core.re_matches = function re_matches(re, s) {
  var matches__13930 = re.exec(s);
  if(cljs.core.truth_(cljs.core._EQ_.call(null, cljs.core.first.call(null, matches__13930), s))) {
    if(cljs.core.truth_(cljs.core._EQ_.call(null, cljs.core.count.call(null, matches__13930), 1))) {
      return cljs.core.first.call(null, matches__13930)
    }else {
      return cljs.core.vec.call(null, matches__13930)
    }
  }else {
    return null
  }
};
cljs.core.re_find = function re_find(re, s) {
  var matches__13931 = re.exec(s);
  if(cljs.core.truth_(matches__13931 === null)) {
    return null
  }else {
    if(cljs.core.truth_(cljs.core._EQ_.call(null, cljs.core.count.call(null, matches__13931), 1))) {
      return cljs.core.first.call(null, matches__13931)
    }else {
      return cljs.core.vec.call(null, matches__13931)
    }
  }
};
cljs.core.re_seq = function re_seq(re, s) {
  var match_data__13932 = cljs.core.re_find.call(null, re, s);
  var match_idx__13933 = s.search(re);
  var match_str__13934 = cljs.core.truth_(cljs.core.coll_QMARK_.call(null, match_data__13932)) ? cljs.core.first.call(null, match_data__13932) : match_data__13932;
  var post_match__13935 = cljs.core.subs.call(null, s, match_idx__13933 + cljs.core.count.call(null, match_str__13934));
  if(cljs.core.truth_(match_data__13932)) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, match_data__13932, re_seq.call(null, re, post_match__13935))
    })
  }else {
    return null
  }
};
cljs.core.re_pattern = function re_pattern(s) {
  var vec__13937__13938 = cljs.core.re_find.call(null, /^(?:\(\?([idmsux]*)\))?(.*)/, s);
  var ___13939 = cljs.core.nth.call(null, vec__13937__13938, 0, null);
  var flags__13940 = cljs.core.nth.call(null, vec__13937__13938, 1, null);
  var pattern__13941 = cljs.core.nth.call(null, vec__13937__13938, 2, null);
  return new RegExp(pattern__13941, flags__13940)
};
cljs.core.pr_sequential = function pr_sequential(print_one, begin, sep, end, opts, coll) {
  return cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray([begin]), cljs.core.flatten1.call(null, cljs.core.interpose.call(null, cljs.core.PersistentVector.fromArray([sep]), cljs.core.map.call(null, function(p1__13936_SHARP_) {
    return print_one.call(null, p1__13936_SHARP_, opts)
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
          var and__3822__auto____13942 = cljs.core.get.call(null, opts, "\ufdd0'meta");
          if(cljs.core.truth_(and__3822__auto____13942)) {
            var and__3822__auto____13946 = function() {
              var x__451__auto____13943 = obj;
              if(cljs.core.truth_(function() {
                var and__3822__auto____13944 = x__451__auto____13943;
                if(cljs.core.truth_(and__3822__auto____13944)) {
                  var and__3822__auto____13945 = x__451__auto____13943.cljs$core$IMeta$;
                  if(cljs.core.truth_(and__3822__auto____13945)) {
                    return cljs.core.not.call(null, x__451__auto____13943.hasOwnProperty("cljs$core$IMeta$"))
                  }else {
                    return and__3822__auto____13945
                  }
                }else {
                  return and__3822__auto____13944
                }
              }())) {
                return true
              }else {
                return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, x__451__auto____13943)
              }
            }();
            if(cljs.core.truth_(and__3822__auto____13946)) {
              return cljs.core.meta.call(null, obj)
            }else {
              return and__3822__auto____13946
            }
          }else {
            return and__3822__auto____13942
          }
        }()) ? cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray(["^"]), pr_seq.call(null, cljs.core.meta.call(null, obj), opts), cljs.core.PersistentVector.fromArray([" "])) : null, cljs.core.truth_(function() {
          var x__451__auto____13947 = obj;
          if(cljs.core.truth_(function() {
            var and__3822__auto____13948 = x__451__auto____13947;
            if(cljs.core.truth_(and__3822__auto____13948)) {
              var and__3822__auto____13949 = x__451__auto____13947.cljs$core$IPrintable$;
              if(cljs.core.truth_(and__3822__auto____13949)) {
                return cljs.core.not.call(null, x__451__auto____13947.hasOwnProperty("cljs$core$IPrintable$"))
              }else {
                return and__3822__auto____13949
              }
            }else {
              return and__3822__auto____13948
            }
          }())) {
            return true
          }else {
            return cljs.core.type_satisfies_.call(null, cljs.core.IPrintable, x__451__auto____13947)
          }
        }()) ? cljs.core._pr_seq.call(null, obj, opts) : cljs.core.list.call(null, "#<", cljs.core.str.call(null, obj), ">"))
      }else {
        return null
      }
    }
  }
};
cljs.core.pr_sb = function pr_sb(objs, opts) {
  var first_obj__13950 = cljs.core.first.call(null, objs);
  var sb__13951 = new goog.string.StringBuffer;
  var G__13952__13953 = cljs.core.seq.call(null, objs);
  if(cljs.core.truth_(G__13952__13953)) {
    var obj__13954 = cljs.core.first.call(null, G__13952__13953);
    var G__13952__13955 = G__13952__13953;
    while(true) {
      if(cljs.core.truth_(obj__13954 === first_obj__13950)) {
      }else {
        sb__13951.append(" ")
      }
      var G__13956__13957 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, obj__13954, opts));
      if(cljs.core.truth_(G__13956__13957)) {
        var string__13958 = cljs.core.first.call(null, G__13956__13957);
        var G__13956__13959 = G__13956__13957;
        while(true) {
          sb__13951.append(string__13958);
          var temp__3974__auto____13960 = cljs.core.next.call(null, G__13956__13959);
          if(cljs.core.truth_(temp__3974__auto____13960)) {
            var G__13956__13961 = temp__3974__auto____13960;
            var G__13964 = cljs.core.first.call(null, G__13956__13961);
            var G__13965 = G__13956__13961;
            string__13958 = G__13964;
            G__13956__13959 = G__13965;
            continue
          }else {
          }
          break
        }
      }else {
      }
      var temp__3974__auto____13962 = cljs.core.next.call(null, G__13952__13955);
      if(cljs.core.truth_(temp__3974__auto____13962)) {
        var G__13952__13963 = temp__3974__auto____13962;
        var G__13966 = cljs.core.first.call(null, G__13952__13963);
        var G__13967 = G__13952__13963;
        obj__13954 = G__13966;
        G__13952__13955 = G__13967;
        continue
      }else {
      }
      break
    }
  }else {
  }
  return sb__13951
};
cljs.core.pr_str_with_opts = function pr_str_with_opts(objs, opts) {
  return cljs.core.str.call(null, cljs.core.pr_sb.call(null, objs, opts))
};
cljs.core.prn_str_with_opts = function prn_str_with_opts(objs, opts) {
  var sb__13968 = cljs.core.pr_sb.call(null, objs, opts);
  sb__13968.append("\n");
  return cljs.core.str.call(null, sb__13968)
};
cljs.core.pr_with_opts = function pr_with_opts(objs, opts) {
  var first_obj__13969 = cljs.core.first.call(null, objs);
  var G__13970__13971 = cljs.core.seq.call(null, objs);
  if(cljs.core.truth_(G__13970__13971)) {
    var obj__13972 = cljs.core.first.call(null, G__13970__13971);
    var G__13970__13973 = G__13970__13971;
    while(true) {
      if(cljs.core.truth_(obj__13972 === first_obj__13969)) {
      }else {
        cljs.core.string_print.call(null, " ")
      }
      var G__13974__13975 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, obj__13972, opts));
      if(cljs.core.truth_(G__13974__13975)) {
        var string__13976 = cljs.core.first.call(null, G__13974__13975);
        var G__13974__13977 = G__13974__13975;
        while(true) {
          cljs.core.string_print.call(null, string__13976);
          var temp__3974__auto____13978 = cljs.core.next.call(null, G__13974__13977);
          if(cljs.core.truth_(temp__3974__auto____13978)) {
            var G__13974__13979 = temp__3974__auto____13978;
            var G__13982 = cljs.core.first.call(null, G__13974__13979);
            var G__13983 = G__13974__13979;
            string__13976 = G__13982;
            G__13974__13977 = G__13983;
            continue
          }else {
          }
          break
        }
      }else {
      }
      var temp__3974__auto____13980 = cljs.core.next.call(null, G__13970__13973);
      if(cljs.core.truth_(temp__3974__auto____13980)) {
        var G__13970__13981 = temp__3974__auto____13980;
        var G__13984 = cljs.core.first.call(null, G__13970__13981);
        var G__13985 = G__13970__13981;
        obj__13972 = G__13984;
        G__13970__13973 = G__13985;
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
  pr_str.cljs$lang$applyTo = function(arglist__13986) {
    var objs = cljs.core.seq(arglist__13986);
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
  prn_str.cljs$lang$applyTo = function(arglist__13987) {
    var objs = cljs.core.seq(arglist__13987);
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
  pr.cljs$lang$applyTo = function(arglist__13988) {
    var objs = cljs.core.seq(arglist__13988);
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
  cljs_core_print.cljs$lang$applyTo = function(arglist__13989) {
    var objs = cljs.core.seq(arglist__13989);
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
  print_str.cljs$lang$applyTo = function(arglist__13990) {
    var objs = cljs.core.seq(arglist__13990);
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
  println.cljs$lang$applyTo = function(arglist__13991) {
    var objs = cljs.core.seq(arglist__13991);
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
  println_str.cljs$lang$applyTo = function(arglist__13992) {
    var objs = cljs.core.seq(arglist__13992);
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
  prn.cljs$lang$applyTo = function(arglist__13993) {
    var objs = cljs.core.seq(arglist__13993);
    return prn__delegate.call(this, objs)
  };
  return prn
}();
cljs.core.HashMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.HashMap.prototype.cljs$core$IPrintable$_pr_seq = function(coll, opts) {
  var pr_pair__13994 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__13994, "{", ", ", "}", opts, coll)
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
      var temp__3974__auto____13995 = cljs.core.namespace.call(null, obj);
      if(cljs.core.truth_(temp__3974__auto____13995)) {
        var nspc__13996 = temp__3974__auto____13995;
        return cljs.core.str.call(null, nspc__13996, "/")
      }else {
        return null
      }
    }(), cljs.core.name.call(null, obj)))
  }else {
    if(cljs.core.truth_(cljs.core.symbol_QMARK_.call(null, obj))) {
      return cljs.core.list.call(null, cljs.core.str.call(null, function() {
        var temp__3974__auto____13997 = cljs.core.namespace.call(null, obj);
        if(cljs.core.truth_(temp__3974__auto____13997)) {
          var nspc__13998 = temp__3974__auto____13997;
          return cljs.core.str.call(null, nspc__13998, "/")
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
  var pr_pair__13999 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__13999, "{", ", ", "}", opts, coll)
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
  var this__14000 = this;
  return goog.getUid.call(null, this$)
};
cljs.core.Atom.prototype.cljs$core$IWatchable$ = true;
cljs.core.Atom.prototype.cljs$core$IWatchable$_notify_watches = function(this$, oldval, newval) {
  var this__14001 = this;
  var G__14002__14003 = cljs.core.seq.call(null, this__14001.watches);
  if(cljs.core.truth_(G__14002__14003)) {
    var G__14005__14007 = cljs.core.first.call(null, G__14002__14003);
    var vec__14006__14008 = G__14005__14007;
    var key__14009 = cljs.core.nth.call(null, vec__14006__14008, 0, null);
    var f__14010 = cljs.core.nth.call(null, vec__14006__14008, 1, null);
    var G__14002__14011 = G__14002__14003;
    var G__14005__14012 = G__14005__14007;
    var G__14002__14013 = G__14002__14011;
    while(true) {
      var vec__14014__14015 = G__14005__14012;
      var key__14016 = cljs.core.nth.call(null, vec__14014__14015, 0, null);
      var f__14017 = cljs.core.nth.call(null, vec__14014__14015, 1, null);
      var G__14002__14018 = G__14002__14013;
      f__14017.call(null, key__14016, this$, oldval, newval);
      var temp__3974__auto____14019 = cljs.core.next.call(null, G__14002__14018);
      if(cljs.core.truth_(temp__3974__auto____14019)) {
        var G__14002__14020 = temp__3974__auto____14019;
        var G__14027 = cljs.core.first.call(null, G__14002__14020);
        var G__14028 = G__14002__14020;
        G__14005__14012 = G__14027;
        G__14002__14013 = G__14028;
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
  var this__14021 = this;
  return this$.watches = cljs.core.assoc.call(null, this__14021.watches, key, f)
};
cljs.core.Atom.prototype.cljs$core$IWatchable$_remove_watch = function(this$, key) {
  var this__14022 = this;
  return this$.watches = cljs.core.dissoc.call(null, this__14022.watches, key)
};
cljs.core.Atom.prototype.cljs$core$IPrintable$ = true;
cljs.core.Atom.prototype.cljs$core$IPrintable$_pr_seq = function(a, opts) {
  var this__14023 = this;
  return cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray(["#<Atom: "]), cljs.core._pr_seq.call(null, this__14023.state, opts), ">")
};
cljs.core.Atom.prototype.cljs$core$IMeta$ = true;
cljs.core.Atom.prototype.cljs$core$IMeta$_meta = function(_) {
  var this__14024 = this;
  return this__14024.meta
};
cljs.core.Atom.prototype.cljs$core$IDeref$ = true;
cljs.core.Atom.prototype.cljs$core$IDeref$_deref = function(_) {
  var this__14025 = this;
  return this__14025.state
};
cljs.core.Atom.prototype.cljs$core$IEquiv$ = true;
cljs.core.Atom.prototype.cljs$core$IEquiv$_equiv = function(o, other) {
  var this__14026 = this;
  return o === other
};
cljs.core.Atom;
cljs.core.atom = function() {
  var atom = null;
  var atom__14035 = function(x) {
    return new cljs.core.Atom(x, null, null, null)
  };
  var atom__14036 = function() {
    var G__14038__delegate = function(x, p__14029) {
      var map__14030__14031 = p__14029;
      var map__14030__14032 = cljs.core.truth_(cljs.core.seq_QMARK_.call(null, map__14030__14031)) ? cljs.core.apply.call(null, cljs.core.hash_map, map__14030__14031) : map__14030__14031;
      var validator__14033 = cljs.core.get.call(null, map__14030__14032, "\ufdd0'validator");
      var meta__14034 = cljs.core.get.call(null, map__14030__14032, "\ufdd0'meta");
      return new cljs.core.Atom(x, meta__14034, validator__14033, null)
    };
    var G__14038 = function(x, var_args) {
      var p__14029 = null;
      if(goog.isDef(var_args)) {
        p__14029 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__14038__delegate.call(this, x, p__14029)
    };
    G__14038.cljs$lang$maxFixedArity = 1;
    G__14038.cljs$lang$applyTo = function(arglist__14039) {
      var x = cljs.core.first(arglist__14039);
      var p__14029 = cljs.core.rest(arglist__14039);
      return G__14038__delegate.call(this, x, p__14029)
    };
    return G__14038
  }();
  atom = function(x, var_args) {
    var p__14029 = var_args;
    switch(arguments.length) {
      case 1:
        return atom__14035.call(this, x);
      default:
        return atom__14036.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  atom.cljs$lang$maxFixedArity = 1;
  atom.cljs$lang$applyTo = atom__14036.cljs$lang$applyTo;
  return atom
}();
cljs.core.reset_BANG_ = function reset_BANG_(a, new_value) {
  var temp__3974__auto____14040 = a.validator;
  if(cljs.core.truth_(temp__3974__auto____14040)) {
    var validate__14041 = temp__3974__auto____14040;
    if(cljs.core.truth_(validate__14041.call(null, new_value))) {
    }else {
      throw new Error(cljs.core.str.call(null, "Assert failed: ", "Validator rejected reference state", "\n", cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'validate", "\ufdd1'new-value"), cljs.core.hash_map("\ufdd0'line", 3282)))));
    }
  }else {
  }
  var old_value__14042 = a.state;
  a.state = new_value;
  cljs.core._notify_watches.call(null, a, old_value__14042, new_value);
  return new_value
};
cljs.core.swap_BANG_ = function() {
  var swap_BANG_ = null;
  var swap_BANG___14043 = function(a, f) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state))
  };
  var swap_BANG___14044 = function(a, f, x) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state, x))
  };
  var swap_BANG___14045 = function(a, f, x, y) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state, x, y))
  };
  var swap_BANG___14046 = function(a, f, x, y, z) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state, x, y, z))
  };
  var swap_BANG___14047 = function() {
    var G__14049__delegate = function(a, f, x, y, z, more) {
      return cljs.core.reset_BANG_.call(null, a, cljs.core.apply.call(null, f, a.state, x, y, z, more))
    };
    var G__14049 = function(a, f, x, y, z, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 5), 0)
      }
      return G__14049__delegate.call(this, a, f, x, y, z, more)
    };
    G__14049.cljs$lang$maxFixedArity = 5;
    G__14049.cljs$lang$applyTo = function(arglist__14050) {
      var a = cljs.core.first(arglist__14050);
      var f = cljs.core.first(cljs.core.next(arglist__14050));
      var x = cljs.core.first(cljs.core.next(cljs.core.next(arglist__14050)));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__14050))));
      var z = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__14050)))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__14050)))));
      return G__14049__delegate.call(this, a, f, x, y, z, more)
    };
    return G__14049
  }();
  swap_BANG_ = function(a, f, x, y, z, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return swap_BANG___14043.call(this, a, f);
      case 3:
        return swap_BANG___14044.call(this, a, f, x);
      case 4:
        return swap_BANG___14045.call(this, a, f, x, y);
      case 5:
        return swap_BANG___14046.call(this, a, f, x, y, z);
      default:
        return swap_BANG___14047.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  swap_BANG_.cljs$lang$maxFixedArity = 5;
  swap_BANG_.cljs$lang$applyTo = swap_BANG___14047.cljs$lang$applyTo;
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
  alter_meta_BANG_.cljs$lang$applyTo = function(arglist__14051) {
    var iref = cljs.core.first(arglist__14051);
    var f = cljs.core.first(cljs.core.next(arglist__14051));
    var args = cljs.core.rest(cljs.core.next(arglist__14051));
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
  var gensym__14052 = function() {
    return gensym.call(null, "G__")
  };
  var gensym__14053 = function(prefix_string) {
    if(cljs.core.truth_(cljs.core.gensym_counter === null)) {
      cljs.core.gensym_counter = cljs.core.atom.call(null, 0)
    }else {
    }
    return cljs.core.symbol.call(null, cljs.core.str.call(null, prefix_string, cljs.core.swap_BANG_.call(null, cljs.core.gensym_counter, cljs.core.inc)))
  };
  gensym = function(prefix_string) {
    switch(arguments.length) {
      case 0:
        return gensym__14052.call(this);
      case 1:
        return gensym__14053.call(this, prefix_string)
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
  var this__14055 = this;
  return"\ufdd0'done".call(null, cljs.core.deref.call(null, this__14055.state))
};
cljs.core.Delay.prototype.cljs$core$IDeref$ = true;
cljs.core.Delay.prototype.cljs$core$IDeref$_deref = function(_) {
  var this__14056 = this;
  return"\ufdd0'value".call(null, cljs.core.swap_BANG_.call(null, this__14056.state, function(p__14057) {
    var curr_state__14058 = p__14057;
    var curr_state__14059 = cljs.core.truth_(cljs.core.seq_QMARK_.call(null, curr_state__14058)) ? cljs.core.apply.call(null, cljs.core.hash_map, curr_state__14058) : curr_state__14058;
    var done__14060 = cljs.core.get.call(null, curr_state__14059, "\ufdd0'done");
    if(cljs.core.truth_(done__14060)) {
      return curr_state__14059
    }else {
      return cljs.core.ObjMap.fromObject(["\ufdd0'done", "\ufdd0'value"], {"\ufdd0'done":true, "\ufdd0'value":this__14056.f.call(null)})
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
    var map__14061__14062 = options;
    var map__14061__14063 = cljs.core.truth_(cljs.core.seq_QMARK_.call(null, map__14061__14062)) ? cljs.core.apply.call(null, cljs.core.hash_map, map__14061__14062) : map__14061__14062;
    var keywordize_keys__14064 = cljs.core.get.call(null, map__14061__14063, "\ufdd0'keywordize-keys");
    var keyfn__14065 = cljs.core.truth_(keywordize_keys__14064) ? cljs.core.keyword : cljs.core.str;
    var f__14071 = function thisfn(x) {
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
                var iter__520__auto____14070 = function iter__14066(s__14067) {
                  return new cljs.core.LazySeq(null, false, function() {
                    var s__14067__14068 = s__14067;
                    while(true) {
                      if(cljs.core.truth_(cljs.core.seq.call(null, s__14067__14068))) {
                        var k__14069 = cljs.core.first.call(null, s__14067__14068);
                        return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([keyfn__14065.call(null, k__14069), thisfn.call(null, x[k__14069])]), iter__14066.call(null, cljs.core.rest.call(null, s__14067__14068)))
                      }else {
                        return null
                      }
                      break
                    }
                  })
                };
                return iter__520__auto____14070.call(null, cljs.core.js_keys.call(null, x))
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
    return f__14071.call(null, x)
  };
  var js__GT_clj = function(x, var_args) {
    var options = null;
    if(goog.isDef(var_args)) {
      options = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return js__GT_clj__delegate.call(this, x, options)
  };
  js__GT_clj.cljs$lang$maxFixedArity = 1;
  js__GT_clj.cljs$lang$applyTo = function(arglist__14072) {
    var x = cljs.core.first(arglist__14072);
    var options = cljs.core.rest(arglist__14072);
    return js__GT_clj__delegate.call(this, x, options)
  };
  return js__GT_clj
}();
cljs.core.memoize = function memoize(f) {
  var mem__14073 = cljs.core.atom.call(null, cljs.core.ObjMap.fromObject([], {}));
  return function() {
    var G__14077__delegate = function(args) {
      var temp__3971__auto____14074 = cljs.core.get.call(null, cljs.core.deref.call(null, mem__14073), args);
      if(cljs.core.truth_(temp__3971__auto____14074)) {
        var v__14075 = temp__3971__auto____14074;
        return v__14075
      }else {
        var ret__14076 = cljs.core.apply.call(null, f, args);
        cljs.core.swap_BANG_.call(null, mem__14073, cljs.core.assoc, args, ret__14076);
        return ret__14076
      }
    };
    var G__14077 = function(var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__14077__delegate.call(this, args)
    };
    G__14077.cljs$lang$maxFixedArity = 0;
    G__14077.cljs$lang$applyTo = function(arglist__14078) {
      var args = cljs.core.seq(arglist__14078);
      return G__14077__delegate.call(this, args)
    };
    return G__14077
  }()
};
cljs.core.trampoline = function() {
  var trampoline = null;
  var trampoline__14080 = function(f) {
    while(true) {
      var ret__14079 = f.call(null);
      if(cljs.core.truth_(cljs.core.fn_QMARK_.call(null, ret__14079))) {
        var G__14083 = ret__14079;
        f = G__14083;
        continue
      }else {
        return ret__14079
      }
      break
    }
  };
  var trampoline__14081 = function() {
    var G__14084__delegate = function(f, args) {
      return trampoline.call(null, function() {
        return cljs.core.apply.call(null, f, args)
      })
    };
    var G__14084 = function(f, var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__14084__delegate.call(this, f, args)
    };
    G__14084.cljs$lang$maxFixedArity = 1;
    G__14084.cljs$lang$applyTo = function(arglist__14085) {
      var f = cljs.core.first(arglist__14085);
      var args = cljs.core.rest(arglist__14085);
      return G__14084__delegate.call(this, f, args)
    };
    return G__14084
  }();
  trampoline = function(f, var_args) {
    var args = var_args;
    switch(arguments.length) {
      case 1:
        return trampoline__14080.call(this, f);
      default:
        return trampoline__14081.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  trampoline.cljs$lang$maxFixedArity = 1;
  trampoline.cljs$lang$applyTo = trampoline__14081.cljs$lang$applyTo;
  return trampoline
}();
cljs.core.rand = function() {
  var rand = null;
  var rand__14086 = function() {
    return rand.call(null, 1)
  };
  var rand__14087 = function(n) {
    return Math.random() * n
  };
  rand = function(n) {
    switch(arguments.length) {
      case 0:
        return rand__14086.call(this);
      case 1:
        return rand__14087.call(this, n)
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
    var k__14089 = f.call(null, x);
    return cljs.core.assoc.call(null, ret, k__14089, cljs.core.conj.call(null, cljs.core.get.call(null, ret, k__14089, cljs.core.PersistentVector.fromArray([])), x))
  }, cljs.core.ObjMap.fromObject([], {}), coll)
};
cljs.core.make_hierarchy = function make_hierarchy() {
  return cljs.core.ObjMap.fromObject(["\ufdd0'parents", "\ufdd0'descendants", "\ufdd0'ancestors"], {"\ufdd0'parents":cljs.core.ObjMap.fromObject([], {}), "\ufdd0'descendants":cljs.core.ObjMap.fromObject([], {}), "\ufdd0'ancestors":cljs.core.ObjMap.fromObject([], {})})
};
cljs.core.global_hierarchy = cljs.core.atom.call(null, cljs.core.make_hierarchy.call(null));
cljs.core.isa_QMARK_ = function() {
  var isa_QMARK_ = null;
  var isa_QMARK___14098 = function(child, parent) {
    return isa_QMARK_.call(null, cljs.core.deref.call(null, cljs.core.global_hierarchy), child, parent)
  };
  var isa_QMARK___14099 = function(h, child, parent) {
    var or__3824__auto____14090 = cljs.core._EQ_.call(null, child, parent);
    if(cljs.core.truth_(or__3824__auto____14090)) {
      return or__3824__auto____14090
    }else {
      var or__3824__auto____14091 = cljs.core.contains_QMARK_.call(null, "\ufdd0'ancestors".call(null, h).call(null, child), parent);
      if(cljs.core.truth_(or__3824__auto____14091)) {
        return or__3824__auto____14091
      }else {
        var and__3822__auto____14092 = cljs.core.vector_QMARK_.call(null, parent);
        if(cljs.core.truth_(and__3822__auto____14092)) {
          var and__3822__auto____14093 = cljs.core.vector_QMARK_.call(null, child);
          if(cljs.core.truth_(and__3822__auto____14093)) {
            var and__3822__auto____14094 = cljs.core._EQ_.call(null, cljs.core.count.call(null, parent), cljs.core.count.call(null, child));
            if(cljs.core.truth_(and__3822__auto____14094)) {
              var ret__14095 = true;
              var i__14096 = 0;
              while(true) {
                if(cljs.core.truth_(function() {
                  var or__3824__auto____14097 = cljs.core.not.call(null, ret__14095);
                  if(cljs.core.truth_(or__3824__auto____14097)) {
                    return or__3824__auto____14097
                  }else {
                    return cljs.core._EQ_.call(null, i__14096, cljs.core.count.call(null, parent))
                  }
                }())) {
                  return ret__14095
                }else {
                  var G__14101 = isa_QMARK_.call(null, h, child.call(null, i__14096), parent.call(null, i__14096));
                  var G__14102 = i__14096 + 1;
                  ret__14095 = G__14101;
                  i__14096 = G__14102;
                  continue
                }
                break
              }
            }else {
              return and__3822__auto____14094
            }
          }else {
            return and__3822__auto____14093
          }
        }else {
          return and__3822__auto____14092
        }
      }
    }
  };
  isa_QMARK_ = function(h, child, parent) {
    switch(arguments.length) {
      case 2:
        return isa_QMARK___14098.call(this, h, child);
      case 3:
        return isa_QMARK___14099.call(this, h, child, parent)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return isa_QMARK_
}();
cljs.core.parents = function() {
  var parents = null;
  var parents__14103 = function(tag) {
    return parents.call(null, cljs.core.deref.call(null, cljs.core.global_hierarchy), tag)
  };
  var parents__14104 = function(h, tag) {
    return cljs.core.not_empty.call(null, cljs.core.get.call(null, "\ufdd0'parents".call(null, h), tag))
  };
  parents = function(h, tag) {
    switch(arguments.length) {
      case 1:
        return parents__14103.call(this, h);
      case 2:
        return parents__14104.call(this, h, tag)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return parents
}();
cljs.core.ancestors = function() {
  var ancestors = null;
  var ancestors__14106 = function(tag) {
    return ancestors.call(null, cljs.core.deref.call(null, cljs.core.global_hierarchy), tag)
  };
  var ancestors__14107 = function(h, tag) {
    return cljs.core.not_empty.call(null, cljs.core.get.call(null, "\ufdd0'ancestors".call(null, h), tag))
  };
  ancestors = function(h, tag) {
    switch(arguments.length) {
      case 1:
        return ancestors__14106.call(this, h);
      case 2:
        return ancestors__14107.call(this, h, tag)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return ancestors
}();
cljs.core.descendants = function() {
  var descendants = null;
  var descendants__14109 = function(tag) {
    return descendants.call(null, cljs.core.deref.call(null, cljs.core.global_hierarchy), tag)
  };
  var descendants__14110 = function(h, tag) {
    return cljs.core.not_empty.call(null, cljs.core.get.call(null, "\ufdd0'descendants".call(null, h), tag))
  };
  descendants = function(h, tag) {
    switch(arguments.length) {
      case 1:
        return descendants__14109.call(this, h);
      case 2:
        return descendants__14110.call(this, h, tag)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return descendants
}();
cljs.core.derive = function() {
  var derive = null;
  var derive__14120 = function(tag, parent) {
    if(cljs.core.truth_(cljs.core.namespace.call(null, parent))) {
    }else {
      throw new Error(cljs.core.str.call(null, "Assert failed: ", cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'namespace", "\ufdd1'parent"), cljs.core.hash_map("\ufdd0'line", 3566)))));
    }
    cljs.core.swap_BANG_.call(null, cljs.core.global_hierarchy, derive, tag, parent);
    return null
  };
  var derive__14121 = function(h, tag, parent) {
    if(cljs.core.truth_(cljs.core.not_EQ_.call(null, tag, parent))) {
    }else {
      throw new Error(cljs.core.str.call(null, "Assert failed: ", cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'not=", "\ufdd1'tag", "\ufdd1'parent"), cljs.core.hash_map("\ufdd0'line", 3570)))));
    }
    var tp__14115 = "\ufdd0'parents".call(null, h);
    var td__14116 = "\ufdd0'descendants".call(null, h);
    var ta__14117 = "\ufdd0'ancestors".call(null, h);
    var tf__14118 = function(m, source, sources, target, targets) {
      return cljs.core.reduce.call(null, function(ret, k) {
        return cljs.core.assoc.call(null, ret, k, cljs.core.reduce.call(null, cljs.core.conj, cljs.core.get.call(null, targets, k, cljs.core.set([])), cljs.core.cons.call(null, target, targets.call(null, target))))
      }, m, cljs.core.cons.call(null, source, sources.call(null, source)))
    };
    var or__3824__auto____14119 = cljs.core.truth_(cljs.core.contains_QMARK_.call(null, tp__14115.call(null, tag), parent)) ? null : function() {
      if(cljs.core.truth_(cljs.core.contains_QMARK_.call(null, ta__14117.call(null, tag), parent))) {
        throw new Error(cljs.core.str.call(null, tag, "already has", parent, "as ancestor"));
      }else {
      }
      if(cljs.core.truth_(cljs.core.contains_QMARK_.call(null, ta__14117.call(null, parent), tag))) {
        throw new Error(cljs.core.str.call(null, "Cyclic derivation:", parent, "has", tag, "as ancestor"));
      }else {
      }
      return cljs.core.ObjMap.fromObject(["\ufdd0'parents", "\ufdd0'ancestors", "\ufdd0'descendants"], {"\ufdd0'parents":cljs.core.assoc.call(null, "\ufdd0'parents".call(null, h), tag, cljs.core.conj.call(null, cljs.core.get.call(null, tp__14115, tag, cljs.core.set([])), parent)), "\ufdd0'ancestors":tf__14118.call(null, "\ufdd0'ancestors".call(null, h), tag, td__14116, parent, ta__14117), "\ufdd0'descendants":tf__14118.call(null, "\ufdd0'descendants".call(null, h), parent, ta__14117, tag, td__14116)})
    }();
    if(cljs.core.truth_(or__3824__auto____14119)) {
      return or__3824__auto____14119
    }else {
      return h
    }
  };
  derive = function(h, tag, parent) {
    switch(arguments.length) {
      case 2:
        return derive__14120.call(this, h, tag);
      case 3:
        return derive__14121.call(this, h, tag, parent)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return derive
}();
cljs.core.underive = function() {
  var underive = null;
  var underive__14127 = function(tag, parent) {
    cljs.core.swap_BANG_.call(null, cljs.core.global_hierarchy, underive, tag, parent);
    return null
  };
  var underive__14128 = function(h, tag, parent) {
    var parentMap__14123 = "\ufdd0'parents".call(null, h);
    var childsParents__14124 = cljs.core.truth_(parentMap__14123.call(null, tag)) ? cljs.core.disj.call(null, parentMap__14123.call(null, tag), parent) : cljs.core.set([]);
    var newParents__14125 = cljs.core.truth_(cljs.core.not_empty.call(null, childsParents__14124)) ? cljs.core.assoc.call(null, parentMap__14123, tag, childsParents__14124) : cljs.core.dissoc.call(null, parentMap__14123, tag);
    var deriv_seq__14126 = cljs.core.flatten.call(null, cljs.core.map.call(null, function(p1__14112_SHARP_) {
      return cljs.core.cons.call(null, cljs.core.first.call(null, p1__14112_SHARP_), cljs.core.interpose.call(null, cljs.core.first.call(null, p1__14112_SHARP_), cljs.core.second.call(null, p1__14112_SHARP_)))
    }, cljs.core.seq.call(null, newParents__14125)));
    if(cljs.core.truth_(cljs.core.contains_QMARK_.call(null, parentMap__14123.call(null, tag), parent))) {
      return cljs.core.reduce.call(null, function(p1__14113_SHARP_, p2__14114_SHARP_) {
        return cljs.core.apply.call(null, cljs.core.derive, p1__14113_SHARP_, p2__14114_SHARP_)
      }, cljs.core.make_hierarchy.call(null), cljs.core.partition.call(null, 2, deriv_seq__14126))
    }else {
      return h
    }
  };
  underive = function(h, tag, parent) {
    switch(arguments.length) {
      case 2:
        return underive__14127.call(this, h, tag);
      case 3:
        return underive__14128.call(this, h, tag, parent)
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
  var xprefs__14130 = cljs.core.deref.call(null, prefer_table).call(null, x);
  var or__3824__auto____14132 = cljs.core.truth_(function() {
    var and__3822__auto____14131 = xprefs__14130;
    if(cljs.core.truth_(and__3822__auto____14131)) {
      return xprefs__14130.call(null, y)
    }else {
      return and__3822__auto____14131
    }
  }()) ? true : null;
  if(cljs.core.truth_(or__3824__auto____14132)) {
    return or__3824__auto____14132
  }else {
    var or__3824__auto____14134 = function() {
      var ps__14133 = cljs.core.parents.call(null, y);
      while(true) {
        if(cljs.core.truth_(cljs.core.count.call(null, ps__14133) > 0)) {
          if(cljs.core.truth_(prefers_STAR_.call(null, x, cljs.core.first.call(null, ps__14133), prefer_table))) {
          }else {
          }
          var G__14137 = cljs.core.rest.call(null, ps__14133);
          ps__14133 = G__14137;
          continue
        }else {
          return null
        }
        break
      }
    }();
    if(cljs.core.truth_(or__3824__auto____14134)) {
      return or__3824__auto____14134
    }else {
      var or__3824__auto____14136 = function() {
        var ps__14135 = cljs.core.parents.call(null, x);
        while(true) {
          if(cljs.core.truth_(cljs.core.count.call(null, ps__14135) > 0)) {
            if(cljs.core.truth_(prefers_STAR_.call(null, cljs.core.first.call(null, ps__14135), y, prefer_table))) {
            }else {
            }
            var G__14138 = cljs.core.rest.call(null, ps__14135);
            ps__14135 = G__14138;
            continue
          }else {
            return null
          }
          break
        }
      }();
      if(cljs.core.truth_(or__3824__auto____14136)) {
        return or__3824__auto____14136
      }else {
        return false
      }
    }
  }
};
cljs.core.dominates = function dominates(x, y, prefer_table) {
  var or__3824__auto____14139 = cljs.core.prefers_STAR_.call(null, x, y, prefer_table);
  if(cljs.core.truth_(or__3824__auto____14139)) {
    return or__3824__auto____14139
  }else {
    return cljs.core.isa_QMARK_.call(null, x, y)
  }
};
cljs.core.find_and_cache_best_method = function find_and_cache_best_method(name, dispatch_val, hierarchy, method_table, prefer_table, method_cache, cached_hierarchy) {
  var best_entry__14148 = cljs.core.reduce.call(null, function(be, p__14140) {
    var vec__14141__14142 = p__14140;
    var k__14143 = cljs.core.nth.call(null, vec__14141__14142, 0, null);
    var ___14144 = cljs.core.nth.call(null, vec__14141__14142, 1, null);
    var e__14145 = vec__14141__14142;
    if(cljs.core.truth_(cljs.core.isa_QMARK_.call(null, dispatch_val, k__14143))) {
      var be2__14147 = cljs.core.truth_(function() {
        var or__3824__auto____14146 = be === null;
        if(cljs.core.truth_(or__3824__auto____14146)) {
          return or__3824__auto____14146
        }else {
          return cljs.core.dominates.call(null, k__14143, cljs.core.first.call(null, be), prefer_table)
        }
      }()) ? e__14145 : be;
      if(cljs.core.truth_(cljs.core.dominates.call(null, cljs.core.first.call(null, be2__14147), k__14143, prefer_table))) {
      }else {
        throw new Error(cljs.core.str.call(null, "Multiple methods in multimethod '", name, "' match dispatch value: ", dispatch_val, " -> ", k__14143, " and ", cljs.core.first.call(null, be2__14147), ", and neither is preferred"));
      }
      return be2__14147
    }else {
      return be
    }
  }, null, cljs.core.deref.call(null, method_table));
  if(cljs.core.truth_(best_entry__14148)) {
    if(cljs.core.truth_(cljs.core._EQ_.call(null, cljs.core.deref.call(null, cached_hierarchy), cljs.core.deref.call(null, hierarchy)))) {
      cljs.core.swap_BANG_.call(null, method_cache, cljs.core.assoc, dispatch_val, cljs.core.second.call(null, best_entry__14148));
      return cljs.core.second.call(null, best_entry__14148)
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
    var and__3822__auto____14149 = mf;
    if(cljs.core.truth_(and__3822__auto____14149)) {
      return mf.cljs$core$IMultiFn$_reset
    }else {
      return and__3822__auto____14149
    }
  }())) {
    return mf.cljs$core$IMultiFn$_reset(mf)
  }else {
    return function() {
      var or__3824__auto____14150 = cljs.core._reset[goog.typeOf.call(null, mf)];
      if(cljs.core.truth_(or__3824__auto____14150)) {
        return or__3824__auto____14150
      }else {
        var or__3824__auto____14151 = cljs.core._reset["_"];
        if(cljs.core.truth_(or__3824__auto____14151)) {
          return or__3824__auto____14151
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-reset", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._add_method = function _add_method(mf, dispatch_val, method) {
  if(cljs.core.truth_(function() {
    var and__3822__auto____14152 = mf;
    if(cljs.core.truth_(and__3822__auto____14152)) {
      return mf.cljs$core$IMultiFn$_add_method
    }else {
      return and__3822__auto____14152
    }
  }())) {
    return mf.cljs$core$IMultiFn$_add_method(mf, dispatch_val, method)
  }else {
    return function() {
      var or__3824__auto____14153 = cljs.core._add_method[goog.typeOf.call(null, mf)];
      if(cljs.core.truth_(or__3824__auto____14153)) {
        return or__3824__auto____14153
      }else {
        var or__3824__auto____14154 = cljs.core._add_method["_"];
        if(cljs.core.truth_(or__3824__auto____14154)) {
          return or__3824__auto____14154
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-add-method", mf);
        }
      }
    }().call(null, mf, dispatch_val, method)
  }
};
cljs.core._remove_method = function _remove_method(mf, dispatch_val) {
  if(cljs.core.truth_(function() {
    var and__3822__auto____14155 = mf;
    if(cljs.core.truth_(and__3822__auto____14155)) {
      return mf.cljs$core$IMultiFn$_remove_method
    }else {
      return and__3822__auto____14155
    }
  }())) {
    return mf.cljs$core$IMultiFn$_remove_method(mf, dispatch_val)
  }else {
    return function() {
      var or__3824__auto____14156 = cljs.core._remove_method[goog.typeOf.call(null, mf)];
      if(cljs.core.truth_(or__3824__auto____14156)) {
        return or__3824__auto____14156
      }else {
        var or__3824__auto____14157 = cljs.core._remove_method["_"];
        if(cljs.core.truth_(or__3824__auto____14157)) {
          return or__3824__auto____14157
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-remove-method", mf);
        }
      }
    }().call(null, mf, dispatch_val)
  }
};
cljs.core._prefer_method = function _prefer_method(mf, dispatch_val, dispatch_val_y) {
  if(cljs.core.truth_(function() {
    var and__3822__auto____14158 = mf;
    if(cljs.core.truth_(and__3822__auto____14158)) {
      return mf.cljs$core$IMultiFn$_prefer_method
    }else {
      return and__3822__auto____14158
    }
  }())) {
    return mf.cljs$core$IMultiFn$_prefer_method(mf, dispatch_val, dispatch_val_y)
  }else {
    return function() {
      var or__3824__auto____14159 = cljs.core._prefer_method[goog.typeOf.call(null, mf)];
      if(cljs.core.truth_(or__3824__auto____14159)) {
        return or__3824__auto____14159
      }else {
        var or__3824__auto____14160 = cljs.core._prefer_method["_"];
        if(cljs.core.truth_(or__3824__auto____14160)) {
          return or__3824__auto____14160
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-prefer-method", mf);
        }
      }
    }().call(null, mf, dispatch_val, dispatch_val_y)
  }
};
cljs.core._get_method = function _get_method(mf, dispatch_val) {
  if(cljs.core.truth_(function() {
    var and__3822__auto____14161 = mf;
    if(cljs.core.truth_(and__3822__auto____14161)) {
      return mf.cljs$core$IMultiFn$_get_method
    }else {
      return and__3822__auto____14161
    }
  }())) {
    return mf.cljs$core$IMultiFn$_get_method(mf, dispatch_val)
  }else {
    return function() {
      var or__3824__auto____14162 = cljs.core._get_method[goog.typeOf.call(null, mf)];
      if(cljs.core.truth_(or__3824__auto____14162)) {
        return or__3824__auto____14162
      }else {
        var or__3824__auto____14163 = cljs.core._get_method["_"];
        if(cljs.core.truth_(or__3824__auto____14163)) {
          return or__3824__auto____14163
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-get-method", mf);
        }
      }
    }().call(null, mf, dispatch_val)
  }
};
cljs.core._methods = function _methods(mf) {
  if(cljs.core.truth_(function() {
    var and__3822__auto____14164 = mf;
    if(cljs.core.truth_(and__3822__auto____14164)) {
      return mf.cljs$core$IMultiFn$_methods
    }else {
      return and__3822__auto____14164
    }
  }())) {
    return mf.cljs$core$IMultiFn$_methods(mf)
  }else {
    return function() {
      var or__3824__auto____14165 = cljs.core._methods[goog.typeOf.call(null, mf)];
      if(cljs.core.truth_(or__3824__auto____14165)) {
        return or__3824__auto____14165
      }else {
        var or__3824__auto____14166 = cljs.core._methods["_"];
        if(cljs.core.truth_(or__3824__auto____14166)) {
          return or__3824__auto____14166
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-methods", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._prefers = function _prefers(mf) {
  if(cljs.core.truth_(function() {
    var and__3822__auto____14167 = mf;
    if(cljs.core.truth_(and__3822__auto____14167)) {
      return mf.cljs$core$IMultiFn$_prefers
    }else {
      return and__3822__auto____14167
    }
  }())) {
    return mf.cljs$core$IMultiFn$_prefers(mf)
  }else {
    return function() {
      var or__3824__auto____14168 = cljs.core._prefers[goog.typeOf.call(null, mf)];
      if(cljs.core.truth_(or__3824__auto____14168)) {
        return or__3824__auto____14168
      }else {
        var or__3824__auto____14169 = cljs.core._prefers["_"];
        if(cljs.core.truth_(or__3824__auto____14169)) {
          return or__3824__auto____14169
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-prefers", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._dispatch = function _dispatch(mf, args) {
  if(cljs.core.truth_(function() {
    var and__3822__auto____14170 = mf;
    if(cljs.core.truth_(and__3822__auto____14170)) {
      return mf.cljs$core$IMultiFn$_dispatch
    }else {
      return and__3822__auto____14170
    }
  }())) {
    return mf.cljs$core$IMultiFn$_dispatch(mf, args)
  }else {
    return function() {
      var or__3824__auto____14171 = cljs.core._dispatch[goog.typeOf.call(null, mf)];
      if(cljs.core.truth_(or__3824__auto____14171)) {
        return or__3824__auto____14171
      }else {
        var or__3824__auto____14172 = cljs.core._dispatch["_"];
        if(cljs.core.truth_(or__3824__auto____14172)) {
          return or__3824__auto____14172
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-dispatch", mf);
        }
      }
    }().call(null, mf, args)
  }
};
cljs.core.do_dispatch = function do_dispatch(mf, dispatch_fn, args) {
  var dispatch_val__14173 = cljs.core.apply.call(null, dispatch_fn, args);
  var target_fn__14174 = cljs.core._get_method.call(null, mf, dispatch_val__14173);
  if(cljs.core.truth_(target_fn__14174)) {
  }else {
    throw new Error(cljs.core.str.call(null, "No method in multimethod '", cljs.core.name, "' for dispatch value: ", dispatch_val__14173));
  }
  return cljs.core.apply.call(null, target_fn__14174, args)
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
  var this__14175 = this;
  return goog.getUid.call(null, this$)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$ = true;
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_reset = function(mf) {
  var this__14176 = this;
  cljs.core.swap_BANG_.call(null, this__14176.method_table, function(mf) {
    return cljs.core.ObjMap.fromObject([], {})
  });
  cljs.core.swap_BANG_.call(null, this__14176.method_cache, function(mf) {
    return cljs.core.ObjMap.fromObject([], {})
  });
  cljs.core.swap_BANG_.call(null, this__14176.prefer_table, function(mf) {
    return cljs.core.ObjMap.fromObject([], {})
  });
  cljs.core.swap_BANG_.call(null, this__14176.cached_hierarchy, function(mf) {
    return null
  });
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_add_method = function(mf, dispatch_val, method) {
  var this__14177 = this;
  cljs.core.swap_BANG_.call(null, this__14177.method_table, cljs.core.assoc, dispatch_val, method);
  cljs.core.reset_cache.call(null, this__14177.method_cache, this__14177.method_table, this__14177.cached_hierarchy, this__14177.hierarchy);
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_remove_method = function(mf, dispatch_val) {
  var this__14178 = this;
  cljs.core.swap_BANG_.call(null, this__14178.method_table, cljs.core.dissoc, dispatch_val);
  cljs.core.reset_cache.call(null, this__14178.method_cache, this__14178.method_table, this__14178.cached_hierarchy, this__14178.hierarchy);
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_get_method = function(mf, dispatch_val) {
  var this__14179 = this;
  if(cljs.core.truth_(cljs.core._EQ_.call(null, cljs.core.deref.call(null, this__14179.cached_hierarchy), cljs.core.deref.call(null, this__14179.hierarchy)))) {
  }else {
    cljs.core.reset_cache.call(null, this__14179.method_cache, this__14179.method_table, this__14179.cached_hierarchy, this__14179.hierarchy)
  }
  var temp__3971__auto____14180 = cljs.core.deref.call(null, this__14179.method_cache).call(null, dispatch_val);
  if(cljs.core.truth_(temp__3971__auto____14180)) {
    var target_fn__14181 = temp__3971__auto____14180;
    return target_fn__14181
  }else {
    var temp__3971__auto____14182 = cljs.core.find_and_cache_best_method.call(null, this__14179.name, dispatch_val, this__14179.hierarchy, this__14179.method_table, this__14179.prefer_table, this__14179.method_cache, this__14179.cached_hierarchy);
    if(cljs.core.truth_(temp__3971__auto____14182)) {
      var target_fn__14183 = temp__3971__auto____14182;
      return target_fn__14183
    }else {
      return cljs.core.deref.call(null, this__14179.method_table).call(null, this__14179.default_dispatch_val)
    }
  }
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_prefer_method = function(mf, dispatch_val_x, dispatch_val_y) {
  var this__14184 = this;
  if(cljs.core.truth_(cljs.core.prefers_STAR_.call(null, dispatch_val_x, dispatch_val_y, this__14184.prefer_table))) {
    throw new Error(cljs.core.str.call(null, "Preference conflict in multimethod '", this__14184.name, "': ", dispatch_val_y, " is already preferred to ", dispatch_val_x));
  }else {
  }
  cljs.core.swap_BANG_.call(null, this__14184.prefer_table, function(old) {
    return cljs.core.assoc.call(null, old, dispatch_val_x, cljs.core.conj.call(null, cljs.core.get.call(null, old, dispatch_val_x, cljs.core.set([])), dispatch_val_y))
  });
  return cljs.core.reset_cache.call(null, this__14184.method_cache, this__14184.method_table, this__14184.cached_hierarchy, this__14184.hierarchy)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_methods = function(mf) {
  var this__14185 = this;
  return cljs.core.deref.call(null, this__14185.method_table)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_prefers = function(mf) {
  var this__14186 = this;
  return cljs.core.deref.call(null, this__14186.prefer_table)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_dispatch = function(mf, args) {
  var this__14187 = this;
  return cljs.core.do_dispatch.call(null, mf, this__14187.dispatch_fn, args)
};
cljs.core.MultiFn;
cljs.core.MultiFn.prototype.call = function() {
  var G__14188__delegate = function(_, args) {
    return cljs.core._dispatch.call(null, this, args)
  };
  var G__14188 = function(_, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return G__14188__delegate.call(this, _, args)
  };
  G__14188.cljs$lang$maxFixedArity = 1;
  G__14188.cljs$lang$applyTo = function(arglist__14189) {
    var _ = cljs.core.first(arglist__14189);
    var args = cljs.core.rest(arglist__14189);
    return G__14188__delegate.call(this, _, args)
  };
  return G__14188
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
goog.provide("onedit.core");
goog.require("cljs.core");
goog.require("goog.dom");
goog.require("goog.net.XhrIo");
goog.require("goog.debug.Logger");
onedit.core.logger = goog.debug.Logger.getLogger.call(null, "onedit");
onedit.core.jquery = $;
onedit.core.log = function log(p1__12356_SHARP_) {
  return onedit.core.logger.info(p1__12356_SHARP_)
};
onedit.core.filenames_map = cljs.core.ObjMap.fromObject([], {});
onedit.core.unique_name = function unique_name(name) {
  var vec__12358__12361 = function() {
    var temp__3971__auto____12359 = onedit.core.filenames_map.call(null, name);
    if(cljs.core.truth_(temp__3971__auto____12359)) {
      var names__12360 = temp__3971__auto____12359;
      return cljs.core.PersistentVector.fromArray([cljs.core.str.call(null, name, "-", cljs.core.count.call(null, names__12360) + 1), names__12360])
    }else {
      return cljs.core.PersistentVector.fromArray([name, cljs.core.PersistentVector.fromArray([])])
    }
  }();
  var unique__12362 = cljs.core.nth.call(null, vec__12358__12361, 0, null);
  var names__12363 = cljs.core.nth.call(null, vec__12358__12361, 1, null);
  onedit.core.filenames_map = cljs.core.assoc.call(null, onedit.core.filenames_map, name, cljs.core.conj.call(null, names__12363, unique__12362));
  return unique__12362
};
onedit.core.send = function send(url, method, content, headers, timeout_interval) {
  return function(p1__12357_SHARP_) {
    return goog.net.XhrIo.send.call(null, url, function(xhr) {
      return p1__12357_SHARP_.call(null, xhr.target)
    }, method, content, headers, timeout_interval)
  }
};
onedit.core.bind = function bind(f, g) {
  return function(p1__12364_SHARP_) {
    return f.call(null, function(x) {
      return g.call(null, x).call(null, p1__12364_SHARP_)
    })
  }
};
onedit.core.fmap = function fmap(f, g) {
  return function(p1__12365_SHARP_) {
    return f.call(null, function(x) {
      return p1__12365_SHARP_.call(null, g.call(null, x))
    })
  }
};
goog.provide("onedit.tab");
goog.require("cljs.core");
goog.require("onedit.core");
goog.require("goog.object");
goog.require("goog.dom");
goog.require("goog.events");
onedit.tab.get_tab = function get_tab() {
  return onedit.core.jquery.call(null, ".nav-tabs .active a")
};
onedit.tab.data = function() {
  var data = null;
  var data__12367 = function(key) {
    return onedit.tab.get_tab.call(null).data(key)
  };
  var data__12368 = function(key, value) {
    return onedit.tab.get_tab.call(null).data(key, value)
  };
  data = function(key, value) {
    switch(arguments.length) {
      case 1:
        return data__12367.call(this, key);
      case 2:
        return data__12368.call(this, key, value)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return data
}();
onedit.tab.set_name = function set_name(name) {
  var tab__12371 = onedit.tab.get_tab.call(null);
  onedit.tab.data.call(null, "filename", name);
  return tab__12371.text(name)
};
onedit.tab.show = function show(p1__12370_SHARP_) {
  return p1__12370_SHARP_.tab("show")
};
onedit.tab.add = function add(name, elem) {
  var id__12372 = onedit.core.unique_name.call(null, name);
  var a__12373 = goog.dom.createDom.call(null, "a", goog.object.create.call(null, "href", cljs.core.str.call(null, "#", id__12372)), id__12372);
  var div__12374 = goog.dom.createDom.call(null, "div", goog.object.create.call(null, "id", id__12372, "class", "tab-pane"), elem);
  onedit.core.jquery.call(null, ".nav-tabs").append(goog.dom.createDom.call(null, "li", null, a__12373));
  onedit.core.jquery.call(null, ".tab-content").append(div__12374);
  goog.events.listen.call(null, a__12373, goog.events.EventType.CLICK, function(e) {
    onedit.core.log.call(null, e.target);
    e.preventDefault();
    return onedit.tab.show.call(null, onedit.core.jquery.call(null, e.target))
  });
  return onedit.tab.show.call(null, onedit.core.jquery.call(null, a__12373))
};
goog.provide("onedit.buffer");
goog.require("cljs.core");
goog.require("onedit.core");
goog.require("onedit.tab");
goog.require("goog.dom");
onedit.buffer.get_buffer = function get_buffer() {
  return onedit.core.jquery.call(null, ".tab-content .active pre")
};
onedit.buffer.element = function element() {
  return onedit.buffer.get_buffer.call(null)[0]
};
onedit.buffer.set_html = function set_html(p1__12366_SHARP_) {
  return onedit.buffer.get_buffer.call(null).html(p1__12366_SHARP_)
};
onedit.buffer.content = cljs.core.comp.call(null, goog.dom.getRawTextContent, onedit.buffer.element);
goog.provide("onedit.highlighter");
goog.require("cljs.core");
goog.require("onedit.core");
goog.require("onedit.tab");
goog.require("onedit.buffer");
goog.require("goog.object");
goog.require("goog.string");
onedit.highlighter.language = function language(lang) {
  onedit.buffer.get_buffer.call(null).attr("class", cljs.core.str.call(null, "prettyprint lang-", lang));
  return prettyPrint.call(null)
};
onedit.highlighter.filename = function filename(name) {
  return onedit.highlighter.language.call(null, cljs.core.last.call(null, cljs.core.re_seq.call(null, /\./, name)))
};
onedit.highlighter.highlight = function highlight() {
  var tab__12392 = onedit.tab.get_tab.call(null);
  var temp__3971__auto____12393 = onedit.tab.get_tab.call(null).data("language");
  if(cljs.core.truth_(temp__3971__auto____12393)) {
    var lang__12394 = temp__3971__auto____12393;
    return onedit.highlighter.language.call(null, lang__12394)
  }else {
    return onedit.highlighter.filename.call(null, onedit.tab.get_tab.call(null).text())
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
goog.provide("onedit.file");
goog.require("cljs.core");
goog.require("goog.events.FileDropHandler");
goog.require("goog.events");
goog.require("onedit.buffer");
goog.require("onedit.tab");
goog.require("goog.dom");
goog.require("onedit.highlighter");
goog.require("goog.ui.FormPost");
goog.require("goog.object");
goog.require("onedit.core");
onedit.file.open = function open(target) {
  var reader__12375 = new FileReader;
  var file__12376 = target.files[0];
  onedit.tab.set_name.call(null, file__12376.name);
  reader__12375.onload = function(e) {
    onedit.buffer.set_html.call(null, e.target.result);
    return onedit.highlighter.filename.call(null, file__12376.name)
  };
  return reader__12375.readAsText(file__12376)
};
onedit.file.save = function save() {
  var text__12377 = onedit.buffer.content.call(null);
  if(cljs.core.truth_(cljs.core.empty_QMARK_.call(null, text__12377))) {
    return null
  }else {
    return(new goog.ui.FormPost).post(goog.object.create.call(null, "content", text__12377), cljs.core.str.call(null, "save/", onedit.tab.data.call(null, "filename")))
  }
};
onedit.file.blur = function blur(e) {
  return onedit.highlighter.highlight.call(null)
};
onedit.file.delayed_change = function delayed_change(e) {
  return null
};
cljs.core.drop = function drop(e) {
  var browser__12378 = e.getBrowserEvent();
  return onedit.file.open.call(null, browser__12378.dataTransfer)
};
onedit.file.create = function() {
  var create = null;
  var create__12382 = function(name) {
    return create.call(null, name, "")
  };
  var create__12383 = function(name, content) {
    var pre__12381 = function() {
      var G__12379__12380 = goog.dom.createDom.call(null, "pre", goog.object.create.call(null, "class", "prettyprint"), content);
      G__12379__12380.setAttribute("contenteditable", "true");
      goog.events.listen.call(null, G__12379__12380, "DOMCharacterDataModified", onedit.file.delayed_change);
      goog.events.listen.call(null, G__12379__12380, goog.events.EventType.BLUR, onedit.file.blur);
      return G__12379__12380
    }();
    goog.events.listen.call(null, new goog.events.FileDropHandler(pre__12381), goog.events.FileDropHandler.EventType.DROP, cljs.core.drop);
    return onedit.tab.add.call(null, name, pre__12381)
  };
  create = function(name, content) {
    switch(arguments.length) {
      case 1:
        return create__12382.call(this, name);
      case 2:
        return create__12383.call(this, name, content)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return create
}();
onedit.file.listen = function listen() {
  var file__12385 = onedit.core.jquery.call(null, "#file");
  onedit.core.jquery.call(null, "#new-tab").click(function() {
    return onedit.file.create.call(null, "scratch")
  });
  onedit.core.jquery.call(null, "#open").click(function() {
    return file__12385.click()
  });
  file__12385.change(function(e) {
    return onedit.file.open.call(null, e.target)
  });
  return onedit.core.jquery.call(null, "#save").click(onedit.file.save)
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
goog.provide("onedit");
goog.require("cljs.core");
goog.require("onedit.core");
goog.require("onedit.file");
goog.require("goog.debug.Console");
onedit.init = function init() {
  goog.debug.Console.autoInstall.call(null);
  onedit.file.create.call(null, "scratch");
  return onedit.file.listen.call(null)
};
goog.provide("onedit.live");
goog.require("cljs.core");
goog.require("onedit.core");
goog.require("onedit.tab");
goog.require("onedit.file");
onedit.live.live = function() {
  var live = null;
  var live__12389 = function() {
    var socket__12386 = new WebSocket(cljs.core.str.call(null, "ws://localhost:5000/live/", onedit.tab.get.call(null).attr("id")));
    socket__12386.onmessage = function(e) {
      return onedit.core.log.call(null, e.data)
    };
    return onedit.tab.data.call(null, "socket", socket__12386)
  };
  var live__12390 = function(id, filename) {
    onedit.file.create.call(null, filename);
    var socket__12387 = new WebSocket(cljs.core.str.call(null, "ws://localhost:5000/live/", id, "/", filename));
    var i__12388 = onedit.tab.get.call(null).attr("id");
    onedit.core.log.call(null, i__12388);
    return socket__12387.onmessage = function(e) {
      onedit.core.log.call(null, e.data);
      return onedit.core.jquery.call(null, cljs.core.str.call(null, "#", i__12388)).html(e.data)
    }
  };
  live = function(id, filename) {
    switch(arguments.length) {
      case 0:
        return live__12389.call(this);
      case 2:
        return live__12390.call(this, id, filename)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return live
}();
