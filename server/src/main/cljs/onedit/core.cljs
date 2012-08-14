(ns onedit.core
  (:require [goog.dom :as dom]
            [goog.debug.Logger :as debug-logger]))

(def logger (debug-logger/getLogger "onedit"))

(def log #(.info logger %))

(def local js/window.localStorage)

(defprotocol Mode
  (action [mode editor e]))

(defprotocol IEditor
  (mode [this])
  (buffer [this])
  (minibuffer [this])
  (key-handler [this])
  (normal [this])
  (cursor [this]))
