(ns onedit.language
  (:require [onedit.core :as core]
            [onedit.tab :as tab]
            [onedit.highlight :as highlight]
            [goog.object :as object]
            [goog.array :as array]
            [goog.dom.forms :as forms]))

(defn change [e lexers]
  (let [lang (forms/getValue e.target)]
    (if-let [aliases (array/find lexers #(object/contains % lang))]
      (let [alias (aget aliases "alias")]
        (.data (tab/get-tab) "language" alias)
        (highlight/buffer)))))

(defn listen [lexers]
  (doto (core/jquery "#lang")
    (.change #(change % lexers))
    (.typeahead (object/create "source" (array/map lexers (fn [lang] lang.name))))))

(defn lexers []
  (.getJSON core/jquery "lexers" listen))
