(ns onedit
  (:require [clojure.string :as string]
            [clojure.browser.dom :as dom]
            [clojure.browser.event :as event]
            [goog.events.EventType :as gevent-type]
            [goog.editor.focus :as focus]
            [onedit.core :as core]
            [onedit.editor :as editor]))

(def history [])

(declare exec)

(defn listen [editor]
  (event/listen-once (dom/ensure-element :minibuffer) gevent-type/CHANGE (partial exec editor)))

(defn exec [editor event]
  (let [value (dom/get-value :minibuffer)
        [f & args] (string/split value #"\s+")]
    (if-let [function (aget core/editor f)]
      (let [editor' (apply function (cons (core/set-buffer editor (editor/get-buffer)) args))]
        (dom/log editor')
        (editor/update editor')
        (dom/set-value :minibuffer "")
        (listen editor'))
      (listen editor))))

(defn main []
  (listen (editor/unit))
  (focus/focusInputField (dom/ensure-element :minibuffer)))
