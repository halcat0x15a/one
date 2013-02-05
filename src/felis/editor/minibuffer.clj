(ns felis.editor.minibuffer
  (:refer-clojure :exclude [next])
  (:require [clojure.string :as string]
            [felis.key :as key]
            [felis.minibuffer :as minibuffer]
            [felis.editor :as editor]
            [felis.editor.edit :as edit]
            [felis.serialization :as serialization]))

(defn run [editor]
  (let [[command & args] (-> editor (get-in minibuffer/text) serialization/write (string/split #" "))]
    (if-let [f (-> editor (get-in minibuffer/commands) (get command))]
      (apply f editor args)
      editor)))

(defn update [f editor]
  (update-in editor minibuffer/text f))

(def prev (partial update edit/prev))

(def next (partial update edit/next))

(defn append [editor char]
  (update (partial edit/append char) editor))

(def backspace (partial update edit/backspace))

(defn command [editor key f]
  (update-in editor minibuffer/commands #(assoc % key f)))

(def keymap
  {key/enter run
   key/backspace backspace
   key/left prev
   key/right next})

(defrecord Minibuffer [root]
  editor/Editor
  (keymap [editor] keymap)
  (input [editor char] (append editor char)))
