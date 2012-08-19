(ns onedit.file
  (:require [clojure.string :as string]
            [clojure.browser.dom :as dom]
            [clojure.browser.event :as event]
            [goog.array :as garray]
            [goog.events.EventType :as gevent-type]
            [onedit.core :as core]
            [onedit.editor :as editor])
  (:use-macros [onedit.core :only [fn-map]]))

(defn load [editor file event]
  (-> editor
      (editor/buffer file/name)
      (core/set-strings (string/split-lines event.target/result))
      (core/set-cursor core/unit-cursor)
      editor/update))

(defn read [editor file]
  ((fn [reader]
     (set! reader/onload (partial load editor file))
     (.readAsText reader file))
   (js/FileReader.)))

(defn select [editor event]
  (garray/forEach event.target/files (partial read editor)))

(defn open [editor]
  (doto (dom/element :input)
    (dom/set-properties {"type" "file"})
    (event/listen gevent-type/CHANGE (partial select editor))
    (dom/click-element))
  editor)

(defn save [editor])

(def functions
  (fn-map open))