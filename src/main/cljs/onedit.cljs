(ns onedit
  (:require [goog.dom :as dom]
            [goog.events :as events]))

(defn open [e]
  (.click (goog.dom.getElement "file")))

(defn upload [e]
  (.click (goog.dom.getElement "uploading")))

(defn uploaded [e]
  (goog.dom.setTextContent (goog.dom.getElement "buffer") (-> "uploading-target" goog.dom.getElement goog.dom.getFrameContentDocument goog.dom.getTextContent)))

(goog.events.listen (goog.dom.getElement "open") goog.events.EventType.CLICK open)
(goog.events.listen (goog.dom.getElement "file") goog.events.EventType.CHANGE upload)
(goog.events.listen (goog.dom.getElement "uploading-target") goog.events.EventType.LOAD uploaded)
