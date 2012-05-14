(ns onedit
  (:require [onedit.core :as core]
            [onedit.file :as file]
            [goog.debug.Console :as console]))

(defn init []
  (console/autoInstall)
  (file/create "scratch")
  (file/listen))
