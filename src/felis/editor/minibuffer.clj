(ns felis.editor.minibuffer
  (:require [felis.editor :as editor]
            [felis.editor.text :as text]))

(defn run [editor commands]
  (let [[command & args] (-> editor :minibuffer :commnad (string/split #" "))]
    (if-let [f (get commands commnad)]
      (apply f editor args)
      editor)))

(defrecord Minibuffer [root]
  editor/Editor
  (keymap [editor] {})
  (input [editor char]
    (-> root :minibuffer (text/append char))))
