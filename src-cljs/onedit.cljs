(ns onedit
  (:require [clojure.string :as string]
            [clojure.browser.dom :as dom]
            [clojure.browser.event :as event]
            [goog.events.EventType :as gevent-type]
            [goog.editor.focus :as focus]
            [onedit.core :as core]
            [onedit.editor :as editor]
            [onedit.buffer :as buffer]
            [onedit.cursor :as cursor]))

(def functions
  (merge editor/functions
         buffer/functions
         cursor/functions))

(declare exec)

(defn listen [minibuffer editor]
  (event/listen-once minibuffer gevent-type/CHANGE (partial exec editor)))

(defn exec [editor event]
  (let [minibuffer (dom/ensure-element :minibuffer)
        value (dom/get-value minibuffer)
        [f & args] (string/split value #"\s+")]
    (if-let [function ((keyword f) functions)]
      (let [editor' (apply function (cons (core/set-buffer editor (editor/get-buffer)) args))]
        (dom/log editor')
        (editor/update editor')
        (dom/set-value :minibuffer "")
        (listen minibuffer editor'))
      (listen minibuffer editor))))

(defn main []
  (doto (dom/ensure-element :minibuffer)
    (listen (editor/unit))
    (focus/focusInputField)))
