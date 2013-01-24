(ns felis.editor)

(defprotocol Editor
  (keymap [this])
  (input [this char]))

(defprotocol KeyCode
  (special [this])
  (char [this event]))

(defn run [editor keycode event]
  (let [key (get (special keycode) event (char keycode event))]
    (if-let [update ((keymap editor) key)]
      (update editor)
      (input editor key))))
