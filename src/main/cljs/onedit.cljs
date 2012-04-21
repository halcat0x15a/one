(ns onedit
  (:require [goog.object :as object]
            [goog.array :as array]
            [goog.string :as string]
            [goog.dom :as dom]
            [goog.dom.forms :as forms]
            [goog.events :as events]
            [goog.style :as style]
            [goog.debug.Logger :as logger]
            [goog.debug.Console :as console]
            [goog.uri.utils :as uri-utils]
            [goog.net.cookies :as cookies]
            [goog.net.XhrIo :as xhr-io]
            [goog.editor.SeamlessField :as field]
            [goog.editor.plugins.BasicTextFormatter :as text-formatter]
            [goog.ui.FormPost :as form-post]
            [goog.events.FileDropHandler :as file-drop]))

(def logger (logger/getLogger "onedit"))

(def lexers)

(def buffer)

(defn buffer-content []
  (dom/getRawTextContent (.getElement buffer)))

(def highlight-xhr
  (doto (goog.net.XhrIo.)
    (events/listen goog.net.EventType.SUCCESS (fn [e]
                                                (let [text (string/newLineToBr (.getResponseText e.target) true)]
                                                  (.info logger text)
                                                  (.setHtml buffer false text))))
    (events/listen goog.net.EventType.ERROR (fn [e] (.info logger (.getLastError e.target))))))

(defn highlight [content]
  (let [lang (.get goog.net.cookies "lang" "plain")]
    (.info logger content)
    (.info logger lang)
    (when (.isActive highlight-xhr)
      (.abort highlight-xhr))
    (.send highlight-xhr "highlight" "POST" (uri-utils/buildQueryDataFromMap (object/create "language" lang "content" content)))))

(def reader
  (let [reader (js/FileReader.)]
    (set! reader.onload (fn [e] (highlight e.target.result)))
    reader))

(defn load [files]
  (.readAsText reader (aget files 0)))

(defn buffer-blur [e]
  (let [text (buffer-content)]
    (highlight text)
    (forms/setValue (dom/getElement "hidden-buffer") text)))

(defn buffer-delayed-change [e]
  (.abort highlight-xhr))

(def form-post (goog.ui.FormPost.))

(defn save []
  (let [text (buffer-content)]
    (when-not (string/isEmpty text)
      (.post form-post (object/create "content" text) (str "save/" (.get goog.net.cookies "filename"))))))

(defn init []
  (console/autoInstall)
  (when-not (.get goog.net.cookies "filename")
    (.set goog.net.cookies "filename" "scratch"))
  (set! buffer (doto (goog.editor.SeamlessField. "buffer" js/document)
                 (.registerPlugin (goog.editor.plugins.BasicTextFormatter.))
                 (.makeEditable)
                 (.setHtml false (dom/getOuterHtml (dom/createDom "div" (object/create "class" "highlight") (dom/createDom "pre"))))))
  (xhr-io/send "lexers" (fn [e]
                          (let [json (.getResponseJson e.target)]
                            (.info logger json)
                            (set! lexers json)
                            (.typeahead ((js* "$") "#lang") (object/create "source" (array/map json (fn [l] l.name)))))))
  (xhr-io/send "public/pygments.css" (fn [e]
                                       (let [css (.getResponseText e.target)]
                                         (.info logger css)
                                         (style/installStyles css (.getElement buffer)))))
  (events/listen buffer goog.editor.Field.EventType.BLUR buffer-blur)
  (events/listen buffer goog.editor.Field.EventType.DELAYEDCHANGE buffer-delayed-change)
  (events/listen (goog.events.FileDropHandler. (.getElement buffer)) goog.events.FileDropHandler.EventType.DROP #(let [e (.getBrowserEvent %)]
                                                                                                                   (load e.dataTransfer.files)))
  (events/listen (dom/getElement "open") goog.events.EventType.CLICK #(.click (dom/getElement "file")))
  (events/listen (dom/getElement "file") goog.events.EventType.CHANGE (fn [e] (load e.target.files)))
  (events/listen (dom/getElement "save") goog.events.EventType.CLICK save)
  (events/listen (dom/getElement "lang") goog.events.EventType.CHANGE (fn [e]
                                                                        (let [lang (forms/getValue e.target)
                                                                              alias (aget (array/find lexers (fn [e i a] (object/contains e lang))) "alias")]
                                                                          (.info logger lang)
                                                                          (.info logger alias)
                                                                          (.set goog.net.cookies "lang" alias)
                                                                          (highlight (buffer-content))))))
