(ns onedit.highlighter
  (:require [onedit.core :as core]
            [onedit.tab :as tab]
            [onedit.buffer :as buffer]
            [goog.object :as object]
            [goog.string :as string]))

(defn language [lang]
  (.attr (buffer/get-buffer) "class" (str "prettyprint lang-" lang))
  (js/prettyPrint))

(defn filename [name]
  (language (last (re-seq #"\." name))))

(defn highlight []
  (let [tab (tab/get-tab)]
    (if-let [lang (.data (tab/get-tab) "language")]
      (language lang)
      (filename (.text (tab/get-tab))))))
