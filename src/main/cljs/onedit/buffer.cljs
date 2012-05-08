(ns onedit.buffer
  (:require [onedit.core :as core]
            [onedit.tab :as tab]
            [goog.dom :as dom]))

(defn get-buffer []
  (core/jquery ".tab-content .active pre"))

(defn element []
  (aget (get-buffer) 0))

(def set-html #(.html (get-buffer) %))

(def content (comp dom/getRawTextContent element))
