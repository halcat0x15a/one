(ns onedit.core
  (:require [goog.debug.Logger :as debug-logger]))

(def logger (debug-logger/getLogger "onedit"))

(def log #(.info logger %))

(def local js/window.localStorage)
