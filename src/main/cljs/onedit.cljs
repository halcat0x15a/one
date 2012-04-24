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

(def jquery (js* "$"))

(def lexers)

(def buffer)

(defn buffer-content []
  (.text (jquery "#buffer")))

(def highlight-xhr
  (doto (goog.net.XhrIo.)
    (events/listen goog.net.EventType.SUCCESS (fn [e]
                                                (let [text (string/newLineToBr (.getResponseText e.target) true)]
                                                  (.info logger text)
                                                  (.html (jquery "#buffer") text))))
    (events/listen goog.net.EventType.ERROR (fn [e] (.info logger (.getLastError e.target))))))

(defn highlight [content]
  (let [lang (.get goog.net.cookies "lang" "plain")]
    (.info logger content)
    (.info logger lang)
    (when (.isActive highlight-xhr)
      (.abort highlight-xhr))
    (.send highlight-xhr "highlight" "POST" (uri-utils/buildQueryDataFromMap (object/create "lang" lang "content" content)))))

(def reader
  (let [reader (js/FileReader.)]
    (set! reader.onload (fn [e] (highlight e.target.result)))
    reader))

(defn load-files [files]
  (.readAsText reader (aget files 0)))

(defn buffer-blur [e]
  (highlight (buffer-content)))

(defn buffer-delayed-change [e]
  (.abort highlight-xhr))

(def form-post (goog.ui.FormPost.))

(defn save []
  (let [text (buffer-content)]
    (when-not (string/isEmpty text)
      (.post form-post (object/create "content" text) (str "save/" (.get goog.net.cookies "filename"))))))

(defn add-tab [id]
  (let [a (dom/createDom "a" (object/create "href" (str "#" id) "data-toggle" "tab") "scratch")]
    (dom/appendChild (dom/getElementByClass "nav-tabs") (dom/createDom "li" (object/create) a))
    (dom/appendChild (dom/getElementByClass "tab-content") (dom/createDom "div" (object/create "id" id "class" "tab-pane")))
    (let [buffer (goog.editor.SeamlessField. id js/document)]
      (doto buffer
        (.registerPlugin (goog.editor.plugins.BasicTextFormatter.))
        (.addEventListener goog.editor.Field.EventType.BLUR buffer-blur)
        (.addEventListener goog.editor.Field.EventType.DELAYEDCHANGE buffer-delayed-change)
        (.setHtml false (dom/getOuterHtml (dom/createDom "div" (object/create "class" "highlight") (dom/createDom "pre"))))
        (.makeEditable))
      (events/listen (goog.events.FileDropHandler. (.getElement buffer)) goog.events.FileDropHandler.EventType.DROP #(let [e (.getBrowserEvent %)]
                                                                                                                       (load-files e.dataTransfer.files)))
      (.click (jquery ".nav-tabs a:last") #(this-as me
                                                    (.alert js/window "a")
                                                    (.tab (jquery me) "show"))))))

(defn init []
  (console/autoInstall)
  (when-not (.get goog.net.cookies "filename")
    (.set goog.net.cookies "filename" "scratch"))
  (.blur (jquery "#buffer") buffer-blur)
  (xhr-io/send "lexers" (fn [e]
                          (let [json (.getResponseJson e.target)]
                            (.info logger json)
                            (set! lexers json)
                            (.typeahead (jquery "#lang") (object/create "source" (array/map json (fn [l] l.name)))))))
  (xhr-io/send "public/pygments.css" (fn [e]
                                       (let [css (.getResponseText e.target)]
                                         (.info logger css)
                                         (style/installStyles css (.getElement buffer)))))
  (events/listen (goog.events.FileDropHandler. (dom/getElement buffer)) goog.events.FileDropHandler.EventType.DROP #(let [e (.getBrowserEvent %)]
                                                                                                                   (load-files e.dataTransfer.files)))
  (.click (jquery "#open") #(.click (jquery "#file")))
  (.change (jquery "#file") (fn [e] (load-files e.target.files)))
  (.click (jquery "#save") save)
  (.change (jquery "#lang") (fn [e]
                              (let [lang (forms/getValue e.target)]
                                (if-let [aliases (array/find lexers (fn [e i a] (object/contains e lang)))]
                                  (let [alias (aget aliases "alias")]
                                    (.info logger lang)
                                    (.info logger alias)
                                    (.set goog.net.cookies "lang" alias)
                                    (highlight (buffer-content))))))))
