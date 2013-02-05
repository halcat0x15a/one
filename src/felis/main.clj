(ns felis.main
  (:require [felis.key :as key]
            [felis.editor :as editor]
            [felis.editor.normal :as normal]))

(def global
  {key/escape normal/map->Normal})

(defn run [editor keycode event]
  (let [key (editor/code keycode event)]
    (if-let [update (get (merge global (editor/keymap editor)) key)]
      (update editor)
      (editor/input editor key))))
