(ns onedit.vi
  (:require [onedit.core :as core]
            [onedit.vi.core :as vi-core]
            [onedit.vi.insert :as insert]
            [goog.dom.selection :as selection]))

(def insert-code 105)

(def escape-code 27)

(def command-code 58)

(def j 106)

(def k 107)

(def l 108)

(defn escape []
  (set! vi-core/mode nil)
  (core/set-text-mini ""))

(defn keypress [e]
  (let [code e.charCode
        buffer (core/buffer)]
    (when-not (= vi-core/mode "insert")
      (.preventDefault e))
    (condp = code
      insert-code (insert/insert)
      l (do
          (core/log (selection/getEnd buffer))
          (selection/setStart buffer (inc (selection/getStart buffer))))
      escape-code (escape)
      command-code nil
      nil)
    (.info core/logger code)))
