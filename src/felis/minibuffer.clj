(ns felis.minibuffer
  (:require [felis.text :as text]
            [felis.node :as node]
            [felis.default :as default]))

(defn render [text]
  (node/tag :pre {:class :minibuffer}
            (text/focus text)))

(defrecord Minibuffer [text commands]
  node/Node
  (render [_] (render text)))

(def path [:root :minibuffer])

(def text (conj path :text))

(def commands (conj path :commands))

(def default (Minibuffer. text/default {}))

(defmethod node/path Minibuffer [_] path)

(defmethod default/default Minibuffer [_] default)
