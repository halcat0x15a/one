(ns felis.minibuffer
  (:refer-clojure :exclude [empty])
;*CLJSBUILD-REMOVE*;(:use-macros [felis.macros :only (tag)])
  (:require [felis.macros :as macros]
            [felis.text :as text]
            [felis.node :as node]
            [felis.empty :as empty]
            [felis.serialization :as serialization]))

;*CLJSBUILD-REMOVE*;(comment
(use '[felis.macros :only (tag)])
;*CLJSBUILD-REMOVE*;)

(defn render [text]
  (tag :div {:class "minibuffer"}
       (text/inside text)))

(defrecord Minibuffer [text commands]
  node/Node
  (render [_] (render text)))

(def path [:root :minibuffer])

(def text (conj path :text))

(def commands (conj path :commands))

(def empty (Minibuffer. text/empty {}))

(defmethod node/path Minibuffer [_] path)

(defmethod empty/empty Minibuffer [_] empty)
