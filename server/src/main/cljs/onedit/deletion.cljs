(ns onedit.deletion
  (:require [onedit.core :as core]
            [onedit.cursor :as cursor]
            [goog.dom :as dom]
            [goog.events.KeyCodes :as keycodes]))

(defn delete-character [editor]
  (let [range (cursor/create)
        offset (.getStartOffset range)
        node (.getStartNode range)
        [s1 s2] (split-at offset (dom/getRawTextContent node))
        new-node (dom/createTextNode (str (apply str s1) (apply str (subs (apply str s2) 1))))]
    (dom/replaceNode new-node node)
    (cursor/move-to-node editor new-node offset)
    editor.mode))


(defn delete-rest [editor]
  (let [range (cursor/create)
        offset (.getStartOffset range)
        node (.getStartNode range)
        new-node (dom/createTextNode (subs (dom/getRawTextContent node) 0 offset))]
    (dom/replaceNode new-node node)
    (cursor/move-to-node editor new-node offset)
    editor.mode))

(defn delete-line [editor]
  (let [range (cursor/create)
        node (.getStartNode range)
        offset (.getStartOffset range)
        prev (dom/getPreviousNode node)]
    (dom/removeNode node)
    (dom/removeNode (dom/getNextNode node))
    (cursor/move-to-node editor prev offset)
    (core/normal editor)))

(def keymap
  {false {keycodes/D delete-line}
   true {}})

(deftype Mode []
  core/Mode
  (action [this editor e]
    (.preventDefault e)
    (if-let [f ((keymap e.shiftKey) e.keyCode)]
      (f editor)
      this)))
