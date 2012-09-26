(ns one.input
  (:require [one.core :as core]
            [one.cursor :as cursor]))

(defn input-buffer [editor key]
  ((:function (:mode editor)) editor key))
