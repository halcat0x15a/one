(ns onedit
  (:require [clojure.string :as string]
            [clojure.browser.dom :as dom]
            [clojure.browser.event :as event]
            [goog.events.EventType :as event-type]))

(defrecord Editor [buffer cursor])

(defn open [file]
  (let [reader (js/FileReader.)]
    (.readAsText reader file)))

(defn save [])

(defn insert [string editor]
  (let [buffer (string/join (split-at (:cursor editor) (:buffer editor)))]
    (assoc editor :buffer buffer)))

(def functions [insert])

(defn function-map []
  functions)

(defn exec [buffer minibuffer event]
  (let [value (dom/get-value minibuffer)
        [f & args] (string/split value #" ")]
    (dom/log f)
    (dom/log args)
    (dom/set-text buffer "")))

(defn main []
  (let [buffer (dom/get-element "buffer")
        minibuffer (dom/get-element "minibuffer")]
    (event/listen minibuffer event-type/CHANGE (partial exec buffer minibuffer))))
