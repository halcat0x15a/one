(ns one.input
  (:require [one.core :as core]
            [one.cursor :as cursor]))

(defrecord Input [key])

(defn input-buffer [editor input]
  ((:function (:mode editor)) (:key input)))
