(ns onedit
  (:require [clojure.string :as string]
            [clojure.browser.dom :as dom]
            [clojure.browser.event :as event]
            [goog.events.EventType :as gevent-type]
            [onedit.core :as core]
            [onedit.buffer :as buffer]
            [onedit.cursor :as cursor]))

(defrecord Editor [buffer cursor])

(defn editor []
  (Editor. (buffer/value) (cursor/value)))

(defn exec [event]
  (let [value (dom/get-value :minibuffer)
        [f & args] (string/split value #"\s+")]
    (if-let [function (aget core/editor f)]
      (let [editor (apply function (cons (editor) args))]
        (buffer/update (:buffer editor))
        (cursor/update (:cursor editor))
        (dom/set-value :minibuffer "")))))

(defn main []
  (let [buffer (dom/ensure-element :buffer)
        minibuffer (dom/ensure-element :minibuffer)]
    (event/listen minibuffer gevent-type/CHANGE exec)))
