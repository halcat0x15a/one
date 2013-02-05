(ns felis.text
  (:refer-clojure :exclude [peek pop conj read empty])
;*CLJSBUILD-REMOVE*;(:use-macros [felis.macros :only (tag)])
  (:require [clojure.core :as core]
            [felis.string :as string]
            [felis.collection :as collection]
            [felis.edit :as edit]
            [felis.node :as node]
            [felis.serialization :as serialization]
            [felis.empty :as empty]))

;*CLJSBUILD-REMOVE*;(comment
(use '[felis.macros :only (tag)])
;*CLJSBUILD-REMOVE*;)

(defmulti peek (fn [feild string] feild))
(defmethod peek :rights [_ string] (first string))
(defmethod peek :lefts [_ string] (last string))

(defmulti pop (fn [feild string] feild))
(defmethod pop :rights [_ string] (string/rest string))
(defmethod pop :lefts [_ string] (string/butlast string))

(defmulti conj (fn [char feild string] feild))
(defmethod conj :rights [char _ string] (str char string))
(defmethod conj :lefts [char _ string] (str string char))

(defn update [text field f]
  (update-in text [field] (partial f field)))

(defn move [text field]
  (if-let [char (->> text field (peek field))]
    (-> text
        (update field pop)
        (update (edit/opposite field) (partial conj char)))
    text))

(defn insert [text field char]
  (update text field (partial conj char)))

(defn delete [text field]
  (update text field pop))

(defn write [{:keys [lefts rights]}]
  (str lefts rights))

(defrecord Text [lefts rights]
  edit/Edit
  (move [text field] (move text field))
  (insert [text field char] (insert text field char))
  (delete [text field] (delete text field))
  serialization/Serializable
  (write [text] (write text)))

(def path [:root :buffer :focus])

(def lefts (core/conj path edit/lefts))

(def rights (core/conj path edit/rights))

(def empty (Text. "" ""))

(defn read [string] (Text. "" string))

(defmethod node/path Text [_] path)

(defmethod empty/empty Text [_] empty)

(defmethod serialization/read Text [_ string] (read string))

(defn inside [{:keys [lefts rights]}]
  (let [lefts (string/nbsp lefts)
        rights (string/nbsp rights)]
    (str lefts
         (tag :span {:class :focus}
              (get rights 0 ""))
         (string/rest rights))))

(def outside (comp string/nbsp serialization/write))
