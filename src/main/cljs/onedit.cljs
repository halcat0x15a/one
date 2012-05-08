(ns onedit
  (:require [onedit.core :as core]
            [onedit.language :as language]
            [onedit.file :as file]
            [goog.debug.Console :as console]))

(defn init []
  (console/autoInstall)
  (file/create "scratch")
  (language/lexers)
  (file/listen))
