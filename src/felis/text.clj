(ns felis.text
  (:refer-clojure :exclude [peek pop conj update-in read])
  (:require [clojure.core :as core]
            [felis.string :as string]
            [felis.collection :as collection]
            [felis.edit :as edit]
            [felis.node :as node]
            [felis.serialization :as serialization]
            [felis.default :as default]))

(defmulti peek (fn [feild string] feild))
(defmethod peek :rights [_ string] (first string))
(defmethod peek :lefts [_ string] (last string))

(defmulti pop (fn [feild string] feild))
(defmethod pop :rights [_ string] (string/rest string))
(defmethod pop :lefts [_ string] (string/butlast string))

(defmulti conj (fn [char feild string] feild))
(defmethod conj :rights [char _ string] (str char string))
(defmethod conj :lefts [char _ string] (str string char))

(defn update-in [text field f]
  (core/update-in text [field] (partial f field)))

(defn move [text field]
  (if-let [char (->> text field (peek field))]
    (-> text
        (update-in field pop)
        (update-in (edit/opposite field) (partial conj char)))
    text))

(defn insert [text field char]
  (update-in text field (partial conj char)))

(defn delete [text field]
  (update-in text field pop))

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

(defn update [update editor]
  (core/update-in editor path update))

(def lefts (core/conj path edit/lefts))

(def rights (core/conj path edit/rights))

(def default (Text. "" ""))

(defn read [string] (Text. "" string))

(defmethod node/path Text [_] path)

(defmethod default/default Text [_] default)

(defmethod serialization/read Text [_ string] (read string))

(defn focus [{:keys [lefts rights]}]
  (str lefts "\u20DE" rights))
