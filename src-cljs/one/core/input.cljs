(ns one.core.input
  (:require [one.core :as core]
            [one.core.cursor :as cursor]))

(defn input-buffer [editor key]
  ((:function (:mode editor)) editor key))
