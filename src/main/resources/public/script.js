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
  var or__3548__auto____51651 = p[goog.typeOf.call(null, x)];
  if(cljs.core.truth_(or__3548__auto____51651)) {
    return or__3548__auto____51651
  }else {
    var or__3548__auto____51652 = p["_"];
    if(cljs.core.truth_(or__3548__auto____51652)) {
      return or__3548__auto____51652
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
  var _invoke__51716 = function(this$) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____51653 = this$;
      if(cljs.core.truth_(and__3546__auto____51653)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____51653
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$)
    }else {
      return function() {
        var or__3548__auto____51654 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____51654)) {
          return or__3548__auto____51654
        }else {
          var or__3548__auto____51655 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____51655)) {
            return or__3548__auto____51655
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$)
    }
  };
  var _invoke__51717 = function(this$, a) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____51656 = this$;
      if(cljs.core.truth_(and__3546__auto____51656)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____51656
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a)
    }else {
      return function() {
        var or__3548__auto____51657 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____51657)) {
          return or__3548__auto____51657
        }else {
          var or__3548__auto____51658 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____51658)) {
            return or__3548__auto____51658
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a)
    }
  };
  var _invoke__51718 = function(this$, a, b) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____51659 = this$;
      if(cljs.core.truth_(and__3546__auto____51659)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____51659
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b)
    }else {
      return function() {
        var or__3548__auto____51660 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____51660)) {
          return or__3548__auto____51660
        }else {
          var or__3548__auto____51661 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____51661)) {
            return or__3548__auto____51661
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b)
    }
  };
  var _invoke__51719 = function(this$, a, b, c) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____51662 = this$;
      if(cljs.core.truth_(and__3546__auto____51662)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____51662
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c)
    }else {
      return function() {
        var or__3548__auto____51663 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____51663)) {
          return or__3548__auto____51663
        }else {
          var or__3548__auto____51664 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____51664)) {
            return or__3548__auto____51664
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c)
    }
  };
  var _invoke__51720 = function(this$, a, b, c, d) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____51665 = this$;
      if(cljs.core.truth_(and__3546__auto____51665)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____51665
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d)
    }else {
      return function() {
        var or__3548__auto____51666 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____51666)) {
          return or__3548__auto____51666
        }else {
          var or__3548__auto____51667 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____51667)) {
            return or__3548__auto____51667
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d)
    }
  };
  var _invoke__51721 = function(this$, a, b, c, d, e) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____51668 = this$;
      if(cljs.core.truth_(and__3546__auto____51668)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____51668
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e)
    }else {
      return function() {
        var or__3548__auto____51669 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____51669)) {
          return or__3548__auto____51669
        }else {
          var or__3548__auto____51670 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____51670)) {
            return or__3548__auto____51670
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e)
    }
  };
  var _invoke__51722 = function(this$, a, b, c, d, e, f) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____51671 = this$;
      if(cljs.core.truth_(and__3546__auto____51671)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____51671
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f)
    }else {
      return function() {
        var or__3548__auto____51672 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____51672)) {
          return or__3548__auto____51672
        }else {
          var or__3548__auto____51673 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____51673)) {
            return or__3548__auto____51673
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f)
    }
  };
  var _invoke__51723 = function(this$, a, b, c, d, e, f, g) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____51674 = this$;
      if(cljs.core.truth_(and__3546__auto____51674)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____51674
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f, g)
    }else {
      return function() {
        var or__3548__auto____51675 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____51675)) {
          return or__3548__auto____51675
        }else {
          var or__3548__auto____51676 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____51676)) {
            return or__3548__auto____51676
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g)
    }
  };
  var _invoke__51724 = function(this$, a, b, c, d, e, f, g, h) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____51677 = this$;
      if(cljs.core.truth_(and__3546__auto____51677)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____51677
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f, g, h)
    }else {
      return function() {
        var or__3548__auto____51678 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____51678)) {
          return or__3548__auto____51678
        }else {
          var or__3548__auto____51679 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____51679)) {
            return or__3548__auto____51679
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h)
    }
  };
  var _invoke__51725 = function(this$, a, b, c, d, e, f, g, h, i) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____51680 = this$;
      if(cljs.core.truth_(and__3546__auto____51680)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____51680
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f, g, h, i)
    }else {
      return function() {
        var or__3548__auto____51681 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____51681)) {
          return or__3548__auto____51681
        }else {
          var or__3548__auto____51682 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____51682)) {
            return or__3548__auto____51682
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i)
    }
  };
  var _invoke__51726 = function(this$, a, b, c, d, e, f, g, h, i, j) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____51683 = this$;
      if(cljs.core.truth_(and__3546__auto____51683)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____51683
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f, g, h, i, j)
    }else {
      return function() {
        var or__3548__auto____51684 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____51684)) {
          return or__3548__auto____51684
        }else {
          var or__3548__auto____51685 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____51685)) {
            return or__3548__auto____51685
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j)
    }
  };
  var _invoke__51727 = function(this$, a, b, c, d, e, f, g, h, i, j, k) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____51686 = this$;
      if(cljs.core.truth_(and__3546__auto____51686)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____51686
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f, g, h, i, j, k)
    }else {
      return function() {
        var or__3548__auto____51687 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____51687)) {
          return or__3548__auto____51687
        }else {
          var or__3548__auto____51688 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____51688)) {
            return or__3548__auto____51688
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k)
    }
  };
  var _invoke__51728 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____51689 = this$;
      if(cljs.core.truth_(and__3546__auto____51689)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____51689
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f, g, h, i, j, k, l)
    }else {
      return function() {
        var or__3548__auto____51690 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____51690)) {
          return or__3548__auto____51690
        }else {
          var or__3548__auto____51691 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____51691)) {
            return or__3548__auto____51691
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l)
    }
  };
  var _invoke__51729 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____51692 = this$;
      if(cljs.core.truth_(and__3546__auto____51692)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____51692
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f, g, h, i, j, k, l, m)
    }else {
      return function() {
        var or__3548__auto____51693 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____51693)) {
          return or__3548__auto____51693
        }else {
          var or__3548__auto____51694 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____51694)) {
            return or__3548__auto____51694
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m)
    }
  };
  var _invoke__51730 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____51695 = this$;
      if(cljs.core.truth_(and__3546__auto____51695)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____51695
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n)
    }else {
      return function() {
        var or__3548__auto____51696 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____51696)) {
          return or__3548__auto____51696
        }else {
          var or__3548__auto____51697 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____51697)) {
            return or__3548__auto____51697
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n)
    }
  };
  var _invoke__51731 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____51698 = this$;
      if(cljs.core.truth_(and__3546__auto____51698)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____51698
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o)
    }else {
      return function() {
        var or__3548__auto____51699 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____51699)) {
          return or__3548__auto____51699
        }else {
          var or__3548__auto____51700 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____51700)) {
            return or__3548__auto____51700
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o)
    }
  };
  var _invoke__51732 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____51701 = this$;
      if(cljs.core.truth_(and__3546__auto____51701)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____51701
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p)
    }else {
      return function() {
        var or__3548__auto____51702 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____51702)) {
          return or__3548__auto____51702
        }else {
          var or__3548__auto____51703 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____51703)) {
            return or__3548__auto____51703
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p)
    }
  };
  var _invoke__51733 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____51704 = this$;
      if(cljs.core.truth_(and__3546__auto____51704)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____51704
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q)
    }else {
      return function() {
        var or__3548__auto____51705 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____51705)) {
          return or__3548__auto____51705
        }else {
          var or__3548__auto____51706 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____51706)) {
            return or__3548__auto____51706
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q)
    }
  };
  var _invoke__51734 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____51707 = this$;
      if(cljs.core.truth_(and__3546__auto____51707)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____51707
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s)
    }else {
      return function() {
        var or__3548__auto____51708 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____51708)) {
          return or__3548__auto____51708
        }else {
          var or__3548__auto____51709 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____51709)) {
            return or__3548__auto____51709
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s)
    }
  };
  var _invoke__51735 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____51710 = this$;
      if(cljs.core.truth_(and__3546__auto____51710)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____51710
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t)
    }else {
      return function() {
        var or__3548__auto____51711 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____51711)) {
          return or__3548__auto____51711
        }else {
          var or__3548__auto____51712 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____51712)) {
            return or__3548__auto____51712
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t)
    }
  };
  var _invoke__51736 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____51713 = this$;
      if(cljs.core.truth_(and__3546__auto____51713)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____51713
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest)
    }else {
      return function() {
        var or__3548__auto____51714 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____51714)) {
          return or__3548__auto____51714
        }else {
          var or__3548__auto____51715 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____51715)) {
            return or__3548__auto____51715
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
        return _invoke__51716.call(this, this$);
      case 2:
        return _invoke__51717.call(this, this$, a);
      case 3:
        return _invoke__51718.call(this, this$, a, b);
      case 4:
        return _invoke__51719.call(this, this$, a, b, c);
      case 5:
        return _invoke__51720.call(this, this$, a, b, c, d);
      case 6:
        return _invoke__51721.call(this, this$, a, b, c, d, e);
      case 7:
        return _invoke__51722.call(this, this$, a, b, c, d, e, f);
      case 8:
        return _invoke__51723.call(this, this$, a, b, c, d, e, f, g);
      case 9:
        return _invoke__51724.call(this, this$, a, b, c, d, e, f, g, h);
      case 10:
        return _invoke__51725.call(this, this$, a, b, c, d, e, f, g, h, i);
      case 11:
        return _invoke__51726.call(this, this$, a, b, c, d, e, f, g, h, i, j);
      case 12:
        return _invoke__51727.call(this, this$, a, b, c, d, e, f, g, h, i, j, k);
      case 13:
        return _invoke__51728.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l);
      case 14:
        return _invoke__51729.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m);
      case 15:
        return _invoke__51730.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n);
      case 16:
        return _invoke__51731.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o);
      case 17:
        return _invoke__51732.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p);
      case 18:
        return _invoke__51733.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q);
      case 19:
        return _invoke__51734.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s);
      case 20:
        return _invoke__51735.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t);
      case 21:
        return _invoke__51736.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return _invoke
}();
cljs.core.ICounted = {};
cljs.core._count = function _count(coll) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____51738 = coll;
    if(cljs.core.truth_(and__3546__auto____51738)) {
      return coll.cljs$core$ICounted$_count
    }else {
      return and__3546__auto____51738
    }
  }())) {
    return coll.cljs$core$ICounted$_count(coll)
  }else {
    return function() {
      var or__3548__auto____51739 = cljs.core._count[goog.typeOf.call(null, coll)];
      if(cljs.core.truth_(or__3548__auto____51739)) {
        return or__3548__auto____51739
      }else {
        var or__3548__auto____51740 = cljs.core._count["_"];
        if(cljs.core.truth_(or__3548__auto____51740)) {
          return or__3548__auto____51740
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
    var and__3546__auto____51741 = coll;
    if(cljs.core.truth_(and__3546__auto____51741)) {
      return coll.cljs$core$IEmptyableCollection$_empty
    }else {
      return and__3546__auto____51741
    }
  }())) {
    return coll.cljs$core$IEmptyableCollection$_empty(coll)
  }else {
    return function() {
      var or__3548__auto____51742 = cljs.core._empty[goog.typeOf.call(null, coll)];
      if(cljs.core.truth_(or__3548__auto____51742)) {
        return or__3548__auto____51742
      }else {
        var or__3548__auto____51743 = cljs.core._empty["_"];
        if(cljs.core.truth_(or__3548__auto____51743)) {
          return or__3548__auto____51743
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
    var and__3546__auto____51744 = coll;
    if(cljs.core.truth_(and__3546__auto____51744)) {
      return coll.cljs$core$ICollection$_conj
    }else {
      return and__3546__auto____51744
    }
  }())) {
    return coll.cljs$core$ICollection$_conj(coll, o)
  }else {
    return function() {
      var or__3548__auto____51745 = cljs.core._conj[goog.typeOf.call(null, coll)];
      if(cljs.core.truth_(or__3548__auto____51745)) {
        return or__3548__auto____51745
      }else {
        var or__3548__auto____51746 = cljs.core._conj["_"];
        if(cljs.core.truth_(or__3548__auto____51746)) {
          return or__3548__auto____51746
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
  var _nth__51753 = function(coll, n) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____51747 = coll;
      if(cljs.core.truth_(and__3546__auto____51747)) {
        return coll.cljs$core$IIndexed$_nth
      }else {
        return and__3546__auto____51747
      }
    }())) {
      return coll.cljs$core$IIndexed$_nth(coll, n)
    }else {
      return function() {
        var or__3548__auto____51748 = cljs.core._nth[goog.typeOf.call(null, coll)];
        if(cljs.core.truth_(or__3548__auto____51748)) {
          return or__3548__auto____51748
        }else {
          var or__3548__auto____51749 = cljs.core._nth["_"];
          if(cljs.core.truth_(or__3548__auto____51749)) {
            return or__3548__auto____51749
          }else {
            throw cljs.core.missing_protocol.call(null, "IIndexed.-nth", coll);
          }
        }
      }().call(null, coll, n)
    }
  };
  var _nth__51754 = function(coll, n, not_found) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____51750 = coll;
      if(cljs.core.truth_(and__3546__auto____51750)) {
        return coll.cljs$core$IIndexed$_nth
      }else {
        return and__3546__auto____51750
      }
    }())) {
      return coll.cljs$core$IIndexed$_nth(coll, n, not_found)
    }else {
      return function() {
        var or__3548__auto____51751 = cljs.core._nth[goog.typeOf.call(null, coll)];
        if(cljs.core.truth_(or__3548__auto____51751)) {
          return or__3548__auto____51751
        }else {
          var or__3548__auto____51752 = cljs.core._nth["_"];
          if(cljs.core.truth_(or__3548__auto____51752)) {
            return or__3548__auto____51752
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
        return _nth__51753.call(this, coll, n);
      case 3:
        return _nth__51754.call(this, coll, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return _nth
}();
cljs.core.ISeq = {};
cljs.core._first = function _first(coll) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____51756 = coll;
    if(cljs.core.truth_(and__3546__auto____51756)) {
      return coll.cljs$core$ISeq$_first
    }else {
      return and__3546__auto____51756
    }
  }())) {
    return coll.cljs$core$ISeq$_first(coll)
  }else {
    return function() {
      var or__3548__auto____51757 = cljs.core._first[goog.typeOf.call(null, coll)];
      if(cljs.core.truth_(or__3548__auto____51757)) {
        return or__3548__auto____51757
      }else {
        var or__3548__auto____51758 = cljs.core._first["_"];
        if(cljs.core.truth_(or__3548__auto____51758)) {
          return or__3548__auto____51758
        }else {
          throw cljs.core.missing_protocol.call(null, "ISeq.-first", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._rest = function _rest(coll) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____51759 = coll;
    if(cljs.core.truth_(and__3546__auto____51759)) {
      return coll.cljs$core$ISeq$_rest
    }else {
      return and__3546__auto____51759
    }
  }())) {
    return coll.cljs$core$ISeq$_rest(coll)
  }else {
    return function() {
      var or__3548__auto____51760 = cljs.core._rest[goog.typeOf.call(null, coll)];
      if(cljs.core.truth_(or__3548__auto____51760)) {
        return or__3548__auto____51760
      }else {
        var or__3548__auto____51761 = cljs.core._rest["_"];
        if(cljs.core.truth_(or__3548__auto____51761)) {
          return or__3548__auto____51761
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
  var _lookup__51768 = function(o, k) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____51762 = o;
      if(cljs.core.truth_(and__3546__auto____51762)) {
        return o.cljs$core$ILookup$_lookup
      }else {
        return and__3546__auto____51762
      }
    }())) {
      return o.cljs$core$ILookup$_lookup(o, k)
    }else {
      return function() {
        var or__3548__auto____51763 = cljs.core._lookup[goog.typeOf.call(null, o)];
        if(cljs.core.truth_(or__3548__auto____51763)) {
          return or__3548__auto____51763
        }else {
          var or__3548__auto____51764 = cljs.core._lookup["_"];
          if(cljs.core.truth_(or__3548__auto____51764)) {
            return or__3548__auto____51764
          }else {
            throw cljs.core.missing_protocol.call(null, "ILookup.-lookup", o);
          }
        }
      }().call(null, o, k)
    }
  };
  var _lookup__51769 = function(o, k, not_found) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____51765 = o;
      if(cljs.core.truth_(and__3546__auto____51765)) {
        return o.cljs$core$ILookup$_lookup
      }else {
        return and__3546__auto____51765
      }
    }())) {
      return o.cljs$core$ILookup$_lookup(o, k, not_found)
    }else {
      return function() {
        var or__3548__auto____51766 = cljs.core._lookup[goog.typeOf.call(null, o)];
        if(cljs.core.truth_(or__3548__auto____51766)) {
          return or__3548__auto____51766
        }else {
          var or__3548__auto____51767 = cljs.core._lookup["_"];
          if(cljs.core.truth_(or__3548__auto____51767)) {
            return or__3548__auto____51767
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
        return _lookup__51768.call(this, o, k);
      case 3:
        return _lookup__51769.call(this, o, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return _lookup
}();
cljs.core.IAssociative = {};
cljs.core._contains_key_QMARK_ = function _contains_key_QMARK_(coll, k) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____51771 = coll;
    if(cljs.core.truth_(and__3546__auto____51771)) {
      return coll.cljs$core$IAssociative$_contains_key_QMARK_
    }else {
      return and__3546__auto____51771
    }
  }())) {
    return coll.cljs$core$IAssociative$_contains_key_QMARK_(coll, k)
  }else {
    return function() {
      var or__3548__auto____51772 = cljs.core._contains_key_QMARK_[goog.typeOf.call(null, coll)];
      if(cljs.core.truth_(or__3548__auto____51772)) {
        return or__3548__auto____51772
      }else {
        var or__3548__auto____51773 = cljs.core._contains_key_QMARK_["_"];
        if(cljs.core.truth_(or__3548__auto____51773)) {
          return or__3548__auto____51773
        }else {
          throw cljs.core.missing_protocol.call(null, "IAssociative.-contains-key?", coll);
        }
      }
    }().call(null, coll, k)
  }
};
cljs.core._assoc = function _assoc(coll, k, v) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____51774 = coll;
    if(cljs.core.truth_(and__3546__auto____51774)) {
      return coll.cljs$core$IAssociative$_assoc
    }else {
      return and__3546__auto____51774
    }
  }())) {
    return coll.cljs$core$IAssociative$_assoc(coll, k, v)
  }else {
    return function() {
      var or__3548__auto____51775 = cljs.core._assoc[goog.typeOf.call(null, coll)];
      if(cljs.core.truth_(or__3548__auto____51775)) {
        return or__3548__auto____51775
      }else {
        var or__3548__auto____51776 = cljs.core._assoc["_"];
        if(cljs.core.truth_(or__3548__auto____51776)) {
          return or__3548__auto____51776
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
    var and__3546__auto____51777 = coll;
    if(cljs.core.truth_(and__3546__auto____51777)) {
      return coll.cljs$core$IMap$_dissoc
    }else {
      return and__3546__auto____51777
    }
  }())) {
    return coll.cljs$core$IMap$_dissoc(coll, k)
  }else {
    return function() {
      var or__3548__auto____51778 = cljs.core._dissoc[goog.typeOf.call(null, coll)];
      if(cljs.core.truth_(or__3548__auto____51778)) {
        return or__3548__auto____51778
      }else {
        var or__3548__auto____51779 = cljs.core._dissoc["_"];
        if(cljs.core.truth_(or__3548__auto____51779)) {
          return or__3548__auto____51779
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
    var and__3546__auto____51780 = coll;
    if(cljs.core.truth_(and__3546__auto____51780)) {
      return coll.cljs$core$ISet$_disjoin
    }else {
      return and__3546__auto____51780
    }
  }())) {
    return coll.cljs$core$ISet$_disjoin(coll, v)
  }else {
    return function() {
      var or__3548__auto____51781 = cljs.core._disjoin[goog.typeOf.call(null, coll)];
      if(cljs.core.truth_(or__3548__auto____51781)) {
        return or__3548__auto____51781
      }else {
        var or__3548__auto____51782 = cljs.core._disjoin["_"];
        if(cljs.core.truth_(or__3548__auto____51782)) {
          return or__3548__auto____51782
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
    var and__3546__auto____51783 = coll;
    if(cljs.core.truth_(and__3546__auto____51783)) {
      return coll.cljs$core$IStack$_peek
    }else {
      return and__3546__auto____51783
    }
  }())) {
    return coll.cljs$core$IStack$_peek(coll)
  }else {
    return function() {
      var or__3548__auto____51784 = cljs.core._peek[goog.typeOf.call(null, coll)];
      if(cljs.core.truth_(or__3548__auto____51784)) {
        return or__3548__auto____51784
      }else {
        var or__3548__auto____51785 = cljs.core._peek["_"];
        if(cljs.core.truth_(or__3548__auto____51785)) {
          return or__3548__auto____51785
        }else {
          throw cljs.core.missing_protocol.call(null, "IStack.-peek", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._pop = function _pop(coll) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____51786 = coll;
    if(cljs.core.truth_(and__3546__auto____51786)) {
      return coll.cljs$core$IStack$_pop
    }else {
      return and__3546__auto____51786
    }
  }())) {
    return coll.cljs$core$IStack$_pop(coll)
  }else {
    return function() {
      var or__3548__auto____51787 = cljs.core._pop[goog.typeOf.call(null, coll)];
      if(cljs.core.truth_(or__3548__auto____51787)) {
        return or__3548__auto____51787
      }else {
        var or__3548__auto____51788 = cljs.core._pop["_"];
        if(cljs.core.truth_(or__3548__auto____51788)) {
          return or__3548__auto____51788
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
    var and__3546__auto____51789 = coll;
    if(cljs.core.truth_(and__3546__auto____51789)) {
      return coll.cljs$core$IVector$_assoc_n
    }else {
      return and__3546__auto____51789
    }
  }())) {
    return coll.cljs$core$IVector$_assoc_n(coll, n, val)
  }else {
    return function() {
      var or__3548__auto____51790 = cljs.core._assoc_n[goog.typeOf.call(null, coll)];
      if(cljs.core.truth_(or__3548__auto____51790)) {
        return or__3548__auto____51790
      }else {
        var or__3548__auto____51791 = cljs.core._assoc_n["_"];
        if(cljs.core.truth_(or__3548__auto____51791)) {
          return or__3548__auto____51791
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
    var and__3546__auto____51792 = o;
    if(cljs.core.truth_(and__3546__auto____51792)) {
      return o.cljs$core$IDeref$_deref
    }else {
      return and__3546__auto____51792
    }
  }())) {
    return o.cljs$core$IDeref$_deref(o)
  }else {
    return function() {
      var or__3548__auto____51793 = cljs.core._deref[goog.typeOf.call(null, o)];
      if(cljs.core.truth_(or__3548__auto____51793)) {
        return or__3548__auto____51793
      }else {
        var or__3548__auto____51794 = cljs.core._deref["_"];
        if(cljs.core.truth_(or__3548__auto____51794)) {
          return or__3548__auto____51794
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
    var and__3546__auto____51795 = o;
    if(cljs.core.truth_(and__3546__auto____51795)) {
      return o.cljs$core$IDerefWithTimeout$_deref_with_timeout
    }else {
      return and__3546__auto____51795
    }
  }())) {
    return o.cljs$core$IDerefWithTimeout$_deref_with_timeout(o, msec, timeout_val)
  }else {
    return function() {
      var or__3548__auto____51796 = cljs.core._deref_with_timeout[goog.typeOf.call(null, o)];
      if(cljs.core.truth_(or__3548__auto____51796)) {
        return or__3548__auto____51796
      }else {
        var or__3548__auto____51797 = cljs.core._deref_with_timeout["_"];
        if(cljs.core.truth_(or__3548__auto____51797)) {
          return or__3548__auto____51797
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
    var and__3546__auto____51798 = o;
    if(cljs.core.truth_(and__3546__auto____51798)) {
      return o.cljs$core$IMeta$_meta
    }else {
      return and__3546__auto____51798
    }
  }())) {
    return o.cljs$core$IMeta$_meta(o)
  }else {
    return function() {
      var or__3548__auto____51799 = cljs.core._meta[goog.typeOf.call(null, o)];
      if(cljs.core.truth_(or__3548__auto____51799)) {
        return or__3548__auto____51799
      }else {
        var or__3548__auto____51800 = cljs.core._meta["_"];
        if(cljs.core.truth_(or__3548__auto____51800)) {
          return or__3548__auto____51800
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
    var and__3546__auto____51801 = o;
    if(cljs.core.truth_(and__3546__auto____51801)) {
      return o.cljs$core$IWithMeta$_with_meta
    }else {
      return and__3546__auto____51801
    }
  }())) {
    return o.cljs$core$IWithMeta$_with_meta(o, meta)
  }else {
    return function() {
      var or__3548__auto____51802 = cljs.core._with_meta[goog.typeOf.call(null, o)];
      if(cljs.core.truth_(or__3548__auto____51802)) {
        return or__3548__auto____51802
      }else {
        var or__3548__auto____51803 = cljs.core._with_meta["_"];
        if(cljs.core.truth_(or__3548__auto____51803)) {
          return or__3548__auto____51803
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
  var _reduce__51810 = function(coll, f) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____51804 = coll;
      if(cljs.core.truth_(and__3546__auto____51804)) {
        return coll.cljs$core$IReduce$_reduce
      }else {
        return and__3546__auto____51804
      }
    }())) {
      return coll.cljs$core$IReduce$_reduce(coll, f)
    }else {
      return function() {
        var or__3548__auto____51805 = cljs.core._reduce[goog.typeOf.call(null, coll)];
        if(cljs.core.truth_(or__3548__auto____51805)) {
          return or__3548__auto____51805
        }else {
          var or__3548__auto____51806 = cljs.core._reduce["_"];
          if(cljs.core.truth_(or__3548__auto____51806)) {
            return or__3548__auto____51806
          }else {
            throw cljs.core.missing_protocol.call(null, "IReduce.-reduce", coll);
          }
        }
      }().call(null, coll, f)
    }
  };
  var _reduce__51811 = function(coll, f, start) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____51807 = coll;
      if(cljs.core.truth_(and__3546__auto____51807)) {
        return coll.cljs$core$IReduce$_reduce
      }else {
        return and__3546__auto____51807
      }
    }())) {
      return coll.cljs$core$IReduce$_reduce(coll, f, start)
    }else {
      return function() {
        var or__3548__auto____51808 = cljs.core._reduce[goog.typeOf.call(null, coll)];
        if(cljs.core.truth_(or__3548__auto____51808)) {
          return or__3548__auto____51808
        }else {
          var or__3548__auto____51809 = cljs.core._reduce["_"];
          if(cljs.core.truth_(or__3548__auto____51809)) {
            return or__3548__auto____51809
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
        return _reduce__51810.call(this, coll, f);
      case 3:
        return _reduce__51811.call(this, coll, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return _reduce
}();
cljs.core.IEquiv = {};
cljs.core._equiv = function _equiv(o, other) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____51813 = o;
    if(cljs.core.truth_(and__3546__auto____51813)) {
      return o.cljs$core$IEquiv$_equiv
    }else {
      return and__3546__auto____51813
    }
  }())) {
    return o.cljs$core$IEquiv$_equiv(o, other)
  }else {
    return function() {
      var or__3548__auto____51814 = cljs.core._equiv[goog.typeOf.call(null, o)];
      if(cljs.core.truth_(or__3548__auto____51814)) {
        return or__3548__auto____51814
      }else {
        var or__3548__auto____51815 = cljs.core._equiv["_"];
        if(cljs.core.truth_(or__3548__auto____51815)) {
          return or__3548__auto____51815
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
    var and__3546__auto____51816 = o;
    if(cljs.core.truth_(and__3546__auto____51816)) {
      return o.cljs$core$IHash$_hash
    }else {
      return and__3546__auto____51816
    }
  }())) {
    return o.cljs$core$IHash$_hash(o)
  }else {
    return function() {
      var or__3548__auto____51817 = cljs.core._hash[goog.typeOf.call(null, o)];
      if(cljs.core.truth_(or__3548__auto____51817)) {
        return or__3548__auto____51817
      }else {
        var or__3548__auto____51818 = cljs.core._hash["_"];
        if(cljs.core.truth_(or__3548__auto____51818)) {
          return or__3548__auto____51818
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
    var and__3546__auto____51819 = o;
    if(cljs.core.truth_(and__3546__auto____51819)) {
      return o.cljs$core$ISeqable$_seq
    }else {
      return and__3546__auto____51819
    }
  }())) {
    return o.cljs$core$ISeqable$_seq(o)
  }else {
    return function() {
      var or__3548__auto____51820 = cljs.core._seq[goog.typeOf.call(null, o)];
      if(cljs.core.truth_(or__3548__auto____51820)) {
        return or__3548__auto____51820
      }else {
        var or__3548__auto____51821 = cljs.core._seq["_"];
        if(cljs.core.truth_(or__3548__auto____51821)) {
          return or__3548__auto____51821
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
    var and__3546__auto____51822 = o;
    if(cljs.core.truth_(and__3546__auto____51822)) {
      return o.cljs$core$IPrintable$_pr_seq
    }else {
      return and__3546__auto____51822
    }
  }())) {
    return o.cljs$core$IPrintable$_pr_seq(o, opts)
  }else {
    return function() {
      var or__3548__auto____51823 = cljs.core._pr_seq[goog.typeOf.call(null, o)];
      if(cljs.core.truth_(or__3548__auto____51823)) {
        return or__3548__auto____51823
      }else {
        var or__3548__auto____51824 = cljs.core._pr_seq["_"];
        if(cljs.core.truth_(or__3548__auto____51824)) {
          return or__3548__auto____51824
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
    var and__3546__auto____51825 = d;
    if(cljs.core.truth_(and__3546__auto____51825)) {
      return d.cljs$core$IPending$_realized_QMARK_
    }else {
      return and__3546__auto____51825
    }
  }())) {
    return d.cljs$core$IPending$_realized_QMARK_(d)
  }else {
    return function() {
      var or__3548__auto____51826 = cljs.core._realized_QMARK_[goog.typeOf.call(null, d)];
      if(cljs.core.truth_(or__3548__auto____51826)) {
        return or__3548__auto____51826
      }else {
        var or__3548__auto____51827 = cljs.core._realized_QMARK_["_"];
        if(cljs.core.truth_(or__3548__auto____51827)) {
          return or__3548__auto____51827
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
    var and__3546__auto____51828 = this$;
    if(cljs.core.truth_(and__3546__auto____51828)) {
      return this$.cljs$core$IWatchable$_notify_watches
    }else {
      return and__3546__auto____51828
    }
  }())) {
    return this$.cljs$core$IWatchable$_notify_watches(this$, oldval, newval)
  }else {
    return function() {
      var or__3548__auto____51829 = cljs.core._notify_watches[goog.typeOf.call(null, this$)];
      if(cljs.core.truth_(or__3548__auto____51829)) {
        return or__3548__auto____51829
      }else {
        var or__3548__auto____51830 = cljs.core._notify_watches["_"];
        if(cljs.core.truth_(or__3548__auto____51830)) {
          return or__3548__auto____51830
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-notify-watches", this$);
        }
      }
    }().call(null, this$, oldval, newval)
  }
};
cljs.core._add_watch = function _add_watch(this$, key, f) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____51831 = this$;
    if(cljs.core.truth_(and__3546__auto____51831)) {
      return this$.cljs$core$IWatchable$_add_watch
    }else {
      return and__3546__auto____51831
    }
  }())) {
    return this$.cljs$core$IWatchable$_add_watch(this$, key, f)
  }else {
    return function() {
      var or__3548__auto____51832 = cljs.core._add_watch[goog.typeOf.call(null, this$)];
      if(cljs.core.truth_(or__3548__auto____51832)) {
        return or__3548__auto____51832
      }else {
        var or__3548__auto____51833 = cljs.core._add_watch["_"];
        if(cljs.core.truth_(or__3548__auto____51833)) {
          return or__3548__auto____51833
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-add-watch", this$);
        }
      }
    }().call(null, this$, key, f)
  }
};
cljs.core._remove_watch = function _remove_watch(this$, key) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____51834 = this$;
    if(cljs.core.truth_(and__3546__auto____51834)) {
      return this$.cljs$core$IWatchable$_remove_watch
    }else {
      return and__3546__auto____51834
    }
  }())) {
    return this$.cljs$core$IWatchable$_remove_watch(this$, key)
  }else {
    return function() {
      var or__3548__auto____51835 = cljs.core._remove_watch[goog.typeOf.call(null, this$)];
      if(cljs.core.truth_(or__3548__auto____51835)) {
        return or__3548__auto____51835
      }else {
        var or__3548__auto____51836 = cljs.core._remove_watch["_"];
        if(cljs.core.truth_(or__3548__auto____51836)) {
          return or__3548__auto____51836
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
  var G__51837 = null;
  var G__51837__51838 = function(o, k) {
    return null
  };
  var G__51837__51839 = function(o, k, not_found) {
    return not_found
  };
  G__51837 = function(o, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__51837__51838.call(this, o, k);
      case 3:
        return G__51837__51839.call(this, o, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__51837
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
  var G__51841 = null;
  var G__51841__51842 = function(_, f) {
    return f.call(null)
  };
  var G__51841__51843 = function(_, f, start) {
    return start
  };
  G__51841 = function(_, f, start) {
    switch(arguments.length) {
      case 2:
        return G__51841__51842.call(this, _, f);
      case 3:
        return G__51841__51843.call(this, _, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__51841
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
  var G__51845 = null;
  var G__51845__51846 = function(_, n) {
    return null
  };
  var G__51845__51847 = function(_, n, not_found) {
    return not_found
  };
  G__51845 = function(_, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__51845__51846.call(this, _, n);
      case 3:
        return G__51845__51847.call(this, _, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__51845
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
  var ci_reduce__51855 = function(cicoll, f) {
    if(cljs.core.truth_(cljs.core._EQ_.call(null, 0, cljs.core._count.call(null, cicoll)))) {
      return f.call(null)
    }else {
      var val__51849 = cljs.core._nth.call(null, cicoll, 0);
      var n__51850 = 1;
      while(true) {
        if(cljs.core.truth_(n__51850 < cljs.core._count.call(null, cicoll))) {
          var G__51859 = f.call(null, val__51849, cljs.core._nth.call(null, cicoll, n__51850));
          var G__51860 = n__51850 + 1;
          val__51849 = G__51859;
          n__51850 = G__51860;
          continue
        }else {
          return val__51849
        }
        break
      }
    }
  };
  var ci_reduce__51856 = function(cicoll, f, val) {
    var val__51851 = val;
    var n__51852 = 0;
    while(true) {
      if(cljs.core.truth_(n__51852 < cljs.core._count.call(null, cicoll))) {
        var G__51861 = f.call(null, val__51851, cljs.core._nth.call(null, cicoll, n__51852));
        var G__51862 = n__51852 + 1;
        val__51851 = G__51861;
        n__51852 = G__51862;
        continue
      }else {
        return val__51851
      }
      break
    }
  };
  var ci_reduce__51857 = function(cicoll, f, val, idx) {
    var val__51853 = val;
    var n__51854 = idx;
    while(true) {
      if(cljs.core.truth_(n__51854 < cljs.core._count.call(null, cicoll))) {
        var G__51863 = f.call(null, val__51853, cljs.core._nth.call(null, cicoll, n__51854));
        var G__51864 = n__51854 + 1;
        val__51853 = G__51863;
        n__51854 = G__51864;
        continue
      }else {
        return val__51853
      }
      break
    }
  };
  ci_reduce = function(cicoll, f, val, idx) {
    switch(arguments.length) {
      case 2:
        return ci_reduce__51855.call(this, cicoll, f);
      case 3:
        return ci_reduce__51856.call(this, cicoll, f, val);
      case 4:
        return ci_reduce__51857.call(this, cicoll, f, val, idx)
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
  var this__51865 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.IndexedSeq.prototype.cljs$core$IReduce$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$IReduce$_reduce = function() {
  var G__51878 = null;
  var G__51878__51879 = function(_, f) {
    var this__51866 = this;
    return cljs.core.ci_reduce.call(null, this__51866.a, f, this__51866.a[this__51866.i], this__51866.i + 1)
  };
  var G__51878__51880 = function(_, f, start) {
    var this__51867 = this;
    return cljs.core.ci_reduce.call(null, this__51867.a, f, start, this__51867.i)
  };
  G__51878 = function(_, f, start) {
    switch(arguments.length) {
      case 2:
        return G__51878__51879.call(this, _, f);
      case 3:
        return G__51878__51880.call(this, _, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__51878
}();
cljs.core.IndexedSeq.prototype.cljs$core$ICollection$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$ICollection$_conj = function(coll, o) {
  var this__51868 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.IndexedSeq.prototype.cljs$core$IEquiv$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$IEquiv$_equiv = function(coll, other) {
  var this__51869 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.IndexedSeq.prototype.cljs$core$ISequential$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$IIndexed$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$IIndexed$_nth = function() {
  var G__51882 = null;
  var G__51882__51883 = function(coll, n) {
    var this__51870 = this;
    var i__51871 = n + this__51870.i;
    if(cljs.core.truth_(i__51871 < this__51870.a.length)) {
      return this__51870.a[i__51871]
    }else {
      return null
    }
  };
  var G__51882__51884 = function(coll, n, not_found) {
    var this__51872 = this;
    var i__51873 = n + this__51872.i;
    if(cljs.core.truth_(i__51873 < this__51872.a.length)) {
      return this__51872.a[i__51873]
    }else {
      return not_found
    }
  };
  G__51882 = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__51882__51883.call(this, coll, n);
      case 3:
        return G__51882__51884.call(this, coll, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__51882
}();
cljs.core.IndexedSeq.prototype.cljs$core$ICounted$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$ICounted$_count = function(_) {
  var this__51874 = this;
  return this__51874.a.length - this__51874.i
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeq$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$ISeq$_first = function(_) {
  var this__51875 = this;
  return this__51875.a[this__51875.i]
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeq$_rest = function(_) {
  var this__51876 = this;
  if(cljs.core.truth_(this__51876.i + 1 < this__51876.a.length)) {
    return new cljs.core.IndexedSeq(this__51876.a, this__51876.i + 1)
  }else {
    return cljs.core.list.call(null)
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeqable$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$ISeqable$_seq = function(this$) {
  var this__51877 = this;
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
  var G__51886 = null;
  var G__51886__51887 = function(array, f) {
    return cljs.core.ci_reduce.call(null, array, f)
  };
  var G__51886__51888 = function(array, f, start) {
    return cljs.core.ci_reduce.call(null, array, f, start)
  };
  G__51886 = function(array, f, start) {
    switch(arguments.length) {
      case 2:
        return G__51886__51887.call(this, array, f);
      case 3:
        return G__51886__51888.call(this, array, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__51886
}();
cljs.core.ILookup["array"] = true;
cljs.core._lookup["array"] = function() {
  var G__51890 = null;
  var G__51890__51891 = function(array, k) {
    return array[k]
  };
  var G__51890__51892 = function(array, k, not_found) {
    return cljs.core._nth.call(null, array, k, not_found)
  };
  G__51890 = function(array, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__51890__51891.call(this, array, k);
      case 3:
        return G__51890__51892.call(this, array, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__51890
}();
cljs.core.IIndexed["array"] = true;
cljs.core._nth["array"] = function() {
  var G__51894 = null;
  var G__51894__51895 = function(array, n) {
    if(cljs.core.truth_(n < array.length)) {
      return array[n]
    }else {
      return null
    }
  };
  var G__51894__51896 = function(array, n, not_found) {
    if(cljs.core.truth_(n < array.length)) {
      return array[n]
    }else {
      return not_found
    }
  };
  G__51894 = function(array, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__51894__51895.call(this, array, n);
      case 3:
        return G__51894__51896.call(this, array, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__51894
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
  var temp__3698__auto____51898 = cljs.core.seq.call(null, coll);
  if(cljs.core.truth_(temp__3698__auto____51898)) {
    var s__51899 = temp__3698__auto____51898;
    return cljs.core._first.call(null, s__51899)
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
      var G__51900 = cljs.core.next.call(null, s);
      s = G__51900;
      continue
    }else {
      return cljs.core.first.call(null, s)
    }
    break
  }
};
cljs.core.ICounted["_"] = true;
cljs.core._count["_"] = function(x) {
  var s__51901 = cljs.core.seq.call(null, x);
  var n__51902 = 0;
  while(true) {
    if(cljs.core.truth_(s__51901)) {
      var G__51903 = cljs.core.next.call(null, s__51901);
      var G__51904 = n__51902 + 1;
      s__51901 = G__51903;
      n__51902 = G__51904;
      continue
    }else {
      return n__51902
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
  var conj__51905 = function(coll, x) {
    return cljs.core._conj.call(null, coll, x)
  };
  var conj__51906 = function() {
    var G__51908__delegate = function(coll, x, xs) {
      while(true) {
        if(cljs.core.truth_(xs)) {
          var G__51909 = conj.call(null, coll, x);
          var G__51910 = cljs.core.first.call(null, xs);
          var G__51911 = cljs.core.next.call(null, xs);
          coll = G__51909;
          x = G__51910;
          xs = G__51911;
          continue
        }else {
          return conj.call(null, coll, x)
        }
        break
      }
    };
    var G__51908 = function(coll, x, var_args) {
      var xs = null;
      if(goog.isDef(var_args)) {
        xs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__51908__delegate.call(this, coll, x, xs)
    };
    G__51908.cljs$lang$maxFixedArity = 2;
    G__51908.cljs$lang$applyTo = function(arglist__51912) {
      var coll = cljs.core.first(arglist__51912);
      var x = cljs.core.first(cljs.core.next(arglist__51912));
      var xs = cljs.core.rest(cljs.core.next(arglist__51912));
      return G__51908__delegate.call(this, coll, x, xs)
    };
    return G__51908
  }();
  conj = function(coll, x, var_args) {
    var xs = var_args;
    switch(arguments.length) {
      case 2:
        return conj__51905.call(this, coll, x);
      default:
        return conj__51906.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  conj.cljs$lang$maxFixedArity = 2;
  conj.cljs$lang$applyTo = conj__51906.cljs$lang$applyTo;
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
  var nth__51913 = function(coll, n) {
    return cljs.core._nth.call(null, coll, Math.floor(n))
  };
  var nth__51914 = function(coll, n, not_found) {
    return cljs.core._nth.call(null, coll, Math.floor(n), not_found)
  };
  nth = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return nth__51913.call(this, coll, n);
      case 3:
        return nth__51914.call(this, coll, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return nth
}();
cljs.core.get = function() {
  var get = null;
  var get__51916 = function(o, k) {
    return cljs.core._lookup.call(null, o, k)
  };
  var get__51917 = function(o, k, not_found) {
    return cljs.core._lookup.call(null, o, k, not_found)
  };
  get = function(o, k, not_found) {
    switch(arguments.length) {
      case 2:
        return get__51916.call(this, o, k);
      case 3:
        return get__51917.call(this, o, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return get
}();
cljs.core.assoc = function() {
  var assoc = null;
  var assoc__51920 = function(coll, k, v) {
    return cljs.core._assoc.call(null, coll, k, v)
  };
  var assoc__51921 = function() {
    var G__51923__delegate = function(coll, k, v, kvs) {
      while(true) {
        var ret__51919 = assoc.call(null, coll, k, v);
        if(cljs.core.truth_(kvs)) {
          var G__51924 = ret__51919;
          var G__51925 = cljs.core.first.call(null, kvs);
          var G__51926 = cljs.core.second.call(null, kvs);
          var G__51927 = cljs.core.nnext.call(null, kvs);
          coll = G__51924;
          k = G__51925;
          v = G__51926;
          kvs = G__51927;
          continue
        }else {
          return ret__51919
        }
        break
      }
    };
    var G__51923 = function(coll, k, v, var_args) {
      var kvs = null;
      if(goog.isDef(var_args)) {
        kvs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__51923__delegate.call(this, coll, k, v, kvs)
    };
    G__51923.cljs$lang$maxFixedArity = 3;
    G__51923.cljs$lang$applyTo = function(arglist__51928) {
      var coll = cljs.core.first(arglist__51928);
      var k = cljs.core.first(cljs.core.next(arglist__51928));
      var v = cljs.core.first(cljs.core.next(cljs.core.next(arglist__51928)));
      var kvs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__51928)));
      return G__51923__delegate.call(this, coll, k, v, kvs)
    };
    return G__51923
  }();
  assoc = function(coll, k, v, var_args) {
    var kvs = var_args;
    switch(arguments.length) {
      case 3:
        return assoc__51920.call(this, coll, k, v);
      default:
        return assoc__51921.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  assoc.cljs$lang$maxFixedArity = 3;
  assoc.cljs$lang$applyTo = assoc__51921.cljs$lang$applyTo;
  return assoc
}();
cljs.core.dissoc = function() {
  var dissoc = null;
  var dissoc__51930 = function(coll) {
    return coll
  };
  var dissoc__51931 = function(coll, k) {
    return cljs.core._dissoc.call(null, coll, k)
  };
  var dissoc__51932 = function() {
    var G__51934__delegate = function(coll, k, ks) {
      while(true) {
        var ret__51929 = dissoc.call(null, coll, k);
        if(cljs.core.truth_(ks)) {
          var G__51935 = ret__51929;
          var G__51936 = cljs.core.first.call(null, ks);
          var G__51937 = cljs.core.next.call(null, ks);
          coll = G__51935;
          k = G__51936;
          ks = G__51937;
          continue
        }else {
          return ret__51929
        }
        break
      }
    };
    var G__51934 = function(coll, k, var_args) {
      var ks = null;
      if(goog.isDef(var_args)) {
        ks = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__51934__delegate.call(this, coll, k, ks)
    };
    G__51934.cljs$lang$maxFixedArity = 2;
    G__51934.cljs$lang$applyTo = function(arglist__51938) {
      var coll = cljs.core.first(arglist__51938);
      var k = cljs.core.first(cljs.core.next(arglist__51938));
      var ks = cljs.core.rest(cljs.core.next(arglist__51938));
      return G__51934__delegate.call(this, coll, k, ks)
    };
    return G__51934
  }();
  dissoc = function(coll, k, var_args) {
    var ks = var_args;
    switch(arguments.length) {
      case 1:
        return dissoc__51930.call(this, coll);
      case 2:
        return dissoc__51931.call(this, coll, k);
      default:
        return dissoc__51932.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  dissoc.cljs$lang$maxFixedArity = 2;
  dissoc.cljs$lang$applyTo = dissoc__51932.cljs$lang$applyTo;
  return dissoc
}();
cljs.core.with_meta = function with_meta(o, meta) {
  return cljs.core._with_meta.call(null, o, meta)
};
cljs.core.meta = function meta(o) {
  if(cljs.core.truth_(function() {
    var x__451__auto____51939 = o;
    if(cljs.core.truth_(function() {
      var and__3546__auto____51940 = x__451__auto____51939;
      if(cljs.core.truth_(and__3546__auto____51940)) {
        var and__3546__auto____51941 = x__451__auto____51939.cljs$core$IMeta$;
        if(cljs.core.truth_(and__3546__auto____51941)) {
          return cljs.core.not.call(null, x__451__auto____51939.hasOwnProperty("cljs$core$IMeta$"))
        }else {
          return and__3546__auto____51941
        }
      }else {
        return and__3546__auto____51940
      }
    }())) {
      return true
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, x__451__auto____51939)
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
  var disj__51943 = function(coll) {
    return coll
  };
  var disj__51944 = function(coll, k) {
    return cljs.core._disjoin.call(null, coll, k)
  };
  var disj__51945 = function() {
    var G__51947__delegate = function(coll, k, ks) {
      while(true) {
        var ret__51942 = disj.call(null, coll, k);
        if(cljs.core.truth_(ks)) {
          var G__51948 = ret__51942;
          var G__51949 = cljs.core.first.call(null, ks);
          var G__51950 = cljs.core.next.call(null, ks);
          coll = G__51948;
          k = G__51949;
          ks = G__51950;
          continue
        }else {
          return ret__51942
        }
        break
      }
    };
    var G__51947 = function(coll, k, var_args) {
      var ks = null;
      if(goog.isDef(var_args)) {
        ks = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__51947__delegate.call(this, coll, k, ks)
    };
    G__51947.cljs$lang$maxFixedArity = 2;
    G__51947.cljs$lang$applyTo = function(arglist__51951) {
      var coll = cljs.core.first(arglist__51951);
      var k = cljs.core.first(cljs.core.next(arglist__51951));
      var ks = cljs.core.rest(cljs.core.next(arglist__51951));
      return G__51947__delegate.call(this, coll, k, ks)
    };
    return G__51947
  }();
  disj = function(coll, k, var_args) {
    var ks = var_args;
    switch(arguments.length) {
      case 1:
        return disj__51943.call(this, coll);
      case 2:
        return disj__51944.call(this, coll, k);
      default:
        return disj__51945.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  disj.cljs$lang$maxFixedArity = 2;
  disj.cljs$lang$applyTo = disj__51945.cljs$lang$applyTo;
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
    var x__451__auto____51952 = x;
    if(cljs.core.truth_(function() {
      var and__3546__auto____51953 = x__451__auto____51952;
      if(cljs.core.truth_(and__3546__auto____51953)) {
        var and__3546__auto____51954 = x__451__auto____51952.cljs$core$ICollection$;
        if(cljs.core.truth_(and__3546__auto____51954)) {
          return cljs.core.not.call(null, x__451__auto____51952.hasOwnProperty("cljs$core$ICollection$"))
        }else {
          return and__3546__auto____51954
        }
      }else {
        return and__3546__auto____51953
      }
    }())) {
      return true
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ICollection, x__451__auto____51952)
    }
  }
};
cljs.core.set_QMARK_ = function set_QMARK_(x) {
  if(cljs.core.truth_(x === null)) {
    return false
  }else {
    var x__451__auto____51955 = x;
    if(cljs.core.truth_(function() {
      var and__3546__auto____51956 = x__451__auto____51955;
      if(cljs.core.truth_(and__3546__auto____51956)) {
        var and__3546__auto____51957 = x__451__auto____51955.cljs$core$ISet$;
        if(cljs.core.truth_(and__3546__auto____51957)) {
          return cljs.core.not.call(null, x__451__auto____51955.hasOwnProperty("cljs$core$ISet$"))
        }else {
          return and__3546__auto____51957
        }
      }else {
        return and__3546__auto____51956
      }
    }())) {
      return true
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ISet, x__451__auto____51955)
    }
  }
};
cljs.core.associative_QMARK_ = function associative_QMARK_(x) {
  var x__451__auto____51958 = x;
  if(cljs.core.truth_(function() {
    var and__3546__auto____51959 = x__451__auto____51958;
    if(cljs.core.truth_(and__3546__auto____51959)) {
      var and__3546__auto____51960 = x__451__auto____51958.cljs$core$IAssociative$;
      if(cljs.core.truth_(and__3546__auto____51960)) {
        return cljs.core.not.call(null, x__451__auto____51958.hasOwnProperty("cljs$core$IAssociative$"))
      }else {
        return and__3546__auto____51960
      }
    }else {
      return and__3546__auto____51959
    }
  }())) {
    return true
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IAssociative, x__451__auto____51958)
  }
};
cljs.core.sequential_QMARK_ = function sequential_QMARK_(x) {
  var x__451__auto____51961 = x;
  if(cljs.core.truth_(function() {
    var and__3546__auto____51962 = x__451__auto____51961;
    if(cljs.core.truth_(and__3546__auto____51962)) {
      var and__3546__auto____51963 = x__451__auto____51961.cljs$core$ISequential$;
      if(cljs.core.truth_(and__3546__auto____51963)) {
        return cljs.core.not.call(null, x__451__auto____51961.hasOwnProperty("cljs$core$ISequential$"))
      }else {
        return and__3546__auto____51963
      }
    }else {
      return and__3546__auto____51962
    }
  }())) {
    return true
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ISequential, x__451__auto____51961)
  }
};
cljs.core.counted_QMARK_ = function counted_QMARK_(x) {
  var x__451__auto____51964 = x;
  if(cljs.core.truth_(function() {
    var and__3546__auto____51965 = x__451__auto____51964;
    if(cljs.core.truth_(and__3546__auto____51965)) {
      var and__3546__auto____51966 = x__451__auto____51964.cljs$core$ICounted$;
      if(cljs.core.truth_(and__3546__auto____51966)) {
        return cljs.core.not.call(null, x__451__auto____51964.hasOwnProperty("cljs$core$ICounted$"))
      }else {
        return and__3546__auto____51966
      }
    }else {
      return and__3546__auto____51965
    }
  }())) {
    return true
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ICounted, x__451__auto____51964)
  }
};
cljs.core.map_QMARK_ = function map_QMARK_(x) {
  if(cljs.core.truth_(x === null)) {
    return false
  }else {
    var x__451__auto____51967 = x;
    if(cljs.core.truth_(function() {
      var and__3546__auto____51968 = x__451__auto____51967;
      if(cljs.core.truth_(and__3546__auto____51968)) {
        var and__3546__auto____51969 = x__451__auto____51967.cljs$core$IMap$;
        if(cljs.core.truth_(and__3546__auto____51969)) {
          return cljs.core.not.call(null, x__451__auto____51967.hasOwnProperty("cljs$core$IMap$"))
        }else {
          return and__3546__auto____51969
        }
      }else {
        return and__3546__auto____51968
      }
    }())) {
      return true
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IMap, x__451__auto____51967)
    }
  }
};
cljs.core.vector_QMARK_ = function vector_QMARK_(x) {
  var x__451__auto____51970 = x;
  if(cljs.core.truth_(function() {
    var and__3546__auto____51971 = x__451__auto____51970;
    if(cljs.core.truth_(and__3546__auto____51971)) {
      var and__3546__auto____51972 = x__451__auto____51970.cljs$core$IVector$;
      if(cljs.core.truth_(and__3546__auto____51972)) {
        return cljs.core.not.call(null, x__451__auto____51970.hasOwnProperty("cljs$core$IVector$"))
      }else {
        return and__3546__auto____51972
      }
    }else {
      return and__3546__auto____51971
    }
  }())) {
    return true
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IVector, x__451__auto____51970)
  }
};
cljs.core.js_obj = function js_obj() {
  return{}
};
cljs.core.js_keys = function js_keys(obj) {
  var keys__51973 = [];
  goog.object.forEach.call(null, obj, function(val, key, obj) {
    return keys__51973.push(key)
  });
  return keys__51973
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
    var x__451__auto____51974 = s;
    if(cljs.core.truth_(function() {
      var and__3546__auto____51975 = x__451__auto____51974;
      if(cljs.core.truth_(and__3546__auto____51975)) {
        var and__3546__auto____51976 = x__451__auto____51974.cljs$core$ISeq$;
        if(cljs.core.truth_(and__3546__auto____51976)) {
          return cljs.core.not.call(null, x__451__auto____51974.hasOwnProperty("cljs$core$ISeq$"))
        }else {
          return and__3546__auto____51976
        }
      }else {
        return and__3546__auto____51975
      }
    }())) {
      return true
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, x__451__auto____51974)
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
  var and__3546__auto____51977 = goog.isString.call(null, x);
  if(cljs.core.truth_(and__3546__auto____51977)) {
    return cljs.core.not.call(null, function() {
      var or__3548__auto____51978 = cljs.core._EQ_.call(null, x.charAt(0), "\ufdd0");
      if(cljs.core.truth_(or__3548__auto____51978)) {
        return or__3548__auto____51978
      }else {
        return cljs.core._EQ_.call(null, x.charAt(0), "\ufdd1")
      }
    }())
  }else {
    return and__3546__auto____51977
  }
};
cljs.core.keyword_QMARK_ = function keyword_QMARK_(x) {
  var and__3546__auto____51979 = goog.isString.call(null, x);
  if(cljs.core.truth_(and__3546__auto____51979)) {
    return cljs.core._EQ_.call(null, x.charAt(0), "\ufdd0")
  }else {
    return and__3546__auto____51979
  }
};
cljs.core.symbol_QMARK_ = function symbol_QMARK_(x) {
  var and__3546__auto____51980 = goog.isString.call(null, x);
  if(cljs.core.truth_(and__3546__auto____51980)) {
    return cljs.core._EQ_.call(null, x.charAt(0), "\ufdd1")
  }else {
    return and__3546__auto____51980
  }
};
cljs.core.number_QMARK_ = function number_QMARK_(n) {
  return goog.isNumber.call(null, n)
};
cljs.core.fn_QMARK_ = function fn_QMARK_(f) {
  return goog.isFunction.call(null, f)
};
cljs.core.integer_QMARK_ = function integer_QMARK_(n) {
  var and__3546__auto____51981 = cljs.core.number_QMARK_.call(null, n);
  if(cljs.core.truth_(and__3546__auto____51981)) {
    return n == n.toFixed()
  }else {
    return and__3546__auto____51981
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
    var and__3546__auto____51982 = coll;
    if(cljs.core.truth_(and__3546__auto____51982)) {
      var and__3546__auto____51983 = cljs.core.associative_QMARK_.call(null, coll);
      if(cljs.core.truth_(and__3546__auto____51983)) {
        return cljs.core.contains_QMARK_.call(null, coll, k)
      }else {
        return and__3546__auto____51983
      }
    }else {
      return and__3546__auto____51982
    }
  }())) {
    return cljs.core.PersistentVector.fromArray([k, cljs.core._lookup.call(null, coll, k)])
  }else {
    return null
  }
};
cljs.core.distinct_QMARK_ = function() {
  var distinct_QMARK_ = null;
  var distinct_QMARK___51988 = function(x) {
    return true
  };
  var distinct_QMARK___51989 = function(x, y) {
    return cljs.core.not.call(null, cljs.core._EQ_.call(null, x, y))
  };
  var distinct_QMARK___51990 = function() {
    var G__51992__delegate = function(x, y, more) {
      if(cljs.core.truth_(cljs.core.not.call(null, cljs.core._EQ_.call(null, x, y)))) {
        var s__51984 = cljs.core.set([y, x]);
        var xs__51985 = more;
        while(true) {
          var x__51986 = cljs.core.first.call(null, xs__51985);
          var etc__51987 = cljs.core.next.call(null, xs__51985);
          if(cljs.core.truth_(xs__51985)) {
            if(cljs.core.truth_(cljs.core.contains_QMARK_.call(null, s__51984, x__51986))) {
              return false
            }else {
              var G__51993 = cljs.core.conj.call(null, s__51984, x__51986);
              var G__51994 = etc__51987;
              s__51984 = G__51993;
              xs__51985 = G__51994;
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
    var G__51992 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__51992__delegate.call(this, x, y, more)
    };
    G__51992.cljs$lang$maxFixedArity = 2;
    G__51992.cljs$lang$applyTo = function(arglist__51995) {
      var x = cljs.core.first(arglist__51995);
      var y = cljs.core.first(cljs.core.next(arglist__51995));
      var more = cljs.core.rest(cljs.core.next(arglist__51995));
      return G__51992__delegate.call(this, x, y, more)
    };
    return G__51992
  }();
  distinct_QMARK_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return distinct_QMARK___51988.call(this, x);
      case 2:
        return distinct_QMARK___51989.call(this, x, y);
      default:
        return distinct_QMARK___51990.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  distinct_QMARK_.cljs$lang$maxFixedArity = 2;
  distinct_QMARK_.cljs$lang$applyTo = distinct_QMARK___51990.cljs$lang$applyTo;
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
      var r__51996 = f.call(null, x, y);
      if(cljs.core.truth_(cljs.core.number_QMARK_.call(null, r__51996))) {
        return r__51996
      }else {
        if(cljs.core.truth_(r__51996)) {
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
  var sort__51998 = function(coll) {
    return sort.call(null, cljs.core.compare, coll)
  };
  var sort__51999 = function(comp, coll) {
    if(cljs.core.truth_(cljs.core.seq.call(null, coll))) {
      var a__51997 = cljs.core.to_array.call(null, coll);
      goog.array.stableSort.call(null, a__51997, cljs.core.fn__GT_comparator.call(null, comp));
      return cljs.core.seq.call(null, a__51997)
    }else {
      return cljs.core.List.EMPTY
    }
  };
  sort = function(comp, coll) {
    switch(arguments.length) {
      case 1:
        return sort__51998.call(this, comp);
      case 2:
        return sort__51999.call(this, comp, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return sort
}();
cljs.core.sort_by = function() {
  var sort_by = null;
  var sort_by__52001 = function(keyfn, coll) {
    return sort_by.call(null, keyfn, cljs.core.compare, coll)
  };
  var sort_by__52002 = function(keyfn, comp, coll) {
    return cljs.core.sort.call(null, function(x, y) {
      return cljs.core.fn__GT_comparator.call(null, comp).call(null, keyfn.call(null, x), keyfn.call(null, y))
    }, coll)
  };
  sort_by = function(keyfn, comp, coll) {
    switch(arguments.length) {
      case 2:
        return sort_by__52001.call(this, keyfn, comp);
      case 3:
        return sort_by__52002.call(this, keyfn, comp, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return sort_by
}();
cljs.core.reduce = function() {
  var reduce = null;
  var reduce__52004 = function(f, coll) {
    return cljs.core._reduce.call(null, coll, f)
  };
  var reduce__52005 = function(f, val, coll) {
    return cljs.core._reduce.call(null, coll, f, val)
  };
  reduce = function(f, val, coll) {
    switch(arguments.length) {
      case 2:
        return reduce__52004.call(this, f, val);
      case 3:
        return reduce__52005.call(this, f, val, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return reduce
}();
cljs.core.seq_reduce = function() {
  var seq_reduce = null;
  var seq_reduce__52011 = function(f, coll) {
    var temp__3695__auto____52007 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3695__auto____52007)) {
      var s__52008 = temp__3695__auto____52007;
      return cljs.core.reduce.call(null, f, cljs.core.first.call(null, s__52008), cljs.core.next.call(null, s__52008))
    }else {
      return f.call(null)
    }
  };
  var seq_reduce__52012 = function(f, val, coll) {
    var val__52009 = val;
    var coll__52010 = cljs.core.seq.call(null, coll);
    while(true) {
      if(cljs.core.truth_(coll__52010)) {
        var G__52014 = f.call(null, val__52009, cljs.core.first.call(null, coll__52010));
        var G__52015 = cljs.core.next.call(null, coll__52010);
        val__52009 = G__52014;
        coll__52010 = G__52015;
        continue
      }else {
        return val__52009
      }
      break
    }
  };
  seq_reduce = function(f, val, coll) {
    switch(arguments.length) {
      case 2:
        return seq_reduce__52011.call(this, f, val);
      case 3:
        return seq_reduce__52012.call(this, f, val, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return seq_reduce
}();
cljs.core.IReduce["_"] = true;
cljs.core._reduce["_"] = function() {
  var G__52016 = null;
  var G__52016__52017 = function(coll, f) {
    return cljs.core.seq_reduce.call(null, f, coll)
  };
  var G__52016__52018 = function(coll, f, start) {
    return cljs.core.seq_reduce.call(null, f, start, coll)
  };
  G__52016 = function(coll, f, start) {
    switch(arguments.length) {
      case 2:
        return G__52016__52017.call(this, coll, f);
      case 3:
        return G__52016__52018.call(this, coll, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__52016
}();
cljs.core._PLUS_ = function() {
  var _PLUS_ = null;
  var _PLUS___52020 = function() {
    return 0
  };
  var _PLUS___52021 = function(x) {
    return x
  };
  var _PLUS___52022 = function(x, y) {
    return x + y
  };
  var _PLUS___52023 = function() {
    var G__52025__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _PLUS_, x + y, more)
    };
    var G__52025 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__52025__delegate.call(this, x, y, more)
    };
    G__52025.cljs$lang$maxFixedArity = 2;
    G__52025.cljs$lang$applyTo = function(arglist__52026) {
      var x = cljs.core.first(arglist__52026);
      var y = cljs.core.first(cljs.core.next(arglist__52026));
      var more = cljs.core.rest(cljs.core.next(arglist__52026));
      return G__52025__delegate.call(this, x, y, more)
    };
    return G__52025
  }();
  _PLUS_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 0:
        return _PLUS___52020.call(this);
      case 1:
        return _PLUS___52021.call(this, x);
      case 2:
        return _PLUS___52022.call(this, x, y);
      default:
        return _PLUS___52023.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _PLUS_.cljs$lang$maxFixedArity = 2;
  _PLUS_.cljs$lang$applyTo = _PLUS___52023.cljs$lang$applyTo;
  return _PLUS_
}();
cljs.core._ = function() {
  var _ = null;
  var ___52027 = function(x) {
    return-x
  };
  var ___52028 = function(x, y) {
    return x - y
  };
  var ___52029 = function() {
    var G__52031__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _, x - y, more)
    };
    var G__52031 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__52031__delegate.call(this, x, y, more)
    };
    G__52031.cljs$lang$maxFixedArity = 2;
    G__52031.cljs$lang$applyTo = function(arglist__52032) {
      var x = cljs.core.first(arglist__52032);
      var y = cljs.core.first(cljs.core.next(arglist__52032));
      var more = cljs.core.rest(cljs.core.next(arglist__52032));
      return G__52031__delegate.call(this, x, y, more)
    };
    return G__52031
  }();
  _ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return ___52027.call(this, x);
      case 2:
        return ___52028.call(this, x, y);
      default:
        return ___52029.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _.cljs$lang$maxFixedArity = 2;
  _.cljs$lang$applyTo = ___52029.cljs$lang$applyTo;
  return _
}();
cljs.core._STAR_ = function() {
  var _STAR_ = null;
  var _STAR___52033 = function() {
    return 1
  };
  var _STAR___52034 = function(x) {
    return x
  };
  var _STAR___52035 = function(x, y) {
    return x * y
  };
  var _STAR___52036 = function() {
    var G__52038__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _STAR_, x * y, more)
    };
    var G__52038 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__52038__delegate.call(this, x, y, more)
    };
    G__52038.cljs$lang$maxFixedArity = 2;
    G__52038.cljs$lang$applyTo = function(arglist__52039) {
      var x = cljs.core.first(arglist__52039);
      var y = cljs.core.first(cljs.core.next(arglist__52039));
      var more = cljs.core.rest(cljs.core.next(arglist__52039));
      return G__52038__delegate.call(this, x, y, more)
    };
    return G__52038
  }();
  _STAR_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 0:
        return _STAR___52033.call(this);
      case 1:
        return _STAR___52034.call(this, x);
      case 2:
        return _STAR___52035.call(this, x, y);
      default:
        return _STAR___52036.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _STAR_.cljs$lang$maxFixedArity = 2;
  _STAR_.cljs$lang$applyTo = _STAR___52036.cljs$lang$applyTo;
  return _STAR_
}();
cljs.core._SLASH_ = function() {
  var _SLASH_ = null;
  var _SLASH___52040 = function(x) {
    return _SLASH_.call(null, 1, x)
  };
  var _SLASH___52041 = function(x, y) {
    return x / y
  };
  var _SLASH___52042 = function() {
    var G__52044__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _SLASH_, _SLASH_.call(null, x, y), more)
    };
    var G__52044 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__52044__delegate.call(this, x, y, more)
    };
    G__52044.cljs$lang$maxFixedArity = 2;
    G__52044.cljs$lang$applyTo = function(arglist__52045) {
      var x = cljs.core.first(arglist__52045);
      var y = cljs.core.first(cljs.core.next(arglist__52045));
      var more = cljs.core.rest(cljs.core.next(arglist__52045));
      return G__52044__delegate.call(this, x, y, more)
    };
    return G__52044
  }();
  _SLASH_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _SLASH___52040.call(this, x);
      case 2:
        return _SLASH___52041.call(this, x, y);
      default:
        return _SLASH___52042.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _SLASH_.cljs$lang$maxFixedArity = 2;
  _SLASH_.cljs$lang$applyTo = _SLASH___52042.cljs$lang$applyTo;
  return _SLASH_
}();
cljs.core._LT_ = function() {
  var _LT_ = null;
  var _LT___52046 = function(x) {
    return true
  };
  var _LT___52047 = function(x, y) {
    return x < y
  };
  var _LT___52048 = function() {
    var G__52050__delegate = function(x, y, more) {
      while(true) {
        if(cljs.core.truth_(x < y)) {
          if(cljs.core.truth_(cljs.core.next.call(null, more))) {
            var G__52051 = y;
            var G__52052 = cljs.core.first.call(null, more);
            var G__52053 = cljs.core.next.call(null, more);
            x = G__52051;
            y = G__52052;
            more = G__52053;
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
    var G__52050 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__52050__delegate.call(this, x, y, more)
    };
    G__52050.cljs$lang$maxFixedArity = 2;
    G__52050.cljs$lang$applyTo = function(arglist__52054) {
      var x = cljs.core.first(arglist__52054);
      var y = cljs.core.first(cljs.core.next(arglist__52054));
      var more = cljs.core.rest(cljs.core.next(arglist__52054));
      return G__52050__delegate.call(this, x, y, more)
    };
    return G__52050
  }();
  _LT_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _LT___52046.call(this, x);
      case 2:
        return _LT___52047.call(this, x, y);
      default:
        return _LT___52048.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _LT_.cljs$lang$maxFixedArity = 2;
  _LT_.cljs$lang$applyTo = _LT___52048.cljs$lang$applyTo;
  return _LT_
}();
cljs.core._LT__EQ_ = function() {
  var _LT__EQ_ = null;
  var _LT__EQ___52055 = function(x) {
    return true
  };
  var _LT__EQ___52056 = function(x, y) {
    return x <= y
  };
  var _LT__EQ___52057 = function() {
    var G__52059__delegate = function(x, y, more) {
      while(true) {
        if(cljs.core.truth_(x <= y)) {
          if(cljs.core.truth_(cljs.core.next.call(null, more))) {
            var G__52060 = y;
            var G__52061 = cljs.core.first.call(null, more);
            var G__52062 = cljs.core.next.call(null, more);
            x = G__52060;
            y = G__52061;
            more = G__52062;
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
    var G__52059 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__52059__delegate.call(this, x, y, more)
    };
    G__52059.cljs$lang$maxFixedArity = 2;
    G__52059.cljs$lang$applyTo = function(arglist__52063) {
      var x = cljs.core.first(arglist__52063);
      var y = cljs.core.first(cljs.core.next(arglist__52063));
      var more = cljs.core.rest(cljs.core.next(arglist__52063));
      return G__52059__delegate.call(this, x, y, more)
    };
    return G__52059
  }();
  _LT__EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _LT__EQ___52055.call(this, x);
      case 2:
        return _LT__EQ___52056.call(this, x, y);
      default:
        return _LT__EQ___52057.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _LT__EQ_.cljs$lang$maxFixedArity = 2;
  _LT__EQ_.cljs$lang$applyTo = _LT__EQ___52057.cljs$lang$applyTo;
  return _LT__EQ_
}();
cljs.core._GT_ = function() {
  var _GT_ = null;
  var _GT___52064 = function(x) {
    return true
  };
  var _GT___52065 = function(x, y) {
    return x > y
  };
  var _GT___52066 = function() {
    var G__52068__delegate = function(x, y, more) {
      while(true) {
        if(cljs.core.truth_(x > y)) {
          if(cljs.core.truth_(cljs.core.next.call(null, more))) {
            var G__52069 = y;
            var G__52070 = cljs.core.first.call(null, more);
            var G__52071 = cljs.core.next.call(null, more);
            x = G__52069;
            y = G__52070;
            more = G__52071;
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
    var G__52068 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__52068__delegate.call(this, x, y, more)
    };
    G__52068.cljs$lang$maxFixedArity = 2;
    G__52068.cljs$lang$applyTo = function(arglist__52072) {
      var x = cljs.core.first(arglist__52072);
      var y = cljs.core.first(cljs.core.next(arglist__52072));
      var more = cljs.core.rest(cljs.core.next(arglist__52072));
      return G__52068__delegate.call(this, x, y, more)
    };
    return G__52068
  }();
  _GT_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _GT___52064.call(this, x);
      case 2:
        return _GT___52065.call(this, x, y);
      default:
        return _GT___52066.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _GT_.cljs$lang$maxFixedArity = 2;
  _GT_.cljs$lang$applyTo = _GT___52066.cljs$lang$applyTo;
  return _GT_
}();
cljs.core._GT__EQ_ = function() {
  var _GT__EQ_ = null;
  var _GT__EQ___52073 = function(x) {
    return true
  };
  var _GT__EQ___52074 = function(x, y) {
    return x >= y
  };
  var _GT__EQ___52075 = function() {
    var G__52077__delegate = function(x, y, more) {
      while(true) {
        if(cljs.core.truth_(x >= y)) {
          if(cljs.core.truth_(cljs.core.next.call(null, more))) {
            var G__52078 = y;
            var G__52079 = cljs.core.first.call(null, more);
            var G__52080 = cljs.core.next.call(null, more);
            x = G__52078;
            y = G__52079;
            more = G__52080;
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
    var G__52077 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__52077__delegate.call(this, x, y, more)
    };
    G__52077.cljs$lang$maxFixedArity = 2;
    G__52077.cljs$lang$applyTo = function(arglist__52081) {
      var x = cljs.core.first(arglist__52081);
      var y = cljs.core.first(cljs.core.next(arglist__52081));
      var more = cljs.core.rest(cljs.core.next(arglist__52081));
      return G__52077__delegate.call(this, x, y, more)
    };
    return G__52077
  }();
  _GT__EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _GT__EQ___52073.call(this, x);
      case 2:
        return _GT__EQ___52074.call(this, x, y);
      default:
        return _GT__EQ___52075.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _GT__EQ_.cljs$lang$maxFixedArity = 2;
  _GT__EQ_.cljs$lang$applyTo = _GT__EQ___52075.cljs$lang$applyTo;
  return _GT__EQ_
}();
cljs.core.dec = function dec(x) {
  return x - 1
};
cljs.core.max = function() {
  var max = null;
  var max__52082 = function(x) {
    return x
  };
  var max__52083 = function(x, y) {
    return x > y ? x : y
  };
  var max__52084 = function() {
    var G__52086__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, max, x > y ? x : y, more)
    };
    var G__52086 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__52086__delegate.call(this, x, y, more)
    };
    G__52086.cljs$lang$maxFixedArity = 2;
    G__52086.cljs$lang$applyTo = function(arglist__52087) {
      var x = cljs.core.first(arglist__52087);
      var y = cljs.core.first(cljs.core.next(arglist__52087));
      var more = cljs.core.rest(cljs.core.next(arglist__52087));
      return G__52086__delegate.call(this, x, y, more)
    };
    return G__52086
  }();
  max = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return max__52082.call(this, x);
      case 2:
        return max__52083.call(this, x, y);
      default:
        return max__52084.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  max.cljs$lang$maxFixedArity = 2;
  max.cljs$lang$applyTo = max__52084.cljs$lang$applyTo;
  return max
}();
cljs.core.min = function() {
  var min = null;
  var min__52088 = function(x) {
    return x
  };
  var min__52089 = function(x, y) {
    return x < y ? x : y
  };
  var min__52090 = function() {
    var G__52092__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, min, x < y ? x : y, more)
    };
    var G__52092 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__52092__delegate.call(this, x, y, more)
    };
    G__52092.cljs$lang$maxFixedArity = 2;
    G__52092.cljs$lang$applyTo = function(arglist__52093) {
      var x = cljs.core.first(arglist__52093);
      var y = cljs.core.first(cljs.core.next(arglist__52093));
      var more = cljs.core.rest(cljs.core.next(arglist__52093));
      return G__52092__delegate.call(this, x, y, more)
    };
    return G__52092
  }();
  min = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return min__52088.call(this, x);
      case 2:
        return min__52089.call(this, x, y);
      default:
        return min__52090.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  min.cljs$lang$maxFixedArity = 2;
  min.cljs$lang$applyTo = min__52090.cljs$lang$applyTo;
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
  var rem__52094 = n % d;
  return cljs.core.fix.call(null, (n - rem__52094) / d)
};
cljs.core.rem = function rem(n, d) {
  var q__52095 = cljs.core.quot.call(null, n, d);
  return n - d * q__52095
};
cljs.core.rand = function() {
  var rand = null;
  var rand__52096 = function() {
    return Math.random.call(null)
  };
  var rand__52097 = function(n) {
    return n * rand.call(null)
  };
  rand = function(n) {
    switch(arguments.length) {
      case 0:
        return rand__52096.call(this);
      case 1:
        return rand__52097.call(this, n)
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
  var _EQ__EQ___52099 = function(x) {
    return true
  };
  var _EQ__EQ___52100 = function(x, y) {
    return cljs.core._equiv.call(null, x, y)
  };
  var _EQ__EQ___52101 = function() {
    var G__52103__delegate = function(x, y, more) {
      while(true) {
        if(cljs.core.truth_(_EQ__EQ_.call(null, x, y))) {
          if(cljs.core.truth_(cljs.core.next.call(null, more))) {
            var G__52104 = y;
            var G__52105 = cljs.core.first.call(null, more);
            var G__52106 = cljs.core.next.call(null, more);
            x = G__52104;
            y = G__52105;
            more = G__52106;
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
    var G__52103 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__52103__delegate.call(this, x, y, more)
    };
    G__52103.cljs$lang$maxFixedArity = 2;
    G__52103.cljs$lang$applyTo = function(arglist__52107) {
      var x = cljs.core.first(arglist__52107);
      var y = cljs.core.first(cljs.core.next(arglist__52107));
      var more = cljs.core.rest(cljs.core.next(arglist__52107));
      return G__52103__delegate.call(this, x, y, more)
    };
    return G__52103
  }();
  _EQ__EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _EQ__EQ___52099.call(this, x);
      case 2:
        return _EQ__EQ___52100.call(this, x, y);
      default:
        return _EQ__EQ___52101.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _EQ__EQ_.cljs$lang$maxFixedArity = 2;
  _EQ__EQ_.cljs$lang$applyTo = _EQ__EQ___52101.cljs$lang$applyTo;
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
  var n__52108 = n;
  var xs__52109 = cljs.core.seq.call(null, coll);
  while(true) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____52110 = xs__52109;
      if(cljs.core.truth_(and__3546__auto____52110)) {
        return n__52108 > 0
      }else {
        return and__3546__auto____52110
      }
    }())) {
      var G__52111 = n__52108 - 1;
      var G__52112 = cljs.core.next.call(null, xs__52109);
      n__52108 = G__52111;
      xs__52109 = G__52112;
      continue
    }else {
      return xs__52109
    }
    break
  }
};
cljs.core.IIndexed["_"] = true;
cljs.core._nth["_"] = function() {
  var G__52117 = null;
  var G__52117__52118 = function(coll, n) {
    var temp__3695__auto____52113 = cljs.core.nthnext.call(null, coll, n);
    if(cljs.core.truth_(temp__3695__auto____52113)) {
      var xs__52114 = temp__3695__auto____52113;
      return cljs.core.first.call(null, xs__52114)
    }else {
      throw new Error("Index out of bounds");
    }
  };
  var G__52117__52119 = function(coll, n, not_found) {
    var temp__3695__auto____52115 = cljs.core.nthnext.call(null, coll, n);
    if(cljs.core.truth_(temp__3695__auto____52115)) {
      var xs__52116 = temp__3695__auto____52115;
      return cljs.core.first.call(null, xs__52116)
    }else {
      return not_found
    }
  };
  G__52117 = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__52117__52118.call(this, coll, n);
      case 3:
        return G__52117__52119.call(this, coll, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__52117
}();
cljs.core.str_STAR_ = function() {
  var str_STAR_ = null;
  var str_STAR___52121 = function() {
    return""
  };
  var str_STAR___52122 = function(x) {
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
  var str_STAR___52123 = function() {
    var G__52125__delegate = function(x, ys) {
      return function(sb, more) {
        while(true) {
          if(cljs.core.truth_(more)) {
            var G__52126 = sb.append(str_STAR_.call(null, cljs.core.first.call(null, more)));
            var G__52127 = cljs.core.next.call(null, more);
            sb = G__52126;
            more = G__52127;
            continue
          }else {
            return str_STAR_.call(null, sb)
          }
          break
        }
      }.call(null, new goog.string.StringBuffer(str_STAR_.call(null, x)), ys)
    };
    var G__52125 = function(x, var_args) {
      var ys = null;
      if(goog.isDef(var_args)) {
        ys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__52125__delegate.call(this, x, ys)
    };
    G__52125.cljs$lang$maxFixedArity = 1;
    G__52125.cljs$lang$applyTo = function(arglist__52128) {
      var x = cljs.core.first(arglist__52128);
      var ys = cljs.core.rest(arglist__52128);
      return G__52125__delegate.call(this, x, ys)
    };
    return G__52125
  }();
  str_STAR_ = function(x, var_args) {
    var ys = var_args;
    switch(arguments.length) {
      case 0:
        return str_STAR___52121.call(this);
      case 1:
        return str_STAR___52122.call(this, x);
      default:
        return str_STAR___52123.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  str_STAR_.cljs$lang$maxFixedArity = 1;
  str_STAR_.cljs$lang$applyTo = str_STAR___52123.cljs$lang$applyTo;
  return str_STAR_
}();
cljs.core.str = function() {
  var str = null;
  var str__52129 = function() {
    return""
  };
  var str__52130 = function(x) {
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
  var str__52131 = function() {
    var G__52133__delegate = function(x, ys) {
      return function(sb, more) {
        while(true) {
          if(cljs.core.truth_(more)) {
            var G__52134 = sb.append(str.call(null, cljs.core.first.call(null, more)));
            var G__52135 = cljs.core.next.call(null, more);
            sb = G__52134;
            more = G__52135;
            continue
          }else {
            return cljs.core.str_STAR_.call(null, sb)
          }
          break
        }
      }.call(null, new goog.string.StringBuffer(str.call(null, x)), ys)
    };
    var G__52133 = function(x, var_args) {
      var ys = null;
      if(goog.isDef(var_args)) {
        ys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__52133__delegate.call(this, x, ys)
    };
    G__52133.cljs$lang$maxFixedArity = 1;
    G__52133.cljs$lang$applyTo = function(arglist__52136) {
      var x = cljs.core.first(arglist__52136);
      var ys = cljs.core.rest(arglist__52136);
      return G__52133__delegate.call(this, x, ys)
    };
    return G__52133
  }();
  str = function(x, var_args) {
    var ys = var_args;
    switch(arguments.length) {
      case 0:
        return str__52129.call(this);
      case 1:
        return str__52130.call(this, x);
      default:
        return str__52131.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  str.cljs$lang$maxFixedArity = 1;
  str.cljs$lang$applyTo = str__52131.cljs$lang$applyTo;
  return str
}();
cljs.core.subs = function() {
  var subs = null;
  var subs__52137 = function(s, start) {
    return s.substring(start)
  };
  var subs__52138 = function(s, start, end) {
    return s.substring(start, end)
  };
  subs = function(s, start, end) {
    switch(arguments.length) {
      case 2:
        return subs__52137.call(this, s, start);
      case 3:
        return subs__52138.call(this, s, start, end)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return subs
}();
cljs.core.symbol = function() {
  var symbol = null;
  var symbol__52140 = function(name) {
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
  var symbol__52141 = function(ns, name) {
    return symbol.call(null, cljs.core.str_STAR_.call(null, ns, "/", name))
  };
  symbol = function(ns, name) {
    switch(arguments.length) {
      case 1:
        return symbol__52140.call(this, ns);
      case 2:
        return symbol__52141.call(this, ns, name)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return symbol
}();
cljs.core.keyword = function() {
  var keyword = null;
  var keyword__52143 = function(name) {
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
  var keyword__52144 = function(ns, name) {
    return keyword.call(null, cljs.core.str_STAR_.call(null, ns, "/", name))
  };
  keyword = function(ns, name) {
    switch(arguments.length) {
      case 1:
        return keyword__52143.call(this, ns);
      case 2:
        return keyword__52144.call(this, ns, name)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return keyword
}();
cljs.core.equiv_sequential = function equiv_sequential(x, y) {
  return cljs.core.boolean$.call(null, cljs.core.truth_(cljs.core.sequential_QMARK_.call(null, y)) ? function() {
    var xs__52146 = cljs.core.seq.call(null, x);
    var ys__52147 = cljs.core.seq.call(null, y);
    while(true) {
      if(cljs.core.truth_(xs__52146 === null)) {
        return ys__52147 === null
      }else {
        if(cljs.core.truth_(ys__52147 === null)) {
          return false
        }else {
          if(cljs.core.truth_(cljs.core._EQ_.call(null, cljs.core.first.call(null, xs__52146), cljs.core.first.call(null, ys__52147)))) {
            var G__52148 = cljs.core.next.call(null, xs__52146);
            var G__52149 = cljs.core.next.call(null, ys__52147);
            xs__52146 = G__52148;
            ys__52147 = G__52149;
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
  return cljs.core.reduce.call(null, function(p1__52150_SHARP_, p2__52151_SHARP_) {
    return cljs.core.hash_combine.call(null, p1__52150_SHARP_, cljs.core.hash.call(null, p2__52151_SHARP_))
  }, cljs.core.hash.call(null, cljs.core.first.call(null, coll)), cljs.core.next.call(null, coll))
};
cljs.core.extend_object_BANG_ = function extend_object_BANG_(obj, fn_map) {
  var G__52152__52153 = cljs.core.seq.call(null, fn_map);
  if(cljs.core.truth_(G__52152__52153)) {
    var G__52155__52157 = cljs.core.first.call(null, G__52152__52153);
    var vec__52156__52158 = G__52155__52157;
    var key_name__52159 = cljs.core.nth.call(null, vec__52156__52158, 0, null);
    var f__52160 = cljs.core.nth.call(null, vec__52156__52158, 1, null);
    var G__52152__52161 = G__52152__52153;
    var G__52155__52162 = G__52155__52157;
    var G__52152__52163 = G__52152__52161;
    while(true) {
      var vec__52164__52165 = G__52155__52162;
      var key_name__52166 = cljs.core.nth.call(null, vec__52164__52165, 0, null);
      var f__52167 = cljs.core.nth.call(null, vec__52164__52165, 1, null);
      var G__52152__52168 = G__52152__52163;
      var str_name__52169 = cljs.core.name.call(null, key_name__52166);
      obj[str_name__52169] = f__52167;
      var temp__3698__auto____52170 = cljs.core.next.call(null, G__52152__52168);
      if(cljs.core.truth_(temp__3698__auto____52170)) {
        var G__52152__52171 = temp__3698__auto____52170;
        var G__52172 = cljs.core.first.call(null, G__52152__52171);
        var G__52173 = G__52152__52171;
        G__52155__52162 = G__52172;
        G__52152__52163 = G__52173;
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
  var this__52174 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.List.prototype.cljs$core$ISequential$ = true;
cljs.core.List.prototype.cljs$core$ICollection$ = true;
cljs.core.List.prototype.cljs$core$ICollection$_conj = function(coll, o) {
  var this__52175 = this;
  return new cljs.core.List(this__52175.meta, o, coll, this__52175.count + 1)
};
cljs.core.List.prototype.cljs$core$ISeqable$ = true;
cljs.core.List.prototype.cljs$core$ISeqable$_seq = function(coll) {
  var this__52176 = this;
  return coll
};
cljs.core.List.prototype.cljs$core$ICounted$ = true;
cljs.core.List.prototype.cljs$core$ICounted$_count = function(coll) {
  var this__52177 = this;
  return this__52177.count
};
cljs.core.List.prototype.cljs$core$IStack$ = true;
cljs.core.List.prototype.cljs$core$IStack$_peek = function(coll) {
  var this__52178 = this;
  return this__52178.first
};
cljs.core.List.prototype.cljs$core$IStack$_pop = function(coll) {
  var this__52179 = this;
  return cljs.core._rest.call(null, coll)
};
cljs.core.List.prototype.cljs$core$ISeq$ = true;
cljs.core.List.prototype.cljs$core$ISeq$_first = function(coll) {
  var this__52180 = this;
  return this__52180.first
};
cljs.core.List.prototype.cljs$core$ISeq$_rest = function(coll) {
  var this__52181 = this;
  return this__52181.rest
};
cljs.core.List.prototype.cljs$core$IEquiv$ = true;
cljs.core.List.prototype.cljs$core$IEquiv$_equiv = function(coll, other) {
  var this__52182 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.List.prototype.cljs$core$IWithMeta$ = true;
cljs.core.List.prototype.cljs$core$IWithMeta$_with_meta = function(coll, meta) {
  var this__52183 = this;
  return new cljs.core.List(meta, this__52183.first, this__52183.rest, this__52183.count)
};
cljs.core.List.prototype.cljs$core$IMeta$ = true;
cljs.core.List.prototype.cljs$core$IMeta$_meta = function(coll) {
  var this__52184 = this;
  return this__52184.meta
};
cljs.core.List.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.List.prototype.cljs$core$IEmptyableCollection$_empty = function(coll) {
  var this__52185 = this;
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
  var this__52186 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.EmptyList.prototype.cljs$core$ISequential$ = true;
cljs.core.EmptyList.prototype.cljs$core$ICollection$ = true;
cljs.core.EmptyList.prototype.cljs$core$ICollection$_conj = function(coll, o) {
  var this__52187 = this;
  return new cljs.core.List(this__52187.meta, o, null, 1)
};
cljs.core.EmptyList.prototype.cljs$core$ISeqable$ = true;
cljs.core.EmptyList.prototype.cljs$core$ISeqable$_seq = function(coll) {
  var this__52188 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ICounted$ = true;
cljs.core.EmptyList.prototype.cljs$core$ICounted$_count = function(coll) {
  var this__52189 = this;
  return 0
};
cljs.core.EmptyList.prototype.cljs$core$IStack$ = true;
cljs.core.EmptyList.prototype.cljs$core$IStack$_peek = function(coll) {
  var this__52190 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$IStack$_pop = function(coll) {
  var this__52191 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ISeq$ = true;
cljs.core.EmptyList.prototype.cljs$core$ISeq$_first = function(coll) {
  var this__52192 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ISeq$_rest = function(coll) {
  var this__52193 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$IEquiv$ = true;
cljs.core.EmptyList.prototype.cljs$core$IEquiv$_equiv = function(coll, other) {
  var this__52194 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.EmptyList.prototype.cljs$core$IWithMeta$ = true;
cljs.core.EmptyList.prototype.cljs$core$IWithMeta$_with_meta = function(coll, meta) {
  var this__52195 = this;
  return new cljs.core.EmptyList(meta)
};
cljs.core.EmptyList.prototype.cljs$core$IMeta$ = true;
cljs.core.EmptyList.prototype.cljs$core$IMeta$_meta = function(coll) {
  var this__52196 = this;
  return this__52196.meta
};
cljs.core.EmptyList.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.EmptyList.prototype.cljs$core$IEmptyableCollection$_empty = function(coll) {
  var this__52197 = this;
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
  list.cljs$lang$applyTo = function(arglist__52198) {
    var items = cljs.core.seq(arglist__52198);
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
  var this__52199 = this;
  return coll
};
cljs.core.Cons.prototype.cljs$core$IHash$ = true;
cljs.core.Cons.prototype.cljs$core$IHash$_hash = function(coll) {
  var this__52200 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.Cons.prototype.cljs$core$IEquiv$ = true;
cljs.core.Cons.prototype.cljs$core$IEquiv$_equiv = function(coll, other) {
  var this__52201 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Cons.prototype.cljs$core$ISequential$ = true;
cljs.core.Cons.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.Cons.prototype.cljs$core$IEmptyableCollection$_empty = function(coll) {
  var this__52202 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__52202.meta)
};
cljs.core.Cons.prototype.cljs$core$ICollection$ = true;
cljs.core.Cons.prototype.cljs$core$ICollection$_conj = function(coll, o) {
  var this__52203 = this;
  return new cljs.core.Cons(null, o, coll)
};
cljs.core.Cons.prototype.cljs$core$ISeq$ = true;
cljs.core.Cons.prototype.cljs$core$ISeq$_first = function(coll) {
  var this__52204 = this;
  return this__52204.first
};
cljs.core.Cons.prototype.cljs$core$ISeq$_rest = function(coll) {
  var this__52205 = this;
  if(cljs.core.truth_(this__52205.rest === null)) {
    return cljs.core.List.EMPTY
  }else {
    return this__52205.rest
  }
};
cljs.core.Cons.prototype.cljs$core$IMeta$ = true;
cljs.core.Cons.prototype.cljs$core$IMeta$_meta = function(coll) {
  var this__52206 = this;
  return this__52206.meta
};
cljs.core.Cons.prototype.cljs$core$IWithMeta$ = true;
cljs.core.Cons.prototype.cljs$core$IWithMeta$_with_meta = function(coll, meta) {
  var this__52207 = this;
  return new cljs.core.Cons(meta, this__52207.first, this__52207.rest)
};
cljs.core.Cons;
cljs.core.cons = function cons(x, seq) {
  return new cljs.core.Cons(null, x, seq)
};
cljs.core.IReduce["string"] = true;
cljs.core._reduce["string"] = function() {
  var G__52208 = null;
  var G__52208__52209 = function(string, f) {
    return cljs.core.ci_reduce.call(null, string, f)
  };
  var G__52208__52210 = function(string, f, start) {
    return cljs.core.ci_reduce.call(null, string, f, start)
  };
  G__52208 = function(string, f, start) {
    switch(arguments.length) {
      case 2:
        return G__52208__52209.call(this, string, f);
      case 3:
        return G__52208__52210.call(this, string, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__52208
}();
cljs.core.ILookup["string"] = true;
cljs.core._lookup["string"] = function() {
  var G__52212 = null;
  var G__52212__52213 = function(string, k) {
    return cljs.core._nth.call(null, string, k)
  };
  var G__52212__52214 = function(string, k, not_found) {
    return cljs.core._nth.call(null, string, k, not_found)
  };
  G__52212 = function(string, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__52212__52213.call(this, string, k);
      case 3:
        return G__52212__52214.call(this, string, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__52212
}();
cljs.core.IIndexed["string"] = true;
cljs.core._nth["string"] = function() {
  var G__52216 = null;
  var G__52216__52217 = function(string, n) {
    if(cljs.core.truth_(n < cljs.core._count.call(null, string))) {
      return string.charAt(n)
    }else {
      return null
    }
  };
  var G__52216__52218 = function(string, n, not_found) {
    if(cljs.core.truth_(n < cljs.core._count.call(null, string))) {
      return string.charAt(n)
    }else {
      return not_found
    }
  };
  G__52216 = function(string, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__52216__52217.call(this, string, n);
      case 3:
        return G__52216__52218.call(this, string, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__52216
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
  var G__52226 = null;
  var G__52226__52227 = function(tsym52220, coll) {
    var tsym52220__52222 = this;
    var this$__52223 = tsym52220__52222;
    return cljs.core.get.call(null, coll, this$__52223.toString())
  };
  var G__52226__52228 = function(tsym52221, coll, not_found) {
    var tsym52221__52224 = this;
    var this$__52225 = tsym52221__52224;
    return cljs.core.get.call(null, coll, this$__52225.toString(), not_found)
  };
  G__52226 = function(tsym52221, coll, not_found) {
    switch(arguments.length) {
      case 2:
        return G__52226__52227.call(this, tsym52221, coll);
      case 3:
        return G__52226__52228.call(this, tsym52221, coll, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__52226
}();
String["prototype"]["apply"] = function(s, args) {
  if(cljs.core.truth_(cljs.core.count.call(null, args) < 2)) {
    return cljs.core.get.call(null, args[0], s)
  }else {
    return cljs.core.get.call(null, args[0], s, args[1])
  }
};
cljs.core.lazy_seq_value = function lazy_seq_value(lazy_seq) {
  var x__52230 = lazy_seq.x;
  if(cljs.core.truth_(lazy_seq.realized)) {
    return x__52230
  }else {
    lazy_seq.x = x__52230.call(null);
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
  var this__52231 = this;
  return cljs.core.seq.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$IHash$ = true;
cljs.core.LazySeq.prototype.cljs$core$IHash$_hash = function(coll) {
  var this__52232 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.LazySeq.prototype.cljs$core$IEquiv$ = true;
cljs.core.LazySeq.prototype.cljs$core$IEquiv$_equiv = function(coll, other) {
  var this__52233 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.LazySeq.prototype.cljs$core$ISequential$ = true;
cljs.core.LazySeq.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.LazySeq.prototype.cljs$core$IEmptyableCollection$_empty = function(coll) {
  var this__52234 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__52234.meta)
};
cljs.core.LazySeq.prototype.cljs$core$ICollection$ = true;
cljs.core.LazySeq.prototype.cljs$core$ICollection$_conj = function(coll, o) {
  var this__52235 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.LazySeq.prototype.cljs$core$ISeq$ = true;
cljs.core.LazySeq.prototype.cljs$core$ISeq$_first = function(coll) {
  var this__52236 = this;
  return cljs.core.first.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$ISeq$_rest = function(coll) {
  var this__52237 = this;
  return cljs.core.rest.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$IMeta$ = true;
cljs.core.LazySeq.prototype.cljs$core$IMeta$_meta = function(coll) {
  var this__52238 = this;
  return this__52238.meta
};
cljs.core.LazySeq.prototype.cljs$core$IWithMeta$ = true;
cljs.core.LazySeq.prototype.cljs$core$IWithMeta$_with_meta = function(coll, meta) {
  var this__52239 = this;
  return new cljs.core.LazySeq(meta, this__52239.realized, this__52239.x)
};
cljs.core.LazySeq;
cljs.core.to_array = function to_array(s) {
  var ary__52240 = [];
  var s__52241 = s;
  while(true) {
    if(cljs.core.truth_(cljs.core.seq.call(null, s__52241))) {
      ary__52240.push(cljs.core.first.call(null, s__52241));
      var G__52242 = cljs.core.next.call(null, s__52241);
      s__52241 = G__52242;
      continue
    }else {
      return ary__52240
    }
    break
  }
};
cljs.core.bounded_count = function bounded_count(s, n) {
  var s__52243 = s;
  var i__52244 = n;
  var sum__52245 = 0;
  while(true) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____52246 = i__52244 > 0;
      if(cljs.core.truth_(and__3546__auto____52246)) {
        return cljs.core.seq.call(null, s__52243)
      }else {
        return and__3546__auto____52246
      }
    }())) {
      var G__52247 = cljs.core.next.call(null, s__52243);
      var G__52248 = i__52244 - 1;
      var G__52249 = sum__52245 + 1;
      s__52243 = G__52247;
      i__52244 = G__52248;
      sum__52245 = G__52249;
      continue
    }else {
      return sum__52245
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
  var concat__52253 = function() {
    return new cljs.core.LazySeq(null, false, function() {
      return null
    })
  };
  var concat__52254 = function(x) {
    return new cljs.core.LazySeq(null, false, function() {
      return x
    })
  };
  var concat__52255 = function(x, y) {
    return new cljs.core.LazySeq(null, false, function() {
      var s__52250 = cljs.core.seq.call(null, x);
      if(cljs.core.truth_(s__52250)) {
        return cljs.core.cons.call(null, cljs.core.first.call(null, s__52250), concat.call(null, cljs.core.rest.call(null, s__52250), y))
      }else {
        return y
      }
    })
  };
  var concat__52256 = function() {
    var G__52258__delegate = function(x, y, zs) {
      var cat__52252 = function cat(xys, zs) {
        return new cljs.core.LazySeq(null, false, function() {
          var xys__52251 = cljs.core.seq.call(null, xys);
          if(cljs.core.truth_(xys__52251)) {
            return cljs.core.cons.call(null, cljs.core.first.call(null, xys__52251), cat.call(null, cljs.core.rest.call(null, xys__52251), zs))
          }else {
            if(cljs.core.truth_(zs)) {
              return cat.call(null, cljs.core.first.call(null, zs), cljs.core.next.call(null, zs))
            }else {
              return null
            }
          }
        })
      };
      return cat__52252.call(null, concat.call(null, x, y), zs)
    };
    var G__52258 = function(x, y, var_args) {
      var zs = null;
      if(goog.isDef(var_args)) {
        zs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__52258__delegate.call(this, x, y, zs)
    };
    G__52258.cljs$lang$maxFixedArity = 2;
    G__52258.cljs$lang$applyTo = function(arglist__52259) {
      var x = cljs.core.first(arglist__52259);
      var y = cljs.core.first(cljs.core.next(arglist__52259));
      var zs = cljs.core.rest(cljs.core.next(arglist__52259));
      return G__52258__delegate.call(this, x, y, zs)
    };
    return G__52258
  }();
  concat = function(x, y, var_args) {
    var zs = var_args;
    switch(arguments.length) {
      case 0:
        return concat__52253.call(this);
      case 1:
        return concat__52254.call(this, x);
      case 2:
        return concat__52255.call(this, x, y);
      default:
        return concat__52256.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  concat.cljs$lang$maxFixedArity = 2;
  concat.cljs$lang$applyTo = concat__52256.cljs$lang$applyTo;
  return concat
}();
cljs.core.list_STAR_ = function() {
  var list_STAR_ = null;
  var list_STAR___52260 = function(args) {
    return cljs.core.seq.call(null, args)
  };
  var list_STAR___52261 = function(a, args) {
    return cljs.core.cons.call(null, a, args)
  };
  var list_STAR___52262 = function(a, b, args) {
    return cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, args))
  };
  var list_STAR___52263 = function(a, b, c, args) {
    return cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, args)))
  };
  var list_STAR___52264 = function() {
    var G__52266__delegate = function(a, b, c, d, more) {
      return cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, cljs.core.cons.call(null, d, cljs.core.spread.call(null, more)))))
    };
    var G__52266 = function(a, b, c, d, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__52266__delegate.call(this, a, b, c, d, more)
    };
    G__52266.cljs$lang$maxFixedArity = 4;
    G__52266.cljs$lang$applyTo = function(arglist__52267) {
      var a = cljs.core.first(arglist__52267);
      var b = cljs.core.first(cljs.core.next(arglist__52267));
      var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__52267)));
      var d = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__52267))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__52267))));
      return G__52266__delegate.call(this, a, b, c, d, more)
    };
    return G__52266
  }();
  list_STAR_ = function(a, b, c, d, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return list_STAR___52260.call(this, a);
      case 2:
        return list_STAR___52261.call(this, a, b);
      case 3:
        return list_STAR___52262.call(this, a, b, c);
      case 4:
        return list_STAR___52263.call(this, a, b, c, d);
      default:
        return list_STAR___52264.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  list_STAR_.cljs$lang$maxFixedArity = 4;
  list_STAR_.cljs$lang$applyTo = list_STAR___52264.cljs$lang$applyTo;
  return list_STAR_
}();
cljs.core.apply = function() {
  var apply = null;
  var apply__52277 = function(f, args) {
    var fixed_arity__52268 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      if(cljs.core.truth_(cljs.core.bounded_count.call(null, args, fixed_arity__52268 + 1) <= fixed_arity__52268)) {
        return f.apply(f, cljs.core.to_array.call(null, args))
      }else {
        return f.cljs$lang$applyTo(args)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, args))
    }
  };
  var apply__52278 = function(f, x, args) {
    var arglist__52269 = cljs.core.list_STAR_.call(null, x, args);
    var fixed_arity__52270 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      if(cljs.core.truth_(cljs.core.bounded_count.call(null, arglist__52269, fixed_arity__52270) <= fixed_arity__52270)) {
        return f.apply(f, cljs.core.to_array.call(null, arglist__52269))
      }else {
        return f.cljs$lang$applyTo(arglist__52269)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__52269))
    }
  };
  var apply__52279 = function(f, x, y, args) {
    var arglist__52271 = cljs.core.list_STAR_.call(null, x, y, args);
    var fixed_arity__52272 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      if(cljs.core.truth_(cljs.core.bounded_count.call(null, arglist__52271, fixed_arity__52272) <= fixed_arity__52272)) {
        return f.apply(f, cljs.core.to_array.call(null, arglist__52271))
      }else {
        return f.cljs$lang$applyTo(arglist__52271)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__52271))
    }
  };
  var apply__52280 = function(f, x, y, z, args) {
    var arglist__52273 = cljs.core.list_STAR_.call(null, x, y, z, args);
    var fixed_arity__52274 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      if(cljs.core.truth_(cljs.core.bounded_count.call(null, arglist__52273, fixed_arity__52274) <= fixed_arity__52274)) {
        return f.apply(f, cljs.core.to_array.call(null, arglist__52273))
      }else {
        return f.cljs$lang$applyTo(arglist__52273)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__52273))
    }
  };
  var apply__52281 = function() {
    var G__52283__delegate = function(f, a, b, c, d, args) {
      var arglist__52275 = cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, cljs.core.cons.call(null, d, cljs.core.spread.call(null, args)))));
      var fixed_arity__52276 = f.cljs$lang$maxFixedArity;
      if(cljs.core.truth_(f.cljs$lang$applyTo)) {
        if(cljs.core.truth_(cljs.core.bounded_count.call(null, arglist__52275, fixed_arity__52276) <= fixed_arity__52276)) {
          return f.apply(f, cljs.core.to_array.call(null, arglist__52275))
        }else {
          return f.cljs$lang$applyTo(arglist__52275)
        }
      }else {
        return f.apply(f, cljs.core.to_array.call(null, arglist__52275))
      }
    };
    var G__52283 = function(f, a, b, c, d, var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 5), 0)
      }
      return G__52283__delegate.call(this, f, a, b, c, d, args)
    };
    G__52283.cljs$lang$maxFixedArity = 5;
    G__52283.cljs$lang$applyTo = function(arglist__52284) {
      var f = cljs.core.first(arglist__52284);
      var a = cljs.core.first(cljs.core.next(arglist__52284));
      var b = cljs.core.first(cljs.core.next(cljs.core.next(arglist__52284)));
      var c = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__52284))));
      var d = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__52284)))));
      var args = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__52284)))));
      return G__52283__delegate.call(this, f, a, b, c, d, args)
    };
    return G__52283
  }();
  apply = function(f, a, b, c, d, var_args) {
    var args = var_args;
    switch(arguments.length) {
      case 2:
        return apply__52277.call(this, f, a);
      case 3:
        return apply__52278.call(this, f, a, b);
      case 4:
        return apply__52279.call(this, f, a, b, c);
      case 5:
        return apply__52280.call(this, f, a, b, c, d);
      default:
        return apply__52281.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  apply.cljs$lang$maxFixedArity = 5;
  apply.cljs$lang$applyTo = apply__52281.cljs$lang$applyTo;
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
  vary_meta.cljs$lang$applyTo = function(arglist__52285) {
    var obj = cljs.core.first(arglist__52285);
    var f = cljs.core.first(cljs.core.next(arglist__52285));
    var args = cljs.core.rest(cljs.core.next(arglist__52285));
    return vary_meta__delegate.call(this, obj, f, args)
  };
  return vary_meta
}();
cljs.core.not_EQ_ = function() {
  var not_EQ_ = null;
  var not_EQ___52286 = function(x) {
    return false
  };
  var not_EQ___52287 = function(x, y) {
    return cljs.core.not.call(null, cljs.core._EQ_.call(null, x, y))
  };
  var not_EQ___52288 = function() {
    var G__52290__delegate = function(x, y, more) {
      return cljs.core.not.call(null, cljs.core.apply.call(null, cljs.core._EQ_, x, y, more))
    };
    var G__52290 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__52290__delegate.call(this, x, y, more)
    };
    G__52290.cljs$lang$maxFixedArity = 2;
    G__52290.cljs$lang$applyTo = function(arglist__52291) {
      var x = cljs.core.first(arglist__52291);
      var y = cljs.core.first(cljs.core.next(arglist__52291));
      var more = cljs.core.rest(cljs.core.next(arglist__52291));
      return G__52290__delegate.call(this, x, y, more)
    };
    return G__52290
  }();
  not_EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return not_EQ___52286.call(this, x);
      case 2:
        return not_EQ___52287.call(this, x, y);
      default:
        return not_EQ___52288.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  not_EQ_.cljs$lang$maxFixedArity = 2;
  not_EQ_.cljs$lang$applyTo = not_EQ___52288.cljs$lang$applyTo;
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
        var G__52292 = pred;
        var G__52293 = cljs.core.next.call(null, coll);
        pred = G__52292;
        coll = G__52293;
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
      var or__3548__auto____52294 = pred.call(null, cljs.core.first.call(null, coll));
      if(cljs.core.truth_(or__3548__auto____52294)) {
        return or__3548__auto____52294
      }else {
        var G__52295 = pred;
        var G__52296 = cljs.core.next.call(null, coll);
        pred = G__52295;
        coll = G__52296;
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
    var G__52297 = null;
    var G__52297__52298 = function() {
      return cljs.core.not.call(null, f.call(null))
    };
    var G__52297__52299 = function(x) {
      return cljs.core.not.call(null, f.call(null, x))
    };
    var G__52297__52300 = function(x, y) {
      return cljs.core.not.call(null, f.call(null, x, y))
    };
    var G__52297__52301 = function() {
      var G__52303__delegate = function(x, y, zs) {
        return cljs.core.not.call(null, cljs.core.apply.call(null, f, x, y, zs))
      };
      var G__52303 = function(x, y, var_args) {
        var zs = null;
        if(goog.isDef(var_args)) {
          zs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
        }
        return G__52303__delegate.call(this, x, y, zs)
      };
      G__52303.cljs$lang$maxFixedArity = 2;
      G__52303.cljs$lang$applyTo = function(arglist__52304) {
        var x = cljs.core.first(arglist__52304);
        var y = cljs.core.first(cljs.core.next(arglist__52304));
        var zs = cljs.core.rest(cljs.core.next(arglist__52304));
        return G__52303__delegate.call(this, x, y, zs)
      };
      return G__52303
    }();
    G__52297 = function(x, y, var_args) {
      var zs = var_args;
      switch(arguments.length) {
        case 0:
          return G__52297__52298.call(this);
        case 1:
          return G__52297__52299.call(this, x);
        case 2:
          return G__52297__52300.call(this, x, y);
        default:
          return G__52297__52301.apply(this, arguments)
      }
      throw"Invalid arity: " + arguments.length;
    };
    G__52297.cljs$lang$maxFixedArity = 2;
    G__52297.cljs$lang$applyTo = G__52297__52301.cljs$lang$applyTo;
    return G__52297
  }()
};
cljs.core.constantly = function constantly(x) {
  return function() {
    var G__52305__delegate = function(args) {
      return x
    };
    var G__52305 = function(var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__52305__delegate.call(this, args)
    };
    G__52305.cljs$lang$maxFixedArity = 0;
    G__52305.cljs$lang$applyTo = function(arglist__52306) {
      var args = cljs.core.seq(arglist__52306);
      return G__52305__delegate.call(this, args)
    };
    return G__52305
  }()
};
cljs.core.comp = function() {
  var comp = null;
  var comp__52310 = function() {
    return cljs.core.identity
  };
  var comp__52311 = function(f) {
    return f
  };
  var comp__52312 = function(f, g) {
    return function() {
      var G__52316 = null;
      var G__52316__52317 = function() {
        return f.call(null, g.call(null))
      };
      var G__52316__52318 = function(x) {
        return f.call(null, g.call(null, x))
      };
      var G__52316__52319 = function(x, y) {
        return f.call(null, g.call(null, x, y))
      };
      var G__52316__52320 = function(x, y, z) {
        return f.call(null, g.call(null, x, y, z))
      };
      var G__52316__52321 = function() {
        var G__52323__delegate = function(x, y, z, args) {
          return f.call(null, cljs.core.apply.call(null, g, x, y, z, args))
        };
        var G__52323 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__52323__delegate.call(this, x, y, z, args)
        };
        G__52323.cljs$lang$maxFixedArity = 3;
        G__52323.cljs$lang$applyTo = function(arglist__52324) {
          var x = cljs.core.first(arglist__52324);
          var y = cljs.core.first(cljs.core.next(arglist__52324));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__52324)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__52324)));
          return G__52323__delegate.call(this, x, y, z, args)
        };
        return G__52323
      }();
      G__52316 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__52316__52317.call(this);
          case 1:
            return G__52316__52318.call(this, x);
          case 2:
            return G__52316__52319.call(this, x, y);
          case 3:
            return G__52316__52320.call(this, x, y, z);
          default:
            return G__52316__52321.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__52316.cljs$lang$maxFixedArity = 3;
      G__52316.cljs$lang$applyTo = G__52316__52321.cljs$lang$applyTo;
      return G__52316
    }()
  };
  var comp__52313 = function(f, g, h) {
    return function() {
      var G__52325 = null;
      var G__52325__52326 = function() {
        return f.call(null, g.call(null, h.call(null)))
      };
      var G__52325__52327 = function(x) {
        return f.call(null, g.call(null, h.call(null, x)))
      };
      var G__52325__52328 = function(x, y) {
        return f.call(null, g.call(null, h.call(null, x, y)))
      };
      var G__52325__52329 = function(x, y, z) {
        return f.call(null, g.call(null, h.call(null, x, y, z)))
      };
      var G__52325__52330 = function() {
        var G__52332__delegate = function(x, y, z, args) {
          return f.call(null, g.call(null, cljs.core.apply.call(null, h, x, y, z, args)))
        };
        var G__52332 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__52332__delegate.call(this, x, y, z, args)
        };
        G__52332.cljs$lang$maxFixedArity = 3;
        G__52332.cljs$lang$applyTo = function(arglist__52333) {
          var x = cljs.core.first(arglist__52333);
          var y = cljs.core.first(cljs.core.next(arglist__52333));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__52333)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__52333)));
          return G__52332__delegate.call(this, x, y, z, args)
        };
        return G__52332
      }();
      G__52325 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__52325__52326.call(this);
          case 1:
            return G__52325__52327.call(this, x);
          case 2:
            return G__52325__52328.call(this, x, y);
          case 3:
            return G__52325__52329.call(this, x, y, z);
          default:
            return G__52325__52330.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__52325.cljs$lang$maxFixedArity = 3;
      G__52325.cljs$lang$applyTo = G__52325__52330.cljs$lang$applyTo;
      return G__52325
    }()
  };
  var comp__52314 = function() {
    var G__52334__delegate = function(f1, f2, f3, fs) {
      var fs__52307 = cljs.core.reverse.call(null, cljs.core.list_STAR_.call(null, f1, f2, f3, fs));
      return function() {
        var G__52335__delegate = function(args) {
          var ret__52308 = cljs.core.apply.call(null, cljs.core.first.call(null, fs__52307), args);
          var fs__52309 = cljs.core.next.call(null, fs__52307);
          while(true) {
            if(cljs.core.truth_(fs__52309)) {
              var G__52336 = cljs.core.first.call(null, fs__52309).call(null, ret__52308);
              var G__52337 = cljs.core.next.call(null, fs__52309);
              ret__52308 = G__52336;
              fs__52309 = G__52337;
              continue
            }else {
              return ret__52308
            }
            break
          }
        };
        var G__52335 = function(var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
          }
          return G__52335__delegate.call(this, args)
        };
        G__52335.cljs$lang$maxFixedArity = 0;
        G__52335.cljs$lang$applyTo = function(arglist__52338) {
          var args = cljs.core.seq(arglist__52338);
          return G__52335__delegate.call(this, args)
        };
        return G__52335
      }()
    };
    var G__52334 = function(f1, f2, f3, var_args) {
      var fs = null;
      if(goog.isDef(var_args)) {
        fs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__52334__delegate.call(this, f1, f2, f3, fs)
    };
    G__52334.cljs$lang$maxFixedArity = 3;
    G__52334.cljs$lang$applyTo = function(arglist__52339) {
      var f1 = cljs.core.first(arglist__52339);
      var f2 = cljs.core.first(cljs.core.next(arglist__52339));
      var f3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__52339)));
      var fs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__52339)));
      return G__52334__delegate.call(this, f1, f2, f3, fs)
    };
    return G__52334
  }();
  comp = function(f1, f2, f3, var_args) {
    var fs = var_args;
    switch(arguments.length) {
      case 0:
        return comp__52310.call(this);
      case 1:
        return comp__52311.call(this, f1);
      case 2:
        return comp__52312.call(this, f1, f2);
      case 3:
        return comp__52313.call(this, f1, f2, f3);
      default:
        return comp__52314.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  comp.cljs$lang$maxFixedArity = 3;
  comp.cljs$lang$applyTo = comp__52314.cljs$lang$applyTo;
  return comp
}();
cljs.core.partial = function() {
  var partial = null;
  var partial__52340 = function(f, arg1) {
    return function() {
      var G__52345__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, args)
      };
      var G__52345 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__52345__delegate.call(this, args)
      };
      G__52345.cljs$lang$maxFixedArity = 0;
      G__52345.cljs$lang$applyTo = function(arglist__52346) {
        var args = cljs.core.seq(arglist__52346);
        return G__52345__delegate.call(this, args)
      };
      return G__52345
    }()
  };
  var partial__52341 = function(f, arg1, arg2) {
    return function() {
      var G__52347__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, arg2, args)
      };
      var G__52347 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__52347__delegate.call(this, args)
      };
      G__52347.cljs$lang$maxFixedArity = 0;
      G__52347.cljs$lang$applyTo = function(arglist__52348) {
        var args = cljs.core.seq(arglist__52348);
        return G__52347__delegate.call(this, args)
      };
      return G__52347
    }()
  };
  var partial__52342 = function(f, arg1, arg2, arg3) {
    return function() {
      var G__52349__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, arg2, arg3, args)
      };
      var G__52349 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__52349__delegate.call(this, args)
      };
      G__52349.cljs$lang$maxFixedArity = 0;
      G__52349.cljs$lang$applyTo = function(arglist__52350) {
        var args = cljs.core.seq(arglist__52350);
        return G__52349__delegate.call(this, args)
      };
      return G__52349
    }()
  };
  var partial__52343 = function() {
    var G__52351__delegate = function(f, arg1, arg2, arg3, more) {
      return function() {
        var G__52352__delegate = function(args) {
          return cljs.core.apply.call(null, f, arg1, arg2, arg3, cljs.core.concat.call(null, more, args))
        };
        var G__52352 = function(var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
          }
          return G__52352__delegate.call(this, args)
        };
        G__52352.cljs$lang$maxFixedArity = 0;
        G__52352.cljs$lang$applyTo = function(arglist__52353) {
          var args = cljs.core.seq(arglist__52353);
          return G__52352__delegate.call(this, args)
        };
        return G__52352
      }()
    };
    var G__52351 = function(f, arg1, arg2, arg3, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__52351__delegate.call(this, f, arg1, arg2, arg3, more)
    };
    G__52351.cljs$lang$maxFixedArity = 4;
    G__52351.cljs$lang$applyTo = function(arglist__52354) {
      var f = cljs.core.first(arglist__52354);
      var arg1 = cljs.core.first(cljs.core.next(arglist__52354));
      var arg2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__52354)));
      var arg3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__52354))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__52354))));
      return G__52351__delegate.call(this, f, arg1, arg2, arg3, more)
    };
    return G__52351
  }();
  partial = function(f, arg1, arg2, arg3, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return partial__52340.call(this, f, arg1);
      case 3:
        return partial__52341.call(this, f, arg1, arg2);
      case 4:
        return partial__52342.call(this, f, arg1, arg2, arg3);
      default:
        return partial__52343.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  partial.cljs$lang$maxFixedArity = 4;
  partial.cljs$lang$applyTo = partial__52343.cljs$lang$applyTo;
  return partial
}();
cljs.core.fnil = function() {
  var fnil = null;
  var fnil__52355 = function(f, x) {
    return function() {
      var G__52359 = null;
      var G__52359__52360 = function(a) {
        return f.call(null, cljs.core.truth_(a === null) ? x : a)
      };
      var G__52359__52361 = function(a, b) {
        return f.call(null, cljs.core.truth_(a === null) ? x : a, b)
      };
      var G__52359__52362 = function(a, b, c) {
        return f.call(null, cljs.core.truth_(a === null) ? x : a, b, c)
      };
      var G__52359__52363 = function() {
        var G__52365__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, cljs.core.truth_(a === null) ? x : a, b, c, ds)
        };
        var G__52365 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__52365__delegate.call(this, a, b, c, ds)
        };
        G__52365.cljs$lang$maxFixedArity = 3;
        G__52365.cljs$lang$applyTo = function(arglist__52366) {
          var a = cljs.core.first(arglist__52366);
          var b = cljs.core.first(cljs.core.next(arglist__52366));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__52366)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__52366)));
          return G__52365__delegate.call(this, a, b, c, ds)
        };
        return G__52365
      }();
      G__52359 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 1:
            return G__52359__52360.call(this, a);
          case 2:
            return G__52359__52361.call(this, a, b);
          case 3:
            return G__52359__52362.call(this, a, b, c);
          default:
            return G__52359__52363.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__52359.cljs$lang$maxFixedArity = 3;
      G__52359.cljs$lang$applyTo = G__52359__52363.cljs$lang$applyTo;
      return G__52359
    }()
  };
  var fnil__52356 = function(f, x, y) {
    return function() {
      var G__52367 = null;
      var G__52367__52368 = function(a, b) {
        return f.call(null, cljs.core.truth_(a === null) ? x : a, cljs.core.truth_(b === null) ? y : b)
      };
      var G__52367__52369 = function(a, b, c) {
        return f.call(null, cljs.core.truth_(a === null) ? x : a, cljs.core.truth_(b === null) ? y : b, c)
      };
      var G__52367__52370 = function() {
        var G__52372__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, cljs.core.truth_(a === null) ? x : a, cljs.core.truth_(b === null) ? y : b, c, ds)
        };
        var G__52372 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__52372__delegate.call(this, a, b, c, ds)
        };
        G__52372.cljs$lang$maxFixedArity = 3;
        G__52372.cljs$lang$applyTo = function(arglist__52373) {
          var a = cljs.core.first(arglist__52373);
          var b = cljs.core.first(cljs.core.next(arglist__52373));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__52373)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__52373)));
          return G__52372__delegate.call(this, a, b, c, ds)
        };
        return G__52372
      }();
      G__52367 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 2:
            return G__52367__52368.call(this, a, b);
          case 3:
            return G__52367__52369.call(this, a, b, c);
          default:
            return G__52367__52370.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__52367.cljs$lang$maxFixedArity = 3;
      G__52367.cljs$lang$applyTo = G__52367__52370.cljs$lang$applyTo;
      return G__52367
    }()
  };
  var fnil__52357 = function(f, x, y, z) {
    return function() {
      var G__52374 = null;
      var G__52374__52375 = function(a, b) {
        return f.call(null, cljs.core.truth_(a === null) ? x : a, cljs.core.truth_(b === null) ? y : b)
      };
      var G__52374__52376 = function(a, b, c) {
        return f.call(null, cljs.core.truth_(a === null) ? x : a, cljs.core.truth_(b === null) ? y : b, cljs.core.truth_(c === null) ? z : c)
      };
      var G__52374__52377 = function() {
        var G__52379__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, cljs.core.truth_(a === null) ? x : a, cljs.core.truth_(b === null) ? y : b, cljs.core.truth_(c === null) ? z : c, ds)
        };
        var G__52379 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__52379__delegate.call(this, a, b, c, ds)
        };
        G__52379.cljs$lang$maxFixedArity = 3;
        G__52379.cljs$lang$applyTo = function(arglist__52380) {
          var a = cljs.core.first(arglist__52380);
          var b = cljs.core.first(cljs.core.next(arglist__52380));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__52380)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__52380)));
          return G__52379__delegate.call(this, a, b, c, ds)
        };
        return G__52379
      }();
      G__52374 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 2:
            return G__52374__52375.call(this, a, b);
          case 3:
            return G__52374__52376.call(this, a, b, c);
          default:
            return G__52374__52377.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__52374.cljs$lang$maxFixedArity = 3;
      G__52374.cljs$lang$applyTo = G__52374__52377.cljs$lang$applyTo;
      return G__52374
    }()
  };
  fnil = function(f, x, y, z) {
    switch(arguments.length) {
      case 2:
        return fnil__52355.call(this, f, x);
      case 3:
        return fnil__52356.call(this, f, x, y);
      case 4:
        return fnil__52357.call(this, f, x, y, z)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return fnil
}();
cljs.core.map_indexed = function map_indexed(f, coll) {
  var mapi__52383 = function mpi(idx, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3698__auto____52381 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3698__auto____52381)) {
        var s__52382 = temp__3698__auto____52381;
        return cljs.core.cons.call(null, f.call(null, idx, cljs.core.first.call(null, s__52382)), mpi.call(null, idx + 1, cljs.core.rest.call(null, s__52382)))
      }else {
        return null
      }
    })
  };
  return mapi__52383.call(null, 0, coll)
};
cljs.core.keep = function keep(f, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3698__auto____52384 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3698__auto____52384)) {
      var s__52385 = temp__3698__auto____52384;
      var x__52386 = f.call(null, cljs.core.first.call(null, s__52385));
      if(cljs.core.truth_(x__52386 === null)) {
        return keep.call(null, f, cljs.core.rest.call(null, s__52385))
      }else {
        return cljs.core.cons.call(null, x__52386, keep.call(null, f, cljs.core.rest.call(null, s__52385)))
      }
    }else {
      return null
    }
  })
};
cljs.core.keep_indexed = function keep_indexed(f, coll) {
  var keepi__52396 = function kpi(idx, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3698__auto____52393 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3698__auto____52393)) {
        var s__52394 = temp__3698__auto____52393;
        var x__52395 = f.call(null, idx, cljs.core.first.call(null, s__52394));
        if(cljs.core.truth_(x__52395 === null)) {
          return kpi.call(null, idx + 1, cljs.core.rest.call(null, s__52394))
        }else {
          return cljs.core.cons.call(null, x__52395, kpi.call(null, idx + 1, cljs.core.rest.call(null, s__52394)))
        }
      }else {
        return null
      }
    })
  };
  return keepi__52396.call(null, 0, coll)
};
cljs.core.every_pred = function() {
  var every_pred = null;
  var every_pred__52441 = function(p) {
    return function() {
      var ep1 = null;
      var ep1__52446 = function() {
        return true
      };
      var ep1__52447 = function(x) {
        return cljs.core.boolean$.call(null, p.call(null, x))
      };
      var ep1__52448 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3546__auto____52403 = p.call(null, x);
          if(cljs.core.truth_(and__3546__auto____52403)) {
            return p.call(null, y)
          }else {
            return and__3546__auto____52403
          }
        }())
      };
      var ep1__52449 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3546__auto____52404 = p.call(null, x);
          if(cljs.core.truth_(and__3546__auto____52404)) {
            var and__3546__auto____52405 = p.call(null, y);
            if(cljs.core.truth_(and__3546__auto____52405)) {
              return p.call(null, z)
            }else {
              return and__3546__auto____52405
            }
          }else {
            return and__3546__auto____52404
          }
        }())
      };
      var ep1__52450 = function() {
        var G__52452__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3546__auto____52406 = ep1.call(null, x, y, z);
            if(cljs.core.truth_(and__3546__auto____52406)) {
              return cljs.core.every_QMARK_.call(null, p, args)
            }else {
              return and__3546__auto____52406
            }
          }())
        };
        var G__52452 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__52452__delegate.call(this, x, y, z, args)
        };
        G__52452.cljs$lang$maxFixedArity = 3;
        G__52452.cljs$lang$applyTo = function(arglist__52453) {
          var x = cljs.core.first(arglist__52453);
          var y = cljs.core.first(cljs.core.next(arglist__52453));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__52453)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__52453)));
          return G__52452__delegate.call(this, x, y, z, args)
        };
        return G__52452
      }();
      ep1 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return ep1__52446.call(this);
          case 1:
            return ep1__52447.call(this, x);
          case 2:
            return ep1__52448.call(this, x, y);
          case 3:
            return ep1__52449.call(this, x, y, z);
          default:
            return ep1__52450.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      ep1.cljs$lang$maxFixedArity = 3;
      ep1.cljs$lang$applyTo = ep1__52450.cljs$lang$applyTo;
      return ep1
    }()
  };
  var every_pred__52442 = function(p1, p2) {
    return function() {
      var ep2 = null;
      var ep2__52454 = function() {
        return true
      };
      var ep2__52455 = function(x) {
        return cljs.core.boolean$.call(null, function() {
          var and__3546__auto____52407 = p1.call(null, x);
          if(cljs.core.truth_(and__3546__auto____52407)) {
            return p2.call(null, x)
          }else {
            return and__3546__auto____52407
          }
        }())
      };
      var ep2__52456 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3546__auto____52408 = p1.call(null, x);
          if(cljs.core.truth_(and__3546__auto____52408)) {
            var and__3546__auto____52409 = p1.call(null, y);
            if(cljs.core.truth_(and__3546__auto____52409)) {
              var and__3546__auto____52410 = p2.call(null, x);
              if(cljs.core.truth_(and__3546__auto____52410)) {
                return p2.call(null, y)
              }else {
                return and__3546__auto____52410
              }
            }else {
              return and__3546__auto____52409
            }
          }else {
            return and__3546__auto____52408
          }
        }())
      };
      var ep2__52457 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3546__auto____52411 = p1.call(null, x);
          if(cljs.core.truth_(and__3546__auto____52411)) {
            var and__3546__auto____52412 = p1.call(null, y);
            if(cljs.core.truth_(and__3546__auto____52412)) {
              var and__3546__auto____52413 = p1.call(null, z);
              if(cljs.core.truth_(and__3546__auto____52413)) {
                var and__3546__auto____52414 = p2.call(null, x);
                if(cljs.core.truth_(and__3546__auto____52414)) {
                  var and__3546__auto____52415 = p2.call(null, y);
                  if(cljs.core.truth_(and__3546__auto____52415)) {
                    return p2.call(null, z)
                  }else {
                    return and__3546__auto____52415
                  }
                }else {
                  return and__3546__auto____52414
                }
              }else {
                return and__3546__auto____52413
              }
            }else {
              return and__3546__auto____52412
            }
          }else {
            return and__3546__auto____52411
          }
        }())
      };
      var ep2__52458 = function() {
        var G__52460__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3546__auto____52416 = ep2.call(null, x, y, z);
            if(cljs.core.truth_(and__3546__auto____52416)) {
              return cljs.core.every_QMARK_.call(null, function(p1__52387_SHARP_) {
                var and__3546__auto____52417 = p1.call(null, p1__52387_SHARP_);
                if(cljs.core.truth_(and__3546__auto____52417)) {
                  return p2.call(null, p1__52387_SHARP_)
                }else {
                  return and__3546__auto____52417
                }
              }, args)
            }else {
              return and__3546__auto____52416
            }
          }())
        };
        var G__52460 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__52460__delegate.call(this, x, y, z, args)
        };
        G__52460.cljs$lang$maxFixedArity = 3;
        G__52460.cljs$lang$applyTo = function(arglist__52461) {
          var x = cljs.core.first(arglist__52461);
          var y = cljs.core.first(cljs.core.next(arglist__52461));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__52461)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__52461)));
          return G__52460__delegate.call(this, x, y, z, args)
        };
        return G__52460
      }();
      ep2 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return ep2__52454.call(this);
          case 1:
            return ep2__52455.call(this, x);
          case 2:
            return ep2__52456.call(this, x, y);
          case 3:
            return ep2__52457.call(this, x, y, z);
          default:
            return ep2__52458.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      ep2.cljs$lang$maxFixedArity = 3;
      ep2.cljs$lang$applyTo = ep2__52458.cljs$lang$applyTo;
      return ep2
    }()
  };
  var every_pred__52443 = function(p1, p2, p3) {
    return function() {
      var ep3 = null;
      var ep3__52462 = function() {
        return true
      };
      var ep3__52463 = function(x) {
        return cljs.core.boolean$.call(null, function() {
          var and__3546__auto____52418 = p1.call(null, x);
          if(cljs.core.truth_(and__3546__auto____52418)) {
            var and__3546__auto____52419 = p2.call(null, x);
            if(cljs.core.truth_(and__3546__auto____52419)) {
              return p3.call(null, x)
            }else {
              return and__3546__auto____52419
            }
          }else {
            return and__3546__auto____52418
          }
        }())
      };
      var ep3__52464 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3546__auto____52420 = p1.call(null, x);
          if(cljs.core.truth_(and__3546__auto____52420)) {
            var and__3546__auto____52421 = p2.call(null, x);
            if(cljs.core.truth_(and__3546__auto____52421)) {
              var and__3546__auto____52422 = p3.call(null, x);
              if(cljs.core.truth_(and__3546__auto____52422)) {
                var and__3546__auto____52423 = p1.call(null, y);
                if(cljs.core.truth_(and__3546__auto____52423)) {
                  var and__3546__auto____52424 = p2.call(null, y);
                  if(cljs.core.truth_(and__3546__auto____52424)) {
                    return p3.call(null, y)
                  }else {
                    return and__3546__auto____52424
                  }
                }else {
                  return and__3546__auto____52423
                }
              }else {
                return and__3546__auto____52422
              }
            }else {
              return and__3546__auto____52421
            }
          }else {
            return and__3546__auto____52420
          }
        }())
      };
      var ep3__52465 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3546__auto____52425 = p1.call(null, x);
          if(cljs.core.truth_(and__3546__auto____52425)) {
            var and__3546__auto____52426 = p2.call(null, x);
            if(cljs.core.truth_(and__3546__auto____52426)) {
              var and__3546__auto____52427 = p3.call(null, x);
              if(cljs.core.truth_(and__3546__auto____52427)) {
                var and__3546__auto____52428 = p1.call(null, y);
                if(cljs.core.truth_(and__3546__auto____52428)) {
                  var and__3546__auto____52429 = p2.call(null, y);
                  if(cljs.core.truth_(and__3546__auto____52429)) {
                    var and__3546__auto____52430 = p3.call(null, y);
                    if(cljs.core.truth_(and__3546__auto____52430)) {
                      var and__3546__auto____52431 = p1.call(null, z);
                      if(cljs.core.truth_(and__3546__auto____52431)) {
                        var and__3546__auto____52432 = p2.call(null, z);
                        if(cljs.core.truth_(and__3546__auto____52432)) {
                          return p3.call(null, z)
                        }else {
                          return and__3546__auto____52432
                        }
                      }else {
                        return and__3546__auto____52431
                      }
                    }else {
                      return and__3546__auto____52430
                    }
                  }else {
                    return and__3546__auto____52429
                  }
                }else {
                  return and__3546__auto____52428
                }
              }else {
                return and__3546__auto____52427
              }
            }else {
              return and__3546__auto____52426
            }
          }else {
            return and__3546__auto____52425
          }
        }())
      };
      var ep3__52466 = function() {
        var G__52468__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3546__auto____52433 = ep3.call(null, x, y, z);
            if(cljs.core.truth_(and__3546__auto____52433)) {
              return cljs.core.every_QMARK_.call(null, function(p1__52388_SHARP_) {
                var and__3546__auto____52434 = p1.call(null, p1__52388_SHARP_);
                if(cljs.core.truth_(and__3546__auto____52434)) {
                  var and__3546__auto____52435 = p2.call(null, p1__52388_SHARP_);
                  if(cljs.core.truth_(and__3546__auto____52435)) {
                    return p3.call(null, p1__52388_SHARP_)
                  }else {
                    return and__3546__auto____52435
                  }
                }else {
                  return and__3546__auto____52434
                }
              }, args)
            }else {
              return and__3546__auto____52433
            }
          }())
        };
        var G__52468 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__52468__delegate.call(this, x, y, z, args)
        };
        G__52468.cljs$lang$maxFixedArity = 3;
        G__52468.cljs$lang$applyTo = function(arglist__52469) {
          var x = cljs.core.first(arglist__52469);
          var y = cljs.core.first(cljs.core.next(arglist__52469));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__52469)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__52469)));
          return G__52468__delegate.call(this, x, y, z, args)
        };
        return G__52468
      }();
      ep3 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return ep3__52462.call(this);
          case 1:
            return ep3__52463.call(this, x);
          case 2:
            return ep3__52464.call(this, x, y);
          case 3:
            return ep3__52465.call(this, x, y, z);
          default:
            return ep3__52466.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      ep3.cljs$lang$maxFixedArity = 3;
      ep3.cljs$lang$applyTo = ep3__52466.cljs$lang$applyTo;
      return ep3
    }()
  };
  var every_pred__52444 = function() {
    var G__52470__delegate = function(p1, p2, p3, ps) {
      var ps__52436 = cljs.core.list_STAR_.call(null, p1, p2, p3, ps);
      return function() {
        var epn = null;
        var epn__52471 = function() {
          return true
        };
        var epn__52472 = function(x) {
          return cljs.core.every_QMARK_.call(null, function(p1__52389_SHARP_) {
            return p1__52389_SHARP_.call(null, x)
          }, ps__52436)
        };
        var epn__52473 = function(x, y) {
          return cljs.core.every_QMARK_.call(null, function(p1__52390_SHARP_) {
            var and__3546__auto____52437 = p1__52390_SHARP_.call(null, x);
            if(cljs.core.truth_(and__3546__auto____52437)) {
              return p1__52390_SHARP_.call(null, y)
            }else {
              return and__3546__auto____52437
            }
          }, ps__52436)
        };
        var epn__52474 = function(x, y, z) {
          return cljs.core.every_QMARK_.call(null, function(p1__52391_SHARP_) {
            var and__3546__auto____52438 = p1__52391_SHARP_.call(null, x);
            if(cljs.core.truth_(and__3546__auto____52438)) {
              var and__3546__auto____52439 = p1__52391_SHARP_.call(null, y);
              if(cljs.core.truth_(and__3546__auto____52439)) {
                return p1__52391_SHARP_.call(null, z)
              }else {
                return and__3546__auto____52439
              }
            }else {
              return and__3546__auto____52438
            }
          }, ps__52436)
        };
        var epn__52475 = function() {
          var G__52477__delegate = function(x, y, z, args) {
            return cljs.core.boolean$.call(null, function() {
              var and__3546__auto____52440 = epn.call(null, x, y, z);
              if(cljs.core.truth_(and__3546__auto____52440)) {
                return cljs.core.every_QMARK_.call(null, function(p1__52392_SHARP_) {
                  return cljs.core.every_QMARK_.call(null, p1__52392_SHARP_, args)
                }, ps__52436)
              }else {
                return and__3546__auto____52440
              }
            }())
          };
          var G__52477 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__52477__delegate.call(this, x, y, z, args)
          };
          G__52477.cljs$lang$maxFixedArity = 3;
          G__52477.cljs$lang$applyTo = function(arglist__52478) {
            var x = cljs.core.first(arglist__52478);
            var y = cljs.core.first(cljs.core.next(arglist__52478));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__52478)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__52478)));
            return G__52477__delegate.call(this, x, y, z, args)
          };
          return G__52477
        }();
        epn = function(x, y, z, var_args) {
          var args = var_args;
          switch(arguments.length) {
            case 0:
              return epn__52471.call(this);
            case 1:
              return epn__52472.call(this, x);
            case 2:
              return epn__52473.call(this, x, y);
            case 3:
              return epn__52474.call(this, x, y, z);
            default:
              return epn__52475.apply(this, arguments)
          }
          throw"Invalid arity: " + arguments.length;
        };
        epn.cljs$lang$maxFixedArity = 3;
        epn.cljs$lang$applyTo = epn__52475.cljs$lang$applyTo;
        return epn
      }()
    };
    var G__52470 = function(p1, p2, p3, var_args) {
      var ps = null;
      if(goog.isDef(var_args)) {
        ps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__52470__delegate.call(this, p1, p2, p3, ps)
    };
    G__52470.cljs$lang$maxFixedArity = 3;
    G__52470.cljs$lang$applyTo = function(arglist__52479) {
      var p1 = cljs.core.first(arglist__52479);
      var p2 = cljs.core.first(cljs.core.next(arglist__52479));
      var p3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__52479)));
      var ps = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__52479)));
      return G__52470__delegate.call(this, p1, p2, p3, ps)
    };
    return G__52470
  }();
  every_pred = function(p1, p2, p3, var_args) {
    var ps = var_args;
    switch(arguments.length) {
      case 1:
        return every_pred__52441.call(this, p1);
      case 2:
        return every_pred__52442.call(this, p1, p2);
      case 3:
        return every_pred__52443.call(this, p1, p2, p3);
      default:
        return every_pred__52444.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  every_pred.cljs$lang$maxFixedArity = 3;
  every_pred.cljs$lang$applyTo = every_pred__52444.cljs$lang$applyTo;
  return every_pred
}();
cljs.core.some_fn = function() {
  var some_fn = null;
  var some_fn__52519 = function(p) {
    return function() {
      var sp1 = null;
      var sp1__52524 = function() {
        return null
      };
      var sp1__52525 = function(x) {
        return p.call(null, x)
      };
      var sp1__52526 = function(x, y) {
        var or__3548__auto____52481 = p.call(null, x);
        if(cljs.core.truth_(or__3548__auto____52481)) {
          return or__3548__auto____52481
        }else {
          return p.call(null, y)
        }
      };
      var sp1__52527 = function(x, y, z) {
        var or__3548__auto____52482 = p.call(null, x);
        if(cljs.core.truth_(or__3548__auto____52482)) {
          return or__3548__auto____52482
        }else {
          var or__3548__auto____52483 = p.call(null, y);
          if(cljs.core.truth_(or__3548__auto____52483)) {
            return or__3548__auto____52483
          }else {
            return p.call(null, z)
          }
        }
      };
      var sp1__52528 = function() {
        var G__52530__delegate = function(x, y, z, args) {
          var or__3548__auto____52484 = sp1.call(null, x, y, z);
          if(cljs.core.truth_(or__3548__auto____52484)) {
            return or__3548__auto____52484
          }else {
            return cljs.core.some.call(null, p, args)
          }
        };
        var G__52530 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__52530__delegate.call(this, x, y, z, args)
        };
        G__52530.cljs$lang$maxFixedArity = 3;
        G__52530.cljs$lang$applyTo = function(arglist__52531) {
          var x = cljs.core.first(arglist__52531);
          var y = cljs.core.first(cljs.core.next(arglist__52531));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__52531)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__52531)));
          return G__52530__delegate.call(this, x, y, z, args)
        };
        return G__52530
      }();
      sp1 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return sp1__52524.call(this);
          case 1:
            return sp1__52525.call(this, x);
          case 2:
            return sp1__52526.call(this, x, y);
          case 3:
            return sp1__52527.call(this, x, y, z);
          default:
            return sp1__52528.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      sp1.cljs$lang$maxFixedArity = 3;
      sp1.cljs$lang$applyTo = sp1__52528.cljs$lang$applyTo;
      return sp1
    }()
  };
  var some_fn__52520 = function(p1, p2) {
    return function() {
      var sp2 = null;
      var sp2__52532 = function() {
        return null
      };
      var sp2__52533 = function(x) {
        var or__3548__auto____52485 = p1.call(null, x);
        if(cljs.core.truth_(or__3548__auto____52485)) {
          return or__3548__auto____52485
        }else {
          return p2.call(null, x)
        }
      };
      var sp2__52534 = function(x, y) {
        var or__3548__auto____52486 = p1.call(null, x);
        if(cljs.core.truth_(or__3548__auto____52486)) {
          return or__3548__auto____52486
        }else {
          var or__3548__auto____52487 = p1.call(null, y);
          if(cljs.core.truth_(or__3548__auto____52487)) {
            return or__3548__auto____52487
          }else {
            var or__3548__auto____52488 = p2.call(null, x);
            if(cljs.core.truth_(or__3548__auto____52488)) {
              return or__3548__auto____52488
            }else {
              return p2.call(null, y)
            }
          }
        }
      };
      var sp2__52535 = function(x, y, z) {
        var or__3548__auto____52489 = p1.call(null, x);
        if(cljs.core.truth_(or__3548__auto____52489)) {
          return or__3548__auto____52489
        }else {
          var or__3548__auto____52490 = p1.call(null, y);
          if(cljs.core.truth_(or__3548__auto____52490)) {
            return or__3548__auto____52490
          }else {
            var or__3548__auto____52491 = p1.call(null, z);
            if(cljs.core.truth_(or__3548__auto____52491)) {
              return or__3548__auto____52491
            }else {
              var or__3548__auto____52492 = p2.call(null, x);
              if(cljs.core.truth_(or__3548__auto____52492)) {
                return or__3548__auto____52492
              }else {
                var or__3548__auto____52493 = p2.call(null, y);
                if(cljs.core.truth_(or__3548__auto____52493)) {
                  return or__3548__auto____52493
                }else {
                  return p2.call(null, z)
                }
              }
            }
          }
        }
      };
      var sp2__52536 = function() {
        var G__52538__delegate = function(x, y, z, args) {
          var or__3548__auto____52494 = sp2.call(null, x, y, z);
          if(cljs.core.truth_(or__3548__auto____52494)) {
            return or__3548__auto____52494
          }else {
            return cljs.core.some.call(null, function(p1__52397_SHARP_) {
              var or__3548__auto____52495 = p1.call(null, p1__52397_SHARP_);
              if(cljs.core.truth_(or__3548__auto____52495)) {
                return or__3548__auto____52495
              }else {
                return p2.call(null, p1__52397_SHARP_)
              }
            }, args)
          }
        };
        var G__52538 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__52538__delegate.call(this, x, y, z, args)
        };
        G__52538.cljs$lang$maxFixedArity = 3;
        G__52538.cljs$lang$applyTo = function(arglist__52539) {
          var x = cljs.core.first(arglist__52539);
          var y = cljs.core.first(cljs.core.next(arglist__52539));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__52539)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__52539)));
          return G__52538__delegate.call(this, x, y, z, args)
        };
        return G__52538
      }();
      sp2 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return sp2__52532.call(this);
          case 1:
            return sp2__52533.call(this, x);
          case 2:
            return sp2__52534.call(this, x, y);
          case 3:
            return sp2__52535.call(this, x, y, z);
          default:
            return sp2__52536.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      sp2.cljs$lang$maxFixedArity = 3;
      sp2.cljs$lang$applyTo = sp2__52536.cljs$lang$applyTo;
      return sp2
    }()
  };
  var some_fn__52521 = function(p1, p2, p3) {
    return function() {
      var sp3 = null;
      var sp3__52540 = function() {
        return null
      };
      var sp3__52541 = function(x) {
        var or__3548__auto____52496 = p1.call(null, x);
        if(cljs.core.truth_(or__3548__auto____52496)) {
          return or__3548__auto____52496
        }else {
          var or__3548__auto____52497 = p2.call(null, x);
          if(cljs.core.truth_(or__3548__auto____52497)) {
            return or__3548__auto____52497
          }else {
            return p3.call(null, x)
          }
        }
      };
      var sp3__52542 = function(x, y) {
        var or__3548__auto____52498 = p1.call(null, x);
        if(cljs.core.truth_(or__3548__auto____52498)) {
          return or__3548__auto____52498
        }else {
          var or__3548__auto____52499 = p2.call(null, x);
          if(cljs.core.truth_(or__3548__auto____52499)) {
            return or__3548__auto____52499
          }else {
            var or__3548__auto____52500 = p3.call(null, x);
            if(cljs.core.truth_(or__3548__auto____52500)) {
              return or__3548__auto____52500
            }else {
              var or__3548__auto____52501 = p1.call(null, y);
              if(cljs.core.truth_(or__3548__auto____52501)) {
                return or__3548__auto____52501
              }else {
                var or__3548__auto____52502 = p2.call(null, y);
                if(cljs.core.truth_(or__3548__auto____52502)) {
                  return or__3548__auto____52502
                }else {
                  return p3.call(null, y)
                }
              }
            }
          }
        }
      };
      var sp3__52543 = function(x, y, z) {
        var or__3548__auto____52503 = p1.call(null, x);
        if(cljs.core.truth_(or__3548__auto____52503)) {
          return or__3548__auto____52503
        }else {
          var or__3548__auto____52504 = p2.call(null, x);
          if(cljs.core.truth_(or__3548__auto____52504)) {
            return or__3548__auto____52504
          }else {
            var or__3548__auto____52505 = p3.call(null, x);
            if(cljs.core.truth_(or__3548__auto____52505)) {
              return or__3548__auto____52505
            }else {
              var or__3548__auto____52506 = p1.call(null, y);
              if(cljs.core.truth_(or__3548__auto____52506)) {
                return or__3548__auto____52506
              }else {
                var or__3548__auto____52507 = p2.call(null, y);
                if(cljs.core.truth_(or__3548__auto____52507)) {
                  return or__3548__auto____52507
                }else {
                  var or__3548__auto____52508 = p3.call(null, y);
                  if(cljs.core.truth_(or__3548__auto____52508)) {
                    return or__3548__auto____52508
                  }else {
                    var or__3548__auto____52509 = p1.call(null, z);
                    if(cljs.core.truth_(or__3548__auto____52509)) {
                      return or__3548__auto____52509
                    }else {
                      var or__3548__auto____52510 = p2.call(null, z);
                      if(cljs.core.truth_(or__3548__auto____52510)) {
                        return or__3548__auto____52510
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
      var sp3__52544 = function() {
        var G__52546__delegate = function(x, y, z, args) {
          var or__3548__auto____52511 = sp3.call(null, x, y, z);
          if(cljs.core.truth_(or__3548__auto____52511)) {
            return or__3548__auto____52511
          }else {
            return cljs.core.some.call(null, function(p1__52398_SHARP_) {
              var or__3548__auto____52512 = p1.call(null, p1__52398_SHARP_);
              if(cljs.core.truth_(or__3548__auto____52512)) {
                return or__3548__auto____52512
              }else {
                var or__3548__auto____52513 = p2.call(null, p1__52398_SHARP_);
                if(cljs.core.truth_(or__3548__auto____52513)) {
                  return or__3548__auto____52513
                }else {
                  return p3.call(null, p1__52398_SHARP_)
                }
              }
            }, args)
          }
        };
        var G__52546 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__52546__delegate.call(this, x, y, z, args)
        };
        G__52546.cljs$lang$maxFixedArity = 3;
        G__52546.cljs$lang$applyTo = function(arglist__52547) {
          var x = cljs.core.first(arglist__52547);
          var y = cljs.core.first(cljs.core.next(arglist__52547));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__52547)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__52547)));
          return G__52546__delegate.call(this, x, y, z, args)
        };
        return G__52546
      }();
      sp3 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return sp3__52540.call(this);
          case 1:
            return sp3__52541.call(this, x);
          case 2:
            return sp3__52542.call(this, x, y);
          case 3:
            return sp3__52543.call(this, x, y, z);
          default:
            return sp3__52544.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      sp3.cljs$lang$maxFixedArity = 3;
      sp3.cljs$lang$applyTo = sp3__52544.cljs$lang$applyTo;
      return sp3
    }()
  };
  var some_fn__52522 = function() {
    var G__52548__delegate = function(p1, p2, p3, ps) {
      var ps__52514 = cljs.core.list_STAR_.call(null, p1, p2, p3, ps);
      return function() {
        var spn = null;
        var spn__52549 = function() {
          return null
        };
        var spn__52550 = function(x) {
          return cljs.core.some.call(null, function(p1__52399_SHARP_) {
            return p1__52399_SHARP_.call(null, x)
          }, ps__52514)
        };
        var spn__52551 = function(x, y) {
          return cljs.core.some.call(null, function(p1__52400_SHARP_) {
            var or__3548__auto____52515 = p1__52400_SHARP_.call(null, x);
            if(cljs.core.truth_(or__3548__auto____52515)) {
              return or__3548__auto____52515
            }else {
              return p1__52400_SHARP_.call(null, y)
            }
          }, ps__52514)
        };
        var spn__52552 = function(x, y, z) {
          return cljs.core.some.call(null, function(p1__52401_SHARP_) {
            var or__3548__auto____52516 = p1__52401_SHARP_.call(null, x);
            if(cljs.core.truth_(or__3548__auto____52516)) {
              return or__3548__auto____52516
            }else {
              var or__3548__auto____52517 = p1__52401_SHARP_.call(null, y);
              if(cljs.core.truth_(or__3548__auto____52517)) {
                return or__3548__auto____52517
              }else {
                return p1__52401_SHARP_.call(null, z)
              }
            }
          }, ps__52514)
        };
        var spn__52553 = function() {
          var G__52555__delegate = function(x, y, z, args) {
            var or__3548__auto____52518 = spn.call(null, x, y, z);
            if(cljs.core.truth_(or__3548__auto____52518)) {
              return or__3548__auto____52518
            }else {
              return cljs.core.some.call(null, function(p1__52402_SHARP_) {
                return cljs.core.some.call(null, p1__52402_SHARP_, args)
              }, ps__52514)
            }
          };
          var G__52555 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__52555__delegate.call(this, x, y, z, args)
          };
          G__52555.cljs$lang$maxFixedArity = 3;
          G__52555.cljs$lang$applyTo = function(arglist__52556) {
            var x = cljs.core.first(arglist__52556);
            var y = cljs.core.first(cljs.core.next(arglist__52556));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__52556)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__52556)));
            return G__52555__delegate.call(this, x, y, z, args)
          };
          return G__52555
        }();
        spn = function(x, y, z, var_args) {
          var args = var_args;
          switch(arguments.length) {
            case 0:
              return spn__52549.call(this);
            case 1:
              return spn__52550.call(this, x);
            case 2:
              return spn__52551.call(this, x, y);
            case 3:
              return spn__52552.call(this, x, y, z);
            default:
              return spn__52553.apply(this, arguments)
          }
          throw"Invalid arity: " + arguments.length;
        };
        spn.cljs$lang$maxFixedArity = 3;
        spn.cljs$lang$applyTo = spn__52553.cljs$lang$applyTo;
        return spn
      }()
    };
    var G__52548 = function(p1, p2, p3, var_args) {
      var ps = null;
      if(goog.isDef(var_args)) {
        ps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__52548__delegate.call(this, p1, p2, p3, ps)
    };
    G__52548.cljs$lang$maxFixedArity = 3;
    G__52548.cljs$lang$applyTo = function(arglist__52557) {
      var p1 = cljs.core.first(arglist__52557);
      var p2 = cljs.core.first(cljs.core.next(arglist__52557));
      var p3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__52557)));
      var ps = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__52557)));
      return G__52548__delegate.call(this, p1, p2, p3, ps)
    };
    return G__52548
  }();
  some_fn = function(p1, p2, p3, var_args) {
    var ps = var_args;
    switch(arguments.length) {
      case 1:
        return some_fn__52519.call(this, p1);
      case 2:
        return some_fn__52520.call(this, p1, p2);
      case 3:
        return some_fn__52521.call(this, p1, p2, p3);
      default:
        return some_fn__52522.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  some_fn.cljs$lang$maxFixedArity = 3;
  some_fn.cljs$lang$applyTo = some_fn__52522.cljs$lang$applyTo;
  return some_fn
}();
cljs.core.map = function() {
  var map = null;
  var map__52570 = function(f, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3698__auto____52558 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3698__auto____52558)) {
        var s__52559 = temp__3698__auto____52558;
        return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s__52559)), map.call(null, f, cljs.core.rest.call(null, s__52559)))
      }else {
        return null
      }
    })
  };
  var map__52571 = function(f, c1, c2) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1__52560 = cljs.core.seq.call(null, c1);
      var s2__52561 = cljs.core.seq.call(null, c2);
      if(cljs.core.truth_(function() {
        var and__3546__auto____52562 = s1__52560;
        if(cljs.core.truth_(and__3546__auto____52562)) {
          return s2__52561
        }else {
          return and__3546__auto____52562
        }
      }())) {
        return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s1__52560), cljs.core.first.call(null, s2__52561)), map.call(null, f, cljs.core.rest.call(null, s1__52560), cljs.core.rest.call(null, s2__52561)))
      }else {
        return null
      }
    })
  };
  var map__52572 = function(f, c1, c2, c3) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1__52563 = cljs.core.seq.call(null, c1);
      var s2__52564 = cljs.core.seq.call(null, c2);
      var s3__52565 = cljs.core.seq.call(null, c3);
      if(cljs.core.truth_(function() {
        var and__3546__auto____52566 = s1__52563;
        if(cljs.core.truth_(and__3546__auto____52566)) {
          var and__3546__auto____52567 = s2__52564;
          if(cljs.core.truth_(and__3546__auto____52567)) {
            return s3__52565
          }else {
            return and__3546__auto____52567
          }
        }else {
          return and__3546__auto____52566
        }
      }())) {
        return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s1__52563), cljs.core.first.call(null, s2__52564), cljs.core.first.call(null, s3__52565)), map.call(null, f, cljs.core.rest.call(null, s1__52563), cljs.core.rest.call(null, s2__52564), cljs.core.rest.call(null, s3__52565)))
      }else {
        return null
      }
    })
  };
  var map__52573 = function() {
    var G__52575__delegate = function(f, c1, c2, c3, colls) {
      var step__52569 = function step(cs) {
        return new cljs.core.LazySeq(null, false, function() {
          var ss__52568 = map.call(null, cljs.core.seq, cs);
          if(cljs.core.truth_(cljs.core.every_QMARK_.call(null, cljs.core.identity, ss__52568))) {
            return cljs.core.cons.call(null, map.call(null, cljs.core.first, ss__52568), step.call(null, map.call(null, cljs.core.rest, ss__52568)))
          }else {
            return null
          }
        })
      };
      return map.call(null, function(p1__52480_SHARP_) {
        return cljs.core.apply.call(null, f, p1__52480_SHARP_)
      }, step__52569.call(null, cljs.core.conj.call(null, colls, c3, c2, c1)))
    };
    var G__52575 = function(f, c1, c2, c3, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__52575__delegate.call(this, f, c1, c2, c3, colls)
    };
    G__52575.cljs$lang$maxFixedArity = 4;
    G__52575.cljs$lang$applyTo = function(arglist__52576) {
      var f = cljs.core.first(arglist__52576);
      var c1 = cljs.core.first(cljs.core.next(arglist__52576));
      var c2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__52576)));
      var c3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__52576))));
      var colls = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__52576))));
      return G__52575__delegate.call(this, f, c1, c2, c3, colls)
    };
    return G__52575
  }();
  map = function(f, c1, c2, c3, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return map__52570.call(this, f, c1);
      case 3:
        return map__52571.call(this, f, c1, c2);
      case 4:
        return map__52572.call(this, f, c1, c2, c3);
      default:
        return map__52573.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  map.cljs$lang$maxFixedArity = 4;
  map.cljs$lang$applyTo = map__52573.cljs$lang$applyTo;
  return map
}();
cljs.core.take = function take(n, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    if(cljs.core.truth_(n > 0)) {
      var temp__3698__auto____52577 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3698__auto____52577)) {
        var s__52578 = temp__3698__auto____52577;
        return cljs.core.cons.call(null, cljs.core.first.call(null, s__52578), take.call(null, n - 1, cljs.core.rest.call(null, s__52578)))
      }else {
        return null
      }
    }else {
      return null
    }
  })
};
cljs.core.drop = function drop(n, coll) {
  var step__52581 = function(n, coll) {
    while(true) {
      var s__52579 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(function() {
        var and__3546__auto____52580 = n > 0;
        if(cljs.core.truth_(and__3546__auto____52580)) {
          return s__52579
        }else {
          return and__3546__auto____52580
        }
      }())) {
        var G__52582 = n - 1;
        var G__52583 = cljs.core.rest.call(null, s__52579);
        n = G__52582;
        coll = G__52583;
        continue
      }else {
        return s__52579
      }
      break
    }
  };
  return new cljs.core.LazySeq(null, false, function() {
    return step__52581.call(null, n, coll)
  })
};
cljs.core.drop_last = function() {
  var drop_last = null;
  var drop_last__52584 = function(s) {
    return drop_last.call(null, 1, s)
  };
  var drop_last__52585 = function(n, s) {
    return cljs.core.map.call(null, function(x, _) {
      return x
    }, s, cljs.core.drop.call(null, n, s))
  };
  drop_last = function(n, s) {
    switch(arguments.length) {
      case 1:
        return drop_last__52584.call(this, n);
      case 2:
        return drop_last__52585.call(this, n, s)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return drop_last
}();
cljs.core.take_last = function take_last(n, coll) {
  var s__52587 = cljs.core.seq.call(null, coll);
  var lead__52588 = cljs.core.seq.call(null, cljs.core.drop.call(null, n, coll));
  while(true) {
    if(cljs.core.truth_(lead__52588)) {
      var G__52589 = cljs.core.next.call(null, s__52587);
      var G__52590 = cljs.core.next.call(null, lead__52588);
      s__52587 = G__52589;
      lead__52588 = G__52590;
      continue
    }else {
      return s__52587
    }
    break
  }
};
cljs.core.drop_while = function drop_while(pred, coll) {
  var step__52593 = function(pred, coll) {
    while(true) {
      var s__52591 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(function() {
        var and__3546__auto____52592 = s__52591;
        if(cljs.core.truth_(and__3546__auto____52592)) {
          return pred.call(null, cljs.core.first.call(null, s__52591))
        }else {
          return and__3546__auto____52592
        }
      }())) {
        var G__52594 = pred;
        var G__52595 = cljs.core.rest.call(null, s__52591);
        pred = G__52594;
        coll = G__52595;
        continue
      }else {
        return s__52591
      }
      break
    }
  };
  return new cljs.core.LazySeq(null, false, function() {
    return step__52593.call(null, pred, coll)
  })
};
cljs.core.cycle = function cycle(coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3698__auto____52596 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3698__auto____52596)) {
      var s__52597 = temp__3698__auto____52596;
      return cljs.core.concat.call(null, s__52597, cycle.call(null, s__52597))
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
  var repeat__52598 = function(x) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, x, repeat.call(null, x))
    })
  };
  var repeat__52599 = function(n, x) {
    return cljs.core.take.call(null, n, repeat.call(null, x))
  };
  repeat = function(n, x) {
    switch(arguments.length) {
      case 1:
        return repeat__52598.call(this, n);
      case 2:
        return repeat__52599.call(this, n, x)
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
  var repeatedly__52601 = function(f) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, f.call(null), repeatedly.call(null, f))
    })
  };
  var repeatedly__52602 = function(n, f) {
    return cljs.core.take.call(null, n, repeatedly.call(null, f))
  };
  repeatedly = function(n, f) {
    switch(arguments.length) {
      case 1:
        return repeatedly__52601.call(this, n);
      case 2:
        return repeatedly__52602.call(this, n, f)
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
  var interleave__52608 = function(c1, c2) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1__52604 = cljs.core.seq.call(null, c1);
      var s2__52605 = cljs.core.seq.call(null, c2);
      if(cljs.core.truth_(function() {
        var and__3546__auto____52606 = s1__52604;
        if(cljs.core.truth_(and__3546__auto____52606)) {
          return s2__52605
        }else {
          return and__3546__auto____52606
        }
      }())) {
        return cljs.core.cons.call(null, cljs.core.first.call(null, s1__52604), cljs.core.cons.call(null, cljs.core.first.call(null, s2__52605), interleave.call(null, cljs.core.rest.call(null, s1__52604), cljs.core.rest.call(null, s2__52605))))
      }else {
        return null
      }
    })
  };
  var interleave__52609 = function() {
    var G__52611__delegate = function(c1, c2, colls) {
      return new cljs.core.LazySeq(null, false, function() {
        var ss__52607 = cljs.core.map.call(null, cljs.core.seq, cljs.core.conj.call(null, colls, c2, c1));
        if(cljs.core.truth_(cljs.core.every_QMARK_.call(null, cljs.core.identity, ss__52607))) {
          return cljs.core.concat.call(null, cljs.core.map.call(null, cljs.core.first, ss__52607), cljs.core.apply.call(null, interleave, cljs.core.map.call(null, cljs.core.rest, ss__52607)))
        }else {
          return null
        }
      })
    };
    var G__52611 = function(c1, c2, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__52611__delegate.call(this, c1, c2, colls)
    };
    G__52611.cljs$lang$maxFixedArity = 2;
    G__52611.cljs$lang$applyTo = function(arglist__52612) {
      var c1 = cljs.core.first(arglist__52612);
      var c2 = cljs.core.first(cljs.core.next(arglist__52612));
      var colls = cljs.core.rest(cljs.core.next(arglist__52612));
      return G__52611__delegate.call(this, c1, c2, colls)
    };
    return G__52611
  }();
  interleave = function(c1, c2, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return interleave__52608.call(this, c1, c2);
      default:
        return interleave__52609.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  interleave.cljs$lang$maxFixedArity = 2;
  interleave.cljs$lang$applyTo = interleave__52609.cljs$lang$applyTo;
  return interleave
}();
cljs.core.interpose = function interpose(sep, coll) {
  return cljs.core.drop.call(null, 1, cljs.core.interleave.call(null, cljs.core.repeat.call(null, sep), coll))
};
cljs.core.flatten1 = function flatten1(colls) {
  var cat__52615 = function cat(coll, colls) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3695__auto____52613 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3695__auto____52613)) {
        var coll__52614 = temp__3695__auto____52613;
        return cljs.core.cons.call(null, cljs.core.first.call(null, coll__52614), cat.call(null, cljs.core.rest.call(null, coll__52614), colls))
      }else {
        if(cljs.core.truth_(cljs.core.seq.call(null, colls))) {
          return cat.call(null, cljs.core.first.call(null, colls), cljs.core.rest.call(null, colls))
        }else {
          return null
        }
      }
    })
  };
  return cat__52615.call(null, null, colls)
};
cljs.core.mapcat = function() {
  var mapcat = null;
  var mapcat__52616 = function(f, coll) {
    return cljs.core.flatten1.call(null, cljs.core.map.call(null, f, coll))
  };
  var mapcat__52617 = function() {
    var G__52619__delegate = function(f, coll, colls) {
      return cljs.core.flatten1.call(null, cljs.core.apply.call(null, cljs.core.map, f, coll, colls))
    };
    var G__52619 = function(f, coll, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__52619__delegate.call(this, f, coll, colls)
    };
    G__52619.cljs$lang$maxFixedArity = 2;
    G__52619.cljs$lang$applyTo = function(arglist__52620) {
      var f = cljs.core.first(arglist__52620);
      var coll = cljs.core.first(cljs.core.next(arglist__52620));
      var colls = cljs.core.rest(cljs.core.next(arglist__52620));
      return G__52619__delegate.call(this, f, coll, colls)
    };
    return G__52619
  }();
  mapcat = function(f, coll, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return mapcat__52616.call(this, f, coll);
      default:
        return mapcat__52617.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  mapcat.cljs$lang$maxFixedArity = 2;
  mapcat.cljs$lang$applyTo = mapcat__52617.cljs$lang$applyTo;
  return mapcat
}();
cljs.core.filter = function filter(pred, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3698__auto____52621 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3698__auto____52621)) {
      var s__52622 = temp__3698__auto____52621;
      var f__52623 = cljs.core.first.call(null, s__52622);
      var r__52624 = cljs.core.rest.call(null, s__52622);
      if(cljs.core.truth_(pred.call(null, f__52623))) {
        return cljs.core.cons.call(null, f__52623, filter.call(null, pred, r__52624))
      }else {
        return filter.call(null, pred, r__52624)
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
  var walk__52626 = function walk(node) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, node, cljs.core.truth_(branch_QMARK_.call(null, node)) ? cljs.core.mapcat.call(null, walk, children.call(null, node)) : null)
    })
  };
  return walk__52626.call(null, root)
};
cljs.core.flatten = function flatten(x) {
  return cljs.core.filter.call(null, function(p1__52625_SHARP_) {
    return cljs.core.not.call(null, cljs.core.sequential_QMARK_.call(null, p1__52625_SHARP_))
  }, cljs.core.rest.call(null, cljs.core.tree_seq.call(null, cljs.core.sequential_QMARK_, cljs.core.seq, x)))
};
cljs.core.into = function into(to, from) {
  return cljs.core.reduce.call(null, cljs.core._conj, to, from)
};
cljs.core.partition = function() {
  var partition = null;
  var partition__52633 = function(n, coll) {
    return partition.call(null, n, n, coll)
  };
  var partition__52634 = function(n, step, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3698__auto____52627 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3698__auto____52627)) {
        var s__52628 = temp__3698__auto____52627;
        var p__52629 = cljs.core.take.call(null, n, s__52628);
        if(cljs.core.truth_(cljs.core._EQ_.call(null, n, cljs.core.count.call(null, p__52629)))) {
          return cljs.core.cons.call(null, p__52629, partition.call(null, n, step, cljs.core.drop.call(null, step, s__52628)))
        }else {
          return null
        }
      }else {
        return null
      }
    })
  };
  var partition__52635 = function(n, step, pad, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3698__auto____52630 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3698__auto____52630)) {
        var s__52631 = temp__3698__auto____52630;
        var p__52632 = cljs.core.take.call(null, n, s__52631);
        if(cljs.core.truth_(cljs.core._EQ_.call(null, n, cljs.core.count.call(null, p__52632)))) {
          return cljs.core.cons.call(null, p__52632, partition.call(null, n, step, pad, cljs.core.drop.call(null, step, s__52631)))
        }else {
          return cljs.core.list.call(null, cljs.core.take.call(null, n, cljs.core.concat.call(null, p__52632, pad)))
        }
      }else {
        return null
      }
    })
  };
  partition = function(n, step, pad, coll) {
    switch(arguments.length) {
      case 2:
        return partition__52633.call(this, n, step);
      case 3:
        return partition__52634.call(this, n, step, pad);
      case 4:
        return partition__52635.call(this, n, step, pad, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return partition
}();
cljs.core.get_in = function() {
  var get_in = null;
  var get_in__52641 = function(m, ks) {
    return cljs.core.reduce.call(null, cljs.core.get, m, ks)
  };
  var get_in__52642 = function(m, ks, not_found) {
    var sentinel__52637 = cljs.core.lookup_sentinel;
    var m__52638 = m;
    var ks__52639 = cljs.core.seq.call(null, ks);
    while(true) {
      if(cljs.core.truth_(ks__52639)) {
        var m__52640 = cljs.core.get.call(null, m__52638, cljs.core.first.call(null, ks__52639), sentinel__52637);
        if(cljs.core.truth_(sentinel__52637 === m__52640)) {
          return not_found
        }else {
          var G__52644 = sentinel__52637;
          var G__52645 = m__52640;
          var G__52646 = cljs.core.next.call(null, ks__52639);
          sentinel__52637 = G__52644;
          m__52638 = G__52645;
          ks__52639 = G__52646;
          continue
        }
      }else {
        return m__52638
      }
      break
    }
  };
  get_in = function(m, ks, not_found) {
    switch(arguments.length) {
      case 2:
        return get_in__52641.call(this, m, ks);
      case 3:
        return get_in__52642.call(this, m, ks, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return get_in
}();
cljs.core.assoc_in = function assoc_in(m, p__52647, v) {
  var vec__52648__52649 = p__52647;
  var k__52650 = cljs.core.nth.call(null, vec__52648__52649, 0, null);
  var ks__52651 = cljs.core.nthnext.call(null, vec__52648__52649, 1);
  if(cljs.core.truth_(ks__52651)) {
    return cljs.core.assoc.call(null, m, k__52650, assoc_in.call(null, cljs.core.get.call(null, m, k__52650), ks__52651, v))
  }else {
    return cljs.core.assoc.call(null, m, k__52650, v)
  }
};
cljs.core.update_in = function() {
  var update_in__delegate = function(m, p__52652, f, args) {
    var vec__52653__52654 = p__52652;
    var k__52655 = cljs.core.nth.call(null, vec__52653__52654, 0, null);
    var ks__52656 = cljs.core.nthnext.call(null, vec__52653__52654, 1);
    if(cljs.core.truth_(ks__52656)) {
      return cljs.core.assoc.call(null, m, k__52655, cljs.core.apply.call(null, update_in, cljs.core.get.call(null, m, k__52655), ks__52656, f, args))
    }else {
      return cljs.core.assoc.call(null, m, k__52655, cljs.core.apply.call(null, f, cljs.core.get.call(null, m, k__52655), args))
    }
  };
  var update_in = function(m, p__52652, f, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
    }
    return update_in__delegate.call(this, m, p__52652, f, args)
  };
  update_in.cljs$lang$maxFixedArity = 3;
  update_in.cljs$lang$applyTo = function(arglist__52657) {
    var m = cljs.core.first(arglist__52657);
    var p__52652 = cljs.core.first(cljs.core.next(arglist__52657));
    var f = cljs.core.first(cljs.core.next(cljs.core.next(arglist__52657)));
    var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__52657)));
    return update_in__delegate.call(this, m, p__52652, f, args)
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
  var this__52658 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.Vector.prototype.cljs$core$ILookup$ = true;
cljs.core.Vector.prototype.cljs$core$ILookup$_lookup = function() {
  var G__52691 = null;
  var G__52691__52692 = function(coll, k) {
    var this__52659 = this;
    return cljs.core._nth.call(null, coll, k, null)
  };
  var G__52691__52693 = function(coll, k, not_found) {
    var this__52660 = this;
    return cljs.core._nth.call(null, coll, k, not_found)
  };
  G__52691 = function(coll, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__52691__52692.call(this, coll, k);
      case 3:
        return G__52691__52693.call(this, coll, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__52691
}();
cljs.core.Vector.prototype.cljs$core$IAssociative$ = true;
cljs.core.Vector.prototype.cljs$core$IAssociative$_assoc = function(coll, k, v) {
  var this__52661 = this;
  var new_array__52662 = cljs.core.aclone.call(null, this__52661.array);
  new_array__52662[k] = v;
  return new cljs.core.Vector(this__52661.meta, new_array__52662)
};
cljs.core.Vector.prototype.cljs$core$IFn$ = true;
cljs.core.Vector.prototype.call = function() {
  var G__52695 = null;
  var G__52695__52696 = function(tsym52663, k) {
    var this__52665 = this;
    var tsym52663__52666 = this;
    var coll__52667 = tsym52663__52666;
    return cljs.core._lookup.call(null, coll__52667, k)
  };
  var G__52695__52697 = function(tsym52664, k, not_found) {
    var this__52668 = this;
    var tsym52664__52669 = this;
    var coll__52670 = tsym52664__52669;
    return cljs.core._lookup.call(null, coll__52670, k, not_found)
  };
  G__52695 = function(tsym52664, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__52695__52696.call(this, tsym52664, k);
      case 3:
        return G__52695__52697.call(this, tsym52664, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__52695
}();
cljs.core.Vector.prototype.cljs$core$ISequential$ = true;
cljs.core.Vector.prototype.cljs$core$ICollection$ = true;
cljs.core.Vector.prototype.cljs$core$ICollection$_conj = function(coll, o) {
  var this__52671 = this;
  var new_array__52672 = cljs.core.aclone.call(null, this__52671.array);
  new_array__52672.push(o);
  return new cljs.core.Vector(this__52671.meta, new_array__52672)
};
cljs.core.Vector.prototype.cljs$core$IReduce$ = true;
cljs.core.Vector.prototype.cljs$core$IReduce$_reduce = function() {
  var G__52699 = null;
  var G__52699__52700 = function(v, f) {
    var this__52673 = this;
    return cljs.core.ci_reduce.call(null, this__52673.array, f)
  };
  var G__52699__52701 = function(v, f, start) {
    var this__52674 = this;
    return cljs.core.ci_reduce.call(null, this__52674.array, f, start)
  };
  G__52699 = function(v, f, start) {
    switch(arguments.length) {
      case 2:
        return G__52699__52700.call(this, v, f);
      case 3:
        return G__52699__52701.call(this, v, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__52699
}();
cljs.core.Vector.prototype.cljs$core$ISeqable$ = true;
cljs.core.Vector.prototype.cljs$core$ISeqable$_seq = function(coll) {
  var this__52675 = this;
  if(cljs.core.truth_(this__52675.array.length > 0)) {
    var vector_seq__52676 = function vector_seq(i) {
      return new cljs.core.LazySeq(null, false, function() {
        if(cljs.core.truth_(i < this__52675.array.length)) {
          return cljs.core.cons.call(null, this__52675.array[i], vector_seq.call(null, i + 1))
        }else {
          return null
        }
      })
    };
    return vector_seq__52676.call(null, 0)
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$ICounted$ = true;
cljs.core.Vector.prototype.cljs$core$ICounted$_count = function(coll) {
  var this__52677 = this;
  return this__52677.array.length
};
cljs.core.Vector.prototype.cljs$core$IStack$ = true;
cljs.core.Vector.prototype.cljs$core$IStack$_peek = function(coll) {
  var this__52678 = this;
  var count__52679 = this__52678.array.length;
  if(cljs.core.truth_(count__52679 > 0)) {
    return this__52678.array[count__52679 - 1]
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$IStack$_pop = function(coll) {
  var this__52680 = this;
  if(cljs.core.truth_(this__52680.array.length > 0)) {
    var new_array__52681 = cljs.core.aclone.call(null, this__52680.array);
    new_array__52681.pop();
    return new cljs.core.Vector(this__52680.meta, new_array__52681)
  }else {
    throw new Error("Can't pop empty vector");
  }
};
cljs.core.Vector.prototype.cljs$core$IVector$ = true;
cljs.core.Vector.prototype.cljs$core$IVector$_assoc_n = function(coll, n, val) {
  var this__52682 = this;
  return cljs.core._assoc.call(null, coll, n, val)
};
cljs.core.Vector.prototype.cljs$core$IEquiv$ = true;
cljs.core.Vector.prototype.cljs$core$IEquiv$_equiv = function(coll, other) {
  var this__52683 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Vector.prototype.cljs$core$IWithMeta$ = true;
cljs.core.Vector.prototype.cljs$core$IWithMeta$_with_meta = function(coll, meta) {
  var this__52684 = this;
  return new cljs.core.Vector(meta, this__52684.array)
};
cljs.core.Vector.prototype.cljs$core$IMeta$ = true;
cljs.core.Vector.prototype.cljs$core$IMeta$_meta = function(coll) {
  var this__52685 = this;
  return this__52685.meta
};
cljs.core.Vector.prototype.cljs$core$IIndexed$ = true;
cljs.core.Vector.prototype.cljs$core$IIndexed$_nth = function() {
  var G__52703 = null;
  var G__52703__52704 = function(coll, n) {
    var this__52686 = this;
    if(cljs.core.truth_(function() {
      var and__3546__auto____52687 = 0 <= n;
      if(cljs.core.truth_(and__3546__auto____52687)) {
        return n < this__52686.array.length
      }else {
        return and__3546__auto____52687
      }
    }())) {
      return this__52686.array[n]
    }else {
      return null
    }
  };
  var G__52703__52705 = function(coll, n, not_found) {
    var this__52688 = this;
    if(cljs.core.truth_(function() {
      var and__3546__auto____52689 = 0 <= n;
      if(cljs.core.truth_(and__3546__auto____52689)) {
        return n < this__52688.array.length
      }else {
        return and__3546__auto____52689
      }
    }())) {
      return this__52688.array[n]
    }else {
      return not_found
    }
  };
  G__52703 = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__52703__52704.call(this, coll, n);
      case 3:
        return G__52703__52705.call(this, coll, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__52703
}();
cljs.core.Vector.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.Vector.prototype.cljs$core$IEmptyableCollection$_empty = function(coll) {
  var this__52690 = this;
  return cljs.core.with_meta.call(null, cljs.core.Vector.EMPTY, this__52690.meta)
};
cljs.core.Vector;
cljs.core.Vector.EMPTY = new cljs.core.Vector(null, []);
cljs.core.Vector.fromArray = function(xs) {
  return new cljs.core.Vector(null, xs)
};
cljs.core.tail_off = function tail_off(pv) {
  var cnt__52707 = pv.cnt;
  if(cljs.core.truth_(cnt__52707 < 32)) {
    return 0
  }else {
    return cnt__52707 - 1 >> 5 << 5
  }
};
cljs.core.new_path = function new_path(level, node) {
  var ll__52708 = level;
  var ret__52709 = node;
  while(true) {
    if(cljs.core.truth_(cljs.core._EQ_.call(null, 0, ll__52708))) {
      return ret__52709
    }else {
      var embed__52710 = ret__52709;
      var r__52711 = cljs.core.aclone.call(null, cljs.core.PersistentVector.EMPTY_NODE);
      var ___52712 = r__52711[0] = embed__52710;
      var G__52713 = ll__52708 - 5;
      var G__52714 = r__52711;
      ll__52708 = G__52713;
      ret__52709 = G__52714;
      continue
    }
    break
  }
};
cljs.core.push_tail = function push_tail(pv, level, parent, tailnode) {
  var ret__52715 = cljs.core.aclone.call(null, parent);
  var subidx__52716 = pv.cnt - 1 >> level & 31;
  if(cljs.core.truth_(cljs.core._EQ_.call(null, 5, level))) {
    ret__52715[subidx__52716] = tailnode;
    return ret__52715
  }else {
    var temp__3695__auto____52717 = parent[subidx__52716];
    if(cljs.core.truth_(temp__3695__auto____52717)) {
      var child__52718 = temp__3695__auto____52717;
      var node_to_insert__52719 = push_tail.call(null, pv, level - 5, child__52718, tailnode);
      var ___52720 = ret__52715[subidx__52716] = node_to_insert__52719;
      return ret__52715
    }else {
      var node_to_insert__52721 = cljs.core.new_path.call(null, level - 5, tailnode);
      var ___52722 = ret__52715[subidx__52716] = node_to_insert__52721;
      return ret__52715
    }
  }
};
cljs.core.array_for = function array_for(pv, i) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____52723 = 0 <= i;
    if(cljs.core.truth_(and__3546__auto____52723)) {
      return i < pv.cnt
    }else {
      return and__3546__auto____52723
    }
  }())) {
    if(cljs.core.truth_(i >= cljs.core.tail_off.call(null, pv))) {
      return pv.tail
    }else {
      var node__52724 = pv.root;
      var level__52725 = pv.shift;
      while(true) {
        if(cljs.core.truth_(level__52725 > 0)) {
          var G__52726 = node__52724[i >> level__52725 & 31];
          var G__52727 = level__52725 - 5;
          node__52724 = G__52726;
          level__52725 = G__52727;
          continue
        }else {
          return node__52724
        }
        break
      }
    }
  }else {
    throw new Error(cljs.core.str.call(null, "No item ", i, " in vector of length ", pv.cnt));
  }
};
cljs.core.do_assoc = function do_assoc(pv, level, node, i, val) {
  var ret__52728 = cljs.core.aclone.call(null, node);
  if(cljs.core.truth_(level === 0)) {
    ret__52728[i & 31] = val;
    return ret__52728
  }else {
    var subidx__52729 = i >> level & 31;
    var ___52730 = ret__52728[subidx__52729] = do_assoc.call(null, pv, level - 5, node[subidx__52729], i, val);
    return ret__52728
  }
};
cljs.core.pop_tail = function pop_tail(pv, level, node) {
  var subidx__52731 = pv.cnt - 2 >> level & 31;
  if(cljs.core.truth_(level > 5)) {
    var new_child__52732 = pop_tail.call(null, pv, level - 5, node[subidx__52731]);
    if(cljs.core.truth_(function() {
      var and__3546__auto____52733 = new_child__52732 === null;
      if(cljs.core.truth_(and__3546__auto____52733)) {
        return subidx__52731 === 0
      }else {
        return and__3546__auto____52733
      }
    }())) {
      return null
    }else {
      var ret__52734 = cljs.core.aclone.call(null, node);
      var ___52735 = ret__52734[subidx__52731] = new_child__52732;
      return ret__52734
    }
  }else {
    if(cljs.core.truth_(subidx__52731 === 0)) {
      return null
    }else {
      if(cljs.core.truth_("\ufdd0'else")) {
        var ret__52736 = cljs.core.aclone.call(null, node);
        var ___52737 = ret__52736[subidx__52731] = null;
        return ret__52736
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
  var this__52738 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.PersistentVector.prototype.cljs$core$ILookup$ = true;
cljs.core.PersistentVector.prototype.cljs$core$ILookup$_lookup = function() {
  var G__52778 = null;
  var G__52778__52779 = function(coll, k) {
    var this__52739 = this;
    return cljs.core._nth.call(null, coll, k, null)
  };
  var G__52778__52780 = function(coll, k, not_found) {
    var this__52740 = this;
    return cljs.core._nth.call(null, coll, k, not_found)
  };
  G__52778 = function(coll, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__52778__52779.call(this, coll, k);
      case 3:
        return G__52778__52780.call(this, coll, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__52778
}();
cljs.core.PersistentVector.prototype.cljs$core$IAssociative$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IAssociative$_assoc = function(coll, k, v) {
  var this__52741 = this;
  if(cljs.core.truth_(function() {
    var and__3546__auto____52742 = 0 <= k;
    if(cljs.core.truth_(and__3546__auto____52742)) {
      return k < this__52741.cnt
    }else {
      return and__3546__auto____52742
    }
  }())) {
    if(cljs.core.truth_(cljs.core.tail_off.call(null, coll) <= k)) {
      var new_tail__52743 = cljs.core.aclone.call(null, this__52741.tail);
      new_tail__52743[k & 31] = v;
      return new cljs.core.PersistentVector(this__52741.meta, this__52741.cnt, this__52741.shift, this__52741.root, new_tail__52743)
    }else {
      return new cljs.core.PersistentVector(this__52741.meta, this__52741.cnt, this__52741.shift, cljs.core.do_assoc.call(null, coll, this__52741.shift, this__52741.root, k, v), this__52741.tail)
    }
  }else {
    if(cljs.core.truth_(cljs.core._EQ_.call(null, k, this__52741.cnt))) {
      return cljs.core._conj.call(null, coll, v)
    }else {
      if(cljs.core.truth_("\ufdd0'else")) {
        throw new Error(cljs.core.str.call(null, "Index ", k, " out of bounds  [0,", this__52741.cnt, "]"));
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IFn$ = true;
cljs.core.PersistentVector.prototype.call = function() {
  var G__52782 = null;
  var G__52782__52783 = function(tsym52744, k) {
    var this__52746 = this;
    var tsym52744__52747 = this;
    var coll__52748 = tsym52744__52747;
    return cljs.core._lookup.call(null, coll__52748, k)
  };
  var G__52782__52784 = function(tsym52745, k, not_found) {
    var this__52749 = this;
    var tsym52745__52750 = this;
    var coll__52751 = tsym52745__52750;
    return cljs.core._lookup.call(null, coll__52751, k, not_found)
  };
  G__52782 = function(tsym52745, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__52782__52783.call(this, tsym52745, k);
      case 3:
        return G__52782__52784.call(this, tsym52745, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__52782
}();
cljs.core.PersistentVector.prototype.cljs$core$ISequential$ = true;
cljs.core.PersistentVector.prototype.cljs$core$ICollection$ = true;
cljs.core.PersistentVector.prototype.cljs$core$ICollection$_conj = function(coll, o) {
  var this__52752 = this;
  if(cljs.core.truth_(this__52752.cnt - cljs.core.tail_off.call(null, coll) < 32)) {
    var new_tail__52753 = cljs.core.aclone.call(null, this__52752.tail);
    new_tail__52753.push(o);
    return new cljs.core.PersistentVector(this__52752.meta, this__52752.cnt + 1, this__52752.shift, this__52752.root, new_tail__52753)
  }else {
    var root_overflow_QMARK___52754 = this__52752.cnt >> 5 > 1 << this__52752.shift;
    var new_shift__52755 = cljs.core.truth_(root_overflow_QMARK___52754) ? this__52752.shift + 5 : this__52752.shift;
    var new_root__52757 = cljs.core.truth_(root_overflow_QMARK___52754) ? function() {
      var n_r__52756 = cljs.core.aclone.call(null, cljs.core.PersistentVector.EMPTY_NODE);
      n_r__52756[0] = this__52752.root;
      n_r__52756[1] = cljs.core.new_path.call(null, this__52752.shift, this__52752.tail);
      return n_r__52756
    }() : cljs.core.push_tail.call(null, coll, this__52752.shift, this__52752.root, this__52752.tail);
    return new cljs.core.PersistentVector(this__52752.meta, this__52752.cnt + 1, new_shift__52755, new_root__52757, [o])
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IReduce$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IReduce$_reduce = function() {
  var G__52786 = null;
  var G__52786__52787 = function(v, f) {
    var this__52758 = this;
    return cljs.core.ci_reduce.call(null, v, f)
  };
  var G__52786__52788 = function(v, f, start) {
    var this__52759 = this;
    return cljs.core.ci_reduce.call(null, v, f, start)
  };
  G__52786 = function(v, f, start) {
    switch(arguments.length) {
      case 2:
        return G__52786__52787.call(this, v, f);
      case 3:
        return G__52786__52788.call(this, v, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__52786
}();
cljs.core.PersistentVector.prototype.cljs$core$ISeqable$ = true;
cljs.core.PersistentVector.prototype.cljs$core$ISeqable$_seq = function(coll) {
  var this__52760 = this;
  if(cljs.core.truth_(this__52760.cnt > 0)) {
    var vector_seq__52761 = function vector_seq(i) {
      return new cljs.core.LazySeq(null, false, function() {
        if(cljs.core.truth_(i < this__52760.cnt)) {
          return cljs.core.cons.call(null, cljs.core._nth.call(null, coll, i), vector_seq.call(null, i + 1))
        }else {
          return null
        }
      })
    };
    return vector_seq__52761.call(null, 0)
  }else {
    return null
  }
};
cljs.core.PersistentVector.prototype.cljs$core$ICounted$ = true;
cljs.core.PersistentVector.prototype.cljs$core$ICounted$_count = function(coll) {
  var this__52762 = this;
  return this__52762.cnt
};
cljs.core.PersistentVector.prototype.cljs$core$IStack$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IStack$_peek = function(coll) {
  var this__52763 = this;
  if(cljs.core.truth_(this__52763.cnt > 0)) {
    return cljs.core._nth.call(null, coll, this__52763.cnt - 1)
  }else {
    return null
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IStack$_pop = function(coll) {
  var this__52764 = this;
  if(cljs.core.truth_(this__52764.cnt === 0)) {
    throw new Error("Can't pop empty vector");
  }else {
    if(cljs.core.truth_(cljs.core._EQ_.call(null, 1, this__52764.cnt))) {
      return cljs.core._with_meta.call(null, cljs.core.PersistentVector.EMPTY, this__52764.meta)
    }else {
      if(cljs.core.truth_(1 < this__52764.cnt - cljs.core.tail_off.call(null, coll))) {
        return new cljs.core.PersistentVector(this__52764.meta, this__52764.cnt - 1, this__52764.shift, this__52764.root, cljs.core.aclone.call(null, this__52764.tail))
      }else {
        if(cljs.core.truth_("\ufdd0'else")) {
          var new_tail__52765 = cljs.core.array_for.call(null, coll, this__52764.cnt - 2);
          var nr__52766 = cljs.core.pop_tail.call(null, this__52764.shift, this__52764.root);
          var new_root__52767 = cljs.core.truth_(nr__52766 === null) ? cljs.core.PersistentVector.EMPTY_NODE : nr__52766;
          var cnt_1__52768 = this__52764.cnt - 1;
          if(cljs.core.truth_(function() {
            var and__3546__auto____52769 = 5 < this__52764.shift;
            if(cljs.core.truth_(and__3546__auto____52769)) {
              return new_root__52767[1] === null
            }else {
              return and__3546__auto____52769
            }
          }())) {
            return new cljs.core.PersistentVector(this__52764.meta, cnt_1__52768, this__52764.shift - 5, new_root__52767[0], new_tail__52765)
          }else {
            return new cljs.core.PersistentVector(this__52764.meta, cnt_1__52768, this__52764.shift, new_root__52767, new_tail__52765)
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
  var this__52770 = this;
  return cljs.core._assoc.call(null, coll, n, val)
};
cljs.core.PersistentVector.prototype.cljs$core$IEquiv$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IEquiv$_equiv = function(coll, other) {
  var this__52771 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentVector.prototype.cljs$core$IWithMeta$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IWithMeta$_with_meta = function(coll, meta) {
  var this__52772 = this;
  return new cljs.core.PersistentVector(meta, this__52772.cnt, this__52772.shift, this__52772.root, this__52772.tail)
};
cljs.core.PersistentVector.prototype.cljs$core$IMeta$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IMeta$_meta = function(coll) {
  var this__52773 = this;
  return this__52773.meta
};
cljs.core.PersistentVector.prototype.cljs$core$IIndexed$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IIndexed$_nth = function() {
  var G__52790 = null;
  var G__52790__52791 = function(coll, n) {
    var this__52774 = this;
    return cljs.core.array_for.call(null, coll, n)[n & 31]
  };
  var G__52790__52792 = function(coll, n, not_found) {
    var this__52775 = this;
    if(cljs.core.truth_(function() {
      var and__3546__auto____52776 = 0 <= n;
      if(cljs.core.truth_(and__3546__auto____52776)) {
        return n < this__52775.cnt
      }else {
        return and__3546__auto____52776
      }
    }())) {
      return cljs.core._nth.call(null, coll, n)
    }else {
      return not_found
    }
  };
  G__52790 = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__52790__52791.call(this, coll, n);
      case 3:
        return G__52790__52792.call(this, coll, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__52790
}();
cljs.core.PersistentVector.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IEmptyableCollection$_empty = function(coll) {
  var this__52777 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.EMPTY, this__52777.meta)
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
  vector.cljs$lang$applyTo = function(arglist__52794) {
    var args = cljs.core.seq(arglist__52794);
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
  var this__52795 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.Subvec.prototype.cljs$core$ILookup$ = true;
cljs.core.Subvec.prototype.cljs$core$ILookup$_lookup = function() {
  var G__52823 = null;
  var G__52823__52824 = function(coll, k) {
    var this__52796 = this;
    return cljs.core._nth.call(null, coll, k, null)
  };
  var G__52823__52825 = function(coll, k, not_found) {
    var this__52797 = this;
    return cljs.core._nth.call(null, coll, k, not_found)
  };
  G__52823 = function(coll, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__52823__52824.call(this, coll, k);
      case 3:
        return G__52823__52825.call(this, coll, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__52823
}();
cljs.core.Subvec.prototype.cljs$core$IAssociative$ = true;
cljs.core.Subvec.prototype.cljs$core$IAssociative$_assoc = function(coll, key, val) {
  var this__52798 = this;
  var v_pos__52799 = this__52798.start + key;
  return new cljs.core.Subvec(this__52798.meta, cljs.core._assoc.call(null, this__52798.v, v_pos__52799, val), this__52798.start, this__52798.end > v_pos__52799 + 1 ? this__52798.end : v_pos__52799 + 1)
};
cljs.core.Subvec.prototype.cljs$core$IFn$ = true;
cljs.core.Subvec.prototype.call = function() {
  var G__52827 = null;
  var G__52827__52828 = function(tsym52800, k) {
    var this__52802 = this;
    var tsym52800__52803 = this;
    var coll__52804 = tsym52800__52803;
    return cljs.core._lookup.call(null, coll__52804, k)
  };
  var G__52827__52829 = function(tsym52801, k, not_found) {
    var this__52805 = this;
    var tsym52801__52806 = this;
    var coll__52807 = tsym52801__52806;
    return cljs.core._lookup.call(null, coll__52807, k, not_found)
  };
  G__52827 = function(tsym52801, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__52827__52828.call(this, tsym52801, k);
      case 3:
        return G__52827__52829.call(this, tsym52801, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__52827
}();
cljs.core.Subvec.prototype.cljs$core$ISequential$ = true;
cljs.core.Subvec.prototype.cljs$core$ICollection$ = true;
cljs.core.Subvec.prototype.cljs$core$ICollection$_conj = function(coll, o) {
  var this__52808 = this;
  return new cljs.core.Subvec(this__52808.meta, cljs.core._assoc_n.call(null, this__52808.v, this__52808.end, o), this__52808.start, this__52808.end + 1)
};
cljs.core.Subvec.prototype.cljs$core$IReduce$ = true;
cljs.core.Subvec.prototype.cljs$core$IReduce$_reduce = function() {
  var G__52831 = null;
  var G__52831__52832 = function(coll, f) {
    var this__52809 = this;
    return cljs.core.ci_reduce.call(null, coll, f)
  };
  var G__52831__52833 = function(coll, f, start) {
    var this__52810 = this;
    return cljs.core.ci_reduce.call(null, coll, f, start)
  };
  G__52831 = function(coll, f, start) {
    switch(arguments.length) {
      case 2:
        return G__52831__52832.call(this, coll, f);
      case 3:
        return G__52831__52833.call(this, coll, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__52831
}();
cljs.core.Subvec.prototype.cljs$core$ISeqable$ = true;
cljs.core.Subvec.prototype.cljs$core$ISeqable$_seq = function(coll) {
  var this__52811 = this;
  var subvec_seq__52812 = function subvec_seq(i) {
    if(cljs.core.truth_(cljs.core._EQ_.call(null, i, this__52811.end))) {
      return null
    }else {
      return cljs.core.cons.call(null, cljs.core._nth.call(null, this__52811.v, i), new cljs.core.LazySeq(null, false, function() {
        return subvec_seq.call(null, i + 1)
      }))
    }
  };
  return subvec_seq__52812.call(null, this__52811.start)
};
cljs.core.Subvec.prototype.cljs$core$ICounted$ = true;
cljs.core.Subvec.prototype.cljs$core$ICounted$_count = function(coll) {
  var this__52813 = this;
  return this__52813.end - this__52813.start
};
cljs.core.Subvec.prototype.cljs$core$IStack$ = true;
cljs.core.Subvec.prototype.cljs$core$IStack$_peek = function(coll) {
  var this__52814 = this;
  return cljs.core._nth.call(null, this__52814.v, this__52814.end - 1)
};
cljs.core.Subvec.prototype.cljs$core$IStack$_pop = function(coll) {
  var this__52815 = this;
  if(cljs.core.truth_(cljs.core._EQ_.call(null, this__52815.start, this__52815.end))) {
    throw new Error("Can't pop empty vector");
  }else {
    return new cljs.core.Subvec(this__52815.meta, this__52815.v, this__52815.start, this__52815.end - 1)
  }
};
cljs.core.Subvec.prototype.cljs$core$IVector$ = true;
cljs.core.Subvec.prototype.cljs$core$IVector$_assoc_n = function(coll, n, val) {
  var this__52816 = this;
  return cljs.core._assoc.call(null, coll, n, val)
};
cljs.core.Subvec.prototype.cljs$core$IEquiv$ = true;
cljs.core.Subvec.prototype.cljs$core$IEquiv$_equiv = function(coll, other) {
  var this__52817 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Subvec.prototype.cljs$core$IWithMeta$ = true;
cljs.core.Subvec.prototype.cljs$core$IWithMeta$_with_meta = function(coll, meta) {
  var this__52818 = this;
  return new cljs.core.Subvec(meta, this__52818.v, this__52818.start, this__52818.end)
};
cljs.core.Subvec.prototype.cljs$core$IMeta$ = true;
cljs.core.Subvec.prototype.cljs$core$IMeta$_meta = function(coll) {
  var this__52819 = this;
  return this__52819.meta
};
cljs.core.Subvec.prototype.cljs$core$IIndexed$ = true;
cljs.core.Subvec.prototype.cljs$core$IIndexed$_nth = function() {
  var G__52835 = null;
  var G__52835__52836 = function(coll, n) {
    var this__52820 = this;
    return cljs.core._nth.call(null, this__52820.v, this__52820.start + n)
  };
  var G__52835__52837 = function(coll, n, not_found) {
    var this__52821 = this;
    return cljs.core._nth.call(null, this__52821.v, this__52821.start + n, not_found)
  };
  G__52835 = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__52835__52836.call(this, coll, n);
      case 3:
        return G__52835__52837.call(this, coll, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__52835
}();
cljs.core.Subvec.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.Subvec.prototype.cljs$core$IEmptyableCollection$_empty = function(coll) {
  var this__52822 = this;
  return cljs.core.with_meta.call(null, cljs.core.Vector.EMPTY, this__52822.meta)
};
cljs.core.Subvec;
cljs.core.subvec = function() {
  var subvec = null;
  var subvec__52839 = function(v, start) {
    return subvec.call(null, v, start, cljs.core.count.call(null, v))
  };
  var subvec__52840 = function(v, start, end) {
    return new cljs.core.Subvec(null, v, start, end)
  };
  subvec = function(v, start, end) {
    switch(arguments.length) {
      case 2:
        return subvec__52839.call(this, v, start);
      case 3:
        return subvec__52840.call(this, v, start, end)
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
  var this__52842 = this;
  return coll
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IHash$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$IHash$_hash = function(coll) {
  var this__52843 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEquiv$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEquiv$_equiv = function(coll, other) {
  var this__52844 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISequential$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEmptyableCollection$_empty = function(coll) {
  var this__52845 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__52845.meta)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ICollection$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$ICollection$_conj = function(coll, o) {
  var this__52846 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeq$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeq$_first = function(coll) {
  var this__52847 = this;
  return cljs.core._first.call(null, this__52847.front)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeq$_rest = function(coll) {
  var this__52848 = this;
  var temp__3695__auto____52849 = cljs.core.next.call(null, this__52848.front);
  if(cljs.core.truth_(temp__3695__auto____52849)) {
    var f1__52850 = temp__3695__auto____52849;
    return new cljs.core.PersistentQueueSeq(this__52848.meta, f1__52850, this__52848.rear)
  }else {
    if(cljs.core.truth_(this__52848.rear === null)) {
      return cljs.core._empty.call(null, coll)
    }else {
      return new cljs.core.PersistentQueueSeq(this__52848.meta, this__52848.rear, null)
    }
  }
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IMeta$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$IMeta$_meta = function(coll) {
  var this__52851 = this;
  return this__52851.meta
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IWithMeta$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$IWithMeta$_with_meta = function(coll, meta) {
  var this__52852 = this;
  return new cljs.core.PersistentQueueSeq(meta, this__52852.front, this__52852.rear)
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
  var this__52853 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.PersistentQueue.prototype.cljs$core$ISequential$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$ICollection$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$ICollection$_conj = function(coll, o) {
  var this__52854 = this;
  if(cljs.core.truth_(this__52854.front)) {
    return new cljs.core.PersistentQueue(this__52854.meta, this__52854.count + 1, this__52854.front, cljs.core.conj.call(null, function() {
      var or__3548__auto____52855 = this__52854.rear;
      if(cljs.core.truth_(or__3548__auto____52855)) {
        return or__3548__auto____52855
      }else {
        return cljs.core.PersistentVector.fromArray([])
      }
    }(), o))
  }else {
    return new cljs.core.PersistentQueue(this__52854.meta, this__52854.count + 1, cljs.core.conj.call(null, this__52854.front, o), cljs.core.PersistentVector.fromArray([]))
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeqable$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$ISeqable$_seq = function(coll) {
  var this__52856 = this;
  var rear__52857 = cljs.core.seq.call(null, this__52856.rear);
  if(cljs.core.truth_(function() {
    var or__3548__auto____52858 = this__52856.front;
    if(cljs.core.truth_(or__3548__auto____52858)) {
      return or__3548__auto____52858
    }else {
      return rear__52857
    }
  }())) {
    return new cljs.core.PersistentQueueSeq(null, this__52856.front, cljs.core.seq.call(null, rear__52857))
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ICounted$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$ICounted$_count = function(coll) {
  var this__52859 = this;
  return this__52859.count
};
cljs.core.PersistentQueue.prototype.cljs$core$IStack$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IStack$_peek = function(coll) {
  var this__52860 = this;
  return cljs.core._first.call(null, this__52860.front)
};
cljs.core.PersistentQueue.prototype.cljs$core$IStack$_pop = function(coll) {
  var this__52861 = this;
  if(cljs.core.truth_(this__52861.front)) {
    var temp__3695__auto____52862 = cljs.core.next.call(null, this__52861.front);
    if(cljs.core.truth_(temp__3695__auto____52862)) {
      var f1__52863 = temp__3695__auto____52862;
      return new cljs.core.PersistentQueue(this__52861.meta, this__52861.count - 1, f1__52863, this__52861.rear)
    }else {
      return new cljs.core.PersistentQueue(this__52861.meta, this__52861.count - 1, cljs.core.seq.call(null, this__52861.rear), cljs.core.PersistentVector.fromArray([]))
    }
  }else {
    return coll
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeq$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$ISeq$_first = function(coll) {
  var this__52864 = this;
  return cljs.core.first.call(null, this__52864.front)
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeq$_rest = function(coll) {
  var this__52865 = this;
  return cljs.core.rest.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.PersistentQueue.prototype.cljs$core$IEquiv$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IEquiv$_equiv = function(coll, other) {
  var this__52866 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentQueue.prototype.cljs$core$IWithMeta$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IWithMeta$_with_meta = function(coll, meta) {
  var this__52867 = this;
  return new cljs.core.PersistentQueue(meta, this__52867.count, this__52867.front, this__52867.rear)
};
cljs.core.PersistentQueue.prototype.cljs$core$IMeta$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IMeta$_meta = function(coll) {
  var this__52868 = this;
  return this__52868.meta
};
cljs.core.PersistentQueue.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IEmptyableCollection$_empty = function(coll) {
  var this__52869 = this;
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
  var this__52870 = this;
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
  var len__52871 = array.length;
  var i__52872 = 0;
  while(true) {
    if(cljs.core.truth_(i__52872 < len__52871)) {
      if(cljs.core.truth_(cljs.core._EQ_.call(null, k, array[i__52872]))) {
        return i__52872
      }else {
        var G__52873 = i__52872 + incr;
        i__52872 = G__52873;
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
  var obj_map_contains_key_QMARK___52875 = function(k, strobj) {
    return obj_map_contains_key_QMARK_.call(null, k, strobj, true, false)
  };
  var obj_map_contains_key_QMARK___52876 = function(k, strobj, true_val, false_val) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____52874 = goog.isString.call(null, k);
      if(cljs.core.truth_(and__3546__auto____52874)) {
        return strobj.hasOwnProperty(k)
      }else {
        return and__3546__auto____52874
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
        return obj_map_contains_key_QMARK___52875.call(this, k, strobj);
      case 4:
        return obj_map_contains_key_QMARK___52876.call(this, k, strobj, true_val, false_val)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return obj_map_contains_key_QMARK_
}();
cljs.core.obj_map_compare_keys = function obj_map_compare_keys(a, b) {
  var a__52879 = cljs.core.hash.call(null, a);
  var b__52880 = cljs.core.hash.call(null, b);
  if(cljs.core.truth_(a__52879 < b__52880)) {
    return-1
  }else {
    if(cljs.core.truth_(a__52879 > b__52880)) {
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
  var this__52881 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.ObjMap.prototype.cljs$core$ILookup$ = true;
cljs.core.ObjMap.prototype.cljs$core$ILookup$_lookup = function() {
  var G__52908 = null;
  var G__52908__52909 = function(coll, k) {
    var this__52882 = this;
    return cljs.core._lookup.call(null, coll, k, null)
  };
  var G__52908__52910 = function(coll, k, not_found) {
    var this__52883 = this;
    return cljs.core.obj_map_contains_key_QMARK_.call(null, k, this__52883.strobj, this__52883.strobj[k], not_found)
  };
  G__52908 = function(coll, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__52908__52909.call(this, coll, k);
      case 3:
        return G__52908__52910.call(this, coll, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__52908
}();
cljs.core.ObjMap.prototype.cljs$core$IAssociative$ = true;
cljs.core.ObjMap.prototype.cljs$core$IAssociative$_assoc = function(coll, k, v) {
  var this__52884 = this;
  if(cljs.core.truth_(goog.isString.call(null, k))) {
    var new_strobj__52885 = goog.object.clone.call(null, this__52884.strobj);
    var overwrite_QMARK___52886 = new_strobj__52885.hasOwnProperty(k);
    new_strobj__52885[k] = v;
    if(cljs.core.truth_(overwrite_QMARK___52886)) {
      return new cljs.core.ObjMap(this__52884.meta, this__52884.keys, new_strobj__52885)
    }else {
      var new_keys__52887 = cljs.core.aclone.call(null, this__52884.keys);
      new_keys__52887.push(k);
      return new cljs.core.ObjMap(this__52884.meta, new_keys__52887, new_strobj__52885)
    }
  }else {
    return cljs.core.with_meta.call(null, cljs.core.into.call(null, cljs.core.hash_map.call(null, k, v), cljs.core.seq.call(null, coll)), this__52884.meta)
  }
};
cljs.core.ObjMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_ = function(coll, k) {
  var this__52888 = this;
  return cljs.core.obj_map_contains_key_QMARK_.call(null, k, this__52888.strobj)
};
cljs.core.ObjMap.prototype.cljs$core$IFn$ = true;
cljs.core.ObjMap.prototype.call = function() {
  var G__52912 = null;
  var G__52912__52913 = function(tsym52889, k) {
    var this__52891 = this;
    var tsym52889__52892 = this;
    var coll__52893 = tsym52889__52892;
    return cljs.core._lookup.call(null, coll__52893, k)
  };
  var G__52912__52914 = function(tsym52890, k, not_found) {
    var this__52894 = this;
    var tsym52890__52895 = this;
    var coll__52896 = tsym52890__52895;
    return cljs.core._lookup.call(null, coll__52896, k, not_found)
  };
  G__52912 = function(tsym52890, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__52912__52913.call(this, tsym52890, k);
      case 3:
        return G__52912__52914.call(this, tsym52890, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__52912
}();
cljs.core.ObjMap.prototype.cljs$core$ICollection$ = true;
cljs.core.ObjMap.prototype.cljs$core$ICollection$_conj = function(coll, entry) {
  var this__52897 = this;
  if(cljs.core.truth_(cljs.core.vector_QMARK_.call(null, entry))) {
    return cljs.core._assoc.call(null, coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.ObjMap.prototype.cljs$core$ISeqable$ = true;
cljs.core.ObjMap.prototype.cljs$core$ISeqable$_seq = function(coll) {
  var this__52898 = this;
  if(cljs.core.truth_(this__52898.keys.length > 0)) {
    return cljs.core.map.call(null, function(p1__52878_SHARP_) {
      return cljs.core.vector.call(null, p1__52878_SHARP_, this__52898.strobj[p1__52878_SHARP_])
    }, this__52898.keys.sort(cljs.core.obj_map_compare_keys))
  }else {
    return null
  }
};
cljs.core.ObjMap.prototype.cljs$core$ICounted$ = true;
cljs.core.ObjMap.prototype.cljs$core$ICounted$_count = function(coll) {
  var this__52899 = this;
  return this__52899.keys.length
};
cljs.core.ObjMap.prototype.cljs$core$IEquiv$ = true;
cljs.core.ObjMap.prototype.cljs$core$IEquiv$_equiv = function(coll, other) {
  var this__52900 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.ObjMap.prototype.cljs$core$IWithMeta$ = true;
cljs.core.ObjMap.prototype.cljs$core$IWithMeta$_with_meta = function(coll, meta) {
  var this__52901 = this;
  return new cljs.core.ObjMap(meta, this__52901.keys, this__52901.strobj)
};
cljs.core.ObjMap.prototype.cljs$core$IMeta$ = true;
cljs.core.ObjMap.prototype.cljs$core$IMeta$_meta = function(coll) {
  var this__52902 = this;
  return this__52902.meta
};
cljs.core.ObjMap.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.ObjMap.prototype.cljs$core$IEmptyableCollection$_empty = function(coll) {
  var this__52903 = this;
  return cljs.core.with_meta.call(null, cljs.core.ObjMap.EMPTY, this__52903.meta)
};
cljs.core.ObjMap.prototype.cljs$core$IMap$ = true;
cljs.core.ObjMap.prototype.cljs$core$IMap$_dissoc = function(coll, k) {
  var this__52904 = this;
  if(cljs.core.truth_(function() {
    var and__3546__auto____52905 = goog.isString.call(null, k);
    if(cljs.core.truth_(and__3546__auto____52905)) {
      return this__52904.strobj.hasOwnProperty(k)
    }else {
      return and__3546__auto____52905
    }
  }())) {
    var new_keys__52906 = cljs.core.aclone.call(null, this__52904.keys);
    var new_strobj__52907 = goog.object.clone.call(null, this__52904.strobj);
    new_keys__52906.splice(cljs.core.scan_array.call(null, 1, k, new_keys__52906), 1);
    cljs.core.js_delete.call(null, new_strobj__52907, k);
    return new cljs.core.ObjMap(this__52904.meta, new_keys__52906, new_strobj__52907)
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
  var this__52917 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.HashMap.prototype.cljs$core$ILookup$ = true;
cljs.core.HashMap.prototype.cljs$core$ILookup$_lookup = function() {
  var G__52955 = null;
  var G__52955__52956 = function(coll, k) {
    var this__52918 = this;
    return cljs.core._lookup.call(null, coll, k, null)
  };
  var G__52955__52957 = function(coll, k, not_found) {
    var this__52919 = this;
    var bucket__52920 = this__52919.hashobj[cljs.core.hash.call(null, k)];
    var i__52921 = cljs.core.truth_(bucket__52920) ? cljs.core.scan_array.call(null, 2, k, bucket__52920) : null;
    if(cljs.core.truth_(i__52921)) {
      return bucket__52920[i__52921 + 1]
    }else {
      return not_found
    }
  };
  G__52955 = function(coll, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__52955__52956.call(this, coll, k);
      case 3:
        return G__52955__52957.call(this, coll, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__52955
}();
cljs.core.HashMap.prototype.cljs$core$IAssociative$ = true;
cljs.core.HashMap.prototype.cljs$core$IAssociative$_assoc = function(coll, k, v) {
  var this__52922 = this;
  var h__52923 = cljs.core.hash.call(null, k);
  var bucket__52924 = this__52922.hashobj[h__52923];
  if(cljs.core.truth_(bucket__52924)) {
    var new_bucket__52925 = cljs.core.aclone.call(null, bucket__52924);
    var new_hashobj__52926 = goog.object.clone.call(null, this__52922.hashobj);
    new_hashobj__52926[h__52923] = new_bucket__52925;
    var temp__3695__auto____52927 = cljs.core.scan_array.call(null, 2, k, new_bucket__52925);
    if(cljs.core.truth_(temp__3695__auto____52927)) {
      var i__52928 = temp__3695__auto____52927;
      new_bucket__52925[i__52928 + 1] = v;
      return new cljs.core.HashMap(this__52922.meta, this__52922.count, new_hashobj__52926)
    }else {
      new_bucket__52925.push(k, v);
      return new cljs.core.HashMap(this__52922.meta, this__52922.count + 1, new_hashobj__52926)
    }
  }else {
    var new_hashobj__52929 = goog.object.clone.call(null, this__52922.hashobj);
    new_hashobj__52929[h__52923] = [k, v];
    return new cljs.core.HashMap(this__52922.meta, this__52922.count + 1, new_hashobj__52929)
  }
};
cljs.core.HashMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_ = function(coll, k) {
  var this__52930 = this;
  var bucket__52931 = this__52930.hashobj[cljs.core.hash.call(null, k)];
  var i__52932 = cljs.core.truth_(bucket__52931) ? cljs.core.scan_array.call(null, 2, k, bucket__52931) : null;
  if(cljs.core.truth_(i__52932)) {
    return true
  }else {
    return false
  }
};
cljs.core.HashMap.prototype.cljs$core$IFn$ = true;
cljs.core.HashMap.prototype.call = function() {
  var G__52959 = null;
  var G__52959__52960 = function(tsym52933, k) {
    var this__52935 = this;
    var tsym52933__52936 = this;
    var coll__52937 = tsym52933__52936;
    return cljs.core._lookup.call(null, coll__52937, k)
  };
  var G__52959__52961 = function(tsym52934, k, not_found) {
    var this__52938 = this;
    var tsym52934__52939 = this;
    var coll__52940 = tsym52934__52939;
    return cljs.core._lookup.call(null, coll__52940, k, not_found)
  };
  G__52959 = function(tsym52934, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__52959__52960.call(this, tsym52934, k);
      case 3:
        return G__52959__52961.call(this, tsym52934, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__52959
}();
cljs.core.HashMap.prototype.cljs$core$ICollection$ = true;
cljs.core.HashMap.prototype.cljs$core$ICollection$_conj = function(coll, entry) {
  var this__52941 = this;
  if(cljs.core.truth_(cljs.core.vector_QMARK_.call(null, entry))) {
    return cljs.core._assoc.call(null, coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.HashMap.prototype.cljs$core$ISeqable$ = true;
cljs.core.HashMap.prototype.cljs$core$ISeqable$_seq = function(coll) {
  var this__52942 = this;
  if(cljs.core.truth_(this__52942.count > 0)) {
    var hashes__52943 = cljs.core.js_keys.call(null, this__52942.hashobj).sort();
    return cljs.core.mapcat.call(null, function(p1__52916_SHARP_) {
      return cljs.core.map.call(null, cljs.core.vec, cljs.core.partition.call(null, 2, this__52942.hashobj[p1__52916_SHARP_]))
    }, hashes__52943)
  }else {
    return null
  }
};
cljs.core.HashMap.prototype.cljs$core$ICounted$ = true;
cljs.core.HashMap.prototype.cljs$core$ICounted$_count = function(coll) {
  var this__52944 = this;
  return this__52944.count
};
cljs.core.HashMap.prototype.cljs$core$IEquiv$ = true;
cljs.core.HashMap.prototype.cljs$core$IEquiv$_equiv = function(coll, other) {
  var this__52945 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.HashMap.prototype.cljs$core$IWithMeta$ = true;
cljs.core.HashMap.prototype.cljs$core$IWithMeta$_with_meta = function(coll, meta) {
  var this__52946 = this;
  return new cljs.core.HashMap(meta, this__52946.count, this__52946.hashobj)
};
cljs.core.HashMap.prototype.cljs$core$IMeta$ = true;
cljs.core.HashMap.prototype.cljs$core$IMeta$_meta = function(coll) {
  var this__52947 = this;
  return this__52947.meta
};
cljs.core.HashMap.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.HashMap.prototype.cljs$core$IEmptyableCollection$_empty = function(coll) {
  var this__52948 = this;
  return cljs.core.with_meta.call(null, cljs.core.HashMap.EMPTY, this__52948.meta)
};
cljs.core.HashMap.prototype.cljs$core$IMap$ = true;
cljs.core.HashMap.prototype.cljs$core$IMap$_dissoc = function(coll, k) {
  var this__52949 = this;
  var h__52950 = cljs.core.hash.call(null, k);
  var bucket__52951 = this__52949.hashobj[h__52950];
  var i__52952 = cljs.core.truth_(bucket__52951) ? cljs.core.scan_array.call(null, 2, k, bucket__52951) : null;
  if(cljs.core.truth_(cljs.core.not.call(null, i__52952))) {
    return coll
  }else {
    var new_hashobj__52953 = goog.object.clone.call(null, this__52949.hashobj);
    if(cljs.core.truth_(3 > bucket__52951.length)) {
      cljs.core.js_delete.call(null, new_hashobj__52953, h__52950)
    }else {
      var new_bucket__52954 = cljs.core.aclone.call(null, bucket__52951);
      new_bucket__52954.splice(i__52952, 2);
      new_hashobj__52953[h__52950] = new_bucket__52954
    }
    return new cljs.core.HashMap(this__52949.meta, this__52949.count - 1, new_hashobj__52953)
  }
};
cljs.core.HashMap;
cljs.core.HashMap.EMPTY = new cljs.core.HashMap(null, 0, cljs.core.js_obj.call(null));
cljs.core.HashMap.fromArrays = function(ks, vs) {
  var len__52963 = ks.length;
  var i__52964 = 0;
  var out__52965 = cljs.core.HashMap.EMPTY;
  while(true) {
    if(cljs.core.truth_(i__52964 < len__52963)) {
      var G__52966 = i__52964 + 1;
      var G__52967 = cljs.core.assoc.call(null, out__52965, ks[i__52964], vs[i__52964]);
      i__52964 = G__52966;
      out__52965 = G__52967;
      continue
    }else {
      return out__52965
    }
    break
  }
};
cljs.core.hash_map = function() {
  var hash_map__delegate = function(keyvals) {
    var in$__52968 = cljs.core.seq.call(null, keyvals);
    var out__52969 = cljs.core.HashMap.EMPTY;
    while(true) {
      if(cljs.core.truth_(in$__52968)) {
        var G__52970 = cljs.core.nnext.call(null, in$__52968);
        var G__52971 = cljs.core.assoc.call(null, out__52969, cljs.core.first.call(null, in$__52968), cljs.core.second.call(null, in$__52968));
        in$__52968 = G__52970;
        out__52969 = G__52971;
        continue
      }else {
        return out__52969
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
  hash_map.cljs$lang$applyTo = function(arglist__52972) {
    var keyvals = cljs.core.seq(arglist__52972);
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
      return cljs.core.reduce.call(null, function(p1__52973_SHARP_, p2__52974_SHARP_) {
        return cljs.core.conj.call(null, function() {
          var or__3548__auto____52975 = p1__52973_SHARP_;
          if(cljs.core.truth_(or__3548__auto____52975)) {
            return or__3548__auto____52975
          }else {
            return cljs.core.ObjMap.fromObject([], {})
          }
        }(), p2__52974_SHARP_)
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
  merge.cljs$lang$applyTo = function(arglist__52976) {
    var maps = cljs.core.seq(arglist__52976);
    return merge__delegate.call(this, maps)
  };
  return merge
}();
cljs.core.merge_with = function() {
  var merge_with__delegate = function(f, maps) {
    if(cljs.core.truth_(cljs.core.some.call(null, cljs.core.identity, maps))) {
      var merge_entry__52979 = function(m, e) {
        var k__52977 = cljs.core.first.call(null, e);
        var v__52978 = cljs.core.second.call(null, e);
        if(cljs.core.truth_(cljs.core.contains_QMARK_.call(null, m, k__52977))) {
          return cljs.core.assoc.call(null, m, k__52977, f.call(null, cljs.core.get.call(null, m, k__52977), v__52978))
        }else {
          return cljs.core.assoc.call(null, m, k__52977, v__52978)
        }
      };
      var merge2__52981 = function(m1, m2) {
        return cljs.core.reduce.call(null, merge_entry__52979, function() {
          var or__3548__auto____52980 = m1;
          if(cljs.core.truth_(or__3548__auto____52980)) {
            return or__3548__auto____52980
          }else {
            return cljs.core.ObjMap.fromObject([], {})
          }
        }(), cljs.core.seq.call(null, m2))
      };
      return cljs.core.reduce.call(null, merge2__52981, maps)
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
  merge_with.cljs$lang$applyTo = function(arglist__52982) {
    var f = cljs.core.first(arglist__52982);
    var maps = cljs.core.rest(arglist__52982);
    return merge_with__delegate.call(this, f, maps)
  };
  return merge_with
}();
cljs.core.select_keys = function select_keys(map, keyseq) {
  var ret__52984 = cljs.core.ObjMap.fromObject([], {});
  var keys__52985 = cljs.core.seq.call(null, keyseq);
  while(true) {
    if(cljs.core.truth_(keys__52985)) {
      var key__52986 = cljs.core.first.call(null, keys__52985);
      var entry__52987 = cljs.core.get.call(null, map, key__52986, "\ufdd0'user/not-found");
      var G__52988 = cljs.core.truth_(cljs.core.not_EQ_.call(null, entry__52987, "\ufdd0'user/not-found")) ? cljs.core.assoc.call(null, ret__52984, key__52986, entry__52987) : ret__52984;
      var G__52989 = cljs.core.next.call(null, keys__52985);
      ret__52984 = G__52988;
      keys__52985 = G__52989;
      continue
    }else {
      return ret__52984
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
  var this__52990 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.Set.prototype.cljs$core$ILookup$ = true;
cljs.core.Set.prototype.cljs$core$ILookup$_lookup = function() {
  var G__53011 = null;
  var G__53011__53012 = function(coll, v) {
    var this__52991 = this;
    return cljs.core._lookup.call(null, coll, v, null)
  };
  var G__53011__53013 = function(coll, v, not_found) {
    var this__52992 = this;
    if(cljs.core.truth_(cljs.core._contains_key_QMARK_.call(null, this__52992.hash_map, v))) {
      return v
    }else {
      return not_found
    }
  };
  G__53011 = function(coll, v, not_found) {
    switch(arguments.length) {
      case 2:
        return G__53011__53012.call(this, coll, v);
      case 3:
        return G__53011__53013.call(this, coll, v, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__53011
}();
cljs.core.Set.prototype.cljs$core$IFn$ = true;
cljs.core.Set.prototype.call = function() {
  var G__53015 = null;
  var G__53015__53016 = function(tsym52993, k) {
    var this__52995 = this;
    var tsym52993__52996 = this;
    var coll__52997 = tsym52993__52996;
    return cljs.core._lookup.call(null, coll__52997, k)
  };
  var G__53015__53017 = function(tsym52994, k, not_found) {
    var this__52998 = this;
    var tsym52994__52999 = this;
    var coll__53000 = tsym52994__52999;
    return cljs.core._lookup.call(null, coll__53000, k, not_found)
  };
  G__53015 = function(tsym52994, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__53015__53016.call(this, tsym52994, k);
      case 3:
        return G__53015__53017.call(this, tsym52994, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__53015
}();
cljs.core.Set.prototype.cljs$core$ICollection$ = true;
cljs.core.Set.prototype.cljs$core$ICollection$_conj = function(coll, o) {
  var this__53001 = this;
  return new cljs.core.Set(this__53001.meta, cljs.core.assoc.call(null, this__53001.hash_map, o, null))
};
cljs.core.Set.prototype.cljs$core$ISeqable$ = true;
cljs.core.Set.prototype.cljs$core$ISeqable$_seq = function(coll) {
  var this__53002 = this;
  return cljs.core.keys.call(null, this__53002.hash_map)
};
cljs.core.Set.prototype.cljs$core$ISet$ = true;
cljs.core.Set.prototype.cljs$core$ISet$_disjoin = function(coll, v) {
  var this__53003 = this;
  return new cljs.core.Set(this__53003.meta, cljs.core.dissoc.call(null, this__53003.hash_map, v))
};
cljs.core.Set.prototype.cljs$core$ICounted$ = true;
cljs.core.Set.prototype.cljs$core$ICounted$_count = function(coll) {
  var this__53004 = this;
  return cljs.core.count.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.Set.prototype.cljs$core$IEquiv$ = true;
cljs.core.Set.prototype.cljs$core$IEquiv$_equiv = function(coll, other) {
  var this__53005 = this;
  var and__3546__auto____53006 = cljs.core.set_QMARK_.call(null, other);
  if(cljs.core.truth_(and__3546__auto____53006)) {
    var and__3546__auto____53007 = cljs.core._EQ_.call(null, cljs.core.count.call(null, coll), cljs.core.count.call(null, other));
    if(cljs.core.truth_(and__3546__auto____53007)) {
      return cljs.core.every_QMARK_.call(null, function(p1__52983_SHARP_) {
        return cljs.core.contains_QMARK_.call(null, coll, p1__52983_SHARP_)
      }, other)
    }else {
      return and__3546__auto____53007
    }
  }else {
    return and__3546__auto____53006
  }
};
cljs.core.Set.prototype.cljs$core$IWithMeta$ = true;
cljs.core.Set.prototype.cljs$core$IWithMeta$_with_meta = function(coll, meta) {
  var this__53008 = this;
  return new cljs.core.Set(meta, this__53008.hash_map)
};
cljs.core.Set.prototype.cljs$core$IMeta$ = true;
cljs.core.Set.prototype.cljs$core$IMeta$_meta = function(coll) {
  var this__53009 = this;
  return this__53009.meta
};
cljs.core.Set.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.Set.prototype.cljs$core$IEmptyableCollection$_empty = function(coll) {
  var this__53010 = this;
  return cljs.core.with_meta.call(null, cljs.core.Set.EMPTY, this__53010.meta)
};
cljs.core.Set;
cljs.core.Set.EMPTY = new cljs.core.Set(null, cljs.core.hash_map.call(null));
cljs.core.set = function set(coll) {
  var in$__53020 = cljs.core.seq.call(null, coll);
  var out__53021 = cljs.core.Set.EMPTY;
  while(true) {
    if(cljs.core.truth_(cljs.core.not.call(null, cljs.core.empty_QMARK_.call(null, in$__53020)))) {
      var G__53022 = cljs.core.rest.call(null, in$__53020);
      var G__53023 = cljs.core.conj.call(null, out__53021, cljs.core.first.call(null, in$__53020));
      in$__53020 = G__53022;
      out__53021 = G__53023;
      continue
    }else {
      return out__53021
    }
    break
  }
};
cljs.core.replace = function replace(smap, coll) {
  if(cljs.core.truth_(cljs.core.vector_QMARK_.call(null, coll))) {
    var n__53024 = cljs.core.count.call(null, coll);
    return cljs.core.reduce.call(null, function(v, i) {
      var temp__3695__auto____53025 = cljs.core.find.call(null, smap, cljs.core.nth.call(null, v, i));
      if(cljs.core.truth_(temp__3695__auto____53025)) {
        var e__53026 = temp__3695__auto____53025;
        return cljs.core.assoc.call(null, v, i, cljs.core.second.call(null, e__53026))
      }else {
        return v
      }
    }, coll, cljs.core.take.call(null, n__53024, cljs.core.iterate.call(null, cljs.core.inc, 0)))
  }else {
    return cljs.core.map.call(null, function(p1__53019_SHARP_) {
      var temp__3695__auto____53027 = cljs.core.find.call(null, smap, p1__53019_SHARP_);
      if(cljs.core.truth_(temp__3695__auto____53027)) {
        var e__53028 = temp__3695__auto____53027;
        return cljs.core.second.call(null, e__53028)
      }else {
        return p1__53019_SHARP_
      }
    }, coll)
  }
};
cljs.core.distinct = function distinct(coll) {
  var step__53036 = function step(xs, seen) {
    return new cljs.core.LazySeq(null, false, function() {
      return function(p__53029, seen) {
        while(true) {
          var vec__53030__53031 = p__53029;
          var f__53032 = cljs.core.nth.call(null, vec__53030__53031, 0, null);
          var xs__53033 = vec__53030__53031;
          var temp__3698__auto____53034 = cljs.core.seq.call(null, xs__53033);
          if(cljs.core.truth_(temp__3698__auto____53034)) {
            var s__53035 = temp__3698__auto____53034;
            if(cljs.core.truth_(cljs.core.contains_QMARK_.call(null, seen, f__53032))) {
              var G__53037 = cljs.core.rest.call(null, s__53035);
              var G__53038 = seen;
              p__53029 = G__53037;
              seen = G__53038;
              continue
            }else {
              return cljs.core.cons.call(null, f__53032, step.call(null, cljs.core.rest.call(null, s__53035), cljs.core.conj.call(null, seen, f__53032)))
            }
          }else {
            return null
          }
          break
        }
      }.call(null, xs, seen)
    })
  };
  return step__53036.call(null, coll, cljs.core.set([]))
};
cljs.core.butlast = function butlast(s) {
  var ret__53039 = cljs.core.PersistentVector.fromArray([]);
  var s__53040 = s;
  while(true) {
    if(cljs.core.truth_(cljs.core.next.call(null, s__53040))) {
      var G__53041 = cljs.core.conj.call(null, ret__53039, cljs.core.first.call(null, s__53040));
      var G__53042 = cljs.core.next.call(null, s__53040);
      ret__53039 = G__53041;
      s__53040 = G__53042;
      continue
    }else {
      return cljs.core.seq.call(null, ret__53039)
    }
    break
  }
};
cljs.core.name = function name(x) {
  if(cljs.core.truth_(cljs.core.string_QMARK_.call(null, x))) {
    return x
  }else {
    if(cljs.core.truth_(function() {
      var or__3548__auto____53043 = cljs.core.keyword_QMARK_.call(null, x);
      if(cljs.core.truth_(or__3548__auto____53043)) {
        return or__3548__auto____53043
      }else {
        return cljs.core.symbol_QMARK_.call(null, x)
      }
    }())) {
      var i__53044 = x.lastIndexOf("/");
      if(cljs.core.truth_(i__53044 < 0)) {
        return cljs.core.subs.call(null, x, 2)
      }else {
        return cljs.core.subs.call(null, x, i__53044 + 1)
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
    var or__3548__auto____53045 = cljs.core.keyword_QMARK_.call(null, x);
    if(cljs.core.truth_(or__3548__auto____53045)) {
      return or__3548__auto____53045
    }else {
      return cljs.core.symbol_QMARK_.call(null, x)
    }
  }())) {
    var i__53046 = x.lastIndexOf("/");
    if(cljs.core.truth_(i__53046 > -1)) {
      return cljs.core.subs.call(null, x, 2, i__53046)
    }else {
      return null
    }
  }else {
    throw new Error(cljs.core.str.call(null, "Doesn't support namespace: ", x));
  }
};
cljs.core.zipmap = function zipmap(keys, vals) {
  var map__53049 = cljs.core.ObjMap.fromObject([], {});
  var ks__53050 = cljs.core.seq.call(null, keys);
  var vs__53051 = cljs.core.seq.call(null, vals);
  while(true) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____53052 = ks__53050;
      if(cljs.core.truth_(and__3546__auto____53052)) {
        return vs__53051
      }else {
        return and__3546__auto____53052
      }
    }())) {
      var G__53053 = cljs.core.assoc.call(null, map__53049, cljs.core.first.call(null, ks__53050), cljs.core.first.call(null, vs__53051));
      var G__53054 = cljs.core.next.call(null, ks__53050);
      var G__53055 = cljs.core.next.call(null, vs__53051);
      map__53049 = G__53053;
      ks__53050 = G__53054;
      vs__53051 = G__53055;
      continue
    }else {
      return map__53049
    }
    break
  }
};
cljs.core.max_key = function() {
  var max_key = null;
  var max_key__53058 = function(k, x) {
    return x
  };
  var max_key__53059 = function(k, x, y) {
    if(cljs.core.truth_(k.call(null, x) > k.call(null, y))) {
      return x
    }else {
      return y
    }
  };
  var max_key__53060 = function() {
    var G__53062__delegate = function(k, x, y, more) {
      return cljs.core.reduce.call(null, function(p1__53047_SHARP_, p2__53048_SHARP_) {
        return max_key.call(null, k, p1__53047_SHARP_, p2__53048_SHARP_)
      }, max_key.call(null, k, x, y), more)
    };
    var G__53062 = function(k, x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__53062__delegate.call(this, k, x, y, more)
    };
    G__53062.cljs$lang$maxFixedArity = 3;
    G__53062.cljs$lang$applyTo = function(arglist__53063) {
      var k = cljs.core.first(arglist__53063);
      var x = cljs.core.first(cljs.core.next(arglist__53063));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(arglist__53063)));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__53063)));
      return G__53062__delegate.call(this, k, x, y, more)
    };
    return G__53062
  }();
  max_key = function(k, x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return max_key__53058.call(this, k, x);
      case 3:
        return max_key__53059.call(this, k, x, y);
      default:
        return max_key__53060.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  max_key.cljs$lang$maxFixedArity = 3;
  max_key.cljs$lang$applyTo = max_key__53060.cljs$lang$applyTo;
  return max_key
}();
cljs.core.min_key = function() {
  var min_key = null;
  var min_key__53064 = function(k, x) {
    return x
  };
  var min_key__53065 = function(k, x, y) {
    if(cljs.core.truth_(k.call(null, x) < k.call(null, y))) {
      return x
    }else {
      return y
    }
  };
  var min_key__53066 = function() {
    var G__53068__delegate = function(k, x, y, more) {
      return cljs.core.reduce.call(null, function(p1__53056_SHARP_, p2__53057_SHARP_) {
        return min_key.call(null, k, p1__53056_SHARP_, p2__53057_SHARP_)
      }, min_key.call(null, k, x, y), more)
    };
    var G__53068 = function(k, x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__53068__delegate.call(this, k, x, y, more)
    };
    G__53068.cljs$lang$maxFixedArity = 3;
    G__53068.cljs$lang$applyTo = function(arglist__53069) {
      var k = cljs.core.first(arglist__53069);
      var x = cljs.core.first(cljs.core.next(arglist__53069));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(arglist__53069)));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__53069)));
      return G__53068__delegate.call(this, k, x, y, more)
    };
    return G__53068
  }();
  min_key = function(k, x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return min_key__53064.call(this, k, x);
      case 3:
        return min_key__53065.call(this, k, x, y);
      default:
        return min_key__53066.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  min_key.cljs$lang$maxFixedArity = 3;
  min_key.cljs$lang$applyTo = min_key__53066.cljs$lang$applyTo;
  return min_key
}();
cljs.core.partition_all = function() {
  var partition_all = null;
  var partition_all__53072 = function(n, coll) {
    return partition_all.call(null, n, n, coll)
  };
  var partition_all__53073 = function(n, step, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3698__auto____53070 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3698__auto____53070)) {
        var s__53071 = temp__3698__auto____53070;
        return cljs.core.cons.call(null, cljs.core.take.call(null, n, s__53071), partition_all.call(null, n, step, cljs.core.drop.call(null, step, s__53071)))
      }else {
        return null
      }
    })
  };
  partition_all = function(n, step, coll) {
    switch(arguments.length) {
      case 2:
        return partition_all__53072.call(this, n, step);
      case 3:
        return partition_all__53073.call(this, n, step, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return partition_all
}();
cljs.core.take_while = function take_while(pred, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3698__auto____53075 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3698__auto____53075)) {
      var s__53076 = temp__3698__auto____53075;
      if(cljs.core.truth_(pred.call(null, cljs.core.first.call(null, s__53076)))) {
        return cljs.core.cons.call(null, cljs.core.first.call(null, s__53076), take_while.call(null, pred, cljs.core.rest.call(null, s__53076)))
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
  var this__53077 = this;
  return cljs.core.hash_coll.call(null, rng)
};
cljs.core.Range.prototype.cljs$core$ISequential$ = true;
cljs.core.Range.prototype.cljs$core$ICollection$ = true;
cljs.core.Range.prototype.cljs$core$ICollection$_conj = function(rng, o) {
  var this__53078 = this;
  return cljs.core.cons.call(null, o, rng)
};
cljs.core.Range.prototype.cljs$core$IReduce$ = true;
cljs.core.Range.prototype.cljs$core$IReduce$_reduce = function() {
  var G__53094 = null;
  var G__53094__53095 = function(rng, f) {
    var this__53079 = this;
    return cljs.core.ci_reduce.call(null, rng, f)
  };
  var G__53094__53096 = function(rng, f, s) {
    var this__53080 = this;
    return cljs.core.ci_reduce.call(null, rng, f, s)
  };
  G__53094 = function(rng, f, s) {
    switch(arguments.length) {
      case 2:
        return G__53094__53095.call(this, rng, f);
      case 3:
        return G__53094__53096.call(this, rng, f, s)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__53094
}();
cljs.core.Range.prototype.cljs$core$ISeqable$ = true;
cljs.core.Range.prototype.cljs$core$ISeqable$_seq = function(rng) {
  var this__53081 = this;
  var comp__53082 = cljs.core.truth_(this__53081.step > 0) ? cljs.core._LT_ : cljs.core._GT_;
  if(cljs.core.truth_(comp__53082.call(null, this__53081.start, this__53081.end))) {
    return rng
  }else {
    return null
  }
};
cljs.core.Range.prototype.cljs$core$ICounted$ = true;
cljs.core.Range.prototype.cljs$core$ICounted$_count = function(rng) {
  var this__53083 = this;
  if(cljs.core.truth_(cljs.core.not.call(null, cljs.core._seq.call(null, rng)))) {
    return 0
  }else {
    return Math["ceil"].call(null, (this__53083.end - this__53083.start) / this__53083.step)
  }
};
cljs.core.Range.prototype.cljs$core$ISeq$ = true;
cljs.core.Range.prototype.cljs$core$ISeq$_first = function(rng) {
  var this__53084 = this;
  return this__53084.start
};
cljs.core.Range.prototype.cljs$core$ISeq$_rest = function(rng) {
  var this__53085 = this;
  if(cljs.core.truth_(cljs.core._seq.call(null, rng))) {
    return new cljs.core.Range(this__53085.meta, this__53085.start + this__53085.step, this__53085.end, this__53085.step)
  }else {
    return cljs.core.list.call(null)
  }
};
cljs.core.Range.prototype.cljs$core$IEquiv$ = true;
cljs.core.Range.prototype.cljs$core$IEquiv$_equiv = function(rng, other) {
  var this__53086 = this;
  return cljs.core.equiv_sequential.call(null, rng, other)
};
cljs.core.Range.prototype.cljs$core$IWithMeta$ = true;
cljs.core.Range.prototype.cljs$core$IWithMeta$_with_meta = function(rng, meta) {
  var this__53087 = this;
  return new cljs.core.Range(meta, this__53087.start, this__53087.end, this__53087.step)
};
cljs.core.Range.prototype.cljs$core$IMeta$ = true;
cljs.core.Range.prototype.cljs$core$IMeta$_meta = function(rng) {
  var this__53088 = this;
  return this__53088.meta
};
cljs.core.Range.prototype.cljs$core$IIndexed$ = true;
cljs.core.Range.prototype.cljs$core$IIndexed$_nth = function() {
  var G__53098 = null;
  var G__53098__53099 = function(rng, n) {
    var this__53089 = this;
    if(cljs.core.truth_(n < cljs.core._count.call(null, rng))) {
      return this__53089.start + n * this__53089.step
    }else {
      if(cljs.core.truth_(function() {
        var and__3546__auto____53090 = this__53089.start > this__53089.end;
        if(cljs.core.truth_(and__3546__auto____53090)) {
          return cljs.core._EQ_.call(null, this__53089.step, 0)
        }else {
          return and__3546__auto____53090
        }
      }())) {
        return this__53089.start
      }else {
        throw new Error("Index out of bounds");
      }
    }
  };
  var G__53098__53100 = function(rng, n, not_found) {
    var this__53091 = this;
    if(cljs.core.truth_(n < cljs.core._count.call(null, rng))) {
      return this__53091.start + n * this__53091.step
    }else {
      if(cljs.core.truth_(function() {
        var and__3546__auto____53092 = this__53091.start > this__53091.end;
        if(cljs.core.truth_(and__3546__auto____53092)) {
          return cljs.core._EQ_.call(null, this__53091.step, 0)
        }else {
          return and__3546__auto____53092
        }
      }())) {
        return this__53091.start
      }else {
        return not_found
      }
    }
  };
  G__53098 = function(rng, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__53098__53099.call(this, rng, n);
      case 3:
        return G__53098__53100.call(this, rng, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__53098
}();
cljs.core.Range.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.Range.prototype.cljs$core$IEmptyableCollection$_empty = function(rng) {
  var this__53093 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__53093.meta)
};
cljs.core.Range;
cljs.core.range = function() {
  var range = null;
  var range__53102 = function() {
    return range.call(null, 0, Number["MAX_VALUE"], 1)
  };
  var range__53103 = function(end) {
    return range.call(null, 0, end, 1)
  };
  var range__53104 = function(start, end) {
    return range.call(null, start, end, 1)
  };
  var range__53105 = function(start, end, step) {
    return new cljs.core.Range(null, start, end, step)
  };
  range = function(start, end, step) {
    switch(arguments.length) {
      case 0:
        return range__53102.call(this);
      case 1:
        return range__53103.call(this, start);
      case 2:
        return range__53104.call(this, start, end);
      case 3:
        return range__53105.call(this, start, end, step)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return range
}();
cljs.core.take_nth = function take_nth(n, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3698__auto____53107 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3698__auto____53107)) {
      var s__53108 = temp__3698__auto____53107;
      return cljs.core.cons.call(null, cljs.core.first.call(null, s__53108), take_nth.call(null, n, cljs.core.drop.call(null, n, s__53108)))
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
    var temp__3698__auto____53110 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3698__auto____53110)) {
      var s__53111 = temp__3698__auto____53110;
      var fst__53112 = cljs.core.first.call(null, s__53111);
      var fv__53113 = f.call(null, fst__53112);
      var run__53114 = cljs.core.cons.call(null, fst__53112, cljs.core.take_while.call(null, function(p1__53109_SHARP_) {
        return cljs.core._EQ_.call(null, fv__53113, f.call(null, p1__53109_SHARP_))
      }, cljs.core.next.call(null, s__53111)));
      return cljs.core.cons.call(null, run__53114, partition_by.call(null, f, cljs.core.seq.call(null, cljs.core.drop.call(null, cljs.core.count.call(null, run__53114), s__53111))))
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
  var reductions__53129 = function(f, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3695__auto____53125 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3695__auto____53125)) {
        var s__53126 = temp__3695__auto____53125;
        return reductions.call(null, f, cljs.core.first.call(null, s__53126), cljs.core.rest.call(null, s__53126))
      }else {
        return cljs.core.list.call(null, f.call(null))
      }
    })
  };
  var reductions__53130 = function(f, init, coll) {
    return cljs.core.cons.call(null, init, new cljs.core.LazySeq(null, false, function() {
      var temp__3698__auto____53127 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3698__auto____53127)) {
        var s__53128 = temp__3698__auto____53127;
        return reductions.call(null, f, f.call(null, init, cljs.core.first.call(null, s__53128)), cljs.core.rest.call(null, s__53128))
      }else {
        return null
      }
    }))
  };
  reductions = function(f, init, coll) {
    switch(arguments.length) {
      case 2:
        return reductions__53129.call(this, f, init);
      case 3:
        return reductions__53130.call(this, f, init, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return reductions
}();
cljs.core.juxt = function() {
  var juxt = null;
  var juxt__53133 = function(f) {
    return function() {
      var G__53138 = null;
      var G__53138__53139 = function() {
        return cljs.core.vector.call(null, f.call(null))
      };
      var G__53138__53140 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x))
      };
      var G__53138__53141 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y))
      };
      var G__53138__53142 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z))
      };
      var G__53138__53143 = function() {
        var G__53145__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args))
        };
        var G__53145 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__53145__delegate.call(this, x, y, z, args)
        };
        G__53145.cljs$lang$maxFixedArity = 3;
        G__53145.cljs$lang$applyTo = function(arglist__53146) {
          var x = cljs.core.first(arglist__53146);
          var y = cljs.core.first(cljs.core.next(arglist__53146));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__53146)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__53146)));
          return G__53145__delegate.call(this, x, y, z, args)
        };
        return G__53145
      }();
      G__53138 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__53138__53139.call(this);
          case 1:
            return G__53138__53140.call(this, x);
          case 2:
            return G__53138__53141.call(this, x, y);
          case 3:
            return G__53138__53142.call(this, x, y, z);
          default:
            return G__53138__53143.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__53138.cljs$lang$maxFixedArity = 3;
      G__53138.cljs$lang$applyTo = G__53138__53143.cljs$lang$applyTo;
      return G__53138
    }()
  };
  var juxt__53134 = function(f, g) {
    return function() {
      var G__53147 = null;
      var G__53147__53148 = function() {
        return cljs.core.vector.call(null, f.call(null), g.call(null))
      };
      var G__53147__53149 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x), g.call(null, x))
      };
      var G__53147__53150 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y), g.call(null, x, y))
      };
      var G__53147__53151 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z), g.call(null, x, y, z))
      };
      var G__53147__53152 = function() {
        var G__53154__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args), cljs.core.apply.call(null, g, x, y, z, args))
        };
        var G__53154 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__53154__delegate.call(this, x, y, z, args)
        };
        G__53154.cljs$lang$maxFixedArity = 3;
        G__53154.cljs$lang$applyTo = function(arglist__53155) {
          var x = cljs.core.first(arglist__53155);
          var y = cljs.core.first(cljs.core.next(arglist__53155));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__53155)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__53155)));
          return G__53154__delegate.call(this, x, y, z, args)
        };
        return G__53154
      }();
      G__53147 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__53147__53148.call(this);
          case 1:
            return G__53147__53149.call(this, x);
          case 2:
            return G__53147__53150.call(this, x, y);
          case 3:
            return G__53147__53151.call(this, x, y, z);
          default:
            return G__53147__53152.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__53147.cljs$lang$maxFixedArity = 3;
      G__53147.cljs$lang$applyTo = G__53147__53152.cljs$lang$applyTo;
      return G__53147
    }()
  };
  var juxt__53135 = function(f, g, h) {
    return function() {
      var G__53156 = null;
      var G__53156__53157 = function() {
        return cljs.core.vector.call(null, f.call(null), g.call(null), h.call(null))
      };
      var G__53156__53158 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x), g.call(null, x), h.call(null, x))
      };
      var G__53156__53159 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y), g.call(null, x, y), h.call(null, x, y))
      };
      var G__53156__53160 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z), g.call(null, x, y, z), h.call(null, x, y, z))
      };
      var G__53156__53161 = function() {
        var G__53163__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args), cljs.core.apply.call(null, g, x, y, z, args), cljs.core.apply.call(null, h, x, y, z, args))
        };
        var G__53163 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__53163__delegate.call(this, x, y, z, args)
        };
        G__53163.cljs$lang$maxFixedArity = 3;
        G__53163.cljs$lang$applyTo = function(arglist__53164) {
          var x = cljs.core.first(arglist__53164);
          var y = cljs.core.first(cljs.core.next(arglist__53164));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__53164)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__53164)));
          return G__53163__delegate.call(this, x, y, z, args)
        };
        return G__53163
      }();
      G__53156 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__53156__53157.call(this);
          case 1:
            return G__53156__53158.call(this, x);
          case 2:
            return G__53156__53159.call(this, x, y);
          case 3:
            return G__53156__53160.call(this, x, y, z);
          default:
            return G__53156__53161.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__53156.cljs$lang$maxFixedArity = 3;
      G__53156.cljs$lang$applyTo = G__53156__53161.cljs$lang$applyTo;
      return G__53156
    }()
  };
  var juxt__53136 = function() {
    var G__53165__delegate = function(f, g, h, fs) {
      var fs__53132 = cljs.core.list_STAR_.call(null, f, g, h, fs);
      return function() {
        var G__53166 = null;
        var G__53166__53167 = function() {
          return cljs.core.reduce.call(null, function(p1__53115_SHARP_, p2__53116_SHARP_) {
            return cljs.core.conj.call(null, p1__53115_SHARP_, p2__53116_SHARP_.call(null))
          }, cljs.core.PersistentVector.fromArray([]), fs__53132)
        };
        var G__53166__53168 = function(x) {
          return cljs.core.reduce.call(null, function(p1__53117_SHARP_, p2__53118_SHARP_) {
            return cljs.core.conj.call(null, p1__53117_SHARP_, p2__53118_SHARP_.call(null, x))
          }, cljs.core.PersistentVector.fromArray([]), fs__53132)
        };
        var G__53166__53169 = function(x, y) {
          return cljs.core.reduce.call(null, function(p1__53119_SHARP_, p2__53120_SHARP_) {
            return cljs.core.conj.call(null, p1__53119_SHARP_, p2__53120_SHARP_.call(null, x, y))
          }, cljs.core.PersistentVector.fromArray([]), fs__53132)
        };
        var G__53166__53170 = function(x, y, z) {
          return cljs.core.reduce.call(null, function(p1__53121_SHARP_, p2__53122_SHARP_) {
            return cljs.core.conj.call(null, p1__53121_SHARP_, p2__53122_SHARP_.call(null, x, y, z))
          }, cljs.core.PersistentVector.fromArray([]), fs__53132)
        };
        var G__53166__53171 = function() {
          var G__53173__delegate = function(x, y, z, args) {
            return cljs.core.reduce.call(null, function(p1__53123_SHARP_, p2__53124_SHARP_) {
              return cljs.core.conj.call(null, p1__53123_SHARP_, cljs.core.apply.call(null, p2__53124_SHARP_, x, y, z, args))
            }, cljs.core.PersistentVector.fromArray([]), fs__53132)
          };
          var G__53173 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__53173__delegate.call(this, x, y, z, args)
          };
          G__53173.cljs$lang$maxFixedArity = 3;
          G__53173.cljs$lang$applyTo = function(arglist__53174) {
            var x = cljs.core.first(arglist__53174);
            var y = cljs.core.first(cljs.core.next(arglist__53174));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__53174)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__53174)));
            return G__53173__delegate.call(this, x, y, z, args)
          };
          return G__53173
        }();
        G__53166 = function(x, y, z, var_args) {
          var args = var_args;
          switch(arguments.length) {
            case 0:
              return G__53166__53167.call(this);
            case 1:
              return G__53166__53168.call(this, x);
            case 2:
              return G__53166__53169.call(this, x, y);
            case 3:
              return G__53166__53170.call(this, x, y, z);
            default:
              return G__53166__53171.apply(this, arguments)
          }
          throw"Invalid arity: " + arguments.length;
        };
        G__53166.cljs$lang$maxFixedArity = 3;
        G__53166.cljs$lang$applyTo = G__53166__53171.cljs$lang$applyTo;
        return G__53166
      }()
    };
    var G__53165 = function(f, g, h, var_args) {
      var fs = null;
      if(goog.isDef(var_args)) {
        fs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__53165__delegate.call(this, f, g, h, fs)
    };
    G__53165.cljs$lang$maxFixedArity = 3;
    G__53165.cljs$lang$applyTo = function(arglist__53175) {
      var f = cljs.core.first(arglist__53175);
      var g = cljs.core.first(cljs.core.next(arglist__53175));
      var h = cljs.core.first(cljs.core.next(cljs.core.next(arglist__53175)));
      var fs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__53175)));
      return G__53165__delegate.call(this, f, g, h, fs)
    };
    return G__53165
  }();
  juxt = function(f, g, h, var_args) {
    var fs = var_args;
    switch(arguments.length) {
      case 1:
        return juxt__53133.call(this, f);
      case 2:
        return juxt__53134.call(this, f, g);
      case 3:
        return juxt__53135.call(this, f, g, h);
      default:
        return juxt__53136.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  juxt.cljs$lang$maxFixedArity = 3;
  juxt.cljs$lang$applyTo = juxt__53136.cljs$lang$applyTo;
  return juxt
}();
cljs.core.dorun = function() {
  var dorun = null;
  var dorun__53177 = function(coll) {
    while(true) {
      if(cljs.core.truth_(cljs.core.seq.call(null, coll))) {
        var G__53180 = cljs.core.next.call(null, coll);
        coll = G__53180;
        continue
      }else {
        return null
      }
      break
    }
  };
  var dorun__53178 = function(n, coll) {
    while(true) {
      if(cljs.core.truth_(function() {
        var and__3546__auto____53176 = cljs.core.seq.call(null, coll);
        if(cljs.core.truth_(and__3546__auto____53176)) {
          return n > 0
        }else {
          return and__3546__auto____53176
        }
      }())) {
        var G__53181 = n - 1;
        var G__53182 = cljs.core.next.call(null, coll);
        n = G__53181;
        coll = G__53182;
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
        return dorun__53177.call(this, n);
      case 2:
        return dorun__53178.call(this, n, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return dorun
}();
cljs.core.doall = function() {
  var doall = null;
  var doall__53183 = function(coll) {
    cljs.core.dorun.call(null, coll);
    return coll
  };
  var doall__53184 = function(n, coll) {
    cljs.core.dorun.call(null, n, coll);
    return coll
  };
  doall = function(n, coll) {
    switch(arguments.length) {
      case 1:
        return doall__53183.call(this, n);
      case 2:
        return doall__53184.call(this, n, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return doall
}();
cljs.core.re_matches = function re_matches(re, s) {
  var matches__53186 = re.exec(s);
  if(cljs.core.truth_(cljs.core._EQ_.call(null, cljs.core.first.call(null, matches__53186), s))) {
    if(cljs.core.truth_(cljs.core._EQ_.call(null, cljs.core.count.call(null, matches__53186), 1))) {
      return cljs.core.first.call(null, matches__53186)
    }else {
      return cljs.core.vec.call(null, matches__53186)
    }
  }else {
    return null
  }
};
cljs.core.re_find = function re_find(re, s) {
  var matches__53187 = re.exec(s);
  if(cljs.core.truth_(matches__53187 === null)) {
    return null
  }else {
    if(cljs.core.truth_(cljs.core._EQ_.call(null, cljs.core.count.call(null, matches__53187), 1))) {
      return cljs.core.first.call(null, matches__53187)
    }else {
      return cljs.core.vec.call(null, matches__53187)
    }
  }
};
cljs.core.re_seq = function re_seq(re, s) {
  var match_data__53188 = cljs.core.re_find.call(null, re, s);
  var match_idx__53189 = s.search(re);
  var match_str__53190 = cljs.core.truth_(cljs.core.coll_QMARK_.call(null, match_data__53188)) ? cljs.core.first.call(null, match_data__53188) : match_data__53188;
  var post_match__53191 = cljs.core.subs.call(null, s, match_idx__53189 + cljs.core.count.call(null, match_str__53190));
  if(cljs.core.truth_(match_data__53188)) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, match_data__53188, re_seq.call(null, re, post_match__53191))
    })
  }else {
    return null
  }
};
cljs.core.re_pattern = function re_pattern(s) {
  var vec__53193__53194 = cljs.core.re_find.call(null, /^(?:\(\?([idmsux]*)\))?(.*)/, s);
  var ___53195 = cljs.core.nth.call(null, vec__53193__53194, 0, null);
  var flags__53196 = cljs.core.nth.call(null, vec__53193__53194, 1, null);
  var pattern__53197 = cljs.core.nth.call(null, vec__53193__53194, 2, null);
  return new RegExp(pattern__53197, flags__53196)
};
cljs.core.pr_sequential = function pr_sequential(print_one, begin, sep, end, opts, coll) {
  return cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray([begin]), cljs.core.flatten1.call(null, cljs.core.interpose.call(null, cljs.core.PersistentVector.fromArray([sep]), cljs.core.map.call(null, function(p1__53192_SHARP_) {
    return print_one.call(null, p1__53192_SHARP_, opts)
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
          var and__3546__auto____53198 = cljs.core.get.call(null, opts, "\ufdd0'meta");
          if(cljs.core.truth_(and__3546__auto____53198)) {
            var and__3546__auto____53202 = function() {
              var x__451__auto____53199 = obj;
              if(cljs.core.truth_(function() {
                var and__3546__auto____53200 = x__451__auto____53199;
                if(cljs.core.truth_(and__3546__auto____53200)) {
                  var and__3546__auto____53201 = x__451__auto____53199.cljs$core$IMeta$;
                  if(cljs.core.truth_(and__3546__auto____53201)) {
                    return cljs.core.not.call(null, x__451__auto____53199.hasOwnProperty("cljs$core$IMeta$"))
                  }else {
                    return and__3546__auto____53201
                  }
                }else {
                  return and__3546__auto____53200
                }
              }())) {
                return true
              }else {
                return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, x__451__auto____53199)
              }
            }();
            if(cljs.core.truth_(and__3546__auto____53202)) {
              return cljs.core.meta.call(null, obj)
            }else {
              return and__3546__auto____53202
            }
          }else {
            return and__3546__auto____53198
          }
        }()) ? cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray(["^"]), pr_seq.call(null, cljs.core.meta.call(null, obj), opts), cljs.core.PersistentVector.fromArray([" "])) : null, cljs.core.truth_(function() {
          var x__451__auto____53203 = obj;
          if(cljs.core.truth_(function() {
            var and__3546__auto____53204 = x__451__auto____53203;
            if(cljs.core.truth_(and__3546__auto____53204)) {
              var and__3546__auto____53205 = x__451__auto____53203.cljs$core$IPrintable$;
              if(cljs.core.truth_(and__3546__auto____53205)) {
                return cljs.core.not.call(null, x__451__auto____53203.hasOwnProperty("cljs$core$IPrintable$"))
              }else {
                return and__3546__auto____53205
              }
            }else {
              return and__3546__auto____53204
            }
          }())) {
            return true
          }else {
            return cljs.core.type_satisfies_.call(null, cljs.core.IPrintable, x__451__auto____53203)
          }
        }()) ? cljs.core._pr_seq.call(null, obj, opts) : cljs.core.list.call(null, "#<", cljs.core.str.call(null, obj), ">"))
      }else {
        return null
      }
    }
  }
};
cljs.core.pr_sb = function pr_sb(objs, opts) {
  var first_obj__53206 = cljs.core.first.call(null, objs);
  var sb__53207 = new goog.string.StringBuffer;
  var G__53208__53209 = cljs.core.seq.call(null, objs);
  if(cljs.core.truth_(G__53208__53209)) {
    var obj__53210 = cljs.core.first.call(null, G__53208__53209);
    var G__53208__53211 = G__53208__53209;
    while(true) {
      if(cljs.core.truth_(obj__53210 === first_obj__53206)) {
      }else {
        sb__53207.append(" ")
      }
      var G__53212__53213 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, obj__53210, opts));
      if(cljs.core.truth_(G__53212__53213)) {
        var string__53214 = cljs.core.first.call(null, G__53212__53213);
        var G__53212__53215 = G__53212__53213;
        while(true) {
          sb__53207.append(string__53214);
          var temp__3698__auto____53216 = cljs.core.next.call(null, G__53212__53215);
          if(cljs.core.truth_(temp__3698__auto____53216)) {
            var G__53212__53217 = temp__3698__auto____53216;
            var G__53220 = cljs.core.first.call(null, G__53212__53217);
            var G__53221 = G__53212__53217;
            string__53214 = G__53220;
            G__53212__53215 = G__53221;
            continue
          }else {
          }
          break
        }
      }else {
      }
      var temp__3698__auto____53218 = cljs.core.next.call(null, G__53208__53211);
      if(cljs.core.truth_(temp__3698__auto____53218)) {
        var G__53208__53219 = temp__3698__auto____53218;
        var G__53222 = cljs.core.first.call(null, G__53208__53219);
        var G__53223 = G__53208__53219;
        obj__53210 = G__53222;
        G__53208__53211 = G__53223;
        continue
      }else {
      }
      break
    }
  }else {
  }
  return sb__53207
};
cljs.core.pr_str_with_opts = function pr_str_with_opts(objs, opts) {
  return cljs.core.str.call(null, cljs.core.pr_sb.call(null, objs, opts))
};
cljs.core.prn_str_with_opts = function prn_str_with_opts(objs, opts) {
  var sb__53224 = cljs.core.pr_sb.call(null, objs, opts);
  sb__53224.append("\n");
  return cljs.core.str.call(null, sb__53224)
};
cljs.core.pr_with_opts = function pr_with_opts(objs, opts) {
  var first_obj__53225 = cljs.core.first.call(null, objs);
  var G__53226__53227 = cljs.core.seq.call(null, objs);
  if(cljs.core.truth_(G__53226__53227)) {
    var obj__53228 = cljs.core.first.call(null, G__53226__53227);
    var G__53226__53229 = G__53226__53227;
    while(true) {
      if(cljs.core.truth_(obj__53228 === first_obj__53225)) {
      }else {
        cljs.core.string_print.call(null, " ")
      }
      var G__53230__53231 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, obj__53228, opts));
      if(cljs.core.truth_(G__53230__53231)) {
        var string__53232 = cljs.core.first.call(null, G__53230__53231);
        var G__53230__53233 = G__53230__53231;
        while(true) {
          cljs.core.string_print.call(null, string__53232);
          var temp__3698__auto____53234 = cljs.core.next.call(null, G__53230__53233);
          if(cljs.core.truth_(temp__3698__auto____53234)) {
            var G__53230__53235 = temp__3698__auto____53234;
            var G__53238 = cljs.core.first.call(null, G__53230__53235);
            var G__53239 = G__53230__53235;
            string__53232 = G__53238;
            G__53230__53233 = G__53239;
            continue
          }else {
          }
          break
        }
      }else {
      }
      var temp__3698__auto____53236 = cljs.core.next.call(null, G__53226__53229);
      if(cljs.core.truth_(temp__3698__auto____53236)) {
        var G__53226__53237 = temp__3698__auto____53236;
        var G__53240 = cljs.core.first.call(null, G__53226__53237);
        var G__53241 = G__53226__53237;
        obj__53228 = G__53240;
        G__53226__53229 = G__53241;
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
  pr_str.cljs$lang$applyTo = function(arglist__53242) {
    var objs = cljs.core.seq(arglist__53242);
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
  prn_str.cljs$lang$applyTo = function(arglist__53243) {
    var objs = cljs.core.seq(arglist__53243);
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
  pr.cljs$lang$applyTo = function(arglist__53244) {
    var objs = cljs.core.seq(arglist__53244);
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
  cljs_core_print.cljs$lang$applyTo = function(arglist__53245) {
    var objs = cljs.core.seq(arglist__53245);
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
  print_str.cljs$lang$applyTo = function(arglist__53246) {
    var objs = cljs.core.seq(arglist__53246);
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
  println.cljs$lang$applyTo = function(arglist__53247) {
    var objs = cljs.core.seq(arglist__53247);
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
  println_str.cljs$lang$applyTo = function(arglist__53248) {
    var objs = cljs.core.seq(arglist__53248);
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
  prn.cljs$lang$applyTo = function(arglist__53249) {
    var objs = cljs.core.seq(arglist__53249);
    return prn__delegate.call(this, objs)
  };
  return prn
}();
cljs.core.HashMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.HashMap.prototype.cljs$core$IPrintable$_pr_seq = function(coll, opts) {
  var pr_pair__53250 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__53250, "{", ", ", "}", opts, coll)
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
      var temp__3698__auto____53251 = cljs.core.namespace.call(null, obj);
      if(cljs.core.truth_(temp__3698__auto____53251)) {
        var nspc__53252 = temp__3698__auto____53251;
        return cljs.core.str.call(null, nspc__53252, "/")
      }else {
        return null
      }
    }(), cljs.core.name.call(null, obj)))
  }else {
    if(cljs.core.truth_(cljs.core.symbol_QMARK_.call(null, obj))) {
      return cljs.core.list.call(null, cljs.core.str.call(null, function() {
        var temp__3698__auto____53253 = cljs.core.namespace.call(null, obj);
        if(cljs.core.truth_(temp__3698__auto____53253)) {
          var nspc__53254 = temp__3698__auto____53253;
          return cljs.core.str.call(null, nspc__53254, "/")
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
  var pr_pair__53255 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__53255, "{", ", ", "}", opts, coll)
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
  var this__53256 = this;
  return goog.getUid.call(null, this$)
};
cljs.core.Atom.prototype.cljs$core$IWatchable$ = true;
cljs.core.Atom.prototype.cljs$core$IWatchable$_notify_watches = function(this$, oldval, newval) {
  var this__53257 = this;
  var G__53258__53259 = cljs.core.seq.call(null, this__53257.watches);
  if(cljs.core.truth_(G__53258__53259)) {
    var G__53261__53263 = cljs.core.first.call(null, G__53258__53259);
    var vec__53262__53264 = G__53261__53263;
    var key__53265 = cljs.core.nth.call(null, vec__53262__53264, 0, null);
    var f__53266 = cljs.core.nth.call(null, vec__53262__53264, 1, null);
    var G__53258__53267 = G__53258__53259;
    var G__53261__53268 = G__53261__53263;
    var G__53258__53269 = G__53258__53267;
    while(true) {
      var vec__53270__53271 = G__53261__53268;
      var key__53272 = cljs.core.nth.call(null, vec__53270__53271, 0, null);
      var f__53273 = cljs.core.nth.call(null, vec__53270__53271, 1, null);
      var G__53258__53274 = G__53258__53269;
      f__53273.call(null, key__53272, this$, oldval, newval);
      var temp__3698__auto____53275 = cljs.core.next.call(null, G__53258__53274);
      if(cljs.core.truth_(temp__3698__auto____53275)) {
        var G__53258__53276 = temp__3698__auto____53275;
        var G__53283 = cljs.core.first.call(null, G__53258__53276);
        var G__53284 = G__53258__53276;
        G__53261__53268 = G__53283;
        G__53258__53269 = G__53284;
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
  var this__53277 = this;
  return this$.watches = cljs.core.assoc.call(null, this__53277.watches, key, f)
};
cljs.core.Atom.prototype.cljs$core$IWatchable$_remove_watch = function(this$, key) {
  var this__53278 = this;
  return this$.watches = cljs.core.dissoc.call(null, this__53278.watches, key)
};
cljs.core.Atom.prototype.cljs$core$IPrintable$ = true;
cljs.core.Atom.prototype.cljs$core$IPrintable$_pr_seq = function(a, opts) {
  var this__53279 = this;
  return cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray(["#<Atom: "]), cljs.core._pr_seq.call(null, this__53279.state, opts), ">")
};
cljs.core.Atom.prototype.cljs$core$IMeta$ = true;
cljs.core.Atom.prototype.cljs$core$IMeta$_meta = function(_) {
  var this__53280 = this;
  return this__53280.meta
};
cljs.core.Atom.prototype.cljs$core$IDeref$ = true;
cljs.core.Atom.prototype.cljs$core$IDeref$_deref = function(_) {
  var this__53281 = this;
  return this__53281.state
};
cljs.core.Atom.prototype.cljs$core$IEquiv$ = true;
cljs.core.Atom.prototype.cljs$core$IEquiv$_equiv = function(o, other) {
  var this__53282 = this;
  return o === other
};
cljs.core.Atom;
cljs.core.atom = function() {
  var atom = null;
  var atom__53291 = function(x) {
    return new cljs.core.Atom(x, null, null, null)
  };
  var atom__53292 = function() {
    var G__53294__delegate = function(x, p__53285) {
      var map__53286__53287 = p__53285;
      var map__53286__53288 = cljs.core.truth_(cljs.core.seq_QMARK_.call(null, map__53286__53287)) ? cljs.core.apply.call(null, cljs.core.hash_map, map__53286__53287) : map__53286__53287;
      var validator__53289 = cljs.core.get.call(null, map__53286__53288, "\ufdd0'validator");
      var meta__53290 = cljs.core.get.call(null, map__53286__53288, "\ufdd0'meta");
      return new cljs.core.Atom(x, meta__53290, validator__53289, null)
    };
    var G__53294 = function(x, var_args) {
      var p__53285 = null;
      if(goog.isDef(var_args)) {
        p__53285 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__53294__delegate.call(this, x, p__53285)
    };
    G__53294.cljs$lang$maxFixedArity = 1;
    G__53294.cljs$lang$applyTo = function(arglist__53295) {
      var x = cljs.core.first(arglist__53295);
      var p__53285 = cljs.core.rest(arglist__53295);
      return G__53294__delegate.call(this, x, p__53285)
    };
    return G__53294
  }();
  atom = function(x, var_args) {
    var p__53285 = var_args;
    switch(arguments.length) {
      case 1:
        return atom__53291.call(this, x);
      default:
        return atom__53292.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  atom.cljs$lang$maxFixedArity = 1;
  atom.cljs$lang$applyTo = atom__53292.cljs$lang$applyTo;
  return atom
}();
cljs.core.reset_BANG_ = function reset_BANG_(a, new_value) {
  var temp__3698__auto____53296 = a.validator;
  if(cljs.core.truth_(temp__3698__auto____53296)) {
    var validate__53297 = temp__3698__auto____53296;
    if(cljs.core.truth_(validate__53297.call(null, new_value))) {
    }else {
      throw new Error(cljs.core.str.call(null, "Assert failed: ", "Validator rejected reference state", "\n", cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'validate", "\ufdd1'new-value"), cljs.core.hash_map("\ufdd0'line", 3282)))));
    }
  }else {
  }
  var old_value__53298 = a.state;
  a.state = new_value;
  cljs.core._notify_watches.call(null, a, old_value__53298, new_value);
  return new_value
};
cljs.core.swap_BANG_ = function() {
  var swap_BANG_ = null;
  var swap_BANG___53299 = function(a, f) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state))
  };
  var swap_BANG___53300 = function(a, f, x) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state, x))
  };
  var swap_BANG___53301 = function(a, f, x, y) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state, x, y))
  };
  var swap_BANG___53302 = function(a, f, x, y, z) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state, x, y, z))
  };
  var swap_BANG___53303 = function() {
    var G__53305__delegate = function(a, f, x, y, z, more) {
      return cljs.core.reset_BANG_.call(null, a, cljs.core.apply.call(null, f, a.state, x, y, z, more))
    };
    var G__53305 = function(a, f, x, y, z, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 5), 0)
      }
      return G__53305__delegate.call(this, a, f, x, y, z, more)
    };
    G__53305.cljs$lang$maxFixedArity = 5;
    G__53305.cljs$lang$applyTo = function(arglist__53306) {
      var a = cljs.core.first(arglist__53306);
      var f = cljs.core.first(cljs.core.next(arglist__53306));
      var x = cljs.core.first(cljs.core.next(cljs.core.next(arglist__53306)));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__53306))));
      var z = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__53306)))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__53306)))));
      return G__53305__delegate.call(this, a, f, x, y, z, more)
    };
    return G__53305
  }();
  swap_BANG_ = function(a, f, x, y, z, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return swap_BANG___53299.call(this, a, f);
      case 3:
        return swap_BANG___53300.call(this, a, f, x);
      case 4:
        return swap_BANG___53301.call(this, a, f, x, y);
      case 5:
        return swap_BANG___53302.call(this, a, f, x, y, z);
      default:
        return swap_BANG___53303.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  swap_BANG_.cljs$lang$maxFixedArity = 5;
  swap_BANG_.cljs$lang$applyTo = swap_BANG___53303.cljs$lang$applyTo;
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
  alter_meta_BANG_.cljs$lang$applyTo = function(arglist__53307) {
    var iref = cljs.core.first(arglist__53307);
    var f = cljs.core.first(cljs.core.next(arglist__53307));
    var args = cljs.core.rest(cljs.core.next(arglist__53307));
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
  var gensym__53308 = function() {
    return gensym.call(null, "G__")
  };
  var gensym__53309 = function(prefix_string) {
    if(cljs.core.truth_(cljs.core.gensym_counter === null)) {
      cljs.core.gensym_counter = cljs.core.atom.call(null, 0)
    }else {
    }
    return cljs.core.symbol.call(null, cljs.core.str.call(null, prefix_string, cljs.core.swap_BANG_.call(null, cljs.core.gensym_counter, cljs.core.inc)))
  };
  gensym = function(prefix_string) {
    switch(arguments.length) {
      case 0:
        return gensym__53308.call(this);
      case 1:
        return gensym__53309.call(this, prefix_string)
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
  var this__53311 = this;
  return"\ufdd0'done".call(null, cljs.core.deref.call(null, this__53311.state))
};
cljs.core.Delay.prototype.cljs$core$IDeref$ = true;
cljs.core.Delay.prototype.cljs$core$IDeref$_deref = function(_) {
  var this__53312 = this;
  return"\ufdd0'value".call(null, cljs.core.swap_BANG_.call(null, this__53312.state, function(p__53313) {
    var curr_state__53314 = p__53313;
    var curr_state__53315 = cljs.core.truth_(cljs.core.seq_QMARK_.call(null, curr_state__53314)) ? cljs.core.apply.call(null, cljs.core.hash_map, curr_state__53314) : curr_state__53314;
    var done__53316 = cljs.core.get.call(null, curr_state__53315, "\ufdd0'done");
    if(cljs.core.truth_(done__53316)) {
      return curr_state__53315
    }else {
      return cljs.core.ObjMap.fromObject(["\ufdd0'done", "\ufdd0'value"], {"\ufdd0'done":true, "\ufdd0'value":this__53312.f.call(null)})
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
    var map__53317__53318 = options;
    var map__53317__53319 = cljs.core.truth_(cljs.core.seq_QMARK_.call(null, map__53317__53318)) ? cljs.core.apply.call(null, cljs.core.hash_map, map__53317__53318) : map__53317__53318;
    var keywordize_keys__53320 = cljs.core.get.call(null, map__53317__53319, "\ufdd0'keywordize-keys");
    var keyfn__53321 = cljs.core.truth_(keywordize_keys__53320) ? cljs.core.keyword : cljs.core.str;
    var f__53327 = function thisfn(x) {
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
                var iter__520__auto____53326 = function iter__53322(s__53323) {
                  return new cljs.core.LazySeq(null, false, function() {
                    var s__53323__53324 = s__53323;
                    while(true) {
                      if(cljs.core.truth_(cljs.core.seq.call(null, s__53323__53324))) {
                        var k__53325 = cljs.core.first.call(null, s__53323__53324);
                        return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([keyfn__53321.call(null, k__53325), thisfn.call(null, x[k__53325])]), iter__53322.call(null, cljs.core.rest.call(null, s__53323__53324)))
                      }else {
                        return null
                      }
                      break
                    }
                  })
                };
                return iter__520__auto____53326.call(null, cljs.core.js_keys.call(null, x))
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
    return f__53327.call(null, x)
  };
  var js__GT_clj = function(x, var_args) {
    var options = null;
    if(goog.isDef(var_args)) {
      options = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return js__GT_clj__delegate.call(this, x, options)
  };
  js__GT_clj.cljs$lang$maxFixedArity = 1;
  js__GT_clj.cljs$lang$applyTo = function(arglist__53328) {
    var x = cljs.core.first(arglist__53328);
    var options = cljs.core.rest(arglist__53328);
    return js__GT_clj__delegate.call(this, x, options)
  };
  return js__GT_clj
}();
cljs.core.memoize = function memoize(f) {
  var mem__53329 = cljs.core.atom.call(null, cljs.core.ObjMap.fromObject([], {}));
  return function() {
    var G__53333__delegate = function(args) {
      var temp__3695__auto____53330 = cljs.core.get.call(null, cljs.core.deref.call(null, mem__53329), args);
      if(cljs.core.truth_(temp__3695__auto____53330)) {
        var v__53331 = temp__3695__auto____53330;
        return v__53331
      }else {
        var ret__53332 = cljs.core.apply.call(null, f, args);
        cljs.core.swap_BANG_.call(null, mem__53329, cljs.core.assoc, args, ret__53332);
        return ret__53332
      }
    };
    var G__53333 = function(var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__53333__delegate.call(this, args)
    };
    G__53333.cljs$lang$maxFixedArity = 0;
    G__53333.cljs$lang$applyTo = function(arglist__53334) {
      var args = cljs.core.seq(arglist__53334);
      return G__53333__delegate.call(this, args)
    };
    return G__53333
  }()
};
cljs.core.trampoline = function() {
  var trampoline = null;
  var trampoline__53336 = function(f) {
    while(true) {
      var ret__53335 = f.call(null);
      if(cljs.core.truth_(cljs.core.fn_QMARK_.call(null, ret__53335))) {
        var G__53339 = ret__53335;
        f = G__53339;
        continue
      }else {
        return ret__53335
      }
      break
    }
  };
  var trampoline__53337 = function() {
    var G__53340__delegate = function(f, args) {
      return trampoline.call(null, function() {
        return cljs.core.apply.call(null, f, args)
      })
    };
    var G__53340 = function(f, var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__53340__delegate.call(this, f, args)
    };
    G__53340.cljs$lang$maxFixedArity = 1;
    G__53340.cljs$lang$applyTo = function(arglist__53341) {
      var f = cljs.core.first(arglist__53341);
      var args = cljs.core.rest(arglist__53341);
      return G__53340__delegate.call(this, f, args)
    };
    return G__53340
  }();
  trampoline = function(f, var_args) {
    var args = var_args;
    switch(arguments.length) {
      case 1:
        return trampoline__53336.call(this, f);
      default:
        return trampoline__53337.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  trampoline.cljs$lang$maxFixedArity = 1;
  trampoline.cljs$lang$applyTo = trampoline__53337.cljs$lang$applyTo;
  return trampoline
}();
cljs.core.rand = function() {
  var rand = null;
  var rand__53342 = function() {
    return rand.call(null, 1)
  };
  var rand__53343 = function(n) {
    return Math.random() * n
  };
  rand = function(n) {
    switch(arguments.length) {
      case 0:
        return rand__53342.call(this);
      case 1:
        return rand__53343.call(this, n)
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
    var k__53345 = f.call(null, x);
    return cljs.core.assoc.call(null, ret, k__53345, cljs.core.conj.call(null, cljs.core.get.call(null, ret, k__53345, cljs.core.PersistentVector.fromArray([])), x))
  }, cljs.core.ObjMap.fromObject([], {}), coll)
};
cljs.core.make_hierarchy = function make_hierarchy() {
  return cljs.core.ObjMap.fromObject(["\ufdd0'parents", "\ufdd0'descendants", "\ufdd0'ancestors"], {"\ufdd0'parents":cljs.core.ObjMap.fromObject([], {}), "\ufdd0'descendants":cljs.core.ObjMap.fromObject([], {}), "\ufdd0'ancestors":cljs.core.ObjMap.fromObject([], {})})
};
cljs.core.global_hierarchy = cljs.core.atom.call(null, cljs.core.make_hierarchy.call(null));
cljs.core.isa_QMARK_ = function() {
  var isa_QMARK_ = null;
  var isa_QMARK___53354 = function(child, parent) {
    return isa_QMARK_.call(null, cljs.core.deref.call(null, cljs.core.global_hierarchy), child, parent)
  };
  var isa_QMARK___53355 = function(h, child, parent) {
    var or__3548__auto____53346 = cljs.core._EQ_.call(null, child, parent);
    if(cljs.core.truth_(or__3548__auto____53346)) {
      return or__3548__auto____53346
    }else {
      var or__3548__auto____53347 = cljs.core.contains_QMARK_.call(null, "\ufdd0'ancestors".call(null, h).call(null, child), parent);
      if(cljs.core.truth_(or__3548__auto____53347)) {
        return or__3548__auto____53347
      }else {
        var and__3546__auto____53348 = cljs.core.vector_QMARK_.call(null, parent);
        if(cljs.core.truth_(and__3546__auto____53348)) {
          var and__3546__auto____53349 = cljs.core.vector_QMARK_.call(null, child);
          if(cljs.core.truth_(and__3546__auto____53349)) {
            var and__3546__auto____53350 = cljs.core._EQ_.call(null, cljs.core.count.call(null, parent), cljs.core.count.call(null, child));
            if(cljs.core.truth_(and__3546__auto____53350)) {
              var ret__53351 = true;
              var i__53352 = 0;
              while(true) {
                if(cljs.core.truth_(function() {
                  var or__3548__auto____53353 = cljs.core.not.call(null, ret__53351);
                  if(cljs.core.truth_(or__3548__auto____53353)) {
                    return or__3548__auto____53353
                  }else {
                    return cljs.core._EQ_.call(null, i__53352, cljs.core.count.call(null, parent))
                  }
                }())) {
                  return ret__53351
                }else {
                  var G__53357 = isa_QMARK_.call(null, h, child.call(null, i__53352), parent.call(null, i__53352));
                  var G__53358 = i__53352 + 1;
                  ret__53351 = G__53357;
                  i__53352 = G__53358;
                  continue
                }
                break
              }
            }else {
              return and__3546__auto____53350
            }
          }else {
            return and__3546__auto____53349
          }
        }else {
          return and__3546__auto____53348
        }
      }
    }
  };
  isa_QMARK_ = function(h, child, parent) {
    switch(arguments.length) {
      case 2:
        return isa_QMARK___53354.call(this, h, child);
      case 3:
        return isa_QMARK___53355.call(this, h, child, parent)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return isa_QMARK_
}();
cljs.core.parents = function() {
  var parents = null;
  var parents__53359 = function(tag) {
    return parents.call(null, cljs.core.deref.call(null, cljs.core.global_hierarchy), tag)
  };
  var parents__53360 = function(h, tag) {
    return cljs.core.not_empty.call(null, cljs.core.get.call(null, "\ufdd0'parents".call(null, h), tag))
  };
  parents = function(h, tag) {
    switch(arguments.length) {
      case 1:
        return parents__53359.call(this, h);
      case 2:
        return parents__53360.call(this, h, tag)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return parents
}();
cljs.core.ancestors = function() {
  var ancestors = null;
  var ancestors__53362 = function(tag) {
    return ancestors.call(null, cljs.core.deref.call(null, cljs.core.global_hierarchy), tag)
  };
  var ancestors__53363 = function(h, tag) {
    return cljs.core.not_empty.call(null, cljs.core.get.call(null, "\ufdd0'ancestors".call(null, h), tag))
  };
  ancestors = function(h, tag) {
    switch(arguments.length) {
      case 1:
        return ancestors__53362.call(this, h);
      case 2:
        return ancestors__53363.call(this, h, tag)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return ancestors
}();
cljs.core.descendants = function() {
  var descendants = null;
  var descendants__53365 = function(tag) {
    return descendants.call(null, cljs.core.deref.call(null, cljs.core.global_hierarchy), tag)
  };
  var descendants__53366 = function(h, tag) {
    return cljs.core.not_empty.call(null, cljs.core.get.call(null, "\ufdd0'descendants".call(null, h), tag))
  };
  descendants = function(h, tag) {
    switch(arguments.length) {
      case 1:
        return descendants__53365.call(this, h);
      case 2:
        return descendants__53366.call(this, h, tag)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return descendants
}();
cljs.core.derive = function() {
  var derive = null;
  var derive__53376 = function(tag, parent) {
    if(cljs.core.truth_(cljs.core.namespace.call(null, parent))) {
    }else {
      throw new Error(cljs.core.str.call(null, "Assert failed: ", cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'namespace", "\ufdd1'parent"), cljs.core.hash_map("\ufdd0'line", 3566)))));
    }
    cljs.core.swap_BANG_.call(null, cljs.core.global_hierarchy, derive, tag, parent);
    return null
  };
  var derive__53377 = function(h, tag, parent) {
    if(cljs.core.truth_(cljs.core.not_EQ_.call(null, tag, parent))) {
    }else {
      throw new Error(cljs.core.str.call(null, "Assert failed: ", cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'not=", "\ufdd1'tag", "\ufdd1'parent"), cljs.core.hash_map("\ufdd0'line", 3570)))));
    }
    var tp__53371 = "\ufdd0'parents".call(null, h);
    var td__53372 = "\ufdd0'descendants".call(null, h);
    var ta__53373 = "\ufdd0'ancestors".call(null, h);
    var tf__53374 = function(m, source, sources, target, targets) {
      return cljs.core.reduce.call(null, function(ret, k) {
        return cljs.core.assoc.call(null, ret, k, cljs.core.reduce.call(null, cljs.core.conj, cljs.core.get.call(null, targets, k, cljs.core.set([])), cljs.core.cons.call(null, target, targets.call(null, target))))
      }, m, cljs.core.cons.call(null, source, sources.call(null, source)))
    };
    var or__3548__auto____53375 = cljs.core.truth_(cljs.core.contains_QMARK_.call(null, tp__53371.call(null, tag), parent)) ? null : function() {
      if(cljs.core.truth_(cljs.core.contains_QMARK_.call(null, ta__53373.call(null, tag), parent))) {
        throw new Error(cljs.core.str.call(null, tag, "already has", parent, "as ancestor"));
      }else {
      }
      if(cljs.core.truth_(cljs.core.contains_QMARK_.call(null, ta__53373.call(null, parent), tag))) {
        throw new Error(cljs.core.str.call(null, "Cyclic derivation:", parent, "has", tag, "as ancestor"));
      }else {
      }
      return cljs.core.ObjMap.fromObject(["\ufdd0'parents", "\ufdd0'ancestors", "\ufdd0'descendants"], {"\ufdd0'parents":cljs.core.assoc.call(null, "\ufdd0'parents".call(null, h), tag, cljs.core.conj.call(null, cljs.core.get.call(null, tp__53371, tag, cljs.core.set([])), parent)), "\ufdd0'ancestors":tf__53374.call(null, "\ufdd0'ancestors".call(null, h), tag, td__53372, parent, ta__53373), "\ufdd0'descendants":tf__53374.call(null, "\ufdd0'descendants".call(null, h), parent, ta__53373, tag, td__53372)})
    }();
    if(cljs.core.truth_(or__3548__auto____53375)) {
      return or__3548__auto____53375
    }else {
      return h
    }
  };
  derive = function(h, tag, parent) {
    switch(arguments.length) {
      case 2:
        return derive__53376.call(this, h, tag);
      case 3:
        return derive__53377.call(this, h, tag, parent)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return derive
}();
cljs.core.underive = function() {
  var underive = null;
  var underive__53383 = function(tag, parent) {
    cljs.core.swap_BANG_.call(null, cljs.core.global_hierarchy, underive, tag, parent);
    return null
  };
  var underive__53384 = function(h, tag, parent) {
    var parentMap__53379 = "\ufdd0'parents".call(null, h);
    var childsParents__53380 = cljs.core.truth_(parentMap__53379.call(null, tag)) ? cljs.core.disj.call(null, parentMap__53379.call(null, tag), parent) : cljs.core.set([]);
    var newParents__53381 = cljs.core.truth_(cljs.core.not_empty.call(null, childsParents__53380)) ? cljs.core.assoc.call(null, parentMap__53379, tag, childsParents__53380) : cljs.core.dissoc.call(null, parentMap__53379, tag);
    var deriv_seq__53382 = cljs.core.flatten.call(null, cljs.core.map.call(null, function(p1__53368_SHARP_) {
      return cljs.core.cons.call(null, cljs.core.first.call(null, p1__53368_SHARP_), cljs.core.interpose.call(null, cljs.core.first.call(null, p1__53368_SHARP_), cljs.core.second.call(null, p1__53368_SHARP_)))
    }, cljs.core.seq.call(null, newParents__53381)));
    if(cljs.core.truth_(cljs.core.contains_QMARK_.call(null, parentMap__53379.call(null, tag), parent))) {
      return cljs.core.reduce.call(null, function(p1__53369_SHARP_, p2__53370_SHARP_) {
        return cljs.core.apply.call(null, cljs.core.derive, p1__53369_SHARP_, p2__53370_SHARP_)
      }, cljs.core.make_hierarchy.call(null), cljs.core.partition.call(null, 2, deriv_seq__53382))
    }else {
      return h
    }
  };
  underive = function(h, tag, parent) {
    switch(arguments.length) {
      case 2:
        return underive__53383.call(this, h, tag);
      case 3:
        return underive__53384.call(this, h, tag, parent)
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
  var xprefs__53386 = cljs.core.deref.call(null, prefer_table).call(null, x);
  var or__3548__auto____53388 = cljs.core.truth_(function() {
    var and__3546__auto____53387 = xprefs__53386;
    if(cljs.core.truth_(and__3546__auto____53387)) {
      return xprefs__53386.call(null, y)
    }else {
      return and__3546__auto____53387
    }
  }()) ? true : null;
  if(cljs.core.truth_(or__3548__auto____53388)) {
    return or__3548__auto____53388
  }else {
    var or__3548__auto____53390 = function() {
      var ps__53389 = cljs.core.parents.call(null, y);
      while(true) {
        if(cljs.core.truth_(cljs.core.count.call(null, ps__53389) > 0)) {
          if(cljs.core.truth_(prefers_STAR_.call(null, x, cljs.core.first.call(null, ps__53389), prefer_table))) {
          }else {
          }
          var G__53393 = cljs.core.rest.call(null, ps__53389);
          ps__53389 = G__53393;
          continue
        }else {
          return null
        }
        break
      }
    }();
    if(cljs.core.truth_(or__3548__auto____53390)) {
      return or__3548__auto____53390
    }else {
      var or__3548__auto____53392 = function() {
        var ps__53391 = cljs.core.parents.call(null, x);
        while(true) {
          if(cljs.core.truth_(cljs.core.count.call(null, ps__53391) > 0)) {
            if(cljs.core.truth_(prefers_STAR_.call(null, cljs.core.first.call(null, ps__53391), y, prefer_table))) {
            }else {
            }
            var G__53394 = cljs.core.rest.call(null, ps__53391);
            ps__53391 = G__53394;
            continue
          }else {
            return null
          }
          break
        }
      }();
      if(cljs.core.truth_(or__3548__auto____53392)) {
        return or__3548__auto____53392
      }else {
        return false
      }
    }
  }
};
cljs.core.dominates = function dominates(x, y, prefer_table) {
  var or__3548__auto____53395 = cljs.core.prefers_STAR_.call(null, x, y, prefer_table);
  if(cljs.core.truth_(or__3548__auto____53395)) {
    return or__3548__auto____53395
  }else {
    return cljs.core.isa_QMARK_.call(null, x, y)
  }
};
cljs.core.find_and_cache_best_method = function find_and_cache_best_method(name, dispatch_val, hierarchy, method_table, prefer_table, method_cache, cached_hierarchy) {
  var best_entry__53404 = cljs.core.reduce.call(null, function(be, p__53396) {
    var vec__53397__53398 = p__53396;
    var k__53399 = cljs.core.nth.call(null, vec__53397__53398, 0, null);
    var ___53400 = cljs.core.nth.call(null, vec__53397__53398, 1, null);
    var e__53401 = vec__53397__53398;
    if(cljs.core.truth_(cljs.core.isa_QMARK_.call(null, dispatch_val, k__53399))) {
      var be2__53403 = cljs.core.truth_(function() {
        var or__3548__auto____53402 = be === null;
        if(cljs.core.truth_(or__3548__auto____53402)) {
          return or__3548__auto____53402
        }else {
          return cljs.core.dominates.call(null, k__53399, cljs.core.first.call(null, be), prefer_table)
        }
      }()) ? e__53401 : be;
      if(cljs.core.truth_(cljs.core.dominates.call(null, cljs.core.first.call(null, be2__53403), k__53399, prefer_table))) {
      }else {
        throw new Error(cljs.core.str.call(null, "Multiple methods in multimethod '", name, "' match dispatch value: ", dispatch_val, " -> ", k__53399, " and ", cljs.core.first.call(null, be2__53403), ", and neither is preferred"));
      }
      return be2__53403
    }else {
      return be
    }
  }, null, cljs.core.deref.call(null, method_table));
  if(cljs.core.truth_(best_entry__53404)) {
    if(cljs.core.truth_(cljs.core._EQ_.call(null, cljs.core.deref.call(null, cached_hierarchy), cljs.core.deref.call(null, hierarchy)))) {
      cljs.core.swap_BANG_.call(null, method_cache, cljs.core.assoc, dispatch_val, cljs.core.second.call(null, best_entry__53404));
      return cljs.core.second.call(null, best_entry__53404)
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
    var and__3546__auto____53405 = mf;
    if(cljs.core.truth_(and__3546__auto____53405)) {
      return mf.cljs$core$IMultiFn$_reset
    }else {
      return and__3546__auto____53405
    }
  }())) {
    return mf.cljs$core$IMultiFn$_reset(mf)
  }else {
    return function() {
      var or__3548__auto____53406 = cljs.core._reset[goog.typeOf.call(null, mf)];
      if(cljs.core.truth_(or__3548__auto____53406)) {
        return or__3548__auto____53406
      }else {
        var or__3548__auto____53407 = cljs.core._reset["_"];
        if(cljs.core.truth_(or__3548__auto____53407)) {
          return or__3548__auto____53407
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-reset", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._add_method = function _add_method(mf, dispatch_val, method) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____53408 = mf;
    if(cljs.core.truth_(and__3546__auto____53408)) {
      return mf.cljs$core$IMultiFn$_add_method
    }else {
      return and__3546__auto____53408
    }
  }())) {
    return mf.cljs$core$IMultiFn$_add_method(mf, dispatch_val, method)
  }else {
    return function() {
      var or__3548__auto____53409 = cljs.core._add_method[goog.typeOf.call(null, mf)];
      if(cljs.core.truth_(or__3548__auto____53409)) {
        return or__3548__auto____53409
      }else {
        var or__3548__auto____53410 = cljs.core._add_method["_"];
        if(cljs.core.truth_(or__3548__auto____53410)) {
          return or__3548__auto____53410
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-add-method", mf);
        }
      }
    }().call(null, mf, dispatch_val, method)
  }
};
cljs.core._remove_method = function _remove_method(mf, dispatch_val) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____53411 = mf;
    if(cljs.core.truth_(and__3546__auto____53411)) {
      return mf.cljs$core$IMultiFn$_remove_method
    }else {
      return and__3546__auto____53411
    }
  }())) {
    return mf.cljs$core$IMultiFn$_remove_method(mf, dispatch_val)
  }else {
    return function() {
      var or__3548__auto____53412 = cljs.core._remove_method[goog.typeOf.call(null, mf)];
      if(cljs.core.truth_(or__3548__auto____53412)) {
        return or__3548__auto____53412
      }else {
        var or__3548__auto____53413 = cljs.core._remove_method["_"];
        if(cljs.core.truth_(or__3548__auto____53413)) {
          return or__3548__auto____53413
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-remove-method", mf);
        }
      }
    }().call(null, mf, dispatch_val)
  }
};
cljs.core._prefer_method = function _prefer_method(mf, dispatch_val, dispatch_val_y) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____53414 = mf;
    if(cljs.core.truth_(and__3546__auto____53414)) {
      return mf.cljs$core$IMultiFn$_prefer_method
    }else {
      return and__3546__auto____53414
    }
  }())) {
    return mf.cljs$core$IMultiFn$_prefer_method(mf, dispatch_val, dispatch_val_y)
  }else {
    return function() {
      var or__3548__auto____53415 = cljs.core._prefer_method[goog.typeOf.call(null, mf)];
      if(cljs.core.truth_(or__3548__auto____53415)) {
        return or__3548__auto____53415
      }else {
        var or__3548__auto____53416 = cljs.core._prefer_method["_"];
        if(cljs.core.truth_(or__3548__auto____53416)) {
          return or__3548__auto____53416
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-prefer-method", mf);
        }
      }
    }().call(null, mf, dispatch_val, dispatch_val_y)
  }
};
cljs.core._get_method = function _get_method(mf, dispatch_val) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____53417 = mf;
    if(cljs.core.truth_(and__3546__auto____53417)) {
      return mf.cljs$core$IMultiFn$_get_method
    }else {
      return and__3546__auto____53417
    }
  }())) {
    return mf.cljs$core$IMultiFn$_get_method(mf, dispatch_val)
  }else {
    return function() {
      var or__3548__auto____53418 = cljs.core._get_method[goog.typeOf.call(null, mf)];
      if(cljs.core.truth_(or__3548__auto____53418)) {
        return or__3548__auto____53418
      }else {
        var or__3548__auto____53419 = cljs.core._get_method["_"];
        if(cljs.core.truth_(or__3548__auto____53419)) {
          return or__3548__auto____53419
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-get-method", mf);
        }
      }
    }().call(null, mf, dispatch_val)
  }
};
cljs.core._methods = function _methods(mf) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____53420 = mf;
    if(cljs.core.truth_(and__3546__auto____53420)) {
      return mf.cljs$core$IMultiFn$_methods
    }else {
      return and__3546__auto____53420
    }
  }())) {
    return mf.cljs$core$IMultiFn$_methods(mf)
  }else {
    return function() {
      var or__3548__auto____53421 = cljs.core._methods[goog.typeOf.call(null, mf)];
      if(cljs.core.truth_(or__3548__auto____53421)) {
        return or__3548__auto____53421
      }else {
        var or__3548__auto____53422 = cljs.core._methods["_"];
        if(cljs.core.truth_(or__3548__auto____53422)) {
          return or__3548__auto____53422
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-methods", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._prefers = function _prefers(mf) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____53423 = mf;
    if(cljs.core.truth_(and__3546__auto____53423)) {
      return mf.cljs$core$IMultiFn$_prefers
    }else {
      return and__3546__auto____53423
    }
  }())) {
    return mf.cljs$core$IMultiFn$_prefers(mf)
  }else {
    return function() {
      var or__3548__auto____53424 = cljs.core._prefers[goog.typeOf.call(null, mf)];
      if(cljs.core.truth_(or__3548__auto____53424)) {
        return or__3548__auto____53424
      }else {
        var or__3548__auto____53425 = cljs.core._prefers["_"];
        if(cljs.core.truth_(or__3548__auto____53425)) {
          return or__3548__auto____53425
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-prefers", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._dispatch = function _dispatch(mf, args) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____53426 = mf;
    if(cljs.core.truth_(and__3546__auto____53426)) {
      return mf.cljs$core$IMultiFn$_dispatch
    }else {
      return and__3546__auto____53426
    }
  }())) {
    return mf.cljs$core$IMultiFn$_dispatch(mf, args)
  }else {
    return function() {
      var or__3548__auto____53427 = cljs.core._dispatch[goog.typeOf.call(null, mf)];
      if(cljs.core.truth_(or__3548__auto____53427)) {
        return or__3548__auto____53427
      }else {
        var or__3548__auto____53428 = cljs.core._dispatch["_"];
        if(cljs.core.truth_(or__3548__auto____53428)) {
          return or__3548__auto____53428
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-dispatch", mf);
        }
      }
    }().call(null, mf, args)
  }
};
cljs.core.do_dispatch = function do_dispatch(mf, dispatch_fn, args) {
  var dispatch_val__53429 = cljs.core.apply.call(null, dispatch_fn, args);
  var target_fn__53430 = cljs.core._get_method.call(null, mf, dispatch_val__53429);
  if(cljs.core.truth_(target_fn__53430)) {
  }else {
    throw new Error(cljs.core.str.call(null, "No method in multimethod '", cljs.core.name, "' for dispatch value: ", dispatch_val__53429));
  }
  return cljs.core.apply.call(null, target_fn__53430, args)
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
  var this__53431 = this;
  return goog.getUid.call(null, this$)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$ = true;
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_reset = function(mf) {
  var this__53432 = this;
  cljs.core.swap_BANG_.call(null, this__53432.method_table, function(mf) {
    return cljs.core.ObjMap.fromObject([], {})
  });
  cljs.core.swap_BANG_.call(null, this__53432.method_cache, function(mf) {
    return cljs.core.ObjMap.fromObject([], {})
  });
  cljs.core.swap_BANG_.call(null, this__53432.prefer_table, function(mf) {
    return cljs.core.ObjMap.fromObject([], {})
  });
  cljs.core.swap_BANG_.call(null, this__53432.cached_hierarchy, function(mf) {
    return null
  });
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_add_method = function(mf, dispatch_val, method) {
  var this__53433 = this;
  cljs.core.swap_BANG_.call(null, this__53433.method_table, cljs.core.assoc, dispatch_val, method);
  cljs.core.reset_cache.call(null, this__53433.method_cache, this__53433.method_table, this__53433.cached_hierarchy, this__53433.hierarchy);
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_remove_method = function(mf, dispatch_val) {
  var this__53434 = this;
  cljs.core.swap_BANG_.call(null, this__53434.method_table, cljs.core.dissoc, dispatch_val);
  cljs.core.reset_cache.call(null, this__53434.method_cache, this__53434.method_table, this__53434.cached_hierarchy, this__53434.hierarchy);
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_get_method = function(mf, dispatch_val) {
  var this__53435 = this;
  if(cljs.core.truth_(cljs.core._EQ_.call(null, cljs.core.deref.call(null, this__53435.cached_hierarchy), cljs.core.deref.call(null, this__53435.hierarchy)))) {
  }else {
    cljs.core.reset_cache.call(null, this__53435.method_cache, this__53435.method_table, this__53435.cached_hierarchy, this__53435.hierarchy)
  }
  var temp__3695__auto____53436 = cljs.core.deref.call(null, this__53435.method_cache).call(null, dispatch_val);
  if(cljs.core.truth_(temp__3695__auto____53436)) {
    var target_fn__53437 = temp__3695__auto____53436;
    return target_fn__53437
  }else {
    var temp__3695__auto____53438 = cljs.core.find_and_cache_best_method.call(null, this__53435.name, dispatch_val, this__53435.hierarchy, this__53435.method_table, this__53435.prefer_table, this__53435.method_cache, this__53435.cached_hierarchy);
    if(cljs.core.truth_(temp__3695__auto____53438)) {
      var target_fn__53439 = temp__3695__auto____53438;
      return target_fn__53439
    }else {
      return cljs.core.deref.call(null, this__53435.method_table).call(null, this__53435.default_dispatch_val)
    }
  }
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_prefer_method = function(mf, dispatch_val_x, dispatch_val_y) {
  var this__53440 = this;
  if(cljs.core.truth_(cljs.core.prefers_STAR_.call(null, dispatch_val_x, dispatch_val_y, this__53440.prefer_table))) {
    throw new Error(cljs.core.str.call(null, "Preference conflict in multimethod '", this__53440.name, "': ", dispatch_val_y, " is already preferred to ", dispatch_val_x));
  }else {
  }
  cljs.core.swap_BANG_.call(null, this__53440.prefer_table, function(old) {
    return cljs.core.assoc.call(null, old, dispatch_val_x, cljs.core.conj.call(null, cljs.core.get.call(null, old, dispatch_val_x, cljs.core.set([])), dispatch_val_y))
  });
  return cljs.core.reset_cache.call(null, this__53440.method_cache, this__53440.method_table, this__53440.cached_hierarchy, this__53440.hierarchy)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_methods = function(mf) {
  var this__53441 = this;
  return cljs.core.deref.call(null, this__53441.method_table)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_prefers = function(mf) {
  var this__53442 = this;
  return cljs.core.deref.call(null, this__53442.prefer_table)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_dispatch = function(mf, args) {
  var this__53443 = this;
  return cljs.core.do_dispatch.call(null, mf, this__53443.dispatch_fn, args)
};
cljs.core.MultiFn;
cljs.core.MultiFn.prototype.call = function() {
  var G__53444__delegate = function(_, args) {
    return cljs.core._dispatch.call(null, this, args)
  };
  var G__53444 = function(_, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return G__53444__delegate.call(this, _, args)
  };
  G__53444.cljs$lang$maxFixedArity = 1;
  G__53444.cljs$lang$applyTo = function(arglist__53445) {
    var _ = cljs.core.first(arglist__53445);
    var args = cljs.core.rest(arglist__53445);
    return G__53444__delegate.call(this, _, args)
  };
  return G__53444
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
goog.provide("onedit");
goog.require("cljs.core");
goog.require("goog.dom");
goog.require("goog.events");
goog.require("goog.dom.forms");
onedit.open = function open(e) {
  return goog.dom.getElement.call(null, "file").click()
};
goog.events.listen.call(null, goog.dom.getElement.call(null, "open"), goog.events.EventType.CLICK, onedit.open);
