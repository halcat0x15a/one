(ns onedit
  (:require [clojure.string :as string]
            [clojure.browser.dom :as dom]
            [goog.editor.focus :as focus]
            [onedit.editor :as editor]
            [onedit.buffer :as buffer]
            [onedit.cursor :as cursor]
            [onedit.file :as file]))

(def functions
  (merge editor/functions
         buffer/functions
         cursor/functions
         file/functions))

(defn main []
  (doto (dom/ensure-element :minibuffer)
    (editor/listen (editor/unit))
    (focus/focusInputField)))
