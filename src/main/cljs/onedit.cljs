(ns onedit
  (:require [goog.dom :as dom]
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

(def buffer (doto (goog.editor.SeamlessField. "buffer" js/document)
              (.registerPlugin (goog.editor.plugins.BasicTextFormatter.))
              (.makeEditable)))

(events/listen buffer goog.editor.Field.EventType.DELAYEDCHANGE (amap (dom/getElementsByTagNameAndClass "br") i tags (let [tag (aget tags i)]
                                                                                                                       (.info logger tag)
                                                                                                                       (dom/replace "\n" tag))))

(xhr-io/send "public/pygments.css" (fn [e]
                                     (let [css (.getResponseText e.target)]
                                       (.info logger css)
                                       (style/installStyles css (.getElement buffer)))))

(defn buffer-content []
  (dom/getTextContent (.getElement buffer)))

(def highlight-xhr
  (doto (goog.net.XhrIo.)
    (events/listen goog.net.EventType.SUCCESS (fn [e]
                                                (let [text (.getResponseText e.target)]
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
    (set! reader.onload (fn [e]
                          (let [content e.target.result]
                            (.info logger content)
                            (highlight content))))
    reader))

(defn load [file]
  (.readAsText reader file))

(events/listen (dom/getElement "open") goog.events.EventType.CLICK #(.click (dom/getElement "file")))

(events/listen (dom/getElement "file") goog.events.EventType.CHANGE (fn [e] (load (aget e.target.files 0))))

(amap (dom/getElementsByClass "lang") i languages (events/listen (aget languages i) events/EventType.CLICK (fn [e]
                                                                                                             (let [text (buffer-content)
                                                                                                                   lang (dom/getTextContent e.target)]
                                                                                                               (.info logger text)
                                                                                                               (.info logger lang)
                                                                                                               (.set goog.net.cookies "lang" lang)
                                                                                                               (highlight text)))))
