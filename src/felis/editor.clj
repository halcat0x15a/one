(ns felis.editor
  (:refer-clojure :exclude [char]))

(defprotocol Editor
  (keymap [this])
  (input [this char]))

(defprotocol KeyCode
  (code [this event]))

(defn run [editor keycode event]
  (let [key (code keycode event)]
    (if-let [update ((keymap editor) key)]
      (update editor)
      (input editor key))))
