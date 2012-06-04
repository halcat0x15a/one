(ns onedit.deletion
  (:require [onedit.core :as core]
            [onedit.cursor :as cursor]
            [goog.dom :as dom]))

(defn delete-character [editor]
  (let [range (cursor/create)
        offset (.getStartOffset range)
        node (.getStartNode range)
        [s1 s2] (split-at offset (dom/getRawTextContent node))
        new-node (dom/createTextNode (str (apply str s1) (apply str (subs (apply str s2) 1))))]
    (core/log s1)
    (core/log s2)
    (dom/replaceNode new-node node)
    (cursor/move-n editor new-node offset)))
