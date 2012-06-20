(ns onedit.replacement
  (:require [onedit.core :as core]
            [onedit.deletion :as deletion]))

(deftype Mode [editor]
  core/Mode
  (action [this editor e]
    (deletion/delete-character editor)
    (core/normal editor)))
