(ns one.test.buffers
  (:require [one.test :as test]
            [one.core.data :as data]
            [one.core.lens :as lens]
            [one.core.state :as state]
            [one.core.buffers :as buffers])
  (:use [clojure.test :only [are]]
        [clojure.test.generative :only [defspec]]))
(comment
(defspec create-buffer
  (fn [editor id] (state/run (buffers/create-buffer id) editor))
  [^test/editorx editor ^keyword id]
  (test/state-is data/current (id editor) %))
)