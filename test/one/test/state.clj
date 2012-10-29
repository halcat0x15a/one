(ns one.test.state
  (:require [one.test :as test]
            [one.core.data :as data]
            [one.core.state :as state])
  (:use [clojure.test :only [is]]
        [clojure.test.generative :only [defspec]]))

(defspec state
  (fn [editor key] (state/exec (state/set data/current key) editor))
  [^test/editor editor ^keyword key]
  (is (= (state/eval (state/get data/current) %) key)))

(defspec modify
  (fn [editor key] (state/exec (state/set data/current key) editor))
  [^test/editor editor ^keyword key]
  (is (= (state/eval (state/get data/current) %) key)))
