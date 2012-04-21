(ns onedit
  (:require [goog.dom :as dom]
            [goog.dom.forms :as forms]
            [goog.object :as object]
            [goog.array :as array]
            [goog.string :as string]
            [goog.style :as style]
            [goog.events :as events]
            [goog.debug.Logger :as logger]
            [goog.debug.Console :as console]
            [goog.net.cookies :as cookies]
            [goog.net.XhrIo :as xhr-io]
            [goog.Uri :as uri]
            [goog.editor.SeamlessField :as field]
            [goog.editor.plugins.BasicTextFormatter :as text-formatter]))

(def logger (logger/getLogger "onedit"))

(console/autoInstall)

(def lexers)

(xhr-io/send "lexers" (fn [e]
                        (let [json (.getResponseJson e.target)]
                          (.info logger json)
                          (set! lexers json))))

(def buffer (doto (goog.editor.SeamlessField. "buffer" js/document)
              (.registerPlugin (goog.editor.plugins.BasicTextFormatter.))
              (.makeEditable)))

(xhr-io/send "public/pygments.css" (fn [e]
                                     (let [css (.getResponseText e.target)]
                                       (.info logger css)
                                       (style/installStyles css (.getElement buffer)))))

(defn buffer-content []
  (dom/getRawTextContent (.getElement buffer)))

(def highlight-xhr
  (doto (goog.net.XhrIo.)
    (events/listen goog.net.EventType.SUCCESS (fn [e]
                                                (let [text (string/newLineToBr (.getResponseText e.target) true)]
                                                  (.info logger text)
                                                  (.setHtml buffer (dom/getElement "buffer") text))))
    (events/listen goog.net.EventType.ERROR (fn [e] (.info logger (.getLastError e.target))))))

(defn highlight [content]
  (let [lang (.get goog.net.cookies "lang" "plain")
        uri (.. (uri/parse "highlight") (setParameterValue "language" lang) (setParameterValue "content" content))]
    (.info logger content)
    (.info logger lang)
    (.info logger uri)
    (.send highlight-xhr uri "POST")))

(events/listen buffer goog.editor.Field.EventType.BLUR #(highlight (buffer-content)))

(def reader
  (let [reader (js/FileReader.)]
    (set! reader.onload (fn [e] (highlight e.target.result)))
    reader))

(defn load [file]
  (.readAsText reader file))

(events/listen (dom/getElement "open") goog.events.EventType.CLICK #(.click (dom/getElement "file")))

(events/listen (dom/getElement "file") goog.events.EventType.CHANGE (fn [e] (load (aget e.target.files 0))))

(events/listen (dom/getElement "lang") goog.events.EventType.CHANGE (fn [e]
                                                                      (let [lang (forms/getValue e.target)
                                                                            alias (aget (array/find lexers (fn [e i a] (object/contains e lang))) "alias")]
                                                                        (.info logger lang)
                                                                        (.info logger alias)
                                                                        (.set goog.net.cookies "lang" alias)
                                                                        (highlight (buffer-content)))))
