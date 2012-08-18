(ns onedit.file
  (:require [clojure.string :as string]
            [clojure.browser.dom :as dom]
            [clojure.browser.event :as event]
            [goog.events.EventType :as gevent-type]
            [onedit.core :as core]
            [onedit.cursor :as cursor])
  (:use-macros [onedit.core :only [defun]]))

(defn load [editor event]
  (editor/update (assoc editor
                   :buffer (string/split-lines (aget (aget event "target") "result"))
                   :cursor cursor/unit)))

(defn select [editor event]
  (doto (js/FileReader.)
    (aset "onload" (partial load editor))
    (.readAsText (aget (aget (aget event "target") "files") 0))))

(defun open [editor]
  (doto (dom/element :input)
    (dom/set-properties {"type" "file"})
    (event/listen gevent-type/CHANGE (partial select editor))
    (dom/click-element))
  editor)

(defn save [editor])
