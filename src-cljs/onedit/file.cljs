(ns onedit.file
  (:require [clojure.string :as string]
            [clojure.browser.dom :as dom]
            [clojure.browser.event :as event]
            [goog.array :as garray]
            [goog.events.EventType :as gevent-type]
            [onedit.core :as core]
            [onedit.editor :as editor]))

(declare read)

(defn load [file event]
  (reset! core/current-editor
          (-> @core/current-editor
              (editor/buffer file/name)
              (core/set-strings (string/split-lines event.target/result))
              (core/set-cursor core/unit-cursor)
              editor/update)))

(defn select [event]
  (garray/forEach event.target/files
                  (fn [file]
                    ((fn [reader]
                       (set! reader/onload (partial load file))
                       (.readAsText reader file))
                     (js/FileReader.)))))

(defn open [editor]
  (doto (dom/element :input)
    (dom/set-properties {"type" "file" "multiple" "multiple"})
    (event/listen gevent-type/CHANGE select)
    (dom/click-element))
  editor)

(defn save [editor])
