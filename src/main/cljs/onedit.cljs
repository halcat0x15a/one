(ns onedit
  (:require [goog.dom :as dom]
            [goog.events :as events]
            [goog.dom.forms :as forms]))

(defn open [e]
  (.click (goog.dom.getElement "file")))

(goog.events.listen (goog.dom.getElement "open") goog.events.EventType.CLICK open)
