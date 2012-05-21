(ns onedit.vi.insert
  (:require [onedit.core :as core]
            [onedit.vi.core :as vi-core]))

(defn insert []
  (set! vi-core/mode "insert")
  (core/set-text-mini "Insert Mode"))
