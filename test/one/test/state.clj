(ns one.test.state
  (:require [one.test :as test]
            [one.core.data :as data]
            [one.core.state :as state])
  (:use [clojure.test :only [is]]
        [clojure.test.generative :only [defspec]]))

(defspec state
  (fn [key] (state/exec (state/set data/current key) test/editor))
  [^keyword key]
  (is (= (state/eval (state/get data/current) %) key)))

(defspec modify
  (fn [key] (state/exec (state/set data/current key) test/editor))
  [^keyword key]
  (is (= (state/eval (state/get data/current) %) key)))
