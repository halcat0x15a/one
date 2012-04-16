(ns onedit
  (:require [goog.dom :as dom]
            [goog.events :as events]
            [goog.debug.Logger :as logger]
            [goog.debug.Console :as console]))

(def logger (logger/getLogger "onedit"))

(console/autoInstall)

(def reader
  (let [reader (goog.global.FileReader.)]
    (set! reader.onload (fn [e]
                          (.info logger e.target.result)
                          (dom/setTextContent (dom/getElement "buffer") e.target.result)))
    reader))

(defn load [file]
  (.readAsText reader file))

(events/listen (dom/getElement "open") goog.events.EventType.CLICK #(.click (dom/getElement "file")))

(events/listen (dom/getElement "file") goog.events.EventType.CHANGE (fn [e] (load (aget e.target.files 0))))
