(ns onedit.core
  (:require [goog.dom :as dom]
            [goog.debug.Logger :as logger]))

(def logger (logger/getLogger "onedit"))

(def jquery (js* "$"))

(def log #(.info logger %))

(def tab-pane #(jquery "div.active"))

(def buffer-array #(jquery ".active pre"))

(def buffer #(aget (buffer-array) 0))

(def buffer-content (comp dom/getRawTextContent buffer))

(defn unique [f]
  (.getJSON jquery "unique" #(f (aget % "id"))))
