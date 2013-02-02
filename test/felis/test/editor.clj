(ns felis.test.editor
  (:require [clojure.test :refer :all]
            [felis.editor :as editor]))

(def keycode
  (reify editor/KeyCode
    (code [this event] event)))

(defprotocol Input
  (input [this editor]))

(extend-protocol Input
  java.lang.String
  (input [this editor]
    (if-let [char (first this)]
      (->> editor
           (input char)
           (input (subs this 1)))
      editor))
  java.lang.Character
  (input [this editor]
    (editor/run editor keycode this))
  clojure.lang.Keyword
  (input [this editor]
    (editor/run editor keycode this)))

(defn emulate [editor x & xs]
  (reduce (fn [editor x] (input x editor)) editor (cons x xs)))
