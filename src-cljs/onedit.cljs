(ns onedit
  (:require [clojure.string :as string]
            [clojure.browser.dom :as dom]
            [clojure.browser.event :as event]
            [goog.events.EventType :as gevent-type]
            [goog.editor.focus :as focus]
            [onedit.core :as core]
            [onedit.editor :as editor]))

(defn exec [event]
  (let [value (dom/get-value :minibuffer)
        [f & args] (string/split value #"\s+")]
    (if-let [function (aget core/editor f)]
      (let [editor' (apply function (cons (editor/create) args))]
        (editor/update editor')
        (dom/set-value :minibuffer "")))))

(defn main []
  (doto (dom/ensure-element :minibuffer)
    (event/listen gevent-type/CHANGE exec)
    (focus/focusInputField)))
