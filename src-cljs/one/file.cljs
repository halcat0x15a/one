(ns one.file
  (:require [clojure.string :as string]
            [clojure.browser.dom :as dom]
            [clojure.browser.event :as event]
            [goog.events.EventType :as gevent-type]
            [one.core :as core]
            [one.editor :as editor]
            [one.system :as system]))

(defn load [file event]
  (reset! core/current-editor
          (-> @core/current-editor
              (editor/buffer (.-name file))
              (core/set-strings (string/split-lines (-> event .-target .-result)))
              (core/set-cursor core/unit-cursor)
              system/update)))

(defn select [event]
  (doseq [file (-> event .-target .-files)]
    (let [reader (js/FileReader.)]
       (set! (.-onload reader) (partial load file))
       (.readAsText reader file))))

(defn open [editor]
  (doto (dom/element :input)
    (dom/set-properties {"type" "file" "multiple" "multiple"})
    (event/listen gevent-type/CHANGE select)
    (dom/click-element))
  editor)

(defn save [editor])
