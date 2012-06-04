(ns onedit.core
  (:require [goog.debug.Logger :as debug-logger]))

(def logger (debug-logger/getLogger "onedit"))

(def log #(.info logger %))

(def local js/window.localStorage)

(deftype Editor [mode buffer minibuffer])

(defn default-mode [editor]
  (reset! editor.mode :default))

(defn insert-mode [editor]
  (reset! editor.mode :insert))
