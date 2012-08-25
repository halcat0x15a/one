(ns onedit
  (:require [clojure.string :as string]
            [clojure.browser.dom :as dom]
            [clojure.browser.event :as event]
            [goog.events.EventType :as gevents-type]
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
    (event/listen gevents-type/CHANGE editor/exec)
    (focus/focusInputField)))

(main)
