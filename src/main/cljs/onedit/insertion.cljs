(ns onedit.insertion
  (:require [onedit.core :as core]
            [onedit.cursor :as cursor]
            [onedit.util :as util]
            [goog.dom :as dom]
            [goog.dom.Range :as dom-range]
            [goog.events.KeyCodes :as keycodes]))

(defn append-br [editor]
  (let [range (dom-range/createFromWindow)
        offset (cursor/offset range)
        old-node (cursor/node range)
        br (dom/createElement dom/TagName.BR)
        [node1 node2] (map dom/createTextNode (util/split offset (dom/getRawTextContent old-node)))]
    (dom/replaceNode node1 old-node)
    (dom/insertSiblingAfter br node1)
    (dom/insertSiblingAfter node2 br)
    (cursor/select range node2 0)
    (core/mode editor)))

(def keymap
  {false {keycodes/ESC core/normal
          keycodes/ENTER append-br}
   true {}})

(deftype Mode []
  core/Mode
  (action [this editor e]
    (if-let [f ((keymap e.shiftKey) e.keyCode)]
      (do
        (.preventDefault e)
        (f editor))
      this)))
