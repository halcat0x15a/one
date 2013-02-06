(ns felis.file
  (:require [felis.buffer :as buffer]
            [felis.root :as root]
            [felis.syntax :as syntax]
            [felis.syntax.clojure :as clojure]))

(def syntaxes
  {#".clj$" clojure/syntax})

(defn syntax [name]
  (let [syntaxes (filter (fn [[regex _]] (re-find regex name)) syntaxes)]
    (if (empty? syntaxes)
      syntax/default
      (-> syntaxes first second))))

(defn open [editor path string]
  (root/update (partial root/buffer
                        (assoc (buffer/read string)
                          :name path
                          :syntax (syntax path)))
                editor))
