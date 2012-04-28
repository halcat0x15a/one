(ns onedit.core
  (:require [goog.dom :as dom]
            [goog.debug.Logger :as logger]))

(def logger (logger/getLogger "onedit"))

(def jquery (js* "$"))

(def log #(.info logger %))

(def buffer-array #(jquery ".active pre"))

(def buffer #(aget (buffer-array) 0))

(def buffer-content (comp dom/getRawTextContent buffer))
