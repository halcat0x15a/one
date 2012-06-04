(ns onedit.core
  (:require [goog.debug.Logger :as debug-logger]))

(def logger (debug-logger/getLogger "onedit"))

(def log #(.info logger %))

(def local js/window.localStorage)

(deftype Editor [mode buffer minibuffer])

(defn change-mode [mode editor]
  (reset! editor.mode mode))

(def default-mode (partial change-mode :default))

(def insert-mode (partial change-mode :insert))
