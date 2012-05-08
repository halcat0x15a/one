(ns onedit.highlight
  (:require [onedit.core :as core]
            [onedit.tab :as tab]
            [onedit.buffer :as buffer]
            [goog.object :as object]
            [goog.string :as string]))

(defn call [content callback key value]
  (when-not (empty? content)
    (let [url (str "highlight/" key \/ value)]
      (core/log content)
      (core/log url)
      (.post core/jquery url (object/create "content" content) #(callback (string/newLineToBr % true)) "text"))))

(defn lang-or-name []
  (if-let [lang (tab/data "language")]
    ["language" lang]
    (if-let [name (tab/data "filename")]
      ["filename" name])))

(defn buffer []
  (let [[key value] (lang-or-name)]
    (call (buffer/content) buffer/set-html key value)))
