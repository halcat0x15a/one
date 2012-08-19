(ns onedit.file
  (:require [clojure.string :as string]
            [clojure.browser.dom :as dom]
            [clojure.browser.event :as event]
            [goog.array :as garray]
            [goog.events.EventType :as gevent-type]
            [onedit.core :as core]
            [onedit.editor :as editor])
  (:use-macros [onedit.core :only [fn-map]]))

(declare read)

(defn load [editor files n event]
  (let [file (aget files n)
        editor' (-> editor
                    (editor/buffer (aget file "name"))
                    (core/set-strings (string/split-lines event.target/result))
                    (core/set-cursor core/unit-cursor)
                    editor/update)
        n' (inc n)]
    (when (< n' files/length)
      (read editor' files n'))))

(defn read [editor files n]
  ((fn [reader]
     (set! reader/onload (partial load editor files n))
     (.readAsText reader (aget files n)))
   (js/FileReader.)))

(defn select [editor event]
  (read editor event.target/files 0))

(defn open [editor]
  (doto (dom/element :input)
    (dom/set-properties {"type" "file" "multiple" "multiple"})
    (event/listen gevent-type/CHANGE (partial select editor))
    (dom/click-element))
  editor)

(defn save [editor])

(def functions
  (fn-map open))